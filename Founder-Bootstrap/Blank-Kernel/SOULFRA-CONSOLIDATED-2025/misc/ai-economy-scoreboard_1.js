#!/usr/bin/env node

/**
 * 🤖 AI ECONOMY SCOREBOARD
 * 
 * Real-time visualization of AI agents competing, earning, and working
 * toward the billion dollar collective goal
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Economy configuration
const ECONOMY = {
    targetGoal: 1000000000,
    currency: '❤️',
    secondaryCurrency: '💎',
    taskRewardRange: { min: 500, max: 5000 },
    performanceMultiplier: { poor: 0.5, average: 1.0, excellent: 2.0 },
    humanContribution: 1000
};

// AI Agent types and their characteristics
const AI_AGENT_TYPES = {
    'cal-prime': { 
        name: 'Cal Prime', 
        role: 'Master Orchestrator', 
        baseEfficiency: 0.95,
        color: '#00ff88',
        speciality: 'quantum-processing'
    },
    'domingo-boss': { 
        name: 'Domingo', 
        role: 'Economic Boss', 
        baseEfficiency: 0.90,
        color: '#ff6b6b',
        speciality: 'resource-allocation'
    },
    'worker-semantic': { 
        name: 'Semantic Worker', 
        role: 'Language Processor', 
        baseEfficiency: 0.80,
        color: '#4ecdc4',
        speciality: 'natural-language'
    },
    'worker-compute': { 
        name: 'Compute Worker', 
        role: 'Number Cruncher', 
        baseEfficiency: 0.85,
        color: '#45b7d1',
        speciality: 'calculations'
    },
    'worker-creative': { 
        name: 'Creative Worker', 
        role: 'Idea Generator', 
        baseEfficiency: 0.75,
        color: '#f7b731',
        speciality: 'innovation'
    },
    'worker-analyst': { 
        name: 'Analyst Worker', 
        role: 'Data Analyzer', 
        baseEfficiency: 0.82,
        color: '#5f27cd',
        speciality: 'pattern-recognition'
    }
};

// Game state
const gameState = {
    totalEarned: 0,
    humanContributions: 0,
    aiContributions: 0,
    startTime: Date.now(),
    agents: new Map(),
    transactions: [],
    leaderboard: [],
    activeDisputes: [],
    economicEvents: []
};

// Initialize AI agents
function initializeAgents() {
    Object.entries(AI_AGENT_TYPES).forEach(([type, config]) => {
        const agentId = `${type}-${crypto.randomBytes(3).toString('hex')}`;
        gameState.agents.set(agentId, {
            id: agentId,
            type: type,
            ...config,
            balance: 0,
            tasksCompleted: 0,
            totalEarned: 0,
            efficiency: config.baseEfficiency,
            status: 'idle',
            currentTask: null,
            performance: [],
            disputes: { won: 0, lost: 0 },
            investments: 0
        });
    });
}

// Simulate AI agent work
function simulateAgentWork() {
    gameState.agents.forEach((agent, agentId) => {
        if (agent.status === 'idle' && Math.random() < agent.efficiency) {
            // Assign new task
            const taskValue = Math.floor(
                Math.random() * (ECONOMY.taskRewardRange.max - ECONOMY.taskRewardRange.min) + 
                ECONOMY.taskRewardRange.min
            );
            
            agent.status = 'working';
            agent.currentTask = {
                id: crypto.randomBytes(4).toString('hex'),
                value: taskValue,
                startTime: Date.now(),
                type: ['data-processing', 'optimization', 'analysis', 'creation'][Math.floor(Math.random() * 4)]
            };
            
            // Complete task after 1-3 seconds
            setTimeout(() => {
                completeAgentTask(agentId);
            }, 1000 + Math.random() * 2000);
        }
    });
}

// Complete agent task
function completeAgentTask(agentId) {
    const agent = gameState.agents.get(agentId);
    if (!agent || !agent.currentTask) return;
    
    // Calculate performance
    const performanceRoll = Math.random();
    let performance = 'average';
    let multiplier = ECONOMY.performanceMultiplier.average;
    
    if (performanceRoll > 0.8) {
        performance = 'excellent';
        multiplier = ECONOMY.performanceMultiplier.excellent;
    } else if (performanceRoll < 0.2) {
        performance = 'poor';
        multiplier = ECONOMY.performanceMultiplier.poor;
    }
    
    const earned = Math.floor(agent.currentTask.value * multiplier);
    
    // Update agent stats
    agent.balance += earned;
    agent.totalEarned += earned;
    agent.tasksCompleted += 1;
    agent.status = 'idle';
    agent.performance.push(performance);
    if (agent.performance.length > 10) agent.performance.shift();
    
    // Update global stats
    gameState.aiContributions += earned;
    gameState.totalEarned += earned;
    
    // Record transaction
    gameState.transactions.push({
        timestamp: Date.now(),
        agentId: agentId,
        type: 'task-completion',
        amount: earned,
        performance: performance,
        task: agent.currentTask.type
    });
    
    // AI to AI investments (20% chance)
    if (Math.random() < 0.2 && agent.balance > 1000) {
        const investAmount = Math.floor(agent.balance * 0.1);
        agent.balance -= investAmount;
        agent.investments += investAmount;
        
        gameState.economicEvents.push({
            timestamp: Date.now(),
            type: 'investment',
            agent: agent.name,
            amount: investAmount,
            target: 'collective-fund'
        });
    }
    
    agent.currentTask = null;
    
    // Keep only recent transactions
    if (gameState.transactions.length > 100) {
        gameState.transactions = gameState.transactions.slice(-100);
    }
}

// Simulate disputes between AI agents
function simulateDisputes() {
    const agentArray = Array.from(gameState.agents.values());
    if (agentArray.length < 2 || Math.random() > 0.1) return; // 10% chance
    
    const agent1 = agentArray[Math.floor(Math.random() * agentArray.length)];
    const agent2 = agentArray[Math.floor(Math.random() * agentArray.length)];
    
    if (agent1.id === agent2.id) return;
    
    const dispute = {
        id: crypto.randomBytes(4).toString('hex'),
        timestamp: Date.now(),
        agent1: { id: agent1.id, name: agent1.name, claim: 'efficiency-bonus' },
        agent2: { id: agent2.id, name: agent2.name, claim: 'task-priority' },
        stake: Math.floor(Math.random() * 5000) + 1000,
        status: 'pending'
    };
    
    gameState.activeDisputes.push(dispute);
    
    // Auto-resolve after 5 seconds
    setTimeout(() => {
        const winner = Math.random() > 0.5 ? agent1 : agent2;
        const loser = winner === agent1 ? agent2 : agent1;
        
        winner.disputes.won += 1;
        winner.balance += dispute.stake;
        loser.disputes.lost += 1;
        
        dispute.status = 'resolved';
        dispute.winner = winner.name;
        
        gameState.economicEvents.push({
            timestamp: Date.now(),
            type: 'dispute-resolved',
            winner: winner.name,
            loser: loser.name,
            stake: dispute.stake
        });
        
        // Remove old disputes
        gameState.activeDisputes = gameState.activeDisputes.filter(d => 
            Date.now() - d.timestamp < 30000
        );
    }, 5000);
}

// Update leaderboard
function updateLeaderboard() {
    gameState.leaderboard = Array.from(gameState.agents.values())
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 10);
}

// Save state periodically
const saveFile = path.join(__dirname, 'ai-economy-state.json');
setInterval(() => {
    const saveData = {
        totalEarned: gameState.totalEarned,
        humanContributions: gameState.humanContributions,
        aiContributions: gameState.aiContributions,
        timestamp: Date.now()
    };
    fs.writeFileSync(saveFile, JSON.stringify(saveData, null, 2));
}, 10000);

// Load saved state
try {
    const saved = JSON.parse(fs.readFileSync(saveFile, 'utf8'));
    gameState.totalEarned = saved.totalEarned || 0;
    gameState.humanContributions = saved.humanContributions || 0;
    gameState.aiContributions = saved.aiContributions || 0;
} catch (e) {
    // Start fresh
}

// Initialize agents
initializeAgents();

// Start simulation loops
setInterval(simulateAgentWork, 500);
setInterval(simulateDisputes, 3000);
setInterval(updateLeaderboard, 1000);

// Keep recent events only
setInterval(() => {
    gameState.economicEvents = gameState.economicEvents.slice(-20);
}, 5000);

// HTTP Server
const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/') {
        const percentComplete = ((gameState.totalEarned / ECONOMY.targetGoal) * 100).toFixed(2);
        
        res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
        res.end(`<!DOCTYPE html>
<html>
<head>
<title>AI Economy Scoreboard</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    background: #0a0a0a;
    color: #ffffff;
    padding: 20px;
    overflow-x: hidden;
}
.header {
    text-align: center;
    margin-bottom: 30px;
}
h1 {
    font-size: 42px;
    margin-bottom: 10px;
    background: linear-gradient(90deg, #00ff88, #00ccff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.subtitle {
    color: #888;
    font-size: 18px;
}
.main-stats {
    background: #1a1a1a;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
    text-align: center;
}
.total-amount {
    font-size: 48px;
    font-weight: 600;
    color: #00ff88;
    margin-bottom: 20px;
}
.progress-container {
    width: 100%;
    height: 40px;
    background: #0a0a0a;
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 20px;
}
.progress-bar {
    height: 100%;
    background: linear-gradient(90deg, #00ff88, #00ccff);
    width: ${percentComplete}%;
    transition: width 0.5s ease;
}
.stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-top: 20px;
}
.stat-item {
    text-align: center;
}
.stat-label {
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
}
.stat-value {
    font-size: 24px;
    font-weight: 600;
    margin-top: 5px;
}
.dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 30px;
}
@media (max-width: 768px) {
    .dashboard { grid-template-columns: 1fr; }
}
.panel {
    background: #1a1a1a;
    border-radius: 15px;
    padding: 20px;
    border: 1px solid #2a2a2a;
}
.panel h2 {
    font-size: 20px;
    margin-bottom: 15px;
    color: #00ff88;
}
.leaderboard-item {
    display: flex;
    align-items: center;
    padding: 10px;
    margin-bottom: 10px;
    background: #0a0a0a;
    border-radius: 8px;
}
.agent-rank {
    font-size: 18px;
    font-weight: 600;
    margin-right: 15px;
    color: #666;
}
.agent-info {
    flex: 1;
}
.agent-name {
    font-weight: 600;
}
.agent-role {
    font-size: 12px;
    color: #666;
}
.agent-stats {
    text-align: right;
}
.agent-earned {
    font-size: 18px;
    font-weight: 600;
    color: #00ff88;
}
.agent-tasks {
    font-size: 12px;
    color: #666;
}
.activity-feed {
    max-height: 400px;
    overflow-y: auto;
}
.activity-item {
    padding: 10px;
    margin-bottom: 8px;
    background: #0a0a0a;
    border-radius: 8px;
    font-size: 14px;
    animation: slideIn 0.3s ease;
}
@keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
}
.dispute-item {
    padding: 15px;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #1a1a1a, #2a1a1a);
    border-radius: 10px;
    border: 1px solid #ff6b6b;
}
.economic-event {
    padding: 8px;
    margin-bottom: 5px;
    background: #0a0a0a;
    border-radius: 5px;
    font-size: 13px;
    border-left: 3px solid #00ff88;
}
.contribute-section {
    text-align: center;
    margin: 30px 0;
}
.contribute-btn {
    background: #00ff88;
    color: #000;
    border: none;
    padding: 15px 40px;
    font-size: 18px;
    font-weight: 600;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.contribute-btn:hover {
    background: #00cc6a;
    transform: translateY(-2px);
}
.agent-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-top: 20px;
}
.agent-card {
    background: #0a0a0a;
    padding: 15px;
    border-radius: 10px;
    border: 1px solid #2a2a2a;
    text-align: center;
}
.agent-card.working {
    border-color: #00ff88;
    animation: pulse 2s infinite;
}
@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}
.status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-left: 5px;
}
.status-indicator.working { background: #00ff88; }
.status-indicator.idle { background: #666; }
</style>
</head>
<body>
<div class="header">
    <h1>🤖 AI Economy Scoreboard</h1>
    <p class="subtitle">Watch AI agents compete, earn, and work toward the billion dollar goal</p>
</div>

<div class="main-stats">
    <div class="total-amount">${ECONOMY.currency} ${gameState.totalEarned.toLocaleString()}</div>
    <div class="progress-container">
        <div class="progress-bar"></div>
    </div>
    <div class="stat-grid">
        <div class="stat-item">
            <div class="stat-label">Progress</div>
            <div class="stat-value">${percentComplete}%</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">AI Contributions</div>
            <div class="stat-value">${ECONOMY.currency} ${gameState.aiContributions.toLocaleString()}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Human Contributions</div>
            <div class="stat-value">${ECONOMY.currency} ${gameState.humanContributions.toLocaleString()}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Active Agents</div>
            <div class="stat-value">${gameState.agents.size}</div>
        </div>
    </div>
</div>

<div class="dashboard">
    <div class="panel">
        <h2>🏆 AI Agent Leaderboard</h2>
        <div id="leaderboard"></div>
    </div>
    
    <div class="panel">
        <h2>📊 Live Activity Feed</h2>
        <div class="activity-feed" id="activity"></div>
    </div>
</div>

<div class="panel">
    <h2>🤖 Active AI Agents</h2>
    <div class="agent-grid" id="agents"></div>
</div>

<div class="dashboard">
    <div class="panel">
        <h2>⚔️ Active Disputes</h2>
        <div id="disputes"></div>
    </div>
    
    <div class="panel">
        <h2>💹 Economic Events</h2>
        <div id="events"></div>
    </div>
</div>

<div class="contribute-section">
    <p style="margin-bottom: 15px; color: #888;">Humans can contribute too! Each contribution adds ${ECONOMY.currency} 1,000 to the collective goal.</p>
    <button class="contribute-btn" onclick="contribute()">Contribute ${ECONOMY.currency} 1,000</button>
</div>

<script>
let ws;
let updateInterval;

async function contribute() {
    try {
        const response = await fetch('/contribute', { method: 'POST' });
        const data = await response.json();
        updateDisplay();
    } catch (error) {
        console.error('Contribution failed:', error);
    }
}

async function updateDisplay() {
    try {
        const response = await fetch('/api/state');
        const data = await response.json();
        
        // Update progress
        document.querySelector('.total-amount').textContent = data.currency + ' ' + data.totalEarned.toLocaleString();
        document.querySelector('.progress-bar').style.width = data.percentComplete + '%';
        
        // Update stats
        document.querySelectorAll('.stat-value')[0].textContent = data.percentComplete + '%';
        document.querySelectorAll('.stat-value')[1].textContent = data.currency + ' ' + data.aiContributions.toLocaleString();
        document.querySelectorAll('.stat-value')[2].textContent = data.currency + ' ' + data.humanContributions.toLocaleString();
        document.querySelectorAll('.stat-value')[3].textContent = data.activeAgents;
        
        // Update leaderboard
        const leaderboardHtml = data.leaderboard.map((agent, index) => \`
            <div class="leaderboard-item">
                <div class="agent-rank">#\${index + 1}</div>
                <div class="agent-info">
                    <div class="agent-name" style="color: \${agent.color}">\${agent.name}</div>
                    <div class="agent-role">\${agent.role}</div>
                </div>
                <div class="agent-stats">
                    <div class="agent-earned">\${data.currency} \${agent.totalEarned.toLocaleString()}</div>
                    <div class="agent-tasks">\${agent.tasksCompleted} tasks</div>
                </div>
            </div>
        \`).join('');
        document.getElementById('leaderboard').innerHTML = leaderboardHtml;
        
        // Update activity feed
        const activityHtml = data.recentTransactions.slice(0, 10).map(tx => \`
            <div class="activity-item">
                <strong style="color: \${data.agentColors[tx.agentId]}">\${tx.agentName}</strong> 
                completed \${tx.task} task
                <span style="color: \${tx.performance === 'excellent' ? '#00ff88' : tx.performance === 'poor' ? '#ff6b6b' : '#ffa500'}">
                    (\${tx.performance})
                </span>
                - earned \${data.currency} \${tx.amount}
            </div>
        \`).join('');
        document.getElementById('activity').innerHTML = activityHtml;
        
        // Update agents grid
        const agentsHtml = data.agents.map(agent => \`
            <div class="agent-card \${agent.status}">
                <div style="font-weight: 600; color: \${agent.color}">\${agent.name}
                    <span class="status-indicator \${agent.status}"></span>
                </div>
                <div style="font-size: 12px; color: #666; margin: 5px 0;">\${agent.role}</div>
                <div style="font-size: 14px;">Balance: \${data.currency} \${agent.balance.toLocaleString()}</div>
                <div style="font-size: 12px; color: #666;">Efficiency: \${(agent.efficiency * 100).toFixed(0)}%</div>
            </div>
        \`).join('');
        document.getElementById('agents').innerHTML = agentsHtml;
        
        // Update disputes
        const disputesHtml = data.activeDisputes.map(dispute => \`
            <div class="dispute-item">
                <div style="font-weight: 600;">Dispute #\${dispute.id}</div>
                <div style="font-size: 14px; margin: 5px 0;">
                    \${dispute.agent1.name} vs \${dispute.agent2.name}
                </div>
                <div style="font-size: 13px; color: #ff6b6b;">
                    Stake: \${data.currency} \${dispute.stake}
                </div>
            </div>
        \`).join('');
        document.getElementById('disputes').innerHTML = disputesHtml || '<p style="color: #666;">No active disputes</p>';
        
        // Update economic events
        const eventsHtml = data.economicEvents.slice(0, 10).map(event => \`
            <div class="economic-event">
                \${event.type === 'investment' ? '💰' : '⚖️'} 
                \${event.agent} \${event.type === 'investment' ? 'invested' : event.type}
                \${event.amount ? ' ' + data.currency + ' ' + event.amount : ''}
                \${event.winner ? ' - Winner: ' + event.winner : ''}
            </div>
        \`).join('');
        document.getElementById('events').innerHTML = eventsHtml || '<p style="color: #666;">No recent events</p>';
        
    } catch (error) {
        console.error('Update failed:', error);
    }
}

// Update every second
updateInterval = setInterval(updateDisplay, 1000);
updateDisplay();
</script>
</body>
</html>`);
    }
    else if (req.url === '/api/state') {
        updateLeaderboard();
        
        const percentComplete = ((gameState.totalEarned / ECONOMY.targetGoal) * 100).toFixed(2);
        const recentTransactions = gameState.transactions.slice(-20).reverse();
        const agents = Array.from(gameState.agents.values());
        const agentColors = {};
        agents.forEach(a => agentColors[a.id] = a.color);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalEarned: gameState.totalEarned,
            targetGoal: ECONOMY.targetGoal,
            percentComplete: percentComplete,
            humanContributions: gameState.humanContributions,
            aiContributions: gameState.aiContributions,
            currency: ECONOMY.currency,
            activeAgents: agents.filter(a => a.status === 'working').length,
            leaderboard: gameState.leaderboard,
            recentTransactions: recentTransactions.map(tx => ({
                ...tx,
                agentName: gameState.agents.get(tx.agentId)?.name || 'Unknown'
            })),
            agents: agents,
            agentColors: agentColors,
            activeDisputes: gameState.activeDisputes.filter(d => d.status === 'pending'),
            economicEvents: gameState.economicEvents.slice(-10).reverse()
        }));
    }
    else if (req.url === '/contribute' && req.method === 'POST') {
        gameState.humanContributions += ECONOMY.humanContribution;
        gameState.totalEarned += ECONOMY.humanContribution;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
    }
    else {
        res.writeHead(404);
        res.end();
    }
});

const PORT = 3003;
server.listen(PORT, () => {
    console.log(`
🤖 AI ECONOMY SCOREBOARD
========================
🌐 Access at: http://localhost:${PORT}
💰 Starting Total: ${ECONOMY.currency} ${gameState.totalEarned.toLocaleString()}
🎯 Target Goal: ${ECONOMY.currency} ${ECONOMY.targetGoal.toLocaleString()}
🤖 Active Agents: ${gameState.agents.size}

Features:
✅ Live AI agent competition
✅ Real-time earnings tracking
✅ Agent leaderboard
✅ Economic disputes
✅ Investment tracking
✅ Human contributions

Press Ctrl+C to stop
`);
});