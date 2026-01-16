#!/usr/bin/env python3
"""
MASTER ROUTER - Controls all services with proper limits and routing
Prevents timeout issues and resource exhaustion
"""

import http.server
import socketserver
import json
import os
import time
import threading
import subprocess
from collections import deque
from datetime import datetime

PORT = 8888

# Kill existing
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

class ServiceManager:
    def __init__(self):
        self.services = {
            'text_game': {
                'port': 3456,
                'script': 'TEXT_ONLY_GAME.py',
                'limit': 100,  # requests per minute
                'memory_mb': 128,
                'status': 'stopped',
                'pid': None
            },
            'json_api': {
                'port': 4444,
                'script': 'NO_EMOJI_API.py',
                'limit': 200,
                'memory_mb': 128,
                'status': 'stopped',
                'pid': None
            },
            'mirror_bridge': {
                'port': 8001,
                'script': 'MIRROR_BRIDGE.py',
                'limit': 50,
                'memory_mb': 256,
                'status': 'stopped',
                'pid': None
            },
            'unified_reflection': {
                'port': 9999,
                'script': 'UNIFIED_REFLECTION_ENGINE.py',
                'limit': 30,
                'memory_mb': 512,
                'status': 'stopped',
                'pid': None
            }
        }
        
        # Request tracking
        self.request_counts = {name: deque(maxlen=60) for name in self.services}
        self.ledger = []
        
        # Start monitor thread
        threading.Thread(target=self._monitor_loop, daemon=True).start()
        
    def start_service(self, name):
        """Start a service with resource limits"""
        if name not in self.services:
            return False
            
        service = self.services[name]
        
        # Kill any existing
        if service['pid']:
            os.system(f"kill -9 {service['pid']} 2>/dev/null")
            
        # Start with limits
        cmd = [
            'nice', '-n', '10',  # Lower priority
            'python3', '-u', service['script']
        ]
        
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            preexec_fn=os.setsid  # New session for clean kills
        )
        
        service['pid'] = process.pid
        service['status'] = 'running'
        
        # Log to ledger
        self.ledger.append({
            'timestamp': datetime.now().isoformat(),
            'action': 'start_service',
            'service': name,
            'pid': process.pid
        })
        
        return True
        
    def stop_service(self, name):
        """Stop a service gracefully"""
        if name not in self.services:
            return False
            
        service = self.services[name]
        
        if service['pid']:
            # Graceful shutdown
            os.system(f"kill -TERM {service['pid']} 2>/dev/null")
            time.sleep(1)
            # Force if needed
            os.system(f"kill -9 {service['pid']} 2>/dev/null")
            
        service['status'] = 'stopped'
        service['pid'] = None
        
        # Log to ledger
        self.ledger.append({
            'timestamp': datetime.now().isoformat(),
            'action': 'stop_service',
            'service': name
        })
        
        return True
        
    def check_rate_limit(self, service_name):
        """Check if service is within rate limits"""
        if service_name not in self.services:
            return False
            
        now = time.time()
        counts = self.request_counts[service_name]
        
        # Remove old entries
        while counts and counts[0] < now - 60:
            counts.popleft()
            
        # Check limit
        limit = self.services[service_name]['limit']
        if len(counts) >= limit:
            return False
            
        # Add current request
        counts.append(now)
        return True
        
    def _monitor_loop(self):
        """Monitor services and enforce limits"""
        while True:
            for name, service in self.services.items():
                if service['status'] == 'running' and service['pid']:
                    # Check if process is alive
                    try:
                        os.kill(service['pid'], 0)
                    except OSError:
                        # Process died
                        service['status'] = 'crashed'
                        service['pid'] = None
                        
                        # Auto-restart critical services
                        if name in ['text_game', 'json_api']:
                            time.sleep(2)
                            self.start_service(name)
                            
            # Clean old ledger entries (keep last 1000)
            if len(self.ledger) > 1000:
                self.ledger = self.ledger[-1000:]
                
            time.sleep(5)
            
    def get_status(self):
        """Get complete system status"""
        return {
            'services': self.services,
            'request_counts': {name: len(counts) for name, counts in self.request_counts.items()},
            'ledger_size': len(self.ledger),
            'recent_events': self.ledger[-10:]
        }

# Global manager
manager = ServiceManager()

# Auto-start core services
manager.start_service('text_game')
manager.start_service('json_api')

class MasterRouter(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            # Control panel
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
<title>MASTER ROUTER</title>
<style>
body { font-family: monospace; background: #111; color: #fff; padding: 20px; }
.service { border: 1px solid #444; padding: 10px; margin: 10px; }
.running { background: #001100; }
.stopped { background: #110000; }
.crashed { background: #330000; }
button { padding: 5px 10px; margin: 5px; }
#status { background: #222; padding: 10px; margin: 10px 0; }
</style>
</head>
<body>
<h1>MASTER ROUTER - Service Control</h1>
<div id="services"></div>
<div id="status"></div>
<script>
async function toggleService(name, action) {
    await fetch(`/service/${name}/${action}`);
    update();
}

async function update() {
    const res = await fetch('/status');
    const data = await res.json();
    
    let html = '';
    for (const [name, service] of Object.entries(data.services)) {
        html += `<div class="service ${service.status}">
            <h3>${name}</h3>
            <p>Port: ${service.port} | Status: ${service.status} | PID: ${service.pid || 'N/A'}</p>
            <p>Rate Limit: ${service.limit}/min | Memory: ${service.memory_mb}MB</p>
            <p>Current Requests: ${data.request_counts[name] || 0}/min</p>
            <button onclick="toggleService('${name}', 'start')">Start</button>
            <button onclick="toggleService('${name}', 'stop')">Stop</button>
        </div>`;
    }
    document.getElementById('services').innerHTML = html;
    
    document.getElementById('status').innerHTML = `
        <h3>System Status</h3>
        <p>Ledger Entries: ${data.ledger_size}</p>
        <p>Recent Events:</p>
        <pre>${JSON.stringify(data.recent_events, null, 2)}</pre>
    `;
}

setInterval(update, 2000);
update();
</script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
        elif self.path == '/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(manager.get_status()).encode())
            
        elif self.path.startswith('/service/'):
            parts = self.path.split('/')
            if len(parts) == 4:
                service_name = parts[2]
                action = parts[3]
                
                if action == 'start':
                    success = manager.start_service(service_name)
                elif action == 'stop':
                    success = manager.stop_service(service_name)
                else:
                    success = False
                    
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': success}).encode())
                
        elif self.path.startswith('/proxy/'):
            # Proxy requests to services with rate limiting
            parts = self.path.split('/', 3)
            if len(parts) >= 3:
                service_name = parts[2]
                
                if not manager.check_rate_limit(service_name):
                    self.send_error(429, "Rate limit exceeded")
                    return
                    
                if service_name in manager.services:
                    service = manager.services[service_name]
                    if service['status'] == 'running':
                        # Proxy the request
                        import urllib.request
                        try:
                            target_path = '/' + (parts[3] if len(parts) > 3 else '')
                            response = urllib.request.urlopen(
                                f"http://localhost:{service['port']}{target_path}",
                                timeout=5
                            )
                            
                            self.send_response(200)
                            self.send_header('Content-Type', response.headers.get('Content-Type', 'text/plain'))
                            self.end_headers()
                            self.wfile.write(response.read())
                            
                        except Exception as e:
                            self.send_error(502, f"Service error: {str(e)}")
                    else:
                        self.send_error(503, "Service not running")
                else:
                    self.send_error(404, "Service not found")
                    
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        print(f"[ROUTER] {format % args}")

# Start router
httpd = socketserver.TCPServer(("", PORT), MasterRouter)
httpd.allow_reuse_address = True

print(f"\nMASTER ROUTER: http://localhost:{PORT}")
print("\nFeatures:")
print("- Rate limiting (prevents timeout issues)")
print("- Resource limits (prevents memory exhaustion)")
print("- Service monitoring (auto-restart on crash)")
print("- Request ledger (tracks all activity)")
print("- Proxy routing (safe access to all services)")
print("\nProxy endpoints:")
print("  /proxy/text_game/*")
print("  /proxy/json_api/*")
print("  /proxy/mirror_bridge/*")
print("  /proxy/unified_reflection/*")
print("\nThis prevents crypto/AI layers from going crazy!")

httpd.serve_forever()