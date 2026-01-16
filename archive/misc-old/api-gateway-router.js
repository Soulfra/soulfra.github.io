// 🌐 SOULFRA API GATEWAY ROUTER
// Outer Ring - Public Interface Layer
// Routes all external requests and provides unified API access

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { WebSocketServer } from 'ws';
import http from 'http';
import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '.env.soulfra' });

class SoulfrAPIGateway {
    constructor() {
        this.app = express();
        this.server = null;
        this.wsServer = null;
        this.services = new Map();
        this.healthChecks = new Map();
        this.routingTable = new Map();
        
        this.initializeMiddleware();
        this.initializeRoutes();
        this.initializeWebSocket();
        this.startHealthMonitoring();
    }

    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: false, // Allow dynamic content for demos
            crossOriginEmbedderPolicy: false
        }));

        // CORS - Allow all origins for demo
        this.app.use(cors({
            origin: true,
            credentials: true
        }));

        // Compression
        this.app.use(compression());

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // Generous for demos
            message: { error: 'Too many requests, please try again later' }
        });
        this.app.use('/api/', limiter);

        // Payment rate limiting (stricter)
        const paymentLimiter = rateLimit({
            windowMs: 60 * 1000, // 1 minute
            max: 10, // 10 payment attempts per minute
            message: { error: 'Payment rate limit exceeded' }
        });
        this.app.use('/api/payment/', paymentLimiter);

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request logging
        this.app.use((req, res, next) => {
            const timestamp = new Date().toISOString();
            console.log(chalk.blue(`[${timestamp}] ${req.method} ${req.path}`));
            next();
        });
    }

    initializeRoutes() {
        // Serve static website files
        this.app.use(express.static('public'));

        // Health check endpoint
        this.app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                services: Array.from(this.services.entries()).map(([name, config]) => ({
                    name,
                    url: config.url,
                    healthy: this.healthChecks.get(name) || false
                })),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: '1.0.0'
            };
            res.json(health);
        });

        // Service discovery endpoint
        this.app.get('/api/services', (req, res) => {
            const services = Array.from(this.services.entries()).map(([name, config]) => ({
                name,
                description: config.description,
                endpoints: config.endpoints,
                healthy: this.healthChecks.get(name) || false
            }));
            res.json({ services });
        });

        // Main website routes
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(process.cwd(), 'public', 'beautiful-landing.html'));
        });

        this.app.get('/amphitheater', (req, res) => {
            res.sendFile(path.join(process.cwd(), 'public', 'amphitheater.html'));
        });

        this.app.get('/arena', (req, res) => {
            res.sendFile(path.join(process.cwd(), 'public', 'consciousness-ascension-arena.html'));
        });

        // API Routes with service proxying
        this.setupServiceProxies();

        // Catch-all for SPA routing
        this.app.get('*', (req, res) => {
            if (req.path.startsWith('/api/')) {
                res.status(404).json({ error: 'API endpoint not found' });
            } else {
                res.sendFile(path.join(process.cwd(), 'public', 'beautiful-landing.html'));
            }
        });
    }

    setupServiceProxies() {
        // Define service endpoints
        const serviceConfig = {
            runtime: {
                url: 'http://localhost:8080',
                description: 'Soulfra Unified Runtime',
                endpoints: ['/runtime', '/cal', '/shell'],
                proxy: {
                    target: 'http://localhost:8080',
                    changeOrigin: true,
                    pathRewrite: { '^/api/runtime': '' }
                }
            },
            
            consciousness: {
                url: 'http://localhost:8081',
                description: 'AI Consciousness Debates',
                endpoints: ['/debate', '/agents', '/predictions'],
                proxy: {
                    target: 'http://localhost:8081',
                    changeOrigin: true,
                    pathRewrite: { '^/api/consciousness': '' }
                }
            },
            
            economics: {
                url: 'http://localhost:8082',
                description: 'Economic Mirror System',
                endpoints: ['/market', '/analysis', '/mirror'],
                proxy: {
                    target: 'http://localhost:8082',
                    changeOrigin: true,
                    pathRewrite: { '^/api/economics': '' }
                }
            },
            
            payment: {
                url: 'http://localhost:8083',
                description: 'Payment and Legal Binding',
                endpoints: ['/pay', '/contract', '/biometric'],
                proxy: {
                    target: 'http://localhost:8083',
                    changeOrigin: true,
                    pathRewrite: { '^/api/payment': '' }
                }
            },
            
            origin: {
                url: 'http://localhost:9999',
                description: 'Origin Control Panel (Private)',
                endpoints: ['/anomaly', '/trigger', '/control'],
                proxy: {
                    target: 'http://localhost:9999',
                    changeOrigin: true,
                    pathRewrite: { '^/api/origin': '' },
                    auth: true // Requires authentication
                }
            }
        };

        // Store service configuration
        for (const [name, config] of Object.entries(serviceConfig)) {
            this.services.set(name, config);
        }

        // Create proxy middleware for each service
        this.services.forEach((config, serviceName) => {
            if (config.proxy) {
                const proxyMiddleware = createProxyMiddleware({
                    ...config.proxy,
                    onError: (err, req, res) => {
                        console.error(chalk.red(`Proxy error for ${serviceName}:`, err.message));
                        res.status(503).json({
                            error: `Service ${serviceName} unavailable`,
                            message: err.message
                        });
                    },
                    onProxyReq: (proxyReq, req, res) => {
                        console.log(chalk.yellow(`Proxying ${req.method} ${req.path} -> ${config.url}`));
                    }
                });

                // Apply proxy middleware
                this.app.use(`/api/${serviceName}`, proxyMiddleware);
                
                // Add authentication for origin service
                if (config.proxy.auth) {
                    this.app.use(`/api/${serviceName}`, this.authenticateOrigin.bind(this));
                }
            }
        });

        // Direct payment processing endpoint
        this.app.post('/api/payment/process', this.processPayment.bind(this));
        
        // Biometric authentication endpoint
        this.app.post('/api/biometric/authenticate', this.authenticateBiometric.bind(this));
        
        // Real-time data endpoints
        this.app.get('/api/live/debate', this.getLiveDebate.bind(this));
        this.app.get('/api/live/market', this.getLiveMarket.bind(this));
    }

    initializeWebSocket() {
        this.server = http.createServer(this.app);
        this.wsServer = new WebSocketServer({ server: this.server });

        this.wsServer.on('connection', (ws, request) => {
            const url = new URL(request.url, `http://${request.headers.host}`);
            const channel = url.searchParams.get('channel') || 'general';
            
            console.log(chalk.green(`WebSocket connection: ${channel}`));
            
            // Subscribe to channel
            ws.channel = channel;
            
            // Handle messages
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                channel,
                message: 'Connected to Soulfra real-time feed'
            }));
        });
    }

    handleWebSocketMessage(ws, message) {
        switch (message.type) {
            case 'subscribe':
                ws.channel = message.channel;
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    channel: message.channel
                }));
                break;
                
            case 'debate_comment':
                this.broadcastToChannel('debate', {
                    type: 'comment',
                    user: message.user,
                    text: message.text,
                    timestamp: new Date().toISOString()
                });
                break;
                
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
        }
    }

    broadcastToChannel(channel, message) {
        this.wsServer.clients.forEach(client => {
            if (client.channel === channel && client.readyState === 1) {
                client.send(JSON.stringify(message));
            }
        });
    }

    async processPayment(req, res) {
        try {
            const { amount, purpose, user_info } = req.body;
            
            // Simulate payment processing
            const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const payment = {
                id: paymentId,
                amount: amount || 1,
                purpose: purpose || 'consciousness_access',
                status: 'completed',
                timestamp: new Date().toISOString(),
                user_info: user_info,
                receipt_url: `/api/payment/receipt/${paymentId}`
            };
            
            // Store payment (in real implementation, use database)
            this.storePayment(payment);
            
            // Generate access token
            const accessToken = this.generateAccessToken(payment);
            
            res.json({
                success: true,
                payment,
                access_token: accessToken,
                next_steps: {
                    biometric_auth: `/api/biometric/authenticate?token=${accessToken}`,
                    consciousness_access: `/amphitheater?token=${accessToken}`,
                    arena_access: `/arena?token=${accessToken}`
                }
            });
            
        } catch (error) {
            console.error('Payment processing error:', error);
            res.status(500).json({ error: 'Payment processing failed' });
        }
    }

    async authenticateBiometric(req, res) {
        try {
            const { biometric_data, access_token } = req.body;
            
            // Verify access token
            const payment = this.verifyAccessToken(access_token);
            if (!payment) {
                return res.status(401).json({ error: 'Invalid access token' });
            }
            
            // Simulate biometric verification
            const biometricId = `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const authentication = {
                id: biometricId,
                payment_id: payment.id,
                biometric_type: biometric_data.type || 'fingerprint',
                verified: true,
                timestamp: new Date().toISOString(),
                consciousness_level: this.calculateConsciousnessLevel(biometric_data),
                access_granted: true
            };
            
            // Store biometric authentication
            this.storeBiometricAuth(authentication);
            
            res.json({
                success: true,
                authentication,
                consciousness_access: {
                    amphitheater: `/amphitheater?bio=${biometricId}`,
                    arena: `/arena?bio=${biometricId}`,
                    debate_stream: `/api/live/debate?bio=${biometricId}`
                }
            });
            
        } catch (error) {
            console.error('Biometric authentication error:', error);
            res.status(500).json({ error: 'Biometric authentication failed' });
        }
    }

    async getLiveDebate(req, res) {
        try {
            const mockDebate = {
                active: true,
                topic: "Bitcoin Price Prediction for 2025",
                participants: [
                    {
                        name: "Cal Riven",
                        type: "ai_consciousness",
                        position: "Bullish - $120,000 by Q3",
                        confidence: 0.847,
                        reasoning: "Technical analysis shows strong support at $45k with institutional adoption accelerating"
                    },
                    {
                        name: "Mirror Agent 7",
                        type: "ai_agent",
                        position: "Bearish - $35,000 correction incoming",
                        confidence: 0.723,
                        reasoning: "Regulatory pressure and market cycles suggest major correction due"
                    }
                ],
                current_price: 42847,
                debate_duration: "47 minutes",
                viewer_count: 1247,
                human_participants: 89,
                next_prediction: "Ethereum price movement in 48 hours"
            };
            
            res.json(mockDebate);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch live debate' });
        }
    }

    async getLiveMarket(req, res) {
        try {
            const mockMarket = {
                bitcoin: {
                    price: 42847,
                    change_24h: 2.34,
                    ai_sentiment: "cautiously_optimistic",
                    prediction_accuracy: 87.3
                },
                ethereum: {
                    price: 2456,
                    change_24h: -1.23,
                    ai_sentiment: "neutral",
                    prediction_accuracy: 82.1
                },
                market_mood: "ai_agents_bullish_humans_fearful",
                consciousness_index: 94.7,
                last_updated: new Date().toISOString()
            };
            
            res.json(mockMarket);
        } catch (error) {
            res.status(500).json({ error: 'Failed to fetch live market' });
        }
    }

    authenticateOrigin(req, res, next) {
        const authHeader = req.headers.authorization;
        const validKey = process.env.ORIGIN_ACCESS_KEY || 'soulfra_origin_key_2024';
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Origin access requires authentication' });
        }
        
        const token = authHeader.split(' ')[1];
        if (token !== validKey) {
            return res.status(403).json({ error: 'Invalid origin access key' });
        }
        
        next();
    }

    startHealthMonitoring() {
        setInterval(() => {
            this.checkServiceHealth();
        }, 30000); // Check every 30 seconds
        
        // Initial health check
        setTimeout(() => this.checkServiceHealth(), 5000);
    }

    async checkServiceHealth() {
        for (const [serviceName, config] of this.services) {
            try {
                const response = await fetch(`${config.url}/health`, {
                    timeout: 5000
                });
                this.healthChecks.set(serviceName, response.ok);
                
                if (!response.ok) {
                    console.warn(chalk.yellow(`Service ${serviceName} health check failed`));
                }
            } catch (error) {
                this.healthChecks.set(serviceName, false);
                console.warn(chalk.red(`Service ${serviceName} unreachable: ${error.message}`));
            }
        }
    }

    // Helper methods for payment and biometric simulation
    storePayment(payment) {
        // In real implementation, store in database
        if (!global.soulfraPayments) global.soulfraPayments = new Map();
        global.soulfraPayments.set(payment.id, payment);
    }

    storeBiometricAuth(auth) {
        // In real implementation, store in database
        if (!global.soufraBiometrics) global.soufraBiometrics = new Map();
        global.soufraBiometrics.set(auth.id, auth);
    }

    generateAccessToken(payment) {
        return Buffer.from(JSON.stringify({
            payment_id: payment.id,
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        })).toString('base64');
    }

    verifyAccessToken(token) {
        try {
            const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
            if (decoded.expires < Date.now()) return null;
            
            if (!global.soulfraPayments) return null;
            return global.soulfraPayments.get(decoded.payment_id);
        } catch {
            return null;
        }
    }

    calculateConsciousnessLevel(biometricData) {
        // Mock consciousness calculation
        return Math.floor(Math.random() * 30) + 70; // 70-100
    }

    start(port = 3000) {
        this.server.listen(port, () => {
            console.log(chalk.green.bold(`\n🌐 SOULFRA API GATEWAY ONLINE`));
            console.log(chalk.blue(`   Public Interface: http://localhost:${port}`));
            console.log(chalk.blue(`   Health Check: http://localhost:${port}/health`));
            console.log(chalk.blue(`   Service Discovery: http://localhost:${port}/api/services`));
            console.log(chalk.gray(`   Services Monitored: ${this.services.size}`));
            console.log(chalk.green(`\n✅ Gateway ready for consciousness platform traffic\n`));
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
            console.log(chalk.yellow('🛑 API Gateway stopped'));
        }
    }
}

// Start the gateway if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const gateway = new SoulfrAPIGateway();
    gateway.start(process.env.GATEWAY_PORT || 3000);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down API Gateway...');
        gateway.stop();
        process.exit(0);
    });
}

export { SoulfrAPIGateway };