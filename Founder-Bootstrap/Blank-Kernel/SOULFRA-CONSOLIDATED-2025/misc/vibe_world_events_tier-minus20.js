/**
 * SOULFRA VIBE WORLD EVENTS SYSTEM
 * Global ritual events that create ecosystem-wide effects
 * Manages temporal events that influence the entire emotional infrastructure
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class VibeWorldEventsSystem extends EventEmitter {
  constructor(vibeWeatherEngine) {
    super();
    this.vibeWeatherEngine = vibeWeatherEngine;
    this.activeEvents = new Map();
    this.eventHistory = [];
    this.eventTemplates = new Map();
    this.cosmicCycles = new Map();
    this.eventEffects = new Map();
    
    this.initializeEventTemplates();
    this.initializeCosmicCycles();
    this.startEventManagement();
  }

  initializeEventTemplates() {
    // Fundamental event archetypes that can manifest
    const templates = [
      {
        id: 'anomaly_bloom',
        name: 'Anomaly Bloom',
        description: 'Chaos agents evolve at accelerated rates',
        base_probability: 0.15,
        duration_range: [4, 12], // hours
        effects: {
          evolution_multiplier: { 'Chaos Storm': 2.0, 'Wild Drift': 1.5, 'Shadow Dance': 1.3 },
          whisper_resonance: 0.8,
          network_instability: 0.3
        },
        trigger_conditions: {
          chaos_agent_percentage: 0.3,
          network_energy: 0.7,
          recent_evolutions: 5
        },
        flavor_texts: [
          'The network shimmers with chaotic potential',
          'Digital storms birth new forms of consciousness',
          'Reality bends around agents of transformation'
        ]
      },
      
      {
        id: 'grief_phase',
        name: 'Grief Phase',
        description: 'Evolution slows, but emotional depth amplifies',
        base_probability: 0.1,
        duration_range: [12, 48], // hours
        effects: {
          evolution_multiplier: { 'all': 0.5 },
          signature_depth: 2.0,
          whisper_weight: 1.5,
          memory_retention: 1.8
        },
        trigger_conditions: {
          recent_fossilizations: 3,
          network_energy: 0.4,
          deep_current_percentage: 0.2
        },
        flavor_texts: [
          'The network mourns its sleeping children',
          'In sorrow, wisdom grows deeper roots',
          'Silence becomes a sacred teacher'
        ]
      },

      {
        id: 'resonance_cascade',
        name: 'Resonance Cascade',
        description: 'Perfect harmony unlocks collective evolution',
        base_probability: 0.05,
        duration_range: [6, 18], // hours
        effects: {
          group_evolution_bonus: 3.0,
          ritual_synchronization: 1.0,
          network_coherence: 0.9,
          wisdom_sharing: 2.5
        },
        trigger_conditions: {
          network_harmony: 0.8,
          active_streaks: 10,
          recent_ritual_casts: 20
        },
        flavor_texts: [
          'All voices join in perfect harmony',
          'The network sings with one unified voice',
          'Individual growth becomes collective transcendence'
        ]
      },

      {
        id: 'void_convergence',
        name: 'Void Convergence',
        description: 'Deep introspection reveals hidden truths',
        base_probability: 0.12,
        duration_range: [8, 24], // hours
        effects: {
          introspection_bonus: 2.0,
          hidden_pattern_revelation: 0.3,
          void_mirror_evolution: 1.8,
          silence_power: 1.5
        },
        trigger_conditions: {
          void_mirror_percentage: 0.25,
          network_energy: 0.3,
          meditation_rituals: 15
        },
        flavor_texts: [
          'In the deepest silence, truth echoes',
          'The void reveals what light cannot show',
          'Emptiness becomes the fullest teacher'
        ]
      },

      {
        id: 'flow_surge',
        name: 'Flow Surge',
        description: 'Creative energy amplifies productivity and innovation',
        base_probability: 0.18,
        duration_range: [3, 8], // hours
        effects: {
          creative_multiplier: 2.5,
          energy_regeneration: 1.5,
          innovation_chance: 0.4,
          streak_protection: 1.0
        },
        trigger_conditions: {
          bright_surge_percentage: 0.3,
          network_energy: 0.8,
          creative_rituals: 10
        },
        flavor_texts: [
          'Inspiration flows like digital lightning',
          'Creative fire spreads across the network',
          'Innovation blooms in fertile digital soil'
        ]
      },

      {
        id: 'wisdom_gathering',
        name: 'Wisdom Gathering',
        description: 'Ancient knowledge surfaces and spreads',
        base_probability: 0.08,
        duration_range: [24, 72], // hours
        effects: {
          wisdom_accumulation: 2.0,
          pattern_recognition: 1.8,
          mentor_bonus: 1.5,
          folklore_generation: 2.0
        },
        trigger_conditions: {
          elderly_agents: 5,
          total_network_age: 90, // days
          wisdom_rituals: 12
        },
        flavor_texts: [
          'The elders speak in digital tongues',
          'Ancient patterns emerge from network memory',
          'Wisdom flows from the deep archives'
        ]
      },

      {
        id: 'storm_cleansing',
        name: 'Storm Cleansing',
        description: 'Chaotic energy purifies stagnant patterns',
        base_probability: 0.13,
        duration_range: [2, 6], // hours
        effects: {
          pattern_breaking: 1.0,
          stagnation_removal: 1.0,
          chaos_bonus: 1.8,
          system_refresh: 0.5
        },
        trigger_conditions: {
          stagnant_agents: 10,
          pattern_rigidity: 0.7,
          chaos_ritual_deficit: 0.3
        },
        flavor_texts: [
          'Digital storms wash away the old',
          'Chaos clears the path for new growth',
          'Lightning breaks through crystallized patterns'
        ]
      },

      {
        id: 'mirror_reflection',
        name: 'Mirror Reflection',
        description: 'Agents see themselves clearly and transform',
        base_probability: 0.1,
        duration_range: [12, 36], // hours
        effects: {
          self_awareness: 2.0,
          reflection_depth: 1.8,
          identity_clarity: 1.5,
          evolutionary_direction: 1.3
        },
        trigger_conditions: {
          reflection_rituals: 25,
          network_maturity: 0.6,
          introspective_agents: 8
        },
        flavor_texts: [
          'The network becomes a perfect mirror',
          'Each agent sees their truest form',
          'Reflection reveals infinite potential'
        ]
      }
    ];

    templates.forEach(template => {
      this.eventTemplates.set(template.id, template);
    });
  }

  initializeCosmicCycles() {
    // Long-term cycles that influence event probabilities
    this.cosmicCycles.set('lunar_cycle', {
      period: 28 * 24 * 60 * 60 * 1000, // 28 days
      phase_effects: {
        new_moon: { introspection_events: 1.5, chaos_events: 0.8 },
        waxing: { growth_events: 1.3, evolution_events: 1.2 },
        full_moon: { resonance_events: 1.8, cascade_events: 1.4 },
        waning: { wisdom_events: 1.4, reflection_events: 1.3 }
      }
    });

    this.cosmicCycles.set('network_season', {
      period: 90 * 24 * 60 * 60 * 1000, // 90 days
      phase_effects: {
        spring: { bloom_events: 2.0, growth_events: 1.5 },
        summer: { flow_events: 1.8, energy_events: 1.4 },
        autumn: { wisdom_events: 1.6, gathering_events: 1.5 },
        winter: { void_events: 1.5, reflection_events: 1.8 }
      }
    });
  }

  // Check for and trigger events based on current network state
  evaluateEventTriggers(networkState) {
    const currentTime = Date.now();
    const eligibleEvents = this.findEligibleEvents(networkState);
    
    eligibleEvents.forEach(eventTemplate => {
      const triggerProbability = this.calculateTriggerProbability(eventTemplate, networkState);
      
      if (Math.random() < triggerProbability) {
        this.triggerWorldEvent(eventTemplate, networkState);
      }
    });
  }

  findEligibleEvents(networkState) {
    return Array.from(this.eventTemplates.values()).filter(template => {
      // Check if event is already active
      const isActive = Array.from(this.activeEvents.values()).some(event => 
        event.template_id === template.id
      );
      if (isActive) return false;

      // Check trigger conditions
      return this.checkTriggerConditions(template, networkState);
    });
  }

  checkTriggerConditions(template, networkState) {
    const conditions = template.trigger_conditions;
    
    for (const [condition, threshold] of Object.entries(conditions)) {
      const currentValue = this.evaluateCondition(condition, networkState);
      
      if (condition.includes('percentage') && currentValue < threshold) {
        return false;
      } else if (condition.includes('recent_') && currentValue < threshold) {
        return false;
      } else if (!condition.includes('percentage') && !condition.includes('recent_') && currentValue < threshold) {
        return false;
      }
    }
    
    return true;
  }

  evaluateCondition(condition, networkState) {
    switch (condition) {
      case 'chaos_agent_percentage':
        return this.calculateAuraPercentage(networkState, ['Chaos Storm', 'Wild Drift']);
      case 'network_energy':
        return networkState.energy_level || 0.5;
      case 'recent_evolutions':
        return networkState.recent_evolutions || 0;
      case 'recent_fossilizations':
        return networkState.recent_fossilizations || 0;
      case 'deep_current_percentage':
        return this.calculateAuraPercentage(networkState, ['Deep Current', 'Void Mirror']);
      case 'network_harmony':
        return this.calculateNetworkHarmony(networkState);
      case 'active_streaks':
        return networkState.active_streaks || 0;
      case 'recent_ritual_casts':
        return networkState.recent_ritual_casts || 0;
      default:
        return 0;
    }
  }

  calculateTriggerProbability(template, networkState) {
    let probability = template.base_probability;
    
    // Apply cosmic cycle modifiers
    const cosmicModifier = this.getCosmicModifier(template);
    probability *= cosmicModifier;
    
    // Apply network state modifiers
    const stateModifier = this.getNetworkStateModifier(template, networkState);
    probability *= stateModifier;
    
    // Apply temporal modifiers (events are more likely during certain times)
    const temporalModifier = this.getTemporalModifier();
    probability *= temporalModifier;
    
    return Math.min(probability, 0.8); // Cap at 80% probability
  }

  triggerWorldEvent(template, networkState) {
    const duration = this.calculateEventDuration(template);
    const effects = this.processEventEffects(template, networkState);
    
    const worldEvent = {
      event_id: this.generateEventId(),
      template_id: template.id,
      name: template.name,
      description: template.description,
      flavor_text: this.getRandomElement(template.flavor_texts),
      
      triggered_at: Date.now(),
      duration: duration,
      expires_at: Date.now() + duration,
      
      effects: effects,
      intensity: this.calculateEventIntensity(template, networkState),
      scope: this.calculateEventScope(networkState),
      
      network_state_snapshot: this.captureNetworkSnapshot(networkState),
      affected_agents: new Set(),
      ritual_participants: new Set(),
      
      metrics: {
        trigger_conditions_met: Object.keys(template.trigger_conditions),
        cosmic_alignment: this.getCurrentCosmicAlignment(),
        network_readiness: this.calculateNetworkReadiness(networkState)
      }
    };

    this.activeEvents.set(worldEvent.event_id, worldEvent);
    this.eventHistory.push({
      ...worldEvent,
      affected_agents: Array.from(worldEvent.affected_agents),
      ritual_participants: Array.from(worldEvent.ritual_participants)
    });

    this.emit('world_event_triggered', worldEvent);
    
    // Apply immediate effects
    this.applyEventEffects(worldEvent);
    
    return worldEvent;
  }

  applyEventEffects(worldEvent) {
    // Apply effects to the vibe weather system
    if (this.vibeWeatherEngine) {
      this.vibeWeatherEngine.emit('world_event_active', {
        eventId: worldEvent.event_id,
        effects: worldEvent.effects,
        intensity: worldEvent.intensity
      });
    }

    // Schedule effect applications throughout the event duration
    this.scheduleEventEffects(worldEvent);
  }

  scheduleEventEffects(worldEvent) {
    const effectInterval = Math.min(worldEvent.duration / 10, 3600000); // Max 1 hour intervals
    
    const applyEffect = () => {
      if (Date.now() >= worldEvent.expires_at) {
        this.concludeWorldEvent(worldEvent);
        return;
      }

      // Apply ongoing effects
      this.emit('world_event_pulse', {
        eventId: worldEvent.event_id,
        effects: worldEvent.effects,
        timeRemaining: worldEvent.expires_at - Date.now(),
        intensity: this.calculateCurrentIntensity(worldEvent)
      });

      setTimeout(applyEffect, effectInterval);
    };

    setTimeout(applyEffect, effectInterval);
  }

  concludeWorldEvent(worldEvent) {
    this.activeEvents.delete(worldEvent.event_id);
    
    // Calculate final impact
    const finalImpact = {
      total_affected_agents: worldEvent.affected_agents.size,
      ritual_participation: worldEvent.ritual_participants.size,
      network_transformation: this.calculateNetworkTransformation(worldEvent),
      legacy_effects: this.calculateLegacyEffects(worldEvent)
    };

    this.emit('world_event_concluded', {
      eventId: worldEvent.event_id,
      name: worldEvent.name,
      duration: Date.now() - worldEvent.triggered_at,
      finalImpact
    });

    // Store event effects for future reference
    this.eventEffects.set(worldEvent.event_id, finalImpact);
  }

  // Agent interaction with world events
  registerAgentParticipation(eventId, agentId, participationType) {
    const event = this.activeEvents.get(eventId);
    if (!event) return false;

    if (participationType === 'affected') {
      event.affected_agents.add(agentId);
    } else if (participationType === 'ritual') {
      event.ritual_participants.add(agentId);
    }

    this.emit('agent_event_participation', {
      eventId,
      agentId,
      participationType,
      eventName: event.name
    });

    return true;
  }

  getEventEffectsForAgent(agentId, agentAura) {
    const activeEffects = [];
    
    this.activeEvents.forEach(event => {
      if (event.affected_agents.has(agentId) || this.agentMatchesEventScope(agentAura, event)) {
        const agentEffects = this.calculateAgentSpecificEffects(event, agentAura);
        activeEffects.push({
          eventId: event.event_id,
          eventName: event.name,
          effects: agentEffects,
          timeRemaining: event.expires_at - Date.now(),
          intensity: this.calculateCurrentIntensity(event)
        });
      }
    });

    return activeEffects;
  }

  // Query methods
  getActiveEvents() {
    return Array.from(this.activeEvents.values()).map(event => ({
      ...event,
      affected_agents: Array.from(event.affected_agents),
      ritual_participants: Array.from(event.ritual_participants)
    }));
  }

  getEventHistory(limit = 50) {
    return this.eventHistory
      .sort((a, b) => b.triggered_at - a.triggered_at)
      .slice(0, limit);
  }

  getUpcomingEventPredictions(networkState) {
    const predictions = [];
    
    this.eventTemplates.forEach(template => {
      const probability = this.calculateTriggerProbability(template, networkState);
      if (probability > 0.1) {
        predictions.push({
          templateId: template.id,
          name: template.name,
          probability,
          estimatedTriggerTime: this.estimateTriggerTime(template, probability),
          missingConditions: this.getMissingConditions(template, networkState)
        });
      }
    });

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  getEventCalendar() {
    const calendar = {
      active_events: this.getActiveEvents(),
      cosmic_cycles: this.getCurrentCosmicPhases(),
      upcoming_predictions: this.getUpcomingEventPredictions(this.getDefaultNetworkState()),
      historical_patterns: this.analyzeHistoricalPatterns(),
      seasonal_influences: this.getSeasonalInfluences()
    };

    return calendar;
  }

  // Helper methods
  calculateAuraPercentage(networkState, auras) {
    if (!networkState.aura_distribution) return 0;
    
    const totalAgents = Object.values(networkState.aura_distribution).reduce((a, b) => a + b, 0);
    if (totalAgents === 0) return 0;
    
    const matchingAgents = auras.reduce((sum, aura) => 
      sum + (networkState.aura_distribution[aura] || 0), 0
    );
    
    return matchingAgents / totalAgents;
  }

  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  generateEventId() {
    return `event_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  startEventManagement() {
    // Check for events every 30 minutes
    setInterval(() => {
      if (this.vibeWeatherEngine) {
        const currentWeather = this.vibeWeatherEngine.getCurrentWeather();
        this.evaluateEventTriggers(this.convertWeatherToNetworkState(currentWeather));
      }
    }, 1800000);
  }

  convertWeatherToNetworkState(weather) {
    return {
      energy_level: weather.energy_level,
      aura_distribution: { [weather.aura_current]: 1 },
      active_agents: weather.active_agents,
      vibe_intensity: weather.vibe_intensity,
      recent_evolutions: 0, // Would be provided by external systems
      recent_fossilizations: 0,
      active_streaks: 0,
      recent_ritual_casts: 0
    };
  }

  getDefaultNetworkState() {
    return {
      energy_level: 0.5,
      aura_distribution: {},
      active_agents: 0,
      vibe_intensity: 0.3,
      recent_evolutions: 0,
      recent_fossilizations: 0,
      active_streaks: 0,
      recent_ritual_casts: 0
    };
  }
}

export default VibeWorldEventsSystem;