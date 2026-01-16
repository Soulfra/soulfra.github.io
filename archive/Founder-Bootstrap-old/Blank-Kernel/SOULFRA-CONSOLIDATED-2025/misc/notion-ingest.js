// Notion Database & Automation Import Parser for MirrorOS
const AutomationWrapper = require('../shared/wrap-into-vault');

class NotionImporter {
    constructor() {
        this.wrapper = new AutomationWrapper();
    }

    async init() {
        await this.wrapper.init();
    }

    async parseNotionExport(notionData) {
        // Handle both string and object input
        const data = typeof notionData === 'string' 
            ? JSON.parse(notionData) 
            : notionData;

        // Detect Notion data type
        const dataType = this.detectNotionType(data);

        // Extract metadata based on type
        const metadata = {
            source: 'notion',
            name: data.title || data.name || 'Untitled Notion Export',
            type: dataType,
            originalFormat: 'notion-json',
            notionVersion: data.version || '2022.1',
            workspace: data.workspace_name,
            exportDate: data.export_date || new Date().toISOString()
        };

        // Parse based on data type
        let parsedData;
        switch (dataType) {
            case 'database':
                parsedData = await this.parseDatabase(data);
                break;
            case 'automation':
                parsedData = await this.parseAutomation(data);
                break;
            case 'integration':
                parsedData = await this.parseIntegration(data);
                break;
            case 'formula':
                parsedData = await this.parseFormula(data);
                break;
            default:
                parsedData = this.parseGeneric(data);
        }

        return { notionData: parsedData, metadata };
    }

    detectNotionType(data) {
        if (data.database_id || data.properties) return 'database';
        if (data.automation || data.triggers) return 'automation';
        if (data.integration || data.connected_apps) return 'integration';
        if (data.formula || data.expression) return 'formula';
        return 'generic';
    }

    async parseDatabase(data) {
        const properties = data.properties || {};
        const views = data.views || [];
        
        return {
            databaseId: data.database_id || data.id,
            title: data.title,
            properties: this.parseProperties(properties),
            views: views.map(view => ({
                id: view.id,
                name: view.name,
                type: view.type,
                filter: view.filter,
                sorts: view.sorts
            })),
            relations: this.extractRelations(properties),
            formulas: this.extractFormulas(properties),
            rollups: this.extractRollups(properties),
            mirrorMetadata: {
                propertyCount: Object.keys(properties).length,
                hasRelations: this.hasRelations(properties),
                hasFormulas: this.hasFormulas(properties),
                complexity: this.calculateDatabaseComplexity(data)
            }
        };
    }

    async parseAutomation(data) {
        const triggers = data.triggers || [];
        const actions = data.actions || [];
        const conditions = data.conditions || [];
        
        return {
            automationId: data.automation_id || data.id,
            name: data.name,
            description: data.description,
            triggers: triggers.map(trigger => ({
                type: trigger.type,
                event: trigger.event,
                filter: trigger.filter,
                database: trigger.database_id
            })),
            actions: actions.map(action => ({
                type: action.type,
                operation: action.operation,
                parameters: action.parameters,
                targetDatabase: action.database_id
            })),
            conditions: conditions,
            schedule: data.schedule,
            mirrorMetadata: {
                triggerCount: triggers.length,
                actionCount: actions.length,
                hasConditions: conditions.length > 0,
                complexity: this.calculateAutomationComplexity(data)
            }
        };
    }

    async parseIntegration(data) {
        return {
            integrationId: data.integration_id || data.id,
            connectedApps: data.connected_apps || [],
            syncRules: data.sync_rules || [],
            mappings: data.field_mappings || {},
            webhooks: data.webhooks || [],
            apiKeys: Object.keys(data.credentials || {})
        };
    }

    async parseFormula(data) {
        return {
            formulaId: data.formula_id || data.id,
            name: data.name,
            expression: data.expression || data.formula,
            propertyType: data.property_type,
            dependencies: this.extractFormulaDependencies(data.expression),
            mirrorMetadata: {
                isComplex: this.isComplexFormula(data.expression),
                usedFunctions: this.extractFormulaFunctions(data.expression)
            }
        };
    }

    parseGeneric(data) {
        return {
            type: 'generic-notion',
            data: data,
            mirrorMetadata: {
                keys: Object.keys(data),
                dataSize: JSON.stringify(data).length
            }
        };
    }

    parseProperties(properties) {
        const parsed = {};
        Object.entries(properties).forEach(([key, prop]) => {
            parsed[key] = {
                type: prop.type,
                name: prop.name || key,
                options: prop.options,
                formula: prop.formula,
                relation: prop.relation,
                rollup: prop.rollup
            };
        });
        return parsed;
    }

    extractRelations(properties) {
        return Object.entries(properties)
            .filter(([_, prop]) => prop.type === 'relation')
            .map(([key, prop]) => ({
                property: key,
                database: prop.relation?.database_id,
                type: prop.relation?.type || 'single'
            }));
    }

    extractFormulas(properties) {
        return Object.entries(properties)
            .filter(([_, prop]) => prop.type === 'formula')
            .map(([key, prop]) => ({
                property: key,
                expression: prop.formula?.expression,
                dependencies: this.extractFormulaDependencies(prop.formula?.expression)
            }));
    }

    extractRollups(properties) {
        return Object.entries(properties)
            .filter(([_, prop]) => prop.type === 'rollup')
            .map(([key, prop]) => ({
                property: key,
                relation: prop.rollup?.relation_property,
                targetProperty: prop.rollup?.rollup_property,
                function: prop.rollup?.function
            }));
    }

    extractFormulaDependencies(expression) {
        if (!expression) return [];
        const propRegex = /prop\("([^"]+)"\)/g;
        const matches = [...expression.matchAll(propRegex)];
        return matches.map(match => match[1]);
    }

    extractFormulaFunctions(expression) {
        if (!expression) return [];
        const functionRegex = /(\w+)\(/g;
        const matches = [...expression.matchAll(functionRegex)];
        return [...new Set(matches.map(match => match[1]))];
    }

    isComplexFormula(expression) {
        if (!expression) return false;
        const complexPatterns = ['if(', 'map(', 'filter(', 'let('];
        return complexPatterns.some(pattern => expression.includes(pattern));
    }

    hasRelations(properties) {
        return Object.values(properties).some(prop => prop.type === 'relation');
    }

    hasFormulas(properties) {
        return Object.values(properties).some(prop => prop.type === 'formula');
    }

    calculateDatabaseComplexity(data) {
        const properties = data.properties || {};
        const propCount = Object.keys(properties).length;
        const hasRelations = this.hasRelations(properties);
        const hasFormulas = this.hasFormulas(properties);
        
        let score = propCount;
        if (hasRelations) score += 5;
        if (hasFormulas) score += 3;
        
        if (score < 10) return 'simple';
        if (score < 20) return 'moderate';
        if (score < 30) return 'complex';
        return 'very-complex';
    }

    calculateAutomationComplexity(data) {
        const triggers = data.triggers?.length || 0;
        const actions = data.actions?.length || 0;
        const conditions = data.conditions?.length || 0;
        
        const score = triggers + (actions * 2) + (conditions * 3);
        
        if (score < 5) return 'simple';
        if (score < 15) return 'moderate';
        if (score < 25) return 'complex';
        return 'very-complex';
    }

    async importNotionData(notionJson, userId = 'anonymous') {
        await this.init();
        
        const { notionData, metadata } = await this.parseNotionExport(notionJson);
        
        // Add user ID to metadata
        metadata.userId = userId;
        
        // Wrap the Notion data into vault
        const result = await this.wrapper.wrapAutomation(notionData, metadata);
        
        // Create Notion-specific agent configuration
        if (result.success) {
            await this.createNotionAgent(result.agentId, notionData, metadata);
        }
        
        return {
            ...result,
            dataType: metadata.type,
            complexity: notionData.mirrorMetadata?.complexity || 'unknown'
        };
    }

    async createNotionAgent(agentId, notionData, metadata) {
        // Create specialized Notion execution agent
        const notionAgent = {
            parentId: agentId,
            type: 'notion-executor',
            dataType: metadata.type,
            capabilities: {
                databaseOperations: metadata.type === 'database',
                automationExecution: metadata.type === 'automation',
                formulaEvaluation: notionData.mirrorMetadata?.hasFormulas,
                relationHandling: notionData.mirrorMetadata?.hasRelations,
                integrationSync: metadata.type === 'integration'
            },
            execution: {
                mode: 'sovereign-wrapped',
                vaultTrace: true,
                logLevel: 'detailed'
            },
            notionSpecific: {
                databaseId: notionData.databaseId,
                workspace: metadata.workspace,
                properties: notionData.properties,
                views: notionData.views
            }
        };
        
        // Store Notion-specific configuration
        const fs = require('fs').promises;
        const path = require('path');
        const agentConfigPath = path.join(
            '../../vault/agents/imported/notion',
            `${agentId}-config.json`
        );
        
        await fs.mkdir(path.dirname(agentConfigPath), { recursive: true });
        await fs.writeFile(agentConfigPath, JSON.stringify(notionAgent, null, 2));
    }

    // Utility method to validate Notion export
    validateNotionExport(json) {
        try {
            const data = typeof json === 'string' ? JSON.parse(json) : json;
            const type = this.detectNotionType(data);
            
            if (type === 'database' && !data.properties) {
                return { valid: false, error: 'Database export missing properties' };
            }
            
            if (type === 'automation' && (!data.triggers || !data.actions)) {
                return { valid: false, error: 'Automation missing triggers or actions' };
            }
            
            return { valid: true, type };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
}

module.exports = NotionImporter;