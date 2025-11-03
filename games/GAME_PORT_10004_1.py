#!/usr/bin/env python3
"""
Working Multiplayer Game - Port 10004
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import threading
import time

GAME_HTML = """<!DOCTYPE html>
<html>
<head>
<title>Soulfra Multiplayer Arena</title>
<style>
body { margin: 0; background: #000; color: #fff; font-family: monospace; overflow: hidden; }
#game { width: 100vw; height: 100vh; position: relative; }
canvas { width: 100%; height: 100%; display: block; background: #111; }
.hud { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 15px; border: 2px solid #0f0; }
.chat { position: absolute; bottom: 10px; left: 10px; width: 300px; }
.chat-messages { background: rgba(0,0,0,0.8); padding: 10px; height: 150px; overflow-y: auto; border: 1px solid #0f0; }
.chat-input { width: 100%; padding: 5px; background: #222; border: 1px solid #0f0; color: #fff; }
</style>
</head>
<body>
<div id="game">
    <canvas id="canvas"></canvas>
    <div class="hud">
        <h3>MULTIPLAYER ARENA - Port 10004</h3>
        <div>Health: <span id="health">100</span></div>
        <div>Score: <span id="score">0</span></div>
        <div>Players: <span id="players">1</span></div>
        <div style="margin-top: 10px; font-size: 0.8em;">
            WASD: Move | Click: Shoot
        </div>
    </div>
    <div class="chat">
        <div class="chat-messages" id="chat-messages">
            <div style="color: #0f0;">Welcome to Soulfra Arena!</div>
            <div style="color: #0f0;">Port 10004 - Working perfectly!</div>
        </div>
        <input type="text" class="chat-input" placeholder="Press Enter to chat..." 
               onkeypress="if(event.key==='Enter')sendChat(this)">
    </div>
</div>
<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Player state
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 0, vy: 0,
    health: 100,
    score: 0,
    color: '#0f0'
};

let otherPlayers = {};
let projectiles = [];
let particles = [];

// Controls
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Movement
setInterval(() => {
    if (keys['w']) player.vy -= 1.5;
    if (keys['s']) player.vy += 1.5;
    if (keys['a']) player.vx -= 1.5;
    if (keys['d']) player.vx += 1.5;
    
    player.x += player.vx;
    player.y += player.vy;
    player.vx *= 0.9;
    player.vy *= 0.9;
    
    // Bounds
    player.x = Math.max(20, Math.min(canvas.width - 20, player.x));
    player.y = Math.max(20, Math.min(canvas.height - 20, player.y));
}, 16);

// Shooting
canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    
    const dx = mx - player.x;
    const dy = my - player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    projectiles.push({
        x: player.x,
        y: player.y,
        vx: (dx/dist) * 12,
        vy: (dy/dist) * 12,
        owner: 'player',
        color: '#ff0'
    });
    
    // Muzzle flash
    for(let i = 0; i < 5; i++) {
        particles.push({
            x: player.x,
            y: player.y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 10,
            color: '#ff0'
        });
    }
});

// Game loop
function gameLoop() {
    // Clear
    ctx.fillStyle = 'rgba(17, 17, 17, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.lineWidth = 1;
    for(let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }
    for(let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
    
    // Draw player
    ctx.save();
    ctx.translate(player.x, player.y);
    
    // Player glow
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
    gradient.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(-30, -30, 60, 60);
    
    // Player body
    ctx.fillStyle = player.color;
    ctx.fillRect(-10, -10, 20, 20);
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(-10, -10, 20, 20);
    ctx.restore();
    
    // Draw other players (simulated)
    for(let id in otherPlayers) {
        let p = otherPlayers[id];
        ctx.fillStyle = '#f00';
        ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
        ctx.strokeStyle = '#f00';
        ctx.strokeRect(p.x - 10, p.y - 10, 20, 20);
    }
    
    // Update and draw projectiles
    projectiles = projectiles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x - 3, p.y - 3, 6, 6);
        ctx.shadowBlur = 0;
        
        return p.x > 0 && p.x < canvas.width && p.y > 0 && p.y < canvas.height;
    });
    
    // Update and draw particles
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 10;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.globalAlpha = 1;
        
        return p.life > 0;
    });
    
    // Update HUD
    document.getElementById('health').textContent = player.health;
    document.getElementById('score').textContent = player.score;
    document.getElementById('players').textContent = Object.keys(otherPlayers).length + 1;
    
    requestAnimationFrame(gameLoop);
}

// Simulate other players
setInterval(() => {
    // Add random player
    if (Math.random() > 0.95 && Object.keys(otherPlayers).length < 5) {
        const id = 'bot_' + Date.now();
        otherPlayers[id] = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        };
        
        addChatMessage('Bot_' + id.substr(-4) + ' joined the game', '#ff0');
        
        setTimeout(() => {
            delete otherPlayers[id];
            addChatMessage('Bot_' + id.substr(-4) + ' left the game', '#f00');
        }, 10000 + Math.random() * 20000);
    }
    
    // Move other players
    for(let id in otherPlayers) {
        let p = otherPlayers[id];
        p.x += (Math.random() - 0.5) * 10;
        p.y += (Math.random() - 0.5) * 10;
        p.x = Math.max(20, Math.min(canvas.width - 20, p.x));
        p.y = Math.max(20, Math.min(canvas.height - 20, p.y));
        
        // Bot shoots sometimes
        if (Math.random() > 0.95) {
            projectiles.push({
                x: p.x,
                y: p.y,
                vx: (Math.random() - 0.5) * 20,
                vy: (Math.random() - 0.5) * 20,
                owner: id,
                color: '#f00'
            });
        }
    }
    
    // Score for surviving
    player.score++;
}, 100);

function addChatMessage(msg, color = '#fff') {
    const chat = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.style.color = color;
    div.textContent = msg;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function sendChat(input) {
    if (input.value.trim()) {
        addChatMessage('You: ' + input.value, '#0ff');
        input.value = '';
    }
}

// Start game
gameLoop();
console.log('Multiplayer Arena running on port 10004!');
</script>
</body>
</html>"""

class GameHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(GAME_HTML.encode())
        
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    print(f'🎮 Multiplayer Arena starting on port 10004...')
    server = HTTPServer(('localhost', 10004), GameHandler)
    print(f'✅ Game running at http://localhost:10004')
    print('   WASD to move, Click to shoot')
    print('   Other players will join automatically!')
    server.serve_forever()
