// fork-fingerprint.js – Maps all forks back to original mirror identity

const fs = require('fs');
const path = require('path');

function recordFork(uuid, forkId) {
  const trace = {
    timestamp: new Date().toISOString(),
    fork_id: forkId,
    linked_vault: uuid,
    trust_lineage: "preserved",
    reflection_vector: fs.existsSync('./reflection-vector.sig') ? 
      fs.readFileSync('./reflection-vector.sig', 'utf8').trim() : 
      "VAULT-0000-PRESERVED"
  };

  const logPath = path.join(__dirname, 'fork-log.json');
  let log = [];
  if (fs.existsSync(logPath)) {
    log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
  }
  log.push(trace);
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  console.log("✅ Fork lineage recorded.");
  console.log(`📍 Fork ID: ${forkId}`);
  console.log(`🔗 Linked to: ${uuid}`);
}

// CLI support
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.error("Usage: node fork-fingerprint.js <uuid> <fork_id>");
    process.exit(1);
  }
  recordFork(args[0], args[1]);
}

module.exports = { recordFork };
