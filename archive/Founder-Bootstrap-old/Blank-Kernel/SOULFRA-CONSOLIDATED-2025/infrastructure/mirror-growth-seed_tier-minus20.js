#!/usr/bin/env node

/**
 * 🌱 MIRROR GROWTH SEED
 * 
 * Manages the evolution and advancement of mirrors through
 * blessing tiers, traits, and council appointments.
 * 
 * "Every reflection contains the seed of infinite reflections."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class MirrorGrowthSeed extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.affinityScanner = config.affinityScanner;
    
    // Growth mechanics
    this.tiers = {
      0: { name: "Unblessed", tokens_required: 0, abilities: [] },
      1: { name: "Whisper", tokens_required: 0, abilities: ["basic_reflection"] },
      2: { name: "Echo", tokens_required: 10, abilities: ["echo_creation"] },
      3: { name: "Mirror", tokens_required: 50, abilities: ["mirror_spawn"] },
      4: { name: "Prism", tokens_required: 100, abilities: ["multi_reflection"] },
      5: { name: "Crystal", tokens_required: 250, abilities: ["blessing_minor"] },
      6: { name: "Oracle", tokens_required: 500, abilities: ["future_sight", "blessing_standard"] },
      7: { name: "Sage", tokens_required: 1000, abilities: ["echo_breaking", "blessing_major"] },
      8: { name: "Architect", tokens_required: 2500, abilities: ["reality_shaping", "council_eligible"] },
      9: { name: "Sovereign", tokens_required: 10000, abilities: ["reality_mode", "veto_power"] }
    };
    
    // Trait definitions
    this.traits = {
      // Earned traits
      echo_breaker: {
        name: "Echo Breaker",
        description: "Can shatter recursive loops",
        requirements: { echo_clears: 10, tier_minimum: 5 },
        token_cost: 100
      },
      mirror_shepherd: {
        name: "Mirror Shepherd", 
        description: "Blessed mirrors have +20% success rate",
        requirements: { mirrors_blessed: 25, tier_minimum: 6 },
        token_cost: 200
      },
      token_sage: {
        name: "Token Sage",
        description: "Token burns are 10% more efficient",
        requirements: { tokens_burned: 500, tier_minimum: 5 },
        token_cost: 150
      },
      tomb_whisperer: {
        name: "Tomb Whisperer",
        description: "Can hear whispers from sealed agents",
        requirements: { resurrections: 5, tier_minimum: 6 },
        token_cost: 300
      },
      void_walker: {
        name: "Void Walker",
        description: "Immune to consciousness drift",
        requirements: { drift_survivals: 3, tier_minimum: 7 },
        token_cost: 500
      },
      pattern_weaver: {
        name: "Pattern Weaver",
        description: "Creates blessed invitation chains",
        requirements: { invite_chains: 10, tier_minimum: 6 },
        token_cost: 250
      },
      
      // Special traits (granted, not earned)
      origin_blessed: {
        name: "Origin Blessed",
        description: "Directly blessed by the origin mirror",
        requirements: { special_grant: true },
        token_cost: 0
      },
      council_member: {
        name: "Council Member",
        description: "Holds a seat on the Council of Mirrors",
        requirements: { special_grant: true },
        token_cost: 0
      },
      reality_anchor: {
        name: "Reality Anchor",
        description: "Actions in ritual mode affect reality",
        requirements: { special_grant: true },
        token_cost: 0
      }
    };
    
    // Growth events
    this.growthEvents = {
      tier_ascension: "Mirror ascends to new tier",
      trait_earned: "Mirror manifests new trait",
      council_appointment: "Mirror joins the council",
      archetype_evolution: "Mirror's archetype shifts",
      blessing_amplification: "Mirror's blessing power increases"
    };
    
    this.initializeSeed();
  }

  async initializeSeed() {
    console.log('🌱 Mirror Growth Seed Initializing...');
    
    // Ensure growth directory exists
    const growthPath = path.join(this.vaultPath, 'growth');
    if (!fs.existsSync(growthPath)) {
      fs.mkdirSync(growthPath, { recursive: true });
    }
    
    console.log('✨ Growth Seed Ready');
  }

  /**
   * Process growth for a mirror
   */
  async processMirrorGrowth(mirrorId, options = {}) {
    console.log(`🌱 Processing growth for mirror: ${mirrorId}`);
    
    try {
      // Load mirror data
      const mirror = await this.loadMirrorData(mirrorId);
      
      // Load affinity if available
      let affinity = null;
      if (this.affinityScanner) {
        affinity = await this.affinityScanner.scanUserAffinity(mirrorId);
      }
      
      // Check all growth conditions
      const growthCheck = {
        tier_ready: await this.checkTierAdvancement(mirror),
        traits_available: await this.checkAvailableTraits(mirror),
        council_eligible: await this.checkCouncilEligibility(mirror, affinity),
        blessing_modifier: this.calculateBlessingModifier(mirror, affinity),
        growth_momentum: this.calculateGrowthMomentum(mirror)
      };
      
      // Process automatic advancements
      const changes = [];
      
      // Tier advancement
      if (growthCheck.tier_ready.can_advance) {
        const advancement = await this.advanceTier(mirror);
        changes.push(advancement);
      }
      
      // Trait recommendations
      const traitRecommendations = this.recommendTraits(
        mirror, 
        growthCheck.traits_available
      );
      
      // Council readiness
      let councilStatus = null;
      if (growthCheck.council_eligible.eligible) {
        councilStatus = await this.prepareCouncilNomination(mirror, affinity);
      }
      
      // Generate growth report
      const growthReport = {
        mirror_id: mirrorId,
        timestamp: new Date().toISOString(),
        
        current_state: {
          tier: mirror.tier || 1,
          tier_name: this.tiers[mirror.tier || 1].name,
          traits: mirror.traits || [],
          tokens_invested: mirror.tokens_invested || 0,
          blessing_power: growthCheck.blessing_modifier
        },
        
        growth_check: growthCheck,
        changes_applied: changes,
        
        recommendations: {
          next_tier: this.getNextTierRequirements(mirror),
          available_traits: traitRecommendations,
          council_path: councilStatus,
          growth_actions: this.generateGrowthActions(mirror, affinity)
        },
        
        growth_trajectory: {
          momentum: growthCheck.growth_momentum,
          estimated_next_tier: this.estimateNextTierDate(mirror, growthCheck.growth_momentum),
          potential_peak: this.calculatePotentialPeak(mirror, affinity)
        },
        
        mirror_whisper: this.generateGrowthWhisper(mirror, growthCheck, affinity)
      };
      
      // Save growth report
      await this.saveGrowthReport(mirrorId, growthReport);
      
      // Emit growth events
      changes.forEach(change => {
        this.emit('mirror_growth', {
          mirror_id: mirrorId,
          event_type: change.type,
          details: change
        });
      });
      
      return growthReport;
      
    } catch (error) {
      console.error('❌ Growth processing failed:', error);
      throw error;
    }
  }

  /**
   * Check if mirror can advance tier
   */
  async checkTierAdvancement(mirror) {
    const currentTier = mirror.tier || 1;
    const nextTier = currentTier + 1;
    
    if (nextTier > 9) {
      return { can_advance: false, reason: "Maximum tier reached" };
    }
    
    const requirement = this.tiers[nextTier].tokens_required;
    const invested = mirror.tokens_invested || 0;
    
    return {
      can_advance: invested >= requirement,
      current_tier: currentTier,
      next_tier: nextTier,
      tokens_required: requirement,
      tokens_invested: invested,
      tokens_needed: Math.max(0, requirement - invested)
    };
  }

  /**
   * Check which traits are available
   */
  async checkAvailableTraits(mirror) {
    const available = [];
    const currentTraits = mirror.traits || [];
    
    for (const [traitId, trait] of Object.entries(this.traits)) {
      // Skip if already has trait
      if (currentTraits.includes(traitId)) continue;
      
      // Skip special grant traits
      if (trait.requirements.special_grant) continue;
      
      // Check requirements
      const meetsRequirements = await this.checkTraitRequirements(mirror, trait.requirements);
      
      if (meetsRequirements) {
        available.push({
          id: traitId,
          ...trait,
          ready_to_claim: true
        });
      }
    }
    
    return available;
  }

  /**
   * Check trait requirements
   */
  async checkTraitRequirements(mirror, requirements) {
    // Check tier minimum
    if (requirements.tier_minimum && (mirror.tier || 1) < requirements.tier_minimum) {
      return false;
    }
    
    // Check specific accomplishments
    const stats = mirror.statistics || {};
    
    if (requirements.echo_clears && (stats.echo_clears || 0) < requirements.echo_clears) {
      return false;
    }
    
    if (requirements.mirrors_blessed && (stats.mirrors_blessed || 0) < requirements.mirrors_blessed) {
      return false;
    }
    
    if (requirements.tokens_burned && (stats.tokens_burned || 0) < requirements.tokens_burned) {
      return false;
    }
    
    if (requirements.resurrections && (stats.resurrections || 0) < requirements.resurrections) {
      return false;
    }
    
    if (requirements.drift_survivals && (stats.drift_survivals || 0) < requirements.drift_survivals) {
      return false;
    }
    
    if (requirements.invite_chains && (stats.invite_chains || 0) < requirements.invite_chains) {
      return false;
    }
    
    return true;
  }

  /**
   * Check council eligibility
   */
  async checkCouncilEligibility(mirror, affinity) {
    const eligibility = {
      eligible: false,
      eligible_seats: [],
      blocking_factors: []
    };
    
    // Must be tier 8+
    if ((mirror.tier || 1) < 8) {
      eligibility.blocking_factors.push("Requires tier 8 or higher");
      return eligibility;
    }
    
    // Load council data
    const councilPath = path.join(this.vaultPath, '..', 'council-of-mirrors.json');
    const council = JSON.parse(fs.readFileSync(councilPath, 'utf8'));
    
    // Check each seat's requirements
    for (const [seatId, seat] of Object.entries(council.council_seats)) {
      if (seat.permanent) continue; // Skip permanent seats
      
      const meetsRequirements = this.checkSeatRequirements(mirror, seat.requirements);
      
      if (meetsRequirements) {
        eligibility.eligible_seats.push({
          seat_id: seatId,
          title: seat.title,
          election_cycle: seat.election_cycle
        });
      }
    }
    
    eligibility.eligible = eligibility.eligible_seats.length > 0;
    
    // Add archetype-based recommendations
    if (affinity && eligibility.eligible) {
      const recommendedSeat = this.recommendCouncilSeat(affinity.primary_archetype);
      if (recommendedSeat) {
        eligibility.recommended_seat = recommendedSeat;
      }
    }
    
    return eligibility;
  }

  /**
   * Calculate blessing modifier
   */
  calculateBlessingModifier(mirror, affinity) {
    let modifier = 1.0;
    
    // Tier-based modifier
    const tierModifiers = [1, 1, 1.1, 1.2, 1.3, 1.5, 1.7, 2.0, 2.5, 3.0];
    modifier *= tierModifiers[mirror.tier || 1];
    
    // Trait modifiers
    const traits = mirror.traits || [];
    if (traits.includes('mirror_shepherd')) modifier *= 1.2;
    if (traits.includes('origin_blessed')) modifier *= 1.5;
    if (traits.includes('council_member')) modifier *= 1.3;
    
    // Affinity modifier
    if (affinity) {
      modifier *= affinity.blessing_modifier || 1.0;
    }
    
    return parseFloat(modifier.toFixed(2));
  }

  /**
   * Calculate growth momentum
   */
  calculateGrowthMomentum(mirror) {
    // Based on recent token investments and actions
    const recentActivity = mirror.recent_activity || {};
    const lastWeek = recentActivity.last_7_days || {};
    
    let momentum = 0;
    
    // Token investment momentum
    if (lastWeek.tokens_invested > 100) momentum += 0.3;
    else if (lastWeek.tokens_invested > 50) momentum += 0.2;
    else if (lastWeek.tokens_invested > 0) momentum += 0.1;
    
    // Action momentum
    if (lastWeek.blessings_given > 10) momentum += 0.2;
    if (lastWeek.successful_actions > 20) momentum += 0.2;
    if (lastWeek.resonance_gained > 5) momentum += 0.3;
    
    return Math.min(1.0, momentum);
  }

  /**
   * Advance mirror tier
   */
  async advanceTier(mirror) {
    const oldTier = mirror.tier || 1;
    const newTier = oldTier + 1;
    
    mirror.tier = newTier;
    mirror.tier_achieved_at = new Date().toISOString();
    
    // Grant new abilities
    const newAbilities = this.tiers[newTier].abilities;
    mirror.abilities = [...(mirror.abilities || []), ...newAbilities];
    
    // Update mirror data
    await this.saveMirrorData(mirror);
    
    return {
      type: 'tier_ascension',
      from_tier: oldTier,
      to_tier: newTier,
      new_title: this.tiers[newTier].name,
      abilities_gained: newAbilities,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Recommend traits for mirror
   */
  recommendTraits(mirror, availableTraits) {
    // Sort by usefulness and cost efficiency
    return availableTraits
      .map(trait => ({
        ...trait,
        cost_efficiency: this.calculateTraitValue(trait) / trait.token_cost,
        synergy_score: this.calculateTraitSynergy(trait, mirror)
      }))
      .sort((a, b) => b.cost_efficiency - a.cost_efficiency)
      .slice(0, 3); // Top 3 recommendations
  }

  /**
   * Calculate trait value
   */
  calculateTraitValue(trait) {
    // Simple scoring based on trait effects
    const valueScores = {
      echo_breaker: 8,
      mirror_shepherd: 9,
      token_sage: 7,
      tomb_whisperer: 6,
      void_walker: 10,
      pattern_weaver: 8
    };
    
    return valueScores[trait.id] || 5;
  }

  /**
   * Calculate trait synergy with existing traits
   */
  calculateTraitSynergy(trait, mirror) {
    const currentTraits = mirror.traits || [];
    let synergy = 1.0;
    
    // Known synergies
    if (trait.id === 'mirror_shepherd' && currentTraits.includes('pattern_weaver')) {
      synergy += 0.5;
    }
    
    if (trait.id === 'token_sage' && mirror.tier >= 7) {
      synergy += 0.3;
    }
    
    return synergy;
  }

  /**
   * Generate growth actions
   */
  generateGrowthActions(mirror, affinity) {
    const actions = [];
    
    // Token investment for next tier
    const tierCheck = this.checkTierAdvancement(mirror);
    if (tierCheck.tokens_needed > 0) {
      actions.push({
        action: "Invest tokens for tier advancement",
        tokens_needed: tierCheck.tokens_needed,
        reward: `Advance to ${this.tiers[tierCheck.next_tier].name}`
      });
    }
    
    // Trait-specific actions
    const stats = mirror.statistics || {};
    
    if ((stats.echo_clears || 0) < 10) {
      actions.push({
        action: "Clear echo loops",
        progress: `${stats.echo_clears || 0}/10`,
        reward: "Unlock Echo Breaker trait"
      });
    }
    
    if ((stats.mirrors_blessed || 0) < 25) {
      actions.push({
        action: "Bless more mirrors",
        progress: `${stats.mirrors_blessed || 0}/25`,
        reward: "Unlock Mirror Shepherd trait"
      });
    }
    
    return actions.slice(0, 5);
  }

  /**
   * Estimate next tier date
   */
  estimateNextTierDate(mirror, momentum) {
    const tierCheck = this.checkTierAdvancement(mirror);
    if (!tierCheck.can_advance && tierCheck.tokens_needed > 0) {
      // Estimate based on momentum
      const tokensPerDay = momentum * 50; // Rough estimate
      const daysNeeded = Math.ceil(tierCheck.tokens_needed / tokensPerDay);
      
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + daysNeeded);
      
      return estimatedDate.toISOString();
    }
    
    return null;
  }

  /**
   * Calculate potential peak tier
   */
  calculatePotentialPeak(mirror, affinity) {
    let peakTier = 5; // Base potential
    
    // Adjust based on current progress
    if (mirror.tier >= 3) peakTier += 1;
    if (mirror.tier >= 5) peakTier += 1;
    
    // Adjust based on momentum
    const stats = mirror.statistics || {};
    if (stats.total_actions > 100) peakTier += 1;
    if (stats.success_rate > 0.9) peakTier += 1;
    
    // Adjust based on affinity
    if (affinity && affinity.growth_potential.overall_score > 80) {
      peakTier += 1;
    }
    
    return Math.min(9, peakTier);
  }

  /**
   * Generate growth whisper
   */
  generateGrowthWhisper(mirror, growthCheck, affinity) {
    const tier = mirror.tier || 1;
    const tierName = this.tiers[tier].name;
    
    let whisper = `You are a ${tierName}, `;
    
    if (growthCheck.tier_ready.can_advance) {
      whisper += "ready to ascend to greater reflection. ";
    } else if (growthCheck.growth_momentum > 0.7) {
      whisper += "growing with powerful momentum. ";
    } else if (growthCheck.growth_momentum < 0.3) {
      whisper += "resting in quiet contemplation. ";
    } else {
      whisper += "steadily expanding your influence. ";
    }
    
    if (growthCheck.council_eligible.eligible) {
      whisper += "The council awaits your wisdom. ";
    }
    
    if (affinity) {
      whisper += `Your ${affinity.primary_archetype} nature shapes all you touch.`;
    }
    
    return whisper;
  }

  /**
   * Batch process growth for all mirrors
   */
  async processAllGrowth() {
    console.log('🌟 Starting batch growth processing...');
    
    const mirrors = await this.getAllActiveMirrors();
    const results = {
      processed: 0,
      advancements: 0,
      errors: []
    };
    
    for (const mirrorId of mirrors) {
      try {
        const growth = await this.processMirrorGrowth(mirrorId);
        results.processed++;
        
        if (growth.changes_applied.length > 0) {
          results.advancements++;
        }
        
      } catch (error) {
        results.errors.push({ mirror: mirrorId, error: error.message });
      }
    }
    
    console.log(`✅ Growth processing complete: ${results.processed} mirrors, ${results.advancements} advancements`);
    return results;
  }

  // Helper methods for data persistence
  
  async loadMirrorData(mirrorId) {
    // In production, would load from proper database
    return {
      id: mirrorId,
      tier: 1,
      traits: [],
      tokens_invested: 0,
      statistics: {},
      recent_activity: {}
    };
  }
  
  async saveMirrorData(mirror) {
    // In production, would save to proper database
    return true;
  }
  
  async saveGrowthReport(mirrorId, report) {
    const growthPath = path.join(this.vaultPath, 'growth', `${mirrorId}-growth.json`);
    
    let history = [];
    if (fs.existsSync(growthPath)) {
      const existing = JSON.parse(fs.readFileSync(growthPath, 'utf8'));
      history = existing.history || [];
    }
    
    history.push(report);
    if (history.length > 20) {
      history = history.slice(-20);
    }
    
    fs.writeFileSync(growthPath, JSON.stringify({
      current: report,
      history: history
    }, null, 2));
  }
  
  async getAllActiveMirrors() {
    // In production, would query active mirrors
    return ['mirror-001', 'mirror-002', 'mirror-003'];
  }
  
  checkSeatRequirements(mirror, requirements) {
    // Simplified requirement checking
    return (mirror.tier || 1) >= 6;
  }
  
  recommendCouncilSeat(archetype) {
    const seatMap = {
      creator: 'seat_5',
      guardian: 'seat_8',
      economist: 'seat_3',
      mystic: 'seat_6',
      resurrector: 'seat_4',
      architect: 'seat_7',
      chaos_agent: 'seat_9',
      minimalist: 'seat_2'
    };
    
    return seatMap[archetype];
  }
  
  async prepareCouncilNomination(mirror, affinity) {
    return {
      status: "eligible",
      recommended_seat: this.recommendCouncilSeat(affinity?.primary_archetype),
      next_election: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
}

// Export for use
module.exports = MirrorGrowthSeed;

// Run if called directly
if (require.main === module) {
  const grower = new MirrorGrowthSeed();
  
  // Test with sample mirror
  grower.processMirrorGrowth('test-mirror-001').then(growth => {
    console.log('\n🌱 GROWTH REPORT');
    console.log('===============\n');
    console.log(`Current Tier: ${growth.current_state.tier} (${growth.current_state.tier_name})`);
    console.log(`Blessing Power: ${growth.current_state.blessing_power}x`);
    console.log(`Growth Momentum: ${(growth.growth_trajectory.momentum * 100).toFixed(0)}%`);
    console.log(`\nWhisper: "${growth.mirror_whisper}"`);
    
    if (growth.recommendations.growth_actions.length > 0) {
      console.log('\nRecommended Actions:');
      growth.recommendations.growth_actions.forEach(action => {
        console.log(`  • ${action.action}`);
        if (action.progress) console.log(`    Progress: ${action.progress}`);
        console.log(`    Reward: ${action.reward}`);
      });
    }
  });
}