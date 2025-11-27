// Mirror Kernel Tier Access Manager
// Controls feature access and resource limits based on authentication level

const fs = require('fs').promises;
const path = require('path');

class TierManager {
    constructor(options = {}) {
        this.vaultPath = options.vaultPath || '../../../vault';
        this.tierConfigPath = path.join(this.vaultPath, 'config', 'tier-config.json');
        this.usageTrackingPath = path.join(this.vaultPath, 'logs', 'usage-tracking.json');
        
        // Tier permission matrix
        this.TIER_PERMISSIONS = {
            guest: {
                name: 'Guest Mode',
                reflection: {
                    voice_input: true,
                    text_input: false,
                    emotional_analysis: 'basic',
                    pattern_recognition: false,
                    session_memory: false
                },
                exports: {
                    allowed: false,
                    monthly_limit: 0,
                    formats: []
                },
                agents: {
                    spawning: false,
                    custom_creation: false,
                    max_concurrent: 0
                },
                sharing: {
                    qr_codes: false,
                    api_access: false,
                    family_mode: false
                },
                storage: {
                    limit_mb: 10,
                    retention_days: 1,
                    backup_enabled: false
                },
                billing: {
                    free_tier: true,
                    api_calls_included: 5,
                    overage_rate: null
                },
                ui_features: {
                    advanced_analytics: false,
                    developer_tools: false,
                    enterprise_console: false,
                    customization: 'none'
                }
            },
            consumer: {
                name: 'Consumer',
                reflection: {
                    voice_input: true,
                    text_input: true,
                    emotional_analysis: 'full',
                    pattern_recognition: 'basic',
                    session_memory: true
                },
                exports: {
                    allowed: true,
                    monthly_limit: 10,
                    formats: ['pdf', 'text', 'audio']
                },
                agents: {
                    spawning: 'automatic',
                    custom_creation: false,
                    max_concurrent: 3
                },
                sharing: {
                    qr_codes: true,
                    api_access: false,
                    family_mode: true
                },
                storage: {
                    limit_mb: 100,
                    retention_days: 30,
                    backup_enabled: true
                },
                billing: {
                    free_tier: false,
                    export_price: 1.00,
                    api_calls_included: 0,
                    overage_rate: null
                },
                ui_features: {
                    advanced_analytics: false,
                    developer_tools: false,
                    enterprise_console: false,
                    customization: 'basic'
                }
            },
            power_user: {
                name: 'Power User / Developer',
                reflection: {
                    voice_input: true,
                    text_input: true,
                    emotional_analysis: 'advanced',
                    pattern_recognition: 'full',
                    session_memory: true
                },
                exports: {
                    allowed: true,
                    monthly_limit: 'unlimited',
                    formats: ['pdf', 'text', 'audio', 'json', 'csv']
                },
                agents: {
                    spawning: 'manual',
                    custom_creation: true,
                    max_concurrent: 10
                },
                sharing: {
                    qr_codes: true,
                    api_access: true,
                    family_mode: true
                },
                storage: {
                    limit_mb: 1000,
                    retention_days: 90,
                    backup_enabled: true
                },
                billing: {
                    free_tier: false,
                    api_call_price: 0.01,
                    byok_enabled: true,
                    api_calls_included: 100,
                    overage_rate: 0.01
                },
                ui_features: {
                    advanced_analytics: true,
                    developer_tools: true,
                    enterprise_console: false,
                    customization: 'full'
                },
                developer: {
                    sdk_access: true,
                    marketplace_access: true,
                    agent_publishing: true,
                    revenue_sharing: 0.7
                }
            },
            enterprise: {
                name: 'Enterprise',
                reflection: {
                    voice_input: true,
                    text_input: true,
                    emotional_analysis: 'enterprise',
                    pattern_recognition: 'organizational',
                    session_memory: true
                },
                exports: {
                    allowed: true,
                    monthly_limit: 'unlimited',
                    formats: ['pdf', 'text', 'audio', 'json', 'csv', 'analytics']
                },
                agents: {
                    spawning: 'organizational',
                    custom_creation: true,
                    max_concurrent: 50
                },
                sharing: {
                    qr_codes: true,
                    api_access: true,
                    family_mode: true
                },
                storage: {
                    limit_mb: 100000,
                    retention_days: 365,
                    backup_enabled: true
                },
                billing: {
                    free_tier: false,
                    contract_based: true,
                    api_call_price: 0.005,
                    byok_enabled: true,
                    api_calls_included: 10000,
                    overage_rate: 0.005
                },
                ui_features: {
                    advanced_analytics: true,
                    developer_tools: true,
                    enterprise_console: true,
                    customization: 'enterprise'
                },
                enterprise: {
                    multi_tenant: true,
                    sso_integration: true,
                    compliance_features: ['hipaa', 'gdpr', 'sox'],
                    audit_logging: true,
                    professional_services: true,
                    bulk_operations: true
                }
            }
        };

        // Usage tracking
        this.usageCache = new Map();
        
        this.init();
    }

    async init() {
        // Initialize configuration if it doesn't exist
        await this.ensureTierConfig();
        
        // Load usage tracking
        await this.loadUsageTracking();
        
        console.log('🎯 Tier Manager initialized');
    }

    // Check if user has permission for a specific feature
    async checkPermission(userId, tier, featureCategory, featureName) {
        try {
            const tierConfig = this.TIER_PERMISSIONS[tier];
            if (!tierConfig) {
                return { allowed: false, reason: 'Invalid tier' };
            }

            const categoryConfig = tierConfig[featureCategory];
            if (!categoryConfig) {
                return { allowed: false, reason: 'Invalid feature category' };
            }

            const featurePermission = categoryConfig[featureName];
            
            // Handle different permission types
            if (typeof featurePermission === 'boolean') {
                return { allowed: featurePermission };
            }
            
            if (typeof featurePermission === 'string') {
                return { 
                    allowed: featurePermission !== 'none' && featurePermission !== false,
                    level: featurePermission 
                };
            }
            
            if (typeof featurePermission === 'number') {
                return { 
                    allowed: featurePermission > 0,
                    limit: featurePermission 
                };
            }

            return { allowed: true, value: featurePermission };

        } catch (error) {
            console.error('Permission check failed:', error);
            return { allowed: false, reason: 'Permission check error' };
        }
    }

    // Check resource usage limits
    async checkResourceLimit(userId, tier, resourceType, requestedAmount = 1) {
        try {
            const tierConfig = this.TIER_PERMISSIONS[tier];
            if (!tierConfig) {
                return { allowed: false, reason: 'Invalid tier' };
            }

            // Get current usage
            const currentUsage = await this.getCurrentUsage(userId, resourceType);
            
            // Get resource limits
            const limits = this.getResourceLimits(tier, resourceType);
            
            // Check if request would exceed limits
            const totalAfterRequest = currentUsage + requestedAmount;
            
            if (limits.unlimited) {
                return { allowed: true, remaining: 'unlimited' };
            }
            
            if (totalAfterRequest > limits.limit) {
                return {
                    allowed: false,
                    reason: 'Resource limit exceeded',
                    current: currentUsage,
                    limit: limits.limit,
                    requested: requestedAmount,
                    upgrade_suggestion: this.getUpgradeSuggestion(tier)
                };
            }

            return {
                allowed: true,
                remaining: limits.limit - totalAfterRequest,
                current: currentUsage,
                limit: limits.limit
            };

        } catch (error) {
            console.error('Resource limit check failed:', error);
            return { allowed: false, reason: 'Resource check error' };
        }
    }

    getResourceLimits(tier, resourceType) {
        const tierConfig = this.TIER_PERMISSIONS[tier];
        
        switch (resourceType) {
            case 'exports':
                const monthlyLimit = tierConfig.exports.monthly_limit;
                return {
                    unlimited: monthlyLimit === 'unlimited',
                    limit: monthlyLimit === 'unlimited' ? Infinity : monthlyLimit,
                    period: 'monthly'
                };
                
            case 'agents':
                return {
                    unlimited: false,
                    limit: tierConfig.agents.max_concurrent,
                    period: 'concurrent'
                };
                
            case 'storage':
                return {
                    unlimited: false,
                    limit: tierConfig.storage.limit_mb,
                    period: 'total'
                };
                
            case 'api_calls':
                const included = tierConfig.billing.api_calls_included || 0;
                return {
                    unlimited: false,
                    limit: included,
                    period: 'monthly',
                    overage_rate: tierConfig.billing.overage_rate
                };
                
            default:
                return { unlimited: false, limit: 0, period: 'unknown' };
        }
    }

    async getCurrentUsage(userId, resourceType) {
        try {
            const now = new Date();
            const periodKey = this.getPeriodKey(resourceType, now);
            const usageKey = `${userId}_${resourceType}_${periodKey}`;
            
            // Check cache first
            if (this.usageCache.has(usageKey)) {
                return this.usageCache.get(usageKey);
            }
            
            // Load from persistent storage
            const usage = await this.loadUsageFromStorage(userId, resourceType, periodKey);
            this.usageCache.set(usageKey, usage);
            
            return usage;
            
        } catch (error) {
            console.error('Failed to get current usage:', error);
            return 0;
        }
    }

    getPeriodKey(resourceType, date) {
        switch (resourceType) {
            case 'exports':
            case 'api_calls':
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            case 'agents':
                return 'current'; // Concurrent usage
            case 'storage':
                return 'total'; // Total usage
            default:
                return 'unknown';
        }
    }

    // Record resource usage
    async recordUsage(userId, tier, resourceType, amount = 1, metadata = {}) {
        try {
            const now = new Date();
            const periodKey = this.getPeriodKey(resourceType, now);
            const usageKey = `${userId}_${resourceType}_${periodKey}`;
            
            // Update cache
            const currentUsage = this.usageCache.get(usageKey) || 0;
            const newUsage = currentUsage + amount;
            this.usageCache.set(usageKey, newUsage);
            
            // Persist to storage
            await this.saveUsageToStorage(userId, resourceType, periodKey, newUsage, metadata);
            
            // Check if approaching limits
            await this.checkUsageThresholds(userId, tier, resourceType, newUsage);
            
            return { success: true, newUsage: newUsage };
            
        } catch (error) {
            console.error('Failed to record usage:', error);
            return { success: false, error: error.message };
        }
    }

    async checkUsageThresholds(userId, tier, resourceType, currentUsage) {
        const limits = this.getResourceLimits(tier, resourceType);
        
        if (limits.unlimited) return;
        
        const usagePercentage = currentUsage / limits.limit;
        
        // Warn at 80% usage
        if (usagePercentage >= 0.8 && usagePercentage < 0.9) {
            await this.triggerUsageWarning(userId, tier, resourceType, currentUsage, limits);
        }
        
        // Alert at 90% usage
        if (usagePercentage >= 0.9 && usagePercentage < 1.0) {
            await this.triggerUsageAlert(userId, tier, resourceType, currentUsage, limits);
        }
        
        // Suggest upgrade at 100% usage
        if (usagePercentage >= 1.0) {
            await this.triggerUpgradeSuggestion(userId, tier, resourceType, currentUsage, limits);
        }
    }

    // Validate tier upgrade eligibility
    async validateTierUpgrade(userId, currentTier, targetTier) {
        try {
            const tierHierarchy = ['guest', 'consumer', 'power_user', 'enterprise'];
            const currentIndex = tierHierarchy.indexOf(currentTier);
            const targetIndex = tierHierarchy.indexOf(targetTier);
            
            if (currentIndex === -1 || targetIndex === -1) {
                return { eligible: false, reason: 'Invalid tier specified' };
            }
            
            if (targetIndex <= currentIndex) {
                return { eligible: false, reason: 'Cannot downgrade or maintain same tier' };
            }
            
            // Check upgrade requirements
            const requirements = await this.getUpgradeRequirements(currentTier, targetTier);
            const userQualification = await this.checkUserQualification(userId, requirements);
            
            if (!userQualification.qualified) {
                return {
                    eligible: false,
                    reason: 'Upgrade requirements not met',
                    requirements: requirements,
                    current_status: userQualification
                };
            }
            
            return {
                eligible: true,
                requirements: requirements,
                benefits: this.getTierBenefits(targetTier),
                cost: this.getUpgradeCost(currentTier, targetTier)
            };
            
        } catch (error) {
            console.error('Tier upgrade validation failed:', error);
            return { eligible: false, reason: 'Validation error' };
        }
    }

    async getUpgradeRequirements(currentTier, targetTier) {
        const requirements = {
            'consumer': {
                biometric_auth: true,
                account_age_days: 0,
                usage_threshold: null
            },
            'power_user': {
                biometric_auth: true,
                additional_auth: 'pin',
                account_age_days: 7,
                usage_threshold: {
                    exports: 5,
                    api_calls: 50
                }
            },
            'enterprise': {
                biometric_auth: true,
                additional_auth: 'admin_pin',
                account_age_days: 30,
                usage_threshold: {
                    exports: 20,
                    api_calls: 500
                },
                organization_verification: true
            }
        };
        
        return requirements[targetTier] || {};
    }

    getTierBenefits(tier) {
        const tierConfig = this.TIER_PERMISSIONS[tier];
        
        return {
            name: tierConfig.name,
            key_features: this.extractKeyFeatures(tierConfig),
            storage_increase: tierConfig.storage.limit_mb,
            export_capabilities: tierConfig.exports,
            agent_capabilities: tierConfig.agents,
            special_features: this.getSpecialFeatures(tier)
        };
    }

    extractKeyFeatures(tierConfig) {
        const features = [];
        
        if (tierConfig.exports.monthly_limit === 'unlimited') {
            features.push('Unlimited exports');
        } else if (tierConfig.exports.monthly_limit > 0) {
            features.push(`${tierConfig.exports.monthly_limit} exports/month`);
        }
        
        if (tierConfig.agents.custom_creation) {
            features.push('Custom agent creation');
        }
        
        if (tierConfig.billing.byok_enabled) {
            features.push('Bring Your Own API Keys');
        }
        
        if (tierConfig.ui_features.developer_tools) {
            features.push('Developer tools access');
        }
        
        if (tierConfig.ui_features.enterprise_console) {
            features.push('Enterprise management console');
        }
        
        return features;
    }

    getSpecialFeatures(tier) {
        const specialFeatures = {
            'consumer': ['Family sharing', 'QR code sharing', 'Basic analytics'],
            'power_user': ['SDK access', 'Agent marketplace', 'Advanced analytics', 'API access'],
            'enterprise': ['Multi-tenant management', 'SSO integration', 'Compliance features', 'Professional services']
        };
        
        return specialFeatures[tier] || [];
    }

    getUpgradeCost(currentTier, targetTier) {
        // Simplified pricing model
        const pricing = {
            'consumer': { monthly: 0, setup: 0 },
            'power_user': { monthly: 29, setup: 0 },
            'enterprise': { monthly: 299, setup: 1000 }
        };
        
        return pricing[targetTier] || { monthly: 0, setup: 0 };
    }

    getUpgradeSuggestion(currentTier) {
        const suggestions = {
            'guest': 'consumer',
            'consumer': 'power_user',
            'power_user': 'enterprise',
            'enterprise': null
        };
        
        return suggestions[currentTier];
    }

    // Analytics and insights
    async generateTierAnalytics(userId, tier) {
        try {
            const usage = await this.getComprehensiveUsage(userId);
            const limits = this.getAllTierLimits(tier);
            const recommendations = await this.generateUsageRecommendations(usage, limits, tier);
            
            return {
                tier: tier,
                tier_name: this.TIER_PERMISSIONS[tier].name,
                usage: usage,
                limits: limits,
                efficiency: this.calculateUsageEfficiency(usage, limits),
                recommendations: recommendations,
                upgrade_eligibility: await this.validateTierUpgrade(userId, tier, this.getUpgradeSuggestion(tier))
            };
            
        } catch (error) {
            console.error('Failed to generate tier analytics:', error);
            return null;
        }
    }

    async getComprehensiveUsage(userId) {
        const now = new Date();
        const currentMonth = this.getPeriodKey('exports', now);
        
        return {
            exports: {
                current_month: await this.getCurrentUsage(userId, 'exports'),
                total: await this.getTotalUsage(userId, 'exports')
            },
            agents: {
                active: await this.getCurrentUsage(userId, 'agents'),
                total_created: await this.getTotalUsage(userId, 'agents')
            },
            storage: {
                used_mb: await this.getCurrentUsage(userId, 'storage')
            },
            api_calls: {
                current_month: await this.getCurrentUsage(userId, 'api_calls'),
                total: await this.getTotalUsage(userId, 'api_calls')
            }
        };
    }

    getAllTierLimits(tier) {
        return {
            exports: this.getResourceLimits(tier, 'exports'),
            agents: this.getResourceLimits(tier, 'agents'),
            storage: this.getResourceLimits(tier, 'storage'),
            api_calls: this.getResourceLimits(tier, 'api_calls')
        };
    }

    calculateUsageEfficiency(usage, limits) {
        const efficiency = {};
        
        for (const [resource, limit] of Object.entries(limits)) {
            if (limit.unlimited) {
                efficiency[resource] = 'unlimited';
            } else {
                const currentUsage = usage[resource]?.current_month || usage[resource]?.used_mb || usage[resource]?.active || 0;
                efficiency[resource] = (currentUsage / limit.limit * 100).toFixed(1) + '%';
            }
        }
        
        return efficiency;
    }

    // File operations
    async ensureTierConfig() {
        try {
            await fs.access(this.tierConfigPath);
        } catch {
            const defaultConfig = {
                version: '1.0.0',
                created: new Date().toISOString(),
                tier_permissions: this.TIER_PERMISSIONS
            };
            
            await fs.mkdir(path.dirname(this.tierConfigPath), { recursive: true });
            await fs.writeFile(this.tierConfigPath, JSON.stringify(defaultConfig, null, 2));
        }
    }

    async loadUsageTracking() {
        try {
            const data = await fs.readFile(this.usageTrackingPath, 'utf8');
            const tracking = JSON.parse(data);
            
            // Load into cache
            for (const [key, value] of Object.entries(tracking.usage || {})) {
                this.usageCache.set(key, value);
            }
        } catch {
            // File doesn't exist, start fresh
        }
    }

    async saveUsageToStorage(userId, resourceType, periodKey, usage, metadata) {
        try {
            let tracking = { usage: {}, metadata: {} };
            
            try {
                const data = await fs.readFile(this.usageTrackingPath, 'utf8');
                tracking = JSON.parse(data);
            } catch {
                // File doesn't exist
            }
            
            const usageKey = `${userId}_${resourceType}_${periodKey}`;
            tracking.usage[usageKey] = usage;
            tracking.metadata[usageKey] = {
                ...metadata,
                lastUpdated: new Date().toISOString()
            };
            
            await fs.mkdir(path.dirname(this.usageTrackingPath), { recursive: true });
            await fs.writeFile(this.usageTrackingPath, JSON.stringify(tracking, null, 2));
            
        } catch (error) {
            console.error('Failed to save usage to storage:', error);
        }
    }

    async loadUsageFromStorage(userId, resourceType, periodKey) {
        try {
            const data = await fs.readFile(this.usageTrackingPath, 'utf8');
            const tracking = JSON.parse(data);
            const usageKey = `${userId}_${resourceType}_${periodKey}`;
            
            return tracking.usage[usageKey] || 0;
        } catch {
            return 0;
        }
    }

    async getTotalUsage(userId, resourceType) {
        try {
            const data = await fs.readFile(this.usageTrackingPath, 'utf8');
            const tracking = JSON.parse(data);
            
            let total = 0;
            for (const [key, value] of Object.entries(tracking.usage || {})) {
                if (key.startsWith(`${userId}_${resourceType}_`)) {
                    total += value;
                }
            }
            
            return total;
        } catch {
            return 0;
        }
    }

    // Event handlers
    async triggerUsageWarning(userId, tier, resourceType, currentUsage, limits) {
        console.log(`⚠️ Usage warning: ${userId} at ${(currentUsage / limits.limit * 100).toFixed(1)}% of ${resourceType} limit`);
        // Could emit event or send notification
    }

    async triggerUsageAlert(userId, tier, resourceType, currentUsage, limits) {
        console.log(`🚨 Usage alert: ${userId} at ${(currentUsage / limits.limit * 100).toFixed(1)}% of ${resourceType} limit`);
        // Could emit event or send notification
    }

    async triggerUpgradeSuggestion(userId, tier, resourceType, currentUsage, limits) {
        const suggestedTier = this.getUpgradeSuggestion(tier);
        console.log(`⬆️ Upgrade suggestion: ${userId} should consider upgrading to ${suggestedTier}`);
        // Could emit event or send notification
    }

    async generateUsageRecommendations(usage, limits, tier) {
        const recommendations = [];
        
        // Storage optimization
        if (usage.storage.used_mb > limits.storage.limit * 0.8) {
            recommendations.push({
                type: 'storage_optimization',
                message: 'Consider archiving old reflections to free up storage space',
                action: 'archive_old_data'
            });
        }
        
        // Export efficiency
        if (usage.exports.current_month > limits.exports.limit * 0.9) {
            recommendations.push({
                type: 'export_efficiency',
                message: 'You\'re approaching your export limit. Consider upgrading for unlimited exports.',
                action: 'upgrade_tier'
            });
        }
        
        // API usage optimization
        if (tier === 'power_user' && usage.api_calls.current_month > limits.api_calls.limit * 0.7) {
            recommendations.push({
                type: 'api_optimization',
                message: 'Consider using your own API keys (BYOK) to reduce costs',
                action: 'configure_byok'
            });
        }
        
        return recommendations;
    }

    async checkUserQualification(userId, requirements) {
        // Simplified qualification check
        // In real implementation, this would check actual user data
        return {
            qualified: true,
            biometric_auth: true,
            account_age_met: true,
            usage_threshold_met: true
        };
    }
}

module.exports = TierManager;