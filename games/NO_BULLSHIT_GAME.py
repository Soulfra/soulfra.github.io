#!/usr/bin/env python3
"""
NO BULLSHIT GAME - ACTUALLY WORKS
No formatting errors possible with Python
"""

import http.server
import socketserver
import json
import os
from datetime import datetime

PORT = 5555

# Game HTML stored as raw string - NO FORMATTING ISSUES
GAME_HTML = r'''<!DOCTYPE html>
<html>
<head>
<title>NO BULLSHIT ARENA</title>
<meta charset="UTF-8">
<style>
body { margin: 0; background: #000; color: #fff; font-family: Arial; overflow: hidden; }
canvas { display: block; border: 2px solid #00ff88; }
.hud { position: absolute; top: 10px; left: 10px; }
.stat { margin: 5px 0; }
.controls { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 10px; }
</style>
</head>
<body>
<canvas id="game"></canvas>
<div class="hud">
    <div class="stat">Health: <span id="health">100</span></div>
    <div class="stat">Score: <span id="score">0</span></div>
    <div class="stat">Level: <span id="level">1</span></div>
</div>
<div class="controls">
    <div>WASD/Arrows = Move</div>
    <div>Click = Shoot</div>
    <div>Space = Special</div>
</div>
<script>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game state
const game = {
    player: {
        x: canvas.width / 2,
        y: canvas.height / 2,
        size: 20,
        speed: 5,
        health: 100,
        color: '#00ff88'
    },
    enemies: [],
    bullets: [],
    particles: [],
    score: 0,
    level: 1,
    keys: {}
};

// Player movement
document.addEventListener('keydown', e => game.keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => game.keys[e.key.toLowerCase()] = false);

// Shooting
canvas.addEventListener('click', e => {
    const angle = Math.atan2(e.clientY - game.player.y, e.clientX - game.player.x);
    game.bullets.push({
        x: game.player.x,
        y: game.player.y,
        vx: Math.cos(angle) * 10,
        vy: Math.sin(angle) * 10,
        size: 5
    });
});

// Spawn enemies
setInterval(() => {
    if (game.enemies.length < 10) {
        game.enemies.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 15,
            speed: 1 + Math.random() * 2,
            health: 30,
            color: '#ff4444'
        });
    }
}, 2000);

// Game loop
function gameLoop() {
    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update player
    if (game.keys['w'] || game.keys['arrowup']) game.player.y -= game.player.speed;
    if (game.keys['s'] || game.keys['arrowdown']) game.player.y += game.player.speed;
    if (game.keys['a'] || game.keys['arrowleft']) game.player.x -= game.player.speed;
    if (game.keys['d'] || game.keys['arrowright']) game.player.x += game.player.speed;
    
    // Keep player in bounds
    game.player.x = Math.max(game.player.size, Math.min(canvas.width - game.player.size, game.player.x));
    game.player.y = Math.max(game.player.size, Math.min(canvas.height - game.player.size, game.player.y));
    
    // Draw player
    ctx.fillStyle = game.player.color;
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y, game.player.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Update and draw enemies
    game.enemies = game.enemies.filter(enemy => {
        // Move towards player
        const dx = game.player.x - enemy.x;
        const dy = game.player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > enemy.size + game.player.size) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        } else {
            // Damage player
            game.player.health -= 0.5;
            document.getElementById('health').textContent = Math.floor(game.player.health);
        }
        
        // Draw enemy
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2);
        ctx.fill();
        
        return enemy.health > 0;
    });
    
    // Update and draw bullets
    game.bullets = game.bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;
        
        // Check collision with enemies
        let hit = false;
        game.enemies.forEach(enemy => {
            const dx = enemy.x - bullet.x;
            const dy = enemy.y - bullet.y;
            if (Math.sqrt(dx * dx + dy * dy) < enemy.size + bullet.size) {
                enemy.health -= 10;
                if (enemy.health <= 0) {
                    game.score += 10;
                    document.getElementById('score').textContent = game.score;
                    createParticles(enemy.x, enemy.y);
                }
                hit = true;
            }
        });
        
        // Draw bullet
        ctx.fillStyle = '#00ccff';
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
        ctx.fill();
        
        return !hit && bullet.x > 0 && bullet.x < canvas.width && bullet.y > 0 && bullet.y < canvas.height;
    });
    
    // Update and draw particles
    game.particles = game.particles.filter(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life--;
        
        ctx.fillStyle = 'rgba(255, 215, 0, ' + (particle.life / 20) + ')';
        ctx.fillRect(particle.x, particle.y, 3, 3);
        
        return particle.life > 0;
    });
    
    // Check game over
    if (game.player.health <= 0) {
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText('Score: ' + game.score, canvas.width / 2, canvas.height / 2 + 50);
        return;
    }
    
    // Level up
    if (game.score > game.level * 100) {
        game.level++;
        document.getElementById('level').textContent = game.level;
        game.player.health = Math.min(100, game.player.health + 20);
    }
    
    requestAnimationFrame(gameLoop);
}

function createParticles(x, y) {
    for (let i = 0; i < 10; i++) {
        game.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 20
        });
    }
}

// Special ability
document.addEventListener('keydown', e => {
    if (e.key === ' ') {
        // Clear all enemies
        game.enemies.forEach(enemy => createParticles(enemy.x, enemy.y));
        game.enemies = [];
        game.score += 50;
        document.getElementById('score').textContent = game.score;
    }
});

// Start game
gameLoop();

// Resize handler
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
</script>
</body>
</html>'''

class GameHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(GAME_HTML.encode('utf-8'))
        elif self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            status = {
                'status': 'online',
                'game': 'NO BULLSHIT ARENA',
                'features': [
                    'Actually works',
                    'No formatting errors',
                    'Real gameplay',
                    'Instant loading'
                ],
                'timestamp': datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(status).encode())
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        # Suppress default logging
        pass

if __name__ == "__main__":
    # Make sure directory exists for any game data
    os.makedirs('game_data', exist_ok=True)
    
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║                  NO BULLSHIT GAME ARENA                   ║
║                                                           ║
║  Status: RUNNING on http://localhost:{PORT}               ║
║                                                           ║
║  Features:                                                ║
║  ✓ Python server (no JS formatting issues)               ║
║  ✓ Canvas-based game (no complex frameworks)             ║
║  ✓ Actual gameplay that works                            ║
║  ✓ No external dependencies                              ║
║  ✓ Instant loading                                       ║
║                                                           ║
║  Controls:                                                ║
║  • WASD/Arrows = Move                                     ║
║  • Click = Shoot                                          ║
║  • Space = Clear screen special                           ║
║                                                           ║
║  This ACTUALLY WORKS. No bullshit.                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    with socketserver.TCPServer(("", PORT), GameHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")
            httpd.shutdown()