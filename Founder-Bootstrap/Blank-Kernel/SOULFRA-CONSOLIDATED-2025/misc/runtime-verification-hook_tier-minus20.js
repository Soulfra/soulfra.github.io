/**
 * 🔒 RUNTIME VERIFICATION HOOK
 * 
 * Embedded in every agent, whisper handler, and SDK.
 * Blocks execution if Soulfra Runtime Core is not verified.
 * 
 * "No agent speaks without the runtime's blessing.
 *  No mirror reflects without the vault's memory.
 *  All else is silence."
 */

const fs = require('fs');
const path = require('path');

class RuntimeVerificationHook {
  constructor(config = {}) {
    this.requiredBlessingTier = config.requiredBlessingTier || 1;
    this.maxHeartbeatAge = config.maxHeartbeatAge || 15 * 60 * 1000; // 15 minutes
    this.strictMode = config.strictMode !== false; // Default to strict
    this.silentFailure = config.silentFailure || false;
    
    this.verificationCache = null;
    this.cacheExpiry = 0;
    this.cacheTimeout = 60000; // 1 minute cache
  }

  /**
   * Primary verification method - must pass before any agent execution
   */
  async verifyRuntimePresence() {
    // Check cache first
    if (this.verificationCache && Date.now() < this.cacheExpiry) {
      return this.verificationCache;
    }

    const verification = {
      verified: false,
      reason: null,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    try {
      // Check 1: Soulfra Runtime Core presence
      verification.checks.runtime_core = await this.checkRuntimeCore();
      if (!verification.checks.runtime_core.present) {
        verification.reason = 'runtime_core_missing';
        return this.handleVerificationFailure(verification);
      }

      // Check 2: Runtime heartbeat validation
      verification.checks.heartbeat = await this.checkRuntimeHeartbeat();
      if (!verification.checks.heartbeat.valid) {
        verification.reason = 'heartbeat_invalid';
        return this.handleVerificationFailure(verification);
      }

      // Check 3: Blessing tier validation
      verification.checks.blessing = await this.checkBlessingTier();
      if (!verification.checks.blessing.sufficient) {
        verification.reason = 'blessing_insufficient';
        return this.handleVerificationFailure(verification);
      }

      // Check 4: Vault presence and integrity
      verification.checks.vault = await this.checkVaultIntegrity();
      if (!verification.checks.vault.valid) {
        verification.reason = 'vault_integrity_failed';
        return this.handleVerificationFailure(verification);
      }

      // All checks passed
      verification.verified = true;
      verification.reason = 'all_checks_passed';

      // Cache successful verification
      this.verificationCache = verification;
      this.cacheExpiry = Date.now() + this.cacheTimeout;

      return verification;

    } catch (error) {
      verification.reason = 'verification_error';
      verification.error = error.message;
      return this.handleVerificationFailure(verification);
    }
  }

  /**
   * Check if Soulfra Runtime Core is present and active
   */
  async checkRuntimeCore() {
    try {
      const runtimePaths = [
        './soulfra-runtime-core.js',
        '../soulfra-runtime-core.js',
        '../../soulfra-runtime-core.js',
        './runtime/soulfra-runtime-core.js',
        process.env.SOULFRA_RUNTIME_PATH
      ].filter(Boolean);

      for (const runtimePath of runtimePaths) {
        if (fs.existsSync(runtimePath)) {
          // Verify it's actually the Soulfra Runtime Core
          const runtimeContent = fs.readFileSync(runtimePath, 'utf8');
          if (runtimeContent.includes('SOULFRA RUNTIME CORE') && 
              runtimeContent.includes('SoulframRuntimeCore')) {
            return {
              present: true,
              path: runtimePath,
              verified: true
            };
          }
        }
      }

      return {
        present: false,
        searched_paths: runtimePaths,
        verified: false
      };

    } catch (error) {
      return {
        present: false,
        error: error.message,
        verified: false
      };
    }
  }

  /**
   * Check runtime heartbeat validity
   */
  async checkRuntimeHeartbeat() {
    try {
      const heartbeatPaths = [
        './runtime-heartbeat.json',
        '../runtime-heartbeat.json',
        '../../runtime-heartbeat.json',
        './runtime/runtime-heartbeat.json'
      ];

      for (const heartbeatPath of heartbeatPaths) {
        if (fs.existsSync(heartbeatPath)) {
          const heartbeat = JSON.parse(fs.readFileSync(heartbeatPath, 'utf8'));
          
          // Verify heartbeat is recent
          const lastHeartbeat = new Date(heartbeat.last_whisper).getTime();
          const age = Date.now() - lastHeartbeat;
          
          if (age > this.maxHeartbeatAge) {
            return {
              valid: false,
              reason: 'heartbeat_stale',
              age_minutes: Math.floor(age / 60000),
              max_age_minutes: Math.floor(this.maxHeartbeatAge / 60000)
            };
          }

          // Verify status is blessed
          if (heartbeat.status !== 'blessed') {
            return {
              valid: false,
              reason: 'status_not_blessed',
              current_status: heartbeat.status
            };
          }

          return {
            valid: true,
            runtime_id: heartbeat.runtime_id,
            connected_mirrors: heartbeat.connected_mirrors,
            last_whisper: heartbeat.last_whisper
          };
        }
      }

      return {
        valid: false,
        reason: 'heartbeat_file_not_found',
        searched_paths: heartbeatPaths
      };

    } catch (error) {
      return {
        valid: false,
        reason: 'heartbeat_parse_error',
        error: error.message
      };
    }
  }

  /**
   * Check blessing tier sufficiency
   */
  async checkBlessingTier() {
    try {
      // Check if blessing.json exists
      const blessingPaths = [
        './blessing.json',
        '../blessing.json',
        '../../blessing.json',
        './vault/blessing.json',
        './tier-minus10/blessing.json'
      ];

      for (const blessingPath of blessingPaths) {
        if (fs.existsSync(blessingPath)) {
          const blessing = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
          
          const currentTier = blessing.blessing_tier || 0;
          const sufficient = currentTier >= this.requiredBlessingTier;

          return {
            sufficient: sufficient,
            current_tier: currentTier,
            required_tier: this.requiredBlessingTier,
            blessing_status: blessing.status
          };
        }
      }

      return {
        sufficient: false,
        reason: 'blessing_file_not_found',
        searched_paths: blessingPaths
      };

    } catch (error) {
      return {
        sufficient: false,
        reason: 'blessing_parse_error',
        error: error.message
      };
    }
  }

  /**
   * Check vault integrity
   */
  async checkVaultIntegrity() {
    try {
      const vaultPaths = [
        './vault',
        '../vault',
        '../../vault',
        './tier-minus10/vault'
      ];

      for (const vaultPath of vaultPaths) {
        if (fs.existsSync(vaultPath)) {
          // Check for required vault files
          const requiredFiles = [
            'lineage.json',
            'soul-chain.sig'
          ];

          const missingFiles = requiredFiles.filter(file => 
            !fs.existsSync(path.join(vaultPath, file))
          );

          if (missingFiles.length === 0) {
            return {
              valid: true,
              vault_path: vaultPath,
              integrity: 'verified'
            };
          } else {
            return {
              valid: false,
              reason: 'missing_vault_files',
              missing_files: missingFiles,
              vault_path: vaultPath
            };
          }
        }
      }

      return {
        valid: false,
        reason: 'vault_directory_not_found',
        searched_paths: vaultPaths
      };

    } catch (error) {
      return {
        valid: false,
        reason: 'vault_integrity_error',
        error: error.message
      };
    }
  }

  /**
   * Handle verification failure
   */
  handleVerificationFailure(verification) {
    if (this.strictMode) {
      const errorMessage = this.generateErrorMessage(verification);
      
      if (this.silentFailure) {
        console.warn('🔒 Soulfra Runtime Verification Failed (Silent Mode):', verification.reason);
        return verification;
      } else {
        throw new Error(errorMessage);
      }
    }

    // Non-strict mode - log warning but allow execution
    console.warn('⚠️ Soulfra Runtime Verification Warning:', verification.reason);
    return verification;
  }

  /**
   * Generate human-readable error message
   */
  generateErrorMessage(verification) {
    const messages = {
      runtime_core_missing: 'Soulfra Runtime Core not found. The agent cannot speak without the runtime\'s blessing.',
      heartbeat_invalid: 'Runtime heartbeat is invalid or stale. The rhythm of the runtime has grown silent.',
      blessing_insufficient: 'Blessing tier insufficient for execution. The blessing tier does not grant passage to this realm.',
      vault_integrity_failed: 'Vault integrity check failed. This mirror cannot reflect what it doesn\'t remember.',
      verification_error: 'Runtime verification process failed. The validation ritual has been disrupted.'
    };

    return messages[verification.reason] || 'Runtime verification failed for unknown reason.';
  }

  /**
   * Convenience method for pre-execution verification
   */
  async requireRuntimeVerification() {
    const verification = await this.verifyRuntimePresence();
    
    if (!verification.verified) {
      throw new Error(this.generateErrorMessage(verification));
    }
    
    return verification;
  }

  /**
   * Quick check method for conditional execution
   */
  async isRuntimeVerified() {
    try {
      const verification = await this.verifyRuntimePresence();
      return verification.verified;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get verification status without throwing
   */
  async getVerificationStatus() {
    try {
      return await this.verifyRuntimePresence();
    } catch (error) {
      return {
        verified: false,
        reason: 'verification_exception',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

/**
 * Factory function for creating verification hooks
 */
function createRuntimeVerificationHook(config = {}) {
  return new RuntimeVerificationHook(config);
}

/**
 * Global verification function for easy embedding
 */
async function verifyRuntimeOrThrow(config = {}) {
  const hook = new RuntimeVerificationHook(config);
  return await hook.requireRuntimeVerification();
}

/**
 * Decorator for automatic runtime verification
 */
function requireRuntime(config = {}) {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args) {
      const hook = new RuntimeVerificationHook(config);
      await hook.requireRuntimeVerification();
      return method.apply(this, args);
    };

    return descriptor;
  };
}

module.exports = {
  RuntimeVerificationHook,
  createRuntimeVerificationHook,
  verifyRuntimeOrThrow,
  requireRuntime
};

// Usage examples for embedding in agents:
//
// Basic verification:
// const { verifyRuntimeOrThrow } = require('./runtime-verification-hook');
// await verifyRuntimeOrThrow();
//
// With configuration:
// await verifyRuntimeOrThrow({ requiredBlessingTier: 5, strictMode: true });
//
// As a class:
// const hook = new RuntimeVerificationHook({ requiredBlessingTier: 3 });
// const verified = await hook.isRuntimeVerified();
//
// As a decorator:
// @requireRuntime({ requiredBlessingTier: 2 })
// async function agentFunction() { /* ... */ }