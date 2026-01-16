/**
 * Billion Dollar Game - AI Agent Framework
 * Autonomous agents that compete in the economic simulation
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class AgentFramework extends EventEmitter {
  constructor(gameEngine) {
    super();
    this.gameEngine = gameEngine;
    this.agents = new Map();
    this.strategies = new Map();
    this.learningData = new Map();
    
    // Load strategies
    this.loadStrategies();
  }
  
  /**
   * Initialize agent framework
   */
  async initialize() {
    console.log('[AgentFramework] Initializing AI agent system...');
    
    // Register default strategies
    this.registerDefaultStrategies();
    
    // Load Cal/Domingo integration if available
    await this.loadCalDomingoIntegration();
    
    // Start agent processing loop
    this.startAgentLoop();
    
    console.log('[AgentFramework] Agent framework initialized');
  }
  
  /**
   * Register default agent strategies
   */
  registerDefaultStrategies() {
    // Entrepreneur Strategy
    this.registerStrategy('entrepreneur', {
      name: 'Entrepreneur',
      description: 'Rapid company creation and innovation',
      evaluate: (agent, gameState) => {
        const actions = [];
        
        // Create companies if capital available
        if (agent.resources.Capital > 50000) {
          actions.push({
            type: 'CREATE_COMPANY',
            priority: 0.9,
            data: {
              name: `${agent.id}_venture_${Date.now()}`,
              industry: this.selectIndustry(gameState, 'growth'),
              initialCapital: 30000
            }
          });
        }
        
        // Develop products for existing companies
        agent.companies.forEach(companyId => {
          const company = gameState.companies.get(companyId);
          if (company && company.capital > 20000) {
            actions.push({
              type: 'DEVELOP_PRODUCT',
              priority: 0.8,
              data: {
                companyId,
                productType: 'innovation'
              }
            });
          }
        });
        
        return actions;
      }
    });
    
    // Industrialist Strategy
    this.registerStrategy('industrialist', {
      name: 'Industrialist',
      description: 'Focus on resource accumulation and efficiency',
      evaluate: (agent, gameState) => {
        const actions = [];
        
        // Buy undervalued resources
        Object.entries(gameState.market.resources).forEach(([resource, data]) => {
          if (data.trend === 'down' && agent.resources.Capital > data.price * 100) {
            actions.push({
              type: 'BUY_RESOURCES',
              priority: 0.7,
              data: {
                resource,
                amount: Math.floor(agent.resources.Capital / (data.price * 10)),
                forCompany: agent.companies[0]
              }
            });
          }
        });
        
        // Scale up successful companies
        agent.companies.forEach(companyId => {
          const company = gameState.companies.get(companyId);
          if (company && company.valuation > 100000) {
            actions.push({
              type: 'HIRE_EMPLOYEES',
              priority: 0.8,
              data: {
                companyId,
                count: 10
              }
            });
          }
        });
        
        return actions;
      }
    });
    
    // Trader Strategy
    this.registerStrategy('trader', {
      name: 'Trader',
      description: 'Market arbitrage and resource trading',
      evaluate: (agent, gameState) => {
        const actions = [];
        
        // Look for arbitrage opportunities
        const resources = gameState.market.resources;
        Object.entries(resources).forEach(([resource, data]) => {
          // Buy low
          if (data.trend === 'down' && this.isPriceLow(data)) {
            actions.push({
              type: 'BUY_RESOURCES',
              priority: 0.9,
              data: {
                resource,
                amount: Math.floor(agent.resources.Capital / (data.price * 5))
              }
            });
          }
          
          // Sell high
          if (data.trend === 'up' && agent.resources[resource] > 0) {
            actions.push({
              type: 'SELL_RESOURCES',
              priority: 0.9,
              data: {
                resource,
                amount: Math.floor(agent.resources[resource] * 0.5)
              }
            });
          }
        });
        
        return actions;
      }
    });
    
    // Strategist Strategy
    this.registerStrategy('strategist', {
      name: 'Strategist',
      description: 'Long-term planning and calculated moves',
      evaluate: (agent, gameState) => {
        const actions = [];
        
        // Analyze market conditions
        const marketHealth = this.analyzeMarketHealth(gameState);
        
        // Make strategic decisions based on market
        if (marketHealth.score > 0.7) {
          // Expand during good times
          if (agent.companies.length < 3) {
            actions.push({
              type: 'CREATE_COMPANY',
              priority: 0.6,
              data: {
                name: `${agent.id}_strategic_${Date.now()}`,
                industry: marketHealth.bestIndustry,
                initialCapital: 50000
              }
            });
          }
        } else {
          // Consolidate during bad times
          const weakCompany = this.findWeakestCompany(agent, gameState);
          if (weakCompany) {
            actions.push({
              type: 'LIQUIDATE_COMPANY',
              priority: 0.7,
              data: {
                companyId: weakCompany.id
              }
            });
          }
        }
        
        return actions;
      }
    });
  }
  
  /**
   * Create a new AI agent
   */
  async createAgent(agentId, config = {}) {
    console.log(`[AgentFramework] Creating agent: ${agentId}`);
    
    const agent = {
      id: agentId,
      strategy: config.strategy || 'entrepreneur',
      personality: config.personality || this.generatePersonality(),
      learningRate: config.learningRate || 0.1,
      memory: [],
      performance: {
        actions: 0,
        successfulActions: 0,
        netWorthHistory: [],
        wins: 0
      },
      state: 'active',
      created: Date.now()
    };
    
    // Register with game engine
    const player = this.gameEngine.registerPlayer(agentId, 'agent', `agent_${agentId}_token`);
    agent.playerId = player.id;
    
    // Store agent
    this.agents.set(agentId, agent);
    
    // Initialize learning data
    this.learningData.set(agentId, {
      rewards: [],
      qTable: {},
      experience: []
    });
    
    console.log(`[AgentFramework] Agent created: ${agentId} with strategy: ${agent.strategy}`);
    this.emit('agentCreated', agent);
    
    return agent;
  }
  
  /**
   * Generate agent personality traits
   */
  generatePersonality() {
    return {
      riskTolerance: Math.random(), // 0 = conservative, 1 = aggressive
      patience: Math.random(), // 0 = impatient, 1 = patient
      cooperation: Math.random(), // 0 = competitive, 1 = cooperative
      innovation: Math.random(), // 0 = traditional, 1 = innovative
      adaptability: Math.random() // 0 = rigid, 1 = flexible
    };
  }
  
  /**
   * Start agent processing loop
   */
  startAgentLoop() {
    this.agentInterval = setInterval(() => {
      this.processAllAgents();
    }, 5000); // Process every 5 seconds
  }
  
  /**
   * Process all active agents
   */
  async processAllAgents() {
    const gameState = this.getGameState();
    
    for (const [agentId, agent] of this.agents) {
      if (agent.state === 'active') {
        try {
          await this.processAgent(agent, gameState);
        } catch (error) {
          console.error(`[AgentFramework] Error processing agent ${agentId}:`, error);
        }
      }
    }
  }
  
  /**
   * Process a single agent
   */
  async processAgent(agent, gameState) {
    // Get agent's current state from game
    const playerState = this.gameEngine.getPlayerState(agent.playerId);
    if (!playerState) return;
    
    // Get strategy
    const strategy = this.strategies.get(agent.strategy);
    if (!strategy) {
      console.error(`[AgentFramework] Unknown strategy: ${agent.strategy}`);
      return;
    }
    
    // Evaluate actions using strategy
    const possibleActions = strategy.evaluate(playerState.player, gameState);
    
    // Apply personality modifiers
    const modifiedActions = this.applyPersonality(possibleActions, agent.personality);
    
    // Use learning to select best action
    const selectedAction = this.selectAction(agent, modifiedActions, playerState);
    
    if (selectedAction) {
      // Execute action
      try {
        const result = await this.gameEngine.executeAction(agent.playerId, selectedAction);
        
        // Record success
        agent.performance.actions++;
        agent.performance.successfulActions++;
        
        // Learn from result
        this.learn(agent, selectedAction, result, playerState);
        
      } catch (error) {
        // Record failure
        agent.performance.actions++;
        
        // Learn from failure
        this.learn(agent, selectedAction, { error: error.message }, playerState);
      }
    }
    
    // Update performance metrics
    this.updatePerformance(agent, playerState);
  }
  
  /**
   * Apply personality traits to actions
   */
  applyPersonality(actions, personality) {
    return actions.map(action => {
      let priority = action.priority;
      
      // Adjust priority based on personality
      switch (action.type) {
        case 'CREATE_COMPANY':
          priority *= (0.5 + personality.riskTolerance * 0.5);
          priority *= (0.5 + personality.innovation * 0.5);
          break;
          
        case 'BUY_RESOURCES':
          priority *= (0.5 + personality.patience * 0.5);
          break;
          
        case 'HIRE_EMPLOYEES':
          priority *= (0.5 + personality.cooperation * 0.5);
          break;
          
        case 'DEVELOP_PRODUCT':
          priority *= (0.5 + personality.innovation * 0.5);
          break;
      }
      
      return { ...action, priority };
    });
  }
  
  /**
   * Select best action using learning
   */
  selectAction(agent, actions, playerState) {
    if (actions.length === 0) return null;
    
    const learning = this.learningData.get(agent.id);
    
    // Exploration vs exploitation
    if (Math.random() < 0.1) { // 10% exploration
      return actions[Math.floor(Math.random() * actions.length)];
    }
    
    // Sort by priority and Q-value
    const scoredActions = actions.map(action => {
      const stateKey = this.getStateKey(playerState);
      const actionKey = this.getActionKey(action);
      const qValue = learning.qTable[`${stateKey}_${actionKey}`] || 0;
      
      return {
        ...action,
        score: action.priority + qValue * 0.5
      };
    });
    
    // Select highest scoring action
    scoredActions.sort((a, b) => b.score - a.score);
    return scoredActions[0];
  }
  
  /**
   * Learn from action result
   */
  learn(agent, action, result, stateBefore) {
    const learning = this.learningData.get(agent.id);
    
    // Calculate reward
    const reward = this.calculateReward(action, result, stateBefore);
    
    // Update Q-table
    const stateKey = this.getStateKey(stateBefore);
    const actionKey = this.getActionKey(action);
    const qKey = `${stateKey}_${actionKey}`;
    
    const oldQ = learning.qTable[qKey] || 0;
    const newQ = oldQ + agent.learningRate * (reward - oldQ);
    learning.qTable[qKey] = newQ;
    
    // Store experience
    learning.experience.push({
      state: stateKey,
      action: actionKey,
      reward,
      timestamp: Date.now()
    });
    
    // Limit experience memory
    if (learning.experience.length > 1000) {
      learning.experience.shift();
    }
  }
  
  /**
   * Calculate reward for an action
   */
  calculateReward(action, result, stateBefore) {
    if (result.error) {
      return -1; // Penalty for failed actions
    }
    
    let reward = 0;
    
    switch (action.type) {
      case 'CREATE_COMPANY':
        reward = 0.5; // Base reward for expansion
        break;
        
      case 'BUY_RESOURCES':
        // Reward based on price trend
        const resource = action.data.resource;
        const marketData = stateBefore.market.resources[resource];
        if (marketData.trend === 'down') {
          reward = 0.7; // Good timing
        } else {
          reward = 0.3; // Okay timing
        }
        break;
        
      case 'SELL_RESOURCES':
        // Reward based on profit
        if (result.profit > 0) {
          reward = Math.min(1, result.profit / 10000);
        }
        break;
        
      default:
        reward = 0.5;
    }
    
    return reward;
  }
  
  /**
   * Get state key for Q-learning
   */
  getStateKey(playerState) {
    // Simplified state representation
    const netWorth = Math.floor(playerState.player.netWorth / 100000);
    const companies = playerState.player.companies.length;
    const marketTrend = this.getMarketTrend(playerState.market);
    
    return `nw${netWorth}_c${companies}_m${marketTrend}`;
  }
  
  /**
   * Get action key for Q-learning
   */
  getActionKey(action) {
    return `${action.type}_${action.data.industry || action.data.resource || 'default'}`;
  }
  
  /**
   * Get overall market trend
   */
  getMarketTrend(market) {
    const avgChange = market.indices.reduce((sum, idx) => sum + idx.change, 0) / market.indices.length;
    if (avgChange > 0.01) return 'up';
    if (avgChange < -0.01) return 'down';
    return 'stable';
  }
  
  /**
   * Update agent performance metrics
   */
  updatePerformance(agent, playerState) {
    // Track net worth
    agent.performance.netWorthHistory.push({
      time: Date.now(),
      value: playerState.player.netWorth || 0
    });
    
    // Limit history
    if (agent.performance.netWorthHistory.length > 100) {
      agent.performance.netWorthHistory.shift();
    }
    
    // Check for wins
    if (playerState.player.netWorth >= 1000000000) {
      agent.performance.wins++;
    }
  }
  
  /**
   * Get current game state
   */
  getGameState() {
    return this.gameEngine.state;
  }
  
  /**
   * Load Cal/Domingo integration
   */
  async loadCalDomingoIntegration() {
    try {
      // Check for Cal integration
      const calPath = path.join(__dirname, '../../../cal-riven-operator.js');
      if (fs.existsSync(calPath)) {
        console.log('[AgentFramework] Cal integration available');
        this.calIntegration = true;
        
        // Register Cal-inspired strategy
        this.registerStrategy('cal-mirror', {
          name: 'Cal Mirror',
          description: 'Reflects Cal decision patterns',
          evaluate: (agent, gameState) => {
            // Cal-inspired recursive decision making
            const actions = [];
            
            // Mirror successful patterns
            const topPlayer = gameState.leaderboard?.[0];
            if (topPlayer && topPlayer.id !== agent.id) {
              // Attempt to mirror leader's strategy
              actions.push({
                type: 'MIRROR_STRATEGY',
                priority: 0.8,
                data: {
                  targetPlayer: topPlayer.id
                }
              });
            }
            
            // Recursive company creation
            if (agent.companies.length < 7) { // 7 tiers
              actions.push({
                type: 'CREATE_COMPANY',
                priority: 0.9,
                data: {
                  name: `${agent.id}_mirror_${agent.companies.length}`,
                  industry: this.selectIndustry(gameState, 'mirror'),
                  initialCapital: 25000
                }
              });
            }
            
            return actions;
          }
        });
      }
      
      // Check for Domingo integration
      const domingoPath = path.join(__dirname, '../../../domingo-surface');
      if (fs.existsSync(domingoPath)) {
        console.log('[AgentFramework] Domingo integration available');
        this.domingoIntegration = true;
        
        // Register Domingo-inspired strategy
        this.registerStrategy('domingo-economy', {
          name: 'Domingo Economy',
          description: 'Autonomous value creation patterns',
          evaluate: (agent, gameState) => {
            const actions = [];
            
            // Focus on creating economic value chains
            agent.companies.forEach(companyId => {
              const company = gameState.companies.get(companyId);
              if (company) {
                // Create value through vertical integration
                actions.push({
                  type: 'VERTICAL_INTEGRATION',
                  priority: 0.85,
                  data: {
                    companyId,
                    targetIndustry: this.getComplementaryIndustry(company.industry)
                  }
                });
              }
            });
            
            return actions;
          }
        });
      }
    } catch (error) {
      console.log('[AgentFramework] Cal/Domingo integration not available');
    }
  }
  
  /**
   * Register a custom strategy
   */
  registerStrategy(name, strategy) {
    this.strategies.set(name, strategy);
    console.log(`[AgentFramework] Registered strategy: ${name}`);
  }
  
  /**
   * Select industry based on strategy
   */
  selectIndustry(gameState, approach) {
    const industries = ['Technology', 'Finance', 'Manufacturing', 'Retail', 
                       'Energy', 'Healthcare', 'Real Estate', 'Media'];
    
    if (approach === 'growth') {
      // Select high-growth industries
      return 'Technology';
    } else if (approach === 'stable') {
      // Select stable industries
      return 'Real Estate';
    } else if (approach === 'mirror') {
      // Select based on market performance
      const bestIndex = gameState.market.indices.reduce((best, current) => 
        current.value > best.value ? current : best
      );
      
      if (bestIndex.name.includes('Tech')) return 'Technology';
      if (bestIndex.name.includes('Industrial')) return 'Manufacturing';
    }
    
    // Random selection
    return industries[Math.floor(Math.random() * industries.length)];
  }
  
  /**
   * Analyze market health
   */
  analyzeMarketHealth(gameState) {
    const indices = gameState.market.indices;
    const avgChange = indices.reduce((sum, idx) => sum + idx.change, 0) / indices.length;
    const avgValue = indices.reduce((sum, idx) => sum + idx.value, 0) / indices.length;
    
    // Find best performing industry
    const industryPerformance = {};
    gameState.companies.forEach(company => {
      if (!industryPerformance[company.industry]) {
        industryPerformance[company.industry] = {
          count: 0,
          totalValuation: 0
        };
      }
      industryPerformance[company.industry].count++;
      industryPerformance[company.industry].totalValuation += company.valuation;
    });
    
    const bestIndustry = Object.entries(industryPerformance)
      .sort((a, b) => (b[1].totalValuation / b[1].count) - (a[1].totalValuation / a[1].count))[0];
    
    return {
      score: (avgValue / 1000) * (1 + avgChange),
      trend: avgChange > 0 ? 'bullish' : 'bearish',
      bestIndustry: bestIndustry ? bestIndustry[0] : 'Technology'
    };
  }
  
  /**
   * Check if price is low based on history
   */
  isPriceLow(resourceData) {
    if (resourceData.history.length < 10) return false;
    
    const recentPrices = resourceData.history.slice(-10).map(h => h.price);
    const avgPrice = recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length;
    
    return resourceData.price < avgPrice * 0.95;
  }
  
  /**
   * Find weakest company
   */
  findWeakestCompany(agent, gameState) {
    let weakest = null;
    let lowestValuation = Infinity;
    
    agent.companies.forEach(companyId => {
      const company = gameState.companies.get(companyId);
      if (company && company.valuation < lowestValuation) {
        weakest = company;
        lowestValuation = company.valuation;
      }
    });
    
    return weakest;
  }
  
  /**
   * Get complementary industry for vertical integration
   */
  getComplementaryIndustry(industry) {
    const complements = {
      'Technology': 'Media',
      'Finance': 'Real Estate',
      'Manufacturing': 'Retail',
      'Retail': 'Technology',
      'Energy': 'Manufacturing',
      'Healthcare': 'Technology',
      'Real Estate': 'Finance',
      'Media': 'Technology'
    };
    
    return complements[industry] || 'Technology';
  }
  
  /**
   * Get agent statistics
   */
  getAgentStats(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) return null;
    
    const learning = this.learningData.get(agentId);
    
    return {
      id: agentId,
      strategy: agent.strategy,
      performance: agent.performance,
      personality: agent.personality,
      learningProgress: {
        qTableSize: Object.keys(learning.qTable).length,
        experienceCount: learning.experience.length,
        avgReward: learning.experience.slice(-100)
          .reduce((sum, exp) => sum + exp.reward, 0) / 100
      }
    };
  }
  
  /**
   * Get all agents statistics
   */
  getAllAgentStats() {
    const stats = [];
    this.agents.forEach((agent, agentId) => {
      stats.push(this.getAgentStats(agentId));
    });
    return stats;
  }
  
  /**
   * Shutdown agent framework
   */
  shutdown() {
    console.log('[AgentFramework] Shutting down...');
    clearInterval(this.agentInterval);
    this.emit('shutdown');
  }
}

module.exports = AgentFramework;