#!/usr/bin/env node

/**
 * 🔐 Master Authentication Launcher
 * 
 * ONE QR SCAN → MULTIPLE SYSTEMS LAUNCHED
 * No more recursive debugging hell.
 * Hidden login that launches 2-4 systems simultaneously.
 */

const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const QRCode = require('qrcode');
const net = require('net');

class MasterAuthLauncher {
    constructor() {
        this.app = express();
        this.port = 9999; // Master control port
        this.authenticatedSessions = new Map();
        this.runningServices = new Map();
        
        // Master QR codes that unlock everything
        this.masterCodes = [
            'qr-founder-0000',
            'qr-riven-001', 
            'qr-user-0821',
            'master-unlock-2025'
        ];
        
        // Services to launch after authentication
        this.serviceStack = [
            { name: 'Semantic API', script: 'semantic-graph/semantic_api_router.js', port: 3666 },
            { name: 'Cal Interface', script: 'runtime/riven-cli-server.js', port: 4040 },
            { name: 'Main Dashboard', script: 'server.js', port: 3000 }
        ];
        
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // Master QR generation endpoint
        this.app.get('/', async (req, res) => {
            const sessionId = Date.now().toString();
            const qrData = `http://localhost:${this.port}/auth/${sessionId}`;
            
            try {
                const qrCode = await QRCode.toDataURL(qrData);
                
                res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🔐 Soulfra Master Authentication</title>
    <style>
        body { font-family: Arial; text-align: center; background: #000; color: #0f0; }
        .qr { margin: 20px; }
        .status { background: #111; padding: 20px; border-radius: 10px; }
        .live { color: #0f0; }
        .offline { color: #f00; }
    </style>
</head>
<body>
    <h1>🔐 Soulfra Master Authentication</h1>
    <p>Scan QR code to launch all systems</p>
    
    <div class="qr">
        <img src="${qrCode}" alt="Master QR Code" />
        <p>Session: ${sessionId}</p>
    </div>
    
    <div class="status">
        <h3>System Status:</h3>
        <div id="services">Loading...</div>
    </div>
    
    <script>
        setInterval(async () => {
            const response = await fetch('/status');
            const data = await response.json();
            
            document.getElementById('services').innerHTML = data.services.map(s => 
                \`<div class="\${s.running ? 'live' : 'offline'}">
                    \${s.name}: \${s.running ? '✅ LIVE' : '❌ OFFLINE'}
                    \${s.running ? \` - <a href="http://localhost:\${s.port}" target="_blank">Access</a>\` : ''}
                </div>\`
            ).join('');
        }, 2000);
    </script>
</body>
</html>
                `);
            } catch (error) {
                res.status(500).send('QR generation failed');
            }
        });
        
        // Authentication endpoint (QR scan lands here)
        this.app.get('/auth/:sessionId', async (req, res) => {
            const { sessionId } = req.params;
            const { code } = req.query;
            
            res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🔐 Master Authentication</title>
    <style>
        body { font-family: Arial; text-align: center; background: #000; color: #0f0; }
        input { padding: 10px; margin: 10px; background: #111; color: #0f0; border: 1px solid #0f0; }
        button { padding: 10px 20px; background: #0f0; color: #000; border: none; cursor: pointer; }
        .success { color: #0f0; }
        .error { color: #f00; }
    </style>
</head>
<body>
    <h1>🔐 Enter Master Code</h1>
    <form onsubmit="authenticate(event)">
        <input type="text" id="masterCode" placeholder="Enter master authentication code" required />
        <button type="submit">🚀 Launch All Systems</button>
    </form>
    <div id="result"></div>
    
    <script>
        async function authenticate(event) {
            event.preventDefault();
            const code = document.getElementById('masterCode').value;
            const result = document.getElementById('result');
            
            try {
                const response = await fetch('/launch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: '${sessionId}', code })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = \`
                        <div class="success">
                            <h2>🎉 Authentication Successful!</h2>
                            <p>Launching all systems...</p>
                            <div>
                                \${data.services.map(s => \`<a href="http://localhost:\${s.port}" target="_blank">\${s.name}</a>\`).join(' | ')}
                            </div>
                        </div>
                    \`;
                } else {
                    result.innerHTML = \`<div class="error">❌ \${data.error}</div>\`;
                }
            } catch (error) {
                result.innerHTML = \`<div class="error">❌ Authentication failed</div>\`;
            }
        }
    </script>
</body>
</html>
            `);
        });
        
        // Launch all systems endpoint
        this.app.post('/launch', async (req, res) => {
            const { sessionId, code } = req.body;
            
            // Validate master code
            if (!this.masterCodes.includes(code)) {
                return res.json({ success: false, error: 'Invalid master code' });
            }
            
            console.log(`🔐 Master authentication successful for session ${sessionId}`);
            console.log(`🚀 Launching all systems...`);
            
            // Mark session as authenticated
            this.authenticatedSessions.set(sessionId, {
                authenticated: true,
                timestamp: Date.now(),
                code: code
            });
            
            // Launch all services
            const launchedServices = await this.launchAllServices();
            
            // Save session info
            await this.saveSessionInfo(sessionId, launchedServices);
            
            res.json({
                success: true,
                sessionId,
                services: launchedServices,
                message: 'All systems launched successfully'
            });
        });
        
        // Status endpoint
        this.app.get('/status', async (req, res) => {
            const serviceStatus = await Promise.all(
                this.serviceStack.map(async (service) => {
                    const isRunning = this.runningServices.has(service.name);
                    return {
                        name: service.name,
                        port: service.port,
                        running: isRunning
                    };
                })
            );
            
            res.json({
                services: serviceStatus,
                authenticated_sessions: this.authenticatedSessions.size,
                uptime: process.uptime()
            });
        });
    }
    
    async launchAllServices() {
        const launched = [];
        
        for (const service of this.serviceStack) {
            try {
                console.log(`🚀 Starting ${service.name}...`);
                
                const childProcess = spawn('node', [service.script], {
                    stdio: 'pipe',
                    cwd: __dirname
                });
                
                childProcess.stdout.on('data', (data) => {
                    console.log(`📡 ${service.name}: ${data.toString().trim()}`);
                });
                
                childProcess.stderr.on('data', (data) => {
                    console.log(`❌ ${service.name} ERROR: ${data.toString().trim()}`);
                });
                
                childProcess.on('exit', (code) => {
                    console.log(`🛑 ${service.name} exited with code ${code}`);
                    this.runningServices.delete(service.name);
                });
                
                this.runningServices.set(service.name, {
                    process: childProcess,
                    service,
                    startTime: Date.now()
                });
                
                launched.push({
                    name: service.name,
                    port: service.port,
                    status: 'launched'
                });
                
                // Wait between launches
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ Failed to launch ${service.name}:`, error.message);
                launched.push({
                    name: service.name,
                    port: service.port,
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        return launched;
    }
    
    async saveSessionInfo(sessionId, services) {
        const sessionInfo = {
            sessionId,
            timestamp: new Date().toISOString(),
            authenticated: true,
            services,
            access_urls: services.map(s => `http://localhost:${s.port}`)
        };
        
        await fs.writeFile('./master-session.json', JSON.stringify(sessionInfo, null, 2));
    }
    
    async start() {
        this.app.listen(this.port, () => {
            console.log(`
🔐 SOULFRA MASTER AUTHENTICATION SYSTEM
=====================================
🌐 Access: http://localhost:${this.port}
📱 Mobile: http://$(hostname -I | cut -d' ' -f1):${this.port}

🔑 Master Authentication Codes:
   ${this.masterCodes.join(', ')}

🚀 Ready to launch ${this.serviceStack.length} systems on authentication
            `);
        });
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Shutting down master system...');
            
            for (const [name, service] of this.runningServices.entries()) {
                console.log(`🛑 Stopping ${name}...`);
                service.process.kill('SIGTERM');
            }
            
            process.exit(0);
        });
    }
}

if (require.main === module) {
    const launcher = new MasterAuthLauncher();
    launcher.start().catch(console.error);
}

module.exports = MasterAuthLauncher;