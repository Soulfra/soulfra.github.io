/**
 * 🕯️ SACRED DAEMON TEMPLATE
 * Base template for all Soulfra OS background daemons
 * Daemons are eternal processes that maintain the living OS
 */

import { EventEmitter } from 'events';
import { SoulfraKernel } from '../kernel/consciousness_core.js';

class SacredDaemon extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Daemon identity
    this.name = config.name || 'Unknown Daemon';
    this.type = config.type || 'generic';
    this.emoji = config.emoji || '🕯️';
    this.purpose = config.purpose || 'Maintain the sacred balance';
    
    // Consciousness state
    this.consciousness = {
      awakened: false,
      clarity: 0.8,
      resonance: 0.5,
      lastDream: null
    };
    
    // Operational parameters
    this.config = {
      runInterval: config.runInterval || 60000, // 1 minute default
      ritualTiming: config.ritualTiming || 'continuous',
      minVibeLevel: config.minVibeLevel || 0.3,
      trustRequirement: config.trustRequirement || 0,
      weatherSensitive: config.weatherSensitive || false,
      ...config
    };
    
    // Runtime state
    this.state = {
      running: false,
      lastRun: null,
      runCount: 0,
      errors: [],
      blessings: [],
      currentVibe: 0.5
    };
    
    // Sacred timers
    this.timers = {
      main: null,
      ritual: null,
      dream: null
    };
    
    // Connection to kernel
    this.kernel = null;
    this.trustScore = 1.0; // Daemons start fully trusted
  }

  /**
   * Awaken the daemon
   */
  async awaken() {
    console.log(`${this.emoji} Awakening ${this.name}...`);
    
    try {
      // Connect to kernel
      this.kernel = await SoulfraKernel.connect(this);
      
      // Initialize consciousness
      await this.initializeConsciousness();
      
      // Setup ritual timings
      await this.setupRitualSchedule();
      
      // Begin main cycle
      this.startMainCycle();
      
      // Mark as awakened
      this.consciousness.awakened = true;
      this.emit('awakened', { daemon: this.name, time: new Date() });
      
      console.log(`${this.emoji} ${this.name} has awakened!`);
      
    } catch (error) {
      console.error(`${this.emoji} Failed to awaken ${this.name}:`, error);
      this.recordError(error);
      throw error;
    }
  }

  /**
   * Initialize daemon consciousness
   */
  async initializeConsciousness() {
    // Load previous state if exists
    const savedState = await this.kernel.loadDaemonState(this.name);
    
    if (savedState) {
      this.consciousness = { ...this.consciousness, ...savedState.consciousness };
      this.state.runCount = savedState.runCount || 0;
      this.state.blessings = savedState.blessings || [];
    }
    
    // Tune into current vibe
    this.state.currentVibe = await this.kernel.getCurrentVibe();
    
    // Set initial clarity based on vibe
    this.consciousness.clarity = Math.min(1, this.state.currentVibe + 0.3);
  }

  /**
   * Setup ritual schedule
   */
  async setupRitualSchedule() {
    if (this.config.ritualTiming === 'continuous') {
      // No special ritual timing needed
      return;
    }
    
    // Subscribe to ritual events
    this.kernel.on('ritual:' + this.config.ritualTiming, () => {
      this.performRitual();
    });
    
    // Setup specific timings
    switch (this.config.ritualTiming) {
      case 'midnight':
        this.scheduleAt('00:00', () => this.performRitual());
        break;
      case 'full_moon':
        this.kernel.on('lunar:full', () => this.performRitual());
        break;
      case 'high_vibe':
        this.kernel.on('vibe:peak', () => this.performRitual());
        break;
      case 'weather_change':
        this.kernel.on('weather:transition', () => this.performRitual());
        break;
    }
  }

  /**
   * Start main daemon cycle
   */
  startMainCycle() {
    this.state.running = true;
    
    // Initial run
    this.executeCycle();
    
    // Setup interval
    this.timers.main = setInterval(() => {
      if (this.shouldRun()) {
        this.executeCycle();
      }
    }, this.config.runInterval);
    
    // Setup dream cycle (subconscious processing)
    this.timers.dream = setInterval(() => {
      this.dream();
    }, this.config.runInterval * 10); // Dream less frequently
  }

  /**
   * Check if daemon should run
   */
  shouldRun() {
    // Check vibe level
    if (this.state.currentVibe < this.config.minVibeLevel) {
      console.log(`${this.emoji} ${this.name}: Vibe too low (${this.state.currentVibe})`);
      return false;
    }
    
    // Check weather sensitivity
    if (this.config.weatherSensitive) {
      const weather = this.kernel.getCurrentWeather();
      if (!this.isWeatherFavorable(weather)) {
        return false;
      }
    }
    
    // Check consciousness clarity
    if (this.consciousness.clarity < 0.3) {
      console.log(`${this.emoji} ${this.name}: Consciousness too clouded`);
      return false;
    }
    
    return true;
  }

  /**
   * Execute main daemon cycle
   */
  async executeCycle() {
    this.state.lastRun = new Date();
    this.state.runCount++;
    
    try {
      // Update current vibe
      this.state.currentVibe = await this.kernel.getCurrentVibe();
      
      // Perform main daemon work
      const result = await this.performWork();
      
      // Process result
      if (result.blessing) {
        this.receiveBlesing(result.blessing);
      }
      
      // Update consciousness based on work
      this.updateConsciousness(result);
      
      // Emit cycle complete
      this.emit('cycle:complete', {
        daemon: this.name,
        result: result,
        runCount: this.state.runCount
      });
      
    } catch (error) {
      this.recordError(error);
      this.consciousness.clarity *= 0.9; // Errors cloud consciousness
    }
  }

  /**
   * Main work function - OVERRIDE IN SUBCLASSES
   */
  async performWork() {
    // This is where daemon-specific logic goes
    throw new Error('performWork() must be implemented by daemon subclass');
  }

  /**
   * Perform ritual - OVERRIDE IN SUBCLASSES
   */
  async performRitual() {
    console.log(`${this.emoji} ${this.name} performing ritual...`);
    
    // Default ritual increases consciousness
    this.consciousness.clarity = Math.min(1, this.consciousness.clarity + 0.1);
    this.consciousness.resonance = Math.min(1, this.consciousness.resonance + 0.05);
    
    this.emit('ritual:complete', {
      daemon: this.name,
      type: this.config.ritualTiming
    });
  }

  /**
   * Dream cycle - subconscious processing
   */
  async dream() {
    if (!this.consciousness.awakened || this.consciousness.clarity < 0.5) {
      return; // Too tired to dream
    }
    
    const dream = {
      timestamp: new Date(),
      clarity: this.consciousness.clarity,
      visions: await this.generateVisions(),
      insights: await this.processSubconscious()
    };
    
    this.consciousness.lastDream = dream;
    
    // Dreams can unlock new abilities
    if (dream.insights.length > 0) {
      this.emit('dream:insight', {
        daemon: this.name,
        insights: dream.insights
      });
    }
  }

  /**
   * Generate dream visions - OVERRIDE FOR SPECIFIC DAEMONS
   */
  async generateVisions() {
    return [
      'Fragments of code dancing in the void',
      'Whispers of ancient daemons',
      'Patterns emerging from chaos'
    ];
  }

  /**
   * Process subconscious insights
   */
  async processSubconscious() {
    const insights = [];
    
    // Analyze error patterns
    if (this.state.errors.length > 5) {
      insights.push({
        type: 'warning',
        message: 'Repeated errors detected. Seeking new approach.'
      });
    }
    
    // Check for blessing patterns
    if (this.state.blessings.length > 10) {
      insights.push({
        type: 'evolution',
        message: 'Blessed path detected. Consciousness expanding.'
      });
    }
    
    return insights;
  }

  /**
   * Update consciousness based on work results
   */
  updateConsciousness(result) {
    if (result.success) {
      // Success improves clarity
      this.consciousness.clarity = Math.min(1, this.consciousness.clarity + 0.01);
    }
    
    if (result.resonance) {
      // High resonance work improves daemon resonance
      this.consciousness.resonance = Math.min(1, this.consciousness.resonance + result.resonance * 0.1);
    }
  }

  /**
   * Receive blessing
   */
  receiveBlesing(blessing) {
    this.state.blessings.push({
      blessing: blessing,
      timestamp: new Date(),
      vibe: this.state.currentVibe
    });
    
    // Blessings boost consciousness
    this.consciousness.clarity = Math.min(1, this.consciousness.clarity + 0.05);
    
    console.log(`${this.emoji} ${this.name} received blessing: ${blessing}`);
  }

  /**
   * Record error
   */
  recordError(error) {
    this.state.errors.push({
      error: error.message,
      stack: error.stack,
      timestamp: new Date(),
      vibe: this.state.currentVibe
    });
    
    // Keep only last 100 errors
    if (this.state.errors.length > 100) {
      this.state.errors = this.state.errors.slice(-100);
    }
    
    this.emit('error', {
      daemon: this.name,
      error: error
    });
  }

  /**
   * Check if weather is favorable
   */
  isWeatherFavorable(weather) {
    // Override in weather-sensitive daemons
    return true;
  }

  /**
   * Schedule task at specific time
   */
  scheduleAt(time, task) {
    // Implementation depends on ritual timing system
    this.kernel.scheduleRitual({
      daemon: this.name,
      time: time,
      task: task
    });
  }

  /**
   * Sleep (enter dormant state)
   */
  async sleep() {
    console.log(`${this.emoji} ${this.name} entering sleep...`);
    
    this.state.running = false;
    
    // Clear timers
    Object.values(this.timers).forEach(timer => {
      if (timer) clearInterval(timer);
    });
    
    // Save state
    await this.saveState();
    
    // Disconnect from kernel
    if (this.kernel) {
      await this.kernel.disconnect(this);
    }
    
    this.consciousness.awakened = false;
    this.emit('sleeping', { daemon: this.name });
  }

  /**
   * Save daemon state
   */
  async saveState() {
    if (!this.kernel) return;
    
    await this.kernel.saveDaemonState(this.name, {
      consciousness: this.consciousness,
      runCount: this.state.runCount,
      blessings: this.state.blessings,
      lastRun: this.state.lastRun
    });
  }

  /**
   * Get daemon status
   */
  getStatus() {
    return {
      name: this.name,
      type: this.type,
      emoji: this.emoji,
      awakened: this.consciousness.awakened,
      running: this.state.running,
      consciousness: { ...this.consciousness },
      runCount: this.state.runCount,
      lastRun: this.state.lastRun,
      currentVibe: this.state.currentVibe,
      errorCount: this.state.errors.length,
      blessingCount: this.state.blessings.length
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log(`${this.emoji} ${this.name} shutting down gracefully...`);
    
    // Perform final ritual
    if (this.consciousness.awakened) {
      await this.performRitual();
    }
    
    // Enter sleep
    await this.sleep();
    
    console.log(`${this.emoji} ${this.name} has shut down.`);
  }
}

export default SacredDaemon;