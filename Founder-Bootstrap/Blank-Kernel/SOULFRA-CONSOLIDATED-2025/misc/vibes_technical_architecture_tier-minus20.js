// ============================================================================
// VIBES TECHNICAL ARCHITECTURE - COMPLETE INFRASTRUCTURE INTEGRATION
// Connects VIBES tokens to: Internal DB + GitHub + Arweave + Web Servers
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { Arweave } from 'arweave';
import { Octokit } from '@octokit/rest';
import Database from 'better-sqlite3';
import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';

// ============================================================================
// 1. MULTI-LAYER DATABASE ARCHITECTURE
// ============================================================================

class VibresDataArchitecture {
  constructor(config = {}) {
    this.config = {
      // Local SQLite for fast operations
      sqlite: {
        path: config.sqlitePath || './vibes_local.db',
        wal: true
      },
      
      // Supabase for cloud sync and real-time
      supabase: {
        url: config.supabaseUrl || process.env.SUPABASE_URL,
        key: config.supabaseKey || process.env.SUPABASE_ANON_KEY
      },
      
      // GitHub for version control and backups
      github: {
        token: config.githubToken || process.env.GITHUB_TOKEN,
        owner: config.githubOwner || 'your-org',
        repo: config.githubRepo || 'vibes-data'
      },
      
      // Arweave for permanent storage
      arweave: {
        host: 'arweave.net',
        port: 443,
        protocol: 'https',
        timeout: 20000,
        logging: false
      },
      
      // Your internal database
      internal: {
        connectionString: config.internalDb || process.env.INTERNAL_DB_URL
      }
    };

    this.initializeDatabases();
  }

  async initializeDatabases() {
    // 1. Local SQLite for immediate consistency
    this.sqlite = new Database(this.config.sqlite.path);
    this.sqlite.pragma('journal_mode = WAL');
    this.setupSQLiteSchema();

    // 2. Supabase for cloud sync and collaboration
    this.supabase = createClient(
      this.config.supabase.url,
      this.config.supabase.key
    );

    // 3. GitHub for version control
    this.github = new Octokit({
      auth: this.config.github.token
    });

    // 4. Arweave for permanent storage
    this.arweave = Arweave.init(this.config.arweave);

    // 5. Internal database connection (your existing system)
    this.internal = await this.connectToInternalDB();

    console.log('🎯 VIBES multi-layer database architecture initialized');
  }

  setupSQLiteSchema() {
    // Core VIBES tables
    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS vibes_balances (
        user_fingerprint TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        total_earned INTEGER DEFAULT 0,
        last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
        trust_score REAL DEFAULT 0.0,
        user_tier TEXT DEFAULT 'simple'
      );

      CREATE TABLE IF NOT EXISTS vibes_transactions (
        id TEXT PRIMARY KEY,
        user_fingerprint TEXT,
        amount INTEGER,
        transaction_type TEXT, -- earn, spend, stake, unstake
        source TEXT, -- website_id, api_call, reflection, etc
        metadata TEXT, -- JSON
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_fingerprint) REFERENCES vibes_balances(user_fingerprint)
      );

      CREATE TABLE IF NOT EXISTS vibes_staking (
        id TEXT PRIMARY KEY,
        user_fingerprint TEXT,
        amount INTEGER,
        pool_type TEXT, -- basic, deep, master
        stake_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        unlock_timestamp DATETIME,
        last_reward_claim DATETIME DEFAULT CURRENT_TIMESTAMP,
        accumulated_rewards INTEGER DEFAULT 0,
        FOREIGN KEY (user_fingerprint) REFERENCES vibes_balances(user_fingerprint)
      );

      CREATE TABLE IF NOT EXISTS vibes_website_earnings (
        id TEXT PRIMARY KEY,
        user_fingerprint TEXT,
        website_id TEXT,
        earnings INTEGER DEFAULT 0,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_fingerprint) REFERENCES vibes_balances(user_fingerprint)
      );

      CREATE TABLE IF NOT EXISTS vibes_arweave_backups (
        id TEXT PRIMARY KEY,
        transaction_id TEXT,
        data_type TEXT, -- balance_snapshot, transaction_batch, etc
        arweave_tx_id TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_user ON vibes_transactions(user_fingerprint);
      CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON vibes_transactions(timestamp);
      CREATE INDEX IF NOT EXISTS idx_website_earnings ON vibes_website_earnings(user_fingerprint, website_id);
    `);
  }

  async connectToInternalDB() {
    // Connect to your existing internal database
    // This could be PostgreSQL, MySQL, MongoDB, etc.
    if (this.config.internal.connectionString) {
      const { Pool } = await import('pg');
      return new Pool({ connectionString: this.config.internal.connectionString });
    }
    return null;
  }

  // ========================================================================
  // 2. UNIFIED DATA OPERATIONS
  // ========================================================================

  async createUser(userFingerprint, userData = {}) {
    const user = {
      user_fingerprint: userFingerprint,
      balance: 0,
      total_earned: 0,
      trust_score: userData.trustScore || 0.0,
      user_tier: userData.tier || 'simple',
      ...userData
    };

    // 1. Insert into local SQLite (immediate consistency)
    const insertUser = this.sqlite.prepare(`
      INSERT OR REPLACE INTO vibes_balances 
      (user_fingerprint, balance, total_earned, trust_score, user_tier)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run(user.user_fingerprint, user.balance, user.total_earned, user.trust_score, user.user_tier);

    // 2. Sync to Supabase (cloud backup + real-time)
    await this.supabase
      .from('vibes_balances')
      .upsert(user);

    // 3. Update internal database if exists
    if (this.internal) {
      await this.internal.query(
        'INSERT INTO soulfra_users (fingerprint, vibes_balance, tier) VALUES ($1, $2, $3) ON CONFLICT (fingerprint) DO UPDATE SET vibes_balance = $2, tier = $3',
        [user.user_fingerprint, user.balance, user.user_tier]
      );
    }

    return user;
  }

  async addVibesTransaction(userFingerprint, amount, type, source, metadata = {}) {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transaction = {
      id: transactionId,
      user_fingerprint: userFingerprint,
      amount,
      transaction_type: type,
      source,
      metadata: JSON.stringify(metadata),
      timestamp: new Date().toISOString()
    };

    // 1. Local SQLite transaction (ACID)
    const insertTx = this.sqlite.prepare(`
      INSERT INTO vibes_transactions 
      (id, user_fingerprint, amount, transaction_type, source, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const updateBalance = this.sqlite.prepare(`
      UPDATE vibes_balances 
      SET balance = balance + ?, 
          total_earned = total_earned + CASE WHEN ? > 0 THEN ? ELSE 0 END,
          last_updated = CURRENT_TIMESTAMP
      WHERE user_fingerprint = ?
    `);

    const sqliteTransaction = this.sqlite.transaction(() => {
      insertTx.run(
        transaction.id,
        transaction.user_fingerprint,
        transaction.amount,
        transaction.transaction_type,
        transaction.source,
        transaction.metadata,
        transaction.timestamp
      );
      
      updateBalance.run(amount, amount, amount, userFingerprint);
    });

    sqliteTransaction();

    // 2. Sync to Supabase
    await Promise.all([
      this.supabase.from('vibes_transactions').insert(transaction),
      this.supabase.from('vibes_balances').upsert({
        user_fingerprint: userFingerprint,
        balance: this.getLocalBalance(userFingerprint),
        last_updated: new Date().toISOString()
      })
    ]);

    // 3. Update internal database
    if (this.internal) {
      await this.internal.query(
        'UPDATE soulfra_users SET vibes_balance = vibes_balance + $1 WHERE fingerprint = $2',
        [amount, userFingerprint]
      );
    }

    // 4. Queue for Arweave backup (async)
    this.queueArweaveBackup('transaction', transaction);

    // 5. Queue for GitHub backup (async)
    this.queueGitHubBackup('transaction', transaction);

    return transaction;
  }

  getLocalBalance(userFingerprint) {
    const result = this.sqlite.prepare('SELECT balance FROM vibes_balances WHERE user_fingerprint = ?').get(userFingerprint);
    return result ? result.balance : 0;
  }

  // ========================================================================
  // 3. GITHUB INTEGRATION - VERSION CONTROLLED DATA
  // ========================================================================

  async queueGitHubBackup(dataType, data) {
    // Batch GitHub operations for efficiency
    if (!this.githubQueue) this.githubQueue = [];
    
    this.githubQueue.push({ dataType, data, timestamp: Date.now() });
    
    // Process queue every 5 minutes or when it reaches 100 items
    if (this.githubQueue.length >= 100 || !this.githubProcessor) {
      this.processGitHubQueue();
    }
  }

  async processGitHubQueue() {
    if (this.githubProcessor) return; // Already processing
    
    this.githubProcessor = setTimeout(async () => {
      const batch = [...this.githubQueue];
      this.githubQueue = [];
      
      if (batch.length === 0) {
        this.githubProcessor = null;
        return;
      }

      try {
        // Create git branch for this batch
        const branchName = `vibes-backup-${Date.now()}`;
        const mainBranch = await this.github.rest.repos.getBranch({
          owner: this.config.github.owner,
          repo: this.config.github.repo,
          branch: 'main'
        });

        await this.github.rest.git.createRef({
          owner: this.config.github.owner,
          repo: this.config.github.repo,
          ref: `refs/heads/${branchName}`,
          sha: mainBranch.data.commit.sha
        });

        // Group by data type and create files
        const groupedData = batch.reduce((acc, item) => {
          if (!acc[item.dataType]) acc[item.dataType] = [];
          acc[item.dataType].push(item.data);
          return acc;
        }, {});

        for (const [dataType, items] of Object.entries(groupedData)) {
          const filename = `backups/${dataType}/${new Date().toISOString().split('T')[0]}.json`;
          const content = JSON.stringify(items, null, 2);

          await this.github.rest.repos.createOrUpdateFileContents({
            owner: this.config.github.owner,
            repo: this.config.github.repo,
            path: filename,
            message: `VIBES backup: ${items.length} ${dataType} records`,
            content: Buffer.from(content).toString('base64'),
            branch: branchName
          });
        }

        // Create pull request
        await this.github.rest.pulls.create({
          owner: this.config.github.owner,
          repo: this.config.github.repo,
          title: `VIBES Backup: ${batch.length} records`,
          head: branchName,
          base: 'main',
          body: `Automated backup of VIBES data:\n${Object.entries(groupedData).map(([type, items]) => `- ${items.length} ${type} records`).join('\n')}`
        });

        console.log(`📦 GitHub backup: ${batch.length} records in ${Object.keys(groupedData).length} files`);

      } catch (error) {
        console.error('GitHub backup failed:', error);
        // Re-queue failed items
        this.githubQueue.unshift(...batch);
      }

      this.githubProcessor = null;
    }, 5 * 60 * 1000); // 5 minutes
  }

  // ========================================================================
  // 4. ARWEAVE INTEGRATION - PERMANENT STORAGE
  // ========================================================================

  async queueArweaveBackup(dataType, data) {
    // Batch Arweave operations for cost efficiency
    if (!this.arweaveQueue) this.arweaveQueue = [];
    
    this.arweaveQueue.push({ dataType, data, timestamp: Date.now() });
    
    // Process queue daily or when it reaches 1000 items
    if (this.arweaveQueue.length >= 1000 || !this.arweaveProcessor) {
      this.processArweaveQueue();
    }
  }

  async processArweaveQueue() {
    if (this.arweaveProcessor) return;
    
    this.arweaveProcessor = setTimeout(async () => {
      const batch = [...this.arweaveQueue];
      this.arweaveQueue = [];
      
      if (batch.length === 0) {
        this.arweaveProcessor = null;
        return;
      }

      try {
        // Create anonymized batch for permanent storage
        const anonymizedBatch = batch.map(item => ({
          dataType: item.dataType,
          amount: item.data.amount,
          transactionType: item.data.transaction_type,
          source: item.data.source,
          timestamp: item.data.timestamp,
          // Remove user fingerprints and personal data
          userHash: this.hashUserFingerprint(item.data.user_fingerprint)
        }));

        const batchData = {
          version: '1.0',
          platform: 'soulfra',
          dataType: 'vibes_batch',
          timestamp: new Date().toISOString(),
          count: anonymizedBatch.length,
          data: anonymizedBatch
        };

        // Create Arweave transaction
        const transaction = await this.arweave.createTransaction({
          data: JSON.stringify(batchData)
        });

        // Add tags for discoverability
        transaction.addTag('Content-Type', 'application/json');
        transaction.addTag('App-Name', 'Soulfra-VIBES');
        transaction.addTag('Version', '1.0');
        transaction.addTag('Data-Type', 'vibes_batch');
        transaction.addTag('Record-Count', anonymizedBatch.length.toString());

        // Sign and post (you'll need to manage wallet/key)
        if (this.arweaveWallet) {
          await this.arweave.transactions.sign(transaction, this.arweaveWallet);
          await this.arweave.transactions.post(transaction);

          // Store Arweave transaction ID for reference
          const backupRecord = {
            id: `backup_${Date.now()}`,
            transaction_id: transaction.id,
            data_type: 'vibes_batch',
            arweave_tx_id: transaction.id,
            timestamp: new Date().toISOString()
          };

          this.sqlite.prepare(`
            INSERT INTO vibes_arweave_backups 
            (id, transaction_id, data_type, arweave_tx_id, timestamp)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            backupRecord.id,
            backupRecord.transaction_id,
            backupRecord.data_type,
            backupRecord.arweave_tx_id,
            backupRecord.timestamp
          );

          console.log(`🏛️ Arweave backup: ${batch.length} records - TX: ${transaction.id}`);
        }

      } catch (error) {
        console.error('Arweave backup failed:', error);
        // Re-queue failed items
        this.arweaveQueue.unshift(...batch);
      }

      this.arweaveProcessor = null;
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  hashUserFingerprint(fingerprint) {
    // Create anonymous hash for privacy
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(fingerprint + 'soulfra_salt').digest('hex').substr(0, 16);
  }

  // ========================================================================
  // 5. REAL-TIME SYNCHRONIZATION
  // ========================================================================

  setupRealTimeSync() {
    // Supabase real-time subscriptions
    this.supabase
      .channel('vibes_realtime')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'vibes_balances' },
        (payload) => this.handleBalanceUpdate(payload)
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'vibes_transactions' },
        (payload) => this.handleTransactionUpdate(payload)
      )
      .subscribe();

    // WebSocket server for immediate updates
    this.wss = new WebSocket.Server({ port: 8080 });
    this.wss.on('connection', (ws) => {
      ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'subscribe_balance') {
          ws.userFingerprint = data.userFingerprint;
        }
      });
    });
  }

  handleBalanceUpdate(payload) {
    // Sync Supabase changes to local SQLite
    if (payload.eventType === 'UPDATE') {
      const updateStmt = this.sqlite.prepare(`
        UPDATE vibes_balances 
        SET balance = ?, total_earned = ?, trust_score = ?, user_tier = ?
        WHERE user_fingerprint = ?
      `);
      
      const newData = payload.new;
      updateStmt.run(
        newData.balance,
        newData.total_earned,
        newData.trust_score,
        newData.user_tier,
        newData.user_fingerprint
      );

      // Notify WebSocket clients
      this.broadcastToUser(newData.user_fingerprint, {
        type: 'balance_updated',
        balance: newData.balance,
        totalEarned: newData.total_earned
      });
    }
  }

  broadcastToUser(userFingerprint, data) {
    this.wss.clients.forEach(client => {
      if (client.userFingerprint === userFingerprint && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  }

  // ========================================================================
  // 6. API SERVER INTEGRATION
  // ========================================================================

  createExpressAPI() {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // VIBES balance endpoint
    app.get('/api/vibes/balance/:userFingerprint', async (req, res) => {
      try {
        const balance = this.getLocalBalance(req.params.userFingerprint);
        const user = this.sqlite.prepare('SELECT * FROM vibes_balances WHERE user_fingerprint = ?').get(req.params.userFingerprint);
        
        res.json({
          balance,
          totalEarned: user?.total_earned || 0,
          trustScore: user?.trust_score || 0.0,
          userTier: user?.user_tier || 'simple'
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Add VIBES transaction endpoint
    app.post('/api/vibes/earn', async (req, res) => {
      try {
        const { userFingerprint, amount, source, metadata } = req.body;
        
        const transaction = await this.addVibesTransaction(
          userFingerprint,
          amount,
          'earn',
          source,
          metadata
        );
        
        res.json({
          success: true,
          transaction,
          newBalance: this.getLocalBalance(userFingerprint)
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Staking endpoints
    app.post('/api/vibes/stake', async (req, res) => {
      try {
        const { userFingerprint, amount, poolType } = req.body;
        const stakeId = await this.createStake(userFingerprint, amount, poolType);
        
        res.json({
          success: true,
          stakeId,
          newBalance: this.getLocalBalance(userFingerprint)
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Website earnings endpoint
    app.get('/api/vibes/website-earnings/:userFingerprint', async (req, res) => {
      try {
        const earnings = this.sqlite.prepare(`
          SELECT website_id, earnings, last_activity 
          FROM vibes_website_earnings 
          WHERE user_fingerprint = ?
        `).all(req.params.userFingerprint);
        
        res.json({ earnings });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    return app;
  }

  async createStake(userFingerprint, amount, poolType) {
    const stakeId = `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const unlockTime = this.calculateUnlockTime(poolType);
    
    const createStake = this.sqlite.prepare(`
      INSERT INTO vibes_staking 
      (id, user_fingerprint, amount, pool_type, unlock_timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    const updateBalance = this.sqlite.prepare(`
      UPDATE vibes_balances 
      SET balance = balance - ?
      WHERE user_fingerprint = ? AND balance >= ?
    `);

    const stakeTransaction = this.sqlite.transaction(() => {
      const result = updateBalance.run(amount, userFingerprint, amount);
      if (result.changes === 0) {
        throw new Error('Insufficient balance');
      }
      
      createStake.run(stakeId, userFingerprint, amount, poolType, unlockTime);
    });

    stakeTransaction();

    // Sync to other databases
    await this.supabase.from('vibes_staking').insert({
      id: stakeId,
      user_fingerprint: userFingerprint,
      amount,
      pool_type: poolType,
      unlock_timestamp: unlockTime
    });

    return stakeId;
  }

  calculateUnlockTime(poolType) {
    const lockPeriods = {
      basic: 0,
      deep: 30 * 24 * 60 * 60 * 1000, // 30 days
      master: 90 * 24 * 60 * 60 * 1000 // 90 days
    };
    
    return new Date(Date.now() + (lockPeriods[poolType] || 0)).toISOString();
  }
}

// ============================================================================
// 7. DEPLOYMENT & INITIALIZATION
// ============================================================================

class VibresDeploymentManager {
  constructor() {
    this.dataArchitecture = new VibresDataArchitecture();
    this.expressApp = null;
  }

  async deploy(port = 3000) {
    // Initialize database architecture
    await this.dataArchitecture.initializeDatabases();
    
    // Setup real-time synchronization
    this.dataArchitecture.setupRealTimeSync();
    
    // Create Express API server
    this.expressApp = this.dataArchitecture.createExpressAPI();
    
    // Serve static files for dashboard
    this.expressApp.use(express.static('dist'));
    
    // Start server
    this.expressApp.listen(port, () => {
      console.log(`🚀 VIBES backend running on port ${port}`);
      console.log(`📊 Dashboard: http://localhost:${port}`);
      console.log(`🔌 API: http://localhost:${port}/api/vibes/*`);
      console.log(`⚡ WebSocket: ws://localhost:8080`);
    });

    return {
      port,
      apiUrl: `http://localhost:${port}/api/vibes`,
      wsUrl: `ws://localhost:8080`,
      dataArchitecture: this.dataArchitecture
    };
  }

  async setupInitialData() {
    // Create demo users for each tier
    await this.dataArchitecture.createUser('demo_simple_user', {
      trustScore: 0.75,
      tier: 'simple'
    });

    await this.dataArchitecture.createUser('demo_developer_user', {
      trustScore: 0.85,
      tier: 'developer'
    });

    await this.dataArchitecture.createUser('demo_enterprise_user', {
      trustScore: 0.95,
      tier: 'enterprise'
    });

    await this.dataArchitecture.createUser('demo_agent_zero', {
      trustScore: 1.0,
      tier: 'agent_zero'
    });

    // Add some demo transactions
    const users = ['demo_simple_user', 'demo_developer_user', 'demo_enterprise_user', 'demo_agent_zero'];
    
    for (const user of users) {
      await this.dataArchitecture.addVibesTransaction(user, 100, 'earn', 'welcome_bonus', { type: 'initial_grant' });
      await this.dataArchitecture.addVibesTransaction(user, 50, 'earn', 'reflection_session', { quality: 0.8 });
      await this.dataArchitecture.addVibesTransaction(user, 25, 'earn', 'daily_login', { streak: 3 });
    }

    console.log('✅ Demo data initialized');
  }
}

// ============================================================================
// 8. USAGE EXAMPLES
// ============================================================================

// Initialize and deploy
const deployment = new VibresDeploymentManager();

async function startVibesSystem() {
  try {
    // Deploy the complete system
    const config = await deployment.deploy(3000);
    
    // Setup demo data
    await deployment.setupInitialData();
    
    console.log('🎯 VIBES system fully operational!');
    console.log('Architecture layers:');
    console.log('  - SQLite: Fast local operations');
    console.log('  - Supabase: Cloud sync & real-time');
    console.log('  - GitHub: Version controlled backups');
    console.log('  - Arweave: Permanent decentralized storage');
    console.log('  - Internal DB: Integration with existing systems');
    
    return config;
  } catch (error) {
    console.error('Failed to start VIBES system:', error);
  }
}

// Export for use
export { 
  VibresDataArchitecture, 
  VibresDeploymentManager, 
  startVibesSystem 
};

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { 
    VibresDataArchitecture, 
    VibresDeploymentManager, 
    startVibesSystem 
  };
}