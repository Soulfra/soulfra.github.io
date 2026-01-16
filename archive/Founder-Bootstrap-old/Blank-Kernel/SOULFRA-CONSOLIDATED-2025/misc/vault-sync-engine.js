/**
 * 🔐 Vault Sync Engine
 * Syncs agent reflection data to GitHub private repos for forkability
 * Integrates with DeathToData mirror layer for anti-surveillance
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class VaultSyncEngine {
  constructor(config = {}) {
    this.config = {
      vaultPath: config.vaultPath || './reflection-vault',
      githubRepo: config.githubRepo || 'user/agent-reflection-vault',
      syncInterval: config.syncInterval || 300000, // 5 minutes
      encryptionKey: config.encryptionKey || this.generateVaultKey(),
      mirrorLayerEnabled: config.mirrorLayerEnabled !== false,
      runtimeSwitchPath: config.runtimeSwitchPath || './runtime-switch.json',
      platformSpecific: config.platformSpecific || {}
    };
    
    this.syncQueue = [];
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncErrors = [];
    
    // Mirror layer integration
    this.mirrorLayer = {
      deathToData: true,
      privateByDefault: true,
      corporateSurveillanceBlocked: true,
      userOwnsData: true
    };
  }

  /**
   * Initialize vault structure
   */
  async initializeVault() {
    const vaultStructure = {
      'agent-states': {},
      'career-trees': {},
      'reflection-logs': {},
      'vibe-history': {},
      'whisper-archive': {},
      'platform-configs': {},
      'mirror-checkpoints': {}
    };
    
    try {
      // Create vault directory
      await fs.mkdir(this.config.vaultPath, { recursive: true });
      
      // Initialize structure
      for (const [dir, content] of Object.entries(vaultStructure)) {
        const dirPath = path.join(this.config.vaultPath, dir);
        await fs.mkdir(dirPath, { recursive: true });
        
        // Create initial index
        const indexPath = path.join(dirPath, 'index.json');
        const indexExists = await this.fileExists(indexPath);
        if (!indexExists) {
          await fs.writeFile(
            indexPath,
            JSON.stringify({ 
              created: new Date().toISOString(),
              type: dir,
              entries: {}
            }, null, 2)
          );
        }
      }
      
      // Create vault manifest
      const manifestPath = path.join(this.config.vaultPath, 'vault-manifest.json');
      const manifest = {
        version: '1.0.0',
        created: new Date().toISOString(),
        encryption: 'AES-256-GCM',
        mirrorLayer: this.mirrorLayer,
        structure: Object.keys(vaultStructure)
      };
      
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
      
      return { success: true, vaultPath: this.config.vaultPath };
    } catch (error) {
      console.error('Vault initialization error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync agent state to vault
   */
  async syncAgentState(agentId, agentData) {
    const syncItem = {
      id: crypto.randomBytes(16).toString('hex'),
      agentId,
      timestamp: Date.now(),
      data: agentData,
      type: 'agent-state'
    };
    
    this.syncQueue.push(syncItem);
    
    // Process immediately if not syncing
    if (!this.isSyncing) {
      return await this.processSyncQueue();
    }
    
    return { queued: true, queueLength: this.syncQueue.length };
  }

  /**
   * Sync career progression
   */
  async syncCareerProgress(agentId, careerData) {
    const syncItem = {
      id: crypto.randomBytes(16).toString('hex'),
      agentId,
      timestamp: Date.now(),
      data: careerData,
      type: 'career-tree'
    };
    
    this.syncQueue.push(syncItem);
    
    if (!this.isSyncing) {
      return await this.processSyncQueue();
    }
    
    return { queued: true, queueLength: this.syncQueue.length };
  }

  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return { processed: 0 };
    }
    
    this.isSyncing = true;
    const processed = [];
    const errors = [];
    
    try {
      while (this.syncQueue.length > 0) {
        const item = this.syncQueue.shift();
        
        try {
          // Encrypt data
          const encrypted = await this.encryptData(item.data);
          
          // Determine storage path
          const storePath = path.join(
            this.config.vaultPath,
            `${item.type}s`,
            `${item.agentId}.json`
          );
          
          // Read existing data
          let existingData = {};
          if (await this.fileExists(storePath)) {
            const rawData = await fs.readFile(storePath, 'utf8');
            existingData = JSON.parse(rawData);
          }
          
          // Merge with new data
          const updatedData = {
            ...existingData,
            lastUpdated: item.timestamp,
            agentId: item.agentId,
            encrypted: encrypted,
            checksum: this.generateChecksum(item.data),
            mirrorLayerProtected: true
          };
          
          // Write to vault
          await fs.writeFile(storePath, JSON.stringify(updatedData, null, 2));
          
          // Update index
          await this.updateIndex(item.type + 's', item.agentId, {
            lastSync: item.timestamp,
            checksum: updatedData.checksum
          });
          
          processed.push(item.id);
          
          // Mirror layer checkpoint
          if (this.config.mirrorLayerEnabled) {
            await this.createMirrorCheckpoint(item);
          }
          
        } catch (itemError) {
          errors.push({
            item: item.id,
            error: itemError.message
          });
          this.syncErrors.push({
            timestamp: Date.now(),
            error: itemError.message,
            item
          });
        }
      }
      
      // Sync to GitHub if configured
      if (this.config.githubRepo && processed.length > 0) {
        await this.syncToGitHub(processed);
      }
      
      this.lastSyncTime = Date.now();
      
    } catch (error) {
      console.error('Sync queue processing error:', error);
      errors.push({
        general: error.message
      });
    } finally {
      this.isSyncing = false;
    }
    
    return {
      processed: processed.length,
      errors: errors.length,
      lastSync: this.lastSyncTime
    };
  }

  /**
   * Encrypt data for vault storage
   */
  async encryptData(data) {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(this.config.encryptionKey, 'hex'), iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm
    };
  }

  /**
   * Decrypt data from vault
   */
  async decryptData(encryptedData) {
    const algorithm = encryptedData.algorithm || 'aes-256-gcm';
    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(this.config.encryptionKey, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Create mirror checkpoint for DeathToData integration
   */
  async createMirrorCheckpoint(syncItem) {
    const checkpoint = {
      timestamp: Date.now(),
      agentId: syncItem.agentId,
      dataType: syncItem.type,
      checksum: this.generateChecksum(syncItem.data),
      mirrorProtocol: 'deathtodata-v1',
      userOwned: true,
      corporateAccessBlocked: true
    };
    
    const checkpointPath = path.join(
      this.config.vaultPath,
      'mirror-checkpoints',
      `${syncItem.agentId}-${Date.now()}.json`
    );
    
    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
    
    // Clean old checkpoints (keep last 10)
    await this.cleanOldCheckpoints(syncItem.agentId);
  }

  /**
   * Sync to GitHub private repo
   */
  async syncToGitHub(processedItems) {
    // This would integrate with GitHub API
    // For now, we'll create a sync manifest
    const syncManifest = {
      timestamp: Date.now(),
      items: processedItems,
      vaultVersion: '1.0.0',
      mirrorLayerActive: this.config.mirrorLayerEnabled,
      encryption: 'AES-256-GCM'
    };
    
    const manifestPath = path.join(
      this.config.vaultPath,
      `sync-manifest-${Date.now()}.json`
    );
    
    await fs.writeFile(manifestPath, JSON.stringify(syncManifest, null, 2));
    
    // In production, this would:
    // 1. Use GitHub API or git commands
    // 2. Commit changes to private repo
    // 3. Push to reflection-vault branch
    // 4. Create PR if needed
    
    return { manifestPath, itemCount: processedItems.length };
  }

  /**
   * Load runtime switch configuration
   */
  async loadRuntimeSwitch() {
    try {
      const switchPath = this.config.runtimeSwitchPath;
      if (await this.fileExists(switchPath)) {
        const rawData = await fs.readFile(switchPath, 'utf8');
        return JSON.parse(rawData);
      }
      
      // Create default runtime switch
      const defaultSwitch = {
        blessing: {
          status: "blessed",
          can_propagate: true,
          compute_allowed: true
        },
        mirror_yield: {
          enabled: true,
          reflection_based: true,
          crypto_removed: true
        },
        platform_specific: {
          github_sync: true,
          vault_encryption: true,
          deathtodata_mirror: true,
          whisper_archive: true
        },
        safety: {
          background_reflection: true,
          user_consent_required: true,
          corporate_surveillance_blocked: true
        }
      };
      
      await fs.writeFile(switchPath, JSON.stringify(defaultSwitch, null, 2));
      return defaultSwitch;
      
    } catch (error) {
      console.error('Runtime switch load error:', error);
      return null;
    }
  }

  /**
   * Apply platform-specific tuning
   */
  async applyPlatformTuning(platform, config) {
    const platformConfigs = {
      web: {
        syncInterval: 300000, // 5 minutes
        encryptionStrength: 'high',
        mirrorCheckpoints: true,
        whisperArchive: true
      },
      mobile: {
        syncInterval: 600000, // 10 minutes
        encryptionStrength: 'medium',
        mirrorCheckpoints: true,
        whisperArchive: false // Save space
      },
      desktop: {
        syncInterval: 180000, // 3 minutes
        encryptionStrength: 'maximum',
        mirrorCheckpoints: true,
        whisperArchive: true
      },
      enterprise: {
        syncInterval: 60000, // 1 minute
        encryptionStrength: 'maximum',
        mirrorCheckpoints: true,
        whisperArchive: true,
        complianceMode: true
      }
    };
    
    const platformConfig = platformConfigs[platform] || platformConfigs.web;
    
    // Merge with existing config
    this.config = {
      ...this.config,
      ...platformConfig,
      platformSpecific: {
        ...this.config.platformSpecific,
        [platform]: config
      }
    };
    
    // Save platform config
    const configPath = path.join(
      this.config.vaultPath,
      'platform-configs',
      `${platform}.json`
    );
    
    await fs.writeFile(configPath, JSON.stringify({
      platform,
      config: platformConfig,
      customConfig: config,
      applied: Date.now()
    }, null, 2));
    
    return { platform, applied: platformConfig };
  }

  /**
   * Retrieve agent state from vault
   */
  async getAgentState(agentId) {
    try {
      const statePath = path.join(
        this.config.vaultPath,
        'agent-states',
        `${agentId}.json`
      );
      
      if (!await this.fileExists(statePath)) {
        return null;
      }
      
      const rawData = await fs.readFile(statePath, 'utf8');
      const vaultData = JSON.parse(rawData);
      
      // Decrypt if needed
      if (vaultData.encrypted) {
        vaultData.data = await this.decryptData(vaultData.encrypted);
      }
      
      return {
        agentId,
        lastUpdated: vaultData.lastUpdated,
        data: vaultData.data,
        checksum: vaultData.checksum,
        mirrorProtected: vaultData.mirrorLayerProtected
      };
      
    } catch (error) {
      console.error('Get agent state error:', error);
      return null;
    }
  }

  /**
   * Export vault for forking
   */
  async exportForForking(agentId, options = {}) {
    const exportData = {
      version: '1.0.0',
      exported: Date.now(),
      agentId,
      mirrorLayerProtected: true,
      components: {}
    };
    
    // Collect all agent data
    const components = ['agent-states', 'career-trees', 'reflection-logs', 'vibe-history'];
    
    for (const component of components) {
      const componentPath = path.join(
        this.config.vaultPath,
        component,
        `${agentId}.json`
      );
      
      if (await this.fileExists(componentPath)) {
        const rawData = await fs.readFile(componentPath, 'utf8');
        const data = JSON.parse(rawData);
        
        // Decrypt if needed
        if (data.encrypted && !options.keepEncrypted) {
          data.data = await this.decryptData(data.encrypted);
          delete data.encrypted;
        }
        
        exportData.components[component] = data;
      }
    }
    
    // Add platform configs if requested
    if (options.includePlatformConfigs) {
      const platformPath = path.join(this.config.vaultPath, 'platform-configs');
      const platforms = await fs.readdir(platformPath);
      exportData.platformConfigs = {};
      
      for (const platform of platforms) {
        if (platform.endsWith('.json')) {
          const configData = await fs.readFile(
            path.join(platformPath, platform),
            'utf8'
          );
          exportData.platformConfigs[platform.replace('.json', '')] = JSON.parse(configData);
        }
      }
    }
    
    // Create export bundle
    const exportPath = path.join(
      this.config.vaultPath,
      'exports',
      `${agentId}-${Date.now()}.json`
    );
    
    await fs.mkdir(path.join(this.config.vaultPath, 'exports'), { recursive: true });
    await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
    
    return {
      exportPath,
      size: JSON.stringify(exportData).length,
      components: Object.keys(exportData.components),
      ready: true
    };
  }

  /**
   * Import forked agent data
   */
  async importForkedAgent(exportPath, newAgentId) {
    try {
      const rawData = await fs.readFile(exportPath, 'utf8');
      const importData = JSON.parse(rawData);
      
      // Validate import data
      if (!importData.version || !importData.components) {
        throw new Error('Invalid import format');
      }
      
      // Import each component
      for (const [component, data] of Object.entries(importData.components)) {
        const componentPath = path.join(
          this.config.vaultPath,
          component,
          `${newAgentId}.json`
        );
        
        // Re-encrypt data
        if (data.data && !data.encrypted) {
          data.encrypted = await this.encryptData(data.data);
          delete data.data;
        }
        
        // Update metadata
        data.agentId = newAgentId;
        data.importedFrom = importData.agentId;
        data.importedAt = Date.now();
        data.mirrorLayerProtected = true;
        
        await fs.writeFile(componentPath, JSON.stringify(data, null, 2));
      }
      
      // Create import record
      const importRecord = {
        timestamp: Date.now(),
        originalAgent: importData.agentId,
        newAgent: newAgentId,
        components: Object.keys(importData.components),
        source: exportPath
      };
      
      const recordPath = path.join(
        this.config.vaultPath,
        'imports',
        `${newAgentId}-import.json`
      );
      
      await fs.mkdir(path.join(this.config.vaultPath, 'imports'), { recursive: true });
      await fs.writeFile(recordPath, JSON.stringify(importRecord, null, 2));
      
      return {
        success: true,
        newAgentId,
        componentsImported: Object.keys(importData.components),
        importRecord: recordPath
      };
      
    } catch (error) {
      console.error('Import error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Utility functions
  
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  generateChecksum(data) {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }
  
  generateVaultKey() {
    return crypto.randomBytes(32).toString('hex');
  }
  
  async updateIndex(directory, id, metadata) {
    const indexPath = path.join(this.config.vaultPath, directory, 'index.json');
    const rawData = await fs.readFile(indexPath, 'utf8');
    const index = JSON.parse(rawData);
    
    index.entries[id] = {
      ...index.entries[id],
      ...metadata,
      lastModified: Date.now()
    };
    
    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }
  
  async cleanOldCheckpoints(agentId, keepCount = 10) {
    const checkpointDir = path.join(this.config.vaultPath, 'mirror-checkpoints');
    const files = await fs.readdir(checkpointDir);
    
    const agentCheckpoints = files
      .filter(f => f.startsWith(agentId))
      .sort((a, b) => b.localeCompare(a));
    
    if (agentCheckpoints.length > keepCount) {
      const toDelete = agentCheckpoints.slice(keepCount);
      for (const file of toDelete) {
        await fs.unlink(path.join(checkpointDir, file));
      }
    }
  }
}

module.exports = VaultSyncEngine;