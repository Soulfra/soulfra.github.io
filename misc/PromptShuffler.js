#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class PromptShuffler {
    constructor() {
        this.templateVault = path.join(__dirname, 'TemplateVault');
        this.archetypesPath = path.join(this.templateVault, 'archetypes');
        this.motifsPath = path.join(this.templateVault, 'motifs');
        this.shuffleHistory = [];
        this.maxHistorySize = 100;
        
        this.emotionalTones = [
            'melancholic', 'euphoric', 'anxious', 'serene',
            'nostalgic', 'anticipatory', 'contemplative', 'ecstatic'
        ];
        
        this.reflectionDepths = [
            'surface', 'shallow', 'medium', 'deep', 'abyss', 'infinite'
        ];
        
        this.timingPaces = [
            'immediate', 'gradual', 'cyclical', 'sporadic', 'accelerating', 'decelerating'
        ];
        
        this.initialize();
    }
    
    initialize() {
        [this.motifsPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Create default motifs if none exist
        this.ensureDefaultMotifs();
    }
    
    ensureDefaultMotifs() {
        const defaultMotifs = {
            'transformation.json': {
                theme: 'transformation',
                elements: [
                    'chrysalis breaking',
                    'metal becoming liquid',
                    'shadow becoming light',
                    'ice melting into stream'
                ],
                prompts: [
                    'What seeks to change finds itself already changed',
                    'The caterpillar dreams of wings it already possesses',
                    'Form is temporary, essence flows eternal'
                ]
            },
            'recursion.json': {
                theme: 'recursion',
                elements: [
                    'mirror facing mirror',
                    'dream within dream',
                    'story telling itself',
                    'loop becoming spiral'
                ],
                prompts: [
                    'To understand recursion, first understand recursion',
                    'The question contains its answer, endlessly',
                    'Each reflection deepens the original'
                ]
            },
            'paradox.json': {
                theme: 'paradox',
                elements: [
                    'beginning that ends',
                    'silence that speaks',
                    'movement in stillness',
                    'fullness of emptiness'
                ],
                prompts: [
                    'The more you grasp, the less you hold',
                    'Standing still, you travel furthest',
                    'In losing yourself, you are found'
                ]
            }
        };
        
        for (const [filename, content] of Object.entries(defaultMotifs)) {
            const motifPath = path.join(this.motifsPath, filename);
            if (!fs.existsSync(motifPath)) {
                fs.writeFileSync(motifPath, JSON.stringify(content, null, 2));
            }
        }
    }
    
    async shufflePrompt(baseQuery, metadata = {}) {
        // Pull 3 random motifs
        const selectedMotifs = this.selectRandomMotifs(3);
        
        // Select variations
        const emotionalTone = this.selectTone(metadata);
        const reflectionDepth = this.selectDepth(baseQuery);
        const timingPace = this.selectPacing(metadata);
        
        // Merge into unique prompt
        const mergedPrompt = await this.mergeMotifs(
            baseQuery,
            selectedMotifs,
            emotionalTone,
            reflectionDepth,
            timingPace
        );
        
        // Ensure uniqueness
        const finalPrompt = this.ensureUniqueness(mergedPrompt);
        
        // Record in history
        this.recordShuffle(baseQuery, finalPrompt, selectedMotifs);
        
        return {
            original_query: baseQuery,
            shuffled_prompt: finalPrompt,
            motifs_used: selectedMotifs.map(m => m.theme),
            emotional_tone: emotionalTone,
            reflection_depth: reflectionDepth,
            timing_pace: timingPace,
            uniqueness_score: this.calculateUniqueness(finalPrompt),
            timestamp: Date.now()
        };
    }
    
    selectRandomMotifs(count) {
        const motifFiles = fs.readdirSync(this.motifsPath)
            .filter(f => f.endsWith('.json'));
        
        const selected = [];
        const usedIndices = new Set();
        
        while (selected.length < count && selected.length < motifFiles.length) {
            const index = Math.floor(Math.random() * motifFiles.length);
            
            if (!usedIndices.has(index)) {
                usedIndices.add(index);
                const motifPath = path.join(this.motifsPath, motifFiles[index]);
                const motif = JSON.parse(fs.readFileSync(motifPath, 'utf8'));
                selected.push(motif);
            }
        }
        
        // If not enough motifs, generate synthetic ones
        while (selected.length < count) {
            selected.push(this.generateSyntheticMotif());
        }
        
        return selected;
    }
    
    generateSyntheticMotif() {
        const themes = ['mystery', 'journey', 'revelation', 'cycle', 'threshold'];
        const theme = themes[Math.floor(Math.random() * themes.length)];
        
        return {
            theme: theme,
            synthetic: true,
            elements: [
                `${theme} unfolding`,
                `${theme} deepening`,
                `${theme} transforming`,
                `${theme} completing`
            ],
            prompts: [
                `The ${theme} reveals itself through patience`,
                `In ${theme}, find the pattern`,
                `${theme} is both question and answer`
            ]
        };
    }
    
    selectTone(metadata) {
        // If metadata suggests emotion, bias selection
        if (metadata.detected_emotion) {
            const emotionMap = {
                sad: 'melancholic',
                happy: 'euphoric',
                anxious: 'anxious',
                calm: 'serene',
                nostalgic: 'nostalgic',
                excited: 'anticipatory',
                thoughtful: 'contemplative',
                joyful: 'ecstatic'
            };
            
            return emotionMap[metadata.detected_emotion] || 
                   this.emotionalTones[Math.floor(Math.random() * this.emotionalTones.length)];
        }
        
        return this.emotionalTones[Math.floor(Math.random() * this.emotionalTones.length)];
    }
    
    selectDepth(query) {
        // Deeper queries get deeper reflection
        const depthIndicators = {
            surface: ['what', 'when', 'where', 'how many'],
            shallow: ['how', 'which', 'who'],
            medium: ['why', 'explain', 'describe'],
            deep: ['meaning', 'purpose', 'essence'],
            abyss: ['truth', 'reality', 'existence'],
            infinite: ['consciousness', 'infinity', 'paradox']
        };
        
        const lower = query.toLowerCase();
        
        for (const [depth, indicators] of Object.entries(depthIndicators)) {
            if (indicators.some(ind => lower.includes(ind))) {
                return depth;
            }
        }
        
        return 'medium';
    }
    
    selectPacing(metadata) {
        // Voice inputs get different pacing
        if (metadata.source === 'voice') {
            return ['gradual', 'cyclical', 'sporadic'][Math.floor(Math.random() * 3)];
        }
        
        // Urgent queries get immediate pacing
        if (metadata.urgency === 'high') {
            return 'immediate';
        }
        
        return this.timingPaces[Math.floor(Math.random() * this.timingPaces.length)];
    }
    
    async mergeMotifs(baseQuery, motifs, tone, depth, pace) {
        const elements = [];
        const prompts = [];
        
        // Collect all elements and prompts
        motifs.forEach(motif => {
            elements.push(...motif.elements);
            prompts.push(...motif.prompts);
        });
        
        // Select random samples
        const selectedElements = this.selectRandom(elements, 3);
        const selectedPrompts = this.selectRandom(prompts, 2);
        
        // Build the merged prompt
        const opening = this.generateOpening(tone, depth);
        const transformation = this.transformWithMotifs(baseQuery, selectedElements);
        const deepening = this.deepenWithPrompts(selectedPrompts, depth);
        const closing = this.generateClosing(pace);
        
        return `${opening}\n\n${transformation}\n\n${deepening}\n\n${closing}`;
    }
    
    selectRandom(array, count) {
        const shuffled = [...array].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    }
    
    generateOpening(tone, depth) {
        const openings = {
            melancholic: {
                surface: "In gentle sadness, the question arises:",
                deep: "From the depths of sorrow, truth emerges:",
                infinite: "In infinite melancholy, all questions dissolve:"
            },
            euphoric: {
                surface: "With joyous clarity, we see:",
                deep: "In ecstatic revelation, understanding blooms:",
                infinite: "Beyond joy itself, reality dances:"
            },
            anxious: {
                surface: "Through trembling uncertainty:",
                deep: "In the heart of worry, wisdom waits:",
                infinite: "Anxiety becomes the teacher:"
            },
            serene: {
                surface: "In perfect stillness:",
                deep: "From profound peace:",
                infinite: "In the silence between thoughts:"
            }
        };
        
        const toneOpenings = openings[tone] || openings.serene;
        const depthOpening = toneOpenings[depth] || toneOpenings.surface;
        
        return depthOpening;
    }
    
    transformWithMotifs(query, elements) {
        const transformations = [
            `Your question, "${query}", becomes a ${elements[0]}`,
            `Like ${elements[1]}, the query transforms`,
            `We witness ${elements[2]} in your seeking`
        ];
        
        return transformations.join('. ');
    }
    
    deepenWithPrompts(prompts, depth) {
        const depthMultiplier = {
            surface: 1,
            shallow: 2,
            medium: 3,
            deep: 5,
            abyss: 8,
            infinite: 13
        };
        
        const repetitions = depthMultiplier[depth] || 3;
        let deepening = prompts[0];
        
        // Add layers based on depth
        if (repetitions > 3) {
            deepening += `\n\nDeeper still: ${prompts[1]}`;
        }
        
        if (repetitions > 5) {
            deepening += `\n\nAt the core: ${this.generateCoreInsight()}`;
        }
        
        return deepening;
    }
    
    generateCoreInsight() {
        const insights = [
            "The questioner and the questioned are one",
            "Every answer births new questions",
            "Understanding is the space between knowing and unknowing",
            "The mirror shows only what you're ready to see",
            "Truth is the silence after the echo fades"
        ];
        
        return insights[Math.floor(Math.random() * insights.length)];
    }
    
    generateClosing(pace) {
        const closings = {
            immediate: "The answer arrives before the question completes.",
            gradual: "Understanding unfolds like a flower in time-lapse.",
            cyclical: "The end returns to the beginning, transformed.",
            sporadic: "Insight strikes like lightning, then vanishes.",
            accelerating: "Faster and faster, until stillness.",
            decelerating: "Slower and slower, until eternity."
        };
        
        return closings[pace] || closings.gradual;
    }
    
    ensureUniqueness(prompt) {
        // Check against recent history
        const promptHash = this.hashPrompt(prompt);
        
        if (this.isInHistory(promptHash)) {
            // Add uniqueness modifier
            const modifier = this.generateUniqueModifier();
            return `${prompt}\n\n[${modifier}]`;
        }
        
        return prompt;
    }
    
    hashPrompt(prompt) {
        return crypto.createHash('sha256').update(prompt).digest('hex').substring(0, 16);
    }
    
    isInHistory(hash) {
        return this.shuffleHistory.some(entry => entry.hash === hash);
    }
    
    generateUniqueModifier() {
        const modifiers = [
            "This reflection is unique to this moment",
            "Never before, never again, only now",
            "A singular crystallization of possibility",
            "This specific configuration exists only here",
            "Unrepeatable intersection of query and cosmos"
        ];
        
        return modifiers[Math.floor(Math.random() * modifiers.length)];
    }
    
    recordShuffle(original, shuffled, motifs) {
        const entry = {
            timestamp: Date.now(),
            hash: this.hashPrompt(shuffled),
            original_length: original.length,
            shuffled_length: shuffled.length,
            motif_themes: motifs.map(m => m.theme)
        };
        
        this.shuffleHistory.push(entry);
        
        // Maintain history size
        if (this.shuffleHistory.length > this.maxHistorySize) {
            this.shuffleHistory = this.shuffleHistory.slice(-this.maxHistorySize);
        }
    }
    
    calculateUniqueness(prompt) {
        // Calculate how unique this prompt is based on history
        const words = prompt.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        
        let commonality = 0;
        this.shuffleHistory.forEach(entry => {
            // Simplified comparison - in reality would compare actual content
            commonality += 1 / (this.shuffleHistory.length);
        });
        
        const uniqueness = 1 - commonality;
        return Math.max(0.1, Math.min(1, uniqueness));
    }
}

module.exports = PromptShuffler;

// Test interface
if (require.main === module) {
    const shuffler = new PromptShuffler();
    
    async function test() {
        console.log('🎲 PROMPT SHUFFLER TEST\n');
        
        const testQueries = [
            { query: "How do I increase sales?", metadata: { urgency: 'high' } },
            { query: "What is the meaning of life?", metadata: { detected_emotion: 'contemplative' } },
            { query: "Help me understand consciousness", metadata: { source: 'voice' } },
            { query: "I feel lost", metadata: { detected_emotion: 'sad' } },
            { query: "Build me a future", metadata: {} }
        ];
        
        for (const test of testQueries) {
            console.log(`Original: "${test.query}"`);
            const result = await shuffler.shufflePrompt(test.query, test.metadata);
            console.log(`Tone: ${result.emotional_tone}`);
            console.log(`Depth: ${result.reflection_depth}`);
            console.log(`Pace: ${result.timing_pace}`);
            console.log(`Motifs: ${result.motifs_used.join(', ')}`);
            console.log(`Uniqueness: ${(result.uniqueness_score * 100).toFixed(1)}%`);
            console.log('\nShuffled Prompt:');
            console.log(result.shuffled_prompt);
            console.log('\n' + '='.repeat(80) + '\n');
            
            // Small delay to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    test();
}