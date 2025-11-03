#!/usr/bin/env python3
"""
SOULFRA MONITOR - Real-time service monitoring dashboard
"""

import os
import json
import time
import subprocess
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import socket

class SoulfraMonitor:
    """Monitor all Soulfra services"""
    
    def __init__(self):
        self.port = 7777
        self.services = {
            'chat_processor': {
                'name': 'Chat Log Processor',
                'port': 4040,
                'url': 'http://localhost:4040',
                'icon': '[CHAT]',
                'color': '#2196F3'
            },
            'simple_game': {
                'name': 'Simple Game',
                'port': 5555,
                'url': 'http://localhost:5555',
                'icon': '[GAME]',
                'color': '#FF9800'
            },
            'platform': {
                'name': 'Working Platform',
                'port': 3002,
                'url': 'http://localhost:3002',
                'icon': '[PLATFORM]',
                'color': '#4CAF50'
            },
            'dashboard': {
                'name': 'Monitor Dashboard',
                'port': 7777,
                'url': 'http://localhost:7777',
                'icon': '[MONITOR]',
                'color': '#9C27B0'
            }
        }
    
    def check_port(self, port):
        """Check if a port is open"""
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    
    def get_service_status(self, service):
        """Get detailed status for a service"""
        port_open = self.check_port(service['port'])
        
        # Try to make HTTP request
        http_ok = False
        if port_open:
            try:
                with urllib.request.urlopen(service['url'], timeout=2) as response:
                    http_ok = response.status == 200
            except:
                pass
        
        return {
            'name': service['name'],
            'port': service['port'],
            'url': service['url'],
            'port_open': port_open,
            'http_ok': http_ok,
            'status': 'running' if port_open and http_ok else 'stopped',
            'icon': service['icon'],
            'color': service['color']
        }
    
    def get_system_stats(self):
        """Get system statistics"""
        # Simple stats without psutil
        try:
            # Count processes (simple method)
            process_count = len(os.listdir('/proc')) if os.path.exists('/proc') else 'N/A'
        except:
            process_count = 'N/A'
        
        return {
            'cpu': 'N/A',
            'memory': 'N/A', 
            'disk': 'N/A',
            'processes': process_count,
            'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    
    def get_all_status(self):
        """Get status of all services"""
        return {
            'system': self.get_system_stats(),
            'services': {
                key: self.get_service_status(service)
                for key, service in self.services.items()
            }
        }

class MonitorHandler(BaseHTTPRequestHandler):
    """HTTP handler for the monitor"""
    
    def log_message(self, format, *args):
        """Suppress logs"""
        return
    
    def do_GET(self):
        if self.path == '/':
            self.serve_dashboard()
        elif self.path == '/status':
            self.serve_status()
        else:
            self.send_error(404)
    
    def serve_dashboard(self):
        """Serve the monitoring dashboard"""
        html = '''<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Service Monitor</title>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Courier New', monospace; 
            background: #0a0a0a; 
            color: #00ff00;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            text-align: center;
            padding: 20px;
            background: #1a1a1a;
            border: 2px solid #00ff00;
            margin-bottom: 20px;
        }
        h1 { 
            font-size: 32px; 
            text-shadow: 0 0 10px #00ff00;
            margin-bottom: 10px;
        }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        .service-card {
            background: #1a1a1a;
            border: 2px solid #333;
            padding: 20px;
            transition: all 0.3s;
        }
        .service-card.running { border-color: #00ff00; }
        .service-card.stopped { border-color: #ff4444; }
        .service-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .service-name { font-size: 18px; font-weight: bold; }
        .status-badge {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            text-transform: uppercase;
        }
        .status-badge.running { 
            background: #00ff00; 
            color: #000;
        }
        .status-badge.stopped { 
            background: #ff4444; 
            color: #fff;
        }
        .service-details {
            font-size: 14px;
            opacity: 0.8;
        }
        .service-details div { margin: 5px 0; }
        .system-stats {
            background: #1a1a1a;
            border: 2px solid #333;
            padding: 20px;
            margin-bottom: 20px;
        }
        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        .stat-item {
            background: #0a0a0a;
            padding: 15px;
            border: 1px solid #333;
            text-align: center;
        }
        .stat-value {
            font-size: 28px;
            font-weight: bold;
            margin: 5px 0;
        }
        .stat-label {
            font-size: 12px;
            opacity: 0.8;
            text-transform: uppercase;
        }
        .actions {
            text-align: center;
            margin-top: 30px;
        }
        button {
            background: #1a1a1a;
            color: #00ff00;
            border: 2px solid #00ff00;
            padding: 15px 30px;
            font-size: 16px;
            cursor: pointer;
            margin: 0 10px;
            font-family: 'Courier New', monospace;
            transition: all 0.3s;
        }
        button:hover {
            background: #00ff00;
            color: #000;
        }
        .refresh-info {
            text-align: center;
            margin-top: 20px;
            opacity: 0.6;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>SOULFRA SERVICE MONITOR</h1>
            <p>Real-time monitoring of all platform services</p>
        </div>
        
        <div class="system-stats">
            <h2>System Statistics</h2>
            <div class="stat-grid" id="system-stats">
                <div class="stat-item">
                    <div class="stat-label">CPU Usage</div>
                    <div class="stat-value" id="cpu">--</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Memory Usage</div>
                    <div class="stat-value" id="memory">--</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Disk Usage</div>
                    <div class="stat-value" id="disk">--</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Processes</div>
                    <div class="stat-value" id="processes">--</div>
                </div>
            </div>
        </div>
        
        <h2 style="margin-bottom: 15px;">Service Status</h2>
        <div class="grid" id="services-grid"></div>
        
        <div class="actions">
            <button onclick="startAll()">Start All Services</button>
            <button onclick="refreshStatus()">Refresh Status</button>
        </div>
        
        <div class="refresh-info">
            Last updated: <span id="last-update">Never</span> | Auto-refresh every 5 seconds
        </div>
    </div>
    
    <script>
        function updateDashboard() {
            fetch('/status')
                .then(r => r.json())
                .then(data => {
                    // Update system stats
                    document.getElementById('cpu').textContent = data.system.cpu === 'N/A' ? 'N/A' : data.system.cpu.toFixed(1) + '%';
                    document.getElementById('memory').textContent = data.system.memory === 'N/A' ? 'N/A' : data.system.memory.toFixed(1) + '%';
                    document.getElementById('disk').textContent = data.system.disk === 'N/A' ? 'N/A' : data.system.disk.toFixed(1) + '%';
                    document.getElementById('processes').textContent = data.system.processes;
                    
                    // Update services
                    const grid = document.getElementById('services-grid');
                    grid.innerHTML = '';
                    
                    Object.entries(data.services).forEach(([key, service]) => {
                        const card = document.createElement('div');
                        card.className = `service-card ${service.status}`;
                        card.innerHTML = `
                            <div class="service-header">
                                <div class="service-name">${service.icon} ${service.name}</div>
                                <div class="status-badge ${service.status}">${service.status}</div>
                            </div>
                            <div class="service-details">
                                <div>Port: ${service.port}</div>
                                <div>URL: <a href="${service.url}" target="_blank" style="color: #00ff00;">${service.url}</a></div>
                                <div>Port Open: ${service.port_open ? 'YES' : 'NO'}</div>
                                <div>HTTP OK: ${service.http_ok ? 'YES' : 'NO'}</div>
                            </div>
                        `;
                        grid.appendChild(card);
                    });
                    
                    document.getElementById('last-update').textContent = data.system.timestamp;
                })
                .catch(err => {
                    console.error('Update failed:', err);
                });
        }
        
        function refreshStatus() {
            updateDashboard();
        }
        
        function startAll() {
            if (confirm('Start all stopped services?')) {
                alert('Use START_ALL_SERVICES.py to start services');
            }
        }
        
        // Initial update
        updateDashboard();
        
        // Auto-refresh every 5 seconds
        setInterval(updateDashboard, 5000);
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_status(self):
        """Serve JSON status"""
        monitor = self.server.monitor
        status = monitor.get_all_status()
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(status).encode())

def main():
    """Main function"""
    # Kill anything on port 7777 first
    os.system('lsof -ti :7777 | xargs kill -9 2>/dev/null')
    time.sleep(1)
    
    monitor = SoulfraMonitor()
    
    print(f"""
=====================================
    SOULFRA SERVICE MONITOR
=====================================

[STARTING] Monitor dashboard on port {monitor.port}...

Monitoring services:
- Chat Log Processor (port 4040)
- Simple Game (port 5555)
- Working Platform (port 3002)
- Dashboard (port 7777)

Dashboard: http://localhost:{monitor.port}
""")
    
    try:
        server = HTTPServer(('localhost', monitor.port), MonitorHandler)
        server.monitor = monitor
        
        print(f"[READY] Monitor running at http://localhost:{monitor.port}")
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n[STOPPED] Monitor stopped")
    except Exception as e:
        print(f"[ERROR] Failed to start monitor: {e}")

if __name__ == '__main__':
    main()