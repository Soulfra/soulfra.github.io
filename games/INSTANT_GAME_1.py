#!/usr/bin/env python3
"""
INSTANT GAME - Starts and returns immediately
Uses threading to avoid timeout
"""

import http.server
import socketserver
import threading
import os
import sys

PORT = 5432

# Kill existing
os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

# Simple game state
clicks = 0

class InstantHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global clicks
        
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Clicks: {clicks}\nGET /click to play\n".encode())
            
        elif self.path == '/click':
            clicks += 1
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"CLICK! Total: {clicks}\n".encode())
            
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        pass  # Silent

# Create server
httpd = socketserver.TCPServer(("", PORT), InstantHandler)
httpd.allow_reuse_address = True

# Start in background thread
server_thread = threading.Thread(target=httpd.serve_forever)
server_thread.daemon = True
server_thread.start()

print(f"INSTANT GAME started on http://localhost:{PORT}")
print("This script returns immediately!")

# Exit - daemon thread keeps server running
sys.exit(0)