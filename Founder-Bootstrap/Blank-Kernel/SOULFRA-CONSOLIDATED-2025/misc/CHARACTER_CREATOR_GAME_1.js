const http = require('http');
const PORT = 9999;

const gameHTML = `<!DOCTYPE html>
<html>
<head>
<title>Soulfra Character Creator Arena</title>
<style>
body { margin: 0; background: #0a0a0a; color: #fff; font-family: Arial; overflow: hidden; }
.container { display: flex; height: 100vh; }

/* Character Creator */
.creator { width: 400px; background: #1a1a1a; padding: 20px; overflow-y: auto; }
.drop-zone { 
  border: 3px dashed #666; 
  border-radius: 20px; 
  padding: 40px; 
  text-align: center; 
  margin-bottom: 20px;
  transition: all 0.3s;
}
.drop-zone.dragover { 
  border-color: #00ff88; 
  background: rgba(0,255,136,0.1); 
  transform: scale(1.05);
}
.url-input {
  width: 100%;
  padding: 15px;
  background: #2a2a2a;
  border: 2px solid #444;
  color: #fff;
  border-radius: 10px;
  font-size: 16px;
  margin-bottom: 10px;
}
.create-btn {
  width: 100%;
  padding: 15px;
  background: linear-gradient(45deg, #00ff88, #00ccff);
  border: none;
  color: #000;
  font-size: 18px;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
}
.create-btn:hover { transform: scale(1.05); }

/* Game Area */
.game-area { 
  flex: 1; 
  position: relative; 
  background: #0a0a0a;
  background-image: 
    radial-gradient(circle at 20% 50%, rgba(0,255,136,0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(0,204,255,0.1) 0%, transparent 50%);
}
.arena {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 600px;
  background: #111;
  border: 3px solid #333;
  border-radius: 20px;
  overflow: hidden;
}

/* Characters */
.character {
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  transition: all 0.2s;
  cursor: pointer;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}
.character.player {
  border: 3px solid #00ff88;
  box-shadow: 0 0 30px rgba(0,255,136,0.8);
}
.character.enemy {
  border: 3px solid #ff4444;
  box-shadow: 0 0 30px rgba(255,68,68,0.8);
}
.character img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.character-name {
  position: absolute;
  top: -25px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  white-space: nowrap;
}
.health-bar {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 4px;
  background: #333;
  border-radius: 2px;
  overflow: hidden;
}
.health-fill {
  height: 100%;
  background: #00ff88;
  transition: width 0.3s;
}

/* Effects */
.damage-number {
  position: absolute;
  color: #ff4444;
  font-weight: bold;
  font-size: 20px;
  pointer-events: none;
  animation: damageFloat 1s ease-out forwards;
}
@keyframes damageFloat {
  0% { opacity: 1; transform: translateY(0); }
  100% { opacity: 0; transform: translateY(-50px); }
}
.ability-effect {
  position: absolute;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  pointer-events: none;
  animation: abilityPulse 0.5s ease-out forwards;
}
@keyframes abilityPulse {
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

/* Character Preview */
.preview {
  margin: 20px 0;
  padding: 20px;
  background: #2a2a2a;
  border-radius: 10px;
}
.preview-char {
  width: 100px;
  height: 100px;
  margin: 0 auto 10px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 50px;
}
.preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}
.abilities {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}
.ability {
  padding: 10px;
  background: #1a1a1a;
  border-radius: 8px;
  text-align: center;
  font-size: 12px;
}

/* Stats */
.stats {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0,0,0,0.8);
  padding: 20px;
  border-radius: 10px;
  min-width: 200px;
}
.stat-item {
  display: flex;
  justify-content: space-between;
  margin: 10px 0;
}

/* Chat */
.chat {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 300px;
  height: 200px;
  background: rgba(0,0,0,0.8);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
}
.chat-messages {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  font-size: 12px;
}
.chat-input {
  display: flex;
  padding: 10px;
  border-top: 1px solid #333;
}
.chat-input input {
  flex: 1;
  background: #1a1a1a;
  border: none;
  color: #fff;
  padding: 5px 10px;
  border-radius: 5px;
}

/* Controls */
.controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
}
.control-btn {
  padding: 10px 20px;
  background: #2a2a2a;
  border: 2px solid #444;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}
.control-btn:hover {
  background: #3a3a3a;
  border-color: #666;
}
</style>
</head>
<body>

<div class="container">
  <!-- Character Creator Panel -->
  <div class="creator">
    <h2 style="text-align: center; color: #00ff88;">Create Your Fighter</h2>
    
    <div class="drop-zone" id="dropZone">
      <div style="font-size: 60px; margin-bottom: 10px;">🖼️</div>
      <div style="font-size: 18px; margin-bottom: 10px;">Drag & Drop Any Image</div>
      <div style="color: #666;">or click to upload</div>
      <input type="file" id="fileInput" accept="image/*" style="display: none;">
    </div>
    
    <input type="text" class="url-input" id="urlInput" placeholder="Or paste image URL / Twitter link / NFT...">
    <button class="create-btn" onclick="createFromURL()">Create from URL</button>
    
    <div class="preview" id="preview" style="display: none;">
      <h3 style="text-align: center;">Your Character</h3>
      <div class="preview-char" id="previewChar"></div>
      <input type="text" class="url-input" id="nameInput" placeholder="Character name" value="">
      <div class="abilities" id="abilities"></div>
      <button class="create-btn" onclick="enterArena()" style="margin-top: 10px;">Enter Arena!</button>
    </div>
    
    <div style="margin-top: 20px; padding: 20px; background: #1a1a1a; border-radius: 10px;">
      <h4>Quick Characters:</h4>
      <button class="control-btn" onclick="quickChar('🧿')" style="width: 100%; margin: 5px 0;">🧿 Wizard</button>
      <button class="control-btn" onclick="quickChar('🐉')" style="width: 100%; margin: 5px 0;">🐉 Dragon</button>
      <button class="control-btn" onclick="quickChar('🤖')" style="width: 100%; margin: 5px 0;">🤖 Robot</button>
      <button class="control-btn" onclick="quickChar('👾')" style="width: 100%; margin: 5px 0;">👾 Alien</button>
    </div>
  </div>
  
  <!-- Game Area -->
  <div class="game-area">
    <div class="arena" id="arena">
      <!-- Characters spawn here -->
    </div>
    
    <div class="stats">
      <h3 style="margin: 0 0 10px 0; color: #00ff88;">Battle Stats</h3>
      <div class="stat-item">
        <span>Kills:</span>
        <span id="kills">0</span>
      </div>
      <div class="stat-item">
        <span>Deaths:</span>
        <span id="deaths">0</span>
      </div>
      <div class="stat-item">
        <span>Gold:</span>
        <span id="gold">0</span>
      </div>
    </div>
    
    <div class="chat">
      <div class="chat-messages" id="chat">
        <div style="color: #00ff88;">Welcome to Character Arena!</div>
        <div style="color: #666;">Create any character from any image!</div>
      </div>
      <div class="chat-input">
        <input type="text" id="chatInput" placeholder="Type message..." onkeypress="if(event.key==='Enter')sendChat()">
      </div>
    </div>
    
    <div class="controls">
      <button class="control-btn" onclick="move('up')">↑</button>
      <button class="control-btn" onclick="move('left')">←</button>
      <button class="control-btn" onclick="move('down')">↓</button>
      <button class="control-btn" onclick="move('right')">→</button>
      <button class="control-btn" onclick="attack()">Attack (Space)</button>
      <button class="control-btn" onclick="useAbility()">Ability (Q)</button>
    </div>
  </div>
</div>

<script>
let playerChar = null;
let enemies = [];
let gameActive = false;
let characterImage = null;
let abilities = [];

// Drag and drop
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    processImage(file);
  }
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) processImage(file);
});

// Process uploaded image
function processImage(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    characterImage = e.target.result;
    generateCharacter(characterImage);
  };
  reader.readAsDataURL(file);
}

// Generate character from image
function generateCharacter(imageSrc) {
  // Extract dominant colors (simplified)
  const img = new Image();
  img.onload = () => {
    // Generate abilities based on image
    abilities = generateAbilities();
    
    // Show preview
    showPreview(imageSrc);
  };
  img.src = imageSrc;
}

// Generate random abilities
function generateAbilities() {
  const allAbilities = [
    { name: 'Fireball', color: '#ff6b6b', damage: 30 },
    { name: 'Ice Blast', color: '#4ecdc4', damage: 25 },
    { name: 'Lightning', color: '#ffd93d', damage: 35 },
    { name: 'Heal', color: '#6bcf7f', damage: -20 },
    { name: 'Shield', color: '#95a5a6', damage: 0 },
    { name: 'Poison', color: '#8e44ad', damage: 15 }
  ];
  
  // Pick 2 random abilities
  const selected = [];
  for (let i = 0; i < 2; i++) {
    const ability = allAbilities[Math.floor(Math.random() * allAbilities.length)];
    selected.push(ability);
  }
  return selected;
}

// Show character preview
function showPreview(imageSrc) {
  document.getElementById('preview').style.display = 'block';
  const previewChar = document.getElementById('previewChar');
  previewChar.innerHTML = `<img src="${imageSrc}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;
  previewChar.style.border = '3px solid #00ff88';
  
  // Show abilities
  const abilitiesDiv = document.getElementById('abilities');
  abilitiesDiv.innerHTML = abilities.map(a => 
    `<div class="ability" style="border: 2px solid ${a.color};">
      <div>${a.name}</div>
      <div style="color: ${a.color};">DMG: ${a.damage}</div>
    </div>`
  ).join('');
  
  // Generate random name
  document.getElementById('nameInput').value = 'Fighter_' + Math.floor(Math.random() * 9999);
}

// Create from URL
function createFromURL() {
  const url = document.getElementById('urlInput').value;
  if (!url) return;
  
  characterImage = url;
  generateCharacter(url);
}

// Quick character selection
function quickChar(emoji) {
  characterImage = emoji;
  abilities = generateAbilities();
  
  document.getElementById('preview').style.display = 'block';
  const previewChar = document.getElementById('previewChar');
  previewChar.innerHTML = emoji;
  previewChar.style.fontSize = '50px';
  previewChar.style.border = '3px solid #00ff88';
  
  const abilitiesDiv = document.getElementById('abilities');
  abilitiesDiv.innerHTML = abilities.map(a => 
    `<div class="ability" style="border: 2px solid ${a.color};">
      <div>${a.name}</div>
      <div style="color: ${a.color};">DMG: ${a.damage}</div>
    </div>`
  ).join('');
  
  document.getElementById('nameInput').value = emoji + '_Fighter_' + Math.floor(Math.random() * 999);
}

// Enter arena
function enterArena() {
  const name = document.getElementById('nameInput').value || 'Anonymous';
  
  playerChar = {
    id: 'player',
    name: name,
    image: characterImage,
    x: 400,
    y: 300,
    hp: 100,
    maxHp: 100,
    abilities: abilities
  };
  
  gameActive = true;
  document.querySelector('.creator').style.display = 'none';
  
  // Spawn player
  spawnCharacter(playerChar, true);
  
  // Spawn enemies
  spawnEnemies();
  
  addChat('System', `${name} entered the arena!`);
}

// Spawn character in arena
function spawnCharacter(char, isPlayer = false) {
  const charDiv = document.createElement('div');
  charDiv.className = 'character ' + (isPlayer ? 'player' : 'enemy');
  charDiv.id = char.id;
  charDiv.style.left = char.x + 'px';
  charDiv.style.top = char.y + 'px';
  
  if (char.image.startsWith('data:') || char.image.startsWith('http')) {
    charDiv.innerHTML = `
      <div class="character-name">${char.name}</div>
      <img src="${char.image}">
      <div class="health-bar">
        <div class="health-fill" style="width: 100%"></div>
      </div>
    `;
  } else {
    charDiv.innerHTML = `
      <div class="character-name">${char.name}</div>
      <div style="font-size: 30px;">${char.image}</div>
      <div class="health-bar">
        <div class="health-fill" style="width: 100%"></div>
      </div>
    `;
  }
  
  document.getElementById('arena').appendChild(charDiv);
}

// Spawn random enemies
function spawnEnemies() {
  const enemyTypes = ['👺', '👹', '👻', '🤡', '💀'];
  
  for (let i = 0; i < 3; i++) {
    const enemy = {
      id: 'enemy_' + i,
      name: 'Enemy_' + i,
      image: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
      x: Math.random() * 700,
      y: Math.random() * 500,
      hp: 50,
      maxHp: 50
    };
    enemies.push(enemy);
    spawnCharacter(enemy, false);
  }
  
  // Enemy AI
  setInterval(() => {
    enemies.forEach(enemy => {
      if (enemy.hp > 0) {
        enemy.x += (Math.random() - 0.5) * 50;
        enemy.y += (Math.random() - 0.5) * 50;
        enemy.x = Math.max(0, Math.min(740, enemy.x));
        enemy.y = Math.max(0, Math.min(540, enemy.y));
        
        const enemyEl = document.getElementById(enemy.id);
        if (enemyEl) {
          enemyEl.style.left = enemy.x + 'px';
          enemyEl.style.top = enemy.y + 'px';
        }
      }
    });
  }, 1000);
}

// Movement
function move(dir) {
  if (!gameActive || !playerChar) return;
  
  const speed = 50;
  switch(dir) {
    case 'up': playerChar.y = Math.max(0, playerChar.y - speed); break;
    case 'down': playerChar.y = Math.min(540, playerChar.y + speed); break;
    case 'left': playerChar.x = Math.max(0, playerChar.x - speed); break;
    case 'right': playerChar.x = Math.min(740, playerChar.x + speed); break;
  }
  
  const playerEl = document.getElementById('player');
  playerEl.style.left = playerChar.x + 'px';
  playerEl.style.top = playerChar.y + 'px';
}

// Attack
function attack() {
  if (!gameActive) return;
  
  // Find nearby enemy
  const target = enemies.find(e => 
    e.hp > 0 &&
    Math.abs(e.x - playerChar.x) < 100 &&
    Math.abs(e.y - playerChar.y) < 100
  );
  
  if (target) {
    const damage = 20;
    target.hp -= damage;
    
    // Show damage
    showDamage(target.x, target.y, damage);
    
    // Update health bar
    const healthBar = document.querySelector(`#${target.id} .health-fill`);
    if (healthBar) {
      healthBar.style.width = Math.max(0, (target.hp / target.maxHp) * 100) + '%';
    }
    
    if (target.hp <= 0) {
      document.getElementById(target.id).remove();
      document.getElementById('kills').textContent = parseInt(document.getElementById('kills').textContent) + 1;
      document.getElementById('gold').textContent = parseInt(document.getElementById('gold').textContent) + 50;
      addChat('System', `${playerChar.name} defeated ${target.name}!`);
    }
  }
}

// Use ability
function useAbility() {
  if (!gameActive || abilities.length === 0) return;
  
  const ability = abilities[0];
  
  // Show effect
  const effect = document.createElement('div');
  effect.className = 'ability-effect';
  effect.style.background = ability.color;
  effect.style.left = playerChar.x + 'px';
  effect.style.top = playerChar.y + 'px';
  document.getElementById('arena').appendChild(effect);
  setTimeout(() => effect.remove(), 500);
  
  // Damage all nearby enemies
  enemies.forEach(enemy => {
    if (enemy.hp > 0 && 
        Math.abs(enemy.x - playerChar.x) < 150 &&
        Math.abs(enemy.y - playerChar.y) < 150) {
      enemy.hp -= ability.damage;
      showDamage(enemy.x, enemy.y, ability.damage);
      
      const healthBar = document.querySelector(`#${enemy.id} .health-fill`);
      if (healthBar) {
        healthBar.style.width = Math.max(0, (enemy.hp / enemy.maxHp) * 100) + '%';
      }
      
      if (enemy.hp <= 0) {
        document.getElementById(enemy.id).remove();
        document.getElementById('kills').textContent = parseInt(document.getElementById('kills').textContent) + 1;
        document.getElementById('gold').textContent = parseInt(document.getElementById('gold').textContent) + 50;
      }
    }
  });
  
  addChat(playerChar.name, `Used ${ability.name}!`);
}

// Show damage numbers
function showDamage(x, y, damage) {
  const dmg = document.createElement('div');
  dmg.className = 'damage-number';
  dmg.textContent = '-' + damage;
  dmg.style.left = x + 'px';
  dmg.style.top = y + 'px';
  document.getElementById('arena').appendChild(dmg);
  setTimeout(() => dmg.remove(), 1000);
}

// Chat
function addChat(name, message) {
  const chat = document.getElementById('chat');
  chat.innerHTML += `<div><strong style="color: #00ff88;">${name}:</strong> ${message}</div>`;
  chat.scrollTop = chat.scrollHeight;
}

function sendChat() {
  const input = document.getElementById('chatInput');
  if (input.value && playerChar) {
    addChat(playerChar.name, input.value);
    input.value = '';
  }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!gameActive) return;
  
  switch(e.key) {
    case 'ArrowUp': case 'w': move('up'); break;
    case 'ArrowDown': case 's': move('down'); break;
    case 'ArrowLeft': case 'a': move('left'); break;
    case 'ArrowRight': case 'd': move('right'); break;
    case ' ': attack(); e.preventDefault(); break;
    case 'q': useAbility(); break;
  }
});

// Initial message
addChat('System', 'Drag ANY image to create your character!');
addChat('System', 'Or paste a URL, Twitter pic, NFT, anything!');
</script>

</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(gameHTML);
});

server.listen(PORT, () => {
  console.log(`\n🎮 CHARACTER CREATOR ARENA - http://localhost:${PORT}\n`);
  console.log('Features:');
  console.log('- Drag & drop ANY image to become that character');
  console.log('- Paste URLs, Twitter pics, NFTs');
  console.log('- Auto-generated abilities based on image');
  console.log('- Real combat mechanics');
  console.log('- Multiplayer ready (just add Socket.io)');
  console.log('\nThis is the future of gaming!');
});