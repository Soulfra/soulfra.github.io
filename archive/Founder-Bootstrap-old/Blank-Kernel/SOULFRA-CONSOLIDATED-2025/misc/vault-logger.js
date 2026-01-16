const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class VaultLogger {
  constructor(config) {
    this.basePath = config.basePath || './vault';
    this.loggingEnabled = config.loggingEnabled !== false;
    this.encryptionEnabled = config.encryptionEnabled || false;
    this.initializeVault();
  }

  async initializeVault() {
    const vaultDirs = [
      'logs',
      'conversations',
      'agents',
      'reviews',
      'checkins',
      'exports',
      'analytics',
      'backups'
    ];

    for (const dir of vaultDirs) {
      await fs.mkdir(path.join(this.basePath, dir), { recursive: true });
    }

    // Initialize vault metadata
    const metadataPath = path.join(this.basePath, 'vault-metadata.json');
    try {
      await fs.access(metadataPath);
    } catch {
      await this.writeJSON(metadataPath, {
        created: new Date().toISOString(),
        version: '1.0.0',
        modules: []
      });
    }
  }

  async log(module, action, data) {
    if (!this.loggingEnabled) return;

    const logEntry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      module,
      action,
      data,
      sessionId: global.sessionId || 'system'
    };

    // Write to module-specific log
    const moduleLogPath = path.join(this.basePath, 'logs', `${module}.log`);
    await this.appendLog(moduleLogPath, logEntry);

    // Write to master log
    const masterLogPath = path.join(this.basePath, 'logs', 'master.log');
    await this.appendLog(masterLogPath, logEntry);

    // Update blamechain if exists
    await this.updateBlamechain(logEntry);

    return logEntry;
  }

  async saveConversation(userId, messages) {
    const conversationId = uuidv4();
    const conversationPath = path.join(
      this.basePath,
      'conversations',
      `${userId}-${conversationId}.json`
    );

    const conversation = {
      id: conversationId,
      userId,
      timestamp: new Date().toISOString(),
      messages,
      metadata: {
        messageCount: messages.length,
        duration: this.calculateDuration(messages)
      }
    };

    await this.writeJSON(conversationPath, conversation);
    await this.log('cal-chat', 'conversation_saved', { conversationId, userId });

    return conversationId;
  }

  async saveAgent(agentData) {
    const agentPath = path.join(
      this.basePath,
      'agents',
      `${agentData.id}.json`
    );

    const agent = {
      ...agentData,
      created: new Date().toISOString(),
      version: 1,
      exports: []
    };

    await this.writeJSON(agentPath, agent);
    await this.log('agent-monetization', 'agent_created', { agentId: agent.id });

    return agent;
  }

  async saveReview(reviewData) {
    const reviewPath = path.join(
      this.basePath,
      'reviews',
      `${reviewData.agentId}-${reviewData.id}.json`
    );

    const review = {
      ...reviewData,
      timestamp: new Date().toISOString()
    };

    await this.writeJSON(reviewPath, review);
    await this.log('vibegraph', 'review_saved', { 
      reviewId: review.id,
      agentId: review.agentId,
      sentiment: review.sentiment
    });

    return review;
  }

  async saveCheckIn(checkInData) {
    const checkInPath = path.join(
      this.basePath,
      'checkins',
      `${checkInData.userId}-${checkInData.timestamp}.json`
    );

    await this.writeJSON(checkInPath, checkInData);
    await this.log('qr-checkin', 'checkin_saved', {
      userId: checkInData.userId,
      locationId: checkInData.locationId
    });

    return checkInData;
  }

  async getAgentAnalytics(agentId) {
    const analyticsPath = path.join(
      this.basePath,
      'analytics',
      `agent-${agentId}.json`
    );

    try {
      return await this.readJSON(analyticsPath);
    } catch {
      return {
        agentId,
        reviews: [],
        rating: 0,
        exports: 0,
        revenue: 0
      };
    }
  }

  async updateAgentAnalytics(agentId, update) {
    const analytics = await this.getAgentAnalytics(agentId);
    const updated = { ...analytics, ...update };
    
    const analyticsPath = path.join(
      this.basePath,
      'analytics',
      `agent-${agentId}.json`
    );

    await this.writeJSON(analyticsPath, updated);
    return updated;
  }

  async updateBlamechain(entry) {
    const blamechainPath = path.join(this.basePath, 'blamechain.json');
    
    try {
      const blamechain = await this.readJSON(blamechainPath);
      blamechain.entries.push({
        ...entry,
        hash: this.generateHash(entry)
      });
      await this.writeJSON(blamechainPath, blamechain);
    } catch {
      // Initialize blamechain if it doesn't exist
      await this.writeJSON(blamechainPath, {
        version: '1.0.0',
        created: new Date().toISOString(),
        entries: [{
          ...entry,
          hash: this.generateHash(entry)
        }]
      });
    }
  }

  // Utility methods
  async writeJSON(filePath, data) {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }

  async readJSON(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  async appendLog(filePath, entry) {
    const line = JSON.stringify(entry) + '\n';
    await fs.appendFile(filePath, line);
  }

  calculateDuration(messages) {
    if (messages.length < 2) return 0;
    const first = new Date(messages[0].timestamp);
    const last = new Date(messages[messages.length - 1].timestamp);
    return Math.floor((last - first) / 1000); // Duration in seconds
  }

  generateHash(data) {
    // Simple hash for demo purposes
    return Buffer.from(JSON.stringify(data)).toString('base64').slice(0, 16);
  }
}

module.exports = VaultLogger;