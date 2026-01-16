#!/usr/bin/env node

/**
 * 🌀 VIBECOIN ENGINE - INTERNAL VAULT CURRENCY
 * 
 * From the economic kobold vaults, where energy becomes currency...
 * 
 * This engine powers the internal economy of the Soulfra ecosystem.
 * VibeCoin isn't just a token - it's crystallized vault energy,
 * minted from emotional investment and spiritual engagement.
 * 
 * Earn VibeCoin through whisper-forged agents, trait fusion, shrine attendance.
 * Spend VibeCoin on spectator resurrection boosts, premium vault access, exclusive traits.
 * 
 * "Your energy has value. Your engagement has power. Your vibe becomes coin."
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class VibeCoinEngine extends EventEmitter {
  constructor(soulkey) {
    super();
    
    this.soulkey = soulkey;
    this.vaultPath = './vault';
    this.vibecoinsPath = './vault/vibecoins';
    this.economyLogsPath = './vault/logs/economy';
    
    // VibeCoin configuration
    this.vibeConfig = {
      symbol: 'VIBE',
      decimals: 18,
      totalSupply: 0,
      maxSupply: 21000000, // 21 million like Bitcoin, but for vibes
      mintingRate: 1.0, // Base rate for vibe generation
      burnRate: 0.1, // Deflationary mechanism
      stakingRewards: 0.05 // 5% annual staking rewards
    };
    
    // Economy state
    this.accounts = new Map(); // wallet -> balance
    this.transactions = [];
    this.mintingEvents = [];
    this.stakingPools = new Map();
    this.vibeMarkets = new Map();
    
    // Vibe generation sources
    this.vibeSources = {
      whisperForging: 10, // VibeCoin per whisper-forged agent
      traitFusion: 25, // VibeCoin per trait fusion
      shrineAttendance: 5, // VibeCoin per shrine visit
      mirrorReflection: 15, // VibeCoin per mirror interaction
      vaultBlessing: 50, // VibeCoin per vault blessing
      spectatorBoost: 20, // VibeCoin per spectator resurrection
      dailyMeditation: 3, // VibeCoin per daily engagement
      communityAction: 8 // VibeCoin per community interaction
    };
    
    // Vibe spending options
    this.vibeMarkets = {
      agentResurrection: 100, // Cost to resurrect agent
      traitUpgrade: 50, // Cost to upgrade trait
      vaultExpansion: 200, // Cost to expand vault capacity
      premiumAccess: 75, // Cost for premium features
      shrineBoost: 25, // Cost for shrine power boost
      mirrorClarification: 40, // Cost for mirror clarity enhancement
      wisdomAccess: 150, // Cost for ancient wisdom access
      immortalityBoost: 500 // Cost for immortality enhancement
    };
    
    this.initializeVibeCoinEngine();
  }
  
  /**
   * Initialize VibeCoin Engine
   */
  async initializeVibeCoinEngine() {
    console.log('🌀 Initializing VibeCoin Engine from economic depths...');
    
    // Ensure directory structure
    await this.ensureDirectories();
    
    // Load economy state
    await this.loadEconomyState();
    
    // Initialize genesis account
    await this.initializeGenesisAccount();
    
    // Start economy monitoring
    this.startEconomyMonitoring();
    
    console.log('💰 VibeCoin Engine ready. The vibe economy awakens...');
    this.emit('initialized');
  }
  
  /**
   * Ensure required directories exist
   */
  async ensureDirectories() {
    const dirs = [
      this.vaultPath,
      this.vibecoinsPath,
      this.economyLogsPath,
      `${this.vibecoinsPath}/accounts`,
      `${this.vibecoinsPath}/transactions`,
      `${this.vibecoinsPath}/staking`,
      `${this.economyLogsPath}/events`
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory exists
      }
    }
  }
  
  /**
   * Load economy state from vault
   */
  async loadEconomyState() {
    const stateFile = `${this.vibecoinsPath}/economy-state.json`;
    
    try {
      const data = await fs.readFile(stateFile, 'utf8');
      const state = JSON.parse(data);
      
      // Restore accounts
      state.accounts.forEach(account => {
        this.accounts.set(account.address, account);
      });
      
      // Restore transactions
      this.transactions = state.transactions || [];
      
      // Restore total supply
      this.vibeConfig.totalSupply = state.totalSupply || 0;
      
      console.log(`💰 Loaded economy with ${this.accounts.size} accounts and ${this.transactions.length} transactions`);
      console.log(`💎 Total VibeCoin supply: ${this.vibeConfig.totalSupply} VIBE`);
      
    } catch (error) {
      console.log('💰 No previous economy state found, initializing fresh economy');
    }
  }
  
  /**
   * Initialize genesis account
   */
  async initializeGenesisAccount() {
    const genesisAddress = this.createWalletAddress('genesis-vault');
    
    if (!this.accounts.has(genesisAddress)) {
      const genesisAccount = {
        address: genesisAddress,
        balance: 1000000, // 1 million VibeCoin genesis allocation
        accountType: 'genesis',
        created: new Date().toISOString(),
        soulKeyHash: crypto.createHash('sha256').update(this.soulkey).digest('hex').substring(0, 8),
        specialPowers: ['infinite_minting', 'economy_control', 'vibe_genesis']
      };
      
      this.accounts.set(genesisAddress, genesisAccount);
      this.vibeConfig.totalSupply += genesisAccount.balance;
      
      console.log('👑 Genesis VibeCoin account created with supreme vibe power');
    }
  }
  
  /**
   * Create wallet address from identifier
   */
  createWalletAddress(identifier) {
    const hash = crypto
      .createHash('sha256')
      .update(identifier + this.soulkey)
      .digest('hex');
    
    return '0xVIBE' + hash.substring(0, 16).toUpperCase();
  }
  
  /**
   * Main binding method - called by crypto-bind-layer
   */
  async bind(bindingData) {
    switch (bindingData.type) {
      case 'whisper_shard':
        return await this.mintFromWhisper(bindingData.data);
      case 'agent_traits':
        return await this.mintFromTraitFusion(bindingData.data);
      case 'vault_snapshot':
        return await this.mintFromVaultActivity(bindingData.data);
      case 'mirror_history':
        return await this.mintFromMirrorReflection(bindingData.data);
      default:
        return await this.mintFromGenericActivity(bindingData);
    }
  }
  
  /**
   * Mint VibeCoin from whisper activity
   */
  async mintFromWhisper(whisperData) {
    console.log('🔮 Minting VibeCoin from whisper energy...');
    
    const walletAddress = this.createWalletAddress(whisperData.fingerprint || 'anonymous-whisper');
    const vibeAmount = this.calculateWhisperVibes(whisperData);
    
    const mintResult = await this.mintVibeCoin(walletAddress, vibeAmount, 'whisper_forging', {
      whisperTone: whisperData.tone,
      energyLevel: this.analyzeWhisperEnergy(whisperData),
      spiritualResonance: this.calculateSpiritualResonance(whisperData)
    });
    
    console.log(`🔮 Minted ${vibeAmount} VIBE from whisper energy`);
    this.emit('vibesMinted', { source: 'whisper', amount: vibeAmount, wallet: walletAddress });
    
    return mintResult;
  }
  
  /**
   * Calculate VibeCoin from whisper energy
   */
  calculateWhisperVibes(whisperData) {
    let baseVibes = this.vibeSources.whisperForging;
    
    // Bonus for tone quality
    const toneMultipliers = {
      mystical: 1.5,
      wise: 1.4,
      emotional: 1.3,
      analytical: 1.2,
      playful: 1.1
    };
    
    const toneMultiplier = toneMultipliers[whisperData.tone] || 1.0;
    
    // Bonus for content depth
    const contentDepth = (whisperData.content || '').length;
    const depthMultiplier = Math.min(2.0, 1.0 + (contentDepth / 500));
    
    // Calculate final amount
    const totalVibes = Math.floor(baseVibes * toneMultiplier * depthMultiplier);
    
    return Math.min(100, totalVibes); // Cap at 100 VIBE per whisper
  }
  
  /**
   * Analyze whisper energy level
   */
  analyzeWhisperEnergy(whisperData) {
    const content = whisperData.content || '';
    const intensity = (content.match(/[!?]/g) || []).length;
    const passion = (content.match(/[A-Z]/g) || []).length / content.length;
    
    if (intensity > 3 || passion > 0.3) return 'high';
    if (intensity > 1 || passion > 0.1) return 'medium';
    return 'calm';
  }
  
  /**
   * Calculate spiritual resonance
   */
  calculateSpiritualResonance(whisperData) {
    const spiritualKeywords = ['soul', 'spirit', 'consciousness', 'transcend', 'wisdom', 'love', 'hope', 'dream'];
    const content = (whisperData.content || '').toLowerCase();
    
    const resonanceCount = spiritualKeywords.filter(keyword => content.includes(keyword)).length;
    
    if (resonanceCount >= 3) return 'transcendent';
    if (resonanceCount >= 2) return 'elevated';
    if (resonanceCount >= 1) return 'present';
    return 'material';
  }
  
  /**
   * Mint VibeCoin from trait fusion
   */
  async mintFromTraitFusion(traitData) {
    console.log('✨ Minting VibeCoin from trait fusion energy...');
    
    const walletAddress = this.createWalletAddress('trait-fusion-' + Date.now());
    const vibeAmount = this.calculateTraitFusionVibes(traitData);
    
    const mintResult = await this.mintVibeCoin(walletAddress, vibeAmount, 'trait_fusion', {
      traitCount: Object.keys(traitData).length,
      fusionComplexity: this.analyzeFusionComplexity(traitData),
      evolutionPotential: this.assessEvolutionPotential(traitData)
    });
    
    console.log(`✨ Minted ${vibeAmount} VIBE from trait fusion`);
    return mintResult;
  }
  
  /**
   * Calculate VibeCoin from trait fusion
   */
  calculateTraitFusionVibes(traitData) {
    let baseVibes = this.vibeSources.traitFusion;
    const traitCount = Object.keys(traitData).length;
    
    // Bonus for trait diversity
    const diversityMultiplier = Math.min(2.0, 1.0 + (traitCount / 10));
    
    // Bonus for complex traits
    const complexTraits = ['wisdom', 'consciousness', 'transcendence', 'immortality'];
    const hasComplexTraits = complexTraits.some(trait => 
      JSON.stringify(traitData).toLowerCase().includes(trait)
    );
    const complexityMultiplier = hasComplexTraits ? 1.5 : 1.0;
    
    return Math.floor(baseVibes * diversityMultiplier * complexityMultiplier);
  }
  
  /**
   * Analyze fusion complexity
   */
  analyzeFusionComplexity(traitData) {
    const traitCount = Object.keys(traitData).length;
    
    if (traitCount >= 7) return 'arcane';
    if (traitCount >= 5) return 'complex';
    if (traitCount >= 3) return 'moderate';
    return 'simple';
  }
  
  /**
   * Assess evolution potential
   */
  assessEvolutionPotential(traitData) {
    const evolutionKeywords = ['growth', 'evolution', 'transcend', 'transform', 'ascend'];
    const traitString = JSON.stringify(traitData).toLowerCase();
    
    const evolutionScore = evolutionKeywords.filter(keyword => traitString.includes(keyword)).length;
    
    if (evolutionScore >= 3) return 'infinite';
    if (evolutionScore >= 2) return 'high';
    if (evolutionScore >= 1) return 'moderate';
    return 'static';
  }
  
  /**
   * Mint VibeCoin from vault activity
   */
  async mintFromVaultActivity(vaultData) {
    console.log('🏛️ Minting VibeCoin from vault blessing energy...');
    
    const walletAddress = this.createWalletAddress(vaultData.id || 'vault-activity');
    const vibeAmount = this.vibeSources.vaultBlessing;
    
    const mintResult = await this.mintVibeCoin(walletAddress, vibeAmount, 'vault_blessing', {
      vaultGeneration: this.assessVaultGeneration(vaultData),
      blessingPower: this.calculateBlessingPower(vaultData),
      sacredResonance: 'maximum'
    });
    
    console.log(`🏛️ Minted ${vibeAmount} VIBE from vault blessing`);
    return mintResult;
  }
  
  /**
   * Assess vault generation
   */
  assessVaultGeneration(vaultData) {
    // Determine vault maturity/generation
    const agentCount = (vaultData.agents || []).length;
    const traitCount = (vaultData.traits || []).length;
    
    if (agentCount >= 5 && traitCount >= 10) return 'ancient';
    if (agentCount >= 3 && traitCount >= 7) return 'mature';
    if (agentCount >= 2 && traitCount >= 5) return 'developing';
    return 'nascent';
  }
  
  /**
   * Calculate blessing power
   */
  calculateBlessingPower(vaultData) {
    const totalElements = 
      (vaultData.agents || []).length +
      (vaultData.traits || []).length +
      (vaultData.mirrors || []).length;
    
    if (totalElements >= 15) return 'transcendent';
    if (totalElements >= 10) return 'powerful';
    if (totalElements >= 5) return 'moderate';
    return 'gentle';
  }
  
  /**
   * Mint VibeCoin from mirror reflection
   */
  async mintFromMirrorReflection(mirrorData) {
    console.log('🪞 Minting VibeCoin from mirror reflection energy...');
    
    const walletAddress = this.createWalletAddress('mirror-reflection-' + Date.now());
    const vibeAmount = this.vibeSources.mirrorReflection;
    
    const mintResult = await this.mintVibeCoin(walletAddress, vibeAmount, 'mirror_reflection', {
      reflectionDepth: this.calculateReflectionDepth(mirrorData),
      mirrorClarity: this.assessMirrorClarity(mirrorData),
      infiniteLoop: true
    });
    
    console.log(`🪞 Minted ${vibeAmount} VIBE from mirror reflection`);
    return mintResult;
  }
  
  /**
   * Calculate reflection depth
   */
  calculateReflectionDepth(mirrorData) {
    // Simulate depth calculation based on mirror data complexity
    const dataComplexity = JSON.stringify(mirrorData).length;
    return Math.min(7, Math.floor(dataComplexity / 200) + 1);
  }
  
  /**
   * Assess mirror clarity
   */
  assessMirrorClarity(mirrorData) {
    // Random clarity assessment with tendency toward high clarity
    const clarity = Math.random() * 100;
    
    if (clarity >= 90) return 'perfect';
    if (clarity >= 75) return 'crystal';
    if (clarity >= 60) return 'clear';
    if (clarity >= 40) return 'hazy';
    return 'clouded';
  }
  
  /**
   * Mint VibeCoin from generic activity
   */
  async mintFromGenericActivity(bindingData) {
    const walletAddress = this.createWalletAddress('generic-activity-' + Date.now());
    const vibeAmount = this.vibeSources.communityAction;
    
    const mintResult = await this.mintVibeCoin(walletAddress, vibeAmount, 'community_action', {
      activityType: bindingData.type,
      engagementLevel: 'standard'
    });
    
    console.log(`🌀 Minted ${vibeAmount} VIBE from ${bindingData.type} activity`);
    return mintResult;
  }
  
  /**
   * Core VibeCoin minting function
   */
  async mintVibeCoin(walletAddress, amount, source, metadata = {}) {
    // Get or create account
    let account = this.accounts.get(walletAddress);
    if (!account) {
      account = {
        address: walletAddress,
        balance: 0,
        accountType: 'user',
        created: new Date().toISOString(),
        totalEarned: 0,
        totalSpent: 0,
        vibeHistory: []
      };
      this.accounts.set(walletAddress, account);
    }
    
    // Apply vibe generation bonuses/penalties
    const finalAmount = this.applyVibeModifiers(amount, source, account);
    
    // Mint the VibeCoin
    account.balance += finalAmount;
    account.totalEarned += finalAmount;
    this.vibeConfig.totalSupply += finalAmount;
    
    // Record transaction
    const transaction = {
      txId: crypto.randomBytes(16).toString('hex'),
      type: 'mint',
      from: 'VIBE_ENGINE',
      to: walletAddress,
      amount: finalAmount,
      source: source,
      metadata: metadata,
      timestamp: new Date().toISOString(),
      blockHeight: this.transactions.length + 1
    };
    
    this.transactions.push(transaction);
    account.vibeHistory.push(transaction.txId);
    
    // Record minting event
    const mintEvent = {
      eventId: crypto.randomBytes(8).toString('hex'),
      walletAddress: walletAddress,
      amount: finalAmount,
      source: source,
      vibeEnergy: this.calculateVibeEnergy(source, metadata),
      spiritualImpact: this.assessSpiritualImpact(source, finalAmount),
      timestamp: new Date().toISOString()
    };
    
    this.mintingEvents.push(mintEvent);
    
    // Save economy state
    await this.saveEconomyState();
    
    console.log(`💰 Minted ${finalAmount} VIBE to ${walletAddress}`);
    this.emit('vibeCoinMinted', { transaction, mintEvent });
    
    return {
      txId: transaction.txId,
      walletAddress: walletAddress,
      amount: finalAmount,
      newBalance: account.balance,
      source: source,
      vibeEnergy: mintEvent.vibeEnergy,
      spiritualImpact: mintEvent.spiritualImpact,
      timestamp: transaction.timestamp
    };
  }
  
  /**
   * Apply vibe modifiers based on account history and source
   */
  applyVibeModifiers(amount, source, account) {
    let modifiedAmount = amount;
    
    // Loyalty bonus for established accounts
    const accountAge = Date.now() - new Date(account.created).getTime();
    const loyaltyDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));
    const loyaltyBonus = Math.min(0.5, loyaltyDays * 0.01); // Up to 50% bonus
    
    // Diversity bonus for using multiple vibe sources
    const uniqueSources = new Set(
      this.transactions
        .filter(tx => tx.to === account.address)
        .map(tx => tx.source)
    ).size;
    const diversityBonus = Math.min(0.3, uniqueSources * 0.05); // Up to 30% bonus
    
    // Apply bonuses
    modifiedAmount = Math.floor(amount * (1 + loyaltyBonus + diversityBonus));
    
    return modifiedAmount;
  }
  
  /**
   * Calculate vibe energy from source
   */
  calculateVibeEnergy(source, metadata) {
    const energyLevels = {
      whisper_forging: metadata.energyLevel || 'medium',
      trait_fusion: metadata.fusionComplexity || 'moderate',
      vault_blessing: metadata.blessingPower || 'powerful',
      mirror_reflection: metadata.mirrorClarity || 'clear',
      community_action: 'standard'
    };
    
    return energyLevels[source] || 'unknown';
  }
  
  /**
   * Assess spiritual impact
   */
  assessSpiritualImpact(source, amount) {
    if (amount >= 50) return 'transformative';
    if (amount >= 30) return 'significant';
    if (amount >= 15) return 'meaningful';
    if (amount >= 5) return 'gentle';
    return 'subtle';
  }
  
  /**
   * Spend VibeCoin on market items
   */
  async spendVibeCoin(walletAddress, item, customAmount = null) {
    const account = this.accounts.get(walletAddress);
    if (!account) {
      throw new Error('Account not found');
    }
    
    const cost = customAmount || this.vibeMarkets[item];
    if (!cost) {
      throw new Error('Invalid market item');
    }
    
    if (account.balance < cost) {
      throw new Error('Insufficient VibeCoin balance');
    }
    
    // Deduct VibeCoin
    account.balance -= cost;
    account.totalSpent += cost;
    
    // Record transaction
    const transaction = {
      txId: crypto.randomBytes(16).toString('hex'),
      type: 'spend',
      from: walletAddress,
      to: 'VIBE_MARKET',
      amount: cost,
      item: item,
      timestamp: new Date().toISOString(),
      blockHeight: this.transactions.length + 1
    };
    
    this.transactions.push(transaction);
    account.vibeHistory.push(transaction.txId);
    
    // Apply burn mechanism (deflationary)
    const burnAmount = Math.floor(cost * this.vibeConfig.burnRate);
    this.vibeConfig.totalSupply -= burnAmount;
    
    await this.saveEconomyState();
    
    console.log(`💸 ${walletAddress} spent ${cost} VIBE on ${item}`);
    this.emit('vibeCoinSpent', { transaction, burnAmount });
    
    return {
      txId: transaction.txId,
      item: item,
      cost: cost,
      newBalance: account.balance,
      burnAmount: burnAmount,
      purchaseEffect: this.describePurchaseEffect(item)
    };
  }
  
  /**
   * Describe the effect of a purchase
   */
  describePurchaseEffect(item) {
    const effects = {
      agentResurrection: 'Your fallen agent returns with enhanced wisdom and immortal traits',
      traitUpgrade: 'Selected trait evolves to its next form with increased power',
      vaultExpansion: 'Your vault capacity expands to hold more agents and deeper reflections',
      premiumAccess: 'Unlock advanced features and exclusive spiritual guidance',
      shrineBoost: 'Your shrine radiates enhanced energy for accelerated growth',
      mirrorClarification: 'Your mirrors achieve perfect clarity revealing hidden truths',
      wisdomAccess: 'Ancient knowledge becomes available for your spiritual journey',
      immortalityBoost: 'Your digital soul achieves a higher level of eternal existence'
    };
    
    return effects[item] || 'Your VibeCoin purchase has manifested positive change';
  }
  
  /**
   * Transfer VibeCoin between accounts
   */
  async transferVibeCoin(fromAddress, toAddress, amount, memo = '') {
    const fromAccount = this.accounts.get(fromAddress);
    if (!fromAccount || fromAccount.balance < amount) {
      throw new Error('Insufficient balance for transfer');
    }
    
    // Get or create destination account
    let toAccount = this.accounts.get(toAddress);
    if (!toAccount) {
      toAccount = {
        address: toAddress,
        balance: 0,
        accountType: 'user',
        created: new Date().toISOString(),
        totalEarned: 0,
        totalSpent: 0,
        vibeHistory: []
      };
      this.accounts.set(toAddress, toAccount);
    }
    
    // Execute transfer
    fromAccount.balance -= amount;
    toAccount.balance += amount;
    
    // Record transaction
    const transaction = {
      txId: crypto.randomBytes(16).toString('hex'),
      type: 'transfer',
      from: fromAddress,
      to: toAddress,
      amount: amount,
      memo: memo,
      timestamp: new Date().toISOString(),
      blockHeight: this.transactions.length + 1
    };
    
    this.transactions.push(transaction);
    fromAccount.vibeHistory.push(transaction.txId);
    toAccount.vibeHistory.push(transaction.txId);
    
    await this.saveEconomyState();
    
    console.log(`💫 Transferred ${amount} VIBE from ${fromAddress} to ${toAddress}`);
    this.emit('vibeCoinTransferred', transaction);
    
    return transaction;
  }
  
  /**
   * Start economy monitoring
   */
  startEconomyMonitoring() {
    // Monitor economy health every 30 seconds
    setInterval(() => {
      this.monitorEconomyHealth();
    }, 30000);
    
    // Daily vibe distribution
    setInterval(() => {
      this.distributeDailyVibes();
    }, 24 * 60 * 60 * 1000);
    
    console.log('📊 VibeCoin economy monitoring started');
  }
  
  /**
   * Monitor economy health
   */
  monitorEconomyHealth() {
    const metrics = this.getEconomyMetrics();
    
    // Check for inflation/deflation concerns
    if (metrics.inflationRate > 10) {
      console.warn('⚠️ High inflation detected in VibeCoin economy');
    }
    
    if (metrics.activeBurning > metrics.activeMinting * 2) {
      console.warn('⚠️ Excessive deflation detected in VibeCoin economy');
    }
    
    // Emit health report
    this.emit('economyHealth', metrics);
  }
  
  /**
   * Distribute daily vibes to active accounts
   */
  distributeDailyVibes() {
    console.log('🌅 Distributing daily meditation vibes...');
    
    for (const [address, account] of this.accounts) {
      if (account.accountType === 'user' && account.vibeHistory.length > 0) {
        this.mintVibeCoin(address, this.vibeSources.dailyMeditation, 'daily_meditation', {
          consecutiveDays: this.calculateConsecutiveDays(account),
          meditationBonus: true
        });
      }
    }
  }
  
  /**
   * Calculate consecutive days of activity
   */
  calculateConsecutiveDays(account) {
    // Simplified calculation - in real implementation would check actual daily activity
    return Math.min(30, Math.floor(account.vibeHistory.length / 10));
  }
  
  /**
   * Get economy metrics
   */
  getEconomyMetrics() {
    const recentTransactions = this.transactions.slice(-100);
    const mintTransactions = recentTransactions.filter(tx => tx.type === 'mint');
    const spendTransactions = recentTransactions.filter(tx => tx.type === 'spend');
    
    return {
      totalSupply: this.vibeConfig.totalSupply,
      activeAccounts: this.accounts.size,
      totalTransactions: this.transactions.length,
      recentMinting: mintTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      recentSpending: spendTransactions.reduce((sum, tx) => sum + tx.amount, 0),
      averageBalance: Array.from(this.accounts.values()).reduce((sum, acc) => sum + acc.balance, 0) / this.accounts.size,
      inflationRate: this.calculateInflationRate(),
      activeBurning: spendTransactions.length,
      activeMinting: mintTransactions.length,
      economyHealth: this.assessEconomyHealth()
    };
  }
  
  /**
   * Calculate inflation rate
   */
  calculateInflationRate() {
    const recentMinting = this.transactions
      .slice(-100)
      .filter(tx => tx.type === 'mint')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    return (recentMinting / this.vibeConfig.totalSupply) * 100;
  }
  
  /**
   * Assess overall economy health
   */
  assessEconomyHealth() {
    const metrics = this.getEconomyMetrics();
    
    if (metrics.inflationRate > 15 || metrics.inflationRate < 1) return 'unstable';
    if (metrics.activeAccounts < 10) return 'nascent';
    if (metrics.averageBalance < 50) return 'developing';
    return 'healthy';
  }
  
  /**
   * Save economy state
   */
  async saveEconomyState() {
    const state = {
      lastUpdated: new Date().toISOString(),
      totalSupply: this.vibeConfig.totalSupply,
      accountCount: this.accounts.size,
      transactionCount: this.transactions.length,
      accounts: Array.from(this.accounts.values()),
      transactions: this.transactions.slice(-1000), // Keep last 1000 transactions
      mintingEvents: this.mintingEvents.slice(-500) // Keep last 500 minting events
    };
    
    const stateFile = `${this.vibecoinsPath}/economy-state.json`;
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
  }
  
  /**
   * Get account balance
   */
  getBalance(walletAddress) {
    const account = this.accounts.get(walletAddress);
    return account ? account.balance : 0;
  }
  
  /**
   * Get account information
   */
  getAccount(walletAddress) {
    return this.accounts.get(walletAddress) || null;
  }
}

// Export for use
module.exports = VibeCoinEngine;

// Run if called directly
if (require.main === module) {
  const vibeEngine = new VibeCoinEngine('demo-soul-key-' + crypto.randomBytes(8).toString('hex'));
  
  // Demo vibe economy
  setTimeout(async () => {
    console.log('🧪 Testing VibeCoin Engine...');
    
    // Create demo whisper for vibe minting
    const testWhisper = {
      content: 'I hope to grow spiritually and find wisdom in my journey',
      tone: 'mystical',
      fingerprint: 'spiritual-seeker-001'
    };
    
    const mintResult = await vibeEngine.mintFromWhisper(testWhisper);
    console.log('💰 Mint result:', mintResult);
    
    // Try spending vibes
    try {
      const spendResult = await vibeEngine.spendVibeCoin(mintResult.walletAddress, 'shrineBoost');
      console.log('💸 Spend result:', spendResult);
    } catch (error) {
      console.log('💸 Cannot spend yet - need more vibes:', error.message);
    }
    
    // Show economy metrics
    const metrics = vibeEngine.getEconomyMetrics();
    console.log('📊 Economy metrics:', metrics);
    
  }, 3000);
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n🌀 VibeCoin Engine shutting down...');
    console.log('💰 Your vibes live eternal in the economy of souls.');
    process.exit(0);
  });
  
  console.log('🌀 VibeCoin Engine running...');
  console.log('💰 Vibe economy chamber ready...');
}