const fs = require('fs').promises;
const path = require('path');
const APIKeyRouter = require('./api-key-router');

class PlatformTierManager {
    constructor() {
        this.apiRouter = new APIKeyRouter();
        this.tierConfig = {
            surface: {
                name: "Surface Web",
                depth: 0,
                access: "public",
                features: ["basic-templates", "simple-agents"],
                routing: "direct"
            },
            mesh: {
                name: "Mesh Interface",
                depth: -1,
                access: "authenticated",
                features: ["api-keys", "agent-builder", "reflection-basic"],
                routing: "mesh-shield"
            },
            platform: {
                name: "Platform Wrapper",
                depth: -2,
                access: "verified",
                features: ["custom-agents", "vault-read", "monetization"],
                routing: "platform-wrapper"
            },
            llm: {
                name: "LLM Router",
                depth: -3,
                access: "trusted",
                features: ["multi-llm", "fallback-chain", "session-memory"],
                routing: "llm-router"
            },
            reasoning: {
                name: "Reasoning Kernel",
                depth: -4,
                access: "sovereign",
                features: ["deep-reasoning", "memory-injection", "recursive-reflection"],
                routing: "cal-kernel"
            },
            vault: {
                name: "Mirror Vault",
                depth: -10,
                access: "root",
                features: ["full-control", "weight-modification", "system-override"],
                routing: "direct-vault"
            }
        };
        
        this.userTiers = {};
        this.tierTransitions = [];
    }

    async initialize() {
        await this.apiRouter.initialize();
        await this.loadUserTiers();
        await this.setupTierWatchers();
    }

    async loadUserTiers() {
        const tierPath = path.join(__dirname, 'user-configs/tier-assignments.json');
        
        try {
            const data = await fs.readFile(tierPath, 'utf8');
            this.userTiers = JSON.parse(data);
        } catch (error) {
            this.userTiers = {
                anonymous: { tier: "surface", since: Date.now() },
                authenticated: { tier: "mesh", since: Date.now() }
            };
            await this.saveUserTiers();
        }
    }

    async saveUserTiers() {
        const tierPath = path.join(__dirname, 'user-configs/tier-assignments.json');
        await fs.writeFile(tierPath, JSON.stringify(this.userTiers, null, 2));
    }

    async getUserTier(userId, apiKey = null, agentSig = null) {
        // Check explicit tier assignment
        if (this.userTiers[userId]) {
            return this.userTiers[userId].tier;
        }

        // Determine tier based on credentials
        if (!userId || userId === 'anonymous') {
            return 'surface';
        }

        if (apiKey) {
            // Has API key = at least mesh tier
            const apiTier = await this.apiRouter.getUserTier(userId);
            
            if (apiTier === 'premium' && agentSig) {
                // Premium + agent signature = platform tier
                return 'platform';
            }
            
            return 'mesh';
        }

        // Default authenticated user
        return 'mesh';
    }

    async routeRequest(userId, request) {
        const tier = await this.getUserTier(userId, request.apiKey, request.agentSig);
        const tierInfo = this.tierConfig[tier];
        
        // Log tier transition
        await this.logTierTransition(userId, tier, request);

        // Check feature access
        const requestedFeature = request.feature || 'basic-templates';
        if (!tierInfo.features.includes(requestedFeature)) {
            return {
                success: false,
                error: `Feature '${requestedFeature}' not available at ${tierInfo.name} tier`,
                currentTier: tier,
                availableFeatures: tierInfo.features,
                upgradePath: this.getUpgradePath(tier, requestedFeature)
            };
        }

        // Route through appropriate layer
        const route = await this.determineRoute(tier, request);
        
        return {
            success: true,
            tier: tier,
            tierName: tierInfo.name,
            depth: tierInfo.depth,
            route: route,
            features: tierInfo.features,
            metadata: {
                userId: userId,
                timestamp: Date.now(),
                reflected: tier !== 'surface'
            }
        };
    }

    async determineRoute(tier, request) {
        const tierInfo = this.tierConfig[tier];
        const baseRoute = {
            tier: tier,
            routing: tierInfo.routing,
            path: []
        };

        // Build routing path based on tier depth
        switch(tier) {
            case 'surface':
                baseRoute.path = ['template-reflection'];
                break;
                
            case 'mesh':
                baseRoute.path = ['fake-mesh-interface', 'mesh-shield'];
                break;
                
            case 'platform':
                baseRoute.path = ['fake-mesh-interface', 'user-platform-wrapper', 'tier-minus3/llm-router'];
                break;
                
            case 'llm':
                baseRoute.path = ['tier-minus3/llm-router', 'tier-minus4/cal-reasoning-kernel'];
                break;
                
            case 'reasoning':
                baseRoute.path = ['tier-minus4/cal-reasoning-kernel', 'tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault'];
                break;
                
            case 'vault':
                baseRoute.path = ['tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault'];
                baseRoute.warning = "Direct vault access - all actions logged";
                break;
        }

        // Add reflection requirement
        if (tier !== 'surface') {
            baseRoute.requiresReflection = true;
            baseRoute.vaultBinding = '../tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault';
        }

        return baseRoute;
    }

    getUpgradePath(currentTier, requestedFeature) {
        // Find which tier has the requested feature
        let targetTier = null;
        for (const [tierName, tierInfo] of Object.entries(this.tierConfig)) {
            if (tierInfo.features.includes(requestedFeature)) {
                targetTier = tierName;
                break;
            }
        }

        if (!targetTier) {
            return { available: false, feature: requestedFeature };
        }

        const currentDepth = this.tierConfig[currentTier].depth;
        const targetDepth = this.tierConfig[targetTier].depth;

        return {
            available: true,
            currentTier: currentTier,
            targetTier: targetTier,
            depthChange: targetDepth - currentDepth,
            requirements: this.getUpgradeRequirements(currentTier, targetTier)
        };
    }

    getUpgradeRequirements(fromTier, toTier) {
        const requirements = [];

        if (fromTier === 'surface' && toTier === 'mesh') {
            requirements.push('Create account', 'Provide API key');
        } else if (fromTier === 'mesh' && toTier === 'platform') {
            requirements.push('Upgrade to premium', 'Provide agent signature');
        } else if (toTier === 'reasoning' || toTier === 'vault') {
            requirements.push('System administrator approval', 'Sovereign access grant');
        }

        return requirements;
    }

    async logTierTransition(userId, tier, request) {
        const transition = {
            timestamp: Date.now(),
            userId: userId,
            tier: tier,
            feature: request.feature,
            hasApiKey: !!request.apiKey,
            hasAgentSig: !!request.agentSig
        };

        this.tierTransitions.push(transition);

        // Keep last 1000 transitions
        if (this.tierTransitions.length > 1000) {
            this.tierTransitions = this.tierTransitions.slice(-1000);
        }

        // Log to file
        const logPath = path.join(__dirname, '../vault-sync-core/logs/tier-transitions.log');
        const logEntry = `${JSON.stringify(transition)}\n`;
        
        try {
            await fs.appendFile(logPath, logEntry);
        } catch (error) {
            // Log directory might not exist
        }
    }

    async setupTierWatchers() {
        // Watch for changes in user tier assignments
        const { watch } = require('fs');
        const configPath = path.join(__dirname, 'user-configs');

        try {
            watch(configPath, { recursive: true }, async (eventType, filename) => {
                if (filename && filename.includes('tier-assignments')) {
                    await this.loadUserTiers();
                    console.log('🔄 Reloaded tier assignments');
                }
            });
        } catch (error) {
            // Directory might not exist yet
        }
    }

    async promoteTier(userId, newTier, authorization = null) {
        const validTiers = Object.keys(this.tierConfig);
        if (!validTiers.includes(newTier)) {
            return { success: false, error: "Invalid tier" };
        }

        const tierInfo = this.tierConfig[newTier];
        
        // Check authorization for restricted tiers
        if (tierInfo.depth <= -3 && !this.isAuthorized(authorization)) {
            return { 
                success: false, 
                error: "Insufficient authorization for tier promotion",
                required: "sovereign-grant"
            };
        }

        // Update user tier
        this.userTiers[userId] = {
            tier: newTier,
            since: Date.now(),
            promotedBy: authorization?.grantedBy || 'system'
        };

        await this.saveUserTiers();
        await this.logTierTransition(userId, newTier, { 
            feature: 'tier-promotion',
            authorization: !!authorization 
        });

        return {
            success: true,
            userId: userId,
            newTier: newTier,
            tierInfo: tierInfo,
            effectiveImmediately: true
        };
    }

    isAuthorized(authorization) {
        if (!authorization) return false;
        
        // Check for valid sovereign grant
        const validGrants = ['cal-riven', 'system-root', 'founder-key'];
        return validGrants.includes(authorization.type) && 
               authorization.signature && 
               authorization.timestamp > Date.now() - 86400000; // 24 hours
    }

    async getTierStats() {
        const stats = {
            userDistribution: {},
            transitionCount: this.tierTransitions.length,
            lastTransition: this.tierTransitions[this.tierTransitions.length - 1],
            totalUsers: Object.keys(this.userTiers).length
        };

        // Count users per tier
        for (const [userId, userInfo] of Object.entries(this.userTiers)) {
            const tier = userInfo.tier;
            stats.userDistribution[tier] = (stats.userDistribution[tier] || 0) + 1;
        }

        return stats;
    }
}

module.exports = PlatformTierManager;