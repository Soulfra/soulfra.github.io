#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler

PORT = 13000

HTML = b"""<!DOCTYPE html>
<html>
<head>
<title>Game Dashboard</title>
<style>
body { 
    margin: 0; 
    background: #1a1a1a; 
    color: #fff;
    font-family: Arial;
    padding: 20px;
}

h1 {
    text-align: center;
    color: #4CAF50;
}

.games {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.game-card {
    background: #2a2a2a;
    border: 2px solid #444;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
}

.game-card h2 {
    margin: 0 0 10px 0;
}

.game-card a {
    display: inline-block;
    background: #4CAF50;
    color: white;
    text-decoration: none;
    padding: 10px 20px;
    border-radius: 5px;
    margin-top: 10px;
}

.game-card a:hover {
    background: #45a049;
}

.status {
    display: inline-block;
    width: 10px;
    height: 10px;
    background: #0F0;
    border-radius: 50%;
    margin-left: 5px;
}
</style>
</head>
<body>

<h1>SOULFRA GAME PLATFORM</h1>

<div class="games">
    <div class="game-card">
        <h2>Simple Click Game <span class="status"></span></h2>
        <p>The original - click to move the green square</p>
        <a href="http://localhost:13000" target="_blank">PLAY NOW</a>
    </div>
    
    <div class="game-card">
        <h2>Habbo Style Game <span class="status"></span></h2>
        <p>Isometric world with character movement</p>
        <a href="http://localhost:13001" target="_blank">PLAY NOW</a>
    </div>
    
    <div class="game-card">
        <h2>RuneScape Style <span class="status"></span></h2>
        <p>Classic RPG with minimap and stats</p>
        <a href="http://localhost:13002" target="_blank">PLAY NOW</a>
    </div>
    
    <div class="game-card">
        <h2>AI Battle Arena <span class="status"></span></h2>
        <p>Watch AI fighters battle - place bets!</p>
        <a href="http://localhost:13003" target="_blank">PLAY NOW</a>
    </div>
    
    <div class="game-card">
        <h2>Main Platform <span class="status"></span></h2>
        <p>Soulfra main ecosystem</p>
        <a href="http://localhost:3333" target="_blank">ENTER PLATFORM</a>
    </div>
    
    <div class="game-card">
        <h2>Immersive Portal <span class="status"></span></h2>
        <p>3D consciousness interface</p>
        <a href="http://localhost:5555" target="_blank">ENTER PORTAL</a>
    </div>
</div>

<script>
// Check game status
async function checkStatus() {
    const ports = [13000, 13001, 13002, 13003, 3333, 5555];
    const statuses = document.querySelectorAll('.status');
    
    for (let i = 0; i < ports.length; i++) {
        try {
            const response = await fetch(`http://localhost:${ports[i]}`, { mode: 'no-cors' });
            statuses[i].style.background = '#0F0';
        } catch (e) {
            statuses[i].style.background = '#F00';
        }
    }
}

checkStatus();
setInterval(checkStatus, 5000);
</script>

</body>
</html>"""

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(HTML)
    def log_message(self, f, *a): pass

# Kill existing process on 13000 first
import os
os.system("kill $(lsof -t -i:13000) 2>/dev/null")
import time
time.sleep(1)

print(f"Game Dashboard running on http://localhost:{PORT}")
HTTPServer(("localhost", PORT), Handler).serve_forever()