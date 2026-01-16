// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * CodebaseReflector.js
 * Prompt-Aware Codebase Scanner - Phase 3 of Contextual Synthesis
 * Scans runtime/, mirror-shell/, loop/, agents/ and matches to user intent
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class CodebaseReflector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.scanPaths = options.scanPaths || [
            './runtime',
            './mirror-shell', 
            './loop',
            './agents',
            './config',
            './memory',
            './queue'
        ];
        
        this.outputFile = options.outputFile || './intent/codebase_reflection.json';
        this.analysisFile = options.analysisFile || './intent/codebase_analysis.json';
        this.intentFile = options.intentFile || './intent/current_state.json';
        
        this.codebaseMap = new Map();
        this.analysisResults = {};
        this.currentIntent = null;
        
        this.analysisPatterns = {
            // Code completeness patterns
            completeness: {
                implemented: [
                    /class\s+\w+\s*{[\s\S]*?}/,
                    /function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?}/,
                    /const\s+\w+\s*=\s*require\(/,
                    /module\.exports\s*=/,
                    /app\.(get|post|put|delete)\(/,
                    /async\s+function\s+\w+/
                ],
                stubbed: [
                    /\/\/\s*TODO/i,
                    /\/\/\s*STUB/i,
                    /\/\/\s*PLACEHOLDER/i,
                    /throw\s+new\s+Error\(['"]Not implemented['"]/, 
                    /console\.log\(['"]TODO/i,
                    /function\s+\w+\s*\([^)]*\)\s*{\s*\/\/[^}]*}/
                ],
                incomplete: [
                    /\/\/\s*FIXME/i,
                    /\/\/\s*BUG/i,
                    /\/\/\s*BROKEN/i,
                    /\.catch\(\s*\(\s*\)\s*=>\s*{\s*}\s*\)/,
                    /catch\s*\([^)]*\)\s*{\s*}/,
                    /if\s*\([^)]*\)\s*{\s*\/\/[^}]*}/
                ]
            },
            
            // Intent-specific patterns
            intent_patterns: {
                'build_ai_narrative_agent': {
                    required: ['emotional_tone', 'personality', 'narrative', 'agent'],
                    files: ['agent_', 'personality', 'whisper', 'tone'],
                    functions: ['processEmotion', 'generateNarrative', 'updatePersonality']
                },
                'create_reflection_engine': {
                    required: ['reflection', 'mirror', 'memory', 'state'],
                    files: ['reflection', 'mirror', 'memory', 'state'],
                    functions: ['reflect', 'updateMemory', 'getState', 'mirror']
                },
                'build_loop_system': {
                    required: ['loop', 'spawn', 'blessed', 'cycle'],
                    files: ['loop_', 'spawn', 'blessing'],
                    functions: ['spawnAgent', 'blessLoop', 'cycleLoop']
                },
                'develop_claude_integration': {
                    required: ['claude', 'prompt', 'execute', 'response'],
                    files: ['claude', 'prompt', 'bridge'],
                    functions: ['executePrompt', 'processResponse', 'bridgeCall']
                },
                'create_mask_system': {
                    required: ['mask', 'persona', 'identity', 'character'],
                    files: ['mask', 'persona', 'character'],
                    functions: ['switchMask', 'loadPersona', 'applyCharacter']
                },
                'build_monitoring_system': {
                    required: ['monitor', 'health', 'validation', 'daemon'],
                    files: ['monitor', 'health', 'validation', 'daemon'],
                    functions: ['checkHealth', 'validate', 'startMonitoring']
                }
            }
        };
        
        this.stats = {
            files_scanned: 0,
            total_size: 0,
            implemented_functions: 0,
            stubbed_functions: 0,
            incomplete_functions: 0,
            missing_components: 0,
            last_scan: null
        };
        
        this.initializeReflector();
    }

    async initializeReflector() {
        console.log('🔍 Initializing Codebase Reflector...');
        
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Load current intent
            await this.loadCurrentIntent();
            
            // Perform initial codebase scan
            await this.performCodebaseScan();
            
            // Generate reflection analysis
            await this.generateReflectionAnalysis();
            
            // Start periodic scanning
            this.startPeriodicScanning();
            
            console.log('✅ Codebase Reflector initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('💀 Codebase reflector initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async ensureDirectories() {
        const dirs = [
            path.dirname(this.outputFile),
            path.dirname(this.analysisFile),
            './intent/scans',
            './intent/analysis'
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    async loadCurrentIntent() {
        if (fs.existsSync(this.intentFile)) {
            try {
                const intentData = JSON.parse(fs.readFileSync(this.intentFile, 'utf8'));
                this.currentIntent = intentData;
                console.log(`🎯 Loaded current intent: ${intentData.intent_type || 'unknown'}`);
            } catch (error) {
                console.warn('⚠️ Failed to load current intent, proceeding without context');
            }
        }
    }

    async performCodebaseScan() {
        console.log('📂 Performing comprehensive codebase scan...');
        
        const startTime = Date.now();
        this.codebaseMap.clear();
        this.stats.files_scanned = 0;
        this.stats.total_size = 0;
        
        for (const scanPath of this.scanPaths) {
            if (fs.existsSync(scanPath)) {
                await this.scanDirectory(scanPath);
            }
        }
        
        const duration = Date.now() - startTime;
        this.stats.last_scan = new Date().toISOString();
        
        console.log(`🔍 Scan complete: ${this.stats.files_scanned} files (${Math.round(this.stats.total_size / 1024)}KB, ${duration}ms)`);
        
        await this.saveCodebaseMap();
    }

    async scanDirectory(dirPath, depth = 0) {
        if (depth > 4) return; // Prevent deep recursion
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                if (item.startsWith('node_modules') || item.startsWith('.git')) continue;
                
                const fullPath = path.join(dirPath, item);
                const stats = fs.lstatSync(fullPath);
                
                if (stats.isFile()) {
                    await this.analyzeFile(fullPath);
                } else if (stats.isDirectory()) {
                    await this.scanDirectory(fullPath, depth + 1);
                }
            }
            
        } catch (error) {
            console.warn(`Failed to scan directory ${dirPath}:`, error.message);
        }
    }

    async analyzeFile(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const extension = path.extname(filePath);
            const relativePath = path.relative(__dirname, filePath);
            
            // Skip binary files and very large files
            if (stats.size > 5 * 1024 * 1024) return; // Skip >5MB files
            
            let content = '';
            const codeExtensions = ['.js', '.py', '.ts', '.json', '.md', '.txt', '.html', '.css'];
            
            if (codeExtensions.includes(extension)) {
                try {
                    content = fs.readFileSync(filePath, 'utf8');
                } catch (e) {
                    // Skip unreadable files
                    return;
                }
            }
            
            const analysis = this.analyzeFileContent(content, relativePath, extension);
            
            this.codebaseMap.set(relativePath, {
                path: relativePath,
                extension: extension,
                size: stats.size,
                modified: stats.mtime.toISOString(),
                analysis: analysis,
                timestamp: new Date().toISOString()
            });
            
            this.stats.files_scanned++;
            this.stats.total_size += stats.size;
            
        } catch (error) {
            console.warn(`Failed to analyze file ${filePath}:`, error.message);
        }
    }

    analyzeFileContent(content, relativePath, extension) {
        const analysis = {
            type: this.determineFileType(relativePath, content),
            completeness: 'unknown',
            functions: [],
            classes: [],
            exports: [],
            imports: [],
            todos: [],
            patterns: [],
            intent_relevance: 0
        };
        
        // Analyze completeness
        analysis.completeness = this.analyzeCompleteness(content);
        
        // Extract code structures
        if (extension === '.js' || extension === '.ts') {
            analysis.functions = this.extractFunctions(content);
            analysis.classes = this.extractClasses(content);
            analysis.exports = this.extractExports(content);
            analysis.imports = this.extractImports(content);
        } else if (extension === '.py') {
            analysis.functions = this.extractPythonFunctions(content);
            analysis.classes = this.extractPythonClasses(content);
        }
        
        // Find TODOs and notes
        analysis.todos = this.extractTodos(content);
        
        // Check intent relevance if we have current intent
        if (this.currentIntent) {
            analysis.intent_relevance = this.calculateIntentRelevance(content, relativePath);
            analysis.patterns = this.findIntentPatterns(content, relativePath);
        }
        
        return analysis;
    }

    determineFileType(relativePath, content) {
        if (relativePath.includes('agent')) return 'agent';
        if (relativePath.includes('loop')) return 'loop';
        if (relativePath.includes('whisper')) return 'whisper';
        if (relativePath.includes('claude')) return 'claude_integration';
        if (relativePath.includes('mirror')) return 'mirror_system';
        if (relativePath.includes('config')) return 'configuration';
        if (relativePath.includes('daemon') || content.includes('setInterval')) return 'daemon';
        if (content.includes('app.get') || content.includes('app.post')) return 'api_endpoint';
        if (content.includes('class ')) return 'class_definition';
        if (content.includes('function ')) return 'function_library';
        return 'unknown';
    }

    analyzeCompleteness(content) {
        const { implemented, stubbed, incomplete } = this.analysisPatterns.completeness;
        
        let implementedCount = 0;
        let stubbedCount = 0;
        let incompleteCount = 0;
        
        for (const pattern of implemented) {
            const matches = content.match(pattern);
            if (matches) implementedCount += matches.length;
        }
        
        for (const pattern of stubbed) {
            const matches = content.match(pattern);
            if (matches) stubbedCount += matches.length;
        }
        
        for (const pattern of incomplete) {
            const matches = content.match(pattern);
            if (matches) incompleteCount += matches.length;
        }
        
        this.stats.implemented_functions += implementedCount;
        this.stats.stubbed_functions += stubbedCount;
        this.stats.incomplete_functions += incompleteCount;
        
        if (stubbedCount > implementedCount) return 'stubbed';
        if (incompleteCount > 0) return 'incomplete';
        if (implementedCount > 0) return 'implemented';
        return 'empty';
    }

    extractFunctions(content) {
        const functions = [];
        
        // Regular function declarations
        const funcPattern = /(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
        let match;
        while ((match = funcPattern.exec(content)) !== null) {
            functions.push({
                name: match[1],
                type: match[0].includes('async') ? 'async_function' : 'function'
            });
        }
        
        // Arrow functions and methods
        const arrowPattern = /(\w+)\s*[:=]\s*(?:async\s+)?\([^)]*\)\s*=>/g;
        while ((match = arrowPattern.exec(content)) !== null) {
            functions.push({
                name: match[1],
                type: 'arrow_function'
            });
        }
        
        return functions;
    }

    extractClasses(content) {
        const classes = [];
        const classPattern = /class\s+(\w+)(?:\s+extends\s+(\w+))?\s*{/g;
        let match;
        
        while ((match = classPattern.exec(content)) !== null) {
            classes.push({
                name: match[1],
                extends: match[2] || null
            });
        }
        
        return classes;
    }

    extractExports(content) {
        const exports = [];
        
        // module.exports
        if (content.includes('module.exports')) {
            exports.push('module.exports');
        }
        
        // ES6 exports
        const exportPattern = /export\s+(?:default\s+)?(?:class\s+|function\s+|const\s+|let\s+|var\s+)?(\w+)/g;
        let match;
        while ((match = exportPattern.exec(content)) !== null) {
            exports.push(match[1]);
        }
        
        return exports;
    }

    extractImports(content) {
        const imports = [];
        
        // require statements
        const requirePattern = /require\(['"]([^'"]+)['"]\)/g;
        let match;
        while ((match = requirePattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        // ES6 imports
        const importPattern = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        while ((match = importPattern.exec(content)) !== null) {
            imports.push(match[1]);
        }
        
        return imports;
    }

    extractPythonFunctions(content) {
        const functions = [];
        const funcPattern = /(?:async\s+)?def\s+(\w+)\s*\(/g;
        let match;
        
        while ((match = funcPattern.exec(content)) !== null) {
            functions.push({
                name: match[1],
                type: match[0].includes('async') ? 'async_def' : 'def'
            });
        }
        
        return functions;
    }

    extractPythonClasses(content) {
        const classes = [];
        const classPattern = /class\s+(\w+)(?:\(([^)]+)\))?\s*:/g;
        let match;
        
        while ((match = classPattern.exec(content)) !== null) {
            classes.push({
                name: match[1],
                extends: match[2] || null
            });
        }
        
        return classes;
    }

    extractTodos(content) {
        const todos = [];
        const todoPattern = /\/\/\s*(TODO|FIXME|BUG|STUB|PLACEHOLDER|NOTE)[\s:]*([^\n]*)/gi;
        let match;
        
        while ((match = todoPattern.exec(content)) !== null) {
            todos.push({
                type: match[1].toUpperCase(),
                text: match[2].trim()
            });
        }
        
        return todos;
    }

    calculateIntentRelevance(content, relativePath) {
        if (!this.currentIntent || !this.currentIntent.intent_type) return 0;
        
        const intentType = this.currentIntent.intent_type;
        const intentPattern = this.analysisPatterns.intent_patterns[intentType];
        
        if (!intentPattern) return 0;
        
        let relevance = 0;
        const contentLower = content.toLowerCase();
        const pathLower = relativePath.toLowerCase();
        
        // Check required keywords
        for (const keyword of intentPattern.required) {
            if (contentLower.includes(keyword)) relevance += 20;
            if (pathLower.includes(keyword)) relevance += 10;
        }
        
        // Check file patterns
        for (const filePattern of intentPattern.files) {
            if (pathLower.includes(filePattern)) relevance += 15;
        }
        
        // Check function patterns
        for (const funcPattern of intentPattern.functions) {
            if (contentLower.includes(funcPattern.toLowerCase())) relevance += 25;
        }
        
        return Math.min(100, relevance);
    }

    findIntentPatterns(content, relativePath) {
        const patterns = [];
        
        if (!this.currentIntent) return patterns;
        
        const intentType = this.currentIntent.intent_type;
        const intentPattern = this.analysisPatterns.intent_patterns[intentType];
        
        if (!intentPattern) return patterns;
        
        // Find missing required components
        for (const required of intentPattern.required) {
            if (!content.toLowerCase().includes(required)) {
                patterns.push({
                    type: 'missing_required',
                    component: required,
                    suggestion: `Consider adding ${required} functionality`
                });
            }
        }
        
        // Find missing functions
        for (const func of intentPattern.functions) {
            if (!content.toLowerCase().includes(func.toLowerCase())) {
                patterns.push({
                    type: 'missing_function',
                    component: func,
                    suggestion: `Consider implementing ${func}() function`
                });
            }
        }
        
        return patterns;
    }

    async generateReflectionAnalysis() {
        console.log('🧠 Generating codebase reflection analysis...');
        
        const analysis = {
            timestamp: new Date().toISOString(),
            current_intent: this.currentIntent,
            codebase_summary: this.generateCodebaseSummary(),
            completeness_analysis: this.generateCompletenessAnalysis(),
            intent_analysis: this.generateIntentAnalysis(),
            recommendations: this.generateRecommendations(),
            stats: this.stats
        };
        
        this.analysisResults = analysis;
        
        await this.saveAnalysis();
        
        console.log('✅ Reflection analysis complete');
        this.emit('analysis-complete', analysis);
        
        return analysis;
    }

    generateCodebaseSummary() {
        const summary = {
            total_files: this.codebaseMap.size,
            file_types: {},
            size_distribution: {},
            directories: new Set()
        };
        
        for (const [path, info] of this.codebaseMap.entries()) {
            // Count file types
            const type = info.analysis.type;
            summary.file_types[type] = (summary.file_types[type] || 0) + 1;
            
            // Track directories
            summary.directories.add(path.split('/')[0]);
            
            // Size distribution
            const sizeCategory = this.categorizeSizefor(info.size);
            summary.size_distribution[sizeCategory] = (summary.size_distribution[sizeCategory] || 0) + 1;
        }
        
        summary.directories = Array.from(summary.directories);
        
        return summary;
    }

    categorizeSizefor(size) {
        if (size < 1024) return 'small';
        if (size < 10240) return 'medium';
        if (size < 102400) return 'large';
        return 'very_large';
    }

    generateCompletenessAnalysis() {
        const completeness = {
            implemented: [],
            stubbed: [],
            incomplete: [],
            missing: []
        };
        
        for (const [path, info] of this.codebaseMap.entries()) {
            const item = {
                file: path,
                type: info.analysis.type,
                functions: info.analysis.functions.length,
                todos: info.analysis.todos.length
            };
            
            switch (info.analysis.completeness) {
                case 'implemented':
                    completeness.implemented.push(item);
                    break;
                case 'stubbed':
                    completeness.stubbed.push(item);
                    break;
                case 'incomplete':
                    completeness.incomplete.push(item);
                    break;
                default:
                    completeness.missing.push(item);
            }
        }
        
        return completeness;
    }

    generateIntentAnalysis() {
        if (!this.currentIntent) {
            return { message: 'No current intent detected' };
        }
        
        const intentAnalysis = {
            intent: this.currentIntent.intent,
            intent_type: this.currentIntent.intent_type,
            relevant_files: [],
            missing_components: [],
            implementation_gaps: []
        };
        
        // Find relevant files
        for (const [path, info] of this.codebaseMap.entries()) {
            if (info.analysis.intent_relevance > 30) {
                intentAnalysis.relevant_files.push({
                    file: path,
                    relevance: info.analysis.intent_relevance,
                    type: info.analysis.type,
                    completeness: info.analysis.completeness
                });
            }
        }
        
        // Find missing components and gaps
        const intentType = this.currentIntent.intent_type;
        const intentPattern = this.analysisPatterns.intent_patterns[intentType];
        
        if (intentPattern) {
            for (const required of intentPattern.required) {
                const hasComponent = Array.from(this.codebaseMap.values()).some(info => 
                    info.analysis.functions.some(f => f.name.toLowerCase().includes(required)) ||
                    info.path.toLowerCase().includes(required)
                );
                
                if (!hasComponent) {
                    intentAnalysis.missing_components.push(required);
                }
            }
            
            for (const func of intentPattern.functions) {
                const hasFunction = Array.from(this.codebaseMap.values()).some(info => 
                    info.analysis.functions.some(f => f.name.toLowerCase().includes(func.toLowerCase()))
                );
                
                if (!hasFunction) {
                    intentAnalysis.implementation_gaps.push(func);
                }
            }
        }
        
        return intentAnalysis;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Based on completeness analysis
        const stubbedFiles = Array.from(this.codebaseMap.values())
            .filter(info => info.analysis.completeness === 'stubbed');
        
        if (stubbedFiles.length > 0) {
            recommendations.push({
                type: 'complete_stubs',
                priority: 'high',
                message: `${stubbedFiles.length} stubbed files need implementation`,
                files: stubbedFiles.slice(0, 5).map(f => f.path)
            });
        }
        
        // Based on intent analysis
        if (this.currentIntent) {
            const intentAnalysis = this.generateIntentAnalysis();
            
            if (intentAnalysis.missing_components.length > 0) {
                recommendations.push({
                    type: 'missing_components',
                    priority: 'high',
                    message: `Missing components for ${this.currentIntent.intent}`,
                    components: intentAnalysis.missing_components
                });
            }
            
            if (intentAnalysis.implementation_gaps.length > 0) {
                recommendations.push({
                    type: 'implementation_gaps',
                    priority: 'medium',
                    message: `Function implementations needed for ${this.currentIntent.intent}`,
                    functions: intentAnalysis.implementation_gaps
                });
            }
        }
        
        // TODOs analysis
        const todoFiles = Array.from(this.codebaseMap.values())
            .filter(info => info.analysis.todos.length > 0);
        
        if (todoFiles.length > 0) {
            recommendations.push({
                type: 'address_todos',
                priority: 'medium',
                message: `${todoFiles.length} files have TODO items`,
                total_todos: todoFiles.reduce((sum, f) => sum + f.analysis.todos.length, 0)
            });
        }
        
        return recommendations;
    }

    async saveCodebaseMap() {
        const data = {
            timestamp: new Date().toISOString(),
            codebase: Array.from(this.codebaseMap.entries()).map(([path, info]) => ({
                path,
                ...info
            })),
            stats: this.stats
        };
        
        try {
            fs.writeFileSync(this.outputFile, JSON.stringify(data, null, 2));
            console.log(`💾 Saved codebase map: ${this.outputFile}`);
        } catch (error) {
            console.error('Failed to save codebase map:', error.message);
        }
    }

    async saveAnalysis() {
        try {
            fs.writeFileSync(this.analysisFile, JSON.stringify(this.analysisResults, null, 2));
            console.log(`📊 Saved reflection analysis: ${this.analysisFile}`);
        } catch (error) {
            console.error('Failed to save analysis:', error.message);
        }
    }

    startPeriodicScanning() {
        // Scan every 10 minutes
        setInterval(async () => {
            try {
                await this.loadCurrentIntent();
                await this.performCodebaseScan();
                await this.generateReflectionAnalysis();
            } catch (error) {
                console.error('Periodic scan failed:', error.message);
            }
        }, 10 * 60 * 1000);
    }

    // API methods
    getCodebaseSummary() {
        return {
            timestamp: new Date().toISOString(),
            summary: this.generateCodebaseSummary(),
            stats: this.stats
        };
    }

    getIntentAnalysis() {
        return this.generateIntentAnalysis();
    }

    getRecommendations() {
        return this.generateRecommendations();
    }

    findFilesByType(type) {
        return Array.from(this.codebaseMap.values())
            .filter(info => info.analysis.type === type)
            .map(info => info.path);
    }

    getFileAnalysis(filePath) {
        return this.codebaseMap.get(filePath);
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Codebase Reflector...');
        await this.saveCodebaseMap();
        await this.saveAnalysis();
        this.removeAllListeners();
    }
}

module.exports = CodebaseReflector;

// CLI execution
if (require.main === module) {
    const reflector = new CodebaseReflector();
    
    reflector.on('initialized', () => {
        console.log('Codebase Reflector initialized successfully');
    });
    
    reflector.on('analysis-complete', (analysis) => {
        console.log('🎯 Codebase Analysis Complete:');
        console.log(`Files scanned: ${analysis.stats.files_scanned}`);
        console.log(`Current intent: ${analysis.current_intent?.intent || 'None'}`);
        console.log(`Recommendations: ${analysis.recommendations.length}`);
        
        if (analysis.intent_analysis && analysis.intent_analysis.missing_components?.length > 0) {
            console.log('⚠️ Missing components:', analysis.intent_analysis.missing_components.join(', '));
        }
        
        if (analysis.recommendations.length > 0) {
            console.log('💡 Top recommendation:', analysis.recommendations[0].message);
        }
    });
    
    reflector.on('error', (error) => {
        console.error('Codebase reflector error:', error.message);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down codebase reflector...');
        await reflector.cleanup();
        process.exit(0);
    });
}