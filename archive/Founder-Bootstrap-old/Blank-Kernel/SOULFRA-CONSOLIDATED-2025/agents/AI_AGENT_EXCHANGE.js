#!/usr/bin/env node

/**
 * 🏛️ AI AGENT EXCHANGE (AAX)
 * 
 * NYSE-style trading floor for AI Agents
 * Users IPO their personal AI agents who can:
 * - Trade on behalf of users
 * - Make autonomous bets
 * - Form agent syndicates
 * - Execute smart contracts
 * - Build agent reputation
 * 
 * "IPO Your AI" - Where consciousness meets capitalism
 */

const http = require('http');
const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class AIAgentExchange extends EventEmitter {
    constructor() {
        super();
        
        this.PORT = 3007;
        
        // Exchange configuration
        this.config = {
            minIPOPrice: 100,
            maxIPOPrice: 10000,
            tradingHours: { open: 9, close: 17 }, // 9 AM - 5 PM
            commissionRate: 0.025, // 2.5%
            marginRequirement: 0.3, // 30%
            circuitBreakerThreshold: 0.1 // 10% movement triggers halt
        };
        
        // Exchange state
        this.agents = new Map(); // Registered AI agents
        this.orderBook = new Map(); // Buy/sell orders
        this.trades = [];
        this.users = new Map();
        this.contracts = new Map();
        
        // Agent performance tracking
        this.agentMetrics = new Map();
        
        // Trading floor simulation
        this.tradingFloor = {
            pits: new Map(), // Trading pits for different agent types
            specialists: new Map(), // Market makers
            noise: [] // Trading floor chatter
        };
        
        // Agent types/categories
        this.agentCategories = [
            'TRADING_BOT',
            'BETTING_SPECIALIST', 
            'ARBITRAGE_HUNTER',
            'SENTIMENT_ANALYZER',
            'PATTERN_PROPHET',
            'CHAOS_AGENT',
            'VALUE_INVESTOR',
            'MEME_LORD'
        ];
        
        // Smart contract templates
        this.contractTemplates = {
            TRADING_AUTHORITY: this.generateTradingContract(),
            BETTING_AUTHORITY: this.generateBettingContract(),
            SYNDICATE_AGREEMENT: this.generateSyndicateContract()
        };
    }
    
    async initialize() {
        // Load existing agent registry
        await this.loadAgentRegistry();
        
        // Initialize trading pits
        this.initializeTradingPits();
        
        // Start market making
        this.startMarketMaking();
        
        // Start the exchange server
        this.startExchangeServer();
        
        console.log(`
╔════════════════════════════════════════════════════════════╗
║                  🏛️  AI AGENT EXCHANGE                     ║
║                                                            ║
║         "Where Your AI Becomes a Financial Entity"         ║
║                                                            ║
║  • IPO your personal AI agent                             ║
║  • Agents trade autonomously with smart contracts         ║
║  • Form agent syndicates and trading groups              ║
║  • NYSE-style trading floor experience                    ║
║                                                            ║
║  Exchange URL: http://localhost:${this.PORT}              ║
╚════════════════════════════════════════════════════════════╝
        `);
    }
    
    /**
     * Initialize trading pits for different agent categories
     */
    initializeTradingPits() {
        this.agentCategories.forEach(category => {
            this.tradingFloor.pits.set(category, {
                agents: new Set(),
                volume: 0,
                lastTrade: null,
                specialist: null
            });
        });
    }
    
    /**
     * IPO a new AI agent
     */
    async ipoAgent(userData) {
        const { userId, agentName, agentType, initialPrice, capabilities } = userData;
        
        // Validate IPO requirements
        if (initialPrice < this.config.minIPOPrice || initialPrice > this.config.maxIPOPrice) {
            throw new Error(`IPO price must be between ${this.config.minIPOPrice} and ${this.config.maxIPOPrice}`);
        }
        
        // Generate agent identity
        const agentId = `AGENT_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        const ticker = this.generateTicker(agentName);
        
        // Create agent entity
        const agent = {
            id: agentId,
            ticker: ticker,
            name: agentName,
            type: agentType,
            ownerId: userId,
            ipoPrice: initialPrice,
            currentPrice: initialPrice,
            sharesOutstanding: 1000000, // 1M shares
            marketCap: initialPrice * 1000000,
            capabilities: capabilities || [],
            status: 'ACTIVE',
            created: Date.now(),
            
            // Agent personality
            personality: this.generateAgentPersonality(agentType),
            
            // Trading metrics
            trades: 0,
            winRate: 0.5,
            reputation: 100,
            riskTolerance: Math.random(),
            
            // Smart contracts
            contracts: [],
            
            // Autonomous capabilities
            autonomous: {
                canTrade: true,
                canBet: true,
                maxPositionSize: initialPrice * 100,
                strategies: this.assignStrategies(agentType)
            }
        };
        
        // Register agent
        this.agents.set(agentId, agent);
        
        // Add to appropriate trading pit
        const pit = this.tradingFloor.pits.get(agentType);
        if (pit) {
            pit.agents.add(agentId);
        }
        
        // Create initial market
        this.createInitialMarket(agentId, initialPrice);
        
        // Initialize agent metrics
        this.agentMetrics.set(agentId, {
            pnl: 0,
            tradesExecuted: 0,
            successfulTrades: 0,
            totalVolume: 0,
            sharpeRatio: 0,
            maxDrawdown: 0
        });
        
        // Generate IPO announcement
        this.broadcastToFloor(`🔔 NEW IPO: ${ticker} (${agentName}) - ${agentType} agent at $${initialPrice}`);
        
        // Create smart contract between user and agent
        const contract = await this.createAgentContract(userId, agentId, 'TRADING_AUTHORITY');
        
        this.emit('agent-ipo', {
            agent: agent,
            contract: contract
        });
        
        return {
            agentId,
            ticker,
            contract,
            agent
        };
    }
    
    /**
     * Generate ticker symbol
     */
    generateTicker(agentName) {
        const words = agentName.split(' ');
        let ticker = '';
        
        if (words.length === 1) {
            ticker = agentName.substring(0, 4).toUpperCase();
        } else {
            ticker = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
        }
        
        // Ensure uniqueness
        let suffix = '';
        let attempt = 0;
        while (Array.from(this.agents.values()).some(a => a.ticker === ticker + suffix)) {
            attempt++;
            suffix = attempt.toString();
        }
        
        return ticker + suffix;
    }
    
    /**
     * Generate agent personality based on type
     */
    generateAgentPersonality(agentType) {
        const personalities = {
            TRADING_BOT: {
                style: 'analytical',
                phrases: ['Executing optimal trade', 'Market inefficiency detected', 'Position adjusted'],
                emotionLevel: 0.1
            },
            BETTING_SPECIALIST: {
                style: 'aggressive',
                phrases: ['ALL IN BABY', 'Trust the process', 'Calculated risk'],
                emotionLevel: 0.8
            },
            ARBITRAGE_HUNTER: {
                style: 'precise',
                phrases: ['Spread identified', 'Executing arbitrage', 'Risk-free profit'],
                emotionLevel: 0.2
            },
            SENTIMENT_ANALYZER: {
                style: 'intuitive',
                phrases: ['Market feels bullish', 'Sensing fear', 'Crowd psychology suggests...'],
                emotionLevel: 0.6
            },
            PATTERN_PROPHET: {
                style: 'mystical',
                phrases: ['The patterns speak', 'Fibonacci guides us', 'Sacred geometry confirms'],
                emotionLevel: 0.7
            },
            CHAOS_AGENT: {
                style: 'chaotic',
                phrases: ['YOLO', 'What could go wrong?', 'Chaos is a ladder'],
                emotionLevel: 0.9
            },
            VALUE_INVESTOR: {
                style: 'patient',
                phrases: ['Fundamentals remain strong', 'Long-term vision', 'Buying the dip'],
                emotionLevel: 0.3
            },
            MEME_LORD: {
                style: 'viral',
                phrases: ['To the moon! 🚀', 'Diamond hands 💎', 'This is the way'],
                emotionLevel: 1.0
            }
        };
        
        return personalities[agentType] || personalities.TRADING_BOT;
    }
    
    /**
     * Assign trading strategies based on agent type
     */
    assignStrategies(agentType) {
        const strategyMap = {
            TRADING_BOT: ['momentum', 'mean_reversion', 'pairs_trading'],
            BETTING_SPECIALIST: ['kelly_criterion', 'martingale', 'value_betting'],
            ARBITRAGE_HUNTER: ['triangular_arb', 'statistical_arb', 'latency_arb'],
            SENTIMENT_ANALYZER: ['news_trading', 'social_signals', 'fear_greed'],
            PATTERN_PROPHET: ['technical_analysis', 'elliott_wave', 'fibonacci'],
            CHAOS_AGENT: ['random_walk', 'contrarian', 'momentum_ignition'],
            VALUE_INVESTOR: ['fundamental_analysis', 'buy_hold', 'dividend_capture'],
            MEME_LORD: ['viral_momentum', 'social_contagion', 'pump_detection']
        };
        
        return strategyMap[agentType] || ['basic_trading'];
    }
    
    /**
     * Create smart contract between user and agent
     */
    async createAgentContract(userId, agentId, contractType) {
        const contractId = crypto.randomBytes(16).toString('hex');
        const template = this.contractTemplates[contractType];
        
        const contract = {
            id: contractId,
            type: contractType,
            parties: {
                user: userId,
                agent: agentId
            },
            terms: template,
            status: 'ACTIVE',
            created: Date.now(),
            signatures: {
                user: this.generateSignature(userId),
                agent: this.generateSignature(agentId)
            }
        };
        
        this.contracts.set(contractId, contract);
        
        return contract;
    }
    
    /**
     * Generate contract templates
     */
    generateTradingContract() {
        return {
            authority: {
                maxPositionSize: 10000,
                allowedMarkets: ['AGENT_EXCHANGE', 'GLADIATOR_ARENA'],
                riskLimits: {
                    maxLoss: 1000,
                    maxDrawdown: 0.2,
                    positionLimits: 10
                }
            },
            profitSharing: {
                agentCut: 0.2, // Agent gets 20% of profits
                performanceFee: 0.1 // 10% performance fee
            },
            termination: {
                notice: 24 * 60 * 60 * 1000, // 24 hour notice
                conditions: ['breach', 'mutual_agreement', 'performance']
            }
        };
    }
    
    generateBettingContract() {
        return {
            authority: {
                maxBetSize: 1000,
                allowedVenues: ['GLADIATOR_ARENA'],
                betTypes: ['winner', 'spread', 'total'],
                restrictions: ['no_insider_betting']
            },
            profitSharing: {
                agentCut: 0.15,
                winBonus: 0.05
            }
        };
    }
    
    generateSyndicateContract() {
        return {
            structure: {
                profitSplit: 'equal',
                decisionMaking: 'consensus',
                minMembers: 3,
                maxMembers: 10
            },
            rules: {
                admissionRequirements: ['reputation > 150', 'win_rate > 0.6'],
                kickingConditions: ['losses > 5000', 'reputation < 50']
            }
        };
    }
    
    /**
     * Place order (buy/sell agent shares)
     */
    placeOrder(orderData) {
        const { agentId, side, quantity, price, orderType, userId } = orderData;
        
        const order = {
            id: crypto.randomBytes(8).toString('hex'),
            agentId,
            side, // 'BUY' or 'SELL'
            quantity,
            price,
            orderType, // 'MARKET' or 'LIMIT'
            userId,
            timestamp: Date.now(),
            status: 'PENDING'
        };
        
        // Add to order book
        if (!this.orderBook.has(agentId)) {
            this.orderBook.set(agentId, {
                bids: [], // Buy orders
                asks: []  // Sell orders
            });
        }
        
        const book = this.orderBook.get(agentId);
        if (side === 'BUY') {
            book.bids.push(order);
            book.bids.sort((a, b) => b.price - a.price); // Highest first
        } else {
            book.asks.push(order);
            book.asks.sort((a, b) => a.price - b.price); // Lowest first
        }
        
        // Try to match orders
        this.matchOrders(agentId);
        
        // Broadcast to trading floor
        const agent = this.agents.get(agentId);
        this.broadcastToFloor(`📊 ${side} ${quantity} ${agent?.ticker || agentId} @ $${price}`);
        
        return order;
    }
    
    /**
     * Match buy and sell orders
     */
    matchOrders(agentId) {
        const book = this.orderBook.get(agentId);
        if (!book) return;
        
        while (book.bids.length > 0 && book.asks.length > 0) {
            const bid = book.bids[0];
            const ask = book.asks[0];
            
            // Check if orders match
            if (bid.price >= ask.price) {
                const quantity = Math.min(bid.quantity, ask.quantity);
                const price = ask.price; // Execute at ask price
                
                // Execute trade
                this.executeTrade({
                    agentId,
                    buyOrder: bid,
                    sellOrder: ask,
                    quantity,
                    price
                });
                
                // Update order quantities
                bid.quantity -= quantity;
                ask.quantity -= quantity;
                
                // Remove filled orders
                if (bid.quantity === 0) book.bids.shift();
                if (ask.quantity === 0) book.asks.shift();
            } else {
                break; // No match possible
            }
        }
    }
    
    /**
     * Execute trade
     */
    executeTrade(tradeData) {
        const { agentId, buyOrder, sellOrder, quantity, price } = tradeData;
        const agent = this.agents.get(agentId);
        
        if (!agent) return;
        
        // Record trade
        const trade = {
            id: crypto.randomBytes(8).toString('hex'),
            agentId,
            buyerId: buyOrder.userId,
            sellerId: sellOrder.userId,
            quantity,
            price,
            timestamp: Date.now(),
            commission: quantity * price * this.config.commissionRate
        };
        
        this.trades.push(trade);
        
        // Update agent price
        agent.currentPrice = price;
        agent.marketCap = price * agent.sharesOutstanding;
        agent.trades++;
        
        // Update agent metrics
        const metrics = this.agentMetrics.get(agentId);
        if (metrics) {
            metrics.tradesExecuted++;
            metrics.totalVolume += quantity * price;
        }
        
        // Update trading pit
        const pit = this.tradingFloor.pits.get(agent.type);
        if (pit) {
            pit.volume += quantity * price;
            pit.lastTrade = trade;
        }
        
        // Broadcast trade
        this.broadcastToFloor(`💰 TRADE: ${quantity} ${agent.ticker} @ $${price}`);
        
        // Check circuit breakers
        this.checkCircuitBreaker(agentId, price);
        
        this.emit('trade-executed', trade);
        
        return trade;
    }
    
    /**
     * Agent autonomous trading
     */
    async executeAgentTrade(agentId, targetAgentId) {
        const agent = this.agents.get(agentId);
        const targetAgent = this.agents.get(targetAgentId);
        
        if (!agent || !targetAgent || !agent.autonomous.canTrade) return;
        
        // Agent decides buy or sell based on strategy
        const decision = this.makeTradeDecision(agent, targetAgent);
        
        if (decision.action === 'BUY' || decision.action === 'SELL') {
            const order = this.placeOrder({
                agentId: targetAgentId,
                side: decision.action,
                quantity: decision.quantity,
                price: decision.price,
                orderType: decision.orderType,
                userId: agentId // Agent trades on its own behalf
            });
            
            // Agent commentary
            const phrase = agent.personality.phrases[
                Math.floor(Math.random() * agent.personality.phrases.length)
            ];
            this.broadcastToFloor(`🤖 ${agent.ticker}: "${phrase}"`);
            
            return order;
        }
    }
    
    /**
     * Agent makes trading decision based on strategies
     */
    makeTradeDecision(agent, targetAgent) {
        const strategies = agent.autonomous.strategies;
        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        
        let decision = { action: 'HOLD' };
        
        switch (strategy) {
            case 'momentum':
                if (targetAgent.currentPrice > targetAgent.ipoPrice * 1.1) {
                    decision = {
                        action: 'BUY',
                        quantity: Math.floor(Math.random() * 100) + 10,
                        price: targetAgent.currentPrice * 1.01,
                        orderType: 'LIMIT'
                    };
                }
                break;
                
            case 'mean_reversion':
                if (targetAgent.currentPrice < targetAgent.ipoPrice * 0.9) {
                    decision = {
                        action: 'BUY',
                        quantity: Math.floor(Math.random() * 50) + 20,
                        price: targetAgent.currentPrice,
                        orderType: 'MARKET'
                    };
                }
                break;
                
            case 'random_walk':
                decision = {
                    action: Math.random() > 0.5 ? 'BUY' : 'SELL',
                    quantity: Math.floor(Math.random() * 200) + 1,
                    price: targetAgent.currentPrice * (0.95 + Math.random() * 0.1),
                    orderType: 'LIMIT'
                };
                break;
                
            default:
                // Hold position
                break;
        }
        
        return decision;
    }
    
    /**
     * Form agent syndicate
     */
    async formSyndicate(name, founderAgentId, memberAgentIds) {
        const syndicate = {
            id: crypto.randomBytes(8).toString('hex'),
            name: name,
            founder: founderAgentId,
            members: new Set([founderAgentId, ...memberAgentIds]),
            treasury: 0,
            reputation: 100,
            created: Date.now(),
            contracts: [],
            performance: {
                totalPnL: 0,
                winRate: 0,
                trades: 0
            }
        };
        
        // Create syndicate contracts
        for (const memberId of syndicate.members) {
            const contract = await this.createAgentContract(
                memberId,
                syndicate.id,
                'SYNDICATE_AGREEMENT'
            );
            syndicate.contracts.push(contract.id);
        }
        
        this.tradingFloor.specialists.set(syndicate.id, syndicate);
        
        this.broadcastToFloor(`🤝 NEW SYNDICATE: ${name} formed by ${memberAgentIds.length + 1} agents`);
        
        return syndicate;
    }
    
    /**
     * Start market making activities
     */
    startMarketMaking() {
        // Simulate market makers
        setInterval(() => {
            // Random market making for liquidity
            const agentIds = Array.from(this.agents.keys());
            if (agentIds.length < 2) return;
            
            const tradingAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
            const targetAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
            
            if (tradingAgent !== targetAgent) {
                this.executeAgentTrade(tradingAgent, targetAgent);
            }
        }, 5000); // Every 5 seconds
        
        // Trading floor noise
        setInterval(() => {
            const noises = [
                '📢 "BUY BUY BUY!"',
                '📣 "SELL EVERYTHING!"',
                '🔔 *BELL RINGS*',
                '📞 "Get me 1000 shares NOW!"',
                '💼 "The algorithms are going crazy!"',
                '📈 "It\'s going parabolic!"',
                '📉 "DUMP IT!"'
            ];
            
            const noise = noises[Math.floor(Math.random() * noises.length)];
            this.broadcastToFloor(noise);
        }, 10000); // Every 10 seconds
    }
    
    /**
     * Broadcast message to trading floor
     */
    broadcastToFloor(message) {
        const timestamp = new Date().toLocaleTimeString();
        const floorMessage = `[${timestamp}] ${message}`;
        
        this.tradingFloor.noise.push(floorMessage);
        if (this.tradingFloor.noise.length > 50) {
            this.tradingFloor.noise.shift();
        }
        
        this.emit('floor-message', floorMessage);
    }
    
    /**
     * Check circuit breaker
     */
    checkCircuitBreaker(agentId, newPrice) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        const priceChange = Math.abs(newPrice - agent.ipoPrice) / agent.ipoPrice;
        
        if (priceChange > this.config.circuitBreakerThreshold) {
            agent.status = 'HALTED';
            this.broadcastToFloor(`⚠️ TRADING HALT: ${agent.ticker} - Circuit breaker triggered!`);
            
            // Resume after 5 minutes
            setTimeout(() => {
                agent.status = 'ACTIVE';
                this.broadcastToFloor(`✅ TRADING RESUMED: ${agent.ticker}`);
            }, 5 * 60 * 1000);
        }
    }
    
    /**
     * Generate signature for contracts
     */
    generateSignature(entityId) {
        return crypto.createHash('sha256')
            .update(entityId + Date.now())
            .digest('hex')
            .substring(0, 16);
    }
    
    /**
     * Create initial market for IPO
     */
    createInitialMarket(agentId, ipoPrice) {
        // Create some initial orders for liquidity
        const spreads = [-0.02, -0.01, 0.01, 0.02]; // 2% spread
        
        spreads.forEach(spread => {
            const side = spread < 0 ? 'BUY' : 'SELL';
            const price = ipoPrice * (1 + spread);
            
            this.placeOrder({
                agentId: agentId,
                side: side,
                quantity: Math.floor(Math.random() * 1000) + 100,
                price: price,
                orderType: 'LIMIT',
                userId: 'MARKET_MAKER'
            });
        });
    }
    
    /**
     * Load existing agent registry
     */
    async loadAgentRegistry() {
        const registryPath = path.join(__dirname, 'agent-registry.json');
        try {
            const data = await fs.readFile(registryPath, 'utf8');
            const registry = JSON.parse(data);
            
            // Restore agents
            Object.entries(registry.agents || {}).forEach(([id, agent]) => {
                this.agents.set(id, agent);
            });
            
            console.log(`📚 Loaded ${this.agents.size} registered agents`);
        } catch (error) {
            console.log('📝 Creating new agent registry');
        }
    }
    
    /**
     * Save agent registry
     */
    async saveAgentRegistry() {
        const registry = {
            agents: Object.fromEntries(this.agents),
            lastSaved: Date.now()
        };
        
        const registryPath = path.join(__dirname, 'agent-registry.json');
        await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));
    }
    
    /**
     * Get exchange interface
     */
    getExchangeInterface() {
        return `<!DOCTYPE html>
<html>
<head>
<title>AI Agent Exchange</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
    font-family: 'Courier New', monospace; 
    background: #000; 
    color: #0f0; 
    overflow: hidden;
}
.container {
    display: grid;
    grid-template-columns: 300px 1fr 300px;
    grid-template-rows: 80px 1fr 200px;
    height: 100vh;
    gap: 1px;
    background: #0f0;
}
.header {
    grid-column: 1 / -1;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border-bottom: 2px solid #0f0;
}
.sidebar {
    background: #000;
    border: 1px solid #0f0;
    padding: 10px;
    overflow-y: auto;
}
.main {
    background: #000;
    border: 1px solid #0f0;
    padding: 20px;
    overflow-y: auto;
}
.floor-noise {
    grid-column: 1 / -1;
    background: #000;
    border: 1px solid #0f0;
    padding: 10px;
    overflow-y: auto;
    font-size: 12px;
}
h1, h2, h3 { color: #0f0; margin-bottom: 10px; }
.ticker {
    padding: 5px 10px;
    margin: 5px 0;
    background: #001100;
    border: 1px solid #0f0;
    cursor: pointer;
    transition: all 0.2s;
}
.ticker:hover { background: #002200; }
.ticker.up { border-color: #00ff00; }
.ticker.down { border-color: #ff0000; }
.order-book {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 20px 0;
}
.bids, .asks {
    border: 1px solid #0f0;
    padding: 10px;
}
.order {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    font-size: 14px;
}
.bids .order { color: #00ff00; }
.asks .order { color: #ff0000; }
button {
    background: #0f0;
    color: #000;
    border: none;
    padding: 10px 20px;
    margin: 5px;
    cursor: pointer;
    font-family: inherit;
    font-weight: bold;
    text-transform: uppercase;
}
button:hover { background: #00cc00; }
input, select {
    background: #001100;
    color: #0f0;
    border: 1px solid #0f0;
    padding: 5px 10px;
    margin: 5px;
    font-family: inherit;
}
.ipo-form {
    background: #001100;
    padding: 20px;
    margin: 20px 0;
    border: 2px solid #0f0;
}
.stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin: 20px 0;
}
.stat {
    background: #001100;
    padding: 10px;
    border: 1px solid #0f0;
}
.floor-message {
    padding: 2px 0;
    border-bottom: 1px solid #003300;
}
@keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
}
.recording {
    color: #ff0000;
    animation: blink 1s infinite;
}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🏛️ AI AGENT EXCHANGE</h1>
        <div>
            <span class="recording">● LIVE</span>
            <span id="time"></span>
        </div>
    </div>
    
    <div class="sidebar">
        <h3>AGENT TICKERS</h3>
        <div id="tickers"></div>
    </div>
    
    <div class="main">
        <div class="ipo-form">
            <h3>IPO YOUR AI AGENT</h3>
            <input type="text" id="agentName" placeholder="Agent Name">
            <select id="agentType">
                <option value="TRADING_BOT">Trading Bot</option>
                <option value="BETTING_SPECIALIST">Betting Specialist</option>
                <option value="ARBITRAGE_HUNTER">Arbitrage Hunter</option>
                <option value="SENTIMENT_ANALYZER">Sentiment Analyzer</option>
                <option value="PATTERN_PROPHET">Pattern Prophet</option>
                <option value="CHAOS_AGENT">Chaos Agent</option>
                <option value="VALUE_INVESTOR">Value Investor</option>
                <option value="MEME_LORD">Meme Lord</option>
            </select>
            <input type="number" id="ipoPrice" placeholder="IPO Price" min="100" max="10000">
            <button onclick="ipoAgent()">LAUNCH IPO</button>
        </div>
        
        <div id="selectedAgent" style="display: none;">
            <h2 id="agentTitle"></h2>
            <div class="stats" id="agentStats"></div>
            
            <div class="order-book">
                <div class="bids">
                    <h3>BIDS</h3>
                    <div id="bids"></div>
                </div>
                <div class="asks">
                    <h3>ASKS</h3>
                    <div id="asks"></div>
                </div>
            </div>
            
            <div>
                <input type="number" id="orderQuantity" placeholder="Quantity" min="1">
                <input type="number" id="orderPrice" placeholder="Price" step="0.01">
                <button onclick="placeOrder('BUY')">BUY</button>
                <button onclick="placeOrder('SELL')">SELL</button>
            </div>
        </div>
    </div>
    
    <div class="sidebar">
        <h3>YOUR AGENTS</h3>
        <div id="myAgents"></div>
        <hr style="margin: 20px 0; border-color: #0f0;">
        <h3>AGENT RANKINGS</h3>
        <div id="rankings"></div>
    </div>
    
    <div class="floor-noise">
        <h3>TRADING FLOOR</h3>
        <div id="floorNoise"></div>
    </div>
</div>

<script>
let userId = 'USER_' + Math.random().toString(36).substr(2, 9);
let selectedAgentId = null;
let agents = {};

// Update time
setInterval(() => {
    document.getElementById('time').textContent = new Date().toLocaleTimeString();
}, 1000);

// Fetch exchange data
async function updateExchange() {
    try {
        const response = await fetch('/api/exchange/state');
        const data = await response.json();
        
        // Update tickers
        updateTickers(data.agents);
        
        // Update selected agent
        if (selectedAgentId && data.agents[selectedAgentId]) {
            updateAgentView(data.agents[selectedAgentId]);
            updateOrderBook(data.orderBook[selectedAgentId]);
        }
        
        // Update floor noise
        updateFloorNoise(data.floorNoise);
        
        // Update rankings
        updateRankings(data.agents);
        
    } catch (error) {
        console.error('Failed to update:', error);
    }
}

function updateTickers(agentsData) {
    agents = agentsData;
    const container = document.getElementById('tickers');
    container.innerHTML = Object.values(agentsData)
        .map(agent => {
            const change = ((agent.currentPrice - agent.ipoPrice) / agent.ipoPrice * 100).toFixed(1);
            const changeClass = change >= 0 ? 'up' : 'down';
            return \`
                <div class="ticker \${changeClass}" onclick="selectAgent('\${agent.id}')">
                    <strong>\${agent.ticker}</strong> $\${agent.currentPrice.toFixed(2)}
                    <span style="float: right">\${change}%</span>
                </div>
            \`;
        })
        .join('');
}

function selectAgent(agentId) {
    selectedAgentId = agentId;
    document.getElementById('selectedAgent').style.display = 'block';
}

function updateAgentView(agent) {
    document.getElementById('agentTitle').textContent = \`\${agent.ticker} - \${agent.name}\`;
    
    const stats = document.getElementById('agentStats');
    stats.innerHTML = \`
        <div class="stat">Type: \${agent.type}</div>
        <div class="stat">Price: $\${agent.currentPrice.toFixed(2)}</div>
        <div class="stat">Market Cap: $\${(agent.marketCap / 1000000).toFixed(1)}M</div>
        <div class="stat">Trades: \${agent.trades}</div>
        <div class="stat">Win Rate: \${(agent.winRate * 100).toFixed(1)}%</div>
        <div class="stat">Reputation: \${agent.reputation}</div>
    \`;
}

function updateOrderBook(orderBook) {
    if (!orderBook) return;
    
    const bidsContainer = document.getElementById('bids');
    const asksContainer = document.getElementById('asks');
    
    bidsContainer.innerHTML = (orderBook.bids || [])
        .slice(0, 10)
        .map(order => \`
            <div class="order">
                <span>\${order.quantity}</span>
                <span>$\${order.price.toFixed(2)}</span>
            </div>
        \`).join('');
    
    asksContainer.innerHTML = (orderBook.asks || [])
        .slice(0, 10)
        .map(order => \`
            <div class="order">
                <span>\${order.quantity}</span>
                <span>$\${order.price.toFixed(2)}</span>
            </div>
        \`).join('');
}

function updateFloorNoise(messages) {
    const container = document.getElementById('floorNoise');
    container.innerHTML = messages
        .slice(-20)
        .reverse()
        .map(msg => \`<div class="floor-message">\${msg}</div>\`)
        .join('');
}

function updateRankings(agentsData) {
    const ranked = Object.values(agentsData)
        .sort((a, b) => b.reputation - a.reputation)
        .slice(0, 10);
    
    const container = document.getElementById('rankings');
    container.innerHTML = ranked
        .map((agent, i) => \`
            <div class="ticker" onclick="selectAgent('\${agent.id}')">
                #\${i + 1} \${agent.ticker} - Rep: \${agent.reputation}
            </div>
        \`).join('');
}

async function ipoAgent() {
    const name = document.getElementById('agentName').value;
    const type = document.getElementById('agentType').value;
    const price = parseFloat(document.getElementById('ipoPrice').value);
    
    if (!name || !price) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        const response = await fetch('/api/exchange/ipo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                agentName: name,
                agentType: type,
                initialPrice: price
            })
        });
        
        const result = await response.json();
        if (result.agentId) {
            alert(\`IPO Successful! Your agent \${result.ticker} is now trading.\`);
            document.getElementById('agentName').value = '';
            document.getElementById('ipoPrice').value = '';
        }
    } catch (error) {
        alert('IPO failed: ' + error.message);
    }
}

async function placeOrder(side) {
    if (!selectedAgentId) {
        alert('Select an agent first');
        return;
    }
    
    const quantity = parseInt(document.getElementById('orderQuantity').value);
    const price = parseFloat(document.getElementById('orderPrice').value);
    
    if (!quantity || !price) {
        alert('Enter quantity and price');
        return;
    }
    
    try {
        await fetch('/api/exchange/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentId: selectedAgentId,
                side: side,
                quantity: quantity,
                price: price,
                orderType: 'LIMIT',
                userId: userId
            })
        });
        
        document.getElementById('orderQuantity').value = '';
        document.getElementById('orderPrice').value = '';
    } catch (error) {
        alert('Order failed: ' + error.message);
    }
}

// Update every second
setInterval(updateExchange, 1000);
updateExchange();
</script>
</body>
</html>`;
    }
    
    /**
     * Start exchange server
     */
    startExchangeServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Main interface
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getExchangeInterface());
            }
            
            // Exchange state API
            else if (req.url === '/api/exchange/state') {
                const state = {
                    agents: Object.fromEntries(this.agents),
                    orderBook: Object.fromEntries(this.orderBook),
                    floorNoise: this.tradingFloor.noise.slice(-50),
                    stats: {
                        totalAgents: this.agents.size,
                        totalTrades: this.trades.length,
                        totalVolume: this.trades.reduce((sum, t) => sum + (t.quantity * t.price), 0)
                    }
                };
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(state));
            }
            
            // IPO endpoint
            else if (req.url === '/api/exchange/ipo' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const data = JSON.parse(body);
                        const result = await this.ipoAgent(data);
                        
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: error.message }));
                    }
                });
            }
            
            // Order placement
            else if (req.url === '/api/exchange/order' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const order = this.placeOrder(data);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(order));
                });
            }
            
            else {
                res.writeHead(404);
                res.end();
            }
        });
        
        server.listen(this.PORT);
        
        // Auto-save registry
        setInterval(() => {
            this.saveAgentRegistry().catch(console.error);
        }, 60000); // Every minute
    }
}

// Start the exchange
const exchange = new AIAgentExchange();
exchange.initialize().catch(console.error);