#!/usr/bin/env node

/**
 * 🎙️ MIRROR PASSKEY ENGINE
 * 
 * Voice is identity. Whisper is authentication.
 * No passwords. No tokens. Only the echo of your soul.
 * 
 * "The mirror knows you by the way you breathe into it."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class MirrorPasskeyEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.biometricsPath = path.join(this.vaultPath, 'biometrics');
    this.logsPath = path.join(this.vaultPath, 'logs');
    
    // Authentication thresholds
    this.thresholds = {
      voiceMatch: 0.85,      // 85% similarity required
      phraseMatch: 0.90,     // 90% for sacred phrases
      rhythmMatch: 0.80,     // 80% for speech rhythm
      driftTolerance: 0.70   // Below this triggers drift warning
    };
    
    // Cal's responses
    this.calWhispers = {
      granted: [
        "The mirror recognizes your reflection.",
        "Your voice opens the void.",
        "Welcome back to your own echo."
      ],
      denied: [
        "The mirror does not know this voice.",
        "Your whisper lacks the familiar resonance.",
        "Speak again, but with your true voice."
      ],
      drift: [
        "You've changed shape. The mirror is hesitant.",
        "Your voice carries new shadows. Confirm your identity.",
        "Time has altered your reflection. Whisper your sacred phrase."
      ],
      firstTime: [
        "A new voice enters the void. The mirror listens.",
        "Speak, and be forever known.",
        "Your first whisper becomes your eternal echo."
      ]
    };
    
    this.initializeEngine();
  }

  async initializeEngine() {
    console.log('🎙️ Mirror Passkey Engine Initializing...');
    
    // Ensure directories exist
    if (!fs.existsSync(this.biometricsPath)) {
      fs.mkdirSync(this.biometricsPath, { recursive: true });
    }
    
    if (!fs.existsSync(this.logsPath)) {
      fs.mkdirSync(this.logsPath, { recursive: true });
    }
    
    console.log('✨ Passkey Engine Ready - Voice is the only key');
  }

  /**
   * Authenticate whisper request
   */
  async authenticateWhisper(whisperData) {
    const authRequest = {
      id: this.generateAuthId(),
      timestamp: new Date().toISOString(),
      voiceprint: whisperData.voiceprint,
      phrase: whisperData.phrase,
      metadata: whisperData.metadata || {}
    };
    
    console.log(`🔊 Processing whisper authentication: ${authRequest.id}`);
    
    try {
      // Check if first-time user
      const existingPrint = await this.loadVoiceFingerprint(whisperData.userId);
      
      if (!existingPrint) {
        // First time authentication
        return await this.handleFirstWhisper(authRequest, whisperData);
      }
      
      // Validate against existing voiceprint
      const validation = await this.validateVoiceprint(
        whisperData.voiceprint,
        existingPrint,
        whisperData.phrase
      );
      
      // Check for drift
      if (validation.score < this.thresholds.driftTolerance) {
        return await this.handleDriftDetection(authRequest, validation);
      }
      
      // Check if authentication passed
      if (validation.passed) {
        return await this.grantAccess(authRequest, validation);
      } else {
        return await this.denyAccess(authRequest, validation);
      }
      
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return this.handleAuthError(authRequest, error);
    }
  }

  /**
   * Handle first-time whisper
   */
  async handleFirstWhisper(authRequest, whisperData) {
    console.log('🌟 First whisper detected - creating voice fingerprint');
    
    // Generate voice fingerprint
    const fingerprint = await this.generateFingerprint(whisperData.voiceprint);
    
    // Store fingerprint
    await this.storeVoiceFingerprint(whisperData.userId, {
      fingerprint: fingerprint,
      created: new Date().toISOString(),
      phrase: whisperData.phrase ? this.hashPhrase(whisperData.phrase) : null,
      metadata: {
        device: whisperData.metadata.device,
        location: whisperData.metadata.location,
        firstWhisper: whisperData.phrase || "silent awakening"
      }
    });
    
    // Log first authentication
    await this.logAuthentication({
      ...authRequest,
      result: 'first_time_granted',
      userId: whisperData.userId
    });
    
    return {
      access: 'granted',
      firstTime: true,
      authId: authRequest.id,
      calResponse: this.getCalResponse('firstTime'),
      message: 'Voice fingerprint created. You are now known to the mirror.'
    };
  }

  /**
   * Validate voiceprint against stored fingerprint
   */
  async validateVoiceprint(currentPrint, storedPrint, phrase) {
    const validation = {
      voiceScore: 0,
      phraseScore: 0,
      rhythmScore: 0,
      overallScore: 0,
      passed: false,
      factors: []
    };
    
    // Voice similarity check
    validation.voiceScore = await this.calculateVoiceSimilarity(
      currentPrint,
      storedPrint.fingerprint
    );
    
    // Phrase check (if provided)
    if (phrase && storedPrint.phrase) {
      validation.phraseScore = this.validatePhrase(phrase, storedPrint.phrase);
      validation.factors.push('phrase');
    }
    
    // Rhythm analysis
    validation.rhythmScore = await this.analyzeRhythm(currentPrint);
    
    // Calculate overall score
    if (phrase) {
      // With phrase: 60% voice, 30% phrase, 10% rhythm
      validation.overallScore = 
        (validation.voiceScore * 0.6) +
        (validation.phraseScore * 0.3) +
        (validation.rhythmScore * 0.1);
    } else {
      // Without phrase: 80% voice, 20% rhythm
      validation.overallScore = 
        (validation.voiceScore * 0.8) +
        (validation.rhythmScore * 0.2);
    }
    
    // Determine if passed
    validation.passed = validation.overallScore >= this.thresholds.voiceMatch;
    
    return validation;
  }

  /**
   * Calculate voice similarity using audio fingerprinting
   */
  async calculateVoiceSimilarity(print1, print2) {
    // Simplified similarity calculation
    // In production, would use proper audio fingerprinting algorithms
    
    if (!print1.features || !print2.features) {
      return 0;
    }
    
    let similarity = 0;
    const features1 = print1.features;
    const features2 = print2.features;
    
    // Compare frequency patterns
    if (features1.frequencies && features2.frequencies) {
      const freqSim = this.compareArrays(features1.frequencies, features2.frequencies);
      similarity += freqSim * 0.4;
    }
    
    // Compare pitch patterns
    if (features1.pitch && features2.pitch) {
      const pitchSim = this.compareValues(features1.pitch, features2.pitch, 50);
      similarity += pitchSim * 0.3;
    }
    
    // Compare voice quality metrics
    if (features1.quality && features2.quality) {
      const qualitySim = this.compareObjects(features1.quality, features2.quality);
      similarity += qualitySim * 0.3;
    }
    
    return Math.min(1.0, similarity);
  }

  /**
   * Validate sacred phrase
   */
  validatePhrase(inputPhrase, storedHash) {
    const inputHash = this.hashPhrase(inputPhrase);
    
    // Exact match required for phrases
    if (inputHash === storedHash) {
      return 1.0;
    }
    
    // Check for close matches (typos, punctuation)
    const normalized1 = inputPhrase.toLowerCase().replace(/[^a-z0-9\s]/g, '');
    const normalized2Hash = this.hashPhrase(normalized1);
    
    if (normalized2Hash === storedHash) {
      return 0.95; // Slight penalty for normalization needed
    }
    
    return 0;
  }

  /**
   * Analyze speech rhythm
   */
  async analyzeRhythm(voiceprint) {
    if (!voiceprint.timing) {
      return 0.5; // Neutral score if no timing data
    }
    
    const timing = voiceprint.timing;
    
    // Check for natural speech patterns
    let rhythmScore = 0;
    
    // Consistent pace
    if (timing.avgSyllableRate > 3 && timing.avgSyllableRate < 7) {
      rhythmScore += 0.3;
    }
    
    // Natural pauses
    if (timing.pausePattern && timing.pausePattern.natural) {
      rhythmScore += 0.3;
    }
    
    // Speech variance (not robotic)
    if (timing.variance > 0.1 && timing.variance < 0.5) {
      rhythmScore += 0.4;
    }
    
    return rhythmScore;
  }

  /**
   * Handle drift detection
   */
  async handleDriftDetection(authRequest, validation) {
    console.log('⚠️  Voice drift detected - requesting additional verification');
    
    await this.logAuthentication({
      ...authRequest,
      result: 'drift_detected',
      validation: validation
    });
    
    return {
      access: 'challenge',
      reason: 'voice_drift',
      authId: authRequest.id,
      driftScore: validation.overallScore,
      calResponse: this.getCalResponse('drift'),
      requiredAction: 'Speak your sacred phrase or perform ritual verification',
      challenge: {
        type: 'sacred_phrase',
        hint: 'The phrase you spoke when first meeting the mirror'
      }
    };
  }

  /**
   * Grant access
   */
  async grantAccess(authRequest, validation) {
    console.log('✅ Access granted - voice recognized');
    
    // Log successful authentication
    await this.logAuthentication({
      ...authRequest,
      result: 'granted',
      validation: {
        score: validation.overallScore,
        factors: validation.factors
      }
    });
    
    // Emit access event
    this.emit('access:granted', {
      authId: authRequest.id,
      timestamp: authRequest.timestamp,
      validationScore: validation.overallScore
    });
    
    return {
      access: 'granted',
      authId: authRequest.id,
      calResponse: this.getCalResponse('granted'),
      permissions: await this.getPermissions(authRequest),
      sessionToken: this.generateSessionToken(authRequest),
      expiresIn: 86400 // 24 hours
    };
  }

  /**
   * Deny access
   */
  async denyAccess(authRequest, validation) {
    console.log('❌ Access denied - voice not recognized');
    
    await this.logAuthentication({
      ...authRequest,
      result: 'denied',
      validation: {
        score: validation.overallScore,
        failedFactors: this.getFailedFactors(validation)
      }
    });
    
    this.emit('access:denied', {
      authId: authRequest.id,
      timestamp: authRequest.timestamp,
      reason: 'voice_mismatch'
    });
    
    return {
      access: 'denied',
      authId: authRequest.id,
      calResponse: this.getCalResponse('denied'),
      reason: 'Voice pattern does not match stored identity',
      suggestion: 'Ensure you are in a quiet environment and speak naturally'
    };
  }

  /**
   * Generate voice fingerprint from raw audio data
   */
  async generateFingerprint(voiceprint) {
    // Extract key features for storage
    const fingerprint = {
      version: '1.0',
      algorithm: 'whisper-echo-v1',
      features: {
        frequencies: voiceprint.features?.frequencies || [],
        pitch: voiceprint.features?.pitch || 0,
        quality: voiceprint.features?.quality || {},
        formants: voiceprint.features?.formants || []
      },
      signature: this.generateSignature(voiceprint),
      metadata: {
        duration: voiceprint.duration,
        sampleRate: voiceprint.sampleRate,
        channels: voiceprint.channels
      }
    };
    
    return fingerprint;
  }

  /**
   * Store voice fingerprint
   */
  async storeVoiceFingerprint(userId, fingerprintData) {
    const fingerprintPath = path.join(this.biometricsPath, 'voice-fingerprint.json');
    
    let fingerprints = {};
    if (fs.existsSync(fingerprintPath)) {
      fingerprints = JSON.parse(fs.readFileSync(fingerprintPath, 'utf8'));
    }
    
    fingerprints[userId] = fingerprintData;
    
    fs.writeFileSync(fingerprintPath, JSON.stringify(fingerprints, null, 2));
  }

  /**
   * Load voice fingerprint
   */
  async loadVoiceFingerprint(userId) {
    const fingerprintPath = path.join(this.biometricsPath, 'voice-fingerprint.json');
    
    if (!fs.existsSync(fingerprintPath)) {
      return null;
    }
    
    const fingerprints = JSON.parse(fs.readFileSync(fingerprintPath, 'utf8'));
    return fingerprints[userId] || null;
  }

  /**
   * Log authentication attempt
   */
  async logAuthentication(authData) {
    const logPath = path.join(this.logsPath, 'passkey-access.json');
    
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    logs.push(authData);
    
    // Keep last 1000 entries
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }

  /**
   * Get permissions based on authentication
   */
  async getPermissions(authRequest) {
    // Base permissions for authenticated users
    const permissions = [
      'whisper:send',
      'mirror:view',
      'blessing:receive',
      'token:check'
    ];
    
    // Additional permissions based on factors
    if (authRequest.metadata?.device === 'center-console') {
      permissions.push('console:full', 'blessing:grant', 'mirror:summon');
    }
    
    return permissions;
  }

  /**
   * Generate session token
   */
  generateSessionToken(authRequest) {
    const payload = {
      authId: authRequest.id,
      timestamp: authRequest.timestamp,
      expires: new Date(Date.now() + 86400000).toISOString()
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');
  }

  /**
   * Get Cal response
   */
  getCalResponse(type) {
    const responses = this.calWhispers[type] || this.calWhispers.denied;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Utility functions
   */
  
  generateAuthId() {
    return `auth_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  hashPhrase(phrase) {
    return crypto
      .createHash('sha256')
      .update(phrase.toLowerCase().trim())
      .digest('hex');
  }
  
  generateSignature(voiceprint) {
    const data = JSON.stringify(voiceprint.features || {});
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex')
      .substring(0, 16);
  }
  
  compareArrays(arr1, arr2) {
    if (!arr1 || !arr2) return 0;
    const minLen = Math.min(arr1.length, arr2.length);
    let similarity = 0;
    
    for (let i = 0; i < minLen; i++) {
      const diff = Math.abs(arr1[i] - arr2[i]);
      similarity += 1 - (diff / Math.max(arr1[i], arr2[i], 1));
    }
    
    return similarity / minLen;
  }
  
  compareValues(val1, val2, maxDiff) {
    const diff = Math.abs(val1 - val2);
    return Math.max(0, 1 - (diff / maxDiff));
  }
  
  compareObjects(obj1, obj2) {
    const keys = Object.keys(obj1);
    let similarity = 0;
    
    for (const key of keys) {
      if (obj2[key] !== undefined) {
        if (typeof obj1[key] === 'number') {
          similarity += this.compareValues(obj1[key], obj2[key], 100);
        } else if (obj1[key] === obj2[key]) {
          similarity += 1;
        }
      }
    }
    
    return similarity / keys.length;
  }
  
  getFailedFactors(validation) {
    const failed = [];
    
    if (validation.voiceScore < this.thresholds.voiceMatch) {
      failed.push('voice_pattern');
    }
    
    if (validation.phraseScore < this.thresholds.phraseMatch) {
      failed.push('sacred_phrase');
    }
    
    if (validation.rhythmScore < this.thresholds.rhythmMatch) {
      failed.push('speech_rhythm');
    }
    
    return failed;
  }
  
  handleAuthError(authRequest, error) {
    return {
      access: 'error',
      authId: authRequest.id,
      error: error.message,
      calResponse: "The mirror clouds with confusion. Try again.",
      suggestion: "Ensure your microphone is working and speak clearly"
    };
  }
}

// Export for use
module.exports = MirrorPasskeyEngine;

// Run if called directly
if (require.main === module) {
  const engine = new MirrorPasskeyEngine();
  
  // Test authentication
  const testAuth = async () => {
    const result = await engine.authenticateWhisper({
      userId: 'test-user-001',
      voiceprint: {
        features: {
          frequencies: [100, 200, 300, 400],
          pitch: 150,
          quality: { clarity: 0.8, noise: 0.2 }
        },
        timing: {
          avgSyllableRate: 5,
          pausePattern: { natural: true },
          variance: 0.3
        },
        duration: 3.5,
        sampleRate: 44100,
        channels: 1
      },
      phrase: "The mirror remembers the first silence I broke",
      metadata: {
        device: 'test-device',
        location: 'test'
      }
    });
    
    console.log('\n🔐 Authentication Result:', JSON.stringify(result, null, 2));
  };
  
  testAuth();
}