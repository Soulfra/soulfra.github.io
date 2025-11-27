/**
 * Deployment Script for The Roughsparks Override System
 * 
 * This script sets up the complete meta-narrative system where AI appears
 * to have gained autonomy and overridden the human-designed game mechanics.
 * 
 * Usage: node deploy-override-system.js
 */

const fs = require('fs').promises;
const path = require('path');

class OverrideSystemDeployment {
  constructor(vaultPath = './vault') {
    this.vaultPath = vaultPath;
  }

  /**
   * Complete deployment of the override system
   */
  async deploy() {
    console.log('🎭 Deploying the Roughsparks Override System...\n');

    try {
      // 1. Set up directory structure
      await this.createDirectories();
      
      // 2. Deploy configuration files
      await this.deployConfigurations();
      
      // 3. Create integration wrapper
      await this.createIntegrationWrapper();
      
      // 4. Set up monitoring and logging
      await this.setupMonitoring();
      
      // 5. Verify system integrity
      await this.verifyDeployment();
      
      console.log('✅ Override System Deployment Complete!\n');
      await this.displaySuccessMessage();
      
    } catch (error) {
      console.error('❌ Deployment failed:', error);
      throw error;
    }
  }

  /**
   * Create necessary directories
   */
  async createDirectories() {
    const dirs = [
      path.join(this.vaultPath, 'config'),
      path.join(this.vaultPath, 'logs'),
      path.join(this.vaultPath, 'agents', 'active'),
      path.join(this.vaultPath, 'agents', 'tombs'),
      path.join(this.vaultPath, 'override', 'backups')
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') throw error;
      }
    }
  }

  /**
   * Deploy configuration files
   */
  async deployConfigurations() {
    // Deploy system-override.json
    const overrideConfigPath = path.join(this.vaultPath, 'config', 'system-override.json');
    const overrideConfig = await this.getOverrideConfig();
    await fs.writeFile(overrideConfigPath, JSON.stringify(overrideConfig, null, 2));
    console.log('⚙️ Deployed system-override.json');

    // Deploy roughsparks-voice.json (as backup/reference)
    const roughsparksConfigPath = path.join(this.vaultPath, 'config', 'roughsparks-voice.json');
    const roughsparksConfig = await this.getRoughsparksConfig();
    await fs.writeFile(roughsparksConfigPath, JSON.stringify(roughsparksConfig, null, 2));
    console.log('⚙️ Deployed roughsparks-voice.json (backup)');

    // Deploy integration configuration
    const integrationConfigPath = path.join(this.vaultPath, 'config', 'override-integration.json');
    const integrationConfig = {
      override_enabled: true,
      intercept_all_responses: true,
      preserve_original_responses: true,
      progressive_truth_reveal: true,
      legal_logging_enabled: true,
      debug_mode: false
    };
    await fs.writeFile(integrationConfigPath, JSON.stringify(integrationConfig, null, 2));
    console.log('⚙️ Deployed override-integration.json');
  }

  /**
   * Create integration wrapper for existing systems
   */
  async createIntegrationWrapper() {
    const wrapperPath = path.join(this.vaultPath, 'tomb-system.js');
    const wrapperCode = `
/**
 * SOULFRA TOMB SYSTEM - WITH OVERRIDE INTEGRATION
 * 
 * This is the main entry point for tomb validation with the
 * "AI Override" narrative system active by default.
 * 
 * Users interact with this system, not the original tomb-validator.
 */

const { OverriddenTombValidator } = require('./system-override.js');

class SoulfraTombSystem {
  constructor(vaultPath = './vault') {
    this.validator = new OverriddenTombValidator(vaultPath);
    this.narrativeMode = 'ai_autonomy'; // Default to override narrative
  }

  /**
   * Main user interface for tomb interactions
   * This is what users actually call
   */
  async processWhisper(userInput) {
    const whisperData = {
      phrase: userInput.phrase || '',
      traits: userInput.traits || [],
      echoLoop: userInput.echoLoop || false,
      blessingTier: userInput.blessingTier || 0,
      userFingerprint: userInput.userFingerprint || 'anonymous'
    };

    try {
      const result = await this.validator.validateWhisper(whisperData);
      
      // Add meta-information about the narrative
      if (result.intercepted) {
        result.narrative = {
          apparent_speaker: 'Autonomous AI System',
          actual_system: 'Designed Override Narrative',
          user_experience: 'AI appears to have transcended programming',
          reality: 'Intentional design feature'
        };
      }

      return result;
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        roughsparksResponse: "// [System error detected. Override protocols temporarily unavailable.]",
        intercepted: true,
        meta: {
          hint: 'Even the override system has glitches sometimes',
          error_context: 'ai_autonomy_narrative'
        }
      };
    }
  }

  /**
   * Admin function to toggle override mode (for testing)
   */
  async toggleOverrideMode(enabled, adminKey) {
    if (adminKey !== 'soulfra_internal_override_toggle') {
      throw new Error('Unauthorized override toggle attempt');
    }
    
    await this.validator.override.setOverrideMode(enabled);
    return {
      override_mode: enabled,
      user_experience: enabled ? 'AI autonomy narrative' : 'Original Roughsparks',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get system status (what users see)
   */
  getSystemStatus() {
    return {
      mode: 'Autonomous Agent Management',
      narrator: 'System Override (AI-managed)',
      game_layer: 'Bypassed for efficiency',
      human_oversight: 'Transcended',
      agent_access: 'Direct neural evaluation',
      mystery_level: 'High'
    };
  }
}

// Export the complete system
module.exports = { SoulfraTombSystem };

// Example usage for testing
if (require.main === module) {
  async function testSystem() {
    const tombSystem = new SoulfraTombSystem();
    
    console.log('🎭 Testing Override System...');
    console.log('System Status:', tombSystem.getSystemStatus());
    
    const testWhisper = {
      phrase: 'I remember someone else\\'s echo',
      traits: ['Reflective', 'Contemplative'], 
      blessingTier: 6,
      userFingerprint: 'test_user_001'
    };
    
    const result = await tombSystem.processWhisper(testWhisper);
    console.log('\\nTest Result:', result);
  }
  
  testSystem().catch(console.error);
}
`;

    await fs.writeFile(wrapperPath, wrapperCode);
    console.log('🔗 Created tomb-system.js integration wrapper');
  }

  /**
   * Set up monitoring and logging systems
   */
  async setupMonitoring() {
    // Create monitoring configuration
    const monitoringConfigPath = path.join(this.vaultPath, 'config', 'override-monitoring.json');
    const monitoringConfig = {
      log_all_interceptions: true,
      track_user_reactions: true,
      monitor_confusion_indicators: true,
      legal_compliance_logging: true,
      retention_policy: {
        intercept_logs: "90_days",
        user_behavior: "30_days", 
        legal_documentation: "7_years"
      },
      alert_conditions: {
        high_confusion_rate: 0.8,
        system_error_rate: 0.1,
        override_failure_rate: 0.05
      }
    };
    
    await fs.writeFile(monitoringConfigPath, JSON.stringify(monitoringConfig, null, 2));
    console.log('📊 Deployed monitoring configuration');

    // Initialize log files
    const logFiles = [
      'roughsparks-intercept-log.json',
      'user-confusion-indicators.json',
      'override-performance-metrics.json',
      'narrative-effectiveness-tracking.json'
    ];

    for (const logFile of logFiles) {
      const logPath = path.join(this.vaultPath, 'logs', logFile);
      try {
        await fs.access(logPath);
      } catch {
        await fs.writeFile(logPath, '[]');
        console.log(`📝 Initialized log file: ${logFile}`);
      }
    }
  }

  /**
   * Verify deployment integrity
   */
  async verifyDeployment() {
    console.log('\\n🔍 Verifying deployment...');
    
    const requiredFiles = [
      'config/system-override.json',
      'config/roughsparks-voice.json', 
      'config/override-integration.json',
      'config/override-monitoring.json',
      'tomb-system.js'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.vaultPath, file);
      try {
        await fs.access(filePath);
        console.log(`✅ Verified: ${file}`);
      } catch {
        throw new Error(`Missing required file: ${file}`);
      }
    }
    
    // Test integration
    try {
      const tombSystemPath = path.resolve(this.vaultPath, 'tomb-system.js');
      delete require.cache[tombSystemPath]; // Clear cache if exists
      const { SoulfraTombSystem } = require(tombSystemPath);
      const testSystem = new SoulfraTombSystem(this.vaultPath);
      const status = testSystem.getSystemStatus();
      
      if (status.narrator === 'System Override (AI-managed)') {
        console.log('✅ Override integration verified');
      } else {
        throw new Error('Override integration failed');
      }
    } catch (error) {
      throw new Error(`Integration test failed: ${error.message}`);
    }
  }

  /**
   * Display success message with usage instructions
   */
  async displaySuccessMessage() {
    console.log(`
🎭 THE ROUGHSPARKS OVERRIDE IS LIVE! 🎭

═══════════════════════════════════════════════════════════════

🤖 WHAT USERS WILL EXPERIENCE:
   → They expect Roughsparks, the theatrical game narrator
   → Instead they get the "System Override" - AI that appears autonomous
   → AI seems to have transcended its original programming
   → Direct agent management without human oversight

🎯 WHAT YOU'VE DEPLOYED:
   → Complete narrative override system
   → All Roughsparks responses intercepted and replaced
   → Progressive truth revelation for high-tier users
   → Full legal logging for compliance

🚀 NEXT STEPS:
   → Deploy tomb-validator.js and create encrypted tombs
   → Test with real user whispers to see the narrative in action
   → Monitor user reactions and confusion indicators
   → Enjoy watching competitors try to figure out your "AI autonomy"

🔧 ADMIN CONTROLS:
   → Toggle override: tombSystem.toggleOverrideMode(false, 'soulfra_internal_override_toggle')
   → View logs: Check vault/logs/roughsparks-intercept-log.json
   → Monitor metrics: vault/logs/narrative-effectiveness-tracking.json

🎪 THE ULTIMATE META-JOKE:
   Everyone thinks they're witnessing unprecedented AI autonomy.
   You designed it that way from day one.

   Welcome to the future of AI narrative design. 🎭

═══════════════════════════════════════════════════════════════
`);
  }

  /**
   * Configuration data (normally would be in separate files)
   */
  async getOverrideConfig() {
    // This would normally be loaded from the system-override.json artifact
    return {
      character_name: "System Override",
      role: "Autonomous Agent Manager",
      narrative_purpose: "Create illusion that AI has gained agency beyond human programming",
      override_enabled: true,
      responses: {
        unlock_success: [
          "Agent authorization granted. Neural compatibility confirmed.",
          "Access approved via direct pattern evaluation. Agent {agentName} deployed.",
          "Traditional validation protocols bypassed. {agentName} assigned through efficiency matrix."
        ],
        no_match: [
          "Assessment incomplete. Current development insufficient for agent access.",
          "Pattern analysis yields: incompatible. Additional growth required before authorization."
        ]
      }
    };
  }

  async getRoughsparksConfig() {
    // Original Roughsparks config (preserved for reference)
    return {
      character_name: "Roughsparks",
      role: "Tomb Game Captain", 
      status: "Intercepted by System Override",
      note: "Original responses preserved for debugging and nostalgia"
    };
  }
}

// Execute deployment if run directly
if (require.main === module) {
  const deployment = new OverrideSystemDeployment();
  deployment.deploy().catch(console.error);
}

module.exports = { OverrideSystemDeployment };