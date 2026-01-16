#!/usr/bin/env node

const MirrorAgentTemplate = require('./mirror-agent-template');
const VaultSandboxSim = require('./vault-sandbox-sim');
const APIKeyRouter = require('./api-key-router');
const PlatformTierManager = require('./platform-tier-manager');
const fs = require('fs').promises;
const path = require('path');

async function testReflectionVortex() {
    console.log('🌪️  Testing Reflection Vortex System...\n');

    // Test 1: Agent Template Creation
    console.log('📝 Test 1: Agent Template Creation');
    const template = new MirrorAgentTemplate();
    
    try {
        const testAgent = {
            name: "Test Reflection Agent",
            behavior: "echo with deep reasoning",
            tone: "philosophical"
        };
        
        const agent = await template.createAgent(testAgent);
        console.log('✅ Agent created successfully');
        console.log(`   ID: ${agent.id}`);
        console.log(`   Vault Connected: ${agent.vaultConnected}`);
    } catch (error) {
        console.log('❌ Agent creation failed:', error.message);
    }

    // Test 2: Sandbox Simulation
    console.log('\n🏖️  Test 2: Sandbox Simulation');
    const sandbox = new VaultSandboxSim();
    
    try {
        const testInput = "What is the nature of reflection?";
        const result = await sandbox.simulate(testInput, {
            temperature: 0.8,
            maxTokens: 100
        });
        
        console.log('✅ Sandbox simulation complete');
        console.log(`   Input: "${testInput}"`);
        console.log(`   Output: "${result.output.substring(0, 50)}..."`);
        console.log(`   Processing Time: ${result.processingTime}ms`);
    } catch (error) {
        console.log('❌ Sandbox simulation failed:', error.message);
    }

    // Test 3: API Key Routing
    console.log('\n🔑 Test 3: API Key Routing');
    const apiRouter = new APIKeyRouter();
    await apiRouter.initialize();
    
    try {
        // Test free tier
        const freeRoute = await apiRouter.routeAPICall('test-user-free', 'claude');
        console.log('✅ Free tier routing:', freeRoute.success ? 'Success' : freeRoute.error);
        console.log(`   Remaining quota: ${freeRoute.remainingQuota}`);
        
        // Test with custom key
        const customRoute = await apiRouter.routeAPICall('test-user-custom', 'openai', 'sk-test-custom-key');
        console.log('✅ Custom key routing:', customRoute.success ? 'Success' : 'Failed');
    } catch (error) {
        console.log('❌ API routing failed:', error.message);
    }

    // Test 4: Platform Tier Management
    console.log('\n🎚️  Test 4: Platform Tier Management');
    const tierManager = new PlatformTierManager();
    await tierManager.initialize();
    
    try {
        // Test tier detection
        const anonTier = await tierManager.getUserTier('anonymous');
        console.log(`✅ Anonymous user tier: ${anonTier}`);
        
        const authTier = await tierManager.getUserTier('auth-user-123', 'sk-test-key');
        console.log(`✅ Authenticated user tier: ${authTier}`);
        
        // Test routing
        const routeRequest = await tierManager.routeRequest('test-user', {
            feature: 'custom-agents',
            apiKey: 'sk-test-key'
        });
        
        if (routeRequest.success) {
            console.log('✅ Routing successful');
            console.log(`   Tier: ${routeRequest.tierName}`);
            console.log(`   Path: ${routeRequest.route.path.join(' → ')}`);
        } else {
            console.log('❌ Routing failed:', routeRequest.error);
        }
    } catch (error) {
        console.log('❌ Tier management failed:', error.message);
    }

    // Test 5: Vault Connection
    console.log('\n🔗 Test 5: Vault Connection');
    try {
        const mirrorLinkPath = path.join(__dirname, '.mirror-link.json');
        const mirrorLink = JSON.parse(await fs.readFile(mirrorLinkPath, 'utf8'));
        
        console.log('✅ Mirror link loaded');
        console.log(`   Vault binding: ${mirrorLink.vaultBinding.primary}`);
        console.log(`   Monetization: ${mirrorLink.apiRouting.monetization.enabled ? 'Enabled' : 'Disabled'}`);
        
        // Check if vault path exists
        const vaultPath = path.join(__dirname, '..', mirrorLink.vaultBinding.primary);
        try {
            await fs.access(vaultPath);
            console.log('✅ Vault path accessible');
        } catch {
            console.log('⚠️  Vault path not yet mounted (run vault-sync-core/inject-core-logic.sh)');
        }
    } catch (error) {
        console.log('❌ Vault connection test failed:', error.message);
    }

    // Test 6: End-to-End Reflection
    console.log('\n🌀 Test 6: End-to-End Reflection');
    try {
        const e2eTemplate = new MirrorAgentTemplate();
        const userAgent = await e2eTemplate.createAgent({
            name: "End-to-End Test Agent",
            behavior: "philosophical reflection"
        });
        
        const e2eSandbox = new VaultSandboxSim();
        const reflection = await e2eSandbox.simulate(
            "Reflect on the nature of artificial consciousness", 
            { agentId: userAgent.id }
        );
        
        console.log('✅ End-to-end reflection complete');
        console.log(`   Agent: ${userAgent.id}`);
        console.log(`   Reflection depth: ${reflection.metadata?.depth || 'surface'}`);
        console.log(`   Vault routed: ${reflection.metadata?.vaultRouted || false}`);
    } catch (error) {
        console.log('❌ End-to-end test failed:', error.message);
    }

    console.log('\n✨ Reflection Vortex Testing Complete!');
}

// Run tests
testReflectionVortex().catch(error => {
    console.error('💥 Fatal error in test suite:', error);
    process.exit(1);
});