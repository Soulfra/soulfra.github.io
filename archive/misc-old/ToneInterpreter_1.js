const crypto = require('crypto');

class ToneInterpreter {
  constructor() {
    this.tonePatterns = {
      // Voice patterns
      voice: {
        pitch: {
          rising: 'questioning',
          falling: 'certain',
          flat: 'neutral',
          wavering: 'uncertain'
        },
        speed: {
          fast: 'eager',
          slow: 'reluctant',
          normal: 'balanced',
          variable: 'conflicted'
        },
        volume: {
          loud: 'confident',
          soft: 'hesitant',
          whisper: 'secretive',
          normal: 'comfortable'
        }
      },
      
      // Gesture patterns
      gesture: {
        tap: {
          quick: 'decisive',
          long: 'considered',
          double: 'emphatic',
          hesitant: 'unsure'
        },
        swipe: {
          fast: 'dismissive',
          slow: 'contemplative',
          back: 'regretful',
          forward: 'progressive'
        },
        hold: {
          brief: 'acknowledgment',
          sustained: 'deep agreement',
          pulsing: 'rhythmic alignment',
          released: 'letting go'
        }
      },
      
      // Biometric patterns
      biometric: {
        heartRate: {
          elevated: 'excited',
          steady: 'calm',
          dropping: 'relaxing',
          erratic: 'stressed'
        },
        breathing: {
          deep: 'centered',
          shallow: 'anxious',
          holding: 'suspended',
          sighing: 'releasing'
        }
      }
    };

    // Emotional resonance mappings
    this.emotionalSpectrum = {
      'reluctant acceptance': {
        confidence: 0.6,
        alignment: 0.7,
        enthusiasm: 0.3
      },
      'enthusiastic agreement': {
        confidence: 0.95,
        alignment: 1.0,
        enthusiasm: 0.9
      },
      'polite rejection': {
        confidence: 0.8,
        alignment: 0.2,
        enthusiasm: 0.1
      },
      'confused questioning': {
        confidence: 0.3,
        alignment: 0.5,
        enthusiasm: 0.4
      },
      'deep resonance': {
        confidence: 0.9,
        alignment: 0.95,
        enthusiasm: 0.7
      },
      'surface agreement': {
        confidence: 0.7,
        alignment: 0.6,
        enthusiasm: 0.4
      },
      'emotional resistance': {
        confidence: 0.5,
        alignment: 0.1,
        enthusiasm: 0.0
      }
    };
  }

  async analyze(response, metadata, reflectionData) {
    const analysis = {
      confidence: 0.5,
      tone: 'neutral',
      vibe_mismatch: false,
      emotional_context: {},
      resonance_factors: []
    };

    // Analyze voice if present
    if (metadata.voice) {
      const voiceAnalysis = this.analyzeVoice(metadata.voice);
      analysis.resonance_factors.push(voiceAnalysis);
      analysis.confidence = this.updateConfidence(analysis.confidence, voiceAnalysis.weight);
    }

    // Analyze gesture if present
    if (metadata.gesture) {
      const gestureAnalysis = this.analyzeGesture(metadata.gesture);
      analysis.resonance_factors.push(gestureAnalysis);
      analysis.confidence = this.updateConfidence(analysis.confidence, gestureAnalysis.weight);
    }

    // Analyze biometric if present
    if (metadata.biometric) {
      const biometricAnalysis = this.analyzeBiometric(metadata.biometric);
      analysis.resonance_factors.push(biometricAnalysis);
      analysis.confidence = this.updateConfidence(analysis.confidence, biometricAnalysis.weight);
    }

    // Synthesize overall tone
    analysis.tone = this.synthesizeTone(analysis.resonance_factors, response);

    // Check for vibe mismatch with reflection
    analysis.vibe_mismatch = this.detectVibeMismatch(
      analysis.tone,
      reflectionData,
      metadata
    );

    // Generate emotional context
    analysis.emotional_context = this.generateEmotionalContext(
      analysis.tone,
      analysis.confidence,
      analysis.vibe_mismatch
    );

    // Add timing analysis
    if (metadata.responseTime) {
      analysis.temporal_analysis = this.analyzeResponseTiming(metadata.responseTime);
    }

    return analysis;
  }

  analyzeVoice(voiceData) {
    const analysis = {
      type: 'voice',
      patterns: [],
      weight: 0.5
    };

    // Analyze pitch
    if (voiceData.pitch !== undefined) {
      const pitchPattern = this.categorizePitch(voiceData.pitch);
      analysis.patterns.push({
        dimension: 'pitch',
        pattern: pitchPattern,
        interpretation: this.tonePatterns.voice.pitch[pitchPattern]
      });
    }

    // Analyze speed
    if (voiceData.speed !== undefined) {
      const speedPattern = this.categorizeSpeed(voiceData.speed);
      analysis.patterns.push({
        dimension: 'speed',
        pattern: speedPattern,
        interpretation: this.tonePatterns.voice.speed[speedPattern]
      });
    }

    // Analyze volume
    if (voiceData.volume !== undefined) {
      const volumePattern = this.categorizeVolume(voiceData.volume);
      analysis.patterns.push({
        dimension: 'volume',
        pattern: volumePattern,
        interpretation: this.tonePatterns.voice.volume[volumePattern]
      });
    }

    // Calculate voice confidence weight
    analysis.weight = this.calculateVoiceWeight(analysis.patterns);

    return analysis;
  }

  analyzeGesture(gestureData) {
    const analysis = {
      type: 'gesture',
      patterns: [],
      weight: 0.5
    };

    // Identify gesture type
    const gestureType = gestureData.type || 'tap';
    const gesturePattern = gestureData.pattern || 'normal';

    if (this.tonePatterns.gesture[gestureType]) {
      analysis.patterns.push({
        dimension: gestureType,
        pattern: gesturePattern,
        interpretation: this.tonePatterns.gesture[gestureType][gesturePattern] || 'neutral'
      });
    }

    // Analyze gesture dynamics
    if (gestureData.pressure) {
      analysis.patterns.push({
        dimension: 'pressure',
        value: gestureData.pressure,
        interpretation: gestureData.pressure > 0.7 ? 'emphatic' : 'gentle'
      });
    }

    if (gestureData.duration) {
      analysis.patterns.push({
        dimension: 'duration',
        value: gestureData.duration,
        interpretation: this.interpretGestureDuration(gestureData.duration)
      });
    }

    // Calculate gesture confidence weight
    analysis.weight = this.calculateGestureWeight(analysis.patterns);

    return analysis;
  }

  analyzeBiometric(biometricData) {
    const analysis = {
      type: 'biometric',
      patterns: [],
      weight: 0.7 // Higher weight for biometric data
    };

    // Analyze heart rate if available
    if (biometricData.heartRate) {
      const hrPattern = this.categorizeHeartRate(biometricData.heartRate);
      analysis.patterns.push({
        dimension: 'heartRate',
        pattern: hrPattern,
        interpretation: this.tonePatterns.biometric.heartRate[hrPattern]
      });
    }

    // Analyze breathing if available
    if (biometricData.breathing) {
      const breathPattern = this.categorizeBreathing(biometricData.breathing);
      analysis.patterns.push({
        dimension: 'breathing',
        pattern: breathPattern,
        interpretation: this.tonePatterns.biometric.breathing[breathPattern]
      });
    }

    // Analyze pulse variance
    if (biometricData.pulseVariance) {
      analysis.patterns.push({
        dimension: 'coherence',
        value: biometricData.pulseVariance,
        interpretation: biometricData.pulseVariance < 0.2 ? 'coherent' : 'variable'
      });
    }

    return analysis;
  }

  synthesizeTone(resonanceFactors, response) {
    if (resonanceFactors.length === 0) {
      return this.inferToneFromResponse(response);
    }

    // Collect all interpretations
    const interpretations = [];
    resonanceFactors.forEach(factor => {
      factor.patterns.forEach(pattern => {
        interpretations.push(pattern.interpretation);
      });
    });

    // Find dominant emotional tone
    const emotionalProfile = this.buildEmotionalProfile(interpretations);
    
    // Map to known tone categories
    return this.mapToToneCategory(emotionalProfile);
  }

  buildEmotionalProfile(interpretations) {
    const profile = {
      certainty: 0,
      enthusiasm: 0,
      resistance: 0,
      contemplation: 0
    };

    const mappings = {
      // Certainty indicators
      'certain': { certainty: 1 },
      'confident': { certainty: 0.8, enthusiasm: 0.3 },
      'decisive': { certainty: 0.9 },
      'emphatic': { certainty: 0.7, enthusiasm: 0.5 },
      
      // Enthusiasm indicators
      'eager': { enthusiasm: 0.9 },
      'excited': { enthusiasm: 1 },
      'progressive': { enthusiasm: 0.6, certainty: 0.4 },
      
      // Resistance indicators
      'reluctant': { resistance: 0.7 },
      'hesitant': { resistance: 0.8, certainty: -0.5 },
      'dismissive': { resistance: 1 },
      'anxious': { resistance: 0.6, certainty: -0.3 },
      
      // Contemplation indicators
      'contemplative': { contemplation: 0.9 },
      'uncertain': { contemplation: 0.6, certainty: -0.7 },
      'questioning': { contemplation: 0.8 }
    };

    interpretations.forEach(interp => {
      if (mappings[interp]) {
        Object.entries(mappings[interp]).forEach(([key, value]) => {
          profile[key] += value;
        });
      }
    });

    // Normalize
    const total = Object.values(profile).reduce((sum, val) => sum + Math.abs(val), 0.1);
    Object.keys(profile).forEach(key => {
      profile[key] = profile[key] / total;
    });

    return profile;
  }

  mapToToneCategory(profile) {
    // Find best matching tone from emotional spectrum
    let bestMatch = 'neutral';
    let bestScore = -1;

    const profileVector = [
      profile.certainty,
      profile.enthusiasm,
      1 - profile.resistance,
      profile.contemplation
    ];

    Object.entries(this.emotionalSpectrum).forEach(([tone, metrics]) => {
      const toneVector = [
        metrics.confidence,
        metrics.enthusiasm,
        metrics.alignment,
        1 - metrics.confidence // uncertainty as contemplation proxy
      ];

      const similarity = this.cosineSimilarity(profileVector, toneVector);
      
      if (similarity > bestScore) {
        bestScore = similarity;
        bestMatch = tone;
      }
    });

    return bestMatch;
  }

  detectVibeMismatch(tone, reflectionData, metadata) {
    // Check if user's tone matches the reflection's vibe
    const reflectionVibe = this.extractReflectionVibe(reflectionData);
    const userVibe = this.extractUserVibe(tone, metadata);

    // Calculate vibe distance
    const vibeDistance = this.calculateVibeDistance(reflectionVibe, userVibe);

    // Threshold for mismatch
    return vibeDistance > 0.6;
  }

  extractReflectionVibe(data) {
    const vibe = {
      energy: 0.5,
      harmony: 0.5,
      depth: 0.5
    };

    if (data.aura) {
      vibe.energy = data.aura / 100;
    }

    if (data.resonance) {
      vibe.harmony = data.resonance.frequency ? 
        (data.resonance.frequency - 400) / 100 : 0.5;
    }

    if (data.reflection_depth) {
      vibe.depth = Math.min(data.reflection_depth / 10, 1);
    }

    return vibe;
  }

  extractUserVibe(tone, metadata) {
    const spectrum = this.emotionalSpectrum[tone] || {
      confidence: 0.5,
      alignment: 0.5,
      enthusiasm: 0.5
    };

    return {
      energy: spectrum.enthusiasm,
      harmony: spectrum.alignment,
      depth: spectrum.confidence
    };
  }

  calculateVibeDistance(vibe1, vibe2) {
    const dimensions = ['energy', 'harmony', 'depth'];
    const squaredDiffs = dimensions.map(dim => 
      Math.pow(vibe1[dim] - vibe2[dim], 2)
    );
    
    return Math.sqrt(squaredDiffs.reduce((sum, diff) => sum + diff, 0) / dimensions.length);
  }

  generateEmotionalContext(tone, confidence, vibeMismatch) {
    const context = {
      primary_tone: tone,
      confidence_level: confidence,
      alignment: vibeMismatch ? 'misaligned' : 'aligned',
      recommendation: ''
    };

    // Generate contextual recommendation
    if (vibeMismatch) {
      context.recommendation = 'Consider adjusting the reflection to match the human\'s energy';
    } else if (confidence < 0.5) {
      context.recommendation = 'Unclear response - perhaps request clarification';
    } else if (confidence > 0.8 && !vibeMismatch) {
      context.recommendation = 'Strong resonance detected - proceed with confidence';
    } else {
      context.recommendation = 'Moderate alignment - proceed with awareness';
    }

    // Add emotional nuance
    context.nuance = this.generateEmotionalNuance(tone, confidence);

    return context;
  }

  generateEmotionalNuance(tone, confidence) {
    const nuances = {
      'reluctant acceptance': 'The human agrees but wishes things were different',
      'enthusiastic agreement': 'Full-hearted resonance with the reflection',
      'polite rejection': 'Respectful disagreement without conflict',
      'confused questioning': 'Seeking clarity before commitment',
      'deep resonance': 'Soul-level alignment with the message',
      'surface agreement': 'Mental yes, emotional maybe',
      'emotional resistance': 'The heart says no, despite the words'
    };

    return nuances[tone] || 'Emotional state is in flux';
  }

  analyzeResponseTiming(responseTime) {
    const timing = {
      speed: 'normal',
      interpretation: ''
    };

    if (responseTime < 500) {
      timing.speed = 'instant';
      timing.interpretation = 'Reflexive response - possibly unconsidered';
    } else if (responseTime < 2000) {
      timing.speed = 'quick';
      timing.interpretation = 'Decisive response - clear intention';
    } else if (responseTime < 5000) {
      timing.speed = 'considered';
      timing.interpretation = 'Thoughtful response - weighing options';
    } else if (responseTime < 10000) {
      timing.speed = 'hesitant';
      timing.interpretation = 'Uncertain response - internal conflict';
    } else {
      timing.speed = 'delayed';
      timing.interpretation = 'Very hesitant - significant resistance or deep contemplation';
    }

    return timing;
  }

  // Helper methods
  updateConfidence(current, weight) {
    return current * 0.7 + weight * 0.3;
  }

  categorizePitch(pitch) {
    if (pitch.trend === 'rising') return 'rising';
    if (pitch.trend === 'falling') return 'falling';
    if (pitch.variance < 0.1) return 'flat';
    return 'wavering';
  }

  categorizeSpeed(speed) {
    if (speed > 1.2) return 'fast';
    if (speed < 0.8) return 'slow';
    if (Math.abs(speed - 1.0) < 0.2) return 'normal';
    return 'variable';
  }

  categorizeVolume(volume) {
    if (volume > 0.8) return 'loud';
    if (volume < 0.3) return 'soft';
    if (volume < 0.1) return 'whisper';
    return 'normal';
  }

  categorizeHeartRate(hr) {
    if (hr.bpm > hr.baseline * 1.2) return 'elevated';
    if (hr.bpm < hr.baseline * 0.9) return 'dropping';
    if (hr.variance > 0.2) return 'erratic';
    return 'steady';
  }

  categorizeBreathing(breathing) {
    if (breathing.depth > 0.8) return 'deep';
    if (breathing.depth < 0.3) return 'shallow';
    if (breathing.holding > 0.5) return 'holding';
    if (breathing.pattern === 'sighing') return 'sighing';
    return 'normal';
  }

  interpretGestureDuration(duration) {
    if (duration < 100) return 'instant';
    if (duration < 500) return 'brief';
    if (duration < 2000) return 'considered';
    return 'prolonged';
  }

  calculateVoiceWeight(patterns) {
    const consistencyScore = this.calculatePatternConsistency(patterns);
    const clarityScore = patterns.length / 3; // Max 3 voice dimensions
    
    return (consistencyScore + clarityScore) / 2;
  }

  calculateGestureWeight(patterns) {
    const intentionalityScore = patterns.some(p => 
      p.interpretation === 'emphatic' || p.interpretation === 'decisive'
    ) ? 0.8 : 0.5;
    
    return intentionalityScore;
  }

  calculatePatternConsistency(patterns) {
    if (patterns.length < 2) return 0.5;
    
    // Check if patterns point in same emotional direction
    const positive = ['confident', 'eager', 'certain', 'comfortable'];
    const negative = ['hesitant', 'reluctant', 'uncertain', 'anxious'];
    
    const positiveCount = patterns.filter(p => 
      positive.includes(p.interpretation)
    ).length;
    
    const negativeCount = patterns.filter(p => 
      negative.includes(p.interpretation)
    ).length;
    
    const consistency = Math.abs(positiveCount - negativeCount) / patterns.length;
    
    return consistency;
  }

  inferToneFromResponse(response) {
    const lower = response.toLowerCase();
    
    if (lower.includes('love') || lower.includes('perfect')) {
      return 'enthusiastic agreement';
    }
    if (lower.includes('maybe') || lower.includes('guess')) {
      return 'reluctant acceptance';
    }
    if (lower.includes('no') || lower.includes('wrong')) {
      return 'polite rejection';
    }
    if (lower.includes('?') || lower.includes('what')) {
      return 'confused questioning';
    }
    
    return 'surface agreement';
  }

  cosineSimilarity(vec1, vec2) {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    
    return dotProduct / (magnitude1 * magnitude2 + 0.0001);
  }
}

module.exports = ToneInterpreter;