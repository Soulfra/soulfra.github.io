#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import random

PORT = 13003

HTML = b"""<!DOCTYPE html>
<html>
<head>
<title>AI Battle Arena</title>
<style>
body { 
    margin: 0; 
    background: #1a1a1a; 
    color: #fff;
    font-family: Arial;
}

#arena {
    width: 800px;
    height: 600px;
    margin: 20px auto;
    background: #2a2a2a;
    border: 3px solid #444;
    position: relative;
    overflow: hidden;
}

.fighter {
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.fighter1 {
    background: #4169E1;
    border: 2px solid #1E90FF;
}

.fighter2 {
    background: #DC143C;
    border: 2px solid #FF6347;
}

.health-bar {
    position: absolute;
    top: -20px;
    left: -10px;
    width: 60px;
    height: 6px;
    background: #333;
    border: 1px solid #666;
}

.health-fill {
    height: 100%;
    background: #0F0;
    transition: width 0.3s;
}

.attack {
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #FFD700;
    opacity: 0;
    pointer-events: none;
}

.attack.show {
    animation: attackAnim 0.3s ease;
}

@keyframes attackAnim {
    0% { transform: scale(0); opacity: 1; }
    100% { transform: scale(3); opacity: 0; }
}

#controls {
    width: 800px;
    margin: 0 auto;
    padding: 20px;
    text-align: center;
}

button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 10px 20px;
    font-size: 16px;
    margin: 5px;
    cursor: pointer;
    border-radius: 5px;
}

button:hover {
    background: #45a049;
}

button:disabled {
    background: #666;
    cursor: not-allowed;
}

#stats {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
}

.stat-box {
    background: #333;
    padding: 15px;
    border-radius: 5px;
    border: 1px solid #555;
}

#bet-panel {
    background: #2a2a2a;
    padding: 15px;
    margin: 20px auto;
    width: 760px;
    border: 2px solid #444;
    border-radius: 5px;
}

.bet-option {
    display: inline-block;
    margin: 5px;
    padding: 8px 15px;
    background: #444;
    border: 2px solid #666;
    cursor: pointer;
    border-radius: 3px;
}

.bet-option:hover {
    border-color: #888;
}

.bet-option.selected {
    background: #555;
    border-color: #FFD700;
}

#log {
    width: 760px;
    height: 150px;
    margin: 20px auto;
    padding: 10px;
    background: #1a1a1a;
    border: 1px solid #444;
    overflow-y: auto;
    font-family: monospace;
    font-size: 12px;
}

.log-entry {
    margin: 2px 0;
    padding: 2px 5px;
}

.log-attack { color: #FFD700; }
.log-damage { color: #FF6347; }
.log-win { color: #0F0; font-weight: bold; }
</style>
</head>
<body>

<h1 style="text-align: center; color: #FFD700;">AI BATTLE ARENA</h1>

<div id="bet-panel">
    <strong>Place Your Bet:</strong>
    <span class="bet-option" data-fighter="1">Blue Fighter (2.1x)</span>
    <span class="bet-option" data-fighter="2">Red Fighter (1.9x)</span>
    <span style="margin-left: 20px;">Credits: <span id="credits">1000</span></span>
    <input type="number" id="betAmount" value="100" min="10" max="1000" style="margin-left: 10px; width: 80px;">
</div>

<div id="arena">
    <div class="fighter fighter1" id="fighter1">
        <div class="health-bar">
            <div class="health-fill" id="health1"></div>
        </div>
    </div>
    <div class="fighter fighter2" id="fighter2">
        <div class="health-bar">
            <div class="health-fill" id="health2"></div>
        </div>
    </div>
</div>

<div id="controls">
    <button onclick="startBattle()" id="startBtn">START BATTLE</button>
    <button onclick="autoMode()" id="autoBtn">AUTO MODE: OFF</button>
</div>

<div id="stats">
    <div class="stat-box">
        <h3 style="color: #4169E1;">Blue Fighter</h3>
        <div>Wins: <span id="wins1">0</span></div>
        <div>Health: <span id="hp1">100</span>/100</div>
    </div>
    <div class="stat-box">
        <h3 style="color: #DC143C;">Red Fighter</h3>
        <div>Wins: <span id="wins2">0</span></div>
        <div>Health: <span id="hp2">100</span>/100</div>
    </div>
</div>

<div id="log"></div>

<script>
let fighter1 = { x: 100, y: 300, health: 100, maxHealth: 100, wins: 0 };
let fighter2 = { x: 700, y: 300, health: 100, maxHealth: 100, wins: 0 };
let battleActive = false;
let autoModeOn = false;
let credits = 1000;
let currentBet = { fighter: null, amount: 0 };

// Initialize positions
updateFighter(1);
updateFighter(2);

function updateFighter(id) {
    const fighter = id === 1 ? fighter1 : fighter2;
    const elem = document.getElementById('fighter' + id);
    elem.style.left = fighter.x - 20 + 'px';
    elem.style.top = fighter.y - 20 + 'px';
    
    const healthBar = document.getElementById('health' + id);
    healthBar.style.width = (fighter.health / fighter.maxHealth * 100) + '%';
    
    if (fighter.health < 30) {
        healthBar.style.background = '#F00';
    } else if (fighter.health < 60) {
        healthBar.style.background = '#FF0';
    }
    
    document.getElementById('hp' + id).textContent = Math.max(0, fighter.health);
}

function distance(f1, f2) {
    const dx = f1.x - f2.x;
    const dy = f1.y - f2.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function moveTowards(fighter, target, speed) {
    const dx = target.x - fighter.x;
    const dy = target.y - fighter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
        fighter.x += (dx / dist) * speed;
        fighter.y += (dy / dist) * speed;
    }
}

function showAttack(x, y) {
    const attack = document.createElement('div');
    attack.className = 'attack show';
    attack.style.left = x - 10 + 'px';
    attack.style.top = y - 10 + 'px';
    document.getElementById('arena').appendChild(attack);
    setTimeout(() => attack.remove(), 300);
}

function log(message, type = '') {
    const logDiv = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + type;
    entry.textContent = message;
    logDiv.appendChild(entry);
    logDiv.scrollTop = logDiv.scrollHeight;
}

// Betting
document.querySelectorAll('.bet-option').forEach(opt => {
    opt.addEventListener('click', function() {
        if (battleActive) return;
        
        document.querySelectorAll('.bet-option').forEach(o => o.classList.remove('selected'));
        this.classList.add('selected');
        currentBet.fighter = parseInt(this.dataset.fighter);
    });
});

function startBattle() {
    if (battleActive) return;
    
    const betAmount = parseInt(document.getElementById('betAmount').value);
    if (currentBet.fighter && betAmount > 0 && betAmount <= credits) {
        currentBet.amount = betAmount;
        credits -= betAmount;
        document.getElementById('credits').textContent = credits;
        log(`Bet placed: ${betAmount} credits on ${currentBet.fighter === 1 ? 'Blue' : 'Red'} Fighter`, 'log-win');
    }
    
    battleActive = true;
    document.getElementById('startBtn').disabled = true;
    
    // Reset health
    fighter1.health = 100;
    fighter2.health = 100;
    fighter1.x = 100;
    fighter1.y = 300;
    fighter2.x = 700;
    fighter2.y = 300;
    
    log('Battle started!', 'log-win');
    battleLoop();
}

function battleLoop() {
    if (!battleActive) return;
    
    // AI movement
    const dist = distance(fighter1, fighter2);
    
    if (dist > 60) {
        // Move towards each other
        moveTowards(fighter1, fighter2, 3);
        moveTowards(fighter2, fighter1, 3);
    } else {
        // Attack range - dodge and attack
        fighter1.y += (Math.random() - 0.5) * 10;
        fighter2.y += (Math.random() - 0.5) * 10;
        
        // Keep in bounds
        fighter1.y = Math.max(40, Math.min(560, fighter1.y));
        fighter2.y = Math.max(40, Math.min(560, fighter2.y));
        
        // Random attacks
        if (Math.random() < 0.3) {
            const damage = Math.floor(Math.random() * 15) + 5;
            fighter2.health -= damage;
            showAttack(fighter1.x, fighter1.y);
            log(`Blue attacks for ${damage} damage!`, 'log-attack');
        }
        
        if (Math.random() < 0.3) {
            const damage = Math.floor(Math.random() * 15) + 5;
            fighter1.health -= damage;
            showAttack(fighter2.x, fighter2.y);
            log(`Red attacks for ${damage} damage!`, 'log-attack');
        }
    }
    
    updateFighter(1);
    updateFighter(2);
    
    // Check winner
    if (fighter1.health <= 0 || fighter2.health <= 0) {
        battleActive = false;
        document.getElementById('startBtn').disabled = false;
        
        let winner;
        if (fighter1.health > 0) {
            fighter1.wins++;
            winner = 1;
            log('BLUE FIGHTER WINS!', 'log-win');
        } else {
            fighter2.wins++;
            winner = 2;
            log('RED FIGHTER WINS!', 'log-win');
        }
        
        document.getElementById('wins1').textContent = fighter1.wins;
        document.getElementById('wins2').textContent = fighter2.wins;
        
        // Payout
        if (currentBet.fighter === winner) {
            const payout = Math.floor(currentBet.amount * (winner === 1 ? 2.1 : 1.9));
            credits += payout;
            document.getElementById('credits').textContent = credits;
            log(`You won ${payout} credits!`, 'log-win');
        } else if (currentBet.fighter) {
            log(`You lost ${currentBet.amount} credits`, 'log-damage');
        }
        
        currentBet = { fighter: null, amount: 0 };
        document.querySelectorAll('.bet-option').forEach(o => o.classList.remove('selected'));
        
        if (autoModeOn) {
            setTimeout(startBattle, 2000);
        }
    } else {
        requestAnimationFrame(battleLoop);
    }
}

function autoMode() {
    autoModeOn = !autoModeOn;
    document.getElementById('autoBtn').textContent = 'AUTO MODE: ' + (autoModeOn ? 'ON' : 'OFF');
    if (autoModeOn && !battleActive) {
        // Auto bet on random fighter
        const fighter = Math.random() < 0.5 ? 1 : 2;
        document.querySelector(`[data-fighter="${fighter}"]`).click();
        startBattle();
    }
}
</script>

</body>
</html>"""

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(HTML)
    def log_message(self, f, *a): pass

print(f"AI Arena Simple running on http://localhost:{PORT}")
HTTPServer(("localhost", PORT), Handler).serve_forever()