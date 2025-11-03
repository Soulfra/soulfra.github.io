#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

PORT = 13001

HTML = b"""<!DOCTYPE html>
<html>
<head>
<title>Habbo Simple</title>
<style>
body { 
    margin: 0; 
    background: #333; 
    overflow: hidden;
}

#room {
    width: 100vw;
    height: 100vh;
    position: relative;
    background: linear-gradient(to bottom, #87CEEB 0%, #87CEEB 40%, #8B7355 40%);
}

.floor {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 60%;
    transform: perspective(400px) rotateX(45deg);
    transform-origin: bottom;
}

.tile {
    position: absolute;
    width: 64px;
    height: 32px;
    border: 1px solid rgba(0,0,0,0.1);
    background: #A0826D;
}

.character {
    position: absolute;
    width: 64px;
    height: 110px;
    cursor: pointer;
    transition: all 0.3s ease;
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

.chat-bubble {
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    background: #FFF;
    border: 2px solid #000;
    border-radius: 8px;
    padding: 5px 10px;
    font-family: Arial;
    font-size: 12px;
    white-space: nowrap;
    opacity: 0;
}

.chat-bubble.show {
    opacity: 1;
}
</style>
</head>
<body>

<div id="room">
    <div class="floor" id="floor"></div>
</div>

<script>
// Create isometric floor
const floor = document.getElementById('floor');
for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.left = (x - y) * 32 + 400 + 'px';
        tile.style.top = (x + y) * 16 + 'px';
        tile.dataset.x = x;
        tile.dataset.y = y;
        floor.appendChild(tile);
    }
}

// Create character
const char = document.createElement('div');
char.className = 'character';
char.innerHTML = `
    <div class="chat-bubble" id="chat"></div>
    <div class="char-head"></div>
    <div class="char-body"></div>
    <div class="char-legs">
        <div class="leg"></div>
        <div class="leg"></div>
    </div>
`;
document.getElementById('room').appendChild(char);

// Position character
let charX = 5, charY = 5;
function updateCharPos() {
    const screenX = (charX - charY) * 32 + 400;
    const screenY = (charX + charY) * 16 + 150;
    char.style.left = screenX - 32 + 'px';
    char.style.top = screenY - 80 + 'px';
}
updateCharPos();

// Movement
floor.addEventListener('click', (e) => {
    const tile = e.target;
    if (tile.classList.contains('tile')) {
        charX = parseInt(tile.dataset.x);
        charY = parseInt(tile.dataset.y);
        updateCharPos();
        
        // Show chat
        const chat = document.getElementById('chat');
        chat.textContent = 'Walking...';
        chat.classList.add('show');
        setTimeout(() => chat.classList.remove('show'), 2000);
    }
});

// Walking animation
setInterval(() => {
    const legs = char.querySelectorAll('.leg');
    legs.forEach(leg => {
        const offset = leg.style.marginTop === '2px' ? '-2px' : '2px';
        leg.style.marginTop = offset;
    });
}, 300);
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

print(f"Habbo Simple running on http://localhost:{PORT}")
HTTPServer(("localhost", PORT), Handler).serve_forever()