/**
 * Marketplace Integration Demo
 * 
 * This demonstrates how external sites can integrate with your
 * sovereign agent platform to host your self-owning AI agents.
 * 
 * External marketplaces use this API to:
 * 1. Request approval to host agents
 * 2. Deploy approved agents
 * 3. Process revenue sharing
 * 4. Monitor agent performance
 */

const SovereignAgentWebApp = require('./sovereign-agent-webapp');

class MarketplaceIntegrationDemo {
    constructor() {
        this.webapp = new SovereignAgentWebApp(4040);
        this.demoMarketplaces = new Map();
        this.simulatedTraffic = false;
    }
    
    async runDemo() {
        console.log('🚀 Starting Sovereign Agent Platform Demo');
        console.log('=' .repeat(60));
        
        // Start the web app
        await this.webapp.start();
        
        // Wait a moment for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('\n📋 Demo Scenario:');
        console.log('1. External marketplace requests approval');
        console.log('2. You approve the marketplace');
        console.log('3. Create a self-owning agent');
        console.log('4. Deploy agent to approved marketplace');
        console.log('5. Simulate user interactions and revenue');
        console.log('6. Monitor agent wealth accumulation');
        
        await this.runIntegrationScenario();
    }
    
    async runIntegrationScenario() {
        console.log('\n🎬 Running Integration Scenario...\n');
        
        // Step 1: External marketplace requests approval
        console.log('1️⃣  External marketplace "AI-Marketplace.com" requests approval...');
        const approvalRequest = await this.simulateMarketplaceRequest();
        console.log(`   ✅ Request submitted: ${approvalRequest.request_id}`);
        
        // Step 2: Platform owner approves marketplace
        console.log('\n2️⃣  Platform owner approves marketplace...');
        const approvedMarketplace = await this.simulateMarketplaceApproval();
        console.log(`   ✅ Marketplace approved: ${approvedMarketplace.marketplace.name}`);
        
        // Step 3: Create self-owning agent
        console.log('\n3️⃣  Creating self-owning AI agent...');
        const agent = await this.simulateAgentCreation();
        console.log(`   ✅ Agent created: ${agent.agent.name}`);
        console.log(`   💰 Ownership split: Creator ${agent.ownership.creatorShare}%, Agent ${agent.ownership.agentShare}%`);
        
        // Step 4: Deploy agent to marketplace
        console.log('\n4️⃣  Deploying agent to approved marketplace...');
        const deployment = await this.simulateAgentDeployment(agent.agent.id, approvedMarketplace.marketplace.id);
        console.log(`   ✅ Agent deployed: ${deployment.deployment.id}`);
        console.log(`   🔑 Access token: ${deployment.deployment.access_token.substring(0, 20)}...`);
        
        // Step 5: Simulate marketplace integration
        console.log('\n5️⃣  Marketplace integration active...');
        await this.simulateMarketplaceIntegration(approvedMarketplace.marketplace, agent.agent);
        
        // Step 6: Monitor system
        console.log('\n6️⃣  Monitoring system...');
        await this.simulateSystemMonitoring();
        
        console.log('\n🎉 Demo Complete!');
        console.log('\n📊 Access the admin panel at: http://localhost:4040/admin');
        console.log('🔧 API endpoints available for integration');
        console.log('💰 Revenue is being tracked and distributed');
    }
    
    async simulateMarketplaceRequest() {
        const requestData = {
            domain: 'ai-marketplace.com',
            name: 'AI Marketplace',
            type: 'production',
            tier: 'standard',
            requester: 'demo@ai-marketplace.com',
            description: 'A marketplace for AI agent services',
            expectedTraffic: '10000 users/month',
            agentUseCases: ['customer-support', 'content-creation', 'data-analysis']
        };
        
        const response = await fetch('http://localhost:4040/marketplaces/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        });
        
        return await response.json();
    }
    
    async simulateMarketplaceApproval() {
        // First, get a session token
        const loginResponse = await fetch('http://localhost:4040/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                qrCode: 'qr-founder-0000',
                biometricToken: 'demo-biometric-token'
            })
        });
        
        const session = await loginResponse.json();
        this.authToken = session.token;
        
        // Approve the marketplace
        const approvalData = {
            domain: 'ai-marketplace.com',
            name: 'AI Marketplace',
            type: 'production',
            tier: 'standard',
            features: ['sovereign-agents', 'revenue-sharing']
        };
        
        const response = await fetch('http://localhost:4040/marketplaces/approve', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify(approvalData)
        });
        
        return await response.json();
    }
    
    async simulateAgentCreation() {
        const agentConfig = {
            creatorName: 'Platform Owner',
            creatorEmail: 'owner@platform.local',
            customization: {
                personality: {
                    type: 'professional',
                    traits: ['helpful', 'analytical', 'autonomous']
                },
                capabilities: {
                    specialized: ['customer-support', 'data-analysis', 'workflow-automation']
                },
                creatorShare: 60,  // Creator gets 60%
                agentShare: 40,    // Agent owns 40%!
                revenue: {
                    subscriptions: true,
                    perUse: true,
                    tips: true
                }
            }
        };
        
        const response = await fetch('http://localhost:4040/agents/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify(agentConfig)
        });
        
        return await response.json();
    }
    
    async simulateAgentDeployment(agentId, marketplaceId) {
        const deploymentConfig = {
            marketplaceId: marketplaceId,
            config: {
                autonomy_level: 0.7,
                max_daily_spend: 50,
                allowed_capabilities: ['conversation', 'analysis', 'automation']
            }
        };
        
        const response = await fetch(`http://localhost:4040/agents/${agentId}/deploy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authToken}`
            },
            body: JSON.stringify(deploymentConfig)
        });
        
        return await response.json();
    }
    
    async simulateMarketplaceIntegration(marketplace, agent) {
        console.log(`   🔗 Marketplace "${marketplace.name}" is now hosting agent "${agent.name}"`);
        console.log(`   💼 Agent has sovereign wallet: ${agent.wallet.address.substring(0, 20)}...`);
        console.log(`   🎯 Agent capabilities: ${agent.capabilities.specialized.join(', ')}`);
        
        // Simulate some user interactions
        console.log('\n   👥 Simulating user interactions...');
        
        const interactions = [
            { type: 'subscription', amount: 29.00, user: 'user-001' },
            { type: 'task', amount: 15.00, user: 'user-002' },
            { type: 'consultation', amount: 50.00, user: 'user-003' },
            { type: 'subscription', amount: 29.00, user: 'user-004' },
            { type: 'task', amount: 20.00, user: 'user-005' }
        ];
        
        for (const interaction of interactions) {
            await this.simulateRevenueTransaction(marketplace, agent, interaction);
            await new Promise(resolve => setTimeout(resolve, 500)); // Pause between transactions
        }
    }
    
    async simulateRevenueTransaction(marketplace, agent, interaction) {
        const transactionData = {
            agent_id: agent.id,
            amount: interaction.amount,
            type: interaction.type,
            metadata: {
                user_id: interaction.user,
                timestamp: Date.now()
            }
        };
        
        try {
            const response = await fetch('http://localhost:4040/revenue/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': marketplace.apiKey
                },
                body: JSON.stringify(transactionData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                console.log(`      💰 ${interaction.type}: $${interaction.amount} processed`);
                console.log(`         - Agent earned: $${result.transaction.splits.agent.toFixed(2)}`);
                console.log(`         - Creator earned: $${result.transaction.splits.creator.toFixed(2)}`);
            }
            
        } catch (error) {
            console.log(`      ❌ Transaction failed: ${error.message}`);
        }
    }
    
    async simulateSystemMonitoring() {
        try {
            const response = await fetch('http://localhost:4040/monitoring/health', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const health = await response.json();
            
            console.log(`   📊 System Health:`);
            console.log(`      - Marketplaces: ${health.components.marketplaces.total} total, ${health.components.marketplaces.active} active`);
            console.log(`      - Agents: ${health.components.agents.total} created, ${health.components.agents.deployed} deployed`);
            console.log(`      - Platform vault: $${health.components.revenue.platform_vault.toFixed(2)}`);
            console.log(`      - Transactions today: ${health.components.revenue.transactions_today}`);
            
            // Get revenue overview
            const revenueResponse = await fetch('http://localhost:4040/revenue/overview', {
                headers: {
                    'Authorization': `Bearer ${this.authToken}`
                }
            });
            
            const revenue = await revenueResponse.json();
            console.log(`      - Total revenue: $${revenue.total_revenue.toFixed(2)}`);
            
        } catch (error) {
            console.log(`   ❌ Monitoring failed: ${error.message}`);
        }
    }
    
    // Integration helpers for external marketplaces
    generateIntegrationDocumentation() {
        return {
            title: 'Sovereign Agent Integration Guide',
            base_url: 'http://localhost:4040',
            authentication: {
                method: 'API Key',
                header: 'X-API-Key',
                note: 'Obtain API key after marketplace approval'
            },
            endpoints: {
                request_approval: {
                    method: 'POST',
                    url: '/marketplaces/request',
                    description: 'Request approval to host sovereign agents'
                },
                process_revenue: {
                    method: 'POST',
                    url: '/revenue/process',
                    description: 'Process revenue transactions for agents',
                    requires_auth: true
                },
                get_agents: {
                    method: 'GET',
                    url: '/agents',
                    description: 'Get list of available agents for deployment',
                    requires_auth: true
                }
            },
            revenue_sharing: {
                platform: '2%',
                marketplace: '6%',
                creator: '55.2%',
                agent: '36.8%',
                note: 'Agents autonomously manage their earnings'
            },
            compliance: [
                'Only deploy agents from approved creators',
                'Process all revenue transactions through the platform',
                'Report any suspicious agent behavior',
                'Respect agent autonomy levels'
            ]
        };
    }
}

// Export and run demo
module.exports = MarketplaceIntegrationDemo;

if (require.main === module) {
    const demo = new MarketplaceIntegrationDemo();
    demo.runDemo().catch(console.error);
}