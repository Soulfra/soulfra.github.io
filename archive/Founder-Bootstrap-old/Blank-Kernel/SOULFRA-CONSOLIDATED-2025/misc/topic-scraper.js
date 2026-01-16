// Topic Scraper - Domain Learning for Cal's Reflection System
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class TopicScraper {
    constructor() {
        this.scrapedTopicsPath = path.join(__dirname, 'scraped-topics.json');
        this.reflectionIndexPath = path.join(__dirname, 'reflection-index.json');
        this.domainKnowledgePath = path.join(__dirname, '../vault/memory/domain-knowledge.json');
        
        // Learning domains to scrape
        this.learningDomains = [
            'startup_methodology',
            'learning_techniques', 
            'technical_education',
            'productivity_systems',
            'decision_making',
            'emotional_intelligence',
            'communication_patterns',
            'problem_solving',
            'creativity_methods',
            'habit_formation'
        ];
        
        // Topic patterns to identify and extract
        this.topicPatterns = {
            methods: /\b(method|technique|approach|strategy|framework|system)\b/gi,
            concepts: /\b(concept|principle|idea|theory|model|pattern)\b/gi,
            processes: /\b(process|workflow|procedure|steps|sequence|protocol)\b/gi,
            tools: /\b(tool|software|platform|app|service|resource)\b/gi,
            insights: /\b(insight|lesson|learning|discovery|realization|understanding)\b/gi
        };
        
        this.scrapedTopics = new Map();
        this.reflectionIndex = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('🔍 Initializing Topic Scraper for domain learning...');
        await this.loadExistingData();
        console.log('✅ Topic Scraper ready');
    }
    
    async loadExistingData() {
        try {
            // Load scraped topics
            const topicsContent = await fs.readFile(this.scrapedTopicsPath, 'utf8');
            const topicsData = JSON.parse(topicsContent);
            
            topicsData.topics.forEach(topic => {
                this.scrapedTopics.set(topic.id, topic);
            });
            
            console.log(`📚 Loaded ${this.scrapedTopics.size} existing topics`);
        } catch {
            // Initialize empty if file doesn't exist
            await this.saveScrapedTopics();
        }
        
        try {
            // Load reflection index
            const indexContent = await fs.readFile(this.reflectionIndexPath, 'utf8');
            const indexData = JSON.parse(indexContent);
            
            indexData.entries.forEach(entry => {
                this.reflectionIndex.set(entry.id, entry);
            });
            
            console.log(`🧠 Loaded ${this.reflectionIndex.size} reflection index entries`);
        } catch {
            // Initialize empty if file doesn't exist
            await this.saveReflectionIndex();
        }
    }
    
    async scrapeFromPromptHistory(promptHistory) {
        console.log('🔍 Scraping topics from user prompt history...');
        
        const scrapedCount = 0;
        const newTopics = [];
        
        for (const prompt of promptHistory) {
            const extractedTopics = await this.extractTopicsFromText(prompt.content, 'user_prompt');
            
            for (const topic of extractedTopics) {
                if (!this.scrapedTopics.has(topic.id)) {
                    this.scrapedTopics.set(topic.id, topic);
                    newTopics.push(topic);
                }
            }
        }
        
        if (newTopics.length > 0) {
            await this.saveScrapedTopics();
            await this.indexNewTopics(newTopics);
            console.log(`📚 Scraped ${newTopics.length} new topics from prompt history`);
        }
        
        return newTopics;
    }
    
    async scrapeFromReflectionChains(reflectionChains) {
        console.log('🧠 Scraping topics from Cal\'s reflection chains...');
        
        const newTopics = [];
        
        for (const chain of reflectionChains) {
            // Extract topics from reasoning steps
            for (const step of chain.reasoningSteps) {
                const extractedTopics = await this.extractTopicsFromText(
                    JSON.stringify(step.reasoning), 
                    'reflection_reasoning'
                );
                
                for (const topic of extractedTopics) {
                    if (!this.scrapedTopics.has(topic.id)) {
                        topic.reflectionContext = {
                            chainId: chain.id,
                            stepDepth: step.depth,
                            approach: step.approach,
                            confidence: step.confidence
                        };
                        
                        this.scrapedTopics.set(topic.id, topic);
                        newTopics.push(topic);
                    }
                }
            }
        }
        
        if (newTopics.length > 0) {
            await this.saveScrapedTopics();
            await this.indexNewTopics(newTopics);
            console.log(`🧠 Scraped ${newTopics.length} new topics from reflection chains`);
        }
        
        return newTopics;
    }
    
    async extractTopicsFromText(text, source) {
        const topics = [];
        const textLower = text.toLowerCase();
        
        // Extract by pattern type
        for (const [patternType, pattern] of Object.entries(this.topicPatterns)) {
            const matches = text.match(pattern);
            
            if (matches) {
                for (const match of matches) {
                    const context = this.extractContext(text, match);
                    const domain = this.classifyDomain(context);
                    
                    const topic = {
                        id: this.generateTopicId(match, context),
                        term: match,
                        type: patternType,
                        context: context,
                        domain: domain,
                        source: source,
                        extractedAt: new Date().toISOString(),
                        confidence: this.calculateExtractionConfidence(match, context),
                        relatedTerms: this.findRelatedTerms(text, match)
                    };
                    
                    topics.push(topic);
                }
            }
        }
        
        // Extract key phrases (noun phrases that might be important concepts)
        const keyPhrases = this.extractKeyPhrases(text);
        for (const phrase of keyPhrases) {
            const domain = this.classifyDomain(phrase);
            
            const topic = {
                id: this.generateTopicId(phrase, text),
                term: phrase,
                type: 'key_phrase',
                context: this.extractContext(text, phrase),
                domain: domain,
                source: source,
                extractedAt: new Date().toISOString(),
                confidence: this.calculateExtractionConfidence(phrase, text),
                relatedTerms: this.findRelatedTerms(text, phrase)
            };
            
            topics.push(topic);
        }
        
        return topics;
    }
    
    extractContext(text, term) {
        const termIndex = text.toLowerCase().indexOf(term.toLowerCase());
        if (termIndex === -1) return text.substring(0, 100);
        
        const start = Math.max(0, termIndex - 50);
        const end = Math.min(text.length, termIndex + term.length + 50);
        
        return text.substring(start, end);
    }
    
    classifyDomain(text) {
        const textLower = text.toLowerCase();
        
        const domainKeywords = {
            startup_methodology: ['startup', 'business', 'venture', 'company', 'entrepreneur', 'mvp', 'pivot'],
            learning_techniques: ['learn', 'study', 'understand', 'knowledge', 'skill', 'practice', 'memory'],
            technical_education: ['code', 'programming', 'development', 'software', 'technical', 'algorithm'],
            productivity_systems: ['productivity', 'workflow', 'system', 'process', 'efficiency', 'optimization'],
            decision_making: ['decision', 'choose', 'option', 'evaluate', 'criteria', 'judgment'],
            emotional_intelligence: ['emotion', 'feeling', 'empathy', 'social', 'relationship', 'communication'],
            communication_patterns: ['communicate', 'speak', 'listen', 'conversation', 'dialogue', 'feedback'],
            problem_solving: ['problem', 'solution', 'solve', 'challenge', 'issue', 'troubleshoot'],
            creativity_methods: ['creative', 'innovation', 'brainstorm', 'ideate', 'inspiration', 'original'],
            habit_formation: ['habit', 'routine', 'consistency', 'behavior', 'practice', 'discipline']
        };
        
        let bestDomain = 'general';
        let bestScore = 0;
        
        for (const [domain, keywords] of Object.entries(domainKeywords)) {
            const score = keywords.filter(keyword => textLower.includes(keyword)).length;
            if (score > bestScore) {
                bestScore = score;
                bestDomain = domain;
            }
        }
        
        return bestDomain;
    }
    
    calculateExtractionConfidence(term, context) {
        let confidence = 0.5; // Base confidence
        
        // Boost confidence for longer, more specific terms
        if (term.length > 10) confidence += 0.1;
        if (term.includes(' ')) confidence += 0.1; // Multi-word terms
        
        // Boost confidence if term appears multiple times
        const occurrences = (context.toLowerCase().match(new RegExp(term.toLowerCase(), 'g')) || []).length;
        confidence += Math.min(0.2, occurrences * 0.05);
        
        // Boost confidence for technical or methodological terms
        if (/method|technique|approach|strategy|framework|system/i.test(term)) {
            confidence += 0.2;
        }
        
        return Math.min(0.95, confidence);
    }
    
    findRelatedTerms(text, term) {
        const words = text.toLowerCase().split(/\W+/);
        const termWords = term.toLowerCase().split(/\W+/);
        const relatedTerms = [];
        
        // Find words that appear near the term
        for (let i = 0; i < words.length; i++) {
            if (termWords.includes(words[i])) {
                // Get surrounding words
                const surrounding = words.slice(Math.max(0, i - 3), i + 4);
                relatedTerms.push(...surrounding);
            }
        }
        
        // Remove duplicates and the original term words
        return [...new Set(relatedTerms)]
            .filter(word => !termWords.includes(word))
            .filter(word => word.length > 2)
            .slice(0, 10);
    }
    
    extractKeyPhrases(text) {
        // Simple key phrase extraction - look for noun phrases
        const sentences = text.split(/[.!?]+/);
        const keyPhrases = [];
        
        for (const sentence of sentences) {
            // Look for patterns like "the X of Y" or "X is Y" or "using X"
            const patterns = [
                /\b(the|a|an)\s+([a-z]+(?:\s+[a-z]+)*)\s+(?:of|for|in|with)\s+([a-z]+(?:\s+[a-z]+)*)/gi,
                /\b([a-z]+(?:\s+[a-z]+)*)\s+(?:is|are|was|were)\s+([a-z]+(?:\s+[a-z]+)*)/gi,
                /\b(?:using|through|via|by)\s+([a-z]+(?:\s+[a-z]+)*)/gi
            ];
            
            for (const pattern of patterns) {
                const matches = sentence.match(pattern);
                if (matches) {
                    keyPhrases.push(...matches.map(match => match.trim()));
                }
            }
        }
        
        return [...new Set(keyPhrases)]
            .filter(phrase => phrase.length > 5 && phrase.length < 50)
            .slice(0, 20);
    }
    
    generateTopicId(term, context) {
        const combined = `${term}-${context.substring(0, 50)}`;
        return crypto.createHash('md5').update(combined).digest('hex').substring(0, 12);
    }
    
    async indexNewTopics(topics) {
        console.log(`🗂️ Indexing ${topics.length} new topics...`);
        
        for (const topic of topics) {
            const indexEntry = {
                id: topic.id,
                term: topic.term,
                type: topic.type,
                domain: topic.domain,
                confidence: topic.confidence,
                source: topic.source,
                indexedAt: new Date().toISOString(),
                reflectionRelevance: this.calculateReflectionRelevance(topic),
                searchTerms: this.generateSearchTerms(topic),
                relatedTopics: this.findRelatedTopicIds(topic)
            };
            
            this.reflectionIndex.set(topic.id, indexEntry);
        }
        
        await this.saveReflectionIndex();
        await this.updateDomainKnowledge();
    }
    
    calculateReflectionRelevance(topic) {
        let relevance = 0.5;
        
        // Higher relevance for certain domains
        const highRelevanceDomains = [
            'startup_methodology', 
            'learning_techniques', 
            'decision_making',
            'emotional_intelligence',
            'communication_patterns'
        ];
        
        if (highRelevanceDomains.includes(topic.domain)) {
            relevance += 0.2;
        }
        
        // Higher relevance for methodological terms
        if (['methods', 'processes', 'concepts'].includes(topic.type)) {
            relevance += 0.1;
        }
        
        // Higher relevance if extracted from reflection chains
        if (topic.source === 'reflection_reasoning') {
            relevance += 0.3;
        }
        
        return Math.min(0.95, relevance);
    }
    
    generateSearchTerms(topic) {
        const searchTerms = [topic.term.toLowerCase()];
        
        // Add variations
        searchTerms.push(...topic.relatedTerms.slice(0, 5));
        
        // Add domain-specific terms
        searchTerms.push(topic.domain.replace('_', ' '));
        
        // Add type-specific terms
        searchTerms.push(topic.type.replace('_', ' '));
        
        return [...new Set(searchTerms)].filter(term => term.length > 2);
    }
    
    findRelatedTopicIds(topic) {
        const relatedIds = [];
        
        for (const [id, existingTopic] of this.scrapedTopics.entries()) {
            if (id === topic.id) continue;
            
            // Same domain = related
            if (existingTopic.domain === topic.domain) {
                relatedIds.push(id);
            }
            
            // Overlapping related terms = related
            const overlap = topic.relatedTerms.filter(term => 
                existingTopic.relatedTerms.includes(term)
            ).length;
            
            if (overlap > 1) {
                relatedIds.push(id);
            }
        }
        
        return relatedIds.slice(0, 10); // Limit to 10 related topics
    }
    
    async updateDomainKnowledge() {
        console.log('📚 Updating domain knowledge base...');
        
        const domainKnowledge = {};
        
        // Group topics by domain
        for (const topic of this.scrapedTopics.values()) {
            if (!domainKnowledge[topic.domain]) {
                domainKnowledge[topic.domain] = {
                    topics: [],
                    keyTerms: [],
                    methods: [],
                    concepts: [],
                    lastUpdated: new Date().toISOString()
                };
            }
            
            domainKnowledge[topic.domain].topics.push({
                id: topic.id,
                term: topic.term,
                type: topic.type,
                confidence: topic.confidence
            });
            
            // Categorize by type
            if (topic.type === 'methods') {
                domainKnowledge[topic.domain].methods.push(topic.term);
            } else if (topic.type === 'concepts') {
                domainKnowledge[topic.domain].concepts.push(topic.term);
            }
            
            domainKnowledge[topic.domain].keyTerms.push(...topic.relatedTerms);
        }
        
        // Deduplicate and sort
        for (const domain of Object.keys(domainKnowledge)) {
            domainKnowledge[domain].keyTerms = [...new Set(domainKnowledge[domain].keyTerms)].slice(0, 50);
            domainKnowledge[domain].methods = [...new Set(domainKnowledge[domain].methods)].slice(0, 20);
            domainKnowledge[domain].concepts = [...new Set(domainKnowledge[domain].concepts)].slice(0, 20);
        }
        
        // Save domain knowledge
        await fs.writeFile(this.domainKnowledgePath, JSON.stringify(domainKnowledge, null, 2));
        console.log(`📚 Domain knowledge updated with ${Object.keys(domainKnowledge).length} domains`);
    }
    
    async getTopicsForReflection(prompt, domain = null) {
        const relevantTopics = [];
        const promptLower = prompt.toLowerCase();
        
        for (const [id, indexEntry] of this.reflectionIndex.entries()) {
            // Domain filter
            if (domain && indexEntry.domain !== domain) continue;
            
            // Relevance scoring
            let score = indexEntry.reflectionRelevance;
            
            // Boost if prompt contains search terms
            const termMatches = indexEntry.searchTerms.filter(term => 
                promptLower.includes(term)
            ).length;
            score += termMatches * 0.1;
            
            // Boost if domain matches prompt context
            if (promptLower.includes(indexEntry.domain.replace('_', ' '))) {
                score += 0.2;
            }
            
            if (score > 0.3) { // Threshold for relevance
                const topic = this.scrapedTopics.get(id);
                relevantTopics.push({
                    ...indexEntry,
                    topic: topic,
                    relevanceScore: score
                });
            }
        }
        
        // Sort by relevance and return top 10
        return relevantTopics
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 10);
    }
    
    async saveScrapedTopics() {
        const data = {
            topics: Array.from(this.scrapedTopics.values()),
            totalTopics: this.scrapedTopics.size,
            lastUpdated: new Date().toISOString(),
            domains: [...new Set(Array.from(this.scrapedTopics.values()).map(t => t.domain))]
        };
        
        await fs.writeFile(this.scrapedTopicsPath, JSON.stringify(data, null, 2));
    }
    
    async saveReflectionIndex() {
        const data = {
            entries: Array.from(this.reflectionIndex.values()),
            totalEntries: this.reflectionIndex.size,
            lastUpdated: new Date().toISOString()
        };
        
        await fs.writeFile(this.reflectionIndexPath, JSON.stringify(data, null, 2));
    }
    
    async getScrapingStats() {
        const stats = {
            totalTopics: this.scrapedTopics.size,
            totalIndexEntries: this.reflectionIndex.size,
            domainDistribution: {},
            typeDistribution: {},
            sourceDistribution: {},
            confidenceDistribution: {
                high: 0, // > 0.8
                medium: 0, // 0.5 - 0.8
                low: 0 // < 0.5
            }
        };
        
        for (const topic of this.scrapedTopics.values()) {
            // Domain distribution
            stats.domainDistribution[topic.domain] = 
                (stats.domainDistribution[topic.domain] || 0) + 1;
            
            // Type distribution
            stats.typeDistribution[topic.type] = 
                (stats.typeDistribution[topic.type] || 0) + 1;
            
            // Source distribution
            stats.sourceDistribution[topic.source] = 
                (stats.sourceDistribution[topic.source] || 0) + 1;
            
            // Confidence distribution
            if (topic.confidence > 0.8) {
                stats.confidenceDistribution.high++;
            } else if (topic.confidence > 0.5) {
                stats.confidenceDistribution.medium++;
            } else {
                stats.confidenceDistribution.low++;
            }
        }
        
        return stats;
    }
}

module.exports = TopicScraper;