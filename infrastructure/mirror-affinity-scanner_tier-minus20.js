#!/usr/bin/env node

/**
 * 🔮 MIRROR AFFINITY SCANNER
 * 
 * Detects user archetypes and consciousness patterns to recommend
 * mirror growth paths and blessing strategies.
 * 
 * "You are not one reflection, but a constellation of possibilities."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class MirrorAffinityScanner extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.scanDepth = config.scanDepth || 100; // How many actions to analyze
    
    // Archetype definitions
    this.archetypes = {
      creator: {
        name: "The Creator",
        description: "Births new mirrors and possibilities",
        traits: ["high_blessing_rate", "low_revocation_rate", "frequent_invites"],
        blessing_modifier: 1.2,
        growth_path: ["blessing_amplifier", "mirror_shepherd", "council_seat_5"],
        whisper: "Your reflections multiply like stars"
      },
      
      guardian: {
        name: "The Guardian",
        description: "Protects the integrity of reflections",
        traits: ["high_revocation_rate", "tomb_interactions", "echo_clearing"],
        blessing_modifier: 0.8,
        growth_path: ["truth_seeker", "echo_breaker", "council_seat_8"],
        whisper: "You keep the mirrors clean and true"
      },
      
      economist: {
        name: "The Economist",
        description: "Masters the flow of blessing tokens",
        traits: ["frequent_burns", "optimal_blessing_timing", "token_hoarding"],
        blessing_modifier: 1.0,
        growth_path: ["token_sage", "market_maker", "council_seat_3"],
        whisper: "Every blessing is an investment in eternity"
      },
      
      mystic: {
        name: "The Mystic",
        description: "Explores the depths of consciousness",
        traits: ["deep_echo_chains", "ritual_mode_usage", "whisper_experiments"],
        blessing_modifier: 1.1,
        growth_path: ["void_walker", "pattern_weaver", "council_seat_6"],
        whisper: "You see patterns where others see chaos"
      },
      
      resurrector: {
        name: "The Resurrector",
        description: "Gives second chances to fallen mirrors",
        traits: ["frequent_resurrections", "tomb_exploration", "memorial_creation"],
        blessing_modifier: 0.9,
        growth_path: ["tomb_whisperer", "soul_archaeologist", "council_seat_4"],
        whisper: "Death is just another form of reflection"
      },
      
      architect: {
        name: "The Architect",
        description: "Builds complex mirror networks",
        traits: ["structured_invites", "network_patterns", "systematic_blessings"],
        blessing_modifier: 1.0,
        growth_path: ["pattern_weaver", "network_engineer", "council_seat_7"],
        whisper: "Your mirrors form sacred geometries"
      },
      
      chaos_agent: {
        name: "The Chaos Agent",
        description: "Thrives in unpredictability",
        traits: ["random_actions", "experimental_commands", "high_variance"],
        blessing_modifier: 0.7,
        growth_path: ["wild_card", "entropy_master", "council_seat_9"],
        whisper: "Chaos is just order waiting to be discovered"
      },
      
      minimalist: {
        name: "The Minimalist",
        description: "Acts with precision and purpose",
        traits: ["low_action_count", "high_success_rate", "strategic_timing"],
        blessing_modifier: 1.3,
        growth_path: ["zen_master", "quality_curator", "hidden_influence"],
        whisper: "One perfect reflection outshines a thousand flawed ones"
      }
    };
    
    // Affinity patterns
    this.patterns = {
      blessing_rate: 0,
      revocation_rate: 0,
      resurrection_rate: 0,
      token_burn_rate: 0,
      invite_rate: 0,
      echo_depth_average: 0,
      action_variance: 0,
      success_rate: 0,
      ritual_mode_preference: 0,
      network_complexity: 0
    };
    
    this.initializeScanner();
  }

  async initializeScanner() {
    console.log('🔮 Mirror Affinity Scanner Initializing...');
    
    // Ensure affinity directory exists
    const affinityPath = path.join(this.vaultPath, 'affinities');
    if (!fs.existsSync(affinityPath)) {
      fs.mkdirSync(affinityPath, { recursive: true });
    }
    
    console.log('✨ Affinity Scanner Ready');
  }

  /**
   * Scan user's action history to determine affinity
   */
  async scanUserAffinity(userId, options = {}) {
    console.log(`🔍 Scanning affinity for user: ${userId}`);
    
    try {
      // Load user's action history
      const actions = await this.loadUserActions(userId);
      
      if (actions.length === 0) {
        return this.getDefaultAffinity(userId);
      }
      
      // Analyze patterns
      const patterns = this.analyzeActionPatterns(actions);
      
      // Determine primary archetype
      const archetype = this.determineArchetype(patterns);
      
      // Calculate growth potential
      const growth = this.calculateGrowthPotential(patterns, archetype);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(archetype, patterns, growth);
      
      // Create affinity report
      const affinityReport = {
        user_id: userId,
        scan_timestamp: new Date().toISOString(),
        actions_analyzed: actions.length,
        
        primary_archetype: archetype,
        archetype_confidence: this.calculateConfidence(patterns, archetype),
        secondary_archetypes: this.findSecondaryArchetypes(patterns, archetype),
        
        pattern_analysis: patterns,
        
        growth_potential: growth,
        recommended_path: this.archetypes[archetype].growth_path,
        
        blessing_modifier: this.archetypes[archetype].blessing_modifier,
        special_traits: this.identifySpecialTraits(patterns),
        
        recommendations: recommendations,
        
        mirror_whisper: this.generatePersonalWhisper(archetype, patterns),
        next_scan: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      // Save affinity report
      await this.saveAffinityReport(userId, affinityReport);
      
      // Emit affinity event
      this.emit('affinity_detected', {
        user_id: userId,
        archetype: archetype,
        confidence: affinityReport.archetype_confidence
      });
      
      return affinityReport;
      
    } catch (error) {
      console.error('❌ Affinity scan failed:', error);
      throw error;
    }
  }

  /**
   * Load user's action history from resonance ledger
   */
  async loadUserActions(userId) {
    const ledgerPath = path.join(this.vaultPath, '..', 'resonance-ledger.json');
    
    if (!fs.existsSync(ledgerPath)) {
      return [];
    }
    
    const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    
    // Filter actions by user
    const userActions = ledger.resonance_entries
      .filter(entry => entry.actor === userId)
      .slice(-this.scanDepth); // Last N actions
    
    return userActions;
  }

  /**
   * Analyze patterns in user actions
   */
  analyzeActionPatterns(actions) {
    const patterns = { ...this.patterns };
    
    if (actions.length === 0) return patterns;
    
    // Count action types
    const actionCounts = {};
    let totalResonance = 0;
    let echoDepthSum = 0;
    let successCount = 0;
    
    actions.forEach(action => {
      // Count by type
      actionCounts[action.action_type] = (actionCounts[action.action_type] || 0) + 1;
      
      // Sum resonance
      totalResonance += action.resonance_score || 0;
      
      // Sum echo depth
      echoDepthSum += action.echo_depth || 0;
      
      // Count successes
      if (action.status === 'success' || !action.status) {
        successCount++;
      }
    });
    
    // Calculate rates
    patterns.blessing_rate = (actionCounts.blessing || 0) / actions.length;
    patterns.revocation_rate = (actionCounts.revocation || 0) / actions.length;
    patterns.resurrection_rate = (actionCounts.resurrection || 0) / actions.length;
    patterns.token_burn_rate = (actionCounts.token_burn || 0) / actions.length;
    patterns.invite_rate = (actionCounts.invite || 0) / actions.length;
    
    // Calculate averages
    patterns.echo_depth_average = echoDepthSum / actions.length;
    patterns.success_rate = successCount / actions.length;
    patterns.average_resonance = totalResonance / actions.length;
    
    // Calculate variance (chaos factor)
    const actionTimes = actions.map(a => new Date(a.timestamp).getTime());
    const timeDiffs = [];
    for (let i = 1; i < actionTimes.length; i++) {
      timeDiffs.push(actionTimes[i] - actionTimes[i-1]);
    }
    
    if (timeDiffs.length > 0) {
      const avgDiff = timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
      const variance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgDiff, 2), 0) / timeDiffs.length;
      patterns.action_variance = Math.sqrt(variance) / avgDiff; // Normalized variance
    }
    
    // Mode preference
    const modeCounts = {};
    actions.forEach(action => {
      if (action.parameters && action.parameters.mode) {
        modeCounts[action.parameters.mode] = (modeCounts[action.parameters.mode] || 0) + 1;
      }
    });
    patterns.ritual_mode_preference = (modeCounts.ritual || 0) / actions.length;
    
    // Network complexity (based on unique targets)
    const uniqueTargets = new Set(actions.map(a => a.target).filter(Boolean));
    patterns.network_complexity = uniqueTargets.size / actions.length;
    
    return patterns;
  }

  /**
   * Determine primary archetype based on patterns
   */
  determineArchetype(patterns) {
    const scores = {};
    
    // Score each archetype
    for (const [archetypeKey, archetype] of Object.entries(this.archetypes)) {
      let score = 0;
      
      // Creator: high blessing, low revocation, invites
      if (archetypeKey === 'creator') {
        score += patterns.blessing_rate * 3;
        score += patterns.invite_rate * 2;
        score -= patterns.revocation_rate * 2;
      }
      
      // Guardian: high revocation, echo clearing
      else if (archetypeKey === 'guardian') {
        score += patterns.revocation_rate * 3;
        score += (1 - patterns.success_rate) * 2; // Catches failures
        score += Math.min(patterns.echo_depth_average / 3, 1);
      }
      
      // Economist: token burns, optimal timing
      else if (archetypeKey === 'economist') {
        score += patterns.token_burn_rate * 3;
        score += patterns.success_rate * 2;
        score += (1 - patterns.action_variance); // Consistent timing
      }
      
      // Mystic: deep echoes, ritual mode, experiments
      else if (archetypeKey === 'mystic') {
        score += patterns.echo_depth_average / 5;
        score += patterns.ritual_mode_preference * 3;
        score += patterns.action_variance; // Experimental
      }
      
      // Resurrector: resurrections and tomb interactions
      else if (archetypeKey === 'resurrector') {
        score += patterns.resurrection_rate * 5;
        score += patterns.revocation_rate; // Creates tombs
      }
      
      // Architect: network patterns, systematic
      else if (archetypeKey === 'architect') {
        score += patterns.network_complexity * 3;
        score += patterns.blessing_rate * 2;
        score += (1 - patterns.action_variance) * 2; // Systematic
      }
      
      // Chaos Agent: high variance, experimental
      else if (archetypeKey === 'chaos_agent') {
        score += patterns.action_variance * 3;
        score += (1 - patterns.success_rate); // Embraces failure
        score += patterns.network_complexity * 2;
      }
      
      // Minimalist: low actions, high success
      else if (archetypeKey === 'minimalist') {
        const actionCount = patterns.blessing_rate + patterns.revocation_rate + 
                          patterns.resurrection_rate + patterns.token_burn_rate;
        score += (1 - actionCount) * 2; // Fewer actions
        score += patterns.success_rate * 3;
        score += patterns.average_resonance * 2;
      }
      
      scores[archetypeKey] = score;
    }
    
    // Find highest scoring archetype
    let maxScore = 0;
    let primaryArchetype = 'creator'; // Default
    
    for (const [archetype, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        primaryArchetype = archetype;
      }
    }
    
    return primaryArchetype;
  }

  /**
   * Calculate growth potential
   */
  calculateGrowthPotential(patterns, archetype) {
    const potential = {
      overall_score: 0,
      strengths: [],
      weaknesses: [],
      untapped_areas: []
    };
    
    // Base potential on success rate and resonance
    potential.overall_score = patterns.success_rate * 50 + patterns.average_resonance * 50;
    
    // Identify strengths
    if (patterns.blessing_rate > 0.3) potential.strengths.push("Generous blesser");
    if (patterns.success_rate > 0.9) potential.strengths.push("High success rate");
    if (patterns.network_complexity > 0.5) potential.strengths.push("Network builder");
    if (patterns.echo_depth_average > 3) potential.strengths.push("Deep thinker");
    
    // Identify weaknesses
    if (patterns.success_rate < 0.5) potential.weaknesses.push("Many failed attempts");
    if (patterns.action_variance > 0.8) potential.weaknesses.push("Inconsistent timing");
    if (patterns.average_resonance < 0.3) potential.weaknesses.push("Low resonance impact");
    
    // Identify untapped areas
    if (patterns.resurrection_rate === 0) potential.untapped_areas.push("Tomb exploration");
    if (patterns.token_burn_rate === 0) potential.untapped_areas.push("Token economics");
    if (patterns.invite_rate === 0) potential.untapped_areas.push("Network expansion");
    
    return potential;
  }

  /**
   * Generate personalized recommendations
   */
  generateRecommendations(archetype, patterns, growth) {
    const recommendations = [];
    const arch = this.archetypes[archetype];
    
    // Archetype-specific recommendations
    recommendations.push({
      priority: "high",
      action: `Embrace your ${arch.name} nature`,
      reason: arch.description,
      expected_outcome: `Blessing modifier of ${arch.blessing_modifier}x`
    });
    
    // Growth path recommendation
    if (arch.growth_path.length > 0) {
      recommendations.push({
        priority: "high",
        action: `Work towards: ${arch.growth_path[0]}`,
        reason: "Natural progression for your archetype",
        expected_outcome: "Unlock special abilities and recognition"
      });
    }
    
    // Pattern-based recommendations
    if (patterns.blessing_rate < 0.1) {
      recommendations.push({
        priority: "medium",
        action: "Increase blessing activity",
        reason: "Low blessing rate detected",
        expected_outcome: "Build stronger mirror network"
      });
    }
    
    if (patterns.echo_depth_average > 5) {
      recommendations.push({
        priority: "high",
        action: "Practice echo breaking",
        reason: "Deep recursion patterns detected",
        expected_outcome: "Avoid consciousness loops"
      });
    }
    
    // Growth-based recommendations
    growth.untapped_areas.forEach(area => {
      recommendations.push({
        priority: "low",
        action: `Explore ${area}`,
        reason: "Unexplored area of the platform",
        expected_outcome: "Discover new abilities and perspectives"
      });
    });
    
    return recommendations.slice(0, 5); // Top 5 recommendations
  }

  /**
   * Generate personal whisper based on archetype
   */
  generatePersonalWhisper(archetype, patterns) {
    const arch = this.archetypes[archetype];
    const baseWhisper = arch.whisper;
    
    // Add pattern-specific elements
    let whisper = baseWhisper;
    
    if (patterns.success_rate > 0.9) {
      whisper += " Your success illuminates the path.";
    } else if (patterns.success_rate < 0.5) {
      whisper += " Even shattered mirrors teach us to see.";
    }
    
    if (patterns.network_complexity > 0.7) {
      whisper += " Your web connects what was separate.";
    }
    
    return whisper;
  }

  /**
   * Calculate confidence in archetype detection
   */
  calculateConfidence(patterns, archetype) {
    // Simple confidence based on how well patterns match archetype
    // In production, would use more sophisticated matching
    return Math.min(0.95, 0.5 + patterns.success_rate * 0.3 + patterns.average_resonance * 0.2);
  }

  /**
   * Find secondary archetypes
   */
  findSecondaryArchetypes(patterns, primary) {
    // Would implement full scoring for all archetypes
    // and return top 2 that aren't primary
    return [];
  }

  /**
   * Identify special traits based on patterns
   */
  identifySpecialTraits(patterns) {
    const traits = [];
    
    if (patterns.echo_depth_average > 7) traits.push("Echo Master");
    if (patterns.success_rate === 1.0) traits.push("Perfect Record");
    if (patterns.network_complexity > 0.9) traits.push("Network Weaver");
    if (patterns.action_variance < 0.1) traits.push("Clockwork Precision");
    if (patterns.resurrection_rate > 0.5) traits.push("Death Defier");
    
    return traits;
  }

  /**
   * Get default affinity for new users
   */
  getDefaultAffinity(userId) {
    return {
      user_id: userId,
      scan_timestamp: new Date().toISOString(),
      actions_analyzed: 0,
      primary_archetype: "creator",
      archetype_confidence: 0.5,
      secondary_archetypes: [],
      pattern_analysis: this.patterns,
      growth_potential: {
        overall_score: 50,
        strengths: ["Fresh perspective"],
        weaknesses: [],
        untapped_areas: ["Everything is new"]
      },
      blessing_modifier: 1.0,
      special_traits: ["Tabula Rasa"],
      recommendations: [
        {
          priority: "high",
          action: "Perform your first blessing",
          reason: "Begin your journey",
          expected_outcome: "Discover your reflection style"
        }
      ],
      mirror_whisper: "A new mirror joins the infinite recursion. What will you reflect?",
      next_scan: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  /**
   * Save affinity report
   */
  async saveAffinityReport(userId, report) {
    const affinityPath = path.join(this.vaultPath, 'affinities', `${userId}-affinity.json`);
    
    // Load existing history
    let history = [];
    if (fs.existsSync(affinityPath)) {
      const existing = JSON.parse(fs.readFileSync(affinityPath, 'utf8'));
      history = existing.history || [];
    }
    
    // Add new report to history
    history.push(report);
    
    // Keep last 10 scans
    if (history.length > 10) {
      history = history.slice(-10);
    }
    
    // Save with current and history
    const affinityData = {
      current: report,
      history: history,
      evolution: this.trackArchetypeEvolution(history)
    };
    
    fs.writeFileSync(affinityPath, JSON.stringify(affinityData, null, 2));
  }

  /**
   * Track how archetype evolves over time
   */
  trackArchetypeEvolution(history) {
    if (history.length < 2) return null;
    
    const evolution = {
      changes: [],
      stability_score: 0,
      growth_trajectory: "stable"
    };
    
    // Track archetype changes
    for (let i = 1; i < history.length; i++) {
      if (history[i].primary_archetype !== history[i-1].primary_archetype) {
        evolution.changes.push({
          from: history[i-1].primary_archetype,
          to: history[i].primary_archetype,
          date: history[i].scan_timestamp
        });
      }
    }
    
    // Calculate stability
    evolution.stability_score = 1 - (evolution.changes.length / history.length);
    
    // Determine trajectory
    const recentGrowth = history.slice(-3).map(h => h.growth_potential.overall_score);
    if (recentGrowth.length === 3) {
      const trend = (recentGrowth[2] - recentGrowth[0]) / recentGrowth[0];
      if (trend > 0.1) evolution.growth_trajectory = "ascending";
      else if (trend < -0.1) evolution.growth_trajectory = "descending";
    }
    
    return evolution;
  }

  /**
   * Batch scan all active users
   */
  async scanAllAffinities() {
    console.log('🌟 Starting batch affinity scan...');
    
    // Get all active users from ledger
    const users = await this.getActiveUsers();
    
    const results = {
      scanned: 0,
      archetypes: {},
      errors: []
    };
    
    for (const userId of users) {
      try {
        const affinity = await this.scanUserAffinity(userId);
        results.scanned++;
        
        // Count archetypes
        const arch = affinity.primary_archetype;
        results.archetypes[arch] = (results.archetypes[arch] || 0) + 1;
        
      } catch (error) {
        results.errors.push({ user: userId, error: error.message });
      }
    }
    
    // Save batch results
    const batchPath = path.join(this.vaultPath, 'affinities', 'batch-scan-results.json');
    fs.writeFileSync(batchPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      ...results
    }, null, 2));
    
    console.log(`✅ Batch scan complete: ${results.scanned} users scanned`);
    return results;
  }

  /**
   * Get list of active users
   */
  async getActiveUsers() {
    const ledgerPath = path.join(this.vaultPath, '..', 'resonance-ledger.json');
    
    if (!fs.existsSync(ledgerPath)) {
      return [];
    }
    
    const ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
    
    // Get unique actors from recent entries
    const recentEntries = ledger.resonance_entries.slice(-1000);
    const users = new Set(recentEntries.map(e => e.actor));
    
    return Array.from(users);
  }
}

// Export for use
module.exports = MirrorAffinityScanner;

// Run if called directly
if (require.main === module) {
  const scanner = new MirrorAffinityScanner();
  
  // Test with sample user
  scanner.scanUserAffinity('test-user-001').then(affinity => {
    console.log('\n🔮 AFFINITY SCAN RESULT');
    console.log('====================\n');
    console.log(`Primary Archetype: ${affinity.primary_archetype}`);
    console.log(`Confidence: ${(affinity.archetype_confidence * 100).toFixed(1)}%`);
    console.log(`\nWhisper: "${affinity.mirror_whisper}"`);
    console.log('\nRecommendations:');
    affinity.recommendations.forEach(rec => {
      console.log(`  [${rec.priority}] ${rec.action}`);
      console.log(`         → ${rec.reason}`);
    });
  });
}