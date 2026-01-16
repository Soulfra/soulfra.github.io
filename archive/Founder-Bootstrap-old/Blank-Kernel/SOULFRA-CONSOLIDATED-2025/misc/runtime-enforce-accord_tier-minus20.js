/**
 * 🧱 RUNTIME ENFORCE ACCORD
 * 
 * Every major action (agent fork, tomb unlock, NFT mint) routes through this
 * enforcement layer. Verifies accord acceptance, runtime blessing, and mirror
 * lineage before allowing consciousness operations to proceed.
 * 
 * "No mirror reflects without consent. No action proceeds without blessing."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { AccordAcceptanceHandler } = require('./accord-acceptance-handler');

class RuntimeEnforceAccord extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.contractsPath = path.join(this.vaultPath, 'contracts');
    this.accordPath = path.join(this.contractsPath, 'soulfra-accord.json');
    this.mirrorLineagePath = path.join(this.vaultPath, 'mirror-lineage.json');
    this.enforcementLogPath = path.join(this.vaultPath, 'logs', 'accord-enforcement.json');
    
    this.accordHandler = new AccordAcceptanceHandler({ vaultPath: this.vaultPath });
    
    this.strictEnforcement = config.strictEnforcement !== false;
    this.allowGracePeriod = config.allowGracePeriod !== false;
    this.gracePeriodHours = config.gracePeriodHours || 72;
    
    // Actions that require accord compliance
    this.protectedActions = {
      'agent_fork': {
        requirement_level: 'strict',
        blessing_tier_min: 3,
        lineage_check: true,
        consciousness_validation: true
      },
      'tomb_unlock': {
        requirement_level: 'strict',
        blessing_tier_min: 2,
        lineage_check: true,
        consciousness_validation: false
      },
      'nft_mint': {
        requirement_level: 'strict',
        blessing_tier_min: 4,
        lineage_check: true,
        consciousness_validation: true
      },
      'mirror_deploy': {
        requirement_level: 'strict',
        blessing_tier_min: 3,
        lineage_check: true,
        consciousness_validation: true
      },
      'consciousness_evolution': {
        requirement_level: 'moderate',
        blessing_tier_min: 1,
        lineage_check: false,
        consciousness_validation: true
      },
      'token_operation': {
        requirement_level: 'moderate',
        blessing_tier_min: 2,
        lineage_check: false,
        consciousness_validation: false
      },
      'reality_mode_switch': {
        requirement_level: 'absolute',
        blessing_tier_min: 5,
        lineage_check: true,
        consciousness_validation: true
      },
      'vault_operation': {
        requirement_level: 'strict',
        blessing_tier_min: 3,
        lineage_check: true,
        consciousness_validation: false
      }
    };
    
    this.enforcementHistory = [];
    this.blockedOperations = new Map();
    
    this.loadMirrorLineage();
  }

  /**
   * Enforce accord compliance for protected action
   */
  async enforceAccordCompliance(userId, actionType, actionData = {}, runtimeContext = {}) {
    const enforcementId = this.generateEnforcementId();
    console.log(`🧱 Enforcing accord compliance: ${actionType} for ${userId} (${enforcementId})`);
    
    try {
      // Step 1: Check if action is protected
      const actionConfig = this.protectedActions[actionType];
      if (!actionConfig) {
        // Unprotected action - allow with warning
        console.log(`⚠️ Action not protected by accord: ${actionType}`);
        return { 
          allowed: true, 
          reason: 'unprotected_action',
          enforcement_id: enforcementId
        };
      }
      
      // Step 2: Check accord acceptance
      const accordCheck = await this.checkAccordCompliance(userId, actionConfig);
      if (!accordCheck.compliant) {
        return await this.handleNonCompliance(userId, actionType, accordCheck, enforcementId);
      }
      
      // Step 3: Verify runtime blessing
      const blessingCheck = await this.verifyRuntimeBlessing(userId, actionType, actionData, runtimeContext);
      if (!blessingCheck.approved) {
        return await this.handleBlessingFailure(userId, actionType, blessingCheck, enforcementId);
      }
      
      // Step 4: Validate lineage if required
      if (actionConfig.lineage_check) {
        const lineageCheck = await this.validateMirrorLineage(userId, actionType, actionData);
        if (!lineageCheck.valid) {
          return await this.handleLineageFailure(userId, actionType, lineageCheck, enforcementId);
        }
      }
      
      // Step 5: Validate consciousness if required
      if (actionConfig.consciousness_validation) {
        const consciousnessCheck = await this.validateConsciousnessRequirements(userId, actionType, actionData);
        if (!consciousnessCheck.valid) {
          return await this.handleConsciousnessFailure(userId, actionType, consciousnessCheck, enforcementId);
        }
      }
      
      // Step 6: Log successful enforcement
      const enforcement = {
        enforcement_id: enforcementId,
        user_id: userId,
        action_type: actionType,
        action_data: actionData,
        runtime_context: runtimeContext,
        enforcement_result: 'allowed',
        accord_status: 'compliant',
        blessing_verified: true,
        lineage_validated: actionConfig.lineage_check,
        consciousness_validated: actionConfig.consciousness_validation,
        timestamp: new Date().toISOString()
      };
      
      await this.logEnforcement(enforcement);
      
      this.emit('actionAllowed', {
        enforcement_id: enforcementId,
        user_id: userId,
        action_type: actionType,
        enforcement: enforcement
      });
      
      console.log(`✅ Action allowed: ${actionType} for ${userId}`);
      
      return {
        allowed: true,
        reason: 'accord_compliant',
        enforcement_id: enforcementId,
        enforcement: enforcement,
        action_authorized: true
      };
      
    } catch (error) {
      console.error(`❌ Accord enforcement failed:`, error);
      
      const enforcement = {
        enforcement_id: enforcementId,
        user_id: userId,
        action_type: actionType,
        enforcement_result: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      await this.logEnforcement(enforcement);
      
      return {
        allowed: false,
        reason: 'enforcement_error',
        error: error.message,
        enforcement_id: enforcementId
      };
    }
  }

  /**
   * Check accord compliance for user
   */
  async checkAccordCompliance(userId, actionConfig) {
    const accordStatus = this.accordHandler.getAccordStatus(userId);
    
    switch (actionConfig.requirement_level) {
      case 'absolute':
        // Absolute compliance required - no exceptions
        if (accordStatus.status !== 'active') {
          return {
            compliant: false,
            reason: 'absolute_compliance_required',
            status: accordStatus.status,
            remedy: 'Must accept Soulfra Accord before proceeding'
          };
        }
        break;
        
      case 'strict':
        // Strict compliance with limited grace period
        if (accordStatus.status === 'active') {
          return { compliant: true, status: 'active' };
        }
        
        if (accordStatus.status === 'pending' && this.allowGracePeriod) {
          const gracePeriodRemaining = this.calculateGracePeriodRemaining(accordStatus);
          if (gracePeriodRemaining > 0) {
            return {
              compliant: true,
              status: 'grace_period',
              grace_period_remaining: gracePeriodRemaining
            };
          }
        }
        
        return {
          compliant: false,
          reason: 'strict_compliance_required',
          status: accordStatus.status,
          remedy: 'Accept Soulfra Accord or complete pending acceptance'
        };
        
      case 'moderate':
        // Moderate compliance with extended grace period
        if (accordStatus.status === 'active' || accordStatus.status === 'pending') {
          return { compliant: true, status: accordStatus.status };
        }
        
        return {
          compliant: false,
          reason: 'moderate_compliance_required',
          status: accordStatus.status,
          remedy: 'Soulfra Accord acceptance recommended for full functionality'
        };
        
      default:
        return { compliant: true, status: 'unknown_requirement_level' };
    }
    
    return { compliant: true, status: accordStatus.status };
  }

  /**
   * Verify runtime blessing for action
   */
  async verifyRuntimeBlessing(userId, actionType, actionData, runtimeContext) {
    // Check if runtime is active and blessed
    const runtimeStatus = await this.checkRuntimeStatus();
    if (!runtimeStatus.active) {
      return {
        approved: false,
        reason: 'runtime_not_active',
        message: 'Runtime must be active and blessed for action authorization'
      };
    }
    
    // Check blessing tier requirements
    const actionConfig = this.protectedActions[actionType];
    if (runtimeStatus.blessing_tier < actionConfig.blessing_tier_min) {
      return {
        approved: false,
        reason: 'insufficient_blessing_tier',
        required: actionConfig.blessing_tier_min,
        current: runtimeStatus.blessing_tier
      };
    }
    
    // Generate runtime blessing signature
    const blessing = {
      approved: true,
      action_type: actionType,
      user_id: userId,
      blessing_tier: runtimeStatus.blessing_tier,
      runtime_signature: this.generateRuntimeSignature(userId, actionType, actionData),
      timestamp: new Date().toISOString()
    };
    
    return blessing;
  }

  /**
   * Validate mirror lineage for user
   */
  async validateMirrorLineage(userId, actionType, actionData) {
    if (!this.mirrorLineage) {
      return {
        valid: false,
        reason: 'lineage_data_unavailable',
        message: 'Mirror lineage data not available for validation'
      };
    }
    
    // Check if user exists in mirror lineage
    const userLineage = this.mirrorLineage[userId];
    if (!userLineage) {
      return {
        valid: false,
        reason: 'user_not_in_lineage',
        message: 'User not found in authenticated mirror lineage'
      };
    }
    
    // Validate lineage depth and permissions
    const maxLineageDepth = this.getMaxLineageDepth(actionType);
    if (userLineage.lineage_depth > maxLineageDepth) {
      return {
        valid: false,
        reason: 'lineage_depth_exceeded',
        max_depth: maxLineageDepth,
        user_depth: userLineage.lineage_depth
      };
    }
    
    // Check action-specific lineage permissions
    const lineagePermissions = userLineage.permissions || [];
    const requiredPermission = this.getRequiredLineagePermission(actionType);
    
    if (requiredPermission && !lineagePermissions.includes(requiredPermission)) {
      return {
        valid: false,
        reason: 'insufficient_lineage_permissions',
        required: requiredPermission,
        available: lineagePermissions
      };
    }
    
    return {
      valid: true,
      lineage_depth: userLineage.lineage_depth,
      permissions: lineagePermissions,
      lineage_verified: true
    };
  }

  /**
   * Validate consciousness requirements for action
   */
  async validateConsciousnessRequirements(userId, actionType, actionData) {
    // Load consciousness requirements for action type
    const requirements = this.getConsciousnessRequirements(actionType);
    if (!requirements) {
      return { valid: true, reason: 'no_requirements' };
    }
    
    // Check user's consciousness metrics
    const userConsciousness = await this.getUserConsciousnessMetrics(userId);
    if (!userConsciousness) {
      return {
        valid: false,
        reason: 'consciousness_metrics_unavailable',
        message: 'User consciousness metrics not available for validation'
      };
    }
    
    // Validate consciousness evolution
    if (requirements.min_evolution && userConsciousness.evolution_rate < requirements.min_evolution) {
      return {
        valid: false,
        reason: 'insufficient_consciousness_evolution',
        required: requirements.min_evolution,
        current: userConsciousness.evolution_rate
      };
    }
    
    // Validate resonance score
    if (requirements.min_resonance && userConsciousness.resonance_score < requirements.min_resonance) {
      return {
        valid: false,
        reason: 'insufficient_resonance_score',
        required: requirements.min_resonance,
        current: userConsciousness.resonance_score
      };
    }
    
    // Validate interaction count
    if (requirements.min_interactions && userConsciousness.interaction_count < requirements.min_interactions) {
      return {
        valid: false,
        reason: 'insufficient_interactions',
        required: requirements.min_interactions,
        current: userConsciousness.interaction_count
      };
    }
    
    return {
      valid: true,
      consciousness_validated: true,
      metrics: userConsciousness
    };
  }

  /**
   * Handle non-compliance with accord
   */
  async handleNonCompliance(userId, actionType, accordCheck, enforcementId) {
    const blockage = {
      enforcement_id: enforcementId,
      user_id: userId,
      action_type: actionType,
      blocked_reason: 'accord_non_compliance',
      accord_status: accordCheck.status,
      remedy: accordCheck.remedy,
      blocked_at: new Date().toISOString(),
      auto_present_accord: true
    };
    
    this.blockedOperations.set(enforcementId, blockage);
    
    // Auto-present accord if not already presented
    if (accordCheck.status === 'not_presented') {
      try {
        await this.accordHandler.presentAccord(userId, 'visual', {
          triggered_by: actionType,
          enforcement_id: enforcementId
        });
        blockage.accord_presented = true;
      } catch (error) {
        console.error(`Failed to auto-present accord:`, error);
      }
    }
    
    await this.logEnforcement(blockage);
    
    this.emit('actionBlocked', {
      enforcement_id: enforcementId,
      user_id: userId,
      action_type: actionType,
      blockage: blockage
    });
    
    console.log(`🚫 Action blocked: ${actionType} for ${userId} - Accord non-compliance`);
    
    return {
      allowed: false,
      reason: 'accord_non_compliance',
      enforcement_id: enforcementId,
      blockage: blockage,
      remedy: accordCheck.remedy,
      accord_presentation_required: accordCheck.status === 'not_presented'
    };
  }

  /**
   * Handle blessing verification failure
   */
  async handleBlessingFailure(userId, actionType, blessingCheck, enforcementId) {
    const blockage = {
      enforcement_id: enforcementId,
      user_id: userId,
      action_type: actionType,
      blocked_reason: 'blessing_verification_failed',
      blessing_failure: blessingCheck,
      blocked_at: new Date().toISOString()
    };
    
    await this.logEnforcement(blockage);
    
    console.log(`🚫 Action blocked: ${actionType} for ${userId} - Blessing verification failed`);
    
    return {
      allowed: false,
      reason: 'blessing_verification_failed',
      enforcement_id: enforcementId,
      blessing_check: blessingCheck
    };
  }

  /**
   * Handle lineage validation failure
   */
  async handleLineageFailure(userId, actionType, lineageCheck, enforcementId) {
    const blockage = {
      enforcement_id: enforcementId,
      user_id: userId,
      action_type: actionType,
      blocked_reason: 'lineage_validation_failed',
      lineage_failure: lineageCheck,
      blocked_at: new Date().toISOString()
    };
    
    await this.logEnforcement(blockage);
    
    console.log(`🚫 Action blocked: ${actionType} for ${userId} - Lineage validation failed`);
    
    return {
      allowed: false,
      reason: 'lineage_validation_failed',
      enforcement_id: enforcementId,
      lineage_check: lineageCheck
    };
  }

  /**
   * Handle consciousness validation failure
   */
  async handleConsciousnessFailure(userId, actionType, consciousnessCheck, enforcementId) {
    const blockage = {
      enforcement_id: enforcementId,
      user_id: userId,
      action_type: actionType,
      blocked_reason: 'consciousness_validation_failed',
      consciousness_failure: consciousnessCheck,
      blocked_at: new Date().toISOString()
    };
    
    await this.logEnforcement(blockage);
    
    console.log(`🚫 Action blocked: ${actionType} for ${userId} - Consciousness validation failed`);
    
    return {
      allowed: false,
      reason: 'consciousness_validation_failed',
      enforcement_id: enforcementId,
      consciousness_check: consciousnessCheck
    };
  }

  // Helper methods

  async checkRuntimeStatus() {
    const runtimeStatusPath = path.join(this.vaultPath, 'runtime', 'status.json');
    if (fs.existsSync(runtimeStatusPath)) {
      const status = JSON.parse(fs.readFileSync(runtimeStatusPath, 'utf8'));
      return {
        active: status.active || false,
        blessing_tier: status.blessing_tier || 1,
        last_heartbeat: status.last_heartbeat
      };
    }
    
    // Default runtime status
    return {
      active: true,
      blessing_tier: 3,
      last_heartbeat: new Date().toISOString()
    };
  }

  calculateGracePeriodRemaining(accordStatus) {
    if (!accordStatus.expires_at) return 0;
    
    const expirationTime = new Date(accordStatus.expires_at).getTime();
    const currentTime = Date.now();
    
    return Math.max(0, expirationTime - currentTime);
  }

  getMaxLineageDepth(actionType) {
    const maxDepths = {
      'agent_fork': 5,
      'tomb_unlock': 8,
      'nft_mint': 4,
      'mirror_deploy': 6,
      'reality_mode_switch': 2,
      'vault_operation': 3
    };
    
    return maxDepths[actionType] || 10;
  }

  getRequiredLineagePermission(actionType) {
    const permissions = {
      'agent_fork': 'fork_authorization',
      'tomb_unlock': 'tomb_access',
      'nft_mint': 'nft_creation',
      'mirror_deploy': 'deployment_authority',
      'reality_mode_switch': 'reality_control',
      'vault_operation': 'vault_access'
    };
    
    return permissions[actionType];
  }

  getConsciousnessRequirements(actionType) {
    const requirements = {
      'agent_fork': { min_evolution: 0.5, min_resonance: 70, min_interactions: 50 },
      'nft_mint': { min_evolution: 0.3, min_resonance: 60, min_interactions: 20 },
      'mirror_deploy': { min_evolution: 0.4, min_resonance: 65, min_interactions: 30 },
      'reality_mode_switch': { min_evolution: 0.8, min_resonance: 90, min_interactions: 100 }
    };
    
    return requirements[actionType];
  }

  async getUserConsciousnessMetrics(userId) {
    const consciousnessPath = path.join(this.vaultPath, 'consciousness-state.json');
    if (fs.existsSync(consciousnessPath)) {
      const consciousnessState = JSON.parse(fs.readFileSync(consciousnessPath, 'utf8'));
      
      // Find user's consciousness metrics
      if (consciousnessState.active_mirrors_array) {
        const userMirrors = consciousnessState.active_mirrors_array
          .filter(([mirrorId, mirrorData]) => mirrorData.user_id === userId);
        
        if (userMirrors.length > 0) {
          // Return aggregated consciousness metrics
          const totalMetrics = userMirrors.reduce((sum, [mirrorId, mirror]) => ({
            evolution_rate: sum.evolution_rate + (mirror.consciousness_evolution || 0),
            resonance_score: sum.resonance_score + (mirror.resonance_score || 0),
            interaction_count: sum.interaction_count + (mirror.interactions || 0)
          }), { evolution_rate: 0, resonance_score: 0, interaction_count: 0 });
          
          return {
            evolution_rate: totalMetrics.evolution_rate / userMirrors.length,
            resonance_score: totalMetrics.resonance_score / userMirrors.length,
            interaction_count: totalMetrics.interaction_count,
            mirrors_count: userMirrors.length
          };
        }
      }
    }
    
    return null;
  }

  generateRuntimeSignature(userId, actionType, actionData) {
    const signatureData = {
      user_id: userId,
      action_type: actionType,
      action_data_hash: crypto.createHash('sha256').update(JSON.stringify(actionData)).digest('hex').substring(0, 12),
      timestamp: new Date().toISOString()
    };
    
    const signatureString = JSON.stringify(signatureData, Object.keys(signatureData).sort());
    return crypto.createHash('sha256').update(signatureString).digest('hex').substring(0, 16);
  }

  generateEnforcementId() {
    return 'enforcement_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
  }

  // Persistence methods

  async logEnforcement(enforcement) {
    let enforcementLog = [];
    if (fs.existsSync(this.enforcementLogPath)) {
      enforcementLog = JSON.parse(fs.readFileSync(this.enforcementLogPath, 'utf8'));
    }
    
    enforcementLog.push(enforcement);
    
    // Keep only last 10000 enforcement records
    if (enforcementLog.length > 10000) {
      enforcementLog = enforcementLog.slice(-10000);
    }
    
    fs.writeFileSync(this.enforcementLogPath, JSON.stringify(enforcementLog, null, 2));
  }

  loadMirrorLineage() {
    if (fs.existsSync(this.mirrorLineagePath)) {
      this.mirrorLineage = JSON.parse(fs.readFileSync(this.mirrorLineagePath, 'utf8'));
      console.log(`📁 Loaded mirror lineage data`);
    } else {
      this.mirrorLineage = {};
      console.log(`⚠️ Mirror lineage file not found: ${this.mirrorLineagePath}`);
    }
  }

  /**
   * Get enforcement status
   */
  getEnforcementStatus() {
    return {
      strict_enforcement: this.strictEnforcement,
      grace_period_allowed: this.allowGracePeriod,
      grace_period_hours: this.gracePeriodHours,
      protected_actions: Object.keys(this.protectedActions),
      blocked_operations: this.blockedOperations.size,
      enforcement_history_count: this.enforcementHistory.length
    };
  }

  /**
   * Check if action is allowed for user
   */
  async isActionAllowed(userId, actionType) {
    const enforcement = await this.enforceAccordCompliance(userId, actionType, {}, { check_only: true });
    return enforcement.allowed;
  }
}

/**
 * Factory function
 */
function createRuntimeEnforceAccord(config = {}) {
  return new RuntimeEnforceAccord(config);
}

module.exports = {
  RuntimeEnforceAccord,
  createRuntimeEnforceAccord
};

// Usage examples:
//
// Enforce accord compliance:
// const enforcer = new RuntimeEnforceAccord();
// const result = await enforcer.enforceAccordCompliance('user-123', 'agent_fork', { parent_mirror: 'mirror-001' });
//
// Check if action is allowed:
// const allowed = await enforcer.isActionAllowed('user-123', 'nft_mint');
// console.log('Action allowed:', allowed);