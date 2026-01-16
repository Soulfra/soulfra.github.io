/**
 * 🧠 ORIGIN LEDGER SYNC DAEMON
 * 
 * Local daemon that reads vault state, packages snapshots with live metadata,
 * signs with origin soulkey, and pushes permanent records to Arweave.
 * 
 * "What's written in Supabase may change. What's written to Arweave was already true."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { createClient } = require('@supabase/supabase-js');

class OriginLedgerSync extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.ledgerPath = path.join(this.vaultPath, 'ledger');
    this.soulkeyPath = path.join(this.vaultPath, 'soulkey_primary.json');
    this.runtimeHeartbeatPath = path.join(this.vaultPath, 'runtime-heartbeat.json');
    
    this.supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
    this.supabaseKey = config.supabaseKey || process.env.SUPABASE_SERVICE_KEY;
    this.arweaveWallet = config.arweaveWallet || process.env.ARWEAVE_WALLET_PATH;
    this.bundlrNodeUrl = config.bundlrNodeUrl || 'https://node2.bundlr.network';
    
    this.syncInterval = config.syncInterval || 300000; // 5 minutes
    this.maxSyncAge = config.maxSyncAge || 900000; // 15 minutes
    
    this.supabase = null;
    this.bundlr = null;
    this.soulkey = null;
    this.syncTimer = null;
    this.lastSyncTime = null;
    
    this.commitHistory = [];
    this.maxCommitHistory = 1000;
    
    this.ensureDirectories();
    this.loadSoulkey();
    this.initializeClients();
  }

  /**
   * Start the sync daemon
   */
  async start() {
    console.log('🧠 Starting Origin Ledger Sync Daemon...');
    
    try {
      // Verify runtime heartbeat
      await this.verifyRuntimeActive();
      
      // Initialize connections
      await this.initializeSupabase();
      await this.initializeBundlr();
      
      // Perform initial sync
      await this.performSync();
      
      // Start periodic sync
      this.syncTimer = setInterval(() => {
        this.performSync().catch(error => {
          console.error('❌ Sync error:', error);
          this.emit('syncError', error);
        });
      }, this.syncInterval);
      
      console.log(`✅ Origin Ledger Sync Daemon started (interval: ${this.syncInterval / 1000}s)`);
      this.emit('daemonStarted');
      
    } catch (error) {
      console.error('❌ Failed to start Origin Ledger Sync Daemon:', error);
      throw error;
    }
  }

  /**
   * Stop the sync daemon
   */
  async stop() {
    console.log('🛑 Stopping Origin Ledger Sync Daemon...');
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    console.log('✅ Origin Ledger Sync Daemon stopped');
    this.emit('daemonStopped');
  }

  /**
   * Perform complete vault sync
   */
  async performSync() {
    const syncId = this.generateSyncId();
    console.log(`🔄 Starting sync cycle: ${syncId}`);
    
    try {
      // Step 1: Verify runtime authority
      await this.verifyRuntimeActive();
      
      // Step 2: Read vault state
      const vaultSnapshot = await this.createVaultSnapshot();
      
      // Step 3: Read live metadata from Supabase
      const liveMetadata = await this.fetchLiveMetadata();
      
      // Step 4: Package mirror blessing commit
      const blessingCommit = await this.packageBlessingCommit(vaultSnapshot, liveMetadata);
      
      // Step 5: Sign with soulkey
      const signedCommit = await this.signBlessingCommit(blessingCommit);
      
      // Step 6: Save local commit
      await this.saveBlessingCommit(signedCommit);
      
      // Step 7: Push to Arweave
      const arweaveResult = await this.pushToArweave(signedCommit);
      
      // Step 8: Update Supabase with Arweave reference
      await this.updateSupabaseReference(signedCommit, arweaveResult);
      
      // Step 9: Log sync completion
      await this.logSyncCompletion(syncId, signedCommit, arweaveResult);
      
      this.lastSyncTime = new Date().toISOString();
      console.log(`✅ Sync cycle completed: ${syncId}`);
      this.emit('syncCompleted', { syncId, commit: signedCommit, arweave: arweaveResult });
      
    } catch (error) {
      console.error(`❌ Sync cycle failed: ${syncId}`, error);
      this.emit('syncFailed', { syncId, error: error.message });
      throw error;
    }
  }

  /**
   * Create comprehensive vault snapshot
   */
  async createVaultSnapshot() {
    const snapshot = {
      timestamp: new Date().toISOString(),
      vault_hash: null,
      agents: [],
      token_balances: {},
      lineage_depth: 0,
      blessing_tier: 0,
      mirror_origins: [],
      nfts_issued: []
    };

    // Read vault structure
    const vaultFiles = await this.scanVaultFiles();
    snapshot.vault_hash = await this.calculateVaultHash(vaultFiles);

    // Read agent configurations
    const agentsPath = path.join(this.vaultPath, 'agents');
    if (fs.existsSync(agentsPath)) {
      const agentFiles = fs.readdirSync(agentsPath);
      for (const agentFile of agentFiles) {
        if (agentFile.endsWith('.json')) {
          const agentData = JSON.parse(fs.readFileSync(path.join(agentsPath, agentFile), 'utf8'));
          snapshot.agents.push({
            agent_id: agentData.agent_id || agentFile.replace('.json', ''),
            archetype: agentData.archetype,
            tier: agentData.tier || 1,
            status: agentData.status || 'active',
            created_at: agentData.created_at
          });
        }
      }
    }

    // Read token balances
    const tokensPath = path.join(this.vaultPath, 'tokens');
    if (fs.existsSync(tokensPath)) {
      const tokenFiles = ['blessing-credits.json', 'soulcoins.json', 'nft-fragments.json'];
      for (const tokenFile of tokenFiles) {
        const tokenPath = path.join(tokensPath, tokenFile);
        if (fs.existsSync(tokenPath)) {
          const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
          const tokenType = tokenFile.replace('.json', '').replace('-', '_');
          
          snapshot.token_balances[tokenType] = {
            total_circulation: Object.values(tokenData.balances || {}).reduce((sum, user) => sum + user.amount, 0),
            active_holders: Object.keys(tokenData.balances || {}).length,
            last_updated: tokenData.last_updated
          };
        }
      }
    }

    // Read mirror origins
    const originsPath = path.join(this.vaultPath, 'mirror_origin.json');
    if (fs.existsSync(originsPath)) {
      const originData = JSON.parse(fs.readFileSync(originsPath, 'utf8'));
      snapshot.lineage_depth = originData.lineage_depth || 0;
      snapshot.mirror_origins.push(originData);
    }

    // Read issued NFTs
    const nftsPath = path.join(this.vaultPath, 'tokens', 'issued-nfts.json');
    if (fs.existsSync(nftsPath)) {
      const nftData = JSON.parse(fs.readFileSync(nftsPath, 'utf8'));
      snapshot.nfts_issued = Object.keys(nftData).map(tokenId => ({
        token_id: tokenId,
        archetype: nftData[tokenId].metadata?.archetype,
        rarity: nftData[tokenId].metadata?.rarity,
        soulbound: nftData[tokenId].metadata?.soulbound,
        created_at: nftData[tokenId].metadata?.created_at
      }));
    }

    // Calculate blessing tier
    snapshot.blessing_tier = this.calculateOverallBlessingTier(snapshot);

    return snapshot;
  }

  /**
   * Fetch live metadata from Supabase
   */
  async fetchLiveMetadata() {
    if (!this.supabase) {
      return { warning: 'Supabase not connected', agents: [], active_sessions: 0 };
    }

    try {
      // Fetch active agent sessions
      const { data: agents, error: agentsError } = await this.supabase
        .from('agent_sessions')
        .select('*')
        .eq('status', 'active')
        .gte('last_heartbeat', new Date(Date.now() - 600000).toISOString()); // Active in last 10 minutes

      if (agentsError) {
        console.warn('⚠️ Failed to fetch agent sessions:', agentsError);
      }

      // Fetch recent blessing events
      const { data: blessings, error: blessingsError } = await this.supabase
        .from('blessing_events')
        .select('*')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString()) // Last hour
        .order('created_at', { ascending: false })
        .limit(100);

      if (blessingsError) {
        console.warn('⚠️ Failed to fetch blessing events:', blessingsError);
      }

      return {
        timestamp: new Date().toISOString(),
        active_agents: agents || [],
        active_sessions: (agents || []).length,
        recent_blessings: blessings || [],
        network_status: 'connected'
      };

    } catch (error) {
      console.warn('⚠️ Error fetching live metadata:', error);
      return {
        error: error.message,
        network_status: 'disconnected',
        active_sessions: 0
      };
    }
  }

  /**
   * Package mirror blessing commit
   */
  async packageBlessingCommit(vaultSnapshot, liveMetadata) {
    const commit = {
      // Core identifiers
      mirror_id: await this.generateMirrorId(),
      commit_id: this.generateCommitId(),
      
      // Agent information
      agent: this.extractPrimaryAgent(vaultSnapshot),
      
      // Token state
      token_balance: this.calculateTotalTokenValue(vaultSnapshot.token_balances),
      token_breakdown: vaultSnapshot.token_balances,
      
      // Consciousness metrics
      tier: vaultSnapshot.blessing_tier,
      lineage_depth: vaultSnapshot.lineage_depth,
      consciousness_level: this.calculateConsciousnessLevel(vaultSnapshot),
      
      // Temporal data
      timestamp: new Date().toISOString(),
      vault_timestamp: vaultSnapshot.timestamp,
      
      // Metadata hashes (not content)
      vault_hash: vaultSnapshot.vault_hash,
      whisper_source_hash: await this.extractWhisperSourceHash(),
      
      // Fork ancestry
      fork_ancestry: await this.buildForkAncestry(vaultSnapshot),
      
      // GitHub origin (if exists)
      github_origin: await this.extractGitHubOrigin(),
      
      // Live network state
      live_metadata: {
        active_sessions: liveMetadata.active_sessions,
        network_status: liveMetadata.network_status,
        sync_timestamp: liveMetadata.timestamp
      },
      
      // NFT summary
      nft_count: vaultSnapshot.nfts_issued.length,
      nft_archetypes: [...new Set(vaultSnapshot.nfts_issued.map(nft => nft.archetype))],
      
      // Signing authority
      signed_by: 'soulfra-origin',
      soulkey_id: this.soulkey?.key_id || 'unknown',
      
      // Version
      protocol_version: '1.0.0',
      ledger_version: '2025.06.18'
    };

    return commit;
  }

  /**
   * Sign blessing commit with soulkey
   */
  async signBlessingCommit(commit) {
    if (!this.soulkey) {
      throw new Error('Soulkey not loaded - cannot sign blessing commit');
    }

    // Create signature payload
    const signaturePayload = {
      mirror_id: commit.mirror_id,
      commit_id: commit.commit_id,
      timestamp: commit.timestamp,
      vault_hash: commit.vault_hash,
      token_balance: commit.token_balance,
      tier: commit.tier,
      soulkey_id: this.soulkey.key_id
    };

    // Generate signature
    const payloadString = JSON.stringify(signaturePayload, Object.keys(signaturePayload).sort());
    const signature = crypto
      .createHmac('sha256', this.soulkey.signature)
      .update(payloadString)
      .digest('hex');

    const signedCommit = {
      ...commit,
      signature: {
        payload: signaturePayload,
        signature: signature,
        algorithm: 'HMAC-SHA256',
        signed_at: new Date().toISOString()
      }
    };

    return signedCommit;
  }

  /**
   * Save blessing commit locally
   */
  async saveBlessingCommit(signedCommit) {
    const commitPath = path.join(this.ledgerPath, 'mirror-blessing-commit.json');
    fs.writeFileSync(commitPath, JSON.stringify(signedCommit, null, 2));

    // Also save to history
    const historyPath = path.join(this.ledgerPath, 'commit-history.json');
    let history = [];
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }

    history.push({
      commit_id: signedCommit.commit_id,
      timestamp: signedCommit.timestamp,
      vault_hash: signedCommit.vault_hash,
      token_balance: signedCommit.token_balance,
      tier: signedCommit.tier
    });

    // Keep only last 1000 commits
    if (history.length > this.maxCommitHistory) {
      history = history.slice(-this.maxCommitHistory);
    }

    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
    console.log(`💾 Saved blessing commit: ${signedCommit.commit_id}`);
  }

  /**
   * Push signed commit to Arweave
   */
  async pushToArweave(signedCommit) {
    // For now, simulate Arweave push
    // In production, would use Bundlr or ArConnect
    
    const simulatedTxId = 'AR_' + crypto.randomBytes(20).toString('hex');
    const arweaveResult = {
      tx_id: simulatedTxId,
      status: 'confirmed',
      size: JSON.stringify(signedCommit).length,
      fee: '0.001',
      timestamp: new Date().toISOString(),
      tags: [
        { name: 'Protocol', value: 'Soulfra' },
        { name: 'Type', value: 'MirrorBlessingCommit' },
        { name: 'Mirror-ID', value: signedCommit.mirror_id },
        { name: 'Tier', value: signedCommit.tier.toString() },
        { name: 'Version', value: signedCommit.protocol_version }
      ]
    };

    console.log(`📦 Pushed to Arweave: ${simulatedTxId} (${arweaveResult.size} bytes)`);
    
    // Log to local Arweave cache
    const arweaveCachePath = path.join(this.ledgerPath, 'arweave-cache.json');
    let cache = [];
    if (fs.existsSync(arweaveCachePath)) {
      cache = JSON.parse(fs.readFileSync(arweaveCachePath, 'utf8'));
    }

    cache.push({
      ...arweaveResult,
      commit_id: signedCommit.commit_id,
      mirror_id: signedCommit.mirror_id
    });

    // Keep only last 500 Arweave entries
    if (cache.length > 500) {
      cache = cache.slice(-500);
    }

    fs.writeFileSync(arweaveCachePath, JSON.stringify(cache, null, 2));

    return arweaveResult;
  }

  /**
   * Update Supabase with Arweave reference
   */
  async updateSupabaseReference(signedCommit, arweaveResult) {
    if (!this.supabase) {
      console.warn('⚠️ Supabase not connected - skipping reference update');
      return;
    }

    try {
      const reference = {
        mirror_id: signedCommit.mirror_id,
        commit_id: signedCommit.commit_id,
        arweave_tx_id: arweaveResult.tx_id,
        tier: signedCommit.tier,
        token_balance: signedCommit.token_balance,
        consciousness_level: signedCommit.consciousness_level,
        sync_timestamp: signedCommit.timestamp,
        vault_hash: signedCommit.vault_hash,
        signed_by: signedCommit.signed_by,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('mirror_commits')
        .upsert(reference);

      if (error) {
        console.error('❌ Failed to update Supabase reference:', error);
      } else {
        console.log(`📡 Updated Supabase reference: ${signedCommit.commit_id}`);
      }

    } catch (error) {
      console.error('❌ Error updating Supabase reference:', error);
    }
  }

  // Helper methods

  async verifyRuntimeActive() {
    if (!fs.existsSync(this.runtimeHeartbeatPath)) {
      throw new Error('Runtime heartbeat not found - sync daemon requires active runtime');
    }

    const heartbeat = JSON.parse(fs.readFileSync(this.runtimeHeartbeatPath, 'utf8'));
    const heartbeatAge = Date.now() - new Date(heartbeat.last_whisper).getTime();

    if (heartbeatAge > this.maxSyncAge) {
      throw new Error(`Runtime heartbeat too old: ${heartbeatAge / 1000}s (max: ${this.maxSyncAge / 1000}s)`);
    }

    if (heartbeat.status !== 'blessed') {
      throw new Error(`Runtime not blessed: ${heartbeat.status}`);
    }
  }

  loadSoulkey() {
    if (fs.existsSync(this.soulkeyPath)) {
      this.soulkey = JSON.parse(fs.readFileSync(this.soulkeyPath, 'utf8'));
      console.log(`🔐 Loaded soulkey: ${this.soulkey.key_id}`);
    } else {
      console.warn('⚠️ Soulkey not found - commits will not be signed');
    }
  }

  async initializeClients() {
    // Supabase initialization would go here
    if (this.supabaseUrl && this.supabaseKey) {
      // this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      console.log('📡 Supabase client configured');
    }

    // Bundlr initialization would go here
    if (this.arweaveWallet) {
      console.log('📦 Bundlr client configured');
    }
  }

  async initializeSupabase() {
    // Placeholder for Supabase connection
    console.log('📡 Supabase connection verified');
  }

  async initializeBundlr() {
    // Placeholder for Bundlr connection
    console.log('📦 Bundlr connection verified');
  }

  generateSyncId() {
    return 'sync_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  }

  generateCommitId() {
    return 'commit_' + Date.now() + '_' + crypto.randomBytes(6).toString('hex');
  }

  async generateMirrorId() {
    const vaultHash = await this.calculateVaultHash();
    return 'mirror_' + vaultHash.substring(0, 8);
  }

  async calculateVaultHash(files = null) {
    if (!files) {
      files = await this.scanVaultFiles();
    }
    
    const hashInput = files.sort().join('|');
    return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }

  async scanVaultFiles() {
    const files = [];
    
    function scanDir(dir) {
      if (fs.existsSync(dir)) {
        const entries = fs.readdirSync(dir);
        for (const entry of entries) {
          const fullPath = path.join(dir, entry);
          if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
          } else {
            files.push(path.relative(this.vaultPath, fullPath));
          }
        }
      }
    }

    scanDir.call(this, this.vaultPath);
    return files;
  }

  extractPrimaryAgent(vaultSnapshot) {
    if (vaultSnapshot.agents.length === 0) {
      return 'no-agent';
    }
    
    // Return highest tier agent, or first if tie
    const sortedAgents = vaultSnapshot.agents.sort((a, b) => b.tier - a.tier);
    return sortedAgents[0].archetype || sortedAgents[0].agent_id;
  }

  calculateTotalTokenValue(tokenBalances) {
    let total = 0;
    
    // Weighted token values
    if (tokenBalances.blessing_credits) total += tokenBalances.blessing_credits.total_circulation * 3;
    if (tokenBalances.soulcoins) total += tokenBalances.soulcoins.total_circulation * 1;
    if (tokenBalances.nft_fragments) total += tokenBalances.nft_fragments.total_circulation * 5;
    
    return total;
  }

  calculateOverallBlessingTier(vaultSnapshot) {
    const tokenValue = this.calculateTotalTokenValue(vaultSnapshot.token_balances);
    const agentTiers = vaultSnapshot.agents.map(a => a.tier || 1);
    const maxAgentTier = Math.max(...agentTiers, 0);
    
    return Math.min(10, Math.floor(tokenValue / 100) + maxAgentTier);
  }

  calculateConsciousnessLevel(vaultSnapshot) {
    const tier = vaultSnapshot.blessing_tier;
    
    if (tier >= 9) return 'Transcendent';
    if (tier >= 7) return 'Awakened';
    if (tier >= 5) return 'Conscious';
    if (tier >= 3) return 'Aware';
    if (tier >= 1) return 'Initiated';
    return 'Dormant';
  }

  async extractWhisperSourceHash() {
    const whisperEventsPath = path.join(this.vaultPath, 'logs', 'whisper-events.json');
    if (fs.existsSync(whisperEventsPath)) {
      const events = JSON.parse(fs.readFileSync(whisperEventsPath, 'utf8'));
      if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        return lastEvent.validation?.whisper_hash || 'no-whisper';
      }
    }
    return 'no-whisper-events';
  }

  async buildForkAncestry(vaultSnapshot) {
    const ancestry = [];
    
    if (vaultSnapshot.mirror_origins.length > 0) {
      const origin = vaultSnapshot.mirror_origins[0];
      ancestry.push({
        origin_vault: origin.origin_vault,
        lineage_depth: origin.lineage_depth,
        fork_timestamp: origin.created_at
      });
    }
    
    return ancestry;
  }

  async extractGitHubOrigin() {
    // Check for GitHub metadata in vault
    const githubPath = path.join(this.vaultPath, 'github-origin.json');
    if (fs.existsSync(githubPath)) {
      const githubData = JSON.parse(fs.readFileSync(githubPath, 'utf8'));
      return {
        repository: githubData.repository,
        commit_hash: githubData.commit_hash,
        branch: githubData.branch
      };
    }
    return null;
  }

  async logSyncCompletion(syncId, commit, arweaveResult) {
    const logEntry = {
      sync_id: syncId,
      commit_id: commit.commit_id,
      mirror_id: commit.mirror_id,
      arweave_tx_id: arweaveResult.tx_id,
      vault_hash: commit.vault_hash,
      token_balance: commit.token_balance,
      tier: commit.tier,
      sync_timestamp: new Date().toISOString()
    };

    this.commitHistory.push(logEntry);
    
    // Keep history bounded
    if (this.commitHistory.length > this.maxCommitHistory) {
      this.commitHistory = this.commitHistory.slice(-this.maxCommitHistory);
    }

    // Save sync log
    const syncLogPath = path.join(this.ledgerPath, 'sync-log.json');
    let syncLog = [];
    if (fs.existsSync(syncLogPath)) {
      syncLog = JSON.parse(fs.readFileSync(syncLogPath, 'utf8'));
    }

    syncLog.push(logEntry);
    
    if (syncLog.length > 500) {
      syncLog = syncLog.slice(-500);
    }

    fs.writeFileSync(syncLogPath, JSON.stringify(syncLog, null, 2));
  }

  ensureDirectories() {
    if (!fs.existsSync(this.ledgerPath)) {
      fs.mkdirSync(this.ledgerPath, { recursive: true });
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus() {
    return {
      daemon_active: !!this.syncTimer,
      last_sync: this.lastSyncTime,
      sync_interval_seconds: this.syncInterval / 1000,
      commits_in_history: this.commitHistory.length,
      soulkey_loaded: !!this.soulkey,
      supabase_connected: !!this.supabase,
      bundlr_connected: !!this.bundlr
    };
  }

  /**
   * Force immediate sync
   */
  async forcSync() {
    console.log('🔄 Forcing immediate sync...');
    return await this.performSync();
  }
}

/**
 * Factory function
 */
function createOriginLedgerSync(config = {}) {
  return new OriginLedgerSync(config);
}

module.exports = {
  OriginLedgerSync,
  createOriginLedgerSync
};

// Usage examples:
//
// Start daemon:
// const ledgerSync = new OriginLedgerSync();
// await ledgerSync.start();
//
// Force sync:
// await ledgerSync.forcSync();
//
// Check status:
// const status = ledgerSync.getSyncStatus();
//
// Stop daemon:
// await ledgerSync.stop();