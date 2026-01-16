// Prompt Transformer - Core transformation engine
const NPCWrapper = require('./npc-wrapper');
const CringePromptLayer = require('./cringe-prompt-layer');
const ToneDiffuser = require('./tone-diffuser');

class PromptTransformer {
    constructor() {
        this.npcWrapper = new NPCWrapper();
        this.cringeLayer = new CringePromptLayer();
        this.toneDiffuser = new ToneDiffuser();
        
        this.transformationPipeline = [
            'normalize',
            'npc',
            'cringe',
            'tone',
            'finalize'
        ];
        
        this.transformationLog = [];
    }

    async transform(prompt, customerId, options = {}) {
        const transformation = {
            id: `transform-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            original: prompt,
            customerId: customerId,
            stages: [],
            timestamp: Date.now()
        };
        
        let current = prompt;
        
        // Run through transformation pipeline
        for (const stage of this.transformationPipeline) {
            const stageResult = await this.runStage(stage, current, customerId, options);
            
            transformation.stages.push({
                stage: stage,
                input: current,
                output: stageResult.output,
                metadata: stageResult.metadata
            });
            
            current = stageResult.output;
        }
        
        transformation.final = current;
        transformation.compressionRatio = this.calculateCompression(prompt, current);
        
        // Log transformation
        this.logTransformation(transformation);
        
        return transformation;
    }

    async runStage(stage, input, customerId, options) {
        const stages = {
            normalize: () => this.normalizePrompt(input),
            npc: () => this.applyNPCWrapper(input, customerId),
            cringe: () => this.applyCringeLayer(input, options.cringeLevel),
            tone: () => this.applyToneDiffusion(input, options.tones),
            finalize: () => this.finalizeTransformation(input, customerId)
        };
        
        return stages[stage] ? await stages[stage]() : { output: input, metadata: {} };
    }

    normalizePrompt(prompt) {
        // Basic normalization
        let normalized = prompt.trim();
        
        // Remove multiple spaces
        normalized = normalized.replace(/\s+/g, ' ');
        
        // Fix common typos
        normalized = this.fixCommonTypos(normalized);
        
        // Extract intent markers
        const intent = this.detectIntent(normalized);
        
        return {
            output: normalized,
            metadata: {
                originalLength: prompt.length,
                normalizedLength: normalized.length,
                intent: intent
            }
        };
    }

    fixCommonTypos(text) {
        const corrections = {
            'teh': 'the',
            'recieve': 'receive',
            'seperate': 'separate',
            'occured': 'occurred',
            'untill': 'until'
        };
        
        let corrected = text;
        Object.entries(corrections).forEach(([typo, correct]) => {
            const regex = new RegExp(`\\b${typo}\\b`, 'gi');
            corrected = corrected.replace(regex, correct);
        });
        
        return corrected;
    }

    detectIntent(prompt) {
        const intents = {
            question: /^(what|when|where|who|why|how|is|are|can|could|would|should)/i,
            command: /^(create|make|build|generate|write|design|develop|show|display)/i,
            request: /^(please|could you|would you|can you|i need|i want|help me)/i,
            statement: /^(i think|i believe|it is|there are|this is)/i
        };
        
        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(prompt)) {
                return intent;
            }
        }
        
        return 'unknown';
    }

    async applyNPCWrapper(prompt, customerId) {
        const wrapped = this.npcWrapper.wrapPrompt(prompt, customerId);
        
        return {
            output: wrapped.wrapped,
            metadata: {
                persona: wrapped.persona,
                obfuscationLevel: wrapped.metadata.obfuscationLevel,
                wrapperApplied: true
            }
        };
    }

    async applyCringeLayer(prompt, cringeLevel = null) {
        if (cringeLevel) {
            this.cringeLayer.setCringeLevel(cringeLevel);
        }
        
        const cringed = this.cringeLayer.transformPrompt(prompt);
        
        return {
            output: cringed.cringed,
            metadata: {
                cringeLevel: cringed.level,
                expansionRatio: cringed.cringed.length / prompt.length
            }
        };
    }

    async applyToneDiffusion(prompt, targetTones = null) {
        const diffused = this.toneDiffuser.diffusePrompt(prompt, targetTones);
        
        return {
            output: diffused.diffused,
            metadata: {
                tonesApplied: diffused.variations.length,
                entropy: diffused.entropy,
                dominantTone: this.findDominantTone(diffused.variations)
            }
        };
    }

    findDominantTone(variations) {
        if (variations.length === 0) return 'neutral';
        
        return variations.reduce((dominant, current) => {
            return current.weight > dominant.weight ? current : dominant;
        }).tone;
    }

    async finalizeTransformation(prompt, customerId) {
        // Add final obfuscation layer
        let finalized = prompt;
        
        // Add entropy signature
        const entropy = this.generateEntropySignature(prompt, customerId);
        finalized = `[${entropy}] ${finalized}`;
        
        // Add mirror markers
        finalized = this.addMirrorMarkers(finalized);
        
        // Scramble if too readable
        if (this.calculateReadability(finalized) > 0.7) {
            finalized = this.additionalScramble(finalized);
        }
        
        return {
            output: finalized,
            metadata: {
                entropySignature: entropy,
                readability: this.calculateReadability(finalized),
                mirrorDepth: this.calculateMirrorDepth(finalized)
            }
        };
    }

    generateEntropySignature(prompt, customerId) {
        const components = [
            prompt.length.toString(16),
            customerId.substring(0, 4),
            Date.now().toString(36).substring(-4)
        ];
        
        return components.join('-').toUpperCase();
    }

    addMirrorMarkers(text) {
        const markers = ['🪞', '◊', '∞', '⟨⟩', '※'];
        const marker = markers[Math.floor(Math.random() * markers.length)];
        
        // Insert markers at semantic boundaries
        return text.replace(/\. /g, `. ${marker} `);
    }

    calculateReadability(text) {
        // Simple readability score (0-1)
        const words = text.split(' ');
        const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
        const complexWords = words.filter(w => w.length > 8).length;
        
        const complexity = (avgWordLength / 10) + (complexWords / words.length);
        return Math.max(0, Math.min(1, 1 - complexity));
    }

    additionalScramble(text) {
        // Apply character substitutions
        const substitutions = {
            'a': ['@', 'α', 'ą'],
            'e': ['3', 'ε', 'ę'],
            'i': ['1', 'ι', 'į'],
            'o': ['0', 'ø', 'ǫ'],
            's': ['$', 'ş', 'ș']
        };
        
        return text.split('').map(char => {
            const lower = char.toLowerCase();
            if (substitutions[lower] && Math.random() > 0.7) {
                const subs = substitutions[lower];
                return subs[Math.floor(Math.random() * subs.length)];
            }
            return char;
        }).join('');
    }

    calculateMirrorDepth(text) {
        // Count transformation layers
        let depth = 1;
        
        if (text.includes('uwu') || text.includes('👉👈')) depth++;
        if (text.includes('*') && text.includes('*')) depth++;
        if (/[🪞◊∞⟨⟩※]/.test(text)) depth++;
        if (/[@3$0]/.test(text)) depth++;
        if (text.match(/\[.*\]/)) depth++;
        
        return depth;
    }

    calculateCompression(original, transformed) {
        return {
            ratio: transformed.length / original.length,
            increase: transformed.length - original.length,
            percentage: ((transformed.length / original.length - 1) * 100).toFixed(2) + '%'
        };
    }

    logTransformation(transformation) {
        this.transformationLog.push(transformation);
        
        // Keep only last 1000 transformations
        if (this.transformationLog.length > 1000) {
            this.transformationLog = this.transformationLog.slice(-500);
        }
        
        // Also persist to file in production
        // fs.appendFileSync('vault/transformation-log.json', JSON.stringify(transformation) + '\n');
    }

    async reverseTransform(transformed, transformationId = null) {
        // Attempt to reverse (highly lossy)
        if (transformationId) {
            const original = this.transformationLog.find(t => t.id === transformationId);
            if (original) {
                return {
                    success: true,
                    original: original.original,
                    confidence: 1.0
                };
            }
        }
        
        // Fallback to heuristic reversal
        let reversed = transformed;
        
        // Remove entropy signature
        reversed = reversed.replace(/\[[A-Z0-9\-]+\]\s*/, '');
        
        // Remove mirror markers
        reversed = reversed.replace(/[🪞◊∞⟨⟩※]/g, '');
        
        // Attempt to reverse character substitutions
        const reverseSubstitutions = {
            '@': 'a', 'α': 'a', 'ą': 'a',
            '3': 'e', 'ε': 'e', 'ę': 'e',
            '1': 'i', 'ι': 'i', 'į': 'i',
            '0': 'o', 'ø': 'o', 'ǫ': 'o',
            '$': 's', 'ş': 's', 'ș': 's'
        };
        
        Object.entries(reverseSubstitutions).forEach(([sub, char]) => {
            reversed = reversed.replace(new RegExp(sub, 'g'), char);
        });
        
        // Try to reverse other layers
        reversed = this.cringeLayer.reverseTransform(reversed, {});
        reversed = this.toneDiffuser.reverseDiffusion(reversed);
        
        return {
            success: false,
            original: reversed,
            confidence: 0.3,
            warning: 'Reversal is approximate and lossy'
        };
    }

    getTransformationStats() {
        if (this.transformationLog.length === 0) {
            return { noData: true };
        }
        
        const stats = {
            totalTransformations: this.transformationLog.length,
            averageCompressionRatio: 0,
            mostCommonIntent: {},
            averageMirrorDepth: 0,
            transformationsByCustomer: {}
        };
        
        this.transformationLog.forEach(t => {
            // Compression ratio
            stats.averageCompressionRatio += t.compressionRatio.ratio;
            
            // Intent distribution
            const intent = t.stages.find(s => s.stage === 'normalize')?.metadata.intent;
            stats.mostCommonIntent[intent] = (stats.mostCommonIntent[intent] || 0) + 1;
            
            // Mirror depth
            const depth = t.stages.find(s => s.stage === 'finalize')?.metadata.mirrorDepth || 0;
            stats.averageMirrorDepth += depth;
            
            // By customer
            stats.transformationsByCustomer[t.customerId] = 
                (stats.transformationsByCustomer[t.customerId] || 0) + 1;
        });
        
        stats.averageCompressionRatio /= this.transformationLog.length;
        stats.averageMirrorDepth /= this.transformationLog.length;
        
        return stats;
    }
}

// Router handler for integration
let routerHandler = null;
function setRouterHandler(handler) {
    routerHandler = handler;
}

const transformer = new PromptTransformer();
module.exports = {
    transform: transformer.transform.bind(transformer),
    setRouterHandler
};