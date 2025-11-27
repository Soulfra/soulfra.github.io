#!/usr/bin/env node
/**
 * Comprehensive test for the Claude testing and reflection system
 * Tests all new PRD components and their integration
 */

const http = require('http');
const fs = require('fs');

class ClaudeReflectionSystemTest {
    constructor() {
        this.backend = 'http://localhost:7777';
        this.testResults = [];
    }
    
    async runAllTests() {
        console.log('🧪 Claude Reflection System Comprehensive Test');
        console.log('==============================================\n');
        
        try {
            // Test 1: System Status Overview
            await this.testStep('System Status Overview', async () => {
                const response = await this.makeRequest(`${this.backend}/api/system/status`);
                const data = JSON.parse(response);
                
                const components = ['queue', 'claude_runner', 'symlinks', 'validation'];
                for (const component of components) {
                    if (!data.components[component]) {
                        throw new Error(`Missing component: ${component}`);
                    }
                }
                
                return `All ${components.length} system components active`;
            });
            
            // Test 2: TestPromptQueue functionality
            await this.testStep('Test Prompt Queue System', async () => {
                // Check queue status
                const statusResponse = await this.makeRequest(`${this.backend}/api/claude/queue/status`);
                const statusData = JSON.parse(statusResponse);
                
                if (!statusData.stats) {
                    throw new Error('Queue status missing stats');
                }
                
                // Add a test prompt
                const testPrompt = {
                    content: '# Test Prompt\n\nThis is a test prompt for the Claude reflection system.\n\nPlease respond with a simple acknowledgment.',
                    metadata: {
                        title: 'System Test Prompt',
                        priority: 'high',
                        tags: 'test,system,reflection'
                    }
                };
                
                const addResponse = await this.makePostRequest(`${this.backend}/api/claude/queue/add`, testPrompt);
                const addData = JSON.parse(addResponse);
                
                if (!addData.success || !addData.prompt) {
                    throw new Error('Failed to add prompt to queue');
                }
                
                return `Queue functional: prompt added with ID ${addData.prompt.id}`;
            });
            
            // Test 3: Claude Test Runner
            await this.testStep('Claude Test Runner System', async () => {
                const statusResponse = await this.makeRequest(`${this.backend}/api/claude/runner/status`);
                const statusData = JSON.parse(statusResponse);
                
                if (statusData.running === undefined) {
                    throw new Error('Runner status missing running state');
                }
                
                return `Runner system operational: ${statusData.running ? 'running' : 'stopped'}`;
            });
            
            // Test 4: Symlink Mirror Layer
            await this.testStep('Symlink Mirror Layer', async () => {
                const statusResponse = await this.makeRequest(`${this.backend}/api/symlinks/status`);
                const statusData = JSON.parse(statusResponse);
                
                if (!statusData.pairs || statusData.total_pairs === 0) {
                    throw new Error('No symlink pairs configured');
                }
                
                const activePairs = statusData.active_pairs;
                const totalPairs = statusData.total_pairs;
                
                if (activePairs !== totalPairs) {
                    throw new Error(`Only ${activePairs}/${totalPairs} symlinks active`);
                }
                
                return `Symlink system healthy: ${activePairs} active pairs`;
            });
            
            // Test 5: System Validation Daemon
            await this.testStep('System Validation Daemon', async () => {
                const statusResponse = await this.makeRequest(`${this.backend}/api/validation/status`);
                const statusData = JSON.parse(statusResponse);
                
                if (!statusData.checks) {
                    throw new Error('Validation status missing checks');
                }
                
                const healthScore = statusData.health_score;
                if (healthScore < 80) {
                    throw new Error(`Health score too low: ${healthScore}`);
                }
                
                const criticalChecks = Object.values(statusData.checks).filter(c => c.critical);
                const healthyCritical = criticalChecks.filter(c => c.status === 'healthy');
                
                if (healthyCritical.length !== criticalChecks.length) {
                    throw new Error(`Critical systems unhealthy: ${criticalChecks.length - healthyCritical.length}`);
                }
                
                return `Validation system healthy: ${healthScore}% health score`;
            });
            
            // Test 6: Path System Integration
            await this.testStep('Path System Integration', async () => {
                const pathsResponse = await this.makeRequest(`${this.backend}/api/debug/paths`);
                const pathsData = JSON.parse(pathsResponse);
                
                const requiredPaths = ['loop', 'agents', 'logs', 'config', 'memory', 'runtime', 'cache'];
                for (const path of requiredPaths) {
                    if (pathsData.paths[path] !== 'ok') {
                        throw new Error(`Path ${path} not OK: ${pathsData.paths[path]}`);
                    }
                }
                
                return `Path system integrated: ${requiredPaths.length} critical paths verified`;
            });
            
            // Test 7: File System Structure
            await this.testStep('File System Structure Verification', async () => {
                const requiredFiles = [
                    'TestPromptQueue.js',
                    'ClaudeTestRunner.js', 
                    'SymlinkMirrorLayer.js',
                    'SystemValidationDaemon.js',
                    'path-map.json',
                    'FileExistenceVerifier.js',
                    'mkdirBootstrapPatch.js'
                ];
                
                let existingFiles = 0;
                for (const file of requiredFiles) {
                    if (fs.existsSync(`./${file}`)) {
                        existingFiles++;
                    }
                }
                
                if (existingFiles !== requiredFiles.length) {
                    throw new Error(`Only ${existingFiles}/${requiredFiles.length} system files found`);
                }
                
                return `File structure complete: ${existingFiles} system files verified`;
            });
            
            // Test 8: Component Integration
            await this.testStep('Component Integration Test', async () => {
                // Test that all components can communicate
                const endpoints = [
                    '/api/claude/queue/status',
                    '/api/claude/runner/status', 
                    '/api/symlinks/status',
                    '/api/validation/status',
                    '/api/debug/paths'
                ];
                
                let workingEndpoints = 0;
                for (const endpoint of endpoints) {
                    try {
                        const response = await this.makeRequest(`${this.backend}${endpoint}`);
                        const data = JSON.parse(response);
                        if (data && typeof data === 'object') {
                            workingEndpoints++;
                        }
                    } catch (error) {
                        console.warn(`Endpoint failed: ${endpoint} - ${error.message}`);
                    }
                }
                
                if (workingEndpoints !== endpoints.length) {
                    throw new Error(`Only ${workingEndpoints}/${endpoints.length} endpoints working`);
                }
                
                return `Integration complete: ${workingEndpoints} API endpoints functional`;
            });
            
            this.printSummary();
            
        } catch (error) {
            console.error('\n💀 Claude Reflection System Test Failed:', error.message);
            this.printSummary();
            process.exit(1);
        }
    }
    
    async testStep(name, testFunction) {
        const startTime = Date.now();
        console.log(`🧪 ${name}...`);
        
        try {
            const result = await testFunction();
            const duration = Date.now() - startTime;
            
            console.log(`✅ ${name}: ${result} (${duration}ms)`);
            this.testResults.push({
                name,
                success: true,
                result,
                duration
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            
            console.log(`❌ ${name}: ${error.message} (${duration}ms)`);
            this.testResults.push({
                name,
                success: false,
                error: error.message,
                duration
            });
            throw error;
        }
    }
    
    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }
    
    makePostRequest(url, data) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const postData = JSON.stringify(data);
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(responseData);
                    } else {
                        reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.write(postData);
            req.end();
        });
    }
    
    printSummary() {
        console.log('\n📊 Claude Reflection System Test Summary');
        console.log('========================================');
        
        const passed = this.testResults.filter(r => r.success).length;
        const total = this.testResults.length;
        const avgDuration = Math.round(
            this.testResults.reduce((sum, r) => sum + r.duration, 0) / total
        );
        
        console.log(`Tests run: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        console.log(`Average response time: ${avgDuration}ms`);
        
        const percentage = Math.round((passed / total) * 100);
        console.log(`Success rate: ${percentage}%`);
        
        if (percentage === 100) {
            console.log('\n🎉 CLAUDE REFLECTION SYSTEM FULLY OPERATIONAL!');
            console.log('✅ TestPromptQueue - Ready for Claude prompts');
            console.log('✅ ClaudeTestRunner - Automated execution system');
            console.log('✅ SymlinkMirrorLayer - Runtime synchronization');
            console.log('✅ SystemValidationDaemon - Health monitoring');
            console.log('✅ Full API integration - All endpoints functional');
            console.log('✅ Path consistency system - Verified and operational');
            console.log('');
            console.log('🚀 Soulfra mythOS kernel is ready for verified, sealed, and auditable runtime!');
        } else {
            console.log('\n💀 System not ready. Please address failures before deployment.');
        }
    }
}

// Run test
if (require.main === module) {
    const test = new ClaudeReflectionSystemTest();
    test.runAllTests();
}

module.exports = ClaudeReflectionSystemTest;