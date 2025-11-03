#!/usr/bin/env python3
"""
TEXT ONLY BRIDGE - Zero formatting issues
"""

import http.server
import socketserver
import json
import os

PORT = 5678

os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

# Store data
DATA = []

class TextHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            # Plain text response
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            
            response = "TEXT ONLY BRIDGE\n\n"
            response += "POST /add with any JSON data\n"
            response += "GET /all to see everything\n"
            response += "POST /clear to reset\n\n"
            response += f"Current entries: {len(DATA)}\n"
            
            self.wfile.write(response.encode())
            
        elif self.path == '/all':
            # Return all data as JSON
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(DATA, indent=2).encode())
            
    def do_POST(self):
        if self.path == '/add':
            try:
                length = int(self.headers.get('Content-Length', 0))
                raw_data = self.rfile.read(length)
                
                # Try to parse as JSON
                try:
                    data = json.loads(raw_data)
                except:
                    # If not JSON, store as text
                    data = {'text': raw_data.decode('utf-8', errors='ignore')}
                
                # Add timestamp
                import time
                data['_timestamp'] = time.time()
                
                DATA.append(data)
                
                # Keep last 1000 entries
                if len(DATA) > 1000:
                    DATA.pop(0)
                
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'OK')
                
            except Exception as e:
                self.send_error(400, str(e))
                
        elif self.path == '/clear':
            DATA.clear()
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'CLEARED')
            
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def log_message(self, format, *args):
        print(f"[BRIDGE] {format % args}")

print(f"\nTEXT ONLY BRIDGE: http://localhost:{PORT}")
print("\nUsage:")
print("curl -X POST http://localhost:5678/add -d '{\"error\": \"something broke\"}'")
print("curl http://localhost:5678/all")
print("\nOr from JavaScript:")
print("fetch('http://localhost:5678/add', {")
print("  method: 'POST',") 
print("  body: JSON.stringify({error: 'your error'})")
print("})")

httpd = socketserver.TCPServer(("", PORT), TextHandler)
httpd.allow_reuse_address = True
httpd.serve_forever()