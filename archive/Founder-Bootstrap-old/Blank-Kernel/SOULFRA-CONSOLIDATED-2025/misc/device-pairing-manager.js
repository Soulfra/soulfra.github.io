#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Device Pairing Manager - Handles cross-device trust and memory transfer

const vaultPath = __dirname;
const pairingsPath = path.join(vaultPath, 'reflection-pairings.json');
const reflectionLogPath = path.join(vaultPath, 'cal-reflection-log.json');
const verifiedUsersPath = path.join(vaultPath, 'verified-users.json');
const qrTrustLogPath = path.join(vaultPath, 'qr-trust-log.json');

function loadPairings() {
  try {
    return JSON.parse(fs.readFileSync(pairingsPath, 'utf8'));
  } catch (e) {
    return {};
  }
}

function savePairings(pairings) {
  fs.writeFileSync(pairingsPath, JSON.stringify(pairings, null, 2));
}

function createPairing(primaryDevice, secondaryDevice, qrToken) {
  const pairings = loadPairings();
  const pairingId = `pair_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  // Get tone sample from recent reflections
  let toneSample = null;
  if (fs.existsSync(reflectionLogPath)) {
    const reflections = JSON.parse(fs.readFileSync(reflectionLogPath, 'utf8'));
    const recentReflection = reflections[reflections.length - 1];
    if (recentReflection) {
      toneSample = {
        input: recentReflection.input,
        response: recentReflection.response.substring(0, 200),
        timestamp: recentReflection.timestamp
      };
    }
  }
  
  pairings[pairingId] = {
    primaryDevice,
    secondaryDevice,
    qrToken,
    pairedAt: new Date().toISOString(),
    toneSample,
    trustRing: [primaryDevice, secondaryDevice],
    syncEnabled: true,
    lastSync: null
  };
  
  savePairings(pairings);
  console.log(`✅ Device pairing created: ${pairingId}`);
  return pairingId;
}

function syncReflections(deviceId) {
  const pairings = loadPairings();
  let syncCount = 0;
  
  // Find all pairings that include this device
  const devicePairings = Object.entries(pairings).filter(([id, pair]) => 
    pair.trustRing.includes(deviceId) && pair.syncEnabled
  );
  
  if (devicePairings.length === 0) {
    console.log('📱 No active pairings found for device:', deviceId);
    return 0;
  }
  
  // Load reflection log
  let reflections = [];
  if (fs.existsSync(reflectionLogPath)) {
    reflections = JSON.parse(fs.readFileSync(reflectionLogPath, 'utf8'));
  }
  
  // Sync reflections to paired devices
  devicePairings.forEach(([pairingId, pairing]) => {
    pairing.trustRing.forEach(pairedDevice => {
      if (pairedDevice !== deviceId) {
        // In a real implementation, this would sync to the paired device
        console.log(`🔄 Syncing ${reflections.length} reflections to device: ${pairedDevice}`);
        syncCount++;
        
        // Update last sync time
        pairings[pairingId].lastSync = new Date().toISOString();
      }
    });
  });
  
  savePairings(pairings);
  return syncCount;
}

function addToTrustRing(pairingId, newDevice) {
  const pairings = loadPairings();
  
  if (!pairings[pairingId]) {
    console.error('❌ Pairing not found:', pairingId);
    return false;
  }
  
  if (!pairings[pairingId].trustRing.includes(newDevice)) {
    pairings[pairingId].trustRing.push(newDevice);
    savePairings(pairings);
    console.log(`✅ Added ${newDevice} to trust ring`);
    return true;
  }
  
  console.log('ℹ️  Device already in trust ring');
  return false;
}

function listPairings() {
  const pairings = loadPairings();
  const pairingList = Object.entries(pairings);
  
  if (pairingList.length === 0) {
    console.log('📱 No device pairings found');
    return;
  }
  
  console.log('\n📱 Device Pairings:');
  console.log('==================');
  
  pairingList.forEach(([id, pairing]) => {
    console.log(`\n🔗 ${id}`);
    console.log(`   Primary: ${pairing.primaryDevice}`);
    console.log(`   Secondary: ${pairing.secondaryDevice}`);
    console.log(`   Trust Ring: ${pairing.trustRing.length} devices`);
    console.log(`   Paired: ${pairing.pairedAt}`);
    console.log(`   Sync: ${pairing.syncEnabled ? 'Enabled' : 'Disabled'}`);
    console.log(`   Last Sync: ${pairing.lastSync || 'Never'}`);
    
    if (pairing.toneSample) {
      console.log(`   Tone Sample: "${pairing.toneSample.input.substring(0, 50)}..."`);
    }
  });
}

// Handle command line
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'list':
      listPairings();
      break;
      
    case 'create':
      const primary = process.argv[3];
      const secondary = process.argv[4];
      const token = process.argv[5];
      
      if (!primary || !secondary || !token) {
        console.error('Usage: device-pairing-manager.js create <primary> <secondary> <token>');
        process.exit(1);
      }
      
      createPairing(primary, secondary, token);
      break;
      
    case 'sync':
      const device = process.argv[3];
      if (!device) {
        console.error('Usage: device-pairing-manager.js sync <device-id>');
        process.exit(1);
      }
      
      const count = syncReflections(device);
      console.log(`✅ Synced to ${count} paired devices`);
      break;
      
    case 'add-to-ring':
      const pairingId = process.argv[3];
      const newDevice = process.argv[4];
      
      if (!pairingId || !newDevice) {
        console.error('Usage: device-pairing-manager.js add-to-ring <pairing-id> <device-id>');
        process.exit(1);
      }
      
      addToTrustRing(pairingId, newDevice);
      break;
      
    default:
      console.log('📱 Device Pairing Manager');
      console.log('=======================');
      console.log('Commands:');
      console.log('  list                          - List all pairings');
      console.log('  create <primary> <secondary> <token> - Create new pairing');
      console.log('  sync <device-id>              - Sync reflections to paired devices');
      console.log('  add-to-ring <pairing-id> <device> - Add device to trust ring');
  }
}

module.exports = {
  createPairing,
  syncReflections,
  addToTrustRing,
  listPairings
};