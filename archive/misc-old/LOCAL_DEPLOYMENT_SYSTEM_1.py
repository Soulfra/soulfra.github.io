from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env python3
"""
LOCAL DEPLOYMENT SYSTEM
Deploys and runs all generated components with frontends
"""

import os
import json
import subprocess
import asyncio
from pathlib import Path
from datetime import datetime
import socket
from http.server import HTTPServer, SimpleHTTPRequestHandler
import threading

class LocalDeploymentSystem:
    """Deploys generated components locally with web interfaces"""
    
    def __init__(self):
        self.deployed_services = {}
        self.port_manager = PortManager()
        self.setup_directories()
        
    def setup_directories(self):
        """Create deployment structure"""
        dirs = [
            'deployments/services',
            'deployments/frontends',
            'deployments/apis',
            'deployments/static',
            'deployments/configs'
        ]
        for d in dirs:
            Path(d).mkdir(parents=True, exist_ok=True)
            
    def scan_built_components(self):
        """Find all built components"""
        components = []
        
        # Scan auto_built directory
        auto_built = Path('auto_built')
        if auto_built.exists():
            for file in auto_built.glob('*.py'):
                components.append({
                    'name': file.stem,
                    'path': str(file),
                    'type': 'python_component'
                })
                
        print(f"Found {len(components)} components to deploy")
        return components
        
    def generate_frontend(self, component):
        """Generate web frontend for component"""
        name = component['name']
        
        html = f'''<!DOCTYPE html>
<html>
<head>
    <title>{name} - Soulfra Component</title>
    <style>
        body {{
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }}
        .container {{
            max-width: 800px;
            margin: 0 auto;
            background: rgba(0,0,0,0.7);
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 30px rgba(0,255,255,0.5);
        }}
        h1 {{
            text-align: center;
            color: #00ffff;
            text-shadow: 0 0 10px #00ffff;
            margin-bottom: 30px;
        }}
        .status {{
            background: rgba(0,255,0,0.1);
            border: 1px solid #00ff00;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }}
        .input-section {{
            margin: 20px 0;
        }}
        input, textarea {{
            width: 100%;
            padding: 10px;
            background: rgba(255,255,255,0.1);
            border: 1px solid #00ffff;
            color: white;
            border-radius: 5px;
            font-family: inherit;
        }}
        button {{
            background: linear-gradient(135deg, #00ffff, #0080ff);
            color: black;
            border: none;
            padding: 10px 30px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin: 10px 5px;
            transition: all 0.3s;
        }}
        button:hover {{
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(0,255,255,0.8);
        }}
        .output {{
            background: rgba(0,0,0,0.5);
            border: 1px solid #444;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
        }}
        .emoji {{
            font-size: 24px;
            margin: 0 10px;
        }}
        .pulse {{
            animation: pulse 2s infinite;
        }}
        @keyframes pulse {{
            0% {{ opacity: 1; }}
            50% {{ opacity: 0.5; }}
            100% {{ opacity: 1; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1><span class="emoji">✨</span>{name}<span class="emoji">✨</span></h1>
        
        <div class="status pulse">
            <strong>Status:</strong> <span id="status">Active</span><br>
            <strong>Type:</strong> Auto-generated from whisper<br>
            <strong>API:</strong> <span id="api-url"></span>
        </div>
        
        <div class="input-section">
            <h3>Input Data</h3>
            <textarea id="input-data" rows="5" placeholder="Enter JSON data...">{{
    "test": "data",
    "emotion": "curious"
}}</textarea>
        </div>
        
        <div style="text-align: center;">
            <button onclick="processData()">
                <span class="emoji">🔮</span>Process
            </button>
            <button onclick="getStatus()">
                <span class="emoji">📊</span>Get Status
            </button>
            <button onclick="clearOutput()">
                <span class="emoji">🧹</span>Clear
            </button>
        </div>
        
        <div class="output" id="output">
            Ready to process whispers into reality...
        </div>
    </div>
    
    <script>
        const API_BASE = window.location.origin;
        document.getElementById('api-url').textContent = API_BASE + '/api';
        
        async function processData() {{
            const input = document.getElementById('input-data').value;
            const output = document.getElementById('output');
            
            try {{
                const data = JSON.parse(input);
                output.textContent = 'Processing...';
                
                const response = await fetch(API_BASE + '/api/process', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify(data)
                }});
                
                const result = await response.json();
                output.textContent = JSON.stringify(result, null, 2);
                
            }} catch (error) {{
                output.textContent = 'Error: ' + error.message;
            }}
        }}
        
        async function getStatus() {{
            const output = document.getElementById('output');
            
            try {{
                const response = await fetch(API_BASE + '/api/status');
                const status = await response.json();
                output.textContent = JSON.stringify(status, null, 2);
                
            }} catch (error) {{
                output.textContent = 'Error: ' + error.message;
            }}
        }}
        
        function clearOutput() {{
            document.getElementById('output').textContent = 'Cleared. Ready for new input...';
        }}
        
        // Auto-refresh status
        setInterval(async () => {{
            try {{
                const response = await fetch(API_BASE + '/api/heartbeat');
                const data = await response.json();
                document.getElementById('status').textContent = 
                    data.alive ? 'Active ✅' : 'Inactive ❌';
            }} catch (error) {{
                document.getElementById('status').textContent = 'Offline ❌';
            }}
        }}, 5000);
    </script>
</body>
</html>'''
        
        frontend_path = f'deployments/frontends/{name}.html'
        with open(frontend_path, 'w') as f:
            f.write(html)
            
        return frontend_path
        
    def create_api_wrapper(self, component):
        """Create API wrapper for component"""
        name = component['name']
        path = component['path']
        
        wrapper = f'''#!/usr/bin/env python3
"""
API Wrapper for {name}
Auto-generated by Soulfra Deployment System
"""

import json
import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import importlib.util

# Import the component
spec = importlib.util.spec_from_file_location("{name}", "{path}")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

# Get the main class
ComponentClass = getattr(module, "{name}")
component_instance = ComponentClass()

class APIHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        
        if parsed.path == '/api/status':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            status = component_instance.get_status() if hasattr(component_instance, 'get_status') else {{
                'name': '{name}',
                'active': True,
                'type': 'auto_generated'
            }}
            
            self.wfile.write(json.dumps(status).encode())
            
        elif parsed.path == '/api/heartbeat':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({{'alive': True}}).encode())
            
        elif parsed.path == '/' or parsed.path.endswith('.html'):
            # Serve frontend
            try:
                frontend_path = 'deployments/frontends/{name}.html'
                with open(frontend_path, 'rb') as f:
                    content = f.read()
                self.send_response(200)
                self.send_header('Content-type', 'text/html')
                self.end_headers()
                self.wfile.write(content)
            except:
                self.send_error(404)
                
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/process':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                data = json.loads(post_data)
                result = component_instance.process(data) if hasattr(component_instance, 'process') else {{
                    'error': 'Component does not have process method'
                }}
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({{'error': str(e)}}).encode())
                
    def log_message(self, format, *args):
        pass  # Suppress logs

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    server = HTTPServer(('localhost', port), APIHandler)
    print(f"{name} API running on http://localhost:{{port}}")
    server.serve_forever()
'''
        
        wrapper_path = f'deployments/apis/{name}_api.py'
        with open(wrapper_path, 'w') as f:
            f.write(wrapper)
        os.chmod(wrapper_path, 0o755)
        
        return wrapper_path
        
    async def deploy_component(self, component):
        """Deploy a single component"""
        name = component['name']
        print(f"\n🚀 Deploying {name}...")
        
        # Generate frontend
        frontend_path = self.generate_frontend(component)
        print(f"  ✓ Generated frontend: {frontend_path}")
        
        # Create API wrapper
        api_path = self.create_api_wrapper(component)
        print(f"  ✓ Created API wrapper: {api_path}")
        
        # Get port
        port = self.port_manager.get_port()
        
        # Start service
        process = await asyncio.create_subprocess_exec(
            'python3', api_path, str(port),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        # Wait a moment for startup
        await asyncio.sleep(1)
        
        # Store deployment info
        self.deployed_services[name] = {
            'port': port,
            'process': process,
            'frontend_url': f'http://localhost:{port}',
            'api_url': f'http://localhost:{port}/api',
            'deployed_at': datetime.now().isoformat()
        }
        
        print(f"  ✓ Service running at: http://localhost:{port}")
        
        return self.deployed_services[name]
        
    async def deploy_all(self):
        """Deploy all components"""
        components = self.scan_built_components()
        
        if not components:
            print("No components found to deploy!")
            return
            
        print(f"\n🌟 DEPLOYING {len(components)} COMPONENTS...")
        
        for component in components:
            try:
                await self.deploy_component(component)
            except Exception as e:
                print(f"  ❌ Failed to deploy {component['name']}: {e}")
                
        # Create master dashboard
        self.create_master_dashboard()
        
        print("\n✨ DEPLOYMENT COMPLETE!")
        print("\n📊 Deployed Services:")
        for name, info in self.deployed_services.items():
            print(f"  - {name}: {info['frontend_url']}")
            
    def create_master_dashboard(self):
        """Create dashboard showing all deployed services"""
        services_html = ""
        for name, info in self.deployed_services.items():
            services_html += f'''
            <div class="service-card">
                <h3>{name}</h3>
                <div class="service-info">
                    <p>🌐 <a href="{info['frontend_url']}" target="_blank">Open Frontend</a></p>
                    <p>🔌 API: <code>{info['api_url']}</code></p>
                    <p>🚀 Port: {info['port']}</p>
                    <p>⏰ Deployed: {info['deployed_at']}</p>
                </div>
            </div>
            '''
            
        html = f'''<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Local Deployment Dashboard</title>
    <style>
        body {{
            font-family: monospace;
            background: #0a0a0a;
            color: #00ff00;
            margin: 0;
            padding: 20px;
        }}
        .header {{
            text-align: center;
            margin-bottom: 40px;
        }}
        h1 {{
            color: #00ffff;
            text-shadow: 0 0 20px #00ffff;
        }}
        .services-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }}
        .service-card {{
            background: rgba(0,255,0,0.1);
            border: 2px solid #00ff00;
            padding: 20px;
            border-radius: 10px;
            transition: all 0.3s;
        }}
        .service-card:hover {{
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(0,255,0,0.5);
        }}
        .service-card h3 {{
            color: #ffff00;
            margin-top: 0;
        }}
        .service-info p {{
            margin: 10px 0;
        }}
        a {{
            color: #00ffff;
            text-decoration: none;
        }}
        a:hover {{
            text-decoration: underline;
        }}
        code {{
            background: rgba(255,255,255,0.1);
            padding: 2px 5px;
            border-radius: 3px;
        }}
        .stats {{
            text-align: center;
            margin: 30px 0;
            font-size: 20px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🌟 Soulfra Local Deployment Dashboard 🌟</h1>
        <p>All whispered ideas now running locally</p>
    </div>
    
    <div class="stats">
        Total Services Deployed: {len(self.deployed_services)}
    </div>
    
    <div class="services-grid">
        {services_html}
    </div>
    
    <script>
        // Auto-refresh every 10 seconds
        setTimeout(() => location.reload(), 10000);
    </script>
</body>
</html>'''
        
        with open('deployments/dashboard.html', 'w') as f:
            f.write(html)
            
        # Start dashboard server
        dashboard_port = 9999
        subprocess.Popen([
            'python3', '-m', 'http.server', str(dashboard_port),
            '--directory', 'deployments'
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        print(f"\n🌐 Master Dashboard: http://localhost:{dashboard_port}/dashboard.html")

class PortManager:
    """Manages port allocation"""
    
    def __init__(self):
        self.base_port = 5000
        self.used_ports = set()
        
    def get_port(self):
        """Get next available port"""
        port = self.base_port
        while port in self.used_ports or not self.is_port_free(port):
            port += 1
        self.used_ports.add(port)
        return port
        
    def is_port_free(self, port):
        """Check if port is available"""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('', port))
                return True
        except:
            return False

async def main():
    """Main deployment flow"""
    print("🚀 SOULFRA LOCAL DEPLOYMENT SYSTEM")
    print("=" * 60)
    
    deployer = LocalDeploymentSystem()
    
    # Deploy all components
    await deployer.deploy_all()
    
    print("\n✅ All services deployed!")
    print("   Press Ctrl+C to stop all services")
    
    try:
        # Keep running
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        print("\n\n🛑 Stopping all services...")
        for name, info in deployer.deployed_services.items():
            info['process'].terminate()
        print("✨ All services stopped.")

if __name__ == "__main__":
    # Create launcher
    launcher = '''#!/bin/bash
echo "🚀 SOULFRA LOCAL DEPLOYMENT SYSTEM"
echo ""
echo "This will deploy all generated components with:"
echo "  - Web frontends for each component"
echo "  - REST APIs for interaction"
echo "  - Master dashboard to see everything"
echo ""
echo "Press Enter to deploy all components..."
read

python3 LOCAL_DEPLOYMENT_SYSTEM.py
'''
    
    with open('DEPLOY_ALL_LOCAL.sh', 'w') as f:
        f.write(launcher)
    os.chmod('DEPLOY_ALL_LOCAL.sh', 0o755)
    
    print("Created DEPLOY_ALL_LOCAL.sh")
    print("\nTo deploy all components locally:")
    print("  ./DEPLOY_ALL_LOCAL.sh")
    
    asyncio.run(main())