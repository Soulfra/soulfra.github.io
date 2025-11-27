// Local Runner for Mirror Kernel Testing
// Provides a complete testing environment for all Mirror components

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import our core components
const StripeAPIRouter = require('../vault/routing/stripe-api-router');
const SecureDevicePairing = require('../vault/pairing/device-pairing-secure');

class MirrorTestRunner {
    constructor() {
        this.app = express();
        this.port = 3333;
        this.stripeRouter = new StripeAPIRouter();
        this.devicePairing = new SecureDevicePairing();
        
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../')));
        
        // CORS for development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        // Logging middleware
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        // Main UI routes
        this.app.get('/', this.serveMainUI.bind(this));
        this.app.get('/soft', this.serveSoftUI.bind(this));
        this.app.get('/platform', this.servePlatformUI.bind(this));
        
        // API routes
        this.app.post('/api/route', this.handleAPIRoute.bind(this));
        this.app.post('/api/pair', this.handleDevicePairing.bind(this));
        this.app.post('/api/validate-qr', this.handleQRValidation.bind(this));
        this.app.post('/api/voice', this.handleVoiceInput.bind(this));
        this.app.post('/api/export', this.handleExport.bind(this));
        
        // Debug routes
        this.app.get('/debug/sessions', this.getDebugSessions.bind(this));
        this.app.get('/debug/usage', this.getDebugUsage.bind(this));
        this.app.get('/debug/receipts', this.getDebugReceipts.bind(this));
        this.app.get('/debug/logs', this.getDebugLogs.bind(this));
        
        // Testing data routes
        this.app.get('/api/test-qr-codes', this.getTestQRCodes.bind(this));
        this.app.get('/api/sample-agents', this.getSampleAgents.bind(this));
    }

    async serveMainUI(req, res) {
        const mode = req.query.mode || 'soft';
        
        if (mode === 'platform') {
            return this.servePlatformUI(req, res);
        } else {
            return this.serveSoftUI(req, res);
        }
    }

    async serveSoftUI(req, res) {
        try {
            const htmlPath = path.join(__dirname, 'mirror-ui-shell.html');
            let html = await fs.readFile(htmlPath, 'utf8');
            
            // Inject test configuration
            html = html.replace(
                '</head>',
                `<script>window.MIRROR_TEST_MODE = true; window.MIRROR_MODE = 'soft';</script></head>`
            );
            
            res.send(html);
        } catch (error) {
            res.status(500).send('Error loading Soft Mode UI');
        }
    }

    async servePlatformUI(req, res) {
        try {
            const htmlPath = path.join(__dirname, 'mirror-ui-admin.html');
            let html = await fs.readFile(htmlPath, 'utf8');
            
            // Inject test configuration
            html = html.replace(
                '</head>',
                `<script>window.MIRROR_TEST_MODE = true; window.MIRROR_MODE = 'platform';</script></head>`
            );
            
            res.send(html);
        } catch (error) {
            res.status(500).send('Error loading Platform Mode UI');
        }
    }

    async handleAPIRoute(req, res) {
        try {
            const routingResult = await this.stripeRouter.routeAPICall(req.body);
            res.json(routingResult);
        } catch (error) {
            console.error('API routing error:', error);
            res.status(500).json({ error: 'API routing failed' });
        }
    }

    async handleDevicePairing(req, res) {
        try {
            const pairingSession = await this.devicePairing.generatePairingSession(req.body);
            res.json(pairingSession);
        } catch (error) {
            console.error('Device pairing error:', error);
            res.status(500).json({ error: 'Device pairing failed' });
        }
    }

    async handleQRValidation(req, res) {
        try {
            const { qrData, deviceInfo } = req.body;
            const validation = await this.devicePairing.validatePairing(qrData, deviceInfo);
            res.json(validation);
        } catch (error) {
            console.error('QR validation error:', error);
            res.status(500).json({ error: 'QR validation failed' });
        }
    }

    async handleVoiceInput(req, res) {
        try {
            const { transcript, sessionId } = req.body;
            
            // Simulate voice processing (Whisper stub)
            const processedVoice = {
                transcript: transcript,
                confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0
                emotion: this.detectEmotion(transcript),
                intent: this.detectIntent(transcript),
                timestamp: new Date().toISOString(),
                processingTime: Math.floor(Math.random() * 500) + 200 // 200-700ms
            };

            console.log(`🎤 Voice processed: "${transcript}" (${processedVoice.emotion})`);
            
            res.json({ success: true, result: processedVoice });
        } catch (error) {
            console.error('Voice processing error:', error);
            res.status(500).json({ error: 'Voice processing failed' });
        }
    }

    async handleExport(req, res) {
        try {
            const { agentId, sessionId, userMode } = req.body;
            
            // Simulate export process
            const exportId = 'exp_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
            const cost = userMode === 'platform' ? 0.01 : 1.00;
            
            // Generate receipt
            const receipt = {
                exportId: exportId,
                agentId: agentId,
                sessionId: sessionId,
                amount: cost,
                currency: 'USD',
                timestamp: new Date().toISOString(),
                paymentMethod: 'stripe_test',
                status: 'completed'
            };

            // Save receipt (simulate)
            console.log(`💰 Export completed: ${exportId} ($${cost})`);
            
            res.json({ 
                success: true, 
                exportId: exportId,
                receipt: receipt,
                downloadUrl: `/exports/${agentId}/${exportId}.zip`
            });
        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({ error: 'Export failed' });
        }
    }

    detectEmotion(text) {
        const emotions = {
            'happy': ['good', 'great', 'awesome', 'love', 'excited', 'joy'],
            'sad': ['bad', 'terrible', 'sad', 'depressed', 'down', 'upset'],
            'anxious': ['worried', 'nervous', 'stress', 'anxious', 'fear', 'panic'],
            'reflective': ['think', 'wonder', 'reflect', 'consider', 'ponder', 'contemplate'],
            'grateful': ['thank', 'grateful', 'appreciate', 'blessed', 'fortunate']
        };

        const lowerText = text.toLowerCase();
        
        for (const [emotion, keywords] of Object.entries(emotions)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return emotion;
            }
        }
        
        return 'neutral';
    }

    detectIntent(text) {
        const intents = {
            'reflection': ['reflect', 'think about', 'consider', 'ponder'],
            'question': ['what', 'how', 'why', 'when', 'where', '?'],
            'action': ['do', 'make', 'create', 'build', 'start'],
            'memory': ['remember', 'recall', 'forget', 'memory'],
            'sharing': ['share', 'tell', 'show', 'send']
        };

        const lowerText = text.toLowerCase();
        
        for (const [intent, patterns] of Object.entries(intents)) {
            if (patterns.some(pattern => lowerText.includes(pattern))) {
                return intent;
            }
        }
        
        return 'general';
    }

    async getDebugSessions(req, res) {
        try {
            const sessions = Array.from(this.devicePairing.activeSessions.entries()).map(([id, session]) => ({
                sessionId: id,
                status: session.status,
                created: session.created,
                expires: session.expires,
                paired: session.paired,
                location: session.location?.city || 'unknown'
            }));
            
            res.json({ sessions });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get sessions' });
        }
    }

    async getDebugUsage(req, res) {
        try {
            const usage = Array.from(this.stripeRouter.usageTracking.entries()).map(([key, data]) => ({
                key,
                ...data
            }));
            
            res.json({ usage });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get usage data' });
        }
    }

    async getDebugReceipts(req, res) {
        try {
            const receipts = Array.from(this.stripeRouter.receipts.entries()).map(([id, receipt]) => ({
                receiptId: id,
                amount: receipt.amount,
                timestamp: receipt.timestamp,
                agentId: receipt.agentId,
                status: receipt.stripe.status
            }));
            
            res.json({ receipts });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get receipts' });
        }
    }

    async getDebugLogs(req, res) {
        try {
            const recentEvents = this.stripeRouter.apiEvents.slice(-50);
            res.json({ events: recentEvents });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get logs' });
        }
    }

    async getTestQRCodes(req, res) {
        const testCodes = {
            'qr-founder-0000': {
                type: 'founder',
                description: 'Founder-level access with full privileges',
                valid: true
            },
            'qr-riven-001': {
                type: 'riven',
                description: 'Cal Riven operator access',
                valid: true
            },
            'qr-user-0821': {
                type: 'user',
                description: 'Standard user access',
                valid: true
            },
            'qr-test-invalid': {
                type: 'test',
                description: 'Invalid test code for error handling',
                valid: false
            }
        };
        
        res.json({ testCodes });
    }

    async getSampleAgents(req, res) {
        const sampleAgents = [
            {
                agentId: 'reflection-core-001',
                type: 'reflection',
                status: 'active',
                spawnedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                memoryUsage: '45MB',
                personality: 'contemplative',
                triggeringPrompt: 'I need to think about my career direction'
            },
            {
                agentId: 'emotional-processor-7',
                type: 'emotional',
                status: 'active',
                spawnedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                memoryUsage: '78MB',
                personality: 'empathetic',
                triggeringPrompt: 'I feel overwhelmed and need emotional support'
            },
            {
                agentId: 'voice-analyzer-2',
                type: 'voice',
                status: 'idle',
                spawnedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                memoryUsage: '23MB',
                personality: 'analytical',
                triggeringPrompt: 'Voice message about daily routine analysis'
            }
        ];
        
        res.json({ agents: sampleAgents });
    }

    async start() {
        try {
            // Initialize components
            await this.stripeRouter.initialize();
            await this.devicePairing.initialize();
            
            // Start server
            this.app.listen(this.port, () => {
                console.log('\n🪞 Mirror Kernel Test Runner Started');
                console.log('=====================================');
                console.log(`📱 Soft Mode UI:     http://localhost:${this.port}`);
                console.log(`🏢 Platform Mode UI: http://localhost:${this.port}?mode=platform`);
                console.log(`🔧 Debug API:        http://localhost:${this.port}/debug/sessions`);
                console.log('=====================================');
                console.log('✅ Ready for user testing!');
                console.log('📖 See user-test-README.md for test scenarios\n');
            });
            
        } catch (error) {
            console.error('Failed to start Mirror Test Runner:', error);
            process.exit(1);
        }
    }
}

// Start the test runner
const runner = new MirrorTestRunner();
runner.start().catch(console.error);

module.exports = MirrorTestRunner;