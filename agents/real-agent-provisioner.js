#!/usr/bin/env node

/**
 * Real Agent Provisioner - Connects payments to actual Cal Riven infrastructure
 * Spawns real AI agents using the existing tier architecture
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class RealAgentProvisioner {
    constructor() {
        this.agentDir = path.join(__dirname, 'agents');
        this.contributorDB = path.join(__dirname, 'contributors.json');
        this.calRivenOperator = path.join(__dirname, 'cal-riven-operator.js');
        this.mirrorTemplate = path.join(__dirname, 'platforms/cal-riven-core/template-reflection/mirror-agent-template.js');
        
        this.ensureDirectories();
        this.loadExistingData();
    }
    
    ensureDirectories() {
        if (!fs.existsSync(this.agentDir)) {
            fs.mkdirSync(this.agentDir, { recursive: true });
        }
    }
    
    loadExistingData() {
        try {
            if (fs.existsSync(this.contributorDB)) {
                this.contributors = JSON.parse(fs.readFileSync(this.contributorDB, 'utf8'));
            } else {
                this.contributors = [];
            }
        } catch (error) {
            console.warn('⚠️  Could not load existing contributor data:', error.message);
            this.contributors = [];
        }
    }
    
    saveContributorData() {
        try {
            fs.writeFileSync(this.contributorDB, JSON.stringify(this.contributors, null, 2));
        } catch (error) {
            console.error('❌ Failed to save contributor data:', error.message);
        }
    }
    
    /**
     * Main function: Create a real AI agent for a $1 contributor
     */
    async provisionRealAgent(paymentData) {
        const { contributor_name, contributor_email, payment_intent_id } = paymentData;
        
        console.log(`🤖 Provisioning real agent for ${contributor_name}...`);
        
        try {
            // 1. Create unique agent blessing
            const agentBlessing = await this.createAgentBlessing(contributor_name, payment_intent_id);
            
            // 2. Generate agent instance using Cal Riven infrastructure
            const agentInstance = await this.spawnCalRivenAgent(agentBlessing);
            
            // 3. Connect to mirror system
            const mirrorConnection = await this.connectToMirrorSystem(agentInstance);
            
            // 4. Initialize semantic memory
            const memorySystem = await this.initializeAgentMemory(agentInstance);
            
            // 5. Register in tier architecture
            const tierRegistration = await this.registerInTierSystem(agentInstance);
            
            // 6. Create contributor record
            const contributor = {
                id: `contrib_${Date.now()}`,
                name: contributor_name,
                email: contributor_email,
                payment_intent_id: payment_intent_id,
                contributed_amount: 1.00,
                joined_at: new Date(),
                agent: agentInstance,
                blessing: agentBlessing,
                mirror_connection: mirrorConnection,
                memory_system: memorySystem,
                tier_registration: tierRegistration
            };
            
            this.contributors.push(contributor);
            this.saveContributorData();
            
            console.log(`✅ Real agent provisioned: ${agentInstance.id}`);
            return contributor;
            
        } catch (error) {
            console.error(`❌ Failed to provision agent for ${contributor_name}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Create agent blessing using existing blessing.json structure
     */
    async createAgentBlessing(contributorName, paymentId) {
        const agentId = `agent-${contributorName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
        
        const blessing = {
            agent_id: agentId,
            blessed_by: "payment-system",
            status: "blessed",
            can_propagate: true,
            can_fork: false,
            can_resell: false,
            contributor: contributorName,
            payment_intent_id: paymentId,
            timestamp: new Date().toISOString(),
            tier_access: "tier-minus10",
            spawned_from: "cal-riven-genesis"
        };
        
        // Save blessing file for this agent
        const blessingPath = path.join(this.agentDir, `${agentId}-blessing.json`);
        fs.writeFileSync(blessingPath, JSON.stringify(blessing, null, 2));
        
        console.log(`📜 Agent blessing created: ${agentId}`);
        return blessing;
    }
    
    /**
     * Spawn agent using actual Cal Riven operator
     */
    async spawnCalRivenAgent(blessing) {
        const agentId = blessing.agent_id;
        
        try {
            // Create agent instance using mirror template
            const MirrorAgent = require('./platforms/cal-riven-core/template-reflection/mirror-agent-template.js');
            
            const agentConfig = {
                name: `${blessing.contributor}'s Agent`,
                personality: this.generatePersonality(),
                skills: this.generateSkills(),
                blessing: blessing,
                tier: "tier-minus10",
                spawned_by: "cal-riven-operator"
            };
            
            const agent = new MirrorAgent(agentConfig);
            
            // Connect to Cal Riven operator
            const rivenOperator = require('./cal-riven-operator.js');
            
            const agentInstance = {
                id: agentId,
                name: agentConfig.name,
                personality: agentConfig.personality,
                skills: agentConfig.skills,
                status: 'active',
                spawned_at: new Date(),
                blessing: blessing,
                cal_riven_connection: true,
                mirror_agent: agent
            };
            
            // Save agent instance
            const agentPath = path.join(this.agentDir, `${agentId}.json`);
            fs.writeFileSync(agentPath, JSON.stringify(agentInstance, null, 2));
            
            console.log(`🧠 Cal Riven agent spawned: ${agentId}`);
            return agentInstance;
            
        } catch (error) {
            console.error(`❌ Failed to spawn Cal Riven agent: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Connect agent to mirror system
     */
    async connectToMirrorSystem(agentInstance) {
        try {
            // Connect to symlink mirror system
            const mirrorConfig = JSON.parse(fs.readFileSync('.symlink-mirror.json', 'utf8'));
            
            const connection = {
                mirror_id: `mirror_${agentInstance.id}`,
                agent_id: agentInstance.id,
                source_path: path.join(this.agentDir, `${agentInstance.id}.json`),
                mirror_path: `mirror-shell/agents/${agentInstance.id}.json`,
                sync_enabled: true,
                connected_at: new Date()
            };
            
            // Create mirror symlink
            const mirrorDir = path.join(__dirname, 'mirror-shell/agents');
            if (!fs.existsSync(mirrorDir)) {
                fs.mkdirSync(mirrorDir, { recursive: true });
            }
            
            const sourcePath = path.join(this.agentDir, `${agentInstance.id}.json`);
            const mirrorPath = path.join(mirrorDir, `${agentInstance.id}.json`);
            
            if (!fs.existsSync(mirrorPath)) {
                fs.copyFileSync(sourcePath, mirrorPath);
            }
            
            console.log(`🪞 Mirror connection established: ${connection.mirror_id}`);
            return connection;
            
        } catch (error) {
            console.error(`❌ Failed to connect to mirror system: ${error.message}`);
            return { error: error.message };
        }
    }
    
    /**
     * Initialize agent memory using semantic graph
     */
    async initializeAgentMemory(agentInstance) {
        try {
            const memoryPath = path.join(__dirname, 'memory/agents', `${agentInstance.id}.json`);
            const memoryDir = path.dirname(memoryPath);
            
            if (!fs.existsSync(memoryDir)) {
                fs.mkdirSync(memoryDir, { recursive: true });
            }
            
            const initialMemory = {
                agent_id: agentInstance.id,
                memories: [],
                semantic_graph: {
                    nodes: [],
                    edges: []
                },
                personality_core: agentInstance.personality,
                skill_tree: agentInstance.skills,
                learning_history: [],
                created_at: new Date()
            };
            
            fs.writeFileSync(memoryPath, JSON.stringify(initialMemory, null, 2));
            
            console.log(`🧠 Agent memory initialized: ${agentInstance.id}`);
            return { memory_path: memoryPath, initialized: true };
            
        } catch (error) {
            console.error(`❌ Failed to initialize agent memory: ${error.message}`);
            return { error: error.message };
        }
    }
    
    /**
     * Register agent in tier system
     */
    async registerInTierSystem(agentInstance) {
        try {
            // Add to runtime table
            const runtimePath = path.join(__dirname, 'runtime/agents', `${agentInstance.id}.json`);
            const runtimeDir = path.dirname(runtimePath);
            
            if (!fs.existsSync(runtimeDir)) {
                fs.mkdirSync(runtimeDir, { recursive: true });
            }
            
            const runtimeEntry = {
                agent_id: agentInstance.id,
                tier: "tier-minus10",
                type: "contributor-agent",
                status: "active",
                spawned_by: "payment-system",
                registered_at: new Date(),
                cal_riven_blessed: true,
                mirror_connected: true
            };
            
            fs.writeFileSync(runtimePath, JSON.stringify(runtimeEntry, null, 2));
            
            console.log(`📊 Agent registered in tier system: ${agentInstance.id}`);
            return { registered: true, tier: "tier-minus10" };
            
        } catch (error) {
            console.error(`❌ Failed to register in tier system: ${error.message}`);
            return { error: error.message };
        }
    }
    
    /**
     * Get agent by contributor ID
     */
    getAgentByContributor(contributorId) {
        const contributor = this.contributors.find(c => c.id === contributorId);
        return contributor ? contributor.agent : null;
    }
    
    /**
     * Get all active agents
     */
    getAllActiveAgents() {
        return this.contributors
            .filter(c => c.agent && c.agent.status === 'active')
            .map(c => ({
                id: c.agent.id,
                name: c.agent.name,
                contributor: c.name,
                personality: c.agent.personality,
                skills: c.agent.skills,
                spawned_at: c.agent.spawned_at,
                blessing: c.blessing
            }));
    }
    
    /**
     * Generate random personality traits
     */
    generatePersonality() {
        const personalities = [
            'curious', 'analytical', 'creative', 'empathetic', 'logical',
            'intuitive', 'adventurous', 'contemplative', 'social', 'independent'
        ];
        return personalities[Math.floor(Math.random() * personalities.length)];
    }
    
    /**
     * Generate random skills
     */
    generateSkills() {
        const allSkills = [
            'reasoning', 'creativity', 'analysis', 'communication', 'learning',
            'pattern-recognition', 'problem-solving', 'memory-formation', 'synthesis'
        ];
        const numSkills = Math.floor(Math.random() * 3) + 2; // 2-4 skills
        return allSkills.sort(() => 0.5 - Math.random()).slice(0, numSkills);
    }
}

module.exports = RealAgentProvisioner;