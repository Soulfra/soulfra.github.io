// server.js - Soulfra Multi-Provider AI Platform Backend
// Complete implementation with all features working

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

// Import AI providers
let OpenAI, Anthropic, Cohere;
try {
  OpenAI = require('openai');
} catch (e) {
  console.warn('OpenAI not available - install with: npm install openai');
}
try {
  Anthropic = require('@anthropic-ai/sdk');
} catch (e) {
  console.warn('Anthropic not available - install with: npm install @anthropic-ai/sdk');
}
try {
  Cohere = require('cohere-ai');
} catch (e) {
  console.warn('Cohere not available - install with: npm install cohere-ai');
}

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'soulfra-secret-dev';

// Initialize SQLite Database
const dbPath = process.env.DB_PATH || './soulfra.db';
console.log(`📊 Connecting to database: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.url}`);
  next();
});

// ================================
// PROVIDER SYSTEM IMPLEMENTATION
// ================================

class BaseProvider {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.apiKey = config.apiKey;
    this.isActive = config.isActive !== false;
    this.priority = config.priority || 100;
  }

  async chat(params) {
    throw new Error(`${this.name}: chat method must be implemented`);
  }

  async checkHealth() {
    throw new Error(`${this.name}: checkHealth method must be implemented`);
  }

  estimateCost(inputTokens, outputTokens, modelName) {
    const model = this.getModelInfo(modelName);
    if (!model) return 0;
    
    return (inputTokens / 1000 * model.cost_per_1k_input) + 
           (outputTokens / 1000 * model.cost_per_1k_output);
  }

  getModelInfo(modelName) {
    try {
      const stmt = db.prepare('SELECT * FROM provider_models WHERE provider_id = ? AND model_name = ?');
      return stmt.get(this.id, modelName);
    } catch (error) {
      console.error(`Error getting model info for ${modelName}:`, error);
      return null;
    }
  }

  getAvailableModels() {
    try {
      const stmt = db.prepare('SELECT * FROM provider_models WHERE provider_id = ? ORDER BY quality_score DESC');
      return stmt.all(this.id);
    } catch (error) {
      console.error(`Error getting available models for ${this.id}:`, error);
      return [];
    }
  }
}

// OpenAI Provider Implementation
class OpenAIProvider extends BaseProvider {
  constructor(config) {
    super(config);
    if (this.apiKey && OpenAI) {
      try {
        this.client = new OpenAI({ apiKey: this.apiKey });
      } catch (error) {
        console.error('OpenAI initialization error:', error);
      }
    }
  }

  async chat(params) {
    if (!this.client) {
      throw new Error('OpenAI client not initialized - check API key');
    }
    
    const start = Date.now();
    try {
      const completion = await this.client.chat.completions.create({
        model: params.model || 'gpt-3.5-turbo',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2048,
        timeout: 30000
      });

      const usage = completion.usage || { prompt_tokens: 0, completion_tokens: 0 };
      const cost = this.estimateCost(usage.prompt_tokens, usage.completion_tokens, params.model);

      return {
        content: completion.choices[0]?.message?.content || 'No response generated',
        model: completion.model,
        usage: {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalCost: cost
        },
        provider: this.name,
        latency: Date.now() - start,
        success: true
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        error: error.message || 'OpenAI request failed',
        provider: this.name,
        latency: Date.now() - start,
        success: false
      };
    }
  }

  async checkHealth() {
    if (!this.client) {
      return { 
        healthy: false, 
        error: 'OpenAI client not initialized',
        provider: this.name,
        latency: 0
      };
    }

    const start = Date.now();
    try {
      await this.client.models.list();
      return { 
        healthy: true, 
        latency: Date.now() - start,
        provider: this.name
      };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message,
        provider: this.name,
        latency: Date.now() - start
      };
    }
  }
}

// Anthropic Provider Implementation
class AnthropicProvider extends BaseProvider {
  constructor(config) {
    super(config);
    if (this.apiKey && Anthropic) {
      try {
        this.client = new Anthropic({ apiKey: this.apiKey });
      } catch (error) {
        console.error('Anthropic initialization error:', error);
      }
    }
  }

  async chat(params) {
    if (!this.client) {
      throw new Error('Anthropic client not initialized - check API key');
    }
    
    const start = Date.now();
    try {
      const response = await this.client.messages.create({
        model: params.model || 'claude-3-haiku-20240307',
        max_tokens: params.maxTokens || 2048,
        temperature: params.temperature || 0.7,
        messages: params.messages
      });

      const cost = this.estimateCost(
        response.usage.input_tokens, 
        response.usage.output_tokens, 
        params.model
      );

      return {
        content: response.content[0]?.text || 'No response generated',
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalCost: cost
        },
        provider: this.name,
        latency: Date.now() - start,
        success: true
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      return {
        error: error.message || 'Anthropic request failed',
        provider: this.name,
        latency: Date.now() - start,
        success: false
      };
    }
  }

  async checkHealth() {
    if (!this.client) {
      return { 
        healthy: false, 
        error: 'Anthropic client not initialized',
        provider: this.name,
        latency: 0
      };
    }

    const start = Date.now();
    try {
      // Test with minimal request
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      });
      
      return { 
        healthy: true, 
        latency: Date.now() - start,
        provider: this.name
      };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message,
        provider: this.name,
        latency: Date.now() - start
      };
    }
  }
}

// Cohere Provider Implementation
class CohereProvider extends BaseProvider {
  constructor(config) {
    super(config);
    if (this.apiKey && Cohere) {
      try {
        this.client = new Cohere.CohereApi(this.apiKey);
      } catch (error) {
        console.error('Cohere initialization error:', error);
      }
    }
  }

  async chat(params) {
    if (!this.client) {
      throw new Error('Cohere client not initialized - check API key');
    }
    
    const start = Date.now();
    try {
      // Convert messages to Cohere format
      const message = params.messages[params.messages.length - 1]?.content || '';
      
      const response = await this.client.generate({
        model: params.model || 'command',
        prompt: message,
        maxTokens: params.maxTokens || 2048,
        temperature: params.temperature || 0.7
      });

      const inputTokens = Math.ceil(message.length / 4); // Rough estimate
      const outputTokens = Math.ceil((response.generations[0]?.text || '').length / 4);
      const cost = this.estimateCost(inputTokens, outputTokens, params.model);

      return {
        content: response.generations[0]?.text || 'No response generated',
        model: params.model || 'command',
        usage: {
          inputTokens,
          outputTokens,
          totalCost: cost
        },
        provider: this.name,
        latency: Date.now() - start,
        success: true
      };
    } catch (error) {
      console.error('Cohere API error:', error);
      return {
        error: error.message || 'Cohere request failed',
        provider: this.name,
        latency: Date.now() - start,
        success: false
      };
    }
  }

  async checkHealth() {
    if (!this.client) {
      return { 
        healthy: false, 
        error: 'Cohere client not initialized',
        provider: this.name,
        latency: 0
      };
    }

    const start = Date.now();
    try {
      await this.client.generate({
        model: 'command',
        prompt: 'test',
        maxTokens: 5
      });
      
      return { 
        healthy: true, 
        latency: Date.now() - start,
        provider: this.name
      };
    } catch (error) {
      return { 
        healthy: false, 
        error: error.message,
        provider: this.name,
        latency: Date.now() - start
      };
    }
  }
}

// Mock Provider for Testing
class MockProvider extends BaseProvider {
  constructor(config) {
    super(config);
  }

  async chat(params) {
    const start = Date.now();
    
    // Simulate realistic API delay
    const delay = Math.random() * 300 + 100; // 100-400ms
    await new Promise(resolve => setTimeout(resolve, delay));
    
    const responses = {
      'mock-basic': 'This is a basic mock response for testing the multi-provider routing system. The request was routed to the mock provider because of your current trust level.',
      'mock-premium': 'This is a premium mock response demonstrating advanced AI capabilities. This high-quality response includes detailed analysis, sophisticated reasoning, and comprehensive insights that would typically come from premium AI models like GPT-4 or Claude Opus.'
    };
    
    const model = params.model || 'mock-basic';
    const content = responses[model] || responses['mock-basic'];
    
    // Simulate realistic token counts
    const inputTokens = params.messages.reduce((acc, msg) => 
      acc + Math.ceil(msg.content.length / 4), 0);
    const outputTokens = Math.ceil(content.length / 4);
    
    return {
      content,
      model,
      usage: {
        inputTokens,
        outputTokens,
        totalCost: 0 // Mock is always free
      },
      provider: this.name,
      latency: Date.now() - start,
      success: true
    };
  }

  async checkHealth() {
    return { 
      healthy: true, 
      latency: 50,
      provider: this.name
    };
  }
}

// Provider Registry
class ProviderRegistry {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    try {
      const providersFromDb = db.prepare('SELECT * FROM providers WHERE is_active = 1').all();
      
      for (const config of providersFromDb) {
        let provider;
        
        switch (config.type) {
          case 'openai':
            provider = new OpenAIProvider({
              ...config,
              apiKey: process.env.OPENAI_API_KEY
            });
            break;
          case 'anthropic':
            provider = new AnthropicProvider({
              ...config,
              apiKey: process.env.ANTHROPIC_API_KEY
            });
            break;
          case 'cohere':
            provider = new CohereProvider({
              ...config,
              apiKey: process.env.COHERE_API_KEY
            });
            break;
          case 'mock':
            provider = new MockProvider(config);
            break;
          default:
            console.warn(`Unknown provider type: ${config.type}`);
            continue;
        }
        
        if (provider) {
          this.providers.set(config.id, provider);
          console.log(`✅ Initialized ${config.name} provider`);
        }
      }
      
      console.log(`📊 Loaded ${this.providers.size} providers`);
    } catch (error) {
      console.error('Error initializing providers:', error);
    }
  }

  getProvider(id) {
    return this.providers.get(id);
  }

  getAllProviders() {
    return Array.from(this.providers.values());
  }

  getActiveProviders() {
    return this.getAllProviders().filter(p => p.isActive);
  }

  async checkAllHealth() {
    const healthChecks = [];
    
    for (const provider of this.getAllProviders()) {
      healthChecks.push(
        provider.checkHealth().then(result => {
          // Update health in database
          try {
            const stmt = db.prepare(`
              UPDATE provider_health 
              SET is_healthy = ?, last_error = ?, last_checked = CURRENT_TIMESTAMP
              WHERE provider_id = ?
            `);
            stmt.run(result.healthy, result.error || null, provider.id);
          } catch (error) {
            console.error('Error updating provider health:', error);
          }
          
          return { provider: provider.id, ...result };
        }).catch(error => {
          console.error(`Health check failed for ${provider.id}:`, error);
          return {
            provider: provider.id,
            healthy: false,
            error: error.message,
            latency: 0
          };
        })
      );
    }
    
    return Promise.all(healthChecks);
  }
}

// Router Service - The Brain of the System
class RouterService {
  constructor(registry, trustService) {
    this.registry = registry;
    this.trustService = trustService;
  }

  async route(request, userId) {
    try {
      console.log(`🔀 Routing request for user ${userId}`);
      
      // Get user trust level
      const trustScore = await this.trustService.getTrustScore(userId);
      console.log(`📊 User ${userId} trust score: ${trustScore}`);
      
      // Get eligible providers based on trust
      const eligibleProviders = await this.getEligibleProviders(trustScore);
      
      if (eligibleProviders.length === 0) {
        throw new Error('No eligible providers available for your trust level');
      }
      
      console.log(`🎯 Found ${eligibleProviders.length} eligible providers`);
      
      // Score and sort providers
      const scoredProviders = await this.scoreProviders(eligibleProviders, request);
      
      // Try providers in order until success
      let lastError;
      for (const { provider, model } of scoredProviders) {
        console.log(`🚀 Trying ${provider.name} with model ${model.model_name}`);
        
        try {
          const response = await provider.chat({
            ...request,
            model: model.model_name
          });
          
          if (response.success) {
            console.log(`✅ Success with ${provider.name}`);
            
            // Track successful usage
            await this.trackUsage(userId, provider.id, model, response);
            
            return {
              ...response,
              trustScore,
              tier: this.getTier(trustScore)
            };
          } else {
            lastError = response.error;
            await this.logFailure(provider.id, response.error);
          }
        } catch (error) {
          console.error(`❌ ${provider.name} failed:`, error.message);
          lastError = error.message;
          await this.logFailure(provider.id, error.message);
          continue;
        }
      }
      
      throw new Error(`All providers failed. Last error: ${lastError}`);
    } catch (error) {
      console.error('Router error:', error);
      throw error;
    }
  }

  async getEligibleProviders(trustScore) {
    const healthyProviders = this.registry.getActiveProviders().filter(p => {
      try {
        const health = db.prepare('SELECT is_healthy FROM provider_health WHERE provider_id = ?').get(p.id);
        return health?.is_healthy !== false;
      } catch (error) {
        console.error(`Error checking health for ${p.id}:`, error);
        return false;
      }
    });

    const eligible = [];
    for (const provider of healthyProviders) {
      const models = provider.getAvailableModels().filter(m => 
        m.min_trust_required <= trustScore
      );
      if (models.length > 0) {
        eligible.push({ provider, models });
      }
    }

    return eligible;
  }

  async scoreProviders(eligibleProviders, request) {
    const scores = [];
    
    for (const { provider, models } of eligibleProviders) {
      for (const model of models) {
        // Calculate composite score
        const costScore = Math.max(0, 100 - (model.cost_per_1k_input * 1000));
        const qualityScore = model.quality_score || 50;
        const healthScore = await this.getHealthScore(provider.id);
        const priorityScore = provider.priority || 100;
        
        // Weighted scoring: quality > cost > health > priority
        const totalScore = (qualityScore * 0.4) + 
                          (costScore * 0.3) + 
                          (healthScore * 0.2) + 
                          (priorityScore * 0.1);
        
        scores.push({
          provider,
          model,
          score: totalScore
        });
      }
    }
    
    return scores.sort((a, b) => b.score - a.score);
  }

  async getHealthScore(providerId) {
    try {
      const health = db.prepare('SELECT success_rate FROM provider_health WHERE provider_id = ?').get(providerId);
      return health?.success_rate || 50;
    } catch (error) {
      console.error(`Error getting health score for ${providerId}:`, error);
      return 50;
    }
  }

  getTier(trustScore) {
    if (trustScore >= 70) return 'premium';
    if (trustScore >= 50) return 'standard';
    return 'basic';
  }

  async trackUsage(userId, providerId, model, response) {
    try {
      const stmt = db.prepare(`
        INSERT INTO provider_usage (
          user_id, provider_id, model_name, input_tokens, output_tokens, 
          cost, latency_ms, success
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        userId,
        providerId,
        model.model_name,
        response.usage.inputTokens || 0,
        response.usage.outputTokens || 0,
        response.usage.totalCost || 0,
        response.latency || 0,
        response.success ? 1 : 0
      );
      
      // Update provider health stats
      const updateHealth = db.prepare(`
        UPDATE provider_health 
        SET total_requests = total_requests + 1,
            success_rate = (total_requests - failed_requests) * 100.0 / (total_requests + 1)
        WHERE provider_id = ?
      `);
      updateHealth.run(providerId);
      
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  }

  async logFailure(providerId, error) {
    try {
      const stmt = db.prepare(`
        UPDATE provider_health 
        SET failed_requests = failed_requests + 1,
            total_requests = total_requests + 1,
            last_error = ?,
            success_rate = (total_requests - failed_requests) * 100.0 / total_requests
        WHERE provider_id = ?
      `);
      stmt.run(error, providerId);
      
      console.warn(`❌ Provider ${providerId} failed: ${error}`);
    } catch (dbError) {
      console.error('Error logging failure:', dbError);
    }
  }
}

// Trust Service
class TrustService {
  async getTrustScore(userId) {
    try {
      const user = db.prepare('SELECT trust_score FROM users WHERE id = ?').get(userId);
      return user?.trust_score || 50;
    } catch (error) {
      console.error('Error getting trust score:', error);
      return 50;
    }
  }

  async updateTrustScore(userId, delta, reason) {
    try {
      // Clamp delta to prevent abuse
      const clampedDelta = Math.max(-10, Math.min(10, delta));
      
      const stmt = db.prepare('UPDATE users SET trust_score = trust_score + ? WHERE id = ?');
      stmt.run(clampedDelta, userId);
      
      // Log the trust event
      const logStmt = db.prepare(`
        INSERT INTO trust_events (user_id, event_type, trust_delta, reason) 
        VALUES (?, ?, ?, ?)
      `);
      logStmt.run(userId, 'manual_adjustment', clampedDelta, reason);
      
      return this.getTrustScore(userId);
    } catch (error) {
      console.error('Error updating trust score:', error);
      throw error;
    }
  }

  async calculateTrustFromActivity(userId) {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(DISTINCT c.id) as conversation_count,
          AVG(c.rating) as avg_rating,
          COUNT(DISTINCT DATE(c.created_at)) as active_days,
          SUM(c.cost) as total_spent
        FROM conversations c 
        WHERE c.user_id = ? AND c.created_at > datetime('now', '-30 days')
      `).get(userId);
      
      let trustScore = 50; // Base score
      
      // Conversation activity boost
      trustScore += Math.min(stats.conversation_count * 2, 20);
      
      // Rating boost
      if (stats.avg_rating) {
        trustScore += (stats.avg_rating - 3) * 5; // -10 to +10
      }
      
      // Active days boost
      trustScore += Math.min(stats.active_days, 15);
      
      // Spending boost (small)
      trustScore += Math.min(stats.total_spent * 100, 5);
      
      return Math.max(0, Math.min(100, trustScore));
    } catch (error) {
      console.error('Error calculating trust from activity:', error);
      return 50;
    }
  }
}

// ================================
// INITIALIZE SERVICES
// ================================

const registry = new ProviderRegistry();
const trustService = new TrustService();
const router = new RouterService(registry, trustService);

// ================================
// MIDDLEWARE
// ================================

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// ================================
// API ROUTES
// ================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    providers: registry.getAllProviders().length,
    version: '1.0.0'
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (email, password_hash, trust_score) 
      VALUES (?, ?, ?)
    `);
    const result = stmt.run(email, passwordHash, 50);
    
    const token = jwt.sign(
      { id: result.lastInsertRowid, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: result.lastInsertRowid, 
        email, 
        trust_score: 50,
        tier: 'standard'
      } 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ 
      token, 
      user: { 
        id: user.id, 
        email: user.email, 
        trust_score: user.trust_score,
        tier: router.getTier(user.trust_score)
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// AI Chat route with multi-provider routing
app.post('/api/ai/chat', authMiddleware, async (req, res) => {
  try {
    const { messages, temperature, maxTokens } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }
    
    if (messages.length === 0) {
      return res.status(400).json({ error: 'At least one message required' });
    }
    
    const response = await router.route({
      messages,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2048
    }, req.user.id);
    
    // Log conversation to database
    try {
      const stmt = db.prepare(`
        INSERT INTO conversations (
          user_id, prompt, response, tier, cost, provider_id, model_used,
          tokens_input, tokens_output, latency_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        req.user.id,
        JSON.stringify(messages),
        response.content,
        response.tier,
        response.usage.totalCost || 0,
        response.provider,
        response.model,
        response.usage.inputTokens || 0,
        response.usage.outputTokens || 0,
        response.latency || 0
      );
    } catch (logError) {
      console.error('Error logging conversation:', logError);
    }
    
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ 
      error: error.message || 'AI request failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Provider management routes
app.get('/api/providers', authMiddleware, async (req, res) => {
  try {
    const providers = registry.getAllProviders().map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      isActive: p.isActive,
      priority: p.priority,
      models: p.getAvailableModels()
    }));
    
    res.json(providers);
  } catch (error) {
    console.error('Error getting providers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/providers/health', authMiddleware, async (req, res) => {
  try {
    const health = await registry.checkAllHealth();
    res.json(health);
  } catch (error) {
    console.error('Error checking provider health:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics routes
app.get('/api/analytics/usage', authMiddleware, async (req, res) => {
  try {
    const stats = db.prepare(`
      SELECT 
        p.name as provider,
        COUNT(*) as requests,
        AVG(pu.cost) as avg_cost,
        AVG(pu.latency_ms) as avg_latency,
        SUM(CASE WHEN pu.success THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate,
        SUM(pu.cost) as total_cost
      FROM provider_usage pu
      JOIN providers p ON pu.provider_id = p.id
      WHERE pu.created_at > datetime('now', '-7 days')
      GROUP BY p.name
      ORDER BY requests DESC
    `).all();
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting usage analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, trust_score, created_at FROM users WHERE id = ?').get(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_conversations,
        SUM(cost) as total_spent,
        AVG(rating) as avg_rating
      FROM conversations 
      WHERE user_id = ?
    `).get(req.user.id);
    
    res.json({
      ...user,
      tier: router.getTier(user.trust_score),
      stats: {
        total_conversations: stats.total_conversations || 0,
        total_spent: stats.total_spent || 0,
        avg_rating: stats.avg_rating || null
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Trust management
app.post('/api/trust/update', authMiddleware, async (req, res) => {
  try {
    const { delta, reason } = req.body;
    
    if (typeof delta !== 'number') {
      return res.status(400).json({ error: 'Delta must be a number' });
    }
    
    const newScore = await trustService.updateTrustScore(req.user.id, delta, reason);
    
    res.json({ 
      trust_score: newScore,
      tier: router.getTier(newScore)
    });
  } catch (error) {
    console.error('Error updating trust:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rate conversation
app.post('/api/conversations/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating } = req.body;
    const conversationId = req.params.id;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    const stmt = db.prepare(`
      UPDATE conversations 
      SET rating = ? 
      WHERE id = ? AND user_id = ?
    `);
    
    const result = stmt.run(rating, conversationId, req.user.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    // Small trust boost for rating
    if (rating >= 4) {
      await trustService.updateTrustScore(req.user.id, 1, `Positive rating: ${rating}/5`);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error rating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ================================
// START SERVER
// ================================

const server = app.listen(PORT, () => {
  console.log(`
🚀 Soulfra Multi-Provider AI Platform
=====================================
✅ Server running on port ${PORT}
✅ Database connected: ${dbPath}
✅ Providers loaded: ${registry.getAllProviders().length}
✅ JWT Secret: ${JWT_SECRET.substring(0, 10)}...

📊 Endpoints:
   Health: http://localhost:${PORT}/health
   Chat:   http://localhost:${PORT}/api/ai/chat
   Auth:   http://localhost:${PORT}/api/auth/login

🔑 Demo accounts:
   demo@soulfra.ai / demo123 (Premium)
   user@soulfra.ai / user123 (Standard)
   new@soulfra.ai / new123 (Basic)

🎯 Ready for requests!
`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

module.exports = app;