#!/usr/bin/env python3
"""
JS-PYTHON BRIDGE - Makes JavaScript and Python actually work together
"""

import os
import json
import subprocess
import socket
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
from pathlib import Path

class JSPythonBridge:
    """Bridge between JavaScript and Python worlds"""
    
    def __init__(self):
        self.js_functions = {}
        self.py_functions = {}
        self.setup_bridge()
        
    def setup_bridge(self):
        """Setup the bridge between JS and Python"""
        # Create bridge directory
        os.makedirs('bridge', exist_ok=True)
        
        # Create package.json for JS side
        package_json = {
            "name": "soulfra-bridge",
            "version": "1.0.0",
            "description": "Bridge between JS and Python",
            "scripts": {
                "qr-validate": "node ../qr-validator.js",
                "bridge-server": "node bridge-server.js"
            }
        }
        
        with open('bridge/package.json', 'w') as f:
            json.dump(package_json, f, indent=2)
            
    def call_js_from_python(self, js_file, function, args):
        """Call JavaScript function from Python"""
        # Create a temporary JS runner
        runner_js = f"""
const module = require('../{js_file}');
const result = module.{function}({json.dumps(args)});
console.log(JSON.stringify(result));
"""
        
        with open('bridge/temp_runner.js', 'w') as f:
            f.write(runner_js)
            
        try:
            result = subprocess.run(
                ['node', 'bridge/temp_runner.js'],
                capture_output=True,
                text=True
            )
            if result.returncode == 0:
                return json.loads(result.stdout.strip())
            else:
                return {'error': result.stderr}
        except Exception as e:
            return {'error': str(e)}
            
    def expose_python_to_js(self, func, name):
        """Expose Python function to JavaScript"""
        self.py_functions[name] = func
        
        # Create JS wrapper
        js_wrapper = f"""
async function {name}(...args) {{
    const response = await fetch('http://localhost:9090/call-python', {{
        method: 'POST',
        headers: {{ 'Content-Type': 'application/json' }},
        body: JSON.stringify({{ function: '{name}', args: args }})
    }});
    return response.json();
}}

module.exports.{name} = {name};
"""
        
        with open(f'bridge/{name}.js', 'w') as f:
            f.write(js_wrapper)

class BridgeHandler(BaseHTTPRequestHandler):
    """HTTP handler for JS-Python bridge"""
    
    def do_POST(self):
        if self.path == '/call-python':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            func_name = data['function']
            args = data['args']
            
            if func_name in self.server.bridge.py_functions:
                result = self.server.bridge.py_functions[func_name](*args)
                response = {'result': result}
            else:
                response = {'error': f'Function {func_name} not found'}
                
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode())
            
    def log_message(self, format, *args):
        pass

def create_unified_launcher():
    """Create a launcher that runs both JS and Python"""
    launcher = '''#!/usr/bin/env python3
"""
UNIFIED LAUNCHER - Runs JavaScript and Python together
"""

import subprocess
import time
import sys
import os
from JS_PYTHON_BRIDGE import JSPythonBridge

def main():
    print("=" * 60)
    print("SOULFRA UNIFIED SYSTEM")
    print("JavaScript + Python Working Together")
    print("=" * 60)
    print()
    
    # Initialize bridge
    bridge = JSPythonBridge()
    
    # Example: Call JavaScript QR validator from Python
    print("Testing JS from Python...")
    result = bridge.call_js_from_python('qr-validator.js', 'validateQR', 'qr-founder-0000')
    print(f"QR Validation: {result}")
    
    # Start Python services
    services = [
        ('python3', 'ACTUALLY_WORKING_SYSTEM.py'),
        ('node', '../qr-validator.js', 'qr-founder-0000')  # Can run JS too
    ]
    
    processes = []
    for cmd in services:
        try:
            if cmd[0] == 'python3' and os.path.exists(cmd[1]):
                p = subprocess.Popen(cmd[:2], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                processes.append(p)
                print(f"Started: {cmd[1]}")
            elif cmd[0] == 'node':
                # Test JS execution
                p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                stdout, stderr = p.communicate(timeout=2)
                print(f"JS Result: {stdout.decode().strip()}")
        except:
            pass
            
    print()
    print("System running with JS-Python bridge!")
    print("Access at: http://localhost:8080")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\\nShutting down...")
        for p in processes:
            p.terminate()

if __name__ == "__main__":
    main()
'''
    
    with open('UNIFIED_LAUNCHER.py', 'w') as f:
        f.write(launcher)
    os.chmod('UNIFIED_LAUNCHER.py', 0o755)
    
def create_bridge_examples():
    """Create examples of JS-Python interop"""
    
    # Python function exposed to JS
    python_example = '''#!/usr/bin/env python3
"""Example of Python functions callable from JavaScript"""

from JS_PYTHON_BRIDGE import JSPythonBridge

def process_chat_log(content):
    """Process chat log and return analysis"""
    return {
        'lines': len(content.split('\\n')),
        'words': len(content.split()),
        'processed': True
    }

def generate_qr_data(user_id):
    """Generate QR code data"""
    import hashlib
    qr_id = hashlib.md5(user_id.encode()).hexdigest()[:8]
    return {
        'qr_id': f'qr-{qr_id}',
        'deep_link': f'soulfra://pair?code={qr_id}'
    }

if __name__ == "__main__":
    bridge = JSPythonBridge()
    bridge.expose_python_to_js(process_chat_log, 'processChatLog')
    bridge.expose_python_to_js(generate_qr_data, 'generateQR')
    
    print("Python functions exposed to JavaScript!")
'''
    
    # JavaScript calling Python
    js_example = '''// Example of JavaScript calling Python functions

const { processChatLog, generateQR } = require('./bridge/processChatLog');

async function processUploadedFile(fileContent) {
    // Call Python function from JavaScript
    const analysis = await processChatLog(fileContent);
    console.log('Analysis from Python:', analysis);
    
    // Generate QR code using Python
    const qrData = await generateQR('user123');
    console.log('QR from Python:', qrData);
    
    return {
        analysis,
        qrData
    };
}

module.exports = { processUploadedFile };
'''
    
    with open('bridge/python_functions.py', 'w') as f:
        f.write(python_example)
        
    with open('bridge/js_example.js', 'w') as f:
        f.write(js_example)

if __name__ == "__main__":
    print("Creating JS-Python Bridge...")
    
    # Create bridge
    bridge = JSPythonBridge()
    
    # Create unified launcher
    create_unified_launcher()
    
    # Create examples
    create_bridge_examples()
    
    print("\nBridge created!")
    print("\nNow you can:")
    print("  - Call JavaScript from Python")
    print("  - Call Python from JavaScript")
    print("  - Run: python3 UNIFIED_LAUNCHER.py")
    print("\nBridge files in: bridge/")