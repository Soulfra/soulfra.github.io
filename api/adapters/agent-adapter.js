/**
 * Agent Adapter
 *
 * Bridges new EnsembleBuilder (browser) with existing
 * agents/agent-builder.js (Node.js).
 *
 * This adapter provides a UNIFIED interface that works in both
 * environments, routing to the appropriate backend.
 *
 * Purpose: INTEGRATION not DUPLICATION
 * - Browser → Use EnsembleBuilder
 * - Node.js → Use existing AgentBuilder (with vault integration)
 *
 * Usage:
 *   const adapter = new AgentAdapter();
 *   const agent = await adapter.buildAgent(conversation, { vaultIntegration: true });
 */

class AgentAdapter {
  constructor(options = {}) {
    this.options = options;

    // Detect environment
    this.isNode = typeof process !== 'undefined' &&
                  process.versions != null &&
                  process.versions.node != null;

    this.isBrowser = typeof window !== 'undefined';

    // Initialize appropriate backend
    this.initializeBackend();

    console.log(`🤖 AgentAdapter initialized (${this.isNode ? 'Node.js' : 'Browser'} mode)`);
  }

  /**
   * Initialize backend based on environment
   */
  initializeBackend() {
    if (this.isNode) {
      // Node.js: Use existing agents/agent-builder.js
      try {
        const path = require('path');
        const AgentBuilder = require(path.join(__dirname, '../../agents/agent-builder.js'));
        this.backend = new AgentBuilder();
        this.backendType = 'legacy';
        console.log('✅ Using existing agents/agent-builder.js (vault-integrated)');
      } catch (error) {
        console.warn('⚠️ Could not load agents/agent-builder.js:', error.message);
        this.backend = null;
        this.backendType = 'none';
      }
    } else if (this.isBrowser) {
      // Browser: Use new EnsembleBuilder
      if (typeof EnsembleBuilder !== 'undefined') {
        this.backend = new EnsembleBuilder(this.options);
        this.backendType = 'modern';
        console.log('✅ Using EnsembleBuilder (browser)');
      } else {
        console.warn('⚠️ EnsembleBuilder not loaded');
        this.backend = null;
        this.backendType = 'none';
      }
    }
  }

  /**
   * Build agent from conversation (unified interface)
   *
   * @param {string|array|object} conversation - Conversation data
   * @param {object} options - Build options
   * @returns {Promise<object>} Built agent
   */
  async buildAgent(conversation, options = {}) {
    if (!this.backend) {
      throw new Error('No agent backend available');
    }

    const {
      vaultIntegration = true,
      category = 'ui',
      featureName = null
    } = options;

    console.log(`🔨 Building agent from conversation...`);

    // Extract agent specification from conversation
    const spec = await this.extractAgentSpec(conversation, options);

    // Route to appropriate method based on backend
    if (this.backendType === 'legacy') {
      return await this.buildLegacyAgent(spec, options);
    } else if (this.backendType === 'modern') {
      return await this.buildModernAgent(conversation, spec, options);
    }
  }

  /**
   * Extract agent specification from conversation
   */
  async extractAgentSpec(conversation, options = {}) {
    const conversationText = this.getConversationText(conversation);

    // Extract key information
    const name = this.extractAgentName(conversationText);
    const purpose = this.extractAgentPurpose(conversationText);
    const systemPrompt = this.extractSystemPrompt(conversationText);
    const capabilities = this.extractCapabilities(conversationText);
    const requirements = this.extractRequirements(conversationText);

    return {
      name,
      purpose,
      systemPrompt,
      capabilities,
      requirements,
      conversationText,
      category: options.category || 'ui',
      vaultIntegration: options.vaultIntegration !== false
    };
  }

  /**
   * Get conversation text from various formats
   */
  getConversationText(conversation) {
    if (typeof conversation === 'string') {
      return conversation;
    }

    if (Array.isArray(conversation)) {
      return conversation.map(msg => {
        if (typeof msg === 'string') return msg;
        if (msg.message) return msg.message;
        if (msg.response) return msg.response;
        if (msg.content) return msg.content;
        return '';
      }).join('\n\n');
    }

    if (conversation.response) {
      return conversation.response;
    }

    if (conversation.messages) {
      return this.getConversationText(conversation.messages);
    }

    return String(conversation);
  }

  /**
   * Extract agent name from conversation
   */
  extractAgentName(text) {
    const patterns = [
      /build (?:a |an |the )?(.+?)(?:\s+agent|\s+that)/i,
      /create (?:a |an |the )?(.+?)(?:\s+agent|\s+that)/i,
      /make (?:a |an |the )?(.+?)(?:\s+agent|\s+that)/i,
      /(?:implement|add) (?:a |an |the )?(.+?)(?:\s+agent|\s+that)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return this.sanitizeName(match[1]);
      }
    }

    return `agent-${Date.now()}`;
  }

  /**
   * Extract agent purpose
   */
  extractAgentPurpose(text) {
    const patterns = [
      /agent (?:that|to) (.+?)(?:\.|$)/i,
      /(?:build|create|make) .+? (?:that|to) (.+?)(?:\.|$)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Assist with tasks';
  }

  /**
   * Extract system prompt from conversation
   */
  extractSystemPrompt(text) {
    // Look for explicit system prompt
    const systemPromptMatch = text.match(/system prompt[:\s]+["']?(.+?)["']?(?:\n|$)/i);
    if (systemPromptMatch) {
      return systemPromptMatch[1].trim();
    }

    // Generate from purpose
    const purpose = this.extractAgentPurpose(text);
    return `You are a helpful AI assistant. Your purpose is to ${purpose}. Provide clear, accurate, and helpful responses.`;
  }

  /**
   * Extract capabilities
   */
  extractCapabilities(text) {
    const capabilities = [];

    // Look for capability keywords
    const capabilityKeywords = {
      'routing': ['route', 'routing', 'direct', 'send to'],
      'analysis': ['analyze', 'analysis', 'examine', 'study'],
      'generation': ['generate', 'create', 'build', 'make'],
      'search': ['search', 'find', 'lookup', 'query'],
      'chat': ['chat', 'conversation', 'dialogue', 'talk'],
      'data-processing': ['process', 'transform', 'convert', 'parse']
    };

    const textLower = text.toLowerCase();

    for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword)) {
          capabilities.push(capability);
          break;
        }
      }
    }

    return [...new Set(capabilities)]; // Remove duplicates
  }

  /**
   * Extract requirements
   */
  extractRequirements(text) {
    const requirements = [];
    const lines = text.split('\n');

    for (const line of lines) {
      if (/^[\s]*[-*•]\s+(.+)/.test(line) || /^[\s]*\d+\.\s+(.+)/.test(line)) {
        const match = line.match(/^[\s]*(?:[-*•]|\d+\.)\s+(.+)/);
        if (match) {
          requirements.push(match[1].trim());
        }
      }
    }

    return requirements;
  }

  /**
   * Sanitize agent name
   */
  sanitizeName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);
  }

  /**
   * Build agent using legacy system (agents/agent-builder.js)
   */
  async buildLegacyAgent(spec, options) {
    console.log('🏗️ Building agent with legacy system (vault-integrated)...');

    // Map spec to legacy format
    const legacySpec = {
      id: this.generateAgentID(spec.name),
      name: spec.name,
      displayName: this.titleCase(spec.name),
      description: spec.purpose,
      systemPrompt: spec.systemPrompt,
      capabilities: spec.capabilities,
      vaultIntegration: spec.vaultIntegration,
      metadata: {
        requirements: spec.requirements,
        conversationExtract: spec.conversationText?.substring(0, 500) || '',
        autoGenerated: true,
        domain: 'calriven'
      }
    };

    // Use existing agent builder
    const result = await this.backend.createAgent(legacySpec);

    // Normalize result to unified format
    return {
      type: 'agent',
      id: result.id || legacySpec.id,
      name: legacySpec.name,
      displayName: legacySpec.displayName,
      systemPrompt: legacySpec.systemPrompt,
      capabilities: legacySpec.capabilities,
      metadata: {
        ...legacySpec.metadata,
        backend: 'legacy',
        vaultPath: result.vaultPath,
        timestamp: Date.now()
      },
      agentData: result
    };
  }

  /**
   * Build agent using modern system (EnsembleBuilder)
   */
  async buildModernAgent(conversation, spec, options) {
    console.log('🏗️ Building agent with modern system (browser)...');

    // Use EnsembleBuilder
    const feature = await this.backend.buildFromConversation(conversation, {
      featureName: spec.name,
      category: spec.category,
      autoExtract: false
    });

    // Add agent-specific metadata
    return {
      type: 'agent',
      id: feature.id,
      name: feature.name,
      displayName: feature.displayName,
      systemPrompt: spec.systemPrompt,
      capabilities: spec.capabilities,
      metadata: {
        ...feature.metadata,
        backend: 'modern',
        timestamp: Date.now()
      },
      files: feature.files,
      deployment: feature.deployment
    };
  }

  /**
   * Generate agent ID
   */
  generateAgentID(name) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${name}-${timestamp}-${random}`;
  }

  /**
   * Title case conversion
   */
  titleCase(str) {
    return str.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get agent by ID (unified interface)
   */
  getAgent(agentID) {
    if (!this.backend) {
      return null;
    }

    if (this.backendType === 'legacy') {
      return this.backend.loadAgent(agentID);
    } else if (this.backendType === 'modern') {
      return this.backend.getFeature(agentID);
    }
  }

  /**
   * List all agents
   */
  listAgents(options = {}) {
    if (!this.backend) {
      return [];
    }

    if (this.backendType === 'legacy') {
      return this.backend.listAgents(options);
    } else if (this.backendType === 'modern') {
      return this.backend.getBuildHistory(options.limit || 10);
    }
  }

  /**
   * Get backend info
   */
  getBackendInfo() {
    return {
      environment: this.isNode ? 'Node.js' : 'Browser',
      backendType: this.backendType,
      backendAvailable: this.backend !== null,
      capabilities: this.getCapabilities()
    };
  }

  /**
   * Get available capabilities
   */
  getCapabilities() {
    if (!this.backend) {
      return [];
    }

    const capabilities = ['build', 'extract-spec', 'list'];

    if (this.backendType === 'legacy') {
      capabilities.push('vault-integration', 'template-system', 'agent-storage');
    }

    if (this.backendType === 'modern') {
      capabilities.push('browser-compatible', 'conversation-parsing', 'feature-packaging');
    }

    return capabilities;
  }

  /**
   * Check if adapter is ready
   */
  isReady() {
    return this.backend !== null;
  }

  /**
   * Export agent as JSON
   */
  exportAgent(agent) {
    return JSON.stringify(agent, null, 2);
  }

  /**
   * Import agent from JSON
   */
  importAgent(json) {
    try {
      const agent = typeof json === 'string' ? JSON.parse(json) : json;
      console.log(`📥 Imported agent: ${agent.name}`);
      return agent;
    } catch (error) {
      console.error('❌ Failed to import agent:', error);
      return null;
    }
  }
}

// Browser export
if (typeof window !== 'undefined') {
  window.AgentAdapter = AgentAdapter;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AgentAdapter;
}
