from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env python3
"""
LOCAL CHAT SYSTEM - Chat via CLI, GUI, or Web
Everything routes properly through one unified system
"""

import os
import sys
import json
import sqlite3
import threading
import asyncio
import websockets
from datetime import datetime
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor

class UnifiedChatRouter:
    """Routes all chat inputs to appropriate handlers"""
    
    def __init__(self):
        self.setup_database()
        self.handlers = {}
        self.active_sessions = {}
        self.executor = ThreadPoolExecutor(max_workers=10)
        
    def setup_database(self):
        """Setup unified chat database"""
        self.db_path = "unified_chat.db"
        conn = sqlite3.connect(self.db_path)
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT,
                source TEXT,  -- cli, web, gui
                message TEXT,
                response TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                context TEXT
            )
        ''')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS routing_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pattern TEXT,
                handler TEXT,
                priority INTEGER
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def process_message(self, message, source="web", session_id=None):
        """Process message from any source"""
        if not session_id:
            session_id = f"{source}_{int(time.time())}"
            
        # Log the message
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Determine handler based on content
        handler = self.route_message(message)
        
        # Process through appropriate handler
        response = self.handlers.get(handler, self.default_handler)(message)
        
        # Store conversation
        cursor.execute('''
            INSERT INTO conversations (session_id, source, message, response)
            VALUES (?, ?, ?, ?)
        ''', (session_id, source, message, response))
        
        conn.commit()
        conn.close()
        
        return response
        
    def route_message(self, message):
        """Determine which handler to use"""
        message_lower = message.lower()
        
        if any(word in message_lower for word in ['status', 'health', 'running']):
            return 'status_handler'
        elif any(word in message_lower for word in ['help', 'commands', 'what can']):
            return 'help_handler'
        elif any(word in message_lower for word in ['process', 'analyze', 'chat log']):
            return 'process_handler'
        elif any(word in message_lower for word in ['start', 'launch', 'run']):
            return 'launch_handler'
        else:
            return 'chat_handler'
            
    def default_handler(self, message):
        """Default chat handler"""
        return f"Received: {message}. How can I help you today?"
        
    def register_handler(self, name, handler_func):
        """Register a message handler"""
        self.handlers[name] = handler_func

# Web Interface
class ChatWebHandler(BaseHTTPRequestHandler):
    """Web interface for chat"""
    
    def do_GET(self):
        if self.path == '/':
            self.serve_chat_interface()
        elif self.path == '/api/status':
            self.send_json({'status': 'running', 'services': self.check_services()})
        else:
            self.send_error(404)
            
    def do_POST(self):
        if self.path == '/api/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            response = self.server.router.process_message(
                data['message'], 
                source='web',
                session_id=data.get('session_id')
            )
            
            self.send_json({'response': response})
        else:
            self.send_error(404)
            
    def serve_chat_interface(self):
        """Serve the chat interface"""
        html = '''<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Local Chat</title>
    <style>
        body {
            font-family: -apple-system, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
        }
        .chat-container {
            background: #2a2a2a;
            border-radius: 10px;
            padding: 20px;
            height: 500px;
            display: flex;
            flex-direction: column;
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            background: #1a1a1a;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
        }
        .user { background: #0084ff; text-align: right; }
        .assistant { background: #444; }
        .input-area {
            display: flex;
            gap: 10px;
        }
        input {
            flex: 1;
            padding: 10px;
            border: none;
            border-radius: 5px;
            background: #333;
            color: #fff;
        }
        button {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            background: #0084ff;
            color: #fff;
            cursor: pointer;
        }
        button:hover { background: #0066cc; }
        .status {
            margin-top: 10px;
            padding: 10px;
            background: #333;
            border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>Soulfra Local Chat</h1>
    
    <div class="chat-container">
        <div class="messages" id="messages"></div>
        <div class="input-area">
            <input type="text" id="input" placeholder="Type your message..." 
                   onkeypress="if(event.key==='Enter') sendMessage()">
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>
    
    <div class="status" id="status">
        Connected to local system
    </div>
    
    <script>
        const messagesDiv = document.getElementById('messages');
        const input = document.getElementById('input');
        const sessionId = 'web_' + Date.now();
        
        async function sendMessage() {
            const message = input.value.trim();
            if (!message) return;
            
            // Add user message
            addMessage(message, 'user');
            input.value = '';
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        message: message,
                        session_id: sessionId
                    })
                });
                
                const data = await response.json();
                addMessage(data.response, 'assistant');
                
            } catch (error) {
                addMessage('Error: ' + error.message, 'assistant');
            }
        }
        
        function addMessage(text, type) {
            const div = document.createElement('div');
            div.className = 'message ' + type;
            div.textContent = text;
            messagesDiv.appendChild(div);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }
        
        // Welcome message
        addMessage('Welcome! You can chat with me via web, CLI, or API. Try "help" to see commands.', 'assistant');
    </script>
</body>
</html>'''
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode())
        
    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
        
    def check_services(self):
        """Check running services"""
        services = {}
        ports = [7777, 4040, 8888, 9999]
        
        for port in ports:
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            services[f'port_{port}'] = result == 0
            
        return services
        
    def log_message(self, format, *args):
        pass

# CLI Interface
class ChatCLI:
    """Command line interface for chat"""
    
    def __init__(self, router):
        self.router = router
        self.session_id = f"cli_{int(time.time())}"
        
    def run(self):
        """Run the CLI interface"""
        print("=" * 60)
        print("SOULFRA LOCAL CHAT CLI")
        print("=" * 60)
        print("Type 'help' for commands, 'exit' to quit")
        print()
        
        while True:
            try:
                message = input("You: ").strip()
                
                if message.lower() in ['exit', 'quit']:
                    print("Goodbye!")
                    break
                    
                response = self.router.process_message(
                    message, 
                    source='cli',
                    session_id=self.session_id
                )
                
                print(f"Assistant: {response}")
                print()
                
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except Exception as e:
                print(f"Error: {e}")

# WebSocket Server for real-time chat
async def websocket_handler(websocket, path, router):
    """Handle WebSocket connections"""
    session_id = f"ws_{int(time.time())}"
    
    try:
        async for message in websocket:
            data = json.loads(message)
            
            response = router.process_message(
                data['message'],
                source='websocket',
                session_id=session_id
            )
            
            await websocket.send(json.dumps({
                'response': response,
                'timestamp': datetime.now().isoformat()
            }))
    except:
        pass

# Main handlers
def create_handlers(router):
    """Create all message handlers"""
    
    def status_handler(message):
        """Handle status requests"""
        services = []
        
        # Check various ports
        ports = {
            7777: "Monitor",
            4040: "Chat Logger",
            8888: "Chat Processor",
            9999: "AI Ecosystem"
        }
        
        for port, name in ports.items():
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            
            status = "🟢 Running" if result == 0 else "🔴 Stopped"
            services.append(f"{name} ({port}): {status}")
            
        return "System Status:\n" + "\n".join(services)
        
    def help_handler(message):
        """Handle help requests"""
        return """Available commands:
- status: Check system status
- start [service]: Start a service
- process [file]: Process a chat log
- analyze: Run analysis on recent chats
- help: Show this help message

You can also chat naturally and I'll route your request appropriately!"""
        
    def process_handler(message):
        """Handle processing requests"""
        # Extract filename if provided
        import re
        match = re.search(r'process\s+(\S+)', message.lower())
        
        if match:
            filename = match.group(1)
            return f"Processing {filename}... This would analyze the chat log and extract insights."
        else:
            return "Please specify a file to process. Example: 'process chatlog.txt'"
            
    def launch_handler(message):
        """Handle launch requests"""
        # Extract service name
        import re
        match = re.search(r'(start|launch)\s+(\S+)', message.lower())
        
        if match:
            service = match.group(2)
            
            # Map service names to scripts
            service_map = {
                'monitor': ('FIXED_MONITOR.py', 7777),
                'chat': ('CHAT_LOG_PROCESSOR.py', 4040),
                'processor': ('UNIFIED_CHATLOG_SYSTEM.py', 8888)
            }
            
            if service in service_map:
                script, port = service_map[service]
                if Path(script).exists():
                    subprocess.Popen([sys.executable, script], 
                                   stdout=subprocess.DEVNULL, 
                                   stderr=subprocess.DEVNULL)
                    return f"Starting {service} on port {port}..."
                else:
                    return f"Service script {script} not found"
            else:
                return f"Unknown service: {service}. Available: " + ", ".join(service_map.keys())
        else:
            return "Please specify a service to start. Example: 'start monitor'"
            
    def chat_handler(message):
        """Handle general chat"""
        # This is where you'd integrate with an AI model
        # For now, provide helpful responses
        
        responses = {
            "hello": "Hello! I'm your local Soulfra assistant. I can help you manage services, process chat logs, and more.",
            "how are you": "I'm running smoothly on your local system! How can I help you today?",
            "what can you do": help_handler(""),
            "thanks": "You're welcome! Let me know if you need anything else."
        }
        
        # Simple keyword matching
        message_lower = message.lower()
        for keyword, response in responses.items():
            if keyword in message_lower:
                return response
                
        return "I understand you said: '" + message + "'. I can help with status checks, launching services, and processing chat logs. Try 'help' for more commands."
    
    # Register all handlers
    router.register_handler('status_handler', status_handler)
    router.register_handler('help_handler', help_handler)
    router.register_handler('process_handler', process_handler)
    router.register_handler('launch_handler', launch_handler)
    router.register_handler('chat_handler', chat_handler)

def main():
    """Main entry point"""
    print("=" * 60)
    print("SOULFRA LOCAL CHAT SYSTEM")
    print("=" * 60)
    print()
    
    # Create the unified router
    router = UnifiedChatRouter()
    create_handlers(router)
    
    # Parse command line arguments
    mode = sys.argv[1] if len(sys.argv) > 1 else 'all'
    
    if mode == 'cli':
        # Run CLI only
        cli = ChatCLI(router)
        cli.run()
        
    elif mode == 'web':
        # Run web server only
        server = HTTPServer(('localhost', 8085), ChatWebHandler)
        server.router = router
        print("Web interface running at: http://localhost:8085")
        print("Press Ctrl+C to stop")
        server.serve_forever()
        
    elif mode == 'ws':
        # Run WebSocket server only
        print("WebSocket server running on ws://localhost:8086")
        start_server = websockets.serve(
            lambda ws, path: websocket_handler(ws, path, router),
            'localhost', 8086
        )
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()
        
    else:
        # Run everything
        print("Starting all interfaces...")
        
        # Start web server in thread
        server = HTTPServer(('localhost', 8085), ChatWebHandler)
        server.router = router
        web_thread = threading.Thread(target=server.serve_forever, daemon=True)
        web_thread.start()
        print("✓ Web interface: http://localhost:8085")
        
        # Start WebSocket server in thread
        def run_websocket():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            start_server = websockets.serve(
                lambda ws, path: websocket_handler(ws, path, router),
                'localhost', 8086
            )
            loop.run_until_complete(start_server)
            loop.run_forever()
            
        ws_thread = threading.Thread(target=run_websocket, daemon=True)
        ws_thread.start()
        print("✓ WebSocket: ws://localhost:8086")
        
        print("✓ CLI: Run 'python3 LOCAL_CHAT_SYSTEM.py cli'")
        print()
        print("All interfaces running! Press Ctrl+C to stop.")
        
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nShutting down...")

if __name__ == "__main__":
    main()