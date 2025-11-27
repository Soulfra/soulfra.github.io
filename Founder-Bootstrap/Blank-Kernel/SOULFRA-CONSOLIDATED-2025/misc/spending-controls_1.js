// Spending Controls - Manages spending limits and tracking for Agent Zero
// Enforces tier-based spending restrictions and provides cost monitoring

class SpendingControls {
    constructor(options = {}) {
        this.spendingHistory = new Map();
        this.spendingLimits = options.spendingLimits || this.getDefaultSpendingLimits();
        this.billingPeriod = options.billingPeriod || 'monthly';
        this.alertThreshold = options.alertThreshold || 0.8; // Alert at 80% of limit
        this.costCalculator = options.costCalculator || new DefaultCostCalculator();
    }

    getDefaultSpendingLimits() {
        return {
            guest: {
                daily: 0,
                weekly: 0,
                monthly: 0,
                per_action: 0
            },
            consumer: {
                daily: 5,
                weekly: 15,
                monthly: 25,
                per_action: 5
            },
            power_user: {
                daily: 50,
                weekly: 200,
                monthly: 500,
                per_action: 50
            },
            enterprise: {
                daily: 1000,
                weekly: 5000,
                monthly: 50000,
                per_action: 500
            }
        };
    }

    async checkSpendingLimit(userId, action, userCapabilities) {
        try {
            const tier = userCapabilities.tier;
            const estimatedCost = action.estimated_cost || 0;
            const limits = this.spendingLimits[tier] || this.spendingLimits.consumer;

            // Check per-action limit
            if (estimatedCost > limits.per_action) {
                return {
                    allowed: false,
                    reason: 'exceeds_per_action_limit',
                    limit: limits.per_action,
                    requested: estimatedCost,
                    message: `Action cost $${estimatedCost} exceeds your per-action limit of $${limits.per_action}`
                };
            }

            // Get current spending
            const spending = await this.getCurrentSpending(userId);

            // Check daily limit
            if (spending.daily + estimatedCost > limits.daily) {
                return {
                    allowed: false,
                    reason: 'exceeds_daily_limit',
                    limit: limits.daily,
                    current: spending.daily,
                    requested: estimatedCost,
                    message: `Would exceed daily limit. Current: $${spending.daily.toFixed(2)}, Limit: $${limits.daily}`
                };
            }

            // Check weekly limit
            if (spending.weekly + estimatedCost > limits.weekly) {
                return {
                    allowed: false,
                    reason: 'exceeds_weekly_limit',
                    limit: limits.weekly,
                    current: spending.weekly,
                    requested: estimatedCost,
                    message: `Would exceed weekly limit. Current: $${spending.weekly.toFixed(2)}, Limit: $${limits.weekly}`
                };
            }

            // Check monthly limit
            if (spending.monthly + estimatedCost > limits.monthly) {
                return {
                    allowed: false,
                    reason: 'exceeds_monthly_limit',
                    limit: limits.monthly,
                    current: spending.monthly,
                    requested: estimatedCost,
                    message: `Would exceed monthly limit. Current: $${spending.monthly.toFixed(2)}, Limit: $${limits.monthly}`
                };
            }

            // Check if approaching limit (for warnings)
            const warnings = [];
            if ((spending.daily + estimatedCost) / limits.daily >= this.alertThreshold) {
                warnings.push({
                    type: 'approaching_daily_limit',
                    percentage: ((spending.daily + estimatedCost) / limits.daily * 100).toFixed(0)
                });
            }
            if ((spending.monthly + estimatedCost) / limits.monthly >= this.alertThreshold) {
                warnings.push({
                    type: 'approaching_monthly_limit',
                    percentage: ((spending.monthly + estimatedCost) / limits.monthly * 100).toFixed(0)
                });
            }

            return {
                allowed: true,
                estimated_cost: estimatedCost,
                current_spending: spending,
                limits: limits,
                warnings: warnings
            };

        } catch (error) {
            console.error('Spending limit check failed:', error);
            return {
                allowed: false,
                reason: 'check_failed',
                error: error.message
            };
        }
    }

    async recordSpending(userId, action, actualCost) {
        try {
            if (!this.spendingHistory.has(userId)) {
                this.spendingHistory.set(userId, []);
            }

            const record = {
                action_id: action.id,
                action_type: action.type,
                cost: actualCost,
                estimated_cost: action.estimated_cost,
                timestamp: Date.now(),
                date: new Date().toISOString()
            };

            this.spendingHistory.get(userId).push(record);

            // Emit spending event for monitoring
            if (this.eventEmitter) {
                this.eventEmitter.emit('spending_recorded', {
                    user_id: userId,
                    record: record
                });
            }

            console.log(`💰 Recorded spending: $${actualCost} for ${action.type} (user: ${userId})`);

            return {
                success: true,
                record: record
            };

        } catch (error) {
            console.error('Failed to record spending:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getCurrentSpending(userId) {
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const weekMs = 7 * dayMs;
        const monthMs = 30 * dayMs;

        const userHistory = this.spendingHistory.get(userId) || [];

        const spending = {
            daily: 0,
            weekly: 0,
            monthly: 0,
            total: 0
        };

        for (const record of userHistory) {
            const age = now - record.timestamp;
            
            if (age <= dayMs) {
                spending.daily += record.cost;
            }
            if (age <= weekMs) {
                spending.weekly += record.cost;
            }
            if (age <= monthMs) {
                spending.monthly += record.cost;
            }
            spending.total += record.cost;
        }

        return spending;
    }

    async getSpendingAnalytics(userId, period = '30d') {
        const userHistory = this.spendingHistory.get(userId) || [];
        const periodMs = this.parsePeriod(period);
        const now = Date.now();

        const relevantRecords = userHistory.filter(r => 
            now - r.timestamp <= periodMs
        );

        // Group by action type
        const byType = {};
        const byDay = {};

        for (const record of relevantRecords) {
            // By type
            if (!byType[record.action_type]) {
                byType[record.action_type] = {
                    count: 0,
                    total_cost: 0,
                    average_cost: 0
                };
            }
            byType[record.action_type].count++;
            byType[record.action_type].total_cost += record.cost;

            // By day
            const day = new Date(record.timestamp).toISOString().split('T')[0];
            if (!byDay[day]) {
                byDay[day] = {
                    count: 0,
                    total_cost: 0
                };
            }
            byDay[day].count++;
            byDay[day].total_cost += record.cost;
        }

        // Calculate averages
        for (const type in byType) {
            byType[type].average_cost = byType[type].total_cost / byType[type].count;
        }

        // Calculate trends
        const dailyCosts = Object.values(byDay).map(d => d.total_cost);
        const trend = this.calculateTrend(dailyCosts);

        return {
            period: period,
            total_spent: relevantRecords.reduce((sum, r) => sum + r.cost, 0),
            total_actions: relevantRecords.length,
            average_per_action: relevantRecords.length > 0 
                ? relevantRecords.reduce((sum, r) => sum + r.cost, 0) / relevantRecords.length 
                : 0,
            by_type: byType,
            by_day: byDay,
            trend: trend,
            most_expensive_action: relevantRecords.reduce((max, r) => 
                r.cost > (max?.cost || 0) ? r : max, null
            ),
            recommendations: this.generateSpendingRecommendations(byType, trend)
        };
    }

    calculateTrend(values) {
        if (values.length < 2) return 'stable';
        
        const recent = values.slice(-7);
        const older = values.slice(-14, -7);
        
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
        
        const change = (recentAvg - olderAvg) / olderAvg;
        
        if (change > 0.2) return 'increasing';
        if (change < -0.2) return 'decreasing';
        return 'stable';
    }

    generateSpendingRecommendations(byType, trend) {
        const recommendations = [];

        // Check for high-cost action types
        for (const [type, stats] of Object.entries(byType)) {
            if (stats.average_cost > 10) {
                recommendations.push({
                    type: 'cost_optimization',
                    action_type: type,
                    message: `Consider optimizing ${type} actions - average cost $${stats.average_cost.toFixed(2)}`
                });
            }
        }

        // Trend-based recommendations
        if (trend === 'increasing') {
            recommendations.push({
                type: 'spending_trend',
                message: 'Your spending is increasing. Consider setting up auto-approval rules for common low-cost actions.'
            });
        }

        return recommendations;
    }

    parsePeriod(period) {
        const match = period.match(/^(\d+)([dwm])$/);
        if (!match) return 30 * 24 * 60 * 60 * 1000; // Default 30 days

        const [, num, unit] = match;
        const multipliers = {
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000,
            'm': 30 * 24 * 60 * 60 * 1000
        };

        return parseInt(num) * multipliers[unit];
    }

    async requestSpendingIncrease(userId, requestedAmount, reason, userCapabilities) {
        // Create a spending increase request
        const request = {
            id: 'spend_req_' + Date.now(),
            user_id: userId,
            current_tier: userCapabilities.tier,
            current_limit: this.spendingLimits[userCapabilities.tier].monthly,
            requested_amount: requestedAmount,
            reason: reason,
            created_at: Date.now(),
            status: 'pending'
        };

        // For power users and above, auto-approve reasonable increases
        if (userCapabilities.tier === 'power_user' || userCapabilities.tier === 'enterprise') {
            const increaseRatio = requestedAmount / request.current_limit;
            if (increaseRatio <= 1.5) {
                request.status = 'auto_approved';
                // Temporarily increase limit
                this.temporaryLimitIncreases.set(userId, {
                    amount: requestedAmount,
                    expires: Date.now() + (30 * 24 * 60 * 60 * 1000)
                });
            }
        }

        return request;
    }
}

// Default cost calculator
class DefaultCostCalculator {
    calculateCost(action) {
        const baseCosts = {
            reflection_analysis: 0.02,
            pattern_recognition: 0.10,
            agent_spawning: 5.00,
            workflow_automation: 2.00,
            api_integration: 1.00,
            data_export: 0.50
        };

        return baseCosts[action.type] || 0.10;
    }
}

module.exports = SpendingControls;