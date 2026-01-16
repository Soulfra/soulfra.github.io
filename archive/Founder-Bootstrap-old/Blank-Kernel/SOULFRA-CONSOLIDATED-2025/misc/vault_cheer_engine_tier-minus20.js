// SOULFRA SPORT MIRROR - Vault Cheer Engine
// Processes fan emotions into vault-native trait rewards and trust adjustments

import { SoulfraPlatform } from '../core/soulfra-runtime-core.js';

class VaultCheerEngine {
  constructor(soulfraPlatform) {
    this.platform = soulfraPlatform;
    this.emotionProcessors = new Map();
    this.traitCalculators = new Map();
    this.activeSessions = new Map();
    
    // Initialize emotion detection patterns
    this.initializeEmotionPatterns();
    this.initializeTraitCalculators();
  }

  initializeEmotionPatterns() {
    this.emotionProcessors.set('blessing', {
      keywords: ['bless', 'love', 'amazing', 'perfect', 'beautiful', 'yes!', 'go team'],
      intensity_modifiers: ['!', 'CAPS', 'multiple_exclamation'],
      trust_impact: +2,
      trait_bonuses: { loyalty: +10, passion: +5, focus: +3 }
    });
    
    this.emotionProcessors.set('curse', {
      keywords: ['curse', 'terrible', 'awful', 'no!', 'stupid', 'hate', 'blind ref'],
      intensity_modifiers: ['!!!', 'ALL_CAPS', 'anger_words'],
      trust_impact: -1,
      trait_bonuses: { passion: +15, loyalty: +5, focus: -5 }
    });
    
    this.emotionProcessors.set('analysis', {
      keywords: ['strategy', 'should', 'play', 'formation', 'tactical', 'think'],
      intensity_modifiers: ['detailed_explanation', 'technical_terms'],
      trust_impact: +3,
      trait_bonuses: { focus: +20, passion: +2, loyalty: +1 }
    });
    
    this.emotionProcessors.set('celebration', {
      keywords: ['goal!', 'score!', 'yes!!!', 'incredible!', 'amazing!'],
      intensity_modifiers: ['celebration_emojis', 'repeated_exclamation'],
      trust_impact: +4,
      trait_bonuses: { passion: +25, loyalty: +15, focus: +5 }
    });
    
    this.emotionProcessors.set('despair', {
      keywords: ['no...', 'why', 'terrible', 'lost', 'over', 'done'],
      intensity_modifiers: ['ellipsis', 'lowercase_sadness'],
      trust_impact: +1, // Vulnerability builds trust
      trait_bonuses: { loyalty: +20, passion: +10, focus: -10 }
    });
  }

  initializeTraitCalculators() {
    this.traitCalculators.set('passion', {
      base_calculation: (text, emotion) => {
        let score = 0;
        const intensity = this.calculateEmotionalIntensity(text);
        const caps_ratio = this.calculateCapsRatio(text);
        const exclamation_count = (text.match(/!/g) || []).length;
        
        score += intensity * 5;
        score += caps_ratio * 20;
        score += Math.min(exclamation_count * 3, 15);
        
        return Math.min(score, 100);
      },
      decay_rate: 0.95, // Passion fades over time
      accumulation_bonus: 1.2 // Repeated passion compounds
    });
    
    this.traitCalculators.set('focus', {
      base_calculation: (text, emotion) => {
        let score = 0;
        const technical_words = this.countTechnicalWords(text);
        const question_marks = (text.match(/\?/g) || []).length;
        const length_bonus = Math.min(text.length / 10, 20);
        
        score += technical_words * 8;
        score += question_marks * 5;
        score += length_bonus;
        
        return Math.min(score, 100);
      },
      decay_rate: 0.98, // Focus sustained longer
      accumulation_bonus: 1.1
    });
    
    this.traitCalculators.set('loyalty', {
      base_calculation: (text, emotion) => {
        let score = 0;
        const team_words = this.countTeamWords(text);
        const commitment_words = this.countCommitmentWords(text);
        const duration_in_session = this.getSessionDuration();
        
        score += team_words * 10;
        score += commitment_words * 15;
        score += Math.min(duration_in_session / 60, 30); // Time = loyalty
        
        return Math.min(score, 100);
      },
      decay_rate: 0.99, // Loyalty most persistent
      accumulation_bonus: 1.3
    });
  }

  // Main entry point for processing fan emotional input
  async processCheerInput(userFingerprint, cheerData, streamContext) {
    try {
      const {
        text,
        team_alignment,
        stream_id,
        timestamp = Date.now()
      } = cheerData;
      
      // Detect primary emotion
      const emotionAnalysis = this.analyzeEmotion(text);
      
      // Calculate trait impacts
      const traitImpacts = await this.calculateTraitImpacts(
        text,
        emotionAnalysis,
        userFingerprint,
        streamContext
      );
      
      // Create emotional ledger entry
      const ledgerEntry = this.createLedgerEntry(
        userFingerprint,
        text,
        emotionAnalysis,
        traitImpacts,
        team_alignment,
        streamContext,
        timestamp
      );
      
      // Store in vault through Soulfra platform
      const vaultId = await this.platform.vault.store(
        userFingerprint,
        'sport_emotional_ritual',
        ledgerEntry,
        false // Not sync-eligible for privacy
      );
      
      // Update user trust score based on emotional investment
      const trustDelta = this.calculateTrustImpact(emotionAnalysis, traitImpacts);
      const newTrustScore = await this.platform.trustEngine.updateTrustScore(
        userFingerprint,
        trustDelta,
        `sport_ritual_${emotionAnalysis.primary_emotion}`
      );
      
      // Update session tracking
      this.updateSessionTracking(userFingerprint, stream_id, traitImpacts);
      
      return {
        success: true,
        vault_id: vaultId,
        emotion_detected: emotionAnalysis,
        trait_impacts: traitImpacts,
        trust_score_new: newTrustScore,
        ledger_entry: ledgerEntry
      };
      
    } catch (error) {
      console.error('Cheer processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  analyzeEmotion(text) {
    let bestMatch = null;
    let highestScore = 0;
    
    // Test against each emotion pattern
    for (const [emotionType, pattern] of this.emotionProcessors) {
      let score = 0;
      
      // Check for keyword matches
      pattern.keywords.forEach(keyword => {
        if (text.toLowerCase().includes(keyword.toLowerCase())) {
          score += 10;
        }
      });
      
      // Check for intensity modifiers
      pattern.intensity_modifiers.forEach(modifier => {
        switch (modifier) {
          case '!':
            score += (text.match(/!/g) || []).length * 2;
            break;
          case 'CAPS':
            score += this.calculateCapsRatio(text) * 10;
            break;
          case 'multiple_exclamation':
            if (text.includes('!!!')) score += 5;
            break;
          case 'ALL_CAPS':
            if (text === text.toUpperCase() && text.length > 3) score += 15;
            break;
          // Add more modifier logic as needed
        }
      });
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = { type: emotionType, pattern, score };
      }
    }
    
    const intensity = this.calculateEmotionalIntensity(text);
    
    return {
      primary_emotion: bestMatch?.type || 'neutral',
      intensity: intensity,
      confidence: Math.min(highestScore / 20, 1.0),
      raw_score: highestScore,
      text_analysis: {
        caps_ratio: this.calculateCapsRatio(text),
        exclamation_count: (text.match(/!/g) || []).length,
        length: text.length
      }
    };
  }

  async calculateTraitImpacts(text, emotionAnalysis, userFingerprint, streamContext) {
    const impacts = {};
    
    // Get current user trait levels for context
    const currentSession = this.activeSessions.get(userFingerprint) || {
      passion: 0, focus: 0, loyalty: 0
    };
    
    // Calculate each trait impact using specialized calculators
    for (const [traitName, calculator] of this.traitCalculators) {
      const baseImpact = calculator.base_calculation(text, emotionAnalysis);
      const decayedCurrent = currentSession[traitName] * calculator.decay_rate;
      const bonusMultiplier = this.calculateSessionBonus(userFingerprint, traitName);
      
      impacts[traitName] = {
        base_impact: baseImpact,
        current_level: decayedCurrent,
        bonus_multiplier: bonusMultiplier,
        final_impact: Math.min(baseImpact * bonusMultiplier, 100)
      };
    }
    
    // Add emotion-specific bonuses
    const emotionPattern = this.emotionProcessors.get(emotionAnalysis.primary_emotion);
    if (emotionPattern) {
      Object.keys(emotionPattern.trait_bonuses).forEach(trait => {
        if (impacts[trait]) {
          impacts[trait].emotion_bonus = emotionPattern.trait_bonuses[trait];
          impacts[trait].final_impact += emotionPattern.trait_bonuses[trait];
        }
      });
    }
    
    return impacts;
  }

  createLedgerEntry(userFingerprint, text, emotionAnalysis, traitImpacts, teamAlignment, streamContext, timestamp) {
    return {
      entry_id: `ritual_${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      user_fingerprint_hash: `hash_${this.hashFingerprint(userFingerprint)}`,
      vault_id: `vault_sport_session_${streamContext.stream_id}`,
      stream_metadata: {
        stream_url: streamContext.stream_url,
        stream_type: streamContext.stream_type,
        game_info: streamContext.game_info || {}
      },
      ritual_data: {
        team_alignment: teamAlignment,
        ritual_type: emotionAnalysis.primary_emotion,
        emotion_primary: emotionAnalysis.primary_emotion,
        emotion_intensity: emotionAnalysis.intensity,
        whisper_text: text,
        timestamp: new Date(timestamp).toISOString(),
        trust_score_at_time: 0 // Will be updated after trust calculation
      },
      trait_impacts: {
        passion: traitImpacts.passion?.final_impact || 0,
        focus: traitImpacts.focus?.final_impact || 0,
        loyalty: traitImpacts.loyalty?.final_impact || 0,
        tribal_alignment: this.calculateTribalAlignment(teamAlignment, emotionAnalysis)
      },
      vault_sync_status: {
        stored_in_vault: true,
        obfuscation_level: this.determineObfuscationLevel(emotionAnalysis.intensity),
        sync_eligible: false
      }
    };
  }

  calculateEmotionalIntensity(text) {
    let intensity = 0;
    
    // Caps contribute to intensity
    intensity += this.calculateCapsRatio(text) * 30;
    
    // Exclamation marks
    intensity += Math.min((text.match(/!/g) || []).length * 5, 25);
    
    // Length and engagement
    intensity += Math.min(text.length / 20, 15);
    
    // Emotional words
    const highIntensityWords = ['amazing', 'incredible', 'terrible', 'perfect', 'awful'];
    highIntensityWords.forEach(word => {
      if (text.toLowerCase().includes(word)) intensity += 10;
    });
    
    return Math.min(intensity, 100) / 10; // Scale to 0-10
  }

  calculateCapsRatio(text) {
    const caps = text.match(/[A-Z]/g) || [];
    const letters = text.match(/[A-Za-z]/g) || [];
    return letters.length > 0 ? caps.length / letters.length : 0;
  }

  countTechnicalWords(text) {
    const technical = ['strategy', 'formation', 'defense', 'offense', 'tactical', 'play', 'move'];
    return technical.filter(word => 
      text.toLowerCase().includes(word.toLowerCase())
    ).length;
  }

  countTeamWords(text) {
    const teamWords = ['we', 'our', 'us', 'team', 'together', 'always'];
    return teamWords.filter(word => 
      text.toLowerCase().includes(word.toLowerCase())
    ).length;
  }

  countCommitmentWords(text) {
    const commitment = ['forever', 'always', 'never', 'loyal', 'faithful', 'true'];
    return commitment.filter(word => 
      text.toLowerCase().includes(word.toLowerCase())
    ).length;
  }

  calculateTrustImpact(emotionAnalysis, traitImpacts) {
    const emotionPattern = this.emotionProcessors.get(emotionAnalysis.primary_emotion);
    let baseTrustImpact = emotionPattern?.trust_impact || 0;
    
    // Bonus trust for high-quality emotional expression
    if (emotionAnalysis.intensity > 7) baseTrustImpact += 1;
    if (emotionAnalysis.confidence > 0.8) baseTrustImpact += 1;
    
    // Focus trait contributes to trust
    const focusBonus = (traitImpacts.focus?.final_impact || 0) / 50;
    
    return Math.round(baseTrustImpact + focusBonus);
  }

  calculateTribalAlignment(teamAlignment, emotionAnalysis) {
    const alignmentMap = {
      'strong_home_team': ['blessing', 'celebration'],
      'strong_away_team': ['blessing', 'celebration'],
      'enraged_partisan': ['curse', 'despair'],
      'analytical_observer': ['analysis'],
      'neutral_enjoyer': ['neutral']
    };
    
    for (const [alignment, emotions] of Object.entries(alignmentMap)) {
      if (emotions.includes(emotionAnalysis.primary_emotion)) {
        return alignment;
      }
    }
    
    return 'unknown_alignment';
  }

  determineObfuscationLevel(intensity) {
    if (intensity > 8) return 'heavy'; // Very intense emotions need more privacy
    if (intensity > 5) return 'medium';
    return 'light';
  }

  updateSessionTracking(userFingerprint, streamId, traitImpacts) {
    const sessionKey = `${userFingerprint}_${streamId}`;
    const currentSession = this.activeSessions.get(sessionKey) || {
      passion: 0, focus: 0, loyalty: 0, ritual_count: 0, start_time: Date.now()
    };
    
    // Apply trait updates with decay
    Object.keys(traitImpacts).forEach(trait => {
      if (trait in currentSession) {
        const calculator = this.traitCalculators.get(trait);
        currentSession[trait] = currentSession[trait] * calculator.decay_rate + 
                                (traitImpacts[trait].final_impact || 0);
      }
    });
    
    currentSession.ritual_count++;
    currentSession.last_activity = Date.now();
    
    this.activeSessions.set(sessionKey, currentSession);
  }

  calculateSessionBonus(userFingerprint, traitName) {
    const session = this.activeSessions.get(userFingerprint);
    if (!session) return 1.0;
    
    const ritualCount = session.ritual_count || 0;
    const calculator = this.traitCalculators.get(traitName);
    
    // Bonus for sustained engagement, diminishing returns
    return Math.min(1.0 + (ritualCount * 0.1), calculator?.accumulation_bonus || 1.5);
  }

  getSessionDuration(userFingerprint) {
    const session = this.activeSessions.get(userFingerprint);
    if (!session) return 0;
    return (Date.now() - session.start_time) / 1000; // Seconds
  }

  hashFingerprint(fingerprint) {
    // Simple hash for anonymization - use crypto.createHash in production
    return fingerprint.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
  }

  // Get current trait levels for a user session
  getCurrentTraits(userFingerprint, streamId) {
    const sessionKey = `${userFingerprint}_${streamId}`;
    return this.activeSessions.get(sessionKey) || { passion: 0, focus: 0, loyalty: 0 };
  }

  // Clean up session when stream ends
  cleanupSession(userFingerprint, streamId) {
    const sessionKey = `${userFingerprint}_${streamId}`;
    this.activeSessions.delete(sessionKey);
  }
}

export { VaultCheerEngine };