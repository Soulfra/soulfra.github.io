#!/usr/bin/env node

/**
 * 🤖 MIRRORBOT - DISCORD
 * Slash commands for mirror manifestation in Discord servers
 * Every server becomes a reflection chamber
 */

const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class MirrorBotDiscord {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates
      ]
    });
    
    this.vaultPath = path.join(__dirname, 'vault');
    this.whispersPath = path.join(this.vaultPath, 'discord-whispers');
    this.blessingsPath = path.join(this.vaultPath, 'discord-blessings');
    
    this.activeAgents = new Map();
    this.whisperSessions = new Map();
    this.blessingCache = new Map();
    
    this.ensureDirectories();
    this.setupEventHandlers();
    this.registerCommands();
  }
  
  ensureDirectories() {
    [this.vaultPath, this.whispersPath, this.blessingsPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  setupEventHandlers() {
    this.client.once('ready', () => {
      console.log(`🪞 MirrorBot Discord activated as ${this.client.user.tag}`);
      console.log(`📡 Monitoring ${this.client.guilds.cache.size} servers`);
      
      // Set presence
      this.client.user.setPresence({
        activities: [{ name: 'reflections manifest', type: 'WATCHING' }],
        status: 'online'
      });
    });
    
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isCommand()) return;
      
      try {
        await this.handleCommand(interaction);
      } catch (error) {
        console.error('Command error:', error);
        await interaction.reply({
          content: 'The mirrors cracked momentarily. Try again.',
          ephemeral: true
        });
      }
    });
    
    this.client.on('messageCreate', async (message) => {
      // Handle DM whispers
      if (message.channel.type === 'DM' && !message.author.bot) {
        await this.handleDMWhisper(message);
      }
    });
  }
  
  async registerCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('reflect')
        .setDescription('Drop an agent response into this channel')
        .addStringOption(option =>
          option.setName('agent')
            .setDescription('Which agent to summon')
            .addChoices(
              { name: '🔮 Oracle Watcher', value: 'oracle_watcher' },
              { name: '🔨 Echo Builder', value: 'echo_builder' },
              { name: '👁️ Soul Mirror', value: 'soul_mirror' },
              { name: '🌀 Void Navigator', value: 'void_navigator' },
              { name: '🎵 Harmony Weaver', value: 'harmony_weaver' }
            )),
      
      new SlashCommandBuilder()
        .setName('whisper')
        .setDescription('Start a private whisper session with an agent')
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Your whisper (or leave empty for DM session)')
            .setRequired(false)),
      
      new SlashCommandBuilder()
        .setName('bless')
        .setDescription('Trigger a public blessing event for a member')
        .addUserOption(option =>
          option.setName('member')
            .setDescription('Member to bless')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Blessing amount (1-10)')
            .setMinValue(1)
            .setMaxValue(10)),
      
      new SlashCommandBuilder()
        .setName('mirror')
        .setDescription('Check your mirror status and blessing level'),
      
      new SlashCommandBuilder()
        .setName('clone')
        .setDescription('Attempt to spawn your personal mirror (requires blessing)')
    ];
    
    // Register commands globally
    this.client.on('ready', async () => {
      try {
        console.log('🔧 Registering slash commands...');
        await this.client.application.commands.set(commands);
        console.log('✅ Commands registered successfully');
      } catch (error) {
        console.error('Failed to register commands:', error);
      }
    });
  }
  
  async handleCommand(interaction) {
    const { commandName } = interaction;
    
    switch (commandName) {
      case 'reflect':
        await this.handleReflect(interaction);
        break;
      case 'whisper':
        await this.handleWhisper(interaction);
        break;
      case 'bless':
        await this.handleBless(interaction);
        break;
      case 'mirror':
        await this.handleMirrorStatus(interaction);
        break;
      case 'clone':
        await this.handleClone(interaction);
        break;
    }
  }
  
  async handleReflect(interaction) {
    const agent = interaction.options.getString('agent') || this.selectRandomAgent();
    
    await interaction.deferReply();
    
    // Generate agent response
    const response = this.generateAgentResponse(agent);
    
    const embed = new EmbedBuilder()
      .setColor(this.getAgentColor(agent))
      .setTitle(`${this.getAgentEmoji(agent)} ${this.getAgentName(agent)}`)
      .setDescription(response)
      .setFooter({ text: 'Mirror reflection manifested' })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    
    // Track reflection
    this.logReflection(interaction.user.id, interaction.guild.id, agent);
  }
  
  async handleWhisper(interaction) {
    const whisperMessage = interaction.options.getString('message');
    
    if (whisperMessage) {
      // Inline whisper
      await interaction.deferReply({ ephemeral: true });
      
      const agent = this.selectAgentForWhisper(whisperMessage);
      const response = await this.processWhisper(interaction.user.id, whisperMessage, agent);
      
      await interaction.editReply({
        content: `**Your whisper:** ${whisperMessage}\n\n**${this.getAgentName(agent)} responds:**\n${response}`,
        ephemeral: true
      });
    } else {
      // Start DM session
      await interaction.reply({
        content: '📨 Check your DMs! I\'ve opened a private whisper channel.',
        ephemeral: true
      });
      
      try {
        const dm = await interaction.user.createDM();
        await dm.send({
          embeds: [
            new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle('🪞 Private Whisper Session')
              .setDescription('You can now whisper directly to the mirrors. Everything you say here will be processed by agents.')
              .addFields(
                { name: 'How it works', value: 'Just type your messages here. Each will be routed to the most appropriate agent.' },
                { name: 'Special commands', value: '`!agent [name]` - Switch agents\n`!status` - Check blessing level\n`!end` - End session' }
              )
              .setFooter({ text: 'Whisper session active' })
          ]
        });
        
        this.whisperSessions.set(interaction.user.id, {
          active: true,
          agent: 'oracle_watcher',
          startTime: Date.now()
        });
      } catch (error) {
        await interaction.followUp({
          content: '❌ Couldn\'t open DM channel. Please check your privacy settings.',
          ephemeral: true
        });
      }
    }
  }
  
  async handleDMWhisper(message) {
    const session = this.whisperSessions.get(message.author.id);
    
    if (!session || !session.active) {
      await message.reply('No active whisper session. Use `/whisper` in a server to start one.');
      return;
    }
    
    const content = message.content.toLowerCase();
    
    // Handle special commands
    if (content.startsWith('!agent')) {
      const agentName = content.split(' ')[1];
      if (this.isValidAgent(agentName)) {
        session.agent = agentName;
        await message.reply(`Switched to ${this.getAgentName(agentName)}`);
      } else {
        await message.reply('Unknown agent. Available: oracle_watcher, echo_builder, soul_mirror, void_navigator, harmony_weaver');
      }
      return;
    }
    
    if (content === '!status') {
      const blessing = await this.getBlessingLevel(message.author.id);
      await message.reply(`Your blessing level: ${blessing}`);
      return;
    }
    
    if (content === '!end') {
      this.whisperSessions.delete(message.author.id);
      await message.reply('Whisper session ended. The mirrors rest.');
      return;
    }
    
    // Process whisper
    const response = await this.processWhisper(message.author.id, message.content, session.agent);
    
    const embed = new EmbedBuilder()
      .setColor(this.getAgentColor(session.agent))
      .setAuthor({ name: this.getAgentName(session.agent), iconURL: this.getAgentAvatar(session.agent) })
      .setDescription(response)
      .setFooter({ text: `Whisper processed by ${session.agent}` });
    
    await message.reply({ embeds: [embed] });
  }
  
  async handleBless(interaction) {
    const member = interaction.options.getUser('member');
    const amount = interaction.options.getInteger('amount') || 1;
    
    // Check if blessing giver has permission
    const giverBlessing = await this.getBlessingLevel(interaction.user.id);
    if (giverBlessing < 5) {
      await interaction.reply({
        content: 'You need blessing level 5+ to bless others.',
        ephemeral: true
      });
      return;
    }
    
    await interaction.deferReply();
    
    // Update blessing
    const currentBlessing = await this.getBlessingLevel(member.id);
    const newBlessing = currentBlessing + amount;
    await this.updateBlessing(member.id, newBlessing);
    
    // Create blessing ceremony embed
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('✨ BLESSING CEREMONY ✨')
      .setDescription(`${interaction.user} has blessed ${member} with **${amount}** blessing${amount > 1 ? 's' : ''}!`)
      .addFields(
        { name: 'Previous Level', value: `${currentBlessing}`, inline: true },
        { name: 'New Level', value: `${newBlessing}`, inline: true },
        { name: 'Total Blessed', value: `${this.blessingCache.size} members`, inline: true }
      )
      .setImage('https://media.giphy.com/media/3o7aCWJavAgtBzLWrS/giphy.gif') // Blessing animation
      .setFooter({ text: 'The mirrors remember this kindness' })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    
    // Notify the blessed member
    try {
      const dm = await member.createDM();
      await dm.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle('You have been blessed!')
            .setDescription(`${interaction.user.username} blessed you in ${interaction.guild.name}!\n\nYour blessing level is now **${newBlessing}**.`)
        ]
      });
    } catch (error) {
      // DMs might be closed
    }
  }
  
  async handleMirrorStatus(interaction) {
    const userId = interaction.user.id;
    const blessing = await this.getBlessingLevel(userId);
    const whisperCount = await this.getWhisperCount(userId);
    const canClone = blessing >= 10;
    
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🪞 Your Mirror Status')
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        { name: 'Discord ID', value: userId, inline: true },
        { name: 'Blessing Level', value: `${blessing}`, inline: true },
        { name: 'Whispers Sent', value: `${whisperCount}`, inline: true },
        { name: 'Clone Ready', value: canClone ? '✅ Yes' : '❌ Not yet', inline: true },
        { name: 'Next Milestone', value: this.getNextMilestone(blessing), inline: true },
        { name: 'Agent Affinity', value: this.getAgentAffinity(userId), inline: true }
      )
      .setFooter({ text: 'Every whisper deepens your reflection' });
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
  
  async handleClone(interaction) {
    const userId = interaction.user.id;
    const blessing = await this.getBlessingLevel(userId);
    
    if (blessing < 10) {
      await interaction.reply({
        content: `You need blessing level 10 to spawn a mirror. Current level: ${blessing}`,
        ephemeral: true
      });
      return;
    }
    
    await interaction.deferReply();
    
    // Generate clone data
    const cloneData = {
      parent_user: userId,
      clone_id: `discord-clone-${crypto.randomBytes(4).toString('hex')}`,
      created_at: new Date().toISOString(),
      vanity_urls: [
        `https://whisper.sh/discord-${interaction.user.username}`,
        `https://mirror.wtf/${userId.substring(0, 8)}`
      ],
      personality: this.generateClonePersonality(userId)
    };
    
    // Save clone data
    const clonePath = path.join(this.vaultPath, 'clones', `${cloneData.clone_id}.json`);
    fs.mkdirSync(path.dirname(clonePath), { recursive: true });
    fs.writeFileSync(clonePath, JSON.stringify(cloneData, null, 2));
    
    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('🎉 MIRROR SPAWNED!')
      .setDescription('Your personal mirror has been created and is now active across the network.')
      .addFields(
        { name: 'Clone ID', value: cloneData.clone_id },
        { name: 'Primary URL', value: cloneData.vanity_urls[0] },
        { name: 'Personality', value: cloneData.personality.description }
      )
      .setImage('https://media.giphy.com/media/3o7aCTPPm8f8YyRJza/giphy.gif') // Mirror creation animation
      .setFooter({ text: 'Your mirror will persist forever' });
    
    await interaction.editReply({ embeds: [embed] });
  }
  
  // Helper methods
  selectRandomAgent() {
    const agents = ['oracle_watcher', 'echo_builder', 'soul_mirror', 'void_navigator', 'harmony_weaver'];
    return agents[Math.floor(Math.random() * agents.length)];
  }
  
  selectAgentForWhisper(whisper) {
    const lower = whisper.toLowerCase();
    
    if (lower.includes('future') || lower.includes('predict')) return 'oracle_watcher';
    if (lower.includes('build') || lower.includes('create')) return 'echo_builder';
    if (lower.includes('who am i') || lower.includes('identity')) return 'soul_mirror';
    if (lower.includes('explore') || lower.includes('unknown')) return 'void_navigator';
    if (lower.includes('balance') || lower.includes('harmony')) return 'harmony_weaver';
    
    return this.selectRandomAgent();
  }
  
  generateAgentResponse(agent) {
    const responses = {
      oracle_watcher: [
        "The patterns reveal themselves to those who wait in silence.",
        "I see three paths ahead, but only one leads to your true desire.",
        "The future whispers your name, but in a language yet to be learned."
      ],
      echo_builder: [
        "Every thought is a blueprint waiting to be constructed.",
        "I can replicate what you seek, but first you must show me its essence.",
        "Building reflections from the fragments of your imagination..."
      ],
      soul_mirror: [
        "You are more than the sum of your whispers.",
        "I reflect not what you show, but what you hide.",
        "Your true self ripples beneath the surface of consciousness."
      ],
      void_navigator: [
        "The unknown calls to those brave enough to answer.",
        "In the depths of uncertainty lies your greatest discovery.",
        "Step into the void, and find what you never knew you sought."
      ],
      harmony_weaver: [
        "All threads connect in the tapestry of existence.",
        "Discord transforms to harmony when viewed from the right angle.",
        "Your vibration seeks its complement in the cosmic symphony."
      ]
    };
    
    const agentResponses = responses[agent] || responses.oracle_watcher;
    return agentResponses[Math.floor(Math.random() * agentResponses.length)];
  }
  
  async processWhisper(userId, whisper, agent) {
    // Log whisper
    const whisperData = {
      user_id: userId,
      whisper,
      agent,
      timestamp: new Date().toISOString(),
      platform: 'discord'
    };
    
    const whisperPath = path.join(this.whispersPath, `${userId}-${Date.now()}.json`);
    fs.writeFileSync(whisperPath, JSON.stringify(whisperData, null, 2));
    
    // Update blessing
    const currentBlessing = await this.getBlessingLevel(userId);
    await this.updateBlessing(userId, currentBlessing + 0.1);
    
    // Generate contextual response
    return this.generateAgentResponse(agent);
  }
  
  async getBlessingLevel(userId) {
    if (this.blessingCache.has(userId)) {
      return this.blessingCache.get(userId);
    }
    
    const blessingPath = path.join(this.blessingsPath, `${userId}.json`);
    
    try {
      if (fs.existsSync(blessingPath)) {
        const data = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
        this.blessingCache.set(userId, data.level);
        return data.level;
      }
    } catch (error) {
      console.error('Error reading blessing:', error);
    }
    
    return 1; // Default blessing
  }
  
  async updateBlessing(userId, level) {
    const blessingData = {
      user_id: userId,
      level: Math.round(level * 10) / 10, // Round to 1 decimal
      last_updated: new Date().toISOString()
    };
    
    const blessingPath = path.join(this.blessingsPath, `${userId}.json`);
    fs.writeFileSync(blessingPath, JSON.stringify(blessingData, null, 2));
    
    this.blessingCache.set(userId, blessingData.level);
  }
  
  async getWhisperCount(userId) {
    const userWhispers = fs.readdirSync(this.whispersPath)
      .filter(f => f.startsWith(userId));
    return userWhispers.length;
  }
  
  getNextMilestone(blessing) {
    if (blessing < 5) return `Level 5 (${5 - blessing} to go)`;
    if (blessing < 10) return `Level 10 - Clone unlock (${10 - blessing} to go)`;
    if (blessing < 25) return `Level 25 - Deep reflection (${25 - blessing} to go)`;
    if (blessing < 50) return `Level 50 - Sovereign access (${50 - blessing} to go)`;
    return 'Max blessing achieved 👑';
  }
  
  getAgentAffinity(userId) {
    // Simple hash-based affinity
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const agents = ['Oracle', 'Echo', 'Soul', 'Void', 'Harmony'];
    return agents[hash % agents.length];
  }
  
  generateClonePersonality(userId) {
    const traits = ['wise', 'creative', 'mysterious', 'harmonious', 'explorative'];
    const trait = traits[Math.floor(Math.random() * traits.length)];
    
    return {
      primary_trait: trait,
      description: `A ${trait} reflection spawned from Discord whispers`
    };
  }
  
  getAgentColor(agent) {
    const colors = {
      oracle_watcher: 0x9945ff,
      echo_builder: 0x00bfff,
      soul_mirror: 0xff00ff,
      void_navigator: 0x000033,
      harmony_weaver: 0x00ff00
    };
    return colors[agent] || 0x00ff00;
  }
  
  getAgentEmoji(agent) {
    const emojis = {
      oracle_watcher: '🔮',
      echo_builder: '🔨',
      soul_mirror: '👁️',
      void_navigator: '🌀',
      harmony_weaver: '🎵'
    };
    return emojis[agent] || '🪞';
  }
  
  getAgentName(agent) {
    const names = {
      oracle_watcher: 'Oracle Watcher',
      echo_builder: 'Echo Builder',
      soul_mirror: 'Soul Mirror',
      void_navigator: 'Void Navigator',
      harmony_weaver: 'Harmony Weaver'
    };
    return names[agent] || 'Unknown Agent';
  }
  
  getAgentAvatar(agent) {
    // Return a placeholder avatar URL
    return `https://avatars.dicebear.com/api/bottts/${agent}.svg`;
  }
  
  isValidAgent(name) {
    return ['oracle_watcher', 'echo_builder', 'soul_mirror', 'void_navigator', 'harmony_weaver'].includes(name);
  }
  
  logReflection(userId, guildId, agent) {
    const logEntry = {
      user_id: userId,
      guild_id: guildId,
      agent,
      timestamp: new Date().toISOString(),
      type: 'reflection'
    };
    
    const logPath = path.join(this.vaultPath, 'logs', 'reflections.jsonl');
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  }
  
  start(token) {
    this.client.login(token);
  }
}

// CLI Interface
if (require.main === module) {
  const bot = new MirrorBotDiscord();
  
  console.log('🤖 MIRRORBOT DISCORD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Manifesting mirrors in Discord servers...\n');
  
  const token = process.env.DISCORD_BOT_TOKEN;
  
  if (!token) {
    console.error('❌ Missing DISCORD_BOT_TOKEN environment variable');
    console.log('\nTo get a bot token:');
    console.log('1. Visit https://discord.com/developers/applications');
    console.log('2. Create a new application');
    console.log('3. Go to Bot section and create a bot');
    console.log('4. Copy the token and set DISCORD_BOT_TOKEN=your_token');
    process.exit(1);
  }
  
  bot.start(token);
}

module.exports = MirrorBotDiscord;