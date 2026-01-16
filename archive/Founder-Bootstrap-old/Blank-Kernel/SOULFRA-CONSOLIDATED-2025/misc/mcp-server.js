#!/usr/bin/env node
/**
 * SOULFRA MCP Server
 * Model Context Protocol implementation for unifying all SOULFRA services
 * 
 * This server acts as the single source of truth, connecting:
 * - SOULFRA Ultimate Unified (main platform)
 * - Cal Riven (trust engine)
 * - Rules Orchestrator
 * - Vector DB
 * - Semantic API
 * - All other services
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class SOULFRAMCPServer extends EventEmitter {
    constructor() {
        super();
        
        this.config = null;
        this.port = 8888;
        this.services = new Map();
        this.connections = new Map();
        this.tools = new Map();
        this.context = new Map();
        this.memory = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🌟 Initializing SOULFRA MCP Server...');
        
        try {
            // Load configuration
            await this.loadConfig();
            
            // Initialize components
            await this.initializeTools();
            await this.initializeContext();
            await this.initializeMemory();
            
            // Connect to existing services
            await this.connectToServices();
            
            // Start MCP server
            await this.startServer();
            
            console.log('✅ SOULFRA MCP Server initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize MCP Server:', error);
            process.exit(1);
        }
    }
    
    async loadConfig() {
        // Try existing config first, then fallbacks
        let configPath = path.join(__dirname, '../mcp-existing-config.json');
        if (!require('fs').existsSync(configPath)) {
            configPath = path.join(__dirname, '../.mcp/config.json');
            if (!require('fs').existsSync(configPath)) {
                configPath = path.join(__dirname, '../mcp-config.json');
            }
        }
        const configData = await fs.readFile(configPath, 'utf8');
        this.config = JSON.parse(configData);
        this.port = this.config.port || 8888;
        
        // Load existing systems integration
        try {
            const ExistingSystemsIntegration = require('./mcp-existing-integration');
            this.existingIntegration = new ExistingSystemsIntegration();
            console.log('✅ Loaded existing systems integration');
        } catch (e) {
            console.warn('⚠️  Could not load existing systems integration:', e.message);
        }
    }
    
    async initializeTools() {
        console.log('🔧 Initializing MCP Tools...');
        
        // File Operations
        this.tools.set('file_read', {
            name: 'file_read',
            description: 'Read a file from the filesystem',
            parameters: {
                path: { type: 'string', required: true }
            },
            handler: async (params) => {
                const content = await fs.readFile(params.path, 'utf8');
                return { content };
            }
        });
        
        this.tools.set('file_write', {
            name: 'file_write',
            description: 'Write content to a file',
            parameters: {
                path: { type: 'string', required: true },
                content: { type: 'string', required: true }
            },
            handler: async (params) => {
                await fs.writeFile(params.path, params.content);
                return { success: true };
            }
        });
        
        this.tools.set('file_list', {
            name: 'file_list',
            description: 'List files in a directory',
            parameters: {
                path: { type: 'string', required: true }
            },
            handler: async (params) => {
                const files = await fs.readdir(params.path);
                return { files };
            }
        });
        
        // Search Operations
        this.tools.set('search_semantic', {
            name: 'search_semantic',
            description: 'Perform semantic search across codebase',
            parameters: {
                query: { type: 'string', required: true },
                limit: { type: 'number', default: 10 }
            },
            handler: async (params) => {
                // Forward to semantic API
                return await this.forwardToService('semantic-api', 'search', params);
            }
        });
        
        this.tools.set('search_vector', {
            name: 'search_vector',
            description: 'Perform vector similarity search',
            parameters: {
                query: { type: 'string', required: true },
                threshold: { type: 'number', default: 0.7 }
            },
            handler: async (params) => {
                // Forward to vector DB
                return await this.forwardToService('vector-db', 'search', params);
            }
        });
        
        // Agent Management
        this.tools.set('agent_spawn', {
            name: 'agent_spawn',
            description: 'Spawn a new AI agent',
            parameters: {
                type: { type: 'string', required: true },
                config: { type: 'object', default: {} }
            },
            handler: async (params) => {
                // Forward to Cal Riven
                return await this.forwardToService('cal-riven', 'spawn-agent', params);
            }
        });
        
        this.tools.set('agent_control', {
            name: 'agent_control',
            description: 'Control an existing agent',
            parameters: {
                agent_id: { type: 'string', required: true },
                action: { type: 'string', required: true },
                params: { type: 'object', default: {} }
            },
            handler: async (params) => {
                // Forward to SOULFRA main
                return await this.forwardToService('soulfra-main', 'agent-control', params);
            }
        });
        
        // Rules Operations
        this.tools.set('rules_validate', {
            name: 'rules_validate',
            description: 'Validate code against SOULFRA rules',
            parameters: {
                path: { type: 'string', required: true }
            },
            handler: async (params) => {
                if (this.existingIntegration) {
                    return await this.existingIntegration.validateRules(params.path);
                }
                return await this.forwardToService('rules-engine', 'validate', params);
            }
        });
        
        // Existing Systems Integration Tools
        if (this.existingIntegration) {
            this.tools.set('soulfra_status', {
                name: 'soulfra_status',
                description: 'Get SOULFRA platform status and features',
                handler: async (params) => {
                    return await this.existingIntegration.getSoulfraStatus();
                }
            });
            
            this.tools.set('create_improvement', {
                name: 'create_improvement',
                description: 'Create code improvement proposal through AI Economy',
                parameters: {
                    files: { type: 'array', required: true },
                    description: { type: 'string', required: true },
                    type: { type: 'string', default: 'refactor_complexity_reduction' },
                    create_pr: { type: 'boolean', default: false }
                },
                handler: async (params) => {
                    return await this.existingIntegration.createImprovement(params);
                }
            });
            
            this.tools.set('blockchain_store', {
                name: 'blockchain_store',
                description: 'Store data on blockchain ledger',
                parameters: {
                    data: { type: 'object', required: true }
                },
                handler: async (params) => {
                    return await this.existingIntegration.storeOnBlockchain(params.data);
                }
            });
        }
        
        console.log(`✅ Initialized ${this.tools.size} MCP tools`);
    }
    
    async initializeContext() {
        console.log('📚 Initializing MCP Context...');
        
        // Codebase structure
        this.context.set('codebase', {
            root: path.resolve(__dirname, '..'),
            structure: await this.scanCodebaseStructure(),
            stats: {
                total_files: 0,
                total_directories: 0,
                languages: {}
            }
        });
        
        // Rules context
        this.context.set('rules', {
            path: path.join(this.context.get('codebase').root, '.rules'),
            categories: ['architecture', 'development', 'security', 'deployment', 'monitoring']
        });
        
        // Services context
        this.context.set('services', {
            available: Array.from(Object.keys(this.config.servers || {})),
            status: new Map()
        });
        
        console.log('✅ Context initialized');
    }
    
    async initializeMemory() {
        console.log('🧠 Initializing MCP Memory...');
        
        // Load existing memory if available - check both locations
        let memoryPath = path.join(__dirname, '../.mcp/memory.json');
        if (!require('fs').existsSync(memoryPath)) {
            memoryPath = path.join(__dirname, '../mcp-memory.json');
        }
        try {
            const memoryData = await fs.readFile(memoryPath, 'utf8');
            const savedMemory = JSON.parse(memoryData);
            
            // Restore memory
            if (savedMemory.conversations) {
                this.memory.set('conversations', new Map(savedMemory.conversations));
            }
            if (savedMemory.agent_states) {
                this.memory.set('agent_states', new Map(savedMemory.agent_states));
            }
            
        } catch (error) {
            // Initialize empty memory
            this.memory.set('conversations', new Map());
            this.memory.set('agent_states', new Map());
            this.memory.set('reflections', []);
        }
        
        // Set up periodic memory persistence
        setInterval(() => this.persistMemory(), 60000); // Every minute
        
        console.log('✅ Memory initialized');
    }
    
    async connectToServices() {
        console.log('🔌 Connecting to existing services...');
        
        for (const [serviceId, serviceConfig] of Object.entries(this.config.servers || {})) {
            try {
                await this.connectToService(serviceId, serviceConfig);
                console.log(`✅ Connected to ${serviceConfig.name}`);
            } catch (error) {
                console.warn(`⚠️  Failed to connect to ${serviceConfig.name}:`, error.message);
            }
        }
    }
    
    async connectToService(serviceId, config) {
        // For now, just track the service configuration
        // In production, would establish actual connections
        this.services.set(serviceId, {
            ...config,
            connected: false,
            lastCheck: new Date()
        });
    }
    
    async startServer() {
        // Create HTTP server
        this.httpServer = http.createServer((req, res) => {
            if (req.url === '/health') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'healthy',
                    services: this.getServicesStatus(),
                    uptime: process.uptime()
                }));
            } else if (req.url === '/mcp' && req.method === 'GET') {
                // Serve MCP protocol information
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    version: '1.0.0',
                    capabilities: this.config.capabilities,
                    tools: Array.from(this.tools.keys())
                }));
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        // Create WebSocket server for MCP protocol
        this.wsServer = new WebSocket.Server({ server: this.httpServer });
        
        this.wsServer.on('connection', (ws, req) => {
            console.log('🔗 New MCP client connected');
            
            const connectionId = this.generateConnectionId();
            this.connections.set(connectionId, {
                ws,
                authenticated: false,
                capabilities: []
            });
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMCPMessage(connectionId, data);
                } catch (error) {
                    console.error('Error handling MCP message:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: error.message
                    }));
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 MCP client disconnected');
                this.connections.delete(connectionId);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                version: '1.0.0',
                connectionId
            }));
        });
        
        // Start listening
        this.httpServer.listen(this.port, () => {
            console.log(`🚀 SOULFRA MCP Server listening on port ${this.port}`);
            console.log(`   HTTP: http://localhost:${this.port}`);
            console.log(`   WebSocket: ws://localhost:${this.port}`);
        });
    }
    
    async handleMCPMessage(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;
        
        switch (message.type) {
            case 'authenticate':
                await this.handleAuthenticate(connectionId, message);
                break;
                
            case 'tool_call':
                await this.handleToolCall(connectionId, message);
                break;
                
            case 'context_request':
                await this.handleContextRequest(connectionId, message);
                break;
                
            case 'memory_operation':
                await this.handleMemoryOperation(connectionId, message);
                break;
                
            default:
                connection.ws.send(JSON.stringify({
                    type: 'error',
                    error: `Unknown message type: ${message.type}`
                }));
        }
    }
    
    async handleToolCall(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection.authenticated) {
            connection.ws.send(JSON.stringify({
                type: 'error',
                error: 'Not authenticated'
            }));
            return;
        }
        
        const tool = this.tools.get(message.tool);
        if (!tool) {
            connection.ws.send(JSON.stringify({
                type: 'error',
                error: `Unknown tool: ${message.tool}`
            }));
            return;
        }
        
        try {
            const result = await tool.handler(message.parameters || {});
            connection.ws.send(JSON.stringify({
                type: 'tool_result',
                tool: message.tool,
                result
            }));
        } catch (error) {
            connection.ws.send(JSON.stringify({
                type: 'tool_error',
                tool: message.tool,
                error: error.message
            }));
        }
    }
    
    async handleAuthenticate(connectionId, message) {
        const connection = this.connections.get(connectionId);
        
        // Simple token-based auth for now
        if (message.token === 'soulfra-mcp-token') {
            connection.authenticated = true;
            connection.ws.send(JSON.stringify({
                type: 'authenticated',
                capabilities: Array.from(this.tools.keys())
            }));
        } else {
            connection.ws.send(JSON.stringify({
                type: 'error',
                error: 'Invalid authentication token'
            }));
        }
    }
    
    async handleContextRequest(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection.authenticated) {
            connection.ws.send(JSON.stringify({
                type: 'error',
                error: 'Not authenticated'
            }));
            return;
        }
        
        const contextKey = message.context;
        const contextData = this.context.get(contextKey);
        
        if (contextData) {
            connection.ws.send(JSON.stringify({
                type: 'context_response',
                context: contextKey,
                data: contextData
            }));
        } else {
            connection.ws.send(JSON.stringify({
                type: 'error',
                error: `Unknown context: ${contextKey}`
            }));
        }
    }
    
    async handleMemoryOperation(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection.authenticated) {
            connection.ws.send(JSON.stringify({
                type: 'error',
                error: 'Not authenticated'
            }));
            return;
        }
        
        switch (message.operation) {
            case 'store':
                this.memory.get(message.category).set(message.key, message.value);
                connection.ws.send(JSON.stringify({
                    type: 'memory_stored',
                    category: message.category,
                    key: message.key
                }));
                break;
                
            case 'retrieve':
                const value = this.memory.get(message.category)?.get(message.key);
                connection.ws.send(JSON.stringify({
                    type: 'memory_retrieved',
                    category: message.category,
                    key: message.key,
                    value
                }));
                break;
                
            default:
                connection.ws.send(JSON.stringify({
                    type: 'error',
                    error: `Unknown memory operation: ${message.operation}`
                }));
        }
    }
    
    async forwardToService(serviceId, endpoint, params) {
        const service = this.services.get(serviceId);
        if (!service) {
            throw new Error(`Service not found: ${serviceId}`);
        }
        
        // In production, would make actual HTTP/WS calls
        // For now, return mock response
        return {
            service: serviceId,
            endpoint,
            params,
            response: 'Mock response - service integration pending'
        };
    }
    
    async scanCodebaseStructure() {
        // Simplified structure scan
        return {
            src: ['main.py', 'mcp-server.js'],
            services: [],
            '.rules': ['orchestrator/', 'architecture/', 'development/'],
            '.mcp': ['config.json']
        };
    }
    
    async persistMemory() {
        // Use .mcp/memory.json if .mcp exists, otherwise use mcp-memory.json
        let memoryPath = path.join(__dirname, '../.mcp/memory.json');
        if (!require('fs').existsSync(path.join(__dirname, '../.mcp'))) {
            memoryPath = path.join(__dirname, '../mcp-memory.json');
        }
        const memoryData = {
            conversations: Array.from(this.memory.get('conversations') || []),
            agent_states: Array.from(this.memory.get('agent_states') || []),
            reflections: this.memory.get('reflections') || [],
            timestamp: new Date().toISOString()
        };
        
        await fs.writeFile(memoryPath, JSON.stringify(memoryData, null, 2));
    }
    
    getServicesStatus() {
        const status = {};
        for (const [id, service] of this.services) {
            status[id] = {
                name: service.name,
                connected: service.connected,
                lastCheck: service.lastCheck
            };
        }
        return status;
    }
    
    generateConnectionId() {
        return `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Export for use as module
module.exports = SOULFRAMCPServer;

// Run if called directly
if (require.main === module) {
    const server = new SOULFRAMCPServer();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down MCP Server...');
        await server.persistMemory();
        process.exit(0);
    });
}