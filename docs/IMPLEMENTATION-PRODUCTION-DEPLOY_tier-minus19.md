# 🚀 Production Deployment Guide

**Document Version:** 1.0  
**Environment:** AWS + Vercel + Cloudflare  
**Goal:** Deploy FunWork + Soulfra ecosystem to production  

---

## 🏗️ Infrastructure Overview

```
┌─────────────────────────────────────────────────────┐
│                   CLOUDFLARE                         │
│         (DDoS Protection, CDN, WAF)                  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│                    VERCEL                            │
│         (Frontend Apps, Edge Functions)              │
├──────────────────────────────────────────────────────┤
│  • funwork.com (Main App)                            │
│  • app.soulfra.com (Platform Dashboard)              │
│  • play.funwork.com (Game CDN)                       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────┐
│                  AWS REGION                          │
├─────────────┬────────────────┬──────────────────────┤
│     ALB     │   ECS FARGATE  │    RDS AURORA        │
│  (Load      │   (Services)   │   (PostgreSQL)       │
│  Balancer)  │                │                      │
├─────────────┼────────────────┼──────────────────────┤
│             │ • Tier APIs     │ • Multi-AZ           │
│             │ • Cal Proxies  │ • Read Replicas      │
│             │ • Game Engines │ • Auto Scaling       │
└─────────────┴────────────────┴──────────────────────┘
```

## 📋 Pre-Deployment Checklist

### Environment Variables
```bash
# .env.production
NODE_ENV=production

# Database
DATABASE_URL=postgresql://user:pass@aurora-cluster.region.rds.amazonaws.com:5432/funwork_prod

# Redis
REDIS_URL=redis://elasticache-cluster.region.cache.amazonaws.com:6379

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# AWS
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1

# Cloudflare
CLOUDFLARE_API_TOKEN=xxx

# Monitoring
SENTRY_DSN=https://xxx@sentry.io/xxx
LOGROCKET_APP_ID=xxx

# Cal Isolation Keys
CAL_MASTER_KEY=xxx
CAL_PROXY_KEY_1=xxx
CAL_PROXY_KEY_2=xxx
CAL_PROXY_KEY_3=xxx
```

### Security Audit
```bash
# Run security checks
npm audit
npm run security-scan

# Check for exposed secrets
trufflehog filesystem . --json

# Verify HTTPS everywhere
grep -r "http://" --exclude-dir=node_modules .
```

## 🚀 Deployment Steps

### Step 1: Database Setup

```bash
# Create Aurora Serverless v2 cluster
aws rds create-db-cluster \
  --db-cluster-identifier funwork-prod \
  --engine aurora-postgresql \
  --engine-version 14.6 \
  --master-username postgres \
  --master-user-password $DB_PASSWORD \
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=4

# Run migrations
DATABASE_URL=$PROD_DB_URL npm run migrate:prod

# Seed initial data
DATABASE_URL=$PROD_DB_URL npm run seed:prod
```

### Step 2: Container Registry

```bash
# Build and push Docker images
docker build -t funwork-api -f Dockerfile.api .
docker build -t cal-proxy -f Dockerfile.cal-proxy .
docker build -t game-engine -f Dockerfile.game-engine .

# Tag for ECR
docker tag funwork-api:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/funwork-api:latest
docker tag cal-proxy:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/cal-proxy:latest
docker tag game-engine:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/game-engine:latest

# Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/funwork-api:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/cal-proxy:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/game-engine:latest
```

### Step 3: ECS Task Definitions

```json
// task-definition-api.json
{
  "family": "funwork-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/funwork-api:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3000"}
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT}:secret:funwork/db-url"
        },
        {
          "name": "STRIPE_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:${AWS_REGION}:${AWS_ACCOUNT}:secret:funwork/stripe-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/funwork-api",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Step 4: Deploy Services

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name funwork-prod

# Register task definitions
aws ecs register-task-definition --cli-input-json file://task-definition-api.json
aws ecs register-task-definition --cli-input-json file://task-definition-cal-proxy.json
aws ecs register-task-definition --cli-input-json file://task-definition-game-engine.json

# Create services
aws ecs create-service \
  --cluster funwork-prod \
  --service-name funwork-api \
  --task-definition funwork-api:1 \
  --desired-count 3 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Step 5: Cal Proxy Deployment

```javascript
// cal-proxy-isolation.js
// Deploy 3 separate Cal proxy instances with different permissions

const CAL_PROXY_CONFIGS = {
  proxy1: {
    name: 'cal-proxy-level-1',
    permissions: ['read_public', 'suggest_basic'],
    rateLimit: '100/hour',
    cpu: '512',
    memory: '1024'
  },
  proxy2: {
    name: 'cal-proxy-level-2',
    permissions: ['read_public', 'read_user', 'suggest_advanced'],
    rateLimit: '1000/hour',
    cpu: '1024',
    memory: '2048'
  },
  proxy3: {
    name: 'cal-proxy-level-3',
    permissions: ['read_all', 'write_limited', 'suggest_premium'],
    rateLimit: '10000/hour',
    cpu: '2048',
    memory: '4096'
  }
};

// Deploy each proxy to separate subnets for isolation
Object.entries(CAL_PROXY_CONFIGS).forEach(([level, config]) => {
  deployCalProxy(config);
});
```

### Step 6: Frontend Deployment (Vercel)

```bash
# Deploy main FunWork app
cd frontend/funwork
vercel --prod

# Deploy Soulfra dashboard
cd ../soulfra-dashboard
vercel --prod

# Configure domains
vercel domains add funwork.com
vercel domains add app.soulfra.com
```

### Step 7: Configure Load Balancer

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name funwork-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target groups
aws elbv2 create-target-group \
  --name funwork-api-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip

# Register targets (ECS tasks)
# This happens automatically with ECS service
```

### Step 8: Cloudflare Configuration

```javascript
// cloudflare-config.js
const cloudflare = require('cloudflare');

const cf = new cloudflare({
  token: process.env.CLOUDFLARE_API_TOKEN
});

// Configure security rules
await cf.zones.firewallRules.create(zoneId, {
  filter: {
    expression: '(http.request.uri.path contains "/api/admin")',
    description: 'Block admin endpoints'
  },
  action: 'block'
});

// Rate limiting
await cf.zones.rateLimits.create(zoneId, {
  threshold: 100,
  period: 60,
  match: {
    request: {
      url: '*/api/*'
    }
  },
  action: {
    mode: 'challenge'
  }
});

// Cache rules
await cf.zones.pagerules.create(zoneId, {
  targets: [{
    target: 'url',
    constraint: {
      operator: 'matches',
      value: '*.funwork.com/static/*'
    }
  }],
  actions: [{
    id: 'cache_level',
    value: 'cache_everything'
  }]
});
```

### Step 9: Monitoring Setup

```javascript
// monitoring-setup.js
const Sentry = require('@sentry/node');
const StatsD = require('node-statsd');

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  beforeSend(event) {
    // Strip sensitive data
    delete event.request?.cookies;
    delete event.request?.headers?.authorization;
    return event;
  }
});

// Initialize StatsD for metrics
const metrics = new StatsD({
  host: 'datadog-agent.monitoring.svc.cluster.local',
  port: 8125,
  prefix: 'funwork.'
});

// Track key metrics
metrics.increment('api.request');
metrics.timing('payment.processing', processingTime);
metrics.gauge('active.players', activePlayerCount);
```

### Step 10: Auto-Scaling Configuration

```yaml
# autoscaling.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: funwork-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: funwork-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: api_requests_per_second
      target:
        type: AverageValue
        averageValue: "1000"
```

## 🔐 Security Hardening

### API Security
```javascript
// security-middleware.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    }
  }
}));

// Rate limiting by tier
const rateLimiters = {
  free: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Upgrade to Premium for higher limits'
  }),
  premium: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
  }),
  enterprise: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000
  })
};
```

### Database Security
```sql
-- Create read-only user for analytics
CREATE USER analytics_readonly WITH PASSWORD 'xxx';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;

-- Row-level security for multi-tenancy
ALTER TABLE solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY solutions_isolation ON solutions
  FOR ALL
  USING (player_id = current_setting('app.current_player_id')::uuid);
```

## 📊 Production Monitoring

### Health Checks
```javascript
// health-check.js
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {}
  };
  
  // Database check
  try {
    await db.query('SELECT 1');
    health.checks.database = 'ok';
  } catch (error) {
    health.checks.database = 'error';
    health.status = 'unhealthy';
  }
  
  // Redis check
  try {
    await redis.ping();
    health.checks.redis = 'ok';
  } catch (error) {
    health.checks.redis = 'error';
    health.status = 'unhealthy';
  }
  
  // Stripe check
  try {
    await stripe.balance.retrieve();
    health.checks.stripe = 'ok';
  } catch (error) {
    health.checks.stripe = 'error';
  }
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### Alerts Configuration
```yaml
# alerts.yaml
alerts:
  - name: high_error_rate
    condition: error_rate > 0.05
    duration: 5m
    notify:
      - pagerduty
      - slack
    
  - name: low_completion_rate  
    condition: mission_completion_rate < 0.7
    duration: 15m
    notify:
      - slack
      
  - name: payment_failures
    condition: payment_failure_rate > 0.02
    duration: 5m
    severity: critical
    notify:
      - pagerduty
      - email
```

## 🚦 Launch Sequence

### Soft Launch (Day 1)
```bash
# 10% traffic to new infrastructure
aws elbv2 modify-rule \
  --rule-arn $RULE_ARN \
  --conditions Field=path-pattern,Values=/* \
  --actions Type=forward,ForwardConfig='{
    "TargetGroups":[
      {"TargetGroupArn":"$OLD_TG_ARN","Weight":90},
      {"TargetGroupArn":"$NEW_TG_ARN","Weight":10}
    ]
  }'
```

### Gradual Rollout (Days 2-7)
```bash
# Increase traffic gradually
for weight in 25 50 75 90 100; do
  echo "Shifting $weight% traffic to new infrastructure"
  aws elbv2 modify-rule \
    --rule-arn $RULE_ARN \
    --actions Type=forward,ForwardConfig="{
      \"TargetGroups\":[
        {\"TargetGroupArn\":\"$OLD_TG_ARN\",\"Weight\":$((100-weight))},
        {\"TargetGroupArn\":\"$NEW_TG_ARN\",\"Weight\":$weight}
      ]
    }"
  
  # Monitor for 24 hours
  sleep 86400
  
  # Check metrics
  ./check-metrics.sh || rollback
done
```

### Full Launch (Day 8)
```bash
# Final cutover
./production-cutover.sh

# Update DNS
./update-dns-records.sh

# Verify everything
./verify-production.sh
```

## 🔄 Rollback Plan

```bash
#!/bin/bash
# rollback.sh

echo "🚨 Initiating rollback..."

# Revert traffic to old infrastructure
aws elbv2 modify-rule \
  --rule-arn $RULE_ARN \
  --actions Type=forward,TargetGroupArn=$OLD_TG_ARN

# Scale down new services
aws ecs update-service \
  --cluster funwork-prod \
  --service funwork-api \
  --desired-count 0

# Restore database if needed
aws rds restore-db-cluster-to-point-in-time \
  --source-db-cluster-identifier funwork-prod \
  --target-db-cluster-identifier funwork-prod-restored \
  --restore-to-time $ROLLBACK_TIME

echo "✅ Rollback complete"
```

## ✅ Post-Deployment Checklist

- [ ] All health checks passing
- [ ] Monitoring dashboards active
- [ ] Alerts configured and tested
- [ ] Backup procedures verified
- [ ] Load testing completed
- [ ] Security scan passed
- [ ] Documentation updated
- [ ] Team trained on procedures

---

**Status:** Ready for production deployment
**Next Step:** Execute soft launch with 10% traffic