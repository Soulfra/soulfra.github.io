// Reflection Orchestrator - Coordinates tone matching and reasoning extraction
const fs = require('fs').promises;
const path = require('path');
const ToneMatcher = require('./tone-matcher');
const ReasoningExtractor = require('./reasoning-extractor');

class ReflectionOrchestrator {
    constructor() {
        this.toneMatcher = new ToneMatcher();
        this.reasoningExtractor = new ReasoningExtractor();
        this.memoryLogPath = path.join(__dirname, 'memory-log.json');
        this.vaultPath = path.join(__dirname, '../../tier-minus13/vault/memory');
        
        this.reflectionSession = {
            id: this.generateSessionId(),
            startTime: new Date().toISOString(),
            documents: [],
            results: {
                toneAnalysis: {},
                reasoningAnalysis: {},
                combinedInsights: [],
                recommendations: []
            }
        };
    }
    
    async initialize() {
        console.log('🔮 Initializing Cal\'s Reflection Engine...');
        
        try {
            // Initialize subsystems
            await this.toneMatcher.initialize();
            
            // Load memory log
            await this.loadMemoryLog();
            
            console.log('✅ Reflection Engine ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize reflection engine:', error.message);
            throw error;
        }
    }
    
    async reflectOnDocuments(documents) {
        console.log(`🧠 Beginning reflection on ${documents.length} documents...`);
        
        const reflectionResults = {
            session: this.reflectionSession,
            documents: [],
            aggregateAnalysis: {
                dominantTone: null,
                reasoningStyle: null,
                coherenceScore: 0,
                founderAlignment: 0
            },
            calInsights: [],
            agentRecommendations: []
        };
        
        // Process each document
        for (const doc of documents) {
            console.log(`\n📄 Reflecting on: ${doc.filename || doc.path}`);
            
            try {
                // Extract content
                const content = doc.content || doc;
                const docPath = doc.path || doc.filename || 'unknown';
                
                // Perform tone matching
                const toneAnalysis = await this.toneMatcher.matchDocumentTone(content, docPath);
                
                // Extract reasoning patterns
                const reasoningAnalysis = await this.reasoningExtractor.extractReasoning(content, docPath);
                
                // Combine analyses
                const combinedReflection = this.combineAnalyses(toneAnalysis, reasoningAnalysis);
                
                // Store results
                reflectionResults.documents.push({
                    path: docPath,
                    tone: toneAnalysis,
                    reasoning: reasoningAnalysis,
                    combined: combinedReflection
                });
                
                this.reflectionSession.documents.push(docPath);
                
            } catch (error) {
                console.error(`❌ Error reflecting on ${doc.filename}:`, error.message);
                reflectionResults.documents.push({
                    path: doc.filename || 'unknown',
                    error: error.message
                });
            }
        }
        
        // Generate aggregate analysis
        reflectionResults.aggregateAnalysis = await this.generateAggregateAnalysis(
            reflectionResults.documents
        );
        
        // Generate Cal's insights
        reflectionResults.calInsights = this.generateCalInsights(
            reflectionResults.documents,
            reflectionResults.aggregateAnalysis
        );
        
        // Generate agent recommendations
        reflectionResults.agentRecommendations = this.generateAgentRecommendations(
            reflectionResults.aggregateAnalysis,
            reflectionResults.calInsights
        );
        
        // Update memory log
        await this.updateMemoryLog(reflectionResults);
        
        // Generate export-ready summary
        reflectionResults.summary = this.generateReflectionSummary(reflectionResults);
        
        return reflectionResults;
    }
    
    combineAnalyses(toneAnalysis, reasoningAnalysis) {
        const combined = {
            profile: {
                tone: toneAnalysis.analysis.dominantTone,
                reasoning: reasoningAnalysis.metadata.dominantPatterns[0] || 'general',
                confidence: (toneAnalysis.confidence + reasoningAnalysis.metadata.coherenceScore) / 2
            },
            characteristics: [],
            agentPersonality: null
        };
        
        // Extract key characteristics
        if (toneAnalysis.analysis.dominantTone === 'founder') {
            combined.characteristics.push('Authentic founder voice');
            combined.characteristics.push('Direct and strategic communication');
        }
        
        if (reasoningAnalysis.insights.length > 3) {
            combined.characteristics.push('Rich logical structure');
            combined.characteristics.push(`${reasoningAnalysis.insights.length} extractable insights`);
        }
        
        // Suggest agent personality
        combined.agentPersonality = this.suggestAgentPersonality(
            toneAnalysis.analysis.dominantTone,
            reasoningAnalysis.metadata.dominantPatterns
        );
        
        return combined;
    }
    
    suggestAgentPersonality(dominantTone, dominantPatterns) {
        const personalities = {
            'founder+causal': {
                name: 'Strategic Advisor',
                description: 'Explains business decisions with founder-like authenticity',
                traits: ['candid', 'strategic', 'explanatory']
            },
            'technical+sequential': {
                name: 'Technical Guide',
                description: 'Step-by-step technical instruction with clear logic',
                traits: ['methodical', 'precise', 'instructional']
            },
            'conversational+comparative': {
                name: 'Friendly Analyst',
                description: 'Approachable analysis through relatable comparisons',
                traits: ['friendly', 'analytical', 'relatable']
            },
            'academic+analytical': {
                name: 'Research Assistant',
                description: 'Deep analytical examination with academic rigor',
                traits: ['thorough', 'objective', 'scholarly']
            },
            'emotional+narrative': {
                name: 'Empathetic Storyteller',
                description: 'Connects through personal stories and emotional intelligence',
                traits: ['empathetic', 'narrative', 'personal']
            }
        };
        
        const key = `${dominantTone}+${dominantPatterns[0]}`;
        return personalities[key] || {
            name: 'Adaptive Assistant',
            description: 'Flexible personality that adjusts to context',
            traits: [dominantTone, dominantPatterns[0], 'adaptive']
        };
    }
    
    async generateAggregateAnalysis(documentResults) {
        const validDocs = documentResults.filter(d => !d.error);
        
        if (validDocs.length === 0) {
            return {
                dominantTone: 'unknown',
                reasoningStyle: 'unknown',
                coherenceScore: 0,
                founderAlignment: 0
            };
        }
        
        // Aggregate tone scores
        const toneFrequency = {};
        validDocs.forEach(doc => {
            const tone = doc.tone.analysis.dominantTone;
            toneFrequency[tone] = (toneFrequency[tone] || 0) + 1;
        });
        
        const dominantTone = Object.entries(toneFrequency)
            .sort((a, b) => b[1] - a[1])[0][0];
        
        // Aggregate reasoning patterns
        const patternFrequency = {};
        validDocs.forEach(doc => {
            doc.reasoning.metadata.dominantPatterns.forEach(pattern => {
                patternFrequency[pattern] = (patternFrequency[pattern] || 0) + 1;
            });
        });
        
        const dominantPattern = Object.entries(patternFrequency)
            .sort((a, b) => b[1] - a[1])[0];
        
        // Calculate average scores
        const avgCoherence = validDocs.reduce((sum, doc) => 
            sum + doc.reasoning.metadata.coherenceScore, 0
        ) / validDocs.length;
        
        const avgFounderAlignment = validDocs.reduce((sum, doc) => 
            sum + (doc.tone.bestMatch.profile === 'founder_seed' ? doc.tone.bestMatch.score : 0), 0
        ) / validDocs.length;
        
        return {
            dominantTone: dominantTone,
            reasoningStyle: dominantPattern ? dominantPattern[0] : 'mixed',
            coherenceScore: avgCoherence,
            founderAlignment: avgFounderAlignment,
            documentConsistency: this.calculateConsistency(validDocs)
        };
    }
    
    calculateConsistency(documents) {
        if (documents.length < 2) return 1;
        
        // Check how similar documents are to each other
        let similaritySum = 0;
        let comparisons = 0;
        
        for (let i = 0; i < documents.length - 1; i++) {
            for (let j = i + 1; j < documents.length; j++) {
                const doc1 = documents[i];
                const doc2 = documents[j];
                
                // Compare tones
                const toneSimilarity = doc1.tone.analysis.dominantTone === doc2.tone.analysis.dominantTone ? 1 : 0.5;
                
                // Compare reasoning styles
                const pattern1 = doc1.reasoning.metadata.dominantPatterns[0];
                const pattern2 = doc2.reasoning.metadata.dominantPatterns[0];
                const patternSimilarity = pattern1 === pattern2 ? 1 : 0.5;
                
                similaritySum += (toneSimilarity + patternSimilarity) / 2;
                comparisons++;
            }
        }
        
        return comparisons > 0 ? similaritySum / comparisons : 0;
    }
    
    generateCalInsights(documents, aggregateAnalysis) {
        const insights = [];
        const validDocs = documents.filter(d => !d.error);
        
        // Insight about tone consistency
        if (aggregateAnalysis.documentConsistency > 0.8) {
            insights.push({
                type: 'consistency',
                insight: 'Your documents share a consistent voice and reasoning style. This will create a coherent agent personality.',
                confidence: 0.9,
                recommendation: 'Leverage this consistency for a strong, unified agent voice'
            });
        } else if (aggregateAnalysis.documentConsistency < 0.5) {
            insights.push({
                type: 'diversity',
                insight: 'Your documents show diverse tones and reasoning styles. This creates opportunities for multi-faceted agents.',
                confidence: 0.8,
                recommendation: 'Consider creating multiple specialized agents or one adaptive agent'
            });
        }
        
        // Insight about founder alignment
        if (aggregateAnalysis.founderAlignment > 0.7) {
            insights.push({
                type: 'authenticity',
                insight: 'Strong alignment with founder voice detected. Your agent will feel authentic and personal.',
                confidence: 0.95,
                recommendation: 'Emphasize personal anecdotes and direct communication in agent responses'
            });
        }
        
        // Insight about reasoning complexity
        const avgInsightCount = validDocs.reduce((sum, doc) => 
            sum + doc.reasoning.insights.length, 0
        ) / validDocs.length;
        
        if (avgInsightCount > 5) {
            insights.push({
                type: 'complexity',
                insight: 'Rich logical structure with multiple insights per document. Perfect for knowledge-intensive agents.',
                confidence: 0.85,
                recommendation: 'Create agents that can explain complex topics and relationships'
            });
        }
        
        // Document-specific insights
        validDocs.forEach(doc => {
            if (doc.combined.confidence > 0.8) {
                const personality = doc.combined.agentPersonality;
                insights.push({
                    type: 'document',
                    source: path.basename(doc.path),
                    insight: `Strong candidate for ${personality.name} agent type`,
                    traits: personality.traits,
                    confidence: doc.combined.confidence
                });
            }
        });
        
        // Meta-insight about the collection
        insights.push({
            type: 'meta',
            insight: this.generateMetaInsight(validDocs, aggregateAnalysis),
            confidence: 0.8,
            action: 'Use this understanding to guide agent creation'
        });
        
        return insights;
    }
    
    generateMetaInsight(documents, analysis) {
        const docCount = documents.length;
        const tone = analysis.dominantTone;
        const style = analysis.reasoningStyle;
        
        if (docCount > 10 && analysis.coherenceScore > 0.7) {
            return `This substantial collection (${docCount} documents) shows ${tone} tone with ${style} reasoning. You have enough content for a comprehensive knowledge agent.`;
        } else if (analysis.founderAlignment > 0.8) {
            return `These documents capture authentic founder perspective. An agent built from this will feel like a genuine extension of your voice.`;
        } else if (analysis.documentConsistency > 0.9) {
            return `Remarkably consistent document collection. This level of coherence suggests a well-defined domain or author voice.`;
        } else {
            return `Diverse collection with ${tone} tendencies and ${style} logic. Consider how this variety can create a more versatile agent.`;
        }
    }
    
    generateAgentRecommendations(aggregateAnalysis, calInsights) {
        const recommendations = [];
        
        // Primary recommendation based on dominant patterns
        const primaryRec = {
            type: 'primary',
            name: this.getRecommendedAgentName(aggregateAnalysis),
            description: this.getAgentDescription(aggregateAnalysis),
            implementation: {
                tone: aggregateAnalysis.dominantTone,
                reasoning: aggregateAnalysis.reasoningStyle,
                personality: this.suggestAgentPersonality(
                    aggregateAnalysis.dominantTone,
                    [aggregateAnalysis.reasoningStyle]
                )
            },
            exportFormat: 'cal-fork',
            estimatedValue: this.estimateAgentValue(aggregateAnalysis, calInsights)
        };
        
        recommendations.push(primaryRec);
        
        // Alternative recommendations
        if (aggregateAnalysis.documentConsistency < 0.7) {
            recommendations.push({
                type: 'alternative',
                name: 'Multi-Agent System',
                description: 'Create specialized agents for different document clusters',
                rationale: 'Your diverse content supports multiple specialized personalities',
                exportFormat: 'agent-suite'
            });
        }
        
        if (aggregateAnalysis.founderAlignment > 0.6) {
            recommendations.push({
                type: 'premium',
                name: 'Founder Twin',
                description: 'High-fidelity clone of founder communication style',
                rationale: 'Strong founder voice alignment enables authentic delegation',
                exportFormat: 'founder-mirror',
                premium: true
            });
        }
        
        // Usage recommendations
        recommendations.push({
            type: 'usage',
            scenarios: this.generateUsageScenarios(aggregateAnalysis, calInsights),
            integrations: ['slack', 'email', 'website', 'api'],
            monetization: this.suggestMonetization(primaryRec)
        });
        
        return recommendations;
    }
    
    getRecommendedAgentName(analysis) {
        const names = {
            'founder+causal': 'Strategic Advisor AI',
            'technical+sequential': 'Technical Guide AI',
            'conversational+analytical': 'Friendly Expert AI',
            'academic+evidential': 'Research Assistant AI',
            'emotional+narrative': 'Empathetic Companion AI'
        };
        
        const key = `${analysis.dominantTone}+${analysis.reasoningStyle}`;
        return names[key] || 'Custom Knowledge AI';
    }
    
    getAgentDescription(analysis) {
        if (analysis.founderAlignment > 0.7) {
            return 'An AI that captures your authentic voice and strategic thinking, perfect for scaling your expertise';
        } else if (analysis.coherenceScore > 0.8) {
            return 'A highly coherent AI assistant that maintains consistent logic and communication style';
        } else {
            return 'A versatile AI that adapts its communication style while maintaining your core knowledge';
        }
    }
    
    estimateAgentValue(analysis, insights) {
        let value = 0;
        
        // Base value from coherence and quality
        value += analysis.coherenceScore * 50;
        value += analysis.founderAlignment * 30;
        
        // Bonus for insights
        value += insights.length * 5;
        
        // Bonus for consistency
        if (analysis.documentConsistency > 0.8) value += 20;
        
        return {
            score: Math.round(value),
            tier: value > 80 ? 'premium' : value > 50 ? 'standard' : 'basic',
            price: value > 80 ? '$29.99' : value > 50 ? '$14.99' : '$9.99'
        };
    }
    
    generateUsageScenarios(analysis, insights) {
        const scenarios = [];
        
        if (analysis.dominantTone === 'founder') {
            scenarios.push({
                scenario: 'Founder Delegation',
                description: 'Let the AI handle routine inquiries in your voice',
                value: 'Save 10+ hours/week on repetitive communications'
            });
        }
        
        if (analysis.reasoningStyle === 'sequential') {
            scenarios.push({
                scenario: 'Process Documentation',
                description: 'AI guides users through complex procedures',
                value: 'Reduce support tickets by 40%'
            });
        }
        
        if (insights.some(i => i.type === 'complexity')) {
            scenarios.push({
                scenario: 'Knowledge Base',
                description: 'AI serves as intelligent documentation',
                value: 'Instant answers to technical questions'
            });
        }
        
        // Always include
        scenarios.push({
            scenario: 'Content Generation',
            description: 'AI creates new content in your style',
            value: 'Scale content production 10x'
        });
        
        return scenarios;
    }
    
    suggestMonetization(primaryRec) {
        return {
            models: [
                {
                    type: 'usage-based',
                    description: 'Charge per interaction or API call',
                    pricing: '$0.01-0.10 per query'
                },
                {
                    type: 'subscription',
                    description: 'Monthly access to your AI agent',
                    pricing: primaryRec.estimatedValue.price + '/month'
                },
                {
                    type: 'white-label',
                    description: 'License your AI to other businesses',
                    pricing: '$500-5000/month per client'
                }
            ],
            recommendation: primaryRec.estimatedValue.tier === 'premium' ? 
                'white-label' : 'subscription'
        };
    }
    
    generateReflectionSummary(results) {
        const summary = {
            headline: this.generateHeadline(results),
            keyFindings: this.extractKeyFindings(results),
            calSays: this.generateCalStatement(results),
            nextSteps: this.generateNextSteps(results),
            exportReady: true
        };
        
        return summary;
    }
    
    generateHeadline(results) {
        const analysis = results.aggregateAnalysis;
        
        if (analysis.founderAlignment > 0.8) {
            return "🎯 Perfect Founder Voice Match - Ready to Scale Your Expertise";
        } else if (analysis.coherenceScore > 0.8) {
            return "✨ Highly Coherent Knowledge Base - Ideal for Expert AI";
        } else if (results.documents.length > 10) {
            return "📚 Rich Document Collection - Multiple AI Possibilities";
        } else {
            return "🔮 Unique Content Profile - Custom AI Opportunity";
        }
    }
    
    extractKeyFindings(results) {
        const findings = [];
        
        // Document stats
        findings.push(`📄 ${results.documents.length} documents analyzed`);
        
        // Tone finding
        findings.push(`🎭 Dominant tone: ${results.aggregateAnalysis.dominantTone}`);
        
        // Reasoning finding
        findings.push(`🧠 Primary logic: ${results.aggregateAnalysis.reasoningStyle}`);
        
        // Quality finding
        if (results.aggregateAnalysis.coherenceScore > 0.7) {
            findings.push(`✅ High coherence: ${Math.round(results.aggregateAnalysis.coherenceScore * 100)}%`);
        }
        
        // Insight count
        const totalInsights = results.calInsights.length;
        findings.push(`💡 ${totalInsights} Cal insights generated`);
        
        return findings;
    }
    
    generateCalStatement(results) {
        const insights = results.calInsights;
        const recommendations = results.agentRecommendations;
        
        if (insights.some(i => i.type === 'authenticity' && i.confidence > 0.9)) {
            return "This is exactly the kind of authentic content I love to work with. Your natural voice comes through clearly - we can build something that truly represents you.";
        } else if (recommendations[0].estimatedValue.tier === 'premium') {
            return "You've got premium content here. The logical structure and consistent voice mean we can create something really valuable. People will pay for this level of expertise.";
        } else {
            return "I see potential here. With a bit of Cal magic, we can transform these documents into an AI that captures your knowledge and helps others. Let's build something useful together.";
        }
    }
    
    generateNextSteps(results) {
        const steps = [];
        
        // Always first
        steps.push({
            action: "Export as README",
            description: "Get a clean summary of your analysis (Free)",
            cta: "Export Now"
        });
        
        // Based on value
        const tier = results.agentRecommendations[0].estimatedValue.tier;
        
        if (tier === 'premium') {
            steps.push({
                action: "Create Premium Agent",
                description: `Build your ${results.agentRecommendations[0].name}`,
                cta: "Start Building ($29.99)"
            });
        } else {
            steps.push({
                action: "Create Agent",
                description: `Build your ${results.agentRecommendations[0].name}`,
                cta: `Start Building (${results.agentRecommendations[0].estimatedValue.price})`
            });
        }
        
        // QR sharing
        steps.push({
            action: "Share via QR",
            description: "Generate QR code for viral distribution",
            cta: "Generate QR"
        });
        
        return steps;
    }
    
    async updateMemoryLog(results) {
        try {
            const memoryLog = await this.loadMemoryLog();
            
            // Add reflection session
            memoryLog.reflectionSessions.push({
                id: this.reflectionSession.id,
                timestamp: this.reflectionSession.startTime,
                documentCount: results.documents.length,
                summary: results.summary,
                aggregateAnalysis: results.aggregateAnalysis
            });
            
            // Update tone profiles
            results.documents.forEach(doc => {
                if (!doc.error && doc.tone) {
                    memoryLog.toneProfiles.detected.push({
                        document: path.basename(doc.path),
                        tone: doc.tone.analysis.dominantTone,
                        confidence: doc.tone.confidence
                    });
                }
            });
            
            // Update reasoning patterns
            results.documents.forEach(doc => {
                if (!doc.error && doc.reasoning) {
                    doc.reasoning.metadata.dominantPatterns.forEach(pattern => {
                        if (memoryLog.reasoningPatterns.templates[pattern]) {
                            memoryLog.reasoningPatterns.templates[pattern].frequency++;
                        }
                    });
                }
            });
            
            // Update document analysis
            memoryLog.documentAnalysis.totalProcessed += results.documents.length;
            memoryLog.lastUpdated = new Date().toISOString();
            
            // Save updated log
            await fs.writeFile(
                this.memoryLogPath,
                JSON.stringify(memoryLog, null, 2)
            );
            
        } catch (error) {
            console.error('❌ Error updating memory log:', error.message);
        }
    }
    
    async loadMemoryLog() {
        try {
            const logContent = await fs.readFile(this.memoryLogPath, 'utf-8');
            return JSON.parse(logContent);
        } catch (error) {
            console.warn('⚠️ Could not load memory log, using defaults');
            return {
                version: '1.0.0',
                created: new Date().toISOString(),
                lastUpdated: new Date().toISOString(),
                reflectionSessions: [],
                toneProfiles: { detected: [], seeds: {} },
                reasoningPatterns: { extracted: [], templates: {} },
                documentAnalysis: { totalProcessed: 0, byType: {}, insights: [] },
                exportHistory: []
            };
        }
    }
    
    generateSessionId() {
        return `ref_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    async exportReflection(results, format = 'json') {
        const exportData = {
            generated: new Date().toISOString(),
            session: this.reflectionSession.id,
            summary: results.summary,
            analysis: results.aggregateAnalysis,
            insights: results.calInsights,
            recommendations: results.agentRecommendations,
            documents: results.documents.map(d => ({
                path: d.path,
                tone: d.tone?.analysis?.dominantTone,
                reasoning: d.reasoning?.metadata?.dominantPatterns,
                confidence: d.combined?.confidence
            }))
        };
        
        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        } else if (format === 'markdown') {
            let md = `# Reflection Analysis Report\n\n`;
            md += `*Generated by Cal's Reflection Engine*\n\n`;
            md += `## ${results.summary.headline}\n\n`;
            
            md += `### Key Findings\n\n`;
            results.summary.keyFindings.forEach(finding => {
                md += `- ${finding}\n`;
            });
            md += `\n`;
            
            md += `### Cal Says\n\n`;
            md += `> ${results.summary.calSays}\n\n`;
            
            md += `### Analysis Details\n\n`;
            md += `- **Dominant Tone:** ${results.aggregateAnalysis.dominantTone}\n`;
            md += `- **Reasoning Style:** ${results.aggregateAnalysis.reasoningStyle}\n`;
            md += `- **Coherence Score:** ${Math.round(results.aggregateAnalysis.coherenceScore * 100)}%\n`;
            md += `- **Founder Alignment:** ${Math.round(results.aggregateAnalysis.founderAlignment * 100)}%\n\n`;
            
            md += `### Recommendations\n\n`;
            results.agentRecommendations.forEach(rec => {
                md += `#### ${rec.name}\n`;
                md += `${rec.description}\n\n`;
            });
            
            md += `### Next Steps\n\n`;
            results.summary.nextSteps.forEach(step => {
                md += `1. **${step.action}** - ${step.description}\n`;
            });
            
            return md;
        }
        
        return exportData;
    }
}

module.exports = ReflectionOrchestrator;