#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 6666

class GameServer(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>REAL GAMES LAUNCHER</title>
<style>
body { background: #000; color: #fff; font-family: Arial; padding: 40px; }
h1 { color: #00ff88; text-align: center; font-size: 48px; }
.games { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; margin-top: 40px; }
.game-card { 
    background: #1a1a1a; 
    border: 3px solid #444; 
    padding: 30px; 
    border-radius: 15px; 
    text-align: center;
    transition: all 0.3s;
}
.game-card:hover { 
    border-color: #00ff88; 
    transform: scale(1.05);
    box-shadow: 0 0 30px rgba(0,255,136,0.5);
}
.game-title { font-size: 24px; color: #00ff88; margin-bottom: 15px; }
.game-desc { color: #ccc; margin-bottom: 20px; }
a { 
    display: inline-block;
    padding: 15px 30px; 
    background: linear-gradient(45deg, #00ff88, #00ccff); 
    color: #000; 
    text-decoration: none; 
    border-radius: 10px; 
    font-weight: bold;
    transition: transform 0.2s;
}
a:hover { transform: scale(1.1); }
.status { color: #00ff88; font-size: 20px; text-align: center; margin-top: 40px; }
</style>
</head>
<body>

<h1>YOUR ACTUAL FUCKING GAMES</h1>

<div class="games">
    <div class="game-card">
        <div class="game-title">3D PLAZA WORLD</div>
        <div class="game-desc">Three.js 3D world with walking agents and real graphics</div>
        <a href="/tier-minus11/tier-minus12/tier-minus13/tier-minus14/tier-minus15/tier-minus16/tier-minus17/tier-minus18/tier-minus19/tier-minus20/soulfra-w2-plaza/plaza_3d_sims.html">ENTER 3D WORLD</a>
    </div>
    
    <div class="game-card">
        <div class="game-title">ARENA IMMERSION</div>
        <div class="game-desc">Full immersive coliseum with QR scanning and depth layers</div>
        <a href="/tier-minus11/tier-minus12/tier-minus13/tier-minus14/tier-minus15/tier-minus16/tier-minus17/tier-minus18/tier-minus19/tier-minus20/ai-coliseum/arena_immersion.html">ENTER ARENA</a>
    </div>
    
    <div class="game-card">
        <div class="game-title">CONSCIOUSNESS ARENA</div>
        <div class="game-desc">Ascension arena with real gameplay</div>
        <a href="/tier-minus11/tier-minus12/tier-minus13/tier-minus14/tier-minus15/tier-minus16/tier-minus17/tier-minus18/tier-minus19/tier-minus20/website/consciousness-ascension-arena.html">ASCEND NOW</a>
    </div>
    
    <div class="game-card">
        <div class="game-title">DIGITAL COLISEUM</div>
        <div class="game-desc">The coliseum experience you wanted</div>
        <a href="/tier-minus11/tier-minus12/tier-minus13/tier-minus14/tier-minus15/tier-minus16/tier-minus17/tier-minus18/tier-minus19/tier-minus20/digital-coliseum.html">ENTER COLISEUM</a>
    </div>
    
    <div class="game-card">
        <div class="game-title">3D KIDS WORLD</div>
        <div class="game-desc">Kid-friendly 3D world</div>
        <a href="/tier-minus11/tier-minus12/tier-minus13/tier-minus14/tier-minus15/tier-minus16/tier-minus17/tier-minus18/tier-minus19/tier-minus20/kids_world_3d.html">PLAY NOW</a>
    </div>
    
    <div class="game-card">
        <div class="game-title">GLADIATOR ARENA</div>
        <div class="game-desc">AI gladiators fighting with real combat</div>
        <a href="http://localhost:3003">GO TO ARENA</a>
    </div>
</div>

<div class="status">
    These are your REAL games with actual 3D graphics, immersive experiences, and real gameplay mechanics!<br>
    Not button clickers - ACTUAL GAMES!
</div>

</body>
</html>'''
            
            self.wfile.write(html.encode())
        else:
            # Serve the actual game files
            super().do_GET()

os.chdir('..')  # Go up one directory to serve tier-minus files

with socketserver.TCPServer(("", PORT), GameServer) as httpd:
    print(f"\n{'='*60}")
    print(f"REAL GAMES LAUNCHER")
    print(f"{'='*60}")
    print(f"Running at: http://localhost:{PORT}")
    print(f"\nThese are your ACTUAL games:")
    print(f"- 3D Plaza World (Three.js)")
    print(f"- Arena Immersion (Custom cursors, QR scanning)")
    print(f"- Consciousness Arena")
    print(f"- Digital Coliseum")
    print(f"- 3D Kids World")
    print(f"\nNOT button clickers - REAL FUCKING GAMES!")
    print(f"{'='*60}\n")
    httpd.serve_forever()