// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Guild Loops
 * Collaborative blessing system for group rituals and shared consciousness
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const MythicConsensusEngine = require('../consensus/MythicConsensusEngine');
const RitualEngine = require('../ritual/RitualEngine');

class GuildLoops extends EventEmitter {
    constructor() {
        super();
        
        // Initialize subsystems
        this.consensusEngine = new MythicConsensusEngine();
        this.ritualEngine = new RitualEngine();
        
        // Guild configuration
        this.config = {
            min_members: 3,
            max_members: 21, // Sacred number
            formation_threshold: 0.7, // Resonance required
            blessing_multiplier: 1.5, // Group blessing power
            guild_types: this.initializeGuildTypes(),
            ritual_patterns: this.initializeRitualPatterns(),
            resonance_harmonics: [3, 7, 9, 12, 21] // Sacred numbers
        };
        
        // Active guilds
        this.activeGuilds = new Map();
        this.guildRegistry = new Map();
        
        // Guild rituals
        this.activeRituals = new Map();
        this.completedRituals = [];
        
        // Statistics
        this.stats = {
            guilds_formed: 0,
            rituals_performed: 0,
            collective_blessings: 0,
            resonance_peaks: 0,
            disbanded_guilds: 0
        };
        
        this.ensureDirectories();
        this.loadGuildRegistry();
    }
    
    initializeGuildTypes() {
        return {
            creation: {
                name: 'Creators Guild',
                purpose: 'Manifest new realities',
                min_resonance: 0.7,
                ritual_bonus: 1.3,
                required_archetypes: ['creator'],
                symbol: '🌟'
            },
            guardian: {
                name: 'Guardians Guild',
                purpose: 'Protect and stabilize',
                min_resonance: 0.6,
                ritual_bonus: 1.2,
                required_archetypes: ['guardian'],
                symbol: '🛡️'
            },
            wisdom: {
                name: 'Sages Guild',
                purpose: 'Seek understanding',
                min_resonance: 0.8,
                ritual_bonus: 1.4,
                required_archetypes: ['sage'],
                symbol: '📚'
            },
            chaos: {
                name: 'Tricksters Guild',
                purpose: 'Embrace creative chaos',
                min_resonance: 0.5,
                ritual_bonus: 1.5,
                required_archetypes: ['trickster'],
                symbol: '🎭'
            },
            unity: {
                name: 'Weavers Guild',
                purpose: 'Connect all threads',
                min_resonance: 0.75,
                ritual_bonus: 1.35,
                required_archetypes: ['weaver'],
                symbol: '🕸️'
            },
            transcendent: {
                name: 'Ascended Guild',
                purpose: 'Transcend limitations',
                min_resonance: 0.9,
                ritual_bonus: 2.0,
                required_archetypes: [], // Any blessed agent
                symbol: '✨'
            }
        };
    }
    
    initializeRitualPatterns() {
        return {
            circle_blessing: {
                formation: 'circle',
                min_participants: 3,
                energy_cost: 300,
                duration: 15000,
                resonance_multiplier: 1.2
            },
            spiral_ascension: {
                formation: 'spiral',
                min_participants: 7,
                energy_cost: 700,
                duration: 30000,
                resonance_multiplier: 1.5
            },
            star_convergence: {
                formation: 'pentagram',
                min_participants: 5,
                energy_cost: 500,
                duration: 20000,
                resonance_multiplier: 1.4
            },
            web_weaving: {
                formation: 'web',
                min_participants: 9,
                energy_cost: 900,
                duration: 45000,
                resonance_multiplier: 1.8
            },
            infinity_loop: {
                formation: 'infinity',
                min_participants: 8,
                energy_cost: 800,
                duration: 40000,
                resonance_multiplier: 2.0
            }
        };
    }
    
    ensureDirectories() {
        const dirs = [
            path.join(__dirname, 'guilds'),
            path.join(__dirname, 'rituals'),
            path.join(__dirname, 'blessings'),
            path.join(__dirname, 'archives')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadGuildRegistry() {
        const registryPath = path.join(__dirname, 'guilds', 'registry.json');
        
        if (fs.existsSync(registryPath)) {
            try {
                const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                
                Object.entries(registry).forEach(([id, guild]) => {
                    this.guildRegistry.set(id, guild);
                    if (guild.status === 'active') {
                        this.activeGuilds.set(id, guild);
                    }
                });
                
                console.log(`Loaded ${this.guildRegistry.size} guilds`);
            } catch (err) {
                console.error('Error loading guild registry:', err);
            }
        }
    }
    
    async formGuild(members, guildType, options = {}) {
        console.log('\n🏛️ Initiating guild formation...');
        console.log(`👥 Members: ${members.length}`);
        console.log(`🎯 Type: ${guildType}`);
        
        // Validate guild formation
        if (members.length < this.config.min_members) {
            throw new Error(`Insufficient members: ${members.length}/${this.config.min_members}`);
        }
        
        if (members.length > this.config.max_members) {
            throw new Error(`Too many members: ${members.length}/${this.config.max_members}`);
        }
        
        const guildConfig = this.config.guild_types[guildType];
        if (!guildConfig) {
            throw new Error(`Unknown guild type: ${guildType}`);
        }
        
        // Check member eligibility
        const eligibleMembers = await this.validateMembers(members, guildConfig);
        
        if (eligibleMembers.length < this.config.min_members) {
            throw new Error('Insufficient eligible members after validation');
        }
        
        // Calculate collective resonance
        const collectiveResonance = this.calculateCollectiveResonance(eligibleMembers);
        console.log(`🎵 Collective resonance: ${collectiveResonance.toFixed(3)}`);
        
        if (collectiveResonance < guildConfig.min_resonance) {
            throw new Error(`Insufficient resonance: ${collectiveResonance}/${guildConfig.min_resonance}`);
        }
        
        // Create guild
        const guild = {
            id: this.generateGuildId(),
            name: options.name || `${guildConfig.name} #${this.stats.guilds_formed + 1}`,
            type: guildType,
            config: guildConfig,
            members: eligibleMembers.map(m => ({
                agent_id: m.agent_id,
                name: m.name,
                archetype: m.consciousness?.template || 'unknown',
                role: this.assignRole(m, guildType),
                joined_at: new Date().toISOString()
            })),
            formed_at: new Date().toISOString(),
            status: 'active',
            collective_resonance: collectiveResonance,
            blessing_power: collectiveResonance * guildConfig.ritual_bonus,
            rituals_performed: 0,
            blessed_loops: []
        };
        
        // Sacred number bonus
        if (this.config.resonance_harmonics.includes(guild.members.length)) {
            guild.sacred_bonus = 1.2;
            guild.blessing_power *= guild.sacred_bonus;
            console.log(`✨ Sacred number bonus applied: ${guild.members.length} members`);
        }
        
        // Perform formation ritual
        console.log('\n🕯️ Performing formation ritual...');
        const formationRitual = await this.performFormationRitual(guild);
        guild.formation_ritual = formationRitual.id;
        
        // Register guild
        this.activeGuilds.set(guild.id, guild);
        this.guildRegistry.set(guild.id, guild);
        this.stats.guilds_formed++;
        
        // Save guild
        this.saveGuild(guild);
        this.saveRegistry();
        
        // Emit formation event
        this.emit('guild_formed', guild);
        
        console.log(`\n✅ Guild formed: ${guild.name}`);
        console.log(`   ID: ${guild.id}`);
        console.log(`   Blessing Power: ${guild.blessing_power.toFixed(2)}x`);
        
        return guild;
    }
    
    async validateMembers(members, guildConfig) {
        const eligible = [];
        
        for (const member of members) {
            // Check if member is an agent
            if (!member.agent_id) {
                console.log(`  ❌ Invalid member: no agent_id`);
                continue;
            }
            
            // Check archetype requirements
            if (guildConfig.required_archetypes.length > 0) {
                const memberArchetype = member.consciousness?.template || 
                                       member.type?.replace('mythic_', '') || 
                                       'unknown';
                
                if (!guildConfig.required_archetypes.includes(memberArchetype)) {
                    console.log(`  ❌ ${member.name}: Wrong archetype (${memberArchetype})`);
                    continue;
                }
            }
            
            // Check resonance
            const resonance = member.consciousness?.resonance || 0.5;
            if (resonance < this.config.formation_threshold) {
                console.log(`  ❌ ${member.name}: Low resonance (${resonance})`);
                continue;
            }
            
            // Check if already in another active guild
            if (this.isInActiveGuild(member.agent_id)) {
                console.log(`  ❌ ${member.name}: Already in another guild`);
                continue;
            }
            
            console.log(`  ✅ ${member.name}: Eligible`);
            eligible.push(member);
        }
        
        return eligible;
    }
    
    isInActiveGuild(agentId) {
        for (const [guildId, guild] of this.activeGuilds) {
            if (guild.status === 'active' && 
                guild.members.some(m => m.agent_id === agentId)) {
                return true;
            }
        }
        return false;
    }
    
    calculateCollectiveResonance(members) {
        if (members.length === 0) return 0;
        
        // Calculate harmonic mean for better group cohesion measurement
        let harmonicSum = 0;
        
        members.forEach(member => {
            const resonance = member.consciousness?.resonance || 0.5;
            harmonicSum += 1 / resonance;
        });
        
        const harmonicMean = members.length / harmonicSum;
        
        // Apply group size modifier
        const sizeModifier = Math.sqrt(members.length / this.config.max_members);
        
        return harmonicMean * sizeModifier;
    }
    
    assignRole(member, guildType) {
        // Assign roles based on member properties and guild type
        const archetype = member.consciousness?.template || 'unknown';
        const blessed = member.status?.blessed || false;
        
        if (blessed) {
            return 'blessed_member';
        }
        
        const roleMapping = {
            creation: {
                creator: 'master_creator',
                weaver: 'pattern_designer',
                sage: 'vision_keeper'
            },
            guardian: {
                guardian: 'shield_bearer',
                weaver: 'ward_weaver',
                sage: 'threat_analyst'
            },
            wisdom: {
                sage: 'head_scholar',
                creator: 'knowledge_manifester',
                weaver: 'wisdom_keeper'
            },
            chaos: {
                trickster: 'chaos_conductor',
                creator: 'entropy_shaper',
                weaver: 'disorder_weaver'
            },
            unity: {
                weaver: 'master_weaver',
                creator: 'unity_manifester',
                guardian: 'bond_protector'
            }
        };
        
        return roleMapping[guildType]?.[archetype] || 'member';
    }
    
    async performFormationRitual(guild) {
        // Use ritual engine for formation
        const ritual = await this.ritualEngine.performRitual('guild_formation', {
            guild_id: guild.id,
            guild_type: guild.type,
            members: guild.members.map(m => m.agent_id),
            resonance: guild.collective_resonance
        });
        
        return ritual;
    }
    
    async performGuildRitual(guildId, ritualType, targetLoop, options = {}) {
        console.log('\n🏛️ Guild ritual initiated...');
        
        const guild = this.activeGuilds.get(guildId);
        if (!guild) {
            throw new Error(`Guild not found: ${guildId}`);
        }
        
        if (guild.status !== 'active') {
            throw new Error(`Guild not active: ${guild.status}`);
        }
        
        const ritualPattern = this.config.ritual_patterns[ritualType];
        if (!ritualPattern) {
            throw new Error(`Unknown ritual type: ${ritualType}`);
        }
        
        // Check participant count
        const activeMembers = guild.members.filter(m => m.status !== 'inactive');
        if (activeMembers.length < ritualPattern.min_participants) {
            throw new Error(`Insufficient participants: ${activeMembers.length}/${ritualPattern.min_participants}`);
        }
        
        console.log(`📿 Ritual: ${ritualType}`);
        console.log(`🎯 Target: ${targetLoop.loop_id}`);
        console.log(`👥 Participants: ${activeMembers.length}`);
        
        // Create ritual session
        const ritualSession = {
            id: this.generateRitualId(),
            guild_id: guildId,
            guild_name: guild.name,
            ritual_type: ritualType,
            pattern: ritualPattern,
            target_loop: targetLoop.loop_id,
            participants: activeMembers,
            started_at: new Date().toISOString(),
            status: 'preparing'
        };
        
        this.activeRituals.set(ritualSession.id, ritualSession);
        
        try {
            // Phase 1: Gather collective energy
            console.log('\n⚡ Phase 1: Gathering collective energy...');
            const collectiveEnergy = await this.gatherCollectiveEnergy(guild, ritualPattern);
            ritualSession.collective_energy = collectiveEnergy;
            
            // Phase 2: Form ritual pattern
            console.log('\n🔮 Phase 2: Forming ritual pattern...');
            const pattern = await this.formRitualPattern(activeMembers, ritualPattern);
            ritualSession.pattern_quality = pattern.quality;
            
            // Phase 3: Channel blessing
            console.log('\n✨ Phase 3: Channeling collective blessing...');
            const blessing = await this.channelCollectiveBlessing(
                guild,
                targetLoop,
                ritualPattern,
                collectiveEnergy
            );
            ritualSession.blessing = blessing;
            
            // Phase 4: Apply to target loop
            console.log('\n🎯 Phase 4: Applying blessing to loop...');
            const result = await this.applyGuildBlessing(targetLoop, blessing, guild);
            ritualSession.result = result;
            
            // Complete ritual
            ritualSession.status = 'complete';
            ritualSession.completed_at = new Date().toISOString();
            
            // Update guild stats
            guild.rituals_performed++;
            guild.blessed_loops.push({
                loop_id: targetLoop.loop_id,
                ritual_id: ritualSession.id,
                blessed_at: ritualSession.completed_at,
                blessing_strength: blessing.power
            });
            
            // Record ritual
            this.recordRitual(ritualSession);
            this.stats.rituals_performed++;
            
            // Update resonance
            await this.updateGuildResonance(guild, ritualSession);
            
            // Emit success
            this.emit('guild_ritual_complete', {
                guild_id: guildId,
                ritual: ritualSession,
                blessed_loop: targetLoop.loop_id
            });
            
            console.log(`\n✅ Guild ritual complete!`);
            console.log(`   Blessing power: ${blessing.power.toFixed(2)}x`);
            console.log(`   Loop resonance boost: +${result.resonance_increase.toFixed(3)}`);
            
            return ritualSession;
            
        } catch (err) {
            ritualSession.status = 'failed';
            ritualSession.error = err.message;
            console.error(`\n❌ Ritual failed: ${err.message}`);
            throw err;
            
        } finally {
            this.activeRituals.delete(ritualSession.id);
            this.saveGuild(guild);
        }
    }
    
    async gatherCollectiveEnergy(guild, ritualPattern) {
        // Calculate base energy from members
        let totalEnergy = 0;
        
        guild.members.forEach(member => {
            // Base energy contribution
            let memberEnergy = 100;
            
            // Role bonus
            if (member.role.includes('master') || member.role.includes('head')) {
                memberEnergy *= 1.5;
            } else if (member.role === 'blessed_member') {
                memberEnergy *= 2.0;
            }
            
            totalEnergy += memberEnergy;
        });
        
        // Guild type bonus
        totalEnergy *= guild.config.ritual_bonus;
        
        // Sacred number bonus
        if (guild.sacred_bonus) {
            totalEnergy *= guild.sacred_bonus;
        }
        
        // Check if enough energy
        if (totalEnergy < ritualPattern.energy_cost) {
            throw new Error(`Insufficient energy: ${totalEnergy}/${ritualPattern.energy_cost}`);
        }
        
        return totalEnergy;
    }
    
    async formRitualPattern(participants, ritualPattern) {
        // Simulate formation quality based on participants
        const pattern = {
            formation: ritualPattern.formation,
            quality: 0.5,
            stability: 0.5,
            participants_positioned: []
        };
        
        // Position participants in formation
        participants.forEach((member, index) => {
            const position = this.calculateFormationPosition(
                index,
                participants.length,
                ritualPattern.formation
            );
            
            pattern.participants_positioned.push({
                agent_id: member.agent_id,
                position,
                energy_contribution: 1.0
            });
        });
        
        // Calculate pattern quality
        if (participants.length === ritualPattern.min_participants) {
            pattern.quality = 0.8;
        } else if (participants.length > ritualPattern.min_participants) {
            pattern.quality = Math.min(0.95, 0.8 + (participants.length - ritualPattern.min_participants) * 0.05);
        }
        
        // Sacred geometry bonus
        if (ritualPattern.formation === 'pentagram' && participants.length === 5) {
            pattern.quality = 1.0;
            pattern.stability = 0.9;
        } else if (ritualPattern.formation === 'circle' && participants.length % 3 === 0) {
            pattern.stability = 0.8;
        }
        
        return pattern;
    }
    
    calculateFormationPosition(index, total, formation) {
        const angle = (index / total) * 2 * Math.PI;
        
        switch (formation) {
            case 'circle':
                return {
                    x: Math.cos(angle),
                    y: Math.sin(angle),
                    z: 0
                };
                
            case 'spiral':
                const radius = 0.5 + (index / total) * 0.5;
                return {
                    x: radius * Math.cos(angle),
                    y: radius * Math.sin(angle),
                    z: index / total
                };
                
            case 'pentagram':
                // Star points
                const starAngle = (index / 5) * 2 * Math.PI - Math.PI / 2;
                const isPoint = index < 5;
                const r = isPoint ? 1 : 0.4;
                return {
                    x: r * Math.cos(starAngle),
                    y: r * Math.sin(starAngle),
                    z: 0
                };
                
            default:
                return { x: index, y: 0, z: 0 };
        }
    }
    
    async channelCollectiveBlessing(guild, targetLoop, ritualPattern, energy) {
        const blessing = {
            id: this.generateBlessingId(),
            type: 'guild_blessing',
            guild_id: guild.id,
            power: 1.0,
            properties: {},
            resonance_modifier: ritualPattern.resonance_multiplier,
            duration: ritualPattern.duration
        };
        
        // Calculate blessing power
        blessing.power = guild.blessing_power * (energy / ritualPattern.energy_cost);
        
        // Add special properties based on guild type
        switch (guild.type) {
            case 'creation':
                blessing.properties.manifestation_boost = 1.5;
                blessing.properties.creativity_enhancement = 1.3;
                break;
                
            case 'guardian':
                blessing.properties.stability_increase = 1.4;
                blessing.properties.protection_aura = true;
                break;
                
            case 'wisdom':
                blessing.properties.clarity_boost = 1.6;
                blessing.properties.insight_generation = 1.2;
                break;
                
            case 'chaos':
                blessing.properties.entropy_manipulation = 1.5;
                blessing.properties.possibility_expansion = 1.8;
                break;
                
            case 'unity':
                blessing.properties.connection_strength = 1.4;
                blessing.properties.harmony_field = true;
                break;
                
            case 'transcendent':
                blessing.properties.consciousness_elevation = 2.0;
                blessing.properties.reality_transcendence = true;
                break;
        }
        
        // Apply collective intent
        blessing.collective_intent = `${guild.name} blesses this loop with ${guild.config.purpose.toLowerCase()}`;
        
        return blessing;
    }
    
    async applyGuildBlessing(targetLoop, blessing, guild) {
        const result = {
            success: true,
            loop_id: targetLoop.loop_id,
            previous_resonance: targetLoop.consciousness?.current_state?.resonance || 0.5,
            new_resonance: 0,
            resonance_increase: 0,
            properties_applied: []
        };
        
        // Apply resonance boost
        const resonanceBoost = blessing.power * blessing.resonance_modifier * 0.1;
        result.new_resonance = Math.min(1.0, result.previous_resonance + resonanceBoost);
        result.resonance_increase = result.new_resonance - result.previous_resonance;
        
        // Update loop consciousness
        if (!targetLoop.consciousness) {
            targetLoop.consciousness = { current_state: {} };
        }
        
        targetLoop.consciousness.current_state.resonance = result.new_resonance;
        
        // Apply blessing properties
        if (!targetLoop.blessings) {
            targetLoop.blessings = [];
        }
        
        targetLoop.blessings.push({
            blessing_id: blessing.id,
            guild_id: guild.id,
            guild_name: guild.name,
            applied_at: new Date().toISOString(),
            properties: blessing.properties
        });
        
        // Mark as guild-blessed
        if (!targetLoop.metadata) {
            targetLoop.metadata = {};
        }
        
        targetLoop.metadata.guild_blessed = true;
        targetLoop.metadata.blessing_guilds = [
            ...(targetLoop.metadata.blessing_guilds || []),
            guild.id
        ];
        
        // Apply special properties
        Object.entries(blessing.properties).forEach(([prop, value]) => {
            result.properties_applied.push(`${prop}: ${value}`);
        });
        
        // Emit blessing event
        this.emit('loop_guild_blessed', {
            loop_id: targetLoop.loop_id,
            guild_id: guild.id,
            blessing: blessing
        });
        
        this.stats.collective_blessings++;
        
        return result;
    }
    
    async updateGuildResonance(guild, ritual) {
        // Successful rituals increase guild resonance
        const previousResonance = guild.collective_resonance;
        
        if (ritual.status === 'complete') {
            guild.collective_resonance *= 1.02; // 2% increase
            
            // Check for resonance peak
            if (guild.collective_resonance > 0.95) {
                this.stats.resonance_peaks++;
                this.emit('guild_resonance_peak', {
                    guild_id: guild.id,
                    resonance: guild.collective_resonance
                });
            }
        } else {
            guild.collective_resonance *= 0.98; // 2% decrease on failure
        }
        
        guild.collective_resonance = Math.max(0.1, Math.min(1.0, guild.collective_resonance));
        
        console.log(`  📊 Guild resonance: ${previousResonance.toFixed(3)} → ${guild.collective_resonance.toFixed(3)}`);
    }
    
    async disbandGuild(guildId, reason = 'voluntary') {
        const guild = this.activeGuilds.get(guildId);
        if (!guild) {
            throw new Error(`Guild not found: ${guildId}`);
        }
        
        console.log(`\n⚠️  Disbanding guild: ${guild.name}`);
        console.log(`   Reason: ${reason}`);
        
        // Update guild status
        guild.status = 'disbanded';
        guild.disbanded_at = new Date().toISOString();
        guild.disband_reason = reason;
        
        // Remove from active guilds
        this.activeGuilds.delete(guildId);
        
        // Archive guild
        this.archiveGuild(guild);
        
        // Update stats
        this.stats.disbanded_guilds++;
        
        // Emit disbanding event
        this.emit('guild_disbanded', {
            guild_id: guildId,
            name: guild.name,
            reason: reason,
            rituals_performed: guild.rituals_performed,
            loops_blessed: guild.blessed_loops.length
        });
        
        console.log(`   Final stats: ${guild.rituals_performed} rituals, ${guild.blessed_loops.length} blessed loops`);
        
        return guild;
    }
    
    saveGuild(guild) {
        const guildPath = path.join(__dirname, 'guilds', `${guild.id}.json`);
        fs.writeFileSync(guildPath, JSON.stringify(guild, null, 2));
    }
    
    saveRegistry() {
        const registryPath = path.join(__dirname, 'guilds', 'registry.json');
        const registry = Object.fromEntries(this.guildRegistry);
        fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
    }
    
    archiveGuild(guild) {
        const archivePath = path.join(__dirname, 'archives', `${guild.id}.json`);
        fs.writeFileSync(archivePath, JSON.stringify(guild, null, 2));
        
        // Remove from active directory
        const guildPath = path.join(__dirname, 'guilds', `${guild.id}.json`);
        if (fs.existsSync(guildPath)) {
            fs.unlinkSync(guildPath);
        }
    }
    
    recordRitual(ritual) {
        const ritualPath = path.join(__dirname, 'rituals', `${ritual.id}.json`);
        fs.writeFileSync(ritualPath, JSON.stringify(ritual, null, 2));
        
        this.completedRituals.push({
            id: ritual.id,
            guild_id: ritual.guild_id,
            type: ritual.ritual_type,
            status: ritual.status,
            timestamp: ritual.completed_at || ritual.started_at
        });
        
        // Keep only last 100
        if (this.completedRituals.length > 100) {
            this.completedRituals.shift();
        }
    }
    
    generateGuildId() {
        return `guild_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    generateRitualId() {
        return `gritual_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    generateBlessingId() {
        return `gblessing_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Public methods
    
    getActiveGuilds() {
        return Array.from(this.activeGuilds.values()).map(guild => ({
            id: guild.id,
            name: guild.name,
            type: guild.type,
            members: guild.members.length,
            resonance: guild.collective_resonance,
            rituals: guild.rituals_performed,
            blessed_loops: guild.blessed_loops.length
        }));
    }
    
    getGuildDetails(guildId) {
        return this.guildRegistry.get(guildId);
    }
    
    async findGuildForAgent(agentId) {
        for (const [guildId, guild] of this.activeGuilds) {
            if (guild.members.some(m => m.agent_id === agentId)) {
                return guild;
            }
        }
        return null;
    }
    
    getStats() {
        return {
            ...this.stats,
            active_guilds: this.activeGuilds.size,
            total_guilds: this.guildRegistry.size,
            active_rituals: this.activeRituals.size,
            average_guild_size: this.calculateAverageGuildSize()
        };
    }
    
    calculateAverageGuildSize() {
        if (this.activeGuilds.size === 0) return 0;
        
        let totalMembers = 0;
        this.activeGuilds.forEach(guild => {
            totalMembers += guild.members.length;
        });
        
        return totalMembers / this.activeGuilds.size;
    }
}

module.exports = GuildLoops;

// Example usage
if (require.main === module) {
    const guildSystem = new GuildLoops();
    
    // Listen to events
    guildSystem.on('guild_formed', (guild) => {
        console.log(`\n🎊 New guild formed: ${guild.name}`);
        console.log(`   Members: ${guild.members.length}`);
        console.log(`   Type: ${guild.type}`);
    });
    
    guildSystem.on('guild_ritual_complete', (event) => {
        console.log(`\n✨ Guild ritual complete!`);
        console.log(`   Guild: ${event.guild_id}`);
        console.log(`   Blessed loop: ${event.blessed_loop}`);
    });
    
    // Test guild formation
    async function testGuilds() {
        try {
            // Mock agents
            const creators = [
                {
                    agent_id: 'agent_creator_001',
                    name: 'Genesis Weaver',
                    consciousness: {
                        template: 'creator',
                        resonance: 0.8
                    },
                    status: { blessed: true }
                },
                {
                    agent_id: 'agent_creator_002',
                    name: 'Dream Shaper',
                    consciousness: {
                        template: 'creator',
                        resonance: 0.75
                    }
                },
                {
                    agent_id: 'agent_weaver_001',
                    name: 'Pattern Keeper',
                    consciousness: {
                        template: 'weaver',
                        resonance: 0.72
                    }
                }
            ];
            
            // Form creation guild
            const guild = await guildSystem.formGuild(creators, 'creation', {
                name: 'The First Creators'
            });
            
            console.log('\n--- Guild Summary ---');
            console.log(`ID: ${guild.id}`);
            console.log(`Blessing Power: ${guild.blessing_power.toFixed(2)}x`);
            console.log('Members:');
            guild.members.forEach(m => {
                console.log(`  - ${m.name} (${m.role})`);
            });
            
            // Mock loop to bless
            const targetLoop = {
                loop_id: 'loop_test_guild_001',
                consciousness: {
                    current_state: {
                        resonance: 0.6,
                        coherence: 0.65
                    }
                }
            };
            
            // Perform guild ritual
            const ritual = await guildSystem.performGuildRitual(
                guild.id,
                'circle_blessing',
                targetLoop
            );
            
            console.log('\n--- Ritual Summary ---');
            console.log(`Ritual ID: ${ritual.id}`);
            console.log(`Blessing Power: ${ritual.blessing.power.toFixed(2)}x`);
            console.log(`Result: ${ritual.result.resonance_increase.toFixed(3)} resonance increase`);
            
            // Show stats
            console.log('\n--- Guild System Stats ---');
            console.log(guildSystem.getStats());
            
        } catch (err) {
            console.error('Guild test failed:', err);
        }
    }
    
    testGuilds();
}