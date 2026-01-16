#!/usr/bin/env python3
"""
Gladiator Arena - Different from the others
"""
from http.server import HTTPServer, BaseHTTPRequestHandler

HTML = """<!DOCTYPE html>
<html>
<head>
<title>Gladiator Arena</title>
<style>
body { background: #222; color: #fff; font-family: Arial; text-align: center; padding: 20px; }
.arena { width: 800px; height: 600px; margin: 0 auto; background: #333; border: 3px solid gold; position: relative; }
.gladiator { position: absolute; width: 50px; height: 50px; transition: all 0.3s; }
.player { background: #00f; border-radius: 50%; }
.enemy { background: #f00; border-radius: 50%; }
.info { margin: 20px 0; font-size: 1.2em; }
button { padding: 10px 20px; font-size: 1.1em; margin: 10px; cursor: pointer; }
</style>
</head>
<body>
<h1>⚔️ GLADIATOR ARENA ⚔️</h1>
<div class="info">Port 10010 - This is a DIFFERENT game!</div>
<div class="arena" id="arena">
    <div class="gladiator player" id="player" style="left: 375px; top: 275px;"></div>
    <div class="gladiator enemy" id="enemy" style="left: 100px; top: 100px;"></div>
</div>
<div>
    <button onclick="movePlayer('up')">↑ UP</button>
    <button onclick="movePlayer('down')">↓ DOWN</button>
    <button onclick="movePlayer('left')">← LEFT</button>
    <button onclick="movePlayer('right')">→ RIGHT</button>
    <button onclick="attack()">⚔️ ATTACK</button>
</div>
<div class="info" id="status">Click arrows to move, Attack when close!</div>
<script>
let playerPos = { x: 375, y: 275 };
let enemyPos = { x: 100, y: 100 };
let score = 0;

function movePlayer(dir) {
    const step = 50;
    switch(dir) {
        case 'up': playerPos.y = Math.max(0, playerPos.y - step); break;
        case 'down': playerPos.y = Math.min(550, playerPos.y + step); break;
        case 'left': playerPos.x = Math.max(0, playerPos.x - step); break;
        case 'right': playerPos.x = Math.min(750, playerPos.x + step); break;
    }
    updatePositions();
}

function updatePositions() {
    document.getElementById('player').style.left = playerPos.x + 'px';
    document.getElementById('player').style.top = playerPos.y + 'px';
    
    // Move enemy randomly
    enemyPos.x += (Math.random() - 0.5) * 100;
    enemyPos.y += (Math.random() - 0.5) * 100;
    enemyPos.x = Math.max(0, Math.min(750, enemyPos.x));
    enemyPos.y = Math.max(0, Math.min(550, enemyPos.y));
    
    document.getElementById('enemy').style.left = enemyPos.x + 'px';
    document.getElementById('enemy').style.top = enemyPos.y + 'px';
}

function attack() {
    const dist = Math.sqrt(Math.pow(playerPos.x - enemyPos.x, 2) + Math.pow(playerPos.y - enemyPos.y, 2));
    if (dist < 100) {
        score += 10;
        document.getElementById('status').textContent = 'HIT! Score: ' + score;
        // Teleport enemy
        enemyPos.x = Math.random() * 750;
        enemyPos.y = Math.random() * 550;
        updatePositions();
    } else {
        document.getElementById('status').textContent = 'Too far away! Get closer!';
    }
}

// Auto move enemy
setInterval(() => {
    enemyPos.x += (Math.random() - 0.5) * 50;
    enemyPos.y += (Math.random() - 0.5) * 50;
    enemyPos.x = Math.max(0, Math.min(750, enemyPos.x));
    enemyPos.y = Math.max(0, Math.min(550, enemyPos.y));
    document.getElementById('enemy').style.left = enemyPos.x + 'px';
    document.getElementById('enemy').style.top = enemyPos.y + 'px';
}, 1000);
</script>
</body>
</html>"""

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(HTML.encode())
    def log_message(self, format, *args): pass

if __name__ == '__main__':
    server = HTTPServer(('localhost', 10010), Handler)
    print(f'Gladiator Arena on port 10010')
    server.serve_forever()
