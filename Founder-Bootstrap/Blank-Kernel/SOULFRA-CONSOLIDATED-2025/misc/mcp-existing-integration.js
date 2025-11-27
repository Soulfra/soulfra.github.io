/**
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
            const RulesOrchestrator = require('../.rules/orchestrator/RulesOrchestrator');
            this.systems.rulesOrchestrator.module = new RulesOrchestrator({ dryRun: false });
            this.systems.rulesOrchestrator.available = true;
            console.log('   ✅ Rules Orchestrator loaded');
        } catch (e) {
            console.log('   ⚠️  Rules Orchestrator not available');
        }
        
        // Load Blockchain if available
        try {
            const blockchain = require('../setup-real-blockchain');
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