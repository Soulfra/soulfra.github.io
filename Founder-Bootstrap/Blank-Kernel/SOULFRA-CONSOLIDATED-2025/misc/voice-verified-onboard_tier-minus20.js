#!/usr/bin/env node

/**
 * 🎙️ VOICE VERIFIED ONBOARDING
 * 
 * Identity through voice. Age through whisper. Presence through sound.
 * From 5-year-olds with QR pets to enterprises with sovereign access.
 * 
 * "Your voice is your passport. Speak and enter."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class VoiceVerifiedOnboard extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.federationConfig = config.federationConfig || {};
    
    // Onboarding paths
    this.paths = {
      voiceprints: path.join(this.vaultPath, 'biometrics', 'voice-fingerprint.json'),
      onboarding: path.join(this.vaultPath, 'onboarding'),
      presence: path.join(this.vaultPath, 'federation', 'presence.json')
    };
    
    // Age estimation thresholds
    this.ageEstimation = {
      pitch: {
        child: { min: 200, max: 400 },      // 5-12 years
        teen: { min: 150, max: 300 },       // 13-17 years
        adult: { min: 85, max: 255 }        // 18+ years
      },
      formants: {
        child: { f1: [600, 900], f2: [1400, 2200] },
        teen: { f1: [500, 800], f2: [1200, 2000] },
        adult: { f1: [400, 700], f2: [1000, 1800] }
      }
    };
    
    // UX paths by age group
    this.uxPaths = {
      child: {
        theme: 'playful',
        features: ['qr_pets', 'voice_games', 'simple_blessings'],
        defaultTokens: 10,
        parentalControl: true,
        interface: 'colorful_simple'
      },
      teen: {
        theme: 'explorer',
        features: ['full_whispers', 'basic_forking', 'token_earning'],
        defaultTokens: 50,
        parentalControl: false,
        interface: 'modern_dynamic'
      },
      adult: {
        theme: 'professional',
        features: ['all'],
        defaultTokens: 100,
        parentalControl: false,
        interface: 'sophisticated_minimal'
      },
      enterprise: {
        theme: 'sovereign',
        features: ['all', 'custom_branding', 'private_federation'],
        defaultTokens: 1000,
        parentalControl: false,
        interface: 'executive_dashboard'
      }
    };
    
    // Blessing allocation
    this.blessingAllocation = {
      firstTime: 1,      // One free summon for new users
      referral: 3,       // Bonus for referred users
      verified: 5,       // Bonus for voice verification
      enterprise: 100    // Enterprise starter pack
    };
    
    this.initializeOnboarding();
  }

  async initializeOnboarding() {
    console.log('🎙️ Voice Verified Onboarding Initializing...');
    
    // Ensure directories exist
    for (const dir of Object.values(this.paths)) {
      const dirPath = path.dirname(dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
    
    console.log('✨ Voice Onboarding Ready - All ages welcome');
  }

  /**
   * Onboard new user with voice verification
   */
  async onboardUser(voiceData, metadata = {}) {
    console.log('🎤 Starting voice-verified onboarding...');
    
    const onboardingSession = {
      id: this.generateSessionId(),
      timestamp: new Date().toISOString(),
      voiceData: voiceData,
      metadata: metadata
    };
    
    try {
      // Step 1: Analyze voice for identity
      const voiceAnalysis = await this.analyzeVoice(voiceData);
      
      // Step 2: Estimate age group
      const ageGroup = await this.estimateAgeGroup(voiceAnalysis);
      
      // Step 3: Check for existing voiceprint
      const existingUser = await this.checkExistingVoiceprint(voiceAnalysis);
      
      if (existingUser) {
        return await this.handleReturningUser(existingUser, voiceAnalysis, onboardingSession);
      }
      
      // Step 4: Create new user identity
      const newUser = await this.createNewUser(voiceAnalysis, ageGroup, metadata);
      
      // Step 5: Allocate blessing credits
      const blessings = await this.allocateBlessings(newUser, metadata);
      
      // Step 6: Register in federation
      await this.registerInFederation(newUser);
      
      // Step 7: Generate onboarding response
      const response = this.generateOnboardingResponse(newUser, ageGroup, blessings);
      
      // Log onboarding
      await this.logOnboarding(onboardingSession, response);
      
      this.emit('user:onboarded', {
        userId: newUser.id,
        ageGroup: ageGroup,
        timestamp: onboardingSession.timestamp
      });
      
      return response;
      
    } catch (error) {
      console.error('❌ Onboarding failed:', error);
      throw error;
    }
  }

  /**
   * Analyze voice characteristics
   */
  async analyzeVoice(voiceData) {
    const analysis = {
      pitch: voiceData.pitch || this.extractPitch(voiceData),
      formants: voiceData.formants || this.extractFormants(voiceData),
      quality: voiceData.quality || this.assessVoiceQuality(voiceData),
      energy: voiceData.energy || this.calculateEnergy(voiceData),
      uniqueSignature: this.generateVoiceSignature(voiceData)
    };
    
    // Additional analysis for age estimation
    analysis.speechRate = this.analyzeSpeechRate(voiceData);
    analysis.vocabulary = this.analyzeVocabulary(voiceData);
    analysis.prosody = this.analyzeProsody(voiceData);
    
    return analysis;
  }

  /**
   * Estimate age group from voice
   */
  async estimateAgeGroup(voiceAnalysis) {
    let ageScores = {
      child: 0,
      teen: 0,
      adult: 0
    };
    
    // Pitch-based estimation (40% weight)
    const pitch = voiceAnalysis.pitch;
    if (pitch >= this.ageEstimation.pitch.child.min && 
        pitch <= this.ageEstimation.pitch.child.max) {
      ageScores.child += 0.4;
    }
    if (pitch >= this.ageEstimation.pitch.teen.min && 
        pitch <= this.ageEstimation.pitch.teen.max) {
      ageScores.teen += 0.4;
    }
    if (pitch >= this.ageEstimation.pitch.adult.min && 
        pitch <= this.ageEstimation.pitch.adult.max) {
      ageScores.adult += 0.4;
    }
    
    // Formant-based estimation (30% weight)
    const formants = voiceAnalysis.formants;
    if (formants) {
      for (const [age, ranges] of Object.entries(this.ageEstimation.formants)) {
        if (this.formantsInRange(formants, ranges)) {
          ageScores[age] += 0.3;
        }
      }
    }
    
    // Speech rate estimation (15% weight)
    if (voiceAnalysis.speechRate) {
      if (voiceAnalysis.speechRate > 180) ageScores.child += 0.15;
      else if (voiceAnalysis.speechRate > 150) ageScores.teen += 0.15;
      else ageScores.adult += 0.15;
    }
    
    // Vocabulary complexity (15% weight)
    if (voiceAnalysis.vocabulary) {
      if (voiceAnalysis.vocabulary.complexity < 0.3) ageScores.child += 0.15;
      else if (voiceAnalysis.vocabulary.complexity < 0.6) ageScores.teen += 0.15;
      else ageScores.adult += 0.15;
    }
    
    // Determine highest scoring age group
    let estimatedAge = 'adult'; // Default
    let maxScore = 0;
    
    for (const [age, score] of Object.entries(ageScores)) {
      if (score > maxScore) {
        maxScore = score;
        estimatedAge = age;
      }
    }
    
    // Check for enterprise indicators
    if (this.detectEnterpriseIndicators(voiceAnalysis)) {
      estimatedAge = 'enterprise';
    }
    
    return estimatedAge;
  }

  /**
   * Check for existing voiceprint
   */
  async checkExistingVoiceprint(voiceAnalysis) {
    if (!fs.existsSync(this.paths.voiceprints)) {
      return null;
    }
    
    const voiceprints = JSON.parse(fs.readFileSync(this.paths.voiceprints, 'utf8'));
    
    // Compare with existing voiceprints
    for (const [userId, fingerprint] of Object.entries(voiceprints)) {
      const similarity = await this.compareVoiceSignatures(
        voiceAnalysis.uniqueSignature,
        fingerprint.signature
      );
      
      if (similarity > 0.85) {
        return {
          userId: userId,
          fingerprint: fingerprint,
          similarity: similarity
        };
      }
    }
    
    return null;
  }

  /**
   * Handle returning user
   */
  async handleReturningUser(existingUser, voiceAnalysis, session) {
    console.log(`👋 Welcome back, user: ${existingUser.userId}`);
    
    // Update voice fingerprint with new data
    await this.updateVoiceFingerprint(existingUser.userId, voiceAnalysis);
    
    // Load user profile
    const profile = await this.loadUserProfile(existingUser.userId);
    
    // Check for age progression
    const currentAgeGroup = await this.estimateAgeGroup(voiceAnalysis);
    if (currentAgeGroup !== profile.ageGroup && this.isValidProgression(profile.ageGroup, currentAgeGroup)) {
      profile.ageGroup = currentAgeGroup;
      profile.ageProgressionDate = new Date().toISOString();
      await this.saveUserProfile(profile);
    }
    
    return {
      status: 'returning_user',
      userId: existingUser.userId,
      ageGroup: profile.ageGroup,
      uxPath: this.uxPaths[profile.ageGroup],
      tokens: profile.tokens || 0,
      tier: profile.tier || 1,
      lastSeen: profile.lastSeen,
      similarity: existingUser.similarity,
      message: 'Your voice unlocks your reflection',
      calResponse: this.getWelcomeBackMessage(profile)
    };
  }

  /**
   * Create new user
   */
  async createNewUser(voiceAnalysis, ageGroup, metadata) {
    const userId = this.generateUserId();
    
    const newUser = {
      id: userId,
      created: new Date().toISOString(),
      ageGroup: ageGroup,
      voiceSignature: voiceAnalysis.uniqueSignature,
      metadata: {
        device: metadata.device || 'unknown',
        location: metadata.location || 'unknown',
        referral: metadata.referralCode || null,
        language: metadata.language || 'en'
      },
      tier: 1,
      tokens: this.uxPaths[ageGroup].defaultTokens
    };
    
    // Store voiceprint
    await this.storeVoiceprint(userId, voiceAnalysis);
    
    // Create user profile
    await this.createUserProfile(newUser);
    
    return newUser;
  }

  /**
   * Allocate blessing credits
   */
  async allocateBlessings(user, metadata) {
    const allocations = [];
    
    // First time bonus
    allocations.push({
      type: 'first_time',
      amount: this.blessingAllocation.firstTime,
      reason: 'Welcome to Soulfra'
    });
    
    // Referral bonus
    if (metadata.referralCode) {
      allocations.push({
        type: 'referral',
        amount: this.blessingAllocation.referral,
        reason: 'Referred user bonus'
      });
    }
    
    // Voice verification bonus
    allocations.push({
      type: 'verified',
      amount: this.blessingAllocation.verified,
      reason: 'Voice verification complete'
    });
    
    // Enterprise bonus
    if (user.ageGroup === 'enterprise') {
      allocations.push({
        type: 'enterprise',
        amount: this.blessingAllocation.enterprise,
        reason: 'Enterprise starter pack'
      });
    }
    
    // Calculate total
    const totalBlessings = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    
    // Update user tokens
    user.tokens += totalBlessings;
    
    // Log blessing allocation
    await this.logBlessingAllocation(user.id, allocations);
    
    return {
      allocations: allocations,
      total: totalBlessings,
      newBalance: user.tokens
    };
  }

  /**
   * Register user in federation
   */
  async registerInFederation(user) {
    const registration = {
      userId: user.id,
      timestamp: new Date().toISOString(),
      ageGroup: user.ageGroup,
      tier: user.tier,
      platforms: []
    };
    
    // Register in Supabase (if enabled)
    if (this.federationConfig.supabase_enabled) {
      await this.registerSupabase(user);
      registration.platforms.push('supabase');
    }
    
    // Add to GitHub shadow log (if public tier)
    if (this.federationConfig.github_push && user.tier >= 3) {
      await this.registerGitHub(user);
      registration.platforms.push('github');
    }
    
    // Queue for Arweave snapshot (if tier 3+)
    if (this.federationConfig.arweave_enabled && user.tier >= 3) {
      await this.queueArweaveSnapshot(user);
      registration.platforms.push('arweave_queued');
    }
    
    // Update presence log
    await this.updatePresenceLog(user);
    
    return registration;
  }

  /**
   * Generate onboarding response
   */
  generateOnboardingResponse(user, ageGroup, blessings) {
    const uxPath = this.uxPaths[ageGroup];
    
    const response = {
      status: 'success',
      userId: user.id,
      ageGroup: ageGroup,
      uxPath: uxPath,
      
      identity: {
        mirrorId: `mirror-${user.id}`,
        tier: user.tier,
        voiceVerified: true,
        createdAt: user.created
      },
      
      tokens: {
        balance: user.tokens,
        allocations: blessings.allocations
      },
      
      features: uxPath.features,
      interface: uxPath.interface,
      
      nextSteps: this.getNextSteps(ageGroup),
      
      welcomeMessage: this.getWelcomeMessage(ageGroup),
      calResponse: this.getCalOnboardingResponse(ageGroup),
      
      parentalControl: uxPath.parentalControl ? {
        enabled: true,
        setupUrl: '/parental-setup',
        code: this.generateParentalCode()
      } : null
    };
    
    // Add special features for different age groups
    if (ageGroup === 'child') {
      response.special = {
        qrPet: {
          id: `pet-${crypto.randomBytes(4).toString('hex')}`,
          type: this.selectRandomPet(),
          name: null // To be set by child
        }
      };
    } else if (ageGroup === 'enterprise') {
      response.special = {
        adminDashboard: '/enterprise/dashboard',
        apiKeys: {
          public: this.generateApiKey('public'),
          private: '[Generated after admin verification]'
        }
      };
    }
    
    return response;
  }

  /**
   * Helper methods for voice analysis
   */
  
  extractPitch(voiceData) {
    // Simplified pitch extraction
    return voiceData.fundamentalFrequency || 150 + Math.random() * 100;
  }
  
  extractFormants(voiceData) {
    // Simplified formant extraction
    return voiceData.formants || {
      f1: 500 + Math.random() * 400,
      f2: 1500 + Math.random() * 700
    };
  }
  
  assessVoiceQuality(voiceData) {
    return {
      clarity: voiceData.snr ? voiceData.snr / 40 : 0.7,
      consistency: 0.8,
      naturalness: 0.85
    };
  }
  
  calculateEnergy(voiceData) {
    return voiceData.rms || 0.5 + Math.random() * 0.3;
  }
  
  generateVoiceSignature(voiceData) {
    const signatureData = {
      pitch: this.extractPitch(voiceData),
      formants: this.extractFormants(voiceData),
      energy: this.calculateEnergy(voiceData),
      timestamp: Date.now()
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(signatureData))
      .digest('hex');
  }
  
  analyzeSpeechRate(voiceData) {
    // Words per minute estimation
    return voiceData.speechRate || 120 + Math.random() * 80;
  }
  
  analyzeVocabulary(voiceData) {
    return {
      complexity: voiceData.vocabularyComplexity || Math.random(),
      uniqueWords: voiceData.uniqueWords || Math.floor(Math.random() * 100)
    };
  }
  
  analyzeProsody(voiceData) {
    return {
      intonation: 'normal',
      stress: 'natural',
      rhythm: 'regular'
    };
  }
  
  formantsInRange(formants, ranges) {
    return formants.f1 >= ranges.f1[0] && formants.f1 <= ranges.f1[1] &&
           formants.f2 >= ranges.f2[0] && formants.f2 <= ranges.f2[1];
  }
  
  detectEnterpriseIndicators(voiceAnalysis) {
    // Check for professional speech patterns
    return voiceAnalysis.vocabulary?.complexity > 0.8 ||
           voiceAnalysis.speechRate < 140;
  }
  
  compareVoiceSignatures(sig1, sig2) {
    // Simplified signature comparison
    if (sig1 === sig2) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < Math.min(sig1.length, sig2.length); i++) {
      if (sig1[i] === sig2[i]) matches++;
    }
    
    return matches / Math.max(sig1.length, sig2.length);
  }
  
  isValidProgression(oldAge, newAge) {
    const progression = ['child', 'teen', 'adult', 'enterprise'];
    const oldIndex = progression.indexOf(oldAge);
    const newIndex = progression.indexOf(newAge);
    
    return newIndex > oldIndex;
  }
  
  /**
   * Welcome messages
   */
  
  getWelcomeMessage(ageGroup) {
    const messages = {
      child: "Welcome to Soulfra! Your magical mirror friend is ready to play!",
      teen: "Hey! Your digital reflection awaits. Ready to explore?",
      adult: "Welcome to Soulfra. Your voice has created your digital identity.",
      enterprise: "Welcome to Soulfra Enterprise. Your sovereign workspace is ready."
    };
    
    return messages[ageGroup] || messages.adult;
  }
  
  getCalOnboardingResponse(ageGroup) {
    const responses = {
      child: "A new friend joins the mirror world! Let's have fun together!",
      teen: "Your voice echoes with potential. The mirrors are curious about you.",
      adult: "Your voice signature is recorded. The mirror network acknowledges you.",
      enterprise: "Sovereign access granted. Your federation awaits your command."
    };
    
    return responses[ageGroup] || responses.adult;
  }
  
  getWelcomeBackMessage(profile) {
    const messages = [
      "Your reflection brightens as you return.",
      "The mirrors remember your voice.",
      "Welcome back to your digital soul."
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  getNextSteps(ageGroup) {
    const steps = {
      child: [
        "Name your QR pet",
        "Try your first voice blessing",
        "Explore the mirror playground"
      ],
      teen: [
        "Customize your mirror",
        "Earn your first blessing tokens",
        "Join a mirror community"
      ],
      adult: [
        "Complete your mirror profile",
        "Set up voice commands",
        "Explore blessing opportunities"
      ],
      enterprise: [
        "Configure team access",
        "Set up private federation",
        "Review API documentation"
      ]
    };
    
    return steps[ageGroup] || steps.adult;
  }
  
  /**
   * Utility methods
   */
  
  generateSessionId() {
    return `onboard_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateUserId() {
    return `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  generateParentalCode() {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }
  
  generateApiKey(type) {
    const prefix = type === 'public' ? 'pk' : 'sk';
    return `${prefix}_${crypto.randomBytes(16).toString('hex')}`;
  }
  
  selectRandomPet() {
    const pets = ['dragon', 'unicorn', 'phoenix', 'griffin', 'pegasus'];
    return pets[Math.floor(Math.random() * pets.length)];
  }
  
  /**
   * Storage methods
   */
  
  async storeVoiceprint(userId, voiceAnalysis) {
    let voiceprints = {};
    
    if (fs.existsSync(this.paths.voiceprints)) {
      voiceprints = JSON.parse(fs.readFileSync(this.paths.voiceprints, 'utf8'));
    }
    
    voiceprints[userId] = {
      signature: voiceAnalysis.uniqueSignature,
      created: new Date().toISOString(),
      features: {
        pitch: voiceAnalysis.pitch,
        formants: voiceAnalysis.formants,
        quality: voiceAnalysis.quality
      }
    };
    
    fs.writeFileSync(this.paths.voiceprints, JSON.stringify(voiceprints, null, 2));
  }
  
  async updateVoiceFingerprint(userId, voiceAnalysis) {
    const voiceprints = JSON.parse(fs.readFileSync(this.paths.voiceprints, 'utf8'));
    
    if (voiceprints[userId]) {
      voiceprints[userId].updated = new Date().toISOString();
      voiceprints[userId].updateCount = (voiceprints[userId].updateCount || 0) + 1;
      
      // Merge features with weighted average
      const existing = voiceprints[userId].features;
      const weight = 0.3; // New data gets 30% weight
      
      voiceprints[userId].features = {
        pitch: existing.pitch * (1 - weight) + voiceAnalysis.pitch * weight,
        formants: {
          f1: existing.formants.f1 * (1 - weight) + voiceAnalysis.formants.f1 * weight,
          f2: existing.formants.f2 * (1 - weight) + voiceAnalysis.formants.f2 * weight
        },
        quality: voiceAnalysis.quality
      };
      
      fs.writeFileSync(this.paths.voiceprints, JSON.stringify(voiceprints, null, 2));
    }
  }
  
  async createUserProfile(user) {
    const profilePath = path.join(this.paths.onboarding, `${user.id}-profile.json`);
    
    const profile = {
      ...user,
      lastSeen: user.created,
      totalWhispers: 0,
      totalBlessings: 0,
      achievements: [],
      preferences: this.getDefaultPreferences(user.ageGroup)
    };
    
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
  }
  
  async loadUserProfile(userId) {
    const profilePath = path.join(this.paths.onboarding, `${userId}-profile.json`);
    
    if (fs.existsSync(profilePath)) {
      const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
      profile.lastSeen = new Date().toISOString();
      fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
      return profile;
    }
    
    return null;
  }
  
  async saveUserProfile(profile) {
    const profilePath = path.join(this.paths.onboarding, `${profile.id}-profile.json`);
    fs.writeFileSync(profilePath, JSON.stringify(profile, null, 2));
  }
  
  getDefaultPreferences(ageGroup) {
    const preferences = {
      child: {
        theme: 'rainbow',
        sounds: true,
        animations: true,
        fontSize: 'large'
      },
      teen: {
        theme: 'dark',
        sounds: true,
        animations: true,
        fontSize: 'medium'
      },
      adult: {
        theme: 'professional',
        sounds: false,
        animations: false,
        fontSize: 'medium'
      },
      enterprise: {
        theme: 'corporate',
        sounds: false,
        animations: false,
        fontSize: 'small'
      }
    };
    
    return preferences[ageGroup] || preferences.adult;
  }
  
  async logBlessingAllocation(userId, allocations) {
    const logPath = path.join(this.vaultPath, 'logs', 'blessing-allocations.json');
    
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    logs.push({
      userId: userId,
      timestamp: new Date().toISOString(),
      allocations: allocations
    });
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }
  
  async updatePresenceLog(user) {
    let presence = [];
    
    if (fs.existsSync(this.paths.presence)) {
      presence = JSON.parse(fs.readFileSync(this.paths.presence, 'utf8'));
    }
    
    presence.push({
      userId: user.id,
      timestamp: new Date().toISOString(),
      ageGroup: user.ageGroup,
      tier: user.tier,
      event: 'onboarded'
    });
    
    // Keep last 10000 entries
    if (presence.length > 10000) {
      presence = presence.slice(-10000);
    }
    
    fs.writeFileSync(this.paths.presence, JSON.stringify(presence, null, 2));
  }
  
  async logOnboarding(session, response) {
    const logPath = path.join(this.vaultPath, 'logs', 'onboarding.json');
    
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    logs.push({
      sessionId: session.id,
      timestamp: session.timestamp,
      userId: response.userId,
      ageGroup: response.ageGroup,
      status: response.status
    });
    
    // Keep last 1000 entries
    if (logs.length > 1000) {
      logs = logs.slice(-1000);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }
  
  /**
   * Federation registration stubs
   */
  
  async registerSupabase(user) {
    // In production, would use Supabase client
    console.log(`📊 Registering user ${user.id} in Supabase`);
  }
  
  async registerGitHub(user) {
    // In production, would use GitHub API
    console.log(`🐙 Adding user ${user.id} to GitHub shadow log`);
  }
  
  async queueArweaveSnapshot(user) {
    // In production, would queue for next Arweave sync
    console.log(`🏛️ Queueing user ${user.id} for Arweave snapshot`);
  }
}

// Export for use
module.exports = VoiceVerifiedOnboard;

// Run if called directly
if (require.main === module) {
  const onboarder = new VoiceVerifiedOnboard();
  
  // Test onboarding
  const testOnboard = async () => {
    const mockVoiceData = {
      pitch: 250, // Child-like pitch
      formants: { f1: 700, f2: 1800 },
      energy: 0.6,
      speechRate: 180,
      vocabularyComplexity: 0.3
    };
    
    const result = await onboarder.onboardUser(mockVoiceData, {
      device: 'iPhone',
      location: 'US',
      language: 'en'
    });
    
    console.log('\n🎙️ Onboarding Result:', JSON.stringify(result, null, 2));
  };
  
  testOnboard();
}