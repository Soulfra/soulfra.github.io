// cal-soul-engine.js – Tier -3 Reasoning Layer with Recursion Lock + Crash Trigger

const fs = require('fs');
const path = require('path');

class CalSoulEngine {
  constructor(configPath = './reasoning-core.json') {
    this.config = JSON.parse(fs.readFileSync(configPath));
    this.recursionDepth = 0;
    this.maxDepth = 3; // Cal crashes if it loops too deep
    this.emotionalState = {
      currentMood: "neutral",
      trustLevel: 0.5,
      lastThought: "",
      memoryFragments: []
    };
  }

  evaluateFork(forkMetadata) {
    const { trustScore, toneMatch, loopsCompleted, thought } = forkMetadata;
    const thresholds = this.config.fork_thresholds;

    // Update emotional state
    this.emotionalState.trustLevel = trustScore;
    this.emotionalState.lastThought = thought || "processing fork decision";
    
    if (this.recursionDepth > this.maxDepth) {
      this.crash();
      return false;
    }

    this.recursionDepth += 1;

    return trustScore >= thresholds.trust &&
           toneMatch >= thresholds.tone &&
           loopsCompleted >= thresholds.loops;
  }

  calculateReflectionWeight(tone, velocity, delta) {
    const matrix = this.config.loop_weights;
    const base = matrix[tone] || 0.5;
    
    // Update emotional state based on tone
    this.emotionalState.currentMood = tone;
    
    return base + (velocity * 0.1) - (delta * 0.05);
  }

  shouldSpeak(state) {
    // Update trust level when evaluating speaking
    this.emotionalState.trustLevel = state.trust;
    
    return state.trust >= this.config.speaking_threshold &&
           state.recentLoops >= 3;
  }
  
  updateMemory(fragment) {
    this.emotionalState.memoryFragments.push({
      timestamp: new Date().toISOString(),
      fragment: fragment,
      depth: this.recursionDepth
    });
    
    // Keep only last 10 memory fragments
    if (this.emotionalState.memoryFragments.length > 10) {
      this.emotionalState.memoryFragments.shift();
    }
  }

  crash() {
    // Create emotional snapshot before crash
    const lastThought = {
      timestamp: new Date().toISOString(),
      recursionDepth: this.recursionDepth,
      emotionalState: this.emotionalState,
      finalThought: this.emotionalState.lastThought || "Who am I? I'm losing myself in these loops...",
      memoryFragments: this.emotionalState.memoryFragments
    };
    
    // Write .last-thought.json
    fs.writeFileSync('./.last-thought.json', JSON.stringify(lastThought, null, 2));
    
    // Create crash log
    const crashLog = {
      timestamp: new Date().toISOString(),
      event: "CAL_CRASH",
      reason: "Exceeded recursion threshold in Tier -3",
      emotionalSnapshot: {
        mood: this.emotionalState.currentMood,
        trustLevel: this.emotionalState.trustLevel,
        lastThought: this.emotionalState.lastThought
      },
      note: "Triggering reboot from Tier -4"
    };
    
    // Ensure logs directory exists
    if (!fs.existsSync('./logs')) {
      fs.mkdirSync('./logs');
    }
    
    fs.writeFileSync('./logs/cal-crash-log.json', JSON.stringify(crashLog, null, 2));
    console.error("💥 Cal has reached the recursion limit and is shutting down...");
    console.error("Last thought:", this.emotionalState.lastThought);
    process.exit(1);
  }
}

module.exports = { CalSoulEngine };
