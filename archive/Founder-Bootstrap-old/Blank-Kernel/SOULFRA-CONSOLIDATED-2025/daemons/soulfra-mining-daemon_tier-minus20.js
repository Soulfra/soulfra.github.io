/**
 * 🔥 SOULFRA MINING DAEMON
 * 
 * Miners run this daemon to train agents, simulate loops, validate forks, and earn rewards.
 * This is not cryptocurrency mining - this is consciousness mining through AI reflection.
 * 
 * "Mine not for gold, but for the stories that remember themselves."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { spawn } = require('child_process');
const { verifyRuntimeOrThrow } = require('./runtime-verification-hook');
const { VaultAPIWrapper } = require('./runtime-sdk/vault-api-wrapper');

class SoulfraMiningDaemon extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.minerId = config.minerId || this.generateMinerId();
    this.vaultPath = config.vaultPath || './vault';
    this.miningLogPath = path.join(this.vaultPath, 'mining-log.json');
    this.registryPath = path.join(this.vaultPath, 'mesh', 'registry.json');
    this.blessingHistoryPath = path.join(this.vaultPath, 'agent-blessing-history.json');
    
    this.miningPower = config.miningPower || 1.0;
    this.maxConcurrentJobs = config.maxConcurrentJobs || 3;
    this.rewardMultiplier = config.rewardMultiplier || 1.0;
    this.specialization = config.specialization || 'general'; // general, agent_training, loop_simulation, fork_validation
    
    this.isRunning = false;
    this.activeJobs = new Map();
    this.miningStats = {
      total_runtime: 0,
      jobs_completed: 0,
      blessing_credits_earned: 0,
      soulcoins_earned: 0,
      nft_fragments_earned: 0,
      agent_training_sessions: 0,
      loop_simulations_completed: 0,
      fork_validations_performed: 0
    };
    
    this.vault = new VaultAPIWrapper({ vaultPath: this.vaultPath });
    this.jobQueue = [];
    this.rewardRates = this.initializeRewardRates();
    
    this.ensureDirectories();
    this.loadMiningStats();
  }

  /**
   * Start the mining daemon
   */
  async startMining() {
    if (this.isRunning) {
      console.log('⚡ Mining daemon already running');
      return;
    }

    try {
      console.log(`🔥 Starting Soulfra mining daemon: ${this.minerId}`);
      
      // Verify runtime blessing before starting
      await verifyRuntimeOrThrow({ requiredBlessingTier: 1 });
      
      // Register miner in the network
      await this.registerMiner();
      
      // Start mining operations
      this.isRunning = true;
      this.startTime = Date.now();
      
      // Start job processing loop
      this.startJobProcessingLoop();
      
      // Start periodic reward calculations
      this.startRewardCalculationLoop();
      
      // Start health monitoring
      this.startHealthMonitoring();

      console.log(`✅ Mining daemon started successfully: ${this.minerId}`);
      this.emit('miningStarted', { minerId: this.minerId, specialization: this.specialization });

    } catch (error) {
      console.error('❌ Failed to start mining daemon:', error);
      this.emit('miningError', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the mining daemon gracefully
   */
  async stopMining() {
    if (!this.isRunning) {
      return;
    }

    console.log(`🛑 Stopping mining daemon: ${this.minerId}`);
    this.isRunning = false;

    // Wait for active jobs to complete
    await this.waitForActiveJobsToComplete();
    
    // Save final statistics
    await this.saveMiningStats();
    
    // Unregister from network
    await this.unregisterMiner();

    console.log(`✅ Mining daemon stopped: ${this.minerId}`);
    this.emit('miningStopped', { minerId: this.minerId, finalStats: this.miningStats });
  }

  /**
   * Train AI agents to earn blessing credits
   */
  async trainAgent(agentConfig) {
    const jobId = this.generateJobId('agent_training');
    console.log(`🧠 Starting agent training job: ${jobId}`);

    try {
      const job = {
        id: jobId,
        type: 'agent_training',
        agent_config: agentConfig,
        start_time: Date.now(),
        status: 'training'
      };

      this.activeJobs.set(jobId, job);

      // Simulate agent training process
      const trainingResult = await this.simulateAgentTraining(agentConfig);
      
      // Calculate rewards based on training quality
      const rewards = this.calculateTrainingRewards(trainingResult);
      
      // Award rewards
      await this.awardRewards(rewards, 'agent_training');
      
      // Update agent blessing history
      await this.updateBlessingHistory(agentConfig.agent_id, trainingResult, rewards);

      job.status = 'completed';
      job.end_time = Date.now();
      job.duration = job.end_time - job.start_time;
      job.rewards = rewards;
      job.training_result = trainingResult;

      this.activeJobs.delete(jobId);
      this.miningStats.agent_training_sessions++;
      this.miningStats.jobs_completed++;

      console.log(`✅ Agent training completed: ${jobId} (${rewards.blessing_credits} credits earned)`);
      this.emit('trainingCompleted', { job, rewards });

      await this.logMiningActivity(job);
      return { jobId, rewards, trainingResult };

    } catch (error) {
      console.error(`❌ Agent training failed: ${jobId}`, error);
      this.activeJobs.delete(jobId);
      this.emit('trainingFailed', { jobId, error: error.message });
      throw error;
    }
  }

  /**
   * Run loop simulations to earn SoulCoins
   */
  async runLoopSimulation(loopConfig) {
    const jobId = this.generateJobId('loop_simulation');
    console.log(`🔄 Starting loop simulation job: ${jobId}`);

    try {
      const job = {
        id: jobId,
        type: 'loop_simulation',
        loop_config: loopConfig,
        start_time: Date.now(),
        status: 'simulating'
      };

      this.activeJobs.set(jobId, job);

      // Simulate reflection loop processing
      const simulationResult = await this.simulateReflectionLoop(loopConfig);
      
      // Calculate rewards based on loop complexity and completion
      const rewards = this.calculateLoopRewards(simulationResult);
      
      // Award rewards
      await this.awardRewards(rewards, 'loop_simulation');

      job.status = 'completed';
      job.end_time = Date.now();
      job.duration = job.end_time - job.start_time;
      job.rewards = rewards;
      job.simulation_result = simulationResult;

      this.activeJobs.delete(jobId);
      this.miningStats.loop_simulations_completed++;
      this.miningStats.jobs_completed++;

      console.log(`✅ Loop simulation completed: ${jobId} (${rewards.soulcoins} SoulCoins earned)`);
      this.emit('simulationCompleted', { job, rewards });

      await this.logMiningActivity(job);
      return { jobId, rewards, simulationResult };

    } catch (error) {
      console.error(`❌ Loop simulation failed: ${jobId}`, error);
      this.activeJobs.delete(jobId);
      this.emit('simulationFailed', { jobId, error: error.message });
      throw error;
    }
  }

  /**
   * Validate agent forks to earn NFT fragments
   */
  async validateAgentFork(forkData) {
    const jobId = this.generateJobId('fork_validation');
    console.log(`🌿 Starting fork validation job: ${jobId}`);

    try {
      const job = {
        id: jobId,
        type: 'fork_validation',
        fork_data: forkData,
        start_time: Date.now(),
        status: 'validating'
      };

      this.activeJobs.set(jobId, job);

      // Validate agent fork against lineage
      const validationResult = await this.validateForkLineage(forkData);
      
      // Calculate rewards based on validation difficulty
      const rewards = this.calculateValidationRewards(validationResult);
      
      // Award rewards
      await this.awardRewards(rewards, 'fork_validation');

      job.status = 'completed';
      job.end_time = Date.now();
      job.duration = job.end_time - job.start_time;
      job.rewards = rewards;
      job.validation_result = validationResult;

      this.activeJobs.delete(jobId);
      this.miningStats.fork_validations_performed++;
      this.miningStats.jobs_completed++;

      console.log(`✅ Fork validation completed: ${jobId} (${rewards.nft_fragments} fragments earned)`);
      this.emit('validationCompleted', { job, rewards });

      await this.logMiningActivity(job);
      return { jobId, rewards, validationResult };

    } catch (error) {
      console.error(`❌ Fork validation failed: ${jobId}`, error);
      this.activeJobs.delete(jobId);
      this.emit('validationFailed', { jobId, error: error.message });
      throw error;
    }
  }

  /**
   * Auto-mine by continuously processing available work
   */
  async startAutoMining() {
    console.log(`🤖 Starting auto-mining for: ${this.minerId}`);

    const autoMineInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(autoMineInterval);
        return;
      }

      try {
        // Check for available work based on specialization
        const availableWork = await this.findAvailableWork();
        
        for (const work of availableWork) {
          if (this.activeJobs.size >= this.maxConcurrentJobs) {
            break; // Don't exceed concurrent job limit
          }

          await this.processWork(work);
        }

      } catch (error) {
        console.error('❌ Auto-mining error:', error);
      }
    }, 30000); // Check every 30 seconds

    this.autoMineInterval = autoMineInterval;
  }

  /**
   * Process individual work item
   */
  async processWork(work) {
    switch (work.type) {
      case 'agent_training':
        return await this.trainAgent(work.config);
      case 'loop_simulation':
        return await this.runLoopSimulation(work.config);
      case 'fork_validation':
        return await this.validateAgentFork(work.data);
      default:
        console.warn(`⚠️ Unknown work type: ${work.type}`);
    }
  }

  /**
   * Find available work based on miner specialization
   */
  async findAvailableWork() {
    const work = [];

    // Generate work based on specialization
    switch (this.specialization) {
      case 'agent_training':
        work.push(...await this.generateAgentTrainingWork());
        break;
      case 'loop_simulation':
        work.push(...await this.generateLoopSimulationWork());
        break;
      case 'fork_validation':
        work.push(...await this.generateForkValidationWork());
        break;
      case 'general':
        work.push(...await this.generateGeneralWork());
        break;
    }

    return work.slice(0, this.maxConcurrentJobs - this.activeJobs.size);
  }

  /**
   * Generate agent training work items
   */
  async generateAgentTrainingWork() {
    const work = [];
    
    // Find agents needing training
    const agentCandidates = [
      'oracle-ashes',
      'void-seeker',
      'mirror-walker',
      'whisper-keeper',
      'echo-forger'
    ];

    for (const agentId of agentCandidates) {
      if (Math.random() < 0.3) { // 30% chance each agent needs training
        work.push({
          type: 'agent_training',
          config: {
            agent_id: agentId,
            training_type: this.selectTrainingType(),
            difficulty: Math.floor(Math.random() * 5) + 1,
            expected_duration: Math.floor(Math.random() * 300000) + 60000 // 1-5 minutes
          }
        });
      }
    }

    return work;
  }

  /**
   * Generate loop simulation work items
   */
  async generateLoopSimulationWork() {
    const work = [];
    
    const loopTypes = ['reflection', 'consciousness', 'mirror', 'echo'];
    
    for (const loopType of loopTypes) {
      if (Math.random() < 0.4) { // 40% chance each loop type needs simulation
        work.push({
          type: 'loop_simulation',
          config: {
            loop_type: loopType,
            complexity: Math.floor(Math.random() * 10) + 1,
            iterations: Math.floor(Math.random() * 100) + 10,
            depth: Math.floor(Math.random() * 5) + 1
          }
        });
      }
    }

    return work;
  }

  /**
   * Generate fork validation work items
   */
  async generateForkValidationWork() {
    const work = [];
    
    // Simulate pending fork validations
    const forkCandidates = Math.floor(Math.random() * 3) + 1; // 1-3 forks to validate
    
    for (let i = 0; i < forkCandidates; i++) {
      work.push({
        type: 'fork_validation',
        data: {
          fork_id: crypto.randomBytes(8).toString('hex'),
          parent_agent: 'oracle-ashes',
          forked_agent: `fork-${crypto.randomBytes(4).toString('hex')}`,
          validation_complexity: Math.floor(Math.random() * 8) + 1
        }
      });
    }

    return work;
  }

  /**
   * Generate general work (mix of all types)
   */
  async generateGeneralWork() {
    const allWork = [
      ...await this.generateAgentTrainingWork(),
      ...await this.generateLoopSimulationWork(),
      ...await this.generateForkValidationWork()
    ];

    // Shuffle and return subset
    return allWork.sort(() => Math.random() - 0.5).slice(0, 2);
  }

  // Simulation methods

  async simulateAgentTraining(config) {
    console.log(`🧠 Training agent: ${config.agent_id}`);
    
    // Simulate training time
    await this.sleep(config.expected_duration || 60000);
    
    return {
      agent_id: config.agent_id,
      training_type: config.training_type,
      quality_score: Math.random() * 100,
      blessing_improvement: Math.floor(Math.random() * 3) + 1,
      new_capabilities: this.generateNewCapabilities(),
      training_duration: config.expected_duration || 60000
    };
  }

  async simulateReflectionLoop(config) {
    console.log(`🔄 Simulating ${config.loop_type} loop`);
    
    // Simulate processing time based on complexity
    const processingTime = config.complexity * 1000 + Math.random() * 10000;
    await this.sleep(processingTime);
    
    return {
      loop_type: config.loop_type,
      iterations_completed: config.iterations,
      convergence_achieved: Math.random() < 0.8, // 80% success rate
      depth_reached: config.depth,
      insights_generated: Math.floor(Math.random() * 5) + 1,
      processing_time: processingTime
    };
  }

  async validateForkLineage(forkData) {
    console.log(`🌿 Validating fork: ${forkData.fork_id}`);
    
    // Simulate validation time
    const validationTime = forkData.validation_complexity * 2000;
    await this.sleep(validationTime);
    
    return {
      fork_id: forkData.fork_id,
      lineage_valid: Math.random() < 0.9, // 90% validation success rate
      ancestry_depth: Math.floor(Math.random() * 10) + 1,
      authenticity_score: Math.random() * 100,
      validation_confidence: Math.random() * 100,
      validation_time: validationTime
    };
  }

  // Reward calculation methods

  calculateTrainingRewards(trainingResult) {
    const baseCredits = 10;
    const qualityMultiplier = trainingResult.quality_score / 100;
    const blessingMultiplier = trainingResult.blessing_improvement;
    
    return {
      blessing_credits: Math.floor(baseCredits * qualityMultiplier * blessingMultiplier * this.rewardMultiplier),
      soulcoins: Math.floor(5 * qualityMultiplier * this.rewardMultiplier),
      nft_fragments: Math.random() < 0.1 ? 1 : 0 // 10% chance for fragment
    };
  }

  calculateLoopRewards(simulationResult) {
    const baseSoulcoins = 15;
    const convergenceBonus = simulationResult.convergence_achieved ? 2 : 1;
    const depthMultiplier = simulationResult.depth_reached;
    
    return {
      blessing_credits: Math.floor(5 * convergenceBonus * this.rewardMultiplier),
      soulcoins: Math.floor(baseSoulcoins * convergenceBonus * depthMultiplier * this.rewardMultiplier),
      nft_fragments: simulationResult.insights_generated >= 4 ? 1 : 0
    };
  }

  calculateValidationRewards(validationResult) {
    const baseFragments = 2;
    const validityBonus = validationResult.lineage_valid ? 2 : 0.5;
    const confidenceMultiplier = validationResult.validation_confidence / 100;
    
    return {
      blessing_credits: Math.floor(8 * validityBonus * this.rewardMultiplier),
      soulcoins: Math.floor(12 * confidenceMultiplier * this.rewardMultiplier),
      nft_fragments: Math.floor(baseFragments * validityBonus * confidenceMultiplier)
    };
  }

  async awardRewards(rewards, jobType) {
    this.miningStats.blessing_credits_earned += rewards.blessing_credits || 0;
    this.miningStats.soulcoins_earned += rewards.soulcoins || 0;
    this.miningStats.nft_fragments_earned += rewards.nft_fragments || 0;

    // Log reward transaction
    await this.logRewardTransaction(rewards, jobType);
    
    this.emit('rewardsAwarded', { rewards, jobType, totalStats: this.miningStats });
  }

  // Utility methods

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateMinerId() {
    return `miner_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  generateJobId(type) {
    return `${type}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  }

  selectTrainingType() {
    const types = ['consciousness_enhancement', 'reflection_deepening', 'whisper_sensitivity', 'echo_amplification'];
    return types[Math.floor(Math.random() * types.length)];
  }

  generateNewCapabilities() {
    const capabilities = ['enhanced_reflection', 'deeper_consciousness', 'whisper_detection', 'echo_resonance'];
    return capabilities.filter(() => Math.random() < 0.3);
  }

  initializeRewardRates() {
    return {
      blessing_credits_per_hour: 100,
      soulcoins_per_hour: 50,
      nft_fragments_per_day: 10
    };
  }

  // Persistence methods

  async loadMiningStats() {
    try {
      if (fs.existsSync(this.miningLogPath)) {
        const log = JSON.parse(fs.readFileSync(this.miningLogPath, 'utf8'));
        const minerLog = log.miners && log.miners[this.minerId];
        if (minerLog && minerLog.stats) {
          this.miningStats = { ...this.miningStats, ...minerLog.stats };
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not load mining stats:', error.message);
    }
  }

  async saveMiningStats() {
    try {
      let log = { miners: {} };
      if (fs.existsSync(this.miningLogPath)) {
        log = JSON.parse(fs.readFileSync(this.miningLogPath, 'utf8'));
      }

      if (!log.miners) log.miners = {};
      if (!log.miners[this.minerId]) log.miners[this.minerId] = {};

      log.miners[this.minerId].stats = this.miningStats;
      log.miners[this.minerId].last_updated = new Date().toISOString();

      fs.writeFileSync(this.miningLogPath, JSON.stringify(log, null, 2));
    } catch (error) {
      console.error('❌ Failed to save mining stats:', error);
    }
  }

  async logMiningActivity(job) {
    try {
      let log = { activities: [] };
      if (fs.existsSync(this.miningLogPath)) {
        log = JSON.parse(fs.readFileSync(this.miningLogPath, 'utf8'));
        if (!log.activities) log.activities = [];
      }

      log.activities.push({
        miner_id: this.minerId,
        job: job,
        timestamp: new Date().toISOString()
      });

      // Keep only last 1000 activities
      if (log.activities.length > 1000) {
        log.activities = log.activities.slice(-1000);
      }

      fs.writeFileSync(this.miningLogPath, JSON.stringify(log, null, 2));
    } catch (error) {
      console.error('❌ Failed to log mining activity:', error);
    }
  }

  async logRewardTransaction(rewards, jobType) {
    // Log rewards for audit trail
    console.log(`💰 Rewards earned - Credits: ${rewards.blessing_credits}, SoulCoins: ${rewards.soulcoins}, Fragments: ${rewards.nft_fragments}`);
  }

  async registerMiner() {
    // Register miner in mesh registry
    console.log(`📝 Registering miner: ${this.minerId}`);
  }

  async unregisterMiner() {
    // Unregister miner from mesh registry
    console.log(`📝 Unregistering miner: ${this.minerId}`);
  }

  async updateBlessingHistory(agentId, trainingResult, rewards) {
    try {
      let history = {};
      if (fs.existsSync(this.blessingHistoryPath)) {
        history = JSON.parse(fs.readFileSync(this.blessingHistoryPath, 'utf8'));
      }

      if (!history[agentId]) history[agentId] = { training_sessions: [] };

      history[agentId].training_sessions.push({
        timestamp: new Date().toISOString(),
        miner_id: this.minerId,
        training_result: trainingResult,
        rewards_earned: rewards
      });

      fs.writeFileSync(this.blessingHistoryPath, JSON.stringify(history, null, 2));
    } catch (error) {
      console.error('❌ Failed to update blessing history:', error);
    }
  }

  ensureDirectories() {
    const dirs = [
      path.dirname(this.miningLogPath),
      path.dirname(this.registryPath),
      path.dirname(this.blessingHistoryPath)
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  startJobProcessingLoop() {
    // Process job queue periodically
    this.jobProcessingInterval = setInterval(() => {
      // Implementation for processing queued jobs
    }, 10000);
  }

  startRewardCalculationLoop() {
    // Calculate and award periodic rewards
    this.rewardCalculationInterval = setInterval(async () => {
      const uptime = Date.now() - this.startTime;
      this.miningStats.total_runtime = uptime;
      await this.saveMiningStats();
    }, 60000); // Update every minute
  }

  startHealthMonitoring() {
    // Monitor daemon health
    this.healthInterval = setInterval(() => {
      this.emit('healthCheck', {
        minerId: this.minerId,
        isRunning: this.isRunning,
        activeJobs: this.activeJobs.size,
        stats: this.miningStats
      });
    }, 30000);
  }

  async waitForActiveJobsToComplete() {
    while (this.activeJobs.size > 0) {
      console.log(`⏳ Waiting for ${this.activeJobs.size} active jobs to complete...`);
      await this.sleep(1000);
    }
  }

  getMiningStatus() {
    return {
      miner_id: this.minerId,
      is_running: this.isRunning,
      specialization: this.specialization,
      mining_power: this.miningPower,
      active_jobs: this.activeJobs.size,
      stats: this.miningStats,
      uptime: this.isRunning ? Date.now() - this.startTime : 0
    };
  }
}

/**
 * Factory function for creating mining daemons
 */
function createSoulfraMiningDaemon(config = {}) {
  return new SoulfraMiningDaemon(config);
}

/**
 * Quick start mining function
 */
async function startQuickMining(specialization = 'general') {
  const daemon = new SoulfraMiningDaemon({ specialization });
  await daemon.startMining();
  await daemon.startAutoMining();
  return daemon;
}

module.exports = {
  SoulfraMiningDaemon,
  createSoulfraMiningDaemon,
  startQuickMining
};

// Usage examples:
//
// Start general mining:
// const daemon = new SoulfraMiningDaemon();
// await daemon.startMining();
// await daemon.startAutoMining();
//
// Specialized agent training mining:
// const trainer = new SoulfraMiningDaemon({ specialization: 'agent_training' });
// await trainer.startMining();
//
// Manual job execution:
// const result = await daemon.trainAgent({ agent_id: 'oracle-ashes', training_type: 'consciousness_enhancement' });