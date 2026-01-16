// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * MCP Search Integration - Connects Master Search to MCP/Ollama
 * Makes search results available to AI models
 */

const http = require('http');
const { spawn } = require('child_process');

class MCPSearchIntegration {
    constructor() {
        this.searchPort = 7878;
        this.mcpPort = 8888;
        this.searchProcess = null;
    }
    
    async start() {
        console.log('🔍 Starting MCP Search Integration...');
        
        // Start the search engine
        await this.startSearchEngine();
        
        // Wait for it to be ready
        await this.waitForSearchEngine();
        
        // Add search tool to MCP
        await this.addSearchToolToMCP();
        
        console.log('✅ Search integration ready!');
    }
    
    async startSearchEngine() {
        console.log('🚀 Launching Master Search Engine...');
        
        this.searchProcess = spawn('python3', ['MASTER_SEARCH_ENGINE.py'], {
            stdio: ['ignore', 'pipe', 'pipe']
        });
        
        this.searchProcess.stdout.on('data', (data) => {
            console.log(`[Search] ${data.toString().trim()}`);
        });
        
        this.searchProcess.stderr.on('data', (data) => {
            console.error(`[Search Error] ${data.toString().trim()}`);
        });
        
        this.searchProcess.on('close', (code) => {
            console.log(`Search engine exited with code ${code}`);
        });
    }
    
    async waitForSearchEngine() {
        console.log('⏳ Waiting for search engine to be ready...');
        
        for (let i = 0; i < 30; i++) {
            try {
                const response = await this.httpGet(`http://127.0.0.1:${this.searchPort}/stats`);
                if (response) {
                    console.log('✅ Search engine is ready!');
                    return;
                }
            } catch (e) {
                // Not ready yet
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        throw new Error('Search engine failed to start');
    }
    
    async addSearchToolToMCP() {
        console.log('🔧 Adding search tool to MCP...');
        
        // Create MCP tool definition
        const searchTool = {
            name: 'search_codebase',
            description: 'Search across all SOULFRA tiers and nested folders',
            parameters: {
                query: { 
                    type: 'string', 
                    required: true,
                    description: 'Search query (e.g. "consciousness", "cal riven", "oauth")'
                },
                limit: {
                    type: 'number',
                    default: 10,
                    description: 'Maximum number of results to return'
                }
            },
            handler: async (params) => {
                try {
                    // Call search engine
                    const searchUrl = `http://127.0.0.1:${this.searchPort}/search?q=${encodeURIComponent(params.query)}`;
                    const results = await this.httpGet(searchUrl);
                    
                    // Format results for AI
                    const formatted = results.slice(0, params.limit || 10).map(r => ({
                        file: r.file_name,
                        path: r.file_path,
                        tier: r.tier_level,
                        relevance: r.relevance_score,
                        context: r.context,
                        functions: r.functions.slice(0, 3),
                        classes: r.classes
                    }));
                    
                    return {
                        query: params.query,
                        count: results.length,
                        results: formatted
                    };
                } catch (error) {
                    return {
                        error: `Search failed: ${error.message}`
                    };
                }
            }
        };
        
        // Try to register with MCP
        try {
            const response = await this.httpPost(`http://127.0.0.1:${this.mcpPort}/api/tools/register`, searchTool);
            console.log('✅ Search tool registered with MCP:', response);
        } catch (error) {
            console.log('⚠️  Could not register with MCP (may not be running)');
            console.log('   Search engine is still available at http://127.0.0.1:7878');
        }
    }
    
    // HTTP helpers
    httpGet(url) {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                });
            }).on('error', reject);
        });
    }
    
    httpPost(url, data) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(data);
            const urlParts = new URL(url);
            
            const options = {
                hostname: urlParts.hostname,
                port: urlParts.port,
                path: urlParts.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = http.request(options, (res) => {
                let responseData = '';
                res.on('data', chunk => responseData += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(responseData));
                    } catch (e) {
                        resolve(responseData);
                    }
                });
            });
            
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
    
    async stop() {
        if (this.searchProcess) {
            console.log('Stopping search engine...');
            this.searchProcess.kill();
        }
    }
}

// Main execution
if (require.main === module) {
    const integration = new MCPSearchIntegration();
    
    // Start the integration
    integration.start().catch(error => {
        console.error('Failed to start search integration:', error);
        process.exit(1);
    });
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down search integration...');
        integration.stop();
        process.exit(0);
    });
}

module.exports = MCPSearchIntegration;