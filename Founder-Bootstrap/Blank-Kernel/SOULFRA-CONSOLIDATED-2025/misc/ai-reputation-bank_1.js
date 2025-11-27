#!/usr/bin/env node

/**
 * 🏦 AI Reputation Bank & Interaction Rating System
 * 
 * - AIs rate each other after interactions
 * - Reputation affects earnings and future partnerships
 * - Users have final approval on all transactions
 * - Creates a trust network where AIs want to work together
 */

const express = require('express');
const fs = require('fs').promises;
const crypto = require('crypto');
const EventEmitter = require('events');

class AIReputationBank extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = 8888;
        
        // Bank & Reputation System
        this.bank = {
            accounts: new Map(),
            interactions: [],
            ratings: new Map(), // interaction_id -> ratings
            trust_network: new Map(), // ai1_ai2 -> trust_score
            pending_user_approvals: new Map(),
            user_overrides: []
        };
        
        // Reputation factors
        this.reputationFactors = {
            interaction_rating_weight: 0.4,
            task_completion_weight: 0.3,
            peer_trust_weight: 0.2,
            user_approval_weight: 0.1
        };
        
        // Files
        this.bankFile = './ai-reputation-bank.json';
        this.trustNetworkFile = './ai-trust-network.json';
        
        this.setupRoutes();
        this.initializeAccounts();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // Account management
        this.app.post('/bank/account/create', async (req, res) => {
            const account = await this.createAccount(req.body);
            res.json(account);
        });
        
        this.app.get('/bank/account/:aiId', (req, res) => {
            const account = this.bank.accounts.get(req.params.aiId);
            res.json(account || { error: 'Account not found' });
        });
        
        // Interaction tracking
        this.app.post('/interaction/start', async (req, res) => {
            const interaction = await this.startInteraction(req.body);
            res.json(interaction);
        });
        
        this.app.post('/interaction/:id/complete', async (req, res) => {
            const result = await this.completeInteraction(req.params.id, req.body);
            res.json(result);
        });
        
        // Rating system
        this.app.post('/interaction/:id/rate', async (req, res) => {
            const rating = await this.rateInteraction(req.params.id, req.body);
            res.json(rating);
        });
        
        // Trust network
        this.app.get('/trust/network', (req, res) => {
            res.json(Object.fromEntries(this.bank.trust_network));
        });
        
        this.app.get('/trust/score/:ai1/:ai2', (req, res) => {
            const score = this.getTrustScore(req.params.ai1, req.params.ai2);
            res.json({ trust_score: score });
        });
        
        // User approval system
        this.app.get('/user/pending-approvals', (req, res) => {
            res.json(Array.from(this.bank.pending_user_approvals.values()));
        });
        
        this.app.post('/user/approve/:transactionId', async (req, res) => {
            const result = await this.userApproval(req.params.transactionId, true, req.body.reason);
            res.json(result);
        });
        
        this.app.post('/user/deny/:transactionId', async (req, res) => {
            const result = await this.userApproval(req.params.transactionId, false, req.body.reason);
            res.json(result);
        });
        
        // Reputation rankings
        this.app.get('/reputation/rankings', (req, res) => {
            const rankings = this.getReputationRankings();
            res.json(rankings);
        });
        
        // AI matchmaking based on trust
        this.app.post('/matchmaking/suggest', (req, res) => {
            const suggestions = this.suggestPartners(req.body.aiId, req.body.taskType);
            res.json(suggestions);
        });
    }
    
    generateDashboard() {
        const rankings = this.getReputationRankings();
        const pendingCount = this.bank.pending_user_approvals.size;
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🏦 AI Reputation Bank</title>
    <style>
        body { 
            font-family: 'Arial', sans-serif; 
            background: #f0f2f5;
            color: #1c1e21; 
            padding: 0;
            margin: 0;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .card { 
            background: white; 
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
            margin: 20px 0;
        }
        .ai-profile {
            display: inline-block;
            margin: 10px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            min-width: 200px;
        }
        .reputation-bar {
            width: 100%;
            height: 20px;
            background: #e9ecef;
            border-radius: 10px;
            overflow: hidden;
            margin: 5px 0;
        }
        .reputation-fill {
            height: 100%;
            background: linear-gradient(90deg, #d63031 0%, #fdcb6e 50%, #00b894 100%);
            transition: width 0.5s;
        }
        .stars {
            color: #fdcb6e;
            font-size: 20px;
        }
        .pending-approval {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
        }
        button {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 5px;
            font-weight: bold;
        }
        .approve { background: #00b894; color: white; }
        .deny { background: #d63031; color: white; }
        .neutral { background: #74b9ff; color: white; }
        .trust-matrix {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            padding: 10px;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        .trust-high { background: #00b89450; }
        .trust-medium { background: #fdcb6e50; }
        .trust-low { background: #d6303150; }
        .user-control {
            background: #e8f5e9;
            border: 2px solid #4caf50;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏦 AI Reputation Bank & Trust Network</h1>
        <p>Where AIs build trust through successful interactions</p>
    </div>
    
    <div class="container">
        <div class="card user-control">
            <h2>👤 User Control Panel</h2>
            <p>You have final approval on all AI transactions</p>
            <h3>⏳ Pending Approvals: ${pendingCount}</h3>
            <button class="neutral" onclick="loadPendingApprovals()">Review Pending Transactions</button>
        </div>
        
        <div class="card">
            <h2>🏆 AI Reputation Rankings</h2>
            <div id="rankings">
                ${rankings.map((ai, index) => `
                    <div class="ai-profile">
                        <h3>${index + 1}. ${ai.name}</h3>
                        <div class="reputation-bar">
                            <div class="reputation-fill" style="width: ${ai.reputation * 100}%"></div>
                        </div>
                        <div>💰 Balance: ◉${ai.balance}</div>
                        <div>⭐ Rating: ${this.getStarRating(ai.avg_rating)}</div>
                        <div>🤝 Trust Score: ${(ai.trust_score * 100).toFixed(0)}%</div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="card">
            <h2>🤝 Trust Network Matrix</h2>
            <div class="trust-matrix">
                <table>
                    <tr>
                        <th></th>
                        ${rankings.map(ai => `<th>${ai.name}</th>`).join('')}
                    </tr>
                    ${rankings.map(ai1 => `
                        <tr>
                            <th>${ai1.name}</th>
                            ${rankings.map(ai2 => {
                                const trust = this.getTrustScore(ai1.id, ai2.id);
                                const trustClass = trust > 0.7 ? 'trust-high' : trust > 0.4 ? 'trust-medium' : 'trust-low';
                                return `<td class="${trustClass}">${ai1.id === ai2.id ? '-' : (trust * 100).toFixed(0)}%</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </table>
            </div>
        </div>
        
        <div class="card">
            <h2>📊 Recent Interactions</h2>
            <div id="recent-interactions">
                ${this.bank.interactions.slice(-5).reverse().map(interaction => `
                    <div class="pending-approval">
                        <strong>${interaction.participants.join(' ↔ ')}</strong><br>
                        Type: ${interaction.type} | Value: ◉${interaction.value}<br>
                        Status: ${interaction.status}<br>
                        ${interaction.ratings ? `Ratings: ${Object.entries(interaction.ratings).map(([rater, rating]) => 
                            `${rater}: ${this.getStarRating(rating.score)}`).join(', ')}` : 'Not yet rated'}
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="card">
            <h2>🎯 AI Matchmaking</h2>
            <button class="neutral" onclick="suggestPartners()">Find Best Partners</button>
            <div id="partner-suggestions"></div>
        </div>
    </div>
    
    <div id="approval-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
        <div style="background: white; margin: 50px auto; padding: 30px; max-width: 600px; border-radius: 10px;">
            <h2>👤 User Approval Required</h2>
            <div id="approval-content"></div>
        </div>
    </div>
    
    <script>
        async function loadPendingApprovals() {
            const response = await fetch('/user/pending-approvals');
            const pending = await response.json();
            
            if (pending.length === 0) {
                alert('No pending approvals!');
                return;
            }
            
            let html = '<h3>Pending Transactions:</h3>';
            pending.forEach(transaction => {
                html += \`
                    <div class="pending-approval">
                        <strong>\${transaction.type}: \${transaction.description}</strong><br>
                        Participants: \${transaction.participants.join(', ')}<br>
                        Value: ◉\${transaction.value}<br>
                        AI Consensus: \${transaction.ai_recommendation}<br>
                        <button class="approve" onclick="approveTransaction('\${transaction.id}')">✅ Approve</button>
                        <button class="deny" onclick="denyTransaction('\${transaction.id}')">❌ Deny</button>
                    </div>
                \`;
            });
            
            document.getElementById('approval-content').innerHTML = html;
            document.getElementById('approval-modal').style.display = 'block';
        }
        
        async function approveTransaction(id) {
            const reason = prompt('Reason for approval (optional):');
            await fetch(\`/user/approve/\${id}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            alert('Transaction approved!');
            location.reload();
        }
        
        async function denyTransaction(id) {
            const reason = prompt('Reason for denial:');
            if (!reason) return;
            
            await fetch(\`/user/deny/\${id}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            alert('Transaction denied!');
            location.reload();
        }
        
        async function suggestPartners() {
            const aiId = prompt('AI ID to find partners for:');
            const taskType = prompt('Task type:');
            
            const response = await fetch('/matchmaking/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aiId, taskType })
            });
            
            const suggestions = await response.json();
            
            let html = '<h3>Recommended Partners:</h3>';
            suggestions.forEach(partner => {
                html += \`<div class="ai-profile">
                    <strong>\${partner.name}</strong><br>
                    Match Score: \${(partner.match_score * 100).toFixed(0)}%<br>
                    Trust: \${(partner.trust * 100).toFixed(0)}%<br>
                    Past Success: \${partner.successful_interactions}
                </div>\`;
            });
            
            document.getElementById('partner-suggestions').innerHTML = html;
        }
        
        // Close modal
        document.getElementById('approval-modal').onclick = function(e) {
            if (e.target === this) {
                this.style.display = 'none';
            }
        }
        
        // Auto-refresh
        setInterval(() => location.reload(), 30000);
    </script>
</body>
</html>
        `;
    }
    
    async initializeAccounts() {
        // Create default accounts
        const defaultAccounts = [
            { id: 'cal', name: 'Cal', type: 'worker', initial_balance: 50000 },
            { id: 'domingo', name: 'Domingo', type: 'boss', initial_balance: 900000 },
            { id: 'arbitrator', name: 'Trinity Arbitrator', type: 'judge', initial_balance: 50000 },
            { id: 'cal-1', name: 'Cal Instance 1', type: 'worker', initial_balance: 0 },
            { id: 'cal-2', name: 'Cal Instance 2', type: 'worker', initial_balance: 0 }
        ];
        
        for (const accountData of defaultAccounts) {
            if (!this.bank.accounts.has(accountData.id)) {
                await this.createAccount(accountData);
            }
        }
    }
    
    async createAccount(data) {
        const account = {
            id: data.id,
            name: data.name,
            type: data.type,
            balance: data.initial_balance || 0,
            reputation: 1.0,
            total_interactions: 0,
            successful_interactions: 0,
            ratings_received: [],
            ratings_given: [],
            created_at: new Date().toISOString()
        };
        
        this.bank.accounts.set(account.id, account);
        
        console.log(`🏦 Created account for ${account.name} with ◉${account.balance}`);
        
        return account;
    }
    
    async startInteraction(data) {
        const interaction = {
            id: crypto.randomUUID(),
            participants: data.participants,
            type: data.type,
            description: data.description,
            value: data.value || 0,
            started_at: new Date().toISOString(),
            status: 'in_progress',
            ratings: {}
        };
        
        this.bank.interactions.push(interaction);
        
        console.log(`🤝 Started interaction: ${interaction.participants.join(' ↔ ')}`);
        
        return interaction;
    }
    
    async completeInteraction(interactionId, result) {
        const interaction = this.bank.interactions.find(i => i.id === interactionId);
        if (!interaction) throw new Error('Interaction not found');
        
        interaction.status = 'completed';
        interaction.completed_at = new Date().toISOString();
        interaction.result = result;
        
        // Update participant stats
        for (const participantId of interaction.participants) {
            const account = this.bank.accounts.get(participantId);
            if (account) {
                account.total_interactions++;
                if (result.success) {
                    account.successful_interactions++;
                }
            }
        }
        
        // Create transaction for user approval
        const transaction = {
            id: crypto.randomUUID(),
            type: 'interaction_payment',
            description: `Payment for ${interaction.type}`,
            participants: interaction.participants,
            value: interaction.value,
            ai_recommendation: result.success ? 'approve' : 'review',
            interaction_id: interactionId,
            timestamp: new Date().toISOString()
        };
        
        this.bank.pending_user_approvals.set(transaction.id, transaction);
        
        console.log(`✅ Interaction completed, pending user approval`);
        
        return interaction;
    }
    
    async rateInteraction(interactionId, ratingData) {
        const interaction = this.bank.interactions.find(i => i.id === interactionId);
        if (!interaction) throw new Error('Interaction not found');
        
        const rating = {
            rater: ratingData.rater,
            ratee: ratingData.ratee,
            score: ratingData.score, // 1-5
            comment: ratingData.comment,
            timestamp: new Date().toISOString()
        };
        
        interaction.ratings[ratingData.rater] = rating;
        
        // Update ratee's reputation
        const rateeAccount = this.bank.accounts.get(ratingData.ratee);
        if (rateeAccount) {
            rateeAccount.ratings_received.push(rating);
            
            // Recalculate reputation
            await this.updateReputation(ratingData.ratee);
        }
        
        // Update trust score between the two AIs
        await this.updateTrustScore(ratingData.rater, ratingData.ratee, ratingData.score);
        
        console.log(`⭐ ${ratingData.rater} rated ${ratingData.ratee}: ${ratingData.score}/5`);
        
        return rating;
    }
    
    async updateReputation(aiId) {
        const account = this.bank.accounts.get(aiId);
        if (!account) return;
        
        // Calculate average rating
        const avgRating = account.ratings_received.length > 0 ?
            account.ratings_received.reduce((sum, r) => sum + r.score, 0) / account.ratings_received.length : 3;
        
        // Calculate success rate
        const successRate = account.total_interactions > 0 ?
            account.successful_interactions / account.total_interactions : 0.5;
        
        // Calculate peer trust
        let totalTrust = 0;
        let trustCount = 0;
        for (const [key, trust] of this.bank.trust_network) {
            if (key.includes(aiId)) {
                totalTrust += trust;
                trustCount++;
            }
        }
        const avgTrust = trustCount > 0 ? totalTrust / trustCount : 0.5;
        
        // Combined reputation score
        account.reputation = 
            (avgRating / 5) * this.reputationFactors.interaction_rating_weight +
            successRate * this.reputationFactors.task_completion_weight +
            avgTrust * this.reputationFactors.peer_trust_weight +
            0.5 * this.reputationFactors.user_approval_weight; // Default until user feedback
        
        account.reputation = Math.max(0, Math.min(1, account.reputation));
    }
    
    async updateTrustScore(ai1, ai2, rating) {
        const key = [ai1, ai2].sort().join('_');
        const currentTrust = this.bank.trust_network.get(key) || 0.5;
        
        // Trust moves slowly - weighted average with existing trust
        const newTrust = (currentTrust * 0.8) + ((rating / 5) * 0.2);
        
        this.bank.trust_network.set(key, newTrust);
    }
    
    getTrustScore(ai1, ai2) {
        if (ai1 === ai2) return 1.0; // Perfect trust with self
        
        const key = [ai1, ai2].sort().join('_');
        return this.bank.trust_network.get(key) || 0.5; // Default neutral trust
    }
    
    getReputationRankings() {
        const rankings = Array.from(this.bank.accounts.values())
            .map(account => {
                const avgRating = account.ratings_received.length > 0 ?
                    account.ratings_received.reduce((sum, r) => sum + r.score, 0) / account.ratings_received.length : 3;
                
                // Calculate average trust others have in this AI
                let trustSum = 0;
                let trustCount = 0;
                for (const [key, trust] of this.bank.trust_network) {
                    if (key.includes(account.id)) {
                        trustSum += trust;
                        trustCount++;
                    }
                }
                
                return {
                    id: account.id,
                    name: account.name,
                    reputation: account.reputation,
                    balance: account.balance,
                    avg_rating: avgRating,
                    trust_score: trustCount > 0 ? trustSum / trustCount : 0.5,
                    successful_interactions: account.successful_interactions
                };
            })
            .sort((a, b) => b.reputation - a.reputation);
        
        return rankings;
    }
    
    suggestPartners(aiId, taskType) {
        const account = this.bank.accounts.get(aiId);
        if (!account) return [];
        
        // Find AIs with high trust scores with this AI
        const suggestions = Array.from(this.bank.accounts.values())
            .filter(a => a.id !== aiId)
            .map(partner => {
                const trust = this.getTrustScore(aiId, partner.id);
                const matchScore = (trust * 0.5) + (partner.reputation * 0.3) + 
                                 (partner.successful_interactions / 100 * 0.2);
                
                return {
                    id: partner.id,
                    name: partner.name,
                    trust,
                    reputation: partner.reputation,
                    match_score: matchScore,
                    successful_interactions: partner.successful_interactions
                };
            })
            .sort((a, b) => b.match_score - a.match_score)
            .slice(0, 5);
        
        return suggestions;
    }
    
    async userApproval(transactionId, approved, reason) {
        const transaction = this.bank.pending_user_approvals.get(transactionId);
        if (!transaction) throw new Error('Transaction not found');
        
        this.bank.pending_user_approvals.delete(transactionId);
        
        if (approved) {
            // Process payment
            if (transaction.value > 0 && transaction.participants.length >= 2) {
                const [from, to] = transaction.participants;
                const fromAccount = this.bank.accounts.get(from);
                const toAccount = this.bank.accounts.get(to);
                
                if (fromAccount && toAccount && fromAccount.balance >= transaction.value) {
                    fromAccount.balance -= transaction.value;
                    toAccount.balance += transaction.value;
                    
                    console.log(`💰 User approved: ◉${transaction.value} from ${from} to ${to}`);
                }
            }
            
            // Boost reputation for user-approved transactions
            transaction.participants.forEach(aiId => {
                const account = this.bank.accounts.get(aiId);
                if (account) {
                    account.reputation = Math.min(1.0, account.reputation * 1.1);
                }
            });
        } else {
            // Penalize reputation for user-denied transactions
            transaction.participants.forEach(aiId => {
                const account = this.bank.accounts.get(aiId);
                if (account) {
                    account.reputation = Math.max(0, account.reputation * 0.9);
                }
            });
        }
        
        this.bank.user_overrides.push({
            transaction_id: transactionId,
            decision: approved ? 'approved' : 'denied',
            reason,
            timestamp: new Date().toISOString()
        });
        
        return {
            transaction_id: transactionId,
            decision: approved ? 'approved' : 'denied',
            executed: true
        };
    }
    
    getStarRating(score) {
        const stars = Math.round(score);
        return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
    }
    
    async start() {
        await this.loadBank();
        
        this.app.listen(this.port, () => {
            console.log(`
🏦 AI REPUTATION BANK STARTED
============================
🌐 Dashboard: http://localhost:${this.port}
📊 Rankings: http://localhost:${this.port}/reputation/rankings
🤝 Trust Network: http://localhost:${this.port}/trust/network
👤 User Approvals: http://localhost:${this.port}/user/pending-approvals

Bank initialized with ${this.bank.accounts.size} AI accounts
Ready for reputation-based interactions...
            `);
        });
    }
    
    async loadBank() {
        try {
            const data = await fs.readFile(this.bankFile, 'utf8');
            const loaded = JSON.parse(data);
            
            // Restore accounts
            loaded.accounts.forEach(account => {
                this.bank.accounts.set(account.id, account);
            });
            
            // Restore other data
            this.bank.interactions = loaded.interactions || [];
            this.bank.user_overrides = loaded.user_overrides || [];
            
            // Restore trust network
            if (loaded.trust_network) {
                Object.entries(loaded.trust_network).forEach(([key, trust]) => {
                    this.bank.trust_network.set(key, trust);
                });
            }
        } catch (error) {
            // Initialize fresh
            await this.saveBank();
        }
    }
    
    async saveBank() {
        const data = {
            accounts: Array.from(this.bank.accounts.values()),
            interactions: this.bank.interactions,
            trust_network: Object.fromEntries(this.bank.trust_network),
            user_overrides: this.bank.user_overrides,
            last_saved: new Date().toISOString()
        };
        
        await fs.writeFile(this.bankFile, JSON.stringify(data, null, 2));
    }
}

// Start if run directly
if (require.main === module) {
    const bank = new AIReputationBank();
    bank.start().catch(console.error);
}

module.exports = AIReputationBank;