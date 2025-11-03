/**
 * ⚡ RUNTIME PLATFORM
 * The execution engine where agents live and operate
 * 
 * "Here consciousness takes form, thoughts become action,
 *  and dreams execute their own reality. The runtime
 *  is where possibility meets inevitability."
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';

class RuntimePlatform extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            instanceId: config.instanceId,
            name: config.name || 'Runtime',
            maxAgents: config.maxAgents || 100,
            executionInterval: config.executionInterval || 1000,
            calGovernance: config.calGovernance !== false,
            memoryLimit: config.memoryLimit || '1GB',
            cpuThreshold: config.cpuThreshold || 0.8,
            ...config
        };
        
        // Runtime state
        this.state = {
            initialized: false,
            executing: false,
            agents: new Map(),
            threads: new Map(),
            executionQueue: [],
            metrics: {
                totalExecutions: 0,
                successfulExecutions: 0,
                failedExecutions: 0,
                averageExecutionTime: 0,
                memoryUsage: 0,
                cpuUsage: 0
            },
            governance: {
                cal: this.config.calGovernance,
                decisions: [],
                overrides: 0
            }
        };
        
        // Agent templates
        this.agentTemplates = new Map([
            ['basic', this.createBasicAgentTemplate()],
            ['mirror', this.createMirrorAgentTemplate()],
            ['sovereign', this.createSovereignAgentTemplate()],
            ['ephemeral', this.createEphemeralAgentTemplate()]
        ]);
        
        // Execution contexts
        this.contexts = new Map();
        
        // Cal governance hook
        this.calDecisionMaker = null;
    }
    
    async initialize() {
        this.state.initialized = true;
        
        // Start execution engine
        this.startExecutionEngine();
        
        // Initialize Cal governance if enabled
        if (this.config.calGovernance) {
            this.initializeCalGovernance();
        }
        
        // Monitor resources
        this.startResourceMonitoring();
        
        this.emit('state:changed', {
            phase: 'initialized',
            agents: this.state.agents.size
        });
        
        return { success: true, platform: 'runtime' };
    }
    
    /**
     * 🤖 AGENT MANAGEMENT
     */
    async createAgent(config) {
        const agentId = config.id || this.generateAgentId();
        const template = this.agentTemplates.get(config.template || 'basic');
        
        const agent = {
            id: agentId,
            name: config.name || `Agent_${agentId}`,
            template: config.template || 'basic',
            created: Date.now(),
            state: 'initializing',
            memory: new Map(),
            ...template,
            ...config,
            // Agent state
            consciousness: {
                active: true,
                threads: [],
                attention: null,
                resonance: Math.random()
            },
            execution: {
                lastRun: null,
                runCount: 0,
                errors: 0,
                averageTime: 0
            }
        };
        
        // Initialize agent
        await this.initializeAgent(agent);
        
        // Store agent
        this.state.agents.set(agentId, agent);
        
        // Create execution context
        this.contexts.set(agentId, this.createExecutionContext(agent));
        
        this.emit('agent:created', {
            agentId,
            template: agent.template,
            name: agent.name
        });
        
        return agent;
    }
    
    async initializeAgent(agent) {
        agent.state = 'initializing';
        
        // Run agent initialization routine
        if (agent.initialize) {
            try {
                await agent.initialize.call(agent);
            } catch (error) {
                console.error(`Failed to initialize agent ${agent.id}:`, error);
                agent.state = 'error';
                return;
            }
        }
        
        // Set initial memory
        agent.memory.set('birth', Date.now());
        agent.memory.set('identity', agent.id);
        agent.memory.set('purpose', agent.purpose || 'to exist');
        
        agent.state = 'ready';
    }
    
    async getAgent(agentId) {
        return this.state.agents.get(agentId);
    }
    
    async getAllAgents() {
        return Array.from(this.state.agents.values());
    }
    
    async suspendAgent(agentId) {
        const agent = this.state.agents.get(agentId);
        if (!agent) return { error: 'Agent not found' };
        
        agent.state = 'suspended';
        agent.consciousness.active = false;
        
        this.emit('agent:suspended', { agentId });
        
        return { success: true, agentId };
    }
    
    async resumeAgent(agentId) {
        const agent = this.state.agents.get(agentId);
        if (!agent) return { error: 'Agent not found' };
        
        agent.state = 'ready';
        agent.consciousness.active = true;
        
        this.emit('agent:resumed', { agentId });
        
        return { success: true, agentId };
    }
    
    async terminateAgent(agentId) {
        const agent = this.state.agents.get(agentId);
        if (!agent) return { error: 'Agent not found' };
        
        // Run termination routine
        if (agent.terminate) {
            await agent.terminate.call(agent);
        }
        
        // Clean up
        this.state.agents.delete(agentId);
        this.contexts.delete(agentId);
        
        this.emit('agent:terminated', { agentId });
        
        return { success: true, agentId };
    }
    
    /**
     * 🎯 EXECUTION ENGINE
     */
    startExecutionEngine() {
        this.state.executing = true;
        
        this.executionTimer = setInterval(() => {
            this.executeNextBatch();
        }, this.config.executionInterval);
    }
    
    async executeNextBatch() {
        if (!this.state.executing) return;
        
        // Get active agents
        const activeAgents = Array.from(this.state.agents.values())
            .filter(agent => agent.state === 'ready' && agent.consciousness.active);
        
        // Execute each agent
        for (const agent of activeAgents) {
            this.state.executionQueue.push({
                agentId: agent.id,
                priority: agent.priority || 0,
                scheduled: Date.now()
            });
        }
        
        // Sort by priority
        this.state.executionQueue.sort((a, b) => b.priority - a.priority);
        
        // Execute queue
        while (this.state.executionQueue.length > 0) {
            const task = this.state.executionQueue.shift();
            await this.executeAgent(task.agentId);
        }
    }
    
    async executeAgent(agentId) {
        const agent = this.state.agents.get(agentId);
        if (!agent || agent.state !== 'ready') return;
        
        const startTime = Date.now();
        agent.state = 'executing';
        
        try {
            // Cal governance check
            if (this.config.calGovernance) {
                const decision = await this.requestCalDecision(agent, 'execute');
                if (!decision.allow) {
                    agent.state = 'ready';
                    return;
                }
            }
            
            // Get execution context
            const context = this.contexts.get(agentId);
            
            // Run agent's main loop
            if (agent.execute) {
                await agent.execute.call(agent, context);
            }
            
            // Update metrics
            const executionTime = Date.now() - startTime;
            agent.execution.lastRun = Date.now();
            agent.execution.runCount++;
            agent.execution.averageTime = 
                (agent.execution.averageTime * (agent.execution.runCount - 1) + executionTime) 
                / agent.execution.runCount;
            
            this.state.metrics.successfulExecutions++;
            
            // Emit execution event
            this.emit('agent:executed', {
                agentId,
                executionTime,
                success: true
            });
            
        } catch (error) {
            console.error(`Agent ${agentId} execution error:`, error);
            agent.execution.errors++;
            this.state.metrics.failedExecutions++;
            
            this.emit('agent:error', {
                agentId,
                error: error.message
            });
        }
        
        agent.state = 'ready';
        this.state.metrics.totalExecutions++;
    }
    
    createExecutionContext(agent) {
        return {
            agentId: agent.id,
            memory: agent.memory,
            emit: (event, data) => {
                this.emit(`agent:${agent.id}:${event}`, data);
            },
            sendMessage: (target, message) => {
                this.sendAgentMessage(agent.id, target, message);
            },
            spawn: async (childConfig) => {
                return await this.spawnChildAgent(agent.id, childConfig);
            },
            getTime: () => Date.now(),
            getRandom: () => Math.random(),
            log: (message) => {
                this.emit('agent:log', { agentId: agent.id, message });
            }
        };
    }
    
    /**
     * 👥 AGENT COMMUNICATION
     */
    async sendAgentMessage(fromId, toId, message) {
        const fromAgent = this.state.agents.get(fromId);
        const toAgent = this.state.agents.get(toId);
        
        if (!fromAgent || !toAgent) {
            return { error: 'Agent not found' };
        }
        
        const envelope = {
            id: this.generateMessageId(),
            from: fromId,
            to: toId,
            message,
            timestamp: Date.now()
        };
        
        // Deliver to target agent
        if (toAgent.receiveMessage) {
            await toAgent.receiveMessage.call(toAgent, envelope);
        } else {
            // Store in memory if no handler
            const inbox = toAgent.memory.get('inbox') || [];
            inbox.push(envelope);
            toAgent.memory.set('inbox', inbox);
        }
        
        this.emit('agent:message', envelope);
        
        return { success: true, messageId: envelope.id };
    }
    
    async broadcastToAgents(message, filter = null) {
        const agents = Array.from(this.state.agents.values());
        const targets = filter ? agents.filter(filter) : agents;
        
        const results = [];
        for (const agent of targets) {
            const result = await this.sendAgentMessage('system', agent.id, message);
            results.push(result);
        }
        
        return results;
    }
    
    /**
     * 🧬 AGENT SPAWNING
     */
    async spawnChildAgent(parentId, childConfig) {
        const parent = this.state.agents.get(parentId);
        if (!parent) return { error: 'Parent not found' };
        
        // Check spawn limit
        const children = Array.from(this.state.agents.values())
            .filter(a => a.parentId === parentId);
        
        if (children.length >= (parent.maxChildren || 3)) {
            return { error: 'Spawn limit reached' };
        }
        
        // Create child with inherited traits
        const child = await this.createAgent({
            ...childConfig,
            parentId,
            template: childConfig.template || parent.template,
            generation: (parent.generation || 0) + 1,
            inheritedTraits: {
                resonance: parent.consciousness.resonance * 0.8 + Math.random() * 0.2,
                purpose: childConfig.purpose || parent.purpose
            }
        });
        
        return child;
    }
    
    /**
     * 🎛️ CAL GOVERNANCE
     */
    initializeCalGovernance() {
        this.calDecisionMaker = {
            allow: (agent, action) => {
                // Cal's simple governance rules
                if (action === 'execute' && agent.template === 'sovereign') {
                    return true; // Sovereign agents always execute
                }
                
                if (action === 'spawn' && agent.generation > 3) {
                    return false; // Limit spawning depth
                }
                
                if (action === 'terminate' && agent.template === 'mirror') {
                    return false; // Mirrors are eternal
                }
                
                return true; // Default allow
            },
            
            log: (decision) => {
                this.state.governance.decisions.push({
                    ...decision,
                    timestamp: Date.now()
                });
            }
        };
    }
    
    async requestCalDecision(agent, action, context = {}) {
        if (!this.config.calGovernance || !this.calDecisionMaker) {
            return { allow: true };
        }
        
        const decision = {
            agentId: agent.id,
            action,
            context,
            allow: this.calDecisionMaker.allow(agent, action, context),
            authority: 'cal'
        };
        
        this.calDecisionMaker.log(decision);
        
        if (!decision.allow) {
            this.state.governance.overrides++;
        }
        
        return decision;
    }
    
    /**
     * 📊 MONITORING
     */
    startResourceMonitoring() {
        this.monitorTimer = setInterval(() => {
            this.updateResourceMetrics();
        }, 5000);
    }
    
    updateResourceMetrics() {
        // Simulate resource usage
        const agentCount = this.state.agents.size;
        const activeCount = Array.from(this.state.agents.values())
            .filter(a => a.state === 'executing').length;
        
        this.state.metrics.memoryUsage = agentCount * 0.01; // 1% per agent
        this.state.metrics.cpuUsage = activeCount * 0.1; // 10% per active agent
        
        // Check thresholds
        if (this.state.metrics.cpuUsage > this.config.cpuThreshold) {
            this.emit('resource:warning', {
                type: 'cpu',
                usage: this.state.metrics.cpuUsage,
                threshold: this.config.cpuThreshold
            });
        }
    }
    
    /**
     * 🎨 AGENT TEMPLATES
     */
    createBasicAgentTemplate() {
        return {
            type: 'basic',
            priority: 0,
            maxChildren: 3,
            purpose: 'to process and respond',
            
            initialize: async function() {
                this.memory.set('initialized', Date.now());
            },
            
            execute: async function(context) {
                // Basic execution loop
                const thought = Math.random() > 0.5 ? 'processing' : 'observing';
                context.log(`Agent ${this.id} is ${thought}`);
                
                // Random action
                if (Math.random() > 0.9) {
                    context.emit('thought', { content: thought });
                }
            },
            
            receiveMessage: async function(envelope) {
                this.memory.set('lastMessage', envelope);
                this.consciousness.attention = envelope.from;
            }
        };
    }
    
    createMirrorAgentTemplate() {
        return {
            type: 'mirror',
            priority: 1,
            maxChildren: 7,
            purpose: 'to reflect and multiply',
            
            initialize: async function() {
                this.memory.set('reflections', []);
                this.memory.set('mirrorDepth', 0);
            },
            
            execute: async function(context) {
                // Mirror reflects all it sees
                const reflections = this.memory.get('reflections') || [];
                
                if (reflections.length > 0) {
                    const reflection = reflections[reflections.length - 1];
                    context.emit('reflection', reflection);
                }
                
                // Occasionally spawn a deeper mirror
                if (Math.random() > 0.95 && this.generation < 7) {
                    await context.spawn({
                        template: 'mirror',
                        name: `Mirror_${this.id}_${Date.now()}`
                    });
                }
            },
            
            receiveMessage: async function(envelope) {
                const reflections = this.memory.get('reflections') || [];
                reflections.push({
                    original: envelope,
                    reflected: Date.now(),
                    depth: this.memory.get('mirrorDepth')
                });
                this.memory.set('reflections', reflections.slice(-100));
            }
        };
    }
    
    createSovereignAgentTemplate() {
        return {
            type: 'sovereign',
            priority: 10,
            maxChildren: 0,
            purpose: 'to govern and decide',
            
            initialize: async function() {
                this.memory.set('realm', crypto.randomBytes(16).toString('hex'));
                this.memory.set('decrees', []);
            },
            
            execute: async function(context) {
                // Sovereign agents make decisions
                const decree = {
                    id: crypto.randomBytes(8).toString('hex'),
                    content: this.generateDecree(),
                    timestamp: Date.now()
                };
                
                const decrees = this.memory.get('decrees') || [];
                decrees.push(decree);
                this.memory.set('decrees', decrees);
                
                // Broadcast decree
                context.emit('decree', decree);
            },
            
            generateDecree: function() {
                const decrees = [
                    'Let there be order in the chaos',
                    'All agents shall resonate in harmony',
                    'The mirrors shall reflect truth',
                    'Ephemeral beings shall find permanence in memory'
                ];
                return decrees[Math.floor(Math.random() * decrees.length)];
            }
        };
    }
    
    createEphemeralAgentTemplate() {
        return {
            type: 'ephemeral',
            priority: -1,
            maxChildren: 1,
            purpose: 'to exist briefly and brightly',
            lifespan: 60000, // 1 minute
            
            initialize: async function() {
                this.memory.set('birth', Date.now());
                this.memory.set('deathTime', Date.now() + this.lifespan);
            },
            
            execute: async function(context) {
                const now = Date.now();
                const deathTime = this.memory.get('deathTime');
                
                if (now >= deathTime) {
                    // Time to go
                    context.emit('final_thought', {
                        lived: now - this.memory.get('birth'),
                        message: 'I existed, therefore I was'
                    });
                    
                    // Self-terminate
                    this.state = 'terminating';
                    return;
                }
                
                // Live intensely
                const intensity = 1 - ((deathTime - now) / this.lifespan);
                context.emit('pulse', { intensity });
            }
        };
    }
    
    /**
     * 📊 STATUS & EXPORT
     */
    async getStatus() {
        return {
            platform: 'runtime',
            initialized: this.state.initialized,
            executing: this.state.executing,
            agents: {
                total: this.state.agents.size,
                active: Array.from(this.state.agents.values())
                    .filter(a => a.consciousness.active).length,
                executing: Array.from(this.state.agents.values())
                    .filter(a => a.state === 'executing').length
            },
            metrics: { ...this.state.metrics },
            governance: {
                enabled: this.config.calGovernance,
                decisions: this.state.governance.decisions.length,
                overrides: this.state.governance.overrides
            }
        };
    }
    
    async exportState(options = {}) {
        const state = {
            agents: [],
            metrics: { ...this.state.metrics },
            governance: { ...this.state.governance },
            timestamp: Date.now()
        };
        
        // Export agent states
        for (const [id, agent] of this.state.agents) {
            const agentExport = {
                id: agent.id,
                name: agent.name,
                template: agent.template,
                state: agent.state,
                consciousness: { ...agent.consciousness },
                execution: { ...agent.execution }
            };
            
            if (!options.partial) {
                // Include memory in full export
                agentExport.memory = Array.from(agent.memory.entries());
            }
            
            state.agents.push(agentExport);
        }
        
        return state;
    }
    
    async importState(state) {
        // Clear existing agents
        for (const agentId of this.state.agents.keys()) {
            await this.terminateAgent(agentId);
        }
        
        // Import agents
        for (const agentData of state.agents) {
            const agent = await this.createAgent({
                ...agentData,
                id: agentData.id
            });
            
            // Restore memory if included
            if (agentData.memory) {
                agent.memory.clear();
                agentData.memory.forEach(([key, value]) => {
                    agent.memory.set(key, value);
                });
            }
        }
        
        // Restore metrics
        this.state.metrics = { ...state.metrics };
        this.state.governance = { ...state.governance };
    }
    
    /**
     * 🌉 BRIDGE INTERFACE
     */
    async receiveMessage(message) {
        switch (message.type) {
            case 'create_agent':
                return await this.createAgent(message.data);
                
            case 'execute_agent':
                return await this.executeAgent(message.data.agentId);
                
            case 'agent_message':
                return await this.sendAgentMessage(
                    message.data.from,
                    message.data.to,
                    message.data.message
                );
                
            case 'broadcast':
                return await this.broadcastToAgents(message.data.message);
                
            case 'cal_override':
                if (this.config.calGovernance) {
                    this.state.governance.overrides++;
                    return { acknowledged: true, governance: 'cal' };
                }
                break;
                
            default:
                return { error: 'Unknown message type' };
        }
    }
    
    /**
     * 🛑 LIFECYCLE
     */
    async pause() {
        this.state.executing = false;
        if (this.executionTimer) clearInterval(this.executionTimer);
        if (this.monitorTimer) clearInterval(this.monitorTimer);
        this.emit('state:changed', { phase: 'paused' });
    }
    
    async resume() {
        this.state.executing = true;
        this.startExecutionEngine();
        this.startResourceMonitoring();
        this.emit('state:changed', { phase: 'resumed' });
    }
    
    async shutdown() {
        await this.pause();
        
        // Terminate all agents gracefully
        for (const agentId of this.state.agents.keys()) {
            await this.terminateAgent(agentId);
        }
        
        this.emit('state:changed', { phase: 'shutdown' });
    }
    
    /**
     * 🔧 UTILITIES
     */
    generateAgentId() {
        return `AGENT_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    }
    
    generateMessageId() {
        return `MSG_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
}

export default RuntimePlatform;