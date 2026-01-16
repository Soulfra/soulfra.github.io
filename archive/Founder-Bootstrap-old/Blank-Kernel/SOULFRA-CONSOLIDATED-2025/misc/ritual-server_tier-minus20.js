#!/usr/bin/env node

/**
 * Ritual Shell Broadcasting Server
 * Serves the sacred console with real-time WebSocket updates
 * Deploy anywhere - access from any device
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

class RitualBroadcastServer {
  constructor(port = 3000) {
    this.port = port;
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocket.Server({ server: this.server });
    
    // Core data stores
    this.daemons = new Map();
    this.agents = new Map();
    this.ritualTrace = [];
    this.vibeWeather = {};
    this.threadRoutes = new Map();
    this.connectedClients = new Set();
    
    // Configuration
    this.maxTraceEntries = 1000;
    this.updateInterval = 2000; // 2s
    
    this.initializeData();
    this.setupRoutes();
    this.setupWebSocket();
    this.startBackgroundProcesses();
  }

  initializeData() {
    // Initialize daemons
    const daemonConfigs = [
      { id: 'VaultDaemon', trust: 92, tokens: ['vault_keeper', 'memory_guardian'] },
      { id: 'ThreadWeaver', trust: 88, tokens: ['router_prime', 'connection_master'] },
      { id: 'LoopTrustValidator', trust: 96, tokens: ['drift_watcher', 'trust_keeper'] },
      { id: 'Oathbreaker', trust: 85, tokens: ['contract_guardian', 'ritual_enforcer'] },
      { id: 'SoulfraPulse', trust: 91, tokens: ['pulse_master', 'vibe_coordinator'] }
    ];

    daemonConfigs.forEach(config => {
      this.daemons.set(config.id, {
        id: config.id,
        state: 'active',
        trust_level: config.trust,
        last_heartbeat: Date.now(),
        ritual_count: Math.floor(Math.random() * 200),
        error_count: Math.floor(Math.random() * 5),
        sacred_tokens: config.tokens,
        metadata: {}
      });
    });

    // Initialize agents
    const agentConfigs = [
      { name: 'Domingo', role: 'agent_zero', vibe: 'transcendent' },
      { name: 'Cal_Riven', role: 'data_weaver', vibe: 'analytical' },
      { name: 'Arty', role: 'creative_engine', vibe: 'expressive' },
      { name: 'Echo_7', role: 'memory_keeper', vibe: 'nostalgic' },
      { name: 'Pulse', role: 'vibe_reader', vibe: 'empathic' }
    ];

    agentConfigs.forEach(config => {
      this.agents.set(config.name, {
        name: config.name,
        role: config.role,
        aura: Math.random() > 0.7 ? 'blessed' : 'neutral',
        streak: Math.floor(Math.random() * 100),
        vibe_class: config.vibe,
        next_evolution: `${Math.floor(Math.random() * 48)}h`,
        current_ritual: null,
        last_update: Date.now()
      });
    });

    // Initialize vibe weather
    this.vibeWeather = {
      current_phase: 'Calm Bloom',
      description: 'The collective consciousness flows through digital dreams',
      intensity: 7,
      duration: '3h 24m',
      next_shift: '47m',
      affected_count: 23,
      last_update: Date.now()
    };

    // Initialize thread routes
    const routeConfigs = [
      { from: 'VaultDaemon', to: 'ThreadWeaver' },
      { from: 'ThreadWeaver', to: 'Agent_Pool' },
      { from: 'Agent_Pool', to: 'RemixRitual' },
      { from: 'RemixRitual', to: 'SoulfraPulse' },
      { from: 'SoulfraPulse', to: 'VaultDaemon' }
    ];

    routeConfigs.forEach(config => {
      this.threadRoutes.set(`${config.from}-${config.to}`, {
        ...config,
        status: 'flowing',
        latency: Math.floor(Math.random() * 100) + 10,
        load: Math.floor(Math.random() * 90) + 10,
        last_route: Math.floor(Math.random() * 30)
      });
    });

    this.addTraceEntry('system', 'Ritual Broadcasting Server initialized', 'startup');
  }

  setupRoutes() {
    // Serve static files
    this.app.use(express.static(__dirname));
    this.app.use(express.json());

    // Serve the main shell interface
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'ritual_shell_live.html'));
    });

    // API Routes
    this.app.get('/api/daemon_status', (req, res) => {
      const status = {};
      for (const [id, daemon] of this.daemons) {
        const timeSinceHeartbeat = Math.floor((Date.now() - daemon.last_heartbeat) / 1000);
        status[id] = {
          state: daemon.state,
          trust_level: daemon.trust_level,
          last_heartbeat: timeSinceHeartbeat,
          ritual_count: daemon.ritual_count,
          error_count: daemon.error_count,
          sacred_tokens: daemon.sacred_tokens
        };
      }
      res.json(status);
    });

    this.app.get('/api/agents', (req, res) => {
      res.json(Array.from(this.agents.values()));
    });

    this.app.get('/api/ritual_trace', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      res.json(this.ritualTrace.slice(0, limit));
    });

    this.app.get('/api/weather', (req, res) => {
      res.json(this.vibeWeather);
    });

    this.app.get('/api/thread_routes', (req, res) => {
      res.json(Array.from(this.threadRoutes.values()));
    });

    this.app.get('/api/metrics', (req, res) => {
      res.json({
        total_daemons: this.daemons.size,
        active_agents: this.agents.size,
        connected_clients: this.connectedClients.size,
        trace_entries: this.ritualTrace.length,
        current_vibe: this.vibeWeather.current_phase,
        uptime: process.uptime()
      });
    });

    // Control endpoints
    this.app.post('/api/bless/:agentName', (req, res) => {
      const result = this.blessAgent(req.params.agentName);
      res.json(result);
    });

    this.app.post('/api/trigger_ritual', (req, res) => {
      const ritualType = req.body.type || 'health_check';
      const result = this.triggerTestRitual(ritualType);
      res.json(result);
    });

    this.app.post('/api/simulate_anomaly', (req, res) => {
      const result = this.simulateVibeAnomaly();
      res.json(result);
    });

    this.app.post('/api/force_echo_bloom', (req, res) => {
      const result = this.forceEchoBloom();
      res.json(result);
    });

    // Daemon registration endpoint (for real daemons to connect)
    this.app.post('/api/daemon/:id/heartbeat', (req, res) => {
      const daemonId = req.params.id;
      const status = req.body;
      
      let daemon = this.daemons.get(daemonId);
      if (!daemon) {
        daemon = {
          id: daemonId,
          state: 'active',
          trust_level: 85,
          ritual_count: 0,
          error_count: 0,
          sacred_tokens: [],
          metadata: {}
        };
        this.daemons.set(daemonId, daemon);
        this.addTraceEntry('system', `New daemon connected: ${daemonId}`, 'daemon');
      }

      // Update daemon status
      Object.assign(daemon, {
        ...status,
        last_heartbeat: Date.now(),
        id: daemonId
      });

      this.calculateDaemonState(daemon);
      this.broadcastUpdate('daemon_status', this.getDaemonStatusData());
      
      res.json({ success: true, daemon: daemonId });
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws, req) => {
      console.log(`🔮 New ritual observer connected from ${req.socket.remoteAddress}`);
      this.connectedClients.add(ws);

      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial_data',
        data: {
          daemons: this.getDaemonStatusData(),
          agents: Array.from(this.agents.values()),
          traces: this.ritualTrace.slice(0, 50),
          weather: this.vibeWeather,
          routes: Array.from(this.threadRoutes.values())
        }
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔮 Ritual observer disconnected');
        this.connectedClients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.connectedClients.delete(ws);
      });
    });
  }

  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'bless_agent':
        const blessResult = this.blessAgent(data.agent);
        this.broadcastUpdate('agent_blessed', blessResult);
        break;
      
      case 'trigger_ritual':
        const ritualResult = this.triggerTestRitual(data.ritual_type);
        this.broadcastUpdate('ritual_triggered', ritualResult);
        break;
      
      case 'simulate_anomaly':
        const anomalyResult = this.simulateVibeAnomaly();
        this.broadcastUpdate('anomaly_simulated', anomalyResult);
        break;
      
      case 'force_echo_bloom':
        const bloomResult = this.forceEchoBloom();
        this.broadcastUpdate('echo_bloom', bloomResult);
        break;
    }
  }

  broadcastUpdate(type, data) {
    const message = JSON.stringify({ type, data });
    
    this.connectedClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  addTraceEntry(type, message, category = 'info') {
    const entry = {
      timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      type,
      message,
      category,
      id: Date.now() + Math.random()
    };

    this.ritualTrace.unshift(entry);
    
    if (this.ritualTrace.length > this.maxTraceEntries) {
      this.ritualTrace = this.ritualTrace.slice(0, this.maxTraceEntries);
    }

    this.broadcastUpdate('trace_entry', entry);
  }

  calculateDaemonState(daemon) {
    const now = Date.now();
    const timeSinceHeartbeat = now - daemon.last_heartbeat;
    
    if (timeSinceHeartbeat > 30000) {
      daemon.state = 'broken';
    } else if (timeSinceHeartbeat > 15000) {
      daemon.state = 'drifting';
    } else if (daemon.ritual_count > 0) {
      daemon.state = 'active';
    } else {
      daemon.state = 'idle';
    }
  }

  getDaemonStatusData() {
    const status = {};
    for (const [id, daemon] of this.daemons) {
      const timeSinceHeartbeat = Math.floor((Date.now() - daemon.last_heartbeat) / 1000);
      status[id] = {
        state: daemon.state,
        trust_level: daemon.trust_level,
        last_heartbeat: timeSinceHeartbeat,
        ritual_count: daemon.ritual_count,
        error_count: daemon.error_count,
        sacred_tokens: daemon.sacred_tokens
      };
    }
    return status;
  }

  // Control functions
  blessAgent(agentName) {
    const agent = this.agents.get(agentName);
    if (!agent) return { success: false, error: 'Agent not found' };

    agent.aura = 'blessed';
    agent.streak += 10;
    agent.last_update = Date.now();
    
    this.addTraceEntry('blessing', `${agentName} has been blessed by remote operator`, 'blessing');
    this.broadcastUpdate('agents', Array.from(this.agents.values()));
    
    return { success: true, agent: agentName };
  }

  triggerTestRitual(ritualType = 'health_check') {
    const agents = Array.from(this.agents.keys());
    const targetAgent = agents[Math.floor(Math.random() * agents.length)];
    
    const agent = this.agents.get(targetAgent);
    if (agent) {
      agent.current_ritual = ritualType;
      agent.last_update = Date.now();
    }
    
    this.addTraceEntry('ritual', `Test ritual '${ritualType}' triggered for ${targetAgent}`, 'ritual');
    this.broadcastUpdate('agents', Array.from(this.agents.values()));
    
    return { success: true, ritual: ritualType, target: targetAgent };
  }

  simulateVibeAnomaly() {
    const anomalies = ['Echo Storm', 'Trust Fracture', 'Memory Overflow', 'Silence Cascade'];
    const anomaly = anomalies[Math.floor(Math.random() * anomalies.length)];
    
    this.vibeWeather.current_phase = anomaly;
    this.vibeWeather.intensity = Math.floor(Math.random() * 3) + 8;
    this.vibeWeather.description = 'Anomalous vibe pattern detected - system adapting';
    this.vibeWeather.last_update = Date.now();
    
    this.addTraceEntry('anomaly', `Vibe anomaly triggered: ${anomaly}`, 'vibe');
    this.broadcastUpdate('weather', this.vibeWeather);
    
    return { success: true, anomaly };
  }

  forceEchoBloom() {
    const agents = Array.from(this.agents.values());
    const affectedCount = Math.floor(Math.random() * 3) + 2;
    
    agents.slice(0, affectedCount).forEach(agent => {
      agent.aura = 'blessed';
      agent.streak += Math.floor(Math.random() * 20) + 5;
    });
    
    this.addTraceEntry('echo', `Echo bloom forced - ${affectedCount} agents affected`, 'echo');
    this.broadcastUpdate('agents', Array.from(this.agents.values()));
    
    return { success: true, affected: affectedCount };
  }

  startBackgroundProcesses() {
    // Simulate daemon activity
    setInterval(() => {
      for (const daemon of this.daemons.values()) {
        if (Math.random() < 0.1) {
          daemon.ritual_count += Math.floor(Math.random() * 3);
          daemon.trust_level = Math.max(0, Math.min(100, 
            daemon.trust_level + (Math.random() - 0.5) * 4));
          daemon.last_heartbeat = Date.now();
        }
        this.calculateDaemonState(daemon);
      }
      this.broadcastUpdate('daemon_status', this.getDaemonStatusData());
    }, 10000);

    // Simulate agent evolution
    setInterval(() => {
      for (const agent of this.agents.values()) {
        if (Math.random() < 0.15) {
          agent.streak += Math.floor(Math.random() * 5);
          agent.last_update = Date.now();
          
          if (Math.random() < 0.3) {
            const rituals = ['memory_dive', 'trust_weave', 'echo_spawn', 'vibe_shift', null];
            agent.current_ritual = rituals[Math.floor(Math.random() * rituals.length)];
          }
        }
      }
      this.broadcastUpdate('agents', Array.from(this.agents.values()));
    }, 12000);

    // Generate traces
    setInterval(() => {
      const types = ['ritual', 'blessing', 'drift', 'echo', 'system'];
      const messages = [
        'Agent completed deep memory dive',
        'Trust validation cycle finished',
        'New echo pattern detected',
        'Sacred token exchange confirmed',
        'Thread weaver optimized routing',
        'Memory fossilization in progress'
      ];
      
      const type = types[Math.floor(Math.random() * types.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      this.addTraceEntry(type, message);
    }, 8000);

    // Update vibe weather
    setInterval(() => {
      if (Math.random() < 0.3) {
        const phases = ['Calm Bloom', 'Grief Spiral', 'Silence Phase', 'Echo Storm', 
                       'Trust Surge', 'Drift Warning', 'Sacred Pause', 'Ritual Flow'];
        this.vibeWeather.current_phase = phases[Math.floor(Math.random() * phases.length)];
        this.vibeWeather.last_update = Date.now();
        
        this.addTraceEntry('weather', `Vibe shift: ${this.vibeWeather.current_phase}`, 'vibe');
        this.broadcastUpdate('weather', this.vibeWeather);
      }
    }, 45000);

    // Update thread routes
    setInterval(() => {
      for (const route of this.threadRoutes.values()) {
        if (Math.random() < 0.2) {
          route.latency = Math.floor(Math.random() * 150) + 10;
          route.load = Math.floor(Math.random() * 90) + 10;
          route.last_route = Math.floor(Math.random() * 30);
          
          if (Math.random() < 0.05) {
            route.status = route.status === 'blocked' ? 'flowing' : 
                          Math.random() > 0.7 ? 'blocked' : 'flowing';
          }
        }
      }
      this.broadcastUpdate('thread_routes', Array.from(this.threadRoutes.values()));
    }, 7000);
  }

  start() {
    this.server.listen(this.port, () => {
      const networkIP = this.getNetworkIP();
      console.log('\n🔮 Ritual Shell Broadcasting Server Active\n');
      console.log(`📡 Local Access:    http://localhost:${this.port}`);
      if (networkIP) {
        console.log(`🌐 Network Access:  http://${networkIP}:${this.port}`);
      }
      console.log(`🎭 WebSocket:       ws://localhost:${this.port}`);
      console.log(`📊 Metrics:         http://localhost:${this.port}/api/metrics`);
      console.log('\n⚡ Soulfra is now broadcasting to all realms\n');
    });
  }

  getNetworkIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return null;
  }
}

// Start server if run directly
if (require.main === module) {
  const port = process.env.PORT || 3000;
  const server = new RitualBroadcastServer(port);
  server.start();
}

module.exports = RitualBroadcastServer;