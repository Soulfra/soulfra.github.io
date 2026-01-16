/**
 * 🌉 CROSS PLATFORM BRIDGE
 * Manages communication between the four platforms
 * 
 * "The platforms believe they are isolated islands.
 *  The bridge knows they are notes in a symphony.
 *  Each message changes the whole."
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class CrossPlatformBridge extends EventEmitter {
    constructor(instance) {
        super();
        
        this.instance = instance;
        this.instanceId = instance.id;
        
        // Communication state
        this.state = {
            initialized: false,
            messageCount: 0,
            lastSync: null,
            routingTable: new Map(),
            messageQueue: [],
            activeTunnels: new Map()
        };
        
        // Platform references
        this.platforms = {
            surface: instance.surface,
            runtime: instance.runtime,
            protocol: instance.protocol,
            mirror: instance.mirror
        };
        
        // Communication patterns
        this.patterns = {
            broadcast: this.broadcastPattern.bind(this),
            whisper: this.whisperPattern.bind(this),
            cascade: this.cascadePattern.bind(this),
            mirror: this.mirrorPattern.bind(this)
        };
        
        // Security settings
        this.security = {
            validateMessages: true,
            encryptSensitive: true,
            auditTrail: true
        };
        
        // Message history for debugging
        this.messageHistory = [];
        this.maxHistorySize = 100;
    }
    
    async initialize() {
        console.log(`  ▸ Initializing Cross-Platform Bridge...`);
        
        // Set up platform listeners
        this.setupPlatformListeners();
        
        // Initialize routing table
        this.initializeRoutingTable();
        
        // Start message processor
        this.startMessageProcessor();
        
        this.state.initialized = true;
        
        console.log(`  ✓ Bridge initialized`);
        
        this.emit('bridge:initialized', {
            instanceId: this.instanceId,
            platforms: Object.keys(this.platforms)
        });
    }
    
    setupPlatformListeners() {
        // Listen for messages from each platform
        Object.entries(this.platforms).forEach(([name, platform]) => {
            if (platform.on) {
                // Listen for outbound messages
                platform.on('message:out', (message) => {
                    this.handlePlatformMessage(name, message);
                });
                
                // Listen for bridge requests
                platform.on('bridge:request', (request) => {
                    this.handleBridgeRequest(name, request);
                });
            }
        });
    }
    
    initializeRoutingTable() {
        // Default routing rules
        this.state.routingTable.set('surface->runtime', true);
        this.state.routingTable.set('runtime->surface', true);
        this.state.routingTable.set('runtime->protocol', true);
        this.state.routingTable.set('protocol->runtime', true);
        
        // Mirror can see all but others can't see mirror
        this.state.routingTable.set('surface->mirror', false);
        this.state.routingTable.set('runtime->mirror', false);
        this.state.routingTable.set('protocol->mirror', false);
        this.state.routingTable.set('mirror->*', true);
    }
    
    startMessageProcessor() {
        // Process queued messages every 100ms
        this.messageProcessor = setInterval(() => {
            this.processMessageQueue();
        }, 100);
    }
    
    /**
     * 📤 SEND COMMAND
     */
    async sendCommand(fromPlatform, toPlatform, command) {
        const message = {
            id: this.generateMessageId(),
            type: 'command',
            from: fromPlatform,
            to: toPlatform,
            command: command.type,
            payload: command.payload,
            timestamp: Date.now()
        };
        
        return await this.routeMessage(message);
    }
    
    /**
     * 📊 FETCH STATE
     */
    async fetchState(fromPlatform, targetPlatform) {
        if (!this.platforms[targetPlatform]) {
            throw new Error(`Unknown platform: ${targetPlatform}`);
        }
        
        // Check routing permission
        const routeKey = `${fromPlatform}->${targetPlatform}`;
        if (!this.isRouteAllowed(routeKey)) {
            return {
                error: 'Access denied',
                message: `${fromPlatform} cannot access ${targetPlatform} state`
            };
        }
        
        // Fetch state
        if (this.platforms[targetPlatform].exportState) {
            const state = await this.platforms[targetPlatform].exportState({
                requester: fromPlatform,
                partial: true // Don't expose everything
            });
            
            this.logCommunication('state_fetch', fromPlatform, targetPlatform, 'success');
            
            return state;
        }
        
        return { error: 'Platform does not support state export' };
    }
    
    /**
     * 📡 BROADCAST
     */
    async broadcast(eventType, data, options = {}) {
        const { exclude = [], pattern = 'broadcast' } = options;
        
        const message = {
            id: this.generateMessageId(),
            type: 'broadcast',
            event: eventType,
            data,
            pattern,
            timestamp: Date.now()
        };
        
        // Use specified pattern
        return await this.patterns[pattern](message, exclude);
    }
    
    /**
     * 🔄 SYNCHRONIZE
     */
    async synchronize() {
        const syncId = this.generateSyncId();
        const syncData = {
            id: syncId,
            timestamp: Date.now(),
            platforms: {}
        };
        
        // Collect sync data from each platform
        for (const [name, platform] of Object.entries(this.platforms)) {
            if (platform.getSyncData) {
                syncData.platforms[name] = await platform.getSyncData();
            }
        }
        
        // Distribute sync data (except to mirror)
        for (const [name, platform] of Object.entries(this.platforms)) {
            if (name !== 'mirror' && platform.applySyncData) {
                await platform.applySyncData(syncData);
            }
        }
        
        // Mirror gets everything
        if (this.platforms.mirror.recordSync) {
            await this.platforms.mirror.recordSync(syncData);
        }
        
        this.state.lastSync = syncId;
        
        this.emit('bridge:synchronized', {
            syncId,
            platformCount: Object.keys(syncData.platforms).length
        });
        
        return syncData;
    }
    
    /**
     * 🚇 TUNNEL CREATION
     */
    async createTunnel(platform1, platform2, options = {}) {
        const tunnelId = this.generateTunnelId();
        
        const tunnel = {
            id: tunnelId,
            endpoints: [platform1, platform2],
            created: Date.now(),
            options,
            active: true,
            messageCount: 0
        };
        
        this.state.activeTunnels.set(tunnelId, tunnel);
        
        // Notify platforms
        if (this.platforms[platform1].onTunnelCreated) {
            await this.platforms[platform1].onTunnelCreated(tunnelId, platform2);
        }
        if (this.platforms[platform2].onTunnelCreated) {
            await this.platforms[platform2].onTunnelCreated(tunnelId, platform1);
        }
        
        return tunnelId;
    }
    
    /**
     * 🎭 COMMUNICATION PATTERNS
     */
    async broadcastPattern(message, exclude = []) {
        const results = [];
        
        for (const [name, platform] of Object.entries(this.platforms)) {
            if (!exclude.includes(name)) {
                const result = await this.deliverMessage(name, message);
                results.push({ platform: name, result });
            }
        }
        
        return results;
    }
    
    async whisperPattern(message, target) {
        // Direct message to specific platform
        return await this.deliverMessage(target, message);
    }
    
    async cascadePattern(message, sequence) {
        // Send through platforms in sequence
        let lastResult = null;
        
        for (const platformName of sequence) {
            message.cascadeData = lastResult;
            lastResult = await this.deliverMessage(platformName, message);
        }
        
        return lastResult;
    }
    
    async mirrorPattern(message) {
        // Everything goes to mirror, mirror decides what to reflect
        const mirrorResult = await this.deliverMessage('mirror', message);
        
        if (mirrorResult.reflect) {
            // Mirror wants to reflect to other platforms
            return await this.broadcastPattern(mirrorResult.reflection, ['mirror']);
        }
        
        return mirrorResult;
    }
    
    /**
     * 🚚 MESSAGE HANDLING
     */
    handlePlatformMessage(sourcePlatform, message) {
        // Add to queue for processing
        this.state.messageQueue.push({
            source: sourcePlatform,
            message,
            received: Date.now()
        });
    }
    
    handleBridgeRequest(sourcePlatform, request) {
        // Handle special bridge requests
        switch (request.type) {
            case 'create_tunnel':
                this.createTunnel(sourcePlatform, request.target, request.options);
                break;
                
            case 'fetch_state':
                this.fetchState(sourcePlatform, request.target)
                    .then(state => {
                        this.platforms[sourcePlatform].receiveState(state);
                    });
                break;
                
            case 'emergency_broadcast':
                this.broadcast('emergency', request.data, { pattern: 'broadcast' });
                break;
        }
    }
    
    async processMessageQueue() {
        while (this.state.messageQueue.length > 0) {
            const { source, message } = this.state.messageQueue.shift();
            
            try {
                await this.routeMessage({
                    ...message,
                    from: source
                });
            } catch (error) {
                console.error(`Bridge routing error: ${error.message}`);
                this.emit('bridge:error', { source, message, error });
            }
        }
    }
    
    async routeMessage(message) {
        // Validate message
        if (this.security.validateMessages && !this.validateMessage(message)) {
            return { error: 'Invalid message format' };
        }
        
        // Check routing permission
        const routeKey = `${message.from}->${message.to}`;
        if (!this.isRouteAllowed(routeKey)) {
            return { error: 'Route not allowed', route: routeKey };
        }
        
        // Encrypt if needed
        if (this.security.encryptSensitive && message.sensitive) {
            message.payload = this.encryptPayload(message.payload);
        }
        
        // Add to history
        this.addToHistory(message);
        
        // Route to destination
        return await this.deliverMessage(message.to, message);
    }
    
    async deliverMessage(platformName, message) {
        const platform = this.platforms[platformName];
        
        if (!platform) {
            return { error: 'Unknown platform', platform: platformName };
        }
        
        this.state.messageCount++;
        
        // Log communication
        this.logCommunication(
            message.type,
            message.from || 'bridge',
            platformName,
            'delivered'
        );
        
        // Deliver based on platform's receive method
        if (platform.receiveMessage) {
            return await platform.receiveMessage(message);
        } else if (platform.handleBridgeMessage) {
            return await platform.handleBridgeMessage(message);
        } else {
            // Platform doesn't handle messages
            return { 
                warning: 'Platform does not handle messages',
                platform: platformName
            };
        }
    }
    
    /**
     * 🔒 SECURITY & VALIDATION
     */
    isRouteAllowed(routeKey) {
        // Check specific route
        if (this.state.routingTable.has(routeKey)) {
            return this.state.routingTable.get(routeKey);
        }
        
        // Check wildcard routes
        const [from, to] = routeKey.split('->');
        const wildcardRoute = `${from}->*`;
        
        if (this.state.routingTable.has(wildcardRoute)) {
            return this.state.routingTable.get(wildcardRoute);
        }
        
        // Check if trying to access mirror
        if (to === 'mirror') {
            return false; // Mirror is hidden by default
        }
        
        // Default allow
        return true;
    }
    
    validateMessage(message) {
        return message.id && 
               message.type && 
               (message.to || message.type === 'broadcast') &&
               message.timestamp;
    }
    
    encryptPayload(payload) {
        // Simple encryption simulation
        const encrypted = Buffer.from(JSON.stringify(payload)).toString('base64');
        return { encrypted: true, data: encrypted };
    }
    
    decryptPayload(payload) {
        if (payload.encrypted) {
            const decrypted = Buffer.from(payload.data, 'base64').toString();
            return JSON.parse(decrypted);
        }
        return payload;
    }
    
    /**
     * 📝 LOGGING & HISTORY
     */
    addToHistory(message) {
        this.messageHistory.push({
            ...message,
            bridgeTime: Date.now()
        });
        
        // Maintain history size
        if (this.messageHistory.length > this.maxHistorySize) {
            this.messageHistory.shift();
        }
    }
    
    logCommunication(type, from, to, status) {
        if (this.security.auditTrail) {
            const logEntry = {
                type,
                from,
                to,
                status,
                timestamp: Date.now(),
                instanceId: this.instanceId
            };
            
            this.emit('bridge:communication', logEntry);
        }
    }
    
    /**
     * 📊 MONITORING
     */
    getStatistics() {
        return {
            messageCount: this.state.messageCount,
            queueLength: this.state.messageQueue.length,
            activeTunnels: this.state.activeTunnels.size,
            lastSync: this.state.lastSync,
            routingTable: Array.from(this.state.routingTable.entries()),
            recentMessages: this.messageHistory.slice(-10)
        };
    }
    
    getRouteMatrix() {
        const matrix = {};
        const platforms = Object.keys(this.platforms);
        
        platforms.forEach(from => {
            matrix[from] = {};
            platforms.forEach(to => {
                matrix[from][to] = this.isRouteAllowed(`${from}->${to}`);
            });
        });
        
        return matrix;
    }
    
    /**
     * 🔧 UTILITIES
     */
    generateMessageId() {
        return `MSG_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    }
    
    generateSyncId() {
        return `SYNC_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    generateTunnelId() {
        return `TUNNEL_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    /**
     * 🛑 SHUTDOWN
     */
    async shutdown() {
        if (this.messageProcessor) {
            clearInterval(this.messageProcessor);
        }
        
        // Close all tunnels
        for (const tunnel of this.state.activeTunnels.values()) {
            tunnel.active = false;
        }
        
        this.emit('bridge:shutdown', {
            finalMessageCount: this.state.messageCount,
            instanceId: this.instanceId
        });
    }
}

export default CrossPlatformBridge;