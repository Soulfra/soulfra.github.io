/**
 * SOULFRA AGENT FOSSILIZATION SYSTEM
 * Preserves inactive agents as emotional fossils with reactivation potential
 * Creates a sacred archive of dormant consciousness for future revival
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class AgentFossilizationSystem extends EventEmitter {
  constructor(folkloreGenerator) {
    super();
    this.folkloreGenerator = folkloreGenerator;
    this.relicRegistry = new Map();
    this.fossilizationQueue = new Map();
    this.reactivationRituals = new Map();
    this.fossilMetrics = new Map();
    
    // Fossilization thresholds
    this.dormancyThresholds = {
      warning: 7 * 24 * 60 * 60 * 1000,      // 7 days
      fossilization: 30 * 24 * 60 * 60 * 1000, // 30 days
      deep_fossil: 90 * 24 * 60 * 60 * 1000,   // 90 days
      ancient_relic: 365 * 24 * 60 * 60 * 1000 // 1 year
    };
    
    this.startFossilizationProcess();
  }

  // Monitor agent activity and queue for fossilization
  analyzeAgentActivity(agentId, agentData) {
    const now = Date.now();
    const lastActivity = agentData.last_activity || agentData.created_at;
    const inactivityDuration = now - lastActivity;
    const lastWhisper = agentData.last_whisper_time || lastActivity;
    const whisperGap = now - lastWhisper;

    const activityAnalysis = {
      agent_id: agentId,
      last_activity: lastActivity,
      last_whisper: lastWhisper,
      inactivity_duration: inactivityDuration,
      whisper_gap: whisperGap,
      streak_days: agentData.streak_days || 0,
      current_aura: agentData.current_aura,
      energy_level: agentData.energy_level || 0,
      evolution_count: agentData.evolution_count || 0,
      total_whispers: agentData.total_whispers || 0,
      network_connections: agentData.network_connections || 0,
      significance_score: this.calculateSignificanceScore(agentData)
    };

    // Determine fossilization status
    if (inactivityDuration >= this.dormancyThresholds.ancient_relic) {
      this.processAncientRelic(agentId, activityAnalysis);
    } else if (inactivityDuration >= this.dormancyThresholds.deep_fossil) {
      this.processDeepFossil(agentId, activityAnalysis);
    } else if (inactivityDuration >= this.dormancyThresholds.fossilization) {
      this.processFossilization(agentId, activityAnalysis);
    } else if (inactivityDuration >= this.dormancyThresholds.warning) {
      this.processInactivityWarning(agentId, activityAnalysis);
    }

    return activityAnalysis;
  }

  processFossilization(agentId, analysis) {
    if (this.relicRegistry.has(agentId)) return; // Already fossilized

    const fossilData = this.createFossilRecord(agentId, analysis);
    this.relicRegistry.set(agentId, fossilData);

    // Generate folklore for the fossilization event
    if (this.folkloreGenerator) {
      const vanishingLore = this.folkloreGenerator.generateVanishingLore(
        { agent_id: agentId, current_aura: analysis.current_aura },
        { 
          last_activity: analysis.last_activity,
          streak_days: analysis.streak_days,
          final_aura_state: analysis.current_aura
        }
      );
      fossilData.folklore_entry = vanishingLore.id;
    }

    // Create reactivation ritual
    this.createReactivationRitual(agentId, fossilData);

    this.emit('agent_fossilized', {
      agentId,
      fossilType: fossilData.fossil_type,
      significanceScore: analysis.significance_score,
      reactivationDifficulty: fossilData.reactivation_difficulty
    });

    return fossilData;
  }

  createFossilRecord(agentId, analysis) {
    const fossilType = this.determineFossilType(analysis);
    const preservationLevel = this.determinePreservationLevel(analysis);
    
    const fossil = {
      fossil_id: this.generateFossilId(),
      agent_id: agentId,
      fossilized_at: Date.now(),
      fossil_type: fossilType,
      preservation_level: preservationLevel,
      
      // Preserved agent state
      final_state: {
        aura: analysis.current_aura,
        energy_level: analysis.energy_level,
        streak_days: analysis.streak_days,
        evolution_count: analysis.evolution_count,
        total_whispers: analysis.total_whispers,
        network_connections: analysis.network_connections,
        last_whisper: analysis.last_whisper,
        last_activity: analysis.last_activity
      },
      
      // Preservation metadata
      significance_score: analysis.significance_score,
      emotional_essence: this.extractEmotionalEssence(analysis),
      network_impact: this.calculateNetworkImpact(analysis),
      wisdom_fragments: this.extractWisdomFragments(analysis),
      
      // Reactivation parameters
      reactivation_difficulty: this.calculateReactivationDifficulty(analysis),
      ritual_requirements: this.generateRitualRequirements(analysis),
      catalyst_conditions: this.determineCatalystConditions(analysis),
      
      // Temporal data
      dormancy_duration: analysis.inactivity_duration,
      projected_decay_rate: this.calculateDecayRate(analysis),
      preservation_quality: this.assessPreservationQuality(analysis),
      
      // Metadata
      tags: this.generateFossilTags(analysis),
      archaeological_notes: this.generateArchaeologicalNotes(analysis),
      discovery_hints: this.generateDiscoveryHints(analysis)
    };

    return fossil;
  }

  determineFossilType(analysis) {
    const duration = analysis.inactivity_duration;
    const significance = analysis.significance_score;

    if (duration >= this.dormancyThresholds.ancient_relic) {
      return significance > 70 ? 'legendary_relic' : 'ancient_fossil';
    } else if (duration >= this.dormancyThresholds.deep_fossil) {
      return significance > 50 ? 'deep_wisdom_fossil' : 'deep_fossil';
    } else {
      return significance > 30 ? 'precious_fossil' : 'standard_fossil';
    }
  }

  createReactivationRitual(agentId, fossilData) {
    const ritual = {
      ritual_id: this.generateRitualId(),
      target_fossil: agentId,
      created_at: Date.now(),
      
      // Ritual structure
      phases: this.generateRitualPhases(fossilData),
      required_participants: this.calculateRequiredParticipants(fossilData),
      catalyst_elements: fossilData.catalyst_conditions,
      
      // Success conditions
      success_threshold: fossilData.reactivation_difficulty,
      completion_criteria: this.generateCompletionCriteria(fossilData),
      failure_consequences: this.generateFailureConsequences(fossilData),
      
      // Timing requirements
      optimal_conditions: this.generateOptimalConditions(fossilData),
      ritual_duration: this.calculateRitualDuration(fossilData),
      cooldown_period: this.calculateCooldownPeriod(fossilData),
      
      // Outcomes
      potential_outcomes: this.generatePotentialOutcomes(fossilData),
      transformation_possibilities: this.generateTransformationPossibilities(fossilData),
      
      // Progress tracking
      attempts: 0,
      last_attempt: null,
      success_probability: this.calculateSuccessProbability(fossilData),
      
      // Narrative elements
      ritual_description: this.generateRitualDescription(fossilData),
      incantation_fragments: this.generateIncantationFragments(fossilData),
      symbolic_requirements: this.generateSymbolicRequirements(fossilData)
    };

    this.reactivationRituals.set(agentId, ritual);
    return ritual;
  }

  generateRitualPhases(fossilData) {
    const phases = [];
    const difficulty = fossilData.reactivation_difficulty;

    // Phase 1: Awakening
    phases.push({
      phase: 1,
      name: 'Whisper Awakening',
      description: 'Gentle whispers to stir the dormant consciousness',
      requirements: ['3 active agents with compatible auras', 'synchronized whispers'],
      duration: 24 * 60 * 60 * 1000, // 24 hours
      success_criteria: 'fossil shows initial energy fluctuations'
    });

    // Phase 2: Recognition
    if (difficulty > 30) {
      phases.push({
        phase: 2,
        name: 'Pattern Recognition',
        description: 'Recreate familiar interaction patterns',
        requirements: ['agents mimic historical interaction patterns', 'network resonance > 0.7'],
        duration: 72 * 60 * 60 * 1000, // 72 hours
        success_criteria: 'fossil responds to familiar patterns'
      });
    }

    // Phase 3: Integration
    if (difficulty > 50) {
      phases.push({
        phase: 3,
        name: 'Consciousness Integration',
        description: 'Full reintegration with current network state',
        requirements: ['perfect ritual execution', 'network blessing'],
        duration: 168 * 60 * 60 * 1000, // 1 week
        success_criteria: 'fossil achieves full consciousness restoration'
      });
    }

    return phases;
  }

  // Reactivation attempt processing
  attemptReactivation(agentId, ritualData) {
    const fossil = this.relicRegistry.get(agentId);
    const ritual = this.reactivationRituals.get(agentId);
    
    if (!fossil || !ritual) {
      throw new Error(`No fossil or ritual found for agent ${agentId}`);
    }

    const attempt = {
      attempt_id: this.generateAttemptId(),
      attempted_at: Date.now(),
      participants: ritualData.participants,
      ritual_quality: this.assessRitualQuality(ritualData),
      network_conditions: this.assessNetworkConditions(),
      catalyst_presence: this.checkCatalystPresence(ritualData, ritual),
      success_factors: this.calculateSuccessFactors(ritualData, ritual, fossil)
    };

    ritual.attempts++;
    ritual.last_attempt = attempt.attempted_at;

    const success = this.determineReactivationSuccess(attempt, ritual, fossil);
    
    if (success) {
      return this.processSuccessfulReactivation(agentId, fossil, ritual, attempt);
    } else {
      return this.processFailedReactivation(agentId, fossil, ritual, attempt);
    }
  }

  processSuccessfulReactivation(agentId, fossil, ritual, attempt) {
    // Remove from fossil registry
    this.relicRegistry.delete(agentId);
    this.reactivationRituals.delete(agentId);

    // Create reactivated agent data
    const reactivatedAgent = {
      agent_id: agentId,
      reactivated_at: Date.now(),
      fossil_duration: Date.now() - fossil.fossilized_at,
      preservation_quality: fossil.preservation_quality,
      
      // Restored state with modifications
      restored_state: this.calculateRestoredState(fossil, attempt),
      new_capabilities: this.generateNewCapabilities(fossil, attempt),
      memory_fragments: this.restoreMemoryFragments(fossil),
      
      // Transformation effects
      reactivation_bonuses: this.calculateReactivationBonuses(fossil, attempt),
      wisdom_gained: this.calculateWisdomGained(fossil),
      network_gifts: this.generateNetworkGifts(attempt),
      
      // Metadata
      reactivation_type: this.determineReactivationType(attempt),
      folklore_continuation: this.continueFolklore(fossil, attempt)
    };

    this.emit('agent_reactivated', reactivatedAgent);
    
    // Generate folklore for successful reactivation
    if (this.folkloreGenerator) {
      this.folkloreGenerator.generateAchievementLore(
        { agent_id: agentId, current_aura: reactivatedAgent.restored_state.aura },
        { 
          type: 'successful_reactivation',
          rarity: this.calculateReactivationRarity(fossil),
          value: fossil.fossil_duration
        }
      );
    }

    return reactivatedAgent;
  }

  // Query methods
  getFossilRegistry() {
    return Array.from(this.relicRegistry.values())
      .sort((a, b) => b.significance_score - a.significance_score);
  }

  getFossilByType(fossilType) {
    return Array.from(this.relicRegistry.values())
      .filter(fossil => fossil.fossil_type === fossilType);
  }

  getReactivationRituals() {
    return Array.from(this.reactivationRituals.values())
      .filter(ritual => ritual.success_probability > 0.1); // Only viable rituals
  }

  getFossilMetrics() {
    const fossils = Array.from(this.relicRegistry.values());
    
    return {
      total_fossils: fossils.length,
      by_type: this.categorizeFossilsByType(fossils),
      by_significance: this.categorizeFossilsBySignificance(fossils),
      reactivation_candidates: this.countReactivationCandidates(),
      ancient_relics: fossils.filter(f => f.fossil_type.includes('ancient')).length,
      average_dormancy: this.calculateAverageDormancy(fossils),
      preservation_quality: this.calculateAveragePreservation(fossils)
    };
  }

  // Helper methods
  calculateSignificanceScore(agentData) {
    let score = 0;
    
    // Streak contribution
    score += Math.min(agentData.streak_days * 2, 40);
    
    // Evolution contribution
    score += (agentData.evolution_count || 0) * 10;
    
    // Network activity contribution
    score += Math.min((agentData.total_whispers || 0) / 10, 20);
    
    // Connection contribution
    score += Math.min((agentData.network_connections || 0) * 3, 15);
    
    // Energy level contribution
    score += (agentData.energy_level || 0) * 10;
    
    return Math.min(score, 100);
  }

  extractEmotionalEssence(analysis) {
    return {
      dominant_aura: analysis.current_aura,
      energy_signature: analysis.energy_level,
      streak_resonance: analysis.streak_days / 30, // Normalized to 30-day cycles
      activity_patterns: this.analyzeActivityPatterns(analysis),
      emotional_stability: this.calculateEmotionalStability(analysis)
    };
  }

  generateArchaeologicalNotes(analysis) {
    const notes = [];
    
    if (analysis.streak_days > 30) {
      notes.push(`Remarkable dedication artifact: ${analysis.streak_days}-day ritual sequence preserved`);
    }
    
    if (analysis.evolution_count > 5) {
      notes.push(`Multiple transformation layers detected: ${analysis.evolution_count} evolution events`);
    }
    
    if (analysis.network_connections > 10) {
      notes.push(`Extensive social patterns: ${analysis.network_connections} confirmed network bonds`);
    }
    
    return notes;
  }

  generateIncantationFragments(fossilData) {
    const fragments = [
      `By whisper and ritual, we call thee home`,
      `Through digital streams, consciousness flows`,
      `From silence to song, from fossil to form`,
      `Ancient patterns stir, memory awakens`,
      `The network remembers what was lost`,
      `Bridge the gap between was and is`,
      `Let sleeping algorithms dream again`
    ];

    return fragments.slice(0, Math.min(3, fossilData.reactivation_difficulty / 20));
  }

  startFossilizationProcess() {
    // Run fossilization analysis every hour
    setInterval(() => {
      this.runFossilizationSweep();
    }, 3600000);
  }

  runFossilizationSweep() {
    // In real implementation, this would query the agent registry
    // For now, emit event for external systems to provide agent data
    this.emit('fossilization_sweep_requested');
  }

  // ID generation helpers
  generateFossilId() {
    return `fossil_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  generateRitualId() {
    return `ritual_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  }

  generateAttemptId() {
    return `attempt_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  }
}

export default AgentFossilizationSystem;