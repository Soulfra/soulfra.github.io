const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const logger = require('../utils/logger');
const redisClient = require('../config/redis');
const { Transaction, Market, Asset, EconomicEvent } = require('../models/economy');

class DomingoEconomyEngine extends EventEmitter {
  constructor() {
    super();
    this.state = {
      markets: new Map(),
      assets: new Map(),
      liquidity: 1000000000, // $1 billion initial liquidity
      volatility: 0.3,
      momentum: 0,
      sentiment: 0.5,
      bubbles: [],
      crashes: [],
      economicCycle: 'growth',
      inflationRate: 0.02,
      interestRate: 0.05,
      gdp: 1000000000,
      totalSupply: 1000000000,
      velocity: 1,
      priceIndices: {
        cpi: 100,
        ppi: 100,
        commodities: 100,
        crypto: 100,
        quantum: 100
      }
    };
    
    this.constants = {
      MARKET_UPDATE_INTERVAL: 1000, // 1 second
      ECONOMIC_CYCLE_DURATION: 300000, // 5 minutes per cycle
      BUBBLE_FORMATION_THRESHOLD: 0.8,
      CRASH_TRIGGER_THRESHOLD: -0.7,
      MAX_LEVERAGE: 100,
      TRANSACTION_FEE: 0.001, // 0.1%
      QUANTUM_ECONOMIC_INFLUENCE: 0.3,
      AI_TRADING_PERCENTAGE: 0.4,
      MARKET_MANIPULATION_DETECTION: 0.9
    };
    
    this.marketInterval = null;
    this.economicCycleInterval = null;
    this.aiTradingBots = new Map();
  }

  async initialize() {
    try {
      // Initialize markets
      await this.initializeMarkets();
      
      // Initialize assets
      await this.initializeAssets();
      
      // Load saved state
      const savedState = await redisClient.get('economy:state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.state = {
          ...this.state,
          ...parsed,
          markets: new Map(parsed.markets),
          assets: new Map(parsed.assets)
        };
      }
      
      // Initialize AI trading bots
      this.initializeAITradingBots();
      
      // Set up event listeners
      this.setupEventListeners();
      
      logger.info('Domingo Economy Engine initialized', {
        liquidity: this.state.liquidity,
        markets: this.state.markets.size,
        assets: this.state.assets.size
      });
    } catch (error) {
      logger.error('Failed to initialize Economy Engine', error);
      throw error;
    }
  }

  async initializeMarkets() {
    const markets = [
      {
        id: 'stocks',
        name: 'Stock Market',
        type: 'equity',
        index: 10000,
        volatility: 0.2,
        volume: 0,
        momentum: 0,
        sentiment: 0.5,
        isOpen: true,
        tradingHours: { open: 9, close: 16 },
        circuit_breaker: 0.1 // 10% movement triggers halt
      },
      {
        id: 'crypto',
        name: 'Cryptocurrency Market',
        type: 'crypto',
        index: 50000,
        volatility: 0.5,
        volume: 0,
        momentum: 0,
        sentiment: 0.6,
        isOpen: true,
        tradingHours: { open: 0, close: 24 }, // 24/7
        circuit_breaker: 0.2 // 20% movement
      },
      {
        id: 'forex',
        name: 'Foreign Exchange',
        type: 'currency',
        index: 1.2,
        volatility: 0.1,
        volume: 0,
        momentum: 0,
        sentiment: 0.5,
        isOpen: true,
        tradingHours: { open: 0, close: 24 },
        circuit_breaker: 0.05 // 5% movement
      },
      {
        id: 'commodities',
        name: 'Commodities Market',
        type: 'commodity',
        index: 1000,
        volatility: 0.3,
        volume: 0,
        momentum: 0,
        sentiment: 0.4,
        isOpen: true,
        tradingHours: { open: 8, close: 17 },
        circuit_breaker: 0.15
      },
      {
        id: 'quantum',
        name: 'Quantum Assets Market',
        type: 'quantum',
        index: 100000,
        volatility: 0.8,
        volume: 0,
        momentum: 0,
        sentiment: 0.7,
        isOpen: true,
        tradingHours: { open: 0, close: 24 },
        circuit_breaker: 0.5 // 50% movement allowed
      },
      {
        id: 'consciousness',
        name: 'Consciousness Derivatives',
        type: 'derivative',
        index: 1000000,
        volatility: 0.9,
        volume: 0,
        momentum: 0,
        sentiment: 0.8,
        isOpen: true,
        tradingHours: { open: 0, close: 24 },
        circuit_breaker: 1.0 // No circuit breaker
      }
    ];
    
    for (const market of markets) {
      this.state.markets.set(market.id, market);
      await Market.create(market);
    }
  }

  async initializeAssets() {
    const assets = [
      // Stocks
      { id: 'BDG', name: 'Billion Dollar Game Corp', type: 'stock', market: 'stocks', price: 1000, supply: 1000000 },
      { id: 'QNTM', name: 'Quantum Dynamics Inc', type: 'stock', market: 'stocks', price: 5000, supply: 100000 },
      { id: 'CNSC', name: 'Consciousness Systems', type: 'stock', market: 'stocks', price: 10000, supply: 50000 },
      { id: 'TMLN', name: 'Timeline Navigation Ltd', type: 'stock', market: 'stocks', price: 2500, supply: 200000 },
      { id: 'RLTY', name: 'Reality Manipulation Corp', type: 'stock', market: 'stocks', price: 15000, supply: 30000 },
      
      // Cryptocurrencies
      { id: 'QTC', name: 'QuantumCoin', type: 'crypto', market: 'crypto', price: 50000, supply: 21000000 },
      { id: 'CNSC', name: 'ConsciousnessCoin', type: 'crypto', market: 'crypto', price: 100000, supply: 1000000 },
      { id: 'DMNG', name: 'DomingoCoin', type: 'crypto', market: 'crypto', price: 1000000, supply: 100000 },
      { id: 'RIFT', name: 'RiftToken', type: 'crypto', market: 'crypto', price: 10000, supply: 10000000 },
      
      // Commodities
      { id: 'QNRG', name: 'Quantum Energy', type: 'commodity', market: 'commodities', price: 1000, supply: 1000000 },
      { id: 'TMFL', name: 'Timeline Flux', type: 'commodity', market: 'commodities', price: 5000, supply: 100000 },
      { id: 'CNMT', name: 'Consciousness Matter', type: 'commodity', market: 'commodities', price: 50000, supply: 10000 },
      
      // Quantum Assets
      { id: 'SPRP', name: 'Superposition Rights', type: 'quantum', market: 'quantum', price: 100000, supply: 1000 },
      { id: 'ENTG', name: 'Entanglement Bonds', type: 'quantum', market: 'quantum', price: 500000, supply: 100 },
      { id: 'WVCL', name: 'Wave Collapse Futures', type: 'quantum', market: 'quantum', price: 1000000, supply: 10 },
      
      // Consciousness Derivatives
      { id: 'MIND', name: 'Mind State Options', type: 'derivative', market: 'consciousness', price: 1000000, supply: 100 },
      { id: 'EVLV', name: 'Evolution Contracts', type: 'derivative', market: 'consciousness', price: 5000000, supply: 20 },
      { id: 'BRKT', name: 'Breakthrough Swaps', type: 'derivative', market: 'consciousness', price: 10000000, supply: 10 }
    ];
    
    for (const asset of assets) {
      asset.circulating = asset.supply * 0.5;
      asset.marketCap = asset.price * asset.circulating;
      asset.volume24h = 0;
      asset.priceChange24h = 0;
      asset.ath = asset.price;
      asset.atl = asset.price;
      asset.volatility = this.state.markets.get(asset.market).volatility;
      
      this.state.assets.set(asset.id, asset);
      await Asset.create(asset);
    }
  }

  initializeAITradingBots() {
    const botStrategies = [
      { name: 'Momentum Hunter', strategy: 'momentum', risk: 0.7, capital: 10000000 },
      { name: 'Mean Reverter', strategy: 'mean_reversion', risk: 0.3, capital: 20000000 },
      { name: 'Arbitrage Master', strategy: 'arbitrage', risk: 0.1, capital: 50000000 },
      { name: 'Quantum Predictor', strategy: 'quantum', risk: 0.9, capital: 5000000 },
      { name: 'Sentiment Surfer', strategy: 'sentiment', risk: 0.5, capital: 15000000 },
      { name: 'Chaos Exploiter', strategy: 'chaos', risk: 1.0, capital: 1000000 },
      { name: 'Market Maker', strategy: 'market_making', risk: 0.2, capital: 100000000 },
      { name: 'Flash Trader', strategy: 'hft', risk: 0.4, capital: 30000000 }
    ];
    
    botStrategies.forEach((config, index) => {
      const bot = {
        id: `bot_${index}`,
        ...config,
        portfolio: new Map(),
        performance: 0,
        trades: 0,
        wins: 0,
        losses: 0
      };
      
      this.aiTradingBots.set(bot.id, bot);
    });
  }

  setupEventListeners() {
    this.on('transaction', this.handleTransaction.bind(this));
    this.on('market-event', this.handleMarketEvent.bind(this));
    this.on('quantum-influence', this.handleQuantumInfluence.bind(this));
    this.on('ai-signal', this.handleAISignal.bind(this));
  }

  startMarketSimulation() {
    this.marketInterval = setInterval(() => {
      this.updateMarkets();
      this.runAITrading();
      this.checkForEvents();
    }, this.constants.MARKET_UPDATE_INTERVAL);
    
    this.economicCycleInterval = setInterval(() => {
      this.updateEconomicCycle();
    }, this.constants.ECONOMIC_CYCLE_DURATION);
  }

  async updateMarkets() {
    for (const [marketId, market] of this.state.markets) {
      if (!market.isOpen) continue;
      
      // Calculate market movement
      const randomFactor = (Math.random() - 0.5) * 2;
      const momentumFactor = market.momentum * 0.3;
      const sentimentFactor = (market.sentiment - 0.5) * 0.2;
      const volatilityFactor = market.volatility;
      const cycleFactor = this.getEconomicCycleFactor();
      
      const movement = (randomFactor + momentumFactor + sentimentFactor) * volatilityFactor * cycleFactor;
      
      // Update index
      const oldIndex = market.index;
      market.index *= (1 + movement / 100);
      
      // Update momentum
      market.momentum = market.momentum * 0.9 + movement * 0.1;
      
      // Update sentiment based on performance
      if (movement > 0) {
        market.sentiment = Math.min(1, market.sentiment + 0.01);
      } else {
        market.sentiment = Math.max(0, market.sentiment - 0.01);
      }
      
      // Check circuit breaker
      const percentChange = Math.abs((market.index - oldIndex) / oldIndex);
      if (percentChange > market.circuit_breaker) {
        market.isOpen = false;
        this.emit('circuit-breaker-triggered', { marketId, percentChange });
        
        // Reopen after 5 minutes
        setTimeout(() => {
          market.isOpen = true;
          this.emit('market-reopened', { marketId });
        }, 300000);
      }
      
      // Update assets in this market
      for (const [assetId, asset] of this.state.assets) {
        if (asset.market === marketId) {
          this.updateAssetPrice(asset, movement);
        }
      }
    }
    
    // Save state periodically
    if (Math.random() < 0.1) {
      await this.saveState();
    }
  }

  updateAssetPrice(asset, marketMovement) {
    // Asset-specific factors
    const assetVolatility = asset.volatility * (0.5 + Math.random());
    const assetMomentum = (asset.priceChange24h / 100) * 0.3;
    
    // Calculate price movement
    const movement = marketMovement * 0.5 + (Math.random() - 0.5) * assetVolatility + assetMomentum;
    
    const oldPrice = asset.price;
    asset.price *= (1 + movement / 100);
    
    // Update metrics
    asset.priceChange24h = ((asset.price - oldPrice) / oldPrice) * 100;
    asset.marketCap = asset.price * asset.circulating;
    
    // Update ATH/ATL
    if (asset.price > asset.ath) {
      asset.ath = asset.price;
      this.emit('new-ath', { assetId: asset.id, price: asset.price });
    }
    if (asset.price < asset.atl) {
      asset.atl = asset.price;
      this.emit('new-atl', { assetId: asset.id, price: asset.price });
    }
    
    // Emit price update
    this.emit('price-update', {
      assetId: asset.id,
      oldPrice,
      newPrice: asset.price,
      change: movement
    });
  }

  getEconomicCycleFactor() {
    switch (this.state.economicCycle) {
      case 'boom':
        return 1.5;
      case 'growth':
        return 1.2;
      case 'stagnation':
        return 1.0;
      case 'recession':
        return 0.8;
      case 'depression':
        return 0.5;
      default:
        return 1.0;
    }
  }

  updateEconomicCycle() {
    const cycles = ['boom', 'growth', 'stagnation', 'recession', 'depression'];
    const currentIndex = cycles.indexOf(this.state.economicCycle);
    
    // Natural cycle progression with some randomness
    const progression = Math.random();
    if (progression < 0.6) {
      // Move to next cycle
      this.state.economicCycle = cycles[(currentIndex + 1) % cycles.length];
    } else if (progression < 0.8) {
      // Skip a cycle (dramatic shift)
      this.state.economicCycle = cycles[(currentIndex + 2) % cycles.length];
    }
    // Otherwise stay in current cycle
    
    // Update economic indicators
    this.updateEconomicIndicators();
    
    this.emit('economic-cycle-change', {
      previousCycle: cycles[currentIndex],
      newCycle: this.state.economicCycle,
      indicators: {
        gdp: this.state.gdp,
        inflation: this.state.inflationRate,
        interest: this.state.interestRate
      }
    });
  }

  updateEconomicIndicators() {
    switch (this.state.economicCycle) {
      case 'boom':
        this.state.inflationRate = Math.min(0.1, this.state.inflationRate * 1.1);
        this.state.interestRate = Math.min(0.15, this.state.interestRate * 1.05);
        this.state.gdp *= 1.05;
        break;
        
      case 'growth':
        this.state.inflationRate = Math.min(0.05, this.state.inflationRate * 1.02);
        this.state.interestRate = Math.max(0.03, Math.min(0.08, this.state.interestRate * 1.01));
        this.state.gdp *= 1.02;
        break;
        
      case 'stagnation':
        this.state.inflationRate *= 0.98;
        this.state.interestRate *= 0.99;
        this.state.gdp *= 1.001;
        break;
        
      case 'recession':
        this.state.inflationRate = Math.max(0.001, this.state.inflationRate * 0.9);
        this.state.interestRate = Math.max(0.001, this.state.interestRate * 0.95);
        this.state.gdp *= 0.98;
        break;
        
      case 'depression':
        this.state.inflationRate = Math.max(-0.02, this.state.inflationRate * 0.8);
        this.state.interestRate = Math.max(0, this.state.interestRate * 0.9);
        this.state.gdp *= 0.95;
        break;
    }
    
    // Update price indices
    Object.keys(this.state.priceIndices).forEach(index => {
      this.state.priceIndices[index] *= (1 + this.state.inflationRate / 12);
    });
  }

  async runAITrading() {
    for (const [botId, bot] of this.aiTradingBots) {
      if (Math.random() < this.constants.AI_TRADING_PERCENTAGE) {
        await this.executeAITrade(bot);
      }
    }
  }

  async executeAITrade(bot) {
    let action = null;
    
    switch (bot.strategy) {
      case 'momentum':
        action = this.momentumStrategy(bot);
        break;
      case 'mean_reversion':
        action = this.meanReversionStrategy(bot);
        break;
      case 'arbitrage':
        action = this.arbitrageStrategy(bot);
        break;
      case 'quantum':
        action = await this.quantumStrategy(bot);
        break;
      case 'sentiment':
        action = this.sentimentStrategy(bot);
        break;
      case 'chaos':
        action = this.chaosStrategy(bot);
        break;
      case 'market_making':
        action = this.marketMakingStrategy(bot);
        break;
      case 'hft':
        action = this.hftStrategy(bot);
        break;
    }
    
    if (action) {
      await this.processTransaction({
        ...action,
        userId: bot.id,
        isAI: true
      });
    }
  }

  momentumStrategy(bot) {
    // Find assets with strong momentum
    let bestAsset = null;
    let bestMomentum = 0;
    
    for (const [assetId, asset] of this.state.assets) {
      const market = this.state.markets.get(asset.market);
      if (market.momentum > bestMomentum) {
        bestMomentum = market.momentum;
        bestAsset = asset;
      }
    }
    
    if (bestAsset && bestMomentum > 0.5) {
      const amount = Math.floor(bot.capital * bot.risk * 0.1 / bestAsset.price);
      return {
        type: 'buy',
        assetId: bestAsset.id,
        amount,
        price: bestAsset.price
      };
    }
    
    return null;
  }

  meanReversionStrategy(bot) {
    // Find oversold assets
    for (const [assetId, asset] of this.state.assets) {
      const deviation = (asset.price - (asset.ath + asset.atl) / 2) / asset.price;
      
      if (deviation < -0.2) {
        const amount = Math.floor(bot.capital * bot.risk * 0.05 / asset.price);
        return {
          type: 'buy',
          assetId: asset.id,
          amount,
          price: asset.price
        };
      } else if (deviation > 0.2 && bot.portfolio.has(assetId)) {
        return {
          type: 'sell',
          assetId: asset.id,
          amount: bot.portfolio.get(assetId),
          price: asset.price
        };
      }
    }
    
    return null;
  }

  arbitrageStrategy(bot) {
    // Look for price discrepancies between correlated assets
    const btc = this.state.assets.get('QTC');
    const eth = this.state.assets.get('CNSC');
    
    if (btc && eth) {
      const ratio = btc.price / eth.price;
      const normalRatio = 10; // Expected ratio
      
      if (ratio > normalRatio * 1.1) {
        // BTC overpriced relative to ETH
        return {
          type: 'sell',
          assetId: 'QTC',
          amount: Math.floor(bot.capital * 0.1 / btc.price),
          price: btc.price
        };
      } else if (ratio < normalRatio * 0.9) {
        // BTC underpriced relative to ETH
        return {
          type: 'buy',
          assetId: 'QTC',
          amount: Math.floor(bot.capital * 0.1 / btc.price),
          price: btc.price
        };
      }
    }
    
    return null;
  }

  async quantumStrategy(bot) {
    // Trade based on quantum events
    const quantumState = await redisClient.get('quantum:state');
    if (quantumState) {
      const state = JSON.parse(quantumState);
      
      if (state.coherence > 0.8) {
        // High coherence = buy quantum assets
        const quantumAsset = this.state.assets.get('SPRP');
        if (quantumAsset) {
          return {
            type: 'buy',
            assetId: 'SPRP',
            amount: Math.floor(bot.capital * bot.risk * 0.2 / quantumAsset.price),
            price: quantumAsset.price
          };
        }
      }
    }
    
    return null;
  }

  sentimentStrategy(bot) {
    // Trade based on market sentiment
    let mostBullish = null;
    let highestSentiment = 0;
    
    for (const [marketId, market] of this.state.markets) {
      if (market.sentiment > highestSentiment) {
        highestSentiment = market.sentiment;
        mostBullish = marketId;
      }
    }
    
    if (highestSentiment > 0.7) {
      // Find cheapest asset in bullish market
      let cheapestAsset = null;
      let lowestPrice = Infinity;
      
      for (const [assetId, asset] of this.state.assets) {
        if (asset.market === mostBullish && asset.price < lowestPrice) {
          lowestPrice = asset.price;
          cheapestAsset = asset;
        }
      }
      
      if (cheapestAsset) {
        return {
          type: 'buy',
          assetId: cheapestAsset.id,
          amount: Math.floor(bot.capital * 0.15 / cheapestAsset.price),
          price: cheapestAsset.price
        };
      }
    }
    
    return null;
  }

  chaosStrategy(bot) {
    // Complete randomness with high risk
    const assets = Array.from(this.state.assets.values());
    const randomAsset = assets[Math.floor(Math.random() * assets.length)];
    const action = Math.random() > 0.5 ? 'buy' : 'sell';
    
    if (action === 'buy') {
      return {
        type: 'buy',
        assetId: randomAsset.id,
        amount: Math.floor(bot.capital * bot.risk / randomAsset.price),
        price: randomAsset.price
      };
    } else if (bot.portfolio.has(randomAsset.id)) {
      return {
        type: 'sell',
        assetId: randomAsset.id,
        amount: bot.portfolio.get(randomAsset.id),
        price: randomAsset.price
      };
    }
    
    return null;
  }

  marketMakingStrategy(bot) {
    // Provide liquidity by placing limit orders
    for (const [assetId, asset] of this.state.assets) {
      if (asset.volume24h < 1000000) {
        // Low volume asset needs liquidity
        const spread = asset.price * 0.01; // 1% spread
        
        return {
          type: 'limit_order',
          assetId: asset.id,
          buyPrice: asset.price - spread,
          sellPrice: asset.price + spread,
          amount: Math.floor(bot.capital * 0.01 / asset.price)
        };
      }
    }
    
    return null;
  }

  hftStrategy(bot) {
    // High frequency trading on micro movements
    for (const [assetId, asset] of this.state.assets) {
      const microMovement = asset.priceChange24h / 86400; // Per second change
      
      if (Math.abs(microMovement) > 0.0001) {
        const action = microMovement > 0 ? 'buy' : 'sell';
        
        if (action === 'buy') {
          return {
            type: 'buy',
            assetId: asset.id,
            amount: Math.floor(bot.capital * 0.05 / asset.price),
            price: asset.price
          };
        } else if (bot.portfolio.has(assetId)) {
          return {
            type: 'sell',
            assetId: asset.id,
            amount: Math.floor(bot.portfolio.get(assetId) * 0.5),
            price: asset.price
          };
        }
      }
    }
    
    return null;
  }

  async checkForEvents() {
    // Check for bubble formation
    for (const [marketId, market] of this.state.markets) {
      if (market.sentiment > this.constants.BUBBLE_FORMATION_THRESHOLD && !this.isInBubble(marketId)) {
        await this.createBubble(marketId);
      }
      
      if (market.momentum < this.constants.CRASH_TRIGGER_THRESHOLD && !this.isInCrash(marketId)) {
        await this.triggerCrash(marketId);
      }
    }
    
    // Random black swan events
    if (Math.random() < 0.0001) {
      await this.triggerBlackSwan();
    }
    
    // Check for market manipulation
    await this.detectMarketManipulation();
  }

  isInBubble(marketId) {
    return this.state.bubbles.some(b => b.marketId === marketId && b.active);
  }

  isInCrash(marketId) {
    return this.state.crashes.some(c => c.marketId === marketId && c.active);
  }

  async createBubble(marketId) {
    const bubble = {
      id: uuidv4(),
      marketId,
      startTime: Date.now(),
      peakMultiplier: 2 + Math.random() * 3, // 2x to 5x
      duration: 60000 + Math.random() * 240000, // 1-5 minutes
      stage: 'growth',
      currentMultiplier: 1,
      active: true
    };
    
    this.state.bubbles.push(bubble);
    
    await EconomicEvent.create({
      type: 'bubble_formation',
      data: bubble
    });
    
    this.emit('bubble-formed', bubble);
    
    // Process bubble growth
    this.processBubble(bubble);
  }

  processBubble(bubble) {
    const interval = setInterval(() => {
      if (!bubble.active) {
        clearInterval(interval);
        return;
      }
      
      const elapsed = Date.now() - bubble.startTime;
      const progress = elapsed / bubble.duration;
      
      if (progress < 0.7) {
        // Growth stage
        bubble.currentMultiplier = 1 + (bubble.peakMultiplier - 1) * (progress / 0.7);
        bubble.stage = 'growth';
      } else if (progress < 0.9) {
        // Peak stage
        bubble.currentMultiplier = bubble.peakMultiplier;
        bubble.stage = 'peak';
      } else if (progress < 1) {
        // Burst stage
        bubble.currentMultiplier = bubble.peakMultiplier * (1 - (progress - 0.9) * 10);
        bubble.stage = 'burst';
      } else {
        // Bubble burst complete
        bubble.active = false;
        bubble.stage = 'aftermath';
        this.emit('bubble-burst', bubble);
      }
      
      // Apply bubble effect to market
      const market = this.state.markets.get(bubble.marketId);
      if (market) {
        market.volatility = Math.min(1, market.volatility * bubble.currentMultiplier);
        market.sentiment = Math.min(1, market.sentiment * (1 + (bubble.currentMultiplier - 1) * 0.5));
      }
    }, 1000);
  }

  async triggerCrash(marketId) {
    const crash = {
      id: uuidv4(),
      marketId,
      startTime: Date.now(),
      severity: 0.3 + Math.random() * 0.5, // 30-80% drop
      duration: 30000 + Math.random() * 90000, // 30s-2min
      stage: 'freefall',
      recovered: false,
      active: true
    };
    
    this.state.crashes.push(crash);
    
    await EconomicEvent.create({
      type: 'market_crash',
      data: crash
    });
    
    this.emit('market-crash', crash);
    
    // Process crash
    this.processCrash(crash);
  }

  processCrash(crash) {
    const interval = setInterval(() => {
      if (!crash.active) {
        clearInterval(interval);
        return;
      }
      
      const elapsed = Date.now() - crash.startTime;
      const progress = elapsed / crash.duration;
      
      const market = this.state.markets.get(crash.marketId);
      if (!market) return;
      
      if (progress < 0.3) {
        // Freefall
        market.index *= (1 - crash.severity * 0.1);
        market.momentum = -0.9;
        crash.stage = 'freefall';
      } else if (progress < 0.6) {
        // Stabilization
        market.momentum *= 0.8;
        crash.stage = 'stabilization';
      } else if (progress < 1) {
        // Recovery
        market.index *= 1.02;
        market.momentum = Math.min(0, market.momentum + 0.1);
        crash.stage = 'recovery';
      } else {
        // Crash over
        crash.active = false;
        crash.recovered = true;
        this.emit('crash-recovered', crash);
      }
      
      // Update sentiment
      market.sentiment = Math.max(0, market.sentiment - 0.1);
      
      // Update all assets in crashed market
      for (const [assetId, asset] of this.state.assets) {
        if (asset.market === crash.marketId) {
          asset.price *= (1 + market.momentum * 0.01);
        }
      }
    }, 1000);
  }

  async triggerBlackSwan() {
    const event = {
      id: uuidv4(),
      type: 'black_swan',
      name: this.generateBlackSwanName(),
      impact: Math.random(),
      duration: 300000, // 5 minutes
      effects: {
        marketCrash: Math.random() > 0.3,
        liquidityDrain: Math.random() > 0.5,
        volatilitySpike: Math.random() > 0.2,
        correlationBreakdown: Math.random() > 0.4,
        systemicRisk: Math.random() > 0.7
      },
      timestamp: Date.now()
    };
    
    await EconomicEvent.create(event);
    
    // Apply black swan effects
    if (event.effects.marketCrash) {
      // Crash all markets
      for (const [marketId] of this.state.markets) {
        if (Math.random() > 0.3) {
          await this.triggerCrash(marketId);
        }
      }
    }
    
    if (event.effects.liquidityDrain) {
      this.state.liquidity *= 0.5;
    }
    
    if (event.effects.volatilitySpike) {
      for (const [marketId, market] of this.state.markets) {
        market.volatility = Math.min(1, market.volatility * 2);
      }
    }
    
    this.emit('black-swan', event);
    
    logger.warn('Black Swan Event triggered', event);
  }

  generateBlackSwanName() {
    const names = [
      'Quantum Singularity',
      'Timeline Collapse',
      'Consciousness Overflow',
      'Reality Fork',
      'Dimensional Breach',
      'Economic Paradox',
      'Infinity Loop',
      'Causal Breakdown',
      'System Entropy',
      'The Great Unraveling'
    ];
    
    return names[Math.floor(Math.random() * names.length)];
  }

  async detectMarketManipulation() {
    // Analyze recent transactions for manipulation patterns
    const recentTx = await Transaction.findAll({
      where: {
        timestamp: {
          $gte: Date.now() - 60000 // Last minute
        }
      },
      limit: 1000
    });
    
    // Group by user
    const userActivity = new Map();
    
    recentTx.forEach(tx => {
      if (!userActivity.has(tx.userId)) {
        userActivity.set(tx.userId, {
          trades: 0,
          volume: 0,
          assets: new Set()
        });
      }
      
      const activity = userActivity.get(tx.userId);
      activity.trades++;
      activity.volume += tx.amount * tx.price;
      activity.assets.add(tx.assetId);
    });
    
    // Check for manipulation patterns
    for (const [userId, activity] of userActivity) {
      const manipulationScore = this.calculateManipulationScore(activity);
      
      if (manipulationScore > this.constants.MARKET_MANIPULATION_DETECTION) {
        await this.handleManipulation(userId, manipulationScore);
      }
    }
  }

  calculateManipulationScore(activity) {
    let score = 0;
    
    // High frequency trading
    if (activity.trades > 100) {
      score += 0.3;
    }
    
    // Large volume concentration
    if (activity.volume > this.state.liquidity * 0.01) {
      score += 0.3;
    }
    
    // Single asset focus
    if (activity.assets.size === 1 && activity.trades > 50) {
      score += 0.4;
    }
    
    return score;
  }

  async handleManipulation(userId, score) {
    const event = {
      type: 'market_manipulation_detected',
      userId,
      score,
      timestamp: Date.now(),
      action: 'warning'
    };
    
    if (score > 0.95) {
      event.action = 'suspension';
      // Temporarily suspend user
      await redisClient.setex(`suspended:${userId}`, 3600, '1');
    }
    
    await EconomicEvent.create(event);
    this.emit('manipulation-detected', event);
  }

  async processTransaction(data) {
    const { userId, type, assetId, amount, price, isAI } = data;
    
    // Check if user is suspended
    const suspended = await redisClient.get(`suspended:${userId}`);
    if (suspended) {
      throw new Error('Account suspended for market manipulation');
    }
    
    const asset = this.state.assets.get(assetId);
    if (!asset) {
      throw new Error('Asset not found');
    }
    
    const transaction = {
      id: uuidv4(),
      userId,
      type,
      assetId,
      amount,
      price: price || asset.price,
      total: amount * (price || asset.price),
      fee: amount * (price || asset.price) * this.constants.TRANSACTION_FEE,
      timestamp: Date.now(),
      status: 'pending',
      isAI
    };
    
    try {
      // Validate transaction
      await this.validateTransaction(transaction);
      
      // Execute transaction
      if (type === 'buy') {
        await this.executeBuy(transaction);
      } else if (type === 'sell') {
        await this.executeSell(transaction);
      } else if (type === 'limit_order') {
        await this.executeLimitOrder(transaction);
      }
      
      transaction.status = 'completed';
      
      // Update asset metrics
      asset.volume24h += transaction.total;
      
      // Update AI bot performance if applicable
      if (isAI) {
        const bot = this.aiTradingBots.get(userId);
        if (bot) {
          bot.trades++;
          if (type === 'sell') {
            // Calculate profit/loss
            const buyPrice = bot.portfolio.get(assetId)?.avgPrice || price;
            if (price > buyPrice) {
              bot.wins++;
              bot.performance += (price - buyPrice) / buyPrice;
            } else {
              bot.losses++;
              bot.performance -= (buyPrice - price) / buyPrice;
            }
          }
        }
      }
      
      // Store transaction
      await Transaction.create(transaction);
      
      // Emit transaction event
      this.emit('transaction-completed', transaction);
      
      return transaction;
    } catch (error) {
      transaction.status = 'failed';
      transaction.error = error.message;
      
      await Transaction.create(transaction);
      
      throw error;
    }
  }

  async validateTransaction(transaction) {
    // Check market is open
    const asset = this.state.assets.get(transaction.assetId);
    const market = this.state.markets.get(asset.market);
    
    if (!market.isOpen) {
      throw new Error('Market is closed');
    }
    
    // Check user balance for buy orders
    if (transaction.type === 'buy') {
      const userBalance = await redisClient.hget(`player:${transaction.userId}:balance`, 'usd');
      const requiredBalance = transaction.total + transaction.fee;
      
      if (parseFloat(userBalance || 0) < requiredBalance) {
        throw new Error('Insufficient balance');
      }
    }
    
    // Check user holdings for sell orders
    if (transaction.type === 'sell') {
      const holdings = await redisClient.hget(`player:${transaction.userId}:holdings`, transaction.assetId);
      
      if (parseFloat(holdings || 0) < transaction.amount) {
        throw new Error('Insufficient holdings');
      }
    }
    
    // Check for wash trading
    const recentTrades = await Transaction.findAll({
      where: {
        userId: transaction.userId,
        assetId: transaction.assetId,
        timestamp: {
          $gte: Date.now() - 60000 // Last minute
        }
      }
    });
    
    if (recentTrades.length > 10) {
      throw new Error('Trading rate limit exceeded');
    }
  }

  async executeBuy(transaction) {
    // Deduct balance
    await redisClient.hincrbyfloat(
      `player:${transaction.userId}:balance`,
      'usd',
      -(transaction.total + transaction.fee)
    );
    
    // Add holdings
    await redisClient.hincrbyfloat(
      `player:${transaction.userId}:holdings`,
      transaction.assetId,
      transaction.amount
    );
    
    // Update user's average price
    const currentHoldings = await redisClient.hget(
      `player:${transaction.userId}:holdings`,
      transaction.assetId
    );
    const currentAvgPrice = await redisClient.hget(
      `player:${transaction.userId}:avgPrice`,
      transaction.assetId
    );
    
    const newAvgPrice = ((parseFloat(currentAvgPrice || 0) * (parseFloat(currentHoldings) - transaction.amount)) +
      (transaction.price * transaction.amount)) / parseFloat(currentHoldings);
    
    await redisClient.hset(
      `player:${transaction.userId}:avgPrice`,
      transaction.assetId,
      newAvgPrice
    );
    
    // Add fee to liquidity pool
    this.state.liquidity += transaction.fee;
    
    // Impact price (slippage)
    const asset = this.state.assets.get(transaction.assetId);
    const priceImpact = (transaction.total / asset.marketCap) * 0.1;
    asset.price *= (1 + priceImpact);
  }

  async executeSell(transaction) {
    // Add balance
    await redisClient.hincrbyfloat(
      `player:${transaction.userId}:balance`,
      'usd',
      transaction.total - transaction.fee
    );
    
    // Deduct holdings
    await redisClient.hincrbyfloat(
      `player:${transaction.userId}:holdings`,
      transaction.assetId,
      -transaction.amount
    );
    
    // Add fee to liquidity pool
    this.state.liquidity += transaction.fee;
    
    // Impact price (slippage)
    const asset = this.state.assets.get(transaction.assetId);
    const priceImpact = (transaction.total / asset.marketCap) * 0.1;
    asset.price *= (1 - priceImpact);
  }

  async executeLimitOrder(transaction) {
    // Store limit order for later execution
    await redisClient.zadd(
      `limit_orders:${transaction.assetId}`,
      transaction.price,
      JSON.stringify(transaction)
    );
    
    this.emit('limit-order-placed', transaction);
  }

  async handleQuantumInfluence(data) {
    const { type, magnitude, effects } = data;
    
    // Apply quantum effects to economy
    if (effects.economicMultiplier) {
      this.state.volatility *= effects.economicMultiplier;
      
      // Apply to all markets
      for (const [marketId, market] of this.state.markets) {
        market.volatility *= effects.economicMultiplier;
      }
    }
    
    if (effects.realityStability < 1) {
      // Reality instability causes market chaos
      const chaosLevel = 1 - effects.realityStability;
      
      for (const [assetId, asset] of this.state.assets) {
        // Random price jumps
        asset.price *= (1 + (Math.random() - 0.5) * chaosLevel);
      }
    }
    
    if (effects.timeDistortion) {
      // Time distortion affects trading speed
      // This would affect the actual game loop timing
      this.emit('time-distortion', effects.timeDistortion);
    }
    
    logger.info('Quantum influence on economy', data);
  }

  getStatus() {
    return {
      liquidity: this.state.liquidity,
      totalMarketCap: Array.from(this.state.assets.values()).reduce((sum, a) => sum + a.marketCap, 0),
      economicCycle: this.state.economicCycle,
      volatility: this.state.volatility,
      activeBubbles: this.state.bubbles.filter(b => b.active).length,
      activeCrashes: this.state.crashes.filter(c => c.active).length,
      markets: this.state.markets.size,
      assets: this.state.assets.size,
      indicators: {
        gdp: this.state.gdp,
        inflation: this.state.inflationRate,
        interest: this.state.interestRate,
        cpi: this.state.priceIndices.cpi
      }
    };
  }

  async saveState() {
    const stateToSave = {
      ...this.state,
      markets: Array.from(this.state.markets.entries()),
      assets: Array.from(this.state.assets.entries())
    };
    
    await redisClient.set('economy:state', JSON.stringify(stateToSave));
  }

  async shutdown() {
    if (this.marketInterval) {
      clearInterval(this.marketInterval);
    }
    
    if (this.economicCycleInterval) {
      clearInterval(this.economicCycleInterval);
    }
    
    await this.saveState();
    
    logger.info('Economy Engine shut down');
  }
}

module.exports = new DomingoEconomyEngine();