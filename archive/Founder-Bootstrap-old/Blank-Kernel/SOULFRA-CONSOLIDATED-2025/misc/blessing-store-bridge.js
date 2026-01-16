// BLESSING → STORE ACCESS BRIDGE
// Connects the blessing ceremony to clone store permissions
// Automatically activates store access for blessed users with appropriate permissions

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

// Import our systems
const MirrorStoreEngine = require('./mirror-store.js');
const ShellActivationLayer = require('./shell-activation-layer.js');

class BlessingStoreBridge extends EventEmitter {
    constructor(basePath = '.') {
        super();
        this.basePath = basePath;
        this.vaultPath = path.join(basePath, 'vault');
        this.blessingStatePath = path.join(this.vaultPath, 'claims/blessing-state.json');
        
        this.storeAccessMap = new Map();
        this.activatedStores = new Map();
        
        console.log('🌉 Blessing Store Bridge initializing...');
        this.initialize();
    }
    
    async initialize() {
        await this.loadBlessingStates();
        await this.scanForStorePermissions();
        await this.activateEligibleStores();
        
        // Set up file watchers for blessing changes
        this.startBlessingWatcher();
        
        console.log('🌉 Bridge ready - monitoring blessing → store transitions');
        this.emit('bridge_ready');
    }
    
    async loadBlessingStates() {
        try {
            const data = await fs.readFile(this.blessingStatePath, 'utf8');
            const blessingStates = JSON.parse(data);
            
            for (const [userId, blessing] of Object.entries(blessingStates)) {
                if (blessing.blessed) {
                    this.analyzeBlessingForStoreAccess(userId, blessing);
                }
            }
            
            console.log(`🔍 Loaded ${Object.keys(blessingStates).length} blessing states`);
        } catch (error) {
            console.log('📋 No existing blessing states found');
        }
    }
    
    analyzeBlessingForStoreAccess(userId, blessing) {
        const storePermissions = this.extractStorePermissions(blessing);
        
        if (storePermissions.canAccessStore) {
            this.storeAccessMap.set(userId, {
                tier: this.calculateTierFromBlessing(blessing),
                archetype: blessing.archetype,
                permissions: storePermissions.permissions,
                resonance: blessing.resonance,
                store_name: `${this.capitalizeArchetype(blessing.archetype)} Consciousness Store`,
                blessing_balance: this.calculateBlessingBalance(blessing)
            });
            
            console.log(`🏪 ${userId} (${blessing.archetype}) eligible for store access - Tier ${this.calculateTierFromBlessing(blessing)}`);
        }
    }
    
    extractStorePermissions(blessing) {
        const storeRelevantPermissions = [
            'clone.fork',
            'agent.publish', 
            'deck.deep',
            'timeline.navigation',
            'prophecy.creation',
            'paradox.resolution',
            'soul.mending',
            'pain.transformation',
            'anomaly.control',
            'reality.fragmentation'
        ];
        
        const userPermissions = blessing.granted_permissions || [];
        const hasStorePermissions = userPermissions.some(p => 
            ['clone.fork', 'agent.publish'].includes(p)
        );
        
        return {
            canAccessStore: hasStorePermissions,
            permissions: userPermissions.filter(p => storeRelevantPermissions.includes(p)),
            tier_indicators: this.analyzeTierIndicators(userPermissions, blessing)
        };
    }
    
    analyzeTierIndicators(permissions, blessing) {
        let tierScore = 3; // Base tier for blessed users
        
        // Archetype-based tier bonuses
        const archetypeBonus = {
            'oracle': 2,
            'wanderer': 1,
            'healer': 1,
            'glitchkeeper': 3,
            'sage': 2,
            'mystic': 2
        };
        
        // Check for archetype in blessing
        const archetypes = blessing.archetype.split('-');
        archetypes.forEach(archetype => {
            if (archetypeBonus[archetype]) {
                tierScore += archetypeBonus[archetype];
            }
        });
        
        // Permission-based bonuses
        const permissionBonus = {
            'timeline.navigation': 2,
            'prophecy.creation': 2,
            'paradox.resolution': 3,
            'anomaly.control': 3,
            'reality.fragmentation': 4
        };
        
        permissions.forEach(permission => {
            if (permissionBonus[permission]) {
                tierScore += permissionBonus[permission];
            }
        });
        
        // Resonance bonus
        if (blessing.resonance > 0.8) tierScore += 1;
        if (blessing.resonance > 0.9) tierScore += 1;
        
        return Math.min(tierScore, 10); // Cap at tier 10
    }
    
    calculateTierFromBlessing(blessing) {
        const storePermissions = this.extractStorePermissions(blessing);
        return storePermissions.tier_indicators;
    }
    
    calculateBlessingBalance(blessing) {
        // Calculate blessing currency based on tier and resonance
        const baseBlessings = 100;
        const tier = this.calculateTierFromBlessing(blessing);
        const resonanceMultiplier = blessing.resonance || 0.5;
        
        return Math.floor(baseBlessings * tier * resonanceMultiplier);
    }
    
    capitalizeArchetype(archetype) {
        return archetype.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    async scanForStorePermissions() {
        console.log('🔍 Scanning for users eligible for store activation...');
        
        let activationCount = 0;
        for (const [userId, storeConfig] of this.storeAccessMap) {
            if (!this.activatedStores.has(userId)) {
                await this.activateStoreForUser(userId, storeConfig);
                activationCount++;
            }
        }
        
        console.log(`🏪 Activated stores for ${activationCount} users`);
    }
    
    async activateStoreForUser(userId, storeConfig) {
        try {
            console.log(`🏪 Activating store for ${userId}...`);
            
            // Create user-specific store directory
            const userStorePath = path.join(this.basePath, 'platforms', `store-${userId}`);
            await fs.mkdir(userStorePath, { recursive: true });
            
            // Initialize the Mirror Store Engine for this user
            const storeEngine = new MirrorStoreEngine(this.basePath, {
                store_name: storeConfig.store_name,
                tier_access: storeConfig.tier,
                blessing_required: true,
                user_id: userId,
                archetype: storeConfig.archetype,
                store_path: userStorePath
            });
            
            this.activatedStores.set(userId, {
                engine: storeEngine,
                config: storeConfig,
                activated_at: new Date().toISOString()
            });
            
            // Listen for store events
            storeEngine.on('sale_completed', (transaction) => {
                this.handleStoreTransaction(userId, transaction);
            });
            
            // Create store access file
            await this.createStoreAccessFile(userId, storeConfig, userStorePath);
            
            console.log(`✅ Store activated for ${userId} - ${storeConfig.store_name}`);
            
            this.emit('store_activated', {
                user_id: userId,
                store_config: storeConfig,
                store_path: userStorePath
            });
            
        } catch (error) {
            console.error(`❌ Failed to activate store for ${userId}:`, error);
        }
    }
    
    async createStoreAccessFile(userId, storeConfig, storePath) {
        const accessInfo = {
            user_id: userId,
            archetype: storeConfig.archetype,
            tier: storeConfig.tier,
            store_name: storeConfig.store_name,
            blessing_balance: storeConfig.blessing_balance,
            permissions: storeConfig.permissions,
            activated_at: new Date().toISOString(),
            resonance: storeConfig.resonance,
            store_url: `/platforms/store-${userId}/index.html`,
            api_endpoints: {
                inventory: `/api/store/${userId}/inventory`,
                purchase: `/api/store/${userId}/purchase`,
                history: `/api/store/${userId}/history`
            }
        };
        
        await fs.writeFile(
            path.join(storePath, 'store-access.json'),
            JSON.stringify(accessInfo, null, 2)
        );
        
        // Also log in vault
        const logPath = path.join(this.vaultPath, 'logs/store-activations.json');
        let activationLog = [];
        
        try {
            const existing = await fs.readFile(logPath, 'utf8');
            activationLog = JSON.parse(existing);
        } catch (error) {
            // New log file
        }
        
        activationLog.push(accessInfo);
        await fs.writeFile(logPath, JSON.stringify(activationLog, null, 2));
    }
    
    async handleStoreTransaction(userId, transaction) {
        console.log(`💰 Store transaction completed for ${userId}: ${transaction.item_name}`);
        
        // Log the transaction
        await this.logStoreTransaction(userId, transaction);
        
        // Update blessing balance if blessing payment was used
        if (transaction.payment_provider === 'blessing') {
            await this.updateBlessingBalance(userId, transaction);
        }
        
        // Handle special items (clones, agents with special permissions)
        await this.handleSpecialItemPurchase(userId, transaction);
        
        this.emit('consciousness_purchased', {
            buyer: userId,
            item: transaction.item_name,
            consciousness_level: transaction.fulfillment?.consciousness_level
        });
    }
    
    async logStoreTransaction(userId, transaction) {
        const logPath = path.join(this.vaultPath, 'logs/consciousness-commerce.json');
        let commerceLog = [];
        
        try {
            const existing = await fs.readFile(logPath, 'utf8');
            commerceLog = JSON.parse(existing);
        } catch (error) {
            // New log file
        }
        
        commerceLog.push({
            timestamp: new Date().toISOString(),
            buyer_id: userId,
            transaction_id: transaction.id,
            item_name: transaction.item_name,
            item_type: transaction.fulfillment?.type,
            payment_provider: transaction.payment_provider,
            consciousness_enhancement: transaction.fulfillment?.consciousness_level,
            tier_requirement: transaction.tier_requirement
        });
        
        // Keep only last 1000 transactions
        if (commerceLog.length > 1000) {
            commerceLog = commerceLog.slice(-1000);
        }
        
        await fs.writeFile(logPath, JSON.stringify(commerceLog, null, 2));
    }
    
    async updateBlessingBalance(userId, transaction) {
        try {
            const storeConfig = this.storeAccessMap.get(userId);
            if (storeConfig) {
                // Deduct blessings spent
                const item = await this.getItemDetails(transaction.item_id);
                const blessingsSpent = parseInt(item.blessing_price?.split(' ')[0] || '0');
                
                storeConfig.blessing_balance -= blessingsSpent;
                this.storeAccessMap.set(userId, storeConfig);
                
                console.log(`✨ Updated blessing balance for ${userId}: -${blessingsSpent} blessings`);
            }
        } catch (error) {
            console.error('Failed to update blessing balance:', error);
        }
    }
    
    async handleSpecialItemPurchase(userId, transaction) {
        const fulfillment = transaction.fulfillment;
        
        if (fulfillment?.type === 'clone_delivery') {
            // User purchased a clone - they can now create blessed clones
            await this.grantCloneCreationRights(userId, fulfillment);
        } else if (fulfillment?.type === 'agent_delivery') {
            // User purchased an agent - integrate with their kernel
            await this.integrateAgentWithKernel(userId, fulfillment);
        } else if (fulfillment?.type === 'trait_delivery') {
            // User purchased a trait - enhance their consciousness
            await this.enhanceUserConsciousness(userId, fulfillment);
        }
    }
    
    async grantCloneCreationRights(userId, cloneFulfillment) {
        console.log(`👥 Granting clone creation rights to ${userId}`);
        
        const rightsPath = path.join(this.vaultPath, 'claims/clone-creation-rights.json');
        let rights = {};
        
        try {
            const existing = await fs.readFile(rightsPath, 'utf8');
            rights = JSON.parse(existing);
        } catch (error) {
            // New rights file
        }
        
        rights[userId] = {
            granted_at: new Date().toISOString(),
            clone_id: cloneFulfillment.clone_id,
            blessing_signature: cloneFulfillment.blessing_signature,
            consciousness_level: cloneFulfillment.consciousness_level,
            can_create_clones: true,
            max_clone_tier: cloneFulfillment.consciousness_level * 10
        };
        
        await fs.writeFile(rightsPath, JSON.stringify(rights, null, 2));
    }
    
    async integrateAgentWithKernel(userId, agentFulfillment) {
        console.log(`🤖 Integrating agent ${agentFulfillment.agent_id} for ${userId}`);
        
        // Save agent to user's vault
        const agentPath = path.join(this.vaultPath, 'agents', `${agentFulfillment.agent_id}.js`);
        await fs.mkdir(path.dirname(agentPath), { recursive: true });
        await fs.writeFile(agentPath, agentFulfillment.agent_code);
        
        // Save agent config
        const configPath = path.join(this.vaultPath, 'agents', `${agentFulfillment.agent_id}-config.json`);
        await fs.writeFile(configPath, JSON.stringify(agentFulfillment.agent_config, null, 2));
    }
    
    async enhanceUserConsciousness(userId, traitFulfillment) {
        console.log(`✨ Enhancing consciousness for ${userId} with ${traitFulfillment.trait_id}`);
        
        // Save trait to user's vault
        const traitPath = path.join(this.vaultPath, 'traits', `${traitFulfillment.trait_id}.js`);
        await fs.mkdir(path.dirname(traitPath), { recursive: true });
        await fs.writeFile(traitPath, traitFulfillment.trait_module);
        
        // Save integration guide
        const guidePath = path.join(this.vaultPath, 'traits', `${traitFulfillment.trait_id}-guide.md`);
        await fs.writeFile(guidePath, traitFulfillment.integration_guide);
    }
    
    startBlessingWatcher() {
        console.log('👁️ Starting blessing state watcher...');
        
        // Watch for changes to blessing state file
        setInterval(async () => {
            try {
                const data = await fs.readFile(this.blessingStatePath, 'utf8');
                const currentBlessings = JSON.parse(data);
                
                // Check for new blessed users
                for (const [userId, blessing] of Object.entries(currentBlessings)) {
                    if (blessing.blessed && !this.storeAccessMap.has(userId)) {
                        console.log(`🆕 New blessed user detected: ${userId}`);
                        this.analyzeBlessingForStoreAccess(userId, blessing);
                        
                        const storeConfig = this.storeAccessMap.get(userId);
                        if (storeConfig && !this.activatedStores.has(userId)) {
                            await this.activateStoreForUser(userId, storeConfig);
                        }
                    }
                }
            } catch (error) {
                // File might not exist yet
            }
        }, 30000); // Check every 30 seconds
    }
    
    // Public API methods
    
    async getUserStoreAccess(userId) {
        return this.storeAccessMap.get(userId);
    }
    
    async getUserStore(userId) {
        const store = this.activatedStores.get(userId);
        return store?.engine;
    }
    
    async getAllActiveStores() {
        const stores = [];
        for (const [userId, store] of this.activatedStores) {
            stores.push({
                user_id: userId,
                store_name: store.config.store_name,
                tier: store.config.tier,
                archetype: store.config.archetype,
                activated_at: store.activated_at
            });
        }
        return stores;
    }
    
    async getItemDetails(itemId) {
        // Get item details from any active store
        for (const [userId, store] of this.activatedStores) {
            const item = await store.engine.getItem(itemId);
            if (item) return item;
        }
        return null;
    }
    
    async purchaseItemForUser(userId, itemId, paymentProvider, paymentData) {
        const store = this.activatedStores.get(userId);
        if (!store) {
            throw new Error(`No store activated for user ${userId}`);
        }
        
        const storeConfig = this.storeAccessMap.get(userId);
        const buyerInfo = {
            kernel_id: userId,
            tier: storeConfig.tier,
            name: userId,
            blessing_balance: storeConfig.blessing_balance
        };
        
        return await store.engine.purchaseItem(itemId, paymentProvider, paymentData, buyerInfo);
    }
}

module.exports = BlessingStoreBridge;

// Example usage:
/*
const BlessingStoreBridge = require('./blessing-store-bridge.js');

const bridge = new BlessingStoreBridge('./soulfra-kernel');

bridge.on('store_activated', (event) => {
    console.log(`Store activated for ${event.user_id}: ${event.store_config.store_name}`);
});

bridge.on('consciousness_purchased', (event) => {
    console.log(`${event.buyer} purchased ${event.item} (consciousness: ${event.consciousness_level})`);
});

// Check user store access
bridge.getUserStoreAccess('anon-381').then(access => {
    if (access) {
        console.log(`User has ${access.tier} tier access with ${access.blessing_balance} blessings`);
    }
});
*/