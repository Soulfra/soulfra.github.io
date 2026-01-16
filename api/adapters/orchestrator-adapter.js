/**
 * Orchestrator Adapter
 *
 * Bridges new LLMRouter (browser) with existing
 * agents/agent-orchestrator.js (Node.js).
 *
 * This adapter provides a UNIFIED interface that works in both
 * environments, routing to the appropriate backend.
 *
 * Purpose: INTEGRATION not DUPLICATION
 * - Browser → Use LLMRouter (ensemble routing)
 * - Node.js → Use existing agent-orchestrator.js (multi-agent competition)
 *
 * Usage:
 *   const adapter = new OrchestratorAdapter();
 *   const result = await adapter.route(query, { domain: 'calriven' });
 */

class OrchestratorAdapter {
  constructor(options = {}) {
    this.options = options;

    // Detect environment
    this.isNode = typeof process !== 'undefined' &&
                  process.versions != null &&
                  process.versions.node != null;

    this.isBrowser = typeof window !== 'undefined';

    // Initialize appropriate backend
    this.initializeBackend();

    console.log(`🔀 OrchestratorAdapter initialized (${this.isNode ? 'Node.js' : 'Browser'} mode)`);
  }

  /**
   * Initialize backend based on environment
   */
  initializeBackend() {
    if (this.isNode) {
      // Node.js: Use existing agents/agent-orchestrator.js
      try {
        const path = require('path');
        const orchestrator = require(path.join(__dirname, '../../agents/agent-orchestrator.js'));
        this.backend = orchestrator;
        this.backendType = 'legacy';
        console.log('✅ Using existing agents/agent-orchestrator.js');
      } catch (error) {
        console.warn('⚠️ Could not load agents/agent-orchestrator.js:', error.message);
        this.backend = null;
        this.backendType = 'none';
      }
    } else if (this.isBrowser) {
      // Browser: Use new LLMRouter
      if (typeof LLMRouter !== 'undefined') {
        this.backend = new LLMRouter(this.options);
        this.backendType = 'modern';
        console.log('✅ Using LLMRouter (browser)');
      } else {
        console.warn('⚠️ LLMRouter not loaded');
        this.backend = null;
        this.backendType = 'none';
      }
    }
  }

  /**
   * Route query to appropriate LLM (unified interface)
   *
   * @param {string} query - User query
   * @param {object} options - Routing options
   * @returns {Promise<object>} Routing result
   */
  async route(query, options = {}) {
    if (!this.backend) {
      throw new Error('No orchestrator backend available');
    }

    const {
      domain = 'calriven',
      mode = 'ensemble',
      preferredModel = null,
      includeContext = true
    } = options;

    console.log(`🔀 Routing query: "${query.substring(0, 50)}..."`);

    // Route to appropriate method based on backend
    if (this.backendType === 'legacy') {
      return await this.routeLegacy(query, options);
    } else if (this.backendType === 'modern') {
      return await this.routeModern(query, options);
    }
  }

  /**
   * Route using legacy system (agents/agent-orchestrator.js)
   */
  async routeLegacy(query, options) {
    console.log('🏗️ Routing with legacy orchestrator (multi-agent competition)...');

    // Use existing orchestrator
    const result = await this.backend.orchestrate(query);

    if (!result) {
      return {
        type: 'orchestration',
        success: false,
        error: 'No successful responses from agents',
        metadata: {
          backend: 'legacy',
          timestamp: Date.now()
        }
      };
    }

    // Normalize result to unified format
    return {
      type: 'orchestration',
      success: true,
      winner: result.winner,
      response: result.response,
      metadata: {
        backend: 'legacy',
        blameId: result.blameId,
        timestamp: Date.now(),
        vaultLogged: true
      }
    };
  }

  /**
   * Route using modern system (LLMRouter)
   */
  async routeModern(query, options) {
    console.log('🏗️ Routing with modern LLM router (ensemble)...');

    // Determine intent
    const intent = this.detectIntent(query);

    // Route to appropriate model
    const result = await this.backend.route(query, {
      domain: options.domain,
      intent: intent,
      preferredModel: options.preferredModel
    });

    // Return unified format
    return {
      type: 'orchestration',
      success: true,
      model: result.model,
      response: result.response,
      metadata: {
        backend: 'modern',
        intent: result.intent,
        domain: result.domain,
        timestamp: Date.now()
      }
    };
  }

  /**
   * Detect intent from query
   */
  detectIntent(query) {
    const queryLower = query.toLowerCase();

    // Code/technical intents
    if (queryLower.includes('code') || queryLower.includes('implement') ||
        queryLower.includes('build') || queryLower.includes('debug')) {
      return 'code';
    }

    // Research intents
    if (queryLower.includes('research') || queryLower.includes('find') ||
        queryLower.includes('search') || queryLower.includes('what is')) {
      return 'research';
    }

    // Creative intents
    if (queryLower.includes('write') || queryLower.includes('create') ||
        queryLower.includes('generate') || queryLower.includes('design')) {
      return 'creative';
    }

    // Analysis intents
    if (queryLower.includes('analyze') || queryLower.includes('explain') ||
        queryLower.includes('compare') || queryLower.includes('review')) {
      return 'analysis';
    }

    // Chat/conversation
    return 'chat';
  }

  /**
   * Batch route multiple queries
   */
  async batchRoute(queries, options = {}) {
    if (!this.backend) {
      throw new Error('No orchestrator backend available');
    }

    console.log(`🔀 Batch routing ${queries.length} queries...`);

    const results = [];

    for (const query of queries) {
      try {
        const result = await this.route(query, options);
        results.push(result);
      } catch (error) {
        results.push({
          type: 'orchestration',
          success: false,
          error: error.message,
          query: query.substring(0, 50)
        });
      }
    }

    return results;
  }

  /**
   * Get routing statistics
   */
  getStats() {
    if (!this.backend) {
      return null;
    }

    if (this.backendType === 'legacy') {
      // Read blamechain for stats
      try {
        const fs = require('fs');
        const path = require('path');
        const blamechainPath = path.join(__dirname, '../../vault/blamechain.json');

        if (fs.existsSync(blamechainPath)) {
          const blamechain = JSON.parse(fs.readFileSync(blamechainPath, 'utf8'));

          // Calculate stats
          const agentWins = {};
          blamechain.forEach(entry => {
            if (entry.winner && entry.winner !== 'none') {
              agentWins[entry.winner] = (agentWins[entry.winner] || 0) + 1;
            }
          });

          return {
            totalQueries: blamechain.length,
            agentWins,
            backend: 'legacy'
          };
        }
      } catch (error) {
        console.warn('⚠️ Could not read blamechain:', error.message);
      }

      return { backend: 'legacy', available: false };
    } else if (this.backendType === 'modern') {
      return this.backend.getRoutingStats();
    }

    return null;
  }

  /**
   * Get routing history
   */
  getHistory(limit = 10) {
    if (!this.backend) {
      return [];
    }

    if (this.backendType === 'legacy') {
      // Read from blamechain
      try {
        const fs = require('fs');
        const path = require('path');
        const blamechainPath = path.join(__dirname, '../../vault/blamechain.json');

        if (fs.existsSync(blamechainPath)) {
          const blamechain = JSON.parse(fs.readFileSync(blamechainPath, 'utf8'));
          return blamechain.slice(-limit).map(entry => ({
            prompt: entry.prompt,
            winner: entry.winner,
            timestamp: entry.timestamp,
            blameId: entry.id
          }));
        }
      } catch (error) {
        console.warn('⚠️ Could not read blamechain:', error.message);
      }

      return [];
    } else if (this.backendType === 'modern') {
      return this.backend.getRoutingHistory(limit);
    }

    return [];
  }

  /**
   * Test routing with sample queries
   */
  async testRouting() {
    console.log('🧪 Testing routing with sample queries...');

    const testQueries = [
      'How do I build a feature with Calriven?',
      'Explain the mirror system architecture',
      'Generate a QR code for my agent',
      'What is the trust chain in Cal?'
    ];

    const results = [];

    for (const query of testQueries) {
      console.log(`\n📝 Testing: "${query}"`);

      try {
        const result = await this.route(query, { domain: 'calriven' });
        results.push({
          query,
          success: result.success,
          backend: result.metadata?.backend,
          model: result.winner || result.model
        });

        console.log(`✅ Routed successfully (${result.metadata?.backend || 'unknown'})`);
      } catch (error) {
        results.push({
          query,
          success: false,
          error: error.message
        });

        console.log(`❌ Routing failed: ${error.message}`);
      }
    }

    return results;
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

    const capabilities = ['route', 'batch-route', 'stats', 'history'];

    if (this.backendType === 'legacy') {
      capabilities.push(
        'multi-agent-competition',
        'qr-trust-verification',
        'memory-context',
        'blamechain-logging',
        'vault-integration',
        'tone-analysis',
        'agent-cooldowns'
      );
    }

    if (this.backendType === 'modern') {
      capabilities.push(
        'ensemble-routing',
        'intent-detection',
        'domain-context',
        'browser-compatible',
        'model-selection'
      );
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
   * Get recommended model for query
   */
  getRecommendedModel(query, domain = 'calriven') {
    const intent = this.detectIntent(query);

    const recommendations = {
      code: 'soulfra-model',
      research: 'calos-model',
      creative: 'deathtodata-model',
      analysis: 'calos-model',
      chat: 'calos-model'
    };

    return recommendations[intent] || 'calos-model';
  }

  /**
   * Explain routing decision
   */
  explainRouting(query, options = {}) {
    const intent = this.detectIntent(query);
    const recommendedModel = this.getRecommendedModel(query, options.domain);

    return {
      query: query.substring(0, 100),
      detectedIntent: intent,
      recommendedModel,
      backend: this.backendType,
      reasoning: this.getRoutingReasoning(intent, recommendedModel)
    };
  }

  /**
   * Get routing reasoning
   */
  getRoutingReasoning(intent, model) {
    const reasoning = {
      'code': `Code-related query detected. ${model} is optimized for technical implementation and software development.`,
      'research': `Research query detected. ${model} provides comprehensive analysis and factual information.`,
      'creative': `Creative task detected. ${model} excels at content generation and creative writing.`,
      'analysis': `Analysis task detected. ${model} provides detailed examination and insights.`,
      'chat': `Conversational query detected. ${model} is the baseline model for general interaction.`
    };

    return reasoning[intent] || `General query routed to ${model}.`;
  }
}

// Browser export
if (typeof window !== 'undefined') {
  window.OrchestratorAdapter = OrchestratorAdapter;
}

// Node.js export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OrchestratorAdapter;
}
