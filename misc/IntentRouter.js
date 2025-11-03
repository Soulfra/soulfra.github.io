#!/usr/bin/env node
/**
 * Intent Router
 * Classifies and routes files based on type and content
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const CalDropWatcher = require('./CalDropWatcher');

class IntentRouter extends EventEmitter {
    constructor() {
        super();
        this.queueDir = path.join(__dirname, 'queue');
        this.routedDir = path.join(__dirname, 'routed');
        this.processorsDir = path.join(__dirname, 'processors');
        
        // Initialize watcher
        this.watcher = new CalDropWatcher();
        
        // Route configurations
        this.routes = this.initializeRoutes();
        
        // Processing stats
        this.stats = {
            total_routed: 0,
            by_type: {},
            by_intent: {}
        };
        
        this.ensureDirectories();
    }
    
    ensureDirectories() {
        [this.routedDir, this.processorsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
        
        // Create subdirectories for each route
        Object.keys(this.routes).forEach(routeType => {
            const routeDir = path.join(this.routedDir, routeType);
            if (!fs.existsSync(routeDir)) {
                fs.mkdirSync(routeDir, { recursive: true });
            }
        });
    }
    
    initializeRoutes() {
        return {
            markdown: {
                extensions: ['.md'],
                processor: 'MarkdownProcessor',
                intents: {
                    'prd': /PRD_|_PRD\.|product.*requirement/i,
                    'checklist': /checklist|todo|tasks/i,
                    'issue': /issue|bug|problem/i,
                    'doc': /readme|guide|tutorial/i,
                    'spec': /spec|design|architecture/i
                }
            },
            javascript: {
                extensions: ['.js'],
                processor: 'JavaScriptProcessor',
                intents: {
                    'daemon': /daemon|watcher|monitor/i,
                    'api': /api|server|endpoint/i,
                    'processor': /processor|handler|worker/i,
                    'util': /util|helper|lib/i,
                    'test': /test|spec\.|\.test\.|\.spec\./i
                }
            },
            json: {
                extensions: ['.json'],
                processor: 'JsonProcessor',
                intents: {
                    'config': /config|settings|options/i,
                    'tone': /tone|mood|emotion/i,
                    'manifest': /manifest|package|schema/i,
                    'data': /data|state|cache/i
                }
            },
            prompt: {
                extensions: ['.txt', '.prompt'],
                processor: 'ClaudePromptProcessor',
                intents: {
                    'claude': /claude|prompt|generate/i,
                    'whisper': /whisper|thought|idea/i,
                    'loop': /loop|cycle|iteration/i
                }
            }
        };
    }
    
    start() {
        console.log('Intent Router started');
        console.log(`Routes configured: ${Object.keys(this.routes).join(', ')}`);
        
        // Listen to file detection events
        this.watcher.on('file_detected', (fileInfo) => {
            this.routeFile(fileInfo);
        });
        
        // Start the watcher
        this.watcher.start();
        
        // Process existing queued files
        this.processQueuedFiles();
        
        // Periodic queue processing
        this.queueInterval = setInterval(() => {
            this.processQueuedFiles();
        }, 10000);
    }
    
    stop() {
        this.watcher.stop();
        if (this.queueInterval) {
            clearInterval(this.queueInterval);
        }
        console.log('Intent Router stopped');
    }
    
    processQueuedFiles() {
        try {
            const queueFiles = fs.readdirSync(this.queueDir)
                .filter(f => f.endsWith('.json'));
                
            queueFiles.forEach(file => {
                const queuePath = path.join(this.queueDir, file);
                const fileInfo = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
                
                if (fileInfo.status === 'queued') {
                    this.routeFile(fileInfo);
                }
            });
        } catch (err) {
            console.error('Error processing queue:', err);
        }
    }
    
    async routeFile(fileInfo) {
        console.log(`\n🔀 Routing file: ${fileInfo.filename}`);
        
        try {
            // Determine route type
            const routeType = this.determineRouteType(fileInfo);
            
            if (!routeType) {
                console.warn(`⚠️  No route found for: ${fileInfo.filename}`);
                this.handleUnroutableFile(fileInfo);
                return;
            }
            
            // Detect intent
            const intent = await this.detectIntent(fileInfo, routeType);
            
            // Update file info
            fileInfo.route_type = routeType;
            fileInfo.intent = intent;
            fileInfo.routed_at = new Date().toISOString();
            
            // Route to processor
            await this.routeToProcessor(fileInfo, routeType);
            
            // Update stats
            this.updateStats(routeType, intent);
            
            // Emit routing event
            this.emit('file_routed', fileInfo);
            
            console.log(`✓ Routed to ${routeType}/${intent}`);
            
        } catch (err) {
            console.error(`Error routing ${fileInfo.filename}:`, err);
            this.emit('routing_error', { fileInfo, error: err });
        }
    }
    
    determineRouteType(fileInfo) {
        const extension = fileInfo.type.toLowerCase();
        
        for (const [routeType, config] of Object.entries(this.routes)) {
            if (config.extensions.includes(extension)) {
                return routeType;
            }
        }
        
        return null;
    }
    
    async detectIntent(fileInfo, routeType) {
        const route = this.routes[routeType];
        const filename = fileInfo.filename.toLowerCase();
        
        // First check filename patterns
        for (const [intent, pattern] of Object.entries(route.intents)) {
            if (pattern.test(filename)) {
                return intent;
            }
        }
        
        // For text files, check content
        if (['markdown', 'prompt', 'json'].includes(routeType)) {
            try {
                const content = fs.readFileSync(fileInfo.filepath, 'utf8');
                const preview = content.substring(0, 1000).toLowerCase();
                
                for (const [intent, pattern] of Object.entries(route.intents)) {
                    if (pattern.test(preview)) {
                        return intent;
                    }
                }
            } catch (err) {
                console.error('Error reading file for intent detection:', err);
            }
        }
        
        return 'general';
    }
    
    async routeToProcessor(fileInfo, routeType) {
        const route = this.routes[routeType];
        const processorName = route.processor;
        
        // Move file to routed directory
        const routedSubdir = path.join(this.routedDir, routeType, fileInfo.intent);
        if (!fs.existsSync(routedSubdir)) {
            fs.mkdirSync(routedSubdir, { recursive: true });
        }
        
        const newPath = path.join(routedSubdir, fileInfo.filename);
        fs.renameSync(fileInfo.filepath, newPath);
        fileInfo.filepath = newPath;
        
        // Update queue entry
        const queueFile = path.join(this.queueDir, `${fileInfo.id}.json`);
        fileInfo.status = 'routed';
        fileInfo.processor = processorName;
        fs.writeFileSync(queueFile, JSON.stringify(fileInfo, null, 2));
        
        // Emit processor event
        this.emit(`process_${routeType}`, fileInfo);
        
        // Log routing
        this.logRouting(fileInfo);
    }
    
    handleUnroutableFile(fileInfo) {
        // Move to unrouted directory
        const unroutedDir = path.join(this.routedDir, 'unrouted');
        if (!fs.existsSync(unroutedDir)) {
            fs.mkdirSync(unroutedDir, { recursive: true });
        }
        
        const newPath = path.join(unroutedDir, fileInfo.filename);
        fs.renameSync(fileInfo.filepath, newPath);
        
        // Update queue entry
        const queueFile = path.join(this.queueDir, `${fileInfo.id}.json`);
        fileInfo.status = 'unrouted';
        fileInfo.filepath = newPath;
        fs.writeFileSync(queueFile, JSON.stringify(fileInfo, null, 2));
    }
    
    updateStats(routeType, intent) {
        this.stats.total_routed++;
        this.stats.by_type[routeType] = (this.stats.by_type[routeType] || 0) + 1;
        this.stats.by_intent[intent] = (this.stats.by_intent[intent] || 0) + 1;
    }
    
    logRouting(fileInfo) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            file_id: fileInfo.id,
            filename: fileInfo.filename,
            route_type: fileInfo.route_type,
            intent: fileInfo.intent,
            processor: fileInfo.processor
        };
        
        const logFile = path.join(__dirname, 'logs', 'routing.log');
        fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    }
    
    getStats() {
        return {
            ...this.stats,
            watcher_stats: this.watcher.getStats()
        };
    }
}

// Export for use by processors
module.exports = IntentRouter;

// Run if called directly
if (require.main === module) {
    const router = new IntentRouter();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\nShutting down Intent Router...');
        router.stop();
        console.log('\nFinal stats:', JSON.stringify(router.getStats(), null, 2));
        process.exit(0);
    });
    
    // Start routing
    router.start();
    
    // Example processor listeners (these would be in separate files)
    router.on('process_markdown', (fileInfo) => {
        console.log(`📝 Markdown processor would handle: ${fileInfo.filename}`);
    });
    
    router.on('process_javascript', (fileInfo) => {
        console.log(`🔧 JavaScript processor would handle: ${fileInfo.filename}`);
    });
    
    router.on('process_json', (fileInfo) => {
        console.log(`📊 JSON processor would handle: ${fileInfo.filename}`);
    });
    
    router.on('process_prompt', (fileInfo) => {
        console.log(`🤖 Claude processor would handle: ${fileInfo.filename}`);
    });
}