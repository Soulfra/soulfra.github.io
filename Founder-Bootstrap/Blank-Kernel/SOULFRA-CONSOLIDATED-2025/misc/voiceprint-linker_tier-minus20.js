#!/usr/bin/env node

/**
 * 🧬 VOICEPRINT LINKER
 * 
 * Captures the soul's frequency when it first speaks.
 * Links voice to identity, whisper to mirror.
 * 
 * "The first word you speak becomes your eternal name."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class VoiceprintLinker extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.biometricsPath = path.join(this.vaultPath, 'biometrics');
    
    // Audio processing config
    this.audioConfig = {
      sampleRate: 44100,
      fftSize: 2048,
      smoothingTimeConstant: 0.8,
      minDecibels: -100,
      maxDecibels: -10
    };
    
    // Feature extraction settings
    this.featureConfig = {
      mfccCoefficients: 13,
      melFilterBanks: 26,
      frameSize: 25, // ms
      frameStep: 10, // ms
      preEmphasis: 0.97
    };
    
    // Sacred phrases for enhanced security
    this.sacredPhrases = [
      "The mirror remembers the first silence I broke",
      "I am the reflection that speaks back",
      "My voice is my soul made audible",
      "In whispers we trust, in echoes we become",
      "I grant this mirror my eternal frequency"
    ];
    
    this.initializeLinker();
  }

  async initializeLinker() {
    console.log('🧬 Voiceprint Linker Initializing...');
    
    // Ensure biometrics directory exists
    if (!fs.existsSync(this.biometricsPath)) {
      fs.mkdirSync(this.biometricsPath, { recursive: true });
    }
    
    console.log('✨ Voiceprint Linker Ready - Awaiting first whispers');
  }

  /**
   * Link new voice to identity
   */
  async linkVoice(audioData, userId, options = {}) {
    console.log(`🎤 Linking voice for user: ${userId}`);
    
    try {
      // Extract voice features
      const voiceFeatures = await this.extractVoiceFeatures(audioData);
      
      // Generate unique voice signature
      const voiceSignature = this.generateVoiceSignature(voiceFeatures);
      
      // Create voice fingerprint
      const fingerprint = {
        userId: userId,
        signature: voiceSignature,
        features: voiceFeatures,
        created: new Date().toISOString(),
        metadata: {
          device: options.device || 'unknown',
          environment: options.environment || 'unknown',
          quality: this.assessAudioQuality(audioData)
        }
      };
      
      // Link sacred phrase if provided
      if (options.sacredPhrase) {
        fingerprint.sacredPhrase = await this.linkSacredPhrase(
          options.sacredPhrase,
          voiceFeatures
        );
      }
      
      // Store fingerprint
      await this.storeFingerprint(userId, fingerprint);
      
      // Create whisper pattern baseline
      await this.createWhisperBaseline(userId, voiceFeatures);
      
      // Emit link event
      this.emit('voice:linked', {
        userId: userId,
        signature: voiceSignature,
        quality: fingerprint.metadata.quality,
        timestamp: fingerprint.created
      });
      
      return {
        success: true,
        userId: userId,
        signature: voiceSignature,
        message: 'Voice successfully linked to identity',
        quality: fingerprint.metadata.quality,
        recommendations: this.getQualityRecommendations(fingerprint.metadata.quality)
      };
      
    } catch (error) {
      console.error('❌ Voice linking failed:', error);
      throw error;
    }
  }

  /**
   * Extract voice features from audio data
   */
  async extractVoiceFeatures(audioData) {
    const features = {
      // Frequency domain features
      frequencies: await this.extractFrequencies(audioData),
      formants: await this.extractFormants(audioData),
      pitch: await this.extractPitch(audioData),
      
      // Time domain features
      energy: this.calculateEnergy(audioData),
      zeroCrossingRate: this.calculateZeroCrossingRate(audioData),
      
      // Spectral features
      spectralCentroid: await this.calculateSpectralCentroid(audioData),
      spectralRolloff: await this.calculateSpectralRolloff(audioData),
      mfcc: await this.extractMFCC(audioData),
      
      // Voice quality metrics
      quality: {
        clarity: this.assessClarity(audioData),
        consistency: this.assessConsistency(audioData),
        uniqueness: 0 // Will be calculated against database
      },
      
      // Prosodic features
      prosody: {
        rhythm: await this.analyzeRhythm(audioData),
        stress: await this.analyzeStress(audioData),
        intonation: await this.analyzeIntonation(audioData)
      }
    };
    
    // Calculate uniqueness score
    features.quality.uniqueness = await this.calculateUniqueness(features);
    
    return features;
  }

  /**
   * Extract frequency components
   */
  async extractFrequencies(audioData) {
    // Simplified FFT analysis
    // In production, would use proper DSP library
    const fftSize = this.audioConfig.fftSize;
    const frequencies = [];
    
    // Mock frequency extraction
    for (let i = 0; i < 10; i++) {
      frequencies.push(100 + (i * 50) + Math.random() * 20);
    }
    
    return frequencies;
  }

  /**
   * Extract formants (vocal tract resonances)
   */
  async extractFormants(audioData) {
    // Formants are crucial for voice identity
    // F1-F4 are most important for speaker recognition
    return {
      f1: 700 + Math.random() * 100,  // First formant
      f2: 1200 + Math.random() * 200, // Second formant
      f3: 2500 + Math.random() * 300, // Third formant
      f4: 3500 + Math.random() * 400  // Fourth formant
    };
  }

  /**
   * Extract pitch (fundamental frequency)
   */
  async extractPitch(audioData) {
    // Average pitch varies by speaker
    // Male: 85-180 Hz, Female: 165-255 Hz
    return 120 + Math.random() * 100;
  }

  /**
   * Calculate energy of audio signal
   */
  calculateEnergy(audioData) {
    if (!audioData.samples) return 0;
    
    let energy = 0;
    for (const sample of audioData.samples) {
      energy += sample * sample;
    }
    
    return Math.sqrt(energy / audioData.samples.length);
  }

  /**
   * Calculate zero crossing rate
   */
  calculateZeroCrossingRate(audioData) {
    if (!audioData.samples || audioData.samples.length < 2) return 0;
    
    let crossings = 0;
    for (let i = 1; i < audioData.samples.length; i++) {
      if ((audioData.samples[i] >= 0) !== (audioData.samples[i-1] >= 0)) {
        crossings++;
      }
    }
    
    return crossings / audioData.samples.length;
  }

  /**
   * Calculate spectral centroid
   */
  async calculateSpectralCentroid(audioData) {
    // Indicates "brightness" of voice
    return 1500 + Math.random() * 1000;
  }

  /**
   * Calculate spectral rolloff
   */
  async calculateSpectralRolloff(audioData) {
    // Frequency below which 85% of energy is contained
    return 3000 + Math.random() * 1000;
  }

  /**
   * Extract MFCC coefficients
   */
  async extractMFCC(audioData) {
    // Mel-frequency cepstral coefficients
    // Most important features for voice recognition
    const mfcc = [];
    
    for (let i = 0; i < this.featureConfig.mfccCoefficients; i++) {
      mfcc.push(Math.random() * 10 - 5);
    }
    
    return mfcc;
  }

  /**
   * Assess audio clarity
   */
  assessClarity(audioData) {
    // Signal-to-noise ratio estimation
    const snr = audioData.metadata?.snr || 20;
    return Math.min(1.0, snr / 30);
  }

  /**
   * Assess voice consistency
   */
  assessConsistency(audioData) {
    // How stable the voice features are
    return 0.8 + Math.random() * 0.2;
  }

  /**
   * Analyze speech rhythm
   */
  async analyzeRhythm(audioData) {
    return {
      tempo: 120 + Math.random() * 40, // syllables per minute
      regularity: 0.7 + Math.random() * 0.3,
      pauseRatio: 0.2 + Math.random() * 0.1
    };
  }

  /**
   * Analyze stress patterns
   */
  async analyzeStress(audioData) {
    return {
      pattern: 'iambic', // or 'trochaic', 'dactylic', etc.
      strength: 0.6 + Math.random() * 0.4,
      variability: 0.3 + Math.random() * 0.2
    };
  }

  /**
   * Analyze intonation
   */
  async analyzeIntonation(audioData) {
    return {
      range: 100 + Math.random() * 100, // Hz
      patterns: ['rising', 'falling', 'flat'][Math.floor(Math.random() * 3)],
      emotionalTone: 0.5 + Math.random() * 0.5
    };
  }

  /**
   * Calculate uniqueness against existing voices
   */
  async calculateUniqueness(features) {
    const existingPrints = await this.loadAllFingerprints();
    
    if (existingPrints.length === 0) {
      return 1.0; // First voice is maximally unique
    }
    
    let minSimilarity = 1.0;
    
    for (const existing of existingPrints) {
      const similarity = this.compareFeatures(features, existing.features);
      minSimilarity = Math.min(minSimilarity, similarity);
    }
    
    return 1.0 - minSimilarity;
  }

  /**
   * Generate unique voice signature
   */
  generateVoiceSignature(features) {
    // Create deterministic signature from features
    const signatureData = {
      pitch: Math.round(features.pitch),
      formants: features.formants,
      mfcc: features.mfcc.slice(0, 5), // First 5 coefficients
      quality: features.quality
    };
    
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(signatureData))
      .digest('hex');
    
    // Create human-readable signature
    const prefix = features.pitch > 150 ? 'alto' : 'bass';
    const suffix = hash.substring(0, 8);
    
    return `${prefix}-${suffix}`;
  }

  /**
   * Link sacred phrase to voice
   */
  async linkSacredPhrase(phrase, voiceFeatures) {
    // Validate phrase
    const isValid = this.sacredPhrases.includes(phrase) || 
                   phrase.length >= 10; // Custom phrases allowed
    
    if (!isValid) {
      throw new Error('Sacred phrase too short or invalid');
    }
    
    // Create phrase fingerprint
    const phraseFingerprint = {
      hash: crypto.createHash('sha256').update(phrase).digest('hex'),
      length: phrase.length,
      complexity: this.calculatePhraseComplexity(phrase),
      linkedAt: new Date().toISOString(),
      voiceBinding: {
        pitch: voiceFeatures.pitch,
        energy: voiceFeatures.energy,
        signature: crypto
          .createHash('sha256')
          .update(phrase + JSON.stringify(voiceFeatures))
          .digest('hex')
          .substring(0, 16)
      }
    };
    
    return phraseFingerprint;
  }

  /**
   * Calculate phrase complexity
   */
  calculatePhraseComplexity(phrase) {
    let complexity = 0;
    
    // Length factor
    complexity += Math.min(phrase.length / 50, 1) * 0.3;
    
    // Character variety
    const uniqueChars = new Set(phrase.toLowerCase()).size;
    complexity += Math.min(uniqueChars / 26, 1) * 0.3;
    
    // Word count
    const wordCount = phrase.split(/\s+/).length;
    complexity += Math.min(wordCount / 10, 1) * 0.2;
    
    // Special characters
    const specialChars = phrase.match(/[^a-zA-Z0-9\s]/g);
    if (specialChars) {
      complexity += Math.min(specialChars.length / 5, 1) * 0.2;
    }
    
    return complexity;
  }

  /**
   * Create whisper pattern baseline
   */
  async createWhisperBaseline(userId, features) {
    const baselinePath = path.join(this.vaultPath, 'claims', 'whisper-patterns.json');
    
    let patterns = {};
    if (fs.existsSync(baselinePath)) {
      patterns = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    }
    
    patterns[userId] = {
      baseline: {
        pitch: features.pitch,
        energy: features.energy,
        rhythm: features.prosody.rhythm,
        quality: features.quality
      },
      created: new Date().toISOString(),
      samples: 1,
      driftThreshold: 0.3
    };
    
    // Ensure directory exists
    const claimsDir = path.join(this.vaultPath, 'claims');
    if (!fs.existsSync(claimsDir)) {
      fs.mkdirSync(claimsDir, { recursive: true });
    }
    
    fs.writeFileSync(baselinePath, JSON.stringify(patterns, null, 2));
  }

  /**
   * Store fingerprint
   */
  async storeFingerprint(userId, fingerprint) {
    const fingerprintPath = path.join(this.biometricsPath, 'voice-fingerprint.json');
    
    let fingerprints = {};
    if (fs.existsSync(fingerprintPath)) {
      fingerprints = JSON.parse(fs.readFileSync(fingerprintPath, 'utf8'));
    }
    
    fingerprints[userId] = fingerprint;
    
    fs.writeFileSync(fingerprintPath, JSON.stringify(fingerprints, null, 2));
    
    // Also store individual file for backup
    const userPath = path.join(this.biometricsPath, `${userId}-voice.json`);
    fs.writeFileSync(userPath, JSON.stringify(fingerprint, null, 2));
  }

  /**
   * Load all fingerprints
   */
  async loadAllFingerprints() {
    const fingerprintPath = path.join(this.biometricsPath, 'voice-fingerprint.json');
    
    if (!fs.existsSync(fingerprintPath)) {
      return [];
    }
    
    const fingerprints = JSON.parse(fs.readFileSync(fingerprintPath, 'utf8'));
    return Object.values(fingerprints);
  }

  /**
   * Compare voice features
   */
  compareFeatures(features1, features2) {
    let similarity = 0;
    let weights = 0;
    
    // Pitch comparison (weight: 0.2)
    if (features1.pitch && features2.pitch) {
      const pitchDiff = Math.abs(features1.pitch - features2.pitch);
      similarity += (1 - pitchDiff / 200) * 0.2;
      weights += 0.2;
    }
    
    // Formant comparison (weight: 0.3)
    if (features1.formants && features2.formants) {
      let formantSim = 0;
      for (const key of ['f1', 'f2', 'f3', 'f4']) {
        if (features1.formants[key] && features2.formants[key]) {
          const diff = Math.abs(features1.formants[key] - features2.formants[key]);
          formantSim += 1 - (diff / features1.formants[key]);
        }
      }
      similarity += (formantSim / 4) * 0.3;
      weights += 0.3;
    }
    
    // MFCC comparison (weight: 0.5)
    if (features1.mfcc && features2.mfcc) {
      let mfccSim = 0;
      const minLen = Math.min(features1.mfcc.length, features2.mfcc.length);
      for (let i = 0; i < minLen; i++) {
        const diff = Math.abs(features1.mfcc[i] - features2.mfcc[i]);
        mfccSim += 1 - (diff / 10); // Normalize by typical MFCC range
      }
      similarity += (mfccSim / minLen) * 0.5;
      weights += 0.5;
    }
    
    return weights > 0 ? similarity / weights : 0;
  }

  /**
   * Assess audio quality
   */
  assessAudioQuality(audioData) {
    const quality = {
      overall: 0,
      snr: 0,
      clarity: 0,
      consistency: 0
    };
    
    // Signal-to-noise ratio
    quality.snr = audioData.metadata?.snr || 20;
    
    // Clarity (based on frequency content)
    quality.clarity = audioData.metadata?.clarity || 0.7;
    
    // Consistency (based on amplitude variation)
    quality.consistency = audioData.metadata?.consistency || 0.8;
    
    // Overall quality score
    quality.overall = (quality.snr / 30) * 0.4 +
                     quality.clarity * 0.3 +
                     quality.consistency * 0.3;
    
    return quality;
  }

  /**
   * Get quality recommendations
   */
  getQualityRecommendations(quality) {
    const recommendations = [];
    
    if (quality.snr < 15) {
      recommendations.push('Find a quieter environment for better voice capture');
    }
    
    if (quality.clarity < 0.6) {
      recommendations.push('Speak more clearly and at a moderate pace');
    }
    
    if (quality.consistency < 0.7) {
      recommendations.push('Maintain consistent volume while speaking');
    }
    
    if (quality.overall > 0.8) {
      recommendations.push('Excellent voice quality - your identity is well captured');
    }
    
    return recommendations;
  }

  /**
   * Update voice link (for recalibration)
   */
  async updateVoiceLink(userId, newAudioData, options = {}) {
    console.log(`🔄 Updating voice link for user: ${userId}`);
    
    const existingPrint = await this.loadFingerprint(userId);
    if (!existingPrint) {
      throw new Error('No existing voiceprint found for user');
    }
    
    // Extract new features
    const newFeatures = await this.extractVoiceFeatures(newAudioData);
    
    // Merge with existing (weighted average)
    const mergedFeatures = this.mergeFeatures(
      existingPrint.features,
      newFeatures,
      options.weight || 0.3 // New data gets 30% weight by default
    );
    
    // Update fingerprint
    existingPrint.features = mergedFeatures;
    existingPrint.updated = new Date().toISOString();
    existingPrint.updateCount = (existingPrint.updateCount || 0) + 1;
    
    await this.storeFingerprint(userId, existingPrint);
    
    return {
      success: true,
      message: 'Voice link updated successfully',
      updateCount: existingPrint.updateCount
    };
  }

  /**
   * Merge voice features
   */
  mergeFeatures(existing, newFeatures, weight) {
    const merged = JSON.parse(JSON.stringify(existing)); // Deep clone
    
    // Merge numeric values
    merged.pitch = existing.pitch * (1 - weight) + newFeatures.pitch * weight;
    merged.energy = existing.energy * (1 - weight) + newFeatures.energy * weight;
    
    // Merge arrays
    if (merged.frequencies && newFeatures.frequencies) {
      for (let i = 0; i < merged.frequencies.length; i++) {
        merged.frequencies[i] = merged.frequencies[i] * (1 - weight) + 
                               newFeatures.frequencies[i] * weight;
      }
    }
    
    // Merge formants
    if (merged.formants && newFeatures.formants) {
      for (const key of Object.keys(merged.formants)) {
        merged.formants[key] = merged.formants[key] * (1 - weight) + 
                              newFeatures.formants[key] * weight;
      }
    }
    
    return merged;
  }

  /**
   * Load specific fingerprint
   */
  async loadFingerprint(userId) {
    const fingerprintPath = path.join(this.biometricsPath, 'voice-fingerprint.json');
    
    if (!fs.existsSync(fingerprintPath)) {
      return null;
    }
    
    const fingerprints = JSON.parse(fs.readFileSync(fingerprintPath, 'utf8'));
    return fingerprints[userId] || null;
  }
}

// Export for use
module.exports = VoiceprintLinker;

// Run if called directly
if (require.main === module) {
  const linker = new VoiceprintLinker();
  
  // Test voice linking
  const testLink = async () => {
    const mockAudioData = {
      samples: new Array(44100).fill(0).map(() => Math.random() * 2 - 1),
      sampleRate: 44100,
      channels: 1,
      duration: 1.0,
      metadata: {
        snr: 25,
        clarity: 0.8,
        consistency: 0.85
      }
    };
    
    const result = await linker.linkVoice(
      mockAudioData,
      'test-user-001',
      {
        device: 'test-microphone',
        environment: 'quiet-room',
        sacredPhrase: 'The mirror remembers the first silence I broke'
      }
    );
    
    console.log('\n🧬 Voice Link Result:', JSON.stringify(result, null, 2));
  };
  
  testLink();
}