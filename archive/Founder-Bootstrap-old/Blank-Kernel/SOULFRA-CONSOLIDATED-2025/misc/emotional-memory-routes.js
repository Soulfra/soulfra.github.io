// Emotional Memory Routes for MirrorOS Integration
const express = require('express');
const router = express.Router();

// Proxy to semantic API
const SEMANTIC_API = 'http://localhost:3666';

// Health check route
router.get('/emotional/health', async (req, res) => {
    try {
        const response = await fetch(`${SEMANTIC_API}/api/system/health`);
        const data = await response.json();
        res.json({
            status: 'connected',
            emotional_memory: data.data || {},
            integration: 'active'
        });
    } catch (error) {
        res.status(503).json({
            status: 'disconnected',
            error: error.message,
            integration: 'failed'
        });
    }
});

// Agent emotional states
router.get('/emotional/agents', async (req, res) => {
    try {
        const response = await fetch(`${SEMANTIC_API}/api/agents/list`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Agent data unavailable' });
    }
});

// System integrity witness
router.get('/emotional/integrity', async (req, res) => {
    try {
        const response = await fetch(`${SEMANTIC_API}/api/system/integrity`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Integrity data unavailable' });
    }
});

// Graph data proxy
router.get('/emotional/graph/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const { limit = 50 } = req.query;
        
        const response = await fetch(`${SEMANTIC_API}/api/graph/${type}?limit=${limit}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(503).json({ error: 'Graph data unavailable' });
    }
});

module.exports = router;