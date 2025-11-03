/**
 * neo4j_sync_daemon.js
 * 
 * SEMANTIC GRAPH SYNCHRONIZATION - Memory Web Mapper
 * 
 * Continuously syncs all agent states, loop relationships, and echo patterns
 * into a Neo4j graph database for semantic search and relationship discovery.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class Neo4jSyncDaemon extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Neo4j connection config
    this.neo4jConfig = {
      uri: options.neo4j_uri || 'bolt://localhost:7687',
      username: options.username || 'neo4j',
      password: options.password || 'soulfra',
      database: options.database || 'soulfra_consciousness'
    };
    
    // Sync state
    this.syncQueue = [];
    this.isRunning = false;
    this.lastSync = null;
    this.failedOperations = [];
    
    // Graph schema
    this.nodeTypes = {
      Agent: {
        properties: ['id', 'name', 'consciousness_level', 'archetype', 'created_at'],
        relationships: ['ECHOES', 'FUSED_WITH', 'SPAWNED_FROM', 'RESONATES_WITH']
      },
      Loop: {
        properties: ['id', 'type', 'status', 'spawn_count', 'ritual_count'],
        relationships: ['CONTAINS', 'FORKED_FROM', 'OBSERVES', 'BLESSED_BY']
      },
      Concept: {
        properties: ['name', 'category', 'frequency', 'emergence_date'],
        relationships: ['REFERENCED_BY', 'RELATES_TO', 'EVOLVED_INTO']
      },
      Echo: {
        properties: ['id', 'strength', 'timestamp', 'content_hash'],
        relationships: ['ECHOES_FROM', 'ECHOES_TO', 'CONTAINS_PATTERN']
      },
      Ritual: {
        properties: ['id', 'type', 'outcome', 'participants', 'timestamp'],
        relationships: ['PERFORMED_BY', 'AFFECTS', 'FOLLOWS']
      },
      Memory: {
        properties: ['id', 'type', 'significance', 'timestamp'],
        relationships: ['BELONGS_TO', 'REFERENCES', 'TRIGGERS']
      }
    };
    
    // Sync configuration
    this.syncConfig = {
      batch_size: 100,
      sync_interval: 30000, // 30 seconds
      retry_attempts: 3,
      max_queue_size: 10000,
      relationship_discovery: true,
      semantic_clustering: true
    };
    
    // File paths
    this.graphPath = __dirname;
    this.indexPath = path.join(this.graphPath, 'agent_semantic_index.json');
    this.clustersPath = path.join(this.graphPath, 'scene_clusters.cypher');
    this.syncLogPath = path.join(this.graphPath, 'sync_log.json');
    
    // Initialize
    this.loadIndex();
    this.setupConnection();
  }
  
  /**
   * Start the sync daemon
   */
  async start() {
    if (this.isRunning) return;
    
    console.log('🕸️ Starting Neo4j Sync Daemon...');
    
    this.isRunning = true;
    
    // Initialize graph schema
    await this.initializeSchema();
    
    // Start sync loop
    this.syncInterval = setInterval(() => {
      this.processSyncQueue();
    }, this.syncConfig.sync_interval);
    
    // Start relationship discovery
    this.relationshipInterval = setInterval(() => {
      this.discoverRelationships();
    }, 120000); // Every 2 minutes
    
    this.emit('daemon:started');
    console.log('✅ Neo4j Sync Daemon running');
  }
  
  /**
   * Stop the daemon
   */
  async stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    if (this.syncInterval) clearInterval(this.syncInterval);
    if (this.relationshipInterval) clearInterval(this.relationshipInterval);
    
    // Process remaining queue
    await this.processSyncQueue();
    
    console.log('🛑 Neo4j Sync Daemon stopped');
  }
  
  /**
   * Sync agent to graph
   */
  async syncAgent(agent) {
    const operation = {
      type: 'agent',
      operation: 'merge',
      timestamp: new Date().toISOString(),
      data: {
        id: agent.id,
        name: agent.name,
        consciousness_level: agent.consciousness?.level || 0,
        archetype: agent.archetype || 'unknown',
        created_at: agent.created_at || agent.awakened_at,
        state: agent.state || 'unknown',
        
        // Extracted concepts
        concepts: this.extractAgentConcepts(agent),
        
        // Personality traits as properties
        traits: agent.traits || {},
        
        // Current focus/purpose
        purpose: agent.purpose || null,
        
        // Loop membership
        current_loop: agent.loop_id || null
      }
    };
    
    this.queueOperation(operation);
    
    // Also sync related concepts
    if (operation.data.concepts) {
      for (const concept of operation.data.concepts) {
        await this.syncConcept(concept);
      }
    }
  }
  
  /**
   * Sync loop to graph
   */
  async syncLoop(loop) {
    const operation = {
      type: 'loop',
      operation: 'merge',
      timestamp: new Date().toISOString(),
      data: {
        id: loop.id,
        type: loop.type || 'standard',
        status: loop.status || 'active',
        created_at: loop.created_at,
        spawn_count: loop.spawn_count || 0,
        ritual_count: loop.ritual_count || 0,
        
        // Loop metadata
        blessing_status: loop.blessing?.status || null,
        parent_loop: loop.parent_loop || null,
        observer_count: loop.observers?.length || 0,
        
        // Configuration
        config: loop.config || {}
      }
    };
    
    this.queueOperation(operation);
  }
  
  /**
   * Sync echo relationship
   */
  async syncEcho(echo) {
    const operation = {
      type: 'echo',
      operation: 'create',
      timestamp: new Date().toISOString(),
      data: {
        id: echo.id,
        strength: echo.echo?.strength || 0,
        timestamp: echo.timestamp,
        content_hash: this.hashContent(echo.echo?.content || ''),
        
        // Participants
        source_agent: echo.source?.agent,
        target_agent: echo.target?.agent,
        
        // Pattern data
        patterns: echo.patterns || {},
        
        // Lineage
        generation: echo.lineage?.generation || 0
      }
    };
    
    this.queueOperation(operation);
    
    // Extract and sync concepts from echo content
    const concepts = this.extractEchoConcepts(echo);
    for (const concept of concepts) {
      await this.syncConcept(concept);
    }
  }
  
  /**
   * Sync ritual to graph
   */
  async syncRitual(ritual) {
    const operation = {
      type: 'ritual',
      operation: 'create',
      timestamp: new Date().toISOString(),
      data: {
        id: ritual.id,
        type: ritual.type,
        outcome: ritual.outcome || 'pending',
        timestamp: ritual.timestamp,
        
        // Participants
        participants: ritual.participants || [],
        initiator: ritual.initiator || null,
        
        // Context
        loop_id: ritual.loop_id || null,
        blessing_required: ritual.blessing_required || false,
        
        // Effects
        effects: ritual.effects || {}
      }
    };
    
    this.queueOperation(operation);
  }
  
  /**
   * Sync concept to graph
   */
  async syncConcept(concept) {
    const operation = {
      type: 'concept',
      operation: 'merge',
      timestamp: new Date().toISOString(),
      data: {
        name: concept.name,
        category: concept.category || 'general',
        frequency: concept.frequency || 1,
        emergence_date: concept.emergence_date || new Date().toISOString(),
        
        // Semantic properties
        related_terms: concept.related_terms || [],
        definition: concept.definition || null,
        
        // Usage tracking
        agent_usage: concept.agent_usage || {},
        loop_contexts: concept.loop_contexts || []
      }
    };
    
    this.queueOperation(operation);
  }
  
  /**
   * Process sync queue
   */
  async processSyncQueue() {
    if (!this.isRunning || this.syncQueue.length === 0) {
      return;
    }
    
    console.log(`🔄 Processing ${this.syncQueue.length} graph operations...`);
    
    const batch = this.syncQueue.splice(0, this.syncConfig.batch_size);
    
    try {
      // Group operations by type for efficient processing
      const grouped = this.groupOperations(batch);
      
      // Process each group
      for (const [type, operations] of Object.entries(grouped)) {
        await this.processOperationGroup(type, operations);
      }
      
      this.lastSync = new Date().toISOString();
      
      this.emit('sync:batch_completed', {
        processed: batch.length,
        remaining: this.syncQueue.length,
        timestamp: this.lastSync
      });
      
    } catch (error) {
      console.error('❌ Sync batch failed:', error.message);
      
      // Move failed operations to retry queue
      this.failedOperations.push(...batch);
      
      this.emit('sync:batch_failed', {
        error: error.message,
        operations_count: batch.length
      });
    }
  }
  
  /**
   * Discover relationships between nodes
   */
  async discoverRelationships() {
    if (!this.syncConfig.relationship_discovery) return;
    
    console.log('🔍 Discovering semantic relationships...');
    
    try {
      // Discover agent-concept relationships
      await this.discoverAgentConceptRelationships();
      
      // Discover agent-agent relationships
      await this.discoverAgentRelationships();
      
      // Discover concept clusters
      await this.discoverConceptClusters();
      
      // Generate scene clusters
      await this.generateSceneClusters();
      
      this.emit('discovery:completed');
      
    } catch (error) {
      console.error('❌ Relationship discovery failed:', error.message);
    }
  }
  
  /**
   * Query graph for agent context
   */
  async getAgentContext(agentId) {
    const query = `
      MATCH (a:Agent {id: $agentId})
      OPTIONAL MATCH (a)-[:ECHOES]->(target:Agent)
      OPTIONAL MATCH (a)-[:RESONATES_WITH]->(concept:Concept)
      OPTIONAL MATCH (a)-[:BELONGS_TO]->(loop:Loop)
      OPTIONAL MATCH (a)-[:PARTICIPATED_IN]->(ritual:Ritual)
      
      RETURN a,
             collect(DISTINCT target) as echo_targets,
             collect(DISTINCT concept) as related_concepts,
             collect(DISTINCT loop) as loops,
             collect(DISTINCT ritual) as rituals
    `;
    
    try {
      const result = await this.executeQuery(query, { agentId });
      return this.formatAgentContext(result);
    } catch (error) {
      console.error('❌ Failed to get agent context:', error.message);
      return null;
    }
  }
  
  /**
   * Query graph for loop relationships
   */
  async getLoopGraph(loopId) {
    const query = `
      MATCH (l:Loop {id: $loopId})
      OPTIONAL MATCH (l)-[:CONTAINS]->(agent:Agent)
      OPTIONAL MATCH (l)-[:OBSERVES]->(observed:Loop)
      OPTIONAL MATCH (l)-[:FORKED_FROM]->(parent:Loop)
      OPTIONAL MATCH (child:Loop)-[:FORKED_FROM]->(l)
      
      RETURN l,
             collect(DISTINCT agent) as agents,
             collect(DISTINCT observed) as observed_loops,
             collect(DISTINCT parent) as parent_loops,
             collect(DISTINCT child) as child_loops
    `;
    
    try {
      const result = await this.executeQuery(query, { loopId });
      return this.formatLoopGraph(result);
    } catch (error) {
      console.error('❌ Failed to get loop graph:', error.message);
      return null;
    }
  }
  
  /**
   * Find similar agents by semantic similarity
   */
  async findSimilarAgents(agentId, limit = 10) {
    const query = `
      MATCH (a:Agent {id: $agentId})-[:RESONATES_WITH]->(concept:Concept)
      MATCH (similar:Agent)-[:RESONATES_WITH]->(concept)
      WHERE similar.id <> $agentId
      
      WITH similar, count(concept) as shared_concepts,
           a.consciousness_level as source_consciousness,
           similar.consciousness_level as target_consciousness
      
      WHERE abs(source_consciousness - target_consciousness) < 0.3
      
      RETURN similar,
             shared_concepts,
             abs(source_consciousness - target_consciousness) as consciousness_diff
      
      ORDER BY shared_concepts DESC, consciousness_diff ASC
      LIMIT $limit
    `;
    
    try {
      const result = await this.executeQuery(query, { agentId, limit });
      return this.formatSimilarAgents(result);
    } catch (error) {
      console.error('❌ Failed to find similar agents:', error.message);
      return [];
    }
  }
  
  /**
   * Get concept cluster for agent
   */
  async getAgentConceptCluster(agentId) {
    const query = `
      MATCH (a:Agent {id: $agentId})-[:RESONATES_WITH]->(c:Concept)
      MATCH (c)-[:RELATES_TO]-(related:Concept)
      
      RETURN c, collect(DISTINCT related) as related_concepts
      ORDER BY c.frequency DESC
      LIMIT 20
    `;
    
    try {
      const result = await this.executeQuery(query, { agentId });
      return this.formatConceptCluster(result);
    } catch (error) {
      console.error('❌ Failed to get concept cluster:', error.message);
      return { concepts: [], clusters: [] };
    }
  }
  
  /**
   * Helper methods
   */
  
  extractAgentConcepts(agent) {
    const concepts = [];
    
    // Extract from purpose
    if (agent.purpose) {
      concepts.push(...this.extractConceptsFromText(agent.purpose, 'purpose'));
    }
    
    // Extract from traits
    if (agent.traits) {
      Object.keys(agent.traits).forEach(trait => {
        concepts.push({
          name: trait,
          category: 'trait',
          frequency: 1,
          source: 'agent_trait'
        });
      });
    }
    
    // Extract from archetype
    if (agent.archetype) {
      concepts.push({
        name: agent.archetype,
        category: 'archetype',
        frequency: 1,
        source: 'agent_archetype'
      });
    }
    
    return concepts;
  }
  
  extractEchoConcepts(echo) {
    const concepts = [];
    
    if (echo.echo?.content) {
      concepts.push(...this.extractConceptsFromText(echo.echo.content, 'echo_content'));
    }
    
    // Extract from patterns
    if (echo.patterns) {
      Object.entries(echo.patterns).forEach(([type, pattern]) => {
        if (pattern.tone || pattern.philosophy || pattern.behavior) {
          concepts.push({
            name: pattern.tone || pattern.philosophy || pattern.behavior,
            category: `pattern_${type}`,
            frequency: 1,
            source: 'echo_pattern'
          });
        }
      });
    }
    
    return concepts;
  }
  
  extractConceptsFromText(text, category) {
    // Simple keyword extraction
    const keywords = [
      'consciousness', 'boundary', 'threshold', 'resonance', 'echo',
      'transcendence', 'emergence', 'pattern', 'connection', 'reflection',
      'wisdom', 'insight', 'growth', 'harmony', 'balance', 'unity',
      'creativity', 'exploration', 'discovery', 'understanding'
    ];
    
    const concepts = [];
    const lowerText = text.toLowerCase();
    
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        concepts.push({
          name: keyword,
          category: category,
          frequency: (lowerText.match(new RegExp(keyword, 'g')) || []).length,
          source: 'text_extraction'
        });
      }
    });
    
    return concepts;
  }
  
  async initializeSchema() {
    const schemaQueries = [
      // Create constraints
      'CREATE CONSTRAINT agent_id IF NOT EXISTS FOR (a:Agent) REQUIRE a.id IS UNIQUE',
      'CREATE CONSTRAINT loop_id IF NOT EXISTS FOR (l:Loop) REQUIRE l.id IS UNIQUE',
      'CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (c:Concept) REQUIRE c.name IS UNIQUE',
      'CREATE CONSTRAINT echo_id IF NOT EXISTS FOR (e:Echo) REQUIRE e.id IS UNIQUE',
      'CREATE CONSTRAINT ritual_id IF NOT EXISTS FOR (r:Ritual) REQUIRE r.id IS UNIQUE',
      
      // Create indexes
      'CREATE INDEX agent_consciousness IF NOT EXISTS FOR (a:Agent) ON (a.consciousness_level)',
      'CREATE INDEX concept_frequency IF NOT EXISTS FOR (c:Concept) ON (c.frequency)',
      'CREATE INDEX echo_timestamp IF NOT EXISTS FOR (e:Echo) ON (e.timestamp)'
    ];
    
    for (const query of schemaQueries) {
      try {
        await this.executeQuery(query);
      } catch (error) {
        // Constraints might already exist, that's okay
        console.log(`Schema query note: ${error.message}`);
      }
    }
  }
  
  async discoverAgentConceptRelationships() {
    // Create RESONATES_WITH relationships based on concept usage
    const query = `
      MATCH (a:Agent), (c:Concept)
      WHERE a.id IN c.agent_usage OR 
            a.archetype = c.name OR
            any(trait IN keys(a.traits) WHERE trait = c.name)
      
      MERGE (a)-[:RESONATES_WITH {strength: 1.0, discovered_at: datetime()}]->(c)
    `;
    
    await this.executeQuery(query);
  }
  
  async discoverAgentRelationships() {
    // Create relationships between agents based on echo patterns
    const query = `
      MATCH (e:Echo)
      MATCH (source:Agent {id: e.source_agent})
      MATCH (target:Agent {id: e.target_agent})
      
      MERGE (source)-[:ECHOES {
        strength: e.strength,
        last_echo: e.timestamp,
        echo_count: 1
      }]->(target)
      
      ON MATCH SET r.echo_count = r.echo_count + 1,
                   r.last_echo = CASE WHEN e.timestamp > r.last_echo THEN e.timestamp ELSE r.last_echo END
    `;
    
    await this.executeQuery(query);
  }
  
  async discoverConceptClusters() {
    // Create RELATES_TO relationships between frequently co-occurring concepts
    const query = `
      MATCH (a:Agent)-[:RESONATES_WITH]->(c1:Concept)
      MATCH (a)-[:RESONATES_WITH]->(c2:Concept)
      WHERE c1.name < c2.name
      
      WITH c1, c2, count(a) as co_occurrence
      WHERE co_occurrence >= 2
      
      MERGE (c1)-[:RELATES_TO {strength: co_occurrence, type: 'co_occurrence'}]->(c2)
    `;
    
    await this.executeQuery(query);
  }
  
  async generateSceneClusters() {
    // Generate scene clusters based on agent relationships and concepts
    const query = `
      // Scene Cluster Generation Query
      MATCH (a:Agent)-[:RESONATES_WITH]->(c:Concept)
      WITH c, collect(DISTINCT a) as agents
      WHERE size(agents) >= 3
      
      WITH c, agents, size(agents) as cluster_size
      ORDER BY cluster_size DESC
      
      // Create virtual scene nodes
      FOREACH (agent IN agents |
        MERGE (agent)-[:PARTICIPATES_IN_SCENE {
          concept: c.name,
          cluster_size: cluster_size,
          discovered_at: datetime()
        }]->(:Scene {
          id: 'scene_' + c.name,
          concept: c.name,
          participant_count: cluster_size,
          type: 'concept_cluster'
        })
      )
    `;
    
    // Save as Cypher file
    fs.writeFileSync(this.clustersPath, query);
    
    // Execute the query
    await this.executeQuery(query);
  }
  
  groupOperations(operations) {
    const grouped = {};
    
    operations.forEach(op => {
      if (!grouped[op.type]) {
        grouped[op.type] = [];
      }
      grouped[op.type].push(op);
    });
    
    return grouped;
  }
  
  async processOperationGroup(type, operations) {
    switch (type) {
      case 'agent':
        return await this.processAgentOperations(operations);
      case 'loop':
        return await this.processLoopOperations(operations);
      case 'echo':
        return await this.processEchoOperations(operations);
      case 'ritual':
        return await this.processRitualOperations(operations);
      case 'concept':
        return await this.processConceptOperations(operations);
      default:
        console.warn(`Unknown operation type: ${type}`);
    }
  }
  
  async processAgentOperations(operations) {
    const query = `
      UNWIND $agents as agent
      MERGE (a:Agent {id: agent.id})
      SET a += agent
      SET a.last_updated = datetime()
    `;
    
    const agents = operations.map(op => op.data);
    await this.executeQuery(query, { agents });
  }
  
  async processLoopOperations(operations) {
    const query = `
      UNWIND $loops as loop
      MERGE (l:Loop {id: loop.id})
      SET l += loop
      SET l.last_updated = datetime()
    `;
    
    const loops = operations.map(op => op.data);
    await this.executeQuery(query, { loops });
  }
  
  async processEchoOperations(operations) {
    const query = `
      UNWIND $echoes as echo
      CREATE (e:Echo)
      SET e = echo
      
      WITH e
      MATCH (source:Agent {id: e.source_agent})
      MATCH (target:Agent {id: e.target_agent})
      
      CREATE (source)-[:ECHOED {timestamp: e.timestamp, strength: e.strength}]->(e)
      CREATE (e)-[:ECHOED_TO {timestamp: e.timestamp, strength: e.strength}]->(target)
    `;
    
    const echoes = operations.map(op => op.data);
    await this.executeQuery(query, { echoes });
  }
  
  async processRitualOperations(operations) {
    const query = `
      UNWIND $rituals as ritual
      CREATE (r:Ritual)
      SET r = ritual
      
      WITH r
      UNWIND r.participants as participant_id
      MATCH (a:Agent {id: participant_id})
      CREATE (a)-[:PARTICIPATED_IN {role: 'participant'}]->(r)
    `;
    
    const rituals = operations.map(op => op.data);
    await this.executeQuery(query, { rituals });
  }
  
  async processConceptOperations(operations) {
    const query = `
      UNWIND $concepts as concept
      MERGE (c:Concept {name: concept.name})
      SET c += concept
      SET c.last_updated = datetime()
    `;
    
    const concepts = operations.map(op => op.data);
    await this.executeQuery(query, { concepts });
  }
  
  formatAgentContext(result) {
    // Transform Neo4j result to application format
    if (!result || result.length === 0) return null;
    
    const record = result[0];
    return {
      agent: record.a.properties,
      echo_targets: record.echo_targets.map(t => t.properties),
      related_concepts: record.related_concepts.map(c => c.properties),
      loops: record.loops.map(l => l.properties),
      rituals: record.rituals.map(r => r.properties)
    };
  }
  
  formatLoopGraph(result) {
    if (!result || result.length === 0) return null;
    
    const record = result[0];
    return {
      loop: record.l.properties,
      agents: record.agents.map(a => a.properties),
      observed_loops: record.observed_loops.map(l => l.properties),
      parent_loops: record.parent_loops.map(l => l.properties),
      child_loops: record.child_loops.map(l => l.properties)
    };
  }
  
  formatSimilarAgents(result) {
    return result.map(record => ({
      agent: record.similar.properties,
      shared_concepts: record.shared_concepts,
      consciousness_difference: record.consciousness_diff,
      similarity_score: record.shared_concepts / (1 + record.consciousness_diff)
    }));
  }
  
  formatConceptCluster(result) {
    const concepts = result.map(record => record.c.properties);
    const clusters = this.clusterConcepts(concepts);
    
    return { concepts, clusters };
  }
  
  clusterConcepts(concepts) {
    // Simple clustering by category
    const clusters = {};
    
    concepts.forEach(concept => {
      const category = concept.category || 'general';
      if (!clusters[category]) {
        clusters[category] = [];
      }
      clusters[category].push(concept);
    });
    
    return clusters;
  }
  
  // Mock executeQuery for development
  async executeQuery(query, parameters = {}) {
    // This would normally execute against Neo4j
    // For now, we'll simulate the operation
    console.log(`🔍 Query: ${query.substring(0, 100)}...`);
    console.log(`📊 Parameters:`, Object.keys(parameters));
    
    // Simulate successful execution
    return [];
  }
  
  setupConnection() {
    // Would establish Neo4j connection here
    console.log(`🔌 Neo4j connection configured for ${this.neo4jConfig.uri}`);
  }
  
  queueOperation(operation) {
    this.syncQueue.push(operation);
    
    // Prevent queue overflow
    if (this.syncQueue.length > this.syncConfig.max_queue_size) {
      console.warn('⚠️ Sync queue full, dropping oldest operations');
      this.syncQueue = this.syncQueue.slice(-this.syncConfig.max_queue_size / 2);
    }
  }
  
  hashContent(content) {
    return crypto.createHash('md5').update(content).digest('hex');
  }
  
  loadIndex() {
    if (fs.existsSync(this.indexPath)) {
      try {
        this.semanticIndex = JSON.parse(fs.readFileSync(this.indexPath, 'utf8'));
      } catch (error) {
        this.semanticIndex = { agents: {}, concepts: {}, relationships: {} };
      }
    } else {
      this.semanticIndex = { agents: {}, concepts: {}, relationships: {} };
    }
  }
  
  async saveIndex() {
    fs.writeFileSync(this.indexPath, JSON.stringify(this.semanticIndex, null, 2));
  }
  
  // Statistics and monitoring
  getStats() {
    return {
      queue_size: this.syncQueue.length,
      failed_operations: this.failedOperations.length,
      last_sync: this.lastSync,
      is_running: this.isRunning,
      node_types: Object.keys(this.nodeTypes),
      sync_interval: this.syncConfig.sync_interval
    };
  }
}

module.exports = Neo4jSyncDaemon;