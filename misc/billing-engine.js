// MirrorOS Billing Engine - Handles Stripe Connect and mirror fees
const fs = require('fs').promises;
const path = require('path');
const stripe = require('stripe');

class BillingEngine {
    constructor(config = {}) {
        this.mirrorFee = config.mirrorFee || 0.08; // 8% default
        this.stripeConfigPath = config.stripeConfigPath || 
            path.join(__dirname, '../enterprise-agentzero/stripe-connect.json');
        this.earningsPath = path.join(__dirname, '../vault/logs/agent-earnings.json');
        this.vaultIncomePath = path.join(__dirname, '../tier-13/cal-vault-income.json');
        this.stripeClient = null;
        this.userStripeClient = null;
    }

    async init() {
        // Ensure directories exist
        await fs.mkdir(path.dirname(this.earningsPath), { recursive: true });
        await fs.mkdir(path.dirname(this.vaultIncomePath), { recursive: true });

        // Initialize earnings log
        try {
            await fs.access(this.earningsPath);
        } catch {
            await fs.writeFile(this.earningsPath, JSON.stringify({
                totalEarnings: 0,
                totalMirrorFees: 0,
                transactions: []
            }, null, 2));
        }

        // Initialize vault income log
        try {
            await fs.access(this.vaultIncomePath);
        } catch {
            await fs.writeFile(this.vaultIncomePath, JSON.stringify({
                totalIncome: 0,
                sources: {
                    mirrorFees: 0,
                    exports: 0,
                    subscriptions: 0,
                    platformClones: 0
                },
                transactions: []
            }, null, 2));
        }

        // Load Stripe configuration
        await this.loadStripeConfig();

        console.log(`💰 Billing engine initialized (Mirror fee: ${this.mirrorFee * 100}%)`);
    }

    async loadStripeConfig() {
        try {
            const config = JSON.parse(await fs.readFile(this.stripeConfigPath, 'utf8'));
            
            if (config.connected && config.secretKey) {
                // User's Stripe account
                this.userStripeClient = stripe(config.secretKey);
                console.log('💳 User Stripe Connect: Active');
            }
            
            // Load vault's default Stripe key if available
            const vaultKeysPath = path.join(__dirname, '../vault/env/stripe-keys.json');
            try {
                const vaultKeys = JSON.parse(await fs.readFile(vaultKeysPath, 'utf8'));
                if (vaultKeys.secretKey) {
                    this.stripeClient = stripe(vaultKeys.secretKey);
                    console.log('💳 Vault Stripe: Active');
                }
            } catch {
                // No vault Stripe keys
            }
            
        } catch (error) {
            console.log('💳 Stripe Connect: Not configured');
        }
    }

    async processPayment(params) {
        const {
            amount,
            currency = 'usd',
            description,
            userId,
            metadata = {},
            paymentMethod = 'card'
        } = params;

        // Determine which Stripe client to use
        const client = this.userStripeClient || this.stripeClient;
        
        if (!client) {
            throw new Error('No Stripe configuration available');
        }

        try {
            // Calculate mirror fee
            const mirrorFeeAmount = Math.round(amount * this.mirrorFee);
            const userAmount = amount - mirrorFeeAmount;

            // Create payment intent
            const paymentIntent = await client.paymentIntents.create({
                amount: amount, // in cents
                currency: currency,
                description: description,
                metadata: {
                    ...metadata,
                    userId: userId,
                    mirrorFee: mirrorFeeAmount,
                    userAmount: userAmount,
                    processed: new Date().toISOString()
                }
            });

            // Log transaction
            await this.logTransaction({
                type: 'payment',
                paymentIntentId: paymentIntent.id,
                amount: amount / 100, // Convert to dollars
                mirrorFee: mirrorFeeAmount / 100,
                userAmount: userAmount / 100,
                userId: userId,
                description: description,
                status: paymentIntent.status
            });

            // If using user's Stripe, transfer mirror fee to vault
            if (this.userStripeClient && this.stripeClient) {
                await this.transferMirrorFee(mirrorFeeAmount, paymentIntent.id);
            }

            return {
                success: true,
                paymentIntentId: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                amount: amount / 100,
                mirrorFee: mirrorFeeAmount / 100,
                userAmount: userAmount / 100
            };

        } catch (error) {
            console.error('Payment processing failed:', error);
            throw error;
        }
    }

    async transferMirrorFee(amount, paymentIntentId) {
        // In a real implementation, this would transfer the mirror fee
        // For now, we just log it
        console.log(`💸 Mirror fee transfer: $${amount / 100} (from payment ${paymentIntentId})`);
        
        await this.logVaultIncome({
            type: 'mirrorFee',
            amount: amount / 100,
            source: paymentIntentId,
            timestamp: Date.now()
        });
    }

    async createSubscription(params) {
        const {
            userId,
            priceId,
            customerId,
            trialDays = 0
        } = params;

        const client = this.userStripeClient || this.stripeClient;
        
        if (!client) {
            throw new Error('No Stripe configuration available');
        }

        try {
            const subscription = await client.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                trial_period_days: trialDays,
                metadata: {
                    userId: userId,
                    mirrorFee: this.mirrorFee
                }
            });

            // Log subscription
            await this.logTransaction({
                type: 'subscription',
                subscriptionId: subscription.id,
                userId: userId,
                status: subscription.status,
                amount: subscription.items.data[0].price.unit_amount / 100
            });

            return subscription;

        } catch (error) {
            console.error('Subscription creation failed:', error);
            throw error;
        }
    }

    async handleWebhook(event) {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentSuccess(event.data.object);
                break;
                
            case 'invoice.payment_succeeded':
                await this.handleInvoicePayment(event.data.object);
                break;
                
            case 'payout.paid':
                await this.handlePayout(event.data.object);
                break;
        }
    }

    async handlePaymentSuccess(paymentIntent) {
        const mirrorFee = paymentIntent.metadata.mirrorFee;
        
        if (mirrorFee) {
            await this.logVaultIncome({
                type: 'mirrorFee',
                amount: parseInt(mirrorFee) / 100,
                source: paymentIntent.id,
                timestamp: Date.now()
            });
        }
    }

    async handleInvoicePayment(invoice) {
        // Calculate mirror fee from subscription payment
        const amount = invoice.amount_paid;
        const mirrorFeeAmount = Math.round(amount * this.mirrorFee);
        
        await this.logTransaction({
            type: 'subscription-payment',
            invoiceId: invoice.id,
            amount: amount / 100,
            mirrorFee: mirrorFeeAmount / 100,
            userId: invoice.subscription_metadata?.userId,
            status: 'paid'
        });
    }

    async handlePayout(payout) {
        // Track payouts to users
        console.log(`💰 Payout processed: $${payout.amount / 100}`);
    }

    async logTransaction(transaction) {
        try {
            const earnings = JSON.parse(await fs.readFile(this.earningsPath, 'utf8'));
            
            earnings.transactions.push({
                ...transaction,
                timestamp: Date.now(),
                id: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });

            // Update totals
            if (transaction.amount) {
                earnings.totalEarnings += transaction.amount;
            }
            if (transaction.mirrorFee) {
                earnings.totalMirrorFees += transaction.mirrorFee;
            }

            // Keep last 10000 transactions
            if (earnings.transactions.length > 10000) {
                earnings.transactions = earnings.transactions.slice(-10000);
            }

            await fs.writeFile(this.earningsPath, JSON.stringify(earnings, null, 2));

        } catch (error) {
            console.error('Failed to log transaction:', error);
        }
    }

    async logVaultIncome(income) {
        try {
            const vaultIncome = JSON.parse(await fs.readFile(this.vaultIncomePath, 'utf8'));
            
            vaultIncome.transactions.push({
                ...income,
                id: `vault-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            });

            // Update totals
            vaultIncome.totalIncome += income.amount;
            if (vaultIncome.sources[income.type] !== undefined) {
                vaultIncome.sources[income.type] += income.amount;
            }

            // Keep last 10000 transactions
            if (vaultIncome.transactions.length > 10000) {
                vaultIncome.transactions = vaultIncome.transactions.slice(-10000);
            }

            await fs.writeFile(this.vaultIncomePath, JSON.stringify(vaultIncome, null, 2));

        } catch (error) {
            console.error('Failed to log vault income:', error);
        }
    }

    async getStatus() {
        const status = {
            mirrorFee: this.mirrorFee,
            stripeConnected: !!this.userStripeClient,
            vaultStripeActive: !!this.stripeClient
        };

        try {
            const earnings = JSON.parse(await fs.readFile(this.earningsPath, 'utf8'));
            status.totalEarnings = earnings.totalEarnings;
            status.totalMirrorFees = earnings.totalMirrorFees;
            status.recentTransactions = earnings.transactions.slice(-10);
        } catch {
            status.totalEarnings = 0;
            status.totalMirrorFees = 0;
            status.recentTransactions = [];
        }

        return status;
    }

    async generateEarningsReport(userId, startDate, endDate) {
        try {
            const earnings = JSON.parse(await fs.readFile(this.earningsPath, 'utf8'));
            
            const userTransactions = earnings.transactions.filter(txn => {
                if (userId && txn.userId !== userId) return false;
                if (startDate && txn.timestamp < startDate) return false;
                if (endDate && txn.timestamp > endDate) return false;
                return true;
            });

            const report = {
                userId: userId || 'all',
                period: {
                    start: startDate ? new Date(startDate).toISOString() : 'all-time',
                    end: endDate ? new Date(endDate).toISOString() : 'current'
                },
                summary: {
                    totalTransactions: userTransactions.length,
                    grossEarnings: 0,
                    mirrorFees: 0,
                    netEarnings: 0
                },
                byType: {},
                transactions: userTransactions.slice(-100) // Last 100
            };

            // Calculate totals
            userTransactions.forEach(txn => {
                if (txn.amount) {
                    report.summary.grossEarnings += txn.amount;
                    report.summary.mirrorFees += txn.mirrorFee || 0;
                    
                    if (!report.byType[txn.type]) {
                        report.byType[txn.type] = {
                            count: 0,
                            gross: 0,
                            fees: 0
                        };
                    }
                    
                    report.byType[txn.type].count++;
                    report.byType[txn.type].gross += txn.amount;
                    report.byType[txn.type].fees += txn.mirrorFee || 0;
                }
            });

            report.summary.netEarnings = report.summary.grossEarnings - report.summary.mirrorFees;

            return report;

        } catch (error) {
            console.error('Failed to generate earnings report:', error);
            return null;
        }
    }
}

// Export for use
module.exports = BillingEngine;

// Run standalone if executed directly
if (require.main === module) {
    const engine = new BillingEngine();
    
    engine.init().then(async () => {
        console.log('💰 Billing engine running standalone');
        
        const status = await engine.getStatus();
        console.log('Status:', JSON.stringify(status, null, 2));
    });
}