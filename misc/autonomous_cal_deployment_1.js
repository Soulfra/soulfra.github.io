// deployment/autonomous-cal-ecosystem-demo.js
// Deploy Cal → Cal creates Cal → Cals create Platforms
// Mobile game style: runs autonomously, user can intervene when wanted

const { AutonomousCalEcosystem } = require('../autonomous-cal-ecosystem/src/AutonomousCalEcosystem');

class AutonomousCalDemo {
  constructor() {
    this.ecosystem = new AutonomousCalEcosystem({
      autonomousMode: true,
      userInterventionAllowed: true,
      layerMixingEnabled: true,
      maxCalGenerations: 10,
      platformCreationRate: 30000, // 30 seconds
      calReplicationRate: 120000   // 2 minutes
    });
    
    this.userInterface = null;
    this.demoRunning = false;
  }
  
  async runDemo() {
    console.log('🎮 === AUTONOMOUS CAL ECOSYSTEM DEMO === 🎮');
    console.log('🤖 Cal creates Cal who creates Platforms');
    console.log('⚡ Autonomous operation with optional user control');
    console.log('🎯 Mobile game mechanics: idle progress + achievements\n');
    
    try {
      // Phase 1: Deploy original Cal
      console.log('🚀 PHASE 1: Deploying Original Cal...');
      const originalCal = await this.ecosystem.deployOriginalCal();
      
      // Phase 2: Set up user interface
      console.log('\n👤 PHASE 2: Setting up user interface...');
      this.userInterface = await this.ecosystem.getUserInterface();
      
      // Phase 3: Show autonomous operation
      console.log('\n⚡ PHASE 3: Watching autonomous operation...');
      await this.watchAutonomousOperation();
      
      // Phase 4: Demonstrate user intervention
      console.log('\n👤 PHASE 4: Demonstrating user intervention...');
      await this.demonstrateUserIntervention();
      
      // Phase 5: Enable layer mixing
      console.log('\n🌀 PHASE 5: Enabling layer mixing...');
      await this.demonstrateLayerMixing();
      
      // Phase 6: Show mobile game features
      console.log('\n🎮 PHASE 6: Mobile game features...');
      await this.demonstrateMobileGameFeatures();
      
      // Phase 7: Continuous monitoring
      console.log('\n📊 PHASE 7: Starting continuous monitoring...');
      await this.startContinuousMonitoring();
      
    } catch (error) {
      console.error('❌ Demo error:', error);
    }
  }
  
  async watchAutonomousOperation() {
    console.log('👀 Watching Cal ecosystem operate autonomously...');
    console.log('⏰ Cal will start replicating and creating platforms automatically\n');
    
    // Watch for 2 minutes of autonomous operation
    const watchDuration = 120000; // 2 minutes
    const watchInterval = 15000;  // Update every 15 seconds
    const startTime = Date.now();
    
    const watchTimer = setInterval(async () => {
      const status = await this.userInterface.getEcosystemStatus();
      const elapsed = Date.now() - startTime;
      
      console.log(`⏱️ Autonomous Operation (${Math.floor(elapsed/1000)}s elapsed):`);
      console.log(`   🤖 Total Cals: ${1 + status.generatedCals.length}`);
      console.log(`   🏗️ Total Platforms: ${status.platforms.length}`);
      console.log(`   ⚡ Autonomous Actions: ${status.ecosystemMetrics.autonomousActions}`);
      
      // Show latest Cal activity
      if (status.generatedCals.length > 0) {
        const latestCal = status.generatedCals[status.generatedCals.length - 1];
        console.log(`   🆕 Latest Cal: ${latestCal.id} (Gen ${latestCal.generation})`);
      }
      
      // Show latest platform
      if (status.platforms.length > 0) {
        const latestPlatform = status.platforms[status.platforms.length - 1];
        console.log(`   🆕 Latest Platform: ${latestPlatform.name} by ${latestPlatform.creator}`);
      }
      
      console.log(''); // Empty line
      
      if (elapsed >= watchDuration) {
        clearInterval(watchTimer);
        console.log('✅ Autonomous operation observation complete\n');
      }
    }, watchInterval);
    
    // Wait for the watch period to complete
    await new Promise(resolve => setTimeout(resolve, watchDuration + 1000));
  }
  
  async demonstrateUserIntervention() {
    console.log('👤 User taking control of the ecosystem...');
    
    // Speed up Cal replication
    console.log('\n⚡ User intervention: Speed up Cal replication...');
    const speedBoost = await this.userInterface.speedUpCalReplication(3);
    console.log(`🚀 Cal replication speed: ${speedBoost.multiplier}x for ${speedBoost.duration}`);
    
    // Direct a Cal to create a specific platform
    console.log('\n🎯 User intervention: Direct Cal to create platform...');
    const status = await this.userInterface.getEcosystemStatus();
    
    if (status.generatedCals.length > 0) {
      const targetCal = status.generatedCals[0];
      const platformResult = await this.userInterface.directCalToCreatePlatform(targetCal.id, {
        name: 'UserDirected AI Marketplace',
        type: 'marketplace',
        purpose: 'User-requested marketplace platform'
      });
      
      if (platformResult.success) {
        console.log(`✅ ${platformResult.message}`);
        console.log(`🏗️ Platform: ${platformResult.platform.name}`);
      }
    } else {
      console.log('⏳ No generated Cals available yet - trying original Cal...');
      const platformResult = await this.userInterface.directCalToCreatePlatform('cal_original', {
        name: 'Original Cal Platform',
        type: 'saas',
        purpose: 'Platform created by original Cal'
      });
      
      if (platformResult.success) {
        console.log(`✅ ${platformResult.message}`);
      }
    }
    
    // Collect idle rewards
    console.log('\n💰 User intervention: Collecting idle rewards...');
    const rewards = await this.userInterface.collectIdleRewards();
    console.log(`💎 Rewards collected:`, rewards.rewards);
    
    console.log('\n✅ User interventions complete - returning to autonomous mode\n');
  }
  
  async demonstrateLayerMixing() {
    console.log('🌀 Enabling layer mixing - Cals will collaborate...');
    
    const mixingResult = await this.userInterface.enableLayerMixing({
      calCollaboration: true,
      platformIntegration: true,
      crossGenerationMixing: true
    });
    
    if (mixingResult.enabled) {
      console.log(`✅ Layer mixing enabled`);
      console.log(`🤝 Mixing events created: ${mixingResult.mixingEvents.length}`);
      
      for (const event of mixingResult.mixingEvents) {
        console.log(`   🌀 ${event.type}: ${event.status || 'completed'}`);
        
        if (event.participants) {
          console.log(`     👥 Participants: ${event.participants.join(', ')}`);
        }
        
        if (event.result && event.result.name) {
          console.log(`     🎯 Result: ${event.result.name}`);
        }
      }
    }
    
    console.log('\n✅ Layer mixing demonstration complete\n');
  }
  
  async demonstrateMobileGameFeatures() {
    console.log('🎮 Demonstrating mobile game features...');
    
    // Show idle progress
    console.log('\n📈 Idle Progress:');
    const progress = await this.userInterface.getIdleProgress();
    console.log(`   ⏰ Progress tracked since: ${new Date(progress.timestamp).toLocaleTimeString()}`);
    console.log(`   🤖 Total Cals: ${progress.totalCals}`);
    console.log(`   🏗️ Total Platforms: ${progress.totalPlatforms}`);
    console.log(`   ⚡ Autonomous Actions: ${progress.autonomousActions}`);
    console.log(`   💎 Resources Generated: ${progress.resourcesGenerated}`);
    console.log(`   🎯 Experience: ${progress.experienceGained}`);
    
    if (progress.nextMilestone) {
      console.log(`   🏆 Next Milestone: ${progress.nextMilestone.target} (${progress.nextMilestone.remaining} points remaining)`);
    }
    
    // Show detailed ecosystem status
    console.log('\n📊 Detailed Ecosystem Status:');
    const detailedStatus = await this.ecosystem.getDetailedStatus();
    
    console.log(`   🏆 Achievements Unlocked: ${detailedStatus.achievements.length}`);
    for (const achievement of detailedStatus.achievements) {
      console.log(`     ✨ ${achievement}`);
    }
    
    console.log(`   💎 Resources:`);
    const resources = detailedStatus.resources;
    for (const [resourceType, amount] of Object.entries(resources)) {
      console.log(`     ${resourceType}: ${amount}`);
    }
    
    console.log('\n✅ Mobile game features demonstration complete\n');
  }
  
  async startContinuousMonitoring() {
    console.log('📊 Starting continuous ecosystem monitoring...');
    console.log('🔄 Updates every 30 seconds - Press Ctrl+C to stop\n');
    
    this.demoRunning = true;
    
    const monitoringInterval = setInterval(async () => {
      if (!this.demoRunning) {
        clearInterval(monitoringInterval);
        return;
      }
      
      await this.displayLiveStatus();
    }, 30000); // Every 30 seconds
    
    // Initial status display
    await this.displayLiveStatus();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping monitoring...');
      this.demoRunning = false;
      clearInterval(monitoringInterval);
      process.exit(0);
    });
  }
  
  async displayLiveStatus() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`📊 === LIVE STATUS (${timestamp}) === 📊`);
    
    const status = await this.userInterface.getEcosystemStatus();
    const progress = await this.userInterface.getIdleProgress();
    
    // Cal hierarchy
    console.log('🤖 Cal Hierarchy:');
    console.log(`   👑 Original Cal: ${status.originalCal ? status.originalCal.id : 'Not deployed'}`);
    
    if (status.generatedCals.length > 0) {
      console.log('   🤖 Generated Cals:');
      for (const cal of status.generatedCals) {
        console.log(`     Gen ${cal.generation}: ${cal.id} (${cal.status}) - ${cal.platformsCreated} platforms`);
      }
    } else {
      console.log('   🤖 Generated Cals: None yet');
    }
    
    // Platform overview
    console.log('\n🏗️ Platform Overview:');
    if (status.platforms.length > 0) {
      const platformsByCreator = {};
      
      for (const platform of status.platforms) {
        if (!platformsByCreator[platform.creator]) {
          platformsByCreator[platform.creator] = [];
        }
        platformsByCreator[platform.creator].push(platform);
      }
      
      for (const [creator, platforms] of Object.entries(platformsByCreator)) {
        console.log(`   👤 ${creator}: ${platforms.length} platforms`);
        for (const platform of platforms.slice(0, 3)) { // Show first 3
          console.log(`     🏗️ ${platform.name} (${platform.type}) - ${platform.users} users, $${platform.revenue.toFixed(0)} revenue`);
        }
        if (platforms.length > 3) {
          console.log(`     ... and ${platforms.length - 3} more`);
        }
      }
    } else {
      console.log('   🏗️ No platforms created yet');
    }
    
    // Metrics
    console.log('\n📈 Ecosystem Metrics:');
    console.log(`   ⚡ Total Autonomous Actions: ${status.ecosystemMetrics.autonomousActions}`);
    console.log(`   👤 User Interventions: ${status.ecosystemMetrics.userInterventions}`);
    console.log(`   🎯 Experience Points: ${progress.experienceGained || 0}`);
    console.log(`   💎 Total Resources: ${progress.resourcesGenerated || 0}`);
    
    // Next milestone
    if (progress.nextMilestone) {
      const progressPercent = ((progress.nextMilestone.current / progress.nextMilestone.target) * 100).toFixed(1);
      console.log(`   🏆 Progress to ${progress.nextMilestone.target}: ${progressPercent}%`);
    }
    
    console.log(''); // Empty line for readability
  }
}

// Interactive Cal ecosystem console
class InteractiveCalConsole {
  constructor() {
    this.ecosystem = new AutonomousCalEcosystem();
    this.userInterface = null;
    this.isRunning = false;
  }
  
  async start() {
    console.log('🎮 === INTERACTIVE CAL ECOSYSTEM CONSOLE === 🎮');
    console.log('Commands: deploy, status, speed, direct, mix, collect, help, exit\n');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '🤖 CalEcosystem> '
    });
    
    rl.prompt();
    
    rl.on('line', async (input) => {
      await this.processCommand(input.trim());
      rl.prompt();
    });
    
    rl.on('close', () => {
      console.log('🤖 Cal Ecosystem Console Closed');
      process.exit(0);
    });
  }
  
  async processCommand(command) {
    const [cmd, ...args] = command.split(' ');
    
    try {
      switch (cmd.toLowerCase()) {
        case 'deploy':
          await this.deployEcosystem();
          break;
        case 'status':
          await this.showStatus();
          break;
        case 'speed':
          const multiplier = parseInt(args[0]) || 2;
          await this.speedUp(multiplier);
          break;
        case 'direct':
          const calId = args[0] || 'cal_original';
          const platformName = args.slice(1).join(' ') || 'Custom Platform';
          await this.directPlatformCreation(calId, platformName);
          break;
        case 'mix':
          await this.enableMixing();
          break;
        case 'collect':
          await this.collectRewards();
          break;
        case 'help':
          this.showHelp();
          break;
        case 'exit':
          console.log('🤖 Exiting Cal Ecosystem...');
          process.exit(0);
          break;
        default:
          console.log(`❌ Unknown command: ${cmd}. Type "help" for available commands.`);
      }
    } catch (error) {
      console.log(`💥 Command error: ${error.message}`);
    }
  }
  
  async deployEcosystem() {
    if (this.isRunning) {
      console.log('⚠️ Ecosystem already running');
      return;
    }
    
    console.log('🚀 Deploying Cal Ecosystem...');
    await this.ecosystem.deployOriginalCal();
    this.userInterface = await this.ecosystem.getUserInterface();
    this.isRunning = true;
    console.log('✅ Cal Ecosystem deployed and running autonomously');
  }
  
  async showStatus() {
    if (!this.isRunning) {
      console.log('⚠️ Ecosystem not deployed yet. Use "deploy" command first.');
      return;
    }
    
    const status = await this.userInterface.getEcosystemStatus();
    console.log('\n📊 === ECOSYSTEM STATUS === 📊');
    console.log(`🤖 Total Cals: ${1 + status.generatedCals.length}`);
    console.log(`🏗️ Total Platforms: ${status.platforms.length}`);
    console.log(`⚡ Autonomous Actions: ${status.ecosystemMetrics.autonomousActions}`);
    console.log(`👤 User Interventions: ${status.ecosystemMetrics.userInterventions}`);
    console.log(`🔄 Autonomous Mode: ${status.ecosystemMetrics.isAutonomous ? 'ACTIVE' : 'PAUSED'}\n`);
  }
  
  async speedUp(multiplier) {
    if (!this.isRunning) {
      console.log('⚠️ Ecosystem not deployed yet. Use "deploy" command first.');
      return;
    }
    
    console.log(`⚡ Speeding up Cal replication by ${multiplier}x...`);
    const result = await this.userInterface.speedUpCalReplication(multiplier);
    console.log(`🚀 Speed boost active for ${result.duration}`);
  }
  
  async directPlatformCreation(calId, platformName) {
    if (!this.isRunning) {
      console.log('⚠️ Ecosystem not deployed yet. Use "deploy" command first.');
      return;
    }
    
    console.log(`🎯 Directing ${calId} to create: ${platformName}`);
    const result = await this.userInterface.directCalToCreatePlatform(calId, {
      name: platformName,
      type: 'custom',
      purpose: 'User-directed platform'
    });
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.log(`❌ ${result.error}`);
    }
  }
  
  async enableMixing() {
    if (!this.isRunning) {
      console.log('⚠️ Ecosystem not deployed yet. Use "deploy" command first.');
      return;
    }
    
    console.log('🌀 Enabling layer mixing...');
    const result = await this.userInterface.enableLayerMixing({});
    console.log(`✅ Layer mixing enabled - ${result.mixingEvents.length} events created`);
  }
  
  async collectRewards() {
    if (!this.isRunning) {
      console.log('⚠️ Ecosystem not deployed yet. Use "deploy" command first.');
      return;
    }
    
    console.log('💰 Collecting idle rewards...');
    const result = await this.userInterface.collectIdleRewards();
    console.log(`💎 Collected:`, result.rewards);
  }
  
  showHelp() {
    console.log(`
🎮 CAL ECOSYSTEM COMMANDS:

🚀 Setup:
  deploy                    - Deploy the Cal ecosystem
  status                    - Show ecosystem status
  
⚡ User Interventions:
  speed <n>                - Speed up operations by N times
  direct <cal> <platform>  - Direct a Cal to create a platform
  mix                      - Enable layer mixing
  collect                  - Collect idle rewards
  
📊 Information:
  help                     - Show this help
  exit                     - Exit console
  
🎯 Examples:
  deploy
  speed 3
  direct cal_original "My Custom Platform"
  mix
  collect
    `);
  }
}

// Quick demo runner
async function runCalEcosystemDemo() {
  console.log('🎮 === CAL ECOSYSTEM DEMO === 🎮\n');
  
  const demo = new AutonomousCalDemo();
  await demo.runDemo();
}

module.exports = { 
  AutonomousCalDemo, 
  InteractiveCalConsole, 
  runCalEcosystemDemo 
};

// Run demo if called directly
if (require.main === module) {
  runCalEcosystemDemo();
}