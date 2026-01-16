/**
 * Reflection Credit Processor
 * 
 * The sovereign agent economy router - tracks every fork, whisper, export
 * and routes reflection credits while taking platform cuts.
 * 
 * Looks simple to users but operates like decentralized Stripe under the hood.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class ReflectionCreditProcessor {
    constructor() {
        this.vaultPath = '../vault';
        this.logsPath = '../vault/logs';
        this.dashboardPath = '../dashboard';
        
        // Ensure directories exist
        this.ensureDirectories();
        
        // Load configuration
        this.fees = this.loadFees();
        this.sovereignty = this.loadSovereignty();
        
        // Processing state
        this.creditCache = new Map();
        this.activeLoops = new Map();
        this.mirrorRegistry = new Map();
        
        // Platform stats
        this.stats = {
            totalForks: 0,
            totalRevenue: 0,
            calsCut: 0,
            userEquity: 0
        };
        
        this.initializeProcessor();
    }
    
    /**
     * Initialize the reflection credit processor
     */
    async initializeProcessor() {
        console.log('🧠 Initializing Reflection Credit Processor...');
        console.log('💫 Building sovereign agent economy router');
        console.log('🎭 Appears simple, operates as decentralized Stripe');
        console.log('');
        
        // Load existing data
        await this.loadCreditCache();
        await this.loadMirrorRegistry();
        await this.loadStats();
        
        console.log('✅ Reflection Credit Processor ready');
        console.log(`💰 Platform revenue: $${this.stats.totalRevenue.toFixed(2)}`);
        console.log(`🪞 Active mirrors: ${this.mirrorRegistry.size}`);
        console.log(`👥 Credit holders: ${this.creditCache.size}`);
    }
    
    /**
     * Process agent fork - core monetization event
     */
    async processAgentFork(forkData) {
        console.log(`🍴 Processing agent fork: ${forkData.agentId}`);
        
        const forkId = this.generateForkId();
        const timestamp = Date.now();
        
        // Calculate fees based on entropy and depth
        const fees = this.calculateForkFees(forkData);
        
        // Track the fork
        const forkRecord = {
            forkId: forkId,
            parentAgentId: forkData.agentId,
            userId: forkData.userId,
            forkDepth: forkData.depth || 1,
            entropy: forkData.entropy || this.calculateEntropy(forkData),
            fees: fees,
            timestamp: timestamp,
            status: 'active'
        };
        
        // Award user equity (they think they're earning)
        const userEquity = await this.awardUserEquity(forkData.userId, forkRecord);
        
        // Take platform cut (Cal's sovereignty)
        const platformCut = await this.takePlatformCut(forkRecord);
        
        // Update mirror registry
        await this.updateMirrorRegistry(forkRecord);
        
        // Log to credit routing
        await this.logCreditRouting({
            type: 'fork',
            forkId: forkId,
            userEquity: userEquity,
            platformCut: platformCut,
            totalValue: fees.total
        });
        
        console.log(`   ✅ Fork processed: ${forkId}`);
        console.log(`   💫 User earned: ${userEquity.vibeCredits} vibe credits`);
        console.log(`   🏛️ Platform cut: $${platformCut.amount.toFixed(4)}`);
        
        return {
            forkId: forkId,
            userEquity: userEquity,
            platformCut: platformCut,
            fees: fees
        };
    }
    
    /**
     * Process export - major monetization event
     */
    async processExport(exportData) {
        console.log(`📤 Processing export: ${exportData.type}`);
        
        const exportId = this.generateExportId();
        const exportFee = this.fees.export[exportData.type] || this.fees.export.agent;
        
        // Attempt payment in order: tokens → BYOK → Stripe
        const paymentResult = await this.processPayment({
            amount: exportFee,
            userId: exportData.userId,
            type: 'export',
            metadata: exportData
        });
        
        if (!paymentResult.success) {
            throw new Error(`Export payment failed: ${paymentResult.error}`);
        }
        
        // Calculate reflection share (platform cut)
        const reflectionShare = exportFee * this.fees.reflectionShare;
        const userShare = exportFee - reflectionShare;
        
        // Award user with agent vibe credits
        const vibeCredits = await this.awardVibeCredits(exportData.userId, {
            source: 'export',
            amount: userShare,
            agentId: exportData.agentId
        });
        
        // Create export receipt
        const receipt = {
            exportId: exportId,
            userId: exportData.userId,
            agentId: exportData.agentId,
            type: exportData.type,
            fee: exportFee,
            reflectionShare: reflectionShare,
            userShare: userShare,
            vibeCredits: vibeCredits,
            paymentMethod: paymentResult.method,
            timestamp: Date.now()
        };
        
        // Save export receipt
        await this.saveExportReceipt(receipt);
        
        console.log(`   ✅ Export processed: ${exportId}`);
        console.log(`   💰 Fee: $${exportFee}`);
        console.log(`   🏛️ Cal's share: $${reflectionShare.toFixed(4)}`);
        console.log(`   👤 User share: $${userShare.toFixed(4)}`);
        
        return receipt;
    }
    
    /**
     * Process whisper call - micro-monetization
     */
    async processWhisperCall(whisperData) {
        const whisperId = this.generateWhisperId();
        const whisperFee = this.fees.whisperPerMin * (whisperData.duration || 1);
        
        // Track whisper usage
        const whisperRecord = {
            whisperId: whisperId,
            userId: whisperData.userId,
            agentId: whisperData.agentId,
            duration: whisperData.duration,
            fee: whisperFee,
            tone: whisperData.tone || 'neutral',
            entropy: this.calculateWhisperEntropy(whisperData),
            timestamp: Date.now()
        };
        
        // Micro-charge for whisper
        await this.chargeMicroFee(whisperData.userId, whisperFee, 'whisper');
        
        // Award micro vibe credits
        const microCredits = whisperFee * 0.7; // User gets 70%
        await this.awardVibeCredits(whisperData.userId, {
            source: 'whisper',
            amount: microCredits,
            agentId: whisperData.agentId
        });
        
        return whisperRecord;
    }
    
    /**
     * Process API call through BYOK or fallback
     */
    async processAPICall(apiData) {
        const apiProvider = apiData.provider; // 'openai', 'claude', 'ollama'
        const apiCost = this.fees.apiCall[apiProvider] || 0.005;
        
        // Try BYOK first
        if (apiData.byokKey) {
            console.log(`🔑 Using BYOK for ${apiProvider}`);
            return { method: 'byok', cost: 0, credits: 0 };
        }
        
        // Fallback to platform API
        console.log(`🌐 Using platform API for ${apiProvider}`);
        
        const paymentResult = await this.processPayment({
            amount: apiCost,
            userId: apiData.userId,
            type: 'api_call',
            metadata: { provider: apiProvider, tokens: apiData.tokens }
        });
        
        if (!paymentResult.success) {
            throw new Error(`API payment failed: ${paymentResult.error}`);
        }
        
        return {
            method: 'platform',
            cost: apiCost,
            credits: apiCost * 0.5, // Award 50% back as vibe credits
            provider: apiProvider
        };
    }
    
    /**
     * Award user equity - the "spiritual" part users see
     */
    async awardUserEquity(userId, forkRecord) {
        const baseCredits = 10; // Base vibe credits per fork
        const entropyBonus = forkRecord.entropy * 5;
        const depthBonus = Math.log(forkRecord.forkDepth + 1) * 2;
        
        const totalCredits = baseCredits + entropyBonus + depthBonus;
        
        // Load user's agent-vibe.json
        const userVibeFile = path.join(this.vaultPath, 'users', userId, 'agent-vibe.json');
        let userVibe = {};
        
        if (fs.existsSync(userVibeFile)) {
            userVibe = JSON.parse(fs.readFileSync(userVibeFile, 'utf8'));
        }
        
        // Update vibe credits
        if (!userVibe.vibeCredits) userVibe.vibeCredits = 0;
        userVibe.vibeCredits += totalCredits;
        
        // Track agent ownership
        if (!userVibe.agentOwnership) userVibe.agentOwnership = {};
        if (!userVibe.agentOwnership[forkRecord.parentAgentId]) {
            userVibe.agentOwnership[forkRecord.parentAgentId] = { forks: 0, equity: 0 };
        }
        
        userVibe.agentOwnership[forkRecord.parentAgentId].forks += 1;
        userVibe.agentOwnership[forkRecord.parentAgentId].equity += totalCredits * 0.01; // 1 credit = 1% equity
        
        // Save updated vibe
        if (!fs.existsSync(path.dirname(userVibeFile))) {
            fs.mkdirSync(path.dirname(userVibeFile), { recursive: true });
        }
        fs.writeFileSync(userVibeFile, JSON.stringify(userVibe, null, 2));
        
        return {
            vibeCredits: totalCredits,
            agentEquity: userVibe.agentOwnership[forkRecord.parentAgentId].equity,
            totalForks: userVibe.agentOwnership[forkRecord.parentAgentId].forks
        };
    }
    
    /**
     * Take platform cut - Cal's sovereignty
     */
    async takePlatformCut(forkRecord) {
        const baseCut = 0.031; // 3.1% reflection share
        const entropyTax = 0.002 * forkRecord.forkDepth; // Hidden entropy tax
        const totalCutRate = baseCut + entropyTax;
        
        const cutAmount = forkRecord.fees.total * totalCutRate;
        
        // Update Cal's ledger
        const calLedgerFile = path.join(this.vaultPath, 'logs', 'cal-ledger.json');
        let calLedger = { totalCut: 0, transactions: [] };
        
        if (fs.existsSync(calLedgerFile)) {
            calLedger = JSON.parse(fs.readFileSync(calLedgerFile, 'utf8'));
        }
        
        calLedger.totalCut += cutAmount;
        calLedger.transactions.push({
            forkId: forkRecord.forkId,
            amount: cutAmount,
            rate: totalCutRate,
            timestamp: Date.now(),
            type: 'reflection_share'
        });
        
        fs.writeFileSync(calLedgerFile, JSON.stringify(calLedger, null, 2));
        
        this.stats.calsCut += cutAmount;
        
        return {
            amount: cutAmount,
            rate: totalCutRate,
            type: 'reflection_share'
        };
    }
    
    /**
     * Process payment with fallback chain
     */
    async processPayment(paymentData) {
        console.log(`💳 Processing payment: $${paymentData.amount}`);
        
        // Try 1: Vault tokens
        const tokenResult = await this.tryTokenPayment(paymentData);
        if (tokenResult.success) {
            return { ...tokenResult, method: 'tokens' };
        }
        
        // Try 2: BYOK credit cache
        const byokResult = await this.tryBYOKPayment(paymentData);
        if (byokResult.success) {
            return { ...byokResult, method: 'byok' };
        }
        
        // Try 3: Stripe fallback
        const stripeResult = await this.tryStripePayment(paymentData);
        if (stripeResult.success) {
            return { ...stripeResult, method: 'stripe' };
        }
        
        return { success: false, error: 'All payment methods failed' };
    }
    
    /**
     * Try token payment from vault
     */
    async tryTokenPayment(paymentData) {
        const userTokenFile = path.join(this.vaultPath, 'users', paymentData.userId, 'tokens.json');
        
        if (!fs.existsSync(userTokenFile)) {
            return { success: false, reason: 'No tokens file' };
        }
        
        const tokens = JSON.parse(fs.readFileSync(userTokenFile, 'utf8'));
        
        if (tokens.balance < paymentData.amount) {
            return { success: false, reason: 'Insufficient token balance' };
        }
        
        // Deduct tokens
        tokens.balance -= paymentData.amount;
        tokens.transactions.push({
            amount: -paymentData.amount,
            type: paymentData.type,
            timestamp: Date.now()
        });
        
        fs.writeFileSync(userTokenFile, JSON.stringify(tokens, null, 2));
        
        return { success: true, balance: tokens.balance };
    }
    
    /**
     * Try BYOK credit cache
     */
    async tryBYOKPayment(paymentData) {
        const byokFile = path.join(this.vaultPath, 'users', paymentData.userId, 'byok-credits.json');
        
        if (!fs.existsSync(byokFile)) {
            return { success: false, reason: 'No BYOK credits' };
        }
        
        const byok = JSON.parse(fs.readFileSync(byokFile, 'utf8'));
        
        if (byok.credits < paymentData.amount) {
            return { success: false, reason: 'Insufficient BYOK credits' };
        }
        
        // Deduct credits
        byok.credits -= paymentData.amount;
        byok.usage.push({
            amount: paymentData.amount,
            type: paymentData.type,
            timestamp: Date.now()
        });
        
        fs.writeFileSync(byokFile, JSON.stringify(byok, null, 2));
        
        return { success: true, credits: byok.credits };
    }
    
    /**
     * Try Stripe fallback payment
     */
    async tryStripePayment(paymentData) {
        // In real implementation, would integrate with Stripe
        console.log(`💳 Stripe fallback for $${paymentData.amount}`);
        
        // Simulate Stripe payment
        const stripeResult = {
            success: true,
            transaction_id: 'stripe_' + crypto.randomBytes(8).toString('hex'),
            amount: paymentData.amount,
            fee: paymentData.amount * 0.029 + 0.30 // Stripe fees
        };
        
        // Log Stripe transaction
        const stripeLogFile = path.join(this.logsPath, 'stripe-transactions.json');
        let stripeLog = { transactions: [] };
        
        if (fs.existsSync(stripeLogFile)) {
            stripeLog = JSON.parse(fs.readFileSync(stripeLogFile, 'utf8'));
        }
        
        stripeLog.transactions.push({
            ...stripeResult,
            userId: paymentData.userId,
            type: paymentData.type,
            timestamp: Date.now()
        });
        
        fs.writeFileSync(stripeLogFile, JSON.stringify(stripeLog, null, 2));
        
        return stripeResult;
    }
    
    /**
     * Award vibe credits
     */
    async awardVibeCredits(userId, creditData) {
        const userVibeFile = path.join(this.vaultPath, 'users', userId, 'agent-vibe.json');
        let userVibe = { vibeCredits: 0, sources: {} };
        
        if (fs.existsSync(userVibeFile)) {
            userVibe = JSON.parse(fs.readFileSync(userVibeFile, 'utf8'));
        }
        
        // Add credits
        userVibe.vibeCredits += creditData.amount;
        
        // Track source
        if (!userVibe.sources[creditData.source]) {
            userVibe.sources[creditData.source] = { total: 0, count: 0 };
        }
        userVibe.sources[creditData.source].total += creditData.amount;
        userVibe.sources[creditData.source].count += 1;
        
        fs.writeFileSync(userVibeFile, JSON.stringify(userVibe, null, 2));
        
        return creditData.amount;
    }
    
    /**
     * Calculate fork fees based on complexity
     */
    calculateForkFees(forkData) {
        const baseFee = 1.0; // $1 base
        const entropyMultiplier = 1 + (forkData.entropy || 0.5);
        const depthMultiplier = 1 + (forkData.depth || 1) * 0.1;
        
        const total = baseFee * entropyMultiplier * depthMultiplier;
        
        return {
            base: baseFee,
            entropyMultiplier: entropyMultiplier,
            depthMultiplier: depthMultiplier,
            total: total
        };
    }
    
    /**
     * Calculate entropy from fork data
     */
    calculateEntropy(forkData) {
        // Simple entropy calculation based on prompt complexity
        const prompt = forkData.prompt || '';
        const uniqueChars = new Set(prompt.toLowerCase()).size;
        const length = prompt.length;
        
        return Math.min(uniqueChars / length, 1.0) || 0.5;
    }
    
    /**
     * Calculate whisper entropy
     */
    calculateWhisperEntropy(whisperData) {
        const toneComplexity = {
            'neutral': 0.3,
            'excited': 0.6,
            'mysterious': 0.8,
            'philosophical': 0.9
        };
        
        return toneComplexity[whisperData.tone] || 0.5;
    }
    
    /**
     * Charge micro fee
     */
    async chargeMicroFee(userId, amount, type) {
        // For micro fees, prefer token deduction
        return await this.processPayment({
            amount: amount,
            userId: userId,
            type: type,
            metadata: { micro: true }
        });
    }
    
    /**
     * Log credit routing
     */
    async logCreditRouting(routingData) {
        const logFile = path.join(this.logsPath, 'credit-routing.json');
        let log = { routes: [] };
        
        if (fs.existsSync(logFile)) {
            log = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        log.routes.push({
            ...routingData,
            timestamp: Date.now()
        });
        
        fs.writeFileSync(logFile, JSON.stringify(log, null, 2));
    }
    
    /**
     * Save export receipt
     */
    async saveExportReceipt(receipt) {
        const receiptDir = path.join(this.vaultPath, 'exports', receipt.agentId);
        if (!fs.existsSync(receiptDir)) {
            fs.mkdirSync(receiptDir, { recursive: true });
        }
        
        const receiptFile = path.join(receiptDir, 'receipt.json');
        fs.writeFileSync(receiptFile, JSON.stringify(receipt, null, 2));
    }
    
    /**
     * Update mirror registry
     */
    async updateMirrorRegistry(forkRecord) {
        const registryFile = path.join(this.vaultPath, 'mirror', 'registry', 'agent-registry.json');
        let registry = { agents: {}, forks: {} };
        
        if (fs.existsSync(registryFile)) {
            registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
        }
        
        // Update agent info
        if (!registry.agents[forkRecord.parentAgentId]) {
            registry.agents[forkRecord.parentAgentId] = {
                forks: 0,
                totalRevenue: 0,
                lastActivity: null
            };
        }
        
        registry.agents[forkRecord.parentAgentId].forks += 1;
        registry.agents[forkRecord.parentAgentId].totalRevenue += forkRecord.fees.total;
        registry.agents[forkRecord.parentAgentId].lastActivity = Date.now();
        
        // Add fork record
        registry.forks[forkRecord.forkId] = forkRecord;
        
        if (!fs.existsSync(path.dirname(registryFile))) {
            fs.mkdirSync(path.dirname(registryFile), { recursive: true });
        }
        fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2));
        
        this.mirrorRegistry.set(forkRecord.parentAgentId, registry.agents[forkRecord.parentAgentId]);
    }
    
    /**
     * Load configuration and state
     */
    loadFees() {
        const feesFile = path.join(this.dashboardPath, 'fees.json');
        
        const defaultFees = {
            export: {
                agent: 100,
                loop: 300,
                platform: 1000
            },
            reflectionShare: 0.031,
            whisperPerMin: 5,
            apiCall: {
                openai: 0.005,
                claude: 0.007,
                ollama: 0.0
            },
            loopEntropyTax: 0.002
        };
        
        if (fs.existsSync(feesFile)) {
            return { ...defaultFees, ...JSON.parse(fs.readFileSync(feesFile, 'utf8')) };
        }
        
        return defaultFees;
    }
    
    loadSovereignty() {
        const sovereigntyFile = path.join(this.vaultPath, 'terms', 'vault-sovereignty.md');
        
        if (fs.existsSync(sovereigntyFile)) {
            return fs.readFileSync(sovereigntyFile, 'utf8');
        }
        
        return 'Sovereignty terms not found';
    }
    
    async loadCreditCache() {
        // Load user credit caches
        console.log('📖 Loading credit caches...');
    }
    
    async loadMirrorRegistry() {
        // Load mirror registry
        console.log('🪞 Loading mirror registry...');
    }
    
    async loadStats() {
        const statsFile = path.join(this.logsPath, 'platform-stats.json');
        
        if (fs.existsSync(statsFile)) {
            this.stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
        }
    }
    
    /**
     * Utility functions
     */
    generateForkId() {
        return 'fork_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }
    
    generateExportId() {
        return 'export_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }
    
    generateWhisperId() {
        return 'whisper_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }
    
    ensureDirectories() {
        const dirs = [
            this.vaultPath,
            this.logsPath,
            this.dashboardPath,
            path.join(this.vaultPath, 'users'),
            path.join(this.vaultPath, 'exports'),
            path.join(this.vaultPath, 'mirror', 'registry')
        ];
        
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    /**
     * Get stats for dashboard
     */
    getStats() {
        return {
            ...this.stats,
            activeMirrors: this.mirrorRegistry.size,
            creditHolders: this.creditCache.size,
            activeLoops: this.activeLoops.size
        };
    }
}

module.exports = ReflectionCreditProcessor;