#!/usr/bin/env python3
"""
LAUNCH REAL GAMES - Each port gets its actual game, not duplicates
"""

import os
import sys
import subprocess
import socket
import time

def find_safe_port(start=10000, used_ports=[]):
    """Find a free port"""
    for port in range(start, 65535):
        if port in used_ports:
            continue
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        if result != 0:
            return port
    return None

print("🎮 LAUNCHING THE REAL GAMES - EACH ONE DIFFERENT!")
print("=" * 60)

# Kill any existing game processes on our ports
for port in range(10000, 10010):
    subprocess.run(['lsof', '-ti', f':{port}'], capture_output=True)
    
# Find the actual game files
base_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(base_dir)

games_to_launch = []
used_ports = []

# 1. Find Character Creator
char_creator = os.path.join(parent_dir, 'DRAG_DROP_CHARACTER_CREATOR.py')
if os.path.exists(char_creator):
    port = find_safe_port(10000, used_ports)
    used_ports.append(port)
    games_to_launch.append({
        'name': 'Drag & Drop Character Creator',
        'file': char_creator,
        'port': port,
        'type': 'python',
        'desc': 'Drag images to create custom characters'
    })
    print(f"✅ Found Character Creator - will launch on port {port}")
else:
    print("❌ Character Creator not found")

# 2. Find Habbo Hotel Rooms
habbo = os.path.join(parent_dir, 'HABBO_HOTEL_ROOMS.js')
if os.path.exists(habbo):
    port = find_safe_port(10001, used_ports)
    used_ports.append(port)
    games_to_launch.append({
        'name': 'Habbo Hotel Rooms',
        'file': habbo,
        'port': port,
        'type': 'node',
        'desc': 'Click to move, chat, multiple rooms'
    })
    print(f"✅ Found Habbo Rooms - will launch on port {port}")
else:
    print("❌ Habbo Rooms not found")

# 3. Find existing multiplayer game
multiplayer = os.path.join(parent_dir, 'MULTIPLAYER_WEBSOCKET_GAME.py')
if os.path.exists(multiplayer):
    # Need to fix the port in the file
    port = find_safe_port(10002, used_ports)
    used_ports.append(port)
    
    # Read and modify the file to use our port
    with open(multiplayer, 'r') as f:
        content = f.read()
    
    # Replace the ports
    content = content.replace('HTTP_PORT = 7000', f'HTTP_PORT = {port}')
    content = content.replace('WS_PORT = 7001', f'WS_PORT = {port + 1}')
    
    # Save as temporary file
    temp_file = f'TEMP_MULTIPLAYER_{port}.py'
    with open(temp_file, 'w') as f:
        f.write(content)
    
    games_to_launch.append({
        'name': 'Multiplayer WebSocket Game',
        'file': temp_file,
        'port': port,
        'type': 'python',
        'desc': 'Real multiplayer with WebSockets'
    })
    print(f"✅ Found Multiplayer Game - will launch on port {port}")

# 4. Find Simple Character Game  
simple_game = os.path.join(parent_dir, 'SIMPLE_CHARACTER_GAME.py')
if os.path.exists(simple_game):
    port = find_safe_port(10003, used_ports)
    used_ports.append(port)
    games_to_launch.append({
        'name': 'Simple Character Game',
        'file': simple_game,
        'port': port,
        'type': 'python',
        'desc': 'Top-down shooter with character classes'
    })
    print(f"✅ Found Simple Character Game - will launch on port {port}")

# 5. Create a simple but different game for testing
port = find_safe_port(10004, used_ports)
used_ports.append(port)
gladiator_game = f'''#!/usr/bin/env python3
"""
Gladiator Arena - Different from the others
"""
from http.server import HTTPServer, BaseHTTPRequestHandler

HTML = """<!DOCTYPE html>
<html>
<head>
<title>Gladiator Arena</title>
<style>
body {{ background: #222; color: #fff; font-family: Arial; text-align: center; padding: 20px; }}
.arena {{ width: 800px; height: 600px; margin: 0 auto; background: #333; border: 3px solid gold; position: relative; }}
.gladiator {{ position: absolute; width: 50px; height: 50px; transition: all 0.3s; }}
.player {{ background: #00f; border-radius: 50%; }}
.enemy {{ background: #f00; border-radius: 50%; }}
.info {{ margin: 20px 0; font-size: 1.2em; }}
button {{ padding: 10px 20px; font-size: 1.1em; margin: 10px; cursor: pointer; }}
</style>
</head>
<body>
<h1>⚔️ GLADIATOR ARENA ⚔️</h1>
<div class="info">Port {port} - This is a DIFFERENT game!</div>
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
let playerPos = {{ x: 375, y: 275 }};
let enemyPos = {{ x: 100, y: 100 }};
let score = 0;

function movePlayer(dir) {{
    const step = 50;
    switch(dir) {{
        case 'up': playerPos.y = Math.max(0, playerPos.y - step); break;
        case 'down': playerPos.y = Math.min(550, playerPos.y + step); break;
        case 'left': playerPos.x = Math.max(0, playerPos.x - step); break;
        case 'right': playerPos.x = Math.min(750, playerPos.x + step); break;
    }}
    updatePositions();
}}

function updatePositions() {{
    document.getElementById('player').style.left = playerPos.x + 'px';
    document.getElementById('player').style.top = playerPos.y + 'px';
    
    // Move enemy randomly
    enemyPos.x += (Math.random() - 0.5) * 100;
    enemyPos.y += (Math.random() - 0.5) * 100;
    enemyPos.x = Math.max(0, Math.min(750, enemyPos.x));
    enemyPos.y = Math.max(0, Math.min(550, enemyPos.y));
    
    document.getElementById('enemy').style.left = enemyPos.x + 'px';
    document.getElementById('enemy').style.top = enemyPos.y + 'px';
}}

function attack() {{
    const dist = Math.sqrt(Math.pow(playerPos.x - enemyPos.x, 2) + Math.pow(playerPos.y - enemyPos.y, 2));
    if (dist < 100) {{
        score += 10;
        document.getElementById('status').textContent = 'HIT! Score: ' + score;
        // Teleport enemy
        enemyPos.x = Math.random() * 750;
        enemyPos.y = Math.random() * 550;
        updatePositions();
    }} else {{
        document.getElementById('status').textContent = 'Too far away! Get closer!';
    }}
}}

// Auto move enemy
setInterval(() => {{
    enemyPos.x += (Math.random() - 0.5) * 50;
    enemyPos.y += (Math.random() - 0.5) * 50;
    enemyPos.x = Math.max(0, Math.min(750, enemyPos.x));
    enemyPos.y = Math.max(0, Math.min(550, enemyPos.y));
    document.getElementById('enemy').style.left = enemyPos.x + 'px';
    document.getElementById('enemy').style.top = enemyPos.y + 'px';
}}, 1000);
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
    server = HTTPServer(('localhost', {port}), Handler)
    print(f'Gladiator Arena on port {port}')
    server.serve_forever()
'''

gladiator_file = 'GLADIATOR_SIMPLE.py'
with open(gladiator_file, 'w') as f:
    f.write(gladiator_game)

games_to_launch.append({
    'name': 'Gladiator Arena',
    'file': gladiator_file,
    'port': port,
    'type': 'python',
    'desc': 'Simple arena combat game'
})

print(f"\n🚀 Launching {len(games_to_launch)} different games...\n")

# Launch each game
launched = []
for game in games_to_launch:
    print(f"Starting {game['name']}...")
    
    try:
        if game['type'] == 'python':
            # For Python games that have hardcoded ports, we need to modify them
            if 'CHARACTER_CREATOR' in game['file']:
                # Read and modify port
                with open(game['file'], 'r') as f:
                    content = f.read()
                content = content.replace('PORT = 6969', f'PORT = {game["port"]}')
                
                temp_file = f'TEMP_{game["port"]}.py'
                with open(temp_file, 'w') as f:
                    f.write(content)
                game['file'] = temp_file
                
            cmd = [sys.executable, game['file']]
        elif game['type'] == 'node':
            # For Node.js games
            cmd = ['node', game['file']]
        else:
            continue
            
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True
        )
        
        launched.append({
            'name': game['name'],
            'port': game['port'],
            'desc': game['desc'],
            'pid': process.pid
        })
        
        print(f"   ✅ Started on port {game['port']} (PID: {process.pid})")
        
    except Exception as e:
        print(f"   ❌ Failed to launch: {e}")

# Wait and test
time.sleep(3)

print("\n" + "=" * 60)
print("🎮 GAMES LAUNCHED - EACH ONE IS DIFFERENT!")
print("=" * 60)

for game in launched:
    # Test if accessible
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)
    result = sock.connect_ex(('localhost', game['port']))
    sock.close()
    
    if result == 0:
        print(f"\n✅ {game['name']}")
        print(f"   URL: http://localhost:{game['port']}")
        print(f"   Description: {game['desc']}")
    else:
        print(f"\n❌ {game['name']} - Not responding on port {game['port']}")

print("\n💡 Each game is now ACTUALLY DIFFERENT!")
print("   No more duplicates - real variety!")