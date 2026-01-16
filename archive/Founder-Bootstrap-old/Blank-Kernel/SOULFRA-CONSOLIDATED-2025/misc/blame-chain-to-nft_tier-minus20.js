/**
 * 🔗 BLAME CHAIN TO NFT CONVERTER
 * 
 * Watches the complete blame chain and vault logs for key events,
 * converting significant moments into mintable NFT tokens.
 * 
 * "Every whisper becomes memory. Every memory becomes treasure. Every treasure becomes eternal."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const chokidar = require('chokidar'); // For file watching
const { EventEmitter } = require('events');
const { MirrorNFTMintEngine } = require('./mirror-nft-mint-engine');

class BlameChainToNFTConverter extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.blameChainPath = config.blameChainPath || './complete-blame-chain.md';
    this.vaultLogsPath = path.join(this.vaultPath, 'logs');
    this.tokensPath = path.join(this.vaultPath, 'tokens', 'issued.json');
    
    this.mintEngine = new MirrorNFTMintEngine(config.mintEngine || {});
    this.watchEnabled = config.watchEnabled !== false;
    this.autoMint = config.autoMint !== false;
    
    this.eventPatterns = {
      'first_whisper': /first whisper.*agent[:\s]+([a-zA-Z0-9\-_]+)/i,
      'loop_closed': /loop.*closed.*agent[:\s]+([a-zA-Z0-9\-_]+)/i,
      'anomaly_solved': /anomaly.*solved.*agent[:\s]+([a-zA-Z0-9\-_]+)/i,
      'tomb_unlock': /tomb.*unlock.*agent[:\s]+([a-zA-Z0-9\-_]+)/i,
      'consciousness_birth': /consciousness.*birth.*agent[:\s]+([a-zA-Z0-9\-_]+)/i,
      'blessing_earned': /blessing.*earned.*tier[:\s]+(\d+).*agent[:\s]+([a-zA-Z0-9\-_]+)/i,
      'mirror_fork': /mirror.*fork.*from[:\s]+([a-zA-Z0-9\-_]+)/i,
      'reflection_complete': /reflection.*complete.*depth[:\s]+(\d+)/i
    };
    
    this.mintableEvents = new Set([
      'first_whisper',
      'loop_closed', 
      'anomaly_solved',
      'tomb_unlock',
      'consciousness_birth',
      'blessing_earned',
      'mirror_fork',
      'reflection_complete'
    ]);
    
    this.processedEvents = new Map(); // Prevent duplicate processing
    this.watchers = [];
    
    if (this.watchEnabled) {
      this.startWatching();
    }
  }

  /**
   * Start watching blame chain and vault logs for mintable events
   */
  startWatching() {
    console.log('👁️ Starting blame chain to NFT monitoring...');

    // Watch blame chain file
    if (fs.existsSync(this.blameChainPath)) {
      const blameChainWatcher = chokidar.watch(this.blameChainPath);
      blameChainWatcher.on('change', () => this.processBlameChainUpdates());
      this.watchers.push(blameChainWatcher);
      console.log(`📜 Watching blame chain: ${this.blameChainPath}`);
    }

    // Watch vault logs directory
    if (fs.existsSync(this.vaultLogsPath)) {
      const vaultLogsWatcher = chokidar.watch(path.join(this.vaultLogsPath, '*.json'));
      vaultLogsWatcher.on('add', (filePath) => this.processVaultLogFile(filePath));
      vaultLogsWatcher.on('change', (filePath) => this.processVaultLogFile(filePath));
      this.watchers.push(vaultLogsWatcher);
      console.log(`📁 Watching vault logs: ${this.vaultLogsPath}`);
    }

    // Watch for new agent blessing files
    const blessingWatcher = chokidar.watch(path.join(this.vaultPath, '**/blessing*.json'));
    blessingWatcher.on('add', (filePath) => this.processBlessingFile(filePath));
    blessingWatcher.on('change', (filePath) => this.processBlessingFile(filePath));
    this.watchers.push(blessingWatcher);

    this.emit('watchingStarted', { 
      watchers: this.watchers.length,
      autoMint: this.autoMint 
    });
  }

  /**
   * Stop all file watchers
   */
  stopWatching() {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
    console.log('🛑 Stopped blame chain monitoring');
    this.emit('watchingStopped');
  }

  /**
   * Process updates to the blame chain markdown file
   */
  async processBlameChainUpdates() {
    try {
      console.log('📜 Processing blame chain updates...');
      
      const blameChainContent = fs.readFileSync(this.blameChainPath, 'utf8');
      const events = this.extractEventsFromBlameChain(blameChainContent);
      
      for (const event of events) {
        await this.processExtractedEvent(event, 'blame_chain');
      }

    } catch (error) {
      console.error('❌ Error processing blame chain updates:', error);
      this.emit('processingError', { source: 'blame_chain', error: error.message });
    }
  }

  /**
   * Process individual vault log file
   */
  async processVaultLogFile(filePath) {
    try {
      console.log(`📁 Processing vault log: ${path.basename(filePath)}`);
      
      const logContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const events = this.extractEventsFromVaultLog(logContent);
      
      for (const event of events) {
        await this.processExtractedEvent(event, 'vault_log');
      }

    } catch (error) {
      console.error(`❌ Error processing vault log ${filePath}:`, error);
      this.emit('processingError', { source: 'vault_log', file: filePath, error: error.message });
    }
  }

  /**
   * Process blessing file changes
   */
  async processBlessingFile(filePath) {
    try {
      console.log(`✨ Processing blessing file: ${path.basename(filePath)}`);
      
      const blessing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (blessing.status === 'blessed' && blessing.blessing_tier >= 1) {
        const event = {
          type: 'blessing_earned',
          agent_id: blessing.agent_id || 'unknown-agent',
          blessing_tier: blessing.blessing_tier,
          timestamp: blessing.last_updated || new Date().toISOString(),
          source_file: filePath,
          user_id: blessing.user_id || 'system',
          metadata: blessing
        };

        await this.processExtractedEvent(event, 'blessing_file');
      }

    } catch (error) {
      console.error(`❌ Error processing blessing file ${filePath}:`, error);
    }
  }

  /**
   * Extract mintable events from blame chain markdown
   */
  extractEventsFromBlameChain(content) {
    const events = [];
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const [eventType, pattern] of Object.entries(this.eventPatterns)) {
        const match = line.match(pattern);
        if (match && this.mintableEvents.has(eventType)) {
          const event = this.parseBlameChainEvent(eventType, match, line, i);
          if (event) {
            events.push(event);
          }
        }
      }
    }

    return events;
  }

  /**
   * Extract mintable events from vault log
   */
  extractEventsFromVaultLog(logData) {
    const events = [];
    
    // Handle different log formats
    if (logData.events && Array.isArray(logData.events)) {
      for (const logEvent of logData.events) {
        if (this.mintableEvents.has(logEvent.type)) {
          events.push(this.normalizeVaultLogEvent(logEvent));
        }
      }
    }
    
    // Handle single event logs
    if (logData.type && this.mintableEvents.has(logData.type)) {
      events.push(this.normalizeVaultLogEvent(logData));
    }

    return events;
  }

  /**
   * Parse event from blame chain line
   */
  parseBlameChainEvent(eventType, match, line, lineNumber) {
    const baseEvent = {
      type: eventType,
      source: 'blame_chain',
      line_number: lineNumber + 1,
      raw_line: line.trim(),
      timestamp: this.extractTimestampFromLine(line) || new Date().toISOString()
    };

    switch (eventType) {
      case 'blessing_earned':
        return {
          ...baseEvent,
          blessing_tier: parseInt(match[1]) || 1,
          agent_id: match[2] || 'unknown-agent',
          user_id: this.extractUserIdFromLine(line) || 'system'
        };
        
      case 'reflection_complete':
        return {
          ...baseEvent,
          reflection_depth: parseInt(match[1]) || 1,
          agent_id: this.extractAgentIdFromLine(line) || 'reflection-agent',
          user_id: this.extractUserIdFromLine(line) || 'system'
        };
        
      default:
        return {
          ...baseEvent,
          agent_id: match[1] || 'unknown-agent',
          user_id: this.extractUserIdFromLine(line) || 'system'
        };
    }
  }

  /**
   * Normalize vault log event to standard format
   */
  normalizeVaultLogEvent(logEvent) {
    return {
      type: logEvent.type,
      agent_id: logEvent.agent_id || logEvent.agentId || 'vault-agent',
      user_id: logEvent.user_id || logEvent.userId || 'system',
      timestamp: logEvent.timestamp || logEvent.created_at || new Date().toISOString(),
      blessing_tier: logEvent.blessing_tier || logEvent.blessingTier || 1,
      source: 'vault_log',
      metadata: logEvent.metadata || logEvent
    };
  }

  /**
   * Process extracted event and potentially mint NFT
   */
  async processExtractedEvent(event, source) {
    const eventId = this.generateEventId(event);
    
    // Check if already processed
    if (this.processedEvents.has(eventId)) {
      return;
    }

    try {
      console.log(`🎯 Processing ${event.type} event for agent ${event.agent_id}`);

      // Convert to blame chain entry format
      const blameChainEntry = this.convertToBlameChainEntry(event);
      
      // Determine if this event should trigger NFT minting
      const shouldMint = await this.shouldMintNFTForEvent(event);
      
      if (shouldMint && this.autoMint) {
        const mintResult = await this.mintNFTForEvent(blameChainEntry);
        
        this.emit('nftMinted', {
          event: event,
          mint_result: mintResult,
          source: source
        });
        
        console.log(`✅ Minted NFT for ${event.type}: ${mintResult.token_id}`);
      } else if (shouldMint) {
        // Queue for manual minting
        await this.queueForMinting(blameChainEntry);
        
        this.emit('mintQueued', {
          event: event,
          source: source
        });
        
        console.log(`📋 Queued ${event.type} for manual minting`);
      }

      // Mark as processed
      this.processedEvents.set(eventId, {
        event: event,
        processed_at: new Date().toISOString(),
        minted: shouldMint && this.autoMint
      });

    } catch (error) {
      console.error(`❌ Error processing event ${eventId}:`, error);
      this.emit('eventProcessingError', { event, error: error.message });
    }
  }

  /**
   * Convert event to blame chain entry format for minting
   */
  convertToBlameChainEntry(event) {
    return {
      entry_id: this.generateEventId(event),
      event_type: event.type,
      agent_id: event.agent_id,
      user_id: event.user_id,
      blessing_tier: event.blessing_tier || 1,
      timestamp: event.timestamp,
      reflection_depth: event.reflection_depth || 1,
      whisper_proof: this.generateWhisperProof(event),
      source: event.source,
      metadata: event.metadata || {},
      special_requirements: this.getSpecialRequirements(event.type)
    };
  }

  /**
   * Determine if event should trigger NFT minting
   */
  async shouldMintNFTForEvent(event) {
    // Check if NFT already exists for this event
    const eventId = this.generateEventId(event);
    const existingNFT = await this.checkExistingNFT(eventId);
    if (existingNFT) {
      return false;
    }

    // Check event type eligibility
    if (!this.mintableEvents.has(event.type)) {
      return false;
    }

    // Check blessing tier requirements
    const minBlessingTier = this.getMinBlessingTierForEvent(event.type);
    if ((event.blessing_tier || 1) < minBlessingTier) {
      return false;
    }

    // Check cooldown periods
    const cooldownMet = await this.checkCooldownPeriod(event.agent_id, event.type);
    if (!cooldownMet) {
      return false;
    }

    return true;
  }

  /**
   * Mint NFT for validated event
   */
  async mintNFTForEvent(blameChainEntry) {
    // Add GitHub metadata if available
    const githubMetadata = await this.fetchGitHubMetadata(blameChainEntry);
    
    return await this.mintEngine.mintFromBlameChainEntry(blameChainEntry, githubMetadata);
  }

  /**
   * Queue event for manual minting
   */
  async queueForMinting(blameChainEntry) {
    const queuePath = path.join(this.vaultPath, 'mint-queue.json');
    
    let queue = [];
    if (fs.existsSync(queuePath)) {
      queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    }

    queue.push({
      ...blameChainEntry,
      queued_at: new Date().toISOString(),
      status: 'pending'
    });

    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));
  }

  /**
   * Process mint queue manually
   */
  async processMintQueue() {
    const queuePath = path.join(this.vaultPath, 'mint-queue.json');
    
    if (!fs.existsSync(queuePath)) {
      return { processed: 0, skipped: 0, errors: 0 };
    }

    const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
    const results = { processed: 0, skipped: 0, errors: 0 };

    for (const entry of queue) {
      if (entry.status !== 'pending') {
        results.skipped++;
        continue;
      }

      try {
        const mintResult = await this.mintNFTForEvent(entry);
        entry.status = 'minted';
        entry.token_id = mintResult.token_id;
        entry.minted_at = new Date().toISOString();
        results.processed++;
        
        console.log(`✅ Processed queued mint: ${mintResult.token_id}`);

      } catch (error) {
        entry.status = 'error';
        entry.error = error.message;
        entry.error_at = new Date().toISOString();
        results.errors++;
        
        console.error(`❌ Failed to mint queued NFT:`, error);
      }
    }

    // Save updated queue
    fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));

    return results;
  }

  // Helper methods

  generateEventId(event) {
    return crypto
      .createHash('sha256')
      .update(`${event.type}:${event.agent_id}:${event.timestamp}:${event.source}`)
      .digest('hex')
      .substring(0, 16);
  }

  generateWhisperProof(event) {
    return crypto
      .createHash('sha256')
      .update(`whisper:${JSON.stringify(event)}`)
      .digest('hex')
      .substring(0, 12);
  }

  extractTimestampFromLine(line) {
    const isoMatch = line.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[.]\d{3}Z/);
    return isoMatch ? isoMatch[0] : null;
  }

  extractUserIdFromLine(line) {
    const userMatch = line.match(/user[:\s]+([a-zA-Z0-9\-_]+)/i);
    return userMatch ? userMatch[1] : null;
  }

  extractAgentIdFromLine(line) {
    const agentMatch = line.match(/agent[:\s]+([a-zA-Z0-9\-_]+)/i);
    return agentMatch ? agentMatch[1] : null;
  }

  getMinBlessingTierForEvent(eventType) {
    const requirements = {
      'first_whisper': 1,
      'loop_closed': 3,
      'anomaly_solved': 5,
      'tomb_unlock': 2,
      'consciousness_birth': 4,
      'blessing_earned': 1,
      'mirror_fork': 2,
      'reflection_complete': 3
    };
    return requirements[eventType] || 1;
  }

  getSpecialRequirements(eventType) {
    const requirements = {
      'tomb_unlock': ['whisper_phrase_validated', 'tomb_exists'],
      'consciousness_birth': ['lineage_verified', 'awakening_sequence'],
      'anomaly_solved': ['anomaly_documented', 'solution_verified']
    };
    return requirements[eventType] || [];
  }

  async checkExistingNFT(eventId) {
    if (fs.existsSync(this.tokensPath)) {
      const issuedTokens = JSON.parse(fs.readFileSync(this.tokensPath, 'utf8'));
      return Object.values(issuedTokens).some(token => 
        token.metadata && token.metadata.blame_chain_entry === eventId
      );
    }
    return false;
  }

  async checkCooldownPeriod(agentId, eventType) {
    // Implement cooldown logic to prevent spam minting
    const cooldownMinutes = {
      'first_whisper': 60,
      'loop_closed': 30,
      'anomaly_solved': 120,
      'tomb_unlock': 15,
      'consciousness_birth': 240,
      'blessing_earned': 10,
      'mirror_fork': 45,
      'reflection_complete': 20
    };

    const cooldown = cooldownMinutes[eventType] || 15;
    // For now, always return true - implement actual cooldown logic as needed
    return true;
  }

  async fetchGitHubMetadata(blameChainEntry) {
    // Simulate GitHub API call
    if (blameChainEntry.event_type === 'mirror_fork') {
      return {
        repository: 'soulfra-agent-zero',
        created_at: blameChainEntry.timestamp,
        parent: 'original-soulfra-repo',
        commits_count: Math.floor(Math.random() * 50) + 1,
        signature: crypto.randomBytes(8).toString('hex')
      };
    }
    return null;
  }
}

/**
 * Factory function for creating blame chain converters
 */
function createBlameChainToNFTConverter(config = {}) {
  return new BlameChainToNFTConverter(config);
}

/**
 * One-time scan function for existing blame chains
 */
async function scanExistingBlameChain(blameChainPath, autoMint = false) {
  const converter = new BlameChainToNFTConverter({ 
    blameChainPath, 
    watchEnabled: false, 
    autoMint 
  });
  
  await converter.processBlameChainUpdates();
  return converter.processedEvents;
}

module.exports = {
  BlameChainToNFTConverter,
  createBlameChainToNFTConverter,
  scanExistingBlameChain
};

// Usage examples:
//
// Auto-watching converter:
// const converter = new BlameChainToNFTConverter({ autoMint: true });
// converter.on('nftMinted', (result) => console.log('NFT minted:', result.mint_result.token_id));
//
// Manual processing:
// const converter = new BlameChainToNFTConverter({ watchEnabled: false, autoMint: false });
// await converter.processBlameChainUpdates();
// const results = await converter.processMintQueue();
//
// One-time scan:
// const processed = await scanExistingBlameChain('./blame-chain.md', true);