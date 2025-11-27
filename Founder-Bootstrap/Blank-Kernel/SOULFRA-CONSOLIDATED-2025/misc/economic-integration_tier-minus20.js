/**
 * Economic Integration Layer
 * Connects Soulfra Meta-Network with blockchain-based economic system
 */

const { ethers } = require('ethers');
const { SoulfraNNetwork } = require('./soulfra_network_core');

class SoulfraNeconomicNetwork extends SoulfraNNetwork {
  constructor(config = {}) {
    super();
    
    this.blockchain = {
      provider: null,
      signer: null,
      soulToken: null,
      networkId: config.networkId || 1, // Ethereum mainnet
      contractAddress: config.contractAddress || null
    };
    
    this.economicMetrics = {
      totalValueCreated: 0,
      totalCollaborations: 0,
      dailyTransactions: 0,
      networkTVL: 0 // Total Value Locked
    };
    
    this.pendingTransactions = new Map();
    this.economicPolicies = new EconomicPolicyEngine();
    
    console.log('💰 Soulfra Economic Network initializing...');
  }

  // Initialize blockchain connection
  async initializeBlockchain(config) {
    try {
      // Connect to blockchain provider
      this.blockchain.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
      
      // Set up signer (for transaction signing)
      this.blockchain.signer = new ethers.Wallet(config.privateKey, this.blockchain.provider);
      
      // Connect to SOUL token contract
      const soulTokenABI = await this.loadContractABI('SOULToken');
      this.blockchain.soulToken = new ethers.Contract(
        config.contractAddress,
        soulTokenABI,
        this.blockchain.signer
      );
      
      console.log('✅ Blockchain connection established');
      console.log(`🔗 SOUL Token: ${config.contractAddress}`);
      
      // Set up event listeners
      this.setupBlockchainListeners();
      
      return true;
    } catch (error) {
      console.error('❌ Blockchain initialization failed:', error);
      return false;
    }
  }

  // Enhanced node registration with economic staking
  async registerNode(nodeConfig) {
    // Call parent registration
    const registration = await super.registerNode(nodeConfig);
    
    if (registration.success && this.blockchain.soulToken) {
      try {
        // Register platform on blockchain with stake
        const stakeAmount = ethers.utils.parseEther(nodeConfig.stakeAmount || "1000");
        
        const tx = await this.blockchain.soulToken.registerPlatform(
          nodeConfig.walletAddress,
          stakeAmount
        );
        
        console.log(`💰 Platform staking transaction: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // Update node with economic data
        const node = this.nodes.get(registration.node_id);
        node.economic_profile = {
          wallet_address: nodeConfig.walletAddress,
          staked_amount: stakeAmount.toString(),
          earnings_total: "0",
          transaction_hash: tx.hash,
          block_number: receipt.blockNumber
        };
        
        console.log(`✅ Economic registration complete for ${registration.node_id}`);
        
      } catch (error) {
        console.error('❌ Economic registration failed:', error);
        // Continue with technical registration even if economic fails
      }
    }
    
    return registration;
  }

  // Enhanced collaboration with economic settlement
  async orchestrateMultiNodeRequest(plan, request) {
    // Call parent orchestration
    const result = await super.orchestrateMultiNodeRequest(plan, request);
    
    if (result.success && this.blockchain.soulToken) {
      // Create economic settlement
      await this.settleCollaborationEconomics(result, plan, request);
    }
    
    return result;
  }

  // Economic settlement for collaborations
  async settleCollaborationEconomics(collaborationResult, plan, request) {
    try {
      const collaborationId = ethers.utils.keccak256(
        ethers.utils.toUtf8Bytes(collaborationResult.collaboration_id)
      );
      
      // Calculate value created based on user satisfaction and complexity
      const valueCreated = this.calculateCollaborationValue(collaborationResult, request);
      
      // Create collaboration on blockchain
      const primaryPlatform = this.getPlatformWalletAddress(plan.execution_order[0]);
      const contributingPlatforms = plan.execution_order.slice(1).map(nodeId => 
        this.getPlatformWalletAddress(nodeId)
      );
      
      console.log(`💰 Creating blockchain collaboration: ${collaborationResult.collaboration_id}`);
      
      const createTx = await this.blockchain.soulToken.createCollaboration(
        collaborationId,
        primaryPlatform,
        contributingPlatforms
      );
      
      await createTx.wait();
      
      // Calculate contribution scores based on performance
      const contributionScores = this.calculateContributionScores(plan, collaborationResult);
      
      // Settle collaboration with value distribution
      const valueInSOUL = ethers.utils.parseEther(valueCreated.toString());
      
      const settleTx = await this.blockchain.soulToken.settleCollaboration(
        collaborationId,
        valueInSOUL,
        contributionScores
      );
      
      console.log(`💰 Settlement transaction: ${settleTx.hash}`);
      const receipt = await settleTx.wait();
      
      // Update economic metrics
      this.updateEconomicMetrics(valueCreated, plan.nodes.length);
      
      // Notify platforms of earnings
      await this.notifyPlatformEarnings(plan, valueCreated, contributionScores);
      
      console.log(`✅ Economic settlement complete: ${valueCreated} SOUL distributed`);
      
    } catch (error) {
      console.error('❌ Economic settlement failed:', error);
      // Store for retry
      this.pendingTransactions.set(collaborationResult.collaboration_id, {
        plan,
        request,
        result: collaborationResult,
        timestamp: Date.now()
      });
    }
  }

  // Calculate value created by collaboration
  calculateCollaborationValue(result, request) {
    const baseValue = 100; // Base SOUL for any collaboration
    
    // Multipliers based on various factors
    let multiplier = 1.0;
    
    // Network effect bonus (more platforms = more value)
    multiplier += (result.participating_nodes.length - 1) * 0.5;
    
    // Complexity bonus based on query type
    if (request.context && request.context.query) {
      const complexity = this.analyzeQueryComplexity(request.context.query);
      multiplier += complexity * 0.3;
    }
    
    // Performance bonus
    if (result.network_effect_bonus) {
      multiplier += result.network_effect_bonus * 0.2;
    }
    
    // User satisfaction would be integrated here
    // multiplier += userRating * 0.4;
    
    return Math.floor(baseValue * multiplier);
  }

  // Calculate contribution scores for participating platforms
  calculateContributionScores(plan, result) {
    const scores = [];
    
    for (const nodeId of plan.execution_order.slice(1)) { // Skip primary platform
      let score = 50; // Base contribution score
      
      // Adjust based on capability match
      const nodeCapabilities = this.getNodeCapabilities(nodeId, plan.capability_mapping);
      score += nodeCapabilities.length * 10;
      
      // Adjust based on response quality (would be measured in practice)
      score += Math.floor(Math.random() * 30) + 10; // Simulated quality score
      
      scores.push(Math.min(100, score)); // Cap at 100
    }
    
    return scores;
  }

  // Analyze query complexity for value calculation
  analyzeQueryComplexity(query) {
    const complexityIndicators = [
      'strategic', 'analysis', 'market', 'competitive', 'business model',
      'technical', 'architecture', 'implementation', 'integration',
      'financial', 'investment', 'valuation', 'projections'
    ];
    
    const lowerQuery = query.toLowerCase();
    let complexity = 0;
    
    complexityIndicators.forEach(indicator => {
      if (lowerQuery.includes(indicator)) {
        complexity += 0.1;
      }
    });
    
    return Math.min(complexity, 1.0); // Cap at 1.0
  }

  // Get platform wallet address
  getPlatformWalletAddress(nodeId) {
    const node = this.nodes.get(nodeId);
    return node?.economic_profile?.wallet_address || ethers.constants.AddressZero;
  }

  // Update economic metrics
  updateEconomicMetrics(valueCreated, collaborationSize) {
    this.economicMetrics.totalValueCreated += valueCreated;
    this.economicMetrics.totalCollaborations += 1;
    this.economicMetrics.dailyTransactions += collaborationSize;
    
    // Broadcast metrics update
    this.broadcastToNetwork('economic_metrics_updated', this.economicMetrics);
  }

  // Notify platforms of their earnings
  async notifyPlatformEarnings(plan, totalValue, contributionScores) {
    const primaryEarnings = Math.floor(totalValue * 0.7);
    const contributorPool = totalValue - primaryEarnings;
    
    // Notify primary platform
    const primaryNodeId = plan.execution_order[0];
    await this.notifyPlatformEarning(primaryNodeId, primaryEarnings, 'primary');
    
    // Notify contributing platforms
    const totalContributionScore = contributionScores.reduce((sum, score) => sum + score, 0);
    
    for (let i = 0; i < contributionScores.length; i++) {
      const nodeId = plan.execution_order[i + 1];
      const earnings = Math.floor((contributorPool * contributionScores[i]) / totalContributionScore);
      await this.notifyPlatformEarning(nodeId, earnings, 'contributor');
    }
  }

  // Notify individual platform of earnings
  async notifyPlatformEarning(nodeId, earnings, type) {
    const node = this.nodes.get(nodeId);
    if (!node) return;
    
    try {
      await fetch(`${node.network_address}/api/economic/earnings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.generateNetworkToken(nodeId)}`
        },
        body: JSON.stringify({
          earnings: earnings,
          earnings_type: type,
          currency: 'SOUL',
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error(`❌ Failed to notify ${nodeId} of earnings:`, error);
    }
  }

  // Set up blockchain event listeners
  setupBlockchainListeners() {
    if (!this.blockchain.soulToken) return;
    
    // Listen for collaboration settlements
    this.blockchain.soulToken.on('CollaborationSettled', (collaborationId, valueGenerated) => {
      console.log(`🎉 Collaboration settled on-chain: ${valueGenerated.toString()} SOUL`);
    });
    
    // Listen for platform registrations
    this.blockchain.soulToken.on('PlatformRegistered', (platform, stake) => {
      console.log(`🏢 Platform registered with stake: ${ethers.utils.formatEther(stake)} SOUL`);
    });
    
    // Listen for revenue distributions
    this.blockchain.soulToken.on('RevenueDistributed', (collaborationId, recipient, amount) => {
      console.log(`💰 Revenue distributed: ${ethers.utils.formatEther(amount)} SOUL to ${recipient}`);
    });
  }

  // Get economic analytics
  async getEconomicAnalytics() {
    const networkAnalytics = this.generateNetworkAnalytics();
    
    let blockchainMetrics = {};
    
    if (this.blockchain.soulToken) {
      try {
        const [totalValueCreated, totalCollaborations, treasuryBalance, totalSupply, circulatingSupply] = 
          await this.blockchain.soulToken.getNetworkEconomics();
        
        blockchainMetrics = {
          total_value_created_blockchain: ethers.utils.formatEther(totalValueCreated),
          total_collaborations_blockchain: totalCollaborations.toNumber(),
          network_treasury: ethers.utils.formatEther(treasuryBalance),
          total_supply: ethers.utils.formatEther(totalSupply),
          circulating_supply: ethers.utils.formatEther(circulatingSupply)
        };
      } catch (error) {
        console.error('Failed to fetch blockchain metrics:', error);
      }
    }
    
    return {
      ...networkAnalytics,
      economic_metrics: {
        ...this.economicMetrics,
        ...blockchainMetrics
      }
    };
  }

  // Load contract ABI (placeholder - in practice would load from files/IPFS)
  async loadContractABI(contractName) {
    // This would load the actual ABI from deployment artifacts
    // For demo purposes, return a minimal ABI
    return [
      "function registerPlatform(address platform, uint256 stakeAmount) external",
      "function createCollaboration(bytes32 collaborationId, address primaryPlatform, address[] contributingPlatforms) external",
      "function settleCollaboration(bytes32 collaborationId, uint256 valueGenerated, uint256[] contributionScores) external",
      "function getNetworkEconomics() external view returns (uint256, uint256, uint256, uint256, uint256)",
      "event PlatformRegistered(address indexed platform, uint256 stake)",
      "event CollaborationSettled(bytes32 indexed collaborationId, uint256 valueGenerated)",
      "event RevenueDistributed(bytes32 indexed collaborationId, address indexed recipient, uint256 amount)"
    ];
  }

  // Retry failed transactions
  async retryPendingTransactions() {
    const now = Date.now();
    const maxRetryAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [collaborationId, pending] of this.pendingTransactions) {
      if (now - pending.timestamp < maxRetryAge) {
        try {
          await this.settleCollaborationEconomics(pending.result, pending.plan, pending.request);
          this.pendingTransactions.delete(collaborationId);
        } catch (error) {
          console.error(`❌ Retry failed for ${collaborationId}:`, error);
        }
      } else {
        // Remove old pending transactions
        this.pendingTransactions.delete(collaborationId);
      }
    }
  }

  // Economic policy enforcement
  enforceEconomicPolicies() {
    // Implement economic safeguards
    this.economicPolicies.checkInflationRate();
    this.economicPolicies.monitorNetworkHealth();
    this.economicPolicies.adjustIncentives();
  }

  // Start economic background processes
  startEconomicProcesses() {
    // Retry failed transactions every 5 minutes
    setInterval(() => {
      this.retryPendingTransactions();
    }, 5 * 60 * 1000);
    
    // Economic policy checks every 10 minutes
    setInterval(() => {
      this.enforceEconomicPolicies();
    }, 10 * 60 * 1000);
    
    // Economic metrics updates every minute
    setInterval(() => {
      this.broadcastToNetwork('economic_heartbeat', this.economicMetrics);
    }, 60 * 1000);
  }
}

// Economic Policy Engine
class EconomicPolicyEngine {
  constructor() {
    this.policies = {
      maxInflationRate: 0.05, // 5% annual
      minNetworkStake: ethers.utils.parseEther("10000"), // 10K SOUL minimum
      collaborationTimeoutHours: 24
    };
  }

  checkInflationRate() {
    // Monitor token inflation and adjust if necessary
    console.log('📊 Checking inflation rate compliance...');
  }

  monitorNetworkHealth() {
    // Monitor economic health indicators
    console.log('🏥 Monitoring network economic health...');
  }

  adjustIncentives() {
    // Dynamically adjust economic incentives
    console.log('⚖️ Adjusting economic incentives...');
  }
}

// Platform Economic Client Integration
class PlatformEconomicClient {
  constructor(platformNetworkClient) {
    this.networkClient = platformNetworkClient;
    this.walletAddress = null;
    this.earnings = {
      total: 0,
      pending: 0,
      withdrawn: 0
    };
  }

  // Set up economic profile for platform
  async setupEconomicProfile(config) {
    this.walletAddress = config.walletAddress;
    
    // Register economic handlers in existing platform
    this.networkClient.app.post('/api/economic/earnings', (req, res) => {
      this.handleEarningsNotification(req.body);
      res.json({ success: true });
    });
    
    this.networkClient.app.get('/api/economic/profile', (req, res) => {
      res.json({
        wallet_address: this.walletAddress,
        earnings: this.earnings,
        economic_metrics: this.getEconomicMetrics()
      });
    });
  }

  handleEarningsNotification(earningData) {
    console.log(`💰 Earned ${earningData.earnings} ${earningData.currency}`);
    this.earnings.total += earningData.earnings;
    this.earnings.pending += earningData.earnings;
    
    // Notify platform owner
    this.notifyPlatformOwner(earningData);
  }

  getEconomicMetrics() {
    return {
      total_earnings: this.earnings.total,
      pending_earnings: this.earnings.pending,
      withdrawn_earnings: this.earnings.withdrawn,
      performance_score: this.calculatePerformanceScore()
    };
  }

  calculatePerformanceScore() {
    // Calculate based on collaboration success rate, user satisfaction, etc.
    return 0.92; // Simulated 92% performance score
  }

  notifyPlatformOwner(earningData) {
    // Integration point for notifications (email, webhook, etc.)
    console.log(`📧 Notifying platform owner of ${earningData.earnings} SOUL earnings`);
  }
}

module.exports = { 
  SoulfraNeconomicNetwork, 
  EconomicPolicyEngine, 
  PlatformEconomicClient 
};