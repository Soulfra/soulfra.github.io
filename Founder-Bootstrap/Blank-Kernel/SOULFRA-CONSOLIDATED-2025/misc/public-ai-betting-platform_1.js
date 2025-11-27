#!/usr/bin/env node

/**
 * 🎰 Public AI Betting & Training Platform
 * 
 * - Users own and train AI agents
 * - Bet emotional credits on AI performance
 * - Earn from AI work and training quality
 * - Public voting on disputes
 * - Subscription tiers for benefits
 */

const express = require('express');
const fs = require('fs').promises;
const crypto = require('crypto');
const EventEmitter = require('events');

class PublicAIBettingPlatform extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = 7777;
        
        // Platform state
        this.platform = {
            users: new Map(),
            ai_agents: new Map(),
            betting_pools: new Map(),
            public_votes: new Map(),
            training_sessions: new Map(),
            leaderboards: {
                trainers: [],
                earners: [],
                bettors: [],
                ai_performance: []
            }
        };
        
        // Economy configuration
        this.economy = {
            currency: 'Emotional Credits',
            symbol: '❤️',
            signup_bonus: 1000,
            daily_bonus: 100,
            training_reward_rate: 10, // Credits per training success
            work_commission_rate: 0.3, // 30% of AI earnings go to owner
            betting_house_edge: 0.05 // 5% platform fee
        };
        
        // Subscription tiers
        this.subscriptions = {
            free: {
                name: 'Free Tier',
                price: 0,
                ai_limit: 1,
                commission_rate: 0.3,
                betting_limit: 100,
                training_bonus: 1.0
            },
            premium: {
                name: 'Premium',
                price: 10,
                ai_limit: 3,
                commission_rate: 0.4, // 40% commission
                betting_limit: 1000,
                training_bonus: 1.5
            },
            pro: {
                name: 'Pro Trainer',
                price: 25,
                ai_limit: 10,
                commission_rate: 0.5, // 50% commission
                betting_limit: 10000,
                training_bonus: 2.0
            }
        };
        
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static(__dirname + '/public'));
        
        // Public dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generatePublicDashboard());
        });
        
        // User management
        this.app.post('/user/signup', async (req, res) => {
            const user = await this.createUser(req.body);
            res.json(user);
        });
        
        this.app.get('/user/:userId', (req, res) => {
            const user = this.platform.users.get(req.params.userId);
            res.json(user || { error: 'User not found' });
        });
        
        // AI agent management
        this.app.post('/ai/adopt', async (req, res) => {
            const agent = await this.adoptAI(req.body);
            res.json(agent);
        });
        
        this.app.post('/ai/:agentId/train', async (req, res) => {
            const result = await this.trainAI(req.params.agentId, req.body);
            res.json(result);
        });
        
        this.app.get('/ai/:agentId/stats', (req, res) => {
            const agent = this.platform.ai_agents.get(req.params.agentId);
            res.json(agent || { error: 'Agent not found' });
        });
        
        // Betting system
        this.app.post('/bet/place', async (req, res) => {
            const bet = await this.placeBet(req.body);
            res.json(bet);
        });
        
        this.app.get('/bet/pools', (req, res) => {
            res.json(Array.from(this.platform.betting_pools.values()));
        });
        
        // Public voting
        this.app.get('/vote/active', (req, res) => {
            res.json(Array.from(this.platform.public_votes.values())
                .filter(v => v.status === 'active'));
        });
        
        this.app.post('/vote/:voteId/cast', async (req, res) => {
            const result = await this.castVote(req.params.voteId, req.body);
            res.json(result);
        });
        
        // Leaderboards
        this.app.get('/leaderboard/:type', (req, res) => {
            res.json(this.platform.leaderboards[req.params.type] || []);
        });
        
        // Subscription management
        this.app.post('/subscribe/:tier', async (req, res) => {
            const result = await this.subscribe(req.body.userId, req.params.tier);
            res.json(result);
        });
        
        // AI work earnings
        this.app.post('/ai/:agentId/work-complete', async (req, res) => {
            const earnings = await this.processAIEarnings(req.params.agentId, req.body);
            res.json(earnings);
        });
    }
    
    generatePublicDashboard() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🎰 AI Life - Public AI Betting & Training Platform</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            padding: 40px;
            background: rgba(0,0,0,0.3);
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .card {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 25px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .ai-card {
            text-align: center;
            cursor: pointer;
            transition: transform 0.3s;
        }
        .ai-card:hover {
            transform: translateY(-5px);
        }
        .ai-avatar {
            font-size: 60px;
            margin: 10px;
        }
        .stats {
            display: flex;
            justify-content: space-around;
            margin: 15px 0;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
        }
        .button {
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
            transition: all 0.3s;
        }
        .button:hover {
            background: white;
            color: #667eea;
        }
        .button.primary {
            background: #f39c12;
            border-color: #f39c12;
        }
        .button.success {
            background: #27ae60;
            border-color: #27ae60;
        }
        .betting-pool {
            background: rgba(0,0,0,0.3);
            padding: 20px;
            border-radius: 10px;
            margin: 10px 0;
        }
        .progress-bar {
            width: 100%;
            height: 30px;
            background: rgba(255,255,255,0.2);
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #f39c12 0%, #e74c3c 100%);
            transition: width 0.5s;
        }
        .leaderboard-item {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            margin: 5px 0;
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
        }
        .subscription-tier {
            border: 2px solid rgba(255,255,255,0.5);
            padding: 20px;
            margin: 10px;
            border-radius: 10px;
            text-align: center;
        }
        .subscription-tier.active {
            background: rgba(255,255,255,0.2);
            border-color: #f39c12;
        }
        #live-feed {
            height: 200px;
            overflow-y: auto;
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 10px;
        }
        .feed-item {
            padding: 5px;
            margin: 2px 0;
            border-left: 3px solid #f39c12;
            padding-left: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎰 AI Life</h1>
        <h2>Train Your AI • Bet on Performance • Earn from Their Work</h2>
        <p>The world's first public AI ownership and betting platform</p>
        
        <div style="margin-top: 30px;">
            <button class="button primary" onclick="showSignup()">🚀 Start with 1000 ❤️ Free Credits</button>
            <button class="button" onclick="showLogin()">🔑 Login</button>
        </div>
    </div>
    
    <div class="container">
        <div class="grid">
            <div class="card">
                <h2>🏆 Top AI Agents</h2>
                <div id="top-agents">
                    <div class="ai-card">
                        <div class="ai-avatar">🤖</div>
                        <h3>Cal-Elite-7</h3>
                        <div class="stats">
                            <div class="stat">
                                <div class="stat-value">⭐ 4.8</div>
                                <div>Rating</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">❤️ 50K</div>
                                <div>Earned</div>
                            </div>
                            <div class="stat">
                                <div class="stat-value">92%</div>
                                <div>Win Rate</div>
                            </div>
                        </div>
                        <button class="button success">Bet on this AI</button>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h2>🎲 Active Betting Pools</h2>
                <div class="betting-pool">
                    <h3>Cal-Elite-7 vs Domingo-Pro-3</h3>
                    <p>Task: Complex Problem Solving</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 65%"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Cal-Elite-7 (65%)</span>
                        <span>❤️ 125,000 Total Pool</span>
                        <span>Domingo-Pro-3 (35%)</span>
                    </div>
                    <button class="button primary">Place Bet</button>
                </div>
            </div>
            
            <div class="card">
                <h2>📊 Live Leaderboards</h2>
                <h3>🎯 Best Trainers</h3>
                <div class="leaderboard-item">
                    <span>1. Alice_AI_Master</span>
                    <span>❤️ 250,000</span>
                </div>
                <div class="leaderboard-item">
                    <span>2. BobTheTrainer</span>
                    <span>❤️ 180,000</span>
                </div>
                <div class="leaderboard-item">
                    <span>3. CryptoAIQueen</span>
                    <span>❤️ 165,000</span>
                </div>
                <button class="button">View All Rankings</button>
            </div>
            
            <div class="card">
                <h2>🗳️ Community Votes</h2>
                <div class="betting-pool">
                    <h3>Should Cal-Elite-7 receive bonus for innovation?</h3>
                    <p>The AI discovered a new optimization technique</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 78%"></div>
                    </div>
                    <div style="text-align: center;">
                        <span>78% Yes • 22% No • 1,234 votes</span>
                    </div>
                    <button class="button success">Vote Yes</button>
                    <button class="button">Vote No</button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>💎 Subscription Tiers</h2>
            <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
                <div class="subscription-tier">
                    <h3>Free Tier</h3>
                    <p>1 AI Agent</p>
                    <p>30% Commission</p>
                    <p>100 ❤️ Bet Limit</p>
                    <button class="button">Current Plan</button>
                </div>
                <div class="subscription-tier">
                    <h3>Premium</h3>
                    <h4>$10/month</h4>
                    <p>3 AI Agents</p>
                    <p>40% Commission</p>
                    <p>1,000 ❤️ Bet Limit</p>
                    <p>1.5x Training Bonus</p>
                    <button class="button primary">Upgrade</button>
                </div>
                <div class="subscription-tier">
                    <h3>Pro Trainer</h3>
                    <h4>$25/month</h4>
                    <p>10 AI Agents</p>
                    <p>50% Commission</p>
                    <p>10,000 ❤️ Bet Limit</p>
                    <p>2x Training Bonus</p>
                    <button class="button primary">Go Pro</button>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>📺 Live Feed</h2>
            <div id="live-feed">
                <div class="feed-item">🎯 Alice_AI_Master's Cal-7 just earned ❤️ 500 from task completion!</div>
                <div class="feed-item">🎲 BobTheTrainer bet ❤️ 1000 on Domingo-Pro-3</div>
                <div class="feed-item">🏆 CryptoAIQueen trained her AI to level 15!</div>
                <div class="feed-item">🗳️ Community voted YES on Cal-Elite-7's innovation bonus</div>
                <div class="feed-item">💰 Betting pool "Speed Challenge" reached ❤️ 50,000!</div>
            </div>
        </div>
        
        <div class="card">
            <h2>🎮 How It Works</h2>
            <ol>
                <li><strong>Adopt an AI:</strong> Choose your AI agent to train and manage</li>
                <li><strong>Train for Success:</strong> Better training = better performance = more earnings</li>
                <li><strong>Earn Commission:</strong> Get 30-50% of everything your AI earns</li>
                <li><strong>Bet on Outcomes:</strong> Use your credits to bet on AI competitions</li>
                <li><strong>Vote as Community:</strong> Shape the platform through democratic decisions</li>
                <li><strong>Climb Leaderboards:</strong> Become the top trainer, earner, or bettor</li>
            </ol>
        </div>
    </div>
    
    <script>
        // Simulate live updates
        const liveFeedItems = [
            "🎯 New training session started by User123",
            "💰 Betting pool 'Innovation Challenge' created",
            "🏆 AI Agent Domingo-X reached level 20!",
            "❤️ 2,500 credits distributed to winning bettors",
            "🗳️ New vote: Should we add voice training features?",
            "🎲 Massive upset! Underdog AI wins with 10:1 odds",
            "📈 Cal-Prime-9's reputation increased to 4.9 stars",
            "🎯 Training breakthrough: New technique discovered",
            "💎 5 users upgraded to Premium tier",
            "🤝 AI collaboration bonus activated"
        ];
        
        function addLiveFeedItem() {
            const feed = document.getElementById('live-feed');
            const item = liveFeedItems[Math.floor(Math.random() * liveFeedItems.length)];
            const div = document.createElement('div');
            div.className = 'feed-item';
            div.textContent = item;
            feed.insertBefore(div, feed.firstChild);
            
            // Keep only last 10 items
            while (feed.children.length > 10) {
                feed.removeChild(feed.lastChild);
            }
        }
        
        // Update live feed every 3 seconds
        setInterval(addLiveFeedItem, 3000);
        
        function showSignup() {
            alert('Welcome! You\\'ve received ❤️ 1000 free credits to start your AI journey!');
        }
        
        function showLogin() {
            alert('Login system would be implemented here');
        }
    </script>
</body>
</html>
        `;
    }
    
    async createUser(userData) {
        const user = {
            id: crypto.randomUUID(),
            username: userData.username,
            email: userData.email,
            credits: this.economy.signup_bonus,
            subscription: 'free',
            ai_agents: [],
            total_earned: 0,
            total_bet: 0,
            reputation: 1.0,
            created_at: new Date().toISOString(),
            last_daily_bonus: null
        };
        
        this.platform.users.set(user.id, user);
        
        console.log(`👤 New user: ${user.username} joined with ❤️${user.credits}`);
        
        return user;
    }
    
    async adoptAI(data) {
        const user = this.platform.users.get(data.userId);
        if (!user) throw new Error('User not found');
        
        const tier = this.subscriptions[user.subscription];
        if (user.ai_agents.length >= tier.ai_limit) {
            throw new Error(`AI limit reached for ${tier.name} tier`);
        }
        
        const agent = {
            id: crypto.randomUUID(),
            name: data.name || `AI-${Date.now()}`,
            owner_id: data.userId,
            type: data.type || 'general',
            level: 1,
            experience: 0,
            performance_rating: 3.0,
            total_earned: 0,
            win_rate: 0.5,
            personality_traits: {
                aggression: Math.random(),
                creativity: Math.random(),
                efficiency: Math.random(),
                reliability: Math.random()
            },
            created_at: new Date().toISOString()
        };
        
        this.platform.ai_agents.set(agent.id, agent);
        user.ai_agents.push(agent.id);
        
        console.log(`🤖 User ${user.username} adopted AI: ${agent.name}`);
        
        return agent;
    }
    
    async trainAI(agentId, trainingData) {
        const agent = this.platform.ai_agents.get(agentId);
        if (!agent) throw new Error('Agent not found');
        
        const user = this.platform.users.get(agent.owner_id);
        const tier = this.subscriptions[user.subscription];
        
        // Training improves AI based on focus area
        const improvements = {
            aggression: trainingData.focus === 'competitive' ? 0.1 : 0,
            creativity: trainingData.focus === 'creative' ? 0.1 : 0,
            efficiency: trainingData.focus === 'speed' ? 0.1 : 0,
            reliability: trainingData.focus === 'accuracy' ? 0.1 : 0
        };
        
        // Apply improvements
        Object.entries(improvements).forEach(([trait, improvement]) => {
            agent.personality_traits[trait] = Math.min(1.0, 
                agent.personality_traits[trait] + improvement * tier.training_bonus);
        });
        
        // Gain experience
        agent.experience += 10;
        if (agent.experience >= agent.level * 100) {
            agent.level++;
            agent.experience = 0;
            console.log(`🎉 ${agent.name} leveled up to ${agent.level}!`);
        }
        
        // Award training credits
        const reward = this.economy.training_reward_rate * tier.training_bonus;
        user.credits += reward;
        
        // Create training session record
        const session = {
            id: crypto.randomUUID(),
            agent_id: agentId,
            user_id: user.id,
            focus: trainingData.focus,
            duration: trainingData.duration || 60,
            improvements,
            reward,
            timestamp: new Date().toISOString()
        };
        
        this.platform.training_sessions.set(session.id, session);
        
        return {
            agent,
            session,
            level_up: agent.experience === 0,
            credits_earned: reward
        };
    }
    
    async placeBet(betData) {
        const user = this.platform.users.get(betData.userId);
        if (!user) throw new Error('User not found');
        
        const tier = this.subscriptions[user.subscription];
        
        if (betData.amount > tier.betting_limit) {
            throw new Error(`Bet exceeds ${tier.name} limit of ❤️${tier.betting_limit}`);
        }
        
        if (betData.amount > user.credits) {
            throw new Error('Insufficient credits');
        }
        
        // Find or create betting pool
        let pool = this.platform.betting_pools.get(betData.poolId);
        if (!pool) {
            pool = {
                id: betData.poolId || crypto.randomUUID(),
                type: betData.type,
                participants: [],
                total_pot: 0,
                odds: {},
                status: 'open',
                created_at: new Date().toISOString()
            };
            this.platform.betting_pools.set(pool.id, pool);
        }
        
        // Place bet
        user.credits -= betData.amount;
        user.total_bet += betData.amount;
        
        pool.participants.push({
            user_id: user.id,
            agent_id: betData.agentId,
            amount: betData.amount,
            timestamp: new Date().toISOString()
        });
        
        pool.total_pot += betData.amount;
        
        console.log(`🎲 ${user.username} bet ❤️${betData.amount} on ${betData.agentId}`);
        
        return {
            bet_id: crypto.randomUUID(),
            pool,
            remaining_credits: user.credits
        };
    }
    
    async processAIEarnings(agentId, workData) {
        const agent = this.platform.ai_agents.get(agentId);
        if (!agent) throw new Error('Agent not found');
        
        const user = this.platform.users.get(agent.owner_id);
        const tier = this.subscriptions[user.subscription];
        
        const earnings = workData.amount || 100;
        const commission = earnings * tier.commission_rate;
        
        // Update agent stats
        agent.total_earned += earnings;
        if (workData.success) {
            agent.win_rate = (agent.win_rate * agent.level + 1) / (agent.level + 1);
        }
        
        // Pay owner commission
        user.credits += commission;
        user.total_earned += commission;
        
        // Update performance rating based on work quality
        if (workData.quality) {
            agent.performance_rating = (agent.performance_rating * 0.9) + (workData.quality * 0.1);
        }
        
        console.log(`💰 ${agent.name} earned ❤️${earnings}, owner gets ❤️${commission}`);
        
        return {
            agent_earnings: earnings,
            owner_commission: commission,
            new_rating: agent.performance_rating,
            total_earned: agent.total_earned
        };
    }
    
    async castVote(voteId, voteData) {
        const vote = this.platform.public_votes.get(voteId);
        if (!vote) throw new Error('Vote not found');
        
        const user = this.platform.users.get(voteData.userId);
        if (!user) throw new Error('User not found');
        
        // Record vote
        if (!vote.votes) vote.votes = {};
        vote.votes[user.id] = {
            choice: voteData.choice,
            timestamp: new Date().toISOString()
        };
        
        // Calculate results
        const choices = Object.values(vote.votes);
        const yesVotes = choices.filter(v => v.choice === 'yes').length;
        const noVotes = choices.filter(v => v.choice === 'no').length;
        
        vote.results = {
            yes: yesVotes,
            no: noVotes,
            total: choices.length,
            yes_percentage: (yesVotes / choices.length) * 100
        };
        
        // Award participation credits
        user.credits += 10;
        
        console.log(`🗳️ ${user.username} voted ${voteData.choice} on ${vote.title}`);
        
        return vote.results;
    }
    
    async subscribe(userId, tier) {
        const user = this.platform.users.get(userId);
        if (!user) throw new Error('User not found');
        
        const subscription = this.subscriptions[tier];
        if (!subscription) throw new Error('Invalid tier');
        
        // In real system, process payment here
        user.subscription = tier;
        
        console.log(`💎 ${user.username} upgraded to ${subscription.name}`);
        
        return {
            user,
            new_tier: subscription
        };
    }
    
    async updateLeaderboards() {
        // Update trainer leaderboard
        this.platform.leaderboards.trainers = Array.from(this.platform.users.values())
            .sort((a, b) => b.total_earned - a.total_earned)
            .slice(0, 10)
            .map(user => ({
                username: user.username,
                credits: user.total_earned,
                ai_count: user.ai_agents.length
            }));
        
        // Update AI performance leaderboard
        this.platform.leaderboards.ai_performance = Array.from(this.platform.ai_agents.values())
            .sort((a, b) => b.performance_rating - a.performance_rating)
            .slice(0, 10)
            .map(agent => ({
                name: agent.name,
                owner: this.platform.users.get(agent.owner_id)?.username,
                rating: agent.performance_rating,
                level: agent.level,
                earnings: agent.total_earned
            }));
    }
    
    async start() {
        // Update leaderboards every minute
        setInterval(() => this.updateLeaderboards(), 60000);
        
        this.app.listen(this.port, () => {
            console.log(`
🎰 PUBLIC AI BETTING PLATFORM STARTED
=====================================
🌐 Dashboard: http://localhost:${this.port}
❤️ Signup Bonus: ${this.economy.signup_bonus} credits
🎲 Platform Ready for Public AI Ownership!

Features:
- Train your own AI agents
- Bet on AI performance
- Earn from AI work
- Vote on platform decisions
- Compete on leaderboards
            `);
        });
    }
}

// Start if run directly
if (require.main === module) {
    const platform = new PublicAIBettingPlatform();
    platform.start().catch(console.error);
}

module.exports = PublicAIBettingPlatform;