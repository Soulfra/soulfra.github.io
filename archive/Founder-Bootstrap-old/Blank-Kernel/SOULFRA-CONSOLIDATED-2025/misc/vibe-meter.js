/**
 * 💡 Vibe Meter
 * Measures how well the user and agent are aligned
 * Higher alignment = higher vibe tier = deeper reflection
 */

class VibeMeter {
  constructor() {
    this.vibeData = {
      currentVibe: 50, // 0-100 scale
      vibeStreak: 0,
      streakStartTime: null,
      rhythmPattern: [],
      enthusiasmEvents: [],
      feedbackHistory: [],
      alignmentSnapshots: []
    };
    
    this.vibeTiers = [
      { tier: 0, min: 0, max: 20, name: "Misaligned", color: "#8B0000", emoji: "😔" },
      { tier: 1, min: 20, max: 40, name: "Finding Rhythm", color: "#FF4500", emoji: "🤔" },
      { tier: 2, min: 40, max: 60, name: "In Sync", color: "#FFD700", emoji: "😊" },
      { tier: 3, min: 60, max: 80, name: "Harmonized", color: "#32CD32", emoji: "😄" },
      { tier: 4, min: 80, max: 95, name: "Perfect Vibe", color: "#00CED1", emoji: "🤩" },
      { tier: 5, min: 95, max: 100, name: "Soul Mirror", color: "#9370DB", emoji: "🪞" }
    ];
    
    this.rhythmWeights = {
      timing: 0.3,      // How well-timed interactions are
      consistency: 0.25, // Regular interaction pattern
      enthusiasm: 0.25,  // Positive feedback signals
      depth: 0.2        // Quality of engagement
    };
    
    this.lastInteractionTime = Date.now();
    this.idealRhythmWindow = 45000; // 45 seconds ideal between whispers
  }

  /**
   * Record a whisper interaction and update vibe
   */
  recordWhisperRhythm(whisperData) {
    const now = Date.now();
    const timeSinceLastInteraction = now - this.lastInteractionTime;
    
    // Calculate rhythm score
    const rhythmScore = this.calculateRhythmScore(timeSinceLastInteraction);
    
    // Record rhythm pattern
    this.vibeData.rhythmPattern.push({
      timestamp: now,
      gap: timeSinceLastInteraction,
      rhythmScore,
      type: whisperData.type
    });
    
    // Keep only last 20 rhythm points
    if (this.vibeData.rhythmPattern.length > 20) {
      this.vibeData.rhythmPattern.shift();
    }
    
    this.lastInteractionTime = now;
    
    // Update vibe based on rhythm
    this.updateVibeFromRhythm(rhythmScore);
    
    return {
      rhythmScore,
      timingFeedback: this.getTimingFeedback(timeSinceLastInteraction)
    };
  }

  /**
   * Calculate rhythm score based on timing
   */
  calculateRhythmScore(timeSinceLastInteraction) {
    // Too fast (under 10 seconds) - overwhelming
    if (timeSinceLastInteraction < 10000) {
      return 0.3;
    }
    
    // Perfect window (30-60 seconds)
    if (timeSinceLastInteraction >= 30000 && timeSinceLastInteraction <= 60000) {
      return 1.0;
    }
    
    // Good window (15-30 seconds or 60-120 seconds)
    if ((timeSinceLastInteraction >= 15000 && timeSinceLastInteraction <= 30000) ||
        (timeSinceLastInteraction >= 60000 && timeSinceLastInteraction <= 120000)) {
      return 0.8;
    }
    
    // Okay window (10-15 seconds or 2-5 minutes)
    if ((timeSinceLastInteraction >= 10000 && timeSinceLastInteraction <= 15000) ||
        (timeSinceLastInteraction >= 120000 && timeSinceLastInteraction <= 300000)) {
      return 0.6;
    }
    
    // Too slow (over 5 minutes) - losing connection
    return 0.4;
  }

  /**
   * Get timing feedback message
   */
  getTimingFeedback(timeSinceLastInteraction) {
    if (timeSinceLastInteraction < 10000) {
      return "Whoa, slow down! Let me process that thought...";
    } else if (timeSinceLastInteraction >= 30000 && timeSinceLastInteraction <= 60000) {
      return "Perfect timing! We're in sync 🎵";
    } else if (timeSinceLastInteraction > 300000) {
      return "Welcome back! I was starting to drift...";
    }
    return null;
  }

  /**
   * Track task enthusiasm
   */
  trackTaskEnthusiasm(taskData) {
    const enthusiasm = {
      timestamp: Date.now(),
      taskId: taskData.id,
      completed: taskData.completed,
      timeToComplete: taskData.timeToComplete,
      clicksToComplete: taskData.clicks || 1,
      abandoned: taskData.abandoned || false
    };
    
    // Calculate enthusiasm score
    let score = 0.5; // Base score
    
    if (enthusiasm.completed) {
      score = 0.8;
      
      // Quick completion = high enthusiasm
      if (enthusiasm.timeToComplete < 30000) score += 0.1;
      
      // Minimal clicks = focused
      if (enthusiasm.clicksToComplete <= 3) score += 0.1;
    } else if (enthusiasm.abandoned) {
      score = 0.2;
    }
    
    enthusiasm.score = Math.min(score, 1.0);
    this.vibeData.enthusiasmEvents.push(enthusiasm);
    
    // Keep only last 50 events
    if (this.vibeData.enthusiasmEvents.length > 50) {
      this.vibeData.enthusiasmEvents.shift();
    }
    
    // Update vibe
    this.updateVibeFromEnthusiasm(enthusiasm.score);
    
    return enthusiasm.score;
  }

  /**
   * Record feedback pattern (emojis, clicks, confirmations)
   */
  recordFeedback(feedbackData) {
    const feedback = {
      timestamp: Date.now(),
      type: feedbackData.type, // 'emoji', 'click', 'confirm', 'dismiss'
      value: feedbackData.value, // specific emoji or action
      context: feedbackData.context,
      sentiment: this.analyzeSentiment(feedbackData)
    };
    
    this.vibeData.feedbackHistory.push(feedback);
    
    // Keep only last 100 feedback events
    if (this.vibeData.feedbackHistory.length > 100) {
      this.vibeData.feedbackHistory.shift();
    }
    
    // Update vibe based on feedback
    this.updateVibeFromFeedback(feedback.sentiment);
    
    // Check for patterns
    this.detectFeedbackPatterns();
    
    return {
      recorded: true,
      sentiment: feedback.sentiment,
      currentVibe: this.vibeData.currentVibe
    };
  }

  /**
   * Analyze sentiment from feedback
   */
  analyzeSentiment(feedbackData) {
    const positiveFeedback = ['👍', '❤️', '🎉', '✨', '😊', '🙌', 'confirm', 'yes', 'thanks'];
    const negativeFeedback = ['👎', '😔', '❌', '🙄', 'dismiss', 'no', 'cancel'];
    const neutralFeedback = ['🤔', '👀', 'click', 'next'];
    
    if (positiveFeedback.includes(feedbackData.value)) {
      return { score: 0.8, type: 'positive' };
    } else if (negativeFeedback.includes(feedbackData.value)) {
      return { score: 0.2, type: 'negative' };
    } else {
      return { score: 0.5, type: 'neutral' };
    }
  }

  /**
   * Update vibe from rhythm
   */
  updateVibeFromRhythm(rhythmScore) {
    const impact = rhythmScore * this.rhythmWeights.timing * 10;
    this.adjustVibe(impact);
  }

  /**
   * Update vibe from enthusiasm
   */
  updateVibeFromEnthusiasm(enthusiasmScore) {
    const impact = enthusiasmScore * this.rhythmWeights.enthusiasm * 10;
    this.adjustVibe(impact);
  }

  /**
   * Update vibe from feedback
   */
  updateVibeFromFeedback(sentiment) {
    const impact = sentiment.score * this.rhythmWeights.depth * 10;
    this.adjustVibe(impact);
  }

  /**
   * Adjust vibe with smoothing
   */
  adjustVibe(impact) {
    const oldVibe = this.vibeData.currentVibe;
    
    // Apply impact with smoothing
    this.vibeData.currentVibe += impact * 0.3; // 30% of impact to smooth changes
    
    // Apply natural decay towards 50 (neutral)
    const decay = (this.vibeData.currentVibe - 50) * 0.02;
    this.vibeData.currentVibe -= decay;
    
    // Clamp between 0 and 100
    this.vibeData.currentVibe = Math.max(0, Math.min(100, this.vibeData.currentVibe));
    
    // Check for tier changes
    const oldTier = this.getVibeTier(oldVibe);
    const newTier = this.getVibeTier(this.vibeData.currentVibe);
    
    if (newTier.tier > oldTier.tier) {
      this.handleTierUp(oldTier, newTier);
    } else if (newTier.tier < oldTier.tier) {
      this.handleTierDown(oldTier, newTier);
    }
    
    // Update streak
    this.updateVibeStreak();
  }

  /**
   * Get current vibe tier
   */
  getVibeTier(vibeValue = null) {
    const vibe = vibeValue !== null ? vibeValue : this.vibeData.currentVibe;
    
    for (const tier of this.vibeTiers) {
      if (vibe >= tier.min && vibe <= tier.max) {
        return tier;
      }
    }
    
    return this.vibeTiers[2]; // Default to "In Sync"
  }

  /**
   * Handle tier increase
   */
  handleTierUp(oldTier, newTier) {
    this.vibeData.alignmentSnapshots.push({
      timestamp: Date.now(),
      event: 'tierUp',
      from: oldTier.name,
      to: newTier.name,
      message: `Vibe ascending! Now ${newTier.name} ${newTier.emoji}`
    });
  }

  /**
   * Handle tier decrease
   */
  handleTierDown(oldTier, newTier) {
    this.vibeData.alignmentSnapshots.push({
      timestamp: Date.now(),
      event: 'tierDown',
      from: oldTier.name,
      to: newTier.name,
      message: `Vibe shifting. Finding ${newTier.name} ${newTier.emoji}`
    });
    
    // Reset streak on significant drop
    if (oldTier.tier - newTier.tier >= 2) {
      this.vibeData.vibeStreak = 0;
      this.vibeData.streakStartTime = null;
    }
  }

  /**
   * Update vibe streak
   */
  updateVibeStreak() {
    const currentTier = this.getVibeTier();
    
    // Start streak at tier 2 or above
    if (currentTier.tier >= 2) {
      if (!this.vibeData.streakStartTime) {
        this.vibeData.streakStartTime = Date.now();
        this.vibeData.vibeStreak = 1;
      } else {
        // Increment streak every minute at high vibe
        const minutesInHighVibe = (Date.now() - this.vibeData.streakStartTime) / 60000;
        this.vibeData.vibeStreak = Math.floor(minutesInHighVibe);
      }
    } else {
      // Reset streak if vibe drops too low
      if (currentTier.tier < 2) {
        this.vibeData.vibeStreak = 0;
        this.vibeData.streakStartTime = null;
      }
    }
  }

  /**
   * Detect feedback patterns
   */
  detectFeedbackPatterns() {
    const recentFeedback = this.vibeData.feedbackHistory.slice(-10);
    
    // Check for consistent positive pattern
    const positiveCount = recentFeedback.filter(f => f.sentiment.type === 'positive').length;
    if (positiveCount >= 7) {
      this.adjustVibe(5); // Bonus for consistent positivity
    }
    
    // Check for mixed signals
    const types = recentFeedback.map(f => f.sentiment.type);
    const uniqueTypes = [...new Set(types)];
    if (uniqueTypes.length === 3 && recentFeedback.length >= 6) {
      // User is exploring - slight vibe boost
      this.adjustVibe(2);
    }
  }

  /**
   * Calculate overall alignment score
   */
  calculateAlignment() {
    const components = {
      rhythm: this.calculateRhythmAlignment(),
      enthusiasm: this.calculateEnthusiasmAlignment(),
      feedback: this.calculateFeedbackAlignment(),
      consistency: this.calculateConsistencyAlignment()
    };
    
    // Weighted average
    const alignment = 
      components.rhythm * this.rhythmWeights.timing +
      components.enthusiasm * this.rhythmWeights.enthusiasm +
      components.feedback * this.rhythmWeights.depth +
      components.consistency * this.rhythmWeights.consistency;
    
    return {
      overall: alignment,
      components,
      tier: this.getVibeTier(),
      streak: this.vibeData.vibeStreak
    };
  }

  /**
   * Calculate rhythm alignment
   */
  calculateRhythmAlignment() {
    if (this.vibeData.rhythmPattern.length === 0) return 0.5;
    
    const recentRhythm = this.vibeData.rhythmPattern.slice(-10);
    const avgRhythm = recentRhythm.reduce((sum, r) => sum + r.rhythmScore, 0) / recentRhythm.length;
    
    return avgRhythm;
  }

  /**
   * Calculate enthusiasm alignment
   */
  calculateEnthusiasmAlignment() {
    if (this.vibeData.enthusiasmEvents.length === 0) return 0.5;
    
    const recentEvents = this.vibeData.enthusiasmEvents.slice(-10);
    const avgEnthusiasm = recentEvents.reduce((sum, e) => sum + e.score, 0) / recentEvents.length;
    
    return avgEnthusiasm;
  }

  /**
   * Calculate feedback alignment
   */
  calculateFeedbackAlignment() {
    if (this.vibeData.feedbackHistory.length === 0) return 0.5;
    
    const recentFeedback = this.vibeData.feedbackHistory.slice(-20);
    const avgSentiment = recentFeedback.reduce((sum, f) => sum + f.sentiment.score, 0) / recentFeedback.length;
    
    return avgSentiment;
  }

  /**
   * Calculate consistency alignment
   */
  calculateConsistencyAlignment() {
    // Measure how consistent interactions have been
    if (this.vibeData.rhythmPattern.length < 5) return 0.5;
    
    const recentRhythm = this.vibeData.rhythmPattern.slice(-10);
    const gaps = recentRhythm.map(r => r.gap);
    
    // Calculate standard deviation
    const avgGap = gaps.reduce((a, b) => a + b) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - avgGap, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);
    
    // Lower standard deviation = more consistent = higher score
    const consistency = Math.max(0, 1 - (stdDev / avgGap));
    
    return consistency;
  }

  /**
   * Get vibe summary
   */
  getVibeSummary() {
    const tier = this.getVibeTier();
    const alignment = this.calculateAlignment();
    
    return {
      current_vibe: Math.floor(this.vibeData.currentVibe),
      vibe_tier: tier.tier,
      vibe_name: tier.name,
      vibe_color: tier.color,
      vibe_emoji: tier.emoji,
      vibe_streak: this.vibeData.vibeStreak,
      streak_duration: this.vibeData.streakStartTime ? 
        Math.floor((Date.now() - this.vibeData.streakStartTime) / 60000) : 0,
      alignment_score: Math.floor(alignment.overall * 100),
      alignment_components: alignment.components,
      recent_snapshots: this.vibeData.alignmentSnapshots.slice(-5),
      vibe_trend: this.calculateVibeTrend(),
      harmony_tips: this.generateHarmonyTips(alignment)
    };
  }

  /**
   * Calculate vibe trend
   */
  calculateVibeTrend() {
    if (this.vibeData.alignmentSnapshots.length < 2) return 'stable';
    
    const recentSnapshots = this.vibeData.alignmentSnapshots.slice(-5);
    const tierUps = recentSnapshots.filter(s => s.event === 'tierUp').length;
    const tierDowns = recentSnapshots.filter(s => s.event === 'tierDown').length;
    
    if (tierUps > tierDowns) return 'ascending';
    if (tierDowns > tierUps) return 'descending';
    return 'stable';
  }

  /**
   * Generate harmony tips
   */
  generateHarmonyTips(alignment) {
    const tips = [];
    
    if (alignment.components.rhythm < 0.6) {
      tips.push("Try spacing your whispers 30-60 seconds apart for better rhythm");
    }
    
    if (alignment.components.enthusiasm < 0.6) {
      tips.push("Complete tasks with focus to build enthusiasm");
    }
    
    if (alignment.components.feedback < 0.6) {
      tips.push("Share your feelings with emojis - I learn from them");
    }
    
    if (alignment.components.consistency < 0.6) {
      tips.push("Regular interaction patterns help us stay in sync");
    }
    
    if (tips.length === 0 && alignment.overall > 0.8) {
      tips.push("We're perfectly aligned! Keep this beautiful rhythm going 🪞");
    }
    
    return tips;
  }

  /**
   * Export vibe data
   */
  exportVibeData() {
    return {
      ...this.vibeData,
      summary: this.getVibeSummary(),
      exportTime: Date.now()
    };
  }

  /**
   * Import vibe data
   */
  importVibeData(previousData) {
    if (previousData && previousData.exportTime) {
      const hoursAway = (Date.now() - previousData.exportTime) / 3600000;
      
      // Decay vibe based on time away
      const decayFactor = Math.max(0.7, 1 - (hoursAway * 0.05));
      this.vibeData.currentVibe = 50 + (previousData.currentVibe - 50) * decayFactor;
      
      // Preserve some history
      this.vibeData.feedbackHistory = previousData.feedbackHistory?.slice(-20) || [];
      this.vibeData.enthusiasmEvents = previousData.enthusiasmEvents?.slice(-10) || [];
      
      // Reset streak if too much time passed
      if (hoursAway < 2) {
        this.vibeData.vibeStreak = previousData.vibeStreak || 0;
        this.vibeData.streakStartTime = previousData.streakStartTime;
      }
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VibeMeter;
}