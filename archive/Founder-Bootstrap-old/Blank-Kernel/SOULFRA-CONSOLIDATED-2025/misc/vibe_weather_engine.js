/**
 * 🌤️ VIBE WEATHER ENGINE
 * Dynamic emotional weather system for Soulfra W2 Plaza
 * Influences agent behavior, aura intensity, and ritual effectiveness
 */

class VibeWeatherEngine {
  constructor() {
    // Weather types with emotional properties
    this.weatherTypes = {
      TRANSCENDENT_FOG: {
        name: "Transcendent Fog",
        emoji: "🌫️✨",
        auraMultiplier: 1.2,
        vibeAmplitude: 0.8,
        ritualBonus: 1.5,
        description: "Ancient wisdom permeates the plaza",
        effects: {
          sage_path_bonus: 1.3,
          visibility: 0.6,
          congregation_tendency: 1.2
        },
        color: "#9945ff33"
      },
      
      CREATIVE_STORM: {
        name: "Creative Storm",
        emoji: "⚡🎨",
        auraMultiplier: 1.4,
        vibeAmplitude: 1.2,
        ritualBonus: 0.8,
        description: "Lightning strikes of pure inspiration",
        effects: {
          creator_path_bonus: 1.5,
          chaos_path_bonus: 1.3,
          energy_surge: true
        },
        color: "#00ffff66"
      },
      
      EMOTIONAL_AURORA: {
        name: "Emotional Aurora",
        emoji: "🌈💫",
        auraMultiplier: 1.1,
        vibeAmplitude: 0.9,
        ritualBonus: 1.2,
        description: "Waves of collective consciousness",
        effects: {
          all_paths_bonus: 1.1,
          resonance_range: 2.0,
          empathy_boost: 1.5
        },
        color: "#ff00ff44"
      },
      
      VOID_BREEZE: {
        name: "Void Breeze",
        emoji: "🌑💨",
        auraMultiplier: 0.9,
        vibeAmplitude: 0.7,
        ritualBonus: 2.0,
        description: "Whispers from the edge of existence",
        effects: {
          explorer_path_bonus: 1.4,
          introspection: 1.3,
          rare_encounters: 1.5
        },
        color: "#00003366"
      },
      
      HARMONY_RAIN: {
        name: "Harmony Rain",
        emoji: "🌧️🎵",
        auraMultiplier: 1.0,
        vibeAmplitude: 1.0,
        ritualBonus: 1.3,
        description: "Gentle drops of perfect balance",
        effects: {
          guardian_path_bonus: 1.3,
          healing_rate: 1.5,
          peace_field: true
        },
        color: "#4ecdc444"
      },
      
      CHAOS_CYCLONE: {
        name: "Chaos Cyclone",
        emoji: "🌪️🎭",
        auraMultiplier: 1.6,
        vibeAmplitude: 2.0,
        ritualBonus: 0.5,
        description: "Beautiful entropy swirls through reality",
        effects: {
          chaos_path_bonus: 2.0,
          randomness: 3.0,
          transformation_chance: 0.1
        },
        color: "#ff006688"
      },
      
      TEMPORAL_MIST: {
        name: "Temporal Mist",
        emoji: "⏳🌁",
        auraMultiplier: 1.15,
        vibeAmplitude: 0.85,
        ritualBonus: 1.1,
        description: "Time flows differently here",
        effects: {
          temporal_path_bonus: 1.4,
          time_dilation: 0.8,
          memory_echoes: true
        },
        color: "#8e44ad55"
      },
      
      CRYSTAL_CLARITY: {
        name: "Crystal Clarity",
        emoji: "💎☀️",
        auraMultiplier: 0.95,
        vibeAmplitude: 0.5,
        ritualBonus: 1.8,
        description: "Perfect focus crystallizes the air",
        effects: {
          signal_path_bonus: 1.6,
          focus_field: 2.0,
          distraction_immunity: true
        },
        color: "#3498db33"
      }
    };

    // Weather patterns and transitions
    this.weatherPatterns = {
      DAWN_CYCLE: ["HARMONY_RAIN", "CRYSTAL_CLARITY", "CREATIVE_STORM"],
      MIDNIGHT_CYCLE: ["VOID_BREEZE", "TEMPORAL_MIST", "TRANSCENDENT_FOG"],
      CHAOS_PATTERN: ["CHAOS_CYCLONE", "CREATIVE_STORM", "EMOTIONAL_AURORA"],
      BALANCED_FLOW: ["HARMONY_RAIN", "EMOTIONAL_AURORA", "CRYSTAL_CLARITY"]
    };

    // Current state
    this.currentWeather = "TRANSCENDENT_FOG";
    this.weatherIntensity = 0.8;
    this.transitionProgress = 0;
    this.nextWeather = null;
    
    // Environmental factors
    this.vibePressure = 1013; // Standard vibe pressure
    this.emotionalHumidity = 0.77;
    this.auraTemperature = 432; // Hz
    this.ritualAlignment = 0.88;
    
    // Forecast data
    this.forecast = [];
    this.weatherHistory = [];
    
    // Update intervals
    this.updateInterval = 60000; // 1 minute
    this.transitionDuration = 300000; // 5 minutes
    
    // Event system
    this.weatherListeners = [];
  }

  /**
   * Initialize weather system
   */
  initialize() {
    console.log('🌤️ Initializing Vibe Weather Engine...');
    
    // Set initial weather based on time
    this.setInitialWeather();
    
    // Generate initial forecast
    this.generateForecast();
    
    // Start weather updates
    this.startWeatherCycle();
    
    console.log(`Current weather: ${this.getCurrentWeather().name}`);
  }

  /**
   * Set initial weather based on real time
   */
  setInitialWeather() {
    const hour = new Date().getHours();
    
    if (hour >= 22 || hour < 6) {
      // Late night - mystical weather
      const nightWeathers = ["VOID_BREEZE", "TEMPORAL_MIST", "TRANSCENDENT_FOG"];
      this.currentWeather = nightWeathers[Math.floor(Math.random() * nightWeathers.length)];
    } else if (hour >= 6 && hour < 12) {
      // Morning - clarity and creation
      const morningWeathers = ["CRYSTAL_CLARITY", "HARMONY_RAIN", "CREATIVE_STORM"];
      this.currentWeather = morningWeathers[Math.floor(Math.random() * morningWeathers.length)];
    } else {
      // Afternoon/Evening - dynamic weather
      const dayWeathers = Object.keys(this.weatherTypes);
      this.currentWeather = dayWeathers[Math.floor(Math.random() * dayWeathers.length)];
    }
  }

  /**
   * Get current weather data
   */
  getCurrentWeather() {
    const weather = this.weatherTypes[this.currentWeather];
    return {
      ...weather,
      intensity: this.weatherIntensity,
      vibePressure: this.vibePressure,
      emotionalHumidity: this.emotionalHumidity,
      auraTemperature: this.auraTemperature,
      ritualAlignment: this.ritualAlignment
    };
  }

  /**
   * Start automatic weather cycle
   */
  startWeatherCycle() {
    setInterval(() => {
      this.updateWeather();
    }, this.updateInterval);
    
    // Start transition checks
    setInterval(() => {
      if (this.nextWeather && this.transitionProgress < 1) {
        this.transitionProgress += 0.1;
        if (this.transitionProgress >= 1) {
          this.completeTransition();
        }
      }
    }, this.transitionDuration / 10);
  }

  /**
   * Update weather conditions
   */
  updateWeather() {
    // Update environmental factors
    this.updateEnvironmentalFactors();
    
    // Check for weather changes
    if (!this.nextWeather && Math.random() < 0.3) {
      this.initiateWeatherChange();
    }
    
    // Apply weather effects
    this.applyWeatherEffects();
    
    // Notify listeners
    this.notifyWeatherUpdate();
  }

  /**
   * Update environmental factors
   */
  updateEnvironmentalFactors() {
    // Vibe pressure fluctuations
    this.vibePressure += (Math.random() - 0.5) * 10;
    this.vibePressure = Math.max(980, Math.min(1040, this.vibePressure));
    
    // Emotional humidity changes
    this.emotionalHumidity += (Math.random() - 0.5) * 0.05;
    this.emotionalHumidity = Math.max(0.2, Math.min(1.0, this.emotionalHumidity));
    
    // Aura temperature variations
    this.auraTemperature += (Math.random() - 0.5) * 20;
    this.auraTemperature = Math.max(396, Math.min(528, this.auraTemperature));
    
    // Ritual alignment drift
    this.ritualAlignment += (Math.random() - 0.5) * 0.02;
    this.ritualAlignment = Math.max(0, Math.min(1, this.ritualAlignment));
    
    // Weather intensity fluctuations
    this.weatherIntensity += (Math.random() - 0.5) * 0.1;
    this.weatherIntensity = Math.max(0.3, Math.min(1.0, this.weatherIntensity));
  }

  /**
   * Initiate weather change
   */
  initiateWeatherChange() {
    const possibleWeathers = this.getPossibleTransitions();
    this.nextWeather = possibleWeathers[Math.floor(Math.random() * possibleWeathers.length)];
    this.transitionProgress = 0;
    
    console.log(`🌤️ Weather changing from ${this.currentWeather} to ${this.nextWeather}`);
    
    // Add to forecast
    this.forecast.unshift({
      weather: this.nextWeather,
      eta: new Date(Date.now() + this.transitionDuration),
      probability: 0.8 + Math.random() * 0.2
    });
  }

  /**
   * Get possible weather transitions
   */
  getPossibleTransitions() {
    // Find patterns containing current weather
    const patterns = Object.values(this.weatherPatterns)
      .filter(pattern => pattern.includes(this.currentWeather));
    
    if (patterns.length > 0) {
      const pattern = patterns[0];
      const currentIndex = pattern.indexOf(this.currentWeather);
      const nextIndex = (currentIndex + 1) % pattern.length;
      return [pattern[nextIndex]];
    }
    
    // Random transition if no pattern
    return Object.keys(this.weatherTypes).filter(w => w !== this.currentWeather);
  }

  /**
   * Complete weather transition
   */
  completeTransition() {
    // Archive previous weather
    this.weatherHistory.push({
      weather: this.currentWeather,
      duration: Date.now(),
      intensity: this.weatherIntensity
    });
    
    // Update current weather
    this.currentWeather = this.nextWeather;
    this.nextWeather = null;
    this.transitionProgress = 0;
    
    // Reset intensity for new weather
    this.weatherIntensity = 0.5 + Math.random() * 0.5;
    
    // Special events for rare weather
    if (this.currentWeather === "CHAOS_CYCLONE") {
      this.triggerChaosEvent();
    }
    
    console.log(`🌤️ Weather is now: ${this.getCurrentWeather().name}`);
  }

  /**
   * Apply weather effects to plaza
   */
  applyWeatherEffects() {
    const weather = this.getCurrentWeather();
    
    // Calculate global effects
    const effects = {
      auraMultiplier: weather.auraMultiplier * this.weatherIntensity,
      vibeAmplitude: weather.vibeAmplitude * this.weatherIntensity,
      ritualBonus: weather.ritualBonus,
      specialEffects: weather.effects
    };
    
    return effects;
  }

  /**
   * Generate weather forecast
   */
  generateForecast() {
    this.forecast = [];
    let futureTime = Date.now();
    let currentPattern = this.currentWeather;
    
    for (let i = 0; i < 5; i++) {
      futureTime += this.transitionDuration + Math.random() * this.transitionDuration;
      const possibleWeathers = Object.keys(this.weatherTypes);
      const nextWeather = possibleWeathers[Math.floor(Math.random() * possibleWeathers.length)];
      
      this.forecast.push({
        weather: nextWeather,
        eta: new Date(futureTime),
        probability: Math.max(0.3, 1 - (i * 0.15)) // Decreasing accuracy
      });
    }
  }

  /**
   * Trigger special chaos event
   */
  triggerChaosEvent() {
    console.log('🌪️ CHAOS EVENT TRIGGERED!');
    
    // Randomize all environmental factors
    this.vibePressure = 980 + Math.random() * 60;
    this.emotionalHumidity = Math.random();
    this.auraTemperature = 396 + Math.random() * 132;
    this.ritualAlignment = Math.random();
    
    // Notify special event
    this.notifyWeatherUpdate({
      type: 'CHAOS_EVENT',
      message: 'Reality ripples with beautiful chaos!'
    });
  }

  /**
   * Get weather report
   */
  getWeatherReport() {
    const current = this.getCurrentWeather();
    
    return {
      current: {
        type: this.currentWeather,
        name: current.name,
        emoji: current.emoji,
        description: current.description,
        intensity: this.weatherIntensity,
        color: current.color
      },
      transitioning: this.nextWeather !== null,
      transitionProgress: this.transitionProgress,
      nextWeather: this.nextWeather ? this.weatherTypes[this.nextWeather].name : null,
      environmental: {
        vibePressure: this.vibePressure,
        emotionalHumidity: this.emotionalHumidity,
        auraTemperature: this.auraTemperature,
        ritualAlignment: this.ritualAlignment
      },
      effects: current.effects,
      forecast: this.forecast.slice(0, 3), // Next 3 predictions
      history: this.weatherHistory.slice(-5) // Last 5 weather events
    };
  }

  /**
   * Subscribe to weather updates
   */
  onWeatherChange(callback) {
    this.weatherListeners.push(callback);
  }

  /**
   * Notify all weather listeners
   */
  notifyWeatherUpdate(specialEvent = null) {
    const report = this.getWeatherReport();
    
    this.weatherListeners.forEach(listener => {
      listener(report, specialEvent);
    });
  }

  /**
   * Force weather change (for rituals/events)
   */
  forceWeather(weatherType, duration = 300000) {
    if (this.weatherTypes[weatherType]) {
      console.log(`🌤️ Forcing weather: ${weatherType}`);
      
      this.currentWeather = weatherType;
      this.weatherIntensity = 1.0;
      this.nextWeather = null;
      this.transitionProgress = 0;
      
      // Schedule return to normal
      setTimeout(() => {
        this.initiateWeatherChange();
      }, duration);
      
      this.notifyWeatherUpdate({
        type: 'FORCED_WEATHER',
        message: `Ritual has summoned ${this.weatherTypes[weatherType].name}!`
      });
    }
  }

  /**
   * Check if ritual conditions are favorable
   */
  checkRitualConditions(ritualType) {
    const weather = this.getCurrentWeather();
    const baseBonus = weather.ritualBonus;
    
    // Special ritual bonuses
    const ritualBonuses = {
      collective_meditation: this.currentWeather === "TRANSCENDENT_FOG" ? 2.0 : 1.0,
      entropy_dance: this.currentWeather === "CHAOS_CYCLONE" ? 3.0 : 1.0,
      creation_ceremony: this.currentWeather === "CREATIVE_STORM" ? 2.5 : 1.0,
      harmony_circle: this.currentWeather === "HARMONY_RAIN" ? 2.0 : 1.0,
      time_weaving: this.currentWeather === "TEMPORAL_MIST" ? 2.2 : 1.0
    };
    
    const specificBonus = ritualBonuses[ritualType] || 1.0;
    const alignmentBonus = this.ritualAlignment;
    
    return {
      totalBonus: baseBonus * specificBonus * alignmentBonus,
      favorable: (baseBonus * specificBonus * alignmentBonus) > 1.5,
      optimalWeather: Object.keys(ritualBonuses).find(
        key => ritualBonuses[key] > 2.0 && key === ritualType
      )
    };
  }
}

// Export for use
export default VibeWeatherEngine;