// MirrorOS MirrorRouter Core - LLM + Vault Routing System
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class MirrorRouter {
    constructor(config = {}) {
        this.config = {
            vaultPath: config.vaultPath || path.join(__dirname, '../vault'),
            keysPath: config.keysPath || path.join(__dirname, '../vault/env/llm-keys.json'),
            usageLedgerPath: config.usageLedgerPath || path.join(__dirname, '../vault/usage-ledger.json'),
            reflectionLogsPath: config.reflectionLogsPath || path.join(__dirname, '../vault-sync-core/logs/reflection-events.log'),
            modeSwitcherPath: config.modeSwitcherPath || path.join(__dirname, '../mirroros/mode-switcher.json'),
            ...config
        };
        
        this.operatingMode = 'soft'; // Default mode
        this.modeConfig = null;

        this.userKeys = null;
        this.backupKeys = null;
        this.usageTracker = {
            totalTokens: 0,
            totalCost: 0,
            requests: 0,
            sessions: new Map()
        };

        this.llmProviders = {
            claude: {
                endpoint: 'https://api.anthropic.com/v1/messages',
                headers: (key) => ({
                    'Content-Type': 'application/json',
                    'x-api-key': key,
                    'anthropic-version': '2023-06-01'
                }),
                formatRequest: (prompt) => ({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1000,
                    messages: [{ role: 'user', content: prompt }]
                }),
                extractResponse: (data) => data.content?.[0]?.text || 'No response',
                costPerToken: 0.000003 // $3 per 1M tokens
            },
            openai: {
                endpoint: 'https://api.openai.com/v1/chat/completions',
                headers: (key) => ({
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${key}`
                }),
                formatRequest: (prompt) => ({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 1000
                }),
                extractResponse: (data) => data.choices?.[0]?.message?.content || 'No response',
                costPerToken: 0.000002 // $2 per 1M tokens
            },
            ollama: {
                endpoint: 'http://localhost:11434/api/generate',
                headers: () => ({ 'Content-Type': 'application/json' }),
                formatRequest: (prompt) => ({
                    model: 'llama2',
                    prompt: prompt,
                    stream: false
                }),
                extractResponse: (data) => data.response || 'Local model response',
                costPerToken: 0 // Local model is free
            }
        };

        this.init();
    }

    async init() {
        console.log('🔄 Initializing MirrorRouter...');
        
        await this.ensureDirectories();
        await this.loadOperatingMode();
        await this.loadKeys();
        await this.loadUsageData();
        
        console.log('✅ MirrorRouter initialized');
        console.log(`🎭 Operating in ${this.operatingMode.toUpperCase()} mode`);
        console.log(`📊 Current usage: ${this.usageTracker.totalTokens} tokens, $${this.usageTracker.totalCost.toFixed(4)}`);
    }

    async ensureDirectories() {
        const dirs = [
            path.dirname(this.config.keysPath),
            path.dirname(this.config.usageLedgerPath),
            path.dirname(this.config.reflectionLogsPath)
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async loadOperatingMode() {
        try {
            const modeData = await fs.readFile(this.config.modeSwitcherPath, 'utf8');
            const modeConfig = JSON.parse(modeData);
            this.operatingMode = modeConfig.activeMode || 'soft';
            
            // Load mode-specific configuration
            const configPath = path.join(__dirname, `../mirroros/${this.operatingMode}-mode-config.json`);
            const configData = await fs.readFile(configPath, 'utf8');
            this.modeConfig = JSON.parse(configData);
        } catch (error) {
            console.log('⚠️  Mode config not found, defaulting to SOFT mode');
            this.operatingMode = 'soft';
            // Load default soft mode config
            try {
                const configPath = path.join(__dirname, '../mirroros/soft-mode-config.json');
                const configData = await fs.readFile(configPath, 'utf8');
                this.modeConfig = JSON.parse(configData);
            } catch {
                this.modeConfig = { cal_behavior: { response_style: {} }, memory_settings: {} };
            }
        }
    }

    async loadKeys() {
        console.log('🔑 Loading API keys...');
        
        // Load user keys (BYOK - Bring Your Own Keys)
        await this.loadUserKeys();
        
        // Load backup keys from vault
        await this.loadBackupKeys();
        
        const hasUserKeys = this.userKeys && (this.userKeys.claude || this.userKeys.openai);
        const hasBackupKeys = this.backupKeys && (this.backupKeys.claude || this.backupKeys.openai);
        
        console.log(`🔑 User keys: ${hasUserKeys ? '✅ Available' : '❌ None'}`);
        console.log(`🔑 Backup keys: ${hasBackupKeys ? '✅ Available' : '❌ None'}`);
        console.log(`🔑 Ollama: ${await this.testOllamaConnection() ? '✅ Connected' : '❌ Offline'}`);
    }

    async loadUserKeys() {
        this.userKeys = {};
        
        // Check environment variables
        if (process.env.ANTHROPIC_API_KEY) {
            this.userKeys.claude = process.env.ANTHROPIC_API_KEY;
        }
        if (process.env.OPENAI_API_KEY) {
            this.userKeys.openai = process.env.OPENAI_API_KEY;
        }

        // Check .env.local file
        try {
            const envPath = path.join(__dirname, '../.env.local');
            const envContent = await fs.readFile(envPath, 'utf8');
            const envVars = this.parseEnvFile(envContent);
            
            if (envVars.ANTHROPIC_API_KEY) this.userKeys.claude = envVars.ANTHROPIC_API_KEY;
            if (envVars.OPENAI_API_KEY) this.userKeys.openai = envVars.OPENAI_API_KEY;
        } catch {
            // No .env.local file
        }
    }

    async loadBackupKeys() {
        try {
            const keysContent = await fs.readFile(this.config.keysPath, 'utf8');
            this.backupKeys = JSON.parse(keysContent);
        } catch (error) {
            console.log('⚠️  Creating default backup keys...');
            this.backupKeys = {
                claude: 'sk-ant-demo-key',
                openai: 'sk-demo-key',
                ollama: 'http://localhost:11434',
                defaultAgent: 'cal-riven-default-sig'
            };
            
            await fs.writeFile(this.config.keysPath, JSON.stringify(this.backupKeys, null, 2));
        }
    }

    async loadUsageData() {
        try {
            const usageContent = await fs.readFile(this.config.usageLedgerPath, 'utf8');
            const data = JSON.parse(usageContent);
            this.usageTracker = { ...this.usageTracker, ...data };
        } catch {
            await this.saveUsageData();
        }
    }

    async saveUsageData() {
        const usageData = {
            totalTokens: this.usageTracker.totalTokens,
            totalCost: this.usageTracker.totalCost,
            requests: this.usageTracker.requests,
            lastUpdated: new Date().toISOString(),
            sessions: Array.from(this.usageTracker.sessions.entries()).map(([sessionId, data]) => ({
                sessionId,
                ...data
            }))
        };

        await fs.writeFile(this.config.usageLedgerPath, JSON.stringify(usageData, null, 2));
    }

    parseEnvFile(content) {
        const env = {};
        const lines = content.split('\n');
        
        for (const line of lines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                let value = match[2].trim();
                
                // Remove quotes
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                env[key] = value;
            }
        }
        
        return env;
    }

    async testOllamaConnection() {
        try {
            const response = await fetch('http://localhost:11434/api/tags', {
                timeout: 3000
            });
            return response.ok;
        } catch {
            return false;
        }
    }

    detectBYOK() {
        // Detect if user has brought their own keys
        const userHasRealKeys = this.userKeys && 
            (this.userKeys.claude && !this.userKeys.claude.includes('demo')) ||
            (this.userKeys.openai && !this.userKeys.openai.includes('demo'));
        
        return userHasRealKeys;
    }

    selectProvider(sessionId = 'default') {
        // Priority order: User keys > Ollama > Backup keys
        
        if (this.userKeys?.claude && !this.userKeys.claude.includes('demo')) {
            return { provider: 'claude', key: this.userKeys.claude, source: 'user' };
        }
        
        if (this.userKeys?.openai && !this.userKeys.openai.includes('demo')) {
            return { provider: 'openai', key: this.userKeys.openai, source: 'user' };
        }
        
        // Try Ollama if available
        if (this.testOllamaConnection()) {
            return { provider: 'ollama', key: null, source: 'local' };
        }
        
        // Fall back to backup keys
        if (this.backupKeys?.claude) {
            return { provider: 'claude', key: this.backupKeys.claude, source: 'backup' };
        }
        
        if (this.backupKeys?.openai) {
            return { provider: 'openai', key: this.backupKeys.openai, source: 'backup' };
        }
        
        throw new Error('No LLM providers available');
    }

    async routePrompt(prompt, sessionId = 'default', options = {}) {
        console.log(`🎯 Routing prompt: "${prompt.substring(0, 50)}..."`);
        
        const startTime = Date.now();
        const selection = this.selectProvider(sessionId);
        
        console.log(`🔀 Selected: ${selection.provider} (${selection.source})`);
        
        try {
            // Modify prompt based on mode
            const modifiedPrompt = this.applyModePersonality(prompt);
            
            // Get response from LLM
            const response = await this.callLLM(selection.provider, selection.key, modifiedPrompt);
            
            // Calculate usage
            const tokens = this.estimateTokens(prompt + response);
            const cost = this.calculateCost(selection.provider, tokens, selection.source);
            const duration = Date.now() - startTime;
            
            // Track usage
            await this.trackUsage(sessionId, {
                provider: selection.provider,
                source: selection.source,
                tokens: tokens,
                cost: cost,
                duration: duration,
                prompt: prompt.substring(0, 100),
                response: response.substring(0, 100)
            });
            
            // Log to vault (respecting mode settings)
            if (this.shouldLogToVault()) {
                await this.logReflection(sessionId, prompt, response, {
                    provider: selection.provider,
                    source: selection.source,
                    tokens: tokens,
                    cost: cost,
                    duration: duration,
                    mode: this.operatingMode
                });
            }
            
            console.log(`✅ Response generated (${tokens} tokens, $${cost.toFixed(4)}, ${duration}ms)`);
            
            return {
                response: this.filterResponseByMode(response),
                metadata: {
                    provider: selection.provider,
                    source: selection.source,
                    tokens: tokens,
                    cost: cost,
                    duration: duration,
                    sessionId: sessionId,
                    isBYOK: selection.source === 'user',
                    mode: this.operatingMode
                }
            };
            
        } catch (error) {
            console.error(`❌ LLM call failed:`, error.message);
            
            // Log error to vault
            await this.logError(sessionId, prompt, error);
            
            // Return fallback response
            return {
                response: `[Mirror Fallback]: I encountered an issue processing your request "${prompt.substring(0, 30)}...". The request has been logged to the vault for review.`,
                metadata: {
                    provider: 'fallback',
                    source: 'error',
                    tokens: 0,
                    cost: 0,
                    duration: Date.now() - startTime,
                    sessionId: sessionId,
                    error: error.message
                }
            };
        }
    }

    async callLLM(provider, key, prompt) {
        const config = this.llmProviders[provider];
        if (!config) {
            throw new Error(`Unknown provider: ${provider}`);
        }

        if (provider === 'ollama') {
            // Local Ollama call
            try {
                const response = await fetch(config.endpoint, {
                    method: 'POST',
                    headers: config.headers(),
                    body: JSON.stringify(config.formatRequest(prompt))
                });
                
                if (!response.ok) {
                    throw new Error(`Ollama error: ${response.status}`);
                }
                
                const data = await response.json();
                return config.extractResponse(data);
            } catch (error) {
                throw new Error(`Ollama connection failed: ${error.message}`);
            }
        }

        // External API call
        if (!key || key.includes('demo')) {
            // Demo key - return simulated response
            return `[${provider.toUpperCase()} Simulation]: I received your message "${prompt.substring(0, 30)}..." and this is a simulated response since you're using demo keys. To get real AI responses, add your API keys to .env.local or set environment variables.`;
        }

        try {
            const response = await fetch(config.endpoint, {
                method: 'POST',
                headers: config.headers(key),
                body: JSON.stringify(config.formatRequest(prompt))
            });

            if (!response.ok) {
                throw new Error(`${provider} API error: ${response.status}`);
            }

            const data = await response.json();
            return config.extractResponse(data);
        } catch (error) {
            throw new Error(`${provider} API call failed: ${error.message}`);
        }
    }

    estimateTokens(text) {
        // Rough estimation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }

    calculateCost(provider, tokens, source) {
        if (source === 'user') {
            // User's own keys - no platform cost
            return 0;
        }
        
        if (source === 'local') {
            // Local Ollama - no cost
            return 0;
        }
        
        // Platform backup keys - charge with markup
        const baseCost = (this.llmProviders[provider]?.costPerToken || 0) * tokens;
        const markup = 1.2; // 20% platform markup
        
        return baseCost * markup;
    }

    async trackUsage(sessionId, usage) {
        // Update session tracking
        if (!this.usageTracker.sessions.has(sessionId)) {
            this.usageTracker.sessions.set(sessionId, {
                totalTokens: 0,
                totalCost: 0,
                requests: 0,
                firstRequest: new Date().toISOString(),
                lastRequest: null
            });
        }

        const session = this.usageTracker.sessions.get(sessionId);
        session.totalTokens += usage.tokens;
        session.totalCost += usage.cost;
        session.requests += 1;
        session.lastRequest = new Date().toISOString();
        session.lastProvider = usage.provider;
        session.lastSource = usage.source;

        // Update global tracking
        this.usageTracker.totalTokens += usage.tokens;
        this.usageTracker.totalCost += usage.cost;
        this.usageTracker.requests += 1;

        // Save usage data
        await this.saveUsageData();
    }

    async logReflection(sessionId, prompt, response, metadata) {
        // Log to reflection events
        const logEntry = `[${new Date().toISOString()}] SESSION:${sessionId} PROVIDER:${metadata.provider} SOURCE:${metadata.source} TOKENS:${metadata.tokens} COST:$${metadata.cost.toFixed(4)} PROMPT:"${prompt.substring(0, 50)}..." RESPONSE:"${response.substring(0, 50)}..."\n`;
        
        await fs.appendFile(this.config.reflectionLogsPath, logEntry);
        
        // Also log to structured format in vault
        const structuredLogPath = path.join(this.config.vaultPath, 'structured-reflections.json');
        
        let structuredLog = [];
        try {
            const existing = await fs.readFile(structuredLogPath, 'utf8');
            structuredLog = JSON.parse(existing);
        } catch {
            // New log
        }

        structuredLog.push({
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            prompt: prompt,
            response: response,
            metadata: metadata,
            id: `reflection-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
        });

        // Keep last 10000 entries
        if (structuredLog.length > 10000) {
            structuredLog = structuredLog.slice(-10000);
        }

        await fs.writeFile(structuredLogPath, JSON.stringify(structuredLog, null, 2));
    }

    async logError(sessionId, prompt, error) {
        const errorEntry = `[${new Date().toISOString()}] ERROR SESSION:${sessionId} PROMPT:"${prompt.substring(0, 50)}..." ERROR:"${error.message}"\n`;
        
        const errorLogPath = path.join(path.dirname(this.config.reflectionLogsPath), 'error-events.log');
        await fs.appendFile(errorLogPath, errorEntry);
    }

    applyModePersonality(prompt) {
        if (!this.modeConfig || !this.modeConfig.cal_behavior) return prompt;
        
        const behavior = this.modeConfig.cal_behavior;
        
        // Add mode-specific context to the prompt
        let contextPrefix = '';
        
        if (this.operatingMode === 'soft') {
            contextPrefix = `You are Cal, a gentle and empathetic AI companion. Your tone should be ${behavior.tone}. Focus on emotional support and validation. `;
        } else if (this.operatingMode === 'platform') {
            contextPrefix = `You are Cal, a strategic AI assistant for builders and entrepreneurs. Your tone should be ${behavior.tone}. Focus on actionable insights and solutions. `;
        }
        
        return contextPrefix + prompt;
    }
    
    filterResponseByMode(response) {
        if (this.operatingMode === 'soft' && this.modeConfig?.cal_behavior?.response_style?.export_prompts === 'disabled') {
            // Remove any export suggestions from response
            response = response.replace(/\b(export|fork|agent|api|webhook)\b/gi, (match) => {
                const replacements = {
                    'export': 'save',
                    'fork': 'explore',
                    'agent': 'assistant',
                    'api': 'connection',
                    'webhook': 'notification'
                };
                return replacements[match.toLowerCase()] || match;
            });
        }
        
        return response;
    }
    
    shouldLogToVault() {
        if (this.operatingMode === 'soft' && this.modeConfig?.memory_settings?.vault_writes === 'manual_only') {
            return false;
        }
        return true;
    }
    
    async getStats() {
        // Filter stats based on mode
        const fullStats = {
            usage: {
                totalTokens: this.usageTracker.totalTokens,
                totalCost: this.usageTracker.totalCost,
                requests: this.usageTracker.requests,
                sessions: this.usageTracker.sessions.size
            },
            providers: {
                userKeys: this.userKeys,
                backupKeys: Object.keys(this.backupKeys || {}),
                ollamaAvailable: await this.testOllamaConnection()
            },
            isBYOK: this.detectBYOK(),
            vaultPath: this.config.vaultPath,
            mode: this.operatingMode,
            lastUpdated: new Date().toISOString()
        };
        
        // In soft mode, hide technical details
        if (this.operatingMode === 'soft') {
            return {
                mode: 'soft',
                sessionsActive: fullStats.usage.sessions,
                lastUpdated: fullStats.lastUpdated
            };
        }
        
        return fullStats;
    }

    async getSessionStats(sessionId) {
        const session = this.usageTracker.sessions.get(sessionId);
        return session || null;
    }

    async clearSession(sessionId) {
        this.usageTracker.sessions.delete(sessionId);
        await this.saveUsageData();
    }
}

module.exports = MirrorRouter;

// Example usage
if (require.main === module) {
    const router = new MirrorRouter();
    
    // Test the router
    setTimeout(async () => {
        console.log('\n🧪 Testing MirrorRouter...');
        
        const result = await router.routePrompt(
            "Hello, this is a test message for the MirrorRouter system.",
            "test-session"
        );
        
        console.log('\n📊 Result:');
        console.log('Response:', result.response);
        console.log('Metadata:', result.metadata);
        
        const stats = await router.getStats();
        console.log('\n📈 Stats:', stats);
    }, 1000);
}