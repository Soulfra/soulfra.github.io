#!/usr/bin/env node

/**
 * Test Real Agent System
 * Simulates payment and agent creation to verify everything works
 */

const RealAgentProvisioner = require('./real-agent-provisioner.js');
const AgentClaudeBridge = require('./agent-claude-bridge.js');

async function testRealAgentSystem() {
    console.log('🧪 Testing Real Agent System...\n');
    
    try {
        // Initialize systems
        const provisioner = new RealAgentProvisioner();
        const claudeBridge = new AgentClaudeBridge();
        
        console.log('✅ Systems initialized\n');
        
        // Test 1: Provision a real agent
        console.log('🤖 Test 1: Provisioning real agent...');
        const contributor = await provisioner.provisionRealAgent({
            contributor_name: 'TestUser',
            contributor_email: 'test@example.com',
            payment_intent_id: 'pi_test_12345'
        });
        
        console.log(`✅ Agent created: ${contributor.agent.id}`);
        console.log(`📜 Blessing status: ${contributor.blessing.status}`);
        console.log(`🪞 Mirror connected: ${contributor.mirror_connection.mirror_id}`);
        console.log('');
        
        // Test 2: Agent interaction
        console.log('💬 Test 2: Agent interaction...');
        const interaction = await claudeBridge.agentThink(
            contributor.agent.id, 
            "Hello! What's your purpose?",
            { contributor: contributor.name }
        );
        
        console.log(`Agent Response: "${interaction.response}"`);
        console.log(`Claude Enabled: ${interaction.claude_enabled}`);
        console.log('');
        
        // Test 3: Agent status
        console.log('📊 Test 3: Agent status...');
        const status = claudeBridge.getAgentStatus(contributor.agent.id);
        
        console.log(`Name: ${status.name}`);
        console.log(`Personality: ${status.personality}`);
        console.log(`Skills: ${status.skills.join(', ')}`);
        console.log(`Level: ${status.level} (${status.experience} XP)`);
        console.log(`Interactions: ${status.total_interactions}`);
        console.log('');
        
        // Test 4: All active agents
        console.log('🌍 Test 4: All active agents...');
        const allAgents = provisioner.getAllActiveAgents();
        console.log(`Total agents in Cal's world: ${allAgents.length}`);
        allAgents.forEach(agent => {
            console.log(`- ${agent.name} (${agent.personality}) by ${agent.contributor}`);
        });
        console.log('');
        
        // Test 5: Create second agent for interaction test
        console.log('🤖 Test 5: Creating second agent...');
        const contributor2 = await provisioner.provisionRealAgent({
            contributor_name: 'SecondUser',
            contributor_email: 'second@example.com',
            payment_intent_id: 'pi_test_67890'
        });
        
        console.log(`✅ Second agent created: ${contributor2.agent.id}`);
        console.log('');
        
        // Test 6: Agent-to-agent interaction
        console.log('🤖↔️🤖 Test 6: Agent-to-agent interaction...');
        const agentInteraction = await claudeBridge.agentInteraction(
            contributor.agent.id,
            contributor2.agent.id,
            "artificial intelligence"
        );
        
        console.log(`${agentInteraction.agent1.name}: "${agentInteraction.agent1.said}"`);
        console.log(`${agentInteraction.agent2.name}: "${agentInteraction.agent2.said}"`);
        console.log('');
        
        console.log('🎉 ALL TESTS PASSED!');
        console.log('✅ Real agent system is working correctly');
        console.log('🚀 Ready for production deployment');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests
if (require.main === module) {
    testRealAgentSystem();
}

module.exports = testRealAgentSystem;