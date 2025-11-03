#!/usr/bin/env python3
"""
TEXT ONLY GAME - Absolutely no special characters
Returns only ASCII text and numbers
"""

import http.server
import socketserver
import json
import os

PORT = 3456

os.system(f'lsof -ti :{PORT} | xargs kill -9 2>/dev/null')

# Game state
STATE = {
    'score': 0,
    'clicks': 0,
    'level': 1
}

class TextOnlyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            # Plain text game
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            
            text = """TEXT ONLY GAME

Commands:
  GET /click   - Click to score
  GET /score   - View score
  GET /reset   - Reset game

Current Score: {}
Level: {}
Total Clicks: {}

No emojis. No special characters. Just text.""".format(
                STATE['score'],
                STATE['level'], 
                STATE['clicks']
            )
            
            self.wfile.write(text.encode())
            
        elif self.path == '/click':
            STATE['clicks'] += 1
            STATE['score'] += 10 * STATE['level']
            
            if STATE['score'] >= STATE['level'] * 100:
                STATE['level'] += 1
                
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"CLICKED! Score: {STATE['score']} Level: {STATE['level']}\n".encode())
            
        elif self.path == '/score':
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(f"Score: {STATE['score']}\nLevel: {STATE['level']}\nClicks: {STATE['clicks']}\n".encode())
            
        elif self.path == '/reset':
            STATE['score'] = 0
            STATE['clicks'] = 0
            STATE['level'] = 1
            
            self.send_response(200)
            self.send_header('Content-Type', 'text/plain')
            self.end_headers()
            self.wfile.write(b"Game reset.\n")
            
        elif self.path == '/json':
            # JSON endpoint for programmatic access
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(STATE).encode())
            
        else:
            self.send_error(404, "Not found")
            
    def log_message(self, format, *args):
        # Simple logging
        print(f"{self.client_address[0]} - {format % args}")

httpd = socketserver.TCPServer(("", PORT), TextOnlyHandler)
httpd.allow_reuse_address = True

print(f"\nTEXT ONLY GAME: http://localhost:{PORT}")
print("\nZero formatting issues. Pure ASCII text.")
print("\nTry:")
print(f"  curl http://localhost:{PORT}/click")
print(f"  curl http://localhost:{PORT}/score")
print(f"  curl http://localhost:{PORT}/json")

httpd.serve_forever()