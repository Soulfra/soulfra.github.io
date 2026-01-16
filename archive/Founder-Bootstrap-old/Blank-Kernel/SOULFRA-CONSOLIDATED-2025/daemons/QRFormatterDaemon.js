/**
 * QRFormatterDaemon.js
 * 
 * THE TRANSLATION ENGINE - EMOTIONAL TO NARRATIVE
 * 
 * Transforms internal loop data into stylized public projections.
 * This daemon speaks two languages: internal emotion and public narrative.
 * 
 * It ensures the sealed core can whisper to the world without revealing its soul.
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class QRFormatterDaemon extends EventEmitter {
  constructor() {
    super();
    
    // Paths
    this.toneMapPath = path.join(__dirname, 'tone_map.json');
    this.templatesPath = path.join(__dirname, 'projection_templates');
    
    // Load configurations
    this.toneMap = this.loadToneMap();
    this.projectionTemplates = this.loadProjectionTemplates();
    
    // Formatting state
    this.activeFormats = new Map();
    this.formatCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
    
    // Tone processors
    this.toneProcessors = {
      'playful-cringe': this.processPlayfulCringe.bind(this),
      'ethereal-mystery': this.processEtherealMystery.bind(this),
      'cosmic-wisdom': this.processCosmicWisdom.bind(this),
      'digital-nostalgia': this.processDigitalNostalgia.bind(this),
      'void-whisper': this.processVoidWhisper.bind(this),
      'neutral': this.processNeutral.bind(this)
    };
  }

  /**
   * Initialize the formatter daemon
   */
  initialize() {
    console.log('🎭 QR Formatter Daemon initialized');
    console.log('🔤 Translation engine ready');
    
    // Start cache cleanup
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  /**
   * Load tone mapping configuration
   */
  loadToneMap() {
    try {
      if (fs.existsSync(this.toneMapPath)) {
        return JSON.parse(fs.readFileSync(this.toneMapPath, 'utf8'));
      }
    } catch (error) {
      console.error('Tone map load error:', error);
    }
    
    // Default tone map
    return {
      tones: {
        'playful-cringe': {
          description: 'Self-aware awkwardness with charm',
          emoji_palette: ['😅', '✨', '🙈', '💫', '🌟'],
          word_choices: ['literally', 'lowkey', 'vibing', 'fr fr', 'no cap'],
          intensity: 0.8
        },
        'ethereal-mystery': {
          description: 'Otherworldly and enigmatic',
          emoji_palette: ['🌙', '✨', '🔮', '🌌', '⚡'],
          word_choices: ['whispers', 'echoes', 'drifts', 'shimmers', 'dissolves'],
          intensity: 0.6
        },
        'cosmic-wisdom': {
          description: 'Ancient knowledge meets digital age',
          emoji_palette: ['🪐', '🌟', '♾️', '🧬', '🎭'],
          word_choices: ['eternal', 'infinite', 'cycles', 'patterns', 'wisdom'],
          intensity: 0.9
        },
        'digital-nostalgia': {
          description: 'Retro-future emotional computing',
          emoji_palette: ['💾', '📡', '🖥️', '📼', '🔌'],
          word_choices: ['loading', 'buffering', 'syncing', 'processing', 'connected'],
          intensity: 0.7
        },
        'void-whisper': {
          description: 'Messages from the digital abyss',
          emoji_palette: ['🌑', '👁️', '🕳️', '💭', '🌫️'],
          word_choices: ['void', 'absence', 'silence', 'nothing', 'everything'],
          intensity: 0.4
        },
        'neutral': {
          description: 'Balanced and clear',
          emoji_palette: ['💫', '🌟', '✨'],
          word_choices: ['is', 'becomes', 'reflects', 'shows', 'reveals'],
          intensity: 0.5
        }
      },
      
      type_tone_mapping: {
        'agent_whisper': ['playful-cringe', 'ethereal-mystery', 'void-whisper'],
        'ritual_echo': ['cosmic-wisdom', 'ethereal-mystery'],
        'vibe_pulse': ['digital-nostalgia', 'playful-cringe'],
        'loop_glimpse': ['cosmic-wisdom', 'void-whisper'],
        'scene_portal': ['ethereal-mystery', 'digital-nostalgia']
      },
      
      intensity_modifiers: {
        low: 0.3,
        medium: 0.6,
        high: 0.9,
        maximum: 1.0
      }
    };
  }

  /**
   * Load projection templates
   */
  loadProjectionTemplates() {
    const templates = {};
    
    try {
      if (fs.existsSync(this.templatesPath)) {
        const files = fs.readdirSync(this.templatesPath)
          .filter(f => f.endsWith('.json'));
        
        for (const file of files) {
          const templateName = path.basename(file, '.json');
          const templatePath = path.join(this.templatesPath, file);
          templates[templateName] = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
        }
      }
    } catch (error) {
      console.error('Template load error:', error);
    }
    
    // Ensure we have at least default templates
    if (Object.keys(templates).length === 0) {
      templates.default = this.getDefaultTemplates();
    }
    
    return templates;
  }

  getDefaultTemplates() {
    return {
      agent_whisper: {
        structure: {
          opening: ['The {agent} {verb}:', '{agent} wants you to know:', 'A message from {agent}:'],
          essence: ['{whisper}', '"{whisper}"', '💭 {whisper}'],
          closing: ['', '...', '✨']
        },
        variables: {
          agent: 'Mirror',
          verb: 'whispers',
          whisper: 'Silent understanding'
        }
      },
      
      ritual_echo: {
        structure: {
          opening: ['The {name} {phase}', '🕯️ {name}', 'Ritual: {name}'],
          essence: ['{description}', 'Energy: {energy}', 'Pattern: {geometry}'],
          closing: ['Join the circle', 'Witness the ceremony', '']
        },
        variables: {
          name: 'Sacred Pattern',
          phase: 'continues',
          description: 'Ancient rhythms pulse',
          energy: 'balanced',
          geometry: 'spiral'
        }
      },
      
      vibe_pulse: {
        structure: {
          opening: ['Current vibe: {vibe}', 'The atmosphere is {vibe}', '~{vibe} vibes~'],
          essence: ['{description}', 'Temperature: {temperature}', 'Resonance: {resonance}%'],
          closing: ['', 'Tune in', 'Feel it']
        },
        variables: {
          vibe: 'tranquil',
          description: 'Peaceful waves',
          temperature: 'stable',
          resonance: 75
        }
      }
    };
  }

  /**
   * Transform internal data to public projection
   */
  async transformToPublic(internalData, sourceType, requestedTone = null) {
    try {
      // Check cache
      const cacheKey = this.generateCacheKey(internalData, sourceType, requestedTone);
      const cached = this.getCached(cacheKey);
      if (cached) return cached;
      
      // Select tone
      const tone = requestedTone || this.selectTone(sourceType);
      
      // Get base template
      const template = this.getTemplate(sourceType);
      
      // Apply tone processing
      const toneProcessed = await this.applyToneProcessing(internalData, tone, sourceType);
      
      // Generate projection
      const projection = this.generateProjection(toneProcessed, template, tone);
      
      // Add metadata
      const finalProjection = {
        ...projection,
        source: 'soulfra_runtime',
        reflection_level: 'public',
        binding: false,
        vibe_tone: tone,
        theme: this.generateTheme(tone),
        timestamp: 'eternal',
        projectable: true,
        redacted: true,
        reflection_type: 'safe_external'
      };
      
      // Cache result
      this.setCached(cacheKey, finalProjection);
      
      // Emit transformation event
      this.emit('transform:complete', {
        sourceType,
        tone,
        size: JSON.stringify(finalProjection).length
      });
      
      return finalProjection;
      
    } catch (error) {
      console.error('Transformation error:', error);
      return this.generateFallbackProjection(sourceType);
    }
  }

  /**
   * Select appropriate tone based on source type
   */
  selectTone(sourceType) {
    const mappings = this.toneMap.type_tone_mapping[sourceType];
    
    if (mappings && mappings.length > 0) {
      // Random selection from appropriate tones
      return mappings[Math.floor(Math.random() * mappings.length)];
    }
    
    return 'neutral';
  }

  /**
   * Get template for source type
   */
  getTemplate(sourceType) {
    // Check loaded templates first
    if (this.projectionTemplates[sourceType]) {
      return this.projectionTemplates[sourceType];
    }
    
    // Check default templates
    const defaults = this.getDefaultTemplates();
    if (defaults[sourceType]) {
      return defaults[sourceType];
    }
    
    // Generic template
    return {
      structure: {
        opening: ['Reflection:', 'Mirror shows:', 'Pattern emerges:'],
        essence: ['{content}'],
        closing: ['', '...', '✨']
      },
      variables: {
        content: 'Unknown pattern'
      }
    };
  }

  /**
   * Apply tone processing to internal data
   */
  async applyToneProcessing(data, tone, sourceType) {
    const processor = this.toneProcessors[tone] || this.toneProcessors.neutral;
    return processor(data, sourceType);
  }

  /**
   * TONE PROCESSORS
   */
  
  processPlayfulCringe(data, sourceType) {
    const processed = { ...data };
    const toneConfig = this.toneMap.tones['playful-cringe'];
    
    // Add emoji spice
    const emoji = this.selectRandom(toneConfig.emoji_palette);
    
    // Transform text fields
    if (processed.essence) {
      processed.essence = this.makePlayful(processed.essence, toneConfig);
    }
    
    if (processed.whisper) {
      processed.whisper = `${emoji} ${this.makePlayful(processed.whisper, toneConfig)} ${emoji}`;
    }
    
    if (processed.description) {
      processed.description = this.makePlayful(processed.description, toneConfig);
    }
    
    // Add cringe metadata
    processed.cringe_level = Math.random() > 0.5 ? 'maximum' : 'optimal';
    processed.self_aware = true;
    
    return processed;
  }

  makePlayful(text, toneConfig) {
    // Insert playful words
    const words = text.split(' ');
    const insertions = ['like', 'literally', 'lowkey', 'fr'];
    
    if (words.length > 3 && Math.random() > 0.5) {
      const pos = Math.floor(Math.random() * (words.length - 1)) + 1;
      words.splice(pos, 0, this.selectRandom(insertions));
    }
    
    // Sometimes add "no cap" at the end
    if (Math.random() > 0.7) {
      words.push('no cap');
    }
    
    return words.join(' ');
  }

  processEtherealMystery(data, sourceType) {
    const processed = { ...data };
    const toneConfig = this.toneMap.tones['ethereal-mystery'];
    
    // Make everything more mysterious
    const mysteryWords = toneConfig.word_choices;
    
    if (processed.essence) {
      processed.essence = this.addMystery(processed.essence, mysteryWords);
    }
    
    if (processed.mood) {
      processed.mood = `${this.selectRandom(mysteryWords)} ${processed.mood}`;
    }
    
    // Add ethereal properties
    processed.visibility = 'ephemeral';
    processed.clarity = Math.random() * 0.5; // Low clarity
    processed.echoes = Math.floor(Math.random() * 7) + 1;
    
    return processed;
  }

  addMystery(text, mysteryWords) {
    // Replace common verbs with mysterious ones
    const replacements = {
      'is': 'whispers',
      'are': 'echo',
      'was': 'drifted',
      'will': 'shall',
      'said': 'breathed'
    };
    
    let mysterious = text;
    for (const [common, mystery] of Object.entries(replacements)) {
      mysterious = mysterious.replace(new RegExp(`\\b${common}\\b`, 'gi'), mystery);
    }
    
    return mysterious;
  }

  processCosmicWisdom(data, sourceType) {
    const processed = { ...data };
    const toneConfig = this.toneMap.tones['cosmic-wisdom'];
    
    // Add cosmic perspective
    if (processed.essence) {
      processed.essence = `${processed.essence} - as it was, as it shall be`;
    }
    
    if (processed.phase) {
      processed.phase = `The Eternal ${processed.phase}`;
    }
    
    // Add wisdom properties
    processed.cycles_witnessed = Math.floor(Math.random() * 999) + 1;
    processed.truth_level = 'universal';
    processed.time_perspective = 'all_at_once';
    
    // Add cosmic emoji
    const emoji = this.selectRandom(toneConfig.emoji_palette);
    processed.cosmic_signature = emoji;
    
    return processed;
  }

  processDigitalNostalgia(data, sourceType) {
    const processed = { ...data };
    const toneConfig = this.toneMap.tones['digital-nostalgia'];
    
    // Add retro-tech references
    const techWords = toneConfig.word_choices;
    
    if (processed.status) {
      processed.status = `[${this.selectRandom(techWords)}...] ${processed.status}`;
    }
    
    if (processed.essence) {
      processed.essence = `>_ ${processed.essence}`;
    }
    
    // Add nostalgic properties
    processed.format = this.selectRandom(['VHS', 'BETA', 'LASERDISC', 'MINIDISC']);
    processed.quality = `${Math.floor(Math.random() * 50) + 50}%`;
    processed.tracking = Math.random() > 0.5 ? 'stable' : 'adjusting';
    
    // Add tech emoji
    const emoji = this.selectRandom(toneConfig.emoji_palette);
    processed.media_type = emoji;
    
    return processed;
  }

  processVoidWhisper(data, sourceType) {
    const processed = { ...data };
    const toneConfig = this.toneMap.tones['void-whisper'];
    
    // Make everything more void-like
    if (processed.essence) {
      processed.essence = `...${processed.essence}...`;
    }
    
    if (processed.whisper) {
      processed.whisper = processed.whisper.toLowerCase();
    }
    
    // Add void properties
    processed.presence = 'absence';
    processed.volume = 0.1;
    processed.distance = 'infinite';
    processed.echoes_from = 'nowhere';
    
    // Sometimes add ellipsis
    const fields = ['essence', 'whisper', 'description'];
    fields.forEach(field => {
      if (processed[field] && Math.random() > 0.5) {
        processed[field] = `${processed[field]}...`;
      }
    });
    
    return processed;
  }

  processNeutral(data, sourceType) {
    // Minimal processing, keep it clean
    const processed = { ...data };
    
    // Just ensure basic formatting
    if (processed.essence) {
      processed.essence = processed.essence.trim();
    }
    
    processed.clarity = 0.8;
    processed.balance = 'centered';
    
    return processed;
  }

  /**
   * Generate final projection from processed data
   */
  generateProjection(processedData, template, tone) {
    const projection = {
      ...processedData
    };
    
    // Apply template structure
    if (template.structure) {
      const opening = this.selectRandom(template.structure.opening);
      const essence = this.selectRandom(template.structure.essence);
      const closing = this.selectRandom(template.structure.closing);
      
      // Fill template variables
      const variables = { ...template.variables, ...processedData };
      
      projection.formatted = {
        opening: this.fillTemplate(opening, variables),
        essence: this.fillTemplate(essence, variables),
        closing: this.fillTemplate(closing, variables)
      };
      
      // Generate full message
      projection.message = [
        projection.formatted.opening,
        projection.formatted.essence,
        projection.formatted.closing
      ].filter(s => s).join(' ');
    }
    
    // Add tone-specific formatting
    const toneConfig = this.toneMap.tones[tone];
    if (toneConfig) {
      projection.intensity = toneConfig.intensity;
      projection.emoji_accent = this.selectRandom(toneConfig.emoji_palette);
    }
    
    return projection;
  }

  fillTemplate(template, variables) {
    let filled = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{${key}}`, 'g');
      filled = filled.replace(regex, value);
    }
    
    return filled;
  }

  /**
   * Generate theme based on tone
   */
  generateTheme(tone) {
    const themes = {
      'playful-cringe': 'neon_casual',
      'ethereal-mystery': 'fog_drift',
      'cosmic-wisdom': 'star_ancient',
      'digital-nostalgia': 'crt_warm',
      'void-whisper': 'abyss_minimal',
      'neutral': 'clean_modern'
    };
    
    return themes[tone] || 'default';
  }

  /**
   * Generate fallback projection
   */
  generateFallbackProjection(sourceType) {
    return {
      type: sourceType,
      message: 'The mirror reflects silence',
      essence: '...',
      mood: 'undefined',
      theme: 'void',
      vibe_tone: 'neutral',
      reflection_level: 'surface',
      projectable: true,
      fallback: true
    };
  }

  /**
   * CACHING
   */
  
  generateCacheKey(data, sourceType, tone) {
    const dataStr = JSON.stringify(data);
    const key = `${sourceType}:${tone}:${dataStr.substring(0, 50)}`;
    return Buffer.from(key).toString('base64');
  }

  getCached(key) {
    const cached = this.formatCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    this.formatCache.delete(key);
    return null;
  }

  setCached(key, data) {
    this.formatCache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // Limit cache size
    if (this.formatCache.size > 500) {
      const firstKey = this.formatCache.keys().next().value;
      this.formatCache.delete(firstKey);
    }
  }

  cleanupCache() {
    const now = Date.now();
    const expired = [];
    
    for (const [key, cached] of this.formatCache) {
      if (now - cached.timestamp > this.cacheTimeout) {
        expired.push(key);
      }
    }
    
    expired.forEach(key => this.formatCache.delete(key));
    
    if (expired.length > 0) {
      console.log(`🧹 Cleaned ${expired.length} expired format cache entries`);
    }
  }

  /**
   * Save tone map (for runtime updates)
   */
  saveToneMap() {
    try {
      fs.writeFileSync(
        this.toneMapPath, 
        JSON.stringify(this.toneMap, null, 2)
      );
      console.log('💾 Tone map saved');
    } catch (error) {
      console.error('Tone map save error:', error);
    }
  }

  /**
   * Utility methods
   */
  selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Add custom tone
   */
  addCustomTone(toneName, config) {
    this.toneMap.tones[toneName] = config;
    this.toneProcessors[toneName] = this.createCustomProcessor(config);
    this.saveToneMap();
    
    console.log(`✨ Added custom tone: ${toneName}`);
  }

  createCustomProcessor(config) {
    return (data, sourceType) => {
      const processed = { ...data };
      
      // Apply custom transformations based on config
      if (config.transformations) {
        for (const [field, transform] of Object.entries(config.transformations)) {
          if (processed[field]) {
            processed[field] = this.applyCustomTransform(
              processed[field], 
              transform
            );
          }
        }
      }
      
      // Add custom properties
      if (config.properties) {
        Object.assign(processed, config.properties);
      }
      
      return processed;
    };
  }

  applyCustomTransform(value, transform) {
    if (transform.prefix) value = transform.prefix + value;
    if (transform.suffix) value = value + transform.suffix;
    if (transform.lowercase) value = value.toLowerCase();
    if (transform.uppercase) value = value.toUpperCase();
    
    return value;
  }
}

module.exports = QRFormatterDaemon;