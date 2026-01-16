// SOULFRA MASTER DEPLOYMENT ENGINE
// Spins up individual AI worlds with 3-way runtime streaming

import { SoulfraPlatform } from '../core/soulfra-runtime-core.js';
import { Docker } from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import WebSocket from 'ws';

class SoulframDeploymentEngine {
  constructor(soulfraPlatform) {
    this.platform = soulfraPlatform;
    this.docker = new Docker();
    this.activeWorlds = new Map();
    this.worldTemplates = new Map();
    this.streamConnections = new Map();
    this.apiKeys = new Map();
    
    this.initializeTemplates();
    this.setupMasterAPIEndpoints();
  }

  initializeTemplates() {
    // World deployment templates
    this.worldTemplates.set('kids', {
      name: 'Kids AI Friends World',
      container: 'soulfra/kids-world:latest',
      agents: ['cal', 'domingo', 'arty'],
      environment: {
        WORLD_TYPE: 'kids',
        SAFETY_MODE: 'maximum',
        MAX_SESSION_TIME: '30m',
        PARENT_DASHBOARD: 'enabled'
      },
      resources: {
        memory: '512MB',
        cpu: '0.5',
        storage: '2GB'
      },
      scaling: {
        min_instances: 1,
        max_instances: 10,
        users_per_instance: 100
      }
    });

    this.worldTemplates.set('executive', {
      name: 'Executive Management Daycare',
      container: 'soulfra/executive-world:latest',
      agents: ['bucky', 'diana', 'chatty'],
      environment: {
        WORLD_TYPE: 'executive',
        COMPLEXITY_FILTER: 'maximum',
        TANTRUM_DETECTION: 'enabled',
        GOLD_STARS: 'unlimited'
      },
      resources: {
        memory: '1GB',
        cpu: '1.0',
        storage: '5GB'
      },
      scaling: {
        min_instances: 1,
        max_instances: 50,
        users_per_instance: 25
      }
    });

    this.worldTemplates.set('sports', {
      name: 'Sports Mirror Ritual System',
      container: 'soulfra/sports-world:latest',
      agents: ['cal', 'domingo', 'arty'],
      environment: {
        WORLD_TYPE: 'sports',
        STREAM_SUPPORT: 'youtube,twitch,m3u8',
        EMOTIONAL_TRACKING: 'enabled',
        VAULT_RITUALS: 'enabled'
      },
      resources: {
        memory: '2GB',
        cpu: '2.0',
        storage: '10GB'
      },
      scaling: {
        min_instances: 2,
        max_instances: 100,
        users_per_instance: 500
      }
    });

    this.worldTemplates.set('custom', {
      name: 'Custom AI World',
      container: 'soulfra/base-world:latest',
      agents: ['configurable'],
      environment: {
        WORLD_TYPE: 'custom',
        CUSTOMIZATION: 'full'
      },
      resources: {
        memory: '1GB',
        cpu: '1.0',
        storage: '5GB'
      },
      scaling: {
        min_instances: 1,
        max_instances: 20,
        users_per_instance: 100
      }
    });
  }

  // Main deployment function - creates new AI world instance
  async deployWorld(config) {
    try {
      const deploymentId = uuidv4();
      const worldId = `${config.type}-${config.name}-${deploymentId.substr(0, 8)}`;
      
      console.log(`🚀 Starting deployment: ${worldId}`);
      
      // Step 1: Generate API key and setup authentication
      const apiKey = await this.generateAPIKey(worldId, config);
      
      // Step 2: Create world configuration
      const worldConfig = await this.createWorldConfig(worldId, config, apiKey);
      
      // Step 3: Deploy container instance
      const container = await this.deployContainer(worldConfig);
      
      // Step 4: Setup 3-way streaming connection
      const streamConnection = await this.setup3WayStream(worldId, container);
      
      // Step 5: Initialize AI agents
      const agents = await this.initializeAgents(worldId, config.agents, streamConnection);
      
      // Step 6: Configure routing and load balancing
      const routing = await this.setupRouting(worldId, container);
      
      // Step 7: Register world as active
      const worldInstance = {
        id: worldId,
        name: config.name,
        type: config.type,
        status: 'running',
        container: container,
        apiKey: apiKey,
        streamConnection: streamConnection,
        agents: agents,
        routing: routing,
        created: Date.now(),
        config: config,
        metrics: {
          users: 0,
          interactions: 0,
          uptime: 0,
          lastActivity: Date.now()
        }
      };
      
      this.activeWorlds.set(worldId, worldInstance);
      
      console.log(`✅ World deployed successfully: ${worldId}`);
      return {
        success: true,
        worldId: worldId,
        apiKey: apiKey,
        url: `https://${worldId}.soulfra.ai`,
        streamEndpoint: `wss://stream.soulfra.ai/${worldId}`,
        dashboardUrl: `https://dashboard.soulfra.ai/worlds/${worldId}`
      };
      
    } catch (error) {
      console.error(`❌ Deployment failed:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateAPIKey(worldId, config) {
    const keyId = uuidv4();
    const apiKey = `sk-slfr_${config.type}_${keyId.substr(0, 12)}`;
    
    const keyData = {
      key: apiKey,
      worldId: worldId,
      type: config.type,
      permissions: {
        world_access: true,
        agent_interaction: true,
        vault_storage: true,
        analytics_read: true,
        user_management: config.type === 'executive' ? true : false
      },
      created: Date.now(),
      lastUsed: null,
      usageCount: 0
    };
    
    this.apiKeys.set(apiKey, keyData);
    
    // Store in platform vault for persistence
    await this.platform.vault.store(
      `api_key_${keyId}`,
      'api_key_data',
      keyData,
      true // Sync-eligible for backup
    );
    
    return apiKey;
  }

  async createWorldConfig(worldId, userConfig, apiKey) {
    const template = this.worldTemplates.get(userConfig.type);
    if (!template) throw new Error(`Unknown world type: ${userConfig.type}`);
    
    return {
      worldId: worldId,
      name: userConfig.name,
      type: userConfig.type,
      template: template,
      environment: {
        ...template.environment,
        WORLD_ID: worldId,
        API_KEY: apiKey,
        SOULFRA_RUNTIME_URL: process.env.SOULFRA_RUNTIME_URL,
        VAULT_CONNECTION: process.env.VAULT_CONNECTION_STRING,
        STREAM_ENDPOINT: `wss://stream.soulfra.ai/${worldId}`,
        AGENTS: userConfig.agents?.join(',') || template.agents.join(','),
        RUNTIME_TIER: userConfig.runtimeTier || 'balanced',
        STREAM_CONFIG: userConfig.streamConfig || '3way_full'
      },
      ports: {
        http: 3000,
        websocket: 3001,
        api: 3002
      },
      volumes: {
        world_data: `/data/${worldId}`,
        logs: `/logs/${worldId}`,
        cache: `/cache/${worldId}`
      }
    };
  }

  async deployContainer(worldConfig) {
    const containerName = `soulfra-world-${worldConfig.worldId}`;
    
    // Pull latest container image
    await this.docker.pull(worldConfig.template.container);
    
    // Create container
    const container = await this.docker.createContainer({
      Image: worldConfig.template.container,
      name: containerName,
      Env: Object.entries(worldConfig.environment).map(([key, value]) => `${key}=${value}`),
      ExposedPorts: {
        '3000/tcp': {},
        '3001/tcp': {},
        '3002/tcp': {}
      },
      HostConfig: {
        PortBindings: {
          '3000/tcp': [{ HostPort: '0' }], // Dynamic port assignment
          '3001/tcp': [{ HostPort: '0' }],
          '3002/tcp': [{ HostPort: '0' }]
        },
        Memory: this.parseMemory(worldConfig.template.resources.memory),
        CpuShares: Math.floor(parseFloat(worldConfig.template.resources.cpu) * 1024),
        Binds: Object.entries(worldConfig.volumes).map(([key, value]) => `${value}:/${key}`)
      },
      Labels: {
        'soulfra.world.id': worldConfig.worldId,
        'soulfra.world.type': worldConfig.type,
        'soulfra.deployment.engine': 'true'
      }
    });
    
    // Start container
    await container.start();
    
    // Get assigned ports
    const containerInfo = await container.inspect();
    const ports = {};
    Object.keys(containerInfo.NetworkSettings.Ports).forEach(exposedPort => {
      const portMapping = containerInfo.NetworkSettings.Ports[exposedPort];
      if (portMapping && portMapping[0]) {
        ports[exposedPort.split('/')[0]] = portMapping[0].HostPort;
      }
    });
    
    // Wait for container to be ready
    await this.waitForContainer(container, ports['3000']);
    
    return {
      container: container,
      ports: ports,
      status: 'running'
    };
  }

  async setup3WayStream(worldId, containerInstance) {
    // 3-Way Stream: World ↔ Runtime ↔ Vault
    const streamConfig = {
      worldId: worldId,
      endpoints: {
        world: `ws://localhost:${containerInstance.ports['3001']}`,
        runtime: `${process.env.SOULFRA_RUNTIME_WS}`,
        vault: `${process.env.VAULT_STREAM_ENDPOINT}`
      },
      messageTypes: [
        'user_interaction',
        'ai_response', 
        'vault_storage',
        'trust_update',
        'analytics_event'
      ]
    };
    
    // Create WebSocket connections
    const worldWS = new WebSocket(streamConfig.endpoints.world);
    const runtimeWS = new WebSocket(streamConfig.endpoints.runtime);
    const vaultWS = new WebSocket(streamConfig.endpoints.vault);
    
    // Setup message routing between streams
    const messageRouter = this.create3WayMessageRouter(worldId, {
      world: worldWS,
      runtime: runtimeWS, 
      vault: vaultWS
    });
    
    // Store connection for monitoring
    const streamConnection = {
      config: streamConfig,
      connections: { worldWS, runtimeWS, vaultWS },
      router: messageRouter,
      status: 'connected',
      lastActivity: Date.now(),
      messageCount: 0
    };
    
    this.streamConnections.set(worldId, streamConnection);
    
    return streamConnection;
  }

  create3WayMessageRouter(worldId, connections) {
    const router = {
      route: (source, message) => {
        try {
          const parsedMessage = JSON.parse(message);
          parsedMessage.worldId = worldId;
          parsedMessage.timestamp = Date.now();
          
          // Route based on message type
          switch (parsedMessage.type) {
            case 'user_interaction':
              // World → Runtime (for AI processing) → Vault (for storage)
              connections.runtime.send(JSON.stringify(parsedMessage));
              connections.vault.send(JSON.stringify(parsedMessage));
              break;
              
            case 'ai_response':
              // Runtime → World (for display) → Vault (for storage)
              connections.world.send(JSON.stringify(parsedMessage));
              connections.vault.send(JSON.stringify(parsedMessage));
              break;
              
            case 'vault_storage':
              // Any → Vault (storage only)
              connections.vault.send(JSON.stringify(parsedMessage));
              break;
              
            case 'trust_update':
              // Runtime → Vault (for permanent storage)
              connections.vault.send(JSON.stringify(parsedMessage));
              break;
              
            case 'analytics_event':
              // Any → All (for monitoring)
              Object.values(connections).forEach(conn => {
                if (conn !== source) {
                  conn.send(JSON.stringify(parsedMessage));
                }
              });
              break;
          }
          
          // Update stream activity
          const streamConnection = this.streamConnections.get(worldId);
          if (streamConnection) {
            streamConnection.lastActivity = Date.now();
            streamConnection.messageCount++;
          }
          
        } catch (error) {
          console.error(`Stream routing error for ${worldId}:`, error);
        }
      }
    };
    
    // Setup message handlers
    connections.world.on('message', (message) => router.route(connections.world, message));
    connections.runtime.on('message', (message) => router.route(connections.runtime, message));
    connections.vault.on('message', (message) => router.route(connections.vault, message));
    
    return router;
  }

  async initializeAgents(worldId, agentTypes, streamConnection) {
    const agents = new Map();
    
    for (const agentType of agentTypes) {
      try {
        // Create agent instance configuration
        const agentConfig = {
          worldId: worldId,
          type: agentType,
          personality: this.getAgentPersonality(agentType),
          streamConnection: streamConnection,
          apiEndpoint: `http://localhost:${streamConnection.config.ports?.api}/agent/${agentType}`
        };
        
        // Initialize agent through runtime
        const agentInstance = await this.platform.createAgent(
          `agent_${worldId}_${agentType}`,
          agentConfig
        );
        
        agents.set(agentType, agentInstance);
        
        console.log(`✅ Agent initialized: ${agentType} for world ${worldId}`);
        
      } catch (error) {
        console.error(`❌ Failed to initialize agent ${agentType}:`, error);
      }
    }
    
    return agents;
  }

  getAgentPersonality(agentType) {
    const personalities = {
      cal: {
        name: "Cal Cube",
        role: "helpful_teacher",
        specialties: ["counting", "shapes", "colors", "building"],
        tone: "encouraging_and_patient",
        max_response_length: 15
      },
      domingo: {
        name: "Domingo Sphere", 
        role: "magical_friend",
        specialties: ["magic", "wonder", "discovery", "imagination"],
        tone: "mystical_and_amazed",
        max_response_length: 15
      },
      arty: {
        name: "Arty Blob",
        role: "creative_artist",
        specialties: ["art", "creativity", "colors", "making_things"],
        tone: "creative_and_inspiring",
        max_response_length: 15
      },
      bucky: {
        name: "Bucky Briefcase",
        role: "executive_helper",
        specialties: ["meetings", "decisions", "validation", "gold_stars"],
        tone: "simplified_and_validating",
        max_response_length: 10
      }
    };
    
    return personalities[agentType] || personalities.cal;
  }

  async setupRouting(worldId, containerInstance) {
    // Setup reverse proxy routing for the world
    const routing = {
      worldId: worldId,
      domain: `${worldId}.soulfra.ai`,
      ports: containerInstance.ports,
      ssl: true,
      loadBalancing: {
        enabled: true,
        instances: [containerInstance.container.id],
        method: 'round_robin'
      }
    };
    
    // Register with reverse proxy (nginx/traefik/etc)
    await this.registerWithProxy(routing);
    
    return routing;
  }

  async registerWithProxy(routing) {
    // Implementation depends on your proxy setup
    // This could be nginx config generation, Traefik labels, etc.
    console.log(`🔗 Registered routing for ${routing.domain}`);
  }

  // World management functions
  async scaleWorld(worldId, targetInstances) {
    const world = this.activeWorlds.get(worldId);
    if (!world) throw new Error(`World not found: ${worldId}`);
    
    const currentInstances = world.routing.loadBalancing.instances.length;
    
    if (targetInstances > currentInstances) {
      // Scale up
      for (let i = currentInstances; i < targetInstances; i++) {
        const newContainer = await this.deployContainer(world.config);
        world.routing.loadBalancing.instances.push(newContainer.container.id);
      }
    } else if (targetInstances < currentInstances) {
      // Scale down
      const containersToRemove = world.routing.loadBalancing.instances.slice(targetInstances);
      for (const containerId of containersToRemove) {
        const container = this.docker.getContainer(containerId);
        await container.stop();
        await container.remove();
      }
      world.routing.loadBalancing.instances = world.routing.loadBalancing.instances.slice(0, targetInstances);
    }
    
    console.log(`📊 Scaled world ${worldId} to ${targetInstances} instances`);
  }

  async shutdownWorld(worldId) {
    const world = this.activeWorlds.get(worldId);
    if (!world) throw new Error(`World not found: ${worldId}`);
    
    try {
      // Close stream connections
      const streamConnection = this.streamConnections.get(worldId);
      if (streamConnection) {
        Object.values(streamConnection.connections).forEach(ws => ws.close());
        this.streamConnections.delete(worldId);
      }
      
      // Stop and remove containers
      for (const containerId of world.routing.loadBalancing.instances) {
        const container = this.docker.getContainer(containerId);
        await container.stop();
        await container.remove();
      }
      
      // Cleanup routing
      await this.deregisterFromProxy(world.routing);
      
      // Remove from active worlds
      this.activeWorlds.delete(worldId);
      
      console.log(`🛑 World shutdown completed: ${worldId}`);
      
    } catch (error) {
      console.error(`❌ Shutdown failed for ${worldId}:`, error);
      throw error;
    }
  }

  async deregisterFromProxy(routing) {
    // Remove proxy configuration
    console.log(`🔗 Deregistered routing for ${routing.domain}`);
  }

  // Monitoring and management
  getWorldMetrics(worldId) {
    const world = this.activeWorlds.get(worldId);
    if (!world) return null;
    
    const streamConnection = this.streamConnections.get(worldId);
    
    return {
      worldId: worldId,
      status: world.status,
      uptime: Date.now() - world.created,
      users: world.metrics.users,
      interactions: world.metrics.interactions,
      streamActivity: {
        connected: streamConnection?.status === 'connected',
        messageCount: streamConnection?.messageCount || 0,
        lastActivity: streamConnection?.lastActivity
      },
      resources: {
        instances: world.routing.loadBalancing.instances.length,
        memory_usage: 'TODO: get from container stats',
        cpu_usage: 'TODO: get from container stats'
      }
    };
  }

  getAllWorldMetrics() {
    const metrics = [];
    this.activeWorlds.forEach((world, worldId) => {
      metrics.push(this.getWorldMetrics(worldId));
    });
    return metrics;
  }

  // Helper functions
  parseMemory(memoryString) {
    const units = { 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024 };
    const match = memoryString.match(/^(\d+)(MB|GB)$/);
    if (!match) throw new Error(`Invalid memory format: ${memoryString}`);
    return parseInt(match[1]) * units[match[2]];
  }

  async waitForContainer(container, port, timeout = 30000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(`http://localhost:${port}/health`);
        if (response.ok) return;
      } catch (error) {
        // Container not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Container failed to start within ${timeout}ms`);
  }

  setupMasterAPIEndpoints() {
    // Express.js endpoints for master control
    const express = require('express');
    const app = express();
    
    app.use(express.json());
    
    // Deploy new world
    app.post('/api/master/deploy', async (req, res) => {
      try {
        const result = await this.deployWorld(req.body);
        res.json(result);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Get all worlds
    app.get('/api/master/worlds', (req, res) => {
      res.json(this.getAllWorldMetrics());
    });
    
    // Get specific world
    app.get('/api/master/worlds/:worldId', (req, res) => {
      const metrics = this.getWorldMetrics(req.params.worldId);
      if (!metrics) {
        return res.status(404).json({ error: 'World not found' });
      }
      res.json(metrics);
    });
    
    // Scale world
    app.post('/api/master/worlds/:worldId/scale', async (req, res) => {
      try {
        await this.scaleWorld(req.params.worldId, req.body.instances);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    // Shutdown world
    app.delete('/api/master/worlds/:worldId', async (req, res) => {
      try {
        await this.shutdownWorld(req.params.worldId);
        res.json({ success: true });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
    
    const port = process.env.MASTER_CONTROL_PORT || 4000;
    app.listen(port, () => {
      console.log(`🚀 Master Control API listening on port ${port}`);
    });
  }
}

export { SoulframDeploymentEngine };