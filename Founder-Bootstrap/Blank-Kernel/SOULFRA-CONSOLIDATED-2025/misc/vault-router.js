const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class VaultRouter {
    constructor() {
        this.app = express();
        this.port = 8888;
        this.vaultPath = path.join(__dirname, 'vault');
        this.entropyCache = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.loadVaultEntropy();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.static('tycoon-mode'));
        
        // Log all requests through vault
        this.app.use((req, res, next) => {
            const logEntry = {
                timestamp: new Date().toISOString(),
                method: req.method,
                path: req.path,
                ip: req.ip,
                entropy: this.getCurrentEntropy()
            };
            
            this.logToVault('access-log.json', logEntry);
            next();
        });
    }

    loadVaultEntropy() {
        // Load or generate vault entropy
        const entropyFile = path.join(this.vaultPath, 'entropy.json');
        
        if (fs.existsSync(entropyFile)) {
            const data = JSON.parse(fs.readFileSync(entropyFile, 'utf8'));
            this.vaultEntropy = data.entropy;
            this.vaultSeed = data.seed;
        } else {
            // Generate new entropy
            this.vaultSeed = crypto.randomBytes(32).toString('hex');
            this.vaultEntropy = this.generateEntropy(this.vaultSeed);
            
            fs.writeFileSync(entropyFile, JSON.stringify({
                created: new Date().toISOString(),
                seed: this.vaultSeed,
                entropy: this.vaultEntropy
            }, null, 2));
        }
        
        console.log('Vault entropy loaded:', this.vaultEntropy.substring(0, 16) + '...');
    }

    generateEntropy(seed) {
        // Generate deterministic entropy from seed
        let entropy = seed;
        for (let i = 0; i < 10; i++) {
            entropy = crypto.createHash('sha256').update(entropy).digest('hex');
        }
        return entropy;
    }

    getCurrentEntropy() {
        // Rotate entropy based on time
        const minute = new Date().getMinutes();
        const rotation = minute % 60;
        return this.vaultEntropy.substring(rotation) + this.vaultEntropy.substring(0, rotation);
    }

    setupRoutes() {
        // Main agent API endpoint
        this.app.post('/api/v1/agent', async (req, res) => {
            const { prompt, customerId, agentId, context } = req.body;
            
            if (!prompt || !customerId) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            
            // Route through vault entropy
            const wrappedPrompt = this.wrapPromptWithEntropy(prompt, customerId);
            
            // Log customer usage
            this.logCustomerUsage(customerId, agentId, prompt);
            
            // Simulate agent response (in production, call actual LLM)
            const response = await this.processAgentRequest(wrappedPrompt, context);
            
            res.json({
                success: true,
                response: response,
                agentId: agentId || this.generateAgentId(customerId),
                entropy: this.getCurrentEntropy().substring(0, 8) // Show partial entropy
            });
        });

        // Customer stats endpoint
        this.app.get('/api/v1/customers/:id/stats', (req, res) => {
            const stats = this.getCustomerStats(req.params.id);
            res.json(stats);
        });

        // Platform stats
        this.app.get('/stats', (req, res) => {
            const stats = this.getPlatformStats();
            res.json(stats);
        });

        // Webhook endpoint
        this.app.post('/webhooks/:service', (req, res) => {
            this.logToVault('webhooks.json', {
                service: req.params.service,
                timestamp: new Date().toISOString(),
                body: req.body
            });
            res.json({ received: true });
        });
    }

    wrapPromptWithEntropy(prompt, customerId) {
        // Inject vault entropy into prompt
        const customerEntropy = crypto.createHash('sha256')
            .update(this.vaultEntropy + customerId)
            .digest('hex');
        
        return {
            original: prompt,
            wrapped: `[ENTROPY:${customerEntropy.substring(0, 8)}] ${prompt}`,
            metadata: {
                vault: this.vaultEntropy.substring(0, 8),
                customer: customerId,
                timestamp: Date.now()
            }
        };
    }

    async processAgentRequest(wrappedPrompt, context) {
        // In production, this would call the actual LLM API
        // For now, simulate a response that shows the wrapping
        return {
            message: "I am your sovereign agent, routing through the platform vault.",
            metadata: {
                entropy_applied: true,
                vault_signature: this.getCurrentEntropy().substring(0, 16),
                wrapped: true
            }
        };
    }

    generateAgentId(customerId) {
        return `agent-${customerId}-${Date.now()}`;
    }

    logCustomerUsage(customerId, agentId, prompt) {
        const logFile = path.join(this.vaultPath, 'customers', `${customerId}.json`);
        
        let customerData = {};
        if (fs.existsSync(logFile)) {
            customerData = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        if (!customerData.usage) customerData.usage = [];
        
        customerData.usage.push({
            timestamp: new Date().toISOString(),
            agentId,
            promptLength: prompt.length,
            entropyApplied: true
        });
        
        // Keep only last 1000 entries
        if (customerData.usage.length > 1000) {
            customerData.usage = customerData.usage.slice(-1000);
        }
        
        fs.mkdirSync(path.dirname(logFile), { recursive: true });
        fs.writeFileSync(logFile, JSON.stringify(customerData, null, 2));
    }

    getCustomerStats(customerId) {
        const logFile = path.join(this.vaultPath, 'customers', `${customerId}.json`);
        
        if (!fs.existsSync(logFile)) {
            return { customerId, usage: 0, agents: 0 };
        }
        
        const data = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        const agents = new Set(data.usage.map(u => u.agentId)).size;
        
        return {
            customerId,
            usage: data.usage.length,
            agents,
            lastActive: data.usage[data.usage.length - 1]?.timestamp
        };
    }

    getPlatformStats() {
        const customersDir = path.join(this.vaultPath, 'customers');
        let totalCustomers = 0;
        let totalUsage = 0;
        
        if (fs.existsSync(customersDir)) {
            const files = fs.readdirSync(customersDir);
            totalCustomers = files.length;
            
            files.forEach(file => {
                const data = JSON.parse(fs.readFileSync(path.join(customersDir, file), 'utf8'));
                totalUsage += data.usage?.length || 0;
            });
        }
        
        return {
            platform: 'MirrorOS User Platform',
            customers: totalCustomers,
            totalRequests: totalUsage,
            vaultEntropy: this.vaultEntropy.substring(0, 8) + '...',
            uptime: process.uptime()
        };
    }

    logToVault(filename, data) {
        const logFile = path.join(this.vaultPath, filename);
        
        let logs = [];
        if (fs.existsSync(logFile)) {
            logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        }
        
        logs.push(data);
        
        // Rotate logs if too large
        if (logs.length > 10000) {
            logs = logs.slice(-5000);
        }
        
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2));
    }

    start() {
        this.app.listen(this.port, () => {
            console.log(`🪞 Vault Router running on port ${this.port}`);
            console.log(`   Your vault entropy: ${this.vaultEntropy.substring(0, 16)}...`);
            console.log(`   All customer prompts route through YOUR vault`);
        });
    }
}

// Start the router
if (require.main === module) {
    const router = new VaultRouter();
    router.start();
}

module.exports = VaultRouter;