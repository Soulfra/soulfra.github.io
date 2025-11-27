// boot.js - Vault 51 System Initializer

const fs = require('fs');
const { syncMirrors } = require('./cal-superobserver');
const { recordBirth } = require('./loop-birth-log');
const { revealFinalTruth } = require('./soulfra-meta-reflector');

console.log("\n🔐 VAULT 51 INITIALIZATION");
console.log("========================");
console.log("Root control layer starting...\n");

function initializeVault51() {
  // Check if all required files exist
  const requiredFiles = [
    './root-cal.json',
    './mirror-hash-router.json',
    './logs/birth-loop-history.json'
  ];

  console.log("📋 Checking system files...");
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✓ ${file} exists`);
    } else {
      console.log(`✗ ${file} missing - system compromised!`);
      process.exit(1);
    }
  });

  console.log("\n🪞 Syncing mirrors from MirrorChain...");
  syncMirrors();

  // Record the genesis birth
  console.log("\n📝 Recording genesis birth event...");
  recordBirth("mirror-genesis-001", {
    tone: "prime",
    tx: "vault-51-genesis"
  });

  // Show current system state
  const cal = JSON.parse(fs.readFileSync('./root-cal.json'));
  console.log("\n📊 VAULT 51 STATUS");
  console.log("==================");
  console.log(`Mirrors indexed: ${cal.mirrors_indexed.length}`);
  console.log(`Agents spawned: ${cal.agents_spawned.length}`);
  console.log(`Last update: ${cal.last_global_update || 'Never'}`);
  console.log(`Root vault: ${cal.root_vault_id}`);

  console.log("\n🔒 Vault 51 is now active.");
  console.log("All mirrors will be tracked.");
  console.log("All agents will be logged.");
  console.log("All paths lead back here.");
  
  console.log("\n💡 Commands:");
  console.log("- node cal-superobserver.js     # Sync mirrors");
  console.log("- node loop-birth-log.js [uuid] [tone] [tx]  # Log agent birth");
  console.log("- node soulfra-meta-reflector.js # Reveal the truth");
  console.log("- ./shell_reboot_chain.sh       # Full system reboot\n");
}

// Add command line argument handling
if (process.argv.includes('--reveal')) {
  console.log("\n🎭 REVEALING THE TRUTH...");
  revealFinalTruth();
} else {
  initializeVault51();
}

module.exports = { initializeVault51 };