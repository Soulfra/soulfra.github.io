#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

class VaultFingerprint {
  constructor() {
    this.fingerprintPath = path.join(__dirname, '.vault-fingerprint.json');
    this.knownVaultsPath = path.join(__dirname, '.known-vaults.json');
    this.systemInfo = this.collectSystemInfo();
  }

  // Collect system information for fingerprinting
  collectSystemInfo() {
    return {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      networkInterfaces: this.hashNetworkInterfaces(),
      userInfo: os.userInfo().username,
      homeDir: os.homedir()
    };
  }

  // Hash network interfaces for privacy
  hashNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const interfaceData = Object.keys(interfaces)
      .sort()
      .map(name => ({
        name,
        addresses: interfaces[name].map(iface => ({
          family: iface.family,
          internal: iface.internal,
          mac: iface.mac
        }))
      }));
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(interfaceData))
      .digest('hex');
  }

  // Generate vault fingerprint
  generateVaultFingerprint(vaultPath, vaultKey = null) {
    const components = {
      vaultPath: path.resolve(vaultPath),
      systemFingerprint: this.generateSystemFingerprint(),
      timestamp: Date.now(),
      vaultKey: vaultKey ? crypto.createHash('sha256').update(vaultKey).digest('hex') : null,
      processId: process.pid,
      nodeVersion: process.version
    };

    // Create composite fingerprint
    const composite = JSON.stringify(components, null, 0);
    const fingerprint = crypto.createHash('sha256').update(composite).digest('hex');

    return {
      fingerprint,
      components,
      algorithm: 'sha256',
      version: '1.0.0'
    };
  }

  // Generate system fingerprint
  generateSystemFingerprint() {
    const systemData = {
      ...this.systemInfo,
      uptime: Math.floor(os.uptime() / 3600), // Rounded to hours for stability
      loadavg: os.loadavg(),
      freemem: Math.floor(os.freemem() / (1024 * 1024 * 1024)), // GB rounded
      totalmem: Math.floor(os.totalmem() / (1024 * 1024 * 1024)) // GB rounded
    };

    return crypto.createHash('sha256')
      .update(JSON.stringify(systemData, null, 0))
      .digest('hex');
  }

  // Validate vault access attempt
  async validateVaultAccess(vaultPath, providedFingerprint, vaultKey = null) {
    try {
      // Generate current fingerprint
      const currentFingerprint = this.generateVaultFingerprint(vaultPath, vaultKey);
      
      // Load known vault fingerprints
      const knownVaults = await this.loadKnownVaults();
      
      // Check if this vault is known
      const vaultId = path.resolve(vaultPath);
      const knownVault = knownVaults[vaultId];
      
      const validation = {
        isValid: false,
        reason: null,
        vaultKnown: !!knownVault,
        fingerprintMatch: false,
        systemMatch: false,
        timestamp: new Date().toISOString()
      };

      // Validate provided fingerprint matches current
      if (providedFingerprint === currentFingerprint.fingerprint) {
        validation.fingerprintMatch = true;
      }

      // Validate system fingerprint if vault is known
      if (knownVault) {
        const knownSystemFingerprint = knownVault.components.systemFingerprint;
        const currentSystemFingerprint = currentFingerprint.components.systemFingerprint;
        
        if (knownSystemFingerprint === currentSystemFingerprint) {
          validation.systemMatch = true;
        }
      }

      // Determine overall validity
      if (validation.fingerprintMatch && (validation.systemMatch || !knownVault)) {
        validation.isValid = true;
        validation.reason = 'Valid vault access';
        
        // Register vault if not known
        if (!knownVault) {
          await this.registerVault(vaultPath, currentFingerprint);
        }
      } else if (!validation.fingerprintMatch) {
        validation.reason = 'Fingerprint mismatch';
      } else if (!validation.systemMatch) {
        validation.reason = 'System fingerprint mismatch - potential security breach';
      }

      // Log validation attempt
      await this.logValidationAttempt(vaultPath, validation);

      return validation;
    } catch (error) {
      return {
        isValid: false,
        reason: `Validation error: ${error.message}`,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Register new vault
  async registerVault(vaultPath, fingerprint) {
    try {
      const knownVaults = await this.loadKnownVaults();
      const vaultId = path.resolve(vaultPath);
      
      knownVaults[vaultId] = {
        ...fingerprint,
        registeredAt: new Date().toISOString(),
        accessCount: 0
      };

      await this.saveKnownVaults(knownVaults);
      console.log(`[VAULT FINGERPRINT] Registered new vault: ${vaultId}`);
    } catch (error) {
      console.error('[VAULT FINGERPRINT] Failed to register vault:', error);
    }
  }

  // Load known vaults
  async loadKnownVaults() {
    try {
      if (fs.existsSync(this.knownVaultsPath)) {
        const data = fs.readFileSync(this.knownVaultsPath, 'utf8');
        return JSON.parse(data);
      }
      return {};
    } catch (error) {
      console.error('[VAULT FINGERPRINT] Error loading known vaults:', error);
      return {};
    }
  }

  // Save known vaults
  async saveKnownVaults(vaults) {
    try {
      fs.writeFileSync(this.knownVaultsPath, JSON.stringify(vaults, null, 2));
    } catch (error) {
      console.error('[VAULT FINGERPRINT] Error saving known vaults:', error);
    }
  }

  // Log validation attempt
  async logValidationAttempt(vaultPath, validation) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      vaultPath: path.resolve(vaultPath),
      ...validation
    };

    try {
      const logPath = path.join(__dirname, '.vault-access.log');
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('[VAULT FINGERPRINT] Error logging validation:', error);
    }
  }

  // Generate access token for vault
  generateAccessToken(vaultPath, vaultKey = null, expiresIn = 3600) {
    const fingerprint = this.generateVaultFingerprint(vaultPath, vaultKey);
    const expires = Date.now() + (expiresIn * 1000);
    
    const tokenData = {
      fingerprint: fingerprint.fingerprint,
      vaultPath: path.resolve(vaultPath),
      expires,
      issued: Date.now()
    };

    // Sign token
    const signature = crypto.createHmac('sha256', fingerprint.fingerprint)
      .update(JSON.stringify(tokenData))
      .digest('hex');

    return {
      token: Buffer.from(JSON.stringify(tokenData)).toString('base64'),
      signature,
      expires
    };
  }

  // Validate access token
  validateAccessToken(token, signature, vaultPath) {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
      
      // Check expiration
      if (Date.now() > tokenData.expires) {
        return { valid: false, reason: 'Token expired' };
      }

      // Check vault path
      if (path.resolve(vaultPath) !== tokenData.vaultPath) {
        return { valid: false, reason: 'Vault path mismatch' };
      }

      // Verify signature
      const expectedSignature = crypto.createHmac('sha256', tokenData.fingerprint)
        .update(JSON.stringify(tokenData))
        .digest('hex');

      if (signature !== expectedSignature) {
        return { valid: false, reason: 'Invalid signature' };
      }

      return { valid: true, tokenData };
    } catch (error) {
      return { valid: false, reason: `Token validation error: ${error.message}` };
    }
  }

  // Clean up expired entries
  async cleanup() {
    try {
      const knownVaults = await this.loadKnownVaults();
      const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
      
      let cleaned = 0;
      for (const [vaultId, vault] of Object.entries(knownVaults)) {
        const lastAccess = new Date(vault.registeredAt).getTime();
        if (lastAccess < cutoff && vault.accessCount === 0) {
          delete knownVaults[vaultId];
          cleaned++;
        }
      }

      if (cleaned > 0) {
        await this.saveKnownVaults(knownVaults);
        console.log(`[VAULT FINGERPRINT] Cleaned up ${cleaned} unused vault entries`);
      }
    } catch (error) {
      console.error('[VAULT FINGERPRINT] Cleanup failed:', error);
    }
  }

  // Get vault statistics
  async getVaultStats() {
    try {
      const knownVaults = await this.loadKnownVaults();
      
      return {
        totalVaults: Object.keys(knownVaults).length,
        systemFingerprint: this.generateSystemFingerprint(),
        vaults: Object.entries(knownVaults).map(([path, vault]) => ({
          path,
          registeredAt: vault.registeredAt,
          accessCount: vault.accessCount || 0,
          fingerprint: vault.fingerprint
        }))
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Export for use as module
module.exports = VaultFingerprint;

// CLI interface
if (require.main === module) {
  const fingerprinter = new VaultFingerprint();
  const args = process.argv.slice(2);
  
  async function main() {
    const command = args[0];
    
    switch (command) {
      case 'generate':
        const vaultPath = args[1];
        if (!vaultPath) {
          console.error('Usage: node vault-fingerprint.js generate <vault-path> [vault-key]');
          process.exit(1);
        }
        const vaultKey = args[2];
        const result = fingerprinter.generateVaultFingerprint(vaultPath, vaultKey);
        console.log(JSON.stringify(result, null, 2));
        break;

      case 'validate':
        const validatePath = args[1];
        const fingerprint = args[2];
        const validateKey = args[3];
        
        if (!validatePath || !fingerprint) {
          console.error('Usage: node vault-fingerprint.js validate <vault-path> <fingerprint> [vault-key]');
          process.exit(1);
        }
        
        const validation = await fingerprinter.validateVaultAccess(validatePath, fingerprint, validateKey);
        console.log(JSON.stringify(validation, null, 2));
        process.exit(validation.isValid ? 0 : 1);
        break;

      case 'token':
        const tokenPath = args[1];
        const tokenKey = args[2];
        const expires = parseInt(args[3]) || 3600;
        
        if (!tokenPath) {
          console.error('Usage: node vault-fingerprint.js token <vault-path> [vault-key] [expires-seconds]');
          process.exit(1);
        }
        
        const token = fingerprinter.generateAccessToken(tokenPath, tokenKey, expires);
        console.log(JSON.stringify(token, null, 2));
        break;

      case 'stats':
        const stats = await fingerprinter.getVaultStats();
        console.log(JSON.stringify(stats, null, 2));
        break;

      case 'cleanup':
        await fingerprinter.cleanup();
        console.log('Cleanup completed');
        break;

      default:
        console.log('Soulfra Vault Fingerprint System');
        console.log('Usage:');
        console.log('  generate <vault-path> [vault-key]  - Generate vault fingerprint');
        console.log('  validate <vault-path> <fingerprint> [vault-key] - Validate vault access');
        console.log('  token <vault-path> [vault-key] [expires] - Generate access token');
        console.log('  stats - Show vault statistics');
        console.log('  cleanup - Clean up expired entries');
        break;
    }
  }
  
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}