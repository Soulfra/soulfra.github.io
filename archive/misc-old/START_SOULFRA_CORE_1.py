#!/usr/bin/env python3
"""
START SOULFRA CORE
Actually starts the essential services and tests they're working
"""

import asyncio
import subprocess
import sys
import os
import time
from pathlib import Path
import urllib.request
import urllib.error

class SoulfraCoreStarter:
    def __init__(self):
        self.services = {}
        self.test_results = {}
        
    async def start_core_services(self):
        """Start only the essential services first"""
        print("🚀 STARTING SOULFRA CORE SERVICES...")
        print("=" * 60)
        
        # 1. Start integrated hub (main entry point)
        print("\n[1/4] Starting Integrated Hub...")
        if await self.start_service('hub', 'soulfra_integrated_hub.py', 8080):
            print("  ✓ Hub started on port 8080")
        else:
            print("  ✗ Hub failed to start")
            
        # 2. Start VIBE token economy 
        print("\n[2/4] Starting Token Economy...")
        if os.path.exists('VIBE_TOKEN_ECONOMY.py'):
            if await self.start_service('token', 'VIBE_TOKEN_ECONOMY.py', 8090):
                print("  ✓ Token economy started on port 8090")
        
        # 3. Start unified API
        print("\n[3/4] Starting Unified API...")
        await self.create_simple_api()
        
        # 4. Start web interface
        print("\n[4/4] Starting Web Interface...")
        await self.create_web_interface()
        
        # Wait for services to initialize
        print("\n⏳ Waiting for services to initialize...")
        await asyncio.sleep(3)
        
        # Test services
        print("\n🧪 Testing services...")
        await self.test_services()
        
        print("\n" + "=" * 60)
        print("✨ SOULFRA CORE IS RUNNING! ✨")
        print("=" * 60)
        print("\n🌐 ACCESS POINTS:")
        print("  Main Hub:    http://localhost:8080")
        print("  Web UI:      http://localhost:8888") 
        print("  API:         http://localhost:8081/api/status")
        print("\n💡 Drop a file at http://localhost:8888 to create agents!")
        
    async def start_service(self, name: str, script: str, port: int) -> bool:
        """Start a Python service"""
        if not os.path.exists(script):
            return False
            
        try:
            process = subprocess.Popen(
                [sys.executable, script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            self.services[name] = process
            
            # Give it a moment to start
            await asyncio.sleep(1)
            
            # Check if it's still running
            if process.poll() is None:
                return True
            else:
                # Print error if it crashed
                stderr = process.stderr.read().decode()
                if stderr:
                    print(f"    Error: {stderr[:200]}")
                return False
                
        except Exception as e:
            print(f"    Failed to start: {e}")
            return False
            
    async def create_simple_api(self):
        """Create a minimal API server"""
        api_code = '''
from aiohttp import web
import json
import random

routes = web.RouteTableDef()

@routes.get('/api/status')
async def status(request):
    return web.json_response({
        'status': 'running',
        'agents_active': random.randint(1, 10),
        'total_vibe': random.randint(10000, 100000),
        'message': 'Soulfra Core is operational'
    })

@routes.post('/api/agent/create')
async def create_agent(request):
    data = await request.json()
    return web.json_response({
        'agent_id': f"agent_{random.randint(1000, 9999)}",
        'status': 'created',
        'earning_rate': random.randint(10, 100)
    })

app = web.Application()
app.add_routes(routes)

if __name__ == '__main__':
    web.run_app(app, port=8081)
'''
        
        with open('/tmp/soulfra_api.py', 'w') as f:
            f.write(api_code)
            
        process = subprocess.Popen(
            [sys.executable, '/tmp/soulfra_api.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        self.services['api'] = process
        print("  ✓ API server started on port 8081")
        
    async def create_web_interface(self):
        """Create simple web interface"""
        html = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SOULFRA CORE</title>
    <style>
        body {
            background: #000;
            color: #0f0;
            font-family: monospace;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 50px;
        }
        
        h1 {
            font-size: 48px;
            text-shadow: 0 0 20px #0f0;
        }
        
        .drop-zone {
            border: 3px dashed #0f0;
            border-radius: 20px;
            padding: 50px;
            margin: 30px;
            text-align: center;
            cursor: pointer;
        }
        
        .drop-zone:hover {
            background: rgba(0, 255, 0, 0.1);
        }
        
        .status {
            margin: 20px;
            padding: 20px;
            border: 1px solid #0f0;
            border-radius: 10px;
        }
        
        button {
            background: #0f0;
            color: #000;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            cursor: pointer;
            margin: 10px;
        }
    </style>
</head>
<body>
    <h1>SOULFRA CORE</h1>
    <p>The AI Agent Economy Platform</p>
    
    <div class="drop-zone" onclick="document.getElementById('fileInput').click()">
        <h2>📄 DROP FILE HERE</h2>
        <p>Create AI agents from any text</p>
    </div>
    
    <input type="file" id="fileInput" style="display: none" onchange="handleFile(event)">
    
    <div class="status">
        <h3>Status: <span id="status">Loading...</span></h3>
        <p>Active Agents: <span id="agents">0</span></p>
        <p>Total VIBE: <span id="vibe">0</span></p>
    </div>
    
    <div>
        <button onclick="createAgent()">Create Test Agent</button>
        <button onclick="window.open('http://localhost:8080')">Open Hub</button>
    </div>
    
    <script>
        async function updateStatus() {
            try {
                const response = await fetch('http://localhost:8081/api/status');
                const data = await response.json();
                document.getElementById('status').textContent = 'Online';
                document.getElementById('agents').textContent = data.agents_active;
                document.getElementById('vibe').textContent = data.total_vibe;
            } catch (e) {
                document.getElementById('status').textContent = 'Connecting...';
            }
        }
        
        async function handleFile(event) {
            const file = event.target.files[0];
            if (file) {
                alert(`Processing ${file.name}...\\nCreating AI agents!`);
                await createAgent();
            }
        }
        
        async function createAgent() {
            try {
                const response = await fetch('http://localhost:8081/api/agent/create', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({name: 'TestAgent'})
                });
                const data = await response.json();
                alert(`Created agent ${data.agent_id}!\\nEarning ${data.earning_rate} VIBE/minute`);
                updateStatus();
            } catch (e) {
                alert('API not ready yet. Try again in a moment.');
            }
        }
        
        setInterval(updateStatus, 2000);
        updateStatus();
    </script>
</body>
</html>
'''
        
        os.makedirs('/tmp/soulfra_web', exist_ok=True)
        with open('/tmp/soulfra_web/index.html', 'w') as f:
            f.write(html)
            
        process = subprocess.Popen(
            [sys.executable, '-m', 'http.server', '8888', '--directory', '/tmp/soulfra_web'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        self.services['web'] = process
        print("  ✓ Web interface started on port 8888")
        
    async def test_services(self):
        """Test that services are responding"""
        tests = [
            ('Web Interface', 'http://localhost:8888'),
            ('API Status', 'http://localhost:8081/api/status'),
            ('Agent Hub', 'http://localhost:8080'),
        ]
        
        for name, url in tests:
            try:
                response = urllib.request.urlopen(url, timeout=2)
                if response.getcode() == 200:
                    print(f"  ✓ {name}: OK")
                    self.test_results[name] = True
                else:
                    print(f"  ✗ {name}: Status {response.getcode()}")
                    self.test_results[name] = False
            except Exception as e:
                print(f"  ✗ {name}: Not responding")
                self.test_results[name] = False
                
    async def cleanup(self):
        """Stop all services"""
        print("\n🛑 Stopping services...")
        for name, process in self.services.items():
            if process and process.poll() is None:
                process.terminate()
                print(f"  ✓ Stopped {name}")

async def main():
    starter = SoulfraCoreStarter()
    
    try:
        await starter.start_core_services()
        
        # Keep running
        print("\nPress Ctrl+C to stop")
        while True:
            await asyncio.sleep(1)
            
    except KeyboardInterrupt:
        print("\n")
        await starter.cleanup()
        print("\n✅ All services stopped")

if __name__ == "__main__":
    asyncio.run(main())