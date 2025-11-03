#!/usr/bin/env python3
"""
REAL HABBO STYLE GAME - Proper isometric sprites, no deformed images
Actual character models like Habbo Hotel / RuneScape
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

PORT = 11000

HTML = '''<!DOCTYPE html>
<html>
<head>
<title>Soulfra Hotel - Real Character System</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { 
    background: #2a2a2a; 
    font-family: Arial, sans-serif; 
    color: #fff;
    overflow: hidden;
}

.game-container {
    width: 100vw;
    height: 100vh;
    display: flex;
}

.room {
    flex: 1;
    position: relative;
    background: #4a90e2;
    overflow: hidden;
}

.floor {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 60%;
    background: #8B7355;
    transform: rotateX(45deg);
    transform-origin: bottom;
}

.floor-grid {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 60%;
}

.tile {
    position: absolute;
    width: 64px;
    height: 32px;
    border: 1px solid rgba(0,0,0,0.2);
    background: #9B8565;
    cursor: pointer;
}

.tile:hover {
    background: #AB9575;
}

.character {
    position: absolute;
    width: 64px;
    height: 120px;
    transition: all 0.3s ease;
    cursor: pointer;
}

.character-sprite {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
}

/* Simple sprite using CSS shapes - no emojis */
.char-head {
    width: 24px;
    height: 24px;
    background: #fdbcb4;
    border-radius: 50%;
    margin: 0 auto;
    border: 2px solid #000;
}

.char-body {
    width: 32px;
    height: 40px;
    background: #4169e1;
    margin: 0 auto;
    margin-top: -2px;
    border: 2px solid #000;
    border-radius: 8px 8px 0 0;
}

.char-legs {
    width: 28px;
    height: 30px;
    background: #333;
    margin: 0 auto;
    margin-top: -2px;
    border: 2px solid #000;
    border-radius: 0 0 4px 4px;
}

.char-name {
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: #fff;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
}

.sidebar {
    width: 300px;
    background: #1a1a1a;
    padding: 20px;
    overflow-y: auto;
}

.character-selector {
    margin-bottom: 20px;
}

.char-option {
    display: inline-block;
    width: 80px;
    height: 100px;
    margin: 5px;
    padding: 10px;
    background: #2a2a2a;
    border: 2px solid #444;
    cursor: pointer;
    text-align: center;
}

.char-option:hover {
    border-color: #4a90e2;
}

.char-option.selected {
    border-color: #4a90e2;
    background: #3a3a3a;
}

.char-preview {
    width: 40px;
    height: 60px;
    margin: 0 auto;
    transform: scale(0.8);
}

.chat-box {
    background: #2a2a2a;
    border: 1px solid #444;
    padding: 10px;
    height: 200px;
    overflow-y: auto;
    margin-bottom: 10px;
}

.chat-input {
    width: 100%;
    padding: 8px;
    background: #1a1a1a;
    border: 1px solid #444;
    color: #fff;
    font-family: Arial, sans-serif;
}

.chat-message {
    margin: 5px 0;
    padding: 5px;
    background: rgba(255,255,255,0.05);
}

.room-list {
    margin-top: 20px;
}

.room-item {
    padding: 10px;
    background: #2a2a2a;
    border: 1px solid #444;
    margin: 5px 0;
    cursor: pointer;
}

.room-item:hover {
    background: #3a3a3a;
}

.info-panel {
    background: #2a2a2a;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #444;
}
</style>
</head>
<body>

<div class="game-container">
    <div class="room" id="room">
        <div class="floor-grid" id="floorGrid"></div>
    </div>
    
    <div class="sidebar">
        <div class="info-panel">
            <h3>Soulfra Hotel</h3>
            <p>Click on floor to move</p>
            <p>Select character style below</p>
        </div>
        
        <div class="character-selector">
            <h4>Character Style:</h4>
            <div class="char-option selected" onclick="selectCharacter('default')">
                <div class="char-preview">
                    <div class="char-head"></div>
                    <div class="char-body" style="background: #4169e1;"></div>
                    <div class="char-legs"></div>
                </div>
                <small>Default</small>
            </div>
            <div class="char-option" onclick="selectCharacter('warrior')">
                <div class="char-preview">
                    <div class="char-head"></div>
                    <div class="char-body" style="background: #8b0000;"></div>
                    <div class="char-legs"></div>
                </div>
                <small>Warrior</small>
            </div>
            <div class="char-option" onclick="selectCharacter('mage')">
                <div class="char-preview">
                    <div class="char-head"></div>
                    <div class="char-body" style="background: #4b0082;"></div>
                    <div class="char-legs"></div>
                </div>
                <small>Mage</small>
            </div>
        </div>
        
        <div class="chat-box" id="chatBox">
            <div class="chat-message">Welcome to Soulfra Hotel!</div>
            <div class="chat-message">This is a proper character system</div>
            <div class="chat-message">No stretched images!</div>
        </div>
        <input type="text" class="chat-input" placeholder="Press Enter to chat..." 
               onkeypress="if(event.key==='Enter')sendChat(this)">
        
        <div class="room-list">
            <h4>Rooms:</h4>
            <div class="room-item">Lobby (3 users)</div>
            <div class="room-item">Pool Area (5 users)</div>
            <div class="room-item">Game Room (2 users)</div>
        </div>
    </div>
</div>

<script>
// Game state
let playerChar = null;
let otherPlayers = {};
let selectedStyle = 'default';

const charStyles = {
    default: { body: '#4169e1', name: 'Guest' },
    warrior: { body: '#8b0000', name: 'Warrior' },
    mage: { body: '#4b0082', name: 'Mage' }
};

// Create isometric floor grid
function createFloorGrid() {
    const grid = document.getElementById('floorGrid');
    const tileWidth = 64;
    const tileHeight = 32;
    const rows = 10;
    const cols = 10;
    
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.style.left = (x - y) * (tileWidth/2) + 400 + 'px';
            tile.style.top = (x + y) * (tileHeight/2) + 100 + 'px';
            tile.dataset.x = x;
            tile.dataset.y = y;
            tile.onclick = () => moveCharacter(x, y);
            grid.appendChild(tile);
        }
    }
}

// Create character sprite
function createCharacter(id, style, name) {
    const char = document.createElement('div');
    char.className = 'character';
    char.id = 'char-' + id;
    
    char.innerHTML = `
        <div class="char-name">${name}</div>
        <div class="character-sprite">
            <div class="char-head"></div>
            <div class="char-body" style="background: ${charStyles[style].body};"></div>
            <div class="char-legs"></div>
        </div>
    `;
    
    return char;
}

// Initialize player
function initPlayer() {
    playerChar = createCharacter('player', selectedStyle, 'You');
    document.getElementById('room').appendChild(playerChar);
    moveCharacter(5, 5);
}

// Move character to grid position
function moveCharacter(gridX, gridY) {
    if (!playerChar) return;
    
    const tileWidth = 64;
    const tileHeight = 32;
    
    // Isometric conversion
    const screenX = (gridX - gridY) * (tileWidth/2) + 400;
    const screenY = (gridX + gridY) * (tileHeight/2) + 50;
    
    playerChar.style.left = screenX - 32 + 'px';
    playerChar.style.top = screenY - 60 + 'px';
    
    // Add walk animation
    playerChar.style.transform = 'scale(1.1)';
    setTimeout(() => {
        playerChar.style.transform = 'scale(1)';
    }, 300);
}

// Select character style
function selectCharacter(style) {
    selectedStyle = style;
    
    // Update UI
    document.querySelectorAll('.char-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.target.closest('.char-option').classList.add('selected');
    
    // Update player character
    if (playerChar) {
        const body = playerChar.querySelector('.char-body');
        body.style.background = charStyles[style].body;
    }
}

// Simulate other players
function addBotPlayer() {
    const id = 'bot-' + Date.now();
    const styles = ['default', 'warrior', 'mage'];
    const style = styles[Math.floor(Math.random() * styles.length)];
    const names = ['Player1', 'Player2', 'Guest123', 'User456'];
    const name = names[Math.floor(Math.random() * names.length)];
    
    const bot = createCharacter(id, style, name);
    document.getElementById('room').appendChild(bot);
    
    // Random position
    const x = Math.floor(Math.random() * 10);
    const y = Math.floor(Math.random() * 10);
    
    const tileWidth = 64;
    const tileHeight = 32;
    const screenX = (x - y) * (tileWidth/2) + 400;
    const screenY = (x + y) * (tileHeight/2) + 50;
    
    bot.style.left = screenX - 32 + 'px';
    bot.style.top = screenY - 60 + 'px';
    
    otherPlayers[id] = { element: bot, x: x, y: y };
    
    // Move randomly
    const moveBot = () => {
        if (!otherPlayers[id]) return;
        
        const newX = Math.max(0, Math.min(9, x + Math.floor(Math.random() * 3 - 1)));
        const newY = Math.max(0, Math.min(9, y + Math.floor(Math.random() * 3 - 1)));
        
        const screenX = (newX - newY) * (tileWidth/2) + 400;
        const screenY = (newX + newY) * (tileHeight/2) + 50;
        
        bot.style.left = screenX - 32 + 'px';
        bot.style.top = screenY - 60 + 'px';
        
        setTimeout(moveBot, 3000 + Math.random() * 4000);
    };
    
    setTimeout(moveBot, 2000);
    
    // Remove after some time
    setTimeout(() => {
        if (otherPlayers[id]) {
            otherPlayers[id].element.remove();
            delete otherPlayers[id];
        }
    }, 20000 + Math.random() * 20000);
}

// Chat
function sendChat(input) {
    if (!input.value.trim()) return;
    
    const chatBox = document.getElementById('chatBox');
    const msg = document.createElement('div');
    msg.className = 'chat-message';
    msg.innerHTML = '<strong>You:</strong> ' + input.value;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    input.value = '';
}

// Initialize game
createFloorGrid();
initPlayer();

// Add some bot players
setTimeout(() => addBotPlayer(), 1000);
setTimeout(() => addBotPlayer(), 3000);
setTimeout(() => addBotPlayer(), 5000);

// Periodically add more bots
setInterval(() => {
    if (Object.keys(otherPlayers).length < 5) {
        addBotPlayer();
    }
}, 10000);

console.log('Soulfra Hotel running - proper character sprites!');
</script>

</body>
</html>'''

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(HTML.encode())
        
    def log_message(self, format, *args):
        pass

if __name__ == '__main__':
    server = HTTPServer(('localhost', PORT), Handler)
    print(f'Real Habbo Style Game running on http://localhost:{PORT}')
    print('- Proper character sprites (no stretched images)')
    print('- Isometric floor grid')
    print('- Character selection')
    print('- Click to move')
    print('- No emojis!')
    server.serve_forever()