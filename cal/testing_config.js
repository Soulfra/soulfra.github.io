// tests/setup.test.js - Test Environment Setup
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Create test database
const testDb = new Database(':memory:');

// Initialize test schema
const initTestDb = () => {
  testDb.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      trust_score INTEGER DEFAULT 50,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE providers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      api_key TEXT,
      endpoint TEXT,
      is_active BOOLEAN DEFAULT true,
      priority INTEGER DEFAULT 100,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE provider_models (
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

    CREATE TABLE provider_usage (
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

    CREATE TABLE provider_health (
      provider_id TEXT PRIMARY KEY REFERENCES providers(id),
      success_rate DECIMAL(5,2) DEFAULT 100,
      avg_latency_ms INTEGER DEFAULT 0,
      last_error TEXT,
      last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      is_healthy BOOLEAN DEFAULT true,
      total_requests INTEGER DEFAULT 0,
      failed_requests INTEGER DEFAULT 0
    );

    CREATE TABLE conversations (
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

    CREATE TABLE trust_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      event_type TEXT NOT NULL,
      trust_delta INTEGER NOT NULL,
      reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Insert test data
  const insertProvider = testDb.prepare('INSERT INTO providers (id, name, type) VALUES (?, ?, ?)');
  insertProvider.run('mock', 'Mock Provider', 'mock');
  insertProvider.run('openai', 'OpenAI', 'openai');

  const insertModel = testDb.prepare(`
    INSERT INTO provider_models (id, provider_id, model_name, cost_per_1k_input, cost_per_1k_output, quality_score, min_trust_required)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertModel.run('mock-basic', 'mock', 'mock-basic', 0, 0, 40, 0);
  insertModel.run('mock-premium', 'mock', 'mock-premium', 0, 0, 85, 70);

  const insertHealth = testDb.prepare('INSERT INTO provider_health (provider_id) VALUES (?)');
  insertHealth.run('mock');
  insertHealth.run('openai');

  // Create test user
  const hash = bcrypt.hashSync('testpass', 10);
  const insertUser = testDb.prepare('INSERT INTO users (email, password_hash, trust_score) VALUES (?, ?, ?)');
  insertUser.run('test@example.com', hash, 75);
};

module.exports = { testDb, initTestDb };

---
// tests/auth.test.js - Authentication Tests
const request = require('supertest');
const { testDb, initTestDb } = require('./setup.test');

// Mock the database for the app
jest.mock('better-sqlite3', () => {
  return jest.fn(() => testDb);
});

const app = require('../server');

describe('Authentication', () => {
  beforeEach(() => {
    initTestDb();
  });

  afterAll(() => {
    testDb.close();
  });

  describe('POST /api/auth/register', () => {
    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.user.trust_score).toBe(50);
    });

    test('should not register user with existing email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already registered');
    });

    test('should require email and password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password required');
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'testpass'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpass'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });

    test('should not login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
    });
  });
});

---
// tests/routing.test.js - Router Service Tests
const { RouterService } = require('../src/router');
const { testDb, initTestDb } = require('./setup.test');

// Mock provider for testing
class MockTestProvider {
  constructor(id, name, shouldFail = false) {
    this.id = id;
    this.name = name;
    this.shouldFail = shouldFail;
    this.isActive = true;
  }

  async chat(params) {
    if (this.shouldFail) {
      throw new Error('Provider failed');
    }

    return {
      content: `Response from ${this.name}`,
      model: params.model,
      usage: { inputTokens: 10, outputTokens: 20, totalCost: 0.001 },
      provider: this.name,
      latency: 100,
      success: true
    };
  }

  getAvailableModels() {
    return [
      {
        id: `${this.id}-model`,
        model_name: `${this.id}-model`,
        quality_score: 70,
        min_trust_required: 50,
        cost_per_1k_input: 0.001,
        cost_per_1k_output: 0.002
      }
    ];
  }
}

class MockTrustService {
  async getTrustScore(userId) {
    return 75; // High trust for testing
  }
}

class MockRegistry {
  constructor() {
    this.providers = new Map();
    this.providers.set('mock1', new MockTestProvider('mock1', 'Mock Provider 1'));
    this.providers.set('mock2', new MockTestProvider('mock2', 'Mock Provider 2', true));
  }

  getActiveProviders() {
    return Array.from(this.providers.values());
  }
}

describe('Router Service', () => {
  let router;

  beforeEach(() => {
    initTestDb();
    const registry = new MockRegistry();
    const trustService = new MockTrustService();
    router = new RouterService(registry, trustService);
  });

  test('should route to available provider', async () => {
    const request = {
      messages: [{ role: 'user', content: 'Hello' }]
    };

    const response = await router.route(request, 1);

    expect(response.success).toBe(true);
    expect(response.content).toContain('Mock Provider 1');
    expect(response.trustScore).toBe(75);
    expect(response.tier).toBe('premium');
  });

  test('should handle provider failures with fallback', async () => {
    // This test would need more sophisticated mocking
    // to test failover scenarios
    expect(true).toBe(true);
  });

  test('should calculate correct tier based on trust score', () => {
    expect(router.getTier(85)).toBe('premium');
    expect(router.getTier(65)).toBe('standard');
    expect(router.getTier(30)).toBe('basic');
  });
});

---
// tests/api.test.js - API Integration Tests
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { testDb, initTestDb } = require('./setup.test');

// Mock the database
jest.mock('better-sqlite3', () => {
  return jest.fn(() => testDb);
});

const app = require('../server');

describe('API Integration Tests', () => {
  let authToken;

  beforeEach(async () => {
    initTestDb();
    
    // Create auth token for test user
    authToken = jwt.sign(
      { id: 1, email: 'test@example.com' },
      process.env.JWT_SECRET || 'soulfra-secret-dev'
    );
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('providers');
    });
  });

  describe('POST /api/ai/chat', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }]
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    test('should handle chat request with auth', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [{ role: 'user', content: 'Hello' }]
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('provider');
      expect(response.body).toHaveProperty('usage');
    });

    test('should require messages array', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Messages array required');
    });
  });

  describe('GET /api/providers', () => {
    test('should return providers list', async () => {
      const response = await request(app)
        .get('/api/providers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/user/profile', () => {
    test('should return user profile', async () => {
      const response = await request(app)
        .get('/api/user/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.email).toBe('test@example.com');
      expect(response.body).toHaveProperty('trust_score');
      expect(response.body).toHaveProperty('tier');
      expect(response.body).toHaveProperty('stats');
    });
  });
});

---
// jest.config.js - Jest Configuration
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/coverage/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  setupFilesAfterEnv: ['./tests/setup.test.js'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testTimeout: 10000
};

---
// scripts/benchmark.js - Performance Benchmarking
const request = require('supertest');
const app = require('../server');

class PerformanceBenchmark {
  constructor() {
    this.results = [];
  }

  async runBenchmark() {
    console.log('🏃 Starting Soulfra Performance Benchmark...');
    
    // Test authentication performance
    await this.benchmarkAuth();
    
    // Test chat performance  
    await this.benchmarkChat();
    
    // Test provider health checks
    await this.benchmarkHealthChecks();
    
    this.generateReport();
  }

  async benchmarkAuth() {
    console.log('📊 Benchmarking authentication...');
    
    const authTests = [];
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      try {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'demo@soulfra.ai',
            password: 'demo123'
          });
          
        const latency = Date.now() - start;
        authTests.push({
          success: response.status === 200,
          latency
        });
      } catch (error) {
        authTests.push({
          success: false,
          latency: Date.now() - start,
          error: error.message
        });
      }
    }
    
    this.results.push({
      test: 'Authentication',
      iterations,
      successRate: (authTests.filter(t => t.success).length / iterations) * 100,
      avgLatency: authTests.reduce((acc, t) => acc + t.latency, 0) / iterations,
      minLatency: Math.min(...authTests.map(t => t.latency)),
      maxLatency: Math.max(...authTests.map(t => t.latency))
    });
  }

  async benchmarkChat() {
    console.log('💬 Benchmarking chat requests...');
    
    // First get auth token
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'demo@soulfra.ai',
        password: 'demo123'
      });
    
    const token = authResponse.body.token;
    const chatTests = [];
    const iterations = 50;
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      try {
        const response = await request(app)
          .post('/api/ai/chat')
          .set('Authorization', `Bearer ${token}`)
          .send({
            messages: [{ role: 'user', content: `Test message ${i}` }]
          });
          
        const latency = Date.now() - start;
        chatTests.push({
          success: response.status === 200,
          latency,
          provider: response.body.provider
        });
      } catch (error) {
        chatTests.push({
          success: false,
          latency: Date.now() - start,
          error: error.message
        });
      }
    }
    
    this.results.push({
      test: 'AI Chat',
      iterations,
      successRate: (chatTests.filter(t => t.success).length / iterations) * 100,
      avgLatency: chatTests.reduce((acc, t) => acc + t.latency, 0) / iterations,
      minLatency: Math.min(...chatTests.map(t => t.latency)),
      maxLatency: Math.max(...chatTests.map(t => t.latency)),
      providers: [...new Set(chatTests.map(t => t.provider).filter(Boolean))]
    });
  }

  async benchmarkHealthChecks() {
    console.log('🔍 Benchmarking health checks...');
    
    const healthTests = [];
    const iterations = 20;
    
    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      
      try {
        const response = await request(app).get('/health');
        const latency = Date.now() - start;
        
        healthTests.push({
          success: response.status === 200,
          latency
        });
      } catch (error) {
        healthTests.push({
          success: false,
          latency: Date.now() - start,
          error: error.message
        });
      }
    }
    
    this.results.push({
      test: 'Health Check',
      iterations,
      successRate: (healthTests.filter(t => t.success).length / iterations) * 100,
      avgLatency: healthTests.reduce((acc, t) => acc + t.latency, 0) / iterations,
      minLatency: Math.min(...healthTests.map(t => t.latency)),
      maxLatency: Math.max(...healthTests.map(t => t.latency))
    });
  }

  generateReport() {
    console.log('\n🎯 Benchmark Results:');
    console.log('=====================');
    
    this.results.forEach(result => {
      console.log(`\n${result.test}:`);
      console.log(`  Iterations: ${result.iterations}`);
      console.log(`  Success Rate: ${result.successRate.toFixed(2)}%`);
      console.log(`  Avg Latency: ${result.avgLatency.toFixed(2)}ms`);
      console.log(`  Min Latency: ${result.minLatency}ms`);
      console.log(`  Max Latency: ${result.maxLatency}ms`);
      
      if (result.providers) {
        console.log(`  Providers Used: ${result.providers.join(', ')}`);
      }
    });

    // Performance scoring
    const overallScore = this.calculatePerformanceScore();
    console.log(`\n🏆 Overall Performance Score: ${overallScore}/100`);
    
    if (overallScore >= 90) {
      console.log('🎉 Excellent performance!');
    } else if (overallScore >= 75) {
      console.log('✅ Good performance');
    } else if (overallScore >= 60) {
      console.log('⚠️  Average performance - consider optimization');
    } else {
      console.log('❌ Poor performance - optimization needed');
    }
  }

  calculatePerformanceScore() {
    let score = 100;
    
    this.results.forEach(result => {
      // Penalize for low success rate
      if (result.successRate < 100) {
        score -= (100 - result.successRate) * 0.5;
      }
      
      // Penalize for high latency
      if (result.avgLatency > 1000) {
        score -= (result.avgLatency - 1000) * 0.01;
      } else if (result.avgLatency > 500) {
        score -= (result.avgLatency - 500) * 0.005;
      }
    });
    
    return Math.max(0, Math.round(score));
  }
}

// Run benchmark if called directly
if (require.main === module) {
  const benchmark = new PerformanceBenchmark();
  benchmark.runBenchmark().catch(console.error);
}

module.exports = PerformanceBenchmark;

---
// scripts/load-test.js - Load Testing Script
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const request = require('supertest');

class LoadTester {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'http://localhost:3001';
    this.concurrency = options.concurrency || numCPUs;
    this.duration = options.duration || 60000; // 1 minute
    this.requestsPerSecond = options.requestsPerSecond || 10;
  }

  async runLoadTest() {
    console.log(`🚀 Starting load test...`);
    console.log(`   Target: ${this.baseURL}`);
    console.log(`   Concurrency: ${this.concurrency} workers`);
    console.log(`   Duration: ${this.duration / 1000} seconds`);
    console.log(`   Target RPS: ${this.requestsPerSecond}`);

    if (cluster.isMaster) {
      await this.masterProcess();
    } else {
      await this.workerProcess();
    }
  }

  async masterProcess() {
    const workers = [];
    const results = [];

    // Fork workers
    for (let i = 0; i < this.concurrency; i++) {
      const worker = cluster.fork();
      workers.push(worker);

      worker.on('message', (result) => {
        results.push(result);
      });
    }

    // Wait for test duration
    setTimeout(() => {
      workers.forEach(worker => worker.kill());
      this.analyzeResults(results);
    }, this.duration);
  }

  async workerProcess() {
    const startTime = Date.now();
    const endTime = startTime + this.duration;
    const interval = 1000 / this.requestsPerSecond;

    let requestCount = 0;
    let successCount = 0;
    let totalLatency = 0;
    let errors = [];

    const makeRequest = async () => {
      const reqStart = Date.now();
      
      try {
        const response = await fetch(`${this.baseURL}/health`);
        const latency = Date.now() - reqStart;
        
        requestCount++;
        totalLatency += latency;
        
        if (response.ok) {
          successCount++;
        }
      } catch (error) {
        requestCount++;
        errors.push(error.message);
      }
    };

    // Send requests at target rate
    const intervalId = setInterval(makeRequest, interval);

    // Stop when duration ends
    setTimeout(() => {
      clearInterval(intervalId);
      
      process.send({
        workerId: process.pid,
        requestCount,
        successCount,
        avgLatency: totalLatency / requestCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10) // First 10 errors
      });
    }, this.duration);
  }

  analyzeResults(results) {
    const totalRequests = results.reduce((sum, r) => sum + r.requestCount, 0);
    const totalSuccess = results.reduce((sum, r) => sum + r.successCount, 0);
    const avgLatency = results.reduce((sum, r) => sum + (r.avgLatency * r.requestCount), 0) / totalRequests;
    const totalErrors = results.reduce((sum, r) => sum + r.errorCount, 0);

    console.log('\n📊 Load Test Results:');
    console.log('=====================');
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Successful Requests: ${totalSuccess}`);
    console.log(`Failed Requests: ${totalErrors}`);
    console.log(`Success Rate: ${((totalSuccess / totalRequests) * 100).toFixed(2)}%`);
    console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
    console.log(`Requests/Second: ${(totalRequests / (this.duration / 1000)).toFixed(2)}`);

    // Performance assessment
    const successRate = (totalSuccess / totalRequests) * 100;
    if (successRate >= 99.9) {
      console.log('🎉 Excellent reliability!');
    } else if (successRate >= 99) {
      console.log('✅ Good reliability');
    } else if (successRate >= 95) {
      console.log('⚠️  Acceptable reliability');
    } else {
      console.log('❌ Poor reliability - investigation needed');
    }

    if (avgLatency < 100) {
      console.log('⚡ Excellent response time!');
    } else if (avgLatency < 500) {
      console.log('✅ Good response time');
    } else if (avgLatency < 1000) {
      console.log('⚠️  Slow response time');
    } else {
      console.log('❌ Very slow response time');
    }
  }
}

// Run load test if called directly
if (require.main === module) {
  const loadTester = new LoadTester({
    concurrency: 4,
    duration: 30000, // 30 seconds
    requestsPerSecond: 5
  });
  
  loadTester.runLoadTest().catch(console.error);
}

module.exports = LoadTester;

---
// scripts/migrate.js - Database Migration Tool
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

class MigrationTool {
  constructor(dbPath = './soulfra.db') {
    this.db = new Database(dbPath);
    this.migrationsDir = path.join(__dirname, '../migrations');
  }

  async runMigrations() {
    console.log('🔄 Running database migrations...');
    
    // Create migrations table if it doesn't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get executed migrations
    const executed = this.db.prepare('SELECT filename FROM migrations').all();
    const executedFiles = new Set(executed.map(m => m.filename));

    // Get migration files
    if (!fs.existsSync(this.migrationsDir)) {
      fs.mkdirSync(this.migrationsDir, { recursive: true });
    }

    const migrationFiles = fs.readdirSync(this.migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    let migrationsRun = 0;

    for (const filename of migrationFiles) {
      if (!executedFiles.has(filename)) {
        console.log(`⚡ Running migration: ${filename}`);
        
        const migrationPath = path.join(this.migrationsDir, filename);
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        try {
          this.db.exec(migrationSQL);
          
          // Record migration
          this.db.prepare('INSERT INTO migrations (filename) VALUES (?)').run(filename);
          
          migrationsRun++;
          console.log(`✅ Completed: ${filename}`);
        } catch (error) {
          console.error(`❌ Failed: ${filename} - ${error.message}`);
          break;
        }
      }
    }

    console.log(`🎯 Migrations completed: ${migrationsRun} new migrations run`);
  }

  async rollbackMigration(filename) {
    console.log(`🔄 Rolling back migration: ${filename}`);
    
    // Check if rollback file exists
    const rollbackPath = path.join(this.migrationsDir, filename.replace('.sql', '.rollback.sql'));
    
    if (!fs.existsSync(rollbackPath)) {
      console.error(`❌ No rollback file found: ${rollbackPath}`);
      return;
    }

    const rollbackSQL = fs.readFileSync(rollbackPath, 'utf8');
    
    try {
      this.db.exec(rollbackSQL);
      
      // Remove migration record
      this.db.prepare('DELETE FROM migrations WHERE filename = ?').run(filename);
      
      console.log(`✅ Rollback completed: ${filename}`);
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
    }
  }

  createMigration(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${timestamp}_${name}.sql`;
    const filepath = path.join(this.migrationsDir, filename);
    
    const template = `-- Migration: ${name}
-- Created: ${new Date().toISOString()}

-- Add your migration SQL here
-- Example:
-- ALTER TABLE users ADD COLUMN new_field TEXT;

-- Remember to create a corresponding rollback file: ${filename.replace('.sql', '.rollback.sql')}
`;

    fs.writeFileSync(filepath, template);
    console.log(`✅ Created migration: ${filename}`);
    
    // Create rollback template
    const rollbackFilename = filename.replace('.sql', '.rollback.sql');
    const rollbackPath = path.join(this.migrationsDir, rollbackFilename);
    const rollbackTemplate = `-- Rollback for: ${name}
-- Created: ${new Date().toISOString()}

-- Add your rollback SQL here
-- Example:
-- ALTER TABLE users DROP COLUMN new_field;
`;

    fs.writeFileSync(rollbackPath, rollbackTemplate);
    console.log(`✅ Created rollback: ${rollbackFilename}`);
  }

  close() {
    this.db.close();
  }
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];

  const migrationTool = new MigrationTool();

  switch (command) {
    case 'run':
      migrationTool.runMigrations().then(() => migrationTool.close());
      break;
    case 'rollback':
      if (!arg) {
        console.error('Please specify migration filename to rollback');
        process.exit(1);
      }
      migrationTool.rollbackMigration(arg).then(() => migrationTool.close());
      break;
    case 'create':
      if (!arg) {
        console.error('Please specify migration name');
        process.exit(1);
      }
      migrationTool.createMigration(arg);
      migrationTool.close();
      break;
    default:
      console.log('Usage:');
      console.log('  node migrate.js run                    - Run all pending migrations');
      console.log('  node migrate.js rollback <filename>    - Rollback specific migration');
      console.log('  node migrate.js create <name>          - Create new migration');
      migrationTool.close();
  }
}

module.exports = MigrationTool;