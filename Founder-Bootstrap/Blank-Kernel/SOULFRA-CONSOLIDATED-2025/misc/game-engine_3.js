/**
 * Billion Dollar Game - Core Game Engine
 * Central processing system for game state, actions, and economic simulation
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');

class GameEngine extends EventEmitter {
  constructor() {
    super();
    this.state = {
      players: new Map(),
      companies: new Map(),
      market: {
        resources: this.initializeResources(),
        indices: [],
        events: []
      },
      gameTime: 0,
      startTime: Date.now()
    };
    
    this.config = {
      tickRate: 1000, // 1 second = 1 game hour
      startingCapital: 100000,
      winCondition: 1000000000, // $1 billion
      maxPlayers: 10000,
      saveInterval: 60000 // Save every minute
    };
    
    this.industries = [
      'Technology', 'Finance', 'Manufacturing', 'Retail', 
      'Energy', 'Healthcare', 'Real Estate', 'Media'
    ];
    
    this.resources = [
      'Capital', 'Labor', 'Materials', 'Technology', 
      'Energy', 'Data', 'Intellectual Property', 'Market Share'
    ];
  }
  
  /**
   * Initialize the game engine
   */
  async initialize() {
    console.log('[GameEngine] Initializing Billion Dollar Game...');
    
    // Load saved state if exists
    await this.loadState();
    
    // Start game loop
    this.startGameLoop();
    
    // Start auto-save
    this.startAutoSave();
    
    // Initialize market
    this.initializeMarket();
    
    console.log('[GameEngine] Game engine initialized successfully');
    this.emit('initialized');
  }
  
  /**
   * Initialize resource prices and supply/demand
   */
  initializeResources() {
    const resources = {};
    this.resources.forEach(resource => {
      resources[resource] = {
        price: this.getInitialPrice(resource),
        supply: 1000000,
        demand: 1000000,
        trend: 'stable',
        history: []
      };
    });
    return resources;
  }
  
  /**
   * Get initial price for a resource
   */
  getInitialPrice(resource) {
    const basePrices = {
      'Capital': 1,
      'Labor': 1000,
      'Materials': 100,
      'Technology': 5000,
      'Energy': 200,
      'Data': 500,
      'Intellectual Property': 10000,
      'Market Share': 50000
    };
    return basePrices[resource] || 1000;
  }
  
  /**
   * Initialize market conditions
   */
  initializeMarket() {
    // Create market indices
    this.state.market.indices = [
      { name: 'Global Index', value: 1000, change: 0 },
      { name: 'Tech Index', value: 1200, change: 0 },
      { name: 'Industrial Index', value: 900, change: 0 }
    ];
    
    // Schedule market events
    this.scheduleMarketEvent();
  }
  
  /**
   * Start the main game loop
   */
  startGameLoop() {
    this.gameLoop = setInterval(() => {
      this.tick();
    }, this.config.tickRate);
  }
  
  /**
   * Process one game tick
   */
  tick() {
    this.state.gameTime++;
    
    // Update market
    this.updateMarket();
    
    // Process companies
    this.processCompanies();
    
    // Update player states
    this.updatePlayers();
    
    // Check win conditions
    this.checkWinConditions();
    
    // Emit tick event
    this.emit('tick', {
      gameTime: this.state.gameTime,
      players: this.state.players.size,
      companies: this.state.companies.size
    });
  }
  
  /**
   * Register a new player
   */
  registerPlayer(playerId, playerType, trustToken) {
    if (this.state.players.has(playerId)) {
      throw new Error('Player already registered');
    }
    
    const player = {
      id: playerId,
      type: playerType, // 'human' or 'agent'
      trustToken: trustToken,
      companies: [],
      resources: {
        Capital: this.config.startingCapital
      },
      stats: {
        companiesCreated: 0,
        companiesSold: 0,
        totalRevenue: 0,
        totalProfit: 0,
        gamesWon: 0
      },
      achievements: [],
      joinTime: this.state.gameTime
    };
    
    this.state.players.set(playerId, player);
    
    console.log(`[GameEngine] Player registered: ${playerId} (${playerType})`);
    this.emit('playerJoined', player);
    
    return player;
  }
  
  /**
   * Create a new company
   */
  createCompany(playerId, companyData) {
    const player = this.state.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    
    const { name, industry, initialCapital = 10000 } = companyData;
    
    if (player.resources.Capital < initialCapital) {
      throw new Error('Insufficient capital');
    }
    
    const companyId = this.generateId('company');
    const company = {
      id: companyId,
      ownerId: playerId,
      name: name,
      industry: industry,
      valuation: initialCapital,
      capital: initialCapital,
      employees: 1,
      products: [],
      resources: {
        Materials: 0,
        Technology: 0,
        Energy: 0
      },
      revenue: [],
      expenses: [],
      foundedTime: this.state.gameTime
    };
    
    // Deduct capital from player
    player.resources.Capital -= initialCapital;
    player.companies.push(companyId);
    player.stats.companiesCreated++;
    
    // Add company to game state
    this.state.companies.set(companyId, company);
    
    console.log(`[GameEngine] Company created: ${name} by ${playerId}`);
    this.emit('companyCreated', company);
    
    return company;
  }
  
  /**
   * Execute a player action
   */
  async executeAction(playerId, action) {
    const player = this.state.players.get(playerId);
    if (!player) {
      throw new Error('Player not found');
    }
    
    console.log(`[GameEngine] Executing action: ${action.type} for ${playerId}`);
    
    switch (action.type) {
      case 'CREATE_COMPANY':
        return this.createCompany(playerId, action.data);
        
      case 'HIRE_EMPLOYEES':
        return this.hireEmployees(playerId, action.data);
        
      case 'BUY_RESOURCES':
        return this.buyResources(playerId, action.data);
        
      case 'SELL_RESOURCES':
        return this.sellResources(playerId, action.data);
        
      case 'DEVELOP_PRODUCT':
        return this.developProduct(playerId, action.data);
        
      case 'ACQUIRE_COMPANY':
        return this.acquireCompany(playerId, action.data);
        
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }
  
  /**
   * Update market conditions
   */
  updateMarket() {
    // Update resource prices based on supply/demand
    Object.keys(this.state.market.resources).forEach(resource => {
      const res = this.state.market.resources[resource];
      
      // Calculate price change
      const supplyDemandRatio = res.supply / Math.max(res.demand, 1);
      const priceChange = (1 - supplyDemandRatio) * 0.01; // 1% max change per tick
      
      // Update price
      const oldPrice = res.price;
      res.price = Math.max(1, res.price * (1 + priceChange));
      
      // Update trend
      if (res.price > oldPrice * 1.001) res.trend = 'up';
      else if (res.price < oldPrice * 0.999) res.trend = 'down';
      else res.trend = 'stable';
      
      // Add to history
      res.history.push({
        time: this.state.gameTime,
        price: res.price
      });
      
      // Keep history limited
      if (res.history.length > 1000) {
        res.history.shift();
      }
    });
    
    // Update market indices
    this.state.market.indices.forEach(index => {
      const change = (Math.random() - 0.5) * 0.02; // 2% max change
      index.change = change;
      index.value *= (1 + change);
    });
  }
  
  /**
   * Process all companies
   */
  processCompanies() {
    this.state.companies.forEach(company => {
      // Generate revenue
      const baseRevenue = company.employees * 1000 * (1 + Math.random());
      const marketMultiplier = this.getIndustryMultiplier(company.industry);
      const revenue = baseRevenue * marketMultiplier;
      
      // Calculate expenses
      const expenses = company.employees * 800; // Salary and overhead
      
      // Update company financials
      company.revenue.push({
        time: this.state.gameTime,
        amount: revenue
      });
      
      company.expenses.push({
        time: this.state.gameTime,
        amount: expenses
      });
      
      // Update capital
      company.capital += (revenue - expenses);
      
      // Update valuation
      this.updateCompanyValuation(company);
    });
  }
  
  /**
   * Update company valuation
   */
  updateCompanyValuation(company) {
    // Simple valuation model
    const revenueMultiple = this.getIndustryMultiple(company.industry);
    const avgRevenue = this.calculateAverageRevenue(company);
    const assetValue = company.capital + this.calculateResourceValue(company.resources);
    
    company.valuation = (avgRevenue * revenueMultiple * 12) + assetValue;
  }
  
  /**
   * Get industry-specific revenue multiplier
   */
  getIndustryMultiplier(industry) {
    const multipliers = {
      'Technology': 1.5,
      'Finance': 1.3,
      'Manufacturing': 1.0,
      'Retail': 0.9,
      'Energy': 1.2,
      'Healthcare': 1.4,
      'Real Estate': 1.1,
      'Media': 1.0
    };
    return multipliers[industry] || 1.0;
  }
  
  /**
   * Get industry-specific valuation multiple
   */
  getIndustryMultiple(industry) {
    const multiples = {
      'Technology': 5,
      'Finance': 3,
      'Manufacturing': 2,
      'Retail': 1.5,
      'Energy': 2.5,
      'Healthcare': 4,
      'Real Estate': 3,
      'Media': 2
    };
    return multiples[industry] || 2;
  }
  
  /**
   * Calculate average revenue
   */
  calculateAverageRevenue(company) {
    if (company.revenue.length === 0) return 0;
    
    const recentRevenue = company.revenue.slice(-24); // Last 24 hours
    const total = recentRevenue.reduce((sum, r) => sum + r.amount, 0);
    return total / recentRevenue.length;
  }
  
  /**
   * Calculate resource value
   */
  calculateResourceValue(resources) {
    let value = 0;
    Object.keys(resources).forEach(resource => {
      const amount = resources[resource];
      const price = this.state.market.resources[resource]?.price || 0;
      value += amount * price;
    });
    return value;
  }
  
  /**
   * Update all players
   */
  updatePlayers() {
    this.state.players.forEach(player => {
      // Calculate total net worth
      let netWorth = player.resources.Capital || 0;
      
      // Add company valuations
      player.companies.forEach(companyId => {
        const company = this.state.companies.get(companyId);
        if (company) {
          netWorth += company.valuation;
        }
      });
      
      // Update player stats
      player.netWorth = netWorth;
    });
  }
  
  /**
   * Check win conditions
   */
  checkWinConditions() {
    this.state.players.forEach(player => {
      if (player.netWorth >= this.config.winCondition) {
        this.handleWin(player);
      }
    });
  }
  
  /**
   * Handle player win
   */
  handleWin(player) {
    console.log(`[GameEngine] WINNER: ${player.id} reached $1 billion!`);
    player.stats.gamesWon++;
    
    this.emit('gameWon', {
      winner: player,
      gameTime: this.state.gameTime,
      finalNetWorth: player.netWorth
    });
    
    // Don't stop the game - let others continue playing
  }
  
  /**
   * Buy resources from market
   */
  buyResources(playerId, data) {
    const player = this.state.players.get(playerId);
    const { resource, amount, forCompany } = data;
    
    const market = this.state.market.resources[resource];
    if (!market) throw new Error('Invalid resource');
    
    const totalCost = market.price * amount;
    
    if (player.resources.Capital < totalCost) {
      throw new Error('Insufficient capital');
    }
    
    // Deduct capital
    player.resources.Capital -= totalCost;
    
    // Add resources
    if (forCompany) {
      const company = this.state.companies.get(forCompany);
      if (!company || company.ownerId !== playerId) {
        throw new Error('Invalid company');
      }
      company.resources[resource] = (company.resources[resource] || 0) + amount;
    } else {
      player.resources[resource] = (player.resources[resource] || 0) + amount;
    }
    
    // Update market
    market.demand += amount;
    
    return { success: true, totalCost };
  }
  
  /**
   * Hire employees for a company
   */
  hireEmployees(playerId, data) {
    const { companyId, count } = data;
    const company = this.state.companies.get(companyId);
    
    if (!company || company.ownerId !== playerId) {
      throw new Error('Invalid company');
    }
    
    const costPerEmployee = this.state.market.resources.Labor.price;
    const totalCost = costPerEmployee * count;
    
    if (company.capital < totalCost) {
      throw new Error('Insufficient company capital');
    }
    
    company.capital -= totalCost;
    company.employees += count;
    
    return { success: true, newEmployeeCount: company.employees };
  }
  
  /**
   * Schedule a market event
   */
  scheduleMarketEvent() {
    const events = [
      { type: 'BOOM', description: 'Economic boom!', effect: 1.2 },
      { type: 'RECESSION', description: 'Market downturn', effect: 0.8 },
      { type: 'INNOVATION', description: 'Tech breakthrough', effect: 1.5, industry: 'Technology' },
      { type: 'CRISIS', description: 'Energy crisis', effect: 0.6, industry: 'Energy' }
    ];
    
    setTimeout(() => {
      const event = events[Math.floor(Math.random() * events.length)];
      this.triggerMarketEvent(event);
      this.scheduleMarketEvent(); // Schedule next event
    }, 60000 + Math.random() * 240000); // 1-5 minutes
  }
  
  /**
   * Trigger a market event
   */
  triggerMarketEvent(event) {
    console.log(`[GameEngine] Market event: ${event.description}`);
    
    this.state.market.events.push({
      ...event,
      time: this.state.gameTime
    });
    
    // Apply effects
    if (event.industry) {
      // Industry-specific event
      this.state.companies.forEach(company => {
        if (company.industry === event.industry) {
          company.valuation *= event.effect;
        }
      });
    } else {
      // Global event
      this.state.market.indices.forEach(index => {
        index.value *= event.effect;
      });
    }
    
    this.emit('marketEvent', event);
  }
  
  /**
   * Generate unique ID
   */
  generateId(prefix) {
    return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  /**
   * Save game state
   */
  async saveState() {
    const stateFile = path.join(__dirname, '../data/game-state.json');
    const state = {
      players: Array.from(this.state.players.entries()),
      companies: Array.from(this.state.companies.entries()),
      market: this.state.market,
      gameTime: this.state.gameTime,
      startTime: this.state.startTime
    };
    
    try {
      await fs.promises.writeFile(stateFile, JSON.stringify(state, null, 2));
      console.log('[GameEngine] Game state saved');
    } catch (error) {
      console.error('[GameEngine] Failed to save state:', error);
    }
  }
  
  /**
   * Load game state
   */
  async loadState() {
    const stateFile = path.join(__dirname, '../data/game-state.json');
    
    try {
      const data = await fs.promises.readFile(stateFile, 'utf8');
      const state = JSON.parse(data);
      
      this.state.players = new Map(state.players);
      this.state.companies = new Map(state.companies);
      this.state.market = state.market;
      this.state.gameTime = state.gameTime;
      this.state.startTime = state.startTime;
      
      console.log('[GameEngine] Game state loaded');
    } catch (error) {
      console.log('[GameEngine] No saved state found, starting fresh');
    }
  }
  
  /**
   * Start auto-save timer
   */
  startAutoSave() {
    setInterval(() => {
      this.saveState();
    }, this.config.saveInterval);
  }
  
  /**
   * Get game state for a player
   */
  getPlayerState(playerId) {
    const player = this.state.players.get(playerId);
    if (!player) return null;
    
    const companies = player.companies.map(id => this.state.companies.get(id)).filter(Boolean);
    
    return {
      player,
      companies,
      market: {
        resources: this.state.market.resources,
        indices: this.state.market.indices,
        recentEvents: this.state.market.events.slice(-10)
      },
      leaderboard: this.getLeaderboard()
    };
  }
  
  /**
   * Get leaderboard
   */
  getLeaderboard() {
    const players = Array.from(this.state.players.values());
    return players
      .sort((a, b) => (b.netWorth || 0) - (a.netWorth || 0))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        type: p.type,
        netWorth: p.netWorth || 0,
        companies: p.companies.length
      }));
  }
  
  /**
   * Shutdown the game engine
   */
  async shutdown() {
    console.log('[GameEngine] Shutting down...');
    
    clearInterval(this.gameLoop);
    await this.saveState();
    
    this.emit('shutdown');
  }
}

module.exports = GameEngine;