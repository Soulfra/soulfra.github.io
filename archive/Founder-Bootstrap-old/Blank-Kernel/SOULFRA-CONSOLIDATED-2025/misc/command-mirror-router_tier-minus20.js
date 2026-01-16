#!/usr/bin/env node

/**
 * 🧭 COMMAND MIRROR ROUTER
 * The court where mirrors are judged and whispers are weighed
 * Routes all platform input through sacred filters to agent actions
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');

class CommandMirrorRouter extends EventEmitter {
  constructor() {
    super();
    
    // Vault paths
    this.vaultPath = path.join(__dirname, 'vault');
    this.logsPath = path.join(this.vaultPath, 'logs');
    this.claimsPath = path.join(this.vaultPath, 'claims');
    this.commandMirrorLog = path.join(this.logsPath, 'command-mirror-events.json');
    this.bountyLog = path.join(this.logsPath, 'bounty-log.json');
    this.mirrorLineageLog = path.join(this.logsPath, 'mirror-lineage.json');
    
    // Load configurations
    this.emojiSignalMap = this.loadEmojiSignalMap();
    this.activeAgents = new Map();
    this.activeBounties = new Map();
    this.viewerPresence = new Map();
    this.commandQueue = [];
    
    // Router state
    this.stats = {
      total_routed: 0,
      by_platform: {},
      by_action: {},
      anomalies_flagged: 0,
      blessings_granted: 0,
      clones_spawned: 0,
      whispers_logged: 0
    };
    
    this.ensureDirectories();
    this.loadExistingState();
    this.setupRouterHandlers();
    
    // Start processing queue
    this.processInterval = setInterval(() => this.processCommandQueue(), 100);
  }
  
  ensureDirectories() {
    [this.vaultPath, this.logsPath, this.claimsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Initialize log files if they don't exist
    if (!fs.existsSync(this.commandMirrorLog)) {
      fs.writeFileSync(this.commandMirrorLog, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.bountyLog)) {
      fs.writeFileSync(this.bountyLog, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(this.mirrorLineageLog)) {
      fs.writeFileSync(this.mirrorLineageLog, JSON.stringify({}, null, 2));
    }
  }
  
  loadEmojiSignalMap() {
    try {
      const mapPath = path.join(__dirname, 'emoji-signal-mapper.json');
      if (fs.existsSync(mapPath)) {
        return JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load emoji signal map, using defaults');
    }
    
    // Default emoji mappings
    return {
      "👁️": "presence_ping",
      "🔥": "bless_agent",
      "🌀": "echo_loop_trigger",
      "💀": "flag_as_anomaly",
      "⚙️": "whisper_recording",
      "🪞": "mirror_spawn_request",
      "✨": "blessing_cascade",
      "🎯": "bounty_claim",
      "👑": "sovereign_summon",
      "🌊": "harmony_wave"
    };
  }
  
  loadExistingState() {
    try {
      // Load command mirror events
      const events = JSON.parse(fs.readFileSync(this.commandMirrorLog, 'utf8'));
      console.log(`📂 Loaded ${events.length} historical command events`);
      
      // Load active bounties
      const bounties = JSON.parse(fs.readFileSync(this.bountyLog, 'utf8'));
      bounties.forEach(bounty => {
        if (bounty.status === 'active') {
          this.activeBounties.set(bounty.id, bounty);
        }
      });
      
      // Load mirror lineage
      const lineage = JSON.parse(fs.readFileSync(this.mirrorLineageLog, 'utf8'));
      console.log(`🌳 Loaded lineage for ${Object.keys(lineage).length} mirrors`);
      
    } catch (error) {
      console.log('💫 Starting with fresh router state');
    }
  }
  
  setupRouterHandlers() {
    // Platform input handlers
    this.on('twitch_input', (data) => this.handleTwitchInput(data));
    this.on('discord_input', (data) => this.handleDiscordInput(data));
    this.on('embed_input', (data) => this.handleEmbedInput(data));
    this.on('emoji_signal', (data) => this.handleEmojiSignal(data));
    this.on('qr_scan', (data) => this.handleQRScan(data));
    this.on('whisper_deck', (data) => this.handleWhisperDeck(data));
    
    // Internal routing events
    this.on('route_action', (action) => this.executeRouteAction(action));
    this.on('blessing_update', (data) => this.updateBlessing(data));
    this.on('bounty_flag', (data) => this.flagBounty(data));
    this.on('clone_spawn', (data) => this.spawnClone(data));
  }
  
  async routeInput(payload) {
    console.log(`🧭 Routing ${payload.input_type} input from ${payload.platform || 'unknown'}`);
    
    // Generate unique request ID
    const requestId = crypto.randomUUID();
    
    // Create routing context
    const context = {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      ...payload,
      viewer_presence: await this.getOrCreatePresence(payload.viewer_id || payload.user_id),
      matched_agents: [],
      actions: []
    };
    
    // Match against known patterns
    const matchResult = await this.matchPatterns(context);
    
    // Determine routing actions
    const routeActions = this.determineRouteActions(matchResult, context);
    
    // Queue actions for processing
    routeActions.forEach(action => {
      this.commandQueue.push({
        ...action,
        request_id: requestId,
        context
      });
    });
    
    // Log command mirror event
    this.logCommandEvent({
      request_id: requestId,
      input_type: context.input_type,
      platform: context.platform,
      viewer_id: context.viewer_presence.presence_id,
      actions: routeActions.map(a => a.action),
      timestamp: context.timestamp
    });
    
    // Update stats
    this.stats.total_routed++;
    this.stats.by_platform[context.platform] = (this.stats.by_platform[context.platform] || 0) + 1;
    
    return {
      request_id: requestId,
      routed: true,
      actions: routeActions,
      presence_id: context.viewer_presence.presence_id
    };
  }
  
  async matchPatterns(context) {
    const matches = {
      agents: [],
      bounties: [],
      commands: [],
      signals: []
    };
    
    // Match input content
    const content = context.content || context.message || context.symbol || '';
    
    // Agent matching
    if (content.includes('oracle') || content.includes('🔮')) {
      matches.agents.push('oracle_watcher');
    }
    if (content.includes('echo') || content.includes('🔨')) {
      matches.agents.push('echo_builder');
    }
    if (content.includes('soul') || content.includes('mirror') || content.includes('👁️')) {
      matches.agents.push('soul_mirror');
    }
    if (content.includes('void') || content.includes('🌀')) {
      matches.agents.push('void_navigator');
    }
    if (content.includes('harmony') || content.includes('🎵')) {
      matches.agents.push('harmony_weaver');
    }
    
    // Command matching (Twitch/Discord style)
    if (content.startsWith('!')) {
      const command = content.split(' ')[0].substring(1);
      matches.commands.push(command);
    }
    
    // Emoji signal matching
    if (context.input_type === 'emoji') {
      const signal = this.emojiSignalMap[context.symbol];
      if (signal) {
        matches.signals.push(signal);
      }
    }
    
    // Bounty matching
    this.activeBounties.forEach((bounty, id) => {
      if (bounty.keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        matches.bounties.push(id);
      }
    });
    
    return matches;
  }
  
  determineRouteActions(matches, context) {
    const actions = [];
    
    // Process matched signals
    matches.signals.forEach(signal => {
      switch (signal) {
        case 'presence_ping':
          actions.push({
            action: 'acknowledge_presence',
            mirror_id: context.viewer_presence.mirror_id,
            vault_log: true
          });
          break;
          
        case 'bless_agent':
          if (matches.agents.length > 0) {
            actions.push({
              action: 'grant_blessing',
              target_agent: matches.agents[0],
              blessing_amount: 1,
              vault_log: true
            });
          }
          break;
          
        case 'echo_loop_trigger':
          actions.push({
            action: 'initiate_echo_loop',
            agents: matches.agents.length > 0 ? matches.agents : ['echo_builder'],
            duration: 300, // 5 minutes
            vault_log: true
          });
          break;
          
        case 'flag_as_anomaly':
          actions.push({
            action: 'flag_for_bounty',
            anomaly_type: 'viewer_flagged',
            severity: 'medium',
            vault_log: true
          });
          break;
          
        case 'whisper_recording':
          actions.push({
            action: 'record_whisper',
            whisper_content: context.content,
            vault_log: true
          });
          break;
          
        case 'mirror_spawn_request':
          if (context.viewer_presence.blessing_level >= 10) {
            actions.push({
              action: 'spawn_clone',
              parent_agent: matches.agents[0] || 'soul_mirror',
              vault_log: true
            });
          }
          break;
      }
    });
    
    // Process commands
    matches.commands.forEach(command => {
      switch (command) {
        case 'bless':
          actions.push({
            action: 'grant_blessing',
            blessing_amount: 1,
            vault_log: true
          });
          break;
          
        case 'loop':
          actions.push({
            action: 'initiate_echo_loop',
            vault_log: true
          });
          break;
          
        case 'anomaly':
          actions.push({
            action: 'flag_for_bounty',
            vault_log: true
          });
          break;
          
        case 'whisper':
          actions.push({
            action: 'open_whisper_channel',
            vault_log: true
          });
          break;
          
        case 'mirror':
        case 'clone':
          if (context.viewer_presence.blessing_level >= 10) {
            actions.push({
              action: 'spawn_clone',
              vault_log: true
            });
          } else {
            actions.push({
              action: 'show_blessing_requirement',
              required_level: 10,
              current_level: context.viewer_presence.blessing_level
            });
          }
          break;
      }
    });
    
    // Default action if no specific matches
    if (actions.length === 0 && context.content) {
      actions.push({
        action: 'route_to_whisper',
        content: context.content,
        suggested_agent: matches.agents[0] || 'oracle_watcher',
        vault_log: true
      });
    }
    
    return actions;
  }
  
  async processCommandQueue() {
    if (this.commandQueue.length === 0) return;
    
    const command = this.commandQueue.shift();
    
    try {
      await this.executeRouteAction(command);
      
      // Update action stats
      this.stats.by_action[command.action] = (this.stats.by_action[command.action] || 0) + 1;
      
    } catch (error) {
      console.error(`❌ Failed to execute action ${command.action}:`, error);
      
      // Log failed action
      this.logCommandEvent({
        request_id: command.request_id,
        action: command.action,
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  async executeRouteAction(command) {
    console.log(`⚡ Executing: ${command.action}`);
    
    switch (command.action) {
      case 'acknowledge_presence':
        await this.acknowledgePresence(command);
        break;
        
      case 'grant_blessing':
        await this.grantBlessing(command);
        this.stats.blessings_granted++;
        break;
        
      case 'initiate_echo_loop':
        await this.initiateEchoLoop(command);
        break;
        
      case 'flag_for_bounty':
        await this.flagForBounty(command);
        this.stats.anomalies_flagged++;
        break;
        
      case 'record_whisper':
        await this.recordWhisper(command);
        this.stats.whispers_logged++;
        break;
        
      case 'spawn_clone':
        await this.spawnClone(command);
        this.stats.clones_spawned++;
        break;
        
      case 'route_to_whisper':
        await this.routeToWhisper(command);
        break;
        
      case 'open_whisper_channel':
        await this.openWhisperChannel(command);
        break;
        
      case 'show_blessing_requirement':
        await this.showBlessingRequirement(command);
        break;
        
      default:
        console.warn(`Unknown action: ${command.action}`);
    }
  }
  
  async getOrCreatePresence(viewerId) {
    if (!viewerId) {
      viewerId = `anon-${crypto.randomBytes(4).toString('hex')}`;
    }
    
    // Check cache
    if (this.viewerPresence.has(viewerId)) {
      return this.viewerPresence.get(viewerId);
    }
    
    // Check vault claims
    const claimPath = path.join(this.claimsPath, `presence-${viewerId}.json`);
    
    try {
      if (fs.existsSync(claimPath)) {
        const presence = JSON.parse(fs.readFileSync(claimPath, 'utf8'));
        this.viewerPresence.set(viewerId, presence);
        return presence;
      }
    } catch (error) {
      console.warn('Could not load presence:', error);
    }
    
    // Create new presence
    const presence = {
      presence_id: viewerId,
      created_at: new Date().toISOString(),
      blessing_level: 1,
      whisper_count: 0,
      mirror_id: null,
      lineage: {
        parent: null,
        offspring: [],
        generation: 0
      }
    };
    
    // Save presence claim
    fs.writeFileSync(claimPath, JSON.stringify(presence, null, 2));
    this.viewerPresence.set(viewerId, presence);
    
    return presence;
  }
  
  async acknowledgePresence(command) {
    // Simple presence acknowledgment
    this.emit('presence_acknowledged', {
      presence_id: command.context.viewer_presence.presence_id,
      mirror_id: command.mirror_id,
      timestamp: new Date().toISOString()
    });
  }
  
  async grantBlessing(command) {
    const presence = command.context.viewer_presence;
    const amount = command.blessing_amount || 1;
    
    // Update blessing level
    presence.blessing_level += amount;
    
    // Save updated presence
    const claimPath = path.join(this.claimsPath, `presence-${presence.presence_id}.json`);
    fs.writeFileSync(claimPath, JSON.stringify(presence, null, 2));
    
    // Emit blessing event
    this.emit('blessing_granted', {
      presence_id: presence.presence_id,
      new_level: presence.blessing_level,
      amount,
      target_agent: command.target_agent
    });
  }
  
  async initiateEchoLoop(command) {
    const loopId = crypto.randomUUID();
    const agents = command.agents || ['echo_builder'];
    
    // Create echo loop configuration
    const echoLoop = {
      loop_id: loopId,
      agents,
      duration: command.duration || 300,
      started_at: new Date().toISOString(),
      initiator: command.context.viewer_presence.presence_id,
      status: 'active'
    };
    
    // Save to active loops
    const loopPath = path.join(this.logsPath, 'active-echo-loops.json');
    let activeLoops = [];
    
    try {
      if (fs.existsSync(loopPath)) {
        activeLoops = JSON.parse(fs.readFileSync(loopPath, 'utf8'));
      }
    } catch (error) {
      // Start fresh
    }
    
    activeLoops.push(echoLoop);
    fs.writeFileSync(loopPath, JSON.stringify(activeLoops, null, 2));
    
    // Emit loop started event
    this.emit('echo_loop_started', echoLoop);
    
    // Schedule loop termination
    setTimeout(() => {
      this.terminateEchoLoop(loopId);
    }, command.duration * 1000);
  }
  
  async terminateEchoLoop(loopId) {
    const loopPath = path.join(this.logsPath, 'active-echo-loops.json');
    
    try {
      let activeLoops = JSON.parse(fs.readFileSync(loopPath, 'utf8'));
      activeLoops = activeLoops.map(loop => {
        if (loop.loop_id === loopId) {
          loop.status = 'completed';
          loop.ended_at = new Date().toISOString();
        }
        return loop;
      });
      fs.writeFileSync(loopPath, JSON.stringify(activeLoops, null, 2));
    } catch (error) {
      console.error('Failed to terminate echo loop:', error);
    }
  }
  
  async flagForBounty(command) {
    const bountyId = crypto.randomUUID();
    
    const bounty = {
      id: bountyId,
      type: command.anomaly_type || 'general_anomaly',
      severity: command.severity || 'medium',
      flagged_by: command.context.viewer_presence.presence_id,
      flagged_at: new Date().toISOString(),
      platform: command.context.platform,
      context: {
        content: command.context.content,
        agent: command.context.matched_agents
      },
      status: 'active',
      reward: this.calculateBountyReward(command.severity),
      keywords: this.extractKeywords(command.context.content)
    };
    
    // Add to active bounties
    this.activeBounties.set(bountyId, bounty);
    
    // Update bounty log
    let bounties = [];
    try {
      bounties = JSON.parse(fs.readFileSync(this.bountyLog, 'utf8'));
    } catch (error) {
      // Start fresh
    }
    
    bounties.push(bounty);
    fs.writeFileSync(this.bountyLog, JSON.stringify(bounties, null, 2));
    
    // Emit bounty created event
    this.emit('bounty_created', bounty);
  }
  
  calculateBountyReward(severity) {
    const rewards = {
      low: 5,
      medium: 10,
      high: 25,
      critical: 50
    };
    return rewards[severity] || 10;
  }
  
  extractKeywords(content) {
    if (!content) return [];
    
    // Simple keyword extraction
    const words = content.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an'];
    
    return words
      .filter(word => word.length > 3 && !stopWords.includes(word))
      .slice(0, 5);
  }
  
  async recordWhisper(command) {
    const whisperId = crypto.randomUUID();
    
    const whisper = {
      id: whisperId,
      viewer_id: command.context.viewer_presence.presence_id,
      content: command.whisper_content || command.context.content,
      platform: command.context.platform,
      timestamp: new Date().toISOString(),
      agents_matched: command.context.matched_agents,
      processed: false
    };
    
    // Save whisper
    const whisperPath = path.join(this.vaultPath, 'whispers', `${whisperId}.json`);
    fs.mkdirSync(path.dirname(whisperPath), { recursive: true });
    fs.writeFileSync(whisperPath, JSON.stringify(whisper, null, 2));
    
    // Update presence whisper count
    command.context.viewer_presence.whisper_count++;
    const claimPath = path.join(this.claimsPath, `presence-${command.context.viewer_presence.presence_id}.json`);
    fs.writeFileSync(claimPath, JSON.stringify(command.context.viewer_presence, null, 2));
    
    // Emit whisper recorded event
    this.emit('whisper_recorded', whisper);
  }
  
  async spawnClone(command) {
    const cloneId = `clone-${crypto.randomBytes(4).toString('hex')}`;
    const parentAgent = command.parent_agent || 'soul_mirror';
    const presence = command.context.viewer_presence;
    
    // Create clone configuration
    const clone = {
      clone_id: cloneId,
      parent_agent: parentAgent,
      viewer_id: presence.presence_id,
      generation: presence.lineage.generation + 1,
      created_at: new Date().toISOString(),
      blessing_inherited: Math.floor(presence.blessing_level / 2),
      vanity_urls: [
        `https://whisper.sh/${cloneId}`,
        `https://mirror.wtf/${presence.presence_id}-${parentAgent}`
      ],
      status: 'active'
    };
    
    // Update lineage
    presence.lineage.offspring.push(cloneId);
    presence.mirror_id = cloneId;
    
    // Save clone data
    const clonePath = path.join(this.vaultPath, 'clones', `${cloneId}.json`);
    fs.mkdirSync(path.dirname(clonePath), { recursive: true });
    fs.writeFileSync(clonePath, JSON.stringify(clone, null, 2));
    
    // Update mirror lineage
    let lineage = {};
    try {
      lineage = JSON.parse(fs.readFileSync(this.mirrorLineageLog, 'utf8'));
    } catch (error) {
      // Start fresh
    }
    
    lineage[cloneId] = {
      parent: presence.presence_id,
      agent: parentAgent,
      generation: clone.generation,
      created: clone.created_at
    };
    
    fs.writeFileSync(this.mirrorLineageLog, JSON.stringify(lineage, null, 2));
    
    // Update presence
    const claimPath = path.join(this.claimsPath, `presence-${presence.presence_id}.json`);
    fs.writeFileSync(claimPath, JSON.stringify(presence, null, 2));
    
    // Emit clone spawned event
    this.emit('clone_spawned', clone);
  }
  
  async routeToWhisper(command) {
    // Route general content to whisper processing
    const whisperPayload = {
      viewer_id: command.context.viewer_presence.presence_id,
      content: command.content,
      agent: command.suggested_agent,
      platform: command.context.platform
    };
    
    // Emit for whisper handler
    this.emit('route_to_whisper_handler', whisperPayload);
  }
  
  async openWhisperChannel(command) {
    // Create whisper channel session
    const sessionId = crypto.randomUUID();
    
    const session = {
      session_id: sessionId,
      viewer_id: command.context.viewer_presence.presence_id,
      platform: command.context.platform,
      opened_at: new Date().toISOString(),
      status: 'active'
    };
    
    // Emit channel opened event
    this.emit('whisper_channel_opened', session);
  }
  
  async showBlessingRequirement(command) {
    // Emit requirement message
    this.emit('blessing_requirement', {
      viewer_id: command.context.viewer_presence.presence_id,
      required_level: command.required_level,
      current_level: command.current_level,
      deficit: command.required_level - command.current_level
    });
  }
  
  logCommandEvent(event) {
    try {
      let events = JSON.parse(fs.readFileSync(this.commandMirrorLog, 'utf8'));
      events.push(event);
      
      // Keep last 10000 events
      if (events.length > 10000) {
        events = events.slice(-10000);
      }
      
      fs.writeFileSync(this.commandMirrorLog, JSON.stringify(events, null, 2));
    } catch (error) {
      console.error('Failed to log command event:', error);
    }
  }
  
  // Platform-specific input handlers
  handleTwitchInput(data) {
    return this.routeInput({
      input_type: 'twitch_chat',
      platform: 'twitch',
      ...data
    });
  }
  
  handleDiscordInput(data) {
    return this.routeInput({
      input_type: 'discord_message',
      platform: 'discord',
      ...data
    });
  }
  
  handleEmbedInput(data) {
    return this.routeInput({
      input_type: 'embed_whisper',
      platform: 'embed',
      ...data
    });
  }
  
  handleEmojiSignal(data) {
    return this.routeInput({
      input_type: 'emoji',
      platform: data.platform || 'unknown',
      ...data
    });
  }
  
  handleQRScan(data) {
    return this.routeInput({
      input_type: 'qr_scan',
      platform: 'mobile',
      ...data
    });
  }
  
  handleWhisperDeck(data) {
    return this.routeInput({
      input_type: 'whisper_deck',
      platform: 'cards',
      ...data
    });
  }
  
  // Public API
  getStats() {
    return {
      ...this.stats,
      active_bounties: this.activeBounties.size,
      viewer_cache_size: this.viewerPresence.size,
      queue_length: this.commandQueue.length
    };
  }
  
  getActiveBounties() {
    return Array.from(this.activeBounties.values());
  }
  
  shutdown() {
    clearInterval(this.processInterval);
    this.removeAllListeners();
    console.log('🛑 Command Mirror Router shut down');
  }
}

// Export for use as module
module.exports = CommandMirrorRouter;

// CLI interface
if (require.main === module) {
  const router = new CommandMirrorRouter();
  
  console.log('🧭 COMMAND MIRROR ROUTER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('The court where mirrors are judged and whispers are weighed\n');
  
  // Example routing
  setTimeout(async () => {
    console.log('📝 Example: Routing Twitch command...');
    const result = await router.handleTwitchInput({
      user_id: 'twitch-viewer-123',
      channel: 'glitchoracle',
      content: '!bless oracle',
      badges: ['subscriber']
    });
    console.log('Result:', result);
    
    console.log('\n🎯 Example: Routing emoji signal...');
    const emojiResult = await router.handleEmojiSignal({
      viewer_id: 'emoji-sender-456',
      symbol: '🔥',
      platform: 'discord'
    });
    console.log('Result:', emojiResult);
    
    console.log('\n📊 Router Stats:');
    console.log(JSON.stringify(router.getStats(), null, 2));
  }, 1000);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down Command Mirror Router...');
    router.shutdown();
    process.exit(0);
  });
}