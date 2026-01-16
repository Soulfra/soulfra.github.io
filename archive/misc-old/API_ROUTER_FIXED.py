#!/usr/bin/env python3
"""
API ROUTER - Fixed with CORS support
"""

import http.server
import socketserver
import json
from datetime import datetime

PORT = 5000

# Service data
SERVICES = {
    'data': {
        'scores': {},
        'sessions': {},
        'reflections': []
    }
}

# Simple dashboard
DASHBOARD = """<!DOCTYPE html>
<html>
<head>
<title>API Router</title>
<style>
body { background: #000; color: #fff; font-family: Arial; padding: 20px; }
h1 { color: #0f8; }
.stats { background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0; }
.endpoint { background: #2a2a2a; padding: 10px; margin: 5px 0; border-radius: 5px; font-family: monospace; }
</style>
</head>
<body>
<h1>SOULFRA API ROUTER - PORT 5000</h1>
<div class="stats">
<h2>API Status</h2>
<p>Requests: <span id="requests">0</span></p>
<p>Reflections: <span id="reflections">0</span></p>
</div>
<div class="stats">
<h2>Endpoints</h2>
<div class="endpoint">GET /api/status</div>
<div class="endpoint">POST /api/ai/reflect</div>
<div class="endpoint">POST /api/game/score</div>
</div>
<script>
setInterval(() => {
    fetch('/api/status').then(r => r.json()).then(data => {
        document.getElementById('requests').textContent = data.requests;
        document.getElementById('reflections').textContent = data.reflections;
    });
}, 1000);
</script>
</body>
</html>"""

class RouterHandler(http.server.BaseHTTPRequestHandler):
    request_count = 0
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        RouterHandler.request_count += 1
        
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(DASHBOARD.encode())
            
        elif self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            status = {
                'router': 'online',
                'requests': RouterHandler.request_count,
                'sessions': len(SERVICES['data']['sessions']),
                'reflections': len(SERVICES['data']['reflections']),
                'games': 1,
                'timestamp': datetime.now().isoformat()
            }
            self.wfile.write(json.dumps(status).encode())
        else:
            self.send_error(404)
    
    def do_POST(self):
        RouterHandler.request_count += 1
        
        # Read post data
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            data = json.loads(post_data)
        except:
            data = {}
        
        if self.path == '/api/ai/reflect':
            # Store reflection
            reflection = {
                'text': data.get('text', ''),
                'timestamp': datetime.now().isoformat(),
                'source': data.get('source', 'unknown'),
                'score': data.get('score', 0)
            }
            SERVICES['data']['reflections'].append(reflection)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'status': 'reflected',
                'id': len(SERVICES['data']['reflections']) - 1,
                'message': 'Reflection stored for Cal Riven processing'
            }
            self.wfile.write(json.dumps(response).encode())
            
        elif self.path == '/api/game/score':
            # Store score
            SERVICES['data']['scores'][data.get('game', 'unknown')] = data.get('score', 0)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({'status': 'saved'}).encode())
            
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
    
    def log_message(self, format, *args):
        print(f"[ROUTER] {format % args}")

# Kill anything on port 5000
import os
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

print(f"API ROUTER (FIXED) - Port {PORT}")
print(f"Dashboard: http://localhost:{PORT}")
print("CORS enabled for cross-origin requests")

try:
    with socketserver.TCPServer(("", PORT), RouterHandler) as httpd:
        httpd.allow_reuse_address = True
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down...")
except Exception as e:
    print(f"Error: {e}")