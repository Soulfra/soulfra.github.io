#!/usr/bin/env node

/**
 * 🎨 FRONTEND TEMPLATE ENGINE
 * Creates actual working frontend templates for all user types
 * Connects to backend services through unified orchestrator
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

class FrontendTemplateEngine {
  constructor() {
    this.port = 4000;
    this.backendUrl = 'http://localhost:5000'; // Unified backend
    this.wsUrl = 'ws://localhost:5001'; // WebSocket backend
    
    // Frontend templates for different user types
    this.templates = {
      simple: {
        name: '5-Year-Old Experience',
        components: ['BigButtons', 'VoiceOnly', 'FunAnimations', 'SimpleWords'],
        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FECA57']
      },
      creator: {
        name: 'Creator Dashboard',
        components: ['Analytics', 'Monetization', 'AudienceInsights', 'ContentTools'],
        colors: ['#667eea', '#764ba2', '#f093fb', '#f5576c']
      },
      developer: {
        name: 'Developer Console',
        components: ['APIExplorer', 'CodeEditor', 'Webhooks', 'Logs'],
        colors: ['#0a0a0a', '#1a1a1a', '#2a2a2a', '#00ff00']
      },
      enterprise: {
        name: 'Enterprise Portal',
        components: ['Compliance', 'TeamManagement', 'Billing', 'SLA'],
        colors: ['#2c3e50', '#34495e', '#3498db', '#2980b9']
      },
      platform: {
        name: 'Platform Owner Console',
        components: ['TenantManager', 'RevenueAnalytics', 'WhiteLabel', 'GlobalSettings'],
        colors: ['#8b00ff', '#7000e0', '#5500cc', '#4000b3']
      }
    };
    
    // Component library
    this.componentLibrary = {
      BigButtons: this.generateBigButtonComponent,
      VoiceOnly: this.generateVoiceOnlyComponent,
      FunAnimations: this.generateFunAnimationsComponent,
      SimpleWords: this.generateSimpleWordsComponent,
      Analytics: this.generateAnalyticsComponent,
      Monetization: this.generateMonetizationComponent,
      APIExplorer: this.generateAPIExplorerComponent,
      CodeEditor: this.generateCodeEditorComponent,
      Compliance: this.generateComplianceComponent,
      TenantManager: this.generateTenantManagerComponent
    };
    
    this.initializeEngine();
  }
  
  async initializeEngine() {
    console.log('🎨 FRONTEND TEMPLATE ENGINE STARTING');
    console.log('====================================');
    console.log('Creating working frontends for all user types');
    console.log('');
    
    // Generate all template files
    this.generateAllTemplates();
    
    // Start template server
    this.startTemplateServer();
  }
  
  generateAllTemplates() {
    console.log('📝 Generating frontend templates...\n');
    
    // Create templates directory
    const templatesDir = path.join(__dirname, 'frontend-templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }
    
    // Generate each template
    for (const [type, config] of Object.entries(this.templates)) {
      console.log(`🎨 Generating ${config.name}...`);
      
      const template = this.generateTemplate(type, config);
      const filename = path.join(templatesDir, `${type}-mode.html`);
      
      fs.writeFileSync(filename, template);
      console.log(`✅ Saved: ${type}-mode.html`);
    }
    
    // Generate shared components
    this.generateSharedComponents(templatesDir);
    
    console.log('\n✅ All templates generated!');
  }
  
  generateTemplate(type, config) {
    const components = config.components.map(comp => 
      this.componentLibrary[comp] ? this.componentLibrary[comp].call(this, config) : ''
    ).join('\n');
    
    return `<!DOCTYPE html>
<html>
<head>
  <title>${config.name} - Soulfra Platform</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    ${this.generateBaseStyles(config)}
    ${this.generateModeSpecificStyles(type, config)}
  </style>
</head>
<body>
  <div id="app" class="${type}-mode">
    ${this.generateHeader(type, config)}
    
    <main class="main-content">
      ${components}
    </main>
    
    ${this.generateFooter(type)}
  </div>
  
  <!-- Shared Scripts -->
  <script src="/shared/api-client.js"></script>
  <script src="/shared/websocket-client.js"></script>
  <script src="/shared/voice-interface.js"></script>
  
  <!-- Mode Specific Scripts -->
  ${this.generateModeScripts(type)}
</body>
</html>`;
  }
  
  generateBaseStyles(config) {
    return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, ${config.colors[0]} 0%, ${config.colors[1]} 100%);
      color: white;
      min-height: 100vh;
    }
    
    #app {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .main-content {
      flex: 1;
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }
    
    .card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 20px;
      margin-bottom: 20px;
    }
    
    button {
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s;
    }
    
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    }
    `;
  }
  
  generateModeSpecificStyles(type, config) {
    const styles = {
      simple: `
        .simple-mode {
          text-align: center;
        }
        
        .big-button {
          width: 200px;
          height: 200px;
          margin: 20px;
          font-size: 4em;
          border-radius: 30px;
          background: linear-gradient(45deg, ${config.colors[2]}, ${config.colors[3]});
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          animation: bounce 2s infinite;
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        .voice-bubble {
          background: white;
          color: #333;
          padding: 30px;
          border-radius: 30px;
          font-size: 2em;
          margin: 20px auto;
          max-width: 600px;
          position: relative;
        }
        
        .voice-bubble:after {
          content: '';
          position: absolute;
          bottom: -20px;
          left: 50%;
          width: 0;
          height: 0;
          border: 20px solid transparent;
          border-top-color: white;
          border-bottom: 0;
          margin-left: -20px;
        }
      `,
      
      creator: `
        .creator-mode .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        
        .metric-card {
          text-align: center;
          padding: 30px;
        }
        
        .metric-value {
          font-size: 3em;
          font-weight: bold;
          margin: 10px 0;
        }
        
        .chart-container {
          height: 300px;
          margin: 20px 0;
        }
        
        .monetization-card {
          background: linear-gradient(45deg, #f093fb, #f5576c);
          padding: 30px;
          border-radius: 20px;
          text-align: center;
        }
      `,
      
      developer: `
        .developer-mode {
          background: #0a0a0a;
          color: #00ff00;
          font-family: 'Courier New', monospace;
        }
        
        .code-editor {
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 5px;
          padding: 20px;
          font-family: 'Monaco', 'Consolas', monospace;
          overflow-x: auto;
        }
        
        .api-endpoint {
          background: #2a2a2a;
          padding: 10px;
          margin: 10px 0;
          border-radius: 5px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .method-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
        }
        
        .method-get { background: #61affe; }
        .method-post { background: #49cc90; }
        .method-put { background: #fca130; }
        .method-delete { background: #f93e3e; }
      `,
      
      enterprise: `
        .enterprise-mode {
          background: #ecf0f1;
          color: #2c3e50;
        }
        
        .enterprise-mode .card {
          background: white;
          color: #2c3e50;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .compliance-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #e8f5e9;
          border-radius: 8px;
          margin: 10px 0;
        }
        
        .compliance-badge {
          background: #4caf50;
          color: white;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
      `,
      
      platform: `
        .platform-mode {
          background: #1a0033;
        }
        
        .tenant-card {
          background: rgba(139, 0, 255, 0.1);
          border: 1px solid rgba(139, 0, 255, 0.3);
          padding: 20px;
          border-radius: 10px;
          margin: 10px 0;
        }
        
        .revenue-chart {
          background: rgba(255, 255, 255, 0.05);
          padding: 30px;
          border-radius: 20px;
          height: 400px;
        }
        
        .global-controls {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        
        .control-button {
          background: linear-gradient(45deg, #8b00ff, #5500cc);
          color: white;
          padding: 20px;
          border-radius: 10px;
          text-align: center;
          cursor: pointer;
        }
      `
    };
    
    return styles[type] || '';
  }
  
  generateHeader(type, config) {
    const headers = {
      simple: `
        <header class="simple-header">
          <h1 style="font-size: 4em; margin: 20px;">🎉 Let's Build Something Fun!</h1>
          <div class="voice-indicator" id="voiceIndicator">
            <span style="font-size: 3em;">🎤</span>
          </div>
        </header>
      `,
      
      creator: `
        <header class="creator-header card">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h1>${config.name}</h1>
            <div class="header-actions">
              <button onclick="launchPlatform()">Launch Platform</button>
              <button onclick="viewAnalytics()">Analytics</button>
              <span class="user-avatar">👤</span>
            </div>
          </div>
        </header>
      `,
      
      developer: `
        <header class="developer-header" style="background: #1a1a1a; padding: 20px;">
          <pre style="color: #00ff00;">
 ____  ___  _   _ _     _____ ____      _    
/ ___| / _ \\| | | | |   |  ___|  _ \\    / \\   
\\___ \\| | | | | | | |   | |_  | |_) |  / _ \\  
 ___) | |_| | |_| | |___|  _| |  _ <  / ___ \\ 
|____/ \\___/ \\___/|_____|_|   |_| \\_\\/_/   \\_\\
          </pre>
          <nav style="margin-top: 20px;">
            <a href="#api" style="color: #00ff00; margin-right: 20px;">API</a>
            <a href="#webhooks" style="color: #00ff00; margin-right: 20px;">Webhooks</a>
            <a href="#logs" style="color: #00ff00;">Logs</a>
          </nav>
        </header>
      `,
      
      enterprise: `
        <header class="enterprise-header" style="background: white; color: #2c3e50; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h1 style="color: #2c3e50;">Enterprise Dashboard</h1>
              <p style="color: #7f8c8d;">Secure. Compliant. Scalable.</p>
            </div>
            <div>
              <span class="compliance-badge">SOC2</span>
              <span class="compliance-badge">GDPR</span>
              <span class="compliance-badge">HIPAA</span>
            </div>
          </div>
        </header>
      `,
      
      platform: `
        <header class="platform-header card" style="background: rgba(139, 0, 255, 0.2);">
          <h1 style="font-size: 2.5em;">👑 Platform Owner Console</h1>
          <div style="display: flex; gap: 40px; margin-top: 20px;">
            <div>
              <div style="font-size: 2em;">$${Math.floor(Math.random() * 100000)}</div>
              <div style="opacity: 0.8;">Monthly Revenue</div>
            </div>
            <div>
              <div style="font-size: 2em;">${Math.floor(Math.random() * 1000)}</div>
              <div style="opacity: 0.8;">Active Platforms</div>
            </div>
            <div>
              <div style="font-size: 2em;">${Math.floor(Math.random() * 50000)}</div>
              <div style="opacity: 0.8;">Total Users</div>
            </div>
          </div>
        </header>
      `
    };
    
    return headers[type] || '';
  }
  
  generateBigButtonComponent(config) {
    return `
    <div class="big-buttons-container">
      <button class="big-button" onclick="createPlatform('game')">🎮</button>
      <button class="big-button" onclick="createPlatform('friend')">🤖</button>
      <button class="big-button" onclick="createPlatform('teacher')">📚</button>
      <button class="big-button" onclick="createPlatform('helper')">🦸</button>
    </div>
    
    <div class="voice-bubble" id="calMessage">
      Hi! I'm Cal! Press a button or talk to me!
    </div>
    `;
  }
  
  generateVoiceOnlyComponent(config) {
    return `
    <div class="voice-only-container">
      <div class="voice-animation" id="voiceAnimation">
        <div class="voice-circle"></div>
        <div class="voice-circle"></div>
        <div class="voice-circle"></div>
      </div>
      
      <button class="voice-button" onclick="toggleVoice()" style="
        width: 300px;
        height: 300px;
        border-radius: 50%;
        font-size: 5em;
        background: linear-gradient(45deg, ${config.colors[2]}, ${config.colors[3]});
        margin: 40px auto;
        display: block;
      ">
        🎤
      </button>
    </div>
    `;
  }
  
  generateAnalyticsComponent(config) {
    return `
    <div class="analytics-section">
      <h2>Platform Analytics</h2>
      
      <div class="analytics-grid">
        <div class="card metric-card">
          <div class="metric-label">Total Users</div>
          <div class="metric-value" id="totalUsers">1,234</div>
          <div class="metric-change">+12.5%</div>
        </div>
        
        <div class="card metric-card">
          <div class="metric-label">Revenue</div>
          <div class="metric-value" id="revenue">$4,567</div>
          <div class="metric-change">+23.8%</div>
        </div>
        
        <div class="card metric-card">
          <div class="metric-label">Engagement</div>
          <div class="metric-value" id="engagement">87%</div>
          <div class="metric-change">+5.2%</div>
        </div>
      </div>
      
      <div class="card chart-container">
        <canvas id="revenueChart"></canvas>
      </div>
    </div>
    `;
  }
  
  generateMonetizationComponent(config) {
    return `
    <div class="monetization-section">
      <div class="monetization-card">
        <h2>💰 Monetization Setup</h2>
        <p style="font-size: 1.2em; margin: 20px 0;">Start earning from your AI platform</p>
        
        <div class="pricing-tiers" style="display: flex; gap: 20px; justify-content: center; margin: 30px 0;">
          <div class="tier-card" style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px;">
            <h3>Basic</h3>
            <div style="font-size: 2em; margin: 10px 0;">$9</div>
            <button onclick="setPricing('basic', 9)">Set Price</button>
          </div>
          
          <div class="tier-card" style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px;">
            <h3>Pro</h3>
            <div style="font-size: 2em; margin: 10px 0;">$29</div>
            <button onclick="setPricing('pro', 29)">Set Price</button>
          </div>
          
          <div class="tier-card" style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px;">
            <h3>Enterprise</h3>
            <div style="font-size: 2em; margin: 10px 0;">$99</div>
            <button onclick="setPricing('enterprise', 99)">Set Price</button>
          </div>
        </div>
        
        <button style="background: white; color: #667eea; font-size: 1.2em; padding: 15px 40px;">
          Connect Stripe Account
        </button>
      </div>
    </div>
    `;
  }
  
  generateAPIExplorerComponent() {
    return `
    <div class="api-explorer">
      <h2 style="color: #00ff00; margin-bottom: 20px;">&gt; API Explorer</h2>
      
      <div class="api-endpoints">
        <div class="api-endpoint">
          <div>
            <span class="method-badge method-get">GET</span>
            <span>/api/platforms</span>
          </div>
          <button onclick="testEndpoint('GET', '/api/platforms')">Test</button>
        </div>
        
        <div class="api-endpoint">
          <div>
            <span class="method-badge method-post">POST</span>
            <span>/api/create-platform</span>
          </div>
          <button onclick="testEndpoint('POST', '/api/create-platform')">Test</button>
        </div>
        
        <div class="api-endpoint">
          <div>
            <span class="method-badge method-get">GET</span>
            <span>/api/platform/:id</span>
          </div>
          <button onclick="testEndpoint('GET', '/api/platform/:id')">Test</button>
        </div>
        
        <div class="api-endpoint">
          <div>
            <span class="method-badge method-put">PUT</span>
            <span>/api/platform/:id</span>
          </div>
          <button onclick="testEndpoint('PUT', '/api/platform/:id')">Test</button>
        </div>
      </div>
      
      <div class="code-editor" id="responseEditor">
        <pre id="apiResponse">// API response will appear here</pre>
      </div>
    </div>
    `;
  }
  
  generateFooter(type) {
    if (type === 'simple') {
      return `
        <footer style="text-align: center; padding: 20px; font-size: 2em;">
          Made with ❤️ by Cal
        </footer>
      `;
    }
    
    return `
      <footer class="footer" style="padding: 20px; text-align: center; opacity: 0.8;">
        <p>Powered by Soulfra Platform • <a href="/docs" style="color: white;">Documentation</a> • <a href="/support" style="color: white;">Support</a></p>
      </footer>
    `;
  }
  
  generateModeScripts(type) {
    const scripts = {
      simple: `
        <script>
          // Simple mode functions
          function createPlatform(type) {
            const icons = {
              game: '🎮',
              friend: '🤖', 
              teacher: '📚',
              helper: '🦸'
            };
            
            showCalMessage('Yay! Building your ' + icons[type] + ' platform!');
            
            // Call backend
            apiClient.createPlatform({
              type: type,
              mode: 'simple',
              icon: icons[type]
            });
          }
          
          function showCalMessage(message) {
            document.getElementById('calMessage').textContent = message;
            
            // Add bounce animation
            const bubble = document.getElementById('calMessage');
            bubble.style.animation = 'none';
            setTimeout(() => {
              bubble.style.animation = 'bounce 1s';
            }, 10);
          }
          
          // Auto-start voice for simple mode
          setTimeout(() => {
            if (window.voiceInterface) {
              window.voiceInterface.start();
            }
          }, 1000);
        </script>
      `,
      
      creator: `
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <script>
          // Creator mode analytics
          const ctx = document.getElementById('revenueChart');
          if (ctx) {
            new Chart(ctx, {
              type: 'line',
              data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                  label: 'Revenue',
                  data: [120, 190, 300, 250, 420, 380, 520],
                  borderColor: '#667eea',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)'
                }]
              }
            });
          }
          
          // Real-time updates
          setInterval(() => {
            updateAnalytics();
          }, 5000);
          
          async function updateAnalytics() {
            const data = await apiClient.getAnalytics();
            document.getElementById('totalUsers').textContent = data.users.toLocaleString();
            document.getElementById('revenue').textContent = '$' + data.revenue.toLocaleString();
            document.getElementById('engagement').textContent = data.engagement + '%';
          }
        </script>
      `,
      
      developer: `
        <script>
          // Developer mode API testing
          async function testEndpoint(method, endpoint) {
            const response = document.getElementById('apiResponse');
            response.textContent = '// Loading...';
            
            try {
              const result = await apiClient.testEndpoint(method, endpoint);
              response.textContent = JSON.stringify(result, null, 2);
              
              // Syntax highlighting
              response.innerHTML = syntaxHighlight(response.textContent);
            } catch (error) {
              response.textContent = '// Error: ' + error.message;
            }
          }
          
          function syntaxHighlight(json) {
            json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
              let cls = 'number';
              if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                  cls = 'key';
                } else {
                  cls = 'string';
                }
              } else if (/true|false/.test(match)) {
                cls = 'boolean';
              } else if (/null/.test(match)) {
                cls = 'null';
              }
              return '<span class="' + cls + '">' + match + '</span>';
            });
          }
        </script>
        
        <style>
          .string { color: #98c379; }
          .number { color: #d19a66; }
          .boolean { color: #56b6c2; }
          .null { color: #abb2bf; }
          .key { color: #e06c75; }
        </style>
      `
    };
    
    return scripts[type] || '';
  }
  
  generateSharedComponents(dir) {
    // API Client
    const apiClient = `
// Shared API Client
class APIClient {
  constructor() {
    this.baseUrl = '${this.backendUrl}';
    this.wsUrl = '${this.wsUrl}';
    this.sessionId = null;
  }
  
  async createPlatform(config) {
    const response = await fetch(this.baseUrl + '/api/create-platform', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...config,
        sessionId: this.sessionId
      })
    });
    
    return await response.json();
  }
  
  async getAnalytics() {
    const response = await fetch(this.baseUrl + '/api/analytics');
    return await response.json();
  }
  
  async testEndpoint(method, endpoint) {
    const response = await fetch(this.baseUrl + endpoint, {
      method: method,
      headers: { 'Content-Type': 'application/json' }
    });
    
    return await response.json();
  }
}

window.apiClient = new APIClient();
`;
    
    // WebSocket Client
    const wsClient = `
// WebSocket Client
class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.connect();
  }
  
  connect() {
    this.ws = new WebSocket('${this.wsUrl}');
    
    this.ws.onopen = () => {
      console.log('Connected to backend');
      this.reconnectAttempts = 0;
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
    
    this.ws.onclose = () => {
      console.log('Disconnected from backend');
      this.reconnect();
    };
  }
  
  handleMessage(message) {
    // Dispatch to appropriate handlers
    if (window.messageHandlers && window.messageHandlers[message.type]) {
      window.messageHandlers[message.type](message);
    }
  }
  
  send(data) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  reconnect() {
    if (this.reconnectAttempts < 5) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
    }
  }
}

window.wsClient = new WebSocketClient();
`;
    
    // Voice Interface
    const voiceInterface = `
// Voice Interface
class VoiceInterface {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isListening = false;
    
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      
      this.recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript;
        
        if (event.results[last].isFinal) {
          this.processVoiceCommand(transcript);
        }
      };
    }
  }
  
  start() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
      this.updateUI(true);
    }
  }
  
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.updateUI(false);
    }
  }
  
  processVoiceCommand(transcript) {
    // Send to backend
    window.wsClient.send({
      type: 'voice_input',
      transcript: transcript
    });
  }
  
  speak(text, voice = 'Cal') {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.1;
    utterance.pitch = 1.1;
    this.synthesis.speak(utterance);
  }
  
  updateUI(listening) {
    const indicator = document.getElementById('voiceIndicator');
    if (indicator) {
      indicator.style.animation = listening ? 'pulse 2s infinite' : 'none';
    }
  }
}

window.voiceInterface = new VoiceInterface();

// Voice button handler
window.toggleVoice = function() {
  if (window.voiceInterface.isListening) {
    window.voiceInterface.stop();
  } else {
    window.voiceInterface.start();
  }
};
`;
    
    // Create shared directory
    const sharedDir = path.join(dir, 'shared');
    if (!fs.existsSync(sharedDir)) {
      fs.mkdirSync(sharedDir, { recursive: true });
    }
    
    // Write shared files
    fs.writeFileSync(path.join(sharedDir, 'api-client.js'), apiClient);
    fs.writeFileSync(path.join(sharedDir, 'websocket-client.js'), wsClient);
    fs.writeFileSync(path.join(sharedDir, 'voice-interface.js'), voiceInterface);
    
    console.log('✅ Generated shared components');
  }
  
  startTemplateServer() {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${this.port}`);
      
      console.log(`🎨 Template: ${req.method} ${req.url}`);
      
      // Serve template files
      if (url.pathname.startsWith('/templates/')) {
        this.serveTemplate(req, res);
      } else if (url.pathname.startsWith('/shared/')) {
        this.serveShared(req, res);
      } else if (url.pathname === '/') {
        this.serveSelector(req, res);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    
    server.listen(this.port, () => {
      console.log(`✓ Frontend Template Engine running on port ${this.port}`);
    });
  }
  
  serveTemplate(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    const filename = path.basename(url.pathname);
    const filepath = path.join(__dirname, 'frontend-templates', filename);
    
    if (fs.existsSync(filepath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(filepath));
    } else {
      res.writeHead(404);
      res.end('Template not found');
    }
  }
  
  serveShared(req, res) {
    const url = new URL(req.url, `http://localhost:${this.port}`);
    const filename = path.basename(url.pathname);
    const filepath = path.join(__dirname, 'frontend-templates', 'shared', filename);
    
    if (fs.existsSync(filepath)) {
      res.writeHead(200, { 'Content-Type': 'application/javascript' });
      res.end(fs.readFileSync(filepath));
    } else {
      res.writeHead(404);
      res.end('Shared component not found');
    }
  }
  
  serveSelector(req, res) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Soulfra Frontend Templates</title>
  <style>
    body {
      font-family: -apple-system, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    .template-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .template-card {
      border: 2px solid #eee;
      border-radius: 10px;
      padding: 20px;
      text-align: center;
      transition: all 0.3s;
      cursor: pointer;
    }
    .template-card:hover {
      border-color: #667eea;
      transform: translateY(-5px);
      box-shadow: 0 5px 20px rgba(0,0,0,0.1);
    }
    .template-icon {
      font-size: 3em;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <h1>🎨 Soulfra Frontend Templates</h1>
  <p>Choose an experience mode to preview:</p>
  
  <div class="template-grid">
    ${Object.entries(this.templates).map(([type, config]) => `
      <div class="template-card" onclick="window.location.href='/templates/${type}-mode.html'">
        <div class="template-icon">${type === 'simple' ? '🧸' : type === 'creator' ? '🎨' : type === 'developer' ? '💻' : type === 'enterprise' ? '🏢' : '👑'}</div>
        <h3>${config.name}</h3>
        <p style="opacity: 0.7; font-size: 0.9em;">${config.components.length} components</p>
      </div>
    `).join('')}
  </div>
  
  <div style="margin-top: 40px; text-align: center;">
    <p>Backend Orchestrator: <a href="http://localhost:5000">localhost:5000</a></p>
    <p>API Documentation: <a href="http://localhost:5000/api/docs">API Docs</a></p>
  </div>
</body>
</html>`;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }
}

// Start the template engine
new FrontendTemplateEngine();