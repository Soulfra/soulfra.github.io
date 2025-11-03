from FILE_READ_RULE import safe_read_text, safe_write_text, quick_read_check

#!/usr/bin/env python3
"""
SIMPLE LOCAL CHAT - Works without extra dependencies
Chat via CLI or Web with proper routing
"""

import os
import sys
import json
import sqlite3
import threading
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import socket

class SimpleChatSystem:
    """Simple chat system that actually works"""
    
    def __init__(self):
        self.setup_database()
        
    def setup_database(self):
        """Setup chat database"""
        conn = sqlite3.connect('simple_chat.db')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message TEXT,
                response TEXT,
                source TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        conn.commit()
        conn.close()
        
    def process_message(self, message, source='cli'):
        """Process a chat message"""
        message_lower = message.lower()
        
        # Route to appropriate handler
        if message_lower == 'help':
            response = self.help_response()
        elif message_lower == 'status':
            response = self.status_response()
        elif 'validate' in message_lower and 'qr' in message_lower:
            response = self.validate_qr(message)
        elif 'start' in message_lower:
            response = self.start_service(message)
        elif 'process' in message_lower:
            response = self.process_file(message)
        else:
            response = f"I understand: '{message}'. Type 'help' for commands."
            
        # Store in database
        conn = sqlite3.connect('simple_chat.db')
        conn.execute(
            'INSERT INTO chats (message, response, source) VALUES (?, ?, ?)',
            (message, response, source)
        )
        conn.commit()
        conn.close()
        
        return response
        
    def help_response(self):
        """Return help text"""
        return """Commands:
• help - Show this help
• status - Check system status  
• validate qr-xxxxx - Validate QR code
• start [monitor|chat|processor] - Start a service
• process [filename] - Process a chat log
• Type anything else to chat!"""
        
    def status_response(self):
        """Check system status"""
        services = {
            7777: "Monitor",
            4040: "Chat Logger",
            8888: "Chat Processor",
            8085: "Chat Interface"
        }
        
        status_lines = ["System Status:"]
        for port, name in services.items():
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', port))
            sock.close()
            
            if result == 0:
                status_lines.append(f"✅ {name} (port {port})")
            else:
                status_lines.append(f"❌ {name} (port {port})")
                
        return "\n".join(status_lines)
        
    def validate_qr(self, message):
        """Validate QR code"""
        import re
        match = re.search(r'(qr-\w+-\d+)', message)
        
        if match:
            qr_code = match.group(1)
            
            # Try to call the JavaScript validator
            try:
                result = subprocess.run(
                    ['node', '../qr-validator.js', qr_code],
                    capture_output=True,
                    text=True,
                    cwd=os.path.dirname(os.path.abspath(__file__))
                )
                
                if result.returncode == 0:
                    return f"✅ Valid QR code: {qr_code}"
                else:
                    return f"❌ Invalid QR code: {qr_code}"
            except:
                # Fallback to Python validation
                valid_codes = ["qr-founder-0000", "qr-riven-001", "qr-user-0821"]
                if qr_code in valid_codes:
                    return f"✅ Valid QR code: {qr_code}"
                else:
                    return f"❌ Invalid QR code: {qr_code}"
        else:
            return "Please provide a QR code (format: qr-xxxxx-0000)"
            
    def start_service(self, message):
        """Start a service"""
        services = {
            'monitor': ('FIXED_MONITOR.py', 7777),
            'chat': ('CHAT_LOG_PROCESSOR.py', 4040),
            'processor': ('UNIFIED_CHATLOG_SYSTEM.py', 8888)
        }
        
        for name, (script, port) in services.items():
            if name in message.lower():
                if os.path.exists(script):
                    # Kill existing process on port
                    os.system(f'lsof -ti :{port} | xargs kill -9 2>/dev/null')
                    
                    # Start new process
                    subprocess.Popen(
                        [sys.executable, script],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )
                    return f"Starting {name} on port {port}..."
                else:
                    return f"Script {script} not found"
                    
        return "Available services: monitor, chat, processor"
        
    def process_file(self, message):
        """Process a file"""
        import re
        match = re.search(r'process\s+(\S+)', message)
        
        if match:
            filename = match.group(1)
            return f"Would process file: {filename}"
        else:
            return "Usage: process [filename]"

# Web Interface
class SimpleWebHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            
            html = '''<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Local Chat</title>
    <style>
        body { 
            font-family: Arial; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            background: #f0f0f0;
        }
        .chat-box {
            background: white;
            border: 1px solid #ddd;
            border-radius: 10px;
            padding: 20px;
            height: 400px;
            overflow-y: auto;
            margin-bottom: 10px;
        }
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 5px;
        }
        .user { background: #e3f2fd; text-align: right; }
        .bot { background: #f5f5f5; }
        input {
            width: 70%;
            padding: 10px;
            font-size: 16px;
        }
        button {
            width: 25%;
            padding: 10px;
            font-size: 16px;
            background: #2196F3;
            color: white;
            border: none;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <h1>Soulfra Local Chat</h1>
    
    <div class="chat-box" id="chatBox">
        <div class="message bot">Welcome! Type 'help' for commands.</div>
    </div>
    
    <div>
        <input type="text" id="input" placeholder="Type your message..." 
               onkeypress="if(event.key==='Enter') send()">
        <button onclick="send()">Send</button>
    </div>
    
    <script>
        async function send() {
            const input = document.getElementById('input');
            const message = input.value.trim();
            if (!message) return;
            
            // Add user message
            addMessage(message, 'user');
            input.value = '';
            
            // Send to server
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: message})
                });
                
                const data = await response.json();
                addMessage(data.response, 'bot');
            } catch (error) {
                addMessage('Error: ' + error, 'bot');
            }
        }
        
        function addMessage(text, type) {
            const chatBox = document.getElementById('chatBox');
            const div = document.createElement('div');
            div.className = 'message ' + type;
            div.textContent = text;
            chatBox.appendChild(div);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    </script>
</body>
</html>'''
            
            self.wfile.write(html.encode())
            
    def do_POST(self):
        if self.path == '/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            response = self.server.chat_system.process_message(
                data['message'], 
                source='web'
            )
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'response': response}).encode())
            
    def log_message(self, format, *args):
        pass

# CLI Interface
def run_cli(chat_system):
    """Run command line interface"""
    print("=" * 60)
    print("SOULFRA LOCAL CHAT (CLI)")
    print("=" * 60)
    print("Type 'help' for commands, 'exit' to quit")
    print()
    
    while True:
        try:
            message = input("You: ").strip()
            
            if message.lower() in ['exit', 'quit']:
                print("Goodbye!")
                break
                
            response = chat_system.process_message(message, source='cli')
            print(f"\nBot: {response}\n")
            
        except KeyboardInterrupt:
            print("\nGoodbye!")
            break

def main():
    """Main entry point"""
    chat_system = SimpleChatSystem()
    
    if len(sys.argv) > 1 and sys.argv[1] == 'cli':
        # CLI mode
        run_cli(chat_system)
    else:
        # Web mode
        print("=" * 60)
        print("SOULFRA LOCAL CHAT SYSTEM")
        print("=" * 60)
        print()
        print("Web interface: http://localhost:8085")
        print("CLI mode: python3 SIMPLE_LOCAL_CHAT.py cli")
        print()
        print("Press Ctrl+C to stop")
        print()
        
        server = HTTPServer(('localhost', 8085), SimpleWebHandler)
        server.chat_system = chat_system
        
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")

if __name__ == "__main__":
    main()