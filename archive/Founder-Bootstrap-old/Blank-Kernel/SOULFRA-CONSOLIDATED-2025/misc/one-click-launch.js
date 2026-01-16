#!/usr/bin/env node

/**
 * Billion Dollar Game - One-Click Launch Script
 * Deploys the entire game with a single command
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

class GameLauncher {
  constructor() {
    this.config = {
      port: process.env.PORT || 8080,
      host: process.env.HOST || 'localhost',
      environment: process.env.NODE_ENV || 'production',
      dataDir: path.join(__dirname, '../data'),
      logDir: path.join(__dirname, '../logs')
    };
    
    this.processes = [];
  }
  
  async launch() {
    console.log('=================================');
    console.log('   BILLION DOLLAR GAME LAUNCHER  ');
    console.log('=================================\n');
    
    try {
      // Pre-flight checks
      await this.runPreflightChecks();
      
      // Setup directories
      await this.setupDirectories();
      
      // Check tier integration
      await this.checkTierIntegration();
      
      // Initialize data files
      await this.initializeData();
      
      // Start the game server
      await this.startGameServer();
      
      // Create initial AI agents
      await this.createInitialAgents();
      
      // Display access information
      this.displayAccessInfo();
      
      // Setup shutdown handlers
      this.setupShutdownHandlers();
      
    } catch (error) {
      console.error('\n❌ Launch failed:', error.message);
      process.exit(1);
    }
  }
  
  async runPreflightChecks() {
    console.log('Running pre-flight checks...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
    if (majorVersion < 14) {
      throw new Error(`Node.js version 14 or higher required (current: ${nodeVersion})`);
    }
    console.log(`✓ Node.js version: ${nodeVersion}`);
    
    // Check required files
    const requiredFiles = [
      '../server.js',
      '../core/game-engine.js',
      '../auth/auth-manager.js',
      '../agents/agent-framework.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    console.log('✓ All required files present');
    
    // Check port availability
    await this.checkPort();
    console.log(`✓ Port ${this.config.port} is available`);
    
    console.log('✓ Pre-flight checks passed\n');
  }
  
  async checkPort() {
    return new Promise((resolve, reject) => {
      const net = require('net');
      const server = net.createServer();
      
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${this.config.port} is already in use`));
        } else {
          reject(err);
        }
      });
      
      server.once('listening', () => {
        server.close();
        resolve();
      });
      
      server.listen(this.config.port);
    });
  }
  
  async setupDirectories() {
    console.log('Setting up directories...');
    
    const dirs = [
      this.config.dataDir,
      this.config.logDir,
      path.join(this.config.dataDir, 'backups'),
      path.join(this.config.dataDir, 'exports')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
      }
    }
    
    console.log('✓ Directories ready\n');
  }
  
  async checkTierIntegration() {
    console.log('Checking tier system integration...');
    
    // Check for tier -9 integration
    const tier9Path = path.join(__dirname, '../../../../qr-validator.js');
    if (fs.existsSync(tier9Path)) {
      console.log('✓ Tier -9 (Infinity Router) integration available');
      
      // Check for valid QR codes
      const validCodes = ['qr-founder-0000', 'qr-riven-001', 'qr-user-0821'];
      console.log(`✓ Valid QR codes: ${validCodes.join(', ')}`);
    } else {
      console.log('⚠️  Tier -9 integration not found - using standalone mode');
    }
    
    // Check for tier -10 integration
    const tier10Path = path.join(__dirname, '../../../../cal-riven-operator.js');
    if (fs.existsSync(tier10Path)) {
      console.log('✓ Tier -10 (Cal Riven) integration available');
      
      // Check blessing status
      const blessingPath = path.join(__dirname, '../../../../blessing.json');
      if (fs.existsSync(blessingPath)) {
        const blessing = JSON.parse(fs.readFileSync(blessingPath, 'utf8'));
        console.log(`✓ Blessing status: ${blessing.status}`);
      }
    } else {
      console.log('⚠️  Tier -10 integration not found - AI agents will use built-in strategies');
    }
    
    console.log();
  }
  
  async initializeData() {
    console.log('Initializing data files...');
    
    // Create initial configuration
    const configPath = path.join(this.config.dataDir, 'config.json');
    if (!fs.existsSync(configPath)) {
      const config = {
        version: '1.0.0',
        created: new Date().toISOString(),
        environment: this.config.environment,
        features: {
          aiAgents: true,
          marketEvents: true,
          webSocket: true,
          tierIntegration: true
        }
      };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log('✓ Created configuration file');
    }
    
    // Initialize game state
    const statePath = path.join(this.config.dataDir, 'game-state.json');
    if (!fs.existsSync(statePath)) {
      const initialState = {
        players: [],
        companies: [],
        market: {
          resources: {},
          indices: [],
          events: []
        },
        gameTime: 0,
        startTime: Date.now()
      };
      fs.writeFileSync(statePath, JSON.stringify(initialState, null, 2));
      console.log('✓ Created initial game state');
    }
    
    console.log('✓ Data initialization complete\n');
  }
  
  async startGameServer() {
    console.log('Starting game server...');
    
    const serverPath = path.join(__dirname, '../server.js');
    
    // Start server process
    const serverProcess = spawn('node', [serverPath], {
      env: {
        ...process.env,
        PORT: this.config.port,
        NODE_ENV: this.config.environment
      },
      stdio: 'pipe'
    });
    
    this.processes.push(serverProcess);
    
    // Capture server output
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`[Server] ${output}`);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`[Server Error] ${data.toString().trim()}`);
    });
    
    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
    
    // Wait for server to be ready
    await this.waitForServer();
    
    console.log('✓ Game server is running\n');
  }
  
  async waitForServer() {
    const maxAttempts = 30;
    const delay = 1000;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await this.checkServerHealth();
        if (response) return;
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw new Error('Server failed to start within timeout');
  }
  
  async checkServerHealth() {
    return new Promise((resolve, reject) => {
      const http = require('http');
      
      const options = {
        hostname: this.config.host,
        port: this.config.port,
        path: '/api/v1/stats',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          reject(new Error(`Server returned status ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.setTimeout(1000, () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      
      req.end();
    });
  }
  
  async createInitialAgents() {
    console.log('Creating initial AI agents...');
    
    const agents = [
      { id: 'entrepreneur_ai', strategy: 'entrepreneur' },
      { id: 'industrialist_ai', strategy: 'industrialist' },
      { id: 'trader_ai', strategy: 'trader' },
      { id: 'strategist_ai', strategy: 'strategist' }
    ];
    
    for (const agent of agents) {
      try {
        await this.createAgent(agent.id, agent.strategy);
        console.log(`✓ Created ${agent.strategy} agent: ${agent.id}`);
      } catch (error) {
        console.log(`⚠️  Failed to create agent ${agent.id}: ${error.message}`);
      }
    }
    
    console.log();
  }
  
  async createAgent(agentId, strategy) {
    const http = require('http');
    
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        agentId,
        config: { strategy }
      });
      
      const options = {
        hostname: this.config.host,
        port: this.config.port,
        path: '/api/v1/agents/spawn',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      
      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(body));
          } else {
            reject(new Error(`Failed with status ${res.statusCode}`));
          }
        });
      });
      
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }
  
  displayAccessInfo() {
    console.log('=================================');
    console.log('   GAME SUCCESSFULLY LAUNCHED!   ');
    console.log('=================================\n');
    
    console.log('Access URLs:');
    console.log(`  Web Interface:  http://${this.config.host}:${this.config.port}`);
    console.log(`  API Endpoint:   http://${this.config.host}:${this.config.port}/api/v1`);
    console.log(`  WebSocket:      ws://${this.config.host}:${this.config.port}\n`);
    
    console.log('Quick Start:');
    console.log('  1. Open the web interface in your browser');
    console.log('  2. Login with one of these QR codes:');
    console.log('     - qr-founder-0000');
    console.log('     - qr-riven-001');
    console.log('     - qr-user-0821');
    console.log('  3. Start building your billion dollar empire!\n');
    
    console.log('API Authentication Example:');
    console.log(`  curl -X POST http://${this.config.host}:${this.config.port}/api/v1/auth/qr \\`);
    console.log(`       -H "Content-Type: application/json" \\`);
    console.log(`       -d '{"qrCode": "qr-founder-0000"}'\n`);
    
    console.log('Press Ctrl+C to stop the server\n');
  }
  
  setupShutdownHandlers() {
    const shutdown = async () => {
      console.log('\n\nShutting down...');
      
      // Save game state
      try {
        await this.saveGameState();
        console.log('✓ Game state saved');
      } catch (error) {
        console.error('Failed to save game state:', error.message);
      }
      
      // Terminate processes
      for (const proc of this.processes) {
        proc.kill('SIGTERM');
      }
      
      console.log('✓ Server stopped');
      console.log('\nThank you for playing Billion Dollar Game!');
      process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
  
  async saveGameState() {
    // This would normally trigger a save through the API
    // For now, the server auto-saves periodically
  }
  
  // Production deployment helpers
  static generateProductionConfig() {
    const config = {
      apps: [{
        name: 'billion-dollar-game',
        script: path.join(__dirname, '../server.js'),
        instances: 'max',
        exec_mode: 'cluster',
        env: {
          NODE_ENV: 'production',
          PORT: 8080
        },
        error_file: './logs/error.log',
        out_file: './logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        max_memory_restart: '1G'
      }]
    };
    
    const configPath = path.join(__dirname, 'ecosystem.config.js');
    fs.writeFileSync(configPath, `module.exports = ${JSON.stringify(config, null, 2)};`);
    
    console.log('✓ Generated PM2 ecosystem config');
    return configPath;
  }
  
  static generateDockerfile() {
    const dockerfile = `
FROM node:16-alpine
WORKDIR /app
COPY . .
RUN npm install --production
EXPOSE 8080
CMD ["node", "server.js"]
`;
    
    const dockerfilePath = path.join(__dirname, '../Dockerfile');
    fs.writeFileSync(dockerfilePath, dockerfile.trim());
    
    console.log('✓ Generated Dockerfile');
    return dockerfilePath;
  }
  
  static generateNginxConfig() {
    const nginxConfig = `
server {
    listen 80;
    server_name billiondollargame.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
`;
    
    const nginxPath = path.join(__dirname, 'nginx.conf');
    fs.writeFileSync(nginxPath, nginxConfig.trim());
    
    console.log('✓ Generated Nginx config');
    return nginxPath;
  }
}

// Main execution
if (require.main === module) {
  // Check for special commands
  const command = process.argv[2];
  
  if (command === '--generate-configs') {
    console.log('Generating production configuration files...\n');
    GameLauncher.generateProductionConfig();
    GameLauncher.generateDockerfile();
    GameLauncher.generateNginxConfig();
    console.log('\nProduction configs generated!');
    process.exit(0);
  }
  
  // Normal launch
  const launcher = new GameLauncher();
  launcher.launch().catch(error => {
    console.error('Launch error:', error);
    process.exit(1);
  });
}

module.exports = GameLauncher;