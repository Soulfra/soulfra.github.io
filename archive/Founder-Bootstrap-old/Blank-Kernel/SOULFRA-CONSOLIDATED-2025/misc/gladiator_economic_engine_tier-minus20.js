/**
 * GLADIATOR ECONOMIC ENGINE - ARENA BETTING & TOKEN ECONOMY
 * Real-time betting system with crowd consensus and AI gladiator economics
 * Creates Roman coliseum-style entertainment economy around AI performance
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class GladiatorEconomicEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      // Base economic settings
      baseCurrency: config.baseCurrency || 'ARENA_TOKENS',
      initialTokenGrant: config.initialTokenGrant || 1000,
      minimumBet: config.minimumBet || 10,
      maximumBet: config.maximumBet || 10000,
      
      // House settings
      houseEdge: config.houseEdge || 0.05, // 5%
      minimumLiquidity: config.minimumLiquidity || 50000,
      maxPoolExposure: config.maxPoolExposure || 0.3, // 30% of total liquidity
      
      // Gladiator economics
      gladiatorRevenueShare: config.gladiatorRevenueShare || 0.15, // 15%
      performanceBonusMultiplier: config.performanceBonusMultiplier || 2.0,
      evolutionBonusTokens: config.evolutionBonusTokens || 500,
      
      // Market dynamics
      oddsUpdateInterval: config.oddsUpdateInterval || 5000, // 5 seconds
      volatilityDamping: config.volatilityDamping || 0.1,
      marketDepth: config.marketDepth || 5, // Order book depth
      
      // Social economics
      crowdInfluenceWeight: config.crowdInfluenceWeight || 0.3,
      viralMomentBonus: config.viralMomentBonus || 1000,
      influencerMultiplier: config.influencerMultiplier || 1.5,
      
      ...config
    };
    
    // Economic state
    this.tokenAccounts = new Map(); // spectatorId -> balance
    this.bettingPools = new Map(); // poolId -> pool data
    this.gladiatorEarnings = new Map(); // gladiatorId -> earnings
    this.houseBalance = 0;
    this.totalCirculatingTokens = 0;
    
    // Market data
    this.oddsHistory = new Map(); // poolId -> historical odds
    this.bettingVolume = new Map(); // poolId -> volume over time
    this.marketDepthData = new Map(); // poolId -> order book
    
    // Performance tracking
    this.economicMetrics = {
      totalVolumeToday: 0,
      averagePoolSize: 0,
      houseWinRate: 0,
      gladiatorPayouts: 0,
      activeSpectators: 0,
      viralEvents: 0
    };
    
    // Social dynamics
    this.crowdSentiment = new Map(); // arenaId -> sentiment data
    this.influencerAccounts = new Set();
    this.socialMultipliers = new Map();
    
    this.initialize();
  }

  async initialize() {
    console.log('💰 Initializing Gladiator Economic Engine...');
    
    // Initialize house liquidity
    this.houseBalance = this.config.minimumLiquidity;
    
    // Start economic processing loops
    this.startOddsUpdateLoop();
    this.startMarketMakingLoop();
    this.startPerformanceTrackingLoop();
    
    console.log('🏛️ Arena economy initialized');
  }

  // ============================================================================
  // BETTING POOL MANAGEMENT
  // ============================================================================

  createBettingPool(arenaId, gladiatorId, poolConfig) {
    const poolId = this.generatePoolId();
    
    const bettingPool = {
      pool_id: poolId,
      arena_id: arenaId,
      gladiator_id: gladiatorId,
      created_at: Date.now(),
      
      // Pool configuration
      bet_type: poolConfig.betType,
      description: poolConfig.description,
      resolution_criteria: poolConfig.resolutionCriteria,
      auto_resolve: poolConfig.autoResolve || false,
      
      // Economic data
      total_staked: 0,
      yes_stakes: 0,
      no_stakes: 0,
      house_liquidity: this.calculateInitialLiquidity(poolConfig),
      
      // Odds calculation
      current_odds: {
        yes: 2.0,
        no: 2.0,
        updated_at: Date.now()
      },
      
      // Market data
      order_book: {
        yes_orders: [],
        no_orders: []
      },
      recent_trades: [],
      
      // Pool lifecycle
      status: 'active', // 'active', 'suspended', 'resolving', 'resolved'
      opens_at: Date.now(),
      closes_at: poolConfig.closesAt || Date.now() + 300000, // 5 minutes default
      resolves_at: null,
      resolution_value: null,
      
      // Social features
      crowd_sentiment: 0.5, // 0 = bearish, 1 = bullish
      viral_score: 0,
      participant_count: 0,
      
      // Performance tracking
      volume_24h: 0,
      price_volatility: 0,
      market_efficiency: 0.8
    };

    this.bettingPools.set(poolId, bettingPool);
    this.initializePoolOrderBook(poolId);
    
    this.emit('betting_pool_created', {
      poolId,
      arenaId,
      gladiatorId,
      betType: poolConfig.betType
    });

    return poolId;
  }

  async placeBet(spectatorId, poolId, betSide, amount, maxOdds = null) {
    const pool = this.bettingPools.get(poolId);
    if (!pool || pool.status !== 'active') {
      throw new Error('Betting pool not available');
    }

    const spectatorBalance = this.getTokenBalance(spectatorId);
    if (spectatorBalance < amount) {
      throw new Error('Insufficient token balance');
    }

    if (amount < this.config.minimumBet || amount > this.config.maximumBet) {
      throw new Error('Bet amount outside allowed range');
    }

    // Calculate current odds
    const currentOdds = this.calculateCurrentOdds(poolId);
    const relevantOdds = betSide === 'yes' ? currentOdds.yes : currentOdds.no;

    if (maxOdds && relevantOdds > maxOdds) {
      throw new Error(`Odds have moved beyond maximum acceptable: ${relevantOdds} > ${maxOdds}`);
    }

    const bet = {
      bet_id: this.generateBetId(),
      spectator_id: spectatorId,
      pool_id: poolId,
      bet_side: betSide,
      amount: amount,
      odds_at_time: relevantOdds,
      potential_payout: amount * relevantOdds,
      placed_at: Date.now(),
      status: 'active',
      
      // Social features
      is_influencer: this.influencerAccounts.has(spectatorId),
      crowd_influence_score: this.calculateCrowdInfluence(spectatorId),
      
      // Risk assessment
      risk_level: this.assessBetRisk(poolId, betSide, amount),
      market_impact: this.calculateMarketImpact(poolId, betSide, amount)
    };

    // Deduct tokens from spectator
    this.deductTokens(spectatorId, amount);
    
    // Update pool state
    pool.total_staked += amount;
    if (betSide === 'yes') {
      pool.yes_stakes += amount;
    } else {
      pool.no_stakes += amount;
    }
    pool.participant_count++;

    // Add to order book
    this.addToOrderBook(poolId, bet);
    
    // Update odds
    this.updatePoolOdds(poolId);
    
    // Update social metrics
    this.updateCrowdSentiment(pool.arena_id, betSide, amount, spectatorId);
    
    // Track for viral potential
    this.checkViralPotential(poolId, bet);
    
    this.emit('bet_placed', {
      betId: bet.bet_id,
      spectatorId,
      poolId,
      betSide,
      amount,
      newOdds: currentOdds
    });

    return bet.bet_id;
  }

  calculateCurrentOdds(poolId) {
    const pool = this.bettingPools.get(poolId);
    if (!pool) return { yes: 2.0, no: 2.0 };

    // Calculate implied probability from stakes
    const totalStakes = pool.yes_stakes + pool.no_stakes + pool.house_liquidity;
    const yesImpliedProb = (pool.no_stakes + pool.house_liquidity / 2) / totalStakes;
    const noImpliedProb = (pool.yes_stakes + pool.house_liquidity / 2) / totalStakes;

    // Convert to odds with house edge
    const houseEdge = this.config.houseEdge;
    const yesOdds = Math.max(1.01, (1 / yesImpliedProb) * (1 - houseEdge));
    const noOdds = Math.max(1.01, (1 / noImpliedProb) * (1 - houseEdge));

    // Apply crowd sentiment modifier
    const sentiment = this.crowdSentiment.get(pool.arena_id) || { bias: 0.5 };
    const sentimentMultiplier = 1 + (sentiment.bias - 0.5) * 0.2; // ±10% max adjustment

    return {
      yes: Number((yesOdds * sentimentMultiplier).toFixed(2)),
      no: Number((noOdds / sentimentMultiplier).toFixed(2)),
      updated_at: Date.now()
    };
  }

  // ============================================================================
  // GLADIATOR ECONOMICS
  // ============================================================================

  async updateGladiatorPerformance(gladiatorId, performanceData) {
    if (!this.gladiatorEarnings.has(gladiatorId)) {
      this.gladiatorEarnings.set(gladiatorId, {
        total_earned: 0,
        session_earnings: 0,
        performance_score: 0.5,
        evolution_count: 0,
        viral_moments: 0,
        crowd_approval_rating: 0.5,
        betting_volume_generated: 0
      });
    }

    const gladiator = this.gladiatorEarnings.get(gladiatorId);
    
    // Update performance metrics
    gladiator.performance_score = performanceData.overallScore;
    gladiator.crowd_approval_rating = performanceData.crowdApproval;
    
    // Calculate performance-based earnings
    const baseEarnings = this.calculateBaseGladiatorEarnings(gladiatorId);
    const performanceBonus = baseEarnings * (performanceData.overallScore - 0.5) * this.config.performanceBonusMultiplier;
    const crowdBonus = this.calculateCrowdApprovalBonus(gladiatorId, performanceData.crowdApproval);
    
    const totalEarnings = baseEarnings + performanceBonus + crowdBonus;
    
    gladiator.session_earnings += totalEarnings;
    gladiator.total_earned += totalEarnings;
    
    // Update betting volume contribution
    gladiator.betting_volume_generated += this.calculateGladiatorBettingVolume(gladiatorId);
    
    this.emit('gladiator_earnings_updated', {
      gladiatorId,
      sessionEarnings: totalEarnings,
      totalEarnings: gladiator.total_earned,
      performanceScore: gladiator.performance_score
    });

    return gladiator;
  }

  async processGladiatorEvolution(gladiatorId, evolutionData) {
    const gladiator = this.gladiatorEarnings.get(gladiatorId);
    if (!gladiator) return;

    gladiator.evolution_count++;
    
    // Evolution bonus
    const evolutionBonus = this.config.evolutionBonusTokens * evolutionData.significance;
    gladiator.session_earnings += evolutionBonus;
    gladiator.total_earned += evolutionBonus;
    
    // Create special betting pools for evolution events
    const evolutionPools = await this.createEvolutionBettingPools(gladiatorId, evolutionData);
    
    this.emit('gladiator_evolution', {
      gladiatorId,
      evolutionBonus,
      newBettingPools: evolutionPools,
      evolutionCount: gladiator.evolution_count
    });
  }

  async createEvolutionBettingPools(gladiatorId, evolutionData) {
    const pools = [];
    
    // "Will the evolution be successful?" pool
    const successPoolId = this.createBettingPool(
      evolutionData.arenaId,
      gladiatorId,
      {
        betType: 'evolution_success',
        description: 'Will the gladiator\'s evolution be successful?',
        resolutionCriteria: 'evolution_completion_status',
        autoResolve: true,
        closesAt: Date.now() + 60000 // 1 minute
      }
    );
    pools.push(successPoolId);
    
    // "What will be the new archetype?" pool if major evolution
    if (evolutionData.significance > 0.8) {
      const archetypePoolId = this.createBettingPool(
        evolutionData.arenaId,
        gladiatorId,
        {
          betType: 'evolution_archetype',
          description: 'What archetype will the gladiator evolve into?',
          resolutionCriteria: 'final_archetype_determination',
          autoResolve: true,
          closesAt: Date.now() + 120000 // 2 minutes
        }
      );
      pools.push(archetypePoolId);
    }
    
    return pools;
  }

  // ============================================================================
  // CROWD ECONOMICS & SOCIAL FEATURES
  // ============================================================================

  updateCrowdSentiment(arenaId, betSide, amount, spectatorId) {
    if (!this.crowdSentiment.has(arenaId)) {
      this.crowdSentiment.set(arenaId, {
        bias: 0.5, // 0 = bearish, 1 = bullish
        intensity: 0.1,
        volatility: 0.05,
        participant_count: 0,
        recent_bets: []
      });
    }

    const sentiment = this.crowdSentiment.get(arenaId);
    
    // Weight the influence by bet size and spectator influence
    const spectatorInfluence = this.calculateSpectatorInfluence(spectatorId);
    const betWeight = Math.log(amount + 1) * spectatorInfluence;
    
    // Update bias based on bet direction
    const biasChange = (betSide === 'yes' ? betWeight : -betWeight) * 0.01;
    sentiment.bias = Math.max(0, Math.min(1, sentiment.bias + biasChange));
    
    // Update intensity based on betting activity
    sentiment.intensity = Math.min(1, sentiment.intensity + betWeight * 0.005);
    
    // Track recent activity for volatility calculation
    sentiment.recent_bets.push({
      bet_side: betSide,
      amount,
      spectator_influence: spectatorInfluence,
      timestamp: Date.now()
    });
    
    // Keep only last 100 bets for calculation
    if (sentiment.recent_bets.length > 100) {
      sentiment.recent_bets = sentiment.recent_bets.slice(-100);
    }
    
    // Calculate volatility from recent betting patterns
    sentiment.volatility = this.calculateSentimentVolatility(sentiment.recent_bets);
    
    sentiment.participant_count++;
  }

  calculateSpectatorInfluence(spectatorId) {
    let influence = 1.0;
    
    // Influencer bonus
    if (this.influencerAccounts.has(spectatorId)) {
      influence *= this.config.influencerMultiplier;
    }
    
    // Account age bonus
    const account = this.tokenAccounts.get(spectatorId);
    if (account && account.created_at) {
      const accountAge = Date.now() - account.created_at;
      const ageBonus = Math.min(2.0, 1 + (accountAge / (30 * 24 * 60 * 60 * 1000))); // Max 2x for 30+ day accounts
      influence *= ageBonus;
    }
    
    // Betting history bonus
    const bettingHistory = this.getSpectatorBettingHistory(spectatorId);
    const winRate = bettingHistory.wins / Math.max(1, bettingHistory.total_bets);
    const historyBonus = 0.5 + winRate; // 0.5x to 1.5x based on win rate
    influence *= historyBonus;
    
    return influence;
  }

  checkViralPotential(poolId, bet) {
    const pool = this.bettingPools.get(poolId);
    
    // Check for viral conditions
    const isLargeBet = bet.amount > 1000;
    const isInfluencerBet = bet.is_influencer;
    const isUnexpectedOdds = bet.odds_at_time > 5.0 || bet.odds_at_time < 1.2;
    const isHighImpact = bet.market_impact > 0.1;
    
    if (isLargeBet || isInfluencerBet || isUnexpectedOdds || isHighImpact) {
      pool.viral_score += 0.1;
      
      // Trigger viral event if threshold reached
      if (pool.viral_score > 0.5) {
        this.triggerViralEvent(poolId, bet);
      }
    }
  }

  triggerViralEvent(poolId, triggerBet) {
    this.economicMetrics.viralEvents++;
    
    // Award viral bonus to trigger bet participant
    this.awardTokens(triggerBet.spectator_id, this.config.viralMomentBonus);
    
    // Increase pool visibility and liquidity
    const pool = this.bettingPools.get(poolId);
    pool.house_liquidity *= 1.5; // Increase liquidity for viral pools
    
    // Notify spectators
    this.emit('viral_event', {
      poolId,
      triggerBetId: triggerBet.bet_id,
      spectatorId: triggerBet.spectator_id,
      viralBonus: this.config.viralMomentBonus,
      reason: 'exceptional_betting_activity'
    });
  }

  // ============================================================================
  // TOKEN ECONOMY MANAGEMENT
  // ============================================================================

  createSpectatorAccount(spectatorId, initialGrant = null) {
    if (this.tokenAccounts.has(spectatorId)) {
      return this.tokenAccounts.get(spectatorId);
    }

    const initialTokens = initialGrant || this.config.initialTokenGrant;
    
    const account = {
      spectator_id: spectatorId,
      balance: initialTokens,
      created_at: Date.now(),
      total_earned: initialTokens,
      total_spent: 0,
      betting_history: {
        total_bets: 0,
        wins: 0,
        losses: 0,
        total_staked: 0,
        total_winnings: 0
      },
      social_stats: {
        influence_score: 1.0,
        viral_contributions: 0,
        crowd_consensus_accuracy: 0.5
      }
    };

    this.tokenAccounts.set(spectatorId, account);
    this.totalCirculatingTokens += initialTokens;
    
    this.emit('spectator_account_created', {
      spectatorId,
      initialBalance: initialTokens
    });

    return account;
  }

  getTokenBalance(spectatorId) {
    const account = this.tokenAccounts.get(spectatorId);
    return account ? account.balance : 0;
  }

  deductTokens(spectatorId, amount) {
    const account = this.tokenAccounts.get(spectatorId);
    if (!account || account.balance < amount) {
      throw new Error('Insufficient token balance');
    }

    account.balance -= amount;
    account.total_spent += amount;
    return account.balance;
  }

  awardTokens(spectatorId, amount) {
    const account = this.tokenAccounts.get(spectatorId) || this.createSpectatorAccount(spectatorId, 0);
    
    account.balance += amount;
    account.total_earned += amount;
    this.totalCirculatingTokens += amount;
    
    return account.balance;
  }

  // ============================================================================
  // MARKET MAKING & LIQUIDITY
  // ============================================================================

  startOddsUpdateLoop() {
    setInterval(() => {
      this.updateAllPoolOdds();
    }, this.config.oddsUpdateInterval);
  }

  startMarketMakingLoop() {
    setInterval(() => {
      this.provideMarketLiquidity();
    }, 10000); // Every 10 seconds
  }

  startPerformanceTrackingLoop() {
    setInterval(() => {
      this.updateEconomicMetrics();
    }, 60000); // Every minute
  }

  updateAllPoolOdds() {
    for (const [poolId, pool] of this.bettingPools.entries()) {
      if (pool.status === 'active') {
        this.updatePoolOdds(poolId);
      }
    }
  }

  updatePoolOdds(poolId) {
    const newOdds = this.calculateCurrentOdds(poolId);
    const pool = this.bettingPools.get(poolId);
    
    pool.current_odds = newOdds;
    
    // Store odds history
    if (!this.oddsHistory.has(poolId)) {
      this.oddsHistory.set(poolId, []);
    }
    this.oddsHistory.get(poolId).push({
      timestamp: Date.now(),
      yes_odds: newOdds.yes,
      no_odds: newOdds.no
    });
  }

  provideMarketLiquidity() {
    for (const [poolId, pool] of this.bettingPools.entries()) {
      if (pool.status === 'active' && pool.total_staked < 100) {
        // Add house liquidity to thin markets
        const liquidityIncrease = Math.min(500, this.houseBalance * 0.01);
        pool.house_liquidity += liquidityIncrease;
        this.houseBalance -= liquidityIncrease;
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  generatePoolId() {
    return `pool_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  generateBetId() {
    return `bet_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  }

  calculateInitialLiquidity(poolConfig) {
    // Base liquidity varies by bet type
    const liquidityMultipliers = {
      'action_success': 1.0,
      'crowd_approval': 0.8,
      'evolution_trigger': 1.5,
      'survival_time': 1.2,
      'spectacular_moment': 0.9,
      'player_interaction': 0.7
    };
    
    const multiplier = liquidityMultipliers[poolConfig.betType] || 1.0;
    return Math.floor(500 * multiplier);
  }

  calculateBaseGladiatorEarnings(gladiatorId) {
    // Base earnings from house revenue share
    const totalBettingVolume = this.calculateGladiatorBettingVolume(gladiatorId);
    return totalBettingVolume * this.config.gladiatorRevenueShare;
  }

  calculateGladiatorBettingVolume(gladiatorId) {
    let volume = 0;
    for (const pool of this.bettingPools.values()) {
      if (pool.gladiator_id === gladiatorId) {
        volume += pool.total_staked;
      }
    }
    return volume;
  }

  calculateCrowdApprovalBonus(gladiatorId, approvalRating) {
    const baseBonus = 100;
    return baseBonus * (approvalRating - 0.5) * 2; // ±100 tokens based on approval
  }

  // Placeholder implementations
  initializePoolOrderBook(poolId) { /* Initialize order book */ }
  addToOrderBook(poolId, bet) { /* Add bet to order book */ }
  assessBetRisk(poolId, betSide, amount) { return 'medium'; }
  calculateMarketImpact(poolId, betSide, amount) { return 0.05; }
  calculateSentimentVolatility(recentBets) { return 0.1; }
  getSpectatorBettingHistory(spectatorId) { return { total_bets: 10, wins: 6 }; }
  updateEconomicMetrics() { /* Update metrics */ }

  // Public API
  getArenaEconomics(arenaId) {
    const pools = Array.from(this.bettingPools.values())
      .filter(pool => pool.arena_id === arenaId);
    
    return {
      arena_id: arenaId,
      active_pools: pools.length,
      total_volume: pools.reduce((sum, pool) => sum + pool.total_staked, 0),
      crowd_sentiment: this.crowdSentiment.get(arenaId),
      viral_events: pools.reduce((sum, pool) => sum + (pool.viral_score > 0.5 ? 1 : 0), 0)
    };
  }

  getGladiatorEconomics(gladiatorId) {
    return this.gladiatorEarnings.get(gladiatorId);
  }

  getSystemMetrics() {
    return {
      ...this.economicMetrics,
      total_circulating_tokens: this.totalCirculatingTokens,
      house_balance: this.houseBalance,
      active_spectators: this.tokenAccounts.size,
      active_betting_pools: Array.from(this.bettingPools.values())
        .filter(pool => pool.status === 'active').length
    };
  }
}

export default GladiatorEconomicEngine;