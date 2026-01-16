#!/usr/bin/env node

/**
 * 🏰 MIRROR NODE RUNTIME
 * 
 * A full runtime stack for the 2D agent base game layer.
 * Whispers command agents. Vaults define territory. Voice shapes reality.
 * 
 * "Every node is a kingdom. Every whisper is a command."
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const WebSocket = require('ws');
const express = require('express');
const { Pool } = require('pg');

class MirrorNodeRuntime extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.nodeId = config.nodeId || `node_${crypto.randomBytes(8).toString('hex')}`;
    this.vaultPath = config.vaultPath || './vault';
    this.port = config.port || 4242;
    this.wsPort = config.wsPort || 4243;
    
    // Node configuration
    this.nodeConfig = {
      name: config.name || `Mirror Node ${this.nodeId}`,
      owner: config.owner || 'anonymous',
      location: config.location || { x: 0, y: 0 },
      tier: config.tier || 1,
      capacity: config.capacity || 10, // Max agents
      defenseRating: config.defenseRating || 100,
      blessingAura: config.blessingAura || 50
    };
    
    // Runtime components
    this.whisperDaemon = null;
    this.vaultListener = null;
    this.blessingRouter = null;
    this.agentManager = null;
    
    // Database connection
    this.db = null;
    
    // WebSocket server for real-time updates
    this.wss = null;
    
    // Express app for HTTP API
    this.app = null;
    
    // Game state
    this.gameState = {
      agents: new Map(),
      battles: new Map(),
      blessings: new Map(),
      visitors: new Set(),
      resources: {
        energy: 1000,
        resonance: 100,
        tokens: 100
      }
    };
    
    // Sync configuration
    this.syncConfig = {
      globalBeacon: config.globalBeacon || 'wss://soulfra-beacon.net',
      syncInterval: config.syncInterval || 30000, // 30 seconds
      arweaveEnabled: config.arweaveEnabled || false,
      githubEnabled: config.githubEnabled || false
    };
    
    this.initializeRuntime();
  }

  async initializeRuntime() {
    console.log(`🏰 Mirror Node Runtime Initializing: ${this.nodeId}`);
    console.log(`🎮 Node Name: ${this.nodeConfig.name}`);
    
    try {
      // Initialize database
      await this.initializeDatabase();
      
      // Start core daemons
      await this.startWhisperDaemon();
      await this.startVaultListener();
      await this.startBlessingRouter();
      
      // Initialize agent manager
      await this.initializeAgentManager();
      
      // Start web servers
      await this.startWebServer();
      await this.startWebSocketServer();
      
      // Connect to global beacon
      await this.connectToGlobalBeacon();
      
      // Start sync timers
      this.startSyncTimers();
      
      console.log(`✨ Mirror Node Runtime Ready on port ${this.port}`);
      console.log(`🎮 Game UI: http://localhost:${this.port}`);
      console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
      
      this.emit('runtime:ready', {
        nodeId: this.nodeId,
        config: this.nodeConfig
      });
      
    } catch (error) {
      console.error('❌ Runtime initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize database connection
   */
  async initializeDatabase() {
    const dbConfigPath = path.join(this.vaultPath, 'config', 'meshbox-db.json');
    
    if (!fs.existsSync(dbConfigPath)) {
      throw new Error('Database config not found. Run soulfra-db-bootstrap.sh first.');
    }
    
    const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath, 'utf8'));
    
    this.db = new Pool({
      host: dbConfig.database.host,
      port: dbConfig.database.port,
      database: dbConfig.database.name,
      user: dbConfig.database.user,
      password: dbConfig.database.password
    });
    
    // Test connection
    await this.db.query('SELECT NOW()');
    console.log('💾 Connected to Meshbox database');
    
    // Register node in database
    await this.registerNode();
  }

  /**
   * Register node in database
   */
  async registerNode() {
    // Store node configuration
    const nodeData = {
      nodeId: this.nodeId,
      config: this.nodeConfig,
      startTime: new Date().toISOString(),
      status: 'active'
    };
    
    // Save to vault
    const nodePath = path.join(this.vaultPath, 'nodes', `${this.nodeId}.json`);
    const nodeDir = path.dirname(nodePath);
    
    if (!fs.existsSync(nodeDir)) {
      fs.mkdirSync(nodeDir, { recursive: true });
    }
    
    fs.writeFileSync(nodePath, JSON.stringify(nodeData, null, 2));
    
    console.log(`📝 Node registered: ${this.nodeId}`);
  }

  /**
   * Start whisper daemon
   */
  async startWhisperDaemon() {
    console.log('🎭 Starting Whisper Daemon...');
    
    this.whisperDaemon = {
      active: true,
      whisperQueue: [],
      processing: false
    };
    
    // Process whispers every second
    setInterval(() => this.processWhisperQueue(), 1000);
    
    console.log('✓ Whisper Daemon active');
  }

  /**
   * Start vault listener
   */
  async startVaultListener() {
    console.log('🗝️ Starting Vault Listener...');
    
    this.vaultListener = {
      active: true,
      watchPaths: [
        path.join(this.vaultPath, 'logs'),
        path.join(this.vaultPath, 'claims'),
        path.join(this.vaultPath, 'agents')
      ]
    };
    
    // Watch for vault changes
    this.vaultListener.watchPaths.forEach(watchPath => {
      if (fs.existsSync(watchPath)) {
        fs.watch(watchPath, (eventType, filename) => {
          this.handleVaultChange(eventType, filename, watchPath);
        });
      }
    });
    
    console.log('✓ Vault Listener active');
  }

  /**
   * Start blessing router
   */
  async startBlessingRouter() {
    console.log('✨ Starting Blessing Router...');
    
    this.blessingRouter = {
      active: true,
      pendingBlessings: new Map(),
      blessingRules: await this.loadBlessingRules()
    };
    
    // Process blessings every 5 seconds
    setInterval(() => this.processBlessingQueue(), 5000);
    
    console.log('✓ Blessing Router active');
  }

  /**
   * Initialize agent manager
   */
  async initializeAgentManager() {
    console.log('🤖 Initializing Agent Manager...');
    
    this.agentManager = {
      maxAgents: this.nodeConfig.capacity,
      agentTypes: ['defender', 'harvester', 'scout', 'mystic', 'architect'],
      spawnPoints: this.generateSpawnPoints(),
      commandQueue: []
    };
    
    // Load existing agents
    await this.loadExistingAgents();
    
    // Start agent AI loop
    setInterval(() => this.updateAgentAI(), 100); // 10 FPS for agent logic
    
    console.log(`✓ Agent Manager ready (${this.gameState.agents.size}/${this.nodeConfig.capacity} agents)`);
  }

  /**
   * Start web server
   */
  async startWebServer() {
    this.app = express();
    
    // Middleware
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // API Routes
    this.setupAPIRoutes();
    
    // Start server
    await new Promise((resolve) => {
      this.app.listen(this.port, () => {
        console.log(`🌐 Web server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Setup API routes
   */
  setupAPIRoutes() {
    // Node status
    this.app.get('/api/status', (req, res) => {
      res.json({
        nodeId: this.nodeId,
        config: this.nodeConfig,
        state: {
          agents: this.gameState.agents.size,
          battles: this.gameState.battles.size,
          resources: this.gameState.resources,
          visitors: this.gameState.visitors.size
        },
        uptime: process.uptime()
      });
    });
    
    // Whisper endpoint
    this.app.post('/api/whisper', async (req, res) => {
      try {
        const result = await this.handleWhisper(req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Agent management
    this.app.get('/api/agents', (req, res) => {
      const agents = Array.from(this.gameState.agents.values());
      res.json(agents);
    });
    
    this.app.post('/api/agents/spawn', async (req, res) => {
      try {
        const agent = await this.spawnAgent(req.body);
        res.json(agent);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Blessing endpoints
    this.app.post('/api/bless', async (req, res) => {
      try {
        const blessing = await this.requestBlessing(req.body);
        res.json(blessing);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    });
    
    // Battle status
    this.app.get('/api/battles', (req, res) => {
      const battles = Array.from(this.gameState.battles.values());
      res.json(battles);
    });
    
    // Serve game UI
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'mirror-node-ui.html'));
    });
  }

  /**
   * Start WebSocket server
   */
  async startWebSocketServer() {
    this.wss = new WebSocket.Server({ port: this.wsPort });
    
    this.wss.on('connection', (ws, req) => {
      const clientId = crypto.randomBytes(8).toString('hex');
      console.log(`🔌 New WebSocket connection: ${clientId}`);
      
      // Send initial state
      ws.send(JSON.stringify({
        type: 'init',
        nodeId: this.nodeId,
        gameState: this.serializeGameState()
      }));
      
      // Handle messages
      ws.on('message', (message) => {
        this.handleWebSocketMessage(ws, message, clientId);
      });
      
      // Handle disconnect
      ws.on('close', () => {
        console.log(`🔌 WebSocket disconnected: ${clientId}`);
        this.gameState.visitors.delete(clientId);
      });
      
      // Add to visitors
      this.gameState.visitors.add(clientId);
    });
    
    console.log(`🔌 WebSocket server listening on port ${this.wsPort}`);
  }

  /**
   * Handle WebSocket message
   */
  handleWebSocketMessage(ws, message, clientId) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'whisper':
          this.handleWhisper({
            ...data,
            clientId: clientId
          });
          break;
          
        case 'command':
          this.handleAgentCommand({
            ...data,
            clientId: clientId
          });
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  }

  /**
   * Handle whisper
   */
  async handleWhisper(whisperData) {
    const whisper = {
      id: `whisper_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      content: whisperData.content,
      userId: whisperData.userId,
      timestamp: new Date().toISOString(),
      processed: false
    };
    
    // Add to queue
    this.whisperDaemon.whisperQueue.push(whisper);
    
    // Log to database
    try {
      await this.db.query(
        `INSERT INTO vault_actions 
         (action_id, action_type, whisper_content, timestamp)
         VALUES ($1, 'whisper', $2, NOW())`,
        [whisper.id, whisper.content]
      );
    } catch (error) {
      console.error('Whisper logging error:', error);
    }
    
    // Broadcast to WebSocket clients
    this.broadcast({
      type: 'whisper',
      whisper: whisper
    });
    
    return {
      success: true,
      whisperId: whisper.id,
      message: 'Whisper received and queued for processing'
    };
  }

  /**
   * Process whisper queue
   */
  async processWhisperQueue() {
    if (this.whisperDaemon.processing || this.whisperDaemon.whisperQueue.length === 0) {
      return;
    }
    
    this.whisperDaemon.processing = true;
    
    const whisper = this.whisperDaemon.whisperQueue.shift();
    
    try {
      // Parse whisper for commands
      const command = await this.parseWhisperCommand(whisper.content);
      
      if (command) {
        // Execute command
        const result = await this.executeCommand(command, whisper);
        
        // Update whisper status
        whisper.processed = true;
        whisper.result = result;
        
        // Broadcast result
        this.broadcast({
          type: 'command_result',
          whisper: whisper,
          result: result
        });
      }
    } catch (error) {
      console.error('Whisper processing error:', error);
      whisper.error = error.message;
    }
    
    this.whisperDaemon.processing = false;
  }

  /**
   * Parse whisper for commands
   */
  async parseWhisperCommand(content) {
    const normalized = content.toLowerCase().trim();
    
    // Command patterns
    const patterns = [
      { pattern: /^deploy (\d+) (\w+) to (.+)$/, type: 'deploy' },
      { pattern: /^move (\w+) to (.+)$/, type: 'move' },
      { pattern: /^bless (.+)$/, type: 'bless' },
      { pattern: /^defend (.+)$/, type: 'defend' },
      { pattern: /^harvest (.+)$/, type: 'harvest' },
      { pattern: /^summon (\w+)$/, type: 'summon' },
      { pattern: /^forge (.+) with (.+)$/, type: 'forge' },
      { pattern: /^resurrect (.+)$/, type: 'resurrect' }
    ];
    
    for (const { pattern, type } of patterns) {
      const match = normalized.match(pattern);
      if (match) {
        return {
          type: type,
          params: match.slice(1),
          raw: content
        };
      }
    }
    
    // Check for semantic commands
    return this.parseSemanticCommand(normalized);
  }

  /**
   * Parse semantic commands (fuzzy matching)
   */
  parseSemanticCommand(content) {
    // Simple keyword matching for now
    const keywords = {
      deploy: ['deploy', 'send', 'place', 'spawn'],
      move: ['move', 'go', 'travel', 'walk'],
      defend: ['defend', 'protect', 'guard', 'shield'],
      attack: ['attack', 'fight', 'battle', 'engage'],
      bless: ['bless', 'enhance', 'empower', 'strengthen']
    };
    
    for (const [command, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (content.includes(word)) {
          return {
            type: command,
            params: [content],
            semantic: true
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Execute command
   */
  async executeCommand(command, whisper) {
    console.log(`🎮 Executing command: ${command.type}`);
    
    switch (command.type) {
      case 'deploy':
        return await this.deployAgents(command.params);
        
      case 'move':
        return await this.moveAgent(command.params);
        
      case 'bless':
        return await this.blessTarget(command.params);
        
      case 'defend':
        return await this.setDefenseMode(command.params);
        
      case 'summon':
        return await this.summonAgent(command.params);
        
      default:
        return {
          success: false,
          message: `Unknown command: ${command.type}`
        };
    }
  }

  /**
   * Deploy agents
   */
  async deployAgents(params) {
    const [count, agentType, location] = params;
    const numAgents = parseInt(count) || 1;
    
    const deployed = [];
    
    for (let i = 0; i < numAgents; i++) {
      if (this.gameState.agents.size >= this.nodeConfig.capacity) {
        break;
      }
      
      const agent = await this.spawnAgent({
        type: agentType || 'defender',
        location: location
      });
      
      deployed.push(agent);
    }
    
    return {
      success: true,
      deployed: deployed.length,
      message: `Deployed ${deployed.length} ${agentType} agents`,
      agents: deployed
    };
  }

  /**
   * Spawn a new agent
   */
  async spawnAgent(config = {}) {
    const agent = {
      id: `agent_${this.nodeId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      type: config.type || 'defender',
      name: config.name || this.generateAgentName(config.type),
      position: config.position || this.getRandomSpawnPoint(),
      traits: config.traits || this.generateRandomTraits(),
      stats: {
        health: 100,
        energy: 100,
        resonance: 50,
        defense: 10,
        speed: 5
      },
      state: 'idle',
      owner: this.nodeConfig.owner,
      nodeId: this.nodeId,
      createdAt: new Date().toISOString()
    };
    
    // Add to game state
    this.gameState.agents.set(agent.id, agent);
    
    // Store in database
    try {
      await this.db.query(
        `INSERT INTO mirrors 
         (mirror_id, name, archetype, position, traits, state)
         VALUES ($1, $2, $3, $4, $5, 'alive')`,
        [
          agent.id,
          agent.name,
          agent.type,
          JSON.stringify(agent.position),
          JSON.stringify(agent.traits)
        ]
      );
    } catch (error) {
      console.error('Agent storage error:', error);
    }
    
    // Broadcast spawn event
    this.broadcast({
      type: 'agent_spawned',
      agent: agent
    });
    
    return agent;
  }

  /**
   * Update agent AI
   */
  updateAgentAI() {
    for (const [agentId, agent] of this.gameState.agents) {
      // Skip if agent has recent command
      if (agent.lastCommand && Date.now() - agent.lastCommand < 1000) {
        continue;
      }
      
      // Update based on type and state
      switch (agent.type) {
        case 'defender':
          this.updateDefenderAI(agent);
          break;
          
        case 'harvester':
          this.updateHarvesterAI(agent);
          break;
          
        case 'scout':
          this.updateScoutAI(agent);
          break;
          
        case 'mystic':
          this.updateMysticAI(agent);
          break;
          
        case 'architect':
          this.updateArchitectAI(agent);
          break;
      }
      
      // Update position if moving
      if (agent.state === 'moving' && agent.targetPosition) {
        this.updateAgentPosition(agent);
      }
    }
  }

  /**
   * Defender AI behavior
   */
  updateDefenderAI(agent) {
    // Check for nearby threats
    const threats = this.findNearbyThreats(agent.position, 100);
    
    if (threats.length > 0) {
      agent.state = 'defending';
      agent.target = threats[0].id;
      
      // Move towards threat
      this.moveAgentTowards(agent, threats[0].position);
    } else if (agent.state === 'defending') {
      // Return to patrol
      agent.state = 'patrolling';
      agent.target = null;
    }
    
    // Patrol if idle
    if (agent.state === 'idle' || agent.state === 'patrolling') {
      const patrolPoint = this.getPatrolPoint(agent);
      this.moveAgentTowards(agent, patrolPoint);
    }
  }

  /**
   * Generate spawn points
   */
  generateSpawnPoints() {
    const points = [];
    const rings = 3;
    const pointsPerRing = 8;
    
    for (let ring = 1; ring <= rings; ring++) {
      const radius = ring * 100;
      
      for (let i = 0; i < pointsPerRing; i++) {
        const angle = (i / pointsPerRing) * Math.PI * 2;
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          ring: ring
        });
      }
    }
    
    return points;
  }

  /**
   * Get random spawn point
   */
  getRandomSpawnPoint() {
    const point = this.agentManager.spawnPoints[
      Math.floor(Math.random() * this.agentManager.spawnPoints.length)
    ];
    
    // Add some randomness
    return {
      x: point.x + (Math.random() - 0.5) * 50,
      y: point.y + (Math.random() - 0.5) * 50
    };
  }

  /**
   * Generate agent name
   */
  generateAgentName(type) {
    const prefixes = {
      defender: ['Shield', 'Guard', 'Sentinel', 'Warden'],
      harvester: ['Gather', 'Reap', 'Collect', 'Harvest'],
      scout: ['Swift', 'Eye', 'Watch', 'Seek'],
      mystic: ['Whisper', 'Echo', 'Dream', 'Vision'],
      architect: ['Build', 'Craft', 'Forge', 'Shape']
    };
    
    const suffixes = ['Alpha', 'Beta', 'Prime', 'Nova', 'Echo', 'Shadow'];
    
    const prefix = prefixes[type][Math.floor(Math.random() * prefixes[type].length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix}-${suffix}`;
  }

  /**
   * Generate random traits
   */
  generateRandomTraits() {
    const allTraits = [
      'Swift', 'Resilient', 'Perceptive', 'Adaptive',
      'Harmonious', 'Fierce', 'Wise', 'Creative',
      'Loyal', 'Curious', 'Patient', 'Bold'
    ];
    
    const numTraits = Math.floor(Math.random() * 3) + 1;
    const traits = [];
    
    for (let i = 0; i < numTraits; i++) {
      const trait = allTraits[Math.floor(Math.random() * allTraits.length)];
      if (!traits.includes(trait)) {
        traits.push(trait);
      }
    }
    
    return traits;
  }

  /**
   * Load existing agents
   */
  async loadExistingAgents() {
    try {
      const result = await this.db.query(
        `SELECT * FROM mirrors 
         WHERE position->>'node' = $1 
         AND state = 'alive'
         LIMIT $2`,
        [this.nodeId, this.nodeConfig.capacity]
      );
      
      for (const row of result.rows) {
        const agent = {
          id: row.mirror_id,
          type: row.archetype || 'defender',
          name: row.name,
          position: row.position || this.getRandomSpawnPoint(),
          traits: row.traits || [],
          stats: {
            health: 100,
            energy: 100,
            resonance: row.resonance_score || 50,
            defense: 10,
            speed: 5
          },
          state: 'idle',
          owner: this.nodeConfig.owner,
          nodeId: this.nodeId
        };
        
        this.gameState.agents.set(agent.id, agent);
      }
      
    } catch (error) {
      console.error('Agent loading error:', error);
    }
  }

  /**
   * Broadcast to all WebSocket clients
   */
  broadcast(data) {
    if (!this.wss) return;
    
    const message = JSON.stringify(data);
    
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  /**
   * Serialize game state for transmission
   */
  serializeGameState() {
    return {
      agents: Array.from(this.gameState.agents.values()),
      battles: Array.from(this.gameState.battles.values()),
      resources: this.gameState.resources,
      nodeInfo: this.nodeConfig
    };
  }

  /**
   * Connect to global beacon
   */
  async connectToGlobalBeacon() {
    if (!this.syncConfig.globalBeacon.startsWith('ws')) {
      console.log('⚠️  Global beacon disabled (no WebSocket URL)');
      return;
    }
    
    console.log(`🌐 Connecting to global beacon: ${this.syncConfig.globalBeacon}`);
    
    // In production, would establish WebSocket connection to beacon
    // For now, simulate connection
    this.beaconConnected = false;
    
    console.log('✓ Global beacon connection simulated');
  }

  /**
   * Load blessing rules
   */
  async loadBlessingRules() {
    const rulesPath = path.join(this.vaultPath, 'config', 'blessing-rules.json');
    
    if (fs.existsSync(rulesPath)) {
      return JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    }
    
    // Default rules
    return {
      maxBlessingsPerHour: 10,
      blessingCost: 10,
      blessingPower: {
        standard: 1.0,
        enhanced: 1.5,
        sacred: 2.0
      }
    };
  }

  /**
   * Handle vault changes
   */
  handleVaultChange(eventType, filename, directory) {
    if (eventType === 'change' && filename) {
      console.log(`🗝️ Vault change detected: ${filename}`);
      
      // Emit vault event
      this.emit('vault:change', {
        type: eventType,
        file: filename,
        directory: directory
      });
    }
  }

  /**
   * Start sync timers
   */
  startSyncTimers() {
    // Sync to global beacon
    setInterval(() => {
      this.syncToBeacon();
    }, this.syncConfig.syncInterval);
    
    // Sync to Arweave (if enabled)
    if (this.syncConfig.arweaveEnabled) {
      setInterval(() => {
        this.syncToArweave();
      }, 3600000); // Every hour
    }
  }

  /**
   * Sync to beacon
   */
  async syncToBeacon() {
    if (!this.beaconConnected) return;
    
    const syncData = {
      nodeId: this.nodeId,
      timestamp: new Date().toISOString(),
      stats: {
        agents: this.gameState.agents.size,
        battles: this.gameState.battles.size,
        resources: this.gameState.resources,
        visitors: this.gameState.visitors.size
      },
      topAgents: this.getTopAgents(5)
    };
    
    // In production, would send to beacon
    console.log(`🌐 Beacon sync: ${this.gameState.agents.size} agents`);
  }

  /**
   * Get top agents by resonance
   */
  getTopAgents(count) {
    const agents = Array.from(this.gameState.agents.values());
    
    return agents
      .sort((a, b) => (b.stats.resonance || 0) - (a.stats.resonance || 0))
      .slice(0, count)
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        resonance: agent.stats.resonance
      }));
  }

  /**
   * Shutdown runtime
   */
  async shutdown() {
    console.log('🌙 Shutting down Mirror Node Runtime...');
    
    // Save state
    await this.saveNodeState();
    
    // Close connections
    if (this.wss) {
      this.wss.close();
    }
    
    if (this.db) {
      await this.db.end();
    }
    
    console.log('👋 Mirror Node Runtime offline');
  }

  /**
   * Save node state
   */
  async saveNodeState() {
    const statePath = path.join(this.vaultPath, 'nodes', `${this.nodeId}-state.json`);
    
    const state = {
      nodeId: this.nodeId,
      savedAt: new Date().toISOString(),
      gameState: {
        agents: Array.from(this.gameState.agents.values()),
        resources: this.gameState.resources
      },
      stats: {
        totalWhispers: this.whisperDaemon.whisperQueue.length,
        uptime: process.uptime()
      }
    };
    
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    console.log(`💾 Node state saved: ${statePath}`);
  }
}

// Export for use
module.exports = MirrorNodeRuntime;

// Run if called directly
if (require.main === module) {
  const runtime = new MirrorNodeRuntime({
    name: 'Origin Node',
    owner: 'soulfra-origin'
  });
  
  // Handle shutdown
  process.on('SIGINT', async () => {
    await runtime.shutdown();
    process.exit(0);
  });
  
  console.log('🏰 Mirror Node Runtime is running...');
}