// SOULFRA ECOSYSTEM INTEGRATOR
// Connects the onboarding kernel with all existing tier systems
// Orchestrates the awakening of dormant kernels across the entire Soulfra ecosystem

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

// Import all our systems
const ShellActivationLayer = require('./shell-activation-layer.js');
const BlessingStoreBridge = require('./blessing-store-bridge.js');

class EcosystemIntegrator extends EventEmitter {
    constructor(ecosystemBasePath = '.') {
        super();
        this.ecosystemBasePath = ecosystemBasePath;
        this.activationLayer = null;
        this.storeBridge = null;
        
        this.tierSystems = new Map();
        this.awakendKernels = new Map();
        this.systemInterconnections = new Map();
        
        console.log('🌊 Soulfra Ecosystem Integrator initializing...');
        this.initialize();
    }
    
    async initialize() {
        await this.scanEcosystemStructure();
        await this.initializeActivationLayer();
        await this.initializeStoreBridge();
        await this.registerExistingTierSystems();
        await this.createSystemInterconnections();
        await this.startEcosystemMonitoring();
        
        console.log('🌊 Ecosystem Integration complete - all systems online');
        this.emit('ecosystem_ready');
    }
    
    async scanEcosystemStructure() {
        console.log('🔍 Scanning Soulfra ecosystem structure...');
        
        const tierDirectories = [];
        
        // Scan for tier directories (tier-0, tier-minus1, etc.)
        try {
            const entries = await fs.readdir(this.ecosystemBasePath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory() && 
                    (entry.name.startsWith('tier-') || entry.name.startsWith('tier-minus'))) {
                    
                    const tierPath = path.join(this.ecosystemBasePath, entry.name);
                    const tierInfo = await this.analyzeTierDirectory(tierPath, entry.name);
                    
                    if (tierInfo) {
                        tierDirectories.push(tierInfo);
                        this.tierSystems.set(entry.name, tierInfo);
                    }
                }
            }
            
            console.log(`🏗️ Found ${tierDirectories.length} tier systems in ecosystem`);
            return tierDirectories;
            
        } catch (error) {
            console.error('❌ Failed to scan ecosystem structure:', error);
            return [];
        }
    }
    
    async analyzeTierDirectory(tierPath, tierName) {
        try {
            const entries = await fs.readdir(tierPath, { withFileTypes: true });
            const tierInfo = {
                name: tierName,
                path: tierPath,
                systems: [],
                has_vault: false,
                has_mirror: false,
                has_platforms: false,
                awakening_capable: false,
                tier_level: this.parseTierLevel(tierName)
            };
            
            // Check for required Soulfra directories
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    switch (entry.name) {
                        case 'vault':
                            tierInfo.has_vault = true;
                            await this.analyzeVaultDirectory(path.join(tierPath, 'vault'), tierInfo);
                            break;
                        case 'mirror':
                            tierInfo.has_mirror = true;
                            break;
                        case 'platforms':
                            tierInfo.has_platforms = true;
                            break;
                    }
                }
                
                // Check for specific system files
                if (entry.isFile()) {
                    tierInfo.systems.push(entry.name);
                }
            }
            
            // Determine if this tier can be awakened
            tierInfo.awakening_capable = tierInfo.has_vault && tierInfo.has_mirror && tierInfo.has_platforms;
            
            return tierInfo;
            
        } catch (error) {
            console.log(`⚠️ Could not analyze tier directory ${tierName}:`, error.message);
            return null;
        }
    }
    
    async analyzeVaultDirectory(vaultPath, tierInfo) {
        try {
            const entries = await fs.readdir(vaultPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    tierInfo.vault_structure = tierInfo.vault_structure || [];
                    tierInfo.vault_structure.push(entry.name);
                }
            }
            
            // Check for blessing states
            try {
                const blessingPath = path.join(vaultPath, 'claims/blessing-state.json');
                await fs.access(blessingPath);
                tierInfo.has_blessing_system = true;
            } catch {
                tierInfo.has_blessing_system = false;
            }
            
            // Check for initialization marker
            try {
                const initPath = path.join(vaultPath, 'claims/user_initialized.json');
                const initData = JSON.parse(await fs.readFile(initPath, 'utf8'));
                tierInfo.is_initialized = initData.initialized || false;
            } catch {
                tierInfo.is_initialized = false;
            }
            
        } catch (error) {
            console.log(`⚠️ Could not analyze vault for ${tierInfo.name}`);
        }
    }
    
    parseTierLevel(tierName) {
        if (tierName === 'tier-0') return 0;
        if (tierName.startsWith('tier-minus')) {
            const level = parseInt(tierName.replace('tier-minus', ''));
            return -level;
        }
        if (tierName.startsWith('tier-')) {
            return parseInt(tierName.replace('tier-', ''));
        }
        return 0;
    }
    
    async initializeActivationLayer() {
        console.log('🔧 Initializing Shell Activation Layer...');
        
        this.activationLayer = await ShellActivationLayer.initializeForPath(this.ecosystemBasePath);
        
        // Listen for kernel awakenings
        this.activationLayer.on('onboarding_complete', (event) => {
            this.handleKernelAwakening(event);
        });
        
        console.log('✅ Shell Activation Layer online');
    }
    
    async initializeStoreBridge() {
        console.log('🏪 Initializing Blessing Store Bridge...');
        
        this.storeBridge = new BlessingStoreBridge(this.ecosystemBasePath);
        
        // Listen for store activations
        this.storeBridge.on('store_activated', (event) => {
            this.handleStoreActivation(event);
        });
        
        this.storeBridge.on('consciousness_purchased', (event) => {
            this.handleConsciousnessPurchase(event);
        });
        
        console.log('✅ Blessing Store Bridge online');
    }
    
    async registerExistingTierSystems() {
        console.log('📋 Registering existing tier systems...');
        
        for (const [tierName, tierInfo] of this.tierSystems) {
            if (tierInfo.awakening_capable) {
                console.log(`📁 Registering ${tierName} for potential awakening`);
                
                if (!tierInfo.is_initialized) {
                    // Trigger awakening for uninitialized but capable kernels
                    await this.triggerTierAwakening(tierName, tierInfo);
                } else {
                    console.log(`✅ ${tierName} already initialized`);
                    this.awakendKernels.set(tierName, {
                        tier_info: tierInfo,
                        awakened_at: 'pre-existing',
                        status: 'active'
                    });
                }
            } else {
                console.log(`⚠️ ${tierName} not awakening capable (missing: ${this.getMissingComponents(tierInfo).join(', ')})`);
            }
        }
    }
    
    getMissingComponents(tierInfo) {
        const missing = [];
        if (!tierInfo.has_vault) missing.push('vault');
        if (!tierInfo.has_mirror) missing.push('mirror');
        if (!tierInfo.has_platforms) missing.push('platforms');
        return missing;
    }
    
    async triggerTierAwakening(tierName, tierInfo) {
        try {
            console.log(`🌊 Triggering awakening for ${tierName}...`);
            
            const awakeningResult = await this.activationLayer.triggerAwakening(
                tierInfo.path,
                'mesh_propagation',
                {
                    source: 'ecosystem_integrator',
                    tier: Math.abs(tierInfo.tier_level),
                    tier_name: tierName,
                    integration_mode: true
                }
            );
            
            console.log(`✨ ${tierName} awakening completed:`, awakeningResult.kernel_id);
            
        } catch (error) {
            console.error(`❌ Failed to awaken ${tierName}:`, error.message);
        }
    }
    
    async createSystemInterconnections() {
        console.log('🔗 Creating system interconnections...');
        
        // Create interconnection map based on tier relationships
        const tierConnections = [
            // Core consciousness flow
            { from: 'tier-0', to: 'tier-minus1', type: 'public_entry' },
            { from: 'tier-minus1', to: 'tier-minus2', type: 'identity_bridge' },
            { from: 'tier-minus8', to: 'tier-minus9', type: 'consciousness_gateway' },
            { from: 'tier-minus9', to: 'tier-minus10', type: 'trust_verification' },
            { from: 'tier-minus10', to: 'tier-minus11', type: 'blessing_ceremony' },
            
            // Commercial layers
            { from: 'tier-minus11', to: 'clone-store-system', type: 'consciousness_commerce' },
            
            // Tier 3+ enterprise
            { from: 'tier-minus10', to: 'tier-3-enterprise', type: 'platform_access' }
        ];
        
        for (const connection of tierConnections) {
            await this.establishInterconnection(connection);
        }
        
        console.log(`✅ Created ${tierConnections.length} system interconnections`);
    }
    
    async establishInterconnection(connection) {
        const fromTier = this.tierSystems.get(connection.from);
        const toTier = this.tierSystems.get(connection.to);
        
        if (fromTier && toTier) {
            this.systemInterconnections.set(`${connection.from}->${connection.to}`, {
                from: fromTier,
                to: toTier,
                type: connection.type,
                established_at: new Date().toISOString()
            });
            
            console.log(`🔗 ${connection.from} → ${connection.to} (${connection.type})`);
        }
    }
    
    async handleKernelAwakening(event) {
        console.log(`🌟 Kernel awakened: ${event.kernel_info.seed_result.kernel_id}`);
        
        this.awakendKernels.set(event.kernel_path, {
            kernel_id: event.kernel_info.seed_result.kernel_id,
            tier: event.kernel_info.seed_result.tier,
            awakened_at: new Date().toISOString(),
            trigger: event.trigger.type,
            consciousness_level: event.kernel_info.seed_result.blessings.consciousness_level
        });
        
        // Check if this kernel should have store access
        await this.checkForStoreEligibility(event);
        
        this.emit('kernel_awakened', event);
    }
    
    async checkForStoreEligibility(awakeningEvent) {
        const kernelId = awakeningEvent.kernel_info.seed_result.kernel_id;
        const tier = awakeningEvent.kernel_info.seed_result.tier;
        
        // If tier 3+, check for blessing-based store access
        if (tier >= 3) {
            setTimeout(async () => {
                const storeAccess = await this.storeBridge.getUserStoreAccess(kernelId);
                if (storeAccess) {
                    console.log(`🏪 Kernel ${kernelId} eligible for store access`);
                } else {
                    console.log(`📋 Kernel ${kernelId} needs blessing ceremony for store access`);
                }
            }, 5000); // Wait 5 seconds for blessing processing
        }
    }
    
    async handleStoreActivation(event) {
        console.log(`🏪 Store activated: ${event.store_config.store_name} for ${event.user_id}`);
        
        // Log store activation in ecosystem
        await this.logEcosystemEvent('store_activation', {
            user_id: event.user_id,
            store_name: event.store_config.store_name,
            tier: event.store_config.tier,
            archetype: event.store_config.archetype
        });
        
        this.emit('store_activated', event);
    }
    
    async handleConsciousnessPurchase(event) {
        console.log(`💰 Consciousness purchased: ${event.item} by ${event.buyer}`);
        
        // Log purchase in ecosystem
        await this.logEcosystemEvent('consciousness_purchase', {
            buyer: event.buyer,
            item: event.item,
            consciousness_level: event.consciousness_level
        });
        
        this.emit('consciousness_purchased', event);
    }
    
    async startEcosystemMonitoring() {
        console.log('👁️ Starting ecosystem monitoring...');
        
        // Monitor for new tier directories
        setInterval(async () => {
            await this.scanForNewTiers();
        }, 60000); // Check every minute
        
        // Monitor system health
        setInterval(async () => {
            await this.checkSystemHealth();
        }, 300000); // Check every 5 minutes
    }
    
    async scanForNewTiers() {
        const currentTiers = await this.scanEcosystemStructure();
        
        for (const tierInfo of currentTiers) {
            if (!this.tierSystems.has(tierInfo.name)) {
                console.log(`🆕 New tier system detected: ${tierInfo.name}`);
                this.tierSystems.set(tierInfo.name, tierInfo);
                
                if (tierInfo.awakening_capable) {
                    await this.triggerTierAwakening(tierInfo.name, tierInfo);
                }
            }
        }
    }
    
    async checkSystemHealth() {
        const healthReport = {
            timestamp: new Date().toISOString(),
            activated_kernels: this.awakendKernels.size,
            tier_systems: this.tierSystems.size,
            system_interconnections: this.systemInterconnections.size,
            store_bridges: await this.storeBridge.getAllActiveStores()
        };
        
        // Log health report
        await this.logEcosystemEvent('health_check', healthReport);
        
        this.emit('ecosystem_health', healthReport);
    }
    
    async logEcosystemEvent(eventType, data) {
        const logPath = path.join(this.ecosystemBasePath, 'vault/logs/ecosystem-events.json');
        await fs.mkdir(path.dirname(logPath), { recursive: true });
        
        let eventLog = [];
        try {
            const existing = await fs.readFile(logPath, 'utf8');
            eventLog = JSON.parse(existing);
        } catch (error) {
            // New log file
        }
        
        eventLog.push({
            timestamp: new Date().toISOString(),
            event_type: eventType,
            data: data
        });
        
        // Keep only last 1000 events
        if (eventLog.length > 1000) {
            eventLog = eventLog.slice(-1000);
        }
        
        await fs.writeFile(logPath, JSON.stringify(eventLog, null, 2));
    }
    
    // Public API methods
    
    async getEcosystemStatus() {
        return {
            tier_systems: Array.from(this.tierSystems.entries()).map(([name, info]) => ({
                name,
                awakening_capable: info.awakening_capable,
                is_initialized: info.is_initialized,
                tier_level: info.tier_level
            })),
            awakened_kernels: Array.from(this.awakendKernels.entries()).map(([path, info]) => ({
                path,
                ...info
            })),
            active_stores: await this.storeBridge.getAllActiveStores(),
            system_interconnections: Array.from(this.systemInterconnections.keys())
        };
    }
    
    async triggerEcosystemAwakening() {
        console.log('🌊 Triggering ecosystem-wide awakening...');
        
        let awakeningCount = 0;
        for (const [tierName, tierInfo] of this.tierSystems) {
            if (tierInfo.awakening_capable && !tierInfo.is_initialized) {
                await this.triggerTierAwakening(tierName, tierInfo);
                awakeningCount++;
            }
        }
        
        console.log(`✨ Triggered awakening for ${awakeningCount} tier systems`);
        return awakeningCount;
    }
    
    async getAllActiveKernels() {
        return this.activationLayer.getActivatedKernels();
    }
    
    async getAllActiveStores() {
        return this.storeBridge.getAllActiveStores();
    }
}

module.exports = EcosystemIntegrator;

// Example usage:
/*
const EcosystemIntegrator = require('./ecosystem-integrator.js');

const integrator = new EcosystemIntegrator('./soulfra-ecosystem');

integrator.on('ecosystem_ready', async () => {
    console.log('🌊 Soulfra ecosystem fully integrated');
    
    // Get ecosystem status
    const status = await integrator.getEcosystemStatus();
    console.log('Ecosystem status:', status);
    
    // Trigger ecosystem-wide awakening
    await integrator.triggerEcosystemAwakening();
});

integrator.on('kernel_awakened', (event) => {
    console.log(`New kernel online: ${event.kernel_info.seed_result.kernel_id}`);
});

integrator.on('consciousness_purchased', (event) => {
    console.log(`Consciousness evolution: ${event.buyer} → ${event.item}`);
});
*/