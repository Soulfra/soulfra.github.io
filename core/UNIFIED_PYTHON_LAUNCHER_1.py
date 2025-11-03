#!/usr/bin/env python3
"""
UNIFIED PYTHON GAME LAUNCHER
All games accessible from one place - NO FORMATTING ERRORS
"""

import http.server
import socketserver
import json
from datetime import datetime

PORT = 8000

LAUNCHER_HTML = r'''<!DOCTYPE html>
<html>
<head>
<title>SOULFRA GAMES - PYTHON EDITION</title>
<meta charset="UTF-8">
<style>
body { 
    margin: 0; 
    background: #000; 
    color: #fff; 
    font-family: -apple-system, Arial, sans-serif;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.header {
    background: linear-gradient(45deg, #00ff88, #00ccff);
    padding: 20px;
    text-align: center;
}

.header h1 {
    margin: 0;
    color: #000;
    font-size: 36px;
}

.header p {
    margin: 5px 0 0 0;
    color: #000;
    opacity: 0.8;
}

.container {
    flex: 1;
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px 20px;
    width: 100%;
}

.status-banner {
    background: #1a1a1a;
    border: 2px solid #00ff88;
    border-radius: 15px;
    padding: 20px;
    margin-bottom: 40px;
    text-align: center;
}

.status-banner h2 {
    color: #00ff88;
    margin: 0 0 10px 0;
}

.games-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 30px;
    margin-bottom: 40px;
}

.game-card {
    background: #1a1a1a;
    border: 2px solid #333;
    border-radius: 20px;
    padding: 30px;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;
}

.game-card:hover {
    border-color: #00ff88;
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
}

.game-card.working {
    border-color: #00ff88;
}

.game-card.working::before {
    content: " WORKING";
    position: absolute;
    top: 10px;
    right: 10px;
    background: #00ff88;
    color: #000;
    padding: 5px 10px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
}

.game-icon {
    font-size: 64px;
    margin-bottom: 20px;
    text-align: center;
}

.game-title {
    color: #00ff88;
    font-size: 24px;
    margin: 0 0 10px 0;
}

.game-port {
    color: #666;
    font-size: 14px;
    margin-bottom: 15px;
}

.game-description {
    line-height: 1.6;
    margin-bottom: 20px;
    color: #ccc;
}

.game-features {
    list-style: none;
    padding: 0;
    margin: 0 0 20px 0;
}

.game-features li {
    padding: 5px 0;
    color: #888;
    font-size: 14px;
}

.game-features li:before {
    content: "→ ";
    color: #00ff88;
}

.play-button {
    display: block;
    width: 100%;
    padding: 15px;
    background: linear-gradient(45deg, #00ff88, #00ccff);
    color: #000;
    text-decoration: none;
    text-align: center;
    font-weight: bold;
    border-radius: 10px;
    transition: all 0.3s;
}

.play-button:hover {
    transform: scale(1.05);
}

.tech-info {
    background: #0a0a0a;
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 40px;
}

.tech-info h3 {
    color: #00ff88;
    margin: 0 0 20px 0;
}

.tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.tech-item {
    background: #1a1a1a;
    padding: 20px;
    border-radius: 10px;
    text-align: center;
}

.tech-item h4 {
    color: #00ccff;
    margin: 0 0 10px 0;
}

.command-box {
    background: #0a0a0a;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 20px;
    margin: 20px 0;
    font-family: monospace;
}

.command-box code {
    color: #00ff88;
}

.footer {
    background: #1a1a1a;
    padding: 20px;
    text-align: center;
    color: #666;
}

@media (max-width: 768px) {
    .games-grid {
        grid-template-columns: 1fr;
    }
}
</style>
</head>
<body>

<div class="header">
    <h1>SOULFRA GAMES - PYTHON EDITION</h1>
    <p>All games rebuilt in Python - NO FORMATTING ERRORS!</p>
</div>

<div class="container">
    <div class="status-banner">
        <h2> WHAT WE LEARNED FROM PORT 5555 </h2>
        <p>Python servers with inline HTML = No JavaScript formatting errors ever!</p>
        <p>Every game below is guaranteed to work without any character encoding issues.</p>
    </div>
    
    <div class="games-grid">
        <div class="game-card working">
            <div class="game-icon"></div>
            <h3 class="game-title">NO BULLSHIT ARENA</h3>
            <p class="game-port">Port 5555</p>
            <p class="game-description">The original Python game that proved the concept. Simple canvas shooter with zero dependencies.</p>
            <ul class="game-features">
                <li>Canvas-based graphics</li>
                <li>Enemy waves</li>
                <li>Power-ups and items</li>
                <li>Particle effects</li>
            </ul>
            <a href="http://localhost:5555" class="play-button">PLAY NOW</a>
        </div>
        
        <div class="game-card working">
            <div class="game-icon"></div>
            <h3 class="game-title">ULTIMATE ARENA</h3>
            <p class="game-port">Port 6666</p>
            <p class="game-description">Full-featured battle arena with character selection, abilities, and progression system.</p>
            <ul class="game-features">
                <li>4 character classes</li>
                <li>Ability system (Q,W,E,R)</li>
                <li>Leveling and stats</li>
                <li>Chat and leaderboard</li>
            </ul>
            <a href="http://localhost:6666" class="play-button">PLAY NOW</a>
        </div>
        
        <div class="game-card working">
            <div class="game-icon"></div>
            <h3 class="game-title">CHARACTER CREATOR</h3>
            <p class="game-port">Port 6969</p>
            <p class="game-description">Drag & drop any image to become that character! Just like you wanted.</p>
            <ul class="game-features">
                <li>Drag & drop images</li>
                <li>URL image loading</li>
                <li>Auto-generated stats</li>
                <li>Ability selection</li>
            </ul>
            <a href="http://localhost:6969" class="play-button">PLAY NOW</a>
        </div>
        
        <div class="game-card">
            <div class="game-icon"></div>
            <h3 class="game-title">MULTIPLAYER BATTLE</h3>
            <p class="game-port">Port 7000</p>
            <p class="game-description">Real multiplayer using WebSockets (requires websockets module).</p>
            <ul class="game-features">
                <li>Real-time multiplayer</li>
                <li>See other players</li>
                <li>Chat system</li>
                <li>Shared game world</li>
            </ul>
            <a href="http://localhost:7000" class="play-button">REQUIRES SETUP</a>
        </div>
        
        <div class="game-card working">
            <div class="game-icon"></div>
            <h3 class="game-title">OLD JS GAMES</h3>
            <p class="game-port">Various Ports</p>
            <p class="game-description">The original JavaScript games that still work (mostly).</p>
            <ul class="game-features">
                <li>Port 8888: Character Battle</li>
                <li>Port 7777: No-Emoji Arena</li>
                <li>Port 9000/9001: 3D Games (UI issues)</li>
            </ul>
            <a href="http://localhost:8888" class="play-button">TRY JS GAMES</a>
        </div>
        
        <div class="game-card">
            <div class="game-icon"></div>
            <h3 class="game-title">CAL & DOMINGO AI</h3>
            <p class="game-port">Coming Soon</p>
            <p class="game-description">AI agent integration for autonomous gameplay and economy.</p>
            <ul class="game-features">
                <li>AI-controlled characters</li>
                <li>Agent economy system</li>
                <li>Reflection & growth</li>
                <li>Multi-agent battles</li>
            </ul>
            <a href="#" class="play-button" style="opacity: 0.5; cursor: not-allowed;">IN DEVELOPMENT</a>
        </div>
    </div>
    
    <div class="tech-info">
        <h3> TECHNICAL IMPLEMENTATION</h3>
        <div class="tech-grid">
            <div class="tech-item">
                <h4>Python HTTP Server</h4>
                <p>Simple, reliable, no external dependencies</p>
            </div>
            <div class="tech-item">
                <h4>Inline HTML</h4>
                <p>All HTML/CSS/JS in Python strings - no file parsing</p>
            </div>
            <div class="tech-item">
                <h4>Canvas Graphics</h4>
                <p>Pure canvas rendering for smooth 60 FPS</p>
            </div>
            <div class="tech-item">
                <h4>No Build Process</h4>
                <p>Just run the Python file - instant game</p>
            </div>
        </div>
    </div>
    
    <div class="command-box">
        <h4>Quick Start Commands:</h4>
        <code>
        # Kill all old games<br>
        pkill -f "GAME|game"<br><br>
        
        # Start all Python games<br>
        python3 NO_BULLSHIT_GAME.py &<br>
        python3 ULTIMATE_GAME.py &<br>
        python3 DRAG_DROP_CHARACTER_CREATOR.py &<br><br>
        
        # Check what's running<br>
        ps aux | grep -E "GAME|game" | grep -v grep
        </code>
    </div>
</div>

<div class="footer">
    <p>SOULFRA GAMES - Built with Python because JavaScript template literals can go fuck themselves</p>
    <p>Every game guaranteed to work without formatting errors!</p>
</div>

</body>
</html>'''

class LauncherHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(LAUNCHER_HTML.encode())
            
        elif self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Check which games are running
            import subprocess
            try:
                result = subprocess.run(['ps', 'aux'], capture_output=True, text=True)
                running_games = []
                
                if '5555' in result.stdout or 'NO_BULLSHIT' in result.stdout:
                    running_games.append({'name': 'NO BULLSHIT ARENA', 'port': 5555})
                if '6666' in result.stdout or 'ULTIMATE_GAME' in result.stdout:
                    running_games.append({'name': 'ULTIMATE ARENA', 'port': 6666})
                if '6969' in result.stdout or 'CHARACTER_CREATOR' in result.stdout:
                    running_games.append({'name': 'CHARACTER CREATOR', 'port': 6969})
                if '8888' in result.stdout:
                    running_games.append({'name': 'JS Character Battle', 'port': 8888})
                if '7777' in result.stdout:
                    running_games.append({'name': 'JS No-Emoji Arena', 'port': 7777})
                
                status = {
                    'launcher': 'UNIFIED PYTHON LAUNCHER',
                    'running_games': running_games,
                    'total_games': len(running_games),
                    'timestamp': datetime.now().isoformat()
                }
            except:
                status = {
                    'launcher': 'UNIFIED PYTHON LAUNCHER',
                    'error': 'Could not check running games',
                    'timestamp': datetime.now().isoformat()
                }
            
            self.wfile.write(json.dumps(status).encode())
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    print(f"""

                                                            
              UNIFIED PYTHON GAME LAUNCHER                  
                                                            
  Access all games at: http://localhost:{PORT}              
                                                            
  What we learned from port 5555:                          
  → Python servers = NO FORMATTING ERRORS                   
  → Inline HTML = No file parsing issues                    
  → Simple HTTP = Works everywhere                          
  → No dependencies = Instant deployment                    
                                                            
  Games available:                                          
  • Port 5555: No Bullshit Arena (Original)                
  • Port 6666: Ultimate Arena (Full Featured)              
  • Port 6969: Character Creator (Drag & Drop)             
  • Port 8888: JS Games (Still running)                    
                                                            
  This launcher shows all games in one place!              
                                                            

    """)
    
    with socketserver.TCPServer(("", PORT), LauncherHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down launcher...")
            httpd.shutdown()