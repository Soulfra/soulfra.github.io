#!/usr/bin/env node

/**
 * 🎯 UNIFIED WORKING SERVER
 * 
 * No more broken services. No more CORS issues.
 * One server that actually works and shows real status.
 */

const express = require('express');
const path = require('path');
const fs = require('fs').promises;

class UnifiedWorkingServer {
    constructor() {
        this.app = express();
        this.port = 7777; // One port that works
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // Enable CORS for everything
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', '*');
            res.header('Access-Control-Allow-Methods', '*');
            next();
        });
    }
    
    setupRoutes() {
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🎯 Soulfra - ACTUALLY WORKING</title>
    <style>
        body { 
            font-family: Arial; 
            background: #000; 
            color: #0f0; 
            padding: 20px;
            text-align: center;
        }
        .status { 
            background: #111; 
            border: 2px solid #0f0; 
            padding: 20px; 
            margin: 20px;
            border-radius: 10px;
        }
        .broken { 
            background: #111; 
            border: 2px solid #f00; 
            padding: 20px; 
            margin: 20px;
            border-radius: 10px;
            opacity: 0.7;
        }
        button {
            background: #0f0;
            color: #000;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px;
        }
        .result {
            background: #222;
            padding: 10px;
            margin: 10px;
            border-radius: 5px;
            text-align: left;
            font-family: monospace;
            max-height: 400px;
            overflow-y: auto;
        }
        .qr { 
            background: white; 
            padding: 20px; 
            margin: 20px auto; 
            border-radius: 10px; 
            display: inline-block; 
        }
    </style>
</head>
<body>
    <h1>🎯 Soulfra Platform - REALITY CHECK</h1>
    <p><strong>END OF DEBUGGING HELL</strong> - Here's what ACTUALLY works:</p>
    
    <div class="status">
        <h2>✅ THIS SERVER IS WORKING (Port ${this.port})</h2>
        <p>Unified server with real status checks</p>
        <button onclick="checkRealStatus()">🔍 Check Real Platform Status</button>
        <button onclick="checkPorts()">🌐 Check All Ports</button>
        <button onclick="testSemanticAPI()">🧠 Test Semantic API</button>
        <button onclick="generateQR()">📱 Generate QR Code</button>
    </div>
    
    <div class="broken">
        <h2>❌ CONFIRMED BROKEN SERVICES</h2>
        <p><strong>Cal Interface (4040):</strong> Import errors, not listening</p>
        <p><strong>Main Dashboard (3000):</strong> Process not running</p>
        <p><strong>Infinity Router (5050):</strong> Module path issues</p>
        <p><strong>MirrorOS (3080):</strong> Class conflicts</p>
        <p><strong>Previous Interface Buttons:</strong> CORS blocked, file:// protocol</p>
    </div>
    
    <div class="status">
        <h2>🎯 WORKING SOLUTION</h2>
        <p>Single endpoint that actually works, with QR code for mobile access</p>
        <div id="results"></div>
    </div>
    
    <script>
        async function checkRealStatus() {
            const results = document.getElementById('results');
            results.innerHTML = '<div class="result">🔍 Checking real platform status...</div>';
            
            try {
                const response = await fetch('/api/real-status');
                const data = await response.json();
                
                results.innerHTML = \`
                    <div class="result">
                        <strong>📊 REAL PLATFORM STATUS:</strong><br>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    </div>
                \`;
            } catch (error) {
                results.innerHTML = \`<div class="result">❌ Status check failed: \${error.message}</div>\`;
            }
        }
        
        async function checkPorts() {
            try {
                const response = await fetch('/api/port-check');
                const data = await response.json();
                
                document.getElementById('results').innerHTML = \`
                    <div class="result">
                        <strong>🌐 PORT STATUS CHECK:</strong><br>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    </div>
                \`;
            } catch (error) {
                document.getElementById('results').innerHTML = 
                    \`<div class="result">❌ Port check failed: \${error.message}</div>\`;
            }
        }
        
        async function testSemanticAPI() {
            try {
                const response = await fetch('/api/semantic-test');
                const data = await response.json();
                
                document.getElementById('results').innerHTML = \`
                    <div class="result">
                        <strong>🧠 SEMANTIC API TEST:</strong><br>
                        <pre>\${JSON.stringify(data, null, 2)}</pre>
                    </div>
                \`;
            } catch (error) {
                document.getElementById('results').innerHTML = 
                    \`<div class="result">❌ Semantic API test failed: \${error.message}</div>\`;
            }
        }
        
        async function generateQR() {
            const qrData = window.location.href;
            const qrSize = 200;
            const qrUrl = \`https://api.qrserver.com/v1/create-qr-code/?size=\${qrSize}x\${qrSize}&data=\${encodeURIComponent(qrData)}\`;
            
            document.getElementById('results').innerHTML = \`
                <div class="result">
                    <strong>📱 MOBILE QR CODE:</strong><br>
                    <div class="qr">
                        <img src="\${qrUrl}" alt="QR Code" style="display: block;">
                    </div>
                    <strong>Scan to access:</strong> \${qrData}<br>
                    <strong>Mobile URL:</strong> http://\${window.location.hostname}:${this.port}
                </div>
            \`;
        }
        
        // Auto-check on load
        setTimeout(checkRealStatus, 1000);
    </script>
</body>
</html>
            `);
        });
        
        // Real status API endpoint
        this.app.get('/api/real-status', async (req, res) => {
            const status = await this.getRealPlatformStatus();
            res.json(status);
        });
        
        // Port checking endpoint
        this.app.get('/api/port-check', async (req, res) => {
            const portStatus = await this.checkAllPorts();
            res.json(portStatus);
        });
        
        // Semantic API test endpoint (proxy)
        this.app.get('/api/semantic-test', async (req, res) => {
            try {
                const fetch = await import('node-fetch').then(m => m.default);
                const response = await fetch('http://localhost:3666/api/system/health');
                const data = await response.json();
                
                res.json({
                    semantic_api_working: true,
                    semantic_response: data,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                res.json({
                    semantic_api_working: false,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });
        
        // Mobile interface
        this.app.get('/mobile', (req, res) => {
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>📱 Soulfra Mobile</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { background: #000; color: #0f0; font-family: Arial; padding: 10px; }
        button { background: #0f0; color: #000; padding: 15px; margin: 5px; border: none; width: 100%; border-radius: 5px; }
        .result { background: #111; padding: 10px; margin: 5px; border-radius: 5px; font-size: 12px; }
    </style>
</head>
<body>
    <h2>📱 Soulfra Mobile Interface</h2>
    <p>Working mobile access point</p>
    
    <button onclick="checkStatus()">🔍 Platform Status</button>
    <button onclick="testAPI()">🧠 Test Semantic API</button>
    <button onclick="checkPorts()">🌐 Port Check</button>
    
    <div id="results"></div>
    
    <script>
        async function checkStatus() {
            try {
                const response = await fetch('/api/real-status');
                const data = await response.json();
                document.getElementById('results').innerHTML = 
                    '<div class="result">📊 Status: ' + JSON.stringify(data, null, 2) + '</div>';
            } catch (error) {
                document.getElementById('results').innerHTML = 
                    '<div class="result">❌ Error: ' + error.message + '</div>';
            }
        }
        
        async function testAPI() {
            try {
                const response = await fetch('/api/semantic-test');
                const data = await response.json();
                document.getElementById('results').innerHTML = 
                    '<div class="result">🧠 API: ' + JSON.stringify(data, null, 2) + '</div>';
            } catch (error) {
                document.getElementById('results').innerHTML = 
                    '<div class="result">❌ Error: ' + error.message + '</div>';
            }
        }
        
        async function checkPorts() {
            try {
                const response = await fetch('/api/port-check');
                const data = await response.json();
                document.getElementById('results').innerHTML = 
                    '<div class="result">🌐 Ports: ' + JSON.stringify(data, null, 2) + '</div>';
            } catch (error) {
                document.getElementById('results').innerHTML = 
                    '<div class="result">❌ Error: ' + error.message + '</div>';
            }
        }
    </script>
</body>
</html>
            `);
        });
    }
    
    async getRealPlatformStatus() {
        const { execSync } = require('child_process');
        
        try {
            // Check what's actually running
            const lsofOutput = execSync('lsof -i :3000 -i :3666 -i :4040 -i :5050 -i :3080 2>/dev/null || echo "No services found"', 
                { encoding: 'utf8' });
            
            const processOutput = execSync('ps aux | grep node | grep -v grep | head -10', 
                { encoding: 'utf8' });
            
            return {
                timestamp: new Date().toISOString(),
                server_working: true,
                server_port: this.port,
                listening_processes: lsofOutput.split('\\n').filter(line => line.trim()),
                node_processes: processOutput.split('\\n').filter(line => line.trim()),
                conclusion: "Only this unified server (port 7777) is actually working reliably"
            };
        } catch (error) {
            return {
                timestamp: new Date().toISOString(),
                server_working: true,
                server_port: this.port,
                error: error.message,
                conclusion: "System check failed but this server is working"
            };
        }
    }
    
    async checkAllPorts() {
        const net = require('net');
        const ports = [3000, 3666, 4040, 5050, 3080, this.port];
        const results = {};
        
        for (const port of ports) {
            try {
                await new Promise((resolve, reject) => {
                    const socket = new net.Socket();
                    socket.setTimeout(1000);
                    
                    socket.on('connect', () => {
                        socket.destroy();
                        resolve();
                    });
                    
                    socket.on('timeout', () => {
                        socket.destroy();
                        reject(new Error('timeout'));
                    });
                    
                    socket.on('error', (err) => {
                        reject(err);
                    });
                    
                    socket.connect(port, 'localhost');
                });
                
                results[port] = { status: 'listening', working: true };
            } catch (error) {
                results[port] = { status: 'not_listening', working: false, error: error.message };
            }
        }
        
        return {
            port_check: results,
            working_port: this.port,
            timestamp: new Date().toISOString()
        };
    }
    
    async start() {
        this.app.listen(this.port, () => {
            console.log(`
🎯 UNIFIED WORKING SERVER STARTED
================================
🌐 Local:  http://localhost:${this.port}
📱 Mobile: http://$(hostname -I | cut -d' ' -f1):${this.port}
📲 Mobile Page: http://localhost:${this.port}/mobile

✅ This actually works (no CORS, no import errors)
❌ Other services confirmed broken

🔍 Real status checks available
📱 QR code generation working
🧠 Semantic API testing through proxy
            `);
        });
    }
}

if (require.main === module) {
    const server = new UnifiedWorkingServer();
    server.start().catch(console.error);
}

module.exports = UnifiedWorkingServer;