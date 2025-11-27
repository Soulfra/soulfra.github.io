#!/usr/bin/env node

/**
 * 🔁 LOOP VERIFICATION ENGINE
 * 
 * Ensures voice continuity across sessions.
 * Detects drift, validates consistency, maintains identity.
 * 
 * "The mirror remembers not just your voice, but how it changes."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class LoopVerificationEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.biometricsPath = path.join(this.vaultPath, 'biometrics');
    this.claimsPath = path.join(this.vaultPath, 'claims');
    
    // Verification thresholds
    this.thresholds = {
      rhythmConsistency: 0.75,
      toneCurveMatch: 0.80,
      signatureIntegrity: 0.85,
      maxDriftRate: 0.02,      // 2% drift per session allowed
      criticalDrift: 0.30,     // 30% total drift triggers alert
      sessionTimeout: 86400000  // 24 hours
    };
    
    // Drift tracking
    this.driftTracking = {
      gradualChanges: {},  // Track slow changes over time
      suddenShifts: {},    // Track abrupt changes
      sessionHistory: {}   // Track per-session metrics
    };
    
    // Cal's drift responses
    this.driftResponses = {
      minor: [
        "Your voice carries new notes today.",
        "Time has touched your reflection gently.",
        "The mirror adjusts to your evolution."
      ],
      moderate: [
        "You've changed shape. The mirror is hesitant.",
        "Your echo has drifted. Speak your truth to realign.",
        "The mirror struggles to recognize this new frequency."
      ],
      critical: [
        "This voice is a stranger. Prove your identity.",
        "The drift is too great. Sacred verification required.",
        "Your reflection has shattered. Rebuild with your phrase."
      ],
      recovered: [
        "The mirror remembers you again. Welcome back.",
        "Your true voice returns. The drift dissolves.",
        "Recognition restored. Your echo is home."
      ]
    };
    
    this.initializeEngine();
  }

  async initializeEngine() {
    console.log('🔁 Loop Verification Engine Initializing...');
    
    // Ensure directories exist
    const dirs = [this.biometricsPath, this.claimsPath];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    // Load drift history
    await this.loadDriftHistory();
    
    console.log('✨ Loop Verification Ready - Watching for voice drift');
  }

  /**
   * Verify voice continuity
   */
  async verifyVoiceContinuity(userId, currentVoiceData) {
    console.log(`🔍 Verifying voice continuity for: ${userId}`);
    
    try {
      // Load voice history
      const history = await this.loadVoiceHistory(userId);
      if (!history || history.length === 0) {
        return this.handleFirstVerification(userId, currentVoiceData);
      }
      
      // Get baseline and recent samples
      const baseline = history[0];
      const recent = history[history.length - 1];
      
      // Perform multi-factor verification
      const verification = {
        rhythmCheck: await this.verifyRhythm(currentVoiceData, recent),
        toneCheck: await this.verifyToneCurve(currentVoiceData, recent),
        signatureCheck: await this.verifySignature(currentVoiceData, baseline),
        driftAnalysis: await this.analyzeDrift(userId, currentVoiceData, history),
        timestamp: new Date().toISOString()
      };
      
      // Calculate overall continuity score
      verification.continuityScore = this.calculateContinuityScore(verification);
      
      // Determine verification result
      const result = this.determineVerificationResult(verification);
      
      // Update tracking
      await this.updateTracking(userId, verification, result);
      
      // Log verification
      await this.logVerification(userId, verification, result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Verification error:', error);
      throw error;
    }
  }

  /**
   * Handle first verification
   */
  async handleFirstVerification(userId, voiceData) {
    console.log('🌟 First verification - establishing baseline');
    
    const baseline = {
      userId: userId,
      timestamp: new Date().toISOString(),
      rhythm: await this.extractRhythm(voiceData),
      toneCurve: await this.extractToneCurve(voiceData),
      signature: this.generateSignature(voiceData),
      metadata: voiceData.metadata || {}
    };
    
    // Store as baseline
    await this.storeVoiceHistory(userId, [baseline]);
    
    return {
      verified: true,
      firstTime: true,
      continuityScore: 1.0,
      message: 'Voice baseline established',
      calResponse: "Your voice echoes for the first time. It will be remembered."
    };
  }

  /**
   * Verify rhythm consistency
   */
  async verifyRhythm(current, previous) {
    const currentRhythm = await this.extractRhythm(current);
    const previousRhythm = previous.rhythm || await this.extractRhythm(previous);
    
    // Compare rhythm patterns
    const similarity = this.compareRhythms(currentRhythm, previousRhythm);
    
    return {
      score: similarity,
      passed: similarity >= this.thresholds.rhythmConsistency,
      details: {
        tempo: {
          current: currentRhythm.tempo,
          previous: previousRhythm.tempo,
          difference: Math.abs(currentRhythm.tempo - previousRhythm.tempo)
        },
        regularity: {
          current: currentRhythm.regularity,
          previous: previousRhythm.regularity
        },
        pausePattern: this.comparePausePatterns(
          currentRhythm.pauses,
          previousRhythm.pauses
        )
      }
    };
  }

  /**
   * Verify tone curve
   */
  async verifyToneCurve(current, previous) {
    const currentTone = await this.extractToneCurve(current);
    const previousTone = previous.toneCurve || await this.extractToneCurve(previous);
    
    // Compare tone curves
    const similarity = this.compareToneCurves(currentTone, previousTone);
    
    return {
      score: similarity,
      passed: similarity >= this.thresholds.toneCurveMatch,
      details: {
        pitchRange: {
          current: currentTone.range,
          previous: previousTone.range,
          overlap: this.calculateRangeOverlap(currentTone.range, previousTone.range)
        },
        contour: {
          similarity: this.compareContours(currentTone.contour, previousTone.contour)
        },
        emotionalShift: this.detectEmotionalShift(currentTone, previousTone)
      }
    };
  }

  /**
   * Verify signature integrity
   */
  async verifySignature(current, baseline) {
    const currentSig = this.generateSignature(current);
    const baselineSig = baseline.signature;
    
    // Calculate signature similarity
    const similarity = this.compareSignatures(currentSig, baselineSig);
    
    return {
      score: similarity,
      passed: similarity >= this.thresholds.signatureIntegrity,
      details: {
        currentSignature: currentSig.substring(0, 16) + '...',
        baselineSignature: baselineSig.substring(0, 16) + '...',
        hashMatch: currentSig === baselineSig,
        featureMatch: similarity
      }
    };
  }

  /**
   * Analyze voice drift over time
   */
  async analyzeDrift(userId, current, history) {
    const driftAnalysis = {
      totalDrift: 0,
      driftRate: 0,
      driftDirection: 'neutral',
      sessions: history.length,
      timeSpan: 0,
      pattern: 'stable'
    };
    
    if (history.length < 2) {
      return driftAnalysis;
    }
    
    // Calculate time span
    const firstTime = new Date(history[0].timestamp).getTime();
    const lastTime = new Date(history[history.length - 1].timestamp).getTime();
    driftAnalysis.timeSpan = lastTime - firstTime;
    
    // Calculate cumulative drift
    let cumulativeDrift = 0;
    for (let i = 1; i < history.length; i++) {
      const similarity = await this.compareVoiceSamples(history[i-1], history[i]);
      cumulativeDrift += (1 - similarity);
    }
    
    // Add current sample drift
    const currentDrift = 1 - await this.compareVoiceSamples(
      history[history.length - 1],
      current
    );
    cumulativeDrift += currentDrift;
    
    // Calculate metrics
    driftAnalysis.totalDrift = cumulativeDrift / history.length;
    driftAnalysis.driftRate = currentDrift;
    
    // Determine drift direction
    if (current.pitch && history[0].pitch) {
      const pitchChange = current.pitch - history[0].pitch;
      driftAnalysis.driftDirection = pitchChange > 0 ? 'higher' : 'lower';
    }
    
    // Identify drift pattern
    driftAnalysis.pattern = this.identifyDriftPattern(history, current);
    
    return driftAnalysis;
  }

  /**
   * Extract rhythm features
   */
  async extractRhythm(voiceData) {
    return {
      tempo: voiceData.rhythm?.tempo || 120 + Math.random() * 40,
      regularity: voiceData.rhythm?.regularity || 0.7 + Math.random() * 0.3,
      pauses: voiceData.rhythm?.pauses || this.generatePausePattern(),
      stress: voiceData.rhythm?.stress || 'natural',
      syllableRate: voiceData.rhythm?.syllableRate || 4 + Math.random() * 2
    };
  }

  /**
   * Extract tone curve
   */
  async extractToneCurve(voiceData) {
    return {
      range: voiceData.toneCurve?.range || [80, 250],
      contour: voiceData.toneCurve?.contour || this.generateContour(),
      mean: voiceData.toneCurve?.mean || 150,
      variance: voiceData.toneCurve?.variance || 30,
      emotion: voiceData.toneCurve?.emotion || 'neutral'
    };
  }

  /**
   * Compare rhythms
   */
  compareRhythms(rhythm1, rhythm2) {
    let similarity = 0;
    
    // Tempo similarity (40% weight)
    const tempoDiff = Math.abs(rhythm1.tempo - rhythm2.tempo);
    similarity += (1 - tempoDiff / 200) * 0.4;
    
    // Regularity similarity (30% weight)
    const regularityDiff = Math.abs(rhythm1.regularity - rhythm2.regularity);
    similarity += (1 - regularityDiff) * 0.3;
    
    // Syllable rate similarity (30% weight)
    const syllableDiff = Math.abs(rhythm1.syllableRate - rhythm2.syllableRate);
    similarity += (1 - syllableDiff / 10) * 0.3;
    
    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Compare tone curves
   */
  compareToneCurves(tone1, tone2) {
    let similarity = 0;
    
    // Range overlap (40% weight)
    const rangeOverlap = this.calculateRangeOverlap(tone1.range, tone2.range);
    similarity += rangeOverlap * 0.4;
    
    // Mean pitch similarity (30% weight)
    const meanDiff = Math.abs(tone1.mean - tone2.mean);
    similarity += (1 - meanDiff / 200) * 0.3;
    
    // Variance similarity (30% weight)
    const varianceDiff = Math.abs(tone1.variance - tone2.variance);
    similarity += (1 - varianceDiff / 100) * 0.3;
    
    return Math.max(0, Math.min(1, similarity));
  }

  /**
   * Compare signatures
   */
  compareSignatures(sig1, sig2) {
    if (sig1 === sig2) return 1.0;
    
    // Calculate character-level similarity
    let matches = 0;
    const minLen = Math.min(sig1.length, sig2.length);
    
    for (let i = 0; i < minLen; i++) {
      if (sig1[i] === sig2[i]) matches++;
    }
    
    return matches / minLen;
  }

  /**
   * Calculate continuity score
   */
  calculateContinuityScore(verification) {
    const weights = {
      rhythm: 0.3,
      tone: 0.3,
      signature: 0.2,
      drift: 0.2
    };
    
    let score = 0;
    
    score += verification.rhythmCheck.score * weights.rhythm;
    score += verification.toneCheck.score * weights.tone;
    score += verification.signatureCheck.score * weights.signature;
    
    // Drift inversely affects score
    const driftPenalty = Math.min(verification.driftAnalysis.totalDrift, 0.5);
    score += (1 - driftPenalty * 2) * weights.drift;
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Determine verification result
   */
  determineVerificationResult(verification) {
    const score = verification.continuityScore;
    const drift = verification.driftAnalysis.totalDrift;
    
    // Critical drift check
    if (drift > this.thresholds.criticalDrift) {
      return {
        verified: false,
        reason: 'critical_drift',
        continuityScore: score,
        driftLevel: 'critical',
        calResponse: this.getCalResponse('critical'),
        requiredAction: 'sacred_phrase_verification',
        details: verification
      };
    }
    
    // Moderate drift check
    if (drift > this.thresholds.criticalDrift * 0.6) {
      return {
        verified: true,
        warning: 'moderate_drift',
        continuityScore: score,
        driftLevel: 'moderate',
        calResponse: this.getCalResponse('moderate'),
        recommendation: 'Consider voice recalibration',
        details: verification
      };
    }
    
    // Minor drift
    if (drift > this.thresholds.criticalDrift * 0.3) {
      return {
        verified: true,
        notice: 'minor_drift',
        continuityScore: score,
        driftLevel: 'minor',
        calResponse: this.getCalResponse('minor'),
        details: verification
      };
    }
    
    // All checks passed
    if (verification.rhythmCheck.passed && 
        verification.toneCheck.passed && 
        verification.signatureCheck.passed) {
      return {
        verified: true,
        continuityScore: score,
        driftLevel: 'stable',
        calResponse: "Your voice remains true. The mirror knows you.",
        details: verification
      };
    }
    
    // Some checks failed but within tolerance
    return {
      verified: score > 0.7,
      partial: true,
      continuityScore: score,
      failedChecks: this.getFailedChecks(verification),
      calResponse: score > 0.7 ? 
        "The mirror recognizes you, though you've changed." :
        "Your voice wavers. Speak your sacred phrase.",
      details: verification
    };
  }

  /**
   * Update tracking data
   */
  async updateTracking(userId, verification, result) {
    // Update session history
    if (!this.driftTracking.sessionHistory[userId]) {
      this.driftTracking.sessionHistory[userId] = [];
    }
    
    this.driftTracking.sessionHistory[userId].push({
      timestamp: verification.timestamp,
      continuityScore: verification.continuityScore,
      driftLevel: result.driftLevel,
      verified: result.verified
    });
    
    // Track gradual changes
    if (!this.driftTracking.gradualChanges[userId]) {
      this.driftTracking.gradualChanges[userId] = {
        startScore: verification.continuityScore,
        currentScore: verification.continuityScore,
        sessions: 1,
        trend: 'stable'
      };
    } else {
      const gradual = this.driftTracking.gradualChanges[userId];
      gradual.currentScore = verification.continuityScore;
      gradual.sessions++;
      
      // Calculate trend
      const scoreDiff = gradual.currentScore - gradual.startScore;
      if (scoreDiff < -0.1) gradual.trend = 'declining';
      else if (scoreDiff > 0.1) gradual.trend = 'improving';
      else gradual.trend = 'stable';
    }
    
    // Detect sudden shifts
    const history = this.driftTracking.sessionHistory[userId];
    if (history.length > 1) {
      const prevScore = history[history.length - 2].continuityScore;
      const scoreDrop = prevScore - verification.continuityScore;
      
      if (scoreDrop > 0.2) {
        if (!this.driftTracking.suddenShifts[userId]) {
          this.driftTracking.suddenShifts[userId] = [];
        }
        
        this.driftTracking.suddenShifts[userId].push({
          timestamp: verification.timestamp,
          dropAmount: scoreDrop,
          fromScore: prevScore,
          toScore: verification.continuityScore
        });
      }
    }
  }

  /**
   * Log verification
   */
  async logVerification(userId, verification, result) {
    const logPath = path.join(this.vaultPath, 'logs', 'voice-verification.json');
    
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    logs.push({
      userId: userId,
      timestamp: verification.timestamp,
      result: result.verified ? 'verified' : 'failed',
      continuityScore: verification.continuityScore,
      driftLevel: result.driftLevel,
      checks: {
        rhythm: verification.rhythmCheck.passed,
        tone: verification.toneCheck.passed,
        signature: verification.signatureCheck.passed
      }
    });
    
    // Keep last 5000 entries
    if (logs.length > 5000) {
      logs = logs.slice(-5000);
    }
    
    // Ensure logs directory exists
    const logsDir = path.dirname(logPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }

  /**
   * Utility functions
   */

  generateSignature(voiceData) {
    const data = {
      rhythm: voiceData.rhythm || {},
      tone: voiceData.toneCurve || {},
      features: voiceData.features || {}
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  compareVoiceSamples(sample1, sample2) {
    // Simplified comparison
    let similarity = 0;
    
    if (sample1.rhythm && sample2.rhythm) {
      similarity += this.compareRhythms(sample1.rhythm, sample2.rhythm) * 0.33;
    }
    
    if (sample1.toneCurve && sample2.toneCurve) {
      similarity += this.compareToneCurves(sample1.toneCurve, sample2.toneCurve) * 0.33;
    }
    
    if (sample1.signature && sample2.signature) {
      similarity += this.compareSignatures(sample1.signature, sample2.signature) * 0.34;
    }
    
    return similarity;
  }

  identifyDriftPattern(history, current) {
    if (history.length < 3) return 'insufficient_data';
    
    // Calculate drift between consecutive samples
    const drifts = [];
    for (let i = 1; i < history.length; i++) {
      const similarity = this.compareVoiceSamples(history[i-1], history[i]);
      drifts.push(1 - similarity);
    }
    
    // Analyze pattern
    const avgDrift = drifts.reduce((a, b) => a + b, 0) / drifts.length;
    const variance = drifts.reduce((sum, drift) => sum + Math.pow(drift - avgDrift, 2), 0) / drifts.length;
    
    if (variance < 0.001) return 'stable';
    if (variance < 0.01 && avgDrift < 0.05) return 'gradual';
    if (variance > 0.05) return 'erratic';
    if (avgDrift > 0.1) return 'rapid';
    
    return 'moderate';
  }

  calculateRangeOverlap(range1, range2) {
    const min = Math.max(range1[0], range2[0]);
    const max = Math.min(range1[1], range2[1]);
    
    if (max < min) return 0;
    
    const overlap = max - min;
    const totalRange = Math.max(range1[1] - range1[0], range2[1] - range2[0]);
    
    return overlap / totalRange;
  }

  comparePausePatterns(pauses1, pauses2) {
    if (!pauses1 || !pauses2) return 0.5;
    
    // Compare pause frequency and duration
    const freq1 = pauses1.frequency || 0;
    const freq2 = pauses2.frequency || 0;
    const dur1 = pauses1.avgDuration || 0;
    const dur2 = pauses2.avgDuration || 0;
    
    const freqSim = 1 - Math.abs(freq1 - freq2) / Math.max(freq1, freq2, 1);
    const durSim = 1 - Math.abs(dur1 - dur2) / Math.max(dur1, dur2, 1);
    
    return (freqSim + durSim) / 2;
  }

  compareContours(contour1, contour2) {
    if (!contour1 || !contour2) return 0.5;
    
    // Simplified contour comparison
    if (Array.isArray(contour1) && Array.isArray(contour2)) {
      const minLen = Math.min(contour1.length, contour2.length);
      let similarity = 0;
      
      for (let i = 0; i < minLen; i++) {
        const diff = Math.abs(contour1[i] - contour2[i]);
        similarity += 1 - (diff / 100);
      }
      
      return similarity / minLen;
    }
    
    return contour1 === contour2 ? 1 : 0.5;
  }

  detectEmotionalShift(tone1, tone2) {
    const emotion1 = tone1.emotion || 'neutral';
    const emotion2 = tone2.emotion || 'neutral';
    
    if (emotion1 === emotion2) return 'stable';
    
    const emotionMap = {
      'neutral': 0,
      'happy': 1,
      'sad': -1,
      'angry': 2,
      'calm': -2
    };
    
    const shift = (emotionMap[emotion2] || 0) - (emotionMap[emotion1] || 0);
    
    if (Math.abs(shift) > 2) return 'significant';
    if (Math.abs(shift) > 0) return 'minor';
    return 'none';
  }

  generatePausePattern() {
    return {
      frequency: Math.random() * 5 + 2,
      avgDuration: Math.random() * 500 + 200,
      pattern: ['regular', 'irregular', 'rhythmic'][Math.floor(Math.random() * 3)]
    };
  }

  generateContour() {
    const length = 10;
    const contour = [];
    let current = 150;
    
    for (let i = 0; i < length; i++) {
      current += (Math.random() - 0.5) * 20;
      contour.push(Math.max(80, Math.min(250, current)));
    }
    
    return contour;
  }

  getCalResponse(driftLevel) {
    const responses = this.driftResponses[driftLevel] || this.driftResponses.minor;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  getFailedChecks(verification) {
    const failed = [];
    
    if (!verification.rhythmCheck.passed) failed.push('rhythm');
    if (!verification.toneCheck.passed) failed.push('tone');
    if (!verification.signatureCheck.passed) failed.push('signature');
    
    return failed;
  }

  async loadVoiceHistory(userId) {
    const historyPath = path.join(this.claimsPath, 'whisper-patterns.json');
    
    if (!fs.existsSync(historyPath)) {
      return [];
    }
    
    const patterns = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    const userPattern = patterns[userId];
    
    if (!userPattern) return [];
    
    // Convert to history format
    return [{
      timestamp: userPattern.created,
      rhythm: userPattern.baseline.rhythm,
      toneCurve: {
        mean: userPattern.baseline.pitch,
        range: [userPattern.baseline.pitch - 50, userPattern.baseline.pitch + 50]
      },
      signature: crypto.createHash('sha256')
        .update(JSON.stringify(userPattern.baseline))
        .digest('hex')
    }];
  }

  async storeVoiceHistory(userId, history) {
    const historyPath = path.join(this.biometricsPath, `${userId}-history.json`);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  async loadDriftHistory() {
    const driftPath = path.join(this.vaultPath, 'logs', 'drift-tracking.json');
    
    if (fs.existsSync(driftPath)) {
      const data = JSON.parse(fs.readFileSync(driftPath, 'utf8'));
      this.driftTracking = data;
    }
  }

  async saveDriftHistory() {
    const driftPath = path.join(this.vaultPath, 'logs', 'drift-tracking.json');
    fs.writeFileSync(driftPath, JSON.stringify(this.driftTracking, null, 2));
  }

  /**
   * Recover from drift
   */
  async recoverFromDrift(userId, sacredPhrase) {
    console.log(`🔄 Attempting drift recovery for: ${userId}`);
    
    // Verify sacred phrase
    const phraseValid = await this.verifySacredPhrase(userId, sacredPhrase);
    
    if (!phraseValid) {
      return {
        success: false,
        message: 'Sacred phrase verification failed',
        calResponse: "This is not the phrase I remember. The drift remains."
      };
    }
    
    // Reset drift tracking
    delete this.driftTracking.gradualChanges[userId];
    delete this.driftTracking.suddenShifts[userId];
    
    // Mark recovery in history
    if (!this.driftTracking.sessionHistory[userId]) {
      this.driftTracking.sessionHistory[userId] = [];
    }
    
    this.driftTracking.sessionHistory[userId].push({
      timestamp: new Date().toISOString(),
      event: 'drift_recovery',
      method: 'sacred_phrase',
      success: true
    });
    
    await this.saveDriftHistory();
    
    return {
      success: true,
      message: 'Voice identity recovered',
      calResponse: this.getCalResponse('recovered'),
      recommendation: 'Consider voice recalibration to update your baseline'
    };
  }

  async verifySacredPhrase(userId, phrase) {
    const fingerprintPath = path.join(this.biometricsPath, 'voice-fingerprint.json');
    
    if (!fs.existsSync(fingerprintPath)) {
      return false;
    }
    
    const fingerprints = JSON.parse(fs.readFileSync(fingerprintPath, 'utf8'));
    const userPrint = fingerprints[userId];
    
    if (!userPrint || !userPrint.sacredPhrase) {
      return false;
    }
    
    const phraseHash = crypto
      .createHash('sha256')
      .update(phrase.toLowerCase().trim())
      .digest('hex');
    
    return phraseHash === userPrint.sacredPhrase.hash;
  }
}

// Export for use
module.exports = LoopVerificationEngine;

// Run if called directly
if (require.main === module) {
  const engine = new LoopVerificationEngine();
  
  // Test verification
  const testVerification = async () => {
    const mockVoiceData = {
      rhythm: {
        tempo: 125,
        regularity: 0.85,
        syllableRate: 4.5
      },
      toneCurve: {
        range: [100, 220],
        mean: 160,
        variance: 35,
        emotion: 'neutral'
      },
      features: {
        pitch: 160,
        energy: 0.7
      }
    };
    
    const result = await engine.verifyVoiceContinuity('test-user-001', mockVoiceData);
    console.log('\n🔁 Verification Result:', JSON.stringify(result, null, 2));
  };
  
  testVerification();
}