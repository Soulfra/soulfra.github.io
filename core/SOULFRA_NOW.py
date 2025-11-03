#!/usr/bin/env python3
"""
SOULFRA NOW - The simplest working version
Just the core: drop file -> create agent -> earn VIBE
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import sqlite3
import hashlib
import random
from datetime import datetime
import threading
import time

# Initialize database
db = sqlite3.connect('soulfra_now.db', check_same_thread=False)
db.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        vibe_balance REAL DEFAULT 28000,
        agents_created INTEGER DEFAULT 0,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
db.execute('''
    CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        owner_id TEXT,
        name TEXT,
        earning_rate REAL DEFAULT 50,
        total_earned REAL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
''')
db.commit()

# Background earning thread
def agent_earner():
    """Agents earn VIBE every minute"""
    while True:
        time.sleep(60)
        db.execute('''
            UPDATE agents SET total_earned = total_earned + earning_rate
        ''')
        db.execute('''
            UPDATE users SET vibe_balance = vibe_balance + 
            (SELECT SUM(earning_rate) FROM agents WHERE owner_id = users.id)
        ''')
        db.commit()

# Start earning thread
earning_thread = threading.Thread(target=agent_earner, daemon=True)
earning_thread.start()

class SoulfraNowHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SOULFRA - AI Agent Economy</title>
    <style>
        body {
            background: #000;
            color: #0f0;
            font-family: monospace;
            text-align: center;
            padding: 50px;
        }
        
        h1 {
            font-size: 72px;
            text-shadow: 0 0 30px #0f0;
            margin: 20px;
        }
        
        .tagline {
            font-size: 24px;
            color: #0ff;
            margin-bottom: 40px;
        }
        
        .stats {
            background: #111;
            border: 2px solid #0f0;
            border-radius: 20px;
            padding: 30px;
            margin: 30px auto;
            max-width: 600px;
        }
        
        .stat-row {
            font-size: 20px;
            margin: 15px;
            display: flex;
            justify-content: space-between;
        }
        
        .stat-value {
            color: #0ff;
            font-weight: bold;
        }
        
        .drop-zone {
            border: 3px dashed #0f0;
            border-radius: 20px;
            padding: 60px;
            margin: 40px auto;
            max-width: 600px;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .drop-zone:hover {
            background: rgba(0, 255, 0, 0.1);
            transform: scale(1.05);
        }
        
        .drop-zone.dragover {
            background: rgba(0, 255, 0, 0.2);
            box-shadow: 0 0 30px #0f0;
        }
        
        button {
            background: #0f0;
            color: #000;
            border: none;
            padding: 20px 40px;
            font-size: 24px;
            font-weight: bold;
            cursor: pointer;
            margin: 20px;
            border-radius: 10px;
            transition: all 0.3s;
        }
        
        button:hover {
            transform: translateY(-3px);
            box-shadow: 0 5px 20px rgba(0, 255, 0, 0.5);
        }
        
        .agent {
            background: #111;
            border: 1px solid #0f0;
            padding: 15px;
            margin: 10px;
            border-radius: 10px;
            display: inline-block;
        }
        
        .bonus-banner {
            background: linear-gradient(45deg, #0f0, #0ff);
            color: #000;
            padding: 20px;
            font-size: 28px;
            font-weight: bold;
            margin: 20px auto;
            max-width: 800px;
            border-radius: 15px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
    </style>
</head>
<body>
    <h1>SOULFRA</h1>
    <p class="tagline">The AI Agent Economy - Start with $2,800 FREE!</p>
    
    <div class="bonus-banner">
        🎉 NEW USERS: 28,000 VIBE ($2,800) FREE! 🎉
    </div>
    
    <div class="stats">
        <div class="stat-row">
            <span>Your Balance:</span>
            <span class="stat-value" id="balance">28,000 VIBE</span>
        </div>
        <div class="stat-row">
            <span>Active Agents:</span>
            <span class="stat-value" id="agents">0</span>
        </div>
        <div class="stat-row">
            <span>Earning Rate:</span>
            <span class="stat-value" id="rate">0 VIBE/min</span>
        </div>
    </div>
    
    <div class="drop-zone" id="dropZone">
        <h2>📄 DROP ANY FILE HERE</h2>
        <p>Create AI agents instantly!</p>
        <p style="color: #666">Each file creates 5-10 agents</p>
        <p style="color: #666">Earn 10,000+ VIBE per drop!</p>
    </div>
    
    <input type="file" id="fileInput" style="display: none">
    
    <div>
        <button onclick="createTestAgent()">Create Test Agent</button>
        <button onclick="showAgents()">Show My Agents</button>
    </div>
    
    <div id="agentList"></div>
    
    <script>
        let userId = localStorage.getItem('soulfra_user_id');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('soulfra_user_id', userId);
            
            // Create new user
            fetch('/api/user', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({user_id: userId})
            });
        }
        
        // Update stats
        async function updateStats() {
            const response = await fetch('/api/stats?user_id=' + userId);
            const data = await response.json();
            
            document.getElementById('balance').textContent = 
                Math.floor(data.balance).toLocaleString() + ' VIBE';
            document.getElementById('agents').textContent = data.agents;
            document.getElementById('rate').textContent = 
                data.earning_rate + ' VIBE/min';
        }
        
        // Drag and drop
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        
        dropZone.addEventListener('click', () => fileInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });
        
        dropZone.addEventListener('drop', async (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                await processFile(files[0]);
            }
        });
        
        fileInput.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                await processFile(e.target.files[0]);
            }
        });
        
        async function processFile(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('user_id', userId);
            
            const response = await fetch('/api/process', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            alert(`WOW! Created ${data.agents_created} agents!\\nEarned ${data.vibe_earned} VIBE!`);
            
            updateStats();
            showAgents();
        }
        
        async function createTestAgent() {
            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: userId,
                    name: 'TestAgent_' + Date.now()
                })
            });
            
            const data = await response.json();
            alert(`Created ${data.name}!\\nEarning ${data.earning_rate} VIBE/minute`);
            
            updateStats();
            showAgents();
        }
        
        async function showAgents() {
            const response = await fetch('/api/agents?user_id=' + userId);
            const agents = await response.json();
            
            const list = document.getElementById('agentList');
            list.innerHTML = '<h3>Your AI Agents:</h3>';
            
            agents.forEach(agent => {
                list.innerHTML += `
                    <div class="agent">
                        <strong>${agent.name}</strong><br>
                        Earning: ${agent.earning_rate} VIBE/min<br>
                        Total: ${Math.floor(agent.total_earned)} VIBE
                    </div>
                `;
            });
        }
        
        // Update every 5 seconds
        setInterval(updateStats, 5000);
        updateStats();
    </script>
</body>
</html>
'''
            self.wfile.write(html.encode())
            
        elif self.path.startswith('/api/'):
            self.handle_api()
            
    def do_POST(self):
        if self.path.startswith('/api/'):
            self.handle_api()
            
    def handle_api(self):
        """Simple API endpoints"""
        
        if self.path == '/api/user' and self.command == 'POST':
            # Create user
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            user_id = data['user_id']
            db.execute('INSERT OR IGNORE INTO users (id) VALUES (?)', (user_id,))
            db.commit()
            
            self.send_json({'status': 'created'})
            
        elif self.path.startswith('/api/stats'):
            # Get user stats
            user_id = self.path.split('user_id=')[1]
            
            cursor = db.cursor()
            user = cursor.execute(
                'SELECT vibe_balance, agents_created FROM users WHERE id = ?',
                (user_id,)
            ).fetchone()
            
            if user:
                balance, agents = user
                earning_rate = cursor.execute(
                    'SELECT SUM(earning_rate) FROM agents WHERE owner_id = ?',
                    (user_id,)
                ).fetchone()[0] or 0
            else:
                balance, agents, earning_rate = 28000, 0, 0
                
            self.send_json({
                'balance': balance,
                'agents': agents,
                'earning_rate': earning_rate
            })
            
        elif self.path == '/api/agent' and self.command == 'POST':
            # Create single agent
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            agent_id = f"agent_{hashlib.md5(f"{data['name']}{datetime.now()}".encode()).hexdigest()[:8]}"
            earning_rate = random.randint(10, 100)
            
            db.execute('''
                INSERT INTO agents (id, owner_id, name, earning_rate)
                VALUES (?, ?, ?, ?)
            ''', (agent_id, data['user_id'], data['name'], earning_rate))
            
            db.execute('''
                UPDATE users SET agents_created = agents_created + 1
                WHERE id = ?
            ''', (data['user_id'],))
            
            db.commit()
            
            self.send_json({
                'agent_id': agent_id,
                'name': data['name'],
                'earning_rate': earning_rate
            })
            
        elif self.path == '/api/process' and self.command == 'POST':
            # Process file drop
            # In real implementation, would parse multipart form data
            # For now, simulate it
            user_id = 'user_demo'  # Would extract from form data
            
            # Create multiple agents
            agents_created = random.randint(5, 10)
            vibe_earned = random.randint(10000, 50000)
            
            for i in range(agents_created):
                agent_id = f"agent_{hashlib.md5(f"file_{i}_{datetime.now()}".encode()).hexdigest()[:8]}"
                earning_rate = random.randint(20, 80)
                
                db.execute('''
                    INSERT INTO agents (id, owner_id, name, earning_rate)
                    VALUES (?, ?, ?, ?)
                ''', (agent_id, user_id, f"FileAgent_{i}", earning_rate))
                
            db.execute('''
                UPDATE users SET 
                    agents_created = agents_created + ?,
                    vibe_balance = vibe_balance + ?
                WHERE id = ?
            ''', (agents_created, vibe_earned, user_id))
            
            db.commit()
            
            self.send_json({
                'agents_created': agents_created,
                'vibe_earned': vibe_earned
            })
            
        elif self.path.startswith('/api/agents'):
            # Get user's agents
            user_id = self.path.split('user_id=')[1]
            
            cursor = db.cursor()
            agents = cursor.execute('''
                SELECT name, earning_rate, total_earned 
                FROM agents WHERE owner_id = ?
            ''', (user_id,)).fetchall()
            
            self.send_json([{
                'name': a[0],
                'earning_rate': a[1],
                'total_earned': a[2]
            } for a in agents])
            
    def send_json(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

if __name__ == '__main__':
    print("🚀 SOULFRA NOW - Starting on http://localhost:9876")
    print("💰 Every user starts with 28,000 VIBE ($2,800)!")
    print("📄 Drop any file to create AI agents that earn for you!")
    print("\nPress Ctrl+C to stop")
    
    server = HTTPServer(('0.0.0.0', 9876), SoulfraNowHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✅ Server stopped")