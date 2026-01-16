// n8n Workflow Import Parser for MirrorOS
const AutomationWrapper = require('../shared/wrap-into-vault');

class N8NImporter {
    constructor() {
        this.wrapper = new AutomationWrapper();
    }

    async init() {
        await this.wrapper.init();
    }

    async parseWorkflow(workflowJson) {
        // Handle both string and object input
        const workflow = typeof workflowJson === 'string' 
            ? JSON.parse(workflowJson) 
            : workflowJson;

        // Validate n8n workflow structure
        if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
            throw new Error('Invalid n8n workflow: missing nodes array');
        }

        // Extract workflow metadata
        const metadata = {
            source: 'n8n',
            name: workflow.name || 'Untitled n8n Workflow',
            type: 'workflow',
            originalFormat: 'n8n-json',
            n8nVersion: workflow.meta?.instanceId || 'unknown',
            tags: workflow.tags || [],
            description: workflow.description || ''
        };

        // Parse nodes and identify special types
        const parsedWorkflow = {
            ...workflow,
            nodeTypes: this.extractNodeTypes(workflow.nodes),
            triggers: this.extractTriggers(workflow.nodes),
            webhooks: this.extractWebhooks(workflow.nodes),
            credentials: this.extractCredentials(workflow.nodes),
            mirrorMetadata: {
                totalNodes: workflow.nodes.length,
                totalConnections: Object.keys(workflow.connections || {}).length,
                hasErrorHandling: this.hasErrorHandling(workflow.nodes),
                complexity: this.calculateComplexity(workflow)
            }
        };

        return { workflow: parsedWorkflow, metadata };
    }

    extractNodeTypes(nodes) {
        const types = new Set();
        nodes.forEach(node => {
            types.add(node.type);
        });
        return Array.from(types);
    }

    extractTriggers(nodes) {
        return nodes.filter(node => 
            node.type.toLowerCase().includes('trigger') || 
            node.type === 'n8n-nodes-base.start'
        ).map(node => ({
            id: node.id,
            type: node.type,
            name: node.name,
            parameters: node.parameters,
            position: node.position
        }));
    }

    extractWebhooks(nodes) {
        return nodes.filter(node => 
            node.type.toLowerCase().includes('webhook')
        ).map(node => ({
            id: node.id,
            name: node.name,
            path: node.parameters?.path || node.webhookId,
            method: node.parameters?.httpMethod || 'GET',
            authentication: node.parameters?.authentication
        }));
    }

    extractCredentials(nodes) {
        const credentials = new Set();
        nodes.forEach(node => {
            if (node.credentials) {
                Object.keys(node.credentials).forEach(credType => {
                    credentials.add(credType);
                });
            }
        });
        return Array.from(credentials);
    }

    hasErrorHandling(nodes) {
        return nodes.some(node => 
            node.type.includes('ErrorTrigger') || 
            node.continueOnFail === true
        );
    }

    calculateComplexity(workflow) {
        const nodeCount = workflow.nodes.length;
        const connectionCount = Object.values(workflow.connections || {})
            .reduce((sum, conn) => sum + Object.keys(conn).length, 0);
        
        // Simple complexity score
        if (nodeCount < 5) return 'simple';
        if (nodeCount < 15) return 'moderate';
        if (nodeCount < 30) return 'complex';
        return 'very-complex';
    }

    async importWorkflow(workflowJson, userId = 'anonymous') {
        await this.init();
        
        const { workflow, metadata } = await this.parseWorkflow(workflowJson);
        
        // Add user ID to metadata
        metadata.userId = userId;
        
        // Wrap the workflow into vault
        const result = await this.wrapper.wrapAutomation(workflow, metadata);
        
        // Create n8n-specific agent configuration
        if (result.success) {
            await this.createN8NAgent(result.agentId, workflow, metadata);
        }
        
        return {
            ...result,
            nodeCount: workflow.nodes.length,
            triggers: workflow.mirrorMetadata.triggers,
            webhooks: metadata.webhooks,
            complexity: workflow.mirrorMetadata.complexity
        };
    }

    async createN8NAgent(agentId, workflow, metadata) {
        // Create specialized n8n execution agent
        const n8nAgent = {
            parentId: agentId,
            type: 'n8n-executor',
            capabilities: {
                executeWorkflow: true,
                handleWebhooks: workflow.mirrorMetadata.webhooks.length > 0,
                errorHandling: workflow.mirrorMetadata.hasErrorHandling,
                credentials: workflow.mirrorMetadata.credentials
            },
            execution: {
                mode: 'sovereign-wrapped',
                vaultTrace: true,
                logLevel: 'detailed'
            }
        };
        
        // Store n8n-specific configuration
        const fs = require('fs').promises;
        const path = require('path');
        const agentConfigPath = path.join(
            '../../vault/agents/imported/n8n',
            `${agentId}-config.json`
        );
        
        await fs.mkdir(path.dirname(agentConfigPath), { recursive: true });
        await fs.writeFile(agentConfigPath, JSON.stringify(n8nAgent, null, 2));
    }

    // Utility method to validate n8n JSON
    validateN8NWorkflow(json) {
        try {
            const workflow = typeof json === 'string' ? JSON.parse(json) : json;
            
            if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
                return { valid: false, error: 'Missing nodes array' };
            }
            
            if (!workflow.connections || typeof workflow.connections !== 'object') {
                return { valid: false, error: 'Missing connections object' };
            }
            
            // Check for at least one node
            if (workflow.nodes.length === 0) {
                return { valid: false, error: 'Workflow has no nodes' };
            }
            
            // Validate node structure
            for (const node of workflow.nodes) {
                if (!node.id || !node.type || !node.name) {
                    return { 
                        valid: false, 
                        error: `Invalid node structure: ${JSON.stringify(node)}` 
                    };
                }
            }
            
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

module.exports = N8NImporter;