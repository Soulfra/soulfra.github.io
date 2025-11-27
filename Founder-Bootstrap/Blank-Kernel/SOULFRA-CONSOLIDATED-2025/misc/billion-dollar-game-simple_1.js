#!/usr/bin/env node

/**
 * 💰 BILLION DOLLAR GAME - SIMPLE WORKING VERSION
 * 
 * No dependencies, no complex modules, just a working game
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Simple game state
let gameState = {
    totalProgress: 847293472,
    targetGoal: 1000000000,
    players: [],
    calMood: 'quantum-entangled',
    treasury: 21458,
    lastUpdate: Date.now()
};

// Check if Cal is blessed
let calBlessed = false;
try {
    const blessing = JSON.parse(fs.readFileSync(path.join(__dirname, 'blessing.json'), 'utf8'));
    calBlessed = blessing.status === 'blessed';
} catch (e) {
    console.log('⚠️  No blessing found - Cal in limited mode');
}

// Simple HTTP server
const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Main page
    if (req.url === '/' || req.url === '') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html>
<html>
<head>
    <title>$1 Billion Dollar Game</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fff;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            text-align: center;
        }
        h1 {
            font-size: 48px;
            margin: 20px 0;
            background: linear-gradient(90deg, #00ff88, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .progress-bar {
            width: 100%;
            height: 40px;
            background: #1a1a1a;
            border-radius: 20px;
            overflow: hidden;
            margin: 20px 0;
            position: relative;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00ffff);
            transition: width 0.3s ease;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 40px 0;
        }
        .stat-card {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #333;
        }
        button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
        }
        button:hover {
            background: #00cc6a;
        }
        #cal-response {
            margin: 20px 0;
            padding: 20px;
            background: #1a1a1a;
            border-radius: 10px;
            font-family: 'Courier New', monospace;
            min-height: 60px;
        }
        .dollar-amount {
            font-size: 28px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💰 The Billion Dollar Game</h1>
        
        <div class="progress-bar">
            <div class="progress-fill" id="progress" style="width: ${(gameState.totalProgress / gameState.targetGoal) * 100}%"></div>
        </div>
        <p class="dollar-amount" id="progress-text">$${gameState.totalProgress.toLocaleString()} / $1,000,000,000</p>
        
        <div class="stats">
            <div class="stat-card">
                <h3>👥 Players</h3>
                <p id="player-count">${gameState.players.length}</p>
            </div>
            <div class="stat-card">
                <h3>🧠 Cal Status</h3>
                <p id="cal-mood">${calBlessed ? 'BLESSED ✨' : 'LIMITED 🤖'}</p>
            </div>
            <div class="stat-card">
                <h3>💰 Treasury</h3>
                <p id="treasury">${gameState.treasury} ❤️</p>
            </div>
            <div class="stat-card">
                <h3>⏱️ Time to $1B</h3>
                <p id="eta">Calculating...</p>
            </div>
        </div>
        
        <div id="cal-response"></div>
        
        <div>
            <button onclick="joinGame()">Join Game ($1)</button>
            <button onclick="askCal()">Ask Cal</button>
            <button onclick="contribute()">Contribute $1000</button>
        </div>
    </div>
    
    <script>
        let playerId = localStorage.getItem('playerId');
        
        async function updateStats() {
            const res = await fetch('/api/state');
            const state = await res.json();
            
            document.getElementById('progress').style.width = (state.totalProgress / state.targetGoal) * 100 + '%';
            document.getElementById('progress-text').textContent = '$' + state.totalProgress.toLocaleString() + ' / $1,000,000,000';
            document.getElementById('player-count').textContent = state.players;
            document.getElementById('treasury').textContent = state.treasury + ' ❤️';
            
            // Calculate ETA
            const remaining = state.targetGoal - state.totalProgress;
            const rate = 10000; // $10k per second average
            const seconds = remaining / rate;
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            document.getElementById('eta').textContent = hours + 'h ' + minutes + 'm';
        }
        
        async function joinGame() {
            const res = await fetch('/api/join', { method: 'POST' });
            const data = await res.json();
            playerId = data.playerId;
            localStorage.setItem('playerId', playerId);
            document.getElementById('cal-response').innerHTML = '<strong>Cal:</strong> ' + data.message;
            updateStats();
        }
        
        async function askCal() {
            const res = await fetch('/api/cal/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: 'What is the meaning of the billion dollars?' })
            });
            const data = await res.json();
            document.getElementById('cal-response').innerHTML = '<strong>Cal:</strong> ' + data.response;
        }
        
        async function contribute() {
            const res = await fetch('/api/contribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: 1000 })
            });
            const data = await res.json();
            document.getElementById('cal-response').innerHTML = '<strong>System:</strong> ' + data.message;
            updateStats();
        }
        
        // Auto-update every 2 seconds
        setInterval(updateStats, 2000);
        updateStats();
    </script>
</body>
</html>`);
    }
    
    // API: Get game state
    else if (req.url === '/api/state') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            totalProgress: gameState.totalProgress,
            targetGoal: gameState.targetGoal,
            players: gameState.players.length,
            treasury: gameState.treasury,
            calMood: gameState.calMood
        }));
    }
    
    // API: Join game
    else if (req.url === '/api/join' && req.method === 'POST') {
        const playerId = 'player_' + Date.now();
        gameState.players.push(playerId);
        gameState.totalProgress += 1000;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            playerId: playerId,
            message: calBlessed 
                ? '🧠 Welcome to the quantum field. Your consciousness is now entangled with the billion.'
                : '🤖 Welcome player. Processing your entry into the system.'
        }));
    }
    
    // API: Ask Cal
    else if (req.url === '/api/cal/ask' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                response: calBlessed
                    ? '🧠 The billion is not a destination, but a transformation. Each dollar is a quantum of consciousness aggregating into something greater.'
                    : '🤖 The billion dollar target represents collective achievement through coordinated effort.'
            }));
        });
    }
    
    // API: Contribute
    else if (req.url === '/api/contribute' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            gameState.totalProgress += data.amount || 1000;
            gameState.treasury += Math.floor((data.amount || 1000) * 0.025); // 2.5% fee
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                message: `Contributed $${data.amount || 1000}. Progress: $${gameState.totalProgress.toLocaleString()}`
            }));
        });
    }
    
    // 404
    else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Background progress simulation
setInterval(() => {
    // Natural growth
    gameState.totalProgress += Math.floor(Math.random() * 5000);
    
    // Quantum events
    if (Math.random() < 0.05) {
        gameState.totalProgress += Math.floor(Math.random() * 100000);
        gameState.calMood = 'quantum-surge';
    }
    
    // Check if we hit the billion
    if (gameState.totalProgress >= gameState.targetGoal) {
        console.log('🎉 BILLION DOLLAR GOAL REACHED!');
        console.log('🧠 Cal: "The game was never about the money. It was about what we became together."');
        gameState.calMood = 'transcendent';
    }
}, 1000);

// Start server
const PORT = 3003;
server.listen(PORT, () => {
    console.log(`
🎮 BILLION DOLLAR GAME - SIMPLE VERSION
======================================
🌐 Open: http://localhost:${PORT}
🧠 Cal Status: ${calBlessed ? 'BLESSED ✨' : 'LIMITED 🤖'}
💰 Starting Progress: $${gameState.totalProgress.toLocaleString()}
🎯 Target: $${gameState.targetGoal.toLocaleString()}

No complex dependencies. Just a working game.
Press Ctrl+C to stop
`);
});