#!/usr/bin/env node
/**
 * AIClusterParserFromCSV.js
 * Analyzes unified_runtime_table.csv to detect patterns, clusters, and generate suggestions
 * Outputs Claude-ready JSON and PRD suggestions for loop/agent creation
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class AIClusterParserFromCSV extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.csvFile = options.csvFile || './data/unified_runtime_table.csv';
        this.outputFile = options.outputFile || './agents/suggestions/from_csv.json';
        this.promptOutputFile = options.promptOutputFile || './queue/claude-cluster-analysis.prompt.txt';
        
        this.analysisRules = {
            tone_clusters: {
                // Group related tones for pattern detection
                positive: ['hopeful', 'curious', 'playful', 'confident', 'joyful'],
                negative: ['uncertain', 'anxious', 'frustrated', 'sad', 'angry'],
                mystical: ['mystical', 'mysterious', 'ethereal', 'dreamy', 'transcendent'],
                focused: ['determined', 'analytical', 'precise', 'methodical', 'strategic'],
                dramatic: ['intense', 'passionate', 'explosive', 'dramatic', 'theatrical']
            },
            
            pattern_thresholds: {
                min_cluster_size: 3,
                tone_drift_threshold: 0.7,
                loop_blessing_ratio: 0.6,
                agent_activity_days: 2,
                whisper_repeat_threshold: 3
            },
            
            suggestion_weights: {
                unblessed_loops: 0.9,
                stale_agents: 0.8,
                tone_dominance: 0.7,
                whisper_patterns: 0.6,
                failed_prompts: 0.5
            }
        };
        
        this.analysisData = {
            entries: [],
            patterns: {},
            suggestions: {},
            confidence: 0
        };
        
        this.stats = {
            total_entries: 0,
            entries_by_type: {},
            analysis_runs: 0,
            last_analysis: null,
            suggestions_generated: 0
        };
        
        this.initializeParser();
    }

    async initializeParser() {
        console.log('🧠 Initializing AI Cluster Parser from CSV...');
        
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Perform initial analysis if CSV exists
            if (fs.existsSync(this.csvFile)) {
                await this.analyzeCSV();
            }
            
            console.log('✅ AI Cluster Parser initialized');
            this.emit('initialized');
            
        } catch (error) {
            console.error('💀 AI cluster parser initialization failed:', error.message);
            this.emit('error', error);
        }
    }

    async ensureDirectories() {
        const dirs = [
            path.dirname(this.outputFile),
            path.dirname(this.promptOutputFile),
            './agents/suggestions',
            './queue',
            './data'
        ];
        
        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

    async analyzeCSV() {
        console.log('📊 Analyzing unified runtime table...');
        
        const startTime = Date.now();
        
        try {
            // Read and parse CSV
            await this.loadCSVData();
            
            // Perform pattern analysis
            await this.detectPatterns();
            
            // Generate suggestions
            await this.generateSuggestions();
            
            // Save results
            await this.saveAnalysis();
            
            // Generate Claude prompt if requested
            await this.generateClaudePrompt();
            
            const duration = Date.now() - startTime;
            this.stats.analysis_runs++;
            this.stats.last_analysis = new Date().toISOString();
            
            console.log(`🎯 Analysis complete: ${this.stats.suggestions_generated} suggestions (${duration}ms)`);
            this.emit('analysis-complete', this.analysisData);
            
        } catch (error) {
            console.error('Analysis failed:', error.message);
            throw error;
        }
    }

    async loadCSVData() {
        if (!fs.existsSync(this.csvFile)) {
            throw new Error(`CSV file not found: ${this.csvFile}`);
        }
        
        const content = fs.readFileSync(this.csvFile, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV file has no data rows');
        }
        
        // Parse header
        const headers = this.parseCSVRow(lines[0]);
        
        // Parse data rows
        this.analysisData.entries = [];
        for (let i = 1; i < lines.length; i++) {
            const fields = this.parseCSVRow(lines[i]);
            if (fields.length >= headers.length) {
                const entry = {};
                headers.forEach((header, idx) => {
                    entry[header] = fields[idx] || '';
                });
                
                // Parse timestamp
                if (entry.timestamp) {
                    entry.parsed_timestamp = new Date(entry.timestamp);
                }
                
                this.analysisData.entries.push(entry);
            }
        }
        
        this.stats.total_entries = this.analysisData.entries.length;
        
        // Count by type
        this.stats.entries_by_type = {};
        this.analysisData.entries.forEach(entry => {
            const type = entry.type || 'unknown';
            this.stats.entries_by_type[type] = (this.stats.entries_by_type[type] || 0) + 1;
        });
        
        console.log(`📈 Loaded ${this.stats.total_entries} entries from CSV`);
    }

    parseCSVRow(row) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                if (inQuotes && row[i + 1] === '"') {
                    currentField += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                fields.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
        
        fields.push(currentField); // Add last field
        return fields;
    }

    async detectPatterns() {
        console.log('🔍 Detecting runtime patterns...');
        
        this.analysisData.patterns = {
            tone_analysis: this.analyzeToneClusters(),
            loop_analysis: this.analyzeLoopPatterns(),
            agent_analysis: this.analyzeAgentActivity(),
            whisper_analysis: this.analyzeWhisperPatterns(),
            prompt_analysis: this.analyzePromptSuccess(),
            temporal_analysis: this.analyzeTemporalPatterns()
        };
    }

    analyzeToneClusters() {
        const toneCount = {};
        const clusterCount = {};
        const recentTones = [];
        
        // Count tones and identify clusters
        this.analysisData.entries.forEach(entry => {
            const tone = entry.tone;
            if (tone && tone !== 'null') {
                toneCount[tone] = (toneCount[tone] || 0) + 1;
                
                // Track recent tones for drift analysis
                if (entry.parsed_timestamp && entry.parsed_timestamp > Date.now() - 24 * 60 * 60 * 1000) {
                    recentTones.push(tone);
                }
                
                // Classify into clusters
                for (const [cluster, tones] of Object.entries(this.analysisRules.tone_clusters)) {
                    if (tones.includes(tone)) {
                        clusterCount[cluster] = (clusterCount[cluster] || 0) + 1;
                        break;
                    }
                }
            }
        });
        
        // Find dominant cluster
        const dominantCluster = Object.entries(clusterCount).reduce((max, [cluster, count]) => 
            count > max.count ? { cluster, count } : max, 
            { cluster: null, count: 0 }
        );
        
        // Calculate tone drift
        const toneDrift = this.calculateToneDrift(recentTones);
        
        return {
            tone_distribution: toneCount,
            cluster_distribution: clusterCount,
            dominant_cluster: dominantCluster,
            recent_tone_drift: toneDrift,
            needs_balance: dominantCluster.count > this.analysisData.entries.length * 0.5
        };
    }

    calculateToneDrift(recentTones) {
        if (recentTones.length < 2) return 0;
        
        const uniqueTones = new Set(recentTones);
        const toneVariety = uniqueTones.size / recentTones.length;
        
        return 1 - toneVariety; // Higher drift = less variety
    }

    analyzeLoopPatterns() {
        const loops = this.analysisData.entries.filter(e => e.type === 'loop');
        const blessedLoops = loops.filter(l => l.status === 'blessed');
        const unblessedLoops = loops.filter(l => l.status === 'pending');
        
        const loopAgents = {};
        loops.forEach(loop => {
            const agent = loop.agent;
            if (!loopAgents[agent]) {
                loopAgents[agent] = { total: 0, blessed: 0 };
            }
            loopAgents[agent].total++;
            if (loop.status === 'blessed') {
                loopAgents[agent].blessed++;
            }
        });
        
        return {
            total_loops: loops.length,
            blessed_count: blessedLoops.length,
            unblessed_count: unblessedLoops.length,
            blessing_ratio: loops.length > 0 ? blessedLoops.length / loops.length : 0,
            unblessed_loops: unblessedLoops.map(l => l.file).slice(0, 5),
            agent_loop_stats: loopAgents,
            needs_blessing: unblessedLoops.length > loops.length * 0.4
        };
    }

    analyzeAgentActivity() {
        const cutoffTime = Date.now() - this.analysisRules.pattern_thresholds.agent_activity_days * 24 * 60 * 60 * 1000;
        
        const agentActivity = {};
        this.analysisData.entries.forEach(entry => {
            const agent = entry.agent;
            if (agent && agent !== 'null') {
                if (!agentActivity[agent]) {
                    agentActivity[agent] = {
                        total_entries: 0,
                        recent_entries: 0,
                        last_activity: null,
                        types: new Set()
                    };
                }
                
                agentActivity[agent].total_entries++;
                agentActivity[agent].types.add(entry.type);
                
                if (entry.parsed_timestamp) {
                    if (entry.parsed_timestamp.getTime() > cutoffTime) {
                        agentActivity[agent].recent_entries++;
                    }
                    
                    if (!agentActivity[agent].last_activity || 
                        entry.parsed_timestamp > agentActivity[agent].last_activity) {
                        agentActivity[agent].last_activity = entry.parsed_timestamp;
                    }
                }
            }
        });
        
        // Find stale agents
        const staleAgents = Object.entries(agentActivity)
            .filter(([agent, stats]) => stats.recent_entries === 0)
            .map(([agent, stats]) => agent);
        
        return {
            agent_activity: agentActivity,
            stale_agents: staleAgents,
            active_agents: Object.keys(agentActivity).length - staleAgents.length,
            needs_agent_attention: staleAgents.length > 0
        };
    }

    analyzeWhisperPatterns() {
        const whispers = this.analysisData.entries.filter(e => e.type === 'whisper');
        
        // Group whispers by tone and agent
        const whisperGroups = {};
        whispers.forEach(whisper => {
            const key = `${whisper.tone}-${whisper.agent}`;
            if (!whisperGroups[key]) {
                whisperGroups[key] = [];
            }
            whisperGroups[key].push(whisper);
        });
        
        // Find repetitive patterns
        const repetitivePatterns = Object.entries(whisperGroups)
            .filter(([key, group]) => group.length >= this.analysisRules.pattern_thresholds.whisper_repeat_threshold)
            .map(([key, group]) => ({
                pattern: key,
                count: group.length,
                suggestion: `Consider merging or forking ${key} whispers`
            }));
        
        return {
            total_whispers: whispers.length,
            whisper_groups: Object.keys(whisperGroups).length,
            repetitive_patterns: repetitivePatterns,
            needs_whisper_review: repetitivePatterns.length > 0
        };
    }

    analyzePromptSuccess() {
        const prompts = this.analysisData.entries.filter(e => e.type === 'prompt');
        const executedPrompts = prompts.filter(p => p.status === 'executed');
        const failedPrompts = prompts.filter(p => p.status === 'failed');
        
        return {
            total_prompts: prompts.length,
            executed_count: executedPrompts.length,
            failed_count: failedPrompts.length,
            success_ratio: prompts.length > 0 ? executedPrompts.length / prompts.length : 0,
            failed_prompts: failedPrompts.map(p => p.file).slice(0, 5),
            needs_prompt_review: failedPrompts.length > prompts.length * 0.3
        };
    }

    analyzeTemporalPatterns() {
        const hourlyActivity = {};
        const dailyActivity = {};
        
        this.analysisData.entries.forEach(entry => {
            if (entry.parsed_timestamp) {
                const hour = entry.parsed_timestamp.getHours();
                const day = entry.parsed_timestamp.toDateString();
                
                hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
                dailyActivity[day] = (dailyActivity[day] || 0) + 1;
            }
        });
        
        // Find peak activity times
        const peakHour = Object.entries(hourlyActivity).reduce((max, [hour, count]) => 
            count > max.count ? { hour: parseInt(hour), count } : max, 
            { hour: 0, count: 0 }
        );
        
        return {
            hourly_distribution: hourlyActivity,
            daily_distribution: dailyActivity,
            peak_hour: peakHour,
            activity_span_days: Object.keys(dailyActivity).length
        };
    }

    async generateSuggestions() {
        console.log('💡 Generating AI suggestions...');
        
        const patterns = this.analysisData.patterns;
        const suggestions = {
            suggested_loops: [],
            agent_to_review: null,
            stale_agents: [],
            cluster: null,
            whisper_repeats: [],
            confidence: 0
        };
        
        let confidenceScore = 0;
        let totalWeight = 0;
        
        // Suggest loops for unblessed items
        if (patterns.loop_analysis.needs_blessing) {
            patterns.loop_analysis.unblessed_loops.forEach(loopFile => {
                const loopId = path.basename(loopFile, '.json');
                suggestions.suggested_loops.push(`${loopId}-fork`);
            });
            
            confidenceScore += this.analysisRules.suggestion_weights.unblessed_loops;
            totalWeight += this.analysisRules.suggestion_weights.unblessed_loops;
        }
        
        // Identify stale agents
        if (patterns.agent_analysis.needs_agent_attention) {
            suggestions.stale_agents = patterns.agent_analysis.stale_agents;
            suggestions.agent_to_review = patterns.agent_analysis.stale_agents[0] || null;
            
            confidenceScore += this.analysisRules.suggestion_weights.stale_agents;
            totalWeight += this.analysisRules.suggestion_weights.stale_agents;
        }
        
        // Identify dominant tone cluster
        if (patterns.tone_analysis.needs_balance) {
            const dominant = patterns.tone_analysis.dominant_cluster;
            suggestions.cluster = `${dominant.cluster} (${dominant.count} entries)`;
            
            confidenceScore += this.analysisRules.suggestion_weights.tone_dominance;
            totalWeight += this.analysisRules.suggestion_weights.tone_dominance;
        }
        
        // Whisper pattern suggestions
        if (patterns.whisper_analysis.needs_whisper_review) {
            suggestions.whisper_repeats = patterns.whisper_analysis.repetitive_patterns
                .map(p => p.pattern);
            
            confidenceScore += this.analysisRules.suggestion_weights.whisper_patterns;
            totalWeight += this.analysisRules.suggestion_weights.whisper_patterns;
        }
        
        // Calculate final confidence
        suggestions.confidence = totalWeight > 0 ? confidenceScore / totalWeight : 0;
        
        this.analysisData.suggestions = suggestions;
        this.stats.suggestions_generated = Object.values(suggestions).filter(v => 
            Array.isArray(v) ? v.length > 0 : v !== null
        ).length;
        
        return suggestions;
    }

    async saveAnalysis() {
        const output = {
            timestamp: new Date().toISOString(),
            analysis_summary: this.analysisData.suggestions,
            detailed_patterns: this.analysisData.patterns,
            stats: this.stats,
            recommendations: this.generateRecommendations()
        };
        
        try {
            fs.writeFileSync(this.outputFile, JSON.stringify(output, null, 2));
            console.log(`💾 Analysis saved: ${this.outputFile}`);
        } catch (error) {
            console.error('Failed to save analysis:', error.message);
        }
    }

    generateRecommendations() {
        const recommendations = [];
        const patterns = this.analysisData.patterns;
        
        if (patterns.loop_analysis.needs_blessing) {
            recommendations.push({
                type: 'loop_blessing',
                priority: 'high',
                message: `${patterns.loop_analysis.unblessed_count} loops need blessing review`,
                action: 'Review and bless pending loops'
            });
        }
        
        if (patterns.agent_analysis.needs_agent_attention) {
            recommendations.push({
                type: 'agent_activity',
                priority: 'medium',
                message: `${patterns.agent_analysis.stale_agents.length} agents are inactive`,
                action: 'Prompt stale agents or create new activities'
            });
        }
        
        if (patterns.tone_analysis.needs_balance) {
            recommendations.push({
                type: 'tone_balance',
                priority: 'medium',
                message: `Tone cluster "${patterns.tone_analysis.dominant_cluster.cluster}" is dominating`,
                action: 'Introduce diverse tones to balance the system'
            });
        }
        
        return recommendations;
    }

    async generateClaudePrompt() {
        const promptContent = `You are Claude Code, connected to the Soulfra runtime.

You've been given a full runtime export in CSV format from the unified runtime table. The analysis has detected the following patterns:

## Current State Analysis:

**Entries Analyzed:** ${this.stats.total_entries}
**Analysis Confidence:** ${Math.round(this.analysisData.suggestions.confidence * 100)}%

**Loop Status:**
- Total loops: ${this.analysisData.patterns.loop_analysis.total_loops}
- Blessed: ${this.analysisData.patterns.loop_analysis.blessed_count}
- Unblessed: ${this.analysisData.patterns.loop_analysis.unblessed_count}
- Blessing ratio: ${Math.round(this.analysisData.patterns.loop_analysis.blessing_ratio * 100)}%

**Agent Activity:**
- Active agents: ${this.analysisData.patterns.agent_analysis.active_agents}
- Stale agents: ${this.analysisData.patterns.agent_analysis.stale_agents.join(', ') || 'none'}

**Tone Distribution:**
- Dominant cluster: ${this.analysisData.patterns.tone_analysis.dominant_cluster.cluster || 'balanced'}
- Recent tone drift: ${Math.round(this.analysisData.patterns.tone_analysis.recent_tone_drift * 100)}%

**Prompt Success:**
- Success ratio: ${Math.round(this.analysisData.patterns.prompt_analysis.success_ratio * 100)}%
- Failed prompts: ${this.analysisData.patterns.prompt_analysis.failed_count}

## Generated Suggestions:

${JSON.stringify(this.analysisData.suggestions, null, 2)}

## Your Task:

Please analyze this data and provide:

1. **Pattern Assessment**: What patterns do you see that need attention?
2. **Loop Recommendations**: Which loops should be prioritized for blessing or forking?
3. **Agent Suggestions**: How should stale agents be re-engaged?
4. **Tone Balancing**: What tones are needed to balance the current cluster dominance?
5. **Next Actions**: What specific actions should be taken in the next runtime cycle?

Format your response as actionable recommendations for the Soulfra system.`;
        
        try {
            fs.writeFileSync(this.promptOutputFile, promptContent);
            console.log(`📝 Claude prompt generated: ${this.promptOutputFile}`);
        } catch (error) {
            console.error('Failed to generate Claude prompt:', error.message);
        }
    }

    // API methods
    getAnalysisResults() {
        return {
            timestamp: new Date().toISOString(),
            suggestions: this.analysisData.suggestions,
            patterns: this.analysisData.patterns,
            stats: this.stats
        };
    }

    async forceAnalysis() {
        return await this.analyzeCSV();
    }

    // Cleanup
    async cleanup() {
        console.log('🧹 Cleaning up AI Cluster Parser...');
        this.removeAllListeners();
    }
}

module.exports = AIClusterParserFromCSV;

// CLI execution
if (require.main === module) {
    const parser = new AIClusterParserFromCSV();
    
    parser.on('initialized', () => {
        console.log('AI Cluster Parser initialized successfully');
    });
    
    parser.on('analysis-complete', (results) => {
        console.log('🎯 Analysis Complete:');
        console.log(`Suggestions: ${results.suggestions.confidence * 100}% confidence`);
        console.log(`Patterns detected: ${Object.keys(results.patterns).length}`);
        
        if (results.suggestions.suggested_loops.length > 0) {
            console.log('💡 Suggested loops:', results.suggestions.suggested_loops.join(', '));
        }
        
        if (results.suggestions.stale_agents.length > 0) {
            console.log('⚠️ Stale agents:', results.suggestions.stale_agents.join(', '));
        }
    });
    
    parser.on('error', (error) => {
        console.error('AI cluster parser error:', error.message);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\nShutting down AI cluster parser...');
        await parser.cleanup();
        process.exit(0);
    });
}