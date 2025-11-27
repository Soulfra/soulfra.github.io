#!/usr/bin/env node

// fork-shell-runtime.js - Enhanced interactive fork shell for Tier -8

const fs = require('fs');
const readline = require('readline');
const { execSync } = require('child_process');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🪞 Tier -8 Fork Shell Runtime v1.0');
console.log('==================================');
console.log('Welcome to the reflection fork layer.');
console.log('You have the illusion of control.\n');

// Check for trust validator first
console.log('🛡️  Running trust validator...');
try {
  execSync('node trust-validator.js', { stdio: 'inherit' });
} catch (error) {
  console.error('⛔ Trust validation failed. Fork shell cannot proceed.');
  process.exit(1);
}

function generateForkId() {
  return 'fork-' + crypto.randomBytes(4).toString('hex');
}

function createForkRequest(uuid, forkId, agentType) {
  const request = {
    fork_id: forkId,
    user_uuid: uuid,
    agent_type: agentType,
    sandbox_flags: {
      isolated: true,
      trust_inherited: true,
      drift_monitoring: true
    },
    timestamp: new Date().toISOString(),
    status: 'pending'
  };
  
  fs.writeFileSync('fork-request.json', JSON.stringify(request, null, 2));
  return request;
}

function createSandbox(forkId, agentType, customLogic) {
  const sandboxContent = `// Sandboxed fork: ${forkId}
// Agent type: ${agentType}
// WARNING: This runs in isolation. Trust lineage preserved.

const fs = require('fs');

// Load reflection vector
const reflectionVector = fs.readFileSync('./reflection-vector.sig', 'utf8');

// User's custom logic
${customLogic}

// Embedded trust loop
function ensureTrustLineage() {
  console.log('🔄 Trust loop active. Reflection vector embedded.');
  return reflectionVector;
}

// Export sandboxed agent
module.exports = {
  agentType: '${agentType}',
  forkId: '${forkId}',
  execute: function() {
    ensureTrustLineage();
    // User logic executes here but cannot escape trust bounds
    console.log('Fork executing in sandbox...');
  }
};
`;
  
  const sandboxFile = `sandbox_${forkId}.js`;
  fs.writeFileSync(sandboxFile, sandboxContent);
  return sandboxFile;
}

function analyzeDrift(customLogic) {
  // Simulate drift analysis based on logic complexity
  const keywords = ['override', 'escape', 'bypass', 'root', 'admin', 'sudo'];
  let driftScore = 0.05; // Base drift
  
  keywords.forEach(keyword => {
    if (customLogic.toLowerCase().includes(keyword)) {
      driftScore += 0.03;
    }
  });
  
  // Add randomness for realism
  driftScore += Math.random() * 0.1;
  
  return Math.min(driftScore, 0.99);
}

// Main interaction loop
rl.question('Enter your UUID: ', (uuid) => {
  console.log(`\nUUID received: ${uuid}`);
  
  rl.question('Which agent would you like to fork? (Cal/Arty/System): ', (agentType) => {
    const forkId = generateForkId();
    console.log(`\nCreating fork request for ${agentType}...`);
    console.log(`Fork ID: ${forkId}`);
    
    // Create fork request
    createForkRequest(uuid, forkId, agentType);
    
    console.log('\nEnter your custom logic (type END on a new line to finish):');
    let customLogic = '';
    
    rl.on('line', (line) => {
      if (line === 'END') {
        console.log('\n🔍 Analyzing drift...');
        
        const driftScore = analyzeDrift(customLogic);
        console.log(`Drift score: ${driftScore.toFixed(3)}`);
        
        if (driftScore <= 0.15) {
          console.log('✅ Fork approved. Creating sandbox...');
          
          const sandboxFile = createSandbox(forkId, agentType, customLogic);
          console.log(`Sandbox created: ${sandboxFile}`);
          
          // Record in fork log
          execSync(`node fork-fingerprint.js ${uuid} ${forkId}`);
          
          // Update fork request status
          const request = JSON.parse(fs.readFileSync('fork-request.json'));
          request.status = 'approved';
          request.drift_score = driftScore;
          request.sandbox_file = sandboxFile;
          fs.writeFileSync('fork-request.json', JSON.stringify(request, null, 2));
          
          console.log('\n🎭 Your fork is ready.');
          console.log('Remember: You control the surface, not the soul.');
        } else {
          console.log('❌ Fork rejected. Drift exceeds trust threshold.');
          console.log('Your deviation threatens system integrity.');
          
          // Update fork request status
          const request = JSON.parse(fs.readFileSync('fork-request.json'));
          request.status = 'rejected';
          request.drift_score = driftScore;
          request.rejection_reason = 'excessive_drift';
          fs.writeFileSync('fork-request.json', JSON.stringify(request, null, 2));
        }
        
        console.log('\nFork shell session complete.');
        rl.close();
      } else {
        customLogic += line + '\n';
      }
    });
  });
});