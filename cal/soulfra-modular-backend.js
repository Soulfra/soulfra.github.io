// soulfra-server.js - Modular Backend with Optimizations
const express = require('express');
const cors = require('cors');
const path = require('path');

// Modular imports - only load what's needed
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Module system - load components as needed
const modules = {
  database: null,
  redis: null,
  auth: null,
  documents: null,
  trust: null
};

// Lazy load database module
function getDatabase() {
  if (!modules.database) {
    const Database = require('better-sqlite3');
    modules.database = new Database('./soulfra.db');
    modules.database.pragma('journal_mode = WAL');
    initializeDatabase(modules.database);
  }
  return modules.database;
}

// Lazy load Redis with fallback
async function getCache() {
  if (!modules.redis) {
    try {
      const Redis = require('ioredis');
      modules.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        lazyConnect: true,
        retryStrategy: () => null
      });
      
      await modules.redis.ping();
      console.log('✅ Redis connected');
    } catch (error) {
      console.log('📦 Redis not available, using memory cache');
      // Simple in-memory cache fallback
      modules.redis = {
        cache: new Map(),
        async get(key) {
          const item = this.cache.get(key);
          if (item && item.expires > Date.now()) {
            return item.value;
          }
          this.cache.delete(key);
          return null;
        },
        async set(key, value, seconds) {
          this.cache.set(key, {
            value,
            expires: Date.now() + (seconds * 1000)
          });
          return 'OK';
        },
        async del(key) {
          this.cache.delete(key);
          return 1;
        }
      };
    }
  }
  return modules.redis;
}

// Initialize database schema
function initializeDatabase(db) {
  // Minimal schema for quick start
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      trust_score INTEGER DEFAULT 50,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      content TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
    CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
  `);
}

// Quick demo data endpoint (no auth required)
app.get('/api/demo', (req, res) => {
  const demoDocuments = [
    { id: '1', title: 'Getting Started Guide', type: 'Documentation', category: 'Documentation', status: 'approved' },
    { id: '2', title: 'Platform Enhancement PRD', type: 'PRD', category: 'PRDs', status: 'review' },
    { id: '3', title: 'Deployment Script', type: 'Script', category: 'Scripts', status: 'approved' },
    { id: '4', title: 'API Configuration', type: 'Config', category: 'Configs', status: 'draft' }
  ];
  
  res.json({
    documents: demoDocuments,
    trust: { trust_score: 75, tier: 'premium' }
  });
});

// Minimal auth for quick start
app.post('/api/auth/quick-start', async (req, res) => {
  const db = getDatabase();
  const { email } = req.body;
  
  // Create or get demo user
  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(email || 'demo@soulfra.ai');
  
  if (!user) {
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const result = stmt.run(email || 'demo@soulfra.ai', 'demo');
    user = { id: result.lastInsertRowid, email: email || 'demo@soulfra.ai', trust_score: 50 };
  }
  
  res.json({
    token: 'demo-token',
    user: { id: user.id, email: user.email, trust_score: user.trust_score, tier: 'standard' }
  });
});

// Documents API (simplified)
app.get('/api/documents', async (req, res) => {
  try {
    const db = getDatabase();
    const documents = db.prepare('SELECT * FROM documents ORDER BY updated_at DESC LIMIT 20').all();
    res.json(documents);
  } catch (error) {
    // Return demo data if database fails
    res.json([
      { id: '1', title: 'Sample Document', type: 'Documentation', category: 'Documentation', status: 'draft', content: 'Demo content' }
    ]);
  }
});

// Trust API (simplified)
app.get('/api/trust', async (req, res) => {
  const cache = await getCache();
  const cached = await cache.get('demo:trust');
  
  if (cached) {
    res.json(JSON.parse(cached));
  } else {
    const trustData = { trust_score: 75, tier: 'premium', recent_events: [] };
    await cache.set('demo:trust', JSON.stringify(trustData), 300); // Cache for 5 minutes
    res.json(trustData);
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  const cache = await getCache();
  const db = getDatabase();
  
  res.json({
    status: 'healthy',
    services: {
      database: db ? 'connected' : 'error',
      cache: cache ? 'connected' : 'error'
    }
  });
});

// Serve frontend from root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║           🚀 SOULFRA SERVER RUNNING 🚀            ║
╚═══════════════════════════════════════════════════╝

📡 Server:     http://localhost:${PORT}
📚 API:        http://localhost:${PORT}/api
❤️  Health:    http://localhost:${PORT}/api/health

Quick Start:
1. Open http://localhost:${PORT} in your browser
2. Click "Quick Start Demo" to see it in action
3. Backend features will activate automatically

Modules loaded on demand for faster startup!
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  if (modules.database) modules.database.close();
  process.exit(0);
});

// Export for modular use
module.exports = { app, getDatabase, getCache };