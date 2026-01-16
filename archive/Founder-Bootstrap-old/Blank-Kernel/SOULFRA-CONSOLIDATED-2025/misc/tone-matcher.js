// Tone Matcher - Matches document tone to vault seed
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ToneMatcher {
    constructor() {
        this.vaultSeedPath = path.join(__dirname, '../../tier-minus13/vault/memory/seed');
        this.toneProfiles = {
            founder: {
                markers: {
                    candid: ['honestly', 'look', 'real talk', 'straight up', 'bottom line'],
                    philosophical: ['essence', 'fundamental', 'core', 'nature of', 'meaning'],
                    strategic: ['leverage', 'position', 'angle', 'play', 'move'],
                    technical: ['build', 'architect', 'implement', 'system', 'framework'],
                    visionary: ['imagine', 'future', 'transform', 'revolution', 'paradigm']
                },
                patterns: {
                    storytelling: /^(So|Look|Here's the thing|Let me tell you)/i,
                    lessons: /^(What I learned|The lesson here|Key takeaway)/i,
                    directAddress: /\b(you|your|you're)\b/gi,
                    personalExperience: /\b(I|my|we|our)\b/gi,
                    emphasis: /\b(really|actually|literally|seriously)\b/gi
                },
                sentenceStructure: {
                    shortPunchy: { minWords: 1, maxWords: 8, weight: 0.3 },
                    medium: { minWords: 9, maxWords: 20, weight: 0.5 },
                    complex: { minWords: 21, maxWords: 50, weight: 0.2 }
                }
            },
            academic: {
                markers: {
                    formal: ['therefore', 'moreover', 'furthermore', 'consequently', 'thus'],
                    analytical: ['analyze', 'examine', 'investigate', 'evaluate', 'assess'],
                    objective: ['research', 'findings', 'evidence', 'data', 'results'],
                    theoretical: ['hypothesis', 'theory', 'framework', 'model', 'paradigm'],
                    methodical: ['methodology', 'approach', 'systematic', 'comprehensive', 'rigorous']
                },
                patterns: {
                    citations: /\([^)]+,\s*\d{4}\)/g,
                    passive: /\b(is|are|was|were|been|being)\s+\w+ed\b/gi,
                    thirdPerson: /\b(one|it|they|the study|the research)\b/gi,
                    hedging: /\b(may|might|could|possibly|potentially|appears)\b/gi
                }
            },
            conversational: {
                markers: {
                    casual: ['hey', 'yeah', 'cool', 'awesome', 'totally'],
                    informal: ['gonna', 'wanna', 'kinda', 'sorta', 'like'],
                    friendly: ['thanks', 'please', 'glad', 'happy', 'excited'],
                    questioning: ['right?', 'you know?', 'isn\'t it?', 'don\'t you think?'],
                    expressive: ['wow', 'oh', 'ah', 'hmm', 'well']
                },
                patterns: {
                    contractions: /\b\w+'\w+\b/g,
                    ellipsis: /\.\.\./g,
                    exclamations: /!/g,
                    questions: /\?/g,
                    emojis: /[\u{1F600}-\u{1F64F}]/gu
                }
            },
            technical: {
                markers: {
                    code: ['function', 'variable', 'class', 'method', 'parameter'],
                    architecture: ['component', 'module', 'interface', 'api', 'endpoint'],
                    process: ['compile', 'execute', 'deploy', 'configure', 'initialize'],
                    data: ['array', 'object', 'string', 'integer', 'boolean'],
                    tools: ['git', 'npm', 'docker', 'kubernetes', 'webpack']
                },
                patterns: {
                    camelCase: /\b[a-z]+(?:[A-Z][a-z]+)+\b/g,
                    snakeCase: /\b[a-z]+(?:_[a-z]+)+\b/g,
                    commands: /^\s*[$#]\s*/gm,
                    codeBlocks: /```[\s\S]*?```/g,
                    technicalAcronyms: /\b[A-Z]{2,}\b/g
                }
            },
            emotional: {
                markers: {
                    feelings: ['feel', 'felt', 'feeling', 'emotion', 'heart'],
                    positive: ['love', 'joy', 'happy', 'grateful', 'blessed'],
                    negative: ['sad', 'angry', 'frustrated', 'disappointed', 'hurt'],
                    empathy: ['understand', 'relate', 'connection', 'together', 'support'],
                    vulnerability: ['honest', 'truth', 'admit', 'confess', 'share']
                },
                patterns: {
                    firstPerson: /\b(I|me|my|myself)\b/gi,
                    intensifiers: /\b(so|very|really|extremely|incredibly)\b/gi,
                    emotionalPunctuation: /[!?]{2,}/g
                }
            }
        };
        
        this.seedMemories = null;
        this.toneFingerprints = new Map();
    }
    
    async initialize() {
        console.log('🎭 Initializing tone matcher...');
        
        try {
            // Load seed memories from vault
            await this.loadSeedMemories();
            
            // Generate tone fingerprints from seed data
            await this.generateSeedFingerprints();
            
            console.log('✅ Tone matcher initialized');
            
        } catch (error) {
            console.error('❌ Error initializing tone matcher:', error.message);
            throw error;
        }
    }
    
    async loadSeedMemories() {
        const seedFiles = [
            'matt-chat-logs.txt',
            'startup-notes.md',
            'tone-reflections.md',
            'failed-launches.md'
        ];
        
        this.seedMemories = {};
        
        for (const file of seedFiles) {
            try {
                const filePath = path.join(this.vaultSeedPath, file);
                const content = await fs.readFile(filePath, 'utf-8');
                this.seedMemories[file] = {
                    content: content,
                    analysis: this.analyzeDocumentTone(content)
                };
            } catch (error) {
                console.warn(`⚠️ Could not load seed file ${file}:`, error.message);
            }
        }
    }
    
    async generateSeedFingerprints() {
        if (!this.seedMemories) return;
        
        // Create composite fingerprint from all seed documents
        const compositeAnalysis = {
            toneScores: {},
            markerFrequencies: {},
            patternMatches: {},
            sentenceMetrics: {
                avgLength: 0,
                distribution: {}
            }
        };
        
        const seedDocs = Object.values(this.seedMemories);
        
        // Aggregate tone scores
        for (const profile in this.toneProfiles) {
            compositeAnalysis.toneScores[profile] = 0;
        }
        
        seedDocs.forEach(doc => {
            for (const profile in doc.analysis.toneScores) {
                compositeAnalysis.toneScores[profile] += doc.analysis.toneScores[profile];
            }
        });
        
        // Normalize scores
        for (const profile in compositeAnalysis.toneScores) {
            compositeAnalysis.toneScores[profile] /= seedDocs.length;
        }
        
        // Store fingerprint
        this.toneFingerprints.set('founder_seed', compositeAnalysis);
    }
    
    async matchDocumentTone(documentContent, documentPath) {
        console.log(`🎯 Matching tone for: ${path.basename(documentPath)}`);
        
        try {
            // Analyze document tone
            const docAnalysis = this.analyzeDocumentTone(documentContent);
            
            // Compare with seed fingerprints
            const matchScores = this.compareWithSeeds(docAnalysis);
            
            // Find best matching profile
            const bestMatch = this.findBestMatch(matchScores);
            
            // Generate tone recommendation
            const recommendation = this.generateToneRecommendation(
                docAnalysis, 
                bestMatch,
                matchScores
            );
            
            return {
                documentPath: documentPath,
                analysis: docAnalysis,
                matchScores: matchScores,
                bestMatch: bestMatch,
                recommendation: recommendation,
                confidence: this.calculateConfidence(matchScores)
            };
            
        } catch (error) {
            console.error(`❌ Error matching tone for ${documentPath}:`, error.message);
            throw error;
        }
    }
    
    analyzeDocumentTone(content) {
        const analysis = {
            toneScores: {},
            markerFrequencies: {},
            patternMatches: {},
            sentenceMetrics: this.analyzeSentenceStructure(content),
            dominantTone: null,
            subTones: []
        };
        
        // Extract text content if needed
        const text = typeof content === 'string' ? content : 
                    content.text || content.raw || JSON.stringify(content);
        
        // Analyze each tone profile
        for (const [profile, config] of Object.entries(this.toneProfiles)) {
            let score = 0;
            
            // Check markers
            analysis.markerFrequencies[profile] = {};
            for (const [category, markers] of Object.entries(config.markers)) {
                let categoryCount = 0;
                
                markers.forEach(marker => {
                    const regex = new RegExp(`\\b${marker}\\b`, 'gi');
                    const matches = text.match(regex) || [];
                    categoryCount += matches.length;
                    
                    if (matches.length > 0) {
                        analysis.markerFrequencies[profile][marker] = matches.length;
                    }
                });
                
                score += categoryCount * 0.5;
            }
            
            // Check patterns
            if (config.patterns) {
                analysis.patternMatches[profile] = {};
                for (const [patternName, pattern] of Object.entries(config.patterns)) {
                    const matches = text.match(pattern) || [];
                    if (matches.length > 0) {
                        analysis.patternMatches[profile][patternName] = matches.length;
                        score += matches.length * 0.3;
                    }
                }
            }
            
            // Normalize score
            analysis.toneScores[profile] = Math.min(1, score / 100);
        }
        
        // Determine dominant tone
        const sortedTones = Object.entries(analysis.toneScores)
            .sort((a, b) => b[1] - a[1]);
        
        analysis.dominantTone = sortedTones[0][0];
        analysis.subTones = sortedTones.slice(1, 3).map(t => t[0]);
        
        return analysis;
    }
    
    analyzeSentenceStructure(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const wordCounts = sentences.map(s => s.split(/\s+/).length);
        
        const metrics = {
            totalSentences: sentences.length,
            avgWordsPerSentence: wordCounts.reduce((a, b) => a + b, 0) / sentences.length,
            distribution: {
                short: 0,
                medium: 0,
                long: 0
            },
            variety: 0
        };
        
        // Categorize sentences
        wordCounts.forEach(count => {
            if (count <= 8) metrics.distribution.short++;
            else if (count <= 20) metrics.distribution.medium++;
            else metrics.distribution.long++;
        });
        
        // Calculate variety score (standard deviation)
        const mean = metrics.avgWordsPerSentence;
        const variance = wordCounts.reduce((sum, count) => 
            sum + Math.pow(count - mean, 2), 0) / wordCounts.length;
        metrics.variety = Math.sqrt(variance);
        
        return metrics;
    }
    
    compareWithSeeds(docAnalysis) {
        const matchScores = {};
        
        // Compare with each seed fingerprint
        for (const [seedName, seedFingerprint] of this.toneFingerprints) {
            let similarity = 0;
            let weights = 0;
            
            // Compare tone scores
            for (const profile in docAnalysis.toneScores) {
                const docScore = docAnalysis.toneScores[profile];
                const seedScore = seedFingerprint.toneScores[profile] || 0;
                
                // Calculate similarity (1 - normalized difference)
                const diff = Math.abs(docScore - seedScore);
                similarity += (1 - diff) * 0.5;
                weights += 0.5;
            }
            
            // Compare sentence structure
            if (seedFingerprint.sentenceMetrics) {
                const docAvg = docAnalysis.sentenceMetrics.avgWordsPerSentence;
                const seedAvg = seedFingerprint.sentenceMetrics.avgLength || 15;
                
                const structureSimilarity = 1 - Math.min(1, Math.abs(docAvg - seedAvg) / 20);
                similarity += structureSimilarity * 0.3;
                weights += 0.3;
            }
            
            matchScores[seedName] = similarity / weights;
        }
        
        return matchScores;
    }
    
    findBestMatch(matchScores) {
        let bestMatch = null;
        let highestScore = 0;
        
        for (const [profile, score] of Object.entries(matchScores)) {
            if (score > highestScore) {
                highestScore = score;
                bestMatch = profile;
            }
        }
        
        return {
            profile: bestMatch,
            score: highestScore,
            isGoodMatch: highestScore > 0.7
        };
    }
    
    generateToneRecommendation(docAnalysis, bestMatch, matchScores) {
        const recommendations = [];
        
        // Overall tone assessment
        if (bestMatch.isGoodMatch) {
            recommendations.push({
                type: 'match',
                message: `Document closely matches the ${bestMatch.profile} tone profile (${Math.round(bestMatch.score * 100)}% similarity)`,
                confidence: 'high'
            });
        } else {
            recommendations.push({
                type: 'mismatch',
                message: `Document tone differs from seed profiles. Dominant tone: ${docAnalysis.dominantTone}`,
                confidence: 'medium'
            });
        }
        
        // Specific adjustments for founder tone
        if (bestMatch.profile === 'founder_seed' && bestMatch.score < 0.9) {
            const founderProfile = this.toneProfiles.founder;
            
            // Check for missing founder elements
            if (docAnalysis.toneScores.founder < 0.5) {
                recommendations.push({
                    type: 'adjustment',
                    category: 'authenticity',
                    message: 'Add more personal anecdotes and direct address to match founder voice',
                    examples: founderProfile.markers.candid
                });
            }
            
            // Check sentence variety
            if (docAnalysis.sentenceMetrics.variety < 5) {
                recommendations.push({
                    type: 'adjustment',
                    category: 'rhythm',
                    message: 'Vary sentence length more - mix short punchy statements with longer explanations',
                    current: `Avg: ${Math.round(docAnalysis.sentenceMetrics.avgWordsPerSentence)} words`,
                    target: 'Mix 3-8 word sentences with 15-25 word sentences'
                });
            }
        }
        
        // Tone blending suggestions
        if (docAnalysis.subTones.length > 0) {
            recommendations.push({
                type: 'blend',
                message: `Document blends ${docAnalysis.dominantTone} with ${docAnalysis.subTones.join(' and ')} tones`,
                suggestion: 'This multi-tonal approach can create unique agent personalities'
            });
        }
        
        return recommendations;
    }
    
    calculateConfidence(matchScores) {
        const scores = Object.values(matchScores);
        const maxScore = Math.max(...scores);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        
        // High confidence if one profile strongly matches
        if (maxScore > 0.8) return 0.9;
        
        // Medium confidence if moderate match
        if (maxScore > 0.6) return 0.7;
        
        // Low confidence if poor matches
        return 0.4;
    }
    
    async generateToneFingerprint(documents) {
        console.log('🔍 Generating tone fingerprint from documents...');
        
        const fingerprint = {
            timestamp: new Date().toISOString(),
            documentCount: documents.length,
            compositeTone: {},
            markerProfile: {},
            sentenceProfile: {},
            uniquePatterns: []
        };
        
        // Aggregate analyses
        const allAnalyses = [];
        for (const doc of documents) {
            const analysis = this.analyzeDocumentTone(doc.content || doc);
            allAnalyses.push(analysis);
        }
        
        // Build composite tone profile
        for (const profile in this.toneProfiles) {
            fingerprint.compositeTone[profile] = 
                allAnalyses.reduce((sum, a) => sum + (a.toneScores[profile] || 0), 0) / allAnalyses.length;
        }
        
        // Find unique patterns
        const patternCounts = {};
        allAnalyses.forEach(analysis => {
            Object.values(analysis.patternMatches).forEach(patterns => {
                Object.keys(patterns).forEach(pattern => {
                    patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
                });
            });
        });
        
        fingerprint.uniquePatterns = Object.entries(patternCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([pattern, count]) => ({ pattern, frequency: count / documents.length }));
        
        return fingerprint;
    }
    
    async exportToneProfile(format = 'json') {
        const profile = {
            generated: new Date().toISOString(),
            seedFingerprints: Object.fromEntries(this.toneFingerprints),
            toneDefinitions: this.toneProfiles,
            recommendations: {
                founderVoice: [
                    'Use personal anecdotes and storytelling',
                    'Mix short punchy sentences with longer explanations',
                    'Address reader directly with "you" language',
                    'Include lessons learned and strategic insights'
                ],
                technicalVoice: [
                    'Focus on implementation details',
                    'Use proper technical terminology',
                    'Include code examples and commands',
                    'Structure content methodically'
                ],
                conversationalVoice: [
                    'Use contractions and casual language',
                    'Ask rhetorical questions',
                    'Express enthusiasm and emotion',
                    'Keep tone friendly and approachable'
                ]
            }
        };
        
        if (format === 'json') {
            return JSON.stringify(profile, null, 2);
        } else if (format === 'markdown') {
            let md = '# Tone Profile Analysis\n\n';
            md += `Generated: ${profile.generated}\n\n`;
            md += '## Detected Tone Profiles\n\n';
            
            for (const [name, fingerprint] of Object.entries(profile.seedFingerprints)) {
                md += `### ${name}\n\n`;
                md += 'Tone Scores:\n';
                for (const [tone, score] of Object.entries(fingerprint.toneScores || {})) {
                    md += `- ${tone}: ${(score * 100).toFixed(1)}%\n`;
                }
                md += '\n';
            }
            
            return md;
        }
        
        return profile;
    }
}

module.exports = ToneMatcher;