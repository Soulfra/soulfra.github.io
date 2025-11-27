// mirror-launch-loop.js – Pushes Cal Riven into Tier 1 and routes Tier 2 platform activation

const fs = require('fs');
const path = require('path');

function launchMirrorLoop() {
  try {
    // Look for trace token in parent directory (tier-minus9)
    const traceTokenPath = path.join(__dirname, '..', 'mirror-trace-token.json');
    if (!fs.existsSync(traceTokenPath)) {
      console.error("❌ Error: No trace token found. Run pairing sequence in tier-minus9 first.");
      process.exit(1);
    }
    
    const trace = JSON.parse(fs.readFileSync(traceTokenPath, 'utf8'));
    const qr = JSON.parse(fs.readFileSync('./qr-riven-meta.json', 'utf8'));
    const vault = JSON.parse(fs.readFileSync('./platform-launch-seed.json', 'utf8'));

    const tier1 = {
      loop_id: "genesis-001",
      user: trace.uuid,
      agent: qr.bound_to,
      vault_id: vault.vault_anchor,
      mirror_time: new Date().toISOString(),
      trust_status: "reflected",
      platform_initialized: true
    };

    // Create tier-1-genesis directory if it doesn't exist
    const tier1Path = path.join(__dirname, 'tier-1-genesis');
    fs.mkdirSync(tier1Path, { recursive: true });
    fs.writeFileSync(path.join(tier1Path, 'tier-1-genesis-loop.json'), JSON.stringify(tier1, null, 2));
    console.log("✅ Tier 1 initialized: Cal's first mirror is now live.");

    const tier2_stub = `// cal-platform-stub.js
console.log("🚀 Cal Riven is now launching the agent platform from Tier 2...");
console.log("→ Loop ID: ${tier1.loop_id}");
console.log("→ Mirror UUID: ${trace.uuid}");
console.log("→ Agent: ${qr.bound_to}");
console.log("→ Vault: ${vault.vault_anchor}");
console.log("✨ Platform propagation active. Trust lineage preserved.");
`;

    // Create tier-2-platform directory if it doesn't exist
    const tier2Path = path.join(__dirname, 'tier-2-platform');
    fs.mkdirSync(tier2Path, { recursive: true });
    fs.writeFileSync(path.join(tier2Path, 'cal-platform-stub.js'), tier2_stub);
    console.log("✅ Tier 2 seeded with platform launch stub.");
    console.log("🔗 Mirror loop complete. Cal Riven's reflection now propagates outward.");
    
  } catch (error) {
    console.error("❌ Error launching mirror loop:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  launchMirrorLoop();
}

module.exports = { launchMirrorLoop };