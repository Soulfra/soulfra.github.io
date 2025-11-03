#!/usr/bin/env python3
"""
ONE CLICK DEMO - Actually see something working RIGHT NOW
"""

import os
import json
import time
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading
import webbrowser
import subprocess
from datetime import datetime

def create_working_demo():
    """Create a simple working demo you can see immediately"""
    
    print("🌟 SOULFRA ONE-CLICK DEMO")
    print("=" * 50)
    print("Creating something you can actually see...")
    print()
    
    # Create demo directory
    os.makedirs('demo_output', exist_ok=True)
    
    # 1. Create a simple whisper processor
    whisper_code = '''#!/usr/bin/env python3
"""Simple Whisper Processor - Actually Works!"""

import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

whispers = []

class WhisperHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            html = """<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Whisper Demo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f0f0f0;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
        }
        .whisper-form {
            margin: 20px 0;
        }
        input[type="text"] {
            width: 70%;
            padding: 10px;
            font-size: 16px;
            border: 2px solid #ddd;
            border-radius: 5px;
        }
        button {
            padding: 10px 20px;
            font-size: 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }
        button:hover {
            background: #0056b3;
        }
        .whispers {
            margin-top: 30px;
        }
        .whisper-item {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .timestamp {
            color: #666;
            font-size: 12px;
        }
        .demo-info {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌟 Soulfra Whisper Demo 🌟</h1>
        
        <div class="demo-info">
            <strong>This is working!</strong> Type an idea below and watch it get processed.
            <br>This demo shows the whisper-to-code concept in action.
        </div>
        
        <div class="whisper-form">
            <form action="/whisper" method="get">
                <input type="text" name="idea" placeholder="Whisper your idea..." required>
                <button type="submit">Whisper →</button>
            </form>
        </div>
        
        <div class="whispers">
            <h2>Recent Whispers</h2>
            <div id="whisper-list">Loading...</div>
        </div>
    </div>
    
    <script>
        function loadWhispers() {
            fetch('/api/whispers')
                .then(r => r.json())
                .then(data => {
                    const list = document.getElementById('whisper-list');
                    if (data.length === 0) {
                        list.innerHTML = '<p style="color: #666;">No whispers yet. Try adding one above!</p>';
                    } else {
                        list.innerHTML = data.map(w => `
                            <div class="whisper-item">
                                <strong>${w.idea}</strong>
                                <div class="timestamp">${w.timestamp}</div>
                                <div style="color: #28a745; margin-top: 5px;">
                                    ✓ Would generate: ${w.component_name}
                                </div>
                            </div>
                        `).join('');
                    }
                });
        }
        
        // Load whispers on page load and every 2 seconds
        loadWhispers();
        setInterval(loadWhispers, 2000);
    </script>
</body>
</html>"""
            
            self.wfile.write(html.encode())
            
        elif self.path.startswith('/whisper'):
            # Parse the idea
            query = urlparse(self.path).query
            params = parse_qs(query)
            idea = params.get('idea', [''])[0]
            
            if idea:
                # Process the whisper
                component_name = ''.join(word.capitalize() for word in idea.split())
                whispers.append({
                    'idea': idea,
                    'component_name': component_name,
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                })
                
                # Generate actual code
                code = f\"\"\"class {component_name}:
    \"\"\"Auto-generated from: {idea}\"\"\"
    
    def __init__(self):
        self.name = "{idea}"
        
    def process(self, data):
        return {{"processed": True, "idea": "{idea}", "data": data}}
\"\"\"
                
                # Save the generated code
                with open(f'demo_output/{component_name}.py', 'w') as f:
                    f.write(code)
            
            # Redirect back to home
            self.send_response(302)
            self.send_header('Location', '/')
            self.end_headers()
            
        elif self.path == '/api/whispers':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(whispers[-10:]).encode())
            
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        pass  # Suppress logs

if __name__ == "__main__":
    print("Starting Whisper Demo on http://localhost:8080")
    server = HTTPServer(('localhost', 8080), WhisperHandler)
    server.serve_forever()
'''
    
    with open('demo_output/whisper_demo.py', 'w') as f:
        f.write(whisper_code)
    
    # 2. Create a component viewer
    viewer_code = '''#!/usr/bin/env python3
"""Component Viewer - See all generated components"""

import os
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

class ViewerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            # Find all generated components
            components = []
            output_dir = Path('demo_output')
            for py_file in output_dir.glob('*.py'):
                if py_file.name not in ['whisper_demo.py', 'viewer.py']:
                    with open(py_file, 'r') as f:
                        content = f.read()
                    components.append({
                        'name': py_file.stem,
                        'file': py_file.name,
                        'content': content
                    })
            
            html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Generated Components</title>
    <style>
        body {{
            font-family: monospace;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #1a1a1a;
            color: #00ff00;
        }}
        h1 {{
            text-align: center;
            color: #00ffff;
            text-shadow: 0 0 10px #00ffff;
        }}
        .component {{
            background: rgba(0,255,0,0.1);
            border: 1px solid #00ff00;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }}
        .component h2 {{
            color: #ffff00;
            margin-top: 0;
        }}
        pre {{
            background: #000;
            padding: 15px;
            overflow-x: auto;
            border-radius: 5px;
        }}
        .info {{
            text-align: center;
            margin: 20px 0;
            color: #00ffff;
        }}
    </style>
</head>
<body>
    <h1>🌟 Generated Components 🌟</h1>
    
    <div class="info">
        Total Components: {len(components)}
    </div>
    
    {''.join(f"""
    <div class="component">
        <h2>{c['name']}</h2>
        <p>File: {c['file']}</p>
        <pre>{c['content']}</pre>
    </div>
    """ for c in components) if components else '<p style="text-align: center;">No components generated yet. Use the Whisper Demo to create some!</p>'}
    
    <script>
        // Auto-refresh every 3 seconds
        setTimeout(() => location.reload(), 3000);
    </script>
</body>
</html>"""
            
            self.wfile.write(html.encode())
            
    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    print("Component Viewer on http://localhost:8081")
    server = HTTPServer(('localhost', 8081), ViewerHandler)
    server.serve_forever()
'''
    
    with open('demo_output/viewer.py', 'w') as f:
        f.write(viewer_code)
    
    # 3. Create launcher script
    launcher = '''#!/bin/bash
echo "🚀 Starting Soulfra Demo Services..."
echo ""

# Kill any existing services on these ports
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null

# Start services
cd demo_output
python3 whisper_demo.py &
DEMO_PID=$!
sleep 1
python3 viewer.py &
VIEWER_PID=$!

echo "✅ Services Started!"
echo ""
echo "🌐 Open these in your browser:"
echo "   → http://localhost:8080  (Whisper Demo)"
echo "   → http://localhost:8081  (Component Viewer)"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "kill $DEMO_PID $VIEWER_PID 2>/dev/null; echo 'Services stopped'; exit" INT
wait
'''
    
    with open('START_DEMO.sh', 'w') as f:
        f.write(launcher)
    os.chmod('START_DEMO.sh', 0o755)
    
    print("✅ Demo created!")
    print()
    print("Starting services...")
    
    # Start the services
    subprocess.Popen(['python3', 'demo_output/whisper_demo.py'], 
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    subprocess.Popen(['python3', 'demo_output/viewer.py'], 
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    
    print()
    print("🎉 DEMO IS RUNNING!")
    print()
    print("Open your browser to:")
    print("  → http://localhost:8080  (Whisper Demo)")
    print("  → http://localhost:8081  (Component Viewer)")
    print()
    print("Try it:")
    print("1. Go to http://localhost:8080")
    print("2. Type any idea (e.g., 'create a magic tracker')")
    print("3. Click Whisper")
    print("4. See it appear in the list")
    print("5. Check http://localhost:8081 to see the generated code!")
    print()
    print("To run again later: ./START_DEMO.sh")
    
    # Open browser
    webbrowser.open('http://localhost:8080')
    time.sleep(1)
    webbrowser.open('http://localhost:8081')

if __name__ == "__main__":
    create_working_demo()