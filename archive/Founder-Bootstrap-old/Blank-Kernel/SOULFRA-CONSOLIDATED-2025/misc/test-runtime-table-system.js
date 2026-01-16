#!/usr/bin/env node
/**
 * Comprehensive test for the Runtime Table and AI Cluster systems
 * Tests unified runtime logging and AI pattern analysis
 */

const http = require('http');

class RuntimeTableSystemTest {
    constructor() {
        this.backend = 'http://localhost:7777';
        this.testResults = [];
    }
    
    async runAllTests() {
        console.log('📊 Runtime Table & AI Cluster System Test');
        console.log('==========================================\n');
        
        try {
            // Test 1: Runtime Table Writer Status
            await this.testStep('Runtime Table Writer Status', async () => {
                const response = await this.makeRequest(`${this.backend}/api/runtime-table/status`);
                const data = JSON.parse(response);
                
                if (!data.stats || !data.columns) {
                    throw new Error('Runtime table status missing required fields');
                }
                
                return `Runtime table active: ${data.stats.entries_written} entries, ${data.stats.file_size_kb}KB`;
            });
            
            // Test 2: Log Different Entry Types
            await this.testStep('Log Runtime Entries', async () => {
                // Log a whisper
                const whisperData = {
                    whisper_origin: 'Test whisper for runtime table',
                    tone: 'curious',
                    agent: 'test_user',
                    source: 'runtime_test'
                };
                
                const whisperResponse = await this.makePostRequest(
                    `${this.backend}/api/runtime-table/log/whisper`, 
                    whisperData
                );
                const whisperResult = JSON.parse(whisperResponse);
                
                if (!whisperResult.success) {
                    throw new Error('Failed to log whisper entry');
                }
                
                // Log a loop
                const loopData = {
                    loop_id: 'test_loop_001',
                    emotional_tone: 'determined',
                    agent: 'cal',
                    source: 'runtime_test',
                    status: 'blessed'
                };
                
                const loopResponse = await this.makePostRequest(
                    `${this.backend}/api/runtime-table/log/loop`, 
                    loopData
                );
                const loopResult = JSON.parse(loopResponse);
                
                if (!loopResult.success) {
                    throw new Error('Failed to log loop entry');
                }
                
                return 'Successfully logged whisper and loop entries';
            });
            
            // Test 3: Retrieve Recent Entries
            await this.testStep('Retrieve Recent Entries', async () => {
                const response = await this.makeRequest(`${this.backend}/api/runtime-table/recent/5`);
                const data = JSON.parse(response);
                
                if (!data.entries || !Array.isArray(data.entries)) {
                    throw new Error('Recent entries response malformed');
                }
                
                return `Retrieved ${data.count} recent entries`;
            });
            
            // Test 4: Filter Entries by Type
            await this.testStep('Filter Entries by Type', async () => {
                const response = await this.makeRequest(`${this.backend}/api/runtime-table/type/whisper`);
                const data = JSON.parse(response);
                
                if (!data.entries || !Array.isArray(data.entries)) {
                    throw new Error('Type filtering response malformed');
                }
                
                return `Found ${data.count} whisper entries`;
            });
            
            // Test 5: AI Cluster Analysis
            await this.testStep('AI Cluster Analysis', async () => {
                // Force analysis
                const analysisResponse = await this.makePostRequest(`${this.backend}/api/ai-cluster/analyze`, {});
                const analysisResult = JSON.parse(analysisResponse);
                
                if (!analysisResult.success) {
                    throw new Error('AI cluster analysis failed');
                }
                
                // Get results
                const resultsResponse = await this.makeRequest(`${this.backend}/api/ai-cluster/analysis`);
                const resultsData = JSON.parse(resultsResponse);
                
                if (!resultsData.suggestions) {
                    throw new Error('AI analysis results missing suggestions');
                }
                
                const confidence = Math.round((resultsData.suggestions.confidence || 0) * 100);
                return `AI analysis complete: ${confidence}% confidence`;
            });
            
            // Test 6: AI Suggestions and Patterns
            await this.testStep('AI Suggestions and Patterns', async () => {
                const suggestionsResponse = await this.makeRequest(`${this.backend}/api/ai-cluster/suggestions`);
                const suggestions = JSON.parse(suggestionsResponse);
                
                const patternsResponse = await this.makeRequest(`${this.backend}/api/ai-cluster/patterns`);
                const patterns = JSON.parse(patternsResponse);
                
                if (!suggestions || !patterns) {
                    throw new Error('AI suggestions or patterns missing');
                }
                
                const suggestedLoops = suggestions.suggested_loops?.length || 0;
                const staleAgents = suggestions.stale_agents?.length || 0;
                
                return `AI insights: ${suggestedLoops} loop suggestions, ${staleAgents} stale agents detected`;
            });
            
            // Test 7: Enhanced Contextual Synthesis
            await this.testStep('Enhanced Contextual Synthesis', async () => {
                const response = await this.makeRequest(`${this.backend}/api/contextual/synthesis`);
                const data = JSON.parse(response);
                
                if (!data.runtime_state || !data.ai_analysis) {
                    throw new Error('Enhanced synthesis missing runtime or AI data');
                }
                
                const runtimeEntries = data.runtime_state.total_entries || 0;
                const aiConfidence = Math.round((data.ai_analysis.confidence || 0) * 100);
                const aiSuggestions = data.synthesis.ai_suggestions?.length || 0;
                
                return `Enhanced synthesis: ${runtimeEntries} runtime entries, ${aiConfidence}% AI confidence, ${aiSuggestions} AI suggestions`;
            });
            
            // Test 8: System Integration Status
            await this.testStep('System Integration Status', async () => {
                const response = await this.makeRequest(`${this.backend}/api/system/status`);
                const data = JSON.parse(response);
                
                const requiredComponents = [
                    'runtime_table_writer',
                    'ai_cluster_parser',
                    'file_classifier',
                    'intent_daemon',
                    'codebase_reflector'
                ];
                
                for (const component of requiredComponents) {
                    if (!data.components[component] || data.components[component].status !== 'active') {
                        throw new Error(`Component ${component} not active`);
                    }
                }
                
                const runtimeEntries = data.components.runtime_table_writer.entries_written || 0;
                const analysisRuns = data.components.ai_cluster_parser.analysis_runs || 0;
                
                return `All ${requiredComponents.length} components active: ${runtimeEntries} runtime entries, ${analysisRuns} AI analysis runs`;
            });
            
            // Test 9: End-to-End Workflow
            await this.testStep('End-to-End Workflow Test', async () => {
                // 1. Create a whisper via API
                const whisperResponse = await this.makePostRequest(`${this.backend}/api/whisper`, {
                    content: 'End-to-end test whisper for workflow validation',
                    tone: 'analytical'
                });
                const whisperResult = JSON.parse(whisperResponse);
                
                if (!whisperResult.success) {
                    throw new Error('Failed to create whisper via API');
                }
                
                // 2. Wait briefly for systems to process
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // 3. Check if whisper was logged to runtime table
                const recentResponse = await this.makeRequest(`${this.backend}/api/runtime-table/recent/3`);
                const recentData = JSON.parse(recentResponse);
                
                const hasTestWhisper = recentData.entries.some(entry => 
                    entry.type === 'whisper' && entry.tone === 'analytical'
                );
                
                if (!hasTestWhisper) {
                    throw new Error('Whisper not found in runtime table after API creation');
                }
                
                // 4. Force AI analysis
                await this.makePostRequest(`${this.backend}/api/ai-cluster/analyze`, {});
                
                // 5. Check contextual synthesis includes new data
                const synthesisResponse = await this.makeRequest(`${this.backend}/api/contextual/synthesis`);
                const synthesisData = JSON.parse(synthesisResponse);
                
                if (!synthesisData.runtime_state || synthesisData.runtime_state.total_entries === 0) {
                    throw new Error('Contextual synthesis not reflecting runtime activity');
                }
                
                return 'End-to-end workflow complete: whisper → runtime table → AI analysis → synthesis';
            });
            
            this.printSummary();
            
        } catch (error) {
            console.error('\n💀 Runtime Table System Test Failed:', error.message);
            this.printSummary();
            process.exit(1);
        }
    }
    
    async testStep(name, testFunction) {
        const startTime = Date.now();
        console.log(`📊 ${name}...`);
        
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
                timeout: 10000
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
        console.log('\n📊 Runtime Table System Test Summary');
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
            console.log('\n🎉 RUNTIME TABLE & AI CLUSTER SYSTEM FULLY OPERATIONAL!');
            console.log('✅ UnifiedRuntimeTableWriter - Logging all runtime activity');
            console.log('✅ AIClusterParserFromCSV - Analyzing patterns and generating suggestions');
            console.log('✅ Enhanced API Integration - All endpoints functional');
            console.log('✅ End-to-end workflow - Whisper → Runtime Table → AI Analysis → Synthesis');
            console.log('');
            console.log('🚀 AI Spreadsheet Loop system ready for production deployment!');
            console.log('📊 Access runtime table: http://localhost:7777/api/runtime-table/status');
            console.log('🧠 Access AI analysis: http://localhost:7777/api/ai-cluster/analysis');
        } else {
            console.log('\n💀 System not ready. Please address failures before production deployment.');
        }
    }
}

// Run test
if (require.main === module) {
    const test = new RuntimeTableSystemTest();
    test.runAllTests();
}

module.exports = RuntimeTableSystemTest;