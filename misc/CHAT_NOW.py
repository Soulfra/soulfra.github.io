#!/usr/bin/env python3
"""
CHAT NOW - Simple working chat that starts immediately
"""

import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import os

class ChatHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.end_headers()
        
        html = '''<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Chat</title>
    <style>
        body { font-family: Arial; max-width: 600px; margin: 50px auto; padding: 20px; }
        #chat { height: 400px; border: 1px solid #ccc; overflow-y: auto; padding: 10px; margin-bottom: 10px; }
        .msg { margin: 5px 0; padding: 5px; }
        .user { background: #e3f2fd; text-align: right; }
        .bot { background: #f5f5f5; }
        input { width: 80%; padding: 10px; }
        button { width: 18%; padding: 10px; }
    </style>
</head>
<body>
    <h1>Soulfra Local Chat</h1>
    <div id="chat"></div>
    <input id="input" placeholder="Type message..." onkeypress="if(event.key=='Enter')send()">
    <button onclick="send()">Send</button>
    
    <script>
        function send() {
            const input = document.getElementById('input');
            const msg = input.value;
            if (!msg) return;
            
            addMsg(msg, 'user');
            input.value = '';
            
            fetch('/chat', {
                method: 'POST',
                body: JSON.stringify({msg: msg})
            })
            .then(r => r.json())
            .then(d => addMsg(d.response, 'bot'))
            .catch(e => addMsg('Error: ' + e, 'bot'));
        }
        
        function addMsg(text, type) {
            const chat = document.getElementById('chat');
            const div = document.createElement('div');
            div.className = 'msg ' + type;
            div.textContent = text;
            chat.appendChild(div);
            chat.scrollTop = chat.scrollHeight;
        }
        
        addMsg('Ready! Try "help" or "status"', 'bot');
    </script>
</body>
</html>'''
        
        self.wfile.write(html.encode())
        
    def do_POST(self):
        if self.path == '/chat':
            length = int(self.headers['Content-Length'])
            data = json.loads(self.rfile.read(length))
            msg = data['msg'].lower()
            
            # Simple responses
            if msg == 'help':
                resp = 'Commands: help, status, validate qr-xxxxx'
            elif msg == 'status':
                resp = 'Chat system running on port 8085'
            elif 'validate' in msg and 'qr' in msg:
                # Extract QR code
                import re
                match = re.search(r'qr-\w+-\d+', msg)
                if match:
                    qr = match.group(0)
                    valid = qr in ['qr-founder-0000', 'qr-riven-001', 'qr-user-0821']
                    resp = f"{'✅ Valid' if valid else '❌ Invalid'}: {qr}"
                else:
                    resp = 'Provide QR code like: qr-xxxxx-0000'
            else:
                resp = f'You said: {data["msg"]}'
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'response': resp}).encode())
            
    def log_message(self, format, *args):
        pass

print("Starting chat on http://localhost:8085")
server = HTTPServer(('', 8085), ChatHandler)
server.serve_forever()