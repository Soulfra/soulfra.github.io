const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class WebhookManager {
    constructor() {
        this.app = express();
        this.port = 8889;
        this.webhooks = new Map();
        this.vaultPath = path.join(__dirname, '../vault');
        
        this.loadWebhookConfig();
        this.setupRoutes();
    }

    loadWebhookConfig() {
        const configPath = path.join(this.vaultPath, 'webhook-config.json');
        
        if (fs.existsSync(configPath)) {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            config.webhooks?.forEach(hook => {
                this.webhooks.set(hook.id, hook);
            });
        }
        
        console.log(`Loaded ${this.webhooks.size} webhook configurations`);
    }

    setupRoutes() {
        this.app.use(express.json());
        
        // Stripe webhooks
        this.app.post('/webhooks/stripe', (req, res) => {
            this.handleStripeWebhook(req, res);
        });
        
        // Customer webhooks
        this.app.post('/webhooks/customer/:customerId', (req, res) => {
            this.handleCustomerWebhook(req.params.customerId, req, res);
        });
        
        // Platform events
        this.app.post('/webhooks/platform/:event', (req, res) => {
            this.handlePlatformEvent(req.params.event, req, res);
        });
        
        // Webhook management
        this.app.post('/webhooks/register', (req, res) => {
            this.registerWebhook(req.body, res);
        });
        
        this.app.get('/webhooks/list', (req, res) => {
            res.json({
                webhooks: Array.from(this.webhooks.values()),
                active: this.webhooks.size
            });
        });
    }

    handleStripeWebhook(req, res) {
        const sig = req.headers['stripe-signature'];
        const event = req.body;
        
        // Log to vault
        this.logWebhook('stripe', {
            type: event.type,
            data: event.data,
            timestamp: new Date().toISOString()
        });
        
        // Process payment events
        switch (event.type) {
            case 'payment_intent.succeeded':
                this.processPayment(event.data.object);
                break;
                
            case 'customer.subscription.created':
                this.activateSubscription(event.data.object);
                break;
                
            case 'customer.subscription.deleted':
                this.cancelSubscription(event.data.object);
                break;
        }
        
        res.json({ received: true });
    }

    handleCustomerWebhook(customerId, req, res) {
        const webhook = this.findCustomerWebhook(customerId);
        
        if (!webhook) {
            return res.status(404).json({ error: 'Webhook not found' });
        }
        
        // Verify signature if configured
        if (webhook.secret) {
            const signature = req.headers['x-webhook-signature'];
            const expected = this.generateSignature(req.body, webhook.secret);
            
            if (signature !== expected) {
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }
        
        // Process webhook
        this.processCustomerEvent(customerId, req.body);
        
        res.json({ 
            received: true,
            customerId: customerId,
            processed: new Date().toISOString()
        });
    }

    handlePlatformEvent(eventType, req, res) {
        const validEvents = [
            'agent.created',
            'agent.updated',
            'agent.deleted',
            'customer.joined',
            'customer.left',
            'usage.threshold',
            'revenue.milestone'
        ];
        
        if (!validEvents.includes(eventType)) {
            return res.status(400).json({ error: 'Invalid event type' });
        }
        
        // Broadcast to registered webhooks
        this.broadcastEvent(eventType, req.body);
        
        // Log platform event
        this.logWebhook('platform', {
            event: eventType,
            data: req.body,
            timestamp: new Date().toISOString()
        });
        
        res.json({ received: true, event: eventType });
    }

    registerWebhook(config, res) {
        const webhook = {
            id: `webhook-${Date.now()}`,
            customerId: config.customerId,
            url: config.url,
            events: config.events || ['*'],
            secret: crypto.randomBytes(32).toString('hex'),
            created: new Date().toISOString(),
            active: true
        };
        
        this.webhooks.set(webhook.id, webhook);
        this.saveWebhookConfig();
        
        res.json({
            success: true,
            webhook: {
                id: webhook.id,
                secret: webhook.secret,
                url: webhook.url
            }
        });
    }

    findCustomerWebhook(customerId) {
        for (const webhook of this.webhooks.values()) {
            if (webhook.customerId === customerId && webhook.active) {
                return webhook;
            }
        }
        return null;
    }

    processPayment(payment) {
        // Update customer credits/usage
        const customerId = payment.metadata?.customerId;
        if (customerId) {
            this.updateCustomerCredits(customerId, payment.amount);
        }
    }

    activateSubscription(subscription) {
        const customerId = subscription.customer;
        
        // Log subscription
        this.logWebhook('subscriptions', {
            action: 'activated',
            customerId: customerId,
            plan: subscription.items.data[0]?.price.id,
            timestamp: new Date().toISOString()
        });
        
        // Broadcast event
        this.broadcastEvent('customer.subscribed', {
            customerId,
            subscription
        });
    }

    cancelSubscription(subscription) {
        const customerId = subscription.customer;
        
        // Log cancellation
        this.logWebhook('subscriptions', {
            action: 'cancelled',
            customerId: customerId,
            timestamp: new Date().toISOString()
        });
        
        // Broadcast event
        this.broadcastEvent('customer.unsubscribed', {
            customerId,
            subscription
        });
    }

    processCustomerEvent(customerId, event) {
        // Log customer event
        this.logWebhook('customer-events', {
            customerId,
            event,
            timestamp: new Date().toISOString()
        });
        
        // Update customer stats
        if (event.type === 'usage.report') {
            this.updateCustomerUsage(customerId, event.usage);
        }
    }

    broadcastEvent(eventType, data) {
        const activeWebhooks = Array.from(this.webhooks.values())
            .filter(w => w.active && (w.events.includes('*') || w.events.includes(eventType)));
        
        activeWebhooks.forEach(webhook => {
            this.sendWebhook(webhook, eventType, data);
        });
    }

    async sendWebhook(webhook, eventType, data) {
        const payload = {
            event: eventType,
            data: data,
            timestamp: new Date().toISOString()
        };
        
        const signature = this.generateSignature(payload, webhook.secret);
        
        try {
            // In production, use fetch/axios to POST to webhook.url
            console.log(`Sending webhook to ${webhook.url}:`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-ID': webhook.id
                },
                body: payload
            });
        } catch (error) {
            console.error(`Webhook delivery failed for ${webhook.id}:`, error);
            
            // Mark webhook as failing
            webhook.failures = (webhook.failures || 0) + 1;
            if (webhook.failures > 5) {
                webhook.active = false;
            }
        }
    }

    generateSignature(payload, secret) {
        return crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
    }

    updateCustomerCredits(customerId, amount) {
        const creditsFile = path.join(this.vaultPath, 'customer-credits.json');
        let credits = {};
        
        if (fs.existsSync(creditsFile)) {
            credits = JSON.parse(fs.readFileSync(creditsFile, 'utf8'));
        }
        
        credits[customerId] = (credits[customerId] || 0) + amount;
        
        fs.writeFileSync(creditsFile, JSON.stringify(credits, null, 2));
    }

    updateCustomerUsage(customerId, usage) {
        const usageFile = path.join(this.vaultPath, 'customer-usage.json');
        let usageData = {};
        
        if (fs.existsSync(usageFile)) {
            usageData = JSON.parse(fs.readFileSync(usageFile, 'utf8'));
        }
        
        if (!usageData[customerId]) {
            usageData[customerId] = [];
        }
        
        usageData[customerId].push({
            ...usage,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 1000 entries per customer
        if (usageData[customerId].length > 1000) {
            usageData[customerId] = usageData[customerId].slice(-1000);
        }
        
        fs.writeFileSync(usageFile, JSON.stringify(usageData, null, 2));
    }

    logWebhook(type, data) {
        const logFile = path.join(this.vaultPath, `webhook-log-${type}.json`);
        let logs = [];
        
        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        logs.push(data);
        
        // Rotate logs
        if (logs.length > 5000) {
            logs = logs.slice(-2500);
        }
        
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    }

    saveWebhookConfig() {
        const configPath = path.join(this.vaultPath, 'webhook-config.json');
        const config = {
            webhooks: Array.from(this.webhooks.values()),
            updated: new Date().toISOString()
        };
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🔌 Webhook Manager running on port ${this.port}`);
            console.log(`   Active webhooks: ${this.webhooks.size}`);
        });
    }
}

// Start webhook manager
if (require.main === module) {
    const manager = new WebhookManager();
    manager.start();
}

module.exports = WebhookManager;