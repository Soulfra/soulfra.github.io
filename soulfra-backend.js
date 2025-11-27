const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Initialize database
const db = new Database('soulfra.db');

// Initialize AI providers
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || 'demo-key'
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'demo-key'
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database setup
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    trust_score INTEGER DEFAULT 50,
    tier TEXT DEFAULT 'standard',
    total_spent REAL DEFAULT 0,
    total_saved REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS interactions (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    provider TEXT NOT NULL,
    cost REAL NOT NULL,
    trust_score_before INTEGER,
    trust_score_after INTEGER,
    savings REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model TEXT NOT NULL,
    cost_per_token REAL NOT NULL,
    min_trust_score INTEGER DEFAULT 0,
    health_score REAL DEFAULT 1.0,
    last_health_check DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed demo data
const seedData = () => {
  const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get('demo@soulfra.ai');
  if (!existingUser) {
    const users = [
      { id: uuidv4(), email: 'demo@soulfra.ai', password: 'demo123', trust_score: 85, tier: 'premium' },
      { id: uuidv4(), email: 'user@soulfra.ai', password: 'user123', trust_score: 50, tier: 'standard' },
      { id: uuidv4(), email: 'new@soulfra.ai', password: 'new123', trust_score: 20, tier: 'basic' }
    ];

    users.forEach(user => {
      const passwordHash = bcrypt.hashSync(user.password, 10);
      db.prepare(`
        INSERT INTO users (id, email, password_hash, trust_score, tier)
        VALUES (?, ?, ?, ?, ?)
      `).run(user.id, user.email, passwordHash, user.trust_score, user.tier);
    });

    // Seed providers
    const providers = [
      { id: 'openai-gpt4', name: 'OpenAI', model: 'gpt-4', cost_per_token: 0.00003, min_trust_score: 70 },
      { id: 'openai-gpt35', name: 'OpenAI', model: 'gpt-3.5-turbo', cost_per_token: 0.000002, min_trust_score: 30 },
      { id: 'anthropic-claude', name: 'Anthropic', model: 'claude-3-sonnet', cost_per_token: 0.000015, min_trust_score: 60 },
      { id: 'mock', name: 'Mock', model: 'demo', cost_per_token: 0, min_trust_score: 0 }
    ];

    providers.forEach(provider => {
      db.prepare(`
        INSERT OR REPLACE INTO providers (id, name, model, cost_per_token, min_trust_score)
        VALUES (?, ?, ?, ?, ?)
      `).run(provider.id, provider.name, provider.model, provider.cost_per_token, provider.min_trust_score);
    });
  }
};

// Trust Engine
class TrustEngine {
  static calculateTier(score) {
    if (score >= 80) return 'premium';
    if (score >= 50) return 'standard';
    return 'basic';
  }

  static updateTrustScore(userId, interaction) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return user;

    let newScore = user.trust_score;
    
    // Increase trust for successful interactions
    if (interaction === 'successful') {
      newScore = Math.min(100, user.trust_score + 1);
    }
    
    const newTier = this.calculateTier(newScore);
    
    db.prepare(`
      UPDATE users 
      SET trust_score = ?, tier = ? 
      WHERE id = ?
    `).run(newScore, newTier, userId);

    return { old_score: user.trust_score, new_score: newScore, tier: newTier };
  }

  static getDiscount(trustScore) {
    if (trustScore >= 80) return 0.4; // 40% discount
    if (trustScore >= 60) return 0.3; // 30% discount  
    if (trustScore >= 40) return 0.2; // 20% discount
    return 0.1; // 10% discount
  }
}

// AI Router
class AIRouter {
  static async route(user, prompt) {
    const availableProviders = db.prepare(`
      SELECT * FROM providers 
      WHERE min_trust_score <= ? 
      ORDER BY cost_per_token ASC
    `).all(user.trust_score);

    if (availableProviders.length === 0) {
      return this.mockResponse(prompt, user);
    }

    // Select best provider based on trust score
    const provider = user.trust_score >= 70 ? 
      availableProviders.find(p => p.model === 'gpt-4') || availableProviders[0] :
      availableProviders[0];

    try {
      const response = await this.callProvider(provider, prompt);
      const baseCost = this.estimateCost(prompt, response, provider);
      const discount = TrustEngine.getDiscount(user.trust_score);
      const finalCost = baseCost * (1 - discount);
      const savings = baseCost - finalCost;

      return {
        response: response,
        provider: provider.name,
        model: provider.model,
        cost: finalCost,
        savings: savings,
        discount_percent: Math.round(discount * 100)
      };
    } catch (error) {
      console.error('Provider error:', error);
      return this.mockResponse(prompt, user);
    }
  }

  static async callProvider(provider, prompt) {
    if (provider.id.startsWith('openai')) {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'demo-key') {
        return `[DEMO MODE] OpenAI ${provider.model} would respond: "${prompt}" - Add OPENAI_API_KEY for real responses.`;
      }
      
      const completion = await openai.chat.completions.create({
        model: provider.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      });
      return completion.choices[0].message.content;
    }

    if (provider.id.startsWith('anthropic')) {
      if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'demo-key') {
        return `[DEMO MODE] Anthropic ${provider.model} would respond: "${prompt}" - Add ANTHROPIC_API_KEY for real responses.`;
      }

      const message = await anthropic.messages.create({
        model: provider.model,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      });
      return message.content[0].text;
    }

    return this.mockResponse(prompt).response;
  }

  static estimateCost(prompt, response, provider) {
    const tokens = (prompt.length + response.length) / 4; // Rough estimate
    return tokens * provider.cost_per_token;
  }

  static mockResponse(prompt, user) {
    const responses = [
      `Based on your request "${prompt}", here's a helpful response. Your trust score of ${user?.trust_score || 0} determines response quality.`,
      `Processing "${prompt}"... Your trust tier (${user?.tier || 'basic'}) affects available AI models.`,
      `Analyzing "${prompt}"... Higher trust scores unlock premium AI providers with better responses.`
    ];

    return {
      response: responses[Math.floor(Math.random() * responses.length)],
      provider: 'Mock',
      model: 'demo',
      cost: 0,
      savings: 0,
      discount_percent: 0
    };
  }
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);
  res.json({ 
    token, 
    user: { 
      id: user.id, 
      email: user.email, 
      trust_score: user.trust_score,
      tier: user.tier,
      total_spent: user.total_spent,
      total_saved: user.total_saved
    } 
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    const userId = uuidv4();
    
    db.prepare(`
      INSERT INTO users (id, email, password_hash)
      VALUES (?, ?, ?)
    `).run(userId, email, passwordHash);

    const token = jwt.sign({ id: userId, email }, JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: userId, 
        email, 
        trust_score: 50,
        tier: 'standard',
        total_spent: 0,
        total_saved: 0
      } 
    });
  } catch (error) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

app.post('/api/chat', authenticateToken, async (req, res) => {
  const { prompt } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  
  try {
    const routingResult = await AIRouter.route(user, prompt);
    const trustUpdate = TrustEngine.updateTrustScore(user.id, 'successful');

    // Log interaction
    db.prepare(`
      INSERT INTO interactions (id, user_id, prompt, response, provider, cost, trust_score_before, trust_score_after, savings)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), user.id, prompt, routingResult.response, 
      routingResult.provider, routingResult.cost, 
      trustUpdate.old_score, trustUpdate.new_score, routingResult.savings
    );

    // Update user totals
    db.prepare(`
      UPDATE users 
      SET total_spent = total_spent + ?, total_saved = total_saved + ?
      WHERE id = ?
    `).run(routingResult.cost, routingResult.savings, user.id);

    res.json({
      response: routingResult.response,
      provider: routingResult.provider,
      model: routingResult.model,
      cost: routingResult.cost,
      savings: routingResult.savings,
      discount_percent: routingResult.discount_percent,
      new_trust_score: trustUpdate.new_score,
      trust_tier: trustUpdate.tier
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

app.get('/api/dashboard', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const recentInteractions = db.prepare(`
    SELECT * FROM interactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 10
  `).all(req.user.id);

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_interactions,
      SUM(cost) as total_spent,
      SUM(savings) as total_saved,
      AVG(trust_score_after) as avg_trust_score
    FROM interactions 
    WHERE user_id = ?
  `).get(req.user.id);

  res.json({
    user: {
      email: user.email,
      trust_score: user.trust_score,
      tier: user.tier,
      member_since: user.created_at
    },
    stats: stats || { total_interactions: 0, total_spent: 0, total_saved: 0, avg_trust_score: user.trust_score },
    recent_interactions: recentInteractions,
    trust_benefits: {
      current_discount: Math.round(TrustEngine.getDiscount(user.trust_score) * 100),
      next_tier_at: user.trust_score >= 80 ? 100 : (user.trust_score >= 50 ? 80 : 50)
    }
  });
});

app.get('/api/providers', (req, res) => {
  const providers = db.prepare('SELECT * FROM providers ORDER BY cost_per_token ASC').all();
  res.json(providers);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'connected',
    providers: {
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'demo-mode',
      anthropic: process.env.ANTHROPIC_API_KEY ? 'configured' : 'demo-mode'
    }
  });
});

// Initialize and start
seedData();

app.listen(PORT, () => {
  console.log(`🚀 Soulfra backend running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/health`);
  console.log(`🔑 Demo login: demo@soulfra.ai / demo123`);
  console.log(`💡 Add OPENAI_API_KEY and ANTHROPIC_API_KEY for real AI`);
});