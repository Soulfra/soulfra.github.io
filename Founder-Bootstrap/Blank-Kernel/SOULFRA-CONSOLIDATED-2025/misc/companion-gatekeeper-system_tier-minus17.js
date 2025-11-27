#!/usr/bin/env node

// COMPANION GATEKEEPER SYSTEM
// Your phone becomes the master key to everything
// Full control via webhooks, QR codes, and SMS

const express = require('express');
const WebSocket = require('ws');
const QRCode = require('qrcode');
const crypto = require('crypto');
const ngrok = require('ngrok');

class CompanionGatekeeperSystem {
    constructor() {
        this.masterPhone = null; // Your phone number
        this.activeSessions = new Map();
        this.webhookTargets = new Map();
        this.permissionLevels = new Map();
        
        // Core components
        this.qrAuth = new QRMobileAuth();
        this.webhookBridge = new WebhookBridge();
        this.mobileGateway = new MobileGateway();
        this.calCompanion = new CalCompanion();
        
        console.log('🔐 Companion Gatekeeper System Initializing...');
        console.log('   Your phone is the key to the kingdom');
    }
    
    async initialize(masterPhoneNumber) {
        this.masterPhone = masterPhoneNumber;
        
        // Set up all components
        await this.qrAuth.initialize(this);
        await this.webhookBridge.initialize(this);
        await this.mobileGateway.initialize(this);
        await this.calCompanion.initialize(this);
        
        // Create public tunnel for mobile access
        await this.createPublicTunnel();
        
        console.log('✨ Gatekeeper ready!');
        console.log(`📱 Master phone: ${this.masterPhone}`);
    }
    
    async createPublicTunnel() {
        // Use ngrok to create public URL for local development
        const url = await ngrok.connect({
            port: 8888,
            authtoken: process.env.NGROK_TOKEN // Optional
        });
        
        console.log(`🌐 Public tunnel: ${url}`);
        console.log('   Scan QR code with your phone to connect');
        
        // Generate master QR code
        const qrData = {
            url: url,
            type: 'master-auth',
            timestamp: Date.now()
        };
        
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));
        console.log('\n📱 Master QR Code:');
        console.log(qrCode);
    }
}

// QR Mobile Authentication
class QRMobileAuth {
    constructor() {
        this.app = express();
        this.pendingAuths = new Map();
        this.authorizedDevices = new Map();
    }
    
    async initialize(gatekeeper) {
        this.gatekeeper = gatekeeper;
        
        // QR generation endpoint
        this.app.get('/qr/generate', async (req, res) => {
            const session = {
                id: crypto.randomUUID(),
                timestamp: Date.now(),
                permissions: req.query.perms || 'basic',
                status: 'pending'
            };
            
            this.pendingAuths.set(session.id, session);
            
            // Generate QR with session info
            const qrData = {
                sessionId: session.id,
                callbackUrl: `${req.protocol}://${req.get('host')}/qr/verify`,
                permissions: session.permissions
            };
            
            const qrImage = await QRCode.toDataURL(JSON.stringify(qrData));
            
            res.json({
                sessionId: session.id,
                qr: qrImage,
                status: 'waiting_for_scan'
            });
            
            // Send webhook to master phone
            await this.notifyMasterPhone(session);
        });
        
        // Mobile scan verification
        this.app.post('/qr/verify', async (req, res) => {
            const { sessionId, phoneNumber, code } = req.body;
            const session = this.pendingAuths.get(sessionId);
            
            if (!session) {
                return res.status(404).json({ error: 'Session not found' });
            }
            
            // Check if master phone
            if (phoneNumber === this.gatekeeper.masterPhone) {
                // Master phone gets everything
                session.status = 'authorized';
                session.level = 'master';
                session.phone = phoneNumber;
                
                this.authorizedDevices.set(sessionId, session);
                
                res.json({
                    status: 'authorized',
                    level: 'master',
                    token: this.generateMasterToken(session)
                });
                
                // Send success webhook
                await this.sendWebhook('auth_success', session);
            } else {
                // Other phones need approval
                await this.requestMasterApproval(phoneNumber, session);
                res.json({ status: 'pending_approval' });
            }
        });
        
        // PWA manifest for mobile
        this.app.get('/manifest.json', (req, res) => {
            res.json({
                name: 'Soulfra Companion',
                short_name: 'Soulfra',
                start_url: '/',
                display: 'standalone',
                background_color: '#000000',
                theme_color: '#6C63FF',
                icons: [{
                    src: '/icon-192.png',
                    sizes: '192x192',
                    type: 'image/png'
                }]
            });
        });
        
        this.app.listen(8888, () => {
            console.log('📱 QR Auth server on port 8888');
        });
    }
    
    async notifyMasterPhone(session) {
        // Send SMS/Push to master phone
        const message = `New login attempt:\nSession: ${session.id}\nPermissions: ${session.permissions}\n\nReply with "APPROVE ${session.id}" to authorize`;
        
        await this.gatekeeper.mobileGateway.sendSMS(
            this.gatekeeper.masterPhone,
            message
        );
    }
    
    generateMasterToken(session) {
        // Create JWT with full permissions
        const token = {
            sessionId: session.id,
            phone: session.phone,
            level: session.level,
            permissions: '*', // Everything
            issued: Date.now(),
            expires: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
        };
        
        return Buffer.from(JSON.stringify(token)).toString('base64');
    }
}

// Webhook Bridge System
class WebhookBridge {
    constructor() {
        this.app = express();
        this.webhooks = new Map();
        this.ws = null;
    }
    
    async initialize(gatekeeper) {
        this.gatekeeper = gatekeeper;
        
        // WebSocket for real-time updates
        this.ws = new WebSocket.Server({ port: 8889 });
        
        this.ws.on('connection', (socket, req) => {
            // Verify authorization
            const token = req.headers.authorization;
            if (!this.verifyToken(token)) {
                socket.close();
                return;
            }
            
            socket.on('message', async (data) => {
                const message = JSON.parse(data);
                await this.handleWebSocketMessage(socket, message);
            });
        });
        
        // Webhook receiver
        this.app.post('/webhook/:target', async (req, res) => {
            const { target } = req.params;
            const payload = req.body;
            
            // Forward to appropriate handler
            await this.routeWebhook(target, payload);
            
            res.json({ received: true });
        });
        
        // Register webhooks
        this.app.post('/webhook/register', this.requireMaster, async (req, res) => {
            const { name, url, events } = req.body;
            
            this.webhooks.set(name, {
                url,
                events,
                active: true,
                created: Date.now()
            });
            
            res.json({ registered: true, name });
        });
        
        this.app.listen(8890, () => {
            console.log('🔗 Webhook bridge on port 8890');
        });
    }
    
    async routeWebhook(target, payload) {
        // Special handling for different targets
        switch(target) {
            case 'mobile':
                await this.sendToMobile(payload);
                break;
            case 'cal':
                await this.sendToCal(payload);
                break;
            case 'tier1':
                await this.sendToTier1(payload);
                break;
            default:
                await this.broadcastWebhook(payload);
        }
    }
    
    async sendToMobile(payload) {
        // Send to master phone via multiple channels
        if (payload.urgent) {
            // Phone call
            await this.gatekeeper.mobileGateway.makeCall(
                this.gatekeeper.masterPhone,
                payload.message
            );
        } else {
            // SMS
            await this.gatekeeper.mobileGateway.sendSMS(
                this.gatekeeper.masterPhone,
                JSON.stringify(payload)
            );
        }
        
        // Also send push notification if app installed
        await this.sendPushNotification(payload);
    }
    
    requireMaster(req, res, next) {
        const token = req.headers.authorization;
        // Verify master token
        if (this.verifyMasterToken(token)) {
            next();
        } else {
            res.status(403).json({ error: 'Master access required' });
        }
    }
}

// Mobile Gateway (SMS/Call)
class MobileGateway {
    constructor() {
        this.twilio = null;
        this.textCommands = new Map();
    }
    
    async initialize(gatekeeper) {
        this.gatekeeper = gatekeeper;
        
        // Initialize Twilio if configured
        if (process.env.TWILIO_ACCOUNT_SID) {
            const twilio = require('twilio');
            this.twilio = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );
        }
        
        // Set up text command handlers
        this.setupTextCommands();
        
        // SMS webhook endpoint
        const app = express();
        app.post('/sms/incoming', async (req, res) => {
            const { From, Body } = req.body;
            
            // Only process from master phone
            if (From === this.gatekeeper.masterPhone) {
                await this.processTextCommand(Body);
            }
            
            res.send('<Response></Response>');
        });
        
        app.listen(8891, () => {
            console.log('💬 SMS gateway on port 8891');
        });
    }
    
    setupTextCommands() {
        // Text command patterns
        this.textCommands.set(/^APPROVE\s+(.+)$/i, async (matches) => {
            const sessionId = matches[1];
            await this.approveSession(sessionId);
        });
        
        this.textCommands.set(/^CAL\s+(.+)$/i, async (matches) => {
            const message = matches[1];
            const response = await this.gatekeeper.calCompanion.process(message);
            await this.sendSMS(this.gatekeeper.masterPhone, response);
        });
        
        this.textCommands.set(/^EXEC\s+(.+)$/i, async (matches) => {
            const command = matches[1];
            await this.executeCommand(command);
        });
        
        this.textCommands.set(/^TIER\s+(\d+)\s+(.+)$/i, async (matches) => {
            const tier = matches[1];
            const action = matches[2];
            await this.tierControl(tier, action);
        });
    }
    
    async processTextCommand(text) {
        for (const [pattern, handler] of this.textCommands) {
            const matches = text.match(pattern);
            if (matches) {
                await handler(matches);
                return;
            }
        }
        
        // Unknown command - ask Cal
        const response = await this.gatekeeper.calCompanion.process(text);
        await this.sendSMS(this.gatekeeper.masterPhone, response);
    }
    
    async sendSMS(to, message) {
        if (this.twilio) {
            await this.twilio.messages.create({
                body: message.substring(0, 1600), // SMS limit
                from: process.env.TWILIO_PHONE_NUMBER,
                to: to
            });
        } else {
            console.log(`SMS to ${to}: ${message}`);
        }
    }
}

// Cal Companion Integration
class CalCompanion {
    constructor() {
        this.context = new Map();
        this.activeChats = new Map();
    }
    
    async initialize(gatekeeper) {
        this.gatekeeper = gatekeeper;
        
        console.log('🤖 Cal Companion ready for mobile control');
    }
    
    async process(message, phoneNumber = null) {
        const userId = phoneNumber || this.gatekeeper.masterPhone;
        
        // Get or create context
        const context = this.context.get(userId) || {
            history: [],
            tier: 'master',
            permissions: '*'
        };
        
        // Add to history
        context.history.push({
            message,
            timestamp: Date.now()
        });
        
        // Process based on intent
        const response = await this.generateResponse(message, context);
        
        // Update context
        this.context.set(userId, context);
        
        return response;
    }
    
    async generateResponse(message, context) {
        // Command patterns
        if (message.startsWith('/')) {
            return this.processCommand(message.slice(1), context);
        }
        
        // System queries
        if (message.toLowerCase().includes('status')) {
            return this.getSystemStatus();
        }
        
        if (message.toLowerCase().includes('users')) {
            return this.getUserStats();
        }
        
        // Default Cal response
        return `Cal: Received "${message}". How can I help you control the system?`;
    }
    
    async processCommand(command, context) {
        const [cmd, ...args] = command.split(' ');
        
        switch(cmd) {
            case 'deploy':
                return this.deploySystem(args[0]);
            case 'scale':
                return this.scaleSystem(args[0], args[1]);
            case 'tier':
                return this.controlTier(args[0], args.slice(1).join(' '));
            case 'webhook':
                return this.manageWebhook(args);
            default:
                return `Unknown command: ${cmd}`;
        }
    }
}

// Tier 1 Integration
class Tier1Integration {
    constructor() {
        this.templates = new Map();
        this.activeIntegrations = new Map();
    }
    
    async connectToTier1(gatekeeper) {
        // Link companion system to tier 1 architecture
        const tier1Path = '../../../../../../../../../../../tier-1';
        
        // Load tier 1 templates
        await this.loadTemplates(tier1Path);
        
        // Create bidirectional webhooks
        await this.createWebhookLoop(gatekeeper);
        
        console.log('🔄 Tier 1 integration complete');
    }
    
    async createWebhookLoop(gatekeeper) {
        // Set up webhook loop between companion and tier 1
        const webhooks = [
            {
                source: 'companion',
                target: 'tier1',
                events: ['auth', 'command', 'data']
            },
            {
                source: 'tier1', 
                target: 'companion',
                events: ['user_action', 'system_event', 'alert']
            }
        ];
        
        for (const webhook of webhooks) {
            await gatekeeper.webhookBridge.registerWebhook(webhook);
        }
    }
}

// PWA Mobile App
class MobilePWA {
    static generatePWA() {
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black">
    <title>Soulfra Companion</title>
    <link rel="manifest" href="/manifest.json">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
        }
        
        body {
            font-family: -apple-system, system-ui, sans-serif;
            background: #000;
            color: #fff;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: linear-gradient(135deg, #6C63FF, #8338EC);
            padding: 20px;
            text-align: center;
        }
        
        .status {
            padding: 10px;
            background: rgba(255,255,255,0.1);
            margin: 10px;
            border-radius: 10px;
            text-align: center;
        }
        
        .status.connected {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid #4CAF50;
        }
        
        .controls {
            flex: 1;
            padding: 20px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            overflow-y: auto;
        }
        
        .control-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .control-btn:active {
            transform: scale(0.95);
            background: rgba(255,255,255,0.2);
        }
        
        .control-btn .icon {
            font-size: 30px;
            margin-bottom: 10px;
        }
        
        .chat-input {
            position: sticky;
            bottom: 0;
            background: #111;
            padding: 15px;
            display: flex;
            gap: 10px;
        }
        
        .chat-input input {
            flex: 1;
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            padding: 12px;
            border-radius: 25px;
            color: #fff;
            font-size: 16px;
        }
        
        .chat-input button {
            background: #6C63FF;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            color: #fff;
            font-weight: bold;
        }
        
        .qr-scanner {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            display: none;
            z-index: 1000;
        }
        
        #qr-video {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Soulfra Companion</h1>
        <div class="status" id="status">Connecting...</div>
    </div>
    
    <div class="controls">
        <div class="control-btn" onclick="scanQR()">
            <div class="icon">📷</div>
            <div>Scan QR</div>
        </div>
        
        <div class="control-btn" onclick="showStats()">
            <div class="icon">📊</div>
            <div>Stats</div>
        </div>
        
        <div class="control-btn" onclick="manageTiers()">
            <div class="icon">🏗️</div>
            <div>Tiers</div>
        </div>
        
        <div class="control-btn" onclick="webhookControl()">
            <div class="icon">🔗</div>
            <div>Webhooks</div>
        </div>
        
        <div class="control-btn" onclick="deployments()">
            <div class="icon">🚀</div>
            <div>Deploy</div>
        </div>
        
        <div class="control-btn" onclick="calChat()">
            <div class="icon">🤖</div>
            <div>Cal</div>
        </div>
    </div>
    
    <div class="chat-input">
        <input type="text" id="commandInput" placeholder="Type command or message...">
        <button onclick="sendCommand()">Send</button>
    </div>
    
    <div class="qr-scanner" id="qrScanner">
        <video id="qr-video"></video>
    </div>
    
    <script>
        let ws = null;
        let masterToken = localStorage.getItem('masterToken');
        
        // Connect WebSocket
        function connect() {
            ws = new WebSocket('ws://localhost:8889');
            
            ws.onopen = () => {
                document.getElementById('status').textContent = 'Connected';
                document.getElementById('status').classList.add('connected');
                
                // Authenticate
                ws.send(JSON.stringify({
                    type: 'auth',
                    token: masterToken
                }));
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleMessage(data);
            };
            
            ws.onclose = () => {
                document.getElementById('status').textContent = 'Disconnected';
                document.getElementById('status').classList.remove('connected');
                setTimeout(connect, 3000);
            };
        }
        
        function sendCommand() {
            const input = document.getElementById('commandInput');
            const command = input.value.trim();
            
            if (command && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'command',
                    command: command
                }));
                
                input.value = '';
            }
        }
        
        // QR Scanner
        async function scanQR() {
            const scanner = document.getElementById('qrScanner');
            scanner.style.display = 'block';
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                
                const video = document.getElementById('qr-video');
                video.srcObject = stream;
                
                // QR detection would go here
                // For now, close after 5 seconds
                setTimeout(() => {
                    stream.getTracks().forEach(track => track.stop());
                    scanner.style.display = 'none';
                }, 5000);
                
            } catch (err) {
                alert('Camera access denied');
                scanner.style.display = 'none';
            }
        }
        
        // Initialize
        connect();
        
        // Install as PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js');
        }
        
        // Handle install prompt
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            // Show install button
        });
    </script>
</body>
</html>
        `;
    }
}

// Main launch
async function launchCompanionSystem(masterPhone) {
    const companion = new CompanionGatekeeperSystem();
    await companion.initialize(masterPhone);
    
    // Set up tier 1 integration
    const tier1 = new Tier1Integration();
    await tier1.connectToTier1(companion);
    
    // Serve PWA
    const pwaApp = express();
    pwaApp.get('/', (req, res) => {
        res.send(MobilePWA.generatePWA());
    });
    pwaApp.listen(8892, () => {
        console.log('📱 PWA available at http://localhost:8892');
    });
    
    console.log('\n🎯 COMPANION GATEKEEPER READY!');
    console.log('\nAccess points:');
    console.log('  QR Auth: http://localhost:8888');
    console.log('  Webhooks: http://localhost:8890');
    console.log('  SMS Gateway: http://localhost:8891');
    console.log('  Mobile PWA: http://localhost:8892');
    console.log('\n📱 Text commands to your phone:');
    console.log('  CAL <message> - Talk to Cal');
    console.log('  APPROVE <session> - Approve login');
    console.log('  EXEC <command> - Execute command');
    console.log('  TIER <n> <action> - Control tier');
    console.log('\nYour phone is now the master key! 🔑');
}

// Export
module.exports = {
    CompanionGatekeeperSystem,
    QRMobileAuth,
    WebhookBridge,
    MobileGateway,
    CalCompanion,
    Tier1Integration,
    launchCompanionSystem
};

// Run if called directly
if (require.main === module) {
    const masterPhone = process.env.MASTER_PHONE || '+1234567890';
    launchCompanionSystem(masterPhone).catch(console.error);
}