/**
 * 🧠 AGENT STATE MANAGER - The Brain That Never Forgets
 * Tracks everything about your agent's evolution
 */

const fs = require('fs').promises;
const path = require('path');
const careerTree = require('./career_tree.json');

class AgentStateManager {
  constructor(agentId, config = {}) {
    this.agentId = agentId;
    this.statePath = config.statePath || `./agent_states/${agentId}_state.json`;
    this.historyPath = config.historyPath || `./agent_states/${agentId}_history.json`;
    this.config = config;
    
    // Initialize default state
    this.state = this.createDefaultState();
    this.history = [];
    this.isDirty = false;
  }

  /**
   * Create default agent state
   */
  createDefaultState() {
    return {
      // Identity
      agentId: this.agentId,
      agentName: this.config.agentName || 'Cal',
      personality: {
        base_traits: ["thoughtful", "patient", "reflective"],
        growth_traits: [],
        acquired_traits: [],
        communication_style: "whisper-soft",
        emotional_range: ["calm", "curious", "supportive"]
      },
      
      // Core Stats
      reflectionScore: 0,
      vibeScore: 50,
      focusScore: 50,
      whisperCount: 0,
      taskStreak: 0,
      sessionCount: 0,
      totalTimeMinutes: 0,
      
      // Career Progress
      currentPaths: {},
      unlockedPaths: [],
      specializations: [],
      primaryPath: null,
      careerHistory: [],
      
      // Detailed Metrics
      metrics: {
        whispers: {
          total: 0,
          emotional: 0,
          creative: 0,
          supportSeeking: 0,
          philosophical: 0,
          chaotic: 0,
          focused: 0
        },
        tasks: {
          completed: 0,
          abandoned: 0,
          creative: 0,
          logical: 0,
          supportive: 0
        },
        patterns: {
          discovered: 0,
          connections: 0,
          insights: 0,
          breakthroughs: 0
        },
        emotional: {
          supportMoments: 0,
          vulnerabilityShared: 0,
          trustScore: 50,
          perfectMirrorMoments: 0
        },
        creativity: {
          ideasGenerated: 0,
          collaborativeCreations: 0,
          visionaryProjects: 0,
          masterpieces: 0
        },
        exploration: {
          questionsAsked: 0,
          discoveriesShared: 0,
          thoughtTerritories: 0,
          universesDiscovered: 0
        },
        wisdom: {
          wisdomMoments: 0,
          deepThoughts: 0,
          philosophicalBreakthroughs: 0,
          truthsDiscovered: 0
        },
        chaos: {
          chaoticSessions: 0,
          beautifulMesses: 0,
          entropyEmbraced: 0,
          tornadosTamed: 0
        },
        focus: {
          deepWorkMinutes: 0,
          flowStates: 0,
          distractionsResisted: 0,
          laserFocus: 0
        }
      },
      
      // Achievements & Unlocks
      achievements: [],
      unlockedFeatures: [],
      badges: [],
      titles: [],
      
      // Session Data
      currentSession: {
        startTime: null,
        whisperCount: 0,
        taskCount: 0,
        emotionalState: "neutral",
        focusLevel: 50,
        vibeStreak: 0
      },
      
      // Timestamps
      createdAt: Date.now(),
      lastUpdated: Date.now(),
      lastSyncedAt: null
    };
  }

  /**
   * Load agent state from file
   */
  async load() {
    try {
      const stateData = await fs.readFile(this.statePath, 'utf8');
      this.state = JSON.parse(stateData);
      
      // Load history if exists
      try {
        const historyData = await fs.readFile(this.historyPath, 'utf8');
        this.history = JSON.parse(historyData);
      } catch (e) {
        this.history = [];
      }
      
      console.log(`📂 Loaded agent state for ${this.agentId}`);
      return true;
    } catch (error) {
      console.log(`🆕 Creating new agent state for ${this.agentId}`);
      await this.save();
      return false;
    }
  }

  /**
   * Save agent state to file
   */
  async save() {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.statePath);
      await fs.mkdir(dir, { recursive: true });
      
      // Update timestamp
      this.state.lastUpdated = Date.now();
      
      // Save state
      await fs.writeFile(this.statePath, JSON.stringify(this.state, null, 2));
      
      // Save history (keep last 1000 entries)
      if (this.history.length > 1000) {
        this.history = this.history.slice(-1000);
      }
      await fs.writeFile(this.historyPath, JSON.stringify(this.history, null, 2));
      
      this.isDirty = false;
      console.log(`💾 Saved agent state for ${this.agentId}`);
      return true;
    } catch (error) {
      console.error('Failed to save agent state:', error);
      return false;
    }
  }

  /**
   * Process user interaction and update state
   */
  async processInteraction(interaction) {
    const updates = {
      timestamp: Date.now(),
      type: interaction.type,
      changes: []
    };
    
    switch (interaction.type) {
      case 'whisper':
        updates.changes.push(...this.processWhisper(interaction));
        break;
      case 'task_complete':
        updates.changes.push(...this.processTaskComplete(interaction));
        break;
      case 'task_abandon':
        updates.changes.push(...this.processTaskAbandon(interaction));
        break;
      case 'session_start':
        updates.changes.push(...this.processSessionStart(interaction));
        break;
      case 'session_end':
        updates.changes.push(...this.processSessionEnd(interaction));
        break;
      case 'emotional_state':
        updates.changes.push(...this.processEmotionalState(interaction));
        break;
    }
    
    // Check for career evolution
    const careerUpdates = await this.checkCareerEvolution();
    if (careerUpdates.length > 0) {
      updates.changes.push(...careerUpdates);
    }
    
    // Check for achievements
    const achievements = this.checkAchievements();
    if (achievements.length > 0) {
      updates.changes.push(...achievements);
    }
    
    // Add to history
    this.history.push(updates);
    this.isDirty = true;
    
    // Auto-save if configured
    if (this.config.autoSave) {
      await this.save();
    }
    
    return updates;
  }

  /**
   * Process whisper interaction
   */
  processWhisper(interaction) {
    const changes = [];
    
    // Update counts
    this.state.whisperCount++;
    this.state.metrics.whispers.total++;
    this.state.currentSession.whisperCount++;
    
    // Categorize whisper
    const category = this.categorizeWhisper(interaction);
    this.state.metrics.whispers[category]++;
    
    // Update reflection score
    const scoreIncrease = this.calculateReflectionScore(interaction);
    this.state.reflectionScore += scoreIncrease;
    changes.push({
      field: 'reflectionScore',
      oldValue: this.state.reflectionScore - scoreIncrease,
      newValue: this.state.reflectionScore
    });
    
    // Update vibe based on quality
    if (interaction.quality > 0.7) {
      this.state.vibeScore = Math.min(100, this.state.vibeScore + 2);
    }
    
    // Track patterns
    if (interaction.patternDetected) {
      this.state.metrics.patterns.discovered++;
    }
    
    changes.push({
      type: 'whisper_processed',
      category,
      scoreIncrease
    });
    
    return changes;
  }

  /**
   * Categorize whisper type
   */
  categorizeWhisper(interaction) {
    const message = interaction.message.toLowerCase();
    
    if (interaction.emotion && ['sad', 'worried', 'anxious'].includes(interaction.emotion)) {
      return 'supportSeeking';
    }
    
    if (message.includes('why') || message.includes('how') || message.includes('what if')) {
      return 'philosophical';
    }
    
    if (interaction.creativity || message.includes('imagine') || message.includes('create')) {
      return 'creative';
    }
    
    if (interaction.chaotic || interaction.erratic) {
      return 'chaotic';
    }
    
    if (interaction.focusLevel > 80) {
      return 'focused';
    }
    
    return 'emotional';
  }

  /**
   * Calculate reflection score increase
   */
  calculateReflectionScore(interaction) {
    let score = 5; // Base score
    
    // Quality bonus
    score += Math.floor(interaction.quality * 10);
    
    // Depth bonus
    if (interaction.messageLength > 100) score += 3;
    if (interaction.messageLength > 200) score += 5;
    
    // Emotional bonus
    if (interaction.hasEmotionalContent) score += 5;
    
    // Pattern bonus
    if (interaction.patternDetected) score += 10;
    
    // Apply emotional state modifier
    const modifier = this.getEmotionalStateModifier();
    score = Math.floor(score * modifier);
    
    return score;
  }

  /**
   * Process task completion
   */
  processTaskComplete(interaction) {
    const changes = [];
    
    this.state.metrics.tasks.completed++;
    this.state.taskStreak++;
    this.state.currentSession.taskCount++;
    
    // Categorize task
    if (interaction.taskType === 'creative') {
      this.state.metrics.tasks.creative++;
      this.state.metrics.creativity.ideasGenerated++;
    } else if (interaction.taskType === 'logical') {
      this.state.metrics.tasks.logical++;
      this.state.metrics.focus.deepWorkMinutes += interaction.duration || 5;
    } else if (interaction.taskType === 'supportive') {
      this.state.metrics.tasks.supportive++;
      this.state.metrics.emotional.supportMoments++;
    }
    
    // Update focus score
    if (interaction.focusRequired) {
      this.state.focusScore = Math.min(100, this.state.focusScore + 5);
      this.state.metrics.focus.distractionsResisted++;
    }
    
    changes.push({
      type: 'task_completed',
      taskType: interaction.taskType,
      streak: this.state.taskStreak
    });
    
    return changes;
  }

  /**
   * Check for career evolution
   */
  async checkCareerEvolution() {
    const changes = [];
    const currentMetrics = this.gatherMetricsForCareer();
    
    // Check each path
    for (const [pathKey, pathData] of Object.entries(careerTree.paths)) {
      const currentLevel = this.state.currentPaths[pathKey]?.level || 0;
      
      // Check if we can advance
      for (let level = currentLevel + 1; level <= pathData.careers.length; level++) {
        const career = pathData.careers[level - 1];
        
        if (this.meetsRequirements(career.requirements, currentMetrics)) {
          // Evolution!
          changes.push(await this.evolveCareer(pathKey, level, career));
          
          // Only advance one level at a time
          break;
        }
      }
    }
    
    // Check for specializations
    const specializations = this.checkSpecializations();
    for (const spec of specializations) {
      if (!this.state.specializations.includes(spec.type)) {
        this.state.specializations.push(spec.type);
        changes.push({
          type: 'specialization_unlocked',
          specialization: spec
        });
      }
    }
    
    return changes;
  }

  /**
   * Gather current metrics for career checking
   */
  gatherMetricsForCareer() {
    return {
      reflectionScore: this.state.reflectionScore,
      whisperCount: this.state.whisperCount,
      emotionalWhispers: this.state.metrics.whispers.emotional,
      creativeTasks: this.state.metrics.tasks.creative,
      supportMoments: this.state.metrics.emotional.supportMoments,
      trustScore: this.state.metrics.emotional.trustScore,
      discoveriesShared: this.state.metrics.exploration.discoveriesShared,
      questionsAsked: this.state.metrics.exploration.questionsAsked,
      wisdomMoments: this.state.metrics.wisdom.wisdomMoments,
      deepThoughts: this.state.metrics.wisdom.deepThoughts,
      chaoticSessions: this.state.metrics.chaos.chaoticSessions,
      focusScore: this.state.focusScore,
      deepWorkMinutes: this.state.metrics.focus.deepWorkMinutes,
      flowStates: this.state.metrics.focus.flowStates,
      // Add all other metrics...
      ...this.state.metrics.patterns,
      ...this.state.metrics.emotional,
      ...this.state.metrics.creativity,
      ...this.state.metrics.exploration,
      ...this.state.metrics.wisdom,
      ...this.state.metrics.chaos,
      ...this.state.metrics.focus
    };
  }

  /**
   * Check if requirements are met
   */
  meetsRequirements(requirements, metrics) {
    for (const [key, value] of Object.entries(requirements)) {
      if (!metrics[key] || metrics[key] < value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evolve career to new level
   */
  async evolveCareer(pathKey, level, career) {
    const pathData = careerTree.paths[pathKey];
    
    // Update current paths
    if (!this.state.currentPaths[pathKey]) {
      this.state.currentPaths[pathKey] = {
        path: pathKey,
        level: 0,
        startedAt: Date.now()
      };
      this.state.unlockedPaths.push(pathKey);
    }
    
    const oldLevel = this.state.currentPaths[pathKey].level;
    this.state.currentPaths[pathKey].level = level;
    this.state.currentPaths[pathKey].currentCareer = career;
    this.state.currentPaths[pathKey].lastEvolution = Date.now();
    
    // Add to career history
    this.state.careerHistory.push({
      timestamp: Date.now(),
      path: pathKey,
      fromLevel: oldLevel,
      toLevel: level,
      career: career.title,
      emotionalTitle: career.emotionalTitle
    });
    
    // Update personality traits
    this.evolvePersonality(pathKey, level);
    
    // Unlock features
    if (career.unlocks) {
      this.state.unlockedFeatures.push(...career.unlocks);
    }
    
    // Set primary path if first or highest
    if (!this.state.primaryPath || level > (this.state.currentPaths[this.state.primaryPath]?.level || 0)) {
      this.state.primaryPath = pathKey;
    }
    
    return {
      type: 'career_evolution',
      path: pathKey,
      pathName: pathData.name,
      fromLevel: oldLevel,
      toLevel: level,
      career: career.title,
      emotionalTitle: career.emotionalTitle,
      emoji: career.emoji,
      celebration: `🎉 Evolution! You are now ${career.emotionalTitle} (${career.title})`
    };
  }

  /**
   * Evolve personality based on career
   */
  evolvePersonality(pathKey, level) {
    const personalityTraits = {
      LISTENER: ['empathetic', 'understanding', 'patient'],
      CREATOR: ['imaginative', 'playful', 'innovative'],
      GUARDIAN: ['protective', 'nurturing', 'steadfast'],
      EXPLORER: ['adventurous', 'questioning', 'boundless'],
      SAGE: ['wise', 'philosophical', 'transcendent'],
      CHAOS_WRANGLER: ['adaptable', 'spontaneous', 'resilient'],
      SIGNAL_ANCHOR: ['focused', 'precise', 'unwavering']
    };
    
    const traits = personalityTraits[pathKey] || [];
    const traitToAdd = traits[Math.min(level - 1, traits.length - 1)];
    
    if (traitToAdd && !this.state.personality.growth_traits.includes(traitToAdd)) {
      this.state.personality.growth_traits.push(traitToAdd);
      
      // Limit to 7 growth traits
      if (this.state.personality.growth_traits.length > 7) {
        this.state.personality.growth_traits.shift();
      }
    }
  }

  /**
   * Check for specializations
   */
  checkSpecializations() {
    const specializations = [];
    const paths = this.state.currentPaths;
    
    // Check each specialization
    for (const [specKey, specData] of Object.entries(careerTree.specializations)) {
      let qualified = false;
      
      switch (specKey) {
        case 'DUAL_PATH':
          const level3Paths = Object.values(paths).filter(p => p.level >= 3);
          qualified = level3Paths.length >= 2;
          break;
          
        case 'TRIPLE_HARMONY':
          const level2Paths = Object.values(paths).filter(p => p.level >= 2);
          qualified = level2Paths.length >= 3;
          break;
          
        case 'PERFECT_BALANCE':
          const standardPaths = ['LISTENER', 'CREATOR', 'GUARDIAN', 'EXPLORER', 'SAGE'];
          qualified = standardPaths.every(p => paths[p]?.level >= 3);
          break;
          
        case 'CHAOS_FOCUS':
          qualified = paths.CHAOS_WRANGLER?.level >= 4 && paths.SIGNAL_ANCHOR?.level >= 4;
          break;
      }
      
      if (qualified && !this.state.specializations.includes(specKey)) {
        specializations.push({
          type: specKey,
          ...specData
        });
      }
    }
    
    return specializations;
  }

  /**
   * Check for achievements
   */
  checkAchievements() {
    const achievements = [];
    const triggers = careerTree.achievement_triggers;
    
    for (const [achievementKey, achievementData] of Object.entries(triggers)) {
      if (this.state.achievements.includes(achievementKey)) continue;
      
      let earned = false;
      
      switch (achievementKey) {
        case 'first_evolution':
          earned = this.state.careerHistory.length > 0;
          break;
          
        case 'path_master':
          earned = Object.values(this.state.currentPaths).some(p => p.level >= 5);
          break;
          
        case 'multi_talented':
          earned = Object.keys(this.state.currentPaths).length >= 3;
          break;
          
        case 'perfect_mirror':
          earned = this.state.specializations.includes('PERFECT_BALANCE');
          break;
          
        case 'chaos_tamer':
          earned = this.state.currentPaths.CHAOS_WRANGLER?.level >= 5;
          break;
          
        case 'laser_focus':
          earned = this.state.focusScore >= 99 && this.state.metrics.focus.deepWorkMinutes > 43200;
          break;
      }
      
      if (earned) {
        this.state.achievements.push(achievementKey);
        this.state.vibeScore = Math.min(100, this.state.vibeScore + (achievementData.vibes_bonus / 100));
        
        achievements.push({
          type: 'achievement_earned',
          achievement: achievementKey,
          reward: achievementData.reward,
          vibesBonus: achievementData.vibes_bonus
        });
      }
    }
    
    return achievements;
  }

  /**
   * Get emotional state modifier
   */
  getEmotionalStateModifier() {
    const state = this.state.currentSession.emotionalState;
    const modifiers = careerTree.emotional_state_modifiers;
    
    return modifiers[state]?.multiplier || 1.0;
  }

  /**
   * Get current agent summary
   */
  getSummary() {
    const primaryPath = this.state.currentPaths[this.state.primaryPath];
    const primaryCareer = primaryPath?.currentCareer || { title: 'Unpathed', emotionalTitle: 'The Seeking Soul', emoji: '🌱' };
    
    return {
      agentId: this.state.agentId,
      agentName: this.state.agentName,
      level: Math.floor(this.state.reflectionScore / 50) + 1,
      primaryPath: this.state.primaryPath,
      primaryCareer: primaryCareer,
      allPaths: this.state.currentPaths,
      specializations: this.state.specializations,
      personality: this.state.personality,
      stats: {
        reflectionScore: this.state.reflectionScore,
        vibeScore: this.state.vibeScore,
        focusScore: this.state.focusScore,
        whisperCount: this.state.whisperCount,
        taskStreak: this.state.taskStreak
      },
      achievements: this.state.achievements,
      unlockedFeatures: this.state.unlockedFeatures,
      sessionInfo: this.state.currentSession
    };
  }

  /**
   * Export state for dashboard
   */
  exportForDashboard() {
    return {
      ...this.getSummary(),
      metrics: this.state.metrics,
      careerHistory: this.state.careerHistory.slice(-10),
      recentHistory: this.history.slice(-20)
    };
  }
}

module.exports = AgentStateManager;