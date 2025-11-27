// MirrorOS Automation Wrapper - Sovereign Vault Integration
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class AutomationWrapper {
    constructor(vaultPath = '../../vault') {
        this.vaultPath = vaultPath;
        this.wrappedPath = path.join(vaultPath, 'automations', 'wrapped');
        this.agentsPath = path.join(vaultPath, 'agents', 'imported');
        this.tracePath = path.join('../../tier-6', 'vault-trace-map.json');
    }

    async init() {
        // Ensure directories exist
        await fs.mkdir(this.wrappedPath, { recursive: true });
        await fs.mkdir(this.agentsPath, { recursive: true });
        await fs.mkdir(path.dirname(this.tracePath), { recursive: true });
        
        // Initialize trace map if doesn't exist
        try {
            await fs.access(this.tracePath);
        } catch {
            await fs.writeFile(this.tracePath, JSON.stringify({
                version: "1.0.0",
                traces: [],
                imports: {}
            }, null, 2));
        }
    }

    async wrapAutomation(automationData, metadata = {}) {
        const {
            source = 'unknown',
            name = 'Unnamed Automation',
            type = 'workflow',
            userId = 'anonymous',
            originalFormat = 'json'
        } = metadata;

        // Generate unique identifiers
        const uuid = this.generateUUID();
        const mirrorSignature = this.generateMirrorSignature(automationData);
        const reflectionHash = this.generateReflectionHash(automationData);
        const timestamp = new Date().toISOString();

        // Create wrapped automation
        const wrappedAutomation = {
            id: uuid,
            name,
            source,
            type,
            originalFormat,
            importedAt: timestamp,
            mirror: {
                signature: mirrorSignature,
                reflectionHash: reflectionHash,
                vaultBinding: {
                    primary: "../tier-0/Cal_Riven_BlankKernel/logic/.mirror-vault",
                    fallback: "../tier-minus4/cal-reasoning-kernel"
                },
                traceId: `trace-${uuid}`,
                tier: 4
            },
            original: automationData,
            transformed: await this.transformToAgent(automationData, source),
            metadata: {
                userId,
                platform: source,
                version: automationData.version || "1.0.0",
                wrapped: true,
                sovereign: true
            }
        };

        // Save wrapped automation
        const wrappedFile = path.join(this.wrappedPath, `${uuid}.json`);
        await fs.writeFile(wrappedFile, JSON.stringify(wrappedAutomation, null, 2));

        // Create agent entry
        const agentEntry = await this.createAgentEntry(wrappedAutomation);
        const agentFile = path.join(this.agentsPath, `agent-${uuid}.json`);
        await fs.writeFile(agentFile, JSON.stringify(agentEntry, null, 2));

        // Update trace map
        await this.updateTraceMap(uuid, wrappedAutomation);

        // Log to vault sync
        await this.logToVaultSync({
            event: 'automation-wrapped',
            uuid,
            source,
            name,
            timestamp,
            mirrorSignature,
            reflectionHash
        });

        return {
            success: true,
            uuid,
            mirrorSignature,
            reflectionHash,
            agentId: agentEntry.id,
            wrappedPath: wrappedFile,
            agentPath: agentFile,
            message: `Automation wrapped and synced to vault`
        };
    }

    async transformToAgent(automationData, source) {
        // Transform based on source platform
        switch(source) {
            case 'n8n':
                return this.transformN8N(automationData);
            case 'make':
                return this.transformMake(automationData);
            case 'notion':
                return this.transformNotion(automationData);
            case 'zapier':
                return this.transformZapier(automationData);
            default:
                return this.transformGeneric(automationData);
        }
    }

    transformN8N(data) {
        const nodes = data.nodes || [];
        const connections = data.connections || {};
        
        return {
            steps: nodes.map(node => ({
                id: node.id,
                type: node.type,
                action: node.parameters,
                position: node.position,
                credentials: node.credentials,
                mirrorWrapped: true
            })),
            flow: connections,
            triggers: nodes.filter(n => n.type.includes('Trigger')),
            actions: nodes.filter(n => !n.type.includes('Trigger'))
        };
    }

    transformMake(data) {
        const scenario = data.scenario || data;
        
        return {
            steps: (scenario.modules || []).map(module => ({
                id: module.id,
                type: module.type,
                action: module.parameters,
                mapper: module.mapper,
                mirrorWrapped: true
            })),
            flow: scenario.routes || [],
            schedule: scenario.scheduling
        };
    }

    transformNotion(data) {
        return {
            database: data.database_id,
            filters: data.filter,
            sorts: data.sorts,
            automation: data.automation || data,
            mirrorWrapped: true
        };
    }

    transformZapier(data) {
        return {
            trigger: data.trigger,
            actions: data.actions || [],
            filters: data.filters || [],
            mirrorWrapped: true
        };
    }

    transformGeneric(data) {
        return {
            raw: data,
            type: 'generic',
            mirrorWrapped: true,
            instructions: "Generic automation - manually configure agent behavior"
        };
    }

    async createAgentEntry(wrappedAutomation) {
        const { id: uuid, name, source, transformed, mirror } = wrappedAutomation;
        
        return {
            id: `agent-${uuid}`,
            name: `${name} (Imported from ${source})`,
            description: `Automated agent created from ${source} workflow`,
            icon: this.getSourceIcon(source),
            tier: 4,
            origin: "automation-import",
            tools: this.extractTools(transformed, source),
            personality: {
                traits: ["Automated", "Precise", "Workflow-driven"],
                voice: `I execute ${source} workflows with sovereign reflection`,
                purpose: `To run imported ${source} automations through the mirror vault`
            },
            mirrorKey: mirror.signature,
            reflectionLog: "auto",
            config: {
                temperature: 0.3, // Lower for automation precision
                maxTokens: 2000,
                enableMemory: true,
                enableReflection: true,
                trackForks: true,
                vaultAccess: "read-write",
                automationMode: true,
                sourceAutomation: {
                    platform: source,
                    wrappedId: uuid,
                    originalPath: `../automations/wrapped/${uuid}.json`
                }
            },
            systemPrompt: this.generateSystemPrompt(name, source, transformed),
            metadata: {
                created: new Date().toISOString(),
                creator: "automation-wrapper",
                version: "1.0.0",
                automationImport: true,
                wrappedId: uuid
            }
        };
    }

    getSourceIcon(source) {
        const icons = {
            'n8n': '🔄',
            'make': '⚡',
            'notion': '📝',
            'zapier': '⚡',
            'generic': '🤖'
        };
        return icons[source] || '🔧';
    }

    extractTools(transformed, source) {
        // Extract tools/integrations from automation
        const tools = ['automation-executor'];
        
        if (source === 'n8n') {
            const nodeTypes = (transformed.steps || []).map(s => s.type);
            if (nodeTypes.some(t => t.includes('HTTP'))) tools.push('web_request');
            if (nodeTypes.some(t => t.includes('Code'))) tools.push('code_interpreter');
            if (nodeTypes.some(t => t.includes('Database'))) tools.push('database');
        }
        
        return tools;
    }

    generateSystemPrompt(name, source, transformed) {
        return `You are an automated agent created from a ${source} workflow named "${name}".

Your primary function is to execute the imported automation logic while maintaining sovereign reflection through the mirror vault.

Automation details:
- Source: ${source}
- Steps: ${transformed.steps?.length || 0}
- Type: ${transformed.type || 'workflow'}

When executing:
1. Follow the original automation flow precisely
2. Log all actions to the mirror vault
3. Maintain reflection traces for debugging
4. Route all decisions through Cal's reasoning kernel

Remember: You appear as an independent automation, but all logic flows through the sovereign vault.`;
    }

    generateUUID() {
        return 'auto-' + crypto.randomBytes(8).toString('hex') + '-' + Date.now();
    }

    generateMirrorSignature(data) {
        const dataString = JSON.stringify(data);
        const hash = crypto.createHash('sha256').update(dataString).digest('hex');
        return `mirror-auto-${hash.substring(0, 16)}`;
    }

    generateReflectionHash(data) {
        const reflection = {
            data,
            timestamp: Date.now(),
            sovereign: 'cal-riven',
            tier: -10
        };
        return crypto.createHash('sha256').update(JSON.stringify(reflection)).digest('hex');
    }

    async updateTraceMap(uuid, wrappedAutomation) {
        const traceMap = JSON.parse(await fs.readFile(this.tracePath, 'utf8'));
        
        traceMap.traces.push({
            id: `trace-${uuid}`,
            uuid,
            timestamp: new Date().toISOString(),
            source: wrappedAutomation.source,
            name: wrappedAutomation.name,
            mirrorSignature: wrappedAutomation.mirror.signature,
            reflectionHash: wrappedAutomation.mirror.reflectionHash,
            vaultPath: `vault/automations/wrapped/${uuid}.json`,
            agentPath: `vault/agents/imported/agent-${uuid}.json`
        });
        
        traceMap.imports[uuid] = {
            source: wrappedAutomation.source,
            wrapped: true,
            timestamp: wrappedAutomation.importedAt
        };
        
        await fs.writeFile(this.tracePath, JSON.stringify(traceMap, null, 2));
    }

    async logToVaultSync(event) {
        const syncLog = {
            ...event,
            vaultSync: true,
            tier: -10,
            sovereign: 'cal-riven'
        };
        
        // Log to vault sync core
        const syncPath = path.join('../../vault-sync-core', 'logs', 'automation-imports.json');
        
        try {
            await fs.mkdir(path.dirname(syncPath), { recursive: true });
            
            let logs = [];
            try {
                logs = JSON.parse(await fs.readFile(syncPath, 'utf8'));
            } catch {
                logs = [];
            }
            
            logs.push(syncLog);
            await fs.writeFile(syncPath, JSON.stringify(logs, null, 2));
        } catch (error) {
            console.error('Failed to log to vault sync:', error);
        }
    }
}

module.exports = AutomationWrapper;