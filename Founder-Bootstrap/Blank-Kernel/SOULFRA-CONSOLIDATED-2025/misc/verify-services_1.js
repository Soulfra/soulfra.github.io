#!/usr/bin/env node
/**
 * Service Verification Scraper
 * Actually tests if endpoints are responding correctly
 */

const http = require('http');

class ServiceVerifier {
    constructor() {
        this.tests = [
            {
                name: 'Backend Root',
                url: 'http://localhost:7777/',
                expected: 'Soulfra Backend API'
            },
            {
                name: 'Backend Health',
                url: 'http://localhost:7777/health',
                expected: 'healthy'
            },
            {
                name: 'Backend Loops',
                url: 'http://localhost:7777/api/loops/recent',
                expected: 'loop_'
            },
            {
                name: 'Backend Memory',
                url: 'http://localhost:7777/api/memory/state',
                expected: 'loops'
            },
            {
                name: 'Frontend Index',
                url: 'http://localhost:9999/',
                expected: 'Soulfra'
            },
            {
                name: 'Frontend Debug',
                url: 'http://localhost:9999/debug.html',
                expected: 'Debug Console'
            }
        ];
        
        this.results = [];
    }
    
    async runAllTests() {
        console.log('🧪 Running Service Verification Tests');
        console.log('====================================\n');
        
        for (const test of this.tests) {
            const result = await this.testEndpoint(test);
            this.results.push(result);
            
            const status = result.success ? '✅' : '❌';
            console.log(`${status} ${test.name}: ${result.message}`);
            
            if (result.success && result.responseTime) {
                console.log(`   Response time: ${result.responseTime}ms`);
            }
            
            if (!result.success && result.error) {
                console.log(`   Error: ${result.error}`);
            }
        }
        
        this.printSummary();
    }
    
    async testEndpoint(test) {
        const startTime = Date.now();
        
        try {
            const response = await this.makeRequest(test.url);
            const responseTime = Date.now() - startTime;
            
            // Check if response contains expected content
            const hasExpected = response.includes(test.expected);
            
            return {
                name: test.name,
                success: hasExpected,
                message: hasExpected ? 'Working correctly' : 'Response missing expected content',
                responseTime,
                responseLength: response.length,
                preview: response.substring(0, 100) + (response.length > 100 ? '...' : '')
            };
            
        } catch (error) {
            return {
                name: test.name,
                success: false,
                message: 'Request failed',
                error: error.message,
                responseTime: Date.now() - startTime
            };
        }
    }
    
    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            
            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname,
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
                        reject(new Error(`HTTP ${res.statusCode}`));
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
    
    printSummary() {
        console.log('\n📊 Test Summary');
        console.log('===============');
        
        const passed = this.results.filter(r => r.success).length;
        const total = this.results.length;
        
        console.log(`Total tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        
        const percentage = Math.round((passed / total) * 100);
        console.log(`Success rate: ${percentage}%`);
        
        if (percentage === 100) {
            console.log('\n🎉 All services are verified working!');
        } else if (percentage >= 80) {
            console.log('\n⚠️  Most services working, some issues detected');
        } else {
            console.log('\n💀 Major service failures detected');
        }
        
        // Show response previews for successful tests
        console.log('\n📝 Response Previews:');
        console.log('====================');
        
        for (const result of this.results) {
            if (result.success && result.preview) {
                console.log(`\n${result.name}:`);
                console.log(`  ${result.preview}`);
            }
        }
    }
    
    async testWhisperCreation() {
        console.log('\n🗣️  Testing Whisper Creation');
        console.log('===========================');
        
        const testWhisper = {
            content: 'Verification test whisper',
            tone: 'testing'
        };
        
        try {
            const response = await this.makePostRequest(
                'http://localhost:7777/api/whisper',
                testWhisper
            );
            
            const parsed = JSON.parse(response);
            
            if (parsed.success && parsed.loop_id) {
                console.log('✅ Whisper creation: Working');
                console.log(`   Created loop: ${parsed.loop_id}`);
                
                // Verify it appears in recent loops
                const recentResponse = await this.makeRequest('http://localhost:7777/api/loops/recent');
                const recent = JSON.parse(recentResponse);
                
                const found = recent.find(l => l.loop_id === parsed.loop_id);
                if (found) {
                    console.log('✅ Loop persistence: Working');
                    console.log(`   Found in recent loops with tone: ${found.emotional_tone}`);
                } else {
                    console.log('❌ Loop persistence: Failed');
                }
            } else {
                console.log('❌ Whisper creation: Failed');
                console.log(`   Response: ${response}`);
            }
            
        } catch (error) {
            console.log('❌ Whisper creation: Error');
            console.log(`   Error: ${error.message}`);
        }
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
}

// Run verification
if (require.main === module) {
    const verifier = new ServiceVerifier();
    
    verifier.runAllTests()
        .then(() => verifier.testWhisperCreation())
        .then(() => {
            console.log('\n✅ Verification complete');
        })
        .catch(error => {
            console.error('\n💀 Verification failed:', error);
            process.exit(1);
        });
}