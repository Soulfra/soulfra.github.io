#!/usr/bin/env python3
"""
LANGUAGE BRIDGE - Connects Python/JS/Whatever layers seamlessly
Uses JSON as universal protocol
"""

import http.server
import socketserver
import json
import os
import subprocess
import threading
import time
from pathlib import Path

PORT = 7777

# Kill existing
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class LanguageBridge:
    def __init__(self):
        self.python_services = []
        self.js_services = []
        self.universal_state = {
            'players': {},
            'games': {},
            'tokens': 1000000,
            'reflections': []
        }
        
        # Message queue between languages
        self.message_queue = []
        
        # Start bridge worker
        threading.Thread(target=self._bridge_worker, daemon=True).start()
        
    def _bridge_worker(self):
        """Process messages between different language services"""
        while True:
            if self.message_queue:
                msg = self.message_queue.pop(0)
                self._route_message(msg)
            time.sleep(0.1)
            
    def _route_message(self, msg):
        """Route messages based on target language"""
        if msg['target'] == 'python':
            # Send to Python service
            self._send_to_python(msg)
        elif msg['target'] == 'js':
            # Send to JS service
            self._send_to_js(msg)
        elif msg['target'] == 'universal':
            # Update universal state
            self._update_universal(msg)
            
    def _send_to_python(self, msg):
        """Send message to Python service via HTTP"""
        try:
            import urllib.request
            import urllib.parse
            
            data = json.dumps(msg['data']).encode()
            req = urllib.request.Request(
                f"http://localhost:{msg['port']}{msg['path']}",
                data=data,
                headers={'Content-Type': 'application/json'}
            )
            
            response = urllib.request.urlopen(req, timeout=2)
            result = json.loads(response.read())
            
            # Store result in universal state
            self.universal_state['last_python_result'] = result
            
        except Exception as e:
            print(f"Python bridge error: {e}")
            
    def _send_to_js(self, msg):
        """Send message to JS service"""
        # For now, we avoid JS to prevent formatting issues
        # This is where we'd normally send to JS services
        pass
        
    def _update_universal(self, msg):
        """Update universal state that all languages can read"""
        action = msg.get('action', 'update')
        
        if action == 'update':
            for key, value in msg.get('data', {}).items():
                if key in self.universal_state:
                    if isinstance(self.universal_state[key], dict):
                        self.universal_state[key].update(value)
                    else:
                        self.universal_state[key] = value
                        
        elif action == 'append':
            key = msg.get('key', 'reflections')
            if key in self.universal_state and isinstance(self.universal_state[key], list):
                self.universal_state[key].append(msg.get('data', {}))
                
    def register_service(self, name, language, port):
        """Register a service with the bridge"""
        service = {
            'name': name,
            'language': language,
            'port': port,
            'registered': time.time()
        }
        
        if language == 'python':
            self.python_services.append(service)
        elif language == 'js':
            self.js_services.append(service)
            
        return True
        
    def get_bridge_status(self):
        """Get complete bridge status"""
        return {
            'python_services': len(self.python_services),
            'js_services': len(self.js_services),
            'queue_size': len(self.message_queue),
            'universal_state': self.universal_state,
            'services': {
                'python': self.python_services,
                'js': self.js_services
            }
        }

# Global bridge
bridge = LanguageBridge()

# Register existing Python services
bridge.register_service('text_game', 'python', 3456)
bridge.register_service('json_api', 'python', 4444)
bridge.register_service('mirror_bridge', 'python', 8001)

class BridgeHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            # Bridge dashboard
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>LANGUAGE BRIDGE</title>
<style>
body { font-family: monospace; background: #000; color: #fff; padding: 20px; }
.language { border: 1px solid #666; padding: 10px; margin: 10px; display: inline-block; }
.python { background: #001122; }
.js { background: #112200; }
#state { background: #222; padding: 20px; margin: 20px 0; }
pre { background: #111; padding: 10px; overflow: auto; }
</style>
</head>
<body>
<h1>LANGUAGE BRIDGE</h1>
<p>Universal protocol connecting all services through JSON</p>

<div id="languages">
    <div class="language python">
        <h3>PYTHON SERVICES</h3>
        <div id="python-services"></div>
    </div>
    <div class="language js">
        <h3>JS SERVICES</h3>
        <div id="js-services"></div>
    </div>
</div>

<div id="state">
    <h3>UNIVERSAL STATE</h3>
    <pre id="universal-state"></pre>
</div>

<script>
async function update() {
    const res = await fetch('/status');
    const data = await res.json();
    
    // Python services
    let pythonHtml = '';
    for (const service of data.services.python) {
        pythonHtml += `<p>${service.name} (port ${service.port})</p>`;
    }
    document.getElementById('python-services').innerHTML = pythonHtml || '<p>None</p>';
    
    // JS services
    let jsHtml = '';
    for (const service of data.services.js) {
        jsHtml += `<p>${service.name} (port ${service.port})</p>`;
    }
    document.getElementById('js-services').innerHTML = jsHtml || '<p>None</p>';
    
    // Universal state
    document.getElementById('universal-state').textContent = 
        JSON.stringify(data.universal_state, null, 2);
}

setInterval(update, 1000);
update();
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path == '/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(bridge.get_bridge_status()).encode())
            
        elif self.path == '/universal':
            # Get universal state
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(bridge.universal_state).encode())
            
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/bridge':
            # Queue message for bridging
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                bridge.message_queue.append(data)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'queued': True}).encode())
            else:
                self.send_error(400, "No data")
                
        elif self.path == '/register':
            # Register new service
            length = int(self.headers.get('Content-Length', 0))
            if length:
                data = json.loads(self.rfile.read(length))
                success = bridge.register_service(
                    data.get('name'),
                    data.get('language'),
                    data.get('port')
                )
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': success}).encode())
            else:
                self.send_error(400, "No data")
                
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[BRIDGE] {format % args}")

# Start bridge
httpd = socketserver.TCPServer(("", PORT), BridgeHandler)
httpd.allow_reuse_address = True

print(f"\nLANGUAGE BRIDGE: http://localhost:{PORT}")
print("\nBridges between:")
print("- Python services (no formatting issues)")
print("- JavaScript services (when safe)")
print("- Future languages (Rust, Go, etc)")
print("\nUniversal JSON protocol for all communication")
print("\nEndpoints:")
print("  GET  /universal - Get universal state")
print("  POST /bridge - Queue cross-language message")
print("  POST /register - Register new service")

httpd.serve_forever()