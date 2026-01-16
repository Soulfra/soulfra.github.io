// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Soulfra API Router
 * Unified REST API layer wrapping existing infrastructure
 */

const express = require('express');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');

// Import existing systems
const LocalLoopRuntimeEngine = require('../runtime/LocalLoopRuntimeEngine');
const DriftRatingEngine = require('../rating/DriftRatingEngine');
const WhisperPersonaSpawn = require('../whisper/WhisperPersonaSpawn');
const CalForecast = require('../forecast/CalForecast');
const GuildLoops = require('../guild/GuildLoops');
const LoopBlessingDaemon = require('../blessing/LoopBlessingDaemon');
const LoopForkKit = require('../fork/LoopForkKit');
const SwipeUI = require('../ui/SwipeUI');

class SoulfraAPIRouter extends EventEmitter {
    constructor() {
        super();
        
        this.app = express();
        this.port = process.env.SOULFRA_API_PORT || 8080;
        
        // Initialize subsystems
        this.systems = {
            runtime: new LocalLoopRuntimeEngine(),
            rating: new DriftRatingEngine(),
            whisper: new WhisperPersonaSpawn(),
            forecast: new CalForecast(),
            guild: new GuildLoops(),
            blessing: new LoopBlessingDaemon(),
            fork: new LoopForkKit()
        };
        
        // API configuration
        this.config = {
            version: 'v2',
            rate_limit: {
                window_ms: 15 * 60 * 1000, // 15 minutes
                max_requests: 100
            },
            cors: {
                origin: process.env.CORS_ORIGIN || '*',
                credentials: true
            }
        };
        
        // Request tracking
        this.metrics = {
            total_requests: 0,
            endpoints: new Map(),
            errors: 0,
            response_times: []
        };
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        // CORS
        this.app.use(cors(this.config.cors));
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            const start = Date.now();
            this.metrics.total_requests++;
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                this.metrics.response_times.push(duration);
                
                // Track endpoint usage
                const endpoint = `${req.method} ${req.path}`;
                const count = this.metrics.endpoints.get(endpoint) || 0;
                this.metrics.endpoints.set(endpoint, count + 1);
                
                console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
            });
            
            next();
        });
        
        // Error handling
        this.app.use((err, req, res, next) => {
            this.metrics.errors++;
            console.error('API Error:', err);
            
            res.status(err.status || 500).json({
                error: {
                    message: err.message || 'Internal server error',
                    code: err.code || 'INTERNAL_ERROR',
                    timestamp: new Date().toISOString()
                }
            });
        });
    }
    
    setupRoutes() {
        const v2 = express.Router();
        
        // Health check
        v2.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                version: this.config.version,
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            });
        });
        
        // System status
        v2.get('/status', (req, res) => {
            res.json({
                systems: Object.keys(this.systems).reduce((acc, name) => {
                    acc[name] = 'active';
                    return acc;
                }, {}),
                metrics: {
                    requests: this.metrics.total_requests,
                    errors: this.metrics.errors,
                    avg_response_time: this.calculateAverageResponseTime()
                }
            });
        });
        
        // Loop operations
        v2.post('/loops/execute', async (req, res, next) => {
            try {
                const result = await this.systems.runtime.executeLoop(req.body.loop, req.body.options);
                res.json({ success: true, result });
            } catch (err) {
                next(err);
            }
        });
        
        v2.get('/loops/:loopId', async (req, res, next) => {
            try {
                const loop = this.systems.runtime.localStorage.loops.get(req.params.loopId);
                if (!loop) {
                    return res.status(404).json({ error: { message: 'Loop not found' } });
                }
                res.json(loop);
            } catch (err) {
                next(err);
            }
        });
        
        v2.post('/loops/:loopId/fork', async (req, res, next) => {
            try {
                const result = await this.systems.fork.forkLoop(req.params.loopId, req.body.options);
                res.json(result);
            } catch (err) {
                next(err);
            }
        });
        
        v2.post('/loops/:loopId/bless', async (req, res, next) => {
            try {
                const result = await this.systems.blessing.blessLoop(req.params.loopId, req.body.blessing);
                res.json(result);
            } catch (err) {
                next(err);
            }
        });
        
        // Drift and rating
        v2.get('/drift/rating/:entityId', async (req, res, next) => {
            try {
                const rating = await this.systems.rating.getRating(req.params.entityId);
                if (!rating) {
                    return res.status(404).json({ error: { message: 'Rating not found' } });
                }
                res.json(rating);
            } catch (err) {
                next(err);
            }
        });
        
        v2.get('/drift/volatility', (req, res) => {
            const index = this.systems.rating.getVolatilityIndex();
            res.json(index || { message: 'No volatility data available' });
        });
        
        v2.get('/drift/critical', (req, res) => {
            const critical = this.systems.rating.getCriticalEntities();
            res.json({ entities: critical, count: critical.length });
        });
        
        // Whisper operations
        v2.post('/whisper/spawn', async (req, res, next) => {
            try {
                const persona = await this.systems.whisper.spawnPersonaFromWhisper(req.body.whisper);
                res.json(persona);
            } catch (err) {
                next(err);
            }
        });
        
        v2.get('/whisper/personas', (req, res) => {
            const personas = Array.from(this.systems.whisper.spawnedPersonas.values());
            res.json({ personas, count: personas.length });
        });
        
        // Forecast operations
        v2.post('/forecast/predict', async (req, res, next) => {
            try {
                const forecast = await this.systems.forecast.predictFuture(
                    req.body.loopData,
                    req.body.currentEntropy,
                    req.body.patterns,
                    req.body.hoursAhead || 24
                );
                res.json(forecast);
            } catch (err) {
                next(err);
            }
        });
        
        v2.get('/forecast/:loopId', async (req, res, next) => {
            try {
                const forecast = await this.systems.forecast.getForecast(req.params.loopId);
                if (!forecast) {
                    return res.status(404).json({ error: { message: 'Forecast not found' } });
                }
                res.json(forecast);
            } catch (err) {
                next(err);
            }
        });
        
        // Guild operations
        v2.post('/guild/create', async (req, res, next) => {
            try {
                const guild = await this.systems.guild.createGuild(req.body);
                res.json(guild);
            } catch (err) {
                next(err);
            }
        });
        
        v2.post('/guild/:guildId/join', async (req, res, next) => {
            try {
                const result = await this.systems.guild.joinGuild(req.params.guildId, req.body.agentId);
                res.json(result);
            } catch (err) {
                next(err);
            }
        });
        
        v2.post('/guild/:guildId/vote', async (req, res, next) => {
            try {
                const result = await this.systems.guild.voteOnBlessing(
                    req.params.guildId,
                    req.body.agentId,
                    req.body.candidateId,
                    req.body.vote
                );
                res.json(result);
            } catch (err) {
                next(err);
            }
        });
        
        // Runtime operations
        v2.post('/runtime/offline', async (req, res, next) => {
            try {
                await this.systems.runtime.switchToOfflineMode();
                res.json({ status: 'offline', message: 'Switched to offline mode' });
            } catch (err) {
                next(err);
            }
        });
        
        v2.post('/runtime/online', async (req, res, next) => {
            try {
                await this.systems.runtime.switchToOnlineMode();
                res.json({ status: 'online', message: 'Switched to online mode' });
            } catch (err) {
                next(err);
            }
        });
        
        v2.get('/runtime/cache', (req, res) => {
            const cacheStatus = this.systems.runtime.getCacheStatus();
            res.json(cacheStatus);
        });
        
        v2.delete('/runtime/cache', (req, res) => {
            this.systems.runtime.clearCache();
            res.json({ message: 'Cache cleared successfully' });
        });
        
        // Batch operations
        v2.post('/batch/execute', async (req, res, next) => {
            try {
                const operations = req.body.operations || [];
                const results = [];
                
                for (const op of operations) {
                    try {
                        let result;
                        switch (op.type) {
                            case 'execute_loop':
                                result = await this.systems.runtime.executeLoop(op.data.loop, op.data.options);
                                break;
                            case 'rate_entity':
                                result = await this.systems.rating.rateEntity(op.data.entity, op.data.type);
                                break;
                            case 'spawn_persona':
                                result = await this.systems.whisper.spawnPersonaFromWhisper(op.data.whisper);
                                break;
                            default:
                                result = { error: 'Unknown operation type' };
                        }
                        results.push({ id: op.id, success: true, result });
                    } catch (err) {
                        results.push({ id: op.id, success: false, error: err.message });
                    }
                }
                
                res.json({ results, processed: results.length });
            } catch (err) {
                next(err);
            }
        });
        
        // WebSocket upgrade endpoint
        v2.get('/ws', (req, res) => {
            res.json({
                message: 'WebSocket endpoint',
                url: `ws://localhost:${this.port}/v2/ws`,
                events: [
                    'loop_executed',
                    'entity_rated',
                    'persona_spawned',
                    'forecast_generated',
                    'blessing_granted',
                    'volatility_index_updated'
                ]
            });
        });
        
        // API documentation
        v2.get('/docs', (req, res) => {
            res.json({
                version: this.config.version,
                endpoints: this.getEndpointDocumentation(),
                authentication: 'API key required for production',
                rate_limit: this.config.rate_limit,
                websocket: `ws://localhost:${this.port}/v2/ws`
            });
        });
        
        // Mount v2 routes
        this.app.use('/v2', v2);
        
        // Legacy compatibility - redirect to v2
        this.app.get('/api/*', (req, res) => {
            const newPath = req.path.replace('/api', '/v2');
            res.redirect(301, newPath);
        });
        
        // Root redirect
        this.app.get('/', (req, res) => {
            res.redirect('/v2/health');
        });
    }
    
    getEndpointDocumentation() {
        return {
            loops: {
                'POST /loops/execute': 'Execute a loop with optional offline mode',
                'GET /loops/:loopId': 'Get loop details',
                'POST /loops/:loopId/fork': 'Fork a loop for sharing',
                'POST /loops/:loopId/bless': 'Bless a loop'
            },
            drift: {
                'GET /drift/rating/:entityId': 'Get entity volatility rating',
                'GET /drift/volatility': 'Get platform volatility index',
                'GET /drift/critical': 'List critical volatility entities'
            },
            whisper: {
                'POST /whisper/spawn': 'Spawn persona from whisper',
                'GET /whisper/personas': 'List spawned personas'
            },
            forecast: {
                'POST /forecast/predict': 'Generate future predictions',
                'GET /forecast/:loopId': 'Get loop forecast'
            },
            guild: {
                'POST /guild/create': 'Create new guild',
                'POST /guild/:guildId/join': 'Join guild',
                'POST /guild/:guildId/vote': 'Vote on blessing'
            },
            runtime: {
                'POST /runtime/offline': 'Switch to offline mode',
                'POST /runtime/online': 'Switch to online mode',
                'GET /runtime/cache': 'Get cache status',
                'DELETE /runtime/cache': 'Clear cache'
            },
            batch: {
                'POST /batch/execute': 'Execute multiple operations'
            }
        };
    }
    
    calculateAverageResponseTime() {
        if (this.metrics.response_times.length === 0) return 0;
        const sum = this.metrics.response_times.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.metrics.response_times.length);
    }
    
    setupWebSocket() {
        // WebSocket server for real-time events
        const WebSocket = require('ws');
        const wss = new WebSocket.Server({ 
            server: this.server,
            path: '/v2/ws'
        });
        
        wss.on('connection', (ws) => {
            console.log('WebSocket client connected');
            
            // Subscribe to system events
            const listeners = {
                loop_executed: (event) => {
                    ws.send(JSON.stringify({ type: 'loop_executed', data: event }));
                },
                entity_rated: (rating) => {
                    ws.send(JSON.stringify({ type: 'entity_rated', data: rating }));
                },
                persona_spawned: (persona) => {
                    ws.send(JSON.stringify({ type: 'persona_spawned', data: persona }));
                },
                volatility_index_updated: (index) => {
                    ws.send(JSON.stringify({ type: 'volatility_index_updated', data: index }));
                }
            };
            
            // Attach listeners
            this.systems.runtime.on('loop_executed', listeners.loop_executed);
            this.systems.rating.on('entity_rated', listeners.entity_rated);
            this.systems.whisper.on('persona_spawned', listeners.persona_spawned);
            this.systems.rating.on('volatility_index_updated', listeners.volatility_index_updated);
            
            ws.on('close', () => {
                // Clean up listeners
                Object.entries(listeners).forEach(([event, listener]) => {
                    const system = event.includes('rating') || event.includes('volatility') ? 'rating' :
                                  event.includes('loop') || event.includes('runtime') ? 'runtime' :
                                  event.includes('persona') ? 'whisper' : null;
                    
                    if (system && this.systems[system]) {
                        this.systems[system].removeListener(event, listener);
                    }
                });
                
                console.log('WebSocket client disconnected');
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Connected to Soulfra API WebSocket',
                timestamp: new Date().toISOString()
            }));
        });
    }
    
    async start() {
        console.log('🚀 Starting Soulfra API Router...');
        
        this.server = this.app.listen(this.port, () => {
            console.log(`📡 API Router listening on http://localhost:${this.port}`);
            console.log(`📚 API Documentation: http://localhost:${this.port}/v2/docs`);
            console.log(`🔌 WebSocket endpoint: ws://localhost:${this.port}/v2/ws`);
            console.log('\n✅ All systems initialized and ready');
        });
        
        // Setup WebSocket after server starts
        this.setupWebSocket();
        
        // Emit ready event
        this.emit('ready', {
            port: this.port,
            version: this.config.version,
            systems: Object.keys(this.systems)
        });
    }
    
    async stop() {
        console.log('🛑 Stopping Soulfra API Router...');
        
        // Stop all subsystems
        for (const [name, system] of Object.entries(this.systems)) {
            if (system.stop) {
                console.log(`  Stopping ${name}...`);
                await system.stop();
            }
        }
        
        // Close server
        if (this.server) {
            this.server.close();
        }
        
        console.log('  API Router stopped');
    }
}

module.exports = SoulfraAPIRouter;

// Start if run directly
if (require.main === module) {
    const router = new SoulfraAPIRouter();
    
    router.on('ready', (info) => {
        console.log('\n--- API Router Ready ---');
        console.log(`Port: ${info.port}`);
        console.log(`Version: ${info.version}`);
        console.log(`Systems: ${info.systems.join(', ')}`);
    });
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\nReceived SIGINT, shutting down gracefully...');
        await router.stop();
        process.exit(0);
    });
    
    router.start().catch(console.error);
}