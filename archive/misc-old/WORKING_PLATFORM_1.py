#!/usr/bin/env python3
"""
WORKING PLATFORM - Everything on one port to avoid issues
Game + API router combined
"""

import http.server
import socketserver
import json
import os
from datetime import datetime

PORT = 3002

# Kill anything on this port
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

# Game state
game_data = {
    'clicks': 0,
    'reflections': [],
    'api_calls': 0
}

HTML = """<!DOCTYPE html>
<html>
<head>
<title>SOULFRA PLATFORM</title>
<style>
body { background: #000; color: #fff; font-family: Arial; margin: 0; }
.header { background: linear-gradient(45deg, #00ff88, #00ccff); padding: 20px; text-align: center; }
.header h1 { margin: 0; color: #000; }
.container { display: flex; height: calc(100vh - 80px); }
.game { flex: 1; padding: 40px; text-align: center; }
.api { flex: 1; background: #1a1a1a; padding: 40px; }
button { font-size: 48px; padding: 30px 60px; background: #0f8; border: none; cursor: pointer; border-radius: 10px; margin: 10px; }
button:hover { background: #0fa; transform: scale(1.05); }
#score { font-size: 72px; color: #ff0; margin: 20px; }
.stat { background: #2a2a2a; padding: 15px; margin: 10px 0; border-radius: 10px; }
.reflection-box { background: #2a2a2a; padding: 20px; border-radius: 10px; margin: 20px 0; }
textarea { width: 100%; background: #1a1a1a; color: #fff; border: 1px solid #444; padding: 10px; border-radius: 5px; }
.api-log { background: #000; padding: 10px; border-radius: 5px; max-height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; }
.endpoint { background: #333; padding: 10px; margin: 5px 0; border-radius: 5px; font-family: monospace; }
</style>
</head>
<body>

<div class="header">
<h1>SOULFRA INTEGRATED PLATFORM</h1>
<p>Game + API Router on Port 3002</p>
</div>

<div class="container">
<div class="game">
<h2>CONNECTED CLICKER</h2>
<div id="score">0</div>
<button onclick="incrementScore()">CLICK ME</button>
<button onclick="saveScore()">SAVE TO API</button>

<div class="reflection-box">
<h3>Send Reflection</h3>
<textarea id="reflection" rows="3" placeholder="What are you thinking?"></textarea>
<button onclick="sendReflection()" style="font-size: 24px; padding: 10px 20px;">SEND</button>
</div>
</div>

<div class="api">
<h2>API ROUTER</h2>
<div class="stat">
<strong>Total Clicks:</strong> <span id="total-clicks">0</span>
</div>
<div class="stat">
<strong>API Calls:</strong> <span id="api-calls">0</span>
</div>
<div class="stat">
<strong>Reflections:</strong> <span id="reflection-count">0</span>
</div>

<h3>API Endpoints</h3>
<div class="endpoint">GET /api/status</div>
<div class="endpoint">POST /api/score</div>
<div class="endpoint">POST /api/reflect</div>
<div class="endpoint">GET /api/data</div>

<h3>Activity Log</h3>
<div class="api-log" id="log">
<div style="color: #0f8;">[SYSTEM] Platform started</div>
</div>
</div>
</div>

<script>
let score = 0;

function incrementScore() {
    score++;
    document.getElementById('score').textContent = score;
}

async function saveScore() {
    const response = await fetch('/api/score', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({score: score})
    });
    const result = await response.json();
    addLog('Score saved: ' + score);
    updateStats();
}

async function sendReflection() {
    const text = document.getElementById('reflection').value;
    if (!text) return;
    
    const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: text, score: score})
    });
    const result = await response.json();
    
    document.getElementById('reflection').value = '';
    addLog('Reflection sent: ' + text.substring(0, 30) + '...');
    updateStats();
}

async function updateStats() {
    const response = await fetch('/api/data');
    const data = await response.json();
    
    document.getElementById('total-clicks').textContent = data.clicks;
    document.getElementById('api-calls').textContent = data.api_calls;
    document.getElementById('reflection-count').textContent = data.reflections.length;
}

function addLog(msg) {
    const log = document.getElementById('log');
    const entry = document.createElement('div');
    entry.style.color = '#888';
    entry.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
}

// Update stats every second
setInterval(updateStats, 1000);
</script>

</body>
</html>"""

class PlatformHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML.encode())
            
        elif self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            status = {
                'platform': 'online',
                'port': PORT,
                'timestamp': datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(status).encode())
            
        elif self.path == '/api/data':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(game_data).encode())
            
        else:
            self.send_error(404)
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            data = json.loads(post_data)
        except:
            data = {}
        
        game_data['api_calls'] += 1
        
        if self.path == '/api/score':
            game_data['clicks'] = data.get('score', 0)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'saved'}).encode())
            
        elif self.path == '/api/reflect':
            reflection = {
                'text': data.get('text', ''),
                'score': data.get('score', 0),
                'timestamp': datetime.now().isoformat()
            }
            game_data['reflections'].append(reflection)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                'status': 'reflected',
                'id': len(game_data['reflections']) - 1
            }
            self.wfile.write(json.dumps(response).encode())
            
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
    
    def log_message(self, format, *args):
        print(f"[PLATFORM] {format % args}")

# Start server
httpd = socketserver.TCPServer(("", PORT), PlatformHandler)
httpd.allow_reuse_address = True

print(f"""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║               SOULFRA WORKING PLATFORM                     ║
║                                                            ║
║  Running at: http://localhost:{PORT}                       ║
║                                                            ║
║  Features:                                                 ║
║  ✓ Game and API router on same port (no CORS issues)      ║
║  ✓ Click game with score tracking                         ║
║  ✓ Reflection system for Cal Riven                        ║
║  ✓ Real-time API statistics                               ║
║  ✓ Activity logging                                       ║
║                                                            ║
║  Everything in one place = Actually works!                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
""")

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down...")
    httpd.shutdown()