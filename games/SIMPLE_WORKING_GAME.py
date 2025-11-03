#!/usr/bin/env python3
import http.server
import socketserver

PORT = 6666

# Simple game that ACTUALLY WORKS - no fancy features that break
HTML = """<!DOCTYPE html>
<html>
<head>
<title>SIMPLE WORKING GAME</title>
<style>
body { margin: 0; background: #000; color: #fff; font-family: Arial; }
canvas { border: 2px solid #0f8; display: block; margin: 20px auto; }
.info { text-align: center; margin: 20px; }
h1 { color: #0f8; }
</style>
</head>
<body>
<div class="info">
<h1>SIMPLE ARENA - ACTUALLY WORKS</h1>
<p>WASD to move, Click to shoot</p>
<p>Score: <span id="score">0</span> | Health: <span id="health">100</span></p>
</div>
<canvas id="game" width="800" height="600"></canvas>
<script>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Game state
let player = { x: 400, y: 300, health: 100 };
let enemies = [];
let bullets = [];
let score = 0;
let keys = {};

// Input
document.addEventListener('keydown', e => keys[e.key] = true);
document.addEventListener('keyup', e => keys[e.key] = false);

canvas.addEventListener('click', e => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const angle = Math.atan2(my - player.y, mx - player.x);
    bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10
    });
});

// Spawn enemies
setInterval(() => {
    enemies.push({
        x: Math.random() * 800,
        y: 0,
        health: 30
    });
}, 2000);

// Game loop
function update() {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 800, 600);
    
    // Move player
    if (keys['w']) player.y -= 5;
    if (keys['s']) player.y += 5;
    if (keys['a']) player.x -= 5;
    if (keys['d']) player.x += 5;
    
    // Keep in bounds
    player.x = Math.max(20, Math.min(780, player.x));
    player.y = Math.max(20, Math.min(580, player.y));
    
    // Draw player
    ctx.fillStyle = '#0f8';
    ctx.fillRect(player.x - 10, player.y - 10, 20, 20);
    
    // Update enemies
    enemies = enemies.filter(e => {
        e.y += 2;
        
        // Draw enemy
        ctx.fillStyle = '#f44';
        ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
        
        // Check collision with player
        if (Math.abs(e.x - player.x) < 20 && Math.abs(e.y - player.y) < 20) {
            player.health -= 10;
            document.getElementById('health').textContent = player.health;
            return false;
        }
        
        return e.y < 600 && e.health > 0;
    });
    
    // Update bullets
    bullets = bullets.filter(b => {
        b.x += b.vx;
        b.y += b.vy;
        
        // Draw bullet
        ctx.fillStyle = '#ff0';
        ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
        
        // Check collision with enemies
        let hit = false;
        enemies.forEach(e => {
            if (Math.abs(e.x - b.x) < 15 && Math.abs(e.y - b.y) < 15) {
                e.health -= 10;
                if (e.health <= 0) {
                    score += 10;
                    document.getElementById('score').textContent = score;
                }
                hit = true;
            }
        });
        
        return !hit && b.x > 0 && b.x < 800 && b.y > 0 && b.y < 600;
    });
    
    if (player.health > 0) {
        requestAnimationFrame(update);
    } else {
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', 400, 300);
    }
}

update();
</script>
</body>
</html>"""

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(HTML.encode())
    
    def log_message(self, format, *args):
        pass

print(f"SIMPLE WORKING GAME running at http://localhost:{PORT}")
print("No complex features = No bugs!")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()