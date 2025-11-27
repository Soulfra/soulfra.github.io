/**
 * MirrorOS Licensing Payout System
 * 
 * Accepts Stripe receipts, processes revenue sharing, and routes payments
 * to master vault, fork owners, and referrer chain based on licensing agreements.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class LicensingPayoutSystem {
    constructor() {
        this.licensingPath = '../licensing';
        this.vaultPath = '../vault';
        this.logsPath = '../vault/logs';
        
        // Payout configuration
        this.payoutConfig = {
            masterVaultShare: 15.0,
            defaultPartnerShare: 80.0,
            maxReferrerShare: 10.0,
            stripeProcessingFee: 2.9,
            minimumPayoutAmount: 100.0,
            payoutRetryAttempts: 3,
            payoutTimeoutMs: 30000
        };
        
        // Revenue tracking
        this.pendingPayouts = new Map();
        this.completedPayouts = new Map();
        this.failedPayouts = new Map();
        this.revenueBuffer = [];
        
        // Stripe integration
        this.stripeWebhookSecret = null;
        this.stripeConnectAccounts = new Map();
        
        this.initializeLicensingPayout();
    }
    
    /**
     * Initialize licensing payout system
     */
    async initializeLicensingPayout() {
        console.log('💰 Initializing MirrorOS Licensing Payout System...');
        console.log('🏦 Stripe Connect integration and revenue routing');
        console.log('📊 Partner revenue sharing and referral chain processing');
        
        // Load licensed vaults registry
        await this.loadLicensedVaults();
        
        // Initialize Stripe configuration
        await this.initializeStripeConfig();
        
        // Load payout history
        await this.loadPayoutHistory();
        
        // Start revenue processing
        this.startRevenueProcessing();
        
        console.log('✅ Licensing Payout System operational');
        console.log(`🤝 ${this.licensedVaults.size} licensed partner vaults`);
        console.log(`💸 ${this.completedPayouts.size} completed payouts in history`);
    }
    
    /**
     * Process Stripe webhook for revenue event
     */
    async processStripeWebhook(webhookBody, signature) {
        console.log('🔔 Processing Stripe webhook for revenue event...');
        
        try {
            // Verify webhook signature (simplified)
            const isValid = this.verifyStripeSignature(webhookBody, signature);
            if (!isValid) {
                throw new Error('Invalid Stripe webhook signature');
            }
            
            const event = JSON.parse(webhookBody);
            
            switch (event.type) {
                case 'payment_intent.succeeded':
                    return await this.processSuccessfulPayment(event.data.object);
                    
                case 'invoice.payment_succeeded':
                    return await this.processSubscriptionPayment(event.data.object);
                    
                case 'transfer.created':
                    return await this.processTransferCreated(event.data.object);
                    
                case 'account.updated':
                    return await this.processAccountUpdate(event.data.object);
                    
                default:
                    console.log(`   ℹ️ Unhandled webhook event type: ${event.type}`);
                    return { processed: false, reason: 'unhandled_event_type' };
            }
            
        } catch (error) {
            console.error('Stripe webhook processing error:', error.message);
            return { processed: false, error: error.message };
        }
    }
    
    /**
     * Process successful payment and route revenue
     */
    async processSuccessfulPayment(paymentIntent) {
        console.log(`💵 Processing successful payment: ${paymentIntent.id}`);
        
        const revenueEvent = {
            paymentId: paymentIntent.id,
            amount: paymentIntent.amount / 100, // Convert from cents
            currency: paymentIntent.currency,
            timestamp: Date.now(),
            
            // Extract vault information from metadata
            vaultSig: paymentIntent.metadata?.vault_sig,
            operatorUUID: paymentIntent.metadata?.operator_uuid,
            productType: paymentIntent.metadata?.product_type || 'agent_export',
            customerId: paymentIntent.metadata?.customer_id,
            
            // Payment details
            stripeCustomerId: paymentIntent.customer,
            paymentMethodId: paymentIntent.payment_method,
            receiptUrl: paymentIntent.charges?.data[0]?.receipt_url
        };
        
        // Validate vault exists in licensing registry
        if (!this.licensedVaults.has(revenueEvent.vaultSig)) {
            console.log(`   ⚠️ Payment from unlicensed vault: ${revenueEvent.vaultSig}`);
            return await this.handleUnlicensedVaultPayment(revenueEvent);
        }
        
        // Process revenue sharing
        const revenueSharing = await this.calculateRevenueSharing(revenueEvent);
        
        // Create payout transactions
        const payoutTransactions = await this.createPayoutTransactions(revenueEvent, revenueSharing);
        
        // Execute payouts
        const payoutResults = await this.executePayouts(payoutTransactions);
        
        // Log revenue activity
        await this.logRevenueActivity(revenueEvent, revenueSharing, payoutResults);
        
        // Update vault metrics
        await this.updateVaultMetrics(revenueEvent.vaultSig, revenueEvent, revenueSharing);
        
        console.log(`   ✅ Revenue processed: $${revenueEvent.amount} routed to ${payoutTransactions.length} recipients`);
        
        return {
            processed: true,
            revenueEvent: revenueEvent,
            revenueSharing: revenueSharing,
            payoutResults: payoutResults
        };
    }
    
    /**
     * Calculate revenue sharing based on vault configuration
     */
    async calculateRevenueSharing(revenueEvent) {
        const vault = this.licensedVaults.get(revenueEvent.vaultSig);
        const grossAmount = revenueEvent.amount;
        
        // Subtract Stripe processing fee
        const stripeProcessingFee = grossAmount * (this.payoutConfig.stripeProcessingFee / 100);
        const netAmount = grossAmount - stripeProcessingFee;
        
        // Calculate shares
        const partnerShare = vault.revenueSharing.partnerShare / 100;
        const masterShare = vault.revenueSharing.masterVaultShare / 100;
        const referrerShare = vault.revenueSharing.referrerShare / 100;
        
        const partnerAmount = netAmount * partnerShare;
        const masterAmount = netAmount * masterShare;
        const referrerAmount = netAmount * referrerShare;
        
        // Calculate referrer chain payouts
        const referrerPayouts = this.calculateReferrerChainPayouts(
            vault.mirrorOrigin.referrerChain,
            referrerAmount
        );
        
        return {
            grossAmount: grossAmount,
            netAmount: netAmount,
            stripeProcessingFee: stripeProcessingFee,
            
            partnerPayout: {
                operatorUUID: vault.operatorUUID,
                vaultSig: revenueEvent.vaultSig,
                amount: partnerAmount,
                percentage: vault.revenueSharing.partnerShare
            },
            
            masterPayout: {
                operatorUUID: 'op_master_vault_000',
                vaultSig: 'master-vault.sig',
                amount: masterAmount,
                percentage: vault.revenueSharing.masterVaultShare
            },
            
            referrerPayouts: referrerPayouts,
            
            totalPayout: partnerAmount + masterAmount + referrerAmount,
            totalFees: stripeProcessingFee
        };
    }
    
    /**
     * Calculate referrer chain payouts
     */
    calculateReferrerChainPayouts(referrerChain, totalReferrerAmount) {
        if (!referrerChain || referrerChain.length === 0) {
            return [];
        }
        
        const payouts = [];
        const payoutPerReferrer = totalReferrerAmount / referrerChain.length;
        
        referrerChain.forEach((referrer, index) => {
            payouts.push({
                operatorUUID: referrer.operatorUUID,
                vaultSig: referrer.vaultSig,
                referralCode: referrer.referralCode,
                amount: payoutPerReferrer,
                chainPosition: index + 1,
                chainDepth: referrerChain.length
            });
        });
        
        return payouts;
    }
    
    /**
     * Create payout transactions
     */
    async createPayoutTransactions(revenueEvent, revenueSharing) {
        const transactions = [];
        const transactionId = this.generateTransactionId();
        
        // Partner payout transaction
        transactions.push({
            transactionId: `${transactionId}_partner`,
            type: 'partner_payout',
            operatorUUID: revenueSharing.partnerPayout.operatorUUID,
            vaultSig: revenueSharing.partnerPayout.vaultSig,
            amount: revenueSharing.partnerPayout.amount,
            currency: revenueEvent.currency,
            sourcePaymentId: revenueEvent.paymentId,
            status: 'pending',
            createdAt: Date.now()
        });
        
        // Master vault payout transaction
        transactions.push({
            transactionId: `${transactionId}_master`,
            type: 'master_payout',
            operatorUUID: revenueSharing.masterPayout.operatorUUID,
            vaultSig: revenueSharing.masterPayout.vaultSig,
            amount: revenueSharing.masterPayout.amount,
            currency: revenueEvent.currency,
            sourcePaymentId: revenueEvent.paymentId,
            status: 'pending',
            createdAt: Date.now()
        });
        
        // Referrer payout transactions
        revenueSharing.referrerPayouts.forEach((referrerPayout, index) => {
            transactions.push({
                transactionId: `${transactionId}_referrer_${index}`,
                type: 'referrer_payout',
                operatorUUID: referrerPayout.operatorUUID,
                vaultSig: referrerPayout.vaultSig,
                referralCode: referrerPayout.referralCode,
                amount: referrerPayout.amount,
                currency: revenueEvent.currency,
                sourcePaymentId: revenueEvent.paymentId,
                chainPosition: referrerPayout.chainPosition,
                status: 'pending',
                createdAt: Date.now()
            });
        });
        
        return transactions;
    }
    
    /**
     * Execute payout transactions
     */
    async executePayouts(transactions) {
        const results = [];
        
        for (const transaction of transactions) {
            try {
                console.log(`   💸 Executing payout: ${transaction.type} - $${transaction.amount}`);
                
                // Skip payouts below minimum amount
                if (transaction.amount < this.payoutConfig.minimumPayoutAmount) {
                    console.log(`   ⏭️ Payout below minimum ($${this.payoutConfig.minimumPayoutAmount}), adding to pending`);
                    
                    await this.addToPendingPayouts(transaction);
                    
                    results.push({
                        transactionId: transaction.transactionId,
                        status: 'pending_minimum',
                        amount: transaction.amount,
                        reason: 'below_minimum_amount'
                    });
                    continue;
                }
                
                // Get Stripe Connect account for operator
                const stripeAccountId = await this.getStripeAccountId(transaction.operatorUUID);
                
                if (!stripeAccountId) {
                    console.log(`   ⚠️ No Stripe account for operator: ${transaction.operatorUUID}`);
                    
                    await this.addToFailedPayouts(transaction, 'no_stripe_account');
                    
                    results.push({
                        transactionId: transaction.transactionId,
                        status: 'failed',
                        amount: transaction.amount,
                        reason: 'no_stripe_account'
                    });
                    continue;
                }
                
                // Execute Stripe transfer
                const stripeTransfer = await this.executeStripeTransfer(transaction, stripeAccountId);
                
                if (stripeTransfer.success) {
                    console.log(`   ✅ Payout successful: ${stripeTransfer.transferId}`);
                    
                    await this.addToCompletedPayouts(transaction, stripeTransfer);
                    
                    results.push({
                        transactionId: transaction.transactionId,
                        status: 'completed',
                        amount: transaction.amount,
                        stripeTransferId: stripeTransfer.transferId,
                        expectedArrival: stripeTransfer.expectedArrival
                    });
                } else {
                    console.log(`   ❌ Payout failed: ${stripeTransfer.error}`);
                    
                    await this.addToFailedPayouts(transaction, stripeTransfer.error);
                    
                    results.push({
                        transactionId: transaction.transactionId,
                        status: 'failed',
                        amount: transaction.amount,
                        error: stripeTransfer.error
                    });
                }
                
            } catch (error) {
                console.error(`Payout execution error for ${transaction.transactionId}:`, error.message);
                
                await this.addToFailedPayouts(transaction, error.message);
                
                results.push({
                    transactionId: transaction.transactionId,
                    status: 'error',
                    amount: transaction.amount,
                    error: error.message
                });
            }
        }
        
        return results;
    }
    
    /**
     * Execute Stripe transfer (simplified simulation)
     */
    async executeStripeTransfer(transaction, stripeAccountId) {
        // Simulate Stripe transfer execution
        const transferId = `tr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const amountCents = Math.round(transaction.amount * 100);
        
        // Simulate success/failure based on amount
        const success = Math.random() > 0.05; // 95% success rate
        
        if (success) {
            return {
                success: true,
                transferId: transferId,
                amount: transaction.amount,
                currency: transaction.currency,
                stripeAccountId: stripeAccountId,
                expectedArrival: Date.now() + (2 * 24 * 60 * 60 * 1000), // 2 days
                metadata: {
                    operatorUUID: transaction.operatorUUID,
                    vaultSig: transaction.vaultSig,
                    sourcePaymentId: transaction.sourcePaymentId
                }
            };
        } else {
            return {
                success: false,
                error: 'insufficient_funds', // Simulate various Stripe errors
                stripeAccountId: stripeAccountId
            };
        }
    }
    
    /**
     * Get Stripe Connect account ID for operator
     */
    async getStripeAccountId(operatorUUID) {
        // In real implementation, would query Stripe Connect accounts
        const accountMap = {
            'op_3f8a9b2c4d5e6f7g8h9i0j1k2l3m4n5o': 'acct_enterprise_vault_001',
            'op_7b9c1d2e3f4g5h6i7j8k9l0m1n2o3p4q': 'acct_startup_alpha_002',
            'op_9d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s': 'acct_indie_dev_003',
            'op_master_vault_000': 'acct_master_vault_000'
        };
        
        return accountMap[operatorUUID] || null;
    }
    
    /**
     * Update vault metrics after revenue processing
     */
    async updateVaultMetrics(vaultSig, revenueEvent, revenueSharing) {
        const vault = this.licensedVaults.get(vaultSig);
        
        if (vault) {
            // Update revenue totals
            vault.revenueSharing.totalEarned += revenueEvent.amount;
            vault.revenueSharing.partnerEarnings += revenueSharing.partnerPayout.amount;
            vault.revenueSharing.masterEarnings += revenueSharing.masterPayout.amount;
            vault.revenueSharing.referrerEarnings += revenueSharing.referrerPayouts.reduce((sum, p) => sum + p.amount, 0);
            vault.revenueSharing.lastPayout = Date.now();
            
            // Update platform metrics
            if (revenueEvent.productType === 'agent_export') {
                vault.platformMetrics.totalExports++;
            } else if (revenueEvent.productType === 'platform_fork') {
                vault.platformMetrics.totalForks++;
            } else if (revenueEvent.productType === 'agent_loop') {
                vault.platformMetrics.agentLoopsLaunched++;
            }
            
            // Update customer metrics
            if (revenueEvent.customerId) {
                vault.customerBase.activeCustomers++;
                vault.customerBase.averageLifetimeValue = 
                    vault.revenueSharing.totalEarned / vault.customerBase.activeCustomers;
            }
            
            vault.lastActivity = Date.now();
            
            // Save updated vault data
            await this.saveLicensedVaults();
        }
    }
    
    /**
     * Log revenue activity
     */
    async logRevenueActivity(revenueEvent, revenueSharing, payoutResults) {
        const activityLog = {
            logId: this.generateLogId(),
            timestamp: Date.now(),
            type: 'revenue_processed',
            
            revenueEvent: revenueEvent,
            revenueSharing: revenueSharing,
            payoutResults: payoutResults,
            
            summary: {
                grossRevenue: revenueEvent.amount,
                netRevenue: revenueSharing.netAmount,
                totalPayouts: revenueSharing.totalPayout,
                successfulPayouts: payoutResults.filter(r => r.status === 'completed').length,
                failedPayouts: payoutResults.filter(r => r.status === 'failed').length,
                pendingPayouts: payoutResults.filter(r => r.status === 'pending_minimum').length
            },
            
            integrityHash: null // Will be calculated
        };
        
        // Calculate integrity hash
        activityLog.integrityHash = this.calculateActivityHash(activityLog);
        
        // Add to revenue buffer
        this.revenueBuffer.unshift(activityLog);
        
        // Keep only last 1000 entries
        if (this.revenueBuffer.length > 1000) {
            this.revenueBuffer = this.revenueBuffer.slice(0, 1000);
        }
        
        // Save activity log
        await this.saveRevenueActivity();
    }
    
    /**
     * Handle payment from unlicensed vault
     */
    async handleUnlicensedVaultPayment(revenueEvent) {
        console.log(`   🚫 Unlicensed vault payment: ${revenueEvent.vaultSig}`);
        
        // Route 100% to master vault for unlicensed usage
        const masterPayout = {
            operatorUUID: 'op_master_vault_000',
            vaultSig: 'master-vault.sig',
            amount: revenueEvent.amount * 0.9, // 90% to master, 10% processing
            reason: 'unlicensed_vault_usage'
        };
        
        const transaction = {
            transactionId: this.generateTransactionId() + '_unlicensed',
            type: 'unlicensed_payout',
            ...masterPayout,
            currency: revenueEvent.currency,
            sourcePaymentId: revenueEvent.paymentId,
            status: 'pending',
            createdAt: Date.now()
        };
        
        const payoutResult = await this.executePayouts([transaction]);
        
        await this.logRevenueActivity(revenueEvent, { unlicensedUsage: true }, payoutResult);
        
        return {
            processed: true,
            unlicensedVault: true,
            masterPayout: masterPayout,
            payoutResult: payoutResult[0]
        };
    }
    
    /**
     * Load licensed vaults registry
     */
    async loadLicensedVaults() {
        const vaultsFile = path.join(this.licensingPath, 'licensed-vaults.json');
        
        this.licensedVaults = new Map();
        
        if (fs.existsSync(vaultsFile)) {
            const vaultsData = JSON.parse(fs.readFileSync(vaultsFile, 'utf8'));
            
            for (const [vaultSig, vaultData] of Object.entries(vaultsData.licensedVaults || {})) {
                this.licensedVaults.set(vaultSig, vaultData);
            }
        }
    }
    
    /**
     * Save licensed vaults registry
     */
    async saveLicensedVaults() {
        const vaultsFile = path.join(this.licensingPath, 'licensed-vaults.json');
        
        if (fs.existsSync(vaultsFile)) {
            const vaultsData = JSON.parse(fs.readFileSync(vaultsFile, 'utf8'));
            
            // Update licensed vaults
            for (const [vaultSig, vaultData] of this.licensedVaults.entries()) {
                vaultsData.licensedVaults[vaultSig] = vaultData;
            }
            
            vaultsData.lastUpdated = Date.now();
            
            fs.writeFileSync(vaultsFile, JSON.stringify(vaultsData, null, 2));
        }
    }
    
    /**
     * Initialize Stripe configuration
     */
    async initializeStripeConfig() {
        // Load Stripe configuration (simplified)
        this.stripeWebhookSecret = 'whsec_test_webhook_secret';
        
        console.log('   🔧 Stripe configuration loaded');
    }
    
    /**
     * Start revenue processing
     */
    startRevenueProcessing() {
        // Process pending payouts every hour
        setInterval(async () => {
            await this.processPendingPayouts();
        }, 60 * 60 * 1000);
        
        // Retry failed payouts every 6 hours
        setInterval(async () => {
            await this.retryFailedPayouts();
        }, 6 * 60 * 60 * 1000);
        
        console.log('   ⚡ Revenue processing scheduled');
    }
    
    /**
     * Helper functions
     */
    generateTransactionId() {
        return 'txn_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }
    
    generateLogId() {
        return 'log_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex');
    }
    
    verifyStripeSignature(body, signature) {
        // Simplified signature verification
        return signature && signature.startsWith('t=');
    }
    
    calculateActivityHash(activityLog) {
        const hashInput = JSON.stringify({
            logId: activityLog.logId,
            timestamp: activityLog.timestamp,
            grossRevenue: activityLog.summary.grossRevenue,
            netRevenue: activityLog.summary.netRevenue
        });
        
        return crypto.createHash('sha256').update(hashInput).digest('hex');
    }
    
    async addToPendingPayouts(transaction) {
        this.pendingPayouts.set(transaction.transactionId, transaction);
    }
    
    async addToCompletedPayouts(transaction, stripeTransfer) {
        this.completedPayouts.set(transaction.transactionId, {
            transaction: transaction,
            stripeTransfer: stripeTransfer,
            completedAt: Date.now()
        });
    }
    
    async addToFailedPayouts(transaction, error) {
        this.failedPayouts.set(transaction.transactionId, {
            transaction: transaction,
            error: error,
            failedAt: Date.now(),
            retryCount: 0
        });
    }
    
    async loadPayoutHistory() {
        // Load payout history from storage (simplified)
        console.log('   📊 Payout history loaded');
    }
    
    async saveRevenueActivity() {
        const activityFile = path.join(this.logsPath, 'license-activity.json');
        
        const activityData = {
            version: '1.0.0',
            lastUpdated: Date.now(),
            totalActivities: this.revenueBuffer.length,
            activities: this.revenueBuffer
        };
        
        if (!fs.existsSync(path.dirname(activityFile))) {
            fs.mkdirSync(path.dirname(activityFile), { recursive: true });
        }
        
        fs.writeFileSync(activityFile, JSON.stringify(activityData, null, 2));
    }
    
    async processPendingPayouts() {
        console.log('🔄 Processing pending payouts...');
        // Implementation for processing accumulated pending payouts
    }
    
    async retryFailedPayouts() {
        console.log('🔄 Retrying failed payouts...');
        // Implementation for retrying failed payouts
    }
    
    async processSubscriptionPayment(invoice) {
        // Handle subscription payments (simplified)
        return { processed: true, type: 'subscription' };
    }
    
    async processTransferCreated(transfer) {
        // Handle transfer creation events (simplified)
        return { processed: true, type: 'transfer' };
    }
    
    async processAccountUpdate(account) {
        // Handle account updates (simplified)
        return { processed: true, type: 'account_update' };
    }
}

module.exports = LicensingPayoutSystem;