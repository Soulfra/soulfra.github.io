// MirrorOS Stripe Integration - Optional payment processing
const stripe = require('stripe');
const ExportHandler = require('./export-handler');
const UsageMonitor = require('./usage-monitor');

class StripeIntegration {
    constructor(config = {}) {
        this.stripeKey = config.secretKey || process.env.STRIPE_SECRET_KEY;
        this.webhookSecret = config.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET;
        this.stripe = this.stripeKey ? stripe(this.stripeKey) : null;
        this.exportHandler = new ExportHandler();
        this.usageMonitor = new UsageMonitor();
    }

    async init() {
        await this.exportHandler.init();
        await this.usageMonitor.init();
        
        if (!this.stripe) {
            console.log('Stripe integration disabled - no API key provided');
        }
    }

    async createCheckoutSession(params) {
        if (!this.stripe) {
            throw new Error('Stripe not configured');
        }

        const {
            type, // 'export', 'credits', 'subscription', 'platform'
            userId,
            metadata = {}
        } = params;

        let lineItems = [];
        let successUrl = `${process.env.BASE_URL}/dashboard?payment=success`;
        let cancelUrl = `${process.env.BASE_URL}/dashboard?payment=cancelled`;

        switch(type) {
            case 'export':
                lineItems = await this.createExportLineItems(params);
                break;
            
            case 'credits':
                lineItems = this.createCreditLineItems(params);
                break;
                
            case 'subscription':
                lineItems = this.createSubscriptionLineItems(params);
                break;
                
            case 'platform':
                lineItems = this.createPlatformLineItems(params);
                break;
        }

        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: type === 'subscription' ? 'subscription' : 'payment',
            success_url: successUrl,
            cancel_url: cancelUrl,
            metadata: {
                userId,
                type,
                ...metadata
            }
        });

        return {
            checkoutUrl: session.url,
            sessionId: session.id
        };
    }

    async createExportLineItems(params) {
        const { itemId, itemType, includeVault } = params;
        
        // Calculate export cost
        const exportPreview = await this.exportHandler.trackExport({
            type: itemType,
            itemId: itemId,
            includeVault: includeVault,
            paymentMethod: 'stripe'
        });

        return [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Export ${itemType}: ${exportPreview.metadata.itemName}`,
                    description: `MirrorOS ${itemType} export with mirror signature`,
                    metadata: {
                        mirrorSignature: exportPreview.mirrorSignature
                    }
                },
                unit_amount: Math.round(exportPreview.cost * 100) // Convert to cents
            },
            quantity: 1
        }];
    }

    createCreditLineItems(params) {
        const { credits, price } = params;
        
        return [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `${credits} Reflection Credits`,
                    description: 'MirrorOS platform credits for exports and API usage'
                },
                unit_amount: Math.round(price * 100)
            },
            quantity: 1
        }];
    }

    createSubscriptionLineItems(params) {
        const { plan } = params;
        
        const plans = {
            pro: {
                name: 'MirrorOS Pro',
                price: 2900, // $29/month
                credits: 1000,
                interval: 'month'
            },
            enterprise: {
                name: 'MirrorOS Enterprise',
                price: 29900, // $299/month
                credits: 10000,
                interval: 'month'
            }
        };

        const selectedPlan = plans[plan];
        
        return [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: selectedPlan.name,
                    description: `${selectedPlan.credits} credits per month + premium features`
                },
                recurring: {
                    interval: selectedPlan.interval
                },
                unit_amount: selectedPlan.price
            },
            quantity: 1
        }];
    }

    createPlatformLineItems(params) {
        const { package: pkg } = params;
        
        const packages = {
            starter: {
                name: 'MirrorOS Starter Clone',
                price: 50000, // $500
                description: 'Basic platform clone with 5 agent templates'
            },
            professional: {
                name: 'MirrorOS Professional Clone',
                price: 200000, // $2000
                description: 'Custom branding, 20 templates, training included'
            },
            enterprise: {
                name: 'MirrorOS Enterprise Clone',
                price: 500000, // $5000
                description: 'Full white-label with unlimited agents and custom features'
            }
        };

        const selectedPackage = packages[pkg];
        
        return [{
            price_data: {
                currency: 'usd',
                product_data: {
                    name: selectedPackage.name,
                    description: selectedPackage.description
                },
                unit_amount: selectedPackage.price
            },
            quantity: 1
        }];
    }

    async handleWebhook(body, signature) {
        if (!this.stripe || !this.webhookSecret) {
            throw new Error('Webhook not configured');
        }

        let event;
        
        try {
            event = this.stripe.webhooks.constructEvent(
                body,
                signature,
                this.webhookSecret
            );
        } catch (err) {
            throw new Error(`Webhook signature verification failed: ${err.message}`);
        }

        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutComplete(event.data.object);
                break;
                
            case 'invoice.payment_succeeded':
                await this.handleInvoicePayment(event.data.object);
                break;
                
            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await this.handleSubscriptionChange(event.data.object);
                break;
                
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return { received: true };
    }

    async handleCheckoutComplete(session) {
        const { metadata } = session;
        const userId = metadata.userId;
        const type = metadata.type;

        switch(type) {
            case 'export':
                // Export already tracked, just confirm payment
                console.log(`Export payment confirmed for user ${userId}`);
                break;
                
            case 'credits':
                // Add credits to user account
                const credits = parseInt(metadata.credits);
                await this.usageMonitor.addCredits(userId, credits, 'stripe-purchase');
                break;
                
            case 'platform':
                // Trigger platform clone
                await this.triggerPlatformClone(userId, metadata.package);
                break;
        }
    }

    async handleInvoicePayment(invoice) {
        // Handle recurring subscription payments
        const customerId = invoice.customer;
        const amount = invoice.amount_paid / 100; // Convert from cents
        
        console.log(`Invoice paid: ${customerId} - $${amount}`);
        
        // Add monthly credits for subscriptions
        if (invoice.subscription) {
            const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription);
            const plan = subscription.items.data[0].price.metadata.plan;
            
            const creditAmounts = {
                pro: 1000,
                enterprise: 10000
            };
            
            if (creditAmounts[plan]) {
                await this.usageMonitor.addCredits(
                    subscription.metadata.userId,
                    creditAmounts[plan],
                    'subscription-renewal'
                );
            }
        }
    }

    async handleSubscriptionChange(subscription) {
        const userId = subscription.metadata.userId;
        const status = subscription.status;
        
        console.log(`Subscription ${status} for user ${userId}`);
        
        // Update user's subscription status in database
        // This would connect to your user management system
    }

    async triggerPlatformClone(userId, packageType) {
        // This would trigger the actual platform cloning process
        console.log(`Triggering ${packageType} platform clone for user ${userId}`);
        
        // Create clone record
        const cloneRecord = {
            userId,
            package: packageType,
            status: 'pending',
            created: new Date().toISOString()
        };
        
        // In a real implementation, this would:
        // 1. Create a new subdomain/instance
        // 2. Copy platform files
        // 3. Configure with user's branding
        // 4. Send setup instructions
        
        return cloneRecord;
    }

    async createPaymentLink(params) {
        if (!this.stripe) {
            throw new Error('Stripe not configured');
        }

        const { amount, description, metadata } = params;

        const paymentLink = await this.stripe.paymentLinks.create({
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: description
                    },
                    unit_amount: Math.round(amount * 100)
                },
                quantity: 1
            }],
            metadata
        });

        return paymentLink.url;
    }

    async getBalance(userId) {
        // Get user's credit balance and payment history
        const balance = await this.usageMonitor.getUserBalance(userId);
        
        // Get recent payments if Stripe is configured
        let payments = [];
        if (this.stripe) {
            try {
                const charges = await this.stripe.charges.list({
                    limit: 10,
                    metadata: { userId }
                });
                
                payments = charges.data.map(charge => ({
                    id: charge.id,
                    amount: charge.amount / 100,
                    description: charge.description,
                    created: new Date(charge.created * 1000).toISOString(),
                    status: charge.status
                }));
            } catch (error) {
                console.error('Failed to fetch payment history:', error);
            }
        }

        return {
            ...balance,
            payments
        };
    }
}

module.exports = StripeIntegration;