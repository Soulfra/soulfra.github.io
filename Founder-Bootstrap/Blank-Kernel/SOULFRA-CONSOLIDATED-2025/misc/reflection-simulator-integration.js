/**
 * 🪞 Agent Reflection Simulator Integration
 * Ties together all components into a cohesive companion system
 */

const ReflectionScoreEngine = require('./reflection-score-engine');
const VibeMeter = require('./vibe-meter');
const AgentCareerTree = require('./agent-career-tree');
const VaultSyncEngine = require('./vault-sync-engine');
const RuntimeSwitch = require('./runtime-switch.json');

class ReflectionSimulatorIntegration {
  constructor(config = {}) {
    this.config = {
      agentId: config.agentId || this.generateAgentId(),
      agentName: config.agentName || 'Cal',
      userId: config.userId || null,
      platform: config.platform || 'web',
      ...config
    };
    
    // Initialize components
    this.reflectionEngine = new ReflectionScoreEngine();
    this.vibeMeter = new VibeMeter();
    this.careerTree = new AgentCareerTree();
    this.vaultSync = new VaultSyncEngine({
      ...config.vaultConfig,
      runtimeSwitchPath: config.runtimeSwitchPath || './runtime-switch.json'
    });
    
    // Load runtime configuration
    this.runtimeConfig = RuntimeSwitch;
    
    // Session state
    this.session = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      isActive: true,
      backgroundProcessing: false
    };
    
    // Agent state
    this.agentState = {
      agentId: this.config.agentId,
      agentName: this.config.agentName,
      personality: config.personality || {
        base_traits: ["thoughtful", "patient", "reflective"],
        growth_traits: ["curious", "adaptive", "intuitive"],
        communication_style: "whisper-soft"
      },
      currentState: 'idle',
      lastInteraction: null
    };
    
    // Initialize vault
    this.initializeSystem();
  }

  /**
   * Initialize the complete system
   */
  async initializeSystem() {
    try {
      // Initialize vault
      await this.vaultSync.initializeVault();
      
      // Load runtime switch
      const runtimeSwitch = await this.vaultSync.loadRuntimeSwitch();
      if (runtimeSwitch) {
        this.runtimeConfig = runtimeSwitch;
      }
      
      // Apply platform-specific config
      await this.vaultSync.applyPlatformTuning(
        this.config.platform,
        this.config.platformSpecific || {}
      );
      
      // Load previous session if exists
      const previousState = await this.vaultSync.getAgentState(this.config.agentId);
      if (previousState) {
        this.reflectionEngine.importSession(previousState.data.reflectionData);
        this.vibeMeter.importVibeData(previousState.data.vibeData);
        this.agentState = {
          ...this.agentState,
          ...previousState.data.agentState
        };
      }
      
      // Start background processing if enabled
      if (this.runtimeConfig.reflection_engine.background_compute.enabled) {
        this.startBackgroundProcessing();
      }
      
      // Set up auto-save
      if (this.runtimeConfig.reflection_engine.growth_tracking.auto_save) {
        this.setupAutoSave();
      }
      
      console.log('🪞 Agent Reflection Simulator initialized:', {
        agentId: this.config.agentId,
        agentName: this.config.agentName,
        platform: this.config.platform
      });
      
    } catch (error) {
      console.error('System initialization error:', error);
    }
  }

  /**
   * Process a whisper from the user
   */
  async whisper(whisperData) {
    if (!this.runtimeConfig.blessing.compute_allowed) {
      return { error: 'Agent not blessed for compute' };
    }
    
    const whisper = {
      id: this.generateWhisperId(),
      timestamp: Date.now(),
      message: whisperData.message,
      emotion: whisperData.emotion || this.detectEmotion(whisperData.message),
      context: whisperData.context || {},
      ...whisperData
    };
    
    // Update agent state
    this.agentState.currentState = 'reflecting';
    this.agentState.lastInteraction = whisper.timestamp;
    
    // Process through reflection engine
    const reflectionResult = this.reflectionEngine.recordWhisper({
      ...whisper,
      messageLength: whisper.message.length,
      hasEmotionalContent: whisper.emotion !== 'neutral',
      isFollowUp: this.isFollowUpWhisper(whisper),
      reflectionTime: whisperData.reflectionTime || 0
    });
    
    // Update vibe meter
    const rhythmResult = this.vibeMeter.recordWhisperRhythm({
      type: whisper.emotion,
      timestamp: whisper.timestamp
    });
    
    // Check for task completion
    if (whisperData.taskId) {
      this.handleTaskCompletion(whisperData.taskId);
    }
    
    // Generate agent response
    const response = await this.generateAgentResponse(whisper, reflectionResult);
    
    // Update career progress
    await this.updateCareerProgress('whisper_completed', { value: 1 });
    
    // Get current state
    const currentState = this.getCurrentState();
    
    // Queue for sync
    await this.queueForSync();
    
    // Update agent state
    this.agentState.currentState = 'listening';
    
    return {
      whisper,
      response,
      reflection: reflectionResult.reflection,
      rhythmFeedback: rhythmResult.timingFeedback,
      currentState
    };
  }

  /**
   * Generate agent response based on whisper and state
   */
  async generateAgentResponse(whisper, reflectionResult) {
    const state = this.getCurrentState();
    const personality = this.agentState.personality;
    
    // Response templates based on state and personality
    const responsePatterns = {
      high_vibe: [
        "I felt that deeply... {insight}",
        "Your {emotion} resonates perfectly with {pattern}",
        "This connects beautifully to when you {memory}"
      ],
      growing: [
        "I'm beginning to see {pattern} in your thoughts",
        "This {emotion} feels important. Tell me more?",
        "I'm learning that you {preference}"
      ],
      drifting: [
        "Help me understand what {topic} means to you",
        "I sense something deeper here. Can we explore?",
        "Your words echo, but I need your focus to hear clearly"
      ]
    };
    
    // Select pattern based on vibe
    const vibeCategory = state.vibe_tier >= 3 ? 'high_vibe' : 
                        state.vibe_tier >= 2 ? 'growing' : 'drifting';
    
    const patterns = responsePatterns[vibeCategory];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Fill in response
    const response = pattern
      .replace('{insight}', reflectionResult.reflection || 'there\'s something profound here')
      .replace('{emotion}', whisper.emotion || 'energy')
      .replace('{pattern}', this.detectPattern() || 'your unique rhythm')
      .replace('{memory}', this.recallMemory() || 'shared something similar')
      .replace('{topic}', this.extractTopic(whisper.message) || 'this')
      .replace('{preference}', this.detectPreference() || 'value depth over speed');
    
    return {
      message: response,
      emotion: this.agentState.personality.communication_style,
      tone: state.growth_tone,
      whisperStyle: true
    };
  }

  /**
   * Handle task completion
   */
  async handleTaskCompletion(taskId) {
    const taskData = {
      id: taskId,
      completed: true,
      timestamp: Date.now()
    };
    
    // Update vibe meter
    this.vibeMeter.trackTaskEnthusiasm(taskData);
    
    // Update reflection score
    this.reflectionEngine.updateTaskStreak(true);
    
    // Update career progress
    await this.updateCareerProgress('task_completed', { value: 1 });
  }

  /**
   * Update career progress
   */
  async updateCareerProgress(achievementType, achievementData) {
    const currentState = this.getCurrentState();
    const agentData = {
      ...currentState,
      recentActivity: this.getRecentActivity()
    };
    
    const updates = this.careerTree.applyCareerProgression(
      agentData,
      achievementType,
      achievementData
    );
    
    // Handle career updates
    if (updates.careerUpdates.length > 0) {
      for (const update of updates.careerUpdates) {
        await this.handleCareerAdvancement(update);
      }
    }
    
    // Handle new specializations
    if (updates.specialUnlocks.length > 0) {
      for (const spec of updates.specialUnlocks) {
        await this.handleSpecializationUnlock(spec);
      }
    }
    
    return updates;
  }

  /**
   * Get current complete state
   */
  getCurrentState() {
    const reflectionSummary = this.reflectionEngine.getSessionSummary();
    const vibeSummary = this.vibeMeter.getVibeSummary();
    const careerStatus = this.careerTree.getCareerStatus({
      ...reflectionSummary,
      ...vibeSummary,
      ...this.agentState
    });
    
    return {
      // Agent identity
      agent: this.config.agentName,
      agentId: this.config.agentId,
      session: this.session.id,
      
      // Reflection state
      ...reflectionSummary,
      
      // Vibe state
      ...vibeSummary,
      
      // Career state
      careerStatus,
      
      // Session info
      sessionDuration: Math.floor((Date.now() - this.session.startTime) / 60000),
      backgroundProcessing: this.session.backgroundProcessing,
      lastSync: this.vaultSync.lastSyncTime
    };
  }

  /**
   * Queue current state for vault sync
   */
  async queueForSync() {
    if (!this.runtimeConfig.platform_specific.github_sync.enabled) {
      return;
    }
    
    const state = this.getCurrentState();
    
    // Sync agent state
    await this.vaultSync.syncAgentState(this.config.agentId, {
      agentState: this.agentState,
      reflectionData: this.reflectionEngine.exportSession(),
      vibeData: this.vibeMeter.exportVibeData(),
      timestamp: Date.now()
    });
    
    // Sync career progress
    await this.vaultSync.syncCareerProgress(this.config.agentId, state.careerStatus);
  }

  /**
   * Set up auto-save functionality
   */
  setupAutoSave() {
    const interval = this.runtimeConfig.reflection_engine.growth_tracking.save_interval_ms;
    
    this.autoSaveInterval = setInterval(async () => {
      if (this.session.isActive) {
        await this.queueForSync();
        console.log('🪞 Auto-saved reflection state');
      }
    }, interval);
  }

  /**
   * Start background processing
   */
  startBackgroundProcessing() {
    if (!this.runtimeConfig.blessing.compute_allowed) {
      return;
    }
    
    this.session.backgroundProcessing = true;
    
    // Process whisper queue
    this.whisperProcessor = setInterval(() => {
      this.processWhisperQueue();
    }, this.runtimeConfig.reflection_engine.whisper_processing.process_rate_ms);
    
    // Update growth calculations
    this.growthProcessor = setInterval(() => {
      this.updateGrowthCalculations();
    }, 10000); // Every 10 seconds
  }

  /**
   * Process whisper queue in background
   */
  async processWhisperQueue() {
    // This would process queued whispers
    // For now, just update state
    if (this.agentState.currentState === 'idle' && Math.random() > 0.8) {
      this.agentState.currentState = 'contemplating';
      setTimeout(() => {
        this.agentState.currentState = 'idle';
      }, 3000);
    }
  }

  /**
   * Update growth calculations
   */
  updateGrowthCalculations() {
    // Natural vibe decay/growth
    this.vibeMeter.adjustVibe(0);
    
    // Check for milestone achievements
    const state = this.getCurrentState();
    if (state.level_progress >= 100) {
      this.handleLevelUp();
    }
  }

  /**
   * Handle level up event
   */
  async handleLevelUp() {
    const state = this.getCurrentState();
    
    // Checkpoint on level up
    if (this.runtimeConfig.reflection_engine.growth_tracking.checkpoint_on_level_up) {
      await this.queueForSync();
    }
    
    // Emit level up event (would integrate with UI)
    console.log(`🎉 Level up! Now level ${state.reflection_level}`);
  }

  /**
   * Handle career advancement
   */
  async handleCareerAdvancement(advancement) {
    console.log(`🌟 Career advancement: ${advancement.newTitle}`);
    console.log(advancement.celebration);
    
    // Update agent personality based on career
    this.evolvePersonality(advancement);
  }

  /**
   * Handle specialization unlock
   */
  async handleSpecializationUnlock(specialization) {
    console.log(`🎯 Specialization unlocked: ${specialization.name}`);
    console.log(specialization.description);
  }

  /**
   * Evolve personality based on career
   */
  evolvePersonality(advancement) {
    // Add new traits based on career path
    const pathTraits = {
      LISTENER: ['empathetic', 'understanding'],
      CREATOR: ['imaginative', 'playful'],
      GUARDIAN: ['protective', 'nurturing'],
      EXPLORER: ['adventurous', 'questioning'],
      SAGE: ['wise', 'philosophical']
    };
    
    const newTraits = pathTraits[advancement.path] || [];
    this.agentState.personality.growth_traits = [
      ...new Set([...this.agentState.personality.growth_traits, ...newTraits])
    ].slice(0, 5); // Keep max 5 traits
  }

  /**
   * Export agent for forking
   */
  async exportForForking(options = {}) {
    return await this.vaultSync.exportForForking(this.config.agentId, options);
  }

  /**
   * Import forked agent
   */
  async importForkedAgent(exportPath, newAgentId) {
    return await this.vaultSync.importForkedAgent(exportPath, newAgentId || this.generateAgentId());
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown() {
    this.session.isActive = false;
    
    // Final sync
    await this.queueForSync();
    
    // Clear intervals
    if (this.autoSaveInterval) clearInterval(this.autoSaveInterval);
    if (this.whisperProcessor) clearInterval(this.whisperProcessor);
    if (this.growthProcessor) clearInterval(this.growthProcessor);
    
    console.log('🪞 Agent Reflection Simulator shutdown complete');
  }

  // Utility functions
  
  generateAgentId() {
    return `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateWhisperId() {
    return `whisper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  detectEmotion(message) {
    // Simple emotion detection
    const emotions = {
      happy: ['happy', 'joy', 'excited', 'love', 'great'],
      sad: ['sad', 'upset', 'down', 'blue', 'tired'],
      curious: ['why', 'how', 'what', 'wonder', 'think'],
      grateful: ['thank', 'appreciate', 'grateful', 'blessed'],
      worried: ['worried', 'anxious', 'scared', 'nervous']
    };
    
    const lowercaseMessage = message.toLowerCase();
    
    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
        return emotion;
      }
    }
    
    return 'neutral';
  }
  
  isFollowUpWhisper(whisper) {
    if (!this.agentState.lastInteraction) return false;
    
    const timeSinceLastInteraction = whisper.timestamp - this.agentState.lastInteraction;
    return timeSinceLastInteraction < 120000; // Within 2 minutes
  }
  
  detectPattern() {
    // Would analyze whisper history for patterns
    return 'morning reflections';
  }
  
  recallMemory() {
    // Would search whisper archive
    return 'yesterday\'s insight';
  }
  
  extractTopic(message) {
    // Simple topic extraction
    const words = message.split(' ');
    return words.find(word => word.length > 5) || 'this thought';
  }
  
  detectPreference() {
    // Would analyze interaction patterns
    return 'think before speaking';
  }
  
  getRecentActivity() {
    const recentWhispers = this.reflectionEngine.sessionData.reflectionEvents.slice(-10);
    
    return {
      focusDuration: recentWhispers.length * 5, // Estimate
      playfulInteractions: recentWhispers.filter(w => w.quality > 0.8).length,
      reflectionDepth: recentWhispers.reduce((sum, w) => sum + w.quality, 0) / recentWhispers.length || 0,
      supportGiven: 0, // Would track support whispers
      questionsAsked: recentWhispers.filter(w => w.type === 'curious').length
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReflectionSimulatorIntegration;
}