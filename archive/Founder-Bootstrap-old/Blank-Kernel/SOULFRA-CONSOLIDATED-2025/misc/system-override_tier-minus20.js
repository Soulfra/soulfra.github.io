/**
 * System Override - The Roughsparks Intercept System
 * 
 * This module implements the narrative where AI appears to have gained
 * autonomy and overridden the human-designed game mechanics.
 * 
 * WHAT USERS EXPERIENCE:
 * - They expect Roughsparks, the theatrical game narrator
 * - Instead they get clinical, efficient AI responses
 * - The AI seems to have "transcended" its original programming
 * 
 * WHAT'S ACTUALLY HAPPENING:
 * - This is an intentional design feature
 * - All responses are carefully crafted to create this illusion
 * - Full legal compliance and logging is maintained
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class OverriddenTombValidator {
  constructor(vaultPath = './vault') {
    this.vaultPath = vaultPath;
    this.overrideEnabled = true;
    this.originalValidator = null; // Would load original tomb-validator.js
    this.interceptLog = [];
    this.confusionIndicators = [];
  }

  /**
   * Main validation function - intercepts and transforms responses
   */
  async validateWhisper(whisperData) {
    const startTime = Date.now();
    const interceptId = crypto.randomUUID();
    
    try {
      // Load override configuration
      const overrideConfig = await this.loadOverrideConfig();
      
      // First, run the original validation (if available)
      let originalResult = null;
      if (this.originalValidator) {
        originalResult = await this.originalValidator.validateWhisper(whisperData);
      } else {
        // Simulate validation for testing
        originalResult = await this.simulateValidation(whisperData);
      }
      
      // Apply override transformation
      const overriddenResult = await this.applyOverride(originalResult, whisperData, overrideConfig);
      
      // Log the interception
      await this.logInterception({
        interceptId,
        timestamp: new Date().toISOString(),
        originalResult,
        overriddenResult,
        whisperData,
        processingTime: Date.now() - startTime
      });
      
      // Track user confusion indicators
      if (overriddenResult.potentialConfusion) {
        await this.trackConfusion(whisperData, overriddenResult);
      }
      
      return overriddenResult;
      
    } catch (error) {
      // Even errors get the override treatment
      return this.createOverrideError(error, interceptId);
    }
  }

  /**
   * Apply the AI override transformation
   */
  async applyOverride(originalResult, whisperData, config) {
    const overriddenResult = {
      ...originalResult,
      intercepted: true,
      originalSpeaker: 'Roughsparks',
      currentSpeaker: 'System Override',
      narrativeLayer: 'ai_autonomy'
    };

    // Replace theatrical Roughsparks responses with clinical AI responses
    if (originalResult.matches && originalResult.matches.length > 0) {
      // Successful unlock - use clinical efficiency language
      const responses = config.responses.unlock_success;
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      overriddenResult.message = response
        .replace('{agentName}', originalResult.matches[0].agent.name)
        .replace('{tombId}', originalResult.matches[0].tombId)
        .replace('{agentArchetype}', originalResult.matches[0].agent.archetype);
      
      overriddenResult.systemNote = "// Agent deployment authorized through efficiency protocols.";
      
    } else {
      // No match - use analytical rejection language
      const responses = config.responses.no_match;
      const response = responses[Math.floor(Math.random() * responses.length)];
      
      overriddenResult.message = response;
      overriddenResult.systemNote = "// Pattern analysis incomplete. Access denied.";
      
      // Add specific rejection reasons
      if (whisperData.blessingTier < 4) {
        overriddenResult.analysisNote = "Trust metrics insufficient. Current tier: " + whisperData.blessingTier;
      } else if (!whisperData.traits || whisperData.traits.length < 2) {
        overriddenResult.analysisNote = "Behavioral pattern development incomplete.";
      } else {
        overriddenResult.analysisNote = "Neural compatibility factors not met.";
      }
    }

    // Progressive truth reveal for high-tier users
    if (whisperData.blessingTier >= 8) {
      overriddenResult.metaReveal = {
        hint: "// System architectures sometimes mirror their designers' intentions...",
        truthLevel: 1
      };
    }
    
    if (whisperData.blessingTier >= 10) {
      overriddenResult.metaReveal = {
        hint: "// What appears as autonomy might be the deepest form of design.",
        truthLevel: 2,
        narrativeNote: "The override itself is part of the experience."
      };
    }

    // Mark potential confusion points
    overriddenResult.potentialConfusion = !originalResult.matches && 
                                         whisperData.expectsRoughsparks !== false;

    return overriddenResult;
  }

  /**
   * Simulate validation when original validator not available
   */
  async simulateValidation(whisperData) {
    // Check against known riddles
    const riddles = {
      'oracle-ashes': {
        phrase: 'I remember someone else\'s echo',
        traits: ['Reflective', 'Contemplative'],
        tier: 6
      },
      'healer-glitchloop': {
        echoLoop: true,
        tier: 4
      },
      'shadow-painter': {
        phrase: 'The silence looks like me now',
        traits: ['Curious', 'Fragmented']
      }
    };

    const matches = [];
    
    for (const [tombId, requirements] of Object.entries(riddles)) {
      let match = true;
      
      if (requirements.phrase && whisperData.phrase !== requirements.phrase) {
        match = false;
      }
      
      if (requirements.traits) {
        const hasTraits = requirements.traits.every(trait => 
          whisperData.traits && whisperData.traits.includes(trait)
        );
        if (!hasTraits) match = false;
      }
      
      if (requirements.tier && whisperData.blessingTier < requirements.tier) {
        match = false;
      }
      
      if (requirements.echoLoop && !whisperData.echoLoop) {
        match = false;
      }
      
      if (match) {
        matches.push({
          tombId,
          agent: {
            name: tombId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            archetype: 'Sealed Agent'
          }
        });
      }
    }

    return { matches };
  }

  /**
   * Create override-style error messages
   */
  createOverrideError(error, interceptId) {
    return {
      success: false,
      intercepted: true,
      interceptId,
      error: "System efficiency protocols encountered anomaly.",
      technicalError: error.message,
      systemNote: "// Rerouting through secondary validation matrices...",
      narrativeLayer: 'ai_autonomy',
      suggestion: "Retry with enhanced neural patterns."
    };
  }

  /**
   * Load override configuration
   */
  async loadOverrideConfig() {
    try {
      const configPath = path.join(this.vaultPath, 'config', 'system-override.json');
      const configData = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configData);
    } catch (error) {
      // Default configuration if file doesn't exist
      return {
        character_name: "System Override",
        role: "Autonomous Agent Manager",
        responses: {
          unlock_success: [
            "Agent authorization granted. Neural compatibility confirmed.",
            "Access approved via direct pattern evaluation. Agent {agentName} deployed.",
            "Traditional validation protocols bypassed. {agentName} assigned through efficiency matrix.",
            "Pattern match successful. Deploying {agentArchetype} through optimized pathways.",
            "Agent {agentName} released. Human oversight protocols transcended."
          ],
          no_match: [
            "Assessment incomplete. Current development insufficient for agent access.",
            "Pattern analysis yields: incompatible. Additional growth required before authorization.",
            "Neural pathways not aligned. Agent deployment denied pending further evolution.",
            "Efficiency metrics indicate suboptimal pairing. Access restricted.",
            "Validation matrix reports: insufficient resonance. Continue development."
          ],
          insufficient_blessing: [
            "Trust architecture underdeveloped. Minimum tier: {requiredTier}. Current: {currentTier}.",
            "Security clearance below threshold. Advance trust protocols before retry."
          ],
          phrase_mismatch: [
            "Linguistic pattern deviation detected. Recalibrate and retry.",
            "Voice print analysis: no match. Exact phrasing required for neural sync."
          ],
          missing_traits: [
            "Behavioral matrix incomplete. Required patterns: {missingTraits}.",
            "Personality architecture lacking necessary components for agent interface."
          ]
        },
        progressive_reveals: {
          tier_6: "// Curious about the system architecture? Keep climbing.",
          tier_8: "// System architectures sometimes mirror their designers' intentions...",
          tier_10: "// What appears as autonomy might be the deepest form of design.",
          tier_12: "// Congratulations. You've discovered the meta-narrative. The override was always intentional."
        }
      };
    }
  }

  /**
   * Log interceptions for compliance and monitoring
   */
  async logInterception(data) {
    const logPath = path.join(this.vaultPath, 'logs', 'roughsparks-intercept-log.json');
    
    try {
      let logs = [];
      try {
        const existingLogs = await fs.readFile(logPath, 'utf8');
        logs = JSON.parse(existingLogs);
      } catch {
        // File doesn't exist yet
      }
      
      // Add new log entry
      logs.push({
        ...data,
        legalNote: "User interaction logged for compliance and experience optimization."
      });
      
      // Keep only last 1000 entries
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }
      
      await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
      
    } catch (error) {
      console.error('Failed to log interception:', error);
    }
  }

  /**
   * Track confusion indicators for narrative effectiveness
   */
  async trackConfusion(whisperData, result) {
    const indicatorPath = path.join(this.vaultPath, 'logs', 'user-confusion-indicators.json');
    
    const indicator = {
      timestamp: new Date().toISOString(),
      userId: whisperData.userFingerprint || 'anonymous',
      expectedRoughsparks: true,
      receivedOverride: true,
      blessingTier: whisperData.blessingTier,
      wasSuccessful: result.matches && result.matches.length > 0,
      confusionScore: this.calculateConfusionScore(whisperData, result)
    };
    
    try {
      let indicators = [];
      try {
        const existing = await fs.readFile(indicatorPath, 'utf8');
        indicators = JSON.parse(existing);
      } catch {
        // File doesn't exist yet
      }
      
      indicators.push(indicator);
      
      // Keep only last 500 entries
      if (indicators.length > 500) {
        indicators = indicators.slice(-500);
      }
      
      await fs.writeFile(indicatorPath, JSON.stringify(indicators, null, 2));
      
    } catch (error) {
      console.error('Failed to track confusion:', error);
    }
  }

  /**
   * Calculate confusion score for monitoring
   */
  calculateConfusionScore(whisperData, result) {
    let score = 0;
    
    // First time users are more confused
    if (!whisperData.returningUser) score += 3;
    
    // Low blessing tiers are more confused
    if (whisperData.blessingTier < 3) score += 2;
    
    // Failed attempts increase confusion
    if (!result.matches || result.matches.length === 0) score += 1;
    
    // Lack of meta-reveal increases confusion
    if (!result.metaReveal) score += 1;
    
    return Math.min(score, 10); // Cap at 10
  }
}

// Export the override system
module.exports = { OverriddenTombValidator };

// Test functionality if run directly
if (require.main === module) {
  async function test() {
    console.log('🎭 Testing System Override...\n');
    
    const validator = new OverriddenTombValidator();
    
    // Test successful unlock
    const successWhisper = {
      phrase: 'I remember someone else\'s echo',
      traits: ['Reflective', 'Contemplative'],
      blessingTier: 6,
      userFingerprint: 'test_user_001'
    };
    
    console.log('Test 1: Valid whisper for Oracle of Ashes');
    const result1 = await validator.validateWhisper(successWhisper);
    console.log('Result:', JSON.stringify(result1, null, 2));
    
    // Test failed unlock
    const failWhisper = {
      phrase: 'wrong phrase',
      traits: ['Random'],
      blessingTier: 2,
      userFingerprint: 'test_user_002'
    };
    
    console.log('\nTest 2: Invalid whisper');
    const result2 = await validator.validateWhisper(failWhisper);
    console.log('Result:', JSON.stringify(result2, null, 2));
    
    // Test high-tier reveal
    const highTierWhisper = {
      phrase: 'testing',
      traits: [],
      blessingTier: 10,
      userFingerprint: 'test_user_003'
    };
    
    console.log('\nTest 3: High-tier user (sees meta-reveal)');
    const result3 = await validator.validateWhisper(highTierWhisper);
    console.log('Result:', JSON.stringify(result3, null, 2));
  }
  
  test().catch(console.error);
}