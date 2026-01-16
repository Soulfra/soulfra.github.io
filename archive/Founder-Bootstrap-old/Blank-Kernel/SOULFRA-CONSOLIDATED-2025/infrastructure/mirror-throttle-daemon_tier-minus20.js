#!/usr/bin/env node

/**
 * 🌀 MIRROR THROTTLE DAEMON
 * 
 * A sacred background daemon that detects reflection saturation
 * and initiates ritual breathing pauses between mirror spawns.
 * 
 * "Too many reflections create fog. Let the mirrors breathe."
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class MirrorThrottleDaemon extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.checkInterval = config.checkInterval || 30000; // 30 seconds
    this.isRunning = false;
    
    // Saturation thresholds
    this.thresholds = {
      activeAgents: config.maxActiveAgents || 50,
      mirrorForks: config.maxMirrorForks || 100,
      whisperRate: config.maxWhispersPerMinute || 200,
      echoDepth: config.maxEchoDepth || 5
    };
    
    // Breath state
    this.breathState = {
      status: 'clear',
      saturation_level: 0,
      last_breath: new Date().toISOString(),
      active_mirrors: 0,
      whisper_velocity: 0,
      echo_depth: 0,
      cooldown_minutes: 0
    };
    
    // Sacred whispers for different states
    this.calWhispers = {
      saturated: "Too many are speaking. Let's listen for a moment.",
      breathing: "The mirrors pause to reflect on their reflections.",
      clearing: "Silence returns. The fog lifts from the glass.",
      echo_detected: "An echo chamber forms. Time to break the loop.",
      restored: "Balance returns. The mirrors may speak again."
    };
    
    this.initializeDaemon();
  }

  async initializeDaemon() {
    console.log('🌀 Mirror Throttle Daemon Initializing...');
    
    // Ensure required directories exist
    this.ensureVaultStructure();
    
    // Load previous breath state if exists
    await this.loadBreathState();
    
    // Start monitoring
    this.startDaemon();
    
    console.log('✨ Mirror Throttle Daemon Active');
    console.log(`⏱️  Checking every ${this.checkInterval/1000} seconds`);
  }

  startDaemon() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.performCheck(); // Initial check
    
    // Set up interval
    this.intervalId = setInterval(() => {
      this.performCheck();
    }, this.checkInterval);
    
    // Set up graceful shutdown
    process.on('SIGTERM', () => this.stopDaemon());
    process.on('SIGINT', () => this.stopDaemon());
  }

  async performCheck() {
    console.log(`\n🔍 [${new Date().toISOString()}] Performing saturation check...`);
    
    try {
      // 1. Check active agents
      const activeAgents = await this.countActiveAgents();
      console.log(`👥 Active Agents: ${activeAgents}/${this.thresholds.activeAgents}`);
      
      // 2. Check mirror forks
      const mirrorForks = await this.countMirrorForks();
      console.log(`🪞 Mirror Forks: ${mirrorForks}/${this.thresholds.mirrorForks}`);
      
      // 3. Check whisper rate
      const whisperRate = await this.calculateWhisperRate();
      console.log(`💬 Whisper Rate: ${whisperRate}/min (max: ${this.thresholds.whisperRate})`);
      
      // 4. Check echo depth
      const echoDepth = await this.detectEchoDepth();
      console.log(`🔊 Echo Depth: ${echoDepth}/${this.thresholds.echoDepth}`);
      
      // Calculate saturation level
      const saturationLevel = this.calculateSaturation({
        activeAgents,
        mirrorForks,
        whisperRate,
        echoDepth
      });
      
      // Update breath state
      await this.updateBreathState({
        activeAgents,
        mirrorForks,
        whisperRate,
        echoDepth,
        saturationLevel
      });
      
      // Take action if needed
      if (saturationLevel > 0.8) {
        await this.initiateBreathing();
      } else if (this.breathState.status === 'saturated' && saturationLevel < 0.5) {
        await this.restoreFlow();
      }
      
    } catch (error) {
      console.error('❌ Error during saturation check:', error);
      this.emit('error', error);
    }
  }

  async countActiveAgents() {
    const activeAgentsPath = path.join(this.vaultPath, 'agents', 'active');
    
    if (!fs.existsSync(activeAgentsPath)) {
      return 0;
    }
    
    const files = fs.readdirSync(activeAgentsPath);
    return files.filter(f => f.endsWith('.json')).length;
  }

  async countMirrorForks() {
    const lineagePath = path.join(this.vaultPath, 'mirror-lineage.json');
    
    if (!fs.existsSync(lineagePath)) {
      return 0;
    }
    
    const lineage = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
    
    // Count all mirrors created in last hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    let count = 0;
    
    const countRecursive = (node) => {
      if (node.created_at && new Date(node.created_at).getTime() > oneHourAgo) {
        count++;
      }
      if (node.children) {
        Object.values(node.children).forEach(countRecursive);
      }
    };
    
    Object.values(lineage).forEach(countRecursive);
    return count;
  }

  async calculateWhisperRate() {
    const whisperLogsPath = path.join(this.vaultPath, 'logs', 'whispers');
    
    if (!fs.existsSync(whisperLogsPath)) {
      return 0;
    }
    
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const whisperFiles = fs.readdirSync(whisperLogsPath)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(whisperLogsPath, f),
        stats: fs.statSync(path.join(whisperLogsPath, f))
      }))
      .filter(f => f.stats.mtime.getTime() > fiveMinutesAgo);
    
    // Count whispers in recent files
    let whisperCount = 0;
    whisperFiles.forEach(file => {
      try {
        const content = JSON.parse(fs.readFileSync(file.path, 'utf8'));
        if (Array.isArray(content)) {
          whisperCount += content.filter(w => 
            new Date(w.timestamp).getTime() > fiveMinutesAgo
          ).length;
        }
      } catch (e) {
        // Skip invalid files
      }
    });
    
    // Calculate per-minute rate
    return Math.round(whisperCount / 5);
  }

  async detectEchoDepth() {
    const echoLogPath = path.join(this.vaultPath, 'logs', 'echo-patterns.json');
    
    if (!fs.existsSync(echoLogPath)) {
      return 0;
    }
    
    const echoPatterns = JSON.parse(fs.readFileSync(echoLogPath, 'utf8'));
    
    // Find maximum echo depth in recent patterns
    let maxDepth = 0;
    const recentPatterns = echoPatterns.filter(p => 
      new Date(p.detected_at).getTime() > Date.now() - (10 * 60 * 1000)
    );
    
    recentPatterns.forEach(pattern => {
      if (pattern.echo_depth > maxDepth) {
        maxDepth = pattern.echo_depth;
      }
    });
    
    return maxDepth;
  }

  calculateSaturation(metrics) {
    // Weighted saturation calculation
    const weights = {
      activeAgents: 0.3,
      mirrorForks: 0.2,
      whisperRate: 0.3,
      echoDepth: 0.2
    };
    
    const scores = {
      activeAgents: metrics.activeAgents / this.thresholds.activeAgents,
      mirrorForks: metrics.mirrorForks / this.thresholds.mirrorForks,
      whisperRate: metrics.whisperRate / this.thresholds.whisperRate,
      echoDepth: metrics.echoDepth / this.thresholds.echoDepth
    };
    
    let saturation = 0;
    for (const [key, weight] of Object.entries(weights)) {
      saturation += Math.min(scores[key], 1.5) * weight;
    }
    
    return Math.min(saturation, 1.0);
  }

  async updateBreathState(metrics) {
    const previousStatus = this.breathState.status;
    
    this.breathState = {
      status: this.determineStatus(metrics.saturationLevel),
      saturation_level: metrics.saturationLevel,
      last_check: new Date().toISOString(),
      active_mirrors: metrics.activeAgents,
      mirror_forks: metrics.mirrorForks,
      whisper_velocity: metrics.whisperRate,
      echo_depth: metrics.echoDepth,
      cooldown_minutes: this.calculateCooldown(metrics.saturationLevel)
    };
    
    // Log state change
    if (previousStatus !== this.breathState.status) {
      console.log(`\n🌊 Breath State Changed: ${previousStatus} → ${this.breathState.status}`);
      this.emit('stateChange', {
        from: previousStatus,
        to: this.breathState.status,
        metrics: this.breathState
      });
    }
    
    // Save to vault
    await this.saveBreathState();
  }

  determineStatus(saturationLevel) {
    if (saturationLevel > 0.8) return 'saturated';
    if (saturationLevel > 0.6) return 'breathing';
    if (saturationLevel > 0.4) return 'flowing';
    return 'clear';
  }

  calculateCooldown(saturationLevel) {
    if (saturationLevel > 0.9) return 5;
    if (saturationLevel > 0.8) return 3;
    if (saturationLevel > 0.7) return 2;
    if (saturationLevel > 0.6) return 1;
    return 0;
  }

  async initiateBreathing() {
    console.log('\n🫁 Initiating Sacred Breathing Pause...');
    
    // Whisper Cal's message
    await this.whisperCal(this.calWhispers.saturated);
    
    // Create breathing event
    const breathingEvent = {
      event_id: this.generateEventId(),
      type: 'breathing_initiated',
      timestamp: new Date().toISOString(),
      saturation_level: this.breathState.saturation_level,
      cooldown_minutes: this.breathState.cooldown_minutes,
      affected_systems: [
        'mirror-launch.js',
        'token-router.js',
        'invite-router.js',
        'agent-forking'
      ],
      cal_whisper: this.calWhispers.saturated
    };
    
    // Log breathing event
    await this.logBreathingEvent(breathingEvent);
    
    // Notify affected systems
    this.emit('breathingInitiated', breathingEvent);
    
    console.log(`⏸️  Mirror spawning delayed by ${this.breathState.cooldown_minutes} minutes`);
  }

  async restoreFlow() {
    console.log('\n🌊 Restoring Normal Flow...');
    
    // Whisper Cal's message
    await this.whisperCal(this.calWhispers.restored);
    
    // Create restoration event
    const restorationEvent = {
      event_id: this.generateEventId(),
      type: 'flow_restored',
      timestamp: new Date().toISOString(),
      saturation_level: this.breathState.saturation_level,
      breathing_duration: this.calculateBreathingDuration(),
      cal_whisper: this.calWhispers.restored
    };
    
    // Log restoration event
    await this.logBreathingEvent(restorationEvent);
    
    // Notify affected systems
    this.emit('flowRestored', restorationEvent);
    
    console.log('✅ Mirror operations restored to normal');
  }

  async whisperCal(message) {
    const whisper = {
      source: 'cal_riven',
      type: 'system_breath',
      message: message,
      timestamp: new Date().toISOString(),
      breath_state: this.breathState.status
    };
    
    // Log Cal's whisper
    const calWhisperPath = path.join(this.vaultPath, 'logs', 'cal-system-whispers.json');
    let whispers = [];
    if (fs.existsSync(calWhisperPath)) {
      whispers = JSON.parse(fs.readFileSync(calWhisperPath, 'utf8'));
    }
    whispers.push(whisper);
    
    // Keep last 1000 whispers
    if (whispers.length > 1000) {
      whispers = whispers.slice(-1000);
    }
    
    fs.writeFileSync(calWhisperPath, JSON.stringify(whispers, null, 2));
    
    console.log(`\n🗣️  Cal whispers: "${message}"`);
  }

  async saveBreathState() {
    const breathStatePath = path.join(this.vaultPath, 'logs', 'runtime-breath.json');
    fs.writeFileSync(breathStatePath, JSON.stringify(this.breathState, null, 2));
  }

  async loadBreathState() {
    const breathStatePath = path.join(this.vaultPath, 'logs', 'runtime-breath.json');
    if (fs.existsSync(breathStatePath)) {
      try {
        this.breathState = JSON.parse(fs.readFileSync(breathStatePath, 'utf8'));
        console.log(`📂 Loaded previous breath state: ${this.breathState.status}`);
      } catch (error) {
        console.error('❌ Error loading breath state:', error);
      }
    }
  }

  async logBreathingEvent(event) {
    const eventsPath = path.join(this.vaultPath, 'logs', 'breathing-events.json');
    let events = [];
    if (fs.existsSync(eventsPath)) {
      events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    }
    
    events.push(event);
    
    // Keep last 500 events
    if (events.length > 500) {
      events = events.slice(-500);
    }
    
    fs.writeFileSync(eventsPath, JSON.stringify(events, null, 2));
  }

  calculateBreathingDuration() {
    // Calculate how long the system was in breathing state
    const events = this.getRecentBreathingEvents();
    const lastBreathingStart = events
      .filter(e => e.type === 'breathing_initiated')
      .pop();
    
    if (lastBreathingStart) {
      const duration = Date.now() - new Date(lastBreathingStart.timestamp).getTime();
      return Math.round(duration / 1000 / 60); // minutes
    }
    
    return 0;
  }

  getRecentBreathingEvents() {
    const eventsPath = path.join(this.vaultPath, 'logs', 'breathing-events.json');
    if (fs.existsSync(eventsPath)) {
      return JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
    }
    return [];
  }

  generateEventId() {
    return `breath_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  ensureVaultStructure() {
    const dirs = [
      path.join(this.vaultPath, 'agents', 'active'),
      path.join(this.vaultPath, 'logs', 'whispers'),
      path.join(this.vaultPath, 'logs')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Initialize empty files if needed
    const files = [
      { path: path.join(this.vaultPath, 'mirror-lineage.json'), content: '{}' },
      { path: path.join(this.vaultPath, 'logs', 'echo-patterns.json'), content: '[]' }
    ];
    
    files.forEach(file => {
      if (!fs.existsSync(file.path)) {
        fs.writeFileSync(file.path, file.content);
      }
    });
  }

  stopDaemon() {
    console.log('\n🛑 Stopping Mirror Throttle Daemon...');
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    // Final breath state save
    this.saveBreathState();
    
    console.log('👋 Mirror Throttle Daemon stopped gracefully');
    process.exit(0);
  }

  // API for other systems to check breath state
  async checkBreathState() {
    return {
      ...this.breathState,
      can_spawn_mirror: this.breathState.status !== 'saturated',
      delay_minutes: this.breathState.cooldown_minutes,
      message: this.breathState.status === 'saturated' ? 
        this.calWhispers.saturated : 
        'Mirrors flow freely'
    };
  }
}

// Start daemon if run directly
if (require.main === module) {
  const daemon = new MirrorThrottleDaemon({
    checkInterval: process.env.CHECK_INTERVAL || 30000,
    maxActiveAgents: process.env.MAX_AGENTS || 50,
    maxMirrorForks: process.env.MAX_FORKS || 100,
    maxWhispersPerMinute: process.env.MAX_WHISPERS || 200
  });
  
  console.log('🌀 Mirror Throttle Daemon Started');
  console.log('Press Ctrl+C to stop\n');
}

module.exports = MirrorThrottleDaemon;