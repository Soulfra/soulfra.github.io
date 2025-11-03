#!/usr/bin/env python3
"""
MULTIPLAYER WEBSOCKET GAME - Real multiplayer using Python
No formatting errors, actual multiplayer that works
"""

import asyncio
import websockets
import json
import http.server
import socketserver
import threading
import time
import uuid
from datetime import datetime

HTTP_PORT = 7000
WS_PORT = 7001

# Global game state
game_state = {
    'players': {},
    'projectiles': [],
    'items': [],
    'enemies': [],
    'chat_messages': [],
    'leaderboard': []
}

# Connected websocket clients
connected_clients = set()

# Game HTML with WebSocket client
GAME_HTML = r'''<!DOCTYPE html>
<html>
<head>
<title>REAL MULTIPLAYER ARENA</title>
<meta charset="UTF-8">
<style>
body { margin: 0; background: #000; color: #fff; font-family: Arial; overflow: hidden; }
.container { width: 100vw; height: 100vh; display: flex; flex-direction: column; }
.header { background: linear-gradient(45deg, #00ff88, #00ccff); padding: 10px; text-align: center; }
.header h1 { margin: 0; color: #000; }
.game-area { flex: 1; position: relative; background: #0a0a0a; }
canvas { width: 100%; height: 100%; display: block; }
.hud { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 10px; }
.stat { margin: 5px 0; }
.stat span { color: #00ff88; font-weight: bold; }
.players-list { position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 10px; min-width: 200px; }
.player-entry { margin: 5px 0; display: flex; justify-content: space-between; }
.chat { position: absolute; bottom: 10px; left: 10px; width: 300px; }
.chat-messages { background: rgba(0,0,0,0.8); padding: 10px; border-radius: 10px; height: 150px; overflow-y: auto; margin-bottom: 10px; }
.chat-input { width: 100%; padding: 8px; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 5px; }
.status { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); padding: 20px; border-radius: 10px; text-align: center; }
.status.connected { display: none; }
</style>
</head>
<body>

<div class="container">
    <div class="header">
        <h1>REAL MULTIPLAYER ARENA - PYTHON WEBSOCKETS</h1>
    </div>
    
    <div class="game-area">
        <canvas id="game"></canvas>
        
        <div class="hud">
            <div class="stat">Health: <span id="health">100</span></div>
            <div class="stat">Score: <span id="score">0</span></div>
            <div class="stat">Players: <span id="player-count">0</span></div>
        </div>
        
        <div class="players-list">
            <h3 style="margin: 0 0 10px 0; color: #00ff88;">ONLINE PLAYERS</h3>
            <div id="players"></div>
        </div>
        
        <div class="chat">
            <div class="chat-messages" id="chat"></div>
            <input type="text" class="chat-input" id="chat-input" placeholder="Press Enter to chat...">
        </div>
        
        <div class="status" id="status">
            <h2>Connecting to server...</h2>
            <p>WebSocket: ws://localhost:7001</p>
        </div>
    </div>
</div>

<script>
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 60; // Header height

// Game state
let ws = null;
let playerId = 'player_' + Math.random().toString(36).substr(2, 9);
let localPlayer = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    health: 100,
    score: 0,
    color: '#' + Math.floor(Math.random()*16777215).toString(16),
    name: 'Player' + Math.floor(Math.random() * 1000)
};
let gameState = {
    players: {},
    projectiles: [],
    items: [],
    enemies: []
};
let keys = {};
let mouse = { x: 0, y: 0 };

// Connect to WebSocket server
function connect() {
    ws = new WebSocket('ws://localhost:7001');
    
    ws.onopen = () => {
        console.log('Connected to server');
        document.getElementById('status').classList.add('connected');
        
        // Send join message
        ws.send(JSON.stringify({
            type: 'join',
            playerId: playerId,
            player: localPlayer
        }));
        
        // Start game loop
        gameLoop();
    };
    
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'state':
                gameState = data.state;
                updateUI();
                break;
                
            case 'player_joined':
                addChatMessage(data.player.name + ' joined the game', '#00ff88');
                break;
                
            case 'player_left':
                addChatMessage(data.playerName + ' left the game', '#ff4444');
                break;
                
            case 'chat':
                addChatMessage(data.name + ': ' + data.message);
                break;
                
            case 'hit':
                if (data.playerId === playerId) {
                    localPlayer.health = data.health;
                    flash('#ff0000');
                }
                break;
        }
    };
    
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        document.getElementById('status').innerHTML = '<h2>Connection error!</h2><p>Check if server is running</p>';
    };
    
    ws.onclose = () => {
        document.getElementById('status').classList.remove('connected');
        document.getElementById('status').innerHTML = '<h2>Disconnected</h2><p>Trying to reconnect...</p>';
        setTimeout(connect, 3000);
    };
}

// Input handling
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY - 60; // Adjust for header
});

canvas.addEventListener('click', e => {
    if (ws && ws.readyState === WebSocket.OPEN) {
        const angle = Math.atan2(mouse.y - localPlayer.y, mouse.x - localPlayer.x);
        ws.send(JSON.stringify({
            type: 'shoot',
            playerId: playerId,
            x: localPlayer.x,
            y: localPlayer.y,
            angle: angle
        }));
    }
});

// Chat
document.getElementById('chat-input').addEventListener('keypress', e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'chat',
                playerId: playerId,
                name: localPlayer.name,
                message: e.target.value
            }));
        }
        e.target.value = '';
    }
});

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update local player
    const speed = 5;
    if (keys['w'] || keys['arrowup']) localPlayer.y -= speed;
    if (keys['s'] || keys['arrowdown']) localPlayer.y += speed;
    if (keys['a'] || keys['arrowleft']) localPlayer.x -= speed;
    if (keys['d'] || keys['arrowright']) localPlayer.x += speed;
    
    // Keep in bounds
    localPlayer.x = Math.max(20, Math.min(canvas.width - 20, localPlayer.x));
    localPlayer.y = Math.max(20, Math.min(canvas.height - 20, localPlayer.y));
    
    // Send position update
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'move',
            playerId: playerId,
            x: localPlayer.x,
            y: localPlayer.y
        }));
    }
    
    // Draw grid
    ctx.strokeStyle = '#1a1a1a';
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw other players
    for (let pid in gameState.players) {
        if (pid !== playerId) {
            const player = gameState.players[pid];
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Name
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(player.name, player.x, player.y - 25);
        }
    }
    
    // Draw local player
    ctx.fillStyle = localPlayer.color;
    ctx.beginPath();
    ctx.arc(localPlayer.x, localPlayer.y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    // Health bar
    ctx.fillStyle = '#333';
    ctx.fillRect(localPlayer.x - 20, localPlayer.y - 35, 40, 5);
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(localPlayer.x - 20, localPlayer.y - 35, 40 * (localPlayer.health / 100), 5);
    
    // Draw projectiles
    gameState.projectiles.forEach(proj => {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw enemies
    gameState.enemies.forEach(enemy => {
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 15, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Draw items
    gameState.items.forEach(item => {
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(item.x - 10, item.y - 10, 20, 20);
    });
    
    requestAnimationFrame(gameLoop);
}

function updateUI() {
    document.getElementById('health').textContent = localPlayer.health;
    document.getElementById('score').textContent = localPlayer.score;
    document.getElementById('player-count').textContent = Object.keys(gameState.players).length;
    
    // Update players list
    const playersList = document.getElementById('players');
    playersList.innerHTML = Object.values(gameState.players)
        .sort((a, b) => b.score - a.score)
        .map(p => `
            <div class="player-entry">
                <span style="color: ${p.color}">${p.name}</span>
                <span>${p.score}</span>
            </div>
        `).join('');
}

function addChatMessage(message, color = '#fff') {
    const chat = document.getElementById('chat');
    const msg = document.createElement('div');
    msg.style.color = color;
    msg.style.marginBottom = '5px';
    msg.textContent = message;
    chat.appendChild(msg);
    chat.scrollTop = chat.scrollHeight;
}

function flash(color) {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
}

// Connect on load
connect();

// Handle resize
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 60;
});
</script>

</body>
</html>'''

# HTTP Server
class GameHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(GAME_HTML.encode())
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        pass

# WebSocket Server
async def handle_websocket(websocket, path):
    connected_clients.add(websocket)
    player_id = None
    
    try:
        async for message in websocket:
            data = json.loads(message)
            
            if data['type'] == 'join':
                player_id = data['playerId']
                game_state['players'][player_id] = data['player']
                
                # Notify all clients
                await broadcast({
                    'type': 'player_joined',
                    'player': data['player']
                })
                
                # Send current state to new player
                await websocket.send(json.dumps({
                    'type': 'state',
                    'state': game_state
                }))
                
            elif data['type'] == 'move':
                if data['playerId'] in game_state['players']:
                    game_state['players'][data['playerId']]['x'] = data['x']
                    game_state['players'][data['playerId']]['y'] = data['y']
                    
            elif data['type'] == 'shoot':
                projectile = {
                    'id': str(uuid.uuid4()),
                    'owner': data['playerId'],
                    'x': data['x'],
                    'y': data['y'],
                    'vx': 10 * math.cos(data['angle']),
                    'vy': 10 * math.sin(data['angle'])
                }
                game_state['projectiles'].append(projectile)
                
            elif data['type'] == 'chat':
                await broadcast({
                    'type': 'chat',
                    'name': data['name'],
                    'message': data['message']
                })
                
    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        connected_clients.remove(websocket)
        if player_id and player_id in game_state['players']:
            player_name = game_state['players'][player_id]['name']
            del game_state['players'][player_id]
            await broadcast({
                'type': 'player_left',
                'playerName': player_name
            })

async def broadcast(message):
    if connected_clients:
        await asyncio.gather(
            *[client.send(json.dumps(message)) for client in connected_clients],
            return_exceptions=True
        )

async def game_loop():
    """Main game loop - updates physics and broadcasts state"""
    while True:
        # Update projectiles
        game_state['projectiles'] = [
            p for p in game_state['projectiles']
            if 0 < p['x'] < 1920 and 0 < p['y'] < 1080
        ]
        
        for proj in game_state['projectiles']:
            proj['x'] += proj['vx']
            proj['y'] += proj['vy']
        
        # Spawn enemies occasionally
        if len(game_state['enemies']) < 5 and asyncio.get_event_loop().time() % 5 < 0.1:
            import random
            game_state['enemies'].append({
                'id': str(uuid.uuid4()),
                'x': random.randint(50, 1870),
                'y': random.randint(50, 1030),
                'health': 50
            })
        
        # Broadcast state to all clients
        await broadcast({
            'type': 'state',
            'state': game_state
        })
        
        await asyncio.sleep(1/30)  # 30 FPS

def run_http_server():
    with socketserver.TCPServer(("", HTTP_PORT), GameHTTPHandler) as httpd:
        httpd.serve_forever()

async def main():
    # Start HTTP server in thread
    http_thread = threading.Thread(target=run_http_server, daemon=True)
    http_thread.start()
    
    # Start game loop
    asyncio.create_task(game_loop())
    
    # Start WebSocket server
    await websockets.serve(handle_websocket, "localhost", WS_PORT)
    await asyncio.Future()  # Run forever

if __name__ == "__main__":
    import math  # For projectile calculations
    
    print(f"""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║              REAL MULTIPLAYER WEBSOCKET GAME               ║
║                                                            ║
║  HTTP Server: http://localhost:{HTTP_PORT}                        ║
║  WebSocket Server: ws://localhost:{WS_PORT}                       ║
║                                                            ║
║  Features:                                                 ║
║  ✓ REAL multiplayer with WebSockets                       ║
║  ✓ Multiple players can join and see each other           ║
║  ✓ Real-time position sync                                ║
║  ✓ Shooting and projectiles                               ║
║  ✓ Chat system                                            ║
║  ✓ Player list with scores                                ║
║  ✓ Python = NO FORMATTING ERRORS                          ║
║                                                            ║
║  Open multiple browser tabs to test multiplayer!          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    """)
    
    asyncio.run(main())