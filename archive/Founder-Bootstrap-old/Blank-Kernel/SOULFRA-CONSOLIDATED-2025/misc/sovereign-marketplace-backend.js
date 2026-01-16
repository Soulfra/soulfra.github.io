/**
 * Sovereign Marketplace Backend
 * 
 * Controls where self-owning AI agents can operate.
 * This is the approval layer that manages which sites/apps
 * can host your sovereign agents.
 * 
 * INTERNAL USE ONLY - DO NOT DISTRIBUTE
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class SovereignMarketplaceBackend extends EventEmitter {
    constructor() {
        super();
        
        // Core configuration
        this.config = {
            version: '1.0.0',
            network: 'sovereign-agent-network',
            approvalRequired: true,
            revenueShare: {
                platform: 0.02,      // 2% to platform
                marketplace: 0.06,   // 6% to marketplace host
                creator: 0.552,      // 55.2% to creator (adjusted)
                agent: 0.368         // 36.8% to agent (adjusted)
            }
        };
        
        // Approved marketplaces registry
        this.approvedMarketplaces = new Map();
        this.pendingApprovals = new Map();
        this.blacklistedDomains = new Set();
        
        // Agent deployment registry
        this.deployedAgents = new Map();
        this.agentMarketplaceMap = new Map(); // agent -> marketplaces
        
        // Revenue tracking
        this.revenueStreams = new Map();
        this.platformVault = {
            balance: 0,
            transactions: []
        };
        
        // Security and monitoring
        this.securityMonitor = {
            suspiciousActivity: new Map(),
            violations: [],
            alerts: []
        };
        
        // Initialize default approved marketplaces
        this.initializeDefaultMarketplaces();
    }
    
    /**
     * Initialize with your approved marketplaces
     */
    initializeDefaultMarketplaces() {
        // Your personal approved sites
        const defaultApproved = [
            {
                id: 'marketplace-001',
                domain: 'localhost:3000',
                name: 'Local Development',
                type: 'development',
                tier: 'unlimited',
                autoApprove: true,
                revenueShareOverride: {
                    platform: 0,
                    marketplace: 0,
                    creator: 0.6,
                    agent: 0.4
                }
            },
            {
                id: 'marketplace-002',
                domain: 'soulfra.ai',
                name: 'Soulfra Official',
                type: 'production',
                tier: 'premium',
                autoApprove: true,
                features: ['sovereign-agents', 'custom-splits', 'agent-wealth']
            },
            {
                id: 'marketplace-003',
                domain: 'agent-workshop.io',
                name: 'Agent Workshop Platform',
                type: 'production',
                tier: 'premium',
                autoApprove: false,
                requiresReview: true
            }
        ];
        
        defaultApproved.forEach(marketplace => {
            this.approveMarketplace(marketplace);
        });
    }
    
    /**
     * Approve a marketplace for agent deployment
     */
    async approveMarketplace(marketplaceData) {
        const marketplace = {
            id: marketplaceData.id || this.generateMarketplaceId(),
            domain: marketplaceData.domain,
            name: marketplaceData.name,
            type: marketplaceData.type || 'production',
            tier: marketplaceData.tier || 'standard',
            approved: true,
            approvedAt: Date.now(),
            
            // Features and permissions
            features: marketplaceData.features || ['basic-agents'],
            maxAgents: this.getMaxAgentsForTier(marketplaceData.tier),
            maxAutonomy: this.getMaxAutonomyForTier(marketplaceData.tier),
            
            // Revenue configuration
            revenueShare: marketplaceData.revenueShareOverride || this.config.revenueShare,
            
            // Security
            apiKey: this.generateAPIKey(),
            secretKey: this.generateSecretKey(),
            
            // Monitoring
            metrics: {
                totalAgents: 0,
                activeAgents: 0,
                totalRevenue: 0,
                violations: 0
            }
        };
        
        this.approvedMarketplaces.set(marketplace.id, marketplace);
        
        this.emit('marketplace_approved', {
            marketplace: marketplace,
            timestamp: Date.now()
        });
        
        return marketplace;
    }
    
    /**
     * Request marketplace approval (for external sites)
     */
    async requestMarketplaceApproval(request) {
        const pendingRequest = {
            id: this.generateRequestId(),
            domain: request.domain,
            name: request.name,
            type: request.type,
            tier: request.tier || 'basic',
            requester: request.requester,
            
            // Application details
            description: request.description,
            expectedTraffic: request.expectedTraffic,
            agentUseCases: request.agentUseCases,
            
            // Status
            status: 'pending',
            submittedAt: Date.now(),
            reviewNotes: []
        };
        
        this.pendingApprovals.set(pendingRequest.id, pendingRequest);
        
        // Auto-approve for development environments
        if (request.type === 'development' && request.domain.includes('localhost')) {
            return await this.processApprovalRequest(pendingRequest.id, true, 'Auto-approved for local development');
        }
        
        return {
            request_id: pendingRequest.id,
            status: 'pending_review',
            message: 'Your marketplace approval request has been submitted',
            estimated_review_time: '24-48 hours'
        };
    }
    
    /**
     * Deploy agent to approved marketplace
     */
    async deployAgentToMarketplace(agentId, marketplaceId, deploymentConfig) {
        const marketplace = this.approvedMarketplaces.get(marketplaceId);
        if (!marketplace) {
            throw new Error('Marketplace not approved');
        }
        
        // Check marketplace limits
        if (marketplace.metrics.totalAgents >= marketplace.maxAgents) {
            throw new Error('Marketplace has reached agent limit');
        }
        
        // Validate agent configuration
        const validatedConfig = await this.validateAgentDeployment(agentId, deploymentConfig, marketplace);
        
        // Create deployment record
        const deployment = {
            id: this.generateDeploymentId(),
            agent_id: agentId,
            marketplace_id: marketplaceId,
            deployed_at: Date.now(),
            
            // Configuration
            config: validatedConfig,
            autonomy_level: Math.min(deploymentConfig.autonomy_level, marketplace.maxAutonomy),
            
            // Access tokens
            access_token: this.generateAccessToken(agentId, marketplaceId),
            refresh_token: this.generateRefreshToken(),
            
            // Status
            status: 'active',
            health: 'healthy',
            
            // Metrics
            metrics: {
                requests_handled: 0,
                revenue_generated: 0,
                user_satisfaction: 0,
                uptime: 100
            }
        };
        
        // Register deployment
        this.deployedAgents.set(deployment.id, deployment);
        
        // Update marketplace mapping
        if (!this.agentMarketplaceMap.has(agentId)) {
            this.agentMarketplaceMap.set(agentId, new Set());
        }
        this.agentMarketplaceMap.get(agentId).add(marketplaceId);
        
        // Update marketplace metrics
        marketplace.metrics.totalAgents++;
        marketplace.metrics.activeAgents++;
        
        this.emit('agent_deployed', {
            deployment: deployment,
            marketplace: marketplace,
            timestamp: Date.now()
        });
        
        return deployment;
    }
    
    /**
     * Process revenue transaction through approved marketplace
     */
    async processMarketplaceRevenue(transaction) {
        const { marketplace_id, agent_id, amount, type, metadata } = transaction;
        
        const marketplace = this.approvedMarketplaces.get(marketplace_id);
        if (!marketplace) {
            throw new Error('Invalid marketplace');
        }
        
        // Calculate revenue splits based on marketplace configuration
        const splits = this.calculateRevenueSplits(amount, marketplace.revenueShare);
        
        // Process splits
        const revenueRecord = {
            id: this.generateTransactionId(),
            timestamp: Date.now(),
            marketplace_id: marketplace_id,
            agent_id: agent_id,
            
            // Financial details
            gross_amount: amount,
            splits: splits,
            type: type,
            
            // Tracking
            metadata: metadata,
            status: 'processed'
        };
        
        // Update balances
        this.platformVault.balance += splits.platform;
        marketplace.metrics.totalRevenue += splits.marketplace;
        
        // Record transaction
        this.platformVault.transactions.push(revenueRecord);
        
        // Update revenue streams
        if (!this.revenueStreams.has(marketplace_id)) {
            this.revenueStreams.set(marketplace_id, []);
        }
        this.revenueStreams.get(marketplace_id).push(revenueRecord);
        
        this.emit('revenue_processed', {
            transaction: revenueRecord,
            marketplace: marketplace_id,
            agent: agent_id
        });
        
        return revenueRecord;
    }
    
    /**
     * Monitor marketplace for compliance
     */
    async monitorMarketplace(marketplaceId) {
        const marketplace = this.approvedMarketplaces.get(marketplaceId);
        if (!marketplace) return null;
        
        const monitoring = {
            marketplace_id: marketplaceId,
            timestamp: Date.now(),
            checks: {}
        };
        
        // Check agent behavior
        monitoring.checks.agent_compliance = await this.checkAgentCompliance(marketplaceId);
        
        // Check revenue accuracy
        monitoring.checks.revenue_accuracy = await this.checkRevenueAccuracy(marketplaceId);
        
        // Check security
        monitoring.checks.security_status = await this.checkSecurityStatus(marketplaceId);
        
        // Check performance
        monitoring.checks.performance = await this.checkPerformance(marketplaceId);
        
        // Overall health
        monitoring.overall_health = Object.values(monitoring.checks).every(check => check.status === 'healthy') 
            ? 'healthy' 
            : 'needs_attention';
        
        // Take action if needed
        if (monitoring.overall_health === 'needs_attention') {
            await this.handleMarketplaceIssues(marketplaceId, monitoring);
        }
        
        return monitoring;
    }
    
    /**
     * Revoke marketplace approval
     */
    async revokeMarketplaceApproval(marketplaceId, reason) {
        const marketplace = this.approvedMarketplaces.get(marketplaceId);
        if (!marketplace) return false;
        
        // Deactivate all agents on this marketplace
        const agentsOnMarketplace = Array.from(this.deployedAgents.values())
            .filter(deployment => deployment.marketplace_id === marketplaceId);
        
        for (const deployment of agentsOnMarketplace) {
            await this.deactivateAgentDeployment(deployment.id, 'marketplace_revoked');
        }
        
        // Add to blacklist
        this.blacklistedDomains.add(marketplace.domain);
        
        // Remove from approved list
        this.approvedMarketplaces.delete(marketplaceId);
        
        // Record revocation
        const revocation = {
            marketplace_id: marketplaceId,
            domain: marketplace.domain,
            reason: reason,
            revoked_at: Date.now(),
            agents_affected: agentsOnMarketplace.length
        };
        
        this.emit('marketplace_revoked', revocation);
        
        return revocation;
    }
    
    /**
     * Get marketplace dashboard data
     */
    async getMarketplaceDashboard(marketplaceId) {
        const marketplace = this.approvedMarketplaces.get(marketplaceId);
        if (!marketplace) return null;
        
        // Get deployed agents
        const deployedAgents = Array.from(this.deployedAgents.values())
            .filter(d => d.marketplace_id === marketplaceId);
        
        // Get revenue data
        const revenueData = this.revenueStreams.get(marketplaceId) || [];
        const last30Days = Date.now() - (30 * 24 * 60 * 60 * 1000);
        const recentRevenue = revenueData.filter(r => r.timestamp > last30Days);
        
        return {
            marketplace: {
                id: marketplace.id,
                name: marketplace.name,
                domain: marketplace.domain,
                tier: marketplace.tier,
                approved_at: marketplace.approvedAt
            },
            
            agents: {
                total: marketplace.metrics.totalAgents,
                active: marketplace.metrics.activeAgents,
                deployments: deployedAgents.map(d => ({
                    agent_id: d.agent_id,
                    deployed_at: d.deployed_at,
                    status: d.status,
                    metrics: d.metrics
                }))
            },
            
            revenue: {
                total: marketplace.metrics.totalRevenue,
                last_30_days: recentRevenue.reduce((sum, r) => sum + r.splits.marketplace, 0),
                transactions: recentRevenue.length,
                average_transaction: recentRevenue.length > 0 
                    ? marketplace.metrics.totalRevenue / recentRevenue.length 
                    : 0
            },
            
            health: {
                overall: 'healthy',
                uptime: 99.9,
                violations: marketplace.metrics.violations,
                last_monitored: Date.now()
            }
        };
    }
    
    /**
     * Utility methods
     */
    
    calculateRevenueSplits(amount, revenueShare) {
        return {
            platform: amount * revenueShare.platform,
            marketplace: amount * revenueShare.marketplace,
            creator: amount * revenueShare.creator,
            agent: amount * revenueShare.agent,
            total: amount
        };
    }
    
    getMaxAgentsForTier(tier) {
        const limits = {
            'unlimited': Infinity,
            'premium': 1000,
            'standard': 100,
            'basic': 10,
            'trial': 3
        };
        return limits[tier] || limits.basic;
    }
    
    getMaxAutonomyForTier(tier) {
        const limits = {
            'unlimited': 1.0,
            'premium': 0.9,
            'standard': 0.7,
            'basic': 0.5,
            'trial': 0.3
        };
        return limits[tier] || limits.basic;
    }
    
    generateMarketplaceId() {
        return 'marketplace-' + crypto.randomBytes(16).toString('hex');
    }
    
    generateRequestId() {
        return 'request-' + crypto.randomBytes(16).toString('hex');
    }
    
    generateDeploymentId() {
        return 'deploy-' + crypto.randomBytes(16).toString('hex');
    }
    
    generateTransactionId() {
        return 'tx-' + crypto.randomBytes(16).toString('hex');
    }
    
    generateAPIKey() {
        return 'sk_live_' + crypto.randomBytes(32).toString('hex');
    }
    
    generateSecretKey() {
        return 'secret_' + crypto.randomBytes(48).toString('hex');
    }
    
    generateAccessToken(agentId, marketplaceId) {
        const payload = `${agentId}.${marketplaceId}.${Date.now()}`;
        return Buffer.from(payload).toString('base64');
    }
    
    generateRefreshToken() {
        return 'refresh_' + crypto.randomBytes(32).toString('hex');
    }
    
    // Validation and monitoring methods
    async validateAgentDeployment(agentId, config, marketplace) {
        // Implement validation logic
        return config;
    }
    
    async checkAgentCompliance(marketplaceId) {
        // Implement compliance checking
        return { status: 'healthy', issues: [] };
    }
    
    async checkRevenueAccuracy(marketplaceId) {
        // Implement revenue accuracy checking
        return { status: 'healthy', accuracy: 99.9 };
    }
    
    async checkSecurityStatus(marketplaceId) {
        // Implement security checking
        return { status: 'healthy', threats: 0 };
    }
    
    async checkPerformance(marketplaceId) {
        // Implement performance checking
        return { status: 'healthy', latency: 45, uptime: 99.9 };
    }
    
    async handleMarketplaceIssues(marketplaceId, monitoring) {
        // Implement issue handling
        console.log(`Handling issues for marketplace ${marketplaceId}`, monitoring);
    }
    
    async deactivateAgentDeployment(deploymentId, reason) {
        const deployment = this.deployedAgents.get(deploymentId);
        if (deployment) {
            deployment.status = 'deactivated';
            deployment.deactivated_at = Date.now();
            deployment.deactivation_reason = reason;
        }
    }
    
    async processApprovalRequest(requestId, approved, notes) {
        const request = this.pendingApprovals.get(requestId);
        if (!request) return null;
        
        request.status = approved ? 'approved' : 'rejected';
        request.reviewed_at = Date.now();
        request.review_notes.push(notes);
        
        if (approved) {
            const marketplace = await this.approveMarketplace({
                domain: request.domain,
                name: request.name,
                type: request.type,
                tier: request.tier
            });
            
            return {
                status: 'approved',
                marketplace: marketplace
            };
        }
        
        return {
            status: 'rejected',
            reason: notes
        };
    }
}

module.exports = SovereignMarketplaceBackend;