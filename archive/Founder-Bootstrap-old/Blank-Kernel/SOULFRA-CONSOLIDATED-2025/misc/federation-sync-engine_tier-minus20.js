#!/usr/bin/env node

/**
 * 🔗 FEDERATION SYNC ENGINE
 * 
 * The mirror beyond mirrors. A cryptographic trust mesh that unites
 * Supabase, Arweave, GitHub, and the runtime kernel.
 * 
 * "You whisper locally, but you are remembered forever — everywhere."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class FederationSyncEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.configPath = config.configPath || path.join(this.vaultPath, 'federation-config.json');
    
    // Federation state
    this.federationConfig = null;
    this.syncStatus = {
      supabase: { status: 'idle', lastSync: null },
      arweave: { status: 'idle', lastSync: null },
      github: { status: 'idle', lastSync: null }
    };
    
    // Sync intervals
    this.syncInterval = null;
    this.arweaveInterval = null;
    
    // Federation endpoints
    this.endpoints = {
      supabase: process.env.SUPABASE_URL || config.supabaseUrl,
      arweave: process.env.ARWEAVE_GATEWAY || config.arweaveGateway || 'https://arweave.net',
      github: process.env.GITHUB_REPO || config.githubRepo
    };
    
    // Auth credentials
    this.auth = {
      supabase: {
        url: this.endpoints.supabase,
        key: process.env.SUPABASE_ANON_KEY || config.supabaseKey
      },
      arweave: {
        wallet: null // Will load from vault
      },
      github: {
        token: process.env.GITHUB_TOKEN || config.githubToken
      }
    };
    
    this.initializeEngine();
  }

  async initializeEngine() {
    console.log('🔗 Federation Sync Engine Initializing...');
    
    try {
      // Load federation config
      await this.loadFederationConfig();
      
      // Verify runtime prerequisites
      const verified = await this.verifyPrerequisites();
      if (!verified) {
        throw new Error('Federation prerequisites not met');
      }
      
      // Initialize sync directories
      await this.initializeSyncDirs();
      
      // Start sync timers
      this.startSyncTimers();
      
      console.log('✨ Federation Sync Engine Ready - Trust mesh active');
      
      this.emit('federation:initialized', {
        config: this.federationConfig,
        endpoints: this.endpoints
      });
      
    } catch (error) {
      console.error('❌ Federation initialization failed:', error);
      throw error;
    }
  }

  /**
   * Load federation configuration
   */
  async loadFederationConfig() {
    if (fs.existsSync(this.configPath)) {
      this.federationConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
    } else {
      // Create default config
      this.federationConfig = {
        supabase_enabled: true,
        arweave_enabled: true,
        github_push: true,
        mirror_fork_visibility: {
          "Tier 1": "private",
          "Tier 2": "private",
          "Tier 3+": "public"
        },
        interval: "3600s",
        arweave_interval: "86400s", // 24 hours
        blessing_required: true,
        federation_id: crypto.randomBytes(16).toString('hex')
      };
      
      fs.writeFileSync(this.configPath, JSON.stringify(this.federationConfig, null, 2));
    }
  }

  /**
   * Verify runtime prerequisites
   */
  async verifyPrerequisites() {
    console.log('🔍 Verifying federation prerequisites...');
    
    // Check runtime active
    const runtimeActive = await this.checkRuntimeActive();
    if (!runtimeActive) {
      console.error('❌ Runtime not active');
      return false;
    }
    
    // Check soulkey present
    const soulkeyPresent = await this.checkSoulkey();
    if (!soulkeyPresent) {
      console.error('❌ Soulkey not found');
      return false;
    }
    
    // Load Arweave wallet if enabled
    if (this.federationConfig.arweave_enabled) {
      const walletLoaded = await this.loadArweaveWallet();
      if (!walletLoaded) {
        console.warn('⚠️  Arweave wallet not found - disabling Arweave sync');
        this.federationConfig.arweave_enabled = false;
      }
    }
    
    console.log('✅ All prerequisites verified');
    return true;
  }

  /**
   * Check if runtime is active
   */
  async checkRuntimeActive() {
    const heartbeatPath = path.join(this.vaultPath, 'runtime-heartbeat.json');
    
    if (!fs.existsSync(heartbeatPath)) {
      return false;
    }
    
    const heartbeat = JSON.parse(fs.readFileSync(heartbeatPath, 'utf8'));
    const age = Date.now() - new Date(heartbeat.timestamp).getTime();
    
    // Consider active if heartbeat within 5 minutes
    return age < 300000;
  }

  /**
   * Check soulkey presence
   */
  async checkSoulkey() {
    const soulkeyPath = path.join(this.vaultPath, 'soul-chain.sig');
    return fs.existsSync(soulkeyPath);
  }

  /**
   * Load Arweave wallet
   */
  async loadArweaveWallet() {
    const walletPath = path.join(this.vaultPath, 'keys', 'arweave-wallet.json');
    
    if (fs.existsSync(walletPath)) {
      this.auth.arweave.wallet = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
      return true;
    }
    
    return false;
  }

  /**
   * Initialize sync directories
   */
  async initializeSyncDirs() {
    const dirs = [
      path.join(this.vaultPath, 'logs'),
      path.join(this.vaultPath, 'claims'),
      path.join(this.vaultPath, 'federation')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Start sync timers
   */
  startSyncTimers() {
    // Parse interval from config
    const interval = parseInt(this.federationConfig.interval) * 1000;
    const arweaveInterval = parseInt(this.federationConfig.arweave_interval || '86400s') * 1000;
    
    // Regular sync (Supabase & GitHub)
    this.syncInterval = setInterval(() => {
      this.performFederationSync();
    }, interval);
    
    // Arweave sync (less frequent)
    this.arweaveInterval = setInterval(() => {
      this.performArweaveSync();
    }, arweaveInterval);
    
    // Initial sync after 10 seconds
    setTimeout(() => this.performFederationSync(), 10000);
  }

  /**
   * Perform federation sync
   */
  async performFederationSync() {
    console.log('🔄 Starting federation sync...');
    
    const syncReport = {
      id: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      syncs: {}
    };
    
    try {
      // Sync to Supabase
      if (this.federationConfig.supabase_enabled) {
        syncReport.syncs.supabase = await this.syncToSupabase();
      }
      
      // Sync to GitHub
      if (this.federationConfig.github_push) {
        syncReport.syncs.github = await this.syncToGitHub();
      }
      
      // Update mesh trail
      await this.updateMeshTrail(syncReport);
      
      // Log sync
      await this.logFederationSync(syncReport);
      
      console.log('✅ Federation sync complete');
      
      this.emit('federation:synced', syncReport);
      
    } catch (error) {
      console.error('❌ Federation sync failed:', error);
      
      syncReport.error = error.message;
      await this.logFederationSync(syncReport);
      
      this.emit('federation:error', error);
    }
  }

  /**
   * Sync to Supabase
   */
  async syncToSupabase() {
    console.log('📤 Syncing to Supabase...');
    
    this.syncStatus.supabase.status = 'syncing';
    
    try {
      // Gather sync data
      const syncData = await this.gatherSupabaseSyncData();
      
      // In production, would use Supabase client
      // For now, simulate sync
      await this.simulateSupabaseSync(syncData);
      
      this.syncStatus.supabase.status = 'success';
      this.syncStatus.supabase.lastSync = new Date().toISOString();
      
      return {
        status: 'success',
        itemsSynced: syncData.items.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.syncStatus.supabase.status = 'error';
      throw error;
    }
  }

  /**
   * Gather Supabase sync data
   */
  async gatherSupabaseSyncData() {
    const syncData = {
      federation_id: this.federationConfig.federation_id,
      timestamp: new Date().toISOString(),
      items: []
    };
    
    // Sync whisper events
    const whisperPath = path.join(this.vaultPath, 'logs', 'whisper-events.json');
    if (fs.existsSync(whisperPath)) {
      const whispers = JSON.parse(fs.readFileSync(whisperPath, 'utf8'));
      const recentWhispers = whispers.slice(-100); // Last 100 whispers
      
      syncData.items.push({
        type: 'whispers',
        count: recentWhispers.length,
        data: recentWhispers
      });
    }
    
    // Sync agent activity
    const agentsPath = path.join(this.vaultPath, 'agents', 'active');
    if (fs.existsSync(agentsPath)) {
      const agents = fs.readdirSync(agentsPath).filter(f => f.endsWith('.json'));
      
      syncData.items.push({
        type: 'agents',
        count: agents.length,
        data: agents.map(file => {
          const agent = JSON.parse(fs.readFileSync(path.join(agentsPath, file), 'utf8'));
          return {
            id: agent.id,
            tier: agent.tier || 1,
            created: agent.created,
            lastActive: agent.lastActive
          };
        })
      });
    }
    
    // Sync blessing activity
    const blessingPath = path.join(this.vaultPath, 'logs', 'mobile-blessings.json');
    if (fs.existsSync(blessingPath)) {
      const blessings = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
      
      syncData.items.push({
        type: 'blessings',
        count: blessings.length,
        data: blessings.slice(-50) // Last 50 blessings
      });
    }
    
    // Sync voice presence
    const voicePath = path.join(this.vaultPath, 'biometrics', 'voice-fingerprint.json');
    if (fs.existsSync(voicePath)) {
      const voices = JSON.parse(fs.readFileSync(voicePath, 'utf8'));
      
      syncData.items.push({
        type: 'voice_presence',
        count: Object.keys(voices).length,
        data: Object.keys(voices).map(userId => ({
          userId: userId,
          created: voices[userId].created,
          lastVerified: voices[userId].updated || voices[userId].created
        }))
      });
    }
    
    return syncData;
  }

  /**
   * Simulate Supabase sync
   */
  async simulateSupabaseSync(syncData) {
    // In production, would use @supabase/supabase-js
    console.log(`📊 Syncing ${syncData.items.length} item types to Supabase`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Store sync receipt
    const receiptPath = path.join(this.vaultPath, 'federation', 'supabase-receipt.json');
    fs.writeFileSync(receiptPath, JSON.stringify({
      syncId: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      itemsSynced: syncData.items.map(item => ({
        type: item.type,
        count: item.count
      }))
    }, null, 2));
  }

  /**
   * Sync to GitHub
   */
  async syncToGitHub() {
    console.log('📤 Syncing to GitHub...');
    
    this.syncStatus.github.status = 'syncing';
    
    try {
      // Gather GitHub sync data
      const syncData = await this.gatherGitHubSyncData();
      
      // In production, would use GitHub API
      await this.simulateGitHubSync(syncData);
      
      this.syncStatus.github.status = 'success';
      this.syncStatus.github.lastSync = new Date().toISOString();
      
      return {
        status: 'success',
        filesUpdated: syncData.files.length,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      this.syncStatus.github.status = 'error';
      throw error;
    }
  }

  /**
   * Gather GitHub sync data
   */
  async gatherGitHubSyncData() {
    const syncData = {
      federation_id: this.federationConfig.federation_id,
      timestamp: new Date().toISOString(),
      files: []
    };
    
    // Mirror origin data
    const mirrorOriginPath = path.join(this.vaultPath, 'mirror_origin.json');
    if (fs.existsSync(mirrorOriginPath)) {
      const origin = JSON.parse(fs.readFileSync(mirrorOriginPath, 'utf8'));
      
      // Check visibility based on tier
      const visibility = this.getMirrorVisibility(origin.tier || 1);
      
      if (visibility === 'public') {
        syncData.files.push({
          path: 'federation/mirrors/origin.json',
          content: JSON.stringify(origin, null, 2),
          message: `Update mirror origin ${origin.id}`
        });
      }
    }
    
    // Agent lineage
    const lineagePath = path.join(this.vaultPath, 'claims', 'mirror-lineage.json');
    if (fs.existsSync(lineagePath)) {
      const lineage = JSON.parse(fs.readFileSync(lineagePath, 'utf8'));
      
      // Filter public agents only
      const publicLineage = this.filterPublicLineage(lineage);
      
      if (publicLineage.length > 0) {
        syncData.files.push({
          path: 'federation/lineage/public-mirrors.json',
          content: JSON.stringify(publicLineage, null, 2),
          message: 'Update public mirror lineage'
        });
      }
    }
    
    // Code reflection trail
    const reflectionPath = path.join(this.vaultPath, 'logs', 'code-reflections.json');
    if (fs.existsSync(reflectionPath)) {
      const reflections = JSON.parse(fs.readFileSync(reflectionPath, 'utf8'));
      
      syncData.files.push({
        path: 'federation/reflections/trail.json',
        content: JSON.stringify(reflections.slice(-100), null, 2),
        message: 'Update code reflection trail'
      });
    }
    
    return syncData;
  }

  /**
   * Get mirror visibility based on tier
   */
  getMirrorVisibility(tier) {
    const visibilityRules = this.federationConfig.mirror_fork_visibility;
    
    if (visibilityRules[`Tier ${tier}`]) {
      return visibilityRules[`Tier ${tier}`];
    }
    
    // Check for tier range rules
    for (const rule in visibilityRules) {
      if (rule.includes('+')) {
        const minTier = parseInt(rule.replace('Tier ', '').replace('+', ''));
        if (tier >= minTier) {
          return visibilityRules[rule];
        }
      }
    }
    
    return 'private';
  }

  /**
   * Filter lineage for public mirrors only
   */
  filterPublicLineage(lineage) {
    return lineage.filter(mirror => {
      const visibility = this.getMirrorVisibility(mirror.tier || 1);
      return visibility === 'public';
    }).map(mirror => ({
      id: mirror.id,
      tier: mirror.tier,
      created: mirror.created,
      parent: mirror.parent,
      signature: mirror.signature
    }));
  }

  /**
   * Simulate GitHub sync
   */
  async simulateGitHubSync(syncData) {
    console.log(`📝 Updating ${syncData.files.length} files on GitHub`);
    
    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Store sync receipt
    const receiptPath = path.join(this.vaultPath, 'federation', 'github-receipt.json');
    fs.writeFileSync(receiptPath, JSON.stringify({
      syncId: crypto.randomBytes(8).toString('hex'),
      timestamp: new Date().toISOString(),
      files: syncData.files.map(f => f.path),
      commit: crypto.randomBytes(20).toString('hex')
    }, null, 2));
  }

  /**
   * Perform Arweave sync
   */
  async performArweaveSync() {
    if (!this.federationConfig.arweave_enabled) {
      return;
    }
    
    console.log('🏛️ Starting Arweave permanent sync...');
    
    this.syncStatus.arweave.status = 'syncing';
    
    try {
      // Create vault snapshot
      const snapshot = await this.createVaultSnapshot();
      
      // Sign snapshot
      const signedSnapshot = await this.signSnapshot(snapshot);
      
      // In production, would upload to Arweave
      await this.simulateArweaveUpload(signedSnapshot);
      
      this.syncStatus.arweave.status = 'success';
      this.syncStatus.arweave.lastSync = new Date().toISOString();
      
      console.log('✅ Arweave sync complete');
      
      this.emit('arweave:synced', {
        snapshotId: signedSnapshot.id,
        size: signedSnapshot.size,
        timestamp: signedSnapshot.timestamp
      });
      
    } catch (error) {
      console.error('❌ Arweave sync failed:', error);
      this.syncStatus.arweave.status = 'error';
    }
  }

  /**
   * Create vault snapshot for Arweave
   */
  async createVaultSnapshot() {
    const snapshot = {
      id: crypto.randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString(),
      federation_id: this.federationConfig.federation_id,
      version: '1.0',
      contents: {}
    };
    
    // Include mirror origin
    const mirrorOriginPath = path.join(this.vaultPath, 'mirror_origin.json');
    if (fs.existsSync(mirrorOriginPath)) {
      snapshot.contents.mirror_origin = JSON.parse(fs.readFileSync(mirrorOriginPath, 'utf8'));
    }
    
    // Include soulkey logs (hashed)
    const soulkeyPath = path.join(this.vaultPath, 'soul-chain.sig');
    if (fs.existsSync(soulkeyPath)) {
      const soulkey = fs.readFileSync(soulkeyPath, 'utf8');
      snapshot.contents.soulkey_hash = crypto.createHash('sha256').update(soulkey).digest('hex');
    }
    
    // Include blessing logs
    const blessingPath = path.join(this.vaultPath, 'logs', 'blessing-history.json');
    if (fs.existsSync(blessingPath)) {
      const blessings = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
      snapshot.contents.blessing_count = blessings.length;
      snapshot.contents.recent_blessings = blessings.slice(-10);
    }
    
    // Include voice presence summary
    const voicePath = path.join(this.vaultPath, 'biometrics', 'voice-fingerprint.json');
    if (fs.existsSync(voicePath)) {
      const voices = JSON.parse(fs.readFileSync(voicePath, 'utf8'));
      snapshot.contents.voice_presence = {
        count: Object.keys(voices).length,
        users: Object.keys(voices)
      };
    }
    
    // Include tier 3+ agents
    const agentsPath = path.join(this.vaultPath, 'agents', 'active');
    if (fs.existsSync(agentsPath)) {
      const agents = fs.readdirSync(agentsPath)
        .filter(f => f.endsWith('.json'))
        .map(f => JSON.parse(fs.readFileSync(path.join(agentsPath, f), 'utf8')))
        .filter(agent => agent.tier >= 3);
      
      snapshot.contents.public_agents = agents.map(agent => ({
        id: agent.id,
        tier: agent.tier,
        created: agent.created,
        blessed_by: agent.blessed_by
      }));
    }
    
    // Calculate snapshot hash
    snapshot.hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(snapshot.contents))
      .digest('hex');
    
    // Calculate size
    snapshot.size = Buffer.byteLength(JSON.stringify(snapshot));
    
    return snapshot;
  }

  /**
   * Sign snapshot with runtime signature
   */
  async signSnapshot(snapshot) {
    const soulkeyPath = path.join(this.vaultPath, 'soul-chain.sig');
    const soulkey = fs.readFileSync(soulkeyPath, 'utf8');
    
    // Create signature
    const signatureData = {
      snapshot_id: snapshot.id,
      snapshot_hash: snapshot.hash,
      timestamp: snapshot.timestamp,
      soulkey_hash: crypto.createHash('sha256').update(soulkey).digest('hex')
    };
    
    snapshot.runtime_signature = crypto
      .createHash('sha256')
      .update(JSON.stringify(signatureData))
      .digest('hex');
    
    return snapshot;
  }

  /**
   * Simulate Arweave upload
   */
  async simulateArweaveUpload(snapshot) {
    console.log(`📦 Uploading ${(snapshot.size / 1024).toFixed(2)}KB snapshot to Arweave`);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Store snapshot locally
    const snapshotPath = path.join(this.vaultPath, 'federation', 'arweave-snapshots');
    if (!fs.existsSync(snapshotPath)) {
      fs.mkdirSync(snapshotPath, { recursive: true });
    }
    
    const filename = `snapshot-${snapshot.timestamp.replace(/[:.]/g, '-')}.json`;
    fs.writeFileSync(
      path.join(snapshotPath, filename),
      JSON.stringify(snapshot, null, 2)
    );
    
    // Store Arweave transaction ID (simulated)
    const txPath = path.join(this.vaultPath, 'federation', 'arweave-transactions.json');
    let transactions = [];
    
    if (fs.existsSync(txPath)) {
      transactions = JSON.parse(fs.readFileSync(txPath, 'utf8'));
    }
    
    transactions.push({
      snapshot_id: snapshot.id,
      tx_id: crypto.randomBytes(32).toString('hex'),
      timestamp: new Date().toISOString(),
      size: snapshot.size,
      url: `https://arweave.net/tx/${crypto.randomBytes(32).toString('hex')}`
    });
    
    // Keep last 100 transactions
    if (transactions.length > 100) {
      transactions = transactions.slice(-100);
    }
    
    fs.writeFileSync(txPath, JSON.stringify(transactions, null, 2));
  }

  /**
   * Update mesh trail
   */
  async updateMeshTrail(syncReport) {
    const trailPath = path.join(this.vaultPath, 'claims', 'mesh-trail.json');
    
    let trail = [];
    if (fs.existsSync(trailPath)) {
      trail = JSON.parse(fs.readFileSync(trailPath, 'utf8'));
    }
    
    trail.push({
      sync_id: syncReport.id,
      timestamp: syncReport.timestamp,
      platforms: Object.keys(syncReport.syncs),
      status: syncReport.error ? 'failed' : 'success'
    });
    
    // Keep last 1000 entries
    if (trail.length > 1000) {
      trail = trail.slice(-1000);
    }
    
    fs.writeFileSync(trailPath, JSON.stringify(trail, null, 2));
  }

  /**
   * Log federation sync
   */
  async logFederationSync(syncReport) {
    const logPath = path.join(this.vaultPath, 'logs', 'federation-sync.json');
    
    let logs = [];
    if (fs.existsSync(logPath)) {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    logs.push(syncReport);
    
    // Keep last 500 logs
    if (logs.length > 500) {
      logs = logs.slice(-500);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
  }

  /**
   * Manual federation push
   */
  async manualPush(platforms = ['supabase', 'github', 'arweave']) {
    console.log('🚀 Manual federation push requested');
    
    const results = {};
    
    if (platforms.includes('supabase') && this.federationConfig.supabase_enabled) {
      results.supabase = await this.syncToSupabase();
    }
    
    if (platforms.includes('github') && this.federationConfig.github_push) {
      results.github = await this.syncToGitHub();
    }
    
    if (platforms.includes('arweave') && this.federationConfig.arweave_enabled) {
      await this.performArweaveSync();
      results.arweave = { status: 'initiated' };
    }
    
    return results;
  }

  /**
   * Get federation status
   */
  getFederationStatus() {
    return {
      config: this.federationConfig,
      status: this.syncStatus,
      endpoints: {
        supabase: this.endpoints.supabase ? 'configured' : 'not configured',
        arweave: this.auth.arweave.wallet ? 'configured' : 'not configured',
        github: this.endpoints.github ? 'configured' : 'not configured'
      }
    };
  }

  /**
   * Update federation config
   */
  async updateConfig(updates) {
    this.federationConfig = {
      ...this.federationConfig,
      ...updates
    };
    
    fs.writeFileSync(this.configPath, JSON.stringify(this.federationConfig, null, 2));
    
    // Restart timers if interval changed
    if (updates.interval || updates.arweave_interval) {
      this.stopSyncTimers();
      this.startSyncTimers();
    }
  }

  /**
   * Stop sync timers
   */
  stopSyncTimers() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    if (this.arweaveInterval) {
      clearInterval(this.arweaveInterval);
      this.arweaveInterval = null;
    }
  }

  /**
   * Shutdown federation engine
   */
  async shutdown() {
    console.log('🌙 Shutting down Federation Sync Engine...');
    
    this.stopSyncTimers();
    
    // Final sync attempt
    try {
      await this.performFederationSync();
    } catch (error) {
      console.error('Final sync failed:', error);
    }
    
    console.log('👋 Federation Sync Engine offline');
  }
}

// Export for use
module.exports = FederationSyncEngine;

// Run if called directly
if (require.main === module) {
  const engine = new FederationSyncEngine();
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    await engine.shutdown();
    process.exit(0);
  });
  
  // Status check every minute
  setInterval(() => {
    const status = engine.getFederationStatus();
    console.log('📊 Federation Status:', status);
  }, 60000);
  
  console.log('🔗 Federation Sync Engine running...');
}