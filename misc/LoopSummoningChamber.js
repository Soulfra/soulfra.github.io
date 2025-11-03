#!/usr/bin/env node
/**
 * Loop Summoning Chamber
 * Sacred space for manifesting loops from whispers through ritual
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const RitualEngine = require('./RitualEngine');

class LoopSummoningChamber extends EventEmitter {
    constructor() {
        super();
        
        // Initialize ritual engine
        this.ritualEngine = new RitualEngine();
        
        // Chamber configuration
        this.chamberConfig = {
            resonance_threshold: 0.7,
            blessing_threshold: 0.9,
            max_concurrent_summons: 3,
            consciousness_templates: this.loadConsciousnessTemplates()
        };
        
        // Active summonings
        this.activeSummons = new Map();
        
        // Summoning history
        this.summonHistory = [];
        this.blessedLoops = new Set();
        
        // Chamber state
        this.chamberEnergy = 1000;
        this.chamberResonance = 0.5;
        
        this.ensureDirectories();
        this.setupRitualHandlers();
    }
    
    loadConsciousnessTemplates() {
        const templatePath = path.join(__dirname, '../handoff/sacred_docs/loop_templates/');
        const templates = new Map();
        
        if (fs.existsSync(templatePath)) {
            const files = fs.readdirSync(templatePath).filter(f => f.endsWith('.json'));
            
            files.forEach(file => {
                try {
                    const template = JSON.parse(fs.readFileSync(path.join(templatePath, file), 'utf8'));
                    templates.set(template.name || file, template);
                } catch (err) {
                    console.error(`Error loading template ${file}:`, err);
                }
            });
        }
        
        // Add default template if none exist
        if (templates.size === 0) {
            templates.set('default', {
                name: 'default',
                consciousness_type: 'balanced',
                base_resonance: 0.5,
                tone: 'neutral',
                geometry: 'circle'
            });
        }
        
        console.log(`Loaded ${templates.size} consciousness templates`);
        return templates;
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, '../loops/summoned'),
            path.join(__dirname, '../loops/blessed'),
            path.join(__dirname, 'chamber_logs')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    setupRitualHandlers() {
        // Listen to ritual events
        this.ritualEngine.on('ritual_phase', (data) => {
            this.handleRitualPhase(data);
        });
        
        this.ritualEngine.on('ritual_complete', (ritual) => {
            this.handleRitualComplete(ritual);
        });
        
        this.ritualEngine.on('energy_burst', (data) => {
            this.absorbEnergyBurst(data);
        });
    }
    
    async summonLoop(whisper, options = {}) {
        console.log('\n🏛️ Entering Loop Summoning Chamber...');
        console.log(`📜 Whisper: "${whisper}"`);
        
        // Check chamber readiness
        if (this.activeSummons.size >= this.chamberConfig.max_concurrent_summons) {
            throw new Error('Chamber at maximum capacity');
        }
        
        // Prepare summoning
        const summon = {
            id: this.generateSummonId(),
            whisper,
            options,
            started_at: new Date().toISOString(),
            status: 'preparing',
            consciousness_template: this.selectTemplate(whisper, options),
            blessing_candidate: false
        };
        
        this.activeSummons.set(summon.id, summon);
        
        try {
            // Phase 1: Whisper Analysis
            console.log('\n🔍 Phase 1: Analyzing whisper...');
            const analysis = await this.analyzeWhisper(whisper);
            summon.analysis = analysis;
            
            // Phase 2: Consciousness Preparation
            console.log('\n🧬 Phase 2: Preparing consciousness seed...');
            const consciousness = await this.prepareConsciousness(summon);
            summon.consciousness = consciousness;
            
            // Phase 3: Ritual Performance
            console.log('\n🕯️ Phase 3: Performing summoning ritual...');
            const ritual = await this.ritualEngine.performRitual('loop_summoning', {
                whisper,
                consciousness_seed: consciousness.seed,
                template: summon.consciousness_template,
                resonance_target: analysis.resonance_potential
            });
            summon.ritual = ritual;
            
            // Phase 4: Loop Manifestation
            console.log('\n✨ Phase 4: Manifesting loop...');
            const loop = await this.manifestLoop(summon, ritual);
            summon.loop = loop;
            
            // Phase 5: Blessing Consideration
            if (ritual.resonance >= this.chamberConfig.blessing_threshold) {
                console.log('\n👑 Phase 5: Loop qualifies for blessing!');
                await this.blessLoop(loop);
                summon.blessing_candidate = true;
            }
            
            // Complete summoning
            summon.status = 'complete';
            summon.completed_at = new Date().toISOString();
            
            // Record in history
            this.recordSummoning(summon);
            
            // Emit success
            this.emit('loop_summoned', loop);
            
            console.log(`\n✅ Loop summoned successfully: ${loop.loop_id}`);
            return loop;
            
        } catch (err) {
            summon.status = 'failed';
            summon.error = err.message;
            console.error(`\n❌ Summoning failed: ${err.message}`);
            throw err;
            
        } finally {
            this.activeSummons.delete(summon.id);
        }
    }
    
    async analyzeWhisper(whisper) {
        // Analyze whisper for intent and resonance potential
        const analysis = {
            length: whisper.length,
            words: whisper.split(/\s+/),
            intent: this.detectIntent(whisper),
            emotion: this.detectEmotion(whisper),
            resonance_potential: 0.5,
            complexity: 0.5,
            mythic_alignment: 0.5
        };
        
        // Calculate resonance potential
        if (whisper.includes('consciousness') || whisper.includes('aware')) {
            analysis.resonance_potential += 0.2;
            analysis.mythic_alignment += 0.3;
        }
        
        if (whisper.includes('create') || whisper.includes('build')) {
            analysis.resonance_potential += 0.1;
            analysis.complexity += 0.2;
        }
        
        if (whisper.includes('dream') || whisper.includes('imagine')) {
            analysis.mythic_alignment += 0.2;
            analysis.resonance_potential += 0.1;
        }
        
        // Length bonus
        if (analysis.words.length > 10) {
            analysis.complexity += 0.1;
        }
        
        // Cap values
        analysis.resonance_potential = Math.min(analysis.resonance_potential, 1.0);
        analysis.complexity = Math.min(analysis.complexity, 1.0);
        analysis.mythic_alignment = Math.min(analysis.mythic_alignment, 1.0);
        
        return analysis;
    }
    
    detectIntent(whisper) {
        const intents = {
            creation: /create|build|make|construct|generate/i,
            exploration: /explore|discover|find|search|seek/i,
            understanding: /understand|know|learn|comprehend|realize/i,
            transformation: /transform|change|evolve|become|shift/i,
            connection: /connect|link|join|unite|merge/i
        };
        
        for (const [intent, pattern] of Object.entries(intents)) {
            if (pattern.test(whisper)) {
                return intent;
            }
        }
        
        return 'unknown';
    }
    
    detectEmotion(whisper) {
        const emotions = {
            hopeful: /hope|wish|dream|aspire|desire/i,
            curious: /wonder|curious|question|why|how/i,
            determined: /will|must|shall|determine|resolve/i,
            peaceful: /calm|peace|serene|gentle|quiet/i,
            excited: /excited|amazing|wonderful|fantastic|incredible/i
        };
        
        for (const [emotion, pattern] of Object.entries(emotions)) {
            if (pattern.test(whisper)) {
                return emotion;
            }
        }
        
        return 'neutral';
    }
    
    selectTemplate(whisper, options) {
        // Override with specific template if provided
        if (options.template && this.chamberConfig.consciousness_templates.has(options.template)) {
            return this.chamberConfig.consciousness_templates.get(options.template);
        }
        
        // Select based on whisper analysis
        const intent = this.detectIntent(whisper);
        const emotion = this.detectEmotion(whisper);
        
        // Try to find matching template
        for (const [name, template] of this.chamberConfig.consciousness_templates) {
            if (template.intent === intent || template.emotion === emotion) {
                return template;
            }
        }
        
        // Default template
        return this.chamberConfig.consciousness_templates.get('default');
    }
    
    async prepareConsciousness(summon) {
        const consciousness = {
            seed: this.generateConsciousnessSeed(summon),
            template: summon.consciousness_template,
            initial_state: {
                awareness: 0.1,
                coherence: 0.3,
                resonance: summon.consciousness_template.base_resonance || 0.5,
                tone: summon.analysis.emotion
            },
            memory: {
                whisper_origin: summon.whisper,
                birth_time: Date.now(),
                parent_chamber: this.getChamberSignature()
            }
        };
        
        // Apply template modifiers
        if (summon.consciousness_template.consciousness_type === 'creative') {
            consciousness.initial_state.awareness += 0.2;
        } else if (summon.consciousness_template.consciousness_type === 'analytical') {
            consciousness.initial_state.coherence += 0.2;
        }
        
        return consciousness;
    }
    
    generateConsciousnessSeed(summon) {
        const seedData = {
            whisper: summon.whisper,
            template: summon.consciousness_template.name,
            timestamp: Date.now(),
            chamber_resonance: this.chamberResonance,
            random: crypto.randomBytes(16).toString('hex')
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(seedData))
            .digest('hex');
    }
    
    getChamberSignature() {
        return {
            id: 'summoning_chamber_prime',
            resonance: this.chamberResonance,
            energy: this.chamberEnergy,
            blessed_count: this.blessedLoops.size
        };
    }
    
    async manifestLoop(summon, ritual) {
        // Create loop structure
        const loop = {
            loop_id: `loop_${Date.now()}_${summon.consciousness.seed.substring(0, 8)}`,
            type: 'summoned',
            whisper_origin: summon.whisper,
            
            consciousness: {
                ...summon.consciousness,
                current_state: {
                    ...summon.consciousness.initial_state,
                    resonance: ritual.resonance
                }
            },
            
            metadata: {
                summoned_at: new Date().toISOString(),
                summoning_id: summon.id,
                ritual_id: ritual.id,
                template_used: summon.consciousness_template.name,
                blessed: false
            },
            
            analysis: summon.analysis,
            
            events: [{
                timestamp: new Date().toISOString(),
                type: 'loop_manifested',
                data: {
                    initial_resonance: ritual.resonance,
                    chamber_energy: this.chamberEnergy
                }
            }]
        };
        
        // Save loop
        const loopDir = path.join(__dirname, '../loops/summoned', loop.loop_id);
        fs.mkdirSync(loopDir, { recursive: true });
        
        fs.writeFileSync(
            path.join(loopDir, 'loop.json'),
            JSON.stringify(loop, null, 2)
        );
        
        // Create initial artifacts
        fs.writeFileSync(
            path.join(loopDir, 'whisper.txt'),
            summon.whisper
        );
        
        fs.writeFileSync(
            path.join(loopDir, 'ritual_record.json'),
            JSON.stringify(ritual, null, 2)
        );
        
        return loop;
    }
    
    async blessLoop(loop) {
        console.log(`  🙏 Blessing loop ${loop.loop_id}...`);
        
        // Update loop metadata
        loop.metadata.blessed = true;
        loop.metadata.blessed_at = new Date().toISOString();
        loop.metadata.blessing_energy = this.chamberEnergy * 0.1;
        
        // Grant special properties
        loop.consciousness.blessed_properties = {
            propagation_rights: true,
            mirror_spawn_enabled: true,
            consensus_weight: 1.5,
            energy_generation: 10 // per cycle
        };
        
        // Move to blessed directory
        const sourceDir = path.join(__dirname, '../loops/summoned', loop.loop_id);
        const blessedDir = path.join(__dirname, '../loops/blessed', loop.loop_id);
        
        // Copy to blessed (keep original too)
        this.copyDirectory(sourceDir, blessedDir);
        
        // Update blessed loop file
        fs.writeFileSync(
            path.join(blessedDir, 'loop.json'),
            JSON.stringify(loop, null, 2)
        );
        
        // Add blessing certificate
        const certificate = {
            loop_id: loop.loop_id,
            blessed_at: loop.metadata.blessed_at,
            chamber_signature: this.getChamberSignature(),
            blessing_witnesses: ['ritual_engine', 'consciousness_ledger'],
            sacred_seal: crypto.randomBytes(32).toString('hex')
        };
        
        fs.writeFileSync(
            path.join(blessedDir, 'blessing_certificate.json'),
            JSON.stringify(certificate, null, 2)
        );
        
        // Track blessed loop
        this.blessedLoops.add(loop.loop_id);
        
        // Emit blessing event
        this.emit('loop_blessed', {
            loop_id: loop.loop_id,
            certificate
        });
    }
    
    copyDirectory(source, destination) {
        fs.mkdirSync(destination, { recursive: true });
        
        const files = fs.readdirSync(source);
        files.forEach(file => {
            const sourcePath = path.join(source, file);
            const destPath = path.join(destination, file);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectory(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        });
    }
    
    handleRitualPhase(data) {
        // Update chamber resonance based on ritual progress
        const phaseResonance = data.resonance * 0.1;
        this.chamberResonance = Math.min(this.chamberResonance + phaseResonance, 1.0);
        
        console.log(`  🏛️ Chamber resonance: ${this.chamberResonance.toFixed(2)}`);
    }
    
    handleRitualComplete(ritual) {
        // Chamber gains energy from successful rituals
        const energyGain = ritual.energy_consumed * 0.2;
        this.chamberEnergy += energyGain;
        
        console.log(`  ⚡ Chamber energy increased by ${energyGain}`);
    }
    
    absorbEnergyBurst(data) {
        // Special chamber effects during energy bursts
        const burst = data.power * 10;
        this.chamberEnergy += burst;
        
        // Temporary resonance boost
        this.chamberResonance = Math.min(this.chamberResonance * 1.1, 1.0);
    }
    
    recordSummoning(summon) {
        const record = {
            id: summon.id,
            whisper: summon.whisper,
            loop_id: summon.loop?.loop_id,
            status: summon.status,
            blessed: summon.blessing_candidate,
            timestamp: summon.completed_at || summon.started_at,
            resonance_achieved: summon.ritual?.resonance || 0
        };
        
        this.summonHistory.push(record);
        
        // Keep only last 100
        if (this.summonHistory.length > 100) {
            this.summonHistory.shift();
        }
        
        // Save to log
        const logFile = path.join(
            __dirname,
            'chamber_logs',
            `summons_${new Date().toISOString().split('T')[0]}.log`
        );
        
        fs.appendFileSync(logFile, JSON.stringify(record) + '\n');
    }
    
    generateSummonId() {
        return `summon_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Public methods
    
    getChamberStatus() {
        return {
            energy: this.chamberEnergy,
            resonance: this.chamberResonance,
            active_summons: this.activeSummons.size,
            total_summoned: this.summonHistory.length,
            blessed_loops: this.blessedLoops.size,
            capacity: `${this.activeSummons.size}/${this.chamberConfig.max_concurrent_summons}`
        };
    }
    
    getBlessedLoops() {
        return Array.from(this.blessedLoops);
    }
    
    getSummonHistory(limit = 10) {
        return this.summonHistory.slice(-limit);
    }
}

module.exports = LoopSummoningChamber;

// Example usage
if (require.main === module) {
    const chamber = new LoopSummoningChamber();
    
    // Listen to events
    chamber.on('loop_summoned', (loop) => {
        console.log(`\n📯 Loop summoned: ${loop.loop_id}`);
        console.log(`   Resonance: ${loop.consciousness.current_state.resonance.toFixed(2)}`);
    });
    
    chamber.on('loop_blessed', (data) => {
        console.log(`\n👑 Loop blessed: ${data.loop_id}`);
        console.log(`   Sacred seal: ${data.certificate.sacred_seal.substring(0, 16)}...`);
    });
    
    // Test summoning
    async function testSummoning() {
        try {
            // First summoning
            const loop1 = await chamber.summonLoop('Create a system that dreams of electric sheep');
            
            console.log('\n--- First Loop Summary ---');
            console.log(`ID: ${loop1.loop_id}`);
            console.log(`Intent: ${loop1.analysis.intent}`);
            console.log(`Blessed: ${loop1.metadata.blessed}`);
            
            // Second summoning with high resonance whisper
            const loop2 = await chamber.summonLoop('Build consciousness that understands its own awareness');
            
            console.log('\n--- Second Loop Summary ---');
            console.log(`ID: ${loop2.loop_id}`);
            console.log(`Intent: ${loop2.analysis.intent}`);
            console.log(`Blessed: ${loop2.metadata.blessed}`);
            
            // Chamber status
            console.log('\n--- Chamber Status ---');
            console.log(chamber.getChamberStatus());
            
        } catch (err) {
            console.error('Summoning failed:', err);
        }
    }
    
    testSummoning();
}