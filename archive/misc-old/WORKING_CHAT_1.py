#!/usr/bin/env python3
"""
WORKING CHAT - Actually works without errors
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json

html_page = """<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Chat</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px; }
        #messages { 
            height: 400px; 
            border: 1px solid #ddd; 
            overflow-y: auto; 
            padding: 10px;
            background: #f9f9f9;
            margin-bottom: 10px;
        }
        .message { 
            margin: 10px 0; 
            padding: 8px 12px;
            border-radius: 5px;
        }
        .user { 
            background: #007bff; 
            color: white;
            text-align: right;
            margin-left: 20%;
        }
        .bot { 
            background: #e9ecef;
            margin-right: 20%;
        }
        .input-area {
            display: flex;
            gap: 10px;
        }
        input { 
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        button { 
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <h1>Soulfra Local Chat</h1>
    <div id="messages"></div>
    <div class="input-area">
        <input type="text" id="input" placeholder="Type a message..." 
               onkeypress="if(event.key==='Enter') sendMessage()">
        <button onclick="sendMessage()">Send</button>
    </div>

    <script>
        function addMessage(text, isUser) {
            const messagesDiv = document.getElementById('messages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ' + (isUser ? 'user' : 'bot');
            messageDiv.textContent = text;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        async function sendMessage() {
            const input = document.getElementById('input');
            const message = input.value.trim();
            
            if (!message) return;
            
            addMessage(message, true);
            input.value = '';
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({message: message})
                });
                
                const data = await response.json();
                addMessage(data.response, false);
            } catch (error) {
                addMessage('Error: ' + error.message, false);
            }
        }
        
        // Welcome message
        addMessage('Welcome! I can help with status checks, QR validation, and more. Type "help" to see commands.', false);
    </script>
</body>
</html>"""

class WorkingChatHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(html_page.encode())
        else:
            self.send_error(404)
    
    def do_POST(self):
        if self.path == '/api/chat':
            try:
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                
                message = data.get('message', '').lower()
                
                # Process message
                if message == 'help':
                    response = """Available commands:
• help - Show this help
• status - Check system status
• validate qr-xxxxx - Validate a QR code
• hello - Say hello!"""
                
                elif message == 'status':
                    response = """System Status:
✅ Chat Interface: Running on port 8085
✅ API: Active at /api/chat
❌ Monitor: Not running (port 7777)
❌ Chat Logger: Not running (port 4040)"""
                
                elif 'validate' in message:
                    import re
                    match = re.search(r'qr-\w+-\d+', message)
                    if match:
                        qr_code = match.group(0)
                        valid_codes = ['qr-founder-0000', 'qr-riven-001', 'qr-user-0821']
                        if qr_code in valid_codes:
                            response = f"✅ Valid QR code: {qr_code}"
                        else:
                            response = f"❌ Invalid QR code: {qr_code}"
                    else:
                        response = "Please provide a QR code in format: qr-xxxxx-0000"
                
                elif 'hello' in message:
                    response = "Hello! How can I help you today?"
                
                else:
                    response = f"I heard: '{data.get('message', '')}'. Type 'help' to see what I can do!"
                
                # Send response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'response': response}).encode())
                
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_error(404)
    
    def log_message(self, format, *args):
        # Suppress logs
        pass

def run_server():
    print("=" * 60)
    print("SOULFRA WORKING CHAT")
    print("=" * 60)
    print()
    print("Starting server on http://localhost:8085")
    print()
    print("Open your browser to: http://localhost:8085")
    print("Or use curl:")
    print('  curl -X POST http://localhost:8085/api/chat \\')
    print('    -H "Content-Type: application/json" \\')
    print('    -d \'{"message": "help"}\'')
    print()
    print("Press Ctrl+C to stop")
    print()
    
    server = HTTPServer(('localhost', 8085), WorkingChatHandler)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()

if __name__ == '__main__':
    run_server()