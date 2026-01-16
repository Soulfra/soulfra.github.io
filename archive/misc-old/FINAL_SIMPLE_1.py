#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler

HTML = b"""<!DOCTYPE html>
<html>
<head>
<title>Game</title>
<style>
body { background: black; }
#box { width: 50px; height: 50px; background: lime; position: absolute; }
</style>
</head>
<body>
<div id="box"></div>
<script>
const box = document.getElementById("box");
document.onclick = (e) => {
    box.style.left = e.clientX + "px";
    box.style.top = e.clientY + "px";
};
</script>
</body>
</html>"""

class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        self.wfile.write(HTML)
    def log_message(self, f, *a): pass

HTTPServer(("localhost", 13000), H).serve_forever()
