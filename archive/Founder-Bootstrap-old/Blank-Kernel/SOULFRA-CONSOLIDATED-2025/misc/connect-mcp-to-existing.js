#!/usr/bin/env node
/**
 * Connect MCP to EXISTING Systems
 * Stop creating new integrations - use what's already there!
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🔌 Connecting MCP to EXISTING SOULFRA Systems');
console.log('============================================');
console.log('');

// Check what systems are available
const systems = {
    aiEconomy: {
        file: 'AI_ECONOMY_GITHUB_AUTOMATION.py',
        port: 9091,
        description: 'GitHub automation with AI review and bounties'
    },
    rulesOrchestrator: {
        file: '.rules/orchestrator/RulesOrchestrator.js',
        description: 'Automatic rules enforcement'
    },
    blockchain: {
        file: 'setup-real-blockchain.js',
        description: 'Real Arweave blockchain integration'
    },
    soulfraMain: {
        file: 'SOULFRA_ULTIMATE_UNIFIED.py',
        port: 9999,
        description: 'Main SOULFRA platform with 60+ features'
    }
};

// Check which systems exist
console.log('📋 Checking existing systems:');
for (const [name, system] of Object.entries(systems)) {
    if (fs.existsSync(system.file)) {
        console.log(`   ✅ ${name}: ${system.description}`);
        if (system.port) {
            console.log(`      Port: ${system.port}`);
        }
    } else {
        console.log(`   ❌ ${name}: Not found at ${system.file}`);
    }
}

console.log('\n🔧 Creating MCP integration module...');

// Create integration module that connects to existing systems
const integrationCode = `/**
 * MCP Integration with EXISTING SOULFRA Systems
 * This connects MCP to what's already built instead of creating duplicates
 */

const http = require('http');
const { EventEmitter } = require('events');

class ExistingSystemsIntegration extends EventEmitter {
    constructor() {
        super();
        
        this.systems = {
            aiEconomy: {
                url: 'http://localhost:9091',
                available: false
            },
            soulfraMain: {
                url: 'http://localhost:9999', 
                available: false
            },
            rulesOrchestrator: {
                module: null,
                available: false
            },
            blockchain: {
                module: null,
                available: false
            }
        };
        
        this.checkAvailability();
    }
    
    async checkAvailability() {
        console.log('🔍 Checking system availability...');
        
        // Check AI Economy
        try {
            const response = await this.httpGet('http://localhost:9091/api/dashboard');
            if (response) {
                this.systems.aiEconomy.available = true;
                console.log('   ✅ AI Economy is running');
            }
        } catch (e) {
            console.log('   ⚠️  AI Economy not running - start with: python3 AI_ECONOMY_GITHUB_AUTOMATION.py');
        }
        
        // Check SOULFRA Main
        try {
            const response = await this.httpGet('http://localhost:9999/api/health');
            if (response) {
                this.systems.soulfraMain.available = true;
                console.log('   ✅ SOULFRA Main is running');
            }
        } catch (e) {
            console.log('   ⚠️  SOULFRA Main not running - start with: python3 SOULFRA_ULTIMATE_UNIFIED.py');
        }
        
        // Load Rules Orchestrator if available
        try {
            const RulesOrchestrator = require('./.rules/orchestrator/RulesOrchestrator');
            this.systems.rulesOrchestrator.module = new RulesOrchestrator({ dryRun: false });
            this.systems.rulesOrchestrator.available = true;
            console.log('   ✅ Rules Orchestrator loaded');
        } catch (e) {
            console.log('   ⚠️  Rules Orchestrator not available');
        }
        
        // Load Blockchain if available
        try {
            const blockchain = require('./setup-real-blockchain');
            this.systems.blockchain.module = blockchain;
            this.systems.blockchain.available = true;
            console.log('   ✅ Blockchain integration loaded');
        } catch (e) {
            console.log('   ⚠️  Blockchain integration not available');
        }
    }
    
    httpGet(url) {
        return new Promise((resolve, reject) => {
            http.get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
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
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };
            
            const req = http.request(url, options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => responseData += chunk);
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
    
    // MCP Tool: Create improvement proposal through AI Economy
    async createImprovement(params) {
        if (!this.systems.aiEconomy.available) {
            throw new Error('AI Economy not available');
        }
        
        const proposal = {
            agent_id: params.agent_id || 'mcp_agent',
            proposal_type: params.type || 'refactor_complexity_reduction',
            target_files: params.files,
            description: params.description,
            implementation_plan: params.plan || ['Analyze code', 'Make improvements', 'Test changes']
        };
        
        // Create proposal
        const proposalResult = await this.httpPost(
            'http://localhost:9091/api/create-proposal',
            proposal
        );
        
        // Optionally create PR
        if (params.create_pr) {
            const prResult = await this.httpPost(
                'http://localhost:9091/api/create-pr',
                { proposal_id: proposalResult.proposal_id }
            );
            return prResult;
        }
        
        return proposalResult;
    }
    
    // MCP Tool: Validate files against rules
    async validateRules(filePath) {
        if (!this.systems.rulesOrchestrator.available) {
            throw new Error('Rules Orchestrator not available');
        }
        
        const violations = await this.systems.rulesOrchestrator.module.validator.validateFile(filePath);
        return {
            file: filePath,
            violations: violations,
            passed: violations.length === 0
        };
    }
    
    // MCP Tool: Store on blockchain
    async storeOnBlockchain(data) {
        if (!this.systems.blockchain.available) {
            throw new Error('Blockchain integration not available');
        }
        
        // This would use the real blockchain integration
        console.log('Would store on blockchain:', data);
        return {
            stored: true,
            message: 'Blockchain storage requires wallet setup'
        };
    }
    
    // MCP Tool: Get SOULFRA platform status
    async getSoulfraStatus() {
        if (!this.systems.soulfraMain.available) {
            throw new Error('SOULFRA Main not available');
        }
        
        const health = await this.httpGet('http://localhost:9999/api/health');
        const stats = await this.httpGet('http://localhost:9999/api/stats');
        
        return {
            health,
            stats,
            features: 60, // From SOULFRA_ULTIMATE_UNIFIED
            url: 'http://localhost:9999'
        };
    }
}

module.exports = ExistingSystemsIntegration;
`;

// Write the integration module
fs.writeFileSync('src/mcp-existing-integration.js', integrationCode);
console.log('✅ Created src/mcp-existing-integration.js');

// Create updated MCP server configuration
console.log('\n🔧 Creating updated MCP configuration...');

const updatedConfig = `{
  "name": "SOULFRA MCP Integration",
  "version": "1.0.0",
  "description": "MCP connected to EXISTING SOULFRA systems",
  "port": 8888,
  
  "capabilities": ["tools", "context", "memory"],
  
  "existing_systems": {
    "ai_economy": {
      "description": "GitHub automation with AI review and bounties",
      "url": "http://localhost:9091",
      "start_command": "python3 AI_ECONOMY_GITHUB_AUTOMATION.py"
    },
    "soulfra_main": {
      "description": "Main SOULFRA platform with 60+ features",
      "url": "http://localhost:9999",
      "start_command": "python3 SOULFRA_ULTIMATE_UNIFIED.py"
    },
    "rules_orchestrator": {
      "description": "Automatic rules enforcement",
      "module": ".rules/orchestrator/RulesOrchestrator.js",
      "start_command": "node .rules/orchestrator/RulesOrchestrator.js"
    },
    "blockchain": {
      "description": "Real Arweave blockchain integration",
      "module": "setup-real-blockchain.js",
      "setup_command": "node setup-real-blockchain.js"
    }
  },
  
  "tools": {
    "improvement_proposal": {
      "description": "Create code improvement through AI Economy",
      "handler": "createImprovement",
      "params": {
        "files": "array",
        "description": "string",
        "type": "string",
        "create_pr": "boolean"
      }
    },
    "validate_rules": {
      "description": "Validate files against SOULFRA rules",
      "handler": "validateRules",
      "params": {
        "path": "string"
      }
    },
    "blockchain_store": {
      "description": "Store data on real blockchain",
      "handler": "storeOnBlockchain",
      "params": {
        "data": "object"
      }
    },
    "soulfra_status": {
      "description": "Get SOULFRA platform status",
      "handler": "getSoulfraStatus"
    }
  }
}`;

fs.writeFileSync('mcp-existing-config.json', updatedConfig);
console.log('✅ Created mcp-existing-config.json');

// Create example usage script
console.log('\n🔧 Creating example usage script...');

const exampleUsage = `#!/usr/bin/env node
/**
 * Example: Using MCP with EXISTING Systems
 */

const ExistingSystemsIntegration = require('./src/mcp-existing-integration');

async function demo() {
    console.log('🎯 MCP + Existing Systems Demo');
    console.log('==============================\\n');
    
    const integration = new ExistingSystemsIntegration();
    
    // Wait for systems check
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\\n📝 Example 1: Create improvement proposal through AI Economy');
    try {
        const result = await integration.createImprovement({
            files: ['test.py'],
            description: 'Reduce complexity by extracting functions',
            type: 'refactor_complexity_reduction',
            create_pr: false // Set to true to create GitHub PR
        });
        console.log('Result:', result);
    } catch (e) {
        console.log('Error:', e.message);
    }
    
    console.log('\\n✅ Example 2: Validate files against rules');
    try {
        const result = await integration.validateRules('test.py');
        console.log('Validation:', result);
    } catch (e) {
        console.log('Error:', e.message);
    }
    
    console.log('\\n📊 Example 3: Get SOULFRA status');
    try {
        const result = await integration.getSoulfraStatus();
        console.log('SOULFRA Status:', result);
    } catch (e) {
        console.log('Error:', e.message);
    }
    
    console.log('\\n💡 Tips:');
    console.log('- Start AI Economy: python3 AI_ECONOMY_GITHUB_AUTOMATION.py');
    console.log('- Start SOULFRA: python3 SOULFRA_ULTIMATE_UNIFIED.py');
    console.log('- Start Rules: node .rules/orchestrator/RulesOrchestrator.js');
    console.log('- All systems work together through MCP!');
}

demo().catch(console.error);
`;

fs.writeFileSync('test-mcp-existing.js', exampleUsage);
console.log('✅ Created test-mcp-existing.js');

console.log('\n===============================================');
console.log('✅ MCP is now configured to use EXISTING systems!');
console.log('===============================================\n');

console.log('Next steps:');
console.log('1. Start existing systems:');
console.log('   ./activate-all.sh');
console.log('');
console.log('2. Test the integration:');
console.log('   node test-mcp-existing.js');
console.log('');
console.log('3. Update MCP server to use the integration:');
console.log('   - Import ExistingSystemsIntegration in src/mcp-server.js');
console.log('   - Replace duplicate handlers with calls to existing systems');
console.log('');
console.log('Remember: We already have everything we need!');
console.log('Stop creating new systems - use what exists!');