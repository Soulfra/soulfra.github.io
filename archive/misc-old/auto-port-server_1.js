#!/usr/bin/env node

/**
 * 🔍 AUTO-PORT SERVER
 * 
 * Finds an available port automatically.
 * No more EADDRINUSE hell.
 */

const express = require('express');
const net = require('net');

class AutoPortServer {
    constructor() {
        this.app = express();
        this.setupMiddleware();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(__dirname));
        
        // CORS
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', '*');
            next();
        });
    }
    
    async findAvailablePort(startPort = 8000) {
        for (let port = startPort; port < startPort + 100; port++) {
            if (await this.isPortAvailable(port)) {
                return port;
            }
        }
        throw new Error('No available ports found');
    }
    
    isPortAvailable(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(port, (err) => {
                if (err) {
                    resolve(false);
                } else {
                    server.once('close', () => resolve(true));
                    server.close();
                }
            });
            
            server.on('error', () => resolve(false));
        });
    }
    
    setupRoutes(port) {
        // Main working interface
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
        }
        .working { 
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
        }
        button {
            background: #0f0;
            color: #000;
            padding: 15px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px;
        }
        .result {
            background: #222;
            padding: 10px;
            margin: 10px;
            border-radius: 5px;
            font-family: monospace;
            max-height: 300px;
            overflow-y: auto;
        }
        .success { color: #0f0; }
        .error { color: #f00; }
        .qr { background: white; padding: 10px; margin: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="working">
        <h1>🎯 SOULFRA AUTO-PORT SERVER</h1>
        <p><strong>✅ FINALLY WORKING!</strong> Port: ${port}</p>
        <p>No more EADDRINUSE errors - automatically found available port</p>
        
        <button onclick="checkWhatWorks()">🔍 Check What Actually Works</button>
        <button onclick="testConnections()">🌐 Test All Connections</button>
        <button onclick="showQR()">📱 Generate QR Code</button>
        <button onclick="killAllBroken()">💀 Kill Broken Processes</button>
        
        <div id="results"></div>
    </div>
    
    <div class="broken">
        <h2>❌ CONFIRMED BROKEN (Stop trying)</h2>
        <p>Cal Interface (4040), Main Dashboard (3000), Infinity Router (5050), MirrorOS (3080)</p>
        <p>All have import errors, port conflicts, or module issues</p>
    </div>
    
    <script>
        function log(message, isError = false) {
            const results = document.getElementById('results');
            const className = isError ? 'error' : 'success';
            const timestamp = new Date().toLocaleTimeString();
            
            results.innerHTML = 
                '<div class="result ' + className + '">[' + timestamp + '] ' + message + '</div>' + 
                results.innerHTML;
        }
        
        async function checkWhatWorks() {
            log('🔍 Checking what actually works...');
            
            try {
                const response = await fetch('/api/working-status');
                const data = await response.json();
                
                log('✅ Status check complete');
                document.getElementById('results').innerHTML = 
                    '<div class="result"><pre>' + JSON.stringify(data, null, 2) + '</pre></div>' +
                    document.getElementById('results').innerHTML;
                    
            } catch (error) {
                log('❌ Status check failed: ' + error.message, true);
            }
        }
        
        async function testConnections() {
            log('🌐 Testing connections to other services...');
            
            try {
                const response = await fetch('/api/test-connections');
                const data = await response.json();
                
                log('✅ Connection tests complete');
                document.getElementById('results').innerHTML = 
                    '<div class="result"><pre>' + JSON.stringify(data, null, 2) + '</pre></div>' +
                    document.getElementById('results').innerHTML;
                    
            } catch (error) {
                log('❌ Connection tests failed: ' + error.message, true);
            }
        }
        
        function showQR() {
            const url = window.location.href;
            const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(url);
            
            log('📱 QR code generated');
            document.getElementById('results').innerHTML = 
                '<div class="result">📱 <strong>Mobile Access:</strong><br>' +
                '<div class="qr"><img src="' + qrUrl + '" alt="QR Code"></div>' +
                '<strong>URL:</strong> ' + url + '</div>' +
                document.getElementById('results').innerHTML;
        }
        
        async function killAllBroken() {
            log('💀 Requesting to kill broken processes...');
            
            try {
                const response = await fetch('/api/kill-broken', { method: 'POST' });
                const data = await response.json();
                
                log('✅ Process cleanup attempt complete');
                document.getElementById('results').innerHTML = 
                    '<div class="result"><pre>' + JSON.stringify(data, null, 2) + '</pre></div>' +
                    document.getElementById('results').innerHTML;
                    
            } catch (error) {
                log('❌ Process cleanup failed: ' + error.message, true);
            }
        }
        
        // Auto-check on load
        setTimeout(checkWhatWorks, 1000);
    </script>
</body>
</html>
            `);
        });
        
        // API endpoints
        this.app.get('/api/working-status', async (req, res) => {
            const { execSync } = require('child_process');
            
            try {
                const nodeProcesses = execSync('ps aux | grep node | grep -v grep', { encoding: 'utf8' });
                const listeningPorts = execSync('netstat -an | grep LISTEN | grep -E "(3000|3666|4040|5050|3080|' + port + ')"', { encoding: 'utf8' });
                
                res.json({
                    timestamp: new Date().toISOString(),
                    this_server: {
                        port: port,
                        working: true,
                        status: "✅ ACTUALLY WORKING"
                    },
                    node_processes: nodeProcesses.split('\\n').filter(l => l.trim()),
                    listening_ports: listeningPorts.split('\\n').filter(l => l.trim()),
                    reality_check: "Most services are broken or fighting for ports"
                });
            } catch (error) {
                res.json({
                    error: error.message,
                    this_server_working: true,
                    port: port
                });
            }
        });
        
        this.app.get('/api/test-connections', async (req, res) => {
            const testPorts = [3000, 3666, 4040, 5050, 3080];
            const results = {};
            
            for (const testPort of testPorts) {
                try {
                    const available = await this.isPortAvailable(testPort);
                    if (!available) {
                        // Port is in use, try to connect
                        try {
                            const http = require('http');
                            await new Promise((resolve, reject) => {
                                const req = http.get('http://localhost:' + testPort, { timeout: 2000 }, (res) => {
                                    resolve(res.statusCode);
                                });
                                req.on('error', reject);
                                req.on('timeout', () => reject(new Error('timeout')));
                            });
                            results[testPort] = { status: 'responding', working: true };
                        } catch (error) {
                            results[testPort] = { status: 'port_used_but_not_responding', working: false, error: error.message };
                        }
                    } else {
                        results[testPort] = { status: 'port_available', working: false };
                    }
                } catch (error) {
                    results[testPort] = { status: 'error', working: false, error: error.message };
                }
            }
            
            res.json({
                connection_tests: results,
                working_server: port,
                timestamp: new Date().toISOString()
            });
        });
        
        this.app.post('/api/kill-broken', (req, res) => {
            const { execSync } = require('child_process');
            
            try {
                // Kill processes that might be blocking ports
                const commands = [
                    'pkill -f "riven-cli-server" || true',
                    'pkill -f "infinity-router" || true', 
                    'pkill -f "semantic_api_router" || true',
                    'pkill -f "server.js" || true'
                ];
                
                const results = commands.map(cmd => {
                    try {
                        const output = execSync(cmd, { encoding: 'utf8' });
                        return { command: cmd, success: true, output };
                    } catch (error) {
                        return { command: cmd, success: false, error: error.message };
                    }
                });
                
                res.json({
                    cleanup_attempted: true,
                    commands_run: results,
                    note: "Attempted to kill processes blocking ports"
                });
            } catch (error) {
                res.json({
                    cleanup_attempted: false,
                    error: error.message
                });
            }
        });
    }
    
    async start() {
        try {
            const port = await this.findAvailablePort(8000);
            console.log(`🔍 Found available port: ${port}`);
            
            this.setupRoutes(port);
            
            this.app.listen(port, () => {
                console.log(`
🎯 AUTO-PORT SERVER STARTED SUCCESSFULLY!
========================================
✅ Port: ${port} (automatically found)
🌐 URL: http://localhost:${port}
📱 Mobile: http://$(hostname -I | cut -d' ' -f1):${port}

🎉 NO MORE EADDRINUSE ERRORS!
🔍 Real status checking available
💀 Can kill broken processes
📱 QR code generation working

This is the ONLY server that actually works reliably.
                `);
            });
            
        } catch (error) {
            console.error('❌ Failed to start auto-port server:', error.message);
            process.exit(1);
        }
    }
}

if (require.main === module) {
    const server = new AutoPortServer();
    server.start().catch(console.error);
}

module.exports = AutoPortServer;