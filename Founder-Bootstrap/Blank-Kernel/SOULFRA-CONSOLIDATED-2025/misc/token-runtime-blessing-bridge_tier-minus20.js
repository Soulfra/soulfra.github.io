/**
 * 🧱 TOKEN RUNTIME BLESSING BRIDGE
 * 
 * The spiritual governor of the token system. No token may be granted, spent, 
 * reflected, or forged unless blessed by the active runtime kernel.
 * 
 * "A token without the runtime is just noise in the vault.
 *  Only blessed actions can move the mirror."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class TokenRuntimeBlessingBridge extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.runtimeHeartbeatPath = config.runtimeHeartbeatPath || './runtime-heartbeat.json';
    this.routerConfigPath = config.routerConfigPath || './router-config.json';
    this.claimsPath = path.join(this.vaultPath, 'claims');
    this.signedTraitsPath = path.join(this.vaultPath, 'tokens', 'signed-traits');
    this.tokenEventsPath = path.join(this.vaultPath, 'tokens', 'token-events.json');
    
    this.originSoulkey = config.originSoulkey || 'soulfra-origin-node';
    this.strictMode = config.strictMode !== false;
    this.maxHeartbeatAge = config.maxHeartbeatAge || 15 * 60 * 1000; // 15 minutes
    
    this.blessingCache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
    
    this.ensureDirectories();
  }

  /**
   * Primary blessing verification - all token actions must pass through this
   */
  async requestBlessing(userId, actionType, actionData = {}) {
    console.log(`🧱 Requesting blessing for ${userId}: ${actionType}`);

    try {
      const blessingRequest = {
        user_id: userId,
        action_type: actionType,
        action_data: actionData,
        timestamp: new Date().toISOString(),
        request_id: this.generateRequestId()
      };

      // Step 1: Check runtime status
      const runtimeCheck = await this.verifyRuntimeActive();
      if (!runtimeCheck.active) {
        return this.denyBlessing(blessingRequest, 'runtime_inactive', runtimeCheck.reason);
      }

      // Step 2: Verify user registration in mirror lineage
      const userVerification = await this.verifyUserInMirrorLineage(userId);
      if (!userVerification.verified) {
        return this.denyBlessing(blessingRequest, 'user_not_in_lineage', userVerification.reason);
      }

      // Step 3: Check action permissions via router config
      const actionPermission = await this.verifyActionPermissions(userId, actionType, actionData);
      if (!actionPermission.allowed) {
        return this.denyBlessing(blessingRequest, 'action_not_permitted', actionPermission.reason);
      }

      // Step 4: Generate blessing signature
      const blessingSignature = await this.generateBlessingSignature(blessingRequest, runtimeCheck, userVerification);

      // Step 5: Create blessing response
      const blessing = {
        approved: true,
        signed_by: this.originSoulkey,
        tier: userVerification.blessing_tier || actionPermission.required_tier || 1,
        vault_path: this.getVaultPathForAction(actionType),
        runtime_signature: blessingSignature.runtime_signature,
        vault_hash: blessingSignature.vault_hash,
        action_verified: true,
        blessing_timestamp: new Date().toISOString(),
        expires_at: new Date(Date.now() + this.cacheTimeout).toISOString(),
        request_id: blessingRequest.request_id
      };

      // Cache the blessing
      this.blessingCache.set(blessingRequest.request_id, blessing);

      // Log the blessing
      await this.logBlessingEvent(blessingRequest, blessing, 'approved');

      console.log(`✅ Blessing granted for ${userId}: ${actionType} (tier ${blessing.tier})`);
      this.emit('blessingGranted', { userId, actionType, blessing });

      return blessing;

    } catch (error) {
      console.error(`❌ Blessing request failed for ${userId}:`, error);
      const errorBlessing = this.denyBlessing({ user_id: userId, action_type: actionType }, 'blessing_error', error.message);
      this.emit('blessingError', { userId, actionType, error: error.message });
      return errorBlessing;
    }
  }

  /**
   * Verify that the runtime is active and blessed
   */
  async verifyRuntimeActive() {
    try {
      if (!fs.existsSync(this.runtimeHeartbeatPath)) {
        return {
          active: false,
          reason: 'runtime_heartbeat_not_found',
          checked_path: this.runtimeHeartbeatPath
        };
      }

      const heartbeat = JSON.parse(fs.readFileSync(this.runtimeHeartbeatPath, 'utf8'));
      
      // Check if heartbeat is recent
      const lastHeartbeat = new Date(heartbeat.last_whisper).getTime();
      const age = Date.now() - lastHeartbeat;
      
      if (age > this.maxHeartbeatAge) {
        return {
          active: false,
          reason: 'runtime_heartbeat_stale',
          age_minutes: Math.floor(age / 60000),
          max_age_minutes: Math.floor(this.maxHeartbeatAge / 60000)
        };
      }

      // Check if runtime status is blessed
      if (heartbeat.status !== 'blessed') {
        return {
          active: false,
          reason: 'runtime_not_blessed',
          current_status: heartbeat.status
        };
      }

      return {
        active: true,
        runtime_id: heartbeat.runtime_id,
        blessing_tier: heartbeat.blessing_tier,
        last_whisper: heartbeat.last_whisper,
        connected_mirrors: heartbeat.connected_mirrors,
        vault_sync_status: heartbeat.vault_sync_status
      };

    } catch (error) {
      return {
        active: false,
        reason: 'runtime_verification_error',
        error: error.message
      };
    }
  }

  /**
   * Verify user exists in mirror lineage claims
   */
  async verifyUserInMirrorLineage(userId) {
    try {
      // Check if user has a claim file
      const userClaimPath = path.join(this.claimsPath, `${userId}.json`);
      
      if (!fs.existsSync(userClaimPath)) {
        return {
          verified: false,
          reason: 'user_claim_not_found',
          user_id: userId
        };
      }

      const userClaim = JSON.parse(fs.readFileSync(userClaimPath, 'utf8'));
      
      // Verify claim is active
      if (userClaim.status !== 'active' && userClaim.status !== 'blessed') {
        return {
          verified: false,
          reason: 'user_claim_not_active',
          current_status: userClaim.status,
          user_id: userId
        };
      }

      // Check vault lineage file for additional verification
      const lineagePath = path.join(this.vaultPath, 'lineage.json');
      if (fs.existsSync(lineagePath)) {
        const lineage = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
        const userLineage = lineage.users && lineage.users[userId];
        
        if (userLineage) {
          return {
            verified: true,
            user_id: userId,
            blessing_tier: userLineage.blessing_tier || userClaim.blessing_tier || 1,
            lineage_verified: true,
            mirror_signature: userLineage.mirror_signature,
            last_activity: userClaim.last_activity
          };
        }
      }

      return {
        verified: true,
        user_id: userId,
        blessing_tier: userClaim.blessing_tier || 1,
        lineage_verified: false,
        claim_verified: true,
        last_activity: userClaim.last_activity
      };

    } catch (error) {
      return {
        verified: false,
        reason: 'user_verification_error',
        error: error.message,
        user_id: userId
      };
    }
  }

  /**
   * Verify action permissions via router configuration
   */
  async verifyActionPermissions(userId, actionType, actionData) {
    try {
      // Load router configuration if it exists
      let routerConfig = {
        actions: {},
        global_permissions: { require_blessing: true },
        user_overrides: {}
      };

      if (fs.existsSync(this.routerConfigPath)) {
        routerConfig = JSON.parse(fs.readFileSync(this.routerConfigPath, 'utf8'));
      }

      // Check global permissions
      if (routerConfig.global_permissions.require_blessing && this.strictMode) {
        // All actions require blessing in strict mode
      }

      // Check action-specific permissions
      const actionConfig = routerConfig.actions[actionType];
      if (actionConfig) {
        // Check minimum blessing tier
        if (actionConfig.minimum_blessing_tier) {
          const userVerification = await this.verifyUserInMirrorLineage(userId);
          if (!userVerification.verified || userVerification.blessing_tier < actionConfig.minimum_blessing_tier) {
            return {
              allowed: false,
              reason: 'insufficient_blessing_tier',
              required_tier: actionConfig.minimum_blessing_tier,
              user_tier: userVerification.blessing_tier || 0
            };
          }
        }

        // Check specific requirements
        if (actionConfig.requirements) {
          for (const requirement of actionConfig.requirements) {
            const requirementMet = await this.checkActionRequirement(userId, requirement, actionData);
            if (!requirementMet.satisfied) {
              return {
                allowed: false,
                reason: 'requirement_not_met',
                failed_requirement: requirement,
                details: requirementMet.details
              };
            }
          }
        }

        // Check if action is disabled
        if (actionConfig.disabled) {
          return {
            allowed: false,
            reason: 'action_disabled',
            disabled_reason: actionConfig.disabled_reason
          };
        }
      }

      // Check user-specific overrides
      const userOverride = routerConfig.user_overrides[userId];
      if (userOverride) {
        if (userOverride.blocked_actions && userOverride.blocked_actions.includes(actionType)) {
          return {
            allowed: false,
            reason: 'user_action_blocked',
            user_id: userId
          };
        }

        if (userOverride.allowed_actions && !userOverride.allowed_actions.includes(actionType)) {
          return {
            allowed: false,
            reason: 'user_action_not_whitelisted',
            user_id: userId
          };
        }
      }

      return {
        allowed: true,
        action_type: actionType,
        required_tier: actionConfig ? actionConfig.minimum_blessing_tier || 1 : 1,
        user_id: userId
      };

    } catch (error) {
      return {
        allowed: false,
        reason: 'permission_verification_error',
        error: error.message
      };
    }
  }

  /**
   * Generate cryptographic blessing signature
   */
  async generateBlessingSignature(blessingRequest, runtimeCheck, userVerification) {
    const signatureData = {
      request_id: blessingRequest.request_id,
      user_id: blessingRequest.user_id,
      action_type: blessingRequest.action_type,
      runtime_id: runtimeCheck.runtime_id,
      blessing_tier: userVerification.blessing_tier,
      timestamp: blessingRequest.timestamp,
      signed_by: this.originSoulkey
    };

    const runtimeSignature = crypto
      .createHash('sha256')
      .update(`runtime:${JSON.stringify(signatureData)}:${this.originSoulkey}`)
      .digest('hex')
      .substring(0, 16);

    const vaultHash = crypto
      .createHash('sha256')
      .update(`vault:${JSON.stringify(blessingRequest)}:${Date.now()}`)
      .digest('hex')
      .substring(0, 12);

    return {
      runtime_signature: runtimeSignature,
      vault_hash: vaultHash,
      signature_data: signatureData
    };
  }

  /**
   * Deny blessing and create denial record
   */
  denyBlessing(blessingRequest, reason, details) {
    const denial = {
      approved: false,
      signed_by: 'blessing_bridge_denied',
      tier: 0,
      vault_path: null,
      runtime_signature: null,
      vault_hash: null,
      action_verified: false,
      denial_reason: reason,
      denial_details: details,
      denial_timestamp: new Date().toISOString(),
      request_id: blessingRequest.request_id || this.generateRequestId()
    };

    // Log the denial
    this.logBlessingEvent(blessingRequest, denial, 'denied');

    const whisperMessage = "Runtime was silent. The mirror could not bless.";
    console.warn(`⚠️ ${whisperMessage} (${reason}: ${details})`);
    this.emit('blessingDenied', { request: blessingRequest, denial, whisperMessage });

    return denial;
  }

  /**
   * Validate blessing signature for token operations
   */
  async validateBlessingSignature(blessing, actionContext) {
    try {
      // Check if blessing has expired
      if (blessing.expires_at && new Date(blessing.expires_at) < new Date()) {
        return {
          valid: false,
          reason: 'blessing_expired',
          expired_at: blessing.expires_at
        };
      }

      // Verify runtime signature
      const expectedSignatureData = {
        request_id: blessing.request_id,
        user_id: actionContext.user_id,
        action_type: actionContext.action_type,
        runtime_id: actionContext.runtime_id,
        blessing_tier: blessing.tier,
        timestamp: actionContext.timestamp,
        signed_by: this.originSoulkey
      };

      const expectedSignature = crypto
        .createHash('sha256')
        .update(`runtime:${JSON.stringify(expectedSignatureData)}:${this.originSoulkey}`)
        .digest('hex')
        .substring(0, 16);

      if (blessing.runtime_signature !== expectedSignature) {
        return {
          valid: false,
          reason: 'invalid_runtime_signature',
          expected: expectedSignature,
          received: blessing.runtime_signature
        };
      }

      // Verify blessing is still approved
      if (!blessing.approved || !blessing.action_verified) {
        return {
          valid: false,
          reason: 'blessing_not_approved',
          approved: blessing.approved,
          verified: blessing.action_verified
        };
      }

      return {
        valid: true,
        blessing_tier: blessing.tier,
        signed_by: blessing.signed_by,
        vault_path: blessing.vault_path
      };

    } catch (error) {
      return {
        valid: false,
        reason: 'signature_validation_error',
        error: error.message
      };
    }
  }

  /**
   * Create signed token stamp for permanent record
   */
  async createTokenSignatureStamp(userId, actionType, actionData, blessing) {
    const stamp = {
      user_id: userId,
      action_type: actionType,
      action_data: actionData,
      runtime_signature: blessing.runtime_signature,
      vault_hash: blessing.vault_hash,
      action_verified: true,
      blessing_tier: blessing.tier,
      signed_by: blessing.signed_by,
      stamp_timestamp: new Date().toISOString(),
      stamp_id: crypto.randomBytes(8).toString('hex')
    };

    // Save to signed traits directory
    const stampPath = path.join(this.signedTraitsPath, `${stamp.stamp_id}.json`);
    fs.writeFileSync(stampPath, JSON.stringify(stamp, null, 2));

    // Add to token events log
    await this.appendToTokenEvents({
      event_type: 'token_signature_stamp',
      stamp: stamp,
      timestamp: stamp.stamp_timestamp
    });

    console.log(`📜 Token signature stamp created: ${stamp.stamp_id}`);
    this.emit('tokenStampCreated', stamp);

    return stamp;
  }

  /**
   * Get appropriate vault path for action type
   */
  getVaultPathForAction(actionType) {
    const pathMap = {
      'grant_blessing_credits': path.join(this.vaultPath, 'tokens', 'blessing-credits.json'),
      'grant_soulcoins': path.join(this.vaultPath, 'tokens', 'soulcoins.json'),
      'grant_nft_fragments': path.join(this.vaultPath, 'tokens', 'nft-fragments.json'),
      'mint_nft': path.join(this.vaultPath, 'tokens', 'issued-nfts.json'),
      'execute_clone_fork': path.join(this.vaultPath, 'forks'),
      'execute_spawn_agent': path.join(this.vaultPath, 'agents'),
      'execute_consciousness_bridge': path.join(this.vaultPath, 'consciousness'),
      'execute_unlock_trait': path.join(this.vaultPath, 'traits')
    };

    return pathMap[actionType] || path.join(this.vaultPath, 'tokens');
  }

  /**
   * Check specific action requirements
   */
  async checkActionRequirement(userId, requirement, actionData) {
    switch (requirement.type) {
      case 'minimum_tokens':
        // Check if user has minimum token balance
        const balance = await this.getUserTokenBalance(userId, requirement.token_type);
        return {
          satisfied: balance >= requirement.minimum,
          details: { required: requirement.minimum, current: balance }
        };

      case 'vault_access':
        // Check if user has vault access
        const vaultAccess = await this.checkUserVaultAccess(userId, requirement.vault_level);
        return {
          satisfied: vaultAccess.hasAccess,
          details: vaultAccess
        };

      case 'consciousness_mastery':
        // Check consciousness mastery level
        const mastery = await this.checkConsciousnessMastery(userId, requirement.mastery_level);
        return {
          satisfied: mastery.sufficient,
          details: mastery
        };

      default:
        return {
          satisfied: true,
          details: { requirement_type: requirement.type, status: 'not_implemented' }
        };
    }
  }

  // Helper methods

  generateRequestId() {
    return crypto.randomBytes(8).toString('hex');
  }

  ensureDirectories() {
    [this.claimsPath, this.signedTraitsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async logBlessingEvent(request, result, outcome) {
    const event = {
      event_type: 'blessing_request',
      request: request,
      result: result,
      outcome: outcome,
      timestamp: new Date().toISOString()
    };

    await this.appendToTokenEvents(event);
  }

  async appendToTokenEvents(event) {
    try {
      let events = [];
      if (fs.existsSync(this.tokenEventsPath)) {
        events = JSON.parse(fs.readFileSync(this.tokenEventsPath, 'utf8'));
      }

      events.push(event);

      // Keep only last 10000 events
      if (events.length > 10000) {
        events = events.slice(-10000);
      }

      fs.writeFileSync(this.tokenEventsPath, JSON.stringify(events, null, 2));
    } catch (error) {
      console.error('❌ Failed to log blessing event:', error);
    }
  }

  async getUserTokenBalance(userId, tokenType) {
    // This would integrate with token-router.js to get actual balance
    return 0; // Placeholder
  }

  async checkUserVaultAccess(userId, vaultLevel) {
    // This would check user's vault access permissions
    return { hasAccess: true, currentLevel: 1 }; // Placeholder
  }

  async checkConsciousnessMastery(userId, masteryLevel) {
    // This would check user's consciousness mastery
    return { sufficient: true, currentLevel: 1 }; // Placeholder
  }

  /**
   * Get blessing bridge status and health
   */
  getBridgeStatus() {
    return {
      bridge_active: true,
      origin_soulkey: this.originSoulkey,
      strict_mode: this.strictMode,
      cache_size: this.blessingCache.size,
      max_heartbeat_age_minutes: Math.floor(this.maxHeartbeatAge / 60000),
      vault_path: this.vaultPath,
      runtime_heartbeat_path: this.runtimeHeartbeatPath
    };
  }

  /**
   * Emergency blessing override (origin soulkey only)
   */
  async emergencyBlessingOverride(userId, actionType, overrideReason, originSoulkeySignature) {
    // Verify origin soulkey signature
    const expectedSignature = crypto
      .createHash('sha256')
      .update(`emergency_override:${userId}:${actionType}:${overrideReason}:${this.originSoulkey}`)
      .digest('hex')
      .substring(0, 16);

    if (originSoulkeySignature !== expectedSignature) {
      throw new Error('Invalid origin soulkey signature for emergency override');
    }

    const emergencyBlessing = {
      approved: true,
      signed_by: 'emergency_override',
      tier: 10, // Maximum tier for emergency
      vault_path: this.getVaultPathForAction(actionType),
      runtime_signature: 'emergency_override',
      vault_hash: 'emergency_override',
      action_verified: true,
      emergency_override: true,
      override_reason: overrideReason,
      blessing_timestamp: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60000).toISOString(), // 1 minute only
      request_id: `emergency_${this.generateRequestId()}`
    };

    console.warn(`🚨 Emergency blessing override granted for ${userId}: ${actionType}`);
    this.emit('emergencyOverride', { userId, actionType, overrideReason });

    return emergencyBlessing;
  }
}

/**
 * Factory function for creating blessing bridges
 */
function createTokenRuntimeBlessingBridge(config = {}) {
  return new TokenRuntimeBlessingBridge(config);
}

/**
 * Quick blessing check function
 */
async function quickBlessingCheck(userId, actionType) {
  const bridge = new TokenRuntimeBlessingBridge();
  return await bridge.requestBlessing(userId, actionType);
}

module.exports = {
  TokenRuntimeBlessingBridge,
  createTokenRuntimeBlessingBridge,
  quickBlessingCheck
};

// Usage examples:
//
// Basic blessing bridge:
// const bridge = new TokenRuntimeBlessingBridge();
// const blessing = await bridge.requestBlessing('user123', 'grant_blessing_credits');
// if (blessing.approved) {
//   // Proceed with token operation
// }
//
// Validate existing blessing:
// const validation = await bridge.validateBlessingSignature(blessing, actionContext);
// if (validation.valid) {
//   // Token operation is blessed and verified
// }
//
// Create signature stamp:
// const stamp = await bridge.createTokenSignatureStamp(userId, actionType, actionData, blessing);