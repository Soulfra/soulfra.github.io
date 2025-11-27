#!/usr/bin/env node

const http = require('http');
const PORT = 7777;

// Game without any fucking emojis that can get corrupted
const gameHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Character Battle Arena</title>
<style>
body { 
    margin: 0; 
    background: #0a0a0a; 
    color: #fff; 
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 20px;
}
.character-grid {
    display: grid;
    grid-template-columns: repeat(3, 150px);
    gap: 20px;
    justify-content: center;
    margin: 40px auto;
}
.character {
    background: #2a2a2a;
    border: 3px solid #444;
    padding: 20px;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
}
.character:hover {
    border-color: #00ff88;
    transform: scale(1.1);
}
.character-icon {
    font-size: 48px;
    font-weight: bold;
    color: #00ff88;
    margin-bottom: 10px;
}
.battle-area {
    margin: 40px auto;
    padding: 40px;
    background: #1a1a1a;
    border-radius: 20px;
    max-width: 600px;
}
button {
    padding: 15px 30px;
    margin: 10px;
    font-size: 18px;
    background: #00ff88;
    color: #000;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
}
button:hover {
    transform: scale(1.1);
}
.stats {
    margin: 20px;
    font-size: 24px;
}
</style>
</head>
<body>

<h1>CHARACTER BATTLE ARENA</h1>
<h2>Choose Your Fighter</h2>

<div class="character-grid">
    <div class="character" onclick="selectCharacter('WIZARD')">
        <div class="character-icon">WIZ</div>
        <div>Wizard</div>
    </div>
    <div class="character" onclick="selectCharacter('DRAGON')">
        <div class="character-icon">DRG</div>
        <div>Dragon</div>
    </div>
    <div class="character" onclick="selectCharacter('ROBOT')">
        <div class="character-icon">BOT</div>
        <div>Robot</div>
    </div>
    <div class="character" onclick="selectCharacter('ALIEN')">
        <div class="character-icon">ALN</div>
        <div>Alien</div>
    </div>
    <div class="character" onclick="selectCharacter('HERO')">
        <div class="character-icon">HRO</div>
        <div>Hero</div>
    </div>
    <div class="character" onclick="selectCharacter('NINJA')">
        <div class="character-icon">NJA</div>
        <div>Ninja</div>
    </div>
</div>

<div class="battle-area">
    <div id="battleStatus">Select a character to begin!</div>
    <div class="stats">
        <div>Player HP: <span id="playerHP">100</span></div>
        <div>Enemy HP: <span id="enemyHP">100</span></div>
    </div>
    <div>
        <button onclick="attack()">ATTACK</button>
        <button onclick="defend()">DEFEND</button>
        <button onclick="special()">SPECIAL</button>
    </div>
</div>

<div class="stats">
    Score: <span id="score">0</span> | 
    Wins: <span id="wins">0</span>
</div>

<script>
let selectedChar = null;
let playerHP = 100;
let enemyHP = 100;
let score = 0;
let wins = 0;

function selectCharacter(char) {
    selectedChar = char;
    enemyHP = 100;
    playerHP = 100;
    updateDisplay();
    document.getElementById('battleStatus').textContent = 
        'You selected ' + char + '! Battle against ENEMY!';
}

function attack() {
    if (!selectedChar) {
        alert('Select a character first!');
        return;
    }
    
    const damage = 20 + Math.floor(Math.random() * 10);
    enemyHP = Math.max(0, enemyHP - damage);
    
    if (enemyHP <= 0) {
        wins++;
        score += 100;
        document.getElementById('battleStatus').textContent = 'VICTORY! +100 points!';
        updateDisplay();
        return;
    }
    
    // Enemy attacks back
    const enemyDamage = 15 + Math.floor(Math.random() * 10);
    playerHP = Math.max(0, playerHP - enemyDamage);
    
    if (playerHP <= 0) {
        document.getElementById('battleStatus').textContent = 'DEFEATED! Try again!';
    }
    
    updateDisplay();
}

function defend() {
    if (!selectedChar) return;
    
    // Take reduced damage
    const enemyDamage = Math.floor((10 + Math.random() * 10) / 2);
    playerHP = Math.max(0, playerHP - enemyDamage);
    updateDisplay();
}

function special() {
    if (!selectedChar || score < 50) {
        alert('Need 50 score for special attack!');
        return;
    }
    
    score -= 50;
    enemyHP = Math.max(0, enemyHP - 50);
    
    if (enemyHP <= 0) {
        wins++;
        score += 150;
        document.getElementById('battleStatus').textContent = 'EPIC VICTORY! +150 points!';
    }
    
    updateDisplay();
}

function updateDisplay() {
    document.getElementById('playerHP').textContent = playerHP;
    document.getElementById('enemyHP').textContent = enemyHP;
    document.getElementById('score').textContent = score;
    document.getElementById('wins').textContent = wins;
}
</script>

</body>
</html>`;

const server = http.createServer((req, res) => {
    res.writeHead(200, { 
        'Content-Type': 'text/html; charset=utf-8'
    });
    res.end(gameHTML);
});

server.listen(PORT, () => {
    console.log(`
=================================================
NO EMOJI GAME - ACTUALLY WORKS
Running at: http://localhost:${PORT}
No encoding issues, no emojis, just text
=================================================
`);
});