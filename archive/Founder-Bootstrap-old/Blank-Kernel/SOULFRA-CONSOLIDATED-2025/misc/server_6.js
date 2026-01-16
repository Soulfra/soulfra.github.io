const express = require('express');
const path = require('path');
const cors = require('cors');

// Import all module servers
const CalChatServer = require('./modules/cal-chat/cal-chat-server');
const MonetizationServer = require('./modules/agent-monetization/monetization-server');
const VibeGraphServer = require('./modules/vibegraph/vibegraph-server');
const QRCheckInServer = require('./modules/qr-checkin/qr-server');
const AgentPromotionServer = require('./modules/agent-promotion/promotion-server');

// Import configuration and vault logger
const config = require('./shared/config/mirror-config');
const VaultLogger = require('./shared/vault/vault-logger');

class MirrorOSServer {
  constructor() {
    this.app = express();
    this.config = config;
    this.vaultLogger = new VaultLogger(config.vault);
    this.moduleServers = new Map();
    
    this.setupMiddleware();
    this.initializeModules();
    this.setupRoutes();
  }

  setupMiddleware() {
    // CORS
    this.app.use(cors({
      origin: ['http://localhost:3000', 'http://localhost:3080', 'http://127.0.0.1:3000', 'http://127.0.0.1:3080'],
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Static file serving
    this.app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));
    this.app.use('/modules', express.static(path.join(__dirname, 'modules')));
    this.app.use('/shared', express.static(path.join(__dirname, 'shared')));

    // Logging middleware
    this.app.use((req, res, next) => {
      if (req.path.startsWith('/api/')) {
        this.vaultLogger.log('http', 'api_request', {
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
      next();
    });

    // Error handling
    this.app.use((error, req, res, next) => {
      this.vaultLogger.log('error', 'http_error', {
        error: error.message,
        stack: error.stack,
        path: req.path
      });
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  async initializeModules() {
    console.log('🚀 Initializing MirrorOS modules...');

    try {
      // Initialize all module servers
      const modules = [
        { name: 'cal-chat', class: CalChatServer, port: 3081 },
        { name: 'agent-monetization', class: MonetizationServer, port: 3082 },
        { name: 'vibegraph', class: VibeGraphServer, port: 3083 },
        { name: 'qr-checkin', class: QRCheckInServer, port: 3084 },
        { name: 'agent-promotion', class: AgentPromotionServer, port: 3085 }
      ];

      for (const module of modules) {
        console.log(`📦 Initializing ${module.name}...`);
        
        const moduleConfig = this.config.modules[module.name.replace('-', '')] || {};
        const server = new module.class(moduleConfig, this.vaultLogger);
        
        // Mount module routes
        this.app.use(`/api/${module.name}`, server.app);
        
        // Store module server reference
        this.moduleServers.set(module.name, server);
        
        // Start module server if it has a start method
        if (typeof server.start === 'function') {
          try {
            await server.start(module.port);
            console.log(`✅ ${module.name} server started on port ${module.port}`);
          } catch (error) {
            console.warn(`⚠️  ${module.name} server failed to start on separate port: ${error.message}`);
          }
        }
        
        await this.vaultLogger.log('system', 'module_initialized', {
          module: module.name,
          port: module.port
        });
      }

      console.log('🎉 All modules initialized successfully!');
      
    } catch (error) {
      console.error('❌ Failed to initialize modules:', error);
      await this.vaultLogger.log('error', 'module_initialization_failed', {
        error: error.message
      });
      throw error;
    }
  }

  setupRoutes() {
    // Root route - redirect to dashboard
    this.app.get('/', (req, res) => {
      res.redirect('/dashboard/unified-dashboard.html');
    });

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        modules: {},
        vault: {
          loggingEnabled: this.vaultLogger.loggingEnabled,
          basePath: this.vaultLogger.basePath
        }
      };

      // Check module health
      for (const [name, server] of this.moduleServers.entries()) {
        health.modules[name] = {
          status: 'active',
          lastCheck: new Date().toISOString()
        };
      }

      res.json(health);
    });

    // System information endpoint
    this.app.get('/api/system/info', async (req, res) => {
      const info = {
        name: 'MirrorOS Demo System',
        version: '1.0.0',
        modules: Array.from(this.moduleServers.keys()),
        config: {
          server: this.config.server,
          modules: Object.keys(this.config.modules).map(key => ({
            name: key,
            enabled: this.config.modules[key].enabled
          }))
        },
        vault: {
          loggingEnabled: this.vaultLogger.loggingEnabled,
          encryptionEnabled: this.vaultLogger.encryptionEnabled
        }
      };

      res.json(info);
    });

    // Vault logs endpoint
    this.app.get('/api/vault/logs', async (req, res) => {
      try {
        const { module, action, limit = 100, offset = 0 } = req.query;
        
        // In a real implementation, this would read from log files
        // For demo purposes, we'll return mock data
        const logs = [];
        const modules = ['cal-chat', 'agent-monetization', 'vibegraph', 'qr-checkin', 'agent-promotion'];
        const actions = ['user_authenticated', 'data_saved', 'export_generated', 'review_created', 'checkin_completed'];

        for (let i = 0; i < Math.min(parseInt(limit), 50); i++) {
          const randomModule = modules[Math.floor(Math.random() * modules.length)];
          const randomAction = actions[Math.floor(Math.random() * actions.length)];
          const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);

          if (!module || randomModule === module) {
            if (!action || randomAction === action) {
              logs.push({
                id: `log-${i}`,
                timestamp: timestamp.toISOString(),
                module: randomModule,
                action: randomAction,
                data: { simulated: true }
              });
            }
          }
        }

        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        res.json({
          success: true,
          logs: logs.slice(parseInt(offset), parseInt(offset) + parseInt(limit)),
          total: logs.length
        });

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Cross-module integration endpoints
    this.app.post('/api/integration/sync-reviews', async (req, res) => {
      try {
        // Get reviews from VibeGraph and sync to Agent Promotion
        const vibeGraphServer = this.moduleServers.get('vibegraph');
        const promotionServer = this.moduleServers.get('agent-promotion');

        if (!vibeGraphServer || !promotionServer) {
          return res.status(404).json({ error: 'Required modules not found' });
        }

        // Simulate review sync
        const mockReviews = [
          { id: 'review-1', agentId: 'agent-1', rating: 4.5, sentiment: { label: 'positive' } },
          { id: 'review-2', agentId: 'agent-2', rating: 3.8, sentiment: { label: 'neutral' } }
        ];

        await this.vaultLogger.log('integration', 'reviews_synced', {
          count: mockReviews.length,
          source: 'vibegraph',
          target: 'agent-promotion'
        });

        res.json({
          success: true,
          synced: mockReviews.length,
          reviews: mockReviews
        });

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Demo workflow endpoint
    this.app.post('/api/demo/run-workflow', async (req, res) => {
      try {
        const { workflow = 'full' } = req.body;
        
        await this.vaultLogger.log('demo', 'workflow_started', { workflow });

        // Simulate a complete workflow
        const steps = [
          { module: 'cal-chat', action: 'start_conversation', delay: 1000 },
          { module: 'agent-monetization', action: 'create_agent', delay: 1500 },
          { module: 'vibegraph', action: 'submit_review', delay: 2000 },
          { module: 'qr-checkin', action: 'checkin_location', delay: 1000 },
          { module: 'agent-promotion', action: 'evaluate_promotion', delay: 2000 }
        ];

        // Execute workflow steps
        let totalDelay = 0;
        for (const step of steps) {
          setTimeout(async () => {
            await this.vaultLogger.log(step.module, step.action, {
              workflow: true,
              step: step.action
            });
          }, totalDelay);
          totalDelay += step.delay;
        }

        setTimeout(async () => {
          await this.vaultLogger.log('demo', 'workflow_completed', { workflow });
        }, totalDelay);

        res.json({
          success: true,
          workflow,
          steps: steps.length,
          estimatedDuration: totalDelay
        });

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Statistics endpoint
    this.app.get('/api/stats', async (req, res) => {
      try {
        // Generate mock statistics
        const stats = {
          overview: {
            totalAgents: Math.floor(Math.random() * 50) + 10,
            totalConversations: Math.floor(Math.random() * 200) + 50,
            totalReviews: Math.floor(Math.random() * 150) + 30,
            totalCheckins: Math.floor(Math.random() * 100) + 20,
            totalExports: Math.floor(Math.random() * 25) + 5,
            promotedAgents: Math.floor(Math.random() * 8) + 2
          },
          modules: {
            'cal-chat': {
              activeSessions: Math.floor(Math.random() * 5) + 1,
              totalMessages: Math.floor(Math.random() * 100) + 20
            },
            'agent-monetization': {
              agents: Math.floor(Math.random() * 20) + 5,
              exports: Math.floor(Math.random() * 15) + 3
            },
            'vibegraph': {
              reviews: Math.floor(Math.random() * 50) + 10,
              positiveSentiment: Math.floor(Math.random() * 30 + 65)
            },
            'qr-checkin': {
              locations: 2,
              checkins: Math.floor(Math.random() * 30) + 5
            },
            'agent-promotion': {
              eligible: Math.floor(Math.random() * 8) + 2,
              campaigns: Math.floor(Math.random() * 3) + 1
            }
          }
        };

        res.json(stats);

      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  async start(port = 3080) {
    try {
      await this.vaultLogger.log('system', 'server_starting', { port });

      this.server = this.app.listen(port, () => {
        console.log(`
🌟 MirrorOS Demo System Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️  Main Dashboard: http://localhost:${port}
📊 System Health:   http://localhost:${port}/health
🔧 API Base:        http://localhost:${port}/api

📦 Active Modules:
${Array.from(this.moduleServers.keys()).map(name => `   • ${name}`).join('\n')}

🗃️  Vault Logging:  ${this.vaultLogger.loggingEnabled ? '✅ Enabled' : '❌ Disabled'}
📁 Vault Path:      ${this.vaultLogger.basePath}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Ready for demo! Open http://localhost:${port} to begin.
        `);

        this.vaultLogger.log('system', 'server_started', { 
          port, 
          modules: Array.from(this.moduleServers.keys()) 
        });
      });

      this.server.on('error', (error) => {
        console.error('❌ Server error:', error);
        this.vaultLogger.log('error', 'server_error', { error: error.message });
      });

      // Graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down MirrorOS...');
        this.shutdown();
      });

      process.on('SIGTERM', () => {
        console.log('\n🛑 Shutting down MirrorOS...');
        this.shutdown();
      });

    } catch (error) {
      console.error('❌ Failed to start server:', error);
      await this.vaultLogger.log('error', 'server_start_failed', { error: error.message });
      throw error;
    }
  }

  async shutdown() {
    console.log('📝 Saving final vault logs...');
    await this.vaultLogger.log('system', 'server_shutdown', { 
      timestamp: new Date().toISOString() 
    });

    console.log('🛑 Stopping module servers...');
    for (const [name, server] of this.moduleServers.entries()) {
      if (typeof server.stop === 'function') {
        try {
          server.stop();
          console.log(`✅ ${name} stopped`);
        } catch (error) {
          console.warn(`⚠️  Error stopping ${name}:`, error.message);
        }
      }
    }

    if (this.server) {
      this.server.close(() => {
        console.log('✅ MirrorOS shutdown complete');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new MirrorOSServer();
  server.start().catch(error => {
    console.error('Failed to start MirrorOS:', error);
    process.exit(1);
  });
}

module.exports = MirrorOSServer;