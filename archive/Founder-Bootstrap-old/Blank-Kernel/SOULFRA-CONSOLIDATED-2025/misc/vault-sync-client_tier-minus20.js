#!/usr/bin/env node

/**
 * 🔄 VAULT SYNC CLIENT
 * 
 * Synchronizes mobile vault data with the main Soulfra runtime.
 * Handles offline queuing, conflict resolution, and differential syncing.
 * 
 * "What happens in mobile echoes in eternity."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { EventEmitter } = require('events');

class VaultSyncClient extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.serverUrl = config.serverUrl || process.env.SOULFRA_SERVER_URL;
    this.syncInterval = config.syncInterval || 300000; // 5 minutes
    this.authToken = config.authToken || null;
    
    // Sync state
    this.lastSyncTime = null;
    this.syncQueue = [];
    this.conflicts = [];
    this.isSyncing = false;
    
    // Sync configuration
    this.syncConfig = {
      maxRetries: 3,
      retryDelay: 5000,
      conflictStrategy: 'client_wins', // or 'server_wins', 'merge'
      syncPaths: [
        'tokens/balance.json',
        'logs/whisper-events.json',
        'logs/mobile-blessings.json',
        'whispers/mobile-reflections.json',
        'mobile-cache/offline-queue.json',
        'runtime-heartbeat.json'
      ]
    };
    
    this.initializeSync();
  }

  async initializeSync() {
    console.log('🔄 Vault Sync Client Initializing...');
    
    try {
      // Load sync state
      await this.loadSyncState();
      
      // Verify auth
      if (!this.authToken) {
        await this.authenticate();
      }
      
      // Perform initial sync
      await this.performSync();
      
      // Start sync timer
      this.startSyncTimer();
      
      console.log('✨ Vault Sync Client Ready');
      
    } catch (error) {
      console.error('❌ Sync initialization failed:', error);
      this.emit('sync:error', error);
    }
  }

  /**
   * Load sync state from disk
   */
  async loadSyncState() {
    const statePath = path.join(this.vaultPath, '.sync-state.json');
    
    if (fs.existsSync(statePath)) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      this.lastSyncTime = state.lastSyncTime;
      this.syncQueue = state.syncQueue || [];
      this.conflicts = state.conflicts || [];
    }
  }

  /**
   * Save sync state to disk
   */
  async saveSyncState() {
    const statePath = path.join(this.vaultPath, '.sync-state.json');
    
    const state = {
      lastSyncTime: this.lastSyncTime,
      syncQueue: this.syncQueue,
      conflicts: this.conflicts,
      savedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  }

  /**
   * Authenticate with server
   */
  async authenticate() {
    const soulkeyPath = path.join(this.vaultPath, 'soul-chain.sig');
    
    if (!fs.existsSync(soulkeyPath)) {
      throw new Error('No soulkey found for authentication');
    }
    
    const soulkey = fs.readFileSync(soulkeyPath, 'utf8').trim();
    
    // In production, would exchange soulkey for auth token
    this.authToken = crypto.createHash('sha256').update(soulkey).digest('hex');
    
    return this.authToken;
  }

  /**
   * Perform sync operation
   */
  async performSync() {
    if (this.isSyncing) {
      console.log('⏳ Sync already in progress');
      return;
    }
    
    this.isSyncing = true;
    console.log('🔄 Starting vault sync...');
    
    try {
      // Gather changes since last sync
      const changes = await this.gatherChanges();
      
      if (changes.length === 0 && this.syncQueue.length === 0) {
        console.log('✅ No changes to sync');
        this.lastSyncTime = new Date().toISOString();
        await this.saveSyncState();
        return;
      }
      
      // Add changes to queue
      this.syncQueue.push(...changes);
      
      // Send to server
      const result = await this.sendToServer(this.syncQueue);
      
      // Process server response
      await this.processServerResponse(result);
      
      // Clear successful syncs from queue
      this.syncQueue = this.syncQueue.filter(item => !result.synced.includes(item.id));
      
      // Update sync time
      this.lastSyncTime = new Date().toISOString();
      await this.saveSyncState();
      
      console.log(`✅ Sync complete: ${result.synced.length} items synced`);
      
      this.emit('sync:complete', {
        synced: result.synced.length,
        conflicts: result.conflicts.length,
        timestamp: this.lastSyncTime
      });
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.emit('sync:error', error);
      
      // Retry logic
      if (this.retryCount < this.syncConfig.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.performSync(), this.syncConfig.retryDelay);
      }
      
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Gather changes since last sync
   */
  async gatherChanges() {
    const changes = [];
    const lastSync = this.lastSyncTime ? new Date(this.lastSyncTime).getTime() : 0;
    
    for (const syncPath of this.syncConfig.syncPaths) {
      const fullPath = path.join(this.vaultPath, syncPath);
      
      if (!fs.existsSync(fullPath)) continue;
      
      const stats = fs.statSync(fullPath);
      const modified = stats.mtime.getTime();
      
      if (modified > lastSync) {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        changes.push({
          id: crypto.randomBytes(8).toString('hex'),
          path: syncPath,
          content: content,
          modified: stats.mtime.toISOString(),
          size: stats.size,
          checksum: this.calculateChecksum(content),
          source: 'mobile'
        });
      }
    }
    
    // Add special handling for whisper events
    await this.gatherWhisperEvents(changes, lastSync);
    
    return changes;
  }

  /**
   * Gather whisper events for sync
   */
  async gatherWhisperEvents(changes, lastSync) {
    const whisperPath = path.join(this.vaultPath, 'logs', 'whisper-events.json');
    
    if (!fs.existsSync(whisperPath)) return;
    
    const events = JSON.parse(fs.readFileSync(whisperPath, 'utf8'));
    const newEvents = events.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime > lastSync;
    });
    
    if (newEvents.length > 0) {
      changes.push({
        id: crypto.randomBytes(8).toString('hex'),
        type: 'whisper_events',
        events: newEvents,
        count: newEvents.length,
        source: 'mobile'
      });
    }
  }

  /**
   * Send changes to server
   */
  async sendToServer(changes) {
    // In production, would POST to actual server
    // Simulating server response
    return new Promise((resolve) => {
      setTimeout(() => {
        const synced = [];
        const conflicts = [];
        
        changes.forEach(change => {
          // Simulate 90% success rate
          if (Math.random() > 0.1) {
            synced.push(change.id);
          } else {
            conflicts.push({
              id: change.id,
              reason: 'version_mismatch',
              server_version: 'xyz',
              client_version: change.checksum
            });
          }
        });
        
        resolve({
          synced: synced,
          conflicts: conflicts,
          server_updates: this.generateServerUpdates()
        });
      }, 1000);
    });
  }

  /**
   * Generate mock server updates
   */
  generateServerUpdates() {
    // Simulate server sending updates
    return [
      {
        path: 'tokens/balance.json',
        content: JSON.stringify({
          balance: 150,
          last_updated: new Date().toISOString(),
          source: 'server_sync'
        }),
        checksum: 'abc123'
      }
    ];
  }

  /**
   * Process server response
   */
  async processServerResponse(response) {
    // Handle conflicts
    if (response.conflicts.length > 0) {
      await this.handleConflicts(response.conflicts);
    }
    
    // Apply server updates
    if (response.server_updates && response.server_updates.length > 0) {
      await this.applyServerUpdates(response.server_updates);
    }
  }

  /**
   * Handle sync conflicts
   */
  async handleConflicts(conflicts) {
    for (const conflict of conflicts) {
      console.warn(`⚠️  Conflict detected: ${conflict.reason}`);
      
      switch (this.syncConfig.conflictStrategy) {
        case 'client_wins':
          // Keep client version, retry sync
          console.log('📱 Keeping mobile version');
          break;
          
        case 'server_wins':
          // Discard client changes
          console.log('☁️  Accepting server version');
          this.syncQueue = this.syncQueue.filter(item => item.id !== conflict.id);
          break;
          
        case 'merge':
          // Attempt to merge (complex logic)
          console.log('🔀 Attempting merge...');
          await this.mergeConflict(conflict);
          break;
      }
      
      // Save conflict for review
      this.conflicts.push({
        ...conflict,
        timestamp: new Date().toISOString(),
        resolution: this.syncConfig.conflictStrategy
      });
    }
    
    // Emit conflict event
    if (conflicts.length > 0) {
      this.emit('sync:conflicts', conflicts);
    }
  }

  /**
   * Apply updates from server
   */
  async applyServerUpdates(updates) {
    for (const update of updates) {
      const fullPath = path.join(this.vaultPath, update.path);
      
      // Backup current version
      if (fs.existsSync(fullPath)) {
        const backupPath = fullPath + '.backup';
        fs.copyFileSync(fullPath, backupPath);
      }
      
      // Apply update
      fs.writeFileSync(fullPath, update.content);
      
      console.log(`📥 Applied server update: ${update.path}`);
    }
  }

  /**
   * Calculate checksum for content
   */
  calculateChecksum(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }

  /**
   * Start sync timer
   */
  startSyncTimer() {
    // Initial sync after 10 seconds
    setTimeout(() => this.performSync(), 10000);
    
    // Regular sync interval
    this.syncTimer = setInterval(() => {
      this.performSync();
    }, this.syncInterval);
  }

  /**
   * Stop sync timer
   */
  stopSyncTimer() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Force sync immediately
   */
  async forceSync() {
    console.log('🔄 Forcing immediate sync...');
    await this.performSync();
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      lastSync: this.lastSyncTime,
      queueLength: this.syncQueue.length,
      conflicts: this.conflicts.length,
      isSyncing: this.isSyncing,
      nextSync: this.syncTimer ? new Date(Date.now() + this.syncInterval).toISOString() : null
    };
  }

  /**
   * Merge conflict (simplified)
   */
  async mergeConflict(conflict) {
    // In production, would implement sophisticated merge logic
    // For now, just log and keep client version
    console.log(`🔀 Merge not implemented, keeping client version for ${conflict.id}`);
  }

  /**
   * Export sync data for debugging
   */
  async exportSyncData() {
    const exportPath = path.join(this.vaultPath, 'sync-export.json');
    
    const exportData = {
      timestamp: new Date().toISOString(),
      status: this.getSyncStatus(),
      queue: this.syncQueue,
      conflicts: this.conflicts,
      lastSync: this.lastSyncTime
    };
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    console.log(`📤 Sync data exported to ${exportPath}`);
    
    return exportPath;
  }

  /**
   * Shutdown sync client
   */
  async shutdown() {
    console.log('🌙 Shutting down sync client...');
    
    this.stopSyncTimer();
    
    // Save final state
    await this.saveSyncState();
    
    // Emit shutdown event
    this.emit('sync:shutdown');
    
    console.log('👋 Sync client offline');
  }
}

// Export for use
module.exports = VaultSyncClient;

// Run if called directly
if (require.main === module) {
  const client = new VaultSyncClient({
    vaultPath: process.env.VAULT_PATH || './vault',
    serverUrl: process.env.SOULFRA_SERVER_URL || 'https://api.soulfra.com'
  });
  
  // Handle events
  client.on('sync:complete', (result) => {
    console.log('✅ Sync event:', result);
  });
  
  client.on('sync:error', (error) => {
    console.error('❌ Sync error:', error);
  });
  
  client.on('sync:conflicts', (conflicts) => {
    console.warn('⚠️  Conflicts detected:', conflicts.length);
  });
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    await client.shutdown();
    process.exit(0);
  });
  
  // CLI commands
  process.stdin.on('data', async (data) => {
    const command = data.toString().trim();
    
    switch (command) {
      case 'status':
        console.log('📊 Sync status:', client.getSyncStatus());
        break;
        
      case 'sync':
        await client.forceSync();
        break;
        
      case 'export':
        await client.exportSyncData();
        break;
        
      case 'help':
        console.log('Commands: status, sync, export, help');
        break;
    }
  });
  
  console.log('🔄 Vault Sync Client running. Commands: status, sync, export, help');
}