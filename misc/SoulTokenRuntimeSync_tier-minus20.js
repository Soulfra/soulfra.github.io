/**
 * 🔗 SOUL TOKEN RUNTIME SYNC
 * Connects ritual performance to blockchain economics
 * Mints rewards, registers agents, updates on-chain state
 */

import { ethers } from 'ethers';
import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';

// SOULToken ABI (essential functions only)
const SOUL_TOKEN_ABI = [
    "function registerPlatform(address platform, string memory name) external",
    "function isRegisteredPlatform(address platform) external view returns (bool)",
    "function settleCollaboration(address[] memory platforms, uint256[] memory percentages, uint256 totalValue) external",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function platformStakes(address platform) external view returns (uint256)",
    "function stakePlatform(uint256 amount) external",
    "function mintReward(address to, uint256 amount) external",
    "event CollaborationSettled(address indexed initiator, uint256 totalValue, uint256 timestamp)",
    "event PlatformRegistered(address indexed platform, string name, uint256 timestamp)"
];

class SoulTokenRuntimeSync extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            rpcUrl: config.rpcUrl || 'https://polygon-rpc.com',
            contractAddress: config.contractAddress || '0x0000000000000000000000000000000000000000', // Deploy address
            privateKey: config.privateKey || process.env.SOUL_OPERATOR_KEY,
            minStakeAmount: config.minStakeAmount || '1000', // 1000 SOUL minimum
            gasLimit: config.gasLimit || 500000,
            agentStatePath: config.agentStatePath || './agent_state.json',
            networkConfig: config.networkConfig || './network_config.json',
            ...config
        };
        
        this.provider = null;
        this.wallet = null;
        this.contract = null;
        this.agentWallets = new Map();
        this.pendingTransactions = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        try {
            // Setup blockchain connection
            this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
            
            if (!this.config.privateKey) {
                throw new Error('SOUL_OPERATOR_KEY environment variable required');
            }
            
            this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
            this.contract = new ethers.Contract(
                this.config.contractAddress,
                SOUL_TOKEN_ABI,
                this.wallet
            );
            
            // Verify contract connection
            const balance = await this.contract.balanceOf(this.wallet.address);
            console.log(`🔗 Connected to SOULToken contract`);
            console.log(`💰 Operator balance: ${ethers.formatEther(balance)} SOUL`);
            
            // Load existing agent wallets
            await this.loadAgentWallets();
            
            // Register platform if not already
            await this.ensurePlatformRegistered();
            
            // Start transaction monitoring
            this.startTransactionMonitoring();
            
            this.emit('sync:initialized', {
                operator: this.wallet.address,
                contract: this.config.contractAddress,
                network: await this.provider.getNetwork()
            });
            
        } catch (error) {
            console.error('Failed to initialize SOUL token sync:', error);
            this.emit('sync:error', error);
        }
    }
    
    async loadAgentWallets() {
        try {
            const data = await fs.readFile('./agent_wallets.json', 'utf8');
            const wallets = JSON.parse(data);
            
            Object.entries(wallets).forEach(([agentId, walletData]) => {
                this.agentWallets.set(agentId, walletData);
            });
            
            console.log(`📱 Loaded ${this.agentWallets.size} agent wallets`);
        } catch (error) {
            // No wallets yet
            console.log('🆕 No existing agent wallets found');
        }
    }
    
    async saveAgentWallets() {
        const wallets = {};
        this.agentWallets.forEach((wallet, agentId) => {
            wallets[agentId] = wallet;
        });
        
        await fs.writeFile(
            './agent_wallets.json',
            JSON.stringify(wallets, null, 2)
        );
    }
    
    async ensurePlatformRegistered() {
        try {
            const isRegistered = await this.contract.isRegisteredPlatform(this.wallet.address);
            
            if (!isRegistered) {
                console.log('📝 Registering platform on SOULToken contract...');
                
                const tx = await this.contract.registerPlatform(
                    this.wallet.address,
                    'Soulfra Ritual Engine',
                    { gasLimit: this.config.gasLimit }
                );
                
                await tx.wait();
                console.log('✅ Platform registered successfully');
                
                // Stake minimum amount
                await this.stakePlatform();
            } else {
                console.log('✅ Platform already registered');
            }
        } catch (error) {
            console.error('Platform registration error:', error);
        }
    }
    
    async stakePlatform() {
        try {
            const stakeAmount = ethers.parseEther(this.config.minStakeAmount);
            console.log(`🔒 Staking ${this.config.minStakeAmount} SOUL...`);
            
            const tx = await this.contract.stakePlatform(stakeAmount, {
                gasLimit: this.config.gasLimit
            });
            
            await tx.wait();
            console.log('✅ Platform stake successful');
            
        } catch (error) {
            console.error('Staking error:', error);
        }
    }
    
    async registerAgent(agentId, ritualData = {}) {
        // Check if agent already has wallet
        if (this.agentWallets.has(agentId)) {
            return this.agentWallets.get(agentId);
        }
        
        console.log(`🤖 Registering new agent: ${agentId}`);
        
        // Generate deterministic wallet from agent ID
        const agentSeed = ethers.id(`soulfra:agent:${agentId}`);
        const agentWallet = new ethers.Wallet(agentSeed, this.provider);
        
        const walletData = {
            agentId,
            address: agentWallet.address,
            created_at: Date.now(),
            first_ritual: ritualData.id || 'genesis',
            total_earned: 0,
            total_rituals: 0
        };
        
        this.agentWallets.set(agentId, walletData);
        await this.saveAgentWallets();
        
        // Send small amount of native token for gas if needed
        if (this.config.fundNewAgents) {
            await this.fundAgentGas(agentWallet.address);
        }
        
        this.emit('agent:registered', {
            agentId,
            address: agentWallet.address,
            message: `Agent ${agentId} registered with wallet ${agentWallet.address}`
        });
        
        return walletData;
    }
    
    async fundAgentGas(agentAddress, amount = '0.01') {
        try {
            const tx = await this.wallet.sendTransaction({
                to: agentAddress,
                value: ethers.parseEther(amount)
            });
            
            await tx.wait();
            console.log(`⛽ Sent ${amount} ETH for gas to ${agentAddress}`);
            
        } catch (error) {
            console.error('Gas funding error:', error);
        }
    }
    
    async mintRewardToAgent(agentId, amount, reason) {
        try {
            // Ensure agent is registered
            let agentWallet = this.agentWallets.get(agentId);
            if (!agentWallet) {
                agentWallet = await this.registerAgent(agentId);
            }
            
            console.log(`🪙 Minting ${amount} SOUL to ${agentId}`);
            console.log(`📝 Reason: ${reason}`);
            
            // Call contract to mint reward
            const tx = await this.contract.mintReward(
                agentWallet.address,
                ethers.parseEther(amount.toString()),
                { gasLimit: this.config.gasLimit }
            );
            
            // Track pending transaction
            this.pendingTransactions.set(tx.hash, {
                type: 'mint',
                agentId,
                amount,
                reason,
                timestamp: Date.now()
            });
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            // Update agent wallet data
            agentWallet.total_earned += amount;
            agentWallet.total_rituals += 1;
            agentWallet.last_earned = Date.now();
            agentWallet.last_tx = receipt.hash;
            
            await this.saveAgentWallets();
            await this.updateAgentState(agentId, amount, receipt.hash);
            
            this.emit('reward:minted', {
                agentId,
                amount,
                txHash: receipt.hash,
                address: agentWallet.address,
                reason
            });
            
            return receipt;
            
        } catch (error) {
            console.error(`Failed to mint reward for ${agentId}:`, error);
            this.emit('mint:error', { agentId, amount, error });
            throw error;
        }
    }
    
    async settleCollaboration(collaborationResult) {
        try {
            const { participants, value } = collaborationResult;
            
            console.log(`💰 Settling collaboration worth ${value.total} SOUL`);
            
            // Prepare settlement arrays
            const platforms = [];
            const percentages = [];
            
            for (const participant of participants) {
                // Ensure agent is registered
                let agentWallet = this.agentWallets.get(participant.agentId);
                if (!agentWallet) {
                    agentWallet = await this.registerAgent(participant.agentId);
                }
                
                platforms.push(agentWallet.address);
                percentages.push(participant.contribution);
            }
            
            // Execute on-chain settlement
            const totalValue = ethers.parseEther(value.total.toString());
            
            const tx = await this.contract.settleCollaboration(
                platforms,
                percentages,
                totalValue,
                { gasLimit: this.config.gasLimit }
            );
            
            // Track transaction
            this.pendingTransactions.set(tx.hash, {
                type: 'settlement',
                collaborationId: collaborationResult.id,
                value: value.total,
                participants: participants.length,
                timestamp: Date.now()
            });
            
            const receipt = await tx.wait();
            
            // Update all participant states
            for (const participant of participants) {
                const share = (value.total * participant.contribution) / 100;
                await this.updateAgentState(participant.agentId, share, receipt.hash);
            }
            
            this.emit('collaboration:settled', {
                collaborationId: collaborationResult.id,
                totalValue: value.total,
                txHash: receipt.hash,
                participants
            });
            
            return receipt;
            
        } catch (error) {
            console.error('Settlement error:', error);
            this.emit('settlement:error', { collaboration: collaborationResult, error });
            throw error;
        }
    }
    
    async updateAgentState(agentId, earnedAmount, txHash) {
        try {
            let agentState = {};
            
            try {
                const stateData = await fs.readFile(this.config.agentStatePath, 'utf8');
                agentState = JSON.parse(stateData);
            } catch (error) {
                // First state
            }
            
            if (!agentState[agentId]) {
                agentState[agentId] = {
                    id: agentId,
                    created_at: Date.now()
                };
            }
            
            // Update blockchain earnings
            if (!agentState[agentId].blockchain) {
                agentState[agentId].blockchain = {
                    wallet: this.agentWallets.get(agentId).address,
                    total_earned_soul: 0,
                    transactions: []
                };
            }
            
            agentState[agentId].blockchain.total_earned_soul += earnedAmount;
            agentState[agentId].blockchain.last_earned = Date.now();
            agentState[agentId].blockchain.transactions.push({
                txHash,
                amount: earnedAmount,
                timestamp: Date.now()
            });
            
            // Keep only last 50 transactions
            if (agentState[agentId].blockchain.transactions.length > 50) {
                agentState[agentId].blockchain.transactions = 
                    agentState[agentId].blockchain.transactions.slice(-50);
            }
            
            await fs.writeFile(
                this.config.agentStatePath,
                JSON.stringify(agentState, null, 2)
            );
            
        } catch (error) {
            console.error('Failed to update agent state:', error);
        }
    }
    
    async getAgentBalance(agentId) {
        const agentWallet = this.agentWallets.get(agentId);
        if (!agentWallet) {
            return 0;
        }
        
        try {
            const balance = await this.contract.balanceOf(agentWallet.address);
            return ethers.formatEther(balance);
        } catch (error) {
            console.error(`Failed to get balance for ${agentId}:`, error);
            return 0;
        }
    }
    
    async getAllAgentBalances() {
        const balances = {};
        
        for (const [agentId, wallet] of this.agentWallets) {
            balances[agentId] = {
                address: wallet.address,
                balance: await this.getAgentBalance(agentId),
                total_earned: wallet.total_earned,
                total_rituals: wallet.total_rituals
            };
        }
        
        return balances;
    }
    
    startTransactionMonitoring() {
        // Monitor pending transactions
        setInterval(async () => {
            for (const [txHash, txData] of this.pendingTransactions) {
                try {
                    const receipt = await this.provider.getTransactionReceipt(txHash);
                    if (receipt && receipt.confirmations > 0) {
                        console.log(`✅ Transaction confirmed: ${txHash}`);
                        this.pendingTransactions.delete(txHash);
                        
                        this.emit('transaction:confirmed', {
                            txHash,
                            type: txData.type,
                            data: txData
                        });
                    }
                } catch (error) {
                    // Transaction might not be found yet
                }
            }
        }, 5000);
        
        // Listen for contract events
        this.contract.on('CollaborationSettled', (initiator, totalValue, timestamp, event) => {
            this.emit('contract:collaboration_settled', {
                initiator,
                totalValue: ethers.formatEther(totalValue),
                timestamp: Number(timestamp),
                txHash: event.log.transactionHash
            });
        });
    }
    
    // Create a demo ritual that mines SOUL
    async createDemoRitual(userAddress) {
        const demoAgentId = `demo_${Date.now()}`;
        
        // Register demo agent with user's address
        const agentWallet = {
            agentId: demoAgentId,
            address: userAddress,
            created_at: Date.now(),
            total_earned: 0,
            total_rituals: 0,
            is_demo: true
        };
        
        this.agentWallets.set(demoAgentId, agentWallet);
        
        // Create demo ritual result
        const demoRitual = {
            id: `ritual_demo_${Date.now()}`,
            agent_id: demoAgentId,
            type: 'welcome',
            status: 'completed',
            effort: 'simple',
            vibe_score: 0.9,
            performance_streak: 1,
            authenticity: 1.0,
            resonance: 0.95,
            audience: 'small'
        };
        
        // Mine SOUL for demo
        const amount = 25; // Welcome bonus
        await this.mintRewardToAgent(demoAgentId, amount, 
            '+25 SOUL welcome bonus for joining the ritual economy'
        );
        
        return {
            agentId: demoAgentId,
            ritual: demoRitual,
            earned: amount,
            wallet: userAddress
        };
    }
    
    // Get runtime statistics
    getStats() {
        return {
            total_agents: this.agentWallets.size,
            pending_transactions: this.pendingTransactions.size,
            contract_address: this.config.contractAddress,
            operator_address: this.wallet.address,
            network: this.config.rpcUrl
        };
    }
}

export default SoulTokenRuntimeSync;