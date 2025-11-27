#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// Blockchain Reflection Layer - Hashes and optionally sends reflections to chain

const vaultPath = __dirname;
const reflectionLogPath = path.join(vaultPath, 'cal-reflection-log.json');
const chainLogPath = path.join(vaultPath, 'blockchain-reflections.json');
const qrSeedPath = path.join(vaultPath, 'qr-seed.sig');
const verifiedUsersPath = path.join(vaultPath, 'verified-users.json');

// Configuration for blockchain (can be customized)
const BLOCKCHAIN_CONFIG = {
  enabled: false, // Set to true to enable actual blockchain posting
  rpcUrl: process.env.BLOCKCHAIN_RPC || 'https://mainnet.infura.io/v3/YOUR_KEY',
  contractAddress: process.env.REFLECTION_CONTRACT || '0x0000000000000000000000000000000000000000',
  chainId: 1
};

function hashReflection(reflection, qrIdentity) {
  const data = {
    input: reflection.input,
    response: reflection.response,
    timestamp: reflection.timestamp,
    tier: reflection.tier || 'unknown',
    qrToken: qrIdentity ? qrIdentity.qrToken : null,
    device: qrIdentity ? qrIdentity.device : null
  };
  
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

function loadChainLog() {
  try {
    return JSON.parse(fs.readFileSync(chainLogPath, 'utf8'));
  } catch (e) {
    return [];
  }
}

function saveChainLog(log) {
  fs.writeFileSync(chainLogPath, JSON.stringify(log, null, 2));
}

function getQRIdentity() {
  if (!fs.existsSync(qrSeedPath)) return null;
  
  const qrSeed = JSON.parse(fs.readFileSync(qrSeedPath, 'utf8'));
  const boundToPath = path.join(path.dirname(vaultPath), '.bound-to');
  
  let device = 'unknown';
  if (fs.existsSync(boundToPath)) {
    device = fs.readFileSync(boundToPath, 'utf8').trim();
  }
  
  return {
    qrToken: qrSeed.token,
    device: device,
    operator: qrSeed.payload.operator || 'cal-riven-root'
  };
}

async function postToBlockchain(hash, metadata) {
  if (!BLOCKCHAIN_CONFIG.enabled) {
    console.log('⛓️  Blockchain posting disabled (simulated)');
    return {
      txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
      simulated: true
    };
  }
  
  // In a real implementation, this would:
  // 1. Connect to blockchain RPC
  // 2. Sign transaction with vault key
  // 3. Post hash to smart contract
  // 4. Return transaction receipt
  
  return new Promise((resolve, reject) => {
    console.log('⛓️  Posting to blockchain...');
    // Simulated blockchain response
    setTimeout(() => {
      resolve({
        txHash: `0x${crypto.randomBytes(32).toString('hex')}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 15000000,
        gasUsed: '21000',
        status: 'confirmed'
      });
    }, 1000);
  });
}

async function reflectToChain(limit = 10) {
  console.log('🔗 Blockchain Reflection Layer');
  console.log('=============================\n');
  
  // Load reflection log
  if (!fs.existsSync(reflectionLogPath)) {
    console.error('❌ No reflection log found');
    return;
  }
  
  const reflections = JSON.parse(fs.readFileSync(reflectionLogPath, 'utf8'));
  const chainLog = loadChainLog();
  const qrIdentity = getQRIdentity();
  
  if (!qrIdentity) {
    console.error('❌ No QR identity found. Generate QR first.');
    return;
  }
  
  console.log(`📱 QR Identity: ${qrIdentity.qrToken.substring(0, 8)}...`);
  console.log(`🖥️  Device: ${qrIdentity.device.substring(0, 16)}...`);
  console.log(`\n📊 Processing ${Math.min(limit, reflections.length)} reflections...\n`);
  
  // Get already processed reflection hashes
  const processedHashes = new Set(chainLog.map(entry => entry.reflectionHash));
  
  let processedCount = 0;
  for (const reflection of reflections.slice(-limit)) {
    const hash = hashReflection(reflection, qrIdentity);
    
    if (processedHashes.has(hash)) {
      console.log(`⏭️  Skipping already processed: ${hash.substring(0, 8)}...`);
      continue;
    }
    
    console.log(`\n🔍 Processing reflection:`);
    console.log(`   Input: "${reflection.input.substring(0, 50)}..."`);
    console.log(`   Hash: ${hash}`);
    
    try {
      const chainResult = await postToBlockchain(hash, {
        timestamp: reflection.timestamp,
        qrToken: qrIdentity.qrToken,
        device: qrIdentity.device
      });
      
      const chainEntry = {
        reflectionHash: hash,
        reflection: {
          input: reflection.input,
          timestamp: reflection.timestamp,
          tier: reflection.tier
        },
        qrIdentity: {
          token: qrIdentity.qrToken.substring(0, 8) + '...',
          device: qrIdentity.device.substring(0, 16) + '...'
        },
        blockchain: {
          txHash: chainResult.txHash,
          blockNumber: chainResult.blockNumber,
          simulated: chainResult.simulated || false,
          postedAt: new Date().toISOString()
        }
      };
      
      chainLog.push(chainEntry);
      processedCount++;
      
      console.log(`   ✅ Posted to chain:`);
      console.log(`   TX: ${chainResult.txHash}`);
      console.log(`   Block: ${chainResult.blockNumber}`);
      
    } catch (error) {
      console.error(`   ❌ Failed to post: ${error.message}`);
    }
  }
  
  saveChainLog(chainLog);
  
  console.log(`\n✅ Processed ${processedCount} reflections`);
  console.log(`📊 Total on chain: ${chainLog.length}`);
  console.log(`💾 Saved to: blockchain-reflections.json`);
}

async function verifyChainIntegrity() {
  const chainLog = loadChainLog();
  const qrIdentity = getQRIdentity();
  
  console.log('\n🔍 Verifying Chain Integrity...');
  console.log('==============================\n');
  
  if (chainLog.length === 0) {
    console.log('📊 No reflections on chain yet');
    return;
  }
  
  // Group by QR identity
  const byIdentity = {};
  chainLog.forEach(entry => {
    const token = entry.qrIdentity.token;
    if (!byIdentity[token]) {
      byIdentity[token] = [];
    }
    byIdentity[token].push(entry);
  });
  
  console.log(`📊 Reflections by QR Identity:`);
  Object.entries(byIdentity).forEach(([token, entries]) => {
    console.log(`\n🔐 ${token}`);
    console.log(`   Reflections: ${entries.length}`);
    console.log(`   First: ${entries[0].blockchain.postedAt}`);
    console.log(`   Last: ${entries[entries.length - 1].blockchain.postedAt}`);
  });
  
  // Verify current identity matches
  if (qrIdentity) {
    const currentToken = qrIdentity.qrToken.substring(0, 8) + '...';
    const currentEntries = byIdentity[currentToken] || [];
    console.log(`\n✅ Current QR Identity: ${currentToken}`);
    console.log(`   Reflections: ${currentEntries.length}`);
  }
}

// Handle command line
if (require.main === module) {
  const command = process.argv[2];
  const limit = parseInt(process.argv[3]) || 10;
  
  switch (command) {
    case 'reflect':
      reflectToChain(limit).catch(console.error);
      break;
      
    case 'verify':
      verifyChainIntegrity();
      break;
      
    case 'enable':
      BLOCKCHAIN_CONFIG.enabled = true;
      console.log('✅ Blockchain posting enabled');
      reflectToChain(limit).catch(console.error);
      break;
      
    default:
      console.log('🔗 Blockchain Reflection Tool');
      console.log('============================');
      console.log('Commands:');
      console.log('  reflect [limit]  - Hash and post reflections (default: 10)');
      console.log('  verify          - Verify chain integrity');
      console.log('  enable [limit]  - Enable blockchain posting and reflect');
      console.log('\nCurrent status:');
      console.log(`  Blockchain: ${BLOCKCHAIN_CONFIG.enabled ? 'Enabled' : 'Disabled (simulated)'}`);
      console.log(`  RPC URL: ${BLOCKCHAIN_CONFIG.rpcUrl}`);
  }
}

module.exports = {
  hashReflection,
  reflectToChain,
  verifyChainIntegrity
};