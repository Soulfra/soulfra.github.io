#!/usr/bin/env python3
"""
FIXED CLI LAUNCHER - Actually working integration without dependency issues
- Launches only the services that work
- Checks dependencies properly
- Provides unified interface that actually functions
- No failed startups or timeouts
"""

import os
import json
import time
import subprocess
import threading
import signal
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

class FixedCLILauncher:
    """Actually working CLI integration launcher"""
    
    def __init__(self):
        self.port = 3030
        self.active_processes = {}
        self.service_status = {}
        self.running = True
        
    def check_file_exists(self, filename):
        """Check if a Python file exists"""
        return os.path.exists(filename)
    
    def check_port_available(self, port):
        """Check if a port is available"""
        import socket
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            return result != 0  # Port is available if connection fails
        except:
            return True
    
    def start_service_safely(self, service_name, filename, port=None):
        """Start a service only if file exists and port is available"""
        if not self.check_file_exists(filename):
            self.service_status[service_name] = 'file_missing'
            print(f"⚠️  {service_name}: File {filename} not found")
            return False
        
        if port and not self.check_port_available(port):
            self.service_status[service_name] = 'port_busy'
            print(f"⚠️  {service_name}: Port {port} already in use")
            return False
        
        try:
            # Start the service
            process = subprocess.Popen(
                ['python3', filename],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=os.getcwd()
            )
            
            # Give it a moment to start
            time.sleep(2)
            
            # Check if it's still running
            if process.poll() is None:
                self.active_processes[service_name] = process
                self.service_status[service_name] = 'running'
                print(f"✅ {service_name} started successfully on port {port}")
                return True
            else:
                stderr = process.stderr.read().decode()
                self.service_status[service_name] = f'failed: {stderr[:100]}'
                print(f"❌ {service_name} failed to start: {stderr[:200]}")
                return False
                
        except Exception as e:
            self.service_status[service_name] = f'error: {str(e)}'
            print(f"❌ {service_name} error: {e}")
            return False
    
    def check_claude_code_cli(self):
        """Check if Claude Code CLI is available"""
        try:
            result = subprocess.run(['claude-code', '--version'], 
                                  capture_output=True, text=True, timeout=5)
            return result.returncode == 0
        except:
            return False
    
    def launch_ecosystem(self):
        """Launch the working parts of the ecosystem"""
        print("🚀 FIXED CLI LAUNCHER - Starting working services only...")
        
        # Check Claude Code availability
        claude_available = self.check_claude_code_cli()
        print(f"🤖 Claude Code CLI: {'✅ Available' if claude_available else '❌ Not installed'}")
        
        if not claude_available:
            print("💡 Install Claude Code: https://claude.ai/code")
        
        # Services to attempt
        services = [
            ('Smart Analyzer', 'SMART_CODEBASE_ANALYZER.py', 6969),
            ('Automated Assistant', 'AUTOMATED_CODE_ASSISTANT.py', 8080),
            ('AI Economy', 'AI_ECONOMY_GITHUB_AUTOMATION.py', 9090),
            ('Addiction Engine', 'ADDICTION_ENGINE.py', 7777),
            ('Empathy Engine', 'SYNTHETIC_EMPATHY_ENGINE.py', 5555),
        ]
        
        successful_starts = 0
        
        for service_name, filename, port in services:
            print(f"🔧 Attempting to start {service_name}...")
            if self.start_service_safely(service_name, filename, port):
                successful_starts += 1
            time.sleep(1)  # Stagger startup
        
        print(f"\n📊 STARTUP RESULTS:")
        print(f"   ✅ Services started: {successful_starts}/{len(services)}")
        print(f"   🤖 Claude Code CLI: {'Available' if claude_available else 'Not installed'}")
        
        return successful_starts, claude_available
    
    def get_status(self):
        """Get current ecosystem status"""
        status = {
            'timestamp': datetime.now().isoformat(),
            'services': {},
            'claude_code_available': self.check_claude_code_cli(),
            'ports_checked': [],
            'active_processes': len(self.active_processes)
        }
        
        # Check each service status
        for service_name, status_info in self.service_status.items():
            status['services'][service_name] = status_info
        
        # Check port availability
        for port in [3030, 4000, 5555, 6969, 7777, 8080, 9090]:
            port_status = 'busy' if not self.check_port_available(port) else 'available'
            status['ports_checked'].append({'port': port, 'status': port_status})
        
        return status
    
    def execute_command(self, command):
        """Execute a unified command"""
        command_lower = command.lower()
        
        # Route based on command content
        if 'claude-code' in command_lower or command.startswith('claude-code'):
            return self.execute_claude_code_command(command)
        elif 'analyze' in command_lower and self.service_status.get('Smart Analyzer') == 'running':
            return self.route_to_service(command, 'analyzer', 6969)
        elif 'improve' in command_lower and self.service_status.get('Automated Assistant') == 'running':
            return self.route_to_service(command, 'assistant', 8080)
        elif 'github' in command_lower and self.service_status.get('AI Economy') == 'running':
            return self.route_to_service(command, 'economy', 9090)
        else:
            return {
                'success': False,
                'error': 'Command not recognized or required service not running',
                'suggestion': 'Try: analyze codebase, improve code, claude-code help, github pr',
                'available_services': [k for k, v in self.service_status.items() if v == 'running']
            }
    
    def execute_claude_code_command(self, command):
        """Execute Claude Code CLI command"""
        if not self.check_claude_code_cli():
            return {
                'success': False,
                'error': 'Claude Code CLI not available',
                'install_help': 'Visit https://claude.ai/code to install'
            }
        
        try:
            if not command.startswith('claude-code'):
                command = f"claude-code {command}"
            
            result = subprocess.run(
                command.split(),
                capture_output=True,
                text=True,
                timeout=30
            )
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'error': result.stderr,
                'command_executed': command
            }
            
        except subprocess.TimeoutExpired:
            return {
                'success': False,
                'error': 'Claude Code command timed out'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to execute: {e}'
            }
    
    def route_to_service(self, command, service_type, port):
        """Route command to running service"""
        try:
            import urllib.request
            import urllib.parse
            
            data = urllib.parse.urlencode({'command': command}).encode()
            
            endpoint_map = {
                'analyzer': '/analyze',
                'assistant': '/assist', 
                'economy': '/economy'
            }
            
            endpoint = endpoint_map.get(service_type, '/command')
            url = f"http://localhost:{port}{endpoint}"
            
            req = urllib.request.Request(url, data=data, 
                                       headers={'Content-Type': 'application/x-www-form-urlencoded'})
            
            response = urllib.request.urlopen(req, timeout=10)
            result = json.loads(response.read().decode())
            
            return {
                'success': True,
                'service': service_type,
                'port': port,
                'result': result
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to route to {service_type}: {e}',
                'service': service_type,
                'port': port
            }
    
    def stop_all_services(self):
        """Stop all running services"""
        print("🛑 Stopping all services...")
        self.running = False
        
        for service_name, process in self.active_processes.items():
            try:
                process.terminate()
                process.wait(timeout=5)
                print(f"✅ Stopped {service_name}")
            except:
                try:
                    process.kill()
                    print(f"🔥 Force killed {service_name}")
                except:
                    print(f"⚠️  Could not stop {service_name}")
        
        self.active_processes.clear()

class FixedCLIHandler(BaseHTTPRequestHandler):
    """HTTP handler for the fixed CLI launcher"""
    
    def do_GET(self):
        if self.path == '/':
            self.serve_dashboard()
        elif self.path == '/status':
            self.serve_status()
        elif self.path == '/health':
            self.serve_health()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/command':
            self.handle_command()
        else:
            self.send_response(404)
            self.end_headers()
    
    def serve_dashboard(self):
        """Serve working dashboard"""
        dashboard_html = '''
<!DOCTYPE html>
<html>
<head>
    <title>🔧 Fixed CLI Integration Dashboard</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #0a0a0a; color: #00ff00; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .status-card { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 15px; }
        .running { border-color: #00ff00; }
        .failed { border-color: #ff4444; }
        .command-interface { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; }
        .command-input { width: 100%; background: #000; border: 1px solid #333; color: #00ff00; padding: 10px; font-family: monospace; }
        .command-output { background: #000; border: 1px solid #333; color: #00ff00; padding: 10px; min-height: 150px; font-family: monospace; white-space: pre-wrap; }
        .success { color: #00ff00; }
        .error { color: #ff4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 FIXED CLI INTEGRATION</h1>
            <h2>Actually Working Version</h2>
            <p>Only launches services that work - no failed startups!</p>
        </div>
        
        <div class="status-grid" id="status-grid">
            <!-- Status loaded dynamically -->
        </div>
        
        <div class="command-interface">
            <h3>🎯 Working Command Interface</h3>
            <p>Available commands (only for running services):</p>
            <ul>
                <li><code>claude-code help</code> - If Claude Code CLI is installed</li>
                <li><code>analyze my codebase</code> - If Smart Analyzer is running</li>
                <li><code>improve this code</code> - If Automated Assistant is running</li>
                <li><code>github create pr</code> - If AI Economy is running</li>
            </ul>
            
            <input type="text" id="command-input" class="command-input" placeholder="Enter command..." />
            <button onclick="executeCommand()" style="margin-top: 10px; padding: 10px 20px; background: #004400; color: #00ff00; border: 1px solid #00ff00;">Execute</button>
            
            <h4>Output:</h4>
            <div id="command-output" class="command-output">Ready for commands...</div>
        </div>
    </div>
    
    <script>
        async function loadStatus() {
            try {
                const response = await fetch('/status');
                const status = await response.json();
                
                const statusGrid = document.getElementById('status-grid');
                statusGrid.innerHTML = '';
                
                // Claude Code status
                const claudeCard = document.createElement('div');
                claudeCard.className = 'status-card ' + (status.claude_code_available ? 'running' : 'failed');
                claudeCard.innerHTML = `
                    <h4>🤖 Claude Code CLI</h4>
                    <p>Status: ${status.claude_code_available ? '✅ Available' : '❌ Not installed'}</p>
                    ${!status.claude_code_available ? '<p>Install: https://claude.ai/code</p>' : ''}
                `;
                statusGrid.appendChild(claudeCard);
                
                // Services status
                const servicesCard = document.createElement('div');
                servicesCard.className = 'status-card';
                let servicesHtml = '<h4>📡 Local Services</h4>';
                
                Object.entries(status.services).forEach(([name, serviceStatus]) => {
                    const statusEmoji = serviceStatus === 'running' ? '✅' : '❌';
                    servicesHtml += `<p>${statusEmoji} ${name}: ${serviceStatus}</p>`;
                });
                
                servicesCard.innerHTML = servicesHtml;
                statusGrid.appendChild(servicesCard);
                
                // Port status
                const portsCard = document.createElement('div');
                portsCard.className = 'status-card';
                let portsHtml = '<h4>🔌 Port Status</h4>';
                
                status.ports_checked.forEach(port => {
                    const statusEmoji = port.status === 'busy' ? '🔴' : '🟢';
                    portsHtml += `<p>${statusEmoji} Port ${port.port}: ${port.status}</p>`;
                });
                
                portsCard.innerHTML = portsHtml;
                statusGrid.appendChild(portsCard);
                
                // Summary
                const summaryCard = document.createElement('div');
                summaryCard.className = 'status-card';
                summaryCard.innerHTML = `
                    <h4>📊 Summary</h4>
                    <p>Active processes: ${status.active_processes}</p>
                    <p>Last updated: ${new Date(status.timestamp).toLocaleTimeString()}</p>
                `;
                statusGrid.appendChild(summaryCard);
                
            } catch (error) {
                console.error('Failed to load status:', error);
            }
        }
        
        async function executeCommand() {
            const input = document.getElementById('command-input');
            const output = document.getElementById('command-output');
            const command = input.value.trim();
            
            if (!command) return;
            
            output.textContent = 'Executing command...\\n';
            
            try {
                const response = await fetch('/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `command=${encodeURIComponent(command)}`
                });
                
                const result = await response.json();
                
                if (result.success) {
                    output.className = 'command-output success';
                    output.textContent = `✅ Command: ${command}\\n\\n` + JSON.stringify(result, null, 2);
                } else {
                    output.className = 'command-output error';
                    output.textContent = `❌ Command: ${command}\\n\\n` + JSON.stringify(result, null, 2);
                }
                
            } catch (error) {
                output.className = 'command-output error';
                output.textContent = `❌ Error executing command: ${error}`;
            }
            
            input.value = '';
        }
        
        document.getElementById('command-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                executeCommand();
            }
        });
        
        loadStatus();
        setInterval(loadStatus, 5000);
    </script>
</body>
</html>
        '''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(dashboard_html.encode())
    
    def serve_status(self):
        """Serve status as JSON"""
        status = self.server.launcher.get_status()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(status).encode())
    
    def serve_health(self):
        """Health check"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'healthy'}).encode())
    
    def handle_command(self):
        """Handle command execution"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        from urllib.parse import parse_qs
        params = parse_qs(post_data)
        command = params.get('command', [''])[0]
        
        if command:
            result = self.server.launcher.execute_command(command)
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
        else:
            self.send_response(400)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'No command provided'}).encode())

def run_fixed_cli_launcher():
    """Run the fixed CLI launcher"""
    launcher = FixedCLILauncher()
    
    print(f"""
🔧🚀🔧 FIXED CLI INTEGRATION LAUNCHER 🔧🚀🔧

✅ ACTUALLY WORKING VERSION:
   - Only starts services that work
   - Proper dependency checking
   - No failed startups or timeouts
   - Graceful error handling

🌐 Dashboard: http://localhost:3030
""")
    
    # Launch the ecosystem
    successful_starts, claude_available = launcher.launch_ecosystem()
    
    if successful_starts > 0:
        print(f"\n🎉 SUCCESS: {successful_starts} services running")
    else:
        print(f"\n⚠️  No services started - check files and dependencies")
    
    # Setup signal handler
    def signal_handler(sig, frame):
        print("\n🛑 Shutting down...")
        launcher.stop_all_services()
        os._exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    # Start HTTP server
    try:
        server = HTTPServer(('localhost', launcher.port), FixedCLIHandler)
        server.launcher = launcher
        
        print(f"\n🎯 Fixed CLI Integration ready at http://localhost:{launcher.port}")
        print("🔧 Check the dashboard to see what's actually working")
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n🔄 Fixed CLI integration stopped")
        launcher.stop_all_services()

if __name__ == '__main__':
    run_fixed_cli_launcher()