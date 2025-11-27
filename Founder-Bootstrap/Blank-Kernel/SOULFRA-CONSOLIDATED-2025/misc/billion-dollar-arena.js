#!/usr/bin/env node

/**
 * 🏛️ BILLION DOLLAR GLADIATOR ARENA
 * 
 * The main game server that brings it all together
 * RuneScape + Habbo + Twitch + 4chan = Pure chaos
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const GameOrchestrator = require('./game-orchestrator');

class BillionDollarArena {
    constructor() {
        this.PORT = 3004;
        this.orchestrator = new GameOrchestrator();
        this.sessions = new Map();
    }
    
    async start() {
        console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🏛️  BILLION DOLLAR GLADIATOR ARENA 🏛️            ║
║                                                           ║
║  Where AI gladiators fight, degens bet, and chaos reigns ║
║                                                           ║
║  Goal: Collectively contribute $1,000,000,000             ║
║  Progress: $0 / $1,000,000,000                           ║
╚═══════════════════════════════════════════════════════════╝
        `);
        
        // Initialize orchestrator
        await this.orchestrator.initialize();
        
        // Start HTTP server
        this.startServer();
    }
    
    startServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            // Main game interface
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.getGameInterface());
            }
            
            // API endpoints
            else if (req.url === '/api/state') {
                const state = this.orchestrator.getGameState();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(state));
            }
            
            else if (req.url === '/api/join' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const session = this.createSession(data.username);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(session));
                });
            }
            
            else if (req.url === '/api/contribute' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const result = this.orchestrator.economyShell.contribute(data.playerId, data.amount);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                });
            }
            
            else if (req.url === '/api/bet' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const result = this.orchestrator.bettingShell.placeBet(
                        data.playerId,
                        data.fightId,
                        data.betType,
                        data.selection,
                        data.amount
                    );
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                });
            }
            
            else if (req.url === '/api/chat/send' && req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', () => {
                    const data = JSON.parse(body);
                    const result = this.orchestrator.chatShell.sendMessage(
                        data.playerId,
                        data.username,
                        data.channelId,
                        data.text
                    );
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                });
            }
            
            else if (req.url.startsWith('/api/chat/messages/')) {
                const channelId = req.url.split('/').pop();
                const messages = this.orchestrator.chatShell.getChannelMessages(channelId);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(messages));
            }
            
            else if (req.url.startsWith('/api/player/')) {
                const playerId = req.url.split('/').pop();
                const stats = this.orchestrator.economyShell.getPlayerStats(playerId);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(stats));
            }
            
            else {
                res.writeHead(404);
                res.end();
            }
        });
        
        server.listen(this.PORT, () => {
            console.log(`
🎮 GAME SERVER ONLINE
====================
🌐 Arena URL: http://localhost:${this.PORT}
🏛️ Router: http://localhost:3003
💰 Progress: $0 / $1,000,000,000

📢 Share with friends to reach the goal faster!
🎲 May the odds be ever in your favor!
            `);
        });
    }
    
    createSession(username) {
        const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session = {
            playerId: playerId,
            username: username || `Anon${Math.floor(Math.random() * 9999)}`,
            created: Date.now()
        };
        
        this.sessions.set(playerId, session);
        
        // Notify orchestrator
        this.orchestrator.handlePlayerJoined({
            id: session.playerId,
            playerId: session.playerId,
            username: session.username
        });
        
        return session;
    }
    
    getGameInterface() {
        return `<!DOCTYPE html>
<html>
<head>
<title>Billion Dollar Gladiator Arena</title>
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Courier New', monospace;
    background: #0a0a0a;
    color: #00ff00;
    overflow: hidden;
}

.container {
    display: grid;
    grid-template-columns: 1fr 400px;
    grid-template-rows: 60px 1fr 200px;
    height: 100vh;
    gap: 2px;
    background: #00ff00;
    padding: 2px;
}

.header {
    grid-column: 1 / -1;
    background: #1a1a1a;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    border: 2px solid #00ff00;
}

.arena {
    background: #0a0a0a;
    border: 2px solid #00ff00;
    padding: 20px;
    position: relative;
    overflow: hidden;
}

.chat {
    background: #0a0a0a;
    border: 2px solid #00ff00;
    display: flex;
    flex-direction: column;
}

.controls {
    grid-column: 1 / -1;
    background: #1a1a1a;
    border: 2px solid #00ff00;
    padding: 20px;
    display: flex;
    gap: 20px;
    align-items: center;
}

/* Arena Styles */
.fight-display {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: relative;
}

.gladiator-box {
    position: absolute;
    width: 200px;
    padding: 20px;
    background: rgba(0, 255, 0, 0.1);
    border: 2px solid #00ff00;
    text-align: center;
}

.gladiator-1 {
    left: 50px;
    top: 50%;
    transform: translateY(-50%);
}

.gladiator-2 {
    right: 50px;
    top: 50%;
    transform: translateY(-50%);
}

.health-bar {
    width: 100%;
    height: 20px;
    background: #333;
    margin: 10px 0;
    position: relative;
    border: 1px solid #00ff00;
}

.health-fill {
    height: 100%;
    background: #00ff00;
    transition: width 0.3s;
}

.vs-text {
    font-size: 48px;
    font-weight: bold;
    text-shadow: 0 0 20px #00ff00;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

/* Chat Styles */
.chat-header {
    padding: 10px;
    background: #1a1a1a;
    border-bottom: 1px solid #00ff00;
    font-weight: bold;
}

.chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
    font-size: 14px;
}

.chat-message {
    margin: 5px 0;
    word-wrap: break-word;
}

.chat-message.system {
    color: #ffff00;
    font-style: italic;
}

.chat-message.bot {
    color: #00ccff;
}

.chat-input {
    display: flex;
    padding: 10px;
    background: #1a1a1a;
    border-top: 1px solid #00ff00;
}

.chat-input input {
    flex: 1;
    background: #0a0a0a;
    border: 1px solid #00ff00;
    color: #00ff00;
    padding: 5px 10px;
    font-family: inherit;
}

.chat-input button {
    background: #00ff00;
    color: #000;
    border: none;
    padding: 5px 15px;
    margin-left: 5px;
    cursor: pointer;
    font-weight: bold;
}

/* Control Styles */
.contribute-section {
    display: flex;
    align-items: center;
    gap: 10px;
}

.big-button {
    background: #00ff00;
    color: #000;
    border: none;
    padding: 15px 30px;
    font-size: 18px;
    font-weight: bold;
    cursor: pointer;
    text-transform: uppercase;
    transition: all 0.3s;
}

.big-button:hover {
    background: #00cc00;
    transform: scale(1.05);
}

.bet-controls {
    display: flex;
    gap: 10px;
    align-items: center;
}

.stats {
    margin-left: auto;
    text-align: right;
}

.balance {
    font-size: 24px;
    color: #ffff00;
}

/* Betting Panel */
.betting-panel {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #00ff00;
    padding: 20px;
    display: none;
}

.betting-panel.active {
    display: block;
}

.odds {
    display: flex;
    gap: 20px;
    margin-bottom: 10px;
}

.odds-box {
    padding: 10px 20px;
    background: #1a1a1a;
    border: 1px solid #00ff00;
    cursor: pointer;
}

.odds-box:hover {
    background: #2a2a2a;
}

.odds-box.selected {
    background: #00ff00;
    color: #000;
}

/* Animations */
.damage-text {
    position: absolute;
    font-size: 36px;
    font-weight: bold;
    color: #ff0000;
    animation: damage-float 1s ease-out forwards;
    pointer-events: none;
}

@keyframes damage-float {
    0% {
        transform: translateY(0);
        opacity: 1;
    }
    100% {
        transform: translateY(-50px);
        opacity: 0;
    }
}

.special-effect {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 72px;
    font-weight: bold;
    color: #ffff00;
    text-shadow: 0 0 30px #ffff00;
    animation: special-zoom 0.5s ease-out forwards;
    pointer-events: none;
}

@keyframes special-zoom {
    0% {
        transform: translate(-50%, -50%) scale(0);
    }
    50% {
        transform: translate(-50%, -50%) scale(1.5);
    }
    100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 0;
    }
}

/* Progress Bar */
.progress-bar {
    flex: 1;
    height: 30px;
    background: #1a1a1a;
    border: 2px solid #00ff00;
    position: relative;
    overflow: hidden;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #00ff00, #00cc00);
    width: 0%;
    transition: width 0.3s;
}

.progress-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px #000;
}

/* Scrollbar */
::-webkit-scrollbar {
    width: 10px;
}

::-webkit-scrollbar-track {
    background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
    background: #00ff00;
}

::-webkit-scrollbar-thumb:hover {
    background: #00cc00;
}
</style>
</head>
<body>
<div class="container">
    <div class="header">
        <h1>🏛️ BILLION DOLLAR GLADIATOR ARENA</h1>
        <div class="progress-bar">
            <div class="progress-fill" id="progressFill"></div>
            <div class="progress-text" id="progressText">$0 / $1,000,000,000</div>
        </div>
    </div>
    
    <div class="arena" id="arena">
        <div class="fight-display" id="fightDisplay">
            <div class="vs-text">WAITING FOR FIGHT...</div>
        </div>
        <div class="betting-panel" id="bettingPanel">
            <h3>PLACE YOUR BETS!</h3>
            <div class="odds" id="oddsDisplay"></div>
            <input type="number" id="betAmount" placeholder="Bet amount" min="10" max="10000">
            <button onclick="placeBet()">BET</button>
        </div>
    </div>
    
    <div class="chat">
        <div class="chat-header">💬 ARENA CHAT</div>
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input">
            <input type="text" id="chatInput" placeholder="Type message..." maxlength="280">
            <button onclick="sendChat()">SEND</button>
        </div>
    </div>
    
    <div class="controls">
        <div class="contribute-section">
            <button class="big-button" onclick="contribute(1000)">CONTRIBUTE $1000</button>
            <button class="big-button" onclick="contribute(10000)">WHALE $10K</button>
        </div>
        <div class="bet-controls" id="betControls" style="display: none;">
            <button onclick="quickBet(100)">BET $100</button>
            <button onclick="quickBet(1000)">BET $1K</button>
            <button onclick="quickBet(5000)">YOLO $5K</button>
        </div>
        <div class="stats">
            <div>BALANCE: <span class="balance" id="balance">$1000</span></div>
            <div>WIN RATE: <span id="winRate">0%</span></div>
        </div>
    </div>
</div>

<script>
// Game state
let playerId = null;
let username = null;
let currentFightId = null;
let selectedGladiator = null;
let balance = 1000;

// Initialize
window.onload = async function() {
    // Join game
    const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: prompt('Enter username:') || 'Anon' })
    });
    
    const session = await response.json();
    playerId = session.playerId;
    username = session.username;
    
    // Start update loops
    setInterval(updateGameState, 1000);
    setInterval(updateChat, 500);
    setInterval(updatePlayerStats, 5000);
    
    // Chat enter key
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChat();
    });
};

async function updateGameState() {
    try {
        const response = await fetch('/api/state');
        const state = await response.json();
        
        // Update progress
        const progress = (state.totalContributed / 1000000000) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = 
            formatCurrency(state.totalContributed) + ' / $1B';
        
        // Update fight display
        if (state.phase === 'betting' && state.nextFight) {
            showBettingPhase(state.nextFight);
        } else if (state.phase === 'fighting' && state.currentFight) {
            showFightPhase(state.currentFight);
        } else if (state.phase === 'intermission') {
            showIntermission();
        }
        
        currentFightId = state.currentFight?.id || null;
    } catch (error) {
        console.error('Failed to update state:', error);
    }
}

function showBettingPhase(fight) {
    const display = document.getElementById('fightDisplay');
    display.innerHTML = \`
        <div class="gladiator-box gladiator-1">
            <h3>\${fight.gladiator1.name}</h3>
            <div>\${fight.gladiator1.title}</div>
            <div>Record: \${fight.gladiator1.wins}W - \${fight.gladiator1.losses}L</div>
            <div class="health-bar">
                <div class="health-fill" style="width: 100%"></div>
            </div>
        </div>
        <div class="vs-text">VS</div>
        <div class="gladiator-box gladiator-2">
            <h3>\${fight.gladiator2.name}</h3>
            <div>\${fight.gladiator2.title}</div>
            <div>Record: \${fight.gladiator2.wins}W - \${fight.gladiator2.losses}L</div>
            <div class="health-bar">
                <div class="health-fill" style="width: 100%"></div>
            </div>
        </div>
    \`;
    
    document.getElementById('bettingPanel').classList.add('active');
    document.getElementById('betControls').style.display = 'flex';
}

function showFightPhase(fight) {
    const display = document.getElementById('fightDisplay');
    display.innerHTML = \`
        <div class="gladiator-box gladiator-1">
            <h3>\${fight.gladiator1.name}</h3>
            <div>HP: \${fight.gladiator1.currentHP}%</div>
            <div class="health-bar">
                <div class="health-fill" style="width: \${fight.gladiator1.currentHP}%"></div>
            </div>
        </div>
        <div class="vs-text">ROUND \${fight.round}</div>
        <div class="gladiator-box gladiator-2">
            <h3>\${fight.gladiator2.name}</h3>
            <div>HP: \${fight.gladiator2.currentHP}%</div>
            <div class="health-bar">
                <div class="health-fill" style="width: \${fight.gladiator2.currentHP}%"></div>
            </div>
        </div>
    \`;
    
    document.getElementById('bettingPanel').classList.remove('active');
}

function showIntermission() {
    document.getElementById('fightDisplay').innerHTML = 
        '<div class="vs-text">INTERMISSION</div>';
    document.getElementById('bettingPanel').classList.remove('active');
    document.getElementById('betControls').style.display = 'none';
}

async function updateChat() {
    try {
        const response = await fetch('/api/chat/messages/arena');
        const messages = await response.json();
        
        const container = document.getElementById('chatMessages');
        const shouldScroll = container.scrollTop + container.clientHeight >= container.scrollHeight - 50;
        
        container.innerHTML = messages.map(msg => {
            const className = msg.isSystem ? 'system' : msg.isBot ? 'bot' : '';
            return \`<div class="chat-message \${className}">
                <strong>\${msg.username}:</strong> \${msg.text}
            </div>\`;
        }).join('');
        
        if (shouldScroll) {
            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('Failed to update chat:', error);
    }
}

async function updatePlayerStats() {
    try {
        const response = await fetch(\`/api/player/\${playerId}\`);
        const stats = await response.json();
        
        if (stats) {
            balance = stats.balance;
            document.getElementById('balance').textContent = formatCurrency(balance);
            document.getElementById('winRate').textContent = stats.winRate || '0%';
        }
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

async function contribute(amount) {
    try {
        const response = await fetch('/api/contribute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerId, amount })
        });
        
        const result = await response.json();
        if (result.success) {
            balance = result.newBalance;
            document.getElementById('balance').textContent = formatCurrency(balance);
            
            // Visual feedback
            showEffect('CONTRIBUTED!');
        }
    } catch (error) {
        console.error('Failed to contribute:', error);
    }
}

async function placeBet() {
    const amount = parseInt(document.getElementById('betAmount').value);
    if (!amount || amount < 10) {
        alert('Minimum bet is $10');
        return;
    }
    
    if (!currentFightId || !selectedGladiator) {
        alert('Select a gladiator first!');
        return;
    }
    
    try {
        const response = await fetch('/api/bet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId,
                fightId: currentFightId,
                betType: 'winner',
                selection: selectedGladiator,
                amount
            })
        });
        
        const result = await response.json();
        if (result.success) {
            balance = result.newBalance;
            document.getElementById('balance').textContent = formatCurrency(balance);
            showEffect('BET PLACED!');
        } else {
            alert(result.error);
        }
    } catch (error) {
        console.error('Failed to place bet:', error);
    }
}

async function quickBet(amount) {
    document.getElementById('betAmount').value = amount;
    placeBet();
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    try {
        await fetch('/api/chat/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerId,
                username,
                channelId: 'arena',
                text
            })
        });
        
        input.value = '';
    } catch (error) {
        console.error('Failed to send chat:', error);
    }
}

function showEffect(text) {
    const effect = document.createElement('div');
    effect.className = 'special-effect';
    effect.textContent = text;
    document.getElementById('arena').appendChild(effect);
    
    setTimeout(() => effect.remove(), 1000);
}

function formatCurrency(amount) {
    if (amount >= 1000000000) return '$' + (amount / 1000000000).toFixed(1) + 'B';
    if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
    if (amount >= 1000) return '$' + (amount / 1000).toFixed(1) + 'K';
    return '$' + amount;
}
</script>
</body>
</html>`;
    }
}

// Start the game
const arena = new BillionDollarArena();
arena.start().catch(console.error);