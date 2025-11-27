// Enhanced AI Router with Ollama Integration
const fetch = require('node-fetch');

class EnhancedAIRouter {
  constructor(db, trustEngine) {
    this.db = db;
    this.trustEngine = trustEngine;
    this.providers = this.initializeProviders();
  }

  initializeProviders() {
    return {
      ollama: {
        name: 'Ollama (Local)',
        cost_per_1k_tokens: 0.000, // Free!
        quality_tier: 'standard',
        max_tokens: 4000,
        available: true, // Always available once installed
        endpoint: 'http://localhost:11434/api/generate'
      },
      mock: {
        name: 'Mock Provider',
        cost_per_1k_tokens: 0.001,
        quality_tier: 'basic',
        max_tokens: 1000,
        available: true
      },
      openai_gpt35: {
        name: 'OpenAI GPT-3.5',
        cost_per_1k_tokens: 0.002,
        quality_tier: 'standard',
        max_tokens: 4000,
        available: !!process.env.OPENAI_API_KEY
      },
      openai_gpt4: {
        name: 'OpenAI GPT-4',
        cost_per_1k_tokens: 0.060,
        quality_tier: 'premium',
        max_tokens: 8000,
        available: !!process.env.OPENAI_API_KEY
      },
      anthropic_claude: {
        name: 'Anthropic Claude',
        cost_per_1k_tokens: 0.015,
        quality_tier: 'premium',
        max_tokens: 100000,
        available: !!process.env.ANTHROPIC_API_KEY
      }
    };
  }

  async route(messages, user, options = {}) {
    const startTime = Date.now();
    
    // Select provider based on trust score
    const selectedProvider = this.selectProvider(user.trust_score);
    
    // Calculate cost with trust discount
    const baseCost = this.providers[selectedProvider].cost_per_1k_tokens;
    const discount = this.trustEngine.calculateDiscount(user.trust_score);
    const finalCost = baseCost * (1 - discount / 100);

    // Generate response
    const response = await this.generateResponse(selectedProvider, messages, options);
    
    const routing_info = {
      user_trust_score: user.trust_score,
      user_tier: user.tier,
      available_providers: Object.keys(this.providers).filter(p => this.providers[p].available),
      selected_provider: selectedProvider,
      reasoning: `Trust score ${user.trust_score} -> ${this.providers[selectedProvider].quality_tier} tier`,
      discount_applied: discount,
      base_cost: baseCost,
      final_cost: finalCost,
      ollama_available: this.providers.ollama.available
    };

    return {
      response: response.content,
      provider: selectedProvider,
      model: this.providers[selectedProvider].name,
      cost: finalCost,
      tokens_input: response.tokens_input,
      tokens_output: response.tokens_output,
      routing_info
    };
  }

  selectProvider(trustScore) {
    // NEW: Ollama-first routing for all users
    if (this.providers.ollama.available) {
      // Check if Ollama is actually running
      return this.checkOllamaHealth().then(isHealthy => {
        if (isHealthy) return 'ollama';
        
        // Fallback to other providers if Ollama down
        if (trustScore >= 70) {
          if (this.providers.openai_gpt4.available) return 'openai_gpt4';
          if (this.providers.anthropic_claude.available) return 'anthropic_claude';
          if (this.providers.openai_gpt35.available) return 'openai_gpt35';
        } else if (trustScore >= 50) {
          if (this.providers.openai_gpt35.available) return 'openai_gpt35';
        }
        
        return 'mock';
      }).catch(() => 'mock');
    }

    // Original routing if no Ollama
    if (trustScore >= 70) {
      if (this.providers.openai_gpt4.available) return 'openai_gpt4';
      if (this.providers.anthropic_claude.available) return 'anthropic_claude';
      if (this.providers.openai_gpt35.available) return 'openai_gpt35';
    } else if (trustScore >= 50) {
      if (this.providers.openai_gpt35.available) return 'openai_gpt35';
    }
    
    return 'mock';
  }

  async checkOllamaHealth() {
    try {
      const response = await fetch('http://localhost:11434/api/tags', { timeout: 2000 });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async generateResponse(provider, messages, options) {
    switch (provider) {
      case 'ollama':
        return this.generateOllamaResponse(messages, options);
      case 'openai_gpt35':
      case 'openai_gpt4':
        return this.generateOpenAIResponse(provider, messages, options);
      case 'anthropic_claude':
        return this.generateAnthropicResponse(messages, options);
      default:
        return this.generateMockResponse(messages, provider);
    }
  }

  async generateOllamaResponse(messages, options) {
    try {
      // Convert messages to single prompt for Ollama
      const prompt = messages.map(msg => {
        if (msg.role === 'system') return `System: ${msg.content}`;
        if (msg.role === 'user') return `Human: ${msg.content}`;
        if (msg.role === 'assistant') return `Assistant: ${msg.content}`;
        return msg.content;
      }).join('\n\n') + '\n\nAssistant:';

      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          prompt: prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.max_tokens || 1000,
            top_p: 0.9
          }
        }),
        timeout: 30000
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.response.trim(),
        tokens_input: Math.ceil(prompt.length / 4),
        tokens_output: Math.ceil(data.response.length / 4)
      };

    } catch (error) {
      console.error('Ollama error:', error);
      // Fallback to mock
      return this.generateMockResponse(messages, 'ollama_fallback');
    }
  }

  async generateOpenAIResponse(provider, messages, options) {
    // TODO: Implement real OpenAI calls when API key provided
    return this.generateMockResponse(messages, provider);
  }

  async generateAnthropicResponse(messages, options) {
    // TODO: Implement real Anthropic calls when API key provided  
    return this.generateMockResponse(messages, 'anthropic_claude');
  }

  generateMockResponse(messages, provider = 'mock') {
    const lastMessage = messages[messages.length - 1];
    const userInput = lastMessage.content;
    
    const responses = {
      mock: `[Mock Response] I understand your message: "${userInput.substring(0, 50)}..."\n\nThis is a simulated response. Set up Ollama or API keys for real AI responses.`,
      
      ollama_fallback: `[Ollama Unavailable] Your message: "${userInput.substring(0, 30)}..."\n\nOllama seems to be offline. Please start Ollama with 'ollama serve' and ensure the Mistral model is downloaded.`,
      
      openai_gpt35: `[Simulated GPT-3.5] Thank you for: "${userInput.substring(0, 30)}..."\n\nAdd OPENAI_API_KEY to your .env file to enable real OpenAI responses.`,
      
      openai_gpt4: `[Simulated GPT-4] I'll help with: "${userInput.substring(0, 30)}..."\n\nAdd OPENAI_API_KEY to your .env file to enable real GPT-4 responses.`,
      
      anthropic_claude: `[Simulated Claude] I'd be happy to help with: "${userInput.substring(0, 30)}..."\n\nAdd ANTHROPIC_API_KEY to your .env file to enable real Claude responses.`
    };

    const response = responses[provider] || responses.mock;
    
    return {
      content: response,
      tokens_input: Math.ceil(userInput.length / 4),
      tokens_output: Math.ceil(response.length / 4)
    };
  }
}

module.exports = EnhancedAIRouter;
