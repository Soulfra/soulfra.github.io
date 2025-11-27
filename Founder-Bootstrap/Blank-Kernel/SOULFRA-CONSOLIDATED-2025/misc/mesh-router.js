const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.MESH_PORT || 8888;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// Load mesh configuration
let meshConfig;
async function loadConfig() {
    try {
        const configPath = path.join(__dirname, 'mesh-config.json');
        const configData = await fs.readFile(configPath, 'utf8');
        meshConfig = JSON.parse(configData);
        console.log('✅ Mesh configuration loaded');
    } catch (error) {
        console.error('❌ Failed to load mesh config:', error);
        process.exit(1);
    }
}

// Session storage (in-memory for now)
const sessions = new Map();

// Load default LLM keys if available
async function loadDefaultKeys() {
    try {
        const keysPath = path.join(__dirname, '../vault/env/llm-keys.json');
        const keysData = await fs.readFile(keysPath, 'utf8');
        return JSON.parse(keysData);
    } catch (error) {
        console.log('⚠️ No default keys found, using empty defaults');
        return {};
    }
}

// Load default agent signature
async function loadDefaultAgentSignature() {
    try {
        const agentSigPath = path.join(__dirname, '../tier-minus4/cal-reasoning-kernel/core-agent.sig');
        const signature = await fs.readFile(agentSigPath, 'utf8');
        return signature.trim();
    } catch (error) {
        // Generate default signature
        return `agent-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    }
}

// QR validation
function validateQR(qrCode) {
    return meshConfig.security.valid_qr_codes.includes(qrCode);
}

// UUID logging
async function logUUID(uuid, config) {
    try {
        const logPath = path.join(__dirname, '../vault/usage/uuid-log.json');
        let log = [];
        
        try {
            const existing = await fs.readFile(logPath, 'utf8');
            log = JSON.parse(existing);
        } catch (e) {
            // File doesn't exist yet
        }

        log.push({
            uuid,
            qrCode: config.qrCode,
            timestamp: Date.now(),
            keyProvided: {
                claude: config.claudeKey !== 'default',
                openai: !!config.openaiKey,
                ollama: !!config.ollamaUrl
            },
            ip: config.ip || 'localhost'
        });

        await fs.mkdir(path.dirname(logPath), { recursive: true });
        await fs.writeFile(logPath, JSON.stringify(log, null, 2));
    } catch (error) {
        console.error('Failed to log UUID:', error);
    }
}

// Initialize mesh connection
app.post('/api/mesh/initialize', async (req, res) => {
    try {
        const { uuid, claudeKey, openaiKey, ollamaUrl, agentKey, qrCode, trustFlags } = req.body;

        // Validate QR code
        if (!validateQR(qrCode)) {
            return res.status(401).json({
                success: false,
                error: 'Invalid QR code'
            });
        }

        // Load default keys if not provided
        const defaultKeys = await loadDefaultKeys();
        const defaultAgentSig = await loadDefaultAgentSignature();
        
        const finalKeys = {
            claude: claudeKey === 'default' || !claudeKey ? defaultKeys.claude : claudeKey,
            openai: openaiKey || defaultKeys.openai,
            ollama: ollamaUrl || meshConfig.default_keys.ollama.url
        };

        const finalAgentKey = agentKey || defaultAgentSig;

        // Generate session ID
        const sessionId = crypto.randomBytes(32).toString('hex');

        // Store session
        sessions.set(sessionId, {
            uuid,
            qrCode,
            keys: finalKeys,
            agentKey: finalAgentKey,
            trustFlags: {
                ...trustFlags,
                verified: true,
                qrValidated: true
            },
            created: Date.now(),
            lastAccess: Date.now()
        });

        // Log UUID
        await logUUID(uuid, {
            ...req.body,
            ip: req.ip
        });

        // Initialize tier-3 router connection
        const routerPath = path.join(__dirname, '../tier-minus3/llm-router/local-agent-fork.js');
        try {
            const router = require(routerPath);
            await router.initialize(sessionId, finalKeys, qrCode);
        } catch (error) {
            console.warn('⚠️ Tier-3 router not ready:', error.message);
        }

        res.json({
            success: true,
            sessionId,
            message: 'Mesh connection established',
            features: meshConfig.features
        });
    } catch (error) {
        console.error('Initialization error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Mesh reflection endpoint
app.post('/api/mesh/reflect', async (req, res) => {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired session'
        });
    }

    const session = sessions.get(sessionId);
    session.lastAccess = Date.now();

    try {
        const { prompt, options = {} } = req.body;

        // Route through tier-3 LLM router
        const routerPath = path.join(__dirname, '../tier-minus3/llm-router/local-agent-fork.js');
        const router = require(routerPath);
        
        const result = await router.reflect({
            prompt,
            sessionId,
            keys: session.keys,
            qrCode: session.qrCode,
            options: {
                ...options,
                useShield: meshConfig.features.npc_wrapper,
                useCringe: meshConfig.features.cringe_layer,
                useTone: meshConfig.features.tone_diffusion,
                useMemory: meshConfig.features.memory_vault
            }
        });

        // Log reflection
        await logReflection(session.uuid, prompt, result);

        res.json({
            success: true,
            reflection: result.response,
            metadata: result.metadata
        });
    } catch (error) {
        console.error('Reflection error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Log reflection
async function logReflection(uuid, prompt, result) {
    try {
        const logPath = path.join(__dirname, '../vault/user-reflection-log.json');
        let log = [];
        
        try {
            const existing = await fs.readFile(logPath, 'utf8');
            log = JSON.parse(existing);
        } catch (e) {
            // File doesn't exist yet
        }

        log.push({
            uuid,
            timestamp: Date.now(),
            prompt: prompt.substring(0, 100) + '...',
            responseLength: result.response.length,
            llm: result.metadata.llm,
            success: true
        });

        // Keep only last 1000 entries
        if (log.length > 1000) {
            log = log.slice(-1000);
        }

        await fs.writeFile(logPath, JSON.stringify(log, null, 2));
    } catch (error) {
        console.error('Failed to log reflection:', error);
    }
}

// Session cleanup
setInterval(() => {
    const now = Date.now();
    for (const [sessionId, session] of sessions.entries()) {
        if (now - session.lastAccess > meshConfig.security.session_timeout) {
            sessions.delete(sessionId);
            console.log(`🧹 Cleaned up expired session: ${sessionId}`);
        }
    }
}, 60000); // Clean up every minute

// Start server
async function start() {
    await loadConfig();
    
    app.listen(PORT, () => {
        console.log('🔮 MirrorOS Mesh Router initialized');
        console.log(`📡 Listening on http://localhost:${PORT}`);
        console.log(`🌐 Access interface at http://localhost:${PORT}/index.html`);
    });
}

// Platform handler for integration
let platformHandler = null;
function setPlatformHandler(handler) {
    platformHandler = handler;
}

// Export for tier-3 integration
module.exports = {
    sessions,
    validateQR,
    loadDefaultKeys,
    setPlatformHandler
};

// Start if run directly
if (require.main === module) {
    start().catch(console.error);
}