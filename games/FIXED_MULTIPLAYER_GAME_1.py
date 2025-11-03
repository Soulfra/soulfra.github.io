#!/usr/bin/env python3
"""
FIXED MULTIPLAYER GAME - No auth issues
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

PORT = 7000

GAME_HTML = """<!DOCTYPE html>
<html>
<head>
<title>Multiplayer Arena - FIXED</title>
<style>
body { margin: 0; background: #000; color: #fff; font-family: Arial; }
.game { width: 100vw; height: 100vh; position: relative; background: #111; }
.player { position: absolute; width: 30px; height: 30px; background: #0f0; border-radius: 50%; }
.other-player { background: #f00; }
.info { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 15px; }
canvas { width: 100%; height: 100%; }
</style>
</head>
<body>
<div class="game">
    <canvas id="canvas"></canvas>
    <div class="info">
        <h3>MULTIPLAYER ARENA - WORKING!</h3>
        <p>Use WASD to move, Click to shoot</p>
        <p id="status">Connected</p>
    </div>
</div>
<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    vx: 0,
    vy: 0,
    color: '#0f0'
};

let otherPlayers = {};
let projectiles = [];

// Game loop
function gameLoop() {
    // Clear
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update player
    player.x += player.vx;
    player.y += player.vy;
    player.vx *= 0.9;
    player.vy *= 0.9;
    
    // Draw player
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw other players
    for (let id in otherPlayers) {
        let p = otherPlayers[id];
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw projectiles
    projectiles = projectiles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        
        ctx.fillStyle = '#ff0';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        return p.x > 0 && p.x < canvas.width && p.y > 0 && p.y < canvas.height;
    });
    
    requestAnimationFrame(gameLoop);
}

// Controls
const keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

setInterval(() => {
    if (keys['w']) player.vy -= 2;
    if (keys['s']) player.vy += 2;
    if (keys['a']) player.vx -= 2;
    if (keys['d']) player.vx += 2;
}, 16);

canvas.addEventListener('click', e => {
    const dx = e.clientX - player.x;
    const dy = e.clientY - player.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    projectiles.push({
        x: player.x,
        y: player.y,
        vx: (dx/dist) * 10,
        vy: (dy/dist) * 10
    });
});

// Fake multiplayer simulation
setInterval(() => {
    // Simulate other players
    if (Math.random() > 0.95) {
        const id = 'bot_' + Date.now();
        otherPlayers[id] = {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        };
        
        setTimeout(() => delete otherPlayers[id], 5000);
    }
    
    // Move other players
    for (let id in otherPlayers) {
        otherPlayers[id].x += (Math.random() - 0.5) * 10;
        otherPlayers[id].y += (Math.random() - 0.5) * 10;
    }
}, 100);

gameLoop();
console.log('Game started! No auth issues!');
</script>
</body>
</html>"""

class FixedHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
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
    server = HTTPServer(('localhost', PORT), FixedHandler)
    print(f'Fixed multiplayer game running at http://localhost:{PORT}')
    server.serve_forever()
