/**
 * Agent Career Evolution System
 * Integrates with existing Soulfra infrastructure (VibeScore, ReflectionScore, VibeMeter)
 * Production-ready with enterprise customization support
 */

import fs from 'fs/promises';
import path from 'path';

class AgentCareerEvolution {
  constructor(vaultPath = './vault', careerTreePath = './career_tree.json') {
    this.vaultPath = vaultPath;
    this.careerTreePath = careerTreePath;
    this.careerTree = null;
    this.enterpriseRoles = null;
  }

  async initialize() {
    try {
      // Load career tree schema
      const careerTreeData = await fs.readFile(this.careerTreePath, 'utf8');
      this.careerTree = JSON.parse(careerTreeData);
      
      // Load enterprise custom roles if they exist
      try {
        const enterpriseRolesData = await fs.readFile('./runtime-switch.json', 'utf8');
        const runtimeConfig = JSON.parse(enterpriseRolesData);
        this.enterpriseRoles = runtimeConfig.enterprise_career_roles || {};
      } catch (error) {
        console.log('No enterprise roles found - using default career tree');
      }

      console.log('🌳 Agent Career Evolution System initialized');
    } catch (error) {
      throw new Error(`Failed to initialize career system: ${error.message}`);
    }
  }

  /**
   * Updates agent career based on current behavior and metrics
   * Integrates with existing Soulfra metrics (ReflectionScore, VibeMeter, TaskBook)
   */
  async updateAgentCareer(agentId, behaviorData) {
    try {
      // Load current agent state
      const agentState = await this.loadAgentState(agentId);
      const currentRole = agentState.career?.current_role || this.assignStartingRole(behaviorData);
      
      // Calculate evolution eligibility
      const evolutionCandidate = await this.checkEvolutionEligibility(
        currentRole, 
        behaviorData, 
        agentState
      );

      if (evolutionCandidate.canEvolve) {
        // Execute evolution
        const newRole = await this.evolveAgent(agentId, evolutionCandidate.targetRole, agentState);
        
        // Log evolution event
        await this.logEvolutionEvent(agentId, currentRole, newRole, evolutionCandidate.evidence);
        
        return {
          evolved: true,
          previousRole: currentRole,
          newRole: newRole,
          evidence: evolutionCandidate.evidence
        };
      }

      // Update progress toward next evolution
      await this.updateEvolutionProgress(agentId, currentRole, behaviorData, agentState);

      return {
        evolved: false,
        currentRole: currentRole,
        progressData: await this.getEvolutionProgress(agentId, currentRole)
      };

    } catch (error) {
      console.error(`Career evolution error for agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Assigns starting role based on initial user interaction patterns
   */
  assignStartingRole(behaviorData) {
    const { reflection_score, vibe_meter, primary_interaction_type } = behaviorData;
    
    // Logic based on user's natural tendencies
    if (primary_interaction_type === 'contemplative' || reflection_score > vibe_meter) {
      return 'listener';
    } else if (primary_interaction_type === 'creative' || behaviorData.creative_sessions > 3) {
      return 'spark';
    } else {
      return 'buddy'; // Default friendly companion
    }
  }

  /**
   * Checks if agent meets requirements for evolution to next role
   */
  async checkEvolutionEligibility(currentRole, behaviorData, agentState) {
    const roleConfig = this.getRoleConfig(currentRole);
    if (!roleConfig?.evolution_paths) {
      return { canEvolve: false, reason: 'No evolution paths available' };
    }

    // Check each possible evolution path
    for (const targetRoleId of roleConfig.evolution_paths) {
      const targetRole = this.getRoleConfig(targetRoleId);
      if (!targetRole) continue;

      const meetsRequirements = await this.evaluateRequirements(
        targetRole.requirements,
        behaviorData,
        agentState
      );

      if (meetsRequirements.meets) {
        return {
          canEvolve: true,
          targetRole: targetRoleId,
          evidence: meetsRequirements.evidence,
          confidence: meetsRequirements.confidence
        };
      }
    }

    return { canEvolve: false, reason: 'Requirements not met' };
  }

  /**
   * Evaluates if behavior data meets evolution requirements
   */
  async evaluateRequirements(requirements, behaviorData, agentState) {
    const evidence = {};
    let confidence = 0;
    let metCount = 0;
    let totalConditions = 0;

    // Check base requirements
    const baseRequirements = ['reflection_score', 'vibe_meter', 'session_count'];
    for (const req of baseRequirements) {
      totalConditions++;
      if (behaviorData[req] >= requirements[req]) {
        evidence[req] = { met: true, value: behaviorData[req], required: requirements[req] };
        metCount++;
      } else {
        evidence[req] = { met: false, value: behaviorData[req], required: requirements[req] };
      }
    }

    // Check custom conditions (the magic sauce)
    if (requirements.custom_conditions) {
      for (const [condition, threshold] of Object.entries(requirements.custom_conditions)) {
        totalConditions++;
        const value = await this.evaluateCustomCondition(condition, behaviorData, agentState);
        
        if (value >= threshold) {
          evidence[condition] = { met: true, value, required: threshold };
          metCount++;
        } else {
          evidence[condition] = { met: false, value, required: threshold };
        }
      }
    }

    confidence = metCount / totalConditions;
    
    // Need 80% of conditions met (configurable)
    const meetsThreshold = confidence >= 0.8;

    return {
      meets: meetsThreshold,
      evidence,
      confidence,
      metCount,
      totalConditions
    };
  }

  /**
   * Evaluates custom behavioral conditions
   */
  async evaluateCustomCondition(condition, behaviorData, agentState) {
    switch (condition) {
      case 'same_time_sessions':
        return this.calculateTimeConsistency(behaviorData.session_times);
      
      case 'ritual_completion_rate':
        return behaviorData.completed_rituals / Math.max(1, behaviorData.attempted_rituals);
      
      case 'word_count_threshold':
        return behaviorData.total_words_written || 0;
      
      case 'style_consistency':
        return this.calculateStyleConsistency(behaviorData.writing_samples);
      
      case 'emotional_range':
        return this.calculateEmotionalRange(behaviorData.mood_history);
      
      case 'chaos_to_calm_ratio':
        return this.calculateChaosCalm(behaviorData.mood_transitions);
      
      case 'loop_interruption_success':
        return behaviorData.successful_pattern_breaks / Math.max(1, behaviorData.attempted_pattern_breaks);
      
      case 'distraction_resistance':
        return behaviorData.focus_maintenance_rate || 0;
      
      case 'goal_completion_rate':
        return behaviorData.completed_goals / Math.max(1, behaviorData.set_goals);
      
      default:
        console.warn(`Unknown custom condition: ${condition}`);
        return 0;
    }
  }

  /**
   * Executes agent evolution to new role
   */
  async evolveAgent(agentId, targetRoleId, currentState) {
    const targetRole = this.getRoleConfig(targetRoleId);
    
    // Create new career state
    const newCareerState = {
      current_role: targetRoleId,
      role_display_name: targetRole.display_name,
      role_emoji: targetRole.emoji,
      evolved_at: new Date().toISOString(),
      evolution_history: [
        ...(currentState.career?.evolution_history || []),
        {
          from_role: currentState.career?.current_role || 'initial',
          to_role: targetRoleId,
          evolved_at: new Date().toISOString(),
          trigger_evidence: 'evolution_requirements_met'
        }
      ],
      traits: [
        ...(currentState.career?.traits || []),
        ...(targetRole.evolved_traits || targetRole.starting_traits || [])
      ],
      evolution_level: (currentState.career?.evolution_level || 0) + 1
    };

    // Update agent state
    const updatedState = {
      ...currentState,
      career: newCareerState,
      updated_at: new Date().toISOString()
    };

    await this.saveAgentState(agentId, updatedState);
    
    return targetRoleId;
  }

  /**
   * Gets role configuration (handles enterprise custom roles)
   */
  getRoleConfig(roleId) {
    // Check enterprise custom roles first
    if (this.enterpriseRoles?.[roleId]) {
      return this.enterpriseRoles[roleId];
    }

    // Check career tree roles
    return this.careerTree.base_roles[roleId] || 
           this.careerTree.evolved_roles[roleId] || 
           this.careerTree.master_roles[roleId];
  }

  /**
   * Renders career tree for different dashboard modes
   */
  renderCareerDashboard(mode = 'operator', agentId = null) {
    switch (mode) {
      case 'kids':
        return this.renderKidsView(agentId);
      case 'operator':
        return this.renderOperatorView(agentId);
      case 'enterprise':
        return this.renderEnterpriseView();
      default:
        throw new Error(`Unknown dashboard mode: ${mode}`);
    }
  }

  renderKidsView(agentId) {
    // Animated emoji evolution tree for kids
    return {
      type: 'kids_view',
      title: '🌟 Your AI Friend\'s Growth Journey',
      current_agent: agentId ? this.getAgentDisplayInfo(agentId) : null,
      evolution_path: this.buildAnimatedEvolutionPath(),
      next_milestone: this.getNextMilestone(agentId),
      celebration_mode: true
    };
  }

  renderOperatorView(agentId) {
    // XP bars, stats, detailed progress
    return {
      type: 'operator_view',
      title: 'Agent Career Analytics',
      agent_stats: agentId ? this.getDetailedAgentStats(agentId) : null,
      evolution_tree: this.buildEvolutionTreeViz(),
      progress_bars: this.getProgressBars(agentId),
      performance_metrics: this.getPerformanceMetrics(agentId)
    };
  }

  renderEnterpriseView() {
    // Team-wide heatmaps and role distribution
    return {
      type: 'enterprise_view', 
      title: 'Organization-wide Agent Role Analysis',
      role_distribution: this.calculateRoleDistribution(),
      team_performance_heatmap: this.generateTeamHeatmap(),
      evolution_velocity: this.calculateEvolutionVelocity(),
      custom_role_usage: this.getCustomRoleMetrics()
    };
  }

  // Helper methods for behavioral analysis
  calculateTimeConsistency(sessionTimes) {
    if (!sessionTimes || sessionTimes.length < 3) return 0;
    
    const timeVariance = this.calculateTimeVariance(sessionTimes);
    return Math.max(0, 1 - (timeVariance / 3600000)); // Convert to consistency score
  }

  calculateStyleConsistency(writingSamples) {
    if (!writingSamples || writingSamples.length < 3) return 0;
    
    // Analyze writing patterns, vocabulary, tone consistency
    return 0.7; // Placeholder - would implement NLP analysis
  }

  calculateEmotionalRange(moodHistory) {
    if (!moodHistory || moodHistory.length < 5) return 0;
    
    const uniqueMoods = new Set(moodHistory.map(m => m.category));
    return Math.min(uniqueMoods.size, 5); // Max range of 5
  }

  // File system operations
  async loadAgentState(agentId) {
    try {
      const statePath = path.join(this.vaultPath, `${agentId}`, 'agent_state.json');
      const stateData = await fs.readFile(statePath, 'utf8');
      return JSON.parse(stateData);
    } catch (error) {
      // Return default state if file doesn't exist
      return {
        agent_id: agentId,
        career: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  }

  async saveAgentState(agentId, state) {
    const statePath = path.join(this.vaultPath, `${agentId}`, 'agent_state.json');
    await fs.mkdir(path.dirname(statePath), { recursive: true });
    await fs.writeFile(statePath, JSON.stringify(state, null, 2));
  }

  async logEvolutionEvent(agentId, fromRole, toRole, evidence) {
    const evolutionLog = {
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      evolution: {
        from: fromRole,
        to: toRole,
        evidence: evidence
      }
    };

    const logPath = path.join(this.vaultPath, 'evolution_logs.jsonl');
    await fs.appendFile(logPath, JSON.stringify(evolutionLog) + '\n');
  }
}

export default AgentCareerEvolution;