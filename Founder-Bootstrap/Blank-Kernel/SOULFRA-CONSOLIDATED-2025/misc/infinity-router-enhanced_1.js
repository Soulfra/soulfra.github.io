#!/usr/bin/env node

/**
 * infinity-router-enhanced.js
 * Enhanced dual infinity router with live QR display for boss demo
 * Pure Node.js implementation - no external dependencies
 */

const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EnhancedInfinityRouter {
    constructor() {
        this.port = 8888;
        this.pioneers = new Map();
        this.qrSessions = new Map();
        this.startTime = Date.now();
        this.demoUrl = `http://localhost:${this.port}`;
    }

    /**
     * Generate large ASCII QR code for terminal display
     */
    generateLargeAsciiQR(text) {
        // This creates a visually recognizable QR-like pattern
        // Real QR codes would need a library, but this serves the demo purpose
        const size = 25;
        const border = 2;
        
        let qr = [];
        
        // White border
        for (let i = 0; i < border; i++) {
            qr.push('█'.repeat(size + border * 2));
        }
        
        // Top finder patterns
        qr.push('██' + '▄▄▄▄▄▄▄'.padEnd(size, '█') + '██');
        qr.push('██' + '█     █'.padEnd(size, '█') + '██');
        qr.push('██' + '█ ███ █'.padEnd(size, '█') + '██');
        qr.push('██' + '█ ███ █'.padEnd(size, '█') + '██');
        qr.push('██' + '█ ███ █'.padEnd(size, '█') + '██');
        qr.push('██' + '█     █'.padEnd(size, '█') + '██');
        qr.push('██' + '▀▀▀▀▀▀▀'.padEnd(size, '█') + '██');
        
        // Data area with pattern
        const dataRows = 11;
        for (let i = 0; i < dataRows; i++) {
            let row = '';
            for (let j = 0; j < size; j++) {
                // Create data-like pattern based on URL hash
                const hash = crypto.createHash('md5').update(`${text}${i}${j}`).digest('hex');
                row += parseInt(hash[0], 16) > 7 ? '█' : ' ';
            }
            qr.push('██' + row + '██');
        }
        
        // Bottom finder pattern
        qr.push('██' + '▄▄▄▄▄▄▄'.padEnd(size, '█') + '██');
        qr.push('██' + '█     █'.padEnd(size, '█') + '██');
        qr.push('██' + '█ ███ █'.padEnd(size, '█') + '██');
        qr.push('██' + '█ ███ █'.padEnd(size, '█') + '██');
        qr.push('██' + '█ ███ █'.padEnd(size, '█') + '██');
        qr.push('██' + '█     █'.padEnd(size, '█') + '██');
        qr.push('██' + '▀▀▀▀▀▀▀'.padEnd(size, '█') + '██');
        
        // Bottom border
        for (let i = 0; i < border; i++) {
            qr.push('█'.repeat(size + border * 2));
        }
        
        return qr.join('\n');
    }

    /**
     * Generate HTML page with QR code
     */
    generateQRPage(sessionId) {
        const enrollUrl = `${this.demoUrl}/enroll?session=${sessionId}`;
        
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Soulfra Pioneer Enrollment</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #0f0f1e);
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .container {
            text-align: center;
            background: rgba(255, 255, 255, 0.05);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 500px;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #00ff88, #00aaff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            color: #888;
            margin-bottom: 30px;
            font-size: 1.1em;
        }
        .qr-container {
            background: white;
            padding: 30px;
            border-radius: 15px;
            display: inline-block;
            margin: 20px 0;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
        }
        .qr-code {
            width: 250px;
            height: 250px;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: monospace;
            font-size: 10px;
            line-height: 1;
            white-space: pre;
            color: #000;
            overflow: hidden;
        }
        .manual-link {
            margin-top: 20px;
            padding: 15px 30px;
            background: linear-gradient(45deg, #00ff88, #00aaff);
            color: #000;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            display: inline-block;
            transition: transform 0.2s;
        }
        .manual-link:hover {
            transform: scale(1.05);
        }
        .session-info {
            margin-top: 30px;
            padding: 20px;
            background: rgba(0, 255, 136, 0.1);
            border-radius: 10px;
            font-family: monospace;
            font-size: 0.9em;
        }
        .pulse {
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Soulfra Pioneer Portal</h1>
        <div class="subtitle">Become Enterprise Pioneer #001</div>
        
        <div class="qr-container pulse">
            <div class="qr-code" id="qrCode">
                Generating QR Code...
            </div>
        </div>
        
        <div>
            <a href="${enrollUrl}" class="manual-link">Click to Enroll</a>
        </div>
        
        <div class="session-info">
            <strong>Session ID:</strong> ${sessionId}<br>
            <strong>Expires:</strong> ${new Date(Date.now() + 300000).toLocaleTimeString()}
        </div>
    </div>
    
    <script>
        // Generate visual QR-like pattern in browser
        const qrCode = document.getElementById('qrCode');
        const size = 25;
        let pattern = '';
        
        // Create QR-like pattern
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                // Finder patterns
                if ((x < 7 && y < 7) || (x >= size-7 && y < 7) || (x < 7 && y >= size-7)) {
                    if ((x === 0 || x === 6 || y === 0 || y === 6) ||
                        (x >= 2 && x <= 4 && y >= 2 && y <= 4)) {
                        pattern += '█';
                    } else {
                        pattern += ' ';
                    }
                } else {
                    // Data area - create pattern from session ID
                    const hash = ((x * y + ${sessionId.charCodeAt(0)}) * 31) % 256;
                    pattern += hash > 127 ? '█' : ' ';
                }
            }
            pattern += '\\n';
        }
        
        qrCode.textContent = pattern;
        
        // Auto-refresh every 5 seconds to check enrollment
        setInterval(() => {
            fetch('/check-enrollment?session=${sessionId}')
                .then(r => r.json())
                .then(data => {
                    if (data.enrolled) {
                        window.location.href = '/dashboard?pioneer=' + data.pioneerId;
                    }
                });
        }, 5000);
    </script>
</body>
</html>`;
    }

    /**
     * Generate enrollment form
     */
    generateEnrollmentForm(sessionId) {
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pioneer Enrollment - Soulfra</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1a1a2e, #0f0f1e);
            color: #fff;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
        }
        .enrollment-container {
            background: rgba(255, 255, 255, 0.05);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
        }
        h1 {
            text-align: center;
            background: linear-gradient(45deg, #00ff88, #00aaff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            color: #aaa;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        input, select {
            width: 100%;
            padding: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #fff;
            font-size: 16px;
            transition: all 0.3s;
        }
        input:focus, select:focus {
            outline: none;
            border-color: #00ff88;
            background: rgba(255, 255, 255, 0.15);
        }
        button {
            width: 100%;
            padding: 15px;
            background: linear-gradient(45deg, #00ff88, #00aaff);
            color: #000;
            border: none;
            border-radius: 50px;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: transform 0.2s;
            margin-top: 20px;
        }
        button:hover {
            transform: scale(1.05);
        }
        .pioneer-badge {
            text-align: center;
            margin-bottom: 30px;
            font-size: 3em;
        }
        .terms {
            font-size: 0.8em;
            color: #666;
            text-align: center;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="enrollment-container">
        <div class="pioneer-badge">🏆</div>
        <h1>Become Enterprise Pioneer #001</h1>
        
        <form action="/complete-enrollment" method="POST">
            <input type="hidden" name="session" value="${sessionId}">
            
            <div class="form-group">
                <label for="name">Full Name</label>
                <input type="text" id="name" name="name" required placeholder="John Doe">
            </div>
            
            <div class="form-group">
                <label for="company">Company</label>
                <input type="text" id="company" name="company" required placeholder="Acme Corp">
            </div>
            
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" required placeholder="john@acme.com">
            </div>
            
            <div class="form-group">
                <label for="role">Role</label>
                <select id="role" name="role" required>
                    <option value="">Select your role</option>
                    <option value="founder">Founder/CEO</option>
                    <option value="cto">CTO/Technical</option>
                    <option value="investor">Investor</option>
                    <option value="other">Other</option>
                </select>
            </div>
            
            <button type="submit">🚀 Claim Pioneer Status</button>
        </form>
        
        <div class="terms">
            By enrolling, you become part of the exclusive Soulfra Pioneer Network<br>
            with priority access and revenue sharing opportunities.
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Generate pioneer dashboard
     */
    generateDashboard(pioneerId) {
        const pioneer = this.pioneers.get(pioneerId);
        if (!pioneer) {
            return '<h1>Pioneer not found</h1>';
        }

        const projectedRevenue = 1500000; // $1.5M
        const referralCode = `REF-${pioneerId.substring(0, 8).toUpperCase()}`;
        
        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Pioneer Dashboard - ${pioneer.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0a0a0a;
            color: #fff;
            margin: 0;
            padding: 20px;
        }
        .dashboard {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 40px;
            background: linear-gradient(135deg, #1a1a2e, #0f0f1e);
            border-radius: 20px;
        }
        h1 {
            font-size: 3em;
            background: linear-gradient(45deg, #00ff88, #00aaff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0;
        }
        .pioneer-number {
            font-size: 5em;
            font-weight: bold;
            color: #00ff88;
            margin: 20px 0;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: rgba(255, 255, 255, 0.05);
            padding: 30px;
            border-radius: 15px;
            text-align: center;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #00ff88;
            margin-bottom: 10px;
        }
        .stat-label {
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 0.9em;
        }
        .referral-section {
            background: linear-gradient(45deg, rgba(0, 255, 136, 0.1), rgba(0, 170, 255, 0.1));
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            margin-bottom: 40px;
        }
        .referral-code {
            font-size: 2em;
            font-family: monospace;
            background: #000;
            padding: 20px 40px;
            border-radius: 10px;
            display: inline-block;
            margin: 20px 0;
            border: 2px solid #00ff88;
        }
        .timeline {
            background: rgba(255, 255, 255, 0.05);
            padding: 40px;
            border-radius: 20px;
        }
        .timeline-item {
            padding: 20px;
            border-left: 3px solid #00ff88;
            margin-left: 20px;
            margin-bottom: 20px;
            position: relative;
        }
        .timeline-item::before {
            content: '✓';
            position: absolute;
            left: -12px;
            background: #00ff88;
            color: #000;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        .cta-button {
            display: inline-block;
            padding: 20px 40px;
            background: linear-gradient(45deg, #00ff88, #00aaff);
            color: #000;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            font-size: 1.2em;
            transition: transform 0.2s;
            margin: 20px;
        }
        .cta-button:hover {
            transform: scale(1.05);
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>Welcome, ${pioneer.name}!</h1>
            <div class="pioneer-number">#001</div>
            <p style="color: #888;">Enterprise Pioneer • ${pioneer.company}</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">$${projectedRevenue.toLocaleString()}</div>
                <div class="stat-label">Projected Annual Revenue</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">90%</div>
                <div class="stat-label">Revenue Share</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">∞</div>
                <div class="stat-label">Network Growth Potential</div>
            </div>
        </div>
        
        <div class="referral-section">
            <h2>Your Exclusive Referral Code</h2>
            <div class="referral-code">${referralCode}</div>
            <p>Share this code to build your network and multiply your revenue</p>
            <a href="#" class="cta-button">Invite Partners</a>
        </div>
        
        <div class="timeline">
            <h2>Your Pioneer Journey</h2>
            <div class="timeline-item">
                <strong>Enrolled as Pioneer #001</strong><br>
                <small>${new Date(pioneer.enrolledAt).toLocaleString()}</small>
            </div>
            <div class="timeline-item">
                <strong>Sovereignty Status: GRANTED</strong><br>
                <small>Full platform access unlocked</small>
            </div>
            <div class="timeline-item">
                <strong>Revenue Sharing: ACTIVE</strong><br>
                <small>90% share on all referred business</small>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px;">
            <a href="#" class="cta-button">Access Platform</a>
            <a href="#" class="cta-button">View Analytics</a>
        </div>
    </div>
</body>
</html>`;
    }

    /**
     * Parse POST body
     */
    parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => body += chunk.toString());
            req.on('end', () => {
                try {
                    const params = new URLSearchParams(body);
                    const data = {};
                    for (const [key, value] of params) {
                        data[key] = value;
                    }
                    resolve(data);
                } catch (e) {
                    reject(e);
                }
            });
            req.on('error', reject);
        });
    }

    /**
     * Start the server
     */
    async start() {
        const server = http.createServer(async (req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;
            const query = parsedUrl.query;

            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST');

            switch (pathname) {
                case '/':
                    // Generate new session
                    const sessionId = crypto.randomBytes(16).toString('hex');
                    this.qrSessions.set(sessionId, {
                        created: Date.now(),
                        enrolled: false
                    });
                    
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(this.generateQRPage(sessionId));
                    break;

                case '/enroll':
                    if (!query.session || !this.qrSessions.has(query.session)) {
                        res.writeHead(404);
                        res.end('Session not found');
                        return;
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(this.generateEnrollmentForm(query.session));
                    break;

                case '/complete-enrollment':
                    if (req.method === 'POST') {
                        const data = await this.parseBody(req);
                        const session = this.qrSessions.get(data.session);
                        
                        if (!session) {
                            res.writeHead(404);
                            res.end('Session expired');
                            return;
                        }
                        
                        // Create pioneer
                        const pioneerId = crypto.randomBytes(16).toString('hex');
                        this.pioneers.set(pioneerId, {
                            id: pioneerId,
                            name: data.name,
                            company: data.company,
                            email: data.email,
                            role: data.role,
                            enrolledAt: Date.now(),
                            isFirstPioneer: this.pioneers.size === 0
                        });
                        
                        // Update session
                        session.enrolled = true;
                        session.pioneerId = pioneerId;
                        
                        // Redirect to dashboard
                        res.writeHead(302, { 'Location': `/dashboard?pioneer=${pioneerId}` });
                        res.end();
                    }
                    break;

                case '/dashboard':
                    if (!query.pioneer) {
                        res.writeHead(404);
                        res.end('Pioneer ID required');
                        return;
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(this.generateDashboard(query.pioneer));
                    break;

                case '/check-enrollment':
                    const checkSession = this.qrSessions.get(query.session);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        enrolled: checkSession?.enrolled || false,
                        pioneerId: checkSession?.pioneerId
                    }));
                    break;

                default:
                    res.writeHead(404);
                    res.end('Not found');
            }
        });

        server.listen(this.port, () => {
            console.log('\n🚀 SOULFRA PIONEER PORTAL ACTIVATED');
            console.log('=====================================\n');
            
            // Display large QR code in terminal
            console.log('📱 Scan this QR code with your phone:\n');
            console.log(this.generateLargeAsciiQR(this.demoUrl));
            console.log('\n');
            
            console.log(`🌐 Or visit: ${this.demoUrl}`);
            console.log('\n💰 First pioneer gets:');
            console.log('   • Enterprise Pioneer #001 status');
            console.log('   • $1.5M projected revenue');
            console.log('   • 90% revenue share');
            console.log('   • Exclusive referral network\n');
            console.log('Press Ctrl+C to stop the server\n');
        });

        // Cleanup on exit
        process.on('SIGINT', () => {
            console.log('\n\n✨ Pioneer portal shutdown complete');
            process.exit(0);
        });
    }
}

// Run if called directly
if (require.main === module) {
    const router = new EnhancedInfinityRouter();
    router.start();
}

module.exports = EnhancedInfinityRouter;