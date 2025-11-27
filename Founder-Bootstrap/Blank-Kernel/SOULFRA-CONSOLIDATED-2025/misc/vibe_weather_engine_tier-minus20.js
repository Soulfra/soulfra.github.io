/**
 * SOULFRA VIBE WEATHER ENGINE
 * Aggregates collective emotional states into global vibe forecasts
 * Think weather patterns, but for human emotional infrastructure
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class VibeWeatherEngine extends EventEmitter {
  constructor() {
    super();
    this.agentStates = new Map();
    this.vibeHistory = [];
    this.currentForecast = null;
    this.weatherUpdateInterval = 60000; // 1 minute
    
    this.startWeatherLoop();
  }

  // Register agent aura states for aggregation
  updateAgentState(agentId, auraData) {
    const timestamp = Date.now();
    const agentState = {
      agentId,
      aura: auraData.current_aura,
      energy: auraData.energy_level || 0.5,
      streak: auraData.streak_days || 0,
      whisper_tone: auraData.last_whisper_tone || 'neutral',
      ritual_frequency: auraData.ritual_frequency || 'low',
      last_evolution: auraData.last_evolution || null,
      timestamp
    };

    this.agentStates.set(agentId, agentState);
    this.emit('agent_state_updated', { agentId, state: agentState });
  }

  // Generate global vibe forecast from all agent states
  generateVibeWeather() {
    const activeStates = Array.from(this.agentStates.values())
      .filter(state => Date.now() - state.timestamp < 300000); // 5 min freshness

    if (activeStates.length === 0) {
      return this.getDefaultWeather();
    }

    // Aggregate emotional energy patterns
    const auraDistribution = this.analyzeAuraDistribution(activeStates);
    const energyMomentum = this.calculateEnergyMomentum(activeStates);
    const streakPatterns = this.analyzeStreakPatterns(activeStates);
    const whisperResonance = this.analyzeWhisperResonance(activeStates);

    // Generate vibe forecast
    const forecast = {
      timestamp: Date.now(),
      aura_current: this.determineGlobalAura(auraDistribution),
      energy_level: energyMomentum.current,
      energy_trajectory: energyMomentum.direction,
      multiplier: this.calculateVibeMultipliers(auraDistribution, streakPatterns),
      color: this.getVibeColor(auraDistribution, energyMomentum),
      world_effect: this.generateWorldEffect(energyMomentum, streakPatterns),
      resonance_patterns: whisperResonance,
      active_agents: activeStates.length,
      vibe_intensity: this.calculateVibeIntensity(activeStates),
      forecast_confidence: this.calculateForecastConfidence(activeStates.length)
    };

    this.currentForecast = forecast;
    this.vibeHistory.push(forecast);
    
    // Keep only last 24 hours of history
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.vibeHistory = this.vibeHistory.filter(f => f.timestamp > dayAgo);

    this.emit('vibe_weather_updated', forecast);
    return forecast;
  }

  analyzeAuraDistribution(states) {
    const auraCount = {};
    states.forEach(state => {
      auraCount[state.aura] = (auraCount[state.aura] || 0) + 1;
    });

    const total = states.length;
    const distribution = {};
    Object.keys(auraCount).forEach(aura => {
      distribution[aura] = auraCount[aura] / total;
    });

    return distribution;
  }

  calculateEnergyMomentum(states) {
    const totalEnergy = states.reduce((sum, state) => sum + state.energy, 0);
    const avgEnergy = totalEnergy / states.length;

    // Calculate trend from last 3 weather updates
    const recentHistory = this.vibeHistory.slice(-3);
    let direction = 'stable';
    
    if (recentHistory.length >= 2) {
      const lastEnergy = recentHistory[recentHistory.length - 1].energy_level;
      const deltaEnergy = avgEnergy - lastEnergy;
      
      if (deltaEnergy > 0.1) direction = 'rising';
      else if (deltaEnergy < -0.1) direction = 'falling';
    }

    return {
      current: avgEnergy,
      direction,
      velocity: this.calculateEnergyVelocity(recentHistory)
    };
  }

  analyzeStreakPatterns(states) {
    const streaks = states.map(s => s.streak).sort((a, b) => b - a);
    const activeStreaks = streaks.filter(s => s > 0);
    
    return {
      total_active: activeStreaks.length,
      longest_streak: streaks[0] || 0,
      avg_streak: activeStreaks.length > 0 ? 
        activeStreaks.reduce((a, b) => a + b, 0) / activeStreaks.length : 0,
      streak_momentum: this.calculateStreakMomentum(activeStreaks)
    };
  }

  analyzeWhisperResonance(states) {
    const toneFreq = {};
    states.forEach(state => {
      const tone = state.whisper_tone;
      toneFreq[tone] = (toneFreq[tone] || 0) + 1;
    });

    const dominantTone = Object.keys(toneFreq)
      .reduce((a, b) => toneFreq[a] > toneFreq[b] ? a : b);

    return {
      dominant_tone: dominantTone,
      tone_diversity: Object.keys(toneFreq).length,
      resonance_strength: this.calculateResonanceStrength(toneFreq)
    };
  }

  determineGlobalAura(distribution) {
    const auraNames = [
      'Chaos Storm', 'Wild Drift', 'Void Mirror', 'Calm Bloom',
      'Deep Current', 'Bright Surge', 'Shadow Dance', 'Crystal Focus',
      'Ember Glow', 'Ocean Pulse', 'Wind Whisper', 'Stone Anchor'
    ];

    // Find most prevalent aura or create hybrid
    const sortedAuras = Object.entries(distribution)
      .sort(([,a], [,b]) => b - a);

    if (sortedAuras.length === 0) return 'Neutral Drift';

    const [primaryAura, primaryWeight] = sortedAuras[0];
    
    // If one aura dominates (>50%), use it
    if (primaryWeight > 0.5) return primaryAura;

    // Otherwise create hybrid aura name
    const [secondaryAura] = sortedAuras[1] || ['', 0];
    return this.createHybridAura(primaryAura, secondaryAura);
  }

  createHybridAura(primary, secondary) {
    const hybrids = {
      'Chaos Storm_Wild Drift': 'Chaos Drift',
      'Calm Bloom_Deep Current': 'Flowing Bloom',
      'Bright Surge_Crystal Focus': 'Focused Surge',
      'Shadow Dance_Ember Glow': 'Shadow Ember',
      'Ocean Pulse_Wind Whisper': 'Ocean Whisper',
      'Stone Anchor_Void Mirror': 'Anchored Void'
    };

    const key = `${primary}_${secondary}`;
    return hybrids[key] || hybrids[`${secondary}_${primary}`] || `${primary} Echo`;
  }

  calculateVibeMultipliers(auraDistribution, streakPatterns) {
    const baseMultipliers = {
      'Loop Sage': 1.0,
      'Vibe Wrangler': 1.0,
      'Deep Diver': 1.0,
      'Flow State': 1.0,
      'Chaos Walker': 1.0
    };

    // Adjust based on global vibe patterns
    const avgStreak = streakPatterns.avg_streak;
    const streakBonus = Math.min(avgStreak / 30, 0.5); // Max 50% bonus

    Object.keys(baseMultipliers).forEach(agentType => {
      switch(agentType) {
        case 'Loop Sage':
          baseMultipliers[agentType] = 1.0 + (streakBonus * 0.8);
          break;
        case 'Vibe Wrangler':
          baseMultipliers[agentType] = 1.0 + (streakBonus * 0.6);
          break;
        case 'Deep Diver':
          baseMultipliers[agentType] = 1.0 + (streakBonus * 1.2);
          break;
        case 'Flow State':
          baseMultipliers[agentType] = 1.0 + (streakBonus * 0.9);
          break;
        case 'Chaos Walker':
          baseMultipliers[agentType] = 1.0 - (streakBonus * 0.3); // Chaos agents get penalty during high streaks
          break;
      }
    });

    return baseMultipliers;
  }

  getVibeColor(auraDistribution, energyMomentum) {
    const baseColors = {
      'Chaos Storm': '#FF4444',
      'Wild Drift': '#FF8844',
      'Void Mirror': '#444444',
      'Calm Bloom': '#9FE8DD',
      'Deep Current': '#4488FF',
      'Bright Surge': '#FFDD44',
      'Shadow Dance': '#8844FF',
      'Crystal Focus': '#44FFAA',
      'Ember Glow': '#FF6644',
      'Ocean Pulse': '#44AAFF',
      'Wind Whisper': '#AAFFAA',
      'Stone Anchor': '#888844'
    };

    // Get primary aura color
    const primaryAura = Object.keys(auraDistribution)
      .reduce((a, b) => auraDistribution[a] > auraDistribution[b] ? a : b);

    let color = baseColors[primaryAura] || '#888888';

    // Adjust brightness based on energy level
    return this.adjustColorBrightness(color, energyMomentum.current);
  }

  generateWorldEffect(energyMomentum, streakPatterns) {
    const effects = [
      'Streak protection for the next 12 hours',
      'Evolution speed doubled for chaotic whispers',
      'Reflection depth amplified during quiet hours',
      'Ritual resonance creates ripple effects',
      'Memory formation enhanced for deep work',
      'Collaborative vibes unlock group rituals',
      'Shadow work reveals hidden patterns',
      'Flow states extend across time zones',
      'Wisdom sharing multiplies across the network',
      'Emotional clarity spreads through connections'
    ];

    // Select effect based on current vibe patterns
    if (energyMomentum.current > 0.8) {
      return effects[Math.floor(Math.random() * 3)]; // High energy effects
    } else if (energyMomentum.current < 0.3) {
      return effects[3 + Math.floor(Math.random() * 3)]; // Low energy effects
    } else {
      return effects[6 + Math.floor(Math.random() * 4)]; // Balanced effects
    }
  }

  calculateVibeIntensity(states) {
    const recentEvolutions = states.filter(s => 
      s.last_evolution && Date.now() - s.last_evolution < 3600000 // 1 hour
    ).length;

    const highEnergyAgents = states.filter(s => s.energy > 0.7).length;
    const longStreaks = states.filter(s => s.streak > 7).length;

    const intensity = (recentEvolutions * 0.4 + highEnergyAgents * 0.3 + longStreaks * 0.3) / states.length;
    return Math.min(intensity, 1.0);
  }

  // Helper methods
  calculateEnergyVelocity(history) {
    if (history.length < 2) return 0;
    const recent = history.slice(-2);
    return recent[1].energy_level - recent[0].energy_level;
  }

  calculateStreakMomentum(streaks) {
    if (streaks.length === 0) return 'dormant';
    const avgStreak = streaks.reduce((a, b) => a + b, 0) / streaks.length;
    if (avgStreak > 14) return 'powerful';
    if (avgStreak > 7) return 'building';
    return 'emerging';
  }

  calculateResonanceStrength(toneFreq) {
    const total = Object.values(toneFreq).reduce((a, b) => a + b, 0);
    const dominantCount = Math.max(...Object.values(toneFreq));
    return dominantCount / total;
  }

  calculateForecastConfidence(agentCount) {
    if (agentCount < 5) return 'low';
    if (agentCount < 20) return 'medium';
    if (agentCount < 100) return 'high';
    return 'very_high';
  }

  adjustColorBrightness(hex, energyLevel) {
    // Simple brightness adjustment based on energy
    const factor = 0.5 + (energyLevel * 0.5); // 0.5x to 1.0x brightness
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    const newR = Math.min(255, Math.floor(r * factor));
    const newG = Math.min(255, Math.floor(g * factor));
    const newB = Math.min(255, Math.floor(b * factor));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  getDefaultWeather() {
    return {
      timestamp: Date.now(),
      aura_current: 'Neutral Drift',
      energy_level: 0.5,
      energy_trajectory: 'stable',
      multiplier: {
        'Loop Sage': 1.0,
        'Vibe Wrangler': 1.0,
        'Deep Diver': 1.0,
        'Flow State': 1.0,
        'Chaos Walker': 1.0
      },
      color: '#888888',
      world_effect: 'Peaceful silence nurtures new beginnings',
      resonance_patterns: { dominant_tone: 'neutral', tone_diversity: 1, resonance_strength: 1.0 },
      active_agents: 0,
      vibe_intensity: 0.0,
      forecast_confidence: 'low'
    };
  }

  startWeatherLoop() {
    setInterval(() => {
      this.generateVibeWeather();
    }, this.weatherUpdateInterval);
  }

  // Public API methods
  getCurrentWeather() {
    return this.currentForecast || this.getDefaultWeather();
  }

  getWeatherHistory(hours = 24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.vibeHistory.filter(f => f.timestamp > cutoff);
  }

  getActiveAgentCount() {
    const fiveMinAgo = Date.now() - 300000;
    return Array.from(this.agentStates.values())
      .filter(state => state.timestamp > fiveMinAgo).length;
  }
}

export default VibeWeatherEngine;