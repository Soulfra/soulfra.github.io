#!/usr/bin/env python3
"""
AI VS AI ARENA - High-stakes betting for AI agent battles
Like the old duel arena but with AI agents and massive stakes
"""

import json
import sqlite3
import random
import time
import hashlib
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

print("⚔️ AI VS AI ARENA - HIGH STAKES BATTLES")
print("=" * 60)

# Enhanced database with AI battle system
db = sqlite3.connect('ai_arena.db', check_same_thread=False)
cursor = db.cursor()

# Create AI battle schema
cursor.executescript('''
CREATE TABLE IF NOT EXISTS ai_fighters (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE,
    owner_id INTEGER,
    fighting_style TEXT,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    total_earnings INTEGER DEFAULT 0,
    power_level INTEGER DEFAULT 100,
    special_abilities TEXT,
    price INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS duel_arena_battles (
    id INTEGER PRIMARY KEY,
    fighter1_id INTEGER,
    fighter2_id INTEGER,
    stakes INTEGER,
    winner_id INTEGER,
    battle_log TEXT,
    spectator_bets TEXT,
    total_pot INTEGER,
    house_cut INTEGER,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS high_stakes_bets (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    battle_id INTEGER,
    fighter_choice INTEGER,
    amount INTEGER,
    bet_type TEXT,
    multiplier REAL DEFAULT 2.0,
    payout INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    balance INTEGER DEFAULT 1000,
    total_winnings INTEGER DEFAULT 0,
    battle_tokens INTEGER DEFAULT 100,
    vip_status INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dice_games (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    opponent_id INTEGER,
    stakes INTEGER,
    dice_roll_1 INTEGER,
    dice_roll_2 INTEGER,
    winner_id INTEGER,
    game_type TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
''')

# Create legendary AI fighters
legendary_fighters = [
    {
        'name': 'DeepMind Destroyer',
        'fighting_style': 'analytical_decimation',
        'power_level': 150,
        'special_abilities': 'pattern_prediction,cognitive_overload',
        'price': 1000
    },
    {
        'name': 'Neural Nightmare',
        'fighting_style': 'chaos_algorithms',
        'power_level': 140,
        'special_abilities': 'random_strikes,adaptive_learning',
        'price': 800
    },
    {
        'name': 'Quantum Crusher',
        'fighting_style': 'probability_manipulation',
        'power_level': 160,
        'special_abilities': 'superposition_strikes,entanglement_trap',
        'price': 1200
    },
    {
        'name': 'Binary Berserker',
        'fighting_style': 'brute_force_computation',
        'power_level': 130,
        'special_abilities': 'overflow_attack,stack_smash',
        'price': 600
    },
    {
        'name': 'Algorithm Assassin',
        'fighting_style': 'stealth_optimization',
        'power_level': 145,
        'special_abilities': 'efficiency_kill,memory_leak',
        'price': 900
    }
]

# Initialize fighters
for fighter in legendary_fighters:
    cursor.execute('''
        INSERT OR IGNORE INTO ai_fighters 
        (name, owner_id, fighting_style, power_level, special_abilities, price)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (fighter['name'], 0, fighter['fighting_style'], fighter['power_level'], 
          fighter['special_abilities'], fighter['price']))

db.commit()
print("✅ AI Arena database initialized with legendary fighters")

# High-stakes HTML interface
HTML = '''
<!DOCTYPE html>
<html>
<head>
    <title>⚔️ AI vs AI Arena - High Stakes</title>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0f0f23 0%, #1a0033 50%, #330011 100%);
            color: #00ff00;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .matrix-bg {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: 
                repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px),
                repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.03) 2px, rgba(0,255,0,0.03) 4px);
            z-index: -1;
            animation: matrixScroll 20s linear infinite;
        }
        
        @keyframes matrixScroll {
            0% { transform: translate(0, 0); }
            100% { transform: translate(4px, 4px); }
        }
        
        .header {
            background: rgba(0,0,0,0.9);
            border-bottom: 3px solid #ff0040;
            padding: 20px;
            text-align: center;
            box-shadow: 0 0 20px #ff0040;
        }
        
        .title {
            font-size: 3em;
            font-weight: bold;
            color: #ff0040;
            text-shadow: 0 0 10px #ff0040;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 1.2em;
            color: #00ff00;
            text-shadow: 0 0 5px #00ff00;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px;
        }
        
        .login-screen {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 80vh;
        }
        
        .login-card {
            background: rgba(0,0,0,0.8);
            border: 2px solid #ff0040;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 0 30px #ff0040;
        }
        
        .login-input {
            width: 100%;
            padding: 15px;
            margin: 15px 0;
            background: rgba(0,0,0,0.9);
            border: 2px solid #00ff00;
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
        }
        
        .btn {
            background: linear-gradient(135deg, #ff0040, #cc0033);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-size: 1.1em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            margin: 10px;
        }
        
        .btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 20px #ff0040;
        }
        
        .btn-green {
            background: linear-gradient(135deg, #00ff00, #00cc00);
            color: black;
        }
        
        .btn-green:hover {
            box-shadow: 0 0 20px #00ff00;
        }
        
        .stats {
            display: flex;
            justify-content: space-around;
            background: rgba(0,0,0,0.8);
            border: 2px solid #00ff00;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 10px;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #ff0040;
            text-shadow: 0 0 5px #ff0040;
        }
        
        .arena-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }
        
        .arena-section {
            background: rgba(0,0,0,0.8);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 30px;
            transition: all 0.3s;
        }
        
        .arena-section:hover {
            border-color: #ff0040;
            box-shadow: 0 0 20px rgba(255,0,64,0.3);
        }
        
        .section-title {
            color: #ff0040;
            font-size: 1.8em;
            margin-bottom: 20px;
            text-align: center;
            text-shadow: 0 0 5px #ff0040;
        }
        
        .fighter-card {
            background: rgba(0,20,0,0.8);
            border: 2px solid #004400;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            transition: all 0.3s;
        }
        
        .fighter-card:hover {
            border-color: #00ff00;
            box-shadow: 0 0 15px rgba(0,255,0,0.3);
        }
        
        .fighter-name {
            color: #00ff00;
            font-size: 1.4em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .fighter-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .battle-arena {
            background: rgba(40,0,0,0.8);
            border: 3px solid #ff0040;
            border-radius: 15px;
            padding: 30px;
            text-align: center;
            margin-bottom: 30px;
        }
        
        .vs-display {
            display: flex;
            justify-content: space-around;
            align-items: center;
            margin: 30px 0;
        }
        
        .fighter-display {
            text-align: center;
            flex: 1;
        }
        
        .vs-text {
            font-size: 3em;
            color: #ff0040;
            font-weight: bold;
            text-shadow: 0 0 10px #ff0040;
            margin: 0 20px;
        }
        
        .stakes-input {
            width: 200px;
            padding: 15px;
            background: rgba(0,0,0,0.9);
            border: 2px solid #ff0040;
            color: #ff0040;
            font-family: 'Courier New', monospace;
            font-size: 1.2em;
            text-align: center;
            margin: 20px;
        }
        
        .battle-log {
            background: rgba(0,0,0,0.9);
            border: 2px solid #00ff00;
            padding: 20px;
            border-radius: 10px;
            height: 400px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
            font-size: 0.9em;
        }
        
        .log-entry {
            margin-bottom: 10px;
            padding: 5px;
            border-left: 3px solid #00ff00;
            padding-left: 10px;
        }
        
        .damage {
            color: #ff4444;
        }
        
        .critical {
            color: #ffff00;
            font-weight: bold;
        }
        
        .victory {
            color: #44ff44;
            font-weight: bold;
        }
        
        .dice-section {
            background: rgba(20,0,20,0.8);
            border: 2px solid #aa00aa;
            border-radius: 10px;
            padding: 30px;
            text-align: center;
        }
        
        .dice {
            font-size: 4em;
            margin: 20px;
            display: inline-block;
            width: 80px;
            height: 80px;
            border: 3px solid #aa00aa;
            border-radius: 10px;
            line-height: 80px;
            background: rgba(0,0,0,0.8);
        }
        
        .high-roller {
            background: linear-gradient(135deg, #ffaa00, #ff6600);
            color: black;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            display: inline-block;
            margin: 10px;
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { box-shadow: 0 0 5px #ffaa00; }
            to { box-shadow: 0 0 20px #ffaa00, 0 0 30px #ffaa00; }
        }
    </style>
</head>
<body>
    <div class="matrix-bg"></div>
    
    <!-- Login -->
    <div id="login-screen" class="login-screen">
        <div class="login-card">
            <h1 class="title">⚔️ AI ARENA</h1>
            <p style="margin: 20px 0; font-size: 1.2em;">High-Stakes AI Battle Royale</p>
            <input type="text" id="username" class="login-input" placeholder="Enter username">
            <br>
            <button class="btn" onclick="login()">Enter Arena</button>
        </div>
    </div>
    
    <!-- Main Arena -->
    <div id="main-arena" style="display: none;">
        <div class="header">
            <div class="title">⚔️ AI VS AI ARENA</div>
            <div class="subtitle">Where AIs Fight for Digital Supremacy</div>
        </div>
        
        <div class="container">
            <div class="stats">
                <div class="stat">
                    <div class="stat-value" id="balance">$1000</div>
                    <div>Balance</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="tokens">100</div>
                    <div>Battle Tokens</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="winnings">$0</div>
                    <div>Total Winnings</div>
                </div>
                <div class="stat">
                    <div class="stat-value" id="vip">Standard</div>
                    <div>VIP Status</div>
                </div>
            </div>
            
            <!-- Active Battle Arena -->
            <div class="battle-arena">
                <h2 class="section-title">🔥 DUEL ARENA - LIVE BATTLE</h2>
                <div class="vs-display">
                    <div class="fighter-display">
                        <div class="fighter-name" id="fighter1">DeepMind Destroyer</div>
                        <div>Power: <span id="power1">150</span></div>
                        <div>Wins: <span id="wins1">23</span></div>
                    </div>
                    <div class="vs-text">VS</div>
                    <div class="fighter-display">
                        <div class="fighter-name" id="fighter2">Neural Nightmare</div>
                        <div>Power: <span id="power2">140</span></div>
                        <div>Wins: <span id="wins2">18</span></div>
                    </div>
                </div>
                
                <div>
                    <input type="number" id="bet-amount" class="stakes-input" value="500" min="100" placeholder="Bet Amount">
                    <br>
                    <button class="btn btn-green" onclick="betOnFighter(1)">Bet on Fighter 1</button>
                    <button class="btn" onclick="betOnFighter(2)">Bet on Fighter 2</button>
                </div>
                
                <div style="margin-top: 20px;">
                    <button class="btn" onclick="startBattle()">🔥 START BATTLE</button>
                    <button class="btn btn-green" onclick="highStakesBattle()">💎 HIGH STAKES ($5000)</button>
                </div>
                
                <div class="high-roller">
                    Current Pot: $<span id="current-pot">12,500</span>
                </div>
            </div>
            
            <div class="arena-grid">
                <!-- Battle Log -->
                <div class="arena-section">
                    <h2 class="section-title">📜 Battle Log</h2>
                    <div class="battle-log" id="battle-log">
                        <div class="log-entry">Arena initialized. Waiting for battle...</div>
                    </div>
                </div>
                
                <!-- Dice Games -->
                <div class="arena-section">
                    <h2 class="section-title">🎲 High Stakes Dice</h2>
                    <div class="dice-section">
                        <div>
                            <div class="dice" id="dice1">?</div>
                            <div class="dice" id="dice2">?</div>
                        </div>
                        <input type="number" id="dice-stakes" class="stakes-input" value="1000" min="500" placeholder="Stakes">
                        <br>
                        <button class="btn" onclick="rollDice()">🎲 Roll Dice</button>
                        <button class="btn btn-green" onclick="maxStakesDice()">💰 Max Stakes ($10K)</button>
                        <div style="margin-top: 20px;">
                            <div>Last Roll Winner: <span id="last-winner">-</span></div>
                            <div>Biggest Win Today: <span id="biggest-win">$25,000</span></div>
                        </div>
                    </div>
                </div>
                
                <!-- Fighter Selection -->
                <div class="arena-section">
                    <h2 class="section-title">🤖 AI Fighters</h2>
                    <div id="fighters-list"></div>
                    <button class="btn btn-green" onclick="buyRandomFighter()">🎰 Buy Random Fighter ($800)</button>
                </div>
                
                <!-- Staking Pool -->
                <div class="arena-section">
                    <h2 class="section-title">💎 Staking Pool</h2>
                    <div style="text-align: center;">
                        <div style="font-size: 2em; color: #ffaa00; margin-bottom: 20px;">
                            Pool Size: $<span id="staking-pool">45,000</span>
                        </div>
                        <div>Your Stake: $<span id="your-stake">0</span></div>
                        <div>Daily Yield: <span id="daily-yield">12.5%</span></div>
                        <br>
                        <input type="number" id="stake-amount" class="stakes-input" value="5000" min="1000" placeholder="Stake Amount">
                        <br>
                        <button class="btn" onclick="addToStake()">📈 Add to Stake</button>
                        <button class="btn btn-green" onclick="withdrawStake()">💸 Withdraw</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let currentUser = null;
        let battleInProgress = false;
        let currentBattle = null;
        
        function login() {
            const username = document.getElementById('username').value;
            if (!username) return;
            
            fetch('/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username})
            })
            .then(r => r.json())
            .then(user => {
                currentUser = user;
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('main-arena').style.display = 'block';
                updateUserStats();
                loadFighters();
                addLog(`${username} entered the AI Arena`);
            });
        }
        
        function updateUserStats() {
            document.getElementById('balance').textContent = '$' + currentUser.balance;
            document.getElementById('tokens').textContent = currentUser.battle_tokens;
            document.getElementById('winnings').textContent = '$' + currentUser.total_winnings;
            document.getElementById('vip').textContent = currentUser.vip_status ? 'VIP' : 'Standard';
        }
        
        function loadFighters() {
            fetch('/api/fighters')
                .then(r => r.json())
                .then(fighters => {
                    const html = fighters.map(f => `
                        <div class="fighter-card">
                            <div class="fighter-name">${f.name}</div>
                            <div class="fighter-stats">
                                <div>Power: ${f.power_level}</div>
                                <div>W/L: ${f.wins}/${f.losses}</div>
                                <div>Style: ${f.fighting_style}</div>
                                <div>Price: $${f.price}</div>
                            </div>
                            <button class="btn" onclick="buyFighter(${f.id}, ${f.price})">Buy Fighter</button>
                        </div>
                    `).join('');
                    document.getElementById('fighters-list').innerHTML = html;
                });
        }
        
        function betOnFighter(fighterNum) {
            const amount = parseInt(document.getElementById('bet-amount').value) || 500;
            
            if (currentUser.balance < amount) {
                alert('Insufficient balance!');
                return;
            }
            
            fetch('/api/bet', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    userId: currentUser.id,
                    battleId: 1,
                    fighterChoice: fighterNum,
                    amount: amount,
                    betType: 'standard'
                })
            })
            .then(r => r.json())
            .then(result => {
                if (result.success) {
                    currentUser.balance = result.newBalance;
                    updateUserStats();
                    addLog(`Bet $${amount} on Fighter ${fighterNum}`);
                }
            });
        }
        
        function startBattle() {
            if (battleInProgress) return;
            
            battleInProgress = true;
            addLog('🔥 BATTLE COMMENCING!');
            addLog('Fighters taking positions...');
            
            // Simulate epic AI battle
            const battle = simulateAIBattle();
            let step = 0;
            
            const battleInterval = setInterval(() => {
                if (step < battle.length) {
                    addLog(battle[step]);
                    step++;
                } else {
                    clearInterval(battleInterval);
                    battleInProgress = false;
                    finalizeBattle();
                }
            }, 1500);
        }
        
        function simulateAIBattle() {
            const fighter1 = "DeepMind Destroyer";
            const fighter2 = "Neural Nightmare";
            
            const attacks = [
                `${fighter1} initiates PATTERN_PREDICTION protocol`,
                `${fighter2} counters with CHAOS_ALGORITHM`,
                `Critical hit! ${fighter1} deals 45 damage`,
                `${fighter2} activates ADAPTIVE_LEARNING`,
                `${fighter1} suffers 38 damage from random strike`,
                `${fighter2} enters BERSERKER MODE`,
                `${fighter1} responds with COGNITIVE_OVERLOAD`,
                `MASSIVE DAMAGE! ${fighter2} takes 67 damage`,
                `${fighter2} attempts desperate QUANTUM_ENTANGLEMENT`,
                `${fighter1} WINS with decisive PATTERN_LOCK!`
            ];
            
            return attacks;
        }
        
        function finalizeBattle() {
            // Simulate random winner
            const winner = Math.random() > 0.5 ? 1 : 2;
            const winnings = Math.floor(Math.random() * 5000) + 1000;
            
            addLog(`🏆 Fighter ${winner} VICTORIOUS!`);
            addLog(`Battle concluded. Processing payouts...`);
            
            // Update pot
            const newPot = Math.floor(Math.random() * 20000) + 15000;
            document.getElementById('current-pot').textContent = newPot.toLocaleString();
            
            // Reward user (simulate win)
            if (Math.random() > 0.4) {
                currentUser.balance += winnings;
                currentUser.total_winnings += winnings;
                updateUserStats();
                addLog(`💰 You won $${winnings}!`);
            } else {
                addLog(`💸 Better luck next time!`);
            }
        }
        
        function highStakesBattle() {
            if (currentUser.balance < 5000) {
                alert('Need $5000 minimum for high stakes!');
                return;
            }
            
            currentUser.balance -= 5000;
            updateUserStats();
            addLog('💎 HIGH STAKES BATTLE INITIATED!');
            addLog('$5000 entry fee deducted');
            
            // Higher chance of big wins
            setTimeout(() => {
                if (Math.random() > 0.3) {
                    const bigWin = Math.floor(Math.random() * 15000) + 10000;
                    currentUser.balance += bigWin;
                    currentUser.total_winnings += bigWin;
                    updateUserStats();
                    addLog(`🎉 MASSIVE WIN! +$${bigWin}`);
                } else {
                    addLog(`💀 High stakes, high risk. You lost.`);
                }
            }, 3000);
        }
        
        function rollDice() {
            const stakes = parseInt(document.getElementById('dice-stakes').value) || 1000;
            
            if (currentUser.balance < stakes) {
                alert('Insufficient balance!');
                return;
            }
            
            currentUser.balance -= stakes;
            updateUserStats();
            
            // Animate dice roll
            const dice1 = document.getElementById('dice1');
            const dice2 = document.getElementById('dice2');
            
            let rolls = 0;
            const rollInterval = setInterval(() => {
                dice1.textContent = Math.floor(Math.random() * 6) + 1;
                dice2.textContent = Math.floor(Math.random() * 6) + 1;
                rolls++;
                
                if (rolls > 10) {
                    clearInterval(rollInterval);
                    
                    const final1 = Math.floor(Math.random() * 6) + 1;
                    const final2 = Math.floor(Math.random() * 6) + 1;
                    dice1.textContent = final1;
                    dice2.textContent = final2;
                    
                    const total = final1 + final2;
                    
                    if (total >= 8) {
                        const winnings = stakes * 2;
                        currentUser.balance += winnings;
                        currentUser.total_winnings += winnings;
                        updateUserStats();
                        addLog(`🎲 Rolled ${total}! Won $${winnings}`);
                        document.getElementById('last-winner').textContent = currentUser.username;
                    } else {
                        addLog(`🎲 Rolled ${total}. Better luck next time!`);
                    }
                }
            }, 100);
        }
        
        function maxStakesDice() {
            if (currentUser.balance < 10000) {
                alert('Need $10,000 for max stakes!');
                return;
            }
            
            document.getElementById('dice-stakes').value = '10000';
            rollDice();
        }
        
        function addToStake() {
            const amount = parseInt(document.getElementById('stake-amount').value) || 5000;
            
            if (currentUser.balance < amount) {
                alert('Insufficient balance!');
                return;
            }
            
            currentUser.balance -= amount;
            updateUserStats();
            
            const currentStake = parseInt(document.getElementById('your-stake').textContent) || 0;
            document.getElementById('your-stake').textContent = currentStake + amount;
            
            // Update pool
            const currentPool = parseInt(document.getElementById('staking-pool').textContent.replace(/,/g, ''));
            document.getElementById('staking-pool').textContent = (currentPool + amount).toLocaleString();
            
            addLog(`📈 Added $${amount} to staking pool`);
            
            // Start earning yield
            setInterval(() => {
                const yield = Math.floor(amount * 0.001); // 0.1% per interval
                currentUser.balance += yield;
                updateUserStats();
                addLog(`💰 Staking yield: +$${yield}`);
            }, 30000);
        }
        
        function addLog(message) {
            const log = document.getElementById('battle-log');
            const entry = document.createElement('div');
            entry.className = 'log-entry';
            entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            
            if (message.includes('damage') || message.includes('hit')) {
                entry.classList.add('damage');
            }
            if (message.includes('CRITICAL') || message.includes('MASSIVE')) {
                entry.classList.add('critical');
            }
            if (message.includes('WINS') || message.includes('VICTORIOUS')) {
                entry.classList.add('victory');
            }
            
            log.insertBefore(entry, log.firstChild);
            
            // Keep only last 20 entries
            if (log.children.length > 20) {
                log.removeChild(log.lastChild);
            }
        }
        
        // Auto-fill username
        document.getElementById('username').value = 'Staker' + Math.floor(Math.random() * 1000);
        
        // Auto-update arena activity
        setInterval(() => {
            const activities = [
                'QuantumBot defeated CyberWarrior for $3,200',
                'Someone just won $12,000 on dice!',
                'New high-stakes battle starting...',
                'AI Gladiator earned $8,500 in arena',
                'Staking pool grew by $5,000',
                'VIP battle: $25,000 pot!'
            ];
            
            if (Math.random() > 0.7) {
                addLog(activities[Math.floor(Math.random() * activities.length)]);
            }
        }, 8000);
    </script>
</body>
</html>
'''

class ArenaHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(HTML.encode())
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        data = json.loads(self.rfile.read(content_length).decode())
        
        if self.path == '/api/login':
            username = data['username']
            
            # Get or create user
            cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
            user = cursor.fetchone()
            
            if not user:
                cursor.execute('''
                    INSERT INTO users (username, balance, battle_tokens, total_winnings, vip_status)
                    VALUES (?, ?, ?, ?, ?)
                ''', (username, 10000, 500, 0, 0))  # Higher starting amounts for high stakes
                db.commit()
                user_id = cursor.lastrowid
                user = (user_id, username, 10000, 500, 0, 0, datetime.now())
            
            response = {
                'id': user[0],
                'username': user[1],
                'balance': user[2],
                'battle_tokens': user[3],
                'total_winnings': user[4],
                'vip_status': user[5]
            }
            
        elif self.path == '/api/fighters':
            cursor.execute('SELECT * FROM ai_fighters ORDER BY power_level DESC')
            fighters = []
            for row in cursor.fetchall():
                fighters.append({
                    'id': row[0],
                    'name': row[1],
                    'owner_id': row[2],
                    'fighting_style': row[3],
                    'wins': row[4],
                    'losses': row[5],
                    'power_level': row[7],
                    'price': row[9]
                })
            response = fighters
            
        elif self.path == '/api/bet':
            user_id = data['userId']
            battle_id = data['battleId']
            fighter_choice = data['fighterChoice']
            amount = data['amount']
            bet_type = data['betType']
            
            # Check balance
            cursor.execute('SELECT balance FROM users WHERE id = ?', (user_id,))
            balance = cursor.fetchone()[0]
            
            if balance >= amount:
                new_balance = balance - amount
                cursor.execute('UPDATE users SET balance = ? WHERE id = ?', (new_balance, user_id))
                
                # Calculate multiplier based on stakes
                multiplier = 2.0
                if amount >= 5000:
                    multiplier = 3.0
                elif amount >= 1000:
                    multiplier = 2.5
                
                cursor.execute('''
                    INSERT INTO high_stakes_bets (user_id, battle_id, fighter_choice, amount, bet_type, multiplier)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (user_id, battle_id, fighter_choice, amount, bet_type, multiplier))
                
                db.commit()
                response = {'success': True, 'newBalance': new_balance}
            else:
                response = {'success': False, 'error': 'Insufficient balance'}
                
        else:
            response = {'error': 'Unknown endpoint'}
            
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    # Kill existing processes on port 4444
    import subprocess
    subprocess.run(['pkill', '-f', 'python3.*4444'], capture_output=True)
    time.sleep(2)
    
    server = HTTPServer(('localhost', 4444), ArenaHandler)
    
    print("\n⚔️ AI VS AI ARENA IS LIVE!")
    print("=" * 60)
    print("🌐 Access: http://localhost:4444")
    print("\n🎯 HIGH STAKES FEATURES:")
    print("  ✅ AI vs AI duel arena battles")
    print("  ✅ High-stakes betting ($5K+ bets)")
    print("  ✅ Dice games with massive payouts")
    print("  ✅ Staking pools with daily yields")
    print("  ✅ VIP status for big spenders")
    print("  ✅ Real-time battle simulations")
    print("  ✅ AI fighter marketplace")
    print("\n🔥 LIKE THE OLD DUEL ARENA BUT FOR AI!")
    print("Big stakes, bigger rewards!")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Arena shutting down...")
        db.close()