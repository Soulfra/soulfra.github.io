/**
 * Soulfra Runtime Guard - Fingerprint Enforcement Layer
 * 
 * This module enforces fingerprint authentication before agent execution,
 * implements fallback behaviors for failed authentication, and logs all
 * security-relevant events with cooldown triggers.
 * 
 * @version 1.0.0
 * @author Soulfra Protocol
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class RuntimeGuard extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      fingerprintSimilarityThreshold: 0.85,
      maxFailedAttempts: 3,
      cooldownDuration: 15 * 60 * 1000, // 15 minutes
      gracePeriod: 24 * 60 * 60 * 1000, // 24 hours for new devices
      logPath: options.logPath || './logs/runtime-guard.log',
      fallbackMode: options.fallbackMode || 'restricted',
      ...options
    };
    
    this.activeFingerprints = new Map();
    this.failedAttempts = new Map();
    this.cooldowns = new Map();
    this.securityLog = [];
    
    this.initializeGuard();
  }

  async initializeGuard() {
    try {
      await this.loadSecurityState();
      await this.setupSecurityLogging();
      this.startCooldownCleanup();
      
      this.emit('guard_initialized', { 
        timestamp: Date.now(),
        status: 'ready'
      });
    } catch (error) {
      this.emit('guard_error', {
        type: 'initialization_failed',
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Primary enforcement point - validates fingerprint before agent execution
   */
  async enforceFingerprint(providedFingerprint, executionContext) {
    const enforcementId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      // Step 1: Check for active cooldowns
      if (this.isInCooldown(providedFingerprint)) {
        const cooldownInfo = this.cooldowns.get(providedFingerprint);
        return this.handleCooldownViolation(providedFingerprint, cooldownInfo, enforcementId);
      }

      // Step 2: Validate fingerprint authenticity
      const validation = await this.validateFingerprint(providedFingerprint, executionContext);
      
      if (validation.valid) {
        // Step 3: Successful validation
        return this.handleSuccessfulValidation(providedFingerprint, validation, enforcementId);
      } else {
        // Step 4: Failed validation
        return this.handleFailedValidation(providedFingerprint, validation, enforcementId);
      }
      
    } catch (error) {
      await this.logSecurityEvent({
        type: 'enforcement_error',
        enforcementId,
        fingerprint: this.hashFingerprint(providedFingerprint),
        error: error.message,
        timestamp: Date.now()
      });
      
      return this.getEmergencyFallback(providedFingerprint, error);
    }
  }

  /**
   * Fingerprint validation logic with device characteristics analysis
   */
  async validateFingerprint(providedFingerprint, executionContext) {
    // Generate current device fingerprint from context
    const currentFingerprint = await this.generateCurrentFingerprint(executionContext);
    
    // Calculate similarity between provided and current fingerprints
    const similarity = await this.calculateFingerprintSimilarity(
      providedFingerprint, 
      currentFingerprint
    );
    
    // Check if similarity meets threshold
    const meetsThreshold = similarity >= this.config.fingerprintSimilarityThreshold;
    
    // Additional validation checks
    const additionalChecks = await this.performAdditionalValidation(
      providedFingerprint, 
      executionContext
    );
    
    return {
      valid: meetsThreshold && additionalChecks.passed,
      similarity: similarity,
      threshold: this.config.fingerprintSimilarityThreshold,
      currentFingerprint: currentFingerprint,
      additionalChecks: additionalChecks,
      validation_method: 'device_characteristics_analysis'
    };
  }

  async generateCurrentFingerprint(executionContext) {
    const components = {
      // Device characteristics (stable)
      screenResolution: executionContext.screen?.resolution || 'unknown',
      timezone: executionContext.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: executionContext.language || 'en-US',
      platform: executionContext.platform || process.platform,
      
      // Behavioral patterns (semi-stable)
      interactionPattern: await this.analyzeInteractionPattern(executionContext),
      sessionPattern: await this.analyzeSessionPattern(executionContext),
      
      // Cryptographic elements
      timestamp: Date.now(),
      contextHash: crypto.createHash('sha256')
        .update(JSON.stringify(executionContext.stable_elements || {}))
        .digest('hex')
    };
    
    // Generate deterministic fingerprint
    const fingerprintData = JSON.stringify(components);
    return crypto.createHash('sha256').update(fingerprintData).digest('hex');
  }

  async calculateFingerprintSimilarity(fingerprint1, fingerprint2) {
    // For demonstration - in production, use more sophisticated similarity algorithm
    if (fingerprint1 === fingerprint2) return 1.0;
    
    // Compare character-by-character similarity
    const commonChars = this.countCommonCharacters(fingerprint1, fingerprint2);
    const maxLength = Math.max(fingerprint1.length, fingerprint2.length);
    
    return commonChars / maxLength;
  }

  countCommonCharacters(str1, str2) {
    let common = 0;
    const minLength = Math.min(str1.length, str2.length);
    
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) common++;
    }
    
    return common;
  }

  async performAdditionalValidation(fingerprint, context) {
    const checks = {
      deviceConsistency: await this.checkDeviceConsistency(fingerprint, context),
      behaviorPattern: await this.checkBehaviorPattern(fingerprint, context),
      temporalValidity: await this.checkTemporalValidity(fingerprint, context),
      riskAssessment: await this.assessRiskLevel(fingerprint, context)
    };
    
    const passedChecks = Object.values(checks).filter(check => check.passed).length;
    const totalChecks = Object.keys(checks).length;
    
    return {
      passed: passedChecks >= Math.ceil(totalChecks * 0.75), // 75% of checks must pass
      details: checks,
      score: passedChecks / totalChecks
    };
  }

  /**
   * Success handler - grants access and updates security state
   */
  async handleSuccessfulValidation(fingerprint, validation, enforcementId) {
    // Reset failed attempts counter
    this.failedAttempts.delete(fingerprint);
    
    // Update active fingerprints cache
    this.activeFingerprints.set(fingerprint, {
      lastValidated: Date.now(),
      validationCount: (this.activeFingerprints.get(fingerprint)?.validationCount || 0) + 1,
      similarity: validation.similarity
    });
    
    // Log successful validation
    await this.logSecurityEvent({
      type: 'validation_success',
      enforcementId,
      fingerprint: this.hashFingerprint(fingerprint),
      similarity: validation.similarity,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      access: 'granted',
      fingerprint: fingerprint,
      validation: validation,
      restrictions: [],
      message: 'Fingerprint validation successful'
    };
  }

  /**
   * Failure handler - implements progressive restrictions and cooldowns
   */
  async handleFailedValidation(fingerprint, validation, enforcementId) {
    // Increment failed attempts
    const currentAttempts = (this.failedAttempts.get(fingerprint) || 0) + 1;
    this.failedAttempts.set(fingerprint, currentAttempts);
    
    // Log failed validation
    await this.logSecurityEvent({
      type: 'validation_failed',
      enforcementId,
      fingerprint: this.hashFingerprint(fingerprint),
      attempts: currentAttempts,
      similarity: validation.similarity,
      reason: validation.failureReason || 'similarity_threshold_not_met',
      timestamp: Date.now()
    });
    
    // Apply progressive restrictions
    if (currentAttempts >= this.config.maxFailedAttempts) {
      return this.applyCooldown(fingerprint, currentAttempts, enforcementId);
    } else {
      return this.applyGracefulDegradation(fingerprint, currentAttempts, validation);
    }
  }

  /**
   * Cooldown application - locks out failed fingerprint
   */
  async applyCooldown(fingerprint, attemptCount, enforcementId) {
    const cooldownDuration = this.calculateCooldownDuration(attemptCount);
    const cooldownEnd = Date.now() + cooldownDuration;
    
    this.cooldowns.set(fingerprint, {
      startTime: Date.now(),
      endTime: cooldownEnd,
      attempts: attemptCount,
      enforcementId: enforcementId
    });
    
    // Log cooldown application
    await this.logSecurityEvent({
      type: 'cooldown_applied',
      enforcementId,
      fingerprint: this.hashFingerprint(fingerprint),
      duration: cooldownDuration,
      attempts: attemptCount,
      timestamp: Date.now()
    });
    
    // Emit security alert
    this.emit('security_alert', {
      type: 'fingerprint_cooldown',
      fingerprint: this.hashFingerprint(fingerprint),
      duration: cooldownDuration,
      attempts: attemptCount
    });
    
    return {
      success: false,
      access: 'denied',
      reason: 'cooldown_active',
      cooldownEnd: cooldownEnd,
      remainingTime: cooldownDuration,
      message: `Access denied. Cooldown active for ${Math.ceil(cooldownDuration / 60000)} minutes.`,
      fallback: this.getFallbackOptions(fingerprint)
    };
  }

  calculateCooldownDuration(attemptCount) {
    // Exponential backoff: 15min, 30min, 1hr, 2hr, 4hr...
    const baseMinutes = 15;
    const multiplier = Math.pow(2, attemptCount - this.config.maxFailedAttempts);
    return Math.min(baseMinutes * multiplier * 60 * 1000, 4 * 60 * 60 * 1000); // Max 4 hours
  }

  /**
   * Graceful degradation - provides limited access with restrictions
   */
  async applyGracefulDegradation(fingerprint, attemptCount, validation) {
    const restrictions = this.calculateRestrictions(attemptCount, validation);
    
    await this.logSecurityEvent({
      type: 'graceful_degradation',
      fingerprint: this.hashFingerprint(fingerprint),
      attempts: attemptCount,
      restrictions: restrictions,
      timestamp: Date.now()
    });
    
    return {
      success: true,
      access: 'restricted',
      restrictions: restrictions,
      attemptsRemaining: this.config.maxFailedAttempts - attemptCount,
      message: `Limited access granted. ${this.config.maxFailedAttempts - attemptCount} attempts remaining.`,
      validation: validation
    };
  }

  calculateRestrictions(attemptCount, validation) {
    const restrictions = [];
    
    if (attemptCount >= 1) {
      restrictions.push({
        type: 'feature_limitation',
        description: 'Voice input disabled',
        affected_features: ['voice_input', 'audio_processing']
      });
    }
    
    if (attemptCount >= 2) {
      restrictions.push({
        type: 'rate_limiting',
        description: 'Reduced request rate',
        max_requests_per_minute: 3
      });
      
      restrictions.push({
        type: 'capability_restriction',
        description: 'Advanced features disabled',
        disabled_features: ['agent_creation', 'vault_export', 'experience_sharing']
      });
    }
    
    return restrictions;
  }

  /**
   * Hardcoded fallback behaviors for different failure scenarios
   */
  getEmergencyFallback(fingerprint, error) {
    const fallbackBehaviors = {
      restricted: {
        access: 'local_only',
        features: ['basic_agent_interaction'],
        restrictions: ['no_network_access', 'no_data_storage', 'read_only_mode'],
        message: 'Emergency mode: Local access only with basic features'
      },
      
      offline: {
        access: 'cached_agents_only',
        features: ['cached_agent_interaction'],
        restrictions: ['no_new_agents', 'no_updates', 'no_sync'],
        message: 'Offline mode: Cached agents only'
      },
      
      demo: {
        access: 'demo_mode',
        features: ['demo_agents', 'limited_interaction'],
        restrictions: ['no_persistence', 'session_timeout_5min', 'watermarked_output'],
        message: 'Demo mode: Limited functionality for evaluation'
      },
      
      lockdown: {
        access: 'denied',
        features: [],
        restrictions: ['all_features_disabled'],
        message: 'System lockdown: All features disabled due to security breach'
      }
    };
    
    const fallbackMode = this.config.fallbackMode || 'restricted';
    const fallback = fallbackBehaviors[fallbackMode];
    
    this.logSecurityEvent({
      type: 'emergency_fallback',
      fingerprint: this.hashFingerprint(fingerprint),
      fallback_mode: fallbackMode,
      error: error.message,
      timestamp: Date.now()
    });
    
    return {
      success: false,
      access: fallback.access,
      fallback_mode: fallbackMode,
      features: fallback.features,
      restrictions: fallback.restrictions,
      message: fallback.message,
      error: error.message
    };
  }

  /**
   * Cooldown management and cleanup
   */
  isInCooldown(fingerprint) {
    const cooldown = this.cooldowns.get(fingerprint);
    if (!cooldown) return false;
    
    if (Date.now() >= cooldown.endTime) {
      this.cooldowns.delete(fingerprint);
      return false;
    }
    
    return true;
  }

  handleCooldownViolation(fingerprint, cooldownInfo, enforcementId) {
    const remainingTime = cooldownInfo.endTime - Date.now();
    
    this.logSecurityEvent({
      type: 'cooldown_violation',
      enforcementId,
      fingerprint: this.hashFingerprint(fingerprint),
      remaining_time: remainingTime,
      timestamp: Date.now()
    });
    
    return {
      success: false,
      access: 'denied',
      reason: 'cooldown_active',
      remainingTime: remainingTime,
      cooldownEnd: cooldownInfo.endTime,
      message: `Cooldown active. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`
    };
  }

  startCooldownCleanup() {
    // Clean up expired cooldowns every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [fingerprint, cooldown] of this.cooldowns.entries()) {
        if (now >= cooldown.endTime) {
          this.cooldowns.delete(fingerprint);
          
          this.logSecurityEvent({
            type: 'cooldown_expired',
            fingerprint: this.hashFingerprint(fingerprint),
            duration: now - cooldown.startTime,
            timestamp: now
          });
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Security logging and audit trail
   */
  async logSecurityEvent(event) {
    const logEntry = {
      id: crypto.randomUUID(),
      ...event,
      logged_at: Date.now()
    };
    
    this.securityLog.push(logEntry);
    
    // Write to persistent log file
    try {
      await fs.appendFile(this.config.logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('Failed to write security log:', error);
    }
    
    // Emit security event for external monitoring
    this.emit('security_event', logEntry);
    
    // Trigger alerts for critical events
    if (this.isCriticalEvent(event)) {
      this.emit('security_alert', logEntry);
    }
  }

  isCriticalEvent(event) {
    const criticalEvents = [
      'cooldown_applied',
      'emergency_fallback',
      'multiple_failed_attempts',
      'suspicious_activity'
    ];
    
    return criticalEvents.includes(event.type);
  }

  async setupSecurityLogging() {
    try {
      await fs.mkdir(path.dirname(this.config.logPath), { recursive: true });
      
      // Write initial log entry
      await this.logSecurityEvent({
        type: 'guard_initialized',
        config: {
          similarity_threshold: this.config.fingerprintSimilarityThreshold,
          max_failed_attempts: this.config.maxFailedAttempts,
          cooldown_duration: this.config.cooldownDuration,
          fallback_mode: this.config.fallbackMode
        }
      });
    } catch (error) {
      console.error('Failed to setup security logging:', error);
    }
  }

  /**
   * Utility methods
   */
  hashFingerprint(fingerprint) {
    // Hash fingerprint for logging (privacy preservation)
    return crypto.createHash('sha256').update(fingerprint).digest('hex').slice(0, 16);
  }

  async loadSecurityState() {
    // Load persistent security state (cooldowns, failed attempts, etc.)
    try {
      const statePath = path.join(path.dirname(this.config.logPath), 'security-state.json');
      const stateData = await fs.readFile(statePath, 'utf8');
      const state = JSON.parse(stateData);
      
      // Restore non-expired cooldowns
      const now = Date.now();
      for (const [fingerprint, cooldown] of Object.entries(state.cooldowns || {})) {
        if (cooldown.endTime > now) {
          this.cooldowns.set(fingerprint, cooldown);
        }
      }
      
      // Restore failed attempts (with expiry)
      for (const [fingerprint, data] of Object.entries(state.failedAttempts || {})) {
        if (now - data.lastAttempt < 24 * 60 * 60 * 1000) { // 24 hour expiry
          this.failedAttempts.set(fingerprint, data.count);
        }
      }
    } catch (error) {
      // First run or corrupted state - start fresh
      console.log('Starting with fresh security state');
    }
  }

  async saveSecurityState() {
    const state = {
      cooldowns: Object.fromEntries(this.cooldowns),
      failedAttempts: Object.fromEntries(
        Array.from(this.failedAttempts.entries()).map(([fp, count]) => [
          fp, 
          { count, lastAttempt: Date.now() }
        ])
      ),
      lastSaved: Date.now()
    };
    
    try {
      const statePath = path.join(path.dirname(this.config.logPath), 'security-state.json');
      await fs.writeFile(statePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('Failed to save security state:', error);
    }
  }

  // Additional helper methods for behavioral analysis
  async analyzeInteractionPattern(context) {
    // Analyze user interaction patterns for fingerprint validation
    return crypto.createHash('md5').update(JSON.stringify({
      click_pattern: context.interactions?.clicks || 'default',
      typing_rhythm: context.interactions?.typing || 'default',
      navigation_style: context.interactions?.navigation || 'default'
    })).digest('hex');
  }

  async analyzeSessionPattern(context) {
    // Analyze session patterns for validation
    return crypto.createHash('md5').update(JSON.stringify({
      session_length: context.session?.duration || 0,
      feature_usage: context.session?.features || [],
      interaction_frequency: context.session?.frequency || 'normal'
    })).digest('hex');
  }

  async checkDeviceConsistency(fingerprint, context) {
    // Check if device characteristics are consistent
    const storedDevice = this.activeFingerprints.get(fingerprint);
    if (!storedDevice) return { passed: true, reason: 'new_device' };
    
    // Compare current context with stored device info
    return {
      passed: true, // Simplified for demo
      score: 0.9,
      reason: 'device_characteristics_match'
    };
  }

  async checkBehaviorPattern(fingerprint, context) {
    // Check if behavior pattern matches historical data
    return {
      passed: true, // Simplified for demo
      score: 0.85,
      reason: 'behavior_pattern_consistent'
    };
  }

  async checkTemporalValidity(fingerprint, context) {
    // Check if the request timing makes sense
    const now = Date.now();
    const lastValidation = this.activeFingerprints.get(fingerprint)?.lastValidated;
    
    if (!lastValidation) return { passed: true, reason: 'first_validation' };
    
    const timeDiff = now - lastValidation;
    const suspiciouslyQuick = timeDiff < 1000; // Less than 1 second
    
    return {
      passed: !suspiciouslyQuick,
      score: suspiciouslyQuick ? 0.3 : 0.9,
      reason: suspiciouslyQuick ? 'too_quick_successive_requests' : 'normal_timing'
    };
  }

  async assessRiskLevel(fingerprint, context) {
    // Overall risk assessment
    const riskFactors = {
      new_device: !this.activeFingerprints.has(fingerprint),
      failed_attempts: this.failedAttempts.get(fingerprint) || 0,
      unusual_timing: context.timestamp && this.isUnusualTiming(context.timestamp),
      suspicious_context: this.detectSuspiciousContext(context)
    };
    
    const riskScore = Object.values(riskFactors).filter(Boolean).length / Object.keys(riskFactors).length;
    
    return {
      passed: riskScore < 0.5,
      score: 1 - riskScore,
      factors: riskFactors,
      level: riskScore < 0.25 ? 'low' : riskScore < 0.5 ? 'medium' : 'high'
    };
  }

  isUnusualTiming(timestamp) {
    const hour = new Date(timestamp).getHours();
    return hour < 6 || hour > 23; // Consider very early/late hours as unusual
  }

  detectSuspiciousContext(context) {
    // Detect suspicious context indicators
    return false; // Simplified for demo
  }

  // Cleanup and shutdown
  async shutdown() {
    await this.saveSecurityState();
    this.emit('guard_shutdown', { timestamp: Date.now() });
  }
}

module.exports = RuntimeGuard;

// Example usage:
if (require.main === module) {
  const guard = new RuntimeGuard({
    logPath: './logs/runtime-guard.log',
    fallbackMode: 'restricted'
  });

  // Example enforcement
  guard.enforceFingerprint('sf_example_fingerprint_123', {
    screen: { resolution: '1920x1080' },
    timezone: 'America/New_York',
    language: 'en-US',
    platform: 'darwin',
    timestamp: Date.now()
  }).then(result => {
    console.log('Enforcement result:', result);
  });

  // Security event monitoring
  guard.on('security_alert', (alert) => {
    console.log('SECURITY ALERT:', alert);
  });

  guard.on('guard_error', (error) => {
    console.error('GUARD ERROR:', error);
  });
}