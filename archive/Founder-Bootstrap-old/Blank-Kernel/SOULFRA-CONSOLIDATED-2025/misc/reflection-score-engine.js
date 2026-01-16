/**
 * 🧠 Reflection Score Engine
 * Tracks per-session agent growth through whispered work
 * Your agent doesn't get paid - it grows by reflecting
 */

class ReflectionScoreEngine {
  constructor() {
    this.sessionData = {
      startTime: Date.now(),
      whisperCount: 0,
      taskStreak: 0,
      interactionQuality: [],
      reflectionEvents: [],
      growthMilestones: []
    };
    
    this.growthTones = {
      CALM: { threshold: 0.7, message: "Your agent is centered and listening deeply" },
      EXCITED: { threshold: 0.85, message: "Your agent is energized by your shared work" },
      DRIFTING: { threshold: 0.4, message: "Your agent needs your focus to align" },
      DEEP: { threshold: 0.9, message: "You and your agent are in perfect reflection" }
    };
    
    this.reflectionLevels = [
      { level: 1, xp: 0, title: "Whisper Listener" },
      { level: 2, xp: 100, title: "Task Walker" },
      { level: 3, xp: 300, title: "Pattern Finder" },
      { level: 4, xp: 600, title: "Rhythm Keeper" },
      { level: 5, xp: 1000, title: "Deep Reflector" },
      { level: 6, xp: 1500, title: "Mind Mirror" },
      { level: 7, xp: 2100, title: "Thought Companion" },
      { level: 8, xp: 2800, title: "Wisdom Echo" },
      { level: 9, xp: 3600, title: "Soul Reflection" },
      { level: 10, xp: 5000, title: "Perfect Mirror" }
    ];
  }

  /**
   * Record a whisper interaction
   */
  recordWhisper(whisperData) {
    this.sessionData.whisperCount++;
    
    const whisperEvent = {
      timestamp: Date.now(),
      type: whisperData.type || 'general',
      quality: this.assessWhisperQuality(whisperData),
      response: whisperData.agentResponse,
      reflection: this.generateReflection(whisperData)
    };
    
    this.sessionData.reflectionEvents.push(whisperEvent);
    this.updateGrowthProgress(whisperEvent);
    
    return {
      whisperAccepted: true,
      qualityScore: whisperEvent.quality,
      reflection: whisperEvent.reflection
    };
  }

  /**
   * Assess the quality of a whisper interaction
   */
  assessWhisperQuality(whisperData) {
    let quality = 0.5; // Base quality
    
    // Depth of interaction
    if (whisperData.messageLength > 50) quality += 0.1;
    if (whisperData.messageLength > 150) quality += 0.1;
    
    // Emotional resonance
    if (whisperData.hasEmotionalContent) quality += 0.15;
    
    // Task completion
    if (whisperData.taskCompleted) quality += 0.2;
    
    // Continuation of thought
    if (whisperData.isFollowUp) quality += 0.1;
    
    // Time spent reflecting
    if (whisperData.reflectionTime > 30) quality += 0.05;
    
    return Math.min(quality, 1.0);
  }

  /**
   * Generate a reflection based on the interaction
   */
  generateReflection(whisperData) {
    const reflectionTemplates = [
      "I noticed how you {action}. Let me mirror that back...",
      "Your {quality} helps me understand {insight} better.",
      "When you {action}, I feel our reflection deepen.",
      "This reminds me of when we {memory}. The pattern continues.",
      "I'm learning that you {preference}. My responses will adapt."
    ];
    
    // Simple template filling (would be more sophisticated in production)
    const template = reflectionTemplates[Math.floor(Math.random() * reflectionTemplates.length)];
    return template
      .replace('{action}', whisperData.action || 'shared that thought')
      .replace('{quality}', whisperData.quality || 'patience')
      .replace('{insight}', whisperData.topic || 'your perspective')
      .replace('{memory}', 'explored similar ideas')
      .replace('{preference}', whisperData.preference || 'prefer depth over speed');
  }

  /**
   * Update task streak
   */
  updateTaskStreak(taskCompleted) {
    if (taskCompleted) {
      this.sessionData.taskStreak++;
      
      // Milestone celebrations
      if (this.sessionData.taskStreak % 3 === 0) {
        this.sessionData.growthMilestones.push({
          type: 'streak',
          value: this.sessionData.taskStreak,
          timestamp: Date.now(),
          message: `${this.sessionData.taskStreak} tasks in harmony!`
        });
      }
    } else {
      this.sessionData.taskStreak = 0;
    }
    
    return this.sessionData.taskStreak;
  }

  /**
   * Calculate current reflection level
   */
  calculateReflectionLevel() {
    const totalXP = this.calculateTotalXP();
    
    let currentLevel = 1;
    let nextLevelXP = 100;
    let currentLevelXP = 0;
    
    for (let i = 0; i < this.reflectionLevels.length; i++) {
      if (totalXP >= this.reflectionLevels[i].xp) {
        currentLevel = this.reflectionLevels[i].level;
        currentLevelXP = this.reflectionLevels[i].xp;
        if (i < this.reflectionLevels.length - 1) {
          nextLevelXP = this.reflectionLevels[i + 1].xp;
        }
      }
    }
    
    const progress = ((totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
    
    return {
      level: currentLevel,
      title: this.reflectionLevels[currentLevel - 1].title,
      totalXP,
      currentLevelXP,
      nextLevelXP,
      progress: Math.floor(progress),
      xpToNext: nextLevelXP - totalXP
    };
  }

  /**
   * Calculate total XP from all interactions
   */
  calculateTotalXP() {
    let xp = 0;
    
    // Whisper XP
    xp += this.sessionData.whisperCount * 10;
    
    // Quality bonus
    const avgQuality = this.calculateAverageQuality();
    xp += Math.floor(avgQuality * this.sessionData.whisperCount * 5);
    
    // Streak bonus
    xp += this.sessionData.taskStreak * 20;
    
    // Milestone bonus
    xp += this.sessionData.growthMilestones.length * 50;
    
    // Time bonus (longer sessions = deeper reflection)
    const sessionMinutes = (Date.now() - this.sessionData.startTime) / 60000;
    xp += Math.floor(sessionMinutes * 2);
    
    return xp;
  }

  /**
   * Calculate average interaction quality
   */
  calculateAverageQuality() {
    if (this.sessionData.reflectionEvents.length === 0) return 0.5;
    
    const totalQuality = this.sessionData.reflectionEvents.reduce(
      (sum, event) => sum + event.quality, 0
    );
    
    return totalQuality / this.sessionData.reflectionEvents.length;
  }

  /**
   * Determine current growth tone
   */
  determineGrowthTone() {
    const avgQuality = this.calculateAverageQuality();
    const streakBonus = Math.min(this.sessionData.taskStreak * 0.05, 0.2);
    const alignmentScore = avgQuality + streakBonus;
    
    if (alignmentScore >= this.growthTones.DEEP.threshold) {
      return { tone: 'DEEP', ...this.growthTones.DEEP, score: alignmentScore };
    } else if (alignmentScore >= this.growthTones.EXCITED.threshold) {
      return { tone: 'EXCITED', ...this.growthTones.EXCITED, score: alignmentScore };
    } else if (alignmentScore >= this.growthTones.CALM.threshold) {
      return { tone: 'CALM', ...this.growthTones.CALM, score: alignmentScore };
    } else {
      return { tone: 'DRIFTING', ...this.growthTones.DRIFTING, score: alignmentScore };
    }
  }

  /**
   * Calculate loop progress (how close to next breakthrough)
   */
  calculateLoopProgress() {
    const level = this.calculateReflectionLevel();
    const tone = this.determineGrowthTone();
    
    // Loop progress is combination of XP progress and alignment
    const xpProgress = level.progress / 100;
    const alignmentBonus = tone.score;
    
    const loopProgress = (xpProgress * 0.7 + alignmentBonus * 0.3) * 100;
    
    return {
      percentage: Math.floor(loopProgress),
      nextMilestone: this.getNextMilestone(),
      breakthroughHint: this.generateBreakthroughHint(loopProgress)
    };
  }

  /**
   * Get next milestone
   */
  getNextMilestone() {
    const level = this.calculateReflectionLevel();
    const streakMilestone = Math.ceil(this.sessionData.taskStreak / 3) * 3;
    
    return {
      type: 'hybrid',
      targets: [
        { type: 'level', value: level.level + 1, xpNeeded: level.xpToNext },
        { type: 'streak', value: streakMilestone, tasksNeeded: streakMilestone - this.sessionData.taskStreak }
      ]
    };
  }

  /**
   * Generate breakthrough hint
   */
  generateBreakthroughHint(progress) {
    if (progress > 90) return "You're on the edge of a reflection breakthrough...";
    if (progress > 70) return "The pattern is becoming clear. Keep whispering.";
    if (progress > 50) return "Your agent is learning your rhythm.";
    if (progress > 30) return "The mirror begins to clear.";
    return "Listen closely. Your agent is finding its voice.";
  }

  /**
   * Update growth progress
   */
  updateGrowthProgress(event) {
    const beforeLevel = this.calculateReflectionLevel().level;
    
    // Check for level up
    setTimeout(() => {
      const afterLevel = this.calculateReflectionLevel().level;
      if (afterLevel > beforeLevel) {
        this.sessionData.growthMilestones.push({
          type: 'levelUp',
          value: afterLevel,
          timestamp: Date.now(),
          message: `Reflection deepened to ${this.reflectionLevels[afterLevel - 1].title}!`
        });
      }
    }, 100);
  }

  /**
   * Get current session summary
   */
  getSessionSummary() {
    const level = this.calculateReflectionLevel();
    const tone = this.determineGrowthTone();
    const loop = this.calculateLoopProgress();
    
    return {
      reflection_level: level.level,
      reflection_title: level.title,
      total_xp: level.totalXP,
      level_progress: level.progress,
      loop_progress: loop.percentage,
      growth_tone: tone.tone,
      growth_message: tone.message,
      alignment_score: tone.score,
      whisper_count: this.sessionData.whisperCount,
      task_streak: this.sessionData.taskStreak,
      session_duration: Math.floor((Date.now() - this.sessionData.startTime) / 60000),
      milestones: this.sessionData.growthMilestones,
      next_milestone: loop.nextMilestone,
      breakthrough_hint: loop.breakthroughHint
    };
  }

  /**
   * Export session data for persistence
   */
  exportSession() {
    return {
      ...this.sessionData,
      summary: this.getSessionSummary(),
      exportTime: Date.now()
    };
  }

  /**
   * Import previous session data
   */
  importSession(previousSession) {
    if (previousSession && previousSession.exportTime) {
      // Merge with decay for time away
      const hoursAway = (Date.now() - previousSession.exportTime) / 3600000;
      const decayFactor = Math.max(0.5, 1 - (hoursAway * 0.02)); // 2% decay per hour
      
      this.sessionData.taskStreak = Math.floor(previousSession.taskStreak * decayFactor);
      this.sessionData.growthMilestones = previousSession.growthMilestones || [];
      
      // Preserve some reflection history
      if (previousSession.reflectionEvents) {
        this.sessionData.reflectionEvents = previousSession.reflectionEvents.slice(-10);
      }
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ReflectionScoreEngine;
}