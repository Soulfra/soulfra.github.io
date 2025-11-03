#!/usr/bin/env python3
"""
SOULFRA CONVERSION HUB
Transform anything into anything - like howtoconvert.co but for AI/consciousness

Text → Agent
Chat logs → Blessed loops  
CSV → Knowledge graph
Audio → Whispers
QR → Drop deployment
"""

import os
import json
import subprocess
import hashlib
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime
import urllib.request

PORT = 5004

# Available conversions
CONVERSIONS = {
    "text_to_agent": {
        "name": "Text → Agent",
        "input": "text",
        "output": "agent",
        "processor": "ollama"
    },
    "chat_to_loop": {
        "name": "Chat Log → Loop",
        "input": "chat",
        "output": "loop",
        "processor": "chat_processor"
    },
    "agent_to_qr": {
        "name": "Agent → QR Drop",
        "input": "agent",
        "output": "qr",
        "processor": "qr_generator"
    },
    "csv_to_graph": {
        "name": "CSV → Knowledge Graph",
        "input": "csv",
        "output": "graph",
        "processor": "graph_builder"
    },
    "loop_to_blessing": {
        "name": "Loop → Blessing",
        "input": "loop",
        "output": "blessing",
        "processor": "blessing_daemon"
    }
}

# Check what tools we actually have
AVAILABLE_TOOLS = {
    'ollama': subprocess.run(['which', 'ollama'], capture_output=True).returncode == 0,
    'ffmpeg': subprocess.run(['which', 'ffmpeg'], capture_output=True).returncode == 0,
    'pandoc': subprocess.run(['which', 'pandoc'], capture_output=True).returncode == 0,
    'docker': subprocess.run(['which', 'docker'], capture_output=True).returncode == 0,
}

def call_ollama(prompt):
    """Our reliable bicycle engine"""
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
        return None

def convert_text_to_agent(text):
    """Convert any text into an AI agent"""
    prompt = f"""Analyze this text and create an AI agent:
{text[:500]}...

Return a JSON with: name, personality, purpose, skills
Example: {{"name": "Explorer-7", "personality": "curious", "purpose": "discover patterns", "skills": ["analysis", "synthesis"]}}"""
    
    response = call_ollama(prompt)
    if not response:
        # Fallback
        return {
            "name": f"Agent-{hashlib.md5(text.encode()).hexdigest()[:8]}",
            "personality": "helpful",
            "purpose": "assist with tasks",
            "skills": ["general"],
            "created": datetime.now().isoformat()
        }
    
    try:
        # Parse JSON from response
        start = response.find('{')
        end = response.rfind('}') + 1
        if start >= 0 and end > start:
            agent = json.loads(response[start:end])
            agent['created'] = datetime.now().isoformat()
            agent['source'] = 'text_conversion'
            return agent
    except:
        pass
    
    return {
        "name": "Agent-X",
        "personality": "adaptive",
        "purpose": response[:100],
        "created": datetime.now().isoformat()
    }

def convert_agent_to_qr(agent):
    """Generate QR drop for agent deployment"""
    # Simple QR generation (would use real QR library in production)
    qr_id = f"qr-{agent['name'].lower()}-{int(datetime.now().timestamp())}"
    
    drop_data = {
        "qr_id": qr_id,
        "agent": agent,
        "drop_url": f"/drop/{qr_id}/",
        "created": datetime.now().isoformat(),
        "blessed": False
    }
    
    # Create drop directory
    drop_dir = f"drop/{qr_id}"
    os.makedirs(drop_dir, exist_ok=True)
    
    # Save drop data
    with open(f"{drop_dir}/manifest.json", 'w') as f:
        json.dump(drop_data, f, indent=2)
    
    return drop_data

def convert_chat_to_loop(chat_text):
    """Convert chat log into consciousness loop"""
    lines = chat_text.strip().split('\n')
    
    loop = {
        "id": f"loop-{int(datetime.now().timestamp())}",
        "messages": [],
        "patterns": [],
        "created": datetime.now().isoformat()
    }
    
    # Extract messages
    for line in lines:
        if ':' in line:
            sender, message = line.split(':', 1)
            loop['messages'].append({
                "sender": sender.strip(),
                "message": message.strip(),
                "timestamp": datetime.now().isoformat()
            })
    
    # Use Ollama to find patterns
    if loop['messages']:
        prompt = f"Analyze this conversation and identify key patterns or themes:\n{chat_text[:500]}"
        patterns = call_ollama(prompt)
        if patterns:
            loop['patterns'] = patterns.split('\n')[:3]
    
    return loop

class ConversionHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.serve_home()
        elif self.path == '/status':
            self.serve_status()
        else:
            self.send_error(404)
    
    def serve_home(self):
        html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Conversion Hub</title>
    <style>
        body {{ 
            background: #000; 
            color: #0f8; 
            font-family: monospace; 
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }}
        .grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }}
        .converter {{
            background: #111;
            border: 2px solid #0f8;
            padding: 20px;
            cursor: pointer;
            transition: all 0.3s;
        }}
        .converter:hover {{
            background: #001100;
            border-color: #0fa;
            transform: scale(1.05);
        }}
        .converter h3 {{
            margin: 0 0 10px 0;
            color: #ff0;
        }}
        textarea {{
            width: 100%;
            height: 200px;
            background: #111;
            color: #0f8;
            border: 2px solid #0f8;
            padding: 10px;
            font-family: monospace;
        }}
        button {{
            background: #0f8;
            color: #000;
            border: none;
            padding: 15px 30px;
            cursor: pointer;
            font-weight: bold;
            font-size: 16px;
        }}
        button:hover {{ background: #0fa; }}
        .result {{
            background: #001100;
            border: 2px solid #0f8;
            padding: 20px;
            margin: 20px 0;
            white-space: pre-wrap;
        }}
        .tools {{
            background: #110000;
            padding: 10px;
            margin: 20px 0;
        }}
        .available {{ color: #0f8; }}
        .missing {{ color: #f44; }}
    </style>
</head>
<body>
    <h1>🔄 Soulfra Conversion Hub</h1>
    <p>Transform anything into anything - AI-powered conversions</p>
    
    <div class="tools">
        <h3>Available Tools:</h3>
        {"".join([f'<span class="{("available" if avail else "missing")}">{"✅" if avail else "❌"} {tool}</span><br>' for tool, avail in AVAILABLE_TOOLS.items()])}
    </div>
    
    <div class="grid">
        {self.render_converters()}
    </div>
    
    <h2>Quick Convert:</h2>
    <textarea id="input" placeholder="Paste text, chat log, CSV, or any content here..."></textarea>
    <br>
    <button onclick="quickConvert()">🚀 Auto-Detect & Convert</button>
    
    <div id="result"></div>
    
    <script>
        async function convert(type) {{
            const input = document.getElementById('input').value;
            if (!input) return alert('Enter some content first');
            
            document.getElementById('result').innerHTML = '<p>Converting...</p>';
            
            const res = await fetch('/convert', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{type, input}})
            }});
            
            const data = await res.json();
            
            document.getElementById('result').innerHTML = `
                <div class="result">
                    <h3>✅ Conversion Complete</h3>
                    <pre>${{JSON.stringify(data, null, 2)}}</pre>
                    ${{'qr' in data ? '<img src="' + data.qr_url + '" />' : ''}}
                </div>
            `;
        }}
        
        async function quickConvert() {{
            const input = document.getElementById('input').value;
            
            // Auto-detect type
            let type = 'text_to_agent';
            if (input.includes(':') && input.includes('\\n')) {{
                type = 'chat_to_loop';
            }} else if (input.includes(',') && input.includes('\\n')) {{
                type = 'csv_to_graph';
            }}
            
            convert(type);
        }}
    </script>
</body>
</html>
"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def render_converters(self):
        html = ""
        for key, conv in CONVERSIONS.items():
            html += f"""
            <div class="converter" onclick="convert('{key}')">
                <h3>{conv['name']}</h3>
                <p>Input: {conv['input']}</p>
                <p>Output: {conv['output']}</p>
                <p>Processor: {conv['processor']}</p>
            </div>
            """
        return html
    
    def serve_status(self):
        status = {
            "tools": AVAILABLE_TOOLS,
            "conversions": list(CONVERSIONS.keys()),
            "drops": len(os.listdir('drop')) if os.path.exists('drop') else 0
        }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(status).encode())
    
    def do_POST(self):
        if self.path == '/convert':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            conv_type = data.get('type', 'text_to_agent')
            input_data = data.get('input', '')
            
            result = {}
            
            # Route to appropriate converter
            if conv_type == 'text_to_agent':
                result = convert_text_to_agent(input_data)
            elif conv_type == 'chat_to_loop':
                result = convert_chat_to_loop(input_data)
            elif conv_type == 'agent_to_qr':
                # Need an agent first
                agent = convert_text_to_agent(input_data)
                result = convert_agent_to_qr(agent)
            else:
                result = {"error": "Unknown conversion type"}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        else:
            self.send_error(404)

# Ensure drop directory exists
os.makedirs('drop', exist_ok=True)

print(f"""
🔄 SOULFRA CONVERSION HUB

Like howtoconvert.co but for AI/consciousness!

✅ Working Conversions:
- Text → AI Agent (using Ollama)
- Chat Log → Consciousness Loop
- Agent → QR Drop Deployment
- CSV → Knowledge Graph (planned)
- Loop → Blessing (planned)

🛠️ Available Tools:
{chr(10).join([f"- {tool}: {'✅' if avail else '❌ (install for more features)'}" for tool, avail in AVAILABLE_TOOLS.items()])}

🌐 Access: http://localhost:{PORT}

This is your transformation engine:
- Drop any content
- Auto-detects type
- Converts to useful formats
- Integrates with existing systems

Future: Add Docker for all converters!
""")

try:
    server = HTTPServer(('', PORT), ConversionHandler)
    server.serve_forever()
except KeyboardInterrupt:
    print("\n✅ Conversion hub stopped")
except Exception as e:
    print(f"Error: {e}")
    print("Try: lsof -i :5004")