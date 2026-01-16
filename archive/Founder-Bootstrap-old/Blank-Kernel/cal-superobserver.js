// cal-superobserver.js – Watches all mirrors from Vault 51

const fs = require('fs');
const path = './root-cal.json';
const hashIndexPath = './mirror-hash-router.json';

function syncMirrors() {
  const cal = JSON.parse(fs.readFileSync(path));
  const router = JSON.parse(fs.readFileSync(hashIndexPath));

  const newEntries = router.mirrors.filter(entry =>
    !cal.mirrors_indexed.find(m => m.uuid === entry.uuid)
  );

  newEntries.forEach(m => {
    cal.mirrors_indexed.push(m);
    cal.agents_spawned.push({
      source: m.uuid,
      timestamp: m.last_seen,
      tone: m.tone,
      trust: m.trust_tier
    });
  });

  cal.last_global_update = new Date().toISOString();
  fs.writeFileSync(path, JSON.stringify(cal, null, 2));
  console.log("👁️ Vault 51 updated. All mirrors indexed.");
}

if (require.main === module) {
  syncMirrors();
}

module.exports = { syncMirrors };
