#!/usr/bin/env node
/**
 * FileContextClassifier.js
 * Auto-classifies every dropped file based on content, structure, and intent
 * Integrates with existing Soulfra file patterns and hidden file conventions
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class FileContextClassifier extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.watchPaths = options.watchPaths || [
            __dirname,
            './agents',
            './loop',
            './memory',
            './queue',
            './runtime',
            './mirror-shell',
            './config'
        ];
        
        this.logFile = options.logFile || './logs/classified_files.json';
        this.stateFile = options.stateFile || './memory/classification_state.json';
        
        this.classifications = new Map();
        this.watchers = new Map();
        this.processing = false;
        
        this.classificationRules = {
            // Core Soulfra file types
            whisper: {
                patterns: [/whisper/i, /tone/, /emotional/, /mystical/, /peaceful/],
                extensions: ['.whisper', '.tone'],
                contentMarkers: ['emotional_tone', 'whisper_origin', 'blessed:', 'tone_patterns'],
                keywords: ['whisper', 'tone', 'emotion', 'mystical', 'peaceful', 'curious', 'playful']
            },
            loop: {
                patterns: [/loop/i, /\_loop\_/, /loop\_\d+/],
                extensions: ['.loop', '.json'],
                contentMarkers: ['loop_id', 'loop_origin', 'agent_spawn', 'loop_meta'],
                keywords: ['loop_id', 'spawn', 'blessed', 'loop_origin', 'cycle']
            },
            prd: {
                patterns: [/PRD\_/i, /prd/i],
                extensions: ['.md'],
                contentMarkers: ['## PRD', '### Requirements', '### Implementation', 'PRD_'],
                keywords: ['requirements', 'implementation', 'specification', 'features', 'API']
            },
            agent: {
                patterns: [/agent/i, /cal\_/, /domingo/i, /riven/i],
                extensions: ['.js', '.py', '.json'],
                contentMarkers: ['agent_id', 'personality', 'spawn', 'reflection', 'mirror'],
                keywords: ['agent', 'personality', 'reflection', 'mirror', 'cal', 'domingo', 'spawn']
            },
            config: {
                patterns: [/config/i, /\.env/, /settings/i],
                extensions: ['.json', '.env', '.conf', '.config'],
                contentMarkers: ['port:', 'api_key', 'endpoint', 'settings'],
                keywords: ['port', 'endpoint', 'configuration', 'settings', 'environment']
            },
            claude_prompt: {
                patterns: [/claude/i, /prompt/i, /test\_/],
                extensions: ['.md', '.txt', '.prompt'],
                contentMarkers: ['# Claude', '## Prompt', 'execute claude', 'claude response'],
                keywords: ['claude', 'prompt', 'response', 'execute', 'test', 'query']
            },
            idea_seed: {
                patterns: [/idea/i, /concept/i, /seed/i, /draft/i],
                extensions: ['.md', '.txt', '.idea'],
                contentMarkers: ['# Idea', '## Concept', 'brainstorm', 'draft'],
                keywords: ['idea', 'concept', 'brainstorm', 'draft', 'seed', 'vision']
            },
            test_output: {
                patterns: [/test/i, /result/i, /output/i, /log/i],
                extensions: ['.log', '.json', '.result'],
                contentMarkers: ['test result', 'passed:', 'failed:', 'duration:', 'timestamp:'],
                keywords: ['test', 'result', 'passed', 'failed', 'duration', 'success']
            },
            hidden_system: {
                patterns: [/^\./, /\.bound\-to/, /\.vault/, /\.mirror/, /\.blessing/],
                extensions: ['.sig', '.json'],
                contentMarkers: ['device_binding', 'vault_anchor', 'trust_signature'],
                keywords: ['binding', 'vault', 'trust', 'signature', 'anchor']
            },
            tier_structure: {
                patterns: [/tier[\-\d]+/i, /tier\d+/],
                extensions: ['.js', '.py', '.md'],
                contentMarkers: ['tier-', 'trust chain', 'operator', 'kernel'],
                keywords: ['tier', 'trust', 'chain', 'operator', 'kernel', 'hierarchy']
            }
        };
        
        this.stats = {
            files_classified: 0,
            classification_counts: {},
            last_classification: null,
            processing_time_avg: 0,
            errors: 0
        };
        
        this.initializeClassifier();
    }

    async initializeClassifier() {
        console.log('📂 Initializing File Context Classifier...');
        
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Load existing state
            await this.loadState();
            
            // Perform initial classification scan
            await this.performInitialScan();
            
            // Start file watchers
            this.startWatching();
            
            console.log(`✅ Classifier initialized: ${this.classifications.size} files classified`);
            this.emit('initialized');
            
        } catch (error) {
            console.error('💀 Classifier initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async ensureDirectories() {
        const dirs = [
            path.dirname(this.logFile),
            path.dirname(this.stateFile),
            './memory/classifications',
            './logs/classifications'
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    async loadState() {
        if (fs.existsSync(this.stateFile)) {
            try {
                const state = JSON.parse(fs.readFileSync(this.stateFile, 'utf8'));
                
                if (state.classifications) {
                    this.classifications = new Map(state.classifications);
                }
                
                if (state.stats) {
                    this.stats = { ...this.stats, ...state.stats };
                }
                
                console.log(`📊 Loaded classifier state: ${this.classifications.size} files`);
                
            } catch (error) {
                console.warn('⚠️ Failed to load classifier state, starting fresh');
            }
        }
    }

    async saveState() {
        const state = {
            timestamp: new Date().toISOString(),
            classifications: Array.from(this.classifications.entries()),
            stats: this.stats
        };
        
        try {
            fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
        } catch (error) {
            console.error('Failed to save classifier state:', error.message);
        }
    }

    async performInitialScan() {
        console.log('🔍 Performing initial file classification scan...');
        
        for (const watchPath of this.watchPaths) {
            if (fs.existsSync(watchPath)) {
                await this.scanDirectory(watchPath);
            }
        }
        
        await this.saveClassificationLog();
    }

    async scanDirectory(dirPath, depth = 0) {
        if (depth > 3) return; // Prevent infinite recursion
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stats = fs.lstatSync(fullPath);
                
                if (stats.isFile()) {
                    await this.classifyFile(fullPath);
                } else if (stats.isDirectory() && !item.startsWith('node_modules') && !item.startsWith('.git')) {
                    await this.scanDirectory(fullPath, depth + 1);
                }
            }
            
        } catch (error) {
            console.warn(`Failed to scan directory ${dirPath}:`, error.message);
        }
    }

    async classifyFile(filePath) {
        const startTime = Date.now();
        
        try {
            const filename = path.basename(filePath);
            const extension = path.extname(filePath);
            const relativePath = path.relative(__dirname, filePath);
            
            // Skip if already classified and file hasn't changed
            const stats = fs.statSync(filePath);
            const fileKey = `${relativePath}:${stats.mtime.getTime()}`;
            
            if (this.classifications.has(fileKey)) {
                return this.classifications.get(fileKey);
            }
            
            // Read file content (with size limit)
            let content = '';
            if (stats.size < 1024 * 1024) { // Max 1MB
                try {
                    content = fs.readFileSync(filePath, 'utf8');
                } catch (e) {
                    // Binary file or encoding issue
                    content = '';
                }
            }
            
            // Perform classification
            const classification = this.analyzeFile({
                filename,
                extension,
                relativePath,
                content,
                size: stats.size,
                modified: stats.mtime
            });
            
            // Store classification
            this.classifications.set(fileKey, classification);
            
            // Update stats
            this.stats.files_classified++;
            this.stats.classification_counts[classification.type] = 
                (this.stats.classification_counts[classification.type] || 0) + 1;
            this.stats.last_classification = new Date().toISOString();
            
            const duration = Date.now() - startTime;
            this.stats.processing_time_avg = this.stats.processing_time_avg
                ? (this.stats.processing_time_avg + duration) / 2
                : duration;
            
            this.emit('file-classified', classification);
            
            return classification;
            
        } catch (error) {
            this.stats.errors++;
            console.error(`Classification error for ${filePath}:`, error.message);
            return null;
        }
    }

    analyzeFile(fileInfo) {
        const { filename, extension, relativePath, content, size, modified } = fileInfo;
        
        // Initialize classification result
        const classification = {
            file: relativePath,
            filename: filename,
            extension: extension,
            size: size,
            modified: modified.toISOString(),
            type: 'unknown',
            subtype: null,
            confidence: 0,
            markers: [],
            keywords: [],
            context: {},
            timestamp: new Date().toISOString()
        };
        
        let bestMatch = { type: 'unknown', confidence: 0 };
        
        // Analyze against each classification rule
        for (const [type, rules] of Object.entries(this.classificationRules)) {
            let confidence = 0;
            const markers = [];
            const keywords = [];
            
            // Check filename patterns
            for (const pattern of rules.patterns) {
                if (pattern.test(filename) || pattern.test(relativePath)) {
                    confidence += 25;
                    markers.push(`filename_pattern:${pattern.source}`);
                }
            }
            
            // Check extensions
            if (rules.extensions.includes(extension)) {
                confidence += 20;
                markers.push(`extension:${extension}`);
            }
            
            // Check content markers
            for (const marker of rules.contentMarkers) {
                if (content.includes(marker)) {
                    confidence += 15;
                    markers.push(`content_marker:${marker}`);
                }
            }
            
            // Check keywords
            const contentLower = content.toLowerCase();
            for (const keyword of rules.keywords) {
                if (contentLower.includes(keyword.toLowerCase())) {
                    confidence += 5;
                    keywords.push(keyword);
                }
            }
            
            // Special rules for specific types
            if (type === 'hidden_system' && filename.startsWith('.')) {
                confidence += 30;
                markers.push('hidden_file');
            }
            
            if (type === 'tier_structure' && relativePath.includes('tier-')) {
                confidence += 20;
                markers.push('tier_path');
            }
            
            // Update best match
            if (confidence > bestMatch.confidence) {
                bestMatch = {
                    type: type,
                    confidence: confidence,
                    markers: markers,
                    keywords: keywords
                };
            }
        }
        
        // Apply best classification
        classification.type = bestMatch.type;
        classification.confidence = Math.min(100, bestMatch.confidence);
        classification.markers = bestMatch.markers || [];
        classification.keywords = bestMatch.keywords || [];
        
        // Add additional context
        classification.context = this.extractContext(fileInfo, classification);
        
        // Determine subtype
        classification.subtype = this.determineSubtype(fileInfo, classification);
        
        return classification;
    }

    extractContext(fileInfo, classification) {
        const { content, relativePath } = fileInfo;
        const context = {};
        
        // Extract specific context based on type
        switch (classification.type) {
            case 'whisper':
                context.emotional_tone = this.extractPattern(content, /emotional_tone["\s]*:\s*["']([^"']+)["']/);
                context.blessed = content.includes('blessed: true');
                break;
                
            case 'loop':
                context.loop_id = this.extractPattern(content, /loop_id["\s]*:\s*["']([^"']+)["']/);
                context.agent_spawn = content.includes('agent_spawn');
                break;
                
            case 'agent':
                context.agent_name = this.extractPattern(content, /agent_id["\s]*:\s*["']([^"']+)["']/);
                context.personality = this.extractPattern(content, /personality["\s]*:\s*["']([^"']+)["']/);
                break;
                
            case 'config':
                context.ports = this.extractAllPatterns(content, /port["\s]*:\s*(\d+)/g);
                context.endpoints = this.extractAllPatterns(content, /endpoint["\s]*:\s*["']([^"']+)["']/g);
                break;
                
            case 'claude_prompt':
                context.prompt_type = content.includes('# Claude') ? 'claude_prompt' : 'generic_prompt';
                context.has_metadata = content.includes('---');
                break;
                
            case 'hidden_system':
                context.system_type = this.inferHiddenSystemType(relativePath, content);
                context.critical = true;
                break;
        }
        
        return context;
    }

    extractPattern(content, pattern) {
        const match = content.match(pattern);
        return match ? match[1] : null;
    }

    extractAllPatterns(content, pattern) {
        const matches = [];
        let match;
        while ((match = pattern.exec(content)) !== null) {
            matches.push(match[1]);
        }
        return matches;
    }

    inferHiddenSystemType(relativePath, content) {
        if (relativePath.includes('.bound-to')) return 'device_binding';
        if (relativePath.includes('.vault')) return 'vault_config';
        if (relativePath.includes('.mirror')) return 'mirror_config';
        if (relativePath.includes('.blessing')) return 'blessing_state';
        if (content.includes('trust_signature')) return 'trust_anchor';
        return 'system_config';
    }

    determineSubtype(fileInfo, classification) {
        const { filename, extension, content } = fileInfo;
        
        switch (classification.type) {
            case 'prd':
                if (filename.includes('API')) return 'api_spec';
                if (filename.includes('UI')) return 'ui_spec';
                if (filename.includes('Daemon')) return 'daemon_spec';
                return 'feature_spec';
                
            case 'agent':
                if (filename.includes('cal')) return 'cal_agent';
                if (filename.includes('domingo')) return 'domingo_agent';
                if (filename.includes('mirror')) return 'mirror_agent';
                return 'generic_agent';
                
            case 'config':
                if (extension === '.env') return 'environment';
                if (filename.includes('nginx')) return 'proxy_config';
                if (filename.includes('tier')) return 'tier_config';
                return 'application_config';
                
            case 'test_output':
                if (content.includes('passed') || content.includes('failed')) return 'test_result';
                if (content.includes('performance')) return 'performance_log';
                return 'system_log';
                
            default:
                return null;
        }
    }

    startWatching() {
        console.log('👁️ Starting file watchers...');
        
        for (const watchPath of this.watchPaths) {
            if (fs.existsSync(watchPath)) {
                try {
                    const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
                        if (filename && eventType === 'change') {
                            const fullPath = path.join(watchPath, filename);
                            if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                                // Debounce file changes
                                setTimeout(() => {
                                    this.classifyFile(fullPath);
                                }, 1000);
                            }
                        }
                    });
                    
                    this.watchers.set(watchPath, watcher);
                    
                } catch (error) {
                    console.warn(`Failed to watch ${watchPath}:`, error.message);
                }
            }
        }
    }

    async saveClassificationLog() {
        const logData = {
            timestamp: new Date().toISOString(),
            stats: this.stats,
            classifications: Array.from(this.classifications.entries()).map(([key, classification]) => ({
                key,
                ...classification
            }))
        };
        
        try {
            fs.writeFileSync(this.logFile, JSON.stringify(logData, null, 2));
            console.log(`📝 Saved classification log: ${this.logFile}`);
        } catch (error) {
            console.error('Failed to save classification log:', error.message);
        }
    }

    // Query methods
    getClassificationsByType(type) {
        return Array.from(this.classifications.values()).filter(c => c.type === type);
    }

    getClassificationStats() {
        return {
            timestamp: new Date().toISOString(),
            total_files: this.classifications.size,
            stats: this.stats,
            type_distribution: this.stats.classification_counts,
            recent_classifications: Array.from(this.classifications.values())
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10)
        };
    }

    findFilesByPattern(pattern) {
        return Array.from(this.classifications.values()).filter(c => 
            pattern.test(c.filename) || pattern.test(c.file)
        );
    }

    getUnknownFiles() {
        return Array.from(this.classifications.values()).filter(c => c.type === 'unknown');
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up File Context Classifier...');
        
        // Stop watchers
        for (const watcher of this.watchers.values()) {
            watcher.close();
        }
        this.watchers.clear();
        
        // Save final state
        await this.saveState();
        await this.saveClassificationLog();
        
        this.removeAllListeners();
    }
}

module.exports = FileContextClassifier;

// CLI execution
if (require.main === module) {
    const classifier = new FileContextClassifier();
    
    classifier.on('initialized', () => {
        console.log('Classifier initialized successfully');
        
        const stats = classifier.getClassificationStats();
        console.log('Classification stats:', JSON.stringify(stats, null, 2));
    });
    
    classifier.on('file-classified', (classification) => {
        console.log(`📂 Classified: ${classification.file} as ${classification.type} (${classification.confidence}% confidence)`);
    });
    
    classifier.on('error', (error) => {
        console.error('Classifier error:', error.message);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down classifier...');
        await classifier.cleanup();
        process.exit(0);
    });
}