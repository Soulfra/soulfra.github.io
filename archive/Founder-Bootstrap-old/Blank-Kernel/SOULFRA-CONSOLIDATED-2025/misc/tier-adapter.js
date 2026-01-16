// Agent Zero Tier Adapter - Maps Agent Zero capabilities to biometric authentication tiers
// Integrates with existing Agent Zero (Domingo) system and biometric authentication

const BiometricMirrorAuth = require('../biometric/biometric-auth');
const TierManager = require('../biometric/tier-manager');

class AgentZeroTierAdapter {
    constructor(options = {}) {
        this.biometricAuth = options.biometricAuth || new BiometricMirrorAuth();
        this.tierManager = options.tierManager || new TierManager();
        this.capabilityMatrix = this.initializeCapabilityMatrix();
        this.actionHistory = new Map();
        this.approvalCache = new Map();
    }

    async getTierCapabilities(userId, biometricToken) {
        try {
            // Verify user authentication and get current tier
            const authResult = await this.biometricAuth.validateSession(userId, biometricToken);
            if (!authResult.valid) {
                throw new Error('Invalid biometric authentication');
            }

            const userTier = authResult.tier;
            const baseCapabilities = this.capabilityMatrix[userTier];
            
            // Get usage history for dynamic adjustments
            const usageHistory = await this.tierManager.getCurrentUsage(userId, 'agent_actions');
            const adjustedCapabilities = await this.adjustCapabilitiesForUsage(baseCapabilities, usageHistory, userId);
            
            return {
                tier: userTier,
                autonomy_level: adjustedCapabilities.autonomy_level,
                actions_permitted: adjustedCapabilities.actions_permitted,
                spending_limit: adjustedCapabilities.spending_limit,
                approval_thresholds: adjustedCapabilities.approval_thresholds,
                api_access: adjustedCapabilities.api_access,
                integration_permissions: adjustedCapabilities.integration_permissions,
                session_id: authResult.session?.sessionId,
                valid_until: Date.now() + (60 * 60 * 1000) // 1 hour
            };
        } catch (error) {
            console.error('Failed to get tier capabilities:', error);
            throw new Error(`Tier capability lookup failed: ${error.message}`);
        }
    }

    initializeCapabilityMatrix() {
        return {
            guest: {
                autonomy_level: 0.1,
                actions_permitted: [
                    'reflection_analysis',
                    'basic_suggestions', 
                    'demo_agent_creation',
                    'simple_pattern_recognition'
                ],
                spending_limit: 0,
                approval_thresholds: {
                    all_actions: true,
                    spending: 0,
                    external_apis: false,
                    data_access: 'reflection_only'
                },
                api_access: [],
                integration_permissions: ['read_reflections'],
                session_duration: 24 * 60 * 60 * 1000, // 24 hours
                max_daily_actions: 10
            },
            consumer: {
                autonomy_level: 0.4,
                actions_permitted: [
                    'reflection_analysis',
                    'pattern_recognition',
                    'basic_agent_spawning',
                    'simple_automations',
                    'qr_sharing',
                    'emotional_insight_generation',
                    'basic_workflow_suggestions'
                ],
                spending_limit: 25,
                approval_thresholds: {
                    spending_over: 5,
                    new_integrations: true,
                    data_sharing: true,
                    agent_creation: false
                },
                api_access: ['basic_llm', 'voice_processing', 'emotion_analysis'],
                integration_permissions: ['read_reflections', 'create_agents', 'export_data'],
                session_duration: 7 * 24 * 60 * 60 * 1000, // 7 days
                max_daily_actions: 50
            },
            power_user: {
                autonomy_level: 0.7,
                actions_permitted: [
                    'advanced_pattern_analysis',
                    'custom_agent_creation',
                    'workflow_automation',
                    'api_integrations',
                    'marketplace_publishing',
                    'data_pipeline_automation',
                    'advanced_reflection_processing'
                ],
                spending_limit: 1000,
                approval_thresholds: {
                    spending_over: 100,
                    new_integrations: false,
                    high_risk_actions: true,
                    enterprise_features: true
                },
                api_access: ['premium_llm', 'cloud_services', 'external_apis', 'advanced_analytics'],
                integration_permissions: ['full_vault_access', 'agent_marketplace', 'sdk_access', 'api_development'],
                session_duration: 30 * 24 * 60 * 60 * 1000, // 30 days
                max_daily_actions: 500
            },
            enterprise: {
                autonomy_level: 0.9,
                actions_permitted: [
                    'organizational_automation',
                    'team_agent_management',
                    'bulk_operations',
                    'compliance_reporting',
                    'custom_workflows',
                    'enterprise_integrations',
                    'advanced_security_operations'
                ],
                spending_limit: 10000,
                approval_thresholds: {
                    configurable: true,
                    compliance_actions: 'per_org_policy',
                    financial_actions: 'per_org_rules',
                    bulk_operations: true
                },
                api_access: ['enterprise_apis', 'custom_models', 'unlimited_processing', 'advanced_security'],
                integration_permissions: ['organization_management', 'compliance_controls', 'audit_access', 'enterprise_automation'],
                session_duration: 90 * 24 * 60 * 60 * 1000, // 90 days
                max_daily_actions: 5000
            }
        };
    }

    async adjustCapabilitiesForUsage(baseCapabilities, usageHistory, userId) {
        const adjustedCapabilities = { ...baseCapabilities };
        
        // Adjust autonomy level based on successful action history
        const successRate = await this.calculateUserSuccessRate(userId);
        if (successRate > 0.9) {
            adjustedCapabilities.autonomy_level = Math.min(baseCapabilities.autonomy_level + 0.1, 1.0);
        } else if (successRate < 0.7) {
            adjustedCapabilities.autonomy_level = Math.max(baseCapabilities.autonomy_level - 0.1, 0.1);
        }

        // Adjust spending limits based on usage patterns
        if (usageHistory.responsible_spending_track_record) {
            adjustedCapabilities.spending_limit *= 1.2;
        }

        // Adjust daily action limits based on usage efficiency
        const actionEfficiency = await this.calculateActionEfficiency(userId);
        if (actionEfficiency > 0.8) {
            adjustedCapabilities.max_daily_actions *= 1.5;
        }

        return adjustedCapabilities;
    }

    async calculateUserSuccessRate(userId) {
        try {
            const history = this.actionHistory.get(userId) || [];
            if (history.length === 0) return 0.8; // Default for new users
            
            const successfulActions = history.filter(action => action.status === 'completed' && action.user_satisfaction > 0.7);
            return successfulActions.length / history.length;
        } catch (error) {
            console.error('Failed to calculate success rate:', error);
            return 0.8; // Default fallback
        }
    }

    async calculateActionEfficiency(userId) {
        try {
            const history = this.actionHistory.get(userId) || [];
            if (history.length === 0) return 0.8; // Default for new users
            
            const efficientActions = history.filter(action => 
                action.completion_time < action.estimated_time &&
                action.resource_usage < action.estimated_resources
            );
            return efficientActions.length / history.length;
        } catch (error) {
            console.error('Failed to calculate action efficiency:', error);
            return 0.8; // Default fallback
        }
    }

    async validateActionPermission(userId, action, capabilities) {
        try {
            // Check if action type is permitted for user's tier
            if (!capabilities.actions_permitted.includes(action.type)) {
                return {
                    permitted: false,
                    reason: 'action_not_permitted_for_tier',
                    required_tier: this.getMinimumTierForAction(action.type),
                    current_tier: capabilities.tier,
                    upgrade_suggestion: this.generateUpgradeSuggestion(capabilities.tier)
                };
            }

            // Check spending limits
            if (action.estimated_cost > capabilities.spending_limit) {
                return {
                    permitted: false,
                    reason: 'spending_limit_exceeded',
                    estimated_cost: action.estimated_cost,
                    spending_limit: capabilities.spending_limit,
                    suggestion: 'Consider upgrading tier or reducing action scope'
                };
            }

            // Check daily action limits
            const dailyActionCount = await this.getDailyActionCount(userId);
            if (dailyActionCount >= capabilities.max_daily_actions) {
                return {
                    permitted: false,
                    reason: 'daily_action_limit_exceeded',
                    daily_count: dailyActionCount,
                    daily_limit: capabilities.max_daily_actions,
                    reset_time: this.getNextDailyReset()
                };
            }

            // Check API access permissions
            if (action.requires_api && !this.hasRequiredAPIAccess(action.required_apis, capabilities.api_access)) {
                return {
                    permitted: false,
                    reason: 'insufficient_api_access',
                    required_apis: action.required_apis,
                    available_apis: capabilities.api_access
                };
            }

            return {
                permitted: true,
                autonomy_level: capabilities.autonomy_level,
                requires_approval: this.requiresApproval(action, capabilities),
                estimated_confidence: this.calculateActionConfidence(action, capabilities)
            };

        } catch (error) {
            console.error('Action permission validation failed:', error);
            return {
                permitted: false,
                reason: 'validation_error',
                error: error.message
            };
        }
    }

    requiresApproval(action, capabilities) {
        const thresholds = capabilities.approval_thresholds;
        
        // Check if all actions require approval (guest tier)
        if (thresholds.all_actions === true) {
            return {
                required: true,
                reason: 'guest_tier_requires_all_approvals',
                approval_type: 'user_confirmation'
            };
        }

        // Check spending threshold
        if (action.estimated_cost > thresholds.spending_over) {
            return {
                required: true,
                reason: 'spending_threshold_exceeded',
                approval_type: 'financial_approval',
                threshold: thresholds.spending_over,
                estimated_cost: action.estimated_cost
            };
        }

        // Check for high-risk actions
        if (thresholds.high_risk_actions && action.risk_level === 'high') {
            return {
                required: true,
                reason: 'high_risk_action',
                approval_type: 'risk_assessment_approval',
                risk_factors: action.risk_factors
            };
        }

        // Check for new integrations
        if (thresholds.new_integrations && action.type === 'new_integration') {
            return {
                required: true,
                reason: 'new_integration_approval',
                approval_type: 'integration_review',
                integration_details: action.integration_config
            };
        }

        // Check for data sharing
        if (thresholds.data_sharing && action.involves_data_sharing) {
            return {
                required: true,
                reason: 'data_sharing_approval',
                approval_type: 'privacy_consent',
                data_types: action.data_types_involved
            };
        }

        return { required: false };
    }

    getMinimumTierForAction(actionType) {
        const actionTierMap = {
            'demo_agent_creation': 'guest',
            'basic_agent_spawning': 'consumer',
            'custom_agent_creation': 'power_user',
            'organizational_automation': 'enterprise',
            'advanced_pattern_analysis': 'power_user',
            'compliance_reporting': 'enterprise',
            'api_integrations': 'power_user',
            'marketplace_publishing': 'power_user',
            'team_agent_management': 'enterprise'
        };

        return actionTierMap[actionType] || 'power_user';
    }

    generateUpgradeSuggestion(currentTier) {
        const upgradePaths = {
            'guest': {
                next_tier: 'consumer',
                benefits: ['Save reflections', '$1 exports', 'Agent spawning', 'QR sharing'],
                upgrade_action: 'Enable Face ID authentication'
            },
            'consumer': {
                next_tier: 'power_user',
                benefits: ['Unlimited exports', 'Custom agents', 'API access', 'Developer tools'],
                upgrade_action: 'Add PIN authentication and upgrade to Power User'
            },
            'power_user': {
                next_tier: 'enterprise',
                benefits: ['Team management', 'Compliance features', 'Organizational analytics', 'Professional support'],
                upgrade_action: 'Contact sales for Enterprise upgrade'
            },
            'enterprise': {
                next_tier: null,
                benefits: ['You have the highest tier available'],
                upgrade_action: 'Contact customer success for additional features'
            }
        };

        return upgradePaths[currentTier] || upgradePaths['guest'];
    }

    async getDailyActionCount(userId) {
        try {
            const today = new Date().toDateString();
            const history = this.actionHistory.get(userId) || [];
            return history.filter(action => 
                new Date(action.timestamp).toDateString() === today
            ).length;
        } catch (error) {
            console.error('Failed to get daily action count:', error);
            return 0;
        }
    }

    getNextDailyReset() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        return tomorrow.getTime();
    }

    hasRequiredAPIAccess(requiredAPIs, availableAPIs) {
        return requiredAPIs.every(required => availableAPIs.includes(required));
    }

    calculateActionConfidence(action, capabilities) {
        let confidence = capabilities.autonomy_level;
        
        // Adjust based on action complexity
        if (action.complexity === 'low') confidence += 0.1;
        if (action.complexity === 'high') confidence -= 0.1;
        
        // Adjust based on user's historical success with similar actions
        if (action.similar_action_success_rate) {
            confidence = (confidence + action.similar_action_success_rate) / 2;
        }
        
        return Math.max(0.1, Math.min(1.0, confidence));
    }

    async recordActionAttempt(userId, action, result, capabilities) {
        try {
            const actionRecord = {
                id: this.generateActionId(),
                user_id: userId,
                action_type: action.type,
                action_details: action,
                capabilities_used: capabilities,
                result: result,
                timestamp: Date.now(),
                completion_time: result.execution_time,
                estimated_time: action.estimated_time,
                resource_usage: result.resource_usage,
                estimated_resources: action.estimated_resources,
                user_satisfaction: result.user_satisfaction || null,
                status: result.status
            };

            // Add to user's action history
            if (!this.actionHistory.has(userId)) {
                this.actionHistory.set(userId, []);
            }
            
            const userHistory = this.actionHistory.get(userId);
            userHistory.push(actionRecord);
            
            // Keep only last 1000 actions to prevent memory issues
            if (userHistory.length > 1000) {
                userHistory.shift();
            }

            // Record usage for tier manager
            await this.tierManager.recordUsage(userId, capabilities.tier, 'agent_actions', 1, {
                action_type: action.type,
                success: result.status === 'completed',
                cost: result.actual_cost || 0
            });

            return actionRecord;

        } catch (error) {
            console.error('Failed to record action attempt:', error);
            return null;
        }
    }

    generateActionId() {
        return 'action_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Integration with external Agent Zero (Domingo) system
    async integrateWithDomingo(domingoInstance) {
        this.domingoInstance = domingoInstance;
        
        // Set up tier-aware action filtering
        domingoInstance.setActionFilter(async (action, userId) => {
            const capabilities = await this.getTierCapabilities(userId, action.biometricToken);
            return await this.validateActionPermission(userId, action, capabilities);
        });

        // Set up action recording
        domingoInstance.setActionRecorder(async (userId, action, result) => {
            const capabilities = await this.getTierCapabilities(userId, action.biometricToken);
            return await this.recordActionAttempt(userId, action, result, capabilities);
        });

        console.log('✅ Agent Zero tier adapter integrated with Domingo');
        return true;
    }

    // Get user analytics for tier progression insights
    async getUserTierAnalytics(userId, timeframe = '30d') {
        try {
            const history = this.actionHistory.get(userId) || [];
            const timeframeDays = parseInt(timeframe.replace('d', ''));
            const cutoffTime = Date.now() - (timeframeDays * 24 * 60 * 60 * 1000);
            
            const recentActions = history.filter(action => action.timestamp > cutoffTime);
            
            const analytics = {
                total_actions: recentActions.length,
                success_rate: this.calculateSuccessRate(recentActions),
                action_efficiency: this.calculateEfficiency(recentActions),
                spending_behavior: this.analyzeSpendingBehavior(recentActions),
                feature_usage: this.analyzeFeatureUsage(recentActions),
                tier_readiness: await this.assessTierUpgradeReadiness(userId, recentActions),
                recommendations: await this.generateUserRecommendations(userId, recentActions)
            };

            return analytics;

        } catch (error) {
            console.error('Failed to generate user tier analytics:', error);
            return null;
        }
    }

    calculateSuccessRate(actions) {
        if (actions.length === 0) return 0;
        const successful = actions.filter(action => action.status === 'completed').length;
        return successful / actions.length;
    }

    calculateEfficiency(actions) {
        if (actions.length === 0) return 0;
        const efficient = actions.filter(action => 
            action.completion_time <= action.estimated_time
        ).length;
        return efficient / actions.length;
    }

    analyzeSpendingBehavior(actions) {
        const totalSpent = actions.reduce((sum, action) => sum + (action.result.actual_cost || 0), 0);
        const avgSpending = actions.length > 0 ? totalSpent / actions.length : 0;
        
        return {
            total_spent: totalSpent,
            average_per_action: avgSpending,
            spending_trend: this.calculateSpendingTrend(actions),
            cost_efficiency: this.calculateCostEfficiency(actions)
        };
    }

    calculateSpendingTrend(actions) {
        // Simple trend calculation - compare first half vs second half
        if (actions.length < 4) return 'insufficient_data';
        
        const midpoint = Math.floor(actions.length / 2);
        const firstHalf = actions.slice(0, midpoint);
        const secondHalf = actions.slice(midpoint);
        
        const firstHalfAvg = firstHalf.reduce((sum, a) => sum + (a.result.actual_cost || 0), 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, a) => sum + (a.result.actual_cost || 0), 0) / secondHalf.length;
        
        if (secondHalfAvg > firstHalfAvg * 1.2) return 'increasing';
        if (secondHalfAvg < firstHalfAvg * 0.8) return 'decreasing';
        return 'stable';
    }

    calculateCostEfficiency(actions) {
        if (actions.length === 0) return 0;
        const efficient = actions.filter(action => 
            (action.result.actual_cost || 0) <= (action.estimated_cost || Infinity)
        ).length;
        return efficient / actions.length;
    }

    analyzeFeatureUsage(actions) {
        const featureCount = {};
        actions.forEach(action => {
            featureCount[action.action_type] = (featureCount[action.action_type] || 0) + 1;
        });

        const sortedFeatures = Object.entries(featureCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        return {
            most_used_features: sortedFeatures,
            feature_diversity: Object.keys(featureCount).length,
            usage_concentration: this.calculateUsageConcentration(featureCount)
        };
    }

    calculateUsageConcentration(featureCount) {
        const total = Object.values(featureCount).reduce((sum, count) => sum + count, 0);
        const topFeatureUsage = Math.max(...Object.values(featureCount));
        return topFeatureUsage / total; // How concentrated usage is on top feature
    }

    async assessTierUpgradeReadiness(userId, recentActions) {
        const currentCapabilities = await this.getTierCapabilities(userId, 'cached');
        const currentTier = currentCapabilities.tier;
        const nextTier = this.getNextTier(currentTier);
        
        if (!nextTier) {
            return { ready: false, reason: 'already_at_highest_tier' };
        }

        const readinessFactors = {
            usage_frequency: this.assessUsageFrequency(recentActions),
            feature_exploration: this.assessFeatureExploration(recentActions, currentTier),
            success_rate: this.calculateSuccessRate(recentActions),
            spending_comfort: this.assessSpendingComfort(recentActions),
            advanced_feature_need: this.assessAdvancedFeatureNeed(recentActions, nextTier)
        };

        const overallReadiness = Object.values(readinessFactors).reduce((sum, factor) => sum + factor, 0) / Object.keys(readinessFactors).length;

        return {
            ready: overallReadiness > 0.7,
            readiness_score: overallReadiness,
            factors: readinessFactors,
            next_tier: nextTier,
            recommended_upgrade_timing: overallReadiness > 0.8 ? 'immediate' : 'within_30_days'
        };
    }

    getNextTier(currentTier) {
        const tierProgression = {
            'guest': 'consumer',
            'consumer': 'power_user',
            'power_user': 'enterprise',
            'enterprise': null
        };
        return tierProgression[currentTier];
    }

    assessUsageFrequency(actions) {
        const daysWithActivity = new Set(actions.map(action => 
            new Date(action.timestamp).toDateString()
        )).size;
        
        const totalDays = 30; // Assuming 30-day analysis period
        return Math.min(daysWithActivity / (totalDays * 0.5), 1.0); // 50% activity = full score
    }

    assessFeatureExploration(actions, currentTier) {
        const availableFeatures = this.capabilityMatrix[currentTier].actions_permitted;
        const usedFeatures = new Set(actions.map(action => action.action_type));
        
        return usedFeatures.size / availableFeatures.length;
    }

    assessSpendingComfort(actions) {
        const spendingActions = actions.filter(action => (action.result.actual_cost || 0) > 0);
        if (spendingActions.length === 0) return 0;
        
        // Users comfortable with spending are ready for higher tiers
        return Math.min(spendingActions.length / (actions.length * 0.3), 1.0);
    }

    assessAdvancedFeatureNeed(actions, nextTier) {
        // Check if user has attempted actions that would be available in next tier
        const nextTierFeatures = this.capabilityMatrix[nextTier]?.actions_permitted || [];
        const attemptedAdvancedFeatures = actions.filter(action => 
            nextTierFeatures.includes(action.action_type) && 
            action.result.status === 'tier_insufficient'
        );
        
        return Math.min(attemptedAdvancedFeatures.length / 3, 1.0); // 3+ attempts = full score
    }

    async generateUserRecommendations(userId, recentActions) {
        const recommendations = [];
        
        // Usage optimization recommendations
        if (this.calculateSuccessRate(recentActions) < 0.7) {
            recommendations.push({
                type: 'success_improvement',
                priority: 'high',
                message: 'Focus on simpler actions to build confidence before attempting complex automation',
                action: 'Try basic reflection analysis and pattern recognition first'
            });
        }

        // Spending optimization
        const spendingBehavior = this.analyzeSpendingBehavior(recentActions);
        if (spendingBehavior.cost_efficiency < 0.6) {
            recommendations.push({
                type: 'cost_optimization',
                priority: 'medium',
                message: 'Consider setting stricter approval thresholds to control costs',
                action: 'Review and adjust spending limits in settings'
            });
        }

        // Feature exploration
        const featureUsage = this.analyzeFeatureUsage(recentActions);
        if (featureUsage.feature_diversity < 3) {
            recommendations.push({
                type: 'feature_exploration',
                priority: 'low',
                message: 'Try exploring more Agent Zero features to maximize your tier benefits',
                action: 'Browse the feature library for new automation ideas'
            });
        }

        // Tier upgrade recommendations
        const upgradeReadiness = await this.assessTierUpgradeReadiness(userId, recentActions);
        if (upgradeReadiness.ready) {
            recommendations.push({
                type: 'tier_upgrade',
                priority: 'medium',
                message: `You're ready to upgrade to ${upgradeReadiness.next_tier}!`,
                action: `Unlock ${upgradeReadiness.next_tier} features with ${this.getUpgradeAction(upgradeReadiness.next_tier)}`
            });
        }

        return recommendations;
    }

    getUpgradeAction(tier) {
        const upgradeActions = {
            'consumer': 'Face ID authentication',
            'power_user': 'PIN authentication',
            'enterprise': 'organization setup'
        };
        return upgradeActions[tier] || 'account upgrade';
    }
}

module.exports = AgentZeroTierAdapter;