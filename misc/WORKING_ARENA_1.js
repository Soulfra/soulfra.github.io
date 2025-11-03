const http = require('http');
const PORT = 3335;

const htmlPage = `<!DOCTYPE html>
<html>
<head>
<title>Battle Arena</title>
<style>
body { background: #1a1a1a; color: white; font-family: Arial; text-align: center; padding: 20px; }
.arena { max-width: 800px; margin: 0 auto; }
h1 { color: #FFD700; font-size: 48px; text-shadow: 2px 2px 4px black; }
.battle { background: #2a2a2a; padding: 30px; border-radius: 20px; margin: 20px 0; }
.fighter { display: inline-block; margin: 0 30px; vertical-align: top; }
.hp-bar { width: 200px; height: 25px; background: #333; border: 2px solid #666; margin: 10px 0; }
.hp { height: 100%; background: linear-gradient(to right, red, lime); transition: width 0.3s; }
.btn { background: #FFD700; color: black; border: none; padding: 15px 30px; font-size: 20px; margin: 10px; cursor: pointer; border-radius: 10px; font-weight: bold; }
.btn:hover { background: #FFA500; transform: scale(1.1); }
.log { background: black; border: 2px solid #444; padding: 20px; height: 200px; overflow-y: auto; text-align: left; margin: 20px auto; max-width: 600px; }
.gold { color: #FFD700; font-size: 24px; margin: 20px; }
</style>
</head>
<body>
<div class="arena">
  <h1>BATTLE ARENA</h1>
  <div class="gold">Gold: <span id="gold">0</span></div>
  
  <div class="battle">
    <div class="fighter">
      <h2>HERO</h2>
      <div class="hp-bar"><div class="hp" id="playerHp" style="width:100%"></div></div>
      <div>HP: <span id="playerHpText">100/100</span></div>
    </div>
    
    <div style="display:inline-block;font-size:60px;vertical-align:middle;">VS</div>
    
    <div class="fighter">
      <h2 id="enemyName">???</h2>
      <div class="hp-bar"><div class="hp" id="enemyHp" style="width:100%"></div></div>
      <div>HP: <span id="enemyHpText">100/100</span></div>
    </div>
  </div>
  
  <div>
    <button class="btn" onclick="findBattle()">FIND BATTLE</button>
    <button class="btn" onclick="attack()">ATTACK</button>
    <button class="btn" onclick="heal()">HEAL (10g)</button>
    <button class="btn" onclick="upgrade()">UPGRADE (50g)</button>
  </div>
  
  <div class="log" id="log">Welcome warrior! Click FIND BATTLE to begin!</div>
</div>

<script>
let playerHp = 100, playerMaxHp = 100, enemyHp = 100, enemyMaxHp = 100;
let gold = 0, attackPower = 10, inBattle = false;

function updateUI() {
  document.getElementById('gold').textContent = gold;
  document.getElementById('playerHp').style.width = (playerHp/playerMaxHp*100) + '%';
  document.getElementById('playerHpText').textContent = playerHp + '/' + playerMaxHp;
  document.getElementById('enemyHp').style.width = (enemyHp/enemyMaxHp*100) + '%';
  document.getElementById('enemyHpText').textContent = enemyHp + '/' + enemyMaxHp;
}

function log(msg) {
  const logDiv = document.getElementById('log');
  const entry = document.createElement('div');
  entry.textContent = new Date().toLocaleTimeString() + ' - ' + msg;
  logDiv.appendChild(entry);
  logDiv.scrollTop = logDiv.scrollHeight;
}

function findBattle() {
  if (inBattle) { log('Already in battle!'); return; }
  const enemies = ['Goblin', 'Orc', 'Dragon', 'Skeleton', 'Wizard'];
  const enemy = enemies[Math.floor(Math.random() * enemies.length)];
  document.getElementById('enemyName').textContent = enemy;
  enemyMaxHp = 80 + Math.floor(Math.random() * 40);
  enemyHp = enemyMaxHp;
  inBattle = true;
  updateUI();
  log('Battle started vs ' + enemy + '!');
}

function attack() {
  if (!inBattle) { log('Find a battle first!'); return; }
  const damage = attackPower + Math.floor(Math.random() * 10);
  enemyHp = Math.max(0, enemyHp - damage);
  log('You deal ' + damage + ' damage!');
  updateUI();
  
  if (enemyHp <= 0) {
    const reward = 20 + Math.floor(Math.random() * 30);
    gold += reward;
    log('VICTORY! Earned ' + reward + ' gold!');
    inBattle = false;
    updateUI();
    return;
  }
  
  setTimeout(() => {
    const enemyDamage = 5 + Math.floor(Math.random() * 15);
    playerHp = Math.max(0, playerHp - enemyDamage);
    log('Enemy deals ' + enemyDamage + ' damage!');
    updateUI();
    if (playerHp <= 0) {
      log('DEFEAT! You respawn at town.');
      playerHp = playerMaxHp;
      inBattle = false;
      updateUI();
    }
  }, 500);
}

function heal() {
  if (gold < 10) { log('Need 10 gold!'); return; }
  gold -= 10;
  playerHp = Math.min(playerMaxHp, playerHp + 30);
  log('Healed 30 HP!');
  updateUI();
}

function upgrade() {
  if (gold < 50) { log('Need 50 gold!'); return; }
  gold -= 50;
  attackPower += 5;
  playerMaxHp += 10;
  playerHp = playerMaxHp;
  log('UPGRADED! +5 Attack, +10 Max HP');
  updateUI();
}

updateUI();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(htmlPage);
});

server.listen(PORT, () => {
  console.log('Working Arena ready at http://localhost:' + PORT);
});