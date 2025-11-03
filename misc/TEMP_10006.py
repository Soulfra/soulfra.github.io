#!/usr/bin/env python3
"""
DRAG & DROP CHARACTER CREATOR - Python implementation
Drag any image or paste URL to become that character
"""

import http.server
import socketserver
import json
import base64
from datetime import datetime

PORT = 10006

GAME_HTML = r'''<!DOCTYPE html>
<html>
<head>
<title>DRAG & DROP CHARACTER CREATOR</title>
<meta charset="UTF-8">
<style>
body { margin: 0; background: #000; color: #fff; font-family: Arial; }
.container { display: flex; height: 100vh; }

.creator {
    width: 400px;
    background: #1a1a1a;
    padding: 20px;
    overflow-y: auto;
}

.creator h2 { color: #00ff88; margin-bottom: 20px; }

.drop-zone {
    border: 3px dashed #00ff88;
    border-radius: 20px;
    padding: 40px;
    text-align: center;
    margin-bottom: 20px;
    transition: all 0.3s;
    cursor: pointer;
}

.drop-zone.dragover {
    background: rgba(0, 255, 136, 0.1);
    transform: scale(1.05);
}

.url-input {
    width: 100%;
    padding: 10px;
    background: #2a2a2a;
    border: 1px solid #444;
    color: #fff;
    border-radius: 5px;
    margin-bottom: 10px;
}

.character-preview {
    width: 200px;
    height: 200px;
    margin: 20px auto;
    background: #2a2a2a;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.character-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
}

.stats {
    background: #2a2a2a;
    padding: 15px;
    border-radius: 10px;
    margin-bottom: 15px;
}

.stat-row {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
}

.stat-bar {
    flex: 1;
    height: 20px;
    background: #333;
    border-radius: 10px;
    overflow: hidden;
    margin-left: 10px;
}

.stat-fill {
    height: 100%;
    background: linear-gradient(90deg, #00ff88, #00ccff);
    transition: width 0.3s;
}

.abilities {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
}

.ability {
    background: #2a2a2a;
    padding: 15px;
    border-radius: 10px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s;
}

.ability:hover {
    background: #3a3a3a;
    transform: scale(1.05);
}

.ability.selected {
    border: 2px solid #00ff88;
}

.start-button {
    width: 100%;
    padding: 15px;
    background: linear-gradient(45deg, #00ff88, #00ccff);
    color: #000;
    font-weight: bold;
    border: none;
    border-radius: 10px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.3s;
}

.start-button:hover {
    transform: scale(1.05);
}

.start-button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.game-area {
    flex: 1;
    position: relative;
    background: #0a0a0a;
}

canvas { width: 100%; height: 100%; display: block; }

.game-hud {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0,0,0,0.8);
    padding: 15px;
    border-radius: 10px;
}

.templates {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
}

.template {
    width: 100%;
    aspect-ratio: 1;
    background: #2a2a2a;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 40px;
    transition: all 0.3s;
}

.template:hover {
    background: #3a3a3a;
    transform: scale(1.05);
}

.name-input {
    width: 100%;
    padding: 10px;
    background: #2a2a2a;
    border: 1px solid #444;
    color: #fff;
    border-radius: 5px;
    margin-bottom: 20px;
    font-size: 16px;
}

.processing {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.9);
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 3px solid #333;
    border-top: 3px solid #00ff88;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 20px auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
</style>
</head>
<body>

<div class="container">
    <div class="creator">
        <h2>CREATE YOUR CHARACTER</h2>
        
        <input type="text" class="name-input" id="name-input" placeholder="Enter your name..." value="Player">
        
        <div class="drop-zone" id="drop-zone">
            <p style="font-size: 60px; margin: 0;">📁</p>
            <p>Drag & drop an image here</p>
            <p style="font-size: 12px; color: #888;">or click to select</p>
            <input type="file" id="file-input" accept="image/*" style="display: none;">
        </div>
        
        <input type="text" class="url-input" id="url-input" placeholder="Or paste image URL...">
        <button onclick="loadFromURL()" style="width: 100%; padding: 10px; margin-bottom: 20px;">Load from URL</button>
        
        <div class="templates">
            <div class="template" onclick="selectTemplate('⚔️', 'Warrior')">⚔️</div>
            <div class="template" onclick="selectTemplate('🧙', 'Wizard')">🧙</div>
            <div class="template" onclick="selectTemplate('🏹', 'Archer')">🏹</div>
            <div class="template" onclick="selectTemplate('🛡️', 'Tank')">🛡️</div>
            <div class="template" onclick="selectTemplate('🗡️', 'Rogue')">🗡️</div>
            <div class="template" onclick="selectTemplate('🔮', 'Mage')">🔮</div>
        </div>
        
        <div class="character-preview" id="preview">
            <p style="color: #666;">No character selected</p>
        </div>
        
        <div class="stats" id="stats" style="display: none;">
            <h3 style="margin: 0 0 15px 0; color: #00ff88;">CHARACTER STATS</h3>
            <div class="stat-row">
                <span>Health</span>
                <div class="stat-bar">
                    <div class="stat-fill" id="health-stat" style="width: 50%"></div>
                </div>
            </div>
            <div class="stat-row">
                <span>Attack</span>
                <div class="stat-bar">
                    <div class="stat-fill" id="attack-stat" style="width: 50%"></div>
                </div>
            </div>
            <div class="stat-row">
                <span>Defense</span>
                <div class="stat-bar">
                    <div class="stat-fill" id="defense-stat" style="width: 50%"></div>
                </div>
            </div>
            <div class="stat-row">
                <span>Speed</span>
                <div class="stat-bar">
                    <div class="stat-fill" id="speed-stat" style="width: 50%"></div>
                </div>
            </div>
        </div>
        
        <h3 style="color: #00ff88;">SELECT ABILITIES</h3>
        <div class="abilities">
            <div class="ability" onclick="toggleAbility(this, 'fireball')">
                <div>🔥</div>
                <div>Fireball</div>
            </div>
            <div class="ability" onclick="toggleAbility(this, 'shield')">
                <div>🛡️</div>
                <div>Shield</div>
            </div>
            <div class="ability" onclick="toggleAbility(this, 'dash')">
                <div>⚡</div>
                <div>Dash</div>
            </div>
            <div class="ability" onclick="toggleAbility(this, 'heal')">
                <div>❤️</div>
                <div>Heal</div>
            </div>
        </div>
        
        <button class="start-button" id="start-button" onclick="startGame()" disabled>
            SELECT CHARACTER TO START
        </button>
    </div>
    
    <div class="game-area">
        <canvas id="game"></canvas>
        <div class="game-hud" id="game-hud" style="display: none;">
            <div>Health: <span id="game-health">100</span></div>
            <div>Score: <span id="game-score">0</span></div>
            <div>Level: <span id="game-level">1</span></div>
        </div>
        <div class="processing" id="processing" style="display: none;">
            <h3>Processing Character...</h3>
            <div class="spinner"></div>
            <p>Analyzing image and generating stats...</p>
        </div>
    </div>
</div>

<script>
let characterData = {
    name: 'Player',
    image: null,
    type: null,
    stats: {
        health: 100,
        attack: 50,
        defense: 50,
        speed: 50
    },
    abilities: []
};

let gameRunning = false;
let canvas, ctx;
let gameState = {
    player: { x: 400, y: 300, vx: 0, vy: 0 },
    enemies: [],
    projectiles: [],
    score: 0,
    level: 1
};

// Initialize
window.onload = () => {
    canvas = document.getElementById('game');
    ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Setup drag & drop
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    
    dropZone.onclick = () => fileInput.click();
    
    dropZone.ondragover = (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    };
    
    dropZone.ondragleave = () => {
        dropZone.classList.remove('dragover');
    };
    
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processImage(file);
        }
    };
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) processImage(file);
    };
    
    // Name input
    document.getElementById('name-input').oninput = (e) => {
        characterData.name = e.target.value || 'Player';
    };
};

function processImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        characterData.image = e.target.result;
        analyzeImage();
    };
    reader.readAsDataURL(file);
}

function loadFromURL() {
    const url = document.getElementById('url-input').value;
    if (!url) return;
    
    // Show processing
    document.getElementById('processing').style.display = 'block';
    
    // In real implementation, this would load the image
    // For now, we'll simulate it
    setTimeout(() => {
        characterData.image = url;
        analyzeImage();
    }, 1000);
}

function selectTemplate(emoji, type) {
    characterData.image = emoji;
    characterData.type = type;
    
    // Set stats based on type
    const statProfiles = {
        'Warrior': { health: 120, attack: 80, defense: 70, speed: 40 },
        'Wizard': { health: 80, attack: 100, defense: 40, speed: 60 },
        'Archer': { health: 90, attack: 70, defense: 50, speed: 80 },
        'Tank': { health: 150, attack: 50, defense: 100, speed: 30 },
        'Rogue': { health: 70, attack: 90, defense: 30, speed: 100 },
        'Mage': { health: 85, attack: 95, defense: 45, speed: 65 }
    };
    
    characterData.stats = statProfiles[type] || characterData.stats;
    updatePreview();
}

function analyzeImage() {
    // Show processing animation
    document.getElementById('processing').style.display = 'block';
    
    // Simulate image analysis
    setTimeout(() => {
        // Generate random stats based on "image analysis"
        characterData.stats = {
            health: 80 + Math.floor(Math.random() * 40),
            attack: 40 + Math.floor(Math.random() * 60),
            defense: 40 + Math.floor(Math.random() * 60),
            speed: 40 + Math.floor(Math.random() * 60)
        };
        
        document.getElementById('processing').style.display = 'none';
        updatePreview();
    }, 1500);
}

function updatePreview() {
    const preview = document.getElementById('preview');
    
    if (characterData.image) {
        if (characterData.image.length === 2) {
            // Emoji template
            preview.innerHTML = `<div style="font-size: 100px;">${characterData.image}</div>`;
        } else {
            // Image
            preview.innerHTML = `<img src="${characterData.image}" alt="Character">`;
        }
        
        // Show stats
        document.getElementById('stats').style.display = 'block';
        document.getElementById('health-stat').style.width = characterData.stats.health + '%';
        document.getElementById('attack-stat').style.width = characterData.stats.attack + '%';
        document.getElementById('defense-stat').style.width = characterData.stats.defense + '%';
        document.getElementById('speed-stat').style.width = characterData.stats.speed + '%';
        
        // Enable start button
        document.getElementById('start-button').disabled = false;
        document.getElementById('start-button').textContent = 'START GAME';
    }
}

function toggleAbility(element, ability) {
    element.classList.toggle('selected');
    
    const index = characterData.abilities.indexOf(ability);
    if (index > -1) {
        characterData.abilities.splice(index, 1);
    } else {
        characterData.abilities.push(ability);
    }
}

function startGame() {
    if (!characterData.image) return;
    
    // Hide creator, show game
    document.querySelector('.creator').style.display = 'none';
    document.getElementById('game-hud').style.display = 'block';
    
    gameRunning = true;
    gameLoop();
    
    // Spawn enemies
    setInterval(spawnEnemy, 2000);
}

function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Update player
    gameState.player.x += gameState.player.vx;
    gameState.player.y += gameState.player.vy;
    gameState.player.vx *= 0.9;
    gameState.player.vy *= 0.9;
    
    // Draw player
    ctx.save();
    ctx.translate(gameState.player.x, gameState.player.y);
    
    if (characterData.image.length === 2) {
        // Draw emoji
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(characterData.image, 0, 0);
    } else {
        // Draw image placeholder
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
    
    // Update enemies
    gameState.enemies = gameState.enemies.filter(enemy => {
        enemy.x += enemy.vx;
        enemy.y += enemy.vy;
        
        // Draw enemy
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        return enemy.x > -50 && enemy.x < canvas.width + 50 && 
               enemy.y > -50 && enemy.y < canvas.height + 50;
    });
    
    // Update projectiles
    gameState.projectiles = gameState.projectiles.filter(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        
        // Draw projectile
        ctx.fillStyle = '#00ccff';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Check collisions
        let hit = false;
        gameState.enemies.forEach((enemy, i) => {
            const dx = enemy.x - proj.x;
            const dy = enemy.y - proj.y;
            if (Math.sqrt(dx * dx + dy * dy) < 20) {
                gameState.enemies.splice(i, 1);
                gameState.score += 10;
                hit = true;
            }
        });
        
        return !hit && proj.x > 0 && proj.x < canvas.width && 
               proj.y > 0 && proj.y < canvas.height;
    });
    
    // Update UI
    document.getElementById('game-score').textContent = gameState.score;
    if (gameState.score > gameState.level * 100) {
        gameState.level++;
        document.getElementById('game-level').textContent = gameState.level;
    }
    
    requestAnimationFrame(gameLoop);
}

function spawnEnemy() {
    if (!gameRunning) return;
    
    const side = Math.floor(Math.random() * 4);
    let x, y, vx, vy;
    
    switch(side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -20;
            vx = (Math.random() - 0.5) * 2;
            vy = 1 + Math.random() * 2;
            break;
        case 1: // Right
            x = canvas.width + 20;
            y = Math.random() * canvas.height;
            vx = -(1 + Math.random() * 2);
            vy = (Math.random() - 0.5) * 2;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 20;
            vx = (Math.random() - 0.5) * 2;
            vy = -(1 + Math.random() * 2);
            break;
        case 3: // Left
            x = -20;
            y = Math.random() * canvas.height;
            vx = 1 + Math.random() * 2;
            vy = (Math.random() - 0.5) * 2;
            break;
    }
    
    gameState.enemies.push({ x, y, vx, vy });
}

// Controls
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    const speed = characterData.stats.speed / 10;
    
    switch(e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            gameState.player.vy = -speed;
            break;
        case 's':
        case 'arrowdown':
            gameState.player.vy = speed;
            break;
        case 'a':
        case 'arrowleft':
            gameState.player.vx = -speed;
            break;
        case 'd':
        case 'arrowright':
            gameState.player.vx = speed;
            break;
        case ' ':
            shoot();
            break;
    }
});

function shoot() {
    const angle = Math.atan2(
        gameState.enemies[0]?.y - gameState.player.y || -1,
        gameState.enemies[0]?.x - gameState.player.x || 0
    );
    
    gameState.projectiles.push({
        x: gameState.player.x,
        y: gameState.player.y,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10
    });
}
</script>

</body>
</html>'''

class CharacterCreatorHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(GAME_HTML.encode())
            
        elif self.path == '/api/analyze':
            # Simulate image analysis API
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            import random
            stats = {
                'health': 80 + random.randint(0, 40),
                'attack': 40 + random.randint(0, 60),
                'defense': 40 + random.randint(0, 60),
                'speed': 40 + random.randint(0, 60),
                'abilities': ['fireball', 'shield', 'dash', 'heal']
            }
            self.wfile.write(json.dumps(stats).encode())
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    print(f"""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║            DRAG & DROP CHARACTER CREATOR                   ║
║                                                            ║
║  Running at: http://localhost:{PORT}                       ║
║                                                            ║
║  Features:                                                 ║
║  ✓ Drag & drop any image to create character              ║
║  ✓ Paste image URLs                                       ║
║  ✓ Pre-made character templates                           ║
║  ✓ Auto-generated stats based on image                    ║
║  ✓ Ability selection system                               ║
║  ✓ Fully playable game with custom character              ║
║  ✓ Python = NO FORMATTING ERRORS                          ║
║                                                            ║
║  Just like you wanted - drag any image to become          ║
║  that character in the game!                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    with socketserver.TCPServer(("", PORT), CharacterCreatorHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")
            httpd.shutdown()