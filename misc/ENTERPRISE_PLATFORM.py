#!/usr/bin/env python3
"""
ENTERPRISE PLATFORM - Production-ready with logging, monitoring, and analytics
"""

import http.server
import socketserver
import json
import os
import time
import threading
from datetime import datetime
from pathlib import Path

# Import our logger and Cal Riven connector
from PLATFORM_LOGGER import logger
from CAL_RIVEN_CONNECTOR import ReflectionMiddleware

PORT = 3003

# Kill anything on this port
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

# Platform state
platform_state = {
    'version': '1.0.0',
    'start_time': datetime.now().isoformat(),
    'game_data': {
        'clicks': 0,
        'reflections': [],
        'sessions': {},
        'high_scores': []
    },
    'metrics': {
        'total_requests': 0,
        'active_users': 0,
        'uptime_seconds': 0
    }
}

# HTML with analytics dashboard
HTML = """<!DOCTYPE html>
<html>
<head>
<title>SOULFRA ENTERPRISE PLATFORM</title>
<style>
body { background: #000; color: #fff; font-family: -apple-system, Arial, sans-serif; margin: 0; }
.header { background: linear-gradient(45deg, #00ff88, #00ccff); padding: 20px; color: #000; }
.header h1 { margin: 0; display: flex; justify-content: space-between; align-items: center; }
.version { font-size: 14px; opacity: 0.8; }
.tabs { display: flex; background: #1a1a1a; }
.tab { padding: 15px 30px; cursor: pointer; transition: all 0.3s; }
.tab:hover { background: #2a2a2a; }
.tab.active { background: #000; border-bottom: 3px solid #0f8; }
.content { display: none; padding: 40px; }
.content.active { display: block; }

/* Game styles */
.game-container { display: flex; gap: 40px; }
.game-area { flex: 1; text-align: center; }
button { font-size: 48px; padding: 30px 60px; background: #0f8; border: none; cursor: pointer; border-radius: 10px; margin: 10px; }
button:hover { background: #0fa; transform: scale(1.05); }
#score { font-size: 72px; color: #ff0; margin: 20px; }
.reflection-box { background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0; }
textarea { width: 100%; background: #0a0a0a; color: #fff; border: 1px solid #444; padding: 10px; border-radius: 5px; }

/* Analytics styles */
.analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
.metric-card { background: #1a1a1a; padding: 20px; border-radius: 10px; text-align: center; }
.metric-value { font-size: 48px; color: #0f8; margin: 10px 0; }
.metric-label { color: #888; }
.chart { background: #0a0a0a; height: 200px; border-radius: 10px; display: flex; align-items: flex-end; padding: 20px; gap: 5px; }
.bar { background: #0f8; width: 20px; transition: height 0.3s; }

/* API styles */
.api-section { background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0; }
.endpoint { background: #0a0a0a; padding: 15px; margin: 10px 0; border-radius: 5px; font-family: monospace; }
.method { display: inline-block; padding: 5px 10px; border-radius: 5px; margin-right: 10px; font-weight: bold; }
.method.get { background: #4CAF50; }
.method.post { background: #2196F3; }

/* Logs styles */
.log-viewer { background: #0a0a0a; padding: 20px; border-radius: 10px; height: 400px; overflow-y: auto; font-family: monospace; font-size: 12px; }
.log-entry { margin: 2px 0; }
.log-entry.error { color: #ff4444; }
.log-entry.success { color: #44ff44; }
.log-entry.info { color: #4444ff; }
</style>
</head>
<body>

<div class="header">
<h1>SOULFRA ENTERPRISE PLATFORM <span class="version">v1.0.0</span></h1>
</div>

<div class="tabs">
<div class="tab active" onclick="showTab('game')">GAME</div>
<div class="tab" onclick="showTab('analytics')">ANALYTICS</div>
<div class="tab" onclick="showTab('api')">API DOCS</div>
<div class="tab" onclick="showTab('logs')">LOGS</div>
</div>

<!-- GAME TAB -->
<div id="game" class="content active">
<div class="game-container">
<div class="game-area">
<h2>CONNECTED CLICKER</h2>
<div id="score">0</div>
<button onclick="incrementScore()">CLICK ME</button>
<button onclick="saveScore()">SAVE TO API</button>

<div class="reflection-box">
<h3>Send Reflection to Cal Riven</h3>
<textarea id="reflection" rows="3" placeholder="What are you thinking about?"></textarea>
<button onclick="sendReflection()" style="font-size: 24px; padding: 10px 20px;">SEND REFLECTION</button>
</div>
</div>

<div style="flex: 1;">
<div class="api-section">
<h3>Live Stats</h3>
<div class="metric-card">
<div class="metric-label">Total Clicks</div>
<div class="metric-value" id="total-clicks">0</div>
</div>
<div class="metric-card">
<div class="metric-label">Reflections</div>
<div class="metric-value" id="reflection-count">0</div>
</div>
</div>
</div>
</div>
</div>

<!-- ANALYTICS TAB -->
<div id="analytics" class="content">
<h2>PLATFORM ANALYTICS</h2>
<div class="analytics-grid">
<div class="metric-card">
<div class="metric-label">Total Requests</div>
<div class="metric-value" id="total-requests">0</div>
</div>
<div class="metric-card">
<div class="metric-label">Active Users</div>
<div class="metric-value" id="active-users">0</div>
</div>
<div class="metric-card">
<div class="metric-label">Uptime</div>
<div class="metric-value" id="uptime">0s</div>
</div>
<div class="metric-card">
<div class="metric-label">Error Rate</div>
<div class="metric-value" id="error-rate">0%</div>
</div>
</div>

<h3>Request Distribution</h3>
<div class="chart" id="request-chart"></div>

<h3>Top Reflections</h3>
<div id="top-reflections" style="background: #1a1a1a; padding: 20px; border-radius: 10px; margin: 20px 0;">
<p style="color: #888;">No reflections yet...</p>
</div>
</div>

<!-- API DOCS TAB -->
<div id="api" class="content">
<h2>API DOCUMENTATION</h2>

<div class="api-section">
<h3>Base URL</h3>
<code style="background: #0a0a0a; padding: 10px; display: block; border-radius: 5px;">http://localhost:3002</code>
</div>

<div class="api-section">
<h3>Endpoints</h3>

<div class="endpoint">
<span class="method get">GET</span>
<strong>/api/status</strong>
<p>Returns platform status and health information</p>
</div>

<div class="endpoint">
<span class="method get">GET</span>
<strong>/api/data</strong>
<p>Returns current game state and analytics</p>
</div>

<div class="endpoint">
<span class="method post">POST</span>
<strong>/api/score</strong>
<p>Save game score. Body: {"score": 100}</p>
</div>

<div class="endpoint">
<span class="method post">POST</span>
<strong>/api/reflect</strong>
<p>Submit reflection. Body: {"text": "...", "score": 100}</p>
</div>

<div class="endpoint">
<span class="method get">GET</span>
<strong>/api/analytics</strong>
<p>Get detailed platform analytics</p>
</div>
</div>
</div>

<!-- LOGS TAB -->
<div id="logs" class="content">
<h2>LIVE LOGS</h2>
<div class="log-viewer" id="log-viewer">
<div class="log-entry info">[SYSTEM] Platform started</div>
</div>
<button onclick="clearLogs()" style="font-size: 16px; padding: 10px 20px;">CLEAR LOGS</button>
</div>

<script>
let score = 0;
let ws = null;

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Game functions
function incrementScore() {
    score++;
    document.getElementById('score').textContent = score;
    logEvent('game', 'Score incremented to ' + score);
}

async function saveScore() {
    const response = await fetch('/api/score', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({score: score})
    });
    const result = await response.json();
    logEvent('success', 'Score saved: ' + score);
    updateStats();
}

async function sendReflection() {
    const text = document.getElementById('reflection').value;
    if (!text) return;
    
    const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text: text, score: score})
    });
    const result = await response.json();
    
    document.getElementById('reflection').value = '';
    logEvent('success', 'Reflection sent: ' + text.substring(0, 50) + '...');
    updateStats();
}

// Analytics functions
async function updateStats() {
    const response = await fetch('/api/analytics');
    const data = await response.json();
    
    // Update metrics
    document.getElementById('total-clicks').textContent = data.game_data.clicks;
    document.getElementById('reflection-count').textContent = data.game_data.reflections.length;
    document.getElementById('total-requests').textContent = data.metrics.total_requests;
    document.getElementById('active-users').textContent = data.metrics.active_users;
    document.getElementById('uptime').textContent = formatUptime(data.metrics.uptime_seconds);
    document.getElementById('error-rate').textContent = data.analytics.summary.error_rate || '0%';
    
    // Update reflections
    if (data.game_data.reflections.length > 0) {
        const reflectionsHtml = data.game_data.reflections.slice(-5).reverse().map(r => 
            `<div style="margin: 10px 0; padding: 10px; background: #0a0a0a; border-radius: 5px;">
                <strong>Score: ${r.score}</strong><br>
                ${r.text}
            </div>`
        ).join('');
        document.getElementById('top-reflections').innerHTML = reflectionsHtml;
    }
    
    // Update request chart
    updateRequestChart(data.analytics.top_apis || []);
}

function updateRequestChart(apiData) {
    if (apiData.length === 0) return;
    
    const chart = document.getElementById('request-chart');
    const maxValue = Math.max(...apiData.map(d => d[1]));
    
    chart.innerHTML = apiData.map(([endpoint, count]) => {
        const height = (count / maxValue) * 180;
        return `<div style="text-align: center;">
            <div class="bar" style="height: ${height}px;" title="${endpoint}: ${count}"></div>
            <div style="font-size: 10px; margin-top: 5px;">${endpoint.split('/').pop()}</div>
        </div>`;
    }).join('');
}

function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
}

// Logging
function logEvent(type, message) {
    const viewer = document.getElementById('log-viewer');
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + type;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    viewer.appendChild(entry);
    viewer.scrollTop = viewer.scrollHeight;
}

function clearLogs() {
    document.getElementById('log-viewer').innerHTML = '<div class="log-entry info">[SYSTEM] Logs cleared</div>';
}

// Update stats every second
setInterval(updateStats, 1000);

// Initial load
updateStats();
logEvent('info', 'Platform interface loaded');
</script>

</body>
</html>"""

class EnterprisePlatformHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        start_time = time.time()
        
        try:
            if self.path == '/':
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(HTML.encode())
                
            elif self.path == '/api/status':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                status = {
                    'platform': 'online',
                    'version': platform_state['version'],
                    'port': PORT,
                    'timestamp': datetime.now().isoformat(),
                    'uptime_seconds': int((datetime.now() - datetime.fromisoformat(platform_state['start_time'])).total_seconds())
                }
                self.wfile.write(json.dumps(status).encode())
                
            elif self.path == '/api/data':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(platform_state['game_data']).encode())
                
            elif self.path == '/api/analytics':
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                analytics_data = {
                    'game_data': platform_state['game_data'],
                    'metrics': platform_state['metrics'],
                    'analytics': logger.get_analytics()
                }
                self.wfile.write(json.dumps(analytics_data).encode())
                
            else:
                self.send_error(404)
                
        except Exception as e:
            logger.log_error({
                'message': str(e),
                'path': self.path,
                'stack_trace': str(e)
            })
            self.send_error(500)
        
        finally:
            # Log access
            duration_ms = int((time.time() - start_time) * 1000)
            logger.log_access({
                'method': 'GET',
                'path': self.path,
                'status': 200,
                'duration': duration_ms,
                'ip': self.client_address[0]
            })
            
            platform_state['metrics']['total_requests'] += 1
    
    def do_POST(self):
        start_time = time.time()
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
            
            try:
                data = json.loads(post_data)
            except:
                data = {}
            
            if self.path == '/api/score':
                platform_state['game_data']['clicks'] = data.get('score', 0)
                
                # Log event
                logger.log_event({
                    'type': 'score_saved',
                    'data': {'score': data.get('score', 0)}
                })
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'saved'}).encode())
                
            elif self.path == '/api/reflect':
                reflection = {
                    'text': data.get('text', ''),
                    'score': data.get('score', 0),
                    'timestamp': datetime.now().isoformat(),
                    'user_id': self.headers.get('X-User-ID', 'anonymous')
                }
                
                # Process through Cal Riven if available
                enhanced_reflection = reflection_middleware.process_reflection(reflection)
                platform_state['game_data']['reflections'].append(enhanced_reflection)
                
                # Log enhanced reflection
                logger.log_reflection(enhanced_reflection)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                
                response = {
                    'status': 'reflected',
                    'id': len(platform_state['game_data']['reflections']) - 1
                }
                self.wfile.write(json.dumps(response).encode())
                
            else:
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'status': 'ok'}).encode())
                
        except Exception as e:
            logger.log_error({
                'message': str(e),
                'path': self.path,
                'stack_trace': str(e)
            })
            self.send_error(500)
            
        finally:
            # Log access
            duration_ms = int((time.time() - start_time) * 1000)
            logger.log_access({
                'method': 'POST',
                'path': self.path,
                'status': 200,
                'duration': duration_ms,
                'ip': self.client_address[0]
            })
            
            platform_state['metrics']['total_requests'] += 1
    
    def log_message(self, format, *args):
        # Custom logging through our logger
        pass

# Background metrics updater
def update_metrics():
    """Update platform metrics every second"""
    while True:
        time.sleep(1)
        platform_state['metrics']['uptime_seconds'] += 1
        
        # Log metrics
        logger.log_metric({
            'name': 'platform_uptime',
            'value': platform_state['metrics']['uptime_seconds'],
            'unit': 'seconds'
        })

# Start metrics thread
metrics_thread = threading.Thread(target=update_metrics, daemon=True)
metrics_thread.start()

# Initialize Cal Riven connection
reflection_middleware = ReflectionMiddleware()

# Start server
httpd = socketserver.TCPServer(("", PORT), EnterprisePlatformHandler)
httpd.allow_reuse_address = True

print(f"""
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║           SOULFRA ENTERPRISE PLATFORM v1.0.0               ║
║                                                            ║
║  Running at: http://localhost:{PORT}                       ║
║                                                            ║
║  Features:                                                 ║
║  ✓ Integrated game + API router                           ║
║  ✓ Enterprise logging system                              ║
║  ✓ Real-time analytics dashboard                          ║
║  ✓ Comprehensive API documentation                        ║
║  ✓ Live log viewer                                        ║
║  ✓ Performance monitoring                                 ║
║  ✓ Reflection tracking                                    ║
║                                                            ║
║  Logs directory: ./logs/                                   ║
║  Documentation: PLATFORM_DOCUMENTATION.md                  ║
║                                                            ║
║  Enterprise-grade infrastructure ready for scale!          ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
""")

# Generate initial report
logger.generate_report()
print(f"\nDaily report generated: ./logs/report_{datetime.now().strftime('%Y%m%d')}.json")

try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nShutting down...")
    # Generate final report
    logger.generate_report()
    httpd.shutdown()