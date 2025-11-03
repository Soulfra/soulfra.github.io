#!/usr/bin/env python3
"""
WORKING LAUNCHER - Actually functional service dashboard
No emojis, no format strings in CSS, just working code
"""

import http.server
import socketserver
import json
import socket
import subprocess
import os
from datetime import datetime

PORT = 7777

# Define services to check
SERVICES = [
    {"name": "Soulfra Simple", "port": 9000, "url": "http://localhost:9000"},
    {"name": "Full Pipeline", "port": 4000, "url": "http://localhost:4000"},
    {"name": "Code Assistant", "port": 8080, "url": "http://localhost:8080"},
    {"name": "Chat Logger", "port": 8888, "url": "http://localhost:8888"},
    {"name": "Master Orchestrator", "port": 8000, "url": "http://localhost:8000"},
    {"name": "AI Ecosystem", "port": 9999, "url": "http://localhost:9999"},
    {"name": "Cal Riven CLI", "port": 4040, "url": "http://localhost:4040"},
    {"name": "Platform Logger", "port": 5555, "url": "http://localhost:5555"},
    {"name": "Simple Game", "port": 3000, "url": "http://localhost:3000"},
    {"name": "Working Platform", "port": 6666, "url": "http://localhost:6666"},
]

def check_port(port):
    """Check if a port is open"""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('localhost', port))
    sock.close()
    return result == 0

def get_process_info(port):
    """Get process info for a port"""
    try:
        result = subprocess.run(['lsof', '-i', f':{port}', '-P', '-n'], 
                              capture_output=True, text=True)
        lines = result.stdout.strip().split('\n')
        if len(lines) > 1:
            # Parse lsof output
            for line in lines[1:]:
                if 'LISTEN' in line:
                    parts = line.split()
                    return {"pid": parts[1], "command": parts[0]}
    except:
        pass
    return None

class RequestHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            # Build service status
            service_rows = []
            for service in SERVICES:
                is_running = check_port(service['port'])
                process_info = get_process_info(service['port']) if is_running else None
                
                status_class = "running" if is_running else "stopped"
                status_text = "RUNNING" if is_running else "STOPPED"
                
                row = f'''
                <tr class="{status_class}">
                    <td>{service['name']}</td>
                    <td>{service['port']}</td>
                    <td><span class="status-badge {status_class}">{status_text}</span></td>
                    <td>
                        {f'PID: {process_info["pid"]} ({process_info["command"]})' if process_info else '-'}
                    </td>
                    <td>
                        {'<a href="' + service['url'] + '" target="_blank" class="action-link">Open</a>' if is_running else '-'}
                    </td>
                </tr>
                '''
                service_rows.append(row)
            
            # Build HTML without format strings
            html = '''<!DOCTYPE html>
<html>
<head>
    <title>Working Service Dashboard</title>
    <meta charset="UTF-8">
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: #fff;
        }
        
        .subtitle {
            color: #888;
            margin-bottom: 30px;
        }
        
        .info-bar {
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .info-item {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .info-label {
            color: #888;
        }
        
        table {
            width: 100%;
            background: #1a1a1a;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #333;
        }
        
        th {
            background: #222;
            padding: 15px;
            text-align: left;
            font-weight: 600;
            color: #fff;
            border-bottom: 2px solid #333;
        }
        
        td {
            padding: 15px;
            border-bottom: 1px solid #2a2a2a;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        tr.running {
            background: rgba(0, 255, 100, 0.05);
        }
        
        tr.stopped {
            background: rgba(255, 50, 50, 0.05);
        }
        
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .status-badge.running {
            background: #00ff64;
            color: #000;
        }
        
        .status-badge.stopped {
            background: #ff3232;
            color: #fff;
        }
        
        .action-link {
            color: #00aaff;
            text-decoration: none;
            font-weight: 500;
            padding: 4px 12px;
            border: 1px solid #00aaff;
            border-radius: 4px;
            display: inline-block;
            transition: all 0.2s;
        }
        
        .action-link:hover {
            background: #00aaff;
            color: #000;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #333;
            text-align: center;
            color: #666;
        }
        
        .refresh-btn {
            background: #00aaff;
            color: #000;
            border: none;
            padding: 8px 20px;
            border-radius: 4px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .refresh-btn:hover {
            background: #0088cc;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Working Service Dashboard</h1>
        <p class="subtitle">Real-time status of running services</p>
        
        <div class="info-bar">
            <div class="info-item">
                <span class="info-label">Dashboard Port:</span>
                <strong>7777</strong>
            </div>
            <div class="info-item">
                <span class="info-label">Last Update:</span>
                <strong>''' + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '''</strong>
            </div>
            <button class="refresh-btn" onclick="location.reload()">Refresh Status</button>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Service Name</th>
                    <th>Port</th>
                    <th>Status</th>
                    <th>Process Info</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ''' + ''.join(service_rows) + '''
            </tbody>
        </table>
        
        <div class="footer">
            <p>Working Launcher - No emojis, no BS, just working code</p>
        </div>
    </div>
</body>
</html>'''
            
            self.wfile.write(html.encode('utf-8'))
            
        elif self.path == '/api/status':
            # JSON API endpoint
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            status = []
            for service in SERVICES:
                is_running = check_port(service['port'])
                process_info = get_process_info(service['port']) if is_running else None
                
                status.append({
                    "name": service['name'],
                    "port": service['port'],
                    "url": service['url'],
                    "running": is_running,
                    "process": process_info
                })
            
            self.wfile.write(json.dumps({
                "timestamp": datetime.now().isoformat(),
                "services": status
            }, indent=2).encode('utf-8'))
            
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        # Suppress request logging
        pass

def main():
    print(f"Starting Working Launcher on port {PORT}")
    print(f"Open http://localhost:{PORT} in your browser")
    print("Press Ctrl+C to stop\n")
    
    with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")

if __name__ == "__main__":
    main()