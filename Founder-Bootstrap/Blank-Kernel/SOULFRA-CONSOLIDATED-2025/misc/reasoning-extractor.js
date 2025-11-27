// Reasoning Extractor - Pulls core logic from raw docs
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ReasoningExtractor {
    constructor() {
        this.reasoningPatterns = {
            causal: {
                patterns: [
                    /\b(because|since|as|due to|owing to|therefore|thus|hence|consequently)\b/gi,
                    /\b(if\s+.+\s+then)\b/gi,
                    /\b(leads to|results in|causes|creates|produces)\b/gi,
                    /\b(the reason|the cause|the effect|the result)\b/gi
                ],
                weight: 0.8,
                type: 'cause-effect'
            },
            conditional: {
                patterns: [
                    /\b(if|when|whenever|unless|provided that|assuming)\b/gi,
                    /\b(in case|should|would|could|might)\b/gi,
                    /\b(depends on|contingent upon|subject to)\b/gi
                ],
                weight: 0.7,
                type: 'conditional-logic'
            },
            sequential: {
                patterns: [
                    /\b(first|second|third|finally|lastly)\b/gi,
                    /\b(then|next|after|before|during|while)\b/gi,
                    /\b(step \d+|phase \d+|stage \d+)\b/gi,
                    /\b(begin|start|continue|proceed|complete|finish)\b/gi
                ],
                weight: 0.6,
                type: 'process-flow'
            },
            comparative: {
                patterns: [
                    /\b(however|but|yet|although|whereas|while)\b/gi,
                    /\b(on the other hand|in contrast|conversely|alternatively)\b/gi,
                    /\b(better than|worse than|similar to|different from)\b/gi,
                    /\b(advantage|disadvantage|pros|cons|benefit|drawback)\b/gi
                ],
                weight: 0.7,
                type: 'comparison'
            },
            analytical: {
                patterns: [
                    /\b(analyze|examine|investigate|explore|consider)\b/gi,
                    /\b(factors|variables|components|elements|aspects)\b/gi,
                    /\b(pattern|trend|correlation|relationship)\b/gi,
                    /\b(hypothesis|theory|principle|concept|framework)\b/gi
                ],
                weight: 0.8,
                type: 'analysis'
            },
            conclusive: {
                patterns: [
                    /\b(in conclusion|to summarize|in summary|overall)\b/gi,
                    /\b(it follows that|we can conclude|this means|this shows)\b/gi,
                    /\b(key takeaway|main point|bottom line|lesson learned)\b/gi,
                    /\b(ultimately|fundamentally|essentially|basically)\b/gi
                ],
                weight: 0.9,
                type: 'conclusion'
            },
            evidential: {
                patterns: [
                    /\b(evidence|proof|data|research|study)\b/gi,
                    /\b(shows|demonstrates|indicates|suggests|proves)\b/gi,
                    /\b(according to|based on|derived from|supported by)\b/gi,
                    /\b(fact|statistic|figure|number|percentage)\b/gi
                ],
                weight: 0.8,
                type: 'evidence-based'
            }
        };
        
        this.logicStructures = {
            argument: {
                components: ['premise', 'evidence', 'conclusion'],
                minLength: 3,
                maxLength: 10
            },
            explanation: {
                components: ['context', 'mechanism', 'outcome'],
                minLength: 2,
                maxLength: 8
            },
            instruction: {
                components: ['goal', 'steps', 'result'],
                minLength: 2,
                maxLength: 15
            },
            narrative: {
                components: ['setup', 'conflict', 'resolution'],
                minLength: 3,
                maxLength: 20
            }
        };
        
        this.extractedReasoningChains = [];
        this.documentLogicMap = new Map();
    }
    
    async extractReasoning(documentContent, documentPath) {
        console.log(`🧠 Extracting reasoning from: ${path.basename(documentPath)}`);
        
        try {
            // Extract text content
            const text = this.extractText(documentContent);
            
            // Split into logical units (paragraphs, sections)
            const logicalUnits = this.splitIntoLogicalUnits(text);
            
            // Extract reasoning patterns from each unit
            const reasoningChains = [];
            
            for (const unit of logicalUnits) {
                const chain = await this.extractReasoningChain(unit);
                if (chain && chain.strength > 0.5) {
                    reasoningChains.push(chain);
                }
            }
            
            // Build document logic structure
            const logicStructure = this.buildLogicStructure(reasoningChains);
            
            // Extract key insights
            const insights = this.extractKeyInsights(reasoningChains, logicStructure);
            
            // Generate reasoning summary
            const summary = this.generateReasoningSummary(reasoningChains, insights);
            
            // Store in document map
            this.documentLogicMap.set(documentPath, {
                chains: reasoningChains,
                structure: logicStructure,
                insights: insights,
                summary: summary
            });
            
            return {
                documentPath: documentPath,
                reasoningChains: reasoningChains,
                logicStructure: logicStructure,
                insights: insights,
                summary: summary,
                metadata: {
                    totalChains: reasoningChains.length,
                    dominantPatterns: this.identifyDominantPatterns(reasoningChains),
                    complexityScore: this.calculateComplexity(reasoningChains),
                    coherenceScore: this.calculateCoherence(reasoningChains)
                }
            };
            
        } catch (error) {
            console.error(`❌ Error extracting reasoning from ${documentPath}:`, error.message);
            throw error;
        }
    }
    
    extractText(content) {
        if (typeof content === 'string') return content;
        if (content.text) return content.text;
        if (content.raw) return content.raw;
        if (content.plainText) return content.plainText;
        return JSON.stringify(content);
    }
    
    splitIntoLogicalUnits(text) {
        const units = [];
        
        // Split by double newlines (paragraphs)
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 50);
        
        // Split by headers if markdown
        const headerSections = text.split(/^#{1,6}\s+/m).filter(s => s.trim().length > 50);
        
        // Split by numbered lists
        const listSections = text.split(/^\d+\.\s+/m).filter(s => s.trim().length > 30);
        
        // Combine and deduplicate
        const allUnits = [...paragraphs, ...headerSections, ...listSections];
        const uniqueUnits = [...new Set(allUnits)];
        
        // Filter out units that are too short or too long
        return uniqueUnits.filter(unit => {
            const wordCount = unit.split(/\s+/).length;
            return wordCount >= 10 && wordCount <= 500;
        });
    }
    
    async extractReasoningChain(text) {
        const chain = {
            text: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
            patterns: [],
            structure: null,
            strength: 0,
            components: []
        };
        
        // Check for reasoning patterns
        for (const [patternType, config] of Object.entries(this.reasoningPatterns)) {
            let matchCount = 0;
            const matches = [];
            
            for (const pattern of config.patterns) {
                const patternMatches = text.match(pattern) || [];
                matchCount += patternMatches.length;
                if (patternMatches.length > 0) {
                    matches.push(...patternMatches);
                }
            }
            
            if (matchCount > 0) {
                chain.patterns.push({
                    type: patternType,
                    count: matchCount,
                    weight: config.weight,
                    matches: matches.slice(0, 5),
                    logicType: config.type
                });
                chain.strength += matchCount * config.weight;
            }
        }
        
        // Identify structure type
        chain.structure = this.identifyLogicStructure(text);
        
        // Extract logical components
        chain.components = this.extractLogicalComponents(text, chain.structure);
        
        // Normalize strength score
        chain.strength = Math.min(1, chain.strength / 10);
        
        return chain;
    }
    
    identifyLogicStructure(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const sentenceCount = sentences.length;
        
        // Check for argument structure
        if (text.match(/\b(claim|argue|position|stance)\b/i) && 
            text.match(/\b(evidence|support|proof|data)\b/i)) {
            return 'argument';
        }
        
        // Check for explanation structure
        if (text.match(/\b(explain|describe|how|why)\b/i) && 
            text.match(/\b(works|happens|occurs|functions)\b/i)) {
            return 'explanation';
        }
        
        // Check for instruction structure
        if (text.match(/\b(step|first|then|next|finally)\b/i) && 
            text.match(/\b(do|perform|execute|complete)\b/i)) {
            return 'instruction';
        }
        
        // Check for narrative structure
        if (text.match(/\b(story|experience|happened|learned)\b/i) && 
            sentenceCount >= 3) {
            return 'narrative';
        }
        
        // Default to general reasoning
        return 'general';
    }
    
    extractLogicalComponents(text, structure) {
        const components = [];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        switch (structure) {
            case 'argument':
                // Look for claim
                const claimSentence = sentences.find(s => 
                    s.match(/\b(believe|think|argue|claim|position)\b/i)
                );
                if (claimSentence) {
                    components.push({
                        type: 'claim',
                        content: claimSentence.trim(),
                        position: sentences.indexOf(claimSentence)
                    });
                }
                
                // Look for evidence
                sentences.forEach((s, i) => {
                    if (s.match(/\b(because|since|evidence|data|shows)\b/i)) {
                        components.push({
                            type: 'evidence',
                            content: s.trim(),
                            position: i
                        });
                    }
                });
                
                // Look for conclusion
                const conclusionSentence = sentences.find(s => 
                    s.match(/\b(therefore|thus|conclude|means)\b/i)
                );
                if (conclusionSentence) {
                    components.push({
                        type: 'conclusion',
                        content: conclusionSentence.trim(),
                        position: sentences.indexOf(conclusionSentence)
                    });
                }
                break;
                
            case 'explanation':
                // Extract context, mechanism, outcome
                if (sentences.length >= 2) {
                    components.push({
                        type: 'context',
                        content: sentences[0].trim(),
                        position: 0
                    });
                    
                    const mechanismSentence = sentences.find(s => 
                        s.match(/\b(works|happens|occurs|process)\b/i)
                    );
                    if (mechanismSentence) {
                        components.push({
                            type: 'mechanism',
                            content: mechanismSentence.trim(),
                            position: sentences.indexOf(mechanismSentence)
                        });
                    }
                    
                    if (sentences.length > 2) {
                        components.push({
                            type: 'outcome',
                            content: sentences[sentences.length - 1].trim(),
                            position: sentences.length - 1
                        });
                    }
                }
                break;
                
            case 'instruction':
                // Extract steps
                sentences.forEach((s, i) => {
                    if (s.match(/\b(step|first|then|next|finally|\d+\.)\b/i)) {
                        components.push({
                            type: 'step',
                            content: s.trim(),
                            position: i,
                            order: i + 1
                        });
                    }
                });
                break;
                
            case 'narrative':
                // Extract story elements
                if (sentences.length >= 3) {
                    components.push({
                        type: 'setup',
                        content: sentences.slice(0, Math.floor(sentences.length / 3)).join(' '),
                        position: 0
                    });
                    
                    components.push({
                        type: 'development',
                        content: sentences.slice(Math.floor(sentences.length / 3), Math.floor(2 * sentences.length / 3)).join(' '),
                        position: 1
                    });
                    
                    components.push({
                        type: 'resolution',
                        content: sentences.slice(Math.floor(2 * sentences.length / 3)).join(' '),
                        position: 2
                    });
                }
                break;
        }
        
        return components;
    }
    
    buildLogicStructure(reasoningChains) {
        const structure = {
            type: 'document',
            chains: reasoningChains.length,
            flow: [],
            connections: [],
            hierarchy: []
        };
        
        // Identify flow between chains
        for (let i = 0; i < reasoningChains.length - 1; i++) {
            const current = reasoningChains[i];
            const next = reasoningChains[i + 1];
            
            // Check for logical connections
            const connection = this.findConnection(current, next);
            if (connection) {
                structure.connections.push({
                    from: i,
                    to: i + 1,
                    type: connection.type,
                    strength: connection.strength
                });
            }
        }
        
        // Build hierarchy based on pattern types
        const patternGroups = {};
        reasoningChains.forEach((chain, index) => {
            chain.patterns.forEach(pattern => {
                if (!patternGroups[pattern.type]) {
                    patternGroups[pattern.type] = [];
                }
                patternGroups[pattern.type].push(index);
            });
        });
        
        structure.hierarchy = Object.entries(patternGroups).map(([type, indices]) => ({
            pattern: type,
            chains: indices,
            count: indices.length
        }));
        
        // Determine overall flow type
        if (structure.connections.length > reasoningChains.length * 0.7) {
            structure.flowType = 'linear';
        } else if (structure.hierarchy.length > 3) {
            structure.flowType = 'hierarchical';
        } else {
            structure.flowType = 'scattered';
        }
        
        return structure;
    }
    
    findConnection(chain1, chain2) {
        // Check if chain2 references concepts from chain1
        const chain1Concepts = this.extractConcepts(chain1.text);
        const chain2Concepts = this.extractConcepts(chain2.text);
        
        const sharedConcepts = chain1Concepts.filter(c => 
            chain2Concepts.includes(c)
        );
        
        if (sharedConcepts.length > 0) {
            return {
                type: 'conceptual',
                strength: sharedConcepts.length / Math.max(chain1Concepts.length, chain2Concepts.length),
                shared: sharedConcepts
            };
        }
        
        // Check for explicit connectors
        const connectorPatterns = [
            /^(therefore|thus|hence|consequently)/i,
            /^(however|but|yet|although)/i,
            /^(furthermore|moreover|additionally)/i,
            /^(for example|for instance|such as)/i
        ];
        
        for (const pattern of connectorPatterns) {
            if (chain2.text.match(pattern)) {
                return {
                    type: 'explicit',
                    strength: 0.8,
                    connector: chain2.text.match(pattern)[0]
                };
            }
        }
        
        return null;
    }
    
    extractConcepts(text) {
        // Extract noun phrases as concepts
        const words = text.toLowerCase().split(/\W+/);
        const concepts = [];
        
        // Simple concept extraction - nouns that appear multiple times
        const wordFreq = {};
        words.forEach(word => {
            if (word.length > 3) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });
        
        Object.entries(wordFreq)
            .filter(([word, count]) => count >= 2)
            .forEach(([word]) => concepts.push(word));
        
        return concepts;
    }
    
    extractKeyInsights(reasoningChains, logicStructure) {
        const insights = [];
        
        // Find chains with high strength and conclusive patterns
        const conclusiveChains = reasoningChains.filter(chain => 
            chain.patterns.some(p => p.type === 'conclusive') && chain.strength > 0.7
        );
        
        conclusiveChains.forEach(chain => {
            const insight = {
                type: 'conclusion',
                content: this.extractInsightContent(chain),
                confidence: chain.strength,
                supportingPatterns: chain.patterns.map(p => p.type),
                components: chain.components.filter(c => 
                    ['conclusion', 'outcome', 'resolution'].includes(c.type)
                )
            };
            insights.push(insight);
        });
        
        // Find causal relationships
        const causalChains = reasoningChains.filter(chain => 
            chain.patterns.some(p => p.type === 'causal')
        );
        
        causalChains.forEach(chain => {
            const causes = chain.components.filter(c => c.type === 'evidence' || c.content.match(/because|since/i));
            const effects = chain.components.filter(c => c.type === 'conclusion' || c.content.match(/therefore|results in/i));
            
            if (causes.length > 0 && effects.length > 0) {
                insights.push({
                    type: 'causal',
                    content: `${causes[0].content} → ${effects[0].content}`,
                    confidence: chain.strength,
                    relationship: 'cause-effect'
                });
            }
        });
        
        // Find key patterns or principles
        if (logicStructure.hierarchy.length > 0) {
            const dominantPattern = logicStructure.hierarchy
                .sort((a, b) => b.count - a.count)[0];
            
            insights.push({
                type: 'pattern',
                content: `Document primarily uses ${dominantPattern.pattern} reasoning`,
                confidence: 0.8,
                frequency: dominantPattern.count
            });
        }
        
        return insights;
    }
    
    extractInsightContent(chain) {
        // Try to find the most conclusive component
        const conclusiveComponent = chain.components.find(c => 
            ['conclusion', 'outcome', 'resolution'].includes(c.type)
        );
        
        if (conclusiveComponent) {
            return conclusiveComponent.content;
        }
        
        // Fall back to the last sentence
        const sentences = chain.text.split(/[.!?]+/).filter(s => s.trim());
        return sentences[sentences.length - 1] || chain.text.substring(0, 100);
    }
    
    generateReasoningSummary(reasoningChains, insights) {
        const summary = {
            overview: '',
            mainPoints: [],
            reasoningStyle: '',
            recommendations: []
        };
        
        // Determine reasoning style
        const patternCounts = {};
        reasoningChains.forEach(chain => {
            chain.patterns.forEach(p => {
                patternCounts[p.type] = (patternCounts[p.type] || 0) + p.count;
            });
        });
        
        const dominantPattern = Object.entries(patternCounts)
            .sort((a, b) => b[1] - a[1])[0];
        
        if (dominantPattern) {
            summary.reasoningStyle = this.describeReasoningStyle(dominantPattern[0]);
        }
        
        // Extract main points from insights
        summary.mainPoints = insights
            .filter(i => i.confidence > 0.6)
            .slice(0, 5)
            .map(i => ({
                type: i.type,
                point: this.simplifyInsight(i.content),
                confidence: i.confidence
            }));
        
        // Generate overview
        summary.overview = this.generateOverview(reasoningChains, insights);
        
        // Add recommendations for agent creation
        summary.recommendations = this.generateAgentRecommendations(
            summary.reasoningStyle, 
            patternCounts
        );
        
        return summary;
    }
    
    describeReasoningStyle(patternType) {
        const styles = {
            causal: 'Cause-and-effect reasoning that explains relationships',
            conditional: 'Conditional logic that explores scenarios and dependencies',
            sequential: 'Step-by-step process thinking',
            comparative: 'Analytical comparison and contrast',
            analytical: 'Deep analytical examination of concepts',
            conclusive: 'Goal-oriented reasoning focused on conclusions',
            evidential: 'Evidence-based logical argumentation'
        };
        
        return styles[patternType] || 'Mixed reasoning approach';
    }
    
    simplifyInsight(content) {
        // Remove excessive words and simplify
        return content
            .replace(/\b(the|a|an|is|are|was|were)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 100);
    }
    
    generateOverview(chains, insights) {
        const totalChains = chains.length;
        const avgStrength = chains.reduce((sum, c) => sum + c.strength, 0) / totalChains;
        const insightCount = insights.length;
        
        if (avgStrength > 0.7 && insightCount > 3) {
            return `Highly structured reasoning with ${totalChains} logical chains and ${insightCount} key insights. The document demonstrates clear logical progression and well-supported conclusions.`;
        } else if (avgStrength > 0.5) {
            return `Moderate reasoning structure with ${totalChains} identifiable logic patterns. The document contains ${insightCount} extractable insights with varying levels of support.`;
        } else {
            return `Loose reasoning structure with ${totalChains} scattered logical elements. The document would benefit from more explicit logical connections.`;
        }
    }
    
    generateAgentRecommendations(style, patternCounts) {
        const recommendations = [];
        
        // Based on reasoning style
        if (style.includes('Cause-and-effect')) {
            recommendations.push({
                type: 'agent_behavior',
                recommendation: 'Create an agent that excels at explaining WHY things happen',
                implementation: 'Prioritize causal explanations in responses'
            });
        }
        
        if (style.includes('Step-by-step')) {
            recommendations.push({
                type: 'agent_behavior',
                recommendation: 'Create an instructional agent that guides users through processes',
                implementation: 'Structure responses as numbered steps or sequences'
            });
        }
        
        if (style.includes('Evidence-based')) {
            recommendations.push({
                type: 'agent_behavior',
                recommendation: 'Create a fact-focused agent that backs up claims',
                implementation: 'Always cite sources or provide supporting evidence'
            });
        }
        
        // Based on pattern diversity
        const patternTypes = Object.keys(patternCounts).length;
        if (patternTypes > 4) {
            recommendations.push({
                type: 'agent_flexibility',
                recommendation: 'Create a versatile agent that adapts reasoning style to context',
                implementation: 'Use pattern matching to select appropriate reasoning approach'
            });
        }
        
        return recommendations;
    }
    
    identifyDominantPatterns(chains) {
        const patternFreq = {};
        
        chains.forEach(chain => {
            chain.patterns.forEach(p => {
                patternFreq[p.type] = (patternFreq[p.type] || 0) + 1;
            });
        });
        
        return Object.entries(patternFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([pattern]) => pattern);
    }
    
    calculateComplexity(chains) {
        if (chains.length === 0) return 0;
        
        // Factors: chain length, pattern diversity, component depth
        const avgChainLength = chains.reduce((sum, c) => 
            sum + c.text.length, 0
        ) / chains.length;
        
        const uniquePatterns = new Set();
        chains.forEach(c => c.patterns.forEach(p => uniquePatterns.add(p.type)));
        
        const avgComponents = chains.reduce((sum, c) => 
            sum + c.components.length, 0
        ) / chains.length;
        
        // Normalize and combine
        const lengthScore = Math.min(1, avgChainLength / 500);
        const diversityScore = Math.min(1, uniquePatterns.size / 5);
        const depthScore = Math.min(1, avgComponents / 5);
        
        return (lengthScore * 0.3 + diversityScore * 0.4 + depthScore * 0.3);
    }
    
    calculateCoherence(chains) {
        if (chains.length < 2) return 1;
        
        // Check how well chains connect to each other
        let connectionCount = 0;
        
        for (let i = 0; i < chains.length - 1; i++) {
            const connection = this.findConnection(chains[i], chains[i + 1]);
            if (connection && connection.strength > 0.5) {
                connectionCount++;
            }
        }
        
        return connectionCount / (chains.length - 1);
    }
    
    async exportReasoningMap(format = 'json') {
        const exportData = {
            generated: new Date().toISOString(),
            documents: [],
            aggregatePatterns: {},
            totalInsights: 0
        };
        
        for (const [docPath, docLogic] of this.documentLogicMap) {
            exportData.documents.push({
                path: docPath,
                chains: docLogic.chains.length,
                insights: docLogic.insights.length,
                summary: docLogic.summary
            });
            
            exportData.totalInsights += docLogic.insights.length;
            
            // Aggregate patterns
            docLogic.chains.forEach(chain => {
                chain.patterns.forEach(p => {
                    exportData.aggregatePatterns[p.type] = 
                        (exportData.aggregatePatterns[p.type] || 0) + p.count;
                });
            });
        }
        
        if (format === 'json') {
            return JSON.stringify(exportData, null, 2);
        } else if (format === 'markdown') {
            let md = '# Reasoning Extraction Report\n\n';
            md += `Generated: ${exportData.generated}\n\n`;
            md += `## Summary\n\n`;
            md += `- Documents Analyzed: ${exportData.documents.length}\n`;
            md += `- Total Insights: ${exportData.totalInsights}\n\n`;
            md += `## Reasoning Patterns\n\n`;
            
            Object.entries(exportData.aggregatePatterns)
                .sort((a, b) => b[1] - a[1])
                .forEach(([pattern, count]) => {
                    md += `- **${pattern}**: ${count} occurrences\n`;
                });
            
            return md;
        }
        
        return exportData;
    }
}

module.exports = ReasoningExtractor;