#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 13001

HTML = b"""<!DOCTYPE html>
<html>
<head>
<title>Habbo Fixed</title>
<style>
body { 
    margin: 0; 
    background: #222; 
    overflow: hidden;
    font-family: Arial;
}

#room {
    width: 100vw;
    height: 100vh;
    position: relative;
    background: #87CEEB;
}

#floor-container {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
}

.tile {
    position: absolute;
    width: 64px;
    height: 32px;
    background: #A0826D;
    border: 1px solid rgba(0,0,0,0.2);
    cursor: pointer;
}

.tile:hover {
    background: #B8967F;
}

.character {
    position: absolute;
    width: 64px;
    height: 110px;
    pointer-events: none;
    transition: all 0.5s ease;
    z-index: 100;
}

.char-head {
    width: 24px;
    height: 24px;
    background: #FDBCB4;
    border-radius: 50%;
    margin: 0 auto;
    border: 2px solid #000;
}

.char-body {
    width: 32px;
    height: 40px;
    background: #4169E1;
    margin: 0 auto;
    margin-top: -2px;
    border: 2px solid #000;
    border-radius: 8px 8px 0 0;
}

.char-legs {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-top: -2px;
}

.leg {
    width: 10px;
    height: 25px;
    background: #333;
    border: 2px solid #000;
    border-radius: 0 0 4px 4px;
}

.info {
    position: absolute;
    top: 10px;
    left: 10px;
    color: white;
    background: rgba(0,0,0,0.7);
    padding: 10px;
    border-radius: 5px;
}
</style>
</head>
<body>

<div id="room">
    <div id="floor-container"></div>
    <div class="info">Click any tile to move!</div>
</div>

<script>
const floorContainer = document.getElementById('floor-container');
const room = document.getElementById('room');

// Create isometric floor
for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        const screenX = (x - y) * 32 + window.innerWidth/2;
        const screenY = (x + y) * 16 + 200;
        tile.style.left = screenX + 'px';
        tile.style.top = screenY + 'px';
        tile.dataset.x = x;
        tile.dataset.y = y;
        tile.onclick = function() { moveCharacter(x, y); };
        floorContainer.appendChild(tile);
    }
}

// Create character
const char = document.createElement('div');
char.className = 'character';
char.innerHTML = `
    <div class="char-head"></div>
    <div class="char-body"></div>
    <div class="char-legs">
        <div class="leg" id="leg1"></div>
        <div class="leg" id="leg2"></div>
    </div>
`;
room.appendChild(char);

// Character position
let charX = 6, charY = 6;
let walking = false;

function updateCharPos() {
    const screenX = (charX - charY) * 32 + window.innerWidth/2;
    const screenY = (charX + charY) * 16 + 200;
    char.style.left = (screenX - 32) + 'px';
    char.style.top = (screenY - 80) + 'px';
}

function moveCharacter(newX, newY) {
    charX = newX;
    charY = newY;
    updateCharPos();
    
    // Start walking animation
    walking = true;
    setTimeout(() => { walking = false; }, 500);
}

// Initial position
updateCharPos();

// Walking animation
let frame = 0;
setInterval(() => {
    if (walking) {
        frame++;
        const leg1 = document.getElementById('leg1');
        const leg2 = document.getElementById('leg2');
        if (frame % 2 === 0) {
            leg1.style.marginTop = '2px';
            leg2.style.marginTop = '-2px';
        } else {
            leg1.style.marginTop = '-2px';
            leg2.style.marginTop = '2px';
        }
    }
}, 150);

console.log('Habbo Fixed - Click handling improved!');
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

print(f"Habbo Fixed running on http://localhost:{PORT}")
HTTPServer(("localhost", PORT), Handler).serve_forever()