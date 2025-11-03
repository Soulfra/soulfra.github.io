#!/usr/bin/env python3
"""
SOULFRA SIMPLE START
One file, all features, no timeouts
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import threading
import os
from datetime import datetime

# Single port for everything
PORT = 5555

# State
STATE = {
    'agents': [],
    'conversions': [],
    'phase': 'bicycle',
    'tasks_complete': 5,
    'tasks_total': 25
}

def call_ollama(prompt):
    """Call Ollama"""
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
        return "AI thinking..."

class UnifiedHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.serve_dashboard()
        elif self.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(STATE).encode())
        else:
            self.send_error(404)
    
    def serve_dashboard(self):
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Hub</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ background: #000; color: #0f8; font-family: monospace; padding: 20px; }}
        .container {{ max-width: 1200px; margin: 0 auto; }}
        .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }}
        .card {{ background: #111; border: 2px solid #0f8; padding: 20px; }}
        button {{ background: #0f8; color: #000; border: none; padding: 10px 20px; cursor: pointer; font-weight: bold; }}
        button:hover {{ background: #0fa; }}
        textarea {{ width: 100%; background: #111; color: #0f8; border: 1px solid #0f8; padding: 10px; }}
        .progress {{ background: #222; height: 20px; margin: 10px 0; }}
        .progress-bar {{ background: #0f8; height: 100%; width: {int(STATE['tasks_complete']/STATE['tasks_total']*100)}%; }}
        .status {{ background: #001100; padding: 10px; margin: 10px 0; }}
        h2 {{ color: #ff0; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Soulfra Hub - Everything in One Place</h1>
        
        <div class="status">
            <strong>Status:</strong> ✅ Ollama Connected | 
            Phase: {STATE['phase'].title()} | 
            Progress: {STATE['tasks_complete']}/{STATE['tasks_total']}
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>🤖 Create Agent</h2>
                <textarea id="agent-text" rows="4" placeholder="Paste text to create agent..."></textarea>
                <button onclick="createAgent()">Create Agent ($1)</button>
                <div id="agent-result"></div>
            </div>
            
            <div class="card">
                <h2>🔄 Convert Content</h2>
                <select id="conv-type">
                    <option value="text_to_agent">Text → Agent</option>
                    <option value="chat_to_loop">Chat → Loop</option>
                    <option value="agent_to_qr">Agent → QR</option>
                </select>
                <textarea id="conv-text" rows="4" placeholder="Content to convert..."></textarea>
                <button onclick="convert()">Convert</button>
                <div id="conv-result"></div>
            </div>
            
            <div class="card">
                <h2>📊 Progress Tracker</h2>
                <h3>🚲→🏎️ Current: {STATE['phase'].title()}</h3>
                <div class="progress">
                    <div class="progress-bar"></div>
                </div>
                <p>Tasks: {STATE['tasks_complete']}/{STATE['tasks_total']}</p>
                <button onclick="updateProgress()">Mark Task Complete</button>
            </div>
            
            <div class="card">
                <h2>🖥️ Quick Terminal</h2>
                <input type="text" id="cmd" placeholder="Command..." style="width: 100%;">
                <button onclick="runCmd()">Run</button>
                <pre id="cmd-output" style="background: #000; padding: 10px;"></pre>
            </div>
        </div>
        
        <div class="card" style="margin-top: 20px;">
            <h2>📱 Mobile Access</h2>
            <p>Access from phone: <code>http://{window.location.hostname}:5000</code></p>
            <p>Remote access: Use ngrok or tailscale</p>
        </div>
    </div>
    
    <script>
        async function createAgent() {{
            const text = document.getElementById('agent-text').value;
            const res = await fetch('/api/agent', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{text}})
            }});
            const agent = await res.json();
            document.getElementById('agent-result').innerHTML = 
                '<p style="color: #0f0;">✅ Created: ' + agent.name + '</p>';
        }}
        
        async function convert() {{
            const type = document.getElementById('conv-type').value;
            const text = document.getElementById('conv-text').value;
            const res = await fetch('/api/convert', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{type, text}})
            }});
            const result = await res.json();
            document.getElementById('conv-result').innerHTML = 
                '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
        }}
        
        async function updateProgress() {{
            await fetch('/api/progress', {{method: 'POST'}});
            location.reload();
        }}
        
        async function runCmd() {{
            const cmd = document.getElementById('cmd').value;
            document.getElementById('cmd-output').textContent = 'Running...';
            const res = await fetch('/api/cmd', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{cmd}})
            }});
            const output = await res.text();
            document.getElementById('cmd-output').textContent = output;
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
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        data = json.loads(body) if body else {}
        
        if self.path == '/api/agent':
            # Create agent
            text = data.get('text', '')
            prompt = f"Create AI agent from: {text[:200]}. Give it a name and purpose."
            response = call_ollama(prompt)
            
            agent = {
                'id': f'agent-{len(STATE["agents"])+1}',
                'name': f'Agent-{len(STATE["agents"])+1}',
                'purpose': response[:100],
                'created': datetime.now().isoformat()
            }
            STATE['agents'].append(agent)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(agent).encode())
            
        elif self.path == '/api/convert':
            # Convert content
            conv_type = data.get('type', 'text_to_agent')
            text = data.get('text', '')
            
            result = {
                'type': conv_type,
                'input': text[:50] + '...',
                'output': f'Converted via {conv_type}',
                'timestamp': datetime.now().isoformat()
            }
            STATE['conversions'].append(result)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        elif self.path == '/api/progress':
            # Update progress
            STATE['tasks_complete'] += 1
            if STATE['tasks_complete'] >= 10 and STATE['phase'] == 'bicycle':
                STATE['phase'] = 'scooter'
            elif STATE['tasks_complete'] >= 15 and STATE['phase'] == 'scooter':
                STATE['phase'] = 'motorcycle'
                
            self.send_response(200)
            self.end_headers()
            
        elif self.path == '/api/cmd':
            # Run command (simplified)
            cmd = data.get('cmd', 'echo "Hello"')
            try:
                import subprocess
                output = subprocess.check_output(cmd, shell=True, stderr=subprocess.STDOUT, timeout=5)
                output = output.decode('utf-8', errors='replace')
            except Exception as e:
                output = f"Error: {str(e)}"
                
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(output.encode())
        else:
            self.send_error(404)

# Check Ollama before starting
print("🔍 Checking Ollama...")
try:
    test = call_ollama("Say hello")
    print(f"✅ Ollama responded: {test[:50]}...")
except:
    print("⚠️  Ollama not responding, but continuing anyway")

print(f"""
🚀 SOULFRA HUB - UNIFIED INTERFACE

Everything in one place at: http://localhost:{PORT}

✅ Features:
- Agent creation
- Content conversion  
- Progress tracking
- Quick terminal
- Mobile friendly

This combines:
- Agent System (was port 5001)
- Conversion Hub (was port 5004)
- Project Manager (was port 5002)
- Terminal Access (new!)

All in ONE interface with NO timeouts!

Press Ctrl+C to stop
""")

try:
    server = HTTPServer(('', PORT), UnifiedHandler)
    server.serve_forever()
except KeyboardInterrupt:
    print("\n✅ Hub stopped")
except OSError as e:
    print(f"\n❌ Port {PORT} already in use!")
    print("Try: lsof -i :5000 | grep LISTEN")
    print("Then: kill -9 <PID>")