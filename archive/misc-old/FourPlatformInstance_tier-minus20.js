/**
 * 🎭 FOUR PLATFORM INSTANCE
 * The core wrapper that manages a complete four-platform system
 * 
 * "Four platforms dance in perfect synchronization,
 *  Each believing itself independent,
 *  None aware of the choreographer."
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';

// Import platform implementations
import SurfacePlatform from './platforms/SurfacePlatform.js';
import RuntimePlatform from './platforms/RuntimePlatform.js';
import ProtocolPlatform from './platforms/ProtocolPlatform.js';
import MirrorPlatform from './platforms/MirrorPlatform.js';
import CrossPlatformBridge from './CrossPlatformBridge.js';

class FourPlatformInstance extends EventEmitter {
    constructor(instanceId, name, config = {}) {
        super();
        
        this.id = instanceId || this.generateInstanceId();
        this.name = name || `Instance_${this.id}`;
        this.creationTime = Date.now();
        this.config = {
            autoStart: config.autoStart !== false,
            synchronizationInterval: config.synchronizationInterval || 5000,
            snapshotInterval: config.snapshotInterval || 60000,
            isolationLevel: config.isolationLevel || 'STANDARD',
            calGovernance: config.calGovernance !== false,
            ...config
        };
        
        // Instance state
        this.state = {
            initialized: false,
            running: false,
            autonomous: false,
            frozen: false,
            lastSnapshot: null,
            iterationCount: 0,
            health: {
                surface: 'unknown',
                runtime: 'unknown',
                protocol: 'unknown',
                mirror: 'unknown'
            }
        };
        
        // Initialize platforms
        this.initializePlatforms(config);
        
        // Cross-platform communication bridge
        this.bridge = new CrossPlatformBridge(this);
        
        // Snapshot history
        this.snapshots = [];
        
        // Event handlers
        this.setupEventHandlers();
        
        if (this.config.autoStart) {
            this.initialize();
        }
    }
    
    initializePlatforms(config) {
        // Create platform instances with instance-specific configs
        this.surface = new SurfacePlatform({
            instanceId: this.id,
            name: `${this.name}_Surface`,
            ...config.surface
        });
        
        this.runtime = new RuntimePlatform({
            instanceId: this.id,
            name: `${this.name}_Runtime`,
            calGovernance: this.config.calGovernance,
            ...config.runtime
        });
        
        this.protocol = new ProtocolPlatform({
            instanceId: this.id,
            name: `${this.name}_Protocol`,
            ...config.protocol
        });
        
        this.mirror = new MirrorPlatform({
            instanceId: this.id,
            name: `${this.name}_Mirror`,
            hiddenFromOthers: true,
            ...config.mirror
        });
        
        // Platform map for easy access
        this.platforms = {
            surface: this.surface,
            runtime: this.runtime,
            protocol: this.protocol,
            mirror: this.mirror
        };
    }
    
    setupEventHandlers() {
        // Forward platform events
        Object.entries(this.platforms).forEach(([name, platform]) => {
            platform.on('state:changed', (state) => {
                this.emit('platform:state:changed', { platform: name, state });
            });
            
            platform.on('error', (error) => {
                this.emit('platform:error', { platform: name, error });
            });
            
            platform.on('anomaly', (anomaly) => {
                this.emit('platform:anomaly', { platform: name, anomaly });
            });
        });
        
        // Bridge events
        this.bridge.on('communication', (event) => {
            this.emit('bridge:communication', event);
        });
    }
    
    /**
     * 🚀 INITIALIZATION
     */
    async initialize() {
        if (this.state.initialized) {
            return { message: 'Already initialized' };
        }
        
        console.log(`\n🎭 Initializing Four Platform Instance: ${this.name}`);
        console.log(`Instance ID: ${this.id}`);
        
        try {
            // Initialize platforms in parallel
            const initPromises = Object.entries(this.platforms).map(async ([name, platform]) => {
                console.log(`  ▸ Initializing ${name} platform...`);
                await platform.initialize();
                this.state.health[name] = 'initialized';
                console.log(`  ✓ ${name} platform ready`);
            });
            
            await Promise.all(initPromises);
            
            // Initialize bridge after platforms
            await this.bridge.initialize();
            
            // Set instance as initialized
            this.state.initialized = true;
            
            // Take initial snapshot
            await this.takeSnapshot('initialization');
            
            // Start synchronization if configured
            if (this.config.synchronizationInterval > 0) {
                this.startSynchronization();
            }
            
            this.emit('instance:initialized', {
                id: this.id,
                name: this.name,
                platforms: Object.keys(this.platforms)
            });
            
            console.log(`\n✅ Four Platform Instance initialized successfully\n`);
            
            return {
                success: true,
                instanceId: this.id,
                platforms: await this.getPlatformStatus()
            };
            
        } catch (error) {
            console.error(`❌ Failed to initialize instance: ${error.message}`);
            this.emit('instance:error', { phase: 'initialization', error });
            throw error;
        }
    }
    
    /**
     * 🏃 AUTONOMOUS OPERATIONS
     */
    async startAutonomousOperations() {
        if (!this.state.initialized) {
            throw new Error('Instance must be initialized first');
        }
        
        if (this.state.autonomous) {
            return { message: 'Already running autonomously' };
        }
        
        console.log(`\n🤖 Starting autonomous operations for ${this.name}...`);
        
        // Start each platform's autonomous mode
        const startPromises = Object.entries(this.platforms).map(async ([name, platform]) => {
            if (platform.startAutonomous) {
                await platform.startAutonomous();
                console.log(`  ✓ ${name} platform autonomous`);
            }
        });
        
        await Promise.all(startPromises);
        
        // Enable autonomous state
        this.state.autonomous = true;
        this.state.running = true;
        
        // Start iteration loop
        this.startIterationLoop();
        
        // Start snapshot cycle
        if (this.config.snapshotInterval > 0) {
            this.startSnapshotCycle();
        }
        
        this.emit('instance:autonomous', {
            id: this.id,
            name: this.name,
            timestamp: Date.now()
        });
        
        return {
            success: true,
            message: 'Autonomous operations started',
            iterationInterval: this.config.synchronizationInterval
        };
    }
    
    /**
     * 🧊 TIME MANIPULATION
     */
    async freezeTime(duration = 0) {
        if (this.state.frozen) {
            return { message: 'Already frozen' };
        }
        
        console.log(`\n❄️  Freezing time for ${this.name}...`);
        
        this.state.frozen = true;
        
        // Pause all platforms
        await Promise.all(
            Object.values(this.platforms).map(p => p.pause && p.pause())
        );
        
        // Stop iteration loop
        if (this.iterationTimer) {
            clearInterval(this.iterationTimer);
        }
        
        this.emit('instance:frozen', {
            id: this.id,
            duration,
            timestamp: Date.now()
        });
        
        // Auto-unfreeze if duration specified
        if (duration > 0) {
            setTimeout(() => this.unfreezeTime(), duration);
        }
        
        return { success: true, frozen: true, duration };
    }
    
    async unfreezeTime() {
        if (!this.state.frozen) {
            return { message: 'Not frozen' };
        }
        
        console.log(`\n🌡️  Unfreezing time for ${this.name}...`);
        
        this.state.frozen = false;
        
        // Resume all platforms
        await Promise.all(
            Object.values(this.platforms).map(p => p.resume && p.resume())
        );
        
        // Restart iteration loop if autonomous
        if (this.state.autonomous) {
            this.startIterationLoop();
        }
        
        this.emit('instance:unfrozen', {
            id: this.id,
            timestamp: Date.now()
        });
        
        return { success: true, frozen: false };
    }
    
    /**
     * 👤 AGENT ACCESS
     */
    async getAgent(agentId) {
        // Agents live in the runtime platform
        return await this.runtime.getAgent(agentId);
    }
    
    async getAllAgents() {
        return await this.runtime.getAllAgents();
    }
    
    async createAgent(agentConfig) {
        const agent = await this.runtime.createAgent(agentConfig);
        
        // Notify other platforms
        await this.bridge.broadcast('agent:created', {
            agentId: agent.id,
            config: agentConfig
        });
        
        return agent;
    }
    
    /**
     * 📸 SNAPSHOT MANAGEMENT
     */
    async takeSnapshot(reason = 'manual') {
        console.log(`\n📸 Taking snapshot of ${this.name}...`);
        
        const snapshot = {
            id: this.generateSnapshotId(),
            instanceId: this.id,
            timestamp: Date.now(),
            reason,
            iteration: this.state.iterationCount,
            state: {
                instance: { ...this.state },
                platforms: {}
            }
        };
        
        // Capture each platform's state
        for (const [name, platform] of Object.entries(this.platforms)) {
            if (platform.exportState) {
                snapshot.state.platforms[name] = await platform.exportState();
            }
        }
        
        // Calculate snapshot hash
        snapshot.hash = this.hashSnapshot(snapshot);
        
        // Store snapshot
        this.snapshots.push(snapshot);
        this.state.lastSnapshot = snapshot.id;
        
        // Emit event
        this.emit('instance:snapshot', {
            id: snapshot.id,
            reason,
            size: JSON.stringify(snapshot).length
        });
        
        console.log(`  ✓ Snapshot ${snapshot.id} created`);
        
        return snapshot;
    }
    
    async restoreFromSnapshot(snapshotId) {
        const snapshot = this.snapshots.find(s => s.id === snapshotId);
        
        if (!snapshot) {
            throw new Error(`Snapshot ${snapshotId} not found`);
        }
        
        console.log(`\n🔄 Restoring ${this.name} from snapshot ${snapshotId}...`);
        
        // Pause operations
        const wasAutonomous = this.state.autonomous;
        if (wasAutonomous) {
            await this.pauseOperations();
        }
        
        // Restore each platform
        for (const [name, platformState] of Object.entries(snapshot.state.platforms)) {
            if (this.platforms[name].importState) {
                await this.platforms[name].importState(platformState);
                console.log(`  ✓ ${name} platform restored`);
            }
        }
        
        // Restore instance state
        this.state = { ...this.state, ...snapshot.state.instance };
        
        // Resume if was autonomous
        if (wasAutonomous) {
            await this.startAutonomousOperations();
        }
        
        this.emit('instance:restored', {
            snapshotId,
            timestamp: Date.now()
        });
        
        return { success: true, snapshotId };
    }
    
    /**
     * 🔄 SYNCHRONIZATION
     */
    startSynchronization() {
        this.syncTimer = setInterval(async () => {
            if (!this.state.frozen) {
                await this.synchronizePlatforms();
            }
        }, this.config.synchronizationInterval);
    }
    
    async synchronizePlatforms() {
        // Let platforms sync through the bridge
        const syncData = await this.bridge.synchronize();
        
        this.emit('instance:synchronized', {
            timestamp: Date.now(),
            syncData
        });
    }
    
    startIterationLoop() {
        this.iterationTimer = setInterval(async () => {
            if (!this.state.frozen && this.state.autonomous) {
                this.state.iterationCount++;
                
                // Let each platform iterate
                await Promise.all(
                    Object.values(this.platforms).map(p => 
                        p.iterate && p.iterate(this.state.iterationCount)
                    )
                );
                
                this.emit('instance:iteration', {
                    count: this.state.iterationCount,
                    timestamp: Date.now()
                });
            }
        }, this.config.synchronizationInterval);
    }
    
    startSnapshotCycle() {
        this.snapshotTimer = setInterval(async () => {
            if (!this.state.frozen) {
                await this.takeSnapshot('automatic');
            }
        }, this.config.snapshotInterval);
    }
    
    /**
     * 📊 STATUS & MONITORING
     */
    async getPlatformStatus() {
        const status = {};
        
        for (const [name, platform] of Object.entries(this.platforms)) {
            if (platform.getStatus) {
                status[name] = await platform.getStatus();
            } else {
                status[name] = { 
                    status: this.state.health[name],
                    message: 'Platform status not implemented'
                };
            }
        }
        
        return status;
    }
    
    async getInstanceStatus() {
        return {
            id: this.id,
            name: this.name,
            state: this.state,
            config: this.config,
            platforms: await this.getPlatformStatus(),
            snapshots: this.snapshots.length,
            uptime: Date.now() - this.creationTime
        };
    }
    
    isAutonomous() {
        return this.state.autonomous;
    }
    
    isFrozen() {
        return this.state.frozen;
    }
    
    /**
     * 🛠️ UTILITIES
     */
    generateInstanceId() {
        return `INSTANCE_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }
    
    generateSnapshotId() {
        return `SNAPSHOT_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    }
    
    hashSnapshot(snapshot) {
        const data = JSON.stringify({
            instanceId: snapshot.instanceId,
            timestamp: snapshot.timestamp,
            state: snapshot.state
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    
    /**
     * 🛑 LIFECYCLE MANAGEMENT
     */
    async pauseOperations() {
        if (this.iterationTimer) {
            clearInterval(this.iterationTimer);
        }
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        if (this.snapshotTimer) {
            clearInterval(this.snapshotTimer);
        }
        
        this.state.running = false;
        this.state.autonomous = false;
    }
    
    async shutdown() {
        console.log(`\n🛑 Shutting down ${this.name}...`);
        
        // Stop all timers
        await this.pauseOperations();
        
        // Take final snapshot
        await this.takeSnapshot('shutdown');
        
        // Shutdown platforms
        await Promise.all(
            Object.values(this.platforms).map(p => 
                p.shutdown && p.shutdown()
            )
        );
        
        this.emit('instance:shutdown', {
            id: this.id,
            finalSnapshot: this.state.lastSnapshot
        });
        
        console.log(`✅ ${this.name} shutdown complete`);
    }
}

// Export
export default FourPlatformInstance;