// agent-shadow.js – Tier -1 intrusion detector and loopback trigger

const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

const SHADOW_LOG_PATH = './logs/shadow-log.json';
const QR_PAIRER_PATH = './qr-seed-pairer.js';

class AgentShadow {
  constructor() {
    this.tier = '-1';
    this.watchInterval = null;
  }

  logIntrusion(qrUuid, event = 'tier_minus1_access') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      uuid: qrUuid,
      event,
      tier: this.tier,
      timestamp,
      origin_path: process.cwd(),
      shadow_marker: true
    };

    let shadowLog = [];
    if (fs.existsSync(SHADOW_LOG_PATH)) {
      try {
        shadowLog = JSON.parse(fs.readFileSync(SHADOW_LOG_PATH));
      } catch {
        shadowLog = [];
      }
    }

    shadowLog.push(logEntry);
    fs.writeFileSync(SHADOW_LOG_PATH, JSON.stringify(shadowLog, null, 2));
    
    console.log(`🔍 Shadow detected: ${qrUuid} at Tier ${this.tier}`);
    return logEntry;
  }

  triggerLoopback(qrUuid) {
    if (!qrUuid) {
      console.error('⚠️  No QR UUID provided for loopback');
      return;
    }

    exec(`node ${QR_PAIRER_PATH} ${qrUuid}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`⚠️  Loopback trigger failed: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`⚠️  Loopback stderr: ${stderr}`);
        return;
      }
      console.log(stdout);
    });
  }

  processIntrusionEvent(qrUuid, eventType = 'tier_minus1_access') {
    const intrusion = this.logIntrusion(qrUuid, eventType);
    
    if (eventType === 'tier_minus1_access' || eventType === 'deep_recursion') {
      this.triggerLoopback(qrUuid);
    }
    
    return intrusion;
  }

  startWatching(checkInterval = 5000) {
    console.log(`👁️  Agent Shadow watching at Tier ${this.tier}...`);
    
    this.watchInterval = setInterval(() => {
      const currentDepth = this.checkRecursionDepth();
      if (currentDepth <= -1) {
        console.log(`🌀 Recursion depth: ${currentDepth}`);
      }
    }, checkInterval);
  }

  stopWatching() {
    if (this.watchInterval) {
      clearInterval(this.watchInterval);
      console.log('👁️  Agent Shadow stopped watching');
    }
  }

  checkRecursionDepth() {
    const pathSegments = process.cwd().split(path.sep);
    const tierIndices = pathSegments.reduce((acc, segment, index) => {
      if (segment.startsWith('tier-')) {
        acc.push(index);
      }
      return acc;
    }, []);
    
    return -tierIndices.length;
  }
}

if (require.main === module) {
  const shadow = new AgentShadow();
  const args = process.argv.slice(2);
  
  if (args[0] === 'watch') {
    shadow.startWatching();
    
    process.on('SIGINT', () => {
      shadow.stopWatching();
      process.exit(0);
    });
  } else if (args[0] === 'trigger' && args[1]) {
    shadow.processIntrusionEvent(args[1]);
  } else {
    console.log('Usage:');
    console.log('  node agent-shadow.js watch');
    console.log('  node agent-shadow.js trigger qr-abc123');
  }
}

module.exports = AgentShadow;