const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Import Cal modules
const { validateQR } = require('../../../qr-validator');
const { orchestrateAgents } = require('../runtime/agent-orchestrator');
const memoryLoader = require('../runtime/cal-memory-loader');

const app = express();
const PORT = process.env.PORT || 8765;

// Session storage (in production, use Redis)
const sessions = new Map();

// Middleware
app.use(cors());
app.use(express.json());

// Session verification middleware
const verifySession = (req, res, next) => {
    const token = req.headers['x-cal-token'];
    const deviceId = req.headers['x-device-id'];
    
    if (!token || !deviceId) {
        return res.status(401).json({ error: 'Missing authentication' });
    }
    
    const session = sessions.get(token);
    if (!session || session.deviceId !== deviceId) {
        return res.status(401).json({ error: 'Invalid session' });
    }
    
    req.session = session;
    next();
};

// QR Verification endpoint
app.post('/api/verify-qr', async (req, res) => {
    const { qrCode, deviceName, deviceType } = req.body;
    
    try {
        // Validate QR code
        const validation = validateQR(qrCode);
        if (!validation.valid) {
            return res.status(400).json({ error: 'Invalid QR code' });
        }
        
        // Generate session token
        const token = crypto.randomBytes(32).toString('hex');
        const deviceId = `${deviceType}-${deviceName}-${Date.now()}`;
        
        // Store session
        sessions.set(token, {
            qrCode,
            deviceId,
            deviceName,
            deviceType,
            created: new Date(),
            validation
        });
        
        // Log device binding
        const bindingLog = {
            timestamp: new Date().toISOString(),
            qrCode,
            deviceId,
            deviceType
        };
        
        const logPath = path.join(__dirname, '../vault/device-bindings.json');
        let bindings = [];
        try {
            bindings = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        } catch (e) {
            // File doesn't exist yet
        }
        bindings.push(bindingLog);
        fs.writeFileSync(logPath, JSON.stringify(bindings, null, 2));
        
        res.json({
            success: true,
            token,
            deviceId,
            operator: validation.operator
        });
    } catch (error) {
        console.error('QR verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Vault status endpoint
app.get('/api/vault/status', verifySession, (req, res) => {
    try {
        const vaultPath = path.join(__dirname, '../vault');
        const memoryPath = path.join(vaultPath, 'memory');
        const reflectionPath = path.join(vaultPath, 'user-reflection-log.json');
        
        // Count memory files
        let memoryCount = 0;
        if (fs.existsSync(memoryPath)) {
            memoryCount = fs.readdirSync(memoryPath).length;
        }
        
        // Count reflections
        let reflectionCount = 0;
        let lastActivity = null;
        if (fs.existsSync(reflectionPath)) {
            const reflections = JSON.parse(fs.readFileSync(reflectionPath, 'utf8'));
            reflectionCount = reflections.length;
            if (reflections.length > 0) {
                lastActivity = reflections[reflections.length - 1].timestamp;
            }
        }
        
        res.json({
            ready: true,
            memoryCount,
            reflectionCount,
            lastActivity,
            boundDevice: req.session.deviceId
        });
    } catch (error) {
        console.error('Vault status error:', error);
        res.status(500).json({ error: 'Failed to read vault status' });
    }
});

// Reflection endpoint
app.post('/api/reflect', verifySession, async (req, res) => {
    const { prompt } = req.body;
    
    if (!prompt) {
        return res.status(400).json({ error: 'Missing prompt' });
    }
    
    try {
        // Load memory context
        const memories = await memoryLoader.loadMemories();
        const enhancedPrompt = memoryLoader.enhancePrompt(prompt, memories);
        
        // Orchestrate reflection
        const result = await orchestrateAgents(enhancedPrompt, req.session.validation.qrCode);
        
        // Log reflection
        const reflectionLog = path.join(__dirname, '../vault/user-reflection-log.json');
        let reflections = [];
        try {
            reflections = JSON.parse(fs.readFileSync(reflectionLog, 'utf8'));
        } catch (e) {
            // File doesn't exist yet
        }
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            deviceId: req.session.deviceId,
            prompt,
            response: result.reflection,
            model: result.winner,
            confidence: result.confidence
        };
        
        reflections.push(logEntry);
        fs.writeFileSync(reflectionLog, JSON.stringify(reflections, null, 2));
        
        res.json({
            response: result.reflection,
            model: result.winner,
            confidence: result.confidence,
            timestamp: logEntry.timestamp
        });
    } catch (error) {
        console.error('Reflection error:', error);
        res.status(500).json({ error: 'Reflection failed' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', sessions: sessions.size });
});

// Start server
app.listen(PORT, () => {
    console.log(`🌐 Cal API Server running on port ${PORT}`);
    console.log(`📍 Frontend should connect to: http://localhost:${PORT}/api`);
    
    // Ensure vault directories exist
    const dirs = [
        path.join(__dirname, '../vault'),
        path.join(__dirname, '../vault/memory'),
        path.join(__dirname, '../vault/conversations')
    ];
    
    dirs.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
});