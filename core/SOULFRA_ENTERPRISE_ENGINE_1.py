#!/usr/bin/env python3
"""
SOULFRA ENTERPRISE GAME ENGINE
Multi-tenant, white-label, licensed game platform
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sqlite3
import uuid
import hashlib
import time
from datetime import datetime

PORT = 15000

# Initialize enterprise database
conn = sqlite3.connect('soulfra_enterprise.db', check_same_thread=False)
cursor = conn.cursor()

cursor.executescript('''
CREATE TABLE IF NOT EXISTS tenants (
    tenant_id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    license_key TEXT UNIQUE,
    tier TEXT DEFAULT 'starter',
    created_at TIMESTAMP,
    api_key TEXT UNIQUE,
    settings TEXT
);

CREATE TABLE IF NOT EXISTS games (
    game_id TEXT PRIMARY KEY,
    tenant_id TEXT,
    game_type TEXT,
    config TEXT,
    active BOOLEAN DEFAULT 1,
    player_count INTEGER DEFAULT 0,
    revenue REAL DEFAULT 0,
    FOREIGN KEY(tenant_id) REFERENCES tenants(tenant_id)
);

CREATE TABLE IF NOT EXISTS analytics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id TEXT,
    game_id TEXT,
    event_type TEXT,
    data TEXT,
    timestamp TIMESTAMP
);

CREATE TABLE IF NOT EXISTS licenses (
    license_id TEXT PRIMARY KEY,
    tenant_id TEXT,
    type TEXT,
    features TEXT,
    max_games INTEGER,
    max_players INTEGER,
    expires_at TIMESTAMP,
    FOREIGN KEY(tenant_id) REFERENCES tenants(tenant_id)
);

-- Seed with demo tenant
INSERT OR IGNORE INTO tenants VALUES (
    'demo-tenant',
    'Demo Company',
    'DEMO-LICENSE-KEY',
    'enterprise',
    datetime('now'),
    'demo-api-key-12345',
    '{"branding": {"primary_color": "#4CAF50"}}'
);
''')
conn.commit()

HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<title>Soulfra Enterprise Platform</title>
<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --primary: #4CAF50;
    --secondary: #2196F3;
    --dark: #1a1a1a;
    --darker: #0a0a0a;
    --light: #e0e0e0;
    --border: #333;
}

body {
    background: var(--darker);
    color: var(--light);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
}

.enterprise-header {
    background: linear-gradient(135deg, var(--dark) 0%, #2d2d2d 100%);
    border-bottom: 2px solid var(--border);
    padding: 20px 0;
    position: sticky;
    top: 0;
    z-index: 1000;
}

.header-content {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.logo {
    font-size: 32px;
    font-weight: bold;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.tier-badge {
    background: linear-gradient(45deg, #FFD700, #FFA500);
    color: #000;
    padding: 5px 15px;
    border-radius: 20px;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 12px;
}

.main-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px 20px;
}

.dashboard-grid {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 30px;
    margin-bottom: 40px;
}

.sidebar {
    background: var(--dark);
    border: 1px solid var(--border);
    border-radius: 15px;
    padding: 20px;
}

.menu-item {
    display: block;
    padding: 12px 20px;
    margin: 5px 0;
    background: #2a2a2a;
    border-radius: 8px;
    text-decoration: none;
    color: var(--light);
    transition: all 0.2s;
    cursor: pointer;
}

.menu-item:hover {
    background: #3a3a3a;
    transform: translateX(5px);
}

.menu-item.active {
    background: var(--primary);
    color: #000;
}

.content-area {
    background: var(--dark);
    border: 1px solid var(--border);
    border-radius: 15px;
    padding: 30px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
}

.stat-card {
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
}

.stat-value {
    font-size: 36px;
    font-weight: bold;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.stat-label {
    color: #999;
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.section {
    margin-bottom: 40px;
}

.section-title {
    font-size: 28px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
}

.create-btn {
    background: linear-gradient(45deg, var(--primary), #45a049);
    color: white;
    border: none;
    padding: 12px 30px;
    border-radius: 25px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
}

.create-btn:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(76, 175, 80, 0.4);
}

.game-instances {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.game-instance {
    background: #2a2a2a;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    position: relative;
    overflow: hidden;
}

.game-preview {
    height: 200px;
    background: #1a1a1a;
    border-radius: 8px;
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.game-canvas {
    width: 100%;
    height: 100%;
}

.instance-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.instance-id {
    font-size: 12px;
    color: #666;
    font-family: monospace;
}

.player-count {
    background: var(--primary);
    color: #000;
    padding: 3px 10px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: bold;
}

.action-buttons {
    display: flex;
    gap: 10px;
}

.action-btn {
    flex: 1;
    padding: 8px 15px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--light);
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s;
}

.action-btn:hover {
    background: var(--primary);
    color: #000;
    border-color: var(--primary);
}

.licensing-panel {
    background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
    border: 2px solid var(--primary);
    border-radius: 15px;
    padding: 30px;
    margin-bottom: 30px;
}

.license-tiers {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.tier-card {
    background: #1a1a1a;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    transition: all 0.3s;
}

.tier-card:hover {
    transform: translateY(-5px);
    border-color: var(--primary);
}

.tier-name {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
}

.tier-price {
    font-size: 36px;
    color: var(--primary);
    margin-bottom: 20px;
}

.tier-features {
    list-style: none;
    text-align: left;
}

.tier-features li {
    padding: 5px 0;
    border-bottom: 1px solid #333;
}

.api-section {
    background: #1a1a1a;
    border-radius: 10px;
    padding: 20px;
    margin-top: 20px;
}

.code-block {
    background: #0a0a0a;
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 15px;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    overflow-x: auto;
    margin: 10px 0;
}

.endpoint {
    color: var(--secondary);
}

.method {
    color: var(--primary);
    font-weight: bold;
}

.analytics-charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
}

.chart-container {
    background: #2a2a2a;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    height: 300px;
}

.loading {
    display: inline-block;
    width: 20px;
    height: 20px;
    border: 3px solid var(--border);
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
}

.white-label-preview {
    background: #2a2a2a;
    border-radius: 10px;
    padding: 20px;
    margin-top: 20px;
}

.color-picker {
    display: flex;
    gap: 20px;
    margin: 20px 0;
}

.color-input {
    display: flex;
    align-items: center;
    gap: 10px;
}

.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.8);
    z-index: 2000;
    align-items: center;
    justify-content: center;
}

.modal.show {
    display: flex;
}

.modal-content {
    background: var(--dark);
    border: 2px solid var(--border);
    border-radius: 15px;
    padding: 30px;
    max-width: 500px;
    width: 90%;
}

.form-group {
    margin-bottom: 20px;
}

.form-label {
    display: block;
    margin-bottom: 5px;
    color: var(--primary);
}

.form-input {
    width: 100%;
    padding: 10px 15px;
    background: #1a1a1a;
    border: 1px solid var(--border);
    color: var(--light);
    border-radius: 5px;
}

.form-select {
    width: 100%;
    padding: 10px 15px;
    background: #1a1a1a;
    border: 1px solid var(--border);
    color: var(--light);
    border-radius: 5px;
}
</style>
</head>
<body>

<header class="enterprise-header">
    <div class="header-content">
        <div class="logo">SOULFRA ENTERPRISE</div>
        <div class="tier-badge">ENTERPRISE TIER</div>
    </div>
</header>

<div class="main-container">
    <div class="dashboard-grid">
        <aside class="sidebar">
            <div class="menu-item active" onclick="showTab('overview')">Dashboard</div>
            <div class="menu-item" onclick="showTab('games')">Game Instances</div>
            <div class="menu-item" onclick="showTab('licensing')">Licensing</div>
            <div class="menu-item" onclick="showTab('whitelabel')">White Label</div>
            <div class="menu-item" onclick="showTab('api')">API & SDK</div>
            <div class="menu-item" onclick="showTab('analytics')">Analytics</div>
            <div class="menu-item" onclick="showTab('billing')">Billing</div>
        </aside>
        
        <main class="content-area">
            <!-- Overview Tab -->
            <div id="overview" class="tab-content active">
                <h2 class="section-title">Enterprise Dashboard</h2>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">12</div>
                        <div class="stat-label">Active Games</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">3,847</div>
                        <div class="stat-label">Total Players</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">$24,650</div>
                        <div class="stat-label">Monthly Revenue</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">99.9%</div>
                        <div class="stat-label">Uptime</div>
                    </div>
                </div>
                
                <div class="licensing-panel">
                    <h3>Your Enterprise License</h3>
                    <p>Unlimited games, unlimited players, full API access</p>
                    <div style="margin-top: 15px;">
                        <strong>License Key:</strong> <span style="font-family: monospace;">ENTR-XXXX-XXXX-XXXX</span>
                    </div>
                </div>
            </div>
            
            <!-- Games Tab -->
            <div id="games" class="tab-content">
                <div class="section-title">
                    <span>Game Instances</span>
                    <button class="create-btn" onclick="showModal('create-game')">Create New Instance</button>
                </div>
                
                <div class="game-instances" id="game-instances">
                    <!-- Dynamic game instances -->
                </div>
            </div>
            
            <!-- Licensing Tab -->
            <div id="licensing" class="tab-content">
                <h2 class="section-title">Licensing Tiers</h2>
                
                <div class="license-tiers">
                    <div class="tier-card">
                        <div class="tier-name">Starter</div>
                        <div class="tier-price">$99/mo</div>
                        <ul class="tier-features">
                            <li>Up to 3 games</li>
                            <li>100 concurrent players</li>
                            <li>Basic analytics</li>
                            <li>Community support</li>
                        </ul>
                    </div>
                    
                    <div class="tier-card">
                        <div class="tier-name">Professional</div>
                        <div class="tier-price">$499/mo</div>
                        <ul class="tier-features">
                            <li>Up to 20 games</li>
                            <li>1,000 concurrent players</li>
                            <li>Advanced analytics</li>
                            <li>Priority support</li>
                            <li>White label options</li>
                        </ul>
                    </div>
                    
                    <div class="tier-card">
                        <div class="tier-name">Enterprise</div>
                        <div class="tier-price">Custom</div>
                        <ul class="tier-features">
                            <li>Unlimited games</li>
                            <li>Unlimited players</li>
                            <li>Custom analytics</li>
                            <li>Dedicated support</li>
                            <li>Full white label</li>
                            <li>Source code access</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- White Label Tab -->
            <div id="whitelabel" class="tab-content">
                <h2 class="section-title">White Label Configuration</h2>
                
                <div class="white-label-preview">
                    <h3>Brand Customization</h3>
                    <div class="color-picker">
                        <div class="color-input">
                            <label>Primary Color:</label>
                            <input type="color" value="#4CAF50" onchange="updateBranding('primary', this.value)">
                        </div>
                        <div class="color-input">
                            <label>Secondary Color:</label>
                            <input type="color" value="#2196F3" onchange="updateBranding('secondary', this.value)">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Company Name</label>
                        <input type="text" class="form-input" value="Your Company" onchange="updateBranding('name', this.value)">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Custom Domain</label>
                        <input type="text" class="form-input" value="games.yourcompany.com">
                    </div>
                </div>
            </div>
            
            <!-- API Tab -->
            <div id="api" class="tab-content">
                <h2 class="section-title">API & SDK Documentation</h2>
                
                <div class="api-section">
                    <h3>REST API Endpoints</h3>
                    
                    <div class="code-block">
                        <div><span class="method">POST</span> <span class="endpoint">/api/v1/games/create</span></div>
                        <div>Create a new game instance</div>
                    </div>
                    
                    <div class="code-block">
                        <div><span class="method">GET</span> <span class="endpoint">/api/v1/games/{game_id}</span></div>
                        <div>Get game instance details</div>
                    </div>
                    
                    <div class="code-block">
                        <div><span class="method">POST</span> <span class="endpoint">/api/v1/games/{game_id}/players</span></div>
                        <div>Add player to game</div>
                    </div>
                    
                    <div class="code-block">
                        <div><span class="method">GET</span> <span class="endpoint">/api/v1/analytics/realtime</span></div>
                        <div>Get real-time analytics data</div>
                    </div>
                    
                    <h3 style="margin-top: 30px;">SDK Examples</h3>
                    
                    <div class="code-block">
// JavaScript SDK
const soulfra = new SoulfraSDK({
    apiKey: 'your-api-key',
    tenant: 'your-tenant-id'
});

const game = await soulfra.createGame({
    type: 'habbo-style',
    config: {
        maxPlayers: 50,
        theme: 'custom'
    }
});
                    </div>
                </div>
            </div>
            
            <!-- Analytics Tab -->
            <div id="analytics" class="tab-content">
                <h2 class="section-title">Analytics Dashboard</h2>
                
                <div class="analytics-charts">
                    <div class="chart-container">
                        <h3>Player Activity (7 days)</h3>
                        <canvas id="activity-chart"></canvas>
                    </div>
                    
                    <div class="chart-container">
                        <h3>Revenue by Game Type</h3>
                        <canvas id="revenue-chart"></canvas>
                    </div>
                </div>
            </div>
        </main>
    </div>
</div>

<!-- Create Game Modal -->
<div id="create-game-modal" class="modal">
    <div class="modal-content">
        <h2>Create New Game Instance</h2>
        
        <div class="form-group">
            <label class="form-label">Game Type</label>
            <select class="form-select" id="game-type">
                <option value="simple">Simple Click Game</option>
                <option value="habbo">Habbo Style</option>
                <option value="runescape">RuneScape Style</option>
                <option value="arena">AI Battle Arena</option>
                <option value="custom">Custom Template</option>
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label">Instance Name</label>
            <input type="text" class="form-input" id="instance-name" placeholder="My Game Instance">
        </div>
        
        <div class="form-group">
            <label class="form-label">Max Players</label>
            <input type="number" class="form-input" id="max-players" value="100">
        </div>
        
        <div class="action-buttons">
            <button class="action-btn" onclick="closeModal()">Cancel</button>
            <button class="create-btn" onclick="createGameInstance()">Create Instance</button>
        </div>
    </div>
</div>

<script>
// Tab management
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Load tab-specific content
    if (tabName === 'games') {
        loadGameInstances();
    }
}

// Modal management
function showModal(modalName) {
    document.getElementById(modalName + '-modal').classList.add('show');
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
}

// Game instance management
let gameInstances = [
    { id: 'game-001', type: 'habbo', name: 'Main Lobby', players: 45, status: 'active' },
    { id: 'game-002', type: 'arena', name: 'Battle Arena #1', players: 23, status: 'active' },
    { id: 'game-003', type: 'runescape', name: 'Adventure World', players: 67, status: 'active' }
];

function loadGameInstances() {
    const container = document.getElementById('game-instances');
    container.innerHTML = '';
    
    gameInstances.forEach(instance => {
        const div = document.createElement('div');
        div.className = 'game-instance';
        div.innerHTML = `
            <div class="game-preview">
                <canvas class="game-canvas" id="canvas-${instance.id}"></canvas>
            </div>
            <div class="instance-info">
                <div>
                    <strong>${instance.name}</strong>
                    <div class="instance-id">${instance.id}</div>
                </div>
                <div class="player-count">${instance.players} players</div>
            </div>
            <div class="action-buttons">
                <button class="action-btn" onclick="viewInstance('${instance.id}')">View</button>
                <button class="action-btn" onclick="configureInstance('${instance.id}')">Configure</button>
                <button class="action-btn" onclick="embedCode('${instance.id}')">Embed</button>
            </div>
        `;
        container.appendChild(div);
        
        // Draw mini preview
        drawGamePreview(instance.id, instance.type);
    });
}

function drawGamePreview(gameId, gameType) {
    const canvas = document.getElementById(`canvas-${gameId}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Simple preview based on game type
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (gameType === 'habbo') {
        // Draw isometric floor
        ctx.strokeStyle = '#444';
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 40, canvas.height/2);
            ctx.lineTo(canvas.width/2 + i * 20, canvas.height);
            ctx.stroke();
        }
    } else if (gameType === 'arena') {
        // Draw fighters
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(50, canvas.height/2 - 10, 20, 20);
        ctx.fillStyle = '#DC143C';
        ctx.fillRect(canvas.width - 70, canvas.height/2 - 10, 20, 20);
    }
}

function createGameInstance() {
    const type = document.getElementById('game-type').value;
    const name = document.getElementById('instance-name').value;
    const maxPlayers = document.getElementById('max-players').value;
    
    const newInstance = {
        id: 'game-' + Date.now(),
        type: type,
        name: name || 'New Game',
        players: 0,
        status: 'active',
        maxPlayers: maxPlayers
    };
    
    gameInstances.push(newInstance);
    closeModal();
    loadGameInstances();
    
    // Show success message
    alert('Game instance created successfully!');
}

function updateBranding(type, value) {
    if (type === 'primary') {
        document.documentElement.style.setProperty('--primary', value);
    } else if (type === 'secondary') {
        document.documentElement.style.setProperty('--secondary', value);
    }
}

// Initialize
window.onload = function() {
    loadGameInstances();
};
</script>

</body>
</html>"""

class EnterpriseHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/status':
            self.send_json({'status': 'active', 'version': '2.0'})
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML_TEMPLATE.encode())
    
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api()
    
    def handle_api(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        data = json.loads(post_data)
        
        if self.path == '/api/v1/games/create':
            # Create game instance
            game_id = str(uuid.uuid4())
            cursor.execute('''
                INSERT INTO games (game_id, tenant_id, game_type, config)
                VALUES (?, ?, ?, ?)
            ''', (game_id, data.get('tenant_id', 'demo'), data.get('type'), json.dumps(data.get('config', {}))))
            conn.commit()
            
            self.send_json({'game_id': game_id, 'status': 'created'})
    
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def log_message(self, format, *args):
        pass

print(f"Soulfra Enterprise Engine running on http://localhost:{PORT}")
HTTPServer(("localhost", PORT), EnterpriseHandler).serve_forever()