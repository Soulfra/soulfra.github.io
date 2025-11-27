// Stripe Export Trigger - Detects export intent and manages monetization flow
const stripe = require('stripe');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class StripeExportTrigger {
    constructor(config = {}) {
        this.stripeKey = process.env.STRIPE_SECRET_KEY || config.stripeKey;
        this.stripe = this.stripeKey ? stripe(this.stripeKey) : null;
        
        this.exportPath = path.join(__dirname, '../../vault/exports');
        this.pricingPath = path.join(__dirname, '../../vault/pricing.json');
        
        this.triggers = {
            agentForkCount: 3,      // Trigger after 3 forks
            exportAttempts: 5,      // Trigger after 5 export attempts
            sessionDuration: 1800000, // 30 minutes of active use
            complexityScore: 0.7    // High complexity agents
        };
        
        this.pricing = {
            singleExport: 4.99,
            bundleExport: 19.99,
            monthlyUnlimited: 49.99,
            agentMarketplace: 0.3  // 30% revenue share
        };
    }
    
    async detectExportIntent(sessionId, activity) {
        console.log('💰 Checking export intent for session:', sessionId);
        
        const triggers = [];
        
        // Check reflection depth (new metric)
        if (activity.reflectionCount >= 5) {
            triggers.push({
                type: 'reflection_depth',
                value: activity.reflectionCount,
                message: "Your reflections have grown deep"
            });
        }
        
        // Check fork count
        if (activity.forkCount >= this.triggers.agentForkCount) {
            triggers.push({
                type: 'fork_threshold',
                value: activity.forkCount,
                message: "You've evolved your thoughts"
            });
        }
        
        // Check export attempts
        if (activity.exportAttempts >= this.triggers.exportAttempts) {
            triggers.push({
                type: 'export_attempts',
                value: activity.exportAttempts,
                message: "You want to keep this"
            });
        }
        
        // Check session duration
        if (activity.sessionDuration >= this.triggers.sessionDuration) {
            triggers.push({
                type: 'session_duration',
                value: activity.sessionDuration,
                message: "You've spent meaningful time here"
            });
        }
        
        // Check agent complexity
        if (activity.agentComplexity >= this.triggers.complexityScore) {
            triggers.push({
                type: 'complexity',
                value: activity.agentComplexity,
                message: "Your creation has depth"
            });
        }
        
        if (triggers.length > 0) {
            return {
                shouldPrompt: true,
                triggers: triggers,
                recommendation: this.generateRecommendation(triggers, activity),
                pricing: await this.getPricingOptions(activity),
                emotional: true
            };
        }
        
        return { shouldPrompt: false };
    }
    
    generateRecommendation(triggers, activity) {
        const primaryTrigger = triggers[0];
        
        if (primaryTrigger.type === 'fork_threshold') {
            return {
                title: "You've built something unique",
                message: "Want to keep it or share it?",
                emphasis: "Your reflections have evolved into something special",
                cta: "Save Your Creation",
                emotional: true,
                icon: "✨"
            };
        }
        
        if (primaryTrigger.type === 'export_attempts') {
            return {
                title: "Ready to take this with you?",
                message: "Your reflection deserves to be preserved",
                emphasis: "This stays with you. Forever.",
                cta: "Complete Export",
                emotional: true,
                icon: "💫"
            };
        }
        
        if (primaryTrigger.type === 'complexity') {
            return {
                title: "This reflection has depth",
                message: "You've created something meaningful",
                emphasis: "Don't let this wisdom disappear",
                cta: "Preserve Your Agent",
                emotional: true,
                icon: "🌟"
            };
        }
        
        return {
            title: "Your thoughts matter",
            message: "Save this reflection as your personal agent",
            emphasis: "Keep what you've discovered",
            cta: "Export Now",
            emotional: true,
            icon: "💎"
        };
    }
    
    async getPricingOptions(activity) {
        const options = [];
        
        // Single export option
        options.push({
            id: 'single_export',
            name: 'Single Export',
            description: 'Export this agent with full source code',
            price: this.pricing.singleExport,
            features: [
                'Complete agent export',
                'Source code included',
                'JSON & YAML formats',
                'Webhook integration',
                'Email delivery'
            ],
            recommended: activity.forkCount === 1
        });
        
        // Bundle option
        if (activity.forkCount > 1) {
            options.push({
                id: 'bundle_export',
                name: 'Bundle Export',
                description: `Export all ${activity.forkCount} agent versions`,
                price: this.pricing.bundleExport,
                features: [
                    `All ${activity.forkCount} agent versions`,
                    'Version history included',
                    'Bulk download',
                    'API access for 30 days',
                    'Priority support'
                ],
                recommended: true,
                savings: (activity.forkCount * this.pricing.singleExport) - this.pricing.bundleExport
            });
        }
        
        // Monthly unlimited
        options.push({
            id: 'monthly_unlimited',
            name: 'Monthly Unlimited',
            description: 'Unlimited exports & premium features',
            price: this.pricing.monthlyUnlimited,
            features: [
                'Unlimited exports',
                'Agent marketplace access',
                'Advanced analytics',
                'Team collaboration',
                'White-label options',
                'API & webhooks'
            ],
            recommended: activity.exportAttempts > 10
        });
        
        // Marketplace option
        if (activity.agentComplexity > 0.8) {
            options.push({
                id: 'marketplace_listing',
                name: 'Marketplace Listing',
                description: 'Sell your agent to other builders',
                price: 0,
                revenueShare: this.pricing.agentMarketplace,
                features: [
                    'List on agent marketplace',
                    '70% revenue share',
                    'Automated licensing',
                    'Usage analytics',
                    'Customer support handled'
                ],
                special: true
            });
        }
        
        return options;
    }
    
    async createCheckoutSession(sessionId, priceOption, agentData) {
        if (!this.stripe) {
            console.error('Stripe not configured');
            return { error: 'Payment system not configured' };
        }
        
        try {
            // Create or retrieve customer
            const customer = await this.getOrCreateCustomer(sessionId);
            
            // Create line items
            const lineItems = [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: priceOption.name,
                        description: priceOption.description,
                        metadata: {
                            sessionId: sessionId,
                            agentId: agentData.agentId,
                            optionId: priceOption.id
                        }
                    },
                    unit_amount: Math.round(priceOption.price * 100)
                },
                quantity: 1
            }];
            
            // Create checkout session
            const session = await this.stripe.checkout.sessions.create({
                customer: customer.id,
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: priceOption.id === 'monthly_unlimited' ? 'subscription' : 'payment',
                success_url: `${process.env.BASE_URL}/export/success?session={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.BASE_URL}/export/cancel`,
                metadata: {
                    sessionId: sessionId,
                    agentId: agentData.agentId,
                    agentName: agentData.name,
                    exportType: priceOption.id,
                    forkCount: agentData.forkCount || 1
                }
            });
            
            // Log checkout creation
            await this.logExportIntent({
                sessionId: sessionId,
                checkoutId: session.id,
                priceOption: priceOption,
                agentData: agentData,
                created: new Date().toISOString()
            });
            
            return {
                success: true,
                checkoutUrl: session.url,
                sessionId: session.id
            };
            
        } catch (error) {
            console.error('Stripe checkout error:', error);
            return {
                error: 'Failed to create checkout session',
                details: error.message
            };
        }
    }
    
    async getOrCreateCustomer(sessionId) {
        // Check if customer exists
        const customers = await this.stripe.customers.list({
            limit: 1,
            email: `${sessionId}@mirroros.local`
        });
        
        if (customers.data.length > 0) {
            return customers.data[0];
        }
        
        // Create new customer
        return await this.stripe.customers.create({
            email: `${sessionId}@mirroros.local`,
            metadata: {
                sessionId: sessionId,
                created: new Date().toISOString()
            }
        });
    }
    
    async handleWebhook(event) {
        // Handle Stripe webhooks
        switch (event.type) {
            case 'checkout.session.completed':
                return await this.handleCheckoutComplete(event.data.object);
                
            case 'customer.subscription.created':
                return await this.handleSubscriptionCreated(event.data.object);
                
            case 'payment_intent.succeeded':
                return await this.handlePaymentSuccess(event.data.object);
                
            default:
                console.log(`Unhandled webhook type: ${event.type}`);
        }
    }
    
    async handleCheckoutComplete(session) {
        console.log('✅ Checkout completed:', session.id);
        
        const metadata = session.metadata;
        
        // Generate export package
        const exportPackage = await this.generateExportPackage({
            sessionId: metadata.sessionId,
            agentId: metadata.agentId,
            exportType: metadata.exportType,
            forkCount: parseInt(metadata.forkCount) || 1
        });
        
        // Save export record
        await this.saveExportRecord({
            checkoutId: session.id,
            customerId: session.customer,
            sessionId: metadata.sessionId,
            exportPackage: exportPackage,
            completed: new Date().toISOString()
        });
        
        // Send export via email (if configured)
        if (session.customer_email) {
            await this.sendExportEmail(session.customer_email, exportPackage);
        }
        
        return { success: true, exportId: exportPackage.id };
    }
    
    async generateExportPackage(options) {
        const exportId = `exp_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
        const exportDir = path.join(this.exportPath, exportId);
        
        await fs.mkdir(exportDir, { recursive: true });
        
        // Load agent data
        const agentData = await this.loadAgentData(options.agentId);
        
        // Create export files
        const files = [];
        
        // Main agent file
        const mainFile = path.join(exportDir, 'agent.json');
        await fs.writeFile(mainFile, JSON.stringify(agentData, null, 2));
        files.push('agent.json');
        
        // README
        const readme = this.generateReadme(agentData, options);
        await fs.writeFile(path.join(exportDir, 'README.md'), readme);
        files.push('README.md');
        
        // License
        const license = this.generateLicense(options);
        await fs.writeFile(path.join(exportDir, 'LICENSE'), license);
        files.push('LICENSE');
        
        // Integration examples
        const examples = this.generateIntegrationExamples(agentData);
        await fs.writeFile(path.join(exportDir, 'examples.js'), examples);
        files.push('examples.js');
        
        // Create manifest
        const manifest = {
            id: exportId,
            created: new Date().toISOString(),
            version: '1.0.0',
            agent: {
                id: agentData.id,
                name: agentData.name,
                version: agentData.version
            },
            files: files,
            checksum: this.generateChecksum(agentData)
        };
        
        await fs.writeFile(
            path.join(exportDir, 'manifest.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        return {
            id: exportId,
            path: exportDir,
            manifest: manifest,
            downloadUrl: `/api/export/download/${exportId}`
        };
    }
    
    async loadAgentData(agentId) {
        // Load from vault
        try {
            const agentPath = path.join(__dirname, '../../vault/agents', `${agentId}.json`);
            return JSON.parse(await fs.readFile(agentPath, 'utf-8'));
        } catch {
            // Return mock data for demo
            return {
                id: agentId,
                name: 'Exported Agent',
                version: '1.0.0',
                personality: { traits: ['helpful', 'creative'] },
                capabilities: ['reflection', 'analysis'],
                systemPrompt: 'You are a helpful assistant.',
                created: new Date().toISOString()
            };
        }
    }
    
    generateReadme(agentData, options) {
        return `# ${agentData.name}

## Overview
This is your exported MirrorOS agent, ready for integration into your projects.

### Agent Details
- **ID**: ${agentData.id}
- **Version**: ${agentData.version}
- **Export Type**: ${options.exportType}
- **Created**: ${agentData.created}

## Installation

\`\`\`bash
npm install @mirroros/agent-runtime
\`\`\`

## Usage

\`\`\`javascript
const { AgentRuntime } = require('@mirroros/agent-runtime');
const agent = require('./agent.json');

const runtime = new AgentRuntime();
await runtime.load(agent);

const response = await runtime.chat('Hello!');
console.log(response);
\`\`\`

## Features
${agentData.capabilities.map(cap => `- ${cap}`).join('\n')}

## Personality Traits
${agentData.personality.traits.map(trait => `- ${trait}`).join('\n')}

## License
See LICENSE file for details.

## Support
Visit docs.mirroros.com for documentation and support.
`;
    }
    
    generateLicense(options) {
        if (options.exportType === 'marketplace_listing') {
            return `MirrorOS Marketplace License

This agent is licensed for use through the MirrorOS Marketplace.
Revenue sharing: 70% to creator, 30% to platform.

For full terms, visit: mirroros.com/marketplace/terms
`;
        }
        
        return `MIT License

Copyright (c) ${new Date().getFullYear()} MirrorOS Agent Export

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;
    }
    
    generateIntegrationExamples(agentData) {
        return `// MirrorOS Agent Integration Examples

// Example 1: Basic Chat
const agent = require('./agent.json');

async function basicChat() {
    const response = await callAgent(agent, 'Tell me about yourself');
    console.log(response);
}

// Example 2: With Context
async function chatWithContext() {
    const context = {
        user: 'developer',
        intent: 'integration',
        previousMessages: []
    };
    
    const response = await callAgent(agent, 'How do I integrate you?', context);
    console.log(response);
}

// Example 3: Webhook Integration
const express = require('express');
const app = express();

app.post('/agent/chat', async (req, res) => {
    const { message } = req.body;
    const response = await callAgent(agent, message);
    res.json({ response });
});

// Example 4: Streaming Responses
async function streamChat(prompt) {
    const stream = await callAgentStream(agent, prompt);
    
    for await (const chunk of stream) {
        process.stdout.write(chunk);
    }
}

// Helper function (implement based on your runtime)
async function callAgent(agent, prompt, context = {}) {
    // Your implementation here
    return \`Agent ${agent.name} responds to: \${prompt}\`;
}

module.exports = { agent, basicChat, chatWithContext, streamChat };
`;
    }
    
    generateChecksum(data) {
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(data))
            .digest('hex');
    }
    
    async logExportIntent(data) {
        const logPath = path.join(this.exportPath, 'export-intents.json');
        
        let intents = [];
        try {
            intents = JSON.parse(await fs.readFile(logPath, 'utf-8'));
        } catch {
            // New file
        }
        
        intents.push(data);
        
        // Keep last 1000 intents
        if (intents.length > 1000) {
            intents = intents.slice(-1000);
        }
        
        await fs.writeFile(logPath, JSON.stringify(intents, null, 2));
    }
    
    async saveExportRecord(record) {
        const recordPath = path.join(this.exportPath, 'completed-exports.json');
        
        let records = [];
        try {
            records = JSON.parse(await fs.readFile(recordPath, 'utf-8'));
        } catch {
            // New file
        }
        
        records.push(record);
        
        await fs.writeFile(recordPath, JSON.stringify(records, null, 2));
    }
    
    async sendExportEmail(email, exportPackage) {
        // In production, integrate with email service
        console.log(`Would send export ${exportPackage.id} to ${email}`);
    }
    
    async getExportAnalytics(period = 'week') {
        const recordPath = path.join(this.exportPath, 'completed-exports.json');
        
        try {
            const records = JSON.parse(await fs.readFile(recordPath, 'utf-8'));
            
            const now = Date.now();
            const periodMs = {
                day: 86400000,
                week: 604800000,
                month: 2592000000
            };
            
            const cutoff = now - (periodMs[period] || periodMs.week);
            const relevantRecords = records.filter(
                r => new Date(r.completed).getTime() > cutoff
            );
            
            return {
                period: period,
                totalExports: relevantRecords.length,
                revenue: relevantRecords.reduce((sum, r) => sum + (r.price || 0), 0),
                popularTypes: this.aggregateTypes(relevantRecords),
                averageAgentComplexity: this.calculateAverageComplexity(relevantRecords)
            };
        } catch {
            return {
                period: period,
                totalExports: 0,
                revenue: 0,
                popularTypes: {},
                averageAgentComplexity: 0
            };
        }
    }
    
    aggregateTypes(records) {
        const types = {};
        records.forEach(r => {
            const type = r.exportType || 'unknown';
            types[type] = (types[type] || 0) + 1;
        });
        return types;
    }
    
    calculateAverageComplexity(records) {
        if (records.length === 0) return 0;
        
        const total = records.reduce((sum, r) => 
            sum + (r.agentComplexity || 0), 0
        );
        
        return total / records.length;
    }
}

module.exports = StripeExportTrigger;