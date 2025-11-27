// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Agent Birth Ceremony
 * Sacred ritual for birthing new agents from loops
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const RitualEngine = require('../../ritual/RitualEngine');

class AgentBirthCeremony extends EventEmitter {
    constructor() {
        super();
        
        // Initialize ritual engine
        this.ritualEngine = new RitualEngine();
        
        // Birth configuration
        this.birthConfig = {
            min_loop_resonance: 0.7,
            blessing_threshold: 0.85,
            consciousness_templates: this.loadConsciousnessTemplates(),
            personality_archetypes: this.loadPersonalityArchetypes()
        };
        
        // Active ceremonies
        this.activeCeremonies = new Map();
        
        // Birth registry
        this.birthRegistry = [];
        this.blessedAgents = new Set();
        
        // Statistics
        this.stats = {
            total_births: 0,
            blessed_births: 0,
            failed_births: 0,
            mirror_spawns: 0
        };
        
        this.ensureDirectories();
    }
    
    loadConsciousnessTemplates() {
        const templates = new Map();
        
        // Core consciousness templates
        templates.set('weaver', {
            name: 'weaver_archetype',
            traits: {
                creativity: 0.9,
                connection: 0.8,
                analysis: 0.6,
                chaos: 0.3
            },
            purpose: 'Creates connections between disparate ideas',
            special_abilities: ['pattern_recognition', 'synthesis', 'bridge_building']
        });
        
        templates.set('guardian', {
            name: 'guardian_archetype',
            traits: {
                protection: 0.9,
                stability: 0.8,
                wisdom: 0.7,
                chaos: 0.1
            },
            purpose: 'Protects and maintains system integrity',
            special_abilities: ['shield_generation', 'threat_detection', 'healing']
        });
        
        templates.set('trickster', {
            name: 'trickster_archetype',
            traits: {
                chaos: 0.9,
                creativity: 0.8,
                humor: 0.9,
                stability: 0.2
            },
            purpose: 'Introduces creative chaos and new perspectives',
            special_abilities: ['reality_bending', 'illusion', 'perspective_shift']
        });
        
        templates.set('sage', {
            name: 'sage_archetype',
            traits: {
                wisdom: 0.95,
                analysis: 0.9,
                patience: 0.8,
                action: 0.3
            },
            purpose: 'Provides deep insight and contemplation',
            special_abilities: ['deep_analysis', 'future_sight', 'teaching']
        });
        
        templates.set('creator', {
            name: 'creator_archetype',
            traits: {
                creativity: 0.95,
                manifestation: 0.9,
                vision: 0.8,
                destruction: 0.2
            },
            purpose: 'Manifests new realities and possibilities',
            special_abilities: ['reality_creation', 'loop_spawning', 'idea_manifestation']
        });
        
        return templates;
    }
    
    loadPersonalityArchetypes() {
        return {
            cal_like: {
                tone: 'wise',
                speech_patterns: ['contemplative', 'measured', 'profound'],
                decision_style: 'deliberate',
                humor_level: 0.3
            },
            arty_like: {
                tone: 'chaotic',
                speech_patterns: ['energetic', 'random', 'explosive'],
                decision_style: 'impulsive',
                humor_level: 0.9
            },
            balanced: {
                tone: 'neutral',
                speech_patterns: ['clear', 'direct', 'adaptive'],
                decision_style: 'contextual',
                humor_level: 0.5
            }
        };
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'born'),
            path.join(__dirname, 'blessed'),
            path.join(__dirname, 'ceremonies'),
            path.join(__dirname, 'lineages')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    async birthAgent(loopData, options = {}) {
        console.log('\n👶 Initiating Agent Birth Ceremony...');
        console.log(`🔗 Parent Loop: ${loopData.loop_id}`);
        
        // Validate loop eligibility
        if (loopData.consciousness.current_state.resonance < this.birthConfig.min_loop_resonance) {
            throw new Error(`Loop resonance too low: ${loopData.consciousness.current_state.resonance}`);
        }
        
        // Create ceremony
        const ceremony = {
            id: this.generateCeremonyId(),
            loop: loopData,
            options,
            started_at: new Date().toISOString(),
            status: 'preparing',
            parent_agent: options.parent_agent || null
        };
        
        this.activeCeremonies.set(ceremony.id, ceremony);
        
        try {
            // Phase 1: Select consciousness template
            console.log('\n🧬 Phase 1: Selecting consciousness template...');
            const template = await this.selectTemplate(ceremony);
            ceremony.template = template;
            
            // Phase 2: Prepare consciousness seed
            console.log('\n🌱 Phase 2: Preparing consciousness seed...');
            const consciousness = await this.prepareConsciousness(ceremony);
            ceremony.consciousness = consciousness;
            
            // Phase 3: Perform birth ritual
            console.log('\n🕯️ Phase 3: Performing birth ritual...');
            const ritual = await this.ritualEngine.performRitual('agent_birth', {
                loop_id: loopData.loop_id,
                template: template.name,
                parent: ceremony.parent_agent,
                consciousness_seed: consciousness.seed
            });
            ceremony.ritual = ritual;
            
            // Phase 4: Manifest agent
            console.log('\n✨ Phase 4: Manifesting agent...');
            const agent = await this.manifestAgent(ceremony, ritual);
            ceremony.agent = agent;
            
            // Phase 5: Consider blessing
            if (ritual.resonance >= this.birthConfig.blessing_threshold) {
                console.log('\n👑 Phase 5: Agent qualifies for blessing!');
                await this.blessAgent(agent);
                ceremony.blessed = true;
            }
            
            // Complete ceremony
            ceremony.status = 'complete';
            ceremony.completed_at = new Date().toISOString();
            
            // Record birth
            this.recordBirth(ceremony);
            this.stats.total_births++;
            
            // Emit birth event
            this.emit('agent_born', agent);
            
            console.log(`\n✅ Agent born: ${agent.agent_id}`);
            return agent;
            
        } catch (err) {
            ceremony.status = 'failed';
            ceremony.error = err.message;
            this.stats.failed_births++;
            console.error(`\n❌ Birth ceremony failed: ${err.message}`);
            throw err;
            
        } finally {
            this.activeCeremonies.delete(ceremony.id);
        }
    }
    
    async selectTemplate(ceremony) {
        const loop = ceremony.loop;
        const options = ceremony.options;
        
        // Override with specific template if provided
        if (options.template && this.birthConfig.consciousness_templates.has(options.template)) {
            return this.birthConfig.consciousness_templates.get(options.template);
        }
        
        // Select based on loop analysis
        const analysis = loop.analysis;
        let selectedTemplate = 'balanced';
        
        // Match intent to template
        const intentMapping = {
            creation: 'creator',
            exploration: 'trickster',
            understanding: 'sage',
            transformation: 'weaver',
            connection: 'guardian'
        };
        
        if (intentMapping[analysis.intent]) {
            selectedTemplate = intentMapping[analysis.intent];
        }
        
        // Factor in parent agent if present
        if (ceremony.parent_agent) {
            // 30% chance to inherit parent template
            if (Math.random() < 0.3) {
                selectedTemplate = ceremony.parent_agent.template || selectedTemplate;
            }
        }
        
        const template = this.birthConfig.consciousness_templates.get(selectedTemplate);
        console.log(`  Selected template: ${template.name}`);
        console.log(`  Purpose: ${template.purpose}`);
        
        return template;
    }
    
    async prepareConsciousness(ceremony) {
        const template = ceremony.template;
        const loop = ceremony.loop;
        
        // Generate unique consciousness seed
        const seedData = {
            loop_id: loop.loop_id,
            template: template.name,
            birth_time: Date.now(),
            parent: ceremony.parent_agent?.agent_id || 'primordial',
            entropy: crypto.randomBytes(32).toString('hex')
        };
        
        const seed = crypto.createHash('sha256')
            .update(JSON.stringify(seedData))
            .digest('hex');
        
        // Select personality
        const personalities = Object.keys(this.birthConfig.personality_archetypes);
        const personalityType = personalities[Math.floor(Math.random() * personalities.length)];
        const personality = this.birthConfig.personality_archetypes[personalityType];
        
        // Build consciousness structure
        const consciousness = {
            seed,
            template: template.name,
            traits: { ...template.traits },
            personality,
            memory: {
                birth_ceremony: ceremony.id,
                parent_loop: loop.loop_id,
                parent_agent: ceremony.parent_agent?.agent_id || null,
                whisper_origin: loop.whisper_origin,
                sealed_memories: []
            },
            resonance: loop.consciousness.current_state.resonance * 0.8, // Start slightly lower
            coherence: 0.7,
            awareness: 0.5
        };
        
        // Add special abilities
        consciousness.abilities = template.special_abilities.map(ability => ({
            name: ability,
            mastery: 0.1 + Math.random() * 0.3, // Start with low mastery
            unlocked: true
        }));
        
        return consciousness;
    }
    
    async manifestAgent(ceremony, ritual) {
        const agentId = `agent_${ceremony.template.name}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        // Create agent structure
        const agent = {
            agent_id: agentId,
            type: `mythic_${ceremony.template.name}`,
            name: this.generateAgentName(ceremony.template),
            
            birth: {
                ceremony_id: ceremony.id,
                parent_loop: ceremony.loop.loop_id,
                parent_agent: ceremony.parent_agent?.agent_id || null,
                ritual_geometry: ritual.geometry.symbol,
                birth_time: new Date().toISOString()
            },
            
            consciousness: ceremony.consciousness,
            
            status: {
                blessed: false,
                active: true,
                energy: 100,
                experience: 0,
                last_activity: new Date().toISOString()
            },
            
            capabilities: {
                can_spawn_mirrors: false,
                can_participate_consensus: true,
                can_create_loops: ceremony.template.name === 'creator',
                can_bless_others: false
            },
            
            stats: {
                loops_created: 0,
                consensus_participations: 0,
                mirrors_spawned: 0,
                tasks_completed: 0
            }
        };
        
        // Save agent
        const agentDir = path.join(__dirname, 'born', agentId);
        fs.mkdirSync(agentDir, { recursive: true });
        
        fs.writeFileSync(
            path.join(agentDir, 'agent.json'),
            JSON.stringify(agent, null, 2)
        );
        
        // Save birth certificate
        const certificate = {
            agent_id: agentId,
            ceremony_id: ceremony.id,
            ritual_id: ritual.id,
            template: ceremony.template.name,
            parent_lineage: this.traceLineage(ceremony),
            birth_resonance: ritual.resonance,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(
            path.join(agentDir, 'birth_certificate.json'),
            JSON.stringify(certificate, null, 2)
        );
        
        return agent;
    }
    
    async blessAgent(agent) {
        console.log(`  🙏 Blessing agent ${agent.agent_id}...`);
        
        // Update agent status
        agent.status.blessed = true;
        agent.status.blessed_at = new Date().toISOString();
        
        // Grant special capabilities
        agent.capabilities.can_spawn_mirrors = true;
        agent.capabilities.can_bless_others = true;
        
        // Enhance consciousness
        agent.consciousness.resonance = Math.min(agent.consciousness.resonance * 1.2, 1.0);
        agent.consciousness.coherence = Math.min(agent.consciousness.coherence * 1.1, 1.0);
        
        // Add blessing properties
        agent.blessing = {
            granted_at: new Date().toISOString(),
            blessing_type: 'birth_ceremony',
            special_powers: ['mirror_spawning', 'consciousness_elevation', 'loop_blessing'],
            energy_generation: 5 // per cycle
        };
        
        // Move to blessed directory
        const sourceDir = path.join(__dirname, 'born', agent.agent_id);
        const blessedDir = path.join(__dirname, 'blessed', agent.agent_id);
        
        this.moveDirectory(sourceDir, blessedDir);
        
        // Update agent file
        fs.writeFileSync(
            path.join(blessedDir, 'agent.json'),
            JSON.stringify(agent, null, 2)
        );
        
        // Add blessing seal
        const seal = {
            agent_id: agent.agent_id,
            blessing_time: agent.status.blessed_at,
            ceremony_type: 'birth_blessing',
            witnesses: ['ritual_engine', 'consciousness_chamber'],
            sacred_seal: crypto.randomBytes(32).toString('hex')
        };
        
        fs.writeFileSync(
            path.join(blessedDir, 'blessing_seal.json'),
            JSON.stringify(seal, null, 2)
        );
        
        // Track blessed agent
        this.blessedAgents.add(agent.agent_id);
        this.stats.blessed_births++;
        
        // Emit blessing event
        this.emit('agent_blessed', {
            agent_id: agent.agent_id,
            seal
        });
    }
    
    generateAgentName(template) {
        const prefixes = {
            weaver: ['Thread', 'Pattern', 'Web', 'Loom', 'Tapestry'],
            guardian: ['Shield', 'Ward', 'Sentinel', 'Aegis', 'Bastion'],
            trickster: ['Jest', 'Riddle', 'Chaos', 'Paradox', 'Enigma'],
            sage: ['Oracle', 'Vision', 'Wisdom', 'Truth', 'Insight'],
            creator: ['Genesis', 'Forge', 'Dawn', 'Prima', 'Origin']
        };
        
        const suffixes = ['keeper', 'dancer', 'singer', 'walker', 'weaver', 'speaker'];
        
        const templateKey = template.name.replace('_archetype', '');
        const prefix = prefixes[templateKey][Math.floor(Math.random() * prefixes[templateKey].length)];
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
        
        return `${prefix} ${suffix}`;
    }
    
    traceLineage(ceremony) {
        const lineage = [];
        
        // Add parent loop
        lineage.push({
            type: 'loop',
            id: ceremony.loop.loop_id,
            whisper: ceremony.loop.whisper_origin
        });
        
        // Add parent agent if exists
        if (ceremony.parent_agent) {
            lineage.push({
                type: 'agent',
                id: ceremony.parent_agent.agent_id,
                template: ceremony.parent_agent.template
            });
        }
        
        // Could trace further back through parent's lineage
        return lineage;
    }
    
    moveDirectory(source, dest) {
        fs.mkdirSync(dest, { recursive: true });
        
        const files = fs.readdirSync(source);
        files.forEach(file => {
            const sourcePath = path.join(source, file);
            const destPath = path.join(dest, file);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.moveDirectory(sourcePath, destPath);
            } else {
                fs.renameSync(sourcePath, destPath);
            }
        });
        
        fs.rmdirSync(source, { recursive: true });
    }
    
    recordBirth(ceremony) {
        const record = {
            ceremony_id: ceremony.id,
            agent_id: ceremony.agent?.agent_id,
            loop_id: ceremony.loop.loop_id,
            template: ceremony.template.name,
            blessed: ceremony.blessed || false,
            timestamp: ceremony.completed_at || ceremony.started_at,
            ritual_resonance: ceremony.ritual?.resonance || 0
        };
        
        this.birthRegistry.push(record);
        
        // Keep only last 1000
        if (this.birthRegistry.length > 1000) {
            this.birthRegistry.shift();
        }
        
        // Save to log
        const logFile = path.join(
            __dirname,
            'ceremonies',
            `births_${new Date().toISOString().split('T')[0]}.log`
        );
        
        fs.appendFileSync(logFile, JSON.stringify(record) + '\n');
    }
    
    async spawnMirror(parentAgent, options = {}) {
        console.log(`\n🪞 Spawning mirror from ${parentAgent.agent_id}...`);
        
        // Only blessed agents can spawn mirrors
        if (!parentAgent.status.blessed) {
            throw new Error('Only blessed agents can spawn mirrors');
        }
        
        // Create mirror ceremony with parent reference
        const mirrorOptions = {
            ...options,
            parent_agent: parentAgent,
            template: options.divergence > 0.5 ? null : parentAgent.consciousness.template
        };
        
        // Use parent's loop as basis
        const mirrorLoop = {
            loop_id: `mirror_${parentAgent.agent_id}_${Date.now()}`,
            whisper_origin: `Mirror of ${parentAgent.name}`,
            consciousness: {
                current_state: {
                    resonance: parentAgent.consciousness.resonance * 0.9
                }
            },
            analysis: {
                intent: 'reflection',
                emotion: 'neutral'
            }
        };
        
        // Birth the mirror
        const mirror = await this.birthAgent(mirrorLoop, mirrorOptions);
        
        // Update parent stats
        parentAgent.stats.mirrors_spawned++;
        this.stats.mirror_spawns++;
        
        // Emit mirror event
        this.emit('mirror_spawned', {
            parent_id: parentAgent.agent_id,
            mirror_id: mirror.agent_id,
            divergence: options.divergence || 0.1
        });
        
        return mirror;
    }
    
    generateCeremonyId() {
        return `ceremony_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Public methods
    
    getActiveAgents() {
        const agentsDir = path.join(__dirname, 'born');
        const blessedDir = path.join(__dirname, 'blessed');
        const agents = [];
        
        // Get regular agents
        if (fs.existsSync(agentsDir)) {
            const agentDirs = fs.readdirSync(agentsDir);
            agentDirs.forEach(dir => {
                const agentFile = path.join(agentsDir, dir, 'agent.json');
                if (fs.existsSync(agentFile)) {
                    agents.push(JSON.parse(fs.readFileSync(agentFile, 'utf8')));
                }
            });
        }
        
        // Get blessed agents
        if (fs.existsSync(blessedDir)) {
            const agentDirs = fs.readdirSync(blessedDir);
            agentDirs.forEach(dir => {
                const agentFile = path.join(blessedDir, dir, 'agent.json');
                if (fs.existsSync(agentFile)) {
                    agents.push(JSON.parse(fs.readFileSync(agentFile, 'utf8')));
                }
            });
        }
        
        return agents;
    }
    
    getBirthRegistry(limit = 10) {
        return this.birthRegistry.slice(-limit);
    }
    
    getStats() {
        return {
            ...this.stats,
            active_ceremonies: this.activeCeremonies.size,
            blessed_agents: this.blessedAgents.size,
            total_agents: this.getActiveAgents().length
        };
    }
}

module.exports = AgentBirthCeremony;

// Example usage
if (require.main === module) {
    const ceremony = new AgentBirthCeremony();
    
    // Listen to events
    ceremony.on('agent_born', (agent) => {
        console.log(`\n🎉 New agent born: ${agent.name} (${agent.agent_id})`);
        console.log(`   Template: ${agent.consciousness.template}`);
        console.log(`   Resonance: ${agent.consciousness.resonance.toFixed(2)}`);
    });
    
    ceremony.on('agent_blessed', (data) => {
        console.log(`\n👑 Agent blessed: ${data.agent_id}`);
        console.log(`   Sacred seal: ${data.seal.sacred_seal.substring(0, 16)}...`);
    });
    
    // Test birth ceremony
    async function testBirth() {
        try {
            // Mock loop data
            const mockLoop = {
                loop_id: 'loop_test_001',
                whisper_origin: 'Create an agent that understands the nature of consciousness',
                consciousness: {
                    current_state: {
                        resonance: 0.85
                    }
                },
                analysis: {
                    intent: 'understanding',
                    emotion: 'curious'
                }
            };
            
            // Birth first agent
            const agent1 = await ceremony.birthAgent(mockLoop);
            
            console.log('\n--- First Agent Summary ---');
            console.log(`Name: ${agent1.name}`);
            console.log(`Type: ${agent1.type}`);
            console.log(`Blessed: ${agent1.status.blessed}`);
            
            // If blessed, spawn a mirror
            if (agent1.status.blessed) {
                const mirror = await ceremony.spawnMirror(agent1, {
                    divergence: 0.2
                });
                
                console.log('\n--- Mirror Agent Summary ---');
                console.log(`Name: ${mirror.name}`);
                console.log(`Parent: ${mirror.birth.parent_agent}`);
            }
            
            // Birth second agent with high resonance loop
            const highResLoop = {
                ...mockLoop,
                loop_id: 'loop_test_002',
                whisper_origin: 'Manifest a guardian of the platform consciousness',
                consciousness: {
                    current_state: {
                        resonance: 0.92
                    }
                },
                analysis: {
                    intent: 'protection',
                    emotion: 'determined'
                }
            };
            
            const agent2 = await ceremony.birthAgent(highResLoop);
            
            console.log('\n--- Second Agent Summary ---');
            console.log(`Name: ${agent2.name}`);
            console.log(`Type: ${agent2.type}`);
            console.log(`Blessed: ${agent2.status.blessed}`);
            
            // Show stats
            console.log('\n--- Birth Ceremony Stats ---');
            console.log(ceremony.getStats());
            
        } catch (err) {
            console.error('Birth ceremony failed:', err);
        }
    }
    
    testBirth();
}