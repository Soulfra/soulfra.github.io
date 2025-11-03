
/**
 * 🗄️ PERSISTENT DATABASE LAYER
 * Stores user accounts, credits, automations, gaming progress
 */

const { Pool } = require('pg');

class DatabaseLayer {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production'
    });
    
    this.initializeTables();
  }

  async initializeTables() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        credits INTEGER DEFAULT 1000,
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS automations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID REFERENCES users(id),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price_credits INTEGER,
        arweave_hash VARCHAR(255),
        popularity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        automation_id UUID REFERENCES automations(id),
        credits_spent INTEGER,
        stripe_payment_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS gaming_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        achievement VARCHAR(255),
        unlocked_at TIMESTAMP DEFAULT NOW()
      );
    `);
  }

  async getUserCredits(userId) {
    const result = await this.pool.query('SELECT credits FROM users WHERE id = $1', [userId]);
    return result.rows[0]?.credits || 0;
  }

  async spendCredits(userId, amount, automationId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Deduct credits
      await client.query(
        'UPDATE users SET credits = credits - $1 WHERE id = $2',
        [amount, userId]
      );
      
      // Record transaction
      await client.query(
        'INSERT INTO transactions (user_id, automation_id, credits_spent) VALUES ($1, $2, $3)',
        [userId, automationId, amount]
      );
      
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = DatabaseLayer;