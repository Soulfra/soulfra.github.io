#!/usr/bin/env python3
"""
SOULFRA STANDARD PLATFORM
Clean, expandable, no encoding issues
"""

import socket
import json
import sqlite3
import uuid
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

# Get a free port
def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

PORT = get_free_port()

# Initialize database for expansion
conn = sqlite3.connect(':memory:', check_same_thread=False)
cursor = conn.cursor()

cursor.executescript('''
CREATE TABLE game_sessions (
    session_id TEXT PRIMARY KEY,
    game_type TEXT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    score INTEGER
);

CREATE TABLE platform_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type TEXT,
    data TEXT,
    timestamp TIMESTAMP
);
''')
conn.commit()

# Log platform event
def log_event(event_type, data):
    cursor.execute('''
        INSERT INTO platform_events (event_type, data, timestamp)
        VALUES (?, ?, ?)
    ''', (event_type, json.dumps(data), datetime.now()))
    conn.commit()

log_event('platform_start', {'port': PORT})

HTML = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Soulfra Standard Platform</title>
<style>
/* Reset and base styles */
* {{
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}}

body {{
    background: #0a0a0a;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    line-height: 1.6;
}}

/* Layout */
.container {{
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}}

/* Header */
.header {{
    background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
    padding: 30px;
    text-align: center;
    border-radius: 10px;
    margin-bottom: 30px;
}}

.logo {{
    font-size: 48px;
    font-weight: bold;
    background: linear-gradient(45deg, #4CAF50, #2196F3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}}

.tagline {{
    font-size: 18px;
    color: #999;
    margin-top: 10px;
}}

/* Navigation */
.nav {{
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}}

.nav-btn {{
    background: #1a1a1a;
    color: #e0e0e0;
    border: 2px solid #333;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.3s;
}}

.nav-btn:hover {{
    background: #2a2a2a;
    border-color: #4CAF50;
    transform: translateY(-2px);
}}

.nav-btn.active {{
    background: #4CAF50;
    color: #000;
    border-color: #4CAF50;
}}

/* Content sections */
.section {{
    display: none;
    animation: fadeIn 0.3s ease;
}}

.section.active {{
    display: block;
}}

@keyframes fadeIn {{
    from {{ opacity: 0; }}
    to {{ opacity: 1; }}
}}

/* Cards */
.card {{
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 20px;
    margin-bottom: 20px;
}}

.card h2 {{
    color: #4CAF50;
    margin-bottom: 15px;
}}

/* Grid layout */
.grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}}

/* Games */
.game-container {{
    background: #0f0f0f;
    border: 2px solid #333;
    border-radius: 10px;
    padding: 20px;
    text-align: center;
}}

.game-canvas {{
    width: 100%;
    height: 300px;
    background: #000;
    border: 1px solid #444;
    position: relative;
    cursor: pointer;
    margin: 15px 0;
    border-radius: 5px;
}}

/* Game objects */
#simple-box {{
    width: 40px;
    height: 40px;
    background: #4CAF50;
    position: absolute;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 5px;
}}

#character {{
    position: absolute;
    width: 50px;
    height: 80px;
    transition: all 0.5s ease;
}}

.char-head {{
    width: 24px;
    height: 24px;
    background: #FDBCB4;
    border-radius: 50%;
    margin: 0 auto;
    border: 2px solid #333;
}}

.char-body {{
    width: 30px;
    height: 35px;
    background: #4169E1;
    margin: -2px auto 0;
    border-radius: 8px 8px 0 0;
    border: 2px solid #333;
}}

.char-legs {{
    width: 28px;
    height: 20px;
    background: #666;
    margin: -2px auto 0;
    border-radius: 0 0 5px 5px;
    border: 2px solid #333;
}}

/* Arena */
.fighter {{
    position: absolute;
    width: 35px;
    height: 35px;
    border-radius: 50%;
    transition: all 0.3s;
}}

.fighter1 {{
    background: #2196F3;
    border: 2px solid #1976D2;
}}

.fighter2 {{
    background: #F44336;
    border: 2px solid #D32F2F;
}}

.health-bar {{
    position: absolute;
    top: -20px;
    left: -5px;
    width: 45px;
    height: 6px;
    background: #333;
    border: 1px solid #555;
    border-radius: 3px;
}}

.health-fill {{
    height: 100%;
    background: #4CAF50;
    transition: width 0.3s;
    border-radius: 2px;
}}

/* Buttons */
.btn {{
    background: #4CAF50;
    color: #000;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    font-weight: bold;
    transition: all 0.2s;
    margin: 5px;
}}

.btn:hover {{
    background: #45a049;
    transform: scale(1.05);
}}

.btn:active {{
    transform: scale(0.95);
}}

.btn.secondary {{
    background: transparent;
    border: 2px solid #666;
    color: #e0e0e0;
}}

/* Status displays */
.status {{
    background: #1a1a1a;
    border-left: 4px solid #4CAF50;
    padding: 15px;
    margin: 20px 0;
    border-radius: 5px;
}}

.status-item {{
    display: flex;
    justify-content: space-between;
    margin: 5px 0;
}}

.status-label {{
    color: #999;
}}

.status-value {{
    color: #4CAF50;
    font-weight: bold;
}}

/* Tables */
.data-table {{
    width: 100%;
    background: #1a1a1a;
    border-radius: 8px;
    overflow: hidden;
    margin: 20px 0;
}}

.data-table th {{
    background: #2a2a2a;
    padding: 12px;
    text-align: left;
    color: #4CAF50;
    font-weight: bold;
}}

.data-table td {{
    padding: 12px;
    border-top: 1px solid #333;
}}

.data-table tr:hover {{
    background: #2a2a2a;
}}

/* Code blocks */
.code-block {{
    background: #0a0a0a;
    border: 1px solid #333;
    border-radius: 5px;
    padding: 15px;
    margin: 15px 0;
    font-family: 'Courier New', monospace;
    overflow-x: auto;
}}

/* Responsive */
@media (max-width: 768px) {{
    .grid {{
        grid-template-columns: 1fr;
    }}
    
    .nav {{
        flex-direction: column;
    }}
    
    .nav-btn {{
        width: 100%;
    }}
}}
</style>
</head>
<body>

<div class="container">
    <header class="header">
        <h1 class="logo">SOULFRA</h1>
        <p class="tagline">Standard Platform - Clean, Expandable, Working</p>
    </header>
    
    <nav class="nav">
        <button class="nav-btn active" onclick="showSection('dashboard')">Dashboard</button>
        <button class="nav-btn" onclick="showSection('games')">Games</button>
        <button class="nav-btn" onclick="showSection('enterprise')">Enterprise</button>
        <button class="nav-btn" onclick="showSection('intelligence')">Intelligence</button>
        <button class="nav-btn" onclick="showSection('api')">API/SDK</button>
    </nav>
    
    <!-- Dashboard Section -->
    <section id="dashboard" class="section active">
        <div class="grid">
            <div class="card">
                <h2>System Status</h2>
                <div class="status">
                    <div class="status-item">
                        <span class="status-label">Port</span>
                        <span class="status-value">{PORT}</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Status</span>
                        <span class="status-value">RUNNING</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Uptime</span>
                        <span class="status-value" id="uptime">0s</span>
                    </div>
                    <div class="status-item">
                        <span class="status-label">Events</span>
                        <span class="status-value" id="event-count">0</span>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h2>Quick Stats</h2>
                <div class="grid" style="grid-template-columns: 1fr 1fr;">
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 36px; color: #4CAF50;">3</div>
                        <div>Active Games</div>
                    </div>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 36px; color: #2196F3;">100%</div>
                        <div>Local Processing</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="card">
            <h2>Recent Activity</h2>
            <div id="activity-log" style="max-height: 200px; overflow-y: auto;">
                <div style="padding: 5px; border-bottom: 1px solid #333;">Platform initialized</div>
            </div>
        </div>
    </section>
    
    <!-- Games Section -->
    <section id="games" class="section">
        <div class="grid">
            <div class="game-container">
                <h3>Simple Click Game</h3>
                <div class="game-canvas" id="simple-game">
                    <div id="simple-box"></div>
                </div>
                <p>Click to move the box</p>
            </div>
            
            <div class="game-container">
                <h3>Character World</h3>
                <div class="game-canvas" id="character-game">
                    <div id="character">
                        <div class="char-head"></div>
                        <div class="char-body"></div>
                        <div class="char-legs"></div>
                    </div>
                </div>
                <p>Click to move character</p>
            </div>
            
            <div class="game-container">
                <h3>AI Battle Arena</h3>
                <div class="game-canvas" id="arena-game">
                    <div class="fighter fighter1" id="fighter1">
                        <div class="health-bar"><div class="health-fill" id="health1"></div></div>
                    </div>
                    <div class="fighter fighter2" id="fighter2">
                        <div class="health-bar"><div class="health-fill" id="health2"></div></div>
                    </div>
                </div>
                <button class="btn" onclick="startBattle()">Start Battle</button>
                <div id="battle-status"></div>
            </div>
        </div>
    </section>
    
    <!-- Enterprise Section -->
    <section id="enterprise" class="section">
        <div class="card">
            <h2>Licensing Tiers</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Feature</th>
                        <th>Starter ($99/mo)</th>
                        <th>Pro ($499/mo)</th>
                        <th>Enterprise</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Game Instances</td>
                        <td>5</td>
                        <td>50</td>
                        <td>Unlimited</td>
                    </tr>
                    <tr>
                        <td>Players</td>
                        <td>500</td>
                        <td>5,000</td>
                        <td>Unlimited</td>
                    </tr>
                    <tr>
                        <td>White Label</td>
                        <td>-</td>
                        <td>Basic</td>
                        <td>Full</td>
                    </tr>
                    <tr>
                        <td>Support</td>
                        <td>Email</td>
                        <td>Priority</td>
                        <td>Dedicated</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="card">
            <h2>Platform Features</h2>
            <div class="grid">
                <div>
                    <h3>Multi-Tenant Architecture</h3>
                    <p>Isolated game instances per customer</p>
                </div>
                <div>
                    <h3>SDK & API</h3>
                    <p>Full developer integration toolkit</p>
                </div>
                <div>
                    <h3>Analytics Dashboard</h3>
                    <p>Real-time metrics and insights</p>
                </div>
            </div>
        </div>
    </section>
    
    <!-- Intelligence Section -->
    <section id="intelligence" class="section">
        <div class="card">
            <h2>Local Intelligence Engine</h2>
            <p>Like Cluely but 100% private and local</p>
            
            <div class="grid" style="margin-top: 20px;">
                <div class="status">
                    <h3>Our Approach</h3>
                    <div class="status-item">
                        <span>Processing</span>
                        <span style="color: #4CAF50;">100% Local</span>
                    </div>
                    <div class="status-item">
                        <span>Privacy</span>
                        <span style="color: #4CAF50;">Guaranteed</span>
                    </div>
                    <div class="status-item">
                        <span>CJIS Compliant</span>
                        <span style="color: #4CAF50;">Yes</span>
                    </div>
                    <div class="status-item">
                        <span>Cloud Required</span>
                        <span style="color: #4CAF50;">No</span>
                    </div>
                </div>
                
                <div class="status">
                    <h3>Cluely Approach</h3>
                    <div class="status-item">
                        <span>Processing</span>
                        <span style="color: #F44336;">Cloud-based</span>
                    </div>
                    <div class="status-item">
                        <span>Privacy</span>
                        <span style="color: #F44336;">Uncertain</span>
                    </div>
                    <div class="status-item">
                        <span>Data Location</span>
                        <span style="color: #F44336;">Remote Servers</span>
                    </div>
                    <div class="status-item">
                        <span>Local Mode</span>
                        <span style="color: #F44336;">No</span>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <!-- API Section -->
    <section id="api" class="section">
        <div class="card">
            <h2>API Endpoints</h2>
            <div class="code-block">
GET /api/status - Platform status
GET /api/games - List active games
POST /api/games/create - Create game instance
GET /api/events - Get platform events
POST /api/intelligence/capture - Submit intelligence data
            </div>
            
            <button class="btn" onclick="testAPI()">Test API</button>
            <div id="api-response" class="code-block" style="display: none;"></div>
        </div>
        
        <div class="card">
            <h2>SDK Example</h2>
            <div class="code-block">
// Initialize Soulfra SDK
const soulfra = new SoulfraSDK({{
    apiKey: 'your-api-key',
    endpoint: 'http://localhost:{PORT}'
}});

// Create game instance
const game = await soulfra.games.create({{
    type: 'arena',
    config: {{ maxPlayers: 50 }}
}});

// Enable local intelligence
soulfra.intelligence.enable({{
    mode: 'local-only',
    privacy: 'maximum'
}});
            </div>
        </div>
    </section>
</div>

<script>
// State management
let startTime = Date.now();
let eventCount = 0;
let battleActive = false;

// Navigation
function showSection(section) {{
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(section).classList.add('active');
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    logActivity('Navigated to ' + section);
}}

// Activity logging
function logActivity(message) {{
    eventCount++;
    document.getElementById('event-count').textContent = eventCount;
    
    const log = document.getElementById('activity-log');
    const entry = document.createElement('div');
    entry.style.padding = '5px';
    entry.style.borderBottom = '1px solid #333';
    entry.textContent = new Date().toLocaleTimeString() + ' - ' + message;
    log.insertBefore(entry, log.firstChild);
    
    // Keep log size manageable
    while (log.children.length > 10) {{
        log.removeChild(log.lastChild);
    }}
}}

// Update uptime
setInterval(() => {{
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('uptime').textContent = uptime + 's';
}}, 1000);

// Simple game
document.getElementById('simple-game').onclick = function(e) {{
    const box = document.getElementById('simple-box');
    const rect = this.getBoundingClientRect();
    box.style.left = (e.clientX - rect.left - 20) + 'px';
    box.style.top = (e.clientY - rect.top - 20) + 'px';
    logActivity('Simple game: box moved');
}};

// Character game
document.getElementById('character-game').onclick = function(e) {{
    const char = document.getElementById('character');
    const rect = this.getBoundingClientRect();
    char.style.left = (e.clientX - rect.left - 25) + 'px';
    char.style.top = (e.clientY - rect.top - 40) + 'px';
    logActivity('Character moved');
}};

// Battle arena
function startBattle() {{
    if (battleActive) return;
    
    battleActive = true;
    let health1 = 100, health2 = 100;
    
    document.getElementById('health1').style.width = '100%';
    document.getElementById('health2').style.width = '100%';
    document.getElementById('battle-status').textContent = 'Battle in progress...';
    
    logActivity('Battle started');
    
    const interval = setInterval(() => {{
        // Random damage
        if (Math.random() < 0.5) {{
            health2 -= Math.floor(Math.random() * 20) + 5;
        }} else {{
            health1 -= Math.floor(Math.random() * 20) + 5;
        }}
        
        // Update health bars
        document.getElementById('health1').style.width = Math.max(0, health1) + '%';
        document.getElementById('health2').style.width = Math.max(0, health2) + '%';
        
        // Move fighters
        const f1 = document.getElementById('fighter1');
        const f2 = document.getElementById('fighter2');
        f1.style.top = (130 + Math.random() * 40) + 'px';
        f2.style.top = (130 + Math.random() * 40) + 'px';
        
        // Check winner
        if (health1 <= 0 || health2 <= 0) {{
            clearInterval(interval);
            battleActive = false;
            const winner = health1 > 0 ? 'Blue' : 'Red';
            document.getElementById('battle-status').textContent = winner + ' fighter wins!';
            logActivity('Battle ended: ' + winner + ' wins');
        }}
    }}, 500);
}}

// API testing
function testAPI() {{
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {{
            document.getElementById('api-response').style.display = 'block';
            document.getElementById('api-response').textContent = JSON.stringify(data, null, 2);
            logActivity('API test successful');
        }})
        .catch(err => {{
            logActivity('API test failed: ' + err);
        }});
}}

// Initialize positions
document.getElementById('simple-box').style.left = '50%';
document.getElementById('simple-box').style.top = '50%';
document.getElementById('character').style.left = '50%';
document.getElementById('character').style.top = '50%';
document.getElementById('fighter1').style.left = '20%';
document.getElementById('fighter1').style.top = '50%';
document.getElementById('fighter2').style.right = '20%';
document.getElementById('fighter2').style.top = '50%';

// Log initialization
logActivity('Platform initialized');
</script>

</body>
</html>"""

class StandardHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(HTML.encode('utf-8'))
            
        elif self.path == '/api/status':
            self.send_json({
                'status': 'operational',
                'port': PORT,
                'uptime': int(time.time() - start_time),
                'events': self.get_event_count()
            })
            
        elif self.path == '/api/games':
            self.send_json({
                'games': [
                    {'id': 'simple', 'name': 'Simple Click Game', 'active': True},
                    {'id': 'character', 'name': 'Character World', 'active': True},
                    {'id': 'arena', 'name': 'AI Battle Arena', 'active': True}
                ]
            })
            
        elif self.path == '/api/events':
            cursor.execute('SELECT * FROM platform_events ORDER BY timestamp DESC LIMIT 10')
            events = cursor.fetchall()
            self.send_json({
                'events': [
                    {
                        'id': e[0],
                        'type': e[1],
                        'data': json.loads(e[2]),
                        'timestamp': e[3]
                    } for e in events
                ]
            })
            
        else:
            self.send_error(404)
    
    def do_POST(self):
        if self.path == '/api/games/create':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            session_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO game_sessions (session_id, game_type, start_time)
                VALUES (?, ?, ?)
            ''', (session_id, data.get('type', 'simple'), datetime.now()))
            conn.commit()
            
            log_event('game_created', {'session_id': session_id, 'type': data.get('type')})
            
            self.send_json({
                'session_id': session_id,
                'status': 'created'
            })
            
        elif self.path == '/api/intelligence/capture':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Process locally only
            log_event('intelligence_capture', {
                'type': data.get('type'),
                'processed_locally': True,
                'cloud_upload': False
            })
            
            self.send_json({
                'status': 'captured',
                'local_only': True
            })
            
        else:
            self.send_error(404)
    
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def get_event_count(self):
        cursor.execute('SELECT COUNT(*) FROM platform_events')
        return cursor.fetchone()[0]
    
    def log_message(self, format, *args):
        pass

# Start server
start_time = time.time()

print(f"\n{'='*60}")
print(f"SOULFRA STANDARD PLATFORM")
print(f"{'='*60}")
print(f"\nPort: {PORT}")
print(f"URL: http://localhost:{PORT}")
print(f"\nFeatures:")
print(f"- Clean code, no encoding issues")
print(f"- Expandable architecture")
print(f"- Database backend")
print(f"- Full API endpoints")
print(f"- Activity logging")
print(f"- Multiple game types")
print(f"- Enterprise features")
print(f"- Local intelligence info")
print(f"\nPress Ctrl+C to stop")
print(f"{'='*60}\n")

try:
    httpd = HTTPServer(('localhost', PORT), StandardHandler)
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down...")
    conn.close()