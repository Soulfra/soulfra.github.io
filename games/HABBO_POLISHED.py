#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

PORT = 13004

HTML = """<!DOCTYPE html>
<html>
<head>
<title>Soulfra Hotel</title>
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    background: #1a1a1a;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    overflow: hidden;
}

#game-container {
    display: flex;
    height: 100vh;
}

#room {
    flex: 1;
    background: linear-gradient(to bottom, #4a90e2 0%, #4a90e2 40%, transparent 40%);
    position: relative;
    overflow: hidden;
}

#floor {
    position: absolute;
    width: 120%;
    height: 80%;
    bottom: -10%;
    left: -10%;
    transform: rotateX(60deg) rotateZ(45deg);
    transform-style: preserve-3d;
}

.tile {
    position: absolute;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #d4a574 0%, #c19660 100%);
    border: 1px solid rgba(0,0,0,0.1);
    transform-style: preserve-3d;
    cursor: pointer;
    transition: all 0.2s;
}

.tile:hover {
    background: linear-gradient(135deg, #e0b584 0%, #d1a670 100%);
    transform: translateZ(2px);
}

.tile.highlighted {
    background: linear-gradient(135deg, #6bb26b 0%, #5aa25a 100%);
    animation: pulse 0.5s ease;
}

@keyframes pulse {
    0%, 100% { transform: translateZ(0); }
    50% { transform: translateZ(5px); }
}

.character {
    position: absolute;
    width: 40px;
    height: 80px;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100;
}

.char-container {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    animation: bob 2s ease-in-out infinite;
}

@keyframes bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
}

.char-shadow {
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 30px;
    height: 10px;
    background: rgba(0,0,0,0.2);
    border-radius: 50%;
    filter: blur(3px);
}

.char-head {
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, #fdbcb4 0%, #f5a89c 100%);
    border-radius: 50%;
    margin: 0 auto;
    border: 2px solid #333;
    position: relative;
}

.char-eyes {
    position: absolute;
    top: 8px;
    left: 5px;
    width: 14px;
    display: flex;
    justify-content: space-between;
}

.eye {
    width: 3px;
    height: 3px;
    background: #333;
    border-radius: 50%;
}

.char-body {
    width: 30px;
    height: 35px;
    background: linear-gradient(135deg, #4169e1 0%, #3050c0 100%);
    margin: -2px auto 0;
    border-radius: 8px 8px 4px 4px;
    border: 2px solid #333;
    position: relative;
}

.char-arms {
    position: absolute;
    top: 5px;
    width: 100%;
    display: flex;
    justify-content: space-between;
}

.arm {
    width: 8px;
    height: 20px;
    background: #fdbcb4;
    border: 1px solid #333;
    border-radius: 4px;
}

.arm.left { margin-left: -6px; }
.arm.right { margin-right: -6px; }

.char-legs {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-top: -2px;
}

.leg {
    width: 10px;
    height: 20px;
    background: linear-gradient(135deg, #555 0%, #333 100%);
    border: 2px solid #333;
    border-radius: 0 0 4px 4px;
}

.walking .leg:nth-child(1) {
    animation: walk1 0.4s ease-in-out infinite;
}

.walking .leg:nth-child(2) {
    animation: walk2 0.4s ease-in-out infinite;
}

@keyframes walk1 {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
}

@keyframes walk2 {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(3px); }
}

.char-name {
    position: absolute;
    top: -30px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: #fff;
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 12px;
    white-space: nowrap;
    font-weight: 500;
}

.chat-bubble {
    position: absolute;
    bottom: 85px;
    left: 50%;
    transform: translateX(-50%);
    background: #fff;
    color: #333;
    padding: 8px 15px;
    border-radius: 15px;
    font-size: 14px;
    white-space: nowrap;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
    opacity: 0;
    transition: opacity 0.3s;
}

.chat-bubble:after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid transparent;
    border-right: 8px solid transparent;
    border-top: 8px solid #fff;
}

.chat-bubble.show {
    opacity: 1;
}

#sidebar {
    width: 320px;
    background: #2a2a2a;
    border-left: 2px solid #333;
    display: flex;
    flex-direction: column;
    color: #e0e0e0;
}

.sidebar-header {
    background: linear-gradient(135deg, #333 0%, #2a2a2a 100%);
    padding: 20px;
    border-bottom: 2px solid #444;
}

.sidebar-header h1 {
    font-size: 24px;
    margin-bottom: 5px;
    background: linear-gradient(45deg, #4CAF50, #2196F3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.user-info {
    background: #333;
    border-radius: 10px;
    padding: 15px;
    margin: 20px;
}

.user-stats {
    display: flex;
    justify-content: space-around;
    margin-top: 10px;
}

.stat-item {
    text-align: center;
}

.stat-value {
    font-size: 20px;
    font-weight: bold;
    color: #4CAF50;
}

.stat-label {
    font-size: 12px;
    color: #999;
}

.chat-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin: 20px;
}

.chat-messages {
    flex: 1;
    background: #1a1a1a;
    border: 1px solid #444;
    border-radius: 10px;
    padding: 15px;
    overflow-y: auto;
    margin-bottom: 10px;
}

.chat-message {
    margin-bottom: 10px;
    padding: 8px;
    background: rgba(255,255,255,0.05);
    border-radius: 5px;
}

.chat-author {
    font-weight: bold;
    color: #4CAF50;
}

.chat-input-container {
    display: flex;
    gap: 10px;
}

.chat-input {
    flex: 1;
    background: #1a1a1a;
    border: 1px solid #444;
    color: #e0e0e0;
    padding: 10px 15px;
    border-radius: 25px;
    font-size: 14px;
}

.chat-send {
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 25px;
    cursor: pointer;
    font-weight: bold;
    transition: transform 0.2s;
}

.chat-send:hover {
    transform: scale(1.05);
}

.room-list {
    margin: 20px;
}

.room-item {
    background: #333;
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.room-item:hover {
    background: #3a3a3a;
    transform: translateX(5px);
}

.room-users {
    background: #4CAF50;
    color: white;
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 12px;
}

.furniture {
    position: absolute;
    z-index: 50;
}

.sofa {
    width: 120px;
    height: 60px;
    background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
    border: 2px solid #333;
    border-radius: 10px;
    transform: rotateX(30deg) rotateZ(45deg);
}

.plant {
    width: 40px;
    height: 60px;
}

.plant-pot {
    width: 30px;
    height: 20px;
    background: linear-gradient(135deg, #8B4513 0%, #654321 100%);
    border: 2px solid #333;
    margin: 0 auto;
    border-radius: 0 0 5px 5px;
}

.plant-leaves {
    width: 40px;
    height: 40px;
    background: radial-gradient(circle, #4CAF50 0%, #2E7D32 100%);
    border-radius: 50%;
    margin-bottom: -5px;
}

.online-indicator {
    width: 8px;
    height: 8px;
    background: #4CAF50;
    border-radius: 50%;
    display: inline-block;
    margin-right: 5px;
    animation: blink 2s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}
</style>
</head>
<body>

<div id="game-container">
    <div id="room">
        <div id="floor"></div>
        
        <!-- Furniture -->
        <div class="furniture sofa" style="left: 200px; top: 300px;"></div>
        <div class="furniture plant" style="left: 600px; top: 250px;">
            <div class="plant-leaves"></div>
            <div class="plant-pot"></div>
        </div>
    </div>
    
    <div id="sidebar">
        <div class="sidebar-header">
            <h1>Soulfra Hotel</h1>
            <p>Welcome to the metaverse</p>
        </div>
        
        <div class="user-info">
            <div><span class="online-indicator"></span><strong>You</strong></div>
            <div class="user-stats">
                <div class="stat-item">
                    <div class="stat-value">1,250</div>
                    <div class="stat-label">Credits</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">42</div>
                    <div class="stat-label">Level</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">7</div>
                    <div class="stat-label">Friends</div>
                </div>
            </div>
        </div>
        
        <div class="chat-container">
            <div class="chat-messages" id="chat-messages">
                <div class="chat-message">
                    <span class="chat-author">System:</span> Welcome to Soulfra Hotel!
                </div>
                <div class="chat-message">
                    <span class="chat-author">System:</span> Click anywhere on the floor to move.
                </div>
            </div>
            <div class="chat-input-container">
                <input type="text" class="chat-input" placeholder="Type a message..." id="chat-input">
                <button class="chat-send" onclick="sendChat()">Send</button>
            </div>
        </div>
        
        <div class="room-list">
            <h3 style="margin-bottom: 15px;">Popular Rooms</h3>
            <div class="room-item">
                <span>Main Lobby</span>
                <span class="room-users">23 users</span>
            </div>
            <div class="room-item">
                <span>Battle Arena</span>
                <span class="room-users">15 users</span>
            </div>
            <div class="room-item">
                <span>Trading Post</span>
                <span class="room-users">8 users</span>
            </div>
        </div>
    </div>
</div>

<script>
// Create isometric floor
const floor = document.getElementById('floor');
const tileSize = 60;
const gridSize = 15;

for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.width = tileSize + 'px';
        tile.style.height = tileSize + 'px';
        
        // Isometric positioning
        const isoX = (x - y) * (tileSize / 2);
        const isoY = (x + y) * (tileSize / 4);
        
        tile.style.left = (isoX + 500) + 'px';
        tile.style.top = (isoY + 100) + 'px';
        
        tile.dataset.x = x;
        tile.dataset.y = y;
        
        tile.addEventListener('click', function() {
            moveCharacter(x, y);
        });
        
        floor.appendChild(tile);
    }
}

// Create main character
const mainChar = createCharacter('You', true);
const room = document.getElementById('room');
room.appendChild(mainChar);

let charX = 7;
let charY = 7;
updateCharacterPosition(mainChar, charX, charY);

function createCharacter(name, isPlayer = false) {
    const char = document.createElement('div');
    char.className = 'character';
    
    char.innerHTML = `
        <div class="char-container">
            <div class="char-name">${name}</div>
            <div class="chat-bubble"></div>
            <div class="char-head">
                <div class="char-eyes">
                    <div class="eye"></div>
                    <div class="eye"></div>
                </div>
            </div>
            <div class="char-body">
                <div class="char-arms">
                    <div class="arm left"></div>
                    <div class="arm right"></div>
                </div>
            </div>
            <div class="char-legs">
                <div class="leg"></div>
                <div class="leg"></div>
            </div>
            <div class="char-shadow"></div>
        </div>
    `;
    
    if (isPlayer) {
        char.id = 'main-character';
    }
    
    return char;
}

function updateCharacterPosition(char, x, y) {
    const isoX = (x - y) * (tileSize / 2);
    const isoY = (x + y) * (tileSize / 4);
    
    char.style.left = (isoX + 480) + 'px';
    char.style.top = (isoY + 50) + 'px';
    
    // Update z-index based on position
    char.style.zIndex = Math.floor(x + y) * 10 + 100;
}

function moveCharacter(newX, newY) {
    const mainChar = document.getElementById('main-character');
    
    // Highlight target tile
    document.querySelectorAll('.tile').forEach(t => t.classList.remove('highlighted'));
    const targetTile = document.querySelector(`[data-x="${newX}"][data-y="${newY}"]`);
    if (targetTile) {
        targetTile.classList.add('highlighted');
        setTimeout(() => targetTile.classList.remove('highlighted'), 500);
    }
    
    // Add walking animation
    mainChar.classList.add('walking');
    
    // Update position
    charX = newX;
    charY = newY;
    updateCharacterPosition(mainChar, charX, charY);
    
    // Remove walking animation after movement
    setTimeout(() => {
        mainChar.classList.remove('walking');
    }, 500);
}

// Chat functionality
function sendChat() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (message) {
        // Add to chat
        const chatMessages = document.getElementById('chat-messages');
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        msgDiv.innerHTML = '<span class="chat-author">You:</span> ' + message;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Show bubble above character
        const mainChar = document.getElementById('main-character');
        const bubble = mainChar.querySelector('.chat-bubble');
        bubble.textContent = message;
        bubble.classList.add('show');
        
        setTimeout(() => {
            bubble.classList.remove('show');
        }, 3000);
        
        input.value = '';
    }
}

document.getElementById('chat-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendChat();
    }
});

// Add some NPC characters
const npcs = [
    { name: 'Guest_123', x: 3, y: 5 },
    { name: 'Player_456', x: 10, y: 8 },
    { name: 'User_789', x: 5, y: 10 }
];

npcs.forEach(npc => {
    const npcChar = createCharacter(npc.name);
    room.appendChild(npcChar);
    updateCharacterPosition(npcChar, npc.x, npc.y);
    
    // Random movement
    setInterval(() => {
        const dx = Math.floor(Math.random() * 3) - 1;
        const dy = Math.floor(Math.random() * 3) - 1;
        npc.x = Math.max(0, Math.min(gridSize - 1, npc.x + dx));
        npc.y = Math.max(0, Math.min(gridSize - 1, npc.y + dy));
        
        npcChar.classList.add('walking');
        updateCharacterPosition(npcChar, npc.x, npc.y);
        
        setTimeout(() => {
            npcChar.classList.remove('walking');
        }, 500);
    }, 3000 + Math.random() * 4000);
});

console.log('Soulfra Hotel - Polished version running!');
</script>

</body>
</html>""".encode()

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(HTML)
    def log_message(self, f, *a): pass

print(f"Habbo Polished running on http://localhost:{PORT}")
HTTPServer(("localhost", PORT), Handler).serve_forever()