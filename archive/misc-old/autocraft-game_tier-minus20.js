#!/usr/bin/env node

/**
 * 🎮 AUTOCRAFT: The Automation Building Game
 * Where business process automation feels like Minecraft
 */

const http = require('http');
const fs = require('./fs');
const path = require('./path');

class AutoCraftGame {
  constructor() {
    this.port = process.env.PORT || 3000;
    this.games = new Map();
    this.analytics = [];
  }

  // Create the game HTML
  getGameHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>🎮 AutoCraft - Build Automation Magic!</title>
  <style>
    body {
      font-family: 'Comic Sans MS', cursive;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
      padding: 20px;
      min-height: 100vh;
    }
    
    .game-container {
      max-width: 1200px;
      margin: 0 auto;
      background: rgba(0,0,0,0.3);
      border-radius: 20px;
      padding: 30px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .game-board {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 10px;
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 15px;
      min-height: 400px;
    }
    
    .block {
      width: 100%;
      height: 80px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: grab;
      transition: all 0.3s;
      font-size: 14px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    }
    
    .block:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 12px rgba(0,0,0,0.4);
    }
    
    .block.trigger { background: #f59e0b; }
    .block.action { background: #10b981; }
    .block.condition { background: #3b82f6; }
    .block.output { background: #8b5cf6; }
    
    .toolbox {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .tool {
      padding: 15px;
      border-radius: 10px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
      background: rgba(255,255,255,0.2);
    }
    
    .tool:hover {
      background: rgba(255,255,255,0.3);
      transform: scale(1.05);
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 30px;
    }
    
    .stat-card {
      background: rgba(255,255,255,0.1);
      padding: 20px;
      border-radius: 10px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #fbbf24;
    }
    
    button {
      background: #10b981;
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 10px;
      font-size: 18px;
      cursor: pointer;
      transition: all 0.3s;
      margin: 10px;
    }
    
    button:hover {
      background: #059669;
      transform: scale(1.05);
    }
    
    .automation-preview {
      background: rgba(0,0,0,0.3);
      padding: 20px;
      border-radius: 10px;
      margin-top: 20px;
      font-family: monospace;
    }
    
    @keyframes sparkle {
      0% { opacity: 0; }
      50% { opacity: 1; }
      100% { opacity: 0; }
    }
    
    .sparkle {
      position: absolute;
      animation: sparkle 1s infinite;
    }
  </style>
</head>
<body>
  <div class="game-container">
    <div class="header">
      <h1>🎮 AutoCraft: Build Magic Automation!</h1>
      <p>Drag blocks to create business automation - It's like Minecraft for work!</p>
    </div>
    
    <div class="toolbox">
      <div class="tool" onclick="addBlock('trigger', '📧 Email Arrives')">
        <div>📧 Email Trigger</div>
      </div>
      <div class="tool" onclick="addBlock('trigger', '⏰ Every Hour')">
        <div>⏰ Time Trigger</div>
      </div>
      <div class="tool" onclick="addBlock('action', '📤 Send Message')">
        <div>📤 Send Action</div>
      </div>
      <div class="tool" onclick="addBlock('action', '💾 Save Data')">
        <div>💾 Save Action</div>
      </div>
      <div class="tool" onclick="addBlock('condition', '❓ If Contains')">
        <div>❓ If Condition</div>
      </div>
      <div class="tool" onclick="addBlock('condition', '🔄 Loop 5 Times')">
        <div>🔄 Loop Block</div>
      </div>
      <div class="tool" onclick="addBlock('output', '📊 Create Report')">
        <div>📊 Report Output</div>
      </div>
      <div class="tool" onclick="addBlock('output', '🎉 Celebrate!')">
        <div>🎉 Celebrate!</div>
      </div>
    </div>
    
    <div class="game-board" id="gameBoard">
      <!-- Automation blocks go here -->
    </div>
    
    <div style="text-align: center; margin-top: 20px;">
      <button onclick="runAutomation()">▶️ Run My Automation!</button>
      <button onclick="saveAutomation()">💾 Save Creation</button>
      <button onclick="clearBoard()">🗑️ Clear Board</button>
    </div>
    
    <div class="automation-preview" id="preview" style="display: none;">
      <h3>🤖 Your Automation Recipe:</h3>
      <pre id="recipeText"></pre>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div>⚡ Blocks Used</div>
        <div class="stat-value" id="blockCount">0</div>
      </div>
      <div class="stat-card">
        <div>⏱️ Time Saved</div>
        <div class="stat-value" id="timeSaved">0h</div>
      </div>
      <div class="stat-card">
        <div>💰 Value Created</div>
        <div class="stat-value" id="valueCreated">$0</div>
      </div>
      <div class="stat-card">
        <div>🏆 Level</div>
        <div class="stat-value" id="level">1</div>
      </div>
    </div>
  </div>
  
  <script>
    let blocks = [];
    let blockId = 0;
    
    function addBlock(type, label) {
      const board = document.getElementById('gameBoard');
      const block = document.createElement('div');
      block.className = 'block ' + type;
      block.textContent = label;
      block.id = 'block-' + blockId++;
      block.draggable = true;
      
      block.ondragstart = (e) => {
        e.dataTransfer.setData('text', e.target.id);
      };
      
      board.appendChild(block);
      blocks.push({ type, label, id: block.id });
      updateStats();
      
      // Microinteraction tracking
      trackEvent('block_added', { type, label });
    }
    
    function runAutomation() {
      if (blocks.length === 0) {
        alert('Add some blocks first! 🎮');
        return;
      }
      
      // Show the automation recipe
      const preview = document.getElementById('preview');
      const recipe = document.getElementById('recipeText');
      
      let recipeText = 'WHEN ';
      blocks.forEach((block, i) => {
        if (block.type === 'trigger') {
          recipeText += block.label + '\\n';
        } else if (block.type === 'condition') {
          recipeText += 'IF ' + block.label + '\\n';
        } else if (block.type === 'action') {
          recipeText += 'THEN ' + block.label + '\\n';
        } else {
          recipeText += 'FINALLY ' + block.label + '\\n';
        }
      });
      
      recipe.textContent = recipeText;
      preview.style.display = 'block';
      
      // Celebrate!
      celebrate();
      
      // Track completion
      trackEvent('automation_run', { blocks: blocks.length });
    }
    
    function celebrate() {
      // Add sparkles
      for (let i = 0; i < 20; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.textContent = '✨';
        sparkle.style.left = Math.random() * window.innerWidth + 'px';
        sparkle.style.top = Math.random() * window.innerHeight + 'px';
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
      }
      
      // Update stats with rewards
      const saved = blocks.length * 10;
      document.getElementById('timeSaved').textContent = saved + 'min';
      document.getElementById('valueCreated').textContent = '$' + (saved * 5);
      
      if (blocks.length > 5) {
        document.getElementById('level').textContent = '2';
        alert('🎉 Level Up! You are now an Automation Wizard!');
      }
    }
    
    function saveAutomation() {
      const name = prompt('Name your automation:');
      if (name) {
        // In real app, this would save to backend
        localStorage.setItem('automation-' + Date.now(), JSON.stringify({
          name,
          blocks,
          created: new Date()
        }));
        alert('✅ Saved! You can load it anytime!');
        trackEvent('automation_saved', { name, blocks: blocks.length });
      }
    }
    
    function clearBoard() {
      if (confirm('Clear your creation?')) {
        document.getElementById('gameBoard').innerHTML = '';
        blocks = [];
        updateStats();
      }
    }
    
    function updateStats() {
      document.getElementById('blockCount').textContent = blocks.length;
    }
    
    // Freight-industry level tracking
    function trackEvent(event, data) {
      // In real app, this would send to analytics
      console.log('📊 Track:', event, data);
      
      // Microinteraction tracking
      const analytics = {
        event,
        data,
        timestamp: Date.now(),
        mousePosition: { x: window.mouseX || 0, y: window.mouseY || 0 },
        timeOnPage: Date.now() - window.pageLoadTime,
        device: navigator.userAgent
      };
      
      // Send to backend
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analytics)
      }).catch(() => { return ; });
    }
    
    // Track mouse for heatmaps
    window.pageLoadTime = Date.now();
    document.addEventListener('mousemove', (e) => {
      window.mouseX = e.clientX;
      window.mouseY = e.clientY;
    });
    
    // Track everything!
    trackEvent('page_load', { page: 'autocraft' });
  </script>
</body>
</html>
    `;
  }

  // Analytics endpoint
  handleAnalytics(data) {
    this.analytics.push({
      ...data,
      serverTime: new Date().toISOString()
    });
    
    // Log for freight-industry style tracking
    console.log(`[TRACK] ${data.event} at ${data.timestamp}`);
  }

  start() {
    const server = http.createServer((req, res) => { return console.log(`[${new Date().toISOString(); }] ${req.method} ${req.url}`);
      
      if (req.url === '/' || req.url === '/autocraft') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.getGameHTML());
      } else if (req.url === '/api/track' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            this.handleAnalytics(data);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'tracked' }));
          } catch (e) {
            res.writeHead(400);
            res.end('Invalid data');
          }
        });
      } else if (req.url === '/api/analytics') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          totalEvents: this.analytics.length,
          events: this.analytics.slice(-100) // Last 100 events
        }));
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    
    server.listen(this.port, () => { return console.log(`
╔══════════════════════════════════════════════════════════╗
║                  🎮 AUTOCRAFT GAME RUNNING                ║
╚══════════════════════════════════════════════════════════╝

Game URL: http://localhost:${this.port; }
Analytics: http://localhost:${this.port}/api/analytics

Features:
✓ Drag-and-drop automation building
✓ Gamified UI for all ages
✓ Freight-industry tracking
✓ Real business value creation

Press Ctrl+C to stop
      `);
    });
  }
}

// Start the game
const game = new AutoCraftGame();
game.start();

// Auto-added export
module.exports = {};
