// -*- coding: utf-8 -*-
#!/usr/bin/env node
/**
 * IntentInferenceDaemon.js
 * "What Are You Trying to Build?" Detector
 * Reads chatlogs, loops, whispers, Claude tests, and file drops to infer user intent
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class IntentInferenceDaemon extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.sources = {
            chatlogs: options.chatlogPath || './chatlogs',
            loops: options.loopsPath || './loop',
            whispers: options.whispersPath || './memory',
            claude_tests: options.claudeTestsPath || './results/claude-tests',
            file_drops: options.fileDropsPath || './queue',
            classifications: options.classificationsPath || './logs/classified_files.json'
        };
        
        this.outputFile = options.outputFile || './intent/current_state.json';
        this.historyFile = options.historyFile || './intent/intent_history.json';
        
        this.currentIntent = null;
        this.intentHistory = [];
        this.evidence = new Map();
        
        this.inferenceRules = {
            // Intent pattern matching
            patterns: {
                'build_ai_narrative_agent': {
                    keywords: ['narrative', 'agent', 'emotional', 'tone', 'story', 'character', 'personality'],
                    phrases: ['narrative agent', 'emotional tone', 'story generation', 'character development'],
                    files: ['agent', 'whisper', 'loop'],
                    confidence_weight: 0.9
                },
                'create_reflection_engine': {
                    keywords: ['reflection', 'mirror', 'engine', 'memory', 'state', 'consciousness'],
                    phrases: ['reflection engine', 'mirror system', 'consciousness loop', 'memory state'],
                    files: ['agent', 'loop', 'memory'],
                    confidence_weight: 0.85
                },
                'build_loop_system': {
                    keywords: ['loop', 'cycle', 'iteration', 'spawn', 'blessed', 'agent'],
                    phrases: ['loop system', 'agent spawn', 'blessing logic', 'loop cycle'],
                    files: ['loop', 'agent', 'whisper'],
                    confidence_weight: 0.8
                },
                'develop_claude_integration': {
                    keywords: ['claude', 'prompt', 'test', 'response', 'execution', 'runner'],
                    phrases: ['claude integration', 'prompt execution', 'test runner', 'claude response'],
                    files: ['claude_prompt', 'test_output', 'config'],
                    confidence_weight: 0.75
                },
                'create_mask_system': {
                    keywords: ['mask', 'persona', 'identity', 'character', 'role', 'disguise'],
                    phrases: ['mask system', 'persona management', 'identity switching', 'character masks'],
                    files: ['agent', 'config', 'whisper'],
                    confidence_weight: 0.7
                },
                'build_monitoring_system': {
                    keywords: ['monitor', 'health', 'validation', 'status', 'diagnostic', 'check'],
                    phrases: ['monitoring system', 'health check', 'system validation', 'diagnostic'],
                    files: ['test_output', 'config', 'agent'],
                    confidence_weight: 0.65
                },
                'develop_path_management': {
                    keywords: ['path', 'file', 'directory', 'folder', 'symlink', 'mirror'],
                    phrases: ['path management', 'file system', 'symlink mirror', 'directory structure'],
                    files: ['config', 'hidden_system', 'tier_structure'],
                    confidence_weight: 0.6
                },
                'create_blessing_system': {
                    keywords: ['blessing', 'approval', 'permission', 'trust', 'signature', 'authority'],
                    phrases: ['blessing system', 'approval process', 'trust chain', 'permission management'],
                    files: ['hidden_system', 'agent', 'config'],
                    confidence_weight: 0.55
                }
            },
            
            // Context modifiers
            modifiers: {
                recent_activity: 1.2,    // Boost recent evidence
                file_creation: 1.15,     // New files suggest active development
                claude_interaction: 1.1,  // Claude tests suggest current focus
                multiple_sources: 1.3,   // Evidence from multiple sources
                code_patterns: 1.25,     // Actual code implementation
                prd_documents: 1.4       // PRD suggests planned development
            }
        };
        
        this.stats = {
            inferences_made: 0,
            evidence_sources: 0,
            files_analyzed: 0,
            last_inference: null,
            confidence_avg: 0
        };
        
        this.initializeDaemon();
    }

    async initializeDaemon() {
        console.log('🔮 Initializing Intent Inference Daemon...');
        
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Load previous state
            await this.loadState();
            
            // Perform initial inference
            await this.performInference();
            
            // Start periodic inference
            this.startPeriodicInference();
            
            console.log('✅ Intent Inference Daemon initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('💀 Intent inference initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async ensureDirectories() {
        const dirs = [
            path.dirname(this.outputFile),
            path.dirname(this.historyFile),
            './intent/evidence',
            './intent/analysis'
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    async loadState() {
        if (fs.existsSync(this.historyFile)) {
            try {
                const history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
                this.intentHistory = history.intents || [];
                this.stats = { ...this.stats, ...history.stats };
                
                console.log(`📊 Loaded intent history: ${this.intentHistory.length} previous inferences`);
                
            } catch (error) {
                console.warn('⚠️ Failed to load intent history, starting fresh');
            }
        }
    }

    async saveState() {
        const state = {
            timestamp: new Date().toISOString(),
            current_intent: this.currentIntent,
            intents: this.intentHistory,
            stats: this.stats
        };
        
        try {
            // Save current state
            fs.writeFileSync(this.outputFile, JSON.stringify(this.currentIntent || {}, null, 2));
            
            // Save history
            fs.writeFileSync(this.historyFile, JSON.stringify(state, null, 2));
            
        } catch (error) {
            console.error('Failed to save intent state:', error.message);
        }
    }

    async performInference() {
        console.log('🧠 Performing intent inference analysis...');
        
        const startTime = Date.now();
        
        try {
            // Clear previous evidence
            this.evidence.clear();
            
            // Gather evidence from all sources
            await this.gatherEvidence();
            
            // Analyze evidence and infer intent
            const inference = await this.analyzeEvidence();
            
            // Update current intent if confidence is high enough
            if (inference.confidence > 0.3) {
                this.currentIntent = inference;
                this.intentHistory.push(inference);
                
                // Keep only recent history
                if (this.intentHistory.length > 50) {
                    this.intentHistory = this.intentHistory.slice(-50);
                }
            }
            
            // Update stats
            this.stats.inferences_made++;
            this.stats.last_inference = new Date().toISOString();
            this.stats.confidence_avg = this.stats.confidence_avg
                ? (this.stats.confidence_avg + inference.confidence) / 2
                : inference.confidence;
            
            const duration = Date.now() - startTime;
            
            console.log(`🎯 Inference complete: ${inference.intent} (${Math.round(inference.confidence * 100)}% confidence, ${duration}ms)`);
            
            // Save state
            await this.saveState();
            
            this.emit('intent-inferred', inference);
            
            return inference;
            
        } catch (error) {
            console.error('Intent inference failed:', error.message);
            throw error;
        }
    }

    async gatherEvidence() {
        console.log('📚 Gathering evidence from all sources...');
        
        // Source 1: Chatlogs
        await this.analyzeChatlogs();
        
        // Source 2: Loops and whispers
        await this.analyzeLoopsAndWhispers();
        
        // Source 3: Claude test logs
        await this.analyzeClaudeTests();
        
        // Source 4: File classifications
        await this.analyzeFileClassifications();
        
        // Source 5: Recent file activity
        await this.analyzeRecentActivity();
        
        this.stats.evidence_sources = this.evidence.size;
    }

    async analyzeChatlogs() {
        const chatlogPath = this.sources.chatlogs;
        
        if (!fs.existsSync(chatlogPath)) return;
        
        try {
            const files = fs.readdirSync(chatlogPath);
            const chatFiles = files.filter(f => f.endsWith('.txt') || f.endsWith('.log'));
            
            for (const file of chatFiles.slice(-5)) { // Last 5 chat files
                const filePath = path.join(chatlogPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                this.extractEvidenceFromText(content, {
                    source: `chatlog:${file}`,
                    type: 'conversation',
                    recency: this.getFileRecency(filePath),
                    weight: 1.0
                });
            }
            
        } catch (error) {
            console.warn('Failed to analyze chatlogs:', error.message);
        }
    }

    async analyzeLoopsAndWhispers() {
        // Analyze loop files
        const loopPath = this.sources.loops;
        if (fs.existsSync(loopPath)) {
            try {
                const files = fs.readdirSync(loopPath);
                const loopFiles = files.filter(f => f.endsWith('.json') || f.includes('loop'));
                
                for (const file of loopFiles.slice(-10)) { // Last 10 loop files
                    const filePath = path.join(loopPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    this.extractEvidenceFromText(content, {
                        source: `loop:${file}`,
                        type: 'loop_definition',
                        recency: this.getFileRecency(filePath),
                        weight: 0.8
                    });
                }
                
            } catch (error) {
                console.warn('Failed to analyze loops:', error.message);
            }
        }
        
        // Analyze whisper/memory files
        const memoryPath = this.sources.whispers;
        if (fs.existsSync(memoryPath)) {
            try {
                const files = fs.readdirSync(memoryPath);
                const memoryFiles = files.filter(f => f.includes('whisper') || f.includes('state'));
                
                for (const file of memoryFiles.slice(-5)) { // Last 5 memory files
                    const filePath = path.join(memoryPath, file);
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    this.extractEvidenceFromText(content, {
                        source: `memory:${file}`,
                        type: 'memory_state',
                        recency: this.getFileRecency(filePath),
                        weight: 0.7
                    });
                }
                
            } catch (error) {
                console.warn('Failed to analyze memory files:', error.message);
            }
        }
    }

    async analyzeClaudeTests() {
        const claudePath = this.sources.claude_tests;
        
        if (!fs.existsSync(claudePath)) return;
        
        try {
            const files = fs.readdirSync(claudePath);
            const testFiles = files.filter(f => f.endsWith('.json') || f.endsWith('.log'));
            
            for (const file of testFiles.slice(-10)) { // Last 10 test files
                const filePath = path.join(claudePath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                this.extractEvidenceFromText(content, {
                    source: `claude_test:${file}`,
                    type: 'claude_interaction',
                    recency: this.getFileRecency(filePath),
                    weight: 1.1
                });
            }
            
        } catch (error) {
            console.warn('Failed to analyze Claude tests:', error.message);
        }
    }

    async analyzeFileClassifications() {
        const classificationFile = this.sources.classifications;
        
        if (!fs.existsSync(classificationFile)) return;
        
        try {
            const data = JSON.parse(fs.readFileSync(classificationFile, 'utf8'));
            const classifications = data.classifications || [];
            
            // Group by file type
            const typeCounts = {};
            const recentFiles = {};
            
            for (const classification of classifications) {
                const type = classification.type;
                typeCounts[type] = (typeCounts[type] || 0) + 1;
                
                // Track most recent file of each type
                if (!recentFiles[type] || classification.timestamp > recentFiles[type].timestamp) {
                    recentFiles[type] = classification;
                }
            }
            
            // Extract evidence from file patterns
            for (const [type, count] of Object.entries(typeCounts)) {
                const evidence = {
                    pattern: `file_type_${type}`,
                    count: count,
                    recent_file: recentFiles[type]?.filename,
                    weight: Math.min(count * 0.1, 1.0)
                };
                
                this.evidence.set(`file_pattern:${type}`, evidence);
            }
            
        } catch (error) {
            console.warn('Failed to analyze file classifications:', error.message);
        }
    }

    async analyzeRecentActivity() {
        // Look for recent file changes across all watch paths
        const recentCutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        
        const watchPaths = [
            __dirname,
            './agents',
            './loop', 
            './memory',
            './queue',
            './runtime'
        ];
        
        for (const watchPath of watchPaths) {
            if (fs.existsSync(watchPath)) {
                await this.scanForRecentFiles(watchPath, recentCutoff);
            }
        }
    }

    async scanForRecentFiles(dirPath, recentCutoff, depth = 0) {
        if (depth > 2) return;
        
        try {
            const items = fs.readdirSync(dirPath);
            
            for (const item of items) {
                if (item.startsWith('.git') || item.startsWith('node_modules')) continue;
                
                const fullPath = path.join(dirPath, item);
                const stats = fs.lstatSync(fullPath);
                
                if (stats.isFile() && stats.mtime.getTime() > recentCutoff) {
                    // Recent file activity
                    const relativePath = path.relative(__dirname, fullPath);
                    
                    this.evidence.set(`recent_activity:${relativePath}`, {
                        file: relativePath,
                        modified: stats.mtime.toISOString(),
                        type: 'recent_activity',
                        weight: 0.5
                    });
                    
                } else if (stats.isDirectory()) {
                    await this.scanForRecentFiles(fullPath, recentCutoff, depth + 1);
                }
            }
            
        } catch (error) {
            // Ignore permission errors
        }
    }

    extractEvidenceFromText(text, metadata) {
        const textLower = text.toLowerCase();
        
        // Extract evidence for each intent pattern
        for (const [intentType, pattern] of Object.entries(this.inferenceRules.patterns)) {
            let score = 0;
            const matches = [];
            
            // Check keywords
            for (const keyword of pattern.keywords) {
                const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                const keywordMatches = text.match(regex);
                if (keywordMatches) {
                    score += keywordMatches.length * 1;
                    matches.push(...keywordMatches);
                }
            }
            
            // Check phrases (higher weight)
            for (const phrase of pattern.phrases) {
                const regex = new RegExp(phrase.replace(/\s+/g, '\\s+'), 'gi');
                const phraseMatches = text.match(regex);
                if (phraseMatches) {
                    score += phraseMatches.length * 3;
                    matches.push(...phraseMatches);
                }
            }
            
            if (score > 0) {
                const evidenceKey = `${intentType}:${metadata.source}`;
                
                this.evidence.set(evidenceKey, {
                    intent: intentType,
                    source: metadata.source,
                    type: metadata.type,
                    score: score,
                    matches: matches,
                    weight: metadata.weight,
                    recency: metadata.recency || 1.0,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    getFileRecency(filePath) {
        try {
            const stats = fs.statSync(filePath);
            const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
            
            // Recency decay: 1.0 for <1 hour, 0.5 for 24 hours, 0.1 for 7 days
            if (ageHours < 1) return 1.0;
            if (ageHours < 24) return 0.8;
            if (ageHours < 168) return 0.5; // 7 days
            return 0.2;
            
        } catch (error) {
            return 0.5; // Default recency
        }
    }

    async analyzeEvidence() {
        console.log('🔍 Analyzing gathered evidence...');
        
        const intentScores = {};
        const evidenceSummary = {};
        
        // Calculate scores for each intent
        for (const [intentType, pattern] of Object.entries(this.inferenceRules.patterns)) {
            intentScores[intentType] = 0;
            evidenceSummary[intentType] = {
                sources: [],
                total_matches: 0,
                weighted_score: 0
            };
        }
        
        // Process all evidence
        for (const [key, evidence] of this.evidence.entries()) {
            if (evidence.intent && intentScores.hasOwnProperty(evidence.intent)) {
                const pattern = this.inferenceRules.patterns[evidence.intent];
                
                // Calculate weighted score
                let weightedScore = evidence.score * evidence.weight * evidence.recency;
                
                // Apply modifiers
                if (evidence.type === 'claude_interaction') {
                    weightedScore *= this.inferenceRules.modifiers.claude_interaction;
                }
                if (evidence.type === 'recent_activity') {
                    weightedScore *= this.inferenceRules.modifiers.recent_activity;
                }
                
                intentScores[evidence.intent] += weightedScore * pattern.confidence_weight;
                
                evidenceSummary[evidence.intent].sources.push(evidence.source);
                evidenceSummary[evidence.intent].total_matches += evidence.matches?.length || 1;
                evidenceSummary[evidence.intent].weighted_score += weightedScore;
            }
        }
        
        // Find best intent
        const bestIntent = Object.entries(intentScores).reduce((best, [intent, score]) => 
            score > best.score ? { intent, score } : best, 
            { intent: 'unknown', score: 0 }
        );
        
        // Calculate confidence (normalize to 0-1)
        const maxPossibleScore = 100; // Rough estimate
        const confidence = Math.min(bestIntent.score / maxPossibleScore, 1.0);
        
        // Build inference result
        const inference = {
            intent: this.humanizeIntent(bestIntent.intent),
            intent_type: bestIntent.intent,
            detected_from: evidenceSummary[bestIntent.intent]?.sources || [],
            confidence: confidence,
            evidence_summary: evidenceSummary[bestIntent.intent],
            all_scores: intentScores,
            timestamp: new Date().toISOString(),
            analysis: {
                total_evidence_items: this.evidence.size,
                top_sources: this.getTopSources(),
                recent_activity: this.getRecentActivitySummary()
            }
        };
        
        return inference;
    }

    humanizeIntent(intentType) {
        const humanized = {
            'build_ai_narrative_agent': 'build an AI narrative agent that reacts to emotional tone and generates mask-based loops',
            'create_reflection_engine': 'create a reflection engine for agent consciousness and memory management',
            'build_loop_system': 'build a loop system for agent spawning and blessing workflows',
            'develop_claude_integration': 'develop Claude integration for automated prompt execution and testing',
            'create_mask_system': 'create a mask system for persona management and identity switching',
            'build_monitoring_system': 'build a monitoring system for health checks and system validation',
            'develop_path_management': 'develop path management and file system consistency tools',
            'create_blessing_system': 'create a blessing system for agent approval and trust management'
        };
        
        return humanized[intentType] || `develop ${intentType.replace(/_/g, ' ')}`;
    }

    getTopSources() {
        const sourceCounts = {};
        
        for (const evidence of this.evidence.values()) {
            const source = evidence.source?.split(':')[0] || 'unknown';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        }
        
        return Object.entries(sourceCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([source, count]) => ({ source, count }));
    }

    getRecentActivitySummary() {
        const recentEvidence = Array.from(this.evidence.values())
            .filter(e => e.type === 'recent_activity')
            .slice(0, 10);
        
        return {
            recent_files: recentEvidence.length,
            files: recentEvidence.map(e => e.file)
        };
    }

    startPeriodicInference() {
        // Run inference every 5 minutes
        setInterval(async () => {
            try {
                await this.performInference();
            } catch (error) {
                console.error('Periodic inference failed:', error.message);
            }
        }, 5 * 60 * 1000);
    }

    // API methods
    getCurrentIntent() {
        return this.currentIntent;
    }

    getIntentHistory() {
        return this.intentHistory.slice(-10); // Last 10 intents
    }

    getInferenceStats() {
        return {
            timestamp: new Date().toISOString(),
            current_intent: this.currentIntent,
            stats: this.stats,
            evidence_count: this.evidence.size,
            recent_intents: this.getIntentHistory()
        };
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up Intent Inference Daemon...');
        await this.saveState();
        this.removeAllListeners();
    }
}

module.exports = IntentInferenceDaemon;

// CLI execution
if (require.main === module) {
    const daemon = new IntentInferenceDaemon();
    
    daemon.on('initialized', () => {
        console.log('Intent Inference Daemon initialized successfully');
    });
    
    daemon.on('intent-inferred', (inference) => {
        console.log(`🎯 Intent detected: ${inference.intent} (${Math.round(inference.confidence * 100)}% confidence)`);
        console.log(`Evidence from: ${inference.detected_from.slice(0, 3).join(', ')}`);
    });
    
    daemon.on('error', (error) => {
        console.error('Intent daemon error:', error.message);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down intent daemon...');
        await daemon.cleanup();
        process.exit(0);
    });
}