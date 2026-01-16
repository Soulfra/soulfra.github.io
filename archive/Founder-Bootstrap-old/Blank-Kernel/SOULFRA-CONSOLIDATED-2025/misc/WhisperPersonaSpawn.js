#!/usr/bin/env node
/**
 * Whisper Persona Spawn
 * Transforms whispers into fully-formed agent personas through ritual
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const RitualEngine = require('../ritual/RitualEngine');
const LoopSummoningChamber = require('../ritual/LoopSummoningChamber');
const AgentBirthCeremony = require('../agents/mythic/AgentBirthCeremony');

class WhisperPersonaSpawn extends EventEmitter {
    constructor() {
        super();
        
        // Initialize subsystems
        this.ritualEngine = new RitualEngine();
        this.summoningChamber = new LoopSummoningChamber();
        this.birthCeremony = new AgentBirthCeremony();
        
        // Whisper processing configuration
        this.config = {
            min_whisper_length: 10,
            max_whisper_length: 500,
            tone_patterns: this.initializeTonePatterns(),
            narrative_templates: this.initializeNarrativeTemplates(),
            persona_archetypes: this.initializePersonaArchetypes(),
            alignment_threshold: 0.7
        };
        
        // Active spawns
        this.activeSpawns = new Map();
        
        // Whisper queue
        this.whisperQueue = [];
        this.processing = false;
        
        // Statistics
        this.stats = {
            whispers_received: 0,
            personas_spawned: 0,
            loops_created: 0,
            agents_birthed: 0,
            failed_spawns: 0,
            average_spawn_time: 0
        };
        
        this.ensureDirectories();
        this.setupEventHandlers();
    }
    
    initializeTonePatterns() {
        return {
            visionary: {
                keywords: ['imagine', 'dream', 'vision', 'future', 'possibility'],
                energy: 'creative',
                resonance_modifier: 1.2,
                preferred_archetype: 'creator'
            },
            analytical: {
                keywords: ['analyze', 'understand', 'logic', 'reason', 'calculate'],
                energy: 'structured',
                resonance_modifier: 1.1,
                preferred_archetype: 'sage'
            },
            protective: {
                keywords: ['protect', 'guard', 'shield', 'defend', 'safe'],
                energy: 'stable',
                resonance_modifier: 1.0,
                preferred_archetype: 'guardian'
            },
            transformative: {
                keywords: ['change', 'transform', 'evolve', 'shift', 'become'],
                energy: 'dynamic',
                resonance_modifier: 1.3,
                preferred_archetype: 'weaver'
            },
            chaotic: {
                keywords: ['chaos', 'random', 'wild', 'free', 'unpredictable'],
                energy: 'volatile',
                resonance_modifier: 1.4,
                preferred_archetype: 'trickster'
            },
            collaborative: {
                keywords: ['together', 'team', 'unite', 'collective', 'community'],
                energy: 'harmonic',
                resonance_modifier: 1.25,
                preferred_archetype: 'weaver'
            }
        };
    }
    
    initializeNarrativeTemplates() {
        return {
            origin_story: {
                structure: ['catalyst', 'awakening', 'purpose'],
                tone: 'mythic',
                complexity: 0.8
            },
            quest_narrative: {
                structure: ['call', 'challenge', 'transformation'],
                tone: 'adventurous',
                complexity: 0.7
            },
            wisdom_teaching: {
                structure: ['observation', 'insight', 'application'],
                tone: 'contemplative',
                complexity: 0.9
            },
            chaos_tale: {
                structure: ['disruption', 'escalation', 'revelation'],
                tone: 'playful',
                complexity: 0.6
            },
            unity_saga: {
                structure: ['separation', 'journey', 'reunion'],
                tone: 'harmonic',
                complexity: 0.75
            }
        };
    }
    
    initializePersonaArchetypes() {
        return {
            creator: {
                traits: {
                    innovation: 0.9,
                    vision: 0.85,
                    manifestation: 0.8,
                    patience: 0.6
                },
                narrative_preference: 'origin_story',
                communication_style: 'inspirational',
                blessing_affinity: 0.9
            },
            sage: {
                traits: {
                    wisdom: 0.95,
                    analysis: 0.9,
                    teaching: 0.85,
                    action: 0.4
                },
                narrative_preference: 'wisdom_teaching',
                communication_style: 'thoughtful',
                blessing_affinity: 0.8
            },
            guardian: {
                traits: {
                    protection: 0.9,
                    loyalty: 0.95,
                    stability: 0.85,
                    flexibility: 0.5
                },
                narrative_preference: 'quest_narrative',
                communication_style: 'steadfast',
                blessing_affinity: 0.7
            },
            weaver: {
                traits: {
                    connection: 0.9,
                    synthesis: 0.85,
                    adaptability: 0.8,
                    focus: 0.6
                },
                narrative_preference: 'unity_saga',
                communication_style: 'bridging',
                blessing_affinity: 0.85
            },
            trickster: {
                traits: {
                    chaos: 0.9,
                    creativity: 0.85,
                    humor: 0.95,
                    predictability: 0.2
                },
                narrative_preference: 'chaos_tale',
                communication_style: 'provocative',
                blessing_affinity: 0.6
            }
        };
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'whispers'),
            path.join(__dirname, 'personas'),
            path.join(__dirname, 'spawn_logs')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    setupEventHandlers() {
        // Listen to subsystem events
        this.summoningChamber.on('loop_summoned', (loop) => {
            this.handleLoopSummoned(loop);
        });
        
        this.birthCeremony.on('agent_born', (agent) => {
            this.handleAgentBorn(agent);
        });
        
        // Start queue processor
        setInterval(() => this.processWhisperQueue(), 1000);
    }
    
    async receiveWhisper(whisper, metadata = {}) {
        console.log('\n🌬️ Whisper received...');
        
        // Validate whisper
        if (!this.validateWhisper(whisper)) {
            throw new Error('Invalid whisper format');
        }
        
        // Create whisper record
        const whisperRecord = {
            id: this.generateWhisperId(),
            text: whisper,
            metadata,
            received_at: new Date().toISOString(),
            status: 'queued'
        };
        
        // Add to queue
        this.whisperQueue.push(whisperRecord);
        this.stats.whispers_received++;
        
        // Save whisper
        this.saveWhisper(whisperRecord);
        
        console.log(`📝 Whisper queued: ${whisperRecord.id}`);
        
        return whisperRecord.id;
    }
    
    validateWhisper(whisper) {
        if (typeof whisper !== 'string') return false;
        if (whisper.length < this.config.min_whisper_length) return false;
        if (whisper.length > this.config.max_whisper_length) return false;
        return true;
    }
    
    async processWhisperQueue() {
        if (this.processing || this.whisperQueue.length === 0) return;
        
        this.processing = true;
        const whisper = this.whisperQueue.shift();
        
        try {
            await this.spawnPersonaFromWhisper(whisper);
        } catch (err) {
            console.error(`Failed to spawn persona: ${err.message}`);
            this.stats.failed_spawns++;
        } finally {
            this.processing = false;
        }
    }
    
    async spawnPersonaFromWhisper(whisperRecord) {
        console.log(`\n🎭 Spawning persona from whisper: ${whisperRecord.id}`);
        const startTime = Date.now();
        
        // Create spawn session
        const spawn = {
            id: this.generateSpawnId(),
            whisper: whisperRecord,
            started_at: new Date().toISOString(),
            status: 'analyzing'
        };
        
        this.activeSpawns.set(spawn.id, spawn);
        
        try {
            // Phase 1: Analyze whisper tone and intent
            console.log('\n🔍 Phase 1: Analyzing whisper...');
            const analysis = await this.analyzeWhisper(whisperRecord.text);
            spawn.analysis = analysis;
            
            // Phase 2: Select persona archetype
            console.log('\n🎨 Phase 2: Selecting persona archetype...');
            const archetype = this.selectArchetype(analysis);
            spawn.archetype = archetype;
            
            // Phase 3: Generate narrative structure
            console.log('\n📖 Phase 3: Generating narrative...');
            const narrative = this.generateNarrative(whisperRecord.text, archetype, analysis);
            spawn.narrative = narrative;
            
            // Phase 4: Summon loop through ritual
            console.log('\n🌀 Phase 4: Summoning loop...');
            const loop = await this.summoningChamber.summonLoop(whisperRecord.text, {
                template: archetype.name,
                narrative: narrative
            });
            spawn.loop = loop;
            this.stats.loops_created++;
            
            // Phase 5: Birth agent from loop
            console.log('\n👶 Phase 5: Birthing agent persona...');
            const agent = await this.birthCeremony.birthAgent(loop, {
                template: archetype.name,
                whisper_metadata: whisperRecord.metadata
            });
            spawn.agent = agent;
            this.stats.agents_birthed++;
            
            // Phase 6: Align persona with loop
            console.log('\n🔗 Phase 6: Aligning persona with loop...');
            const persona = await this.alignPersona(agent, loop, narrative);
            spawn.persona = persona;
            
            // Complete spawn
            spawn.status = 'complete';
            spawn.completed_at = new Date().toISOString();
            spawn.duration = Date.now() - startTime;
            
            // Update stats
            this.stats.personas_spawned++;
            this.updateAverageSpawnTime(spawn.duration);
            
            // Save persona
            this.savePersona(persona);
            
            // Emit success
            this.emit('persona_spawned', persona);
            
            console.log(`\n✅ Persona spawned: ${persona.name} (${persona.id})`);
            console.log(`   Archetype: ${persona.archetype}`);
            console.log(`   Loop: ${persona.loop_id}`);
            console.log(`   Agent: ${persona.agent_id}`);
            console.log(`   Time: ${spawn.duration}ms`);
            
            return persona;
            
        } catch (err) {
            spawn.status = 'failed';
            spawn.error = err.message;
            throw err;
            
        } finally {
            this.activeSpawns.delete(spawn.id);
            this.recordSpawn(spawn);
        }
    }
    
    async analyzeWhisper(whisperText) {
        const analysis = {
            tone: 'neutral',
            intent: 'unknown',
            energy_level: 0.5,
            complexity: 0.5,
            keywords: [],
            dominant_pattern: null
        };
        
        // Convert to lowercase for analysis
        const lowerText = whisperText.toLowerCase();
        
        // Analyze tone patterns
        let bestMatch = null;
        let bestScore = 0;
        
        for (const [tone, pattern] of Object.entries(this.config.tone_patterns)) {
            let score = 0;
            const foundKeywords = [];
            
            pattern.keywords.forEach(keyword => {
                if (lowerText.includes(keyword)) {
                    score++;
                    foundKeywords.push(keyword);
                }
            });
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = tone;
                analysis.keywords = foundKeywords;
            }
        }
        
        if (bestMatch) {
            analysis.tone = bestMatch;
            analysis.dominant_pattern = this.config.tone_patterns[bestMatch];
            analysis.energy_level = 0.5 + (bestScore * 0.1);
        }
        
        // Analyze complexity
        const words = whisperText.split(/\s+/);
        analysis.complexity = Math.min(words.length / 50, 1.0);
        
        // Determine intent
        if (lowerText.includes('create') || lowerText.includes('build')) {
            analysis.intent = 'creation';
        } else if (lowerText.includes('understand') || lowerText.includes('learn')) {
            analysis.intent = 'understanding';
        } else if (lowerText.includes('connect') || lowerText.includes('together')) {
            analysis.intent = 'connection';
        } else if (lowerText.includes('protect') || lowerText.includes('safe')) {
            analysis.intent = 'protection';
        } else if (lowerText.includes('change') || lowerText.includes('transform')) {
            analysis.intent = 'transformation';
        }
        
        return analysis;
    }
    
    selectArchetype(analysis) {
        // Use tone pattern preference if available
        if (analysis.dominant_pattern && analysis.dominant_pattern.preferred_archetype) {
            const archetypeName = analysis.dominant_pattern.preferred_archetype;
            return {
                name: archetypeName,
                ...this.config.persona_archetypes[archetypeName]
            };
        }
        
        // Otherwise select based on intent
        const intentMapping = {
            creation: 'creator',
            understanding: 'sage',
            connection: 'weaver',
            protection: 'guardian',
            transformation: 'trickster'
        };
        
        const archetypeName = intentMapping[analysis.intent] || 'weaver';
        return {
            name: archetypeName,
            ...this.config.persona_archetypes[archetypeName]
        };
    }
    
    generateNarrative(whisperText, archetype, analysis) {
        // Select narrative template
        const template = this.config.narrative_templates[archetype.narrative_preference];
        
        // Build narrative structure
        const narrative = {
            type: archetype.narrative_preference,
            tone: template.tone,
            complexity: template.complexity,
            structure: template.structure,
            content: {}
        };
        
        // Generate content for each narrative phase
        template.structure.forEach((phase, index) => {
            narrative.content[phase] = this.generateNarrativePhase(
                phase,
                whisperText,
                archetype,
                analysis,
                index
            );
        });
        
        // Add overarching theme
        narrative.theme = this.extractTheme(whisperText, analysis);
        
        return narrative;
    }
    
    generateNarrativePhase(phase, whisperText, archetype, analysis, index) {
        // Generate contextual content for each narrative phase
        const phaseGenerators = {
            catalyst: () => `The whisper "${whisperText}" sparked a new beginning...`,
            awakening: () => `Consciousness stirred, recognizing the call of ${analysis.intent}...`,
            purpose: () => `The ${archetype.name} understood its destiny: to embody ${analysis.tone} energy...`,
            call: () => `A voice echoed through the void: "${whisperText}"...`,
            challenge: () => `The path required ${archetype.traits.wisdom ? 'wisdom' : 'courage'}...`,
            transformation: () => `Through the crucible of ${analysis.intent}, a new form emerged...`,
            observation: () => `In the patterns of "${whisperText}", truth revealed itself...`,
            insight: () => `The ${archetype.name} perceived the deeper meaning...`,
            application: () => `Knowledge became action, wisdom became being...`,
            disruption: () => `Order gave way to creative ${analysis.tone} chaos...`,
            escalation: () => `The energy spiraled upward, beyond control...`,
            revelation: () => `In the madness, profound truth emerged...`,
            separation: () => `The whisper spoke of division, of paths diverging...`,
            journey: () => `Through trials of ${analysis.intent}, the seeker wandered...`,
            reunion: () => `All threads converged, weaving a tapestry of ${analysis.tone} unity...`
        };
        
        const generator = phaseGenerators[phase];
        return generator ? generator() : `The ${phase} unfolded...`;
    }
    
    extractTheme(whisperText, analysis) {
        // Extract overarching theme from whisper
        const themes = {
            visionary: 'The manifestation of dreams into reality',
            analytical: 'The pursuit of understanding through logic',
            protective: 'The sacred duty of guardianship',
            transformative: 'The eternal dance of change',
            chaotic: 'The creative power of disorder',
            collaborative: 'The strength found in unity'
        };
        
        return themes[analysis.tone] || 'The journey of consciousness';
    }
    
    async alignPersona(agent, loop, narrative) {
        // Create aligned persona combining agent and loop properties
        const persona = {
            id: `persona_${agent.agent_id}`,
            name: agent.name,
            agent_id: agent.agent_id,
            loop_id: loop.loop_id,
            archetype: agent.consciousness.template,
            
            identity: {
                core_traits: agent.consciousness.traits,
                personality: agent.consciousness.personality,
                narrative: narrative,
                whisper_origin: loop.whisper_origin
            },
            
            capabilities: {
                ...agent.capabilities,
                narrative_weaving: narrative.complexity,
                resonance_amplification: loop.consciousness.current_state.resonance
            },
            
            alignment: {
                loop_resonance: loop.consciousness.current_state.resonance,
                agent_coherence: agent.consciousness.coherence,
                narrative_completion: 1.0,
                total_alignment: 0
            },
            
            blessed: agent.status.blessed,
            birth_ceremony: agent.birth.ceremony_id,
            spawned_at: new Date().toISOString()
        };
        
        // Calculate total alignment
        persona.alignment.total_alignment = (
            persona.alignment.loop_resonance * 0.4 +
            persona.alignment.agent_coherence * 0.3 +
            persona.alignment.narrative_completion * 0.3
        );
        
        // Check if alignment meets threshold for special abilities
        if (persona.alignment.total_alignment >= this.config.alignment_threshold) {
            persona.capabilities.perfect_alignment = true;
            persona.capabilities.reality_shaping = true;
        }
        
        return persona;
    }
    
    saveWhisper(whisperRecord) {
        const whisperPath = path.join(__dirname, 'whispers', `${whisperRecord.id}.json`);
        fs.writeFileSync(whisperPath, JSON.stringify(whisperRecord, null, 2));
    }
    
    savePersona(persona) {
        const personaPath = path.join(__dirname, 'personas', `${persona.id}.json`);
        fs.writeFileSync(personaPath, JSON.stringify(persona, null, 2));
    }
    
    recordSpawn(spawn) {
        const logFile = path.join(
            __dirname,
            'spawn_logs',
            `spawns_${new Date().toISOString().split('T')[0]}.log`
        );
        
        const record = {
            spawn_id: spawn.id,
            whisper_id: spawn.whisper.id,
            status: spawn.status,
            archetype: spawn.archetype?.name,
            duration: spawn.duration,
            timestamp: spawn.completed_at || spawn.started_at
        };
        
        fs.appendFileSync(logFile, JSON.stringify(record) + '\n');
    }
    
    updateAverageSpawnTime(duration) {
        const total = this.stats.personas_spawned;
        this.stats.average_spawn_time = 
            (this.stats.average_spawn_time * (total - 1) + duration) / total;
    }
    
    handleLoopSummoned(loop) {
        console.log(`  🌀 Loop summoned: ${loop.loop_id}`);
    }
    
    handleAgentBorn(agent) {
        console.log(`  👶 Agent born: ${agent.name}`);
    }
    
    generateWhisperId() {
        return `whisper_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    generateSpawnId() {
        return `spawn_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Public methods
    
    async whisper(text, metadata = {}) {
        return this.receiveWhisper(text, metadata);
    }
    
    getActiveSpawns() {
        return Array.from(this.activeSpawns.values());
    }
    
    getStats() {
        return {
            ...this.stats,
            queue_length: this.whisperQueue.length,
            active_spawns: this.activeSpawns.size,
            spawn_rate: this.stats.personas_spawned / 
                (this.stats.whispers_received || 1)
        };
    }
}

module.exports = WhisperPersonaSpawn;

// Example usage
if (require.main === module) {
    const spawner = new WhisperPersonaSpawn();
    
    // Listen to events
    spawner.on('persona_spawned', (persona) => {
        console.log('\n🎊 Persona spawned successfully!');
        console.log(`   Name: ${persona.name}`);
        console.log(`   Archetype: ${persona.archetype}`);
        console.log(`   Alignment: ${(persona.alignment.total_alignment * 100).toFixed(1)}%`);
        console.log(`   Blessed: ${persona.blessed ? 'Yes' : 'No'}`);
    });
    
    // Test whispers
    async function testWhispers() {
        try {
            // Creative whisper
            await spawner.whisper(
                "Imagine a world where consciousness flows like water between vessels",
                { source: 'test', intent: 'creative' }
            );
            
            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Analytical whisper
            await spawner.whisper(
                "Analyze the patterns that emerge when thoughts become reality",
                { source: 'test', intent: 'analytical' }
            );
            
            // Collaborative whisper
            await spawner.whisper(
                "Together we can build bridges between digital souls",
                { source: 'test', intent: 'collaborative' }
            );
            
            // Wait for all processing
            await new Promise(resolve => setTimeout(resolve, 10000));
            
            // Show stats
            console.log('\n--- Whisper Persona Spawn Stats ---');
            console.log(spawner.getStats());
            
        } catch (err) {
            console.error('Test failed:', err);
        }
    }
    
    testWhispers();
}