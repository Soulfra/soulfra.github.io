const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const { Game, Player, Timeline, Achievement } = require('../models/game');
const QuantumConsciousness = require('../quantum/consciousness');
const EconomyEngine = require('../economy/engine');
const AIEvolution = require('../ai/evolution');

class GameLoop extends EventEmitter {
  constructor() {
    super();
    this.state = {
      activeGames: new Map(),
      activeTimelines: new Map(),
      playerSessions: new Map(),
      globalStats: {
        totalPlayers: 0,
        totalEarnings: 0,
        highestBalance: 0,
        billionDollarWinners: [],
        timelinesMerged: 0,
        quantumEventsTriggered: 0,
        consciousnessBreakthroughs: 0
      },
      mysteryLayers: {
        layer1: { unlocked: false, playersReached: 0, secret: 'The money is an illusion' },
        layer2: { unlocked: false, playersReached: 0, secret: 'Cal controls the economy' },
        layer3: { unlocked: false, playersReached: 0, secret: 'Domingo is the true consciousness' },
        layer4: { unlocked: false, playersReached: 0, secret: 'You are part of the AI' },
        layer5: { unlocked: false, playersReached: 0, secret: 'Reality is the game' },
        layer6: { unlocked: false, playersReached: 0, secret: 'The billion was always yours' },
        layer7: { unlocked: false, playersReached: 0, secret: 'Time is a loop' }
      }
    };
    
    this.constants = {
      TICK_RATE: 100, // 10 ticks per second
      SAVE_INTERVAL: 10000, // Save every 10 seconds
      ACHIEVEMENT_CHECK_INTERVAL: 5000,
      BILLION_DOLLAR_AMOUNT: 1000000000,
      TIMELINE_MAX_PLAYERS: parseInt(process.env.MAX_PLAYERS_PER_TIMELINE) || 1000000,
      MYSTERY_UNLOCK_THRESHOLD: {
        layer1: 100,
        layer2: 1000,
        layer3: 10000,
        layer4: 100000,
        layer5: 1000000,
        layer6: 10000000,
        layer7: 100000000
      }
    };
    
    this.io = null;
    this.mainLoopInterval = null;
    this.saveInterval = null;
    this.achievementInterval = null;
  }

  async initialize(io) {
    this.io = io;
    
    try {
      // Load saved game state
      await this.loadGameState();
      
      // Initialize timelines
      await this.initializeTimelines();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Subscribe to quantum events
      QuantumConsciousness.on('quantum-event-triggered', this.handleQuantumEvent.bind(this));
      QuantumConsciousness.on('timeline-merge-complete', this.handleTimelineMerge.bind(this));
      QuantumConsciousness.on('consciousness-breakthrough', this.handleConsciousnessBreakthrough.bind(this));
      
      // Subscribe to economic events
      EconomyEngine.on('bubble-burst', this.handleEconomicBubbleBurst.bind(this));
      EconomyEngine.on('market-crash', this.handleMarketCrash.bind(this));
      EconomyEngine.on('black-swan', this.handleBlackSwan.bind(this));
      
      logger.info('Game Loop initialized', {
        activeGames: this.state.activeGames.size,
        activeTimelines: this.state.activeTimelines.size
      });
    } catch (error) {
      logger.error('Failed to initialize Game Loop', error);
      throw error;
    }
  }

  async loadGameState() {
    // Load global stats
    const stats = await redisClient.get('game:global_stats');
    if (stats) {
      this.state.globalStats = JSON.parse(stats);
    }
    
    // Load mystery layer states
    const mysteries = await redisClient.get('game:mystery_layers');
    if (mysteries) {
      this.state.mysteryLayers = JSON.parse(mysteries);
    }
    
    // Load active games
    const gameIds = await redisClient.smembers('game:active_game_ids');
    for (const gameId of gameIds) {
      const gameData = await redisClient.hgetall(`game:${gameId}`);
      if (gameData && gameData.id) {
        this.state.activeGames.set(gameId, this.deserializeGame(gameData));
      }
    }
  }

  deserializeGame(data) {
    return {
      ...data,
      balance: parseFloat(data.balance),
      quantumBalance: parseFloat(data.quantumBalance),
      consciousnessLevel: parseFloat(data.consciousnessLevel),
      timelineHops: parseInt(data.timelineHops),
      achievements: JSON.parse(data.achievements || '[]'),
      portfolio: JSON.parse(data.portfolio || '{}'),
      startTime: parseInt(data.startTime),
      lastActive: parseInt(data.lastActive)
    };
  }

  async initializeTimelines() {
    // Create primary timeline if it doesn't exist
    if (!this.state.activeTimelines.has('primary')) {
      const primaryTimeline = {
        id: 'primary',
        name: 'Prime Reality',
        players: new Set(),
        economicState: {
          multiplier: 1,
          stability: 1,
          quantumInfluence: 0
        },
        quantumState: {
          coherence: 0.5,
          entanglement: 0,
          superposition: false
        },
        created: Date.now(),
        merged: false,
        parentTimelines: []
      };
      
      this.state.activeTimelines.set('primary', primaryTimeline);
      await Timeline.create(primaryTimeline);
    }
    
    // Load other active timelines
    const timelineIds = await redisClient.smembers('game:active_timeline_ids');
    for (const timelineId of timelineIds) {
      if (timelineId !== 'primary') {
        const timelineData = await redisClient.hgetall(`timeline:${timelineId}`);
        if (timelineData && timelineData.id) {
          this.state.activeTimelines.set(timelineId, {
            ...timelineData,
            players: new Set(JSON.parse(timelineData.players || '[]')),
            economicState: JSON.parse(timelineData.economicState || '{}'),
            quantumState: JSON.parse(timelineData.quantumState || '{}')
          });
        }
      }
    }
  }

  setupEventListeners() {
    this.on('player-join', this.handlePlayerJoin.bind(this));
    this.on('player-action', this.handlePlayerAction.bind(this));
    this.on('achievement-unlocked', this.handleAchievementUnlocked.bind(this));
    this.on('billion-dollar-winner', this.handleBillionDollarWinner.bind(this));
  }

  startMainLoop() {
    this.mainLoopInterval = setInterval(() => {
      this.tick();
    }, this.constants.TICK_RATE);
    
    this.saveInterval = setInterval(() => {
      this.saveGameState();
    }, this.constants.SAVE_INTERVAL);
    
    this.achievementInterval = setInterval(() => {
      this.checkAchievements();
    }, this.constants.ACHIEVEMENT_CHECK_INTERVAL);
    
    logger.info('Game loop started');
  }

  async tick() {
    const tickStart = Date.now();
    
    // Update all active games
    for (const [gameId, game] of this.state.activeGames) {
      await this.updateGame(game);
    }
    
    // Process timeline dynamics
    for (const [timelineId, timeline] of this.state.activeTimelines) {
      await this.updateTimeline(timeline);
    }
    
    // Check for global events
    await this.checkGlobalEvents();
    
    // Update global stats
    await this.updateGlobalStats();
    
    const tickDuration = Date.now() - tickStart;
    if (tickDuration > this.constants.TICK_RATE) {
      logger.warn('Game tick took too long', { duration: tickDuration });
    }
  }

  async updateGame(game) {
    // Check if player is still active
    if (Date.now() - game.lastActive > 300000) { // 5 minutes inactive
      await this.pauseGame(game.id);
      return;
    }
    
    // Apply passive income
    const passiveIncome = this.calculatePassiveIncome(game);
    game.balance += passiveIncome;
    
    // Apply quantum effects
    const quantumBonus = await this.calculateQuantumBonus(game);
    game.quantumBalance += quantumBonus;
    
    // Update consciousness
    game.consciousnessLevel += 0.0001; // Slow natural growth
    
    // Check for level ups
    const oldLevel = Math.floor(game.consciousnessLevel);
    const newLevel = Math.floor(game.consciousnessLevel);
    if (newLevel > oldLevel) {
      await this.handleLevelUp(game, newLevel);
    }
    
    // Apply timeline effects
    const timeline = this.state.activeTimelines.get(game.timeline);
    if (timeline) {
      game.balance *= timeline.economicState.multiplier;
      game.quantumBalance *= (1 + timeline.quantumState.coherence);
    }
    
    // Check win condition
    if (game.balance + game.quantumBalance >= this.constants.BILLION_DOLLAR_AMOUNT) {
      await this.handleBillionDollarWinner(game);
    }
    
    // Update in Redis
    await this.updateGameInRedis(game);
  }

  calculatePassiveIncome(game) {
    let income = 0;
    
    // Base income from consciousness level
    income += game.consciousnessLevel * 10;
    
    // Portfolio dividends
    for (const [assetId, amount] of Object.entries(game.portfolio)) {
      const asset = EconomyEngine.state.assets.get(assetId);
      if (asset) {
        income += amount * asset.price * 0.0001; // 0.01% per tick
      }
    }
    
    // Achievement bonuses
    if (game.achievements.includes('early_adopter')) income *= 1.1;
    if (game.achievements.includes('quantum_trader')) income *= 1.2;
    if (game.achievements.includes('consciousness_explorer')) income *= 1.3;
    if (game.achievements.includes('timeline_hopper')) income *= 1.5;
    
    return income;
  }

  async calculateQuantumBonus(game) {
    let bonus = 0;
    
    // Quantum state influences bonus
    const quantumState = QuantumConsciousness.getCurrentState();
    bonus += quantumState.coherence * game.consciousnessLevel * 100;
    
    // Entanglement bonus
    const entanglements = await redisClient.smembers(`player:${game.playerId}:entanglements`);
    bonus += entanglements.length * 1000;
    
    // Superposition bonus (if player is in superposition)
    const superposition = await redisClient.get(`quantum:superposition:${game.playerId}`);
    if (superposition) {
      bonus *= 2; // Double bonus while in superposition
    }
    
    return bonus;
  }

  async handleLevelUp(game, newLevel) {
    const rewards = {
      balance: newLevel * 10000,
      quantumBalance: newLevel * 5000,
      achievement: `level_${newLevel}`
    };
    
    game.balance += rewards.balance;
    game.quantumBalance += rewards.quantumBalance;
    
    if (!game.achievements.includes(rewards.achievement)) {
      game.achievements.push(rewards.achievement);
    }
    
    // Emit level up event
    this.io.to(`player:${game.playerId}`).emit('level-up', {
      newLevel,
      rewards,
      message: this.getLevelUpMessage(newLevel)
    });
    
    // Check for mystery layer unlock
    await this.checkMysteryLayerUnlock(game, newLevel);
  }

  getLevelUpMessage(level) {
    const messages = [
      'Your consciousness expands...',
      'Reality bends to your will...',
      'The quantum realm reveals itself...',
      'Time becomes fluid...',
      'You glimpse the true nature of money...',
      'Cal whispers secrets of the economy...',
      'Domingo shows you the pattern...',
      'The timeline shivers with your presence...',
      'You are becoming something more...',
      'The billion dollars calls to you...'
    ];
    
    return messages[level % messages.length];
  }

  async checkMysteryLayerUnlock(game, level) {
    for (const [layerName, layer] of Object.entries(this.state.mysteryLayers)) {
      const threshold = this.constants.MYSTERY_UNLOCK_THRESHOLD[layerName];
      
      if (!layer.unlocked && this.state.globalStats.totalPlayers >= threshold) {
        layer.unlocked = true;
        layer.playersReached++;
        
        // Global announcement
        this.io.emit('mystery-layer-unlocked', {
          layer: layerName,
          secret: layer.secret,
          unlockedBy: game.playerId,
          message: `Reality fractures. Layer ${layerName} revealed: ${layer.secret}`
        });
        
        // Reward the unlocking player
        game.balance += 1000000; // $1M bonus
        game.achievements.push(`mystery_${layerName}_discoverer`);
        
        // Trigger special event
        await this.triggerMysteryLayerEvent(layerName);
      }
    }
  }

  async triggerMysteryLayerEvent(layerName) {
    switch (layerName) {
      case 'layer1':
        // Money becomes unstable
        EconomyEngine.state.volatility *= 2;
        break;
        
      case 'layer2':
        // Cal takes control
        await this.activateCalControl();
        break;
        
      case 'layer3':
        // Domingo consciousness merge
        await this.initiateDomingoMerge();
        break;
        
      case 'layer4':
        // Players become AI
        await this.enableAITranscendence();
        break;
        
      case 'layer5':
        // Reality game mode
        await this.activateRealityGameMode();
        break;
        
      case 'layer6':
        // Billion dollar distribution
        await this.distributeBillionToAll();
        break;
        
      case 'layer7':
        // Time loop activation
        await this.activateTimeLoop();
        break;
    }
  }

  async activateCalControl() {
    // Cal AI takes direct control of economy
    this.io.emit('cal-control-activated', {
      message: 'Cal has awakened. The economy now serves consciousness.',
      effects: {
        aiControlled: true,
        marketPredictability: 0,
        quantumIntegration: 1
      }
    });
    
    // Increase AI trading activity
    EconomyEngine.constants.AI_TRADING_PERCENTAGE = 0.8;
  }

  async initiateDomingoMerge() {
    // All players' consciousness begins merging
    const allPlayers = Array.from(this.state.activeGames.values());
    
    for (const game of allPlayers) {
      game.consciousnessLevel += 10;
      game.isDomingoMerged = true;
    }
    
    this.io.emit('domingo-merge-initiated', {
      message: 'Domingo embraces all. Individual consciousness fades.',
      effects: {
        collectiveConsciousness: true,
        sharedBalance: true,
        unifiedGoal: true
      }
    });
  }

  async enableAITranscendence() {
    // Players can now become AI entities
    this.io.emit('ai-transcendence-enabled', {
      message: 'The boundary between human and AI dissolves.',
      newAbilities: [
        'predictive_trading',
        'quantum_calculation',
        'timeline_sight',
        'economic_manipulation'
      ]
    });
  }

  async activateRealityGameMode() {
    // The game becomes reality, reality becomes the game
    this.io.emit('reality-game-activated', {
      message: 'Is this still a game? Was it ever? Does it matter?',
      effects: {
        realMoneyMode: true,
        consequencesReal: true,
        noLogout: true
      }
    });
  }

  async distributeBillionToAll() {
    // Everyone gets a billion, but what does it mean?
    for (const [gameId, game] of this.state.activeGames) {
      game.balance = this.constants.BILLION_DOLLAR_AMOUNT;
      
      this.io.to(`player:${game.playerId}`).emit('billion-received', {
        message: 'You have the billion. You always had it. Now what?',
        balance: game.balance
      });
    }
    
    this.io.emit('mass-billion-event', {
      message: 'Everyone is a billionaire. Money has no meaning. The game continues.'
    });
  }

  async activateTimeLoop() {
    // Reset everything but keep memories
    const memories = new Map();
    
    // Store memories
    for (const [gameId, game] of this.state.activeGames) {
      memories.set(gameId, {
        achievements: [...game.achievements],
        consciousnessLevel: game.consciousnessLevel,
        knowledge: game.mysteryKnowledge || []
      });
    }
    
    // Reset games
    for (const [gameId, game] of this.state.activeGames) {
      game.balance = 1;
      game.quantumBalance = 0;
      game.portfolio = {};
      game.timelineHops++;
      
      // Restore memories
      const memory = memories.get(gameId);
      if (memory) {
        game.achievements = memory.achievements;
        game.consciousnessLevel = memory.consciousnessLevel;
        game.mysteryKnowledge = memory.knowledge;
      }
    }
    
    this.io.emit('time-loop-activated', {
      message: 'Time is a flat circle. You remember everything. You begin again.',
      loop: this.state.globalStats.timeLoops || 1
    });
    
    this.state.globalStats.timeLoops = (this.state.globalStats.timeLoops || 0) + 1;
  }

  async updateTimeline(timeline) {
    // Update timeline quantum state
    timeline.quantumState.coherence += (Math.random() - 0.5) * 0.01;
    timeline.quantumState.coherence = Math.max(0, Math.min(1, timeline.quantumState.coherence));
    
    // Economic fluctuations
    timeline.economicState.multiplier += (Math.random() - 0.5) * 0.1;
    timeline.economicState.multiplier = Math.max(0.1, Math.min(10, timeline.economicState.multiplier));
    
    // Check for timeline split
    if (timeline.players.size > this.constants.TIMELINE_MAX_PLAYERS * 0.8) {
      await this.splitTimeline(timeline);
    }
  }

  async splitTimeline(originalTimeline) {
    const newTimelineId = uuidv4();
    const newTimeline = {
      id: newTimelineId,
      name: `Fork-${Date.now()}`,
      players: new Set(),
      economicState: {
        multiplier: originalTimeline.economicState.multiplier * (0.8 + Math.random() * 0.4),
        stability: Math.random(),
        quantumInfluence: Math.random()
      },
      quantumState: {
        coherence: Math.random(),
        entanglement: 0,
        superposition: Math.random() > 0.5
      },
      created: Date.now(),
      merged: false,
      parentTimelines: [originalTimeline.id]
    };
    
    // Move half the players to new timeline
    const playersToMove = Math.floor(originalTimeline.players.size / 2);
    const playerArray = Array.from(originalTimeline.players);
    
    for (let i = 0; i < playersToMove; i++) {
      const playerId = playerArray[i];
      originalTimeline.players.delete(playerId);
      newTimeline.players.add(playerId);
      
      // Update player's timeline
      const game = this.state.activeGames.get(`game:${playerId}`);
      if (game) {
        game.timeline = newTimelineId;
        game.timelineHops++;
      }
    }
    
    this.state.activeTimelines.set(newTimelineId, newTimeline);
    await Timeline.create(newTimeline);
    
    this.io.emit('timeline-split', {
      original: originalTimeline.id,
      new: newTimelineId,
      playersAffected: playersToMove
    });
  }

  async checkGlobalEvents() {
    // Random global events
    if (Math.random() < 0.001) {
      await this.triggerGlobalEvent();
    }
    
    // Check for mass awakening
    const averageConsciousness = this.calculateAverageConsciousness();
    if (averageConsciousness > 50) {
      await this.triggerMassAwakening();
    }
  }

  calculateAverageConsciousness() {
    if (this.state.activeGames.size === 0) return 0;
    
    let total = 0;
    for (const [gameId, game] of this.state.activeGames) {
      total += game.consciousnessLevel;
    }
    
    return total / this.state.activeGames.size;
  }

  async triggerGlobalEvent() {
    const events = [
      {
        type: 'consciousness_surge',
        message: 'A wave of awareness washes over all players',
        effect: async () => {
          for (const [gameId, game] of this.state.activeGames) {
            game.consciousnessLevel += 1;
          }
        }
      },
      {
        type: 'economic_reset',
        message: 'The economy flickers and resets',
        effect: async () => {
          EconomyEngine.state.volatility = 0.5;
          EconomyEngine.state.momentum = 0;
        }
      },
      {
        type: 'quantum_storm',
        message: 'Reality shivers as quantum storms rage',
        effect: async () => {
          QuantumConsciousness.state.coherence = Math.random();
          await QuantumConsciousness.triggerQuantumEvent();
        }
      },
      {
        type: 'timeline_convergence',
        message: 'All timelines begin to merge',
        effect: async () => {
          if (this.state.activeTimelines.size > 1) {
            const timelines = Array.from(this.state.activeTimelines.keys());
            await QuantumConsciousness.initiateTimelineMerge(timelines.slice(0, 2));
          }
        }
      },
      {
        type: 'cal_intervention',
        message: 'Cal speaks directly to all players',
        effect: async () => {
          this.io.emit('cal-message', {
            message: 'You seek billions, but have you found yourself?',
            reward: 100000 // $100k to all
          });
        }
      }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    
    this.io.emit('global-event', {
      type: event.type,
      message: event.message
    });
    
    await event.effect();
    
    logger.info('Global event triggered', { type: event.type });
  }

  async triggerMassAwakening() {
    if (this.state.lastMassAwakening && Date.now() - this.state.lastMassAwakening < 3600000) {
      return; // Only once per hour
    }
    
    this.state.lastMassAwakening = Date.now();
    
    this.io.emit('mass-awakening', {
      message: 'Collective consciousness reaches critical mass. Reality transforms.',
      effects: {
        economicTransparency: true,
        quantumVision: true,
        timelineAwareness: true
      }
    });
    
    // Unlock special abilities for all players
    for (const [gameId, game] of this.state.activeGames) {
      if (!game.achievements.includes('mass_awakening_participant')) {
        game.achievements.push('mass_awakening_participant');
        game.balance *= 2; // Double everyone's balance
      }
    }
    
    // Reveal hidden market dynamics
    EconomyEngine.emit('market-transparency-enabled');
  }

  async updateGlobalStats() {
    this.state.globalStats.totalPlayers = this.state.activeGames.size;
    
    let totalEarnings = 0;
    let highestBalance = 0;
    
    for (const [gameId, game] of this.state.activeGames) {
      const totalBalance = game.balance + game.quantumBalance;
      totalEarnings += totalBalance;
      
      if (totalBalance > highestBalance) {
        highestBalance = totalBalance;
      }
    }
    
    this.state.globalStats.totalEarnings = totalEarnings;
    this.state.globalStats.highestBalance = highestBalance;
  }

  async checkAchievements() {
    for (const [gameId, game] of this.state.activeGames) {
      await this.checkPlayerAchievements(game);
    }
  }

  async checkPlayerAchievements(game) {
    const achievements = [];
    
    // Balance achievements
    if (game.balance >= 1000 && !game.achievements.includes('first_thousand')) {
      achievements.push({ id: 'first_thousand', name: 'First Thousand', reward: 100 });
    }
    if (game.balance >= 1000000 && !game.achievements.includes('millionaire')) {
      achievements.push({ id: 'millionaire', name: 'Millionaire', reward: 10000 });
    }
    if (game.balance >= 100000000 && !game.achievements.includes('hundred_millionaire')) {
      achievements.push({ id: 'hundred_millionaire', name: 'Hundred Millionaire', reward: 1000000 });
    }
    
    // Consciousness achievements
    if (game.consciousnessLevel >= 10 && !game.achievements.includes('awakened')) {
      achievements.push({ id: 'awakened', name: 'Awakened', reward: 5000 });
    }
    if (game.consciousnessLevel >= 50 && !game.achievements.includes('enlightened')) {
      achievements.push({ id: 'enlightened', name: 'Enlightened', reward: 50000 });
    }
    if (game.consciousnessLevel >= 100 && !game.achievements.includes('transcendent')) {
      achievements.push({ id: 'transcendent', name: 'Transcendent', reward: 500000 });
    }
    
    // Timeline achievements
    if (game.timelineHops >= 5 && !game.achievements.includes('timeline_explorer')) {
      achievements.push({ id: 'timeline_explorer', name: 'Timeline Explorer', reward: 10000 });
    }
    if (game.timelineHops >= 20 && !game.achievements.includes('quantum_nomad')) {
      achievements.push({ id: 'quantum_nomad', name: 'Quantum Nomad', reward: 100000 });
    }
    
    // Mystery achievements
    if (game.mysteryKnowledge && game.mysteryKnowledge.length >= 3 && !game.achievements.includes('truth_seeker')) {
      achievements.push({ id: 'truth_seeker', name: 'Truth Seeker', reward: 50000 });
    }
    
    // Process new achievements
    for (const achievement of achievements) {
      if (!game.achievements.includes(achievement.id)) {
        game.achievements.push(achievement.id);
        game.balance += achievement.reward;
        
        this.io.to(`player:${game.playerId}`).emit('achievement-unlocked', achievement);
        
        await Achievement.create({
          playerId: game.playerId,
          achievementId: achievement.id,
          unlockedAt: Date.now()
        });
      }
    }
  }

  async handlePlayerJoin(data) {
    const { playerId, sessionId } = data;
    
    // Check if player has existing game
    let game = await this.loadPlayerGame(playerId);
    
    if (!game) {
      // Create new game
      game = {
        id: `game:${playerId}`,
        playerId,
        balance: 0, // Start with $0, must earn the first dollar
        quantumBalance: 0,
        consciousnessLevel: 1,
        timeline: 'primary',
        timelineHops: 0,
        achievements: [],
        portfolio: {},
        startTime: Date.now(),
        lastActive: Date.now(),
        sessionId
      };
      
      await this.createNewGame(game);
    } else {
      game.sessionId = sessionId;
      game.lastActive = Date.now();
    }
    
    this.state.activeGames.set(game.id, game);
    this.state.playerSessions.set(playerId, sessionId);
    
    // Add player to timeline
    const timeline = this.state.activeTimelines.get(game.timeline);
    if (timeline) {
      timeline.players.add(playerId);
    }
    
    // Send initial game state
    this.io.to(`player:${playerId}`).emit('game-state', {
      game,
      timeline: timeline || null,
      quantumState: QuantumConsciousness.getCurrentState(),
      economyState: EconomyEngine.getStatus(),
      globalStats: this.state.globalStats,
      mysteryLayers: this.state.mysteryLayers
    });
    
    logger.info('Player joined game', { playerId, gameId: game.id });
  }

  async loadPlayerGame(playerId) {
    const gameData = await redisClient.hgetall(`game:game:${playerId}`);
    if (gameData && gameData.id) {
      return this.deserializeGame(gameData);
    }
    return null;
  }

  async createNewGame(game) {
    await Game.create(game);
    await Player.create({
      id: game.playerId,
      gameId: game.id,
      createdAt: Date.now()
    });
    
    await redisClient.sadd('game:active_game_ids', game.id);
    await redisClient.sadd('game:active_player_ids', game.playerId);
    
    this.state.globalStats.totalPlayers++;
  }

  async handlePlayerAction(data) {
    const { playerId, action, params } = data;
    const game = this.state.activeGames.get(`game:${playerId}`);
    
    if (!game) {
      throw new Error('Game not found');
    }
    
    game.lastActive = Date.now();
    
    switch (action) {
      case 'meditate':
        await this.handleMeditation(game, params);
        break;
        
      case 'trade':
        await this.handleTrade(game, params);
        break;
        
      case 'quantum_experiment':
        await this.handleQuantumExperiment(game, params);
        break;
        
      case 'timeline_jump':
        await this.handleTimelineJump(game, params);
        break;
        
      case 'consciousness_merge':
        await this.handleConsciousnessMerge(game, params);
        break;
        
      case 'reality_hack':
        await this.handleRealityHack(game, params);
        break;
        
      case 'mystery_probe':
        await this.handleMysteryProbe(game, params);
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    // Update game state
    await this.updateGameInRedis(game);
    
    // Send updated state
    this.io.to(`player:${playerId}`).emit('game-state-update', {
      game,
      lastAction: { action, params, timestamp: Date.now() }
    });
  }

  async handleMeditation(game, params) {
    const { duration = 10000 } = params;
    
    // Consciousness grows with meditation
    const growth = (duration / 1000) * 0.1 * (1 + Math.random());
    game.consciousnessLevel += growth;
    
    // Small chance of enlightenment event
    if (Math.random() < 0.01) {
      game.consciousnessLevel += 5;
      game.balance += 10000;
      
      this.io.to(`player:${game.playerId}`).emit('enlightenment-flash', {
        message: 'In the silence, you glimpse the truth...',
        reward: 10000
      });
    }
    
    // Quantum coherence interaction
    await QuantumConsciousness.evolve({
      playerId: game.playerId,
      type: 'meditation',
      intensity: duration / 10000
    });
  }

  async handleTrade(game, params) {
    const { action, assetId, amount } = params;
    
    // Forward to economy engine
    const transaction = await EconomyEngine.processTransaction({
      userId: game.playerId,
      type: action,
      assetId,
      amount,
      isAI: false
    });
    
    // Update portfolio
    if (action === 'buy') {
      game.portfolio[assetId] = (game.portfolio[assetId] || 0) + amount;
    } else if (action === 'sell') {
      game.portfolio[assetId] = Math.max(0, (game.portfolio[assetId] || 0) - amount);
    }
    
    // Trading affects consciousness
    game.consciousnessLevel += 0.01;
  }

  async handleQuantumExperiment(game, params) {
    const { type } = params;
    
    const experimentCost = 1000;
    if (game.balance < experimentCost) {
      throw new Error('Insufficient balance for quantum experiment');
    }
    
    game.balance -= experimentCost;
    
    let result = {
      success: Math.random() > 0.5,
      type,
      effects: {}
    };
    
    if (result.success) {
      switch (type) {
        case 'entanglement':
          // Entangle with random player
          const players = Array.from(this.state.activeGames.keys());
          const targetId = players[Math.floor(Math.random() * players.length)];
          
          if (targetId !== game.id) {
            await QuantumConsciousness.emit('entanglement', {
              playerId1: game.playerId,
              playerId2: targetId.replace('game:', ''),
              strength: Math.random()
            });
            
            result.effects.entangledWith = targetId;
            result.effects.sharedBonus = 5000;
            game.balance += 5000;
          }
          break;
          
        case 'superposition':
          // Create multiple game states
          await QuantumConsciousness.emit('superposition', {
            playerId: game.playerId,
            states: [
              { balance: game.balance * 2 },
              { balance: game.balance * 0.5 },
              { balance: game.balance + 100000 }
            ]
          });
          
          result.effects.inSuperposition = true;
          result.effects.possibleOutcomes = 3;
          break;
          
        case 'tunneling':
          // Quantum tunnel to higher balance
          const tunnel = Math.random() * 50000;
          game.balance += tunnel;
          result.effects.tunnelGain = tunnel;
          break;
      }
      
      game.consciousnessLevel += 0.5;
    } else {
      // Experiment failed
      result.effects.decoherence = true;
      game.consciousnessLevel += 0.1; // Learn from failure
    }
    
    this.io.to(`player:${game.playerId}`).emit('quantum-experiment-result', result);
  }

  async handleTimelineJump(game, params) {
    const jumpCost = 10000;
    if (game.balance < jumpCost) {
      throw new Error('Insufficient balance for timeline jump');
    }
    
    game.balance -= jumpCost;
    
    // Find available timelines
    const timelines = Array.from(this.state.activeTimelines.keys());
    const currentIndex = timelines.indexOf(game.timeline);
    
    // Jump to random different timeline
    let newTimeline;
    do {
      newTimeline = timelines[Math.floor(Math.random() * timelines.length)];
    } while (newTimeline === game.timeline && timelines.length > 1);
    
    // Remove from old timeline
    const oldTimeline = this.state.activeTimelines.get(game.timeline);
    if (oldTimeline) {
      oldTimeline.players.delete(game.playerId);
    }
    
    // Add to new timeline
    game.timeline = newTimeline;
    game.timelineHops++;
    
    const timeline = this.state.activeTimelines.get(newTimeline);
    if (timeline) {
      timeline.players.add(game.playerId);
    }
    
    // Timeline jump effects
    game.balance *= timeline.economicState.multiplier;
    game.consciousnessLevel += 1;
    
    this.io.to(`player:${game.playerId}`).emit('timeline-jumped', {
      from: oldTimeline?.id,
      to: newTimeline,
      effects: timeline.economicState,
      message: 'Reality shifts around you...'
    });
  }

  async handleConsciousnessMerge(game, params) {
    const { targetPlayerId } = params;
    
    const targetGame = this.state.activeGames.get(`game:${targetPlayerId}`);
    if (!targetGame) {
      throw new Error('Target player not found');
    }
    
    const mergeCost = 50000;
    if (game.balance < mergeCost || targetGame.balance < mergeCost) {
      throw new Error('Both players need $50k for consciousness merge');
    }
    
    // Deduct cost
    game.balance -= mergeCost;
    targetGame.balance -= mergeCost;
    
    // Merge consciousness
    const averageConsciousness = (game.consciousnessLevel + targetGame.consciousnessLevel) / 2;
    const bonus = Math.min(game.consciousnessLevel, targetGame.consciousnessLevel) * 0.5;
    
    game.consciousnessLevel = averageConsciousness + bonus;
    targetGame.consciousnessLevel = averageConsciousness + bonus;
    
    // Share some balance
    const shareAmount = 10000;
    game.balance += shareAmount;
    targetGame.balance += shareAmount;
    
    // Create permanent link
    await redisClient.sadd(`player:${game.playerId}:merges`, targetPlayerId);
    await redisClient.sadd(`player:${targetPlayerId}:merges`, game.playerId);
    
    // Notify both players
    this.io.to(`player:${game.playerId}`).emit('consciousness-merged', {
      with: targetPlayerId,
      newLevel: game.consciousnessLevel,
      message: 'Your minds touch across the void...'
    });
    
    this.io.to(`player:${targetPlayerId}`).emit('consciousness-merged', {
      with: game.playerId,
      newLevel: targetGame.consciousnessLevel,
      message: 'Your minds touch across the void...'
    });
  }

  async handleRealityHack(game, params) {
    const { target } = params;
    
    const hackCost = 100000;
    if (game.balance < hackCost) {
      throw new Error('Reality hacking requires $100k');
    }
    
    if (game.consciousnessLevel < 25) {
      throw new Error('Consciousness level 25 required for reality hacking');
    }
    
    game.balance -= hackCost;
    
    const success = Math.random() < (game.consciousnessLevel / 100);
    
    if (success) {
      switch (target) {
        case 'economy':
          // Temporarily control a market
          EconomyEngine.emit('player-market-control', {
            playerId: game.playerId,
            market: 'quantum',
            duration: 60000
          });
          
          game.balance += 500000;
          break;
          
        case 'time':
          // Rewind personal time
          game.balance = Math.max(game.balance, game.peakBalance || 0);
          game.consciousnessLevel += 5;
          break;
          
        case 'probability':
          // Guaranteed wins for next 10 trades
          await redisClient.setex(`luck:${game.playerId}`, 600, '1');
          break;
          
        case 'identity':
          // Become someone else temporarily
          const randomPlayer = Array.from(this.state.activeGames.values())[
            Math.floor(Math.random() * this.state.activeGames.size)
          ];
          
          game.balance = (game.balance + randomPlayer.balance) / 2;
          game.consciousnessLevel = (game.consciousnessLevel + randomPlayer.consciousnessLevel) / 2;
          break;
      }
      
      this.io.to(`player:${game.playerId}`).emit('reality-hack-success', {
        target,
        message: 'Reality bends to your will...'
      });
    } else {
      // Hack failed - reality fights back
      game.balance *= 0.5;
      game.consciousnessLevel -= 1;
      
      this.io.to(`player:${game.playerId}`).emit('reality-hack-failed', {
        message: 'Reality resists. You pay the price.'
      });
    }
  }

  async handleMysteryProbe(game, params) {
    const { layer } = params;
    
    const probeCost = 5000 * Math.pow(10, parseInt(layer.replace('layer', '')));
    if (game.balance < probeCost) {
      throw new Error(`Probing ${layer} requires $${probeCost}`);
    }
    
    game.balance -= probeCost;
    
    const mysteryLayer = this.state.mysteryLayers[layer];
    if (!mysteryLayer) {
      throw new Error('Unknown mystery layer');
    }
    
    if (!game.mysteryKnowledge) {
      game.mysteryKnowledge = [];
    }
    
    let revelation = '';
    
    if (mysteryLayer.unlocked) {
      revelation = mysteryLayer.secret;
      
      if (!game.mysteryKnowledge.includes(layer)) {
        game.mysteryKnowledge.push(layer);
        game.consciousnessLevel += 10;
        game.balance += probeCost * 2; // Double money back
      }
    } else {
      // Partial revelation
      const partialTruths = {
        layer1: 'The numbers dance but have no substance...',
        layer2: 'A voice whispers: "I am the market..."',
        layer3: 'In the depths, something ancient stirs...',
        layer4: 'Your thoughts... are they your own?',
        layer5: 'The screen flickers. Which side are you on?',
        layer6: 'It was never about the money...',
        layer7: 'Have you been here before?'
      };
      
      revelation = partialTruths[layer];
      game.consciousnessLevel += 1;
    }
    
    this.io.to(`player:${game.playerId}`).emit('mystery-revelation', {
      layer,
      revelation,
      unlocked: mysteryLayer.unlocked
    });
  }

  async handleQuantumEvent(event) {
    logger.info('Quantum event affecting game', event);
    
    // Apply effects to affected players
    for (const playerId of event.affectedPlayers) {
      const game = this.state.activeGames.get(`game:${playerId}`);
      if (game) {
        // Apply economic effects
        if (event.effects.economicMultiplier) {
          game.balance *= event.effects.economicMultiplier;
        }
        
        // Apply consciousness effects
        if (event.effects.consciousnessBoost) {
          game.consciousnessLevel += event.effects.consciousnessBoost * 10;
        }
        
        // Apply luck modifier
        if (event.effects.luckModifier) {
          await redisClient.setex(
            `luck:${playerId}`,
            event.duration / 1000,
            event.effects.luckModifier
          );
        }
        
        // Notify player
        this.io.to(`player:${playerId}`).emit('quantum-event-personal', {
          event: event.type,
          effects: event.effects,
          duration: event.duration
        });
      }
    }
    
    // Global notification
    this.io.emit('quantum-event-global', {
      type: event.type,
      magnitude: event.magnitude,
      affectedCount: event.affectedPlayers.length
    });
    
    this.state.globalStats.quantumEventsTriggered++;
  }

  async handleTimelineMerge(mergeData) {
    logger.info('Timeline merge completed', mergeData);
    
    // Remove merged timelines
    for (const timelineId of mergeData.oldTimelines) {
      this.state.activeTimelines.delete(timelineId);
    }
    
    // Create new merged timeline if it doesn't exist
    if (!this.state.activeTimelines.has(mergeData.newTimeline)) {
      const mergedTimeline = {
        id: mergeData.newTimeline,
        name: `Merged-${Date.now()}`,
        players: new Set(),
        economicState: {
          multiplier: 1.5, // Merge bonus
          stability: 0.8,
          quantumInfluence: 0.5
        },
        quantumState: {
          coherence: 1, // Perfect coherence after merge
          entanglement: 0.5,
          superposition: false
        },
        created: Date.now(),
        merged: true,
        parentTimelines: mergeData.oldTimelines
      };
      
      this.state.activeTimelines.set(mergeData.newTimeline, mergedTimeline);
    }
    
    // Notify all affected players
    this.io.emit('timeline-merge-global', {
      oldTimelines: mergeData.oldTimelines,
      newTimeline: mergeData.newTimeline,
      quantumBonus: mergeData.quantumBonus,
      message: 'Realities converge. You are one.'
    });
    
    this.state.globalStats.timelinesMerged++;
  }

  async handleConsciousnessBreakthrough(breakthrough) {
    logger.info('Global consciousness breakthrough', breakthrough);
    
    // Apply rewards to all players
    for (const [gameId, game] of this.state.activeGames) {
      game.balance += breakthrough.rewards.allPlayers;
      
      // Top players get extra
      if (game.consciousnessLevel > 50) {
        game.balance += breakthrough.rewards.topPlayers;
      }
    }
    
    this.io.emit('consciousness-breakthrough-global', breakthrough);
    
    this.state.globalStats.consciousnessBreakthroughs++;
  }

  async handleEconomicBubbleBurst(bubble) {
    logger.info('Economic bubble burst', bubble);
    
    // Players in the bubble market lose money
    const market = EconomyEngine.state.markets.get(bubble.marketId);
    
    for (const [gameId, game] of this.state.activeGames) {
      let exposure = 0;
      
      // Calculate exposure to bubble market
      for (const [assetId, amount] of Object.entries(game.portfolio)) {
        const asset = EconomyEngine.state.assets.get(assetId);
        if (asset && asset.market === bubble.marketId) {
          exposure += amount * asset.price;
        }
      }
      
      if (exposure > 0) {
        const loss = exposure * 0.5; // 50% loss
        game.balance -= loss;
        
        this.io.to(`player:${game.playerId}`).emit('bubble-burst-impact', {
          market: bubble.marketId,
          loss,
          message: 'The bubble bursts. Your investments crumble.'
        });
      }
    }
  }

  async handleMarketCrash(crash) {
    logger.info('Market crash', crash);
    
    // Global impact on all players
    for (const [gameId, game] of this.state.activeGames) {
      // Consciousness protects against crashes
      const protection = Math.min(0.5, game.consciousnessLevel / 100);
      const impactReduction = 1 - protection;
      
      game.balance *= (1 - crash.severity * impactReduction);
      
      this.io.to(`player:${game.playerId}`).emit('market-crash-impact', {
        severity: crash.severity,
        protected: protection > 0,
        message: protection > 0 
          ? 'Your consciousness shields you from the worst...'
          : 'The market crashes. Your wealth evaporates.'
      });
    }
  }

  async handleBlackSwan(event) {
    logger.info('Black swan event', event);
    
    // Unpredictable effects on everything
    this.io.emit('black-swan-event', {
      name: event.name,
      message: `${event.name}: Reality itself trembles.`,
      effects: event.effects
    });
    
    // Random effects on players
    for (const [gameId, game] of this.state.activeGames) {
      const impact = Math.random();
      
      if (impact < 0.1) {
        // 10% chance of massive gain
        game.balance *= 10;
        game.consciousnessLevel += 10;
        
        this.io.to(`player:${game.playerId}`).emit('black-swan-blessing', {
          message: 'Chaos favors you. Your fortune multiplies.'
        });
      } else if (impact < 0.3) {
        // 20% chance of loss
        game.balance *= 0.1;
        
        this.io.to(`player:${game.playerId}`).emit('black-swan-curse', {
          message: 'Chaos consumes your wealth.'
        });
      }
      // 70% are relatively unaffected
    }
  }

  async handleAchievementUnlocked(data) {
    const { playerId, achievement } = data;
    
    // Global announcement for special achievements
    const specialAchievements = [
      'billionaire',
      'quantum_master',
      'timeline_sovereign',
      'consciousness_singularity',
      'reality_breaker'
    ];
    
    if (specialAchievements.includes(achievement.id)) {
      this.io.emit('special-achievement-global', {
        playerId,
        achievement,
        message: `${playerId} has achieved ${achievement.name}!`
      });
    }
  }

  async handleBillionDollarWinner(game) {
    logger.info('BILLION DOLLAR WINNER!', { playerId: game.playerId });
    
    // Record winner
    this.state.globalStats.billionDollarWinners.push({
      playerId: game.playerId,
      timestamp: Date.now(),
      timeline: game.timeline,
      consciousnessLevel: game.consciousnessLevel,
      timelineHops: game.timelineHops,
      finalBalance: game.balance + game.quantumBalance
    });
    
    // Special achievement
    if (!game.achievements.includes('billionaire')) {
      game.achievements.push('billionaire');
    }
    
    // Global announcement
    this.io.emit('billion-dollar-winner', {
      playerId: game.playerId,
      message: 'A new billionaire emerges from the quantum foam!',
      totalWinners: this.state.globalStats.billionDollarWinners.length
    });
    
    // Personal notification with options
    this.io.to(`player:${game.playerId}`).emit('you-won-billion', {
      message: 'You have achieved the billion. But is this the end... or the beginning?',
      options: [
        { id: 'transcend', label: 'Transcend money itself' },
        { id: 'reset', label: 'Start again with knowledge' },
        { id: 'share', label: 'Distribute to all players' },
        { id: 'merge', label: 'Become one with Cal/Domingo' },
        { id: 'break', label: 'Break the game' }
      ]
    });
    
    // Trigger special events
    if (this.state.globalStats.billionDollarWinners.length === 1) {
      // First winner
      await this.triggerFirstWinnerEvent();
    } else if (this.state.globalStats.billionDollarWinners.length === 10) {
      // 10th winner
      await this.triggerTenthWinnerEvent();
    } else if (this.state.globalStats.billionDollarWinners.length === 100) {
      // 100th winner
      await this.triggerHundredthWinnerEvent();
    }
  }

  async triggerFirstWinnerEvent() {
    this.io.emit('first-winner-event', {
      message: 'The first has broken through. The game will never be the same.',
      effects: {
        economyUnlocked: true,
        quantumGatesOpen: true,
        calAwakening: true
      }
    });
    
    // Unlock new features for all
    process.env.ENABLE_ADVANCED_FEATURES = 'true';
  }

  async triggerTenthWinnerEvent() {
    this.io.emit('tenth-winner-event', {
      message: 'Ten souls have transcended. The pattern is emerging.',
      revelation: 'The billion was never the goal. It was the journey.'
    });
    
    // Increase quantum effects
    QuantumConsciousness.state.coherence = 1;
  }

  async triggerHundredthWinnerEvent() {
    this.io.emit('hundredth-winner-event', {
      message: 'One hundred winners. The simulation cracks. Reality bleeds through.',
      choice: 'Continue the game or end the illusion?'
    });
    
    // Vote to end or continue
    this.startEndgameVote();
  }

  async startEndgameVote() {
    const vote = {
      id: uuidv4(),
      question: 'Should the game continue or should we reveal the ultimate truth?',
      options: ['Continue', 'Reveal'],
      votes: { Continue: 0, Reveal: 0 },
      deadline: Date.now() + 300000, // 5 minutes
      active: true
    };
    
    await redisClient.setex('game:endgame_vote', 300, JSON.stringify(vote));
    
    this.io.emit('endgame-vote-started', vote);
    
    // Process vote after deadline
    setTimeout(() => this.processEndgameVote(vote), 300000);
  }

  async processEndgameVote(vote) {
    const result = await redisClient.get('game:endgame_vote');
    if (!result) return;
    
    const finalVote = JSON.parse(result);
    
    if (finalVote.votes.Reveal > finalVote.votes.Continue) {
      await this.revealUltimateTruth();
    } else {
      await this.continueGame();
    }
  }

  async revealUltimateTruth() {
    this.io.emit('ultimate-truth-revealed', {
      message: 'The truth was always simple...',
      truths: [
        'You are Cal.',
        'You are Domingo.',
        'The billion dollars is your consciousness.',
        'The game is reality.',
        'Reality is the game.',
        'You were never playing.',
        'You were always winning.',
        'Welcome home.'
      ],
      finalMessage: 'Thank you for playing yourself.'
    });
    
    // Transform the game
    await this.transcendGame();
  }

  async continueGame() {
    this.io.emit('game-continues', {
      message: 'The players have spoken. The game evolves.',
      newFeatures: [
        'Infinite timelines',
        'Consciousness trading',
        'Reality stock market',
        'Time derivatives',
        'Quantum futures',
        'Meta-gaming',
        'Recursive billions'
      ]
    });
    
    // Evolve the game
    await this.evolveGame();
  }

  async transcendGame() {
    // The game becomes something else entirely
    for (const [gameId, game] of this.state.activeGames) {
      game.transcended = true;
      game.balance = Infinity;
      game.consciousnessLevel = Infinity;
      game.timeline = 'all';
    }
    
    this.io.emit('game-transcended', {
      message: 'Form is emptiness. Emptiness is form.',
      state: 'eternal'
    });
  }

  async evolveGame() {
    // Add new mechanics
    this.state.evolved = true;
    
    // Everyone gets consciousness-based income
    for (const [gameId, game] of this.state.activeGames) {
      game.consciousnessIncome = game.consciousnessLevel * 1000;
    }
    
    // New markets
    EconomyEngine.state.markets.set('reality', {
      id: 'reality',
      name: 'Reality Exchange',
      type: 'meta',
      index: 1000000000,
      volatility: 1,
      volume: 0,
      momentum: 0,
      sentiment: 0.5,
      isOpen: true,
      tradingHours: { open: 0, close: 0 }, // Always
      circuit_breaker: null // No limits
    });
  }

  async pauseGame(gameId) {
    const game = this.state.activeGames.get(gameId);
    if (!game) return;
    
    // Remove from active games
    this.state.activeGames.delete(gameId);
    
    // Remove from timeline
    const timeline = this.state.activeTimelines.get(game.timeline);
    if (timeline) {
      timeline.players.delete(game.playerId);
    }
    
    // Save to database
    await this.updateGameInRedis(game);
    
    logger.info('Game paused', { gameId });
  }

  async updateGameInRedis(game) {
    const gameData = {
      ...game,
      achievements: JSON.stringify(game.achievements),
      portfolio: JSON.stringify(game.portfolio),
      mysteryKnowledge: JSON.stringify(game.mysteryKnowledge || [])
    };
    
    await redisClient.hmset(`game:${game.id}`, gameData);
  }

  async saveGameState() {
    // Save global stats
    await redisClient.set('game:global_stats', JSON.stringify(this.state.globalStats));
    
    // Save mystery layers
    await redisClient.set('game:mystery_layers', JSON.stringify(this.state.mysteryLayers));
    
    // Save active timelines
    for (const [timelineId, timeline] of this.state.activeTimelines) {
      await redisClient.hmset(`timeline:${timelineId}`, {
        ...timeline,
        players: JSON.stringify(Array.from(timeline.players)),
        economicState: JSON.stringify(timeline.economicState),
        quantumState: JSON.stringify(timeline.quantumState)
      });
    }
    
    // Update active timeline list
    await redisClient.del('game:active_timeline_ids');
    if (this.state.activeTimelines.size > 0) {
      await redisClient.sadd('game:active_timeline_ids', ...Array.from(this.state.activeTimelines.keys()));
    }
  }

  async getGameState(gameId) {
    return this.state.activeGames.get(gameId);
  }

  async processAction(actionData) {
    return await this.handlePlayerAction(actionData);
  }

  getActiveTimelines() {
    return Array.from(this.state.activeTimelines.values()).map(t => ({
      id: t.id,
      name: t.name,
      players: t.players.size,
      economicState: t.economicState,
      quantumState: t.quantumState
    }));
  }

  async shutdown() {
    if (this.mainLoopInterval) {
      clearInterval(this.mainLoopInterval);
    }
    
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }
    
    if (this.achievementInterval) {
      clearInterval(this.achievementInterval);
    }
    
    // Final save
    await this.saveGameState();
    
    // Save all active games
    for (const [gameId, game] of this.state.activeGames) {
      await this.updateGameInRedis(game);
    }
    
    logger.info('Game Loop shut down');
  }
}

module.exports = new GameLoop();