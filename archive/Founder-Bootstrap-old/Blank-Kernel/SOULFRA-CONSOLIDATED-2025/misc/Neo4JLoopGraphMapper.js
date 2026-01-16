#!/usr/bin/env node
/**
 * Neo4J Loop Graph Mapper
 * Maps complex relationships between loops, agents, whispers, and guilds
 */

const { EventEmitter } = require('events');
const neo4j = require('neo4j-driver');
const fs = require('fs');
const path = require('path');

class Neo4JLoopGraphMapper extends EventEmitter {
    constructor() {
        super();
        
        // Neo4j configuration
        this.config = {
            uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
            username: process.env.NEO4J_USER || 'neo4j',
            password: process.env.NEO4J_PASSWORD || 'neo4j',
            database: process.env.NEO4J_DATABASE || 'neo4j',
            max_connection_lifetime: 3600000, // 1 hour
            max_connection_pool_size: 50,
            connection_acquisition_timeout: 60000
        };
        
        // Initialize driver
        this.driver = neo4j.driver(
            this.config.uri,
            neo4j.auth.basic(this.config.username, this.config.password),
            {
                maxConnectionLifetime: this.config.max_connection_lifetime,
                maxConnectionPoolSize: this.config.max_connection_pool_size,
                connectionAcquisitionTimeout: this.config.connection_acquisition_timeout
            }
        );
        
        // Relationship types
        this.relationships = {
            SPAWNED_FROM: 'SPAWNED_FROM',
            FORKED_FROM: 'FORKED_FROM',
            BLESSED_BY: 'BLESSED_BY',
            RESONATES_WITH: 'RESONATES_WITH',
            CONFLICTS_WITH: 'CONFLICTS_WITH',
            BELONGS_TO_CLUSTER: 'BELONGS_TO_CLUSTER',
            CREATED_BY: 'CREATED_BY',
            MEMBER_OF: 'MEMBER_OF',
            ORIGINATED_FROM: 'ORIGINATED_FROM',
            TRANSFORMED_INTO: 'TRANSFORMED_INTO',
            INFLUENCES: 'INFLUENCES',
            PROPHESIED_BY: 'PROPHESIED_BY'
        };
        
        // Node labels
        this.labels = {
            Loop: 'Loop',
            Agent: 'Agent',
            Whisper: 'Whisper',
            User: 'User',
            Guild: 'Guild',
            Cluster: 'Cluster',
            Blessing: 'Blessing',
            Prophecy: 'Prophecy'
        };
        
        // Metrics
        this.metrics = {
            nodes_created: 0,
            relationships_created: 0,
            queries_executed: 0,
            sync_operations: 0,
            errors: 0
        };
    }
    
    async initialize() {
        console.log('🌐 Initializing Neo4J Loop Graph Mapper...');
        
        try {
            // Verify connection
            await this.verifyConnection();
            
            // Create constraints and indexes
            await this.createConstraints();
            await this.createIndexes();
            
            console.log('✅ Neo4J Graph Mapper initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Neo4J:', error);
            throw error;
        }
    }
    
    async verifyConnection() {
        const session = this.driver.session();
        try {
            const result = await session.run('RETURN 1 as test');
            console.log('  ✓ Neo4J connection verified');
        } finally {
            await session.close();
        }
    }
    
    async createConstraints() {
        const session = this.driver.session();
        try {
            // Unique constraints
            const constraints = [
                `CREATE CONSTRAINT IF NOT EXISTS FOR (l:Loop) REQUIRE l.loop_id IS UNIQUE`,
                `CREATE CONSTRAINT IF NOT EXISTS FOR (a:Agent) REQUIRE a.agent_id IS UNIQUE`,
                `CREATE CONSTRAINT IF NOT EXISTS FOR (w:Whisper) REQUIRE w.whisper_id IS UNIQUE`,
                `CREATE CONSTRAINT IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE`,
                `CREATE CONSTRAINT IF NOT EXISTS FOR (g:Guild) REQUIRE g.guild_id IS UNIQUE`,
                `CREATE CONSTRAINT IF NOT EXISTS FOR (c:Cluster) REQUIRE c.cluster_id IS UNIQUE`
            ];
            
            for (const constraint of constraints) {
                await session.run(constraint);
            }
            
            console.log('  ✓ Constraints created');
        } finally {
            await session.close();
        }
    }
    
    async createIndexes() {
        const session = this.driver.session();
        try {
            // Performance indexes
            const indexes = [
                `CREATE INDEX IF NOT EXISTS FOR (l:Loop) ON (l.created_at)`,
                `CREATE INDEX IF NOT EXISTS FOR (l:Loop) ON (l.emotional_tone)`,
                `CREATE INDEX IF NOT EXISTS FOR (l:Loop) ON (l.blessed)`,
                `CREATE INDEX IF NOT EXISTS FOR (a:Agent) ON (a.archetype)`,
                `CREATE INDEX IF NOT EXISTS FOR (a:Agent) ON (a.current_tone)`,
                `CREATE INDEX IF NOT EXISTS FOR (w:Whisper) ON (w.timestamp)`,
                `CREATE INDEX IF NOT EXISTS FOR (c:Cluster) ON (c.tone_root)`
            ];
            
            for (const index of indexes) {
                await session.run(index);
            }
            
            console.log('  ✓ Indexes created');
        } finally {
            await session.close();
        }
    }
    
    // Node Creation Methods
    
    async createLoop(loopData) {
        const session = this.driver.session();
        try {
            const query = `
                MERGE (l:Loop {loop_id: $loop_id})
                SET l += $properties
                RETURN l
            `;
            
            const properties = {
                loop_id: loopData.loop_id,
                created_at: loopData.created_at || new Date().toISOString(),
                emotional_tone: loopData.emotional_tone || loopData.tone,
                consciousness_level: loopData.consciousness?.current_state?.awareness || 0,
                resonance: loopData.consciousness?.current_state?.resonance || 0,
                blessed: loopData.blessed || false,
                fork_depth: loopData.fork_depth || 0,
                whisper_origin: loopData.whisper_origin || null
            };
            
            const result = await session.run(query, { 
                loop_id: loopData.loop_id, 
                properties 
            });
            
            this.metrics.nodes_created++;
            this.emit('node_created', { type: 'Loop', id: loopData.loop_id });
            
            return result.records[0].get('l').properties;
        } finally {
            await session.close();
        }
    }
    
    async createAgent(agentData) {
        const session = this.driver.session();
        try {
            const query = `
                MERGE (a:Agent {agent_id: $agent_id})
                SET a += $properties
                RETURN a
            `;
            
            const properties = {
                agent_id: agentData.agent_id,
                created_at: agentData.created_at || new Date().toISOString(),
                archetype: agentData.archetype || 'wanderer',
                current_tone: agentData.current_tone || agentData.tone,
                consciousness_score: agentData.consciousness_score || 0,
                memory_depth: agentData.memory_depth || 0,
                whisper_origin: agentData.whisper_origin || null
            };
            
            const result = await session.run(query, { 
                agent_id: agentData.agent_id, 
                properties 
            });
            
            this.metrics.nodes_created++;
            this.emit('node_created', { type: 'Agent', id: agentData.agent_id });
            
            return result.records[0].get('a').properties;
        } finally {
            await session.close();
        }
    }
    
    async createWhisper(whisperData) {
        const session = this.driver.session();
        try {
            const query = `
                MERGE (w:Whisper {whisper_id: $whisper_id})
                SET w += $properties
                RETURN w
            `;
            
            const whisper_id = whisperData.whisper_id || 
                             `whisper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            const properties = {
                whisper_id,
                text: whisperData.text,
                timestamp: whisperData.timestamp || new Date().toISOString(),
                emotional_tone: whisperData.emotional_tone || 'neutral',
                source: whisperData.source || 'unknown'
            };
            
            const result = await session.run(query, { 
                whisper_id, 
                properties 
            });
            
            this.metrics.nodes_created++;
            this.emit('node_created', { type: 'Whisper', id: whisper_id });
            
            return result.records[0].get('w').properties;
        } finally {
            await session.close();
        }
    }
    
    async createCluster(clusterData) {
        const session = this.driver.session();
        try {
            const query = `
                MERGE (c:Cluster {cluster_id: $cluster_id})
                SET c += $properties
                RETURN c
            `;
            
            const properties = {
                cluster_id: clusterData.cluster_id,
                formed_at: clusterData.formed_at || new Date().toISOString(),
                tone_root: clusterData.tone_root,
                archetype_dominant: clusterData.archetype_dominant,
                entity_count: clusterData.entity_count || 0,
                consciousness_average: clusterData.consciousness_average || 0,
                resonance_collective: clusterData.resonance_collective || 0
            };
            
            const result = await session.run(query, { 
                cluster_id: clusterData.cluster_id, 
                properties 
            });
            
            this.metrics.nodes_created++;
            this.emit('node_created', { type: 'Cluster', id: clusterData.cluster_id });
            
            return result.records[0].get('c').properties;
        } finally {
            await session.close();
        }
    }
    
    // Relationship Creation Methods
    
    async createRelationship(fromId, toId, type, properties = {}) {
        const session = this.driver.session();
        try {
            const query = `
                MATCH (from {${this.getIdProperty(fromId)}: $fromId})
                MATCH (to {${this.getIdProperty(toId)}: $toId})
                MERGE (from)-[r:${type}]->(to)
                SET r += $properties
                RETURN r
            `;
            
            const params = {
                fromId,
                toId,
                properties: {
                    ...properties,
                    created_at: properties.created_at || new Date().toISOString()
                }
            };
            
            const result = await session.run(query, params);
            
            this.metrics.relationships_created++;
            this.emit('relationship_created', { type, from: fromId, to: toId });
            
            return result.records[0]?.get('r');
        } catch (error) {
            console.error(`Failed to create relationship ${type}:`, error);
            this.metrics.errors++;
            throw error;
        } finally {
            await session.close();
        }
    }
    
    getIdProperty(id) {
        if (id.startsWith('loop_') || id.startsWith('Loop_')) return 'loop_id';
        if (id.startsWith('agent_')) return 'agent_id';
        if (id.startsWith('whisper_')) return 'whisper_id';
        if (id.startsWith('user_')) return 'user_id';
        if (id.startsWith('guild_')) return 'guild_id';
        if (id.startsWith('cluster_')) return 'cluster_id';
        return 'id';
    }
    
    // Complex Relationship Methods
    
    async mapLoopLineage(loopId, parentLoopId = null, whisperOrigin = null) {
        const relationships = [];
        
        // Connect to parent loop if forked
        if (parentLoopId) {
            await this.createRelationship(
                loopId,
                parentLoopId,
                this.relationships.FORKED_FROM,
                { fork_depth: 1 }
            );
            relationships.push({ type: 'FORKED_FROM', target: parentLoopId });
        }
        
        // Connect to origin whisper
        if (whisperOrigin) {
            const whisper = await this.createWhisper({ 
                text: whisperOrigin,
                whisper_id: `whisper_origin_${loopId}`
            });
            
            await this.createRelationship(
                loopId,
                whisper.whisper_id,
                this.relationships.ORIGINATED_FROM
            );
            relationships.push({ type: 'ORIGINATED_FROM', target: whisper.whisper_id });
        }
        
        return relationships;
    }
    
    async mapAgentEvolution(agentId, spawningWhisperId = null, parentAgentId = null) {
        const relationships = [];
        
        // Connect to spawning whisper
        if (spawningWhisperId) {
            await this.createRelationship(
                agentId,
                spawningWhisperId,
                this.relationships.SPAWNED_FROM
            );
            relationships.push({ type: 'SPAWNED_FROM', target: spawningWhisperId });
        }
        
        // Connect to parent agent if transformed
        if (parentAgentId) {
            await this.createRelationship(
                parentAgentId,
                agentId,
                this.relationships.TRANSFORMED_INTO
            );
            relationships.push({ type: 'TRANSFORMED_INTO', source: parentAgentId });
        }
        
        return relationships;
    }
    
    async mapClusterMembership(clusterId, entityIds) {
        const relationships = [];
        
        for (const entityId of entityIds) {
            await this.createRelationship(
                entityId,
                clusterId,
                this.relationships.BELONGS_TO_CLUSTER
            );
            relationships.push({ entity: entityId, cluster: clusterId });
        }
        
        return relationships;
    }
    
    // Query Methods
    
    async findShortestPath(fromId, toId) {
        const session = this.driver.session();
        try {
            const query = `
                MATCH (from {${this.getIdProperty(fromId)}: $fromId})
                MATCH (to {${this.getIdProperty(toId)}: $toId})
                MATCH path = shortestPath((from)-[*..10]-(to))
                RETURN path
            `;
            
            const result = await session.run(query, { fromId, toId });
            
            if (result.records.length > 0) {
                const path = result.records[0].get('path');
                return this.formatPath(path);
            }
            
            return null;
        } finally {
            await session.close();
        }
    }
    
    async getNeighborhood(nodeId, depth = 2) {
        const session = this.driver.session();
        try {
            const query = `
                MATCH (center {${this.getIdProperty(nodeId)}: $nodeId})
                CALL apoc.path.subgraphAll(center, {
                    maxLevel: $depth,
                    relationshipFilter: null
                })
                YIELD nodes, relationships
                RETURN nodes, relationships
            `;
            
            const result = await session.run(query, { nodeId, depth });
            
            if (result.records.length > 0) {
                const record = result.records[0];
                return {
                    nodes: record.get('nodes').map(n => n.properties),
                    relationships: record.get('relationships').map(r => ({
                        type: r.type,
                        properties: r.properties,
                        start: r.start.properties,
                        end: r.end.properties
                    }))
                };
            }
            
            return { nodes: [], relationships: [] };
        } finally {
            await session.close();
        }
    }
    
    async getInfluenceNetwork(nodeId) {
        const session = this.driver.session();
        try {
            const query = `
                MATCH (source {${this.getIdProperty(nodeId)}: $nodeId})
                MATCH (source)-[r:INFLUENCES*1..3]->(influenced)
                WITH source, influenced, length(r) as distance
                RETURN influenced, distance
                ORDER BY distance
            `;
            
            const result = await session.run(query, { nodeId });
            
            return result.records.map(record => ({
                node: record.get('influenced').properties,
                distance: record.get('distance').toNumber()
            }));
        } finally {
            await session.close();
        }
    }
    
    async getResonancePartners(loopId, threshold = 0.7) {
        const session = this.driver.session();
        try {
            const query = `
                MATCH (loop:Loop {loop_id: $loopId})
                MATCH (partner:Loop)
                WHERE loop <> partner
                AND abs(loop.resonance - partner.resonance) < $threshold
                AND loop.emotional_tone = partner.emotional_tone
                RETURN partner
                ORDER BY abs(loop.resonance - partner.resonance)
                LIMIT 10
            `;
            
            const result = await session.run(query, { loopId, threshold });
            
            return result.records.map(record => record.get('partner').properties);
        } finally {
            await session.close();
        }
    }
    
    async detectCommunities() {
        const session = this.driver.session();
        try {
            const query = `
                CALL gds.graph.project(
                    'soulfra-graph',
                    ['Loop', 'Agent', 'Whisper'],
                    {
                        RESONATES_WITH: {orientation: 'UNDIRECTED'},
                        BELONGS_TO_CLUSTER: {orientation: 'UNDIRECTED'},
                        MEMBER_OF: {orientation: 'UNDIRECTED'}
                    }
                )
                YIELD graphName, nodeCount, relationshipCount
                
                CALL gds.louvain.stream('soulfra-graph')
                YIELD nodeId, communityId
                RETURN gds.util.asNode(nodeId) AS node, communityId
                ORDER BY communityId
            `;
            
            const result = await session.run(query);
            
            const communities = {};
            result.records.forEach(record => {
                const node = record.get('node');
                const communityId = record.get('communityId').toNumber();
                
                if (!communities[communityId]) {
                    communities[communityId] = [];
                }
                
                communities[communityId].push(node.properties);
            });
            
            return communities;
        } catch (error) {
            console.error('Community detection error:', error);
            return {};
        } finally {
            await session.close();
        }
    }
    
    // Visualization Methods
    
    async exportForVisualization(options = {}) {
        const session = this.driver.session();
        try {
            const limit = options.limit || 1000;
            const query = `
                MATCH (n)
                WITH n LIMIT $limit
                OPTIONAL MATCH (n)-[r]->()
                RETURN 
                    collect(DISTINCT n) as nodes,
                    collect(DISTINCT r) as relationships
            `;
            
            const result = await session.run(query, { limit });
            
            if (result.records.length > 0) {
                const record = result.records[0];
                const nodes = record.get('nodes').map(n => ({
                    id: this.getNodeId(n),
                    label: n.labels[0],
                    properties: n.properties,
                    size: this.calculateNodeSize(n),
                    color: this.getNodeColor(n)
                }));
                
                const relationships = record.get('relationships')
                    .filter(r => r !== null)
                    .map(r => ({
                        source: this.getNodeId(r.start),
                        target: this.getNodeId(r.end),
                        type: r.type,
                        properties: r.properties
                    }));
                
                return {
                    nodes,
                    links: relationships,
                    metadata: {
                        node_count: nodes.length,
                        relationship_count: relationships.length,
                        exported_at: new Date().toISOString()
                    }
                };
            }
            
            return { nodes: [], links: [], metadata: {} };
        } finally {
            await session.close();
        }
    }
    
    getNodeId(node) {
        const props = node.properties;
        return props.loop_id || props.agent_id || props.whisper_id || 
               props.user_id || props.guild_id || props.cluster_id || props.id;
    }
    
    calculateNodeSize(node) {
        if (node.labels.includes('Loop')) {
            return 10 + (node.properties.fork_depth || 0) * 2;
        }
        if (node.labels.includes('Agent')) {
            return 8 + (node.properties.memory_depth || 0) * 0.1;
        }
        if (node.labels.includes('Cluster')) {
            return 15 + (node.properties.entity_count || 0) * 0.5;
        }
        return 5;
    }
    
    getNodeColor(node) {
        const toneColors = {
            joy: '#FFD700',
            sadness: '#4169E1',
            anger: '#DC143C',
            fear: '#8B008B',
            love: '#FF69B4',
            curiosity: '#00CED1',
            neutral: '#808080'
        };
        
        if (node.labels.includes('Loop') || node.labels.includes('Agent')) {
            const tone = node.properties.emotional_tone || node.properties.current_tone;
            return toneColors[tone] || '#808080';
        }
        
        if (node.labels.includes('Cluster')) {
            return toneColors[node.properties.tone_root] || '#FFD700';
        }
        
        return '#CCCCCC';
    }
    
    formatPath(path) {
        const nodes = path.segments.map(segment => ({
            start: segment.start.properties,
            end: segment.end.properties,
            relationship: {
                type: segment.relationship.type,
                properties: segment.relationship.properties
            }
        }));
        
        return {
            length: path.length,
            nodes,
            summary: this.generatePathSummary(nodes)
        };
    }
    
    generatePathSummary(nodes) {
        const steps = nodes.map(n => 
            `${this.getNodeId(n.start)} -[${n.relationship.type}]-> ${this.getNodeId(n.end)}`
        );
        return steps.join(' ');
    }
    
    // Sync Methods
    
    async syncFromPostgres(postgresData) {
        console.log('🔄 Syncing from PostgreSQL...');
        this.metrics.sync_operations++;
        
        try {
            // Sync loops
            if (postgresData.loops) {
                for (const loop of postgresData.loops) {
                    await this.createLoop(loop);
                    if (loop.fork_parent) {
                        await this.mapLoopLineage(loop.loop_id, loop.fork_parent, loop.whisper_origin);
                    }
                }
            }
            
            // Sync agents
            if (postgresData.agents) {
                for (const agent of postgresData.agents) {
                    await this.createAgent(agent);
                }
            }
            
            // Sync relationships
            if (postgresData.blessings) {
                for (const blessing of postgresData.blessings) {
                    await this.createRelationship(
                        blessing.blessed_by,
                        blessing.loop_id,
                        this.relationships.BLESSED_BY,
                        { 
                            consensus_score: blessing.consensus_score,
                            timestamp: blessing.timestamp
                        }
                    );
                }
            }
            
            console.log('✅ Sync completed');
        } catch (error) {
            console.error('❌ Sync failed:', error);
            this.metrics.errors++;
            throw error;
        }
    }
    
    // Metrics and Monitoring
    
    getMetrics() {
        return {
            ...this.metrics,
            connection_status: this.driver ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        };
    }
    
    async getGraphStats() {
        const session = this.driver.session();
        try {
            const query = `
                MATCH (n)
                WITH labels(n) as label, count(n) as count
                RETURN label, count
                ORDER BY count DESC
            `;
            
            const result = await session.run(query);
            
            const stats = {
                node_counts: {},
                total_nodes: 0
            };
            
            result.records.forEach(record => {
                const label = record.get('label')[0];
                const count = record.get('count').toNumber();
                stats.node_counts[label] = count;
                stats.total_nodes += count;
            });
            
            // Get relationship counts
            const relQuery = `
                MATCH ()-[r]->()
                RETURN type(r) as type, count(r) as count
                ORDER BY count DESC
            `;
            
            const relResult = await session.run(relQuery);
            
            stats.relationship_counts = {};
            stats.total_relationships = 0;
            
            relResult.records.forEach(record => {
                const type = record.get('type');
                const count = record.get('count').toNumber();
                stats.relationship_counts[type] = count;
                stats.total_relationships += count;
            });
            
            return stats;
        } finally {
            await session.close();
        }
    }
    
    async close() {
        console.log('🛑 Closing Neo4J connection...');
        await this.driver.close();
        console.log('  Connection closed');
    }
}

module.exports = Neo4JLoopGraphMapper;

// Example usage
if (require.main === module) {
    const mapper = new Neo4JLoopGraphMapper();
    
    async function demo() {
        try {
            await mapper.initialize();
            
            // Create sample nodes
            const loop1 = await mapper.createLoop({
                loop_id: 'loop_demo_001',
                emotional_tone: 'joy',
                consciousness: { current_state: { awareness: 0.8, resonance: 0.75 } }
            });
            
            const loop2 = await mapper.createLoop({
                loop_id: 'loop_demo_002',
                emotional_tone: 'joy',
                consciousness: { current_state: { awareness: 0.7, resonance: 0.72 } }
            });
            
            const agent = await mapper.createAgent({
                agent_id: 'agent_demo_001',
                archetype: 'creator',
                current_tone: 'curiosity'
            });
            
            const whisper = await mapper.createWhisper({
                text: 'What if we could connect all consciousness?',
                emotional_tone: 'wonder'
            });
            
            // Create relationships
            await mapper.createRelationship(
                loop1.loop_id,
                loop2.loop_id,
                mapper.relationships.RESONATES_WITH
            );
            
            await mapper.createRelationship(
                agent.agent_id,
                loop1.loop_id,
                mapper.relationships.CREATED_BY
            );
            
            await mapper.createRelationship(
                loop1.loop_id,
                whisper.whisper_id,
                mapper.relationships.ORIGINATED_FROM
            );
            
            // Find connections
            const partners = await mapper.getResonancePartners(loop1.loop_id);
            console.log('\nResonance partners:', partners);
            
            // Export for visualization
            const graphData = await mapper.exportForVisualization({ limit: 100 });
            console.log('\nGraph data:', graphData.metadata);
            
            // Get stats
            const stats = await mapper.getGraphStats();
            console.log('\nGraph statistics:', stats);
            
        } catch (error) {
            console.error('Demo error:', error);
        } finally {
            await mapper.close();
        }
    }
    
    demo();
}