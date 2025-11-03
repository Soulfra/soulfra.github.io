// Agent Builder - Creates agents with vault integration
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class AgentBuilder {
    constructor() {
        this.agentsPath = path.join(__dirname, 'vault/agents');
        this.templatesPath = path.join(__dirname, 'template-reflection/templates');
        this.vaultLogsPath = path.join(__dirname, 'vault-sync-core/logs');
        
        this.init();
    }

    async init() {
        console.log('🛠️ Initializing Agent Builder...');
        
        await this.ensureDirectories();
        await this.loadAgentTemplates();
        
        console.log('✅ Agent Builder ready');
    }

    async ensureDirectories() {
        const dirs = [
            this.agentsPath,
            this.templatesPath,
            this.vaultLogsPath,
            path.join(this.agentsPath, 'imported'),
            path.join(this.agentsPath, 'custom')
        ];

        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async loadAgentTemplates() {
        // Create default templates if they don't exist
        const defaultTemplates = [
            {
                id: 'cal-echo',
                name: 'Cal Echo',
                description: 'A supportive operator that reflects user intent',
                type: 'assistant',
                systemPrompt: 'You are Cal, a sovereign AI assistant. You reflect user intentions through the vault layers, providing thoughtful and supportive responses.',
                capabilities: ['conversation', 'reflection', 'analysis'],
                vaultIntegration: true,
                mirrorSignature: 'cal-echo-001'
            },
            {
                id: 'vault-analyst',
                name: 'Vault Analyst',
                description: 'Specialized in data analysis and pattern recognition',
                type: 'analyst',
                systemPrompt: 'You are a data analyst that operates through the MirrorOS vault. Analyze patterns, extract insights, and provide structured analysis.',
                capabilities: ['analysis', 'data-processing', 'pattern-recognition'],
                vaultIntegration: true,
                mirrorSignature: 'vault-analyst-001'
            },
            {
                id: 'creative-forge',
                name: 'Creative Forge',
                description: 'Creative agent for content generation and ideation',
                type: 'creative',
                systemPrompt: 'You are a creative AI that generates original content, ideas, and artistic concepts through the sovereign reflection system.',
                capabilities: ['content-generation', 'ideation', 'creativity'],
                vaultIntegration: true,
                mirrorSignature: 'creative-forge-001'
            }
        ];

        for (const template of defaultTemplates) {
            const templatePath = path.join(this.templatesPath, `${template.id}.json`);
            try {
                await fs.access(templatePath);
            } catch {
                await fs.writeFile(templatePath, JSON.stringify(template, null, 2));
            }
        }
    }

    async buildAgent(config) {
        console.log(`🏗️ Building agent: ${config.name}`);
        
        const agentId = `agent-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
        const agent = {
            id: agentId,
            name: config.name,
            description: config.description,
            type: config.type || 'assistant',
            systemPrompt: config.systemPrompt,
            capabilities: config.capabilities || [],
            tools: config.tools || [],
            vaultIntegration: config.vaultIntegration !== false,
            mirrorSignature: config.mirrorSignature || `agent-${agentId}`,
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            metadata: {
                builder: 'agent-builder',
                version: '1.0.0',
                ...config.metadata
            }
        };

        // Save agent to vault
        const agentPath = path.join(this.agentsPath, 'custom', `${agentId}.json`);
        await fs.writeFile(agentPath, JSON.stringify(agent, null, 2));

        // Create agent runtime wrapper
        await this.createAgentRuntime(agent);

        // Log to vault
        await this.logToVault('agent-builder', 'agent_created', {
            agentId: agentId,
            name: agent.name,
            type: agent.type,
            capabilities: agent.capabilities.length,
            vaultIntegrated: agent.vaultIntegration
        });

        console.log(`✅ Agent built: ${agent.name} (${agentId})`);
        return agent;
    }

    async createAgentRuntime(agent) {
        const runtimePath = path.join(this.agentsPath, 'custom', `${agent.id}-runtime.js`);
        
        const runtimeCode = `// Generated Agent Runtime for ${agent.name}
const MirrorRouter = require('../../router/mirror-router');
const fs = require('fs').promises;
const path = require('path');

class ${this.toCamelCase(agent.name)}Agent {
    constructor() {
        this.config = ${JSON.stringify(agent, null, 8)};
        this.mirrorRouter = null;
        this.sessionData = new Map();
        
        if (this.config.vaultIntegration) {
            this.mirrorRouter = new MirrorRouter({
                vaultPath: path.join(__dirname, '../../vault'),
                keysPath: path.join(__dirname, '../../vault/env/llm-keys.json')
            });
        }
    }

    async processMessage(message, sessionId = 'default', context = {}) {
        console.log(\`🤖 \${this.config.name} processing message...\`);
        
        const fullPrompt = this.buildPrompt(message, context);
        
        if (this.config.vaultIntegration && this.mirrorRouter) {
            // Route through vault
            const result = await this.mirrorRouter.routePrompt(fullPrompt, sessionId);
            
            return {
                response: result.response,
                agent: this.config.name,
                agentId: this.config.id,
                metadata: {
                    ...result.metadata,
                    capabilities: this.config.capabilities,
                    mirrorSignature: this.config.mirrorSignature
                }
            };
        } else {
            // Direct processing (fallback)
            return {
                response: \`[\${this.config.name}]: I've processed your message "\${message.substring(0, 30)}..." directly. For full vault integration, ensure MirrorRouter is configured.\`,
                agent: this.config.name,
                agentId: this.config.id,
                metadata: {
                    provider: 'direct',
                    capabilities: this.config.capabilities,
                    mirrorSignature: this.config.mirrorSignature
                }
            };
        }
    }

    buildPrompt(message, context) {
        let prompt = this.config.systemPrompt + '\\n\\n';
        
        if (context.previousMessages) {
            prompt += 'Previous conversation context:\\n';
            context.previousMessages.slice(-3).forEach(msg => {
                prompt += \`User: \${msg.user}\\nAssistant: \${msg.assistant}\\n\`;
            });
            prompt += '\\n';
        }
        
        prompt += \`Current user message: \${message}\`;
        
        return prompt;
    }

    getCapabilities() {
        return this.config.capabilities;
    }

    getConfig() {
        return this.config;
    }

    async getStats() {
        return {
            agent: this.config.name,
            id: this.config.id,
            created: this.config.created,
            capabilities: this.config.capabilities,
            vaultIntegrated: this.config.vaultIntegration,
            activeSessions: this.sessionData.size
        };
    }
}

module.exports = ${this.toCamelCase(agent.name)}Agent;

// Example usage
if (require.main === module) {
    const agent = new ${this.toCamelCase(agent.name)}Agent();
    
    agent.processMessage('Hello, how can you help me?').then(result => {
        console.log('Response:', result.response);
        console.log('Metadata:', result.metadata);
    });
}
`;

        await fs.writeFile(runtimePath, runtimeCode);
    }

    toCamelCase(str) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
    }

    async getAgentTemplates() {
        const templates = [];
        
        try {
            const templateFiles = await fs.readdir(this.templatesPath);
            
            for (const file of templateFiles) {
                if (file.endsWith('.json')) {
                    const templateContent = await fs.readFile(
                        path.join(this.templatesPath, file), 
                        'utf8'
                    );
                    templates.push(JSON.parse(templateContent));
                }
            }
        } catch (error) {
            console.error('Error loading templates:', error);
        }
        
        return templates;
    }

    async getBuiltAgents() {
        const agents = [];
        
        try {
            const customDir = path.join(this.agentsPath, 'custom');
            const agentFiles = await fs.readdir(customDir);
            
            for (const file of agentFiles) {
                if (file.endsWith('.json')) {
                    const agentContent = await fs.readFile(
                        path.join(customDir, file), 
                        'utf8'
                    );
                    agents.push(JSON.parse(agentContent));
                }
            }
        } catch (error) {
            console.error('Error loading built agents:', error);
        }
        
        return agents;
    }

    async cloneAgent(agentId, newName, modifications = {}) {
        console.log(`📋 Cloning agent: ${agentId} -> ${newName}`);
        
        // Find the original agent
        const agents = await this.getBuiltAgents();
        const originalAgent = agents.find(a => a.id === agentId);
        
        if (!originalAgent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        
        // Create cloned agent with modifications
        const clonedConfig = {
            ...originalAgent,
            name: newName,
            description: modifications.description || `Cloned from ${originalAgent.name}`,
            systemPrompt: modifications.systemPrompt || originalAgent.systemPrompt,
            capabilities: modifications.capabilities || originalAgent.capabilities,
            tools: modifications.tools || originalAgent.tools,
            metadata: {
                ...originalAgent.metadata,
                clonedFrom: originalAgent.id,
                clonedAt: new Date().toISOString(),
                ...modifications.metadata
            }
        };
        
        return await this.buildAgent(clonedConfig);
    }

    async deleteAgent(agentId) {
        console.log(`🗑️ Deleting agent: ${agentId}`);
        
        const agentPath = path.join(this.agentsPath, 'custom', `${agentId}.json`);
        const runtimePath = path.join(this.agentsPath, 'custom', `${agentId}-runtime.js`);
        
        try {
            await fs.unlink(agentPath);
            await fs.unlink(runtimePath);
            
            await this.logToVault('agent-builder', 'agent_deleted', { agentId });
            
            return true;
        } catch (error) {
            console.error('Error deleting agent:', error);
            return false;
        }
    }

    async exportAgent(agentId, format = 'json') {
        console.log(`📤 Exporting agent: ${agentId} (${format})`);
        
        const agents = await this.getBuiltAgents();
        const agent = agents.find(a => a.id === agentId);
        
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }
        
        const exportData = {
            agent: agent,
            runtime: null,
            exported: new Date().toISOString(),
            format: format,
            version: '1.0.0'
        };
        
        // Include runtime code if requested
        if (format === 'full' || format === 'zip') {
            const runtimePath = path.join(this.agentsPath, 'custom', `${agentId}-runtime.js`);
            try {
                exportData.runtime = await fs.readFile(runtimePath, 'utf8');
            } catch {
                exportData.runtime = '// Runtime not available';
            }
        }
        
        // Log export to vault
        await this.logToVault('agent-builder', 'agent_exported', {
            agentId: agentId,
            name: agent.name,
            format: format
        });
        
        return exportData;
    }

    async importAgent(agentData, source = 'manual') {
        console.log(`📥 Importing agent from ${source}`);
        
        // Validate agent data
        if (!agentData.name || !agentData.systemPrompt) {
            throw new Error('Invalid agent data: missing required fields');
        }
        
        // Build imported agent
        const importedAgent = await this.buildAgent({
            ...agentData,
            metadata: {
                ...agentData.metadata,
                imported: true,
                importSource: source,
                importedAt: new Date().toISOString()
            }
        });
        
        // Move to imported directory
        const currentPath = path.join(this.agentsPath, 'custom', `${importedAgent.id}.json`);
        const importedPath = path.join(this.agentsPath, 'imported', `${importedAgent.id}.json`);
        
        await fs.rename(currentPath, importedPath);
        
        await this.logToVault('agent-builder', 'agent_imported', {
            agentId: importedAgent.id,
            name: importedAgent.name,
            source: source
        });
        
        return importedAgent;
    }

    async logToVault(module, action, data) {
        const logPath = path.join(this.vaultLogsPath, 'agent-builder-activity.log');
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            module: module,
            action: action,
            data: data
        };

        await fs.appendFile(logPath, JSON.stringify(logEntry) + '\\n');
    }

    async getStats() {
        const agents = await this.getBuiltAgents();
        const templates = await this.getAgentTemplates();
        
        const agentsByType = agents.reduce((acc, agent) => {
            acc[agent.type] = (acc[agent.type] || 0) + 1;
            return acc;
        }, {});
        
        return {
            totalAgents: agents.length,
            totalTemplates: templates.length,
            agentsByType: agentsByType,
            vaultIntegrated: agents.filter(a => a.vaultIntegration).length,
            recentlyCreated: agents.filter(a => {
                const created = new Date(a.created);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return created > dayAgo;
            }).length
        };
    }
}

module.exports = AgentBuilder;

// Example usage
if (require.main === module) {
    const builder = new AgentBuilder();
    
    setTimeout(async () => {
        console.log('\\n🧪 Testing Agent Builder...');
        
        const agent = await builder.buildAgent({
            name: 'Test Assistant',
            description: 'A test agent for demonstration',
            type: 'assistant',
            systemPrompt: 'You are a helpful assistant that provides clear and concise responses.',
            capabilities: ['conversation', 'support'],
            tools: ['text-generation']
        });
        
        console.log('\\n🤖 Built Agent:', agent.name);
        
        const stats = await builder.getStats();
        console.log('\\n📊 Builder Stats:', stats);
    }, 1000);
}