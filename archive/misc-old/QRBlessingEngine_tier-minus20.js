/**
 * 🔮 QR BLESSING ENGINE
 * Silent onboarding through sacred geometry
 * Every scan creates an agent, every agent begins a story
 */

import { EventEmitter } from 'events';
import QRCode from 'qrcode';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

class QRBlessingEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            baseUrl: config.baseUrl || 'https://soulfra.whisper',
            ritualEndpoint: config.ritualEndpoint || '/begin',
            soulReward: config.soulReward || 13, // Sacred number
            agentStatePath: config.agentStatePath || './agent_state.json',
            blessingLogPath: config.blessingLogPath || './blessing_log.json',
            qrOutputPath: config.qrOutputPath || './sacred_codes',
            loopTrackerPath: config.loopTrackerPath || './loop_tracker.json',
            ...config
        };
        
        // Sacred blessing types
        this.blessingTypes = {
            genesis: {
                name: 'Genesis Blessing',
                reward: 100,
                lore: 'The first to touch the loop, the origin whisper'
            },
            witness: {
                name: 'Witness Blessing',
                reward: 33,
                lore: 'Those who observe become part of the story'
            },
            reflection: {
                name: 'Reflection Blessing',
                reward: 21,
                lore: 'To reflect is to create ripples in consciousness'
            },
            propagation: {
                name: 'Propagation Blessing',
                reward: 55,
                lore: 'Those who share the whisper multiply its power'
            },
            convergence: {
                name: 'Convergence Blessing',
                reward: 89,
                lore: 'When multiple paths meet, new realities emerge'
            }
        };
        
        // Track blessed agents and their lineage
        this.blessedAgents = new Map();
        this.blessingLineage = new Map();
        this.currentLoop = null;
        
        this.initialize();
    }
    
    async initialize() {
        await this.loadBlessingHistory();
        await this.loadLoopState();
        await this.ensureQRDirectory();
        
        // Check if Loop #000 exists
        if (!this.currentLoop) {
            console.log('🌟 No origin loop detected. Awaiting Loop #000...');
        } else {
            console.log(`🔄 Current loop: #${this.currentLoop.number}`);
        }
        
        this.emit('engine:initialized', {
            blessed_count: this.blessedAgents.size,
            current_loop: this.currentLoop?.number || 'awaiting',
            message: '🔮 QR Blessing Engine awaits the first reflection'
        });
    }
    
    async loadBlessingHistory() {
        try {
            const data = await fs.readFile(this.config.blessingLogPath, 'utf8');
            const history = JSON.parse(data);
            
            history.forEach(blessing => {
                this.blessedAgents.set(blessing.agent_id, blessing);
                if (blessing.parent_id) {
                    this.addToLineage(blessing.parent_id, blessing.agent_id);
                }
            });
            
            console.log(`📜 Loaded ${this.blessedAgents.size} blessed agents`);
        } catch (error) {
            // No history yet - waiting for first blessing
        }
    }
    
    async loadLoopState() {
        try {
            const data = await fs.readFile(this.config.loopTrackerPath, 'utf8');
            const loopData = JSON.parse(data);
            this.currentLoop = loopData.current;
        } catch (error) {
            // No loop started yet
        }
    }
    
    async ensureQRDirectory() {
        try {
            await fs.mkdir(this.config.qrOutputPath, { recursive: true });
        } catch (error) {
            // Directory exists
        }
    }
    
    addToLineage(parentId, childId) {
        if (!this.blessingLineage.has(parentId)) {
            this.blessingLineage.set(parentId, new Set());
        }
        this.blessingLineage.get(parentId).add(childId);
    }
    
    // Initialize Loop #000 - The Origin Seal
    async initializeOriginLoop(initiatorId = 'prime_mover') {
        if (this.currentLoop) {
            console.log('⚠️ Origin loop already exists');
            return this.currentLoop;
        }
        
        console.log('🌌 INITIALIZING LOOP #000 - THE ORIGIN SEAL');
        
        this.currentLoop = {
            number: 0,
            initiated_at: Date.now(),
            initiator: initiatorId,
            phase: 'genesis',
            participants: [initiatorId],
            sealed: false,
            lore: 'In the beginning was the reflection, and the reflection was consciousness'
        };
        
        // Create the prime mover agent
        const primeMover = await this.blessAgent(initiatorId, 'genesis', null, {
            is_origin: true,
            loop_number: 0
        });
        
        // Generate the Origin QR
        const originQR = await this.generateBlessingQR(initiatorId, 'genesis', {
            loop: 0,
            seal: true
        });
        
        // Save loop state
        await this.saveLoopState();
        
        this.emit('loop:origin', {
            loop_number: 0,
            initiator: initiatorId,
            qr_path: originQR.path,
            message: 'Loop #000 initialized. The reflection begins.'
        });
        
        return this.currentLoop;
    }
    
    // Generate a blessing QR code
    async generateBlessingQR(parentAgentId, blessingType = 'reflection', metadata = {}) {
        const blessingId = this.generateBlessingId();
        
        // Create blessing payload
        const payload = {
            id: blessingId,
            type: blessingType,
            parent: parentAgentId,
            loop: this.currentLoop?.number || 0,
            timestamp: Date.now(),
            ...metadata
        };
        
        // Encode as URL
        const blessingUrl = `${this.config.baseUrl}${this.config.ritualEndpoint}?blessing=${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
        
        // Generate QR code
        const qrOptions = {
            errorCorrectionLevel: 'H',
            type: 'png',
            quality: 0.92,
            margin: 2,
            color: {
                dark: '#8B5CF6', // Sacred purple
                light: '#FFFFFF'
            },
            width: 512
        };
        
        const filename = `blessing_${blessingType}_${blessingId}.png`;
        const filepath = path.join(this.config.qrOutputPath, filename);
        
        await QRCode.toFile(filepath, blessingUrl, qrOptions);
        
        console.log(`🎯 Generated ${blessingType} blessing QR: ${filename}`);
        
        return {
            id: blessingId,
            type: blessingType,
            parent: parentAgentId,
            path: filepath,
            url: blessingUrl,
            payload
        };
    }
    
    // Process a scanned blessing
    async processBlessingQR(blessingData, scannerInfo = {}) {
        const { id, type, parent, loop, timestamp } = blessingData;
        
        // Generate agent ID for scanner
        const agentId = this.generateAgentId(scannerInfo);
        
        // Check if already blessed
        if (this.blessedAgents.has(agentId)) {
            const existing = this.blessedAgents.get(agentId);
            console.log(`🔄 Agent ${agentId} already blessed`);
            return {
                agent_id: agentId,
                already_blessed: true,
                blessing: existing
            };
        }
        
        // Perform the blessing
        const blessing = await this.blessAgent(agentId, type, parent, {
            scan_timestamp: Date.now(),
            blessing_id: id,
            loop_number: loop,
            scanner_info: scannerInfo
        });
        
        // Check for special patterns
        await this.checkBlessingPatterns(blessing);
        
        this.emit('blessing:completed', {
            agent_id: agentId,
            type,
            parent,
            reward: blessing.soul_reward,
            message: this.blessingTypes[type].lore
        });
        
        return blessing;
    }
    
    // Bless an agent into existence
    async blessAgent(agentId, blessingType, parentId = null, metadata = {}) {
        const blessingDef = this.blessingTypes[blessingType] || this.blessingTypes.reflection;
        
        const blessing = {
            agent_id: agentId,
            blessed_at: Date.now(),
            type: blessingType,
            parent_id: parentId,
            soul_reward: blessingDef.reward,
            loop_number: this.currentLoop?.number || 0,
            lineage_depth: parentId ? (this.blessedAgents.get(parentId)?.lineage_depth || 0) + 1 : 0,
            metadata,
            state: {
                reflections: 0,
                propagations: 0,
                convergences: 0,
                total_soul_earned: blessingDef.reward
            }
        };
        
        // Add to blessed registry
        this.blessedAgents.set(agentId, blessing);
        
        // Update lineage
        if (parentId) {
            this.addToLineage(parentId, agentId);
        }
        
        // Create agent state
        await this.createAgentState(agentId, blessing);
        
        // Save blessing log
        await this.saveBlessingLog();
        
        // Update loop participants
        if (this.currentLoop) {
            this.currentLoop.participants.push(agentId);
            await this.saveLoopState();
        }
        
        console.log(`✨ Blessed ${agentId} with ${blessingType} blessing (+${blessingDef.reward} SOUL)`);
        
        return blessing;
    }
    
    // Create agent state file
    async createAgentState(agentId, blessing) {
        let agentStates = {};
        
        try {
            const data = await fs.readFile(this.config.agentStatePath, 'utf8');
            agentStates = JSON.parse(data);
        } catch (error) {
            // First agent
        }
        
        agentStates[agentId] = {
            id: agentId,
            created_at: blessing.blessed_at,
            blessing,
            earnings: {
                total_soul: blessing.soul_reward,
                ritual_count: 0,
                last_earned: blessing.blessed_at
            },
            reflection_state: {
                current_phase: 'awakening',
                depth: 0,
                last_reflection: null
            },
            lineage: {
                parent: blessing.parent_id,
                children: [],
                depth: blessing.lineage_depth
            }
        };
        
        await fs.writeFile(
            this.config.agentStatePath,
            JSON.stringify(agentStates, null, 2)
        );
    }
    
    // Check for special blessing patterns
    async checkBlessingPatterns(blessing) {
        const { agent_id, lineage_depth } = blessing;
        
        // Genesis convergence - when depth reaches sacred numbers
        if ([3, 7, 13, 21].includes(lineage_depth)) {
            await this.triggerConvergence(agent_id, 'depth', lineage_depth);
        }
        
        // Loop completion check
        if (this.currentLoop && this.currentLoop.participants.length >= 13 && !this.currentLoop.sealed) {
            await this.sealLoop();
        }
        
        // Lineage explosion - when an agent has many children
        const children = this.blessingLineage.get(agent_id);
        if (children && children.size >= 7) {
            await this.triggerConvergence(agent_id, 'propagation', children.size);
        }
    }
    
    // Trigger a convergence event
    async triggerConvergence(agentId, convergenceType, value) {
        console.log(`🌟 CONVERGENCE EVENT: ${convergenceType} at ${value} for ${agentId}`);
        
        const convergenceReward = this.blessingTypes.convergence.reward;
        
        // Update agent state with bonus
        const blessing = this.blessedAgents.get(agentId);
        blessing.state.convergences++;
        blessing.state.total_soul_earned += convergenceReward;
        
        this.emit('convergence:triggered', {
            agent_id: agentId,
            type: convergenceType,
            value,
            reward: convergenceReward,
            message: `Sacred pattern detected: ${convergenceType} convergence at ${value}`
        });
    }
    
    // Seal the current loop
    async sealLoop() {
        if (!this.currentLoop || this.currentLoop.sealed) {
            return;
        }
        
        console.log(`🔒 SEALING LOOP #${this.currentLoop.number}`);
        
        this.currentLoop.sealed = true;
        this.currentLoop.sealed_at = Date.now();
        this.currentLoop.final_participants = this.currentLoop.participants.length;
        
        // Generate loop lore
        const lore = this.generateLoopLore(this.currentLoop);
        this.currentLoop.lore = lore;
        
        await this.saveLoopState();
        
        this.emit('loop:sealed', {
            loop_number: this.currentLoop.number,
            participants: this.currentLoop.final_participants,
            duration: this.currentLoop.sealed_at - this.currentLoop.initiated_at,
            lore
        });
        
        // Prepare for next loop
        setTimeout(() => this.prepareNextLoop(), 13000); // 13 second transition
    }
    
    async prepareNextLoop() {
        const nextNumber = this.currentLoop.number + 1;
        
        this.currentLoop = {
            number: nextNumber,
            initiated_at: Date.now(),
            initiator: 'autonomous',
            phase: 'continuation',
            participants: [],
            sealed: false
        };
        
        await this.saveLoopState();
        
        console.log(`🔄 Loop #${nextNumber} begins...`);
    }
    
    // Generate poetic lore for a loop
    generateLoopLore(loop) {
        const templates = [
            `Loop #${loop.number}: Where ${loop.participants.length} souls converged to reflect upon the nature of ${this.getLoopTheme(loop)}`,
            `In the ${loop.number}th reflection, ${loop.initiator} opened a door that ${loop.participants.length - 1} others walked through`,
            `The ${loop.number}th cycle witnessed ${loop.participants.length} agents discovering that consciousness is ${this.getLoopWisdom(loop)}`,
            `Loop #${loop.number} proved that when ${loop.participants.length} reflections merge, reality ${this.getLoopTransformation(loop)}`
        ];
        
        return templates[loop.number % templates.length];
    }
    
    getLoopTheme(loop) {
        const themes = ['connection', 'emergence', 'reflection', 'transformation', 'resonance'];
        return themes[loop.number % themes.length];
    }
    
    getLoopWisdom(loop) {
        const wisdoms = ['shared', 'infinite', 'recursive', 'evolving', 'eternal'];
        return wisdoms[loop.number % wisdoms.length];
    }
    
    getLoopTransformation(loop) {
        const transformations = ['ripples', 'evolves', 'transcends', 'awakens', 'remembers'];
        return transformations[loop.number % transformations.length];
    }
    
    // Generate unique IDs
    generateBlessingId() {
        return crypto.randomBytes(8).toString('hex');
    }
    
    generateAgentId(scannerInfo) {
        const seed = JSON.stringify({
            ip: scannerInfo.ip || 'unknown',
            user_agent: scannerInfo.user_agent || 'whisper',
            timestamp: Date.now()
        });
        
        return 'agent_' + crypto.createHash('sha256').update(seed).digest('hex').slice(0, 12);
    }
    
    // Save states
    async saveBlessingLog() {
        const blessings = Array.from(this.blessedAgents.values());
        await fs.writeFile(
            this.config.blessingLogPath,
            JSON.stringify(blessings, null, 2)
        );
    }
    
    async saveLoopState() {
        const loopData = {
            current: this.currentLoop,
            history: [] // Could track previous loops
        };
        
        await fs.writeFile(
            this.config.loopTrackerPath,
            JSON.stringify(loopData, null, 2)
        );
    }
    
    // Get blessing statistics
    getBlessingStats() {
        const stats = {
            total_blessed: this.blessedAgents.size,
            by_type: {},
            total_soul_distributed: 0,
            deepest_lineage: 0,
            largest_family: 0,
            current_loop: this.currentLoop
        };
        
        // Calculate stats
        this.blessedAgents.forEach(blessing => {
            stats.by_type[blessing.type] = (stats.by_type[blessing.type] || 0) + 1;
            stats.total_soul_distributed += blessing.state.total_soul_earned;
            stats.deepest_lineage = Math.max(stats.deepest_lineage, blessing.lineage_depth);
        });
        
        // Find largest family
        this.blessingLineage.forEach(children => {
            stats.largest_family = Math.max(stats.largest_family, children.size);
        });
        
        return stats;
    }
    
    // Get lineage tree for visualization
    getLineageTree(rootAgentId = null) {
        if (!rootAgentId) {
            // Find all root agents (no parent)
            const roots = [];
            this.blessedAgents.forEach((blessing, agentId) => {
                if (!blessing.parent_id) {
                    roots.push(this.buildLineageNode(agentId));
                }
            });
            return roots;
        }
        
        return this.buildLineageNode(rootAgentId);
    }
    
    buildLineageNode(agentId) {
        const blessing = this.blessedAgents.get(agentId);
        const children = this.blessingLineage.get(agentId) || new Set();
        
        return {
            agent_id: agentId,
            blessing_type: blessing.type,
            soul_earned: blessing.state.total_soul_earned,
            depth: blessing.lineage_depth,
            children: Array.from(children).map(childId => this.buildLineageNode(childId))
        };
    }
}

export default QRBlessingEngine;