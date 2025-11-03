#!/usr/bin/env python3
"""
CLAUDE BRIDGE - Let your platform talk to Claude
This creates a local API that can collect logs, errors, and chat data
Then formats it for Claude to understand
"""

import http.server
import socketserver
import json
import os
import time
from datetime import datetime
from pathlib import Path

PORT = 7777

# Storage for everything
BRIDGE_DATA = {
    'errors': [],
    'logs': [],
    'chat_drops': [],
    'platform_state': {},
    'questions_for_claude': []
}

# Simple web interface
HTML = """<!DOCTYPE html>
<html>
<head>
<title>Claude Bridge</title>
<style>
body {
    font-family: Arial, sans-serif;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background: #f5f5f5;
}

.section {
    background: white;
    padding: 20px;
    margin: 20px 0;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h1 { color: #333; }
h2 { color: #666; }

.drop-zone {
    border: 2px dashed #ccc;
    border-radius: 8px;
    padding: 40px;
    text-align: center;
    background: #fafafa;
    cursor: pointer;
}

.drop-zone:hover {
    border-color: #999;
    background: #f0f0f0;
}

.log-viewer {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 15px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
    max-height: 400px;
    overflow-y: auto;
}

.error { color: #f48771; }
.info { color: #4ec9b0; }
.success { color: #4fc1ff; }

button {
    background: #007acc;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

button:hover {
    background: #005a9e;
}

textarea {
    width: 100%;
    min-height: 200px;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: monospace;
}

.status {
    padding: 5px 10px;
    border-radius: 4px;
    display: inline-block;
}

.status.connected { background: #4caf50; color: white; }
.status.error { background: #f44336; color: white; }
</style>
</head>
<body>

<h1>Claude Bridge 🌉</h1>
<p>Drop chat logs, send errors, and let your platform talk to Claude</p>

<div class="section">
    <h2>Drop Chat Logs</h2>
    <div class="drop-zone" ondrop="dropHandler(event);" ondragover="dragOverHandler(event);">
        <p>Drag & drop chat files here</p>
        <p>or</p>
        <input type="file" id="fileInput" onchange="handleFileSelect(event)" multiple>
    </div>
    <div id="fileStatus"></div>
</div>

<div class="section">
    <h2>Platform Errors</h2>
    <div class="log-viewer" id="errorLog">
        <div class="info">Waiting for errors...</div>
    </div>
</div>

<div class="section">
    <h2>Send to Claude</h2>
    <textarea id="claudeMessage" placeholder="Describe what you're trying to do, paste errors, or ask questions..."></textarea>
    <button onclick="formatForClaude()">Format for Claude</button>
    <button onclick="clearAll()">Clear All</button>
</div>

<div class="section">
    <h2>API Endpoints</h2>
    <pre>
POST /error    - Send platform errors
POST /log      - Send general logs  
POST /chat     - Drop chat logs
POST /state    - Update platform state
GET  /summary  - Get everything for Claude
    </pre>
</div>

<script>
function dragOverHandler(ev) {
    ev.preventDefault();
}

function dropHandler(ev) {
    ev.preventDefault();
    
    if (ev.dataTransfer.items) {
        for (let i = 0; i < ev.dataTransfer.items.length; i++) {
            if (ev.dataTransfer.items[i].kind === 'file') {
                const file = ev.dataTransfer.items[i].getAsFile();
                uploadFile(file);
            }
        }
    }
}

function handleFileSelect(event) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
        uploadFile(files[i]);
    }
}

function uploadFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        fetch('/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                filename: file.name,
                content: content,
                timestamp: new Date().toISOString()
            })
        })
        .then(r => r.json())
        .then(data => {
            document.getElementById('fileStatus').innerHTML = 
                '<div class="status connected">✓ ' + file.name + ' uploaded</div>';
            refreshErrors();
        });
    };
    reader.readAsText(file);
}

function refreshErrors() {
    fetch('/summary')
        .then(r => r.json())
        .then(data => {
            const errorLog = document.getElementById('errorLog');
            errorLog.innerHTML = '';
            
            // Show recent errors
            if (data.errors && data.errors.length > 0) {
                data.errors.slice(-10).forEach(error => {
                    const div = document.createElement('div');
                    div.className = 'error';
                    div.textContent = `[${error.timestamp}] ${error.message}`;
                    errorLog.appendChild(div);
                });
            } else {
                errorLog.innerHTML = '<div class="info">No errors yet</div>';
            }
            
            // Update status
            if (data.chat_drops && data.chat_drops.length > 0) {
                document.getElementById('fileStatus').innerHTML += 
                    '<div class="info">Total files: ' + data.chat_drops.length + '</div>';
            }
        });
}

function formatForClaude() {
    const message = document.getElementById('claudeMessage').value;
    
    fetch('/summary')
        .then(r => r.json())
        .then(data => {
            let formatted = "=== PLATFORM BRIDGE DATA ===\\n\\n";
            
            if (message) {
                formatted += "USER MESSAGE:\\n" + message + "\\n\\n";
            }
            
            if (data.errors && data.errors.length > 0) {
                formatted += "RECENT ERRORS:\\n";
                data.errors.slice(-5).forEach(err => {
                    formatted += `- [${err.timestamp}] ${err.message}\\n`;
                });
                formatted += "\\n";
            }
            
            if (data.chat_drops && data.chat_drops.length > 0) {
                formatted += "CHAT FILES UPLOADED:\\n";
                data.chat_drops.forEach(chat => {
                    formatted += `- ${chat.filename} (${chat.message_count} messages)\\n`;
                });
                formatted += "\\n";
            }
            
            if (data.platform_state && Object.keys(data.platform_state).length > 0) {
                formatted += "PLATFORM STATE:\\n";
                formatted += JSON.stringify(data.platform_state, null, 2) + "\\n";
            }
            
            // Copy to clipboard
            navigator.clipboard.writeText(formatted).then(() => {
                alert('Formatted data copied to clipboard! Paste it to Claude.');
            });
        });
}

function clearAll() {
    if (confirm('Clear all data?')) {
        fetch('/clear', {method: 'POST'})
            .then(() => {
                document.getElementById('errorLog').innerHTML = '<div class="info">Cleared</div>';
                document.getElementById('fileStatus').innerHTML = '';
            });
    }
}

// Auto-refresh errors
setInterval(refreshErrors, 5000);
refreshErrors();
</script>

</body>
</html>"""

class BridgeHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(HTML.encode())
            
        elif self.path == '/summary':
            # Get summary of everything
            summary = {
                'errors': BRIDGE_DATA['errors'][-20:],  # Last 20 errors
                'logs': BRIDGE_DATA['logs'][-50:],      # Last 50 logs
                'chat_drops': [
                    {
                        'filename': chat['filename'],
                        'timestamp': chat['timestamp'],
                        'message_count': len(chat.get('messages', []))
                    }
                    for chat in BRIDGE_DATA['chat_drops']
                ],
                'platform_state': BRIDGE_DATA['platform_state']
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(summary).encode())
            
        else:
            self.send_error(404)
            
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
        
        try:
            data = json.loads(post_data)
        except:
            data = {'raw': post_data.decode('utf-8', errors='ignore')}
            
        if self.path == '/error':
            # Log error from platform
            error_entry = {
                'timestamp': datetime.now().isoformat(),
                'message': data.get('message', 'Unknown error'),
                'stack': data.get('stack', ''),
                'source': data.get('source', 'platform')
            }
            BRIDGE_DATA['errors'].append(error_entry)
            
            # Keep last 100 errors
            BRIDGE_DATA['errors'] = BRIDGE_DATA['errors'][-100:]
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'logged'}).encode())
            
        elif self.path == '/log':
            # General logging
            log_entry = {
                'timestamp': datetime.now().isoformat(),
                'level': data.get('level', 'info'),
                'message': data.get('message', ''),
                'data': data.get('data', {})
            }
            BRIDGE_DATA['logs'].append(log_entry)
            
            # Keep last 1000 logs
            BRIDGE_DATA['logs'] = BRIDGE_DATA['logs'][-1000:]
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'logged'}).encode())
            
        elif self.path == '/chat':
            # Process chat drop
            content = data.get('content', '')
            
            # Try to parse the chat content
            messages = []
            try:
                # Try JSON first
                chat_data = json.loads(content)
                if isinstance(chat_data, list):
                    messages = chat_data
                elif isinstance(chat_data, dict) and 'messages' in chat_data:
                    messages = chat_data['messages']
            except:
                # Fall back to line-by-line
                messages = [{'text': line} for line in content.split('\n') if line.strip()]
                
            chat_entry = {
                'filename': data.get('filename', 'unknown'),
                'timestamp': data.get('timestamp', datetime.now().isoformat()),
                'messages': messages,
                'message_count': len(messages)
            }
            
            BRIDGE_DATA['chat_drops'].append(chat_entry)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'received',
                'messages': len(messages)
            }).encode())
            
        elif self.path == '/state':
            # Update platform state
            BRIDGE_DATA['platform_state'].update(data)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'updated'}).encode())
            
        elif self.path == '/clear':
            # Clear all data
            BRIDGE_DATA['errors'] = []
            BRIDGE_DATA['logs'] = []
            BRIDGE_DATA['chat_drops'] = []
            BRIDGE_DATA['platform_state'] = {}
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'cleared'}).encode())
            
        else:
            self.send_error(404)
            
    def do_OPTIONS(self):
        # Handle CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
    def log_message(self, format, *args):
        # Log to console
        print(f"[BRIDGE] {format % args}")

# Create example integration script
integration_script = '''// ADD THIS TO YOUR PLATFORM CODE

// Send errors to Claude Bridge
window.onerror = function(msg, url, line, col, error) {
    fetch('http://localhost:7777/error', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            message: msg,
            stack: error ? error.stack : '',
            source: url + ':' + line + ':' + col
        })
    });
};

// Send logs
function logToBridge(level, message, data) {
    fetch('http://localhost:7777/log', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            level: level,
            message: message,
            data: data || {}
        })
    });
}

// Update platform state
function updateBridgeState(state) {
    fetch('http://localhost:7777/state', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(state)
    });
}

// Example usage:
logToBridge('info', 'Game started');
logToBridge('error', 'Failed to load assets');
updateBridgeState({users_online: 42, games_active: 5});
'''

# Save integration script
with open('bridge-integration.js', 'w') as f:
    f.write(integration_script)

# Start server
with socketserver.TCPServer(("", PORT), BridgeHandler) as httpd:
    httpd.allow_reuse_address = True
    
    print(f"\n🌉 CLAUDE BRIDGE RUNNING AT: http://localhost:{PORT}\n")
    print("This lets your platform talk to Claude:")
    print("1. Drop chat logs at http://localhost:7777")
    print("2. Send errors/logs via API")
    print("3. Click 'Format for Claude' to get data")
    print("4. Paste formatted data to Claude\n")
    print("Integration code saved to: bridge-integration.js\n")
    print("Press Ctrl+C to stop\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nBridge stopped")