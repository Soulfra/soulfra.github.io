// MirrorOS Usage Monitor - Track all API calls and reflection credits
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class UsageMonitor {
    constructor() {
        this.ledgerPath = path.join(__dirname, '../vault/logs/usage-ledger.json');
        this.pricingPath = path.join(__dirname, 'pricing-tier.json');
        this.tokenEstimates = {
            'claude': { input: 0.003, output: 0.015 }, // per 1k tokens
            'claude-instant': { input: 0.0008, output: 0.0024 },
            'gpt-4': { input: 0.03, output: 0.06 },
            'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
            'ollama': { input: 0, output: 0 }, // Local
            'local': { input: 0, output: 0 }
        };
    }

    async init() {
        // Ensure directories exist
        await fs.mkdir(path.dirname(this.ledgerPath), { recursive: true });
        
        // Initialize ledger if doesn't exist
        try {
            await fs.access(this.ledgerPath);
        } catch {
            await fs.writeFile(this.ledgerPath, JSON.stringify({
                version: "1.0.0",
                startDate: new Date().toISOString(),
                totalCalls: 0,
                totalTokens: 0,
                totalCost: 0,
                byModel: {},
                byUser: {},
                entries: []
            }, null, 2));
        }
    }

    async trackUsage(params) {
        const {
            model,
            prompt,
            response,
            userId = 'anonymous',
            apiKeyType = 'default', // 'default' or 'byok' (bring your own key)
            sessionId,
            agentId,
            automationId
        } = params;

        // Generate usage entry
        const usage = {
            uuid: this.generateUUID(),
            timestamp: new Date().toISOString(),
            model: model,
            userId: userId,
            apiKeyType: apiKeyType,
            tokens: {
                input: this.estimateTokens(prompt),
                output: this.estimateTokens(response),
                total: 0
            },
            cost: 0,
            mirrorSignature: this.generateMirrorSignature(prompt, response),
            vaultHash: this.generateVaultHash(params),
            metadata: {
                sessionId,
                agentId,
                automationId,
                reflectionDepth: this.calculateReflectionDepth(prompt)
            }
        };

        // Calculate total tokens and cost
        usage.tokens.total = usage.tokens.input + usage.tokens.output;
        usage.cost = await this.calculateCost(model, usage.tokens, apiKeyType);

        // Update ledger
        await this.updateLedger(usage);

        // Track in vault trace map
        await this.updateTraceMap(usage);

        return usage;
    }

    estimateTokens(text) {
        if (!text) return 0;
        // Rough estimate: 1 token per 4 characters
        return Math.ceil(text.length / 4);
    }

    async calculateCost(model, tokens, apiKeyType) {
        // BYOK (Bring Your Own Key) = no platform cost
        if (apiKeyType === 'byok') return 0;

        const rates = this.tokenEstimates[model] || { input: 0, output: 0 };
        const inputCost = (tokens.input / 1000) * rates.input;
        const outputCost = (tokens.output / 1000) * rates.output;

        // Load pricing tier for platform markup
        const pricing = await this.loadPricing();
        const markup = pricing.platformMarkup || 1.2; // 20% platform fee

        return (inputCost + outputCost) * markup;
    }

    async loadPricing() {
        try {
            const content = await fs.readFile(this.pricingPath, 'utf8');
            return JSON.parse(content);
        } catch {
            return {
                platformMarkup: 1.2,
                baseOnboarding: 1,
                apiCall: 0.01
            };
        }
    }

    calculateReflectionDepth(prompt) {
        // Calculate how deep this prompt reflects through the vault
        const indicators = ['reflect', 'mirror', 'sovereign', 'vault', 'cal'];
        let depth = 0;
        
        indicators.forEach(indicator => {
            if (prompt.toLowerCase().includes(indicator)) depth++;
        });

        return Math.min(depth, 10); // Max depth 10
    }

    generateUUID() {
        return `usage-${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    }

    generateMirrorSignature(prompt, response) {
        const combined = `${prompt}::${response}`;
        return `mirror-${crypto.createHash('sha256')
            .update(combined)
            .digest('hex')
            .substring(0, 16)}`;
    }

    generateVaultHash(params) {
        const vaultData = {
            ...params,
            timestamp: Date.now(),
            sovereign: 'cal-riven'
        };
        
        return crypto.createHash('sha256')
            .update(JSON.stringify(vaultData))
            .digest('hex');
    }

    async updateLedger(usage) {
        const ledger = JSON.parse(await fs.readFile(this.ledgerPath, 'utf8'));
        
        // Update totals
        ledger.totalCalls++;
        ledger.totalTokens += usage.tokens.total;
        ledger.totalCost += usage.cost;

        // Update by model
        if (!ledger.byModel[usage.model]) {
            ledger.byModel[usage.model] = {
                calls: 0,
                tokens: 0,
                cost: 0
            };
        }
        ledger.byModel[usage.model].calls++;
        ledger.byModel[usage.model].tokens += usage.tokens.total;
        ledger.byModel[usage.model].cost += usage.cost;

        // Update by user
        if (!ledger.byUser[usage.userId]) {
            ledger.byUser[usage.userId] = {
                calls: 0,
                tokens: 0,
                cost: 0,
                balance: 0,
                credits: 100 // Start with 100 free credits
            };
        }
        ledger.byUser[usage.userId].calls++;
        ledger.byUser[usage.userId].tokens += usage.tokens.total;
        ledger.byUser[usage.userId].cost += usage.cost;
        ledger.byUser[usage.userId].balance -= usage.cost;

        // Add entry
        ledger.entries.push(usage);

        // Keep only last 10000 entries to prevent file bloat
        if (ledger.entries.length > 10000) {
            ledger.entries = ledger.entries.slice(-10000);
        }

        await fs.writeFile(this.ledgerPath, JSON.stringify(ledger, null, 2));
    }

    async updateTraceMap(usage) {
        const tracePath = path.join(__dirname, '../tier-6/vault-trace-map.json');
        
        try {
            const traceMap = JSON.parse(await fs.readFile(tracePath, 'utf8'));
            
            // Update prompt traces
            traceMap.prompts.total++;
            if (traceMap.prompts.byLLM[usage.model] !== undefined) {
                traceMap.prompts.byLLM[usage.model]++;
            }
            
            traceMap.prompts.traces.push({
                uuid: usage.uuid,
                timestamp: usage.timestamp,
                model: usage.model,
                mirrorSignature: usage.mirrorSignature,
                cost: usage.cost
            });

            // Keep only last 1000 traces
            if (traceMap.prompts.traces.length > 1000) {
                traceMap.prompts.traces = traceMap.prompts.traces.slice(-1000);
            }

            traceMap.metadata.lastUpdated = new Date().toISOString();
            
            await fs.writeFile(tracePath, JSON.stringify(traceMap, null, 2));
        } catch (error) {
            console.error('Failed to update trace map:', error);
        }
    }

    async getUserBalance(userId) {
        const ledger = JSON.parse(await fs.readFile(this.ledgerPath, 'utf8'));
        const user = ledger.byUser[userId];
        
        if (!user) {
            return {
                balance: 100, // Default credits
                credits: 100,
                spent: 0,
                calls: 0
            };
        }

        return {
            balance: user.balance + user.credits,
            credits: user.credits,
            spent: user.cost,
            calls: user.calls
        };
    }

    async addCredits(userId, amount, reason = 'manual') {
        const ledger = JSON.parse(await fs.readFile(this.ledgerPath, 'utf8'));
        
        if (!ledger.byUser[userId]) {
            ledger.byUser[userId] = {
                calls: 0,
                tokens: 0,
                cost: 0,
                balance: 0,
                credits: 0
            };
        }

        ledger.byUser[userId].credits += amount;

        // Log credit addition
        if (!ledger.creditHistory) ledger.creditHistory = [];
        ledger.creditHistory.push({
            userId,
            amount,
            reason,
            timestamp: new Date().toISOString()
        });

        await fs.writeFile(this.ledgerPath, JSON.stringify(ledger, null, 2));
    }

    async generateUsageReport(userId, startDate, endDate) {
        const ledger = JSON.parse(await fs.readFile(this.ledgerPath, 'utf8'));
        
        const userEntries = ledger.entries.filter(entry => {
            if (userId && entry.userId !== userId) return false;
            
            const entryDate = new Date(entry.timestamp);
            if (startDate && entryDate < new Date(startDate)) return false;
            if (endDate && entryDate > new Date(endDate)) return false;
            
            return true;
        });

        const report = {
            userId: userId || 'all',
            period: {
                start: startDate || ledger.startDate,
                end: endDate || new Date().toISOString()
            },
            summary: {
                totalCalls: userEntries.length,
                totalTokens: userEntries.reduce((sum, e) => sum + e.tokens.total, 0),
                totalCost: userEntries.reduce((sum, e) => sum + e.cost, 0)
            },
            byModel: {},
            byDay: {},
            topPrompts: []
        };

        // Aggregate by model
        userEntries.forEach(entry => {
            if (!report.byModel[entry.model]) {
                report.byModel[entry.model] = {
                    calls: 0,
                    tokens: 0,
                    cost: 0
                };
            }
            report.byModel[entry.model].calls++;
            report.byModel[entry.model].tokens += entry.tokens.total;
            report.byModel[entry.model].cost += entry.cost;
        });

        return report;
    }
}

module.exports = UsageMonitor;