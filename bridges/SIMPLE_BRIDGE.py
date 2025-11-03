#!/usr/bin/env python3
"""
SIMPLE BRIDGE - No UI bullshit, just works
"""

import http.server
import socketserver
import json
import os

PORT = 6666

# Kill existing
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

# Store everything here
DATA = {
    'errors': [],
    'chats': [],
    'logs': []
}

# Minimal HTML
HTML = """<!DOCTYPE html>
<html>
<body style="font-family: monospace; padding: 20px;">
<h2>Simple Bridge</h2>
<form action="/upload" method="post" enctype="multipart/form-data">
    <input type="file" name="file" accept=".txt,.json,.log">
    <input type="submit" value="Upload Chat Log">
</form>
<hr>
<h3>API Endpoints:</h3>
<pre>
POST /error   - Send error: {"message": "error text"}
POST /log     - Send log: {"message": "log text"}
GET  /data    - Get all data as JSON
POST /clear   - Clear all data
</pre>
<hr>
<h3>Recent Errors:</h3>
<pre id="errors">None yet</pre>
<script>
setInterval(() => {
    fetch('/data')
        .then(r => r.json())
        .then(d => {
            const errors = d.errors.slice(-10).map(e => e.message).join('\\n');
            document.getElementById('errors').textContent = errors || 'None yet';
        });
}, 2000);
</script>
</body>
</html>"""

class SimpleHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML.encode())
            
        elif self.path == '/data':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(DATA).encode())
            
    def do_POST(self):
        if self.path == '/error':
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))
            DATA['errors'].append(data)
            DATA['errors'] = DATA['errors'][-100:]  # Keep last 100
            
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
            
        elif self.path == '/log':
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))
            DATA['logs'].append(data)
            DATA['logs'] = DATA['logs'][-1000:]  # Keep last 1000
            
            self.send_response(200)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}')
            
        elif self.path == '/clear':
            DATA['errors'] = []
            DATA['chats'] = []
            DATA['logs'] = []
            
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'{"status":"cleared"}')
            
        elif self.path == '/upload':
            # Handle file upload (basic form post)
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<html><body>Upload received. <a href="/">Back</a></body></html>')
            
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def log_message(self, format, *args):
        print(f"[{self.command}] {format % args}")

print(f"\nSIMPLE BRIDGE at http://localhost:{PORT}")
print("\nTo send errors from your code:")
print("fetch('http://localhost:6666/error', {")
print("  method: 'POST',")
print("  headers: {'Content-Type': 'application/json'},")
print("  body: JSON.stringify({message: 'your error'})")
print("})")
print("\nGet all data: http://localhost:6666/data")

with socketserver.TCPServer(("", PORT), SimpleHandler) as httpd:
    httpd.allow_reuse_address = True
    httpd.serve_forever()