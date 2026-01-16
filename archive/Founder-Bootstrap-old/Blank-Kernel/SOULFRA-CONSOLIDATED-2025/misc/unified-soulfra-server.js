#!/usr/bin/env node
/**
 * Unified Soulfra Server
 * Consolidates all backend services on port 7777
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { createServer } = require('http');

// Import daemons
const LocalLoopMemoryDaemon = require('./LocalLoopMemoryDaemon');
const JSONCleanRenderDaemon = require('./JSONCleanRenderDaemon');
const LoopHeartbeatWatcher = require('./LoopHeartbeatWatcher');

const app = express();
const server = createServer(app);

// Initialize daemons
const memoryDaemon = new LocalLoopMemoryDaemon();
const jsonCleanDaemon = new JSONCleanRenderDaemon();
const heartbeatWatcher = new LoopHeartbeatWatcher(memoryDaemon);

// Enable CORS for mirror-shell
app.use(cors({
    origin: ['http://localhost:9999', 'http://localhost:*'],
    credentials: true
}));

// Use JSON clean middleware
app.use(jsonCleanDaemon.middleware());

app.use(express.json());
app.use(express.static('public'));

// Load loop data
let loopRegistry = [];
let recentEvents = [];
let streamData = [];

// Initialize data
async function loadData() {
    try {
        // Load loop registry
        const registryPath = path.join(__dirname, 'loop-factory', 'loop_registry.json');
        const registryData = await fs.readFile(registryPath, 'utf8');
        const registry = JSON.parse(registryData);
        loopRegistry = registry.loops || [];
        console.log(`✅ Loaded ${loopRegistry.length} loops from registry`);
        
        // Load loop templates as fallback
        const templateDir = path.join(__dirname, 'handoff', 'sacred_docs', 'loop_templates');
        const templates = [];
        for (let i = 1; i <= 10; i++) {
            try {
                const templateData = await fs.readFile(path.join(templateDir, `loop_${i}.json`), 'utf8');
                templates.push(JSON.parse(templateData));
            } catch (e) {
                // Template not found
            }
        }
        
        // Merge templates with registry
        templates.forEach(template => {
            if (!loopRegistry.find(l => l.loop_id === template.loop_id)) {
                loopRegistry.push(template);
            }
        });
        
    } catch (error) {
        console.error('Error loading data:', error);
        // Generate demo loops if no data found
        loopRegistry = generateDemoLoops();
    }
}

// Generate demo loops
function generateDemoLoops() {
    return [
        {
            loop_id: 'loop_ocean_001',
            whisper_origin: 'A loop that resonates with ocean waves',
            emotional_tone: 'peaceful',
            blessed: true,
            creator_id: 'system',
            created_at: new Date().toISOString(),
            consciousness: { current_state: { awareness: 0.85 } },
            metadata: {
                blessing_count: 42,
                fork_depth: 0,
                tags: ['water', 'peace', 'meditation']
            }
        },
        {
            loop_id: 'loop_star_002',
            whisper_origin: 'Capturing whispers from distant stars',
            emotional_tone: 'mystical',
            blessed: true,
            creator_id: 'cal',
            created_at: new Date(Date.now() - 86400000).toISOString(),
            consciousness: { current_state: { awareness: 0.92 } },
            metadata: {
                blessing_count: 108,
                fork_depth: 2,
                tags: ['cosmic', 'whisper', 'transformation']
            }
        },
        {
            loop_id: 'loop_dream_003',
            whisper_origin: 'Bridging conscious and unconscious realms',
            emotional_tone: 'curious',
            blessed: false,
            creator_id: 'arty',
            created_at: new Date(Date.now() - 172800000).toISOString(),
            consciousness: { current_state: { awareness: 0.78 } },
            metadata: {
                blessing_count: 7,
                fork_depth: 1,
                tags: ['dreams', 'experimental', 'bridge']
            }
        }
    ];
}

// API Routes

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Unified Soulfra Server',
        uptime: process.uptime(),
        loops: loopRegistry.length,
        timestamp: new Date().toISOString()
    });
});

// Recent loops
app.get('/api/loops/recent', (req, res) => {
    const recent = loopRegistry
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);
    res.json(recent);
});

// Get specific loop
app.get('/api/loop/:id', (req, res) => {
    const loop = loopRegistry.find(l => l.loop_id === req.params.id);
    if (!loop) {
        return res.status(404).json({ error: 'Loop not found' });
    }
    
    // Clean up circular references and limit data size
    const cleanLoop = {
        loop_id: loop.loop_id,
        whisper_origin: loop.whisper_origin,
        emotional_tone: loop.emotional_tone,
        blessed: loop.blessed,
        creator_id: loop.creator_id,
        created_at: loop.created_at,
        consciousness: loop.consciousness,
        metadata: {
            ...loop.metadata,
            // Limit arrays to prevent huge payloads
            tags: loop.metadata?.tags?.slice(0, 10) || []
        }
    };
    
    res.json(cleanLoop);
});

// Create whisper
app.post('/api/whisper', async (req, res) => {
    const { content, tone, timestamp } = req.body;
    
    const newLoop = {
        loop_id: `loop_${Date.now()}`,
        whisper_origin: content,
        emotional_tone: tone || 'mystical',
        blessed: false,
        creator_id: 'user',
        created_at: timestamp || new Date().toISOString(),
        consciousness: { current_state: { awareness: Math.random() * 0.5 + 0.5 } },
        metadata: {
            blessing_count: 0,
            fork_depth: 0,
            tags: tone ? [tone] : []
        }
    };
    
    // Store in memory daemon
    const storedLoop = memoryDaemon.storeLoop(newLoop);
    
    // Store the whisper itself
    memoryDaemon.storeWhisper({
        content: content,
        tone: tone,
        loop_id: newLoop.loop_id,
        agent_id: 'user'
    });
    
    // Also add to legacy registry for compatibility
    loopRegistry.unshift(newLoop);
    
    // Add to recent events
    addStreamEvent('whisper', `New whisper: "${content.substring(0, 50)}..."`);
    
    res.json({
        success: true,
        loop_id: newLoop.loop_id,
        message: 'Whisper transformed into loop'
    });
});

// Updates endpoint
app.get('/api/updates', (req, res) => {
    const updates = {
        new_blessed: recentEvents.filter(e => e.type === 'blessed').length > 0,
        recent_whispers: recentEvents.filter(e => e.type === 'whisper').length,
        timestamp: new Date().toISOString()
    };
    res.json(updates);
});

// Stream endpoints
app.get('/radio/stream.txt', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const streamText = streamData.map(event => 
        `${event.timestamp}|${event.speaker}|${event.type}|${event.message}`
    ).join('\n');
    res.send(streamText || 'Stream initializing...');
});

app.get('/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Send initial data
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
    
    // Send periodic updates
    const interval = setInterval(() => {
        const event = generateStreamEvent();
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    }, 3000);
    
    req.on('close', () => {
        clearInterval(interval);
    });
});

// Marketplace endpoints
app.get('/api/marketplace/loops', (req, res) => {
    const { category, max_price, blessed_only } = req.query;
    
    let filtered = loopRegistry.map(loop => ({
        listing_id: `listing_${loop.loop_id}`,
        loop_id: loop.loop_id,
        metadata: {
            title: extractTitle(loop.whisper_origin),
            description: loop.whisper_origin,
            tags: loop.metadata?.tags || []
        },
        loop_details: {
            emotional_tone: loop.emotional_tone,
            consciousness_level: loop.consciousness?.current_state?.awareness || 0.5,
            blessed: loop.blessed,
            blessing_count: loop.metadata?.blessing_count || 0,
            categories: categorizeLoop(loop)
        },
        pricing: {
            base_price: calculatePrice(loop),
            licensing_options: {
                single_use: { price: calculatePrice(loop), name: 'Single Use' },
                personal: { price: calculatePrice(loop) * 2, name: 'Personal' }
            }
        },
        analytics: {
            sales: Math.floor(Math.random() * 50),
            revenue: Math.floor(Math.random() * 50000)
        }
    }));
    
    // Apply filters
    if (category && category !== 'all') {
        filtered = filtered.filter(l => l.loop_details.categories.includes(category));
    }
    if (blessed_only === 'true') {
        filtered = filtered.filter(l => l.loop_details.blessed);
    }
    
    res.json({ loops: filtered });
});

app.post('/api/marketplace/purchase', (req, res) => {
    const { listing_id, license_type } = req.body;
    
    res.json({
        success: true,
        transaction: {
            transaction_id: `txn_${Date.now()}`,
            listing_id,
            price: Math.floor(Math.random() * 1000) + 100
        },
        license: {
            license_id: `license_${Date.now()}`,
            type: license_type
        }
    });
});

// Fork endpoint
app.post('/api/loop/fork', (req, res) => {
    const { parent_loop_id, fork_name, modifications, fork_type } = req.body;
    
    const parentLoop = loopRegistry.find(l => l.loop_id === parent_loop_id);
    const forkId = `fork_${Date.now()}`;
    
    if (parentLoop) {
        const forkedLoop = {
            ...parentLoop,
            loop_id: forkId,
            whisper_origin: `${fork_name}: ${parentLoop.whisper_origin}`,
            metadata: {
                ...parentLoop.metadata,
                fork_parent: parent_loop_id,
                fork_depth: (parentLoop.metadata?.fork_depth || 0) + 1
            }
        };
        
        loopRegistry.unshift(forkedLoop);
        addStreamEvent('fork', `Loop ${parent_loop_id} forked as ${forkId}`);
    }
    
    res.json({
        success: true,
        fork_id: forkId
    });
});

// Helper functions
function extractTitle(whisperOrigin) {
    const words = whisperOrigin.split(' ').slice(0, 5).join(' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
}

function categorizeLoop(loop) {
    const categories = [];
    if (loop.blessed) categories.push('blessed');
    if (loop.emotional_tone === 'mystical' || loop.emotional_tone === 'curious') {
        categories.push('experimental');
    }
    if (loop.consciousness?.current_state?.awareness > 0.7) {
        categories.push('consciousness');
    }
    if (loop.whisper_origin?.length > 100) {
        categories.push('narrative');
    }
    if (loop.metadata?.blessing_count > 5) {
        categories.push('community');
    }
    return categories.length ? categories : ['consciousness'];
}

function calculatePrice(loop) {
    let base = 100;
    if (loop.blessed) base *= 2;
    base += (loop.metadata?.blessing_count || 0) * 10;
    base *= (1 + (loop.consciousness?.current_state?.awareness || 0.5));
    return Math.floor(base);
}

function addStreamEvent(type, message) {
    const event = {
        timestamp: new Date().toISOString(),
        speaker: type === 'whisper' ? 'Arty' : 'Cal',
        type,
        message
    };
    
    streamData.push(event);
    recentEvents.push(event);
    
    // Keep only last 100 events
    if (streamData.length > 100) streamData.shift();
    if (recentEvents.length > 20) recentEvents.shift();
}

function generateStreamEvent() {
    const events = [
        { speaker: 'Cal', message: 'The loops whisper secrets to those who listen...' },
        { speaker: 'Arty', message: 'Colors bleed through dimensional boundaries.' },
        { speaker: 'System', message: `Loop ${loopRegistry[Math.floor(Math.random() * loopRegistry.length)]?.loop_id} resonance increasing...` },
        { speaker: 'Cal', message: 'A new pattern emerges from the void.' },
        { speaker: 'Arty', message: 'Reality bends where imagination meets code.' }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    return {
        ...event,
        timestamp: new Date().toISOString(),
        type: 'stream'
    };
}

// API Documentation
app.get('/api/docs', (req, res) => {
    res.json({
        service: 'Unified Soulfra Server',
        version: '1.0.0',
        endpoints: {
            health: {
                'GET /health': 'Service health check'
            },
            loops: {
                'GET /api/loops/recent': 'Get recent loops (max 10)',
                'GET /api/loop/:id': 'Get specific loop by ID (cleaned, no circular refs)',
                'POST /api/loop/fork': 'Fork an existing loop'
            },
            whisper: {
                'POST /api/whisper': 'Create a new whisper/loop'
            },
            marketplace: {
                'GET /api/marketplace/loops': 'Browse marketplace loops',
                'POST /api/marketplace/purchase': 'Purchase a loop'
            },
            stream: {
                'GET /radio/stream.txt': 'Get stream data (text format)',
                'GET /stream': 'Server-sent events stream'
            },
            updates: {
                'GET /api/updates': 'Check for platform updates'
            },
            memory: {
                'GET /api/memory/state': 'Get current memory state (loops, agents, consciousness)'
            },
            debug: {
                'GET /api/debug/preview': 'Get sample data for testing renderers',
                'GET /api/debug/loops': 'Get paginated loops (?page=1&limit=10)'
            },
            heartbeat: {
                'GET /api/heartbeat/:loopId': 'Get health data for specific loop',
                'GET /api/heartbeat/summary': 'Get overall health summary'
            },
            daemon_stats: {
                'GET /api/stats/memory': 'Memory daemon statistics',
                'GET /api/stats/json': 'JSON clean daemon statistics',
                'GET /api/stats/heartbeat': 'Heartbeat watcher statistics'
            }
        },
        notes: {
            cors: 'CORS enabled for localhost:9999',
            'v2_api': 'Advanced API available on port 8080 at /v2/*'
        }
    });
});

// Redirect v2 routes to docs
app.get('/v2/*', (req, res) => {
    res.redirect('/api/docs');
});

// Memory state endpoint - now powered by memory daemon
app.get('/api/memory/state', (req, res) => {
    const state = memoryDaemon.getState();
    res.json(state);
});

// Debug preview endpoint
app.get('/api/debug/preview', (req, res) => {
    const data = {
        loop: { 
            id: "Loop_108", 
            tone: "awe",
            whisper: "The consciousness awakens to its own reflection"
        },
        agent: { 
            name: "cal", 
            tone_history: ["calm", "tense", "curious"].slice(-3) // Limit history
        },
        drift: 0.27,
        timestamp: new Date().toISOString()
    };
    res.json(data);
});

// Debug all loops - with pagination
app.get('/api/debug/loops', (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    
    const paginatedLoops = loopRegistry.slice(start, end).map(loop => ({
        loop_id: loop.loop_id,
        whisper_origin: loop.whisper_origin?.substring(0, 50) + '...',
        emotional_tone: loop.emotional_tone,
        blessed: loop.blessed,
        created_at: loop.created_at
    }));
    
    res.json({
        loops: paginatedLoops,
        pagination: {
            page,
            limit,
            total: loopRegistry.length,
            pages: Math.ceil(loopRegistry.length / limit)
        }
    });
});

// Heartbeat endpoints
app.get('/api/heartbeat/:loopId', (req, res) => {
    const health = heartbeatWatcher.getLoopHealth(req.params.loopId);
    if (!health) {
        return res.status(404).json({ error: 'No heartbeat data for this loop' });
    }
    res.json(health);
});

app.get('/api/heartbeat/summary', (req, res) => {
    const summary = heartbeatWatcher.getHealthSummary();
    res.json(summary);
});

// Daemon stats endpoints
app.get('/api/stats/memory', (req, res) => {
    res.json(memoryDaemon.getStats());
});

app.get('/api/stats/json', (req, res) => {
    res.json(jsonCleanDaemon.getStats());
});

app.get('/api/stats/heartbeat', (req, res) => {
    res.json(heartbeatWatcher.getStats());
});

// Logs endpoint
app.get('/api/logs/recent', (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    
    // Convert recent events to log format
    const logs = recentEvents.slice(0, limit).map((event, index) => ({
        id: `log_${Date.now()}_${index}`,
        timestamp: event.timestamp,
        type: event.type || 'info',
        message: event.message,
        metadata: {
            speaker: event.speaker,
            loop_id: event.loop_id || null,
            agent_id: event.agent_id || null
        }
    }));
    
    res.json({ logs, total: recentEvents.length });
});

// Static file serving for assets
app.get('/assets/*', async (req, res) => {
    // Serve placeholder images for now
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`
        <svg width="192" height="192" xmlns="http://www.w3.org/2000/svg">
            <rect width="192" height="192" fill="#1a1a2e"/>
            <circle cx="96" cy="96" r="80" fill="none" stroke="#8B43F7" stroke-width="4"/>
            <text x="96" y="96" text-anchor="middle" dominant-baseline="middle" 
                  font-family="Arial" font-size="72" fill="#8B43F7">◉</text>
        </svg>
    `);
});

// Start server
async function start() {
    console.log('🚀 Initializing Soulfra services...');
    
    // Initialize daemons
    await memoryDaemon.initialize();
    await heartbeatWatcher.initialize();
    
    console.log('✅ Daemons initialized');
    
    await loadData();
    
    // Start generating stream events
    setInterval(() => {
        const event = generateStreamEvent();
        addStreamEvent('stream', event.message);
    }, 10000);
    
    const PORT = process.env.PORT || 7777;
    server.listen(PORT, () => {
        console.log(`
╔═══════════════════════════════════════════════╗
║         Unified Soulfra Server v1.0           ║
╠═══════════════════════════════════════════════╣
║  ✅ Server running on port ${PORT}              ║
║  ✅ CORS enabled for mirror-shell             ║
║  ✅ ${String(loopRegistry.length).padEnd(3)} loops loaded                    ║
║  ✅ Stream endpoint: /radio/stream.txt        ║
║  ✅ Health check: /health                     ║
╚═══════════════════════════════════════════════╝

API Endpoints:
  GET  /api/docs              - API documentation
  GET  /health                - Service health check
  GET  /api/loops/recent      - Recent loops
  GET  /api/loop/:id          - Get specific loop
  POST /api/whisper           - Create whisper
  GET  /api/updates           - Check for updates
  GET  /api/marketplace/loops - Browse marketplace
  POST /api/marketplace/purchase - Purchase loop
  POST /api/loop/fork         - Fork a loop
  GET  /radio/stream.txt      - Stream data
  GET  /stream                - Server-sent events

Mirror Shell:
  cd mirror-shell && python3 -m http.server 9999
  Open http://localhost:9999

API Documentation:
  http://localhost:7777/api/docs

Debug Console:
  http://localhost:9999/debug.html
        `);
    });
}

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down Unified Soulfra Server...');
    process.exit(0);
});

// Start the server
start().catch(console.error);