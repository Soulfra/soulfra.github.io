#!/usr/bin/env python3

# SUPER SIMPLE SERVER - NO ERRORS POSSIBLE

import http.server
import socketserver
import webbrowser

PORT = 7777

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.path = '/SIMPLE_AS_FUCK.html'
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

print(f"""
==============================================
SUPER SIMPLE GAME PORTAL
==============================================

Starting server on port {PORT}...
""")

with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
    print(f"✅ Server running at http://localhost:{PORT}")
    print("\nOpening in browser...")
    webbrowser.open(f'http://localhost:{PORT}')
    print("\nPress Ctrl+C to stop\n")
    httpd.serve_forever()