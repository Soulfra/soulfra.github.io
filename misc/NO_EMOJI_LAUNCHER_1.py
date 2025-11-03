#!/usr/bin/env python3
"""
NO EMOJI LAUNCHER - Clean, clear, no formatting issues
WITH CHAIN OF COMMAND
"""

import os
import subprocess
import json
import socket
from http.server import HTTPServer, BaseHTTPRequestHandler

class ChainOfCommand:
    """Clear hierarchy of what controls what"""
    
    HIERARCHY = {
        "Master Control": {
            "port": 8000,
            "controls": ["All Services"],
            "purpose": "Orchestrates everything",
            "priority": 1
        },
        "Simple Launcher": {
            "port": 7777,
            "controls": ["Service Discovery", "Quick Access"],
            "purpose": "Entry point for users",
            "priority": 2
        },
        "Chatlog System": {
            "port": 8888,
            "controls": ["Log Processing", "Document Export"],
            "purpose": "Process chat logs into value",
            "priority": 3
        },
        "AI Ecosystem": {
            "port": 9999,
            "controls": ["AI Agents", "Credit System"],
            "purpose": "Local AI interactions",
            "priority": 4
        },
        "Empire Builder": {
            "port": 8181,
            "controls": ["Idea Processing", "Business Models"],
            "purpose": "Turn ideas into structures",
            "priority": 5
        }
    }
    
    @classmethod
    def get_chain(cls):
        """Return services in order of command"""
        return sorted(cls.HIERARCHY.items(), key=lambda x: x[1]['priority'])

class NoEmojiLauncher:
    def __init__(self):
        self.port = 7777
        self.chain = ChainOfCommand()
        
    def check_port(self, port):
        """Check if port is open"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Control Center</title>
    <style>
        body {
            font-family: -apple-system, Arial, sans-serif;
            background: #f5f5f5;
            margin: 0;
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #222;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .chain-of-command {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
        }
        .chain-item {
            display: flex;
            align-items: center;
            padding: 15px;
            margin: 10px 0;
            background: white;
            border-radius: 5px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .chain-number {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-right: 20px;
            width: 30px;
        }
        .chain-details {
            flex: 1;
        }
        .chain-name {
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 5px;
        }
        .chain-info {
            color: #666;
            font-size: 14px;
        }
        .chain-status {
            width: 100px;
            text-align: center;
            font-weight: bold;
        }
        .status-running {
            color: #28a745;
        }
        .status-stopped {
            color: #dc3545;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .service-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s;
        }
        .service-card:hover {
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(-2px);
        }
        .service-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .service-port {
            color: #666;
            margin-bottom: 15px;
        }
        .service-button {
            display: inline-block;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        .service-button:hover {
            background: #0056b3;
        }
        .service-button.disabled {
            background: #6c757d;
            cursor: not-allowed;
        }
        .master-button {
            display: block;
            width: 100%;
            padding: 20px;
            font-size: 24px;
            font-weight: bold;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background 0.3s;
        }
        .master-button:hover {
            background: #218838;
        }
        .info-box {
            background: #e9ecef;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
        }
        .info-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .command-flow {
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
        }
        .arrow {
            display: inline-block;
            margin: 0 10px;
            color: #007bff;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Soulfra Control Center</h1>
        <p class="subtitle">Clean. Clear. No confusion. Everything in its place.</p>
        
        <div class="chain-of-command">
            <h2>Chain of Command</h2>
            <p>This is how everything connects and who controls what:</p>
            
            <div class="command-flow">
                User <span class="arrow">→</span> 
                Launcher <span class="arrow">→</span> 
                Master Control <span class="arrow">→</span> 
                All Services
            </div>
            
            {chain_items}
        </div>
        
        <h2>Quick Access</h2>
        <div class="services-grid">
            {service_cards}
        </div>
        
        <button class="master-button" onclick="launchAll()">
            Launch Everything
        </button>
        
        <div class="info-box">
            <div class="info-title">How This Works:</div>
            <ol>
                <li><strong>Master Control (Port 8000)</strong> orchestrates all services</li>
                <li><strong>Simple Launcher (Port 7777)</strong> provides quick access</li>
                <li><strong>Each service</strong> has a specific purpose and port</li>
                <li><strong>No files are moved or deleted</strong> - just connections</li>
                <li><strong>Everything talks to everything</strong> through the Master</li>
            </ol>
        </div>
        
        <div class="info-box">
            <div class="info-title">Common Tasks:</div>
            <ul>
                <li>Process chat logs: Go to Chatlog System (8888)</li>
                <li>Talk to AI: Go to AI Ecosystem (9999)</li>
                <li>Build a business: Go to Empire Builder (8181)</li>
                <li>See everything connected: Go to Master Control (8000)</li>
            </ul>
        </div>
    </div>
    
    <script>
        function launchAll() {
            if (confirm('This will launch all services. Continue?')) {
                fetch('/launch-all', {method: 'POST'})
                    .then(response => response.json())
                    .then(data => {
                        alert(data.message);
                        setTimeout(() => location.reload(), 2000);
                    });
            }
        }
    </script>
</body>
</html>
'''

class CleanHandler(BaseHTTPRequestHandler):
    def __init__(self, *args, launcher=None, **kwargs):
        self.launcher = launcher
        super().__init__(*args, **kwargs)
        
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            # Build chain items
            chain_items = ""
            for i, (name, info) in enumerate(ChainOfCommand.get_chain(), 1):
                status = "running" if self.launcher.check_port(info['port']) else "stopped"
                status_class = "status-running" if status == "running" else "status-stopped"
                
                chain_items += f'''
                <div class="chain-item">
                    <div class="chain-number">{i}</div>
                    <div class="chain-details">
                        <div class="chain-name">{name}</div>
                        <div class="chain-info">
                            Port: {info['port']} | Controls: {', '.join(info['controls'])}
                            <br>Purpose: {info['purpose']}
                        </div>
                    </div>
                    <div class="chain-status {status_class}">{status.upper()}</div>
                </div>
                '''
            
            # Build service cards
            service_cards = ""
            for name, info in ChainOfCommand.HIERARCHY.items():
                is_running = self.launcher.check_port(info['port'])
                
                service_cards += f'''
                <div class="service-card">
                    <div class="service-name">{name}</div>
                    <div class="service-port">Port: {info['port']}</div>
                    <a href="http://localhost:{info['port']}" 
                       class="service-button {'disabled' if not is_running else ''}"
                       {'onclick="return false;"' if not is_running else ''}>
                        {'Start Service' if not is_running else 'Open'}
                    </a>
                </div>
                '''
            
            html = HTML_TEMPLATE.format(
                chain_items=chain_items,
                service_cards=service_cards
            )
            
            self.wfile.write(html.encode())
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/launch-all':
            # This would launch all services
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            response = {
                "success": True,
                "message": "All services launching... Refresh in a few seconds."
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_error(404)

def run_launcher():
    launcher = NoEmojiLauncher()
    
    def handler(*args, **kwargs):
        CleanHandler(*args, launcher=launcher, **kwargs)
    
    server = HTTPServer(('localhost', 7777), handler)
    
    print("=" * 60)
    print("NO EMOJI LAUNCHER - CLEAN AND CLEAR")
    print("=" * 60)
    print()
    print("CHAIN OF COMMAND:")
    for i, (name, info) in enumerate(ChainOfCommand.get_chain(), 1):
        print(f"  {i}. {name} (Port {info['port']})")
        print(f"     Controls: {', '.join(info['controls'])}")
        print(f"     Purpose: {info['purpose']}")
        print()
    print("=" * 60)
    print(f"Access at: http://localhost:7777")
    print("=" * 60)
    
    server.serve_forever()

if __name__ == "__main__":
    run_launcher()