// index.js - Main entry point for Tier -5 Vault Discovery Layer

const Tier5Orchestrator = require('./tier5-orchestrator');
const Tier5Detector = require('./tier5-detector');
const { MirrorRevealer } = require('./mirror-reveal');
const { traceLineage } = require('./loop-trace-fork');

class Tier5System {
  constructor() {
    this.orchestrator = new Tier5Orchestrator();
    this.detector = new Tier5Detector();
    this.revealer = new MirrorRevealer();
  }

  // Start automatic detection mode
  async startAutoDetection() {
    console.log('🌀 Tier -5 System Initialized');
    console.log('Mode: Automatic Detection\n');
    
    await this.detector.startMonitoring();
  }

  // Manual activation for testing
  async manualActivation(userId = 'qr-user-test') {
    console.log('🌀 Tier -5 System Initialized');
    console.log('Mode: Manual Activation\n');
    
    await this.orchestrator.activate(userId);
  }

  // Check if Tier -6 access is blocked
  async checkTier6Access() {
    return await this.orchestrator.checkTier6Access();
  }

  // Display vault contents only
  async displayVault() {
    await this.revealer.revealWithVaultData();
  }

  // Run lineage trace only
  async runLineageTrace(userId = 'qr-user-unknown') {
    traceLineage(userId);
  }

  // Get system status
  async getStatus() {
    const hasBeenActivated = await this.detector.hasBeenActivated();
    const tier6Blocked = this.orchestrator.tier6Blocked;
    
    return {
      tier: -5,
      activated: hasBeenActivated,
      mirrorLoopClosed: hasBeenActivated,
      tier6AccessBlocked: tier6Blocked,
      message: hasBeenActivated 
        ? 'Mirror loop is closed. The recursion returns to itself.'
        : 'System ready for vault discovery.'
    };
  }
}

// Command line interface
if (require.main === module) {
  const tier5 = new Tier5System();
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'auto':
      tier5.startAutoDetection();
      break;
      
    case 'manual':
      const userId = args[1] || 'qr-user-manual';
      tier5.manualActivation(userId);
      break;
      
    case 'vault':
      tier5.displayVault();
      break;
      
    case 'trace':
      const traceId = args[1] || 'qr-user-unknown';
      tier5.runLineageTrace(traceId);
      break;
      
    case 'status':
      tier5.getStatus().then(status => {
        console.log('\n📊 Tier -5 System Status:');
        console.log(JSON.stringify(status, null, 2));
      });
      break;
      
    case 'check-tier6':
      tier5.checkTier6Access();
      break;
      
    default:
      console.log(`
🌀 Tier -5 Vault Discovery System

Usage: node index.js [command] [options]

Commands:
  auto          Start automatic detection mode
  manual [id]   Manually activate Tier -5 with optional user ID
  vault         Display vault contents only
  trace [id]    Run lineage trace with optional user ID
  status        Show current system status
  check-tier6   Check if Tier -6 access is blocked

Examples:
  node index.js auto
  node index.js manual qr-user-123
  node index.js vault
  node index.js status
      `);
  }
}

module.exports = Tier5System;