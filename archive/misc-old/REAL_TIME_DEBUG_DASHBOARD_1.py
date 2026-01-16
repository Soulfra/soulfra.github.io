from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env python3
"""
REAL-TIME DEBUG DASHBOARD
Monitor all services and show live status of agent control system
"""

import http.server
import socketserver
import json
import time
from datetime import datetime

PORT = 9999

class DebugHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            html = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🐛 SOULFRA DEBUG DASHBOARD</title>
    <style>
        body {
            margin: 0;
            background: #000;
            color: #0f0;
            font-family: 'Courier New', monospace;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: #ff0080;
            font-size: 24px;
        }
        
        .service-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .service-card {
            background: #111;
            border: 2px solid #333;
            border-radius: 10px;
            padding: 15px;
        }
        
        .service-card.online {
            border-color: #0f0;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
        }
        
        .service-card.offline {
            border-color: #f00;
            box-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
        }
        
        .service-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .service-status {
            margin: 5px 0;
        }
        
        .log-section {
            background: #111;
            border: 1px solid #333;
            padding: 20px;
            border-radius: 10px;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .log-entry {
            margin: 2px 0;
            font-size: 12px;
        }
        
        .log-entry.success { color: #0f0; }
        .log-entry.error { color: #f00; }
        .log-entry.warning { color: #ff0; }
        .log-entry.info { color: #0ff; }
        
        .test-section {
            margin-top: 30px;
            background: #222;
            padding: 20px;
            border-radius: 10px;
        }
        
        .test-btn {
            background: #333;
            border: 1px solid #0f0;
            color: #0f0;
            padding: 10px 20px;
            margin: 5px;
            cursor: pointer;
            border-radius: 5px;
        }
        
        .test-btn:hover {
            background: #0f0;
            color: #000;
        }
        
        .agent-status {
            background: #222;
            border: 1px solid #ff0080;
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        🐛 SOULFRA LIVE DEBUG DASHBOARD<br>
        <small>Real-time monitoring of agent control system</small>
    </div>
    
    <div class="service-grid">
        <div class="service-card" id="dashboard-service">
            <div class="service-name">🎮 Dashboard (8890)</div>
            <div class="service-status" id="dashboard-status">Checking...</div>
            <div class="service-status" id="dashboard-url">http://localhost:8890</div>
        </div>
        
        <div class="service-card" id="bridge-service">
            <div class="service-name">🌉 Agent Bridge (8777)</div>
            <div class="service-status" id="bridge-status">Checking...</div>
            <div class="service-status" id="bridge-agents">Agents: Loading...</div>
        </div>
        
        <div class="service-card" id="game-service">
            <div class="service-name">🎯 Ultimate Game (8088)</div>
            <div class="service-status" id="game-status">Checking...</div>
            <div class="service-status" id="game-features">Features: Loading...</div>
        </div>
    </div>
    
    <div class="agent-status" id="agent-status">
        <strong>🤖 Agent Status</strong><br>
        <span id="agent-details">Loading agent information...</span>
    </div>
    
    <div class="test-section">
        <h3>🧪 Live Tests</h3>
        <button class="test-btn" onclick="testFullWorkflow()">Test Complete Agent Control Flow</button>
        <button class="test-btn" onclick="testBridgeAPI()">Test Bridge API</button>
        <button class="test-btn" onclick="testGameAPI()">Test Game API</button>
        <button class="test-btn" onclick="openGameWindow()">Open Game in New Window</button>
        <button class="test-btn" onclick="clearLogs()">Clear Logs</button>
    </div>
    
    <div class="log-section">
        <h3>📜 Live Activity Log</h3>
        <div id="activity-log">
            <div class="log-entry info">Debug dashboard started at ${new Date().toISOString()}</div>
        </div>
    </div>
    
    <script>
        function log(message, type = 'info') {
            const logDiv = document.getElementById('activity-log');
            const entry = document.createElement('div');
            entry.className = `log-entry ${type}`;
            entry.textContent = `[${new Date().toISOString()}] ${message}`;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight;
        }
        
        function updateServiceStatus(serviceId, status, online) {
            const card = document.getElementById(serviceId);
            const statusDiv = document.getElementById(status);
            
            if (online) {
                card.className = 'service-card online';
                statusDiv.textContent = '✅ Online';
            } else {
                card.className = 'service-card offline';
                statusDiv.textContent = '❌ Offline';
            }
        }
        
        async function checkServices() {
            // Check Dashboard
            try {
                const response = await fetch('http://localhost:8890/');
                updateServiceStatus('dashboard-service', 'dashboard-status', response.ok);
                if (response.ok) log('Dashboard is responsive', 'success');
            } catch (error) {
                updateServiceStatus('dashboard-service', 'dashboard-status', false);
                log('Dashboard is offline', 'error');
            }
            
            // Check Bridge
            try {
                const response = await fetch('http://localhost:8777/api/agents');
                const data = await response.json();
                updateServiceStatus('bridge-service', 'bridge-status', response.ok);
                document.getElementById('bridge-agents').textContent = `Agents: ${data.agents.length} loaded`;
                
                if (data.agents.length > 0) {
                    log(`Bridge has ${data.agents.length} agents loaded`, 'success');
                    
                    // Update agent status
                    const agent = data.agents[0];
                    document.getElementById('agent-details').innerHTML = `
                        <strong>${agent.id}</strong> (${agent.tone})<br>
                        Status: ${agent.status}<br>
                        Game: ${agent.current_game || 'None'}<br>
                        Controlled by: ${agent.controlled_by || 'None'}
                    `;
                } else {
                    log('Bridge has no agents loaded', 'warning');
                }
            } catch (error) {
                updateServiceStatus('bridge-service', 'bridge-status', false);
                log('Bridge is offline', 'error');
            }
            
            // Check Game
            try {
                const response = await fetch('http://localhost:8088/api/status');
                const data = await response.json();
                updateServiceStatus('game-service', 'game-status', response.ok);
                document.getElementById('game-features').textContent = `Features: ${data.features.length}`;
                
                if (response.ok) log('Ultimate Game is responsive', 'success');
            } catch (error) {
                updateServiceStatus('game-service', 'game-status', false);
                log('Ultimate Game is offline', 'error');
            }
        }
        
        async function testBridgeAPI() {
            log('Testing bridge API...', 'info');
            try {
                const response = await fetch('http://localhost:8777/api/enter-game', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        agent_id: 'echofox',
                        game_world: 'Ultimate_Game',
                        user_id: 'debug_test'
                    })
                });
                
                const data = await response.json();
                if (data.type === 'success') {
                    log('✅ Bridge API test successful', 'success');
                    log(`Agent ${data.agent.id} entered ${data.agent.current_game}`, 'success');
                } else {
                    log(`❌ Bridge API test failed: ${data.message}`, 'error');
                }
            } catch (error) {
                log(`❌ Bridge API test error: ${error.message}`, 'error');
            }
        }
        
        async function testGameAPI() {
            log('Testing game API...', 'info');
            try {
                const response = await fetch('http://localhost:8088/api/status');
                const data = await response.json();
                log(`✅ Game API test successful: ${data.status}`, 'success');
                log(`Game running on port ${data.port}`, 'info');
            } catch (error) {
                log(`❌ Game API test error: ${error.message}`, 'error');
            }
        }
        
        async function testFullWorkflow() {
            log('🚀 Starting complete agent control workflow test...', 'info');
            
            // Step 1: Test bridge API
            await testBridgeAPI();
            
            // Step 2: Test game API  
            await testGameAPI();
            
            // Step 3: Test agent URL
            log('Testing agent control URL...', 'info');
            try {
                const response = await fetch('http://localhost:8088/?agent=echofox&control=true');
                if (response.ok) {
                    log('✅ Agent control URL is accessible', 'success');
                } else {
                    log('❌ Agent control URL failed', 'error');
                }
            } catch (error) {
                log(`❌ Agent control URL error: ${error.message}`, 'error');
            }
            
            log('🎉 Complete workflow test finished', 'info');
        }
        
        function openGameWindow() {
            log('Opening game window with agent control...', 'info');
            const gameWindow = window.open(
                'http://localhost:8088/?agent=echofox&control=true',
                'AgentGame',
                'width=1200,height=800'
            );
            
            if (gameWindow) {
                log('✅ Game window opened successfully', 'success');
            } else {
                log('❌ Failed to open game window (popup blocked?)', 'error');
            }
        }
        
        function clearLogs() {
            document.getElementById('activity-log').innerHTML = '';
            log('Debug dashboard log cleared', 'info');
        }
        
        // Check services every 5 seconds
        setInterval(checkServices, 5000);
        checkServices(); // Initial check
        
        log('Debug dashboard fully loaded', 'success');
    </script>
</body>
</html>
            '''
            
            self.wfile.write(html.encode('utf-8'))
            
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        pass  # Suppress logs

if __name__ == "__main__":
    print("🐛 REAL-TIME DEBUG DASHBOARD")
    print("=" * 50)
    print(f"🌐 Debug dashboard running on http://localhost:{PORT}")
    print("📊 Monitoring all SOULFRA services in real-time")
    print("🔍 Use this to see exactly what's happening")
    
    with socketserver.TCPServer(("", PORT), DebugHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Debug dashboard shutting down...")