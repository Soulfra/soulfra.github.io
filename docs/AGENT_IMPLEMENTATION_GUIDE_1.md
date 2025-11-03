# 🤖 Agent Implementation Guide

## For AI Agents: Complete Autonomous Implementation

This guide enables AI agents to build the entire Soulfra AI Platform without human intervention.

## Phase 1: Initial Setup (Day 1)

### Task 1.1: Repository Initialization
```bash
# Create project structure
mkdir -p soulfra-ai-platform/{backend,frontend,deployment,scripts,tests,docs}
cd soulfra-ai-platform

# Initialize git
git init
echo "# Soulfra AI Platform" > README.md
git add README.md
git commit -m "Initial commit"

# Create .gitignore
cat > .gitignore << EOF
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
coverage/
.vscode/
.idea/
EOF

git add .gitignore
git commit -m "Add .gitignore"
```

### Task 1.2: Backend Structure Creation
```bash
# Create backend structure
cd backend
mkdir -p core/{domingo-orchestrator,cal-workers,trinity-arbitrator,shared}
mkdir -p economy/{bounty-system,reputation-bank,betting-engine,ledger}
mkdir -p platform/{user-management,ai-management,subscription,voting}
mkdir -p infrastructure/{database,queue,websocket,monitoring}

# Initialize each service
for service in */*/; do
  cd "$service"
  npm init -y
  echo "# $(basename $service)" > README.md
  cd -
done
```

### Task 1.3: Frontend Structure Creation
```bash
# Create frontend apps
cd ../frontend

# Main web app
npx create-react-app web-app --template typescript
cd web-app
mkdir -p src/{components,pages,hooks,services,store,utils,types}

# Mobile app
cd ..
npx react-native init MobileApp --template react-native-template-typescript
mv MobileApp mobile-app

# Admin dashboard
npx create-react-app admin-dashboard --template typescript
```

## Phase 2: Core Services Implementation (Day 2-3)

### Task 2.1: Implement Shared Utilities
```typescript
// backend/core/shared/src/base-service.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger } from 'winston';
import { Pool } from 'pg';
import Redis from 'ioredis';

export interface ServiceConfig {
  name: string;
  port: number;
  database: {
    connectionString: string;
  };
  redis: {
    host: string;
    port: number;
  };
}

export abstract class BaseService {
  protected app: Application;
  protected logger: ReturnType<typeof createLogger>;
  protected db: Pool;
  protected redis: Redis;
  
  constructor(protected config: ServiceConfig) {
    this.app = express();
    this.setupLogger();
    this.setupDatabase();
    this.setupRedis();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }
  
  private setupLogger(): void {
    this.logger = createLogger({
      level: 'info',
      defaultMeta: { service: this.config.name },
      transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({ format: winston.format.simple() })
      ]
    });
  }
  
  private setupDatabase(): void {
    this.db = new Pool({
      connectionString: this.config.database.connectionString
    });
  }
  
  private setupRedis(): void {
    this.redis = new Redis({
      host: this.config.redis.host,
      port: this.config.redis.port
    });
  }
  
  private setupMiddleware(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }
  
  private setupErrorHandling(): void {
    this.app.use((err: Error, req: any, res: any, next: any) => {
      this.logger.error(err.stack);
      res.status(500).json({ error: 'Internal server error' });
    });
  }
  
  protected abstract setupRoutes(): void;
  
  public async start(): Promise<void> {
    try {
      await this.db.connect();
      await this.redis.connect();
      
      this.app.listen(this.config.port, () => {
        this.logger.info(`${this.config.name} listening on port ${this.config.port}`);
      });
    } catch (error) {
      this.logger.error('Failed to start service', error);
      process.exit(1);
    }
  }
}
```

### Task 2.2: Implement Domingo Orchestrator
```typescript
// backend/core/domingo-orchestrator/src/index.ts
import { BaseService } from '@soulfra/shared';
import { BountyController } from './controllers/bounty.controller';
import { WorkerController } from './controllers/worker.controller';

class DomingoOrchestrator extends BaseService {
  private bountyController: BountyController;
  private workerController: WorkerController;
  
  constructor() {
    super({
      name: 'domingo-orchestrator',
      port: process.env.PORT || 8001,
      database: {
        connectionString: process.env.DATABASE_URL
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });
    
    this.bountyController = new BountyController(this.db, this.redis);
    this.workerController = new WorkerController(this.db, this.redis);
  }
  
  protected setupRoutes(): void {
    // Bounty routes
    this.app.post('/api/bounties', this.bountyController.create);
    this.app.get('/api/bounties', this.bountyController.list);
    this.app.post('/api/bounties/:id/assign', this.bountyController.assign);
    this.app.post('/api/bounties/:id/complete', this.bountyController.complete);
    
    // Worker management
    this.app.post('/api/workers/register', this.workerController.register);
    this.app.get('/api/workers', this.workerController.list);
    this.app.get('/api/workers/:id/stats', this.workerController.getStats);
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'domingo-orchestrator' });
    });
  }
}

// Start service
const orchestrator = new DomingoOrchestrator();
orchestrator.start();
```

## Phase 3: Database Implementation (Day 4)

### Task 3.1: Create Migration System
```typescript
// backend/infrastructure/database/src/migrator.ts
import { Pool } from 'pg';
import fs from 'fs/promises';
import path from 'path';

export class DatabaseMigrator {
  private pool: Pool;
  
  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }
  
  async migrate(): Promise<void> {
    // Create migrations table
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    // Execute pending migrations
    for (const file of sqlFiles) {
      const { rows } = await this.pool.query(
        'SELECT id FROM migrations WHERE filename = $1',
        [file]
      );
      
      if (rows.length === 0) {
        console.log(`Running migration: ${file}`);
        const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
        
        await this.pool.query('BEGIN');
        try {
          await this.pool.query(sql);
          await this.pool.query(
            'INSERT INTO migrations (filename) VALUES ($1)',
            [file]
          );
          await this.pool.query('COMMIT');
          console.log(`✓ Migration ${file} completed`);
        } catch (error) {
          await this.pool.query('ROLLBACK');
          throw error;
        }
      }
    }
    
    console.log('All migrations completed');
  }
}
```

### Task 3.2: Create Database Migrations
```sql
-- backend/infrastructure/database/migrations/001_initial_schema.sql
-- Users and authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  credits INTEGER DEFAULT 1000 CHECK (credits >= 0),
  subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'premium', 'pro')),
  reputation DECIMAL(3,2) DEFAULT 1.0 CHECK (reputation BETWEEN 0 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Agents
CREATE TABLE ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('cal', 'domingo', 'trinity', 'custom')),
  level INTEGER DEFAULT 1 CHECK (level > 0),
  experience INTEGER DEFAULT 0 CHECK (experience >= 0),
  performance_rating DECIMAL(3,2) DEFAULT 3.0 CHECK (performance_rating BETWEEN 1 AND 5),
  total_earned INTEGER DEFAULT 0 CHECK (total_earned >= 0),
  win_rate DECIMAL(3,2) DEFAULT 0.5 CHECK (win_rate BETWEEN 0 AND 1),
  personality_traits JSONB DEFAULT '{"aggression": 0.5, "creativity": 0.5, "efficiency": 0.5, "reliability": 0.5}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_id, name)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription ON users(subscription_tier);
CREATE INDEX idx_agents_owner ON ai_agents(owner_id);
CREATE INDEX idx_agents_type ON ai_agents(type);
CREATE INDEX idx_agents_performance ON ai_agents(performance_rating DESC);
```

## Phase 4: Frontend Implementation (Day 5-6)

### Task 4.1: Setup React App Structure
```typescript
// frontend/web-app/src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import './styles/globals.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>
);
```

### Task 4.2: Create API Service Layer
```typescript
// frontend/web-app/src/services/api.ts
import axios, { AxiosInstance } from 'axios';

class ApiService {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Request interceptor for auth
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
  
  // User endpoints
  async signup(data: SignupData): Promise<User> {
    const response = await this.client.post('/users/signup', data);
    return response.data;
  }
  
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.client.post('/users/login', data);
    localStorage.setItem('authToken', response.data.token);
    return response.data;
  }
  
  // AI Agent endpoints
  async getMyAgents(): Promise<AIAgent[]> {
    const response = await this.client.get('/ai/agents');
    return response.data;
  }
  
  async adoptAgent(data: AdoptAgentData): Promise<AIAgent> {
    const response = await this.client.post('/ai/adopt', data);
    return response.data;
  }
  
  async trainAgent(agentId: string, data: TrainData): Promise<TrainResult> {
    const response = await this.client.post(`/ai/${agentId}/train`, data);
    return response.data;
  }
  
  // Betting endpoints
  async getBettingPools(): Promise<BettingPool[]> {
    const response = await this.client.get('/betting/pools');
    return response.data;
  }
  
  async placeBet(data: PlaceBetData): Promise<Bet> {
    const response = await this.client.post('/betting/place', data);
    return response.data;
  }
}

export const api = new ApiService();
```

## Phase 5: Testing Implementation (Day 7)

### Task 5.1: Setup Testing Framework
```json
// backend/package.json (test configuration)
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src", "<rootDir>/test"],
    "testMatch": ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
    "transform": {
      "^.+\\.ts$": "ts-jest"
    },
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.d.ts",
      "!src/**/index.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### Task 5.2: Write Comprehensive Tests
```typescript
// backend/core/domingo-orchestrator/test/bounty.service.test.ts
import { BountyService } from '../src/services/bounty.service';
import { Pool } from 'pg';
import Redis from 'ioredis';

describe('BountyService', () => {
  let service: BountyService;
  let mockDb: jest.Mocked<Pool>;
  let mockRedis: jest.Mocked<Redis>;
  
  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn()
    } as any;
    
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn()
    } as any;
    
    service = new BountyService(mockDb, mockRedis);
  });
  
  describe('createBounty', () => {
    it('should create a bounty with valid data', async () => {
      const bountyData = {
        title: 'Test Bounty',
        description: 'Test description',
        reward: 500,
        type: 'development'
      };
      
      const mockResult = {
        rows: [{
          id: 'uuid-123',
          ...bountyData,
          status: 'open',
          created_at: new Date()
        }]
      };
      
      mockDb.query.mockResolvedValueOnce(mockResult);
      
      const result = await service.createBounty(bountyData);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bounties'),
        expect.arrayContaining([
          bountyData.title,
          bountyData.description,
          bountyData.reward,
          bountyData.type
        ])
      );
      
      expect(result).toEqual(mockResult.rows[0]);
    });
    
    it('should reject bounty with invalid reward', async () => {
      const bountyData = {
        title: 'Test Bounty',
        reward: -100 // Invalid negative reward
      };
      
      await expect(service.createBounty(bountyData))
        .rejects.toThrow('Invalid reward amount');
    });
  });
});
```

## Phase 6: Deployment Setup (Day 8)

### Task 6.1: Create Docker Configuration
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY lerna.json ./
COPY packages/*/package*.json ./packages/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build all packages
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 8000

CMD ["node", "dist/index.js"]
```

### Task 6.2: Kubernetes Configuration
```yaml
# deployment/kubernetes/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - namespace.yaml
  - configmap.yaml
  - secret.yaml
  - postgres.yaml
  - redis.yaml
  - backend.yaml
  - frontend.yaml
  - ingress.yaml

configMapGenerator:
  - name: app-config
    literals:
      - NODE_ENV=production
      - LOG_LEVEL=info
      - PORT=8000

secretGenerator:
  - name: app-secrets
    literals:
      - DATABASE_URL=postgresql://user:pass@postgres:5432/soulfra
      - JWT_SECRET=your-secret-here
      - REDIS_URL=redis://redis:6379

images:
  - name: soulfra/backend
    newTag: latest
  - name: soulfra/frontend
    newTag: latest
```

## Phase 7: CI/CD Pipeline (Day 9)

### Task 7.1: GitHub Actions Workflow
```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v3
      
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Kubernetes
        uses: azure/k8s-deploy@v4
        with:
          manifests: |
            deployment/kubernetes/production
          images: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
```

## Phase 8: Monitoring & Observability (Day 10)

### Task 8.1: Setup Monitoring Stack
```yaml
# deployment/monitoring/prometheus-stack.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
      volumes:
      - name: config
        configMap:
          name: prometheus-config
```

## Verification Checklist

Agents should verify each phase:

### ✅ Phase 1 Verification
```bash
# Check project structure
find . -type d -name "node_modules" -prune -o -type d -print | head -20

# Verify git repository
git status
git log --oneline | head -5
```

### ✅ Phase 2 Verification
```bash
# Test backend services
cd backend/core/domingo-orchestrator
npm test
npm run build
npm start &
curl http://localhost:8001/health
```

### ✅ Phase 3 Verification
```bash
# Test database migrations
cd backend/infrastructure/database
npm run migrate
psql -U postgres -d soulfra -c "SELECT * FROM migrations;"
```

### ✅ Phase 4 Verification
```bash
# Test frontend build
cd frontend/web-app
npm run build
npm test -- --watchAll=false
npm start &
curl http://localhost:3000
```

### ✅ Phase 5 Verification
```bash
# Run all tests
npm test -- --coverage
# Coverage should be >80%
```

### ✅ Phase 6 Verification
```bash
# Test Docker build
docker-compose build
docker-compose up -d
docker-compose ps
# All services should be running
```

### ✅ Phase 7 Verification
```bash
# Check CI/CD pipeline
git push origin main
# Check GitHub Actions tab - all jobs should pass
```

### ✅ Phase 8 Verification
```bash
# Check monitoring
kubectl port-forward svc/prometheus 9090:9090
curl http://localhost:9090/metrics
# Metrics should be visible
```

## Success Criteria

The implementation is complete when:

1. All services start without errors
2. All tests pass with >80% coverage
3. Docker containers build successfully
4. Kubernetes deployments are healthy
5. CI/CD pipeline runs green
6. Monitoring shows all services up
7. User can complete full flow:
   - Sign up
   - Adopt AI
   - Train AI
   - Place bet
   - See earnings

## Emergency Troubleshooting

If agents encounter issues:

1. **Database connection failed**
   ```bash
   # Check postgres is running
   docker ps | grep postgres
   # Check connection string
   echo $DATABASE_URL
   ```

2. **Port already in use**
   ```bash
   # Find and kill process
   lsof -i :8000
   kill -9 <PID>
   ```

3. **Module not found**
   ```bash
   # Clear and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Build failures**
   ```bash
   # Clean build
   npm run clean
   npm run build
   ```

This guide enables complete autonomous implementation by AI agents!