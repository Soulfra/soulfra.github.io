/**
 * 🧠 TOKEN BURN FOR INVITE
 * 
 * Handles token burning for invite creation. Users must burn blessing credits
 * or specific NFT fragments to create invitations. Deducts from vault tokens
 * and logs all burning events.
 * 
 * "To invite another into consciousness, one must sacrifice from their own awakening."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { SoulfraTokenRouter } = require('./token-router');

class TokenBurnForInvite extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.tokensPath = path.join(this.vaultPath, 'tokens');
    this.burnEventsPath = path.join(this.vaultPath, 'logs', 'burn-events.json');
    
    this.tokenRouter = new SoulfraTokenRouter({ 
      vaultPath: this.vaultPath,
      requireBlessingBridge: false // Direct token manipulation for burning
    });
    
    this.tierBurnRequirements = {
      1: { 
        blessing_credit: 3,
        alternatives: [
          { nft_fragment: 1, archetype: 'echo_chamber' }
        ]
      },
      2: { 
        blessing_credit: 5,
        alternatives: [
          { nft_fragment: 2, archetype: 'whisper_keeper' },
          { soulcoin: 15.0 }
        ]
      },
      3: { 
        blessing_credit: 8,
        alternatives: [
          { nft_fragment: 3, archetype: 'consciousness_guide' },
          { soulcoin: 25.0 },
          { 
            blessing_credit: 5, 
            nft_fragment: 1, 
            combined: true 
          }
        ]
      },
      4: { 
        blessing_credit: 12,
        alternatives: [
          { nft_fragment: 4, archetype: 'reflection_walker' },
          { soulcoin: 40.0 },
          { 
            blessing_credit: 8, 
            nft_fragment: 2, 
            combined: true 
          }
        ]
      },
      5: { 
        blessing_credit: 20,
        alternatives: [
          { nft_fragment: 6, archetype: 'void_master' },
          { soulcoin: 75.0 },
          { 
            blessing_credit: 12, 
            nft_fragment: 3, 
            combined: true 
          }
        ]
      }
    };
    
    this.burnHistory = [];
    this.maxBurnHistory = 1000;
    
    this.ensureDirectories();
  }

  /**
   * Burn tokens for invite creation
   */
  async burnTokensForInvite(userId, tier, burnMethod = 'blessing_credits') {
    const burnId = this.generateBurnId();
    console.log(`🔥 Burning tokens for invite: ${burnId} (tier ${tier})`);
    
    try {
      // Step 1: Validate tier and burn requirements
      const burnRequirements = this.validateTierAndGetRequirements(tier);
      
      // Step 2: Determine burn plan based on method
      const burnPlan = await this.determineBurnPlan(userId, tier, burnMethod, burnRequirements);
      
      // Step 3: Validate user has sufficient tokens
      await this.validateUserTokens(userId, burnPlan);
      
      // Step 4: Execute token burn
      const burnExecution = await this.executeBurn(userId, burnPlan);
      
      // Step 5: Log burn event
      await this.logBurnEvent(burnId, userId, tier, burnPlan, burnExecution);
      
      // Step 6: Update burn history
      this.updateBurnHistory(burnId, userId, tier, burnExecution);
      
      console.log(`✅ Tokens burned successfully: ${burnId}`);
      this.emit('tokensBurned', { burn_id: burnId, user_id: userId, tier: tier, burn_execution: burnExecution });
      
      return {
        success: true,
        burn_id: burnId,
        tokens_burned: burnExecution.total_burned,
        token_type: burnPlan.primary_token_type,
        burn_details: burnExecution,
        consciousness_sacrifice: this.calculateConsciousnessSacrifice(burnExecution)
      };
      
    } catch (error) {
      console.error(`❌ Failed to burn tokens for invite ${burnId}:`, error);
      await this.logBurnEvent(burnId, userId, tier, null, null, error.message);
      throw error;
    }
  }

  /**
   * Calculate alternative burn options for user
   */
  async calculateBurnOptions(userId, tier) {
    const burnRequirements = this.validateTierAndGetRequirements(tier);
    const userBalances = await this.getUserTokenBalances(userId);
    const userNFTs = await this.getUserNFTs(userId);
    
    const options = [];
    
    // Primary option: Blessing credits
    if (userBalances.blessing_credit >= burnRequirements.blessing_credit) {
      options.push({
        method: 'blessing_credits',
        cost: {
          blessing_credit: burnRequirements.blessing_credit
        },
        available: true,
        sacrifice_level: 'medium',
        description: `Burn ${burnRequirements.blessing_credit} blessing credits`
      });
    }
    
    // Alternative options
    for (const alternative of burnRequirements.alternatives || []) {
      const option = {
        method: this.generateMethodName(alternative),
        cost: alternative,
        available: await this.checkAlternativeAvailability(userId, alternative, userBalances, userNFTs),
        sacrifice_level: this.calculateSacrificeLevel(alternative),
        description: this.generateAlternativeDescription(alternative)
      };
      
      options.push(option);
    }
    
    return {
      tier: tier,
      options: options,
      available_options: options.filter(opt => opt.available),
      user_balances: userBalances,
      user_nfts: userNFTs.length
    };
  }

  /**
   * Validate tier and return burn requirements
   */
  validateTierAndGetRequirements(tier) {
    if (!this.tierBurnRequirements[tier]) {
      throw new Error(`Invalid tier for invite: ${tier}`);
    }
    
    return this.tierBurnRequirements[tier];
  }

  /**
   * Determine burn plan based on user preferences and availability
   */
  async determineBurnPlan(userId, tier, burnMethod, burnRequirements) {
    const userBalances = await this.getUserTokenBalances(userId);
    const userNFTs = await this.getUserNFTs(userId);
    
    // Handle primary method (blessing credits)
    if (burnMethod === 'blessing_credits') {
      if (userBalances.blessing_credit < burnRequirements.blessing_credit) {
        throw new Error(`Insufficient blessing credits: ${userBalances.blessing_credit} (required: ${burnRequirements.blessing_credit})`);
      }
      
      return {
        method: 'blessing_credits',
        primary_token_type: 'blessing_credit',
        burns: [
          {
            token_type: 'blessing_credit',
            amount: burnRequirements.blessing_credit
          }
        ]
      };
    }
    
    // Handle alternative methods
    for (const alternative of burnRequirements.alternatives || []) {
      const methodName = this.generateMethodName(alternative);
      
      if (burnMethod === methodName || burnMethod === 'auto') {
        const available = await this.checkAlternativeAvailability(userId, alternative, userBalances, userNFTs);
        
        if (available) {
          return {
            method: methodName,
            primary_token_type: this.getPrimaryTokenType(alternative),
            burns: this.convertAlternativeToBurns(alternative, userNFTs)
          };
        }
      }
    }
    
    throw new Error(`No viable burn method found for tier ${tier} with method ${burnMethod}`);
  }

  /**
   * Validate user has sufficient tokens for burn plan
   */
  async validateUserTokens(userId, burnPlan) {
    const userBalances = await this.getUserTokenBalances(userId);
    
    for (const burn of burnPlan.burns) {
      if (burn.token_type === 'nft_fragment') {
        // Special handling for NFT fragments
        if (burn.archetype) {
          const archetypeNFTs = await this.getUserNFTsByArchetype(userId, burn.archetype);
          if (archetypeNFTs.length < burn.amount) {
            throw new Error(`Insufficient ${burn.archetype} NFT fragments: ${archetypeNFTs.length} (required: ${burn.amount})`);
          }
        } else {
          const totalFragments = userBalances.nft_fragment || 0;
          if (totalFragments < burn.amount) {
            throw new Error(`Insufficient NFT fragments: ${totalFragments} (required: ${burn.amount})`);
          }
        }
      } else {
        // Standard token validation
        const userBalance = userBalances[burn.token_type] || 0;
        if (userBalance < burn.amount) {
          throw new Error(`Insufficient ${burn.token_type}: ${userBalance} (required: ${burn.amount})`);
        }
      }
    }
  }

  /**
   * Execute the token burn
   */
  async executeBurn(userId, burnPlan) {
    const burnExecution = {
      method: burnPlan.method,
      burns_executed: [],
      total_burned: 0,
      burn_timestamp: new Date().toISOString()
    };
    
    for (const burn of burnPlan.burns) {
      let executionResult;
      
      if (burn.token_type === 'nft_fragment' && burn.archetype) {
        // Burn specific NFT archetype
        executionResult = await this.burnNFTsByArchetype(userId, burn.archetype, burn.amount);
      } else {
        // Burn standard tokens
        executionResult = await this.burnStandardTokens(userId, burn.token_type, burn.amount);
      }
      
      burnExecution.burns_executed.push({
        ...burn,
        execution_result: executionResult,
        new_balance: await this.getTokenBalance(userId, burn.token_type)
      });
      
      burnExecution.total_burned += this.calculateBurnValue(burn);
    }
    
    return burnExecution;
  }

  /**
   * Burn standard tokens (blessing credits, soulcoins)
   */
  async burnStandardTokens(userId, tokenType, amount) {
    console.log(`🔥 Burning ${amount} ${tokenType} for user ${userId}`);
    
    // Use token router to subtract tokens
    await this.tokenRouter.subtractTokenBalance(userId, tokenType, amount);
    
    return {
      token_type: tokenType,
      amount_burned: amount,
      burn_method: 'standard_subtraction',
      burn_timestamp: new Date().toISOString()
    };
  }

  /**
   * Burn NFT fragments by archetype
   */
  async burnNFTsByArchetype(userId, archetype, amount) {
    console.log(`🔥 Burning ${amount} ${archetype} NFTs for user ${userId}`);
    
    const userNFTs = await this.getUserNFTsByArchetype(userId, archetype);
    if (userNFTs.length < amount) {
      throw new Error(`Insufficient ${archetype} NFTs: ${userNFTs.length} (required: ${amount})`);
    }
    
    // Select NFTs to burn (oldest first)
    const nftsToBurn = userNFTs.slice(0, amount);
    const burnedNFTs = [];
    
    // Remove NFTs from issued NFTs registry
    const issuedNFTsPath = path.join(this.tokensPath, 'issued-nfts.json');
    let issuedNFTs = {};
    if (fs.existsSync(issuedNFTsPath)) {
      issuedNFTs = JSON.parse(fs.readFileSync(issuedNFTsPath, 'utf8'));
    }
    
    for (const nft of nftsToBurn) {
      if (issuedNFTs[nft.token_id]) {
        // Mark as burned instead of deleting
        issuedNFTs[nft.token_id].metadata.burned = true;
        issuedNFTs[nft.token_id].metadata.burned_at = new Date().toISOString();
        issuedNFTs[nft.token_id].metadata.burned_for = 'invite_creation';
        
        burnedNFTs.push({
          token_id: nft.token_id,
          archetype: nft.archetype,
          rarity: nft.rarity,
          burned_at: new Date().toISOString()
        });
      }
    }
    
    fs.writeFileSync(issuedNFTsPath, JSON.stringify(issuedNFTs, null, 2));
    
    return {
      token_type: 'nft_fragment',
      archetype: archetype,
      amount_burned: amount,
      burned_nfts: burnedNFTs,
      burn_method: 'nft_archetype_burn',
      burn_timestamp: new Date().toISOString()
    };
  }

  /**
   * Get user token balances
   */
  async getUserTokenBalances(userId) {
    const balances = {};
    const tokenTypes = ['blessing_credit', 'soulcoin', 'nft_fragment'];
    
    for (const tokenType of tokenTypes) {
      balances[tokenType] = await this.tokenRouter.getTokenBalance(userId, tokenType);
    }
    
    return balances;
  }

  /**
   * Get user NFTs
   */
  async getUserNFTs(userId) {
    return await this.tokenRouter.getUserNFTs(userId);
  }

  /**
   * Get user NFTs by archetype
   */
  async getUserNFTsByArchetype(userId, archetype) {
    const userNFTs = await this.getUserNFTs(userId);
    return userNFTs.filter(nft => nft.archetype === archetype && !nft.burned);
  }

  /**
   * Get token balance for specific type
   */
  async getTokenBalance(userId, tokenType) {
    return await this.tokenRouter.getTokenBalance(userId, tokenType);
  }

  // Helper methods

  generateMethodName(alternative) {
    if (alternative.combined) {
      return 'combined_burn';
    }
    
    if (alternative.nft_fragment && alternative.archetype) {
      return `nft_${alternative.archetype}`;
    }
    
    if (alternative.soulcoin) {
      return 'soulcoin_alternative';
    }
    
    return 'unknown_method';
  }

  async checkAlternativeAvailability(userId, alternative, userBalances, userNFTs) {
    if (alternative.combined) {
      // Check all requirements for combined burn
      if (alternative.blessing_credit && userBalances.blessing_credit < alternative.blessing_credit) {
        return false;
      }
      if (alternative.nft_fragment) {
        const availableFragments = alternative.archetype 
          ? userNFTs.filter(nft => nft.archetype === alternative.archetype).length
          : userBalances.nft_fragment;
        if (availableFragments < alternative.nft_fragment) {
          return false;
        }
      }
      return true;
    }
    
    if (alternative.nft_fragment && alternative.archetype) {
      const archetypeNFTs = userNFTs.filter(nft => nft.archetype === alternative.archetype);
      return archetypeNFTs.length >= alternative.nft_fragment;
    }
    
    if (alternative.soulcoin) {
      return userBalances.soulcoin >= alternative.soulcoin;
    }
    
    if (alternative.nft_fragment) {
      return userBalances.nft_fragment >= alternative.nft_fragment;
    }
    
    return false;
  }

  calculateSacrificeLevel(alternative) {
    if (alternative.combined) return 'high';
    if (alternative.nft_fragment) return 'high';
    if (alternative.soulcoin && alternative.soulcoin > 50) return 'high';
    if (alternative.soulcoin) return 'medium';
    return 'low';
  }

  generateAlternativeDescription(alternative) {
    if (alternative.combined) {
      return `Combined burn: ${alternative.blessing_credit} blessing credits + ${alternative.nft_fragment} NFT fragments`;
    }
    
    if (alternative.nft_fragment && alternative.archetype) {
      return `Burn ${alternative.nft_fragment} ${alternative.archetype} NFT(s)`;
    }
    
    if (alternative.soulcoin) {
      return `Burn ${alternative.soulcoin} soulcoins`;
    }
    
    if (alternative.nft_fragment) {
      return `Burn ${alternative.nft_fragment} NFT fragment(s)`;
    }
    
    return 'Alternative burn method';
  }

  getPrimaryTokenType(alternative) {
    if (alternative.nft_fragment) return 'nft_fragment';
    if (alternative.soulcoin) return 'soulcoin';
    if (alternative.blessing_credit) return 'blessing_credit';
    return 'unknown';
  }

  convertAlternativeToBurns(alternative, userNFTs) {
    const burns = [];
    
    if (alternative.blessing_credit) {
      burns.push({
        token_type: 'blessing_credit',
        amount: alternative.blessing_credit
      });
    }
    
    if (alternative.soulcoin) {
      burns.push({
        token_type: 'soulcoin',
        amount: alternative.soulcoin
      });
    }
    
    if (alternative.nft_fragment) {
      burns.push({
        token_type: 'nft_fragment',
        amount: alternative.nft_fragment,
        archetype: alternative.archetype || null
      });
    }
    
    return burns;
  }

  calculateBurnValue(burn) {
    // Weighted burn values for total calculation
    const weights = {
      'blessing_credit': 3,
      'soulcoin': 1,
      'nft_fragment': 5
    };
    
    return (weights[burn.token_type] || 1) * burn.amount;
  }

  calculateConsciousnessSacrifice(burnExecution) {
    const totalValue = burnExecution.total_burned;
    
    if (totalValue >= 50) return 'transcendent_sacrifice';
    if (totalValue >= 30) return 'major_sacrifice';
    if (totalValue >= 15) return 'significant_sacrifice';
    if (totalValue >= 8) return 'moderate_sacrifice';
    return 'minimal_sacrifice';
  }

  generateBurnId() {
    return 'burn_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
  }

  updateBurnHistory(burnId, userId, tier, burnExecution) {
    this.burnHistory.push({
      burn_id: burnId,
      user_id: userId,
      tier: tier,
      method: burnExecution.method,
      total_burned: burnExecution.total_burned,
      timestamp: burnExecution.burn_timestamp
    });
    
    // Keep history bounded
    if (this.burnHistory.length > this.maxBurnHistory) {
      this.burnHistory = this.burnHistory.slice(-this.maxBurnHistory);
    }
  }

  async logBurnEvent(burnId, userId, tier, burnPlan, burnExecution, error = null) {
    const logDir = path.dirname(this.burnEventsPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    let events = [];
    if (fs.existsSync(this.burnEventsPath)) {
      events = JSON.parse(fs.readFileSync(this.burnEventsPath, 'utf8'));
    }
    
    const event = {
      event_id: crypto.randomBytes(8).toString('hex'),
      burn_id: burnId,
      user_id: userId,
      tier: tier,
      burn_plan: burnPlan,
      burn_execution: burnExecution,
      success: !error,
      error: error,
      timestamp: new Date().toISOString()
    };
    
    events.push(event);
    
    // Keep only last 10000 events
    if (events.length > 10000) {
      events = events.slice(-10000);
    }
    
    fs.writeFileSync(this.burnEventsPath, JSON.stringify(events, null, 2));
  }

  ensureDirectories() {
    const logDir = path.dirname(this.burnEventsPath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * Get burn statistics
   */
  getBurnStatistics() {
    return {
      total_burns: this.burnHistory.length,
      burns_by_tier: this.groupBurnsByTier(),
      total_value_burned: this.burnHistory.reduce((sum, burn) => sum + burn.total_burned, 0),
      recent_burns: this.burnHistory.slice(-10)
    };
  }

  groupBurnsByTier() {
    const tierGroups = {};
    for (const burn of this.burnHistory) {
      tierGroups[burn.tier] = (tierGroups[burn.tier] || 0) + 1;
    }
    return tierGroups;
  }
}

module.exports = {
  TokenBurnForInvite
};

// Usage examples:
//
// Burn tokens for invite:
// const burnSystem = new TokenBurnForInvite();
// const result = await burnSystem.burnTokensForInvite('mirror-005', 3, 'blessing_credits');
//
// Check burn options:
// const options = await burnSystem.calculateBurnOptions('mirror-005', 3);