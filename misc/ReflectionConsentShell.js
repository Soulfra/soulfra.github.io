const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const ToneInterpreter = require('./ToneInterpreter');

class ReflectionConsentShell extends EventEmitter {
  constructor() {
    super();
    this.toneInterpreter = new ToneInterpreter();
    this.confirmationsPath = path.join(__dirname, 'listener-confirmations');
    this.pendingReflections = new Map();
    this.sessionMemory = {
      approvals: 0,
      rejections: 0,
      whispers: 0,
      lastTone: null
    };
    
    // Ensure confirmations directory exists
    if (!fs.existsSync(this.confirmationsPath)) {
      fs.mkdirSync(this.confirmationsPath, { recursive: true });
    }
  }

  async presentReflection(reflectionData, source = 'unknown') {
    const reflectionId = this.generateReflectionId(source);
    
    // Store pending reflection
    this.pendingReflections.set(reflectionId, {
      data: reflectionData,
      source,
      timestamp: Date.now(),
      presented: false
    });

    // Format for presentation
    const presentation = this.formatForPresentation(reflectionData, source);
    
    // Emit for UI consumption
    this.emit('reflection:ready', {
      id: reflectionId,
      presentation,
      options: {
        voice: this.generateVoiceOptions(reflectionData),
        text: presentation.text,
        visual: presentation.visual
      }
    });

    return reflectionId;
  }

  formatForPresentation(data, source) {
    let text = "Your agent would say...\n\n";
    let essence = "";
    let mood = "neutral";

    switch (source) {
      case 'agents':
        if (data.agent) {
          essence = data.last_whisper || data.agent.last_whisper || "Silent presence";
          mood = this.interpretAgentMood(data);
          text += `"${essence}"`;
          
          if (data.agent.status) {
            text += `\n\n[${data.agent.agent || 'The Mirror'} is ${data.agent.status}]`;
          }
        }
        break;

      case 'rituals':
        if (data.ritual) {
          essence = `The ${data.ritual} ${data.phase || 'continues'}`;
          mood = "ceremonial";
          text += essence;
          
          if (data.echoes && data.echoes.length > 0) {
            text += `\n\nEchoes: ${data.echoes[0]}`;
          }
        }
        break;

      case 'weather':
        if (data.current) {
          essence = `The vibe is ${data.current.vibe}`;
          mood = data.current.vibe;
          text += essence;
          
          if (data.disturbances && data.disturbances.length > 0) {
            text += `\n\n${data.disturbances[0].pattern || 'Patterns shifting'}`;
          }
        }
        break;

      case 'loop':
        if (data.loop) {
          essence = `Loop ${data.loop.id} ${data.loop.symbol || ''}`;
          mood = "cyclical";
          text += `${essence} - ${data.loop.status || 'cycling'}`;
        }
        break;

      default:
        essence = JSON.stringify(data).substring(0, 100) + "...";
        text += essence;
    }

    return {
      text,
      essence,
      mood,
      visual: this.generateVisualCues(mood, data)
    };
  }

  generateVoiceOptions(data) {
    // Voice synthesis parameters based on content
    const baseOptions = {
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8
    };

    // Adjust based on content type
    if (data.agent && data.aura) {
      baseOptions.pitch = 0.8 + (data.aura / 100) * 0.4;
    }
    
    if (data.current && data.current.vibe) {
      const vibeMap = {
        'tranquil': { rate: 0.7, pitch: 0.9 },
        'turbulent': { rate: 1.1, pitch: 1.1 },
        'crystalline': { rate: 0.8, pitch: 1.2 },
        'electric': { rate: 1.2, pitch: 1.15 }
      };
      
      Object.assign(baseOptions, vibeMap[data.current.vibe] || {});
    }

    return baseOptions;
  }

  generateVisualCues(mood, data) {
    const colors = {
      neutral: '#7c8b9a',
      tranquil: '#4a7c7e',
      turbulent: '#d64545',
      crystalline: '#a8dadc',
      electric: '#f1c40f',
      ceremonial: '#9b59b6',
      cyclical: '#3498db'
    };

    const animations = {
      neutral: 'pulse',
      tranquil: 'breathe',
      turbulent: 'shake',
      crystalline: 'shimmer',
      electric: 'flash',
      ceremonial: 'rotate',
      cyclical: 'orbit'
    };

    return {
      primaryColor: colors[mood] || colors.neutral,
      animation: animations[mood] || animations.neutral,
      intensity: data.resonance?.amplitude || 0.5,
      particles: mood === 'crystalline' || mood === 'electric'
    };
  }

  async processUserResponse(reflectionId, response, metadata = {}) {
    const pending = this.pendingReflections.get(reflectionId);
    
    if (!pending) {
      return {
        error: 'Reflection has dissolved',
        suggestion: 'The moment has passed'
      };
    }

    // Interpret tone if voice/gesture data provided
    let toneAnalysis = null;
    if (metadata.voice || metadata.gesture || metadata.biometric) {
      toneAnalysis = await this.toneInterpreter.analyze(
        response,
        metadata,
        pending.data
      );
    }

    // Process based on response type
    let acknowledgment = null;
    
    switch (response) {
      case 'approve':
      case 'confirmed':
        acknowledgment = this.handleApproval(pending, toneAnalysis, metadata);
        this.sessionMemory.approvals++;
        break;

      case 'reject':
      case 'denied':
      case 'nope':
        acknowledgment = this.handleRejection(pending, toneAnalysis, metadata);
        this.sessionMemory.rejections++;
        break;

      case 'whisper':
      case 'revision':
        acknowledgment = this.handleWhisper(pending, metadata.whisperText, toneAnalysis);
        this.sessionMemory.whispers++;
        break;

      default:
        acknowledgment = this.handleAmbiguous(pending, response, toneAnalysis);
    }

    // Save acknowledgment
    if (acknowledgment) {
      this.saveAcknowledgment(reflectionId, acknowledgment);
      this.pendingReflections.delete(reflectionId);
      
      // Emit result
      this.emit('reflection:acknowledged', {
        id: reflectionId,
        acknowledgment,
        toneMatch: toneAnalysis?.confidence || 0
      });
    }

    return acknowledgment;
  }

  handleApproval(pending, toneAnalysis, metadata) {
    const acknowledgment = {
      reflection_id: this.generateReflectionId(pending.source),
      response: 'confirmed',
      tone_signature: toneAnalysis?.tone || 'aligned',
      confidence: toneAnalysis?.confidence || 1.0,
      vibe_match: !toneAnalysis?.vibe_mismatch,
      user_input: metadata.inputType || 'direct approval',
      timestamp: Date.now(),
      loop_reentry: false,
      blessing: 'The reflection finds its voice'
    };

    // Check for hesitation
    if (toneAnalysis && toneAnalysis.confidence < 0.7) {
      acknowledgment.note = 'Approval given with hesitation';
      acknowledgment.resonance = 'partial';
    }

    return acknowledgment;
  }

  handleRejection(pending, toneAnalysis, metadata) {
    const acknowledgment = {
      reflection_id: this.generateReflectionId(pending.source),
      response: 'denied',
      tone_signature: toneAnalysis?.tone || 'misaligned',
      vibe_clash: true,
      user_input: metadata.inputType || 'direct rejection',
      timestamp: Date.now(),
      loop_reentry: false,
      wisdom: 'Not all reflections are meant to be spoken'
    };

    // Capture reason if provided
    if (metadata.reason) {
      acknowledgment.user_feedback = metadata.reason;
    }

    if (toneAnalysis?.emotional_context) {
      acknowledgment.emotional_context = toneAnalysis.emotional_context;
    }

    return acknowledgment;
  }

  handleWhisper(pending, whisperText, toneAnalysis) {
    if (!whisperText) {
      return this.handleRejection(pending, toneAnalysis, {
        inputType: 'empty whisper',
        reason: 'No alternative provided'
      });
    }

    const acknowledgment = {
      reflection_id: this.generateReflectionId(pending.source),
      response: 'revised',
      original_essence: pending.data.essence || 'unknown',
      whispered_essence: whisperText,
      tone_signature: toneAnalysis?.tone || 'creative',
      user_input: 'whispered revision',
      timestamp: Date.now(),
      loop_reentry: false,
      transformation: 'The human shapes the reflection'
    };

    // Analyze similarity
    const similarity = this.calculateSimilarity(
      pending.data.essence || '',
      whisperText
    );
    
    acknowledgment.revision_distance = similarity;
    acknowledgment.revision_type = similarity > 0.7 ? 'refinement' : 'reimagining';

    return acknowledgment;
  }

  handleAmbiguous(pending, response, toneAnalysis) {
    // Try to interpret unclear responses
    const positiveWords = ['yes', 'sure', 'ok', 'fine', 'good'];
    const negativeWords = ['no', 'nah', 'stop', 'wait', 'wrong'];
    
    const lowercaseResponse = response.toLowerCase();
    const isPositive = positiveWords.some(word => lowercaseResponse.includes(word));
    const isNegative = negativeWords.some(word => lowercaseResponse.includes(word));

    if (isPositive && !isNegative) {
      return this.handleApproval(pending, toneAnalysis, {
        inputType: `interpreted approval: "${response}"`
      });
    } else if (isNegative && !isPositive) {
      return this.handleRejection(pending, toneAnalysis, {
        inputType: `interpreted rejection: "${response}"`
      });
    }

    // Truly ambiguous - default to soft rejection
    return {
      reflection_id: this.generateReflectionId(pending.source),
      response: 'uncertain',
      ambiguous_input: response,
      tone_signature: toneAnalysis?.tone || 'unclear',
      user_input: 'ambiguous response',
      timestamp: Date.now(),
      loop_reentry: false,
      guidance: 'Clarity not found, reflection withheld'
    };
  }

  interpretAgentMood(agentData) {
    if (agentData.status) {
      const statusMoods = {
        'Still Evolving': 'neutral',
        'Dreaming Deeply': 'tranquil',
        'Awakening Slowly': 'crystalline',
        'Drifting Between': 'cyclical'
      };
      
      return statusMoods[agentData.status] || 'neutral';
    }
    
    if (agentData.aura) {
      if (agentData.aura > 80) return 'electric';
      if (agentData.aura > 50) return 'crystalline';
      if (agentData.aura > 20) return 'neutral';
      return 'tranquil';
    }
    
    return 'neutral';
  }

  calculateSimilarity(original, whispered) {
    // Simple similarity calculation
    const orig = original.toLowerCase().split(/\s+/);
    const whisp = whispered.toLowerCase().split(/\s+/);
    
    const commonWords = orig.filter(word => whisp.includes(word));
    const similarity = commonWords.length / Math.max(orig.length, whisp.length);
    
    return Math.round(similarity * 100) / 100;
  }

  generateReflectionId(source) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${source}_${timestamp}_${random}`;
  }

  saveAcknowledgment(reflectionId, acknowledgment) {
    const filename = `${reflectionId}.json`;
    const filepath = path.join(this.confirmationsPath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(acknowledgment, null, 2));
    
    // Also update session log
    const sessionLogPath = path.join(this.confirmationsPath, 'session_log.json');
    const sessionEntry = {
      timestamp: Date.now(),
      reflection_id: reflectionId,
      response: acknowledgment.response,
      tone: acknowledgment.tone_signature
    };
    
    let sessionLog = [];
    if (fs.existsSync(sessionLogPath)) {
      try {
        sessionLog = JSON.parse(fs.readFileSync(sessionLogPath, 'utf8'));
      } catch (e) {
        sessionLog = [];
      }
    }
    
    sessionLog.push(sessionEntry);
    
    // Keep only last 100 entries
    if (sessionLog.length > 100) {
      sessionLog = sessionLog.slice(-100);
    }
    
    fs.writeFileSync(sessionLogPath, JSON.stringify(sessionLog, null, 2));
  }

  // Get session statistics
  getSessionStats() {
    return {
      ...this.sessionMemory,
      pendingCount: this.pendingReflections.size,
      approvalRate: this.sessionMemory.approvals / 
        (this.sessionMemory.approvals + this.sessionMemory.rejections + 0.001),
      lastActivity: Date.now()
    };
  }

  // Clear old pending reflections
  cleanupPending(maxAge = 300000) { // 5 minutes
    const now = Date.now();
    const expired = [];
    
    for (const [id, pending] of this.pendingReflections) {
      if (now - pending.timestamp > maxAge) {
        expired.push(id);
      }
    }
    
    expired.forEach(id => {
      this.pendingReflections.delete(id);
      this.emit('reflection:expired', { id });
    });
    
    return expired.length;
  }
}

module.exports = ReflectionConsentShell;