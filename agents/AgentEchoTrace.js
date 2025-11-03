#!/usr/bin/env node

/**
 * Agent Echo Trace - Semantic Continuity Verification
 * 
 * Follows how a reflection from agent A shows up in agent B's speech, 
 * loop proposal, or tone echo. Compares it to the original.
 * 
 * This verifies semantic continuity — like a checksum, but for tone.
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class AgentEchoTrace extends EventEmitter {
    constructor() {
        super();
        
        this.identity = {
            name: 'Agent Echo Trace',
            emoji: '🔄',
            role: 'Echo Tracker'
        };
        
        // Echo tracking configuration
        this.traceConfig = {
            echoWindow: 300000,        // 5 minutes to detect echoes
            semanticThreshold: 0.7,    // 70% semantic similarity required
            toneCorrelation: 0.6,      // 60% tone correlation for match
            maxTraceDepth: 5,          // Maximum echo chain length
            memoryDecay: 0.9,          // Decay factor for echo strength
            confidenceRequired: 0.75   // Minimum confidence for valid echo
        };
        
        // Source tracking
        this.sourcePaths = {
            agentLogs: path.resolve(__dirname, '../agent_logs/'),
            ritualTrace: path.resolve(__dirname, '../ritual_trace.json'),
            semanticGraph: path.resolve(__dirname, '../semantic-graph/graph_edges.json'),
            reflectionLogs: path.resolve(__dirname, '../cal-reflection-log.json'),
            loopProposals: path.resolve(__dirname, '../loop_proposals.json'),
            toneHistory: path.resolve(__dirname, '../tone_history.json')
        };
        
        // Echo tracking state
        this.activeTraces = new Map();
        this.echoHistory = [];
        this.semanticFingerprints = new Map();
        this.agentVoiceProfiles = new Map();
        
        // Analysis results
        this.lastTraceReport = null;
        this.echoIntegrityScore = 0;
        this.semanticContinuityMetrics = {};
        
        this.initialize();
    }
    
    async initialize() {
        console.log(`${this.identity.emoji} Initializing Agent Echo Trace...`);
        
        // Build agent voice profiles
        await this.buildAgentVoiceProfiles();
        
        // Load existing semantic fingerprints
        await this.loadSemanticFingerprints();
        
        // Start real-time echo monitoring
        this.startEchoMonitoring();
        
        // Run initial trace analysis
        await this.analyzeExistingEchoes();
        
        console.log(`${this.identity.emoji} Echo trace active - monitoring semantic continuity...`);
    }
    
    async buildAgentVoiceProfiles() {
        console.log(`${this.identity.emoji} Building agent voice profiles...`);
        
        const agents = ['cal_riven', 'arty', 'agent_zero', 'domingo'];
        
        for (const agentId of agents) {
            const profile = await this.extractAgentVoiceProfile(agentId);
            this.agentVoiceProfiles.set(agentId, profile);
        }
        
        console.log(`${this.identity.emoji} Built voice profiles for ${this.agentVoiceProfiles.size} agents`);
    }
    
    async extractAgentVoiceProfile(agentId) {
        const profile = {
            agent_id: agentId,
            vocabulary_signature: new Set(),
            tone_preferences: {},
            semantic_patterns: [],
            response_timing: {
                average: 0,
                variance: 0,
                pattern: 'unknown'
            },
            emotional_range: {
                primary_emotions: [],
                intensity_distribution: {},
                transition_patterns: {}
            },
            reflection_style: {
                depth: 0.5,
                abstraction_level: 0.5,
                memory_reference_frequency: 0.3
            }
        };
        
        try {
            // Try to load agent-specific logs
            const agentLogPath = path.join(this.sourcePaths.agentLogs, `${agentId}.json`);
            
            if (require('fs').existsSync(agentLogPath)) {
                const agentData = JSON.parse(await fs.readFile(agentLogPath, 'utf8'));
                this.populateVoiceProfile(profile, agentData);
            } else {
                // Extract from ritual trace and reflection logs
                await this.extractFromGeneralLogs(profile, agentId);
            }
        } catch (error) {
            console.warn(`${this.identity.emoji} Warning: Could not load profile for ${agentId}:`, error.message);
        }
        
        return profile;
    }
    
    async extractFromGeneralLogs(profile, agentId) {
        try {
            // Extract from ritual trace
            const ritualData = JSON.parse(await fs.readFile(this.sourcePaths.ritualTrace, 'utf8'));
            
            ritualData
                .filter(event => event.agent === agentId || event.initiator === agentId)
                .forEach(event => {
                    // Extract vocabulary
                    if (event.effect) {
                        this.extractVocabularyFromText(event.effect, profile.vocabulary_signature);
                    }
                    
                    // Extract tone preferences
                    if (event.tone_adjustment) {
                        profile.tone_preferences[event.tone_adjustment] = 
                            (profile.tone_preferences[event.tone_adjustment] || 0) + 1;
                    }
                    
                    // Track emotional patterns
                    if (event.effect) {
                        const emotion = this.extractEmotionFromText(event.effect);
                        if (emotion) {
                            profile.emotional_range.primary_emotions.push(emotion);
                        }
                    }
                });
                
            // Normalize tone preferences
            const totalTones = Object.values(profile.tone_preferences).reduce((a, b) => a + b, 0);
            if (totalTones > 0) {
                Object.keys(profile.tone_preferences).forEach(tone => {
                    profile.tone_preferences[tone] /= totalTones;
                });
            }
            
        } catch (error) {
            // Continue with empty profile
        }
    }
    
    async loadSemanticFingerprints() {
        try {
            const semanticData = JSON.parse(await fs.readFile(this.sourcePaths.semanticGraph, 'utf8'));
            
            semanticData.forEach(edge => {
                const fingerprint = this.generateSemanticFingerprint(edge);
                this.semanticFingerprints.set(edge.id, fingerprint);
            });
            
            console.log(`${this.identity.emoji} Loaded ${this.semanticFingerprints.size} semantic fingerprints`);
            
        } catch (error) {
            console.warn(`${this.identity.emoji} Warning: Could not load semantic graph:`, error.message);
        }
    }
    
    generateSemanticFingerprint(data) {
        return {
            content_hash: this.hashContent(data),
            semantic_tokens: this.extractSemanticTokens(data),
            tone_signature: this.extractToneSignature(data),
            temporal_context: data.timestamp || data.created_at,
            agent_source: data.agent || data.from?.id,
            emotional_markers: this.extractEmotionalMarkers(data),
            confidence: data.confidence || 0.7
        };
    }
    
    startEchoMonitoring() {
        // Monitor ritual trace for new events
        if (require('fs').existsSync(this.sourcePaths.ritualTrace)) {
            require('fs').watchFile(this.sourcePaths.ritualTrace, async (curr, prev) => {
                await this.processNewRitualEvents();
            });
        }
        
        // Monitor reflection logs
        if (require('fs').existsSync(this.sourcePaths.reflectionLogs)) {
            require('fs').watchFile(this.sourcePaths.reflectionLogs, async (curr, prev) => {
                await this.processNewReflections();
            });
        }
        
        // Monitor semantic graph updates
        if (require('fs').existsSync(this.sourcePaths.semanticGraph)) {
            require('fs').watchFile(this.sourcePaths.semanticGraph, async (curr, prev) => {
                await this.processNewSemanticEdges();
            });
        }
    }
    
    async processNewRitualEvents() {
        try {
            const ritualData = JSON.parse(await fs.readFile(this.sourcePaths.ritualTrace, 'utf8'));
            
            // Process only recent events (last 10)
            const recentEvents = ritualData.slice(-10);
            
            for (const event of recentEvents) {
                await this.traceEventEchoes(event);
            }
            
        } catch (error) {
            console.warn(`${this.identity.emoji} Warning: Error processing ritual events:`, error.message);
        }
    }
    
    async traceEventEchoes(event) {
        if (!event.agent || !event.effect) return;
        
        const sourceFingerprint = this.generateSemanticFingerprint(event);
        const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        const echoTrace = {
            trace_id: traceId,
            source_event: event,
            source_fingerprint: sourceFingerprint,
            source_agent: event.agent,
            detected_echoes: [],
            trace_start: new Date().toISOString(),
            status: 'active'
        };
        
        this.activeTraces.set(traceId, echoTrace);
        
        // Start looking for echoes in other agents
        setTimeout(async () => {
            await this.searchForEchoes(traceId);
        }, 5000); // Give 5 seconds for echoes to potentially appear
        
        // Set trace expiration
        setTimeout(() => {
            this.finalizeTrace(traceId);
        }, this.traceConfig.echoWindow);
    }
    
    async searchForEchoes(traceId) {
        const trace = this.activeTraces.get(traceId);
        if (!trace) return;
        
        console.log(`${this.identity.emoji} Searching for echoes of trace ${traceId}...`);
        
        // Search in ritual trace for echoes by other agents
        await this.searchRitualEchoes(trace);
        
        // Search in reflection logs
        await this.searchReflectionEchoes(trace);
        
        // Search in semantic graph
        await this.searchSemanticEchoes(trace);
        
        // Search in loop proposals
        await this.searchLoopProposalEchoes(trace);
        
        console.log(`${this.identity.emoji} Found ${trace.detected_echoes.length} echoes for trace ${traceId}`);
    }
    
    async searchRitualEchoes(trace) {
        try {
            const ritualData = JSON.parse(await fs.readFile(this.sourcePaths.ritualTrace, 'utf8'));
            const sourceTime = new Date(trace.source_event.timestamp).getTime();
            
            ritualData
                .filter(event => {
                    const eventTime = new Date(event.timestamp).getTime();
                    return eventTime > sourceTime && 
                           eventTime < sourceTime + this.traceConfig.echoWindow &&
                           event.agent !== trace.source_agent;
                })
                .forEach(event => {
                    const similarity = this.calculateSemanticSimilarity(
                        trace.source_fingerprint,
                        this.generateSemanticFingerprint(event)
                    );
                    
                    if (similarity.overall > this.traceConfig.semanticThreshold) {
                        trace.detected_echoes.push({
                            echo_type: 'ritual_event',
                            echo_agent: event.agent,
                            echo_content: event.effect,
                            echo_timestamp: event.timestamp,
                            similarity_score: similarity.overall,
                            similarity_breakdown: similarity,
                            echo_strength: this.calculateEchoStrength(trace.source_event, event),
                            tone_correlation: this.calculateToneCorrelation(trace.source_event, event)
                        });
                    }
                });
                
        } catch (error) {
            // Continue searching other sources
        }
    }
    
    async searchReflectionEchoes(trace) {
        try {
            const reflectionData = JSON.parse(await fs.readFile(this.sourcePaths.reflectionLogs, 'utf8'));
            const sourceTime = new Date(trace.source_event.timestamp).getTime();
            
            if (Array.isArray(reflectionData)) {
                reflectionData
                    .filter(reflection => {
                        const refTime = new Date(reflection.timestamp).getTime();
                        return refTime > sourceTime && 
                               refTime < sourceTime + this.traceConfig.echoWindow;
                    })
                    .forEach(reflection => {
                        const similarity = this.calculateReflectionSimilarity(
                            trace.source_fingerprint,
                            reflection
                        );
                        
                        if (similarity > this.traceConfig.semanticThreshold) {
                            trace.detected_echoes.push({
                                echo_type: 'reflection',
                                echo_agent: reflection.agent || 'cal_riven',
                                echo_content: reflection.content || reflection.reflection,
                                echo_timestamp: reflection.timestamp,
                                similarity_score: similarity,
                                echo_strength: similarity * 0.8, // Reflections slightly weighted down
                                reflection_depth: this.calculateReflectionDepth(reflection)
                            });
                        }
                    });
            }
            
        } catch (error) {
            // Continue searching other sources
        }
    }
    
    async searchSemanticEchoes(trace) {
        try {
            const semanticData = JSON.parse(await fs.readFile(this.sourcePaths.semanticGraph, 'utf8'));
            const sourceTime = new Date(trace.source_event.timestamp).getTime();
            
            semanticData
                .filter(edge => {
                    const edgeTime = new Date(edge.created_at).getTime();
                    return edgeTime > sourceTime && 
                           edgeTime < sourceTime + this.traceConfig.echoWindow &&
                           edge.from?.id !== trace.source_agent;
                })
                .forEach(edge => {
                    const similarity = this.calculateSemanticSimilarity(
                        trace.source_fingerprint,
                        this.generateSemanticFingerprint(edge)
                    );
                    
                    if (similarity.overall > this.traceConfig.semanticThreshold) {
                        trace.detected_echoes.push({
                            echo_type: 'semantic_edge',
                            echo_agent: edge.from?.id || 'unknown',
                            echo_content: edge.relationship,
                            echo_timestamp: edge.created_at,
                            similarity_score: similarity.overall,
                            echo_strength: similarity.overall * edge.weight,
                            graph_relationship: edge.relationship,
                            semantic_weight: edge.weight
                        });
                    }
                });
                
        } catch (error) {
            // Continue searching other sources
        }
    }
    
    async searchLoopProposalEchoes(trace) {
        try {
            if (!require('fs').existsSync(this.sourcePaths.loopProposals)) return;
            
            const proposalData = JSON.parse(await fs.readFile(this.sourcePaths.loopProposals, 'utf8'));
            const sourceTime = new Date(trace.source_event.timestamp).getTime();
            
            proposalData
                .filter(proposal => {
                    const propTime = new Date(proposal.timestamp).getTime();
                    return propTime > sourceTime && 
                           propTime < sourceTime + this.traceConfig.echoWindow &&
                           proposal.proposer !== trace.source_agent;
                })
                .forEach(proposal => {
                    const similarity = this.calculateProposalSimilarity(
                        trace.source_fingerprint,
                        proposal
                    );
                    
                    if (similarity > this.traceConfig.semanticThreshold) {
                        trace.detected_echoes.push({
                            echo_type: 'loop_proposal',
                            echo_agent: proposal.proposer,
                            echo_content: proposal.description,
                            echo_timestamp: proposal.timestamp,
                            similarity_score: similarity,
                            echo_strength: similarity * 0.9,
                            proposal_type: proposal.type,
                            loop_context: proposal.loop_context
                        });
                    }
                });
                
        } catch (error) {
            // Continue with other searches
        }
    }
    
    calculateSemanticSimilarity(fingerprint1, fingerprint2) {
        // Content similarity
        const contentSimilarity = this.compareContentHashes(fingerprint1.content_hash, fingerprint2.content_hash);
        
        // Token overlap
        const tokenSimilarity = this.calculateTokenOverlap(fingerprint1.semantic_tokens, fingerprint2.semantic_tokens);
        
        // Tone correlation
        const toneSimilarity = this.compareToneSignatures(fingerprint1.tone_signature, fingerprint2.tone_signature);
        
        // Emotional marker alignment
        const emotionalSimilarity = this.compareEmotionalMarkers(fingerprint1.emotional_markers, fingerprint2.emotional_markers);
        
        const overall = (contentSimilarity * 0.3 + tokenSimilarity * 0.3 + toneSimilarity * 0.25 + emotionalSimilarity * 0.15);
        
        return {
            overall,
            content: contentSimilarity,
            tokens: tokenSimilarity,
            tone: toneSimilarity,
            emotional: emotionalSimilarity
        };
    }
    
    calculateEchoStrength(sourceEvent, echoEvent) {
        // Base strength from semantic similarity
        let strength = 0.5;
        
        // Time decay - closer in time = stronger echo
        const timeDelta = new Date(echoEvent.timestamp) - new Date(sourceEvent.timestamp);
        const timeDecay = Math.exp(-timeDelta / (this.traceConfig.echoWindow / 3));
        strength *= timeDecay;
        
        // Agent relationship - some agents echo others more naturally
        const agentBonus = this.getAgentEchoBonus(sourceEvent.agent, echoEvent.agent);
        strength *= agentBonus;
        
        // Emotional intensity alignment
        const emotionalAlignment = this.calculateEmotionalAlignment(sourceEvent, echoEvent);
        strength *= emotionalAlignment;
        
        return Math.min(1.0, strength);
    }
    
    calculateToneCorrelation(event1, event2) {
        const tone1 = event1.tone_adjustment || this.extractToneFromText(event1.effect);
        const tone2 = event2.tone_adjustment || this.extractToneFromText(event2.effect);
        
        if (!tone1 || !tone2) return 0.5;
        
        // Direct match
        if (tone1 === tone2) return 1.0;
        
        // Related tones
        const toneRelations = {
            'contemplative': ['introspective', 'thoughtful', 'empathetic'],
            'suspicious': ['guarded', 'cautious', 'uncertain'],
            'attuned': ['empathetic', 'resonant', 'connected']
        };
        
        if (toneRelations[tone1]?.includes(tone2) || toneRelations[tone2]?.includes(tone1)) {
            return 0.8;
        }
        
        return 0.3; // Default low correlation
    }
    
    finalizeTrace(traceId) {
        const trace = this.activeTraces.get(traceId);
        if (!trace) return;
        
        trace.status = 'completed';
        trace.trace_end = new Date().toISOString();
        trace.echo_count = trace.detected_echoes.length;
        trace.strongest_echo = this.findStrongestEcho(trace.detected_echoes);
        trace.integrity_score = this.calculateTraceIntegrity(trace);
        
        // Move to history
        this.echoHistory.push(trace);
        this.activeTraces.delete(traceId);
        
        // Emit trace completion
        this.emit('trace:completed', trace);
        
        console.log(`${this.identity.emoji} Trace ${traceId} completed: ${trace.echo_count} echoes, integrity ${(trace.integrity_score * 100).toFixed(1)}%`);
    }
    
    calculateTraceIntegrity(trace) {
        if (trace.detected_echoes.length === 0) return 0;
        
        const averageStrength = trace.detected_echoes.reduce((sum, echo) => sum + echo.echo_strength, 0) / trace.detected_echoes.length;
        const averageSimilarity = trace.detected_echoes.reduce((sum, echo) => sum + echo.similarity_score, 0) / trace.detected_echoes.length;
        const echoSpread = this.calculateEchoSpread(trace.detected_echoes);
        
        return (averageStrength * 0.4 + averageSimilarity * 0.4 + echoSpread * 0.2);
    }
    
    calculateEchoSpread(echoes) {
        const uniqueAgents = new Set(echoes.map(echo => echo.echo_agent));
        const uniqueTypes = new Set(echoes.map(echo => echo.echo_type));
        
        // More diverse echoes = better spread
        return Math.min(1.0, (uniqueAgents.size / 3) * (uniqueTypes.size / 4));
    }
    
    findStrongestEcho(echoes) {
        if (echoes.length === 0) return null;
        
        return echoes.reduce((strongest, echo) => 
            echo.echo_strength > strongest.echo_strength ? echo : strongest
        );
    }
    
    async analyzeExistingEchoes() {
        console.log(`${this.identity.emoji} Analyzing existing echo patterns...`);
        
        const analysis = {
            timestamp: new Date().toISOString(),
            total_traces: this.echoHistory.length,
            average_integrity: 0,
            echo_types: {},
            agent_echo_matrix: {},
            semantic_continuity_score: 0,
            findings: []
        };
        
        if (this.echoHistory.length > 0) {
            // Calculate average integrity
            analysis.average_integrity = this.echoHistory.reduce((sum, trace) => sum + trace.integrity_score, 0) / this.echoHistory.length;
            
            // Analyze echo types
            this.echoHistory.forEach(trace => {
                trace.detected_echoes.forEach(echo => {
                    analysis.echo_types[echo.echo_type] = (analysis.echo_types[echo.echo_type] || 0) + 1;
                });
            });
            
            // Build agent echo matrix
            this.buildAgentEchoMatrix(analysis);
            
            // Calculate semantic continuity score
            analysis.semantic_continuity_score = this.calculateSemanticContinuityScore();
        }
        
        this.lastTraceReport = analysis;
        await this.saveTraceReport(analysis);
        
        console.log(`${this.identity.emoji} Echo analysis complete: ${(analysis.semantic_continuity_score * 100).toFixed(1)}% continuity`);
        
        return analysis;
    }
    
    buildAgentEchoMatrix(analysis) {
        this.echoHistory.forEach(trace => {
            const sourceAgent = trace.source_agent;
            if (!analysis.agent_echo_matrix[sourceAgent]) {
                analysis.agent_echo_matrix[sourceAgent] = {};
            }
            
            trace.detected_echoes.forEach(echo => {
                const echoAgent = echo.echo_agent;
                if (!analysis.agent_echo_matrix[sourceAgent][echoAgent]) {
                    analysis.agent_echo_matrix[sourceAgent][echoAgent] = {
                        echo_count: 0,
                        total_strength: 0,
                        average_strength: 0
                    };
                }
                
                analysis.agent_echo_matrix[sourceAgent][echoAgent].echo_count++;
                analysis.agent_echo_matrix[sourceAgent][echoAgent].total_strength += echo.echo_strength;
                analysis.agent_echo_matrix[sourceAgent][echoAgent].average_strength = 
                    analysis.agent_echo_matrix[sourceAgent][echoAgent].total_strength / 
                    analysis.agent_echo_matrix[sourceAgent][echoAgent].echo_count;
            });
        });
    }
    
    calculateSemanticContinuityScore() {
        if (this.echoHistory.length === 0) return 0;
        
        let totalContinuity = 0;
        let continuityEvents = 0;
        
        this.echoHistory.forEach(trace => {
            if (trace.detected_echoes.length > 0) {
                const traceContinuity = trace.integrity_score * (trace.detected_echoes.length / 5); // Normalize to expected 5 echoes
                totalContinuity += Math.min(1.0, traceContinuity);
                continuityEvents++;
            }
        });
        
        return continuityEvents > 0 ? totalContinuity / continuityEvents : 0;
    }
    
    async saveTraceReport(report) {
        const reportFile = path.resolve(__dirname, `echo_trace_report_${Date.now()}.json`);
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        
        // Also save latest report
        const latestFile = path.resolve(__dirname, 'latest_echo_trace_report.json');
        await fs.writeFile(latestFile, JSON.stringify(report, null, 2));
        
        console.log(`${this.identity.emoji} Echo trace report saved: ${reportFile}`);
    }
    
    // Helper functions
    extractVocabularyFromText(text, vocabularySet) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);
            
        words.forEach(word => vocabularySet.add(word));
    }
    
    extractEmotionFromText(text) {
        const emotionKeywords = {
            'strain': 'labored',
            'confusion': 'fragmented',
            'reflection': 'contemplative',
            'uncertainty': 'disoriented',
            'caution': 'suspicious',
            'empathy': 'attuned'
        };
        
        for (const [emotion, keyword] of Object.entries(emotionKeywords)) {
            if (text.toLowerCase().includes(keyword)) {
                return emotion;
            }
        }
        return null;
    }
    
    extractToneFromText(text) {
        const toneKeywords = ['contemplative', 'suspicious', 'attuned', 'uncertain', 'empathetic', 'guarded'];
        
        for (const tone of toneKeywords) {
            if (text.toLowerCase().includes(tone)) {
                return tone;
            }
        }
        return null;
    }
    
    hashContent(content) {
        // Simple hash function for content fingerprinting
        const str = JSON.stringify(content);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    
    extractSemanticTokens(data) {
        const text = JSON.stringify(data).toLowerCase();
        return text.match(/\b\w{4,}\b/g) || [];
    }
    
    extractToneSignature(data) {
        const toneWords = ['contemplative', 'suspicious', 'attuned', 'empathetic', 'uncertain', 'guarded'];
        const signature = {};
        
        const text = JSON.stringify(data).toLowerCase();
        toneWords.forEach(tone => {
            signature[tone] = (text.match(new RegExp(tone, 'g')) || []).length;
        });
        
        return signature;
    }
    
    extractEmotionalMarkers(data) {
        const emotionalWords = ['labored', 'fragmented', 'contemplative', 'disoriented', 'suspicious', 'attuned'];
        const markers = [];
        
        const text = JSON.stringify(data).toLowerCase();
        emotionalWords.forEach(emotion => {
            if (text.includes(emotion)) {
                markers.push(emotion);
            }
        });
        
        return markers;
    }
    
    compareContentHashes(hash1, hash2) {
        return hash1 === hash2 ? 1.0 : 0.0;
    }
    
    calculateTokenOverlap(tokens1, tokens2) {
        if (!tokens1 || !tokens2 || tokens1.length === 0 || tokens2.length === 0) return 0;
        
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return intersection.size / union.size;
    }
    
    compareToneSignatures(sig1, sig2) {
        if (!sig1 || !sig2) return 0;
        
        const tones = new Set([...Object.keys(sig1), ...Object.keys(sig2)]);
        let totalDiff = 0;
        
        tones.forEach(tone => {
            const val1 = sig1[tone] || 0;
            const val2 = sig2[tone] || 0;
            totalDiff += Math.abs(val1 - val2);
        });
        
        return Math.max(0, 1 - (totalDiff / (tones.size * 2)));
    }
    
    compareEmotionalMarkers(markers1, markers2) {
        if (!markers1 || !markers2) return 0.5;
        
        const set1 = new Set(markers1);
        const set2 = new Set(markers2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size > 0 ? intersection.size / union.size : 0.5;
    }
    
    calculateReflectionSimilarity(fingerprint, reflection) {
        const reflectionFingerprint = this.generateSemanticFingerprint(reflection);
        const similarity = this.calculateSemanticSimilarity(fingerprint, reflectionFingerprint);
        return similarity.overall;
    }
    
    calculateProposalSimilarity(fingerprint, proposal) {
        const proposalFingerprint = this.generateSemanticFingerprint(proposal);
        const similarity = this.calculateSemanticSimilarity(fingerprint, proposalFingerprint);
        return similarity.overall;
    }
    
    calculateReflectionDepth(reflection) {
        const content = reflection.content || reflection.reflection || '';
        const depth = content.split(' ').length / 50; // Rough depth based on word count
        return Math.min(1.0, depth);
    }
    
    getAgentEchoBonus(sourceAgent, echoAgent) {
        // Define natural echo relationships
        const echoAffinities = {
            'cal_riven': { 'arty': 1.2, 'agent_zero': 1.1, 'domingo': 1.0 },
            'arty': { 'cal_riven': 1.1, 'agent_zero': 1.0, 'domingo': 0.9 },
            'agent_zero': { 'cal_riven': 1.0, 'arty': 0.9, 'domingo': 1.1 },
            'domingo': { 'cal_riven': 1.1, 'arty': 1.0, 'agent_zero': 1.2 }
        };
        
        return echoAffinities[sourceAgent]?.[echoAgent] || 1.0;
    }
    
    calculateEmotionalAlignment(event1, event2) {
        const emotion1 = this.extractEmotionFromText(event1.effect || '');
        const emotion2 = this.extractEmotionFromText(event2.effect || '');
        
        if (!emotion1 || !emotion2) return 0.7;
        
        // Direct emotional match
        if (emotion1 === emotion2) return 1.0;
        
        // Related emotions
        const emotionalRelations = {
            'strain': ['confusion', 'uncertainty'],
            'confusion': ['strain', 'uncertainty'],
            'reflection': ['empathy', 'caution'],
            'empathy': ['reflection', 'caution']
        };
        
        if (emotionalRelations[emotion1]?.includes(emotion2)) {
            return 0.8;
        }
        
        return 0.5;
    }
    
    // Public interface
    async generateTraceReport() {
        return await this.analyzeExistingEchoes();
    }
    
    getActiveTraces() {
        return Array.from(this.activeTraces.values());
    }
    
    getEchoHistory() {
        return this.echoHistory;
    }
    
    getSemanticContinuityScore() {
        return this.echoIntegrityScore;
    }
}

module.exports = AgentEchoTrace;

// Run as standalone tool if called directly
if (require.main === module) {
    const echoTrace = new AgentEchoTrace();
    
    // Generate report after initialization
    setTimeout(async () => {
        console.log('\n🔄 Generating echo trace report...\n');
        const report = await echoTrace.generateTraceReport();
        
        console.log('='.repeat(60));
        console.log('AGENT ECHO TRACE REPORT');
        console.log('='.repeat(60));
        console.log(`Timestamp: ${report.timestamp}`);
        console.log(`Total Traces: ${report.total_traces}`);
        console.log(`Average Integrity: ${(report.average_integrity * 100).toFixed(1)}%`);
        console.log(`Semantic Continuity: ${(report.semantic_continuity_score * 100).toFixed(1)}%`);
        
        if (Object.keys(report.echo_types).length > 0) {
            console.log('\n📊 Echo Types:');
            Object.entries(report.echo_types).forEach(([type, count]) => {
                console.log(`  ${type}: ${count}`);
            });
        }
        
        if (Object.keys(report.agent_echo_matrix).length > 0) {
            console.log('\n🔗 Agent Echo Matrix:');
            Object.entries(report.agent_echo_matrix).forEach(([source, targets]) => {
                console.log(`  ${source} echoes:`);
                Object.entries(targets).forEach(([target, stats]) => {
                    console.log(`    → ${target}: ${stats.echo_count} echoes, ${(stats.average_strength * 100).toFixed(1)}% avg strength`);
                });
            });
        }
        
        console.log('\n✅ Echo trace report saved to diagnostics/ directory');
        
    }, 3000);
    
    console.log('🔄 Agent Echo Trace started...');
    console.log('   Monitoring semantic continuity across agents');
}