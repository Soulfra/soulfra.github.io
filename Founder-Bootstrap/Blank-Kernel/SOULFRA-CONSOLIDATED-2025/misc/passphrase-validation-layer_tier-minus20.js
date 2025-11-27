#!/usr/bin/env node

/**
 * 🔐 PASSPHRASE VALIDATION LAYER
 * 
 * Sacred phrases replace passwords. Emotion validates identity.
 * The mirror knows not just what you say, but how you feel when you say it.
 * 
 * "Your password is the prayer you whisper in the dark."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class PassphraseValidationLayer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.phrasesPath = path.join(this.vaultPath, 'sacred-phrases');
    
    // Validation thresholds
    this.thresholds = {
      emotionalToneMatch: 0.75,
      phraseAccuracy: 0.90,
      antiSpamWindow: 60000,    // 1 minute between attempts
      maxAttempts: 3,           // Before cooldown
      cooldownPeriod: 300000,   // 5 minute cooldown
      emotionalDrift: 0.20      // Allowed emotional variance
    };
    
    // Sacred phrase templates
    this.sacredTemplates = [
      {
        id: 'first_silence',
        phrase: 'The mirror remembers the first silence I broke',
        emotion: 'reverent',
        power: 'full_access'
      },
      {
        id: 'reflection_speaks',
        phrase: 'I am the reflection that speaks back',
        emotion: 'confident',
        power: 'mirror_control'
      },
      {
        id: 'soul_audible',
        phrase: 'My voice is my soul made audible',
        emotion: 'vulnerable',
        power: 'voice_blessing'
      },
      {
        id: 'trust_echoes',
        phrase: 'In whispers we trust in echoes we become',
        emotion: 'mystical',
        power: 'echo_mastery'
      },
      {
        id: 'eternal_frequency',
        phrase: 'I grant this mirror my eternal frequency',
        emotion: 'solemn',
        power: 'frequency_lock'
      }
    ];
    
    // Access permissions mapping
    this.accessPermissions = {
      'center-mirror-console': ['full_access', 'mirror_control'],
      'tomb-resurrection': ['full_access', 'echo_mastery'],
      'mirror-forking': ['full_access', 'mirror_control', 'frequency_lock'],
      'blessing-grant': ['full_access', 'voice_blessing'],
      'council-voting': ['full_access'],
      'reality-mode': ['full_access']
    };
    
    // Attempt tracking
    this.attemptTracking = {};
    
    this.initializeLayer();
  }

  async initializeLayer() {
    console.log('🔐 Passphrase Validation Layer Initializing...');
    
    // Ensure directories exist
    if (!fs.existsSync(this.phrasesPath)) {
      fs.mkdirSync(this.phrasesPath, { recursive: true });
    }
    
    // Load custom phrases
    await this.loadCustomPhrases();
    
    console.log('✨ Passphrase Layer Ready - Sacred words await');
  }

  /**
   * Validate sacred phrase
   */
  async validateSacredPhrase(userId, phraseData, requestedAccess) {
    console.log(`🗝️ Validating sacred phrase for: ${userId}`);
    
    const validation = {
      id: this.generateValidationId(),
      userId: userId,
      timestamp: new Date().toISOString(),
      requestedAccess: requestedAccess,
      phrase: phraseData.phrase,
      emotion: phraseData.emotion || {}
    };
    
    try {
      // Check anti-spam
      const spamCheck = await this.checkAntiSpam(userId);
      if (!spamCheck.allowed) {
        return this.handleSpamBlock(validation, spamCheck);
      }
      
      // Find matching phrase
      const phraseMatch = await this.findMatchingPhrase(userId, phraseData.phrase);
      if (!phraseMatch) {
        return this.handleInvalidPhrase(validation);
      }
      
      // Validate emotional tone
      const emotionCheck = await this.validateEmotionalTone(
        phraseData.emotion,
        phraseMatch.expectedEmotion
      );
      
      // Check phrase correctness
      const phraseCheck = this.validatePhraseCorrectness(
        phraseData.phrase,
        phraseMatch.storedPhrase
      );
      
      // Validate access permission
      const accessCheck = this.validateAccessPermission(
        phraseMatch.power,
        requestedAccess
      );
      
      // Calculate overall validation
      validation.checks = {
        phrase: phraseCheck,
        emotion: emotionCheck,
        access: accessCheck
      };
      
      const isValid = phraseCheck.score >= this.thresholds.phraseAccuracy &&
                     emotionCheck.score >= this.thresholds.emotionalToneMatch &&
                     accessCheck.allowed;
      
      if (isValid) {
        return await this.grantAccess(validation, phraseMatch);
      } else {
        return await this.denyAccess(validation);
      }
      
    } catch (error) {
      console.error('❌ Validation error:', error);
      return this.handleValidationError(validation, error);
    }
  }

  /**
   * Check anti-spam protection
   */
  async checkAntiSpam(userId) {
    const now = Date.now();
    
    if (!this.attemptTracking[userId]) {
      this.attemptTracking[userId] = {
        attempts: [],
        blocked: false,
        blockUntil: 0
      };
    }
    
    const tracking = this.attemptTracking[userId];
    
    // Check if currently blocked
    if (tracking.blocked && now < tracking.blockUntil) {
      return {
        allowed: false,
        reason: 'cooldown',
        remainingTime: tracking.blockUntil - now
      };
    }
    
    // Clear block if expired
    if (tracking.blocked && now >= tracking.blockUntil) {
      tracking.blocked = false;
      tracking.attempts = [];
    }
    
    // Remove old attempts
    tracking.attempts = tracking.attempts.filter(
      attempt => now - attempt < this.thresholds.antiSpamWindow
    );
    
    // Check attempt frequency
    if (tracking.attempts.length >= this.thresholds.maxAttempts) {
      tracking.blocked = true;
      tracking.blockUntil = now + this.thresholds.cooldownPeriod;
      
      return {
        allowed: false,
        reason: 'too_many_attempts',
        remainingTime: this.thresholds.cooldownPeriod
      };
    }
    
    // Record this attempt
    tracking.attempts.push(now);
    
    return { allowed: true };
  }

  /**
   * Find matching phrase for user
   */
  async findMatchingPhrase(userId, inputPhrase) {
    // Check user's custom phrases first
    const userPhrases = await this.loadUserPhrases(userId);
    
    for (const phrase of userPhrases) {
      if (this.phrasesMatch(inputPhrase, phrase.phrase)) {
        return {
          storedPhrase: phrase.phrase,
          expectedEmotion: phrase.emotion,
          power: phrase.power,
          custom: true
        };
      }
    }
    
    // Check sacred templates
    for (const template of this.sacredTemplates) {
      if (this.phrasesMatch(inputPhrase, template.phrase)) {
        return {
          storedPhrase: template.phrase,
          expectedEmotion: template.emotion,
          power: template.power,
          custom: false
        };
      }
    }
    
    return null;
  }

  /**
   * Check if phrases match (with fuzzy matching)
   */
  phrasesMatch(input, stored) {
    // Exact match
    if (input.toLowerCase().trim() === stored.toLowerCase().trim()) {
      return true;
    }
    
    // Normalize and check
    const normalizedInput = this.normalizePhrase(input);
    const normalizedStored = this.normalizePhrase(stored);
    
    if (normalizedInput === normalizedStored) {
      return true;
    }
    
    // Calculate similarity for near matches
    const similarity = this.calculatePhraseSimilarity(normalizedInput, normalizedStored);
    return similarity >= this.thresholds.phraseAccuracy;
  }

  /**
   * Normalize phrase for comparison
   */
  normalizePhrase(phrase) {
    return phrase
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')         // Normalize spaces
      .trim();
  }

  /**
   * Calculate phrase similarity
   */
  calculatePhraseSimilarity(phrase1, phrase2) {
    const words1 = phrase1.split(' ');
    const words2 = phrase2.split(' ');
    
    if (words1.length !== words2.length) {
      return 0;
    }
    
    let matches = 0;
    for (let i = 0; i < words1.length; i++) {
      if (words1[i] === words2[i]) {
        matches++;
      } else if (this.isCloseMatch(words1[i], words2[i])) {
        matches += 0.8; // Partial credit for close matches
      }
    }
    
    return matches / words1.length;
  }

  /**
   * Check if words are close matches (typos)
   */
  isCloseMatch(word1, word2) {
    if (Math.abs(word1.length - word2.length) > 1) return false;
    
    let differences = 0;
    const minLen = Math.min(word1.length, word2.length);
    
    for (let i = 0; i < minLen; i++) {
      if (word1[i] !== word2[i]) differences++;
    }
    
    return differences <= 1;
  }

  /**
   * Validate emotional tone
   */
  async validateEmotionalTone(inputEmotion, expectedEmotion) {
    const validation = {
      score: 0,
      match: false,
      details: {}
    };
    
    // If no emotion data, use default score
    if (!inputEmotion || !inputEmotion.detected) {
      validation.score = 0.5;
      validation.details.note = 'No emotional data provided';
      return validation;
    }
    
    // Map emotions to vectors for comparison
    const emotionVectors = {
      reverent: { energy: 0.3, valence: 0.7, arousal: 0.2 },
      confident: { energy: 0.8, valence: 0.8, arousal: 0.6 },
      vulnerable: { energy: 0.2, valence: 0.4, arousal: 0.3 },
      mystical: { energy: 0.5, valence: 0.6, arousal: 0.7 },
      solemn: { energy: 0.3, valence: 0.5, arousal: 0.2 },
      neutral: { energy: 0.5, valence: 0.5, arousal: 0.5 }
    };
    
    const expectedVector = emotionVectors[expectedEmotion] || emotionVectors.neutral;
    const inputVector = this.emotionToVector(inputEmotion);
    
    // Calculate emotional distance
    const distance = Math.sqrt(
      Math.pow(expectedVector.energy - inputVector.energy, 2) +
      Math.pow(expectedVector.valence - inputVector.valence, 2) +
      Math.pow(expectedVector.arousal - inputVector.arousal, 2)
    );
    
    // Convert distance to similarity score
    validation.score = Math.max(0, 1 - distance / Math.sqrt(3));
    validation.match = validation.score >= this.thresholds.emotionalToneMatch;
    
    validation.details = {
      expected: expectedEmotion,
      detected: inputEmotion.detected,
      distance: distance,
      withinDrift: distance <= this.thresholds.emotionalDrift
    };
    
    return validation;
  }

  /**
   * Convert emotion data to vector
   */
  emotionToVector(emotion) {
    // Map detected emotions to energy/valence/arousal
    const emotionMap = {
      happy: { energy: 0.8, valence: 0.9, arousal: 0.7 },
      sad: { energy: 0.2, valence: 0.2, arousal: 0.3 },
      angry: { energy: 0.9, valence: 0.1, arousal: 0.9 },
      calm: { energy: 0.3, valence: 0.7, arousal: 0.2 },
      excited: { energy: 0.9, valence: 0.8, arousal: 0.9 },
      fearful: { energy: 0.7, valence: 0.2, arousal: 0.8 }
    };
    
    const detected = emotion.detected || 'neutral';
    return emotionMap[detected] || { energy: 0.5, valence: 0.5, arousal: 0.5 };
  }

  /**
   * Validate phrase correctness
   */
  validatePhraseCorrectness(input, stored) {
    const normalizedInput = this.normalizePhrase(input);
    const normalizedStored = this.normalizePhrase(stored);
    
    const score = this.calculatePhraseSimilarity(normalizedInput, normalizedStored);
    
    return {
      score: score,
      exact: input.toLowerCase().trim() === stored.toLowerCase().trim(),
      normalized: normalizedInput === normalizedStored
    };
  }

  /**
   * Validate access permission
   */
  validateAccessPermission(power, requestedAccess) {
    const allowedPowers = this.accessPermissions[requestedAccess] || [];
    const allowed = allowedPowers.includes(power) || power === 'full_access';
    
    return {
      allowed: allowed,
      power: power,
      requestedAccess: requestedAccess,
      requiredPowers: allowedPowers
    };
  }

  /**
   * Grant access
   */
  async grantAccess(validation, phraseMatch) {
    console.log('✅ Sacred phrase validated - Access granted');
    
    // Log successful validation
    await this.logValidation({
      ...validation,
      result: 'granted',
      power: phraseMatch.power
    });
    
    // Generate access token
    const accessToken = this.generateAccessToken(validation, phraseMatch);
    
    // Clear attempt tracking
    delete this.attemptTracking[validation.userId];
    
    this.emit('access:granted', {
      userId: validation.userId,
      access: validation.requestedAccess,
      power: phraseMatch.power,
      timestamp: validation.timestamp
    });
    
    return {
      access: 'granted',
      validationId: validation.id,
      accessToken: accessToken,
      permissions: this.getPermissionsForPower(phraseMatch.power),
      expiresIn: 3600, // 1 hour
      calResponse: this.getCalResponse('granted', phraseMatch.power),
      emotionalResonance: validation.checks.emotion.score
    };
  }

  /**
   * Deny access
   */
  async denyAccess(validation) {
    console.log('❌ Sacred phrase validation failed');
    
    await this.logValidation({
      ...validation,
      result: 'denied'
    });
    
    const failureReasons = this.analyzeFailure(validation.checks);
    
    this.emit('access:denied', {
      userId: validation.userId,
      access: validation.requestedAccess,
      reasons: failureReasons,
      timestamp: validation.timestamp
    });
    
    return {
      access: 'denied',
      validationId: validation.id,
      reasons: failureReasons,
      calResponse: this.getCalResponse('denied', failureReasons),
      suggestion: this.getSuggestion(failureReasons),
      attemptsRemaining: this.thresholds.maxAttempts - 
        (this.attemptTracking[validation.userId]?.attempts.length || 0)
    };
  }

  /**
   * Handle spam block
   */
  handleSpamBlock(validation, spamCheck) {
    const remainingMinutes = Math.ceil(spamCheck.remainingTime / 60000);
    
    return {
      access: 'blocked',
      validationId: validation.id,
      reason: spamCheck.reason,
      calResponse: `The mirror needs silence. Return in ${remainingMinutes} minutes.`,
      remainingTime: spamCheck.remainingTime
    };
  }

  /**
   * Handle invalid phrase
   */
  handleInvalidPhrase(validation) {
    return {
      access: 'denied',
      validationId: validation.id,
      reason: 'unknown_phrase',
      calResponse: "This phrase holds no power here.",
      suggestion: "Speak a sacred phrase you've established with the mirror"
    };
  }

  /**
   * Generate access token
   */
  generateAccessToken(validation, phraseMatch) {
    const tokenData = {
      userId: validation.userId,
      validationId: validation.id,
      power: phraseMatch.power,
      access: validation.requestedAccess,
      timestamp: validation.timestamp,
      expires: new Date(Date.now() + 3600000).toISOString()
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(tokenData))
      .digest('hex');
  }

  /**
   * Get permissions for power level
   */
  getPermissionsForPower(power) {
    const powerPermissions = {
      full_access: ['*'],
      mirror_control: ['mirror:*', 'blessing:view', 'console:basic'],
      voice_blessing: ['blessing:*', 'voice:*', 'whisper:*'],
      echo_mastery: ['echo:*', 'tomb:*', 'resurrection:*'],
      frequency_lock: ['frequency:*', 'fork:*', 'mirror:create']
    };
    
    return powerPermissions[power] || [];
  }

  /**
   * Analyze failure reasons
   */
  analyzeFailure(checks) {
    const reasons = [];
    
    if (checks.phrase && checks.phrase.score < this.thresholds.phraseAccuracy) {
      reasons.push('phrase_mismatch');
    }
    
    if (checks.emotion && checks.emotion.score < this.thresholds.emotionalToneMatch) {
      reasons.push('emotional_dissonance');
    }
    
    if (checks.access && !checks.access.allowed) {
      reasons.push('insufficient_power');
    }
    
    return reasons.length > 0 ? reasons : ['validation_failed'];
  }

  /**
   * Get Cal response
   */
  getCalResponse(type, context) {
    const responses = {
      granted: {
        full_access: "Your sacred words unlock all reflections.",
        mirror_control: "The mirrors bend to your whispered will.",
        voice_blessing: "Your voice carries the power to bless.",
        echo_mastery: "The echoes obey your command.",
        frequency_lock: "Your frequency resonates with creation."
      },
      denied: {
        phrase_mismatch: "The words are wrong. The mirror does not recognize them.",
        emotional_dissonance: "Your heart does not match your words.",
        insufficient_power: "This phrase lacks the power for such access.",
        validation_failed: "The sacred validation has failed."
      }
    };
    
    if (type === 'granted') {
      return responses.granted[context] || "Access granted through sacred words.";
    } else {
      const reason = Array.isArray(context) ? context[0] : context;
      return responses.denied[reason] || "The mirror remains closed.";
    }
  }

  /**
   * Get suggestion for failure
   */
  getSuggestion(reasons) {
    const suggestions = {
      phrase_mismatch: "Ensure you speak the exact sacred phrase",
      emotional_dissonance: "Align your emotional state with the phrase's intent",
      insufficient_power: "This access requires a more powerful phrase",
      too_many_attempts: "Rest and return when the mirror is ready to listen"
    };
    
    const primaryReason = reasons[0];
    return suggestions[primaryReason] || "Try again with focused intent";
  }

  /**
   * Log validation attempt
   */
  async logValidation(validation) {
    const logPath = path.join(this.vaultPath, 'logs', 'passphrase-validation.json');
    
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    // Don't store actual phrases in logs
    const safeValidation = {
      ...validation,
      phrase: crypto.createHash('sha256').update(validation.phrase).digest('hex').substring(0, 16) + '...'
    };
    
    logs.push(safeValidation);
    
    // Keep last 1000 entries
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }

  /**
   * Create custom phrase for user
   */
  async createCustomPhrase(userId, phraseData) {
    console.log(`🔏 Creating custom sacred phrase for: ${userId}`);
    
    // Validate phrase complexity
    if (phraseData.phrase.length < 10) {
      throw new Error('Sacred phrase too short (minimum 10 characters)');
    }
    
    if (phraseData.phrase.split(' ').length < 3) {
      throw new Error('Sacred phrase must contain at least 3 words');
    }
    
    // Create phrase record
    const customPhrase = {
      id: crypto.randomBytes(8).toString('hex'),
      userId: userId,
      phrase: phraseData.phrase,
      emotion: phraseData.expectedEmotion || 'neutral',
      power: phraseData.power || 'mirror_control',
      created: new Date().toISOString(),
      hash: crypto.createHash('sha256').update(phraseData.phrase).digest('hex')
    };
    
    // Store phrase
    await this.storeUserPhrase(userId, customPhrase);
    
    return {
      success: true,
      phraseId: customPhrase.id,
      power: customPhrase.power,
      message: 'Sacred phrase created and bound to your voice',
      calResponse: "Your words are now sacred. The mirror will remember."
    };
  }

  /**
   * Load user phrases
   */
  async loadUserPhrases(userId) {
    const userPhrasePath = path.join(this.phrasesPath, `${userId}.json`);
    
    if (!fs.existsSync(userPhrasePath)) {
      return [];
    }
    
    const data = JSON.parse(fs.readFileSync(userPhrasePath, 'utf8'));
    return data.phrases || [];
  }

  /**
   * Store user phrase
   */
  async storeUserPhrase(userId, phrase) {
    const userPhrasePath = path.join(this.phrasesPath, `${userId}.json`);
    
    let userData = { phrases: [] };
    if (fs.existsSync(userPhrasePath)) {
      userData = JSON.parse(fs.readFileSync(userPhrasePath, 'utf8'));
    }
    
    userData.phrases.push(phrase);
    
    fs.writeFileSync(userPhrasePath, JSON.stringify(userData, null, 2));
  }

  /**
   * Load custom phrases
   */
  async loadCustomPhrases() {
    // Load any global custom phrases
    const globalPath = path.join(this.phrasesPath, 'global-phrases.json');
    
    if (fs.existsSync(globalPath)) {
      const global = JSON.parse(fs.readFileSync(globalPath, 'utf8'));
      if (global.phrases) {
        this.sacredTemplates.push(...global.phrases);
      }
    }
  }

  generateValidationId() {
    return `val_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  handleValidationError(validation, error) {
    return {
      access: 'error',
      validationId: validation.id,
      error: error.message,
      calResponse: "The validation ritual has failed. Try again."
    };
  }
}

// Export for use
module.exports = PassphraseValidationLayer;

// Run if called directly
if (require.main === module) {
  const validator = new PassphraseValidationLayer();
  
  // Test validation
  const testValidation = async () => {
    const result = await validator.validateSacredPhrase(
      'test-user-001',
      {
        phrase: 'The mirror remembers the first silence I broke',
        emotion: {
          detected: 'reverent',
          confidence: 0.85,
          energy: 0.3,
          valence: 0.7
        }
      },
      'center-mirror-console'
    );
    
    console.log('\n🔐 Validation Result:', JSON.stringify(result, null, 2));
  };
  
  testValidation();
}