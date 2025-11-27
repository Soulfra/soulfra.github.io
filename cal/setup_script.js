// setup.js - Initialize Soulfra database with multi-provider schema
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing Soulfra Multi-Provider Database...');

// Initialize database
const db = new Database('./soulfra.db');
db.pragma('journal_mode = WAL');

// Read and execute schema
const schemaPath = path.join(__dirname, 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = schema.split(';').filter(stmt => stmt.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        db.exec(statement + ';');
      } catch (error) {
        console.warn(`Warning: ${error.message}`);
      }
    }
  }
} else {
  // Inline schema if file doesn't exist
  db.exec(`
    -- Core users table
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      trust_score INTEGER DEFAULT 50,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Providers configuration
    CREATE TABLE IF NOT EXISTS providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      api_key TEXT,
      endpoint TEXT,
      is_active BOOLEAN DEFAULT true,
      priority INTEGER DEFAULT 100,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Provider models
    CREATE TABLE IF NOT EXISTS provider_models (
      id TEXT PRIMARY KEY,
      provider_id TEXT REFERENCES providers(id),
      model_name TEXT NOT NULL,
      model_type TEXT DEFAULT 'chat',
      context_window INTEGER DEFAULT 4096,
      cost_per_1k_input DECIMAL(10,6) DEFAULT 0,
      cost_per_1k_output DECIMAL(10,6) DEFAULT 0,
      quality_score INTEGER DEFAULT 50,
      min_trust_required INTEGER DEFAULT 0,
      max_tokens INTEGER DEFAULT 4096,
      supports_streaming BOOLEAN DEFAULT false
    );

    -- Usage tracking
    CREATE TABLE IF NOT EXISTS provider_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      provider_id TEXT REFERENCES providers(id),
      model_name TEXT,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      cost DECIMAL(10,6) DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      success BOOLEAN DEFAULT true,
      error_message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Provider health
    CREATE TABLE IF NOT EXISTS provider_health (
      provider_id TEXT PRIMARY KEY REFERENCES providers(id),
      success_rate DECIMAL(5,2) DEFAULT 100,
      avg_latency_ms INTEGER DEFAULT 0,
      last_error TEXT,
      last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_healthy BOOLEAN DEFAULT true,
      total_requests INTEGER DEFAULT 0,
      failed_requests INTEGER DEFAULT 0
    );

    -- Conversations
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      prompt TEXT NOT NULL,
      response TEXT NOT NULL,
      tier TEXT DEFAULT 'basic',
      cost DECIMAL(10,6) DEFAULT 0,
      rating INTEGER,
      provider_id TEXT,
      model_used TEXT,
      tokens_input INTEGER DEFAULT 0,
      tokens_output INTEGER DEFAULT 0,
      latency_ms INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Trust events
    CREATE TABLE IF NOT EXISTS trust_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      event_type TEXT NOT NULL,
      trust_delta INTEGER NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_provider_usage_user ON provider_usage(user_id);
    CREATE INDEX IF NOT EXISTS idx_provider_usage_created ON provider_usage(created_at);
    CREATE INDEX IF NOT EXISTS idx_provider_models_provider ON provider_models(provider_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_provider ON conversations(provider_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_trust_events_user ON trust_events(user_id);
  `);
}

// Insert default providers
console.log('📦 Inserting default providers...');
const insertProvider = db.prepare(`
  INSERT OR REPLACE INTO providers (id, name, type, is_active, priority) 
  VALUES (?, ?, ?, ?, ?)
`);

const providers = [
  ['openai', 'OpenAI', 'openai', true, 100],
  ['anthropic', 'Anthropic', 'anthropic', true, 90],
  ['cohere', 'Cohere', 'cohere', true, 80],
  ['mock', 'Mock Provider', 'mock', true, 10]
];

for (const provider of providers) {
  insertProvider.run(...provider);
}

// Insert default models
console.log('🤖 Inserting default models...');
const insertModel = db.prepare(`
  INSERT OR REPLACE INTO provider_models (
    id, provider_id, model_name, cost_per_1k_input, cost_per_1k_output, 
    quality_score, min_trust_required, context_window
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const models = [
  // OpenAI models
  ['openai-gpt-3.5-turbo', 'openai', 'gpt-3.5-turbo', 0.0005, 0.0015, 70, 50, 16384],
  ['openai-gpt-4', 'openai', 'gpt-4', 0.03, 0.06, 95, 70, 8192],
  ['openai-gpt-4-turbo', 'openai', 'gpt-4-turbo-preview', 0.01, 0.03, 92, 70, 128000],
  
  // Anthropic models
  ['anthropic-claude-3-haiku', 'anthropic', 'claude-3-haiku-20240307', 0.00025, 0.00125, 75, 50, 200000],
  ['anthropic-claude-3-sonnet', 'anthropic', 'claude-3-sonnet-20240229', 0.003, 0.015, 88, 65, 200000],
  ['anthropic-claude-3-opus', 'anthropic', 'claude-3-opus-20240229', 0.015, 0.075, 98, 75, 200000],
  
  // Cohere models
  ['cohere-command', 'cohere', 'command', 0.0015, 0.002, 65, 40, 4096],
  ['cohere-command-r', 'cohere', 'command-r', 0.0005, 0.0015, 72, 50, 128000],
  
  // Mock models
  ['mock-basic', 'mock', 'mock-basic', 0, 0, 40, 0, 2048],
  ['mock-premium', 'mock', 'mock-premium', 0, 0, 85, 70, 8192]
];

for (const model of models) {
  insertModel.run(...model);
}

// Initialize provider health
console.log('💚 Initializing provider health...');
const insertHealth = db.prepare(`
  INSERT OR REPLACE INTO provider_health (provider_id, success_rate, is_healthy) 
  VALUES (?, ?, ?)
`);

for (const [id] of providers) {
  insertHealth.run(id, 99.5, true);
}

// Create demo users
console.log('👥 Creating demo users...');
const bcrypt = require('bcryptjs');

const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (email, password_hash, trust_score) 
  VALUES (?, ?, ?)
`);

const demoUsers = [
  ['demo@soulfra.ai', 'demo123', 85],
  ['user@soulfra.ai', 'user123', 50],
  ['new@soulfra.ai', 'new123', 20]
];

for (const [email, password, trust] of demoUsers) {
  const hash = bcrypt.hashSync(password, 10);
  insertUser.run(email, hash, trust);
}

// Create .env file if it doesn't exist
console.log('⚙️ Creating environment configuration...');
if (!fs.existsSync('.env')) {
  const envContent = `# Soulfra Multi-Provider Configuration
NODE_ENV=development
PORT=3001
JWT_SECRET=soulfra-secret-${Date.now()}
DB_PATH=./soulfra.db

# AI Provider API Keys (Add your keys here)
OPENAI_API_KEY=your-openai-key-here
ANTHROPIC_API_KEY=your-anthropic-key-here
COHERE_API_KEY=your-cohere-key-here

# Provider Settings
DEFAULT_PROVIDER=mock
FALLBACK_PROVIDER=mock
MAX_RETRIES=3
PROVIDER_TIMEOUT_MS=30000

# Cost Optimization
ENABLE_COST_OPTIMIZATION=true
MAX_COST_PER_REQUEST=0.10
CACHE_RESPONSES=true

# Development Settings
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:3000
`;
  
  fs.writeFileSync('.env', envContent);
  console.log('📝 Created .env file - Please add your API keys!');
}

console.log('✅ Database setup complete!');
console.log('\n📊 Database Statistics:');
console.log(`   Users: ${db.prepare('SELECT COUNT(*) as count FROM users').get().count}`);
console.log(`   Providers: ${db.prepare('SELECT COUNT(*) as count FROM providers').get().count}`);
console.log(`   Models: ${db.prepare('SELECT COUNT(*) as count FROM provider_models').get().count}`);

console.log('\n🚀 Next steps:');
console.log('   1. Add your API keys to .env file');
console.log('   2. Run: npm start');
console.log('   3. Open: http://localhost:3001');
console.log('   4. Login with demo@soulfra.ai / demo123');

db.close();