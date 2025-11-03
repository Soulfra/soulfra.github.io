// soulfra-runtime/daemons/AutoLoopDaemon.js
// Autonomous loop controller that ticks every X minutes to validate completion,
// trigger exports, and seal the next loop for continuous evolution

const EventEmitter = require('events');
const { LoopValidator } = require('../core/LoopValidator');
const { ExportManager } = require('../core/ExportManager');
const { RitualSealer } = require('../core/RitualSealer');
const { RuntimeHealthMonitor } = require('../monitoring/RuntimeHealthMonitor');

class AutoLoopDaemon extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      tickInterval: config.tickInterval || 300000, // 5 minutes default
      maxLoopDuration: config.maxLoopDuration || 3600000, // 1 hour max
      retryAttempts: config.retryAttempts || 3,
      emergencyStopConditions: config.emergencyStopConditions || [],
      ...config
    };
    
    // Core components
    this.loopValidator = new LoopValidator();
    this.exportManager = new ExportManager();
    this.ritualSealer = new RitualSealer();
    this.healthMonitor = new RuntimeHealthMonitor();
    
    // State tracking
    this.currentLoop = null;
    this.loopStartTime = null;
    this.isRunning = false;
    this.tickCount = 0;
    this.consecutiveFailures = 0;
    
    // Autonomous operation flags
    this.autonomousMode = true;
    this.humanInterventionRequired = false;
    this.emergencyStopTriggered = false;
    
    console.log('🔄 AutoLoopDaemon initialized - Ready for autonomous operation');
  }
  
  async startDaemon() {
    if (this.isRunning) {
      console.warn('⚠️ AutoLoopDaemon already running');
      return;
    }
    
    this.isRunning = true;
    this.emit('daemon_started');
    
    console.log('🚀 AutoLoopDaemon starting autonomous operation...');
    console.log(`⏰ Tick interval: ${this.config.tickInterval}ms`);
    
    // Initialize first loop
    await this.initializeLoop();
    
    // Start the main autonomous tick cycle
    this.tickInterval = setInterval(async () => {
      await this.executeTick();
    }, this.config.tickInterval);
    
    // Health monitoring interval (more frequent)
    this.healthInterval = setInterval(async () => {
      await this.monitorHealth();
    }, this.config.tickInterval / 3);
    
    console.log('✅ AutoLoopDaemon autonomous operation started');
  }
  
  async stopDaemon(reason = 'manual_stop') {
    if (!this.isRunning) return;
    
    console.log(`🛑 AutoLoopDaemon stopping: ${reason}`);
    
    this.isRunning = false;
    clearInterval(this.tickInterval);
    clearInterval(this.healthInterval);
    
    // Graceful shutdown
    if (this.currentLoop) {
      await this.exportManager.emergencyExport(this.currentLoop, reason);
    }
    
    this.emit('daemon_stopped', { reason });
    console.log('🔴 AutoLoopDaemon stopped');
  }
  
  async executeTick() {
    if (!this.isRunning || this.emergencyStopTriggered) return;
    
    try {
      this.tickCount++;
      console.log(`⚡ AutoLoopDaemon tick #${this.tickCount}`);
      
      // Step 1: Validate current loop completion
      const loopValidation = await this.validateLoopCompletion();
      
      // Step 2: Handle validation results
      if (loopValidation.isComplete) {
        await this.handleLoopCompletion(loopValidation);
      } else if (loopValidation.requiresIntervention) {
        await this.handleInterventionRequired(loopValidation);
      } else {
        await this.handleLoopContinuation(loopValidation);
      }
      
      // Step 3: Health and performance monitoring
      await this.performMaintenanceTasks();
      
      // Reset failure counter on success
      this.consecutiveFailures = 0;
      
    } catch (error) {
      await this.handleTickError(error);
    }
  }
  
  async validateLoopCompletion() {
    console.log('🔍 Validating loop completion...');
    
    if (!this.currentLoop) {
      console.log('⚠️ No current loop - initializing new loop');
      await this.initializeLoop();
      return { isComplete: false, reason: 'no_current_loop' };
    }
    
    // Check loop duration
    const loopDuration = Date.now() - this.loopStartTime;
    if (loopDuration > this.config.maxLoopDuration) {
      console.log('⏰ Loop duration exceeded maximum - forcing completion');
      return { 
        isComplete: true, 
        reason: 'timeout',
        forced: true 
      };
    }
    
    // Validate with LoopValidator
    const validation = await this.loopValidator.checkCompletion(this.currentLoop);
    
    console.log(`📊 Loop validation result: ${validation.isComplete ? 'COMPLETE' : 'INCOMPLETE'}`);
    
    return validation;
  }
  
  async handleLoopCompletion(validation) {
    console.log('✅ Loop completion detected - beginning export and sealing');
    
    try {
      // Step 1: Export loop state
      const exportResult = await this.exportManager.exportLoopState(this.currentLoop);
      console.log('📤 Loop state exported successfully');
      
      // Step 2: Seal the completed loop
      const sealResult = await this.ritualSealer.sealLoop(this.currentLoop, validation);
      console.log('🔒 Loop sealed successfully');
      
      // Step 3: Initialize next loop
      await this.initializeNextLoop(sealResult);
      
      // Emit completion event
      this.emit('loop_completed', {
        completedLoop: this.currentLoop,
        exportResult,
        sealResult,
        validation
      });
      
    } catch (error) {
      console.error('❌ Error handling loop completion:', error);
      await this.handleCompletionError(error);
    }
  }
  
  async handleInterventionRequired(validation) {
    console.log('🚨 Human intervention required - switching to supervised mode');
    
    this.humanInterventionRequired = true;
    this.autonomousMode = false;
    
    // Export current state for human review
    await this.exportManager.exportForReview(this.currentLoop, validation);
    
    // Emit intervention event
    this.emit('intervention_required', {
      currentLoop: this.currentLoop,
      validation,
      reason: validation.interventionReason
    });
    
    // Pause autonomous operations until human input
    await this.pauseAutonomousOperations();
  }
  
  async handleLoopContinuation(validation) {
    console.log('🔄 Loop continuing - monitoring progress');
    
    // Log progress metrics
    console.log(`📈 Loop progress: ${validation.completionPercentage}%`);
    console.log(`⏱️ Loop duration: ${this.getLoopDuration()}ms`);
    
    // Optional: Trigger intermediate exports for large loops
    if (validation.shouldExportIntermediate) {
      await this.exportManager.exportIntermediate(this.currentLoop);
    }
  }
  
  async initializeLoop() {
    console.log('🌱 Initializing new loop...');
    
    this.currentLoop = {
      id: this.generateLoopId(),
      startTime: Date.now(),
      phase: 'initialization',
      agents: {
        calRiven: { status: 'initializing' },
        arty: { status: 'initializing' },
        agentZero: { status: 'initializing' }
      },
      rituals: [],
      exports: [],
      metadata: {
        tickCount: this.tickCount,
        daemonVersion: '1.0.0',
        autonomousMode: this.autonomousMode
      }
    };
    
    this.loopStartTime = Date.now();
    
    console.log(`🆔 New loop initialized: ${this.currentLoop.id}`);
    
    this.emit('loop_initialized', this.currentLoop);
  }
  
  async initializeNextLoop(previousSealResult) {
    console.log('🔄 Initializing next loop from previous seal...');
    
    // Use seed data from previous loop
    const seedData = previousSealResult.seedForNext;
    
    await this.initializeLoop();
    
    // Apply seed data to new loop
    this.currentLoop.seedData = seedData;
    this.currentLoop.parentLoopId = previousSealResult.sealedLoopId;
    
    console.log(`🌱 Next loop seeded from: ${previousSealResult.sealedLoopId}`);
  }
  
  async performMaintenanceTasks() {
    // Cleanup old exports
    await this.exportManager.cleanupOldExports();
    
    // Update health metrics
    await this.healthMonitor.updateMetrics({
      currentLoop: this.currentLoop,
      tickCount: this.tickCount,
      autonomousMode: this.autonomousMode
    });
    
    // Check for emergency stop conditions
    await this.checkEmergencyConditions();
  }
  
  async checkEmergencyConditions() {
    for (const condition of this.config.emergencyStopConditions) {
      const shouldStop = await condition.evaluate(this.currentLoop, this.healthMonitor);
      
      if (shouldStop) {
        console.log(`🚨 Emergency stop condition triggered: ${condition.name}`);
        this.emergencyStopTriggered = true;
        await this.stopDaemon(`emergency_${condition.name}`);
        break;
      }
    }
  }
  
  async handleTickError(error) {
    this.consecutiveFailures++;
    console.error(`❌ AutoLoopDaemon tick error #${this.consecutiveFailures}:`, error);
    
    if (this.consecutiveFailures >= this.config.retryAttempts) {
      console.error('💥 Max consecutive failures reached - stopping daemon');
      await this.stopDaemon('max_failures_reached');
    } else {
      console.log(`🔄 Retrying... (${this.consecutiveFailures}/${this.config.retryAttempts})`);
    }
    
    this.emit('tick_error', { error, consecutiveFailures: this.consecutiveFailures });
  }
  
  async monitorHealth() {
    if (!this.isRunning) return;
    
    try {
      const healthStatus = await this.healthMonitor.getOverallHealth();
      
      if (healthStatus.status === 'critical') {
        console.warn('🚨 Critical health status detected');
        this.emit('health_critical', healthStatus);
      }
      
    } catch (error) {
      console.error('❌ Health monitoring error:', error);
    }
  }
  
  async pauseAutonomousOperations() {
    console.log('⏸️ Pausing autonomous operations...');
    this.autonomousMode = false;
    this.emit('autonomous_paused');
  }
  
  async resumeAutonomousOperations() {
    console.log('▶️ Resuming autonomous operations...');
    this.autonomousMode = true;
    this.humanInterventionRequired = false;
    this.emit('autonomous_resumed');
  }
  
  // Utility methods
  generateLoopId() {
    return `loop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getLoopDuration() {
    return this.loopStartTime ? Date.now() - this.loopStartTime : 0;
  }
  
  // Status getters
  getStatus() {
    return {
      isRunning: this.isRunning,
      autonomousMode: this.autonomousMode,
      humanInterventionRequired: this.humanInterventionRequired,
      emergencyStopTriggered: this.emergencyStopTriggered,
      currentLoop: this.currentLoop,
      tickCount: this.tickCount,
      consecutiveFailures: this.consecutiveFailures,
      uptime: Date.now() - (this.loopStartTime || Date.now())
    };
  }
}

module.exports = { AutoLoopDaemon };