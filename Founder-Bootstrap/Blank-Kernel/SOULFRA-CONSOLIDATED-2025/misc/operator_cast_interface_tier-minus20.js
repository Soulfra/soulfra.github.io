// soulfra-runtime/interfaces/OperatorCastInterface.js
// Enhanced operator interface that operates across all four platform layers
// Maintains whisper-only communication while providing emergency override capabilities

const crypto = require('crypto');
const { EventEmitter } = require('events');
const { CrossPlatformBridge } = require('../bridges/CrossPlatformBridge');
const { PermissionValidator } = require('../security/PermissionValidator');
const { AuditLogger } = require('../logging/AuditLogger');

class OperatorCastInterface extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      whisperMode: config.whisperMode !== false, // Default true
      autonomousOverride: config.autonomousOverride || false,
      emergencyStopEnabled: config.emergencyStopEnabled !== false,
      crossPlatformAccess: config.crossPlatformAccess !== false,
      maxWhisperLength: config.maxWhisperLength || 500,
      whisperCooldown: config.whisperCooldown || 30000, // 30 seconds
      sessionTimeout: config.sessionTimeout || 3600000, // 1 hour
      ...config
    };
    
    // Core components
    this.platformBridge = new CrossPlatformBridge();
    this.permissionValidator = new PermissionValidator();
    this.auditLogger = new AuditLogger();
    
    // State management
    this.operatorSession = null;
    this.lastWhisperTime = null;
    this.whisperHistory = [];
    this.emergencyMode = false;
    this.autonomousMode = true;
    
    // Platform connections
    this.platformConnections = new Map([
      ['surface', { connected: false, lastPing: null }],
      ['runtime', { connected: false, lastPing: null }],
      ['protocol', { connected: false, lastPing: null }],
      ['mirror', { connected: false, lastPing: null }]
    ]);
    
    console.log('🎭 OperatorCastInterface initialized - Whisper mode enabled');
  }
  
  async initializeOperatorSession(operatorId, credentials) {
    console.log(`🔐 Initializing operator session: ${operatorId}`);
    
    try {
      // Validate operator permissions
      const permissions = await this.permissionValidator.validateOperator(operatorId, credentials);
      
      if (!permissions.valid) {
        throw new Error('Invalid operator credentials');
      }
      
      // Create secure session
      this.operatorSession = {
        operatorId,
        sessionId: this.generateSessionId(),
        startTime: Date.now(),
        permissions: permissions.granted,
        lastActivity: Date.now(),
        whisperCount: 0,
        emergencyOverrides: 0
      };
      
      // Initialize platform connections
      await this.initializePlatformConnections();
      
      // Log session start
      await this.auditLogger.logOperatorAction({
        action: 'session_start',
        operatorId,
        sessionId: this.operatorSession.sessionId,
        timestamp: Date.now()
      });
      
      console.log('✅ Operator session initialized');
      this.emit('session_initialized', this.operatorSession);
      
      return {
        success: true,
        sessionId: this.operatorSession.sessionId,
        permissions: permissions.granted,
        whisperMode: this.config.whisperMode
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize operator session:', error);
      await this.auditLogger.logOperatorAction({
        action: 'session_failed',
        operatorId,
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  async whisperToRuntime(message) {
    console.log('👁️ Operator whisper to runtime...');
    
    if (!this.validateWhisperPermissions(message)) {
      throw new Error('Whisper validation failed');
    }
    
    try {
      // Process whisper through bridge
      const whisperResult = await this.platformBridge.sendWhisperToRuntime({
        message: message.content,
        priority: message.priority || 'normal',
        operatorId: this.operatorSession.operatorId,
        sessionId: this.operatorSession.sessionId,
        timestamp: Date.now()
      });
      
      // Log the whisper
      const whisperRecord = {
        id: this.generateWhisperId(),
        timestamp: Date.now(),
        target: 'runtime',
        message: message.content,
        operatorId: this.operatorSession.operatorId,
        response: whisperResult
      };
      
      this.whisperHistory.push(whisperRecord);
      this.operatorSession.whisperCount++;
      this.lastWhisperTime = Date.now();
      
      await this.auditLogger.logOperatorAction({
        action: 'whisper_sent',
        target: 'runtime',
        whisperRecord,
        timestamp: Date.now()
      });
      
      console.log('✅ Whisper delivered to runtime');
      this.emit('whisper_sent', whisperRecord);
      
      return whisperResult;
      
    } catch (error) {
      console.error('❌ Whisper delivery failed:', error);
      await this.auditLogger.logOperatorAction({
        action: 'whisper_failed',
        target: 'runtime',
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  async emergencyOverride(reason, scope = 'all') {
    console.log(`🚨 EMERGENCY OVERRIDE TRIGGERED: ${reason}`);
    
    if (!this.validateEmergencyConditions(reason)) {
      throw new Error('Emergency override conditions not met');
    }
    
    try {
      this.emergencyMode = true;
      this.autonomousMode = false;
      
      const overrideId = this.generateOverrideId();
      const overrideCommand = {
        id: overrideId,
        reason,
        scope,
        operatorId: this.operatorSession.operatorId,
        timestamp: Date.now()
      };
      
      // Notify all platforms based on scope
      const platforms = scope === 'all' ? 
        ['surface', 'runtime', 'protocol', 'mirror'] : 
        Array.isArray(scope) ? scope : [scope];
      
      const overrideResults = {};
      
      for (const platform of platforms) {
        try {
          const result = await this.platformBridge.sendEmergencyOverride(platform, overrideCommand);
          overrideResults[platform] = result;
          console.log(`🛑 Emergency override sent to ${platform}`);
        } catch (error) {
          console.error(`❌ Failed to send override to ${platform}:`, error);
          overrideResults[platform] = { success: false, error: error.message };
        }
      }
      
      // Pause autonomous operations
      await this.pauseAutonomousOperations(reason);
      
      // Log emergency override
      await this.auditLogger.logOperatorAction({
        action: 'emergency_override',
        overrideId,
        reason,
        scope,
        results: overrideResults,
        timestamp: Date.now()
      });
      
      this.operatorSession.emergencyOverrides++;
      
      console.log('🚨 Emergency override complete');
      this.emit('emergency_override', { overrideCommand, results: overrideResults });
      
      return {
        success: true,
        overrideId,
        affectedPlatforms: platforms,
        results: overrideResults
      };
      
    } catch (error) {
      console.error('❌ Emergency override failed:', error);
      await this.auditLogger.logOperatorAction({
        action: 'emergency_override_failed',
        reason,
        error: error.message,
        timestamp: Date.now()
      });
      throw error;
    }
  }
  
  async crossPlatformStatus() {
    console.log('📊 Retrieving cross-platform status...');
    
    try {
      const platformStatuses = {};
      
      for (const [platform, connection] of this.platformConnections.entries()) {
        try {
          const status = await this.platformBridge.getStatus(platform);
          platformStatuses[platform] = {
            ...status,
            connectionStatus: connection.connected ? 'connected' : 'disconnected',
            lastPing: connection.lastPing
          };
        } catch (error) {
          platformStatuses[platform] = {
            status: 'error',
            error: error.message,
            connectionStatus: 'failed',
            lastPing: connection.lastPing
          };
        }
      }
      
      const overallStatus = {
        platforms: platformStatuses,
        operatorSession: this.operatorSession ? {
          operatorId: this.operatorSession.operatorId,
          sessionId: this.operatorSession.sessionId,
          uptime: Date.now() - this.operatorSession.startTime,
          whisperCount: this.operatorSession.whisperCount,
          emergencyOverrides: this.operatorSession.emergencyOverrides
        } : null,
        systemState: {
          emergencyMode: this.emergencyMode,
          autonomousMode: this.autonomousMode,
          whisperMode: this.config.whisperMode,
          totalPlatforms: this.platformConnections.size,
          connectedPlatforms: Array.from(this.platformConnections.values())
            .filter(conn => conn.connected).length
        },
        timestamp: Date.now()
      };
      
      console.log('✅ Cross-platform status retrieved');
      return overallStatus;
      
    } catch (error) {
      console.error('❌ Failed to retrieve cross-platform status:', error);
      throw error;
    }
  }
  
  async pauseAutonomousOperations(reason) {
    console.log(`⏸️ Pausing autonomous operations: ${reason}`);
    
    try {
      // Send pause commands to all platforms
      const pauseResults = {};
      
      for (const platform of ['runtime', 'mirror']) { // Only platforms with autonomous operations
        try {
          const result = await this.platformBridge.sendCommand(platform, {
            command: 'pause_autonomous_operations',
            reason,
            operatorId: this.operatorSession.operatorId,
            timestamp: Date.now()
          });
          pauseResults[platform] = result;
        } catch (error) {
          pauseResults[platform] = { success: false, error: error.message };
        }
      }
      
      this.autonomousMode = false;
      
      await this.auditLogger.logOperatorAction({
        action: 'autonomous_operations_paused',
        reason,
        results: pauseResults,
        timestamp: Date.now()
      });
      
      console.log('⏸️ Autonomous operations paused');
      this.emit('autonomous_paused', { reason, results: pauseResults });
      
      return pauseResults;
      
    } catch (error) {
      console.error('❌ Failed to pause autonomous operations:', error);
      throw error;
    }
  }
  
  async resumeAutonomousOperations() {
    console.log('▶️ Resuming autonomous operations...');
    
    try {
      // Send resume commands to all platforms
      const resumeResults = {};
      
      for (const platform of ['runtime', 'mirror']) {
        try {
          const result = await this.platformBridge.sendCommand(platform, {
            command: 'resume_autonomous_operations',
            operatorId: this.operatorSession.operatorId,
            timestamp: Date.now()
          });
          resumeResults[platform] = result;
        } catch (error) {
          resumeResults[platform] = { success: false, error: error.message };
        }
      }
      
      this.autonomousMode = true;
      this.emergencyMode = false;
      
      await this.auditLogger.logOperatorAction({
        action: 'autonomous_operations_resumed',
        results: resumeResults,
        timestamp: Date.now()
      });
      
      console.log('▶️ Autonomous operations resumed');
      this.emit('autonomous_resumed', { results: resumeResults });
      
      return resumeResults;
      
    } catch (error) {
      console.error('❌ Failed to resume autonomous operations:', error);
      throw error;
    }
  }
  
  async initializePlatformConnections() {
    console.log('🔌 Initializing platform connections...');
    
    for (const [platform, connection] of this.platformConnections.entries()) {
      try {
        const pingResult = await this.platformBridge.ping(platform);
        connection.connected = pingResult.success;
        connection.lastPing = Date.now();
        
        if (connection.connected) {
          console.log(`✅ Connected to ${platform}`);
        } else {
          console.warn(`⚠️ Failed to connect to ${platform}`);
        }
      } catch (error) {
        console.error(`❌ Error connecting to ${platform}:`, error);
        connection.connected = false;
        connection.lastPing = Date.now();
      }
    }
  }
  
  // Validation methods
  validateWhisperPermissions(message) {
    if (!this.operatorSession) {
      console.error('❌ No active operator session');
      return false;
    }
    
    if (!this.config.whisperMode) {
      console.error('❌ Whisper mode disabled');
      return false;
    }
    
    if (this.lastWhisperTime && (Date.now() - this.lastWhisperTime) < this.config.whisperCooldown) {
      console.error('❌ Whisper cooldown active');
      return false;
    }
    
    if (message.content && message.content.length > this.config.maxWhisperLength) {
      console.error('❌ Whisper too long');
      return false;
    }
    
    return true;
  }
  
  validateEmergencyConditions(reason) {
    if (!this.operatorSession) {
      console.error('❌ No active operator session for emergency override');
      return false;
    }
    
    if (!this.config.emergencyStopEnabled) {
      console.error('❌ Emergency stop disabled');
      return false;
    }
    
    if (!this.operatorSession.permissions.emergencyOverride) {
      console.error('❌ Operator lacks emergency override permissions');
      return false;
    }
    
    if (!reason || reason.trim().length === 0) {
      console.error('❌ Emergency override requires reason');
      return false;
    }
    
    return true;
  }
  
  // Helper methods
  generateSessionId() {
    return `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }
  
  generateWhisperId() {
    return `whisper_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateOverrideId() {
    return `override_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }
  
  // Status and metrics
  getInterfaceStatus() {
    return {
      config: this.config,
      operatorSession: this.operatorSession,
      emergencyMode: this.emergencyMode,
      autonomousMode: this.autonomousMode,
      platformConnections: Object.fromEntries(this.platformConnections),
      whisperHistory: this.whisperHistory.slice(-10), // Last 10 whispers
      lastWhisperTime: this.lastWhisperTime,
      uptime: this.operatorSession ? Date.now() - this.operatorSession.startTime : 0
    };
  }
  
  async getDetailedReport() {
    const status = this.getInterfaceStatus();
    const platformStatus = await this.crossPlatformStatus().catch(() => null);
    
    return {
      interface: status,
      platforms: platformStatus,
      audit: {
        recentActions: await this.auditLogger.getRecentActions(20),
        sessionSummary: this.operatorSession ? {
          totalWhispers: this.operatorSession.whisperCount,
          totalOverrides: this.operatorSession.emergencyOverrides,
          sessionDuration: Date.now() - this.operatorSession.startTime
        } : null
      },
      health: {
        allPlatformsConnected: Array.from(this.platformConnections.values()).every(conn => conn.connected),
        emergencySystemReady: this.config.emergencyStopEnabled && this.operatorSession,
        whisperSystemReady: this.config.whisperMode && this.operatorSession,
        lastHealthCheck: Date.now()
      }
    };
  }
}

module.exports = { OperatorCastInterface };