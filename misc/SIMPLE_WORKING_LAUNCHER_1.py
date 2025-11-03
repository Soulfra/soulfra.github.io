#!/usr/bin/env python3
"""
SIMPLE WORKING LAUNCHER - Actually works without errors
- Minimal dependencies
- No complex startup issues  
- Shows what's actually available
- Integrates with Claude Code if installed
"""

import os
import subprocess
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

class SimpleWorkingLauncher:
    """Simple launcher that actually works"""
    
    def __init__(self):
        self.port = 3030
    
    def check_claude_code(self):
        """Check if Claude Code CLI is available"""
        try:
            result = subprocess.run(['claude-code', '--version'], 
                                  capture_output=True, text=True, timeout=3)
            return result.returncode == 0
        except:
            return False
    
    def check_file_exists(self, filename):
        """Check if file exists"""
        return os.path.exists(filename)
    
    def get_available_services(self):
        """Get list of available services"""
        services = [
            'SMART_CODEBASE_ANALYZER.py',
            'AUTOMATED_CODE_ASSISTANT.py', 
            'AI_ECONOMY_GITHUB_AUTOMATION.py',
            'ADDICTION_ENGINE.py',
            'SYNTHETIC_EMPATHY_ENGINE.py',
            'CLAUDE_CODE_INTEGRATION.py'
        ]
        
        available = []
        for service in services:
            if self.check_file_exists(service):
                available.append(service)
        
        return available
    
    def execute_claude_command(self, command):
        """Execute Claude Code command if available"""
        if not self.check_claude_code():
            return {
                'success': False,
                'error': 'Claude Code CLI not installed',
                'install_url': 'https://claude.ai/code'
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
                'command': command
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_status(self):
        """Get simple status"""
        return {
            'claude_code_available': self.check_claude_code(),
            'available_services': self.get_available_services(),
            'working_directory': os.getcwd(),
            'launcher_status': 'running'
        }

class SimpleHandler(BaseHTTPRequestHandler):
    """Simple HTTP handler"""
    
    def do_GET(self):
        if self.path == '/':
            self.serve_simple_dashboard()
        elif self.path == '/status':
            self.serve_status()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/command':
            self.handle_command()
        else:
            self.send_response(404)
            self.end_headers()
    
    def serve_simple_dashboard(self):
        """Serve simple working dashboard"""
        html = '''
<!DOCTYPE html>
<html>
<head>
    <title>🚀 Simple Working CLI Integration</title>
    <style>
        body { font-family: monospace; background: #000; color: #0f0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #111; padding: 15px; margin: 10px 0; border: 1px solid #333; }
        .command-area { background: #111; padding: 15px; margin: 10px 0; border: 1px solid #333; }
        input, button { background: #000; color: #0f0; border: 1px solid #333; padding: 8px; }
        .output { background: #000; border: 1px solid #333; padding: 10px; min-height: 100px; white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SIMPLE WORKING CLI INTEGRATION</h1>
        <p>Actually functional version - no errors!</p>
        
        <div class="status" id="status">
            <h3>📊 Status</h3>
            <div id="status-content">Loading...</div>
        </div>
        
        <div class="command-area">
            <h3>🎯 Command Interface</h3>
            <p>Available commands:</p>
            <ul>
                <li><code>help</code> - Show help</li>
                <li><code>status</code> - Show status</li>
                <li><code>list files</code> - List available services</li>
                <li><code>claude-code [command]</code> - Use Claude Code (if installed)</li>
            </ul>
            
            <input type="text" id="cmd" placeholder="Enter command..." style="width: 70%;" />
            <button onclick="runCommand()" style="width: 25%;">Execute</button>
            
            <h4>Output:</h4>
            <div id="output" class="output">Ready...</div>
        </div>
    </div>
    
    <script>
        async function loadStatus() {
            try {
                const response = await fetch('/status');
                const status = await response.json();
                
                let html = `
                    <p>🤖 Claude Code CLI: ${status.claude_code_available ? '✅ Available' : '❌ Not installed'}</p>
                    <p>📁 Working Directory: ${status.working_directory}</p>
                    <p>📄 Available Services: ${status.available_services.length}</p>
                    <ul>
                `;
                
                status.available_services.forEach(service => {
                    html += `<li>✅ ${service}</li>`;
                });
                
                html += '</ul>';
                
                if (!status.claude_code_available) {
                    html += '<p>💡 Install Claude Code: <a href="https://claude.ai/code" target="_blank">https://claude.ai/code</a></p>';
                }
                
                document.getElementById('status-content').innerHTML = html;
                
            } catch (error) {
                document.getElementById('status-content').innerHTML = `❌ Error loading status: ${error}`;
            }
        }
        
        async function runCommand() {
            const cmd = document.getElementById('cmd').value.trim();
            const output = document.getElementById('output');
            
            if (!cmd) return;
            
            output.textContent = 'Executing...';
            
            try {
                const response = await fetch('/command', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `command=${encodeURIComponent(cmd)}`
                });
                
                const result = await response.json();
                output.textContent = JSON.stringify(result, null, 2);
                
            } catch (error) {
                output.textContent = `Error: ${error}`;
            }
            
            document.getElementById('cmd').value = '';
        }
        
        document.getElementById('cmd').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') runCommand();
        });
        
        loadStatus();
        setInterval(loadStatus, 10000);
    </script>
</body>
</html>
        '''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_status(self):
        """Serve status"""
        status = self.server.launcher.get_status()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(status).encode())
    
    def handle_command(self):
        """Handle command"""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        from urllib.parse import parse_qs
        params = parse_qs(post_data)
        command = params.get('command', [''])[0]
        
        if not command:
            result = {'error': 'No command provided'}
        elif command == 'help':
            result = {
                'success': True,
                'help': [
                    'Available commands:',
                    '• help - Show this help',
                    '• status - Show system status', 
                    '• list files - List available services',
                    '• claude-code [command] - Use Claude Code CLI'
                ]
            }
        elif command == 'status':
            result = self.server.launcher.get_status()
        elif command == 'list files':
            result = {
                'success': True,
                'available_services': self.server.launcher.get_available_services()
            }
        elif 'claude-code' in command:
            result = self.server.launcher.execute_claude_command(command)
        else:
            result = {
                'success': False,
                'error': f'Unknown command: {command}',
                'suggestion': 'Try: help, status, list files, or claude-code [command]'
            }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(result).encode())

def main():
    """Main function"""
    launcher = SimpleWorkingLauncher()
    
    print(f"""
🚀 SIMPLE WORKING CLI INTEGRATION LAUNCHER 🚀

✅ ACTUALLY WORKS:
   - No complex dependencies
   - No startup errors
   - Shows what's available
   - Integrates with Claude Code if installed

🌐 Dashboard: http://localhost:3030

Status:
🤖 Claude Code CLI: {'✅ Available' if launcher.check_claude_code() else '❌ Not installed'}
📄 Available services: {len(launcher.get_available_services())}
""")
    
    try:
        server = HTTPServer(('localhost', launcher.port), SimpleHandler)
        server.launcher = launcher
        
        print(f"🎯 Simple CLI Integration running at http://localhost:{launcher.port}")
        print("🔧 This version actually works without errors!")
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\n✅ Simple CLI integration stopped")

if __name__ == '__main__':
    main()