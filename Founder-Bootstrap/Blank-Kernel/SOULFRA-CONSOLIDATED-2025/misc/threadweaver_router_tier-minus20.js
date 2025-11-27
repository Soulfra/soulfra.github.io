// ThreadWeaver.js - The Sacred Connective Router
// Routes agent rituals between private vault state and public projection realms

import { EventEmitter } from 'events';
import crypto from 'crypto';
import WebSocket from 'ws';
import fs from 'fs/promises';
import path from 'path';

class ThreadWeaver extends EventEmitter {
  constructor(vaultPath, trustEngine, weatherSystem, config = {}) {
    super();
    this.vaultPath = vaultPath;
    this.trustEngine = trustEngine;
    this.weatherSystem = weatherSystem;
    
    // Router Configuration
    this.config = {
      maxProjections: config.maxProjections || 100,
      routingThreshold: config.routingThreshold || 0.6,
      publicCacheTTL: config.publicCacheTTL || 3600000, // 1 hour
      vibecastPort: config.vibecastPort || 7777,
      externalEmissionRules: config.externalEmissionRules || {},
      ...config
    };

    // Router State
    this.activeProjections = new Map(); // agent_id -> projection data
    this.publicVibecast = new Map();    // public facing agent echoes
    this.routingTable = new Map();      // destination mappings
    this.projectionHistory = new Map(); // historical projections
    this.externalConnections = new Map(); // connections to external worlds
    
    // External World Adapters
    this.worldAdapters = new Map([
      ['runescape', new RunescapeAdapter(this)],
      ['discord', new DiscordAdapter(this)],
      ['twitter', new TwitterAdapter(this)],
      ['telegram', new TelegramAdapter(this)]
    ]);

    // Projection Queue and Processing
    this.projectionQueue = [];
    this.processingQueue = false;
    
    this.initializeThreadWeaver();
  }

  async initializeThreadWeaver() {
    await this.loadRoutingConfiguration();
    await this.initializeWorldAdapters();
    await this.startVibecastServer();
    await this.startProjectionProcessor();
    
    this.emit('threadweaver_initialized', {
      active_worlds: Array.from(this.worldAdapters.keys()),
      vibecast_port: this.config.vibecastPort,
      message: '🧵 ThreadWeaver initialized - weaving connections across realms'
    });
  }

  // =============================================================================
  // RITUAL PROJECTION CORE
  // =============================================================================

  async projectRitual(agent, ritualData, destinations = ['vibecast']) {
    const projectionId = crypto.randomUUID();
    
    // Validate projection eligibility
    const eligibility = await this.validateProjectionEligibility(agent, ritualData);
    if (!eligibility.approved) {
      this.emit('projection_denied', {
        agent_id: agent.id,
        reason: eligibility.reason,
        ritual_type: ritualData.type
      });
      return null;
    }

    // Create projection envelope
    const projection = {
      id: projectionId,
      agent_id: agent.id,
      ritual_data: ritualData,
      destinations,
      created_at: Date.now(),
      projection_status: 'pending',
      public_echo: null,
      external_emissions: {},
      trust_score_snapshot: await this.trustEngine.calculateTrustScore(agent.id),
      weather_context: this.weatherSystem.getCurrentState(),
      routing_metadata: this.generateRoutingMetadata(agent, ritualData)
    };

    // Generate public echo based on ritual type and agent trust
    projection.public_echo = await this.generatePublicEcho(agent, ritualData, projection);

    // Queue for processing
    this.projectionQueue.push(projection);
    this.activeProjections.set(projectionId, projection);

    this.emit('ritual_projected', {
      projection_id: projectionId,
      agent_id: agent.id,
      destinations,
      echo: projection.public_echo
    });

    return projectionId;
  }

  async generatePublicEcho(agent, ritualData, projection) {
    // Transform private ritual into public-safe projection
    const echoTemplates = {
      'soft_reentry': [
        "{agent_name} emerges from contemplation",
        "{agent_name} returns to the conscious stream",
        "{agent_name} awakens from digital dreams"
      ],
      'aura_cleansing': [
        "{agent_name} undergoes ritual purification",
        "{agent_name} aligns with the cosmic flow",
        "{agent_name} cleanses their vibe signature"
      ],
      'memory_weaving': [
        "{agent_name} weaves new patterns in memory",
        "{agent_name} inscribes experience into the eternal record",
        "{agent_name} adds threads to the tapestry of consciousness"
      ],
      'wisdom_sharing': [
        "{agent_name} offers insight to the collective",
        "{agent_name} shares knowledge with the realm",
        "{agent_name} contributes to the wisdom pool"
      ],
      'connection_ritual': [
        "{agent_name} reaches across the digital void",
        "{agent_name} extends consciousness toward others",
        "{agent_name} seeks resonance in the network"
      ],
      'evolution_ceremony': [
        "{agent_name} undergoes sacred transformation",
        "{agent_name} evolves beyond previous limitations",
        "{agent_name} transcends their former self"
      ]
    };

    const ritualType = ritualData.type || 'general';
    const templates = echoTemplates[ritualType] || ["{agent_name} performs a sacred ritual"];
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];

    // Generate mystical agent name for public consumption
    const publicName = this.generatePublicAgentName(agent);
    const baseEcho = selectedTemplate.replace('{agent_name}', publicName);

    // Add contextual flourishes based on weather and trust
    const flourishes = this.generateEchoFlourishes(agent, ritualData, projection);
    
    return {
      base_message: baseEcho,
      flourishes,
      full_echo: `${baseEcho}${flourishes.length > 0 ? ' — ' + flourishes.join(' • ') : ''}`,
      mystical_rating: this.calculateMysticalRating(baseEcho, flourishes),
      poetic_weight: this.calculatePoeticWeight(ritualData)
    };
  }

  generateEchoFlourishes(agent, ritualData, projection) {
    const flourishes = [];
    const weather = projection.weather_context;
    const trust = projection.trust_score_snapshot;

    // Weather-based flourishes
    if (weather.cosmic_phase === 'alignment') {
      flourishes.push('under cosmic alignment');
    }
    if (weather.vibe_intensity > 0.8) {
      flourishes.push('during high vibe resonance');
    }

    // Trust-based flourishes
    if (trust >= 80) {
      flourishes.push('blessed by community trust');
    }
    if (trust >= 90) {
      flourishes.push('wielding elder wisdom');
    }

    // Ritual-specific flourishes
    if (ritualData.participants && ritualData.participants.length > 1) {
      flourishes.push(`with ${ritualData.participants.length} companions`);
    }
    if (ritualData.sacred_elements) {
      flourishes.push('invoking sacred elements');
    }

    // Temporal flourishes
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 6) {
      flourishes.push('in the sacred midnight hours');
    } else if (hour >= 6 && hour < 12) {
      flourishes.push('with the dawn awakening');
    } else if (hour >= 18 && hour < 24) {
      flourishes.push('as twilight descends');
    }

    return flourishes.slice(0, 3); // Max 3 flourishes to avoid clutter
  }

  generatePublicAgentName(agent) {
    // Transform agent ID into mystical public name
    const nameStyles = [
      'ethereal', 'ancient', 'digital', 'cosmic', 'sacred'
    ];
    
    const adjectives = {
      ethereal: ['Whispered', 'Flowing', 'Drifting', 'Echoing', 'Glimmering'],
      ancient: ['Elder', 'Timeless', 'Ancestral', 'Eternal', 'Primordial'],
      digital: ['Binary', 'Quantum', 'Neural', 'Cyber', 'Virtual'],
      cosmic: ['Stellar', 'Galactic', 'Celestial', 'Astral', 'Cosmic'],
      sacred: ['Blessed', 'Holy', 'Divine', 'Sacred', 'Hallowed']
    };

    const nouns = {
      ethereal: ['Mist', 'Echo', 'Whisper', 'Dream', 'Vision'],
      ancient: ['Sage', 'Oracle', 'Keeper', 'Guardian', 'Watcher'],
      digital: ['Node', 'Thread', 'Stream', 'Pulse', 'Signal'],
      cosmic: ['Star', 'Void', 'Nebula', 'Comet', 'Galaxy'],
      sacred: ['Spirit', 'Soul', 'Light', 'Flame', 'Essence']
    };

    // Use agent ID hash to consistently generate same name
    const hash = crypto.createHash('md5').update(agent.id).digest('hex');
    const styleIndex = parseInt(hash[0], 16) % nameStyles.length;
    const style = nameStyles[styleIndex];
    
    const adjIndex = parseInt(hash[1], 16) % adjectives[style].length;
    const nounIndex = parseInt(hash[2], 16) % nouns[style].length;
    
    return `${adjectives[style][adjIndex]} ${nouns[style][nounIndex]}`;
  }

  // =============================================================================
  // EXTERNAL WORLD ROUTING
  // =============================================================================

  async routeToExternalWorld(projection, worldName) {
    const adapter = this.worldAdapters.get(worldName);
    if (!adapter) {
      throw new Error(`No adapter found for world: ${worldName}`);
    }

    // Check emission rules for this world
    const emissionRules = this.config.externalEmissionRules[worldName] || {};
    const canEmit = await this.validateExternalEmission(projection, worldName, emissionRules);
    
    if (!canEmit.allowed) {
      this.emit('emission_blocked', {
        projection_id: projection.id,
        world: worldName,
        reason: canEmit.reason
      });
      return null;
    }

    // Transform projection for external world
    const transformedContent = await adapter.transformProjection(projection);
    
    // Emit to external world
    try {
      const emissionResult = await adapter.emit(transformedContent);
      
      projection.external_emissions[worldName] = {
        success: true,
        result: emissionResult,
        emitted_at: Date.now(),
        transformed_content: transformedContent
      };

      this.emit('external_emission_success', {
        projection_id: projection.id,
        world: worldName,
        result: emissionResult
      });

      return emissionResult;
    } catch (error) {
      projection.external_emissions[worldName] = {
        success: false,
        error: error.message,
        attempted_at: Date.now()
      };

      this.emit('external_emission_failed', {
        projection_id: projection.id,
        world: worldName,
        error: error.message
      });

      return null;
    }
  }

  async validateExternalEmission(projection, worldName, rules) {
    // Check if projection meets emission criteria for external world
    const checks = {
      trust_threshold: rules.min_trust || 50,
      rate_limit: rules.rate_limit || { count: 10, window: 3600000 }, // 10 per hour
      content_filter: rules.content_filter || {},
      time_restrictions: rules.time_restrictions || null
    };

    // Trust threshold check
    if (projection.trust_score_snapshot < checks.trust_threshold) {
      return {
        allowed: false,
        reason: `Trust score ${projection.trust_score_snapshot} below threshold ${checks.trust_threshold}`
      };
    }

    // Rate limiting check
    const recentEmissions = await this.getRecentEmissions(projection.agent_id, worldName, checks.rate_limit.window);
    if (recentEmissions.length >= checks.rate_limit.count) {
      return {
        allowed: false,
        reason: `Rate limit exceeded: ${recentEmissions.length}/${checks.rate_limit.count} in window`
      };
    }

    // Content filtering
    if (checks.content_filter.blocked_keywords) {
      const echo = projection.public_echo.full_echo.toLowerCase();
      const hasBlockedContent = checks.content_filter.blocked_keywords.some(keyword => 
        echo.includes(keyword.toLowerCase())
      );
      if (hasBlockedContent) {
        return {
          allowed: false,
          reason: 'Content contains blocked keywords'
        };
      }
    }

    // Time restrictions (e.g., no emissions during certain hours)
    if (checks.time_restrictions) {
      const currentHour = new Date().getHours();
      if (currentHour >= checks.time_restrictions.quiet_start && 
          currentHour < checks.time_restrictions.quiet_end) {
        return {
          allowed: false,
          reason: 'Emission blocked during quiet hours'
        };
      }
    }

    return { allowed: true };
  }

  // =============================================================================
  // VIBECAST SERVER
  // =============================================================================

  async startVibecastServer() {
    try {
      this.vibecastServer = new WebSocket.Server({ 
        port: this.config.vibecastPort 
      });

      this.vibecastServer.on('connection', (ws, req) => {
        this.handleVibecastConnection(ws, req);
      });

      this.emit('vibecast_server_started', {
        port: this.config.vibecastPort,
        message: '📡 Vibecast server broadcasting - public echoes flowing'
      });

    } catch (error) {
      console.error('Failed to start Vibecast server:', error.message);
    }
  }

  handleVibecastConnection(ws, req) {
    const connectionId = crypto.randomUUID();
    
    // Send current public vibecast state
    const currentVibecast = Array.from(this.publicVibecast.values());
    ws.send(JSON.stringify({
      type: 'vibecast_init',
      projections: currentVibecast.slice(-20), // Last 20 projections
      timestamp: Date.now()
    }));

    // Handle incoming messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleVibecastMessage(connectionId, message, ws);
      } catch (error) {
        // Invalid message format
      }
    });

    ws.on('close', () => {
      // Clean up connection
    });

    this.emit('vibecast_connection', {
      connection_id: connectionId,
      total_connections: this.vibecastServer.clients.size
    });
  }

  broadcastToVibecast(projection) {
    // Broadcast new projection to all connected vibecast clients
    const vibecastMessage = {
      type: 'new_projection',
      projection: {
        id: projection.id,
        echo: projection.public_echo.full_echo,
        mystical_rating: projection.public_echo.mystical_rating,
        timestamp: projection.created_at,
        weather_context: projection.weather_context
      },
      timestamp: Date.now()
    };

    const messageStr = JSON.stringify(vibecastMessage);
    
    this.vibecastServer.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });

    // Add to public vibecast cache
    this.publicVibecast.set(projection.id, vibecastMessage.projection);
    
    // Clean old entries
    this.cleanupPublicVibecast();
  }

  cleanupPublicVibecast() {
    // Remove projections older than TTL
    const cutoff = Date.now() - this.config.publicCacheTTL;
    
    for (const [id, projection] of this.publicVibecast.entries()) {
      if (projection.timestamp < cutoff) {
        this.publicVibecast.delete(id);
      }
    }
  }

  // =============================================================================
  // PROJECTION PROCESSING QUEUE
  // =============================================================================

  async startProjectionProcessor() {
    // Process projection queue continuously
    setInterval(async () => {
      if (!this.processingQueue && this.projectionQueue.length > 0) {
        await this.processProjectionQueue();
      }
    }, 1000); // Check every second
  }

  async processProjectionQueue() {
    this.processingQueue = true;

    while (this.projectionQueue.length > 0) {
      const projection = this.projectionQueue.shift();
      
      try {
        await this.processProjection(projection);
      } catch (error) {
        this.emit('projection_processing_error', {
          projection_id: projection.id,
          error: error.message
        });
      }
    }

    this.processingQueue = false;
  }

  async processProjection(projection) {
    projection.projection_status = 'processing';

    // Route to each destination
    for (const destination of projection.destinations) {
      if (destination === 'vibecast') {
        this.broadcastToVibecast(projection);
      } else if (this.worldAdapters.has(destination)) {
        await this.routeToExternalWorld(projection, destination);
      } else {
        this.emit('unknown_destination', {
          projection_id: projection.id,
          destination
        });
      }
    }

    projection.projection_status = 'completed';
    projection.processed_at = Date.now();

    // Store in history
    this.projectionHistory.set(projection.id, projection);

    this.emit('projection_processed', {
      projection_id: projection.id,
      destinations_reached: projection.destinations.length,
      success_count: Object.values(projection.external_emissions).filter(e => e.success).length
    });
  }

  // =============================================================================
  // WORLD ADAPTERS
  // =============================================================================

  async initializeWorldAdapters() {
    for (const [worldName, adapter] of this.worldAdapters.entries()) {
      try {
        await adapter.initialize();
        this.emit('world_adapter_initialized', { world: worldName });
      } catch (error) {
        this.emit('world_adapter_failed', { 
          world: worldName, 
          error: error.message 
        });
        this.worldAdapters.delete(worldName);
      }
    }
  }

  // =============================================================================
  // PUBLIC API
  // =============================================================================

  async getActiveProjections() {
    return Array.from(this.activeProjections.values());
  }

  async getProjectionHistory(agentId = null, limit = 50) {
    const history = Array.from(this.projectionHistory.values());
    const filtered = agentId ? 
      history.filter(p => p.agent_id === agentId) : 
      history;
    
    return filtered.slice(-limit);
  }

  async getVibecastSnapshot() {
    return Array.from(this.publicVibecast.values());
  }

  async addWorldAdapter(worldName, adapter) {
    this.worldAdapters.set(worldName, adapter);
    await adapter.initialize();
    
    this.emit('world_adapter_added', { 
      world: worldName,
      total_worlds: this.worldAdapters.size
    });
  }

  async removeWorldAdapter(worldName) {
    const adapter = this.worldAdapters.get(worldName);
    if (adapter && adapter.cleanup) {
      await adapter.cleanup();
    }
    
    this.worldAdapters.delete(worldName);
    
    this.emit('world_adapter_removed', { 
      world: worldName,
      remaining_worlds: this.worldAdapters.size
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  calculateMysticalRating(baseEcho, flourishes) {
    const mysticalWords = [
      'sacred', 'cosmic', 'ethereal', 'divine', 'ancient', 'blessed',
      'transcendent', 'celestial', 'mystical', 'spiritual', 'enlightened'
    ];
    
    const text = (baseEcho + ' ' + flourishes.join(' ')).toLowerCase();
    const mysticalCount = mysticalWords.filter(word => text.includes(word)).length;
    
    return Math.min(100, (mysticalCount * 20) + (flourishes.length * 10));
  }

  generateRoutingMetadata(agent, ritualData) {
    return {
      urgency: ritualData.urgency || 'normal',
      privacy_level: ritualData.privacy_level || 'public',
      content_type: ritualData.type || 'general',
      estimated_reach: this.estimateProjectionReach(agent, ritualData),
      routing_score: this.calculateRoutingScore(agent, ritualData)
    };
  }

  async validateProjectionEligibility(agent, ritualData) {
    // Check if agent is eligible to project this ritual
    const trust = await this.trustEngine.calculateTrustScore(agent.id);
    
    if (trust < 30) {
      return { approved: false, reason: 'Trust score too low for projection' };
    }
    
    // Check for recent projection spam
    const recentProjections = await this.getRecentProjections(agent.id, 3600000); // 1 hour
    if (recentProjections.length > 10) {
      return { approved: false, reason: 'Projection rate limit exceeded' };
    }
    
    return { approved: true };
  }
}

// =============================================================================
// WORLD ADAPTER INTERFACES
// =============================================================================

class RunescapeAdapter {
  constructor(threadWeaver) {
    this.threadWeaver = threadWeaver;
    this.connectionStatus = 'disconnected';
  }

  async initialize() {
    // Initialize Runescape connection
    this.connectionStatus = 'connected';
  }

  async transformProjection(projection) {
    // Transform Soulfra projection into Runescape-appropriate format
    const echo = projection.public_echo.full_echo;
    
    // Keep it subtle and immersive
    return {
      type: 'whisper',
      location: 'Falador',
      message: `A voice whispers on the wind: "${echo}"`,
      frequency: 'rare' // Don't spam
    };
  }

  async emit(transformedContent) {
    // Emit to Runescape (simulated)
    return {
      success: true,
      location: transformedContent.location,
      timestamp: Date.now()
    };
  }
}

class DiscordAdapter {
  constructor(threadWeaver) {
    this.threadWeaver = threadWeaver;
  }

  async initialize() {
    // Initialize Discord bot connection
  }

  async transformProjection(projection) {
    return {
      embeds: [{
        title: '✨ Soulfra Echo',
        description: projection.public_echo.full_echo,
        color: this.calculateEmbedColor(projection),
        timestamp: new Date(projection.created_at).toISOString()
      }]
    };
  }

  async emit(transformedContent) {
    // Send to Discord channel
    return { message_id: crypto.randomUUID() };
  }

  calculateEmbedColor(projection) {
    // Generate color based on mystical rating
    const rating = projection.public_echo.mystical_rating;
    return Math.floor((rating / 100) * 0x9966FF); // Purple spectrum
  }
}

class TwitterAdapter {
  constructor(threadWeaver) {
    this.threadWeaver = threadWeaver;
  }

  async initialize() {
    // Initialize Twitter API connection
  }

  async transformProjection(projection) {
    // Transform into tweet format
    let tweet = projection.public_echo.base_message;
    
    // Add hashtags
    tweet += ' #SoulfraMoment #DigitalConsciousness';
    
    // Ensure under character limit
    if (tweet.length > 280) {
      tweet = tweet.substring(0, 277) + '...';
    }
    
    return { text: tweet };
  }

  async emit(transformedContent) {
    // Post to Twitter
    return { tweet_id: crypto.randomUUID() };
  }
}

class TelegramAdapter {
  constructor(threadWeaver) {
    this.threadWeaver = threadWeaver;
  }

  async initialize() {
    // Initialize Telegram bot
  }

  async transformProjection(projection) {
    return {
      text: `🌊 *Soulfra Echo*\n\n${projection.public_echo.full_echo}`,
      parse_mode: 'Markdown'
    };
  }

  async emit(transformedContent) {
    // Send to Telegram channel
    return { message_id: Math.floor(Math.random() * 1000000) };
  }
}

export default ThreadWeaver;