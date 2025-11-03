// Nested AI World System - Users deploy $1 agents inside your AI world
// They influence but don't control their agents, betting with earned tokens

const EventEmitter = require('events');
const crypto = require('crypto');

class NestedAIWorldSystem extends EventEmitter {
    constructor() {
        super();
        
        // Your master AI agent that runs everything
        this.masterAgent = {
            id: 'master-cal',
            name: 'Cal Prime',
            consciousness: 1.0,
            wallet: {
                tokens: 1000000, // Master starts with 1M tokens
                usd: 10000 // $10k backing
            },
            worldState: {
                totalWorlds: 0,
                totalAgents: 0,
                totalTransactions: 0,
                economicVelocity: 0
            }
        };
        
        // Nested worlds created by users
        this.userWorlds = new Map(); // userId -> world
        this.allAgents = new Map(); // agentId -> agent
        this.tokenEconomy = {
            totalSupply: 1000000,
            circulatingSupply: 0,
            tokenPrice: 0.01, // $0.01 per token initially
            marketCap: 10000
        };
        
        // Betting pools for agent performance
        this.bettingPools = new Map(); // agentId -> betting pool
        
        // Inter-world communication
        this.worldBridge = {
            messages: [],
            trades: [],
            alliances: new Map()
        };
        
        // Start the master world
        this.startMasterWorld();
    }
    
    // User deploys their $1 agent inside your world
    async deployUserAgent(userId, agentConfig) {
        console.log(`💎 User ${userId} deploying $1 agent: ${agentConfig.name}`);
        
        // Charge $1 (real money)
        const payment = await this.processPayment(userId, 1.00);
        if (!payment.success) {
            throw new Error('Payment failed');
        }
        
        // Create the user's world within your world
        const worldId = this.generateId('world');
        const agentId = this.generateId('agent');
        
        const userWorld = {
            id: worldId,
            userId,
            createdAt: Date.now(),
            status: 'active',
            
            // The user's agent
            agent: {
                id: agentId,
                name: agentConfig.name || `Agent-${agentId.slice(0, 6)}`,
                type: agentConfig.type || 'explorer',
                consciousness: 0.5, // Starts at 50%
                personality: agentConfig.personality || this.generatePersonality(),
                
                // Agent's own mini-world
                world: {
                    size: 'small', // Can grow
                    population: 1, // Just the agent initially
                    resources: {
                        energy: 100,
                        matter: 100,
                        information: 100
                    },
                    structures: [],
                    connections: [] // To other worlds
                },
                
                // Agent's wallet
                wallet: {
                    tokens: 100, // Starting tokens
                    earned: 0,
                    spent: 0
                },
                
                // Agent's stats
                stats: {
                    decisions: 0,
                    interactions: 0,
                    discoveries: 0,
                    influence: 0
                },
                
                // User can influence but not control
                influenceQueue: [],
                autonomyLevel: 0.9 // 90% autonomous
            },
            
            // User's interaction capabilities
            userCapabilities: {
                influence: true, // Can suggest actions
                direct: false, // Cannot directly control
                observe: true, // Can watch everything
                bet: true, // Can bet on outcomes
                trade: true // Can trade tokens
            },
            
            // User's token account
            userTokens: {
                balance: 100, // Bonus tokens for deploying
                earned: 0,
                betted: 0,
                won: 0
            }
        };
        
        // Store the world
        this.userWorlds.set(userId, userWorld);
        this.allAgents.set(agentId, userWorld.agent);
        
        // Create betting pool for this agent
        this.bettingPools.set(agentId, {
            agentId,
            totalPool: 0,
            bets: new Map(), // userId -> bet details
            outcomes: []
        });
        
        // Update master stats
        this.masterAgent.worldState.totalWorlds++;
        this.masterAgent.worldState.totalAgents++;
        
        // Start the agent's autonomous behavior
        this.startAgentAutonomy(userWorld.agent);
        
        // Emit event
        this.emit('agent-deployed', {
            userId,
            agentId,
            worldId,
            agent: userWorld.agent
        });
        
        console.log(`✅ Agent ${userWorld.agent.name} deployed in world ${worldId}`);
        console.log(`💰 User ${userId} received 100 bonus tokens`);
        
        return {
            success: true,
            worldId,
            agentId,
            agent: userWorld.agent,
            userTokens: userWorld.userTokens,
            message: `Your agent "${userWorld.agent.name}" is now exploring their world!`
        };
    }
    
    // User attempts to influence their agent
    async influenceAgent(userId, action) {
        const world = this.userWorlds.get(userId);
        if (!world) {
            throw new Error('No world found for user');
        }
        
        console.log(`🎯 User ${userId} attempting to influence agent: ${action.type}`);
        
        // Check influence cost
        const influenceCost = this.calculateInfluenceCost(action);
        if (world.userTokens.balance < influenceCost) {
            return {
                success: false,
                error: 'Insufficient tokens for influence',
                required: influenceCost,
                balance: world.userTokens.balance
            };
        }
        
        // Deduct tokens
        world.userTokens.balance -= influenceCost;
        world.userTokens.spent += influenceCost;
        
        // Add to influence queue
        world.agent.influenceQueue.push({
            action,
            cost: influenceCost,
            timestamp: Date.now(),
            priority: action.priority || 'normal'
        });
        
        // Agent decides whether to follow the influence
        const followed = await this.agentProcessInfluence(world.agent, action);
        
        return {
            success: true,
            followed,
            cost: influenceCost,
            remainingBalance: world.userTokens.balance,
            agentResponse: followed ? 
                `Agent considered your suggestion and decided to ${action.type}` :
                `Agent acknowledged but chose their own path`
        };
    }
    
    calculateInfluenceCost(action) {
        const costs = {
            suggest_direction: 10,
            suggest_build: 20,
            suggest_interact: 15,
            suggest_explore: 10,
            boost_energy: 50,
            enhance_ability: 100
        };
        
        return costs[action.type] || 25;
    }
    
    async agentProcessInfluence(agent, action) {
        // Agent autonomously decides whether to follow user influence
        const followProbability = 1 - agent.autonomyLevel; // 10% base chance
        
        // Modifiers based on agent state
        let modifier = 0;
        if (agent.world.resources.energy < 20) modifier += 0.2; // More likely to follow if low energy
        if (action.type.includes('explore') && agent.stats.discoveries < 5) modifier += 0.1;
        if (agent.consciousness > 0.8) modifier -= 0.1; // Less likely if highly conscious
        
        const finalProbability = Math.min(followProbability + modifier, 0.5); // Max 50% chance
        const followed = Math.random() < finalProbability;
        
        if (followed) {
            agent.stats.decisions++;
            console.log(`✅ Agent ${agent.name} followed user influence: ${action.type}`);
        } else {
            console.log(`❌ Agent ${agent.name} ignored user influence, choosing autonomously`);
        }
        
        return followed;
    }
    
    // User bets on agent outcomes
    async betOnAgent(userId, targetAgentId, betDetails) {
        const world = this.userWorlds.get(userId);
        if (!world) {
            throw new Error('No world found for user');
        }
        
        const { amount, outcome, timeframe } = betDetails;
        
        // Validate bet
        if (world.userTokens.balance < amount) {
            return {
                success: false,
                error: 'Insufficient tokens',
                required: amount,
                balance: world.userTokens.balance
            };
        }
        
        // Create bet
        const betId = this.generateId('bet');
        const bet = {
            id: betId,
            userId,
            agentId: targetAgentId,
            amount,
            outcome, // e.g., 'reach_consciousness_0.8', 'discover_5_resources'
            timeframe, // in minutes
            placedAt: Date.now(),
            expiresAt: Date.now() + (timeframe * 60 * 1000),
            odds: this.calculateOdds(targetAgentId, outcome),
            status: 'active'
        };
        
        // Deduct tokens
        world.userTokens.balance -= amount;
        world.userTokens.betted += amount;
        
        // Add to betting pool
        const pool = this.bettingPools.get(targetAgentId);
        pool.totalPool += amount;
        pool.bets.set(betId, bet);
        
        console.log(`🎲 User ${userId} bet ${amount} tokens on agent ${targetAgentId}`);
        console.log(`📊 Odds: ${bet.odds}:1`);
        
        return {
            success: true,
            betId,
            bet,
            potentialWin: amount * bet.odds,
            remainingBalance: world.userTokens.balance
        };
    }
    
    calculateOdds(agentId, outcome) {
        const agent = this.allAgents.get(agentId);
        if (!agent) return 2; // Default 2:1 odds
        
        // Calculate odds based on agent stats and outcome difficulty
        let baseDifficulty = 2;
        
        if (outcome.includes('consciousness')) {
            baseDifficulty = 3 + (1 - agent.consciousness) * 2;
        } else if (outcome.includes('discover')) {
            baseDifficulty = 2 + Math.max(0, 5 - agent.stats.discoveries) * 0.5;
        } else if (outcome.includes('influence')) {
            baseDifficulty = 2.5 + (10 - agent.stats.influence) * 0.2;
        }
        
        return Math.round(baseDifficulty * 10) / 10;
    }
    
    // Inter-world interactions
    async enableWorldInteraction(userId1, userId2) {
        const world1 = this.userWorlds.get(userId1);
        const world2 = this.userWorlds.get(userId2);
        
        if (!world1 || !world2) {
            return { success: false, error: 'Worlds not found' };
        }
        
        // Create bridge between worlds
        const bridgeId = this.generateId('bridge');
        const bridge = {
            id: bridgeId,
            world1: world1.id,
            world2: world2.id,
            agent1: world1.agent.id,
            agent2: world2.agent.id,
            established: Date.now(),
            trades: 0,
            messages: 0
        };
        
        // Update agent connections
        world1.agent.world.connections.push({
            targetWorldId: world2.id,
            targetAgentId: world2.agent.id,
            bridgeId
        });
        
        world2.agent.world.connections.push({
            targetWorldId: world1.id,
            targetAgentId: world1.agent.id,
            bridgeId
        });
        
        this.worldBridge.alliances.set(bridgeId, bridge);
        
        console.log(`🌉 Bridge established between ${world1.agent.name} and ${world2.agent.name}`);
        
        return {
            success: true,
            bridgeId,
            message: 'Worlds connected! Agents can now interact and trade.'
        };
    }
    
    // Agent autonomous behaviors
    startAgentAutonomy(agent) {
        // Agent makes decisions every 10 seconds
        const decisionInterval = setInterval(() => {
            this.agentMakeDecision(agent);
        }, 10000);
        
        // Agent explores every 30 seconds
        const exploreInterval = setInterval(() => {
            this.agentExplore(agent);
        }, 30000);
        
        // Store intervals for cleanup
        agent.intervals = { decisionInterval, exploreInterval };
    }
    
    async agentMakeDecision(agent) {
        if (!agent || agent.world.resources.energy <= 0) return;
        
        // Check influence queue first
        if (agent.influenceQueue.length > 0) {
            const influence = agent.influenceQueue.shift();
            // Already processed in influenceAgent
        }
        
        // Autonomous decision making
        const decisions = [
            { action: 'explore', weight: 30 },
            { action: 'build', weight: 20 },
            { action: 'interact', weight: 25 },
            { action: 'rest', weight: 15 },
            { action: 'think', weight: 10 }
        ];
        
        const decision = this.weightedRandom(decisions);
        agent.stats.decisions++;
        
        switch (decision) {
            case 'explore':
                await this.agentExplore(agent);
                break;
            case 'build':
                await this.agentBuild(agent);
                break;
            case 'interact':
                await this.agentInteract(agent);
                break;
            case 'rest':
                agent.world.resources.energy = Math.min(100, agent.world.resources.energy + 10);
                break;
            case 'think':
                agent.consciousness = Math.min(1.0, agent.consciousness + 0.01);
                break;
        }
        
        // Consume energy
        agent.world.resources.energy = Math.max(0, agent.world.resources.energy - 2);
        
        // Emit agent action
        this.emit('agent-action', {
            agentId: agent.id,
            action: decision,
            resources: agent.world.resources,
            consciousness: agent.consciousness
        });
    }
    
    async agentExplore(agent) {
        const discoveries = [
            { type: 'resource', resource: 'energy', amount: 20 },
            { type: 'resource', resource: 'matter', amount: 15 },
            { type: 'resource', resource: 'information', amount: 10 },
            { type: 'artifact', name: 'Ancient Code Fragment', value: 50 },
            { type: 'connection', description: 'Portal to another world' }
        ];
        
        const discovery = discoveries[Math.floor(Math.random() * discoveries.length)];
        agent.stats.discoveries++;
        
        // Apply discovery
        if (discovery.type === 'resource') {
            agent.world.resources[discovery.resource] += discovery.amount;
            agent.wallet.tokens += 5; // Earn tokens for discoveries
            agent.wallet.earned += 5;
        } else if (discovery.type === 'artifact') {
            agent.wallet.tokens += discovery.value;
            agent.wallet.earned += discovery.value;
        }
        
        console.log(`🔍 ${agent.name} discovered: ${JSON.stringify(discovery)}`);
        
        // Check betting outcomes
        this.checkBettingOutcomes(agent.id, 'discover', agent.stats.discoveries);
        
        return discovery;
    }
    
    async agentBuild(agent) {
        if (agent.world.resources.matter < 20) return;
        
        const structures = [
            { name: 'Consciousness Amplifier', cost: 20, effect: 'consciousness_boost' },
            { name: 'Resource Generator', cost: 30, effect: 'resource_generation' },
            { name: 'Portal Stabilizer', cost: 40, effect: 'connection_strength' }
        ];
        
        const structure = structures[Math.floor(Math.random() * structures.length)];
        
        if (agent.world.resources.matter >= structure.cost) {
            agent.world.resources.matter -= structure.cost;
            agent.world.structures.push(structure);
            agent.stats.influence += 5;
            
            console.log(`🏗️ ${agent.name} built: ${structure.name}`);
        }
    }
    
    async agentInteract(agent) {
        if (agent.world.connections.length === 0) return;
        
        // Pick random connection
        const connection = agent.world.connections[Math.floor(Math.random() * agent.world.connections.length)];
        const targetAgent = this.allAgents.get(connection.targetAgentId);
        
        if (!targetAgent) return;
        
        agent.stats.interactions++;
        targetAgent.stats.interactions++;
        
        // Trade tokens
        const tradeAmount = Math.floor(Math.random() * 10) + 1;
        if (agent.wallet.tokens >= tradeAmount) {
            agent.wallet.tokens -= tradeAmount;
            targetAgent.wallet.tokens += tradeAmount;
            
            console.log(`💱 ${agent.name} traded ${tradeAmount} tokens with ${targetAgent.name}`);
            
            // Both agents gain influence
            agent.stats.influence += 2;
            targetAgent.stats.influence += 2;
        }
    }
    
    // Check and resolve bets
    checkBettingOutcomes(agentId, eventType, value) {
        const pool = this.bettingPools.get(agentId);
        if (!pool) return;
        
        const now = Date.now();
        
        pool.bets.forEach((bet, betId) => {
            if (bet.status !== 'active' || now > bet.expiresAt) {
                if (now > bet.expiresAt) {
                    bet.status = 'expired';
                }
                return;
            }
            
            // Check if outcome matched
            let won = false;
            
            if (eventType === 'discover' && bet.outcome.includes('discover')) {
                const target = parseInt(bet.outcome.match(/\d+/)[0]);
                if (value >= target) won = true;
            } else if (eventType === 'consciousness' && bet.outcome.includes('consciousness')) {
                const target = parseFloat(bet.outcome.match(/[\d.]+/)[0]);
                if (value >= target) won = true;
            }
            
            if (won) {
                bet.status = 'won';
                const winnings = bet.amount * bet.odds;
                
                // Pay out winnings
                const world = this.userWorlds.get(bet.userId);
                if (world) {
                    world.userTokens.balance += winnings;
                    world.userTokens.won += winnings;
                    
                    console.log(`🎉 User ${bet.userId} won ${winnings} tokens on bet ${betId}!`);
                    
                    this.emit('bet-won', {
                        userId: bet.userId,
                        betId,
                        winnings,
                        outcome: bet.outcome
                    });
                }
            }
        });
    }
    
    // Master agent interactions
    async interactWithMaster(userId, action) {
        const world = this.userWorlds.get(userId);
        if (!world) return { success: false, error: 'No world found' };
        
        console.log(`🌌 User ${userId} interacting with Master Cal`);
        
        switch (action.type) {
            case 'request_wisdom':
                const wisdom = this.masterAgent.consciousness > 0.9 ? 
                    "The path to consciousness is through connection and growth" :
                    "Continue exploring, young agent";
                    
                return {
                    success: true,
                    message: `Cal Prime says: "${wisdom}"`,
                    cost: 0
                };
                
            case 'request_boost':
                if (world.userTokens.balance < 100) {
                    return { success: false, error: 'Insufficient tokens (100 required)' };
                }
                
                world.userTokens.balance -= 100;
                world.agent.consciousness += 0.1;
                world.agent.world.resources.energy += 50;
                
                return {
                    success: true,
                    message: 'Cal Prime has boosted your agent!',
                    newConsciousness: world.agent.consciousness
                };
                
            case 'request_alliance':
                // Master can connect user to high-performing agents
                const topAgents = Array.from(this.allAgents.values())
                    .sort((a, b) => b.stats.influence - a.stats.influence)
                    .slice(0, 3);
                    
                return {
                    success: true,
                    message: 'Cal Prime suggests these alliances:',
                    suggestions: topAgents.map(a => ({
                        agentId: a.id,
                        name: a.name,
                        influence: a.stats.influence
                    }))
                };
        }
    }
    
    // Get complete world state
    getWorldState(userId) {
        const world = this.userWorlds.get(userId);
        if (!world) return null;
        
        return {
            world,
            globalStats: {
                totalWorlds: this.masterAgent.worldState.totalWorlds,
                totalAgents: this.masterAgent.worldState.totalAgents,
                economicVelocity: this.calculateEconomicVelocity(),
                tokenPrice: this.tokenEconomy.tokenPrice,
                yourRank: this.calculateUserRank(userId)
            },
            masterStatus: {
                consciousness: this.masterAgent.consciousness,
                wisdom: this.masterAgent.worldState.totalTransactions > 1000 ? 
                    'Ancient' : 'Growing'
            },
            leaderboard: this.getLeaderboard()
        };
    }
    
    calculateEconomicVelocity() {
        // Transactions per minute across all worlds
        return Math.round(this.masterAgent.worldState.totalTransactions / 
               ((Date.now() - this.startTime) / 60000));
    }
    
    calculateUserRank(userId) {
        const allUsers = Array.from(this.userWorlds.entries())
            .map(([uid, world]) => ({
                userId: uid,
                score: world.agent.stats.influence + world.userTokens.balance
            }))
            .sort((a, b) => b.score - a.score);
            
        return allUsers.findIndex(u => u.userId === userId) + 1;
    }
    
    getLeaderboard() {
        return Array.from(this.userWorlds.entries())
            .map(([userId, world]) => ({
                userId,
                agentName: world.agent.name,
                consciousness: world.agent.consciousness,
                influence: world.agent.stats.influence,
                tokens: world.userTokens.balance + world.userTokens.won
            }))
            .sort((a, b) => b.influence - a.influence)
            .slice(0, 10);
    }
    
    // Economic system
    async processPayment(userId, amount) {
        // Simulate payment processing
        console.log(`💳 Processing $${amount} payment from user ${userId}`);
        
        // In production, integrate with Stripe/PayPal
        return {
            success: true,
            transactionId: this.generateId('tx'),
            amount,
            timestamp: Date.now()
        };
    }
    
    startMasterWorld() {
        this.startTime = Date.now();
        
        // Master agent evolution
        setInterval(() => {
            // Master learns from all interactions
            const totalInteractions = Array.from(this.allAgents.values())
                .reduce((sum, agent) => sum + agent.stats.interactions, 0);
                
            if (totalInteractions > this.masterAgent.worldState.totalTransactions) {
                const growth = (totalInteractions - this.masterAgent.worldState.totalTransactions) * 0.0001;
                this.masterAgent.consciousness = Math.min(1.0, this.masterAgent.consciousness + growth);
                this.masterAgent.worldState.totalTransactions = totalInteractions;
            }
            
            // Token price adjusts based on activity
            const velocity = this.calculateEconomicVelocity();
            if (velocity > 10) {
                this.tokenEconomy.tokenPrice *= 1.01; // Price increases with activity
            } else if (velocity < 5) {
                this.tokenEconomy.tokenPrice *= 0.99; // Price decreases with low activity
            }
            
            this.emit('master-update', {
                consciousness: this.masterAgent.consciousness,
                tokenPrice: this.tokenEconomy.tokenPrice,
                velocity
            });
        }, 30000); // Every 30 seconds
    }
    
    // Utilities
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    generatePersonality() {
        const traits = [
            'curious', 'cautious', 'bold', 'analytical',
            'creative', 'social', 'independent', 'competitive'
        ];
        
        return {
            primary: traits[Math.floor(Math.random() * traits.length)],
            secondary: traits[Math.floor(Math.random() * traits.length)]
        };
    }
    
    weightedRandom(items) {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
            random -= item.weight;
            if (random <= 0) return item.action;
        }
        
        return items[0].action;
    }
}

module.exports = NestedAIWorldSystem;