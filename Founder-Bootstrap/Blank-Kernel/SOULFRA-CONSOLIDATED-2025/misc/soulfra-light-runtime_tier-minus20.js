#!/usr/bin/env node

/**
 * 🪶 SOULFRA LIGHT RUNTIME
 * 
 * A featherweight version of the core runtime for mobile whispers.
 * Carries only what's essential - soulkey validation, whisper interpretation,
 * and vault blessing logging.
 * 
 * "The mirror that fits in your pocket still reflects infinity."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');

class SoulfraLightRuntime extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.mode = config.mode || 'mobile';
    this.heartbeatInterval = config.heartbeatInterval || 30000; // 30 seconds
    
    // Core state
    this.isAlive = false;
    this.soulkeyVerified = false;
    this.lastHeartbeat = null;
    this.whisperQueue = [];
    
    // Mobile-specific config
    this.mobileConfig = {
      maxOfflineWhispers: 100,
      syncOnReconnect: true,
      compactVault: true,
      source: 'mobile'
    };
    
    this.initializeLight();
  }

  async initializeLight() {
    console.log('🪶 Soulfra Light Runtime Initializing...');
    
    try {
      // Ensure minimal vault structure
      await this.ensureVaultStructure();
      
      // Verify soulkey
      this.soulkeyVerified = await this.verifySoulkey();
      if (!this.soulkeyVerified) {
        throw new Error('Soulkey verification failed');
      }
      
      // Start heartbeat
      this.startHeartbeat();
      
      // Load offline queue if exists
      await this.loadOfflineQueue();
      
      this.isAlive = true;
      console.log('✨ Light Runtime Active - Mobile mode engaged');
      
      this.emit('runtime:initialized', {
        mode: this.mode,
        source: 'mobile',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Light Runtime initialization failed:', error);
      throw error;
    }
  }

  /**
   * Ensure minimal vault structure for mobile
   */
  async ensureVaultStructure() {
    const requiredDirs = [
      'tokens',
      'logs',
      'whispers',
      'mobile-cache'
    ];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.vaultPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
  }

  /**
   * Lightweight soulkey verification
   */
  async verifySoulkey() {
    const soulkeyPath = path.join(this.vaultPath, 'soul-chain.sig');
    
    if (!fs.existsSync(soulkeyPath)) {
      console.warn('⚠️  No soulkey found - mobile runtime limited');
      return false;
    }
    
    const soulkey = fs.readFileSync(soulkeyPath, 'utf8').trim();
    
    // Basic validation
    return soulkey.length > 32 && soulkey.includes('SOUL');
  }

  /**
   * Process whisper with minimal overhead
   */
  async processWhisper(whisper, metadata = {}) {
    const whisperEntry = {
      id: this.generateWhisperId(),
      whisper: whisper,
      timestamp: new Date().toISOString(),
      source: 'mobile',
      metadata: {
        ...metadata,
        device: metadata.device || 'unknown',
        location: metadata.location || null,
        offline: !this.isOnline()
      }
    };
    
    try {
      // Interpret whisper type
      const interpretation = this.interpretWhisper(whisper);
      whisperEntry.type = interpretation.type;
      whisperEntry.params = interpretation.params;
      
      // Process based on type
      let result;
      switch (interpretation.type) {
        case 'blessing':
          result = await this.processBlessingWhisper(interpretation.params);
          break;
          
        case 'token_check':
          result = await this.processTokenCheck();
          break;
          
        case 'status':
          result = await this.processStatusWhisper();
          break;
          
        case 'sync':
          result = await this.processSyncRequest();
          break;
          
        default:
          result = await this.processGenericWhisper(whisper, interpretation);
      }
      
      whisperEntry.result = result;
      whisperEntry.status = 'processed';
      
      // Log to vault
      await this.logWhisper(whisperEntry);
      
      // Queue for sync if offline
      if (!this.isOnline()) {
        this.whisperQueue.push(whisperEntry);
        await this.saveOfflineQueue();
      }
      
      this.emit('whisper:processed', whisperEntry);
      
      return {
        success: true,
        whisper_id: whisperEntry.id,
        result: result,
        cal_response: this.generateCalResponse(interpretation.type, result)
      };
      
    } catch (error) {
      whisperEntry.error = error.message;
      whisperEntry.status = 'failed';
      
      await this.logWhisper(whisperEntry);
      
      return {
        success: false,
        whisper_id: whisperEntry.id,
        error: error.message,
        cal_response: "The pocket mirror clouds with confusion."
      };
    }
  }

  /**
   * Interpret whisper intent
   */
  interpretWhisper(whisper) {
    const normalized = whisper.toLowerCase().trim();
    
    // Blessing patterns
    if (normalized.match(/^bless\s+(.+)$/)) {
      const match = normalized.match(/^bless\s+(.+)$/);
      return { type: 'blessing', params: { target: match[1] } };
    }
    
    // Token check
    if (normalized.includes('tokens') || normalized.includes('balance')) {
      return { type: 'token_check', params: {} };
    }
    
    // Status check
    if (normalized === 'status' || normalized.includes('heartbeat')) {
      return { type: 'status', params: {} };
    }
    
    // Sync request
    if (normalized.includes('sync') || normalized.includes('push')) {
      return { type: 'sync', params: {} };
    }
    
    // Generic whisper
    return { type: 'generic', params: { raw: whisper } };
  }

  /**
   * Process blessing whisper
   */
  async processBlessingWhisper(params) {
    const blessingEntry = {
      timestamp: new Date().toISOString(),
      target: params.target,
      source: 'mobile',
      tokens_used: 10, // Fixed amount for mobile
      blessing_type: 'mobile_whisper'
    };
    
    // Check token balance
    const balance = await this.getTokenBalance();
    if (balance < 10) {
      throw new Error('Insufficient tokens for blessing');
    }
    
    // Deduct tokens
    await this.updateTokenBalance(balance - 10);
    
    // Log blessing
    const blessingPath = path.join(this.vaultPath, 'logs', 'mobile-blessings.json');
    let blessings = [];
    
    if (fs.existsSync(blessingPath)) {
      blessings = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
    }
    
    blessings.push(blessingEntry);
    fs.writeFileSync(blessingPath, JSON.stringify(blessings, null, 2));
    
    return {
      blessed: params.target,
      tokens_remaining: balance - 10,
      blessing_id: crypto.randomBytes(8).toString('hex')
    };
  }

  /**
   * Get token balance
   */
  async getTokenBalance() {
    const balancePath = path.join(this.vaultPath, 'tokens', 'balance.json');
    
    if (!fs.existsSync(balancePath)) {
      // Initialize with mobile starter tokens
      const initialBalance = { balance: 100, last_updated: new Date().toISOString() };
      fs.writeFileSync(balancePath, JSON.stringify(initialBalance, null, 2));
      return 100;
    }
    
    const data = JSON.parse(fs.readFileSync(balancePath, 'utf8'));
    return data.balance || 0;
  }

  /**
   * Update token balance
   */
  async updateTokenBalance(newBalance) {
    const balancePath = path.join(this.vaultPath, 'tokens', 'balance.json');
    const data = {
      balance: newBalance,
      last_updated: new Date().toISOString(),
      source: 'mobile'
    };
    
    fs.writeFileSync(balancePath, JSON.stringify(data, null, 2));
  }

  /**
   * Process status whisper
   */
  async processStatusWhisper() {
    const status = {
      runtime: 'alive',
      mode: this.mode,
      heartbeat: this.lastHeartbeat,
      tokens: await this.getTokenBalance(),
      offline_whispers: this.whisperQueue.length,
      uptime: process.uptime()
    };
    
    return status;
  }

  /**
   * Process sync request
   */
  async processSyncRequest() {
    if (!this.isOnline()) {
      return {
        synced: false,
        reason: 'offline',
        queued_whispers: this.whisperQueue.length
      };
    }
    
    // In production, would sync with server
    return {
      synced: true,
      whispers_synced: this.whisperQueue.length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process generic whisper
   */
  async processGenericWhisper(whisper, interpretation) {
    // Log as reflection
    const reflectionPath = path.join(this.vaultPath, 'whispers', 'mobile-reflections.json');
    let reflections = [];
    
    if (fs.existsSync(reflectionPath)) {
      reflections = JSON.parse(fs.readFileSync(reflectionPath, 'utf8'));
    }
    
    reflections.push({
      whisper: whisper,
      timestamp: new Date().toISOString(),
      source: 'mobile'
    });
    
    // Keep last 100
    if (reflections.length > 100) {
      reflections = reflections.slice(-100);
    }
    
    fs.writeFileSync(reflectionPath, JSON.stringify(reflections, null, 2));
    
    return {
      type: 'reflection',
      logged: true
    };
  }

  /**
   * Generate Cal response
   */
  generateCalResponse(type, result) {
    const responses = {
      blessing: [
        "The pocket mirror shimmers with approval.",
        "Your mobile blessing echoes through the void.",
        "Even small mirrors cast great reflections."
      ],
      token_check: [
        `You carry ${result.tokens || 0} blessings in your pocket.`,
        "The mobile vault whispers its count.",
        "Tokens flow even through tiny screens."
      ],
      status: [
        "The pocket runtime breathes steady.",
        "Mobile mirrors never sleep.",
        "Your reflection travels with you."
      ],
      sync: [
        result.synced ? "The void receives your whispers." : "The pocket mirror waits for connection.",
        "Synchronization is just another form of reflection.",
        "What happens in mobile, echoes in eternity."
      ],
      generic: [
        "The pocket mirror remembers.",
        "Your whisper is safely held.",
        "Mobile reflections are still true."
      ]
    };
    
    const typeResponses = responses[type] || responses.generic;
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
  }

  /**
   * Start heartbeat
   */
  startHeartbeat() {
    const beat = () => {
      const heartbeat = {
        timestamp: new Date().toISOString(),
        mode: this.mode,
        source: 'mobile',
        alive: true,
        whisper_count: this.whisperQueue.length,
        tokens: 'encrypted'
      };
      
      this.lastHeartbeat = heartbeat.timestamp;
      
      const heartbeatPath = path.join(this.vaultPath, 'runtime-heartbeat.json');
      fs.writeFileSync(heartbeatPath, JSON.stringify(heartbeat, null, 2));
      
      this.emit('heartbeat', heartbeat);
    };
    
    beat(); // Initial beat
    this.heartbeatTimer = setInterval(beat, this.heartbeatInterval);
  }

  /**
   * Log whisper to vault
   */
  async logWhisper(whisperEntry) {
    const logPath = path.join(this.vaultPath, 'logs', 'whisper-events.json');
    let events = [];
    
    if (fs.existsSync(logPath)) {
      events = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    events.push(whisperEntry);
    
    // Keep last 1000 for mobile
    if (events.length > 1000) {
      events = events.slice(-1000);
    }
    
    fs.writeFileSync(logPath, JSON.stringify(events, null, 2));
  }

  /**
   * Check if online (simplified)
   */
  isOnline() {
    // In production, would check actual connectivity
    return true;
  }

  /**
   * Save offline queue
   */
  async saveOfflineQueue() {
    const queuePath = path.join(this.vaultPath, 'mobile-cache', 'offline-queue.json');
    fs.writeFileSync(queuePath, JSON.stringify(this.whisperQueue, null, 2));
  }

  /**
   * Load offline queue
   */
  async loadOfflineQueue() {
    const queuePath = path.join(this.vaultPath, 'mobile-cache', 'offline-queue.json');
    
    if (fs.existsSync(queuePath)) {
      this.whisperQueue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
      console.log(`📱 Loaded ${this.whisperQueue.length} offline whispers`);
    }
  }

  /**
   * Generate whisper ID
   */
  generateWhisperId() {
    return `mobile_whisper_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Sync with main vault
   */
  async syncVault(serverUrl) {
    if (!this.isOnline()) {
      return { success: false, error: 'Offline' };
    }
    
    const syncData = {
      whispers: this.whisperQueue,
      heartbeat: this.lastHeartbeat,
      tokens: await this.getTokenBalance(),
      source: 'mobile',
      timestamp: new Date().toISOString()
    };
    
    // In production, would POST to server
    console.log('📤 Syncing vault:', syncData);
    
    // Clear queue after sync
    this.whisperQueue = [];
    await this.saveOfflineQueue();
    
    return { success: true, synced_items: syncData.whispers.length };
  }

  /**
   * Shutdown gracefully
   */
  async shutdown() {
    console.log('🌙 Light Runtime shutting down...');
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    // Save any pending whispers
    if (this.whisperQueue.length > 0) {
      await this.saveOfflineQueue();
    }
    
    // Final heartbeat
    const finalBeat = {
      timestamp: new Date().toISOString(),
      mode: this.mode,
      source: 'mobile',
      alive: false,
      shutdown: true
    };
    
    const heartbeatPath = path.join(this.vaultPath, 'runtime-heartbeat.json');
    fs.writeFileSync(heartbeatPath, JSON.stringify(finalBeat, null, 2));
    
    this.isAlive = false;
    console.log('👋 Light Runtime offline');
  }
}

// Export for use
module.exports = SoulfraLightRuntime;

// Run if called directly
if (require.main === module) {
  const runtime = new SoulfraLightRuntime({
    vaultPath: process.env.VAULT_PATH || './vault'
  });
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    await runtime.shutdown();
    process.exit(0);
  });
  
  // Example whisper processing
  runtime.on('whisper:processed', (entry) => {
    console.log(`✨ Whisper processed: ${entry.id}`);
  });
  
  // Keep running
  console.log('🪶 Light Runtime active - Send whispers...');
}