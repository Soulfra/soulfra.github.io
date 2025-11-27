// Export Trigger - Value-First Monetization Engine
// Only bills users AFTER they receive value from exports/deployments
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ExportTrigger {
    constructor() {
        this.routerDir = __dirname;
        this.exportTrackingPath = path.join(this.routerDir, 'export-tracking.json');
        this.billingDraftsPath = path.join(__dirname, '../billing/invoice-draft.json');
        this.stripeEventsPath = path.join(__dirname, '../stripe/payment-events.json');
        this.valueThresholdsPath = path.join(this.routerDir, 'value-thresholds.json');
        
        // Value thresholds before monetization triggers
        this.thresholds = {
            agent_exports: 3,        // Free exports before payment
            workflow_exports: 2,     // Free workflow exports
            forks_cloned: 5,         // Free forks before payment
            deployments: 1,          // Free deployment before payment
            daily_usage_limit: 50,   // Free prompts per day
            total_value_delivered: 100 // Dollar value before payment
        };
        
        // Pricing after value is proven
        this.pricing = {
            agent_export: {
                json: 0,      // Always free
                zip: 9.99,    // Packaged export
                api: 29.99,   // API integration
                platform: 99.99 // Full platform deployment
            },
            workflow_export: {
                basic: 4.99,
                premium: 19.99,
                enterprise: 49.99
            },
            fork_monetization: {
                personal: 0,     // Always free
                commercial: 29.99, // Commercial usage
                enterprise: 99.99  // Enterprise deployment
            },
            deployment_hosting: {
                starter: 9.99,   // Basic hosting
                pro: 29.99,      // Pro features
                enterprise: 99.99 // Custom deployment
            }
        };
        
        this.exportStats = {
            totalExports: 0,
            freeExports: 0,
            paidExports: 0,
            totalValueDelivered: 0,
            totalRevenue: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log('💰 Initializing Export Trigger - Value-First Monetization...');
        
        await this.loadExistingData();
        await this.loadValueThresholds();
        
        console.log('✅ Export Trigger ready - tracking value delivery');
    }
    
    async loadExistingData() {
        try {
            // Load export tracking data
            const trackingContent = await fs.readFile(this.exportTrackingPath, 'utf8');
            const trackingData = JSON.parse(trackingContent);
            
            this.exportStats = trackingData.stats || this.exportStats;
            
            console.log(`📊 Loaded export stats: ${this.exportStats.totalExports} total exports`);
        } catch {
            // Initialize empty tracking if file doesn't exist
            await this.saveExportTracking();
        }
        
        // Ensure billing directory exists
        const billingDir = path.dirname(this.billingDraftsPath);
        try {
            await fs.mkdir(billingDir, { recursive: true });
        } catch {
            // Directory already exists
        }
        
        // Ensure stripe directory exists
        const stripeDir = path.dirname(this.stripeEventsPath);
        try {
            await fs.mkdir(stripeDir, { recursive: true });
        } catch {
            // Directory already exists
        }
    }
    
    async loadValueThresholds() {
        try {
            const thresholdsContent = await fs.readFile(this.valueThresholdsPath, 'utf8');
            const customThresholds = JSON.parse(thresholdsContent);
            
            // Merge custom thresholds with defaults
            this.thresholds = { ...this.thresholds, ...customThresholds.thresholds };
            this.pricing = { ...this.pricing, ...customThresholds.pricing };
            
            console.log('⚙️ Custom value thresholds loaded');
        } catch {
            // Use defaults and create the file
            await this.saveValueThresholds();
        }
    }
    
    async trackExport(exportData) {
        console.log(`📦 Tracking export: ${exportData.type} for session ${exportData.sessionId}`);
        
        const { sessionId, type, format, agentId, metadata = {} } = exportData;
        
        // Get user's export history
        const userHistory = await this.getUserExportHistory(sessionId);
        
        // Calculate if this export should trigger payment
        const paymentDecision = await this.evaluatePaymentTrigger(userHistory, exportData);
        
        // Create export record
        const exportRecord = {
            id: crypto.randomBytes(8).toString('hex'),
            sessionId: sessionId,
            timestamp: new Date().toISOString(),
            type: type, // 'agent', 'workflow', 'fork', 'deployment'
            format: format, // 'json', 'zip', 'api', 'platform'
            agentId: agentId,
            metadata: metadata,
            paymentRequired: paymentDecision.paymentRequired,
            price: paymentDecision.price,
            freeReason: paymentDecision.freeReason,
            valueDelivered: paymentDecision.valueDelivered,
            thresholdStatus: paymentDecision.thresholdStatus
        };
        
        // Save export record
        await this.saveExportRecord(exportRecord);
        
        // Update statistics
        this.exportStats.totalExports++;
        this.exportStats.totalValueDelivered += paymentDecision.valueDelivered;
        
        if (paymentDecision.paymentRequired) {
            this.exportStats.paidExports++;
            
            // Trigger payment flow
            await this.triggerPaymentFlow(exportRecord);
        } else {
            this.exportStats.freeExports++;
            console.log(`🎁 Free export granted: ${paymentDecision.freeReason}`);
        }
        
        await this.saveExportTracking();
        
        return {
            exportId: exportRecord.id,
            paymentRequired: paymentDecision.paymentRequired,
            price: paymentDecision.price,
            message: paymentDecision.message,
            valueDelivered: paymentDecision.valueDelivered
        };
    }
    
    async evaluatePaymentTrigger(userHistory, exportData) {
        const { type, format } = exportData;
        
        // Count previous exports by type
        const agentExports = userHistory.filter(h => h.type === 'agent').length;
        const workflowExports = userHistory.filter(h => h.type === 'workflow').length;
        const forkExports = userHistory.filter(h => h.type === 'fork').length;
        const deploymentExports = userHistory.filter(h => h.type === 'deployment').length;
        
        // Calculate total value delivered to user
        const totalValueDelivered = userHistory.reduce((sum, h) => sum + (h.valueDelivered || 0), 0);
        
        let paymentRequired = false;
        let price = 0;
        let freeReason = null;
        let valueDelivered = 0;
        let message = '';
        
        // Determine value of this export
        switch (type) {
            case 'agent':
                valueDelivered = this.calculateAgentValue(format);
                
                if (agentExports < this.thresholds.agent_exports) {
                    freeReason = `Free agent export (${agentExports + 1}/${this.thresholds.agent_exports})`;
                    message = `You have ${this.thresholds.agent_exports - agentExports - 1} free agent exports remaining.`;
                } else {
                    paymentRequired = true;
                    price = this.pricing.agent_export[format] || 0;
                    message = `You've reached your free export limit. This ${format} export costs $${price}.`;
                }
                break;
                
            case 'workflow':
                valueDelivered = this.calculateWorkflowValue(format);
                
                if (workflowExports < this.thresholds.workflow_exports) {
                    freeReason = `Free workflow export (${workflowExports + 1}/${this.thresholds.workflow_exports})`;
                    message = `You have ${this.thresholds.workflow_exports - workflowExports - 1} free workflow exports remaining.`;
                } else {
                    paymentRequired = true;
                    price = this.pricing.workflow_export[format] || 0;
                    message = `Workflow export value proven. This ${format} export costs $${price}.`;
                }
                break;
                
            case 'fork':
                valueDelivered = this.calculateForkValue(format);
                
                if (forkExports < this.thresholds.forks_cloned) {
                    freeReason = `Free fork (${forkExports + 1}/${this.thresholds.forks_cloned})`;
                    message = `You have ${this.thresholds.forks_cloned - forkExports - 1} free forks remaining.`;
                } else {
                    paymentRequired = true;
                    price = this.pricing.fork_monetization[format] || 0;
                    message = `Fork limit reached. Commercial usage costs $${price}.`;
                }
                break;
                
            case 'deployment':
                valueDelivered = this.calculateDeploymentValue(format);
                
                if (deploymentExports < this.thresholds.deployments) {
                    freeReason = `Free deployment trial`;
                    message = `Free deployment to prove value. Future deployments will be charged.`;
                } else {
                    paymentRequired = true;
                    price = this.pricing.deployment_hosting[format] || 0;
                    message = `Deployment value proven. Hosting costs $${price}/month.`;
                }
                break;
        }
        
        // Override payment requirement if total value hasn't reached threshold
        if (totalValueDelivered + valueDelivered < this.thresholds.total_value_delivered) {
            paymentRequired = false;
            if (!freeReason) {
                freeReason = `Building value (delivered: $${totalValueDelivered + valueDelivered}/${this.thresholds.total_value_delivered})`;
                message = `Free while we build value together. $${this.thresholds.total_value_delivered - totalValueDelivered - valueDelivered} more value until monetization.`;
            }
        }
        
        return {
            paymentRequired,
            price,
            freeReason,
            valueDelivered,
            message,
            thresholdStatus: {
                agentExports: `${agentExports}/${this.thresholds.agent_exports}`,
                workflowExports: `${workflowExports}/${this.thresholds.workflow_exports}`,
                forkExports: `${forkExports}/${this.thresholds.forks_cloned}`,
                deploymentExports: `${deploymentExports}/${this.thresholds.deployments}`,
                totalValue: `$${totalValueDelivered}/$${this.thresholds.total_value_delivered}`
            }
        };
    }
    
    calculateAgentValue(format) {
        const values = {
            json: 5,    // Basic JSON export
            zip: 25,    // Packaged with dependencies
            api: 75,    // API integration ready
            platform: 200 // Full platform deployment
        };
        return values[format] || 10;
    }
    
    calculateWorkflowValue(format) {
        const values = {
            basic: 10,
            premium: 50,
            enterprise: 150
        };
        return values[format] || 20;
    }
    
    calculateForkValue(format) {
        const values = {
            personal: 0,      // Always free
            commercial: 75,   // Commercial usage
            enterprise: 250   // Enterprise deployment
        };
        return values[format] || 25;
    }
    
    calculateDeploymentValue(format) {
        const values = {
            starter: 25,    // Basic hosting
            pro: 75,        // Pro features
            enterprise: 200 // Custom deployment
        };
        return values[format] || 50;
    }
    
    async triggerPaymentFlow(exportRecord) {
        console.log(`💳 Triggering payment flow for export ${exportRecord.id}`);
        
        // Create invoice draft
        const invoiceDraft = {
            id: crypto.randomBytes(8).toString('hex'),
            exportId: exportRecord.id,
            sessionId: exportRecord.sessionId,
            timestamp: new Date().toISOString(),
            amount: exportRecord.price,
            currency: 'USD',
            description: `${exportRecord.type} export (${exportRecord.format})`,
            status: 'draft',
            paymentMethod: 'stripe',
            metadata: {
                type: exportRecord.type,
                format: exportRecord.format,
                agentId: exportRecord.agentId,
                valueDelivered: exportRecord.valueDelivered
            }
        };
        
        await this.saveInvoiceDraft(invoiceDraft);
        
        // Generate payment prompt for user
        const paymentPrompt = this.generatePaymentPrompt(exportRecord, invoiceDraft);
        
        console.log('💰 Payment prompt generated:');
        console.log(paymentPrompt);
        
        return {
            invoiceId: invoiceDraft.id,
            paymentPrompt: paymentPrompt,
            amount: exportRecord.price
        };
    }
    
    generatePaymentPrompt(exportRecord, invoiceDraft) {
        const prompts = {
            agent: `🎉 Your agent export was successful!\n\nYou've experienced the value of our platform. To make this permanent and support continued development:\n\n💰 **${exportRecord.format} Export: $${exportRecord.price}**\n\nThis payment ensures:\n✅ Permanent access to your exported agent\n✅ Future platform improvements\n✅ Priority support\n\nReady to make it official?`,
            
            workflow: `🚀 Workflow export complete!\n\nYou've seen how our system streamlines your process. To continue using this workflow:\n\n💰 **${exportRecord.format} Workflow: $${exportRecord.price}**\n\nValue delivered:\n✅ Time saved on repetitive tasks\n✅ Improved workflow efficiency\n✅ Custom automation\n\nWould you like to make this permanent?`,
            
            fork: `🔄 Fork deployment ready!\n\nYour customized version is working perfectly. For commercial usage:\n\n💰 **${exportRecord.format} License: $${exportRecord.price}**\n\nThis enables:\n✅ Commercial deployment rights\n✅ White-label usage\n✅ Enterprise support\n\nReady to go commercial?`,
            
            deployment: `🌐 Deployment successful!\n\nYour platform is live and delivering value. To continue hosting:\n\n💰 **${exportRecord.format} Hosting: $${exportRecord.price}/month**\n\nIncludes:\n✅ Reliable hosting infrastructure\n✅ Automatic updates\n✅ Technical support\n\nContinue with premium hosting?`
        };
        
        return prompts[exportRecord.type] || `Payment required: $${exportRecord.price} for ${exportRecord.type} export.`;
    }
    
    async processPayment(invoiceId, paymentData) {
        console.log(`💳 Processing payment for invoice ${invoiceId}`);
        
        try {
            // Load invoice draft
            const invoiceData = await this.loadInvoiceDrafts();
            const invoice = invoiceData.drafts.find(d => d.id === invoiceId);
            
            if (!invoice) {
                throw new Error('Invoice not found');
            }
            
            // Process with Stripe (simplified for demo)
            const paymentResult = await this.processStripePayment(invoice, paymentData);
            
            if (paymentResult.success) {
                // Update invoice status
                invoice.status = 'paid';
                invoice.paidAt = new Date().toISOString();
                invoice.stripePaymentId = paymentResult.paymentId;
                
                await this.saveInvoiceDrafts(invoiceData);
                
                // Update export record
                await this.markExportAsPaid(invoice.exportId);
                
                // Update revenue stats
                this.exportStats.totalRevenue += invoice.amount;
                await this.saveExportTracking();
                
                // Log payment event
                await this.logPaymentEvent(invoice, paymentResult);
                
                return {
                    success: true,
                    message: 'Payment successful! Your export is now permanently available.',
                    invoice: invoice
                };
            } else {
                throw new Error(paymentResult.error);
            }
            
        } catch (error) {
            console.log('❌ Payment processing failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async processStripePayment(invoice, paymentData) {
        // Simplified Stripe payment processing
        // In real implementation, this would use Stripe API
        
        console.log(`💳 Processing $${invoice.amount} payment via Stripe`);
        
        // Simulate payment processing
        const paymentId = `pi_${crypto.randomBytes(12).toString('hex')}`;
        
        // For demo purposes, assume payment succeeds
        return {
            success: true,
            paymentId: paymentId,
            amount: invoice.amount,
            currency: invoice.currency
        };
    }
    
    async getUserExportHistory(sessionId) {
        try {
            const trackingData = JSON.parse(await fs.readFile(this.exportTrackingPath, 'utf8'));
            return trackingData.exports?.filter(e => e.sessionId === sessionId) || [];
        } catch {
            return [];
        }
    }
    
    async saveExportRecord(exportRecord) {
        try {
            const trackingData = JSON.parse(await fs.readFile(this.exportTrackingPath, 'utf8'));
            
            if (!trackingData.exports) {
                trackingData.exports = [];
            }
            
            trackingData.exports.push(exportRecord);
            trackingData.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(this.exportTrackingPath, JSON.stringify(trackingData, null, 2));
        } catch (error) {
            console.log('❌ Error saving export record:', error.message);
        }
    }
    
    async saveExportTracking() {
        const trackingData = {
            stats: this.exportStats,
            lastUpdated: new Date().toISOString(),
            exports: []
        };
        
        try {
            const existingData = JSON.parse(await fs.readFile(this.exportTrackingPath, 'utf8'));
            trackingData.exports = existingData.exports || [];
        } catch {
            // File doesn't exist yet
        }
        
        await fs.writeFile(this.exportTrackingPath, JSON.stringify(trackingData, null, 2));
    }
    
    async saveValueThresholds() {
        const thresholdData = {
            thresholds: this.thresholds,
            pricing: this.pricing,
            lastUpdated: new Date().toISOString()
        };
        
        await fs.writeFile(this.valueThresholdsPath, JSON.stringify(thresholdData, null, 2));
    }
    
    async saveInvoiceDraft(invoiceDraft) {
        try {
            const invoiceData = await this.loadInvoiceDrafts();
            invoiceData.drafts.push(invoiceDraft);
            invoiceData.lastUpdated = new Date().toISOString();
            
            await this.saveInvoiceDrafts(invoiceData);
        } catch (error) {
            console.log('❌ Error saving invoice draft:', error.message);
        }
    }
    
    async loadInvoiceDrafts() {
        try {
            const content = await fs.readFile(this.billingDraftsPath, 'utf8');
            return JSON.parse(content);
        } catch {
            return {
                drafts: [],
                totalDrafts: 0,
                lastUpdated: new Date().toISOString()
            };
        }
    }
    
    async saveInvoiceDrafts(invoiceData) {
        await fs.writeFile(this.billingDraftsPath, JSON.stringify(invoiceData, null, 2));
    }
    
    async markExportAsPaid(exportId) {
        try {
            const trackingData = JSON.parse(await fs.readFile(this.exportTrackingPath, 'utf8'));
            
            const exportRecord = trackingData.exports?.find(e => e.id === exportId);
            if (exportRecord) {
                exportRecord.paid = true;
                exportRecord.paidAt = new Date().toISOString();
                
                await fs.writeFile(this.exportTrackingPath, JSON.stringify(trackingData, null, 2));
            }
        } catch (error) {
            console.log('❌ Error marking export as paid:', error.message);
        }
    }
    
    async logPaymentEvent(invoice, paymentResult) {
        try {
            let paymentEvents = { events: [] };
            
            try {
                const content = await fs.readFile(this.stripeEventsPath, 'utf8');
                paymentEvents = JSON.parse(content);
            } catch {
                // File doesn't exist yet
            }
            
            const paymentEvent = {
                id: crypto.randomBytes(8).toString('hex'),
                timestamp: new Date().toISOString(),
                type: 'payment_success',
                invoiceId: invoice.id,
                exportId: invoice.exportId,
                sessionId: invoice.sessionId,
                amount: invoice.amount,
                stripePaymentId: paymentResult.paymentId,
                metadata: invoice.metadata
            };
            
            paymentEvents.events.push(paymentEvent);
            paymentEvents.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(this.stripeEventsPath, JSON.stringify(paymentEvents, null, 2));
            
        } catch (error) {
            console.log('❌ Error logging payment event:', error.message);
        }
    }
    
    async getExportStats() {
        return {
            ...this.exportStats,
            thresholds: this.thresholds,
            pricing: this.pricing,
            revenuePerExport: this.exportStats.paidExports > 0 ? 
                this.exportStats.totalRevenue / this.exportStats.paidExports : 0,
            conversionRate: this.exportStats.totalExports > 0 ? 
                this.exportStats.paidExports / this.exportStats.totalExports : 0
        };
    }
}

module.exports = ExportTrigger;