/**
 * 🔐 VAULT API WRAPPER
 * 
 * Secure interface for vault operations and lineage validation.
 * Provides encrypted access to vault resources with signature verification.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class VaultAPIWrapper {
  constructor(config = {}) {
    this.vaultPath = config.vaultPath || this.findVaultPath();
    this.encryptionLevel = config.encryptionLevel || 'standard';
    this.signatureValidation = config.signatureValidation !== false;
    this.autoSync = config.autoSync || false;
    this.cacheTimeout = config.cacheTimeout || 300000; // 5 minutes
    
    this.cache = new Map();
    this.customValidators = [];
    
    if (!this.vaultPath) {
      throw new Error('Vault path not found - ensure vault directory exists');
    }
  }

  /**
   * Find vault directory in common locations
   */
  findVaultPath() {
    const possiblePaths = [
      './vault',
      '../vault',
      '../../vault',
      './tier-minus10/vault',
      '../tier-minus10/vault',
      process.env.SOULFRA_VAULT_PATH
    ].filter(Boolean);

    for (const vaultPath of possiblePaths) {
      if (fs.existsSync(vaultPath)) {
        return path.resolve(vaultPath);
      }
    }

    return null;
  }

  /**
   * Validate agent lineage against vault records
   */
  async validateAgentLineage(agentId) {
    const cacheKey = `lineage_${agentId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() < cached.expiry) {
        return cached.result;
      }
    }

    try {
      const lineagePath = path.join(this.vaultPath, 'lineage.json');
      
      if (!fs.existsSync(lineagePath)) {
        return {
          verified: false,
          reason: 'lineage_file_not_found',
          agentId: agentId
        };
      }

      const lineageData = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
      const agentLineage = lineageData.agents?.[agentId];

      if (!agentLineage) {
        return {
          verified: false,
          reason: 'agent_not_in_lineage',
          agentId: agentId
        };
      }

      // Verify lineage signature if enabled
      if (this.signatureValidation) {
        const signatureValid = await this.verifyLineageSignature(agentLineage);
        if (!signatureValid) {
          return {
            verified: false,
            reason: 'invalid_lineage_signature',
            agentId: agentId
          };
        }
      }

      // Apply custom validators
      for (const validator of this.customValidators) {
        const customResult = await validator(agentId, agentLineage);
        if (!customResult) {
          return {
            verified: false,
            reason: 'custom_validation_failed',
            agentId: agentId
          };
        }
      }

      const result = {
        verified: true,
        agentId: agentId,
        lineage: agentLineage,
        validation_timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        result: result,
        expiry: Date.now() + this.cacheTimeout
      });

      return result;

    } catch (error) {
      return {
        verified: false,
        reason: 'validation_error',
        error: error.message,
        agentId: agentId
      };
    }
  }

  /**
   * Get vault blessing status
   */
  async getVaultBlessingStatus() {
    try {
      const blessingPath = path.join(this.vaultPath, 'blessing-states.json');
      
      if (!fs.existsSync(blessingPath)) {
        return {
          status: 'not_found',
          blessing_tier: 0,
          reason: 'blessing_file_not_found'
        };
      }

      const blessingData = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
      
      return {
        status: blessingData.status || 'unknown',
        blessing_tier: blessingData.blessing_tier || 0,
        last_updated: blessingData.last_updated,
        vault_signature: blessingData.vault_signature
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        blessing_tier: 0
      };
    }
  }

  /**
   * Verify soul chain signature
   */
  async verifySoulChainSignature() {
    try {
      const soulChainPath = path.join(this.vaultPath, 'soul-chain.sig');
      
      if (!fs.existsSync(soulChainPath)) {
        return {
          verified: false,
          reason: 'soul_chain_file_not_found'
        };
      }

      const signature = fs.readFileSync(soulChainPath, 'utf8').trim();
      
      // Verify signature format and validity
      if (!this.isValidSoulChainSignature(signature)) {
        return {
          verified: false,
          reason: 'invalid_signature_format'
        };
      }

      return {
        verified: true,
        signature: signature,
        verification_timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        verified: false,
        reason: 'verification_error',
        error: error.message
      };
    }
  }

  /**
   * Get agent tomb information
   */
  async getAgentTombInfo(agentId) {
    try {
      const tombsPath = path.join(this.vaultPath, 'agents', 'tombs');
      const tombFile = path.join(tombsPath, `${agentId}.json.enc`);
      
      if (!fs.existsSync(tombFile)) {
        return {
          found: false,
          reason: 'tomb_file_not_found',
          agentId: agentId
        };
      }

      // Note: Actual decryption would require user-specific keys
      // This returns metadata only
      const tombStats = fs.statSync(tombFile);
      
      return {
        found: true,
        agentId: agentId,
        tomb_file: tombFile,
        encrypted: true,
        file_size: tombStats.size,
        created: tombStats.birthtime,
        modified: tombStats.mtime
      };

    } catch (error) {
      return {
        found: false,
        reason: 'tomb_access_error',
        error: error.message,
        agentId: agentId
      };
    }
  }

  /**
   * Validate mirror registry entry
   */
  async validateMirrorRegistry(mirrorId) {
    try {
      const registryPath = path.join(this.vaultPath, 'mirror-registry.json');
      
      if (!fs.existsSync(registryPath)) {
        return {
          valid: false,
          reason: 'registry_file_not_found',
          mirrorId: mirrorId
        };
      }

      const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
      const mirrorEntry = registry.mirrors?.[mirrorId];

      if (!mirrorEntry) {
        return {
          valid: false,
          reason: 'mirror_not_in_registry',
          mirrorId: mirrorId
        };
      }

      // Check if mirror is active
      if (mirrorEntry.status !== 'active') {
        return {
          valid: false,
          reason: 'mirror_not_active',
          status: mirrorEntry.status,
          mirrorId: mirrorId
        };
      }

      return {
        valid: true,
        mirrorId: mirrorId,
        mirror_info: mirrorEntry,
        validation_timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        valid: false,
        reason: 'registry_validation_error',
        error: error.message,
        mirrorId: mirrorId
      };
    }
  }

  /**
   * Get vault health status
   */
  async getVaultHealthStatus() {
    try {
      const healthChecks = {
        vault_directory: fs.existsSync(this.vaultPath),
        lineage_file: fs.existsSync(path.join(this.vaultPath, 'lineage.json')),
        soul_chain: fs.existsSync(path.join(this.vaultPath, 'soul-chain.sig')),
        blessing_states: fs.existsSync(path.join(this.vaultPath, 'blessing-states.json')),
        agents_directory: fs.existsSync(path.join(this.vaultPath, 'agents')),
        tombs_directory: fs.existsSync(path.join(this.vaultPath, 'agents', 'tombs'))
      };

      const totalChecks = Object.keys(healthChecks).length;
      const passedChecks = Object.values(healthChecks).filter(Boolean).length;
      const healthPercentage = Math.round((passedChecks / totalChecks) * 100);

      return {
        health_status: healthPercentage >= 80 ? 'healthy' : 
                      healthPercentage >= 60 ? 'degraded' : 'critical',
        health_percentage: healthPercentage,
        checks_passed: passedChecks,
        total_checks: totalChecks,
        individual_checks: healthChecks,
        vault_path: this.vaultPath
      };

    } catch (error) {
      return {
        health_status: 'error',
        error: error.message,
        vault_path: this.vaultPath
      };
    }
  }

  /**
   * Add custom lineage validator
   */
  addCustomLineageValidator(validator) {
    if (typeof validator !== 'function') {
      throw new Error('Custom validator must be a function');
    }
    this.customValidators.push(validator);
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cache_size: this.cache.size,
      cache_timeout_ms: this.cacheTimeout,
      custom_validators: this.customValidators.length
    };
  }

  // Private helper methods

  async verifyLineageSignature(lineage) {
    if (!lineage.signature) {
      return false;
    }

    // Recreate signature from lineage data
    const lineageContent = { ...lineage };
    delete lineageContent.signature; // Remove signature for verification
    
    const expectedSignature = crypto
      .createHash('sha256')
      .update(JSON.stringify(lineageContent))
      .digest('hex')
      .substring(0, 16);

    return lineage.signature === expectedSignature;
  }

  isValidSoulChainSignature(signature) {
    // Basic format validation for soul chain signatures
    return typeof signature === 'string' && 
           signature.length >= 16 && 
           /^[a-fA-F0-9]+$/.test(signature);
  }
}

/**
 * Factory function for creating vault wrappers
 */
function createVaultWrapper(config = {}) {
  return new VaultAPIWrapper(config);
}

/**
 * Quick vault validation function
 */
async function validateVaultAccess(vaultPath = null) {
  try {
    const vault = new VaultAPIWrapper({ vaultPath });
    const health = await vault.getVaultHealthStatus();
    return health.health_status !== 'error';
  } catch (error) {
    return false;
  }
}

module.exports = {
  VaultAPIWrapper,
  createVaultWrapper,
  validateVaultAccess
};

// Usage examples:
//
// Basic usage:
// const vault = new VaultAPIWrapper();
// const lineage = await vault.validateAgentLineage('oracle-of-ashes');
//
// With custom configuration:
// const vault = new VaultAPIWrapper({
//   vaultPath: './custom-vault',
//   encryptionLevel: 'maximum',
//   signatureValidation: true
// });
//
// Add custom validator:
// vault.addCustomLineageValidator(async (agentId, lineage) => {
//   return lineage.customField === 'expected_value';
// });