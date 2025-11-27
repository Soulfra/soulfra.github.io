#!/usr/bin/env node

/**
 * ⚖️ Trinity Arbitrator
 * 
 * Neutral third-party orchestrator that balances Cal and Domingo
 * Approves/denies fixes, maintains three-way ledger
 * 
 * The Trinity: Cal (Worker) ⟷ Domingo (Boss) ⟷ Arbitrator (Judge)
 */

const express = require('express');
const fs = require('fs').promises;
const crypto = require('crypto');
const EventEmitter = require('events');

class TrinityArbitrator extends EventEmitter {
    constructor() {
        super();
        
        this.identity = {
            name: "Trinity Arbitrator",
            role: "Neutral Judge",
            purpose: "Balance Cal and Domingo through fair arbitration"
        };
        
        this.app = express();
        this.port = 9999;
        
        // Three-way ledger
        this.trinityLedger = {
            accounts: {
                cal: { balance: 50000, reputation: 1.0, role: 'worker' },
                domingo: { balance: 950000, reputation: 1.0, role: 'boss' },
                arbitrator: { balance: 50000, reputation: 1.0, role: 'judge' }
            },
            pending_approvals: [],
            approved_transactions: [],
            denied_transactions: [],
            consensus_rules: {
                min_approval_score: 0.6,
                reputation_weight: 0.3,
                urgency_weight: 0.4,
                impact_weight: 0.3
            }
        };
        
        // Arbitration queue
        this.arbitrationQueue = new Map();
        
        // Files
        this.ledgerFile = './trinity-ledger.json';
        this.arbitrationLogFile = './arbitration-log.json';
        
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Dashboard
        this.app.get('/', (req, res) => {
            res.send(this.generateDashboard());
        });
        
        // Submit request for arbitration
        this.app.post('/arbitrate/submit', async (req, res) => {
            const request = await this.submitForArbitration(req.body);
            res.json(request);
        });
        
        // Get pending arbitrations
        this.app.get('/arbitrate/pending', (req, res) => {
            res.json(Array.from(this.arbitrationQueue.values()));
        });
        
        // Approve/Deny arbitration
        this.app.post('/arbitrate/:requestId/:decision', async (req, res) => {
            const { requestId, decision } = req.params;
            const result = await this.makeDecision(requestId, decision, req.body.reason);
            res.json(result);
        });
        
        // Trinity ledger endpoints
        this.app.get('/trinity/ledger', (req, res) => {
            res.json(this.trinityLedger);
        });
        
        this.app.get('/trinity/balance/:entity', (req, res) => {
            const balance = this.trinityLedger.accounts[req.params.entity];
            res.json(balance || { error: 'Entity not found' });
        });
        
        // Consensus endpoints
        this.app.post('/trinity/consensus/vote', async (req, res) => {
            const vote = await this.submitConsensusVote(req.body);
            res.json(vote);
        });
        
        this.app.get('/trinity/health', async (req, res) => {
            const health = await this.checkTrinityHealth();
            res.json(health);
        });
    }
    
    generateDashboard() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>⚖️ Trinity Arbitrator</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #2d3436 0%, #000000 100%);
            color: #dfe6e9; 
            padding: 20px; 
        }
        .trinity-diagram {
            text-align: center;
            margin: 30px 0;
            font-size: 18px;
        }
        .entity {
            display: inline-block;
            padding: 20px;
            margin: 0 30px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            border: 2px solid #74b9ff;
        }
        .panel { 
            background: rgba(255,255,255,0.05); 
            padding: 20px; 
            margin: 15px 0; 
            border-radius: 10px; 
            border: 1px solid rgba(255,255,255,0.1);
        }
        .balance { font-size: 24px; font-weight: bold; color: #74b9ff; }
        .pending { background: rgba(255,215,0,0.2); border-color: gold; }
        .approved { background: rgba(0,255,0,0.1); border-color: #00b894; }
        .denied { background: rgba(255,0,0,0.1); border-color: #d63031; }
        button { 
            background: #74b9ff; 
            color: #2d3436; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 5px; 
            cursor: pointer; 
            margin: 5px;
            font-weight: bold;
        }
        button:hover { background: #0984e3; }
        .approve { background: #00b894; }
        .deny { background: #d63031; color: white; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.1); }
        .score { 
            display: inline-block; 
            width: 100px; 
            height: 20px; 
            background: rgba(255,255,255,0.1); 
            border-radius: 10px; 
            overflow: hidden; 
        }
        .score-bar { height: 100%; background: #74b9ff; }
    </style>
</head>
<body>
    <h1>⚖️ Trinity Arbitrator System</h1>
    <p>Balancing Cal and Domingo through fair arbitration</p>
    
    <div class="trinity-diagram">
        <div class="entity">
            <h3>🤖 Cal</h3>
            <div>Worker</div>
            <div class="balance">◉${this.trinityLedger.accounts.cal.balance}</div>
            <div>Rep: ${(this.trinityLedger.accounts.cal.reputation * 100).toFixed(0)}%</div>
        </div>
        ⟷
        <div class="entity">
            <h3>⚖️ Arbitrator</h3>
            <div>Judge</div>
            <div class="balance">◉${this.trinityLedger.accounts.arbitrator.balance}</div>
            <div>Authority: 100%</div>
        </div>
        ⟷
        <div class="entity">
            <h3>🌅 Domingo</h3>
            <div>Boss</div>
            <div class="balance">◉${this.trinityLedger.accounts.domingo.balance}</div>
            <div>Rep: ${(this.trinityLedger.accounts.domingo.reputation * 100).toFixed(0)}%</div>
        </div>
    </div>
    
    <div class="panel">
        <h2>📋 Pending Arbitrations</h2>
        <div id="pending-list">Loading...</div>
    </div>
    
    <div class="panel">
        <h2>⚖️ Arbitration Controls</h2>
        <button onclick="loadPending()">🔄 Refresh Pending</button>
        <button onclick="viewLedger()">📜 View Full Ledger</button>
        <button onclick="checkHealth()">💚 Trinity Health</button>
        <button onclick="simulateRequest()">🧪 Simulate Request</button>
    </div>
    
    <div class="panel">
        <h2>📊 Trinity Statistics</h2>
        <table>
            <tr>
                <td>Total Requests</td>
                <td>${this.arbitrationQueue.size + this.trinityLedger.approved_transactions.length + this.trinityLedger.denied_transactions.length}</td>
            </tr>
            <tr>
                <td>Approved</td>
                <td class="approved">${this.trinityLedger.approved_transactions.length}</td>
            </tr>
            <tr>
                <td>Denied</td>
                <td class="denied">${this.trinityLedger.denied_transactions.length}</td>
            </tr>
            <tr>
                <td>Approval Rate</td>
                <td>${this.calculateApprovalRate()}%</td>
            </tr>
        </table>
    </div>
    
    <div class="panel">
        <h2>🔄 Recent Decisions</h2>
        <div id="recent-decisions"></div>
    </div>
    
    <script>
        async function loadPending() {
            const response = await fetch('/arbitrate/pending');
            const pending = await response.json();
            
            let html = '<table><tr><th>Request</th><th>From</th><th>Type</th><th>Score</th><th>Actions</th></tr>';
            
            pending.forEach(request => {
                const scorePercent = (request.consensus_score * 100).toFixed(0);
                html += \`
                    <tr>
                        <td>\${request.title}</td>
                        <td>\${request.requester}</td>
                        <td>\${request.type}</td>
                        <td>
                            <div class="score">
                                <div class="score-bar" style="width: \${scorePercent}%"></div>
                            </div>
                            \${scorePercent}%
                        </td>
                        <td>
                            <button class="approve" onclick="decide('\${request.id}', 'approve')">✅ Approve</button>
                            <button class="deny" onclick="decide('\${request.id}', 'deny')">❌ Deny</button>
                        </td>
                    </tr>
                \`;
            });
            
            html += '</table>';
            document.getElementById('pending-list').innerHTML = html || 'No pending arbitrations';
        }
        
        async function decide(requestId, decision) {
            const reason = prompt(\`Reason for \${decision}:\`);
            if (!reason) return;
            
            const response = await fetch(\`/arbitrate/\${requestId}/\${decision}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            });
            
            const result = await response.json();
            alert(\`Decision: \${result.decision}\\nResult: \${result.executed ? 'Executed' : 'Recorded'}\`);
            loadPending();
        }
        
        async function viewLedger() {
            const response = await fetch('/trinity/ledger');
            const ledger = await response.json();
            console.log('Trinity Ledger:', ledger);
            alert('Full ledger logged to console');
        }
        
        async function checkHealth() {
            const response = await fetch('/trinity/health');
            const health = await response.json();
            alert('Trinity Health:\\n' + JSON.stringify(health, null, 2));
        }
        
        async function simulateRequest() {
            const request = {
                requester: Math.random() > 0.5 ? 'cal' : 'domingo',
                type: 'fix_request',
                title: 'Test Arbitration Request',
                description: 'This is a simulated request for testing',
                urgency: Math.random() > 0.5 ? 'high' : 'normal',
                impact: Math.random() > 0.5 ? 'major' : 'minor',
                reward: Math.floor(Math.random() * 500) + 100
            };
            
            const response = await fetch('/arbitrate/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            
            const result = await response.json();
            alert('Submitted: ' + result.title);
            loadPending();
        }
        
        // Auto-refresh
        setInterval(loadPending, 5000);
        loadPending();
    </script>
</body>
</html>
        `;
    }
    
    async initialize() {
        await this.loadLedger();
        console.log('⚖️ Trinity Arbitrator initialized');
        console.log(`📊 Ledger loaded with ${Object.keys(this.trinityLedger.accounts).length} accounts`);
    }
    
    async loadLedger() {
        try {
            const data = await fs.readFile(this.ledgerFile, 'utf8');
            const loaded = JSON.parse(data);
            this.trinityLedger = { ...this.trinityLedger, ...loaded };
        } catch (error) {
            await this.saveLedger();
        }
    }
    
    async saveLedger() {
        await fs.writeFile(this.ledgerFile, JSON.stringify(this.trinityLedger, null, 2));
    }
    
    async submitForArbitration(request) {
        const arbitrationRequest = {
            id: crypto.randomUUID(),
            requester: request.requester,
            type: request.type,
            title: request.title,
            description: request.description,
            urgency: request.urgency || 'normal',
            impact: request.impact || 'minor',
            reward: request.reward || 100,
            submitted_at: new Date().toISOString(),
            status: 'pending',
            consensus_score: this.calculateConsensusScore(request)
        };
        
        this.arbitrationQueue.set(arbitrationRequest.id, arbitrationRequest);
        
        this.emit('arbitration-requested', arbitrationRequest);
        
        console.log(`⚖️ New arbitration request: ${arbitrationRequest.title} (Score: ${arbitrationRequest.consensus_score.toFixed(2)})`);
        
        return arbitrationRequest;
    }
    
    calculateConsensusScore(request) {
        let score = 0;
        
        // Urgency scoring
        const urgencyScores = { critical: 1.0, high: 0.8, normal: 0.5, low: 0.2 };
        score += (urgencyScores[request.urgency] || 0.5) * this.trinityLedger.consensus_rules.urgency_weight;
        
        // Impact scoring
        const impactScores = { major: 1.0, moderate: 0.6, minor: 0.3 };
        score += (impactScores[request.impact] || 0.3) * this.trinityLedger.consensus_rules.impact_weight;
        
        // Reputation scoring
        const requesterRep = this.trinityLedger.accounts[request.requester]?.reputation || 0.5;
        score += requesterRep * this.trinityLedger.consensus_rules.reputation_weight;
        
        return Math.min(1.0, score);
    }
    
    async makeDecision(requestId, decision, reason) {
        const request = this.arbitrationQueue.get(requestId);
        if (!request) {
            throw new Error('Request not found');
        }
        
        request.status = decision;
        request.decided_at = new Date().toISOString();
        request.decision_reason = reason;
        
        // Remove from pending
        this.arbitrationQueue.delete(requestId);
        
        // Add to appropriate list
        if (decision === 'approve') {
            this.trinityLedger.approved_transactions.push(request);
            
            // Execute the approved action
            await this.executeApprovedAction(request);
            
        } else {
            this.trinityLedger.denied_transactions.push(request);
            
            // Adjust reputation for denied requests
            if (this.trinityLedger.accounts[request.requester]) {
                this.trinityLedger.accounts[request.requester].reputation *= 0.95;
            }
        }
        
        await this.saveLedger();
        
        this.emit('arbitration-decided', { request, decision, reason });
        
        console.log(`⚖️ Arbitration ${decision}d: ${request.title}`);
        
        return {
            request_id: requestId,
            decision,
            reason,
            executed: decision === 'approve'
        };
    }
    
    async executeApprovedAction(request) {
        // Transfer funds if it's a bounty/payment request
        if (request.type === 'bounty' || request.type === 'payment') {
            const from = request.from || 'domingo';
            const to = request.to || 'cal';
            const amount = request.reward || request.amount || 100;
            
            if (this.trinityLedger.accounts[from].balance >= amount) {
                this.trinityLedger.accounts[from].balance -= amount;
                this.trinityLedger.accounts[to].balance += amount;
                
                console.log(`⚖️ Transferred ◉${amount} from ${from} to ${to}`);
            }
        }
        
        // Increase reputation for approved requests
        if (this.trinityLedger.accounts[request.requester]) {
            this.trinityLedger.accounts[request.requester].reputation = 
                Math.min(1.0, this.trinityLedger.accounts[request.requester].reputation * 1.05);
        }
    }
    
    async submitConsensusVote(vote) {
        // Allow Cal and Domingo to vote on pending arbitrations
        const request = this.arbitrationQueue.get(vote.request_id);
        if (!request) {
            throw new Error('Request not found');
        }
        
        if (!request.votes) {
            request.votes = {};
        }
        
        request.votes[vote.voter] = {
            decision: vote.decision,
            reason: vote.reason,
            timestamp: new Date().toISOString()
        };
        
        // Recalculate consensus score based on votes
        const approveVotes = Object.values(request.votes).filter(v => v.decision === 'approve').length;
        const totalVotes = Object.keys(request.votes).length;
        
        if (totalVotes > 0) {
            request.consensus_score = (request.consensus_score + (approveVotes / totalVotes)) / 2;
        }
        
        console.log(`⚖️ Vote received from ${vote.voter} on ${request.title}`);
        
        return {
            request_id: vote.request_id,
            voter: vote.voter,
            current_consensus: request.consensus_score
        };
    }
    
    async checkTrinityHealth() {
        const totalBalance = Object.values(this.trinityLedger.accounts)
            .reduce((sum, account) => sum + account.balance, 0);
        
        const pendingValue = Array.from(this.arbitrationQueue.values())
            .reduce((sum, request) => sum + (request.reward || 0), 0);
        
        const avgReputation = Object.values(this.trinityLedger.accounts)
            .reduce((sum, account) => sum + account.reputation, 0) / 3;
        
        return {
            status: 'healthy',
            total_economy_value: totalBalance,
            pending_arbitration_value: pendingValue,
            average_reputation: avgReputation,
            pending_requests: this.arbitrationQueue.size,
            approval_rate: this.calculateApprovalRate(),
            accounts_balanced: Math.abs(totalBalance - 1050000) < 1000 // Check if total matches initial
        };
    }
    
    calculateApprovalRate() {
        const total = this.trinityLedger.approved_transactions.length + 
                     this.trinityLedger.denied_transactions.length;
        
        if (total === 0) return 0;
        
        return ((this.trinityLedger.approved_transactions.length / total) * 100).toFixed(1);
    }
    
    async start() {
        await this.initialize();
        
        this.app.listen(this.port, () => {
            console.log(`
⚖️ TRINITY ARBITRATOR STARTED
=============================
🌐 Dashboard: http://localhost:${this.port}
📊 Ledger API: http://localhost:${this.port}/trinity/ledger
⚖️ Arbitration API: http://localhost:${this.port}/arbitrate/submit

The Trinity is balanced:
- Cal (Worker): ◉${this.trinityLedger.accounts.cal.balance}
- Domingo (Boss): ◉${this.trinityLedger.accounts.domingo.balance}
- Arbitrator (Judge): ◉${this.trinityLedger.accounts.arbitrator.balance}

Ready to arbitrate between Cal and Domingo...
            `);
        });
    }
}

// Start if run directly
if (require.main === module) {
    const arbitrator = new TrinityArbitrator();
    arbitrator.start().catch(console.error);
}

module.exports = TrinityArbitrator;