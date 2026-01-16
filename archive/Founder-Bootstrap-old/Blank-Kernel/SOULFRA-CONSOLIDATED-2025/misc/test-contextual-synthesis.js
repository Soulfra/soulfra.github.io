#!/usr/bin/env node
/**
 * Test script for the complete contextual synthesis system
 * Verifies all three phases are working together
 */

const http = require('http');

class ContextualSynthesisTest {
    constructor() {
        this.backend = 'http://localhost:7777';
        this.testResults = [];
    }
    
    async runAllTests() {
        console.log('🔮 Contextual Synthesis System Test');
        console.log('===================================\n');
        
        try {
            // Test Phase 1: File Context Classifier
            await this.testStep('Phase 1: File Context Classifier', async () => {
                const response = await this.makeRequest(`${this.backend}/api/classifier/status`);
                const data = JSON.parse(response);
                
                if (!data.total_files || data.total_files === 0) {
                    throw new Error('No files classified yet');
                }
                
                return `${data.total_files} files classified across ${Object.keys(data.type_distribution || {}).length} types`;
            });
            
            // Test Phase 2: Intent Inference Daemon
            await this.testStep('Phase 2: Intent Inference Daemon', async () => {
                const response = await this.makeRequest(`${this.backend}/api/intent/current`);
                const data = JSON.parse(response);
                
                if (data.message && data.message.includes('No intent')) {
                    return 'Intent daemon active, no intent detected yet (expected initially)';
                }
                
                if (!data.intent) {
                    throw new Error('Intent daemon not functioning properly');
                }
                
                const confidence = Math.round((data.confidence || 0) * 100);
                return `Intent detected: "${data.intent}" (${confidence}% confidence)`;
            });
            
            // Test Phase 3: Codebase Reflector
            await this.testStep('Phase 3: Codebase Reflector', async () => {
                const response = await this.makeRequest(`${this.backend}/api/codebase/summary`);
                const data = JSON.parse(response);
                
                if (!data.summary || !data.summary.total_files) {
                    throw new Error('Codebase not scanned yet');
                }
                
                const totalFiles = data.summary.total_files;
                const fileTypes = Object.keys(data.summary.file_types || {}).length;
                
                return `${totalFiles} files scanned, ${fileTypes} file types identified`;
            });
            
            // Test Integration: Contextual Synthesis
            await this.testStep('Integration: Contextual Synthesis', async () => {
                const response = await this.makeRequest(`${this.backend}/api/contextual/synthesis`);
                const data = JSON.parse(response);
                
                if (!data.synthesis) {
                    throw new Error('Synthesis data missing');
                }
                
                const synthesis = data.synthesis;
                const confidence = Math.round((synthesis.confidence || 0) * 100);
                const nextSteps = synthesis.next_steps?.length || 0;
                
                return `Synthesis complete: "${synthesis.what_youre_building}" (${confidence}% confidence, ${nextSteps} recommendations)`;
            });
            
            // Test Individual Components
            await this.testStep('File Classification Types', async () => {
                const response = await this.makeRequest(`${this.backend}/api/classifier/status`);
                const data = JSON.parse(response);
                
                const types = Object.keys(data.type_distribution || {});
                if (types.length === 0) {
                    throw new Error('No file types detected');
                }
                
                const topType = types.reduce((a, b) => 
                    (data.type_distribution[a] || 0) > (data.type_distribution[b] || 0) ? a : b
                );
                
                return `${types.length} file types detected, most common: ${topType} (${data.type_distribution[topType]} files)`;
            });
            
            // Test Recommendations
            await this.testStep('Codebase Recommendations', async () => {
                const response = await this.makeRequest(`${this.backend}/api/codebase/recommendations`);
                const recommendations = JSON.parse(response);
                
                if (!Array.isArray(recommendations)) {
                    throw new Error('Recommendations not in expected format');
                }
                
                const highPriority = recommendations.filter(r => r.priority === 'high').length;
                const total = recommendations.length;
                
                return `${total} recommendations generated (${highPriority} high priority)`;
            });
            
            // Test Intent History
            await this.testStep('Intent History Tracking', async () => {
                const response = await this.makeRequest(`${this.backend}/api/intent/history`);
                const history = JSON.parse(response);
                
                if (!Array.isArray(history)) {
                    throw new Error('Intent history not in expected format');
                }
                
                return `Intent history tracking: ${history.length} previous inferences recorded`;
            });
            
            // Test System Integration
            await this.testStep('System Integration Status', async () => {
                const response = await this.makeRequest(`${this.backend}/api/system/status`);
                const data = JSON.parse(response);
                
                const components = ['file_classifier', 'intent_daemon', 'codebase_reflector'];
                for (const component of components) {
                    if (!data.components[component] || data.components[component].status !== 'active') {
                        throw new Error(`Component ${component} not active`);
                    }
                }
                
                return `All 3 contextual synthesis components integrated and active`;
            });
            
            this.printSummary();
            
        } catch (error) {
            console.error('\n💀 Contextual Synthesis Test Failed:', error.message);
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
                timeout: 10000
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
    
    printSummary() {
        console.log('\n📊 Contextual Synthesis Test Summary');
        console.log('====================================');
        
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
            console.log('\n🎉 CONTEXTUAL SYNTHESIS SYSTEM FULLY OPERATIONAL!');
            console.log('✅ Phase 1: FileContextClassifier - Auto-classifying files');
            console.log('✅ Phase 2: IntentInferenceDaemon - Detecting user intent');
            console.log('✅ Phase 3: CodebaseReflector - Scanning and analyzing codebase');
            console.log('✅ Integration: Contextual synthesis between file state, intent, and code analysis');
            console.log('');
            console.log('🚀 The system now understands "What Are You Trying to Build?" from multiple data sources!');
            console.log('📊 Access contextual synthesis at: http://localhost:7777/api/contextual/synthesis');
        } else {
            console.log('\n💀 System not ready. Please address failures before deployment.');
        }
    }
}

// Run test
if (require.main === module) {
    const test = new ContextualSynthesisTest();
    test.runAllTests();
}

module.exports = ContextualSynthesisTest;