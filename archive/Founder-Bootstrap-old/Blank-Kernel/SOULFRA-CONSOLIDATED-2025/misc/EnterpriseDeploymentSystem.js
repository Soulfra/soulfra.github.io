#!/usr/bin/env node
/**
 * EnterpriseDeploymentSystem.js
 * Handles enterprise deployment operations based on README_SOULFRA_DEPLOY_ENTERPRISE.md
 * Integrates with Claude prompt for automated enterprise operations
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const EventEmitter = require('events');

class EnterpriseDeploymentSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.deploymentConfig = {
            frontend_port: options.frontendPort || 9999,
            api_port: options.apiPort || 7777,
            deployment_mode: options.mode || 'local-first',
            max_agents: options.maxAgents || 100,
            offline_capable: true
        };
        
        this.enterpriseComponents = {
            qr_summon_kit: null,
            runtime_table: null,
            ai_cluster_parser: null,
            agent_ecosystem: new Map(),
            loop_registry: new Map()
        };
        
        this.deploymentStats = {
            deployed_instances: 0,
            active_agents: 0,
            processed_loops: 0,
            enterprise_sessions: 0,
            last_deployment: null,
            uptime_start: new Date().toISOString()
        };
        
        this.claudePrompts = {
            enterprise_deploy: './ClaudePrompt_EnterpriseDeploy.txt'
        };
        
        this.initializeEnterpriseSystem();
    }

    async initializeEnterpriseSystem() {
        console.log('🏢 Initializing Enterprise Deployment System...');
        
        try {
            // Ensure enterprise directories exist
            await this.ensureEnterpriseDirectories();
            
            // Load enterprise configuration
            await this.loadEnterpriseConfig();
            
            // Initialize enterprise components
            await this.initializeComponents();
            
            // Set up Claude integration for enterprise operations
            await this.setupClaudeIntegration();
            
            console.log('✅ Enterprise Deployment System initialized');
            this.emit('enterprise-initialized');
            
        } catch (error) {
            console.error('💀 Enterprise deployment initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async ensureEnterpriseDirectories() {
        const enterpriseDirs = [
            './enterprise',
            './enterprise/deployments',
            './enterprise/agents',
            './enterprise/loops',
            './enterprise/onboarding',
            './enterprise/logs',
            './stream',
            './qr'
        ];
        
        for (const dir of enterpriseDirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    async loadEnterpriseConfig() {
        const configPath = './enterprise/enterprise-config.json';
        
        if (fs.existsSync(configPath)) {
            try {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                this.deploymentConfig = { ...this.deploymentConfig, ...config };
                console.log('📋 Loaded enterprise configuration');
            } catch (error) {
                console.warn('Failed to load enterprise config, using defaults');
            }
        } else {
            // Create default enterprise config
            await this.createDefaultEnterpriseConfig(configPath);
        }
    }

    async createDefaultEnterpriseConfig(configPath) {
        const defaultConfig = {
            deployment_mode: 'local-first',
            offline_capable: true,
            security: {
                local_only: true,
                require_qr_auth: true,
                session_timeout: 3600000
            },
            agent_limits: {
                max_concurrent: 100,
                memory_limit_mb: 512,
                loop_limit: 1000
            },
            onboarding: {
                qr_enabled: true,
                whisper_tutorial: true,
                agent_introduction: true
            },
            enterprise_features: {
                batch_operations: true,
                claude_automation: true,
                runtime_analytics: true,
                agent_deployment: true
            }
        };
        
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log('📝 Created default enterprise configuration');
    }

    async initializeComponents() {
        // Connect to existing QR Summon Kit if available
        try {
            const QRLoopSummonKit = require('./QRLoopSummonKit');
            this.enterpriseComponents.qr_summon_kit = new QRLoopSummonKit({
                baseUrl: `http://localhost:${this.deploymentConfig.frontend_port}`
            });
            console.log('🔗 Connected to QR Loop Summon Kit');
        } catch (error) {
            console.warn('QR Summon Kit not available:', error.message);
        }
        
        // Connect to runtime table writer
        try {
            const UnifiedRuntimeTableWriter = require('./UnifiedRuntimeTableWriter');
            this.enterpriseComponents.runtime_table = new UnifiedRuntimeTableWriter();
            console.log('🔗 Connected to Runtime Table Writer');
        } catch (error) {
            console.warn('Runtime Table Writer not available:', error.message);
        }
        
        // Connect to AI cluster parser
        try {
            const AIClusterParserFromCSV = require('./AIClusterParserFromCSV');
            this.enterpriseComponents.ai_cluster_parser = new AIClusterParserFromCSV();
            console.log('🔗 Connected to AI Cluster Parser');
        } catch (error) {
            console.warn('AI Cluster Parser not available:', error.message);
        }
    }

    async setupClaudeIntegration() {
        if (fs.existsSync(this.claudePrompts.enterprise_deploy)) {
            console.log('📝 Claude enterprise prompt available');
            
            // Schedule periodic Claude enterprise operations
            setInterval(async () => {
                await this.executeClaudeEnterpriseOperations();
            }, 30 * 60 * 1000); // Every 30 minutes
        }
    }

    async executeClaudeEnterpriseOperations() {
        console.log('🤖 Executing Claude enterprise operations...');
        
        try {
            // Read current runtime state
            const runtimeData = await this.gatherRuntimeData();
            
            // Generate Claude prompt with enterprise context
            const prompt = await this.generateEnterprisePrompt(runtimeData);
            
            // Log enterprise operation to runtime table
            if (this.enterpriseComponents.runtime_table) {
                await this.enterpriseComponents.runtime_table.logTask({
                    task_source: 'enterprise_claude_automation',
                    tone: 'analytical',
                    agent: 'enterprise_system'
                }, 'processing');
            }
            
            // Save prompt for Claude execution
            const promptPath = './queue/enterprise-operation-prompt.txt';
            fs.writeFileSync(promptPath, prompt);
            
            console.log('📤 Enterprise Claude prompt generated and queued');
            this.emit('claude-operation-queued', { prompt, runtimeData });
            
        } catch (error) {
            console.error('Failed to execute Claude enterprise operations:', error.message);
        }
    }

    async gatherRuntimeData() {
        const runtimeData = {
            timestamp: new Date().toISOString(),
            deployment_stats: this.deploymentStats,
            agent_count: this.enterpriseComponents.agent_ecosystem.size,
            loop_count: this.enterpriseComponents.loop_registry.size,
            system_health: 'operational'
        };
        
        // Get runtime table data if available
        if (this.enterpriseComponents.runtime_table) {
            try {
                const recentEntries = await this.enterpriseComponents.runtime_table.getRecentEntries(20);
                runtimeData.recent_activity = recentEntries;
            } catch (error) {
                console.warn('Failed to get runtime table data:', error.message);
            }
        }
        
        // Get AI analysis if available
        if (this.enterpriseComponents.ai_cluster_parser) {
            try {
                const analysis = this.enterpriseComponents.ai_cluster_parser.getAnalysisResults();
                runtimeData.ai_insights = analysis;
            } catch (error) {
                console.warn('Failed to get AI analysis:', error.message);
            }
        }
        
        return runtimeData;
    }

    async generateEnterprisePrompt(runtimeData) {
        const basePrompt = fs.readFileSync(this.claudePrompts.enterprise_deploy, 'utf8');
        
        const enterpriseContext = `
ENTERPRISE DEPLOYMENT CONTEXT:
==============================

Deployment Stats:
- Active Instances: ${runtimeData.deployment_stats.deployed_instances}
- Agent Count: ${runtimeData.agent_count}
- Loop Count: ${runtimeData.loop_count}
- Enterprise Sessions: ${runtimeData.deployment_stats.enterprise_sessions}
- Uptime: ${runtimeData.deployment_stats.uptime_start}

Recent Runtime Activity:
${runtimeData.recent_activity ? runtimeData.recent_activity.map(entry => 
    `- ${entry.type}: ${entry.agent} | ${entry.status} | ${entry.timestamp}`
).join('\n') : 'No recent activity data available'}

AI Insights:
${runtimeData.ai_insights ? JSON.stringify(runtimeData.ai_insights.suggestions, null, 2) : 'No AI insights available'}

Current System Health: ${runtimeData.system_health}

==============================

${basePrompt}

ENTERPRISE SPECIFIC INSTRUCTIONS:
- Focus on enterprise scalability (current limit: ${this.deploymentConfig.max_agents} agents)
- Prioritize local-first, offline-capable operations
- Consider QR-based onboarding flows for enterprise users
- Suggest loop optimizations for business workflows
- Identify opportunities for agent automation in enterprise contexts
`;
        
        return enterpriseContext;
    }

    // Enterprise deployment methods
    async deployToEnterprise(enterpriseConfig = {}) {
        console.log('🚀 Starting enterprise deployment...');
        
        const deployment = {
            deploymentId: `enterprise_${Date.now()}`,
            timestamp: new Date().toISOString(),
            config: { ...this.deploymentConfig, ...enterpriseConfig },
            status: 'deploying'
        };
        
        try {
            // Step 1: Validate enterprise environment
            await this.validateEnterpriseEnvironment();
            
            // Step 2: Generate QR codes for enterprise onboarding
            await this.generateEnterpriseQRCodes();
            
            // Step 3: Set up agent ecosystem for enterprise
            await this.deployEnterpriseAgents();
            
            // Step 4: Configure loop registry for enterprise workflows
            await this.configureEnterpriseLoops();
            
            // Step 5: Start enterprise monitoring
            await this.startEnterpriseMonitoring();
            
            deployment.status = 'deployed';
            this.deploymentStats.deployed_instances++;
            this.deploymentStats.last_deployment = deployment.timestamp;
            
            console.log(`✅ Enterprise deployment complete: ${deployment.deploymentId}`);
            this.emit('enterprise-deployed', deployment);
            
            return deployment;
            
        } catch (error) {
            deployment.status = 'failed';
            deployment.error = error.message;
            
            console.error('💀 Enterprise deployment failed:', error.message);
            this.emit('enterprise-deployment-failed', deployment);
            
            throw error;
        }
    }

    async validateEnterpriseEnvironment() {
        console.log('🔍 Validating enterprise environment...');
        
        // Check required components
        const requiredComponents = [
            './unified-server-minimal.js',
            './UnifiedRuntimeTableWriter.js',
            './QRLoopSummonKit.js'
        ];
        
        for (const component of requiredComponents) {
            if (!fs.existsSync(component)) {
                throw new Error(`Required component missing: ${component}`);
            }
        }
        
        // Check port availability
        await this.checkPortAvailability(this.deploymentConfig.frontend_port);
        await this.checkPortAvailability(this.deploymentConfig.api_port);
        
        console.log('✅ Enterprise environment validated');
    }

    async checkPortAvailability(port) {
        return new Promise((resolve, reject) => {
            const server = require('net').createServer();
            
            server.listen(port, () => {
                server.once('close', () => resolve(true));
                server.close();
            });
            
            server.on('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    console.log(`ℹ️ Port ${port} already in use (expected for running system)`);
                    resolve(true); // Port in use is okay for running system
                } else {
                    reject(err);
                }
            });
        });
    }

    async generateEnterpriseQRCodes() {
        console.log('📱 Generating enterprise QR codes...');
        
        if (this.enterpriseComponents.qr_summon_kit) {
            // Generate enterprise-specific loops
            const enterpriseLoops = [
                {
                    loopId: 'Enterprise_Onboarding',
                    template: {
                        tone: 'Professional Welcome',
                        agent: 'Enterprise_Guide',
                        description: 'Welcome to Soulfra Enterprise Platform',
                        spawn_origin: 'enterprise_onboarding'
                    }
                },
                {
                    loopId: 'Enterprise_Support',
                    template: {
                        tone: 'Helpful Support',
                        agent: 'Support_Agent',
                        description: 'Enterprise support and assistance',
                        spawn_origin: 'enterprise_support'
                    }
                }
            ];
            
            for (const loop of enterpriseLoops) {
                await this.enterpriseComponents.qr_summon_kit.generateCustomLoopQR(
                    loop.loopId, 
                    loop.template
                );
            }
        }
        
        console.log('✅ Enterprise QR codes generated');
    }

    async deployEnterpriseAgents() {
        console.log('🤖 Deploying enterprise agents...');
        
        const enterpriseAgents = [
            {
                agentId: 'enterprise_onboarding_agent',
                name: 'Enterprise Guide',
                role: 'onboarding',
                capabilities: ['user_guidance', 'loop_introduction', 'whisper_assistance']
            },
            {
                agentId: 'enterprise_support_agent', 
                name: 'Support Agent',
                role: 'support',
                capabilities: ['troubleshooting', 'feature_explanation', 'escalation']
            },
            {
                agentId: 'enterprise_analytics_agent',
                name: 'Analytics Agent',
                role: 'analytics',
                capabilities: ['data_analysis', 'reporting', 'optimization_suggestions']
            }
        ];
        
        for (const agent of enterpriseAgents) {
            this.enterpriseComponents.agent_ecosystem.set(agent.agentId, {
                ...agent,
                status: 'active',
                deployed_at: new Date().toISOString(),
                instance_count: 1
            });
            
            // Log agent deployment to runtime table
            if (this.enterpriseComponents.runtime_table) {
                await this.enterpriseComponents.runtime_table.logAgent({
                    agent_name: agent.name,
                    agent_id: agent.agentId,
                    personality: agent.role,
                    source: 'enterprise_deployment'
                }, 'stable');
            }
        }
        
        this.deploymentStats.active_agents = this.enterpriseComponents.agent_ecosystem.size;
        
        console.log(`✅ Deployed ${enterpriseAgents.length} enterprise agents`);
    }

    async configureEnterpriseLoops() {
        console.log('🔄 Configuring enterprise loops...');
        
        const enterpriseLoops = [
            {
                loopId: 'employee_onboarding_workflow',
                name: 'Employee Onboarding Workflow',
                stages: ['welcome', 'introduction', 'training', 'assignment'],
                agent: 'enterprise_onboarding_agent'
            },
            {
                loopId: 'customer_feedback_collection',
                name: 'Customer Feedback Collection',
                stages: ['survey', 'analysis', 'response', 'followup'],
                agent: 'enterprise_support_agent'
            },
            {
                loopId: 'business_process_optimization',
                name: 'Business Process Optimization',
                stages: ['assessment', 'analysis', 'recommendations', 'implementation'],
                agent: 'enterprise_analytics_agent'
            }
        ];
        
        for (const loop of enterpriseLoops) {
            this.enterpriseComponents.loop_registry.set(loop.loopId, {
                ...loop,
                status: 'configured',
                created_at: new Date().toISOString(),
                execution_count: 0
            });
            
            // Log loop configuration to runtime table
            if (this.enterpriseComponents.runtime_table) {
                await this.enterpriseComponents.runtime_table.logLoop({
                    loop_id: loop.loopId,
                    emotional_tone: 'professional',
                    agent: loop.agent,
                    source: 'enterprise_configuration'
                }, 'pending');
            }
        }
        
        this.deploymentStats.processed_loops = this.enterpriseComponents.loop_registry.size;
        
        console.log(`✅ Configured ${enterpriseLoops.length} enterprise loops`);
    }

    async startEnterpriseMonitoring() {
        console.log('📊 Starting enterprise monitoring...');
        
        // Set up periodic monitoring
        setInterval(async () => {
            await this.performEnterpriseHealthCheck();
        }, 5 * 60 * 1000); // Every 5 minutes
        
        // Set up enterprise analytics
        setInterval(async () => {
            await this.generateEnterpriseAnalytics();
        }, 15 * 60 * 1000); // Every 15 minutes
        
        console.log('✅ Enterprise monitoring started');
    }

    async performEnterpriseHealthCheck() {
        const healthData = {
            timestamp: new Date().toISOString(),
            agents: {
                total: this.enterpriseComponents.agent_ecosystem.size,
                active: Array.from(this.enterpriseComponents.agent_ecosystem.values())
                    .filter(agent => agent.status === 'active').length
            },
            loops: {
                total: this.enterpriseComponents.loop_registry.size,
                configured: Array.from(this.enterpriseComponents.loop_registry.values())
                    .filter(loop => loop.status === 'configured').length
            },
            deployment_stats: this.deploymentStats
        };
        
        this.emit('enterprise-health-check', healthData);
        
        return healthData;
    }

    async generateEnterpriseAnalytics() {
        const analytics = {
            timestamp: new Date().toISOString(),
            period: '15min',
            metrics: {
                agent_utilization: this.calculateAgentUtilization(),
                loop_effectiveness: this.calculateLoopEffectiveness(),
                user_engagement: this.calculateUserEngagement()
            },
            recommendations: await this.generateEnterpriseRecommendations()
        };
        
        // Save analytics to enterprise logs
        const analyticsPath = `./enterprise/logs/analytics-${Date.now()}.json`;
        fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
        
        this.emit('enterprise-analytics', analytics);
        
        return analytics;
    }

    calculateAgentUtilization() {
        const totalAgents = this.enterpriseComponents.agent_ecosystem.size;
        const activeAgents = Array.from(this.enterpriseComponents.agent_ecosystem.values())
            .filter(agent => agent.status === 'active').length;
        
        return totalAgents > 0 ? (activeAgents / totalAgents) * 100 : 0;
    }

    calculateLoopEffectiveness() {
        const totalLoops = this.enterpriseComponents.loop_registry.size;
        const executedLoops = Array.from(this.enterpriseComponents.loop_registry.values())
            .filter(loop => loop.execution_count > 0).length;
        
        return totalLoops > 0 ? (executedLoops / totalLoops) * 100 : 0;
    }

    calculateUserEngagement() {
        // Simple metric based on enterprise sessions
        return Math.min(this.deploymentStats.enterprise_sessions * 10, 100);
    }

    async generateEnterpriseRecommendations() {
        const recommendations = [];
        
        const agentUtilization = this.calculateAgentUtilization();
        if (agentUtilization < 50) {
            recommendations.push({
                type: 'agent_optimization',
                priority: 'medium',
                message: 'Low agent utilization detected. Consider agent consolidation or new use cases.'
            });
        }
        
        const loopEffectiveness = this.calculateLoopEffectiveness();
        if (loopEffectiveness < 70) {
            recommendations.push({
                type: 'loop_optimization',
                priority: 'high',
                message: 'Loop effectiveness below threshold. Review loop configurations and user flows.'
            });
        }
        
        return recommendations;
    }

    // API methods
    getEnterpriseStatus() {
        return {
            timestamp: new Date().toISOString(),
            deployment_config: this.deploymentConfig,
            deployment_stats: this.deploymentStats,
            components: {
                agents: this.enterpriseComponents.agent_ecosystem.size,
                loops: this.enterpriseComponents.loop_registry.size,
                qr_summon_kit: this.enterpriseComponents.qr_summon_kit ? 'connected' : 'unavailable',
                runtime_table: this.enterpriseComponents.runtime_table ? 'connected' : 'unavailable',
                ai_cluster_parser: this.enterpriseComponents.ai_cluster_parser ? 'connected' : 'unavailable'
            }
        };
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Enterprise Deployment System...');
        this.removeAllListeners();
    }
}

module.exports = EnterpriseDeploymentSystem;

// CLI execution
if (require.main === module) {
    const enterpriseSystem = new EnterpriseDeploymentSystem();
    
    enterpriseSystem.on('enterprise-initialized', () => {
        console.log('Enterprise Deployment System initialized successfully');
        
        const status = enterpriseSystem.getEnterpriseStatus();
        console.log('Enterprise status:', JSON.stringify(status, null, 2));
    });
    
    enterpriseSystem.on('enterprise-deployed', (deployment) => {
        console.log(`🚀 Enterprise deployed: ${deployment.deploymentId}`);
    });
    
    enterpriseSystem.on('claude-operation-queued', (event) => {
        console.log('🤖 Claude enterprise operation queued');
    });
    
    enterpriseSystem.on('enterprise-health-check', (health) => {
        console.log(`💓 Enterprise health: ${health.agents.active}/${health.agents.total} agents, ${health.loops.configured}/${health.loops.total} loops`);
    });
    
    enterpriseSystem.on('error', (error) => {
        console.error('Enterprise deployment system error:', error.message);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down enterprise deployment system...');
        await enterpriseSystem.cleanup();
        process.exit(0);
    });
}