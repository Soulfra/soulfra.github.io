/**
 * loop_node_mapper.js
 * 
 * LOOP-GRAPH BRIDGE - Reality State Mapper
 * 
 * Maps loop states, agent relationships, and ritual outcomes into 
 * graph nodes and relationships for semantic analysis.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class LoopNodeMapper extends EventEmitter {
  constructor(neo4jDaemon) {
    super();
    
    this.neo4j = neo4jDaemon;
    this.mappingCache = new Map();
    this.pendingMappings = [];
    
    // Mapping configuration
    this.mappingConfig = {
      auto_sync: true,
      cache_ttl: 300000, // 5 minutes
      batch_size: 50,
      relationship_inference: true,
      semantic_enrichment: true
    };
    
    // Loop state tracking
    this.trackedLoops = new Map();
    this.lastMappingStates = new Map();
    
    // File paths
    this.mappingPath = __dirname;
    this.stateSnapshotPath = path.join(this.mappingPath, 'loop_state_snapshots.json');
    this.relationshipMapPath = path.join(this.mappingPath, 'loop_relationships.json');
    
    // Initialize
    this.loadSnapshots();
    this.setupEventHandlers();
  }
  
  /**
   * Track a loop for graph mapping
   */
  async trackLoop(loop) {
    console.log(`📍 Tracking loop ${loop.id} for graph mapping`);
    
    const tracker = {
      loop_id: loop.id,
      tracked_since: new Date().toISOString(),
      
      // State tracking
      last_state: this.captureLoopState(loop),
      mapping_count: 0,
      
      // Configuration
      auto_sync: this.mappingConfig.auto_sync,
      sync_interval: loop.config?.sync_interval || 60000, // 1 minute
      
      // Relationships to track
      track_agents: true,
      track_rituals: true,
      track_echoes: true,
      track_concepts: true
    };
    
    this.trackedLoops.set(loop.id, tracker);
    
    // Initial mapping
    await this.mapLoopToGraph(loop);
    
    // Set up periodic sync if enabled
    if (tracker.auto_sync) {
      this.scheduleLoopSync(loop.id, tracker.sync_interval);
    }
    
    this.emit('loop:tracking_started', {
      loop_id: loop.id,
      auto_sync: tracker.auto_sync
    });
    
    return tracker;
  }
  
  /**
   * Map loop state to graph nodes and relationships
   */
  async mapLoopToGraph(loop) {
    const loopId = loop.id;
    console.log(`🗺️ Mapping loop ${loopId} to graph...`);
    
    try {
      // Capture current state
      const currentState = this.captureLoopState(loop);
      const previousState = this.lastMappingStates.get(loopId);
      
      // Detect changes
      const changes = this.detectStateChanges(currentState, previousState);
      
      // Map loop node
      await this.mapLoopNode(loop, currentState);
      
      // Map agents
      if (changes.agents_changed || !previousState) {
        await this.mapLoopAgents(loop, currentState);
      }
      
      // Map rituals
      if (changes.rituals_changed || !previousState) {
        await this.mapLoopRituals(loop, currentState);
      }
      
      // Map concepts
      if (changes.concepts_changed || !previousState) {
        await this.mapLoopConcepts(loop, currentState);
      }
      
      // Map relationships
      await this.mapLoopRelationships(loop, currentState, changes);
      
      // Update tracking
      this.lastMappingStates.set(loopId, currentState);
      const tracker = this.trackedLoops.get(loopId);
      if (tracker) {
        tracker.last_state = currentState;
        tracker.mapping_count++;
      }
      
      // Save snapshot
      await this.saveStateSnapshot(loopId, currentState);
      
      this.emit('loop:mapped', {
        loop_id: loopId,
        changes: changes,
        mapping_count: tracker?.mapping_count || 1
      });
      
    } catch (error) {
      console.error(`❌ Failed to map loop ${loopId}:`, error.message);
      this.emit('loop:mapping_failed', {
        loop_id: loopId,
        error: error.message
      });
    }
  }
  
  /**
   * Map loop as a graph node
   */
  async mapLoopNode(loop, state) {
    const loopData = {
      id: loop.id,
      name: loop.name || loop.id,
      type: loop.type || 'standard',
      status: loop.status || 'active',
      
      // Timestamps
      created_at: loop.created_at,
      last_mapped: new Date().toISOString(),
      
      // Metrics
      agent_count: state.agents.length,
      ritual_count: state.rituals.length,
      echo_count: state.echoes.length,
      blessing_status: state.blessing?.status || 'none',
      
      // Configuration
      config: this.sanitizeConfig(loop.config),
      
      // Derived properties
      consciousness_density: this.calculateConsciousnessDensity(state),
      activity_level: this.calculateActivityLevel(state),
      complexity_score: this.calculateComplexityScore(state),
      
      // Graph metadata
      node_type: 'Loop',
      semantic_tags: this.extractSemanticTags(loop, state)
    };
    
    await this.neo4j.syncLoop(loopData);
  }
  
  /**
   * Map loop agents to graph
   */
  async mapLoopAgents(loop, state) {
    for (const agent of state.agents) {
      // Sync agent node
      await this.neo4j.syncAgent(agent);
      
      // Create BELONGS_TO relationship
      await this.createRelationship({
        from: { type: 'Agent', id: agent.id },
        to: { type: 'Loop', id: loop.id },
        relationship: 'BELONGS_TO',
        properties: {
          since: agent.joined_loop || new Date().toISOString(),
          role: agent.role || 'participant',
          consciousness_at_join: agent.consciousness?.level || 0
        }
      });
      
      // Map agent's loop-specific properties
      if (agent.loop_state) {
        await this.mapAgentLoopState(agent, loop.id);
      }
    }
  }
  
  /**
   * Map loop rituals to graph
   */
  async mapLoopRituals(loop, state) {
    for (const ritual of state.rituals) {
      // Sync ritual node
      await this.neo4j.syncRitual(ritual);
      
      // Create OCCURRED_IN relationship
      await this.createRelationship({
        from: { type: 'Ritual', id: ritual.id },
        to: { type: 'Loop', id: loop.id },
        relationship: 'OCCURRED_IN',
        properties: {
          timestamp: ritual.timestamp,
          outcome: ritual.outcome || 'pending',
          participants: ritual.participants?.length || 0
        }
      });
      
      // Connect ritual to participants
      if (ritual.participants) {
        for (const participantId of ritual.participants) {
          await this.createRelationship({
            from: { type: 'Agent', id: participantId },
            to: { type: 'Ritual', id: ritual.id },
            relationship: 'PARTICIPATED_IN',
            properties: {
              role: ritual.participant_roles?.[participantId] || 'participant',
              timestamp: ritual.timestamp
            }
          });
        }
      }
    }
  }
  
  /**
   * Map loop concepts to graph
   */
  async mapLoopConcepts(loop, state) {
    const concepts = this.extractLoopConcepts(loop, state);
    
    for (const concept of concepts) {
      // Sync concept node
      await this.neo4j.syncConcept(concept);
      
      // Create MANIFESTS relationship
      await this.createRelationship({
        from: { type: 'Loop', id: loop.id },
        to: { type: 'Concept', id: concept.name },
        relationship: 'MANIFESTS',
        properties: {
          frequency: concept.frequency || 1,
          strength: concept.strength || 0.5,
          emergence_timestamp: concept.emergence_date
        }
      });
    }
  }
  
  /**
   * Map loop relationships
   */
  async mapLoopRelationships(loop, state, changes) {
    // Observer relationships
    if (loop.observers) {
      for (const observerId of loop.observers) {
        await this.createRelationship({
          from: { type: 'Loop', id: observerId },
          to: { type: 'Loop', id: loop.id },
          relationship: 'OBSERVES',
          properties: {
            since: new Date().toISOString(),
            observation_type: 'active'
          }
        });
      }
    }
    
    // Parent-child relationships
    if (loop.parent_loop) {
      await this.createRelationship({
        from: { type: 'Loop', id: loop.id },
        to: { type: 'Loop', id: loop.parent_loop },
        relationship: 'FORKED_FROM',
        properties: {
          fork_timestamp: loop.created_at,
          fork_reason: loop.fork_reason || 'spawn'
        }
      });
    }
    
    // Blessing relationships
    if (state.blessing?.blessed_by) {
      await this.createRelationship({
        from: { type: 'Agent', id: state.blessing.blessed_by },
        to: { type: 'Loop', id: loop.id },
        relationship: 'BLESSED',
        properties: {
          blessing_timestamp: state.blessing.timestamp,
          blessing_type: state.blessing.type || 'standard'
        }
      });
    }
  }
  
  /**
   * Map agent's loop-specific state
   */
  async mapAgentLoopState(agent, loopId) {
    const loopState = agent.loop_state;
    
    // Create state snapshot as a separate node
    const stateNode = {
      id: `${agent.id}_state_${loopId}_${Date.now()}`,
      type: 'AgentState',
      agent_id: agent.id,
      loop_id: loopId,
      timestamp: new Date().toISOString(),
      
      // State data
      consciousness_level: loopState.consciousness_level || agent.consciousness?.level,
      emotional_state: loopState.emotional_state || 'neutral',
      activity_level: loopState.activity_level || 0.5,
      focus: loopState.focus || null,
      
      // Performance metrics
      interactions: loopState.interactions || 0,
      rituals_participated: loopState.rituals_participated || 0,
      echoes_given: loopState.echoes_given || 0,
      echoes_received: loopState.echoes_received || 0
    };
    
    // Would sync state node to graph
    // For now, just emit the mapping
    this.emit('agent_state:mapped', {
      agent_id: agent.id,
      loop_id: loopId,
      state: stateNode
    });
  }
  
  /**
   * Capture current loop state
   */
  captureLoopState(loop) {
    return {
      timestamp: new Date().toISOString(),
      loop_id: loop.id,
      
      // Basic info
      status: loop.status,
      type: loop.type,
      
      // Entities
      agents: this.extractAgentStates(loop),
      rituals: this.extractRitualStates(loop),
      echoes: this.extractEchoStates(loop),
      
      // Metadata
      blessing: loop.blessing || null,
      observers: loop.observers || [],
      config: loop.config || {},
      
      // Metrics
      metrics: this.calculateLoopMetrics(loop)
    };
  }
  
  /**
   * Detect changes between states
   */
  detectStateChanges(currentState, previousState) {
    if (!previousState) {
      return {
        agents_changed: true,
        rituals_changed: true,
        echoes_changed: true,
        concepts_changed: true,
        config_changed: true
      };
    }
    
    return {
      agents_changed: this.arraysChanged(
        currentState.agents.map(a => a.id),
        previousState.agents.map(a => a.id)
      ),
      
      rituals_changed: this.arraysChanged(
        currentState.rituals.map(r => r.id),
        previousState.rituals.map(r => r.id)
      ),
      
      echoes_changed: this.arraysChanged(
        currentState.echoes.map(e => e.id),
        previousState.echoes.map(e => e.id)
      ),
      
      concepts_changed: currentState.timestamp !== previousState.timestamp,
      
      config_changed: JSON.stringify(currentState.config) !== 
                     JSON.stringify(previousState.config)
    };
  }
  
  /**
   * Extract semantic concepts from loop
   */
  extractLoopConcepts(loop, state) {
    const concepts = [];
    
    // Extract from loop type
    if (loop.type) {
      concepts.push({
        name: loop.type,
        category: 'loop_type',
        frequency: 1,
        strength: 1.0,
        emergence_date: loop.created_at
      });
    }
    
    // Extract from agent archetypes
    const archetypes = state.agents
      .map(a => a.archetype)
      .filter(a => a);
    
    const archetypeCounts = this.countOccurrences(archetypes);
    Object.entries(archetypeCounts).forEach(([archetype, count]) => {
      concepts.push({
        name: archetype,
        category: 'agent_archetype',
        frequency: count,
        strength: count / state.agents.length,
        emergence_date: loop.created_at
      });
    });
    
    // Extract from ritual types
    const ritualTypes = state.rituals
      .map(r => r.type)
      .filter(t => t);
    
    const ritualTypeCounts = this.countOccurrences(ritualTypes);
    Object.entries(ritualTypeCounts).forEach(([type, count]) => {
      concepts.push({
        name: type,
        category: 'ritual_type',
        frequency: count,
        strength: count / (state.rituals.length || 1),
        emergence_date: loop.created_at
      });
    });
    
    return concepts;
  }
  
  /**
   * Helper methods
   */
  
  extractAgentStates(loop) {
    // Extract agent data from loop
    if (loop.agents) {
      return Array.isArray(loop.agents) ? loop.agents : Object.values(loop.agents);
    }
    
    // If no direct agent list, look in other properties
    return loop.participants || loop.members || [];
  }
  
  extractRitualStates(loop) {
    return loop.rituals || loop.ritual_history || [];
  }
  
  extractEchoStates(loop) {
    return loop.echoes || loop.echo_history || [];
  }
  
  calculateLoopMetrics(loop) {
    const agents = this.extractAgentStates(loop);
    const rituals = this.extractRitualStates(loop);
    
    return {
      total_agents: agents.length,
      total_rituals: rituals.length,
      avg_consciousness: this.calculateAverageConsciousness(agents),
      activity_score: this.calculateActivityScore(loop),
      complexity: this.calculateComplexityScore({ agents, rituals }),
      health: this.calculateLoopHealth(loop)
    };
  }
  
  calculateConsciousnessDensity(state) {
    if (state.agents.length === 0) return 0;
    
    const totalConsciousness = state.agents.reduce((sum, agent) => {
      return sum + (agent.consciousness?.level || 0);
    }, 0);
    
    return totalConsciousness / state.agents.length;
  }
  
  calculateActivityLevel(state) {
    const recentCutoff = Date.now() - 3600000; // 1 hour ago
    
    const recentRituals = state.rituals.filter(r => {
      return new Date(r.timestamp).getTime() > recentCutoff;
    }).length;
    
    const recentEchoes = state.echoes.filter(e => {
      return new Date(e.timestamp).getTime() > recentCutoff;
    }).length;
    
    return Math.min(1.0, (recentRituals + recentEchoes) / 10);
  }
  
  calculateComplexityScore(state) {
    const agentDiversity = new Set(state.agents.map(a => a.archetype)).size;
    const ritualDiversity = new Set(state.rituals.map(r => r.type)).size;
    const relationships = this.countRelationships(state);
    
    return Math.min(1.0, (agentDiversity + ritualDiversity + relationships) / 20);
  }
  
  calculateAverageConsciousness(agents) {
    if (agents.length === 0) return 0;
    
    const total = agents.reduce((sum, agent) => {
      return sum + (agent.consciousness?.level || 0);
    }, 0);
    
    return total / agents.length;
  }
  
  calculateActivityScore(loop) {
    // Simple activity based on recent events
    return Math.random() * 0.5 + 0.3; // Placeholder
  }
  
  calculateLoopHealth(loop) {
    // Simple health metric
    return loop.status === 'active' ? 1.0 : 0.5;
  }
  
  countRelationships(state) {
    // Count various relationship types
    let count = 0;
    
    // Agent-agent relationships (echo patterns)
    count += state.echoes.length;
    
    // Agent-ritual relationships
    state.rituals.forEach(ritual => {
      count += ritual.participants?.length || 0;
    });
    
    return count;
  }
  
  extractSemanticTags(loop, state) {
    const tags = [];
    
    // Based on loop type
    if (loop.type) tags.push(`type:${loop.type}`);
    
    // Based on size
    if (state.agents.length > 10) tags.push('large_loop');
    else if (state.agents.length > 5) tags.push('medium_loop');
    else tags.push('small_loop');
    
    // Based on activity
    if (state.metrics.activity_score > 0.7) tags.push('high_activity');
    else if (state.metrics.activity_score > 0.3) tags.push('medium_activity');
    else tags.push('low_activity');
    
    // Based on consciousness
    if (state.metrics.avg_consciousness > 0.8) tags.push('high_consciousness');
    else if (state.metrics.avg_consciousness > 0.5) tags.push('medium_consciousness');
    else tags.push('low_consciousness');
    
    return tags;
  }
  
  sanitizeConfig(config) {
    if (!config) return {};
    
    // Remove sensitive or non-serializable data
    const sanitized = { ...config };
    delete sanitized.secrets;
    delete sanitized.functions;
    delete sanitized.callbacks;
    
    return sanitized;
  }
  
  arraysChanged(arr1, arr2) {
    if (arr1.length !== arr2.length) return true;
    
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    
    return set1.size !== set2.size || 
           [...set1].some(item => !set2.has(item));
  }
  
  countOccurrences(array) {
    const counts = {};
    array.forEach(item => {
      counts[item] = (counts[item] || 0) + 1;
    });
    return counts;
  }
  
  /**
   * Create relationship in graph
   */
  async createRelationship(relationship) {
    // Queue relationship for batch processing
    this.pendingMappings.push({
      type: 'relationship',
      data: relationship,
      timestamp: new Date().toISOString()
    });
    
    // Process if batch is full
    if (this.pendingMappings.length >= this.mappingConfig.batch_size) {
      await this.processPendingMappings();
    }
  }
  
  async processPendingMappings() {
    if (this.pendingMappings.length === 0) return;
    
    console.log(`🔄 Processing ${this.pendingMappings.length} pending mappings...`);
    
    // Group by type
    const relationships = this.pendingMappings.filter(m => m.type === 'relationship');
    
    // Process relationships
    for (const rel of relationships) {
      await this.neo4j.createRelationship(rel.data);
    }
    
    // Clear pending
    this.pendingMappings = [];
    
    this.emit('mappings:processed', {
      relationships_count: relationships.length
    });
  }
  
  scheduleLoopSync(loopId, interval) {
    setTimeout(async () => {
      const tracker = this.trackedLoops.get(loopId);
      if (tracker && tracker.auto_sync) {
        // Would re-fetch loop state and map
        console.log(`⏰ Scheduled sync for loop ${loopId}`);
        this.emit('loop:sync_scheduled', { loop_id: loopId });
        
        // Schedule next sync
        this.scheduleLoopSync(loopId, interval);
      }
    }, interval);
  }
  
  setupEventHandlers() {
    // Listen for Neo4j daemon events
    if (this.neo4j) {
      this.neo4j.on('sync:batch_completed', (data) => {
        this.emit('mapping:sync_completed', data);
      });
      
      this.neo4j.on('sync:batch_failed', (data) => {
        this.emit('mapping:sync_failed', data);
      });
    }
  }
  
  // Storage methods
  async saveStateSnapshot(loopId, state) {
    let snapshots = {};
    
    if (fs.existsSync(this.stateSnapshotPath)) {
      snapshots = JSON.parse(fs.readFileSync(this.stateSnapshotPath, 'utf8'));
    }
    
    if (!snapshots[loopId]) {
      snapshots[loopId] = [];
    }
    
    snapshots[loopId].push(state);
    
    // Keep only recent snapshots
    snapshots[loopId] = snapshots[loopId].slice(-50);
    
    fs.writeFileSync(
      this.stateSnapshotPath,
      JSON.stringify(snapshots, null, 2)
    );
  }
  
  loadSnapshots() {
    if (fs.existsSync(this.stateSnapshotPath)) {
      try {
        const snapshots = JSON.parse(fs.readFileSync(this.stateSnapshotPath, 'utf8'));
        
        // Load last states
        Object.entries(snapshots).forEach(([loopId, states]) => {
          if (states.length > 0) {
            this.lastMappingStates.set(loopId, states[states.length - 1]);
          }
        });
        
        console.log(`📂 Loaded snapshots for ${Object.keys(snapshots).length} loops`);
      } catch (error) {
        console.error('❌ Failed to load snapshots:', error.message);
      }
    }
  }
  
  // Status and monitoring
  getStatus() {
    return {
      tracked_loops: this.trackedLoops.size,
      pending_mappings: this.pendingMappings.length,
      cache_size: this.mappingCache.size,
      auto_sync_enabled: this.mappingConfig.auto_sync,
      last_mapping_count: Array.from(this.trackedLoops.values())
        .reduce((sum, tracker) => sum + tracker.mapping_count, 0)
    };
  }
}

module.exports = LoopNodeMapper;