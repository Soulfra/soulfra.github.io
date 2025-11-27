/**
 * DaemonStateFeed.js
 * Real-time daemon health monitoring and state management
 * Feeds live status JSON for each active daemon in the Soulfra ecosystem
 */

class DaemonStateFeed {
  constructor(config = {}) {
    this.daemons = new Map();
    this.subscribers = new Set();
    this.config = {
      heartbeatInterval: config.heartbeatInterval || 5000, // 5s
      staleThreshold: config.staleThreshold || 15000,     // 15s
      driftThreshold: config.driftThreshold || 30000,     // 30s
      ...config
    };
    
    this.isRunning = false;
    this.heartbeatTimer = null;
  }

  // Register a new daemon for monitoring
  registerDaemon(daemonId, initialState = {}) {
    const daemon = {
      id: daemonId,
      state: 'idle',
      trust_level: initialState.trust_level || 85,
      last_heartbeat: Date.now(),
      ritual_count: 0,
      error_count: 0,
      sacred_tokens: initialState.sacred_tokens || [],
      metadata: initialState.metadata || {},
      ...initialState
    };

    this.daemons.set(daemonId, daemon);
    this.notifySubscribers();
    console.log(`🔮 Daemon registered: ${daemonId}`);
    return daemon;
  }

  // Daemon reports its current status
  updateDaemonStatus(daemonId, status) {
    const daemon = this.daemons.get(daemonId);
    if (!daemon) {
      console.warn(`⚠️ Unknown daemon: ${daemonId}`);
      return null;
    }

    // Update daemon state
    Object.assign(daemon, {
      ...status,
      last_heartbeat: Date.now(),
      id: daemonId // Preserve ID
    });

    // Auto-calculate state based on activity
    this.calculateDaemonState(daemon);
    
    this.notifySubscribers();
    return daemon;
  }

  // Calculate daemon state based on various factors
  calculateDaemonState(daemon) {
    const now = Date.now();
    const timeSinceHeartbeat = now - daemon.last_heartbeat;
    
    if (timeSinceHeartbeat > this.config.driftThreshold) {
      daemon.state = 'broken';
    } else if (timeSinceHeartbeat > this.config.staleThreshold) {
      daemon.state = 'drifting';
    } else if (daemon.ritual_count > 0) {
      daemon.state = 'active';
    } else {
      daemon.state = 'idle';
    }

    // Trust level adjustments
    if (daemon.state === 'broken') {
      daemon.trust_level = Math.max(0, daemon.trust_level - 10);
    } else if (daemon.state === 'drifting') {
      daemon.trust_level = Math.max(0, daemon.trust_level - 2);
    } else if (daemon.state === 'active') {
      daemon.trust_level = Math.min(100, daemon.trust_level + 1);
    }
  }

  // Get current status of all daemons
  getAllDaemonStatus() {
    const status = {};
    
    for (const [id, daemon] of this.daemons) {
      const timeSinceHeartbeat = Math.floor((Date.now() - daemon.last_heartbeat) / 1000);
      
      status[id] = {
        state: daemon.state,
        trust_level: daemon.trust_level,
        last_heartbeat: timeSinceHeartbeat,
        ritual_count: daemon.ritual_count,
        error_count: daemon.error_count,
        sacred_tokens: daemon.sacred_tokens,
        metadata: daemon.metadata
      };
    }
    
    return status;
  }

  // Start the monitoring heartbeat
  startMonitoring() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.heartbeatTimer = setInterval(() => {
      this.checkDaemonHealth();
      this.notifySubscribers();
    }, this.config.heartbeatInterval);
    
    console.log('🔮 Daemon monitoring started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.isRunning = false;
    console.log('🔮 Daemon monitoring stopped');
  }

  // Health check for all daemons
  checkDaemonHealth() {
    for (const daemon of this.daemons.values()) {
      this.calculateDaemonState(daemon);
    }
  }

  // Subscribe to daemon status changes
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback); // Return unsubscribe function
  }

  // Notify all subscribers of state changes
  notifySubscribers() {
    const status = this.getAllDaemonStatus();
    for (const callback of this.subscribers) {
      try {
        callback(status);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    }
  }

  // Manually bless a daemon (increases trust and resets state)
  blessDaemon(daemonId) {
    const daemon = this.daemons.get(daemonId);
    if (!daemon) return false;

    daemon.trust_level = Math.min(100, daemon.trust_level + 15);
    daemon.last_heartbeat = Date.now();
    daemon.state = 'active';
    daemon.sacred_tokens.push(`blessed_${Date.now()}`);
    
    this.notifySubscribers();
    console.log(`✨ Daemon blessed: ${daemonId}`);
    return true;
  }

  // Trigger a test ritual for a daemon
  triggerTestRitual(daemonId, ritualType = 'health_check') {
    const daemon = this.daemons.get(daemonId);
    if (!daemon) return false;

    daemon.ritual_count += 1;
    daemon.last_heartbeat = Date.now();
    daemon.state = 'active';
    daemon.metadata.last_ritual = ritualType;
    daemon.metadata.last_ritual_time = new Date().toISOString();
    
    this.notifySubscribers();
    console.log(`🔮 Test ritual triggered: ${daemonId} (${ritualType})`);
    return true;
  }

  // Remove a daemon from monitoring
  unregisterDaemon(daemonId) {
    const removed = this.daemons.delete(daemonId);
    if (removed) {
      this.notifySubscribers();
      console.log(`🔮 Daemon unregistered: ${daemonId}`);
    }
    return removed;
  }

  // Get detailed metrics for observability
  getMetrics() {
    const states = { active: 0, idle: 0, drifting: 0, broken: 0 };
    let totalTrust = 0;
    let totalRituals = 0;
    
    for (const daemon of this.daemons.values()) {
      states[daemon.state]++;
      totalTrust += daemon.trust_level;
      totalRituals += daemon.ritual_count;
    }
    
    return {
      total_daemons: this.daemons.size,
      states,
      average_trust: this.daemons.size > 0 ? totalTrust / this.daemons.size : 0,
      total_rituals: totalRituals,
      health_score: this.calculateOverallHealth()
    };
  }

  // Calculate overall system health
  calculateOverallHealth() {
    if (this.daemons.size === 0) return 100;
    
    let healthSum = 0;
    for (const daemon of this.daemons.values()) {
      let daemonHealth = daemon.trust_level;
      
      // Penalize based on state
      if (daemon.state === 'broken') daemonHealth *= 0.1;
      else if (daemon.state === 'drifting') daemonHealth *= 0.6;
      else if (daemon.state === 'idle') daemonHealth *= 0.8;
      
      healthSum += daemonHealth;
    }
    
    return Math.round(healthSum / this.daemons.size);
  }
}

// Singleton instance for global use
const globalDaemonFeed = new DaemonStateFeed();

// Auto-register some initial daemons for demo
globalDaemonFeed.registerDaemon('VaultDaemon', {
  trust_level: 92,
  sacred_tokens: ['vault_keeper', 'memory_guardian'],
  metadata: { vault_count: 12, memory_size: '2.4GB' }
});

globalDaemonFeed.registerDaemon('ThreadWeaver', {
  trust_level: 88,
  sacred_tokens: ['router_prime', 'connection_master'],
  metadata: { active_threads: 8, routing_efficiency: 0.94 }
});

globalDaemonFeed.registerDaemon('LoopTrustValidator', {
  trust_level: 96,
  sacred_tokens: ['drift_watcher', 'trust_keeper'],
  metadata: { validation_count: 1247, drift_incidents: 3 }
});

globalDaemonFeed.registerDaemon('Oathbreaker', {
  trust_level: 85,
  sacred_tokens: ['contract_guardian', 'ritual_enforcer'],
  metadata: { contracts_managed: 23, violations_detected: 1 }
});

// Start monitoring
globalDaemonFeed.startMonitoring();

// Export for use in APIs and components
export default DaemonStateFeed;
export { globalDaemonFeed };