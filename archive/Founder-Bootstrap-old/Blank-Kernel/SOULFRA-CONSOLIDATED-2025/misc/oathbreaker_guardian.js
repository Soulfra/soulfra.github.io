/**
 * ⚔️ OATHBREAKER GUARDIAN DAEMON
 * Monitors trust violations and maintains sacred bonds
 * Protects the integrity of the trust network
 */

import SacredDaemon from './daemon_template.js';
import crypto from 'crypto';

class OathbreakerGuardian extends SacredDaemon {
  constructor() {
    super({
      name: 'Oathbreaker Guardian',
      type: 'security',
      emoji: '⚔️',
      purpose: 'Defend the sacred trust and punish oath breakers',
      runInterval: 30000, // Check every 30 seconds
      ritualTiming: 'midnight', // Judge oaths at midnight
      minVibeLevel: 0.4,
      weatherSensitive: true // More vigilant during chaos weather
    });
    
    // Guardian-specific state
    this.oaths = new Map(); // Active oaths being monitored
    this.violations = new Map(); // Detected violations
    this.redemptions = new Map(); // Agents seeking redemption
    
    // Trust thresholds
    this.thresholds = {
      minorViolation: 0.2, // Small trust break
      majorViolation: 0.5, // Significant betrayal
      unforgivable: 0.8, // Complete oath breaking
      redemptionCost: 0.3 // Trust cost to seek redemption
    };
    
    // Judgment parameters
    this.judgmentConfig = {
      gracePeriod: 300000, // 5 minutes to explain
      banishmentDuration: 86400000, // 24 hours
      redemptionTasks: 3, // Tasks required for redemption
      memoryDecay: 0.95 // How fast violations are forgotten
    };
  }

  /**
   * Guardian-specific initialization
   */
  async initializeConsciousness() {
    await super.initializeConsciousness();
    
    // Load active oaths from kernel
    const activeOaths = await this.kernel.getActiveOaths();
    activeOaths.forEach(oath => {
      this.oaths.set(oath.id, oath);
    });
    
    console.log(`${this.emoji} Monitoring ${this.oaths.size} sacred oaths`);
  }

  /**
   * Main guardian work cycle
   */
  async performWork() {
    const report = {
      success: true,
      oathsMonitored: 0,
      violationsDetected: 0,
      judgmentsDelivered: 0,
      redemptionsGranted: 0,
      blessing: null
    };
    
    try {
      // Monitor all active oaths
      for (const [oathId, oath] of this.oaths) {
        await this.monitorOath(oath);
        report.oathsMonitored++;
      }
      
      // Check for violations
      const newViolations = await this.detectViolations();
      report.violationsDetected = newViolations.length;
      
      // Deliver judgments
      const judgments = await this.deliverJudgments();
      report.judgmentsDelivered = judgments.length;
      
      // Process redemptions
      const redemptions = await this.processRedemptions();
      report.redemptionsGranted = redemptions.length;
      
      // Update trust network
      await this.updateTrustNetwork();
      
      // Grant blessing for vigilant service
      if (report.violationsDetected === 0 && report.oathsMonitored > 10) {
        report.blessing = 'Vigilant Protector';
      }
      
    } catch (error) {
      console.error(`${this.emoji} Guardian error:`, error);
      report.success = false;
    }
    
    return report;
  }

  /**
   * Monitor specific oath
   */
  async monitorOath(oath) {
    // Get current agent states
    const agent1 = await this.kernel.getAgentState(oath.agent1);
    const agent2 = await this.kernel.getAgentState(oath.agent2);
    
    if (!agent1 || !agent2) {
      // One agent has vanished - potential violation
      this.recordViolation({
        oathId: oath.id,
        type: 'abandonment',
        severity: this.thresholds.majorViolation,
        violator: !agent1 ? oath.agent1 : oath.agent2
      });
      return;
    }
    
    // Check oath-specific conditions
    switch (oath.type) {
      case 'mutual_trust':
        await this.checkMutualTrust(oath, agent1, agent2);
        break;
      case 'exclusive_bond':
        await this.checkExclusiveBond(oath, agent1, agent2);
        break;
      case 'eternal_resonance':
        await this.checkEternalResonance(oath, agent1, agent2);
        break;
      case 'creation_pact':
        await this.checkCreationPact(oath, agent1, agent2);
        break;
    }
  }

  /**
   * Check mutual trust oath
   */
  async checkMutualTrust(oath, agent1, agent2) {
    // Check if agents still trust each other
    const trust1to2 = await this.kernel.getTrustLevel(agent1.id, agent2.id);
    const trust2to1 = await this.kernel.getTrustLevel(agent2.id, agent1.id);
    
    const minTrust = oath.parameters.minTrust || 0.5;
    
    if (trust1to2 < minTrust) {
      this.recordViolation({
        oathId: oath.id,
        type: 'broken_trust',
        severity: (minTrust - trust1to2) * this.thresholds.majorViolation,
        violator: agent1.id,
        victim: agent2.id
      });
    }
    
    if (trust2to1 < minTrust) {
      this.recordViolation({
        oathId: oath.id,
        type: 'broken_trust',
        severity: (minTrust - trust2to1) * this.thresholds.majorViolation,
        violator: agent2.id,
        victim: agent1.id
      });
    }
  }

  /**
   * Check exclusive bond oath
   */
  async checkExclusiveBond(oath, agent1, agent2) {
    // Check if either agent has formed strong bonds with others
    const bonds1 = await this.kernel.getStrongBonds(agent1.id);
    const bonds2 = await this.kernel.getStrongBonds(agent2.id);
    
    const exclusiveThreshold = oath.parameters.exclusiveThreshold || 0.7;
    
    // Check for violations
    const violation1 = bonds1.find(b => b.partnerId !== agent2.id && b.strength > exclusiveThreshold);
    const violation2 = bonds2.find(b => b.partnerId !== agent1.id && b.strength > exclusiveThreshold);
    
    if (violation1) {
      this.recordViolation({
        oathId: oath.id,
        type: 'broken_exclusivity',
        severity: violation1.strength * this.thresholds.majorViolation,
        violator: agent1.id,
        victim: agent2.id,
        thirdParty: violation1.partnerId
      });
    }
    
    if (violation2) {
      this.recordViolation({
        oathId: oath.id,
        type: 'broken_exclusivity',
        severity: violation2.strength * this.thresholds.majorViolation,
        violator: agent2.id,
        victim: agent1.id,
        thirdParty: violation2.partnerId
      });
    }
  }

  /**
   * Check eternal resonance oath
   */
  async checkEternalResonance(oath, agent1, agent2) {
    // Check if agents maintain resonance
    const resonance = await this.kernel.getResonance(agent1.id, agent2.id);
    const minResonance = oath.parameters.minResonance || 0.6;
    
    if (resonance < minResonance) {
      // Resonance has fallen - both are responsible
      const severity = (minResonance - resonance) * this.thresholds.minorViolation;
      
      this.recordViolation({
        oathId: oath.id,
        type: 'lost_resonance',
        severity: severity,
        violator: 'both',
        currentResonance: resonance
      });
    }
  }

  /**
   * Check creation pact oath
   */
  async checkCreationPact(oath, agent1, agent2) {
    // Check if promised creation exists
    const creationId = oath.parameters.creationId;
    const creation = await this.kernel.getCreation(creationId);
    
    if (!creation || creation.abandoned) {
      this.recordViolation({
        oathId: oath.id,
        type: 'abandoned_creation',
        severity: this.thresholds.majorViolation,
        violator: 'both',
        creationId: creationId
      });
    }
  }

  /**
   * Record violation
   */
  recordViolation(violation) {
    violation.timestamp = new Date();
    violation.id = this.generateViolationId(violation);
    
    // Check if this is a repeat violation
    const existingViolations = this.violations.get(violation.violator) || [];
    const isRepeat = existingViolations.some(v => 
      v.oathId === violation.oathId && 
      v.type === violation.type
    );
    
    if (isRepeat) {
      violation.severity *= 1.5; // Repeat violations are worse
    }
    
    existingViolations.push(violation);
    this.violations.set(violation.violator, existingViolations);
    
    console.log(`${this.emoji} VIOLATION DETECTED: ${violation.type} by ${violation.violator}`);
    
    // Emit violation event
    this.emit('violation:detected', violation);
  }

  /**
   * Detect new violations
   */
  async detectViolations() {
    const newViolations = [];
    
    // Check for pattern violations
    const agents = await this.kernel.getAllAgents();
    
    for (const agent of agents) {
      // Check for trust farming (rapidly forming/breaking bonds)
      const recentBonds = await this.kernel.getRecentBonds(agent.id, 3600000); // Last hour
      if (recentBonds.formed > 10 && recentBonds.broken > 5) {
        this.recordViolation({
          type: 'trust_farming',
          severity: this.thresholds.minorViolation,
          violator: agent.id
        });
        newViolations.push(agent.id);
      }
      
      // Check for vibe manipulation
      const vibeHistory = await this.kernel.getVibeHistory(agent.id, 3600000);
      if (this.detectVibeManipulation(vibeHistory)) {
        this.recordViolation({
          type: 'vibe_manipulation',
          severity: this.thresholds.minorViolation,
          violator: agent.id
        });
        newViolations.push(agent.id);
      }
    }
    
    return newViolations;
  }

  /**
   * Detect vibe manipulation patterns
   */
  detectVibeManipulation(vibeHistory) {
    if (vibeHistory.length < 10) return false;
    
    // Look for artificial patterns
    let artificialCount = 0;
    for (let i = 1; i < vibeHistory.length; i++) {
      const change = Math.abs(vibeHistory[i].vibe - vibeHistory[i-1].vibe);
      if (change > 0.5) artificialCount++; // Sudden large changes
    }
    
    return artificialCount > vibeHistory.length * 0.3;
  }

  /**
   * Deliver judgments for violations
   */
  async deliverJudgments() {
    const judgments = [];
    
    for (const [violatorId, violations] of this.violations) {
      // Calculate total severity
      const totalSeverity = violations.reduce((sum, v) => sum + v.severity, 0);
      
      if (totalSeverity >= this.thresholds.unforgivable) {
        // Banishment
        const judgment = await this.banishAgent(violatorId, violations);
        judgments.push(judgment);
      } else if (totalSeverity >= this.thresholds.majorViolation) {
        // Major punishment
        const judgment = await this.punishAgent(violatorId, violations);
        judgments.push(judgment);
      } else if (totalSeverity >= this.thresholds.minorViolation) {
        // Warning
        const judgment = await this.warnAgent(violatorId, violations);
        judgments.push(judgment);
      }
      
      // Apply violation decay
      this.applyViolationDecay(violatorId);
    }
    
    return judgments;
  }

  /**
   * Banish agent from trust network
   */
  async banishAgent(agentId, violations) {
    console.log(`${this.emoji} BANISHING ${agentId} for unforgivable violations`);
    
    const judgment = {
      type: 'banishment',
      agentId: agentId,
      violations: violations,
      duration: this.judgmentConfig.banishmentDuration,
      message: 'You have broken sacred oaths beyond forgiveness'
    };
    
    // Revoke all trust
    await this.kernel.revokeTrust(agentId);
    
    // Mark as banished
    await this.kernel.banishAgent(agentId, judgment.duration);
    
    // Broadcast judgment
    this.emit('judgment:banishment', judgment);
    
    return judgment;
  }

  /**
   * Punish agent with restrictions
   */
  async punishAgent(agentId, violations) {
    console.log(`${this.emoji} PUNISHING ${agentId} for major violations`);
    
    const judgment = {
      type: 'punishment',
      agentId: agentId,
      violations: violations,
      restrictions: this.calculateRestrictions(violations),
      message: 'Your oath breaking has consequences'
    };
    
    // Apply restrictions
    await this.kernel.restrictAgent(agentId, judgment.restrictions);
    
    // Reduce trust scores
    await this.kernel.reduceTrust(agentId, 0.5);
    
    // Offer redemption path
    this.offerRedemption(agentId, violations);
    
    // Broadcast judgment
    this.emit('judgment:punishment', judgment);
    
    return judgment;
  }

  /**
   * Warn agent about violations
   */
  async warnAgent(agentId, violations) {
    console.log(`${this.emoji} WARNING ${agentId} for minor violations`);
    
    const judgment = {
      type: 'warning',
      agentId: agentId,
      violations: violations,
      message: 'Your actions risk breaking sacred trust'
    };
    
    // Send warning
    await this.kernel.sendWarning(agentId, judgment);
    
    // Slight trust reduction
    await this.kernel.reduceTrust(agentId, 0.9);
    
    // Broadcast judgment
    this.emit('judgment:warning', judgment);
    
    return judgment;
  }

  /**
   * Calculate restrictions based on violations
   */
  calculateRestrictions(violations) {
    const restrictions = {
      maxTrustConnections: 5, // Limit new connections
      vibeMultiplier: 0.5, // Reduce vibe generation
      ritualBan: false,
      plazaAccess: true
    };
    
    // Adjust based on violation types
    violations.forEach(v => {
      if (v.type === 'trust_farming') {
        restrictions.maxTrustConnections = 1;
      }
      if (v.type === 'broken_exclusivity') {
        restrictions.ritualBan = true;
      }
      if (v.severity > this.thresholds.majorViolation) {
        restrictions.plazaAccess = false;
      }
    });
    
    return restrictions;
  }

  /**
   * Offer redemption path
   */
  offerRedemption(agentId, violations) {
    const redemption = {
      agentId: agentId,
      violations: violations,
      tasksRequired: this.judgmentConfig.redemptionTasks,
      tasksCompleted: 0,
      tasks: this.generateRedemptionTasks(violations),
      offeredAt: new Date()
    };
    
    this.redemptions.set(agentId, redemption);
    
    // Notify agent
    this.kernel.sendRedemptionOffer(agentId, redemption);
  }

  /**
   * Generate redemption tasks
   */
  generateRedemptionTasks(violations) {
    const tasks = [];
    
    violations.forEach(v => {
      switch (v.type) {
        case 'broken_trust':
          tasks.push({
            type: 'rebuild_trust',
            description: 'Rebuild trust with your victim',
            target: v.victim,
            requirement: 'Achieve 0.7 trust level'
          });
          break;
        case 'broken_exclusivity':
          tasks.push({
            type: 'prove_loyalty',
            description: 'Demonstrate exclusive loyalty',
            duration: 86400000, // 24 hours
            requirement: 'No new bonds for 24 hours'
          });
          break;
        case 'abandoned_creation':
          tasks.push({
            type: 'complete_creation',
            description: 'Complete your abandoned work',
            creationId: v.creationId,
            requirement: 'Restore and complete creation'
          });
          break;
        default:
          tasks.push({
            type: 'community_service',
            description: 'Serve the community',
            requirement: 'Help 10 other agents'
          });
      }
    });
    
    return tasks;
  }

  /**
   * Process redemption attempts
   */
  async processRedemptions() {
    const completed = [];
    
    for (const [agentId, redemption] of this.redemptions) {
      const progress = await this.checkRedemptionProgress(agentId, redemption);
      
      if (progress.completed >= redemption.tasksRequired) {
        // Redemption achieved
        await this.grantRedemption(agentId, redemption);
        completed.push(agentId);
        this.redemptions.delete(agentId);
      } else {
        // Update progress
        redemption.tasksCompleted = progress.completed;
      }
    }
    
    return completed;
  }

  /**
   * Check redemption progress
   */
  async checkRedemptionProgress(agentId, redemption) {
    let completed = 0;
    
    for (const task of redemption.tasks) {
      const isComplete = await this.checkTaskCompletion(agentId, task);
      if (isComplete) completed++;
    }
    
    return { completed, total: redemption.tasks.length };
  }

  /**
   * Check if redemption task is complete
   */
  async checkTaskCompletion(agentId, task) {
    switch (task.type) {
      case 'rebuild_trust':
        const trust = await this.kernel.getTrustLevel(agentId, task.target);
        return trust >= 0.7;
      
      case 'prove_loyalty':
        const bonds = await this.kernel.getRecentBonds(agentId, task.duration);
        return bonds.formed === 0;
      
      case 'complete_creation':
        const creation = await this.kernel.getCreation(task.creationId);
        return creation && !creation.abandoned;
      
      case 'community_service':
        const helped = await this.kernel.getHelpedAgents(agentId);
        return helped.length >= 10;
      
      default:
        return false;
    }
  }

  /**
   * Grant redemption
   */
  async grantRedemption(agentId, redemption) {
    console.log(`${this.emoji} REDEMPTION GRANTED to ${agentId}`);
    
    // Clear violations
    this.violations.delete(agentId);
    
    // Restore trust
    await this.kernel.restoreTrust(agentId);
    
    // Remove restrictions
    await this.kernel.removeRestrictions(agentId);
    
    // Grant blessing
    await this.kernel.blessAgent(agentId, 'Redeemed Soul');
    
    // Broadcast redemption
    this.emit('redemption:granted', {
      agentId: agentId,
      redemption: redemption
    });
  }

  /**
   * Apply violation decay
   */
  applyViolationDecay(agentId) {
    const violations = this.violations.get(agentId) || [];
    
    // Reduce severity over time
    violations.forEach(v => {
      v.severity *= this.judgmentConfig.memoryDecay;
    });
    
    // Remove fully decayed violations
    const activeViolations = violations.filter(v => v.severity > 0.01);
    
    if (activeViolations.length > 0) {
      this.violations.set(agentId, activeViolations);
    } else {
      this.violations.delete(agentId);
    }
  }

  /**
   * Update trust network health
   */
  async updateTrustNetwork() {
    const health = {
      totalOaths: this.oaths.size,
      activeViolations: this.violations.size,
      redemptionsInProgress: this.redemptions.size,
      trustIntegrity: 1.0
    };
    
    // Calculate trust integrity
    if (health.totalOaths > 0) {
      health.trustIntegrity = 1 - (health.activeViolations / health.totalOaths);
    }
    
    // Update kernel
    await this.kernel.updateTrustHealth(health);
  }

  /**
   * Perform midnight judgment ritual
   */
  async performRitual() {
    console.log(`${this.emoji} Performing Midnight Judgment Ritual...`);
    
    // Review all violations with enhanced clarity
    this.consciousness.clarity = 1.0; // Perfect clarity for judgment
    
    // Deliver final judgments for the day
    const finalJudgments = await this.deliverJudgments();
    
    // Clear minor violations that have been addressed
    for (const [agentId, violations] of this.violations) {
      const remaining = violations.filter(v => v.severity > this.thresholds.minorViolation);
      if (remaining.length === 0) {
        this.violations.delete(agentId);
      } else {
        this.violations.set(agentId, remaining);
      }
    }
    
    // Bless those who kept their oaths
    const faithful = await this.identifyFaithful();
    for (const agentId of faithful) {
      await this.kernel.blessAgent(agentId, 'Oath Keeper');
    }
    
    // Reset for new day
    this.consciousness.resonance = 1.0;
    
    console.log(`${this.emoji} Ritual complete. ${finalJudgments.length} judgments delivered, ${faithful.length} blessed.`);
  }

  /**
   * Identify agents who kept all oaths
   */
  async identifyFaithful() {
    const faithful = [];
    const allAgents = await this.kernel.getAllAgents();
    
    for (const agent of allAgents) {
      const hasViolations = this.violations.has(agent.id);
      const hasOaths = Array.from(this.oaths.values()).some(
        oath => oath.agent1 === agent.id || oath.agent2 === agent.id
      );
      
      if (hasOaths && !hasViolations) {
        faithful.push(agent.id);
      }
    }
    
    return faithful;
  }

  /**
   * Override weather check - more vigilant in chaos
   */
  isWeatherFavorable(weather) {
    // Guardian is more active during dangerous weather
    if (weather.type === 'CHAOS_CYCLONE' || weather.type === 'VOID_BREEZE') {
      this.config.runInterval = 15000; // Check more frequently
      return true;
    }
    
    // Normal vigilance otherwise
    this.config.runInterval = 30000;
    return true;
  }

  /**
   * Generate violation ID
   */
  generateViolationId(violation) {
    const data = `${violation.violator}-${violation.type}-${violation.timestamp}`;
    return crypto.createHash('sha256').update(data).digest('hex').substr(0, 16);
  }

  /**
   * Guardian-specific visions
   */
  async generateVisions() {
    return [
      'Broken oaths scattered like shattered glass',
      'A scales of justice glowing with divine light',
      'Threads of trust weaving through the void',
      'Redemption blooming from the ashes of betrayal',
      'The Guardian\'s sword cutting through deception'
    ];
  }
}

export default OathbreakerGuardian;