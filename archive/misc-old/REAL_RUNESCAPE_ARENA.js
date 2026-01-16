const http = require('http');
const fs = require('fs');
const PORT = 6666;

// Game state
const gameState = {
  players: new Map(),
  npcs: [],
  items: new Map(),
  worldMap: {},
  combatLog: [],
  trades: []
};

// Initialize NPCs
function initWorld() {
  gameState.npcs = [
    { id: 'goblin1', name: 'Goblin', level: 2, hp: 20, maxHp: 20, x: 5, y: 5, drops: ['gold', 'bones'] },
    { id: 'guard1', name: 'Guard', level: 21, hp: 100, maxHp: 100, x: 10, y: 10, drops: ['gold', 'iron_sword'] },
    { id: 'dragon1', name: 'Green Dragon', level: 79, hp: 500, maxHp: 500, x: 20, y: 20, drops: ['dragon_bones', 'dragon_hide', 'gold'] }
  ];
}

initWorld();

const gameHTML = `<!DOCTYPE html>
<html>
<head>
<title>Real RuneScape Arena</title>
<style>
body { margin: 0; background: #000; color: #ff0; font-family: 'Courier New', monospace; }
.game-container { display: flex; height: 100vh; }
.game-world { flex: 1; position: relative; background: #1a1a1a; overflow: hidden; }
.sidebar { width: 300px; background: #0a0a0a; border-left: 2px solid #333; padding: 20px; overflow-y: auto; }
.player { position: absolute; width: 20px; height: 20px; background: #00ff00; border: 1px solid #fff; transition: all 0.2s; }
.npc { position: absolute; width: 20px; height: 20px; background: #ff0000; border: 1px solid #fff; }
.tile { position: absolute; width: 40px; height: 40px; border: 1px solid #222; }
.combat-log { height: 200px; overflow-y: auto; background: #111; padding: 10px; margin: 10px 0; font-size: 12px; }
.stats { background: #111; padding: 10px; margin: 10px 0; }
.inventory { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin: 10px 0; }
.item-slot { width: 40px; height: 40px; background: #222; border: 1px solid #444; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.item-slot:hover { border-color: #ff0; }
.controls { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); padding: 20px; border-radius: 10px; }
.btn { background: #333; color: #ff0; border: 1px solid #666; padding: 10px 20px; margin: 5px; cursor: pointer; }
.btn:hover { background: #444; }
.hp-bar { width: 100%; height: 20px; background: #333; margin: 5px 0; }
.hp-fill { height: 100%; background: linear-gradient(to right, #f00, #0f0); transition: width 0.3s; }
.chat { height: 150px; background: #111; padding: 10px; overflow-y: auto; font-size: 12px; }
.xp-popup { position: absolute; color: #fff; font-weight: bold; animation: xpFloat 2s ease-out; pointer-events: none; }
@keyframes xpFloat { 
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-50px); }
}
.minimap { width: 200px; height: 200px; background: #111; border: 2px solid #333; position: relative; margin: 10px 0; }
.minimap-player { position: absolute; width: 4px; height: 4px; background: #0f0; }
.loot { position: absolute; width: 15px; height: 15px; background: #ff0; border: 1px solid #fff; cursor: pointer; animation: pulse 1s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
</head>
<body>
<div class="game-container">
  <div class="game-world" id="gameWorld">
    <div class="player" id="player" style="left: 400px; top: 300px;"></div>
  </div>
  
  <div class="sidebar">
    <h2>RuneScape Arena</h2>
    
    <div class="stats">
      <div>Level: <span id="level">1</span></div>
      <div class="hp-bar"><div class="hp-fill" id="hpBar" style="width: 100%"></div></div>
      <div>HP: <span id="hp">10/10</span></div>
      <div>Combat XP: <span id="xp">0</span></div>
      <div>Gold: <span id="gold">0</span> gp</div>
    </div>
    
    <h3>Inventory</h3>
    <div class="inventory" id="inventory"></div>
    
    <h3>Combat Log</h3>
    <div class="combat-log" id="combatLog">Welcome to RuneScape Arena!</div>
    
    <h3>Minimap</h3>
    <div class="minimap" id="minimap">
      <div class="minimap-player" id="minimapPlayer"></div>
    </div>
    
    <h3>Chat</h3>
    <div class="chat" id="chat"></div>
  </div>
</div>

<div class="controls">
  <button class="btn" onclick="move('up')">↑</button><br>
  <button class="btn" onclick="move('left')">←</button>
  <button class="btn" onclick="move('down')">↓</button>
  <button class="btn" onclick="move('right')">→</button>
  <button class="btn" onclick="attack()">Attack (Space)</button>
</div>

<script>
let player = {
  x: 400,
  y: 300,
  hp: 10,
  maxHp: 10,
  level: 1,
  xp: 0,
  gold: 0,
  inventory: [],
  attacking: null
};

let npcs = [];
let loots = [];

// Initialize game
fetch('/api/init').then(r => r.json()).then(data => {
  npcs = data.npcs;
  renderNPCs();
  updateUI();
});

function move(dir) {
  const speed = 40;
  const oldX = player.x;
  const oldY = player.y;
  
  switch(dir) {
    case 'up': player.y -= speed; break;
    case 'down': player.y += speed; break;
    case 'left': player.x -= speed; break;
    case 'right': player.x += speed; break;
  }
  
  // Bounds check
  player.x = Math.max(0, Math.min(window.innerWidth - 300 - 20, player.x));
  player.y = Math.max(0, Math.min(window.innerHeight - 20, player.y));
  
  document.getElementById('player').style.left = player.x + 'px';
  document.getElementById('player').style.top = player.y + 'px';
  
  // Update minimap
  updateMinimap();
  
  // Check for nearby NPCs
  checkNearby();
  
  // Pick up loot
  loots.forEach((loot, index) => {
    if (Math.abs(loot.x - player.x) < 20 && Math.abs(loot.y - player.y) < 20) {
      pickupLoot(index);
    }
  });
}

function attack() {
  const nearby = npcs.find(npc => 
    Math.abs(npc.x - player.x) < 60 && 
    Math.abs(npc.y - player.y) < 60 &&
    npc.hp > 0
  );
  
  if (!nearby) {
    addCombatLog('No target in range!');
    return;
  }
  
  // Player attacks
  const damage = Math.floor(Math.random() * 5) + 1;
  nearby.hp -= damage;
  addCombatLog('You hit ' + damage + ' damage!');
  showXP(nearby.x, nearby.y, damage);
  
  if (nearby.hp <= 0) {
    // NPC dies
    addCombatLog(nearby.name + ' defeated! +' + (nearby.level * 10) + ' XP');
    player.xp += nearby.level * 10;
    player.gold += Math.floor(Math.random() * 50) + 10;
    
    // Drop loot
    dropLoot(nearby.x, nearby.y, nearby.drops);
    
    // Remove NPC
    const npcEl = document.getElementById('npc-' + npcs.indexOf(nearby));
    if (npcEl) npcEl.remove();
    
    // Level up check
    checkLevelUp();
  } else {
    // NPC attacks back
    setTimeout(() => {
      const npcDamage = Math.floor(Math.random() * 3) + 1;
      player.hp -= npcDamage;
      addCombatLog(nearby.name + ' hits ' + npcDamage + ' damage!');
      updateUI();
      
      if (player.hp <= 0) {
        addCombatLog('You died! Respawning...');
        player.hp = player.maxHp;
        player.x = 400;
        player.y = 300;
        move('up'); // trigger position update
      }
    }, 500);
  }
  
  updateUI();
}

function dropLoot(x, y, drops) {
  drops.forEach(item => {
    const loot = {
      x: x + Math.random() * 40 - 20,
      y: y + Math.random() * 40 - 20,
      item: item
    };
    loots.push(loot);
    
    const lootEl = document.createElement('div');
    lootEl.className = 'loot';
    lootEl.style.left = loot.x + 'px';
    lootEl.style.top = loot.y + 'px';
    lootEl.title = item;
    document.getElementById('gameWorld').appendChild(lootEl);
  });
}

function pickupLoot(index) {
  const loot = loots[index];
  player.inventory.push(loot.item);
  addCombatLog('Picked up: ' + loot.item);
  
  // Remove loot element
  const lootEls = document.querySelectorAll('.loot');
  if (lootEls[index]) lootEls[index].remove();
  
  loots.splice(index, 1);
  updateInventory();
}

function checkLevelUp() {
  const newLevel = Math.floor(player.xp / 100) + 1;
  if (newLevel > player.level) {
    player.level = newLevel;
    player.maxHp = 10 + (player.level - 1) * 5;
    player.hp = player.maxHp;
    addCombatLog('LEVEL UP! You are now level ' + player.level + '!');
  }
}

function renderNPCs() {
  npcs.forEach((npc, i) => {
    const npcEl = document.createElement('div');
    npcEl.className = 'npc';
    npcEl.id = 'npc-' + i;
    npcEl.style.left = npc.x * 20 + 'px';
    npcEl.style.top = npc.y * 20 + 'px';
    npcEl.title = npc.name + ' (Level ' + npc.level + ')';
    document.getElementById('gameWorld').appendChild(npcEl);
  });
}

function showXP(x, y, amount) {
  const xpEl = document.createElement('div');
  xpEl.className = 'xp-popup';
  xpEl.textContent = '+' + amount;
  xpEl.style.left = x + 'px';
  xpEl.style.top = y + 'px';
  document.getElementById('gameWorld').appendChild(xpEl);
  setTimeout(() => xpEl.remove(), 2000);
}

function addCombatLog(msg) {
  const log = document.getElementById('combatLog');
  log.innerHTML += '<div>' + new Date().toLocaleTimeString() + ' - ' + msg + '</div>';
  log.scrollTop = log.scrollHeight;
}

function updateUI() {
  document.getElementById('level').textContent = player.level;
  document.getElementById('hp').textContent = player.hp + '/' + player.maxHp;
  document.getElementById('hpBar').style.width = (player.hp / player.maxHp * 100) + '%';
  document.getElementById('xp').textContent = player.xp;
  document.getElementById('gold').textContent = player.gold;
}

function updateInventory() {
  const inv = document.getElementById('inventory');
  inv.innerHTML = '';
  for (let i = 0; i < 16; i++) {
    const slot = document.createElement('div');
    slot.className = 'item-slot';
    if (player.inventory[i]) {
      slot.textContent = player.inventory[i].substr(0, 2).toUpperCase();
      slot.title = player.inventory[i];
    }
    inv.appendChild(slot);
  }
}

function updateMinimap() {
  const miniPlayer = document.getElementById('minimapPlayer');
  miniPlayer.style.left = (player.x / 10) + 'px';
  miniPlayer.style.top = (player.y / 10) + 'px';
}

function checkNearby() {
  npcs.forEach(npc => {
    if (Math.abs(npc.x * 20 - player.x) < 100 && Math.abs(npc.y * 20 - player.y) < 100) {
      addCombatLog(npc.name + ' is nearby!');
    }
  });
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case 'ArrowUp': case 'w': move('up'); break;
    case 'ArrowDown': case 's': move('down'); break;
    case 'ArrowLeft': case 'a': move('left'); break;
    case 'ArrowRight': case 'd': move('right'); break;
    case ' ': attack(); e.preventDefault(); break;
  }
});

// Initialize
updateInventory();
updateMinimap();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  if (req.url === '/api/init') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ npcs: gameState.npcs }));
  } else {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(gameHTML);
  }
});

server.listen(PORT, () => {
  console.log(`\n⚔️  REAL RUNESCAPE ARENA - http://localhost:${PORT}\n`);
  console.log('Features:');
  console.log('- Move with arrow keys or WASD');
  console.log('- Attack with spacebar');
  console.log('- Kill NPCs for XP and loot');
  console.log('- Level up system');
  console.log('- Inventory and gold');
  console.log('- Minimap');
  console.log('\nThis is a REAL GAME now!');
});