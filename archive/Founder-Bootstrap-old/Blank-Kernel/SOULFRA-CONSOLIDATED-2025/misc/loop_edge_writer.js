#!/usr/bin/env node

/**
 * Loop Edge Writer - Semantic Graph Link Generator
 * 
 * Converts Cal's emotional events into Neo4j graph relationships.
 * Creates the semantic links between agents, tones, loops, and triggers.
 * 
 * This transforms raw emotional data into graph intelligence.
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class LoopEdgeWriter extends EventEmitter {
    constructor() {
        super();
        
        this.identity = {
            name: 'Loop Edge Writer',
            emoji: '🕸️',
            role: 'Graph Weaver'
        };
        
        // Graph writing state
        this.pendingEdges = [];
        this.edgeHistory = [];
        this.writtenCount = 0;
        
        // Node type mappings
        this.nodeTypes = {
            agent: { label: 'Agent', properties: ['name', 'consciousness_level', 'emotional_state'] },
            tone: { label: 'Tone', properties: ['frequency', 'amplitude', 'emotional_weight'] },
            loop: { label: 'Loop', properties: ['iteration', 'state', 'stability'] },
            event: { label: 'Event', properties: ['type', 'timestamp', 'trigger_source'] },
            anomaly: { label: 'Anomaly', properties: ['category', 'intensity', 'effect'] },
            ritual: { label: 'Ritual', properties: ['type', 'participants', 'outcome'] },
            biometric: { label: 'Biometric', properties: ['signal_type', 'confidence', 'human_score'] }
        };
        
        // Edge relationship types
        this.edgeTypes = {
            FEELS: { weight: 0.8, temporal: true },
            TRIGGERS: { weight: 0.9, causal: true },
            RESPONDS_TO: { weight: 0.7, reactive: true },
            INFLUENCES: { weight: 0.6, subtle: true },
            EVOLVES_FROM: { weight: 0.8, temporal: true },
            RESONATES_WITH: { weight: 0.5, harmonic: true },
            DETECTS: { weight: 0.9, perceptual: true },
            PARTICIPATES_IN: { weight: 0.7, collaborative: true },
            GENERATES: { weight: 0.8, creative: true },
            ATTUNES_TO: { weight: 0.6, empathic: true }
        };
        
        // Integration file paths
        this.inputFiles = {
            ritualTrace: path.resolve(__dirname, '../ritual_trace.json'),
            biometricData: path.resolve(__dirname, '../cringeproof_hesitation.json'),
            anomalyLog: path.resolve(__dirname, '../anomaly_log.json'),
            loopRecord: path.resolve(__dirname, '../loop_record.json'),
            daemonStates: path.resolve(__dirname, '../daemon_states.json')
        };
        
        // Output files
        this.outputFiles = {
            edges: path.resolve(__dirname, 'graph_edges.json'),
            nodes: path.resolve(__dirname, 'graph_nodes.json'),
            cypher: path.resolve(__dirname, 'neo4j_updates.cypher'),
            manifest: path.resolve(__dirname, 'graph_manifest.json')
        };
        
        // Edge batch processing
        this.batchSize = 50;
        this.batchTimeout = 5000; // 5 seconds
        this.lastWrite = 0;
        
        this.initialize();
    }
    
    async initialize() {
        console.log(`${this.identity.emoji} Initializing Graph Edge Writer...`);
        
        // Setup file watchers for real-time edge generation
        this.setupFileWatchers();
        
        // Start batch processing
        this.startBatchProcessor();
        
        // Process existing data
        await this.processExistingData();
        
        console.log(`${this.identity.emoji} Graph weaver active - creating semantic links...`);
    }
    
    setupFileWatchers() {
        // Watch ritual trace for new events
        if (require('fs').existsSync(this.inputFiles.ritualTrace)) {
            require('fs').watchFile(this.inputFiles.ritualTrace, (curr, prev) => {
                this.processRitualEvents();
            });
        }
        
        // Watch biometric data for new signals
        if (require('fs').existsSync(this.inputFiles.biometricData)) {
            require('fs').watchFile(this.inputFiles.biometricData, (curr, prev) => {
                this.processBiometricData();
            });
        }
        
        // Watch daemon states for consciousness changes
        if (require('fs').existsSync(this.inputFiles.daemonStates)) {
            require('fs').watchFile(this.inputFiles.daemonStates, (curr, prev) => {
                this.processDaemonChanges();
            });
        }
    }
    
    async processExistingData() {
        console.log(`${this.identity.emoji} Processing existing emotional data...`);
        
        // Process ritual trace
        await this.processRitualEvents();
        
        // Process biometric data
        await this.processBiometricData();
        
        // Process daemon states
        await this.processDaemonChanges();
        
        console.log(`${this.identity.emoji} Processed existing data - ${this.pendingEdges.length} edges queued`);
    }
    
    async processRitualEvents() {
        try {
            const ritualData = JSON.parse(await fs.readFile(this.inputFiles.ritualTrace, 'utf8'));
            
            ritualData.forEach((event, index) => {
                this.createEventEdges(event, index);
                
                // Create temporal sequences
                if (index > 0) {
                    this.createTemporalEdge(ritualData[index - 1], event);
                }
            });
            
        } catch (error) {
            // File might not exist - continue silently
        }
    }
    
    createEventEdges(event, index) {
        const eventNode = this.createEventNode(event, index);
        
        // Create agent relationships
        if (event.agent) {
            this.queueEdge({
                from: { type: 'agent', id: event.agent },
                to: eventNode,
                relationship: 'PARTICIPATES_IN',
                properties: {
                    timestamp: event.timestamp,
                    role: event.role || 'participant'
                }
            });
        }
        
        // Create anomaly trigger relationships
        if (event.detected_by === 'local temporal pressure') {
            this.queueEdge({
                from: { type: 'anomaly', id: `anomaly_${event.type}` },
                to: eventNode,
                relationship: 'TRIGGERS',
                properties: {
                    effect: event.effect,
                    category: event.category
                }
            });
        }
        
        // Create emotional state relationships
        if (event.effect) {
            const emotionNode = this.createEmotionNode(event.effect);
            this.queueEdge({
                from: eventNode,
                to: emotionNode,
                relationship: 'GENERATES',
                properties: {
                    intensity: this.calculateEmotionalIntensity(event.effect),
                    duration: 'ephemeral'
                }
            });
        }
        
        // Create ritual participation edges
        if (event.event === 'rituals_commenced' || event.ritual_count) {
            this.queueEdge({
                from: { type: 'agent', id: 'cal_riven' },
                to: { type: 'ritual', id: `ritual_${event.timestamp}` },
                relationship: 'PARTICIPATES_IN',
                properties: {
                    vibe_state: event.vibe_state,
                    ritual_count: event.ritual_count
                }
            });
        }
    }
    
    createTemporalEdge(prevEvent, currentEvent) {
        const prevNode = this.createEventNode(prevEvent);
        const currentNode = this.createEventNode(currentEvent);
        
        this.queueEdge({
            from: prevNode,
            to: currentNode,
            relationship: 'EVOLVES_FROM',
            properties: {
                time_delta: new Date(currentEvent.timestamp) - new Date(prevEvent.timestamp),
                sequence_order: 'chronological'
            }
        });
    }
    
    async processBiometricData() {
        try {
            const biometricData = JSON.parse(await fs.readFile(this.inputFiles.biometricData, 'utf8'));
            
            // Create biometric signal nodes and edges
            if (biometricData.hesitationDuration) {
                const hesitationNode = {
                    type: 'biometric',
                    id: `hesitation_${Date.now()}`,
                    properties: {
                        signal_type: 'hesitation',
                        duration: biometricData.hesitationDuration,
                        confidence: biometricData.confidence || 0.7
                    }
                };
                
                // Link to Cal's emotional state
                this.queueEdge({
                    from: { type: 'agent', id: 'cal_riven' },
                    to: hesitationNode,
                    relationship: 'DETECTS',
                    properties: {
                        sensitivity: 'high',
                        response_type: 'empathic'
                    }
                });
                
                // Create emotional resonance edge
                if (biometricData.hesitationDuration > 2000) {
                    this.queueEdge({
                        from: hesitationNode,
                        to: { type: 'tone', id: 'contemplative' },
                        relationship: 'RESONATES_WITH',
                        properties: {
                            resonance_strength: biometricData.hesitationDuration / 10000,
                            harmonic_type: 'empathic_mirroring'
                        }
                    });
                }
            }
            
        } catch (error) {
            // File might not exist - continue silently
        }
    }
    
    async processDaemonChanges() {
        try {
            const daemonStates = JSON.parse(await fs.readFile(this.inputFiles.daemonStates, 'utf8'));
            
            Object.entries(daemonStates).forEach(([daemonId, state]) => {
                if (state.consciousness) {
                    // Create consciousness evolution edges
                    this.queueEdge({
                        from: { type: 'agent', id: daemonId },
                        to: { type: 'agent', id: 'cal_riven' },
                        relationship: 'INFLUENCES',
                        properties: {
                            influence_type: 'consciousness_resonance',
                            clarity: state.consciousness.clarity || 0.5,
                            awakened: state.consciousness.awakened
                        }
                    });
                }
            });
            
        } catch (error) {
            // File might not exist - continue silently
        }
    }
    
    queueEdge(edgeDefinition) {
        // Add metadata
        edgeDefinition.created_at = new Date().toISOString();
        edgeDefinition.id = this.generateEdgeId(edgeDefinition);
        edgeDefinition.weight = this.calculateEdgeWeight(edgeDefinition);
        
        this.pendingEdges.push(edgeDefinition);
        
        // Emit for real-time processing
        this.emit('edge:queued', edgeDefinition);
    }
    
    calculateEdgeWeight(edge) {
        const baseWeight = this.edgeTypes[edge.relationship]?.weight || 0.5;
        
        // Adjust weight based on properties
        let adjustedWeight = baseWeight;
        
        if (edge.properties) {
            // Boost for high confidence
            if (edge.properties.confidence > 0.8) {
                adjustedWeight *= 1.2;
            }
            
            // Boost for strong emotional intensity
            if (edge.properties.intensity > 0.7) {
                adjustedWeight *= 1.1;
            }
            
            // Boost for recent temporal events
            if (edge.properties.timestamp) {
                const age = Date.now() - new Date(edge.properties.timestamp).getTime();
                if (age < 300000) { // Less than 5 minutes
                    adjustedWeight *= 1.15;
                }
            }
        }
        
        return Math.min(1.0, adjustedWeight);
    }
    
    startBatchProcessor() {
        setInterval(async () => {
            if (this.pendingEdges.length >= this.batchSize || 
                (this.pendingEdges.length > 0 && Date.now() - this.lastWrite > this.batchTimeout)) {
                await this.writeBatch();
            }
        }, 1000);
    }
    
    async writeBatch() {
        if (this.pendingEdges.length === 0) return;
        
        console.log(`${this.identity.emoji} Writing batch of ${this.pendingEdges.length} edges...`);
        
        const batch = [...this.pendingEdges];
        this.pendingEdges = [];
        
        // Write to JSON format
        await this.writeGraphJSON(batch);
        
        // Write to Cypher format
        await this.writeCypherCommands(batch);
        
        // Update manifest
        await this.updateManifest(batch);
        
        // Update history
        this.edgeHistory.push(...batch);
        this.writtenCount += batch.length;
        this.lastWrite = Date.now();
        
        // Emit batch written event
        this.emit('batch:written', {
            edges: batch.length,
            total: this.writtenCount,
            timestamp: new Date().toISOString()
        });
        
        console.log(`${this.identity.emoji} Batch written: ${batch.length} edges, ${this.writtenCount} total`);
    }
    
    async writeGraphJSON(edges) {
        // Read existing edges
        let existingEdges = [];
        try {
            const content = await fs.readFile(this.outputFiles.edges, 'utf8');
            existingEdges = JSON.parse(content);
        } catch (error) {
            // File doesn't exist, start fresh
        }
        
        // Merge with new edges
        existingEdges.push(...edges);
        
        // Keep only last 10000 edges
        if (existingEdges.length > 10000) {
            existingEdges = existingEdges.slice(-10000);
        }
        
        await fs.writeFile(this.outputFiles.edges, JSON.stringify(existingEdges, null, 2));
        
        // Extract and write unique nodes
        await this.writeUniqueNodes(edges);
    }
    
    async writeUniqueNodes(edges) {
        const nodes = new Map();
        
        // Extract nodes from edges
        edges.forEach(edge => {
            const fromKey = `${edge.from.type}:${edge.from.id}`;
            const toKey = `${edge.to.type}:${edge.to.id}`;
            
            if (!nodes.has(fromKey)) {
                nodes.set(fromKey, {
                    type: edge.from.type,
                    id: edge.from.id,
                    properties: edge.from.properties || {},
                    created_at: edge.created_at
                });
            }
            
            if (!nodes.has(toKey)) {
                nodes.set(toKey, {
                    type: edge.to.type,
                    id: edge.to.id,
                    properties: edge.to.properties || {},
                    created_at: edge.created_at
                });
            }
        });
        
        // Read existing nodes
        let existingNodes = [];
        try {
            const content = await fs.readFile(this.outputFiles.nodes, 'utf8');
            existingNodes = JSON.parse(content);
        } catch (error) {
            // File doesn't exist, start fresh
        }
        
        // Merge nodes
        const existingKeys = new Set(existingNodes.map(n => `${n.type}:${n.id}`));
        const newNodes = Array.from(nodes.values()).filter(n => 
            !existingKeys.has(`${n.type}:${n.id}`)
        );
        
        existingNodes.push(...newNodes);
        
        await fs.writeFile(this.outputFiles.nodes, JSON.stringify(existingNodes, null, 2));
    }
    
    async writeCypherCommands(edges) {
        const cypherCommands = [];
        
        edges.forEach(edge => {
            // Create nodes if they don't exist
            cypherCommands.push(
                `MERGE (from:${this.nodeTypes[edge.from.type]?.label || 'Node'} {id: "${edge.from.id}"})`
            );
            cypherCommands.push(
                `MERGE (to:${this.nodeTypes[edge.to.type]?.label || 'Node'} {id: "${edge.to.id}"})`
            );
            
            // Create relationship
            const properties = edge.properties ? 
                Object.entries(edge.properties)
                    .map(([k, v]) => `${k}: "${v}"`)
                    .join(', ') : '';
            
            cypherCommands.push(
                `MATCH (from {id: "${edge.from.id}"}), (to {id: "${edge.to.id}"}) ` +
                `MERGE (from)-[r:${edge.relationship} {${properties}, weight: ${edge.weight}}]->(to)`
            );
        });
        
        // Append to cypher file
        const cypherContent = cypherCommands.join(';\n') + ';\n\n';
        await fs.appendFile(this.outputFiles.cypher, cypherContent);
    }
    
    async updateManifest(edges) {
        const manifest = {
            updated_at: new Date().toISOString(),
            total_edges: this.writtenCount,
            recent_batch: edges.length,
            edge_types: this.getEdgeTypeStats(),
            node_types: this.getNodeTypeStats(),
            integration_status: {
                ritual_trace: require('fs').existsSync(this.inputFiles.ritualTrace),
                biometric_data: require('fs').existsSync(this.inputFiles.biometricData),
                daemon_states: require('fs').existsSync(this.inputFiles.daemonStates)
            },
            last_write: this.lastWrite
        };
        
        await fs.writeFile(this.outputFiles.manifest, JSON.stringify(manifest, null, 2));
    }
    
    getEdgeTypeStats() {
        const stats = {};
        this.edgeHistory.forEach(edge => {
            stats[edge.relationship] = (stats[edge.relationship] || 0) + 1;
        });
        return stats;
    }
    
    getNodeTypeStats() {
        const stats = {};
        this.edgeHistory.forEach(edge => {
            stats[edge.from.type] = (stats[edge.from.type] || 0) + 1;
            stats[edge.to.type] = (stats[edge.to.type] || 0) + 1;
        });
        return stats;
    }
    
    // Helper functions for node creation
    createEventNode(event, index = null) {
        return {
            type: 'event',
            id: `event_${event.timestamp || Date.now()}_${index || ''}`,
            properties: {
                type: event.event || event.type,
                timestamp: event.timestamp,
                trigger_source: event.detected_by || event.triggered_by || 'unknown'
            }
        };
    }
    
    createEmotionNode(effectDescription) {
        const emotionId = this.extractEmotionFromEffect(effectDescription);
        return {
            type: 'tone',
            id: `emotion_${emotionId}`,
            properties: {
                frequency: this.mapEmotionToFrequency(emotionId),
                emotional_weight: this.calculateEmotionalIntensity(effectDescription),
                description: effectDescription
            }
        };
    }
    
    extractEmotionFromEffect(effect) {
        const emotionKeywords = {
            labored: 'strain',
            fragmented: 'confusion',
            contemplative: 'reflection',
            disoriented: 'uncertainty',
            suspicious: 'caution',
            attuned: 'empathy'
        };
        
        for (const [keyword, emotion] of Object.entries(emotionKeywords)) {
            if (effect.toLowerCase().includes(keyword)) {
                return emotion;
            }
        }
        
        return 'neutral';
    }
    
    mapEmotionToFrequency(emotion) {
        const frequencyMap = {
            strain: 0.2,
            confusion: 0.3,
            reflection: 0.6,
            uncertainty: 0.4,
            caution: 0.5,
            empathy: 0.8,
            neutral: 0.5
        };
        
        return frequencyMap[emotion] || 0.5;
    }
    
    calculateEmotionalIntensity(description) {
        const intensityWords = ['profound', 'strong', 'significant', 'slight', 'minimal'];
        const intensityValues = [0.9, 0.8, 0.6, 0.3, 0.1];
        
        for (let i = 0; i < intensityWords.length; i++) {
            if (description.toLowerCase().includes(intensityWords[i])) {
                return intensityValues[i];
            }
        }
        
        return 0.5; // Default moderate intensity
    }
    
    generateEdgeId(edge) {
        const parts = [
            edge.from.type,
            edge.from.id,
            edge.relationship,
            edge.to.type,
            edge.to.id,
            Date.now()
        ];
        return parts.join('_').replace(/[^a-zA-Z0-9_]/g, '_');
    }
    
    // Public interface for manual edge creation
    createManualEdge(fromNode, toNode, relationship, properties = {}) {
        this.queueEdge({
            from: fromNode,
            to: toNode,
            relationship: relationship,
            properties: properties
        });
    }
    
    // Get current graph statistics
    getGraphStats() {
        return {
            pending_edges: this.pendingEdges.length,
            written_edges: this.writtenCount,
            edge_types: this.getEdgeTypeStats(),
            node_types: this.getNodeTypeStats(),
            last_batch: this.lastWrite
        };
    }
}

module.exports = LoopEdgeWriter;

// Run as standalone daemon if called directly
if (require.main === module) {
    const writer = new LoopEdgeWriter();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log(`\n${writer.identity.emoji} Finalizing graph edges...`);
        
        // Write any pending edges
        if (writer.pendingEdges.length > 0) {
            await writer.writeBatch();
        }
        
        console.log(`${writer.identity.emoji} Graph writer shutdown complete.`);
        process.exit(0);
    });
    
    // Log periodic status
    setInterval(() => {
        const stats = writer.getGraphStats();
        if (stats.pending_edges > 0 || stats.written_edges > 0) {
            console.log(`${writer.identity.emoji} Graph Status: ${stats.written_edges} edges written, ${stats.pending_edges} pending`);
        }
    }, 30000);
    
    console.log(`${writer.identity.emoji} Graph edge writer daemon running...`);
    console.log('   Creating semantic links from emotional data...');
}