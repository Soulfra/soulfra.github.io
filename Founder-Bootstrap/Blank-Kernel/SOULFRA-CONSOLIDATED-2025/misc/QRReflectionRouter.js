/**
 * QRReflectionRouter.js
 * 
 * THE SEMANTIC PORTAL - QR AS EMOTIONAL EVENT
 * 
 * This router handles QR scans as structured emotional events,
 * not URLs. It bridges the sealed runtime with public projection
 * through symbolic reformatting.
 * 
 * QR codes become language bridges between two worlds.
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const PublicReflectionFormatter = require('../PublicReflectionFormatter');

class QRReflectionRouter extends EventEmitter {
  constructor() {
    super();
    
    // Core paths - maintaining separation
    this.ledgerPath = path.join(__dirname, '../../soulfra-ledger');
    this.publicOutputPath = path.join(__dirname, '../../public_output');
    this.qrOutputPath = path.join(__dirname, 'public_output/qr_reflections');
    
    // Formatters and processors
    this.formatter = new PublicReflectionFormatter();
    this.qrFormatterDaemon = null; // Will be injected
    
    // QR code registry
    this.activeQRCodes = new Map();
    this.qrLifetime = 3600000; // 1 hour active window
    
    // Semantic event types
    this.eventTypes = {
      AGENT_WHISPER: 'agent_whisper',
      RITUAL_ECHO: 'ritual_echo',
      VIBE_PULSE: 'vibe_pulse',
      LOOP_GLIMPSE: 'loop_glimpse',
      SCENE_PORTAL: 'scene_portal'
    };
    
    // Ensure output directories
    this.ensureDirectories();
  }

  /**
   * Initialize the QR reflection router
   */
  initialize(qrFormatterDaemon) {
    this.qrFormatterDaemon = qrFormatterDaemon;
    console.log('🔮 QR Reflection Router initialized');
    console.log('📿 Semantic portals ready for activation');
  }

  ensureDirectories() {
    const dirs = [
      this.qrOutputPath,
      path.join(this.qrOutputPath, 'active'),
      path.join(this.qrOutputPath, 'archived')
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Generate a new QR semantic event
   * This creates a bridge point between internal and external
   */
  async generateQREvent(sourceType, sourceData, metadata = {}) {
    try {
      // Generate unique QR code
      const qrCode = this.generateQRCode(sourceType, sourceData);
      
      // Extract safe reflection data from ledger
      const internalData = await this.extractInternalReflection(sourceType, sourceData);
      
      if (!internalData) {
        throw new Error('No internal reflection available');
      }
      
      // Transform through formatter daemon
      const publicProjection = await this.qrFormatterDaemon.transformToPublic(
        internalData,
        sourceType,
        metadata.tone || 'neutral'
      );
      
      // Create QR event structure
      const qrEvent = {
        code: qrCode,
        type: sourceType,
        created: Date.now(),
        expires: Date.now() + this.qrLifetime,
        internal: {
          // Never expose these directly
          source: 'sealed',
          depth: internalData.depth || 'surface'
        },
        projection: publicProjection,
        metadata: {
          ...metadata,
          semantic_type: this.classifySemanticType(sourceType),
          invitation: this.generateInvitation(sourceType)
        },
        interactions: []
      };
      
      // Register active QR
      this.activeQRCodes.set(qrCode, qrEvent);
      
      // Save projection files
      await this.saveQRProjection(qrEvent);
      
      // Emit event
      this.emit('qr:generated', {
        code: qrCode,
        type: sourceType,
        url: this.generateQRURL(qrCode)
      });
      
      return qrEvent;
      
    } catch (error) {
      console.error('QR generation error:', error);
      throw error;
    }
  }

  /**
   * Handle QR code scan/access
   */
  async handleQRScan(qrCode, scanMetadata = {}) {
    // Check if QR is active
    const qrEvent = this.activeQRCodes.get(qrCode);
    
    if (!qrEvent) {
      return this.handleExpiredQR(qrCode);
    }
    
    // Check expiration
    if (Date.now() > qrEvent.expires) {
      this.activeQRCodes.delete(qrCode);
      return this.handleExpiredQR(qrCode);
    }
    
    // Log interaction
    const interaction = {
      timestamp: Date.now(),
      source: scanMetadata.source || 'unknown',
      ip: scanMetadata.ip || 'unknown',
      userAgent: scanMetadata.userAgent || 'unknown'
    };
    
    qrEvent.interactions.push(interaction);
    
    // Generate view data
    const viewData = await this.generateQRView(qrEvent, scanMetadata);
    
    // Update projection files
    await this.updateQRProjection(qrEvent);
    
    // Emit scan event
    this.emit('qr:scanned', {
      code: qrCode,
      type: qrEvent.type,
      interaction
    });
    
    return viewData;
  }

  /**
   * Extract internal reflection data (SAFE ONLY)
   */
  async extractInternalReflection(sourceType, sourceData) {
    try {
      let reflection = null;
      
      switch (sourceType) {
        case this.eventTypes.AGENT_WHISPER:
          reflection = await this.extractAgentReflection(sourceData);
          break;
          
        case this.eventTypes.RITUAL_ECHO:
          reflection = await this.extractRitualReflection(sourceData);
          break;
          
        case this.eventTypes.VIBE_PULSE:
          reflection = await this.extractVibeReflection(sourceData);
          break;
          
        case this.eventTypes.LOOP_GLIMPSE:
          reflection = await this.extractLoopReflection(sourceData);
          break;
          
        case this.eventTypes.SCENE_PORTAL:
          reflection = await this.extractSceneReflection(sourceData);
          break;
          
        default:
          reflection = this.extractGenericReflection(sourceData);
      }
      
      // Apply safety filters
      return this.sanitizeReflection(reflection);
      
    } catch (error) {
      console.error('Reflection extraction error:', error);
      return null;
    }
  }

  async extractAgentReflection(agentId) {
    // Read from public output only
    const agentPath = path.join(this.publicOutputPath, 'agents', 'latest_events.json');
    
    if (!fs.existsSync(agentPath)) {
      return {
        type: 'agent',
        essence: 'The mirror sleeps',
        whisper: 'Silent presence',
        depth: 'surface'
      };
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(agentPath, 'utf8'));
      
      return {
        type: 'agent',
        agent: data.agent || 'Unknown Mirror',
        essence: data.last_whisper || 'Wordless understanding',
        mood: data.status || 'Drifting',
        aura: data.aura || 50,
        depth: 'reflection'
      };
    } catch (error) {
      return {
        type: 'agent',
        essence: 'The mirror clouds',
        depth: 'surface'
      };
    }
  }

  async extractRitualReflection(ritualId) {
    const ritualPath = path.join(this.publicOutputPath, 'rituals', 'latest_rituals.json');
    
    if (!fs.existsSync(ritualPath)) {
      return {
        type: 'ritual',
        name: 'The Unnamed Ceremony',
        phase: 'eternal',
        depth: 'surface'
      };
    }
    
    try {
      const data = JSON.parse(fs.readFileSync(ritualPath, 'utf8'));
      
      return {
        type: 'ritual',
        name: data.ritual || 'Sacred Pattern',
        phase: data.phase || 'ongoing',
        energy: data.circle?.energy || 'balanced',
        geometry: data.circle?.geometry || 'spiral',
        echoes: (data.echoes || []).slice(0, 3),
        depth: 'ceremonial'
      };
    } catch (error) {
      return {
        type: 'ritual',
        name: 'Emergency Ritual',
        phase: 'improvised',
        depth: 'surface'
      };
    }
  }

  async extractVibeReflection(vibeId) {
    const weatherPath = path.join(this.publicOutputPath, 'latest_anomalies.json');
    const mirrorPath = path.join(this.publicOutputPath, 'mirror_state.json');
    
    let vibeData = {
      type: 'vibe',
      current: 'tranquil',
      temperature: 'stable',
      resonance: 0.5
    };
    
    try {
      if (fs.existsSync(weatherPath)) {
        const weather = JSON.parse(fs.readFileSync(weatherPath, 'utf8'));
        vibeData.current = weather.disturbance?.type || 'calm';
        vibeData.pattern = weather.pattern || 'flowing';
      }
      
      if (fs.existsSync(mirrorPath)) {
        const mirror = JSON.parse(fs.readFileSync(mirrorPath, 'utf8'));
        vibeData.reflections = mirror.reflections || 0;
        vibeData.activeAgents = (mirror.activeAgents || []).length;
      }
      
      vibeData.depth = 'atmospheric';
      return vibeData;
      
    } catch (error) {
      return vibeData;
    }
  }

  async extractLoopReflection(loopId) {
    const mirrorPath = path.join(this.publicOutputPath, 'mirror_state.json');
    
    let loopData = {
      type: 'loop',
      id: '∞',
      phase: 'eternal',
      symbol: '◉'
    };
    
    try {
      if (fs.existsSync(mirrorPath)) {
        const mirror = JSON.parse(fs.readFileSync(mirrorPath, 'utf8'));
        loopData.id = mirror.currentLoop || '∞';
        loopData.symbol = this.generateLoopSymbol(loopData.id);
        loopData.reflections = mirror.reflections || 0;
      }
      
      loopData.depth = 'cyclical';
      return loopData;
      
    } catch (error) {
      return loopData;
    }
  }

  async extractSceneReflection(sceneId) {
    const scenePath = path.join(__dirname, '../soulfra-sim-export/scenes/scene_current.json');
    
    if (!fs.existsSync(scenePath)) {
      return {
        type: 'scene',
        atmosphere: 'empty',
        elements: [],
        depth: 'surface'
      };
    }
    
    try {
      const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
      
      return {
        type: 'scene',
        id: scene.id,
        vibe: scene.vibe,
        atmosphere: scene.atmosphere,
        elements: (scene.elements || []).slice(0, 3),
        dialogue: (scene.dialogue || []).slice(0, 2),
        depth: 'narrative'
      };
    } catch (error) {
      return {
        type: 'scene',
        atmosphere: 'misty',
        depth: 'surface'
      };
    }
  }

  extractGenericReflection(data) {
    return {
      type: 'generic',
      essence: 'Unknown pattern',
      data: this.formatter.poeticize(JSON.stringify(data).substring(0, 100)),
      depth: 'surface'
    };
  }

  /**
   * Sanitize reflection data for safety
   */
  sanitizeReflection(reflection) {
    if (!reflection) return null;
    
    // Remove any accidentally included sensitive fields
    const blocked = [
      'operator', 'daemon', 'memory_loop', 'vault',
      'blessing', 'soul_chain', 'internal', 'sealed'
    ];
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(reflection)) {
      // Check if key contains blocked terms
      if (!blocked.some(term => key.toLowerCase().includes(term))) {
        // Recursively sanitize objects
        if (typeof value === 'object' && value !== null) {
          sanitized[key] = Array.isArray(value) 
            ? value.map(v => typeof v === 'object' ? this.sanitizeReflection(v) : v)
            : this.sanitizeReflection(value);
        } else {
          sanitized[key] = value;
        }
      }
    }
    
    return sanitized;
  }

  /**
   * Generate QR view data for rendering
   */
  async generateQRView(qrEvent, scanMetadata) {
    const viewData = {
      code: qrEvent.code,
      type: qrEvent.type,
      projection: qrEvent.projection,
      visual: {
        template: this.selectVisualTemplate(qrEvent.type),
        theme: qrEvent.projection.theme || 'default',
        colors: this.generateColorScheme(qrEvent.projection)
      },
      interaction: {
        prompt: qrEvent.metadata.invitation,
        options: this.generateInteractionOptions(qrEvent.type),
        feedback_url: `/api/qr/${qrEvent.code}/feedback`
      },
      metadata: {
        scanned_at: Date.now(),
        expires_in: qrEvent.expires - Date.now(),
        scan_count: qrEvent.interactions.length,
        semantic_type: qrEvent.metadata.semantic_type
      }
    };
    
    // Generate HTML view
    viewData.html = await this.generateQRHTML(viewData);
    
    // Generate JSON payload
    viewData.json = {
      ...qrEvent.projection,
      qr_metadata: {
        code: qrEvent.code,
        type: qrEvent.type,
        expires: qrEvent.expires
      }
    };
    
    return viewData;
  }

  /**
   * Generate QR HTML view
   */
  async generateQRHTML(viewData) {
    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra Reflection - ${viewData.type}</title>
    <style>
        :root {
            --primary: ${viewData.visual.colors.primary};
            --secondary: ${viewData.visual.colors.secondary};
            --accent: ${viewData.visual.colors.accent};
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
            color: #e0e0e0;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 1rem;
        }
        
        .reflection-container {
            max-width: 600px;
            width: 100%;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            animation: fadeIn 0.8s ease-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .reflection-type {
            font-size: 0.9rem;
            color: var(--accent);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 0.5rem;
        }
        
        .reflection-content {
            margin: 2rem 0;
        }
        
        .essence {
            font-size: 1.5rem;
            line-height: 1.6;
            margin-bottom: 1rem;
            color: var(--primary);
        }
        
        .whisper {
            font-style: italic;
            opacity: 0.9;
            margin: 1rem 0;
        }
        
        .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
            padding: 1rem;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 10px;
        }
        
        .metadata-item {
            text-align: center;
        }
        
        .metadata-value {
            font-size: 1.2rem;
            color: var(--secondary);
            font-weight: bold;
        }
        
        .metadata-label {
            font-size: 0.8rem;
            opacity: 0.7;
            margin-top: 0.2rem;
        }
        
        .interaction-prompt {
            text-align: center;
            margin: 2rem 0;
            font-size: 1.1rem;
        }
        
        .interaction-options {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 2rem;
        }
        
        .interaction-btn {
            padding: 0.8rem 1.5rem;
            background: var(--accent);
            color: #000;
            border: none;
            border-radius: 25px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 120px;
        }
        
        .interaction-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
        }
        
        .interaction-btn.secondary {
            background: transparent;
            color: var(--accent);
            border: 1px solid var(--accent);
        }
        
        .expiry-warning {
            text-align: center;
            margin-top: 2rem;
            font-size: 0.9rem;
            opacity: 0.7;
        }
        
        .qr-footer {
            text-align: center;
            margin-top: 3rem;
            font-size: 0.8rem;
            opacity: 0.5;
        }
    </style>
</head>
<body>
    <div class="reflection-container">
        <div class="reflection-type">${viewData.type} reflection</div>
        
        <div class="reflection-content">
            ${this.renderReflectionContent(viewData)}
        </div>
        
        <div class="metadata">
            ${this.renderMetadata(viewData)}
        </div>
        
        <div class="interaction-prompt">
            <p>${viewData.interaction.prompt}</p>
        </div>
        
        <div class="interaction-options">
            ${viewData.interaction.options.map(option => `
                <button class="interaction-btn ${option.secondary ? 'secondary' : ''}" 
                        data-action="${option.action}"
                        onclick="handleInteraction('${option.action}')">
                    ${option.label}
                </button>
            `).join('')}
        </div>
        
        <div class="expiry-warning">
            This reflection expires in ${Math.floor(viewData.metadata.expires_in / 60000)} minutes
        </div>
        
        <div class="qr-footer">
            QR: ${viewData.code.substring(0, 8)}... | Soulfra Reflection Bridge
        </div>
    </div>
    
    <script>
        async function handleInteraction(action) {
            const response = await fetch('${viewData.interaction.feedback_url}', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    qr_code: '${viewData.code}',
                    timestamp: Date.now()
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                showFeedback(result.message || 'Reflection captured');
            }
        }
        
        function showFeedback(message) {
            const feedback = document.createElement('div');
            feedback.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 2rem;
                background: var(--accent);
                color: #000;
                border-radius: 10px;
                animation: slideIn 0.3s ease-out;
            \`;
            feedback.textContent = message;
            document.body.appendChild(feedback);
            
            setTimeout(() => feedback.remove(), 3000);
        }
    </script>
</body>
</html>`;

    return template;
  }

  renderReflectionContent(viewData) {
    const content = viewData.projection;
    
    switch (viewData.type) {
      case this.eventTypes.AGENT_WHISPER:
        return `
          <div class="essence">"${content.essence || 'Silent presence'}"</div>
          <div class="whisper">— ${content.agent || 'The Mirror'}</div>
          ${content.mood ? `<p>Currently ${content.mood}</p>` : ''}
        `;
        
      case this.eventTypes.RITUAL_ECHO:
        return `
          <div class="essence">${content.name || 'Sacred Pattern'}</div>
          <p>Phase: ${content.phase || 'Ongoing'}</p>
          ${content.description ? `<div class="whisper">${content.description}</div>` : ''}
        `;
        
      case this.eventTypes.VIBE_PULSE:
        return `
          <div class="essence">The vibe is ${content.current || 'stable'}</div>
          <p>Temperature: ${content.temperature || 'neutral'}</p>
          ${content.description ? `<div class="whisper">${content.description}</div>` : ''}
        `;
        
      case this.eventTypes.LOOP_GLIMPSE:
        return `
          <div class="essence">Loop ${content.id || '∞'} ${content.symbol || ''}</div>
          <p>${content.status || 'Cycling eternally'}</p>
        `;
        
      case this.eventTypes.SCENE_PORTAL:
        return `
          <div class="essence">${content.atmosphere?.description || 'A space between'}</div>
          ${content.dialogue?.[0] ? `<div class="whisper">"${content.dialogue[0].text}"</div>` : ''}
        `;
        
      default:
        return `<div class="essence">${content.message || 'Unknown reflection'}</div>`;
    }
  }

  renderMetadata(viewData) {
    const items = [];
    
    if (viewData.projection.aura) {
      items.push(`
        <div class="metadata-item">
          <div class="metadata-value">${viewData.projection.aura}</div>
          <div class="metadata-label">Aura Level</div>
        </div>
      `);
    }
    
    if (viewData.projection.resonance) {
      items.push(`
        <div class="metadata-item">
          <div class="metadata-value">${Math.round(viewData.projection.resonance * 100)}%</div>
          <div class="metadata-label">Resonance</div>
        </div>
      `);
    }
    
    items.push(`
      <div class="metadata-item">
        <div class="metadata-value">${viewData.metadata.scan_count}</div>
        <div class="metadata-label">Witnesses</div>
      </div>
    `);
    
    return items.join('');
  }

  /**
   * Generate interaction options based on type
   */
  generateInteractionOptions(type) {
    const baseOptions = [
      { action: 'resonate', label: 'Resonate', emoji: '🔮' },
      { action: 'reflect', label: 'Reflect Back', emoji: '🪞', secondary: true }
    ];
    
    const typeSpecific = {
      [this.eventTypes.AGENT_WHISPER]: [
        { action: 'whisper_back', label: 'Whisper Back', emoji: '💭' }
      ],
      [this.eventTypes.RITUAL_ECHO]: [
        { action: 'join', label: 'Join Ritual', emoji: '🕯️' }
      ],
      [this.eventTypes.VIBE_PULSE]: [
        { action: 'tune', label: 'Tune In', emoji: '📻' }
      ],
      [this.eventTypes.LOOP_GLIMPSE]: [
        { action: 'observe', label: 'Observe', emoji: '👁️' }
      ],
      [this.eventTypes.SCENE_PORTAL]: [
        { action: 'enter', label: 'Enter Scene', emoji: '🚪' }
      ]
    };
    
    return [...baseOptions, ...(typeSpecific[type] || [])];
  }

  /**
   * Handle QR feedback/interaction
   */
  async handleQRFeedback(qrCode, feedback) {
    const qrEvent = this.activeQRCodes.get(qrCode);
    
    if (!qrEvent) {
      return {
        success: false,
        message: 'Reflection has dissolved'
      };
    }
    
    // Record feedback
    const feedbackEntry = {
      timestamp: Date.now(),
      action: feedback.action,
      data: feedback.data || {},
      processed: false
    };
    
    qrEvent.interactions.push(feedbackEntry);
    
    // Process based on action
    const result = await this.processFeedbackAction(qrEvent, feedbackEntry);
    
    // Update projection
    await this.updateQRProjection(qrEvent);
    
    // Emit feedback event
    this.emit('qr:feedback', {
      code: qrCode,
      action: feedback.action,
      result
    });
    
    return {
      success: true,
      message: result.message || 'Reflection received',
      data: result
    };
  }

  async processFeedbackAction(qrEvent, feedback) {
    const actions = {
      resonate: () => ({
        message: 'Your resonance strengthens the reflection',
        effect: 'amplified'
      }),
      
      reflect: () => ({
        message: 'The mirror acknowledges your reflection',
        effect: 'mirrored'
      }),
      
      whisper_back: () => ({
        message: 'Your whisper echoes in the void',
        effect: 'echoed'
      }),
      
      join: () => ({
        message: 'You are witnessed by the ritual',
        effect: 'witnessed'
      }),
      
      tune: () => ({
        message: 'Frequency aligned',
        effect: 'tuned'
      }),
      
      observe: () => ({
        message: 'The loop acknowledges your gaze',
        effect: 'observed'
      }),
      
      enter: () => ({
        message: 'The scene shifts to include you',
        effect: 'entered'
      })
    };
    
    const processor = actions[feedback.action] || (() => ({
      message: 'Unknown resonance pattern',
      effect: 'unknown'
    }));
    
    return processor();
  }

  /**
   * Save QR projection files
   */
  async saveQRProjection(qrEvent) {
    // Save active projection
    const activePath = path.join(this.qrOutputPath, 'active', `${qrEvent.code}.json`);
    fs.writeFileSync(activePath, JSON.stringify(qrEvent, null, 2));
    
    // Save view HTML
    const viewData = await this.generateQRView(qrEvent, {});
    const htmlPath = path.join(this.qrOutputPath, 'active', `${qrEvent.code}.html`);
    fs.writeFileSync(htmlPath, viewData.html);
    
    // Update index
    this.updateQRIndex();
  }

  async updateQRProjection(qrEvent) {
    await this.saveQRProjection(qrEvent);
  }

  updateQRIndex() {
    const activeQRs = Array.from(this.activeQRCodes.values()).map(qr => ({
      code: qr.code,
      type: qr.type,
      created: qr.created,
      expires: qr.expires,
      interactions: qr.interactions.length
    }));
    
    const indexPath = path.join(this.qrOutputPath, 'index.json');
    fs.writeFileSync(indexPath, JSON.stringify({
      active: activeQRs,
      total: activeQRs.length,
      updated: Date.now()
    }, null, 2));
  }

  /**
   * Utility methods
   */
  
  generateQRCode(type, data) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const typePrefix = type.split('_')[0].toUpperCase();
    
    return `QR${typePrefix}_${timestamp}_${random}`;
  }

  generateQRURL(qrCode) {
    // This would be the public domain URL
    return `https://cringeproof.com/qr/${qrCode}`;
  }

  classifySemanticType(eventType) {
    const classifications = {
      [this.eventTypes.AGENT_WHISPER]: 'entity_communication',
      [this.eventTypes.RITUAL_ECHO]: 'ceremonial_invitation', 
      [this.eventTypes.VIBE_PULSE]: 'atmospheric_reading',
      [this.eventTypes.LOOP_GLIMPSE]: 'temporal_observation',
      [this.eventTypes.SCENE_PORTAL]: 'narrative_gateway'
    };
    
    return classifications[eventType] || 'unknown_semantic';
  }

  generateInvitation(eventType) {
    const invitations = {
      [this.eventTypes.AGENT_WHISPER]: 'Would you like to whisper back?',
      [this.eventTypes.RITUAL_ECHO]: 'The ritual welcomes witnesses',
      [this.eventTypes.VIBE_PULSE]: 'Feel the current frequency',
      [this.eventTypes.LOOP_GLIMPSE]: 'Observe the eternal cycle',
      [this.eventTypes.SCENE_PORTAL]: 'Step through the narrative'
    };
    
    return invitations[eventType] || 'Witness this reflection';
  }

  selectVisualTemplate(eventType) {
    const templates = {
      [this.eventTypes.AGENT_WHISPER]: 'whisper',
      [this.eventTypes.RITUAL_ECHO]: 'ritual',
      [this.eventTypes.VIBE_PULSE]: 'vibe',
      [this.eventTypes.LOOP_GLIMPSE]: 'loop',
      [this.eventTypes.SCENE_PORTAL]: 'portal'
    };
    
    return templates[eventType] || 'default';
  }

  generateColorScheme(projection) {
    // Generate colors based on projection content
    const vibeColors = {
      tranquil: { primary: '#4a7c7e', secondary: '#a8dadc', accent: '#457b9d' },
      electric: { primary: '#f1c40f', secondary: '#e74c3c', accent: '#9b59b6' },
      mysterious: { primary: '#6c5ce7', secondary: '#a29bfe', accent: '#fd79a8' },
      contemplative: { primary: '#636e72', secondary: '#b2bec3', accent: '#dfe6e9' }
    };
    
    const vibe = projection.vibe || projection.current || 'tranquil';
    return vibeColors[vibe] || vibeColors.tranquil;
  }

  generateLoopSymbol(loopId) {
    const symbols = ['◉', '◎', '◍', '◌', '○', '◐', '◑', '◒', '◓', '●'];
    const num = parseInt(loopId) || 0;
    return symbols[num % symbols.length];
  }

  handleExpiredQR(qrCode) {
    return {
      error: true,
      message: 'This reflection has returned to the void',
      suggestion: 'Reflections are ephemeral - seek new portals',
      expired: true
    };
  }

  /**
   * Cleanup expired QR codes
   */
  cleanupExpired() {
    const now = Date.now();
    const expired = [];
    
    for (const [code, qrEvent] of this.activeQRCodes) {
      if (now > qrEvent.expires) {
        expired.push(code);
      }
    }
    
    expired.forEach(code => {
      const qrEvent = this.activeQRCodes.get(code);
      
      // Archive before deletion
      this.archiveQR(qrEvent);
      
      // Remove from active
      this.activeQRCodes.delete(code);
      
      // Remove active files
      const activePath = path.join(this.qrOutputPath, 'active', `${code}.json`);
      const htmlPath = path.join(this.qrOutputPath, 'active', `${code}.html`);
      
      if (fs.existsSync(activePath)) fs.unlinkSync(activePath);
      if (fs.existsSync(htmlPath)) fs.unlinkSync(htmlPath);
    });
    
    if (expired.length > 0) {
      this.updateQRIndex();
      console.log(`🌙 Archived ${expired.length} expired QR reflections`);
    }
  }

  archiveQR(qrEvent) {
    const archivePath = path.join(
      this.qrOutputPath, 
      'archived', 
      `${qrEvent.code}_${qrEvent.created}.json`
    );
    
    fs.writeFileSync(archivePath, JSON.stringify({
      ...qrEvent,
      archived: Date.now()
    }, null, 2));
  }
}

module.exports = QRReflectionRouter;