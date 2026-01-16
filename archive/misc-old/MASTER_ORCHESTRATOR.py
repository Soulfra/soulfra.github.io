#!/usr/bin/env python3
"""
MASTER ORCHESTRATOR - The brain that connects all your AI tools
Controls Claude, ChatGPT, Google Drive, Cursor, etc. from one place
"""

import os
import json
import asyncio
import sqlite3
import subprocess
import threading
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import aiohttp
from aiohttp import web
import socket
import qrcode
import io
import base64

class AIOrchestrator:
    """Master controller for all AI services"""
    
    def __init__(self):
        self.port = 8080  # Phone-friendly port
        self.services = {}
        self.active_connections = {}
        self.command_queue = asyncio.Queue()
        self.ollama_url = "http://localhost:11434"
        self.setup_database()
        self.discover_services()
        
    def setup_database(self):
        """Initialize orchestrator database"""
        self.db = sqlite3.connect('ai_orchestrator.db', check_same_thread=False)
        
        # Service registry
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS services (
                id TEXT PRIMARY KEY,
                name TEXT,
                type TEXT,
                status TEXT,
                endpoint TEXT,
                last_ping TIMESTAMP,
                capabilities TEXT
            )
        ''')
        
        # Command history
        self.db.execute('''
            CREATE TABLE IF NOT EXISTS commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                source TEXT,
                target_service TEXT,
                command TEXT,
                response TEXT,
                status TEXT
            )
        ''')
        
        self.db.commit()
        
    def discover_services(self):
        """Find all available services"""
        self.services = {
            'ollama': {
                'name': 'Ollama Local AI',
                'type': 'ai',
                'endpoint': 'http://localhost:11434',
                'status': self.check_ollama(),
                'capabilities': ['chat', 'completion', 'embedding']
            },
            'claude_desktop': {
                'name': 'Claude Desktop',
                'type': 'desktop_app',
                'status': self.check_claude_desktop(),
                'capabilities': ['chat', 'code', 'analysis']
            },
            'chatgpt_desktop': {
                'name': 'ChatGPT Desktop',
                'type': 'desktop_app',
                'status': self.check_chatgpt_desktop(),
                'capabilities': ['chat', 'image', 'browsing']
            },
            'google_drive': {
                'name': 'Google Drive',
                'type': 'cloud_storage',
                'status': self.check_google_drive(),
                'capabilities': ['read', 'write', 'search']
            },
            'cursor': {
                'name': 'Cursor IDE',
                'type': 'ide',
                'status': self.check_cursor(),
                'capabilities': ['edit', 'run', 'debug']
            },
            'claude_cli': {
                'name': 'Claude CLI',
                'type': 'cli',
                'status': self.check_claude_cli(),
                'capabilities': ['code', 'chat', 'file_ops']
            }
        }
        
    def check_ollama(self) -> str:
        """Check if Ollama is running"""
        try:
            import requests
            resp = requests.get(f"{self.ollama_url}/api/tags", timeout=2)
            return "online" if resp.status_code == 200 else "offline"
        except:
            return "offline"
            
    def check_claude_desktop(self) -> str:
        """Check if Claude desktop app is running"""
        try:
            # macOS check
            result = subprocess.run(['pgrep', '-f', 'Claude'], capture_output=True)
            return "online" if result.returncode == 0 else "offline"
        except:
            return "unknown"
            
    def check_chatgpt_desktop(self) -> str:
        """Check if ChatGPT desktop app is running"""
        try:
            # macOS check
            result = subprocess.run(['pgrep', '-f', 'ChatGPT'], capture_output=True)
            return "online" if result.returncode == 0 else "offline"
        except:
            return "unknown"
            
    def check_google_drive(self) -> str:
        """Check Google Drive availability"""
        # Check for credentials file
        creds_path = Path.home() / '.credentials' / 'google_drive.json'
        return "configured" if creds_path.exists() else "not_configured"
        
    def check_cursor(self) -> str:
        """Check if Cursor is running"""
        try:
            result = subprocess.run(['pgrep', '-f', 'Cursor'], capture_output=True)
            return "online" if result.returncode == 0 else "offline"
        except:
            return "unknown"
            
    def check_claude_cli(self) -> str:
        """Check if Claude CLI is available"""
        try:
            result = subprocess.run(['which', 'claude'], capture_output=True)
            return "available" if result.returncode == 0 else "not_installed"
        except:
            return "unknown"
            
    async def process_command(self, command: Dict[str, Any]) -> Dict[str, Any]:
        """Process a command from the phone interface"""
        source = command.get('source', 'phone')
        action = command.get('action')
        target = command.get('target')
        data = command.get('data', {})
        
        # Log command
        cursor = self.db.cursor()
        cursor.execute('''
            INSERT INTO commands (source, target_service, command, status)
            VALUES (?, ?, ?, ?)
        ''', (source, target, json.dumps(command), 'processing'))
        command_id = cursor.lastrowid
        self.db.commit()
        
        try:
            # Route to appropriate handler
            if target == 'ollama':
                result = await self.handle_ollama_command(action, data)
            elif target == 'claude_desktop':
                result = await self.handle_claude_desktop(action, data)
            elif target == 'chatgpt_desktop':
                result = await self.handle_chatgpt_desktop(action, data)
            elif target == 'google_drive':
                result = await self.handle_google_drive(action, data)
            elif target == 'cursor':
                result = await self.handle_cursor(action, data)
            elif target == 'claude_cli':
                result = await self.handle_claude_cli(action, data)
            else:
                result = {'error': f'Unknown target: {target}'}
                
            # Update command status
            cursor.execute('''
                UPDATE commands 
                SET response = ?, status = ?
                WHERE id = ?
            ''', (json.dumps(result), 'completed', command_id))
            self.db.commit()
            
            return result
            
        except Exception as e:
            error_result = {'error': str(e)}
            cursor.execute('''
                UPDATE commands 
                SET response = ?, status = ?
                WHERE id = ?
            ''', (json.dumps(error_result), 'failed', command_id))
            self.db.commit()
            return error_result
            
    async def handle_ollama_command(self, action: str, data: Dict) -> Dict:
        """Handle Ollama commands"""
        if action == 'chat':
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.ollama_url}/api/generate",
                    json={
                        'model': data.get('model', 'llama2'),
                        'prompt': data.get('prompt'),
                        'stream': False
                    }
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        return {'response': result.get('response')}
                    else:
                        return {'error': f'Ollama error: {resp.status}'}
                        
    async def handle_claude_desktop(self, action: str, data: Dict) -> Dict:
        """Handle Claude Desktop automation"""
        if action == 'send_message':
            # This would use AppleScript or similar to control Claude
            script = f'''
            tell application "Claude"
                activate
                delay 1
                tell application "System Events"
                    keystroke "{data.get('message', '')}"
                    key code 36  -- Enter key
                end tell
            end tell
            '''
            
            try:
                result = subprocess.run(['osascript', '-e', script], 
                                      capture_output=True, text=True)
                return {'status': 'sent', 'output': result.stdout}
            except Exception as e:
                return {'error': str(e)}
                
    async def handle_google_drive(self, action: str, data: Dict) -> Dict:
        """Handle Google Drive operations"""
        # This would integrate with Google Drive API
        return {'status': 'not_implemented', 'action': action}
        
    async def handle_cursor(self, action: str, data: Dict) -> Dict:
        """Handle Cursor IDE automation"""
        if action == 'open_file':
            try:
                subprocess.run(['cursor', data.get('file_path', '')])
                return {'status': 'opened'}
            except Exception as e:
                return {'error': str(e)}
                
    async def handle_claude_cli(self, action: str, data: Dict) -> Dict:
        """Handle Claude CLI commands"""
        if action == 'run_command':
            try:
                result = subprocess.run(
                    ['claude', data.get('command', '')],
                    capture_output=True,
                    text=True
                )
                return {
                    'output': result.stdout,
                    'error': result.stderr,
                    'returncode': result.returncode
                }
            except Exception as e:
                return {'error': str(e)}
                
    async def handle_chatgpt_desktop(self, action: str, data: Dict) -> Dict:
        """Handle ChatGPT Desktop automation"""
        # Similar to Claude Desktop
        return {'status': 'not_implemented', 'action': action}
        
    def get_phone_interface(self) -> str:
        """Generate the phone-friendly web interface"""
        return '''<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>AI Control Center</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #fff;
            padding: 1rem;
            max-width: 100vw;
            overflow-x: hidden;
        }
        
        .header {
            text-align: center;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 1rem;
        }
        
        .services {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .service {
            background: #1a1a1a;
            padding: 1rem;
            border-radius: 0.5rem;
            text-align: center;
            border: 2px solid #333;
            transition: all 0.3s;
        }
        
        .service.online {
            border-color: #00ff88;
        }
        
        .service.offline {
            border-color: #ff4444;
            opacity: 0.6;
        }
        
        .status-dot {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-left: 0.5rem;
        }
        
        .status-dot.online { background: #00ff88; }
        .status-dot.offline { background: #ff4444; }
        
        .quick-actions {
            background: #1a1a1a;
            padding: 1.5rem;
            border-radius: 1rem;
            margin-bottom: 2rem;
        }
        
        .action-btn {
            display: block;
            width: 100%;
            padding: 1rem;
            margin: 0.5rem 0;
            background: #333;
            border: none;
            border-radius: 0.5rem;
            color: #fff;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .action-btn:active {
            transform: scale(0.98);
            background: #444;
        }
        
        .chat-area {
            background: #1a1a1a;
            padding: 1rem;
            border-radius: 1rem;
            min-height: 200px;
            margin-bottom: 1rem;
        }
        
        .input-area {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .input-area input {
            flex: 1;
            padding: 1rem;
            background: #333;
            border: none;
            border-radius: 0.5rem;
            color: #fff;
            font-size: 1rem;
        }
        
        .input-area button {
            padding: 1rem 1.5rem;
            background: #667eea;
            border: none;
            border-radius: 0.5rem;
            color: #fff;
            font-size: 1rem;
            cursor: pointer;
        }
        
        .output {
            background: #0a0a0a;
            padding: 1rem;
            border-radius: 0.5rem;
            font-family: monospace;
            font-size: 0.9rem;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
        }
        
        @media (max-width: 600px) {
            .services {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 AI Control Center</h1>
        <p>Control all your AI tools from anywhere</p>
    </div>
    
    <div class="services" id="services">
        <!-- Services will be populated here -->
    </div>
    
    <div class="quick-actions">
        <h3>Quick Actions</h3>
        <button class="action-btn" onclick="quickAction('ask_all')">
            🤖 Ask All AIs
        </button>
        <button class="action-btn" onclick="quickAction('sync_files')">
            📁 Sync with Google Drive
        </button>
        <button class="action-btn" onclick="quickAction('open_cursor')">
            💻 Open in Cursor
        </button>
        <button class="action-btn" onclick="quickAction('generate_code')">
            🚀 Generate Code
        </button>
    </div>
    
    <div class="chat-area">
        <h3>Command Input</h3>
        <div class="input-area">
            <input type="text" id="commandInput" placeholder="Ask anything..." />
            <button onclick="sendCommand()">Send</button>
        </div>
        <div class="output" id="output"></div>
    </div>
    
    <script>
        let ws = null;
        
        function connectWebSocket() {
            ws = new WebSocket(`ws://${window.location.host}/ws`);
            
            ws.onopen = () => {
                console.log('Connected to orchestrator');
                updateServices();
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleResponse(data);
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
            ws.onclose = () => {
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function updateServices() {
            ws.send(JSON.stringify({
                action: 'get_services'
            }));
        }
        
        function handleResponse(data) {
            if (data.type === 'services') {
                displayServices(data.services);
            } else if (data.type === 'command_response') {
                displayOutput(data.response);
            }
        }
        
        function displayServices(services) {
            const container = document.getElementById('services');
            container.innerHTML = '';
            
            Object.entries(services).forEach(([id, service]) => {
                const div = document.createElement('div');
                div.className = `service ${service.status === 'online' ? 'online' : 'offline'}`;
                div.innerHTML = `
                    <h4>${service.name}</h4>
                    <span class="status-dot ${service.status === 'online' ? 'online' : 'offline'}"></span>
                    <p>${service.status}</p>
                `;
                container.appendChild(div);
            });
        }
        
        function displayOutput(response) {
            const output = document.getElementById('output');
            const timestamp = new Date().toLocaleTimeString();
            output.innerHTML += `[${timestamp}] ${JSON.stringify(response, null, 2)}\\n\\n`;
            output.scrollTop = output.scrollHeight;
        }
        
        function sendCommand() {
            const input = document.getElementById('commandInput');
            const command = input.value.trim();
            if (!command) return;
            
            ws.send(JSON.stringify({
                action: 'process_command',
                command: command
            }));
            
            input.value = '';
        }
        
        function quickAction(action) {
            ws.send(JSON.stringify({
                action: 'quick_action',
                quick_action: action
            }));
        }
        
        // Initialize
        connectWebSocket();
        
        // Allow Enter key to send
        document.getElementById('commandInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendCommand();
        });
    </script>
</body>
</html>'''
        
    async def websocket_handler(self, request):
        """Handle WebSocket connections from phone"""
        ws = web.WebSocketResponse()
        await ws.prepare(request)
        
        self.active_connections[id(ws)] = ws
        
        try:
            async for msg in ws:
                if msg.type == aiohttp.WSMsgType.TEXT:
                    data = json.loads(msg.data)
                    
                    if data.get('action') == 'get_services':
                        await ws.send_json({
                            'type': 'services',
                            'services': self.services
                        })
                    elif data.get('action') == 'process_command':
                        # Process natural language command
                        command = data.get('command')
                        result = await self.process_natural_command(command)
                        await ws.send_json({
                            'type': 'command_response',
                            'response': result
                        })
                    elif data.get('action') == 'quick_action':
                        result = await self.handle_quick_action(data.get('quick_action'))
                        await ws.send_json({
                            'type': 'command_response',
                            'response': result
                        })
                        
        finally:
            del self.active_connections[id(ws)]
            
        return ws
        
    async def process_natural_command(self, command: str) -> Dict:
        """Process natural language commands using Ollama"""
        # First, use Ollama to understand the command
        if self.services['ollama']['status'] == 'online':
            understanding = await self.handle_ollama_command('chat', {
                'prompt': f'''Understand this command and return a JSON response:
Command: "{command}"

Return format:
{{
    "target": "service_name",  // ollama, claude_desktop, chatgpt_desktop, google_drive, cursor, claude_cli
    "action": "action_name",
    "data": {{}}
}}

Examples:
- "Ask Claude about Python" -> {{"target": "claude_desktop", "action": "send_message", "data": {{"message": "Tell me about Python"}}}}
- "Open file.py in Cursor" -> {{"target": "cursor", "action": "open_file", "data": {{"file_path": "file.py"}}}}
'''
            })
            
            try:
                # Parse Ollama's response
                import json
                parsed = json.loads(understanding.get('response', '{}'))
                return await self.process_command(parsed)
            except:
                # Fallback to simple routing
                pass
                
        # Simple fallback routing
        command_lower = command.lower()
        
        if 'claude' in command_lower and 'desktop' in command_lower:
            return await self.process_command({
                'target': 'claude_desktop',
                'action': 'send_message',
                'data': {'message': command}
            })
        elif 'cursor' in command_lower:
            return await self.process_command({
                'target': 'cursor',
                'action': 'open_file',
                'data': {'file_path': command.split()[-1] if len(command.split()) > 1 else ''}
            })
        else:
            # Default to Ollama
            return await self.process_command({
                'target': 'ollama',
                'action': 'chat',
                'data': {'prompt': command}
            })
            
    async def handle_quick_action(self, action: str) -> Dict:
        """Handle predefined quick actions"""
        if action == 'ask_all':
            # Ask all available AIs
            results = {}
            prompt = "What's the best way to build a mobile app?"
            
            for service_id, service in self.services.items():
                if service['status'] in ['online', 'available'] and 'chat' in service.get('capabilities', []):
                    result = await self.process_command({
                        'target': service_id,
                        'action': 'chat' if service_id == 'ollama' else 'send_message',
                        'data': {'prompt': prompt, 'message': prompt}
                    })
                    results[service['name']] = result
                    
            return results
            
        elif action == 'sync_files':
            return await self.process_command({
                'target': 'google_drive',
                'action': 'sync',
                'data': {}
            })
            
        elif action == 'open_cursor':
            return await self.process_command({
                'target': 'cursor',
                'action': 'open',
                'data': {}
            })
            
        elif action == 'generate_code':
            return await self.process_command({
                'target': 'claude_cli',
                'action': 'run_command',
                'data': {'command': 'generate a Python web server'}
            })
            
    def get_local_ip(self):
        """Get local IP for phone access"""
        try:
            # Create a socket to determine local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "localhost"
            
    def generate_qr_code(self, url: str) -> str:
        """Generate QR code for easy phone access"""
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(url)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format='PNG')
        
        return base64.b64encode(buf.getvalue()).decode()
        
    async def start_server(self):
        """Start the orchestrator server"""
        app = web.Application()
        
        # Routes
        app.router.add_get('/', lambda r: web.Response(
            text=self.get_phone_interface(),
            content_type='text/html'
        ))
        app.router.add_get('/ws', self.websocket_handler)
        
        # Get local IP
        local_ip = self.get_local_ip()
        url = f"http://{local_ip}:{self.port}"
        
        # Generate QR code
        qr_data = self.generate_qr_code(url)
        
        print(f"""
╔════════════════════════════════════════════════════════╗
║             AI ORCHESTRATOR - READY!                   ║
╚════════════════════════════════════════════════════════╝

📱 Phone Access URL: {url}

🔍 Service Status:
""")
        
        for service_id, service in self.services.items():
            status_icon = "✅" if service['status'] in ['online', 'available', 'configured'] else "❌"
            print(f"   {status_icon} {service['name']}: {service['status']}")
            
        print(f"""
📲 Scan QR Code with your phone:
   (QR code would be displayed here in terminal)
   
🎮 Quick Commands:
   • "Ask Claude about Python"
   • "Open file.py in Cursor"
   • "Chat with all AIs"
   
Press Ctrl+C to stop
""")
        
        runner = web.AppRunner(app)
        await runner.setup()
        site = web.TCPSite(runner, '0.0.0.0', self.port)
        await site.start()
        
        # Keep running
        await asyncio.Event().wait()

async def main():
    orchestrator = AIOrchestrator()
    await orchestrator.start_server()

if __name__ == "__main__":
    asyncio.run(main())