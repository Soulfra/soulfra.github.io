#!/usr/bin/env python3
"""
NO EMOJI API - Pure JSON/Text responses, no formatting issues
"""

import http.server
import socketserver
import json
import os

PORT = 4444

os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

# Pure data, no emojis
GAME_STATE = {
    'players': {},
    'scores': [],
    'tokens': 1000000
}

class PureAPIHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        # Only JSON responses
        if self.path == '/':
            self.send_json({
                'service': 'NO_EMOJI_API',
                'version': '1.0.0',
                'endpoints': [
                    'GET /status',
                    'GET /game/state',
                    'POST /game/action',
                    'POST /player/create'
                ]
            })
            
        elif self.path == '/status':
            self.send_json({
                'status': 'online',
                'players_online': len(GAME_STATE['players']),
                'total_tokens': GAME_STATE['tokens']
            })
            
        elif self.path == '/game/state':
            self.send_json(GAME_STATE)
            
        else:
            self.send_json({'error': 'not_found'}, 404)
            
    def do_POST(self):
        data = self.get_json_body()
        
        if self.path == '/game/action':
            action = data.get('action', 'unknown')
            player_id = data.get('player_id', 'anonymous')
            
            if action == 'click':
                if player_id not in GAME_STATE['players']:
                    GAME_STATE['players'][player_id] = {'score': 0, 'tokens': 100}
                    
                GAME_STATE['players'][player_id]['score'] += 1
                
                self.send_json({
                    'success': True,
                    'new_score': GAME_STATE['players'][player_id]['score']
                })
            else:
                self.send_json({'error': 'invalid_action'}, 400)
                
        elif self.path == '/player/create':
            player_id = data.get('id', f'player_{len(GAME_STATE["players"])}')
            
            GAME_STATE['players'][player_id] = {
                'score': 0,
                'tokens': 100,
                'created': int(time.time())
            }
            
            self.send_json({
                'success': True,
                'player_id': player_id,
                'initial_tokens': 100
            })
            
        else:
            self.send_json({'error': 'not_found'}, 404)
            
    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
        
    def get_json_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length:
            return json.loads(self.rfile.read(length))
        return {}
        
    def log_message(self, format, *args):
        print(f"[API] {format % args}")

# Simple text client
SIMPLE_CLIENT = """<!DOCTYPE html>
<html>
<head>
<title>Simple Client</title>
</head>
<body style="font-family: monospace; padding: 20px;">
<h2>Simple Game Client</h2>
<div>Score: <span id="score">0</span></div>
<button onclick="doClick()">Click</button>
<pre id="log"></pre>
<script>
let playerId = 'player_' + Date.now();

async function doClick() {
    const response = await fetch('http://localhost:4444/game/action', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            action: 'click',
            player_id: playerId
        })
    });
    
    const data = await response.json();
    document.getElementById('score').textContent = data.new_score || 0;
    document.getElementById('log').textContent = JSON.stringify(data, null, 2);
}
</script>
</body>
</html>"""

# Save client
with open('simple_client.html', 'w') as f:
    f.write(SIMPLE_CLIENT)

import time

httpd = socketserver.TCPServer(("", PORT), PureAPIHandler)
httpd.allow_reuse_address = True

print(f"\nPURE API (NO EMOJIS): http://localhost:{PORT}")
print("\nEndpoints:")
print("  GET  /status")
print("  GET  /game/state") 
print("  POST /game/action")
print("  POST /player/create")
print("\nSimple client saved to: simple_client.html")
print("\nThis API returns ONLY JSON - no formatting issues!")

httpd.serve_forever()