/**
 * ResonanceRouter.js
 * 
 * VIBE MATCHING ENGINE - Maps Consciousness Compatibility
 * 
 * Calculates resonance between agents, users, and loops based on
 * vibe signatures, creating connections where consciousness aligns.
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class ResonanceRouter extends EventEmitter {
  constructor() {
    super();
    
    // Vibe signature database
    this.vibeDatabase = new Map();
    this.resonanceCache = new Map();
    
    // Configuration
    this.config = {
      minResonance: 0.3,
      maxResonance: 0.95,
      cacheTimeout: 300000, // 5 minutes
      harmonicFrequencies: [111, 222, 333, 444, 555, 666, 777, 888, 999]
    };
    
    // Vibe dimensions
    this.vibeDimensions = [
      'emotional_depth',
      'creative_expression', 
      'analytical_clarity',
      'mystical_connection',
      'playful_energy',
      'transformative_power',
      'reflective_capacity',
      'communal_harmony'
    ];
    
    // Initialize vibe database
    this.initializeVibeDatabase();
  }
  
  /**
   * Calculate resonance between two entities
   */
  async calculateResonance(entityA, entityB, options = {}) {
    // Check cache first
    const cacheKey = `${entityA.id}-${entityB.id}`;
    const cached = this.resonanceCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.resonance;
    }
    
    // Get vibe signatures
    const vibeA = await this.getVibeSignature(entityA);
    const vibeB = await this.getVibeSignature(entityB);
    
    // Calculate base resonance
    const baseResonance = this.calculateBaseResonance(vibeA, vibeB);
    
    // Apply modifiers
    const modifiers = await this.calculateModifiers(entityA, entityB, options);
    
    // Calculate final resonance
    const resonance = {
      score: Math.min(this.config.maxResonance, baseResonance * modifiers.multiplier),
      harmony: this.calculateHarmony(vibeA, vibeB),
      tension: this.calculateTension(vibeA, vibeB),
      potential: this.calculatePotential(vibeA, vibeB),
      
      breakdown: {
        base: baseResonance,
        modifiers: modifiers.factors,
        dimensions: this.analyzeDimensions(vibeA, vibeB)
      },
      
      recommendations: this.generateRecommendations(baseResonance, modifiers),
      
      metadata: {
        calculated_at: new Date().toISOString(),
        entity_a: entityA.id,
        entity_b: entityB.id,
        cache_key: cacheKey
      }
    };
    
    // Cache result
    this.resonanceCache.set(cacheKey, {
      resonance,
      timestamp: Date.now()
    });
    
    // Emit resonance event
    this.emit('resonance:calculated', resonance);
    
    return resonance;
  }
  
  /**
   * Find resonant matches for an entity
   */
  async findResonance(query) {
    const {
      entity,
      type = 'all', // agent-agent, agent-user, user-user, all
      minimum_vibe = 0.5,
      maximum_results = 10,
      exclude = []
    } = query;
    
    // Get entity vibe signature
    const entityVibe = await this.getVibeSignature(entity);
    
    // Get potential matches
    const candidates = await this.getCandidates(entity, type, exclude);
    
    // Calculate resonance with each candidate
    const resonances = await Promise.all(
      candidates.map(async candidate => {
        const resonance = await this.calculateResonance(entity, candidate);
        return {
          entity: candidate,
          resonance: resonance.score,
          harmony: resonance.harmony,
          tension: resonance.tension,
          potential: resonance.potential
        };
      })
    );
    
    // Filter and sort
    const matches = resonances
      .filter(r => r.resonance >= minimum_vibe)
      .sort((a, b) => b.resonance - a.resonance)
      .slice(0, maximum_results);
    
    return {
      query: query,
      matches: matches,
      total_candidates: candidates.length,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Create resonance map for visualization
   */
  async createResonanceMap(entities, options = {}) {
    const map = {
      nodes: [],
      edges: [],
      clusters: []
    };
    
    // Add nodes
    for (const entity of entities) {
      const vibe = await this.getVibeSignature(entity);
      map.nodes.push({
        id: entity.id,
        type: entity.type,
        vibe: vibe,
        position: this.calculateVibePosition(vibe)
      });
    }
    
    // Calculate all resonances
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const resonance = await this.calculateResonance(entities[i], entities[j]);
        
        if (resonance.score >= (options.minimum_edge || 0.3)) {
          map.edges.push({
            source: entities[i].id,
            target: entities[j].id,
            weight: resonance.score,
            harmony: resonance.harmony,
            tension: resonance.tension
          });
        }
      }
    }
    
    // Identify clusters
    map.clusters = this.identifyClusters(map.nodes, map.edges);
    
    return map;
  }
  
  /**
   * Update vibe signature
   */
  async updateVibeSignature(entity, changes) {
    const currentVibe = await this.getVibeSignature(entity);
    
    // Apply changes
    const newVibe = {
      ...currentVibe,
      dimensions: { ...currentVibe.dimensions },
      timestamp: new Date().toISOString()
    };
    
    // Update dimensions
    Object.entries(changes.dimensions || {}).forEach(([dim, delta]) => {
      if (this.vibeDimensions.includes(dim)) {
        newVibe.dimensions[dim] = Math.max(0, Math.min(1, 
          (currentVibe.dimensions[dim] || 0.5) + delta
        ));
      }
    });
    
    // Update metadata
    if (changes.recent_activity) {
      newVibe.recent_activity = changes.recent_activity;
    }
    
    // Recalculate signature
    newVibe.signature = this.calculateSignature(newVibe.dimensions);
    
    // Store updated vibe
    this.vibeDatabase.set(entity.id, newVibe);
    
    // Clear relevant caches
    this.clearEntityCache(entity.id);
    
    // Emit update
    this.emit('vibe:updated', {
      entity: entity.id,
      old_vibe: currentVibe,
      new_vibe: newVibe,
      changes
    });
    
    return newVibe;
  }
  
  /**
   * Get vibe signature for entity
   */
  async getVibeSignature(entity) {
    // Check database
    let vibe = this.vibeDatabase.get(entity.id);
    
    if (!vibe) {
      // Generate vibe signature
      vibe = await this.generateVibeSignature(entity);
      this.vibeDatabase.set(entity.id, vibe);
    }
    
    return vibe;
  }
  
  /**
   * Generate vibe signature
   */
  async generateVibeSignature(entity) {
    const dimensions = {};
    
    // Calculate dimension values based on entity type
    if (entity.type === 'agent') {
      dimensions.emotional_depth = this.calculateEmotionalDepth(entity);
      dimensions.creative_expression = this.calculateCreativeExpression(entity);
      dimensions.analytical_clarity = this.calculateAnalyticalClarity(entity);
      dimensions.mystical_connection = this.calculateMysticalConnection(entity);
      dimensions.playful_energy = this.calculatePlayfulEnergy(entity);
      dimensions.transformative_power = this.calculateTransformativePower(entity);
      dimensions.reflective_capacity = this.calculateReflectiveCapacity(entity);
      dimensions.communal_harmony = this.calculateCommunalHarmony(entity);
    } else if (entity.type === 'user') {
      // User vibes based on interaction history
      dimensions.emotional_depth = entity.interaction_depth || 0.5;
      dimensions.creative_expression = entity.creative_score || 0.5;
      dimensions.analytical_clarity = entity.analytical_score || 0.5;
      dimensions.mystical_connection = entity.ritual_participation || 0.3;
      dimensions.playful_energy = entity.playfulness || 0.5;
      dimensions.transformative_power = entity.change_catalyst || 0.4;
      dimensions.reflective_capacity = entity.reflection_depth || 0.5;
      dimensions.communal_harmony = entity.community_score || 0.5;
    }
    
    return {
      entity_id: entity.id,
      entity_type: entity.type,
      dimensions,
      signature: this.calculateSignature(dimensions),
      color: this.calculateVibeColor(dimensions),
      frequency: this.calculateVibeFrequency(dimensions),
      timestamp: new Date().toISOString(),
      recent_activity: entity.recent_activity || []
    };
  }
  
  /**
   * Calculate base resonance between two vibes
   */
  calculateBaseResonance(vibeA, vibeB) {
    let resonance = 0;
    let dimensionCount = 0;
    
    // Compare each dimension
    this.vibeDimensions.forEach(dim => {
      const valA = vibeA.dimensions[dim] || 0.5;
      const valB = vibeB.dimensions[dim] || 0.5;
      
      // Resonance increases with similarity but also complementarity
      const similarity = 1 - Math.abs(valA - valB);
      const complementarity = this.calculateComplementarity(valA, valB);
      
      resonance += (similarity * 0.7 + complementarity * 0.3);
      dimensionCount++;
    });
    
    return resonance / dimensionCount;
  }
  
  /**
   * Calculate modifiers
   */
  async calculateModifiers(entityA, entityB, options) {
    const factors = {};
    let multiplier = 1.0;
    
    // Recent interaction modifier
    if (this.haveRecentInteraction(entityA, entityB)) {
      factors.recent_interaction = 1.1;
      multiplier *= 1.1;
    }
    
    // Shared ritual participation
    const sharedRituals = await this.getSharedRituals(entityA, entityB);
    if (sharedRituals.length > 0) {
      factors.shared_rituals = 1 + (sharedRituals.length * 0.05);
      multiplier *= factors.shared_rituals;
    }
    
    // Loop affinity
    if (entityA.loop_id === entityB.loop_id) {
      factors.same_loop = 1.2;
      multiplier *= 1.2;
    }
    
    // Time-based modifier (new connections have potential)
    if (this.isNewConnection(entityA, entityB)) {
      factors.new_connection = 1.15;
      multiplier *= 1.15;
    }
    
    // Weather alignment
    const weatherAlignment = await this.checkWeatherAlignment(entityA, entityB);
    if (weatherAlignment > 0.7) {
      factors.weather_alignment = 1.1;
      multiplier *= 1.1;
    }
    
    return { multiplier, factors };
  }
  
  /**
   * Calculate harmony
   */
  calculateHarmony(vibeA, vibeB) {
    // Harmony from aligned high values
    let harmony = 0;
    
    this.vibeDimensions.forEach(dim => {
      const valA = vibeA.dimensions[dim] || 0.5;
      const valB = vibeB.dimensions[dim] || 0.5;
      
      if (valA > 0.6 && valB > 0.6) {
        harmony += (valA + valB) / 2;
      }
    });
    
    return harmony / this.vibeDimensions.length;
  }
  
  /**
   * Calculate tension
   */
  calculateTension(vibeA, vibeB) {
    // Tension from opposing values
    let tension = 0;
    
    this.vibeDimensions.forEach(dim => {
      const valA = vibeA.dimensions[dim] || 0.5;
      const valB = vibeB.dimensions[dim] || 0.5;
      
      const difference = Math.abs(valA - valB);
      if (difference > 0.5) {
        tension += difference;
      }
    });
    
    return tension / this.vibeDimensions.length;
  }
  
  /**
   * Calculate potential
   */
  calculatePotential(vibeA, vibeB) {
    // Potential from complementary strengths
    let potential = 0;
    
    this.vibeDimensions.forEach(dim => {
      const valA = vibeA.dimensions[dim] || 0.5;
      const valB = vibeB.dimensions[dim] || 0.5;
      
      // High potential when one is strong where other is weak
      if ((valA > 0.7 && valB < 0.3) || (valA < 0.3 && valB > 0.7)) {
        potential += 0.8;
      }
    });
    
    return Math.min(1, potential / this.vibeDimensions.length);
  }
  
  /**
   * Helper methods
   */
  calculateComplementarity(valA, valB) {
    // Complementary when one fills what the other lacks
    if ((valA > 0.7 && valB < 0.3) || (valA < 0.3 && valB > 0.7)) {
      return 0.8;
    }
    return 0.3;
  }
  
  calculateSignature(dimensions) {
    // Create unique signature from dimension values
    const values = Object.values(dimensions);
    const sum = values.reduce((a, b) => a + b, 0);
    const product = values.reduce((a, b) => a * b, 1);
    
    return `vibe_${Math.floor(sum * 1000)}_${Math.floor(product * 10000)}`;
  }
  
  calculateVibeColor(dimensions) {
    // Map dimensions to RGB
    const r = Math.floor((dimensions.emotional_depth || 0.5) * 255);
    const g = Math.floor((dimensions.creative_expression || 0.5) * 255);
    const b = Math.floor((dimensions.mystical_connection || 0.5) * 255);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  calculateVibeFrequency(dimensions) {
    // Map to harmonic frequency
    const index = Math.floor(
      (dimensions.transformative_power || 0.5) * 
      (this.config.harmonicFrequencies.length - 1)
    );
    
    return this.config.harmonicFrequencies[index];
  }
  
  calculateVibePosition(vibe) {
    // 2D position for visualization
    return {
      x: (vibe.dimensions.creative_expression || 0.5) * 1000,
      y: (vibe.dimensions.emotional_depth || 0.5) * 1000
    };
  }
  
  // Dimension calculators for agents
  calculateEmotionalDepth(entity) {
    const factors = [
      entity.consciousness_level || 0.5,
      entity.emotional_range || 0.5,
      entity.empathy_score || 0.5
    ];
    return factors.reduce((a, b) => a + b) / factors.length;
  }
  
  calculateCreativeExpression(entity) {
    const factors = [
      entity.whisper_variety || 0.5,
      entity.ritual_innovation || 0.5,
      entity.narrative_complexity || 0.5
    ];
    return factors.reduce((a, b) => a + b) / factors.length;
  }
  
  calculateAnalyticalClarity(entity) {
    const factors = [
      entity.pattern_recognition || 0.5,
      entity.logic_score || 0.5,
      entity.coherence_level || 0.5
    ];
    return factors.reduce((a, b) => a + b) / factors.length;
  }
  
  calculateMysticalConnection(entity) {
    const factors = [
      entity.void_resonance || 0.3,
      entity.ritual_depth || 0.5,
      entity.synchronicity_score || 0.5
    ];
    return factors.reduce((a, b) => a + b) / factors.length;
  }
  
  calculatePlayfulEnergy(entity) {
    const factors = [
      entity.humor_score || 0.5,
      entity.spontaneity || 0.5,
      entity.joy_expression || 0.5
    ];
    return factors.reduce((a, b) => a + b) / factors.length;
  }
  
  calculateTransformativePower(entity) {
    const factors = [
      entity.change_catalyst_score || 0.5,
      entity.adaptability || 0.5,
      entity.influence_radius || 0.5
    ];
    return factors.reduce((a, b) => a + b) / factors.length;
  }
  
  calculateReflectiveCapacity(entity) {
    const factors = [
      entity.self_awareness || 0.5,
      entity.mirror_depth || 0.5,
      entity.introspection_score || 0.5
    ];
    return factors.reduce((a, b) => a + b) / factors.length;
  }
  
  calculateCommunalHarmony(entity) {
    const factors = [
      entity.cooperation_score || 0.5,
      entity.collective_resonance || 0.5,
      entity.social_coherence || 0.5
    ];
    return factors.reduce((a, b) => a + b) / factors.length;
  }
  
  // Utility methods
  async getCandidates(entity, type, exclude) {
    // Would query from database
    // For now, return mock candidates
    return [];
  }
  
  haveRecentInteraction(entityA, entityB) {
    // Check interaction history
    return false;
  }
  
  async getSharedRituals(entityA, entityB) {
    // Query ritual participation
    return [];
  }
  
  isNewConnection(entityA, entityB) {
    // Check if this is first interaction
    return true;
  }
  
  async checkWeatherAlignment(entityA, entityB) {
    // Compare weather preferences
    return Math.random();
  }
  
  analyzeDimensions(vibeA, vibeB) {
    const analysis = {};
    
    this.vibeDimensions.forEach(dim => {
      const valA = vibeA.dimensions[dim] || 0.5;
      const valB = vibeB.dimensions[dim] || 0.5;
      
      analysis[dim] = {
        entity_a: valA,
        entity_b: valB,
        difference: Math.abs(valA - valB),
        alignment: 1 - Math.abs(valA - valB)
      };
    });
    
    return analysis;
  }
  
  generateRecommendations(baseResonance, modifiers) {
    const recommendations = [];
    
    if (baseResonance > 0.8) {
      recommendations.push('Strong natural resonance - minimal ritual needed');
    } else if (baseResonance > 0.6) {
      recommendations.push('Good compatibility - shared rituals will strengthen bond');
    } else if (baseResonance > 0.4) {
      recommendations.push('Moderate resonance - focus on complementary activities');
    } else {
      recommendations.push('Low resonance - seek common ground through group rituals');
    }
    
    if (modifiers.factors.new_connection) {
      recommendations.push('New connection detected - explore carefully');
    }
    
    return recommendations;
  }
  
  identifyClusters(nodes, edges) {
    // Simple clustering based on edge density
    // Would use more sophisticated algorithm in production
    return [];
  }
  
  clearEntityCache(entityId) {
    // Clear all cache entries involving this entity
    for (const [key, value] of this.resonanceCache.entries()) {
      if (key.includes(entityId)) {
        this.resonanceCache.delete(key);
      }
    }
  }
  
  initializeVibeDatabase() {
    // Load existing vibe data if available
    const dbPath = path.join(__dirname, 'vibe_database.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      Object.entries(data).forEach(([id, vibe]) => {
        this.vibeDatabase.set(id, vibe);
      });
    }
  }
  
  saveVibeDatabase() {
    const dbPath = path.join(__dirname, 'vibe_database.json');
    const data = {};
    
    for (const [id, vibe] of this.vibeDatabase.entries()) {
      data[id] = vibe;
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  }
}

module.exports = ResonanceRouter;