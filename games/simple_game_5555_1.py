#!/usr/bin/env python3
import http.server
import socketserver
import threading
import time

PORT = 5555

HTML = """<!DOCTYPE html>
<html>
<head>
<title>Simple Arena</title>
<style>
body { background: #000; color: #fff; font-family: Arial; text-align: center; padding: 50px; }
h1 { color: #0f8; }
.game { background: #111; border: 2px solid #0f8; padding: 50px; margin: 20px auto; max-width: 600px; }
.score { font-size: 48px; color: #ff0; }
button { background: #0f8; color: #000; border: none; padding: 20px 40px; font-size: 24px; cursor: pointer; margin: 10px; }
</style>
</head>
<body>
<h1>Simple Arena</h1>
<div class="game">
<p>SUPER SIMPLE CLICKER GAME</p>
<div class="score" id="score">0</div>
<button onclick="addScore()">CLICK ME!</button>
<button onclick="reset()">RESET</button>
</div>
<script>
var score = 0;
function addScore() {
    score += 10;
    document.getElementById('score').textContent = score;
}
function reset() {
    score = 0;
    document.getElementById('score').textContent = score;
}
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
os.system(f'lsof -ti :5555 | xargs kill -9 2>/dev/null')
time.sleep(0.5)

# Start server
try:
    httpd = socketserver.TCPServer(("", PORT), Handler)
    httpd.allow_reuse_address = True
    print(f"Simple Arena started on port 5555")
    httpd.serve_forever()
except Exception as e:
    print(f"Error starting Simple Arena: {e}")
