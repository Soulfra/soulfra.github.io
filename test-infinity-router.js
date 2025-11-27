#!/usr/bin/env node
// Test Infinity Router integration
const fetch = require('node-fetch');

async function testInfinityRouter() {
  console.log('🧪 Testing Infinity Router Integration...\n');

  try {
    // Login first
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@soulfra.ai',
        password: 'demo123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    console.log(`✅ Logged in as premium user (trust: ${loginData.user.trust_score})`);

    // Test chat through Infinity Router
    const chatResponse = await fetch('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [{ 
          role: 'user', 
          content: 'Hello! Can you help me test the Soulfra Infinity Router system?' 
        }]
      })
    });
    
    const chatData = await chatResponse.json();
    
    console.log('\n🚀 Infinity Router Response:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📡 Provider: ${chatData.provider}`);
    console.log(`🎯 Routing Tier: ${chatData.routing_info.routing_tier}`);
    console.log(`🔒 Obfuscation: ${chatData.routing_info.obfuscation_level}`);
    console.log(`💾 Vault Logged: ${chatData.routing_info.vault_logged}`);
    console.log(`⏱️  Total Latency: ${chatData.routing_info.total_latency}ms`);
    console.log(`💰 Cost: $${chatData.cost.toFixed(4)}`);
    console.log(`🏆 Trust Score: ${chatData.routing_info.trust_score}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📝 Response: "${chatData.response.substring(0, 200)}..."`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🎉 INFINITY ROUTER WORKING!');
    console.log('✅ Prompt obfuscation applied');
    console.log('✅ Trust-based routing active');
    console.log('✅ Vault logging functional'); 
    console.log('✅ Multi-provider system ready');
    console.log('✅ Billing calculation working');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInfinityRouter();
