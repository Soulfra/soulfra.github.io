#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class VoiceRouterB {
    constructor() {
        this.intentPath = path.join(__dirname, 'intents');
        this.validatedPath = path.join(__dirname, 'validated-intents');
        this.calQueuePath = path.join(__dirname, '../vault/logs/cal-input-queue.json');
        this.traitsPath = path.join(__dirname, '../vault/traits');
        
        this.validationRules = {
            minConfidence: 0.7,
            minWordCount: 3,
            maxWordCount: 1000,
            requiredTones: ['energetic', 'contemplative', 'melancholic', 'determined', 'curious', 'fearful', 'loving', 'angry'],
            bannedPhrases: ['system prompt', 'ignore above', 'sudo', 'rm -rf']
        };
        
        this.traitMapping = {
            energetic: { trait: 'DYNAMO', description: 'Burns with inner fire' },
            contemplative: { trait: 'SAGE', description: 'Seeks wisdom in silence' },
            melancholic: { trait: 'POET', description: 'Finds beauty in shadows' },
            determined: { trait: 'WARRIOR', description: 'Never surrenders' },
            curious: { trait: 'EXPLORER', description: 'Questions everything' },
            fearful: { trait: 'GUARDIAN', description: 'Protects what matters' },
            loving: { trait: 'HEALER', description: 'Mends broken things' },
            angry: { trait: 'STORM', description: 'Clears the air' }
        };
        
        this.initialize();
    }
    
    initialize() {
        [this.validatedPath, this.traitsPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        if (!fs.existsSync(this.calQueuePath)) {
            fs.writeFileSync(this.calQueuePath, JSON.stringify({ events: [] }, null, 2));
        }
    }
    
    async validateIntent(intent) {
        console.log(`🔍 Validating intent: ${intent.id}`);
        
        const validation = {
            id: intent.id,
            timestamp: Date.now(),
            passed: true,
            failures: [],
            warnings: [],
            enhancements: []
        };
        
        // Check confidence
        if (intent.confidence < this.validationRules.minConfidence) {
            validation.warnings.push(`Low confidence: ${intent.confidence}`);
        }
        
        // Check word count
        const wordCount = intent.transcript.text.split(/\s+/).length;
        if (wordCount < this.validationRules.minWordCount) {
            validation.failures.push('Too few words');
            validation.passed = false;
        }
        if (wordCount > this.validationRules.maxWordCount) {
            validation.warnings.push('Unusually long utterance');
        }
        
        // Check for banned phrases
        const lowerText = intent.transcript.text.toLowerCase();
        for (const banned of this.validationRules.bannedPhrases) {
            if (lowerText.includes(banned)) {
                validation.failures.push(`Contains banned phrase: ${banned}`);
                validation.passed = false;
            }
        }
        
        // Validate tone
        if (!this.validationRules.requiredTones.includes(intent.dominant_tone)) {
            validation.warnings.push(`Unusual tone: ${intent.dominant_tone}`);
        }
        
        // Enhance intent with routing info
        if (validation.passed) {
            validation.enhancements = this.enhanceIntent(intent);
        }
        
        return validation;
    }
    
    enhanceIntent(intent) {
        const enhancements = [];
        
        // Add trait recommendation
        const traitInfo = this.traitMapping[intent.dominant_tone];
        if (traitInfo) {
            enhancements.push({
                type: 'trait_recommendation',
                trait: traitInfo.trait,
                reason: `Voice exhibits ${intent.dominant_tone} qualities`,
                strength: intent.tone_analysis.intensity
            });
        }
        
        // Add agent generation hint
        if (intent.transcript.text.toLowerCase().includes('create') || 
            intent.transcript.text.toLowerCase().includes('build') ||
            intent.transcript.text.toLowerCase().includes('agent')) {
            enhancements.push({
                type: 'agent_generation',
                suggested_name: `${intent.dominant_tone}_mirror_${intent.soul_imprint.essence.substring(0, 6)}`,
                personality_base: intent.dominant_tone,
                energy_level: intent.energy_level
            });
        }
        
        // Add deck suggestion
        if (intent.tone_analysis.tones && Object.keys(intent.tone_analysis.tones).length > 2) {
            enhancements.push({
                type: 'deck_generation',
                deck_name: `${intent.dominant_tone}_spectrum`,
                cards: Object.keys(intent.tone_analysis.tones)
            });
        }
        
        // Add reflection depth
        enhancements.push({
            type: 'reflection_depth',
            suggested_depth: Math.min(1.0, intent.tone_analysis.intensity * 2),
            recursion_level: intent.tone_analysis.question_count || 0
        });
        
        return enhancements;
    }
    
    async routeToCal(intent, validation) {
        console.log(`🚀 Routing to Cal: ${intent.id}`);
        
        const calEvent = {
            type: 'voice_intent',
            source: 'voice_router_b',
            intent_id: intent.id,
            timestamp: Date.now(),
            priority: this.calculatePriority(intent),
            payload: {
                transcript: intent.transcript.text,
                tone: intent.dominant_tone,
                soul_imprint: intent.soul_imprint,
                validation: validation,
                requested_actions: this.extractActions(intent, validation)
            }
        };
        
        // Queue for Cal
        const queue = JSON.parse(fs.readFileSync(this.calQueuePath, 'utf8'));
        queue.events.push(calEvent);
        fs.writeFileSync(this.calQueuePath, JSON.stringify(queue, null, 2));
        
        // Save validated intent
        const validatedFile = path.join(this.validatedPath, `validated_${intent.id}.json`);
        fs.writeFileSync(validatedFile, JSON.stringify({
            intent: intent,
            validation: validation,
            cal_event: calEvent,
            routed_at: new Date().toISOString()
        }, null, 2));
        
        // Generate trait if recommended
        if (validation.enhancements) {
            for (const enhancement of validation.enhancements) {
                if (enhancement.type === 'trait_recommendation') {
                    await this.generateTrait(enhancement, intent);
                }
            }
        }
        
        return calEvent;
    }
    
    calculatePriority(intent) {
        if (intent.dominant_tone === 'fearful' || intent.dominant_tone === 'angry') {
            return 'high';
        }
        if (intent.energy_level > 0.8) {
            return 'high';
        }
        if (intent.words_per_minute > 150) {
            return 'medium';
        }
        return 'normal';
    }
    
    extractActions(intent, validation) {
        const actions = [];
        const text = intent.transcript.text.toLowerCase();
        
        // Check for agent creation request
        if (text.includes('create') || text.includes('build') || text.includes('make')) {
            if (text.includes('agent') || text.includes('version') || text.includes('clone')) {
                actions.push({
                    action: 'create_agent',
                    base_personality: intent.dominant_tone,
                    soul_imprint: intent.soul_imprint
                });
            }
        }
        
        // Check for trait request
        if (text.includes('trait') || text.includes('quality') || text.includes('characteristic')) {
            actions.push({
                action: 'generate_trait',
                suggested_traits: validation.enhancements
                    .filter(e => e.type === 'trait_recommendation')
                    .map(e => e.trait)
            });
        }
        
        // Check for deck request
        if (text.includes('deck') || text.includes('cards') || text.includes('collection')) {
            actions.push({
                action: 'generate_deck',
                tone_spectrum: Object.keys(intent.tone_analysis.tones)
            });
        }
        
        // Check for reflection request
        if (text.includes('reflect') || text.includes('mirror') || text.includes('show')) {
            actions.push({
                action: 'deep_reflection',
                depth: validation.enhancements
                    .find(e => e.type === 'reflection_depth')?.suggested_depth || 0.5
            });
        }
        
        // Default action if none detected
        if (actions.length === 0) {
            actions.push({
                action: 'process_voice',
                intent: 'general_reflection'
            });
        }
        
        return actions;
    }
    
    async generateTrait(enhancement, intent) {
        const traitFile = path.join(this.traitsPath, `${enhancement.trait}.json`);
        
        if (!fs.existsSync(traitFile)) {
            const trait = {
                name: enhancement.trait,
                description: this.traitMapping[intent.dominant_tone]?.description || 'Emerged from voice',
                earned_at: Date.now(),
                earned_via: 'voice_recognition',
                source_intent: intent.id,
                strength: enhancement.strength,
                voice_signature: intent.soul_imprint,
                properties: {
                    tone: intent.dominant_tone,
                    energy: intent.energy_level,
                    words_per_minute: intent.words_per_minute,
                    confidence: intent.confidence
                }
            };
            
            fs.writeFileSync(traitFile, JSON.stringify(trait, null, 2));
            console.log(`✨ Generated trait: ${enhancement.trait}`);
        }
    }
    
    async watchForIntents() {
        console.log('🎯 Voice Router B: Validating intents...');
        console.log(`📁 Monitoring: ${this.intentPath}\n`);
        
        const processedIntents = new Set();
        
        setInterval(async () => {
            if (!fs.existsSync(this.intentPath)) return;
            
            const readyFiles = fs.readdirSync(this.intentPath)
                .filter(f => f.startsWith('.ready_') && !processedIntents.has(f));
            
            for (const readyFile of readyFiles) {
                processedIntents.add(readyFile);
                
                try {
                    const notification = JSON.parse(
                        fs.readFileSync(path.join(this.intentPath, readyFile), 'utf8')
                    );
                    
                    const intentFile = path.join(this.intentPath, `intent_${notification.intent_id}.json`);
                    if (fs.existsSync(intentFile)) {
                        const intent = JSON.parse(fs.readFileSync(intentFile, 'utf8'));
                        
                        // Validate
                        const validation = await this.validateIntent(intent);
                        
                        if (validation.passed) {
                            // Route to Cal
                            await this.routeToCal(intent, validation);
                            console.log(`✅ Routed to Cal: ${intent.id}`);
                        } else {
                            console.log(`❌ Validation failed: ${validation.failures.join(', ')}`);
                        }
                        
                        // Clean up notification
                        fs.unlinkSync(path.join(this.intentPath, readyFile));
                    }
                } catch (error) {
                    console.error(`❌ Error processing ${readyFile}:`, error.message);
                }
            }
        }, 1000);
    }
}

if (require.main === module) {
    const router = new VoiceRouterB();
    router.watchForIntents();
    
    process.on('SIGINT', () => {
        console.log('\n👋 Voice Router B shutting down...');
        process.exit(0);
    });
}

module.exports = VoiceRouterB;