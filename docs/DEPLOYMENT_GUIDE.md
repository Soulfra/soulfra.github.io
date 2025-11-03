# SOULFRA PLATFORM DEPLOYMENT GUIDE

## Quick Start

### Local Development
```bash
# Start all services
./deploy.sh start

# Check status
./deploy.sh status

# View logs
./deploy.sh logs enterprise_platform
```

### Docker Deployment
```bash
# Build and run with Docker
docker build -t soulfra-platform .
docker run -d -p 3003:3003 --name soulfra soulfra-platform

# Or use docker-compose
docker-compose up -d
```

## Deployment Across 130 Domains

### 1. Prepare Infrastructure

Each domain needs:
- Server with Docker installed
- SSL certificates
- Domain DNS pointing to server

### 2. Multi-Domain Deployment Script

```bash
#!/bin/bash
# deploy-multi-domain.sh

DOMAINS=(
    "soulfra.com"
    "soulfra.io"
    "soulfra.app"
    # ... add all 130 domains
)

for DOMAIN in "${DOMAINS[@]}"; do
    echo "Deploying to $DOMAIN..."
    
    # SSH to server and deploy
    ssh root@$DOMAIN << 'EOF'
        # Pull latest code
        git clone https://github.com/soulfra/platform.git /opt/soulfra
        cd /opt/soulfra
        
        # Build and run
        docker build -t soulfra-platform .
        docker run -d \
            -p 80:3003 \
            -p 443:3003 \
            --name soulfra \
            --restart unless-stopped \
            -e DOMAIN=$DOMAIN \
            soulfra-platform
EOF
done
```

### 3. Kubernetes Deployment

For scale across 130 domains, use Kubernetes:

```yaml
# soulfra-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: soulfra-platform
spec:
  replicas: 10
  selector:
    matchLabels:
      app: soulfra
  template:
    metadata:
      labels:
        app: soulfra
    spec:
      containers:
      - name: platform
        image: soulfra/platform:latest
        ports:
        - containerPort: 3003
        env:
        - name: SOULFRA_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: soulfra-service
spec:
  selector:
    app: soulfra
  ports:
  - port: 80
    targetPort: 3003
  type: LoadBalancer
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: soulfra-ingress
spec:
  rules:
  - host: "*.soulfra.com"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: soulfra-service
            port:
              number: 80
```

### 4. CDN Configuration

Use Cloudflare or AWS CloudFront:

```javascript
// cloudflare-worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Route to nearest platform instance
  const origin = getClosestOrigin(request.cf.country)
  
  // Forward request
  const response = await fetch(origin + url.pathname, request)
  
  // Add caching headers
  const newResponse = new Response(response.body, response)
  newResponse.headers.set('Cache-Control', 'public, max-age=300')
  
  return newResponse
}

function getClosestOrigin(country) {
  const origins = {
    'US': 'https://us.soulfra.com',
    'EU': 'https://eu.soulfra.com',
    'AS': 'https://asia.soulfra.com',
    // ... more regions
  }
  return origins[getRegion(country)] || origins['US']
}
```

### 5. Monitoring Across Domains

```yaml
# prometheus-federation.yml
global:
  scrape_interval: 15s
  external_labels:
    monitor: 'soulfra-global'

scrape_configs:
  - job_name: 'federate'
    scrape_interval: 15s
    honor_labels: true
    metrics_path: '/federate'
    params:
      'match[]':
        - '{job=~"soulfra-.*"}'
    static_configs:
      - targets:
        - 'us.soulfra.com:9090'
        - 'eu.soulfra.com:9090'
        - 'asia.soulfra.com:9090'
```

## SSL Certificate Management

### Using Let's Encrypt with Certbot
```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificates for all domains
for DOMAIN in "${DOMAINS[@]}"; do
    certbot certonly --nginx -d $DOMAIN -d www.$DOMAIN
done

# Auto-renewal
echo "0 0 * * * root certbot renew --quiet" > /etc/cron.d/certbot
```

## Performance Optimization

### 1. Enable Gzip Compression
```nginx
# nginx.conf
gzip on;
gzip_types text/plain application/json text/css application/javascript;
gzip_min_length 1000;
```

### 2. Redis Caching
```python
# Add to platform
import redis

cache = redis.Redis(host='localhost', port=6379, db=0)

def cached_api_response(key, func, ttl=300):
    result = cache.get(key)
    if result is None:
        result = func()
        cache.setex(key, ttl, json.dumps(result))
    else:
        result = json.loads(result)
    return result
```

### 3. Database Optimization
```sql
-- Add indexes for reflection queries
CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_reflections_timestamp ON reflections(timestamp);
CREATE INDEX idx_game_data_score ON game_data(score);
```

## Security Hardening

### 1. Environment Variables
```bash
# .env file (DO NOT COMMIT)
SOULFRA_SECRET_KEY=your-secret-key-here
ANTHROPIC_API_KEY=your-api-key-here
DATABASE_URL=postgresql://user:pass@localhost/soulfra
REDIS_URL=redis://localhost:6379
```

### 2. Rate Limiting
```python
from functools import wraps
import time

rate_limit_storage = {}

def rate_limit(max_calls=100, window=60):
    def decorator(func):
        @wraps(func)
        def wrapper(self):
            ip = self.client_address[0]
            now = time.time()
            
            if ip not in rate_limit_storage:
                rate_limit_storage[ip] = []
            
            # Clean old entries
            rate_limit_storage[ip] = [
                t for t in rate_limit_storage[ip] 
                if now - t < window
            ]
            
            if len(rate_limit_storage[ip]) >= max_calls:
                self.send_error(429, "Rate limit exceeded")
                return
                
            rate_limit_storage[ip].append(now)
            return func(self)
        return wrapper
    return decorator
```

### 3. Input Validation
```python
def validate_reflection(data):
    if not isinstance(data.get('text'), str):
        raise ValueError("Text must be string")
    if len(data['text']) > 5000:
        raise ValueError("Text too long")
    if not isinstance(data.get('score'), (int, float)):
        raise ValueError("Score must be number")
    return True
```

## Backup Strategy

### Automated Backups
```bash
#!/bin/bash
# backup.sh

# Backup data and logs
tar -czf /backups/soulfra-$(date +%Y%m%d-%H%M%S).tar.gz \
    /app/logs \
    /app/data \
    /app/*.json

# Upload to S3
aws s3 cp /backups/*.tar.gz s3://soulfra-backups/

# Keep last 30 days
find /backups -name "*.tar.gz" -mtime +30 -delete
```

### Database Backups
```bash
# PostgreSQL backup
pg_dump soulfra > /backups/soulfra-db-$(date +%Y%m%d).sql

# MongoDB backup
mongodump --db soulfra --out /backups/mongo-$(date +%Y%m%d)
```

## Disaster Recovery

### Failover Configuration
```yaml
# haproxy.cfg for load balancing
global
    maxconn 4096

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend soulfra_frontend
    bind *:80
    default_backend soulfra_backend

backend soulfra_backend
    balance roundrobin
    option httpchk GET /api/status
    server platform1 10.0.0.1:3003 check
    server platform2 10.0.0.2:3003 check
    server platform3 10.0.0.3:3003 check backup
```

## Deployment Checklist

- [ ] SSL certificates configured
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Redis cache configured
- [ ] Monitoring dashboards setup
- [ ] Backup scripts scheduled
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Load balancer health checks
- [ ] Error tracking (Sentry) setup
- [ ] Log aggregation configured
- [ ] CDN cache rules set
- [ ] DNS records updated
- [ ] Firewall rules configured
- [ ] Auto-scaling policies set

## Support

For deployment assistance:
- Documentation: https://docs.soulfra.com
- Discord: https://discord.gg/soulfra
- Email: devops@soulfra.com