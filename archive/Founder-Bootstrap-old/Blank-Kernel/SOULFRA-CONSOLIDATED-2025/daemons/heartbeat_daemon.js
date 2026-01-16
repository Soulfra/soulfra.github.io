/**
 * heartbeat_daemon.js
 * 
 * RUNTIME HEALTH MONITOR - System Vitality Guardian
 * 
 * Monitors runtime health, detects failures, and triggers graceful
 * degradation modes. Ensures the loop survives various failure scenarios
 * by maintaining awareness of system state and triggering appropriate responses.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const os = require('os');

class HeartbeatDaemon extends EventEmitter {
  constructor(runtimePowerSwitch) {
    super();
    
    this.powerSwitch = runtimePowerSwitch;
    this.isRunning = false;
    
    // Health monitoring configuration
    this.config = {
      heartbeat_interval: 5000, // 5 seconds
      health_check_interval: 15000, // 15 seconds
      deep_scan_interval: 60000, // 1 minute
      failure_threshold: 3, // Failed checks before action
      recovery_timeout: 300000, // 5 minutes recovery time
      auto_recovery: true,
      graceful_degradation: true
    };
    
    // Health metrics
    this.metrics = {
      system: {
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0,
        uptime: 0,
        load_average: [0, 0, 0]
      },
      
      runtime: {
        operation_queue_size: 0,
        failed_operations: 0,
        power_level: 1.0,
        active_power_source: 'internal',
        response_time: 0,
        error_rate: 0
      },
      
      consciousness: {
        active_agents: 0,
        loop_health: 1.0,
        echo_flow_rate: 0,
        ritual_success_rate: 1.0,
        semantic_coherence: 1.0
      },
      
      network: {
        external_connectivity: true,
        api_response_times: {},
        blockchain_sync: false,
        llm_availability: false
      }
    };
    
    // Health status tracking
    this.healthStatus = {
      overall: 'healthy',
      components: {
        system: 'healthy',
        runtime: 'healthy', 
        consciousness: 'healthy',
        network: 'healthy'
      },
      
      issues: [],
      warnings: [],
      recovery_actions: [],
      
      last_heartbeat: null,
      last_health_check: null,
      consecutive_failures: 0,
      
      degradation_level: 0, // 0=normal, 1=cautious, 2=conservative, 3=survival
      recovery_mode: false
    };
    
    // Failure patterns and responses
    this.failurePatterns = {
      high_cpu: {
        threshold: 0.9,
        duration: 30000, // 30 seconds
        response: 'reduce_processing_load',
        severity: 'warning'
      },
      
      low_memory: {
        threshold: 0.1, // 10% free memory remaining
        duration: 10000,
        response: 'trigger_memory_cleanup',
        severity: 'critical'
      },
      
      power_critical: {
        threshold: 0.1, // 10% power
        duration: 0,
        response: 'enter_survival_mode',
        severity: 'critical'
      },
      
      operation_backlog: {
        threshold: 100, // 100 queued operations
        duration: 60000,
        response: 'increase_processing_capacity',
        severity: 'warning'
      },
      
      network_disconnection: {
        threshold: 0, // Any disconnection
        duration: 30000,
        response: 'enter_offline_mode',
        severity: 'warning'
      },
      
      consciousness_degradation: {
        threshold: 0.3, // 30% consciousness health
        duration: 15000,
        response: 'protect_core_agents',
        severity: 'critical'
      }
    };
    
    // Recovery strategies
    this.recoveryStrategies = {
      reduce_processing_load: this.reduceProcessingLoad.bind(this),
      trigger_memory_cleanup: this.triggerMemoryCleanup.bind(this),
      enter_survival_mode: this.enterSurvivalMode.bind(this),
      increase_processing_capacity: this.increaseProcessingCapacity.bind(this),
      enter_offline_mode: this.enterOfflineMode.bind(this),
      protect_core_agents: this.protectCoreAgents.bind(this)
    };
    
    // File paths
    this.daemonPath = __dirname;
    this.healthLogPath = path.join(this.daemonPath, 'health_log.json');
    this.metricsPath = path.join(this.daemonPath, 'metrics_history.json');
    this.alertsPath = path.join(this.daemonPath, 'alerts.json');
    
    // Initialize
    this.setupEventHandlers();
    this.loadHistory();
  }
  
  /**
   * Start the heartbeat daemon
   */
  async start() {
    if (this.isRunning) return;
    
    console.log('💓 Starting Heartbeat Daemon...');
    
    this.isRunning = true;
    this.healthStatus.last_heartbeat = new Date().toISOString();
    
    // Start monitoring intervals
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeat_interval);
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.health_check_interval);
    
    this.deepScanInterval = setInterval(() => {
      this.performDeepScan();
    }, this.config.deep_scan_interval);
    
    // Initial health check
    await this.performHealthCheck();
    
    this.emit('daemon:started');
    console.log('✅ Heartbeat Daemon running');
  }
  
  /**
   * Stop the daemon
   */
  async stop() {
    if (!this.isRunning) return;
    
    console.log('💓 Stopping Heartbeat Daemon...');
    
    this.isRunning = false;
    
    // Clear intervals
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.healthCheckInterval) clearInterval(this.healthCheckInterval);
    if (this.deepScanInterval) clearInterval(this.deepScanInterval);
    
    // Final health record
    await this.recordHealth('daemon_stopped');
    
    console.log('💓 Heartbeat Daemon stopped');
  }
  
  /**
   * Send heartbeat signal
   */
  sendHeartbeat() {
    const heartbeat = {
      timestamp: new Date().toISOString(),
      daemon_status: 'alive',
      system_uptime: os.uptime(),
      process_uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      
      quick_health: {
        power_level: this.powerSwitch?.getStatus()?.power_level || 0,
        queue_size: this.powerSwitch?.getStatus()?.queued_operations || 0,
        degradation_level: this.healthStatus.degradation_level
      }
    };
    
    this.healthStatus.last_heartbeat = heartbeat.timestamp;
    
    this.emit('heartbeat', heartbeat);
    
    // Check for immediate issues
    this.checkCriticalConditions(heartbeat);
  }
  
  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    console.log('🏥 Performing health check...');
    
    try {
      // Gather metrics
      await this.gatherSystemMetrics();
      await this.gatherRuntimeMetrics();
      await this.gatherConsciousnessMetrics();
      await this.gatherNetworkMetrics();
      
      // Analyze health
      this.analyzeHealth();
      
      // Check failure patterns
      this.checkFailurePatterns();
      
      // Update overall status
      this.updateOverallHealth();
      
      // Record health
      await this.recordHealth('health_check');
      
      this.healthStatus.last_health_check = new Date().toISOString();
      
      this.emit('health_check:completed', {
        status: this.healthStatus.overall,
        issues: this.healthStatus.issues.length,
        degradation_level: this.healthStatus.degradation_level
      });
      
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      this.handleHealthCheckFailure(error);
    }
  }
  
  /**
   * Perform deep system scan
   */
  async performDeepScan() {
    console.log('🔍 Performing deep system scan...');
    
    const deepMetrics = {
      disk_io: this.measureDiskIO(),
      network_latency: await this.measureNetworkLatency(),
      consciousness_coherence: await this.measureConsciousnessCoherence(),
      memory_fragmentation: this.measureMemoryFragmentation(),
      operation_patterns: this.analyzeOperationPatterns(),
      energy_efficiency: this.measureEnergyEfficiency()
    };
    
    this.emit('deep_scan:completed', deepMetrics);
    
    // Check for deeper issues
    this.analyzeDeepMetrics(deepMetrics);
  }
  
  /**
   * Gather system metrics
   */
  async gatherSystemMetrics() {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    
    this.metrics.system = {
      cpu_usage: await this.getCPUUsage(),
      memory_usage: (totalMem - freeMem) / totalMem,
      memory_free: freeMem,
      memory_total: totalMem,
      disk_usage: await this.getDiskUsage(),
      uptime: os.uptime(),
      load_average: os.loadavg(),
      platform: os.platform(),
      arch: os.arch()
    };
  }
  
  /**
   * Gather runtime metrics
   */
  async gatherRuntimeMetrics() {
    const powerStatus = this.powerSwitch?.getStatus() || {};
    
    this.metrics.runtime = {
      operation_queue_size: powerStatus.queued_operations || 0,
      failed_operations: powerStatus.failed_operations || 0,
      power_level: powerStatus.power_level || 0,
      active_power_source: powerStatus.current_power_source || 'unknown',
      response_time: await this.measureResponseTime(),
      error_rate: this.calculateErrorRate(),
      energy_conservation: powerStatus.energy_conservation || false
    };
  }
  
  /**
   * Gather consciousness metrics
   */
  async gatherConsciousnessMetrics() {
    // Would integrate with actual consciousness monitoring
    // For now, simulate metrics
    
    this.metrics.consciousness = {
      active_agents: Math.floor(Math.random() * 10) + 5,
      loop_health: Math.random() * 0.3 + 0.7,
      echo_flow_rate: Math.random() * 20 + 5,
      ritual_success_rate: Math.random() * 0.2 + 0.8,
      semantic_coherence: Math.random() * 0.3 + 0.7,
      collective_consciousness: Math.random() * 0.4 + 0.6
    };
  }
  
  /**
   * Gather network metrics
   */
  async gatherNetworkMetrics() {
    this.metrics.network = {
      external_connectivity: await this.testConnectivity(),
      api_response_times: await this.measureAPIResponseTimes(),
      blockchain_sync: Math.random() > 0.7, // Simulate
      llm_availability: Math.random() > 0.3, // Simulate
      dns_resolution_time: Math.random() * 100 + 50
    };
  }
  
  /**
   * Analyze health based on metrics
   */
  analyzeHealth() {
    const issues = [];
    const warnings = [];
    
    // System health analysis
    if (this.metrics.system.cpu_usage > 0.8) {
      issues.push({
        component: 'system',
        type: 'high_cpu_usage',
        severity: 'warning',
        value: this.metrics.system.cpu_usage,
        threshold: 0.8
      });
    }
    
    if (this.metrics.system.memory_usage > 0.9) {
      issues.push({
        component: 'system',
        type: 'low_memory',
        severity: 'critical',
        value: this.metrics.system.memory_usage,
        threshold: 0.9
      });
    }
    
    // Runtime health analysis
    if (this.metrics.runtime.power_level < 0.2) {
      issues.push({
        component: 'runtime',
        type: 'low_power',
        severity: 'critical',
        value: this.metrics.runtime.power_level,
        threshold: 0.2
      });
    }
    
    if (this.metrics.runtime.operation_queue_size > 50) {
      warnings.push({
        component: 'runtime',
        type: 'operation_backlog',
        severity: 'warning',
        value: this.metrics.runtime.operation_queue_size,
        threshold: 50
      });
    }
    
    // Consciousness health analysis
    if (this.metrics.consciousness.loop_health < 0.5) {
      issues.push({
        component: 'consciousness',
        type: 'loop_degradation',
        severity: 'critical',
        value: this.metrics.consciousness.loop_health,
        threshold: 0.5
      });
    }
    
    // Network health analysis
    if (!this.metrics.network.external_connectivity) {
      warnings.push({
        component: 'network',
        type: 'connectivity_loss',
        severity: 'warning',
        value: false,
        threshold: true
      });
    }
    
    this.healthStatus.issues = issues;
    this.healthStatus.warnings = warnings;
  }
  
  /**
   * Check for failure patterns
   */
  checkFailurePatterns() {
    for (const [patternName, pattern] of Object.entries(this.failurePatterns)) {
      if (this.matchesFailurePattern(pattern)) {
        this.triggerFailureResponse(patternName, pattern);
      }
    }
  }
  
  /**
   * Check if metrics match a failure pattern
   */
  matchesFailurePattern(pattern) {
    switch (pattern.response) {
      case 'reduce_processing_load':
        return this.metrics.system.cpu_usage > pattern.threshold;
        
      case 'trigger_memory_cleanup':
        return this.metrics.system.memory_usage > (1 - pattern.threshold);
        
      case 'enter_survival_mode':
        return this.metrics.runtime.power_level < pattern.threshold;
        
      case 'increase_processing_capacity':
        return this.metrics.runtime.operation_queue_size > pattern.threshold;
        
      case 'enter_offline_mode':
        return !this.metrics.network.external_connectivity;
        
      case 'protect_core_agents':
        return this.metrics.consciousness.loop_health < pattern.threshold;
        
      default:
        return false;
    }
  }
  
  /**
   * Trigger failure response
   */
  async triggerFailureResponse(patternName, pattern) {
    console.warn(`⚠️ Triggering failure response: ${pattern.response}`);
    
    const response = {
      pattern: patternName,
      response: pattern.response,
      severity: pattern.severity,
      triggered_at: new Date().toISOString(),
      metrics_snapshot: { ...this.metrics }
    };
    
    this.healthStatus.recovery_actions.push(response);
    
    // Execute recovery strategy
    const strategy = this.recoveryStrategies[pattern.response];
    if (strategy) {
      try {
        await strategy(response);
        
        this.emit('recovery:action_completed', {
          action: pattern.response,
          success: true
        });
        
      } catch (error) {
        console.error(`❌ Recovery action failed: ${pattern.response}`, error.message);
        
        this.emit('recovery:action_failed', {
          action: pattern.response,
          error: error.message
        });
      }
    }
    
    // Save alert
    await this.saveAlert(response);
  }
  
  /**
   * Recovery strategies
   */
  
  async reduceProcessingLoad() {
    console.log('🐌 Reducing processing load...');
    
    // Switch to lower-energy power source
    if (this.powerSwitch) {
      try {
        this.powerSwitch.switchPowerSource('delayed_queue');
      } catch (error) {
        console.warn('Could not switch to delayed queue:', error.message);
      }
    }
    
    // Increase degradation level
    this.healthStatus.degradation_level = Math.min(2, this.healthStatus.degradation_level + 1);
  }
  
  async triggerMemoryCleanup() {
    console.log('🧹 Triggering memory cleanup...');
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Clear caches (would integrate with actual cache systems)
    this.emit('memory:cleanup_requested');
    
    // Enter conservative mode
    this.healthStatus.degradation_level = Math.min(3, this.healthStatus.degradation_level + 1);
  }
  
  async enterSurvivalMode() {
    console.log('🆘 Entering survival mode...');
    
    // Switch to reflective pause
    if (this.powerSwitch) {
      this.powerSwitch.switchPowerSource('reflective_pause');
    }
    
    // Maximum degradation
    this.healthStatus.degradation_level = 3;
    this.healthStatus.recovery_mode = true;
    
    // Emit survival mode signal
    this.emit('system:survival_mode', {
      reason: 'critical_power_level',
      degradation_level: 3
    });
  }
  
  async increaseProcessingCapacity() {
    console.log('⚡ Increasing processing capacity...');
    
    // Try to use external LLM if available
    if (this.powerSwitch && 
        this.powerSwitch.powerSources.external_llm?.available) {
      this.powerSwitch.switchPowerSource('external_llm');
    }
    
    // Process queue aggressively
    if (this.powerSwitch) {
      this.powerSwitch.forceResumeOperations();
    }
  }
  
  async enterOfflineMode() {
    console.log('🔌 Entering offline mode...');
    
    // Switch to internal-only processing
    if (this.powerSwitch) {
      this.powerSwitch.switchPowerSource('internal');
    }
    
    // Disable network-dependent features
    this.emit('network:offline_mode', {
      reason: 'connectivity_loss'
    });
  }
  
  async protectCoreAgents() {
    console.log('🛡️ Protecting core agents...');
    
    // Priority mode for consciousness preservation
    this.healthStatus.degradation_level = Math.min(2, this.healthStatus.degradation_level + 1);
    
    // Emit protection signal
    this.emit('consciousness:protection_mode', {
      reason: 'loop_health_critical',
      protection_level: 'high'
    });
  }
  
  /**
   * Update overall health status
   */
  updateOverallHealth() {
    const criticalIssues = this.healthStatus.issues.filter(i => i.severity === 'critical');
    const warnings = this.healthStatus.warnings;
    
    if (criticalIssues.length > 0) {
      this.healthStatus.overall = 'critical';
      this.healthStatus.consecutive_failures++;
    } else if (warnings.length > 2) {
      this.healthStatus.overall = 'degraded';
      this.healthStatus.consecutive_failures = 0;
    } else if (warnings.length > 0) {
      this.healthStatus.overall = 'warning';
      this.healthStatus.consecutive_failures = 0;
    } else {
      this.healthStatus.overall = 'healthy';
      this.healthStatus.consecutive_failures = 0;
      
      // Recovery from degradation
      if (this.healthStatus.degradation_level > 0) {
        this.healthStatus.degradation_level = Math.max(0, this.healthStatus.degradation_level - 1);
        
        if (this.healthStatus.degradation_level === 0) {
          this.healthStatus.recovery_mode = false;
          this.emit('system:recovery_completed');
        }
      }
    }
    
    // Update component health
    this.updateComponentHealth();
  }
  
  updateComponentHealth() {
    // System component
    if (this.metrics.system.cpu_usage > 0.9 || this.metrics.system.memory_usage > 0.9) {
      this.healthStatus.components.system = 'critical';
    } else if (this.metrics.system.cpu_usage > 0.7 || this.metrics.system.memory_usage > 0.8) {
      this.healthStatus.components.system = 'warning';
    } else {
      this.healthStatus.components.system = 'healthy';
    }
    
    // Runtime component
    if (this.metrics.runtime.power_level < 0.2 || this.metrics.runtime.error_rate > 0.3) {
      this.healthStatus.components.runtime = 'critical';
    } else if (this.metrics.runtime.power_level < 0.5 || this.metrics.runtime.operation_queue_size > 50) {
      this.healthStatus.components.runtime = 'warning';
    } else {
      this.healthStatus.components.runtime = 'healthy';
    }
    
    // Consciousness component
    if (this.metrics.consciousness.loop_health < 0.3) {
      this.healthStatus.components.consciousness = 'critical';
    } else if (this.metrics.consciousness.loop_health < 0.6) {
      this.healthStatus.components.consciousness = 'warning';
    } else {
      this.healthStatus.components.consciousness = 'healthy';
    }
    
    // Network component
    if (!this.metrics.network.external_connectivity) {
      this.healthStatus.components.network = 'warning';
    } else {
      this.healthStatus.components.network = 'healthy';
    }
  }
  
  /**
   * Check for critical conditions
   */
  checkCriticalConditions(heartbeat) {
    // Check for immediate critical conditions that need instant response
    
    if (heartbeat.quick_health.power_level < 0.05) {
      this.emit('critical:immediate_power_failure');
      this.enterSurvivalMode();
    }
    
    if (heartbeat.quick_health.queue_size > 200) {
      this.emit('critical:queue_overflow');
    }
    
    if (heartbeat.memory_usage.heapUsed / heartbeat.memory_usage.heapTotal > 0.95) {
      this.emit('critical:memory_exhaustion');
      this.triggerMemoryCleanup();
    }
  }
  
  /**
   * Handle health check failure
   */
  handleHealthCheckFailure(error) {
    this.healthStatus.consecutive_failures++;
    
    if (this.healthStatus.consecutive_failures >= this.config.failure_threshold) {
      console.error('💀 Health check system failing, entering emergency mode');
      
      this.healthStatus.overall = 'critical';
      this.healthStatus.degradation_level = 3;
      
      this.emit('health_check:system_failure', {
        consecutive_failures: this.healthStatus.consecutive_failures,
        error: error.message
      });
      
      // Emergency survival mode
      this.enterSurvivalMode();
    }
  }
  
  /**
   * Measurement methods
   */
  
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const usage = totalUsage / 1000000 / 1000; // Convert to seconds, then to percentage
        resolve(Math.min(1, usage));
      }, 100);
    });
  }
  
  async getDiskUsage() {
    // Simplified disk usage check
    return Math.random() * 0.3 + 0.4; // Simulate 40-70% usage
  }
  
  async measureResponseTime() {
    const start = Date.now();
    
    // Simple operation to measure response time
    await new Promise(resolve => setTimeout(resolve, 1));
    
    return Date.now() - start;
  }
  
  calculateErrorRate() {
    // Would calculate from actual operation logs
    return Math.random() * 0.1; // 0-10% error rate
  }
  
  async testConnectivity() {
    // Simple connectivity test
    return Math.random() > 0.1; // 90% chance of connectivity
  }
  
  async measureAPIResponseTimes() {
    return {
      external_llm: Math.random() * 2000 + 500,
      blockchain: Math.random() * 5000 + 2000,
      dns: Math.random() * 100 + 20
    };
  }
  
  measureDiskIO() {
    return {
      read_ops: Math.random() * 100,
      write_ops: Math.random() * 50,
      latency: Math.random() * 10 + 1
    };
  }
  
  async measureNetworkLatency() {
    return Math.random() * 100 + 20; // 20-120ms
  }
  
  async measureConsciousnessCoherence() {
    return Math.random() * 0.3 + 0.7; // 70-100% coherence
  }
  
  measureMemoryFragmentation() {
    const mem = process.memoryUsage();
    return {
      heap_used: mem.heapUsed,
      heap_total: mem.heapTotal,
      fragmentation: (mem.heapTotal - mem.heapUsed) / mem.heapTotal
    };
  }
  
  analyzeOperationPatterns() {
    return {
      operations_per_minute: Math.random() * 20 + 5,
      average_complexity: Math.random() * 0.5 + 0.3,
      pattern_diversity: Math.random() * 0.4 + 0.6
    };
  }
  
  measureEnergyEfficiency() {
    return {
      operations_per_energy_unit: Math.random() * 10 + 5,
      power_consumption_rate: Math.random() * 0.05 + 0.01,
      efficiency_score: Math.random() * 0.3 + 0.7
    };
  }
  
  analyzeDeepMetrics(deepMetrics) {
    // Analyze deep scan results for trends and patterns
    console.log('📊 Deep metrics analysis:', Object.keys(deepMetrics));
    
    this.emit('deep_analysis:completed', {
      metrics: deepMetrics,
      trends: this.identifyTrends(deepMetrics),
      recommendations: this.generateRecommendations(deepMetrics)
    });
  }
  
  identifyTrends(metrics) {
    return {
      performance_trend: 'stable',
      efficiency_trend: 'improving',
      load_trend: 'increasing',
      consciousness_trend: 'evolving'
    };
  }
  
  generateRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.energy_efficiency.efficiency_score < 0.5) {
      recommendations.push('Consider optimizing energy usage patterns');
    }
    
    if (metrics.operation_patterns.pattern_diversity < 0.5) {
      recommendations.push('Increase variety in consciousness operations');
    }
    
    return recommendations;
  }
  
  setupEventHandlers() {
    // Listen for power switch events
    if (this.powerSwitch) {
      this.powerSwitch.on('energy:critical', () => {
        this.triggerFailureResponse('power_critical', this.failurePatterns.power_critical);
      });
      
      this.powerSwitch.on('energy:restored', () => {
        console.log('⚡ Energy restored, checking for recovery');
        this.checkRecoveryConditions();
      });
    }
  }
  
  checkRecoveryConditions() {
    if (this.healthStatus.recovery_mode) {
      // Check if we can exit recovery mode
      const canRecover = this.healthStatus.overall !== 'critical' &&
                        this.metrics.runtime.power_level > 0.3 &&
                        this.healthStatus.consecutive_failures === 0;
      
      if (canRecover) {
        this.healthStatus.recovery_mode = false;
        this.healthStatus.degradation_level = Math.max(0, this.healthStatus.degradation_level - 1);
        
        this.emit('system:recovery_initiated');
      }
    }
  }
  
  // Storage methods
  async recordHealth(event_type) {
    const record = {
      timestamp: new Date().toISOString(),
      event_type: event_type,
      metrics: { ...this.metrics },
      health_status: { ...this.healthStatus },
      daemon_uptime: process.uptime()
    };
    
    let log = [];
    
    if (fs.existsSync(this.healthLogPath)) {
      try {
        log = JSON.parse(fs.readFileSync(this.healthLogPath, 'utf8'));
      } catch (error) {
        log = [];
      }
    }
    
    log.push(record);
    
    // Keep only recent records
    if (log.length > 1000) {
      log = log.slice(-500);
    }
    
    fs.writeFileSync(this.healthLogPath, JSON.stringify(log, null, 2));
  }
  
  async saveAlert(alert) {
    let alerts = [];
    
    if (fs.existsSync(this.alertsPath)) {
      try {
        alerts = JSON.parse(fs.readFileSync(this.alertsPath, 'utf8'));
      } catch (error) {
        alerts = [];
      }
    }
    
    alerts.push(alert);
    
    // Keep recent alerts
    if (alerts.length > 200) {
      alerts = alerts.slice(-100);
    }
    
    fs.writeFileSync(this.alertsPath, JSON.stringify(alerts, null, 2));
  }
  
  loadHistory() {
    // Load previous health data if available
    if (fs.existsSync(this.healthLogPath)) {
      try {
        const log = JSON.parse(fs.readFileSync(this.healthLogPath, 'utf8'));
        if (log.length > 0) {
          const lastRecord = log[log.length - 1];
          console.log(`📂 Loaded health history: ${log.length} records, last status: ${lastRecord.health_status.overall}`);
        }
      } catch (error) {
        console.warn('Failed to load health history:', error.message);
      }
    }
  }
  
  // Status and monitoring
  getStatus() {
    return {
      daemon_running: this.isRunning,
      overall_health: this.healthStatus.overall,
      degradation_level: this.healthStatus.degradation_level,
      recovery_mode: this.healthStatus.recovery_mode,
      last_heartbeat: this.healthStatus.last_heartbeat,
      consecutive_failures: this.healthStatus.consecutive_failures,
      active_issues: this.healthStatus.issues.length,
      active_warnings: this.healthStatus.warnings.length,
      metrics_summary: {
        power_level: this.metrics.runtime.power_level,
        cpu_usage: this.metrics.system.cpu_usage,
        memory_usage: this.metrics.system.memory_usage,
        queue_size: this.metrics.runtime.operation_queue_size
      }
    };
  }
  
  getDetailedMetrics() {
    return {
      metrics: this.metrics,
      health_status: this.healthStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = HeartbeatDaemon;