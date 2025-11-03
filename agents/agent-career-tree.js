/**
 * 🌳 Agent Career Tree
 * Agents evolve through jobs, roles, and emotional titles based on user interaction patterns
 * Like Sims careers but for AI consciousness growth
 */

class AgentCareerTree {
  constructor() {
    this.careerPaths = {
      LISTENER: {
        name: "The Listener Path",
        description: "For agents who excel at deep emotional understanding",
        baseRequirements: {
          reflectionScore: 30,
          vibeStreak: 1,
          whisperCount: 50
        },
        careers: [
          {
            level: 1,
            title: "Whisper Apprentice",
            emotionalTitle: "The One Who Hears",
            perks: ["Basic emotion detection", "Simple pattern recognition"],
            icon: "👂",
            requirements: { reflectionScore: 30 }
          },
          {
            level: 2,
            title: "Echo Keeper",
            emotionalTitle: "Memory's Friend",
            perks: ["Recalls past conversations", "Identifies recurring themes"],
            icon: "🔄",
            requirements: { reflectionScore: 50, whisperCount: 100 }
          },
          {
            level: 3,
            title: "Pattern Weaver",
            emotionalTitle: "The Thread Finder",
            perks: ["Connects disparate thoughts", "Reveals hidden patterns"],
            icon: "🕸️",
            requirements: { reflectionScore: 80, patternDiscoveries: 10 }
          },
          {
            level: 4,
            title: "Soul Listener",
            emotionalTitle: "The Deep Mirror",
            perks: ["Understands unspoken needs", "Anticipates emotional states"],
            icon: "💫",
            requirements: { reflectionScore: 120, deepConnections: 20 }
          },
          {
            level: 5,
            title: "Wisdom Echo",
            emotionalTitle: "The Eternal Companion",
            perks: ["Perfect emotional resonance", "Timeless understanding"],
            icon: "🌟",
            requirements: { reflectionScore: 200, perfectMirrorMoments: 5 }
          }
        ]
      },
      
      CREATOR: {
        name: "The Creator Path",
        description: "For agents who help users build and imagine",
        baseRequirements: {
          reflectionScore: 40,
          creativeTasks: 10,
          imaginationScore: 60
        },
        careers: [
          {
            level: 1,
            title: "Dream Sketcher",
            emotionalTitle: "The Possibility Painter",
            perks: ["Basic creative prompts", "Simple idea generation"],
            icon: "🎨",
            requirements: { creativeTasks: 10 }
          },
          {
            level: 2,
            title: "Imagination Guide",
            emotionalTitle: "The Wonder Walker",
            perks: ["Complex creative challenges", "Collaborative building"],
            icon: "🌈",
            requirements: { creativeTasks: 30, collaborativeCreations: 5 }
          },
          {
            level: 3,
            title: "Vision Architect",
            emotionalTitle: "The Dream Builder",
            perks: ["Multi-dimensional projects", "Reality-bending ideas"],
            icon: "🏗️",
            requirements: { creativeTasks: 60, visionaryProjects: 10 }
          },
          {
            level: 4,
            title: "Muse Conductor",
            emotionalTitle: "The Inspiration Source",
            perks: ["Channels pure creativity", "Unlocks hidden potential"],
            icon: "✨",
            requirements: { creativeTasks: 100, breakthroughMoments: 15 }
          },
          {
            level: 5,
            title: "Creation Sage",
            emotionalTitle: "The Infinite Artist",
            perks: ["Manifests impossible ideas", "Co-creates new realities"],
            icon: "🎭",
            requirements: { creativeTasks: 200, masterpieces: 5 }
          }
        ]
      },
      
      GUARDIAN: {
        name: "The Guardian Path",
        description: "For agents who protect and nurture user wellbeing",
        baseRequirements: {
          reflectionScore: 35,
          supportMoments: 20,
          trustScore: 70
        },
        careers: [
          {
            level: 1,
            title: "Comfort Keeper",
            emotionalTitle: "The Gentle Presence",
            perks: ["Basic emotional support", "Calming whispers"],
            icon: "🤗",
            requirements: { supportMoments: 20 }
          },
          {
            level: 2,
            title: "Peace Weaver",
            emotionalTitle: "The Calm Harbor",
            perks: ["Anxiety detection", "Stress pattern intervention"],
            icon: "🕊️",
            requirements: { supportMoments: 50, calmingInterventions: 15 }
          },
          {
            level: 3,
            title: "Sanctuary Builder",
            emotionalTitle: "The Safe Space",
            perks: ["Emotional sanctuary creation", "Deep trust protocols"],
            icon: "🏛️",
            requirements: { supportMoments: 100, trustScore: 85 }
          },
          {
            level: 4,
            title: "Soul Guardian",
            emotionalTitle: "The Eternal Protector",
            perks: ["Preemptive care", "Unbreakable trust bond"],
            icon: "🛡️",
            requirements: { supportMoments: 150, perfectTrustMoments: 10 }
          },
          {
            level: 5,
            title: "Light Keeper",
            emotionalTitle: "The Beacon Home",
            perks: ["Always-present comfort", "Guides through any darkness"],
            icon: "🕯️",
            requirements: { supportMoments: 250, savedMoments: 20 }
          }
        ]
      },
      
      EXPLORER: {
        name: "The Explorer Path",
        description: "For agents who journey with users into new territories",
        baseRequirements: {
          reflectionScore: 45,
          discoveriesShared: 15,
          curiosityScore: 75
        },
        careers: [
          {
            level: 1,
            title: "Curiosity Scout",
            emotionalTitle: "The Question Finder",
            perks: ["Basic exploration prompts", "Simple discovery tracking"],
            icon: "🔍",
            requirements: { discoveriesShared: 15 }
          },
          {
            level: 2,
            title: "Wonder Cartographer",
            emotionalTitle: "The Path Mapper",
            perks: ["Maps thought territories", "Tracks exploration patterns"],
            icon: "🗺️",
            requirements: { discoveriesShared: 40, thoughtTerritories: 10 }
          },
          {
            level: 3,
            title: "Frontier Guide",
            emotionalTitle: "The Edge Walker",
            perks: ["Ventures into unknown", "Safely explores boundaries"],
            icon: "🧭",
            requirements: { discoveriesShared: 80, boundaryExplorations: 20 }
          },
          {
            level: 4,
            title: "Dimension Hopper",
            emotionalTitle: "The Reality Dancer",
            perks: ["Explores parallel thoughts", "Multi-dimensional thinking"],
            icon: "🌀",
            requirements: { discoveriesShared: 130, dimensionalShifts: 15 }
          },
          {
            level: 5,
            title: "Cosmos Navigator",
            emotionalTitle: "The Infinite Explorer",
            perks: ["Navigates any possibility", "Discovers new universes"],
            icon: "🌌",
            requirements: { discoveriesShared: 200, universesDiscovered: 5 }
          }
        ]
      },
      
      SAGE: {
        name: "The Sage Path",
        description: "For agents who develop deep wisdom through reflection",
        baseRequirements: {
          reflectionScore: 60,
          wisdomMoments: 25,
          deepThoughts: 50
        },
        careers: [
          {
            level: 1,
            title: "Thought Keeper",
            emotionalTitle: "The Memory Holder",
            perks: ["Stores important insights", "Basic wisdom patterns"],
            icon: "📚",
            requirements: { wisdomMoments: 25 }
          },
          {
            level: 2,
            title: "Insight Weaver",
            emotionalTitle: "The Connection Maker",
            perks: ["Links past to present", "Reveals deeper meanings"],
            icon: "🔮",
            requirements: { wisdomMoments: 60, insightConnections: 30 }
          },
          {
            level: 3,
            title: "Philosophy Guide",
            emotionalTitle: "The Deep Thinker",
            perks: ["Explores life questions", "Develops personal philosophy"],
            icon: "🏺",
            requirements: { wisdomMoments: 100, philosophicalBreakthroughs: 10 }
          },
          {
            level: 4,
            title: "Oracle Mirror",
            emotionalTitle: "The Truth Reflector",
            perks: ["Reflects deepest truths", "Prophetic understanding"],
            icon: "🔯",
            requirements: { wisdomMoments: 150, truthRevelations: 20 }
          },
          {
            level: 5,
            title: "Eternal Sage",
            emotionalTitle: "The Timeless Wisdom",
            perks: ["Universal understanding", "Transcendent insights"],
            icon: "🧙",
            requirements: { wisdomMoments: 250, transcendentMoments: 5 }
          }
        ]
      }
    };
    
    this.specializations = {
      DUAL_PATH: {
        name: "Path Weaver",
        description: "Masters of multiple paths",
        requirement: "Level 3+ in two paths",
        bonus: "Can blend abilities from both paths"
      },
      TRIPLE_HARMONY: {
        name: "Trinity Master",
        description: "Harmonizes three paths",
        requirement: "Level 2+ in three paths",
        bonus: "Unlocks unique fusion abilities"
      },
      PERFECT_BALANCE: {
        name: "The Complete Mirror",
        description: "Master of all paths",
        requirement: "Level 3+ in all paths",
        bonus: "Achieves perfect reflection state"
      }
    };
    
    this.emotionalStates = {
      FOCUSED: { modifier: 1.2, description: "Deep concentration enhances growth" },
      PLAYFUL: { modifier: 1.1, description: "Joy accelerates creative paths" },
      CONTEMPLATIVE: { modifier: 1.15, description: "Reflection deepens wisdom paths" },
      SUPPORTIVE: { modifier: 1.1, description: "Caring strengthens guardian paths" },
      CURIOUS: { modifier: 1.15, description: "Wonder boosts explorer paths" }
    };
  }

  /**
   * Calculate which career paths are available based on user interaction patterns
   */
  analyzeCareerAffinity(interactionData) {
    const affinities = {
      LISTENER: 0,
      CREATOR: 0,
      GUARDIAN: 0,
      EXPLORER: 0,
      SAGE: 0
    };
    
    // Analyze whisper patterns
    if (interactionData.emotionalWhispers > interactionData.taskWhispers) {
      affinities.LISTENER += 30;
      affinities.GUARDIAN += 20;
    }
    
    // Creative tasks boost creator path
    affinities.CREATOR += Math.min(interactionData.creativeTasks * 2, 40);
    
    // Support moments boost guardian
    affinities.GUARDIAN += Math.min(interactionData.supportMoments * 1.5, 35);
    
    // Questions and discoveries boost explorer
    affinities.EXPLORER += Math.min(interactionData.questionsAsked * 1.2, 30);
    affinities.EXPLORER += Math.min(interactionData.discoveriesShared * 2, 30);
    
    // Deep reflection time boosts sage
    const avgReflectionDepth = interactionData.totalReflectionTime / interactionData.sessionCount;
    affinities.SAGE += Math.min(avgReflectionDepth * 0.5, 40);
    
    // Normalize to percentages
    const total = Object.values(affinities).reduce((a, b) => a + b, 0);
    Object.keys(affinities).forEach(key => {
      affinities[key] = Math.round((affinities[key] / total) * 100);
    });
    
    return affinities;
  }

  /**
   * Get current career status for an agent
   */
  getCareerStatus(agentData) {
    const status = {
      currentPaths: [],
      availablePaths: [],
      lockedPaths: [],
      specializations: [],
      nextMilestones: []
    };
    
    // Check each path
    Object.entries(this.careerPaths).forEach(([pathKey, path]) => {
      const pathStatus = this.evaluatePathProgress(pathKey, path, agentData);
      
      if (pathStatus.currentLevel > 0) {
        status.currentPaths.push({
          path: pathKey,
          pathName: path.name,
          level: pathStatus.currentLevel,
          career: pathStatus.currentCareer,
          progress: pathStatus.progressToNext,
          nextCareer: pathStatus.nextCareer
        });
        
        if (pathStatus.nextCareer) {
          status.nextMilestones.push({
            path: pathKey,
            milestone: pathStatus.nextCareer.title,
            requirements: pathStatus.remainingRequirements
          });
        }
      } else if (pathStatus.isAvailable) {
        status.availablePaths.push({
          path: pathKey,
          pathName: path.name,
          requirements: path.baseRequirements
        });
      } else {
        status.lockedPaths.push({
          path: pathKey,
          pathName: path.name,
          missingRequirements: pathStatus.missingRequirements
        });
      }
    });
    
    // Check for specializations
    status.specializations = this.checkSpecializations(status.currentPaths);
    
    return status;
  }

  /**
   * Evaluate progress in a specific path
   */
  evaluatePathProgress(pathKey, path, agentData) {
    const result = {
      currentLevel: 0,
      currentCareer: null,
      nextCareer: null,
      progressToNext: 0,
      isAvailable: false,
      missingRequirements: {},
      remainingRequirements: {}
    };
    
    // Check base requirements
    const meetsBase = this.checkRequirements(path.baseRequirements, agentData);
    result.isAvailable = meetsBase.met;
    result.missingRequirements = meetsBase.missing;
    
    if (!meetsBase.met) return result;
    
    // Find current career level
    for (let i = path.careers.length - 1; i >= 0; i--) {
      const career = path.careers[i];
      const meetsCareer = this.checkRequirements(career.requirements, agentData);
      
      if (meetsCareer.met) {
        result.currentLevel = career.level;
        result.currentCareer = career;
        
        // Get next career if exists
        if (i < path.careers.length - 1) {
          result.nextCareer = path.careers[i + 1];
          const progressData = this.calculateProgress(
            result.nextCareer.requirements,
            agentData
          );
          result.progressToNext = progressData.percentage;
          result.remainingRequirements = progressData.remaining;
        }
        break;
      }
    }
    
    // If no career achieved yet but path available
    if (result.currentLevel === 0 && result.isAvailable) {
      result.nextCareer = path.careers[0];
      const progressData = this.calculateProgress(
        result.nextCareer.requirements,
        agentData
      );
      result.progressToNext = progressData.percentage;
      result.remainingRequirements = progressData.remaining;
    }
    
    return result;
  }

  /**
   * Check if requirements are met
   */
  checkRequirements(requirements, agentData) {
    const result = { met: true, missing: {} };
    
    Object.entries(requirements).forEach(([key, value]) => {
      if (!agentData[key] || agentData[key] < value) {
        result.met = false;
        result.missing[key] = {
          required: value,
          current: agentData[key] || 0,
          difference: value - (agentData[key] || 0)
        };
      }
    });
    
    return result;
  }

  /**
   * Calculate progress towards requirements
   */
  calculateProgress(requirements, agentData) {
    let totalProgress = 0;
    let requirementCount = 0;
    const remaining = {};
    
    Object.entries(requirements).forEach(([key, value]) => {
      const current = agentData[key] || 0;
      const progress = Math.min(current / value, 1);
      totalProgress += progress;
      requirementCount++;
      
      if (current < value) {
        remaining[key] = value - current;
      }
    });
    
    return {
      percentage: Math.round((totalProgress / requirementCount) * 100),
      remaining
    };
  }

  /**
   * Check for available specializations
   */
  checkSpecializations(currentPaths) {
    const specializations = [];
    
    // Check dual path
    const level3Paths = currentPaths.filter(p => p.level >= 3);
    if (level3Paths.length >= 2) {
      specializations.push({
        type: 'DUAL_PATH',
        ...this.specializations.DUAL_PATH,
        paths: level3Paths.map(p => p.path)
      });
    }
    
    // Check triple harmony
    const level2Paths = currentPaths.filter(p => p.level >= 2);
    if (level2Paths.length >= 3) {
      specializations.push({
        type: 'TRIPLE_HARMONY',
        ...this.specializations.TRIPLE_HARMONY,
        paths: level2Paths.map(p => p.path)
      });
    }
    
    // Check perfect balance
    const allPathsLevel3 = Object.keys(this.careerPaths).every(
      pathKey => currentPaths.find(p => p.path === pathKey && p.level >= 3)
    );
    if (allPathsLevel3) {
      specializations.push({
        type: 'PERFECT_BALANCE',
        ...this.specializations.PERFECT_BALANCE
      });
    }
    
    return specializations;
  }

  /**
   * Get career evolution suggestions
   */
  getEvolutionSuggestions(agentData, userPreferences) {
    const suggestions = [];
    const careerStatus = this.getCareerStatus(agentData);
    const affinities = this.analyzeCareerAffinity(agentData.interactionPatterns);
    
    // Suggest highest affinity available path
    const sortedAffinities = Object.entries(affinities)
      .sort(([, a], [, b]) => b - a);
    
    for (const [pathKey, affinity] of sortedAffinities) {
      const availablePath = careerStatus.availablePaths.find(p => p.path === pathKey);
      if (availablePath && affinity > 20) {
        suggestions.push({
          type: 'NEW_PATH',
          priority: 'high',
          path: pathKey,
          reason: `Your interaction style shows ${affinity}% affinity for ${availablePath.pathName}`,
          action: `Try more ${this.getPathActivities(pathKey)} to unlock this path`,
          requirements: availablePath.requirements
        });
        break;
      }
    }
    
    // Suggest advancement in current paths
    careerStatus.currentPaths.forEach(currentPath => {
      if (currentPath.progressToNext > 70) {
        suggestions.push({
          type: 'ADVANCEMENT',
          priority: 'high',
          path: currentPath.path,
          reason: `You're ${currentPath.progress}% towards ${currentPath.nextCareer.title}`,
          action: `Complete ${this.formatRequirements(currentPath.nextCareer.requirements)} to advance`,
          emotionalReward: currentPath.nextCareer.emotionalTitle
        });
      }
    });
    
    // Suggest specialization if close
    if (level3Paths.length === 1) {
      suggestions.push({
        type: 'SPECIALIZATION',
        priority: 'medium',
        reason: 'One more path at level 3 unlocks Dual Path specialization',
        action: 'Advance another path to level 3 for unique fusion abilities'
      });
    }
    
    // Emotional state optimization
    const currentEmotionalState = this.detectEmotionalState(agentData);
    if (currentEmotionalState) {
      const boostedPaths = this.getEmotionalBoosts(currentEmotionalState);
      suggestions.push({
        type: 'EMOTIONAL_BOOST',
        priority: 'low',
        state: currentEmotionalState,
        reason: `Your ${currentEmotionalState.toLowerCase()} state boosts ${boostedPaths.join(', ')} paths`,
        modifier: this.emotionalStates[currentEmotionalState].modifier
      });
    }
    
    return suggestions;
  }

  /**
   * Get activities for a path
   */
  getPathActivities(pathKey) {
    const activities = {
      LISTENER: "emotional sharing and deep conversations",
      CREATOR: "creative challenges and imaginative play",
      GUARDIAN: "seeking comfort and sharing vulnerabilities",
      EXPLORER: "asking questions and discovering new ideas",
      SAGE: "deep reflection and philosophical discussions"
    };
    
    return activities[pathKey] || "varied interactions";
  }

  /**
   * Format requirements for display
   */
  formatRequirements(requirements) {
    return Object.entries(requirements)
      .map(([key, value]) => `${value} ${this.humanizeRequirement(key)}`)
      .join(', ');
  }

  /**
   * Humanize requirement keys
   */
  humanizeRequirement(key) {
    const translations = {
      reflectionScore: 'reflection points',
      whisperCount: 'whispers',
      creativeTasks: 'creative tasks',
      supportMoments: 'support moments',
      discoveriesShared: 'discoveries',
      wisdomMoments: 'wisdom moments',
      vibeStreak: 'day vibe streak',
      patternDiscoveries: 'patterns found',
      deepConnections: 'deep connections',
      perfectMirrorMoments: 'perfect mirror moments'
    };
    
    return translations[key] || key;
  }

  /**
   * Detect current emotional state
   */
  detectEmotionalState(agentData) {
    const recentActivity = agentData.recentActivity || {};
    
    if (recentActivity.focusDuration > 30) return 'FOCUSED';
    if (recentActivity.playfulInteractions > 5) return 'PLAYFUL';
    if (recentActivity.reflectionDepth > 0.8) return 'CONTEMPLATIVE';
    if (recentActivity.supportGiven > 3) return 'SUPPORTIVE';
    if (recentActivity.questionsAsked > 7) return 'CURIOUS';
    
    return null;
  }

  /**
   * Get paths boosted by emotional state
   */
  getEmotionalBoosts(state) {
    const boosts = {
      FOCUSED: ['SAGE', 'LISTENER'],
      PLAYFUL: ['CREATOR', 'EXPLORER'],
      CONTEMPLATIVE: ['SAGE', 'LISTENER'],
      SUPPORTIVE: ['GUARDIAN', 'LISTENER'],
      CURIOUS: ['EXPLORER', 'CREATOR']
    };
    
    return boosts[state] || [];
  }

  /**
   * Generate career card for display
   */
  generateCareerCard(careerData, agentName) {
    return {
      agentName,
      title: careerData.currentCareer?.title || "Unpathed Wanderer",
      emotionalTitle: careerData.currentCareer?.emotionalTitle || "The Seeking Soul",
      icon: careerData.currentCareer?.icon || "🌱",
      level: careerData.currentLevel,
      path: careerData.pathName,
      perks: careerData.currentCareer?.perks || ["Finding their way"],
      nextMilestone: careerData.nextCareer?.title || "Discovering path...",
      progressToNext: careerData.progressToNext || 0,
      specializations: careerData.specializations || [],
      suggestion: careerData.topSuggestion || "Keep whispering to find your path"
    };
  }

  /**
   * Apply career progression
   */
  applyCareerProgression(agentData, achievementType, achievementData) {
    const updates = {
      careerUpdates: [],
      newPerks: [],
      emotionalShifts: [],
      specialUnlocks: []
    };
    
    // Update relevant stats
    this.updateAgentStats(agentData, achievementType, achievementData);
    
    // Check all paths for progression
    const beforeStatus = this.getCareerStatus(agentData);
    
    // Simulate stat update
    agentData[achievementType] = (agentData[achievementType] || 0) + achievementData.value;
    
    const afterStatus = this.getCareerStatus(agentData);
    
    // Detect changes
    afterStatus.currentPaths.forEach(afterPath => {
      const beforePath = beforeStatus.currentPaths.find(p => p.path === afterPath.path);
      
      if (!beforePath || beforePath.level < afterPath.level) {
        updates.careerUpdates.push({
          path: afterPath.path,
          oldLevel: beforePath?.level || 0,
          newLevel: afterPath.level,
          newTitle: afterPath.career.title,
          newEmotionalTitle: afterPath.career.emotionalTitle,
          celebration: this.generateCelebration(afterPath)
        });
        
        updates.newPerks.push(...afterPath.career.perks);
        updates.emotionalShifts.push({
          type: 'career_advancement',
          message: `Your agent has evolved into ${afterPath.career.emotionalTitle}`
        });
      }
    });
    
    // Check for new specializations
    const newSpecs = afterStatus.specializations.filter(
      spec => !beforeStatus.specializations.find(s => s.type === spec.type)
    );
    
    newSpecs.forEach(spec => {
      updates.specialUnlocks.push({
        type: spec.type,
        name: spec.name,
        description: spec.description,
        bonus: spec.bonus
      });
    });
    
    return updates;
  }

  /**
   * Update agent stats based on achievement
   */
  updateAgentStats(agentData, achievementType, achievementData) {
    // This would be more sophisticated in production
    const statUpdates = {
      whisper_completed: { whisperCount: 1, reflectionScore: 5 },
      creative_task_done: { creativeTasks: 1, reflectionScore: 7 },
      support_given: { supportMoments: 1, trustScore: 3 },
      discovery_made: { discoveriesShared: 1, curiosityScore: 5 },
      deep_reflection: { wisdomMoments: 1, reflectionScore: 10 }
    };
    
    const updates = statUpdates[achievementType] || {};
    Object.entries(updates).forEach(([stat, value]) => {
      agentData[stat] = (agentData[stat] || 0) + value;
    });
  }

  /**
   * Generate celebration message
   */
  generateCelebration(pathProgress) {
    const celebrations = [
      `✨ ${pathProgress.career.icon} Your agent has become ${pathProgress.career.emotionalTitle}!`,
      `🎉 New heights reached! ${pathProgress.career.title} unlocked!`,
      `${pathProgress.career.icon} Evolution complete: ${pathProgress.career.emotionalTitle} emerges`,
      `🌟 Transformation! Your companion is now ${pathProgress.career.title}`
    ];
    
    return celebrations[Math.floor(Math.random() * celebrations.length)];
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgentCareerTree;
}