#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 13002

HTML = b"""<!DOCTYPE html>
<html>
<head>
<title>RuneScape Simple</title>
<style>
body { 
    margin: 0; 
    background: #000; 
    overflow: hidden;
    font-family: Arial;
}

#game {
    width: 100vw;
    height: 100vh;
    position: relative;
    background: #2B5016;
}

#viewport {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 800px;
    height: 600px;
    border: 3px solid #654321;
    background: #3A6B35;
    overflow: hidden;
}

.player {
    position: absolute;
    width: 32px;
    height: 48px;
    transition: all 0.2s linear;
}

.p-head {
    width: 16px;
    height: 16px;
    background: #FDBCB4;
    border: 1px solid #000;
    border-radius: 50%;
    margin: 0 auto;
}

.p-body {
    width: 24px;
    height: 20px;
    background: #8B4513;
    border: 1px solid #000;
    margin: 0 auto;
    margin-top: -1px;
}

.p-legs {
    width: 20px;
    height: 12px;
    background: #696969;
    border: 1px solid #000;
    margin: 0 auto;
    margin-top: -1px;
}

.tree {
    position: absolute;
    width: 40px;
    height: 60px;
}

.trunk {
    width: 12px;
    height: 20px;
    background: #8B4513;
    margin: 0 auto;
    margin-top: 20px;
}

.leaves {
    width: 40px;
    height: 40px;
    background: #228B22;
    border-radius: 50%;
    position: absolute;
    top: 0;
}

.ui {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 120px;
    background: #3C3C3C;
    border-top: 2px solid #654321;
    color: #FFD700;
    padding: 10px;
}

.stats {
    display: flex;
    gap: 20px;
}

.stat {
    background: #2C2C2C;
    padding: 5px 10px;
    border: 1px solid #555;
}

.minimap {
    position: absolute;
    top: 10px;
    right: 10px;
    width: 150px;
    height: 150px;
    background: #1C1C1C;
    border: 2px solid #654321;
}

.minimap-dot {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #FFF;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}

.click-marker {
    position: absolute;
    width: 20px;
    height: 20px;
    pointer-events: none;
}

.click-x {
    position: absolute;
    width: 100%;
    height: 2px;
    background: #FFFF00;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
}

.click-x:after {
    content: '';
    position: absolute;
    width: 100%;
    height: 2px;
    background: #FFFF00;
    transform: rotate(-90deg);
}
</style>
</head>
<body>

<div id="game">
    <div id="viewport">
        <!-- Trees -->
        <div class="tree" style="left: 100px; top: 100px;">
            <div class="leaves"></div>
            <div class="trunk"></div>
        </div>
        <div class="tree" style="left: 600px; top: 200px;">
            <div class="leaves"></div>
            <div class="trunk"></div>
        </div>
        <div class="tree" style="left: 300px; top: 400px;">
            <div class="leaves"></div>
            <div class="trunk"></div>
        </div>
        
        <!-- Player -->
        <div class="player" id="player">
            <div class="p-head"></div>
            <div class="p-body"></div>
            <div class="p-legs"></div>
        </div>
    </div>
    
    <div class="minimap">
        <div class="minimap-dot"></div>
    </div>
    
    <div class="ui">
        <div class="stats">
            <div class="stat">HP: 99/99</div>
            <div class="stat">Combat: 126</div>
            <div class="stat">Total: 2277</div>
        </div>
    </div>
</div>

<script>
const player = document.getElementById('player');
const viewport = document.getElementById('viewport');
let playerX = 400;
let playerY = 300;
let targetX = playerX;
let targetY = playerY;
let moving = false;

// Initial position
player.style.left = playerX + 'px';
player.style.top = playerY + 'px';

// Click to move
viewport.addEventListener('click', (e) => {
    const rect = viewport.getBoundingClientRect();
    targetX = e.clientX - rect.left - 16;
    targetY = e.clientY - rect.top - 24;
    moving = true;
    
    // Show click marker
    const marker = document.createElement('div');
    marker.className = 'click-marker';
    marker.innerHTML = '<div class="click-x"></div>';
    marker.style.left = (e.clientX - rect.left - 10) + 'px';
    marker.style.top = (e.clientY - rect.top - 10) + 'px';
    viewport.appendChild(marker);
    
    setTimeout(() => marker.remove(), 1000);
});

// Movement loop
function move() {
    if (moving) {
        const dx = targetX - playerX;
        const dy = targetY - playerY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 2) {
            const speed = 4;
            playerX += (dx / dist) * speed;
            playerY += (dy / dist) * speed;
            player.style.left = playerX + 'px';
            player.style.top = playerY + 'px';
            
            // Update minimap
            const dot = document.querySelector('.minimap-dot');
            dot.style.left = (playerX / 800 * 150) + 'px';
            dot.style.top = (playerY / 600 * 150) + 'px';
        } else {
            moving = false;
        }
    }
    
    // Walking animation
    if (moving) {
        const legs = player.querySelector('.p-legs');
        legs.style.width = legs.style.width === '18px' ? '22px' : '18px';
    }
    
    requestAnimationFrame(move);
}

move();
</script>

</body>
</html>"""

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(HTML)
    def log_message(self, f, *a): pass

print(f"RuneScape Simple running on http://localhost:{PORT}")
HTTPServer(("localhost", PORT), Handler).serve_forever()