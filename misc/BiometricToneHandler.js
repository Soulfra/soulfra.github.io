/**
 * BiometricToneHandler.js
 * 
 * BIOMETRIC RESONANCE CAPTURE - Beyond Simple Swipes
 * 
 * Captures subtle human signals that indicate consent:
 * - Tone hesitation in voice
 * - Rhythm taps and patterns
 * - Microphone-based voice nods
 * - Touch pressure variations
 * - Response timing patterns
 * 
 * These signals enhance the consent layer with nuanced human expression.
 */

const { EventEmitter } = require('events');

class BiometricToneHandler extends EventEmitter {
  constructor() {
    super();
    
    // Biometric capture state
    this.activeCaptures = new Map();
    this.patterns = new Map();
    
    // Tone detection configuration
    this.toneConfig = {
      hesitationThreshold: 500,      // ms of pause indicating uncertainty
      rhythmWindowSize: 2000,        // ms to capture tap patterns
      voiceNodeThreshold: 0.7,       // confidence for voice gestures
      pressureVariationMin: 0.1,     // minimum pressure difference
      timingAnalysisWindow: 5000     // ms for response timing analysis
    };
    
    // Pattern library
    this.knownPatterns = {
      doubleTap: { taps: 2, window: 500, meaning: 'confirm' },
      tripleTap: { taps: 3, window: 700, meaning: 'strong_confirm' },
      longPress: { duration: 1000, meaning: 'thoughtful_yes' },
      quickSwipe: { velocity: 2.0, meaning: 'enthusiastic' },
      slowDrag: { velocity: 0.3, meaning: 'reluctant' },
      shaveAndHaircut: { pattern: [100, 100, 200, 100, 400], meaning: 'playful_yes' }
    };
    
    // Voice tone patterns
    this.voiceTones = {
      rising: { pattern: 'pitch_up', meaning: 'questioning' },
      falling: { pattern: 'pitch_down', meaning: 'certain' },
      wavering: { pattern: 'pitch_variable', meaning: 'uncertain' },
      emphatic: { pattern: 'volume_spike', meaning: 'strong_feeling' }
    };
    
    // Captured biometric history
    this.sessionHistory = [];
    this.patternMemory = new Map();
  }

  /**
   * Initialize biometric capture
   */
  initialize() {
    console.log('🎭 Biometric Tone Handler initialized');
    console.log('👂 Listening for subtle human signals...');
    
    // Start pattern analysis
    this.startPatternAnalysis();
  }

  /**
   * Capture voice hesitation
   */
  async captureVoiceHesitation(audioStream, metadata = {}) {
    const captureId = this.generateCaptureId();
    
    const capture = {
      id: captureId,
      type: 'voice_hesitation',
      startTime: Date.now(),
      metadata,
      
      // Analysis state
      pauses: [],
      pitchVariations: [],
      volumeChanges: [],
      overallTone: null
    };
    
    this.activeCaptures.set(captureId, capture);
    
    // Analyze audio stream
    const analysis = await this.analyzeVoiceStream(audioStream, capture);
    
    // Detect hesitation patterns
    const hesitation = this.detectHesitation(analysis);
    
    // Emit findings
    this.emit('voice:analyzed', {
      captureId,
      hesitation,
      tone: analysis.overallTone,
      confidence: analysis.confidence
    });
    
    return {
      captureId,
      hesitationLevel: hesitation.level,
      interpretation: this.interpretVoiceHesitation(hesitation),
      rawData: analysis
    };
  }

  /**
   * Capture rhythm taps
   */
  async captureRhythmTaps(touchEvents, metadata = {}) {
    const captureId = this.generateCaptureId();
    
    const capture = {
      id: captureId,
      type: 'rhythm_taps',
      startTime: Date.now(),
      metadata,
      
      // Tap data
      taps: [],
      intervals: [],
      pattern: null
    };
    
    this.activeCaptures.set(captureId, capture);
    
    // Process touch events
    touchEvents.forEach((event, index) => {
      capture.taps.push({
        timestamp: event.timestamp,
        position: event.position,
        pressure: event.pressure || 1.0
      });
      
      if (index > 0) {
        capture.intervals.push(event.timestamp - touchEvents[index - 1].timestamp);
      }
    });
    
    // Detect rhythm pattern
    const pattern = this.detectRhythmPattern(capture.intervals);
    capture.pattern = pattern;
    
    // Check against known patterns
    const match = this.matchKnownPattern(pattern);
    
    return {
      captureId,
      pattern: pattern.signature,
      match: match ? match.meaning : 'unknown',
      confidence: pattern.confidence,
      interpretation: this.interpretRhythm(pattern, match)
    };
  }

  /**
   * Capture microphone voice nods
   */
  async captureVoiceNods(audioStream, metadata = {}) {
    const captureId = this.generateCaptureId();
    
    const capture = {
      id: captureId,
      type: 'voice_nods',
      startTime: Date.now(),
      metadata,
      
      // Voice gesture data
      utterances: [],
      nonVerbal: [],
      gestures: []
    };
    
    this.activeCaptures.set(captureId, capture);
    
    // Analyze for voice gestures
    const gestures = await this.detectVoiceGestures(audioStream);
    
    // Categorize gestures
    gestures.forEach(gesture => {
      if (gesture.type === 'verbal') {
        capture.utterances.push(gesture);
      } else if (gesture.type === 'nonverbal') {
        capture.nonVerbal.push(gesture);
      }
      
      // Check for nod patterns
      if (this.isVoiceNod(gesture)) {
        capture.gestures.push({
          ...gesture,
          interpretation: 'voice_nod'
        });
      }
    });
    
    // Calculate overall sentiment
    const sentiment = this.calculateVoiceSentiment(capture);
    
    return {
      captureId,
      nodCount: capture.gestures.length,
      sentiment: sentiment.label,
      confidence: sentiment.confidence,
      interpretation: this.interpretVoiceNods(capture.gestures, sentiment)
    };
  }

  /**
   * Capture touch pressure variations
   */
  async capturePressureVariations(touchStream, metadata = {}) {
    const captureId = this.generateCaptureId();
    
    const capture = {
      id: captureId,
      type: 'pressure_variations',
      startTime: Date.now(),
      metadata,
      
      // Pressure data
      readings: [],
      variations: [],
      pattern: null
    };
    
    this.activeCaptures.set(captureId, capture);
    
    // Collect pressure readings
    touchStream.forEach(reading => {
      capture.readings.push({
        timestamp: reading.timestamp,
        pressure: reading.pressure,
        position: reading.position,
        area: reading.area || 1.0
      });
    });
    
    // Calculate variations
    capture.variations = this.calculatePressureVariations(capture.readings);
    
    // Detect emotional pattern
    const emotionalPattern = this.detectEmotionalPressure(capture.variations);
    
    return {
      captureId,
      averagePressure: this.calculateAveragePressure(capture.readings),
      variationLevel: emotionalPattern.variationLevel,
      emotion: emotionalPattern.emotion,
      confidence: emotionalPattern.confidence,
      interpretation: this.interpretPressure(emotionalPattern)
    };
  }

  /**
   * Capture response timing patterns
   */
  async captureResponseTiming(decisionEvents, metadata = {}) {
    const captureId = this.generateCaptureId();
    
    const capture = {
      id: captureId,
      type: 'response_timing',
      startTime: Date.now(),
      metadata,
      
      // Timing data
      events: [],
      responseTimes: [],
      pattern: null
    };
    
    this.activeCaptures.set(captureId, capture);
    
    // Process decision events
    decisionEvents.forEach((event, index) => {
      capture.events.push({
        presented: event.presentedAt,
        responded: event.respondedAt,
        responseTime: event.respondedAt - event.presentedAt,
        decision: event.decision
      });
      
      capture.responseTimes.push(event.respondedAt - event.presentedAt);
    });
    
    // Analyze timing patterns
    const timingPattern = this.analyzeTimingPattern(capture.responseTimes);
    
    // Detect decision confidence
    const confidence = this.detectDecisionConfidence(timingPattern);
    
    return {
      captureId,
      averageResponseTime: this.calculateAverageTime(capture.responseTimes),
      pattern: timingPattern.type,
      confidence: confidence.level,
      interpretation: this.interpretTiming(timingPattern, confidence)
    };
  }

  /**
   * Process combined biometric signals
   */
  async processCombinedBiometrics(captures) {
    const analysis = {
      timestamp: Date.now(),
      captures: captures.map(c => c.captureId),
      
      // Combined metrics
      overallConfidence: 0,
      emotionalState: 'neutral',
      consentStrength: 0,
      recommendation: 'proceed'
    };
    
    // Weight different biometric inputs
    const weights = {
      voice_hesitation: 0.3,
      rhythm_taps: 0.2,
      voice_nods: 0.25,
      pressure_variations: 0.15,
      response_timing: 0.1
    };
    
    // Calculate weighted confidence
    let weightedSum = 0;
    let totalWeight = 0;
    
    captures.forEach(capture => {
      const weight = weights[capture.type] || 0.1;
      weightedSum += capture.confidence * weight;
      totalWeight += weight;
    });
    
    analysis.overallConfidence = totalWeight > 0 ? weightedSum / totalWeight : 0.5;
    
    // Determine emotional state
    analysis.emotionalState = this.determineEmotionalState(captures);
    
    // Calculate consent strength
    analysis.consentStrength = this.calculateConsentStrength(captures, analysis.emotionalState);
    
    // Generate recommendation
    if (analysis.consentStrength > 0.8) {
      analysis.recommendation = 'strong_proceed';
    } else if (analysis.consentStrength > 0.6) {
      analysis.recommendation = 'proceed';
    } else if (analysis.consentStrength > 0.4) {
      analysis.recommendation = 'clarify';
    } else {
      analysis.recommendation = 'reconsider';
    }
    
    // Store in session history
    this.sessionHistory.push(analysis);
    
    // Emit combined analysis
    this.emit('biometrics:combined', analysis);
    
    return analysis;
  }

  /**
   * Analyze voice stream for patterns
   */
  async analyzeVoiceStream(audioStream, capture) {
    // This would use actual audio analysis
    // For now, return mock analysis
    return {
      pauses: [
        { start: 100, duration: 600, significance: 'high' },
        { start: 1200, duration: 200, significance: 'low' }
      ],
      pitchVariations: [
        { time: 500, variation: 0.2, direction: 'up' },
        { time: 1500, variation: 0.1, direction: 'down' }
      ],
      volumeChanges: [
        { time: 800, change: -0.3, type: 'softer' }
      ],
      overallTone: 'uncertain',
      confidence: 0.75
    };
  }

  /**
   * Detect hesitation from voice analysis
   */
  detectHesitation(analysis) {
    const significantPauses = analysis.pauses.filter(p => 
      p.duration > this.toneConfig.hesitationThreshold
    );
    
    const hesitationLevel = significantPauses.length > 0 ? 
      Math.min(1, significantPauses.length * 0.3) : 0;
    
    return {
      level: hesitationLevel,
      pauseCount: significantPauses.length,
      totalPauseDuration: significantPauses.reduce((sum, p) => sum + p.duration, 0),
      pattern: hesitationLevel > 0.5 ? 'significant' : 'minimal'
    };
  }

  /**
   * Interpret voice hesitation
   */
  interpretVoiceHesitation(hesitation) {
    if (hesitation.level > 0.7) {
      return 'strong_uncertainty';
    } else if (hesitation.level > 0.4) {
      return 'considering_carefully';
    } else if (hesitation.level > 0.2) {
      return 'slight_pause';
    }
    return 'confident_response';
  }

  /**
   * Detect rhythm pattern from intervals
   */
  detectRhythmPattern(intervals) {
    if (intervals.length < 2) {
      return { signature: 'single', confidence: 1.0 };
    }
    
    // Calculate rhythm signature
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = this.calculateVariance(intervals, avgInterval);
    
    // Determine pattern type
    let patternType = 'irregular';
    let confidence = 0.5;
    
    if (variance < 50) {
      patternType = 'steady';
      confidence = 0.9;
    } else if (variance < 100) {
      patternType = 'rhythmic';
      confidence = 0.8;
    }
    
    return {
      signature: intervals.join('-'),
      type: patternType,
      avgInterval,
      variance,
      confidence
    };
  }

  /**
   * Match against known patterns
   */
  matchKnownPattern(pattern) {
    // Check if pattern matches any known patterns
    for (const [name, known] of Object.entries(this.knownPatterns)) {
      if (known.pattern && this.patternsMatch(pattern.signature, known.pattern)) {
        return { name, ...known };
      }
    }
    return null;
  }

  /**
   * Interpret rhythm pattern
   */
  interpretRhythm(pattern, match) {
    if (match) {
      return {
        gesture: 'recognized_pattern',
        meaning: match.meaning,
        confidence: pattern.confidence
      };
    }
    
    if (pattern.type === 'steady') {
      return {
        gesture: 'deliberate_rhythm',
        meaning: 'thoughtful',
        confidence: pattern.confidence
      };
    }
    
    return {
      gesture: 'expressive_rhythm',
      meaning: 'emotional',
      confidence: pattern.confidence * 0.7
    };
  }

  /**
   * Detect voice gestures (nods, uh-huhs, etc)
   */
  async detectVoiceGestures(audioStream) {
    // Would analyze actual audio
    // Return mock gestures
    return [
      { type: 'nonverbal', gesture: 'mmhmm', confidence: 0.9, timestamp: 500 },
      { type: 'nonverbal', gesture: 'uh-huh', confidence: 0.85, timestamp: 1200 },
      { type: 'verbal', text: 'yeah', confidence: 0.95, timestamp: 2000 }
    ];
  }

  /**
   * Check if gesture is a voice nod
   */
  isVoiceNod(gesture) {
    const nodPatterns = ['mmhmm', 'uh-huh', 'mm', 'yeah', 'yep', 'okay'];
    return nodPatterns.includes(gesture.gesture) || nodPatterns.includes(gesture.text);
  }

  /**
   * Calculate voice sentiment
   */
  calculateVoiceSentiment(capture) {
    const positiveCount = capture.gestures.length;
    const totalGestures = capture.utterances.length + capture.nonVerbal.length;
    
    const ratio = totalGestures > 0 ? positiveCount / totalGestures : 0;
    
    return {
      label: ratio > 0.7 ? 'positive' : ratio > 0.3 ? 'neutral' : 'uncertain',
      confidence: Math.min(1, ratio + 0.2),
      ratio
    };
  }

  /**
   * Interpret voice nods
   */
  interpretVoiceNods(gestures, sentiment) {
    if (gestures.length > 3 && sentiment.label === 'positive') {
      return {
        gesture: 'enthusiastic_agreement',
        strength: 'strong',
        recommendation: 'proceed_confidently'
      };
    }
    
    if (gestures.length > 0 && sentiment.label === 'positive') {
      return {
        gesture: 'agreement',
        strength: 'moderate',
        recommendation: 'proceed'
      };
    }
    
    return {
      gesture: 'processing',
      strength: 'weak',
      recommendation: 'wait_for_clarity'
    };
  }

  /**
   * Calculate pressure variations
   */
  calculatePressureVariations(readings) {
    const variations = [];
    
    for (let i = 1; i < readings.length; i++) {
      variations.push({
        time: readings[i].timestamp,
        change: readings[i].pressure - readings[i-1].pressure,
        rate: (readings[i].pressure - readings[i-1].pressure) / 
              (readings[i].timestamp - readings[i-1].timestamp)
      });
    }
    
    return variations;
  }

  /**
   * Detect emotional pressure patterns
   */
  detectEmotionalPressure(variations) {
    const avgChange = variations.reduce((sum, v) => sum + Math.abs(v.change), 0) / variations.length;
    
    let emotion = 'neutral';
    let variationLevel = 'normal';
    
    if (avgChange > 0.3) {
      emotion = 'excited';
      variationLevel = 'high';
    } else if (avgChange < 0.1) {
      emotion = 'calm';
      variationLevel = 'low';
    }
    
    return {
      emotion,
      variationLevel,
      avgChange,
      confidence: 0.7 + (variations.length * 0.01)
    };
  }

  /**
   * Interpret pressure patterns
   */
  interpretPressure(pattern) {
    const interpretations = {
      excited: {
        gesture: 'energetic_touch',
        meaning: 'enthusiastic',
        recommendation: 'positive_signal'
      },
      calm: {
        gesture: 'gentle_touch',
        meaning: 'thoughtful',
        recommendation: 'careful_consideration'
      },
      neutral: {
        gesture: 'standard_touch',
        meaning: 'neutral',
        recommendation: 'no_special_signal'
      }
    };
    
    return interpretations[pattern.emotion] || interpretations.neutral;
  }

  /**
   * Analyze timing pattern
   */
  analyzeTimingPattern(responseTimes) {
    const avg = this.calculateAverageTime(responseTimes);
    const variance = this.calculateVariance(responseTimes, avg);
    
    let type = 'variable';
    if (variance < 500) {
      type = 'consistent';
    } else if (avg < 1000) {
      type = 'quick';
    } else if (avg > 3000) {
      type = 'deliberate';
    }
    
    return {
      type,
      avgTime: avg,
      variance,
      trend: this.detectTimingTrend(responseTimes)
    };
  }

  /**
   * Detect decision confidence from timing
   */
  detectDecisionConfidence(timingPattern) {
    let level = 0.5;
    
    if (timingPattern.type === 'quick' && timingPattern.variance < 300) {
      level = 0.9; // Quick and consistent = confident
    } else if (timingPattern.type === 'deliberate' && timingPattern.variance < 500) {
      level = 0.7; // Slow but consistent = thoughtful
    } else if (timingPattern.type === 'variable') {
      level = 0.4; // Variable = uncertain
    }
    
    return {
      level,
      label: level > 0.7 ? 'confident' : level > 0.5 ? 'moderate' : 'uncertain'
    };
  }

  /**
   * Interpret timing patterns
   */
  interpretTiming(pattern, confidence) {
    if (pattern.type === 'quick' && confidence.level > 0.8) {
      return {
        gesture: 'instinctive_response',
        meaning: 'clear_preference',
        strength: 'strong'
      };
    }
    
    if (pattern.type === 'deliberate' && confidence.level > 0.6) {
      return {
        gesture: 'thoughtful_response',
        meaning: 'considered_decision',
        strength: 'moderate'
      };
    }
    
    return {
      gesture: 'uncertain_response',
      meaning: 'needs_clarification',
      strength: 'weak'
    };
  }

  /**
   * Determine overall emotional state
   */
  determineEmotionalState(captures) {
    // Aggregate emotional signals
    const emotions = captures
      .filter(c => c.emotion || c.emotionalState)
      .map(c => c.emotion || c.emotionalState);
    
    if (emotions.length === 0) return 'neutral';
    
    // Find most common emotion
    const emotionCounts = {};
    emotions.forEach(e => {
      emotionCounts[e] = (emotionCounts[e] || 0) + 1;
    });
    
    return Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])[0][0];
  }

  /**
   * Calculate consent strength
   */
  calculateConsentStrength(captures, emotionalState) {
    let strength = 0;
    
    // Base strength on confidence levels
    const avgConfidence = captures.reduce((sum, c) => sum + (c.confidence || 0.5), 0) / captures.length;
    strength = avgConfidence;
    
    // Adjust for emotional state
    const emotionalModifiers = {
      'enthusiastic': 1.2,
      'positive': 1.1,
      'calm': 1.0,
      'neutral': 0.9,
      'uncertain': 0.7,
      'negative': 0.5
    };
    
    strength *= emotionalModifiers[emotionalState] || 1.0;
    
    // Cap between 0 and 1
    return Math.max(0, Math.min(1, strength));
  }

  /**
   * Start pattern analysis loop
   */
  startPatternAnalysis() {
    setInterval(() => {
      this.analyzeSessionPatterns();
    }, 30000); // Every 30 seconds
  }

  /**
   * Analyze patterns in session history
   */
  analyzeSessionPatterns() {
    if (this.sessionHistory.length < 5) return;
    
    // Look for patterns in recent history
    const recentHistory = this.sessionHistory.slice(-10);
    
    // Detect user preference patterns
    const patterns = {
      quickDecider: this.detectQuickDeciderPattern(recentHistory),
      thoughtfulUser: this.detectThoughtfulPattern(recentHistory),
      emotionalResponder: this.detectEmotionalPattern(recentHistory)
    };
    
    // Store detected patterns
    Object.entries(patterns).forEach(([type, detected]) => {
      if (detected) {
        this.patternMemory.set(type, {
          detected: true,
          timestamp: Date.now(),
          confidence: detected.confidence
        });
      }
    });
    
    // Emit pattern insights
    this.emit('patterns:detected', {
      patterns: Object.keys(patterns).filter(p => patterns[p]),
      insights: this.generatePatternInsights(patterns)
    });
  }

  /**
   * Helper functions
   */
  calculateAveragePressure(readings) {
    return readings.reduce((sum, r) => sum + r.pressure, 0) / readings.length;
  }

  calculateAverageTime(times) {
    return times.reduce((sum, t) => sum + t, 0) / times.length;
  }

  calculateVariance(values, mean) {
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b) / values.length);
  }

  detectTimingTrend(times) {
    if (times.length < 3) return 'stable';
    
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < times.length; i++) {
      if (times[i] > times[i-1]) increasing++;
      else if (times[i] < times[i-1]) decreasing++;
    }
    
    if (increasing > decreasing * 1.5) return 'slowing';
    if (decreasing > increasing * 1.5) return 'quickening';
    return 'stable';
  }

  patternsMatch(signature, pattern) {
    // Simple pattern matching
    return signature === pattern.join('-');
  }

  detectQuickDeciderPattern(history) {
    const quickDecisions = history.filter(h => 
      h.captures.some(c => c.averageResponseTime && c.averageResponseTime < 1000)
    );
    
    return quickDecisions.length > history.length * 0.7 ? 
      { detected: true, confidence: 0.8 } : null;
  }

  detectThoughtfulPattern(history) {
    const thoughtfulDecisions = history.filter(h => 
      h.captures.some(c => c.averageResponseTime && c.averageResponseTime > 3000)
    );
    
    return thoughtfulDecisions.length > history.length * 0.6 ? 
      { detected: true, confidence: 0.75 } : null;
  }

  detectEmotionalPattern(history) {
    const emotionalStates = history.map(h => h.emotionalState);
    const uniqueStates = [...new Set(emotionalStates)];
    
    return uniqueStates.length > 3 ? 
      { detected: true, confidence: 0.7 } : null;
  }

  generatePatternInsights(patterns) {
    const insights = [];
    
    if (patterns.quickDecider) {
      insights.push('User makes quick, instinctive decisions');
    }
    if (patterns.thoughtfulUser) {
      insights.push('User prefers deliberate consideration');
    }
    if (patterns.emotionalResponder) {
      insights.push('User shows varied emotional responses');
    }
    
    return insights;
  }

  generateCaptureId() {
    return `bio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = BiometricToneHandler;