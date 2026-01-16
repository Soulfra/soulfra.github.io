#!/usr/bin/env node
/**
 * End-to-End Flow Test
 * Tests complete Soulfra functionality from whisper creation to debug console
 */

const http = require('http');

class E2EFlowTest {
    constructor() {
        this.backend = 'http://localhost:7777';
        this.frontend = 'http://localhost:9999';
        this.testResults = [];
    }
    
    async runFullTest() {
        console.log('🚀 Running End-to-End Flow Test');
        console.log('================================\n');
        
        try {
            // Step 1: Verify services are up
            await this.testStep('Service Health Check', async () => {
                const health = await this.makeRequest(`${this.backend}/health`);
                const healthData = JSON.parse(health);
                if (healthData.status !== 'healthy') {
                    throw new Error('Backend not healthy');
                }
                return 'Backend service is healthy';
            });
            
            // Step 2: Test initial memory state
            await this.testStep('Initial Memory State', async () => {
                const memory = await this.makeRequest(`${this.backend}/api/memory/state`);
                const memoryData = JSON.parse(memory);
                if (!memoryData.loops || !memoryData.memory) {
                    throw new Error('Invalid memory state structure');
                }
                return `Memory state valid, ${memoryData.loops.total} loops, ${memoryData.memory.usage_mb}MB used`;
            });
            
            // Step 3: Create a test whisper
            let createdLoopId;
            await this.testStep('Create Test Whisper', async () => {
                const whisperData = {
                    content: 'E2E test whisper - verifying complete flow',
                    tone: 'mystical'
                };
                
                const response = await this.makePostRequest(`${this.backend}/api/whisper`, whisperData);
                const result = JSON.parse(response);
                
                if (!result.success || !result.loop_id) {
                    throw new Error('Whisper creation failed');
                }
                
                createdLoopId = result.loop_id;
                return `Created loop: ${createdLoopId}`;
            });
            
            // Step 4: Verify whisper appears in recent loops
            await this.testStep('Verify Loop Persistence', async () => {
                const loops = await this.makeRequest(`${this.backend}/api/loops/recent`);
                const loopsData = JSON.parse(loops);
                
                const found = loopsData.find(l => l.loop_id === createdLoopId);
                if (!found) {
                    throw new Error('Created loop not found in recent loops');
                }
                
                if (found.whisper_origin !== 'E2E test whisper - verifying complete flow') {
                    throw new Error('Loop content mismatch');
                }
                
                return `Loop found with correct content and tone: ${found.emotional_tone}`;
            });
            
            // Step 5: Test specific loop retrieval
            await this.testStep('Individual Loop Retrieval', async () => {
                const loop = await this.makeRequest(`${this.backend}/api/loop/${createdLoopId}`);
                const loopData = JSON.parse(loop);
                
                if (loopData.loop_id !== createdLoopId) {
                    throw new Error('Retrieved wrong loop');
                }
                
                return `Successfully retrieved individual loop: ${loopData.loop_id}`;
            });
            
            // Step 6: Test debug preview endpoint
            await this.testStep('Debug Preview Endpoint', async () => {
                const preview = await this.makeRequest(`${this.backend}/api/debug/preview`);
                const previewData = JSON.parse(preview);
                
                if (!previewData.loop || !previewData.agent || previewData.drift === undefined) {
                    throw new Error('Invalid preview structure');
                }
                
                return `Debug preview working: drift=${previewData.drift}, agent=${previewData.agent.name}`;
            });
            
            // Step 7: Test frontend availability
            await this.testStep('Frontend Accessibility', async () => {
                const frontend = await this.makeRequest(`${this.frontend}/`);
                if (!frontend.includes('Soulfra')) {
                    throw new Error('Frontend not serving correct content');
                }
                
                const debug = await this.makeRequest(`${this.frontend}/debug.html`);
                if (!debug.includes('Debug Console') || !debug.includes('API_BASE')) {
                    throw new Error('Debug console not properly configured');
                }
                
                return 'Frontend and debug console accessible with correct configuration';
            });
            
            // Step 8: Test memory state after operations
            await this.testStep('Updated Memory State', async () => {
                const memory = await this.makeRequest(`${this.backend}/api/memory/state`);
                const memoryData = JSON.parse(memory);
                
                if (memoryData.loops.total < 1) {
                    throw new Error('Memory state not reflecting created loops');
                }
                
                return `Memory state updated: ${memoryData.loops.total} total loops`;
            });
            
            this.printSummary();
            
        } catch (error) {
            console.error('\n💀 E2E Test Failed:', error.message);
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
        console.log('\n📊 E2E Test Summary');
        console.log('===================');
        
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
            console.log('\n🎉 Full E2E flow is working perfectly!');
            console.log('The debug console should now work without 404 errors.');
            console.log('\nTo test manually:');
            console.log('1. Open http://localhost:9999/debug.html');
            console.log('2. All panels should load without 404 errors');
            console.log('3. Try creating a whisper and see it appear in Recent Loops');
        } else {
            console.log('\n💀 E2E flow has issues that need to be resolved');
        }
    }
}

// Run test
if (require.main === module) {
    const test = new E2EFlowTest();
    test.runFullTest();
}

module.exports = E2EFlowTest;