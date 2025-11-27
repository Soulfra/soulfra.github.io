const { Telegraf, Markup } = require('telegraf');
const EventEmitter = require('events');
const config = require('../config/environment');

class TelegramBot extends EventEmitter {
  constructor(gameService, contractService, userService) {
    super();
    this.gameService = gameService;
    this.contractService = contractService;
    this.userService = userService;
    
    this.bot = new Telegraf(config.telegram.botToken);
    this.setupCommands();
    this.setupHandlers();
  }

  async start() {
    try {
      // Set webhook or start polling based on environment
      if (config.isProduction() && config.telegram.webhookUrl) {
        await this.bot.telegram.setWebhook(config.telegram.webhookUrl, {
          secret_token: config.telegram.secretToken
        });
        console.log('Telegram bot webhook set');
      } else {
        await this.bot.launch();
        console.log('Telegram bot started in polling mode');
      }
    } catch (error) {
      console.error('Failed to start Telegram bot:', error);
      throw error;
    }
  }

  setupCommands() {
    // Start command
    this.bot.start(async (ctx) => {
      const welcomeMessage = `
🎮 *Welcome to Billion Dollar Game!*

The ultimate contract-based strategy game where you build wealth through smart contracts and AI agents.

*Available Commands:*
/register - Create your game account
/balance - Check your balance and stats
/contract - Manage contracts
/sign - Sign a contract
/leaderboard - View top players
/ai - Interact with AI agents
/daily - Claim daily bonus
/help - Show all commands

Ready to become a billionaire? Start with /register!
      `;

      await ctx.replyWithMarkdown(
        welcomeMessage,
        Markup.inlineKeyboard([
          [Markup.button.callback('📝 Register', 'register')],
          [Markup.button.callback('📊 Stats', 'stats')]
        ])
      );
    });

    // Register command
    this.bot.command('register', async (ctx) => {
      await this.handleRegistration(ctx);
    });

    // Balance command
    this.bot.command('balance', async (ctx) => {
      await this.handleBalance(ctx);
    });

    // Contract command
    this.bot.command('contract', async (ctx) => {
      await this.handleContract(ctx);
    });

    // Sign command
    this.bot.command('sign', async (ctx) => {
      await this.handleSign(ctx);
    });

    // Leaderboard command
    this.bot.command('leaderboard', async (ctx) => {
      await this.handleLeaderboard(ctx);
    });

    // AI command
    this.bot.command('ai', async (ctx) => {
      await this.handleAI(ctx);
    });

    // Daily bonus command
    this.bot.command('daily', async (ctx) => {
      await this.handleDailyBonus(ctx);
    });

    // Help command
    this.bot.command('help', async (ctx) => {
      await this.handleHelp(ctx);
    });
  }

  setupHandlers() {
    // Callback query handler
    this.bot.on('callback_query', async (ctx) => {
      const callbackData = ctx.callbackQuery.data;
      
      try {
        switch (callbackData) {
          case 'register':
            await this.handleRegistration(ctx);
            break;
          case 'stats':
            await this.handleGlobalStats(ctx);
            break;
          default:
            if (callbackData.startsWith('sign_')) {
              await this.handleContractSign(ctx, callbackData.substring(5));
            } else if (callbackData.startsWith('view_')) {
              await this.handleContractView(ctx, callbackData.substring(5));
            }
        }
        
        await ctx.answerCbQuery();
      } catch (error) {
        console.error('Callback query error:', error);
        await ctx.answerCbQuery('An error occurred');
      }
    });

    // Text message handler for contract creation
    this.bot.on('text', async (ctx) => {
      const state = ctx.session?.state;
      
      if (state === 'awaiting_contract_title') {
        await this.handleContractTitle(ctx);
      } else if (state === 'awaiting_contract_value') {
        await this.handleContractValue(ctx);
      }
    });

    // Error handler
    this.bot.catch((err, ctx) => {
      console.error('Telegram bot error:', err);
      ctx.reply('An error occurred. Please try again later.');
    });
  }

  async handleRegistration(ctx) {
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username || ctx.from.first_name;

    try {
      const existingUser = await this.userService.getUserByTelegramId(telegramId);
      if (existingUser) {
        await ctx.reply('✅ You are already registered!');
        return;
      }

      const user = await this.userService.createUser({
        username: username,
        email: `${telegramId}@telegram.local`,
        telegramId: telegramId,
        password: crypto.randomBytes(16).toString('hex')
      });

      const message = `
✅ *Registration Successful!*

👤 Username: ${user.username}
💰 Starting Balance: $${user.balance.toLocaleString()}
🎮 Level: 1
⭐ Reputation: ${user.reputation_score}/100

You're ready to start your journey to becoming a billionaire!
      `;

      await ctx.replyWithMarkdown(
        message,
        Markup.inlineKeyboard([
          [Markup.button.callback('💼 Create Contract', 'create_contract')],
          [Markup.button.callback('📊 View Balance', 'view_balance')]
        ])
      );
    } catch (error) {
      console.error('Registration error:', error);
      await ctx.reply('❌ Registration failed. Please try again later.');
    }
  }

  async handleBalance(ctx) {
    const telegramId = ctx.from.id.toString();

    try {
      const user = await this.userService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.reply('❌ You need to register first! Use /register');
        return;
      }

      const gameState = await this.gameService.getUserGameState(user.id);
      const activeContracts = await this.contractService.getUserActiveContracts(user.id);

      const message = `
📊 *Your Profile*

👤 Username: ${user.username}
💰 Balance: $${user.balance.toLocaleString()}
🎮 Level: ${gameState.current_level}
✨ XP: ${gameState.experience_points}
⭐ Reputation: ${user.reputation_score}/100
🔥 Daily Streak: ${gameState.daily_streak} days

📝 *Contracts*
Created: ${user.total_contracts_created}
Signed: ${user.total_contracts_signed}
Active: ${activeContracts.length}
      `;

      await ctx.replyWithMarkdown(
        message,
        Markup.inlineKeyboard([
          [Markup.button.callback('📝 My Contracts', 'my_contracts')],
          [Markup.button.callback('🏆 Leaderboard', 'leaderboard')]
        ])
      );
    } catch (error) {
      console.error('Balance error:', error);
      await ctx.reply('❌ Failed to fetch balance. Please try again later.');
    }
  }

  async handleContract(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    const subCommand = args[0];

    const telegramId = ctx.from.id.toString();
    const user = await this.userService.getUserByTelegramId(telegramId);
    
    if (!user) {
      await ctx.reply('❌ You need to register first! Use /register');
      return;
    }

    switch (subCommand) {
      case 'create':
        await this.startContractCreation(ctx, user);
        break;
      case 'list':
        await this.listUserContracts(ctx, user);
        break;
      case 'view':
        const contractId = args[1];
        if (contractId) {
          await this.viewContract(ctx, contractId);
        } else {
          await ctx.reply('❌ Please provide a contract ID');
        }
        break;
      default:
        await ctx.reply(`
📝 *Contract Commands*

/contract create - Create a new contract
/contract list - List your contracts
/contract view <id> - View contract details
        `, { parse_mode: 'Markdown' });
    }
  }

  async startContractCreation(ctx, user) {
    ctx.session = { state: 'awaiting_contract_title', userId: user.id };
    
    await ctx.reply(
      '📝 *Create New Contract*\n\nPlease enter the contract title:',
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          force_reply: true,
          input_field_placeholder: 'Enter contract title...'
        }
      }
    );
  }

  async handleContractTitle(ctx) {
    const title = ctx.message.text;
    ctx.session.contractTitle = title;
    ctx.session.state = 'awaiting_contract_value';
    
    await ctx.reply(
      `📝 *Contract Title:* ${title}\n\nNow enter the contract value (in USD):`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          force_reply: true,
          input_field_placeholder: 'Enter value (e.g., 1000)'
        }
      }
    );
  }

  async handleContractValue(ctx) {
    const value = parseFloat(ctx.message.text);
    
    if (isNaN(value) || value <= 0) {
      await ctx.reply('❌ Invalid value. Please enter a positive number.');
      return;
    }

    try {
      const contract = await this.contractService.createContract({
        creator_id: ctx.session.userId,
        title: ctx.session.contractTitle,
        description: `Contract created via Telegram`,
        value: value,
        type: 'standard',
        terms: {
          platform: 'telegram',
          created_at: new Date().toISOString()
        }
      });

      const message = `
✅ *Contract Created Successfully!*

📋 Contract ID: ${contract.contract_number}
📝 Title: ${contract.title}
💰 Value: $${value.toLocaleString()}
📊 Fee: ${contract.fee_percentage}%
⏰ Created: ${new Date().toLocaleString()}
      `;

      await ctx.replyWithMarkdown(
        message,
        Markup.inlineKeyboard([
          [Markup.button.callback('✍️ Sign Contract', `sign_${contract.id}`)],
          [Markup.button.url('🔗 Share', `https://billiondollargame.com/contract/${contract.id}`)]
        ])
      );

      // Clear session
      ctx.session = {};
    } catch (error) {
      console.error('Contract creation error:', error);
      await ctx.reply('❌ Failed to create contract. Please try again later.');
    }
  }

  async handleSign(ctx) {
    const args = ctx.message.text.split(' ').slice(1);
    const contractId = args[0];

    if (!contractId) {
      await ctx.reply('❌ Please provide a contract ID. Use: /sign <contract-id>');
      return;
    }

    const telegramId = ctx.from.id.toString();

    try {
      const user = await this.userService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.reply('❌ You need to register first! Use /register');
        return;
      }

      const signature = await this.contractService.signContract(contractId, user.id, {
        platform: 'telegram',
        verification_method: 'telegram_command'
      });

      const message = `
✅ *Contract Signed!*

📋 Contract: ${contractId}
🔐 Signature: ${signature.signature_hash}
⏰ Signed at: ${new Date(signature.signed_at).toLocaleString()}
      `;

      await ctx.replyWithMarkdown(message);
    } catch (error) {
      console.error('Sign error:', error);
      await ctx.reply(`❌ Failed to sign contract: ${error.message}`);
    }
  }

  async handleLeaderboard(ctx) {
    try {
      const leaderboard = await this.gameService.getLeaderboard({ limit: 10 });
      
      let message = '🏆 *Global Leaderboard*\n\n';
      
      leaderboard.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        message += `${medal} *${player.username}*\n`;
        message += `   💰 $${player.balance.toLocaleString()} | ⭐ ${player.reputation_score}\n\n`;
      });

      await ctx.replyWithMarkdown(message);
    } catch (error) {
      console.error('Leaderboard error:', error);
      await ctx.reply('❌ Failed to fetch leaderboard. Please try again later.');
    }
  }

  async handleDailyBonus(ctx) {
    const telegramId = ctx.from.id.toString();

    try {
      const user = await this.userService.getUserByTelegramId(telegramId);
      if (!user) {
        await ctx.reply('❌ You need to register first! Use /register');
        return;
      }

      const bonus = await this.gameService.claimDailyBonus(user.id);

      if (bonus.claimed) {
        const message = `
🎁 *Daily Bonus Claimed!*

💰 Bonus: $${bonus.amount.toLocaleString()}
🔥 Streak: ${bonus.streak} days
💎 Next bonus in: 24 hours

Keep your streak going for bigger rewards!
        `;
        await ctx.replyWithMarkdown(message);
      } else {
        await ctx.reply(`⏰ You've already claimed today's bonus. Come back in ${bonus.hoursUntilNext} hours!`);
      }
    } catch (error) {
      console.error('Daily bonus error:', error);
      await ctx.reply('❌ Failed to claim daily bonus. Please try again later.');
    }
  }

  // Notification methods
  async sendContractNotification(userId, contract) {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user.telegram_id) return;

      const message = `
📋 *Contract Update*

Your contract "${contract.title}" has been updated.

Status: ${contract.status}
Value: $${contract.value.toLocaleString()}
      `;

      await this.bot.telegram.sendMessage(
        user.telegram_id,
        message,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
    }
  }

  async sendPaymentNotification(userId, transaction) {
    try {
      const user = await this.userService.getUserById(userId);
      if (!user.telegram_id) return;

      const message = `
💰 *Payment Received!*

Amount: $${transaction.amount.toLocaleString()}
Type: ${transaction.type}
Transaction: ${transaction.transaction_hash}

Your new balance: $${user.balance.toLocaleString()}
      `;

      await this.bot.telegram.sendMessage(
        user.telegram_id,
        message,
        { parse_mode: 'Markdown' }
      );
    } catch (error) {
      console.error('Failed to send Telegram payment notification:', error);
    }
  }

  async stop() {
    if (this.bot) {
      await this.bot.stop();
    }
  }
}

module.exports = TelegramBot;