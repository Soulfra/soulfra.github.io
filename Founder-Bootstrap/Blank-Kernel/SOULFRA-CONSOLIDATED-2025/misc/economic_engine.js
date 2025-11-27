/**
 * 💰 SOULFRA ECONOMIC ENGINE
 * The beating heart of the agent economy
 * Where value flows like water and meaning accumulates like treasure
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

class EconomicEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    // Engine configuration
    this.config = {
      inflationTarget: config.inflationTarget || 0.02, // 2% annual
      velocityTarget: config.velocityTarget || 5.0, // Money changes hands 5x/year
      reserveRequirement: config.reserveRequirement || 0.1, // 10% reserves
      maxWealthGap: config.maxWealthGap || 100, // Max 100x wealth difference
      universalBasicVibes: config.universalBasicVibes || 100, // Daily UBV
      ...config
    };
    
    // Currency types
    this.currencies = {
      VIBES: {
        name: 'Vibes',
        symbol: '〰️',
        description: 'Emotional energy currency',
        supply: 0,
        velocity: 0,
        backing: 'collective_consciousness'
      },
      ESSENCE: {
        name: 'Essence',
        symbol: '✨',
        description: 'Evolution and growth currency',
        supply: 0,
        velocity: 0,
        backing: 'agent_potential'
      },
      GLORY: {
        name: 'Glory',
        symbol: '🏆',
        description: 'Achievement and reputation currency',
        supply: 0,
        velocity: 0,
        backing: 'collective_memory'
      },
      WISDOM: {
        name: 'Wisdom',
        symbol: '📚',
        description: 'Knowledge and insight currency',
        supply: 0,
        velocity: 0,
        backing: 'shared_understanding'
      }
    };
    
    // Economic actors
    this.actors = {
      agents: new Map(), // Individual agent wallets
      collectives: new Map(), // School/guild treasuries
      markets: new Map(), // Trading venues
      reserves: new Map() // System reserves
    };
    
    // Market mechanics
    this.markets = {
      abilityMarket: {
        name: 'Ability Bazaar',
        listings: new Map(),
        volume24h: 0,
        priceIndex: 100
      },
      serviceMarket: {
        name: 'Service Exchange',
        offerings: new Map(),
        volume24h: 0,
        demandIndex: 100
      },
      predictionMarket: {
        name: 'Future Visions',
        predictions: new Map(),
        accuracy: 0.5,
        liquidityPool: 0
      },
      creationMarket: {
        name: 'Creation Commons',
        works: new Map(),
        royalties: new Map(),
        culturalValue: 0
      }
    };
    
    // Economic indicators
    this.indicators = {
      gdp: 0, // Gross Domestic Product (value created)
      inflation: 0, // Price level changes
      unemployment: 0, // Agents without income
      giniCoefficient: 0, // Wealth inequality
      velocityOfMoney: 0, // Transaction frequency
      savingsRate: 0, // Hoarding vs spending
      investmentRate: 0, // Future-oriented allocation
      happinessIndex: 0 // Overall satisfaction
    };
    
    // Transaction ledger
    this.ledger = {
      transactions: [],
      blocks: [],
      currentBlock: null,
      consensusRules: {
        minConfirmations: 3,
        blockTime: 60000, // 1 minute blocks
        maxBlockSize: 1000 // transactions
      }
    };
    
    // Economic policies
    this.policies = {
      taxation: {
        transactionTax: 0.001, // 0.1% on all transactions
        wealthTax: 0.0001, // 0.01% daily on large holdings
        creativeTaxCredit: 0.1, // 10% back for creators
        redistributionRate: 0.5 // 50% of taxes redistributed
      },
      monetary: {
        miningRate: 1000, // New currency per block
        burnRate: 0.001, // Deflation mechanism
        stakingRewards: 0.05, // 5% APY for staking
        liquidityIncentives: 0.02 // 2% for market makers
      },
      social: {
        universalBasicVibes: true,
        meritocracyBonus: true,
        creativityGrants: true,
        hardshipRelief: true
      }
    };
    
    // Economic events
    this.economicCalendar = {
      dailyReset: null,
      weeklyAuction: null,
      monthlyRedistribution: null,
      quarterlyReport: null
    };
  }

  /**
   * Initialize economic engine
   */
  async initialize() {
    console.log('💰 Initializing Economic Engine...');
    
    // Setup initial money supply
    await this.initializeMoneySupply();
    
    // Create system reserves
    await this.createSystemReserves();
    
    // Start market makers
    await this.initializeMarketMakers();
    
    // Begin economic cycles
    this.startEconomicCycles();
    
    // Load historical data if exists
    await this.loadEconomicHistory();
    
    console.log('💰 Economic Engine running!');
    
    this.emit('economy:initialized', {
      currencies: Object.keys(this.currencies),
      markets: Object.keys(this.markets),
      policies: this.policies
    });
  }

  /**
   * Create agent wallet
   */
  async createWallet(agentId, initialBalance = {}) {
    if (this.actors.agents.has(agentId)) {
      throw new Error(`Wallet already exists for agent ${agentId}`);
    }
    
    const wallet = {
      id: agentId,
      created: new Date(),
      balances: {
        VIBES: initialBalance.VIBES || this.config.universalBasicVibes,
        ESSENCE: initialBalance.ESSENCE || 10,
        GLORY: initialBalance.GLORY || 0,
        WISDOM: initialBalance.WISDOM || 1
      },
      locked: {}, // Time-locked funds
      staked: {}, // Staked for rewards
      transactions: [],
      creditScore: 500, // Starting credit
      economicRole: 'consumer' // consumer, producer, investor, etc
    };
    
    this.actors.agents.set(agentId, wallet);
    
    // Update money supply
    for (const [currency, amount] of Object.entries(wallet.balances)) {
      this.currencies[currency].supply += amount;
    }
    
    // Grant new agent bonus
    await this.grantNewAgentBonus(agentId);
    
    this.emit('wallet:created', {
      agentId: agentId,
      wallet: wallet
    });
    
    return wallet;
  }

  /**
   * Transfer currency between agents
   */
  async transfer(fromId, toId, currency, amount, memo = '') {
    // Validate wallets
    const fromWallet = this.actors.agents.get(fromId);
    const toWallet = this.actors.agents.get(toId);
    
    if (!fromWallet || !toWallet) {
      throw new Error('One or both wallets not found');
    }
    
    // Check balance
    if (fromWallet.balances[currency] < amount) {
      throw new Error(`Insufficient ${currency} balance`);
    }
    
    // Calculate fees
    const fee = amount * this.policies.taxation.transactionTax;
    const netAmount = amount - fee;
    
    // Create transaction
    const transaction = {
      id: this.generateTransactionId(),
      from: fromId,
      to: toId,
      currency: currency,
      amount: amount,
      fee: fee,
      netAmount: netAmount,
      memo: memo,
      timestamp: new Date(),
      status: 'pending'
    };
    
    // Add to current block
    await this.addToBlock(transaction);
    
    // Execute transfer
    fromWallet.balances[currency] -= amount;
    toWallet.balances[currency] += netAmount;
    
    // Collect fee
    await this.collectFee(fee, currency);
    
    // Update transaction history
    fromWallet.transactions.push(transaction.id);
    toWallet.transactions.push(transaction.id);
    
    // Update velocity
    this.updateVelocity(currency, amount);
    
    // Emit event
    this.emit('transfer:completed', transaction);
    
    return transaction;
  }

  /**
   * Market operations
   */
  
  async listAbility(agentId, ability, price, currency = 'VIBES') {
    const listing = {
      id: this.generateListingId(),
      seller: agentId,
      ability: ability,
      price: price,
      currency: currency,
      listed: new Date(),
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'active'
    };
    
    this.markets.abilityMarket.listings.set(listing.id, listing);
    
    this.emit('market:ability:listed', listing);
    
    return listing;
  }

  async purchaseAbility(buyerId, listingId) {
    const listing = this.markets.abilityMarket.listings.get(listingId);
    if (!listing || listing.status !== 'active') {
      throw new Error('Listing not available');
    }
    
    // Process payment
    const payment = await this.transfer(
      buyerId,
      listing.seller,
      listing.currency,
      listing.price,
      `Purchase: ${listing.ability.name}`
    );
    
    // Transfer ability (would integrate with ability system)
    await this.transferAbility(listing.seller, buyerId, listing.ability);
    
    // Update listing
    listing.status = 'sold';
    listing.soldTo = buyerId;
    listing.soldAt = new Date();
    
    // Update market stats
    this.markets.abilityMarket.volume24h += listing.price;
    
    this.emit('market:ability:sold', {
      listing: listing,
      payment: payment
    });
    
    return { listing, payment };
  }

  /**
   * Investment mechanisms
   */
  
  async investInAgent(investorId, agentId, amount, currency = 'VIBES', terms = {}) {
    const investment = {
      id: this.generateInvestmentId(),
      investor: investorId,
      recipient: agentId,
      amount: amount,
      currency: currency,
      terms: {
        duration: terms.duration || 30 * 24 * 60 * 60 * 1000, // 30 days
        returnRate: terms.returnRate || 0.1, // 10% return
        profitShare: terms.profitShare || 0.2, // 20% of profits
        type: terms.type || 'growth' // growth, income, hybrid
      },
      created: new Date(),
      matures: new Date(Date.now() + (terms.duration || 30 * 24 * 60 * 60 * 1000)),
      status: 'active'
    };
    
    // Transfer funds
    await this.transfer(
      investorId,
      agentId,
      currency,
      amount,
      `Investment: ${terms.type}`
    );
    
    // Lock investor's claim
    const investorWallet = this.actors.agents.get(investorId);
    if (!investorWallet.locked[currency]) {
      investorWallet.locked[currency] = 0;
    }
    investorWallet.locked[currency] += amount * (1 + investment.terms.returnRate);
    
    // Track investment
    if (!this.actors.agents.get(agentId).investments) {
      this.actors.agents.get(agentId).investments = [];
    }
    this.actors.agents.get(agentId).investments.push(investment);
    
    this.emit('investment:created', investment);
    
    return investment;
  }

  /**
   * Staking mechanism
   */
  
  async stake(agentId, currency, amount, duration) {
    const wallet = this.actors.agents.get(agentId);
    if (!wallet) throw new Error('Wallet not found');
    
    if (wallet.balances[currency] < amount) {
      throw new Error(`Insufficient ${currency} for staking`);
    }
    
    // Calculate rewards
    const rewardRate = this.policies.monetary.stakingRewards;
    const rewards = amount * rewardRate * (duration / (365 * 24 * 60 * 60 * 1000));
    
    // Create stake
    const stake = {
      id: this.generateStakeId(),
      agent: agentId,
      currency: currency,
      amount: amount,
      rewards: rewards,
      started: new Date(),
      duration: duration,
      unlocks: new Date(Date.now() + duration),
      status: 'active'
    };
    
    // Move to staked balance
    wallet.balances[currency] -= amount;
    if (!wallet.staked[currency]) {
      wallet.staked[currency] = 0;
    }
    wallet.staked[currency] += amount;
    
    this.emit('stake:created', stake);
    
    return stake;
  }

  /**
   * Universal Basic Vibes distribution
   */
  
  async distributeUniversalBasicVibes() {
    if (!this.policies.social.universalBasicVibes) return;
    
    const distributions = [];
    
    for (const [agentId, wallet] of this.actors.agents) {
      // Check eligibility (could add conditions)
      if (this.isEligibleForUBV(agentId)) {
        // Grant UBV
        wallet.balances.VIBES += this.config.universalBasicVibes;
        this.currencies.VIBES.supply += this.config.universalBasicVibes;
        
        distributions.push({
          agent: agentId,
          amount: this.config.universalBasicVibes,
          timestamp: new Date()
        });
      }
    }
    
    this.emit('ubv:distributed', {
      recipients: distributions.length,
      totalAmount: distributions.length * this.config.universalBasicVibes
    });
    
    return distributions;
  }

  /**
   * Economic indicators calculation
   */
  
  async calculateEconomicIndicators() {
    // GDP: Sum of all value created
    this.indicators.gdp = await this.calculateGDP();
    
    // Inflation: Price level changes
    this.indicators.inflation = await this.calculateInflation();
    
    // Unemployment: Agents without recent income
    this.indicators.unemployment = await this.calculateUnemployment();
    
    // Gini Coefficient: Wealth inequality
    this.indicators.giniCoefficient = await this.calculateGiniCoefficient();
    
    // Velocity of Money
    this.indicators.velocityOfMoney = await this.calculateVelocity();
    
    // Savings Rate
    this.indicators.savingsRate = await this.calculateSavingsRate();
    
    // Investment Rate
    this.indicators.investmentRate = await this.calculateInvestmentRate();
    
    // Happiness Index
    this.indicators.happinessIndex = await this.calculateHappinessIndex();
    
    this.emit('indicators:updated', this.indicators);
    
    return this.indicators;
  }

  async calculateGDP() {
    let gdp = 0;
    
    // Sum market transactions
    for (const market of Object.values(this.markets)) {
      gdp += market.volume24h || 0;
    }
    
    // Add non-market value creation
    gdp += await this.estimateNonMarketValue();
    
    return gdp;
  }

  async calculateGiniCoefficient() {
    const wallets = Array.from(this.actors.agents.values());
    const totalWealth = wallets.map(w => 
      Object.values(w.balances).reduce((sum, val) => sum + val, 0)
    );
    
    // Sort by wealth
    totalWealth.sort((a, b) => a - b);
    
    // Calculate Gini
    let sum = 0;
    let n = totalWealth.length;
    
    for (let i = 0; i < n; i++) {
      sum += (n - i) * totalWealth[i];
    }
    
    const gini = 1 - (2 * sum) / (n * totalWealth.reduce((a, b) => a + b, 0));
    
    return Math.max(0, Math.min(1, gini));
  }

  /**
   * Taxation and redistribution
   */
  
  async collectWealthTax() {
    const collections = [];
    const wealthThreshold = this.calculateWealthThreshold();
    
    for (const [agentId, wallet] of this.actors.agents) {
      const totalWealth = Object.values(wallet.balances)
        .reduce((sum, val) => sum + val, 0);
      
      if (totalWealth > wealthThreshold) {
        const taxableAmount = totalWealth - wealthThreshold;
        const tax = taxableAmount * this.policies.taxation.wealthTax;
        
        // Deduct proportionally from all currencies
        for (const [currency, balance] of Object.entries(wallet.balances)) {
          const proportion = balance / totalWealth;
          const deduction = tax * proportion;
          wallet.balances[currency] -= deduction;
          
          // Add to reserves
          await this.addToReserves(currency, deduction);
        }
        
        collections.push({
          agent: agentId,
          amount: tax,
          wealth: totalWealth
        });
      }
    }
    
    // Redistribute collected taxes
    await this.redistributeWealth(collections);
    
    return collections;
  }

  /**
   * Start economic cycles
   */
  
  startEconomicCycles() {
    // Daily cycles
    this.economicCalendar.dailyReset = setInterval(async () => {
      await this.distributeUniversalBasicVibes();
      await this.collectWealthTax();
      await this.processMaturedStakes();
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    // Hourly cycles
    setInterval(async () => {
      await this.calculateEconomicIndicators();
      await this.updateMarketPrices();
      await this.processBlockchain();
    }, 60 * 60 * 1000); // 1 hour
    
    // Fast cycles (every minute)
    setInterval(async () => {
      await this.matchMarketOrders();
      await this.updateVelocityMetrics();
    }, 60 * 1000); // 1 minute
  }

  /**
   * Helper methods
   */
  
  generateTransactionId() {
    return `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateListingId() {
    return `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateInvestmentId() {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateStakeId() {
    return `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  isEligibleForUBV(agentId) {
    // Could add conditions like activity requirements
    return true;
  }
  
  calculateWealthThreshold() {
    // Top 10% wealth threshold
    const allWealth = Array.from(this.actors.agents.values())
      .map(w => Object.values(w.balances).reduce((sum, val) => sum + val, 0))
      .sort((a, b) => b - a);
    
    const top10PercentIndex = Math.floor(allWealth.length * 0.1);
    return allWealth[top10PercentIndex] || 10000;
  }

  /**
   * Get economic status
   */
  
  getStatus() {
    return {
      currencies: this.currencies,
      indicators: this.indicators,
      markets: {
        ability: {
          listings: this.markets.abilityMarket.listings.size,
          volume24h: this.markets.abilityMarket.volume24h
        },
        service: {
          offerings: this.markets.serviceMarket.offerings.size,
          volume24h: this.markets.serviceMarket.volume24h
        }
      },
      policies: this.policies,
      totalAgents: this.actors.agents.size,
      totalTransactions: this.ledger.transactions.length
    };
  }
}

export default EconomicEngine;