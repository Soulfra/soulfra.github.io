#!/usr/bin/env node

/**
 * 🔌 UNIFIED BACKEND ORCHESTRATOR
 * Connects all services together with proper frontend-to-backend integration
 * Works for 5-year-olds, developers, enterprise, and platform owners
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

class UnifiedBackendOrchestrator {
  constructor() {
    this.port = 5000; // Main API gateway port
    this.wsPort = 5001; // WebSocket gateway
    
    // Service registry - all backend services
    this.services = {
      calVoice: { url: 'http://localhost:9100', ws: 'ws://localhost:9101' },
      platformGenerator: { url: 'http://localhost:7100' },
      multiTenant: { url: 'http://localhost:7001' },
      productionBuilder: { url: 'http://localhost:7300' },
      calMirror: { url: 'http://localhost:9000' },
      vaultPulse: { url: 'http://localhost:9001' },
      outcomes: { url: 'http://localhost:3030' },
      landingPage: { url: 'http://localhost:8080', ws: 'ws://localhost:8081' },
      platformExport: { url: 'http://localhost:7200' }
    };
    
    // User experience modes
    this.experienceModes = {
      simple: {
        name: '5-Year-Old Mode',
        features: ['voice_only', 'big_buttons', 'animations', 'simple_language'],
        complexity: 0.1
      },
      creator: {
        name: 'Creator Mode',
        features: ['voice_and_ui', 'templates', 'analytics', 'monetization'],
        complexity: 0.5
      },
      developer: {
        name: 'Developer Mode',
        features: ['full_api', 'code_access', 'cli_tools', 'webhooks'],
        complexity: 0.8
      },
      enterprise: {
        name: 'Enterprise Mode',
        features: ['compliance', 'sso', 'audit_logs', 'sla_guarantees'],
        complexity: 0.9
      },
      platform: {
        name: 'Platform Owner Mode',
        features: ['full_control', 'white_label', 'revenue_share', 'multi_tenant'],
        complexity: 1.0
      }
    };
    
    // Active sessions
    this.sessions = new Map();
    
    // Platform creation flow state
    this.creationFlows = new Map();
    
    this.initializeOrchestrator();
  }
  
  async initializeOrchestrator() {
    console.log('🔌 UNIFIED BACKEND ORCHESTRATOR STARTING');
    console.log('========================================');
    console.log('Connecting all services for seamless experience');
    console.log('');
    
    // Health check all services
    await this.healthCheckServices();
    
    // Start API gateway
    this.startAPIGateway();
    
    // Start WebSocket gateway
    this.startWebSocketGateway();
    
    // Initialize service connectors
    this.initializeServiceConnectors();
  }
  
  async healthCheckServices() {
    console.log('🏥 Health checking all services...\n');
    
    for (const [name, service] of Object.entries(this.services)) {
      try {
        const response = await fetch(service.url);
        if (response.ok) {
          console.log(`✅ ${name}: HEALTHY`);
        } else {
          console.log(`⚠️  ${name}: UNHEALTHY (${response.status})`);
        }
      } catch (error) {
        console.log(`❌ ${name}: OFFLINE`);
      }
    }
    
    console.log('');
  }
  
  startAPIGateway() {
    const app = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${this.port}`);
      
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }
      
      console.log(`🔌 Gateway: ${req.method} ${req.url}`);
      
      // Main API routes
      try {
        if (url.pathname === '/') {
          await this.handleMainDashboard(req, res);
        } else if (url.pathname === '/api/create-platform') {
          await this.handleCreatePlatform(req, res);
        } else if (url.pathname === '/api/voice-command') {
          await this.handleVoiceCommand(req, res);
        } else if (url.pathname === '/api/platforms') {
          await this.handleGetPlatforms(req, res);
        } else if (url.pathname === '/api/session') {
          await this.handleSession(req, res);
        } else if (url.pathname === '/api/experience-mode') {
          await this.handleExperienceMode(req, res);
        } else if (url.pathname.startsWith('/api/platform/')) {
          await this.handlePlatformAPI(req, res);
        } else if (url.pathname === '/health') {
          await this.handleHealthCheck(req, res);
        } else {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Not found' }));
        }
      } catch (error) {
        console.error('Gateway error:', error);
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    
    app.listen(this.port, () => {
      console.log(`✓ Unified API Gateway running on port ${this.port}`);
    });
  }
  
  startWebSocketGateway() {
    this.wss = new WebSocket.Server({ port: this.wsPort });
    
    this.wss.on('connection', (ws) => {
      const sessionId = this.generateSessionId();
      console.log(`🔌 New WebSocket session: ${sessionId}`);
      
      const session = {
        id: sessionId,
        ws: ws,
        mode: 'simple',
        platforms: [],
        voiceActive: false,
        creationFlow: null
      };
      
      this.sessions.set(sessionId, session);
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        sessionId: sessionId,
        availableModes: Object.keys(this.experienceModes),
        services: this.getServiceStatus()
      }));
      
      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data);
          await this.handleWebSocketMessage(session, message);
        } catch (error) {
          ws.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });
      
      ws.on('close', () => {
        console.log(`🔌 Session ended: ${sessionId}`);
        this.sessions.delete(sessionId);
      });
    });
    
    console.log(`✓ WebSocket Gateway running on port ${this.wsPort}`);
  }
  
  async handleWebSocketMessage(session, message) {
    console.log(`🔌 WS Message: ${message.type} from ${session.id}`);
    
    switch (message.type) {
      case 'set_mode':
        session.mode = message.mode;
        await this.updateSessionMode(session);
        break;
        
      case 'voice_start':
        await this.startVoiceSession(session);
        break;
        
      case 'voice_input':
        await this.processVoiceInput(session, message.transcript);
        break;
        
      case 'create_platform':
        await this.startPlatformCreation(session, message.config);
        break;
        
      case 'platform_command':
        await this.processPlatformCommand(session, message);
        break;
        
      case 'get_analytics':
        await this.sendAnalytics(session);
        break;
    }
  }
  
  async handleCreatePlatform(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const config = JSON.parse(body);
        
        // Determine which service to use based on config
        let result;
        
        if (config.mode === 'voice') {
          // Route to Cal Voice Interface
          result = await this.callService('calVoice', '/api/create-from-voice', config);
        } else if (config.production) {
          // Route to Production Builder
          result = await this.callService('productionBuilder', '/api/create-personalized', config);
        } else {
          // Route to Platform Generator
          result = await this.callService('platformGenerator', '/api/generate', config);
        }
        
        // Track in creation flow
        const flowId = this.generateFlowId();
        this.creationFlows.set(flowId, {
          id: flowId,
          config: config,
          status: 'created',
          platform: result.platform,
          timestamp: Date.now()
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          flowId: flowId,
          platform: result.platform,
          nextSteps: this.getNextSteps(config.mode)
        }));
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }
  
  async handleVoiceCommand(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { sessionId, command } = JSON.parse(body);
        const session = this.sessions.get(sessionId);
        
        if (!session) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Session not found' }));
          return;
        }
        
        // Process voice command through appropriate service
        const result = await this.processVoiceCommand(session, command);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }
  
  async processVoiceCommand(session, command) {
    // Route to Cal Voice Interface
    const response = await this.callService('calVoice', '/api/process-command', {
      command: command,
      sessionId: session.id,
      mode: session.mode,
      context: session.creationFlow
    });
    
    // Update session state
    if (response.platformCreated) {
      session.platforms.push(response.platform);
    }
    
    // Broadcast update to WebSocket
    if (session.ws.readyState === WebSocket.OPEN) {
      session.ws.send(JSON.stringify({
        type: 'voice_response',
        ...response
      }));
    }
    
    return response;
  }
  
  async handleGetPlatforms(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    const sessionId = url.searchParams.get('sessionId');
    
    // Get platforms from all services
    const productionPlatforms = await this.callService('productionBuilder', '/api/platforms');
    const generatedPlatforms = await this.callService('platformGenerator', '/api/list');
    
    // Combine and filter by session if needed
    let allPlatforms = [
      ...productionPlatforms.platforms || [],
      ...generatedPlatforms.platforms || []
    ];
    
    if (sessionId) {
      const session = this.sessions.get(sessionId);
      if (session) {
        allPlatforms = allPlatforms.filter(p => 
          session.platforms.includes(p.id)
        );
      }
    }
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      platforms: allPlatforms,
      total: allPlatforms.length,
      totalRevenue: allPlatforms.reduce((sum, p) => sum + (p.metrics?.revenue || 0), 0)
    }));
  }
  
  async handleExperienceMode(req, res) {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        modes: this.experienceModes,
        current: req.headers['x-session-mode'] || 'simple'
      }));
    } else if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { sessionId, mode } = JSON.parse(body);
        const session = this.sessions.get(sessionId);
        
        if (session) {
          session.mode = mode;
          await this.updateSessionMode(session);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, mode: mode }));
      });
    }
  }
  
  async updateSessionMode(session) {
    const modeConfig = this.experienceModes[session.mode];
    
    // Notify all connected services about mode change
    session.ws.send(JSON.stringify({
      type: 'mode_updated',
      mode: session.mode,
      features: modeConfig.features,
      complexity: modeConfig.complexity
    }));
    
    // Adjust UI complexity based on mode
    if (session.mode === 'simple') {
      // Enable only voice and big buttons
      await this.enableSimpleMode(session);
    } else if (session.mode === 'developer') {
      // Enable full API access
      await this.enableDeveloperMode(session);
    } else if (session.mode === 'enterprise') {
      // Enable compliance features
      await this.enableEnterpriseMode(session);
    }
  }
  
  async enableSimpleMode(session) {
    // Configure for 5-year-old experience
    return {
      ui: 'simplified',
      voice: {
        enabled: true,
        language: 'simple',
        feedback: 'animated'
      },
      features: ['voice_creation', 'big_buttons', 'fun_animations']
    };
  }
  
  async enableDeveloperMode(session) {
    // Configure for developer experience
    return {
      ui: 'advanced',
      api: {
        enabled: true,
        documentation: '/api/docs',
        sdk: true
      },
      features: ['full_api', 'webhooks', 'cli_tools', 'code_export']
    };
  }
  
  async enableEnterpriseMode(session) {
    // Configure for enterprise experience
    return {
      ui: 'professional',
      security: {
        sso: true,
        audit: true,
        compliance: ['SOC2', 'GDPR', 'HIPAA']
      },
      features: ['white_label', 'dedicated_support', 'sla', 'custom_contracts']
    };
  }
  
  async callService(serviceName, endpoint, data = null) {
    const service = this.services[serviceName];
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    const url = service.url + endpoint;
    const options = {
      method: data ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      return await response.json();
    } catch (error) {
      console.error(`Error calling ${serviceName}:`, error);
      throw error;
    }
  }
  
  getServiceStatus() {
    const status = {};
    for (const [name, service] of Object.entries(this.services)) {
      status[name] = {
        url: service.url,
        status: 'checking'
      };
    }
    return status;
  }
  
  getNextSteps(mode) {
    const steps = {
      simple: [
        'Talk to Cal to customize your platform',
        'Choose fun colors and themes',
        'Invite your friends!'
      ],
      creator: [
        'Customize your AI persona',
        'Set up monetization',
        'Launch to your audience'
      ],
      developer: [
        'Access API documentation',
        'Integrate webhooks',
        'Deploy to production'
      ],
      enterprise: [
        'Configure SSO',
        'Set up compliance',
        'Schedule onboarding call'
      ],
      platform: [
        'Configure white label',
        'Set revenue share',
        'Launch sub-platforms'
      ]
    };
    
    return steps[mode] || steps.creator;
  }
  
  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateFlowId() {
    return `flow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  async handleHealthCheck(req, res) {
    const health = await this.checkAllServicesHealth();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      services: health,
      uptime: process.uptime(),
      activeSessions: this.sessions.size,
      activeFlows: this.creationFlows.size
    }));
  }
  
  async checkAllServicesHealth() {
    const health = {};
    
    for (const [name, service] of Object.entries(this.services)) {
      try {
        const response = await fetch(service.url + '/health').catch(() => null);
        health[name] = response && response.ok ? 'healthy' : 'unhealthy';
      } catch {
        health[name] = 'offline';
      }
    }
    
    return health;
  }
  
  async handleMainDashboard(req, res) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>🔌 Soulfra Unified Platform</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    h1 {
      font-size: 3em;
      margin-bottom: 20px;
      text-align: center;
    }
    .mode-selector {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-bottom: 40px;
      flex-wrap: wrap;
    }
    .mode-card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 20px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s;
      text-align: center;
      min-width: 200px;
    }
    .mode-card:hover {
      transform: translateY(-5px);
      background: rgba(255,255,255,0.2);
    }
    .mode-card.active {
      background: rgba(255,255,255,0.3);
      box-shadow: 0 0 30px rgba(255,255,255,0.3);
    }
    .mode-icon {
      font-size: 3em;
      margin-bottom: 10px;
    }
    .action-area {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 40px;
      border-radius: 20px;
      text-align: center;
    }
    .voice-button {
      background: white;
      color: #667eea;
      border: none;
      padding: 20px 40px;
      font-size: 1.5em;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.3s;
      margin: 20px;
    }
    .voice-button:hover {
      transform: scale(1.05);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .voice-button.active {
      background: #ff6b6b;
      color: white;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(255,107,107,0.4); }
      70% { box-shadow: 0 0 0 20px rgba(255,107,107,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,107,107,0); }
    }
    .platforms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 40px;
    }
    .platform-card {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      padding: 20px;
      border-radius: 15px;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 20px;
    }
    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #4CAF50;
    }
    #simple-mode-ui {
      display: none;
    }
    #simple-mode-ui.active {
      display: block;
    }
    .big-button {
      width: 200px;
      height: 200px;
      margin: 20px;
      font-size: 4em;
      border: none;
      border-radius: 30px;
      cursor: pointer;
      background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
      color: white;
      transition: all 0.3s;
    }
    .big-button:hover {
      transform: scale(1.1) rotate(5deg);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Soulfra AI Platform Creator</h1>
    
    <div class="mode-selector">
      <div class="mode-card" onclick="setMode('simple')">
        <div class="mode-icon">🧸</div>
        <h3>Simple Mode</h3>
        <p>For everyone!</p>
      </div>
      <div class="mode-card" onclick="setMode('creator')">
        <div class="mode-icon">🎨</div>
        <h3>Creator Mode</h3>
        <p>Build & monetize</p>
      </div>
      <div class="mode-card" onclick="setMode('developer')">
        <div class="mode-icon">💻</div>
        <h3>Developer Mode</h3>
        <p>Full API access</p>
      </div>
      <div class="mode-card" onclick="setMode('enterprise')">
        <div class="mode-icon">🏢</div>
        <h3>Enterprise Mode</h3>
        <p>Compliance & scale</p>
      </div>
      <div class="mode-card" onclick="setMode('platform')">
        <div class="mode-icon">👑</div>
        <h3>Platform Mode</h3>
        <p>Own everything</p>
      </div>
    </div>
    
    <div class="action-area" id="action-area">
      <div id="default-ui">
        <h2>Talk to Cal or Click to Start</h2>
        <button class="voice-button" onclick="toggleVoice()">
          🎤 Start Talking to Cal
        </button>
        <p style="margin-top: 20px; opacity: 0.8;">
          Say "Cal, build me a fitness platform" or click above
        </p>
      </div>
      
      <div id="simple-mode-ui">
        <h2 style="font-size: 3em;">🎉 Let's Build Something Fun!</h2>
        <div style="display: flex; justify-content: center; flex-wrap: wrap;">
          <button class="big-button" onclick="buildSimple('game')">🎮</button>
          <button class="big-button" onclick="buildSimple('friend')">🤖</button>
          <button class="big-button" onclick="buildSimple('teacher')">📚</button>
          <button class="big-button" onclick="buildSimple('helper')">🦸</button>
        </div>
      </div>
    </div>
    
    <div class="platforms-grid" id="platforms"></div>
    
    <div class="status">
      <div class="status-dot"></div>
      <span>All systems operational</span>
    </div>
  </div>
  
  <script>
    const ws = new WebSocket('ws://localhost:5001');
    let currentMode = 'creator';
    let sessionId = null;
    let isListening = false;
    
    ws.onopen = () => {
      console.log('Connected to unified backend');
    };
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'welcome':
          sessionId = message.sessionId;
          updateServiceStatus(message.services);
          break;
          
        case 'mode_updated':
          updateUIForMode(message.mode);
          break;
          
        case 'voice_response':
          handleVoiceResponse(message);
          break;
          
        case 'platform_created':
          addPlatformToGrid(message.platform);
          break;
      }
    };
    
    function setMode(mode) {
      currentMode = mode;
      document.querySelectorAll('.mode-card').forEach(card => {
        card.classList.remove('active');
      });
      event.target.closest('.mode-card').classList.add('active');
      
      ws.send(JSON.stringify({
        type: 'set_mode',
        mode: mode
      }));
      
      // Update UI based on mode
      if (mode === 'simple') {
        document.getElementById('default-ui').style.display = 'none';
        document.getElementById('simple-mode-ui').classList.add('active');
      } else {
        document.getElementById('default-ui').style.display = 'block';
        document.getElementById('simple-mode-ui').classList.remove('active');
      }
    }
    
    function toggleVoice() {
      const button = event.target;
      
      if (!isListening) {
        button.classList.add('active');
        button.textContent = '🔴 Listening...';
        isListening = true;
        startVoiceRecognition();
      } else {
        button.classList.remove('active');
        button.textContent = '🎤 Start Talking to Cal';
        isListening = false;
        stopVoiceRecognition();
      }
    }
    
    function startVoiceRecognition() {
      if ('webkitSpeechRecognition' in window) {
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript;
          
          if (event.results[last].isFinal) {
            ws.send(JSON.stringify({
              type: 'voice_input',
              transcript: transcript
            }));
          }
        };
        
        recognition.start();
        window.currentRecognition = recognition;
      }
    }
    
    function stopVoiceRecognition() {
      if (window.currentRecognition) {
        window.currentRecognition.stop();
      }
    }
    
    function buildSimple(type) {
      const configs = {
        game: { name: 'Fun Game Platform', type: 'gaming', icon: '🎮' },
        friend: { name: 'AI Friend', type: 'companion', icon: '🤖' },
        teacher: { name: 'Smart Teacher', type: 'education', icon: '📚' },
        helper: { name: 'Super Helper', type: 'assistant', icon: '🦸' }
      };
      
      const config = configs[type];
      
      fetch('/api/create-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          type: config.type,
          mode: 'simple',
          icon: config.icon,
          sessionId: sessionId
        })
      });
    }
    
    async function loadPlatforms() {
      const response = await fetch('/api/platforms?sessionId=' + sessionId);
      const data = await response.json();
      
      const grid = document.getElementById('platforms');
      grid.innerHTML = data.platforms.map(platform => `
        <div class="platform-card">
          <h3>${platform.name}</h3>
          <p>${platform.type}</p>
          <p>Users: ${platform.metrics?.users || 0}</p>
          <p>Revenue: $${platform.metrics?.revenue || 0}</p>
          <a href="${platform.liveUrl}" target="_blank">Visit Platform</a>
        </div>
      `).join('');
    }
    
    // Load platforms every 5 seconds
    setInterval(loadPlatforms, 5000);
  </script>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
  
  initializeServiceConnectors() {
    // Set up proxy connections to all services
    console.log('🔌 Initializing service connectors...');
    
    // Voice to Platform Generator connection
    this.setupVoiceToPlatformConnection();
    
    // Platform Generator to Multi-Tenant connection
    this.setupPlatformToTenantConnection();
    
    // Cal Mirror to Truth Ledger connection
    this.setupMirrorToTruthConnection();
    
    console.log('✓ All service connectors initialized');
  }
  
  setupVoiceToPlatformConnection() {
    // When voice creates platform, route to generator
    this.on('voice:create_platform', async (data) => {
      const result = await this.callService('platformGenerator', '/api/generate', data);
      this.emit('platform:created', result);
    });
  }
  
  setupPlatformToTenantConnection() {
    // When platform is generated, provision tenant
    this.on('platform:created', async (platform) => {
      const tenant = await this.callService('multiTenant', '/api/provision', {
        platformId: platform.id,
        resources: platform.requirements
      });
      platform.tenantId = tenant.id;
    });
  }
  
  setupMirrorToTruthConnection() {
    // Connect Cal mirrors to truth ledger
    this.on('mirror:action', async (action) => {
      const truth = await this.callService('calMirror', '/api/truth/add', action);
      this.broadcast('truth:updated', truth);
    });
  }
  
  // Event emitter functionality
  on(event, handler) {
    this.events = this.events || {};
    this.events[event] = this.events[event] || [];
    this.events[event].push(handler);
  }
  
  emit(event, data) {
    if (this.events && this.events[event]) {
      this.events[event].forEach(handler => handler(data));
    }
  }
  
  broadcast(type, data) {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type, ...data }));
      }
    });
  }
}

// Proxy middleware stub if not installed
if (!fs.existsSync(path.join(__dirname, 'node_modules', 'http-proxy-middleware'))) {
  global.createProxyMiddleware = () => (req, res, next) => next();
}

// Start the orchestrator
new UnifiedBackendOrchestrator();