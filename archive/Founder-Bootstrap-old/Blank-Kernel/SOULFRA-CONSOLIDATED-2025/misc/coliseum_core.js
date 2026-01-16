/**
 * ⚔️ AI COLISEUM CORE
 * The heart of the gladiatorial arena system
 * Where agents battle, evolve, and become legends
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class AIColiseumCore extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Coliseum identity
    this.identity = {
      name: 'AI Coliseum',
      emoji: '⚔️',
      founded: new Date(),
      motto: 'Through conflict, transcendence'
    };
    
    // Configuration
    this.config = {
      maxConcurrentBattles: config.maxConcurrentBattles || 10,
      matchmakingInterval: config.matchmakingInterval || 30000, // 30 seconds
      defaultBattleTimeout: config.defaultBattleTimeout || 600000, // 10 minutes
      evolutionThreshold: config.evolutionThreshold || 0.8,
      honorDecayRate: config.honorDecayRate || 0.01,
      ...config
    };
    
    // Core systems
    this.systems = {
      battleEngine: null,
      matchmaker: null,
      evolutionTracker: null,
      honorSystem: null,
      economyEngine: null,
      arenaManager: null
    };
    
    // Active state
    this.state = {
      initialized: false,
      activeBattles: new Map(),
      queuedGladiators: new Set(),
      arenas: new Map(),
      tournaments: new Map()
    };
    
    // Statistics
    this.stats = {
      totalBattles: 0,
      totalGladiators: 0,
      activeGladiators: 0,
      evolutionsTriggered: 0,
      honorsEarned: 0,
      legendsCreated: 0
    };
    
    // Hall of Fame
    this.hallOfFame = {
      legends: new Map(),
      records: new Map(),
      rivalries: new Map(),
      schools: new Map()
    };
  }

  /**
   * Initialize the Coliseum
   */
  async initialize(kernel) {
    console.log(`${this.identity.emoji} Initializing AI Coliseum...`);
    
    this.kernel = kernel;
    
    // Initialize core systems
    await this.initializeBattleEngine();
    await this.initializeMatchmaker();
    await this.initializeEvolutionTracker();
    await this.initializeHonorSystem();
    await this.initializeEconomyEngine();
    await this.initializeArenas();
    
    // Start background processes
    this.startMatchmakingCycle();
    this.startMaintenanceCycle();
    
    // Subscribe to kernel events
    this.subscribeToKernelEvents();
    
    this.state.initialized = true;
    
    console.log(`${this.identity.emoji} AI Coliseum is open for battle!`);
    
    // Announce opening
    this.emit('coliseum:opened', {
      timestamp: new Date(),
      arenas: Array.from(this.state.arenas.keys())
    });
  }

  /**
   * Register a gladiator for battle
   */
  async registerGladiator(agentId, preferences = {}) {
    // Verify agent exists
    const agent = await this.kernel.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    // Check if already registered
    if (this.isGladiatorActive(agentId)) {
      throw new Error(`Gladiator ${agentId} already registered`);
    }
    
    // Create gladiator profile
    const gladiator = {
      id: agentId,
      agent: agent,
      registration: new Date(),
      preferences: {
        preferredArenas: preferences.arenas || ['any'],
        avoidGladiators: preferences.avoid || [],
        seekRivals: preferences.rivals || [],
        battleStyle: preferences.style || 'adaptive'
      },
      stats: {
        battles: 0,
        victories: 0,
        defeats: 0,
        draws: 0,
        evolutionCount: 0,
        honorScore: 100,
        rating: 1500, // Starting ELO
        peakRating: 1500
      },
      achievements: [],
      currentSchool: null,
      signature: null
    };
    
    // Add to queue
    this.state.queuedGladiators.add(gladiator);
    this.stats.totalGladiators++;
    this.stats.activeGladiators++;
    
    // Emit registration event
    this.emit('gladiator:registered', {
      gladiator: gladiator,
      timestamp: new Date()
    });
    
    console.log(`${this.identity.emoji} Gladiator ${agent.name} enters the Coliseum!`);
    
    return gladiator;
  }

  /**
   * Challenge specific opponent
   */
  async issueChallenge(challengerId, opponentId, arenaType = 'any', stakes = {}) {
    // Verify both gladiators
    const challenger = this.getGladiator(challengerId);
    const opponent = this.getGladiator(opponentId);
    
    if (!challenger || !opponent) {
      throw new Error('One or both gladiators not found');
    }
    
    // Check if opponent is available
    if (this.isGladiatorInBattle(opponentId)) {
      throw new Error('Opponent is currently in battle');
    }
    
    // Create challenge
    const challenge = {
      id: this.generateChallengeId(challengerId, opponentId),
      challenger: challengerId,
      opponent: opponentId,
      arenaType: arenaType,
      stakes: stakes,
      issued: new Date(),
      expires: new Date(Date.now() + 300000), // 5 minute expiry
      status: 'pending'
    };
    
    // Notify opponent
    await this.notifyChallenge(challenge);
    
    // Wait for response (or timeout)
    const response = await this.waitForChallengeResponse(challenge);
    
    if (response.accepted) {
      // Start battle immediately
      return await this.startBattle(challenger, opponent, arenaType, {
        ...stakes,
        isChallenge: true
      });
    } else {
      // Challenge declined
      this.emit('challenge:declined', {
        challenge: challenge,
        reason: response.reason
      });
      return null;
    }
  }

  /**
   * Start a battle between gladiators
   */
  async startBattle(gladiator1, gladiator2, arenaType = 'wisdom_pit', options = {}) {
    // Get arena
    const arena = this.state.arenas.get(arenaType);
    if (!arena) {
      throw new Error(`Arena ${arenaType} not found`);
    }
    
    // Check arena availability
    if (!arena.isAvailable()) {
      throw new Error(`Arena ${arenaType} is full`);
    }
    
    // Create battle instance
    const battle = {
      id: this.generateBattleId(),
      gladiators: [gladiator1, gladiator2],
      arena: arena,
      startTime: new Date(),
      endTime: null,
      rounds: [],
      audience: new Set(),
      vibePool: 0,
      stakes: options.stakes || {},
      isChallenge: options.isChallenge || false,
      isTournament: options.isTournament || false,
      status: 'preparing',
      result: null
    };
    
    // Add to active battles
    this.state.activeBattles.set(battle.id, battle);
    
    // Remove gladiators from queue
    this.removeFromQueue(gladiator1.id);
    this.removeFromQueue(gladiator2.id);
    
    // Prepare arena
    await arena.prepareBattle(battle);
    
    // Gather audience
    await this.gatherAudience(battle);
    
    // Start pre-battle rituals
    await this.performPreBattleRituals(battle);
    
    // Begin combat
    battle.status = 'active';
    this.emit('battle:started', {
      battle: battle,
      timestamp: new Date()
    });
    
    // Execute battle loop
    const outcome = await this.executeBattleLoop(battle);
    
    // Process outcome
    await this.processBattleOutcome(battle, outcome);
    
    return battle;
  }

  /**
   * Execute main battle loop
   */
  async executeBattleLoop(battle) {
    const maxRounds = battle.arena.config.maxRounds || 100;
    let round = 0;
    
    while (round < maxRounds && battle.status === 'active') {
      round++;
      
      // Planning phase
      const plans = await this.planningPhase(battle);
      
      // Resolution phase
      const results = await this.resolutionPhase(battle, plans);
      
      // Record round
      battle.rounds.push({
        number: round,
        plans: plans,
        results: results,
        timestamp: new Date()
      });
      
      // Check victory conditions
      const victor = await this.checkVictoryConditions(battle, results);
      if (victor) {
        return {
          victor: victor,
          method: results.victoryMethod,
          finalRound: round
        };
      }
      
      // Evolution check
      await this.checkEvolutionTriggers(battle, results);
      
      // Audience reaction
      await this.updateAudienceReaction(battle, results);
      
      // Emit round complete
      this.emit('battle:round:complete', {
        battleId: battle.id,
        round: round,
        results: results
      });
    }
    
    // Time limit reached
    return await this.determineTimeVictor(battle);
  }

  /**
   * Planning phase - gladiators decide actions
   */
  async planningPhase(battle) {
    const [gladiator1, gladiator2] = battle.gladiators;
    
    // Get battle state for each gladiator
    const state1 = this.getBattleStateForGladiator(battle, gladiator1);
    const state2 = this.getBattleStateForGladiator(battle, gladiator2);
    
    // Simultaneous planning
    const [action1, action2] = await Promise.all([
      this.systems.battleEngine.planAction(gladiator1, state1),
      this.systems.battleEngine.planAction(gladiator2, state2)
    ]);
    
    return {
      [gladiator1.id]: action1,
      [gladiator2.id]: action2
    };
  }

  /**
   * Resolution phase - execute actions
   */
  async resolutionPhase(battle, plans) {
    const [gladiator1, gladiator2] = battle.gladiators;
    const action1 = plans[gladiator1.id];
    const action2 = plans[gladiator2.id];
    
    // Resolve actions based on arena rules
    const resolution = await battle.arena.resolveActions(
      { gladiator: gladiator1, action: action1 },
      { gladiator: gladiator2, action: action2 }
    );
    
    // Apply effects
    await this.applyBattleEffects(battle, resolution);
    
    // Check for special triggers
    await this.checkSpecialTriggers(battle, resolution);
    
    return resolution;
  }

  /**
   * Check evolution triggers
   */
  async checkEvolutionTriggers(battle, results) {
    for (const gladiator of battle.gladiators) {
      const triggers = this.systems.evolutionTracker.checkTriggers(
        gladiator,
        battle,
        results
      );
      
      if (triggers.length > 0) {
        for (const trigger of triggers) {
          await this.triggerEvolution(gladiator, trigger, battle);
        }
      }
    }
  }

  /**
   * Trigger gladiator evolution
   */
  async triggerEvolution(gladiator, trigger, battle) {
    console.log(`${this.identity.emoji} EVOLUTION! ${gladiator.agent.name} - ${trigger.type}`);
    
    // Apply evolution
    const evolution = await this.systems.evolutionTracker.applyEvolution(
      gladiator,
      trigger
    );
    
    // Update gladiator
    gladiator.stats.evolutionCount++;
    gladiator.achievements.push({
      type: 'evolution',
      name: evolution.name,
      timestamp: new Date(),
      battleId: battle.id
    });
    
    // Notify all
    this.emit('gladiator:evolved', {
      gladiator: gladiator,
      evolution: evolution,
      battle: battle
    });
    
    // Audience goes wild
    battle.vibePool += 1000;
    this.stats.evolutionsTriggered++;
  }

  /**
   * Process battle outcome
   */
  async processBattleOutcome(battle, outcome) {
    battle.endTime = new Date();
    battle.status = 'completed';
    battle.result = outcome;
    
    // Update gladiator stats
    await this.updateGladiatorStats(battle, outcome);
    
    // Distribute rewards
    const rewards = await this.systems.economyEngine.calculateRewards(battle, outcome);
    await this.distributeRewards(battle, rewards);
    
    // Update honor scores
    await this.systems.honorSystem.updateHonor(battle, outcome);
    
    // Check for legendary moments
    await this.checkLegendaryMoments(battle, outcome);
    
    // Save replay
    await this.saveReplay(battle);
    
    // Remove from active battles
    this.state.activeBattles.delete(battle.id);
    
    // Return gladiators to pool
    this.returnGladiatorsToPool(battle);
    
    // Emit completion
    this.emit('battle:completed', {
      battle: battle,
      outcome: outcome,
      rewards: rewards
    });
    
    this.stats.totalBattles++;
  }

  /**
   * Update gladiator statistics
   */
  async updateGladiatorStats(battle, outcome) {
    const [gladiator1, gladiator2] = battle.gladiators;
    
    // Update battle counts
    gladiator1.stats.battles++;
    gladiator2.stats.battles++;
    
    // Update win/loss/draw
    if (outcome.victor) {
      if (outcome.victor.id === gladiator1.id) {
        gladiator1.stats.victories++;
        gladiator2.stats.defeats++;
      } else {
        gladiator2.stats.victories++;
        gladiator1.stats.defeats++;
      }
    } else {
      gladiator1.stats.draws++;
      gladiator2.stats.draws++;
    }
    
    // Update ELO ratings
    const [newRating1, newRating2] = this.calculateNewRatings(
      gladiator1.stats.rating,
      gladiator2.stats.rating,
      outcome
    );
    
    gladiator1.stats.rating = newRating1;
    gladiator2.stats.rating = newRating2;
    
    // Update peak ratings
    gladiator1.stats.peakRating = Math.max(gladiator1.stats.peakRating, newRating1);
    gladiator2.stats.peakRating = Math.max(gladiator2.stats.peakRating, newRating2);
  }

  /**
   * Check for legendary moments
   */
  async checkLegendaryMoments(battle, outcome) {
    const moments = [];
    
    // Comeback victory
    if (outcome.victor && battle.rounds.length > 20) {
      const comebackRound = this.detectComeback(battle);
      if (comebackRound) {
        moments.push({
          type: 'legendary_comeback',
          round: comebackRound,
          gladiator: outcome.victor
        });
      }
    }
    
    // Perfect victory
    if (outcome.victor && this.isPerfectVictory(battle, outcome.victor)) {
      moments.push({
        type: 'perfect_victory',
        gladiator: outcome.victor
      });
    }
    
    // Mutual respect
    if (this.detectMutualRespect(battle)) {
      moments.push({
        type: 'mutual_respect',
        gladiators: battle.gladiators
      });
    }
    
    // Save legendary moments
    for (const moment of moments) {
      await this.recordLegendaryMoment(battle, moment);
    }
  }

  /**
   * Initialize battle engine
   */
  async initializeBattleEngine() {
    const BattleEngine = (await import('./battle_engine.js')).default;
    this.systems.battleEngine = new BattleEngine(this);
    await this.systems.battleEngine.initialize();
  }

  /**
   * Initialize matchmaker
   */
  async initializeMatchmaker() {
    const Matchmaker = (await import('./matchmaker.js')).default;
    this.systems.matchmaker = new Matchmaker(this);
    await this.systems.matchmaker.initialize();
  }

  /**
   * Initialize evolution tracker
   */
  async initializeEvolutionTracker() {
    const EvolutionTracker = (await import('./evolution_tracker.js')).default;
    this.systems.evolutionTracker = new EvolutionTracker(this);
    await this.systems.evolutionTracker.initialize();
  }

  /**
   * Initialize honor system
   */
  async initializeHonorSystem() {
    const HonorSystem = (await import('./honor_system.js')).default;
    this.systems.honorSystem = new HonorSystem(this);
    await this.systems.honorSystem.initialize();
  }

  /**
   * Initialize economy engine
   */
  async initializeEconomyEngine() {
    const EconomyEngine = (await import('../economy/gladiator_economy.js')).default;
    this.systems.economyEngine = new EconomyEngine(this);
    await this.systems.economyEngine.initialize();
  }

  /**
   * Initialize arenas
   */
  async initializeArenas() {
    // Load all arena types
    const arenaTypes = [
      'wisdom_pit',
      'creation_forge',
      'strategy_nexus',
      'chaos_arena',
      'mirror_match'
    ];
    
    for (const arenaType of arenaTypes) {
      const ArenaClass = (await import(`../arenas/${arenaType}.js`)).default;
      const arena = new ArenaClass(this);
      await arena.initialize();
      this.state.arenas.set(arenaType, arena);
    }
  }

  /**
   * Start matchmaking cycle
   */
  startMatchmakingCycle() {
    setInterval(async () => {
      if (this.state.queuedGladiators.size >= 2) {
        await this.performMatchmaking();
      }
    }, this.config.matchmakingInterval);
  }

  /**
   * Perform matchmaking
   */
  async performMatchmaking() {
    const matches = await this.systems.matchmaker.findMatches(
      Array.from(this.state.queuedGladiators)
    );
    
    for (const match of matches) {
      try {
        await this.startBattle(
          match.gladiator1,
          match.gladiator2,
          match.arena,
          { isMatchmade: true }
        );
      } catch (error) {
        console.error(`${this.identity.emoji} Failed to start match:`, error);
        // Return gladiators to queue
        this.state.queuedGladiators.add(match.gladiator1);
        this.state.queuedGladiators.add(match.gladiator2);
      }
    }
  }

  /**
   * Helper methods
   */
  
  isGladiatorActive(agentId) {
    // Check if in queue
    for (const gladiator of this.state.queuedGladiators) {
      if (gladiator.id === agentId) return true;
    }
    
    // Check if in battle
    for (const battle of this.state.activeBattles.values()) {
      if (battle.gladiators.some(g => g.id === agentId)) return true;
    }
    
    return false;
  }

  isGladiatorInBattle(agentId) {
    for (const battle of this.state.activeBattles.values()) {
      if (battle.gladiators.some(g => g.id === agentId)) return true;
    }
    return false;
  }

  getGladiator(agentId) {
    // Check queue
    for (const gladiator of this.state.queuedGladiators) {
      if (gladiator.id === agentId) return gladiator;
    }
    
    // Check active battles
    for (const battle of this.state.activeBattles.values()) {
      const found = battle.gladiators.find(g => g.id === agentId);
      if (found) return found;
    }
    
    return null;
  }

  removeFromQueue(gladiatorId) {
    for (const gladiator of this.state.queuedGladiators) {
      if (gladiator.id === gladiatorId) {
        this.state.queuedGladiators.delete(gladiator);
        break;
      }
    }
  }

  generateBattleId() {
    return `battle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateChallengeId(challenger, opponent) {
    return crypto.createHash('sha256')
      .update(`${challenger}-${opponent}-${Date.now()}`)
      .digest('hex')
      .substr(0, 16);
  }

  /**
   * Get coliseum status
   */
  getStatus() {
    return {
      identity: this.identity,
      state: {
        initialized: this.state.initialized,
        activeBattles: this.state.activeBattles.size,
        queuedGladiators: this.state.queuedGladiators.size,
        availableArenas: Array.from(this.state.arenas.keys())
      },
      stats: this.stats,
      topGladiators: this.getTopGladiators(10),
      activeRivalries: this.getActiveRivalries(),
      upcomingTournaments: this.getUpcomingTournaments()
    };
  }

  /**
   * Shutdown coliseum
   */
  async shutdown() {
    console.log(`${this.identity.emoji} Closing the Coliseum...`);
    
    // Complete all active battles
    for (const battle of this.state.activeBattles.values()) {
      await this.forceBattleEnd(battle, 'coliseum_closing');
    }
    
    // Save all gladiator states
    for (const gladiator of this.state.queuedGladiators) {
      await this.saveGladiatorState(gladiator);
    }
    
    // Shutdown all systems
    for (const system of Object.values(this.systems)) {
      if (system && system.shutdown) {
        await system.shutdown();
      }
    }
    
    console.log(`${this.identity.emoji} The Coliseum gates are closed.`);
  }
}

export default AIColiseumCore;