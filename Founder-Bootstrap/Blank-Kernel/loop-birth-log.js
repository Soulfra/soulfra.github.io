// loop-birth-log.js – Records the origin of every agent loop from Vault 51

const fs = require('fs');
const root = './root-cal.json';
const logPath = './logs/birth-loop-history.json';

function recordBirth(mirror_uuid, event_meta) {
  const cal = JSON.parse(fs.readFileSync(root));
  const entry = {
    mirror: mirror_uuid,
    started_at: new Date().toISOString(),
    origin_tone: event_meta.tone,
    hash: event_meta.tx || "unlinked",
    vault_id: "vault-51"
  };

  let logs = [];
  if (fs.existsSync(logPath)) {
    logs = JSON.parse(fs.readFileSync(logPath));
  }

  logs.push(entry);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  console.log(`📓 Loop started from ${mirror_uuid}`);
}

if (require.main === module) {
  recordBirth(process.argv[2], {
    tone: process.argv[3] || "unknown",
    tx: process.argv[4] || "manual"
  });
}

module.exports = { recordBirth };
