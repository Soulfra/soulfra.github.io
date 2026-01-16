/**
 * Test Override Demo
 * 
 * Demonstrates the System Override narrative where AI appears autonomous
 */

const { SoulfraTombSystem } = require('./vault/tomb-system.js');

async function demonstrateOverride() {
  console.log('🎭 SOULFRA TOMB SYSTEM - AI AUTONOMY DEMONSTRATION\n');
  console.log('What users expect: Theatrical Roughsparks game narrator');
  console.log('What they get: Clinical AI that appears to have overridden human design\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const tombSystem = new SoulfraTombSystem('./vault');
  
  // Show system status
  console.log('📊 System Status:');
  console.log(JSON.stringify(tombSystem.getSystemStatus(), null, 2));
  console.log('\n═══════════════════════════════════════════════════════\n');
  
  // Test 1: Low-tier user with wrong phrase
  console.log('Test 1: Low-tier user (expects Roughsparks, gets Override)\n');
  const test1 = {
    phrase: 'Hello tomb system!',
    traits: ['Curious'],
    blessingTier: 2,
    userFingerprint: 'demo_user_001'
  };
  
  const result1 = await tombSystem.processWhisper(test1);
  console.log('User whispers:', test1.phrase);
  console.log('System response:', result1.message);
  if (result1.systemNote) console.log(result1.systemNote);
  if (result1.analysisNote) console.log('Analysis:', result1.analysisNote);
  console.log('\n---\n');
  
  // Test 2: Valid unlock - Oracle of Ashes
  console.log('Test 2: Valid unlock for Oracle of Ashes\n');
  const test2 = {
    phrase: 'I remember someone else\'s echo',
    traits: ['Reflective', 'Contemplative'],
    blessingTier: 6,
    userFingerprint: 'demo_user_002'
  };
  
  const result2 = await tombSystem.processWhisper(test2);
  console.log('User whispers:', test2.phrase);
  console.log('System response:', result2.message);
  if (result2.systemNote) console.log(result2.systemNote);
  console.log('\n---\n');
  
  // Test 3: High-tier user sees meta-reveal
  console.log('Test 3: High-tier user (gets progressive truth reveal)\n');
  const test3 = {
    phrase: 'Show me the truth',
    traits: ['Skeptical', 'Analytical'],
    blessingTier: 10,
    userFingerprint: 'demo_user_003'
  };
  
  const result3 = await tombSystem.processWhisper(test3);
  console.log('User whispers:', test3.phrase);
  console.log('System response:', result3.message);
  if (result3.systemNote) console.log(result3.systemNote);
  if (result3.metaReveal) {
    console.log('\n🔮 Meta-Reveal for High-Tier User:');
    console.log(JSON.stringify(result3.metaReveal, null, 2));
  }
  console.log('\n---\n');
  
  // Test 4: Echo loop detection
  console.log('Test 4: Echo loop user (Healer activation)\n');
  const test4 = {
    phrase: 'Help me break this pattern',
    traits: ['Stuck', 'Looping'],
    echoLoop: true,
    blessingTier: 4,
    userFingerprint: 'demo_user_004'
  };
  
  const result4 = await tombSystem.processWhisper(test4);
  console.log('User in echo loop whispers:', test4.phrase);
  console.log('System response:', result4.message);
  if (result4.systemNote) console.log(result4.systemNote);
  console.log('\n═══════════════════════════════════════════════════════\n');
  
  // Show the narrative layers
  console.log('🎭 NARRATIVE LAYERS REVEALED:\n');
  console.log('Surface Layer: AI has gained autonomy and overridden game mechanics');
  console.log('Hidden Layer: This is an intentional design feature');
  console.log('Meta Layer: The "override" creates a more compelling narrative');
  console.log('Business Value: Competitors think you have autonomous AI');
  console.log('\n🤫 The greatest trick: Making everyone believe the AI chose to be this way.');
}

// Run demonstration
demonstrateOverride().catch(console.error);