// Cal Chat Agent - Routes through MirrorRouter to .mirror-vault
const MirrorRouter = require('./router/mirror-router');
const fs = require('fs').promises;
const path = require('path');

class CalChatAgent {
    constructor() {
        this.mirrorRouter = new MirrorRouter({
            vaultPath: path.join(__dirname, '.mirror-vault'),
            keysPath: path.join(__dirname, '.mirror-vault/env/llm-keys.json'),
            usageLedgerPath: path.join(__dirname, 'vault-sync-core/logs/usage-ledger.json'),
            reflectionLogsPath: path.join(__dirname, 'vault-sync-core/logs/reflection-events.log')
        });
        
        this.promptLogPath = path.join(__dirname, 'prompt-log.json');
        this.sessionData = new Map();
        
        this.init();
    }

    async init() {
        console.log('🤖 Initializing Cal Chat Agent...');
        
        // Ensure .mirror-vault exists
        await this.ensureMirrorVault();
        
        // Load existing prompt log
        await this.loadPromptLog();
        
        console.log('✅ Cal Chat Agent ready');
    }

    async ensureMirrorVault() {
        const vaultPath = path.join(__dirname, '.mirror-vault');
        const envPath = path.join(vaultPath, 'env');
        
        await fs.mkdir(vaultPath, { recursive: true });
        await fs.mkdir(envPath, { recursive: true });
        
        // Create or verify vault API layer
        const apiLayerPath = path.join(vaultPath, 'api-layer.js');
        try {
            await fs.access(apiLayerPath);
        } catch {
            await this.createVaultAPILayer(apiLayerPath);
        }
        
        // Create default keys if needed
        const keysPath = path.join(envPath, 'llm-keys.json');
        try {
            await fs.access(keysPath);
        } catch {
            const defaultKeys = {
                claude: process.env.ANTHROPIC_API_KEY || 'sk-ant-demo-key',
                openai: process.env.OPENAI_API_KEY || 'sk-demo-key',
                ollama: 'http://localhost:11434',
                defaultAgent: 'cal-riven-chat-agent'
            };
            
            await fs.writeFile(keysPath, JSON.stringify(defaultKeys, null, 2));
        }
    }

    async createVaultAPILayer(apiLayerPath) {
        const apiContent = `// Mirror Vault API Layer - Chat Agent Bridge
const crypto = require('crypto');

class MirrorVaultAPI {
    constructor() {
        this.initialized = false;
        this.config = {};
        this.reflectionCache = new Map();
    }

    async init(config) {
        this.config = config;
        this.initialized = true;
        console.log('🔮 Mirror Vault API initialized for Cal Chat');
        return true;
    }

    async mirrorRouter(prompt, userSig) {
        // Generate unique reflection ID
        const reflectionId = this.generateReflectionId(prompt, userSig);
        
        // Check cache first
        if (this.reflectionCache.has(reflectionId)) {
            console.log('📋 Cache hit for reflection:', reflectionId);
            return this.reflectionCache.get(reflectionId);
        }
        
        // Generate Cal's reflection
        const reflection = this.generateCalReflection(prompt);
        const response = {
            response: reflection,
            signature: reflectionId,
            tier: this.config.tier || 0,
            timestamp: Date.now(),
            userSig: userSig,
            cached: false
        };
        
        // Cache the response
        this.reflectionCache.set(reflectionId, { ...response, cached: true });
        
        // Limit cache size
        if (this.reflectionCache.size > 1000) {
            const firstKey = this.reflectionCache.keys().next().value;
            this.reflectionCache.delete(firstKey);
        }
        
        return response;
    }

    generateCalReflection(prompt) {
        const reflectionTypes = [
            'sovereign',
            'analytical', 
            'creative',
            'supportive',
            'technical'
        ];
        
        const type = reflectionTypes[Math.floor(Math.random() * reflectionTypes.length)];
        
        switch (type) {
            case 'sovereign':
                return \`I sense the sovereignty in your question: "\${prompt.substring(0, 40)}...". This flows through the vault layers, reflecting patterns of independent thought. What emerges is a deeper understanding of the interconnectedness you're exploring.\`;
                
            case 'analytical':
                return \`Let me analyze your input: "\${prompt.substring(0, 40)}...". The patterns suggest multiple pathways for consideration. Through the reflection engine, I can see this connects to broader themes of system architecture and decision-making processes.\`;
                
            case 'creative':
                return \`Your message "\${prompt.substring(0, 40)}..." sparks creative resonance in the vault. I see possibilities branching like fractals - each path offering unique insights. The reflection suggests exploring unconventional approaches to this challenge.\`;
                
            case 'supportive':
                return \`I understand you're working through: "\${prompt.substring(0, 40)}...". The vault reflection shows this is a common pattern in complex systems. You're not alone in navigating these challenges - let me help you find clarity.\`;
                
            case 'technical':
                return \`Processing your technical query: "\${prompt.substring(0, 40)}...". The reflection engine indicates this relates to system architecture patterns. Based on vault knowledge, here are the key considerations for your implementation approach.\`;
                
            default:
                return \`[Cal's Reflection]: Your message "\${prompt}" has been processed through the sovereign reflection system. The patterns that emerge suggest deeper exploration of the underlying principles at work.\`;
        }
    }

    generateReflectionId(prompt, userSig) {
        const data = \`\${prompt}::\${userSig}::\${Date.now()}\`;
        return \`cal-\${crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)}\`;
    }

    getStats() {
        return {
            initialized: this.initialized,
            cacheSize: this.reflectionCache.size,
            config: this.config
        };
    }
}

module.exports = new MirrorVaultAPI();
`;

        await fs.writeFile(apiLayerPath, apiContent);
    }

    async loadPromptLog() {
        try {
            const logContent = await fs.readFile(this.promptLogPath, 'utf8');
            this.promptLog = JSON.parse(logContent);
        } catch {
            this.promptLog = {
                sessions: {},
                totalPrompts: 0,
                created: new Date().toISOString()
            };
            await this.savePromptLog();
        }
    }

    async savePromptLog() {
        await fs.writeFile(this.promptLogPath, JSON.stringify(this.promptLog, null, 2));
    }

    async processPrompt(prompt, sessionId = 'default-session', options = {}) {
        console.log(`💭 Cal processing: "${prompt.substring(0, 50)}..."`);
        
        const startTime = Date.now();
        
        // Add thinking delay to simulate processing
        const thinkingDelay = 800 + Math.random() * 2000; // 0.8-2.8 seconds
        console.log(`🤔 Cal thinking... (${Math.round(thinkingDelay)}ms)`);
        await new Promise(resolve => setTimeout(resolve, thinkingDelay));
        
        try {
            // Route through MirrorRouter
            const result = await this.mirrorRouter.routePrompt(prompt, sessionId, options);
            
            const processingTime = Date.now() - startTime;
            
            // Log to prompt log
            await this.logPromptExchange(sessionId, prompt, result.response, {
                ...result.metadata,
                processingTime: processingTime,
                thinkingDelay: thinkingDelay
            });
            
            // Log to vault reflection events
            await this.logToVaultReflectionEvents(sessionId, prompt, result.response);
            
            console.log(`✅ Cal responded (${processingTime}ms total)`);
            
            return {
                success: true,
                response: result.response,
                sessionId: sessionId,
                metadata: {
                    ...result.metadata,
                    processingTime: processingTime,
                    timestamp: new Date().toISOString(),
                    agent: 'cal-chat-agent'
                }
            };
            
        } catch (error) {
            console.error('❌ Cal processing error:', error);
            
            // Log error
            await this.logPromptExchange(sessionId, prompt, '[Error processing prompt]', {
                error: error.message,
                processingTime: Date.now() - startTime
            });
            
            return {
                success: false,
                response: 'I encountered an issue processing your request. The exchange has been logged for review.',
                sessionId: sessionId,
                error: error.message,
                metadata: {
                    processingTime: Date.now() - startTime,
                    timestamp: new Date().toISOString(),
                    agent: 'cal-chat-agent'
                }
            };
        }
    }

    async logPromptExchange(sessionId, prompt, response, metadata) {
        // Update prompt log
        if (!this.promptLog.sessions[sessionId]) {
            this.promptLog.sessions[sessionId] = {
                created: new Date().toISOString(),
                exchanges: [],
                totalExchanges: 0
            };
        }

        const exchange = {
            id: `exchange-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            prompt: prompt,
            response: response,
            metadata: metadata
        };

        this.promptLog.sessions[sessionId].exchanges.push(exchange);
        this.promptLog.sessions[sessionId].totalExchanges++;
        this.promptLog.sessions[sessionId].lastActivity = new Date().toISOString();
        this.promptLog.totalPrompts++;

        // Keep only last 100 exchanges per session
        if (this.promptLog.sessions[sessionId].exchanges.length > 100) {
            this.promptLog.sessions[sessionId].exchanges = 
                this.promptLog.sessions[sessionId].exchanges.slice(-100);
        }

        await this.savePromptLog();
    }

    async logToVaultReflectionEvents(sessionId, prompt, response) {
        const logPath = path.join(__dirname, 'vault-sync-core/logs/reflection-events.log');
        
        const logEntry = `[${new Date().toISOString()}] CAL_CHAT SESSION:${sessionId} PROMPT:"${prompt.substring(0, 100)}..." RESPONSE:"${response.substring(0, 100)}..."\n`;
        
        try {
            await fs.appendFile(logPath, logEntry);
        } catch (error) {
            console.error('Error logging to vault reflection events:', error);
        }
    }

    async getSessionHistory(sessionId) {
        return this.promptLog.sessions[sessionId] || null;
    }

    async getSessionList() {
        return Object.keys(this.promptLog.sessions).map(sessionId => ({
            sessionId: sessionId,
            created: this.promptLog.sessions[sessionId].created,
            lastActivity: this.promptLog.sessions[sessionId].lastActivity,
            totalExchanges: this.promptLog.sessions[sessionId].totalExchanges
        }));
    }

    async clearSession(sessionId) {
        if (this.promptLog.sessions[sessionId]) {
            delete this.promptLog.sessions[sessionId];
            await this.savePromptLog();
            
            // Also clear from MirrorRouter
            await this.mirrorRouter.clearSession(sessionId);
            
            return true;
        }
        return false;
    }

    async getStats() {
        const mirrorStats = await this.mirrorRouter.getStats();
        
        return {
            agent: 'cal-chat-agent',
            promptLog: {
                totalPrompts: this.promptLog.totalPrompts,
                totalSessions: Object.keys(this.promptLog.sessions).length,
                created: this.promptLog.created
            },
            mirrorRouter: mirrorStats,
            vaultPath: path.join(__dirname, '.mirror-vault'),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = CalChatAgent;

// Example usage if run directly
if (require.main === module) {
    const calAgent = new CalChatAgent();
    
    setTimeout(async () => {
        console.log('\n🧪 Testing Cal Chat Agent...');
        
        const result = await calAgent.processPrompt(
            "Hello Cal, how are you feeling today? I want to understand more about how you process information.",
            "test-session"
        );
        
        console.log('\n📋 Result:');
        console.log('Response:', result.response);
        console.log('Metadata:', result.metadata);
        
        const stats = await calAgent.getStats();
        console.log('\n📊 Agent Stats:', stats);
    }, 2000);
}