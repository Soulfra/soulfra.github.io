#!/usr/bin/env node

/**
 * 🏛️ STANDALONE GLADIATOR ARENA
 * 
 * Self-contained version with no external dependencies
 * Everything in one file that ACTUALLY WORKS
 */

const http = require('http');
const crypto = require('crypto');
const EventEmitter = require('events');

// Port configuration
const PORT = 3004;

// Game state
const gameState = {
    totalContributed: 0,
    phase: 'intermission',
    currentFight: null,
    gladiators: [
        {
            id: 'cal_prime',
            name: 'Cal Prime',
            title: 'The Quantum Warrior',
            hp: 100,
            maxHP: 100,
            power: 95,
            defense: 82,
            wins: 847,
            losses: 153
        },
        {
            id: 'domingo_boss', 
            name: 'Domingo Boss',
            title: 'The Economic Overlord',
            hp: 120,
            maxHP: 120,
            power: 90,
            defense: 95,
            wins: 666,
            losses: 234
        },
        {
            id: 'chad_destroyer',
            name: 'Chad Destroyer', 
            title: 'The Gigachad',
            hp: 110,
            maxHP: 110,
            power: 99,
            defense: 70,
            wins: 420,
            losses: 69
        }
    ],
    players: new Map(),
    bets: new Map(),
    chatMessages: []
};

// Bot personalities for chat
const chatBots = [
    { name: 'GIGACHAD', phrases: ['EASY MONEY BOYS', 'MY GLADIATOR NEVER LOSES', 'BUILT DIFFERENT'] },
    { name: 'doomer_wojak', phrases: ['we are all gonna lose', 'rigged game tbh', 'pain is eternal'] },
    { name: 'moonboy', phrases: ['TO THE MOON 🚀', 'DIAMOND HANDS', 'WE LIKE THE GLADIATOR'] },
    { name: 'anime_waifu_uwu', phrases: ['sugoi desu ne', 'gladiator-senpai uwu', 'kawaii death match'] }
];

// Game phases
let phaseTimer = null;
let fightInterval = null;

// Helper functions
function addChatMessage(username, text, isBot = false) {
    const message = {
        id: crypto.randomBytes(8).toString('hex'),
        username,
        text,
        timestamp: Date.now(),
        isBot
    };
    
    gameState.chatMessages.push(message);
    if (gameState.chatMessages.length > 50) {
        gameState.chatMessages.shift();
    }
    
    return message;
}

function scheduleFight() {
    const available = [...gameState.gladiators];
    const glad1 = available[Math.floor(Math.random() * available.length)];
    available.splice(available.indexOf(glad1), 1);
    const glad2 = available[Math.floor(Math.random() * available.length)];
    
    gameState.currentFight = {
        id: crypto.randomBytes(8).toString('hex'),
        gladiator1: { ...glad1, currentHP: glad1.maxHP },
        gladiator2: { ...glad2, currentHP: glad2.maxHP },
        round: 0,
        bettingPool: 0,
        status: 'scheduled'
    };
    
    addChatMessage('🏛️ ARENA', `NEXT FIGHT: ${glad1.name} vs ${glad2.name}!`);
}

function startBettingPhase() {
    gameState.phase = 'betting';
    gameState.currentFight.status = 'betting';
    gameState.bets.clear();
    
    addChatMessage('🏛️ ARENA', '🎲 BETTING OPEN! Place your bets!');
    
    // Bot reactions
    setTimeout(() => {
        const bot = chatBots[Math.floor(Math.random() * chatBots.length)];
        const phrase = bot.phrases[Math.floor(Math.random() * bot.phrases.length)];
        addChatMessage(bot.name, phrase, true);
    }, 1000);
    
    // Start fight after 30 seconds
    phaseTimer = setTimeout(startFight, 30000);
}

function startFight() {
    gameState.phase = 'fighting';
    gameState.currentFight.status = 'fighting';
    
    addChatMessage('🏛️ ARENA', '⚔️ FIGHT!');
    
    // Run fight rounds
    fightInterval = setInterval(runFightRound, 2000);
}

function runFightRound() {
    const fight = gameState.currentFight;
    if (!fight) return;
    
    fight.round++;
    
    // Calculate damage
    const glad1Damage = Math.floor(Math.random() * (fight.gladiator1.power / 10)) + 5;
    const glad2Damage = Math.floor(Math.random() * (fight.gladiator2.power / 10)) + 5;
    
    // Apply damage with defense reduction
    fight.gladiator2.currentHP -= Math.max(1, glad1Damage - (fight.gladiator2.defense / 20));
    fight.gladiator1.currentHP -= Math.max(1, glad2Damage - (fight.gladiator1.defense / 20));
    
    // Check for winner
    if (fight.gladiator1.currentHP <= 0 || fight.gladiator2.currentHP <= 0 || fight.round >= 20) {
        clearInterval(fightInterval);
        endFight();
    }
}

function endFight() {
    const fight = gameState.currentFight;
    gameState.phase = 'resolution';
    
    let winner, loser;
    if (fight.gladiator1.currentHP > fight.gladiator2.currentHP) {
        winner = fight.gladiator1;
        loser = fight.gladiator2;
    } else if (fight.gladiator2.currentHP > fight.gladiator1.currentHP) {
        winner = fight.gladiator2;
        loser = fight.gladiator1;
    }
    
    if (winner) {
        addChatMessage('🏛️ ARENA', `🏆 ${winner.name} WINS!`);
        
        // Update records
        const winnerGlad = gameState.gladiators.find(g => g.id === winner.id);
        const loserGlad = gameState.gladiators.find(g => g.id === loser.id);
        if (winnerGlad) winnerGlad.wins++;
        if (loserGlad) loserGlad.losses++;
        
        // Pay out bets
        gameState.bets.forEach((bet, playerId) => {
            if (bet.gladiatorId === winner.id) {
                const player = gameState.players.get(playerId);
                if (player) {
                    const winnings = bet.amount * 2;
                    player.balance += winnings;
                }
            }
        });
    } else {
        addChatMessage('🏛️ ARENA', '⚔️ DRAW!');
    }
    
    // Bot reactions
    setTimeout(() => {
        const bot = chatBots[Math.floor(Math.random() * chatBots.length)];
        addChatMessage(bot.name, winner ? 'GG EZ' : 'RIGGED', true);
    }, 500);
    
    // Back to intermission after 30 seconds
    phaseTimer = setTimeout(startIntermission, 30000);
}

function startIntermission() {
    gameState.phase = 'intermission';
    gameState.currentFight = null;
    
    addChatMessage('🏛️ ARENA', '⏸️ INTERMISSION - Next fight in 60 seconds!');
    
    // Schedule next fight
    scheduleFight();
    
    // Start betting phase after 60 seconds
    phaseTimer = setTimeout(startBettingPhase, 60000);
}

// Initialize game loop
function startGameLoop() {
    scheduleFight();
    setTimeout(startBettingPhase, 5000); // Start first fight quickly for demo
}

// HTTP Server
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
        res.end(getGameInterface());
    }
    
    // Game state API
    else if (req.url === '/api/state') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            phase: gameState.phase,
            totalContributed: gameState.totalContributed,
            currentFight: gameState.currentFight,
            chatMessages: gameState.chatMessages.slice(-20)
        }));
    }
    
    // Join game
    else if (req.url === '/api/join' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const playerId = crypto.randomBytes(8).toString('hex');
            const player = {
                id: playerId,
                username: data.username || `Anon${Math.floor(Math.random() * 9999)}`,
                balance: 1000
            };
            
            gameState.players.set(playerId, player);
            addChatMessage('🏛️ ARENA', `${player.username} joined!`);
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(player));
        });
    }
    
    // Contribute
    else if (req.url === '/api/contribute' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const player = gameState.players.get(data.playerId);
            
            if (player) {
                player.balance += data.amount || 1000;
                gameState.totalContributed += data.amount || 1000;
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, newBalance: player.balance }));
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Player not found' }));
            }
        });
    }
    
    // Place bet
    else if (req.url === '/api/bet' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const player = gameState.players.get(data.playerId);
            
            if (player && gameState.phase === 'betting' && player.balance >= data.amount) {
                player.balance -= data.amount;
                gameState.bets.set(data.playerId, {
                    gladiatorId: data.gladiatorId,
                    amount: data.amount
                });
                gameState.currentFight.bettingPool += data.amount;
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, newBalance: player.balance }));
            } else {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Cannot place bet' }));
            }
        });
    }
    
    // Send chat
    else if (req.url === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            const data = JSON.parse(body);
            const player = gameState.players.get(data.playerId);
            
            if (player) {
                addChatMessage(player.username, data.message);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true }));
            } else {
                res.writeHead(404);
                res.end();
            }
        });
    }
    
    else {
        res.writeHead(404);
        res.end();
    }
});

function getGameInterface() {
    return `<!DOCTYPE html>
<html>
<head>
<title>Billion Dollar Gladiator Arena</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: monospace; background: #0a0a0a; color: #00ff00; }
.container { display: grid; grid-template-columns: 1fr 300px; height: 100vh; }
.arena { padding: 20px; display: flex; flex-direction: column; }
.header { font-size: 24px; margin-bottom: 20px; text-align: center; }
.progress { height: 30px; background: #1a1a1a; border: 2px solid #00ff00; margin-bottom: 20px; position: relative; }
.progress-fill { height: 100%; background: #00ff00; width: 0%; transition: width 0.3s; }
.progress-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.fight-area { flex: 1; display: flex; justify-content: space-around; align-items: center; }
.gladiator { padding: 20px; background: #1a1a1a; border: 2px solid #00ff00; text-align: center; min-width: 200px; }
.hp-bar { height: 20px; background: #333; margin: 10px 0; }
.hp-fill { height: 100%; background: #00ff00; transition: width 0.3s; }
.chat { background: #1a1a1a; border-left: 2px solid #00ff00; display: flex; flex-direction: column; }
.chat-messages { flex: 1; overflow-y: auto; padding: 10px; font-size: 12px; }
.chat-message { margin: 5px 0; word-wrap: break-word; }
.chat-input { display: flex; padding: 10px; }
.chat-input input { flex: 1; background: #0a0a0a; border: 1px solid #00ff00; color: #00ff00; padding: 5px; }
.chat-input button { background: #00ff00; color: #000; border: none; padding: 5px 10px; margin-left: 5px; cursor: pointer; }
.controls { padding: 20px; text-align: center; }
.button { background: #00ff00; color: #000; border: none; padding: 10px 20px; margin: 5px; cursor: pointer; font-weight: bold; }
.balance { font-size: 20px; margin: 10px 0; }
.phase { font-size: 18px; color: #ffff00; margin: 10px 0; }
.betting-controls { display: none; margin: 20px 0; }
.vs { font-size: 48px; font-weight: bold; }
</style>
</head>
<body>
<div class="container">
    <div class="arena">
        <div class="header">🏛️ BILLION DOLLAR GLADIATOR ARENA</div>
        <div class="progress">
            <div class="progress-fill" id="progressFill"></div>
            <div class="progress-text" id="progressText">$0 / $1,000,000,000</div>
        </div>
        <div class="phase" id="phase">INITIALIZING...</div>
        <div class="fight-area" id="fightArea">
            <div class="vs">WAITING FOR FIGHT...</div>
        </div>
        <div class="betting-controls" id="bettingControls">
            <button class="button" onclick="placeBet('gladiator1', 100)">BET $100 ON GLADIATOR 1</button>
            <button class="button" onclick="placeBet('gladiator2', 100)">BET $100 ON GLADIATOR 2</button>
        </div>
        <div class="controls">
            <button class="button" onclick="contribute()">CONTRIBUTE $1000</button>
            <div class="balance">BALANCE: $<span id="balance">0</span></div>
        </div>
    </div>
    <div class="chat">
        <div class="chat-messages" id="chatMessages"></div>
        <div class="chat-input">
            <input type="text" id="chatInput" placeholder="Type message..." onkeypress="if(event.key==='Enter')sendChat()">
            <button onclick="sendChat()">SEND</button>
        </div>
    </div>
</div>

<script>
let playerId = null;
let playerName = null;
let currentGladiator1 = null;
let currentGladiator2 = null;

// Join game
async function init() {
    const name = prompt('Enter username:') || 'Anon';
    const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: name })
    });
    const player = await response.json();
    playerId = player.id;
    playerName = player.username;
    document.getElementById('balance').textContent = player.balance;
    
    // Start update loop
    setInterval(updateGame, 1000);
}

async function updateGame() {
    try {
        const response = await fetch('/api/state');
        const state = await response.json();
        
        // Update progress
        const progress = (state.totalContributed / 1000000000) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
        document.getElementById('progressText').textContent = '$' + state.totalContributed.toLocaleString() + ' / $1,000,000,000';
        
        // Update phase
        document.getElementById('phase').textContent = state.phase.toUpperCase();
        
        // Update fight display
        if (state.currentFight) {
            currentGladiator1 = state.currentFight.gladiator1.id;
            currentGladiator2 = state.currentFight.gladiator2.id;
            
            if (state.phase === 'betting') {
                document.getElementById('fightArea').innerHTML = \`
                    <div class="gladiator">
                        <h3>\${state.currentFight.gladiator1.name}</h3>
                        <div>\${state.currentFight.gladiator1.title}</div>
                        <div>W: \${state.currentFight.gladiator1.wins} L: \${state.currentFight.gladiator1.losses}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="gladiator">
                        <h3>\${state.currentFight.gladiator2.name}</h3>
                        <div>\${state.currentFight.gladiator2.title}</div>
                        <div>W: \${state.currentFight.gladiator2.wins} L: \${state.currentFight.gladiator2.losses}</div>
                    </div>
                \`;
                document.getElementById('bettingControls').style.display = 'block';
            } else if (state.phase === 'fighting') {
                document.getElementById('fightArea').innerHTML = \`
                    <div class="gladiator">
                        <h3>\${state.currentFight.gladiator1.name}</h3>
                        <div>HP: \${Math.max(0, Math.floor(state.currentFight.gladiator1.currentHP))}</div>
                        <div class="hp-bar">
                            <div class="hp-fill" style="width: \${Math.max(0, state.currentFight.gladiator1.currentHP)}%"></div>
                        </div>
                    </div>
                    <div class="vs">ROUND \${state.currentFight.round}</div>
                    <div class="gladiator">
                        <h3>\${state.currentFight.gladiator2.name}</h3>
                        <div>HP: \${Math.max(0, Math.floor(state.currentFight.gladiator2.currentHP))}</div>
                        <div class="hp-bar">
                            <div class="hp-fill" style="width: \${Math.max(0, state.currentFight.gladiator2.currentHP)}%"></div>
                        </div>
                    </div>
                \`;
                document.getElementById('bettingControls').style.display = 'none';
            }
        } else {
            document.getElementById('fightArea').innerHTML = '<div class="vs">INTERMISSION</div>';
            document.getElementById('bettingControls').style.display = 'none';
        }
        
        // Update chat
        const chatDiv = document.getElementById('chatMessages');
        chatDiv.innerHTML = state.chatMessages.map(msg => 
            \`<div class="chat-message">\${msg.username}: \${msg.text}</div>\`
        ).join('');
        chatDiv.scrollTop = chatDiv.scrollHeight;
        
    } catch (error) {
        console.error('Update failed:', error);
    }
}

async function contribute() {
    const response = await fetch('/api/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, amount: 1000 })
    });
    const result = await response.json();
    if (result.success) {
        document.getElementById('balance').textContent = result.newBalance;
    }
}

async function placeBet(gladiator, amount) {
    const gladiatorId = gladiator === 'gladiator1' ? currentGladiator1 : currentGladiator2;
    const response = await fetch('/api/bet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, gladiatorId, amount })
    });
    const result = await response.json();
    if (result.success) {
        document.getElementById('balance').textContent = result.newBalance;
    }
}

async function sendChat() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    
    await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, message })
    });
    
    input.value = '';
}

// Initialize
init();
</script>
</body>
</html>`;
}

// Start server
server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║           🏛️  GLADIATOR ARENA STANDALONE 🏛️               ║
║                                                           ║
║  Self-contained arena with no external dependencies       ║
║                                                           ║
║  URL: http://localhost:${PORT}                             ║
╚═══════════════════════════════════════════════════════════╝
    `);
    
    // Start game loop
    startGameLoop();
});