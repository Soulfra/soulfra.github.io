#!/usr/bin/env python3
import http.server
import socketserver
import sys

PORT = 6667

HTML = b"""<!DOCTYPE html>
<html>
<head>
<title>GUARANTEED WORKING GAME</title>
<style>
body { margin: 0; background: #000; color: #fff; font-family: Arial; text-align: center; padding: 20px; }
h1 { color: #0f8; }
canvas { border: 2px solid #0f8; background: #111; cursor: crosshair; }
p { margin: 20px; }
</style>
</head>
<body>
<h1>SUPER SIMPLE SHOOTER</h1>
<p>Move mouse, click to shoot. Score: <span id="score">0</span></p>
<canvas id="c" width="600" height="400"></canvas>
<script>
var c = document.getElementById('c');
var ctx = c.getContext('2d');
var score = 0;
var enemies = [];
var bullets = [];
var mx = 300, my = 200;

c.onmousemove = function(e) {
    var rect = c.getBoundingClientRect();
    mx = e.clientX - rect.left;
    my = e.clientY - rect.top;
};

c.onclick = function() {
    bullets.push({x: mx, y: my, vx: 0, vy: -10});
};

setInterval(function() {
    enemies.push({x: Math.random() * 600, y: 0, size: 20});
}, 1000);

function draw() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, 600, 400);
    
    ctx.fillStyle = '#0f8';
    ctx.fillRect(mx - 10, my - 10, 20, 20);
    
    for (var i = enemies.length - 1; i >= 0; i--) {
        var e = enemies[i];
        e.y += 2;
        ctx.fillStyle = '#f44';
        ctx.fillRect(e.x - 10, e.y - 10, 20, 20);
        if (e.y > 400) enemies.splice(i, 1);
    }
    
    for (var i = bullets.length - 1; i >= 0; i--) {
        var b = bullets[i];
        b.x += b.vx;
        b.y += b.vy;
        ctx.fillStyle = '#ff0';
        ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
        
        for (var j = enemies.length - 1; j >= 0; j--) {
            var e = enemies[j];
            if (Math.abs(b.x - e.x) < 15 && Math.abs(b.y - e.y) < 15) {
                enemies.splice(j, 1);
                bullets.splice(i, 1);
                score += 10;
                document.getElementById('score').textContent = score;
                break;
            }
        }
        
        if (b.y < 0) bullets.splice(i, 1);
    }
    
    requestAnimationFrame(draw);
}
draw();
</script>
</body>
</html>"""

class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(HTML)
    
    def log_message(self, format, *args):
        pass

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"GUARANTEED WORKING GAME at http://localhost:{PORT}")
        httpd.serve_forever()
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)