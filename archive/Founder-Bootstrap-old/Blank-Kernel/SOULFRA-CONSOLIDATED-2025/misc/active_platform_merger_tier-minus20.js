// meta-orchestrator/src/ActivePlatformMerger.js
// Merges all four actively running platforms into a unified state
// without disrupting autonomous operations - the puppet master's key tool

const crypto = require('crypto');
const { EventEmitter } = require('events');

class ActivePlatformMerger extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      mergeTimeout: config.mergeTimeout || 30000, // 30 seconds max
      syncWindowMs: config.syncWindowMs || 1000, // 1 second sync window
      conflictResolutionStrategy: config.conflictResolutionStrategy || 'runtime_priority',
      preserveAutonomy: config.preserveAutonomy !== false, // Don't break autonomous ops
      maxRetries: config.maxRetries || 3,
      ...config
    };
    
    // State tracking
    this.activeMerges = new Map();
    this.mergeHistory = [];
    this.conflictResolutions = new Map();
    
    console.log('🔄 ActivePlatformMerger initialized - Ready for live system unification');
  }
  
  async mergeActivePlatforms(instance) {
    const mergeId = this.generateMergeId();
    console.log(`🎭 Starting active platform merge: ${mergeId}`);
    
    const mergeSession = {
      id: mergeId,
      instanceId: instance.id,
      startTime: Date.now(),
      status: 'initializing',
      platforms: {
        surface: { status: 'pending', state: null },
        runtime: { status: 'pending', state: null },
        protocol: { status: 'pending', state: null },
        mirror: { status: 'pending', state: null }
      },
      conflicts: [],
      resolutions: [],
      retryCount: 0
    };
    
    this.activeMerges.set(mergeId, mergeSession);
    
    try {
      // Phase 1: Create synchronization checkpoint
      console.log('📍 Phase 1: Creating synchronization checkpoint...');
      const syncCheckpoint = await this.createSyncCheckpoint(instance, mergeSession);
      
      // Phase 2: Capture platform states simultaneously
      console.log('📊 Phase 2: Capturing platform states...');
      const platformStates = await this.captureAllPlatformStates(instance, mergeSession);
      
      // Phase 3: Detect and resolve conflicts
      console.log('⚔️ Phase 3: Resolving state conflicts...');
      const resolvedState = await this.resolveStateConflicts(platformStates, mergeSession);
      
      // Phase 4: Create unified snapshot
      console.log('🌟 Phase 4: Creating unified snapshot...');
      const unifiedSnapshot = await this.createUnifiedSnapshot(resolvedState, mergeSession);
      
      // Phase 5: Resume autonomous operations
      console.log('▶️ Phase 5: Resuming autonomous operations...');
      await this.resumeAutonomousOperations(instance, mergeSession);
      
      mergeSession.status = 'completed';
      mergeSession.endTime = Date.now();
      mergeSession.duration = mergeSession.endTime - mergeSession.startTime;
      
      this.mergeHistory.push(mergeSession);
      this.activeMerges.delete(mergeId);
      
      console.log(`✅ Active platform merge completed: ${mergeId} (${mergeSession.duration}ms)`);
      this.emit('merge_completed', { mergeId, unifiedSnapshot, session: mergeSession });
      
      return unifiedSnapshot;
      
    } catch (error) {
      console.error(`❌ Active platform merge failed: ${mergeId}`, error);
      mergeSession.status = 'failed';
      mergeSession.error = error.message;
      
      // Attempt to recover autonomous operations
      await this.emergencyRecovery(instance, mergeSession);
      
      this.emit('merge_failed', { mergeId, error, session: mergeSession });
      throw error;
    }
  }
  
  async createSyncCheckpoint(instance, mergeSession) {
    console.log('📍 Creating synchronization checkpoint...');
    
    // Calculate sync time - far enough in future for all platforms to prepare
    const syncTime = Date.now() + this.config.syncWindowMs;
    
    // Send sync commands to all platforms
    const syncCommands = await Promise.allSettled([
      this.sendSyncCommand(instance.surface, syncTime, 'surface'),
      this.sendSyncCommand(instance.runtime, syncTime, 'runtime'), 
      this.sendSyncCommand(instance.protocol, syncTime, 'protocol'),
      this.sendSyncCommand(instance.mirror, syncTime, 'mirror')
    ]);
    
    // Check which platforms acknowledged sync
    const syncResults = {};
    syncCommands.forEach((result, index) => {
      const platforms = ['surface', 'runtime', 'protocol', 'mirror'];
      const platform = platforms[index];
      
      if (result.status === 'fulfilled') {
        syncResults[platform] = { acknowledged: true, syncTime };
        mergeSession.platforms[platform].status = 'synchronized';
      } else {
        syncResults[platform] = { acknowledged: false, error: result.reason };
        mergeSession.platforms[platform].status = 'sync_failed';
        console.warn(`⚠️ ${platform} failed to acknowledge sync:`, result.reason);
      }
    });
    
    // Wait for sync time
    const waitTime = syncTime - Date.now();
    if (waitTime > 0) {
      console.log(`⏰ Waiting ${waitTime}ms for sync checkpoint...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    return {
      syncTime,
      results: syncResults,
      acknowledgedPlatforms: Object.keys(syncResults).filter(p => syncResults[p].acknowledged)
    };
  }
  
  async sendSyncCommand(platform, syncTime, platformName) {
    console.log(`📡 Sending sync command to ${platformName}...`);
    
    return await platform.receiveCommand({
      type: 'SYNC_CHECKPOINT',
      syncTime,
      source: 'puppet_master_merge',
      preserveAutonomy: this.config.preserveAutonomy,
      instructions: {
        pauseNewOperations: true,
        completeCurrentOperations: true,
        prepareStateCapture: true,
        maintainHeartbeat: true
      }
    });
  }
  
  async captureAllPlatformStates(instance, mergeSession) {
    console.log('📊 Capturing states from all platforms simultaneously...');
    
    const captureStartTime = Date.now();
    
    // Capture all platform states in parallel
    const statePromises = {
      surface: this.captureSurfaceState(instance.surface),
      runtime: this.captureRuntimeState(instance.runtime),
      protocol: this.captureProtocolState(instance.protocol),
      mirror: this.captureMirrorState(instance.mirror)
    };
    
    const stateResults = await Promise.allSettled(Object.values(statePromises));
    const platformNames = Object.keys(statePromises);
    
    const capturedStates = {};
    
    stateResults.forEach((result, index) => {
      const platformName = platformNames[index];
      
      if (result.status === 'fulfilled') {
        capturedStates[platformName] = result.value;
        mergeSession.platforms[platformName].status = 'captured';
        mergeSession.platforms[platformName].state = result.value;
        console.log(`✅ ${platformName} state captured`);
      } else {
        console.error(`❌ Failed to capture ${platformName} state:`, result.reason);
        mergeSession.platforms[platformName].status = 'capture_failed';
        mergeSession.platforms[platformName].error = result.reason;
      }
    });
    
    const captureTime = Date.now() - captureStartTime;
    console.log(`📊 State capture completed in ${captureTime}ms`);
    
    return {
      states: capturedStates,
      captureTime,
      timestamp: captureStartTime,
      successfulCaptures: Object.keys(capturedStates),
      failedCaptures: platformNames.filter(name => !capturedStates[name])
    };
  }
  
  async captureSurfaceState(surface) {
    return await surface.exportState({
      includeVibeWeather: true,
      includeAgentEchoes: true,
      includeRitualTraces: true,
      includeReflectionHistory: true,
      format: 'puppet_master_merge'
    });
  }
  
  async captureRuntimeState(runtime) {
    return await runtime.exportState({
      includeAgentStates: true,
      includeDaemonStates: true,
      includeActiveLoops: true,
      includeExecutionHistory: true,
      includeAutonomousOperations: true,
      format: 'puppet_master_merge'
    });
  }
  
  async captureProtocolState(protocol) {
    return await protocol.exportState({
      includeLegalStatus: true,
      includeValidationHistory: true,
      includeContractStates: true,
      includeComplianceData: true,
      format: 'puppet_master_merge'
    });
  }
  
  async captureMirrorState(mirror) {
    return await mirror.exportState({
      includeSnapshotHistory: true,
      includeUnificationData: true,
      includeOrchestrationState: true,
      includeCrossplatformData: true,
      format: 'puppet_master_merge'
    });
  }
  
  async resolveStateConflicts(platformStates, mergeSession) {
    console.log('⚔️ Detecting and resolving state conflicts...');
    
    const conflictDetector = new StateConflictDetector();
    const conflicts = await conflictDetector.detectConflicts(platformStates.states);
    
    mergeSession.conflicts = conflicts;
    console.log(`🔍 Detected ${conflicts.length} state conflicts`);
    
    const resolver = new ConflictResolver(this.config.conflictResolutionStrategy);
    const resolutions = [];
    
    for (const conflict of conflicts) {
      console.log(`⚖️ Resolving conflict: ${conflict.type} (${conflict.description})`);
      
      const resolution = await resolver.resolve(conflict, platformStates.states);
      resolutions.push(resolution);
      
      console.log(`✅ Conflict resolved: ${resolution.strategy} - ${resolution.description}`);
    }
    
    mergeSession.resolutions = resolutions;
    
    // Apply resolutions to create unified state
    const stateUnifier = new StateUnifier();
    const unifiedState = await stateUnifier.unify(platformStates.states, resolutions);
    
    return {
      originalStates: platformStates.states,
      conflicts,
      resolutions,
      unifiedState,
      unificationTime: Date.now()
    };
  }
  
  async createUnifiedSnapshot(resolvedState, mergeSession) {
    console.log('🌟 Creating unified snapshot...');
    
    const snapshot = {
      id: this.generateSnapshotId(),
      type: 'unified_active_merge',
      timestamp: Date.now(),
      
      // Puppet master metadata
      puppetMaster: {
        mergeId: mergeSession.id,
        instanceId: mergeSession.instanceId,
        mergeStrategy: this.config.conflictResolutionStrategy,
        mergeDuration: Date.now() - mergeSession.startTime
      },
      
      // Unified game state
      gameState: {
        agents: this.extractUnifiedAgents(resolvedState.unifiedState),
        rituals: this.extractUnifiedRituals(resolvedState.unifiedState),
        vibes: this.extractUnifiedVibes(resolvedState.unifiedState),
        autonomousOperations: this.extractAutonomousState(resolvedState.unifiedState)
      },
      
      // Platform-specific states (preserved for reconstruction)
      platformStates: {
        surface: resolvedState.originalStates.surface,
        runtime: resolvedState.originalStates.runtime,
        protocol: resolvedState.originalStates.protocol,
        mirror: resolvedState.originalStates.mirror
      },
      
      // Conflict resolution data
      conflictData: {
        conflicts: resolvedState.conflicts,
        resolutions: resolvedState.resolutions,
        unificationStrategy: 'active_platform_merge'
      },
      
      // Puppet master control interface
      controlInterface: {
        canModifyAgents: true,
        canAlterTimeline: true,
        canForkReality: true,
        canPossessAgents: true,
        reconstructionInstructions: this.generateReconstructionInstructions(resolvedState)
      },
      
      // Export capabilities
      exportCapabilities: {
        canExportToOuterLayer: true,
        canCreateParallelInstances: true,
        canTimeTravel: true,
        compressionRatio: this.calculateCompressionRatio(resolvedState)
      }
    };
    
    console.log(`🌟 Unified snapshot created: ${snapshot.id}`);
    return snapshot;
  }
  
  async resumeAutonomousOperations(instance, mergeSession) {
    console.log('▶️ Resuming autonomous operations...');
    
    // Send resume commands to all platforms
    const resumeCommands = await Promise.allSettled([
      this.sendResumeCommand(instance.surface, 'surface'),
      this.sendResumeCommand(instance.runtime, 'runtime'),
      this.sendResumeCommand(instance.protocol, 'protocol'),
      this.sendResumeCommand(instance.mirror, 'mirror')
    ]);
    
    const resumeResults = {};
    const platforms = ['surface', 'runtime', 'protocol', 'mirror'];
    
    resumeCommands.forEach((result, index) => {
      const platform = platforms[index];
      
      if (result.status === 'fulfilled') {
        resumeResults[platform] = { resumed: true };
        console.log(`✅ ${platform} autonomous operations resumed`);
      } else {
        resumeResults[platform] = { resumed: false, error: result.reason };
        console.error(`❌ Failed to resume ${platform}:`, result.reason);
      }
    });
    
    return resumeResults;
  }
  
  async sendResumeCommand(platform, platformName) {
    return await platform.receiveCommand({
      type: 'RESUME_AUTONOMOUS_OPERATIONS',
      source: 'puppet_master_merge',
      timestamp: Date.now(),
      instructions: {
        resumeFromCheckpoint: true,
        validateStateIntegrity: true,
        reportStatus: true
      }
    });
  }
  
  async emergencyRecovery(instance, mergeSession) {
    console.log('🚨 Initiating emergency recovery...');
    
    // Try to resume all platforms regardless of merge state
    const recoveryPromises = [
      instance.surface.emergencyResume().catch(() => null),
      instance.runtime.emergencyResume().catch(() => null),
      instance.protocol.emergencyResume().catch(() => null),
      instance.mirror.emergencyResume().catch(() => null)
    ];
    
    await Promise.allSettled(recoveryPromises);
    console.log('🚨 Emergency recovery attempted for all platforms');
  }
  
  // Helper methods
  generateMergeId() {
    return `merge_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  generateSnapshotId() {
    return `unified_${Date.now()}_${crypto.randomBytes(12).toString('hex')}`;
  }
  
  extractUnifiedAgents(unifiedState) {
    // Extract and normalize agent states from unified state
    return {
      calRiven: unifiedState.agents?.calRiven || null,
      arty: unifiedState.agents?.arty || null,
      agentZero: unifiedState.agents?.agentZero || null,
      customAgents: unifiedState.agents?.custom || []
    };
  }
  
  extractUnifiedRituals(unifiedState) {
    // Extract ritual history and current ritual state
    return {
      activeRituals: unifiedState.rituals?.active || [],
      ritualHistory: unifiedState.rituals?.history || [],
      ritualTimeline: unifiedState.rituals?.timeline || []
    };
  }
  
  extractUnifiedVibes(unifiedState) {
    // Extract vibe weather and emotional state
    return {
      currentWeather: unifiedState.vibes?.weather || null,
      emotionalState: unifiedState.vibes?.emotional || null,
      vibeHistory: unifiedState.vibes?.history || []
    };
  }
  
  extractAutonomousState(unifiedState) {
    // Extract autonomous operation state
    return {
      autoLoopStatus: unifiedState.autonomous?.autoLoop || null,
      daemonStates: unifiedState.autonomous?.daemons || {},
      autonomyLevel: unifiedState.autonomous?.level || 0
    };
  }
  
  generateReconstructionInstructions(resolvedState) {
    return {
      steps: [
        'Deploy four platform architecture',
        'Load platform-specific states',
        'Apply conflict resolutions',
        'Resume autonomous operations',
        'Verify unified state integrity'
      ],
      requirements: {
        platforms: ['surface', 'runtime', 'protocol', 'mirror'],
        dependencies: ['node.js', 'redis', 'postgresql'],
        timeEstimate: '5-10 minutes'
      }
    };
  }
  
  calculateCompressionRatio(resolvedState) {
    const originalSize = JSON.stringify(resolvedState.originalStates).length;
    const unifiedSize = JSON.stringify(resolvedState.unifiedState).length;
    return originalSize > 0 ? (originalSize - unifiedSize) / originalSize : 0;
  }
  
  // Status and metrics
  getActiveMetrics() {
    return {
      activeMerges: this.activeMerges.size,
      totalMerges: this.mergeHistory.length,
      successfulMerges: this.mergeHistory.filter(m => m.status === 'completed').length,
      averageMergeTime: this.calculateAverageMergeTime(),
      conflictResolutionStats: this.getConflictStats()
    };
  }
  
  calculateAverageMergeTime() {
    const completedMerges = this.mergeHistory.filter(m => m.duration);
    if (completedMerges.length === 0) return 0;
    
    const totalTime = completedMerges.reduce((sum, merge) => sum + merge.duration, 0);
    return totalTime / completedMerges.length;
  }
  
  getConflictStats() {
    const allConflicts = this.mergeHistory.flatMap(m => m.conflicts || []);
    const conflictTypes = {};
    
    allConflicts.forEach(conflict => {
      conflictTypes[conflict.type] = (conflictTypes[conflict.type] || 0) + 1;
    });
    
    return {
      totalConflicts: allConflicts.length,
      conflictTypes,
      resolutionSuccessRate: this.calculateResolutionSuccessRate()
    };
  }
  
  calculateResolutionSuccessRate() {
    const allResolutions = this.mergeHistory.flatMap(m => m.resolutions || []);
    const successfulResolutions = allResolutions.filter(r => r.success);
    
    return allResolutions.length > 0 ? 
      successfulResolutions.length / allResolutions.length : 0;
  }
}

// Conflict detection and resolution classes
class StateConflictDetector {
  async detectConflicts(platformStates) {
    const conflicts = [];
    
    // Agent state conflicts
    const agentConflicts = this.detectAgentConflicts(platformStates);
    conflicts.push(...agentConflicts);
    
    // Timeline conflicts  
    const timelineConflicts = this.detectTimelineConflicts(platformStates);
    conflicts.push(...timelineConflicts);
    
    // Vibe weather conflicts
    const vibeConflicts = this.detectVibeConflicts(platformStates);
    conflicts.push(...vibeConflicts);
    
    // Legal validation conflicts
    const legalConflicts = this.detectLegalConflicts(platformStates);
    conflicts.push(...legalConflicts);
    
    return conflicts;
  }
  
  detectAgentConflicts(platformStates) {
    // Compare agent states between runtime and surface
    const conflicts = [];
    
    const runtimeAgents = platformStates.runtime?.agents || {};
    const surfaceAgents = platformStates.surface?.agentEchoes || {};
    
    for (const agentId of Object.keys(runtimeAgents)) {
      const runtimeState = runtimeAgents[agentId];
      const surfaceState = surfaceAgents[agentId];
      
      if (surfaceState && this.areStatesConflicting(runtimeState, surfaceState)) {
        conflicts.push({
          type: 'AGENT_STATE_MISMATCH',
          agentId,
          description: `Agent ${agentId} has conflicting states between runtime and surface`,
          runtimeState,
          surfaceState,
          severity: 'medium'
        });
      }
    }
    
    return conflicts;
  }
  
  detectTimelineConflicts(platformStates) {
    // Compare ritual timelines between mirror and runtime
    const conflicts = [];
    
    const mirrorTimeline = platformStates.mirror?.ritualTimeline || [];
    const runtimeTimeline = platformStates.runtime?.ritualHistory || [];
    
    if (this.areTimelinesConflicting(mirrorTimeline, runtimeTimeline)) {
      conflicts.push({
        type: 'RITUAL_TIMELINE_DIVERGENCE',
        description: 'Ritual timelines have diverged between mirror and runtime',
        mirrorTimeline,
        runtimeTimeline,
        severity: 'high'
      });
    }
    
    return conflicts;
  }
  
  detectVibeConflicts(platformStates) {
    // Compare vibe weather between surface and mirror
    const conflicts = [];
    
    const surfaceVibe = platformStates.surface?.vibeWeather;
    const mirrorVibe = platformStates.mirror?.aggregatedVibes;
    
    if (surfaceVibe && mirrorVibe && this.areVibesConflicting(surfaceVibe, mirrorVibe)) {
      conflicts.push({
        type: 'VIBE_WEATHER_INCONSISTENCY',
        description: 'Vibe weather is inconsistent between surface and mirror',
        surfaceVibe,
        mirrorVibe,
        severity: 'low'
      });
    }
    
    return conflicts;
  }
  
  detectLegalConflicts(platformStates) {
    // Check for legal validation conflicts
    const conflicts = [];
    
    const protocolValidations = platformStates.protocol?.validations || [];
    const mirrorValidations = platformStates.mirror?.legalChecks || [];
    
    const conflictingValidations = this.findConflictingValidations(
      protocolValidations,
      mirrorValidations
    );
    
    if (conflictingValidations.length > 0) {
      conflicts.push({
        type: 'LEGAL_VALIDATION_CONFLICT',
        description: 'Legal validations conflict between protocol and mirror',
        conflictingValidations,
        severity: 'high'
      });
    }
    
    return conflicts;
  }
  
  areStatesConflicting(state1, state2) {
    // Simple conflict detection - could be more sophisticated
    return JSON.stringify(state1) !== JSON.stringify(state2);
  }
  
  areTimelinesConflicting(timeline1, timeline2) {
    // Check if timelines have diverged significantly
    if (timeline1.length !== timeline2.length) return true;
    
    for (let i = 0; i < timeline1.length; i++) {
      if (timeline1[i].id !== timeline2[i].id) return true;
    }
    
    return false;
  }
  
  areVibesConflicting(vibe1, vibe2) {
    // Check for significant vibe differences
    const threshold = 0.1;
    return Math.abs(vibe1.intensity - vibe2.intensity) > threshold;
  }
  
  findConflictingValidations(validations1, validations2) {
    // Find validations that have different results for same items
    return validations1.filter(v1 => {
      const v2 = validations2.find(v => v.itemId === v1.itemId);
      return v2 && v1.isValid !== v2.isValid;
    });
  }
}

class ConflictResolver {
  constructor(strategy = 'runtime_priority') {
    this.strategy = strategy;
  }
  
  async resolve(conflict, platformStates) {
    console.log(`⚖️ Resolving ${conflict.type} using ${this.strategy} strategy`);
    
    switch (this.strategy) {
      case 'runtime_priority':
        return this.resolveWithRuntimePriority(conflict, platformStates);
      case 'mirror_authority':
        return this.resolveWithMirrorAuthority(conflict, platformStates);
      case 'latest_timestamp':
        return this.resolveWithLatestTimestamp(conflict, platformStates);
      case 'puppet_master_choice':
        return this.resolveWithPuppetMasterChoice(conflict, platformStates);
      default:
        return this.resolveWithRuntimePriority(conflict, platformStates);
    }
  }
  
  resolveWithRuntimePriority(conflict, platformStates) {
    // Runtime wins most conflicts (it's the source of truth for execution)
    const resolution = {
      conflictId: conflict.type,
      strategy: 'runtime_priority',
      description: 'Runtime state takes precedence',
      resolvedValue: null,
      success: true
    };
    
    switch (conflict.type) {
      case 'AGENT_STATE_MISMATCH':
        resolution.resolvedValue = conflict.runtimeState;
        break;
      case 'RITUAL_TIMELINE_DIVERGENCE':
        resolution.resolvedValue = platformStates.runtime.ritualHistory;
        break;
      case 'VIBE_WEATHER_INCONSISTENCY':
        resolution.resolvedValue = platformStates.surface.vibeWeather; // Surface wins vibes
        break;
      case 'LEGAL_VALIDATION_CONFLICT':
        resolution.resolvedValue = platformStates.protocol.validations; // Protocol wins legal
        break;
    }
    
    return resolution;
  }
  
  resolveWithMirrorAuthority(conflict, platformStates) {
    // Mirror wins (it's the unification authority)
    return {
      conflictId: conflict.type,
      strategy: 'mirror_authority',
      description: 'Mirror state takes precedence as unification authority',
      resolvedValue: this.getMirrorValue(conflict, platformStates),
      success: true
    };
  }
  
  resolveWithLatestTimestamp(conflict, platformStates) {
    // Latest timestamp wins
    return {
      conflictId: conflict.type,
      strategy: 'latest_timestamp',
      description: 'Most recent state takes precedence',
      resolvedValue: this.getLatestValue(conflict, platformStates),
      success: true
    };
  }
  
  resolveWithPuppetMasterChoice(conflict, platformStates) {
    // Let puppet master decide (could be interactive)
    return {
      conflictId: conflict.type,
      strategy: 'puppet_master_choice',
      description: 'Puppet master manual resolution required',
      resolvedValue: null,
      success: false,
      requiresManualResolution: true
    };
  }
  
  getMirrorValue(conflict, platformStates) {
    // Extract appropriate value from mirror state
    const mirrorState = platformStates.mirror;
    
    switch (conflict.type) {
      case 'AGENT_STATE_MISMATCH':
        return mirrorState.aggregatedAgentStates?.[conflict.agentId];
      case 'RITUAL_TIMELINE_DIVERGENCE':
        return mirrorState.ritualTimeline;
      case 'VIBE_WEATHER_INCONSISTENCY':
        return mirrorState.aggregatedVibes;
      case 'LEGAL_VALIDATION_CONFLICT':
        return mirrorState.legalChecks;
      default:
        return null;
    }
  }
  
  getLatestValue(conflict, platformStates) {
    // Find the value with the latest timestamp
    // Implementation would compare timestamps and return latest
    return null; // Simplified for brevity
  }
}

class StateUnifier {
  async unify(platformStates, resolutions) {
    console.log('🌟 Unifying platform states with resolutions...');
    
    const unifiedState = {
      agents: this.unifyAgents(platformStates, resolutions),
      rituals: this.unifyRituals(platformStates, resolutions),
      vibes: this.unifyVibes(platformStates, resolutions),
      autonomous: this.unifyAutonomousState(platformStates, resolutions),
      legal: this.unifyLegalState(platformStates, resolutions),
      metadata: {
        unificationTime: Date.now(),
        resolutionsApplied: resolutions.length,
        sourceplatforms: Object.keys(platformStates)
      }
    };
    
    return unifiedState;
  }
  
  unifyAgents(platformStates, resolutions) {
    // Combine agent states, applying conflict resolutions
    const runtimeAgents = platformStates.runtime?.agents || {};
    const agentResolutions = resolutions.filter(r => r.conflictId === 'AGENT_STATE_MISMATCH');
    
    const unifiedAgents = { ...runtimeAgents };
    
    // Apply resolutions
    agentResolutions.forEach(resolution => {
      if (resolution.success && resolution.resolvedValue) {
        // Apply the resolved agent state
        Object.assign(unifiedAgents, resolution.resolvedValue);
      }
    });
    
    return unifiedAgents;
  }
  
  unifyRituals(platformStates, resolutions) {
    // Unify ritual data
    const ritualResolutions = resolutions.filter(r => r.conflictId === 'RITUAL_TIMELINE_DIVERGENCE');
    
    let ritualTimeline = platformStates.mirror?.ritualTimeline || [];
    
    // Apply resolutions
    ritualResolutions.forEach(resolution => {
      if (resolution.success && resolution.resolvedValue) {
        ritualTimeline = resolution.resolvedValue;
      }
    });
    
    return {
      timeline: ritualTimeline,
      active: platformStates.runtime?.activeRituals || [],
      history: platformStates.runtime?.ritualHistory || []
    };
  }
  
  unifyVibes(platformStates, resolutions) {
    // Unify vibe weather data
    const vibeResolutions = resolutions.filter(r => r.conflictId === 'VIBE_WEATHER_INCONSISTENCY');
    
    let vibeWeather = platformStates.surface?.vibeWeather || null;
    
    // Apply resolutions
    vibeResolutions.forEach(resolution => {
      if (resolution.success && resolution.resolvedValue) {
        vibeWeather = resolution.resolvedValue;
      }
    });
    
    return {
      weather: vibeWeather,
      history: platformStates.surface?.vibeHistory || [],
      emotional: platformStates.surface?.emotionalState || null
    };
  }
  
  unifyAutonomousState(platformStates, resolutions) {
    // Unify autonomous operation state
    return {
      level: platformStates.runtime?.autonomousLevel || 0,
      daemons: platformStates.runtime?.daemonStates || {},
      autoLoop: platformStates.runtime?.autoLoopStatus || null,
      operations: platformStates.runtime?.activeOperations || []
    };
  }
  
  unifyLegalState(platformStates, resolutions) {
    // Unify legal validation state
    const legalResolutions = resolutions.filter(r => r.conflictId === 'LEGAL_VALIDATION_CONFLICT');
    
    let validations = platformStates.protocol?.validations || [];
    
    // Apply resolutions
    legalResolutions.forEach(resolution => {
      if (resolution.success && resolution.resolvedValue) {
        validations = resolution.resolvedValue;
      }
    });
    
    return {
      validations,
      compliance: platformStates.protocol?.complianceStatus || null,
      contracts: platformStates.protocol?.contractStates || {}
    };
  }
}

module.exports = { ActivePlatformMerger };