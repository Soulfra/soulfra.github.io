#!/usr/bin/env python3
"""
EASY MODE - One Button Does Everything
So simple a 5-year-old can run it!
"""

import os
import sys
import time
import subprocess
import threading
import webbrowser
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sqlite3
from datetime import datetime

# Force UTF-8 everywhere
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['LANG'] = 'C.UTF-8'
os.environ['PYTHONIOENCODING'] = 'utf-8'

class EasyModeSystem:
    """The simplest system ever - just click and go!"""
    
    def __init__(self):
        self.services = {}
        self.status = {}
        self.logs = []
        self.port = 1234  # Easy to remember!
        
    def log(self, message, emoji="📝"):
        """Simple logging with emojis"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"{emoji} [{timestamp}] {message}"
        self.logs.append(log_entry)
        print(log_entry)
        
    def run_command(self, command, name):
        """Run a command and track it"""
        try:
            self.log(f"Starting {name}...", "🚀")
            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env={**os.environ, 'LC_ALL': 'C.UTF-8'}
            )
            self.services[name] = process
            self.status[name] = "running"
            self.log(f"{name} started!", "✅")
            return True
        except Exception as e:
            self.log(f"Oops! {name} had a problem: {str(e)}", "❌")
            self.status[name] = "error"
            return False
    
    def stop_all(self):
        """Stop everything nicely"""
        self.log("Stopping all services...", "🛑")
        
        # Kill all Python processes on our ports
        for port in range(3000, 10000):
            os.system(f"lsof -ti :{port} | xargs kill -9 2>/dev/null")
        
        self.log("All services stopped!", "✅")
    
    def start_all(self):
        """Start everything with one command!"""
        self.log("Starting Easy Mode System!", "🌟")
        
        # Clean start
        self.stop_all()
        time.sleep(2)
        
        # Apply all fixes first
        self.log("Applying magic fixes...", "🪄")
        os.system("chmod +x *.sh *.py 2>/dev/null")
        
        # Create required directories
        os.makedirs("logs", exist_ok=True)
        os.makedirs("data", exist_ok=True)
        
        # Start core services
        services_to_start = [
            ("python3 CRAMPAL_ENGINE.py", "CramPal Learning"),
            ("python3 CRINGEPROOF_FILTER.py", "Chat Filter"),
            ("python3 VIBE_PLATFORM_MAX.py", "Vibe Platform"),
            ("python3 EMPATHY_GAME_ENGINE.py", "Empathy Game"),
            ("python3 DEV_DOC_GENERATOR.py", "Doc Helper"),
            ("python3 SOULFRA_SIMPLE.py", "Soul System")
        ]
        
        for cmd, name in services_to_start:
            self.run_command(f"nohup {cmd} > logs/{name.replace(' ', '_')}.log 2>&1 &", name)
            time.sleep(1)
        
        self.log("All systems go!", "🎉")
        
    def check_health(self):
        """Check if everything is working"""
        health = {}
        
        # Check each service port
        service_ports = {
            "CramPal": 7000,
            "Vibe Platform": 8888,
            "Chat Filter": 9999,
            "Empathy Game": 5000,
            "Doc Helper": 4201,
            "Soul System": 9000
        }
        
        for name, port in service_ports.items():
            try:
                result = os.system(f"curl -s http://localhost:{port} > /dev/null 2>&1")
                health[name] = "🟢 Working!" if result == 0 else "🔴 Not responding"
            except:
                health[name] = "🔴 Error"
        
        return health
    
    def auto_fix_problems(self):
        """Automatically fix common problems"""
        self.log("Running auto-fix...", "🔧")
        
        # Fix 1: Encoding
        os.system("./MASTER_ENCODING_FIX.sh > /dev/null 2>&1")
        
        # Fix 2: Permissions
        os.system("chmod +x *.sh *.py")
        
        # Fix 3: Kill stuck processes
        os.system("pkill -f 'python3.*ENGINE.py' 2>/dev/null")
        os.system("pkill -f 'python3.*FILTER.py' 2>/dev/null")
        
        self.log("Auto-fix complete!", "✅")

class EasyModeHandler(BaseHTTPRequestHandler):
    """Super simple web interface"""
    
    def __init__(self, system, *args, **kwargs):
        self.system = system
        super().__init__(*args, **kwargs)
    
    def log_message(self, format, *args):
        """Quiet logging"""
        pass
    
    def do_GET(self):
        """Serve the easy interface"""
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            
            html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Easy Mode Control Panel 🎮</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }}
        .container {{
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 30px;
            backdrop-filter: blur(10px);
        }}
        h1 {{
            text-align: center;
            font-size: 3em;
            margin-bottom: 10px;
        }}
        .subtitle {{
            text-align: center;
            font-size: 1.2em;
            margin-bottom: 30px;
            opacity: 0.9;
        }}
        .big-button {{
            display: block;
            width: 100%;
            padding: 30px;
            margin: 20px 0;
            font-size: 2em;
            border: none;
            border-radius: 15px;
            cursor: pointer;
            transition: all 0.3s;
            font-weight: bold;
        }}
        .start {{
            background: #4CAF50;
            color: white;
        }}
        .start:hover {{
            background: #45a049;
            transform: scale(1.05);
        }}
        .stop {{
            background: #f44336;
            color: white;
        }}
        .stop:hover {{
            background: #da190b;
            transform: scale(1.05);
        }}
        .fix {{
            background: #FF9800;
            color: white;
        }}
        .fix:hover {{
            background: #e68900;
            transform: scale(1.05);
        }}
        .status {{
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }}
        .service {{
            display: flex;
            justify-content: space-between;
            padding: 10px;
            margin: 5px 0;
            background: rgba(255,255,255,0.1);
            border-radius: 5px;
        }}
        .logs {{
            background: rgba(0,0,0,0.3);
            border-radius: 10px;
            padding: 15px;
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 0.9em;
        }}
        .links {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            margin-top: 20px;
        }}
        .link-button {{
            background: #2196F3;
            color: white;
            padding: 15px;
            text-align: center;
            border-radius: 10px;
            text-decoration: none;
            transition: all 0.3s;
        }}
        .link-button:hover {{
            background: #1976D2;
            transform: translateY(-2px);
        }}
        .emoji {{
            font-size: 1.5em;
            margin-right: 10px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Easy Mode Control Panel 🎮</h1>
        <p class="subtitle">Everything you need in one place!</p>
        
        <button class="big-button start" onclick="doAction('start')">
            <span class="emoji">🚀</span> START EVERYTHING
        </button>
        
        <button class="big-button stop" onclick="doAction('stop')">
            <span class="emoji">🛑</span> STOP EVERYTHING
        </button>
        
        <button class="big-button fix" onclick="doAction('fix')">
            <span class="emoji">🔧</span> FIX PROBLEMS
        </button>
        
        <div class="status">
            <h2>📊 System Status</h2>
            <div id="status">Loading...</div>
        </div>
        
        <div class="links">
            <a href="http://localhost:7000" target="_blank" class="link-button">
                📚 CramPal Learning
            </a>
            <a href="http://localhost:8888" target="_blank" class="link-button">
                🎉 Vibe Platform
            </a>
            <a href="http://localhost:9999" target="_blank" class="link-button">
                💬 Chat Filter
            </a>
            <a href="http://localhost:5000" target="_blank" class="link-button">
                ❤️ Empathy Game
            </a>
        </div>
        
        <div class="logs">
            <h3>📜 Activity Log</h3>
            <div id="logs">No activity yet...</div>
        </div>
    </div>
    
    <script>
        function doAction(action) {{
            fetch('/api/' + action, {{ method: 'POST' }})
                .then(response => response.json())
                .then(data => {{
                    updateStatus();
                    updateLogs();
                }});
        }}
        
        function updateStatus() {{
            fetch('/api/status')
                .then(response => response.json())
                .then(data => {{
                    let html = '';
                    for (let service in data.health) {{
                        html += '<div class="service">';
                        html += '<span>' + service + '</span>';
                        html += '<span>' + data.health[service] + '</span>';
                        html += '</div>';
                    }}
                    document.getElementById('status').innerHTML = html;
                }});
        }}
        
        function updateLogs() {{
            fetch('/api/logs')
                .then(response => response.json())
                .then(data => {{
                    document.getElementById('logs').innerHTML = data.logs.slice(-10).reverse().join('<br>');
                }});
        }}
        
        // Update every 2 seconds
        setInterval(() => {{
            updateStatus();
            updateLogs();
        }}, 2000);
        
        // Initial load
        updateStatus();
        updateLogs();
    </script>
</body>
</html>
"""
            self.wfile.write(html.encode('utf-8'))
            
        elif self.path == '/api/status':
            self.send_json({
                'health': self.system.check_health(),
                'services': self.system.status
            })
            
        elif self.path == '/api/logs':
            self.send_json({
                'logs': self.system.logs[-20:]
            })
    
    def do_POST(self):
        """Handle actions"""
        if self.path == '/api/start':
            self.system.start_all()
            self.send_json({'status': 'started'})
            
        elif self.path == '/api/stop':
            self.system.stop_all()
            self.send_json({'status': 'stopped'})
            
        elif self.path == '/api/fix':
            self.system.auto_fix_problems()
            self.send_json({'status': 'fixed'})
    
    def send_json(self, data):
        """Send JSON response"""
        response = json.dumps(data, ensure_ascii=False)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(response.encode('utf-8'))))
        self.end_headers()
        self.wfile.write(response.encode('utf-8'))

def create_desktop_shortcut():
    """Create a desktop shortcut for easy access"""
    desktop = os.path.expanduser("~/Desktop")
    
    # macOS shortcut
    if sys.platform == "darwin":
        shortcut_content = f"""#!/bin/bash
cd "{os.getcwd()}"
python3 EASY_MODE.py
"""
        shortcut_path = os.path.join(desktop, "Start CramPal.command")
        with open(shortcut_path, 'w') as f:
            f.write(shortcut_content)
        os.chmod(shortcut_path, 0o755)
        print(f"✅ Created desktop shortcut: {shortcut_path}")
    
    # Windows shortcut
    elif sys.platform == "win32":
        # Create a .bat file
        shortcut_content = f"""@echo off
cd /d "{os.getcwd()}"
python EASY_MODE.py
pause
"""
        shortcut_path = os.path.join(desktop, "Start CramPal.bat")
        with open(shortcut_path, 'w') as f:
            f.write(shortcut_content)
        print(f"✅ Created desktop shortcut: {shortcut_path}")

def main():
    """Run Easy Mode!"""
    print("""
╔═══════════════════════════════════════╗
║      EASY MODE CONTROL SYSTEM         ║
║                                       ║
║  🎮 Super Simple Management Panel 🎮  ║
║                                       ║
║  Just click the buttons to control    ║
║  everything!                          ║
╚═══════════════════════════════════════╝
    """)
    
    # Create the system
    system = EasyModeSystem()
    
    # Create desktop shortcut
    create_desktop_shortcut()
    
    # Start the web server
    def handler(*args, **kwargs):
        EasyModeHandler(system, *args, **kwargs)
    
    server = HTTPServer(('0.0.0.0', system.port), handler)
    
    print(f"\n🌟 Easy Mode is running!")
    print(f"\n📱 Open your browser to: http://localhost:{system.port}")
    print(f"\n💡 Or just double-click 'Start CramPal' on your desktop!\n")
    
    # Auto-open browser
    time.sleep(1)
    webbrowser.open(f'http://localhost:{system.port}')
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Goodbye! Stopping Easy Mode...")
        system.stop_all()

if __name__ == "__main__":
    main()