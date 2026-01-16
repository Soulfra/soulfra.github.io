#!/usr/bin/env node

// Soulfra Local Development Server - localhost:3000
// Complete platform with all features integrated

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

// Import all our systems
const SemanticFileVault = require('./vault/SemanticFileVault');
const NestedAIWorldSystem = require('./worlds/NestedAIWorldSystem');
const EnterpriseConsciousnessMetrics = require('./enterprise/EnterpriseConsciousnessMetrics');
const MultiTenantArchitecture = require('./enterprise/MultiTenantArchitecture');

// Initialize systems
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// System instances
const vault = new SemanticFileVault();
const aiWorld = new NestedAIWorldSystem();
const metrics = new EnterpriseConsciousnessMetrics();
const multiTenant = new MultiTenantArchitecture();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload configuration
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'vault/index.html'));
});

// Platform tier routes
app.get('/enterprise', (req, res) => {
    res.sendFile(path.join(__dirname, 'enterprise/EnterpriseDashboard.html'));
});

app.get('/developer', (req, res) => {
    res.sendFile(path.join(__dirname, 'developer/DeveloperDashboard.html'));
});

app.get('/family', (req, res) => {
    res.sendFile(path.join(__dirname, 'family/FamilyDashboard.html'));
});

app.get('/kids', (req, res) => {
    res.sendFile(path.join(__dirname, 'kids/KidsInterface.html'));
});

app.get('/seniors', (req, res) => {
    res.sendFile(path.join(__dirname, 'seniors/SeniorDashboard.html'));
});

// Vault API
app.post('/api/vault/upload', upload.array('files'), async (req, res) => {
    try {
        const files = req.files;
        const result = await vault.processDroppedFiles(files);
        res.json(result);
    } catch (error) {
        console.error('Vault upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/vault/graph', (req, res) => {
    const graph = vault.getGraphVisualization();
    res.json(graph);
});

app.get('/api/vault/search', async (req, res) => {
    const { query } = req.query;
    const results = await vault.searchIdeas(query);
    res.json(results);
});

// AI World API
app.post('/api/world/deploy-agent', async (req, res) => {
    try {
        const { userId, agentConfig } = req.body;
        const result = await aiWorld.deployUserAgent(userId, agentConfig);
        res.json(result);
    } catch (error) {
        console.error('Agent deployment error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/world/influence', async (req, res) => {
    try {
        const { userId, action } = req.body;
        const result = await aiWorld.influenceAgent(userId, action);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/world/bet', async (req, res) => {
    try {
        const { userId, targetAgentId, betDetails } = req.body;
        const result = await aiWorld.betOnAgent(userId, targetAgentId, betDetails);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/world/state/:userId', (req, res) => {
    const state = aiWorld.getWorldState(req.params.userId);
    res.json(state);
});

// Enterprise API
app.get('/api/enterprise/metrics', (req, res) => {
    const dashboardMetrics = metrics.getDashboardMetrics();
    res.json(dashboardMetrics);
});

app.get('/api/enterprise/tenants', (req, res) => {
    const report = multiTenant.generatePlatformReport();
    res.json(report);
});

app.post('/api/enterprise/tenant', async (req, res) => {
    try {
        const tenant = multiTenant.createTenant(req.body);
        res.json(tenant);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        status: 'operational',
        version: '1.0.0',
        systems: {
            vault: 'active',
            aiWorld: 'active',
            enterprise: 'active',
            multiTenant: 'active'
        },
        stats: {
            vaultFiles: vault.vault.size,
            vaultIdeas: vault.ideas.size,
            aiWorlds: aiWorld.userWorlds.size,
            tenants: multiTenant.tenants.size
        }
    });
});

// WebSocket connections
wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    // Send initial state
    ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to Soulfra real-time system'
    }));
    
    // Handle vault events
    vault.on('cal-thought', (data) => {
        ws.send(JSON.stringify({
            type: 'cal-thought',
            ...data
        }));
    });
    
    vault.on('file-processed', (data) => {
        ws.send(JSON.stringify({
            type: 'file-processed',
            ...data
        }));
    });
    
    // Handle AI world events
    aiWorld.on('agent-deployed', (data) => {
        ws.send(JSON.stringify({
            type: 'agent-deployed',
            ...data
        }));
    });
    
    aiWorld.on('agent-action', (data) => {
        ws.send(JSON.stringify({
            type: 'agent-action',
            ...data
        }));
    });
    
    aiWorld.on('bet-won', (data) => {
        ws.send(JSON.stringify({
            type: 'bet-won',
            ...data
        }));
    });
    
    aiWorld.on('master-update', (data) => {
        ws.send(JSON.stringify({
            type: 'master-update',
            ...data
        }));
    });
    
    // Handle metrics events
    metrics.on('metrics-updated', (data) => {
        ws.send(JSON.stringify({
            type: 'metrics-updated',
            summary: data.summary
        }));
    });
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('WebSocket message:', data);
            
            // Handle real-time commands
            switch (data.type) {
                case 'subscribe':
                    // Subscribe to specific event types
                    break;
                case 'command':
                    // Execute commands
                    break;
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// Start server
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                                                                       ║
║                    🌌 SOULFRA PLATFORM RUNNING                        ║
║                                                                       ║
║                     http://localhost:${PORT}                              ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝

Available endpoints:
  
📁 Semantic Vault (Main):     http://localhost:${PORT}/
🏢 Enterprise Dashboard:      http://localhost:${PORT}/enterprise
💻 Developer Platform:        http://localhost:${PORT}/developer
👨‍👩‍👧‍👦 Family Hub:               http://localhost:${PORT}/family
👶 Kids World:                http://localhost:${PORT}/kids
👴 Senior Companion:          http://localhost:${PORT}/seniors

API Endpoints:
  /api/vault/upload          - Upload files for semantic analysis
  /api/world/deploy-agent    - Deploy $1 AI agent
  /api/enterprise/metrics    - Get enterprise metrics
  /api/status               - System status

WebSocket:
  ws://localhost:${PORT}      - Real-time updates

Press Ctrl+C to stop the server.
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Soulfra platform...');
    
    // Cleanup
    metrics.cleanup();
    
    server.close(() => {
        console.log('✅ Server shut down gracefully');
        process.exit(0);
    });
});

module.exports = { app, server };