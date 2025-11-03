#!/usr/bin/env python3
"""
CONNECTED GAME - Simple game that connects to the API router
Building from our working base on port 3000
"""

import http.server
import socketserver
import os

PORT = 3001

# Kill anything on this port
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

# Enhanced game that talks to the router
HTML = b"""<!DOCTYPE html>
<html>
<head>
<title>CONNECTED CLICKER</title>
<style>
body { background: #000; color: #fff; font-family: Arial; text-align: center; padding: 20px; }
.container { max-width: 800px; margin: 0 auto; }
h1 { color: #0f8; font-size: 48px; }
.game-area { background: #1a1a1a; padding: 40px; border-radius: 20px; margin: 20px 0; }
button { font-size: 48px; padding: 30px 60px; background: #0f8; border: none; cursor: pointer; border-radius: 10px; margin: 10px; }
button:hover { background: #0fa; transform: scale(1.05); }
#score { font-size: 72px; color: #ff0; margin: 20px; }
.stats { display: flex; justify-content: center; gap: 40px; margin: 20px; }
.stat { background: #2a2a2a; padding: 20px; border-radius: 10px; }
.stat-label { color: #888; font-size: 14px; }
.stat-value { color: #0f8; font-size: 24px; font-weight: bold; }
.reflection { background: #2a2a2a; padding: 20px; border-radius: 10px; margin: 20px 0; }
.reflection textarea { width: 100%; background: #1a1a1a; color: #fff; border: 1px solid #444; padding: 10px; border-radius: 5px; }
.api-status { position: absolute; top: 10px; right: 10px; padding: 10px; background: #1a1a1a; border-radius: 10px; }
.online { color: #0f8; }
.offline { color: #f44; }
</style>
</head>
<body>

<div class="api-status">
API: <span id="api-status" class="offline">Connecting...</span>
</div>

<div class="container">
<h1>CONNECTED CLICKER</h1>
<p>Now with API integration!</p>

<div class="game-area">
<div id="score">0</div>
<button onclick="incrementScore()">CLICK ME</button>
<button onclick="saveScore()">SAVE SCORE</button>
</div>

<div class="stats">
<div class="stat">
<div class="stat-label">Clicks This Session</div>
<div class="stat-value" id="session-clicks">0</div>
</div>
<div class="stat">
<div class="stat-label">Total API Calls</div>
<div class="stat-value" id="api-calls">0</div>
</div>
<div class="stat">
<div class="stat-label">Reflections Sent</div>
<div class="stat-value" id="reflections">0</div>
</div>
</div>

<div class="reflection">
<h3>Send Reflection to Cal Riven</h3>
<textarea id="reflection-text" rows="3" placeholder="What are you thinking about?"></textarea>
<button onclick="sendReflection()">SEND TO AI</button>
</div>

<div id="messages"></div>
</div>

<script>
let score = 0;
let sessionClicks = 0;
let apiCalls = 0;
let reflectionCount = 0;

// Check API status
async function checkAPI() {
    try {
        const response = await fetch('http://localhost:5000/api/status');
        if (response.ok) {
            document.getElementById('api-status').textContent = 'ONLINE';
            document.getElementById('api-status').className = 'online';
            return true;
        }
    } catch (e) {
        document.getElementById('api-status').textContent = 'OFFLINE';
        document.getElementById('api-status').className = 'offline';
    }
    return false;
}

// Increment score
function incrementScore() {
    score++;
    sessionClicks++;
    document.getElementById('score').textContent = score;
    document.getElementById('session-clicks').textContent = sessionClicks;
    
    // Send to API every 10 clicks
    if (score % 10 === 0) {
        sendScoreUpdate();
    }
}

// Save score to API
async function saveScore() {
    if (await checkAPI()) {
        try {
            apiCalls++;
            document.getElementById('api-calls').textContent = apiCalls;
            
            const response = await fetch('http://localhost:5000/api/game/score', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    game: 'connected_clicker',
                    score: score,
                    clicks: sessionClicks,
                    timestamp: new Date().toISOString()
                })
            });
            
            showMessage('Score saved to API!', 'success');
        } catch (e) {
            showMessage('Failed to save score', 'error');
        }
    } else {
        showMessage('API is offline', 'error');
    }
}

// Send score update (background)
async function sendScoreUpdate() {
    if (await checkAPI()) {
        apiCalls++;
        document.getElementById('api-calls').textContent = apiCalls;
        
        fetch('http://localhost:5000/api/game/update', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({score: score})
        }).catch(() => {});
    }
}

// Send reflection to AI
async function sendReflection() {
    const text = document.getElementById('reflection-text').value;
    if (!text) return;
    
    if (await checkAPI()) {
        try {
            apiCalls++;
            reflectionCount++;
            document.getElementById('api-calls').textContent = apiCalls;
            document.getElementById('reflections').textContent = reflectionCount;
            
            const response = await fetch('http://localhost:5000/api/ai/reflect', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    text: text,
                    source: 'connected_clicker',
                    score: score
                })
            });
            
            const result = await response.json();
            showMessage('Reflection sent to Cal Riven! ID: ' + result.id, 'success');
            document.getElementById('reflection-text').value = '';
        } catch (e) {
            showMessage('Failed to send reflection', 'error');
        }
    } else {
        showMessage('API is offline - start the router on port 5000', 'error');
    }
}

// Show message
function showMessage(text, type) {
    const msg = document.createElement('div');
    msg.style.padding = '10px';
    msg.style.margin = '10px 0';
    msg.style.borderRadius = '5px';
    msg.style.background = type === 'success' ? '#0f8' : '#f44';
    msg.style.color = '#000';
    msg.textContent = text;
    document.getElementById('messages').appendChild(msg);
    setTimeout(() => msg.remove(), 3000);
}

// Initial check
checkAPI();
setInterval(checkAPI, 5000);
</script>

</body>
</html>"""

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(HTML)
    
    def log_message(self, format, *args):
        return

# Start server
httpd = socketserver.TCPServer(("", PORT), Handler)
httpd.allow_reuse_address = True

print(f"CONNECTED CLICKER GAME")
print(f"Running at: http://localhost:{PORT}")
print(f"This game connects to the API Router on port 5000")
print(f"Features: Score saving, AI reflections, API integration")
print(f"Press Ctrl+C to stop")

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nStopping...")
    httpd.shutdown()