// Make.com (Integromat) Scenario Import Parser for MirrorOS
const AutomationWrapper = require('../shared/wrap-into-vault');

class MakeComImporter {
    constructor() {
        this.wrapper = new AutomationWrapper();
    }

    async init() {
        await this.wrapper.init();
    }

    async parseScenario(scenarioJson) {
        // Handle both string and object input
        const scenario = typeof scenarioJson === 'string' 
            ? JSON.parse(scenarioJson) 
            : scenarioJson;

        // Handle both blueprint and scenario formats
        const data = scenario.blueprint || scenario.scenario || scenario;

        // Validate Make.com scenario structure
        if (!data.modules || !Array.isArray(data.modules)) {
            throw new Error('Invalid Make.com scenario: missing modules array');
        }

        // Extract scenario metadata
        const metadata = {
            source: 'make',
            name: data.name || scenario.name || 'Untitled Make Scenario',
            type: 'scenario',
            originalFormat: 'make-json',
            makeVersion: scenario.version || '1.0',
            teamId: scenario.teamId,
            folderId: scenario.folderId,
            scheduling: data.scheduling || null
        };

        // Parse modules and identify special types
        const parsedScenario = {
            ...data,
            moduleTypes: this.extractModuleTypes(data.modules),
            triggers: this.extractTriggers(data.modules),
            routers: this.extractRouters(data.modules),
            filters: this.extractFilters(data.modules),
            errorHandlers: this.extractErrorHandlers(data.modules),
            mirrorMetadata: {
                totalModules: data.modules.length,
                hasScheduling: !!data.scheduling,
                hasRouting: this.hasRouting(data.modules),
                complexity: this.calculateComplexity(data),
                connections: this.mapConnections(data.modules)
            }
        };

        return { scenario: parsedScenario, metadata };
    }

    extractModuleTypes(modules) {
        const types = new Set();
        modules.forEach(module => {
            types.add(module.module);
        });
        return Array.from(types);
    }

    extractTriggers(modules) {
        // First module is typically the trigger in Make.com
        const triggers = modules.filter((module, index) => 
            index === 0 || 
            module.module.toLowerCase().includes('watch') ||
            module.module.toLowerCase().includes('trigger')
        );

        return triggers.map(module => ({
            id: module.id,
            type: module.module,
            name: module.name,
            parameters: module.parameters,
            mapper: module.mapper
        }));
    }

    extractRouters(modules) {
        return modules.filter(module => 
            module.module === 'gateway' || 
            module.type === 'router'
        ).map(module => ({
            id: module.id,
            name: module.name,
            routes: module.routes || [],
            mapper: module.mapper
        }));
    }

    extractFilters(modules) {
        const filters = [];
        modules.forEach(module => {
            if (module.filter) {
                filters.push({
                    moduleId: module.id,
                    moduleName: module.name,
                    filter: module.filter
                });
            }
        });
        return filters;
    }

    extractErrorHandlers(modules) {
        return modules.filter(module => 
            module.module.includes('error') || 
            module.errorHandler
        ).map(module => ({
            id: module.id,
            type: module.module,
            name: module.name,
            handlerType: module.errorHandler?.type || 'default'
        }));
    }

    hasRouting(modules) {
        return modules.some(module => 
            module.module === 'gateway' || 
            module.type === 'router' ||
            module.routes
        );
    }

    mapConnections(modules) {
        const connections = {};
        modules.forEach(module => {
            if (module.routes) {
                connections[module.id] = module.routes.map(route => ({
                    to: route.flow?.map(f => f.id) || [],
                    label: route.label
                }));
            }
        });
        return connections;
    }

    calculateComplexity(scenario) {
        const moduleCount = scenario.modules.length;
        const hasRouting = this.hasRouting(scenario.modules);
        const hasErrorHandling = scenario.modules.some(m => m.errorHandler);
        
        let score = moduleCount;
        if (hasRouting) score += 5;
        if (hasErrorHandling) score += 3;
        
        if (score < 5) return 'simple';
        if (score < 15) return 'moderate';
        if (score < 25) return 'complex';
        return 'very-complex';
    }

    async importScenario(scenarioJson, userId = 'anonymous') {
        await this.init();
        
        const { scenario, metadata } = await this.parseScenario(scenarioJson);
        
        // Add user ID to metadata
        metadata.userId = userId;
        
        // Wrap the scenario into vault
        const result = await this.wrapper.wrapAutomation(scenario, metadata);
        
        // Create Make-specific agent configuration
        if (result.success) {
            await this.createMakeAgent(result.agentId, scenario, metadata);
        }
        
        return {
            ...result,
            moduleCount: scenario.modules.length,
            triggers: scenario.mirrorMetadata.triggers,
            hasScheduling: scenario.mirrorMetadata.hasScheduling,
            complexity: scenario.mirrorMetadata.complexity
        };
    }

    async createMakeAgent(agentId, scenario, metadata) {
        // Create specialized Make.com execution agent
        const makeAgent = {
            parentId: agentId,
            type: 'make-executor',
            capabilities: {
                executeScenario: true,
                handleScheduling: scenario.mirrorMetadata.hasScheduling,
                handleRouting: scenario.mirrorMetadata.hasRouting,
                errorHandling: scenario.mirrorMetadata.errorHandlers.length > 0,
                moduleTypes: scenario.mirrorMetadata.moduleTypes
            },
            execution: {
                mode: 'sovereign-wrapped',
                vaultTrace: true,
                scheduling: scenario.scheduling,
                logLevel: 'detailed'
            },
            routing: scenario.mirrorMetadata.connections
        };
        
        // Store Make-specific configuration
        const fs = require('fs').promises;
        const path = require('path');
        const agentConfigPath = path.join(
            '../../vault/agents/imported/make',
            `${agentId}-config.json`
        );
        
        await fs.mkdir(path.dirname(agentConfigPath), { recursive: true });
        await fs.writeFile(agentConfigPath, JSON.stringify(makeAgent, null, 2));
    }

    // Utility method to validate Make.com JSON
    validateMakeScenario(json) {
        try {
            const scenario = typeof json === 'string' ? JSON.parse(json) : json;
            const data = scenario.blueprint || scenario.scenario || scenario;
            
            if (!data.modules || !Array.isArray(data.modules)) {
                return { valid: false, error: 'Missing modules array' };
            }
            
            // Check for at least one module
            if (data.modules.length === 0) {
                return { valid: false, error: 'Scenario has no modules' };
            }
            
            // Validate module structure
            for (const module of data.modules) {
                if (!module.id || !module.module) {
                    return { 
                        valid: false, 
                        error: `Invalid module structure: ${JSON.stringify(module)}` 
                    };
                }
            }
            
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }

    // Convert Make.com data mappings to agent-compatible format
    convertDataMappings(mapper) {
        if (!mapper) return {};
        
        const converted = {};
        Object.entries(mapper).forEach(([key, value]) => {
            // Handle Make.com's special syntax
            if (typeof value === 'string' && value.includes('{{')) {
                converted[key] = {
                    type: 'dynamic',
                    expression: value,
                    makeFormat: true
                };
            } else {
                converted[key] = value;
            }
        });
        
        return converted;
    }
}

module.exports = MakeComImporter;