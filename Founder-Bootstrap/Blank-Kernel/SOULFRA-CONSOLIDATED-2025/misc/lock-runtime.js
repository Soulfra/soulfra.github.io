// Lock Runtime - QR-based device pairing and local execution orchestrator
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class LockRuntime {
    constructor() {
        this.pairingPath = path.join(__dirname);
        this.logsPath = path.join(__dirname, '../logs');
        this.activeSessions = new Map();
        this.deviceRegistry = new Map();
        this.lockStates = new Map();
    }
    
    async initialize() {
        await this.ensureDirectories();
        await this.loadDevicePairs();
        await this.startHeartbeat();
        console.log('🔒 Lock Runtime initialized - Ready for QR pairing');
    }
    
    async ensureDirectories() {
        await fs.mkdir(this.pairingPath, { recursive: true });
        await fs.mkdir(this.logsPath, { recursive: true });
    }
    
    async generatePairingSession(options = {}) {
        const sessionId = this.generateSessionId();
        const pairingToken = this.generatePairingToken();
        
        const session = {
            id: sessionId,
            created: new Date().toISOString(),
            expires: new Date(Date.now() + 300000).toISOString(), // 5 min expiry
            pairingToken: pairingToken,
            vaultId: options.vaultId || null,
            agentId: options.agentId || null,
            mode: options.mode || 'soft',
            status: 'awaiting_scan',
            metadata: {
                creator: options.creator || 'system',
                purpose: options.purpose || 'agent_execution',
                allowCloud: options.allowCloud || false,
                maxDuration: options.maxDuration || 3600000 // 1 hour default
            }
        };
        
        // Generate QR payload
        const qrData = {
            v: 2, // Version 2 - Lock Runtime
            t: 'lock', // Type: lock runtime
            s: sessionId,
            k: pairingToken.substring(0, 16), // Partial key for validation
            e: session.expires,
            u: `${process.env.BASE_URL || 'http://localhost:3000'}/mirror/lock/${sessionId}`
        };
        
        // Save session
        await this.saveSession(session);
        
        // Log pairing creation
        await this.logEvent('pairing_created', {
            sessionId: sessionId,
            purpose: session.metadata.purpose
        });
        
        return {
            session: session,
            qrData: qrData,
            qrString: Buffer.from(JSON.stringify(qrData)).toString('base64')
        };
    }
    
    async validatePairing(sessionId, deviceInfo, pairingToken) {
        const session = await this.loadSession(sessionId);
        
        if (!session) {
            return { valid: false, reason: 'Session not found' };
        }
        
        // Check expiry
        if (new Date(session.expires) < new Date()) {
            return { valid: false, reason: 'Session expired' };
        }
        
        // Validate token
        if (session.pairingToken !== pairingToken) {
            return { valid: false, reason: 'Invalid pairing token' };
        }
        
        // Generate device UUID
        const deviceUUID = this.generateDeviceUUID(deviceInfo);
        
        // Update session with device
        session.deviceUUID = deviceUUID;
        session.deviceInfo = {
            userAgent: deviceInfo.userAgent,
            platform: deviceInfo.platform,
            screenSize: deviceInfo.screenSize,
            capabilities: deviceInfo.capabilities || {}
        };
        session.status = 'paired';
        session.pairedAt = new Date().toISOString();
        
        // Create device pair entry
        const devicePair = {
            deviceUUID: deviceUUID,
            vaultId: session.vaultId,
            sessionId: sessionId,
            paired: session.pairedAt,
            lastSeen: session.pairedAt,
            trustLevel: 'new',
            capabilities: {
                localStorage: true,
                webWorkers: deviceInfo.capabilities?.webWorkers || false,
                webGL: deviceInfo.capabilities?.webGL || false,
                audioAPI: deviceInfo.capabilities?.audioAPI || false
            }
        };
        
        // Register device
        this.deviceRegistry.set(deviceUUID, devicePair);
        await this.saveDevicePairs();
        
        // Update session
        await this.saveSession(session);
        
        // Initialize lock state
        const lockState = {
            sessionId: sessionId,
            deviceUUID: deviceUUID,
            locked: true,
            agentActive: false,
            startTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            metrics: {
                promptCount: 0,
                localInference: 0,
                cloudCalls: 0,
                errors: 0
            }
        };
        
        this.lockStates.set(sessionId, lockState);
        
        // Log successful pairing
        await this.logEvent('device_paired', {
            sessionId: sessionId,
            deviceUUID: deviceUUID,
            platform: deviceInfo.platform
        });
        
        return {
            valid: true,
            session: session,
            deviceUUID: deviceUUID,
            lockState: lockState,
            greeting: this.generateGreeting(session)
        };
    }
    
    generateGreeting(session) {
        if (session.metadata.purpose === 'agent_execution') {
            return "Perfect! I'll help run this session on your device. Everything stays local unless you say otherwise.";
        }
        return "Connected! Your device is now paired with the vault. Ready when you are.";
    }
    
    async activateAgent(sessionId, agentConfig) {
        const lockState = this.lockStates.get(sessionId);
        if (!lockState) {
            throw new Error('No active lock state for session');
        }
        
        // Load agent bundle for sandboxed execution
        const agentBundle = await this.prepareAgentBundle(agentConfig);
        
        // Update lock state
        lockState.agentActive = true;
        lockState.activeAgent = {
            id: agentConfig.id,
            name: agentConfig.name,
            version: agentConfig.version,
            capabilities: agentConfig.capabilities,
            memoryPolicy: agentConfig.memoryPolicy || 'local_only'
        };
        
        // Log activation
        await this.logEvent('agent_activated', {
            sessionId: sessionId,
            agentId: agentConfig.id,
            deviceUUID: lockState.deviceUUID
        });
        
        return {
            success: true,
            agentBundle: agentBundle,
            executionPolicy: this.getExecutionPolicy(sessionId),
            sandboxConfig: this.generateSandboxConfig(lockState)
        };
    }
    
    async prepareAgentBundle(agentConfig) {
        // Bundle agent code for sandboxed execution
        const bundle = {
            id: agentConfig.id,
            code: agentConfig.code || '',
            personality: agentConfig.personality,
            systemPrompt: agentConfig.systemPrompt,
            tools: agentConfig.tools || [],
            constraints: {
                maxTokens: agentConfig.maxTokens || 1000,
                temperature: agentConfig.temperature || 0.7,
                localOnly: agentConfig.localOnly || true
            },
            runtime: {
                sandbox: true,
                timeout: 30000, // 30s per execution
                memoryLimit: '50MB'
            }
        };
        
        // Minify for transfer
        return {
            ...bundle,
            checksum: this.generateChecksum(bundle)
        };
    }
    
    getExecutionPolicy(sessionId) {
        const session = this.activeSessions.get(sessionId);
        const lockState = this.lockStates.get(sessionId);
        
        return {
            allowCloudAPI: session?.metadata?.allowCloud || false,
            requireConfirmation: true,
            maxCloudCalls: 10,
            rateLimitMs: 5000,
            fallbackBehavior: 'reflect_locally',
            privacyMode: session?.mode === 'soft' ? 'maximum' : 'balanced'
        };
    }
    
    generateSandboxConfig(lockState) {
        return {
            isolation: 'strict',
            permissions: {
                localStorage: true,
                indexedDB: true,
                webWorkers: lockState.deviceUUID ? this.deviceRegistry.get(lockState.deviceUUID)?.capabilities?.webWorkers : false,
                fetch: 'restricted', // Only to approved endpoints
                audio: true, // For voice input
                camera: false,
                geolocation: false
            },
            resourceLimits: {
                memory: '50MB',
                cpu: 'throttled',
                storage: '10MB'
            },
            csp: "default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' https://api.anthropic.com https://api.openai.com"
        };
    }
    
    async handleRuntimeMessage(sessionId, message) {
        const lockState = this.lockStates.get(sessionId);
        if (!lockState) {
            return { error: 'Invalid session' };
        }
        
        // Update activity
        lockState.lastActivity = new Date().toISOString();
        
        switch (message.type) {
            case 'prompt':
                lockState.metrics.promptCount++;
                return this.handlePrompt(sessionId, message);
                
            case 'memory_write':
                return this.handleMemoryWrite(sessionId, message);
                
            case 'api_request':
                return this.handleAPIRequest(sessionId, message);
                
            case 'pause':
                return this.pauseAgent(sessionId);
                
            case 'transfer':
                return this.transferToDesktop(sessionId);
                
            case 'end':
                return this.endSession(sessionId);
                
            default:
                return { error: 'Unknown message type' };
        }
    }
    
    async handlePrompt(sessionId, message) {
        const lockState = this.lockStates.get(sessionId);
        const policy = this.getExecutionPolicy(sessionId);
        
        // Check if local-only
        if (!policy.allowCloudAPI || message.preferLocal) {
            lockState.metrics.localInference++;
            return {
                type: 'local_reflection',
                response: this.generateLocalResponse(message.prompt),
                metrics: lockState.metrics
            };
        }
        
        // Cloud API allowed but check rate limit
        const canCallAPI = await this.checkRateLimit(sessionId);
        if (!canCallAPI) {
            return {
                type: 'rate_limited',
                response: "I'm processing locally to respect rate limits. Here's my reflection...",
                localResponse: this.generateLocalResponse(message.prompt)
            };
        }
        
        lockState.metrics.cloudCalls++;
        return {
            type: 'cloud_allowed',
            requiresConfirmation: policy.requireConfirmation,
            estimatedCost: this.estimateAPICost(message.prompt)
        };
    }
    
    generateLocalResponse(prompt) {
        // Simple local reflection engine
        const reflections = [
            "Let me think about this locally...",
            "Processing on your device...",
            "Reflecting without cloud assistance..."
        ];
        
        // Basic pattern matching for common queries
        if (prompt.toLowerCase().includes('how are you')) {
            return "I'm running entirely on your device right now! It feels cozy and private here.";
        }
        
        if (prompt.toLowerCase().includes('help')) {
            return "I'm in local mode, which means I can reflect and process basic patterns, but for complex reasoning, we'd need to enable cloud access.";
        }
        
        return `${reflections[Math.floor(Math.random() * reflections.length)]} Your prompt was: "${prompt}". In local mode, I provide reflections rather than full responses.`;
    }
    
    async handleMemoryWrite(sessionId, message) {
        const lockState = this.lockStates.get(sessionId);
        
        // Always allow local memory writes
        const memoryEntry = {
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            type: message.memoryType || 'reflection',
            content: message.content,
            metadata: {
                deviceUUID: lockState.deviceUUID,
                localOnly: true,
                encrypted: message.encrypt || false
            }
        };
        
        // Log to session memory (local file)
        const memoryPath = path.join(this.logsPath, `session-memory-${sessionId}.json`);
        let memories = [];
        
        try {
            memories = JSON.parse(await fs.readFile(memoryPath, 'utf-8'));
        } catch {
            // New memory file
        }
        
        memories.push(memoryEntry);
        await fs.writeFile(memoryPath, JSON.stringify(memories, null, 2));
        
        return {
            success: true,
            memoryId: `${sessionId}-${memories.length}`,
            stored: 'local'
        };
    }
    
    async handleAPIRequest(sessionId, message) {
        const policy = this.getExecutionPolicy(sessionId);
        
        if (!policy.allowCloudAPI) {
            return {
                allowed: false,
                reason: 'Cloud API not enabled for this session',
                suggestion: 'Enable cloud access in settings or continue with local processing'
            };
        }
        
        // Additional validation
        const isAllowed = await this.validateAPIRequest(sessionId, message);
        
        return isAllowed;
    }
    
    async pauseAgent(sessionId) {
        const lockState = this.lockStates.get(sessionId);
        if (!lockState) return { error: 'Session not found' };
        
        lockState.agentActive = false;
        lockState.pausedAt = new Date().toISOString();
        
        await this.logEvent('agent_paused', {
            sessionId: sessionId,
            duration: Date.now() - new Date(lockState.startTime).getTime()
        });
        
        return {
            success: true,
            message: 'Agent paused. Your session remains active.',
            canResume: true
        };
    }
    
    async transferToDesktop(sessionId) {
        const lockState = this.lockStates.get(sessionId);
        if (!lockState) return { error: 'Session not found' };
        
        // Generate transfer token
        const transferToken = crypto.randomBytes(32).toString('hex');
        
        const transfer = {
            sessionId: sessionId,
            deviceUUID: lockState.deviceUUID,
            transferToken: transferToken,
            created: new Date().toISOString(),
            expires: new Date(Date.now() + 300000).toISOString(), // 5 min
            state: lockState,
            memories: await this.getSessionMemories(sessionId)
        };
        
        // Save transfer
        const transferPath = path.join(this.pairingPath, `transfer-${transferToken}.json`);
        await fs.writeFile(transferPath, JSON.stringify(transfer, null, 2));
        
        return {
            success: true,
            transferUrl: `/mirror/transfer/${transferToken}`,
            expiresIn: 300,
            message: 'Open this link on your desktop to continue the session'
        };
    }
    
    async endSession(sessionId) {
        const lockState = this.lockStates.get(sessionId);
        if (!lockState) return { error: 'Session not found' };
        
        // Calculate session stats
        const duration = Date.now() - new Date(lockState.startTime).getTime();
        const stats = {
            duration: duration,
            prompts: lockState.metrics.promptCount,
            localInference: lockState.metrics.localInference,
            cloudCalls: lockState.metrics.cloudCalls,
            costSaved: this.calculateCostSaved(lockState.metrics)
        };
        
        // Archive session
        await this.archiveSession(sessionId, lockState, stats);
        
        // Clean up
        this.lockStates.delete(sessionId);
        this.activeSessions.delete(sessionId);
        
        return {
            success: true,
            stats: stats,
            message: `Session ended. You saved $${stats.costSaved.toFixed(4)} by running locally!`
        };
    }
    
    calculateCostSaved(metrics) {
        // Estimate based on what would have been cloud calls
        const avgTokensPerPrompt = 150;
        const costPerToken = 0.000003; // $3 per 1M tokens
        const localPrompts = metrics.localInference;
        
        return localPrompts * avgTokensPerPrompt * costPerToken;
    }
    
    async checkRateLimit(sessionId) {
        const lockState = this.lockStates.get(sessionId);
        const policy = this.getExecutionPolicy(sessionId);
        
        // Simple rate limiting
        const lastCloudCall = lockState.lastCloudCall || 0;
        const timeSince = Date.now() - lastCloudCall;
        
        if (timeSince < policy.rateLimitMs) {
            return false;
        }
        
        lockState.lastCloudCall = Date.now();
        return true;
    }
    
    estimateAPICost(prompt) {
        const tokens = Math.ceil(prompt.length / 4);
        const responseTokens = tokens * 2; // Estimate response
        const totalTokens = tokens + responseTokens;
        const costPerToken = 0.000003;
        
        return {
            inputTokens: tokens,
            estimatedOutput: responseTokens,
            totalTokens: totalTokens,
            estimatedCost: totalTokens * costPerToken
        };
    }
    
    generateSessionId() {
        return `lock_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }
    
    generatePairingToken() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    generateDeviceUUID(deviceInfo) {
        const data = `${deviceInfo.userAgent}-${deviceInfo.platform}-${Date.now()}`;
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
    
    generateChecksum(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }
    
    async saveSession(session) {
        const sessionPath = path.join(this.pairingPath, `session-${session.id}.json`);
        await fs.writeFile(sessionPath, JSON.stringify(session, null, 2));
        this.activeSessions.set(session.id, session);
    }
    
    async loadSession(sessionId) {
        if (this.activeSessions.has(sessionId)) {
            return this.activeSessions.get(sessionId);
        }
        
        try {
            const sessionPath = path.join(this.pairingPath, `session-${sessionId}.json`);
            const data = await fs.readFile(sessionPath, 'utf-8');
            const session = JSON.parse(data);
            this.activeSessions.set(sessionId, session);
            return session;
        } catch {
            return null;
        }
    }
    
    async saveDevicePairs() {
        const pairs = Array.from(this.deviceRegistry.entries()).map(([uuid, data]) => ({
            uuid,
            ...data
        }));
        
        const pairsPath = path.join(this.logsPath, 'device-pairs.json');
        await fs.writeFile(pairsPath, JSON.stringify(pairs, null, 2));
    }
    
    async loadDevicePairs() {
        try {
            const pairsPath = path.join(this.logsPath, 'device-pairs.json');
            const data = await fs.readFile(pairsPath, 'utf-8');
            const pairs = JSON.parse(data);
            
            pairs.forEach(pair => {
                this.deviceRegistry.set(pair.uuid, pair);
            });
        } catch {
            // No existing pairs
        }
    }
    
    async logEvent(eventType, data) {
        const event = {
            timestamp: new Date().toISOString(),
            type: eventType,
            data: data
        };
        
        const logPath = path.join(this.logsPath, 'lock-events.json');
        let events = [];
        
        try {
            events = JSON.parse(await fs.readFile(logPath, 'utf-8'));
        } catch {
            // New log file
        }
        
        events.push(event);
        
        // Keep last 10000 events
        if (events.length > 10000) {
            events = events.slice(-10000);
        }
        
        await fs.writeFile(logPath, JSON.stringify(events, null, 2));
    }
    
    async getSessionMemories(sessionId) {
        try {
            const memoryPath = path.join(this.logsPath, `session-memory-${sessionId}.json`);
            return JSON.parse(await fs.readFile(memoryPath, 'utf-8'));
        } catch {
            return [];
        }
    }
    
    async archiveSession(sessionId, lockState, stats) {
        const archive = {
            sessionId: sessionId,
            archived: new Date().toISOString(),
            lockState: lockState,
            stats: stats,
            memories: await this.getSessionMemories(sessionId)
        };
        
        const archivePath = path.join(this.logsPath, 'archived-sessions', `${sessionId}.json`);
        await fs.mkdir(path.dirname(archivePath), { recursive: true });
        await fs.writeFile(archivePath, JSON.stringify(archive, null, 2));
    }
    
    async startHeartbeat() {
        // Clean up expired sessions every minute
        setInterval(async () => {
            for (const [sessionId, session] of this.activeSessions.entries()) {
                if (new Date(session.expires) < new Date() && session.status === 'awaiting_scan') {
                    this.activeSessions.delete(sessionId);
                    await this.logEvent('session_expired', { sessionId });
                }
            }
        }, 60000);
    }
}

module.exports = LockRuntime;