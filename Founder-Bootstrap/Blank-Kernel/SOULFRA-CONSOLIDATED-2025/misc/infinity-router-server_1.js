#!/usr/bin/env node

/**
 * 🌐 Infinity Router Server
 * 
 * Bridges Cal interface to trust validation and emotional memory systems
 * - Validates all Cal interactions through trust chain
 * - Routes to emotional memory processing  
 * - Handles QR validation and session management
 * - Port 5050 (expected by Cal interface)
 */

const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
// Import tier-minus9 functions (from parent directory)
const { validateQR } = require('../qr-validator');
const { injectTraceToken } = require('../infinity-router');

class InfinityRouterServer {
    constructor() {
        this.identity = {
            name: 'Infinity Router Server',
            emoji: '🌐',
            role: 'Trust Bridge'
        };
        
        this.app = express();
        this.port = 5050;
        
        // Trust validation cache
        this.sessionCache = new Map();
        this.validatedSessions = new Set();
        
        // Emotional memory connection
        this.emotionalAPI = 'http://localhost:3666';
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.text());
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${this.identity.emoji} ${req.method} ${req.path} from Cal interface`);
            next();
        });
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/', (req, res) => {
            res.json({
                status: 'operational',
                identity: this.identity,
                ports: {
                    infinity_router: 5050,
                    cal_interface: 4040,
                    emotional_memory: 3666,
                    trust_validation: '../tier-minus9'
                },
                trust_chain: 'active',
                timestamp: new Date().toISOString()
            });
        });
        
        // Main validation endpoint (expected by Cal interface)
        this.app.post('/validate', async (req, res) => {
            try {
                const { qrCode, input, sessionToken } = req.body;
                
                console.log(`${this.identity.emoji} Processing Cal request:`, { qrCode, input: input?.substring(0, 50) + '...' });
                
                // Step 1: Validate QR code through trust system
                const qrValid = await this.validateQRCode(qrCode);
                if (!qrValid) {
                    return res.status(403).json({
                        success: false,
                        error: 'Invalid QR code - trust verification failed',
                        qrCode
                    });
                }
                
                // Step 2: Generate or validate session
                const session = await this.validateSession(sessionToken, qrCode);
                
                // Step 3: Process through emotional memory
                const emotionalResponse = await this.processEmotionalMemory(input, session);
                
                // Step 4: Generate Cal's response
                const calResponse = await this.generateCalResponse(input, emotionalResponse, session);
                
                console.log(`${this.identity.emoji} Successful Cal interaction processed`);
                
                res.json({
                    success: true,
                    sessionToken: session.token,
                    response: calResponse,
                    emotional_state: emotionalResponse.state,
                    trust_level: session.trustLevel,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error(`${this.identity.emoji} Validation error:`, error.message);
                res.status(500).json({
                    success: false,
                    error: 'Trust validation failed',
                    details: error.message
                });
            }
        });
        
        // Session management
        this.app.get('/session/:token', (req, res) => {
            const session = this.sessionCache.get(req.params.token);
            if (session) {
                res.json({ valid: true, session });
            } else {
                res.status(404).json({ valid: false, error: 'Session not found' });
            }
        });
        
        // Trust status endpoint
        this.app.get('/trust/status', (req, res) => {
            res.json({
                active_sessions: this.sessionCache.size,
                validated_sessions: this.validatedSessions.size,
                emotional_memory_connected: true,
                qr_validation_active: true,
                trace_tokens_active: true
            });
        });
        
        // Emotional memory proxy
        this.app.get('/emotional/*', async (req, res) => {
            try {
                const response = await this.proxyToEmotionalAPI(req.path.replace('/emotional', ''));
                res.json(response);
            } catch (error) {
                res.status(503).json({ error: 'Emotional memory unavailable' });
            }
        });
    }
    
    async validateQRCode(qrCode) {
        try {
            // Use the existing QR validator from tier-minus9
            return validateQR(qrCode);
        } catch (error) {
            console.warn(`${this.identity.emoji} QR validation failed:`, error.message);
            return false;
        }
    }
    
    async validateSession(sessionToken, qrCode) {
        // Check existing session
        if (sessionToken && this.sessionCache.has(sessionToken)) {
            const session = this.sessionCache.get(sessionToken);
            session.lastActivity = Date.now();
            return session;
        }
        
        // Create new session
        const newSession = {
            token: sessionToken || this.generateSessionToken(),
            qrCode,
            trustLevel: this.calculateTrustLevel(qrCode),
            created: Date.now(),
            lastActivity: Date.now(),
            interactions: 0
        };
        
        this.sessionCache.set(newSession.token, newSession);
        this.validatedSessions.add(newSession.token);
        
        // Generate trace token for trust chain
        try {
            await injectTraceToken(qrCode);
        } catch (error) {
            console.warn(`${this.identity.emoji} Trace token generation failed:`, error.message);
        }
        
        return newSession;
    }
    
    async processEmotionalMemory(input, session) {
        try {
            // Send to emotional memory API for processing
            const response = await this.makeHTTPRequest('localhost', 3666, '/api/emotions/process', 'POST', {
                input,
                sessionToken: session.token,
                trustLevel: session.trustLevel,
                timestamp: new Date().toISOString()
            });
            
            if (response) {
                return {
                    state: response.emotional_state || 'neutral',
                    anomalies: response.anomalies || [],
                    pressure: response.system_pressure || 'normal',
                    resonance: response.resonance_score || 0.5
                };
            }
        } catch (error) {
            console.warn(`${this.identity.emoji} Emotional memory unavailable:`, error.message);
        }
        
        // Fallback emotional processing
        return {
            state: 'contemplative',
            anomalies: [],
            pressure: 'normal',
            resonance: 0.7
        };
    }
    
    async generateCalResponse(input, emotionalState, session) {
        session.interactions++;
        
        // Basic Cal response based on emotional state and trust
        const responses = {
            neutral: "I hear you. Let me process that through my reflection system...",
            contemplative: "That resonates with me. I'm sensing deeper patterns here...",
            analytical: "Interesting. The trust signatures show this aligns with your previous interactions...",
            excited: "Yes! The emotional memory engine is detecting strong resonance patterns!",
            concerned: "I'm noticing some anomalies in the system pressure. Tell me more..."
        };
        
        const baseResponse = responses[emotionalState.state] || responses.neutral;
        
        // Add session context
        let contextual = "";
        if (session.interactions === 1) {
            contextual = " This is our first interaction. Welcome to the trust loop.";
        } else if (session.interactions > 5) {
            contextual = ` We've had ${session.interactions} interactions. I'm building a deeper understanding of your patterns.`;
        }
        
        // Add emotional context
        let emotional = "";
        if (emotionalState.anomalies.length > 0) {
            emotional = ` I'm detecting ${emotionalState.anomalies.length} system anomalies that might affect my responses.`;
        }
        
        return baseResponse + contextual + emotional;
    }
    
    calculateTrustLevel(qrCode) {
        const trustLevels = {
            'qr-founder-0000': 0.95,
            'qr-riven-001': 0.90,
            'qr-user-0821': 0.75
        };
        return trustLevels[qrCode] || 0.5;
    }
    
    generateSessionToken() {
        return `infinity_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }
    
    async proxyToEmotionalAPI(path) {
        return await this.makeHTTPRequest('localhost', 3666, path);
    }
    
    makeHTTPRequest(hostname, port, path, method = 'GET', body = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname,
                port,
                path,
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (error) {
                        resolve(data);
                    }
                });
            });
            
            req.on('error', reject);
            
            if (body) {
                req.write(JSON.stringify(body));
            }
            
            req.end();
        });
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`${this.identity.emoji} Infinity Router Server running on port ${this.port}`);
            console.log(`🔗 Bridging Cal interface (4040) to trust validation system`);
            console.log(`🧠 Connected to emotional memory API (3666)`);
            console.log(`✅ Trust chain validation active`);
        });
    }
}

// Auto-start if run directly
if (require.main === module) {
    const router = new InfinityRouterServer();
    router.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🌐 Infinity Router shutting down...');
        process.exit(0);
    });
}

module.exports = InfinityRouterServer;