// MirrorOS Export Handler - Track and monetize exports
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const UsageMonitor = require('./usage-monitor');

class ExportHandler {
    constructor() {
        this.exportLogPath = path.join(__dirname, '../vault/logs/export-records.json');
        this.pricingPath = path.join(__dirname, 'pricing-tier.json');
        this.usageMonitor = new UsageMonitor();
    }

    async init() {
        await this.usageMonitor.init();
        
        // Ensure export log exists
        try {
            await fs.access(this.exportLogPath);
        } catch {
            await fs.writeFile(this.exportLogPath, JSON.stringify({
                version: "1.0.0",
                totalExports: 0,
                totalRevenue: 0,
                byType: {
                    agent: { count: 0, revenue: 0 },
                    automation: { count: 0, revenue: 0 },
                    template: { count: 0, revenue: 0 },
                    platform: { count: 0, revenue: 0 }
                },
                records: []
            }, null, 2));
        }
    }

    async trackExport(params) {
        const {
            type, // 'agent', 'automation', 'template', 'platform'
            itemId,
            userId = 'anonymous',
            format = 'json',
            includeVault = false,
            includeSecrets = false,
            paymentMethod = 'credits' // 'credits', 'stripe', 'invoice'
        } = params;

        // Load item data
        const itemData = await this.loadExportItem(type, itemId);
        
        // Calculate complexity and cost
        const complexity = this.calculateComplexity(itemData, type);
        const tokensUsed = await this.estimateTokensUsed(itemData);
        const cost = await this.calculateExportCost(type, complexity, includeVault);

        // Generate export record
        const exportRecord = {
            uuid: this.generateUUID(),
            timestamp: new Date().toISOString(),
            type: type,
            itemId: itemId,
            userId: userId,
            format: format,
            complexity: complexity,
            tokensUsed: tokensUsed,
            cost: cost,
            paymentMethod: paymentMethod,
            options: {
                includeVault,
                includeSecrets
            },
            vaultOrigin: itemData.vaultOrigin || 'tier-0',
            mirrorSignature: this.generateExportSignature(itemData),
            reflectionCredits: Math.floor(cost * 10), // 10 credits per dollar
            metadata: {
                itemName: itemData.name || 'Unnamed',
                itemVersion: itemData.version || '1.0.0',
                dependencies: this.extractDependencies(itemData)
            }
        };

        // Check user balance if using credits
        if (paymentMethod === 'credits') {
            const balance = await this.usageMonitor.getUserBalance(userId);
            if (balance.balance < cost) {
                throw new Error('Insufficient credits for export');
            }
        }

        // Update export log
        await this.updateExportLog(exportRecord);

        // Deduct credits or create invoice
        await this.processPayment(exportRecord);

        // Generate export package
        const exportPackage = await this.generateExportPackage(itemData, exportRecord);

        return {
            exportId: exportRecord.uuid,
            cost: cost,
            credits: exportRecord.reflectionCredits,
            downloadUrl: exportPackage.url,
            mirrorSignature: exportRecord.mirrorSignature
        };
    }

    async loadExportItem(type, itemId) {
        const paths = {
            agent: `../vault/agents/${itemId}.json`,
            automation: `../vault/automations/wrapped/${itemId}.json`,
            template: `../template-reflection/templates/${itemId}.json`,
            platform: `../platforms/${itemId}/config.json`
        };

        const itemPath = path.join(__dirname, paths[type]);
        
        try {
            const content = await fs.readFile(itemPath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Export item not found: ${type}/${itemId}`);
        }
    }

    calculateComplexity(itemData, type) {
        let score = 1; // Base complexity

        switch(type) {
            case 'agent':
                score += (itemData.tools?.length || 0) * 0.5;
                score += (itemData.config?.enableMemory ? 1 : 0);
                score += (itemData.config?.enableReflection ? 2 : 0);
                break;
                
            case 'automation':
                score += (itemData.transformed?.steps?.length || 0) * 0.3;
                score += (itemData.mirror?.tier || 0) * 0.5;
                break;
                
            case 'template':
                score += (itemData.components?.length || 0) * 0.4;
                score += (itemData.monetized ? 3 : 0);
                break;
                
            case 'platform':
                score = 10; // Platform exports are always complex
                break;
        }

        // Rating: simple (1-3), moderate (4-7), complex (8+)
        if (score <= 3) return 'simple';
        if (score <= 7) return 'moderate';
        return 'complex';
    }

    async estimateTokensUsed(itemData) {
        // Estimate tokens used to generate this item
        const jsonSize = JSON.stringify(itemData).length;
        const baseTokens = Math.ceil(jsonSize / 4); // Rough estimate
        
        // Add tokens for any prompts or reflections
        let promptTokens = 0;
        if (itemData.systemPrompt) {
            promptTokens += Math.ceil(itemData.systemPrompt.length / 4);
        }
        if (itemData.reflectionLog) {
            promptTokens += 500; // Estimate for reflection processing
        }

        return baseTokens + promptTokens;
    }

    async calculateExportCost(type, complexity, includeVault) {
        const pricing = await this.loadPricing();
        
        const baseCosts = {
            agent: pricing.exportAgent || 2,
            automation: pricing.exportWorkflow || 5,
            template: pricing.exportTemplate || 3,
            platform: pricing.exportPlatform || 50
        };

        const complexityMultipliers = {
            simple: 1,
            moderate: 1.5,
            complex: 2
        };

        let cost = baseCosts[type] * complexityMultipliers[complexity];
        
        // Additional cost for vault data
        if (includeVault) {
            cost += pricing.vaultExpansion || 10;
        }

        return cost;
    }

    async loadPricing() {
        try {
            const content = await fs.readFile(this.pricingPath, 'utf8');
            return JSON.parse(content);
        } catch {
            return {
                exportAgent: 2,
                exportWorkflow: 5,
                exportTemplate: 3,
                exportPlatform: 50,
                vaultExpansion: 10
            };
        }
    }

    extractDependencies(itemData) {
        const deps = [];
        
        // Extract LLM dependencies
        if (itemData.config?.llmTarget) {
            deps.push(`llm:${itemData.config.llmTarget}`);
        }
        
        // Extract tool dependencies
        if (itemData.tools) {
            itemData.tools.forEach(tool => deps.push(`tool:${tool}`));
        }
        
        // Extract vault dependencies
        if (itemData.mirrorKey) {
            deps.push(`vault:${itemData.mirrorKey}`);
        }

        return deps;
    }

    generateUUID() {
        return `export-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    }

    generateExportSignature(itemData) {
        const exportData = {
            ...itemData,
            exportTime: Date.now(),
            sovereign: 'cal-riven-export'
        };
        
        return `export-${crypto.createHash('sha256')
            .update(JSON.stringify(exportData))
            .digest('hex')
            .substring(0, 16)}`;
    }

    async updateExportLog(record) {
        const log = JSON.parse(await fs.readFile(this.exportLogPath, 'utf8'));
        
        // Update totals
        log.totalExports++;
        log.totalRevenue += record.cost;
        
        // Update by type
        log.byType[record.type].count++;
        log.byType[record.type].revenue += record.cost;
        
        // Add record
        log.records.push(record);
        
        // Keep only last 5000 records
        if (log.records.length > 5000) {
            log.records = log.records.slice(-5000);
        }
        
        await fs.writeFile(this.exportLogPath, JSON.stringify(log, null, 2));
    }

    async processPayment(exportRecord) {
        switch(exportRecord.paymentMethod) {
            case 'credits':
                // Deduct from user balance
                await this.usageMonitor.addCredits(
                    exportRecord.userId, 
                    -exportRecord.cost, 
                    `Export: ${exportRecord.type}/${exportRecord.itemId}`
                );
                break;
                
            case 'invoice':
                // Add to pending invoice
                await this.addToInvoice(exportRecord);
                break;
                
            case 'stripe':
                // Would integrate with Stripe here
                // For now, just log it
                console.log(`Stripe payment required: $${exportRecord.cost}`);
                break;
        }
    }

    async addToInvoice(exportRecord) {
        const invoicePath = path.join(__dirname, '../vault/billing/invoice-draft.json');
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(invoicePath), { recursive: true });
        
        let invoice;
        try {
            invoice = JSON.parse(await fs.readFile(invoicePath, 'utf8'));
        } catch {
            invoice = {
                userId: exportRecord.userId,
                status: 'draft',
                items: [],
                total: 0,
                created: new Date().toISOString()
            };
        }
        
        invoice.items.push({
            type: 'export',
            description: `Export ${exportRecord.type}: ${exportRecord.metadata.itemName}`,
            amount: exportRecord.cost,
            exportId: exportRecord.uuid,
            timestamp: exportRecord.timestamp
        });
        
        invoice.total += exportRecord.cost;
        invoice.updated = new Date().toISOString();
        
        await fs.writeFile(invoicePath, JSON.stringify(invoice, null, 2));
    }

    async generateExportPackage(itemData, exportRecord) {
        const exportDir = path.join(__dirname, '../exports', exportRecord.uuid);
        await fs.mkdir(exportDir, { recursive: true });
        
        // Main export file
        const mainFile = path.join(exportDir, `${exportRecord.type}-export.json`);
        
        const exportData = {
            ...itemData,
            _export: {
                id: exportRecord.uuid,
                timestamp: exportRecord.timestamp,
                signature: exportRecord.mirrorSignature,
                version: '1.0.0'
            }
        };
        
        // Remove secrets unless requested
        if (!exportRecord.options.includeSecrets) {
            delete exportData.config?.apiKeys;
            delete exportData.credentials;
        }
        
        await fs.writeFile(mainFile, JSON.stringify(exportData, null, 2));
        
        // Add vault data if requested
        if (exportRecord.options.includeVault) {
            const vaultFile = path.join(exportDir, 'vault-data.json');
            const vaultData = await this.collectVaultData(itemData);
            await fs.writeFile(vaultFile, JSON.stringify(vaultData, null, 2));
        }
        
        // Add README
        const readmeFile = path.join(exportDir, 'README.md');
        const readme = this.generateExportReadme(exportRecord);
        await fs.writeFile(readmeFile, readme);
        
        return {
            url: `/exports/${exportRecord.uuid}`,
            files: await fs.readdir(exportDir)
        };
    }

    async collectVaultData(itemData) {
        // Collect relevant vault data for the export
        return {
            mirrorKey: itemData.mirrorKey,
            reflectionLog: itemData.reflectionLog,
            vaultBinding: itemData.config?.vaultBinding,
            tier: itemData.tier || 0,
            sovereign: 'cal-riven',
            exportNotice: 'This vault data is a snapshot. Live reflection requires platform connection.'
        };
    }

    generateExportReadme(exportRecord) {
        return `# MirrorOS Export

## Export Details
- **ID**: ${exportRecord.uuid}
- **Type**: ${exportRecord.type}
- **Exported**: ${exportRecord.timestamp}
- **Mirror Signature**: ${exportRecord.mirrorSignature}

## Contents
- Main ${exportRecord.type} configuration
${exportRecord.options.includeVault ? '- Vault binding data' : ''}
${exportRecord.options.includeSecrets ? '- API credentials (handle with care!)' : ''}

## Usage
1. Import this ${exportRecord.type} into your MirrorOS platform
2. The mirror signature ensures sovereign reflection
3. All prompts will route through the vault as configured

## Credits
This export cost ${exportRecord.cost} reflection credits.
Generated ${exportRecord.reflectionCredits} new credits for sharing.

---
*Exported from MirrorOS - Where every reflection has value*`;
    }

    async getExportHistory(userId, limit = 50) {
        const log = JSON.parse(await fs.readFile(this.exportLogPath, 'utf8'));
        
        const userExports = log.records
            .filter(record => !userId || record.userId === userId)
            .slice(-limit)
            .reverse();
            
        return {
            exports: userExports,
            totalExports: userExports.length,
            totalSpent: userExports.reduce((sum, r) => sum + r.cost, 0)
        };
    }
}

module.exports = ExportHandler;