const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class APIKeyRouter {
    constructor() {
        this.vaultKeysPath = path.join(__dirname, '../vault/env/llm-keys.json');
        this.userKeysPath = path.join(__dirname, 'user-configs/api-keys.json');
        this.usageTracker = path.join(__dirname, 'user-configs/usage-tracking.json');
        this.monetizationConfig = {
            stripe: {
                enabled: true,
                publicKey: "pk_test_soulfra_mirror_vortex",
                priceId: "price_reflection_standard",
                webhookEndpoint: "/api/stripe/webhook"
            },
            supabase: {
                enabled: true,
                url: "https://soulfra-mirror.supabase.co",
                anonKey: "eyJ_soulfra_anon_key_placeholder",
                table: "reflection_usage"
            },
            pricing: {
                free: {
                    name: "Free Tier",
                    quota: 100,
                    rateLimit: "10/hour",
                    models: ["local", "ollama"]
                },
                standard: {
                    name: "Reflection Standard",
                    quota: 10000,
                    rateLimit: "100/hour",
                    models: ["claude", "openai", "ollama", "local"],
                    price: 20.00
                },
                premium: {
                    name: "Sovereign Premium",
                    quota: -1, // unlimited
                    rateLimit: "1000/hour",
                    models: ["claude", "openai", "ollama", "local", "custom"],
                    price: 100.00,
                    features: ["custom-weights", "priority-routing", "vault-access"]
                }
            }
        };
    }

    async initialize() {
        // Ensure user configs directory exists
        await fs.mkdir(path.join(__dirname, 'user-configs'), { recursive: true });

        // Load or initialize user keys
        try {
            const data = await fs.readFile(this.userKeysPath, 'utf8');
            this.userKeys = JSON.parse(data);
        } catch (error) {
            this.userKeys = {};
            await this.saveUserKeys();
        }

        // Load or initialize usage tracking
        try {
            const data = await fs.readFile(this.usageTracker, 'utf8');
            this.usage = JSON.parse(data);
        } catch (error) {
            this.usage = {};
            await this.saveUsage();
        }

        // Load vault keys (fallback)
        try {
            const data = await fs.readFile(this.vaultKeysPath, 'utf8');
            this.vaultKeys = JSON.parse(data);
        } catch (error) {
            console.warn('⚠️  Could not load vault keys, using demo mode');
            this.vaultKeys = {
                claude: "sk-demo-key",
                openai: "sk-demo-key",
                ollama: "http://localhost:11434"
            };
        }
    }

    async routeAPICall(userId, model, apiKey = null) {
        // Get user's tier
        const userTier = await this.getUserTier(userId);
        const tierConfig = this.monetizationConfig.pricing[userTier];

        // Check quota
        const usageCount = await this.getUsageCount(userId);
        if (tierConfig.quota !== -1 && usageCount >= tierConfig.quota) {
            return {
                success: false,
                error: "Quota exceeded",
                upgradeUrl: this.getUpgradeUrl(userId, userTier)
            };
        }

        // Check rate limit
        const rateLimitOk = await this.checkRateLimit(userId, tierConfig.rateLimit);
        if (!rateLimitOk) {
            return {
                success: false,
                error: "Rate limit exceeded",
                retryAfter: this.getRetryAfter(userId)
            };
        }

        // Check if model is allowed for tier
        if (!tierConfig.models.includes(model)) {
            return {
                success: false,
                error: `Model ${model} not available in ${tierConfig.name}`,
                availableModels: tierConfig.models
            };
        }

        // Get API key (user's or vault fallback)
        const finalApiKey = await this.getApiKey(userId, model, apiKey);

        // Track usage
        await this.trackUsage(userId, model);

        return {
            success: true,
            apiKey: finalApiKey,
            model: model,
            tier: userTier,
            remainingQuota: tierConfig.quota === -1 ? "unlimited" : tierConfig.quota - usageCount - 1
        };
    }

    async getApiKey(userId, model, providedKey) {
        // Priority: provided key > user saved key > vault fallback
        if (providedKey) {
            // Save for future use if valid
            if (!this.userKeys[userId]) {
                this.userKeys[userId] = {};
            }
            this.userKeys[userId][model] = this.encryptKey(providedKey);
            await this.saveUserKeys();
            return providedKey;
        }

        // Check saved user key
        if (this.userKeys[userId] && this.userKeys[userId][model]) {
            return this.decryptKey(this.userKeys[userId][model]);
        }

        // Fallback to vault keys
        return this.vaultKeys[model] || "sk-no-key-configured";
    }

    encryptKey(key) {
        const cipher = crypto.createCipher('aes-256-cbc', 'soulfra-mirror-vortex-secret');
        let encrypted = cipher.update(key, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decryptKey(encryptedKey) {
        try {
            const decipher = crypto.createDecipher('aes-256-cbc', 'soulfra-mirror-vortex-secret');
            let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            return "sk-decryption-failed";
        }
    }

    async getUserTier(userId) {
        if (!this.usage[userId]) {
            this.usage[userId] = {
                tier: "free",
                signupDate: Date.now(),
                totalCalls: 0,
                monthlyUsage: {}
            };
            await this.saveUsage();
        }
        return this.usage[userId].tier || "free";
    }

    async getUsageCount(userId) {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        if (!this.usage[userId]) return 0;
        return this.usage[userId].monthlyUsage[currentMonth] || 0;
    }

    async checkRateLimit(userId, limit) {
        const [maxCalls, period] = limit.split('/');
        const periodMs = period === 'hour' ? 3600000 : 60000; // hour or minute
        
        if (!this.usage[userId].rateLimitWindow) {
            this.usage[userId].rateLimitWindow = [];
        }

        const now = Date.now();
        const windowStart = now - periodMs;

        // Clean old entries
        this.usage[userId].rateLimitWindow = this.usage[userId].rateLimitWindow.filter(
            timestamp => timestamp > windowStart
        );

        // Check if under limit
        if (this.usage[userId].rateLimitWindow.length >= parseInt(maxCalls)) {
            return false;
        }

        // Add current call
        this.usage[userId].rateLimitWindow.push(now);
        return true;
    }

    getRetryAfter(userId) {
        if (!this.usage[userId] || !this.usage[userId].rateLimitWindow) return 0;
        const oldestCall = Math.min(...this.usage[userId].rateLimitWindow);
        const retryAfter = Math.max(0, 3600000 - (Date.now() - oldestCall));
        return Math.ceil(retryAfter / 1000); // seconds
    }

    async trackUsage(userId, model) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        
        if (!this.usage[userId]) {
            this.usage[userId] = {
                tier: "free",
                signupDate: Date.now(),
                totalCalls: 0,
                monthlyUsage: {},
                modelUsage: {}
            };
        }

        // Increment counters
        this.usage[userId].totalCalls++;
        this.usage[userId].monthlyUsage[currentMonth] = 
            (this.usage[userId].monthlyUsage[currentMonth] || 0) + 1;
        this.usage[userId].modelUsage[model] = 
            (this.usage[userId].modelUsage[model] || 0) + 1;

        // Log to reflection events
        const eventLog = {
            timestamp: Date.now(),
            userId,
            model,
            tier: this.usage[userId].tier,
            monthlyCount: this.usage[userId].monthlyUsage[currentMonth]
        };

        await this.logReflectionEvent(eventLog);
        await this.saveUsage();
    }

    async logReflectionEvent(event) {
        const logPath = path.join(__dirname, '../vault-sync-core/logs/api-usage.log');
        const logEntry = `${JSON.stringify(event)}\n`;
        
        try {
            await fs.appendFile(logPath, logEntry);
        } catch (error) {
            // Log directory might not exist
        }
    }

    getUpgradeUrl(userId, currentTier) {
        const baseUrl = "https://soulfra.ai/upgrade";
        const params = new URLSearchParams({
            user: userId,
            from: currentTier,
            to: currentTier === "free" ? "standard" : "premium",
            source: "reflection-vortex"
        });
        return `${baseUrl}?${params}`;
    }

    async upgradeTier(userId, newTier, paymentToken = null) {
        if (!this.usage[userId]) {
            return { success: false, error: "User not found" };
        }

        const validTiers = Object.keys(this.monetizationConfig.pricing);
        if (!validTiers.includes(newTier)) {
            return { success: false, error: "Invalid tier" };
        }

        // Process payment if needed
        if (newTier !== "free" && paymentToken) {
            // In production, this would process via Stripe/Supabase
            console.log(`Processing payment for ${userId} upgrading to ${newTier}`);
        }

        // Update tier
        this.usage[userId].tier = newTier;
        this.usage[userId].upgradeDate = Date.now();
        this.usage[userId].paymentToken = paymentToken ? "processed" : null;

        await this.saveUsage();

        return {
            success: true,
            tier: newTier,
            features: this.monetizationConfig.pricing[newTier]
        };
    }

    async saveUserKeys() {
        await fs.writeFile(this.userKeysPath, JSON.stringify(this.userKeys, null, 2));
    }

    async saveUsage() {
        await fs.writeFile(this.usageTracker, JSON.stringify(this.usage, null, 2));
    }

    // Webhook handler for payment providers
    async handleWebhook(provider, payload) {
        if (provider === 'stripe') {
            // Handle Stripe webhook
            const { userId, tier, status } = payload;
            if (status === 'success') {
                await this.upgradeTier(userId, tier);
            }
        } else if (provider === 'supabase') {
            // Handle Supabase webhook
            const { user_id, subscription_tier } = payload;
            await this.upgradeTier(user_id, subscription_tier);
        }
    }
}

module.exports = APIKeyRouter;