#!/usr/bin/env node

/**
 * 🏟️ DIGITAL COLISEUM LAUNCHER
 * 
 * Master orchestrator that launches the Digital Coliseum sports betting interface
 * along with all supporting infrastructure from the Soulfra platform.
 * 
 * "Where gladiators meet AI, and every game becomes profit."
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const express = require('express');

class DigitalColiseumLauncher {
  constructor() {
    this.app = express();
    this.runningProcesses = new Map();
    this.launchPort = 4245;
    
    this.components = {
      'Sports API Integrator': {
        file: './sports-api-integrator.js',
        port: 4244,
        status: 'stopped'
      },
      'Digital Coliseum UI': {
        file: './digital-coliseum.html',
        port: 'static',
        status: 'stopped'
      },
      'Soulfra Clarity Engine': {
        file: './soulfra_clarity_engine.tsx',
        port: 'component',
        status: 'stopped'
      },
      'Master Command Center': {
        file: './soulfra-command-matrix.html',
        port: 'static',
        status: 'stopped'
      },
      'Reality Engine': {
        file: './soulfra_reality_engine.tsx',
        port: 'component',
        status: 'stopped'
      }
    };
    
    this.setupRoutes();
  }
  
  /**
   * Setup Express routes for the launcher interface
   */
  setupRoutes() {
    this.app.use(express.static('.'));
    this.app.use(express.json());
    
    // Main launcher page - starts with fake broken template
    this.app.get('/', (req, res) => {
      if (req.query.bypass === 'true') {
        res.send(this.generateLauncherHTML());
      } else {
        res.sendFile(path.join(__dirname, 'fake-broken-template.html'));
      }
    });
    
    // Real launcher (hidden behind deception layer)
    this.app.get('/real-launcher', (req, res) => {
      res.send(this.generateLauncherHTML());
    });
    
    // Landing page reveal
    this.app.get('/landing-reveal', (req, res) => {
      res.sendFile(path.join(__dirname, 'soulfra-landing-reveal.html'));
    });
    
    // Reality Engine reveal (the ultimate layer)
    this.app.get('/reality-engine', (req, res) => {
      res.sendFile(path.join(__dirname, 'soulfra_reality_engine.tsx'));
    });
    
    // Component status API
    this.app.get('/api/status', (req, res) => {
      res.json({
        components: this.components,
        processes: Array.from(this.runningProcesses.keys()),
        systemHealth: this.getSystemHealth()
      });
    });
    
    // Launch component
    this.app.post('/api/launch/:component', async (req, res) => {
      const componentName = req.params.component;
      try {
        await this.launchComponent(componentName);
        res.json({ success: true, message: `${componentName} launched successfully` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // Stop component
    this.app.post('/api/stop/:component', async (req, res) => {
      const componentName = req.params.component;
      try {
        await this.stopComponent(componentName);
        res.json({ success: true, message: `${componentName} stopped successfully` });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    // Launch all components
    this.app.post('/api/launch-all', async (req, res) => {
      try {
        await this.launchAllComponents();
        res.json({ success: true, message: 'All components launched' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }
  
  /**
   * Generate the launcher HTML interface
   */
  generateLauncherHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🏟️ Digital Coliseum - Master Launcher</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff00;
            min-height: 100vh;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff00;
            border-radius: 15px;
            box-shadow: 0 0 30px rgba(0, 255, 0, 0.3);
        }
        
        .header h1 {
            font-size: 36px;
            color: #00ff00;
            text-shadow: 0 0 20px #00ff00;
            margin-bottom: 10px;
            letter-spacing: 3px;
        }
        
        .header p {
            font-size: 18px;
            color: #00cccc;
            margin-bottom: 20px;
        }
        
        .launch-all {
            background: linear-gradient(45deg, #ff4500, #ff6347);
            border: none;
            color: white;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        
        .launch-all:hover {
            background: linear-gradient(45deg, #ff6347, #ff4500);
            transform: scale(1.05);
            box-shadow: 0 0 20px rgba(255, 69, 0, 0.5);
        }
        
        .components-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }
        
        .component-card {
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid #333;
            border-radius: 15px;
            padding: 25px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .component-card:hover {
            border-color: #00ff00;
            box-shadow: 0 0 25px rgba(0, 255, 0, 0.2);
            transform: translateY(-5px);
        }
        
        .component-card.active {
            border-color: #00ff00;
            background: rgba(0, 255, 0, 0.1);
        }
        
        .component-title {
            font-size: 20px;
            color: #00ff00;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #666;
            animation: pulse 2s infinite;
        }
        
        .status-indicator.running {
            background: #00ff00;
            box-shadow: 0 0 10px #00ff00;
        }
        
        .status-indicator.stopped {
            background: #ff4444;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .component-description {
            color: #cccccc;
            margin-bottom: 15px;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .component-actions {
            display: flex;
            gap: 10px;
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            transition: all 0.3s ease;
        }
        
        .btn-launch {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            color: white;
        }
        
        .btn-launch:hover {
            background: linear-gradient(45deg, #45a049, #4CAF50);
            transform: scale(1.05);
        }
        
        .btn-stop {
            background: linear-gradient(45deg, #f44336, #da190b);
            color: white;
        }
        
        .btn-stop:hover {
            background: linear-gradient(45deg, #da190b, #f44336);
            transform: scale(1.05);
        }
        
        .btn-view {
            background: linear-gradient(45deg, #2196F3, #0b7dda);
            color: white;
        }
        
        .btn-view:hover {
            background: linear-gradient(45deg, #0b7dda, #2196F3);
            transform: scale(1.05);
        }
        
        .system-status {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00ff00;
            border-radius: 15px;
            padding: 25px;
            margin-bottom: 20px;
        }
        
        .system-status h3 {
            color: #00ff00;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .status-item {
            background: rgba(0, 255, 0, 0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .status-value {
            font-size: 24px;
            color: #00ff00;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .status-label {
            color: #cccccc;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .quick-links {
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00cccc;
            border-radius: 15px;
            padding: 25px;
        }
        
        .quick-links h3 {
            color: #00cccc;
            margin-bottom: 15px;
            font-size: 18px;
        }
        
        .links-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .quick-link {
            background: rgba(0, 204, 204, 0.1);
            padding: 15px;
            border-radius: 8px;
            text-decoration: none;
            color: #00cccc;
            transition: all 0.3s ease;
            border: 1px solid #00cccc;
        }
        
        .quick-link:hover {
            background: rgba(0, 204, 204, 0.2);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 204, 204, 0.3);
        }
        
        .terminal {
            background: #000;
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
            height: 200px;
            overflow-y: auto;
            font-family: 'Courier New', monospace;
        }
        
        .terminal-line {
            color: #00ff00;
            margin-bottom: 5px;
        }
        
        .terminal-line.error {
            color: #ff4444;
        }
        
        .terminal-line.info {
            color: #00cccc;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏟️ DIGITAL COLISEUM</h1>
            <p>Master Control Center - Where Gladiators Meet AI</p>
            <button class="launch-all" onclick="launchAll()">🚀 LAUNCH COLISEUM</button>
        </div>
        
        <div class="system-status">
            <h3>📊 System Status</h3>
            <div class="status-grid">
                <div class="status-item">
                    <div class="status-value" id="activeComponents">0</div>
                    <div class="status-label">Active Components</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="systemHealth">HEALTHY</div>
                    <div class="status-label">System Health</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="apiConnections">0</div>
                    <div class="status-label">API Connections</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="uptimeValue">00:00</div>
                    <div class="status-label">Uptime</div>
                </div>
            </div>
        </div>
        
        <div class="components-grid" id="componentsGrid">
            <!-- Components will be loaded here -->
        </div>
        
        <div class="quick-links">
            <h3>🔗 Quick Access</h3>
            <div class="links-grid">
                <a href="./digital-coliseum.html" class="quick-link" target="_blank">
                    🏟️ Digital Coliseum Arena
                </a>
                <a href="./soulfra-command-matrix.html" class="quick-link" target="_blank">
                    🕹️ Command Matrix
                </a>
                <a href="http://localhost:4244" class="quick-link" target="_blank">
                    📡 Sports API (Port 4244)
                </a>
                <a href="#" class="quick-link" onclick="showTerminal()">
                    💻 System Terminal
                </a>
            </div>
        </div>
        
        <div class="terminal" id="terminal" style="display: none;">
            <div id="terminalContent">
                <div class="terminal-line">🏟️ Digital Coliseum Master Launcher initialized...</div>
                <div class="terminal-line info">📡 Ready to launch components</div>
            </div>
        </div>
    </div>
    
    <script>
        let systemStartTime = Date.now();
        
        const components = {
            'Sports API Integrator': {
                description: 'Real-time sports data processing with ESPN API integration and gladiator transformation',
                file: 'sports-api-integrator.js',
                port: 4244,
                viewUrl: 'http://localhost:4244'
            },
            'Digital Coliseum UI': {
                description: 'Roman coliseum-themed sports betting interface with live gladiator battles',
                file: 'digital-coliseum.html',
                viewUrl: './digital-coliseum.html'
            },
            'Command Matrix': {
                description: 'Master control center for all Soulfra platform components',
                file: 'soulfra-command-matrix.html',
                viewUrl: './soulfra-command-matrix.html'
            },
            'Clarity Engine': {
                description: 'AI-to-AI communication layer for optimizing human interactions',
                file: 'soulfra_clarity_engine.tsx',
                viewUrl: '#'
            },
            'Reality Engine': {
                description: 'Universal reality coordination system - optimizes existence across space, time, and consciousness',
                file: 'soulfra_reality_engine.tsx',
                viewUrl: './reality-engine'
            }
        };
        
        function updateStatus() {
            fetch('/api/status')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('activeComponents').textContent = data.processes.length;
                    document.getElementById('systemHealth').textContent = data.systemHealth;
                    document.getElementById('apiConnections').textContent = Object.keys(data.components).length;
                    
                    const uptime = Math.floor((Date.now() - systemStartTime) / 1000);
                    const minutes = Math.floor(uptime / 60);
                    const seconds = uptime % 60;
                    document.getElementById('uptimeValue').textContent = 
                        \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
                    
                    updateComponentsGrid(data.components);
                })
                .catch(error => {
                    console.error('Status update failed:', error);
                    addTerminalLine('❌ Status update failed: ' + error.message, 'error');
                });
        }
        
        function updateComponentsGrid(componentStatus) {
            const grid = document.getElementById('componentsGrid');
            grid.innerHTML = '';
            
            Object.entries(components).forEach(([name, config]) => {
                const status = componentStatus[name] || { status: 'stopped' };
                const card = document.createElement('div');
                card.className = \`component-card \${status.status === 'running' ? 'active' : ''}\`;
                
                card.innerHTML = \`
                    <div class="component-title">
                        \${name}
                        <div class="status-indicator \${status.status}"></div>
                    </div>
                    <div class="component-description">\${config.description}</div>
                    <div class="component-actions">
                        <button class="btn btn-launch" onclick="launchComponent('\${name}')">Launch</button>
                        <button class="btn btn-stop" onclick="stopComponent('\${name}')">Stop</button>
                        <button class="btn btn-view" onclick="viewComponent('\${name}')">View</button>
                    </div>
                \`;
                
                grid.appendChild(card);
            });
        }
        
        function launchComponent(name) {
            addTerminalLine(\`🚀 Launching \${name}...\`, 'info');
            
            fetch(\`/api/launch/\${encodeURIComponent(name)}\`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        addTerminalLine(\`✅ \${name} launched successfully\`);
                    } else {
                        addTerminalLine(\`❌ Failed to launch \${name}: \${data.error}\`, 'error');
                    }
                    updateStatus();
                })
                .catch(error => {
                    addTerminalLine(\`❌ Launch failed: \${error.message}\`, 'error');
                });
        }
        
        function stopComponent(name) {
            addTerminalLine(\`🛑 Stopping \${name}...\`, 'info');
            
            fetch(\`/api/stop/\${encodeURIComponent(name)}\`, { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        addTerminalLine(\`⏹️ \${name} stopped successfully\`);
                    } else {
                        addTerminalLine(\`❌ Failed to stop \${name}: \${data.error}\`, 'error');
                    }
                    updateStatus();
                })
                .catch(error => {
                    addTerminalLine(\`❌ Stop failed: \${error.message}\`, 'error');
                });
        }
        
        function viewComponent(name) {
            const config = components[name];
            if (config && config.viewUrl && config.viewUrl !== '#') {
                window.open(config.viewUrl, '_blank');
                addTerminalLine(\`👁️ Opening \${name} in new window\`);
            } else {
                addTerminalLine(\`⚠️ No view URL configured for \${name}\`, 'error');
            }
        }
        
        function launchAll() {
            addTerminalLine('🚀 Launching all Digital Coliseum components...', 'info');
            
            fetch('/api/launch-all', { method: 'POST' })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        addTerminalLine('✅ All components launched successfully');
                        setTimeout(() => {
                            window.open('./digital-coliseum.html', '_blank');
                        }, 2000);
                    } else {
                        addTerminalLine(\`❌ Failed to launch all components: \${data.error}\`, 'error');
                    }
                    updateStatus();
                })
                .catch(error => {
                    addTerminalLine(\`❌ Launch all failed: \${error.message}\`, 'error');
                });
        }
        
        function showTerminal() {
            const terminal = document.getElementById('terminal');
            terminal.style.display = terminal.style.display === 'none' ? 'block' : 'none';
        }
        
        function addTerminalLine(text, type = '') {
            const content = document.getElementById('terminalContent');
            const line = document.createElement('div');
            line.className = \`terminal-line \${type}\`;
            line.textContent = \`[\${new Date().toLocaleTimeString()}] \${text}\`;
            content.appendChild(line);
            content.scrollTop = content.scrollHeight;
        }
        
        // Initialize
        updateStatus();
        setInterval(updateStatus, 5000);
        
        // Welcome message
        setTimeout(() => {
            addTerminalLine('🏟️ Welcome to the Digital Coliseum!');
            addTerminalLine('📊 All systems ready for gladiator combat');
        }, 1000);
    </script>
</body>
</html>
    `;
  }
  
  /**
   * Launch a specific component
   */
  async launchComponent(componentName) {
    const component = this.components[componentName];
    if (!component) {
      throw new Error(`Component ${componentName} not found`);
    }
    
    if (component.status === 'running') {
      throw new Error(`Component ${componentName} is already running`);
    }
    
    console.log(`🚀 Launching ${componentName}...`);
    
    try {
      if (component.file.endsWith('.js')) {
        // Launch Node.js process
        const process = spawn('node', [component.file], {
          detached: false,
          stdio: 'inherit'
        });
        
        this.runningProcesses.set(componentName, process);
        component.status = 'running';
        
        process.on('close', (code) => {
          console.log(`${componentName} exited with code ${code}`);
          this.runningProcesses.delete(componentName);
          component.status = 'stopped';
        });
        
        // Give it a moment to start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } else {
        // For HTML/static files, just mark as available
        component.status = 'running';
      }
      
      console.log(`✅ ${componentName} launched successfully`);
      
    } catch (error) {
      component.status = 'error';
      throw new Error(`Failed to launch ${componentName}: ${error.message}`);
    }
  }
  
  /**
   * Stop a specific component
   */
  async stopComponent(componentName) {
    const component = this.components[componentName];
    if (!component) {
      throw new Error(`Component ${componentName} not found`);
    }
    
    const process = this.runningProcesses.get(componentName);
    if (process) {
      process.kill();
      this.runningProcesses.delete(componentName);
    }
    
    component.status = 'stopped';
    console.log(`⏹️ ${componentName} stopped`);
  }
  
  /**
   * Launch all components
   */
  async launchAllComponents() {
    console.log('🚀 Launching all Digital Coliseum components...');
    
    for (const componentName of Object.keys(this.components)) {
      try {
        await this.launchComponent(componentName);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Stagger launches
      } catch (error) {
        console.error(`Failed to launch ${componentName}:`, error.message);
        // Continue with other components
      }
    }
    
    console.log('✅ Digital Coliseum launch sequence complete!');
  }
  
  /**
   * Get overall system health
   */
  getSystemHealth() {
    const runningCount = this.runningProcesses.size;
    const totalComponents = Object.keys(this.components).length;
    
    if (runningCount === 0) return 'OFFLINE';
    if (runningCount < totalComponents / 2) return 'DEGRADED';
    if (runningCount === totalComponents) return 'OPTIMAL';
    return 'HEALTHY';
  }
  
  /**
   * Start the launcher server
   */
  async start() {
    // Check if sports-api-integrator.js exists
    if (!fs.existsSync('./sports-api-integrator.js')) {
      console.error('❌ sports-api-integrator.js not found in current directory');
      console.log('🔍 Current directory:', process.cwd());
      console.log('📁 Available files:', fs.readdirSync('.').filter(f => f.endsWith('.js')).slice(0, 10));
      process.exit(1);
    }
    
    // Start the launcher web interface
    this.app.listen(this.launchPort, () => {
      console.log('🏟️ Digital Coliseum Master Launcher started!');
      console.log(`🚀 Launch Control: http://localhost:${this.launchPort}`);
      console.log('⚔️ Ready to deploy gladiator infrastructure...');
      console.log('');
      console.log('📋 Available components:');
      Object.keys(this.components).forEach(name => {
        console.log(`   🎯 ${name}`);
      });
      console.log('');
      console.log('🎮 Open http://localhost:4245 to control the Digital Coliseum');
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\\n🛑 Shutting down Digital Coliseum...');
      
      // Stop all running components
      for (const [name, process] of this.runningProcesses) {
        console.log(`⏹️ Stopping ${name}...`);
        process.kill();
      }
      
      console.log('👋 Digital Coliseum shut down complete');
      process.exit(0);
    });
  }
}

// Run if called directly
if (require.main === module) {
  const launcher = new DigitalColiseumLauncher();
  launcher.start().catch(error => {
    console.error('❌ Failed to start Digital Coliseum Launcher:', error);
    process.exit(1);
  });
}

module.exports = DigitalColiseumLauncher;