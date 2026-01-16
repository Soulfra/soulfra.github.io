#!/usr/bin/env python3
"""
HEALTH CHECK - Simple health endpoint
"""

import sys
import json
from http.server import HTTPServer, BaseHTTPRequestHandler

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            
            health = {
                "status": "healthy",
                "service": sys.argv[1] if len(sys.argv) > 1 else "unknown",
                "timestamp": str(datetime.now())
            }
            
            self.wfile.write(json.dumps(health).encode())
        else:
            self.send_error(404)
            
    def log_message(self, format, *args):
        pass  # Suppress logs

if __name__ == "__main__":
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 9090
    server = HTTPServer(('0.0.0.0', port), HealthHandler)
    print(f"Health check running on port {port}")
    server.serve_forever()
