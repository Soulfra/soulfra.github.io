const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');

class MonetizationServer {
  constructor(config, vaultLogger) {
    this.config = config;
    this.vaultLogger = vaultLogger;
    this.app = express();
    this.agents = new Map();
    this.exports = new Map();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // File upload handling
    const storage = multer.memoryStorage();
    this.upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
  }

  setupRoutes() {
    // Agent management
    this.app.post('/api/agents', this.createAgent.bind(this));
    this.app.get('/api/agents', this.listAgents.bind(this));
    this.app.get('/api/agents/:id', this.getAgent.bind(this));
    this.app.put('/api/agents/:id', this.updateAgent.bind(this));
    this.app.delete('/api/agents/:id', this.deleteAgent.bind(this));

    // Export functionality
    this.app.post('/api/agents/:id/export', this.exportAgent.bind(this));
    this.app.get('/api/exports/:exportId/download', this.downloadExport.bind(this));
    this.app.get('/api/exports', this.listExports.bind(this));

    // Monetization
    this.app.post('/api/agents/:id/monetize', this.monetizeAgent.bind(this));
    this.app.get('/api/pricing', this.getPricingTiers.bind(this));
    this.app.post('/api/purchase', this.purchaseAgent.bind(this));

    // Template management
    this.app.get('/api/templates', this.listTemplates.bind(this));
    this.app.post('/api/templates', this.upload.single('template'), this.uploadTemplate.bind(this));

    // Serve static files
    this.app.use('/static', express.static(path.join(__dirname, 'static')));
  }

  async createAgent(req, res) {
    try {
      const agentData = {
        id: uuidv4(),
        name: req.body.name,
        description: req.body.description,
        type: req.body.type || 'chat',
        config: req.body.config || {},
        prompts: req.body.prompts || [],
        pricing: req.body.pricing || { tier: 'free', price: 0 },
        metadata: {
          created: new Date().toISOString(),
          creator: req.body.creator || 'anonymous',
          version: '1.0.0',
          tags: req.body.tags || []
        }
      };

      // Validate agent data
      if (!agentData.name || !agentData.description) {
        return res.status(400).json({ error: 'Name and description are required' });
      }

      // Save to vault
      await this.vaultLogger.saveAgent(agentData);
      this.agents.set(agentData.id, agentData);

      res.json({
        success: true,
        agent: agentData
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async listAgents(req, res) {
    try {
      const { category, pricing, search } = req.query;
      let agents = Array.from(this.agents.values());

      // Filter by category
      if (category) {
        agents = agents.filter(agent => 
          agent.metadata.tags.includes(category) || agent.type === category
        );
      }

      // Filter by pricing
      if (pricing) {
        agents = agents.filter(agent => agent.pricing.tier === pricing);
      }

      // Search filter
      if (search) {
        const searchTerm = search.toLowerCase();
        agents = agents.filter(agent =>
          agent.name.toLowerCase().includes(searchTerm) ||
          agent.description.toLowerCase().includes(searchTerm)
        );
      }

      res.json({
        agents,
        total: agents.length
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAgent(req, res) {
    try {
      const agent = this.agents.get(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Get analytics
      const analytics = await this.vaultLogger.getAgentAnalytics(agent.id);

      res.json({
        agent,
        analytics
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateAgent(req, res) {
    try {
      const agent = this.agents.get(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Update fields
      const updatedAgent = {
        ...agent,
        ...req.body,
        id: agent.id, // Preserve ID
        metadata: {
          ...agent.metadata,
          updated: new Date().toISOString(),
          version: this.incrementVersion(agent.metadata.version)
        }
      };

      // Save to vault
      await this.vaultLogger.saveAgent(updatedAgent);
      this.agents.set(agent.id, updatedAgent);

      await this.vaultLogger.log('agent-monetization', 'agent_updated', {
        agentId: agent.id,
        changes: Object.keys(req.body)
      });

      res.json({
        success: true,
        agent: updatedAgent
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async deleteAgent(req, res) {
    try {
      const agent = this.agents.get(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      this.agents.delete(req.params.id);

      await this.vaultLogger.log('agent-monetization', 'agent_deleted', {
        agentId: req.params.id
      });

      res.json({ success: true });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async exportAgent(req, res) {
    try {
      const agent = this.agents.get(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const format = req.body.format || 'json';
      const exportId = uuidv4();
      
      let exportData;
      let filename;
      let contentType;

      switch (format) {
        case 'json':
          exportData = JSON.stringify(agent, null, 2);
          filename = `${agent.name.replace(/\s+/g, '_')}.json`;
          contentType = 'application/json';
          break;

        case 'zip':
          exportData = await this.createZipExport(agent);
          filename = `${agent.name.replace(/\s+/g, '_')}.zip`;
          contentType = 'application/zip';
          break;

        case 'api':
          exportData = this.generateAPICode(agent);
          filename = `${agent.name.replace(/\s+/g, '_')}_api.js`;
          contentType = 'text/javascript';
          break;

        default:
          return res.status(400).json({ error: 'Unsupported export format' });
      }

      // Store export temporarily
      this.exports.set(exportId, {
        id: exportId,
        agentId: agent.id,
        format,
        data: exportData,
        filename,
        contentType,
        created: new Date().toISOString(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      });

      await this.vaultLogger.log('agent-monetization', 'agent_exported', {
        agentId: agent.id,
        exportId,
        format
      });

      res.json({
        success: true,
        exportId,
        downloadUrl: `/api/exports/${exportId}/download`,
        filename
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async downloadExport(req, res) {
    try {
      const exportData = this.exports.get(req.params.exportId);
      if (!exportData) {
        return res.status(404).json({ error: 'Export not found or expired' });
      }

      res.setHeader('Content-Type', exportData.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
      
      if (exportData.format === 'zip') {
        res.send(exportData.data);
      } else {
        res.send(exportData.data);
      }

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async createZipExport(agent) {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip');
      const chunks = [];

      archive.on('data', chunk => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      // Add agent configuration
      archive.append(JSON.stringify(agent, null, 2), { name: 'agent.json' });
      
      // Add README
      const readme = this.generateReadme(agent);
      archive.append(readme, { name: 'README.md' });

      // Add sample code
      const sampleCode = this.generateSampleCode(agent);
      archive.append(sampleCode, { name: 'sample.js' });

      archive.finalize();
    });
  }

  generateAPICode(agent) {
    return `
// Auto-generated API wrapper for ${agent.name}
class ${agent.name.replace(/\s+/g, '')}Agent {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.mirroros.dev';
    this.agentId = '${agent.id}';
  }

  async chat(message, context = {}) {
    const response = await fetch(\`\${this.baseUrl}/agents/\${this.agentId}/chat\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        context
      })
    });

    return response.json();
  }

  async getStatus() {
    const response = await fetch(\`\${this.baseUrl}/agents/\${this.agentId}/status\`, {
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`
      }
    });

    return response.json();
  }
}

module.exports = ${agent.name.replace(/\s+/g, '')}Agent;
`;
  }

  generateReadme(agent) {
    return `# ${agent.name}

${agent.description}

## Configuration

\`\`\`json
${JSON.stringify(agent.config, null, 2)}
\`\`\`

## Usage

This agent can be integrated into your applications using the provided API wrapper or by importing the configuration directly.

## Prompts

${agent.prompts.map(prompt => `- ${prompt.name}: ${prompt.description}`).join('\n')}

## Created

${agent.metadata.created}

## Version

${agent.metadata.version}
`;
  }

  generateSampleCode(agent) {
    return `
// Sample integration code for ${agent.name}
const agent = require('./agent.json');

class ${agent.name.replace(/\s+/g, '')}Integration {
  constructor() {
    this.config = agent.config;
    this.prompts = agent.prompts;
  }

  async processMessage(message) {
    // Implement your message processing logic here
    console.log('Processing message:', message);
    
    // Use the agent configuration
    const response = await this.generateResponse(message);
    return response;
  }

  async generateResponse(message) {
    // This is a placeholder - implement your AI integration
    return {
      response: 'Hello from ${agent.name}!',
      confidence: 0.95,
      metadata: {
        agentId: '${agent.id}',
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = ${agent.name.replace(/\s+/g, '')}Integration;
`;
  }

  async getPricingTiers(req, res) {
    res.json({
      tiers: this.config.pricingTiers,
      currency: 'USD'
    });
  }

  async monetizeAgent(req, res) {
    try {
      const agent = this.agents.get(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      const { tier, price, features } = req.body;
      
      agent.pricing = {
        tier,
        price: parseFloat(price),
        features: features || [],
        monetized: true,
        monetizedAt: new Date().toISOString()
      };

      this.agents.set(agent.id, agent);

      await this.vaultLogger.log('agent-monetization', 'agent_monetized', {
        agentId: agent.id,
        tier,
        price
      });

      res.json({
        success: true,
        agent
      });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  incrementVersion(version) {
    const parts = version.split('.');
    parts[2] = (parseInt(parts[2]) + 1).toString();
    return parts.join('.');
  }

  start(port) {
    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`Monetization server running on port ${port}`);
        resolve();
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

module.exports = MonetizationServer;