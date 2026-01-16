// Approval Workflow System - Human oversight for autonomous actions requiring approval
// Provides user-friendly approval interfaces and learns from user decisions

const EventEmitter = require('events');

class ApprovalWorkflowSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        this.notificationService = options.notificationService || new MockNotificationService();
        this.userPreferenceEngine = options.userPreferenceEngine || new UserPreferenceEngine();
        this.pendingApprovals = new Map();
        this.approvalHistory = new Map();
        this.autoApprovalRules = new Map();
        this.approvalTimeouts = new Map();
    }

    async requestApproval(userId, action, capabilities, context, executionId) {
        try {
            const approvalRequest = {
                id: this.generateApprovalId(),
                execution_id: executionId,
                user_id: userId,
                action: action,
                capabilities: capabilities,
                context: context,
                created_at: Date.now(),
                expires_at: Date.now() + (30 * 60 * 1000), // 30 minutes default
                status: 'pending',
                attempts: 0,
                max_attempts: 3
            };

            // Check for auto-approval rules
            const autoApprovalCheck = await this.checkAutoApprovalRules(userId, action, capabilities);
            if (autoApprovalCheck.auto_approve) {
                return await this.processAutoApproval(approvalRequest, autoApprovalCheck);
            }

            // Store pending approval
            this.pendingApprovals.set(approvalRequest.id, approvalRequest);

            // Generate user-friendly explanation
            const explanation = await this.generateApprovalExplanation(action, capabilities, context);

            // Determine approval interface type based on user tier and action complexity
            const interfaceType = this.determineApprovalInterface(capabilities.tier, action.complexity);

            // Send notification to user
            const notificationResult = await this.sendApprovalNotification(userId, {
                approval_id: approvalRequest.id,
                interface_type: interfaceType,
                explanation: explanation,
                urgency: this.calculateUrgency(action),
                estimated_benefit: this.estimateBenefit(action, capabilities),
                risk_assessment: this.assessRisk(action, capabilities)
            });

            // Set up timeout handler
            this.setupApprovalTimeout(approvalRequest);

            console.log(`📋 Approval requested: ${action.type} for user ${userId} (${approvalRequest.id})`);

            return {
                status: 'approval_requested',
                approval_id: approvalRequest.id,
                execution_id: executionId,
                interface_type: interfaceType,
                explanation: explanation,
                expires_at: approvalRequest.expires_at,
                notification_sent: notificationResult.success
            };

        } catch (error) {
            console.error('Approval request failed:', error);
            return {
                status: 'approval_request_failed',
                error: error.message,
                execution_id: executionId
            };
        }
    }

    async generateApprovalExplanation(action, capabilities, context) {
        const explanationTemplates = {
            agent_spawning: {
                title: "🤖 Agent Zero wants to create a helper agent",
                description: `Based on your recent reflections, I'd like to create a ${action.agent_config?.type || 'specialized'} agent to help with ${action.purpose || 'your tasks'}. This agent will ${this.describeAgentCapabilities(action.agent_config?.capabilities)}.`,
                benefits: [
                    `Automated ${action.purpose || 'task assistance'}`,
                    `Personalized to your patterns`,
                    `Available 24/7`
                ],
                risks: this.identifyAgentRisks(action.agent_config),
                cost_breakdown: this.generateCostBreakdown(action)
            },
            api_integration: {
                title: "🔗 Agent Zero wants to connect to external service",
                description: `I'd like to connect to ${action.service_name || 'an external service'} to ${action.purpose || 'enhance your experience'}. This will cost approximately $${action.estimated_cost || '0.00'} and give me access to ${this.describePermissions(action.permissions_requested)}.`,
                benefits: [
                    `Enhanced ${action.service_name || 'service'} integration`,
                    `Automated data synchronization`,
                    `Improved workflow efficiency`
                ],
                risks: this.identifyIntegrationRisks(action),
                cost_breakdown: this.generateCostBreakdown(action)
            },
            workflow_automation: {
                title: "⚡ Agent Zero wants to automate a workflow",
                description: `I've identified a pattern in your work and want to automate ${action.workflow_name || 'a recurring process'}. This will run ${action.frequency || 'as needed'} and ${this.describeWorkflowActions(action.workflow?.steps)}.`,
                benefits: [
                    `Save ${this.estimateTimeSavings(action)} per ${action.frequency || 'occurrence'}`,
                    `Reduce manual repetitive tasks`,
                    `Consistent execution`
                ],
                risks: this.identifyWorkflowRisks(action.workflow),
                cost_breakdown: this.generateCostBreakdown(action)
            },
            spending_request: {
                title: "💰 Agent Zero wants to make a purchase",
                description: `I need to spend $${action.amount || action.estimated_cost} to ${action.purpose || 'complete this action'}. This will ${action.service_description || 'enable additional capabilities'}.`,
                benefits: [
                    `${action.service_description || 'Enhanced functionality'}`,
                    `Better user experience`,
                    `Improved results quality`
                ],
                risks: this.identifySpendingRisks(action),
                cost_breakdown: this.generateDetailedCostBreakdown(action)
            }
        };

        const template = explanationTemplates[action.type] || explanationTemplates.spending_request;
        
        // Personalize explanation based on user history and preferences
        const personalizedExplanation = await this.personalizeExplanation(template, capabilities, context);
        
        // Add tier-specific information
        personalizedExplanation.tier_context = this.generateTierContext(capabilities.tier, action);
        
        // Add auto-approval option if applicable
        personalizedExplanation.auto_approval_option = await this.generateAutoApprovalOption(action, capabilities);
        
        return personalizedExplanation;
    }

    determineApprovalInterface(tier, complexity) {
        // Different interface types based on user sophistication
        const interfaces = {
            guest: 'simple_dialog',      // Very simple yes/no with explanation
            consumer: 'friendly_card',    // Card-based interface with benefits/risks
            power_user: 'detailed_panel', // Detailed technical information
            enterprise: 'executive_summary' // Executive summary with business impact
        };

        // Adjust for action complexity
        const tierInterface = interfaces[tier] || 'friendly_card';
        
        if (complexity === 'high' && tier !== 'enterprise') {
            return 'detailed_panel'; // Upgrade to detailed for complex actions
        }
        
        return tierInterface;
    }

    async sendApprovalNotification(userId, notificationData) {
        try {
            const { approval_id, interface_type, explanation, urgency, estimated_benefit, risk_assessment } = notificationData;
            
            // Create interface-specific notification content
            const content = await this.createNotificationContent(interface_type, explanation, {
                urgency,
                estimated_benefit,
                risk_assessment,
                approval_id
            });

            // Send via multiple channels based on urgency
            const channels = this.selectNotificationChannels(urgency);
            const results = [];

            for (const channel of channels) {
                try {
                    const result = await this.notificationService.send(userId, channel, content);
                    results.push({ channel, success: result.success, message_id: result.message_id });
                } catch (channelError) {
                    results.push({ channel, success: false, error: channelError.message });
                }
            }

            return {
                success: results.some(r => r.success),
                channels_attempted: channels,
                results: results
            };

        } catch (error) {
            console.error('Failed to send approval notification:', error);
            return { success: false, error: error.message };
        }
    }

    async createNotificationContent(interfaceType, explanation, metadata) {
        const contentCreators = {
            simple_dialog: () => this.createSimpleDialogContent(explanation, metadata),
            friendly_card: () => this.createFriendlyCardContent(explanation, metadata),
            detailed_panel: () => this.createDetailedPanelContent(explanation, metadata),
            executive_summary: () => this.createExecutiveSummaryContent(explanation, metadata)
        };

        const creator = contentCreators[interfaceType] || contentCreators.friendly_card;
        return await creator();
    }

    createSimpleDialogContent(explanation, metadata) {
        return {
            type: 'simple_dialog',
            title: explanation.title,
            message: `${explanation.description}\n\nThis will cost $${explanation.cost_breakdown?.total || '0.00'}.`,
            benefits_summary: explanation.benefits.slice(0, 2).join(', '),
            buttons: [
                { id: 'approve', text: 'Yes, please!', style: 'primary' },
                { id: 'deny', text: 'No thanks', style: 'secondary' },
                { id: 'learn_more', text: 'Tell me more', style: 'link' }
            ],
            urgency: metadata.urgency,
            approval_id: metadata.approval_id
        };
    }

    createFriendlyCardContent(explanation, metadata) {
        return {
            type: 'friendly_card',
            title: explanation.title,
            description: explanation.description,
            benefits: explanation.benefits,
            risks: explanation.risks.map(risk => risk.description),
            cost_info: {
                amount: explanation.cost_breakdown?.total || 0,
                breakdown: explanation.cost_breakdown?.items || [],
                value_assessment: metadata.estimated_benefit
            },
            risk_level: metadata.risk_assessment.level,
            confidence: metadata.estimated_benefit.confidence,
            buttons: [
                { id: 'approve', text: 'Approve', style: 'primary' },
                { id: 'modify', text: 'Modify', style: 'secondary' },
                { id: 'deny', text: 'Deny', style: 'danger' },
                { id: 'auto_approve_similar', text: 'Auto-approve similar', style: 'link' }
            ],
            approval_id: metadata.approval_id,
            estimated_completion: metadata.estimated_benefit.completion_time
        };
    }

    createDetailedPanelContent(explanation, metadata) {
        return {
            type: 'detailed_panel',
            title: explanation.title,
            sections: [
                {
                    title: 'Overview',
                    content: explanation.description
                },
                {
                    title: 'Benefits',
                    content: explanation.benefits,
                    type: 'list'
                },
                {
                    title: 'Risk Analysis',
                    content: explanation.risks,
                    type: 'risk_breakdown'
                },
                {
                    title: 'Cost Breakdown',
                    content: explanation.cost_breakdown,
                    type: 'cost_analysis'
                },
                {
                    title: 'Technical Details',
                    content: this.generateTechnicalDetails(explanation),
                    type: 'technical_info'
                }
            ],
            decision_matrix: {
                benefits_score: metadata.estimated_benefit.score,
                risk_score: metadata.risk_assessment.score,
                cost_score: this.calculateCostScore(explanation.cost_breakdown),
                recommendation: this.generateRecommendation(metadata)
            },
            buttons: [
                { id: 'approve', text: 'Approve', style: 'primary' },
                { id: 'approve_with_modifications', text: 'Approve with Changes', style: 'secondary' },
                { id: 'deny', text: 'Deny', style: 'danger' },
                { id: 'defer', text: 'Decide Later', style: 'link' }
            ],
            approval_id: metadata.approval_id
        };
    }

    createExecutiveSummaryContent(explanation, metadata) {
        return {
            type: 'executive_summary',
            title: explanation.title,
            executive_summary: {
                business_impact: metadata.estimated_benefit.business_impact,
                risk_assessment: metadata.risk_assessment.executive_summary,
                financial_impact: explanation.cost_breakdown?.business_value || 'Minimal',
                strategic_alignment: this.assessStrategicAlignment(explanation),
                recommendation: this.generateExecutiveRecommendation(metadata)
            },
            key_metrics: {
                roi_estimate: metadata.estimated_benefit.roi || 'N/A',
                implementation_time: metadata.estimated_benefit.completion_time,
                risk_level: metadata.risk_assessment.level,
                confidence_level: metadata.estimated_benefit.confidence
            },
            stakeholder_impact: this.assessStakeholderImpact(explanation),
            buttons: [
                { id: 'approve', text: 'Approve', style: 'primary' },
                { id: 'conditional_approve', text: 'Approve with Conditions', style: 'secondary' },
                { id: 'deny', text: 'Deny', style: 'danger' },
                { id: 'escalate', text: 'Escalate Decision', style: 'link' }
            ],
            approval_id: metadata.approval_id
        };
    }

    async processApprovalResponse(approvalId, userResponse, userId) {
        try {
            const approval = this.pendingApprovals.get(approvalId);
            if (!approval) {
                throw new Error('Approval request not found or expired');
            }

            if (approval.user_id !== userId) {
                throw new Error('Unauthorized approval response');
            }

            // Clear timeout
            this.clearApprovalTimeout(approvalId);

            // Update approval record
            approval.status = userResponse.decision;
            approval.user_response = userResponse;
            approval.completed_at = Date.now();
            approval.response_time = Date.now() - approval.created_at;

            // Learn from user decision
            await this.userPreferenceEngine.learnFromApproval(userId, approval.action, userResponse);

            // Process based on decision
            let result;
            switch (userResponse.decision) {
                case 'approved':
                    result = await this.processApproval(approval);
                    break;
                case 'modified':
                    result = await this.processModifiedApproval(approval, userResponse.modifications);
                    break;
                case 'conditional_approve':
                    result = await this.processConditionalApproval(approval, userResponse.conditions);
                    break;
                case 'denied':
                    result = await this.processDenial(approval, userResponse.reason);
                    break;
                case 'deferred':
                    result = await this.processDeferral(approval, userResponse.defer_until);
                    break;
                default:
                    throw new Error(`Unknown approval decision: ${userResponse.decision}`);
            }

            // Store in approval history
            await this.storeApprovalHistory(approval);

            // Remove from pending
            this.pendingApprovals.delete(approvalId);

            // Emit approval event
            this.emit('approval_processed', {
                approval_id: approvalId,
                user_id: userId,
                decision: userResponse.decision,
                result: result
            });

            console.log(`✅ Approval processed: ${approvalId} - ${userResponse.decision}`);
            return result;

        } catch (error) {
            console.error('Approval response processing failed:', error);
            return {
                status: 'processing_error',
                error: error.message,
                approval_id: approvalId
            };
        }
    }

    async processApproval(approval) {
        // Execute the approved action
        try {
            // Re-validate action is still valid
            const validation = await this.revalidateAction(approval.action, approval.capabilities);
            if (!validation.valid) {
                throw new Error(`Action no longer valid: ${validation.reason}`);
            }

            return {
                status: 'approved_and_executing',
                execution_id: approval.execution_id,
                message: 'Action approved and will be executed',
                estimated_completion: this.estimateCompletionTime(approval.action)
            };

        } catch (error) {
            return {
                status: 'approval_execution_failed',
                error: error.message,
                execution_id: approval.execution_id
            };
        }
    }

    async processModifiedApproval(approval, modifications) {
        try {
            // Apply modifications to action
            const modifiedAction = { ...approval.action, ...modifications };
            
            // Validate modified action
            const validation = await this.validateModifiedAction(modifiedAction, approval.capabilities);
            if (!validation.valid) {
                throw new Error(`Modified action invalid: ${validation.reason}`);
            }

            return {
                status: 'modified_and_executing',
                execution_id: approval.execution_id,
                modified_action: modifiedAction,
                modifications_applied: modifications,
                message: 'Action modified and will be executed'
            };

        } catch (error) {
            return {
                status: 'modification_failed',
                error: error.message,
                execution_id: approval.execution_id
            };
        }
    }

    async processDenial(approval, reason) {
        // Log denial for learning
        await this.logDenial(approval, reason);
        
        return {
            status: 'denied',
            execution_id: approval.execution_id,
            reason: reason,
            message: 'Action denied by user'
        };
    }

    async checkAutoApprovalRules(userId, action, capabilities) {
        const userRules = this.autoApprovalRules.get(userId) || [];
        
        for (const rule of userRules) {
            if (await this.ruleMatches(rule, action, capabilities)) {
                return {
                    auto_approve: true,
                    rule_id: rule.id,
                    rule_description: rule.description,
                    confidence: rule.confidence || 0.9
                };
            }
        }

        return { auto_approve: false };
    }

    async processAutoApproval(approvalRequest, autoApprovalCheck) {
        try {
            approvalRequest.status = 'auto_approved';
            approvalRequest.auto_approval_rule = autoApprovalCheck.rule_id;
            approvalRequest.completed_at = Date.now();
            approvalRequest.response_time = 0; // Instant

            // Store in history
            await this.storeApprovalHistory(approvalRequest);

            console.log(`🚀 Auto-approved: ${approvalRequest.action.type} for user ${approvalRequest.user_id}`);

            return {
                status: 'auto_approved_and_executing',
                execution_id: approvalRequest.execution_id,
                rule_used: autoApprovalCheck.rule_description,
                message: 'Action auto-approved and executing'
            };

        } catch (error) {
            console.error('Auto-approval processing failed:', error);
            return {
                status: 'auto_approval_failed',
                error: error.message,
                execution_id: approvalRequest.execution_id
            };
        }
    }

    async createAutoApprovalRule(userId, ruleConfig) {
        const rule = {
            id: this.generateRuleId(),
            user_id: userId,
            name: ruleConfig.name,
            description: ruleConfig.description,
            conditions: ruleConfig.conditions,
            action_types: ruleConfig.action_types || [],
            spending_limit: ruleConfig.spending_limit || 0,
            confidence_threshold: ruleConfig.confidence_threshold || 0.8,
            created_at: Date.now(),
            active: true,
            usage_count: 0
        };

        if (!this.autoApprovalRules.has(userId)) {
            this.autoApprovalRules.set(userId, []);
        }

        this.autoApprovalRules.get(userId).push(rule);

        console.log(`📝 Auto-approval rule created: ${rule.name} for user ${userId}`);
        return rule;
    }

    setupApprovalTimeout(approval) {
        const timeoutId = setTimeout(async () => {
            try {
                await this.handleApprovalTimeout(approval.id);
            } catch (error) {
                console.error('Approval timeout handling failed:', error);
            }
        }, approval.expires_at - approval.created_at);

        this.approvalTimeouts.set(approval.id, timeoutId);
    }

    clearApprovalTimeout(approvalId) {
        const timeoutId = this.approvalTimeouts.get(approvalId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.approvalTimeouts.delete(approvalId);
        }
    }

    async handleApprovalTimeout(approvalId) {
        const approval = this.pendingApprovals.get(approvalId);
        if (!approval) return;

        approval.status = 'expired';
        approval.completed_at = Date.now();

        // Store in history
        await this.storeApprovalHistory(approval);

        // Remove from pending
        this.pendingApprovals.delete(approvalId);

        // Emit timeout event
        this.emit('approval_timeout', {
            approval_id: approvalId,
            user_id: approval.user_id,
            action_type: approval.action.type
        });

        console.log(`⏰ Approval expired: ${approvalId}`);
    }

    // Utility methods
    generateApprovalId() {
        return 'approval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateRuleId() {
        return 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    calculateUrgency(action) {
        const urgencyFactors = {
            user_waiting: action.user_waiting ? 2 : 0,
            time_sensitive: action.time_sensitive ? 3 : 0,
            blocking_other_actions: action.blocking_others ? 2 : 0,
            high_value: action.estimated_value > 100 ? 1 : 0
        };

        const totalUrgency = Object.values(urgencyFactors).reduce((sum, factor) => sum + factor, 0);
        
        if (totalUrgency >= 5) return 'high';
        if (totalUrgency >= 3) return 'medium';
        return 'low';
    }

    estimateBenefit(action, capabilities) {
        // Simplified benefit estimation
        return {
            score: 0.8,
            confidence: 0.85,
            completion_time: '5 minutes',
            business_impact: 'Moderate productivity improvement',
            roi: action.estimated_cost > 0 ? '200%' : 'N/A'
        };
    }

    assessRisk(action, capabilities) {
        // Simplified risk assessment
        const risks = [];
        
        if (action.estimated_cost > capabilities.spending_limit * 0.5) {
            risks.push('High cost relative to spending limit');
        }
        
        if (action.type === 'api_integration') {
            risks.push('Data sharing with external service');
        }
        
        return {
            level: risks.length > 1 ? 'medium' : 'low',
            score: risks.length * 0.3,
            factors: risks,
            executive_summary: risks.length > 0 ? risks.join(', ') : 'Low risk operation'
        };
    }

    // Helper methods for content generation
    describeAgentCapabilities(capabilities = []) {
        if (capabilities.length === 0) return 'provide specialized assistance';
        return capabilities.slice(0, 3).join(', ') + (capabilities.length > 3 ? ', and more' : '');
    }

    describePermissions(permissions = []) {
        if (permissions.length === 0) return 'basic functionality';
        return permissions.slice(0, 2).join(' and ') + (permissions.length > 2 ? ' and other features' : '');
    }

    describeWorkflowActions(steps = []) {
        if (steps.length === 0) return 'perform automated tasks';
        return `execute ${steps.length} automated steps including ${steps[0]?.name || 'process automation'}`;
    }

    estimateTimeSavings(action) {
        const savings = {
            'agent_spawning': '30 minutes',
            'workflow_automation': '2 hours',
            'api_integration': '15 minutes'
        };
        return savings[action.type] || '15 minutes';
    }

    generateCostBreakdown(action) {
        return {
            total: action.estimated_cost || 0,
            items: [
                { name: 'Base service fee', amount: (action.estimated_cost || 0) * 0.7 },
                { name: 'Processing fee', amount: (action.estimated_cost || 0) * 0.2 },
                { name: 'Platform fee', amount: (action.estimated_cost || 0) * 0.1 }
            ]
        };
    }

    identifyAgentRisks(agentConfig) {
        return [
            { description: 'Agent will have access to your reflection data', severity: 'low' },
            { description: 'Monthly recurring cost for agent operation', severity: 'medium' }
        ];
    }

    identifyIntegrationRisks(action) {
        return [
            { description: 'Data sharing with external service', severity: 'medium' },
            { description: 'Potential API rate limiting', severity: 'low' }
        ];
    }

    identifyWorkflowRisks(workflow) {
        return [
            { description: 'Automated actions may need manual review', severity: 'low' },
            { description: 'Workflow changes may affect other processes', severity: 'medium' }
        ];
    }

    identifySpendingRisks(action) {
        return [
            { description: 'Cost may vary based on usage', severity: 'low' },
            { description: 'Recurring charges may apply', severity: 'medium' }
        ];
    }

    async personalizeExplanation(template, capabilities, context) {
        // Add personalization based on user history and preferences
        return template;
    }

    generateTierContext(tier, action) {
        const contexts = {
            guest: 'As a guest user, this action will help you explore Mirror Kernel capabilities.',
            consumer: 'This action aligns with your consumer tier benefits and usage patterns.',
            power_user: 'This advanced action leverages your power user capabilities for optimization.',
            enterprise: 'This enterprise-level action supports your organizational objectives.'
        };
        return contexts[tier] || contexts.consumer;
    }

    async generateAutoApprovalOption(action, capabilities) {
        if (capabilities.tier === 'guest') return null;
        
        return {
            available: true,
            description: `Auto-approve similar ${action.type} actions under $${action.estimated_cost * 2}`,
            suggested_rule: {
                action_type: action.type,
                spending_limit: action.estimated_cost * 2,
                conditions: ['same_service', 'similar_cost']
            }
        };
    }

    selectNotificationChannels(urgency) {
        const channels = {
            high: ['push_notification', 'email', 'sms'],
            medium: ['push_notification', 'email'],
            low: ['push_notification']
        };
        return channels[urgency] || channels.low;
    }

    async storeApprovalHistory(approval) {
        if (!this.approvalHistory.has(approval.user_id)) {
            this.approvalHistory.set(approval.user_id, []);
        }
        
        const userHistory = this.approvalHistory.get(approval.user_id);
        userHistory.push(approval);
        
        // Keep only last 100 approvals
        if (userHistory.length > 100) {
            userHistory.shift();
        }
    }

    async ruleMatches(rule, action, capabilities) {
        // Simplified rule matching logic
        if (rule.action_types.length > 0 && !rule.action_types.includes(action.type)) {
            return false;
        }
        
        if (action.estimated_cost > rule.spending_limit) {
            return false;
        }
        
        return true;
    }

    async revalidateAction(action, capabilities) {
        // Revalidate that action is still valid
        return { valid: true };
    }

    async validateModifiedAction(modifiedAction, capabilities) {
        // Validate modified action
        return { valid: true };
    }

    async logDenial(approval, reason) {
        console.log(`❌ Action denied: ${approval.action.type} - ${reason}`);
    }

    estimateCompletionTime(action) {
        const times = {
            'agent_spawning': '2-3 minutes',
            'workflow_automation': '1-2 minutes',
            'api_integration': '30-60 seconds'
        };
        return times[action.type] || '1-2 minutes';
    }
}

// Mock notification service for testing
class MockNotificationService {
    async send(userId, channel, content) {
        console.log(`📨 Notification sent to ${userId} via ${channel}:`, content.title);
        return { success: true, message_id: 'mock_' + Date.now() };
    }
}

// User preference learning engine
class UserPreferenceEngine {
    constructor() {
        this.userPreferences = new Map();
    }

    async learnFromApproval(userId, action, response) {
        if (!this.userPreferences.has(userId)) {
            this.userPreferences.set(userId, {
                approval_patterns: {},
                spending_comfort: 0.5,
                risk_tolerance: 0.5,
                automation_preference: 0.5
            });
        }

        const prefs = this.userPreferences.get(userId);
        
        // Update approval patterns
        const actionType = action.type;
        if (!prefs.approval_patterns[actionType]) {
            prefs.approval_patterns[actionType] = { approved: 0, denied: 0 };
        }
        
        if (response.decision === 'approved' || response.decision === 'modified') {
            prefs.approval_patterns[actionType].approved++;
        } else if (response.decision === 'denied') {
            prefs.approval_patterns[actionType].denied++;
        }

        // Update spending comfort
        if (action.estimated_cost > 0) {
            if (response.decision === 'approved') {
                prefs.spending_comfort = Math.min(prefs.spending_comfort + 0.1, 1.0);
            } else if (response.decision === 'denied') {
                prefs.spending_comfort = Math.max(prefs.spending_comfort - 0.05, 0.0);
            }
        }

        console.log(`📚 Learned from approval: ${userId} - ${actionType} - ${response.decision}`);
    }
}

module.exports = ApprovalWorkflowSystem;