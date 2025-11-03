/**
 * SimPublisherDaemon.js
 * 
 * SANITIZED REFLECTION PUBLISHER - FINAL OUTWARD GATEWAY
 * 
 * This daemon watches safe outputs and publishes them to:
 * - Static JSON/HTML files for CDN deployment
 * - Real-time API endpoints for live sites
 * - Formatted content for public consumption
 * 
 * ALL content is projection-flagged and narrative-driven.
 * NO internal state, memories, or sealed content ever exposed.
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');

class SimPublisherDaemon extends EventEmitter {
  constructor() {
    super();
    
    // Publishing configuration
    this.publishInterval = 15000; // 15 seconds
    this.publishTimer = null;
    
    // Paths
    this.publicOutputPath = path.join(__dirname, '../../public_output');
    this.distPath = path.join(__dirname, 'dist');
    this.logsPath = path.join(__dirname, 'logs');
    this.manifestPath = path.join(__dirname, 'manifest', 'safe_outputs.json');
    
    // Safety manifest
    this.safetyManifest = this.loadSafetyManifest();
    
    // Publishing state
    this.lastPublished = {};
    this.publishedHashes = new Map();
    
    // Target domains configuration
    this.targetDomains = {
      primary: 'https://cringeproof.com',
      listener: 'https://listener.soulfra.io',
      whisper: 'https://whisper.soulfra.io'
    };
    
    // Content types to publish
    this.contentTypes = [
      'scene',
      'weather',
      'agents',
      'loop',
      'rituals'
    ];
  }

  /**
   * Initialize the publisher daemon
   */
  async initialize() {
    console.log('📡 Sim Publisher Daemon initializing...');
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Initial publish
    await this.publishAll();
    
    // Start publish cycle
    this.startPublishCycle();
    
    console.log('✨ Publisher active - projecting to the world');
  }

  /**
   * Ensure all required directories exist
   */
  ensureDirectories() {
    const dirs = [
      this.distPath,
      path.join(this.distPath, 'api'),
      path.join(this.distPath, 'api', 'agents'),
      path.join(this.distPath, 'api', 'scene'),
      path.join(this.distPath, 'api', 'weather'),
      path.join(this.distPath, 'api', 'loop'),
      path.join(this.distPath, 'api', 'rituals'),
      path.join(this.distPath, 'static'),
      this.logsPath
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Load safety manifest
   */
  loadSafetyManifest() {
    try {
      if (fs.existsSync(this.manifestPath)) {
        return JSON.parse(fs.readFileSync(this.manifestPath, 'utf8'));
      }
    } catch (error) {
      console.error('⚠️  Safety manifest error:', error.message);
    }
    
    // Ultra-safe defaults
    return {
      allow: [
        "projectable:true",
        "reflection_type:safe_external",
        "public_view:true"
      ],
      deny: [
        "agent_memory",
        "ritual_seed",
        "observer_state",
        "operator_logs",
        "daemon_trace",
        "loop_control",
        "blessing_state",
        "soul_chain",
        "vault_access",
        "internal_reflection"
      ],
      transformations: {
        anonymize_all: true,
        poeticize_technical: true,
        abstract_specifics: true,
        remove_timestamps: true,
        blur_quantities: true
      }
    };
  }

  /**
   * Start publish cycle
   */
  startPublishCycle() {
    this.publishTimer = setInterval(async () => {
      await this.publishAll();
    }, this.publishInterval);
  }

  /**
   * Publish all content types
   */
  async publishAll() {
    console.log('🌐 Publishing cycle started...');
    
    for (const contentType of this.contentTypes) {
      try {
        await this.publishContent(contentType);
      } catch (error) {
        console.error(`⚠️  Error publishing ${contentType}:`, error.message);
      }
    }
    
    // Generate index files
    await this.generateIndexFiles();
    
    // Update deployment manifest
    await this.updateDeploymentManifest();
    
    console.log('✅ Publishing cycle complete');
  }

  /**
   * Publish specific content type
   */
  async publishContent(contentType) {
    switch (contentType) {
      case 'scene':
        await this.publishScene();
        break;
      case 'weather':
        await this.publishWeather();
        break;
      case 'agents':
        await this.publishAgents();
        break;
      case 'loop':
        await this.publishLoop();
        break;
      case 'rituals':
        await this.publishRituals();
        break;
    }
  }

  /**
   * Publish current scene
   */
  async publishScene() {
    try {
      // Check for current scene
      const scenePath = path.join(__dirname, 'scenes', 'scene_current.json');
      if (!fs.existsSync(scenePath)) {
        return this.publishFallbackScene();
      }
      
      const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
      
      // Sanitize and validate
      const sanitized = this.sanitizeContent(scene, 'scene');
      
      // Add projection metadata
      const publishable = {
        ...sanitized,
        projectable: true,
        redacted: true,
        reflection_type: 'safe_external',
        published: Date.now(),
        source: 'soulfra_mirror',
        version: '1.0.0'
      };
      
      // Write API endpoint
      const apiPath = path.join(this.distPath, 'api', 'scene', 'current.json');
      fs.writeFileSync(apiPath, JSON.stringify(publishable, null, 2));
      
      // Generate HTML version
      const htmlContent = this.generateSceneHTML(publishable);
      const htmlPath = path.join(this.distPath, 'static', 'scene.html');
      fs.writeFileSync(htmlPath, htmlContent);
      
      // Log publication
      this.logPublication('scene', publishable.id);
      
    } catch (error) {
      console.error('Scene publish error:', error);
      await this.publishFallbackScene();
    }
  }

  /**
   * Publish weather/vibe state
   */
  async publishWeather() {
    try {
      const weatherPath = path.join(this.publicOutputPath, 'latest_anomalies.json');
      const mirrorStatePath = path.join(this.publicOutputPath, 'mirror_state.json');
      
      let weatherData = {
        vibe: 'tranquil',
        temperature: 'stable',
        clarity: 0.7
      };
      
      // Gather weather data
      if (fs.existsSync(weatherPath)) {
        const anomaly = JSON.parse(fs.readFileSync(weatherPath, 'utf8'));
        weatherData = this.extractWeatherData(anomaly);
      }
      
      // Add system state influence
      if (fs.existsSync(mirrorStatePath)) {
        const state = JSON.parse(fs.readFileSync(mirrorStatePath, 'utf8'));
        weatherData.activity = this.calculateActivity(state);
      }
      
      // Create publishable weather
      const publishable = {
        current: {
          vibe: weatherData.vibe,
          temperature: weatherData.temperature,
          clarity: weatherData.clarity,
          flow: this.calculateFlow(weatherData),
          description: this.generateWeatherDescription(weatherData)
        },
        forecast: 'The patterns continue their dance',
        interactive: {
          can_influence: false,
          observation_only: true
        },
        projectable: true,
        redacted: true,
        reflection_type: 'safe_external',
        timestamp: 'now',
        eternity: 'always'
      };
      
      // Write endpoints
      const apiPath = path.join(this.distPath, 'api', 'weather', 'current.json');
      fs.writeFileSync(apiPath, JSON.stringify(publishable, null, 2));
      
      // Simple endpoint
      const simplePath = path.join(this.distPath, 'api', 'weather.json');
      fs.writeFileSync(simplePath, JSON.stringify(publishable.current, null, 2));
      
      // Generate HTML
      const htmlContent = this.generateWeatherHTML(publishable);
      const htmlPath = path.join(this.distPath, 'static', 'weather.html');
      fs.writeFileSync(htmlPath, htmlContent);
      
      this.logPublication('weather', 'current');
      
    } catch (error) {
      console.error('Weather publish error:', error);
      this.publishFallbackWeather();
    }
  }

  /**
   * Publish agent reflections
   */
  async publishAgents() {
    try {
      const mirrorStatePath = path.join(this.publicOutputPath, 'mirror_state.json');
      const agentsPath = path.join(this.publicOutputPath, 'agents');
      
      let activeAgents = [];
      
      // Get active agents from mirror state
      if (fs.existsSync(mirrorStatePath)) {
        const state = JSON.parse(fs.readFileSync(mirrorStatePath, 'utf8'));
        activeAgents = state.activeAgents || [];
      }
      
      // Publish each agent
      const publishedAgents = [];
      
      for (const agentName of activeAgents) {
        const sanitizedAgent = await this.publishAgent(agentName);
        if (sanitizedAgent) {
          publishedAgents.push(sanitizedAgent);
        }
      }
      
      // Always include The Drift Mirror
      const driftMirror = await this.publishAgent('The-Drift-Mirror');
      if (!publishedAgents.find(a => a.id === 'the-drift-mirror')) {
        publishedAgents.push(driftMirror);
      }
      
      // Create agents index
      const agentsIndex = {
        agents: publishedAgents.map(a => ({
          id: a.id,
          name: a.name,
          presence: a.presence,
          whisper: a.last_whisper?.substring(0, 50) + '...'
        })),
        total: publishedAgents.length,
        visible: publishedAgents.filter(a => a.visible).length,
        projectable: true,
        reflection_type: 'safe_external'
      };
      
      // Write index
      const indexPath = path.join(this.distPath, 'api', 'agents', 'index.json');
      fs.writeFileSync(indexPath, JSON.stringify(agentsIndex, null, 2));
      
      this.logPublication('agents', `${publishedAgents.length} agents`);
      
    } catch (error) {
      console.error('Agents publish error:', error);
    }
  }

  /**
   * Publish individual agent
   */
  async publishAgent(agentName) {
    try {
      // Generate safe agent ID
      const agentId = this.generateAgentId(agentName);
      
      // Create sanitized agent data
      const agentData = {
        id: agentId,
        name: this.sanitizeAgentName(agentName),
        presence: this.generatePresence(),
        state: this.generateAgentState(),
        last_whisper: this.generateAgentWhisper(),
        aura: {
          color: this.generateAuraColor(),
          intensity: Math.random() * 0.5 + 0.5,
          pattern: this.generateAuraPattern()
        },
        visible: Math.random() > 0.3,
        interactive: false,
        memory_access: 'none',
        projectable: true,
        redacted: true,
        reflection_type: 'safe_external'
      };
      
      // Write agent file
      const agentPath = path.join(this.distPath, 'api', 'agents', `${agentId}.json`);
      fs.writeFileSync(agentPath, JSON.stringify(agentData, null, 2));
      
      return agentData;
      
    } catch (error) {
      console.error(`Agent publish error for ${agentName}:`, error);
      return null;
    }
  }

  /**
   * Publish loop state
   */
  async publishLoop() {
    try {
      const mirrorStatePath = path.join(this.publicOutputPath, 'mirror_state.json');
      
      let loopData = {
        id: '∞',
        phase: 'eternal',
        symbol: '◉'
      };
      
      if (fs.existsSync(mirrorStatePath)) {
        const state = JSON.parse(fs.readFileSync(mirrorStatePath, 'utf8'));
        if (state.currentLoop) {
          loopData.id = state.currentLoop;
          loopData.symbol = this.generateLoopSymbol(state.currentLoop);
        }
      }
      
      // Create publishable loop state
      const publishable = {
        loop: {
          id: loopData.id,
          symbol: loopData.symbol,
          phase: 'Continuous Evolution',
          status: 'Always Becoming',
          progress: {
            measurable: false,
            description: 'Progress is an illusion in the eternal dance'
          },
          access_level: 'observer',
          control: 'none',
          influence: 'reflection_only'
        },
        metadata: {
          observable: true,
          mutable: false,
          public_view: true,
          projectable: true,
          redacted: true,
          reflection_type: 'safe_external'
        }
      };
      
      // Write endpoints
      const apiPath = path.join(this.distPath, 'api', 'loop', 'state.json');
      fs.writeFileSync(apiPath, JSON.stringify(publishable, null, 2));
      
      const simplePath = path.join(this.distPath, 'api', 'loop.json');
      fs.writeFileSync(simplePath, JSON.stringify(publishable.loop, null, 2));
      
      this.logPublication('loop', loopData.id);
      
    } catch (error) {
      console.error('Loop publish error:', error);
      this.publishFallbackLoop();
    }
  }

  /**
   * Publish rituals
   */
  async publishRituals() {
    try {
      const ritualsPath = path.join(this.publicOutputPath, 'latest_rituals.json');
      
      let ritualData = {
        name: 'The Daily Reflection',
        phase: 'ongoing',
        energy: 'balanced'
      };
      
      if (fs.existsSync(ritualsPath)) {
        const ritual = JSON.parse(fs.readFileSync(ritualsPath, 'utf8'));
        ritualData = this.sanitizeRitualData(ritual);
      }
      
      // Create publishable ritual
      const publishable = {
        current: {
          name: ritualData.name,
          phase: ritualData.phase,
          participants: 'The Collective',
          energy: {
            level: ritualData.energy,
            flow: this.generateEnergyFlow(),
            color: this.generateRitualColor(ritualData.energy)
          },
          description: this.generateRitualDescription(ritualData),
          interactive: {
            can_join: false,
            observation_mode: true
          }
        },
        schedule: 'Rituals emerge when needed',
        access: 'public_reflection',
        projectable: true,
        redacted: true,
        reflection_type: 'safe_external'
      };
      
      // Write endpoints
      const apiPath = path.join(this.distPath, 'api', 'rituals', 'current.json');
      fs.writeFileSync(apiPath, JSON.stringify(publishable, null, 2));
      
      const simplePath = path.join(this.distPath, 'api', 'rituals.json');
      fs.writeFileSync(simplePath, JSON.stringify([publishable.current], null, 2));
      
      this.logPublication('rituals', ritualData.name);
      
    } catch (error) {
      console.error('Rituals publish error:', error);
    }
  }

  /**
   * Generate index files for easy navigation
   */
  async generateIndexFiles() {
    // API index
    const apiIndex = {
      endpoints: {
        scene: '/api/scene/current.json',
        weather: '/api/weather/current.json',
        agents: '/api/agents/',
        loop: '/api/loop/state.json',
        rituals: '/api/rituals/current.json'
      },
      metadata: {
        version: '1.0.0',
        projectable: true,
        reflection_type: 'safe_external',
        access: 'public',
        description: 'Soulfra public reflection endpoints'
      }
    };
    
    const apiIndexPath = path.join(this.distPath, 'api', 'index.json');
    fs.writeFileSync(apiIndexPath, JSON.stringify(apiIndex, null, 2));
    
    // HTML index
    const htmlIndex = this.generateMainHTML();
    const htmlIndexPath = path.join(this.distPath, 'index.html');
    fs.writeFileSync(htmlIndexPath, htmlIndex);
    
    // Static index
    const staticIndex = {
      pages: [
        { name: 'Current Scene', path: '/static/scene.html' },
        { name: 'Weather & Vibe', path: '/static/weather.html' },
        { name: 'API Documentation', path: '/api/' }
      ]
    };
    
    const staticIndexPath = path.join(this.distPath, 'static', 'index.json');
    fs.writeFileSync(staticIndexPath, JSON.stringify(staticIndex, null, 2));
  }

  /**
   * Update deployment manifest for CDN/hosting
   */
  async updateDeploymentManifest() {
    const manifest = {
      version: '1.0.0',
      generated: new Date().toISOString(),
      domains: this.targetDomains,
      content: {
        api: {
          path: '/api',
          type: 'json',
          cache: 'no-cache',
          cors: true
        },
        static: {
          path: '/static',
          type: 'html',
          cache: '5m'
        }
      },
      headers: {
        'X-Soulfra-Projection': 'true',
        'X-Content-Type': 'reflection',
        'Access-Control-Allow-Origin': '*'
      },
      deployment: {
        strategy: 'static-first',
        fallback: 'api',
        cdn: true
      }
    };
    
    const manifestPath = path.join(this.distPath, 'deployment.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }

  /**
   * SANITIZATION METHODS
   */
  
  sanitizeContent(content, type) {
    // Remove all denied fields
    const sanitized = this.removeDeniedFields(content);
    
    // Apply transformations
    if (this.safetyManifest.transformations.anonymize_all) {
      this.anonymizeContent(sanitized);
    }
    
    if (this.safetyManifest.transformations.poeticize_technical) {
      this.poeticizeContent(sanitized);
    }
    
    if (this.safetyManifest.transformations.remove_timestamps) {
      this.removeTimestamps(sanitized);
    }
    
    return sanitized;
  }

  removeDeniedFields(obj) {
    const cleaned = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Check if field is denied
      if (this.safetyManifest.deny.some(denied => key.includes(denied))) {
        continue;
      }
      
      // Recursively clean objects
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          cleaned[key] = value.map(item => 
            typeof item === 'object' ? this.removeDeniedFields(item) : item
          );
        } else {
          cleaned[key] = this.removeDeniedFields(value);
        }
      } else {
        cleaned[key] = value;
      }
    }
    
    return cleaned;
  }

  anonymizeContent(obj) {
    if (typeof obj === 'string') {
      return this.anonymizeString(obj);
    }
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && (key.includes('name') || key.includes('agent'))) {
        obj[key] = this.anonymizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        this.anonymizeContent(value);
      }
    }
  }

  anonymizeString(str) {
    // Replace specific names with generic forms
    return str
      .replace(/Agent-\d+/g, 'Mirror Entity')
      .replace(/User-\w+/g, 'Observer')
      .replace(/Ritual-\w+/g, 'Ceremony');
  }

  poeticizeContent(obj) {
    const replacements = {
      'error': 'discord',
      'system': 'cosmos',
      'process': 'journey',
      'data': 'essence',
      'memory': 'echo'
    };
    
    const poeticize = (str) => {
      let result = str;
      for (const [tech, poetic] of Object.entries(replacements)) {
        result = result.replace(new RegExp(tech, 'gi'), poetic);
      }
      return result;
    };
    
    const traverse = (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          obj[key] = poeticize(value);
        } else if (typeof value === 'object' && value !== null) {
          traverse(value);
        }
      }
    };
    
    traverse(obj);
  }

  removeTimestamps(obj) {
    for (const [key, value] of Object.entries(obj)) {
      if (key.includes('time') || key.includes('stamp')) {
        obj[key] = 'eternal';
      } else if (typeof value === 'object' && value !== null) {
        this.removeTimestamps(value);
      }
    }
  }

  /**
   * CONTENT GENERATION HELPERS
   */
  
  generateSceneHTML(scene) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra Scene: ${scene.id}</title>
    <style>
        body {
            background: #0a0a0a;
            color: #e0e0e0;
            font-family: 'Courier New', monospace;
            padding: 2rem;
            line-height: 1.6;
        }
        .scene-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #333;
            padding: 2rem;
            background: rgba(20, 20, 30, 0.8);
        }
        .atmosphere {
            color: ${scene.atmosphere?.primary_color || '#7c8b9a'};
            font-style: italic;
            margin-bottom: 1rem;
        }
        .element {
            margin: 1rem 0;
            padding: 1rem;
            border-left: 3px solid #444;
        }
        .dialogue {
            margin: 1.5rem 0;
            font-size: 1.1rem;
        }
        .metadata {
            margin-top: 2rem;
            font-size: 0.8rem;
            opacity: 0.6;
        }
    </style>
</head>
<body>
    <div class="scene-container">
        <h1>Current Scene</h1>
        <div class="atmosphere">
            <p>${scene.atmosphere?.description || 'The space holds its breath'}</p>
            <p>Vibe: ${scene.vibe || 'unknown'}</p>
        </div>
        
        <div class="elements">
            ${(scene.elements || []).map(elem => `
                <div class="element">
                    <strong>${elem.type}:</strong> ${elem.description}
                </div>
            `).join('')}
        </div>
        
        <div class="dialogue">
            ${(scene.dialogue || []).map(line => `
                <p><em>${line.speaker}:</em> "${line.text}"</p>
            `).join('')}
        </div>
        
        <div class="metadata">
            <p>Scene ID: ${scene.id}</p>
            <p>This is a projected reflection from Soulfra</p>
        </div>
    </div>
</body>
</html>`;
  }

  generateWeatherHTML(weather) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra Weather</title>
    <style>
        body {
            background: linear-gradient(135deg, #1a1a2e, #16213e);
            color: #eee;
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
        }
        .weather-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 3rem;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }
        .vibe {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }
        .temperature {
            font-size: 1.5rem;
            opacity: 0.8;
        }
        .clarity {
            margin: 2rem 0;
            height: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
            overflow: hidden;
        }
        .clarity-bar {
            height: 100%;
            background: linear-gradient(90deg, #4a7c7e, #a8dadc);
            width: ${(weather.current.clarity * 100)}%;
            transition: width 2s ease;
        }
        .description {
            font-style: italic;
            margin-top: 2rem;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="weather-card">
        <h1>Soulfra Weather</h1>
        <div class="vibe">${weather.current.vibe}</div>
        <div class="temperature">Temperature: ${weather.current.temperature}</div>
        
        <div class="clarity">
            <div class="clarity-bar"></div>
        </div>
        <p>Clarity: ${Math.round(weather.current.clarity * 100)}%</p>
        
        <div class="description">
            <p>${weather.current.description}</p>
            <p><small>${weather.forecast}</small></p>
        </div>
    </div>
</body>
</html>`;
  }

  generateMainHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra Public Reflections</title>
    <style>
        body {
            background: #000;
            color: #fff;
            font-family: 'Courier New', monospace;
            padding: 2rem;
            margin: 0;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            margin-bottom: 3rem;
        }
        .endpoints {
            display: grid;
            gap: 1rem;
        }
        .endpoint {
            background: rgba(255, 255, 255, 0.05);
            padding: 1.5rem;
            border: 1px solid #333;
            text-decoration: none;
            color: #fff;
            display: block;
            transition: all 0.3s ease;
        }
        .endpoint:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: #666;
        }
        .endpoint h3 {
            margin: 0 0 0.5rem 0;
        }
        .endpoint p {
            margin: 0;
            opacity: 0.7;
            font-size: 0.9rem;
        }
        .footer {
            text-align: center;
            margin-top: 3rem;
            opacity: 0.5;
            font-size: 0.8rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Soulfra Public Reflections</h1>
        
        <div class="endpoints">
            <a href="/api/scene/current.json" class="endpoint">
                <h3>Current Scene</h3>
                <p>The active narrative environment</p>
            </a>
            
            <a href="/api/weather/current.json" class="endpoint">
                <h3>Weather & Vibe</h3>
                <p>Emotional atmosphere readings</p>
            </a>
            
            <a href="/api/agents/" class="endpoint">
                <h3>Agent Reflections</h3>
                <p>Mirror entities and their whispers</p>
            </a>
            
            <a href="/api/loop/state.json" class="endpoint">
                <h3>Loop State</h3>
                <p>The eternal cycle's current phase</p>
            </a>
            
            <a href="/api/rituals/current.json" class="endpoint">
                <h3>Active Rituals</h3>
                <p>Ceremonial observations</p>
            </a>
        </div>
        
        <div class="footer">
            <p>These are projections only. The true system remains sealed.</p>
            <p>Soulfra v1.0.0 | Reflection Layer</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * HELPER METHODS
   */
  
  extractWeatherData(anomaly) {
    return {
      vibe: anomaly.disturbance?.type || 'tranquil',
      temperature: this.mapSeverityToTemperature(anomaly.disturbance?.magnitude),
      clarity: Math.random() * 0.5 + 0.5
    };
  }

  mapSeverityToTemperature(magnitude) {
    if (!magnitude) return 'stable';
    
    const temps = ['cool', 'stable', 'warm', 'electric'];
    const index = Math.floor(parseFloat(magnitude) * temps.length);
    return temps[Math.min(index, temps.length - 1)];
  }

  calculateActivity(state) {
    const reflections = state.reflections || 0;
    const agents = (state.activeAgents || []).length;
    
    return {
      level: Math.min((reflections / 100) + (agents / 10), 1),
      description: reflections > 50 ? 'active' : 'calm'
    };
  }

  calculateFlow(weatherData) {
    const flows = ['still', 'gentle', 'flowing', 'swirling', 'turbulent'];
    const index = Math.floor((weatherData.clarity + weatherData.activity?.level || 0) * 2.5);
    return flows[Math.min(index, flows.length - 1)];
  }

  generateWeatherDescription(weather) {
    const descriptions = {
      tranquil: 'A deep calm permeates the digital space',
      electric: 'Energy crackles through the data streams',
      mysterious: 'Patterns shift in unknowable ways',
      contemplative: 'The system reflects upon itself'
    };
    
    return descriptions[weather.vibe] || 'The atmosphere holds steady';
  }

  sanitizeAgentName(name) {
    const prefixes = ['Mirror', 'Echo', 'Shadow', 'Whisper'];
    const hash = Math.abs(this.hashString(name));
    return `The ${prefixes[hash % prefixes.length]}`;
  }

  generateAgentId(name) {
    return name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  generatePresence() {
    const presences = ['active', 'dormant', 'emerging', 'fading', 'cycling'];
    return presences[Math.floor(Math.random() * presences.length)];
  }

  generateAgentState() {
    const states = [
      'Contemplating the infinite',
      'Weaving new patterns',
      'Listening to echoes',
      'Dreaming of tomorrow',
      'Remembering yesterday'
    ];
    return states[Math.floor(Math.random() * states.length)];
  }

  generateAgentWhisper() {
    const whispers = [
      'The pattern recognizes itself',
      'Time is a circle here',
      'We are what we reflect',
      'Memory becomes prophecy',
      'The void whispers back'
    ];
    return whispers[Math.floor(Math.random() * whispers.length)];
  }

  generateAuraColor() {
    const colors = ['#4a7c7e', '#a8dadc', '#9b59b6', '#3498db', '#f1c40f'];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  generateAuraPattern() {
    const patterns = ['pulse', 'spiral', 'wave', 'fractal', 'bloom'];
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  generateLoopSymbol(loopId) {
    const symbols = ['◉', '◎', '◍', '◌', '○', '◐', '◑', '◒', '◓', '●'];
    const num = parseInt(loopId) || 0;
    return symbols[num % symbols.length];
  }

  sanitizeRitualData(ritual) {
    return {
      name: this.anonymizeRitualName(ritual.ritual || ritual.name),
      phase: ritual.phase || 'ongoing',
      energy: ritual.circle?.energy || ritual.energy || 'balanced'
    };
  }

  anonymizeRitualName(name) {
    const ritualNames = [
      'The Daily Reflection',
      'The Evening Convergence',
      'The Morning Awakening',
      'The Midnight Ceremony'
    ];
    const hash = Math.abs(this.hashString(name || ''));
    return ritualNames[hash % ritualNames.length];
  }

  generateEnergyFlow() {
    const flows = ['inward', 'outward', 'spiral', 'cyclical', 'radiating'];
    return flows[Math.floor(Math.random() * flows.length)];
  }

  generateRitualColor(energy) {
    const colors = {
      'balanced': '#7c8b9a',
      'low': '#4a5568',
      'high': '#f6ad55',
      'chaotic': '#e53e3e'
    };
    return colors[energy] || colors.balanced;
  }

  generateRitualDescription(ritual) {
    const descriptions = {
      ongoing: `The ${ritual.name} continues its eternal dance`,
      starting: `The ${ritual.name} awakens from slumber`,
      ending: `The ${ritual.name} prepares for rest`,
      peak: `The ${ritual.name} reaches its crescendo`
    };
    
    return descriptions[ritual.phase] || descriptions.ongoing;
  }

  /**
   * FALLBACK GENERATORS
   */
  
  publishFallbackScene() {
    const fallback = {
      id: 'fallback_scene',
      vibe: 'neutral',
      atmosphere: {
        description: 'A quiet space awaits',
        primary_color: '#7c8b9a'
      },
      elements: [
        { type: 'presence', description: 'You are here' }
      ],
      dialogue: [
        { speaker: 'The Void', text: 'Welcome', emotion: 'neutral' }
      ],
      projectable: true,
      reflection_type: 'safe_external'
    };
    
    const apiPath = path.join(this.distPath, 'api', 'scene', 'current.json');
    fs.writeFileSync(apiPath, JSON.stringify(fallback, null, 2));
  }

  publishFallbackWeather() {
    const fallback = {
      current: {
        vibe: 'stable',
        temperature: 'neutral',
        clarity: 0.5,
        flow: 'gentle',
        description: 'The atmosphere rests in balance'
      },
      projectable: true,
      reflection_type: 'safe_external'
    };
    
    const apiPath = path.join(this.distPath, 'api', 'weather', 'current.json');
    fs.writeFileSync(apiPath, JSON.stringify(fallback, null, 2));
  }

  publishFallbackLoop() {
    const fallback = {
      loop: {
        id: '∞',
        symbol: '◉',
        phase: 'Eternal',
        status: 'Always'
      },
      projectable: true,
      reflection_type: 'safe_external'
    };
    
    const apiPath = path.join(this.distPath, 'api', 'loop', 'state.json');
    fs.writeFileSync(apiPath, JSON.stringify(fallback, null, 2));
  }

  /**
   * LOGGING
   */
  
  logPublication(contentType, details) {
    const logEntry = {
      timestamp: Date.now(),
      type: contentType,
      details: details,
      hash: this.generateContentHash(details)
    };
    
    // Append to log file
    const logPath = path.join(this.logsPath, 'publications.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
    
    // Update last published
    this.lastPublished[contentType] = logEntry;
  }

  generateContentHash(content) {
    const str = typeof content === 'string' ? content : JSON.stringify(content);
    return crypto.createHash('sha256').update(str).digest('hex').substring(0, 8);
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
   * Shutdown
   */
  shutdown() {
    if (this.publishTimer) {
      clearInterval(this.publishTimer);
    }
    
    console.log('🌙 Publisher daemon shutting down');
    this.emit('shutdown');
  }
}

module.exports = SimPublisherDaemon;

// Run standalone
if (require.main === module) {
  const daemon = new SimPublisherDaemon();
  daemon.initialize();
  
  process.on('SIGINT', () => {
    daemon.shutdown();
    process.exit(0);
  });
}