// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * ClaudeTestRunner.js
 * Runs Claude prompts from queue, logs responses, links them to loops/agents
 * Integrates with existing CLAUDE_BRIDGE and TestPromptQueue
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const EventEmitter = require('events');
const TestPromptQueue = require('./TestPromptQueue');

class ClaudeTestRunner extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.claudeApiUrl = options.claudeApiUrl || 'http://localhost:7777';
        this.pollInterval = options.pollInterval || 5000; // 5 seconds
        this.running = false;
        this.currentTest = null;
        
        // Initialize queue
        this.queue = new TestPromptQueue({
            queueDir: './queue/claude-tests',
            processedDir: './queue/claude-tests/processed',
            failedDir: './queue/claude-tests/failed'
        });
        
        // Results tracking
        this.resultsDir = './results/claude-tests';
        this.logsDir = './logs/claude-tests';
        this.linkageDir = './memory/claude-linkage';
        
        this.stats = {
            tests_run: 0,
            tests_passed: 0,
            tests_failed: 0,
            avg_response_time: 0,
            loops_created: 0,
            agents_linked: 0,
            last_run: null
        };
        
        this.initializeRunner();
    }

    async initializeRunner() {
        console.log('🧪 Initializing Claude Test Runner...');
        
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Load stats
            await this.loadStats();
            
            // Setup queue event handlers
            this.setupQueueHandlers();
            
            console.log('✅ Claude Test Runner initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('💀 Runner initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async ensureDirectories() {
        const dirs = [this.resultsDir, this.logsDir, this.linkageDir];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Created directory: ${dir}`);
            }
        }
    }

    async loadStats() {
        const statsFile = path.join(this.logsDir, '.runner-stats.json');
        
        if (fs.existsSync(statsFile)) {
            try {
                const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
                this.stats = { ...this.stats, ...stats };
                console.log(`📊 Loaded runner stats: ${this.stats.tests_run} tests run`);
            } catch (error) {
                console.warn('⚠️ Failed to load runner stats, starting fresh');
            }
        }
    }

    async saveStats() {
        const statsFile = path.join(this.logsDir, '.runner-stats.json');
        const statsData = {
            ...this.stats,
            timestamp: new Date().toISOString()
        };
        
        try {
            fs.writeFileSync(statsFile, JSON.stringify(statsData, null, 2));
        } catch (error) {
            console.error('Failed to save runner stats:', error.message);
        }
    }

    setupQueueHandlers() {
        this.queue.on('prompt-added', (prompt) => {
            console.log(`📝 New test prompt queued: ${prompt.metadata.title || prompt.file}`);
            if (!this.running) {
                this.startRunner();
            }
        });
        
        this.queue.on('prompt-processing', (prompt) => {
            console.log(`▶️ Processing test: ${prompt.metadata.title || prompt.file}`);
        });
        
        this.queue.on('prompt-completed', (prompt) => {
            console.log(`✅ Test completed: ${prompt.metadata.title || prompt.file}`);
        });
        
        this.queue.on('prompt-failed', (prompt) => {
            console.log(`❌ Test failed: ${prompt.metadata.title || prompt.file}`);
        });
    }

    // Main runner loop
    async startRunner() {
        if (this.running) {
            console.log('🔄 Runner already running');
            return;
        }
        
        this.running = true;
        console.log('🚀 Starting Claude Test Runner...');
        
        while (this.running) {
            try {
                const nextPrompt = this.queue.getNextPrompt();
                
                if (nextPrompt) {
                    await this.processPrompt(nextPrompt);
                } else {
                    // No prompts to process, wait
                    await this.sleep(this.pollInterval);
                }
                
            } catch (error) {
                console.error('Runner error:', error.message);
                await this.sleep(this.pollInterval);
            }
        }
        
        console.log('⏹️ Claude Test Runner stopped');
    }

    async stopRunner() {
        console.log('🛑 Stopping Claude Test Runner...');
        this.running = false;
        
        if (this.currentTest) {
            console.log('⏳ Waiting for current test to complete...');
            // Wait for current test to finish
            while (this.currentTest) {
                await this.sleep(1000);
            }
        }
    }

    async processPrompt(promptItem) {
        this.currentTest = promptItem;
        const startTime = Date.now();
        
        try {
            // Mark as processing
            this.queue.markPromptProcessing(promptItem);
            
            // Create test session
            const testSession = this.createTestSession(promptItem);
            
            // Execute Claude test
            const claudeResponse = await this.executeClaude(promptItem, testSession);
            
            // Process and analyze response
            const analysis = await this.analyzeResponse(claudeResponse, promptItem);
            
            // Create linkages to loops/agents
            const linkages = await this.createLinkages(analysis, promptItem);
            
            // Save results
            const result = {
                session: testSession,
                response: claudeResponse,
                analysis: analysis,
                linkages: linkages,
                response_time: Date.now() - startTime,
                timestamp: new Date().toISOString()
            };
            
            await this.saveTestResult(promptItem, result);
            
            // Mark as completed
            await this.queue.markPromptCompleted(promptItem, result);
            
            // Update stats
            this.updateStats(result, true);
            
            this.emit('test-completed', { prompt: promptItem, result });
            
        } catch (error) {
            console.error(`Test execution failed: ${error.message}`);
            
            await this.queue.markPromptFailed(promptItem, error);
            this.updateStats({ response_time: Date.now() - startTime }, false);
            
            this.emit('test-failed', { prompt: promptItem, error });
            
        } finally {
            this.currentTest = null;
        }
    }

    createTestSession(promptItem) {
        return {
            id: `test_${Date.now()}_${promptItem.id}`,
            prompt_id: promptItem.id,
            prompt_file: promptItem.file,
            title: promptItem.metadata.title || 'Untitled Test',
            description: promptItem.metadata.description || '',
            priority: promptItem.priority,
            tags: promptItem.metadata.tags ? promptItem.metadata.tags.split(',') : [],
            timeout: parseInt(promptItem.metadata.timeout) || 30000,
            expected_output: promptItem.metadata.expected_output || 'text',
            created_at: new Date().toISOString()
        };
    }

    async executeClaude(promptItem, testSession) {
        console.log(`🤖 Executing Claude test: ${testSession.title}`);
        
        // Prepare Claude request
        const claudeRequest = {
            prompt: promptItem.content,
            context: {
                session_id: testSession.id,
                test_metadata: promptItem.metadata,
                system_context: await this.getSystemContext()
            },
            timeout: testSession.timeout
        };
        
        // Send to Claude via existing bridge
        const response = await this.sendToClaudeBridge(claudeRequest);
        
        return {
            request: claudeRequest,
            response: response,
            timestamp: new Date().toISOString(),
            success: !!response.content
        };
    }

    async sendToClaudeBridge(request) {
        return new Promise((resolve, reject) => {
            const postData = JSON.stringify(request);
            
            const options = {
                hostname: 'localhost',
                port: 7777,
                path: '/api/claude/execute',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                },
                timeout: request.timeout || 30000
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (error) {
                        reject(new Error(`Invalid JSON response: ${data}`));
                    }
                });
            });
            
            req.on('error', (error) => {
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Claude request timeout'));
            });
            
            req.write(postData);
            req.end();
        });
    }

    async getSystemContext() {
        // Gather current system state for Claude
        return {
            timestamp: new Date().toISOString(),
            active_loops: await this.getActiveLoops(),
            blessed_agents: await this.getBlessedAgents(),
            system_health: await this.getSystemHealth(),
            recent_activity: await this.getRecentActivity()
        };
    }

    async getActiveLoops() {
        // TODO: Integrate with loop system
        return [];
    }

    async getBlessedAgents() {
        // TODO: Integrate with blessing system
        return [];
    }

    async getSystemHealth() {
        // TODO: Integrate with monitoring system
        return { status: 'unknown' };
    }

    async getRecentActivity() {
        // TODO: Integrate with activity logs
        return [];
    }

    async analyzeResponse(claudeResponse, promptItem) {
        const analysis = {
            success: claudeResponse.success,
            response_length: claudeResponse.response?.content?.length || 0,
            contains_code: /```/.test(claudeResponse.response?.content || ''),
            contains_json: /{.*}/.test(claudeResponse.response?.content || ''),
            sentiment: this.analyzeSentiment(claudeResponse.response?.content || ''),
            keywords: this.extractKeywords(claudeResponse.response?.content || ''),
            suggested_actions: this.suggestActions(claudeResponse.response?.content || ''),
            quality_score: this.calculateQualityScore(claudeResponse.response?.content || '')
        };
        
        return analysis;
    }

    analyzeSentiment(content) {
        // Simple sentiment analysis
        const positiveWords = ['good', 'great', 'excellent', 'success', 'working', 'correct'];
        const negativeWords = ['error', 'fail', 'problem', 'issue', 'wrong', 'bad'];
        
        const words = content.toLowerCase().split(/\W+/);
        const positiveCount = words.filter(word => positiveWords.includes(word)).length;
        const negativeCount = words.filter(word => negativeWords.includes(word)).length;
        
        if (positiveCount > negativeCount) return 'positive';
        if (negativeCount > positiveCount) return 'negative';
        return 'neutral';
    }

    extractKeywords(content) {
        // Extract potential keywords/topics
        const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const frequency = {};
        
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }

    suggestActions(content) {
        const actions = [];
        
        if (content.includes('loop') || content.includes('create')) {
            actions.push('create_loop');
        }
        if (content.includes('agent') || content.includes('spawn')) {
            actions.push('create_agent');
        }
        if (content.includes('bless') || content.includes('approve')) {
            actions.push('request_blessing');
        }
        if (content.includes('error') || content.includes('fix')) {
            actions.push('investigate_issue');
        }
        
        return actions;
    }

    calculateQualityScore(content) {
        let score = 50; // Base score
        
        // Length bonus
        if (content.length > 100) score += 10;
        if (content.length > 500) score += 10;
        
        // Structure bonus
        if (content.includes('\n')) score += 5;
        if (/^#/.test(content)) score += 5; // Has headings
        if (content.includes('```')) score += 10; // Has code blocks
        
        // Content quality
        if (content.includes('because') || content.includes('since')) score += 5; // Explanatory
        if (content.match(/\d+/)) score += 5; // Has numbers/data
        
        return Math.min(100, Math.max(0, score));
    }

    async createLinkages(analysis, promptItem) {
        const linkages = {
            loops: [],
            agents: [],
            blessings: []
        };
        
        // Suggest loop creation if appropriate
        if (analysis.suggested_actions.includes('create_loop')) {
            linkages.loops.push({
                type: 'suggested',
                reason: 'Claude response suggests loop creation',
                metadata: {
                    prompt_id: promptItem.id,
                    keywords: analysis.keywords.slice(0, 3)
                }
            });
        }
        
        // Suggest agent creation if appropriate
        if (analysis.suggested_actions.includes('create_agent')) {
            linkages.agents.push({
                type: 'suggested',
                reason: 'Claude response suggests agent creation',
                metadata: {
                    prompt_id: promptItem.id,
                    sentiment: analysis.sentiment
                }
            });
        }
        
        // Save linkage data
        const linkageFile = path.join(this.linkageDir, `${promptItem.id}_linkages.json`);
        fs.writeFileSync(linkageFile, JSON.stringify(linkages, null, 2));
        
        return linkages;
    }

    async saveTestResult(promptItem, result) {
        const resultFile = path.join(this.resultsDir, `${promptItem.id}_result.json`);
        const logFile = path.join(this.logsDir, `${promptItem.id}_log.txt`);
        
        // Save detailed result
        fs.writeFileSync(resultFile, JSON.stringify(result, null, 2));
        
        // Save human-readable log
        const logContent = this.generateTestLog(promptItem, result);
        fs.writeFileSync(logFile, logContent);
        
        console.log(`💾 Saved test result: ${resultFile}`);
    }

    generateTestLog(promptItem, result) {
        return `
# Claude Test Log: ${promptItem.metadata.title || promptItem.file}

## Test Details
- ID: ${promptItem.id}
- File: ${promptItem.file}
- Priority: ${promptItem.priority}
- Created: ${promptItem.created_at}
- Response Time: ${result.response_time}ms

## Prompt
${promptItem.content}

## Claude Response
${result.response.response?.content || 'No response'}

## Analysis
- Success: ${result.analysis.success}
- Sentiment: ${result.analysis.sentiment}
- Quality Score: ${result.analysis.quality_score}/100
- Keywords: ${result.analysis.keywords.join(', ')}
- Suggested Actions: ${result.analysis.suggested_actions.join(', ')}

## Linkages
- Loops: ${result.linkages.loops.length}
- Agents: ${result.linkages.agents.length}
- Blessings: ${result.linkages.blessings.length}

Generated at: ${result.timestamp}
`;
    }

    updateStats(result, success) {
        this.stats.tests_run++;
        this.stats.last_run = new Date().toISOString();
        
        if (success) {
            this.stats.tests_passed++;
            this.stats.loops_created += result.linkages.loops.length;
            this.stats.agents_linked += result.linkages.agents.length;
        } else {
            this.stats.tests_failed++;
        }
        
        // Update average response time
        if (result.response_time) {
            this.stats.avg_response_time = this.stats.avg_response_time
                ? (this.stats.avg_response_time + result.response_time) / 2
                : result.response_time;
        }
        
        this.saveStats();
    }

    // Utility methods
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    getRunnerStatus() {
        return {
            running: this.running,
            current_test: this.currentTest ? {
                id: this.currentTest.id,
                file: this.currentTest.file,
                title: this.currentTest.metadata.title
            } : null,
            stats: this.stats,
            queue_status: this.queue.getQueueStatus()
        };
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Claude Test Runner...');
        await this.stopRunner();
        await this.saveStats();
        this.queue.cleanup();
        this.removeAllListeners();
    }
}

module.exports = ClaudeTestRunner;

// CLI execution
if (require.main === module) {
    const runner = new ClaudeTestRunner();
    
    runner.on('initialized', () => {
        console.log('Runner initialized, starting...');
        runner.startRunner();
    });
    
    runner.on('test-completed', (data) => {
        console.log(`Test completed: ${data.prompt.metadata.title}`);
    });
    
    runner.on('error', (error) => {
        console.error('Runner error:', error.message);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down...');
        await runner.cleanup();
        process.exit(0);
    });
}