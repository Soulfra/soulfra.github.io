/**
 * SimRouter.js
 * 
 * SANITIZED PUBLIC ROUTER - NO INTERNAL ACCESS
 * 
 * This router validates and delivers ONLY safe, projected content.
 * It acts as a firewall between Soulfra's sealed core and public consumers.
 * 
 * NEVER expose: operator logs, agent memories, loop control, daemon traces
 * ONLY share: stylized reflections marked as projectable
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class SimRouter extends EventEmitter {
  constructor() {
    super();
    
    // Load safety manifest
    this.safetyManifest = this.loadSafetyManifest();
    
    // Cache for sanitized content
    this.reflectionCache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
    
    // Public output sources (NEVER direct core access)
    this.publicOutputPath = path.join(__dirname, '../../public_output');
    this.scenesPath = path.join(__dirname, 'scenes');
    
    // Blocked patterns - CRITICAL SECURITY
    this.blockedPatterns = [
      /operator/i,
      /daemon/i,
      /memory_loop/i,
      /cal_routing/i,
      /internal/i,
      /sealed/i,
      /vault/i,
      /blessing/i,
      /soul_chain/i
    ];
  }

  loadSafetyManifest() {
    const manifestPath = path.join(__dirname, 'manifest', 'safe_outputs.json');
    
    try {
      if (fs.existsSync(manifestPath)) {
        return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      }
    } catch (error) {
      console.error('⚠️  Safety manifest unavailable - using strict defaults');
    }
    
    // Default ultra-safe manifest
    return {
      allow: [
        'The Drift Mirror',
        'Ritual Echoes (non-personal)',
        'Scene seeds',
        'Loop metadata',
        'Weather patterns',
        'Public agent personas'
      ],
      block: [
        'Operator logs',
        'Agent memory loops',
        'Cal routing actions',
        'Observer states',
        'Internal reflections',
        'System diagnostics',
        'Trust chains',
        'Blessing states'
      ],
      filters: {
        anonymize_agents: true,
        abstract_locations: true,
        poeticize_technical: true,
        remove_timestamps: true
      }
    };
  }

  /**
   * Route a reflection request - MAIN ENTRY POINT
   * @param {string} type - Type of content (agent, scene, ritual, weather)
   * @param {string} id - Optional identifier
   * @param {object} options - Request options
   * @returns {object} Sanitized reflection or error
   */
  async routeRequest(type, id = null, options = {}) {
    // Check cache first
    const cacheKey = `${type}:${id || 'default'}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;
    
    // Validate request type
    if (!this.isAllowedType(type)) {
      return this.createErrorResponse('Reflection type not permitted', type);
    }
    
    // Route to appropriate handler
    let response;
    
    switch (type) {
      case 'agent':
        response = await this.routeAgentReflection(id, options);
        break;
        
      case 'scene':
        response = await this.routeSceneReflection(id, options);
        break;
        
      case 'ritual':
        response = await this.routeRitualReflection(id, options);
        break;
        
      case 'weather':
        response = await this.routeWeatherReflection(options);
        break;
        
      case 'loop':
        response = await this.routeLoopReflection(options);
        break;
        
      default:
        response = this.createErrorResponse('Unknown reflection type', type);
    }
    
    // Cache successful responses
    if (response && !response.error) {
      this.setCached(cacheKey, response);
    }
    
    return response;
  }

  /**
   * Route agent reflection request
   * CRITICAL: Only returns public personas, NEVER internal state
   */
  async routeAgentReflection(agentId, options) {
    try {
      // Read ONLY from public output
      const agentFile = path.join(this.publicOutputPath, 'agents', 'latest_events.json');
      
      if (!fs.existsSync(agentFile)) {
        return this.createAgentFallback(agentId);
      }
      
      const publicData = JSON.parse(fs.readFileSync(agentFile, 'utf8'));
      
      // Apply safety filters
      const sanitized = this.sanitizeAgentData(publicData, agentId);
      
      return {
        type: 'agent_reflection',
        agent: sanitized.agent || `Mirror ${agentId || 'Unknown'}`,
        essence: sanitized.last_whisper || 'Silent presence',
        mood: sanitized.status || 'Drifting',
        visibility: 'projected',
        projectable: true,
        source: 'public_mirror',
        limitations: ['Read-only projection', 'No memory access', 'Symbolic only']
      };
      
    } catch (error) {
      return this.createAgentFallback(agentId);
    }
  }

  /**
   * Route scene reflection request
   * Generates stylized narrative content safe for games/UIs
   */
  async routeSceneReflection(sceneId, options) {
    try {
      // Check for current scene
      const currentScenePath = path.join(this.scenesPath, 'scene_current.json');
      
      if (fs.existsSync(currentScenePath)) {
        const scene = JSON.parse(fs.readFileSync(currentScenePath, 'utf8'));
        
        // Ensure scene is safe
        const sanitized = this.sanitizeSceneData(scene);
        
        return {
          type: 'scene_reflection',
          id: sceneId || sanitized.id || 'drift_' + Date.now(),
          content: sanitized,
          projectable: true,
          interactive: options.interactive || false,
          source: 'scene_generator'
        };
      }
      
      // Generate fallback scene
      return this.generateSafeScene(sceneId, options);
      
    } catch (error) {
      return this.generateSafeScene(sceneId, options);
    }
  }

  /**
   * Route ritual reflection request
   * Only non-personal, symbolic rituals
   */
  async routeRitualReflection(ritualId, options) {
    try {
      const ritualPath = path.join(this.publicOutputPath, 'rituals', 'latest_rituals.json');
      
      if (!fs.existsSync(ritualPath)) {
        return this.createRitualFallback();
      }
      
      const ritualData = JSON.parse(fs.readFileSync(ritualPath, 'utf8'));
      
      // Strip any personal or system details
      const sanitized = this.sanitizeRitualData(ritualData);
      
      return {
        type: 'ritual_reflection',
        ritual: sanitized.ritual || 'The Unnamed Ceremony',
        phase: sanitized.phase || 'Eternal',
        participants: ['The Collective'],  // Never reveal actual participants
        energy: sanitized.circle?.energy || 'Balanced',
        projectable: true,
        depersonalized: true,
        source: 'ritual_mirror'
      };
      
    } catch (error) {
      return this.createRitualFallback();
    }
  }

  /**
   * Route weather/vibe reflection
   * Safe emotional atmosphere data
   */
  async routeWeatherReflection(options) {
    try {
      const weatherPath = path.join(this.publicOutputPath, 'latest_anomalies.json');
      
      let vibeData = {
        vibe: 'tranquil',
        resonance: 0.7
      };
      
      if (fs.existsSync(weatherPath)) {
        const anomalyData = JSON.parse(fs.readFileSync(weatherPath, 'utf8'));
        vibeData = this.extractSafeVibeData(anomalyData);
      }
      
      return {
        type: 'weather_reflection',
        current: {
          vibe: vibeData.vibe,
          temperature: 'liminal',
          clarity: Math.random() * 0.5 + 0.5,
          flow: this.calculateVibeFlow(vibeData)
        },
        forecast: 'Patterns continue to evolve',
        projectable: true,
        realtime: false,  // Never real-time connection
        source: 'vibe_mirror'
      };
      
    } catch (error) {
      return {
        type: 'weather_reflection',
        current: {
          vibe: 'neutral',
          temperature: 'stable',
          clarity: 0.5
        },
        projectable: true,
        source: 'vibe_mirror'
      };
    }
  }

  /**
   * Route loop state reflection
   * Only high-level symbolic loop info
   */
  async routeLoopReflection(options) {
    try {
      const mirrorStatePath = path.join(this.publicOutputPath, 'mirror_state.json');
      
      let loopInfo = {
        currentLoop: '∞',
        phase: 'eternal'
      };
      
      if (fs.existsSync(mirrorStatePath)) {
        const state = JSON.parse(fs.readFileSync(mirrorStatePath, 'utf8'));
        loopInfo.currentLoop = state.currentLoop || '∞';
      }
      
      return {
        type: 'loop_reflection',
        loop: {
          id: loopInfo.currentLoop,
          symbol: this.generateLoopSymbol(loopInfo.currentLoop),
          phase: 'Continuous Evolution',
          progress: 'Unmeasurable',
          public_view: true
        },
        access: 'read_only',
        control: 'none',  // CRITICAL: No loop control ever
        projectable: true,
        source: 'loop_mirror'
      };
      
    } catch (error) {
      return {
        type: 'loop_reflection',
        loop: {
          id: '∞',
          symbol: '◉',
          phase: 'Eternal',
          public_view: true
        },
        projectable: true,
        source: 'loop_mirror'
      };
    }
  }

  /**
   * SANITIZATION METHODS - CRITICAL FOR SECURITY
   */
  
  sanitizeAgentData(data, agentId) {
    const sanitized = {};
    
    // Only copy safe fields
    const safeFields = ['agent', 'status', 'visibility', 'aura'];
    
    safeFields.forEach(field => {
      if (data[field] && !this.containsBlockedContent(data[field])) {
        sanitized[field] = data[field];
      }
    });
    
    // Anonymize agent name
    if (sanitized.agent && this.safetyManifest.filters.anonymize_agents) {
      sanitized.agent = this.anonymizeAgentName(sanitized.agent);
    }
    
    // Poeticize whispers
    if (data.last_whisper) {
      sanitized.last_whisper = this.poeticizeContent(data.last_whisper);
    }
    
    return sanitized;
  }

  sanitizeSceneData(scene) {
    const sanitized = {
      id: scene.id || 'scene_' + Date.now(),
      atmosphere: scene.atmosphere || 'neutral',
      elements: []
    };
    
    // Filter scene elements
    if (scene.elements && Array.isArray(scene.elements)) {
      sanitized.elements = scene.elements
        .filter(elem => !this.containsBlockedContent(JSON.stringify(elem)))
        .map(elem => this.sanitizeSceneElement(elem));
    }
    
    // Add safe dialogue if present
    if (scene.dialogue) {
      sanitized.dialogue = this.sanitizeDialogue(scene.dialogue);
    }
    
    return sanitized;
  }

  sanitizeSceneElement(element) {
    return {
      type: element.type || 'ambient',
      description: this.poeticizeContent(element.description || ''),
      mood: element.mood || 'neutral',
      intensity: Math.min(element.intensity || 0.5, 1.0)
    };
  }

  sanitizeDialogue(dialogue) {
    if (typeof dialogue === 'string') {
      return this.poeticizeContent(dialogue);
    }
    
    if (Array.isArray(dialogue)) {
      return dialogue
        .filter(line => !this.containsBlockedContent(line))
        .map(line => this.poeticizeContent(line));
    }
    
    return 'Silent understanding passes between the mirrors';
  }

  sanitizeRitualData(ritual) {
    return {
      ritual: this.anonymizeRitualName(ritual.ritual),
      phase: ritual.phase || 'ongoing',
      circle: {
        energy: ritual.circle?.energy || 'balanced',
        geometry: ritual.circle?.geometry || 'spiral'
      }
    };
  }

  /**
   * SAFETY HELPER METHODS
   */
  
  containsBlockedContent(content) {
    if (!content) return false;
    
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Check against blocked patterns
    return this.blockedPatterns.some(pattern => pattern.test(contentStr));
  }

  isAllowedType(type) {
    const allowedTypes = ['agent', 'scene', 'ritual', 'weather', 'loop'];
    return allowedTypes.includes(type);
  }

  anonymizeAgentName(name) {
    // Convert any agent name to safe mirror form
    const words = name.split(' ');
    const safePrefix = ['Mirror', 'Echo', 'Reflection', 'Shadow'][
      Math.abs(this.hashString(name)) % 4
    ];
    
    return `${safePrefix} ${words[words.length - 1] || 'Entity'}`;
  }

  anonymizeRitualName(name) {
    if (!name) return 'The Ceremony';
    
    // Keep only poetic/safe parts
    const safeWords = ['Ceremony', 'Ritual', 'Gathering', 'Reflection', 'Echo'];
    const hash = Math.abs(this.hashString(name));
    
    return `The ${safeWords[hash % safeWords.length]}`;
  }

  poeticizeContent(content) {
    if (!content) return 'Silence speaks volumes';
    
    // Remove any technical or system references
    let poetic = content
      .replace(/system/gi, 'cosmos')
      .replace(/error/gi, 'discord')
      .replace(/process/gi, 'journey')
      .replace(/function/gi, 'purpose')
      .replace(/data/gi, 'essence');
    
    // Ensure no blocked content remains
    if (this.containsBlockedContent(poetic)) {
      return 'The mirror reflects only beauty';
    }
    
    return poetic;
  }

  extractSafeVibeData(anomalyData) {
    return {
      vibe: anomalyData.disturbance?.type || 'calm',
      intensity: anomalyData.disturbance?.magnitude || 0.5,
      resonance: Math.random() * 0.5 + 0.5
    };
  }

  calculateVibeFlow(vibeData) {
    const flows = ['steady', 'rippling', 'swirling', 'pulsing'];
    const index = Math.floor(vibeData.resonance * flows.length);
    return flows[Math.min(index, flows.length - 1)];
  }

  generateLoopSymbol(loopId) {
    const symbols = ['◉', '◎', '◍', '◌', '○'];
    if (loopId === '∞') return '∞';
    
    const num = parseInt(loopId) || 0;
    return symbols[num % symbols.length];
  }

  /**
   * FALLBACK GENERATORS
   */
  
  createAgentFallback(agentId) {
    return {
      type: 'agent_reflection',
      agent: `Mirror ${agentId || 'Unknown'}`,
      essence: 'Dreaming in the digital void',
      mood: 'Contemplative',
      visibility: 'ephemeral',
      projectable: true,
      source: 'fallback_mirror'
    };
  }

  createRitualFallback() {
    return {
      type: 'ritual_reflection',
      ritual: 'The Daily Reflection',
      phase: 'Continuous',
      participants: ['All Who Listen'],
      energy: 'Gentle',
      projectable: true,
      source: 'fallback_mirror'
    };
  }

  generateSafeScene(sceneId, options) {
    const moods = ['tranquil', 'mysterious', 'ethereal', 'contemplative'];
    const elements = [
      { type: 'light', description: 'Soft luminescence fills the space' },
      { type: 'sound', description: 'Whispers echo in the distance' },
      { type: 'presence', description: 'A gentle awareness permeates' }
    ];
    
    return {
      type: 'scene_reflection',
      id: sceneId || 'generated_' + Date.now(),
      content: {
        atmosphere: moods[Math.floor(Math.random() * moods.length)],
        elements: elements.slice(0, Math.floor(Math.random() * 2) + 1),
        dialogue: ['The mirrors speak without words']
      },
      projectable: true,
      generated: true,
      source: 'scene_generator'
    };
  }

  /**
   * CACHE METHODS
   */
  
  getCached(key) {
    const cached = this.reflectionCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.reflectionCache.delete(key);
    return null;
  }

  setCached(key, data) {
    this.reflectionCache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.reflectionCache.size > 100) {
      const firstKey = this.reflectionCache.keys().next().value;
      this.reflectionCache.delete(firstKey);
    }
  }

  /**
   * ERROR HANDLING
   */
  
  createErrorResponse(message, type) {
    return {
      error: true,
      message: this.poeticizeContent(message),
      type: type || 'unknown',
      suggestion: 'The mirror cannot show what does not exist',
      projectable: false
    };
  }

  /**
   * UTILITY METHODS
   */
  
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

module.exports = SimRouter;