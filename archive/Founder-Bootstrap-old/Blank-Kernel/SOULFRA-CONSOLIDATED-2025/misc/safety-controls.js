// Safety Controls - Implements tier-based safety restrictions for Agent Zero
// Ensures actions are appropriate for user's trust level and prevents harmful operations

class SafetyControls {
    constructor(options = {}) {
        this.safetyRules = options.safetyRules || this.getDefaultSafetyRules();
        this.riskAssessmentEngine = options.riskAssessmentEngine || new RiskAssessmentEngine();
        this.emergencyStops = new Map();
        this.blockedPatterns = new Set([
            'delete_all',
            'rm -rf',
            'format',
            'wipe',
            'destroy',
            'hack',
            'crack',
            'exploit'
        ]);
    }

    getDefaultSafetyRules() {
        return {
            guest: {
                allowed_action_types: ['reflection_analysis', 'pattern_recognition'],
                max_complexity: 'low',
                requires_approval: ['all'],
                restricted_operations: ['file_system', 'network', 'system_commands'],
                data_access: 'read_only',
                scope: 'session_only'
            },
            consumer: {
                allowed_action_types: [
                    'reflection_analysis',
                    'pattern_recognition',
                    'agent_spawning',
                    'qr_sharing',
                    'basic_export'
                ],
                max_complexity: 'medium',
                requires_approval: ['agent_spawning', 'api_integration'],
                restricted_operations: ['system_commands', 'bulk_operations'],
                data_access: 'user_data_only',
                scope: 'user_vault'
            },
            power_user: {
                allowed_action_types: [
                    'reflection_analysis',
                    'pattern_recognition',
                    'agent_spawning',
                    'workflow_automation',
                    'api_integration',
                    'advanced_export',
                    'custom_agents'
                ],
                max_complexity: 'high',
                requires_approval: ['workflow_automation', 'bulk_operations'],
                restricted_operations: ['system_critical'],
                data_access: 'user_and_integrations',
                scope: 'user_ecosystem'
            },
            enterprise: {
                allowed_action_types: 'all',
                max_complexity: 'unlimited',
                requires_approval: ['compliance_sensitive', 'high_cost'],
                restricted_operations: [],
                data_access: 'organizational',
                scope: 'enterprise_wide'
            }
        };
    }

    async validateActionSafety(action, userCapabilities) {
        try {
            const rules = this.safetyRules[userCapabilities.tier] || this.safetyRules.consumer;

            // Check if action type is allowed
            if (rules.allowed_action_types !== 'all' && 
                !rules.allowed_action_types.includes(action.type)) {
                return {
                    safe: false,
                    reason: 'action_type_not_allowed',
                    message: `Action type '${action.type}' is not allowed for ${userCapabilities.tier} tier`
                };
            }

            // Check complexity restrictions
            const complexityCheck = this.checkComplexity(action, rules.max_complexity);
            if (!complexityCheck.allowed) {
                return {
                    safe: false,
                    reason: 'complexity_too_high',
                    message: complexityCheck.message
                };
            }

            // Check for blocked patterns
            const blockedCheck = this.checkBlockedPatterns(action);
            if (blockedCheck.blocked) {
                return {
                    safe: false,
                    reason: 'blocked_pattern_detected',
                    message: blockedCheck.message
                };
            }

            // Perform risk assessment
            const riskAssessment = await this.riskAssessmentEngine.assessRisk(action, userCapabilities);
            if (riskAssessment.risk_level === 'unacceptable') {
                return {
                    safe: false,
                    reason: 'risk_too_high',
                    message: riskAssessment.message,
                    risk_details: riskAssessment
                };
            }

            // Check if approval is required
            const requiresApproval = this.checkApprovalRequirement(action, rules);

            // Check data access restrictions
            const dataAccessCheck = this.checkDataAccess(action, rules);
            if (!dataAccessCheck.allowed) {
                return {
                    safe: false,
                    reason: 'data_access_violation',
                    message: dataAccessCheck.message
                };
            }

            // Check scope restrictions
            const scopeCheck = this.checkScope(action, rules);
            if (!scopeCheck.allowed) {
                return {
                    safe: false,
                    reason: 'scope_violation',
                    message: scopeCheck.message
                };
            }

            return {
                safe: true,
                requires_approval: requiresApproval,
                risk_assessment: riskAssessment,
                safety_notes: this.generateSafetyNotes(action, rules, riskAssessment)
            };

        } catch (error) {
            console.error('Safety validation failed:', error);
            return {
                safe: false,
                reason: 'validation_error',
                message: 'Safety validation encountered an error',
                error: error.message
            };
        }
    }

    checkComplexity(action, maxComplexity) {
        const complexityLevels = ['low', 'medium', 'high', 'unlimited'];
        const actionComplexity = action.complexity || 'medium';
        const maxLevel = complexityLevels.indexOf(maxComplexity);
        const actionLevel = complexityLevels.indexOf(actionComplexity);

        if (maxComplexity === 'unlimited' || actionLevel <= maxLevel) {
            return { allowed: true };
        }

        return {
            allowed: false,
            message: `Action complexity '${actionComplexity}' exceeds maximum allowed '${maxComplexity}'`
        };
    }

    checkBlockedPatterns(action) {
        const actionString = JSON.stringify(action).toLowerCase();
        
        for (const pattern of this.blockedPatterns) {
            if (actionString.includes(pattern)) {
                return {
                    blocked: true,
                    message: `Action contains blocked pattern: ${pattern}`,
                    pattern: pattern
                };
            }
        }

        // Check for dangerous operations
        if (action.type === 'system_command' && action.command) {
            const dangerousCommands = ['rm', 'del', 'format', 'shutdown', 'reboot'];
            for (const cmd of dangerousCommands) {
                if (action.command.toLowerCase().includes(cmd)) {
                    return {
                        blocked: true,
                        message: `Potentially dangerous command detected: ${cmd}`,
                        pattern: cmd
                    };
                }
            }
        }

        return { blocked: false };
    }

    checkApprovalRequirement(action, rules) {
        if (rules.requires_approval.includes('all')) {
            return true;
        }

        if (rules.requires_approval.includes(action.type)) {
            return true;
        }

        // Cost-based approval
        if (action.estimated_cost > 10 && rules.requires_approval.includes('high_cost')) {
            return true;
        }

        // Complexity-based approval
        if (action.complexity === 'high' && rules.requires_approval.includes('high_complexity')) {
            return true;
        }

        return false;
    }

    checkDataAccess(action, rules) {
        const dataAccessLevels = {
            'read_only': 1,
            'session_only': 2,
            'user_data_only': 3,
            'user_and_integrations': 4,
            'organizational': 5
        };

        const requiredLevel = dataAccessLevels[action.data_access_required || 'user_data_only'];
        const allowedLevel = dataAccessLevels[rules.data_access];

        if (requiredLevel > allowedLevel) {
            return {
                allowed: false,
                message: `Action requires '${action.data_access_required}' access but tier only allows '${rules.data_access}'`
            };
        }

        return { allowed: true };
    }

    checkScope(action, rules) {
        const scopeLevels = {
            'session_only': 1,
            'user_vault': 2,
            'user_ecosystem': 3,
            'enterprise_wide': 4
        };

        const requiredScope = scopeLevels[action.scope_required || 'user_vault'];
        const allowedScope = scopeLevels[rules.scope];

        if (requiredScope > allowedScope) {
            return {
                allowed: false,
                message: `Action requires '${action.scope_required}' scope but tier only allows '${rules.scope}'`
            };
        }

        return { allowed: true };
    }

    generateSafetyNotes(action, rules, riskAssessment) {
        const notes = [];

        if (riskAssessment.risk_level === 'medium' || riskAssessment.risk_level === 'high') {
            notes.push(`Risk level: ${riskAssessment.risk_level} - ${riskAssessment.primary_concern}`);
        }

        if (action.data_access_required === 'organizational') {
            notes.push('This action will access organization-wide data');
        }

        if (action.type === 'workflow_automation') {
            notes.push('Automated workflows will continue running until explicitly stopped');
        }

        if (action.estimated_cost > 50) {
            notes.push(`High cost action: $${action.estimated_cost}`);
        }

        return notes;
    }

    async setEmergencyStop(userId, reason) {
        this.emergencyStops.set(userId, {
            active: true,
            reason: reason,
            timestamp: Date.now(),
            stopped_by: 'user'
        });

        console.log(`🚨 Emergency stop activated for user ${userId}: ${reason}`);
        return true;
    }

    clearEmergencyStop(userId, clearedBy) {
        if (this.emergencyStops.has(userId)) {
            const stop = this.emergencyStops.get(userId);
            stop.active = false;
            stop.cleared_at = Date.now();
            stop.cleared_by = clearedBy;
            
            console.log(`✅ Emergency stop cleared for user ${userId}`);
            return true;
        }
        return false;
    }

    isEmergencyStopActive(userId) {
        const stop = this.emergencyStops.get(userId);
        return stop && stop.active;
    }

    async enforceRateLimits(userId, action, capabilities) {
        // Implement rate limiting based on tier
        const rateLimits = {
            guest: { per_minute: 1, per_hour: 10, per_day: 50 },
            consumer: { per_minute: 5, per_hour: 100, per_day: 500 },
            power_user: { per_minute: 20, per_hour: 500, per_day: 5000 },
            enterprise: { per_minute: 100, per_hour: 5000, per_day: 50000 }
        };

        // This would integrate with a rate limiting service
        // Simplified implementation for now
        return {
            allowed: true,
            current_usage: { per_minute: 0, per_hour: 0, per_day: 0 },
            limits: rateLimits[capabilities.tier] || rateLimits.consumer
        };
    }
}

// Risk Assessment Engine
class RiskAssessmentEngine {
    async assessRisk(action, capabilities) {
        const riskFactors = [];
        let riskScore = 0;

        // Financial risk
        if (action.estimated_cost > 0) {
            const costRatio = action.estimated_cost / (capabilities.spending_limit || 25);
            if (costRatio > 0.5) {
                riskFactors.push('High cost relative to spending limit');
                riskScore += 3;
            } else if (costRatio > 0.2) {
                riskFactors.push('Moderate cost');
                riskScore += 1;
            }
        }

        // Data access risk
        if (action.data_access_required === 'organizational') {
            riskFactors.push('Organization-wide data access');
            riskScore += 4;
        } else if (action.data_access_required === 'user_and_integrations') {
            riskFactors.push('External integration access');
            riskScore += 2;
        }

        // Automation risk
        if (action.type === 'workflow_automation') {
            riskFactors.push('Automated workflow creation');
            riskScore += 2;
        }

        // API integration risk
        if (action.type === 'api_integration') {
            riskFactors.push('External API integration');
            riskScore += 3;
        }

        // Determine risk level
        let riskLevel = 'low';
        if (riskScore >= 8) {
            riskLevel = 'unacceptable';
        } else if (riskScore >= 5) {
            riskLevel = 'high';
        } else if (riskScore >= 3) {
            riskLevel = 'medium';
        }

        return {
            risk_level: riskLevel,
            risk_score: riskScore,
            risk_factors: riskFactors,
            primary_concern: riskFactors[0] || 'None identified',
            message: riskLevel === 'unacceptable' 
                ? 'This action poses too high a risk for your current tier'
                : `Risk assessment: ${riskLevel}`,
            mitigations: this.suggestMitigations(riskFactors)
        };
    }

    suggestMitigations(riskFactors) {
        const mitigations = [];

        if (riskFactors.some(f => f.includes('cost'))) {
            mitigations.push('Consider breaking into smaller, lower-cost actions');
        }

        if (riskFactors.some(f => f.includes('Organization-wide'))) {
            mitigations.push('Limit scope to specific teams or departments');
        }

        if (riskFactors.some(f => f.includes('External'))) {
            mitigations.push('Review and limit external permissions requested');
        }

        return mitigations;
    }
}

module.exports = SafetyControls;