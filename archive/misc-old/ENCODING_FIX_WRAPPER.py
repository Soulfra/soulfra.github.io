#!/usr/bin/env python3
"""
Universal UTF-8 Encoding Wrapper for Python HTTP Services
Fixes formatting errors with emojis and special characters
"""

import sys
import io
import os
import locale
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import traceback

# Force UTF-8 encoding everywhere
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['LANG'] = 'C.UTF-8'

# Ensure stdout/stderr use UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Set locale to UTF-8
try:
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'C.UTF-8')
    except:
        pass

class UTF8BaseHandler(BaseHTTPRequestHandler):
    """Base handler that ensures all responses use UTF-8 encoding"""
    
    def send_utf8_response(self, code, content, content_type='text/html'):
        """Send response with proper UTF-8 encoding"""
        if isinstance(content, str):
            content = content.encode('utf-8')
        
        self.send_response(code)
        self.send_header('Content-Type', f'{content_type}; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Cache-Control', 'no-cache')
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(content)
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def get_post_data(self):
        """Get POST data with proper UTF-8 decoding"""
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            post_data = self.rfile.read(content_length)
            return post_data.decode('utf-8', errors='replace')
        return ''
    
    def parse_json_body(self):
        """Parse JSON body with UTF-8 support"""
        try:
            data = self.get_post_data()
            if data:
                return json.loads(data)
            return {}
        except Exception as e:
            print(f"JSON parse error: {e}")
            return {}
    
    def log_message(self, format, *args):
        """Override to ensure UTF-8 logging"""
        message = format % args
        sys.stderr.write(f"{self.address_string()} - [{self.log_date_time_string()}] {message}\n")

def create_utf8_server(handler_class, port=8080, host='0.0.0.0'):
    """Create HTTP server with UTF-8 support"""
    server = HTTPServer((host, port), handler_class)
    print(f"UTF-8 server starting on http://{host}:{port}")
    return server

def wrap_existing_handler(original_handler):
    """Wrap an existing handler with UTF-8 support"""
    class UTF8WrappedHandler(UTF8BaseHandler):
        def __init__(self, *args, **kwargs):
            self.original = original_handler
            super().__init__(*args, **kwargs)
        
        def do_GET(self):
            # Call original handler's do_GET if it exists
            if hasattr(self.original, 'do_GET'):
                # Capture the response
                try:
                    self.original.do_GET(self)
                except Exception as e:
                    error_msg = f"Error in original handler: {str(e)}\n{traceback.format_exc()}"
                    self.send_utf8_response(500, error_msg, 'text/plain')
            else:
                self.send_utf8_response(404, "Not Found", 'text/plain')
        
        def do_POST(self):
            # Call original handler's do_POST if it exists
            if hasattr(self.original, 'do_POST'):
                try:
                    self.original.do_POST(self)
                except Exception as e:
                    error_msg = f"Error in original handler: {str(e)}\n{traceback.format_exc()}"
                    self.send_utf8_response(500, error_msg, 'text/plain')
            else:
                self.send_utf8_response(404, "Not Found", 'text/plain')
    
    return UTF8WrappedHandler

# Test emojis and special characters
TEST_CONTENT = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>UTF-8 Encoding Test</title>
</head>
<body>
    <h1>UTF-8 Encoding Test 🚀</h1>
    <h2>Emojis: 😀 😎 🔥 ⚡ 💯 🎯 🌟 ✨</h2>
    <h3>Special Characters: © ® ™ € £ ¥ § ¶</h3>
    <h4>Unicode: 你好世界 مرحبا بالعالم Здравствуй мир</h4>
    <pre>{
    "test": "encoding",
    "emoji": "🎉",
    "special": "café",
    "unicode": "世界"
}</pre>
</body>
</html>
"""

class TestUTF8Handler(UTF8BaseHandler):
    """Test handler to verify UTF-8 support"""
    def do_GET(self):
        self.send_utf8_response(200, TEST_CONTENT)

def apply_utf8_fix_to_file(filename):
    """Apply UTF-8 fixes to an existing Python file"""
    print(f"Applying UTF-8 fixes to {filename}...")
    
    # Read the file
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already has encoding fixes
    if 'PYTHONIOENCODING' in content or 'UTF8BaseHandler' in content:
        print(f"{filename} already has encoding fixes")
        return
    
    # Create the imports and encoding setup
    encoding_setup = '''# UTF-8 Encoding Fix
import sys
import io
import os
import locale

# Force UTF-8 encoding
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LC_ALL'] = 'C.UTF-8'
os.environ['LANG'] = 'C.UTF-8'

# Ensure stdout/stderr use UTF-8
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Set locale to UTF-8
try:
    locale.setlocale(locale.LC_ALL, 'en_US.UTF-8')
except:
    try:
        locale.setlocale(locale.LC_ALL, 'C.UTF-8')
    except:
        pass

'''
    
    # Find where to insert (after imports)
    import_end = 0
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.strip() and not line.startswith('import') and not line.startswith('from'):
            import_end = i
            break
    
    # Insert the encoding setup
    lines.insert(import_end, encoding_setup)
    
    # Also add charset to HTML responses
    new_content = '\n'.join(lines)
    
    # Replace content-type headers to include charset
    new_content = new_content.replace(
        "self.send_header('Content-Type', 'text/html')",
        "self.send_header('Content-Type', 'text/html; charset=utf-8')"
    )
    new_content = new_content.replace(
        'self.send_header("Content-Type", "text/html")',
        'self.send_header("Content-Type", "text/html; charset=utf-8")'
    )
    new_content = new_content.replace(
        "self.send_header('Content-Type', 'application/json')",
        "self.send_header('Content-Type', 'application/json; charset=utf-8')"
    )
    
    # Backup and write
    backup_name = f"{filename}.backup"
    with open(backup_name, 'w', encoding='utf-8') as f:
        f.write(content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"✅ Applied UTF-8 fixes to {filename}")
    print(f"   Backup saved as {backup_name}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Apply fixes to specified file
        for filename in sys.argv[1:]:
            if filename.endswith('.py'):
                apply_utf8_fix_to_file(filename)
    else:
        # Run test server
        print("Starting UTF-8 test server on port 8888...")
        server = create_utf8_server(TestUTF8Handler, 8888)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down...")
            server.shutdown()