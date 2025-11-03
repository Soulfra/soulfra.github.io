#!/usr/bin/env python3
import http.server
import socketserver

PORT = 6969

# Character game that actually works - no broken image processing
HTML = """<!DOCTYPE html>
<html>
<head>
<title>CHARACTER SELECTOR THAT WORKS</title>
<style>
body { margin: 0; background: #000; color: #fff; font-family: Arial; text-align: center; }
.container { max-width: 1000px; margin: 0 auto; padding: 20px; }
h1 { color: #0f8; }
.characters { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 40px 0; }
.char { background: #111; border: 2px solid #333; padding: 20px; cursor: pointer; }
.char:hover { border-color: #0f8; }
.char.selected { border-color: #0f8; background: #1a1a1a; }
.icon { font-size: 64px; margin: 10px 0; }
.stats { font-size: 12px; color: #888; }
button { background: #0f8; color: #000; border: none; padding: 15px 30px; font-size: 18px; cursor: pointer; margin: 20px; }
button:disabled { opacity: 0.5; }
#game { display: none; }
canvas { border: 2px solid #0f8; }
</style>
</head>
<body>

<div id="select" class="container">
<h1>SELECT YOUR CHARACTER</h1>
<div class="characters">
<div class="char" onclick="selectChar('warrior', this)">
<div class="icon">W</div>
<div>WARRIOR</div>
<div class="stats">Health: 150 | Attack: 80</div>
</div>
<div class="char" onclick="selectChar('mage', this)">
<div class="icon">M</div>
<div>MAGE</div>
<div class="stats">Health: 80 | Attack: 120</div>
</div>
<div class="char" onclick="selectChar('rogue', this)">
<div class="icon">R</div>
<div>ROGUE</div>
<div class="stats">Health: 100 | Attack: 100</div>
</div>
<div class="char" onclick="selectChar('tank', this)">
<div class="icon">T</div>
<div>TANK</div>
<div class="stats">Health: 200 | Attack: 60</div>
</div>
</div>
<button id="start" onclick="startGame()" disabled>SELECT A CHARACTER</button>
</div>

<div id="game" class="container">
<h1>GAME TIME!</h1>
<p>Character: <span id="char-name">-</span> | Health: <span id="health">100</span> | Score: <span id="score">0</span></p>
<canvas id="canvas" width="800" height="600"></canvas>
<p>WASD to move, Click to shoot</p>
</div>

<script>
let selectedChar = null;
let player = null;
let enemies = [];
let bullets = [];
let score = 0;
let keys = {};

const charStats = {
    warrior: { health: 150, attack: 80, color: '#f66' },
    mage: { health: 80, attack: 120, color: '#66f' },
    rogue: { health: 100, attack: 100, color: '#6f6' },
    tank: { health: 200, attack: 60, color: '#ff6' }
};

function selectChar(type, el) {
    document.querySelectorAll('.char').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    selectedChar = type;
    document.getElementById('start').textContent = 'START AS ' + type.toUpperCase();
    document.getElementById('start').disabled = false;
}

function startGame() {
    if (!selectedChar) return;
    
    document.getElementById('select').style.display = 'none';
    document.getElementById('game').style.display = 'block';
    
    const stats = charStats[selectedChar];
    player = {
        x: 400,
        y: 300,
        health: stats.health,
        maxHealth: stats.health,
        attack: stats.attack,
        color: stats.color
    };
    
    document.getElementById('char-name').textContent = selectedChar.toUpperCase();
    document.getElementById('health').textContent = player.health;
    
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    
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
            vy: Math.sin(angle) * 10,
            damage: player.attack
        });
    });
    
    // Spawn enemies
    setInterval(() => {
        enemies.push({
            x: Math.random() * 800,
            y: 0,
            health: 50
        });
    }, 2000);
    
    // Game loop
    function update() {
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 800, 600);
        
        // Grid
        ctx.strokeStyle = '#111';
        for (let x = 0; x < 800; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 600);
            ctx.stroke();
        }
        for (let y = 0; y < 600; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(800, y);
            ctx.stroke();
        }
        
        // Move player
        if (keys['w']) player.y -= 5;
        if (keys['s']) player.y += 5;
        if (keys['a']) player.x -= 5;
        if (keys['d']) player.x += 5;
        
        player.x = Math.max(20, Math.min(780, player.x));
        player.y = Math.max(20, Math.min(580, player.y));
        
        // Draw player
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x - 15, player.y - 15, 30, 30);
        
        // Health bar
        ctx.fillStyle = '#333';
        ctx.fillRect(player.x - 20, player.y - 25, 40, 5);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(player.x - 20, player.y - 25, 40 * (player.health / player.maxHealth), 5);
        
        // Update enemies
        enemies = enemies.filter(e => {
            e.y += 2;
            
            ctx.fillStyle = '#f44';
            ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
            
            if (Math.abs(e.x - player.x) < 25 && Math.abs(e.y - player.y) < 25) {
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
            
            ctx.fillStyle = '#ff0';
            ctx.fillRect(b.x - 3, b.y - 3, 6, 6);
            
            let hit = false;
            enemies.forEach(e => {
                if (Math.abs(e.x - b.x) < 15 && Math.abs(e.y - b.y) < 15) {
                    e.health -= b.damage;
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
            ctx.font = '24px Arial';
            ctx.fillText('Score: ' + score, 400, 350);
        }
    }
    
    update();
}
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

print(f"CHARACTER SELECTOR running at http://localhost:{PORT}")
print("Simple character selection that ACTUALLY WORKS!")

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()