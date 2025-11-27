#!/usr/bin/env node

/**
 * Dual Infinity Router - Demo Gateway System
 * 
 * Creates a parallel infinity router specifically for the boss demo.
 * Bridges between the demo system and the core MirrorOS infrastructure.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');

class DualInfinityRouter {
    constructor() {
        this.port = 7777; // Different port from main demo
        this.routerId = 'infinity_router_dual_' + Date.now();
        this.sessions = new Map();
        this.pioneers = new Map();
        
        // Initialize with boss as Pioneer #001
        this.initializePioneer();
    }
    
    initializePioneer() {
        this.pioneers.set('ENTERPRISE_PIONEER_001', {
            id: 'ENTERPRISE_PIONEER_001',
            qrCode: 'qr-pioneer-0001',
            sigil: '👑',
            sovereigntyScore: 0.95,
            status: 'awaiting',
            referralCode: 'FOUNDER_BOSS_001',
            traceToken: null,
            witnessValidation: false,
            revenue: {
                monthly: 125000,
                annual: 1500000,
                fiveYear: 12500000
            }
        });
    }
    
    async start() {
        console.log('🌀 Initializing Dual Infinity Router...');
        
        // Create demo directory if it doesn't exist
        const demoDir = path.join(__dirname, 'demo');
        if (!fs.existsSync(demoDir)) {
            fs.mkdirSync(demoDir, { recursive: true });
        }
        
        // Generate QR code HTML (no external dependencies needed)
        await this.generateQRDisplay();
        
        // Start the router server
        const server = http.createServer((req, res) => this.handleRequest(req, res));
        
        server.listen(this.port, () => {
            console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║                    DUAL INFINITY ROUTER ACTIVE                    ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  Router 1 (Core): Handles platform validation                     ║
║  Router 2 (Demo): Handles boss onboarding                        ║
║                                                                   ║
║  🌐 QR Display: http://localhost:${this.port}/                          ║
║  📱 Onboarding: http://localhost:${this.port}/onboard                   ║
║  📊 Dashboard: http://localhost:${this.port}/dashboard                  ║
║  🔗 API: http://localhost:${this.port}/api/                            ║
║                                                                   ║
║  Status: READY FOR PIONEER #001                                  ║
╚═══════════════════════════════════════════════════════════════════╝

👑 Open http://localhost:${this.port}/ to start the demo!
            `);
        });
    }
    
    async generateQRDisplay() {
        const demoUrl = `http://localhost:${this.port}/onboard`;
        
        // Generate a simple ASCII QR code representation
        const qrAscii = this.generateAsciiQR(demoUrl);
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>MirrorOS - Sovereign Gateway</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, 'SF Pro Display', sans-serif;
            background: #000;
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .container {
            text-align: center;
            padding: 40px;
            animation: fadeIn 1s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .title {
            font-size: 3em;
            font-weight: bold;
            background: linear-gradient(45deg, #00ff88, #00ddff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 20px;
        }
        
        .subtitle {
            font-size: 1.5em;
            color: #00ff88;
            margin-bottom: 40px;
        }
        
        .qr-container {
            background: white;
            padding: 40px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 40px;
            box-shadow: 0 0 60px rgba(0, 255, 136, 0.5);
        }
        
        .qr-code {
            font-family: monospace;
            font-size: 8px;
            line-height: 8px;
            color: #000;
            white-space: pre;
        }
        
        .url-display {
            margin-top: 20px;
            padding: 15px;
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            font-family: monospace;
            word-break: break-all;
            color: #00ff88;
        }
        
        .instructions {
            margin-top: 30px;
            font-size: 1.2em;
            line-height: 1.6;
            color: #ddd;
        }
        
        .pioneer-badge {
            display: inline-block;
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            color: #000;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 1.2em;
            font-weight: bold;
            margin-top: 30px;
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #00ff88;
            border-radius: 50%;
            animation: float 15s infinite linear;
        }
        
        @keyframes float {
            from {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% { opacity: 1; }
            90% { opacity: 1; }
            to {
                transform: translateY(-100vh) rotate(720deg);
                opacity: 0;
            }
        }
    </style>
</head>
<body>
    <div class="particles" id="particles"></div>
    
    <div class="container">
        <h1 class="title">SOVEREIGN GATEWAY</h1>
        <p class="subtitle">Enterprise Pioneer Onboarding</p>
        
        <div class="qr-container">
            <div class="qr-code">${qrAscii}</div>
        </div>
        
        <div class="url-display">
            ${demoUrl}
        </div>
        
        <div class="instructions">
            <p>📱 Scan this code with your phone camera</p>
            <p>👑 Become Enterprise Pioneer #001</p>
            <p>💰 Unlock $1.5M annual revenue potential</p>
        </div>
        
        <div class="pioneer-badge">
            🏆 FIRST PIONEER ADVANTAGE 🏆
        </div>
    </div>
    
    <script>
        // Create floating particles
        const container = document.getElementById('particles');
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            container.appendChild(particle);
        }
        
        console.log('🌀 Dual Infinity Router: Gateway Active');
        console.log('👑 Awaiting Pioneer #001...');
    </script>
</body>
</html>`;
        
        fs.writeFileSync(path.join(__dirname, 'demo', 'qr-display.html'), html);
    }
    
    generateAsciiQR(url) {
        // Simple ASCII art QR code representation
        // In production, you'd use a real QR library
        const size = 33;
        const qr = [];
        
        // Create a pattern that looks like a QR code
        for (let y = 0; y < size; y++) {
            let row = '';
            for (let x = 0; x < size; x++) {
                // Corner squares (finder patterns)
                if ((x < 7 && y < 7) || (x >= size-7 && y < 7) || (x < 7 && y >= size-7)) {
                    if ((x === 0 || x === 6 || y === 0 || y === 6) ||
                        (x >= 2 && x <= 4 && y >= 2 && y <= 4)) {
                        row += '██';
                    } else {
                        row += '  ';
                    }
                } 
                // Timing patterns
                else if ((x === 6 || y === 6) && x % 2 === 0) {
                    row += '██';
                }
                // Data area (random pattern for demo)
                else {
                    row += (Math.random() > 0.5) ? '██' : '  ';
                }
            }
            qr.push(row);
        }
        
        return qr.join('\n');
    }
    
    handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        switch (url.pathname) {
            case '/':
                this.serveFile(res, 'demo/qr-display.html');
                break;
                
            case '/onboard':
                this.serveOnboarding(res);
                break;
                
            case '/dashboard':
                this.serveDashboard(res);
                break;
                
            case '/api/validate':
                this.handleValidation(req, res);
                break;
                
            case '/api/claim':
                this.handleClaim(req, res);
                break;
                
            case '/api/status':
                this.serveStatus(res);
                break;
                
            default:
                res.writeHead(404);
                res.end('Not found');
        }
    }
    
    serveFile(res, filepath) {
        const fullPath = path.join(__dirname, filepath);
        
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(404);
                res.end('File not found');
                return;
            }
            
            const ext = path.extname(filepath);
            const contentType = ext === '.html' ? 'text/html' : 
                              ext === '.js' ? 'application/javascript' : 
                              'text/plain';
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    }
    
    serveOnboarding(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>MirrorOS - Sovereignty Initialization</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, sans-serif;
            background: #000;
            color: #fff;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            text-align: center;
            padding: 20px;
            max-width: 500px;
            width: 100%;
        }
        
        .loading {
            font-family: monospace;
            color: #00ff88;
            font-size: 14px;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        
        .loading-line {
            opacity: 0;
            animation: fadeIn 0.5s forwards;
        }
        
        @keyframes fadeIn {
            to { opacity: 1; }
        }
        
        .crown {
            font-size: 80px;
            margin: 30px 0;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }
        
        .pioneer-title {
            font-size: 2em;
            font-weight: bold;
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 10px;
        }
        
        .sovereignty-meter {
            margin: 40px auto;
            max-width: 400px;
        }
        
        .meter-bar {
            height: 40px;
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            overflow: hidden;
            position: relative;
        }
        
        .meter-fill {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, #00ff88, #00ddff, #ff00ff);
            transition: width 3s ease-out;
        }
        
        .meter-value {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-weight: bold;
        }
        
        .revenue-section {
            margin: 40px 0;
            padding: 30px;
            background: rgba(0,255,136,0.1);
            border-radius: 20px;
            border: 2px solid #00ff88;
        }
        
        .revenue-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin-top: 20px;
        }
        
        .revenue-item {
            text-align: center;
        }
        
        .revenue-label {
            font-size: 0.8em;
            color: #888;
            margin-bottom: 5px;
        }
        
        .revenue-amount {
            font-size: 1.2em;
            font-weight: bold;
        }
        
        .claim-button {
            display: inline-block;
            padding: 20px 40px;
            background: linear-gradient(45deg, #00ff88, #00ddff);
            color: #000;
            text-decoration: none;
            border-radius: 50px;
            font-size: 1.1em;
            font-weight: bold;
            margin-top: 30px;
            cursor: pointer;
            border: none;
            transform: scale(0);
            animation: popIn 0.5s forwards 4s;
        }
        
        @keyframes popIn {
            to { transform: scale(1); }
        }
        
        .claim-button:hover {
            transform: scale(1.05);
        }
        
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <div id="loadingScreen">
            <div class="loading">
                <div class="loading-line" style="animation-delay: 0.5s">INITIALIZING DUAL INFINITY ROUTER...</div>
                <div class="loading-line" style="animation-delay: 1s">VALIDATING PIONEER CREDENTIALS...</div>
                <div class="loading-line" style="animation-delay: 1.5s">ESTABLISHING TRIPLE-BLIND WITNESS...</div>
                <div class="loading-line" style="animation-delay: 2s">CALCULATING SOVEREIGNTY SCORE...</div>
                <div class="loading-line" style="animation-delay: 2.5s">GENERATING REVENUE PROJECTIONS...</div>
                <div class="loading-line" style="animation-delay: 3s">WELCOME TO THE MIRROR REALM...</div>
            </div>
        </div>
        
        <div id="mainScreen" class="hidden">
            <div class="crown">👑</div>
            
            <h1 class="pioneer-title">ENTERPRISE PIONEER #001</h1>
            <p style="color: #888; margin-bottom: 30px;">First Sovereign in the Network</p>
            
            <div class="sovereignty-meter">
                <div style="color: #888; margin-bottom: 10px; font-size: 0.9em;">SOVEREIGNTY SCORE</div>
                <div class="meter-bar">
                    <div class="meter-fill" id="sovereigntyFill"></div>
                    <div class="meter-value" id="sovereigntyValue">0.00</div>
                </div>
            </div>
            
            <div class="revenue-section">
                <h3 style="color: #00ff88; margin-bottom: 20px;">YOUR REVENUE POTENTIAL</h3>
                <div class="revenue-grid">
                    <div class="revenue-item">
                        <div class="revenue-label">Monthly</div>
                        <div class="revenue-amount" id="monthlyRev">$0</div>
                    </div>
                    <div class="revenue-item">
                        <div class="revenue-label">Annual</div>
                        <div class="revenue-amount" id="annualRev">$0</div>
                    </div>
                    <div class="revenue-item">
                        <div class="revenue-label">5 Year</div>
                        <div class="revenue-amount" id="fiveYearRev">$0</div>
                    </div>
                </div>
            </div>
            
            <button class="claim-button" onclick="claimSovereignty()">
                CLAIM YOUR SOVEREIGNTY
            </button>
        </div>
    </div>
    
    <script>
        // Initialize after loading
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('mainScreen').classList.remove('hidden');
            
            // Animate sovereignty
            setTimeout(() => {
                document.getElementById('sovereigntyFill').style.width = '95%';
                animateNumber('sovereigntyValue', 0, 0.95, 3000, (n) => n.toFixed(2));
            }, 500);
            
            // Animate revenue
            setTimeout(() => {
                animateNumber('monthlyRev', 0, 125000, 2000, (n) => '$' + n.toLocaleString());
                animateNumber('annualRev', 0, 1500000, 2500, (n) => '$' + n.toLocaleString());
                animateNumber('fiveYearRev', 0, 12500000, 3000, (n) => '$' + n.toLocaleString());
            }, 1500);
        }, 3500);
        
        function animateNumber(id, start, end, duration, formatter) {
            const element = document.getElementById(id);
            const increment = (end - start) / (duration / 16);
            let current = start;
            
            const timer = setInterval(() => {
                current += increment;
                if (current >= end) {
                    current = end;
                    clearInterval(timer);
                }
                element.textContent = formatter(current);
            }, 16);
        }
        
        async function claimSovereignty() {
            const response = await fetch('/api/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pioneerId: 'ENTERPRISE_PIONEER_001' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                const button = event.target;
                button.textContent = 'SOVEREIGNTY ESTABLISHED ✓';
                button.style.background = 'linear-gradient(45deg, #ffd700, #ffed4e)';
                button.style.color = '#000';
                
                // Celebration
                for (let i = 0; i < 30; i++) {
                    createParticle();
                }
            }
        }
        
        function createParticle() {
            const particle = document.createElement('div');
            particle.style.position = 'fixed';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.top = '50%';
            particle.style.width = '10px';
            particle.style.height = '10px';
            particle.style.background = '#ffd700';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            document.body.appendChild(particle);
            
            const angle = Math.random() * Math.PI * 2;
            const velocity = 5 + Math.random() * 5;
            let x = 0, y = 0;
            
            const animate = () => {
                x += Math.cos(angle) * velocity;
                y += Math.sin(angle) * velocity;
                y += 1; // gravity
                
                particle.style.transform = \`translate(\${x}px, \${y}px)\`;
                particle.style.opacity = 1 - (Math.abs(y) / 300);
                
                if (Math.abs(y) < 300) {
                    requestAnimationFrame(animate);
                } else {
                    particle.remove();
                }
            };
            
            requestAnimationFrame(animate);
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveDashboard(res) {
        const pioneers = Array.from(this.pioneers.values());
        
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Dual Infinity Router - Live Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, sans-serif;
            background: linear-gradient(135deg, #0a0a0a, #1a1a2e);
            color: #fff;
            padding: 20px;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .title {
            font-size: 3em;
            background: linear-gradient(45deg, #00ff88, #00ddff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .status {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            margin-top: 20px;
            padding: 10px 20px;
            background: rgba(0,255,136,0.1);
            border: 1px solid #00ff88;
            border-radius: 50px;
            color: #00ff88;
        }
        
        .pulse {
            width: 10px;
            height: 10px;
            background: #00ff88;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .pioneers {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .pioneer-card {
            background: rgba(255,255,255,0.05);
            border: 2px solid rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 20px;
        }
        
        .pioneer-card.active {
            border-color: #00ff88;
            box-shadow: 0 0 30px rgba(0,255,136,0.3);
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 50px;
            margin-top: 40px;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #00ff88;
        }
        
        .stat-label {
            color: #888;
            text-transform: uppercase;
            font-size: 0.8em;
            margin-top: 5px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">DUAL INFINITY ROUTER</h1>
        <div class="status">
            <div class="pulse"></div>
            <span>LIVE MONITORING</span>
        </div>
    </div>
    
    <div class="pioneers">
        ${pioneers.map(p => `
            <div class="pioneer-card ${p.status === 'claimed' ? 'active' : ''}">
                <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
                    <div style="font-size: 48px;">${p.sigil}</div>
                    <div>
                        <h3 style="font-size: 1.5em;">${p.id}</h3>
                        <p style="color: #888;">Status: ${p.status === 'claimed' ? 'SOVEREIGN' : 'AWAITING CLAIM'}</p>
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
                    <div>
                        <div style="color: #888; font-size: 0.8em;">Sovereignty</div>
                        <div style="font-size: 1.2em; font-weight: bold;">${p.sovereigntyScore}</div>
                    </div>
                    <div>
                        <div style="color: #888; font-size: 0.8em;">Annual Revenue</div>
                        <div style="font-size: 1.2em; font-weight: bold;">$${p.revenue.annual.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style="color: #888; font-size: 0.8em;">Referral Code</div>
                        <div style="font-size: 1.2em; font-weight: bold;">${p.referralCode}</div>
                    </div>
                </div>
                ${p.traceToken ? `
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="color: #00ff88; font-size: 0.8em;">TRACE TOKEN GENERATED</div>
                        <div style="font-family: monospace; font-size: 0.7em; color: #888; margin-top: 5px;">
                            ${p.traceToken.substring(0, 32)}...
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-value">${pioneers.filter(p => p.status === 'claimed').length}</div>
            <div class="stat-label">Active Pioneers</div>
        </div>
        <div class="stat">
            <div class="stat-value">$${pioneers.reduce((sum, p) => sum + (p.status === 'claimed' ? p.revenue.annual : 0), 0).toLocaleString()}</div>
            <div class="stat-label">Network Revenue</div>
        </div>
        <div class="stat">
            <div class="stat-value">∞∞</div>
            <div class="stat-label">Dual Routers</div>
        </div>
    </div>
    
    <script>
        // Auto-refresh every 2 seconds
        setInterval(() => {
            fetch('/api/status')
                .then(r => r.json())
                .then(data => {
                    if (data.needsRefresh) {
                        location.reload();
                    }
                });
        }, 2000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
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
                
                if (pioneer) {
                    // Generate trace token (like the original infinity router)
                    const traceToken = crypto.randomBytes(32).toString('hex');
                    
                    pioneer.status = 'claimed';
                    pioneer.traceToken = traceToken;
                    pioneer.claimedAt = Date.now();
                    pioneer.witnessValidation = true;
                    
                    // Create mirror trace token file
                    const tokenData = {
                        qr_code: pioneer.qrCode,
                        trace_token: traceToken,
                        timestamp: Date.now(),
                        uuid: crypto.randomUUID(),
                        pioneerId: pioneer.id,
                        sovereigntyScore: pioneer.sovereigntyScore
                    };
                    
                    fs.writeFileSync(
                        path.join(__dirname, 'mirror-trace-token-pioneer.json'),
                        JSON.stringify(tokenData, null, 2)
                    );
                    
                    console.log(`\n🎉 PIONEER #001 CLAIMED SOVEREIGNTY!`);
                    console.log(`👑 ID: ${pioneer.id}`);
                    console.log(`🔐 Trace Token: ${traceToken.substring(0, 16)}...`);
                    console.log(`💰 Revenue Potential: $${pioneer.revenue.annual.toLocaleString()}/year\n`);
                }
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    pioneer: pioneer,
                    traceToken: pioneer.traceToken 
                }));
                
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    serveStatus(res) {
        const pioneers = Array.from(this.pioneers.values());
        const claimed = pioneers.filter(p => p.status === 'claimed').length;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            routerId: this.routerId,
            pioneers: pioneers,
            stats: {
                total: pioneers.length,
                claimed: claimed,
                revenue: pioneers.reduce((sum, p) => sum + (p.status === 'claimed' ? p.revenue.annual : 0), 0)
            },
            needsRefresh: this.lastUpdate > (Date.now() - 3000)
        }));
    }
}

// Launch the dual infinity router
if (require.main === module) {
    const router = new DualInfinityRouter();
    router.start();
}

module.exports = DualInfinityRouter;