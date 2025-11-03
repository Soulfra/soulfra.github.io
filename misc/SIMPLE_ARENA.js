#!/usr/bin/env node

const http = require('http');
const PORT = 3334;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
<!DOCTYPE html>
<html>
<head>
<title>Battle Arena</title>
<style>
body { background: #1a1a1a; color: #fff; font-family: Arial; padding: 20px; }
.arena { max-width: 800px; margin: 0 auto; text-align: center; }
h1 { color: #ffd700; font-size: 48px; }
.battle-area { background: #2a2a2a; padding: 30px; border-radius: 20px; margin: 20px 0; }
.fighter { display: inline-block; margin: 0 30px; padding: 20px; background: #333; border-radius: 10px; }
.hp-bar { width: 200px; height: 20px; background: #666; margin: 10px 0; }
.hp { height: 100%; background: #00ff00; transition: width 0.3s; }
.button { background: #ffd700; color: #000; border: none; padding: 15px 30px; font-size: 20px; cursor: pointer; margin: 10px; border-radius: 10px; }
.button:hover { background: #ffed4e; transform: scale(1.1); }
.log { background: #1a1a1a; padding: 20px; height: 200px; overflow-y: auto; text-align: left; margin: 20px auto; max-width: 600px; border: 1px solid #444; }
</style>
</head>
<body>
<div class="arena">
  <h1>⚔️ BATTLE ARENA ⚔️</h1>
  
  <div class="battle-area">
    <div class="fighter">
      <h2>YOU</h2>
      <div class="hp-bar"><div class="hp" id="playerHp" style="width: 100%"></div></div>
      <p>HP: <span id="playerHpText">100/100</span></p>
    </div>
    
    <div style="display: inline-block; font-size: 48px; vertical-align: middle;">VS</div>
    
    <div class="fighter">
      <h2 id="enemyName">ENEMY</h2>
      <div class="hp-bar"><div class="hp" id="enemyHp" style="width: 100%"></div></div>
      <p>HP: <span id="enemyHpText">100/100</span></p>
    </div>
  </div>
  
  <div>
    <button class="button" onclick="findBattle()">FIND BATTLE</button>
    <button class="button" onclick="attack()">ATTACK</button>
    <button class="button" onclick="heal()">HEAL</button>
  </div>
  
  <div class="log" id="log">
    <div>Welcome to the Arena! Click FIND BATTLE to start!</div>
  </div>
</div>

<script>
let playerHp = 100;
let enemyHp = 100;
let inBattle = false;

function log(msg) {
  const logDiv = document.getElementById('log');
  logDiv.innerHTML += '<div>' + msg + '</div>';
  logDiv.scrollTop = logDiv.scrollHeight;
}

function updateHP() {
  document.getElementById('playerHp').style.width = playerHp + '%';
  document.getElementById('playerHpText').textContent = playerHp + '/100';
  document.getElementById('enemyHp').style.width = enemyHp + '%';
  document.getElementById('enemyHpText').textContent = enemyHp + '/100';
}

function findBattle() {
  const enemies = ['Dragon', 'Goblin King', 'Dark Knight', 'Evil Wizard', 'Troll Chief'];
  const enemy = enemies[Math.floor(Math.random() * enemies.length)];
  document.getElementById('enemyName').textContent = enemy;
  playerHp = 100;
  enemyHp = 100;
  inBattle = true;
  updateHP();
  log('⚔️ Battle started against ' + enemy + '!');
}

function attack() {
  if (!inBattle) {
    log('Find a battle first!');
    return;
  }
  
  const damage = Math.floor(Math.random() * 25) + 10;
  enemyHp = Math.max(0, enemyHp - damage);
  log('You deal ' + damage + ' damage!');
  updateHP();
  
  if (enemyHp <= 0) {
    log('🏆 VICTORY! You earned 100 gold!');
    inBattle = false;
    return;
  }
  
  setTimeout(() => {
    const enemyDamage = Math.floor(Math.random() * 20) + 5;
    playerHp = Math.max(0, playerHp - enemyDamage);
    log('Enemy deals ' + enemyDamage + ' damage!');
    updateHP();
    
    if (playerHp <= 0) {
      log('💀 DEFEAT! Try again!');
      inBattle = false;
    }
  }, 500);
}

function heal() {
  playerHp = Math.min(100, playerHp + 30);
  log('You heal for 30 HP!');
  updateHP();
}
</script>
</body>
</html>
  `);
});

server.listen(PORT, () => {
  console.log(`\n⚔️  SIMPLE ARENA READY!\n🌐 http://localhost:${PORT}\n`);
});