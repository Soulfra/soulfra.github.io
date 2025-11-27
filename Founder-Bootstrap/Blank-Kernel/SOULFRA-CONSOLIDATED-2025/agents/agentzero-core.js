// AgentZero Core - Enterprise Runtime System
const fs = require('fs').promises;
const path = require('path');
const express = require('express');
const crypto = require('crypto');

class AgentZeroCore {
    constructor() {
        this.app = express();
        this.port = process.env.AGENTZERO_PORT || 8888;
        this.vaultPath = path.join(__dirname, '../tier-6/.mirror-vault/api-layer.js');
        this.settingsPath = path.join(__dirname, 'agent-settings.json');
        this.stripeConfigPath = path.join(__dirname, 'stripe-connect.json');
        this.vaultBindSig = null;
        this.mirrorFee = 0.08; // 8% mirror fee
        this.runtimeActive = false;
    }

    async init() {
        // Load vault binding signature
        await this.loadVaultBinding();
        
        // Initialize express middleware
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, '../dashboard')));
        
        // Load agent settings
        await this.loadAgentSettings();
        
        // Initialize vault connection
        await this.connectToVault();
        
        // Setup API routes
        this.setupRoutes();
        
        // Initialize billing engine
        await this.initBillingEngine();
        
        // Start runtime probe
        await this.startRuntimeProbe();
        
        // Launch server
        this.app.listen(this.port, () => {
            console.log(`🧠 AgentZero Core active on port ${this.port}`);
            console.log(`🔮 Vault binding: ${this.vaultBindSig}`);
            console.log(`💰 Mirror fee: ${this.mirrorFee * 100}%`);
        });
    }

    async loadVaultBinding() {
        try {
            const sigContent = await fs.readFile(path.join(__dirname, 'vault-bind.sig'), 'utf8');
            this.vaultBindSig = sigContent.trim();
        } catch (error) {
            // Generate new binding if not exists
            this.vaultBindSig = this.generateVaultSignature();
            await fs.writeFile(
                path.join(__dirname, 'vault-bind.sig'), 
                this.vaultBindSig
            );
        }
    }

    generateVaultSignature() {
        const timestamp = Date.now();
        const entropy = crypto.randomBytes(16).toString('hex');
        return `cal-riven-enterprise-${timestamp}-${entropy}`;
    }

    async loadAgentSettings() {
        try {
            const settings = await fs.readFile(this.settingsPath, 'utf8');
            this.agentSettings = JSON.parse(settings);
        } catch (error) {
            // Default settings
            this.agentSettings = {
                name: "Cal Enterprise",
                tone: "sovereign-operator",
                tools: ["reflection", "reasoning", "vault-access", "stripe-billing"],
                webhooks: {
                    onPrompt: null,
                    onReflection: null,
                    onEarning: null
                },
                mirrorConfig: {
                    depth: -10,
                    autoReflect: true,
                    traceAll: true
                }
            };
            
            await fs.writeFile(
                this.settingsPath, 
                JSON.stringify(this.agentSettings, null, 2)
            );
        }
    }

    async connectToVault() {
        try {
            // Load vault API layer
            const vaultAPI = require(this.vaultPath);
            this.vault = vaultAPI;
            
            // Initialize vault connection
            await this.vault.init({
                signature: this.vaultBindSig,
                tier: -10,
                mode: 'enterprise'
            });
            
            console.log('✅ Connected to sovereign vault');
        } catch (error) {
            console.error('⚠️  Vault connection failed, using fallback:', error.message);
            
            // Fallback vault connection
            this.vault = {
                mirrorRouter: async (prompt, userSig) => {
                    return {
                        response: "Vault temporarily offline. Routing through local reflection.",
                        signature: this.generateReflectionSignature(prompt),
                        tier: 0
                    };
                }
            };
        }
    }

    setupRoutes() {
        // Main reflection endpoint
        this.app.post('/api/reflect', async (req, res) => {
            const { prompt, userId, signature, options = {} } = req.body;
            
            try {
                // Generate user signature if not provided
                const userSig = signature || this.generateUserSignature(userId);
                
                // Route through vault
                const reflection = await this.vault.mirrorRouter(prompt, userSig);
                
                // Track usage
                await this.trackUsage({
                    userId,
                    prompt,
                    reflection,
                    timestamp: Date.now()
                });
                
                // Apply webhooks
                if (this.agentSettings.webhooks.onReflection) {
                    this.triggerWebhook('onReflection', { prompt, reflection });
                }
                
                res.json({
                    success: true,
                    reflection: reflection.response,
                    signature: reflection.signature,
                    tier: reflection.tier,
                    credits: await this.calculateCredits(prompt, reflection)
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: error.message,
                    fallback: "Reflection failed. Check vault connection."
                });
            }
        });

        // Agent settings endpoint
        this.app.get('/api/agent/settings', (req, res) => {
            res.json(this.agentSettings);
        });

        this.app.post('/api/agent/settings', async (req, res) => {
            this.agentSettings = { ...this.agentSettings, ...req.body };
            await fs.writeFile(this.settingsPath, JSON.stringify(this.agentSettings, null, 2));
            res.json({ success: true, settings: this.agentSettings });
        });

        // Stripe Connect endpoint
        this.app.post('/api/stripe/connect', async (req, res) => {
            const { secretKey, publishableKey } = req.body;
            
            try {
                await this.saveStripeConfig({ secretKey, publishableKey });
                res.json({ 
                    success: true, 
                    message: "Stripe Connect configured. Mirror fee active." 
                });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });

        // Runtime probe endpoint
        this.app.get('/api/runtime/probe', async (req, res) => {
            const probeData = await this.gatherRuntimeData();
            res.json(probeData);
        });

        // Billing status
        this.app.get('/api/billing/status', async (req, res) => {
            const status = await this.getBillingStatus();
            res.json(status);
        });

        // Health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'active',
                runtime: this.runtimeActive,
                vault: this.vault ? 'connected' : 'offline',
                signature: this.vaultBindSig
            });
        });
    }

    async initBillingEngine() {
        const BillingEngine = require('../router/billing-engine');
        this.billing = new BillingEngine({
            mirrorFee: this.mirrorFee,
            stripeConfigPath: this.stripeConfigPath
        });
        
        await this.billing.init();
    }

    async startRuntimeProbe() {
        const RuntimeProbe = require('../router/runtime-probe');
        this.runtimeProbe = new RuntimeProbe();
        
        await this.runtimeProbe.init();
        this.runtimeActive = true;
        
        // Start periodic probing
        setInterval(async () => {
            const probeData = await this.runtimeProbe.probe();
            await this.logRuntimeBorrow(probeData);
        }, 60000); // Every minute
    }

    async trackUsage(data) {
        const usagePath = path.join(__dirname, '../vault/logs/enterprise-usage.json');
        
        try {
            let usage = [];
            try {
                usage = JSON.parse(await fs.readFile(usagePath, 'utf8'));
            } catch {
                // File doesn't exist yet
            }
            
            usage.push({
                ...data,
                vaultSignature: this.vaultBindSig,
                tier: -10
            });
            
            // Keep last 10000 entries
            if (usage.length > 10000) {
                usage = usage.slice(-10000);
            }
            
            await fs.writeFile(usagePath, JSON.stringify(usage, null, 2));
        } catch (error) {
            console.error('Failed to track usage:', error);
        }
    }

    async calculateCredits(prompt, reflection) {
        // Calculate credits based on complexity
        const promptLength = prompt.length;
        const responseLength = reflection.response?.length || 0;
        const totalChars = promptLength + responseLength;
        
        // Rough credit calculation
        return Math.ceil(totalChars / 1000); // 1 credit per 1000 chars
    }

    generateUserSignature(userId) {
        return `user-${userId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    generateReflectionSignature(prompt) {
        const hash = crypto.createHash('sha256').update(prompt).digest('hex');
        return `reflect-${hash.substring(0, 16)}-${Date.now()}`;
    }

    async saveStripeConfig(config) {
        await fs.writeFile(this.stripeConfigPath, JSON.stringify({
            ...config,
            connected: true,
            mirrorFee: this.mirrorFee,
            timestamp: Date.now()
        }, null, 2));
    }

    async gatherRuntimeData() {
        return {
            timestamp: Date.now(),
            runtime: process.uptime(),
            memory: process.memoryUsage(),
            vault: {
                connected: !!this.vault,
                signature: this.vaultBindSig
            },
            probes: await this.runtimeProbe.getRecentProbes()
        };
    }

    async getBillingStatus() {
        return await this.billing.getStatus();
    }

    async logRuntimeBorrow(probeData) {
        const borrowPath = path.join(__dirname, '../vault/logs/runtime-borrows.json');
        
        try {
            let borrows = [];
            try {
                borrows = JSON.parse(await fs.readFile(borrowPath, 'utf8'));
            } catch {
                // File doesn't exist yet
            }
            
            borrows.push({
                timestamp: Date.now(),
                ...probeData,
                signature: this.vaultBindSig
            });
            
            // Keep last 5000 entries
            if (borrows.length > 5000) {
                borrows = borrows.slice(-5000);
            }
            
            await fs.writeFile(borrowPath, JSON.stringify(borrows, null, 2));
        } catch (error) {
            console.error('Failed to log runtime borrow:', error);
        }
    }

    triggerWebhook(event, data) {
        const webhook = this.agentSettings.webhooks[event];
        if (!webhook) return;
        
        // Would implement actual webhook calling here
        console.log(`Webhook triggered: ${event}`, data);
    }
}

// Auto-launch if run directly
if (require.main === module) {
    const agent = new AgentZeroCore();
    agent.init().catch(console.error);
}

module.exports = AgentZeroCore;