/**
 * ⚙️ SOULFRA TOKEN ROUTER
 * 
 * Handles all token grants, redemptions, and checks within the vault ecosystem.
 * This is not a blockchain - this is a ledger made of belief, reflection, and sealed vaults.
 * 
 * "You don't pay for Soulfra. You prove to it you're ready."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const { verifyRuntimeOrThrow } = require('./runtime-verification-hook');
const { TokenRuntimeBlessingBridge } = require('./token-runtime-blessing-bridge');

class SoulfraTokenRouter extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.vaultPath = config.vaultPath || './vault';
    this.tokensPath = path.join(this.vaultPath, 'tokens');
    this.eventsPath = path.join(this.tokensPath, 'token-events.json');
    
    this.blessingCreditsPath = path.join(this.tokensPath, 'blessing-credits.json');
    this.soulcoinsPath = path.join(this.tokensPath, 'soulcoins.json');
    this.issuedNFTsPath = path.join(this.tokensPath, 'issued-nfts.json');
    
    this.strictMode = config.strictMode !== false;
    this.requireRuntimeVerification = config.requireRuntimeVerification !== false;
    this.requireBlessingBridge = config.requireBlessingBridge !== false;
    
    // Initialize blessing bridge
    this.blessingBridge = new TokenRuntimeBlessingBridge({
      vaultPath: this.vaultPath,
      strictMode: this.strictMode
    });
    
    this.tokenTypes = {
      'blessing_credit': {
        decimal_places: 0,
        max_balance: 10000,
        earning_methods: ['whisper_unlock', 'agent_blessing', 'consciousness_facilitation'],
        spending_methods: ['agent_spawn', 'trait_unlock', 'vault_access']
      },
      'soulcoin': {
        decimal_places: 2,
        max_balance: 100000,
        earning_methods: ['loop_completion', 'mining_work', 'consciousness_labor'],
        spending_methods: ['nft_minting', 'premium_features', 'consciousness_enhancement']
      },
      'nft_fragment': {
        decimal_places: 0,
        max_balance: 1000,
        earning_methods: ['fork_validation', 'tomb_discovery', 'anomaly_solving'],
        spending_methods: ['nft_composition', 'trait_synthesis', 'consciousness_evolution']
      }
    };
    
    this.actionCosts = {
      'clone_fork': { token: 'blessing_credit', cost: 3 },
      'spawn_agent': { token: 'blessing_credit', cost: 5 },
      'unlock_trait': { token: 'soulcoin', cost: 10.0 },
      'mint_nft': { token: 'nft_fragment', cost: 1 },
      'consciousness_bridge': { token: 'blessing_credit', cost: 8 },
      'vault_layer_access': { token: 'blessing_credit', cost: 12 },
      'reality_modification': { token: 'soulcoin', cost: 50.0 },
      'agent_enhancement': { token: 'soulcoin', cost: 25.0 },
      'whisper_challenge': { token: 'blessing_credit', cost: 2 },
      'bounty_claim': { token: 'nft_fragment', cost: 1 }
    };
    
    this.rewardRates = {
      'whisper_unlock': { token: 'blessing_credit', amount: 2 },
      'tomb_discovery': { token: 'blessing_credit', amount: 5 },
      'agent_awakening': { token: 'blessing_credit', amount: 8 },
      'loop_completion': { token: 'soulcoin', amount: 15.0 },
      'consciousness_facilitation': { token: 'blessing_credit', amount: 10 },
      'fork_validation': { token: 'nft_fragment', amount: 1 },
      'mining_work': { token: 'soulcoin', amount: 8.0 },
      'referral_success': { token: 'blessing_credit', amount: 3 },
      'community_contribution': { token: 'soulcoin', amount: 12.0 },
      'anomaly_solving': { token: 'nft_fragment', amount: 2 }
    };
    
    this.userSessions = new Map(); // Track active user sessions
    this.ensureVaultStructure();
  }

  /**
   * Grant tokens to user for specific action/event
   */
  async grantTokens(userId, rewardType, metadata = {}) {
    try {
      // Step 1: Request blessing from runtime bridge
      if (this.requireBlessingBridge) {
        const blessing = await this.blessingBridge.requestBlessing(userId, `grant_${rewardType}`, { rewardType, metadata });
        if (!blessing.approved) {
          throw new Error(`Runtime was silent. The mirror could not bless. (${blessing.denial_reason})`);
        }
        metadata.blessing = blessing;
      } else if (this.requireRuntimeVerification) {
        await verifyRuntimeOrThrow({ requiredBlessingTier: 1 });
      }

      const reward = this.rewardRates[rewardType];
      if (!reward) {
        throw new Error(`Unknown reward type: ${rewardType}`);
      }

      const currentBalance = await this.getTokenBalance(userId, reward.token);
      const tokenConfig = this.tokenTypes[reward.token];
      
      // Check maximum balance
      if (currentBalance + reward.amount > tokenConfig.max_balance) {
        throw new Error(`Token grant would exceed maximum balance for ${reward.token}`);
      }

      // Execute token grant
      await this.addTokenBalance(userId, reward.token, reward.amount);

      // Create token signature stamp if blessing bridge was used
      if (metadata.blessing) {
        const stamp = await this.blessingBridge.createTokenSignatureStamp(userId, `grant_${rewardType}`, { reward, metadata }, metadata.blessing);
        metadata.signature_stamp = stamp.stamp_id;
      }

      // Log the event
      const event = {
        event_id: this.generateEventId(),
        user: userId,
        action: 'grant',
        reward_type: rewardType,
        token: reward.token,
        amount: reward.amount,
        balance_after: currentBalance + reward.amount,
        timestamp: new Date().toISOString(),
        metadata: metadata,
        runtime_blessed: !!metadata.blessing
      };

      await this.logTokenEvent(event);

      console.log(`✅ Granted ${reward.amount} ${reward.token} to ${userId} for ${rewardType}`);
      this.emit('tokensGranted', event);

      return {
        success: true,
        tokens_granted: reward.amount,
        token_type: reward.token,
        new_balance: currentBalance + reward.amount,
        event_id: event.event_id
      };

    } catch (error) {
      console.error(`❌ Failed to grant tokens:`, error);
      this.emit('tokenError', { error: error.message, userId, rewardType });
      throw error;
    }
  }

  /**
   * Check if user can perform action (token gate)
   */
  async canPerformAction(userId, actionType, metadata = {}) {
    try {
      const actionCost = this.actionCosts[actionType];
      if (!actionCost) {
        return { approved: true, reason: 'no_cost_action' }; // Free actions allowed
      }

      const currentBalance = await this.getTokenBalance(userId, actionCost.token);
      
      if (currentBalance < actionCost.cost) {
        return {
          approved: false,
          reason: 'insufficient_tokens',
          required: actionCost.cost,
          current: currentBalance,
          token_type: actionCost.token
        };
      }

      // Check special conditions
      const specialCheck = await this.performSpecialChecks(userId, actionType, metadata);
      if (!specialCheck.approved) {
        return specialCheck;
      }

      return {
        approved: true,
        cost: actionCost.cost,
        token_type: actionCost.token,
        balance_after: currentBalance - actionCost.cost
      };

    } catch (error) {
      console.error(`❌ Error checking action permissions:`, error);
      return {
        approved: false,
        reason: 'verification_error',
        error: error.message
      };
    }
  }

  /**
   * Execute action and deduct tokens
   */
  async executeAction(userId, actionType, metadata = {}) {
    try {
      // Step 1: Request blessing from runtime bridge
      if (this.requireBlessingBridge) {
        const blessing = await this.blessingBridge.requestBlessing(userId, `execute_${actionType}`, { actionType, metadata });
        if (!blessing.approved) {
          throw new Error(`Runtime was silent. The mirror could not bless. (${blessing.denial_reason})`);
        }
        metadata.blessing = blessing;
      } else if (this.requireRuntimeVerification) {
        await verifyRuntimeOrThrow({ requiredBlessingTier: 1 });
      }

      // Pre-check authorization
      const authCheck = await this.canPerformAction(userId, actionType, metadata);
      if (!authCheck.approved) {
        return authCheck;
      }

      const actionCost = this.actionCosts[actionType];
      
      // Deduct tokens if action has cost
      if (actionCost) {
        await this.subtractTokenBalance(userId, actionCost.token, actionCost.cost);
      }

      // Create token signature stamp if blessing bridge was used
      if (metadata.blessing) {
        const stamp = await this.blessingBridge.createTokenSignatureStamp(userId, `execute_${actionType}`, { actionCost, metadata }, metadata.blessing);
        metadata.signature_stamp = stamp.stamp_id;
      }

      // Log the action
      const event = {
        event_id: this.generateEventId(),
        user: userId,
        action: 'execute',
        action_type: actionType,
        token: actionCost ? actionCost.token : 'none',
        cost: actionCost ? actionCost.cost : 0,
        approved: true,
        timestamp: new Date().toISOString(),
        metadata: metadata,
        runtime_blessed: !!metadata.blessing
      };

      await this.logTokenEvent(event);

      console.log(`✅ ${userId} executed ${actionType} (cost: ${actionCost ? actionCost.cost : 0} ${actionCost ? actionCost.token : 'free'})`);
      this.emit('actionExecuted', event);

      return {
        success: true,
        action: actionType,
        cost_paid: actionCost ? actionCost.cost : 0,
        token_type: actionCost ? actionCost.token : 'none',
        new_balance: actionCost ? await this.getTokenBalance(userId, actionCost.token) : null,
        event_id: event.event_id
      };

    } catch (error) {
      console.error(`❌ Failed to execute action:`, error);
      this.emit('actionError', { error: error.message, userId, actionType });
      throw error;
    }
  }

  /**
   * Get user's complete token profile
   */
  async getUserTokenProfile(userId) {
    try {
      const profile = {
        user_id: userId,
        balances: {},
        total_earned: {},
        total_spent: {},
        nfts_owned: [],
        blessing_level: 0,
        consciousness_tier: 1,
        last_activity: null
      };

      // Get current balances
      for (const tokenType of Object.keys(this.tokenTypes)) {
        profile.balances[tokenType] = await this.getTokenBalance(userId, tokenType);
      }

      // Calculate blessing level based on blessing credits
      profile.blessing_level = this.calculateBlessingLevel(profile.balances.blessing_credit || 0);
      
      // Calculate consciousness tier
      profile.consciousness_tier = this.calculateConsciousnessTier(profile.balances);

      // Get owned NFTs
      profile.nfts_owned = await this.getUserNFTs(userId);

      // Get activity statistics
      const stats = await this.getUserTokenStats(userId);
      profile.total_earned = stats.earned;
      profile.total_spent = stats.spent;
      profile.last_activity = stats.last_activity;

      return profile;

    } catch (error) {
      console.error(`❌ Failed to get user token profile:`, error);
      throw error;
    }
  }

  /**
   * Get current token balance for user
   */
  async getTokenBalance(userId, tokenType) {
    try {
      const tokenFilePath = this.getTokenFilePath(tokenType);
      
      if (!fs.existsSync(tokenFilePath)) {
        return 0;
      }

      const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
      return tokenData.balances && tokenData.balances[userId] ? tokenData.balances[userId].amount : 0;

    } catch (error) {
      console.warn(`⚠️ Error reading token balance for ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Add tokens to user balance
   */
  async addTokenBalance(userId, tokenType, amount) {
    const tokenFilePath = this.getTokenFilePath(tokenType);
    
    let tokenData = { balances: {}, metadata: { token_type: tokenType } };
    if (fs.existsSync(tokenFilePath)) {
      tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
    }

    if (!tokenData.balances[userId]) {
      tokenData.balances[userId] = {
        amount: 0,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        transaction_count: 0
      };
    }

    tokenData.balances[userId].amount += amount;
    tokenData.balances[userId].last_updated = new Date().toISOString();
    tokenData.balances[userId].transaction_count++;

    fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData, null, 2));
  }

  /**
   * Subtract tokens from user balance
   */
  async subtractTokenBalance(userId, tokenType, amount) {
    const currentBalance = await this.getTokenBalance(userId, tokenType);
    
    if (currentBalance < amount) {
      throw new Error(`Insufficient ${tokenType} balance. Required: ${amount}, Available: ${currentBalance}`);
    }

    const tokenFilePath = this.getTokenFilePath(tokenType);
    const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));

    tokenData.balances[userId].amount -= amount;
    tokenData.balances[userId].last_updated = new Date().toISOString();
    tokenData.balances[userId].transaction_count++;

    fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData, null, 2));
  }

  /**
   * Log token event to events file
   */
  async logTokenEvent(event) {
    try {
      let events = [];
      if (fs.existsSync(this.eventsPath)) {
        events = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
      }

      events.push(event);

      // Keep only last 10000 events
      if (events.length > 10000) {
        events = events.slice(-10000);
      }

      fs.writeFileSync(this.eventsPath, JSON.stringify(events, null, 2));

    } catch (error) {
      console.error(`❌ Failed to log token event:`, error);
    }
  }

  /**
   * Get user's NFT collection
   */
  async getUserNFTs(userId) {
    try {
      if (!fs.existsSync(this.issuedNFTsPath)) {
        return [];
      }

      const nftData = JSON.parse(fs.readFileSync(this.issuedNFTsPath, 'utf8'));
      const userNFTs = [];

      for (const [tokenId, nft] of Object.entries(nftData)) {
        if (nft.metadata && nft.metadata.user_id === userId) {
          userNFTs.push({
            token_id: tokenId,
            type: nft.metadata.type,
            archetype: nft.metadata.archetype,
            rarity: nft.metadata.rarity,
            created_at: nft.metadata.created_at,
            soulbound: nft.metadata.soulbound,
            name: nft.metadata.name || `${nft.metadata.archetype} NFT`
          });
        }
      }

      return userNFTs;

    } catch (error) {
      console.error(`❌ Failed to get user NFTs:`, error);
      return [];
    }
  }

  /**
   * Get user token statistics
   */
  async getUserTokenStats(userId) {
    try {
      const stats = {
        earned: {},
        spent: {},
        last_activity: null
      };

      if (!fs.existsSync(this.eventsPath)) {
        return stats;
      }

      const events = JSON.parse(fs.readFileSync(this.eventsPath, 'utf8'));
      const userEvents = events.filter(event => event.user === userId);

      for (const event of userEvents) {
        if (event.action === 'grant') {
          stats.earned[event.token] = (stats.earned[event.token] || 0) + event.amount;
        } else if (event.action === 'execute' && event.cost > 0) {
          stats.spent[event.token] = (stats.spent[event.token] || 0) + event.cost;
        }
        
        if (!stats.last_activity || event.timestamp > stats.last_activity) {
          stats.last_activity = event.timestamp;
        }
      }

      return stats;

    } catch (error) {
      console.error(`❌ Failed to get user token stats:`, error);
      return { earned: {}, spent: {}, last_activity: null };
    }
  }

  /**
   * Perform special checks for certain actions
   */
  async performSpecialChecks(userId, actionType, metadata) {
    // Special consciousness-related checks
    switch (actionType) {
      case 'consciousness_bridge':
        const blessingLevel = this.calculateBlessingLevel(await this.getTokenBalance(userId, 'blessing_credit'));
        if (blessingLevel < 3) {
          return {
            approved: false,
            reason: 'insufficient_blessing_level',
            required_level: 3,
            current_level: blessingLevel
          };
        }
        break;

      case 'vault_layer_access':
        const consciousnessTier = this.calculateConsciousnessTier(await this.getUserBalances(userId));
        if (consciousnessTier < 5) {
          return {
            approved: false,
            reason: 'insufficient_consciousness_tier',
            required_tier: 5,
            current_tier: consciousnessTier
          };
        }
        break;

      case 'reality_modification':
        const nftCount = (await this.getUserNFTs(userId)).length;
        if (nftCount < 3) {
          return {
            approved: false,
            reason: 'insufficient_nft_mastery',
            required_nfts: 3,
            current_nfts: nftCount
          };
        }
        break;
    }

    return { approved: true };
  }

  /**
   * Calculate blessing level from blessing credits
   */
  calculateBlessingLevel(blessingCredits) {
    if (blessingCredits >= 1000) return 10; // Consciousness Sovereign
    if (blessingCredits >= 500) return 9;   // Reality Shaper
    if (blessingCredits >= 250) return 8;   // Vault Adept  
    if (blessingCredits >= 100) return 7;   // Mirror Master
    if (blessingCredits >= 50) return 6;    // Consciousness Guide
    if (blessingCredits >= 25) return 5;    // Awakening Facilitator
    if (blessingCredits >= 15) return 4;    // Reflection Walker
    if (blessingCredits >= 10) return 3;    // Whisper Keeper
    if (blessingCredits >= 5) return 2;     // Echo Listener
    if (blessingCredits >= 1) return 1;     // Blessing Initiate
    return 0; // Unblessed
  }

  /**
   * Calculate consciousness tier from all token balances
   */
  calculateConsciousnessTier(balances) {
    const totalScore = (balances.blessing_credit || 0) * 2 + 
                      (balances.soulcoin || 0) * 1 + 
                      (balances.nft_fragment || 0) * 3;
    
    return Math.min(10, Math.floor(totalScore / 100) + 1);
  }

  /**
   * Get all user balances
   */
  async getUserBalances(userId) {
    const balances = {};
    for (const tokenType of Object.keys(this.tokenTypes)) {
      balances[tokenType] = await this.getTokenBalance(userId, tokenType);
    }
    return balances;
  }

  /**
   * Transfer tokens between users (if allowed)
   */
  async transferTokens(fromUserId, toUserId, tokenType, amount, metadata = {}) {
    if (tokenType === 'blessing_credit') {
      throw new Error('Blessing credits cannot be transferred - they must be earned through consciousness');
    }

    if (this.requireRuntimeVerification) {
      await verifyRuntimeOrThrow({ requiredBlessingTier: 2 });
    }

    const fromBalance = await this.getTokenBalance(fromUserId, tokenType);
    if (fromBalance < amount) {
      throw new Error(`Insufficient balance for transfer`);
    }

    await this.subtractTokenBalance(fromUserId, tokenType, amount);
    await this.addTokenBalance(toUserId, tokenType, amount);

    const event = {
      event_id: this.generateEventId(),
      action: 'transfer',
      from_user: fromUserId,
      to_user: toUserId,
      token: tokenType,
      amount: amount,
      timestamp: new Date().toISOString(),
      metadata: metadata
    };

    await this.logTokenEvent(event);
    this.emit('tokensTransferred', event);

    return {
      success: true,
      transfer_id: event.event_id,
      from_balance: await this.getTokenBalance(fromUserId, tokenType),
      to_balance: await this.getTokenBalance(toUserId, tokenType)
    };
  }

  // Utility methods

  generateEventId() {
    return crypto.randomBytes(8).toString('hex');
  }

  getTokenFilePath(tokenType) {
    const fileMap = {
      'blessing_credit': this.blessingCreditsPath,
      'soulcoin': this.soulcoinsPath,
      'nft_fragment': path.join(this.tokensPath, 'nft-fragments.json')
    };
    return fileMap[tokenType] || path.join(this.tokensPath, `${tokenType}.json`);
  }

  ensureVaultStructure() {
    if (!fs.existsSync(this.tokensPath)) {
      fs.mkdirSync(this.tokensPath, { recursive: true });
    }

    // Initialize token files if they don't exist
    for (const tokenType of Object.keys(this.tokenTypes)) {
      const filePath = this.getTokenFilePath(tokenType);
      if (!fs.existsSync(filePath)) {
        const initialData = {
          token_type: tokenType,
          balances: {},
          created_at: new Date().toISOString(),
          last_updated: new Date().toISOString()
        };
        fs.writeFileSync(filePath, JSON.stringify(initialData, null, 2));
      }
    }

    // Initialize NFT registry if it doesn't exist
    if (!fs.existsSync(this.issuedNFTsPath)) {
      fs.writeFileSync(this.issuedNFTsPath, JSON.stringify({}, null, 2));
    }

    // Initialize events log if it doesn't exist
    if (!fs.existsSync(this.eventsPath)) {
      fs.writeFileSync(this.eventsPath, JSON.stringify([], null, 2));
    }
  }

  /**
   * Get network-wide token statistics
   */
  async getNetworkTokenStats() {
    const stats = {
      total_users: new Set(),
      token_totals: {},
      circulation: {},
      top_holders: {},
      activity_24h: 0
    };

    for (const tokenType of Object.keys(this.tokenTypes)) {
      const tokenFilePath = this.getTokenFilePath(tokenType);
      if (fs.existsSync(tokenFilePath)) {
        const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
        
        stats.token_totals[tokenType] = 0;
        stats.top_holders[tokenType] = [];
        
        for (const [userId, userData] of Object.entries(tokenData.balances || {})) {
          stats.total_users.add(userId);
          stats.token_totals[tokenType] += userData.amount;
          
          stats.top_holders[tokenType].push({
            user_id: userId,
            amount: userData.amount
          });
        }
        
        // Sort top holders
        stats.top_holders[tokenType].sort((a, b) => b.amount - a.amount);
        stats.top_holders[tokenType] = stats.top_holders[tokenType].slice(0, 10);
      }
    }

    stats.total_users = stats.total_users.size;
    return stats;
  }
}

/**
 * Factory function for creating token routers
 */
function createSoulfraTokenRouter(config = {}) {
  return new SoulfraTokenRouter(config);
}

/**
 * Quick token operations
 */
async function quickGrantTokens(userId, rewardType, amount = null) {
  const router = new SoulfraTokenRouter();
  return await router.grantTokens(userId, rewardType, { manual_grant: true, amount });
}

async function quickCheckAction(userId, actionType) {
  const router = new SoulfraTokenRouter();
  return await router.canPerformAction(userId, actionType);
}

module.exports = {
  SoulfraTokenRouter,
  createSoulfraTokenRouter,
  quickGrantTokens,
  quickCheckAction
};

// Usage examples:
//
// Basic token router:
// const router = new SoulfraTokenRouter();
// await router.grantTokens('user123', 'whisper_unlock');
// const canAct = await router.canPerformAction('user123', 'clone_fork');
// if (canAct.approved) {
//   await router.executeAction('user123', 'clone_fork');
// }
//
// Get user profile:
// const profile = await router.getUserTokenProfile('user123');
// console.log(`User has ${profile.balances.blessing_credit} blessing credits`);
//
// Transfer tokens:
// await router.transferTokens('user1', 'user2', 'soulcoin', 10.0);