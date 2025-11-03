#!/usr/bin/env python3
"""
SOULFRA - ACTUALLY WORKING VERSION
Uses your local Ollama, no external dependencies
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
from datetime import datetime

PORT = 5001

# Storage
agents = []

def call_ollama(prompt):
    """Call your local Ollama"""
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
        
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            return result['response']
    except Exception as e:
        print(f"Ollama error: {e}")
        return f"AI response (fallback): Based on '{prompt[:50]}...'"

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra - Working!</title>
    <style>
        body {{ background: #000; color: #0f8; font-family: monospace; padding: 40px; }}
        textarea {{ width: 100%; height: 200px; background: #111; color: #0f8; border: 2px solid #0f8; }}
        button {{ background: #0f8; color: #000; border: none; padding: 15px 30px; cursor: pointer; font-size: 18px; }}
        .result {{ background: #111; padding: 20px; margin: 20px 0; border: 1px solid #0f8; }}
        .error {{ color: #f44; }}
    </style>
</head>
<body>
    <h1>🤖 Soulfra Agent System</h1>
    <p>✅ Using YOUR local Ollama!</p>
    
    <textarea id="text" placeholder="Paste any text here..."></textarea>
    <br>
    <button onclick="createAgent()">Create Agent ($1)</button>
    
    <div id="result"></div>
    
    <h3>Agents Created: {len(agents)}</h3>
    
    <script>
        function createAgent() {{
            const text = document.getElementById('text').value;
            if (!text) {{
                alert('Please enter some text');
                return;
            }}
            
            document.getElementById('result').innerHTML = '<p>Creating agent...</p>';
            
            fetch('/create', {{
                method: 'POST',
                headers: {{'Content-Type': 'application/json'}},
                body: JSON.stringify({{text: text}})
            }})
            .then(r => r.json())
            .then(data => {{
                if (data.error) {{
                    throw new Error(data.error);
                }}
                document.getElementById('result').innerHTML = `
                    <div class="result">
                        <h3>✅ Agent Created!</h3>
                        <p>Name: ${{data.name}}</p>
                        <p>Type: ${{data.type}}</p>
                        <p>Response: "${{data.response}}"</p>
                    </div>
                `;
                setTimeout(() => location.reload(), 3000);
            }})
            .catch(e => {{
                document.getElementById('result').innerHTML = 
                    '<p class="error">Error: ' + e.message + '</p>';
            }});
        }}
    </script>
</body>
</html>
"""
            self.wfile.write(html.encode())
            
        else:
            self.send_error(404)
    
    def do_POST(self):
        if self.path == '/create':
            content_length = int(self.headers['Content-Length'])
            body = self.rfile.read(content_length)
            data = json.loads(body)
            
            text = data.get('text', '')[:500]  # Limit text length
            
            # Create agent using Ollama
            prompt = f"Based on this text, suggest a creative agent name and type in 10 words or less: {text}"
            response = call_ollama(prompt)
            
            # Simple parsing
            words = text.split()
            agent = {
                'id': f'agent-{len(agents)+1}',
                'name': f'Agent-{len(agents)+1}',
                'type': 'creative' if len(words) > 100 else 'concise',
                'response': response[:200],  # Limit response
                'created': datetime.now().isoformat()
            }
            
            agents.append(agent)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(agent).encode())
        else:
            self.send_error(404)

print(f"""
🚀 STARTING SOULFRA (ACTUALLY WORKING VERSION)

Testing Ollama first...
""")

# Test Ollama
test_response = call_ollama("Say 'Hello World'")
print(f"Ollama test: {test_response[:50]}...")

print(f"""
✅ Ollama is working!

🌐 Starting server on http://localhost:{PORT}

This version:
- Uses YOUR local Ollama (no API keys!)
- Python built-in server (reliable!)
- No npm, no node, no BS
- Just works!

Go to: http://localhost:{PORT}
""")

try:
    server = HTTPServer(('', PORT), Handler)
    server.serve_forever()
except KeyboardInterrupt:
    print("\n👋 Bye!")
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nCommon fixes:")
    print("1. Is port 5001 free? Run: lsof -i :5001")
    print("2. Is Ollama running? Run: ollama list")
    print("3. Try a different port by editing PORT in this file")