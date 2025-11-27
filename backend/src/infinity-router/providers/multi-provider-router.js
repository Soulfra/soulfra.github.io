// Multi-Provider Router - Intelligent routing with failover
const fetch = require('node-fetch');

class MultiProviderRouter {
  constructor() {
    this.providers = this.initializeProviders();
    this.healthCache = new Map();
    this.lastHealthCheck = 0;
  }
  
  initializeProviders() {
    return {
      local_ollama: {
        name: 'Local Ollama',
        endpoint: 'http://localhost:11434/api/generate',
        cost_per_1k_tokens: 0.000, // Free!
        quality_tier: 'good',
        max_tokens: 4000,
        health_check: 'http://localhost:11434/api/tags',
        available: false // Will be checked
      },
      
      openai_gpt35: {
        name: 'OpenAI GPT-3.5',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        cost_per_1k_tokens: 0.002,
        quality_tier: 'standard',
        max_tokens: 4000,
        available: !!process.env.OPENAI_API_KEY
      },
      
      openai_gpt4: {
        name: 'OpenAI GPT-4',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        cost_per_1k_tokens: 0.060,
        quality_tier: 'premium',
        max_tokens: 8000,
        available: !!process.env.OPENAI_API_KEY
      },
      
      anthropic_claude: {
        name: 'Anthropic Claude',
        endpoint: 'https://api.anthropic.com/v1/messages',
        cost_per_1k_tokens: 0.015,
        quality_tier: 'premium',
        max_tokens: 100000,
        available: !!process.env.ANTHROPIC_API_KEY
      },
      
      mock: {
        name: 'Mock Provider (Development)',
        cost_per_1k_tokens: 0.001,
        quality_tier: 'basic',
        max_tokens: 1000,
        available: true
      }
    };
  }
  
  async routeRequest(obfuscatedPrompt, routingPolicy, userContext) {
    console.log(`🔀 Routing request (tier: ${routingPolicy.routing_tier})`);
    
    try {
      // Check provider health
      await this.updateProviderHealth();
      
      // Select best available provider
      const selectedProvider = await this.selectOptimalProvider(
        routingPolicy.allowed_providers,
        routingPolicy.routing_tier
      );
      
      console.log(`📡 Selected provider: ${selectedProvider}`);
      
      // Route to provider
      const response = await this.callProvider(selectedProvider, obfuscatedPrompt, userContext);
      
      // Calculate costs
      const cost = this.calculateCost(selectedProvider, response.tokens_used, routingPolicy.cost_multiplier);
      
      return {
        response: response.content,
        provider_used: selectedProvider,
        model: this.providers[selectedProvider].name,
        tokens_used: response.tokens_used,
        cost: cost,
        routing_latency: response.latency,
        fallback_used: false,
        quality_tier: this.providers[selectedProvider].quality_tier
      };
      
    } catch (error) {
      console.error(`🚨 Primary routing failed:`, error);
      
      // Attempt fallback
      return await this.fallbackRouting(obfuscatedPrompt, routingPolicy, userContext, error);
    }
  }
  
  async updateProviderHealth() {
    const now = Date.now();
    if (now - this.lastHealthCheck < 30000) return; // Cache for 30s
    
    // Check Ollama health
    try {
      const response = await fetch('http://localhost:11434/api/tags', { timeout: 2000 });
      this.providers.local_ollama.available = response.ok;
      this.healthCache.set('local_ollama', response.ok);
    } catch {
      this.providers.local_ollama.available = false;
      this.healthCache.set('local_ollama', false);
    }
    
    this.lastHealthCheck = now;
  }
  
  async selectOptimalProvider(allowedProviders, tier) {
    // Filter by availability and policy
    const available = allowedProviders.filter(p => this.providers[p]?.available);
    
    if (available.length === 0) {
      throw new Error('No providers available');
    }
    
    // Ollama first (free, private, fast)
    if (available.includes('local_ollama') && this.healthCache.get('local_ollama')) {
      return 'local_ollama';
    }
    
    // Then by tier preference
    const tierPreferences = {
      platinum: ['openai_gpt4', 'anthropic_claude', 'openai_gpt35'],
      premium: ['openai_gpt4', 'anthropic_claude', 'openai_gpt35'],
      standard: ['openai_gpt35', 'anthropic_claude'],
      basic: ['mock']
    };
    
    const preferences = tierPreferences[tier] || tierPreferences.basic;
    
    for (const provider of preferences) {
      if (available.includes(provider)) {
        return provider;
      }
    }
    
    return available[0]; // First available as last resort
  }
  
  async callProvider(provider, prompt, context) {
    const startTime = Date.now();
    
    switch (provider) {
      case 'local_ollama':
        return await this.callOllama(prompt, context);
      case 'openai_gpt35':
      case 'openai_gpt4':
        return await this.callOpenAI(provider, prompt, context);
      case 'anthropic_claude':
        return await this.callAnthropic(prompt, context);
      default:
        return await this.callMock(prompt, context);
    }
  }
  
  async callOllama(prompt, context) {
    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 1000
          }
        }),
        timeout: 30000
      });
      
      if (!response.ok) {
        throw new Error(`Ollama error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        content: data.response.trim(),
        tokens_used: Math.ceil((prompt.length + data.response.length) / 4),
        latency: Date.now() - Date.now()
      };
      
    } catch (error) {
      throw new Error(`Ollama call failed: ${error.message}`);
    }
  }
  
  async callMock(prompt, context) {
    // Enhanced mock responses
    const responses = [
      `I understand you're asking about "${prompt.substring(0, 30)}..."\n\nThis is a mock response from the Soulfra Infinity Router. Your prompt was successfully obfuscated and routed through the system. For real AI responses, set up Ollama locally or add API keys.`,
      
      `Thank you for your query: "${prompt.substring(0, 30)}..."\n\nYour request was processed through the trust-based routing system with obfuscation level applied. This demonstrates the complete Infinity Router functionality.`,
      
      `Processing request: "${prompt.substring(0, 30)}..."\n\nThe Infinity Router successfully:\n- Applied prompt obfuscation\n- Routed based on trust score\n- Logged to vault\n- Applied billing calculations\n\nAdd real AI providers for live responses!`
    ];
    
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      content: selectedResponse,
      tokens_used: Math.ceil((prompt.length + selectedResponse.length) / 4),
      latency: 100 + Math.random() * 200
    };
  }
  
  calculateCost(provider, tokensUsed, costMultiplier) {
    const baseCost = this.providers[provider].cost_per_1k_tokens * (tokensUsed / 1000);
    return Math.round(baseCost * costMultiplier * 10000) / 10000;
  }
  
  async fallbackRouting(prompt, policy, context, originalError) {
    console.log('🔄 Attempting fallback routing...');
    
    // Try mock as ultimate fallback
    try {
      const response = await this.callMock(prompt, context);
      return {
        ...response,
        provider_used: 'mock_fallback',
        fallback_used: true,
        original_error: originalError.message
      };
    } catch (fallbackError) {
      throw new Error(`All providers failed. Original: ${originalError.message}, Fallback: ${fallbackError.message}`);
    }
  }
}

module.exports = MultiProviderRouter;
