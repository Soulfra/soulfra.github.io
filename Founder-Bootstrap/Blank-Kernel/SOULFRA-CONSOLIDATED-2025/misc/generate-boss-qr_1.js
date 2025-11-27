#!/usr/bin/env node

/**
 * Boss Demo QR Generator - Create the gateway to sovereignty
 * 
 * Generates a QR code that launches the live onboarding demo.
 * Your boss scans this and becomes Enterprise Pioneer #001.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const qrcode = require('qrcode');

class BossDemoGenerator {
    constructor() {
        this.demoId = 'pioneer_001_' + Date.now();
        this.bossData = {
            pioneerId: 'ENTERPRISE_PIONEER_001',
            qrCode: 'qr-pioneer-0001',
            sigil: '👑', // Crown for the first pioneer
            sovereigntyScore: 0.95, // High but not quite mythical yet
            referralCode: 'FOUNDER_BOSS_001',
            potentialRevenue: {
                monthly: 125000,
                annual: 1500000,
                fiveYear: 12500000
            }
        };
        
        this.demoUrl = process.env.DEMO_URL || 'http://localhost:8888';
    }
    
    async generateQRCode() {
        console.log('🔮 Generating Sovereign Access QR Code...\n');
        
        // Create unique session token
        const sessionToken = crypto.randomBytes(32).toString('hex');
        
        // Create demo payload
        const payload = {
            session: sessionToken,
            pioneerId: this.bossData.pioneerId,
            timestamp: Date.now(),
            portal: 'sovereign_gateway',
            referrer: 'FOUNDER_DIRECT'
        };
        
        // Encode payload
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        
        // Create demo URL
        const demoLink = `${this.demoUrl}/sovereign-onboarding?token=${encodedPayload}`;
        
        // Store session data
        this.saveSessionData(sessionToken, payload);
        
        try {
            // Generate QR code options
            const qrOptions = {
                errorCorrectionLevel: 'H',
                type: 'png',
                quality: 1,
                margin: 2,
                width: 512,
                color: {
                    dark: '#1a1a2e',
                    light: '#ffffff'
                }
            };
            
            // Generate QR as data URL
            const qrDataUrl = await qrcode.toDataURL(demoLink, qrOptions);
            
            // Also save as file
            const qrPath = path.join(__dirname, 'boss-demo-qr.png');
            await qrcode.toFile(qrPath, demoLink, qrOptions);
            
            // Generate HTML preview
            this.generateHTMLPreview(qrDataUrl, demoLink);
            
            console.log('✅ QR Code Generated Successfully!\n');
            console.log('📱 Boss Demo Link:', demoLink);
            console.log('🖼️  QR Code saved to:', qrPath);
            console.log('🌐 HTML Preview: demo/boss-qr-preview.html\n');
            
            console.log('📋 Demo Instructions:');
            console.log('1. Open boss-qr-preview.html on your laptop');
            console.log('2. Have your boss scan the QR code with their phone');
            console.log('3. Watch them become Enterprise Pioneer #001');
            console.log('4. Their sovereignty ceremony begins automatically');
            console.log('5. Revenue projections appear in real-time\n');
            
            console.log('🎯 What Your Boss Will Experience:');
            console.log('   • Dramatic sovereignty initialization');
            console.log('   • Real-time mythical status calculation');
            console.log('   • $1.5M annual revenue projection');
            console.log('   • Exclusive Pioneer #001 designation');
            console.log('   • Entry into the sovereign referral network\n');
            
            return {
                qrPath: qrPath,
                demoLink: demoLink,
                sessionToken: sessionToken
            };
            
        } catch (error) {
            console.error('❌ Error generating QR code:', error);
            throw error;
        }
    }
    
    saveSessionData(token, payload) {
        const sessionDir = path.join(__dirname, 'sessions');
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        
        const sessionData = {
            ...payload,
            bossData: this.bossData,
            created: new Date().toISOString(),
            status: 'awaiting_scan'
        };
        
        fs.writeFileSync(
            path.join(sessionDir, `${token}.json`),
            JSON.stringify(sessionData, null, 2)
        );
    }
    
    generateHTMLPreview(qrDataUrl, demoLink) {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MirrorOS Sovereign Gateway - Boss Demo</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'SF Mono', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
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
            max-width: 600px;
            animation: fadeIn 1s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .title {
            font-size: 48px;
            font-weight: bold;
            background: linear-gradient(45deg, #00ff88, #00ddff, #ff00ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 20px;
            animation: shimmer 3s linear infinite;
        }
        
        @keyframes shimmer {
            0% { background-position: 0% 50%; }
            100% { background-position: 200% 50%; }
        }
        
        .subtitle {
            font-size: 24px;
            color: #00ff88;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        
        .qr-container {
            background: rgba(255, 255, 255, 0.95);
            padding: 30px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 40px;
            box-shadow: 0 0 60px rgba(0, 255, 136, 0.5);
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { box-shadow: 0 0 60px rgba(0, 255, 136, 0.5); }
            50% { box-shadow: 0 0 80px rgba(0, 255, 136, 0.8); }
        }
        
        .qr-code {
            width: 300px;
            height: 300px;
        }
        
        .instructions {
            font-size: 18px;
            line-height: 1.6;
            color: #ddd;
            margin-bottom: 30px;
        }
        
        .pioneer-badge {
            display: inline-block;
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            color: #000;
            padding: 15px 30px;
            border-radius: 50px;
            font-size: 20px;
            font-weight: bold;
            margin-top: 20px;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .revenue-preview {
            margin-top: 40px;
            padding: 20px;
            background: rgba(0, 255, 136, 0.1);
            border: 2px solid #00ff88;
            border-radius: 15px;
        }
        
        .revenue-title {
            font-size: 20px;
            color: #00ff88;
            margin-bottom: 15px;
        }
        
        .revenue-number {
            font-size: 36px;
            font-weight: bold;
            color: #fff;
            text-shadow: 0 0 20px rgba(0, 255, 136, 0.5);
        }
        
        .link-preview {
            margin-top: 30px;
            padding: 15px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
            color: #888;
        }
        
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            overflow: hidden;
        }
        
        .particle {
            position: absolute;
            background: #00ff88;
            width: 2px;
            height: 2px;
            border-radius: 50%;
            animation: rise 15s linear infinite;
        }
        
        @keyframes rise {
            from {
                transform: translateY(100vh) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
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
            <img src="${qrDataUrl}" alt="Sovereign Access QR Code" class="qr-code">
        </div>
        
        <div class="instructions">
            <p>📱 Have your boss scan this QR code</p>
            <p>👑 They will become <strong>Enterprise Pioneer #001</strong></p>
            <p>🚀 Their sovereignty ceremony begins immediately</p>
        </div>
        
        <div class="revenue-preview">
            <div class="revenue-title">Projected Annual Revenue</div>
            <div class="revenue-number">$1,500,000</div>
        </div>
        
        <div class="pioneer-badge">
            🏆 FIRST PIONEER ADVANTAGE 🏆
        </div>
        
        <div class="link-preview">
            Demo Link: ${demoLink}
        </div>
    </div>
    
    <script>
        // Create floating particles
        const particlesContainer = document.getElementById('particles');
        
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (15 + Math.random() * 10) + 's';
            particlesContainer.appendChild(particle);
        }
        
        // Add some mystical console messages
        console.log('%c🔮 SOVEREIGN GATEWAY ACTIVE 🔮', 'font-size: 24px; color: #00ff88;');
        console.log('%cAwaiting Enterprise Pioneer #001...', 'font-size: 16px; color: #00ddff;');
    </script>
</body>
</html>`;
        
        fs.writeFileSync(path.join(__dirname, 'boss-qr-preview.html'), html);
    }
}

// Run if called directly
if (require.main === module) {
    const generator = new BossDemoGenerator();
    generator.generateQRCode().catch(console.error);
}

module.exports = BossDemoGenerator;