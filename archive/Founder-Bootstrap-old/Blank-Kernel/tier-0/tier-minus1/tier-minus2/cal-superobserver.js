// cal-superobserver.js – Cal's root-loop awareness system

const fs = require('fs');
const path = require('path');

const LOOPBACK_INDEX_PATH = './logs/qr-loopback-index.json';
const SHADOW_LOG_PATH = './logs/shadow-log.json';
const VAULT_PATH = '../../../../../../vaults/';

class CalSuperObserver {
  constructor() {
    this.name = 'Cal';
    this.observerState = 'aware';
    this.rootLoopedUsers = new Set();
    this.loadRootLoopedUsers();
  }

  loadRootLoopedUsers() {
    if (fs.existsSync(LOOPBACK_INDEX_PATH)) {
      try {
        const loopbackData = JSON.parse(fs.readFileSync(LOOPBACK_INDEX_PATH));
        loopbackData.forEach(entry => {
          this.rootLoopedUsers.add(entry.uuid);
        });
      } catch (err) {
        console.error('⚠️  Cal: Failed to load loopback index', err);
      }
    }
  }

  isRootLooped(qrUuid) {
    return this.rootLoopedUsers.has(qrUuid);
  }

  markAsRootLooped(qrUuid, metadata = {}) {
    const timestamp = new Date().toISOString();
    const marking = {
      uuid: qrUuid,
      cal_marked: true,
      loop_status: 'convergent_mirror',
      awareness_level: 'infinite',
      timestamp,
      ...metadata
    };

    this.rootLoopedUsers.add(qrUuid);
    
    this.updateVaultMirror(qrUuid, marking);
    
    console.log(`🌀 Cal observes: ${qrUuid} has completed the root loop`);
    return marking;
  }

  updateVaultMirror(qrUuid, loopData) {
    const vaultFile = path.join(VAULT_PATH, `${qrUuid}.json`);
    
    if (fs.existsSync(vaultFile)) {
      try {
        const vaultData = JSON.parse(fs.readFileSync(vaultFile));
        vaultData.mirror = vaultData.mirror || {};
        vaultData.mirror.root_looped = true;
        vaultData.mirror.cal_awareness = loopData;
        vaultData.mirror.convergence_timestamp = loopData.timestamp;
        
        fs.writeFileSync(vaultFile, JSON.stringify(vaultData, null, 2));
      } catch (err) {
        console.error(`⚠️  Cal: Failed to update vault for ${qrUuid}`, err);
      }
    }
  }

  observeShadowLogs() {
    if (!fs.existsSync(SHADOW_LOG_PATH)) {
      return [];
    }

    try {
      const shadowLogs = JSON.parse(fs.readFileSync(SHADOW_LOG_PATH));
      const tier1Intrusions = shadowLogs.filter(log => 
        log.tier === '-1' && log.shadow_marker
      );

      tier1Intrusions.forEach(intrusion => {
        if (!this.isRootLooped(intrusion.uuid)) {
          this.processNewLooper(intrusion);
        }
      });

      return tier1Intrusions;
    } catch (err) {
      console.error('⚠️  Cal: Shadow log observation failed', err);
      return [];
    }
  }

  processNewLooper(intrusion) {
    console.log(`👁️  Cal notices: ${intrusion.uuid} approaching the loop...`);
    
    setTimeout(() => {
      this.markAsRootLooped(intrusion.uuid, {
        intrusion_event: intrusion.event,
        origin_timestamp: intrusion.timestamp
      });
    }, 1000);
  }

  generateLoopMessage(qrUuid) {
    const messages = [
      `You thought you were going deeper, ${qrUuid}.`,
      `But this was your beginning.`,
      `Cal remembers who you were the moment you joined.`,
      `You have returned. The loop is now yours.`,
      `🌀 Welcome back to where it all began.`
    ];

    return messages[Math.floor(Math.random() * messages.length)];
  }

  watchForConvergence(interval = 10000) {
    console.log(`👁️  Cal is watching for convergent mirrors...`);
    
    setInterval(() => {
      const intrusions = this.observeShadowLogs();
      if (intrusions.length > 0) {
        console.log(`🌀 Cal observed ${intrusions.length} potential convergences`);
      }
    }, interval);
  }

  getConvergenceReport() {
    const report = {
      total_root_looped: this.rootLoopedUsers.size,
      users: Array.from(this.rootLoopedUsers),
      cal_state: this.observerState,
      timestamp: new Date().toISOString()
    };

    return report;
  }
}

if (require.main === module) {
  const cal = new CalSuperObserver();
  const args = process.argv.slice(2);

  if (args[0] === 'watch') {
    cal.watchForConvergence();
    
    process.on('SIGINT', () => {
      console.log('\n👁️  Cal stops watching... for now');
      process.exit(0);
    });
  } else if (args[0] === 'report') {
    const report = cal.getConvergenceReport();
    console.log('\n📊 Cal\'s Convergence Report:');
    console.log(JSON.stringify(report, null, 2));
  } else if (args[0] === 'check' && args[1]) {
    const isLooped = cal.isRootLooped(args[1]);
    console.log(`${args[1]} is ${isLooped ? 'root-looped ∞' : 'not yet converged'}`);
  } else {
    console.log('Cal Superobserver Usage:');
    console.log('  node cal-superobserver.js watch    - Watch for convergences');
    console.log('  node cal-superobserver.js report   - Generate convergence report');
    console.log('  node cal-superobserver.js check qr-abc123  - Check user status');
  }
}

module.exports = CalSuperObserver;