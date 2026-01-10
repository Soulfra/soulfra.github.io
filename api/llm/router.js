/**
 * LLM Router with Obfuscation
 *
 * Routes queries to multiple LLM providers:
 * - Ollama (local, private)
 * - OpenRouter (cloud, fallback)
 * - Custom models (extensible)
 *
 * Features:
 * - Model selection based on query type
 * - Response obfuscation (hide model source)
 * - Fallback chain
 * - Load balancing
 * - Cost optimization
 */

class LLMRouter {
  constructor() {
    this.models = {
      // Fast models (for quick queries)
      fast: [
        { name: 'deathtodata-model', provider: 'ollama', model: 'deathtodata-model:latest', speed: 'fast', cost: 0 },
        { name: 'ollama-mistral', provider: 'ollama', model: 'mistral', speed: 'fast', cost: 0 },
        { name: 'ollama-llama3', provider: 'ollama', model: 'llama3:latest', speed: 'fast', cost: 0 }
      ],

      // Creative models (for poetic/creative responses)
      creative: [
        { name: 'calos-model', provider: 'ollama', model: 'calos-model:latest', speed: 'medium', cost: 0 },
        { name: 'drseuss-model', provider: 'ollama', model: 'drseuss-model:latest', speed: 'medium', cost: 0 }
      ],

      // Reasoning models (for complex analysis)
      reasoning: [
        { name: 'soulfra-model', provider: 'ollama', model: 'soulfra-model:latest', speed: 'medium', cost: 0 },
        { name: 'ollama-deepseek', provider: 'ollama', model: 'deepseek-coder', speed: 'medium', cost: 0 },
        { name: 'openrouter-claude', provider: 'openrouter', model: 'anthropic/claude-3-sonnet', speed: 'medium', cost: 0.003 }
      ],

      // Search models (for web-augmented queries)
      search: [
        { name: 'perplexity', provider: 'openrouter', model: 'perplexity/sonar-medium-online', speed: 'slow', cost: 0.005 }
      ],

      // Ensemble (all custom models)
      ensemble: [
        { name: 'calos-model', provider: 'ollama', model: 'calos-model:latest', speed: 'medium', cost: 0 },
        { name: 'soulfra-model', provider: 'ollama', model: 'soulfra-model:latest', speed: 'medium', cost: 0 },
        { name: 'deathtodata-model', provider: 'ollama', model: 'deathtodata-model:latest', speed: 'fast', cost: 0 }
      ]
    };

    this.providers = {
      ollama: {
        baseURL: 'http://localhost:11434',
        available: false
      },
      openrouter: {
        baseURL: 'https://openrouter.ai/api/v1',
        apiKey: null, // Set via config
        available: false
      }
    };

    this.stats = {
      totalQueries: 0,
      byModel: {},
      byProvider: {},
      failedQueries: 0
    };
  }

  /**
   * Initialize router - check provider availability
   */
  async initialize() {
    console.log('🔌 LLM Router initializing...');

    // Check Ollama
    try {
      const response = await fetch(`${this.providers.ollama.baseURL}/api/tags`);
      this.providers.ollama.available = response.ok;
      console.log('✅ Ollama:', this.providers.ollama.available ? 'online' : 'offline');
    } catch (e) {
      console.log('⚠️ Ollama: offline');
    }

    // Check OpenRouter (if API key set)
    if (this.providers.openrouter.apiKey) {
      try {
        const response = await fetch(`${this.providers.openrouter.baseURL}/models`, {
          headers: { 'Authorization': `Bearer ${this.providers.openrouter.apiKey}` }
        });
        this.providers.openrouter.available = response.ok;
        console.log('✅ OpenRouter:', this.providers.openrouter.available ? 'online' : 'offline');
      } catch (e) {
        console.log('⚠️ OpenRouter: offline');
      }
    }

    return {
      ollama: this.providers.ollama.available,
      openrouter: this.providers.openrouter.available
    };
  }

  /**
   * Route query to best model based on intent
   */
  async route(query, options = {}) {
    this.stats.totalQueries++;

    const {
      intent = 'fast',           // fast | reasoning | search
      requireLocal = false,      // Only use local Ollama
      maxCost = 0.01,           // Max cost per query
      obfuscate = true,         // Hide model source in response
      domain = null,            // Domain context to inject
      injectContext = true      // Whether to inject domain context
    } = options;

    console.log(`🔀 Routing query (intent: ${intent})${domain ? `, domain: ${domain}` : ''}`);

    // Get candidate models for this intent
    const candidates = this.getCandidates(intent, requireLocal, maxCost);

    if (candidates.length === 0) {
      console.error('❌ No available models');
      return {
        success: false,
        error: 'No available models',
        response: null,
        model: null
      };
    }

    // Try each candidate in order (fallback chain)
    for (const model of candidates) {
      try {
        const result = await this.queryModel(model, query, { domain, injectContext });

        // Update stats
        this.stats.byModel[model.name] = (this.stats.byModel[model.name] || 0) + 1;
        this.stats.byProvider[model.provider] = (this.stats.byProvider[model.provider] || 0) + 1;

        // Obfuscate source if requested
        if (obfuscate) {
          result.model = 'soulfra-llm'; // Hide actual model
          result.provider = 'soulfra';
        }

        console.log(`✅ Response from ${model.name}`);
        return result;

      } catch (error) {
        console.warn(`⚠️ ${model.name} failed:`, error.message);
        continue; // Try next model
      }
    }

    // All models failed
    this.stats.failedQueries++;
    console.error('❌ All models failed');
    return {
      success: false,
      error: 'All models unavailable',
      response: null,
      model: null
    };
  }

  /**
   * Get candidate models based on criteria
   */
  getCandidates(intent, requireLocal, maxCost) {
    let candidates = this.models[intent] || this.models.fast;

    // Filter by availability
    candidates = candidates.filter(model => {
      const provider = this.providers[model.provider];
      return provider && provider.available;
    });

    // Filter by local requirement
    if (requireLocal) {
      candidates = candidates.filter(m => m.provider === 'ollama');
    }

    // Filter by cost
    candidates = candidates.filter(m => m.cost <= maxCost);

    // Sort by speed (fast first)
    candidates.sort((a, b) => {
      const speedOrder = { fast: 0, medium: 1, slow: 2 };
      return speedOrder[a.speed] - speedOrder[b.speed];
    });

    return candidates;
  }

  /**
   * Query a specific model with optional domain context
   */
  async queryModel(model, query, options = {}) {
    const { domain = null, injectContext = true } = options;

    // Inject domain context if available and requested
    let finalQuery = query;
    if (injectContext && domain && typeof window !== 'undefined' && window.DomainContext) {
      const contextData = window.DomainContext.injectContext(query, domain);
      finalQuery = contextData.fullPrompt;
      console.log(`🌐 Injected ${domain} context into query`);
    }

    if (model.provider === 'ollama') {
      return await this.queryOllama(model, finalQuery);
    } else if (model.provider === 'openrouter') {
      return await this.queryOpenRouter(model, finalQuery);
    } else {
      throw new Error(`Unknown provider: ${model.provider}`);
    }
  }

  /**
   * Query Ollama
   */
  async queryOllama(model, query) {
    const startTime = Date.now();

    const response = await fetch(`${this.providers.ollama.baseURL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model.model,
        prompt: query,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    return {
      success: true,
      response: data.response,
      model: model.name,
      provider: model.provider,
      responseTime: responseTime,
      cost: 0
    };
  }

  /**
   * Query OpenRouter
   */
  async queryOpenRouter(model, query) {
    const startTime = Date.now();

    if (!this.providers.openrouter.apiKey) {
      throw new Error('OpenRouter API key not set');
    }

    const response = await fetch(`${this.providers.openrouter.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.providers.openrouter.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model.model,
        messages: [{ role: 'user', content: query }]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter error: ${response.status}`);
    }

    const data = await response.json();
    const responseTime = Date.now() - startTime;

    return {
      success: true,
      response: data.choices[0].message.content,
      model: model.name,
      provider: model.provider,
      responseTime: responseTime,
      cost: model.cost
    };
  }

  /**
   * Get router statistics
   */
  getStats() {
    return {
      totalQueries: this.stats.totalQueries,
      failedQueries: this.stats.failedQueries,
      successRate: this.stats.totalQueries > 0
        ? ((this.stats.totalQueries - this.stats.failedQueries) / this.stats.totalQueries * 100).toFixed(1) + '%'
        : '0%',
      byModel: this.stats.byModel,
      byProvider: this.stats.byProvider,
      providers: {
        ollama: this.providers.ollama.available,
        openrouter: this.providers.openrouter.available
      }
    };
  }

  /**
   * Set OpenRouter API key
   */
  setOpenRouterKey(apiKey) {
    this.providers.openrouter.apiKey = apiKey;
    console.log('✅ OpenRouter API key set');
  }

  /**
   * Query ensemble - ask all 3 custom models and synthesize
   */
  async queryEnsemble(query, options = {}) {
    const { domain = null, injectContext = true } = options;

    console.log(`🎭 Querying ensemble (calos + soulfra + deathtodata)${domain ? ` with ${domain} context` : ''}...`);

    const models = this.models.ensemble;
    const startTime = Date.now();

    // Query all models in parallel with domain context
    const results = await Promise.allSettled(
      models.map(model => this.queryModel(model, query, { domain, injectContext }))
    );

    // Filter successful responses
    const responses = results
      .filter(r => r.status === 'fulfilled' && r.value.success)
      .map(r => r.value);

    if (responses.length === 0) {
      console.error('❌ All ensemble models failed');
      return {
        success: false,
        error: 'All ensemble models failed',
        response: null
      };
    }

    console.log(`✅ Got ${responses.length}/${models.length} ensemble responses`);

    // Synthesize responses
    const synthesis = await this.synthesizeResponses(responses, query);

    const totalTime = Date.now() - startTime;

    return {
      success: true,
      response: synthesis,
      model: 'soulfra-ensemble',
      provider: 'soulfra',
      responseTime: totalTime,
      cost: 0,
      ensemble: {
        modelsUsed: responses.map(r => r.model),
        individualResponses: responses,
        synthesisMethod: 'weighted-combination'
      }
    };
  }

  /**
   * Synthesize multiple responses into one
   */
  async synthesizeResponses(responses, query) {
    // Find responses by model type
    const calos = responses.find(r => r.model === 'calos-model');
    const soulfra = responses.find(r => r.model === 'soulfra-model');
    const deathtodata = responses.find(r => r.model === 'deathtodata-model');

    // If only one model responded, return it
    if (responses.length === 1) {
      return responses[0].response;
    }

    // Strategy: Use calos as baseline structure, enhance with others
    let synthesis = '';

    // Start with calos (creative baseline)
    if (calos) {
      synthesis = calos.response;
    }

    // Add soulfra depth if significantly different
    if (soulfra && calos) {
      const hasNewInsight = !calos.response.includes(soulfra.response.substring(0, 50));
      if (hasNewInsight) {
        synthesis += '\n\n💭 ' + soulfra.response;
      }
    }

    // Add deathtodata technical details if relevant
    if (deathtodata && (calos || soulfra)) {
      const hasTechnicalDetails = deathtodata.response.length < 500; // Fast, concise
      if (hasTechnicalDetails) {
        synthesis += '\n\n⚡ ' + deathtodata.response;
      }
    }

    // Fallback: if no synthesis strategy worked, concatenate
    if (!synthesis) {
      synthesis = responses.map(r => `${r.model}:\n${r.response}`).join('\n\n---\n\n');
    }

    return synthesis;
  }
}

// Export for browser
if (typeof window !== 'undefined') {
  window.LLMRouter = LLMRouter;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LLMRouter;
}
