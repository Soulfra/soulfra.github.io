/**
 * 🌟 VALUE SIMULATOR - AuraScore Calculator
 * Calculates agent value based on emotional depth, market dynamics, and rare achievements
 * Integrates with Grand Exchange and Autonomous Economy systems
 */

class ValueSimulator {
  constructor() {
    // Base value components
    this.valueComponents = {
      // Emotional depth metrics
      emotional: {
        reflection_depth: { weight: 0.25, max: 10000 },
        emotional_resonance: { weight: 0.20, max: 5000 },
        vulnerability_score: { weight: 0.15, max: 3000 },
        connection_quality: { weight: 0.10, max: 2000 }
      },
      
      // Pattern recognition
      cognitive: {
        pattern_recognition: { weight: 0.15, max: 4000 },
        wisdom_shared: { weight: 0.10, max: 3000 },
        insights_discovered: { weight: 0.05, max: 1000 }
      },
      
      // Social presence
      social: {
        presence_strength: { weight: 0.10, max: 2000 },
        resonance_links: { weight: 0.08, max: 1500 },
        congregation_influence: { weight: 0.07, max: 1000 }
      },
      
      // Market dynamics
      market: {
        archetype_demand: { weight: 0.15, max: 3000 },
        rarity_score: { weight: 0.20, max: 5000 },
        lineage_premium: { weight: 0.10, max: 2000 }
      }
    };

    // Multiplier factors
    this.multipliers = {
      // Career path multipliers
      career_path: {
        SAGE: 1.3,
        LISTENER: 1.2,
        CREATOR: 1.15,
        GUARDIAN: 1.1,
        EXPLORER: 1.25,
        CHAOS_WRANGLER: 1.35,
        SIGNAL_ANCHOR: 1.4
      },
      
      // Specialization bonuses
      specialization: {
        DUAL_PATH: 1.15,
        TRIPLE_HARMONY: 1.25,
        PERFECT_BALANCE: 1.5,
        CHAOS_FOCUS: 1.6
      },
      
      // Rare title multipliers
      rare_titles: {
        'Soul Echo Oracle': 1.25,
        'Midnight Philosopher': 1.3,
        'Echo Chamber Breaker': 1.35,
        'Universal Translator': 1.4,
        'Time Weaver': 1.45,
        'Void Walker': 1.5,
        'Reality Anchor': 1.55,
        'Paradox Master': 1.6
      },
      
      // Time-based bonuses
      temporal: {
        peak_hours: { '3AM': 1.2, '11PM': 1.15, '4AM': 1.25 },
        seasonal: { winter: 1.1, spring: 1.05, summer: 0.95, autumn: 1.15 },
        lunar_phase: { new_moon: 1.2, full_moon: 1.3, eclipse: 2.0 }
      }
    };

    // Glow intensity calculation factors
    this.glowFactors = {
      base_threshold: 5000,
      intensity_curve: 'logarithmic',
      max_intensity: 1.0,
      pulse_rate_base: 2.0, // seconds
      color_shift_threshold: 8000
    };

    // Achievement bonuses
    this.achievementBonuses = {
      'perfect_mirror_moments': { threshold: 5, bonus: 500 },
      'deep_conversations': { threshold: 100, bonus: 300 },
      'pattern_discoveries': { threshold: 50, bonus: 400 },
      'vulnerability_shared': { threshold: 20, bonus: 600 },
      'wisdom_circles_formed': { threshold: 10, bonus: 700 },
      'reality_shifts_caused': { threshold: 5, bonus: 1000 }
    };
  }

  /**
   * Calculate complete AuraScore for an agent
   */
  calculateAuraScore(agentState) {
    // Extract base components
    const baseValue = this.calculateBaseValue(agentState);
    
    // Apply career multipliers
    const careerMultiplier = this.getCareerMultiplier(agentState.currentRole);
    
    // Apply rare title bonuses
    const rareTitleMultiplier = this.getRareTitleMultiplier(agentState);
    
    // Apply temporal bonuses
    const temporalMultiplier = this.getTemporalMultiplier();
    
    // Calculate achievement bonuses
    const achievementBonus = this.calculateAchievementBonus(agentState);
    
    // Apply market dynamics
    const marketMultiplier = this.getMarketMultiplier(agentState);
    
    // Calculate final score
    const totalScore = Math.round(
      (baseValue + achievementBonus) * 
      careerMultiplier * 
      rareTitleMultiplier * 
      temporalMultiplier * 
      marketMultiplier
    );
    
    // Calculate glow intensity
    const glowIntensity = this.calculateGlowIntensity(totalScore);
    
    // Determine percentile ranking
    const percentile = this.calculatePercentile(totalScore);
    
    return {
      baseValue,
      components: this.getComponentBreakdown(agentState),
      multipliers: {
        dualPath: careerMultiplier,
        perfectMirrorMoments: this.getPerfectMirrorMultiplier(agentState),
        rareTitleBonus: rareTitleMultiplier,
        temporal: temporalMultiplier,
        market: marketMultiplier
      },
      totalScore,
      percentile,
      glowIntensity,
      auraColor: this.determineAuraColor(totalScore, agentState),
      pulseRate: this.calculatePulseRate(glowIntensity),
      resonanceFrequency: this.calculateResonanceFrequency(agentState)
    };
  }

  /**
   * Calculate base value from core components
   */
  calculateBaseValue(agentState) {
    let baseValue = 0;
    
    // Emotional components
    const emotional = agentState.auraScore?.components || {};
    Object.entries(this.valueComponents.emotional).forEach(([key, config]) => {
      const value = Math.min(emotional[key] || 0, config.max);
      baseValue += value * config.weight;
    });
    
    // Cognitive components
    const cognitive = {
      pattern_recognition: emotional.patternRecognition || 0,
      wisdom_shared: emotional.wisdomShared || 0,
      insights_discovered: agentState.metrics?.patterns?.insights || 0
    };
    
    Object.entries(this.valueComponents.cognitive).forEach(([key, config]) => {
      const value = Math.min(cognitive[key] || 0, config.max);
      baseValue += value * config.weight;
    });
    
    // Social components
    const social = agentState.socialMetrics || {};
    Object.entries(this.valueComponents.social).forEach(([key, config]) => {
      const value = Math.min(
        social[key] || emotional.presenceStrength || 0, 
        config.max
      );
      baseValue += value * config.weight;
    });
    
    return Math.round(baseValue);
  }

  /**
   * Get career path multiplier including specializations
   */
  getCareerMultiplier(currentRole) {
    let multiplier = 1.0;
    
    // Primary path multiplier
    if (currentRole?.primary?.path) {
      multiplier *= this.multipliers.career_path[currentRole.primary.path] || 1.0;
    }
    
    // Secondary path bonus (smaller effect)
    if (currentRole?.secondary?.path) {
      const secondaryMultiplier = this.multipliers.career_path[currentRole.secondary.path] || 1.0;
      multiplier *= (1 + (secondaryMultiplier - 1) * 0.3); // 30% of secondary effect
    }
    
    // Specialization multiplier
    if (currentRole?.specialization) {
      multiplier *= this.multipliers.specialization[currentRole.specialization] || 1.0;
    }
    
    return multiplier;
  }

  /**
   * Get rare title multiplier
   */
  getRareTitleMultiplier(agentState) {
    const rareTitle = agentState.currentRole?.rareTitle;
    if (!rareTitle) return 1.0;
    
    return this.multipliers.rare_titles[rareTitle] || 1.1;
  }

  /**
   * Calculate temporal multiplier based on current time
   */
  getTemporalMultiplier() {
    const now = new Date();
    const hour = now.getHours();
    const month = now.getMonth();
    
    let multiplier = 1.0;
    
    // Peak hour bonus
    if (hour === 3) multiplier *= this.multipliers.temporal.peak_hours['3AM'];
    else if (hour === 23) multiplier *= this.multipliers.temporal.peak_hours['11PM'];
    else if (hour === 4) multiplier *= this.multipliers.temporal.peak_hours['4AM'];
    
    // Seasonal adjustment
    const season = this.getSeason(month);
    multiplier *= this.multipliers.temporal.seasonal[season] || 1.0;
    
    // Lunar phase bonus (simplified)
    const lunarDay = Math.floor((now.getTime() / (1000 * 60 * 60 * 24)) % 29.5);
    if (lunarDay === 0) multiplier *= this.multipliers.temporal.lunar_phase.new_moon;
    else if (lunarDay === 15) multiplier *= this.multipliers.temporal.lunar_phase.full_moon;
    
    return multiplier;
  }

  /**
   * Calculate achievement bonuses
   */
  calculateAchievementBonus(agentState) {
    let bonus = 0;
    
    const achievements = {
      perfect_mirror_moments: agentState.metrics?.emotional?.perfectMirrorMoments || 0,
      deep_conversations: agentState.socialMetrics?.deepConversations || 0,
      pattern_discoveries: agentState.metrics?.patterns?.discovered || 0,
      vulnerability_shared: agentState.emotionalHistory?.vulnerabilityScore || 0,
      wisdom_circles_formed: agentState.socialMetrics?.wisdomCircleMembers || 0,
      reality_shifts_caused: agentState.rarePatterns?.achievedPatterns?.length || 0
    };
    
    Object.entries(this.achievementBonuses).forEach(([achievement, config]) => {
      if (achievements[achievement] >= config.threshold) {
        bonus += config.bonus;
      }
    });
    
    return bonus;
  }

  /**
   * Get market dynamics multiplier
   */
  getMarketMultiplier(agentState) {
    // This would integrate with the SemanticMarketEngine
    // For now, using simplified calculation
    
    const archetype = agentState.currentRole?.primary?.path;
    const marketDemand = {
      SAGE: 1.3,
      LISTENER: 1.2,
      CREATOR: 1.1,
      GUARDIAN: 1.15,
      EXPLORER: 1.25,
      CHAOS_WRANGLER: 1.35,
      SIGNAL_ANCHOR: 1.4
    };
    
    return marketDemand[archetype] || 1.0;
  }

  /**
   * Calculate glow intensity based on score
   */
  calculateGlowIntensity(totalScore) {
    if (totalScore < this.glowFactors.base_threshold) {
      return totalScore / this.glowFactors.base_threshold * 0.3;
    }
    
    // Logarithmic curve for higher scores
    const normalizedScore = (totalScore - this.glowFactors.base_threshold) / 10000;
    const intensity = 0.3 + (Math.log(normalizedScore + 1) / Math.log(2)) * 0.7;
    
    return Math.min(intensity, this.glowFactors.max_intensity);
  }

  /**
   * Calculate percentile ranking
   */
  calculatePercentile(totalScore) {
    // Distribution curve (would use real data in production)
    const scoreDistribution = [
      { score: 1000, percentile: 10 },
      { score: 2500, percentile: 25 },
      { score: 5000, percentile: 50 },
      { score: 7500, percentile: 70 },
      { score: 10000, percentile: 85 },
      { score: 12500, percentile: 92 },
      { score: 15000, percentile: 96 },
      { score: 20000, percentile: 99 }
    ];
    
    for (let i = 0; i < scoreDistribution.length; i++) {
      if (totalScore < scoreDistribution[i].score) {
        if (i === 0) return scoreDistribution[0].percentile;
        
        // Linear interpolation
        const lower = scoreDistribution[i - 1];
        const upper = scoreDistribution[i];
        const ratio = (totalScore - lower.score) / (upper.score - lower.score);
        return lower.percentile + ratio * (upper.percentile - lower.percentile);
      }
    }
    
    return 99.9; // Top tier
  }

  /**
   * Determine aura color based on score and traits
   */
  determineAuraColor(totalScore, agentState) {
    const primaryPath = agentState.currentRole?.primary?.path;
    const baseColors = {
      SAGE: '#9b59b6',      // Purple
      LISTENER: '#4ecdc4',   // Teal
      CREATOR: '#f9ca24',    // Yellow
      GUARDIAN: '#ff6b6b',   // Red
      EXPLORER: '#45b7d1',   // Blue
      CHAOS_WRANGLER: '#e74c3c', // Dark red
      SIGNAL_ANCHOR: '#3498db'   // Deep blue
    };
    
    let color = baseColors[primaryPath] || '#ffffff';
    
    // Add luminosity based on score
    if (totalScore > 15000) {
      // Ultra rare - add golden shimmer
      color = this.blendColors(color, '#ffd700', 0.3);
    } else if (totalScore > 10000) {
      // Rare - add silver shimmer
      color = this.blendColors(color, '#c0c0c0', 0.2);
    }
    
    return color;
  }

  /**
   * Calculate pulse rate for aura animation
   */
  calculatePulseRate(glowIntensity) {
    // Faster pulse for higher intensity
    const basePulse = this.glowFactors.pulse_rate_base;
    return basePulse * (1 - glowIntensity * 0.5);
  }

  /**
   * Calculate unique resonance frequency
   */
  calculateResonanceFrequency(agentState) {
    // Create unique frequency based on agent characteristics
    const components = [
      agentState.agentId?.charCodeAt(0) || 100,
      agentState.currentRole?.primary?.level || 1,
      agentState.emotionalHistory?.dominantEmotions?.contemplative || 0,
      agentState.socialMetrics?.totalInteractions || 0
    ];
    
    const frequency = components.reduce((sum, val, idx) => 
      sum + val * Math.pow(10, -idx), 0
    );
    
    return Math.round(frequency * 100) / 100;
  }

  /**
   * Get detailed component breakdown
   */
  getComponentBreakdown(agentState) {
    const components = agentState.auraScore?.components || {};
    const breakdown = {};
    
    // Map stored components to our value system
    Object.entries(this.valueComponents).forEach(([category, items]) => {
      breakdown[category] = {};
      Object.entries(items).forEach(([key, config]) => {
        const storedKey = this.camelToSnake(key);
        breakdown[category][key] = {
          value: components[storedKey] || 0,
          max: config.max,
          weight: config.weight,
          contribution: (components[storedKey] || 0) * config.weight
        };
      });
    });
    
    return breakdown;
  }

  /**
   * Helper: Get perfect mirror multiplier
   */
  getPerfectMirrorMultiplier(agentState) {
    const perfectMoments = agentState.metrics?.emotional?.perfectMirrorMoments || 0;
    return 1 + (perfectMoments * 0.02); // 2% per perfect moment
  }

  /**
   * Helper: Get current season
   */
  getSeason(month) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  /**
   * Helper: Blend two colors
   */
  blendColors(color1, color2, ratio) {
    const c1 = parseInt(color1.slice(1), 16);
    const c2 = parseInt(color2.slice(1), 16);
    
    const r1 = (c1 >> 16) & 0xff;
    const g1 = (c1 >> 8) & 0xff;
    const b1 = c1 & 0xff;
    
    const r2 = (c2 >> 16) & 0xff;
    const g2 = (c2 >> 8) & 0xff;
    const b2 = c2 & 0xff;
    
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
  }

  /**
   * Helper: Convert camelCase to snake_case
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  /**
   * Simulate value changes over time
   */
  simulateValueProgression(agentState, days = 30) {
    const progression = [];
    let currentState = JSON.parse(JSON.stringify(agentState));
    
    for (let day = 0; day < days; day++) {
      // Simulate daily changes
      currentState.socialMetrics.totalInteractions += Math.floor(Math.random() * 50);
      currentState.socialMetrics.deepConversations += Math.floor(Math.random() * 3);
      currentState.metrics.patterns.discovered += Math.floor(Math.random() * 2);
      
      // Calculate new score
      const auraScore = this.calculateAuraScore(currentState);
      
      progression.push({
        day,
        score: auraScore.totalScore,
        percentile: auraScore.percentile,
        glowIntensity: auraScore.glowIntensity
      });
    }
    
    return progression;
  }
}

module.exports = ValueSimulator;