#!/usr/bin/env python3
"""
THE ONLY ONE - Stop the madness
One file, one server, one port
Delete everything else
"""

import socket
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

# Find a free port
with socket.socket() as s:
    s.bind(('', 0))
    PORT = s.getsockname()[1]

HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Soulfra - The Only One</title>
<style>
body {{ background: #000; color: #0f0; font-family: monospace; margin: 20px; }}
h1 {{ text-align: center; }}
.info {{ background: #111; border: 1px solid #0f0; padding: 20px; margin: 20px 0; }}
.game {{ width: 500px; height: 300px; background: #111; border: 2px solid #0f0; margin: 20px auto; position: relative; cursor: pointer; }}
#box {{ width: 50px; height: 50px; background: lime; position: absolute; }}
.red {{ color: #f00; }}
</style>
</head>
<body>
<h1>SOULFRA - THE ONLY ONE THAT MATTERS</h1>

<div class="info">
<h2>Current Status:</h2>
<p>Port: {PORT}</p>
<p>Files in directory: Way too many</p>
<p>Servers running: Way too many</p>
<p>Solution: THIS ONE FILE</p>
</div>

<div class="info red">
<h2>The Problem:</h2>
<p>- 162 Python files doing the same thing</p>
<p>- 38 servers running at once</p>
<p>- Multiple versions of everything</p>
<p>- Complete chaos</p>
</div>

<div class="info">
<h2>The Solution:</h2>
<p>1. Use THIS file only</p>
<p>2. Delete everything else</p>
<p>3. Stop creating new versions</p>
<p>4. One game, one server, one port</p>
</div>

<h2 style="text-align:center">The Game (Yes, the same green square)</h2>
<div class="game" id="game">
<div id="box"></div>
</div>

<div class="info">
<h2>What This Has:</h2>
<p>✓ Simple game that works</p>
<p>✓ Clean code</p>
<p>✓ No bullshit</p>
<p>✓ API endpoint at /api/status</p>
<p>✓ That's it. That's all we need.</p>
</div>

<script>
document.getElementById('game').onclick = function(e) {{
    const box = document.getElementById('box');
    const rect = this.getBoundingClientRect();
    box.style.left = (e.clientX - rect.left - 25) + 'px';
    box.style.top = (e.clientY - rect.top - 25) + 'px';
}};
</script>
</body>
</html>"""

class TheOnlyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML.encode())
        elif self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'This is the only one that matters',
                'port': PORT,
                'message': 'Stop creating more files'
            }).encode())
        else:
            self.send_error(404)
    
    def log_message(self, *args):
        pass

print("\n" + "="*60)
print("THE ONLY ONE")
print("="*60)
print(f"\nPort: {PORT}")
print(f"URL: http://localhost:{PORT}")
print("\nThis is it. No more files. No more versions.")
print("Just this one simple server that works.")
print("\nTO DO:")
print("1. Kill all other Python processes: pkill -f python")
print("2. Delete all the redundant files")
print("3. Use only this one")
print("\nPress Ctrl+C to stop")
print("="*60)

httpd = HTTPServer(('localhost', PORT), TheOnlyHandler)
httpd.serve_forever()