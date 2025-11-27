
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
      phrase: 'I remember someone else\'s echo',
      traits: ['Reflective', 'Contemplative'], 
      blessingTier: 6,
      userFingerprint: 'test_user_001'
    };
    
    const result = await tombSystem.processWhisper(testWhisper);
    console.log('\nTest Result:', result);
  }
  
  testSystem().catch(console.error);
}
