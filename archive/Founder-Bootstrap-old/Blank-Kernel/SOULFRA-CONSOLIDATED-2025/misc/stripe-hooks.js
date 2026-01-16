// Stripe Hooks - Monitors export requests and triggers Stripe checkout
const fs = require('fs').promises;
const path = require('path');
const stripe = require('stripe');
const crypto = require('crypto');

class StripeHooks {
    constructor(config = {}) {
        this.stripeKey = process.env.STRIPE_SECRET_KEY || config.stripeKey;
        this.stripe = this.stripeKey ? stripe(this.stripeKey) : null;
        this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || config.webhookSecret;
        
        // Paths to monitor
        this.exportRequestPath = path.join(__dirname, '../vault/exports/export-request.json');
        this.agentExportPath = path.join(__dirname, '../vault/exports/agent-export.json');
        this.stripeEventsPath = path.join(__dirname, '../vault/logs/stripe-events.json');
        
        // Polling interval for file monitoring
        this.pollInterval = 5000; // 5 seconds
        this.monitoring = false;
    }
    
    async initialize() {
        console.log('🎯 Initializing Stripe hooks...');
        
        // Ensure directories exist
        await this.ensureDirectories();
        
        // Start monitoring export requests
        await this.startMonitoring();
        
        console.log('✅ Stripe hooks initialized');
    }
    
    async ensureDirectories() {
        const dirs = [
            path.dirname(this.exportRequestPath),
            path.dirname(this.stripeEventsPath),
            path.join(__dirname, '../vault/exports')
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async startMonitoring() {
        if (this.monitoring) return;
        
        this.monitoring = true;
        console.log('👀 Monitoring export requests...');
        
        // Check for existing requests
        await this.checkExportRequests();
        
        // Poll for new requests
        this.monitorInterval = setInterval(async () => {
            await this.checkExportRequests();
        }, this.pollInterval);
    }
    
    async checkExportRequests() {
        try {
            // Check for export request file
            const requestExists = await this.fileExists(this.exportRequestPath);
            if (requestExists) {
                await this.processExportRequest();
            }
            
            // Check for agent export file
            const agentExists = await this.fileExists(this.agentExportPath);
            if (agentExists) {
                await this.processAgentExport();
            }
        } catch (error) {
            console.error('Error checking export requests:', error);
        }
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async processExportRequest() {
        console.log('📦 Processing export request...');
        
        try {
            // Read export request
            const requestData = JSON.parse(
                await fs.readFile(this.exportRequestPath, 'utf-8')
            );
            
            // Validate request
            if (!requestData.sessionId || !requestData.agentState) {
                console.error('Invalid export request');
                return;
            }
            
            // Check if already processed
            if (requestData.processed) {
                return;
            }
            
            // Check vault permission
            const vaultAllowed = await this.checkVaultPermission(requestData);
            if (!vaultAllowed) {
                console.log('Export not allowed by vault');
                return;
            }
            
            // Create Stripe checkout session
            const checkoutSession = await this.createCheckoutSession(requestData);
            
            if (checkoutSession.success) {
                // Update request with checkout URL
                requestData.processed = true;
                requestData.checkoutUrl = checkoutSession.url;
                requestData.checkoutSessionId = checkoutSession.sessionId;
                requestData.processedAt = new Date().toISOString();
                
                await fs.writeFile(
                    this.exportRequestPath,
                    JSON.stringify(requestData, null, 2)
                );
                
                // Log event
                await this.logStripeEvent({
                    type: 'checkout_created',
                    sessionId: requestData.sessionId,
                    checkoutSessionId: checkoutSession.sessionId,
                    amount: checkoutSession.amount,
                    timestamp: new Date().toISOString()
                });
                
                console.log('✅ Checkout session created:', checkoutSession.url);
            }
            
        } catch (error) {
            console.error('Error processing export request:', error);
        }
    }
    
    async processAgentExport() {
        console.log('🤖 Processing agent export...');
        
        try {
            // Read agent export data
            const exportData = JSON.parse(
                await fs.readFile(this.agentExportPath, 'utf-8')
            );
            
            // Validate export
            if (!exportData.agentId || exportData.processed) {
                return;
            }
            
            // Create export package
            const exportPackage = await this.createExportPackage(exportData);
            
            // Update export data
            exportData.processed = true;
            exportData.exportPackage = exportPackage;
            exportData.processedAt = new Date().toISOString();
            
            await fs.writeFile(
                this.agentExportPath,
                JSON.stringify(exportData, null, 2)
            );
            
            console.log('✅ Agent export processed');
            
        } catch (error) {
            console.error('Error processing agent export:', error);
        }
    }
    
    async checkVaultPermission(requestData) {
        // Check vault configuration for export permission
        try {
            const vaultConfigPath = path.join(__dirname, '../vault/config.json');
            const vaultConfig = JSON.parse(
                await fs.readFile(vaultConfigPath, 'utf-8')
            );
            
            // Check if exports are enabled
            if (!vaultConfig.allowExports) {
                return false;
            }
            
            // Check session limits
            if (vaultConfig.exportLimits) {
                const sessionExports = await this.getSessionExportCount(requestData.sessionId);
                if (sessionExports >= vaultConfig.exportLimits.perSession) {
                    return false;
                }
            }
            
            return true;
        } catch {
            // Default to allow if no config
            return true;
        }
    }
    
    async getSessionExportCount(sessionId) {
        try {
            const events = await this.getStripeEvents();
            return events.filter(e => 
                e.sessionId === sessionId && 
                e.type === 'checkout_completed'
            ).length;
        } catch {
            return 0;
        }
    }
    
    async createCheckoutSession(requestData) {
        if (!this.stripe) {
            console.error('Stripe not configured');
            return { success: false, error: 'Payment system not configured' };
        }
        
        try {
            // Load pricing configuration
            const pricingConfig = await this.loadPricingConfig();
            
            // Determine pricing plan
            const plan = this.determinePlan(requestData, pricingConfig);
            
            // Create or retrieve customer
            const customer = await this.getOrCreateCustomer(requestData.sessionId);
            
            // Create line items
            const lineItems = [{
                price_data: {
                    currency: pricingConfig.defaultCurrency || 'usd',
                    product_data: {
                        name: plan.label,
                        description: `Export agent from session ${requestData.sessionId}`,
                        metadata: {
                            sessionId: requestData.sessionId,
                            agentId: requestData.agentState.id || 'generated',
                            planId: plan.id
                        }
                    },
                    unit_amount: plan.amount
                },
                quantity: 1
            }];
            
            // Create checkout session
            const session = await this.stripe.checkout.sessions.create({
                customer: customer.id,
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.BASE_URL}/export/success?session={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.BASE_URL}/export/cancel`,
                metadata: {
                    sessionId: requestData.sessionId,
                    exportType: plan.id,
                    timestamp: new Date().toISOString()
                }
            });
            
            return {
                success: true,
                sessionId: session.id,
                url: session.url,
                amount: plan.amount
            };
            
        } catch (error) {
            console.error('Stripe checkout error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async loadPricingConfig() {
        try {
            const configPath = path.join(__dirname, '../mirroros/stripe-config.json');
            return JSON.parse(await fs.readFile(configPath, 'utf-8'));
        } catch {
            // Default config
            return {
                enabled: true,
                plans: [
                    { id: 'export_basic', amount: 100, label: 'Save as Agent' },
                    { id: 'export_team', amount: 2000, label: 'Deploy Team Agent' }
                ],
                defaultCurrency: 'usd'
            };
        }
    }
    
    determinePlan(requestData, pricingConfig) {
        const agentState = requestData.agentState;
        
        // Determine based on complexity
        if (agentState.prompts > 50 || agentState.reflections?.length > 100) {
            return pricingConfig.plans.find(p => p.id === 'export_team') || pricingConfig.plans[1];
        }
        
        return pricingConfig.plans.find(p => p.id === 'export_basic') || pricingConfig.plans[0];
    }
    
    async getOrCreateCustomer(sessionId) {
        const customerEmail = `${sessionId}@mirroros.local`;
        
        // Check if customer exists
        const customers = await this.stripe.customers.list({
            email: customerEmail,
            limit: 1
        });
        
        if (customers.data.length > 0) {
            return customers.data[0];
        }
        
        // Create new customer
        return await this.stripe.customers.create({
            email: customerEmail,
            metadata: {
                sessionId: sessionId,
                created: new Date().toISOString()
            }
        });
    }
    
    async createExportPackage(exportData) {
        const packageId = `pkg_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        const packageDir = path.join(__dirname, '../vault/exports', exportData.agentId);
        
        await fs.mkdir(packageDir, { recursive: true });
        
        // Create agent file
        const agentFile = path.join(packageDir, 'agent.json');
        await fs.writeFile(agentFile, JSON.stringify({
            id: exportData.agentId,
            name: exportData.agentName || 'Exported Agent',
            version: '1.0.0',
            personality: exportData.personality || {},
            systemPrompt: exportData.systemPrompt || '',
            created: new Date().toISOString(),
            source: 'mirror_export'
        }, null, 2));
        
        // Create manifest
        const manifestFile = path.join(packageDir, 'manifest.json');
        await fs.writeFile(manifestFile, JSON.stringify({
            packageId: packageId,
            agentId: exportData.agentId,
            exported: new Date().toISOString(),
            files: ['agent.json', 'README.md'],
            checksum: this.generateChecksum(exportData)
        }, null, 2));
        
        // Create README
        const readmeFile = path.join(packageDir, 'README.md');
        await fs.writeFile(readmeFile, `# ${exportData.agentName || 'Exported Agent'}

## Overview
This agent was exported from MirrorOS session ${exportData.sessionId}.

## Usage
\`\`\`javascript
const agent = require('./agent.json');
// Use with your preferred agent runtime
\`\`\`

## Export Details
- Package ID: ${packageId}
- Agent ID: ${exportData.agentId}
- Exported: ${new Date().toISOString()}

## License
This agent is licensed for use by the exporting user.
`);
        
        return {
            packageId: packageId,
            path: packageDir,
            files: ['agent.json', 'manifest.json', 'README.md']
        };
    }
    
    generateChecksum(data) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }
    
    async handleWebhook(rawBody, signature) {
        if (!this.webhookSecret) {
            console.error('Webhook secret not configured');
            return { received: false };
        }
        
        let event;
        
        try {
            event = this.stripe.webhooks.constructEvent(
                rawBody,
                signature,
                this.webhookSecret
            );
        } catch (error) {
            console.error('Webhook signature verification failed:', error);
            return { received: false, error: 'Invalid signature' };
        }
        
        // Handle the event
        switch (event.type) {
            case 'checkout.session.completed':
                await this.handleCheckoutComplete(event.data.object);
                break;
                
            case 'payment_intent.succeeded':
                await this.handlePaymentSuccess(event.data.object);
                break;
                
            case 'checkout.session.expired':
                await this.handleCheckoutExpired(event.data.object);
                break;
                
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        
        // Log all events
        await this.logStripeEvent({
            type: event.type,
            eventId: event.id,
            data: event.data.object,
            timestamp: new Date().toISOString()
        });
        
        return { received: true };
    }
    
    async handleCheckoutComplete(session) {
        console.log('💰 Checkout completed:', session.id);
        
        const metadata = session.metadata;
        const sessionId = metadata.sessionId;
        const exportType = metadata.exportType;
        
        // Create receipt
        const receipt = {
            checkoutSessionId: session.id,
            paymentIntent: session.payment_intent,
            amount: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_email,
            exportType: exportType,
            sessionId: sessionId,
            status: 'success',
            completedAt: new Date().toISOString()
        };
        
        // Save receipt
        await this.saveReceipt(sessionId, receipt);
        
        // Trigger export completion
        await this.completeExport(sessionId, exportType);
        
        // Log event
        await this.logStripeEvent({
            type: 'export_completed',
            sessionId: sessionId,
            amount: session.amount_total,
            exportType: exportType,
            timestamp: new Date().toISOString()
        });
    }
    
    async handlePaymentSuccess(paymentIntent) {
        console.log('💳 Payment succeeded:', paymentIntent.id);
        
        // Additional payment processing if needed
    }
    
    async handleCheckoutExpired(session) {
        console.log('⏰ Checkout expired:', session.id);
        
        // Clean up expired session
        const metadata = session.metadata;
        if (metadata.sessionId) {
            await this.cleanupExpiredExport(metadata.sessionId);
        }
    }
    
    async saveReceipt(sessionId, receipt) {
        // Find agent ID from export request
        let agentId = 'unknown';
        try {
            const exportRequest = JSON.parse(
                await fs.readFile(this.exportRequestPath, 'utf-8')
            );
            if (exportRequest.sessionId === sessionId && exportRequest.agentState) {
                agentId = exportRequest.agentState.id || `agent_${sessionId}`;
            }
        } catch {
            // Use session ID as fallback
            agentId = `agent_${sessionId}`;
        }
        
        const receiptDir = path.join(__dirname, '../vault/exports', agentId);
        await fs.mkdir(receiptDir, { recursive: true });
        
        const receiptPath = path.join(receiptDir, 'receipt.json');
        await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2));
        
        console.log('Receipt saved:', receiptPath);
    }
    
    async completeExport(sessionId, exportType) {
        // Mark export as complete and available for download
        const exportCompletePath = path.join(__dirname, '../vault/exports/export-complete.json');
        
        const completeData = {
            sessionId: sessionId,
            exportType: exportType,
            completed: true,
            downloadUrl: `/api/export/download/${sessionId}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
            timestamp: new Date().toISOString()
        };
        
        await fs.writeFile(exportCompletePath, JSON.stringify(completeData, null, 2));
    }
    
    async cleanupExpiredExport(sessionId) {
        // Remove export request
        try {
            const exportRequest = JSON.parse(
                await fs.readFile(this.exportRequestPath, 'utf-8')
            );
            if (exportRequest.sessionId === sessionId) {
                exportRequest.expired = true;
                exportRequest.expiredAt = new Date().toISOString();
                await fs.writeFile(
                    this.exportRequestPath,
                    JSON.stringify(exportRequest, null, 2)
                );
            }
        } catch {
            // Ignore if file doesn't exist
        }
    }
    
    async logStripeEvent(event) {
        let events = [];
        
        try {
            events = JSON.parse(await fs.readFile(this.stripeEventsPath, 'utf-8'));
        } catch {
            // New file
        }
        
        events.push(event);
        
        // Keep last 1000 events
        if (events.length > 1000) {
            events = events.slice(-1000);
        }
        
        await fs.writeFile(this.stripeEventsPath, JSON.stringify(events, null, 2));
    }
    
    async getStripeEvents() {
        try {
            return JSON.parse(await fs.readFile(this.stripeEventsPath, 'utf-8'));
        } catch {
            return [];
        }
    }
    
    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
        this.monitoring = false;
        console.log('Stopped monitoring export requests');
    }
}

module.exports = StripeHooks;