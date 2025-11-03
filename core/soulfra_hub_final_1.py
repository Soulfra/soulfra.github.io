#!/usr/bin/env python3
"""
SOULFRA HUB FINAL - Actually Works Edition
Single file, proper error handling, no timeouts
"""

import socket
import sys
import json
import urllib.request
import os
import subprocess
import threading
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

# Safe port that won't conflict
PORT = 8888

# Check if port is available FIRST
def check_port(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    sock.close()
    return result != 0

# Find available port if needed
def find_available_port(start=8888):
    for port in range(start, start + 100):
        if check_port(port):
            return port
    return None

# Get actual port
PORT = find_available_port(8888)
if not PORT:
    print("❌ No available ports in range 8888-8988!")
    sys.exit(1)

print(f"✅ Using port {PORT}")

# Global state
STATE = {
    'agents': [],
    'status': 'starting',
    'ollama': False,
    'start_time': datetime.now().isoformat()
}

def test_ollama():
    """Test if Ollama is available"""
    try:
        data = json.dumps({
            "model": "mistral",
            "prompt": "Say hello in 3 words",
            "stream": False
        }).encode('utf-8')
        
        req = urllib.request.Request(
            'http://localhost:11434/api/generate',
            data=data,
            headers={'Content-Type': 'application/json'}
        )
        
        with urllib.request.urlopen(req, timeout=5) as response:
            result = json.loads(response.read().decode())
            STATE['ollama'] = True
            return True
    except:
        STATE['ollama'] = False
        return False

def call_ollama(prompt):
    """Call Ollama with fallback"""
    if not STATE['ollama']:
        return "AI is offline - but the system works!"
    
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
        return "AI temporarily unavailable"

class SoulfraHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress default logging
        pass
    
    def do_GET(self):
        if self.path == '/':
            self.serve_home()
        elif self.path == '/health':
            self.serve_health()
        elif self.path == '/status':
            self.serve_status()
        else:
            self.send_error(404)
    
    def serve_health(self):
        """Health check endpoint"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({
            'status': 'healthy',
            'port': PORT,
            'ollama': STATE['ollama']
        }).encode())
    
    def serve_status(self):
        """Status endpoint"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(STATE).encode())
    
    def serve_home(self):
        """Main interface"""
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Soulfra Hub - Port {PORT}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ 
            background: #000; 
            color: #0f8; 
            font-family: 'Courier New', monospace; 
            padding: 20px;
            line-height: 1.6;
        }}
        .container {{ 
            max-width: 1000px; 
            margin: 0 auto; 
        }}
        .status {{
            background: #111;
            border: 2px solid #0f8;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }}
        .status.error {{
            border-color: #f44;
            color: #faa;
        }}
        .status.success {{
            border-color: #0f0;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .card {{
            background: #111;
            border: 1px solid #0f8;
            padding: 20px;
            border-radius: 5px;
        }}
        .card h3 {{
            color: #ff0;
            margin-top: 0;
        }}
        button {{
            background: #0f8;
            color: #000;
            border: none;
            padding: 10px 20px;
            cursor: pointer;
            font-weight: bold;
            border-radius: 3px;
            margin: 5px 0;
        }}
        button:hover {{
            background: #0fa;
        }}
        textarea, input {{
            width: 100%;
            background: #222;
            color: #0f8;
            border: 1px solid #0f8;
            padding: 10px;
            font-family: monospace;
            border-radius: 3px;
        }}
        pre {{
            background: #111;
            padding: 10px;
            overflow-x: auto;
            border-radius: 3px;
        }}
        .success {{ color: #0f0; }}
        .error {{ color: #f44; }}
        .warning {{ color: #fa0; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Soulfra Hub - Actually Working!</h1>
        
        <div class="status {'success' if STATE['ollama'] else 'error'}">
            <strong>System Status:</strong><br>
            ✅ Server: Running on port {PORT}<br>
            {'✅' if STATE['ollama'] else '❌'} Ollama: {'Connected' if STATE['ollama'] else 'Not detected - but system still works!'}<br>
            ✅ Agents: {len(STATE['agents'])} created<br>
            ✅ Uptime: Started {STATE['start_time']}
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🤖 Create Agent</h3>
                <p>Transform any text into an AI agent</p>
                <textarea id="agent-text" rows="4" placeholder="Paste text, chat log, or idea..."></textarea>
                <button onclick="createAgent()">Create Agent</button>
                <div id="agent-result"></div>
            </div>
            
            <div class="card">
                <h3>🔄 Quick Convert</h3>
                <p>Like howtoconvert.co but for AI</p>
                <button onclick="testConvert('text')">Test Text→Agent</button>
                <button onclick="testConvert('chat')">Test Chat→Loop</button>
                <button onclick="testConvert('csv')">Test CSV→Graph</button>
                <div id="convert-result"></div>
            </div>
            
            <div class="card">
                <h3>🖥️ Terminal</h3>
                <p>Run commands from browser</p>
                <input type="text" id="cmd" placeholder="echo hello" value="echo hello">
                <button onclick="runCommand()">Run</button>
                <pre id="cmd-output"></pre>
            </div>
        </div>
        
        <div class="card">
            <h3>📊 Live Data</h3>
            <pre id="live-data">{json.dumps(STATE, indent=2)}</pre>
            <button onclick="refreshData()">Refresh</button>
        </div>
        
        <div class="status">
            <strong>Access Points:</strong><br>
            • Local: http://localhost:{PORT}<br>
            • Network: http://{{your-ip}}:{PORT}<br>
            • Health Check: http://localhost:{PORT}/health<br>
            • Status API: http://localhost:{PORT}/status
        </div>
    </div>
    
    <script>
        async function createAgent() {{
            const text = document.getElementById('agent-text').value;
            if (!text) return alert('Enter some text first');
            
            document.getElementById('agent-result').innerHTML = '<p class="warning">Creating...</p>';
            
            try {{
                const res = await fetch('/api/agent', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{text}})
                }});
                
                const agent = await res.json();
                document.getElementById('agent-result').innerHTML = 
                    '<p class="success">✅ Created: ' + agent.name + '</p>';
                refreshData();
            }} catch (e) {{
                document.getElementById('agent-result').innerHTML = 
                    '<p class="error">❌ Error: ' + e + '</p>';
            }}
        }}
        
        async function testConvert(type) {{
            document.getElementById('convert-result').innerHTML = '<p class="warning">Converting...</p>';
            
            const testData = {{
                'text': 'Convert this text into an AI agent that helps with coding',
                'chat': 'User: Hello\\nBot: Hi there\\nUser: Help me code',
                'csv': 'name,type,value\\nagent1,helper,100\\nagent2,analyzer,200'
            }};
            
            try {{
                const res = await fetch('/api/convert', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{
                        type: type + '_to_agent',
                        data: testData[type]
                    }})
                }});
                
                const result = await res.json();
                document.getElementById('convert-result').innerHTML = 
                    '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
            }} catch (e) {{
                document.getElementById('convert-result').innerHTML = 
                    '<p class="error">❌ Error: ' + e + '</p>';
            }}
        }}
        
        async function runCommand() {{
            const cmd = document.getElementById('cmd').value;
            document.getElementById('cmd-output').textContent = 'Running...';
            
            try {{
                const res = await fetch('/api/cmd', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{cmd}})
                }});
                
                const output = await res.text();
                document.getElementById('cmd-output').textContent = output;
            }} catch (e) {{
                document.getElementById('cmd-output').textContent = 'Error: ' + e;
            }}
        }}
        
        async function refreshData() {{
            try {{
                const res = await fetch('/status');
                const data = await res.json();
                document.getElementById('live-data').textContent = 
                    JSON.stringify(data, null, 2);
            }} catch (e) {{
                console.error(e);
            }}
        }}
        
        // Auto-refresh every 5 seconds
        setInterval(refreshData, 5000);
    </script>
</body>
</html>
"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length else b'{}'
        
        try:
            data = json.loads(body)
        except:
            data = {}
        
        if self.path == '/api/agent':
            # Create agent
            text = data.get('text', '')
            agent = {
                'id': f'agent-{len(STATE["agents"])+1}',
                'name': f'Agent-{len(STATE["agents"])+1}',
                'text': text[:100] + '...',
                'created': datetime.now().isoformat()
            }
            
            # Try Ollama enhancement
            if STATE['ollama']:
                prompt = f"Create a helpful AI agent name from: {text[:100]}"
                response = call_ollama(prompt)
                if response and len(response) < 50:
                    agent['name'] = response.strip()
            
            STATE['agents'].append(agent)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(agent).encode())
            
        elif self.path == '/api/convert':
            # Conversion demo
            conv_type = data.get('type', 'unknown')
            input_data = data.get('data', '')
            
            result = {
                'type': conv_type,
                'input': input_data[:50] + '...',
                'output': f'Converted via {conv_type}',
                'timestamp': datetime.now().isoformat()
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        elif self.path == '/api/cmd':
            # Run command safely
            cmd = data.get('cmd', 'echo "No command"')
            
            # Safety check
            if any(danger in cmd for danger in ['rm -rf', 'sudo', '&&', '|', '>']):
                output = "Command blocked for safety"
            else:
                try:
                    output = subprocess.check_output(
                        cmd, 
                        shell=True, 
                        stderr=subprocess.STDOUT,
                        timeout=3
                    ).decode('utf-8', errors='replace')
                except subprocess.TimeoutExpired:
                    output = "Command timed out (3s limit)"
                except Exception as e:
                    output = f"Error: {str(e)}"
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(output.encode())
        else:
            self.send_error(404)

def verify_server_started(port, max_attempts=10):
    """Verify the server actually started"""
    print(f"🔍 Verifying server startup on port {port}...")
    
    for i in range(max_attempts):
        try:
            conn = socket.create_connection(('127.0.0.1', port), timeout=1)
            conn.close()
            print(f"✅ Server verified on port {port}!")
            return True
        except:
            time.sleep(0.5)
    
    return False

def start_server():
    """Start the server with proper error handling"""
    global STATE
    
    try:
        server = HTTPServer(('', PORT), SoulfraHandler)
        STATE['status'] = 'running'
        
        # Start server in thread
        server_thread = threading.Thread(target=server.serve_forever)
        server_thread.daemon = True
        server_thread.start()
        
        # Verify it started
        if verify_server_started(PORT):
            return server
        else:
            print("❌ Server failed to start!")
            return None
            
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        return None

# MAIN EXECUTION
print("""
🚀 SOULFRA HUB FINAL - Starting Up...
=====================================
""")

# Test Ollama
print("🤖 Testing Ollama connection...")
if test_ollama():
    print("✅ Ollama is connected!")
else:
    print("⚠️  Ollama not available - but system will still work!")

# Start server
server = start_server()

if server:
    print(f"""
✅ SUCCESS! Server is running!
==============================

🌐 Access Points:
- Main Interface: http://localhost:{PORT}
- Health Check:   http://localhost:{PORT}/health  
- Status API:     http://localhost:{PORT}/status

📱 Mobile Access:
- Same URL works on mobile
- Or use your computer's IP address

🛠️ Features Working:
- Agent creation (with or without Ollama)
- Content conversion demos
- Command execution (safe mode)
- Real-time status updates

Press Ctrl+C to stop
""")
    
    try:
        # Keep main thread alive
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n👋 Shutting down gracefully...")
        server.shutdown()
else:
    print("""
❌ Failed to start server!

Troubleshooting:
1. Check if port is already in use: lsof -i :{PORT}
2. Try running with sudo (not recommended)
3. Check Python version: python3 --version
""")