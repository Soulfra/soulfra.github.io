
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
<p>Port: 50395</p>
<div id="game" style="width:500px; height:500px; background:#111; position:relative; cursor:pointer; margin:20px 0;">
    <div id="box" style="width:50px; height:50px; background:lime; position:absolute;"></div>
</div>
<script>
document.getElementById("game").onclick = function(e) {
    var box = document.getElementById("box");
    var rect = this.getBoundingClientRect();
    box.style.left = (e.clientX - rect.left - 25) + "px";
    box.style.top = (e.clientY - rect.top - 25) + "px";
};
</script>
<p>Click in the box to move the square.</p>
<p>This is all we need. One game, one port, no bullshit.</p>
</body>
</html>
""")
    def log_message(self, *args): pass

httpd = HTTPServer(("localhost", 50395), Handler)
print("Server running on http://localhost:50395")
httpd.serve_forever()
