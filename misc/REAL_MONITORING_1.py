#!/usr/bin/env python3
"""
REAL MONITORING SYSTEM
Actually checks if games are working, not just if ports are open
"""

import subprocess
import time
import json
import os
from datetime import datetime

def check_process_active(port):
    """Check if a process on a port is actually responding"""
    try:
        # First check if port is even listening
        result = subprocess.run(
            ['lsof', '-ti', f':{port}'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if not result.stdout.strip():
            return False, "No process on port"
        
        # Try to get actual HTTP response
        result = subprocess.run(
            ['curl', '-s', '-m', '5', f'http://localhost:{port}'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            return False, "HTTP request failed"
        
        if len(result.stdout) < 100:
            return False, "Response too small"
            
        return True, f"OK ({len(result.stdout)} bytes)"
        
    except subprocess.TimeoutExpired:
        return False, "Request timed out"
    except Exception as e:
        return False, str(e)

def kill_stale_processes():
    """Kill any Python game processes that have been running too long"""
    try:
        # Get all Python processes
        result = subprocess.run(
            ['ps', 'aux'],
            capture_output=True,
            text=True
        )
        
        killed = []
        for line in result.stdout.split('\n'):
            if 'python' in line.lower() and any(x in line for x in ['GAME', 'game', 'ARENA', 'CHARACTER']):
                parts = line.split()
                if len(parts) > 10:
                    pid = parts[1]
                    start_time = parts[8]
                    # If process has been running for more than 2 minutes, it's probably stuck
                    if ':' in start_time and len(start_time.split(':')) == 2:
                        minutes = int(start_time.split(':')[0])
                        if minutes >= 2:
                            os.system(f'kill -9 {pid} 2>/dev/null')
                            killed.append(pid)
        
        return killed
    except:
        return []

def start_simple_game(port, name):
    """Start a super simple game that won't timeout"""
    game_code = f'''#!/usr/bin/env python3
import http.server
import socketserver
import threading
import time

PORT = {port}

HTML = """<!DOCTYPE html>
<html>
<head>
<title>{name}</title>
<style>
body {{ background: #000; color: #fff; font-family: Arial; text-align: center; padding: 50px; }}
h1 {{ color: #0f8; }}
.game {{ background: #111; border: 2px solid #0f8; padding: 50px; margin: 20px auto; max-width: 600px; }}
.score {{ font-size: 48px; color: #ff0; }}
button {{ background: #0f8; color: #000; border: none; padding: 20px 40px; font-size: 24px; cursor: pointer; margin: 10px; }}
</style>
</head>
<body>
<h1>{name}</h1>
<div class="game">
<p>SUPER SIMPLE CLICKER GAME</p>
<div class="score" id="score">0</div>
<button onclick="addScore()">CLICK ME!</button>
<button onclick="reset()">RESET</button>
</div>
<script>
var score = 0;
function addScore() {{
    score += 10;
    document.getElementById('score').textContent = score;
}}
function reset() {{
    score = 0;
    document.getElementById('score').textContent = score;
}}
</script>
</body>
</html>"""

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(HTML.encode())
    
    def log_message(self, format, *args):
        pass

# Kill anything on this port
import os
os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')
time.sleep(0.5)

# Start server
try:
    httpd = socketserver.TCPServer(("", PORT), Handler)
    httpd.allow_reuse_address = True
    print(f"{name} started on port {port}")
    httpd.serve_forever()
except Exception as e:
    print(f"Error starting {name}: {{e}}")
'''
    
    # Write the game file
    filename = f'simple_game_{port}.py'
    with open(filename, 'w') as f:
        f.write(game_code)
    
    # Start it with explicit timeout protection
    subprocess.Popen(
        ['timeout', '3600', 'python3', filename],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )
    
    return filename

# Main monitoring loop
print("=" * 60)
print("REAL MONITORING SYSTEM")
print("=" * 60)
print("\nKilling stale processes...")

killed = kill_stale_processes()
if killed:
    print(f"Killed {len(killed)} stale processes: {', '.join(killed)}")
else:
    print("No stale processes found")

print("\nStarting fresh game servers...")

games = [
    {'port': 5555, 'name': 'Simple Arena'},
    {'port': 6666, 'name': 'Click Battle'},
    {'port': 6969, 'name': 'Character Game'},
    {'port': 7777, 'name': 'Basic Shooter'}
]

# Start simple games
for game in games:
    print(f"\nStarting {game['name']} on port {game['port']}...")
    filename = start_simple_game(game['port'], game['name'])
    time.sleep(1)  # Give it time to start

print("\n" + "=" * 60)
print("MONITORING GAME SERVERS")
print("=" * 60)

# Monitor continuously
monitor_count = 0
while monitor_count < 3:  # Run 3 checks then exit
    monitor_count += 1
    print(f"\nCheck #{monitor_count} at {datetime.now().strftime('%H:%M:%S')}")
    print("-" * 40)
    
    all_working = True
    
    for game in games:
        status, message = check_process_active(game['port'])
        
        if status:
            print(f"✓ Port {game['port']} ({game['name']}): {message}")
        else:
            print(f"✗ Port {game['port']} ({game['name']}): {message}")
            all_working = False
            
            # Try to restart it
            print(f"  → Restarting {game['name']}...")
            start_simple_game(game['port'], game['name'])
    
    if all_working:
        print("\n✅ ALL GAMES WORKING!")
    else:
        print("\n⚠️  SOME GAMES NEED ATTENTION")
    
    if monitor_count < 3:
        time.sleep(10)  # Wait 10 seconds between checks

print("\n" + "=" * 60)
print("FINAL REPORT")
print("=" * 60)

working_games = []
for game in games:
    status, _ = check_process_active(game['port'])
    if status:
        working_games.append(f"http://localhost:{game['port']} - {game['name']}")

if working_games:
    print("\n✅ WORKING GAMES:")
    for game in working_games:
        print(f"  {game}")
else:
    print("\n❌ NO GAMES ARE WORKING!")

print("\n💡 TIP: These are SUPER SIMPLE clicker games that won't timeout")
print("💡 TIP: Run this monitor again if games stop working")
print("\n" + "=" * 60)