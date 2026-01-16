#!/usr/bin/env node
/**
 * Token Economy
 *
 * Internal currency system for drop deployments and bounties
 *
 * Features:
 * - User wallets with balances
 * - Transaction history
 * - Token costs for actions
 * - Token rewards for contributions
 *
 * Pricing:
 * - Deploy website: 10 tokens
 * - Screenshot analysis: 5 tokens
 * - Domain mapping: 20 tokens
 *
 * Earn:
 * - Fix bug bounty: 50 tokens
 * - Code review: 10 tokens
 * - Friend upvote: 2 tokens
 *
 * Usage:
 *   const TokenEconomy = require('./token-economy');
 *   const economy = new TokenEconomy();
 *
 *   economy.createWallet('user@example.com');
 *   economy.charge('user@example.com', 10, 'Deploy website');
 *   economy.reward('user@example.com', 50, 'Fix bug bounty');
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TokenEconomy {
  constructor(options = {}) {
    this.dataPath = path.join(__dirname, '../data');
    this.walletsPath = path.join(this.dataPath, 'wallets.json');
    this.transactionsPath = path.join(this.dataPath, 'transactions.json');

    // Starting balance for new users
    this.startingBalance = options.startingBalance || 100;

    // Pricing
    this.pricing = {
      deploy: 10,
      analyze: 5,
      domain: 20,
      upvote: 1
    };

    // Rewards
    this.rewards = {
      bounty: 50,
      review: 10,
      upvoteReceive: 2,
      referral: 50,
      weeklyBonus: 25
    };

    // Load data
    this.wallets = this.loadWallets();
    this.transactions = this.loadTransactions();

    this.initialize();

    console.log('💰 TokenEconomy initialized');
  }

  /**
   * Initialize data files
   */
  initialize() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }

    if (!fs.existsSync(this.walletsPath)) {
      this.saveWallets();
    }

    if (!fs.existsSync(this.transactionsPath)) {
      this.saveTransactions();
    }
  }

  /**
   * Load wallets from file
   */
  loadWallets() {
    try {
      if (fs.existsSync(this.walletsPath)) {
        const data = fs.readFileSync(this.walletsPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️ Could not load wallets:', error.message);
    }

    return {};
  }

  /**
   * Save wallets to file
   */
  saveWallets() {
    try {
      fs.writeFileSync(
        this.walletsPath,
        JSON.stringify(this.wallets, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('❌ Failed to save wallets:', error.message);
    }
  }

  /**
   * Load transactions from file
   */
  loadTransactions() {
    try {
      if (fs.existsSync(this.transactionsPath)) {
        const data = fs.readFileSync(this.transactionsPath, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️ Could not load transactions:', error.message);
    }

    return [];
  }

  /**
   * Save transactions to file
   */
  saveTransactions() {
    try {
      fs.writeFileSync(
        this.transactionsPath,
        JSON.stringify(this.transactions, null, 2),
        'utf8'
      );
    } catch (error) {
      console.error('❌ Failed to save transactions:', error.message);
    }
  }

  /**
   * Create new wallet for user
   */
  createWallet(userId, options = {}) {
    if (this.wallets[userId]) {
      console.log(`⚠️ Wallet already exists for ${userId}`);
      return this.wallets[userId];
    }

    const wallet = {
      id: userId,
      balance: options.startingBalance || this.startingBalance,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      totalEarned: 0,
      totalSpent: 0,
      metadata: options.metadata || {}
    };

    this.wallets[userId] = wallet;
    this.saveWallets();

    console.log(`✅ Created wallet for ${userId} with ${wallet.balance} tokens`);

    // Record initial balance as transaction
    this.recordTransaction({
      userId,
      type: 'grant',
      amount: wallet.balance,
      description: 'Welcome bonus',
      balanceAfter: wallet.balance
    });

    return wallet;
  }

  /**
   * Get wallet info
   */
  getWallet(userId) {
    if (!this.wallets[userId]) {
      // Auto-create wallet for new users
      return this.createWallet(userId);
    }

    return this.wallets[userId];
  }

  /**
   * Get balance
   */
  getBalance(userId) {
    const wallet = this.getWallet(userId);
    return wallet.balance;
  }

  /**
   * Check if user has enough tokens
   */
  hasBalance(userId, amount) {
    const balance = this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Charge tokens (for actions like deploy)
   */
  charge(userId, amount, description = 'Charge') {
    const wallet = this.getWallet(userId);

    if (wallet.balance < amount) {
      throw new Error(`Insufficient tokens: need ${amount}, have ${wallet.balance}`);
    }

    wallet.balance -= amount;
    wallet.totalSpent += amount;
    wallet.lastActivity = new Date().toISOString();

    this.saveWallets();

    // Record transaction
    this.recordTransaction({
      userId,
      type: 'charge',
      amount: -amount,
      description,
      balanceAfter: wallet.balance
    });

    console.log(`💸 Charged ${userId}: -${amount} tokens (${description})`);

    return wallet;
  }

  /**
   * Reward tokens (for actions like fixing bugs)
   */
  reward(userId, amount, description = 'Reward') {
    const wallet = this.getWallet(userId);

    wallet.balance += amount;
    wallet.totalEarned += amount;
    wallet.lastActivity = new Date().toISOString();

    this.saveWallets();

    // Record transaction
    this.recordTransaction({
      userId,
      type: 'reward',
      amount: amount,
      description,
      balanceAfter: wallet.balance
    });

    console.log(`💰 Rewarded ${userId}: +${amount} tokens (${description})`);

    return wallet;
  }

  /**
   * Transfer tokens between users
   */
  transfer(fromUserId, toUserId, amount, description = 'Transfer') {
    const fromWallet = this.getWallet(fromUserId);
    const toWallet = this.getWallet(toUserId);

    if (fromWallet.balance < amount) {
      throw new Error(`Insufficient tokens for transfer: need ${amount}, have ${fromWallet.balance}`);
    }

    fromWallet.balance -= amount;
    toWallet.balance += amount;

    fromWallet.totalSpent += amount;
    toWallet.totalEarned += amount;

    fromWallet.lastActivity = new Date().toISOString();
    toWallet.lastActivity = new Date().toISOString();

    this.saveWallets();

    // Record transactions for both users
    this.recordTransaction({
      userId: fromUserId,
      type: 'transfer_out',
      amount: -amount,
      description: `Transfer to ${toUserId}: ${description}`,
      balanceAfter: fromWallet.balance,
      relatedUser: toUserId
    });

    this.recordTransaction({
      userId: toUserId,
      type: 'transfer_in',
      amount: amount,
      description: `Transfer from ${fromUserId}: ${description}`,
      balanceAfter: toWallet.balance,
      relatedUser: fromUserId
    });

    console.log(`🔄 Transfer: ${fromUserId} → ${toUserId}: ${amount} tokens`);

    return { fromWallet, toWallet };
  }

  /**
   * Record transaction
   */
  recordTransaction(transaction) {
    const tx = {
      id: this.generateTransactionId(),
      timestamp: new Date().toISOString(),
      ...transaction
    };

    this.transactions.push(tx);
    this.saveTransactions();

    return tx;
  }

  /**
   * Generate transaction ID
   */
  generateTransactionId() {
    return `tx_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Get transaction history for user
   */
  getTransactions(userId, limit = 50) {
    return this.transactions
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get all wallets
   */
  getAllWallets() {
    return Object.values(this.wallets);
  }

  /**
   * Get economy stats
   */
  getStats() {
    const wallets = this.getAllWallets();

    const totalSupply = wallets.reduce((sum, w) => sum + w.balance, 0);
    const totalEarned = wallets.reduce((sum, w) => sum + w.totalEarned, 0);
    const totalSpent = wallets.reduce((sum, w) => sum + w.totalSpent, 0);

    return {
      totalUsers: wallets.length,
      totalSupply,
      totalEarned,
      totalSpent,
      totalTransactions: this.transactions.length,
      averageBalance: wallets.length > 0 ? totalSupply / wallets.length : 0
    };
  }

  /**
   * Quick action helpers
   */
  chargeDeploy(userId) {
    return this.charge(userId, this.pricing.deploy, 'Deploy website');
  }

  chargeAnalyze(userId) {
    return this.charge(userId, this.pricing.analyze, 'Code analysis');
  }

  chargeDomain(userId) {
    return this.charge(userId, this.pricing.domain, 'Custom domain');
  }

  chargeUpvote(userId) {
    return this.charge(userId, this.pricing.upvote, 'Upvote');
  }

  rewardBounty(userId, amount = null) {
    return this.reward(userId, amount || this.rewards.bounty, 'Bug bounty');
  }

  rewardReview(userId) {
    return this.reward(userId, this.rewards.review, 'Code review');
  }

  rewardUpvote(userId) {
    return this.reward(userId, this.rewards.upvoteReceive, 'Received upvote');
  }

  rewardReferral(userId) {
    return this.reward(userId, this.rewards.referral, 'Referral bonus');
  }

  rewardWeeklyBonus(userId) {
    return this.reward(userId, this.rewards.weeklyBonus, 'Weekly active bonus');
  }
}

// CLI Mode
if (require.main === module) {
  const economy = new TokenEconomy();

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       💰 Token Economy - Wallet Management                ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const stats = economy.getStats();
  console.log('📊 Economy Stats:');
  console.log(`   Total Users: ${stats.totalUsers}`);
  console.log(`   Total Supply: ${stats.totalSupply} tokens`);
  console.log(`   Average Balance: ${stats.averageBalance.toFixed(2)} tokens`);
  console.log(`   Total Transactions: ${stats.totalTransactions}`);

  // Create test wallet if none exist
  if (stats.totalUsers === 0) {
    console.log('\n🆕 Creating test wallet...');
    economy.createWallet('test@example.com');
    console.log('✅ Test wallet created');
  }
}

module.exports = TokenEconomy;
