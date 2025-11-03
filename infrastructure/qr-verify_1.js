#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

// QR Verification for Cal Riven Vault
// Verifies scanned QR codes against saved device binding

const vaultPath = __dirname;
const qrSeedPath = path.join(vaultPath, 'qr-seed.sig');
const boundToPath = path.join(vaultPath, '.bound-to');
const trustLogPath = path.join(vaultPath, 'qr-trust-log.json');

function loadQRSeed() {
  try {
    const seedData = fs.readFileSync(qrSeedPath, 'utf8');
    return JSON.parse(seedData);
  } catch (e) {
    console.error('❌ No QR seed found. Run genesis-qr.js first.');
    process.exit(1);
  }
}

function loadTrustLog() {
  try {
    const logData = fs.readFileSync(trustLogPath, 'utf8');
    return JSON.parse(logData);
  } catch (e) {
    return [];
  }
}

function saveTrustLog(log) {
  fs.writeFileSync(trustLogPath, JSON.stringify(log, null, 2));
}

function verifyQRToken(scannedData) {
  const qrSeed = loadQRSeed();
  
  // Extract token from cal-riven:// URL
  const tokenMatch = scannedData.match(/^cal-riven:\/\/([a-f0-9]{32})$/);
  if (!tokenMatch) {
    return {
      valid: false,
      reason: 'Invalid QR format. Expected: cal-riven://[token]'
    };
  }
  
  const scannedToken = tokenMatch[1];
  
  // Verify token matches
  if (scannedToken !== qrSeed.token) {
    return {
      valid: false,
      reason: 'Token mismatch. QR code is not from this vault.'
    };
  }
  
  // Verify device binding
  let currentDevice = 'unbound-device';
  try {
    currentDevice = fs.readFileSync(boundToPath, 'utf8').trim();
  } catch (e) {
    console.warn('⚠️  No device binding found');
  }
  
  // Check if same device
  const isSameDevice = currentDevice === qrSeed.payload.device;
  
  // Calculate trust score
  const ageMs = Date.now() - qrSeed.payload.time;
  const ageHours = ageMs / (1000 * 60 * 60);
  const trustScore = Math.max(0, 100 - Math.floor(ageHours * 2)); // -2 points per hour
  
  return {
    valid: true,
    token: scannedToken,
    device: qrSeed.payload.device,
    currentDevice: currentDevice,
    sameDevice: isSameDevice,
    age: {
      ms: ageMs,
      hours: ageHours.toFixed(2),
      days: (ageHours / 24).toFixed(2)
    },
    trustScore: trustScore,
    generated: qrSeed.generated
  };
}

async function interactiveVerify() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('\n📱 Enter scanned QR data (cal-riven://...): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log('🔍 Cal Riven QR Verifier');
  console.log('========================\n');
  
  // Get QR data from args or interactive
  let qrData;
  if (process.argv[2]) {
    qrData = process.argv[2];
    console.log(`🔲 Verifying: ${qrData}`);
  } else {
    qrData = await interactiveVerify();
  }
  
  // Verify the QR
  const result = verifyQRToken(qrData);
  
  if (!result.valid) {
    console.log(`\n❌ Verification failed: ${result.reason}`);
    process.exit(1);
  }
  
  // Display results
  console.log('\n✅ QR Code Verified!');
  console.log('===================');
  console.log(`📋 Token: ${result.token}`);
  console.log(`🖥️  Origin Device: ${result.device}`);
  console.log(`📱 Current Device: ${result.currentDevice}`);
  console.log(`🔗 Same Device: ${result.sameDevice ? 'Yes ✓' : 'No ✗'}`);
  console.log(`⏰ Age: ${result.age.hours} hours (${result.age.days} days)`);
  console.log(`🎯 Trust Score: ${result.trustScore}/100`);
  console.log(`📅 Generated: ${result.generated}`);
  
  // Log the verification
  const trustLog = loadTrustLog();
  trustLog.push({
    timestamp: new Date().toISOString(),
    token: result.token,
    device: result.currentDevice,
    originDevice: result.device,
    sameDevice: result.sameDevice,
    trustScore: result.trustScore,
    age: result.age
  });
  saveTrustLog(trustLog);
  
  // Handle cross-device trust
  if (!result.sameDevice) {
    console.log('\n⚠️  Cross-Device Trust Detected!');
    console.log('This QR was generated on a different device.');
    
    if (result.trustScore >= 50) {
      console.log('✅ Trust score is sufficient for pairing.');
      
      // Create pairing record
      const pairingPath = path.join(vaultPath, 'device-pairing.json');
      let pairings = {};
      try {
        pairings = JSON.parse(fs.readFileSync(pairingPath, 'utf8'));
      } catch (e) {}
      
      pairings[result.currentDevice] = {
        pairedWith: result.device,
        pairedAt: new Date().toISOString(),
        trustScore: result.trustScore,
        token: result.token
      };
      
      fs.writeFileSync(pairingPath, JSON.stringify(pairings, null, 2));
      console.log('🔗 Device pairing recorded.');
    } else {
      console.log('❌ Trust score too low for pairing. QR code is too old.');
    }
  } else {
    console.log('\n✅ Same-device verification successful!');
  }
  
  console.log('\n📊 Trust log updated: qr-trust-log.json');
}

main().catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});