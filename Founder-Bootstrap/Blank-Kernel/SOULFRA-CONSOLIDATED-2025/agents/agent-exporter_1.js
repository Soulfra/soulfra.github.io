// Agent Exporter - Exports agents with Stripe payment processing
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class AgentExporter {
    constructor() {
        this.exportPath = path.join(__dirname, 'vault/exports');
        this.trackerPath = path.join(__dirname, 'vault/exports/export-tracker.json');
        this.stripeConfigPath = path.join(__dirname, 'vault/stripe-connect.json');
        this.tier13Path = path.join(__dirname, 'tier-13');
        this.vaultLogsPath = path.join(__dirname, 'vault-sync-core/logs');
        
        this.exportFormats = {
            json: {
                name: 'JSON Configuration',
                description: 'Raw agent configuration in JSON format',
                price: 2.00,
                complexity: 'simple'
            },
            zip: {
                name: 'ZIP Package',
                description: 'Complete deployment package with runtime',
                price: 5.00,
                complexity: 'medium'
            },
            api: {
                name: 'API Wrapper',
                description: 'Ready-to-deploy API service wrapper',
                price: 10.00,
                complexity: 'complex'
            },
            platform: {
                name: 'Platform Clone',
                description: 'Full MirrorOS instance with agent',
                price: 25.00,
                complexity: 'enterprise'
            }
        };
        
        this.platformFee = 0.08; // 8% platform fee
        
        this.init();
    }

    async init() {
        console.log('💰 Initializing Agent Exporter...');
        
        await this.ensureDirectories();
        await this.loadExportTracker();
        await this.loadStripeConfig();
        
        console.log('✅ Agent Exporter ready');
    }

    async ensureDirectories() {
        const dirs = [
            this.exportPath,
            this.tier13Path,
            this.vaultLogsPath
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async loadExportTracker() {
        try {
            const trackerContent = await fs.readFile(this.trackerPath, 'utf8');
            this.exportTracker = JSON.parse(trackerContent);
        } catch {
            this.exportTracker = {
                totalExports: 0,
                totalRevenue: 0,
                totalPlatformFees: 0,
                exports: [],
                created: new Date().toISOString()
            };
            await this.saveExportTracker();
        }
    }

    async saveExportTracker() {
        await fs.writeFile(this.trackerPath, JSON.stringify(this.exportTracker, null, 2));
    }

    async loadStripeConfig() {
        try {
            const configContent = await fs.readFile(this.stripeConfigPath, 'utf8');
            this.stripeConfig = JSON.parse(configContent);
        } catch {
            this.stripeConfig = {
                connected: false,
                secretKey: null,
                publishableKey: null,
                webhookSecret: null,
                accountId: null
            };
            await fs.writeFile(this.stripeConfigPath, JSON.stringify(this.stripeConfig, null, 2));
        }
    }

    async exportAgent(agentId, format, options = {}) {
        console.log(`📤 Exporting agent ${agentId} as ${format}`);
        
        const exportId = `export-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const formatConfig = this.exportFormats[format];
        
        if (!formatConfig) {
            throw new Error(`Unknown export format: ${format}`);
        }
        
        // Load agent data
        const agentData = await this.loadAgentData(agentId);
        
        // Calculate pricing
        const pricing = this.calculatePricing(formatConfig, options);
        
        // Create export package
        const exportPackage = await this.createExportPackage(agentData, format, options);
        
        // Process payment if required
        let paymentResult = null;
        if (pricing.totalCost > 0) {
            paymentResult = await this.processPayment(exportId, pricing, options.paymentMethod);
        }
        
        // Save export
        const exportRecord = {
            id: exportId,
            agentId: agentId,
            agentName: agentData.name,
            format: format,
            pricing: pricing,
            payment: paymentResult,
            options: options,
            created: new Date().toISOString(),
            status: paymentResult ? paymentResult.status : 'completed',
            downloadPath: `${exportId}.${this.getFileExtension(format)}`
        };
        
        await this.saveExport(exportRecord, exportPackage);
        await this.updateTracker(exportRecord);
        await this.logPlatformIncome(pricing.platformFee, exportId);
        
        // Log to vault
        await this.logToVault('export', 'agent_exported', {
            exportId: exportId,
            agentId: agentId,
            format: format,
            price: pricing.totalCost,
            platformFee: pricing.platformFee
        });
        
        console.log(`✅ Export completed: ${exportId}`);
        
        return {
            exportId: exportId,
            downloadUrl: `/api/download/${exportId}`,
            pricing: pricing,
            payment: paymentResult,
            status: exportRecord.status
        };
    }

    async loadAgentData(agentId) {
        // Try custom agents first
        let agentPath = path.join(__dirname, 'vault/agents/custom', `${agentId}.json`);
        
        try {
            const agentContent = await fs.readFile(agentPath, 'utf8');
            return JSON.parse(agentContent);
        } catch {
            // Try imported agents
            agentPath = path.join(__dirname, 'vault/agents/imported', `${agentId}.json`);
            try {
                const agentContent = await fs.readFile(agentPath, 'utf8');
                return JSON.parse(agentContent);
            } catch {
                throw new Error(`Agent ${agentId} not found`);
            }
        }
    }

    calculatePricing(formatConfig, options) {
        let baseCost = formatConfig.price;
        let platformFee = baseCost * this.platformFee;
        
        // Add vault expansion cost
        if (options.includeVault) {
            baseCost += 10.00; // Vault expansion fee
            platformFee = baseCost * this.platformFee;
        }
        
        // Add secrets handling cost
        if (options.includeSecrets) {
            baseCost += 5.00; // Secrets handling fee
            platformFee = baseCost * this.platformFee;
        }
        
        const totalCost = baseCost + platformFee;
        
        return {
            baseCost: baseCost,
            platformFee: platformFee,
            totalCost: totalCost,
            currency: 'USD'
        };
    }

    async createExportPackage(agentData, format, options) {
        console.log(`📦 Creating ${format} package for ${agentData.name}`);
        
        switch (format) {
            case 'json':
                return this.createJSONExport(agentData, options);
            case 'zip':
                return this.createZIPExport(agentData, options);
            case 'api':
                return this.createAPIExport(agentData, options);
            case 'platform':
                return this.createPlatformExport(agentData, options);
            default:
                throw new Error(`Unknown format: ${format}`);
        }
    }

    async createJSONExport(agentData, options) {
        const exportData = {
            ...agentData,
            exported: new Date().toISOString(),
            format: 'json',
            mirrorOS: {
                version: '1.0.0',
                compatible: true,
                vaultIntegration: agentData.vaultIntegration
            }
        };
        
        if (options.includeVault) {
            exportData.vaultConfig = await this.getVaultConfig();
        }
        
        return JSON.stringify(exportData, null, 2);
    }

    async createZIPExport(agentData, options) {
        // For demo purposes, return a structured package description
        // In production, this would create an actual ZIP file
        const packageStructure = {
            'agent.json': await this.createJSONExport(agentData, options),
            'runtime.js': await this.getRuntimeCode(agentData.id),
            'package.json': JSON.stringify({
                name: `mirroros-agent-${agentData.id}`,
                version: '1.0.0',
                description: agentData.description,
                main: 'runtime.js',
                dependencies: {
                    'express': '^4.18.0',
                    'cors': '^2.8.5'
                }
            }, null, 2),
            'README.md': this.generateREADME(agentData),
            'start.sh': this.generateStartScript(agentData)
        };
        
        if (options.includeVault) {
            packageStructure['vault-config.json'] = JSON.stringify(await this.getVaultConfig(), null, 2);
        }
        
        return JSON.stringify(packageStructure, null, 2);
    }

    async createAPIExport(agentData, options) {
        const apiWrapper = `// MirrorOS Agent API Wrapper for ${agentData.name}
const express = require('express');
const cors = require('cors');

class ${this.toCamelCase(agentData.name)}API {
    constructor() {
        this.app = express();
        this.agentConfig = ${JSON.stringify(agentData, null, 8)};
        this.setupMiddleware();
        this.setupRoutes();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                agent: this.agentConfig.name,
                version: '1.0.0',
                timestamp: new Date().toISOString()
            });
        });

        // Main chat endpoint
        this.app.post('/chat', async (req, res) => {
            try {
                const { message, sessionId = 'default' } = req.body;
                
                // Process message through agent
                const response = await this.processMessage(message, sessionId);
                
                res.json({
                    success: true,
                    response: response,
                    agent: this.agentConfig.name,
                    sessionId: sessionId
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message
                });
            }
        });

        // Agent info endpoint
        this.app.get('/agent', (req, res) => {
            res.json({
                id: this.agentConfig.id,
                name: this.agentConfig.name,
                description: this.agentConfig.description,
                capabilities: this.agentConfig.capabilities,
                type: this.agentConfig.type
            });
        });
    }

    async processMessage(message, sessionId) {
        // Simulate agent processing
        const systemPrompt = this.agentConfig.systemPrompt;
        const fullPrompt = systemPrompt + '\\n\\nUser: ' + message;
        
        // In production, this would route through MirrorRouter
        return \`[\${this.agentConfig.name}]: I've processed your message "\${message.substring(0, 30)}..." through the exported API wrapper. This is a simulation - connect to MirrorOS for full functionality.\`;
    }

    start(port = 3000) {
        this.app.listen(port, () => {
            console.log(\`🚀 \${this.agentConfig.name} API running on port \${port}\`);
            console.log(\`📖 Documentation: http://localhost:\${port}/agent\`);
            console.log(\`💬 Chat endpoint: POST http://localhost:\${port}/chat\`);
        });
    }
}

// Export and auto-start
const api = new ${this.toCamelCase(agentData.name)}API();

if (require.main === module) {
    api.start();
}

module.exports = ${this.toCamelCase(agentData.name)}API;
`;

        return apiWrapper;
    }

    async createPlatformExport(agentData, options) {
        const platformConfig = {
            platform: 'MirrorOS Clone',
            version: '1.0.0',
            agent: agentData,
            features: {
                dashboard: true,
                vaultIntegration: true,
                apiEndpoints: true,
                stripeIntegration: options.includeSecrets,
                fullMirrorRouter: true
            },
            deployment: {
                type: 'standalone',
                requirements: ['Node.js 14+', 'Redis (optional)', 'PostgreSQL (optional)'],
                ports: [3000, 8888],
                environment: options.includeSecrets ? 'production-ready' : 'demo-mode'
            },
            structure: {
                'package.json': 'Platform dependencies',
                'server.js': 'Main platform server',
                'dashboard/': 'Complete MirrorOS dashboard',
                'api/': 'Full API handlers',
                'router/': 'MirrorRouter system',
                'vault/': 'Agent vault integration',
                'agent/': 'Your exported agent',
                'docs/': 'Complete documentation'
            },
            notes: [
                'This is a complete MirrorOS platform clone',
                'Your agent is pre-integrated and ready to use',
                'Vault system is fully functional',
                'Stripe integration requires your own keys',
                'Platform fee (8%) applies to all transactions'
            ]
        };
        
        return JSON.stringify(platformConfig, null, 2);
    }

    async processPayment(exportId, pricing, paymentMethod = 'credits') {
        console.log(`💳 Processing payment for export ${exportId}`);
        
        if (paymentMethod === 'credits') {
            // Simulate credit payment
            return {
                method: 'credits',
                amount: pricing.totalCost,
                status: 'succeeded',
                transactionId: `cred-${Date.now()}`,
                timestamp: new Date().toISOString()
            };
        } else if (paymentMethod === 'stripe') {
            // Simulate Stripe payment
            return await this.processStripePayment(exportId, pricing);
        } else {
            // Invoice/Bill later
            return {
                method: 'invoice',
                amount: pricing.totalCost,
                status: 'pending',
                invoiceId: `inv-${Date.now()}`,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };
        }
    }

    async processStripePayment(exportId, pricing) {
        // Simulate Stripe payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const paymentIntentId = `pi_${crypto.randomBytes(16).toString('hex')}`;
        
        return {
            method: 'stripe',
            amount: pricing.totalCost,
            status: 'succeeded',
            paymentIntentId: paymentIntentId,
            stripeAccount: this.stripeConfig.accountId,
            platformFee: pricing.platformFee,
            timestamp: new Date().toISOString()
        };
    }

    async saveExport(exportRecord, exportPackage) {
        const exportFilePath = path.join(this.exportPath, exportRecord.downloadPath);
        await fs.writeFile(exportFilePath, exportPackage);
        
        const metadataPath = path.join(this.exportPath, `${exportRecord.id}-metadata.json`);
        await fs.writeFile(metadataPath, JSON.stringify(exportRecord, null, 2));
    }

    async updateTracker(exportRecord) {
        this.exportTracker.totalExports++;
        this.exportTracker.totalRevenue += exportRecord.pricing.baseCost;
        this.exportTracker.totalPlatformFees += exportRecord.pricing.platformFee;
        this.exportTracker.exports.push({
            id: exportRecord.id,
            agentId: exportRecord.agentId,
            format: exportRecord.format,
            price: exportRecord.pricing.totalCost,
            created: exportRecord.created
        });
        
        // Keep only last 1000 exports in tracker
        if (this.exportTracker.exports.length > 1000) {
            this.exportTracker.exports = this.exportTracker.exports.slice(-1000);
        }
        
        await this.saveExportTracker();
    }

    async logPlatformIncome(platformFee, source) {
        const incomePath = path.join(this.tier13Path, 'platform-export-income.json');
        
        let income = { total: 0, transactions: [] };
        try {
            const existing = await fs.readFile(incomePath, 'utf8');
            income = JSON.parse(existing);
        } catch {
            // New income log
        }
        
        income.total += platformFee;
        income.transactions.push({
            amount: platformFee,
            source: source,
            type: 'export_fee',
            timestamp: new Date().toISOString()
        });
        
        await fs.writeFile(incomePath, JSON.stringify(income, null, 2));
    }

    async getRuntimeCode(agentId) {
        const runtimePath = path.join(__dirname, 'vault/agents/custom', `${agentId}-runtime.js`);
        
        try {
            return await fs.readFile(runtimePath, 'utf8');
        } catch {
            return `// Runtime code for agent ${agentId} not found\n// This would contain the agent execution logic`;
        }
    }

    async getVaultConfig() {
        return {
            vaultIntegration: true,
            mirrorRouter: true,
            defaultKeys: false,
            encryption: true,
            logging: true
        };
    }

    generateREADME(agentData) {
        return `# ${agentData.name}

${agentData.description}

## Installation

\`\`\`bash
npm install
\`\`\`

## Usage

\`\`\`bash
npm start
\`\`\`

## Configuration

Update your API keys in \`.env.local\`:

\`\`\`
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
\`\`\`

## Capabilities

${agentData.capabilities.map(cap => `- ${cap}`).join('\n')}

## MirrorOS Integration

This agent is exported from MirrorOS and maintains vault integration.
`;
    }

    generateStartScript(agentData) {
        return `#!/bin/bash
echo "Starting ${agentData.name}..."
node runtime.js
`;
    }

    getFileExtension(format) {
        const extensions = {
            json: 'json',
            zip: 'zip',
            api: 'js',
            platform: 'tar.gz'
        };
        
        return extensions[format] || 'txt';
    }

    toCamelCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    }

    async logToVault(module, action, data) {
        const logPath = path.join(this.vaultLogsPath, 'export-activity.log');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            module: module,
            action: action,
            data: data
        };

        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\n');
    }

    async getExportHistory(limit = 50) {
        return this.exportTracker.exports.slice(-limit).reverse();
    }

    async getExportStats() {
        return {
            totalExports: this.exportTracker.totalExports,
            totalRevenue: this.exportTracker.totalRevenue,
            totalPlatformFees: this.exportTracker.totalPlatformFees,
            averageExportValue: this.exportTracker.totalExports > 0 ? 
                this.exportTracker.totalRevenue / this.exportTracker.totalExports : 0,
            formatBreakdown: this.exportTracker.exports.reduce((acc, exp) => {
                acc[exp.format] = (acc[exp.format] || 0) + 1;
                return acc;
            }, {}),
            stripeConnected: this.stripeConfig.connected
        };
    }
}

module.exports = AgentExporter;

// Example usage
if (require.main === module) {
    const exporter = new AgentExporter();
    
    setTimeout(async () => {
        console.log('\n🧪 Testing Agent Exporter...');
        
        const stats = await exporter.getExportStats();
        console.log('\n📊 Export Stats:', stats);
        
        // Test export (would need a real agent ID)
        // const result = await exporter.exportAgent('test-agent-id', 'json');
        // console.log('Export Result:', result);
    }, 1000);
}