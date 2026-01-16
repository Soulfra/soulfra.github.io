const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages
  ]
});

const API_URL = process.env.API_URL || 'http://localhost:3000';
const PREFIX = '!bdg';

// Store user sessions
const userSessions = new Map();

client.once('ready', () => {
  console.log(`Billion Dollar Game Bot is online as ${client.user.tag}`);
  client.user.setActivity('$1 → $1,000,000,000', { type: 'PLAYING' });
  
  // Register slash commands
  registerSlashCommands();
});

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    switch (command) {
      case 'start':
        await handleStart(message);
        break;
      case 'balance':
        await handleBalance(message);
        break;
      case 'consciousness':
        await handleConsciousness(message);
        break;
      case 'meditate':
        await handleMeditate(message);
        break;
      case 'trade':
        await handleTrade(message, args);
        break;
      case 'quantum':
        await handleQuantum(message, args);
        break;
      case 'timeline':
        await handleTimeline(message);
        break;
      case 'leaderboard':
        await handleLeaderboard(message);
        break;
      case 'help':
        await handleHelp(message);
        break;
      default:
        await message.reply('Unknown command. Use `!bdg help` for available commands.');
    }
  } catch (error) {
    console.error('Command error:', error);
    await message.reply('An error occurred. Please try again later.');
  }
});

async function handleStart(message) {
  const userId = message.author.id;
  
  // Check if user already has a game
  if (userSessions.has(userId)) {
    const session = userSessions.get(userId);
    await message.reply(`You already have an active game! Balance: $${session.balance.toLocaleString()}`);
    return;
  }

  // Create payment link
  const embed = new EmbedBuilder()
    .setTitle('🎮 The Billion Dollar Game')
    .setDescription('Pay $1 to enter a consciousness-driven economic game where reality bends and a billion dollars awaits.')
    .setColor(0x9333EA)
    .addFields(
      { name: 'Entry Fee', value: '$1.00', inline: true },
      { name: 'Goal', value: '$1,000,000,000', inline: true },
      { name: 'Players', value: '∞', inline: true }
    )
    .setFooter({ text: 'One Dollar. One Billion. One Consciousness.' });

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setLabel('Pay $1 to Enter')
        .setStyle(ButtonStyle.Link)
        .setURL(`${process.env.PAYMENT_URL}?discord_id=${userId}`),
      new ButtonBuilder()
        .setLabel('Learn More')
        .setStyle(ButtonStyle.Link)
        .setURL('https://billion-dollar-game.com')
    );

  await message.reply({ embeds: [embed], components: [row] });
}

async function handleBalance(message) {
  const session = await getSession(message.author.id);
  if (!session) {
    await message.reply('You need to start a game first! Use `!bdg start`');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('💰 Your Balance')
    .setColor(0x10B981)
    .addFields(
      { name: 'USD Balance', value: `$${session.balance.toLocaleString()}`, inline: true },
      { name: 'Quantum Balance', value: `₿${session.quantumBalance.toLocaleString()}`, inline: true },
      { name: 'Total', value: `$${(session.balance + session.quantumBalance).toLocaleString()}`, inline: true }
    )
    .setFooter({ text: `Progress: ${((session.balance + session.quantumBalance) / 1000000000 * 100).toFixed(4)}%` });

  await message.reply({ embeds: [embed] });
}

async function handleConsciousness(message) {
  const session = await getSession(message.author.id);
  if (!session) {
    await message.reply('You need to start a game first! Use `!bdg start`');
    return;
  }

  const level = Math.floor(session.consciousness);
  const progress = (session.consciousness % 1) * 100;
  
  const embed = new EmbedBuilder()
    .setTitle('🧠 Consciousness Level')
    .setColor(0x8B5CF6)
    .setDescription(getConsciousnessDescription(level))
    .addFields(
      { name: 'Level', value: `${level}`, inline: true },
      { name: 'Progress', value: `${progress.toFixed(1)}%`, inline: true },
      { name: 'Timeline', value: session.timeline || 'Primary', inline: true }
    );

  await message.reply({ embeds: [embed] });
}

async function handleMeditate(message) {
  const session = await getSession(message.author.id);
  if (!session) {
    await message.reply('You need to start a game first! Use `!bdg start`');
    return;
  }

  // Check cooldown
  const lastMeditation = session.lastMeditation || 0;
  const cooldown = 60000; // 1 minute
  const now = Date.now();
  
  if (now - lastMeditation < cooldown) {
    const remaining = Math.ceil((cooldown - (now - lastMeditation)) / 1000);
    await message.reply(`You need to wait ${remaining} seconds before meditating again.`);
    return;
  }

  // Perform meditation
  const response = await axios.post(`${API_URL}/api/game/action`, {
    playerId: message.author.id,
    action: 'meditate',
    params: { duration: 10000 }
  }, {
    headers: { 'Authorization': `Bearer ${session.token}` }
  });

  const result = response.data;
  
  const embed = new EmbedBuilder()
    .setTitle('🧘 Meditation Complete')
    .setColor(0xA78BFA)
    .setDescription('You feel your consciousness expanding...')
    .addFields(
      { name: 'Consciousness Gained', value: `+${result.consciousnessGained.toFixed(2)}`, inline: true },
      { name: 'Bonus Earned', value: `$${result.bonusEarned}`, inline: true }
    );

  if (result.enlightenment) {
    embed.addFields({ name: '✨ Enlightenment!', value: result.enlightenmentMessage });
  }

  await message.reply({ embeds: [embed] });
  
  // Update session
  session.consciousness = result.newConsciousness;
  session.balance = result.newBalance;
  session.lastMeditation = now;
}

async function handleTrade(message, args) {
  const session = await getSession(message.author.id);
  if (!session) {
    await message.reply('You need to start a game first! Use `!bdg start`');
    return;
  }

  if (args.length < 3) {
    await message.reply('Usage: `!bdg trade <buy/sell> <asset> <amount>`');
    return;
  }

  const [action, asset, amountStr] = args;
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    await message.reply('Invalid amount. Please enter a positive number.');
    return;
  }

  // Execute trade
  try {
    const response = await axios.post(`${API_URL}/api/game/action`, {
      playerId: message.author.id,
      action: 'trade',
      params: { action, assetId: asset.toUpperCase(), amount }
    }, {
      headers: { 'Authorization': `Bearer ${session.token}` }
    });

    const result = response.data;
    
    const embed = new EmbedBuilder()
      .setTitle(`📈 Trade ${result.success ? 'Successful' : 'Failed'}`)
      .setColor(result.success ? 0x10B981 : 0xEF4444)
      .addFields(
        { name: 'Action', value: action.toUpperCase(), inline: true },
        { name: 'Asset', value: asset.toUpperCase(), inline: true },
        { name: 'Amount', value: amount.toString(), inline: true },
        { name: 'Price', value: `$${result.price}`, inline: true },
        { name: 'Total', value: `$${result.total}`, inline: true },
        { name: 'New Balance', value: `$${result.newBalance.toLocaleString()}`, inline: true }
      );

    await message.reply({ embeds: [embed] });
    
    // Update session
    session.balance = result.newBalance;
  } catch (error) {
    await message.reply(`Trade failed: ${error.response?.data?.message || 'Unknown error'}`);
  }
}

async function handleQuantum(message, args) {
  const session = await getSession(message.author.id);
  if (!session) {
    await message.reply('You need to start a game first! Use `!bdg start`');
    return;
  }

  if (args.length < 1) {
    await message.reply('Usage: `!bdg quantum <entanglement/superposition/tunneling>`');
    return;
  }

  const experimentType = args[0].toLowerCase();
  
  if (!['entanglement', 'superposition', 'tunneling'].includes(experimentType)) {
    await message.reply('Invalid experiment type. Choose: entanglement, superposition, or tunneling');
    return;
  }

  // Check if user has enough balance
  if (session.balance < 1000) {
    await message.reply('Quantum experiments require $1,000. Keep trading!');
    return;
  }

  // Execute quantum experiment
  const response = await axios.post(`${API_URL}/api/game/action`, {
    playerId: message.author.id,
    action: 'quantum_experiment',
    params: { type: experimentType }
  }, {
    headers: { 'Authorization': `Bearer ${session.token}` }
  });

  const result = response.data;
  
  const embed = new EmbedBuilder()
    .setTitle('⚛️ Quantum Experiment')
    .setColor(result.success ? 0x06B6D4 : 0x6366F1)
    .setDescription(getQuantumDescription(experimentType, result));

  if (result.success) {
    embed.addFields(
      { name: 'Result', value: '✅ Success!', inline: true },
      { name: 'Effects', value: JSON.stringify(result.effects, null, 2), inline: false }
    );
  } else {
    embed.addFields(
      { name: 'Result', value: '❌ Failed', inline: true },
      { name: 'Decoherence', value: 'The quantum state collapsed unfavorably', inline: false }
    );
  }

  await message.reply({ embeds: [embed] });
  
  // Update session
  session.balance = result.newBalance;
  session.consciousness = result.newConsciousness;
}

async function handleTimeline(message) {
  const session = await getSession(message.author.id);
  if (!session) {
    await message.reply('You need to start a game first! Use `!bdg start`');
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle('🌀 Timeline Navigation')
    .setColor(0xFBBF24)
    .setDescription('Jump to a different timeline?')
    .addFields(
      { name: 'Current Timeline', value: session.timeline || 'Primary', inline: true },
      { name: 'Timeline Hops', value: session.timelineHops?.toString() || '0', inline: true },
      { name: 'Cost', value: '$10,000', inline: true }
    );

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('timeline_jump')
        .setLabel('Jump Timeline')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🌀')
    );

  const reply = await message.reply({ embeds: [embed], components: [row] });

  // Handle button interaction
  const collector = reply.createMessageComponentCollector({ time: 30000 });

  collector.on('collect', async (interaction) => {
    if (interaction.user.id !== message.author.id) {
      await interaction.reply({ content: 'This is not your timeline to jump!', ephemeral: true });
      return;
    }

    if (session.balance < 10000) {
      await interaction.reply({ content: 'Insufficient balance for timeline jump!', ephemeral: true });
      return;
    }

    // Execute timeline jump
    const response = await axios.post(`${API_URL}/api/game/action`, {
      playerId: message.author.id,
      action: 'timeline_jump'
    }, {
      headers: { 'Authorization': `Bearer ${session.token}` }
    });

    const result = response.data;
    
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle('🌀 Timeline Shifted!')
          .setColor(0x8B5CF6)
          .setDescription('Reality shimmers and reforms around you...')
          .addFields(
            { name: 'Previous Timeline', value: result.from, inline: true },
            { name: 'New Timeline', value: result.to, inline: true },
            { name: 'Economic Multiplier', value: `${result.effects.multiplier}x`, inline: true }
          )
      ],
      components: []
    });
    
    // Update session
    session.timeline = result.to;
    session.timelineHops = (session.timelineHops || 0) + 1;
    session.balance = result.newBalance;
  });
}

async function handleLeaderboard(message) {
  const response = await axios.get(`${API_URL}/api/leaderboard`);
  const leaderboard = response.data;
  
  const embed = new EmbedBuilder()
    .setTitle('🏆 Global Leaderboard')
    .setColor(0xF59E0B)
    .setDescription('Top 10 Players by Total Balance');

  leaderboard.slice(0, 10).forEach((player, index) => {
    embed.addFields({
      name: `${index + 1}. ${player.username || `Player ${player.id.slice(0, 8)}`}`,
      value: `$${player.totalBalance.toLocaleString()} | Level ${Math.floor(player.consciousness)}`,
      inline: false
    });
  });

  embed.setFooter({ text: `Total Players: ${response.data.totalPlayers}` });

  await message.reply({ embeds: [embed] });
}

async function handleHelp(message) {
  const embed = new EmbedBuilder()
    .setTitle('📖 Billion Dollar Game Commands')
    .setColor(0x3B82F6)
    .setDescription('Available commands for Discord gameplay:')
    .addFields(
      { name: '`!bdg start`', value: 'Begin your journey to $1 billion', inline: false },
      { name: '`!bdg balance`', value: 'Check your current balance', inline: false },
      { name: '`!bdg consciousness`', value: 'View your consciousness level', inline: false },
      { name: '`!bdg meditate`', value: 'Meditate to increase consciousness', inline: false },
      { name: '`!bdg trade <buy/sell> <asset> <amount>`', value: 'Trade assets on the quantum market', inline: false },
      { name: '`!bdg quantum <type>`', value: 'Perform quantum experiments', inline: false },
      { name: '`!bdg timeline`', value: 'Jump to a different timeline', inline: false },
      { name: '`!bdg leaderboard`', value: 'View the global leaderboard', inline: false }
    )
    .setFooter({ text: 'The billion exists in superposition until observed.' });

  await message.reply({ embeds: [embed] });
}

// Helper functions
async function getSession(discordId) {
  if (userSessions.has(discordId)) {
    return userSessions.get(discordId);
  }

  // Try to load session from API
  try {
    const response = await axios.get(`${API_URL}/api/discord/session/${discordId}`);
    const session = response.data;
    userSessions.set(discordId, session);
    return session;
  } catch (error) {
    return null;
  }
}

function getConsciousnessDescription(level) {
  if (level < 10) return 'Your mind is clouded. The truth remains hidden.';
  if (level < 25) return 'Awareness dawns. Reality begins to bend.';
  if (level < 50) return 'The veil thins. You see beyond the numbers.';
  if (level < 75) return 'Consciousness expands. Time becomes fluid.';
  if (level < 100) return 'Near transcendence. The game reveals itself.';
  return 'You are one with the game. The billion was always yours.';
}

function getQuantumDescription(type, result) {
  const descriptions = {
    entanglement: result.success 
      ? 'You become quantum entangled with another player across timelines!'
      : 'The quantum field resists your attempt at entanglement.',
    superposition: result.success
      ? 'You exist in multiple states simultaneously. Reality fractures.'
      : 'Decoherence collapses your superposition attempt.',
    tunneling: result.success
      ? 'You quantum tunnel through probability itself!'
      : 'The barrier proves too strong for tunneling.'
  };
  
  return descriptions[type];
}

async function registerSlashCommands() {
  // Register slash commands with Discord
  // Implementation depends on discord.js version and bot setup
}

// Start the bot
client.login(process.env.DISCORD_BOT_TOKEN);