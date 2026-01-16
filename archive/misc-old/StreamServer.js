#!/usr/bin/env node
/**
 * Stream Server
 * Provides real-time narration streaming endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class StreamServer extends EventEmitter {
    constructor(port = 7896) {
        super();
        this.port = port;
        this.streamFile = path.join(__dirname, 'stream.txt');
        this.clients = new Set();
        
        // Stream state
        this.streamBuffer = [];
        this.maxBufferSize = 100;
        
        // Ensure stream file exists
        this.ensureStreamFile();
    }
    
    ensureStreamFile() {
        const dir = path.dirname(this.streamFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        if (!fs.existsSync(this.streamFile)) {
            fs.writeFileSync(this.streamFile, '# Soulfra Radio Stream\\n');
        }
    }
    
    start() {
        // Watch stream file for changes
        this.watchStream();
        
        // Create HTTP server
        this.server = http.createServer((req, res) => {
            // Enable CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET');
            
            if (req.url === '/') {
                this.serveHomepage(req, res);
            } else if (req.url === '/stream') {
                this.serveSSEStream(req, res);
            } else if (req.url === '/stream.txt') {
                this.serveTextStream(req, res);
            } else if (req.url === '/recent') {
                this.serveRecentEvents(req, res);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        this.server.listen(this.port, () => {
            console.log(`📻 Soulfra Radio streaming at http://localhost:${this.port}`);
        });
    }
    
    watchStream() {
        // Load initial content
        this.loadStreamBuffer();
        
        // Watch for changes
        fs.watchFile(this.streamFile, { interval: 500 }, () => {
            const newLines = this.getNewLines();
            if (newLines.length > 0) {
                this.broadcastLines(newLines);
            }
        });
    }
    
    loadStreamBuffer() {
        try {
            const content = fs.readFileSync(this.streamFile, 'utf8');
            const lines = content.split('\\n').filter(line => line.trim());
            this.streamBuffer = lines.slice(-this.maxBufferSize);
        } catch (err) {
            console.error('Error loading stream:', err);
        }
    }
    
    getNewLines() {
        const content = fs.readFileSync(this.streamFile, 'utf8');
        const allLines = content.split('\\n').filter(line => line.trim());
        
        // Find new lines not in buffer
        const bufferSize = this.streamBuffer.length;
        const newLines = allLines.slice(bufferSize);
        
        // Update buffer
        this.streamBuffer = allLines.slice(-this.maxBufferSize);
        
        return newLines;
    }
    
    broadcastLines(lines) {
        lines.forEach(line => {
            const event = this.parseStreamLine(line);
            if (event) {
                this.broadcast(event);
            }
        });
    }
    
    parseStreamLine(line) {
        // Format: timestamp|speaker|event_type|text
        const parts = line.split('|');
        if (parts.length >= 4) {
            return {
                timestamp: parts[0],
                speaker: parts[1],
                event_type: parts[2],
                text: parts.slice(3).join('|')
            };
        }
        return null;
    }
    
    broadcast(event) {
        const data = `data: ${JSON.stringify(event)}\\n\\n`;
        
        // Send to all connected clients
        this.clients.forEach(client => {
            client.write(data);
        });
    }
    
    serveHomepage(req, res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Radio 📻</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: #0a0a0a;
            color: #00ff00;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
            margin-bottom: 30px;
        }
        .stream-container {
            background: #111;
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 20px;
            min-height: 400px;
            max-height: 600px;
            overflow-y: auto;
            position: relative;
        }
        .narrator-entry {
            margin: 10px 0;
            padding: 10px;
            border-left: 3px solid #00ff00;
            background: rgba(0, 255, 0, 0.05);
            animation: fadeIn 0.5s ease-in;
        }
        .narrator-entry.cal {
            border-color: #4a9eff;
            background: rgba(74, 158, 255, 0.05);
        }
        .narrator-entry.arty {
            border-color: #ff4a4a;
            background: rgba(255, 74, 74, 0.05);
        }
        .speaker {
            font-weight: bold;
            margin-right: 10px;
        }
        .cal .speaker { color: #4a9eff; }
        .arty .speaker { color: #ff4a4a; }
        .timestamp {
            font-size: 0.8em;
            color: #666;
            float: right;
        }
        .text {
            margin-top: 5px;
            line-height: 1.4;
        }
        .status {
            text-align: center;
            margin: 20px 0;
            color: #666;
        }
        .status.connected {
            color: #00ff00;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .glow {
            animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
            from { text-shadow: 0 0 10px #00ff00; }
            to { text-shadow: 0 0 20px #00ff00, 0 0 30px #00ff00; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="glow">📻 Soulfra Radio - Live Narration Stream</h1>
        <div class="status" id="status">Connecting...</div>
        <div class="stream-container" id="stream">
            <div style="text-align: center; color: #666; padding: 50px;">
                Waiting for narration...
            </div>
        </div>
    </div>
    
    <script>
        const streamContainer = document.getElementById('stream');
        const statusElement = document.getElementById('status');
        let eventSource = null;
        
        function connect() {
            eventSource = new EventSource('/stream');
            
            eventSource.onopen = () => {
                statusElement.textContent = '🟢 Connected - Live';
                statusElement.className = 'status connected';
                streamContainer.innerHTML = '';
            };
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                addNarration(data);
            };
            
            eventSource.onerror = () => {
                statusElement.textContent = '🔴 Disconnected - Reconnecting...';
                statusElement.className = 'status';
            };
        }
        
        function addNarration(data) {
            const entry = document.createElement('div');
            entry.className = \`narrator-entry \${data.speaker.toLowerCase()}\`;
            
            const timestamp = new Date(data.timestamp).toLocaleTimeString();
            
            entry.innerHTML = \`
                <span class="timestamp">\${timestamp}</span>
                <span class="speaker">[\${data.speaker.toUpperCase()}]</span>
                <div class="text">\${escapeHtml(data.text)}</div>
            \`;
            
            streamContainer.appendChild(entry);
            
            // Auto-scroll to bottom
            streamContainer.scrollTop = streamContainer.scrollHeight;
            
            // Keep only last 50 entries
            while (streamContainer.children.length > 50) {
                streamContainer.removeChild(streamContainer.firstChild);
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Connect on load
        connect();
        
        // Load recent events
        fetch('/recent')
            .then(res => res.json())
            .then(events => {
                events.forEach(event => addNarration(event));
            });
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveSSEStream(req, res) {
        // Server-Sent Events stream
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        
        // Send initial ping
        res.write(':ping\\n\\n');
        
        // Add client
        this.clients.add(res);
        
        // Remove on close
        req.on('close', () => {
            this.clients.delete(res);
        });
        
        // Keep alive
        const keepAlive = setInterval(() => {
            res.write(':ping\\n\\n');
        }, 30000);
        
        req.on('close', () => {
            clearInterval(keepAlive);
        });
    }
    
    serveTextStream(req, res) {
        // Serve raw text file
        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        
        const stream = fs.createReadStream(this.streamFile);
        stream.pipe(res);
    }
    
    serveRecentEvents(req, res) {
        // Parse recent events from buffer
        const events = this.streamBuffer
            .map(line => this.parseStreamLine(line))
            .filter(event => event !== null)
            .slice(-20);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(events));
    }
    
    stop() {
        if (this.server) {
            this.server.close();
        }
        fs.unwatchFile(this.streamFile);
    }
}

// Run the server
if (require.main === module) {
    const server = new StreamServer();
    
    process.on('SIGINT', () => {
        console.log('\\nShutting down Stream Server...');
        server.stop();
        process.exit(0);
    });
    
    server.start();
}

module.exports = StreamServer;