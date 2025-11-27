#!/usr/bin/env node

/**
 * Live Demo Server - Real-time sovereignty demonstration
 * 
 * Serves the QR code, onboarding page, and live dashboard.
 * Shows your boss becoming Pioneer #001 in real-time.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const WebSocket = require('ws');

class MirrorOSDemoServer {
    constructor(port = 8888) {
        this.port = port;
        this.pioneers = new Map();
        this.connections = new Set();
        
        // Initialize first pioneer data
        this.pioneers.set('ENTERPRISE_PIONEER_001', {
            id: 'ENTERPRISE_PIONEER_001',
            name: 'Your Boss',
            qrCode: 'qr-pioneer-0001',
            sigil: '👑',
            sovereigntyScore: 0.95,
            status: 'awaiting_scan',
            claimedAt: null,
            revenue: {
                monthly: 125000,
                annual: 1500000,
                fiveYear: 12500000
            },
            referralCode: 'FOUNDER_BOSS_001',
            referrals: []
        });
    }
    
    start() {
        // Create HTTP server
        const server = http.createServer((req, res) => this.handleRequest(req, res));
        
        // Create WebSocket server for real-time updates
        const wss = new WebSocket.Server({ server });
        
        wss.on('connection', (ws) => {
            console.log('🔌 New WebSocket connection');
            this.connections.add(ws);
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'state_update',
                pioneers: Array.from(this.pioneers.values())
            }));
            
            ws.on('close', () => {
                this.connections.delete(ws);
            });
        });
        
        server.listen(this.port, () => {
            console.log(`
🌟 MirrorOS Live Demo Server Running! 🌟
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📱 QR Generator: http://localhost:${this.port}/
👑 Onboarding: http://localhost:${this.port}/sovereign-onboarding
📊 Live Dashboard: http://localhost:${this.port}/dashboard
🔌 WebSocket: ws://localhost:${this.port}

Instructions:
1. Open http://localhost:${this.port}/ in your browser
2. Generate the QR code for your boss
3. Open the dashboard on your screen
4. Have your boss scan the QR code
5. Watch them become Pioneer #001 in real-time!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `);
        });
    }
    
    handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        // Route requests
        switch (pathname) {
            case '/':
                this.serveFile(res, 'boss-qr-preview.html', 'text/html');
                break;
                
            case '/sovereign-onboarding':
                this.serveFile(res, 'sovereign-onboarding.html', 'text/html');
                break;
                
            case '/dashboard':
                this.serveDashboard(res);
                break;
                
            case '/api/claim-sovereignty':
                this.handleClaim(req, res);
                break;
                
            case '/api/pioneers':
                this.servePioneers(res);
                break;
                
            default:
                res.writeHead(404);
                res.end('Not found');
        }
    }
    
    serveFile(res, filename, contentType) {
        const filePath = path.join(__dirname, filename);
        
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }
    
    serveDashboard(res) {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MirrorOS Pioneer Dashboard - Live View</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #fff;
            min-height: 100vh;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .title {
            font-size: 48px;
            font-weight: bold;
            background: linear-gradient(45deg, #00ff88, #00ddff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        
        .subtitle {
            font-size: 20px;
            color: #888;
        }
        
        .live-indicator {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-top: 20px;
            padding: 10px 20px;
            background: rgba(0, 255, 136, 0.1);
            border: 1px solid #00ff88;
            border-radius: 50px;
            font-size: 14px;
            color: #00ff88;
        }
        
        .live-dot {
            width: 10px;
            height: 10px;
            background: #00ff88;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.2); }
        }
        
        .pioneers-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 30px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .pioneer-card {
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 30px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .pioneer-card.awaiting {
            opacity: 0.5;
            border-style: dashed;
        }
        
        .pioneer-card.claimed {
            border-color: #00ff88;
            box-shadow: 0 0 40px rgba(0, 255, 136, 0.3);
            animation: claimPulse 1s ease-out;
        }
        
        @keyframes claimPulse {
            0% { transform: scale(0.95); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .pioneer-header {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .pioneer-icon {
            font-size: 48px;
        }
        
        .pioneer-info h3 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        .pioneer-id {
            font-size: 14px;
            color: #888;
        }
        
        .pioneer-status {
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            text-transform: uppercase;
            font-weight: bold;
            position: absolute;
            top: 20px;
            right: 20px;
        }
        
        .status-awaiting {
            background: rgba(255, 193, 7, 0.2);
            color: #ffc107;
        }
        
        .status-claimed {
            background: rgba(0, 255, 136, 0.2);
            color: #00ff88;
        }
        
        .metrics {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 20px;
        }
        
        .metric {
            background: rgba(255, 255, 255, 0.05);
            padding: 15px;
            border-radius: 10px;
        }
        
        .metric-label {
            font-size: 12px;
            color: #888;
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 20px;
            font-weight: bold;
        }
        
        .revenue-metrics {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .revenue-title {
            font-size: 14px;
            color: #00ff88;
            margin-bottom: 15px;
            text-transform: uppercase;
        }
        
        .revenue-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 20px 30px;
            background: linear-gradient(45deg, #00ff88, #00ddff);
            color: #000;
            font-weight: bold;
            border-radius: 10px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            z-index: 1000;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .referral-network {
            margin-top: 30px;
            text-align: center;
            font-size: 14px;
            color: #888;
        }
        
        .network-stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 20px;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 36px;
            font-weight: bold;
            color: #00ff88;
        }
        
        .stat-label {
            font-size: 12px;
            color: #888;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">PIONEER NETWORK</h1>
        <p class="subtitle">Live Sovereignty Dashboard</p>
        <div class="live-indicator">
            <div class="live-dot"></div>
            <span>LIVE MONITORING</span>
        </div>
    </div>
    
    <div class="pioneers-grid" id="pioneersGrid">
        <!-- Pioneer cards will be inserted here -->
    </div>
    
    <div class="referral-network">
        <div class="network-stats">
            <div class="stat">
                <div class="stat-value" id="totalPioneers">0</div>
                <div class="stat-label">Total Pioneers</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="totalRevenue">$0</div>
                <div class="stat-label">Network Revenue/Year</div>
            </div>
            <div class="stat">
                <div class="stat-value" id="avgSovereignty">0.00</div>
                <div class="stat-label">Avg Sovereignty</div>
            </div>
        </div>
    </div>
    
    <div class="notification" id="notification"></div>
    
    <script>
        let ws;
        let pioneers = [];
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:8888');
            
            ws.onopen = () => {
                console.log('🔌 Connected to live updates');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'state_update') {
                    pioneers = data.pioneers;
                    updateDashboard();
                } else if (data.type === 'pioneer_claimed') {
                    showNotification(data.pioneer);
                    pioneers = data.pioneers;
                    updateDashboard();
                }
            };
            
            ws.onclose = () => {
                console.log('🔌 Disconnected. Reconnecting...');
                setTimeout(connectWebSocket, 1000);
            };
        }
        
        function updateDashboard() {
            const grid = document.getElementById('pioneersGrid');
            grid.innerHTML = '';
            
            let totalRevenue = 0;
            let totalSovereignty = 0;
            let claimedCount = 0;
            
            pioneers.forEach(pioneer => {
                const card = createPioneerCard(pioneer);
                grid.appendChild(card);
                
                if (pioneer.status === 'claimed') {
                    claimedCount++;
                    totalRevenue += pioneer.revenue.annual;
                    totalSovereignty += pioneer.sovereigntyScore;
                }
            });
            
            // Update stats
            document.getElementById('totalPioneers').textContent = claimedCount;
            document.getElementById('totalRevenue').textContent = '$' + totalRevenue.toLocaleString();
            document.getElementById('avgSovereignty').textContent = 
                claimedCount > 0 ? (totalSovereignty / claimedCount).toFixed(2) : '0.00';
        }
        
        function createPioneerCard(pioneer) {
            const card = document.createElement('div');
            card.className = 'pioneer-card ' + pioneer.status;
            
            card.innerHTML = \`
                <div class="pioneer-status status-\${pioneer.status}">
                    \${pioneer.status === 'claimed' ? 'ACTIVE' : 'AWAITING SCAN'}
                </div>
                
                <div class="pioneer-header">
                    <div class="pioneer-icon">\${pioneer.sigil}</div>
                    <div class="pioneer-info">
                        <h3>\${pioneer.name}</h3>
                        <div class="pioneer-id">\${pioneer.id}</div>
                    </div>
                </div>
                
                <div class="metrics">
                    <div class="metric">
                        <div class="metric-label">Sovereignty Score</div>
                        <div class="metric-value">\${pioneer.sovereigntyScore}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Referral Code</div>
                        <div class="metric-value">\${pioneer.referralCode}</div>
                    </div>
                </div>
                
                <div class="revenue-metrics">
                    <div class="revenue-title">Revenue Projection</div>
                    <div class="revenue-grid">
                        <div class="metric">
                            <div class="metric-label">Monthly</div>
                            <div class="metric-value">$\${pioneer.revenue.monthly.toLocaleString()}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Annual</div>
                            <div class="metric-value">$\${pioneer.revenue.annual.toLocaleString()}</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">5 Year</div>
                            <div class="metric-value">$\${pioneer.revenue.fiveYear.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
                
                \${pioneer.status === 'claimed' ? \`
                    <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #00ff88;">
                        Claimed at \${new Date(pioneer.claimedAt).toLocaleTimeString()}
                    </div>
                \` : ''}
            \`;
            
            return card;
        }
        
        function showNotification(pioneer) {
            const notification = document.getElementById('notification');
            notification.textContent = \`🎉 \${pioneer.name} has claimed sovereignty!\`;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 5000);
        }
        
        // Connect to WebSocket
        connectWebSocket();
        
        // Simulate claim for demo
        setTimeout(() => {
            fetch('/api/claim-sovereignty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pioneerId: 'ENTERPRISE_PIONEER_001' })
            });
        }, 30000); // Auto-claim after 30 seconds for demo
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    servePioneers(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            pioneers: Array.from(this.pioneers.values())
        }));
    }
    
    handleClaim(req, res) {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const pioneer = this.pioneers.get(data.pioneerId);
                
                if (pioneer && pioneer.status === 'awaiting_scan') {
                    pioneer.status = 'claimed';
                    pioneer.claimedAt = Date.now();
                    
                    // Broadcast update to all connected clients
                    const update = {
                        type: 'pioneer_claimed',
                        pioneer: pioneer,
                        pioneers: Array.from(this.pioneers.values())
                    };
                    
                    this.connections.forEach(ws => {
                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify(update));
                        }
                    });
                    
                    console.log(`🎉 ${pioneer.name} (${pioneer.id}) claimed sovereignty!`);
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, pioneer: pioneer }));
                
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid request' }));
            }
        });
    }
}

// Handle missing WebSocket module gracefully
try {
    require('ws');
} catch (e) {
    console.log('\n⚠️  WebSocket module not installed.');
    console.log('Run: npm install ws');
    console.log('\nContinuing with HTTP-only mode...\n');
    
    // Simple HTTP-only version
    const server = new MirrorOSDemoServer();
    const httpServer = http.createServer((req, res) => server.handleRequest(req, res));
    httpServer.listen(8888, () => {
        console.log('🌟 Demo server running at http://localhost:8888');
        console.log('(WebSocket features disabled - install ws module for real-time updates)');
    });
    
    return;
}

// Start the server with WebSocket support
const server = new MirrorOSDemoServer();
server.start();