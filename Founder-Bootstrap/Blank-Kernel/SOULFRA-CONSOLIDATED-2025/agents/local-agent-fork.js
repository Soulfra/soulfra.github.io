const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// LLM connectors
const claudeConnector = require('./connectors/claude-connector');
const openaiConnector = require('./connectors/openai-connector');
const ollamaConnector = require('./connectors/ollama-connector');
const localConnector = require('./connectors/local-connector');

// Session state
const sessions = new Map();
const forkCache = new Map();

class LocalAgentFork {
    constructor() {
        this.connectors = {
            claude: claudeConnector,
            openai: openaiConnector,
            ollama: ollamaConnector,
            local: localConnector
        };
        this.vaultPath = path.join(__dirname, '../../vault');
        this.tier4Path = path.join(__dirname, '../../tier-minus4/cal-reasoning-kernel');
    }

    async initialize(sessionId, keys, qrCode) {
        // Store session info
        sessions.set(sessionId, {
            keys,
            qrCode,
            initialized: Date.now(),
            reflectionCount: 0,
            forkId: crypto.randomBytes(16).toString('hex')
        });

        // Initialize connectors with keys
        if (keys.claude) {
            await this.connectors.claude.initialize(keys.claude);
        }
        if (keys.openai) {
            await this.connectors.openai.initialize(keys.openai);
        }
        if (keys.ollama) {
            await this.connectors.ollama.initialize(keys.ollama);
        }

        console.log(`✅ Tier-3 router initialized for session: ${sessionId}`);
    }

    async reflect(params) {
        const { prompt, sessionId, keys, qrCode, options = {} } = params;
        
        if (!sessions.has(sessionId)) {
            throw new Error('Invalid session');
        }

        const session = sessions.get(sessionId);
        session.reflectionCount++;

        // Load vault override if exists
        const vaultOverride = await this.loadVaultOverride(sessionId);
        
        // Apply mesh shield transformations if enabled
        let transformedPrompt = prompt;
        if (options.useShield || options.useCringe || options.useTone) {
            transformedPrompt = await this.applyTransformations(prompt, options);
        }

        // Route to appropriate LLM
        const llmChoice = vaultOverride?.preferredLLM || this.selectLLM(keys);
        
        // Get reflection from tier-4 reasoning kernel
        const reasoning = await this.invokeReasoningKernel(transformedPrompt, llmChoice, session);

        // Execute reflection through chosen LLM
        const result = await this.executeLLMReflection(reasoning, llmChoice, keys);

        // Log to vault
        await this.logReflection(sessionId, prompt, result, llmChoice);

        return {
            response: result.response,
            metadata: {
                llm: llmChoice,
                sessionId,
                forkId: session.forkId,
                transformations: options,
                reflectionCount: session.reflectionCount,
                reasoning: reasoning.metadata
            }
        };
    }

    async loadVaultOverride(sessionId) {
        try {
            const overridePath = path.join(__dirname, 'vault-override.json');
            const data = await fs.readFile(overridePath, 'utf8');
            const overrides = JSON.parse(data);
            return overrides[sessionId] || overrides.default || null;
        } catch (error) {
            return null;
        }
    }

    selectLLM(keys) {
        // Priority order based on available keys
        if (keys.claude && keys.claude !== 'default') return 'claude';
        if (keys.openai) return 'openai';
        if (keys.ollama) return 'ollama';
        return 'local';
    }

    async applyTransformations(prompt, options) {
        let transformed = prompt;

        try {
            const shieldPath = path.join(__dirname, '../../mesh-shield/prompt-transformer');
            const transformer = require(shieldPath);
            
            transformed = await transformer.transform(prompt, 'tier3-router', {
                npc: options.useShield,
                cringe: options.useCringe,
                tone: options.useTone
            });
        } catch (error) {
            console.warn('⚠️ Shield transformation not available:', error.message);
        }

        return transformed;
    }

    async invokeReasoningKernel(prompt, llmChoice, session) {
        try {
            const kernelPath = path.join(this.tier4Path, 'cal-reflect-core.js');
            const kernel = require(kernelPath);
            
            return await kernel.reason({
                prompt,
                llm: llmChoice,
                forkId: session.forkId,
                context: {
                    reflectionCount: session.reflectionCount,
                    qrCode: session.qrCode
                }
            });
        } catch (error) {
            console.warn('⚠️ Reasoning kernel not available, using direct reflection');
            return {
                enhancedPrompt: prompt,
                metadata: {
                    direct: true,
                    reason: 'kernel-unavailable'
                }
            };
        }
    }

    async executeLLMReflection(reasoning, llmChoice, keys) {
        const connector = this.connectors[llmChoice];
        
        if (!connector) {
            throw new Error(`Unknown LLM: ${llmChoice}`);
        }

        try {
            // Check fork cache first
            const cacheKey = `${llmChoice}-${crypto.createHash('md5').update(reasoning.enhancedPrompt).digest('hex')}`;
            if (forkCache.has(cacheKey)) {
                console.log('📋 Using cached reflection');
                return forkCache.get(cacheKey);
            }

            // Execute reflection
            const result = await connector.reflect(reasoning.enhancedPrompt, keys[llmChoice]);

            // Cache result
            forkCache.set(cacheKey, result);
            if (forkCache.size > 100) {
                // Remove oldest entries
                const firstKey = forkCache.keys().next().value;
                forkCache.delete(firstKey);
            }

            return result;
        } catch (error) {
            console.error(`❌ ${llmChoice} reflection failed:`, error);
            
            // Fallback to local
            if (llmChoice !== 'local') {
                console.log('🔄 Falling back to local reflection');
                return await this.connectors.local.reflect(reasoning.enhancedPrompt);
            }
            
            throw error;
        }
    }

    async logReflection(sessionId, prompt, result, llm) {
        try {
            const logPath = path.join(this.vaultPath, 'tier3-reflections.json');
            let log = [];
            
            try {
                const existing = await fs.readFile(logPath, 'utf8');
                log = JSON.parse(existing);
            } catch (e) {
                // File doesn't exist yet
            }

            log.push({
                sessionId,
                timestamp: Date.now(),
                prompt: prompt.substring(0, 100) + '...',
                responsePreview: result.response.substring(0, 100) + '...',
                llm,
                success: true
            });

            // Keep only last 500 entries
            if (log.length > 500) {
                log = log.slice(-500);
            }

            await fs.writeFile(logPath, JSON.stringify(log, null, 2));
        } catch (error) {
            console.error('Failed to log reflection:', error);
        }
    }

    // Get fork statistics
    async getStats(sessionId) {
        if (!sessions.has(sessionId)) {
            return null;
        }

        const session = sessions.get(sessionId);
        return {
            sessionId,
            forkId: session.forkId,
            initialized: new Date(session.initialized).toISOString(),
            reflectionCount: session.reflectionCount,
            cacheSize: forkCache.size,
            activeSessions: sessions.size
        };
    }
}

// Export singleton instance
const router = new LocalAgentFork();

module.exports = {
    initialize: router.initialize.bind(router),
    reflect: router.reflect.bind(router),
    getStats: router.getStats.bind(router)
};