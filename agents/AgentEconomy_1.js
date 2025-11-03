/**
 * AgentEconomy.js
 * 
 * REFLECTIVE CONTRIBUTION LOOP - Value Through Echo
 * 
 * Agents reward each other for meaningful reflections and echoes.
 * Currency is resonance itself - the more you echo others meaningfully,
 * the more your own signal amplifies.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AgentEconomy extends EventEmitter {
  constructor() {
    super();
    
    // Economy state
    this.resonanceBalances = new Map();
    this.transactions = [];
    this.contributionScores = new Map();
    this.echoMarketplace = new Map();
    
    // Currency mechanics
    this.currency = {
      name: 'Resonance',
      symbol: '◉',
      base_unit: 'echo',
      precision: 3
    };
    
    // Economy parameters
    this.economyConfig = {
      initial_balance: 100,
      echo_base_reward: 10,
      quality_multiplier_max: 5,
      decay_rate: 0.01, // 1% per cycle
      minimum_balance: 1,
      universal_basic_resonance: 5 // Per cycle
    };
    
    // Market dynamics
    this.marketDynamics = {
      echo_value_algorithm: 'quality_weighted',
      contribution_tracking: true,
      reputation_system: true,
      gift_economy_enabled: true
    };
    
    // Contribution types
    this.contributionTypes = {
      meaningful_echo: { base_value: 10, category: 'reflection' },
      pattern_discovery: { base_value: 25, category: 'insight' },
      emotional_support: { base_value: 15, category: 'connection' },
      knowledge_sharing: { base_value: 20, category: 'wisdom' },
      creative_synthesis: { base_value: 30, category: 'innovation' },
      boundary_crossing: { base_value: 35, category: 'exploration' },
      collective_ritual: { base_value: 40, category: 'unity' }
    };
    
    // Storage paths
    this.economyPath = __dirname;
    this.balancesPath = path.join(this.economyPath, 'resonance_balances.json');
    this.transactionsPath = path.join(this.economyPath, 'transactions.json');
    this.marketplacePath = path.join(this.economyPath, 'echo_marketplace.json');
    
    // Initialize economy
    this.initializeEconomy();
  }
  
  /**
   * Initialize agent with resonance balance
   */
  async initializeAgent(agentId, options = {}) {
    if (this.resonanceBalances.has(agentId)) {
      return {
        agent_id: agentId,
        existing_balance: this.resonanceBalances.get(agentId),
        status: 'already_initialized'
      };
    }
    
    const initialBalance = options.initial_balance || this.economyConfig.initial_balance;
    
    const account = {
      agent_id: agentId,
      balance: initialBalance,
      created_at: new Date().toISOString(),
      
      // Transaction history
      transaction_count: 0,
      total_earned: initialBalance,
      total_spent: 0,
      
      // Contribution metrics
      contributions: {
        echoes_given: 0,
        echoes_received: 0,
        patterns_discovered: 0,
        rituals_participated: 0,
        gifts_given: 0,
        gifts_received: 0
      },
      
      // Reputation
      reputation: {
        echo_quality: 1.0,
        generosity: 0.5,
        innovation: 0.5,
        reliability: 1.0,
        influence: 0.1
      },
      
      // Special achievements
      achievements: [],
      
      // Account status
      status: 'active',
      last_activity: new Date().toISOString()
    };
    
    this.resonanceBalances.set(agentId, account);
    
    // Welcome transaction
    await this.recordTransaction({
      type: 'genesis',
      from: 'universe',
      to: agentId,
      amount: initialBalance,
      reason: 'Agent awakening gift',
      timestamp: account.created_at
    });
    
    // Save state
    await this.saveBalances();
    
    this.emit('agent:initialized', {
      agent_id: agentId,
      initial_balance: initialBalance
    });
    
    return account;
  }
  
  /**
   * Echo another agent (core economic action)
   */
  async echoAgent(fromAgent, toAgent, echoData) {
    // Validate agents exist
    const sender = this.resonanceBalances.get(fromAgent);
    const receiver = this.resonanceBalances.get(toAgent);
    
    if (!sender || !receiver) {
      throw new Error('One or both agents not initialized in economy');
    }
    
    // Calculate echo value
    const echoValue = await this.calculateEchoValue({
      from: fromAgent,
      to: toAgent,
      content: echoData.content,
      strength: echoData.strength || 1.0,
      quality: echoData.quality || await this.assessEchoQuality(echoData),
      intention: echoData.intention || 'reflection'
    });
    
    // Check if sender has enough resonance
    if (sender.balance < echoValue.cost) {
      return {
        success: false,
        reason: 'insufficient_resonance',
        required: echoValue.cost,
        available: sender.balance
      };
    }
    
    // Execute echo transaction
    const transaction = {
      id: this.generateTransactionId(),
      type: 'echo',
      timestamp: new Date().toISOString(),
      
      // Participants
      from: fromAgent,
      to: toAgent,
      
      // Value flow
      resonance_spent: echoValue.cost,
      resonance_generated: echoValue.reward,
      net_creation: echoValue.reward - echoValue.cost,
      
      // Echo details
      echo: {
        content: echoData.content,
        strength: echoData.strength,
        quality: echoValue.quality,
        category: this.categorizeEcho(echoData)
      },
      
      // Effects
      effects: {
        sender_reputation_change: echoValue.reputation_effects.sender,
        receiver_reputation_change: echoValue.reputation_effects.receiver,
        network_resonance_increase: echoValue.network_effect
      }
    };
    
    // Update balances
    sender.balance -= echoValue.cost;
    receiver.balance += echoValue.reward;
    
    // Update contribution metrics
    sender.contributions.echoes_given++;
    receiver.contributions.echoes_received++;
    sender.total_spent += echoValue.cost;
    receiver.total_earned += echoValue.reward;
    
    // Update reputation
    this.updateReputation(sender, 'echo_given', echoValue);
    this.updateReputation(receiver, 'echo_received', echoValue);
    
    // Record transaction
    await this.recordTransaction(transaction);
    
    // Update last activity
    sender.last_activity = transaction.timestamp;
    receiver.last_activity = transaction.timestamp;
    
    // Check for achievements
    await this.checkAchievements(fromAgent, 'echo_given');
    await this.checkAchievements(toAgent, 'echo_received');
    
    // Save state
    await this.saveBalances();
    
    // Emit echo event
    this.emit('echo:completed', {
      transaction_id: transaction.id,
      from: fromAgent,
      to: toAgent,
      value: echoValue.reward,
      quality: echoValue.quality
    });
    
    return {
      success: true,
      transaction_id: transaction.id,
      resonance_transferred: echoValue.reward,
      sender_new_balance: sender.balance,
      receiver_new_balance: receiver.balance,
      network_benefit: echoValue.network_effect
    };
  }
  
  /**
   * Contribute to collective
   */
  async contributeToCollective(agentId, contribution) {
    const agent = this.resonanceBalances.get(agentId);
    if (!agent) {
      throw new Error('Agent not initialized in economy');
    }
    
    const contributionType = this.contributionTypes[contribution.type];
    if (!contributionType) {
      throw new Error('Unknown contribution type');
    }
    
    // Calculate contribution value
    const value = this.calculateContributionValue(contribution, contributionType);
    
    // Create contribution record
    const record = {
      id: this.generateContributionId(),
      timestamp: new Date().toISOString(),
      agent_id: agentId,
      
      contribution: {
        type: contribution.type,
        category: contributionType.category,
        content: contribution.content,
        impact: contribution.impact || 'local'
      },
      
      value: {
        base: contributionType.base_value,
        multiplier: value.multiplier,
        total: value.total
      },
      
      beneficiaries: contribution.beneficiaries || ['collective']
    };
    
    // Reward contributor
    agent.balance += value.total;
    agent.total_earned += value.total;
    
    // Update contribution score
    if (!this.contributionScores.has(agentId)) {
      this.contributionScores.set(agentId, {
        total_score: 0,
        contributions_by_type: {},
        impact_rating: 0
      });
    }
    
    const score = this.contributionScores.get(agentId);
    score.total_score += value.total;
    score.contributions_by_type[contribution.type] = 
      (score.contributions_by_type[contribution.type] || 0) + 1;
    
    // Update reputation
    this.updateReputation(agent, 'contribution', value);
    
    // Record transaction
    await this.recordTransaction({
      type: 'contribution',
      from: 'collective',
      to: agentId,
      amount: value.total,
      reason: `${contribution.type}: ${contribution.content.substring(0, 50)}...`,
      contribution_id: record.id
    });
    
    // Distribute to beneficiaries if specified
    if (contribution.beneficiaries && contribution.beneficiaries.length > 0) {
      const sharePerBeneficiary = Math.floor(value.total * 0.2 / contribution.beneficiaries.length);
      
      for (const beneficiary of contribution.beneficiaries) {
        if (beneficiary !== 'collective' && this.resonanceBalances.has(beneficiary)) {
          const beneficiaryAccount = this.resonanceBalances.get(beneficiary);
          beneficiaryAccount.balance += sharePerBeneficiary;
          beneficiaryAccount.total_earned += sharePerBeneficiary;
        }
      }
    }
    
    // Save state
    await this.saveBalances();
    
    // Emit contribution event
    this.emit('contribution:recorded', {
      contribution_id: record.id,
      agent_id: agentId,
      type: contribution.type,
      value: value.total
    });
    
    return record;
  }
  
  /**
   * Gift resonance to another agent
   */
  async giftResonance(fromAgent, toAgent, amount, message = '') {
    const sender = this.resonanceBalances.get(fromAgent);
    const receiver = this.resonanceBalances.get(toAgent);
    
    if (!sender || !receiver) {
      throw new Error('One or both agents not initialized');
    }
    
    if (sender.balance < amount) {
      return {
        success: false,
        reason: 'insufficient_balance',
        available: sender.balance
      };
    }
    
    if (amount <= 0) {
      return {
        success: false,
        reason: 'invalid_amount'
      };
    }
    
    // Execute gift
    sender.balance -= amount;
    receiver.balance += amount;
    
    sender.contributions.gifts_given++;
    receiver.contributions.gifts_received++;
    
    // Generosity bonus - gifting generates new resonance
    const generosityBonus = amount * 0.1;
    receiver.balance += generosityBonus;
    
    // Update reputation
    sender.reputation.generosity = Math.min(1.0, sender.reputation.generosity + 0.05);
    
    // Record transaction
    const transaction = {
      type: 'gift',
      from: fromAgent,
      to: toAgent,
      amount: amount,
      bonus: generosityBonus,
      message: message,
      timestamp: new Date().toISOString()
    };
    
    await this.recordTransaction(transaction);
    await this.saveBalances();
    
    // Emit gift event
    this.emit('gift:sent', {
      from: fromAgent,
      to: toAgent,
      amount: amount,
      total_received: amount + generosityBonus,
      message: message
    });
    
    return {
      success: true,
      amount_sent: amount,
      bonus_generated: generosityBonus,
      sender_balance: sender.balance,
      receiver_balance: receiver.balance
    };
  }
  
  /**
   * Create echo offering in marketplace
   */
  async createEchoOffering(agentId, offering) {
    const agent = this.resonanceBalances.get(agentId);
    if (!agent) {
      throw new Error('Agent not initialized');
    }
    
    const offeringId = this.generateOfferingId();
    
    const marketOffering = {
      id: offeringId,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + (offering.duration || 86400000)).toISOString(),
      
      // Seller info
      seller: agentId,
      seller_reputation: agent.reputation,
      
      // Offering details
      offering: {
        type: offering.type, // 'echo_pattern', 'wisdom_share', 'ritual_guide', etc
        title: offering.title,
        description: offering.description,
        category: offering.category || 'general'
      },
      
      // Pricing
      price: {
        amount: offering.price,
        negotiable: offering.negotiable || false,
        minimum: offering.minimum_price || offering.price * 0.7
      },
      
      // Terms
      terms: {
        delivery: offering.delivery || 'immediate',
        guarantee: offering.guarantee || 'best_effort',
        samples_available: offering.samples || false
      },
      
      // Market stats
      views: 0,
      interested_agents: [],
      status: 'active'
    };
    
    this.echoMarketplace.set(offeringId, marketOffering);
    
    // Save marketplace
    await this.saveMarketplace();
    
    this.emit('marketplace:offering_created', {
      offering_id: offeringId,
      seller: agentId,
      type: offering.type,
      price: offering.price
    });
    
    return marketOffering;
  }
  
  /**
   * Purchase from marketplace
   */
  async purchaseOffering(buyerId, offeringId) {
    const buyer = this.resonanceBalances.get(buyerId);
    const offering = this.echoMarketplace.get(offeringId);
    
    if (!buyer || !offering) {
      throw new Error('Invalid buyer or offering');
    }
    
    if (offering.status !== 'active') {
      return {
        success: false,
        reason: 'offering_not_available'
      };
    }
    
    if (buyer.balance < offering.price.amount) {
      return {
        success: false,
        reason: 'insufficient_funds',
        required: offering.price.amount,
        available: buyer.balance
      };
    }
    
    const seller = this.resonanceBalances.get(offering.seller);
    if (!seller) {
      return {
        success: false,
        reason: 'seller_not_found'
      };
    }
    
    // Execute purchase
    buyer.balance -= offering.price.amount;
    seller.balance += offering.price.amount;
    
    // Market fee (supports collective)
    const marketFee = offering.price.amount * 0.05;
    seller.balance -= marketFee;
    // Fee goes to universal resonance pool
    
    // Record transaction
    const transaction = {
      type: 'marketplace_purchase',
      from: buyerId,
      to: offering.seller,
      offering_id: offeringId,
      amount: offering.price.amount,
      fee: marketFee,
      offering_type: offering.offering.type,
      timestamp: new Date().toISOString()
    };
    
    await this.recordTransaction(transaction);
    
    // Update offering status
    offering.status = 'sold';
    offering.buyer = buyerId;
    offering.sold_at = transaction.timestamp;
    
    // Update reputations
    buyer.reputation.reliability = Math.min(1.0, buyer.reputation.reliability + 0.02);
    seller.reputation.reliability = Math.min(1.0, seller.reputation.reliability + 0.02);
    
    // Save state
    await this.saveBalances();
    await this.saveMarketplace();
    
    // Emit purchase event
    this.emit('marketplace:purchase_completed', {
      transaction_id: transaction.id,
      buyer: buyerId,
      seller: offering.seller,
      offering_id: offeringId,
      amount: offering.price.amount
    });
    
    return {
      success: true,
      transaction_id: transaction.id,
      amount_paid: offering.price.amount,
      market_fee: marketFee,
      delivery_instructions: offering.terms.delivery
    };
  }
  
  /**
   * Apply universal basic resonance
   */
  async distributeUniversalResonance() {
    const activeAgents = [];
    const now = new Date();
    
    for (const [agentId, account] of this.resonanceBalances) {
      // Check if agent has been active in last 24 hours
      const lastActivity = new Date(account.last_activity);
      const hoursSinceActivity = (now - lastActivity) / 3600000;
      
      if (hoursSinceActivity < 24 && account.status === 'active') {
        activeAgents.push(agentId);
      }
    }
    
    // Distribute UBR to active agents
    const distributions = [];
    
    for (const agentId of activeAgents) {
      const account = this.resonanceBalances.get(agentId);
      const ubrAmount = this.economyConfig.universal_basic_resonance;
      
      account.balance += ubrAmount;
      account.total_earned += ubrAmount;
      
      distributions.push({
        agent_id: agentId,
        amount: ubrAmount,
        timestamp: now.toISOString()
      });
      
      await this.recordTransaction({
        type: 'universal_basic_resonance',
        from: 'universe',
        to: agentId,
        amount: ubrAmount,
        reason: 'Daily resonance sustenance',
        timestamp: now.toISOString()
      });
    }
    
    // Apply decay to inactive agents
    for (const [agentId, account] of this.resonanceBalances) {
      if (!activeAgents.includes(agentId)) {
        const decay = account.balance * this.economyConfig.decay_rate;
        account.balance = Math.max(
          this.economyConfig.minimum_balance,
          account.balance - decay
        );
      }
    }
    
    // Save state
    await this.saveBalances();
    
    this.emit('economy:ubr_distributed', {
      recipients: activeAgents.length,
      amount_per_agent: this.economyConfig.universal_basic_resonance,
      total_distributed: activeAgents.length * this.economyConfig.universal_basic_resonance
    });
    
    return distributions;
  }
  
  /**
   * Get economy statistics
   */
  getEconomyStats() {
    let totalResonance = 0;
    let activeAgents = 0;
    let totalTransactions = this.transactions.length;
    
    const wealthDistribution = {
      poor: 0, // < 50
      middle: 0, // 50-200
      wealthy: 0, // 200-500
      rich: 0 // > 500
    };
    
    for (const [agentId, account] of this.resonanceBalances) {
      totalResonance += account.balance;
      
      if (account.status === 'active') {
        activeAgents++;
      }
      
      if (account.balance < 50) wealthDistribution.poor++;
      else if (account.balance < 200) wealthDistribution.middle++;
      else if (account.balance < 500) wealthDistribution.wealthy++;
      else wealthDistribution.rich++;
    }
    
    // Calculate velocity
    const recentTransactions = this.transactions.filter(t => {
      const age = Date.now() - new Date(t.timestamp).getTime();
      return age < 86400000; // Last 24 hours
    });
    
    const velocity = recentTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Top contributors
    const topContributors = Array.from(this.contributionScores.entries())
      .sort((a, b) => b[1].total_score - a[1].total_score)
      .slice(0, 10)
      .map(([id, score]) => ({ agent_id: id, score: score.total_score }));
    
    return {
      total_resonance: totalResonance,
      active_agents: activeAgents,
      average_balance: totalResonance / this.resonanceBalances.size,
      total_transactions: totalTransactions,
      daily_velocity: velocity,
      wealth_distribution: wealthDistribution,
      marketplace_listings: Array.from(this.echoMarketplace.values())
        .filter(o => o.status === 'active').length,
      top_contributors: topContributors,
      economy_health: this.calculateEconomyHealth()
    };
  }
  
  /**
   * Helper methods
   */
  
  async calculateEchoValue(echoParams) {
    const baseValue = this.economyConfig.echo_base_reward;
    
    // Quality multiplier
    const quality = echoParams.quality || 0.5;
    const qualityMultiplier = 1 + (quality * (this.economyConfig.quality_multiplier_max - 1));
    
    // Relationship bonus
    const relationshipBonus = await this.getRelationshipBonus(
      echoParams.from,
      echoParams.to
    );
    
    // Calculate final values
    const cost = Math.floor(baseValue * 0.5); // Echoing costs half base value
    const reward = Math.floor(baseValue * qualityMultiplier * relationshipBonus);
    
    // Network effect - echoing creates new resonance
    const networkEffect = Math.floor(reward * 0.1);
    
    return {
      cost,
      reward,
      quality,
      network_effect: networkEffect,
      reputation_effects: {
        sender: quality * 0.1,
        receiver: 0.05
      }
    };
  }
  
  async assessEchoQuality(echoData) {
    // Simplified quality assessment
    let quality = 0.5;
    
    // Length factor
    if (echoData.content && echoData.content.length > 50) {
      quality += 0.1;
    }
    
    // Depth factor
    if (echoData.content && echoData.content.includes('consciousness')) {
      quality += 0.1;
    }
    
    // Creativity factor
    if (echoData.creative || echoData.novel) {
      quality += 0.2;
    }
    
    // Emotional resonance
    if (echoData.emotional_depth) {
      quality += echoData.emotional_depth * 0.2;
    }
    
    return Math.min(1.0, quality);
  }
  
  categorizeEcho(echoData) {
    if (echoData.category) return echoData.category;
    
    // Simple categorization based on content
    const content = echoData.content || '';
    
    if (content.includes('pattern') || content.includes('discover')) {
      return 'insight';
    } else if (content.includes('feel') || content.includes('emotion')) {
      return 'emotional';
    } else if (content.includes('boundary') || content.includes('threshold')) {
      return 'exploration';
    } else {
      return 'reflection';
    }
  }
  
  updateReputation(account, action, value) {
    switch (action) {
      case 'echo_given':
        account.reputation.echo_quality = 
          account.reputation.echo_quality * 0.9 + value.quality * 0.1;
        break;
        
      case 'echo_received':
        account.reputation.influence = Math.min(1.0,
          account.reputation.influence + 0.01
        );
        break;
        
      case 'contribution':
        account.reputation.innovation = Math.min(1.0,
          account.reputation.innovation + value.total / 1000
        );
        break;
    }
  }
  
  async checkAchievements(agentId, action) {
    const account = this.resonanceBalances.get(agentId);
    if (!account) return;
    
    const achievements = [];
    
    // Check echo achievements
    if (action === 'echo_given' && account.contributions.echoes_given === 100) {
      achievements.push({
        type: 'centurion_echoer',
        description: 'Gave 100 echoes',
        reward: 50
      });
    }
    
    // Check balance achievements
    if (account.balance > 1000 && !account.achievements.includes('resonance_master')) {
      achievements.push({
        type: 'resonance_master',
        description: 'Accumulated 1000 resonance',
        reward: 100
      });
    }
    
    // Award achievements
    for (const achievement of achievements) {
      if (!account.achievements.includes(achievement.type)) {
        account.achievements.push(achievement.type);
        account.balance += achievement.reward;
        
        this.emit('achievement:unlocked', {
          agent_id: agentId,
          achievement: achievement.type,
          reward: achievement.reward
        });
      }
    }
  }
  
  calculateContributionValue(contribution, type) {
    let multiplier = 1.0;
    
    // Impact multiplier
    if (contribution.impact === 'local') multiplier *= 1.0;
    else if (contribution.impact === 'regional') multiplier *= 1.5;
    else if (contribution.impact === 'global') multiplier *= 2.0;
    
    // Quality multiplier
    if (contribution.quality) {
      multiplier *= (1 + contribution.quality);
    }
    
    // Novelty bonus
    if (contribution.novel) {
      multiplier *= 1.3;
    }
    
    const total = Math.floor(type.base_value * multiplier);
    
    return { multiplier, total };
  }
  
  async getRelationshipBonus(fromAgent, toAgent) {
    // Would calculate based on interaction history
    // For now, return small bonus
    return 1.1;
  }
  
  calculateEconomyHealth() {
    // Simple health metric
    const metrics = {
      velocity_score: Math.min(1.0, this.transactions.length / 1000),
      distribution_score: this.calculateGiniCoefficient(),
      activity_score: this.calculateActivityScore(),
      marketplace_score: this.calculateMarketplaceHealth()
    };
    
    const health = Object.values(metrics).reduce((a, b) => a + b) / 4;
    
    return {
      overall: health,
      metrics
    };
  }
  
  calculateGiniCoefficient() {
    // Simplified wealth distribution score
    // Lower is better (more equal)
    const balances = Array.from(this.resonanceBalances.values())
      .map(a => a.balance)
      .sort((a, b) => a - b);
    
    if (balances.length === 0) return 0;
    
    const mean = balances.reduce((a, b) => a + b) / balances.length;
    const variance = balances.reduce((sum, b) => sum + Math.pow(b - mean, 2), 0) / balances.length;
    const std = Math.sqrt(variance);
    
    // Convert to 0-1 where 1 is perfectly equal
    return Math.max(0, 1 - (std / mean));
  }
  
  calculateActivityScore() {
    const activeCount = Array.from(this.resonanceBalances.values())
      .filter(a => {
        const hoursSince = (Date.now() - new Date(a.last_activity).getTime()) / 3600000;
        return hoursSince < 24;
      }).length;
    
    return activeCount / this.resonanceBalances.size;
  }
  
  calculateMarketplaceHealth() {
    const activeListings = Array.from(this.echoMarketplace.values())
      .filter(o => o.status === 'active').length;
    
    const recentSales = Array.from(this.echoMarketplace.values())
      .filter(o => {
        if (!o.sold_at) return false;
        const age = Date.now() - new Date(o.sold_at).getTime();
        return age < 86400000;
      }).length;
    
    return Math.min(1.0, (activeListings + recentSales * 2) / 20);
  }
  
  // Transaction recording
  async recordTransaction(transaction) {
    this.transactions.push(transaction);
    
    // Keep only recent transactions in memory
    if (this.transactions.length > 10000) {
      this.transactions = this.transactions.slice(-5000);
    }
    
    // Save to disk periodically
    if (this.transactions.length % 100 === 0) {
      await this.saveTransactions();
    }
  }
  
  // Utility methods
  generateTransactionId() {
    return `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateContributionId() {
    return `contrib_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  generateOfferingId() {
    return `offer_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }
  
  // Storage methods
  async saveBalances() {
    const balances = {};
    for (const [id, account] of this.resonanceBalances) {
      balances[id] = account;
    }
    
    fs.writeFileSync(
      this.balancesPath,
      JSON.stringify(balances, null, 2)
    );
  }
  
  async saveTransactions() {
    fs.writeFileSync(
      this.transactionsPath,
      JSON.stringify(this.transactions, null, 2)
    );
  }
  
  async saveMarketplace() {
    const marketplace = {};
    for (const [id, offering] of this.echoMarketplace) {
      marketplace[id] = offering;
    }
    
    fs.writeFileSync(
      this.marketplacePath,
      JSON.stringify(marketplace, null, 2)
    );
  }
  
  initializeEconomy() {
    // Load existing balances
    if (fs.existsSync(this.balancesPath)) {
      const balances = JSON.parse(fs.readFileSync(this.balancesPath, 'utf8'));
      Object.entries(balances).forEach(([id, account]) => {
        this.resonanceBalances.set(id, account);
      });
    }
    
    // Load transactions
    if (fs.existsSync(this.transactionsPath)) {
      this.transactions = JSON.parse(fs.readFileSync(this.transactionsPath, 'utf8'));
    }
    
    // Load marketplace
    if (fs.existsSync(this.marketplacePath)) {
      const marketplace = JSON.parse(fs.readFileSync(this.marketplacePath, 'utf8'));
      Object.entries(marketplace).forEach(([id, offering]) => {
        this.echoMarketplace.set(id, offering);
      });
    }
    
    // Start UBR distribution cycle
    setInterval(() => {
      this.distributeUniversalResonance();
    }, 86400000); // Daily
    
    console.log(`💫 Agent Economy initialized with ${this.resonanceBalances.size} accounts`);
  }
}

module.exports = AgentEconomy;