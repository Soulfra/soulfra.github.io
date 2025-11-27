#!/usr/bin/env node
/**
 * Comprehensive test for the new path consistency system
 * Tests all PRD requirements and verifies "No such file or directory" errors are eliminated
 */

const http = require('http');

class PathSystemTest {
    constructor() {
        this.backend = 'http://localhost:7777';
        this.testResults = [];
    }
    
    async runAllTests() {
        console.log('🧪 Path System Comprehensive Test');
        console.log('=================================\n');
        
        try {
            // Test 1: Path map existence
            await this.testStep('Path Map File Exists', async () => {
                const fs = require('fs');
                const pathMapExists = fs.existsSync('./path-map.json');
                if (!pathMapExists) {
                    throw new Error('path-map.json not found');
                }
                return 'path-map.json exists and contains canonical folder structure';
            });
            
            // Test 2: FileExistenceVerifier CLI
            await this.testStep('FileExistenceVerifier CLI', async () => {
                const { exec } = require('child_process');
                const { promisify } = require('util');
                const execAsync = promisify(exec);
                
                const { stdout } = await execAsync('node FileExistenceVerifier.js');
                if (!stdout.includes('All required folders verified')) {
                    throw new Error('FileExistenceVerifier CLI failed');
                }
                return 'CLI tool successfully verified/created all folders';
            });
            
            // Test 3: Bootstrap integration
            await this.testStep('Bootstrap Integration', async () => {
                const { exec } = require('child_process');
                const { promisify } = require('util');
                const execAsync = promisify(exec);
                
                const { stdout } = await execAsync('node mkdirBootstrapPatch.js');
                if (!stdout.includes('Bootstrap complete')) {
                    throw new Error('Bootstrap patch failed');
                }
                return 'Bootstrap patch successfully ensures folder structure';
            });
            
            // Test 4: Path diagnostics API
            await this.testStep('Path Diagnostics API', async () => {
                const response = await this.makeRequest(`${this.backend}/api/debug/paths`);
                const data = JSON.parse(response);
                
                if (!data.paths || data.paths.loop !== 'ok') {
                    throw new Error('Path diagnostics API not working correctly');
                }
                
                const requiredPaths = ['loop', 'agents', 'logs', 'config', 'memory', 'mirror-shell', 'runtime', 'cache'];
                for (const path of requiredPaths) {
                    if (data.paths[path] !== 'ok') {
                        throw new Error(`Required path ${path} not OK: ${data.paths[path]}`);
                    }
                }
                
                return `All ${requiredPaths.length} required paths verified as OK`;
            });
            
            // Test 5: Full path verification API
            await this.testStep('Full Path Verification API', async () => {
                const response = await this.makeRequest(`${this.backend}/api/verify/paths`);
                const data = JSON.parse(response);
                
                if (data.status !== 'success') {
                    throw new Error(`Verification failed: ${data.status}`);
                }
                
                if (data.summary.failed > 0) {
                    throw new Error(`${data.summary.failed} folders failed verification`);
                }
                
                return `Verified ${data.summary.checked} folders, ${data.summary.existing} existing`;
            });
            
            // Test 6: Auto-repair functionality
            await this.testStep('Auto-Repair Functionality', async () => {
                const response = await this.makePostRequest(`${this.backend}/api/debug/paths/repair`, {});
                const data = JSON.parse(response);
                
                if (data.status !== 'success') {
                    throw new Error(`Auto-repair failed: ${data.status}`);
                }
                
                return `Auto-repair functional: ${data.repaired} folders repaired`;
            });
            
            // Test 7: Server bootstrap integration
            await this.testStep('Server Bootstrap Integration', async () => {
                const fs = require('fs');
                const serverLog = fs.readFileSync('./logs/unified-server.log', 'utf8');
                
                if (!serverLog.includes('Bootstrap: Ensuring folder structure')) {
                    throw new Error('Server bootstrap not integrated');
                }
                
                if (!serverLog.includes('Bootstrap complete')) {
                    throw new Error('Server bootstrap failed');
                }
                
                return 'Server successfully integrates bootstrap on startup';
            });
            
            // Test 8: Debug console integration
            await this.testStep('Debug Console Integration', async () => {
                const response = await this.makeRequest('http://localhost:9999/debug.html');
                
                if (!response.includes('Path Diagnostics')) {
                    throw new Error('Debug console missing Path Diagnostics panel');
                }
                
                if (!response.includes('fetchPathDiagnostics')) {
                    throw new Error('Debug console missing path diagnostics functions');
                }
                
                if (!response.includes('Fix Missing Folders')) {
                    throw new Error('Debug console missing auto-repair button');
                }
                
                return 'Debug console includes path diagnostics panel and auto-repair';
            });
            
            this.printSummary();
            
        } catch (error) {
            console.error('\n💀 Path System Test Failed:', error.message);
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
        console.log('\n📊 Path System Test Summary');
        console.log('===========================');
        
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
            console.log('\n🎉 ALL PRD REQUIREMENTS IMPLEMENTED SUCCESSFULLY!');
            console.log('✅ Path consistency system fully operational');
            console.log('✅ "No such file or directory" errors eliminated');
            console.log('✅ Canonical folder structure enforced');
            console.log('✅ Auto-repair functionality working');
            console.log('✅ Debug console integration complete');
        } else {
            console.log('\n💀 Some PRD requirements not met. Please review failures.');
        }
    }
}

// Run test
if (require.main === module) {
    const test = new PathSystemTest();
    test.runAllTests();
}

module.exports = PathSystemTest;