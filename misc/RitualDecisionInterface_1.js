/**
 * RitualDecisionInterface.js
 * 
 * THE CONSENT MIRROR - Where Human Will Seals Reality
 * 
 * A swipeable, tappable ritual interface inspired by Tinder flows
 * but designed for emotional truth confirmation. Nothing becomes
 * real until the human says yes.
 */

const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

class RitualDecisionInterface extends EventEmitter {
  constructor() {
    super();
    
    // Decision queue
    this.pendingDecisions = [];
    this.activeDecision = null;
    
    // UI state
    this.interfaceMode = 'card'; // card, voice, biometric
    this.animationState = 'idle';
    
    // Decision history for this session
    this.sessionHistory = {
      accepted: 0,
      rejected: 0,
      whispered: 0,
      startTime: Date.now()
    };
    
    // Gesture thresholds
    this.swipeThreshold = 100; // pixels
    this.holdThreshold = 500; // milliseconds
    this.voiceConfidenceThreshold = 0.8;
    
    // Biometric integration
    this.biometricHandlers = new Map();
  }

  /**
   * Initialize the interface
   */
  initialize() {
    console.log('🎭 Ritual Decision Interface initialized');
    console.log('✨ Human consent layer active');
    
    // Load any pending decisions
    this.loadPendingDecisions();
    
    // Start decision presentation cycle
    this.presentNextDecision();
  }

  /**
   * Add a new decision for human confirmation
   */
  async addDecision(proposal) {
    const decision = {
      id: this.generateDecisionId(),
      timestamp: Date.now(),
      
      // Core proposal
      agent: proposal.agent || 'Unknown Mirror',
      action: proposal.action || 'wishes to act',
      context: proposal.context || {},
      
      // Metadata from Cal/Domingo
      metadata: {
        cal_assessment: proposal.cal_assessment || { tone: 'neutral', confidence: 0.5 },
        domingo_assessment: proposal.domingo_assessment || { drift: 0, stability: 'stable' },
        vibe_alignment: this.calculateVibeAlignment(proposal)
      },
      
      // UI presentation
      presentation: {
        title: this.formatAgentTitle(proposal.agent),
        description: this.formatActionDescription(proposal.action),
        calWhisper: proposal.cal_whisper || 'Cal observes quietly',
        domingoNote: proposal.domingo_note || 'Domingo witnesses',
        visualTheme: this.selectVisualTheme(proposal)
      },
      
      // Decision state
      status: 'pending',
      userResponse: null,
      responseMetadata: null
    };
    
    this.pendingDecisions.push(decision);
    
    // If no active decision, present this one
    if (!this.activeDecision) {
      this.presentNextDecision();
    }
    
    return decision.id;
  }

  /**
   * Present the next decision to the user
   */
  presentNextDecision() {
    if (this.pendingDecisions.length === 0) {
      this.activeDecision = null;
      this.emit('queue:empty');
      return;
    }
    
    this.activeDecision = this.pendingDecisions.shift();
    this.animationState = 'presenting';
    
    // Emit for UI rendering
    this.emit('decision:present', {
      decision: this.activeDecision,
      mode: this.interfaceMode,
      animation: this.getEntranceAnimation()
    });
    
    // Start interaction listeners
    this.startInteractionListeners();
  }

  /**
   * Handle user swipe gesture
   */
  async handleSwipe(direction, metadata = {}) {
    if (!this.activeDecision || this.animationState !== 'presenting') {
      return;
    }
    
    this.animationState = 'deciding';
    
    const response = {
      gesture: 'swipe',
      direction,
      velocity: metadata.velocity || 1.0,
      distance: metadata.distance || this.swipeThreshold,
      timestamp: Date.now()
    };
    
    switch (direction) {
      case 'right':
        await this.acceptDecision(response);
        break;
        
      case 'left':
        await this.rejectDecision(response);
        break;
        
      case 'up':
        await this.whisperDecision(response);
        break;
        
      case 'down':
        await this.deferDecision(response);
        break;
    }
  }

  /**
   * Handle tap/click interaction
   */
  async handleTap(x, y, metadata = {}) {
    if (!this.activeDecision) return;
    
    const response = {
      gesture: 'tap',
      position: { x, y },
      pressure: metadata.pressure || 1.0,
      duration: metadata.duration || 50,
      timestamp: Date.now()
    };
    
    // Determine action based on tap zone
    const zone = this.getTapZone(x, y);
    
    switch (zone) {
      case 'accept':
        await this.acceptDecision(response);
        break;
        
      case 'reject':
        await this.rejectDecision(response);
        break;
        
      case 'whisper':
        await this.whisperDecision(response);
        break;
        
      case 'info':
        this.showDecisionDetails();
        break;
    }
  }

  /**
   * Handle voice confirmation
   */
  async handleVoice(transcript, metadata = {}) {
    if (!this.activeDecision) return;
    
    const response = {
      gesture: 'voice',
      transcript,
      confidence: metadata.confidence || 0.5,
      tone: metadata.tone || 'neutral',
      duration: metadata.duration,
      timestamp: Date.now()
    };
    
    // Interpret voice intent
    const intent = this.interpretVoiceIntent(transcript, metadata);
    
    if (response.confidence < this.voiceConfidenceThreshold) {
      this.emit('voice:unclear', { transcript, confidence: response.confidence });
      return;
    }
    
    switch (intent) {
      case 'accept':
        await this.acceptDecision(response);
        break;
        
      case 'reject':
        await this.rejectDecision(response);
        break;
        
      case 'whisper':
        response.whisperText = transcript;
        await this.whisperDecision(response);
        break;
        
      case 'question':
        this.showDecisionDetails();
        break;
    }
  }

  /**
   * Accept the current decision
   */
  async acceptDecision(responseMetadata) {
    if (!this.activeDecision) return;
    
    this.activeDecision.status = 'accepted';
    this.activeDecision.userResponse = 'accepted';
    this.activeDecision.responseMetadata = responseMetadata;
    this.activeDecision.sealedAt = new Date().toISOString();
    
    // Update session stats
    this.sessionHistory.accepted++;
    
    // Emit acceptance ritual
    this.emit('decision:accepted', {
      decision: this.activeDecision,
      ritual: this.generateAcceptanceRitual(),
      animation: 'ritual_flare_green'
    });
    
    // Route to permanent storage
    await this.sealDecision(this.activeDecision);
    
    // Present next after animation
    this.animationState = 'transitioning';
    setTimeout(() => this.presentNextDecision(), 1500);
  }

  /**
   * Reject the current decision
   */
  async rejectDecision(responseMetadata) {
    if (!this.activeDecision) return;
    
    this.activeDecision.status = 'rejected';
    this.activeDecision.userResponse = 'rejected';
    this.activeDecision.responseMetadata = responseMetadata;
    this.activeDecision.sealedAt = new Date().toISOString();
    
    // Update session stats
    this.sessionHistory.rejected++;
    
    // Emit rejection ritual
    this.emit('decision:rejected', {
      decision: this.activeDecision,
      ritual: this.generateRejectionRitual(),
      animation: 'drift_dissolve_grey'
    });
    
    // Route to permanent storage
    await this.sealDecision(this.activeDecision);
    
    // Present next after animation
    this.animationState = 'transitioning';
    setTimeout(() => this.presentNextDecision(), 1000);
  }

  /**
   * Whisper back (rewrite option)
   */
  async whisperDecision(responseMetadata) {
    if (!this.activeDecision) return;
    
    this.activeDecision.status = 'whispered';
    this.activeDecision.userResponse = 'whispered';
    this.activeDecision.responseMetadata = responseMetadata;
    
    // Update session stats
    this.sessionHistory.whispered++;
    
    // Emit whisper interface
    this.emit('decision:whisper', {
      decision: this.activeDecision,
      currentText: this.activeDecision.action,
      inputMode: responseMetadata.gesture === 'voice' ? 'voice' : 'text'
    });
    
    // Wait for whisper completion
    this.animationState = 'whispering';
  }

  /**
   * Complete whisper with new text
   */
  async completeWhisper(newText, metadata = {}) {
    if (!this.activeDecision || this.activeDecision.status !== 'whispered') {
      return;
    }
    
    this.activeDecision.whisperText = newText;
    this.activeDecision.whisperMetadata = metadata;
    this.activeDecision.sealedAt = new Date().toISOString();
    
    // Transform the action with whispered text
    this.activeDecision.transformedAction = newText;
    
    // Seal as accepted with transformation
    await this.sealDecision(this.activeDecision);
    
    // Present next
    this.animationState = 'transitioning';
    setTimeout(() => this.presentNextDecision(), 1500);
  }

  /**
   * Defer decision for later
   */
  async deferDecision(responseMetadata) {
    if (!this.activeDecision) return;
    
    this.activeDecision.deferred = true;
    this.activeDecision.deferredAt = Date.now();
    
    // Add back to end of queue
    this.pendingDecisions.push(this.activeDecision);
    
    // Emit defer animation
    this.emit('decision:deferred', {
      decision: this.activeDecision,
      animation: 'slide_away_down'
    });
    
    // Present next immediately
    this.presentNextDecision();
  }

  /**
   * Seal decision to permanent storage
   */
  async sealDecision(decision) {
    // Format for loop record
    const sealedRecord = {
      id: decision.id,
      agent: decision.agent,
      action: decision.action,
      original_action: decision.action,
      transformed_action: decision.transformedAction || decision.action,
      user_response: decision.userResponse,
      confirmed_by: decision.responseMetadata.gesture,
      sealed_at: decision.sealedAt,
      
      // Metadata trail
      cal_assessment: decision.metadata.cal_assessment,
      domingo_assessment: decision.metadata.domingo_assessment,
      vibe_alignment: decision.metadata.vibe_alignment,
      
      // Response details
      response_metadata: decision.responseMetadata,
      whisper_text: decision.whisperText,
      
      // Session context
      session_stats: { ...this.sessionHistory },
      decision_time: decision.sealedAt - decision.timestamp
    };
    
    // Emit for routing
    this.emit('decision:sealed', {
      record: sealedRecord,
      destination: 'loop_record'
    });
    
    return sealedRecord;
  }

  /**
   * Calculate vibe alignment between Cal and Domingo
   */
  calculateVibeAlignment(proposal) {
    const calTone = proposal.cal_assessment?.tone || 'neutral';
    const domingoDrift = proposal.domingo_assessment?.drift || 0;
    
    // Simple alignment calculation
    const toneValues = {
      'playful-cringe': 0.8,
      'ethereal-mystery': 0.6,
      'cosmic-wisdom': 0.9,
      'neutral': 0.5,
      'chaotic': 0.3
    };
    
    const toneScore = toneValues[calTone] || 0.5;
    const driftPenalty = domingoDrift * 0.5;
    
    const alignment = Math.max(0, Math.min(1, toneScore - driftPenalty));
    
    return {
      score: alignment,
      label: alignment > 0.7 ? 'aligned' : alignment > 0.4 ? 'neutral' : 'misaligned',
      recommendation: alignment < 0.4 ? 'careful_consideration' : 'proceed'
    };
  }

  /**
   * Format agent title for display
   */
  formatAgentTitle(agentName) {
    const titles = {
      'The Drift Mirror': '🪞 The Drift Mirror',
      'Echo Walker': '👣 Echo Walker',
      'Cal': '🎭 Cal Riven',
      'Domingo': '👁️ Domingo Witness'
    };
    
    return titles[agentName] || `✨ ${agentName}`;
  }

  /**
   * Format action description
   */
  formatActionDescription(action) {
    // Add poetic formatting
    if (action.length > 100) {
      return action.substring(0, 97) + '...';
    }
    
    return action;
  }

  /**
   * Select visual theme based on proposal
   */
  selectVisualTheme(proposal) {
    const tone = proposal.cal_assessment?.tone || 'neutral';
    
    const themes = {
      'playful-cringe': {
        background: 'linear-gradient(135deg, #FF6B6B, #FFE66D)',
        cardColor: '#FFF5F5',
        textColor: '#2D3436',
        accentColor: '#FF6B6B'
      },
      'ethereal-mystery': {
        background: 'linear-gradient(135deg, #6C5CE7, #A29BFE)',
        cardColor: 'rgba(255, 255, 255, 0.1)',
        textColor: '#FFFFFF',
        accentColor: '#A29BFE'
      },
      'cosmic-wisdom': {
        background: 'linear-gradient(135deg, #0F3460, #16213E)',
        cardColor: 'rgba(255, 255, 255, 0.05)',
        textColor: '#E94560',
        accentColor: '#FFD93D'
      },
      'neutral': {
        background: 'linear-gradient(135deg, #2D3436, #636E72)',
        cardColor: 'rgba(255, 255, 255, 0.08)',
        textColor: '#DFE6E9',
        accentColor: '#74B9FF'
      }
    };
    
    return themes[tone] || themes.neutral;
  }

  /**
   * Get entrance animation based on content
   */
  getEntranceAnimation() {
    const animations = [
      'slide_in_bottom',
      'fade_in_scale',
      'rotate_in',
      'glitch_appear'
    ];
    
    return animations[Math.floor(Math.random() * animations.length)];
  }

  /**
   * Determine tap zone from coordinates
   */
  getTapZone(x, y) {
    // Assuming normalized coordinates 0-1
    if (x < 0.33) return 'reject';
    if (x > 0.67) return 'accept';
    if (y < 0.33) return 'info';
    return 'whisper';
  }

  /**
   * Interpret voice intent from transcript
   */
  interpretVoiceIntent(transcript, metadata) {
    const lower = transcript.toLowerCase();
    
    // Acceptance patterns
    const acceptPatterns = ['yes', 'accept', 'confirm', 'approve', 'do it', 'go ahead', 'sure'];
    if (acceptPatterns.some(pattern => lower.includes(pattern))) {
      return 'accept';
    }
    
    // Rejection patterns
    const rejectPatterns = ['no', 'reject', 'deny', 'cancel', 'stop', 'nope', 'nah'];
    if (rejectPatterns.some(pattern => lower.includes(pattern))) {
      return 'reject';
    }
    
    // Question patterns
    const questionPatterns = ['what', 'why', 'how', 'tell me', 'explain'];
    if (questionPatterns.some(pattern => lower.includes(pattern))) {
      return 'question';
    }
    
    // Default to whisper if it's a full sentence
    if (transcript.split(' ').length > 3) {
      return 'whisper';
    }
    
    return 'unclear';
  }

  /**
   * Generate acceptance ritual
   */
  generateAcceptanceRitual() {
    return {
      type: 'acceptance',
      elements: [
        { type: 'particle_burst', color: '#4ECDC4', count: 50 },
        { type: 'ring_expansion', color: '#95E1D3', duration: 1000 },
        { type: 'glow_pulse', intensity: 0.8 }
      ],
      sound: 'chime_harmony',
      haptic: 'success_pulse'
    };
  }

  /**
   * Generate rejection ritual
   */
  generateRejectionRitual() {
    return {
      type: 'rejection',
      elements: [
        { type: 'fade_grey', duration: 800 },
        { type: 'particle_dissolve', count: 20 },
        { type: 'ripple_away', color: '#B2BEC3' }
      ],
      sound: 'soft_deflate',
      haptic: 'gentle_decline'
    };
  }

  /**
   * Show detailed decision information
   */
  showDecisionDetails() {
    this.emit('decision:details', {
      decision: this.activeDecision,
      metadata: {
        cal_full: this.activeDecision.metadata.cal_assessment,
        domingo_full: this.activeDecision.metadata.domingo_assessment,
        history: this.getDecisionHistory(this.activeDecision.agent)
      }
    });
  }

  /**
   * Get historical decisions for this agent
   */
  getDecisionHistory(agent) {
    // This would query the loop_record.json
    // For now, return mock data
    return {
      total_proposals: 7,
      accepted: 5,
      rejected: 1,
      whispered: 1,
      last_interaction: 'cycle_888'
    };
  }

  /**
   * Load pending decisions from storage
   */
  loadPendingDecisions() {
    // Would load from persistent storage
    // For now, starts empty
    this.pendingDecisions = [];
  }

  /**
   * Start interaction listeners
   */
  startInteractionListeners() {
    // This would set up actual event listeners
    // For now, we emit ready event
    this.emit('interaction:ready', {
      mode: this.interfaceMode,
      decision: this.activeDecision.id
    });
  }

  /**
   * Register biometric handler
   */
  registerBiometricHandler(type, handler) {
    this.biometricHandlers.set(type, handler);
    console.log(`📿 Registered ${type} biometric handler`);
  }

  /**
   * Handle biometric input
   */
  async handleBiometric(type, data) {
    const handler = this.biometricHandlers.get(type);
    if (!handler) {
      console.warn(`No handler for biometric type: ${type}`);
      return;
    }
    
    const result = await handler.process(data);
    
    if (result.confidence > 0.8) {
      await this.handleGesture(result.gesture, result.metadata);
    } else {
      this.emit('biometric:uncertain', { type, confidence: result.confidence });
    }
  }

  /**
   * Generate unique decision ID
   */
  generateDecisionId() {
    return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session statistics
   */
  getSessionStats() {
    return {
      ...this.sessionHistory,
      totalDecisions: this.sessionHistory.accepted + this.sessionHistory.rejected + this.sessionHistory.whispered,
      acceptanceRate: this.sessionHistory.accepted / (this.sessionHistory.accepted + this.sessionHistory.rejected + 0.001),
      sessionDuration: Date.now() - this.sessionHistory.startTime,
      pendingCount: this.pendingDecisions.length
    };
  }
}

module.exports = RitualDecisionInterface;