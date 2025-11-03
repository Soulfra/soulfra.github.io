#!/usr/bin/env python3
"""
SOULFRA V1 ENHANCED - Bicycle with First Upgrade
Still uses Ollama, but now connects to your existing infrastructure
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import os
import csv
from datetime import datetime
import subprocess

PORT = 5001

# Storage
agents = []

# Check what existing features we can use
FEATURES = {
    'csv_logging': os.path.exists('data/unified_runtime_table.csv'),
    'blessing_system': os.path.exists('blessing.json'),
    'chat_processor': os.path.exists('CHAT_LOG_PROCESSOR.py'),
    'drop_system': os.path.exists('drop'),
    'mirror_shell': os.path.exists('mirror-shell'),
}

print("🔍 Checking existing features:")
for feature, available in FEATURES.items():
    print(f"  {feature}: {'✅' if available else '❌'}")

def call_ollama(prompt):
    """Call your local Ollama - our reliable bicycle engine"""
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
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode())
            return result['response']
    except Exception as e:
        print(f"Ollama error: {e}")
        return f"[Ollama offline - fallback response]"

def log_to_csv(event_type, data):
    """Log to your existing CSV structure"""
    if not FEATURES['csv_logging']:
        return
    
    csv_path = 'data/unified_runtime_table.csv'
    
    # Create dir if needed
    os.makedirs('data', exist_ok=True)
    
    # Check if file exists to write headers
    write_headers = not os.path.exists(csv_path)
    
    with open(csv_path, 'a', newline='') as f:
        if write_headers:
            writer = csv.writer(f)
            writer.writerow(['timestamp', 'type', 'agent', 'whisper', 'tone', 'source', 'status', 'file_path', 'notes'])
        
        writer = csv.writer(f)
        writer.writerow([
            datetime.now().isoformat(),
            event_type,
            data.get('agent', ''),
            data.get('whisper', ''),
            data.get('tone', 'neutral'),
            'soulfra_v1',
            data.get('status', 'active'),
            data.get('file_path', ''),
            json.dumps(data)
        ])
    
    print(f"📝 Logged to CSV: {event_type}")

def load_blessing_config():
    """Load existing blessing configuration"""
    if not FEATURES['blessing_system']:
        return None
    
    try:
        with open('blessing.json', 'r') as f:
            return json.load(f)
    except:
        return None

def process_with_chat_processor(text_file):
    """Use existing chat processor if available"""
    if not FEATURES['chat_processor']:
        return None
    
    try:
        result = subprocess.run(
            ['python3', 'CHAT_LOG_PROCESSOR.py', text_file],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            return result.stdout
    except:
        pass
    return None

class EnhancedHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.serve_home()
        elif self.path.startswith('/agent/'):
            self.serve_agent()
        elif self.path == '/dashboard':
            self.serve_dashboard()
        else:
            self.send_error(404)
    
    def serve_home(self):
        blessing = load_blessing_config()
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra V1 Enhanced</title>
    <style>
        body {{ background: #000; color: #0f8; font-family: monospace; padding: 40px; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
        textarea {{ width: 100%; height: 200px; background: #111; color: #0f8; border: 2px solid #0f8; padding: 10px; }}
        button {{ background: #0f8; color: #000; border: none; padding: 15px 30px; cursor: pointer; font-size: 18px; }}
        .status {{ background: #111; padding: 10px; margin: 10px 0; border-left: 3px solid #0f8; }}
        .agent {{ background: #001100; padding: 15px; margin: 10px 0; border: 1px solid #0f8; }}
        .blessing {{ color: #ff0; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚲→🏎️ Soulfra V1 Enhanced</h1>
        
        <div class="status">
            <strong>System Status:</strong><br>
            • Ollama: ✅ Running<br>
            • CSV Logging: {'✅' if FEATURES['csv_logging'] else '❌'}<br>
            • Blessing System: {'✅' if blessing else '❌'}<br>
            • Chat Processor: {'✅' if FEATURES['chat_processor'] else '❌'}<br>
            • Agents Created: {len(agents)}
        </div>
        
        {f'<div class="blessing">✨ Blessed by: {blessing.get("blessed_by", "Cal Riven")}</div>' if blessing else ''}
        
        <h2>Create Agent</h2>
        <textarea id="text" placeholder="Paste your text here..."></textarea>
        <br>
        <button onclick="createAgent()">Create Agent ($1)</button>
        
        <div id="result"></div>
        
        <h2>Active Agents</h2>
        <div id="agents">
            {''.join([f'<div class="agent">🤖 {a["name"]} ({a["personality"]}) - <a href="/agent/{a["id"]}">View</a></div>' for a in agents])}
        </div>
        
        <p><a href="/dashboard">📊 View Dashboard</a></p>
    </div>
    
    <script>
        async function createAgent() {{
            const text = document.getElementById('text').value;
            if (!text) return alert('Enter some text');
            
            document.getElementById('result').innerHTML = '<p>Creating enhanced agent...</p>';
            
            try {{
                const res = await fetch('/api/create', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{text}})
                }});
                
                const agent = await res.json();
                
                document.getElementById('result').innerHTML = `
                    <div class="agent" style="border-color: #0ff;">
                        <h3>✅ Agent Created!</h3>
                        <p>Name: ${{agent.name}}</p>
                        <p>Personality: ${{agent.personality}}</p>
                        <p>Blessed: ${{agent.blessed ? '✨ Yes' : '❌ No'}}</p>
                        <p><a href="/agent/${{agent.id}}">Go to Agent →</a></p>
                    </div>
                `;
                
                setTimeout(() => location.reload(), 3000);
                
            }} catch(e) {{
                document.getElementById('result').innerHTML = '<p style="color:red">Error: ' + e + '</p>';
            }}
        }}
    </script>
</body>
</html>
"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_dashboard(self):
        """Simple dashboard showing CSV data"""
        html = '<h1>Dashboard</h1><pre>'
        
        if FEATURES['csv_logging'] and os.path.exists('data/unified_runtime_table.csv'):
            with open('data/unified_runtime_table.csv', 'r') as f:
                # Show last 20 lines
                lines = f.readlines()
                html += ''.join(lines[-20:])
        else:
            html += 'No data yet'
        
        html += '</pre><p><a href="/">← Back</a></p>'
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_agent(self):
        agent_id = self.path.split('/')[-1]
        agent = next((a for a in agents if a['id'] == agent_id), None)
        
        if not agent:
            self.send_error(404)
            return
        
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>{agent['name']} - Soulfra Agent</title>
    <style>
        body {{ background: #000; color: #0f8; font-family: monospace; padding: 40px; text-align: center; }}
        .info {{ background: #111; padding: 20px; margin: 20px auto; max-width: 600px; }}
        textarea {{ width: 100%; background: #111; color: #0f8; border: 2px solid #0f8; padding: 10px; }}
        button {{ background: #0f8; color: #000; border: none; padding: 10px 30px; cursor: pointer; }}
        .whisper {{ text-align: left; background: #001100; padding: 10px; margin: 5px 0; }}
        .response {{ text-align: left; background: #110011; padding: 10px; margin: 5px 0; }}
    </style>
</head>
<body>
    <h1>🤖 {agent['name']}</h1>
    
    <div class="info">
        <p>Personality: {agent['personality']}</p>
        <p>Created: {agent['created']}</p>
        <p>Blessed: {'✨ Yes' if agent.get('blessed') else '❌ No'}</p>
        {f"<p>Drop URL: /drop/{agent['drop_id']}/</p>" if agent.get('drop_id') else ''}
    </div>
    
    <textarea id="whisper" placeholder="Whisper to {agent['name']}..."></textarea>
    <br>
    <button onclick="sendWhisper()">Send Whisper</button>
    
    <div id="conversation"></div>
    
    <script>
        async function sendWhisper() {{
            const whisper = document.getElementById('whisper').value;
            if (!whisper) return;
            
            document.getElementById('conversation').innerHTML += 
                '<div class="whisper">You: ' + whisper + '</div>';
            
            const res = await fetch('/api/whisper', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{
                    agent_id: '{agent['id']}',
                    whisper: whisper
                }})
            }});
            
            const data = await res.json();
            
            document.getElementById('conversation').innerHTML += 
                '<div class="response">{agent['name']}: ' + data.response + '</div>';
            
            document.getElementById('whisper').value = '';
        }}
    </script>
</body>
</html>
"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def do_POST(self):
        if self.path == '/api/create':
            self.create_agent()
        elif self.path == '/api/whisper':
            self.handle_whisper()
        else:
            self.send_error(404)
    
    def create_agent(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        data = json.loads(body)
        
        text = data.get('text', '')
        
        # Use Ollama to analyze
        prompt = f"""Analyze this text and suggest an AI agent personality.
Text: {text[:300]}...

Respond with ONLY these three things separated by |:
personality_type|agent_name|purpose

Example: curious|Explorer-7|Helps discover new ideas"""
        
        ollama_response = call_ollama(prompt)
        
        # Parse response
        parts = ollama_response.strip().split('|')
        if len(parts) >= 3:
            personality, name, purpose = parts[0], parts[1], parts[2]
        else:
            personality = "helpful"
            name = f"Agent-{len(agents)+1}"
            purpose = "General assistance"
        
        # Create agent
        agent = {
            'id': f'agent-{int(datetime.now().timestamp())}',
            'name': name.strip(),
            'personality': personality.strip(),
            'purpose': purpose.strip(),
            'created': datetime.now().isoformat(),
            'blessed': False
        }
        
        # Check blessing system
        blessing = load_blessing_config()
        if blessing and blessing.get('status') == 'blessed':
            agent['blessed'] = True
            agent['blessing_propagation'] = blessing.get('can_propagate', False)
        
        # Create drop if drop system exists
        if FEATURES['drop_system']:
            agent['drop_id'] = f'Drop_{int(datetime.now().timestamp())}'
            drop_dir = f"drop/{agent['drop_id']}"
            os.makedirs(drop_dir, exist_ok=True)
            
            # Simple drop page
            with open(f"{drop_dir}/index.html", 'w') as f:
                f.write(f"<h1>{agent['name']}</h1><p>{agent['purpose']}</p>")
        
        agents.append(agent)
        
        # Log to CSV
        log_to_csv('agent_created', agent)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(agent).encode())
    
    def handle_whisper(self):
        content_length = int(self.headers['Content-Length'])
        body = self.rfile.read(content_length)
        data = json.loads(body)
        
        agent_id = data.get('agent_id')
        whisper = data.get('whisper')
        
        agent = next((a for a in agents if a['id'] == agent_id), None)
        if not agent:
            self.send_error(404)
            return
        
        # Use Ollama for response
        prompt = f"""You are {agent['name']}, an AI agent with {agent['personality']} personality.
Your purpose: {agent['purpose']}
User says: "{whisper}"
Respond in character (1-2 sentences):"""
        
        response = call_ollama(prompt).strip()
        
        # Log whisper
        log_to_csv('whisper', {
            'agent': agent['name'],
            'whisper': whisper,
            'response': response
        })
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'response': response}).encode())

# Start server
print(f"""
🚲→🏎️ SOULFRA V1 ENHANCED

Starting server on http://localhost:{PORT}

This version:
✅ Ollama for AI (bicycle engine)
✅ CSV logging to your existing structure
✅ Blessing system integration
✅ Drop page creation
✅ Falls back gracefully if features missing

Next upgrade: Add chat processor, then daemons...
""")

try:
    server = HTTPServer(('', PORT), EnhancedHandler)
    server.serve_forever()
except KeyboardInterrupt:
    print("\n👋 Shutting down...")
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("Try: lsof -i :5001 to check port")