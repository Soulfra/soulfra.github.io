// server.js - Complete Soulfra Backend with Multi-Provider AI System
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const path = require('path');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'soulfra-secret-dev';

// Initialize SQLite
const db = new Database(process.env.DB_PATH || './soulfra.db');
db.pragma('journal_mode = WAL');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ================================
// PROVIDER SYSTEM IMPLEMENTATION
// ================================

// Base Provider Interface
class BaseProvider {
  constructor(config) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.apiKey = config.apiKey;
    this.isActive = config.isActive !== false;
  }

  async chat(params) {
    throw new Error('chat method must be implemented');
  }

  async checkHealth() {
    throw new Error('checkHealth method must be implemented');
  }

  estimateCost(inputTokens, outputTokens, model) {
    const modelInfo = this.getModelInfo(model);
    return (inputTokens / 1000 * modelInfo.cost_per_1k_input) + 
           (outputTokens / 1000 * modelInfo.cost_per_1k_output);
  }

  getModelInfo(modelName) {
    const stmt = db.prepare('SELECT * FROM provider_models WHERE provider_id = ? AND model_name = ?');
    return stmt.get(this.id, modelName);
  }

  getAvailableModels() {
    const stmt = db.prepare('SELECT * FROM provider_models WHERE provider_id = ? ORDER BY quality_score DESC');
    return stmt.all(this.id);
  }
}

// OpenAI Provider Implementation
class OpenAIProvider extends BaseProvider {
  constructor(config) {
    super(config);
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  async chat(params) {
    if (!this.client) throw new Error('OpenAI API key not configured');
    
    const start = Date.now();
    try {
      const completion = await this.client.chat.completions.create({
        model: params.model || 'gpt-3.5-turbo',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2048
      });

      const usage = completion.usage;
      const cost = this.estimateCost(usage.prompt_tokens, usage.completion_tokens, params.model);

      return {
        content: completion.choices[0].message.content,
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
      return {
        error: error.message,
        provider: this.name,
        latency: Date.now() - start,
        success: false
      };
    }
  }

  async checkHealth() {
    try {
      if (!this.client) return { healthy: false, error: 'No API key configured' };
      
      const start = Date.now();
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
        provider: this.name
      };
    }
  }
}

// Anthropic Provider Implementation
class AnthropicProvider extends BaseProvider {
  constructor(config) {
    super(config);
    if (this.apiKey) {
      this.client = new Anthropic({ apiKey: this.apiKey });
    }
  }

  async chat(params) {
    if (!this.client) throw new Error('Anthropic API key not configured');
    
    const start = Date.now();
    try {
      const response = await this.client.messages.create({
        model: params.model || 'claude-3-haiku-20240307',
        max_tokens: params.maxTokens || 2048,
        temperature: params.temperature || 0.7,
        messages: params.messages
      });

      const cost = this.estimateCost(response.usage.input_tokens, response.usage.output_tokens, params.model);

      return {
        content: response.content[0].text,
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
      return {
        error: error.message,
        provider: this.name,
        latency: Date.now() - start,
        success: false
      };
    }
  }

  async checkHealth() {
    try {
      if (!this.client) return { healthy: false, error: 'No API key configured' };
      
      const start = Date.now();
      // Simple test request
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
        provider: this.name
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
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100));
    
    const responses = {
      'mock-basic': 'This is a basic mock response for testing purposes.',
      'mock-premium': 'This is a premium mock response with more sophisticated content and detailed analysis.'
    };
    
    const model = params.model || 'mock-basic';
    const content = responses[model] || responses['mock-basic'];
    
    return {
      content,
      model,
      usage: {
        inputTokens: 50,
        outputTokens: 20,
        totalCost: 0
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
    // Load providers from database
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
        case 'mock':
          provider = new MockProvider(config);
          break;
        default:
          console.warn(`Unknown provider type: ${config.type}`);
          continue;
      }
      
      this.providers.set(config.id, provider);
    }
    
    console.log(`✅ Initialized ${this.providers.size} providers`);
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
          const stmt = db.prepare(`
            UPDATE provider_health 
            SET is_healthy = ?, last_error = ?, last_checked = CURRENT_TIMESTAMP
            WHERE provider_id = ?
          `);
          stmt.run(result.healthy, result.error || null, provider.id);
          
          return { provider: provider.id, ...result };
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
      // Get user trust level
      const trustScore = await this.trustService.getTrustScore(userId);
      
      // Get eligible providers based on trust
      const eligibleProviders = await this.getEligibleProviders(trustScore);
      
      if (eligibleProviders.length === 0) {
        throw new Error('No eligible providers available');
      }
      
      // Score and sort providers
      const scoredProviders = await this.scoreProviders(eligibleProviders, request);
      
      // Try providers in order until success
      let lastError;
      for (const { provider, model } of scoredProviders) {
        try {
          const response = await provider.chat({
            ...request,
            model: model.model_name
          });
          
          if (response.success) {
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
      const health = db.prepare('SELECT is_healthy FROM provider_health WHERE provider_id = ?').get(p.id);
      return health?.is_healthy !== false;
    });

    const eligible = [];
    for (const provider of healthyProviders) {
      const models = provider.getAvailableModels().filter(m => m.min_trust_required <= trustScore);
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
        const costScore = Math.max(0, 100 - (model.cost_per_1k_input * 1000)); // Lower cost = higher score
        const qualityScore = model.quality_score;
        const healthScore = await this.getHealthScore(provider.id);
        
        const totalScore = (costScore * 0.3) + (qualityScore * 0.5) + (healthScore * 0.2);
        
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
    const health = db.prepare('SELECT success_rate FROM provider_health WHERE provider_id = ?').get(providerId);
    return health?.success_rate || 50;
  }

  getTier(trustScore) {
    if (trustScore >= 70) return 'premium';
    if (trustScore >= 50) return 'standard';
    return 'basic';
  }

  async trackUsage(userId, providerId, model, response) {
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
      response.usage.inputTokens,
      response.usage.outputTokens,
      response.usage.totalCost,
      response.latency,
      response.success
    );
  }

  async logFailure(providerId, error) {
    // Update provider health
    const stmt = db.prepare(`
      UPDATE provider_health 
      SET failed_requests = failed_requests + 1,
          last_error = ?,
          success_rate = (total_requests - failed_requests) * 100.0 / total_requests
      WHERE provider_id = ?
    `);
    stmt.run(error, providerId);
    
    console.warn(`Provider ${providerId} failed: ${error}`);
  }
}

// Trust Service
class TrustService {
  async getTrustScore(userId) {
    const user = db.prepare('SELECT trust_score FROM users WHERE id = ?').get(userId);
    return user?.trust_score || 50;
  }

  async updateTrustScore(userId, delta, reason) {
    const stmt = db.prepare('UPDATE users SET trust_score = trust_score + ? WHERE id = ?');
    stmt.run(delta, userId);
    
    // Log the trust event
    const logStmt = db.prepare(`
      INSERT INTO trust_events (user_id, event_type, trust_delta, reason) 
      VALUES (?, ?, ?, ?)
    `);
    logStmt.run(userId, 'manual_adjustment', delta, reason);
    
    return this.getTrustScore(userId);
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
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
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

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    
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
    
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
    
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
    
    const response = await router.route({
      messages,
      temperature,
      maxTokens
    }, req.user.id);
    
    // Log conversation
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
      response.usage.totalCost,
      response.provider,
      response.model,
      response.usage.inputTokens,
      response.usage.outputTokens,
      response.latency
    );
    
    res.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
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
      models: p.getAvailableModels()
    }));
    
    res.json(providers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/providers/health', authMiddleware, async (req, res) => {
  try {
    const health = await registry.checkAllHealth();
    res.json(health);
  } catch (error) {
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
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/user/profile', authMiddleware, async (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, trust_score, created_at FROM users WHERE id = ?').get(req.user.id);
    
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
      stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trust management
app.post('/api/trust/update', authMiddleware, async (req, res) => {
  try {
    const { delta, reason } = req.body;
    
    // Only allow small adjustments for now
    const clampedDelta = Math.max(-5, Math.min(5, delta));
    
    const newScore = await trustService.updateTrustScore(req.user.id, clampedDelta, reason);
    
    res.json({ 
      trust_score: newScore,
      tier: router.getTier(newScore)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    providers: registry.getAllProviders().length
  });
});

// ================================
// START SERVER
// ================================

app.listen(PORT, () => {
  console.log(`🚀 Soulfra Multi-Provider Backend running on port ${PORT}`);
  console.log(`📊 Providers initialized: ${registry.getAllProviders().length}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;