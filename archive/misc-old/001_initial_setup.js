const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

class InitialSetupMigration {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'billion_dollar_game',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });
  }

  async up() {
    try {
      console.log('Running initial database setup migration...');
      
      // Read and execute the main schema
      const schemaPath = path.join(__dirname, '../postgresql/schema.sql');
      const schema = await fs.readFile(schemaPath, 'utf8');
      
      await this.pool.query(schema);
      
      // Create additional functions and procedures
      await this.createStoredProcedures();
      
      // Create materialized views for performance
      await this.createMaterializedViews();
      
      console.log('Initial setup migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  async down() {
    try {
      console.log('Rolling back initial setup migration...');
      
      // Drop all tables in reverse order
      const dropTables = `
        DROP TABLE IF EXISTS audit_logs CASCADE;
        DROP TABLE IF EXISTS api_keys CASCADE;
        DROP TABLE IF EXISTS notifications CASCADE;
        DROP TABLE IF EXISTS game_state CASCADE;
        DROP TABLE IF EXISTS transactions CASCADE;
        DROP TABLE IF EXISTS contract_signatures CASCADE;
        DROP TABLE IF EXISTS contracts CASCADE;
        DROP TABLE IF EXISTS ai_agents CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
        
        DROP FUNCTION IF EXISTS update_updated_at_column();
      `;
      
      await this.pool.query(dropTables);
      
      console.log('Rollback completed successfully!');
    } catch (error) {
      console.error('Rollback failed:', error);
      throw error;
    }
  }

  async createStoredProcedures() {
    // Function to calculate user reputation
    const calculateReputation = `
      CREATE OR REPLACE FUNCTION calculate_user_reputation(user_id UUID)
      RETURNS DECIMAL AS $$
      DECLARE
        reputation DECIMAL;
        contract_ratio DECIMAL;
        dispute_penalty DECIMAL;
      BEGIN
        -- Base calculation from contract success ratio
        SELECT 
          CASE 
            WHEN total_contracts_created > 0 THEN
              (CAST(total_contracts_signed AS DECIMAL) / total_contracts_created) * 50
            ELSE 25
          END INTO contract_ratio
        FROM users
        WHERE id = user_id;
        
        -- Calculate dispute penalty
        SELECT 
          COUNT(*) * 5 INTO dispute_penalty
        FROM contracts
        WHERE creator_id = user_id AND status = 'disputed';
        
        -- Calculate final reputation
        reputation := GREATEST(0, LEAST(100, 50 + contract_ratio - dispute_penalty));
        
        RETURN reputation;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Function to process contract completion
    const processContractCompletion = `
      CREATE OR REPLACE FUNCTION process_contract_completion(contract_id UUID)
      RETURNS VOID AS $$
      DECLARE
        contract_record RECORD;
        fee_amount DECIMAL;
      BEGIN
        -- Get contract details
        SELECT * INTO contract_record FROM contracts WHERE id = contract_id;
        
        IF contract_record.status != 'active' THEN
          RAISE EXCEPTION 'Contract is not active';
        END IF;
        
        -- Calculate fee
        fee_amount := contract_record.value * (contract_record.fee_percentage / 100);
        
        -- Create transaction for contract payment
        INSERT INTO transactions (
          transaction_hash, type, from_user_id, to_user_id, 
          contract_id, amount, fee_amount, status
        ) VALUES (
          md5(random()::text || clock_timestamp()::text)::uuid,
          'contract_payment',
          NULL, -- From platform
          contract_record.creator_id,
          contract_id,
          contract_record.value - fee_amount,
          fee_amount,
          'completed'
        );
        
        -- Update contract status
        UPDATE contracts SET status = 'completed' WHERE id = contract_id;
        
        -- Update user stats
        UPDATE users 
        SET balance = balance + (contract_record.value - fee_amount)
        WHERE id = contract_record.creator_id;
      END;
      $$ LANGUAGE plpgsql;
    `;

    await this.pool.query(calculateReputation);
    await this.pool.query(processContractCompletion);
  }

  async createMaterializedViews() {
    // Leaderboard view
    const leaderboardView = `
      CREATE MATERIALIZED VIEW leaderboard AS
      SELECT 
        u.id,
        u.username,
        u.balance,
        u.total_contracts_created,
        u.total_contracts_signed,
        u.reputation_score,
        COUNT(DISTINCT c.id) as active_contracts,
        COALESCE(SUM(c.value), 0) as total_contract_value,
        ROW_NUMBER() OVER (ORDER BY u.balance DESC) as wealth_rank,
        ROW_NUMBER() OVER (ORDER BY u.reputation_score DESC) as reputation_rank
      FROM users u
      LEFT JOIN contracts c ON u.id = c.creator_id AND c.status = 'active'
      WHERE u.is_active = true
      GROUP BY u.id, u.username, u.balance, u.total_contracts_created, 
               u.total_contracts_signed, u.reputation_score;
      
      CREATE INDEX idx_leaderboard_wealth ON leaderboard(wealth_rank);
      CREATE INDEX idx_leaderboard_reputation ON leaderboard(reputation_rank);
    `;

    // Daily statistics view
    const dailyStatsView = `
      CREATE MATERIALIZED VIEW daily_statistics AS
      SELECT 
        DATE(created_at) as date,
        COUNT(DISTINCT CASE WHEN created_at::date = CURRENT_DATE THEN id END) as new_users,
        COUNT(DISTINCT CASE WHEN last_active::date = CURRENT_DATE THEN id END) as active_users,
        (SELECT COUNT(*) FROM contracts WHERE created_at::date = CURRENT_DATE) as contracts_created,
        (SELECT COALESCE(SUM(amount), 0) FROM transactions 
         WHERE created_at::date = CURRENT_DATE AND status = 'completed') as transaction_volume,
        (SELECT COALESCE(SUM(fee_amount), 0) FROM transactions 
         WHERE created_at::date = CURRENT_DATE AND status = 'completed') as platform_revenue
      FROM users
      GROUP BY DATE(created_at)
      ORDER BY date DESC;
      
      CREATE INDEX idx_daily_stats_date ON daily_statistics(date);
    `;

    await this.pool.query(leaderboardView);
    await this.pool.query(dailyStatsView);
  }

  async close() {
    await this.pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  const migration = new InitialSetupMigration();
  
  const command = process.argv[2];
  
  (async () => {
    try {
      if (command === 'up') {
        await migration.up();
      } else if (command === 'down') {
        await migration.down();
      } else {
        console.log('Usage: node 001_initial_setup.js [up|down]');
      }
    } catch (error) {
      console.error('Migration error:', error);
      process.exit(1);
    } finally {
      await migration.close();
    }
  })();
}

module.exports = InitialSetupMigration;