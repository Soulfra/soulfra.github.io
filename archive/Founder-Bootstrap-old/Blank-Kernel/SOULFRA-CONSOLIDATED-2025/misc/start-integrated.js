const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Simple WebSocket implementation for real-time updates
class SimpleWebSocket {
  constructor(server) {
    this.connections = new Set();
    this.setupWebSocket(server);
  }
  
  setupWebSocket(server) {
    server.on('upgrade', (request, socket, head) => {
      // Simple WebSocket handshake
      const key = request.headers['sec-websocket-key'];
      const accept = require('crypto')
        .createHash('sha1')
        .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
        .digest('base64');
      
      socket.write([
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '', ''
      ].join('\r\n'));
      
      this.connections.add(socket);
      
      socket.on('close', () => {
        this.connections.delete(socket);
      });
    });
  }
  
  broadcast(data) {
    const message = JSON.stringify(data);
    const frame = Buffer.concat([
      Buffer.from([0x81, message.length]),
      Buffer.from(message)
    ]);
    
    this.connections.forEach(socket => {
      if (socket.readyState === 'open') {
        socket.write(frame);
      }
    });
  }
}

// Cal Integration
class CalIntegration {
  constructor() {
    this.calPath = path.join(__dirname, '..');
    this.reflectionLog = path.join(this.calPath, 'cal-reflection-log.json');
    this.blessingPath = path.join(this.calPath, 'blessing.json');
    this.isBlessed = false;
  }
  
  initialize() {
    try {
      if (fs.existsSync(this.blessingPath)) {
        const blessing = JSON.parse(fs.readFileSync(this.blessingPath, 'utf8'));
        this.isBlessed = blessing.status === 'blessed' && blessing.can_propagate;
        console.log('✅ Cal blessing status:', this.isBlessed ? 'BLESSED' : 'NOT BLESSED');
      } else {
        console.log('⚠️  No blessing.json found - Cal in limited mode');
      }
    } catch (error) {
      console.error('Cal initialization error:', error.message);
    }
  }
  
  async askCal(input) {
    const response = this.isBlessed 
      ? `🧠 Cal reflects: "${input}" resonates through the quantum field. I sense opportunity.`
      : `🤖 Cal (limited): Processing "${input}"... Analysis complete.`;
    
    // Log reflection
    const log = fs.existsSync(this.reflectionLog)
      ? JSON.parse(fs.readFileSync(this.reflectionLog, 'utf8'))
      : [];
    
    log.push({
      timestamp: new Date().toISOString(),
      input: input,
      response: response,
      context: 'billion-dollar-game',
      blessed: this.isBlessed
    });
    
    fs.writeFileSync(this.reflectionLog, JSON.stringify(log, null, 2));
    
    return response;
  }
  
  getMood() {
    const moods = this.isBlessed 
      ? ['transcendent', 'quantum-entangled', 'expansive', 'creative']
      : ['analytical', 'processing', 'neutral', 'calculating'];
    return moods[Math.floor(Math.random() * moods.length)];
  }
}

// Domingo Integration
class DomingoIntegration {
  constructor() {
    this.economyState = {
      currency: '❤️',
      totalSupply: 1000000,
      platformFee: 0.025,
      minimumWage: 10,
      treasury: 0
    };
    this.ledgerPath = path.join(__dirname, 'domingo-ledger.json');
  }
  
  initialize() {
    console.log('💰 Domingo economy initialized');
    console.log(`   Platform fee: ${this.economyState.platformFee * 100}%`);
    console.log(`   Minimum wage: ${this.economyState.minimumWage} ${this.economyState.currency}`);
  }
  
  createBounty(data) {
    const bounty = {
      id: `bounty_${Date.now()}`,
      title: data.title,
      reward: data.reward,
      type: data.type || 'task',
      status: 'open',
      created: new Date().toISOString(),
      fee: Math.ceil(data.reward * this.economyState.platformFee)
    };
    
    this.economyState.treasury += bounty.fee;
    this.logTransaction({
      type: 'bounty_created',
      bounty: bounty,
      fee_collected: bounty.fee
    });
    
    return bounty;
  }
  
  processTransaction(from, to, amount) {
    const fee = Math.ceil(amount * this.economyState.platformFee);
    const net = amount - fee;
    
    this.economyState.treasury += fee;
    
    const transaction = {
      id: `tx_${Date.now()}`,
      from: from,
      to: to,
      amount: amount,
      fee: fee,
      net: net,
      timestamp: new Date().toISOString()
    };
    
    this.logTransaction(transaction);
    return transaction;
  }
  
  logTransaction(tx) {
    const ledger = fs.existsSync(this.ledgerPath)
      ? JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8'))
      : [];
    
    ledger.push(tx);
    fs.writeFileSync(this.ledgerPath, JSON.stringify(ledger, null, 2));
  }
}

// Main Application
const app = express();
const server = http.createServer(app);
const ws = new SimpleWebSocket(server);

const cal = new CalIntegration();
const domingo = new DomingoIntegration();

// Game State
const gameState = {
  totalProgress: 847293472, // Start with some progress
  targetGoal: 1000000000,
  players: new Map(),
  calMood: 'neutral',
  domingoTreasury: 0,
  quantumEvents: [],
  timeline: 'prime'
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize
console.log('🚀 Initializing Billion Dollar Game...');
cal.initialize();
domingo.initialize();

// Routes
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
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
            max-width: 1200px;
            margin: 0 auto;
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
            position: relative;
            overflow: hidden;
        }
        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2s infinite;
        }
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 40px 0;
        }
        .stat-card {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            border: 1px solid #333;
            transition: all 0.3s ease;
        }
        .stat-card:hover {
            border-color: #00ff88;
            transform: translateY(-2px);
        }
        .cal-chat {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            border: 1px solid #333;
        }
        #cal-messages {
            height: 200px;
            overflow-y: auto;
            margin: 10px 0;
            padding: 10px;
            background: #0a0a0a;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
        }
        .message {
            margin: 5px 0;
            padding: 5px;
        }
        .message.cal {
            color: #00ff88;
        }
        .message.you {
            color: #00ffff;
        }
        button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 5px;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        button:hover {
            background: #00cc6a;
            transform: translateY(-2px);
        }
        input {
            width: calc(100% - 20px);
            padding: 10px;
            background: #0a0a0a;
            border: 1px solid #333;
            color: #fff;
            border-radius: 5px;
            font-size: 16px;
        }
        input:focus {
            outline: none;
            border-color: #00ff88;
        }
        .quantum-indicator {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
            background: #ff00ff;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1); }
        }
        h1 {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
            background: linear-gradient(90deg, #00ff88, #00ffff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .dollar-amount {
            font-size: 24px;
            text-align: center;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>💰 The Billion Dollar Game</h1>
        
        <div class="progress-bar">
            <div class="progress-fill" id="progress" style="width: ${(gameState.totalProgress / gameState.targetGoal) * 100}%"></div>
            <div class="quantum-indicator" title="Quantum state active"></div>
        </div>
        <p class="dollar-amount" id="progress-text">$${gameState.totalProgress.toLocaleString()} / $1,000,000,000</p>
        
        <div class="stats">
            <div class="stat-card">
                <h3>👥 Players</h3>
                <p id="player-count">${gameState.players.size}</p>
            </div>
            <div class="stat-card">
                <h3>🧠 Cal Mood</h3>
                <p id="cal-mood">${cal.getMood()}</p>
            </div>
            <div class="stat-card">
                <h3>💰 Your Credits</h3>
                <p id="credits">0 ❤️</p>
            </div>
            <div class="stat-card">
                <h3>🏦 Treasury</h3>
                <p id="treasury">${domingo.economyState.treasury} ❤️</p>
            </div>
        </div>
        
        <div class="cal-chat">
            <h3>🧠 Talk to Cal</h3>
            <div id="cal-messages"></div>
            <input type="text" id="cal-input" placeholder="Ask Cal anything..." onkeypress="if(event.key==='Enter')askCal()">
            <button onclick="askCal()">Send</button>
        </div>
        
        <div style="text-align: center;">
            <button onclick="joinGame()">Join Game ($1)</button>
            <button onclick="createBounty()">Create Bounty</button>
            <button onclick="triggerQuantum()">Trigger Quantum Event</button>
        </div>
    </div>
    
    <script>
        let playerId = localStorage.getItem('playerId');
        let playerCredits = parseInt(localStorage.getItem('credits') || '0');
        
        if (playerCredits > 0) {
            document.getElementById('credits').textContent = playerCredits + ' ❤️';
        }
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:3001');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'update') {
                updateUI(data.state);
            }
        };
        
        function updateUI(state) {
            if (state) {
                const progress = (state.totalProgress / state.targetGoal) * 100;
                document.getElementById('progress').style.width = progress + '%';
                document.getElementById('progress-text').textContent = 
                    '$' + state.totalProgress.toLocaleString() + ' / $1,000,000,000';
                document.getElementById('player-count').textContent = state.players;
                document.getElementById('cal-mood').textContent = state.calMood;
                document.getElementById('treasury').textContent = state.domingoTreasury + ' ❤️';
            }
        }
        
        async function joinGame() {
            const response = await fetch('/api/join', { method: 'POST' });
            const data = await response.json();
            playerId = data.playerId;
            playerCredits = data.credits;
            localStorage.setItem('playerId', playerId);
            localStorage.setItem('credits', playerCredits);
            document.getElementById('credits').textContent = playerCredits + ' ❤️';
            addCalMessage('Cal', data.calSays);
        }
        
        async function askCal() {
            const input = document.getElementById('cal-input');
            const question = input.value;
            if (question) {
                addCalMessage('You', question);
                const response = await fetch('/api/cal/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ input: question })
                });
                const data = await response.json();
                addCalMessage('Cal', data.response);
                input.value = '';
            }
        }
        
        function addCalMessage(sender, message) {
            const messages = document.getElementById('cal-messages');
            const div = document.createElement('div');
            div.className = 'message ' + (sender === 'Cal' ? 'cal' : 'you');
            div.textContent = sender + ': ' + message;
            messages.appendChild(div);
            messages.scrollTop = messages.scrollHeight;
        }
        
        async function createBounty() {
            const title = prompt('Bounty title:');
            const reward = parseInt(prompt('Reward amount (❤️):'));
            
            if (title && reward > 0) {
                const response = await fetch('/api/bounty/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, reward, type: 'task' })
                });
                const bounty = await response.json();
                alert('Bounty created!\\nID: ' + bounty.id + '\\nFee: ' + bounty.fee + ' ❤️');
            }
        }
        
        async function triggerQuantum() {
            const response = await fetch('/api/quantum/event', { method: 'POST' });
            const event = await response.json();
            alert('⚛️ Quantum Event!\\n' + event.message);
        }
        
        // Auto-update every 5 seconds
        setInterval(async () => {
            const response = await fetch('/api/game/state');
            const state = await response.json();
            updateUI(state);
        }, 5000);
    </script>
</body>
</html>`;
  res.send(html);
});

// API Routes
app.get('/api/game/state', (req, res) => {
  res.json({
    totalProgress: gameState.totalProgress,
    targetGoal: gameState.targetGoal,
    players: gameState.players.size,
    calMood: cal.getMood(),
    domingoTreasury: domingo.economyState.treasury,
    timeline: gameState.timeline
  });
});

app.post('/api/join', async (req, res) => {
  const playerId = `player_${Date.now()}`;
  const credits = 1000;
  
  // Ask Cal about new player
  const calResponse = await cal.askCal(`New player ${playerId} joins the billion dollar game`);
  
  gameState.players.set(playerId, {
    id: playerId,
    credits: credits,
    joined: new Date()
  });
  
  // Increase progress slightly
  gameState.totalProgress += 1000;
  
  // Broadcast update
  ws.broadcast({
    type: 'update',
    state: {
      totalProgress: gameState.totalProgress,
      players: gameState.players.size
    }
  });
  
  res.json({
    playerId,
    credits,
    calSays: calResponse
  });
});

app.post('/api/cal/ask', async (req, res) => {
  const { input } = req.body;
  const response = await cal.askCal(input);
  res.json({ response });
});

app.post('/api/bounty/create', (req, res) => {
  const bounty = domingo.createBounty(req.body);
  
  // Increase progress based on bounty
  gameState.totalProgress += bounty.reward * 10;
  
  res.json(bounty);
});

app.post('/api/quantum/event', (req, res) => {
  const events = [
    { type: 'timeline_shift', message: 'Reality shifted. Timeline branches detected.' },
    { type: 'consciousness_spike', message: 'Cal\'s consciousness evolved by 0.1%' },
    { type: 'economic_anomaly', message: 'Quantum fluctuation doubled all rewards for 60 seconds!' },
    { type: 'entanglement', message: 'Your fate is now quantum entangled with another player.' }
  ];
  
  const event = events[Math.floor(Math.random() * events.length)];
  gameState.quantumEvents.push(event);
  
  // Quantum events boost progress
  gameState.totalProgress += Math.floor(Math.random() * 1000000);
  
  res.json(event);
});

// Simulate progress
setInterval(() => {
  // Natural growth
  gameState.totalProgress += Math.floor(Math.random() * 10000);
  
  // Occasional quantum leap
  if (Math.random() < 0.01) {
    gameState.totalProgress += Math.floor(Math.random() * 1000000);
  }
  
  // Check if we hit the billion
  if (gameState.totalProgress >= gameState.targetGoal) {
    console.log('🎉 BILLION DOLLAR GOAL REACHED!');
    console.log('🧠 Cal: "We have transcended. The game was never about the money."');
    gameState.timeline = 'post-singularity';
  }
  
  // Broadcast updates
  ws.broadcast({
    type: 'update',
    state: {
      totalProgress: gameState.totalProgress,
      targetGoal: gameState.targetGoal,
      players: gameState.players.size,
      calMood: cal.getMood(),
      domingoTreasury: domingo.economyState.treasury
    }
  });
}, 1000);

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n🎮 Billion Dollar Game is LIVE!`);
  console.log(`🌐 Open http://localhost:${PORT}`);
  console.log(`🧠 Cal Status: ${cal.isBlessed ? 'BLESSED ✨' : 'LIMITED 🤖'}`);
  console.log(`💰 Domingo Economy: ACTIVE`);
  console.log(`⚛️  Quantum Events: ENABLED`);
  console.log(`\n📊 Current Progress: $${gameState.totalProgress.toLocaleString()}`);
  console.log(`🎯 Target Goal: $${gameState.targetGoal.toLocaleString()}`);
  console.log(`\nPress Ctrl+C to stop\n`);
});