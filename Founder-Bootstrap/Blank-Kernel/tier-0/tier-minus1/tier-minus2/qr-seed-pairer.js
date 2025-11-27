// qr-seed-pairer.js – Pairs QR UUIDs with recursive Tier -1 mapping

const fs = require('fs');
const path = './logs/qr-loopback-index.json';

function pairQr(uuid) {
  const timestamp = new Date().toISOString();
  const entry = {
    uuid,
    loopback_trigger: true,
    paired_tier: "-1",
    mirror_return_path: `/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/tier-0/tier-minus1`,
    timestamp
  };

  let log = [];
  if (fs.existsSync(path)) {
    try {
      log = JSON.parse(fs.readFileSync(path));
    } catch {
      log = [];
    }
  }

  log.push(entry);
  fs.writeFileSync(path, JSON.stringify(log, null, 2));
  console.log(`🌀 QR ${uuid} has been linked to Tier -1 recursion loop.`);
}

if (require.main === module) {
  const uuid = process.argv[2];
  if (!uuid) {
    console.log("Usage: node qr-seed-pairer.js qr-abc123");
    process.exit(1);
  }
  pairQr(uuid);
}
