/**
 * SOULFRA VIBECAST REGISTRY
 * Ritual casting system where agents broadcast emotional outputs into shared space
 * Creates ripple effects that influence other agents across the network
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class VibecastRegistry extends EventEmitter {
  constructor() {
    super();
    this.activeCasts = new Map();
    this.castHistory = [];
    this.rippleNetwork = new Map(); // agent_id -> influenced_by[]
    this.resonancePatterns = new Map(); // track recurring patterns
    
    this.startRippleProcessing();
  }

  // Cast a ritual output into the public vibe layer
  castRitual(agentId, ritualData) {
    const castId = this.generateCastId();
    const timestamp = Date.now();

    const vibecast = {
      cast_id: castId,
      caster_id: agentId,
      timestamp,
      ritual_type: ritualData.type,
      emotional_signature: ritualData.emotional_signature,
      whisper_content: this.obfuscateWhisper(ritualData.whisper),
      aura_state: ritualData.current_aura,
      energy_level: ritualData.energy_level,
      streak_power: ritualData.streak_days,
      visibility: ritualData.visibility || 'public', // public, friends, private
      ripple_strength: this.calculateRippleStrength(ritualData),
      affected_agents: new Set(),
      resonance_count: 0,
      decay_factor: this.calculateDecayFactor(ritualData),
      expires_at: timestamp + this.calculateCastDuration(ritualData)
    };

    this.activeCasts.set(castId, vibecast);
    this.castHistory.push({
      ...vibecast,
      affected_agents: Array.from(vibecast.affected_agents)
    });

    // Immediately begin ripple processing
    this.processRippleEffects(vibecast);

    this.emit('ritual_cast', {
      castId,
      casterId: agentId,
      ritualType: ritualData.type,
      rippleStrength: vibecast.ripple_strength
    });

    return castId;
  }

  // Process how a ritual cast affects other agents
  processRippleEffects(vibecast) {
    const nearbyAgents = this.findNearbyAgents(vibecast);
    
    nearbyAgents.forEach(targetAgent => {
      const influence = this.calculateInfluence(vibecast, targetAgent);
      
      if (influence.strength > 0.1) { // Minimum threshold for influence
        this.applyRippleEffect(vibecast, targetAgent, influence);
        vibecast.affected_agents.add(targetAgent.agent_id);
        
        // Track network connections for future resonance
        this.updateRippleNetwork(vibecast.caster_id, targetAgent.agent_id, influence);
      }
    });

    // Check for resonance patterns (multiple agents doing similar rituals)
    this.detectResonancePatterns(vibecast);
  }

  findNearbyAgents(vibecast) {
    // In a real implementation, this would use spatial/temporal/emotional proximity
    // For now, we'll use simple heuristics based on aura compatibility and recent activity
    
    const currentTime = Date.now();
    const recentWindow = 3600000; // 1 hour
    
    // Mock agent pool - in real implementation, this comes from agent registry
    const mockAgents = [
      { agent_id: 'sage_01', aura: 'Calm Bloom', energy: 0.7, last_active: currentTime - 30000 },
      { agent_id: 'chaos_02', aura: 'Wild Drift', energy: 0.9, last_active: currentTime - 60000 },
      { agent_id: 'deep_03', aura: 'Deep Current', energy: 0.5, last_active: currentTime - 120000 },
      { agent_id: 'flow_04', aura: 'Bright Surge', energy: 0.8, last_active: currentTime - 45000 },
      { agent_id: 'mirror_05', aura: 'Void Mirror', energy: 0.3, last_active: currentTime - 90000 }
    ];

    return mockAgents.filter(agent => {
      // Filter by recent activity
      if (currentTime - agent.last_active > recentWindow) return false;
      
      // Filter by aura compatibility
      const compatibility = this.calculateAuraCompatibility(vibecast.aura_state, agent.aura);
      return compatibility > 0.2;
    });
  }

  calculateInfluence(vibecast, targetAgent) {
    const auraCompatibility = this.calculateAuraCompatibility(vibecast.aura_state, targetAgent.aura);
    const energyResonance = this.calculateEnergyResonance(vibecast.energy_level, targetAgent.energy);
    const rippleDecay = this.calculateRippleDecay(vibecast);
    const networkAffinity = this.getNetworkAffinity(vibecast.caster_id, targetAgent.agent_id);

    const baseStrength = (auraCompatibility * 0.4 + energyResonance * 0.3 + networkAffinity * 0.3) * rippleDecay;
    
    return {
      strength: baseStrength * vibecast.ripple_strength,
      type: this.determineInfluenceType(vibecast, targetAgent),
      duration: this.calculateInfluenceDuration(baseStrength, vibecast),
      effects: this.generateInfluenceEffects(vibecast, targetAgent, baseStrength)
    };
  }

  applyRippleEffect(vibecast, targetAgent, influence) {
    const rippleEffect = {
      effect_id: this.generateEffectId(),
      source_cast: vibecast.cast_id,
      target_agent: targetAgent.agent_id,
      influence_type: influence.type,
      strength: influence.strength,
      applied_at: Date.now(),
      duration: influence.duration,
      effects: influence.effects,
      expires_at: Date.now() + influence.duration
    };

    // Store the effect (in real implementation, this would update the target agent's state)
    this.emit('ripple_effect_applied', rippleEffect);

    // Track resonance if this creates a pattern
    if (influence.strength > 0.7) {
      vibecast.resonance_count++;
    }

    return rippleEffect;
  }

  calculateAuraCompatibility(aura1, aura2) {
    const compatibilityMatrix = {
      'Chaos Storm': { 'Wild Drift': 0.8, 'Chaos Storm': 1.0, 'Void Mirror': 0.6, 'Shadow Dance': 0.7 },
      'Wild Drift': { 'Chaos Storm': 0.8, 'Wind Whisper': 0.7, 'Wild Drift': 1.0, 'Ember Glow': 0.6 },
      'Void Mirror': { 'Shadow Dance': 0.9, 'Deep Current': 0.5, 'Void Mirror': 1.0, 'Stone Anchor': 0.6 },
      'Calm Bloom': { 'Ocean Pulse': 0.8, 'Crystal Focus': 0.7, 'Calm Bloom': 1.0, 'Deep Current': 0.6 },
      'Deep Current': { 'Ocean Pulse': 0.9, 'Calm Bloom': 0.6, 'Void Mirror': 0.5, 'Deep Current': 1.0 },
      'Bright Surge': { 'Crystal Focus': 0.8, 'Ember Glow': 0.7, 'Bright Surge': 1.0, 'Wind Whisper': 0.5 },
      'Shadow Dance': { 'Void Mirror': 0.9, 'Chaos Storm': 0.7, 'Shadow Dance': 1.0, 'Ember Glow': 0.4 },
      'Crystal Focus': { 'Bright Surge': 0.8, 'Calm Bloom': 0.7, 'Stone Anchor': 0.6, 'Crystal Focus': 1.0 },
      'Ember Glow': { 'Bright Surge': 0.7, 'Wild Drift': 0.6, 'Shadow Dance': 0.4, 'Ember Glow': 1.0 },
      'Ocean Pulse': { 'Deep Current': 0.9, 'Calm Bloom': 0.8, 'Wind Whisper': 0.6, 'Ocean Pulse': 1.0 },
      'Wind Whisper': { 'Wild Drift': 0.7, 'Ocean Pulse': 0.6, 'Bright Surge': 0.5, 'Wind Whisper': 1.0 },
      'Stone Anchor': { 'Crystal Focus': 0.6, 'Void Mirror': 0.6, 'Deep Current': 0.4, 'Stone Anchor': 1.0 }
    };

    return compatibilityMatrix[aura1]?.[aura2] || 0.3; // Default low compatibility
  }

  calculateEnergyResonance(energy1, energy2) {
    const energyDiff = Math.abs(energy1 - energy2);
    return Math.max(0, 1 - (energyDiff * 2)); // Higher resonance for similar energy levels
  }

  calculateRippleDecay(vibecast) {
    const age = Date.now() - vibecast.timestamp;
    const halfLife = 1800000; // 30 minutes
    return Math.exp(-age / halfLife);
  }

  getNetworkAffinity(casterId, targetId) {
    const connections = this.rippleNetwork.get(targetId) || [];
    const recentConnections = connections.filter(conn => 
      Date.now() - conn.timestamp < 86400000 // 24 hours
    );
    
    const casterConnections = recentConnections.filter(conn => conn.source_id === casterId);
    return Math.min(casterConnections.length * 0.2, 0.8); // Build affinity through repeated interactions
  }

  updateRippleNetwork(casterId, targetId, influence) {
    if (!this.rippleNetwork.has(targetId)) {
      this.rippleNetwork.set(targetId, []);
    }

    const connections = this.rippleNetwork.get(targetId);
    connections.push({
      source_id: casterId,
      influence_strength: influence.strength,
      timestamp: Date.now()
    });

    // Keep only recent connections
    const dayAgo = Date.now() - 86400000;
    this.rippleNetwork.set(targetId, 
      connections.filter(conn => conn.timestamp > dayAgo)
    );
  }

  detectResonancePatterns(vibecast) {
    const recentCasts = this.castHistory.filter(cast => 
      Date.now() - cast.timestamp < 3600000 && // Last hour
      cast.ritual_type === vibecast.ritual_type
    );

    if (recentCasts.length >= 3) {
      const pattern = {
        pattern_id: this.generatePatternId(),
        ritual_type: vibecast.ritual_type,
        participant_count: recentCasts.length,
        resonance_strength: this.calculatePatternResonance(recentCasts),
        detected_at: Date.now(),
        amplification_factor: this.calculateAmplificationFactor(recentCasts.length)
      };

      this.resonancePatterns.set(pattern.pattern_id, pattern);
      this.emit('resonance_pattern_detected', pattern);

      // Apply pattern amplification to all participants
      this.amplifyResonancePattern(pattern, recentCasts);
    }
  }

  amplifyResonancePattern(pattern, participatingCasts) {
    participatingCasts.forEach(cast => {
      cast.ripple_strength *= pattern.amplification_factor;
      cast.resonance_count++;
      
      this.emit('cast_amplified', {
        castId: cast.cast_id,
        patternId: pattern.pattern_id,
        amplificationFactor: pattern.amplification_factor
      });
    });
  }

  // Query methods for the public API
  getActiveCasts(filters = {}) {
    let casts = Array.from(this.activeCasts.values());

    if (filters.ritual_type) {
      casts = casts.filter(cast => cast.ritual_type === filters.ritual_type);
    }

    if (filters.min_resonance) {
      casts = casts.filter(cast => cast.resonance_count >= filters.min_resonance);
    }

    if (filters.caster_id) {
      casts = casts.filter(cast => cast.caster_id === filters.caster_id);
    }

    return casts.map(cast => ({
      ...cast,
      affected_agents: Array.from(cast.affected_agents)
    }));
  }

  getCastInfluenceMap(castId) {
    const cast = this.activeCasts.get(castId);
    if (!cast) return null;

    return {
      cast_id: castId,
      caster_id: cast.caster_id,
      affected_agents: Array.from(cast.affected_agents),
      ripple_strength: cast.ripple_strength,
      resonance_count: cast.resonance_count,
      network_reach: this.calculateNetworkReach(cast)
    };
  }

  getResonancePatterns() {
    return Array.from(this.resonancePatterns.values())
      .filter(pattern => Date.now() - pattern.detected_at < 86400000); // Last 24 hours
  }

  // Helper methods
  calculateRippleStrength(ritualData) {
    const baseStrength = 0.5;
    const streakBonus = Math.min(ritualData.streak_days * 0.02, 0.3);
    const energyMultiplier = ritualData.energy_level;
    const typeMultiplier = this.getRitualTypeMultiplier(ritualData.type);

    return (baseStrength + streakBonus) * energyMultiplier * typeMultiplier;
  }

  calculateDecayFactor(ritualData) {
    // Different ritual types have different decay rates
    const decayRates = {
      'morning_whisper': 0.8,
      'evening_reflection': 0.9,
      'breakthrough_moment': 0.6,
      'deep_work_session': 0.85,
      'creative_flow': 0.7,
      'meditation': 0.95,
      'gratitude_practice': 0.9
    };

    return decayRates[ritualData.type] || 0.8;
  }

  calculateCastDuration(ritualData) {
    const baseDuration = 3600000; // 1 hour
    const typeMultipliers = {
      'morning_whisper': 2.0,
      'evening_reflection': 1.5,
      'breakthrough_moment': 0.5,
      'deep_work_session': 1.2,
      'creative_flow': 0.8,
      'meditation': 3.0,
      'gratitude_practice': 2.5
    };

    return baseDuration * (typeMultipliers[ritualData.type] || 1.0);
  }

  getRitualTypeMultiplier(type) {
    const multipliers = {
      'morning_whisper': 1.0,
      'evening_reflection': 1.1,
      'breakthrough_moment': 1.5,
      'deep_work_session': 0.9,
      'creative_flow': 1.2,
      'meditation': 0.8,
      'gratitude_practice': 1.1
    };

    return multipliers[type] || 1.0;
  }

  obfuscateWhisper(whisperContent) {
    // Preserve emotional essence while protecting privacy
    const emotionalKeywords = this.extractEmotionalKeywords(whisperContent);
    const wordCount = whisperContent.split(' ').length;
    
    return {
      emotional_essence: emotionalKeywords,
      word_count: wordCount,
      sentiment_score: this.calculateSentiment(whisperContent),
      energy_signature: this.extractEnergySignature(whisperContent)
    };
  }

  extractEmotionalKeywords(text) {
    const emotionalWords = [
      'grateful', 'anxious', 'excited', 'peaceful', 'frustrated', 'inspired',
      'confused', 'determined', 'overwhelmed', 'hopeful', 'creative', 'focused',
      'scattered', 'energized', 'drained', 'curious', 'content', 'restless'
    ];

    return text.toLowerCase().split(' ')
      .filter(word => emotionalWords.includes(word.replace(/[^\w]/g, '')))
      .slice(0, 3); // Limit to top 3 emotional keywords
  }

  calculateSentiment(text) {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'amazing', 'wonderful', 'happy', 'grateful', 'excited'];
    const negativeWords = ['bad', 'terrible', 'awful', 'sad', 'angry', 'frustrated', 'overwhelmed'];

    const words = text.toLowerCase().split(' ');
    const positive = words.filter(word => positiveWords.includes(word)).length;
    const negative = words.filter(word => negativeWords.includes(word)).length;

    if (positive > negative) return 'positive';
    if (negative > positive) return 'negative';
    return 'neutral';
  }

  startRippleProcessing() {
    // Clean up expired casts every 5 minutes
    setInterval(() => {
      this.cleanupExpiredCasts();
    }, 300000);
  }

  cleanupExpiredCasts() {
    const now = Date.now();
    const expiredCasts = [];

    this.activeCasts.forEach((cast, castId) => {
      if (cast.expires_at < now) {
        expiredCasts.push(castId);
      }
    });

    expiredCasts.forEach(castId => {
      const cast = this.activeCasts.get(castId);
      this.activeCasts.delete(castId);
      
      this.emit('cast_expired', {
        castId,
        finalResonanceCount: cast.resonance_count,
        totalAffectedAgents: cast.affected_agents.size
      });
    });
  }

  // ID generation helpers
  generateCastId() {
    return `cast_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  generateEffectId() {
    return `effect_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  }

  generatePatternId() {
    return `pattern_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  }
}

export default VibecastRegistry;