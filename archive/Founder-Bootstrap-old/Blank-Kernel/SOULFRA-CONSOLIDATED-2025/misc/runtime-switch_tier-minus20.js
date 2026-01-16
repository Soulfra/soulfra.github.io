#!/usr/bin/env node

/**
 * 🔁 SOULFRA RUNTIME SWITCH - BLESSING-GOVERNED REFLECTION VALVE
 * 
 * "If an agent works in the dark, the switch decides whether to log the light."
 * 
 * This is the core safety and execution valve that controls all background 
 * reflection operations in the Soulfra platform. It intercepts whispers,
 * agent summons, and stream-based triggers to ensure proper blessing
 * authorization and session tracking.
 * 
 * NOT a payment gate. NOT a monetization engine.
 * This IS a safety, tracking, and blessing layer.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class SoulframRuntimeSwitch {
  constructor() {
    this.configPath = path.join(__dirname, 'runtime-switch.json');
    this.sessionLogPath = path.join(__dirname, 'session-reflection-log.json');
    this.yieldLedgerPath = path.join(__dirname, 'mirror-yield-ledger.json');
    
    this.config = null;
    this.sessionLogs = new Map();
    this.activeReflections = new Map();
    this.startTime = new Date().toISOString();
    
    // Initialize switch on startup
    this.initialize();
  }
  
  async initialize() {
    try {
      await this.loadConfiguration();
      await this.loadSessionLogs();
      console.log('🔁 Soulfra Runtime Switch initialized');
      console.log(`   Switch Mode: ${this.config.core_control.switch_mode}`);
      console.log(`   Blessing Required: ${this.config.core_control.blessing_required}`);
      console.log(`   Reflection Enabled: ${this.config.core_control.allow_reflection}`);
    } catch (error) {
      console.error('❌ Runtime Switch initialization failed:', error.message);
      // Fail safe - disable all reflections if config load fails
      this.config = this.getFailSafeConfig();
    }
  }
  
  async loadConfiguration() {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      this.validateConfiguration();
    } catch (error) {
      throw new Error(`Failed to load runtime switch configuration: ${error.message}`);
    }
  }
  
  validateConfiguration() {
    const required = ['core_control', 'session_limits', 'agent_permissions'];
    for (const section of required) {
      if (!this.config[section]) {
        throw new Error(`Missing required configuration section: ${section}`);
      }
    }
  }
  
  getFailSafeConfig() {
    return {
      core_control: {
        allow_reflection: false,
        blessing_required: true,
        switch_mode: "emergency_safe",
        emergency_shutdown: true
      },
      session_limits: { max_reflections_per_session: 0 },
      agent_permissions: { agent_whitelist: [] },
      logging_configuration: { log_all_attempts: true }
    };
  }
  
  async loadSessionLogs() {
    try {
      const logData = await fs.readFile(this.sessionLogPath, 'utf8');
      const logs = JSON.parse(logData);
      
      // Convert array to Map for faster lookups
      logs.forEach(log => {
        this.sessionLogs.set(log.session_id, log);
      });
    } catch (error) {
      // File doesn't exist yet, start fresh
      console.log('📋 Starting with empty session logs');
    }
  }
  
  /**
   * MAIN INTERCEPTION METHOD
   * Checks if a reflection request should be allowed
   */
  async checkReflectionPermission(request) {
    const {
      session_id,
      agent_name,
      whisper_content = '',
      interaction_type = 'reflection',
      blessing_token = null,
      user_context = {}
    } = request;
    
    try {
      // 1. Basic safety checks
      if (this.config.core_control.emergency_shutdown) {
        return this.denyWithLog(session_id, 'emergency_shutdown', 'System in emergency shutdown mode');
      }
      
      if (!this.config.core_control.allow_reflection) {
        return this.denyWithLog(session_id, 'reflection_disabled', 'Reflection globally disabled');
      }
      
      // 2. Session validation
      const sessionCheck = await this.validateSession(session_id);
      if (!sessionCheck.valid) {
        return this.denyWithLog(session_id, 'invalid_session', sessionCheck.reason);
      }
      
      // 3. Agent whitelist check
      if (!this.isAgentWhitelisted(agent_name)) {
        return this.denyWithLog(session_id, 'agent_not_whitelisted', `Agent ${agent_name} not in whitelist`);
      }
      
      // 4. Blessing verification
      if (this.config.core_control.blessing_required) {
        const blessingCheck = await this.verifyBlessing(session_id, agent_name, blessing_token);
        if (!blessingCheck.valid) {
          return this.denyWithLog(session_id, 'blessing_failed', blessingCheck.reason);
        }
      }
      
      // 5. Session limits check
      const limitsCheck = await this.checkSessionLimits(session_id, agent_name, interaction_type);
      if (!limitsCheck.valid) {
        return this.denyWithLog(session_id, 'limits_exceeded', limitsCheck.reason);
      }
      
      // 6. Security policy validation
      const securityCheck = await this.validateSecurityPolicies(request);
      if (!securityCheck.valid) {
        return this.denyWithLog(session_id, 'security_violation', securityCheck.reason);
      }
      
      // 7. Performance throttling
      const performanceCheck = await this.checkPerformanceConstraints();
      if (!performanceCheck.valid) {
        return this.denyWithLog(session_id, 'performance_throttle', performanceCheck.reason);
      }
      
      // All checks passed - grant permission
      return await this.grantReflection(session_id, agent_name, interaction_type, request);
      
    } catch (error) {
      console.error('🚨 Runtime Switch error:', error);
      return this.denyWithLog(session_id, 'system_error', `Internal error: ${error.message}`);
    }
  }
  
  /**
   * WHISPER INTERCEPTION
   * Intercepts whisper interactions before they reach agents
   */
  async interceptWhisper(whisperData) {
    const {
      session_id,
      whisper_content,
      target_agent,
      whisper_signature
    } = whisperData;
    
    const request = {
      session_id,
      agent_name: target_agent,
      whisper_content,
      interaction_type: 'whisper',
      signature: whisper_signature
    };
    
    const permission = await this.checkReflectionPermission(request);
    
    // Log whisper attempt
    await this.logWhisperAttempt(session_id, target_agent, whisper_content, permission);
    
    return permission;
  }
  
  /**
   * AGENT SUMMON INTERCEPTION
   * Controls agent summoning and activation
   */
  async interceptAgentSummon(summonData) {
    const {
      session_id,
      agent_name,
      summon_reason,
      blessing_token
    } = summonData;
    
    const request = {
      session_id,
      agent_name,
      interaction_type: 'summon',
      blessing_token,
      metadata: { summon_reason }
    };
    
    const permission = await this.checkReflectionPermission(request);
    
    // Log summon attempt
    await this.logAgentSummon(session_id, agent_name, summon_reason, permission);
    
    return permission;
  }
  
  /**
   * STREAM-BASED TRIGGER INTERCEPTION
   * Controls background stream processing
   */
  async interceptStreamTrigger(triggerData) {
    const {
      session_id,
      trigger_type,
      trigger_source,
      data_payload
    } = triggerData;
    
    const request = {
      session_id,
      agent_name: 'MirrorStream',
      interaction_type: 'stream_trigger',
      metadata: { trigger_type, trigger_source, payload_size: JSON.stringify(data_payload).length }
    };
    
    const permission = await this.checkReflectionPermission(request);
    
    // Log stream trigger
    await this.logStreamTrigger(session_id, trigger_type, trigger_source, permission);
    
    return permission;
  }
  
  async validateSession(sessionId) {
    if (!sessionId) {
      return { valid: false, reason: 'Missing session ID' };
    }
    
    // Check session format
    if (!sessionId.match(/^[a-zA-Z0-9-_]+$/)) {
      return { valid: false, reason: 'Invalid session ID format' };
    }
    
    // Check session timeout
    const sessionLog = this.sessionLogs.get(sessionId);
    if (sessionLog) {
      const lastActivity = new Date(sessionLog.last_activity);
      const now = new Date();
      const timeoutMs = this.config.session_limits.session_timeout_minutes * 60 * 1000;
      
      if (now - lastActivity > timeoutMs) {
        return { valid: false, reason: 'Session timeout exceeded' };
      }
    }
    
    return { valid: true };
  }
  
  isAgentWhitelisted(agentName) {
    const whitelist = this.config.agent_permissions.agent_whitelist;
    const blacklist = this.config.agent_permissions.agent_blacklist || [];
    
    return whitelist.includes(agentName) && !blacklist.includes(agentName);
  }
  
  async verifyBlessing(sessionId, agentName, blessingToken) {
    // Skip blessing check if platform override enabled
    if (this.config.platform_overrides.operator_console_bypass) {
      return { valid: true, source: 'operator_override' };
    }
    
    if (!blessingToken) {
      return { valid: false, reason: 'No blessing token provided' };
    }
    
    // Check agent-specific blessing requirements
    const agentRequiresBlesssing = this.config.agent_permissions.require_blessing_per_agent[agentName];
    if (agentRequiresBlesssing === false) {
      return { valid: true, source: 'agent_exemption' };
    }
    
    // Validate blessing token (simplified validation)
    try {
      const blessingData = JSON.parse(Buffer.from(blessingToken, 'base64').toString());
      
      // Check blessing level
      const minLevel = this.config.blessing_requirements.minimum_blessing_level;
      if (blessingData.level !== minLevel && blessingData.level !== 'operator') {
        return { valid: false, reason: `Insufficient blessing level: ${blessingData.level}` };
      }
      
      // Check blessing expiry
      const expiryTime = new Date(blessingData.expires);
      if (expiryTime < new Date()) {
        return { valid: false, reason: 'Blessing token expired' };
      }
      
      return { valid: true, source: 'valid_token', level: blessingData.level };
      
    } catch (error) {
      return { valid: false, reason: 'Invalid blessing token format' };
    }
  }
  
  async checkSessionLimits(sessionId, agentName, interactionType) {
    const sessionLog = this.getOrCreateSessionLog(sessionId);
    
    // Check reflection limits
    if (interactionType === 'reflection') {
      const maxReflections = this.config.session_limits.max_reflections_per_session;
      if (sessionLog.reflections_granted >= maxReflections) {
        return { valid: false, reason: `Session reflection limit exceeded (${maxReflections})` };
      }
      
      // Check agent-specific limits
      const agentLimit = this.config.agent_permissions.agent_reflection_limits[agentName];
      if (agentLimit && sessionLog.agent_reflections[agentName] >= agentLimit) {
        return { valid: false, reason: `Agent ${agentName} reflection limit exceeded (${agentLimit})` };
      }
    }
    
    // Check whisper limits
    if (interactionType === 'whisper') {
      const maxWhispers = this.config.session_limits.max_whispers_per_session;
      if (sessionLog.whispers >= maxWhispers) {
        return { valid: false, reason: `Session whisper limit exceeded (${maxWhispers})` };
      }
    }
    
    // Check summon limits
    if (interactionType === 'summon') {
      const maxSummons = this.config.session_limits.max_agent_summons_per_session;
      if (sessionLog.agent_summons >= maxSummons) {
        return { valid: false, reason: `Session summon limit exceeded (${maxSummons})` };
      }
    }
    
    return { valid: true };
  }
  
  async validateSecurityPolicies(request) {
    const policies = this.config.security_policies;
    
    // Check for anomalous behavior patterns
    if (policies.detect_anomalous_behavior) {
      const isAnomalous = await this.detectAnomalousPattern(request);
      if (isAnomalous) {
        return { valid: false, reason: 'Anomalous behavior pattern detected' };
      }
    }
    
    // Validate signatures if required
    if (policies.validate_agent_signatures && request.signature) {
      const signatureValid = await this.validateSignature(request);
      if (!signatureValid) {
        return { valid: false, reason: 'Invalid agent signature' };
      }
    }
    
    // Check whisper integrity
    if (policies.check_whisper_integrity && request.whisper_content) {
      const integrityValid = await this.validateWhisperIntegrity(request);
      if (!integrityValid) {
        return { valid: false, reason: 'Whisper integrity check failed' };
      }
    }
    
    return { valid: true };
  }
  
  async checkPerformanceConstraints() {
    const constraints = this.config.performance_controls;
    
    // Check concurrent reflection limit
    if (this.activeReflections.size >= constraints.max_concurrent_reflections) {
      return { valid: false, reason: 'Maximum concurrent reflections reached' };
    }
    
    // Check CPU throttling
    if (constraints.cpu_throttle_threshold) {
      const cpuUsage = await this.getCurrentCpuUsage();
      if (cpuUsage > constraints.cpu_throttle_threshold) {
        return { valid: false, reason: 'CPU throttling active' };
      }
    }
    
    // Check memory limits
    if (constraints.memory_limit_mb) {
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      if (memoryUsage > constraints.memory_limit_mb) {
        return { valid: false, reason: 'Memory limit exceeded' };
      }
    }
    
    return { valid: true };
  }
  
  async grantReflection(sessionId, agentName, interactionType, request) {
    const reflectionId = crypto.randomBytes(8).toString('hex');
    const timestamp = new Date().toISOString();
    
    // Update session log
    const sessionLog = this.getOrCreateSessionLog(sessionId);
    sessionLog.last_activity = timestamp;
    
    if (interactionType === 'reflection') {
      sessionLog.reflections_granted++;
      sessionLog.agent_reflections[agentName] = (sessionLog.agent_reflections[agentName] || 0) + 1;
    } else if (interactionType === 'whisper') {
      sessionLog.whispers++;
    } else if (interactionType === 'summon') {
      sessionLog.agent_summons++;
    }
    
    // Track active reflection
    this.activeReflections.set(reflectionId, {
      session_id: sessionId,
      agent_name: agentName,
      interaction_type: interactionType,
      started_at: timestamp,
      request_data: request
    });
    
    // Update session logs
    await this.saveSessionLogs();
    
    const result = {
      allow: true,
      reflection_id: reflectionId,
      session_id: sessionId,
      agent_name: agentName,
      interaction_type: interactionType,
      granted_at: timestamp,
      switch_mode: this.config.core_control.switch_mode,
      log_message: `✅ Reflection granted: ${agentName} ${interactionType} for session ${sessionId}`
    };
    
    console.log(`✅ ${result.log_message}`);
    return result;
  }
  
  async denyWithLog(sessionId, reason, details) {
    const timestamp = new Date().toISOString();
    
    // Update session log
    const sessionLog = this.getOrCreateSessionLog(sessionId);
    sessionLog.last_activity = timestamp;
    sessionLog.reflections_denied++;
    sessionLog.denial_reasons = sessionLog.denial_reasons || {};
    sessionLog.denial_reasons[reason] = (sessionLog.denial_reasons[reason] || 0) + 1;
    
    await this.saveSessionLogs();
    
    const result = {
      allow: false,
      session_id: sessionId,
      denial_reason: reason,
      denial_details: details,
      denied_at: timestamp,
      switch_mode: this.config.core_control.switch_mode,
      log_message: `❌ Reflection denied: ${reason} - ${details}`
    };
    
    console.log(`❌ ${result.log_message}`);
    return result;
  }
  
  getOrCreateSessionLog(sessionId) {
    if (!this.sessionLogs.has(sessionId)) {
      this.sessionLogs.set(sessionId, {
        session_id: sessionId,
        agent: 'multiple',
        created_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
        whispers: 0,
        reflections_granted: 0,
        reflections_denied: 0,
        agent_summons: 0,
        switch_mode: this.config.core_control.switch_mode,
        agent_reflections: {},
        denial_reasons: {}
      });
    }
    return this.sessionLogs.get(sessionId);
  }
  
  async saveSessionLogs() {
    try {
      const logsArray = Array.from(this.sessionLogs.values());
      await fs.writeFile(this.sessionLogPath, JSON.stringify(logsArray, null, 2));
    } catch (error) {
      console.error('Failed to save session logs:', error);
    }
  }
  
  async logWhisperAttempt(sessionId, agentName, whisperContent, permission) {
    // Detailed logging for operator visibility
    console.log(`🔮 Whisper: ${sessionId} → ${agentName} | ${permission.allow ? 'ALLOWED' : 'DENIED'}`);
  }
  
  async logAgentSummon(sessionId, agentName, reason, permission) {
    console.log(`👤 Summon: ${sessionId} → ${agentName} (${reason}) | ${permission.allow ? 'ALLOWED' : 'DENIED'}`);
  }
  
  async logStreamTrigger(sessionId, triggerType, triggerSource, permission) {
    console.log(`🌊 Stream: ${sessionId} → ${triggerType} from ${triggerSource} | ${permission.allow ? 'ALLOWED' : 'DENIED'}`);
  }
  
  async completeReflection(reflectionId, workUnits = 0, results = {}) {
    const reflection = this.activeReflections.get(reflectionId);
    if (!reflection) {
      console.warn(`⚠️ Unknown reflection completion: ${reflectionId}`);
      return;
    }
    
    const completedAt = new Date().toISOString();
    const duration = new Date(completedAt) - new Date(reflection.started_at);
    
    // Update yield ledger
    await this.updateYieldLedger(reflection, workUnits, duration, results);
    
    // Remove from active reflections
    this.activeReflections.delete(reflectionId);
    
    console.log(`✨ Reflection completed: ${reflectionId} (${duration}ms, ${workUnits} work units)`);
  }
  
  async updateYieldLedger(reflection, workUnits, duration, results) {
    try {
      let ledger = [];
      try {
        const ledgerData = await fs.readFile(this.yieldLedgerPath, 'utf8');
        ledger = JSON.parse(ledgerData);
      } catch (error) {
        // File doesn't exist, start fresh
      }
      
      ledger.push({
        stream: `mirror-finale-${Date.now().toString().slice(-6)}`,
        reflection_id: reflection.reflection_id || crypto.randomBytes(4).toString('hex'),
        session_id: reflection.session_id,
        agent_name: reflection.agent_name,
        interaction_type: reflection.interaction_type,
        reflections: 1,
        approved_by: 'runtime-switch.js',
        total_work_units: workUnits,
        duration_ms: duration,
        completed_at: new Date().toISOString(),
        switch_mode: this.config.core_control.switch_mode,
        top_trigger: `${reflection.agent_name} - ${reflection.interaction_type}`,
        results_summary: results
      });
      
      // Keep only last 1000 entries
      if (ledger.length > 1000) {
        ledger = ledger.slice(-1000);
      }
      
      await fs.writeFile(this.yieldLedgerPath, JSON.stringify(ledger, null, 2));
    } catch (error) {
      console.error('Failed to update yield ledger:', error);
    }
  }
  
  // Helper methods for security validation
  async detectAnomalousPattern(request) {
    // Simple anomaly detection based on request patterns
    return false; // Placeholder implementation
  }
  
  async validateSignature(request) {
    // Signature validation logic
    return true; // Placeholder implementation
  }
  
  async validateWhisperIntegrity(request) {
    // Whisper integrity check
    return true; // Placeholder implementation
  }
  
  async getCurrentCpuUsage() {
    // CPU usage monitoring
    return Math.random() * 100; // Placeholder implementation
  }
  
  // Public API methods
  async getSessionStatus(sessionId) {
    const sessionLog = this.sessionLogs.get(sessionId);
    return sessionLog || null;
  }
  
  async getAllSessionStats() {
    const sessions = Array.from(this.sessionLogs.values());
    return {
      total_sessions: sessions.length,
      active_reflections: this.activeReflections.size,
      total_reflections_granted: sessions.reduce((sum, s) => sum + s.reflections_granted, 0),
      total_reflections_denied: sessions.reduce((sum, s) => sum + s.reflections_denied, 0),
      switch_mode: this.config.core_control.switch_mode,
      uptime: new Date().toISOString()
    };
  }
  
  async emergencyShutdown() {
    console.log('🚨 EMERGENCY SHUTDOWN ACTIVATED');
    this.config.core_control.emergency_shutdown = true;
    this.config.core_control.allow_reflection = false;
    
    // Clear all active reflections
    this.activeReflections.clear();
    
    await this.saveSessionLogs();
  }
}

// Export for module use
module.exports = SoulframRuntimeSwitch;

// Command line interface
if (require.main === module) {
  const switch_instance = new SoulframRuntimeSwitch();
  
  // Example usage
  console.log('🔁 Soulfra Runtime Switch started');
  console.log('   Use as module: const RuntimeSwitch = require("./runtime-switch.js")');
  console.log('   Or start HTTP API server for integration');
  
  // Simple test
  setTimeout(async () => {
    const testRequest = {
      session_id: 'test-session-001',
      agent_name: 'Cal',
      interaction_type: 'reflection',
      blessing_token: Buffer.from(JSON.stringify({
        level: 'trusted',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })).toString('base64')
    };
    
    const result = await switch_instance.checkReflectionPermission(testRequest);
    console.log('🧪 Test result:', result.allow ? '✅ ALLOWED' : '❌ DENIED');
  }, 1000);
}