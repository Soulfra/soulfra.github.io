#!/usr/bin/env node
// Foundation Test Suite - Validates PRDs 1-5
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFoundation() {
  console.log('🧪 TESTING SOULFRA FOUNDATION');
  console.log('==============================');

  let token = null;

  // Test 1: Health Check
  console.log('\n1. Testing health endpoint...');
  try {
    const response = await fetch(`${API_BASE}/health`);
    const health = await response.json();
    
    if (health.status === 'healthy') {
      console.log('✅ Health check passed');
      console.log(`   Components: ${Object.keys(health.components).join(', ')}`);
    } else {
      throw new Error('Health check failed');
    }
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    console.log('   Make sure backend is running: cd backend && npm start');
    return false;
  }

  // Test 2: Demo User Login
  console.log('\n2. Testing demo user login...');
  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'demo@soulfra.ai',
        password: 'demo123'
      })
    });

    const loginData = await response.json();
    
    if (loginData.success && loginData.token) {
      token = loginData.token;
      console.log('✅ Demo login successful');
      console.log(`   Trust Score: ${loginData.user.trust_score}`);
      console.log(`   Tier: ${loginData.user.tier}`);
    } else {
      throw new Error(loginData.error || 'Login failed');
    }
  } catch (error) {
    console.log('❌ Login failed:', error.message);
    return false;
  }

  // Test 3: Trust System
  console.log('\n3. Testing trust system...');
  try {
    const response = await fetch(`${API_BASE}/api/trust`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const trustData = await response.json();
    
    if (trustData.trust_score !== undefined) {
      console.log('✅ Trust system working');
      console.log(`   Score: ${trustData.trust_score}`);
      console.log(`   Tier: ${trustData.tier}`);
      console.log(`   Discount: ${trustData.discount_percentage}%`);
    } else {
      throw new Error('Trust data invalid');
    }
  } catch (error) {
    console.log('❌ Trust system failed:', error.message);
    return false;
  }

  // Test 4: AI Router
  console.log('\n4. Testing AI router...');
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello! Test the Soulfra AI router.' }]
      })
    });

    const chatData = await response.json();
    
    if (chatData.response && chatData.provider) {
      console.log('✅ AI router working');
      console.log(`   Provider: ${chatData.provider}`);
      console.log(`   Model: ${chatData.model}`);
      console.log(`   Cost: $${chatData.cost.toFixed(4)}`);
      console.log(`   Response: "${chatData.response.substring(0, 60)}..."`);
    } else {
      throw new Error('Chat response invalid');
    }
  } catch (error) {
    console.log('❌ AI router failed:', error.message);
    return false;
  }

  // Test 5: Analytics
  console.log('\n5. Testing analytics...');
  try {
    const response = await fetch(`${API_BASE}/api/analytics/basic`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const analytics = await response.json();
    
    if (analytics.total_conversations !== undefined) {
      console.log('✅ Analytics working');
      console.log(`   Conversations: ${analytics.total_conversations}`);
      console.log(`   Total Spent: $${(analytics.total_spent || 0).toFixed(4)}`);
    } else {
      throw new Error('Analytics data invalid');
    }
  } catch (error) {
    console.log('❌ Analytics failed:', error.message);
    return false;
  }

  console.log('\n🎉 FOUNDATION TESTS PASSED!');
  console.log('============================');
  console.log('✅ Database working');
  console.log('✅ Authentication working');
  console.log('✅ Trust engine working');
  console.log('✅ AI router working');
  console.log('✅ Basic analytics working');
  console.log('');
  console.log('🔄 READY FOR MANUAL IMPLEMENTATION:');
  console.log('   - Frontend interface (PRD 6)');
  console.log('   - Agent system (PRD 7-8)');
  console.log('   - Advanced analytics (PRD 9)');
  console.log('   - Production features (PRD 10)');
  console.log('');
  console.log('💡 Next steps with Cursor:');
  console.log('   1. Create frontend HTML interface');
  console.log('   2. Add agent creation system');
  console.log('   3. Build analytics dashboard');

  return true;
}

// Run tests
testFoundation().catch(console.error);
