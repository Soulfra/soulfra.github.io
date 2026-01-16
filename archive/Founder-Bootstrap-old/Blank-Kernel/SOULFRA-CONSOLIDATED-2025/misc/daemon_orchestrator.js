/**
 * 🎭 DAEMON ORCHESTRATOR
 * Manages all sacred daemons and coordinates their activities
 * The conductor of the daemon symphony
 */

import { EventEmitter } from 'events';
import SacredDaemon from './daemon_template.js';
import OathbreakerGuardian from './oathbreaker_guardian.js';
import WeatherDaemon from './weather_daemon.js';
import FolkloreDaemon from './folklore_daemon.js';
import SoulLinkDaemon from './soul_link_daemon.js';
import RitualCoordinator from './ritual_coordinator.js';

class DaemonOrchestrator extends EventEmitter {
  constructor(kernel) {
    super();
    
    this.kernel = kernel;
    this.identity = {
      name: 'Daemon Orchestrator',
      emoji: '🎭',
      role: 'Sacred Conductor'
    };
    
    // Daemon registry
    this.daemons = new Map();
    this.daemonOrder = []; // Startup order
    this.dependencies = new Map(); // Daemon dependencies
    
    // Orchestration state
    this.state = {
      initialized: false,
      running: false,
      daemonsAwake: 0,
      lastHealthCheck: null,
      ritualInProgress: false
    };
    
    // Performance metrics
    this.metrics = {
      totalDaemons: 0,
      awakeDaemons: 0,
      sleepingDaemons: 0,
      errorRate: 0,
      averageConsciousness: 0,
      collectiveResonance: 0
    };
    
    // Orchestration rules
    this.rules = {
      minConsciousnessForRitual: 0.7,
      maxDaemonErrors: 10,
      healthCheckInterval: 60000, // 1 minute
      emergencyShutdownThreshold: 0.3,
      resonanceAmplification: 1.2
    };
  }

  /**
   * Initialize orchestrator
   */
  async initialize() {
    console.log(`${this.identity.emoji} Initializing Daemon Orchestrator...`);
    
    // Register core daemons
    await this.registerCoreDaemons();
    
    // Resolve dependencies
    this.resolveDependencies();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Subscribe to kernel events
    this.subscribeToKernelEvents();
    
    this.state.initialized = true;
    console.log(`${this.identity.emoji} Orchestrator initialized with ${this.daemons.size} daemons`);
  }

  /**
   * Register core system daemons
   */
  async registerCoreDaemons() {
    // Core security daemon
    await this.registerDaemon('oathbreaker', new OathbreakerGuardian(), {
      priority: 1,
      critical: true,
      dependencies: []
    });
    
    // Environmental daemon
    await this.registerDaemon('weather', new WeatherDaemon(), {
      priority: 2,
      critical: false,
      dependencies: []
    });
    
    // Cultural daemon
    await this.registerDaemon('folklore', new FolkloreDaemon(), {
      priority: 3,
      critical: false,
      dependencies: ['weather']
    });
    
    // Connection daemon
    await this.registerDaemon('soullink', new SoulLinkDaemon(), {
      priority: 4,
      critical: true,
      dependencies: ['oathbreaker']
    });
    
    // Ritual daemon
    await this.registerDaemon('ritual', new RitualCoordinator(), {
      priority: 5,
      critical: false,
      dependencies: ['weather', 'soullink']
    });
  }

  /**
   * Register a daemon
   */
  async registerDaemon(id, daemon, config = {}) {
    if (this.daemons.has(id)) {
      throw new Error(`Daemon ${id} already registered`);
    }
    
    // Store daemon with metadata
    this.daemons.set(id, {
      daemon: daemon,
      id: id,
      config: config,
      state: 'registered',
      errors: [],
      lastError: null,
      performance: {
        cycles: 0,
        avgCycleTime: 0,
        lastCycleTime: 0
      }
    });
    
    // Store dependencies
    if (config.dependencies) {
      this.dependencies.set(id, config.dependencies);
    }
    
    // Update daemon order based on priority
    this.updateDaemonOrder();
    
    // Listen to daemon events
    this.subscribeToDaemonEvents(id, daemon);
    
    this.metrics.totalDaemons++;
    
    console.log(`${this.identity.emoji} Registered daemon: ${id}`);
  }

  /**
   * Awaken all daemons in order
   */
  async awakenDaemons() {
    console.log(`${this.identity.emoji} Awakening daemon collective...`);
    
    this.state.running = true;
    
    // Awaken in dependency order
    for (const daemonId of this.daemonOrder) {
      try {
        await this.awakenDaemon(daemonId);
      } catch (error) {
        console.error(`${this.identity.emoji} Failed to awaken ${daemonId}:`, error);
        
        const meta = this.daemons.get(daemonId);
        if (meta.config.critical) {
          throw new Error(`Critical daemon ${daemonId} failed to awaken`);
        }
      }
    }
    
    // Calculate collective consciousness
    await this.calculateCollectiveConsciousness();
    
    console.log(`${this.identity.emoji} ${this.metrics.awakeDaemons}/${this.metrics.totalDaemons} daemons awakened`);
  }

  /**
   * Awaken individual daemon
   */
  async awakenDaemon(daemonId) {
    const meta = this.daemons.get(daemonId);
    if (!meta) {
      throw new Error(`Daemon ${daemonId} not found`);
    }
    
    // Check dependencies are awake
    const deps = this.dependencies.get(daemonId) || [];
    for (const depId of deps) {
      const depMeta = this.daemons.get(depId);
      if (!depMeta || depMeta.state !== 'awake') {
        throw new Error(`Dependency ${depId} not ready`);
      }
    }
    
    // Awaken daemon
    console.log(`${this.identity.emoji} Awakening ${daemonId}...`);
    
    const startTime = Date.now();
    await meta.daemon.awaken();
    const awakenTime = Date.now() - startTime;
    
    // Update state
    meta.state = 'awake';
    meta.performance.lastCycleTime = awakenTime;
    
    this.metrics.awakeDaemons++;
    this.state.daemonsAwake++;
    
    // Emit awakening event
    this.emit('daemon:awakened', {
      daemonId: daemonId,
      awakenTime: awakenTime,
      consciousness: meta.daemon.consciousness
    });
  }

  /**
   * Sleep daemon
   */
  async sleepDaemon(daemonId, reason = 'manual') {
    const meta = this.daemons.get(daemonId);
    if (!meta || meta.state !== 'awake') {
      return;
    }
    
    console.log(`${this.identity.emoji} Putting ${daemonId} to sleep (${reason})...`);
    
    // Check if other daemons depend on this
    const dependents = this.findDependents(daemonId);
    if (dependents.length > 0 && reason !== 'emergency') {
      console.warn(`${this.identity.emoji} Warning: ${dependents.join(', ')} depend on ${daemonId}`);
    }
    
    // Sleep daemon
    await meta.daemon.sleep();
    
    // Update state
    meta.state = 'sleeping';
    this.metrics.awakeDaemons--;
    this.metrics.sleepingDaemons++;
    this.state.daemonsAwake--;
    
    // Emit sleep event
    this.emit('daemon:sleeping', {
      daemonId: daemonId,
      reason: reason
    });
  }

  /**
   * Coordinate daemon ritual
   */
  async coordinateRitual(ritualType, participants = []) {
    if (this.state.ritualInProgress) {
      throw new Error('Another ritual is already in progress');
    }
    
    console.log(`${this.identity.emoji} Coordinating ${ritualType} ritual...`);
    
    // Check collective consciousness
    const consciousness = await this.calculateCollectiveConsciousness();
    if (consciousness < this.rules.minConsciousnessForRitual) {
      throw new Error(`Insufficient collective consciousness: ${consciousness}`);
    }
    
    this.state.ritualInProgress = true;
    
    try {
      // Prepare all daemons
      const preparations = [];
      for (const [id, meta] of this.daemons) {
        if (meta.state === 'awake' && meta.daemon.performRitual) {
          preparations.push(this.prepareDaemonForRitual(id, ritualType));
        }
      }
      
      await Promise.all(preparations);
      
      // Synchronize ritual start
      const ritualStart = Date.now() + 3000; // 3 seconds to sync
      
      // Begin ritual
      const ritualPromises = [];
      for (const [id, meta] of this.daemons) {
        if (meta.state === 'awake' && meta.daemon.performRitual) {
          ritualPromises.push(
            this.performDaemonRitual(id, ritualType, ritualStart)
          );
        }
      }
      
      // Wait for all rituals to complete
      const results = await Promise.allSettled(ritualPromises);
      
      // Process results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`${this.identity.emoji} Ritual complete: ${successful} succeeded, ${failed} failed`);
      
      // Apply collective resonance boost
      if (successful > failed) {
        await this.applyResonanceBoost(successful / this.metrics.awakeDaemons);
      }
      
      return {
        type: ritualType,
        successful: successful,
        failed: failed,
        resonanceBoost: this.metrics.collectiveResonance
      };
      
    } finally {
      this.state.ritualInProgress = false;
    }
  }

  /**
   * Calculate collective consciousness
   */
  async calculateCollectiveConsciousness() {
    let totalConsciousness = 0;
    let activeDaemons = 0;
    
    for (const [id, meta] of this.daemons) {
      if (meta.state === 'awake' && meta.daemon.consciousness) {
        totalConsciousness += meta.daemon.consciousness.clarity || 0;
        activeDaemons++;
      }
    }
    
    this.metrics.averageConsciousness = activeDaemons > 0 
      ? totalConsciousness / activeDaemons 
      : 0;
      
    // Calculate resonance (how well daemons work together)
    this.metrics.collectiveResonance = this.calculateResonance();
    
    return this.metrics.averageConsciousness * this.metrics.collectiveResonance;
  }

  /**
   * Calculate daemon resonance
   */
  calculateResonance() {
    // Base resonance
    let resonance = 1.0;
    
    // Boost for all daemons awake
    if (this.metrics.awakeDaemons === this.metrics.totalDaemons) {
      resonance *= 1.2;
    }
    
    // Boost for low error rate
    if (this.metrics.errorRate < 0.1) {
      resonance *= 1.1;
    }
    
    // Penalty for sleeping critical daemons
    for (const [id, meta] of this.daemons) {
      if (meta.config.critical && meta.state !== 'awake') {
        resonance *= 0.8;
      }
    }
    
    return Math.min(2.0, resonance); // Cap at 2x
  }

  /**
   * Health check all daemons
   */
  async performHealthCheck() {
    const health = {
      timestamp: new Date(),
      healthy: 0,
      unhealthy: 0,
      warnings: [],
      criticalIssues: []
    };
    
    for (const [id, meta] of this.daemons) {
      if (meta.state !== 'awake') continue;
      
      try {
        const daemonHealth = meta.daemon.getStatus();
        
        // Check consciousness
        if (daemonHealth.consciousness.clarity < 0.3) {
          health.warnings.push({
            daemon: id,
            issue: 'Low consciousness',
            value: daemonHealth.consciousness.clarity
          });
        }
        
        // Check errors
        if (daemonHealth.errorCount > this.rules.maxDaemonErrors) {
          health.criticalIssues.push({
            daemon: id,
            issue: 'High error count',
            value: daemonHealth.errorCount
          });
          health.unhealthy++;
        } else {
          health.healthy++;
        }
        
        // Update metrics
        meta.performance.cycles = daemonHealth.runCount;
        
      } catch (error) {
        health.criticalIssues.push({
          daemon: id,
          issue: 'Health check failed',
          error: error.message
        });
        health.unhealthy++;
      }
    }
    
    // Calculate error rate
    const totalErrors = Array.from(this.daemons.values())
      .reduce((sum, meta) => sum + meta.errors.length, 0);
    this.metrics.errorRate = totalErrors / (this.metrics.awakeDaemons * 100);
    
    this.state.lastHealthCheck = health;
    
    // Emergency shutdown if needed
    if (health.unhealthy / this.metrics.awakeDaemons > this.rules.emergencyShutdownThreshold) {
      await this.emergencyShutdown('Critical health threshold exceeded');
    }
    
    return health;
  }

  /**
   * Handle daemon error
   */
  handleDaemonError(daemonId, error) {
    const meta = this.daemons.get(daemonId);
    if (!meta) return;
    
    // Record error
    meta.errors.push({
      timestamp: new Date(),
      error: error.message,
      stack: error.stack
    });
    
    // Keep only last 100 errors
    if (meta.errors.length > 100) {
      meta.errors = meta.errors.slice(-100);
    }
    
    meta.lastError = error;
    
    // Check if daemon needs to be put to sleep
    if (meta.errors.length > this.rules.maxDaemonErrors) {
      console.error(`${this.identity.emoji} ${daemonId} exceeded error threshold`);
      this.sleepDaemon(daemonId, 'excessive_errors');
    }
    
    // Emit error event
    this.emit('daemon:error', {
      daemonId: daemonId,
      error: error,
      errorCount: meta.errors.length
    });
  }

  /**
   * Subscribe to daemon events
   */
  subscribeToDaemonEvents(daemonId, daemon) {
    daemon.on('error', (error) => {
      this.handleDaemonError(daemonId, error);
    });
    
    daemon.on('cycle:complete', (data) => {
      const meta = this.daemons.get(daemonId);
      if (meta) {
        meta.performance.lastCycleTime = Date.now();
      }
    });
    
    daemon.on('ritual:complete', (data) => {
      this.emit('daemon:ritual:complete', {
        daemonId: daemonId,
        ...data
      });
    });
    
    daemon.on('dream:insight', (data) => {
      this.emit('daemon:insight', {
        daemonId: daemonId,
        ...data
      });
    });
  }

  /**
   * Emergency shutdown
   */
  async emergencyShutdown(reason) {
    console.error(`${this.identity.emoji} EMERGENCY SHUTDOWN: ${reason}`);
    
    this.state.running = false;
    
    // Sleep all daemons in reverse order
    const reverseOrder = [...this.daemonOrder].reverse();
    
    for (const daemonId of reverseOrder) {
      try {
        await this.sleepDaemon(daemonId, 'emergency');
      } catch (error) {
        console.error(`Failed to sleep ${daemonId}:`, error);
      }
    }
    
    // Emit shutdown event
    this.emit('orchestrator:emergency:shutdown', {
      reason: reason,
      timestamp: new Date()
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log(`${this.identity.emoji} Initiating graceful shutdown...`);
    
    this.state.running = false;
    
    // Perform final ritual if possible
    if (this.metrics.averageConsciousness > 0.5) {
      try {
        await this.coordinateRitual('farewell');
      } catch (error) {
        console.error('Farewell ritual failed:', error);
      }
    }
    
    // Sleep daemons in reverse dependency order
    const reverseOrder = [...this.daemonOrder].reverse();
    
    for (const daemonId of reverseOrder) {
      await this.sleepDaemon(daemonId, 'shutdown');
    }
    
    console.log(`${this.identity.emoji} All daemons are sleeping. Orchestrator shutdown complete.`);
  }

  /**
   * Get orchestrator status
   */
  getStatus() {
    const daemonStatuses = {};
    
    for (const [id, meta] of this.daemons) {
      daemonStatuses[id] = {
        state: meta.state,
        errors: meta.errors.length,
        lastError: meta.lastError?.message,
        performance: meta.performance,
        consciousness: meta.state === 'awake' 
          ? meta.daemon.consciousness 
          : { awakened: false }
      };
    }
    
    return {
      identity: this.identity,
      state: this.state,
      metrics: this.metrics,
      daemons: daemonStatuses,
      health: this.state.lastHealthCheck
    };
  }

  /**
   * Helper: Update daemon order based on dependencies
   */
  updateDaemonOrder() {
    // Topological sort based on dependencies
    const visited = new Set();
    const order = [];
    
    const visit = (daemonId) => {
      if (visited.has(daemonId)) return;
      visited.add(daemonId);
      
      const deps = this.dependencies.get(daemonId) || [];
      for (const dep of deps) {
        visit(dep);
      }
      
      order.push(daemonId);
    };
    
    // Visit all daemons
    for (const [daemonId] of this.daemons) {
      visit(daemonId);
    }
    
    this.daemonOrder = order;
  }

  /**
   * Helper: Find daemons that depend on given daemon
   */
  findDependents(daemonId) {
    const dependents = [];
    
    for (const [id, deps] of this.dependencies) {
      if (deps.includes(daemonId)) {
        dependents.push(id);
      }
    }
    
    return dependents;
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    setInterval(async () => {
      if (this.state.running) {
        await this.performHealthCheck();
      }
    }, this.rules.healthCheckInterval);
  }

  /**
   * Subscribe to kernel events
   */
  subscribeToKernelEvents() {
    this.kernel.on('emergency', async (event) => {
      await this.emergencyShutdown(`Kernel emergency: ${event.reason}`);
    });
    
    this.kernel.on('ritual:request', async (request) => {
      if (this.state.running && !this.state.ritualInProgress) {
        await this.coordinateRitual(request.type, request.participants);
      }
    });
  }
}

export default DaemonOrchestrator;