#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import socket

PORT = 6666

class GameHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        html = '''<!DOCTYPE html>
<html>
<head>
<title>FIXED WORKING GAME</title>
<style>
body { margin: 0; background: #000; color: #fff; font-family: Arial; text-align: center; }
canvas { border: 2px solid #0f8; margin: 20px; background: #111; }
</style>
</head>
<body>
<h1 style="color: #0f8;">CLICK TO SHOOT</h1>
<p>Score: <span id="s">0</span></p>
<canvas id="c" width="600" height="400"></canvas>
<script>
var c = document.getElementById("c"), ctx = c.getContext("2d"), enemies = [], score = 0;
setInterval(function() {
    enemies.push({x: Math.random() * 600, y: 0});
}, 1000);
c.onclick = function(e) {
    var rect = c.getBoundingClientRect();
    var mx = e.clientX - rect.left, my = e.clientY - rect.top;
    for (var i = enemies.length - 1; i >= 0; i--) {
        if (Math.abs(enemies[i].x - mx) < 30 && Math.abs(enemies[i].y - my) < 30) {
            enemies.splice(i, 1);
            score += 10;
            document.getElementById("s").textContent = score;
        }
    }
};
function draw() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, 600, 400);
    for (var i = enemies.length - 1; i >= 0; i--) {
        enemies[i].y += 3;
        ctx.fillStyle = "#f44";
        ctx.fillRect(enemies[i].x - 15, enemies[i].y - 15, 30, 30);
        if (enemies[i].y > 400) enemies.splice(i, 1);
    }
    requestAnimationFrame(draw);
}
draw();
</script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def log_message(self, format, *args):
        pass

# Kill anything on the port first
try:
    import os
    os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')
except:
    pass

# Try with SO_REUSEADDR
httpd = HTTPServer(('', PORT), GameHandler)
httpd.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

print(f"FIXED GAME running at http://localhost:{PORT}")
print("Click the red squares to score!")

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    httpd.shutdown()