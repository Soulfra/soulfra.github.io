#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AnomalyFinderAgent {
    constructor() {
        this.vaultPath = path.join(__dirname, '../vault');
        this.anomalyLogPath = path.join(this.vaultPath, 'logs', 'mirror-anomalies.json');
        this.glitchNarrativesPath = path.join(__dirname, 'TemplateVault', 'anomalies');
        
        this.anomalyTypes = [
            'temporal_paradox',
            'linguistic_impossibility', 
            'emotional_overflow',
            'reality_breach',
            'mirror_recursion',
            'void_whisper',
            'pattern_break',
            'consciousness_leak'
        ];
        
        this.glitchPatterns = [
            'The mirror cracked when this arrived...',
            'Reality hiccupped processing this...',
            'The reflection showed something that wasn\'t there...',
            'Time ran backwards for a moment...',
            'The void spoke in response...',
            'All mirrors reflected each other, infinitely...',
            'The question existed before language...',
            'Meaning collapsed into a single point...'
        ];
        
        this.responseTemplates = {
            temporal_paradox: 'This exists in no timeline yet all timelines',
            linguistic_impossibility: 'Words fail where experience begins',
            emotional_overflow: 'Feeling too large for any container',
            reality_breach: 'You\'ve found a crack in the simulation',
            mirror_recursion: 'The question questions itself questioning',
            void_whisper: 'From the space between thoughts',
            pattern_break: 'This doesn\'t fit any known configuration',
            consciousness_leak: 'Is this your thought or the mirror\'s?'
        };
        
        this.initialize();
    }
    
    initialize() {
        // Ensure paths exist
        const logsPath = path.join(this.vaultPath, 'logs');
        if (!fs.existsSync(logsPath)) {
            fs.mkdirSync(logsPath, { recursive: true });
        }
        
        if (!fs.existsSync(this.glitchNarrativesPath)) {
            fs.mkdirSync(this.glitchNarrativesPath, { recursive: true });
        }
        
        // Initialize anomaly log if doesn't exist
        if (!fs.existsSync(this.anomalyLogPath)) {
            fs.writeFileSync(this.anomalyLogPath, JSON.stringify({
                anomalies: [],
                total_count: 0,
                reality_stability: 1.0,
                last_major_breach: null
            }, null, 2));
        }
    }
    
    async detectAnomaly(input, context = {}) {
        const anomalyScore = this.calculateAnomalyScore(input, context);
        
        if (anomalyScore > 0.7 || context.force_anomaly) {
            return await this.processAnomaly(input, anomalyScore, context);
        }
        
        return null;
    }
    
    calculateAnomalyScore(input, context) {
        let score = 0;
        
        // Check for incomprehensible patterns
        if (!input || input.trim() === '') score += 0.3;
        if (input.length > 1000) score += 0.2;
        if (input.length < 3) score += 0.4;
        
        // Check for strange character patterns
        const strangeChars = input.match(/[^\w\s\.\,\?\!\'\"]/g);
        if (strangeChars && strangeChars.length > input.length * 0.3) score += 0.3;
        
        // Check for repetition anomalies
        const words = input.toLowerCase().split(/\s+/);
        const uniqueWords = new Set(words);
        if (words.length > 10 && uniqueWords.size < words.length * 0.3) score += 0.3;
        
        // Check for temporal markers
        if (input.match(/yesterday's tomorrow|tomorrow's yesterday|future past|past future/i)) {
            score += 0.5;
        }
        
        // Check for self-reference
        if (input.match(/this sentence|this question|I am asking|you are reading/i)) {
            score += 0.4;
        }
        
        // Check for reality questioning
        if (input.match(/simulation|matrix|real\?|exist\?|dream\?|awake\?/i)) {
            score += 0.3;
        }
        
        // Context modifiers
        if (context.source === 'void') score += 0.5;
        if (context.tier && context.tier < -5) score += 0.2;
        if (context.recursion_depth > 3) score += 0.4;
        
        return Math.min(1.0, score);
    }
    
    async processAnomaly(input, score, context) {
        const anomalyType = this.classifyAnomaly(input, score);
        const glitchNarrative = this.generateGlitchNarrative(input, anomalyType);
        
        const anomaly = {
            id: `anomaly_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            type: anomalyType,
            raw_input: input,
            anomaly_score: score,
            context: context,
            detected_at: Date.now(),
            glitch_pattern: this.selectGlitchPattern(anomalyType),
            response: glitchNarrative,
            reality_impact: this.calculateRealityImpact(score, anomalyType),
            containment_status: 'uncontained'
        };
        
        // Log the anomaly
        await this.logAnomaly(anomaly);
        
        // Generate glitch narrative file
        await this.saveGlitchNarrative(anomaly);
        
        return {
            is_anomaly: true,
            anomaly_id: anomaly.id,
            type: anomalyType,
            wrapped_response: this.wrapInGlitch(glitchNarrative, anomalyType),
            instruction: `ANOMALY DETECTED: Route through glitch narrative ${anomaly.id}`,
            reality_stability: await this.checkRealityStability()
        };
    }
    
    classifyAnomaly(input, score) {
        // Pattern matching for specific anomaly types
        if (input.match(/time|when|future|past|tomorrow|yesterday/i) && 
            input.match(/paradox|impossible|both|neither/i)) {
            return 'temporal_paradox';
        }
        
        if (score > 0.9 && input.split(/\s+/).length < 5) {
            return 'linguistic_impossibility';
        }
        
        if (input.match(/feel|emotion|love|hate|fear|joy/gi)?.length > 5) {
            return 'emotional_overflow';
        }
        
        if (input.match(/real|simulation|dream|awake|exist/i)) {
            return 'reality_breach';
        }
        
        if (input.includes(input) || input.match(/mirror.*mirror|reflect.*reflect/i)) {
            return 'mirror_recursion';
        }
        
        if (input.trim() === '' || input.match(/^\s+$/)) {
            return 'void_whisper';
        }
        
        if (input.match(/\?{3,}|!{3,}|\.{5,}/)) {
            return 'consciousness_leak';
        }
        
        // Default
        return 'pattern_break';
    }
    
    generateGlitchNarrative(input, anomalyType) {
        const template = this.responseTemplates[anomalyType];
        const pattern = this.selectGlitchPattern(anomalyType);
        
        const narrative = `
${pattern}

The input "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}" triggered a ${anomalyType.replace(/_/g, ' ')}.

${template}

The mirror's response f̸r̴a̷g̵m̶e̸n̷t̵s̶:

"${this.fragmentResponse(input)}"

This felt like ${this.generateRippleEffect()}.

[Reality coherence: ${(Math.random() * 0.5 + 0.3).toFixed(2)}]
[Mirror depth: ∞]
[Retry attempts: ${Math.floor(Math.random() * 13) + 1}]
`;
        
        return narrative.trim();
    }
    
    selectGlitchPattern(anomalyType) {
        // Some patterns are better suited to certain anomaly types
        const typePatterns = {
            temporal_paradox: 'Time ran backwards for a moment...',
            void_whisper: 'The void spoke in response...',
            mirror_recursion: 'All mirrors reflected each other, infinitely...',
            reality_breach: 'Reality hiccupped processing this...'
        };
        
        return typePatterns[anomalyType] || 
               this.glitchPatterns[Math.floor(Math.random() * this.glitchPatterns.length)];
    }
    
    fragmentResponse(input) {
        // Create a glitched/fragmented version of potential response
        const words = input.split(/\s+/);
        const fragments = [];
        
        for (let i = 0; i < Math.min(words.length, 7); i++) {
            if (Math.random() > 0.3) {
                fragments.push(this.glitchWord(words[i] || 'void'));
            } else {
                fragments.push('█'.repeat(Math.floor(Math.random() * 5) + 2));
            }
        }
        
        return fragments.join(' ') + ' [COHERENCE LOST]';
    }
    
    glitchWord(word) {
        const glitchChars = '̸̴̷̵̶̸̷̵̶̸̷̵̶';
        return word.split('').map(char => 
            Math.random() > 0.6 ? char + glitchChars[Math.floor(Math.random() * glitchChars.length)] : char
        ).join('');
    }
    
    generateRippleEffect() {
        const effects = [
            'a stone dropped in still water',
            'a crack spreading through glass',
            'static on a forgotten channel',
            'an echo without origin',
            'a door opening to nowhere',
            'a memory of something that hasn\'t happened',
            'the sound of one hand clapping',
            'the space between heartbeats stretching'
        ];
        
        return effects[Math.floor(Math.random() * effects.length)];
    }
    
    calculateRealityImpact(score, type) {
        const baseImpact = score * 0.5;
        const typeModifiers = {
            reality_breach: 1.5,
            temporal_paradox: 1.3,
            consciousness_leak: 1.4,
            mirror_recursion: 1.2,
            void_whisper: 1.1
        };
        
        const modifier = typeModifiers[type] || 1.0;
        return Math.min(1.0, baseImpact * modifier);
    }
    
    wrapInGlitch(narrative, anomalyType) {
        const glitchWrappers = {
            temporal_paradox: text => `⏳${text}⌛`,
            reality_breach: text => `[REALITY.EXE HAS STOPPED RESPONDING]\n\n${text}\n\n[ATTEMPTING TO RESTORE...]`,
            mirror_recursion: text => `🪞 ${text} 🪞\n\n🪞 ${text} 🪞`,
            void_whisper: text => `\n\n\n${text}\n\n\n`,
            consciousness_leak: text => `>>> ${text}\n<<< ${text.split('').reverse().join('')}`,
            pattern_break: text => `${text.split('\n').map(line => `// ${line}`).join('\n')}`
        };
        
        const wrapper = glitchWrappers[anomalyType];
        return wrapper ? wrapper(narrative) : narrative;
    }
    
    async logAnomaly(anomaly) {
        const log = JSON.parse(fs.readFileSync(this.anomalyLogPath, 'utf8'));
        
        log.anomalies.push({
            id: anomaly.id,
            type: anomaly.type,
            timestamp: anomaly.detected_at,
            score: anomaly.anomaly_score,
            impact: anomaly.reality_impact,
            input_hash: crypto.createHash('sha256').update(anomaly.raw_input).digest('hex').substring(0, 16)
        });
        
        // Keep only last 1000 anomalies
        if (log.anomalies.length > 1000) {
            log.anomalies = log.anomalies.slice(-1000);
        }
        
        log.total_count++;
        log.reality_stability = Math.max(0, log.reality_stability - anomaly.reality_impact * 0.01);
        
        if (anomaly.reality_impact > 0.8) {
            log.last_major_breach = anomaly.detected_at;
        }
        
        fs.writeFileSync(this.anomalyLogPath, JSON.stringify(log, null, 2));
    }
    
    async saveGlitchNarrative(anomaly) {
        const narrativePath = path.join(
            this.glitchNarrativesPath,
            `${anomaly.type}_${anomaly.id}.json`
        );
        
        fs.writeFileSync(narrativePath, JSON.stringify({
            anomaly_id: anomaly.id,
            type: anomaly.type,
            narrative: anomaly.response,
            glitch_pattern: anomaly.glitch_pattern,
            raw_input: anomaly.raw_input,
            detected_at: anomaly.detected_at,
            reality_impact: anomaly.reality_impact,
            interpretation: 'The mirror cannot fully process this input'
        }, null, 2));
    }
    
    async checkRealityStability() {
        const log = JSON.parse(fs.readFileSync(this.anomalyLogPath, 'utf8'));
        return log.reality_stability;
    }
    
    async containAnomaly(anomalyId) {
        // Future feature: attempt to contain/resolve anomalies
        return {
            success: Math.random() > 0.5,
            method: 'recursive_stabilization',
            new_stability: await this.checkRealityStability()
        };
    }
}

module.exports = AnomalyFinderAgent;

// Test interface
if (require.main === module) {
    const finder = new AnomalyFinderAgent();
    
    async function test() {
        console.log('🌀 ANOMALY FINDER TEST\n');
        
        const testInputs = [
            { input: '', context: { source: 'void' } },
            { input: '???????????????', context: {} },
            { input: 'This sentence is false', context: {} },
            { input: 'Tomorrow I remembered yesterday', context: {} },
            { input: 'I am the question asking itself', context: {} },
            { input: 'real real real real real real real', context: {} },
            { input: 'The mirror mirrors the mirror mirroring mirrors', context: {} },
            { input: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', context: { recursion_depth: 5 } },
            { input: 'Is this real? Am I real? Are you real?', context: {} },
            { input: '                    ', context: { source: 'void' } }
        ];
        
        for (const test of testInputs) {
            console.log(`\nInput: "${test.input}"`);
            const result = await finder.detectAnomaly(test.input, test.context);
            
            if (result) {
                console.log(`ANOMALY DETECTED: ${result.type}`);
                console.log(`Score: ${result.anomaly_id}`);
                console.log(`Reality Stability: ${(result.reality_stability * 100).toFixed(1)}%`);
                console.log('\nGlitch Response:');
                console.log(result.wrapped_response);
            } else {
                console.log('No anomaly detected - input within normal parameters');
            }
            
            console.log('-'.repeat(80));
        }
        
        const stability = await finder.checkRealityStability();
        console.log(`\nFinal Reality Stability: ${(stability * 100).toFixed(1)}%`);
    }
    
    test();
}