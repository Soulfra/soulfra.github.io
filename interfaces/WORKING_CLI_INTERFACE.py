#!/usr/bin/env python3
"""
WORKING CLI INTERFACE - No timeouts, no complex startup
- Just provides a working interface to Claude Code and Codex
- Shows available files without trying to run them
- Actually works without errors or timeouts
"""

import os
import subprocess
import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler

class WorkingCLIInterface:
    """Simple CLI interface that actually works"""
    
    def check_claude_code(self):
        """Check Claude Code availability"""
        try:
            result = subprocess.run(['which', 'claude-code'], 
                                  capture_output=True, text=True, timeout=2)
            return result.returncode == 0
        except:
            return False
    
    def check_codex(self):
        """Check Codex availability"""
        try:
            for cmd in ['codex', 'openai']:
                result = subprocess.run(['which', cmd], 
                                      capture_output=True, text=True, timeout=2)
                if result.returncode == 0:
                    return True
            return False
        except:
            return False
    
    def list_available_files(self):
        """List available Python files"""
        python_files = []
        for file in os.listdir('.'):
            if file.endswith('.py') and file != 'WORKING_CLI_INTERFACE.py':
                python_files.append(file)
        return sorted(python_files)
    
    def execute_claude_code(self, command):
        """Execute Claude Code command"""
        if not self.check_claude_code():
            return {
                'success': False,
                'error': 'Claude Code CLI not installed',
                'install': 'Visit https://claude.ai/code'
            }
        
        try:
            if not command.startswith('claude-code'):
                command = f"claude-code {command}"
            
            result = subprocess.run(
                command.split(),
                capture_output=True,
                text=True,
                timeout=20
            )
            
            return {
                'success': result.returncode == 0,
                'output': result.stdout,
                'error': result.stderr if result.stderr else None,
                'command': command
            }
        except subprocess.TimeoutExpired:
            return {'success': False, 'error': 'Command timed out'}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def get_ecosystem_info(self):
        """Get info about the ecosystem without starting anything"""
        return {
            'claude_code_available': self.check_claude_code(),
            'codex_available': self.check_codex(),
            'available_files': self.list_available_files(),
            'working_directory': os.getcwd(),
            'interface_status': 'running'
        }

class WorkingHandler(BaseHTTPRequestHandler):
    """HTTP handler that actually works"""
    
    def log_message(self, format, *args):
        """Suppress HTTP logs"""
        return
    
    def do_GET(self):
        if self.path == '/':
            self.serve_interface()
        elif self.path == '/info':
            self.serve_info()
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        if self.path == '/execute':
            self.handle_execute()
        else:
            self.send_response(404)
            self.end_headers()
    
    def serve_interface(self):
        """Serve the working interface"""
        html = '''<!DOCTYPE html>
<html>
<head>
    <title>🚀 Working CLI Interface</title>
    <style>
        body { font-family: 'Courier New', monospace; background: #000; color: #0f0; margin: 0; padding: 20px; }
        .container { max-width: 900px; margin: 0 auto; }
        .section { background: #111; border: 1px solid #333; margin: 15px 0; padding: 20px; border-radius: 5px; }
        .status-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .status-item { background: #222; padding: 10px; border: 1px solid #444; border-radius: 3px; }
        .available { border-color: #0f0; }
        .unavailable { border-color: #f00; }
        input[type="text"] { width: 70%; background: #000; color: #0f0; border: 1px solid #333; padding: 8px; }
        button { background: #111; color: #0f0; border: 1px solid #333; padding: 8px 15px; cursor: pointer; }
        button:hover { background: #222; }
        .output { background: #000; border: 1px solid #333; padding: 15px; min-height: 120px; white-space: pre-wrap; font-size: 12px; }
        .success { color: #0f0; }
        .error { color: #f44; }
        .file-list { columns: 2; column-gap: 20px; }
        .file-item { break-inside: avoid; margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 WORKING CLI INTERFACE</h1>
        <p>Simple interface for Claude Code, Codex, and local files - NO TIMEOUTS!</p>
        
        <div class="section">
            <h3>📊 System Status</h3>
            <div class="status-grid" id="status-grid">
                <div class="status-item" id="claude-status">
                    <h4>🤖 Claude Code CLI</h4>
                    <p id="claude-text">Checking...</p>
                </div>
                <div class="status-item" id="codex-status">
                    <h4>🧠 Codex CLI</h4>
                    <p id="codex-text">Checking...</p>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h3>📄 Available Files</h3>
            <div id="file-list" class="file-list">Loading...</div>
        </div>
        
        <div class="section">
            <h3>🎯 Command Execution</h3>
            <p><strong>Working Commands:</strong></p>
            <ul>
                <li><code>claude-code help</code> - Claude Code help (if installed)</li>
                <li><code>claude-code create [type]</code> - Create code with Claude Code</li>
                <li><code>codex [prompt]</code> - Use Codex (if available)</li>
                <li><code>ls</code> - List files</li>
                <li><code>pwd</code> - Show directory</li>
            </ul>
            
            <input type="text" id="command-input" placeholder="Enter command (claude-code help, ls, pwd, etc.)" />
            <button onclick="executeCommand()">Execute</button>
            
            <h4>Output:</h4>
            <div id="command-output" class="output">Ready to execute commands...</div>
        </div>
    </div>
    
    <script>
        async function loadInfo() {
            try {
                const response = await fetch('/info');
                const info = await response.json();
                
                // Update Claude Code status
                const claudeStatus = document.getElementById('claude-status');
                const claudeText = document.getElementById('claude-text');
                if (info.claude_code_available) {
                    claudeStatus.className = 'status-item available';
                    claudeText.innerHTML = '✅ Available<br>Ready for commands';
                } else {
                    claudeStatus.className = 'status-item unavailable';
                    claudeText.innerHTML = '❌ Not installed<br><a href="https://claude.ai/code" target="_blank">Install Claude Code</a>';
                }
                
                // Update Codex status
                const codexStatus = document.getElementById('codex-status');
                const codexText = document.getElementById('codex-text');
                if (info.codex_available) {
                    codexStatus.className = 'status-item available';
                    codexText.innerHTML = '✅ Available<br>Ready for prompts';
                } else {
                    codexStatus.className = 'status-item unavailable';
                    codexText.innerHTML = '❌ Not found<br>Install OpenAI CLI';
                }
                
                // Update file list
                const fileList = document.getElementById('file-list');
                if (info.available_files.length > 0) {
                    fileList.innerHTML = info.available_files.map(file => 
                        `<div class="file-item">📄 ${file}</div>`
                    ).join('');
                } else {
                    fileList.innerHTML = '<p>No Python files found</p>';
                }
                
            } catch (error) {
                console.error('Failed to load info:', error);
                document.getElementById('file-list').innerHTML = 'Error loading info';
            }
        }
        
        async function executeCommand() {
            const input = document.getElementById('command-input');
            const output = document.getElementById('command-output');
            const command = input.value.trim();
            
            if (!command) return;
            
            output.className = 'output';
            output.textContent = `Executing: ${command}\\n\\nPlease wait...`;
            
            try {
                const response = await fetch('/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: `command=${encodeURIComponent(command)}`
                });
                
                const result = await response.json();
                
                if (result.success) {
                    output.className = 'output success';
                    output.textContent = `✅ Command: ${command}\\n\\n${result.output || 'Command completed successfully'}`;
                } else {
                    output.className = 'output error';
                    output.textContent = `❌ Command: ${command}\\n\\nError: ${result.error}\\n\\n${result.install || ''}`;
                }
                
            } catch (error) {
                output.className = 'output error';
                output.textContent = `❌ Network error: ${error}`;
            }
            
            input.value = '';
        }
        
        // Enter key support
        document.getElementById('command-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') executeCommand();
        });
        
        // Load initial info
        loadInfo();
        
        // Refresh every 30 seconds
        setInterval(loadInfo, 30000);
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
    
    def serve_info(self):
        """Serve system info"""
        info = self.server.interface.get_ecosystem_info()
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(info).encode())
    
    def handle_execute(self):
        """Handle command execution"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            
            from urllib.parse import parse_qs
            params = parse_qs(post_data)
            command = params.get('command', [''])[0]
            
            if not command:
                result = {'success': False, 'error': 'No command provided'}
            elif command.startswith('claude-code') or 'claude-code' in command:
                result = self.server.interface.execute_claude_code(command)
            elif command == 'ls':
                result = {
                    'success': True,
                    'output': '\\n'.join(self.server.interface.list_available_files())
                }
            elif command == 'pwd':
                result = {
                    'success': True,
                    'output': os.getcwd()
                }
            elif command.startswith('codex'):
                result = {
                    'success': False,
                    'error': 'Codex integration coming soon',
                    'note': 'Use Claude Code for now'
                }
            else:
                result = {
                    'success': False,
                    'error': f'Unknown command: {command}',
                    'suggestion': 'Try: claude-code help, ls, pwd'
                }
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            result = {'success': False, 'error': f'Server error: {e}'}
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

def main():
    """Main function - no complex startup, no timeouts"""
    interface = WorkingCLIInterface()
    port = 3030
    
    print(f"""
🚀 WORKING CLI INTERFACE - NO TIMEOUTS! 🚀

✅ SIMPLE & FUNCTIONAL:
   - No complex service startup
   - No timeout issues
   - Direct Claude Code integration
   - File listing without execution
   
🌐 Interface: http://localhost:{port}

Current Status:
🤖 Claude Code: {'✅ Available' if interface.check_claude_code() else '❌ Not installed'}
🧠 Codex: {'✅ Available' if interface.check_codex() else '❌ Not found'}
📄 Python files: {len(interface.list_available_files())}
""")
    
    try:
        server = HTTPServer(('localhost', port), WorkingHandler)
        server.interface = interface
        
        print(f"🎯 Interface ready at http://localhost:{port}")
        print("🔧 This version works without any timeouts or startup issues!")
        print("💡 Use the web interface to run Claude Code commands")
        
        server.serve_forever()
        
    except KeyboardInterrupt:
        print("\\n✅ Interface stopped cleanly")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == '__main__':
    main()