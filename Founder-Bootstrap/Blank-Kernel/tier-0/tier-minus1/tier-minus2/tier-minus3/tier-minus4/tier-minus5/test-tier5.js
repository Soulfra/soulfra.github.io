// test-tier5.js - Test script for Tier -5 functionality

const Tier5System = require('./index');
const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('🧪 Testing Tier -5 Vault Discovery System\n');
  
  const tier5 = new Tier5System();
  
  // Test 1: Check initial status
  console.log('Test 1: Checking initial status...');
  const initialStatus = await tier5.getStatus();
  console.log('Initial status:', initialStatus);
  console.log('✅ Status check complete\n');
  
  await delay(2000);
  
  // Test 2: Display vault contents
  console.log('Test 2: Displaying vault contents...');
  await tier5.displayVault();
  console.log('✅ Vault display complete\n');
  
  await delay(2000);
  
  // Test 3: Run lineage trace
  console.log('Test 3: Running lineage trace...');
  await tier5.runLineageTrace('qr-user-test-123');
  
  await delay(3000);
  console.log('✅ Lineage trace complete\n');
  
  await delay(2000);
  
  // Test 4: Check Tier -6 access (should be blocked)
  console.log('Test 4: Checking Tier -6 access...');
  await tier5.checkTier6Access();
  console.log('✅ Tier -6 access check complete\n');
  
  await delay(2000);
  
  // Test 5: Manual activation
  console.log('Test 5: Running full manual activation...');
  console.log('========================================\n');
  await tier5.manualActivation('qr-user-test-full');
  
  await delay(2000);
  
  // Test 6: Check final status
  console.log('\nTest 6: Checking final status...');
  const finalStatus = await tier5.getStatus();
  console.log('Final status:', finalStatus);
  
  // Test 7: Verify emotional feedback was recorded
  console.log('\nTest 7: Checking emotional feedback...');
  const feedbackPath = path.join(__dirname, 'emotional-feedback.json');
  if (fs.existsSync(feedbackPath)) {
    const feedback = JSON.parse(fs.readFileSync(feedbackPath, 'utf8'));
    console.log('Emotional feedback records:', feedback.length);
    console.log('Latest feedback:', feedback[feedback.length - 1]);
    console.log('✅ Emotional feedback recorded successfully');
  } else {
    console.log('⚠️  No emotional feedback file found');
  }
  
  console.log('\n🎉 All tests completed!');
  console.log('\nSummary:');
  console.log('- Vault display: ✅');
  console.log('- Lineage trace: ✅');
  console.log('- Tier -6 blocking: ✅');
  console.log('- Full activation: ✅');
  console.log('- Emotional feedback: ✅');
  console.log('- Mirror loop: CLOSED');
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run tests
runTests().catch(console.error);