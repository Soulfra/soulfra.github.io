#!/usr/bin/env node
/**
 * SOULFRA MCP CLI - Use your unified interface
 * This is how you actually USE the MCP integration with all your systems
 */

const WebSocket = require('ws');
const readline = require('readline');

class SOULFRAMCPClient {
    constructor() {
        this.ws = null;
        this.authenticated = false;
        this.connectionId = null;
        
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    async connect() {
        console.log('🔌 Connecting to SOULFRA MCP Server...');
        
        this.ws = new WebSocket('ws://localhost:8888');
        
        this.ws.on('open', () => {
            console.log('✅ Connected to MCP Server');
        });
        
        this.ws.on('message', (data) => {
            const message = JSON.parse(data);
            this.handleMessage(message);
        });
        
        this.ws.on('close', () => {
            console.log('🔌 Disconnected from MCP Server');
            process.exit(0);
        });
        
        this.ws.on('error', (error) => {
            console.error('❌ Connection error:', error.message);
            console.log('\n💡 Make sure MCP server is running:');
            console.log('   node src/mcp-server.js');
            process.exit(1);
        });
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'welcome':
                console.log(`📡 Welcome! Connection ID: ${message.connectionId}`);
                this.connectionId = message.connectionId;
                this.authenticate();
                break;
                
            case 'authenticated':
                console.log('🔓 Authenticated successfully!');
                console.log(`Available tools: ${message.capabilities.join(', ')}`);
                this.authenticated = true;
                this.showMenu();
                break;
                
            case 'tool_result':
                console.log(`\n✅ ${message.tool} result:`);
                console.log(JSON.stringify(message.result, null, 2));
                this.showMenu();
                break;
                
            case 'tool_error':
                console.log(`\n❌ ${message.tool} error: ${message.error}`);
                this.showMenu();
                break;
                
            case 'error':
                console.log(`\n❌ Error: ${message.error}`);
                if (!this.authenticated) {
                    this.authenticate();
                } else {
                    this.showMenu();
                }
                break;
                
            default:
                console.log('📨 Received:', message);
        }
    }
    
    authenticate() {
        this.ws.send(JSON.stringify({
            type: 'authenticate',
            token: 'soulfra-mcp-token'
        }));
    }
    
    showMenu() {
        console.log('\n🎯 SOULFRA MCP Interface - What would you like to do?');
        console.log('==================================================');
        console.log('1. Get SOULFRA platform status');
        console.log('2. Create code improvement proposal');
        console.log('3. Validate file against rules');
        console.log('4. Store data on blockchain');
        console.log('5. Read a file');
        console.log('6. List files in directory');
        console.log('7. Exit');
        console.log('');
        
        this.rl.question('Choose an option (1-7): ', (choice) => {
            this.handleChoice(choice.trim());
        });
    }
    
    async handleChoice(choice) {
        switch (choice) {
            case '1':
                await this.getSoulfraStatus();
                break;
            case '2':
                await this.createImprovement();
                break;
            case '3':
                await this.validateRules();
                break;
            case '4':
                await this.storeOnBlockchain();
                break;
            case '5':
                await this.readFile();
                break;
            case '6':
                await this.listFiles();
                break;
            case '7':
                console.log('👋 Goodbye!');
                process.exit(0);
                break;
            default:
                console.log('❌ Invalid choice. Please try again.');
                this.showMenu();
        }
    }
    
    async getSoulfraStatus() {
        console.log('\n📊 Getting SOULFRA platform status...');
        this.ws.send(JSON.stringify({
            type: 'tool_call',
            tool: 'soulfra_status'
        }));
    }
    
    async createImprovement() {
        console.log('\n🔧 Creating code improvement proposal...');
        
        this.rl.question('Files to improve (comma-separated): ', (files) => {
            this.rl.question('Description of improvement: ', (description) => {
                this.rl.question('Create GitHub PR? (y/n): ', (createPr) => {
                    this.ws.send(JSON.stringify({
                        type: 'tool_call',
                        tool: 'create_improvement',
                        parameters: {
                            files: files.split(',').map(f => f.trim()),
                            description: description,
                            type: 'refactor_complexity_reduction',
                            create_pr: createPr.toLowerCase() === 'y'
                        }
                    }));
                });
            });
        });
    }
    
    async validateRules() {
        console.log('\n✅ Validating file against SOULFRA rules...');
        
        this.rl.question('File path to validate: ', (filePath) => {
            this.ws.send(JSON.stringify({
                type: 'tool_call',
                tool: 'rules_validate',
                parameters: {
                    path: filePath
                }
            }));
        });
    }
    
    async storeOnBlockchain() {
        console.log('\n⛓️  Storing data on blockchain...');
        
        this.rl.question('Data to store (JSON): ', (dataStr) => {
            try {
                const data = JSON.parse(dataStr);
                this.ws.send(JSON.stringify({
                    type: 'tool_call',
                    tool: 'blockchain_store',
                    parameters: {
                        data: data
                    }
                }));
            } catch (e) {
                console.log('❌ Invalid JSON. Please try again.');
                this.showMenu();
            }
        });
    }
    
    async readFile() {
        console.log('\n📄 Reading file...');
        
        this.rl.question('File path to read: ', (filePath) => {
            this.ws.send(JSON.stringify({
                type: 'tool_call',
                tool: 'file_read',
                parameters: {
                    path: filePath
                }
            }));
        });
    }
    
    async listFiles() {
        console.log('\n📁 Listing files...');
        
        this.rl.question('Directory path: ', (dirPath) => {
            this.ws.send(JSON.stringify({
                type: 'tool_call',
                tool: 'file_list',
                parameters: {
                    path: dirPath || '.'
                }
            }));
        });
    }
}

// Quick test commands
if (process.argv[2] === '--test') {
    console.log('🧪 Running quick MCP tests...');
    const http = require('http');
    
    // Test 1: Is MCP server running?
    http.get('http://localhost:8888/health', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('✅ MCP Server health check:', JSON.parse(data));
        });
    }).on('error', () => {
        console.log('❌ MCP Server not running. Start it with: node src/mcp-server.js');
    });
    
    // Test 2: Is SOULFRA running?
    http.get('http://localhost:9999/api/user/test', (res) => {
        console.log('✅ SOULFRA Ultimate is running on port 9999');
    }).on('error', () => {
        console.log('⚠️  SOULFRA Ultimate not accessible on port 9999');
    });
    
    return;
}

// Main execution
async function main() {
    console.log('🌟 SOULFRA MCP Client');
    console.log('=====================');
    console.log('This connects you to ALL your SOULFRA systems through MCP');
    console.log('');
    
    const client = new SOULFRAMCPClient();
    await client.connect();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Goodbye!');
    process.exit(0);
});

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SOULFRAMCPClient;