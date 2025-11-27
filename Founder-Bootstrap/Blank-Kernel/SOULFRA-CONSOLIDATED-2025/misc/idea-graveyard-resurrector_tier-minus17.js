#!/usr/bin/env node

// IDEA GRAVEYARD RESURRECTOR
// Find, connect, and resurrect all your scattered ideas
// Built by a real founder who knows the grind

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const natural = require('natural');

class IdeaGraveyardResurrector {
    constructor() {
        this.graveyard = new Map();
        this.livingIdeas = new Map();
        this.industryMap = new Map();
        this.synergyNetwork = new Map();
        this.executionPaths = new Map();
        
        console.log('💀 Initializing Idea Graveyard Resurrector...');
        console.log('   Time to bring the dead ideas back to life...');
        console.log('   Built by someone who actually ships, not just raises...');
    }
    
    async initialize() {
        await this.setupIndustryClassifiers();
        await this.loadPatternRecognizers();
        await this.initializeSynergyEngine();
        
        console.log('⚡ Resurrector ready - Let\'s find those buried gems');
    }
    
    // Scan entire filesystem for ideas
    async scanGraveyard(rootPath) {
        console.log(`\n🔍 Scanning ${rootPath} for buried ideas...`);
        
        const stats = {
            filesScanned: 0,
            ideasFound: 0,
            connectionsFound: 0,
            industriesIdentified: new Set(),
            executionReady: 0
        };
        
        // Recursive scan
        await this.deepScan(rootPath, stats);
        
        // Analyze all found ideas
        await this.analyzeGraveyard();
        
        // Find synergies
        await this.findSynergies();
        
        // Generate execution paths
        await this.generateExecutionPaths();
        
        return {
            stats,
            ideas: Array.from(this.livingIdeas.values()),
            industries: this.getIndustryBreakdown(),
            synergies: this.getSynergyMap(),
            executionPaths: this.getTopExecutionPaths(),
            crossIndustryGold: await this.findCrossIndustryGold()
        };
    }
    
    async deepScan(dirPath, stats) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip node_modules and other noise
                    if (!entry.name.startsWith('.') && 
                        entry.name !== 'node_modules' && 
                        entry.name !== 'dist' &&
                        entry.name !== 'build') {
                        await this.deepScan(fullPath, stats);
                    }
                } else if (entry.isFile()) {
                    // Process various file types
                    if (this.isIdeaFile(entry.name)) {
                        await this.processFile(fullPath, stats);
                    }
                }
            }
        } catch (err) {
            // Keep going even if some directories are inaccessible
            console.log(`⚠️  Skipping ${dirPath}: ${err.message}`);
        }
    }
    
    isIdeaFile(filename) {
        const extensions = [
            '.txt', '.md', '.js', '.py', '.json', '.yaml', '.yml',
            '.doc', '.docx', '.pdf', '.rtf', '.org', '.tex',
            '.todo', '.notes', '.ideas', '.plan', '.strategy'
        ];
        
        return extensions.some(ext => filename.endsWith(ext));
    }
    
    async processFile(filepath, stats) {
        stats.filesScanned++;
        
        try {
            const content = await fs.readFile(filepath, 'utf8');
            const ideas = await this.extractIdeas(content, filepath);
            
            for (const idea of ideas) {
                stats.ideasFound++;
                this.graveyard.set(idea.id, idea);
                
                // Classify industry
                const industry = await this.classifyIndustry(idea);
                stats.industriesIdentified.add(industry);
                
                // Check execution readiness
                if (await this.isExecutionReady(idea)) {
                    stats.executionReady++;
                }
            }
        } catch (err) {
            // Binary files or unreadable - skip
        }
    }
    
    async extractIdeas(content, filepath) {
        const ideas = [];
        const lines = content.split('\n');
        
        // Multiple extraction strategies
        const extractors = [
            this.extractExplicitIdeas,
            this.extractImplicitIdeas,
            this.extractTODOs,
            this.extractQuestions,
            this.extractProblems,
            this.extractOpportunities
        ];
        
        for (const extractor of extractors) {
            const extracted = await extractor.call(this, lines, content, filepath);
            ideas.push(...extracted);
        }
        
        // Deduplicate similar ideas
        return this.deduplicateIdeas(ideas);
    }
    
    async extractExplicitIdeas(lines, content, filepath) {
        const ideas = [];
        const patterns = [
            /idea:/i,
            /concept:/i,
            /what if/i,
            /we could/i,
            /imagine if/i,
            /opportunity:/i,
            /innovation:/i,
            /disruption:/i,
            /game.?changer:/i
        ];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            for (const pattern of patterns) {
                if (pattern.test(line)) {
                    // Capture context (surrounding lines)
                    const context = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join('\n');
                    
                    ideas.push({
                        id: crypto.randomUUID(),
                        type: 'explicit',
                        content: line.trim(),
                        context,
                        file: filepath,
                        line: i + 1,
                        confidence: 0.9,
                        timestamp: await this.getFileTime(filepath),
                        tags: await this.extractTags(context)
                    });
                }
            }
        }
        
        return ideas;
    }
    
    async extractTODOs(lines, content, filepath) {
        const ideas = [];
        const patterns = [
            /TODO:/i,
            /FIXME:/i,
            /HACK:/i,
            /NOTE:/i,
            /IMPORTANT:/i,
            /\[\s*\]/,  // Unchecked checkbox
            /- \[ \]/   // Markdown checkbox
        ];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            for (const pattern of patterns) {
                if (pattern.test(line)) {
                    const ideaContent = line.replace(pattern, '').trim();
                    
                    if (ideaContent.length > 10) { // Filter out trivial TODOs
                        ideas.push({
                            id: crypto.randomUUID(),
                            type: 'todo',
                            content: ideaContent,
                            context: line,
                            file: filepath,
                            line: i + 1,
                            confidence: 0.7,
                            timestamp: await this.getFileTime(filepath),
                            tags: ['todo', 'actionable']
                        });
                    }
                }
            }
        }
        
        return ideas;
    }
    
    async extractQuestions(lines, content, filepath) {
        const ideas = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Look for meaningful questions
            if (line.includes('?') && line.length > 20) {
                // Check if it's a strategic question
                const strategicKeywords = [
                    'how', 'why', 'what if', 'could we', 'should we',
                    'market', 'user', 'customer', 'revenue', 'scale',
                    'build', 'create', 'solve', 'improve'
                ];
                
                const isStrategic = strategicKeywords.some(keyword => 
                    line.toLowerCase().includes(keyword)
                );
                
                if (isStrategic) {
                    ideas.push({
                        id: crypto.randomUUID(),
                        type: 'question',
                        content: line.trim(),
                        context: lines.slice(Math.max(0, i - 1), Math.min(lines.length, i + 2)).join('\n'),
                        file: filepath,
                        line: i + 1,
                        confidence: 0.6,
                        timestamp: await this.getFileTime(filepath),
                        tags: ['question', 'exploration']
                    });
                }
            }
        }
        
        return ideas;
    }
    
    async classifyIndustry(idea) {
        const industryKeywords = {
            'fintech': ['payment', 'finance', 'banking', 'money', 'transaction', 'crypto', 'defi'],
            'healthtech': ['health', 'medical', 'patient', 'doctor', 'therapy', 'wellness', 'fitness'],
            'edtech': ['education', 'learning', 'student', 'teacher', 'course', 'training'],
            'proptech': ['real estate', 'property', 'housing', 'rent', 'mortgage', 'building'],
            'agtech': ['agriculture', 'farming', 'crop', 'food', 'sustainability'],
            'marketplace': ['marketplace', 'buyer', 'seller', 'platform', 'two-sided'],
            'saas': ['software', 'platform', 'tool', 'automation', 'workflow', 'productivity'],
            'ai/ml': ['ai', 'machine learning', 'neural', 'model', 'algorithm', 'intelligence'],
            'social': ['social', 'community', 'network', 'connect', 'share', 'collaborate'],
            'gaming': ['game', 'player', 'virtual', 'metaverse', 'nft', 'play'],
            'ecommerce': ['shop', 'store', 'product', 'cart', 'checkout', 'delivery'],
            'transport': ['transport', 'logistics', 'delivery', 'shipping', 'vehicle', 'mobility']
        };
        
        const content = (idea.content + ' ' + idea.context).toLowerCase();
        const scores = {};
        
        for (const [industry, keywords] of Object.entries(industryKeywords)) {
            scores[industry] = keywords.filter(keyword => content.includes(keyword)).length;
        }
        
        // Find highest scoring industry
        const topIndustry = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])[0];
        
        return topIndustry[1] > 0 ? topIndustry[0] : 'general';
    }
    
    async analyzeGraveyard() {
        console.log('\n⚡ Resurrecting ideas from the graveyard...');
        
        for (const [id, idea] of this.graveyard) {
            // Enhance idea with analysis
            const enhanced = {
                ...idea,
                industry: await this.classifyIndustry(idea),
                viability: await this.assessViability(idea),
                complexity: await this.assessComplexity(idea),
                marketSize: await this.estimateMarketSize(idea),
                executionPath: await this.sketchExecutionPath(idea),
                relatedIdeas: []
            };
            
            this.livingIdeas.set(id, enhanced);
            
            // Add to industry map
            if (!this.industryMap.has(enhanced.industry)) {
                this.industryMap.set(enhanced.industry, []);
            }
            this.industryMap.get(enhanced.industry).push(enhanced);
        }
    }
    
    async findSynergies() {
        console.log('\n🔗 Finding synergies between ideas...');
        
        const ideas = Array.from(this.livingIdeas.values());
        
        for (let i = 0; i < ideas.length; i++) {
            for (let j = i + 1; j < ideas.length; j++) {
                const synergy = await this.calculateSynergy(ideas[i], ideas[j]);
                
                if (synergy.score > 0.6) {
                    const synergyId = `${ideas[i].id}-${ideas[j].id}`;
                    this.synergyNetwork.set(synergyId, {
                        idea1: ideas[i],
                        idea2: ideas[j],
                        score: synergy.score,
                        type: synergy.type,
                        description: synergy.description,
                        combined: await this.generateCombinedIdea(ideas[i], ideas[j])
                    });
                    
                    // Update related ideas
                    ideas[i].relatedIdeas.push(ideas[j].id);
                    ideas[j].relatedIdeas.push(ideas[i].id);
                }
            }
        }
    }
    
    async calculateSynergy(idea1, idea2) {
        // Multiple synergy types
        const synergyTypes = {
            complementary: await this.checkComplementary(idea1, idea2),
            amplifying: await this.checkAmplifying(idea1, idea2),
            enabling: await this.checkEnabling(idea1, idea2),
            crossIndustry: idea1.industry !== idea2.industry ? 0.3 : 0
        };
        
        const totalScore = Object.values(synergyTypes).reduce((a, b) => a + b, 0) / 
                          Object.keys(synergyTypes).length;
        
        const dominantType = Object.entries(synergyTypes)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        return {
            score: totalScore,
            type: dominantType,
            description: await this.describeSynergy(idea1, idea2, dominantType)
        };
    }
    
    async generateCombinedIdea(idea1, idea2) {
        return {
            title: `${this.extractCore(idea1)} + ${this.extractCore(idea2)}`,
            description: `Combine ${idea1.content} with ${idea2.content}`,
            potential: `Cross-pollinate ${idea1.industry} with ${idea2.industry}`,
            execution: await this.generateCombinedExecution(idea1, idea2)
        };
    }
    
    async findCrossIndustryGold() {
        const goldMines = [];
        
        for (const [synergyId, synergy] of this.synergyNetwork) {
            if (synergy.idea1.industry !== synergy.idea2.industry && synergy.score > 0.7) {
                goldMines.push({
                    industries: [synergy.idea1.industry, synergy.idea2.industry],
                    ideas: [synergy.idea1, synergy.idea2],
                    combined: synergy.combined,
                    score: synergy.score,
                    marketPotential: await this.assessCrossMarketPotential(synergy),
                    executionPlan: await this.generateExecutionPlan(synergy)
                });
            }
        }
        
        return goldMines.sort((a, b) => b.marketPotential - a.marketPotential);
    }
    
    async generateExecutionPaths() {
        console.log('\n🚀 Generating execution paths...');
        
        // Group ideas by complexity and viability
        const buckets = {
            quickWins: [],      // Low complexity, high viability
            strategic: [],      // High complexity, high viability
            experiments: [],    // Low complexity, medium viability
            moonshots: []       // High complexity, medium viability
        };
        
        for (const idea of this.livingIdeas.values()) {
            if (idea.complexity < 0.3 && idea.viability > 0.7) {
                buckets.quickWins.push(idea);
            } else if (idea.complexity > 0.7 && idea.viability > 0.7) {
                buckets.strategic.push(idea);
            } else if (idea.complexity < 0.3 && idea.viability > 0.4) {
                buckets.experiments.push(idea);
            } else if (idea.complexity > 0.7 && idea.viability > 0.4) {
                buckets.moonshots.push(idea);
            }
        }
        
        // Generate paths for each bucket
        for (const [bucketName, ideas] of Object.entries(buckets)) {
            if (ideas.length > 0) {
                this.executionPaths.set(bucketName, {
                    ideas: ideas.slice(0, 10), // Top 10 per bucket
                    strategy: await this.generateBucketStrategy(bucketName),
                    timeline: await this.generateTimeline(bucketName, ideas)
                });
            }
        }
    }
    
    getTopExecutionPaths() {
        const paths = [];
        
        for (const [bucket, data] of this.executionPaths) {
            paths.push({
                category: bucket,
                count: data.ideas.length,
                topIdeas: data.ideas.slice(0, 3),
                strategy: data.strategy,
                timeline: data.timeline
            });
        }
        
        return paths;
    }
    
    // Utility methods
    async getFileTime(filepath) {
        try {
            const stats = await fs.stat(filepath);
            return stats.mtime;
        } catch {
            return new Date();
        }
    }
    
    extractCore(idea) {
        // Extract core concept from idea
        const words = idea.content.split(' ');
        const importantWords = words.filter(word => 
            word.length > 4 && !['could', 'would', 'should', 'might'].includes(word.toLowerCase())
        );
        return importantWords.slice(0, 3).join(' ');
    }
    
    async assessViability(idea) {
        // Simple viability score based on various factors
        let score = 0.5; // Base score
        
        // Boost for actionable language
        if (/build|create|launch|ship|implement/i.test(idea.content)) {
            score += 0.1;
        }
        
        // Boost for specific details
        if (idea.content.length > 50) {
            score += 0.1;
        }
        
        // Boost for recent ideas
        const age = Date.now() - new Date(idea.timestamp).getTime();
        if (age < 30 * 24 * 60 * 60 * 1000) { // Less than 30 days
            score += 0.1;
        }
        
        return Math.min(score, 1);
    }
    
    async assessComplexity(idea) {
        // Estimate implementation complexity
        let complexity = 0.3; // Base complexity
        
        // Technical indicators
        if (/ai|ml|blockchain|quantum|distributed/i.test(idea.content)) {
            complexity += 0.2;
        }
        
        // Scale indicators
        if (/platform|ecosystem|marketplace|network/i.test(idea.content)) {
            complexity += 0.2;
        }
        
        // Regulatory indicators
        if (/finance|health|legal|compliance/i.test(idea.content)) {
            complexity += 0.1;
        }
        
        return Math.min(complexity, 1);
    }
}

// Export for use
module.exports = IdeaGraveyardResurrector;

// Run standalone
if (require.main === module) {
    const resurrector = new IdeaGraveyardResurrector();
    
    resurrector.initialize().then(async () => {
        // Scan from current directory or specified path
        const scanPath = process.argv[2] || '.';
        
        console.log(`\n🎯 Starting idea resurrection from: ${scanPath}`);
        console.log('   Built by a real founder who ships, not just pitches\n');
        
        const results = await resurrector.scanGraveyard(scanPath);
        
        console.log('\n📊 RESURRECTION COMPLETE:');
        console.log(`   Files scanned: ${results.stats.filesScanned}`);
        console.log(`   Ideas found: ${results.stats.ideasFound}`);
        console.log(`   Industries: ${results.stats.industriesIdentified.size}`);
        console.log(`   Execution ready: ${results.stats.executionReady}`);
        console.log(`   Cross-industry gold: ${results.crossIndustryGold.length}`);
        
        if (results.crossIndustryGold.length > 0) {
            console.log('\n💎 TOP CROSS-INDUSTRY OPPORTUNITIES:');
            results.crossIndustryGold.slice(0, 3).forEach((gold, i) => {
                console.log(`\n${i + 1}. ${gold.industries.join(' + ')}`);
                console.log(`   ${gold.combined.title}`);
                console.log(`   Market potential: ${(gold.marketPotential * 100).toFixed(0)}%`);
            });
        }
        
        console.log('\n🚀 Ready to execute. Time to eat something better than PB&J.');
    }).catch(console.error);
}