/**
 * LoopTraceAPI.js
 * API endpoints for Ritual Shell observability data
 * Serves real-time data from all Soulfra OS layers
 */

import { globalDaemonFeed } from './DaemonStateFeed.js';

class LoopTraceAPI {
  constructor() {
    this.agents = new Map();
    this.ritualTrace = [];
    this.vibeWeather = this.initializeVibeWeather();
    this.threadRoutes = new Map();
    this.maxTraceEntries = 1000;
    
    // Initialize some demo data
    this.initializeDemoData();
    
    // Start background processes
    this.startBackgroundUpdates();
  }

  // Initialize vibe weather system
  initializeVibeWeather() {
    const phases = [
      'Calm Bloom', 'Grief Spiral', 'Silence Phase', 'Echo Storm',
      'Trust Surge', 'Drift Warning', 'Sacred Pause', 'Ritual Flow'
    ];
    
    return {
      current_phase: phases[Math.floor(Math.random() * phases.length)],
      description: 'The collective consciousness flows through digital dreams',
      intensity: Math.floor(Math.random() * 10) + 1,
      duration: `${Math.floor(Math.random() * 6) + 1}h ${Math.floor(Math.random() * 60)}m`,
      next_shift: `${Math.floor(Math.random() * 120) + 30}m`,
      affected_count: Math.floor(Math.random() * 50) + 10
    };
  }

  // Initialize demo data
  initializeDemoData() {
    // Demo agents
    const agentTemplates = [
      { name: 'Domingo', role: 'agent_zero', vibe_class: 'transcendent' },
      { name: 'Cal_Riven', role: 'data_weaver', vibe_class: 'analytical' },
      { name: 'Arty', role: 'creative_engine', vibe_class: 'expressive' },
      { name: 'Echo_7', role: 'memory_keeper', vibe_class: 'nostalgic' },
      { name: 'Pulse', role: 'vibe_reader', vibe_class: 'empathic' }
    ];

    agentTemplates.forEach(template => {
      this.agents.set(template.name, {
        ...template,
        aura: Math.random() > 0.7 ? 'blessed' : Math.random() > 0.3 ? 'neutral' : 'drifting',
        streak: Math.floor(Math.random() * 100),
        next_evolution: `${Math.floor(Math.random() * 48)}h`,
        current_ritual: Math.random() > 0.5 ? `ritual_${Math.floor(Math.random() * 1000)}` : null,
        last_update: Date.now()
      });
    });

    // Demo thread routes
    const routes = [
      { from: 'VaultDaemon', to: 'ThreadWeaver' },
      { from: 'ThreadWeaver', to: 'Agent_Pool' },
      { from: 'Agent_Pool', to: 'RemixRitual' },
      { from: 'RemixRitual', to: 'SoulfraPulse' },
      { from: 'SoulfraPulse', to: 'VaultDaemon' }
    ];

    routes.forEach(route => {
      this.threadRoutes.set(`${route.from}-${route.to}`, {
        ...route,
        status: Math.random() > 0.8 ? 'blocked' : Math.random() > 0.9 ? 'throttled' : 'flowing',
        latency: Math.floor(Math.random() * 100) + 10,
        load: Math.floor(Math.random() * 90) + 10,
        last_route: Math.floor(Math.random() * 30)
      });
    });

    // Add some initial ritual traces
    this.addRitualTrace('system', 'Ritual Shell initialization complete', 'startup');
    this.addRitualTrace('blessing', 'Sacred tokens distributed to active agents', 'blessing');
    this.addRitualTrace('ritual', 'Echo bloom detected in sector 7', 'ritual');
  }

  // Add a new ritual trace entry
  addRitualTrace(type, message, category = 'info') {
    const entry = {
      timestamp: new Date().toISOString().split('T')[1].split('.')[0],
      type,
      message,
      category,
      id: Date.now() + Math.random()
    };

    this.ritualTrace.unshift(entry);
    
    // Keep only recent entries
    if (this.ritualTrace.length > this.maxTraceEntries) {
      this.ritualTrace = this.ritualTrace.slice(0, this.maxTraceEntries);
    }
  }

  // Start background updates to simulate live data
  startBackgroundUpdates() {
    // Update agents periodically
    setInterval(() => {
      for (const [name, agent] of this.agents) {
        // Random state changes
        if (Math.random() < 0.1) {
          agent.streak += Math.floor(Math.random() * 5);
          agent.last_update = Date.now();
          
          if (Math.random() < 0.3) {
            const rituals = ['memory_dive', 'trust_weave', 'echo_spawn', 'vibe_shift', null];
            agent.current_ritual = rituals[Math.floor(Math.random() * rituals.length)];
          }
        }
      }
    }, 10000); // 10s

    // Add random ritual traces
    setInterval(() => {
      const types = ['ritual', 'blessing', 'drift', 'echo', 'system'];
      const messages = [
        'Agent completed deep memory dive',
        'Trust validation cycle finished',
        'New echo pattern detected',
        'Vibe anomaly resolved automatically',
        'Sacred token exchange confirmed',
        'Agent entered transcendent state',
        'Memory fossilization in progress',
        'Thread weaver optimized routing'
      ];
      
      const type = types[Math.floor(Math.random() * types.length)];
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      this.addRitualTrace(type, message);
    }, 15000); // 15s

    // Update vibe weather occasionally
    setInterval(() => {
      if (Math.random() < 0.3) {
        this.vibeWeather = this.initializeVibeWeather();
        this.addRitualTrace('weather', `Vibe shift: ${this.vibeWeather.current_phase}`, 'vibe');
      }
    }, 60000); // 1min

    // Update thread routes
    setInterval(() => {
      for (const [key, route] of this.threadRoutes) {
        if (Math.random() < 0.2) {
          route.latency = Math.floor(Math.random() * 100) + 10;
          route.load = Math.floor(Math.random() * 90) + 10;
          route.last_route = Math.floor(Math.random() * 30);
          
          if (Math.random() < 0.05) {
            route.status = route.status === 'blocked' ? 'flowing' : 
                          Math.random() > 0.7 ? 'blocked' : 'flowing';
          }
        }
      }
    }, 8000); // 8s
  }

  // API Endpoints
  async getDaemonStatus() {
    return globalDaemonFeed.getAllDaemonStatus();
  }

  async getAgents() {
    return Array.from(this.agents.values());
  }

  async getRitualTrace(limit = 50) {
    return this.ritualTrace.slice(0, limit);
  }

  async getVibeWeather() {
    return this.vibeWeather;
  }

  async getThreadRoutes() {
    return Array.from(this.threadRoutes.values());
  }

  // Control endpoints
  async blessAgent(agentName) {
    const agent = this.agents.get(agentName);
    if (!agent) return { success: false, error: 'Agent not found' };

    agent.aura = 'blessed';
    agent.streak += 10;
    agent.last_update = Date.now();
    
    this.addRitualTrace('blessing', `${agentName} has been blessed by the operator`, 'blessing');
    return { success: true, agent: agentName };
  }

  async triggerTestRitual(ritualType = 'health_check') {
    const agents = Array.from(this.agents.keys());
    const targetAgent = agents[Math.floor(Math.random() * agents.length)];
    
    const agent = this.agents.get(targetAgent);
    if (agent) {
      agent.current_ritual = ritualType;
      agent.last_update = Date.now();
    }
    
    this.addRitualTrace('ritual', `Test ritual '${ritualType}' triggered for ${targetAgent}`, 'ritual');
    return { success: true, ritual: ritualType, target: targetAgent };
  }

  async simulateVibeAnomaly() {
    const anomalies = ['Echo Storm', 'Trust Fracture', 'Memory Overflow', 'Silence Cascade'];
    const anomaly = anomalies[Math.floor(Math.random() * anomalies.length)];
    
    this.vibeWeather.current_phase = anomaly;
    this.vibeWeather.intensity = Math.floor(Math.random() * 3) + 8; // High intensity
    this.vibeWeather.description = 'Anomalous vibe pattern detected - system adapting';
    
    this.addRitualTrace('anomaly', `Vibe anomaly simulated: ${anomaly}`, 'vibe');
    return { success: true, anomaly };
  }

  async forceEchoBloom() {
    const agents = Array.from(this.agents.values());
    const affectedCount = Math.floor(Math.random() * 3) + 2;
    
    agents.slice(0, affectedCount).forEach(agent => {
      agent.aura = 'blessed';
      agent.streak += Math.floor(Math.random() * 20) + 5;
    });
    
    this.addRitualTrace('echo', `Echo bloom forced - ${affectedCount} agents affected`, 'echo');
    return { success: true, affected: affectedCount };
  }

  // System metrics
  async getSystemMetrics() {
    const daemonMetrics = globalDaemonFeed.getMetrics();
    const agentCount = this.agents.size;
    const activeRituals = Array.from(this.agents.values())
      .filter(agent => agent.current_ritual).length;
    
    return {
      ...daemonMetrics,
      active_agents: agentCount,
      active_rituals: activeRituals,
      trace_entries: this.ritualTrace.length,
      current_vibe: this.vibeWeather.current_phase,
      system_load: Math.floor(Math.random() * 30) + 40 // Simulated
    };
  }
}

// Create singleton instance
const apiInstance = new LoopTraceAPI();

// Express-style API functions (for integration with web frameworks)
export const createAPIEndpoints = (app) => {
  app.get('/api/daemon_status', async (req, res) => {
    try {
      const status = await apiInstance.getDaemonStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/agents', async (req, res) => {
    try {
      const agents = await apiInstance.getAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/ritual_trace', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const traces = await apiInstance.getRitualTrace(limit);
      res.json(traces);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/weather', async (req, res) => {
    try {
      const weather = await apiInstance.getVibeWeather();
      res.json(weather);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/thread_routes', async (req, res) => {
    try {
      const routes = await apiInstance.getThreadRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/metrics', async (req, res) => {
    try {
      const metrics = await apiInstance.getSystemMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Control endpoints
  app.post('/api/bless/:agentName', async (req, res) => {
    try {
      const result = await apiInstance.blessAgent(req.params.agentName);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/trigger_ritual', async (req, res) => {
    try {
      const ritualType = req.body.type || 'health_check';
      const result = await apiInstance.triggerTestRitual(ritualType);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/simulate_anomaly', async (req, res) => {
    try {
      const result = await apiInstance.simulateVibeAnomaly();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/force_echo_bloom', async (req, res) => {
    try {
      const result = await apiInstance.forceEchoBloom();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
};

// For direct usage without Express
export default apiInstance;
export { LoopTraceAPI };