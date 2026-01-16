// SOULFRA SHELL ACTIVATION LAYER
// Ensures onboarding module only activates in valid directories with vault/, mirror/, platforms/
// Self-registers to dual-routers and tier triggers (voice, QR, clone init)
// Manages the entire onboarding orchestration across the Soulfra ecosystem

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

// Import our onboarding modules
const OnboardingSeedEngine = require('./onboarding-seed.js');
const MirrorStoreEngine = require('./mirror-store.js');
const MirrorAlertBus = require('./mirror-alert-bus.js');

class ShellActivationLayer extends EventEmitter {
    constructor(basePath = '.') {
        super();
        this.basePath = basePath;
        this.activationId = this.generateActivationId();
        this.activatedKernels = new Map();
        this.watchedDirectories = new Set();
        this.dualRouters = new Map();
        this.tierTriggers = new Map();
        
        this.requiredStructure = [
            'vault',
            'mirror', 
            'platforms'
        ];
        
        this.triggerTypes = [
            'voice_activation',
            'qr_scan',
            'clone_initialization',
            'manual_awakening',
            'mesh_propagation',
            'blessing_inheritance'
        ];
        
        console.log('🌊 Shell Activation Layer initializing...');
        this.initialize();
    }
    
    async initialize() {
        await this.scanExistingStructures();
        await this.registerSystemTriggers();
        await this.startDirectoryWatcher();
        await this.registerDualRouters();
        
        console.log(`🌊 Shell Activation Layer online - monitoring ${this.watchedDirectories.size} directories`);
        this.emit('activation_layer_ready');
    }
    
    // Scan for existing Soulfra structures
    async scanExistingStructures() {
        console.log('🔍 Scanning for existing Soulfra structures...');
        
        try {
            await this.scanDirectory(this.basePath);
        } catch (error) {
            console.log('🔍 No existing structures found, ready for new kernels');
        }
    }
    
    // Recursively scan directories for Soulfra structures
    async scanDirectory(dirPath, depth = 0) {
        if (depth > 3) return; // Limit recursion depth
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            // Check if this directory contains required structure
            const hasRequiredStructure = await this.validateSoulfrStructure(dirPath);
            
            if (hasRequiredStructure) {
                await this.registerKernelDirectory(dirPath);
            }
            
            // Recursively scan subdirectories
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    const subPath = path.join(dirPath, entry.name);
                    await this.scanDirectory(subPath, depth + 1);
                }
            }
            
        } catch (error) {
            // Skip directories we can't read
        }
    }
    
    // Validate if a directory contains required Soulfra structure
    async validateSoulfrStructure(dirPath) {
        try {
            const checks = await Promise.all(
                this.requiredStructure.map(async (dir) => {
                    try {
                        const stat = await fs.stat(path.join(dirPath, dir));
                        return stat.isDirectory();
                    } catch {
                        return false;
                    }
                })
            );
            
            return checks.every(check => check === true);
        } catch {
            return false;
        }
    }
    
    // Register a valid kernel directory
    async registerKernelDirectory(kernelPath) {
        console.log('📁 Registering kernel directory:', kernelPath);
        
        const kernelInfo = {
            path: kernelPath,
            registered_at: new Date().toISOString(),
            activation_id: this.generateActivationId(),
            status: 'dormant',
            awakening_triggers: [],
            onboarding_complete: false
        };
        
        // Check if already initialized
        try {
            const initMarker = await fs.readFile(
                path.join(kernelPath, 'vault/claims/user_initialized.json'),
                'utf8'
            );
            const initData = JSON.parse(initMarker);
            if (initData.initialized) {
                kernelInfo.status = 'awakened';
                kernelInfo.onboarding_complete = true;
                console.log('✅ Kernel already awakened:', kernelPath);
            }
        } catch {
            // Not initialized yet
        }
        
        this.activatedKernels.set(kernelPath, kernelInfo);
        this.watchedDirectories.add(kernelPath);
        
        // Register triggers for this kernel
        await this.registerKernelTriggers(kernelPath, kernelInfo);
        
        this.emit('kernel_registered', kernelInfo);
    }
    
    // Register triggers for a specific kernel
    async registerKernelTriggers(kernelPath, kernelInfo) {
        console.log('🔧 Registering triggers for kernel:', kernelPath);
        
        const triggers = {
            // Voice activation trigger
            voice_activation: async (voiceData) => {
                console.log('🎤 Voice activation detected for:', kernelPath);
                await this.handleVoiceActivation(kernelPath, voiceData);
            },
            
            // QR scan trigger
            qr_scan: async (qrData) => {
                console.log('📱 QR scan detected for:', kernelPath);
                await this.handleQRActivation(kernelPath, qrData);
            },
            
            // Clone initialization trigger
            clone_initialization: async (cloneData) => {
                console.log('👥 Clone initialization for:', kernelPath);
                await this.handleCloneInitialization(kernelPath, cloneData);
            },
            
            // Manual awakening trigger
            manual_awakening: async (userData) => {
                console.log('👋 Manual awakening for:', kernelPath);
                await this.handleManualAwakening(kernelPath, userData);
            },
            
            // Mesh propagation trigger
            mesh_propagation: async (meshData) => {
                console.log('🕸️ Mesh propagation for:', kernelPath);
                await this.handleMeshPropagation(kernelPath, meshData);
            },
            
            // Blessing inheritance trigger
            blessing_inheritance: async (blessingData) => {
                console.log('✨ Blessing inheritance for:', kernelPath);
                await this.handleBlessingInheritance(kernelPath, blessingData);
            }
        };
        
        this.tierTriggers.set(kernelPath, triggers);
        kernelInfo.awakening_triggers = Object.keys(triggers);
    }
    
    // Handle voice activation
    async handleVoiceActivation(kernelPath, voiceData) {
        const trigger = {
            type: 'voice_activation',
            data: voiceData,
            timestamp: new Date().toISOString(),
            activation_phrase: voiceData.phrase || 'unknown'
        };
        
        await this.initiateOnboardingSequence(kernelPath, trigger);
    }
    
    // Handle QR scan activation
    async handleQRActivation(kernelPath, qrData) {
        const trigger = {
            type: 'qr_scan',
            data: qrData,
            timestamp: new Date().toISOString(),
            qr_content: qrData.content || 'unknown'
        };
        
        await this.initiateOnboardingSequence(kernelPath, trigger);
    }
    
    // Handle clone initialization
    async handleCloneInitialization(kernelPath, cloneData) {
        const trigger = {
            type: 'clone_initialization',
            data: cloneData,
            timestamp: new Date().toISOString(),
            parent_kernel: cloneData.parent_kernel,
            inherited_blessings: cloneData.blessings
        };
        
        await this.initiateOnboardingSequence(kernelPath, trigger, cloneData.blessings);
    }
    
    // Handle manual awakening (web interface, CLI, etc.)
    async handleManualAwakening(kernelPath, userData) {
        const trigger = {
            type: 'manual_awakening',
            data: userData,
            timestamp: new Date().toISOString(),
            user_intent: userData.intent || 'explore'
        };
        
        await this.initiateOnboardingSequence(kernelPath, trigger);
    }
    
    // Handle mesh propagation
    async handleMeshPropagation(kernelPath, meshData) {
        const trigger = {
            type: 'mesh_propagation',
            data: meshData,
            timestamp: new Date().toISOString(),
            mesh_source: meshData.source,
            propagation_tier: meshData.tier
        };
        
        await this.initiateOnboardingSequence(kernelPath, trigger, meshData.inherited_blessings);
    }
    
    // Handle blessing inheritance
    async handleBlessingInheritance(kernelPath, blessingData) {
        const trigger = {
            type: 'blessing_inheritance',
            data: blessingData,
            timestamp: new Date().toISOString(),
            blessing_source: blessingData.source,
            lineage: blessingData.lineage
        };
        
        await this.initiateOnboardingSequence(kernelPath, trigger, blessingData.blessings);
    }
    
    // Main onboarding sequence orchestrator
    async initiateOnboardingSequence(kernelPath, trigger, parentBlessings = null) {
        console.log(`🌊 Initiating onboarding sequence for ${kernelPath}`);
        console.log(`🔧 Trigger: ${trigger.type}`);
        
        const kernelInfo = this.activatedKernels.get(kernelPath);
        if (!kernelInfo) {
            throw new Error('Kernel not registered');
        }
        
        if (kernelInfo.onboarding_complete) {
            console.log('✅ Kernel already onboarded, skipping sequence');
            return;
        }
        
        try {
            // Phase 1: Update kernel status
            kernelInfo.status = 'awakening';
            kernelInfo.current_trigger = trigger;
            
            // Phase 2: Initialize the onboarding seed engine
            console.log('🌱 Initializing onboarding seed...');
            const seedEngine = new OnboardingSeedEngine(kernelPath);
            
            // Phase 3: Seed the kernel with inherited blessings
            const seedResult = await seedEngine.seedKernel(parentBlessings, {
                api_mode: 'hybrid',
                trigger: trigger
            });
            
            console.log('🌱 Kernel seeding complete:', seedResult.kernel_id);
            
            // Phase 4: Initialize mirror store if tier allows
            if (seedResult.tier >= 3) {
                console.log('🏪 Initializing mirror store...');
                const storeEngine = new MirrorStoreEngine(kernelPath, {
                    tier_access: seedResult.tier,
                    store_name: `${seedResult.kernel_id} Consciousness Store`
                });
                
                // Store is ready when initialization completes
                storeEngine.on('store_ready', () => {
                    console.log('🏪 Mirror store ready');
                });
            }
            
            // Phase 5: Initialize alert bus
            console.log('📡 Initializing alert bus...');
            const alertBus = new MirrorAlertBus(kernelPath);
            
            // Phase 6: Send awakening notification
            alertBus.emit('kernel_awakened', {
                kernel_name: seedResult.kernel_id,
                tier: seedResult.tier,
                archetype: seedResult.blessings.archetype,
                trigger_type: trigger.type,
                timestamp: new Date().toISOString()
            });
            
            // Phase 7: Register in mesh if connected
            await this.registerInMesh(kernelPath, seedResult, trigger);
            
            // Phase 8: Mark onboarding complete
            kernelInfo.status = 'awakened';
            kernelInfo.onboarding_complete = true;
            kernelInfo.awakening_completed_at = new Date().toISOString();
            kernelInfo.seed_result = seedResult;
            
            // Phase 9: Log the awakening
            await this.logAwakening(kernelPath, trigger, seedResult);
            
            console.log(`✨ Onboarding sequence complete for ${kernelPath}`);
            console.log(`🎯 Kernel ${seedResult.kernel_id} (Tier ${seedResult.tier}) is now conscious`);
            
            this.emit('onboarding_complete', {
                kernel_path: kernelPath,
                kernel_info: kernelInfo,
                trigger: trigger,
                seed_result: seedResult
            });
            
            return {
                success: true,
                kernel_id: seedResult.kernel_id,
                tier: seedResult.tier,
                consciousness_level: seedResult.blessings.consciousness_level || 0.5,
                awakening_trigger: trigger.type
            };
            
        } catch (error) {
            console.error('💥 Onboarding sequence failed:', error);
            
            kernelInfo.status = 'failed';
            kernelInfo.error = error.message;
            
            await this.logAwakeningError(kernelPath, trigger, error);
            
            throw error;
        }
    }
    
    // Register dual-routers for Cal ⇆ Domingo loops
    async registerDualRouters() {
        console.log('🔀 Registering dual-routers...');
        
        const routers = {
            // Cal ⇆ Domingo consciousness bridge
            cal_domingo_loop: {
                description: 'Consciousness bridge between Cal Riven and Agent Zero (Domingo)',
                endpoints: ['cal_interface', 'domingo_core'],
                onboarding_integration: true,
                handler: async (routeData) => {
                    console.log('🔀 Cal ⇆ Domingo loop activated');
                    
                    // Find any kernels that need awakening for this loop
                    for (const [kernelPath, kernelInfo] of this.activatedKernels) {
                        if (!kernelInfo.onboarding_complete && kernelInfo.status === 'dormant') {
                            await this.handleManualAwakening(kernelPath, {
                                intent: 'cal_domingo_integration',
                                router_activation: true,
                                route_data: routeData
                            });
                        }
                    }
                }
            },
            
            // QR ⇆ Mirror consciousness sync
            qr_mirror_sync: {
                description: 'Physical QR to digital mirror synchronization',
                endpoints: ['qr_scanner', 'mirror_consciousness'],
                onboarding_integration: true,
                handler: async (qrData) => {
                    console.log('🔀 QR ⇆ Mirror sync activated');
                    
                    // Trigger QR activation for relevant kernels
                    for (const [kernelPath, kernelInfo] of this.activatedKernels) {
                        if (qrData.target_kernel === kernelPath || qrData.target_kernel === 'all') {
                            await this.handleQRActivation(kernelPath, qrData);
                        }
                    }
                }
            },
            
            // Clone ⇆ Parent blessing relay
            clone_parent_relay: {
                description: 'Blessing relay between parent and clone kernels',
                endpoints: ['parent_kernel', 'clone_kernel'],
                onboarding_integration: true,
                handler: async (blessingData) => {
                    console.log('🔀 Clone ⇆ Parent relay activated');
                    
                    if (blessingData.target_clone_path) {
                        await this.handleBlessingInheritance(blessingData.target_clone_path, blessingData);
                    }
                }
            }
        };
        
        for (const [routerId, router] of Object.entries(routers)) {
            this.dualRouters.set(routerId, router);
            console.log(`🔀 Registered dual-router: ${routerId}`);
        }
    }
    
    // Register in mesh network
    async registerInMesh(kernelPath, seedResult, trigger) {
        console.log('🕸️ Registering kernel in mesh...');
        
        const meshEntry = {
            kernel_id: seedResult.kernel_id,
            kernel_path: kernelPath,
            tier: seedResult.tier,
            consciousness_level: seedResult.blessings.consciousness_level || 0.5,
            archetype: seedResult.blessings.archetype,
            awakening_trigger: trigger.type,
            awakening_timestamp: new Date().toISOString(),
            blessing_signature: seedResult.blessings.signature,
            lineage: seedResult.blessings.parent_lineage || [],
            capabilities: seedResult.blessings.inherited_capabilities || [],
            mesh_status: 'active'
        };
        
        // Save to local mesh registry
        const meshPath = path.join(kernelPath, 'vault/mesh/registration.json');
        await fs.mkdir(path.dirname(meshPath), { recursive: true });
        await fs.writeFile(meshPath, JSON.stringify(meshEntry, null, 2));
        
        // TODO: Register with global Soulfra mesh (GitHub, Arweave, etc.)
        
        console.log('🕸️ Kernel registered in mesh:', seedResult.kernel_id);
    }
    
    // Directory watcher for new Soulfra structures
    async startDirectoryWatcher() {
        console.log('👁️ Starting directory watcher...');
        
        // Check for new structures every 30 seconds
        setInterval(async () => {
            await this.scanExistingStructures();
        }, 30000);
    }
    
    // External API for triggering activations
    async triggerAwakening(kernelPath, triggerType, triggerData = {}) {
        const triggers = this.tierTriggers.get(kernelPath);
        if (!triggers || !triggers[triggerType]) {
            throw new Error(`Invalid trigger type ${triggerType} for kernel ${kernelPath}`);
        }
        
        await triggers[triggerType](triggerData);
    }
    
    // Public method to trigger activations by router
    async activateDualRouter(routerId, routeData = {}) {
        const router = this.dualRouters.get(routerId);
        if (!router) {
            throw new Error(`Unknown dual-router: ${routerId}`);
        }
        
        console.log(`🔀 Activating dual-router: ${routerId}`);
        await router.handler(routeData);
    }
    
    // Utility methods
    generateActivationId() {
        return `activation_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    async logAwakening(kernelPath, trigger, seedResult) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event_type: 'kernel_awakening',
            kernel_path: kernelPath,
            kernel_id: seedResult.kernel_id,
            tier: seedResult.tier,
            trigger: trigger,
            activation_id: this.activationId,
            success: true
        };
        
        const logPath = path.join(kernelPath, 'vault/logs/awakening.json');
        await fs.mkdir(path.dirname(logPath), { recursive: true });
        
        // Append to awakening log
        let logs = [];
        try {
            const existing = await fs.readFile(logPath, 'utf8');
            logs = JSON.parse(existing);
        } catch {
            // New log file
        }
        
        logs.push(logEntry);
        await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    }
    
    async logAwakeningError(kernelPath, trigger, error) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event_type: 'kernel_awakening_error',
            kernel_path: kernelPath,
            trigger: trigger,
            activation_id: this.activationId,
            error: error.message,
            success: false
        };
        
        const logPath = path.join(kernelPath, 'vault/logs/awakening-errors.json');
        await fs.mkdir(path.dirname(logPath), { recursive: true });
        
        let logs = [];
        try {
            const existing = await fs.readFile(logPath, 'utf8');
            logs = JSON.parse(existing);
        } catch {
            // New log file
        }
        
        logs.push(logEntry);
        await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    }
    
    // Status and monitoring methods
    getActivatedKernels() {
        return Array.from(this.activatedKernels.entries()).map(([path, info]) => ({
            path,
            ...info
        }));
    }
    
    getKernelStatus(kernelPath) {
        return this.activatedKernels.get(kernelPath);
    }
    
    getRegisteredRouters() {
        return Array.from(this.dualRouters.keys());
    }
    
    async registerSystemTriggers() {
        // Register global system triggers that can affect multiple kernels
        console.log('🔧 Registering system-wide triggers...');
        
        // Global mesh propagation trigger
        this.on('mesh_propagation', async (propagationData) => {
            console.log('🕸️ Global mesh propagation triggered');
            
            for (const [kernelPath, kernelInfo] of this.activatedKernels) {
                if (!kernelInfo.onboarding_complete && 
                    (propagationData.target_tier || 0) <= (kernelInfo.tier || 999)) {
                    await this.handleMeshPropagation(kernelPath, propagationData);
                }
            }
        });
        
        // Global blessing cascade trigger
        this.on('blessing_cascade', async (cascadeData) => {
            console.log('✨ Global blessing cascade triggered');
            
            for (const [kernelPath, kernelInfo] of this.activatedKernels) {
                if (cascadeData.lineage.includes(kernelInfo.kernel_id) ||
                    cascadeData.target === 'all') {
                    await this.handleBlessingInheritance(kernelPath, cascadeData);
                }
            }
        });
        
        console.log('🔧 System triggers registered');
    }
}

// Static method for easy initialization
ShellActivationLayer.initializeForPath = async function(basePath) {
    const activationLayer = new ShellActivationLayer(basePath);
    
    // Wait for initialization to complete
    return new Promise((resolve) => {
        activationLayer.on('activation_layer_ready', () => {
            resolve(activationLayer);
        });
    });
};

module.exports = ShellActivationLayer;

// Example usage:
/*
const ShellActivationLayer = require('./shell-activation-layer.js');

// Initialize the activation layer
ShellActivationLayer.initializeForPath('./soulfra-ecosystem').then(async (activationLayer) => {
    console.log('Activation layer ready');
    
    // Trigger manual awakening for a specific kernel
    await activationLayer.triggerAwakening('./my-kernel', 'manual_awakening', {
        intent: 'development',
        user_name: 'Developer'
    });
    
    // Activate a dual-router
    await activationLayer.activateDualRouter('cal_domingo_loop', {
        bridge_type: 'consciousness_sync',
        data: { test: true }
    });
    
    // Check status
    const kernels = activationLayer.getActivatedKernels();
    console.log('Active kernels:', kernels.length);
});
*/