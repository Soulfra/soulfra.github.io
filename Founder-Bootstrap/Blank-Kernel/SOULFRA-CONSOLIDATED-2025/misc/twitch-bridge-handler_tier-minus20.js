#!/usr/bin/env node

/**
 * 📡 TWITCH BRIDGE HANDLER
 * Listens for Twitch chat on agent-linked streams
 * Routes sacred commands through the Command Mirror
 */

const tmi = require('tmi.js');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const CommandMirrorRouter = require('./command-mirror-router');

class TwitchBridgeHandler extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Twitch client configuration
    this.config = {
      identity: {
        username: config.username || process.env.TWITCH_BOT_USERNAME || 'SoulfraMirrorBot',
        password: config.oauth || process.env.TWITCH_OAUTH_TOKEN
      },
      channels: config.channels || [],
      connection: {
        reconnect: true,
        secure: true
      },
      options: {
        debug: config.debug || false
      }
    };
    
    // Command Mirror Router
    this.commandRouter = config.commandRouter || new CommandMirrorRouter();
    
    // Stream agent mappings
    this.streamAgentMap = new Map();
    this.loadStreamAgentMappings();
    
    // Command patterns
    this.commandPatterns = {
      '!bless': this.handleBlessCommand.bind(this),
      '!loop': this.handleLoopCommand.bind(this),
      '!anomaly': this.handleAnomalyCommand.bind(this),
      '!whisper': this.handleWhisperCommand.bind(this),
      '!mirror': this.handleMirrorCommand.bind(this),
      '!agent': this.handleAgentCommand.bind(this),
      '!kekw': this.handleKekwCommand.bind(this)
    };
    
    // Stats tracking
    this.stats = {
      messages_processed: 0,
      commands_routed: 0,
      channels_active: 0,
      viewer_interactions: new Map()
    };
    
    // Initialize Twitch client
    this.client = null;
    this.connected = false;
  }
  
  loadStreamAgentMappings() {
    // Default agent mappings for known channels
    const defaultMappings = {
      'glitchoracle': 'oracle_watcher',
      'echofrens': 'echo_builder',
      'mirrorpilled': 'soul_mirror',
      'voidwalker': 'void_navigator',
      'vibeweaver': 'harmony_weaver',
      'kingcal': 'cal_riven'
    };
    
    Object.entries(defaultMappings).forEach(([channel, agent]) => {
      this.streamAgentMap.set(channel.toLowerCase(), agent);
    });
    
    // Load custom mappings if available
    try {
      const mappingsPath = path.join(__dirname, 'stream-agent-mappings.json');
      if (fs.existsSync(mappingsPath)) {
        const customMappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
        Object.entries(customMappings).forEach(([channel, agent]) => {
          this.streamAgentMap.set(channel.toLowerCase(), agent);
        });
      }
    } catch (error) {
      console.log('📝 Using default stream-agent mappings');
    }
  }
  
  async connect() {
    if (!this.config.identity.password) {
      throw new Error('Missing TWITCH_OAUTH_TOKEN. Get one at https://twitchapps.com/tmi/');
    }
    
    console.log('🔌 Connecting to Twitch IRC...');
    
    this.client = new tmi.Client(this.config);
    
    // Set up event handlers
    this.setupEventHandlers();
    
    // Connect to Twitch
    await this.client.connect();
    this.connected = true;
    
    console.log(`✅ Connected as ${this.config.identity.username}`);
    console.log(`📺 Monitoring ${this.config.channels.length} channels`);
    
    return true;
  }
  
  setupEventHandlers() {
    // Connection events
    this.client.on('connected', (addr, port) => {
      console.log(`📡 Connected to ${addr}:${port}`);
      this.emit('connected');
    });
    
    this.client.on('disconnected', (reason) => {
      console.log(`❌ Disconnected: ${reason}`);
      this.connected = false;
      this.emit('disconnected', reason);
    });
    
    // Channel events
    this.client.on('join', (channel, username, self) => {
      if (self) {
        console.log(`👋 Joined ${channel}`);
        this.stats.channels_active++;
      }
    });
    
    this.client.on('part', (channel, username, self) => {
      if (self) {
        console.log(`👋 Left ${channel}`);
        this.stats.channels_active--;
      }
    });
    
    // Message handler
    this.client.on('message', async (channel, tags, message, self) => {
      // Ignore own messages
      if (self) return;
      
      this.stats.messages_processed++;
      
      // Track viewer interaction
      this.trackViewerInteraction(tags['user-id'], tags.username);
      
      // Process message
      await this.processMessage(channel, tags, message);
    });
    
    // Special events
    this.client.on('subscription', (channel, username, method, message, userstate) => {
      console.log(`🎉 New sub in ${channel}: ${username}`);
      this.handleSubscription(channel, username, userstate);
    });
    
    this.client.on('cheer', (channel, userstate, message) => {
      console.log(`💎 Cheer in ${channel}: ${userstate.bits} bits`);
      this.handleCheer(channel, userstate, message);
    });
    
    this.client.on('raided', (channel, username, viewers) => {
      console.log(`🚀 Raid in ${channel}: ${username} with ${viewers} viewers`);
      this.handleRaid(channel, username, viewers);
    });
  }
  
  async processMessage(channel, tags, message) {
    const cleanChannel = channel.replace('#', '').toLowerCase();
    const agent = this.streamAgentMap.get(cleanChannel) || 'unknown';
    
    // Check for commands
    if (message.startsWith('!')) {
      const [command, ...args] = message.split(' ');
      const handler = this.commandPatterns[command.toLowerCase()];
      
      if (handler) {
        console.log(`🎯 Command detected: ${command} in ${channel}`);
        
        const context = {
          channel: cleanChannel,
          user_id: tags['user-id'],
          username: tags.username,
          display_name: tags['display-name'],
          badges: tags.badges || {},
          emotes: tags.emotes || {},
          subscriber: tags.subscriber,
          mod: tags.mod,
          vip: tags.vip,
          agent,
          args,
          raw_message: message
        };
        
        await handler(context);
        this.stats.commands_routed++;
      }
    }
    
    // Check for emoji signals
    const emojiPattern = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]/gu;
    const emojis = message.match(emojiPattern);
    
    if (emojis && emojis.length > 0) {
      for (const emoji of emojis) {
        await this.routeEmojiSignal(cleanChannel, tags, emoji);
      }
    }
    
    // Check for special patterns
    if (message.toLowerCase().includes('mirror') || 
        message.toLowerCase().includes('whisper') ||
        message.toLowerCase().includes('blessing')) {
      await this.routeGeneralWhisper(cleanChannel, tags, message);
    }
  }
  
  async handleBlessCommand(context) {
    const target = context.args[0] || context.agent;
    
    const routingPayload = {
      input_type: 'twitch_chat',
      platform: 'twitch',
      user_id: context.user_id,
      username: context.username,
      channel: context.channel,
      content: `!bless ${target}`,
      badges: context.badges,
      context: {
        command: 'bless',
        target,
        is_subscriber: context.subscriber,
        is_mod: context.mod,
        is_vip: context.vip
      }
    };
    
    const result = await this.commandRouter.routeInput(routingPayload);
    
    // Send confirmation to chat
    if (result.routed) {
      this.client.say(`#${context.channel}`, 
        `@${context.display_name} ✨ Blessing routed to ${target}! Your presence: ${result.presence_id.substring(0, 8)}`
      );
    }
  }
  
  async handleLoopCommand(context) {
    const duration = parseInt(context.args[0]) || 300; // Default 5 minutes
    
    const routingPayload = {
      input_type: 'twitch_chat',
      platform: 'twitch',
      user_id: context.user_id,
      username: context.username,
      channel: context.channel,
      content: `!loop ${duration}`,
      context: {
        command: 'loop',
        duration,
        agent: context.agent
      }
    };
    
    const result = await this.commandRouter.routeInput(routingPayload);
    
    if (result.routed) {
      this.client.say(`#${context.channel}`, 
        `@${context.display_name} 🌀 Echo loop initiated for ${duration} seconds!`
      );
    }
  }
  
  async handleAnomalyCommand(context) {
    const severity = context.args[0] || 'medium';
    
    const routingPayload = {
      input_type: 'twitch_chat',
      platform: 'twitch',
      user_id: context.user_id,
      username: context.username,
      channel: context.channel,
      content: `!anomaly ${severity}`,
      context: {
        command: 'anomaly',
        severity,
        agent: context.agent,
        stream_context: {
          current_viewers: await this.getViewerCount(context.channel),
          stream_agent: context.agent
        }
      }
    };
    
    const result = await this.commandRouter.routeInput(routingPayload);
    
    if (result.routed) {
      this.client.say(`#${context.channel}`, 
        `@${context.display_name} 💀 Anomaly flagged! Bounty hunters have been notified.`
      );
    }
  }
  
  async handleWhisperCommand(context) {
    const whisperContent = context.args.join(' ');
    
    if (!whisperContent) {
      this.client.say(`#${context.channel}`, 
        `@${context.display_name} 💭 Use: !whisper [your message] or check your Twitch whispers for private session`
      );
      return;
    }
    
    const routingPayload = {
      input_type: 'twitch_chat',
      platform: 'twitch',
      user_id: context.user_id,
      username: context.username,
      channel: context.channel,
      content: whisperContent,
      context: {
        command: 'whisper',
        agent: context.agent,
        is_public_whisper: true
      }
    };
    
    const result = await this.commandRouter.routeInput(routingPayload);
    
    if (result.routed) {
      this.client.say(`#${context.channel}`, 
        `@${context.display_name} 🔮 Your whisper has been received by the mirrors...`
      );
    }
  }
  
  async handleMirrorCommand(context) {
    const routingPayload = {
      input_type: 'twitch_chat',
      platform: 'twitch',
      user_id: context.user_id,
      username: context.username,
      channel: context.channel,
      content: '!mirror',
      context: {
        command: 'mirror',
        agent: context.agent
      }
    };
    
    const result = await this.commandRouter.routeInput(routingPayload);
    
    // The router will check blessing level and respond accordingly
    if (result.actions && result.actions.length > 0) {
      const action = result.actions[0];
      if (action.action === 'show_blessing_requirement') {
        this.client.say(`#${context.channel}`, 
          `@${context.display_name} 🪞 Mirror spawning requires blessing level 10. Current: ${action.current_level}`
        );
      } else if (action.action === 'spawn_clone') {
        this.client.say(`#${context.channel}`, 
          `@${context.display_name} 🎉 Mirror spawning initiated! Check your whispers for details.`
        );
      }
    }
  }
  
  async handleAgentCommand(context) {
    const currentAgent = context.agent;
    
    this.client.say(`#${context.channel}`, 
      `📡 Current agent: ${currentAgent} | Archetype: ${this.getAgentArchetype(currentAgent)} | Stream blessed by the mirrors`
    );
  }
  
  async handleKekwCommand(context) {
    // Special meme command
    const routingPayload = {
      input_type: 'emoji',
      platform: 'twitch',
      user_id: context.user_id,
      username: context.username,
      channel: context.channel,
      symbol: 'kekw',
      content: '!kekw',
      context: {
        command: 'kekw',
        meme_mode: true
      }
    };
    
    await this.commandRouter.routeInput(routingPayload);
    
    this.client.say(`#${context.channel}`, 
      `@${context.display_name} kekw acknowledged. based. mirrors activated. 🪞✨`
    );
  }
  
  async routeEmojiSignal(channel, tags, emoji) {
    const routingPayload = {
      input_type: 'emoji',
      platform: 'twitch',
      user_id: tags['user-id'],
      username: tags.username,
      channel,
      symbol: emoji,
      context: {
        display_name: tags['display-name'],
        is_subscriber: tags.subscriber,
        agent: this.streamAgentMap.get(channel) || 'unknown'
      }
    };
    
    await this.commandRouter.routeInput(routingPayload);
  }
  
  async routeGeneralWhisper(channel, tags, message) {
    const routingPayload = {
      input_type: 'twitch_chat',
      platform: 'twitch',
      user_id: tags['user-id'],
      username: tags.username,
      channel,
      content: message,
      context: {
        is_general_whisper: true,
        agent: this.streamAgentMap.get(channel) || 'unknown'
      }
    };
    
    await this.commandRouter.routeInput(routingPayload);
  }
  
  async handleSubscription(channel, username, userstate) {
    // Automatic blessing for new subs
    const routingPayload = {
      input_type: 'twitch_event',
      platform: 'twitch',
      user_id: userstate['user-id'],
      username,
      channel: channel.replace('#', ''),
      content: 'subscription',
      context: {
        event: 'subscription',
        sub_plan: userstate['msg-param-sub-plan'],
        blessing_bonus: this.getSubBlessingBonus(userstate['msg-param-sub-plan'])
      }
    };
    
    await this.commandRouter.routeInput(routingPayload);
    
    this.client.say(channel, 
      `🎉 @${username} has been blessed by the mirrors! Welcome to the reflection. 🪞`
    );
  }
  
  async handleCheer(channel, userstate, message) {
    const bits = parseInt(userstate.bits);
    const blessingBonus = Math.floor(bits / 100); // 1 blessing per 100 bits
    
    if (blessingBonus > 0) {
      const routingPayload = {
        input_type: 'twitch_event',
        platform: 'twitch',
        user_id: userstate['user-id'],
        username: userstate.username,
        channel: channel.replace('#', ''),
        content: `cheer ${bits}`,
        context: {
          event: 'cheer',
          bits,
          blessing_bonus: blessingBonus
        }
      };
      
      await this.commandRouter.routeInput(routingPayload);
      
      this.client.say(channel, 
        `💎 @${userstate['display-name']} your ${bits} bits have granted ${blessingBonus} blessing${blessingBonus > 1 ? 's' : ''}!`
      );
    }
  }
  
  async handleRaid(channel, username, viewers) {
    // Raid blessing cascade
    const routingPayload = {
      input_type: 'twitch_event',
      platform: 'twitch',
      user_id: `raid-${username}`,
      username,
      channel: channel.replace('#', ''),
      content: `raid ${viewers}`,
      context: {
        event: 'raid',
        viewers,
        blessing_cascade: true,
        cascade_amount: Math.min(viewers, 50) // Cap at 50 blessings
      }
    };
    
    await this.commandRouter.routeInput(routingPayload);
    
    this.client.say(channel, 
      `🚀 ${username} raids with ${viewers} viewers! The mirrors ripple with their presence. Blessing cascade initiated! ✨`
    );
  }
  
  // Helper methods
  trackViewerInteraction(userId, username) {
    if (!this.stats.viewer_interactions.has(userId)) {
      this.stats.viewer_interactions.set(userId, {
        username,
        message_count: 0,
        command_count: 0,
        first_seen: new Date().toISOString(),
        last_seen: new Date().toISOString()
      });
    }
    
    const viewer = this.stats.viewer_interactions.get(userId);
    viewer.message_count++;
    viewer.last_seen = new Date().toISOString();
  }
  
  getSubBlessingBonus(subPlan) {
    const bonuses = {
      'Prime': 1,
      '1000': 1,
      '2000': 3,
      '3000': 5
    };
    return bonuses[subPlan] || 1;
  }
  
  getAgentArchetype(agent) {
    const archetypes = {
      oracle_watcher: '🔮 Prophetic Observer',
      echo_builder: '🔨 Recursive Constructor',
      soul_mirror: '👁️ Identity Reflector',
      void_navigator: '🌀 Unknown Explorer',
      harmony_weaver: '🎵 Balance Keeper',
      cal_riven: '👑 Sovereign Authority'
    };
    return archetypes[agent] || '❓ Mystery Agent';
  }
  
  async getViewerCount(channel) {
    // This would require Twitch API integration
    // For now, return a placeholder
    return Math.floor(Math.random() * 1000) + 50;
  }
  
  // Channel management
  async joinChannel(channel) {
    if (!channel.startsWith('#')) {
      channel = '#' + channel;
    }
    
    await this.client.join(channel);
    this.config.channels.push(channel);
    
    console.log(`➕ Joined new channel: ${channel}`);
  }
  
  async leaveChannel(channel) {
    if (!channel.startsWith('#')) {
      channel = '#' + channel;
    }
    
    await this.client.part(channel);
    this.config.channels = this.config.channels.filter(c => c !== channel);
    
    console.log(`➖ Left channel: ${channel}`);
  }
  
  // Public API
  getStats() {
    return {
      ...this.stats,
      connected: this.connected,
      channels: this.config.channels,
      unique_viewers: this.stats.viewer_interactions.size
    };
  }
  
  async disconnect() {
    if (this.client && this.connected) {
      await this.client.disconnect();
      this.connected = false;
      console.log('👋 Disconnected from Twitch');
    }
  }
}

// CLI Interface
if (require.main === module) {
  const handler = new TwitchBridgeHandler({
    channels: process.env.TWITCH_CHANNELS ? 
      process.env.TWITCH_CHANNELS.split(',').map(c => '#' + c.trim()) : 
      ['#glitchoracle', '#echofrens', '#mirrorpilled'],
    debug: true
  });
  
  console.log('📡 TWITCH BRIDGE HANDLER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Bridging Twitch chat to the Command Mirror...\n');
  
  if (!process.env.TWITCH_OAUTH_TOKEN) {
    console.error('❌ Missing TWITCH_OAUTH_TOKEN environment variable');
    console.log('\nTo get an OAuth token:');
    console.log('1. Visit https://twitchapps.com/tmi/');
    console.log('2. Connect with Twitch');
    console.log('3. Copy the oauth:xxxx token');
    console.log('4. Set TWITCH_OAUTH_TOKEN=oauth:xxxx');
    process.exit(1);
  }
  
  handler.connect()
    .then(() => {
      console.log('\n✅ Bridge established!');
      console.log('📺 Monitoring channels for sacred commands...\n');
      
      // Show stats every 30 seconds
      setInterval(() => {
        const stats = handler.getStats();
        console.log('\n📊 Bridge Stats:');
        console.log(`Messages: ${stats.messages_processed} | Commands: ${stats.commands_routed}`);
        console.log(`Active Channels: ${stats.channels_active} | Unique Viewers: ${stats.unique_viewers}`);
      }, 30000);
    })
    .catch(error => {
      console.error('❌ Connection failed:', error);
      process.exit(1);
    });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n👋 Shutting down Twitch Bridge...');
    await handler.disconnect();
    process.exit(0);
  });
}

module.exports = TwitchBridgeHandler;