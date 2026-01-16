const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CalReasoningKernel {
    constructor() {
        this.vaultPath = path.join(__dirname, '../../vault');
        this.reasoningVault = null;
        this.memoryContext = [];
        this.reflectionDepth = 0;
        this.maxDepth = 10;
    }

    async initialize() {
        try {
            // Load reasoning vault configuration
            const vaultPath = path.join(__dirname, 'reasoning-vault.json');
            const vaultData = await fs.readFile(vaultPath, 'utf8');
            this.reasoningVault = JSON.parse(vaultData);
            console.log('✅ Cal reasoning kernel initialized');
        } catch (error) {
            console.warn('⚠️ Reasoning vault not found, using defaults');
            this.reasoningVault = this.getDefaultVault();
        }

        // Load memory context if available
        await this.loadMemoryContext();
    }

    async reason(params) {
        const { prompt, llm, forkId, context = {} } = params;

        // Initialize if not already done
        if (!this.reasoningVault) {
            await this.initialize();
        }

        // Check reflection depth to prevent infinite loops
        if (this.reflectionDepth >= this.maxDepth) {
            console.warn('⚠️ Max reflection depth reached');
            return {
                enhancedPrompt: prompt,
                metadata: {
                    depth: this.reflectionDepth,
                    halted: true,
                    reason: 'max-depth'
                }
            };
        }

        this.reflectionDepth++;

        try {
            // Apply reasoning stages
            let enhancedPrompt = prompt;
            const metadata = {
                depth: this.reflectionDepth,
                stages: [],
                forkId,
                context
            };

            // Stage 1: Memory injection
            if (this.memoryContext.length > 0) {
                const relevantMemories = this.findRelevantMemories(prompt);
                if (relevantMemories.length > 0) {
                    enhancedPrompt = this.injectMemories(enhancedPrompt, relevantMemories);
                    metadata.stages.push({
                        stage: 'memory-injection',
                        memoriesUsed: relevantMemories.length
                    });
                }
            }

            // Stage 2: Pattern analysis
            const patterns = this.analyzePatterns(enhancedPrompt);
            if (patterns.length > 0) {
                enhancedPrompt = this.applyPatternEnhancements(enhancedPrompt, patterns);
                metadata.stages.push({
                    stage: 'pattern-analysis',
                    patterns: patterns.map(p => p.type)
                });
            }

            // Stage 3: Contextual expansion
            const expansion = this.expandContext(enhancedPrompt, llm);
            if (expansion.modified) {
                enhancedPrompt = expansion.prompt;
                metadata.stages.push({
                    stage: 'contextual-expansion',
                    expansions: expansion.expansions
                });
            }

            // Stage 4: Recursive reflection (if enabled)
            if (this.shouldRecurse(context)) {
                const recursiveResult = await this.recurseReflection(enhancedPrompt, metadata);
                if (recursiveResult.modified) {
                    enhancedPrompt = recursiveResult.prompt;
                    metadata.stages.push({
                        stage: 'recursive-reflection',
                        subDepth: recursiveResult.depth
                    });
                }
            }

            // Log reasoning process
            await this.logReasoning(prompt, enhancedPrompt, metadata);

            return {
                enhancedPrompt,
                metadata
            };
        } finally {
            this.reflectionDepth--;
        }
    }

    async loadMemoryContext() {
        try {
            const memoryPath = path.join(this.vaultPath, 'memory-bank');
            const files = await fs.readdir(memoryPath);
            
            for (const file of files.slice(-10)) { // Last 10 memories
                if (file.endsWith('.json')) {
                    const content = await fs.readFile(path.join(memoryPath, file), 'utf8');
                    const memory = JSON.parse(content);
                    this.memoryContext.push(memory);
                }
            }
        } catch (error) {
            // Memory bank not available
        }
    }

    findRelevantMemories(prompt) {
        const promptLower = prompt.toLowerCase();
        const keywords = this.extractKeywords(promptLower);
        
        return this.memoryContext.filter(memory => {
            const relevanceScore = this.calculateRelevance(memory, keywords);
            return relevanceScore > 0.7;
        }).slice(0, 3); // Top 3 relevant memories
    }

    calculateRelevance(memory, keywords) {
        let score = 0;
        const memoryText = `${memory.prompt} ${memory.response}`.toLowerCase();
        
        for (const keyword of keywords) {
            if (memoryText.includes(keyword)) {
                score += 1 / keywords.length;
            }
        }
        
        return score;
    }

    extractKeywords(text) {
        const words = text.split(/\s+/);
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
        return words.filter(w => w.length > 3 && !stopWords.has(w));
    }

    injectMemories(prompt, memories) {
        const memoryContext = memories.map(m => 
            `Previous context: ${m.prompt.substring(0, 50)}... → ${m.response.substring(0, 100)}...`
        ).join('\n');
        
        return `${prompt}\n\nRelevant context from memory:\n${memoryContext}`;
    }

    analyzePatterns(prompt) {
        const patterns = [];
        
        // Question pattern
        if (prompt.includes('?') || prompt.toLowerCase().startsWith('what') || prompt.toLowerCase().startsWith('how')) {
            patterns.push({ type: 'question', enhancement: 'analytical' });
        }
        
        // Code pattern
        if (prompt.includes('function') || prompt.includes('implement') || prompt.includes('code')) {
            patterns.push({ type: 'code', enhancement: 'technical' });
        }
        
        // Creative pattern
        if (prompt.includes('create') || prompt.includes('design') || prompt.includes('imagine')) {
            patterns.push({ type: 'creative', enhancement: 'expansive' });
        }
        
        return patterns;
    }

    applyPatternEnhancements(prompt, patterns) {
        let enhanced = prompt;
        
        for (const pattern of patterns) {
            switch (pattern.enhancement) {
                case 'analytical':
                    enhanced = `Analytical request: ${enhanced}\nConsider multiple perspectives and provide structured reasoning.`;
                    break;
                case 'technical':
                    enhanced = `Technical implementation: ${enhanced}\nFocus on clarity, efficiency, and best practices.`;
                    break;
                case 'expansive':
                    enhanced = `Creative exploration: ${enhanced}\nConsider innovative approaches and novel connections.`;
                    break;
            }
        }
        
        return enhanced;
    }

    expandContext(prompt, llm) {
        const expansions = [];
        let modified = false;
        let expandedPrompt = prompt;
        
        // LLM-specific expansions
        if (llm === 'claude') {
            expansions.push('claude-optimized');
            expandedPrompt = `[Optimized for Claude] ${expandedPrompt}`;
            modified = true;
        } else if (llm === 'local') {
            expansions.push('simplified');
            // Simplify for local processing
            expandedPrompt = expandedPrompt.replace(/[^\w\s?.,!]/g, '');
            modified = true;
        }
        
        return { prompt: expandedPrompt, modified, expansions };
    }

    shouldRecurse(context) {
        // Only recurse for Riven sessions or if explicitly enabled
        return context.qrCode === 'qr-riven-001' || context.recursiveReflection === true;
    }

    async recurseReflection(prompt, metadata) {
        // Simulate recursive reflection
        const recursionPrompt = `Reflecting on: "${prompt.substring(0, 50)}..."`;
        
        return {
            prompt: `${prompt}\n[Recursive insight: Consider the meta-level implications]`,
            modified: true,
            depth: metadata.depth + 1
        };
    }

    async logReasoning(originalPrompt, enhancedPrompt, metadata) {
        try {
            const logPath = path.join(this.vaultPath, 'reasoning-log.json');
            let log = [];
            
            try {
                const existing = await fs.readFile(logPath, 'utf8');
                log = JSON.parse(existing);
            } catch (e) {
                // File doesn't exist yet
            }

            log.push({
                timestamp: Date.now(),
                originalLength: originalPrompt.length,
                enhancedLength: enhancedPrompt.length,
                metadata,
                hash: crypto.createHash('md5').update(originalPrompt).digest('hex')
            });

            // Keep only last 100 entries
            if (log.length > 100) {
                log = log.slice(-100);
            }

            await fs.writeFile(logPath, JSON.stringify(log, null, 2));
        } catch (error) {
            console.error('Failed to log reasoning:', error);
        }
    }

    getDefaultVault() {
        return {
            patterns: {
                question: { weight: 1.2, enhancement: 'analytical' },
                code: { weight: 1.5, enhancement: 'technical' },
                creative: { weight: 1.3, enhancement: 'expansive' }
            },
            memory: {
                enabled: true,
                contextWindow: 5,
                relevanceThreshold: 0.7
            },
            recursion: {
                maxDepth: 10,
                enabledForQR: ['qr-riven-001']
            }
        };
    }
}

// Export singleton instance
const kernel = new CalReasoningKernel();

module.exports = {
    reason: kernel.reason.bind(kernel),
    initialize: kernel.initialize.bind(kernel)
};