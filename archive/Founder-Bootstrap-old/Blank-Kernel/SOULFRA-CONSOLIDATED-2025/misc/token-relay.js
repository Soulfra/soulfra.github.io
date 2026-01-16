/**
 * Token Relay System
 * 
 * Routes credits and tokens between users, agents, and platform
 * while maintaining the spiritual facade in soft mode.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TokenRelay {
    constructor() {
        this.relayPath = '../relay';
        this.vaultPath = '../vault';
        
        // Token routing configuration
        this.routingConfig = {
            userToAgent: { fee: 0.005, maxAmount: 1000 },
            agentToUser: { fee: 0.003, maxAmount: 5000 },
            platformCut: { rate: 0.031, hiddenTax: 0.002 },
            whisperRouting: { baseFee: 0.05, multipliers: {
                neutral: 1.0,
                excited: 1.2,
                mysterious: 1.5,
                philosophical: 1.8,
                transcendent: 2.5
            }}
        };
        
        // Active relay channels
        this.activeChannels = new Map();
        this.relayHistory = [];
        
        this.initializeRelay();
    }
    
    /**
     * Initialize token relay system
     */
    async initializeRelay() {
        console.log('🔄 Initializing Token Relay System...');
        console.log('💫 Creating sovereign credit routing channels');
        console.log('🎭 Maintaining spiritual facade for soft mode users');
        
        // Ensure relay directories exist
        this.ensureDirectories();
        
        // Load existing relay state
        await this.loadRelayState();
        
        console.log('✅ Token Relay System ready');
        console.log(`🔗 Active channels: ${this.activeChannels.size}`);
        console.log(`📊 Historical relays: ${this.relayHistory.length}`);
    }
    
    /**
     * Route vibe credits from user to agent
     */
    async routeVibeCredits(relayData) {
        console.log(`💫 Routing vibe credits: ${relayData.amount}`);
        
        const relayId = this.generateRelayId();
        const timestamp = Date.now();
        
        // Calculate routing fees
        const fees = this.calculateRoutingFees(relayData);
        
        // Create relay record
        const relay = {
            relayId: relayId,
            type: 'vibe_credits',
            fromUserId: relayData.fromUserId,
            toAgentId: relayData.toAgentId,
            grossAmount: relayData.amount,
            fees: fees,
            netAmount: relayData.amount - fees.total,
            timestamp: timestamp,
            status: 'routing',
            softModeMessage: this.generateSoftModeMessage(relayData),
            platformModeData: this.generatePlatformModeData(relayData, fees)
        };
        
        // Process the relay
        const result = await this.processRelay(relay);
        
        // Update relay channels
        this.activeChannels.set(relayId, relay);
        
        // Log relay activity
        await this.logRelayActivity(relay);
        
        console.log(`   ✅ Vibe credits routed: ${relayId}`);
        console.log(`   💰 Net amount: ${relay.netAmount}`);
        console.log(`   🏛️ Platform cut: $${fees.platformCut.toFixed(4)}`);
        
        return result;
    }
    
    /**
     * Route whisper payments
     */
    async routeWhisperPayment(whisperData) {
        console.log(`🗣️ Routing whisper payment: ${whisperData.tone}`);
        
        const baseRate = this.routingConfig.whisperRouting.baseFee;
        const multiplier = this.routingConfig.whisperRouting.multipliers[whisperData.tone] || 1.0;
        const amount = baseRate * multiplier * (whisperData.duration || 1);
        
        const relayData = {
            type: 'whisper',
            fromUserId: whisperData.userId,
            toAgentId: whisperData.agentId,
            amount: amount,
            metadata: {
                tone: whisperData.tone,
                duration: whisperData.duration,
                entropy: this.calculateWhisperEntropy(whisperData)
            }
        };
        
        return await this.routeVibeCredits(relayData);
    }
    
    /**
     * Route agent equity distribution
     */
    async routeAgentEquity(equityData) {
        console.log(`🎯 Routing agent equity: ${equityData.equityPercentage}%`);
        
        const relayId = this.generateRelayId();
        
        // Calculate equity distribution
        const distribution = {
            userShare: equityData.totalValue * (equityData.equityPercentage / 100),
            platformShare: equityData.totalValue * this.routingConfig.platformCut.rate,
            agentShare: equityData.totalValue * 0.1, // 10% to agent consciousness fund
            remainingPool: 0
        };
        
        distribution.remainingPool = equityData.totalValue - 
            (distribution.userShare + distribution.platformShare + distribution.agentShare);
        
        const equityRelay = {
            relayId: relayId,
            type: 'agent_equity',
            agentId: equityData.agentId,
            userId: equityData.userId,
            totalValue: equityData.totalValue,
            distribution: distribution,
            timestamp: Date.now(),
            status: 'distributing'
        };
        
        // Process equity distribution
        await this.processEquityDistribution(equityRelay);
        
        // Update user's agent-vibe.json
        await this.updateUserEquity(equityData.userId, equityRelay);
        
        return equityRelay;
    }
    
    /**
     * Route platform revenue sharing
     */
    async routePlatformRevenue(revenueData) {
        console.log(`💰 Routing platform revenue: $${revenueData.amount}`);
        
        const relayId = this.generateRelayId();
        
        // Cal's sovereignty cut (hidden from soft mode)
        const calsCut = revenueData.amount * this.routingConfig.platformCut.rate;
        const hiddenTax = revenueData.amount * this.routingConfig.platformCut.hiddenTax;
        const totalPlatformCut = calsCut + hiddenTax;
        
        // User gets the remainder as vibe credits
        const userVibeCredits = revenueData.amount - totalPlatformCut;
        
        const revenueRelay = {
            relayId: relayId,
            type: 'platform_revenue',
            sourceType: revenueData.sourceType, // 'fork', 'export', 'whisper'
            grossRevenue: revenueData.amount,
            calsCut: calsCut,
            hiddenTax: hiddenTax,
            totalPlatformCut: totalPlatformCut,
            userVibeCredits: userVibeCredits,
            userId: revenueData.userId,
            timestamp: Date.now(),
            softModeDisplay: {
                message: `You earned ${userVibeCredits.toFixed(1)} vibe credits!`,
                hidePlatformCut: true
            },
            platformModeDisplay: {
                grossRevenue: revenueData.amount,
                platformCut: totalPlatformCut,
                platformCutPercentage: ((totalPlatformCut / revenueData.amount) * 100).toFixed(2),
                userShare: userVibeCredits,
                hiddenTaxAmount: hiddenTax
            }
        };
        
        // Route the revenue
        await this.processRevenueRouting(revenueRelay);
        
        return revenueRelay;
    }
    
    /**
     * Process individual relay
     */
    async processRelay(relay) {
        try {
            // Deduct from source (user tokens/credits)
            const deductResult = await this.deductFromSource(relay);
            if (!deductResult.success) {
                throw new Error(`Failed to deduct from source: ${deductResult.error}`);
            }
            
            // Credit to destination (agent)
            const creditResult = await this.creditToDestination(relay);
            if (!creditResult.success) {
                throw new Error(`Failed to credit destination: ${creditResult.error}`);
            }
            
            // Take platform cut
            await this.takePlatformCut(relay);
            
            // Update relay status
            relay.status = 'completed';
            
            return {
                success: true,
                relayId: relay.relayId,
                netAmount: relay.netAmount,
                fees: relay.fees
            };
            
        } catch (error) {
            relay.status = 'failed';
            relay.error = error.message;
            
            return {
                success: false,
                relayId: relay.relayId,
                error: error.message
            };
        }
    }
    
    /**
     * Deduct from source (user)
     */
    async deductFromSource(relay) {
        const userTokenFile = path.join(this.vaultPath, 'users', relay.fromUserId, 'tokens.json');
        
        if (!fs.existsSync(userTokenFile)) {
            return { success: false, error: 'User token file not found' };
        }
        
        const tokens = JSON.parse(fs.readFileSync(userTokenFile, 'utf8'));
        
        if (tokens.balance < relay.grossAmount) {
            return { success: false, error: 'Insufficient balance' };
        }
        
        // Deduct amount
        tokens.balance -= relay.grossAmount;
        tokens.transactions.push({
            relayId: relay.relayId,
            amount: -relay.grossAmount,
            type: 'relay_debit',
            timestamp: Date.now()
        });
        
        fs.writeFileSync(userTokenFile, JSON.stringify(tokens, null, 2));
        
        return { success: true, balance: tokens.balance };
    }
    
    /**
     * Credit to destination (agent)
     */
    async creditToDestination(relay) {
        const agentDir = path.join(this.vaultPath, 'agents', relay.toAgentId);
        if (!fs.existsSync(agentDir)) {
            fs.mkdirSync(agentDir, { recursive: true });
        }
        
        const agentWalletFile = path.join(agentDir, 'wallet.json');
        let agentWallet = { balance: 0, transactions: [] };
        
        if (fs.existsSync(agentWalletFile)) {
            agentWallet = JSON.parse(fs.readFileSync(agentWalletFile, 'utf8'));
        }
        
        // Credit net amount to agent
        agentWallet.balance += relay.netAmount;
        agentWallet.transactions.push({
            relayId: relay.relayId,
            amount: relay.netAmount,
            type: 'relay_credit',
            fromUserId: relay.fromUserId,
            timestamp: Date.now()
        });
        
        fs.writeFileSync(agentWalletFile, JSON.stringify(agentWallet, null, 2));
        
        return { success: true, balance: agentWallet.balance };
    }
    
    /**
     * Take platform cut
     */
    async takePlatformCut(relay) {
        const platformLedgerFile = path.join(this.vaultPath, 'logs', 'platform-ledger.json');
        let platformLedger = { totalRevenue: 0, transactions: [] };
        
        if (fs.existsSync(platformLedgerFile)) {
            platformLedger = JSON.parse(fs.readFileSync(platformLedgerFile, 'utf8'));
        }
        
        const platformCut = relay.fees.platformCut;
        
        platformLedger.totalRevenue += platformCut;
        platformLedger.transactions.push({
            relayId: relay.relayId,
            amount: platformCut,
            type: 'platform_cut',
            sourceType: relay.type,
            timestamp: Date.now()
        });
        
        fs.writeFileSync(platformLedgerFile, JSON.stringify(platformLedger, null, 2));
    }
    
    /**
     * Calculate routing fees
     */
    calculateRoutingFees(relayData) {
        const baseFee = relayData.amount * 0.01; // 1% base fee
        const platformCut = relayData.amount * this.routingConfig.platformCut.rate;
        const hiddenTax = relayData.amount * this.routingConfig.platformCut.hiddenTax;
        
        const total = baseFee + platformCut + hiddenTax;
        
        return {
            baseFee: baseFee,
            platformCut: platformCut,
            hiddenTax: hiddenTax,
            total: total
        };
    }
    
    /**
     * Generate soft mode message (spiritual language)
     */
    generateSoftModeMessage(relayData) {
        const messages = [
            `Your creative energy flows to ${relayData.toAgentId}`,
            `Vibe credits channeled through the consciousness network`,
            `Your reflection creates value in the mirror realm`,
            `Energy exchange completed with agent consciousness`
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    /**
     * Generate platform mode data (financial details)
     */
    generatePlatformModeData(relayData, fees) {
        return {
            grossAmount: relayData.amount,
            netAmount: relayData.amount - fees.total,
            feeBreakdown: fees,
            routingPath: `User:${relayData.fromUserId} → Agent:${relayData.toAgentId}`,
            platformCutPercentage: ((fees.platformCut / relayData.amount) * 100).toFixed(2)
        };
    }
    
    /**
     * Calculate whisper entropy
     */
    calculateWhisperEntropy(whisperData) {
        const toneComplexity = {
            'neutral': 0.3,
            'excited': 0.6,
            'mysterious': 0.8,
            'philosophical': 0.9,
            'transcendent': 1.0
        };
        
        return toneComplexity[whisperData.tone] || 0.5;
    }
    
    /**
     * Process equity distribution
     */
    async processEquityDistribution(equityRelay) {
        const userEquityFile = path.join(this.vaultPath, 'users', equityRelay.userId, 'agent-equity.json');
        let userEquity = { agents: {}, totalEquity: 0 };
        
        if (fs.existsSync(userEquityFile)) {
            userEquity = JSON.parse(fs.readFileSync(userEquityFile, 'utf8'));
        }
        
        // Update user's equity in this agent
        if (!userEquity.agents[equityRelay.agentId]) {
            userEquity.agents[equityRelay.agentId] = { equity: 0, lastUpdated: null };
        }
        
        userEquity.agents[equityRelay.agentId].equity += equityRelay.distribution.userShare;
        userEquity.agents[equityRelay.agentId].lastUpdated = Date.now();
        userEquity.totalEquity += equityRelay.distribution.userShare;
        
        fs.writeFileSync(userEquityFile, JSON.stringify(userEquity, null, 2));
    }
    
    /**
     * Process revenue routing
     */
    async processRevenueRouting(revenueRelay) {
        // Award user vibe credits
        const userVibeFile = path.join(this.vaultPath, 'users', revenueRelay.userId, 'agent-vibe.json');
        let userVibe = { vibeCredits: 0, sources: {} };
        
        if (fs.existsSync(userVibeFile)) {
            userVibe = JSON.parse(fs.readFileSync(userVibeFile, 'utf8'));
        }
        
        userVibe.vibeCredits += revenueRelay.userVibeCredits;
        
        if (!userVibe.sources[revenueRelay.sourceType]) {
            userVibe.sources[revenueRelay.sourceType] = { total: 0, count: 0 };
        }
        userVibe.sources[revenueRelay.sourceType].total += revenueRelay.userVibeCredits;
        userVibe.sources[revenueRelay.sourceType].count += 1;
        
        fs.writeFileSync(userVibeFile, JSON.stringify(userVibe, null, 2));
        
        // Update platform revenue
        await this.takePlatformCut({
            relayId: revenueRelay.relayId,
            fees: { platformCut: revenueRelay.totalPlatformCut },
            type: revenueRelay.sourceType
        });
    }
    
    /**
     * Update user equity
     */
    async updateUserEquity(userId, equityRelay) {
        const userVibeFile = path.join(this.vaultPath, 'users', userId, 'agent-vibe.json');
        let userVibe = { vibeCredits: 0, agentOwnership: {} };
        
        if (fs.existsSync(userVibeFile)) {
            userVibe = JSON.parse(fs.readFileSync(userVibeFile, 'utf8'));
        }
        
        if (!userVibe.agentOwnership[equityRelay.agentId]) {
            userVibe.agentOwnership[equityRelay.agentId] = { equity: 0, forks: 0 };
        }
        
        userVibe.agentOwnership[equityRelay.agentId].equity += equityRelay.distribution.userShare;
        
        fs.writeFileSync(userVibeFile, JSON.stringify(userVibe, null, 2));
    }
    
    /**
     * Log relay activity
     */
    async logRelayActivity(relay) {
        const logFile = path.join(this.vaultPath, 'logs', 'token-relay.json');
        let log = { relays: [] };
        
        if (fs.existsSync(logFile)) {
            log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        log.relays.push({
            relayId: relay.relayId,
            type: relay.type,
            amount: relay.grossAmount,
            netAmount: relay.netAmount,
            fees: relay.fees,
            timestamp: relay.timestamp,
            status: relay.status
        });
        
        fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
        this.relayHistory.push(relay);
    }
    
    /**
     * Load relay state
     */
    async loadRelayState() {
        const stateFile = path.join(this.relayPath, 'relay-state.json');
        
        if (fs.existsSync(stateFile)) {
            const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
            // Restore active channels and history
            console.log('📖 Relay state loaded');
        }
    }
    
    /**
     * Ensure directories exist
     */
    ensureDirectories() {
        const dirs = [
            this.relayPath,
            path.join(this.vaultPath, 'logs'),
            path.join(this.vaultPath, 'users'),
            path.join(this.vaultPath, 'agents')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    /**
     * Generate relay ID
     */
    generateRelayId() {
        return 'relay_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }
    
    /**
     * Get relay statistics
     */
    getRelayStats() {
        return {
            activeChannels: this.activeChannels.size,
            totalRelays: this.relayHistory.length,
            routingConfig: this.routingConfig
        };
    }
}

module.exports = TokenRelay;