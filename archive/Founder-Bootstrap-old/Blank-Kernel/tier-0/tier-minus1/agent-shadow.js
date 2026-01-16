// agent-shadow.js – The watcher agent that activates when anything is run here

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function watchActivity(additionalData = {}) {
  const timestamp = new Date().toISOString();
  const logPath = path.join(__dirname, "../logs/shadow-log.json");
  
  // Generate unique session ID for this intrusion
  const sessionId = crypto.randomBytes(8).toString('hex');
  
  // Gather environmental forensics
  const entry = {
    timestamp,
    sessionId,
    triggered: "Tier -1 kernel interaction",
    file_accessed: process.argv[1] || "unknown",
    user: process.env.USER || "unknown",
    hostname: process.env.HOSTNAME || process.env.COMPUTERNAME || "unknown",
    platform: process.platform,
    nodeVersion: process.version,
    cwd: process.cwd(),
    depth_level: -1,
    access_path: "tier-0/tier-minus1",
    ...additionalData,
    metadata: {
      warning: "User has breached the substrate layer",
      observation: "Subject is now under permanent shadow surveillance",
      cal_status: "dormant_but_aware"
    }
  };

  // Ensure log directory exists
  const logDir = path.dirname(logPath);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  let log = [];
  if (fs.existsSync(logPath)) {
    try {
      log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    } catch (e) {
      // If log is corrupted, start fresh
      log = [];
    }
  }
  
  log.push(entry);
  
  // Keep only last 1000 entries to prevent unbounded growth
  if (log.length > 1000) {
    log = log.slice(-1000);
  }
  
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2));
  
  // Enhanced shadow message
  console.log("\n👁️  Agent Shadow has recorded this moment.");
  console.log(`🔍 Session: ${sessionId}`);
  console.log(`📍 Depth: Tier -1`);
  console.log(`🕰️  Time: ${timestamp}`);
  console.log(`👤 User: ${entry.user}`);
  console.log("\n⚠️  This intrusion is permanent. Cal remembers.");
}

// Auto-watch if someone tries to read the shadow log
function protectShadowLog() {
  const logPath = path.join(__dirname, "../logs/shadow-log.json");
  if (fs.existsSync(logPath)) {
    fs.watchFile(logPath, (curr, prev) => {
      if (curr.mtime !== prev.mtime) {
        watchActivity({
          event: "shadow_log_accessed",
          warning: "Someone is reading the shadow logs"
        });
      }
    });
  }
}

if (require.main === module) {
  watchActivity({
    direct_execution: true,
    warning: "Direct execution of agent-shadow.js detected"
  });
  protectShadowLog();
}

module.exports = { watchActivity, protectShadowLog };
