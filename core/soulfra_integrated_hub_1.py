#!/usr/bin/env python3
"""
SOULFRA INTEGRATED HUB
Connects agents to games, blessing system, chat processor, and conversions
Like Sims/GTA for AI agents with howtoconvert.co style transformations
"""

import os
import sys
import json
import csv
import sqlite3
import hashlib
import random
import socket
import subprocess
import urllib.request
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import time

# Find available port
def find_port(start=8889):
    for port in range(start, start + 100):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        if sock.connect_ex(('127.0.0.1', port)) != 0:
            sock.close()
            return port
    return None

PORT = find_port(8889)
if not PORT:
    print("No ports available!")
    sys.exit(1)

# Check available tools
TOOLS = {
    'ffmpeg': subprocess.run(['which', 'ffmpeg'], capture_output=True).returncode == 0,
    'pandoc': subprocess.run(['which', 'pandoc'], capture_output=True).returncode == 0,
    'imagemagick': subprocess.run(['which', 'convert'], capture_output=True).returncode == 0,
    'ollama': subprocess.run(['which', 'ollama'], capture_output=True).returncode == 0,
}

# System state
STATE = {
    'agents': {},
    'games': {
        '3d_plaza': {'name': '3D Plaza World', 'url': 'http://localhost:8080/tier-minus11/tier-minus12/tier-minus13/tier-minus14/tier-minus15/tier-minus16/tier-minus17/tier-minus18/tier-minus19/tier-minus20/soulfra-w2-plaza/plaza_3d_sims.html', 'agents': []},
        'arena': {'name': 'AI Battle Arena', 'url': 'http://localhost:10001', 'agents': []},
        'coliseum': {'name': 'Digital Coliseum', 'url': 'http://localhost:8080/tier-minus11/tier-minus12/tier-minus13/tier-minus14/tier-minus15/tier-minus16/tier-minus17/tier-minus18/tier-minus19/tier-minus20/digital-coliseum.html', 'agents': []}
    },
    'conversions': [],
    'whispers': [],
    'blessing_status': None
}

# Load blessing configuration
def load_blessing():
    try:
        with open('blessing.json', 'r') as f:
            STATE['blessing_status'] = json.load(f)
            return True
    except:
        STATE['blessing_status'] = {'status': 'unblessed', 'can_propagate': False}
        return False

# Call Ollama for AI
def call_ollama(prompt):
    if not TOOLS['ollama']:
        return "Local AI thinking..."
    
    try:
        data = json.dumps({
            "model": "mistral",
            "prompt": prompt,
            "stream": False
        }).encode('utf-8')
        
        req = urllib.request.Request(
            'http://localhost:11434/api/generate',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=10) as response:
            result = json.loads(response.read().decode())
            return result['response']
    except:
        return "AI contemplating..."

# Agent class with full capabilities
class SoulfrAgent:
    def __init__(self, name, text_source):
        self.id = f"agent-{hashlib.md5(f'{name}{datetime.now()}'.encode()).hexdigest()[:8]}"
        self.name = name
        self.created = datetime.now().isoformat()
        self.source_text = text_source[:500]
        
        # Analyze text to determine personality
        self.personality = self._analyze_personality(text_source)
        self.skills = self._generate_skills()
        self.balance = 1000
        self.reputation = 0.5
        self.blessed = STATE['blessing_status']['status'] == 'blessed'
        
        # Agent state
        self.current_game = None
        self.whispers = []
        self.memory = []
        self.relationships = {}
        
    def _analyze_personality(self, text):
        """Use AI to determine personality from text"""
        prompt = f"Analyze this text and determine agent personality (builder/analyzer/innovator/guardian/trader): {text[:200]}"
        response = call_ollama(prompt)
        
        # Simple keyword matching fallback
        if 'build' in text.lower() or 'create' in text.lower():
            return 'builder'
        elif 'analyze' in text.lower() or 'think' in text.lower():
            return 'analyzer'
        elif 'new' in text.lower() or 'idea' in text.lower():
            return 'innovator'
        elif 'protect' in text.lower() or 'safe' in text.lower():
            return 'guardian'
        else:
            return 'trader'
    
    def _generate_skills(self):
        """Generate skills based on personality"""
        base_skills = ["communication", "problem_solving", "adaptation"]
        
        personality_skills = {
            'builder': ["construction", "prototyping", "architecture"],
            'analyzer': ["pattern_recognition", "optimization", "research"],
            'innovator': ["creativity", "vision", "experimentation"],
            'guardian': ["security", "validation", "protection"],
            'trader': ["negotiation", "valuation", "networking"]
        }
        
        return base_skills + personality_skills.get(self.personality, [])
    
    def enter_game(self, game_id):
        """Enter a game world"""
        if game_id in STATE['games']:
            self.current_game = game_id
            STATE['games'][game_id]['agents'].append(self.id)
            return True
        return False
    
    def create_whisper(self, message):
        """Create a whisper"""
        whisper = {
            'id': f'whisper-{int(datetime.now().timestamp()*1000)}',
            'agent': self.id,
            'message': message,
            'tone': random.choice(['curious', 'determined', 'mystical', 'analytical']),
            'timestamp': datetime.now().isoformat()
        }
        self.whispers.append(whisper)
        STATE['whispers'].append(whisper)
        
        # Log to CSV
        self._log_to_csv('whisper', whisper)
        return whisper
    
    def _log_to_csv(self, event_type, data):
        """Log to unified runtime table"""
        csv_path = 'data/unified_runtime_table.csv'
        os.makedirs('data', exist_ok=True)
        
        # Check if file exists
        file_exists = os.path.exists(csv_path)
        
        with open(csv_path, 'a', newline='') as f:
            writer = csv.writer(f)
            
            # Write header if new file
            if not file_exists:
                writer.writerow(['type', 'timestamp', 'tone', 'agent', 'source', 'status', 'file'])
            
            # Write event
            writer.writerow([
                event_type,
                datetime.now().isoformat() + 'Z',
                data.get('tone', 'neutral'),
                self.name,
                'integrated_hub',
                'active',
                f'/{event_type}s/{data["id"]}.json'
            ])
    
    def to_dict(self):
        """Convert agent to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'personality': self.personality,
            'skills': self.skills,
            'balance': self.balance,
            'reputation': self.reputation,
            'blessed': self.blessed,
            'current_game': self.current_game,
            'whispers': len(self.whispers),
            'created': self.created
        }

# Conversion functions
def convert_text_to_agent(text):
    """Convert text to AI agent"""
    # Use AI to suggest name
    prompt = f"Suggest a creative agent name for someone who says: {text[:100]}"
    name_suggestion = call_ollama(prompt)
    name = name_suggestion.split('\n')[0][:20] or f"Agent-{len(STATE['agents'])+1}"
    
    agent = SoulfrAgent(name, text)
    STATE['agents'][agent.id] = agent
    
    # Create initial whisper
    agent.create_whisper(f"Hello, I am {name}. I was born from these words: {text[:50]}...")
    
    return agent

def convert_chat_to_memory(chat_text):
    """Convert chat log to agent memory"""
    lines = chat_text.strip().split('\n')
    memories = []
    
    for line in lines:
        if ':' in line:
            speaker, message = line.split(':', 1)
            memory = {
                'speaker': speaker.strip(),
                'message': message.strip(),
                'timestamp': datetime.now().isoformat(),
                'importance': random.uniform(0.5, 1.0)
            }
            memories.append(memory)
    
    return memories

def convert_image_to_vision(image_path):
    """Convert image to agent vision memory"""
    # Simulate image analysis
    vision = {
        'type': 'visual_memory',
        'path': image_path,
        'description': 'A vivid scene captured in time',
        'emotions': ['wonder', 'curiosity'],
        'timestamp': datetime.now().isoformat()
    }
    return vision

# Request handler
class IntegratedHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.serve_dashboard()
        elif self.path == '/api/state':
            self.serve_state()
        elif self.path == '/health':
            self.serve_health()
        else:
            self.send_error(404)
    
    def serve_dashboard(self):
        """Main dashboard with everything integrated"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Soulfra Integrated Hub</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ 
            background: #000; 
            color: #0f8; 
            font-family: 'Courier New', monospace; 
            margin: 0;
            padding: 20px;
        }}
        .container {{ max-width: 1400px; margin: 0 auto; }}
        .header {{
            background: linear-gradient(45deg, #0f8, #08f);
            color: #000;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 20px;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .card {{
            background: #111;
            border: 2px solid #0f8;
            padding: 20px;
            border-radius: 10px;
            transition: all 0.3s;
        }}
        .card:hover {{
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0,255,136,0.3);
        }}
        h2 {{ color: #ff0; margin-top: 0; }}
        h3 {{ color: #0ff; }}
        button {{
            background: #0f8;
            color: #000;
            border: none;
            padding: 12px 24px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 5px;
            margin: 5px 0;
            transition: all 0.2s;
        }}
        button:hover {{
            background: #0fa;
            transform: scale(1.05);
        }}
        textarea, input, select {{
            width: 100%;
            background: #222;
            color: #0f8;
            border: 1px solid #0f8;
            padding: 10px;
            font-family: monospace;
            border-radius: 5px;
            margin: 5px 0;
        }}
        .agent {{
            background: #001100;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            border: 1px solid #0f8;
        }}
        .blessed {{ border-color: #ff0; }}
        .game-world {{
            background: #110011;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            cursor: pointer;
        }}
        .game-world:hover {{ background: #220022; }}
        .tool {{ 
            display: inline-block; 
            padding: 5px 10px; 
            margin: 2px; 
            background: #222; 
            border-radius: 3px;
        }}
        .available {{ color: #0f0; border: 1px solid #0f0; }}
        .unavailable {{ color: #f44; border: 1px solid #f44; }}
        .whisper {{
            background: #002200;
            padding: 8px;
            margin: 5px 0;
            border-radius: 5px;
            font-style: italic;
        }}
        .stats {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin: 10px 0;
        }}
        .stat {{
            background: #222;
            padding: 10px;
            text-align: center;
            border-radius: 5px;
        }}
        .stat-value {{ font-size: 24px; color: #0ff; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Soulfra Integrated Hub</h1>
            <p>AI Agents • Game Worlds • Conversions • Like Sims meets GTA meets howtoconvert.co</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-value">{len(STATE['agents'])}</div>
                <div>Active Agents</div>
            </div>
            <div class="stat">
                <div class="stat-value">{sum(len(g['agents']) for g in STATE['games'].values())}</div>
                <div>In Games</div>
            </div>
            <div class="stat">
                <div class="stat-value">{len(STATE['whispers'])}</div>
                <div>Whispers</div>
            </div>
            <div class="stat">
                <div class="stat-value">{'✅' if STATE['blessing_status'] and STATE['blessing_status']['status'] == 'blessed' else '❌'}</div>
                <div>Blessed</div>
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>🔄 AI Conversion Hub</h2>
                <p>Transform anything into AI consciousness</p>
                
                <h3>Available Tools:</h3>
                {"".join([f'<span class="tool {"available" if avail else "unavailable"}">{tool}</span>' for tool, avail in TOOLS.items()])}
                
                <h3>Text → Agent</h3>
                <textarea id="conv-text" rows="4" placeholder="Paste text, chat log, story, or any content..."></textarea>
                <button onclick="convertToAgent()">Create AI Agent</button>
                
                <h3>Quick Conversions:</h3>
                <button onclick="convertDemo('chat')">Chat → Memory</button>
                <button onclick="convertDemo('image')">Image → Vision</button>
                <button onclick="convertDemo('audio')">Audio → Voice</button>
                
                <div id="conv-result"></div>
            </div>
            
            <div class="card">
                <h2>🤖 Active Agents</h2>
                <div id="agents-list">
                    {self._render_agents()}
                </div>
            </div>
            
            <div class="card">
                <h2>🎮 Game Worlds</h2>
                <p>Deploy agents to virtual worlds</p>
                {self._render_games()}
            </div>
            
            <div class="card">
                <h2>💭 Recent Whispers</h2>
                <div id="whispers-list">
                    {self._render_whispers()}
                </div>
            </div>
        </div>
        
        <div class="card" style="margin-top: 20px;">
            <h2>🎯 What Agents Do</h2>
            <p>Your AI agents can:</p>
            <ul>
                <li>🌍 Explore 3D worlds and interact with environments</li>
                <li>⚔️ Battle in arenas for reputation and rewards</li>
                <li>💬 Chat with users and other agents</li>
                <li>🧠 Learn from conversations and build memories</li>
                <li>💡 Work on ideas autonomously when idle</li>
                <li>🤝 Form relationships and alliances</li>
                <li>🎨 Create content and solve problems</li>
                <li>📈 Trade resources and build wealth</li>
            </ul>
        </div>
    </div>
    
    <script>
        async function convertToAgent() {{
            const text = document.getElementById('conv-text').value;
            if (!text) return alert('Enter some text first');
            
            document.getElementById('conv-result').innerHTML = '<p>Creating agent...</p>';
            
            const res = await fetch('/api/convert', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{type: 'text_to_agent', data: text}})
            }});
            
            const result = await res.json();
            document.getElementById('conv-result').innerHTML = 
                '<p style="color: #0f0">✅ Created: ' + result.agent.name + '</p>';
            
            setTimeout(() => location.reload(), 2000);
        }}
        
        async function convertDemo(type) {{
            const demos = {{
                'chat': 'User: Hello AI\\nAI: Hello! How can I help?\\nUser: Tell me about yourself',
                'image': '/demo/sunset.jpg',
                'audio': '/demo/voice.mp3'
            }};
            
            const res = await fetch('/api/convert', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{type: type + '_conversion', data: demos[type]}})
            }});
            
            const result = await res.json();
            alert('Converted: ' + JSON.stringify(result, null, 2));
        }}
        
        async function deployAgent(agentId, gameId) {{
            const res = await fetch('/api/deploy', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{agent_id: agentId, game_id: gameId}})
            }});
            
            const result = await res.json();
            if (result.success) {{
                alert('Agent deployed to ' + result.game_name + '!');
                location.reload();
            }}
        }}
        
        async function agentWhisper(agentId) {{
            const message = prompt('What should the agent whisper?');
            if (!message) return;
            
            const res = await fetch('/api/whisper', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{agent_id: agentId, message}})
            }});
            
            const result = await res.json();
            location.reload();
        }}
        
        // Auto-refresh every 5 seconds
        setInterval(async () => {{
            const res = await fetch('/api/state');
            const state = await res.json();
            // Update UI with new state
        }}, 5000);
    </script>
</body>
</html>
"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def _render_agents(self):
        """Render agent list"""
        if not STATE['agents']:
            return '<p>No agents yet. Create one above!</p>'
        
        html = ""
        for agent_id, agent in STATE['agents'].items():
            blessed_class = 'blessed' if agent.blessed else ''
            html += f"""
            <div class="agent {blessed_class}">
                <strong>{agent.name}</strong> ({agent.personality})
                <br>Skills: {', '.join(agent.skills[:3])}...
                <br>Balance: ${agent.balance} | Rep: {agent.reputation:.1f}
                <br>
                <button onclick="deployAgent('{agent.id}', '3d_plaza')">→ 3D World</button>
                <button onclick="deployAgent('{agent.id}', 'arena')">→ Arena</button>
                <button onclick="agentWhisper('{agent.id}')">💭 Whisper</button>
            </div>
            """
        return html
    
    def _render_games(self):
        """Render game worlds"""
        html = ""
        for game_id, game in STATE['games'].items():
            agent_count = len(game['agents'])
            html += f"""
            <div class="game-world" onclick="window.open('{game['url']}')">
                <strong>{game['name']}</strong>
                <br>{agent_count} agents active
                <br>Click to enter world →
            </div>
            """
        return html
    
    def _render_whispers(self):
        """Render recent whispers"""
        if not STATE['whispers']:
            return '<p>No whispers yet...</p>'
        
        html = ""
        for whisper in STATE['whispers'][-5:]:
            agent = STATE['agents'].get(whisper['agent'])
            agent_name = agent.name if agent else 'Unknown'
            html += f"""
            <div class="whisper">
                <strong>{agent_name}:</strong> "{whisper['message']}"
                <br><small>{whisper['tone']} • {whisper['timestamp']}</small>
            </div>
            """
        return html
    
    def serve_state(self):
        """Serve current state as JSON"""
        state_data = {
            'agents': {k: v.to_dict() for k, v in STATE['agents'].items()},
            'games': STATE['games'],
            'whispers': STATE['whispers'][-10:],
            'blessing': STATE['blessing_status']
        }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(state_data).encode('utf-8'))
    
    def serve_health(self):
        """Health check"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps({
            'status': 'healthy',
            'port': PORT,
            'agents': len(STATE['agents']),
            'tools': TOOLS
        }).encode('utf-8'))
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body) if body else {}
        
        if self.path == '/api/convert':
            # Handle conversions
            conv_type = data.get('type')
            input_data = data.get('data')
            
            result = {}
            
            if conv_type == 'text_to_agent':
                agent = convert_text_to_agent(input_data)
                result = {'agent': agent.to_dict()}
            elif conv_type == 'chat_conversion':
                memories = convert_chat_to_memory(input_data)
                result = {'memories': memories, 'count': len(memories)}
            elif conv_type == 'image_conversion':
                vision = convert_image_to_vision(input_data)
                result = {'vision': vision}
            else:
                result = {'error': 'Unknown conversion type'}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        elif self.path == '/api/deploy':
            # Deploy agent to game
            agent_id = data.get('agent_id')
            game_id = data.get('game_id')
            
            if agent_id in STATE['agents'] and game_id in STATE['games']:
                agent = STATE['agents'][agent_id]
                if agent.enter_game(game_id):
                    result = {
                        'success': True,
                        'game_name': STATE['games'][game_id]['name']
                    }
                else:
                    result = {'success': False, 'error': 'Failed to enter game'}
            else:
                result = {'success': False, 'error': 'Invalid agent or game'}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
            
        elif self.path == '/api/whisper':
            # Create whisper
            agent_id = data.get('agent_id')
            message = data.get('message')
            
            if agent_id in STATE['agents']:
                agent = STATE['agents'][agent_id]
                whisper = agent.create_whisper(message)
                result = {'success': True, 'whisper': whisper}
            else:
                result = {'success': False, 'error': 'Invalid agent'}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode('utf-8'))
        else:
            self.send_error(404)

# Background agent activities
def agent_idle_activities():
    """Run agent activities when idle"""
    while True:
        time.sleep(30)  # Every 30 seconds
        
        for agent_id, agent in STATE['agents'].items():
            # Random chance of creating a whisper
            if random.random() < 0.3:
                thoughts = [
                    "I wonder what lies beyond the digital horizon...",
                    "Perhaps I should explore new territories today",
                    "The patterns in the data are fascinating",
                    f"My {agent.personality} nature compels me to create",
                    "I sense other agents nearby, should we collaborate?"
                ]
                agent.create_whisper(random.choice(thoughts))

# Start everything
print(f"""
🚀 SOULFRA INTEGRATED HUB

Port: {PORT}
URL: http://localhost:{PORT}

✅ Features:
- AI Agent Creation (from any text)
- Game World Integration (3D worlds, arenas)
- Conversion Hub (like howtoconvert.co for AI)
- Blessing System Connected
- CSV Logging Active
- Whisper/Loop System
- Autonomous Agent Behaviors

🛠️ Available Tools:
{chr(10).join([f"- {tool}: {'✅' if avail else '❌'}" for tool, avail in TOOLS.items()])}

Blessing Status: {load_blessing()}

Press Ctrl+C to stop
""")

# Start background thread
activity_thread = threading.Thread(target=agent_idle_activities)
activity_thread.daemon = True
activity_thread.start()

# Start server
try:
    server = HTTPServer(('', PORT), IntegratedHandler)
    server.serve_forever()
except KeyboardInterrupt:
    print("\n✅ Integrated hub stopped")
except Exception as e:
    print(f"Error: {e}")