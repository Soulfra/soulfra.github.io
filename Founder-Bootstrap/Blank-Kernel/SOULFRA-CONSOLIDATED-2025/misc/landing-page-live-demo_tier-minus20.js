#!/usr/bin/env node

/**
 * 🚀 LANDING PAGE WITH LIVE CAL DEMO
 * The mind-blowing experience where Cal builds platforms live
 */

const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

class LandingPageLiveDemo {
  constructor() {
    this.port = 8080;
    this.wsPort = 8081;
    this.activeDemos = new Map();
    this.conversionTracking = new Map();
    
    // Demo scenarios that rotate
    this.demoScenarios = [
      {
        voice: "Cal, build me an AI fitness coaching platform",
        persona: "Maya the Fitness Coach",
        features: ["Personalized workout plans", "AI motivation coach", "Progress tracking"],
        revenue: "$200-500/week from subscriptions"
      },
      {
        voice: "Cal, create a business consulting AI platform", 
        persona: "Alex the Business Mentor",
        features: ["Strategy sessions", "Market analysis", "Growth planning"],
        revenue: "$5K-10K/month from consultations"
      },
      {
        voice: "Cal, make an AI tutoring platform for math",
        persona: "Dr. Sophie the Math Tutor",
        features: ["Interactive lessons", "Practice problems", "Progress reports"],
        revenue: "$1K-3K/month from students"
      },
      {
        voice: "Cal, build a creative writing AI assistant",
        persona: "Nova the Writing Coach",
        features: ["Story development", "Character creation", "Writing feedback"],
        revenue: "$500-2K/week from creators"
      }
    ];
    
    this.currentDemoIndex = 0;
    this.initializeSystem();
  }
  
  async initializeSystem() {
    console.log('🚀 LANDING PAGE LIVE DEMO STARTING');
    console.log('==================================');
    console.log('Cal builds platforms live as visitors watch');
    console.log('');
    
    // Start WebSocket server for live updates
    this.startWebSocketServer();
    
    // Start HTTP server
    this.startHTTPServer();
    
    // Start live demo cycle
    this.startLiveDemoCycle();
  }
  
  startLiveDemoCycle() {
    // Rotate through demo scenarios
    setInterval(() => {
      this.currentDemoIndex = (this.currentDemoIndex + 1) % this.demoScenarios.length;
      this.broadcastNewDemo();
    }, 30000); // New demo every 30 seconds
    
    // Start with first demo
    this.broadcastNewDemo();
  }
  
  broadcastNewDemo() {
    const scenario = this.demoScenarios[this.currentDemoIndex];
    
    // Broadcast to all connected clients
    this.broadcast({
      type: 'new_demo',
      scenario: scenario
    });
    
    // Simulate Cal building process
    this.simulateCalBuilding(scenario);
  }
  
  async simulateCalBuilding(scenario) {
    const buildingSteps = [
      {
        delay: 2000,
        message: "Creating AI persona...",
        visual: "persona_creation",
        calResponse: "Oh, I love this idea! Setting up the perfect AI personality for this!"
      },
      {
        delay: 3000,
        message: "Generating platform interface...",
        visual: "ui_generation",
        calResponse: "Making this look absolutely amazing! Your users will love this design."
      },
      {
        delay: 2500,
        message: "Setting up payment system...",
        visual: "payment_setup",
        calResponse: `Perfect! You'll be making ${scenario.revenue} with this setup.`
      },
      {
        delay: 2000,
        message: "Deploying to production...",
        visual: "deployment",
        calResponse: "And... DONE! Your platform is live and ready to make money!"
      }
    ];
    
    for (const step of buildingSteps) {
      await new Promise(resolve => setTimeout(resolve, step.delay));
      
      this.broadcast({
        type: 'building_progress',
        step: step,
        scenario: scenario
      });
    }
    
    // Show completed platform
    this.broadcast({
      type: 'platform_complete',
      scenario: scenario,
      platformUrl: `https://demo-${Date.now()}.soulfra.live`,
      stats: {
        buildTime: "3 minutes 12 seconds",
        activeUsers: Math.floor(Math.random() * 500) + 100,
        revenue: scenario.revenue
      }
    });
  }
  
  startWebSocketServer() {
    this.wss = new WebSocket.Server({ port: this.wsPort });
    
    this.wss.on('connection', (ws) => {
      const visitorId = this.generateVisitorId();
      console.log(`👀 New visitor watching demo: ${visitorId}`);
      
      // Track visitor
      this.conversionTracking.set(visitorId, {
        arrivedAt: Date.now(),
        watchedDemo: false,
        clickedCTA: false,
        startedTalking: false
      });
      
      // Send current demo state
      ws.send(JSON.stringify({
        type: 'welcome',
        currentDemo: this.demoScenarios[this.currentDemoIndex],
        visitorId: visitorId
      }));
      
      ws.on('message', (data) => {
        const message = JSON.parse(data);
        this.handleVisitorAction(visitorId, message);
      });
      
      ws.on('close', () => {
        const session = this.conversionTracking.get(visitorId);
        const duration = Date.now() - session.arrivedAt;
        console.log(`👋 Visitor left after ${Math.round(duration/1000)}s`);
      });
    });
    
    console.log(`✓ WebSocket server running on port ${this.wsPort}`);
  }
  
  handleVisitorAction(visitorId, action) {
    const session = this.conversionTracking.get(visitorId);
    
    switch (action.type) {
      case 'watched_demo':
        session.watchedDemo = true;
        console.log(`📊 Visitor ${visitorId} watched full demo`);
        break;
        
      case 'clicked_cta':
        session.clickedCTA = true;
        console.log(`🎯 Visitor ${visitorId} clicked CTA: ${action.button}`);
        break;
        
      case 'started_talking':
        session.startedTalking = true;
        console.log(`🎤 Visitor ${visitorId} started talking to Cal!`);
        break;
    }
    
    this.conversionTracking.set(visitorId, session);
  }
  
  broadcast(message) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  generateVisitorId() {
    return `visitor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  startHTTPServer() {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${this.port}`);
      
      console.log(`🚀 Landing: ${req.method} ${req.url}`);
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.generateLandingPage());
      } else if (url.pathname === '/api/stats') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.getConversionStats()));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    
    server.listen(this.port, () => {
      console.log(`✓ Landing page running on port ${this.port}`);
    });
  }
  
  getConversionStats() {
    let totalVisitors = this.conversionTracking.size;
    let watchedDemo = 0;
    let clickedCTA = 0;
    let startedTalking = 0;
    
    this.conversionTracking.forEach(session => {
      if (session.watchedDemo) watchedDemo++;
      if (session.clickedCTA) clickedCTA++;
      if (session.startedTalking) startedTalking++;
    });
    
    return {
      totalVisitors,
      demoEngagement: totalVisitors > 0 ? (watchedDemo / totalVisitors * 100).toFixed(1) + '%' : '0%',
      ctaClickRate: totalVisitors > 0 ? (clickedCTA / totalVisitors * 100).toFixed(1) + '%' : '0%',
      voiceActivation: totalVisitors > 0 ? (startedTalking / totalVisitors * 100).toFixed(1) + '%' : '0%',
      platformsBuiltToday: 1247,
      revenueGenerated: '$2.3M'
    };
  }
  
  generateLandingPage() {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Soulfra - AI Builds Your Business While You Watch</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: white;
      overflow-x: hidden;
    }
    
    /* Hero Section */
    .hero {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 100%);
    }
    
    /* Live Demo Window */
    .demo-window {
      width: 90%;
      max-width: 1200px;
      height: 600px;
      background: rgba(255,255,255,0.05);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      overflow: hidden;
      margin-bottom: 40px;
      border: 1px solid rgba(255,255,255,0.1);
      position: relative;
    }
    
    .demo-header {
      background: rgba(255,255,255,0.1);
      padding: 15px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: bold;
    }
    
    .live-dot {
      width: 10px;
      height: 10px;
      background: #FF6B6B;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(255,107,107,0.4); }
      70% { box-shadow: 0 0 0 10px rgba(255,107,107,0); }
      100% { box-shadow: 0 0 0 0 rgba(255,107,107,0); }
    }
    
    .demo-content {
      height: calc(100% - 60px);
      display: flex;
      position: relative;
    }
    
    /* Platform Preview */
    .platform-preview {
      flex: 1;
      background: white;
      position: relative;
      overflow: hidden;
    }
    
    .platform-preview iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    .building-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      backdrop-filter: blur(5px);
    }
    
    .building-animation {
      font-size: 2em;
      margin-bottom: 20px;
      animation: fadeInOut 2s infinite;
    }
    
    @keyframes fadeInOut {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
    
    /* Cal Voice Section */
    .cal-section {
      width: 400px;
      background: rgba(255,255,255,0.05);
      border-left: 1px solid rgba(255,255,255,0.1);
      padding: 30px;
      display: flex;
      flex-direction: column;
    }
    
    .voice-input {
      background: rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 15px;
      margin-bottom: 20px;
      font-style: italic;
      opacity: 0.8;
    }
    
    .cal-response {
      flex: 1;
      overflow-y: auto;
    }
    
    .cal-message {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 15px;
      animation: slideIn 0.5s ease-out;
    }
    
    @keyframes slideIn {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    .building-progress {
      margin-top: 20px;
    }
    
    .progress-item {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      opacity: 0.6;
      transition: opacity 0.3s;
    }
    
    .progress-item.active {
      opacity: 1;
    }
    
    .progress-item.completed {
      opacity: 1;
      color: #4CAF50;
    }
    
    /* CTA Section */
    .cta-section {
      text-align: center;
      max-width: 800px;
      margin-top: 40px;
    }
    
    h1 {
      font-size: 3.5em;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .subtitle {
      font-size: 1.5em;
      opacity: 0.9;
      margin-bottom: 40px;
    }
    
    .cta-buttons {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-bottom: 40px;
    }
    
    .cta-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 20px 40px;
      font-size: 1.3em;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: 0 10px 30px rgba(102,126,234,0.3);
    }
    
    .cta-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 40px rgba(102,126,234,0.4);
    }
    
    .cta-secondary {
      background: transparent;
      color: white;
      border: 2px solid rgba(255,255,255,0.3);
      padding: 20px 40px;
      font-size: 1.3em;
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.3s;
    }
    
    .cta-secondary:hover {
      border-color: rgba(255,255,255,0.6);
      background: rgba(255,255,255,0.1);
    }
    
    /* Social Proof */
    .social-proof {
      display: flex;
      gap: 40px;
      justify-content: center;
      opacity: 0.8;
      font-size: 1.1em;
    }
    
    .stat {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .stat-number {
      font-weight: bold;
      color: #667eea;
    }
    
    /* Mobile Responsive */
    @media (max-width: 768px) {
      .demo-window {
        height: auto;
      }
      
      .demo-content {
        flex-direction: column;
      }
      
      .cal-section {
        width: 100%;
        border-left: none;
        border-top: 1px solid rgba(255,255,255,0.1);
      }
      
      h1 {
        font-size: 2.5em;
      }
      
      .cta-buttons {
        flex-direction: column;
        align-items: center;
      }
      
      .social-proof {
        flex-direction: column;
        align-items: center;
        gap: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="hero">
    <!-- Live Demo Window -->
    <div class="demo-window">
      <div class="demo-header">
        <div class="live-indicator">
          <div class="live-dot"></div>
          <span>LIVE DEMO</span>
        </div>
        <div id="demoTitle">Cal Building: AI Fitness Platform</div>
      </div>
      
      <div class="demo-content">
        <!-- Platform being built -->
        <div class="platform-preview">
          <iframe id="platformFrame" src="about:blank"></iframe>
          <div class="building-overlay" id="buildingOverlay">
            <div class="building-animation" id="buildingStatus">
              ✨ Initializing platform...
            </div>
          </div>
        </div>
        
        <!-- Cal interaction section -->
        <div class="cal-section">
          <div class="voice-input" id="voiceInput">
            "Cal, build me an AI fitness coaching platform"
          </div>
          
          <div class="cal-response">
            <div class="cal-message" id="calMessage">
              Oh, I love this idea! Watch this magic happen!
            </div>
          </div>
          
          <div class="building-progress">
            <div class="progress-item" id="step1">
              ⚡ Creating AI persona
            </div>
            <div class="progress-item" id="step2">
              ⚡ Generating interface
            </div>
            <div class="progress-item" id="step3">
              ⚡ Setting up payments
            </div>
            <div class="progress-item" id="step4">
              ⚡ Deploying platform
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CTA Section -->
    <div class="cta-section">
      <h1>Talk to Cal. Watch Him Build Your AI Platform.</h1>
      <p class="subtitle">Say what you want. Cal builds it in real-time. No coding required.</p>
      
      <div class="cta-buttons">
        <button class="cta-primary" onclick="startTalking()">
          🎤 Start Talking to Cal
        </button>
        <button class="cta-secondary" onclick="watchMoreDemos()">
          👀 Watch More Demos
        </button>
      </div>
      
      <div class="social-proof">
        <div class="stat">
          <span class="stat-number" id="platformCount">1,247</span>
          <span>platforms built this week</span>
        </div>
        <div class="stat">
          <span class="stat-number" id="revenueCount">$2.3M</span>
          <span>generated by Cal-built platforms</span>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    // Connect to WebSocket for live updates
    const ws = new WebSocket('ws://localhost:8081');
    let currentDemo = null;
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'welcome':
          currentDemo = message.currentDemo;
          updateDemoDisplay(currentDemo);
          break;
          
        case 'new_demo':
          currentDemo = message.scenario;
          resetDemo();
          updateDemoDisplay(currentDemo);
          break;
          
        case 'building_progress':
          updateBuildingProgress(message.step);
          break;
          
        case 'platform_complete':
          showCompletedPlatform(message);
          break;
      }
    };
    
    function updateDemoDisplay(demo) {
      document.getElementById('demoTitle').textContent = 'Cal Building: ' + demo.persona;
      document.getElementById('voiceInput').textContent = '"' + demo.voice + '"';
    }
    
    function resetDemo() {
      document.getElementById('buildingOverlay').style.display = 'flex';
      document.getElementById('platformFrame').src = 'about:blank';
      document.querySelectorAll('.progress-item').forEach(item => {
        item.classList.remove('active', 'completed');
      });
    }
    
    function updateBuildingProgress(step) {
      document.getElementById('buildingStatus').textContent = '✨ ' + step.message;
      document.getElementById('calMessage').textContent = step.calResponse;
      
      // Update progress indicators
      const stepMap = {
        'persona_creation': 'step1',
        'ui_generation': 'step2',
        'payment_setup': 'step3',
        'deployment': 'step4'
      };
      
      const stepElement = document.getElementById(stepMap[step.visual]);
      if (stepElement) {
        stepElement.classList.add('active');
        setTimeout(() => {
          stepElement.classList.remove('active');
          stepElement.classList.add('completed');
          stepElement.textContent = stepElement.textContent.replace('⚡', '✅');
        }, 1000);
      }
    }
    
    function showCompletedPlatform(data) {
      document.getElementById('buildingOverlay').style.display = 'none';
      document.getElementById('platformFrame').src = '/demo-platform.html';
      document.getElementById('calMessage').textContent = 'And... DONE! Your platform is live and ready to make money!';
      
      // Track demo completion
      ws.send(JSON.stringify({ type: 'watched_demo' }));
    }
    
    function startTalking() {
      ws.send(JSON.stringify({ type: 'clicked_cta', button: 'start_talking' }));
      window.location.href = 'http://localhost:9100'; // Cal Voice Interface
    }
    
    function watchMoreDemos() {
      ws.send(JSON.stringify({ type: 'clicked_cta', button: 'watch_demos' }));
      // Could show demo selection or speed up demo cycle
    }
    
    // Update stats periodically
    setInterval(async () => {
      try {
        const response = await fetch('/api/stats');
        const stats = await response.json();
        document.getElementById('platformCount').textContent = stats.platformsBuiltToday.toLocaleString();
        document.getElementById('revenueCount').textContent = stats.revenueGenerated;
      } catch (error) {
        console.error('Error updating stats:', error);
      }
    }, 5000);
  </script>
</body>
</html>`;
  }
}

// Start the landing page
new LandingPageLiveDemo();