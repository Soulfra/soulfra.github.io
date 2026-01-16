// Memory Routes - Connects reflection → vault → context snapshot
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class MemoryRoutes {
    constructor() {
        // Obfuscated vault paths
        this.vaultMemoryPath = path.join(__dirname, '../../../vault/memory');
        this.conversationLogsPath = path.join(__dirname, '../../../vault/conversations');
        this.domainKnowledgePath = path.join(this.vaultMemoryPath, 'domain-knowledge.json');
        this.founderSeedPath = path.join(this.vaultMemoryPath, 'seed');
        this.reflectionIndexPath = path.join(__dirname, '../../../scraper-reflector/reflection-index.json');
        
        // Memory caches
        this.memoryCache = new Map();
        this.accessPatterns = new Map();
        this.relevanceScores = new Map();
        
        this.init();
    }

    async init() {
        console.log('🧠 Initializing Memory Routes...');
        await this.loadMemorySources();
        await this.buildMemoryIndex();
    }

    async loadMemorySources() {
        // Load all memory sources into cache
        try {
            await this.loadFounderSeed();
            await this.loadDomainKnowledge();
            await this.loadConversationHistory();
            await this.loadReflectionIndex();
        } catch (error) {
            console.log('⚠️ Memory sources not fully available:', error.message);
        }
    }

    async loadFounderSeed() {
        const seedSources = [
            'matt-chat-logs.txt',
            'startup-notes.md', 
            'tone-reflections.md',
            'failed-launches.md'
        ];

        for (const source of seedSources) {
            try {
                const content = await fs.readFile(path.join(this.founderSeedPath, source), 'utf8');
                this.memoryCache.set(`seed:${source}`, {
                    content: content,
                    type: 'foundational',
                    weight: 0.9,
                    lastAccessed: Date.now(),
                    source: 'founder_seed'
                });
            } catch {
                // Create placeholder if missing
                this.memoryCache.set(`seed:${source}`, {
                    content: this.generatePlaceholderSeed(source),
                    type: 'foundational',
                    weight: 0.7,
                    lastAccessed: Date.now(),
                    source: 'placeholder'
                });
            }
        }
    }

    generatePlaceholderSeed(source) {
        const placeholders = {
            'matt-chat-logs.txt': `[Founder Chat Logs]
User: How do I know if this startup idea is worth pursuing?
Matt: That's the question that keeps every founder up at night. I've been there - sitting with an idea that feels important but wondering if it's just wishful thinking...

User: I'm struggling with the technical implementation
Matt: Technical challenges are just puzzles waiting to be solved. What specific part is blocking you? Sometimes the breakthrough comes from stepping back and asking if we're solving the right problem...

User: This is taking longer than expected
Matt: Everything in startups takes 3x longer than you think, even when you account for it taking 3x longer. The real question is: are you learning faster than you're burning out?`,

            'startup-notes.md': `# Startup Lessons - Hard Won

## On Learning
- The best insights come from failing forward, not from avoiding failure
- Most "breakthrough" moments happen during quiet reflection, not frantic work
- Teaching others what you've learned solidifies your own understanding

## On Building
- Users don't want your solution, they want their problem solved
- Technical perfection is the enemy of user feedback
- The product you launch is never the product you end up with

## On Persistence
- Giving up and pivoting are different things
- Sometimes the breakthrough is one conversation away
- The hardest part isn't building, it's deciding what not to build`,

            'tone-reflections.md': `# How I Communicate

## Core Principles
- Questions are more powerful than answers
- Uncertainty is honest, certainty is often arrogant
- Everyone's learning journey is unique and valid
- The best help meets people where they are

## When Someone is Struggling
- Don't immediately offer solutions
- Ask what they've already tried
- Help them see their own progress
- Sometimes just witnessing the struggle is enough

## When Someone is Excited
- Match their energy but stay grounded
- Help them think through next steps
- Celebrate the wins, no matter how small
- Channel excitement into actionable momentum`,

            'failed-launches.md': `# What I've Learned from Things That Didn't Work

## TestPrep App v1
- Built for 6 months before talking to users
- Assumed everyone learned the way I did
- Technical features nobody asked for
- Lesson: Build half the product in half the time, then listen

## Consulting Platform
- Tried to be everything to everyone
- No clear value proposition
- Built for imaginary users
- Lesson: One clear problem for one clear person

## Course Platform
- Perfect content, zero marketing
- Assumed "build it and they will come"
- Ignored distribution from day one
- Lesson: Spend equal time on building and finding users`
        };

        return placeholders[source] || `# ${source}\n\nFounder perspective on learning, building, and growing.`;
    }

    async loadDomainKnowledge() {
        try {
            const domainContent = await fs.readFile(this.domainKnowledgePath, 'utf8');
            const domains = JSON.parse(domainContent);
            
            Object.entries(domains).forEach(([domain, knowledge]) => {
                this.memoryCache.set(`domain:${domain}`, {
                    content: knowledge,
                    type: 'domain',
                    weight: 0.7,
                    lastAccessed: Date.now(),
                    source: 'scraper'
                });
            });
        } catch {
            // Initialize empty domain knowledge
            this.memoryCache.set('domain:default', {
                content: 'Domain knowledge being built through exploration...',
                type: 'domain',
                weight: 0.5,
                lastAccessed: Date.now(),
                source: 'default'
            });
        }
    }

    async loadConversationHistory() {
        try {
            const conversations = await fs.readdir(this.conversationLogsPath);
            
            for (const convFile of conversations.slice(-10)) { // Last 10 conversations
                const convContent = await fs.readFile(
                    path.join(this.conversationLogsPath, convFile), 
                    'utf8'
                );
                
                const conversation = JSON.parse(convContent);
                this.memoryCache.set(`conversation:${convFile}`, {
                    content: conversation,
                    type: 'recent',
                    weight: 0.8,
                    lastAccessed: Date.now(),
                    source: 'conversation'
                });
            }
        } catch {
            // No conversation history yet
        }
    }

    async loadReflectionIndex() {
        try {
            const indexContent = await fs.readFile(this.reflectionIndexPath, 'utf8');
            const reflectionIndex = JSON.parse(indexContent);
            
            this.memoryCache.set('reflection:index', {
                content: reflectionIndex,
                type: 'reflection',
                weight: 0.6,
                lastAccessed: Date.now(),
                source: 'scraper'
            });
        } catch {
            // No reflection index yet
        }
    }

    async buildMemoryIndex() {
        // Build searchable index of all memories
        this.memoryIndex = {
            keywords: new Map(),
            concepts: new Map(),
            emotions: new Map(),
            patterns: new Map()
        };

        for (const [memoryId, memory] of this.memoryCache.entries()) {
            await this.indexMemory(memoryId, memory);
        }
    }

    async indexMemory(memoryId, memory) {
        const content = typeof memory.content === 'string' ? 
            memory.content : JSON.stringify(memory.content);
        
        // Extract keywords
        const keywords = this.extractKeywords(content);
        keywords.forEach(keyword => {
            if (!this.memoryIndex.keywords.has(keyword)) {
                this.memoryIndex.keywords.set(keyword, []);
            }
            this.memoryIndex.keywords.get(keyword).push(memoryId);
        });
        
        // Extract concepts
        const concepts = this.extractConcepts(content);
        concepts.forEach(concept => {
            if (!this.memoryIndex.concepts.has(concept)) {
                this.memoryIndex.concepts.set(concept, []);
            }
            this.memoryIndex.concepts.get(concept).push(memoryId);
        });
        
        // Extract emotional markers
        const emotions = this.extractEmotions(content);
        emotions.forEach(emotion => {
            if (!this.memoryIndex.emotions.has(emotion)) {
                this.memoryIndex.emotions.set(emotion, []);
            }
            this.memoryIndex.emotions.get(emotion).push(memoryId);
        });
    }

    async retrieveRelevant(prompt, sessionId, weights) {
        console.log(`🔍 Retrieving relevant memories for: "${prompt.substring(0, 50)}..."`);
        
        const relevantMemories = [];
        
        // Score all memories for relevance
        for (const [memoryId, memory] of this.memoryCache.entries()) {
            const relevanceScore = await this.calculateRelevance(
                prompt, 
                memory, 
                sessionId, 
                weights
            );
            
            if (relevanceScore > 0.1) { // Threshold for inclusion
                relevantMemories.push({
                    id: memoryId,
                    memory: memory,
                    relevance: relevanceScore,
                    summary: this.generateMemorySummary(memory)
                });
            }
        }
        
        // Sort by relevance and apply weights
        relevantMemories.sort((a, b) => b.relevance - a.relevance);
        
        // Apply memory type weights
        const weightedMemories = this.applyMemoryWeights(relevantMemories, weights);
        
        // Update access patterns
        await this.updateAccessPatterns(prompt, sessionId, weightedMemories);
        
        return weightedMemories.slice(0, 10); // Top 10 most relevant
    }

    async calculateRelevance(prompt, memory, sessionId, weights) {
        let relevance = 0;
        
        const content = typeof memory.content === 'string' ? 
            memory.content : JSON.stringify(memory.content);
        
        // Keyword similarity
        const promptKeywords = this.extractKeywords(prompt);
        const memoryKeywords = this.extractKeywords(content);
        const keywordOverlap = promptKeywords.filter(k => memoryKeywords.includes(k)).length;
        const keywordSimilarity = keywordOverlap / Math.max(promptKeywords.length, 1);
        
        relevance += keywordSimilarity * 0.3;
        
        // Concept similarity
        const promptConcepts = this.extractConcepts(prompt);
        const memoryConcepts = this.extractConcepts(content);
        const conceptOverlap = promptConcepts.filter(c => memoryConcepts.includes(c)).length;
        const conceptSimilarity = conceptOverlap / Math.max(promptConcepts.length, 1);
        
        relevance += conceptSimilarity * 0.4;
        
        // Emotional resonance
        const promptEmotions = this.extractEmotions(prompt);
        const memoryEmotions = this.extractEmotions(content);
        const emotionalOverlap = promptEmotions.filter(e => memoryEmotions.includes(e)).length;
        const emotionalResonance = emotionalOverlap / Math.max(promptEmotions.length, 1);
        
        relevance += emotionalResonance * 0.2;
        
        // Recency factor
        const timeDiff = Date.now() - (memory.lastAccessed || 0);
        const recencyFactor = Math.exp(-timeDiff / (24 * 60 * 60 * 1000)); // Decay over days
        
        relevance += recencyFactor * 0.1;
        
        return Math.min(1, relevance);
    }

    applyMemoryWeights(memories, weights) {
        return memories.map(memory => {
            let weightMultiplier = 1;
            
            switch (memory.memory.type) {
                case 'recent':
                    weightMultiplier = weights.recentWeight || 1;
                    break;
                case 'foundational':
                    weightMultiplier = weights.foundationalWeight || 1;
                    break;
                case 'domain':
                    weightMultiplier = weights.relevantWeight || 1;
                    break;
                case 'reflection':
                    weightMultiplier = weights.emotionalWeight || 1;
                    break;
            }
            
            return {
                ...memory,
                relevance: memory.relevance * weightMultiplier
            };
        }).sort((a, b) => b.relevance - a.relevance);
    }

    generateMemorySummary(memory) {
        const content = typeof memory.content === 'string' ? 
            memory.content : JSON.stringify(memory.content);
        
        // Extract first meaningful sentence or first 100 characters
        const sentences = content.split(/[.!?]+/);
        const firstSentence = sentences.find(s => s.trim().length > 20);
        
        return firstSentence ? 
            firstSentence.trim().substring(0, 100) + '...' :
            content.substring(0, 100) + '...';
    }

    async updateAccessPatterns(prompt, sessionId, accessedMemories) {
        const pattern = {
            sessionId: sessionId,
            prompt: prompt.substring(0, 50),
            accessedMemories: accessedMemories.map(m => m.id),
            timestamp: Date.now()
        };
        
        this.accessPatterns.set(`${sessionId}-${Date.now()}`, pattern);
        
        // Update last accessed timestamps
        accessedMemories.forEach(memory => {
            if (this.memoryCache.has(memory.id)) {
                this.memoryCache.get(memory.id).lastAccessed = Date.now();
            }
        });
    }

    extractKeywords(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !this.isStopWord(word))
            .slice(0, 20);
    }

    extractConcepts(text) {
        const conceptPatterns = [
            // Learning concepts
            /\b(learn|learning|understand|knowledge|skill|study|practice)\b/gi,
            // Business concepts  
            /\b(startup|business|company|product|user|customer|market)\b/gi,
            // Problem solving
            /\b(problem|solution|challenge|issue|difficulty|obstacle)\b/gi,
            // System concepts
            /\b(system|process|method|approach|strategy|framework)\b/gi,
            // Emotional concepts
            /\b(stress|anxiety|excitement|confidence|doubt|fear|hope)\b/gi
        ];
        
        const concepts = [];
        conceptPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                concepts.push(...matches.map(m => m.toLowerCase()));
            }
        });
        
        return [...new Set(concepts)];
    }

    extractEmotions(text) {
        const emotionWords = {
            positive: ['good', 'great', 'amazing', 'excited', 'happy', 'confident', 'hopeful'],
            negative: ['bad', 'terrible', 'frustrated', 'sad', 'anxious', 'worried', 'stressed'],
            curious: ['wondering', 'curious', 'interesting', 'explore', 'discover'],
            uncertain: ['unsure', 'confused', 'unclear', 'doubt', 'maybe', 'perhaps']
        };
        
        const emotions = [];
        const textLower = text.toLowerCase();
        
        Object.entries(emotionWords).forEach(([emotion, words]) => {
            if (words.some(word => textLower.includes(word))) {
                emotions.push(emotion);
            }
        });
        
        return emotions;
    }

    isStopWord(word) {
        const stopWords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have',
            'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
        ];
        
        return stopWords.includes(word.toLowerCase());
    }

    async storeNewMemory(content, type, sessionId, metadata = {}) {
        const memoryId = `${type}:${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        
        const memory = {
            content: content,
            type: type,
            weight: metadata.weight || 0.5,
            lastAccessed: Date.now(),
            source: metadata.source || 'runtime',
            sessionId: sessionId,
            metadata: metadata
        };
        
        this.memoryCache.set(memoryId, memory);
        await this.indexMemory(memoryId, memory);
        
        console.log(`💾 Stored new memory: ${memoryId}`);
        return memoryId;
    }

    async getMemoryStats() {
        const stats = {
            totalMemories: this.memoryCache.size,
            byType: {},
            bySource: {},
            indexSize: {
                keywords: this.memoryIndex.keywords.size,
                concepts: this.memoryIndex.concepts.size,
                emotions: this.memoryIndex.emotions.size
            },
            accessPatterns: this.accessPatterns.size
        };
        
        for (const memory of this.memoryCache.values()) {
            stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1;
            stats.bySource[memory.source] = (stats.bySource[memory.source] || 0) + 1;
        }
        
        return stats;
    }

    async getContextSnapshot(sessionId, maxDepth = 5) {
        // Get recent context for the session
        const sessionMemories = Array.from(this.memoryCache.entries())
            .filter(([id, memory]) => 
                memory.sessionId === sessionId || 
                memory.type === 'foundational'
            )
            .slice(-maxDepth);
        
        return {
            sessionId: sessionId,
            contextDepth: sessionMemories.length,
            memories: sessionMemories.map(([id, memory]) => ({
                id: id,
                type: memory.type,
                summary: this.generateMemorySummary(memory),
                weight: memory.weight,
                lastAccessed: memory.lastAccessed
            })),
            timestamp: Date.now()
        };
    }
}

module.exports = MemoryRoutes;