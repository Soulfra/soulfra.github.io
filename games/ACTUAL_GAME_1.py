#!/usr/bin/env python3
"""
ACTUAL GAME - No bullshit, just a game that works
"""

import http.server
import socketserver
import json
import time
import os

PORT = 8888

# Kill the port
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

# Game state - simple and real
game_state = {
    'players': {},
    'high_scores': [],
    'total_clicks': 0
}

# Simple HTML game that actually works
HTML = """<!DOCTYPE html>
<html>
<head>
<title>Click Game</title>
<style>
body {
    margin: 0;
    background: #222;
    color: white;
    font-family: Arial, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
}

#score {
    font-size: 72px;
    margin: 20px;
}

button {
    font-size: 32px;
    padding: 20px 40px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
}

button:active {
    background: #45a049;
    transform: scale(0.98);
}

#message {
    margin: 20px;
    font-size: 18px;
    color: #888;
}

#leaderboard {
    position: absolute;
    right: 20px;
    top: 20px;
    background: #333;
    padding: 20px;
    border-radius: 10px;
}

.leader {
    margin: 5px 0;
}
</style>
</head>
<body>

<div id="score">0</div>
<button onclick="click_button()">CLICK ME</button>
<div id="message">Click to score points</div>

<div id="leaderboard">
    <h3>High Scores</h3>
    <div id="leaders"></div>
</div>

<script>
let score = 0;
let player_id = 'player_' + Math.random().toString(36).substr(2, 9);

function click_button() {
    score++;
    document.getElementById('score').textContent = score;
    
    // Save score every 10 clicks
    if (score % 10 === 0) {
        save_score();
    }
}

function save_score() {
    fetch('/save', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            player: player_id,
            score: score
        })
    })
    .then(r => r.json())
    .then(data => {
        update_leaderboard(data.high_scores);
    });
}

function update_leaderboard(scores) {
    const leaders = document.getElementById('leaders');
    leaders.innerHTML = '';
    
    scores.slice(0, 10).forEach((s, i) => {
        const div = document.createElement('div');
        div.className = 'leader';
        div.textContent = `${i + 1}. Player ${s.player.substr(-4)} - ${s.score}`;
        leaders.appendChild(div);
    });
}

// Get initial leaderboard
fetch('/scores')
    .then(r => r.json())
    .then(data => update_leaderboard(data));

// Auto-save on page unload
window.addEventListener('beforeunload', save_score);
</script>

</body>
</html>"""

class GameHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML.encode())
            
        elif self.path == '/scores':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(game_state['high_scores']).encode())
            
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/save':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Update player score
            player = data.get('player', 'unknown')
            score = data.get('score', 0)
            
            game_state['players'][player] = score
            game_state['total_clicks'] = sum(game_state['players'].values())
            
            # Update high scores
            scores = [{'player': p, 'score': s} for p, s in game_state['players'].items()]
            game_state['high_scores'] = sorted(scores, key=lambda x: x['score'], reverse=True)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'saved',
                'high_scores': game_state['high_scores'][:10]
            }).encode())
            
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        # Simple logging
        print(f"[{self.client_address[0]}] {format % args}")

# Start server
with socketserver.TCPServer(("", PORT), GameHandler) as httpd:
    httpd.allow_reuse_address = True
    print(f"\nGAME RUNNING AT: http://localhost:{PORT}\n")
    print("Features that actually work:")
    print("- Click button, number goes up")
    print("- Saves high scores")
    print("- Shows leaderboard")
    print("- No bullshit")
    print("\nPress Ctrl+C to stop\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nGame stopped")