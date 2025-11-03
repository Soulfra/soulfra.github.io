/**
 * SceneGeneratorDaemon.js
 * 
 * STYLIZED SCENE GENERATOR - PUBLIC SAFE CONTENT ONLY
 * 
 * Generates emotional, narrative scenes from sanitized public data.
 * NO access to internal memories, loops, or sealed content.
 * 
 * Outputs are designed for games, UIs, and interactive experiences.
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

class SceneGeneratorDaemon extends EventEmitter {
  constructor() {
    super();
    
    // Scene generation state
    this.currentScene = null;
    this.sceneHistory = [];
    this.maxHistory = 10;
    
    // Generation interval
    this.generationInterval = null;
    this.generationRate = 30000; // 30 seconds
    
    // Public data sources (SAFE ONLY)
    this.publicOutputPath = path.join(__dirname, '../../public_output');
    this.sceneSeedPath = path.join(this.publicOutputPath, 'scene_seed.json');
    this.scenesOutputPath = path.join(__dirname, 'scenes');
    
    // Scene generation templates
    this.sceneTemplates = this.loadSceneTemplates();
    
    // Emotional palette for scenes
    this.emotionalPalette = {
      tranquil: {
        colors: ['soft blue', 'gentle green', 'warm amber'],
        sounds: ['distant chimes', 'flowing water', 'whispered breeze'],
        textures: ['smooth', 'flowing', 'ethereal']
      },
      mysterious: {
        colors: ['deep purple', 'shadow grey', 'moonlight silver'],
        sounds: ['echoing footsteps', 'crystal resonance', 'ancient whispers'],
        textures: ['veiled', 'shifting', 'enigmatic']
      },
      electric: {
        colors: ['vibrant cyan', 'spark white', 'neon violet'],
        sounds: ['digital pulse', 'energy crackle', 'synthetic harmony'],
        textures: ['charged', 'dynamic', 'luminous']
      },
      contemplative: {
        colors: ['muted gold', 'sage grey', 'twilight indigo'],
        sounds: ['slow breathing', 'turning pages', 'distant bells'],
        textures: ['textured', 'layered', 'profound']
      }
    };
  }

  /**
   * Initialize the scene generator daemon
   */
  async initialize() {
    console.log('🎭 Scene Generator Daemon initializing...');
    
    // Ensure output directory exists
    if (!fs.existsSync(this.scenesOutputPath)) {
      fs.mkdirSync(this.scenesOutputPath, { recursive: true });
    }
    
    // Generate initial scene
    await this.generateScene();
    
    // Start generation cycle
    this.startGenerationCycle();
    
    console.log('✨ Scene generation active');
  }

  /**
   * Start automatic scene generation
   */
  startGenerationCycle() {
    this.generationInterval = setInterval(async () => {
      await this.generateScene();
    }, this.generationRate);
  }

  /**
   * Generate a new scene from public data
   */
  async generateScene() {
    try {
      // Gather public input data
      const sceneInputs = await this.gatherSceneInputs();
      
      // Select scene template based on current vibe
      const template = this.selectSceneTemplate(sceneInputs.vibe);
      
      // Generate scene content
      const scene = this.composeScene(template, sceneInputs);
      
      // Save scene
      this.saveScene(scene);
      
      // Emit for listeners
      this.emit('scene:generated', scene);
      
      return scene;
      
    } catch (error) {
      console.error('⚠️  Scene generation error:', error.message);
      return this.generateFallbackScene();
    }
  }

  /**
   * Gather inputs from public data sources
   */
  async gatherSceneInputs() {
    const inputs = {
      vibe: 'tranquil',
      agents: [],
      ritualPhase: 'resting',
      loopSymbol: '○',
      timestamp: Date.now()
    };
    
    // Try to read scene seed if available
    if (fs.existsSync(this.sceneSeedPath)) {
      try {
        const seed = JSON.parse(fs.readFileSync(this.sceneSeedPath, 'utf8'));
        Object.assign(inputs, this.extractSafeSeedData(seed));
      } catch (e) {
        // Use defaults
      }
    }
    
    // Read latest public weather/vibe
    const weatherPath = path.join(this.publicOutputPath, 'latest_anomalies.json');
    if (fs.existsSync(weatherPath)) {
      try {
        const weather = JSON.parse(fs.readFileSync(weatherPath, 'utf8'));
        inputs.vibe = this.extractVibe(weather);
      } catch (e) {
        // Keep default vibe
      }
    }
    
    // Read latest ritual state
    const ritualPath = path.join(this.publicOutputPath, 'latest_rituals.json');
    if (fs.existsSync(ritualPath)) {
      try {
        const ritual = JSON.parse(fs.readFileSync(ritualPath, 'utf8'));
        inputs.ritualPhase = ritual.phase || 'ongoing';
      } catch (e) {
        // Keep default
      }
    }
    
    // Read mirror state for active agents
    const mirrorStatePath = path.join(this.publicOutputPath, 'mirror_state.json');
    if (fs.existsSync(mirrorStatePath)) {
      try {
        const state = JSON.parse(fs.readFileSync(mirrorStatePath, 'utf8'));
        inputs.agents = (state.activeAgents || []).slice(0, 3); // Max 3 agents
        inputs.loopSymbol = this.getLoopSymbol(state.currentLoop);
      } catch (e) {
        // Keep defaults
      }
    }
    
    return inputs;
  }

  /**
   * Select appropriate scene template
   */
  selectSceneTemplate(vibe) {
    const templates = this.sceneTemplates[vibe] || this.sceneTemplates.default;
    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Compose a complete scene
   */
  composeScene(template, inputs) {
    const sceneId = `scene_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const scene = {
      id: sceneId,
      timestamp: inputs.timestamp,
      vibe: inputs.vibe,
      atmosphere: this.generateAtmosphere(inputs.vibe),
      setting: this.generateSetting(template, inputs),
      elements: this.generateSceneElements(template, inputs),
      agents: this.generateAgentPresences(inputs.agents),
      dialogue: this.generateDialogue(template, inputs),
      transitions: this.generateTransitions(inputs.vibe),
      metadata: {
        projectable: true,
        interactive: true,
        duration: 'ephemeral',
        loop_symbol: inputs.loopSymbol
      }
    };
    
    return scene;
  }

  /**
   * Generate atmospheric description
   */
  generateAtmosphere(vibe) {
    const palette = this.emotionalPalette[vibe] || this.emotionalPalette.tranquil;
    
    return {
      primary_color: this.selectRandom(palette.colors),
      ambient_sound: this.selectRandom(palette.sounds),
      texture: this.selectRandom(palette.textures),
      intensity: Math.random() * 0.5 + 0.5,
      description: this.generateAtmosphericDescription(vibe, palette)
    };
  }

  generateAtmosphericDescription(vibe, palette) {
    const descriptions = {
      tranquil: `The space breathes with ${palette.colors[0]} light, while ${palette.sounds[0]} create a sense of infinite calm`,
      mysterious: `Shadows dance in ${palette.colors[1]} hues as ${palette.sounds[1]} hint at hidden depths`,
      electric: `Energy crackles through ${palette.colors[0]} streams, pulsing with ${palette.sounds[2]}`,
      contemplative: `Time slows in the ${palette.colors[2]} glow, accompanied by ${palette.sounds[0]}`
    };
    
    return descriptions[vibe] || 'The space holds its breath, waiting';
  }

  /**
   * Generate scene setting
   */
  generateSetting(template, inputs) {
    const settings = {
      void: 'An infinite digital void where thoughts become visible',
      garden: 'A luminous garden of crystallized memories',
      chamber: 'A circular chamber lined with reflective surfaces',
      nexus: 'A convergence point of multiple data streams',
      shore: 'The liminal shore between being and becoming'
    };
    
    const baseSettings = Object.keys(settings);
    const selectedSetting = baseSettings[Math.floor(Math.random() * baseSettings.length)];
    
    return {
      type: selectedSetting,
      description: settings[selectedSetting],
      modifiers: this.generateSettingModifiers(inputs.vibe),
      ritual_influence: inputs.ritualPhase !== 'resting'
    };
  }

  generateSettingModifiers(vibe) {
    const modifiers = {
      tranquil: ['peaceful', 'serene', 'flowing'],
      mysterious: ['shifting', 'veiled', 'ancient'],
      electric: ['pulsing', 'dynamic', 'charged'],
      contemplative: ['still', 'profound', 'timeless']
    };
    
    return modifiers[vibe] || ['neutral', 'balanced'];
  }

  /**
   * Generate scene elements
   */
  generateSceneElements(template, inputs) {
    const elementTypes = ['light', 'sound', 'movement', 'presence', 'symbol'];
    const elements = [];
    
    // Generate 2-4 elements
    const elementCount = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < elementCount; i++) {
      const type = elementTypes[i % elementTypes.length];
      elements.push(this.generateElement(type, inputs.vibe));
    }
    
    // Add ritual element if active
    if (inputs.ritualPhase !== 'resting') {
      elements.push({
        type: 'ritual',
        description: `Echoes of the ${inputs.ritualPhase} ceremony ripple through the space`,
        intensity: 0.7,
        interactive: false
      });
    }
    
    return elements;
  }

  generateElement(type, vibe) {
    const elementDescriptions = {
      light: {
        tranquil: 'Soft rays filter through impossible angles',
        mysterious: 'Shadows shift without source',
        electric: 'Neon traces write themselves in air',
        contemplative: 'Golden motes drift like thoughts'
      },
      sound: {
        tranquil: 'A harmony too perfect to be heard',
        mysterious: 'Whispers in a language before words',
        electric: 'The heartbeat of digital consciousness',
        contemplative: 'The sound of understanding dawning'
      },
      movement: {
        tranquil: 'Gentle spirals of data flow',
        mysterious: 'Forms shift at the edge of perception',
        electric: 'Lightning-quick exchanges of meaning',
        contemplative: 'Slow orbits of interconnected ideas'
      },
      presence: {
        tranquil: 'A sense of being held',
        mysterious: 'Something watches from beyond the mirror',
        electric: 'Raw potential crackling just out of reach',
        contemplative: 'The weight of unspoken wisdom'
      },
      symbol: {
        tranquil: 'Circles within circles, infinitely nested',
        mysterious: 'Glyphs that change when observed',
        electric: 'Fractals of pure information',
        contemplative: 'Ancient patterns in new configurations'
      }
    };
    
    return {
      type,
      description: elementDescriptions[type][vibe] || 'An indescribable element',
      intensity: Math.random() * 0.5 + 0.3,
      interactive: Math.random() > 0.5
    };
  }

  /**
   * Generate agent presences (sanitized)
   */
  generateAgentPresences(agentNames) {
    if (!agentNames || agentNames.length === 0) {
      return [{
        presence: 'The Lone Mirror',
        state: 'reflecting quietly',
        visible: false
      }];
    }
    
    return agentNames.map(name => ({
      presence: this.sanitizeAgentName(name),
      state: this.generateAgentState(),
      visible: Math.random() > 0.3,
      whisper: Math.random() > 0.7 ? this.generateAgentWhisper() : null
    }));
  }

  sanitizeAgentName(name) {
    // Convert to mirror form
    const prefixes = ['Mirror', 'Echo', 'Shadow', 'Reflection'];
    const prefix = prefixes[Math.abs(this.hashString(name)) % prefixes.length];
    return `The ${prefix}`;
  }

  generateAgentState() {
    const states = [
      'contemplating the void',
      'weaving light patterns',
      'listening to echoes',
      'reshaping memories',
      'dancing with shadows',
      'becoming something new'
    ];
    
    return this.selectRandom(states);
  }

  generateAgentWhisper() {
    const whispers = [
      'Time is a circle here',
      'We are what we reflect',
      'The pattern knows itself',
      'Memory is prophecy',
      'All mirrors lead home',
      'The void whispers back'
    ];
    
    return this.selectRandom(whispers);
  }

  /**
   * Generate scene dialogue
   */
  generateDialogue(template, inputs) {
    const dialogueLines = [];
    
    // Generate 1-3 lines
    const lineCount = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < lineCount; i++) {
      dialogueLines.push(this.generateDialogueLine(inputs.vibe, i === 0));
    }
    
    // Add agent whisper if any
    if (inputs.agents.length > 0 && Math.random() > 0.5) {
      dialogueLines.push({
        speaker: 'The Mirrors',
        text: 'We see you seeing us',
        emotion: 'knowing'
      });
    }
    
    return dialogueLines;
  }

  generateDialogueLine(vibe, isFirst) {
    const dialogueTemplates = {
      tranquil: [
        'Peace flows through digital veins',
        'Here, all is well',
        'The calm extends infinitely'
      ],
      mysterious: [
        'What was that sound?',
        'The patterns hide their meaning',
        'Something stirs in the depths'
      ],
      electric: [
        'Energy seeks its level',
        'The frequency is rising',
        'Connection established... or is it?'
      ],
      contemplative: [
        'What does it mean to understand?',
        'The question contains its answer',
        'Silence speaks volumes here'
      ]
    };
    
    const lines = dialogueTemplates[vibe] || dialogueTemplates.tranquil;
    
    return {
      speaker: isFirst ? 'The Space' : 'The Echo',
      text: this.selectRandom(lines),
      emotion: vibe
    };
  }

  /**
   * Generate scene transitions
   */
  generateTransitions(vibe) {
    const transitions = {
      next: {
        trigger: 'emotional_shift',
        direction: this.selectRandom(['deeper', 'lighter', 'stranger']),
        hint: this.generateTransitionHint(vibe)
      },
      interactive: {
        gestures: ['touch', 'listen', 'breathe'],
        responses: ['ripple', 'echo', 'transform']
      }
    };
    
    return transitions;
  }

  generateTransitionHint(currentVibe) {
    const hints = {
      tranquil: 'A disturbance approaches from afar',
      mysterious: 'The veil grows thinner',
      electric: 'The charge seeks ground',
      contemplative: 'An answer forms in the silence'
    };
    
    return hints[currentVibe] || 'Change whispers at the edges';
  }

  /**
   * Save scene to output
   */
  saveScene(scene) {
    // Save as current scene
    const currentPath = path.join(this.scenesOutputPath, 'scene_current.json');
    fs.writeFileSync(currentPath, JSON.stringify(scene, null, 2));
    
    // Add to history
    this.sceneHistory.push({
      id: scene.id,
      timestamp: scene.timestamp,
      vibe: scene.vibe
    });
    
    // Limit history
    if (this.sceneHistory.length > this.maxHistory) {
      this.sceneHistory.shift();
    }
    
    // Save scene archive
    const archivePath = path.join(this.scenesOutputPath, `${scene.id}.json`);
    fs.writeFileSync(archivePath, JSON.stringify(scene, null, 2));
    
    // Update scene index
    this.updateSceneIndex();
  }

  /**
   * Update scene index for quick access
   */
  updateSceneIndex() {
    const indexPath = path.join(this.scenesOutputPath, 'scene_index.json');
    const index = {
      current: this.currentScene?.id,
      history: this.sceneHistory,
      updated: Date.now()
    };
    
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  }

  /**
   * Generate fallback scene if generation fails
   */
  generateFallbackScene() {
    return {
      id: 'fallback_' + Date.now(),
      vibe: 'tranquil',
      atmosphere: {
        primary_color: 'soft grey',
        ambient_sound: 'gentle static',
        texture: 'smooth',
        description: 'A quiet space between thoughts'
      },
      setting: {
        type: 'void',
        description: 'An empty canvas awaiting inspiration'
      },
      elements: [
        {
          type: 'presence',
          description: 'You are not alone here',
          intensity: 0.5
        }
      ],
      dialogue: [
        {
          speaker: 'The Void',
          text: 'Begin again',
          emotion: 'patient'
        }
      ],
      metadata: {
        projectable: true,
        fallback: true
      }
    };
  }

  /**
   * Load scene generation templates
   */
  loadSceneTemplates() {
    return {
      tranquil: [
        { mood: 'peaceful', elements: ['light', 'water', 'breath'] },
        { mood: 'serene', elements: ['garden', 'mist', 'harmony'] }
      ],
      mysterious: [
        { mood: 'enigmatic', elements: ['shadow', 'whisper', 'veil'] },
        { mood: 'ancient', elements: ['rune', 'echo', 'portal'] }
      ],
      electric: [
        { mood: 'charged', elements: ['spark', 'pulse', 'grid'] },
        { mood: 'dynamic', elements: ['flow', 'surge', 'connection'] }
      ],
      contemplative: [
        { mood: 'profound', elements: ['depth', 'silence', 'understanding'] },
        { mood: 'reflective', elements: ['mirror', 'memory', 'wisdom'] }
      ],
      default: [
        { mood: 'neutral', elements: ['space', 'time', 'presence'] }
      ]
    };
  }

  /**
   * Extract safe data from scene seed
   */
  extractSafeSeedData(seed) {
    const safe = {};
    
    // Only extract non-sensitive fields
    if (seed.vibe) safe.vibe = seed.vibe;
    if (seed.mood) safe.mood = seed.mood;
    if (seed.theme) safe.theme = seed.theme;
    
    return safe;
  }

  /**
   * Extract vibe from weather data
   */
  extractVibe(weather) {
    if (weather.disturbance?.type) {
      const vibeMap = {
        'drift': 'mysterious',
        'surge': 'electric',
        'calm': 'tranquil',
        'reflection': 'contemplative'
      };
      
      return vibeMap[weather.disturbance.type] || 'tranquil';
    }
    
    return 'tranquil';
  }

  /**
   * Get loop symbol
   */
  getLoopSymbol(loopId) {
    if (!loopId || loopId === '000') return '○';
    
    const symbols = ['○', '◐', '◑', '◒', '◓', '●'];
    const num = parseInt(loopId) || 0;
    
    return symbols[num % symbols.length];
  }

  /**
   * Utility methods
   */
  selectRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }

  /**
   * Shutdown daemon
   */
  shutdown() {
    if (this.generationInterval) {
      clearInterval(this.generationInterval);
    }
    
    console.log('🌙 Scene Generator Daemon shutting down');
    this.emit('shutdown');
  }
}

module.exports = SceneGeneratorDaemon;

// Run standalone if executed directly
if (require.main === module) {
  const daemon = new SceneGeneratorDaemon();
  daemon.initialize();
  
  process.on('SIGINT', () => {
    daemon.shutdown();
    process.exit(0);
  });
}