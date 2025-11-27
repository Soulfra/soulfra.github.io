// scripts/setup-database.js
// Initialize SQLite database with Soulfra schema

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function setupDatabase() {
  console.log('🗄️ Setting up Soulfra Demo Database...');
  
  const dbPath = './soulfra_demo.db';
  
  // Remove existing database
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('🗑️ Removed existing database');
  }
  
  // Create new database
  const db = new Database(dbPath);
  
  // Enable foreign keys and WAL mode
  db.pragma('foreign_keys = ON');
  db.pragma('journal_mode = WAL');
  
  console.log('📋 Creating database schema...');
  
  // Create all tables
  const schema = `
    -- Core user management with fingerprint auth
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        fingerprint TEXT UNIQUE NOT NULL,
        trust_score INTEGER DEFAULT 50,
        tier TEXT DEFAULT 'BRONZE',
        credits DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Agent marketplace and storage
    CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        creator_fingerprint TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        code TEXT NOT NULL,
        capabilities JSON,
        pricing JSON,
        performance_stats JSON DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_fingerprint) REFERENCES users(fingerprint)
    );

    -- Interaction logging (vault data with encryption)
    CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        user_fingerprint TEXT NOT NULL,
        original_prompt TEXT,
        obfuscated_prompt TEXT,
        llm_response TEXT,
        routing_trace JSON,
        cost DECIMAL(10,4) DEFAULT 0.0000,
        trust_impact INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_fingerprint) REFERENCES users(fingerprint)
    );

    -- Trust event logging for behavioral analysis
    CREATE TABLE IF NOT EXISTS trust_events (
        id TEXT PRIMARY KEY,
        user_fingerprint TEXT NOT NULL,
        event_type TEXT NOT NULL,
        trust_delta INTEGER,
        description TEXT,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_fingerprint) REFERENCES users(fingerprint)
    );

    -- Vault storage with multi-level encryption
    CREATE TABLE IF NOT EXISTS vault_entries (
        id TEXT PRIMARY KEY,
        user_fingerprint TEXT NOT NULL,
        data_type TEXT NOT NULL,
        content JSON,
        encryption_level TEXT DEFAULT 'standard',
        sync_eligible BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_fingerprint) REFERENCES users(fingerprint)
    );

    -- Agent execution logs for performance tracking
    CREATE TABLE IF NOT EXISTS agent_executions (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        user_fingerprint TEXT NOT NULL,
        execution_context JSON,
        result JSON,
        execution_time_ms INTEGER,
        cost DECIMAL(10,4),
        success BOOLEAN,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (agent_id) REFERENCES agents(id),
        FOREIGN KEY (user_fingerprint) REFERENCES users(fingerprint)
    );

    -- Billing transactions with trust-based discounts
    CREATE TABLE IF NOT EXISTS billing_transactions (
        id TEXT PRIMARY KEY,
        user_fingerprint TEXT NOT NULL,
        amount DECIMAL(10,4) NOT NULL,
        base_amount DECIMAL(10,4) NOT NULL,
        discount_rate DECIMAL(5,4) DEFAULT 0.0000,
        trust_score INTEGER,
        description TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_fingerprint) REFERENCES users(fingerprint)
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_users_fingerprint ON users(fingerprint);
    CREATE INDEX IF NOT EXISTS idx_interactions_fingerprint ON interactions(user_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_trust_events_fingerprint ON trust_events(user_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_vault_entries_fingerprint ON vault_entries(user_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_agents_creator ON agents(creator_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_agent_executions_agent ON agent_executions(agent_id);
    CREATE INDEX IF NOT EXISTS idx_billing_transactions_fingerprint ON billing_transactions(user_fingerprint);
    CREATE INDEX IF NOT EXISTS idx_interactions_created_at ON interactions(created_at);

    -- Triggers for updated_at timestamps
    CREATE TRIGGER IF NOT EXISTS update_users_timestamp 
        AFTER UPDATE ON users
        BEGIN
            UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;

    CREATE TRIGGER IF NOT EXISTS update_agents_timestamp 
        AFTER UPDATE ON agents
        BEGIN
            UPDATE agents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
        END;
  `;
  
  // Execute schema creation
  db.exec(schema);
  
  console.log('✅ Database schema created successfully');
  console.log(`📁 Database file: ${path.resolve(dbPath)}`);
  
  // Test the database
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`🧪 Database test: ${userCount.count} users (expected: 0)`);
  
  db.close();
  console.log('🔒 Database setup complete!\n');
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;