#!/usr/bin/env python3

import socket
import subprocess
import time

# Find a port that actually works
def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        s.listen(1)
        port = s.getsockname()[1]
    return port

PORT = get_free_port()

# Create the simplest possible server
SERVER_CODE = f'''
from http.server import HTTPServer, BaseHTTPRequestHandler

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(b"""
<html>
<body style="background:#000; color:#0f0; font-family:monospace; padding:50px;">
<h1>IT FUCKING WORKS!</h1>
<p>Port: {PORT}</p>
<div id="game" style="width:500px; height:500px; background:#111; position:relative; cursor:pointer; margin:20px 0;">
    <div id="box" style="width:50px; height:50px; background:lime; position:absolute;"></div>
</div>
<script>
document.getElementById("game").onclick = function(e) {{
    var box = document.getElementById("box");
    var rect = this.getBoundingClientRect();
    box.style.left = (e.clientX - rect.left - 25) + "px";
    box.style.top = (e.clientY - rect.top - 25) + "px";
}};
</script>
<p>Click in the box to move the square.</p>
<p>This is all we need. One game, one port, no bullshit.</p>
</body>
</html>
""")
    def log_message(self, *args): pass

httpd = HTTPServer(("localhost", {PORT}), Handler)
print("Server running on http://localhost:{PORT}")
httpd.serve_forever()
'''

# Write it to a temp file
with open('_temp_server.py', 'w') as f:
    f.write(SERVER_CODE)

# Launch it
proc = subprocess.Popen(['python3', '_temp_server.py'])

print(f"\n{'='*50}")
print(f"SERVER LAUNCHED!")
print(f"{'='*50}")
print(f"\nGo to: http://localhost:{PORT}")
print(f"\nIf this doesn't work, nothing will.")
print(f"{'='*50}\n")

# Keep this script running
try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    proc.terminate()
    print("\nServer stopped.")