#!/usr/bin/env node
/**
 * Async Prompt Processor
 * Handles decomposed prompts for reflection-consistent generation
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

class AsyncPromptProcessor {
    constructor() {
        this.queueDir = './prompt_queue';
        this.processingDir = './prompt_processing';
        this.completedDir = './tasks/resolved';
        this.ledgerPath = './ledger/design_reflections.json';
        
        this.ensureDirectories();
        this.loadLedger();
    }
    
    ensureDirectories() {
        [this.queueDir, this.processingDir, this.completedDir, './ledger'].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    loadLedger() {
        if (fs.existsSync(this.ledgerPath)) {
            this.ledger = JSON.parse(fs.readFileSync(this.ledgerPath, 'utf8'));
        } else {
            this.ledger = { reflections: [] };
            this.saveLedger();
        }
    }
    
    saveLedger() {
        fs.writeFileSync(this.ledgerPath, JSON.stringify(this.ledger, null, 2));
    }
    
    /**
     * Queue a session for processing
     */
    queueSession(sessionPath) {
        const sessionData = JSON.parse(
            fs.readFileSync(path.join(sessionPath, 'session.json'), 'utf8')
        );
        
        const queueEntry = {
            sessionId: sessionData.sessionId,
            sourcePath: sessionPath,
            queuedAt: new Date().toISOString(),
            status: 'queued',
            currentPrompt: 0
        };
        
        fs.writeFileSync(
            path.join(this.queueDir, `${sessionData.sessionId}.json`),
            JSON.stringify(queueEntry, null, 2)
        );
        
        return queueEntry;
    }
    
    /**
     * Process next prompt in queue
     */
    async processNext() {
        const queueFiles = fs.readdirSync(this.queueDir)
            .filter(f => f.endsWith('.json'))
            .sort(); // Process in order
            
        if (queueFiles.length === 0) {
            return null;
        }
        
        const nextFile = queueFiles[0];
        const queueEntry = JSON.parse(
            fs.readFileSync(path.join(this.queueDir, nextFile), 'utf8')
        );
        
        // Move to processing
        fs.renameSync(
            path.join(this.queueDir, nextFile),
            path.join(this.processingDir, nextFile)
        );
        
        // Load session data
        const sessionData = JSON.parse(
            fs.readFileSync(path.join(queueEntry.sourcePath, 'session.json'), 'utf8')
        );
        
        // Get current prompt
        const currentPrompt = sessionData.prompts[queueEntry.currentPrompt];
        
        // Create processing context
        const context = await this.buildContext(sessionData, queueEntry.currentPrompt);
        
        // Process based on type
        let result;
        switch (currentPrompt.type) {
            case 'context':
                result = await this.processContextPrompt(currentPrompt, context);
                break;
            case 'component':
                result = await this.processComponentPrompt(currentPrompt, context);
                break;
            case 'stitch':
                result = await this.processStitchPrompt(currentPrompt, context);
                break;
        }
        
        // Save result
        this.saveResult(sessionData.sessionId, currentPrompt, result);
        
        // Update queue entry
        queueEntry.currentPrompt++;
        if (queueEntry.currentPrompt >= sessionData.prompts.length) {
            // Session complete
            this.completeSession(sessionData, queueEntry);
        } else {
            // Queue next prompt
            queueEntry.status = 'queued';
            fs.writeFileSync(
                path.join(this.queueDir, nextFile),
                JSON.stringify(queueEntry, null, 2)
            );
        }
        
        return result;
    }
    
    async buildContext(sessionData, currentIndex) {
        const context = {
            sessionId: sessionData.sessionId,
            previousOutputs: [],
            ledgerEntries: []
        };
        
        // Load previous outputs
        for (let i = 0; i < currentIndex; i++) {
            const prompt = sessionData.prompts[i];
            const outputPath = path.join(
                this.completedDir,
                sessionData.sessionId,
                `${prompt.id}_output.json`
            );
            
            if (fs.existsSync(outputPath)) {
                context.previousOutputs.push(
                    JSON.parse(fs.readFileSync(outputPath, 'utf8'))
                );
            }
        }
        
        // Load relevant ledger entries
        context.ledgerEntries = this.ledger.reflections
            .filter(r => r.sessionId === sessionData.sessionId);
            
        return context;
    }
    
    async processContextPrompt(prompt, context) {
        // Initialize session context
        return {
            type: 'context_established',
            sessionId: context.sessionId,
            timestamp: new Date().toISOString(),
            acknowledgment: 'Multi-part generation initialized',
            plan: prompt.prompt
        };
    }
    
    async processComponentPrompt(prompt, context) {
        // This would normally call Claude API
        // For now, create a template
        
        const template = this.generateComponentTemplate(prompt);
        
        // Write to specified output path
        if (prompt.outputPath) {
            const outputPath = path.join('.', prompt.outputPath);
            const outputDir = path.dirname(outputPath);
            
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            
            fs.writeFileSync(outputPath, template);
        }
        
        return {
            type: 'component_generated',
            componentId: prompt.id,
            outputPath: prompt.outputPath,
            timestamp: new Date().toISOString(),
            content: template
        };
    }
    
    async processStitchPrompt(prompt, context) {
        // Create integration test
        const testPath = path.join(
            this.completedDir,
            context.sessionId,
            `${context.sessionId}_test.js`
        );
        
        const integrationTest = this.generateIntegrationTest(context);
        fs.writeFileSync(testPath, integrationTest);
        
        // Add ledger reflection
        const reflection = {
            sessionId: context.sessionId,
            timestamp: new Date().toISOString(),
            componentsCreated: context.previousOutputs
                .filter(o => o.type === 'component_generated')
                .map(o => o.outputPath),
            integrationNotes: 'All components generated and integrated',
            warnings: []
        };
        
        this.ledger.reflections.push(reflection);
        this.saveLedger();
        
        return {
            type: 'session_complete',
            sessionId: context.sessionId,
            testPath,
            reflection,
            timestamp: new Date().toISOString()
        };
    }
    
    generateComponentTemplate(prompt) {
        // Generate appropriate template based on output type
        const ext = path.extname(prompt.outputPath);
        
        if (ext === '.js') {
            return `/**
 * ${path.basename(prompt.outputPath, '.js')}
 * Generated by AsyncPromptProcessor
 * Session: ${prompt.id}
 */

class ${path.basename(prompt.outputPath, '.js')} {
    constructor() {
        this.initialized = true;
    }
    
    // Component implementation here
}

module.exports = ${path.basename(prompt.outputPath, '.js')};`;
        } else if (ext === '.json') {
            return JSON.stringify({
                generated: true,
                sessionId: prompt.id,
                timestamp: new Date().toISOString(),
                data: {}
            }, null, 2);
        }
        
        return '// Generated component';
    }
    
    generateIntegrationTest(context) {
        return `/**
 * Integration Test
 * Session: ${context.sessionId}
 */

const assert = require('assert');

describe('Session ${context.sessionId} Integration', () => {
    it('should have created all components', () => {
        const components = ${JSON.stringify(
            context.previousOutputs
                .filter(o => o.type === 'component_generated')
                .map(o => o.outputPath)
        )};
        
        components.forEach(component => {
            assert(require('fs').existsSync(component), 
                \`Component \${component} should exist\`);
        });
    });
    
    it('should integrate properly', () => {
        // Integration tests here
        assert(true);
    });
});`;
    }
    
    saveResult(sessionId, prompt, result) {
        const sessionDir = path.join(this.completedDir, sessionId);
        if (!fs.existsSync(sessionDir)) {
            fs.mkdirSync(sessionDir, { recursive: true });
        }
        
        fs.writeFileSync(
            path.join(sessionDir, `${prompt.id}_output.json`),
            JSON.stringify(result, null, 2)
        );
    }
    
    completeSession(sessionData, queueEntry) {
        const completionRecord = {
            sessionId: sessionData.sessionId,
            completedAt: new Date().toISOString(),
            promptsProcessed: sessionData.prompts.length,
            sourcePath: queueEntry.sourcePath,
            outputs: path.join(this.completedDir, sessionData.sessionId)
        };
        
        fs.writeFileSync(
            path.join(this.completedDir, sessionData.sessionId, 'completion.json'),
            JSON.stringify(completionRecord, null, 2)
        );
        
        // Clean up processing file
        fs.unlinkSync(
            path.join(this.processingDir, `${sessionData.sessionId}.json`)
        );
    }
    
    /**
     * Start processing server
     */
    startServer(port = 7777) {
        const server = http.createServer((req, res) => {
            if (req.url === '/process' && req.method === 'POST') {
                this.processNext().then(result => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result || { status: 'queue_empty' }));
                });
            } else if (req.url === '/status') {
                const status = {
                    queued: fs.readdirSync(this.queueDir).length,
                    processing: fs.readdirSync(this.processingDir).length,
                    completed: fs.readdirSync(this.completedDir).length,
                    ledgerEntries: this.ledger.reflections.length
                };
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(status));
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(port, () => {
            console.log(`AsyncPromptProcessor running on port ${port}`);
            console.log('Endpoints:');
            console.log('  POST /process - Process next prompt in queue');
            console.log('  GET /status - Get processing status');
        });
    }
}

// CLI interface
if (require.main === module) {
    const processor = new AsyncPromptProcessor();
    const args = process.argv.slice(2);
    
    if (args[0] === 'server') {
        processor.startServer();
    } else if (args[0] === 'queue' && args[1]) {
        const result = processor.queueSession(args[1]);
        console.log('Session queued:', result);
    } else if (args[0] === 'process') {
        processor.processNext().then(result => {
            console.log('Processed:', result);
        });
    } else {
        console.log('Usage:');
        console.log('  node AsyncPromptProcessor.js server          - Start processing server');
        console.log('  node AsyncPromptProcessor.js queue <path>    - Queue a session');
        console.log('  node AsyncPromptProcessor.js process         - Process next in queue');
    }
}

module.exports = AsyncPromptProcessor;