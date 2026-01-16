const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const EventEmitter = require('events');
const config = require('../config/environment');

class DiscordBot extends EventEmitter {
  constructor(gameService, contractService, userService) {
    super();
    this.gameService = gameService;
    this.contractService = contractService;
    this.userService = userService;
    
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages
      ]
    });

    this.commands = new Map();
    this.setupCommands();
    this.setupEventHandlers();
  }

  async start() {
    try {
      await this.client.login(config.discord.botToken);
      console.log(`Discord bot logged in as ${this.client.user.tag}`);
    } catch (error) {
      console.error('Failed to start Discord bot:', error);
      throw error;
    }
  }

  setupCommands() {
    // Register commands
    this.commands.set('help', this.helpCommand.bind(this));
    this.commands.set('register', this.registerCommand.bind(this));
    this.commands.set('balance', this.balanceCommand.bind(this));
    this.commands.set('contract', this.contractCommand.bind(this));
    this.commands.set('sign', this.signCommand.bind(this));
    this.commands.set('leaderboard', this.leaderboardCommand.bind(this));
    this.commands.set('ai', this.aiCommand.bind(this));
    this.commands.set('stats', this.statsCommand.bind(this));
    this.commands.set('daily', this.dailyBonusCommand.bind(this));
  }

  setupEventHandlers() {
    this.client.on('ready', () => {
      console.log('Discord bot is ready!');
      this.setActivity();
      setInterval(() => this.setActivity(), 300000); // Update every 5 minutes
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;
      
      const prefix = config.discord.commandPrefix;
      if (!message.content.startsWith(prefix)) return;

      const args = message.content.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      const command = this.commands.get(commandName);
      if (command) {
        try {
          await command(message, args);
        } catch (error) {
          console.error(`Error executing command ${commandName}:`, error);
          await message.reply('An error occurred while executing the command.');
        }
      }
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      try {
        await this.handleButtonInteraction(interaction);
      } catch (error) {
        console.error('Error handling button interaction:', error);
        await interaction.reply({ 
          content: 'An error occurred while processing your request.', 
          ephemeral: true 
        });
      }
    });
  }

  async setActivity() {
    try {
      const stats = await this.gameService.getGlobalStats();
      this.client.user.setActivity(
        `${stats.totalUsers} players | $${stats.totalVolume.toLocaleString()}`, 
        { type: 'WATCHING' }
      );
    } catch (error) {
      console.error('Error setting bot activity:', error);
    }
  }

  // Command Handlers

  async helpCommand(message) {
    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('Billion Dollar Game - Commands')
      .setDescription('Welcome to the Billion Dollar Game! Here are the available commands:')
      .addFields(
        { name: '!register', value: 'Register for the game' },
        { name: '!balance', value: 'Check your balance and stats' },
        { name: '!contract create <title> <value>', value: 'Create a new contract' },
        { name: '!contract list', value: 'List your contracts' },
        { name: '!contract view <id>', value: 'View contract details' },
        { name: '!sign <contract-id>', value: 'Sign a contract' },
        { name: '!leaderboard', value: 'View the top players' },
        { name: '!ai help', value: 'Get help from AI agents' },
        { name: '!stats', value: 'View game statistics' },
        { name: '!daily', value: 'Claim your daily bonus' }
      )
      .setTimestamp()
      .setFooter({ text: 'Billion Dollar Game', iconURL: this.client.user.displayAvatarURL() });

    await message.reply({ embeds: [embed] });
  }

  async registerCommand(message) {
    const discordId = message.author.id;
    const username = message.author.username;

    try {
      const existingUser = await this.userService.getUserByDiscordId(discordId);
      if (existingUser) {
        await message.reply('You are already registered!');
        return;
      }

      const user = await this.userService.createUser({
        username: username,
        email: `${discordId}@discord.local`,
        discordId: discordId,
        password: crypto.randomBytes(16).toString('hex') // Random password for Discord users
      });

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('Registration Successful!')
        .setDescription(`Welcome to the Billion Dollar Game, ${username}!`)
        .addFields(
          { name: 'Starting Balance', value: `$${user.balance.toLocaleString()}`, inline: true },
          { name: 'User ID', value: user.id, inline: true }
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Registration error:', error);
      await message.reply('Failed to register. Please try again later.');
    }
  }

  async balanceCommand(message) {
    const discordId = message.author.id;

    try {
      const user = await this.userService.getUserByDiscordId(discordId);
      if (!user) {
        await message.reply('You need to register first! Use `!register`');
        return;
      }

      const gameState = await this.gameService.getUserGameState(user.id);

      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle(`${user.username}'s Profile`)
        .addFields(
          { name: 'Balance', value: `$${user.balance.toLocaleString()}`, inline: true },
          { name: 'Level', value: `${gameState.current_level}`, inline: true },
          { name: 'XP', value: `${gameState.experience_points}`, inline: true },
          { name: 'Contracts Created', value: `${user.total_contracts_created}`, inline: true },
          { name: 'Contracts Signed', value: `${user.total_contracts_signed}`, inline: true },
          { name: 'Reputation', value: `${user.reputation_score}/100`, inline: true },
          { name: 'Daily Streak', value: `${gameState.daily_streak} days`, inline: true }
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Balance command error:', error);
      await message.reply('Failed to fetch balance. Please try again later.');
    }
  }

  async contractCommand(message, args) {
    const subCommand = args[0];
    const discordId = message.author.id;

    try {
      const user = await this.userService.getUserByDiscordId(discordId);
      if (!user) {
        await message.reply('You need to register first! Use `!register`');
        return;
      }

      switch (subCommand) {
        case 'create':
          await this.createContract(message, args.slice(1), user);
          break;
        case 'list':
          await this.listContracts(message, user);
          break;
        case 'view':
          await this.viewContract(message, args[1], user);
          break;
        default:
          await message.reply('Invalid contract command. Use `create`, `list`, or `view`.');
      }
    } catch (error) {
      console.error('Contract command error:', error);
      await message.reply('Failed to process contract command. Please try again later.');
    }
  }

  async createContract(message, args, user) {
    const title = args.slice(0, -1).join(' ');
    const value = parseFloat(args[args.length - 1]);

    if (!title || isNaN(value) || value <= 0) {
      await message.reply('Invalid contract format. Use: `!contract create <title> <value>`');
      return;
    }

    const contract = await this.contractService.createContract({
      creator_id: user.id,
      title: title,
      description: `Contract created via Discord by ${user.username}`,
      value: value,
      type: 'standard',
      terms: {
        platform: 'discord',
        created_at: new Date().toISOString()
      }
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ff00)
      .setTitle('Contract Created!')
      .addFields(
        { name: 'Contract ID', value: contract.contract_number, inline: true },
        { name: 'Title', value: title, inline: true },
        { name: 'Value', value: `$${value.toLocaleString()}`, inline: true },
        { name: 'Fee', value: `${contract.fee_percentage}%`, inline: true }
      )
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`sign_${contract.id}`)
          .setLabel('Sign Contract')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`share_${contract.id}`)
          .setLabel('Share')
          .setStyle(ButtonStyle.Secondary)
      );

    await message.reply({ embeds: [embed], components: [row] });
  }

  async signCommand(message, args) {
    const contractId = args[0];
    const discordId = message.author.id;

    if (!contractId) {
      await message.reply('Please provide a contract ID. Use: `!sign <contract-id>`');
      return;
    }

    try {
      const user = await this.userService.getUserByDiscordId(discordId);
      if (!user) {
        await message.reply('You need to register first! Use `!register`');
        return;
      }

      const signature = await this.contractService.signContract(contractId, user.id, {
        platform: 'discord',
        verification_method: 'discord_command'
      });

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('Contract Signed!')
        .setDescription(`You have successfully signed contract ${contractId}`)
        .addFields(
          { name: 'Signature Hash', value: signature.signature_hash, inline: true },
          { name: 'Signed At', value: new Date(signature.signed_at).toLocaleString(), inline: true }
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Sign command error:', error);
      await message.reply(`Failed to sign contract: ${error.message}`);
    }
  }

  async handleButtonInteraction(interaction) {
    const [action, contractId] = interaction.customId.split('_');

    switch (action) {
      case 'sign':
        await this.handleSignButton(interaction, contractId);
        break;
      case 'share':
        await this.handleShareButton(interaction, contractId);
        break;
    }
  }

  async handleSignButton(interaction, contractId) {
    const discordId = interaction.user.id;

    try {
      const user = await this.userService.getUserByDiscordId(discordId);
      if (!user) {
        await interaction.reply({ 
          content: 'You need to register first! Use `!register`', 
          ephemeral: true 
        });
        return;
      }

      const signature = await this.contractService.signContract(contractId, user.id, {
        platform: 'discord',
        verification_method: 'discord_button'
      });

      await interaction.reply({ 
        content: `✅ Contract signed successfully! Signature: ${signature.signature_hash}`,
        ephemeral: true 
      });
    } catch (error) {
      await interaction.reply({ 
        content: `❌ Failed to sign contract: ${error.message}`,
        ephemeral: true 
      });
    }
  }

  // Notification Methods

  async sendContractNotification(userId, contract) {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user.discord_id) return;

      const discordUser = await this.client.users.fetch(user.discord_id);
      
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('New Contract Activity')
        .setDescription(`Contract "${contract.title}" has been updated`)
        .addFields(
          { name: 'Status', value: contract.status, inline: true },
          { name: 'Value', value: `$${contract.value.toLocaleString()}`, inline: true }
        )
        .setTimestamp();

      await discordUser.send({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }
  }

  async sendPaymentNotification(userId, transaction) {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user.discord_id) return;

      const discordUser = await this.client.users.fetch(user.discord_id);
      
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('Payment Received!')
        .setDescription(`You've received a payment`)
        .addFields(
          { name: 'Amount', value: `$${transaction.amount.toLocaleString()}`, inline: true },
          { name: 'Type', value: transaction.type, inline: true },
          { name: 'Transaction ID', value: transaction.transaction_hash, inline: false }
        )
        .setTimestamp();

      await discordUser.send({ embeds: [embed] });
    } catch (error) {
      console.error('Failed to send Discord payment notification:', error);
    }
  }

  async stop() {
    if (this.client) {
      await this.client.destroy();
    }
  }
}

module.exports = DiscordBot;