// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * Cal Drop Orchestrator
 * Unified system bringing together file processing, Git tracking, and duels
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const http = require('http');

// Import our components
const IntentRouter = require('./cal-drop/IntentRouter');
const ReflectiveGitCommitter = require('./git-loop/ReflectiveGitCommitter');
const DuelEngineCore = require('./duel/DuelEngineCore');

// Import from previous implementation
const VectorIndexerDaemon = require('./mcp/VectorIndexerDaemon');

class CalDropOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        // Initialize components
        this.intentRouter = new IntentRouter();
        this.gitCommitter = new ReflectiveGitCommitter();
        this.duelEngine = new DuelEngineCore();
        this.vectorIndexer = new VectorIndexerDaemon();
        
        // API port
        this.port = 7893;
        
        // Stats tracking
        this.stats = {
            files_processed: 0,
            commits_created: 0,
            duels_created: 0,
            loops_active: new Map()
        };
        
        // Loop tracking
        this.activeLoops = new Map();
        
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        // Intent Router events
        this.intentRouter.on('file_routed', (fileInfo) => {
            this.handleRoutedFile(fileInfo);
        });
        
        // Process markdown files
        this.intentRouter.on('process_markdown', (fileInfo) => {
            this.processMarkdown(fileInfo);
        });
        
        // Process JavaScript files
        this.intentRouter.on('process_javascript', (fileInfo) => {
            this.processJavaScript(fileInfo);
        });
        
        // Process JSON files
        this.intentRouter.on('process_json', (fileInfo) => {
            this.processJson(fileInfo);
        });
        
        // Git Committer events
        this.gitCommitter.on('commit_created', (commitInfo) => {
            this.handleCommitCreated(commitInfo);
        });
        
        // Duel Engine events
        this.duelEngine.on('duel_created', (duel) => {
            this.handleDuelCreated(duel);
        });
        
        this.duelEngine.on('duel_resolved', (resolution) => {
            this.handleDuelResolved(resolution);
        });
    }
    
    async start() {
        console.log('🎭 Cal Drop Orchestrator starting...');
        console.log('=====================================');
        
        // Start components
        console.log('Starting Intent Router...');
        this.intentRouter.start();
        
        console.log('Starting Vector Indexer...');
        this.vectorIndexer.start();
        
        console.log('Starting API server...');
        this.startAPI();
        
        console.log('\n✨ Cal Drop Orchestrator ready!');
        console.log(`Drop files in: ${path.join(__dirname, 'cal-drop/incoming/')}`);
        console.log(`API: http://localhost:${this.port}`);
        console.log('=====================================\n');
    }
    
    handleRoutedFile(fileInfo) {
        this.stats.files_processed++;
        
        // Check if this is part of a loop
        const loopId = this.detectLoopFromFile(fileInfo);
        if (loopId) {
            this.updateLoop(loopId, fileInfo);
        }
        
        // Index the file
        this.vectorIndexer.indexDocument({
            path: fileInfo.filepath,
            content: this.readFileContent(fileInfo),
            type: fileInfo.route_type,
            metadata: {
                intent: fileInfo.intent,
                loop_id: loopId
            }
        });
    }
    
    async processMarkdown(fileInfo) {
        console.log(`\n📝 Processing Markdown: ${fileInfo.filename}`);
        
        const content = fs.readFileSync(fileInfo.filepath, 'utf8');
        
        // Detect if this is a PRD
        if (fileInfo.intent === 'prd' || fileInfo.filename.includes('PRD')) {
            await this.processPRD(fileInfo, content);
        } else {
            // General markdown processing
            await this.processGeneralMarkdown(fileInfo, content);
        }
        
        // Create reflective commit
        await this.createFileCommit([fileInfo.filepath], {
            tone: 'curious',
            type: 'markdown_processed'
        });
    }
    
    async processPRD(fileInfo, content) {
        console.log('  → Detected PRD, preparing for Claude processing...');
        
        // Extract title and key sections
        const title = this.extractPRDTitle(content);
        const sections = this.extractPRDSections(content);
        
        // Create a loop for this PRD
        const loopId = this.createLoop({
            type: 'prd_implementation',
            source_file: fileInfo.filename,
            title,
            sections,
            status: 'analyzing'
        });
        
        // Create a duel on PRD implementation success
        const duel = this.duelEngine.createDuel({
            target_type: 'prd_implementation',
            target_id: loopId,
            target_description: `Will PRD "${title}" be successfully implemented?`,
            outcomes: ['full_success', 'partial_success', 'failed'],
            creator: 'orchestrator',
            initial_prediction: 'partial_success',
            initial_stake: 1000,
            confidence: 0.6
        });
        
        console.log(`  → Created loop: ${loopId}`);
        console.log(`  → Created duel: ${duel.duel_id}`);
        
        // Queue for Claude processing
        this.queueForClaude(fileInfo, loopId);
    }
    
    async processJavaScript(fileInfo) {
        console.log(`\n🔧 Processing JavaScript: ${fileInfo.filename}`);
        
        // Analyze the code
        const content = fs.readFileSync(fileInfo.filepath, 'utf8');
        const analysis = this.analyzeJavaScript(content);
        
        // If it's a daemon, track it
        if (fileInfo.intent === 'daemon' || analysis.isDaemon) {
            this.trackDaemon(fileInfo, analysis);
        }
        
        // Create commit with appropriate tone
        const tone = analysis.isTest ? 'confident' : 'excited';
        await this.createFileCommit([fileInfo.filepath], {
            tone,
            type: 'code_added',
            analysis
        });
    }
    
    async processJson(fileInfo) {
        console.log(`\n📊 Processing JSON: ${fileInfo.filename}`);
        
        const content = JSON.parse(fs.readFileSync(fileInfo.filepath, 'utf8'));
        
        // Check if it's a tone map
        if (fileInfo.intent === 'tone' || fileInfo.filename.includes('tone')) {
            await this.processToneMap(fileInfo, content);
        }
        
        // Create commit
        await this.createFileCommit([fileInfo.filepath], {
            tone: 'harmonious',
            type: 'config_update'
        });
    }
    
    detectLoopFromFile(fileInfo) {
        // Check filename for loop references
        const match = fileInfo.filename.match(/loop[_-]?(\w+)/i);
        if (match) return match[1];
        
        // Check if file is in a loop directory
        const pathParts = fileInfo.filepath.split('/');
        const loopIndex = pathParts.findIndex(p => p.includes('loop'));
        if (loopIndex !== -1) {
            return pathParts[loopIndex];
        }
        
        return null;
    }
    
    createLoop(params) {
        const loopId = `loop_${Date.now()}_${params.type}`;
        
        const loop = {
            id: loopId,
            created_at: new Date().toISOString(),
            type: params.type,
            status: params.status || 'active',
            source: params.source_file,
            metadata: params,
            events: [{
                timestamp: new Date().toISOString(),
                event: 'loop_created',
                data: params
            }]
        };
        
        this.activeLoops.set(loopId, loop);
        this.stats.loops_active.set(loopId, loop);
        
        // Save loop
        const loopDir = path.join(__dirname, 'loops/active', loopId);
        fs.mkdirSync(loopDir, { recursive: true });
        fs.writeFileSync(
            path.join(loopDir, 'loop.json'),
            JSON.stringify(loop, null, 2)
        );
        
        return loopId;
    }
    
    updateLoop(loopId, event) {
        const loop = this.activeLoops.get(loopId);
        if (!loop) return;
        
        loop.events.push({
            timestamp: new Date().toISOString(),
            event: event.type || 'update',
            data: event
        });
        
        // Save updated loop
        const loopPath = path.join(__dirname, 'loops/active', loopId, 'loop.json');
        fs.writeFileSync(loopPath, JSON.stringify(loop, null, 2));
    }
    
    async createFileCommit(files, context) {
        try {
            const commitHash = await this.gitCommitter.createReflectiveCommit(files, context);
            this.stats.commits_created++;
            return commitHash;
        } catch (err) {
            console.error('Commit failed:', err);
            return null;
        }
    }
    
    handleCommitCreated(commitInfo) {
        console.log(`\n🔗 Commit created: ${commitInfo.hash.substring(0, 7)}`);
        
        // Update related loops
        commitInfo.loops.forEach(loop => {
            this.updateLoop(loop.id, {
                type: 'commit_created',
                commit: commitInfo.hash,
                tone: commitInfo.tone
            });
        });
    }
    
    handleDuelCreated(duel) {
        this.stats.duels_created++;
        console.log(`\n⚔️  Duel created: ${duel.duel_id}`);
    }
    
    handleDuelResolved(resolution) {
        console.log(`\n🏁 Duel resolved: ${resolution.duel_id} → ${resolution.outcome}`);
        
        // Update related loop if exists
        const duel = this.duelEngine.getDuel(resolution.duel_id);
        if (duel && duel.target_type === 'prd_implementation') {
            this.updateLoop(duel.target_id, {
                type: 'duel_resolved',
                outcome: resolution.outcome,
                payouts: resolution.payouts
            });
        }
    }
    
    readFileContent(fileInfo) {
        try {
            return fs.readFileSync(fileInfo.filepath, 'utf8');
        } catch (err) {
            return '';
        }
    }
    
    extractPRDTitle(content) {
        const match = content.match(/^#\s+(.+)$/m);
        return match ? match[1] : 'Untitled PRD';
    }
    
    extractPRDSections(content) {
        const sections = [];
        const lines = content.split('\n');
        let currentSection = null;
        
        lines.forEach(line => {
            if (line.startsWith('## ')) {
                if (currentSection) sections.push(currentSection);
                currentSection = {
                    title: line.substring(3),
                    content: []
                };
            } else if (currentSection) {
                currentSection.content.push(line);
            }
        });
        
        if (currentSection) sections.push(currentSection);
        return sections;
    }
    
    analyzeJavaScript(content) {
        return {
            isDaemon: content.includes('Daemon') || content.includes('watcher'),
            isTest: content.includes('test') || content.includes('describe('),
            hasClass: content.includes('class '),
            exports: content.includes('module.exports') || content.includes('export '),
            imports: (content.match(/require\(/g) || []).length + 
                     (content.match(/import /g) || []).length
        };
    }
    
    queueForClaude(fileInfo, loopId) {
        // This would integrate with Claude API
        console.log(`  → Queued for Claude processing: ${fileInfo.filename}`);
        
        // For now, create a placeholder
        const claudeQueue = path.join(__dirname, 'cal-drop/claude-queue');
        if (!fs.existsSync(claudeQueue)) {
            fs.mkdirSync(claudeQueue, { recursive: true });
        }
        
        const queueEntry = {
            file: fileInfo,
            loop_id: loopId,
            queued_at: new Date().toISOString(),
            status: 'pending'
        };
        
        fs.writeFileSync(
            path.join(claudeQueue, `${fileInfo.id}.json`),
            JSON.stringify(queueEntry, null, 2)
        );
    }
    
    processToneMap(fileInfo, content) {
        console.log('  → Processing tone map...');
        // This would update the system's tone understanding
    }
    
    trackDaemon(fileInfo, analysis) {
        console.log(`  → Tracking new daemon: ${fileInfo.filename}`);
        // This would register the daemon in the system
    }
    
    startAPI() {
        const server = http.createServer((req, res) => {
            res.setHeader('Content-Type', 'application/json');
            
            if (req.url === '/') {
                res.end(JSON.stringify({
                    service: 'Cal Drop Orchestrator',
                    version: '1.0',
                    stats: this.getStats(),
                    endpoints: [
                        'GET /stats',
                        'GET /loops',
                        'GET /duels',
                        'POST /drop'
                    ]
                }));
            } else if (req.url === '/stats') {
                res.end(JSON.stringify(this.getStats()));
            } else if (req.url === '/loops') {
                res.end(JSON.stringify(Array.from(this.activeLoops.values())));
            } else if (req.url === '/duels') {
                res.end(JSON.stringify(this.duelEngine.getActiveDuels()));
            } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        server.listen(this.port);
    }
    
    getStats() {
        return {
            ...this.stats,
            router_stats: this.intentRouter.getStats(),
            market_state: this.duelEngine.getMarketState(),
            active_loops: this.activeLoops.size
        };
    }
}

// Run the orchestrator
if (require.main === module) {
    const orchestrator = new CalDropOrchestrator();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n\nShutting down Cal Drop Orchestrator...');
        console.log('Final stats:', JSON.stringify(orchestrator.getStats(), null, 2));
        process.exit(0);
    });
    
    // Start
    orchestrator.start();
}