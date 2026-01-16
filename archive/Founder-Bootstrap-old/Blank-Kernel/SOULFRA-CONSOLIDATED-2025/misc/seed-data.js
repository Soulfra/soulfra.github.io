const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

class SeedData {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'billion_dollar_game',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });
  }

  async seed() {
    try {
      console.log('Seeding database with initial data...');
      
      // Create users
      const users = await this.createUsers();
      
      // Create AI agents
      const agents = await this.createAIAgents(users);
      
      // Create contracts
      const contracts = await this.createContracts(users);
      
      // Create transactions
      await this.createTransactions(users, contracts);
      
      // Create game states
      await this.createGameStates(users);
      
      // Create API keys
      await this.createAPIKeys();
      
      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Seeding failed:', error);
      throw error;
    }
  }

  async createUsers() {
    const users = [
      {
        id: uuidv4(),
        username: 'founder',
        email: 'founder@billiondollargame.com',
        password: 'founder123',
        balance: 1000000.00,
        reputation_score: 95.00
      },
      {
        id: uuidv4(),
        username: 'player_one',
        email: 'player1@example.com',
        password: 'player123',
        balance: 10000.00,
        reputation_score: 75.00
      },
      {
        id: uuidv4(),
        username: 'whale_trader',
        email: 'whale@example.com',
        password: 'whale123',
        balance: 500000.00,
        reputation_score: 85.00
      },
      {
        id: uuidv4(),
        username: 'ai_enthusiast',
        email: 'ai@example.com',
        password: 'aiuser123',
        balance: 25000.00,
        reputation_score: 70.00
      }
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      await this.pool.query(`
        INSERT INTO users (id, username, email, password_hash, balance, reputation_score)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [user.id, user.username, user.email, hashedPassword, user.balance, user.reputation_score]);
    }

    console.log(`Created ${users.length} users`);
    return users;
  }

  async createAIAgents(users) {
    const agents = [
      {
        id: uuidv4(),
        name: 'Cal Prime',
        type: 'cal',
        owner_id: users[0].id,
        personality: {
          traits: ['strategic', 'analytical', 'trustworthy'],
          style: 'professional',
          specialties: ['contract negotiation', 'risk assessment']
        },
        capabilities: {
          contract_creation: true,
          autonomous_signing: true,
          negotiation: true,
          analysis: true
        },
        trust_score: 90.00
      },
      {
        id: uuidv4(),
        name: 'Domingo Alpha',
        type: 'domingo',
        owner_id: users[1].id,
        personality: {
          traits: ['creative', 'adaptive', 'innovative'],
          style: 'casual',
          specialties: ['pattern recognition', 'opportunity finding']
        },
        capabilities: {
          contract_creation: true,
          autonomous_signing: false,
          negotiation: true,
          analysis: true
        },
        trust_score: 75.00
      },
      {
        id: uuidv4(),
        name: 'Guardian Bot',
        type: 'custom',
        owner_id: users[2].id,
        personality: {
          traits: ['protective', 'cautious', 'thorough'],
          style: 'formal',
          specialties: ['fraud detection', 'compliance']
        },
        capabilities: {
          contract_creation: false,
          autonomous_signing: false,
          negotiation: false,
          analysis: true
        },
        trust_score: 85.00
      }
    ];

    for (const agent of agents) {
      await this.pool.query(`
        INSERT INTO ai_agents (id, name, type, personality, capabilities, owner_id, trust_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [agent.id, agent.name, agent.type, agent.personality, agent.capabilities, agent.owner_id, agent.trust_score]);
    }

    console.log(`Created ${agents.length} AI agents`);
    return agents;
  }

  async createContracts(users) {
    const contracts = [
      {
        id: uuidv4(),
        contract_number: 'BDG-2024-001',
        creator_id: users[0].id,
        type: 'standard',
        title: 'Foundation Partnership Agreement',
        description: 'Initial partnership for game development',
        terms: {
          duration: '12 months',
          deliverables: ['Platform launch', 'User onboarding', 'Revenue sharing'],
          conditions: ['Monthly reports', 'Minimum user targets']
        },
        value: 100000.00,
        status: 'active'
      },
      {
        id: uuidv4(),
        contract_number: 'BDG-2024-002',
        creator_id: users[1].id,
        type: 'ai_generated',
        title: 'AI Agent Training Services',
        description: 'Contract for AI model improvement',
        terms: {
          duration: '6 months',
          deliverables: ['Training data', 'Model updates', 'Performance metrics'],
          conditions: ['Weekly iterations', 'Success metrics']
        },
        value: 50000.00,
        status: 'active'
      },
      {
        id: uuidv4(),
        contract_number: 'BDG-2024-003',
        creator_id: users[2].id,
        type: 'recursive',
        title: 'Recursive Revenue Contract',
        description: 'Self-executing contract with automated payouts',
        terms: {
          duration: 'perpetual',
          deliverables: ['Automated execution', 'Revenue distribution'],
          conditions: ['Smart contract rules', 'Threshold triggers']
        },
        value: 250000.00,
        status: 'draft'
      }
    ];

    for (const contract of contracts) {
      await this.pool.query(`
        INSERT INTO contracts (
          id, contract_number, creator_id, type, title, 
          description, terms, value, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        contract.id, contract.contract_number, contract.creator_id,
        contract.type, contract.title, contract.description,
        contract.terms, contract.value, contract.status
      ]);
    }

    console.log(`Created ${contracts.length} contracts`);
    return contracts;
  }

  async createTransactions(users, contracts) {
    const transactions = [
      {
        transaction_hash: uuidv4(),
        type: 'deposit',
        to_user_id: users[0].id,
        amount: 1000000.00,
        status: 'completed',
        stripe_payment_intent_id: 'pi_test_founder_deposit'
      },
      {
        transaction_hash: uuidv4(),
        type: 'contract_payment',
        from_user_id: users[1].id,
        to_user_id: users[0].id,
        contract_id: contracts[0].id,
        amount: 97500.00,
        fee_amount: 2500.00,
        status: 'completed'
      },
      {
        transaction_hash: uuidv4(),
        type: 'deposit',
        to_user_id: users[2].id,
        amount: 500000.00,
        status: 'completed',
        stripe_payment_intent_id: 'pi_test_whale_deposit'
      }
    ];

    for (const transaction of transactions) {
      await this.pool.query(`
        INSERT INTO transactions (
          transaction_hash, type, from_user_id, to_user_id,
          contract_id, amount, fee_amount, status, stripe_payment_intent_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        transaction.transaction_hash, transaction.type, transaction.from_user_id,
        transaction.to_user_id, transaction.contract_id, transaction.amount,
        transaction.fee_amount, transaction.status, transaction.stripe_payment_intent_id
      ]);
    }

    console.log(`Created ${transactions.length} transactions`);
  }

  async createGameStates(users) {
    const gameStates = [
      {
        user_id: users[0].id,
        current_level: 10,
        experience_points: 95000,
        achievements: ['first_contract', 'revenue_milestone', 'ai_master'],
        daily_streak: 30,
        powerups: { 'double_xp': 2, 'fee_reduction': 1 }
      },
      {
        user_id: users[1].id,
        current_level: 5,
        experience_points: 12000,
        achievements: ['first_contract', 'ai_trainer'],
        daily_streak: 7,
        powerups: { 'double_xp': 1 }
      },
      {
        user_id: users[2].id,
        current_level: 8,
        experience_points: 50000,
        achievements: ['whale_status', 'high_roller'],
        daily_streak: 15,
        powerups: { 'fee_reduction': 3, 'priority_matching': 2 }
      }
    ];

    for (const gameState of gameStates) {
      await this.pool.query(`
        INSERT INTO game_state (
          user_id, current_level, experience_points,
          achievements, daily_streak, powerups
        ) VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        gameState.user_id, gameState.current_level, gameState.experience_points,
        gameState.achievements, gameState.daily_streak, gameState.powerups
      ]);
    }

    console.log(`Created ${gameStates.length} game states`);
  }

  async createAPIKeys() {
    const apiKeys = [
      {
        service_name: 'stripe',
        key_name: 'stripe_secret_key',
        encrypted_key: 'encrypted_sk_test_placeholder', // In real app, this would be encrypted
        key_hash: 'hash_stripe_key',
        environment: 'development'
      },
      {
        service_name: 'openai',
        key_name: 'openai_api_key',
        encrypted_key: 'encrypted_openai_placeholder',
        key_hash: 'hash_openai_key',
        environment: 'development'
      },
      {
        service_name: 'discord',
        key_name: 'discord_bot_token',
        encrypted_key: 'encrypted_discord_placeholder',
        key_hash: 'hash_discord_key',
        environment: 'development'
      },
      {
        service_name: 'telegram',
        key_name: 'telegram_bot_token',
        encrypted_key: 'encrypted_telegram_placeholder',
        key_hash: 'hash_telegram_key',
        environment: 'development'
      }
    ];

    for (const apiKey of apiKeys) {
      await this.pool.query(`
        INSERT INTO api_keys (
          service_name, key_name, encrypted_key, key_hash, environment
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        apiKey.service_name, apiKey.key_name, apiKey.encrypted_key,
        apiKey.key_hash, apiKey.environment
      ]);
    }

    console.log(`Created ${apiKeys.length} API keys`);
  }

  async close() {
    await this.pool.end();
  }
}

// Run seeding if called directly
if (require.main === module) {
  const seeder = new SeedData();
  
  (async () => {
    try {
      await seeder.seed();
    } catch (error) {
      console.error('Seeding error:', error);
      process.exit(1);
    } finally {
      await seeder.close();
    }
  })();
}

module.exports = SeedData;