#!/usr/bin/env python3
"""
FIXED MONITOR DASHBOARD - No more broken pipes
"""

import socket
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime

class FixedMonitorHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress default logging
        pass
        
    def do_GET(self):
        if self.path == '/':
            try:
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.send_header('Connection', 'close')
                self.end_headers()
                
                html = self.generate_dashboard()
                self.wfile.write(html.encode())
            except:
                # Ignore broken pipe errors
                pass
                
    def generate_dashboard(self):
        services = [
            {"name": "Chat Logger", "port": 4040},
            {"name": "Simple Game", "port": 5555},
            {"name": "Working Platform", "port": 3002},
            {"name": "AI Ecosystem", "port": 9999},
            {"name": "Master Control", "port": 8000},
        ]
        
        html = """<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Monitor</title>
    <meta http-equiv="refresh" content="5">
    <style>
        body { 
            background: #0a0a0a; 
            color: #fff; 
            font-family: monospace;
            padding: 20px;
        }
        .service {
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #333;
            border-radius: 5px;
        }
        .running { border-color: #0f0; }
        .stopped { border-color: #f00; }
    </style>
</head>
<body>
    <h1>Soulfra Service Monitor</h1>
    <p>Auto-refreshes every 5 seconds</p>
    <div id="services">"""
        
        for service in services:
            status = self.check_port(service['port'])
            status_class = 'running' if status else 'stopped'
            status_text = 'RUNNING' if status else 'STOPPED'
            
            html += f"""
        <div class="service {status_class}">
            <strong>{service['name']}</strong> (Port {service['port']}): {status_text}
        </div>"""
            
        html += """
    </div>
</body>
</html>"""
        return html
        
    def check_port(self, port):
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0

def run_fixed_monitor():
    server = HTTPServer(('localhost', 7777), FixedMonitorHandler)
    print("Fixed Monitor running on http://localhost:7777")
    server.serve_forever()

if __name__ == "__main__":
    run_fixed_monitor()
