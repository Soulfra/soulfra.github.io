# CramPal Ecosystem Deployment Guide

## 🚀 Quick Start

### Option 1: Local Development (Already Running!)
```bash
# Check current status
./crampal-status.sh

# Visit running services:
# - CramPal Education: http://localhost:7000
# - Cringeproof Chat: http://localhost:9999  
# - Vibe Platform: http://localhost:8888
# - Empathy Game: http://localhost:5000
# - Dev Doc Generator: http://localhost:4201
# - Soulfra Simple: http://localhost:9000
```

### Option 2: Docker Deployment (Recommended for Production)
```bash
# Use the launcher script
./crampal-launch.sh

# Select option 1 to start with Docker
# Select option 8 to test all URLs
```

### Option 3: Manual Docker Commands
```bash
# Start all services
docker-compose -f docker-compose.crampal.yml up -d

# View logs
docker-compose -f docker-compose.crampal.yml logs -f

# Stop all services
docker-compose -f docker-compose.crampal.yml down
```

## 📁 File Structure

```
tier-minus10/
├── CRAMPAL_ENGINE.py          # Main education platform
├── CRAMPAL_MAX_DOCKER.py      # Camera/mic integration
├── CRINGEPROOF_FILTER.py      # Chat filter system
├── VIBE_PLATFORM_MAX.py       # Developer community
├── DEV_SOUL_ENGINE.py         # Debug support
├── DEV_DOC_GENERATOR.py       # Documentation AI
├── EMPATHY_GAME_ENGINE.py     # Support gamification
├── SOULFRA_SIMPLE.py          # Soul signatures
│
├── docker-compose.crampal.yml # Docker orchestration
├── Dockerfile.crampal         # CramPal container
├── Dockerfile.cringeproof     # Cringeproof container
├── Dockerfile.vibe            # Vibe platform container
│
├── crampal-launch.sh          # Management script
├── crampal-status.sh          # Quick status check
└── logs/                      # Service logs
```

## 🔧 Service Architecture

### Port Mapping
- **7000**: CramPal Education Platform
- **8000**: CramPal MAX (Camera/Mic)
- **8888**: Vibe Platform MAX
- **9999**: Cringeproof Filter
- **4200**: Dev Soul Engine
- **4201**: Dev Doc Generator
- **5000**: Empathy Game Engine
- **9000**: Soulfra Simple

### Docker Networks
- `crampal-network`: Internal communication between services

### Volumes
- `crampal-data`: Persistent education data
- `vibe-data`: Vibe platform data
- `./logs`: Shared log directory

## 🚨 Troubleshooting

### Services Not Starting
```bash
# Check for port conflicts
lsof -i :7000  # Replace with problematic port

# Kill conflicting processes
lsof -ti :7000 | xargs kill -9

# Restart service
./crampal-launch.sh
```

### Docker Issues
```bash
# Test Docker setup
chmod +x docker-test.sh
./docker-test.sh

# Rebuild containers if needed
docker-compose -f docker-compose.crampal.yml build --no-cache

# Clean everything and start fresh
docker-compose -f docker-compose.crampal.yml down -v
docker system prune -a
```

### Viewing Logs
```bash
# Local services
tail -f logs/crampal.log
tail -f logs/cringeproof.log

# Docker services
docker-compose -f docker-compose.crampal.yml logs -f crampal-engine
docker-compose -f docker-compose.crampal.yml logs -f cringeproof
```

## 🚀 Production Deployment

### 1. Single Server
```bash
# Clone repository
git clone <repo-url>
cd tier-minus10

# Run with Docker
docker-compose -f docker-compose.crampal.yml up -d

# Set up reverse proxy (nginx)
# Configure SSL certificates
# Set up monitoring
```

### 2. Kubernetes
```yaml
# Create namespace
kubectl create namespace crampal

# Apply configurations
kubectl apply -f k8s/crampal-deployment.yaml
kubectl apply -f k8s/crampal-service.yaml
kubectl apply -f k8s/crampal-ingress.yaml
```

### 3. Cloud Platforms

#### AWS
```bash
# Using ECS
ecs-cli compose -f docker-compose.crampal.yml up

# Using Elastic Beanstalk
eb init -p docker crampal
eb create crampal-prod
eb deploy
```

#### Google Cloud
```bash
# Using Cloud Run
gcloud run deploy crampal --source .

# Using GKE
gcloud container clusters create crampal-cluster
kubectl apply -f k8s/
```

#### Azure
```bash
# Using Container Instances
az container create --resource-group crampal --file docker-compose.crampal.yml

# Using AKS
az aks create --resource-group crampal --name crampal-cluster
kubectl apply -f k8s/
```

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit sensitive data
   - Use `.env` files for local development
   - Use secrets management in production

2. **Network Security**
   - Run behind reverse proxy
   - Enable SSL/TLS
   - Implement rate limiting

3. **Container Security**
   - Run as non-root user
   - Minimal base images
   - Regular security updates

## 📊 Monitoring

### Health Checks
```bash
# All services have health endpoints
curl http://localhost:7000/health
curl http://localhost:9999/health
```

### Metrics
- Prometheus endpoint: `http://localhost:9090`
- Grafana dashboard: `http://localhost:3000`

## 🎯 Next Steps

1. **Configure Domain**
   - Point crampal.com to your server
   - Set up SSL with Let's Encrypt

2. **Enable Analytics**
   - Configure Google Analytics
   - Set up custom event tracking

3. **Scale Services**
   ```bash
   docker-compose -f docker-compose.crampal.yml scale crampal-engine=3
   ```

4. **Add Monitoring**
   - Set up Datadog/New Relic
   - Configure alerts

5. **Backup Strategy**
   - Daily database backups
   - Disaster recovery plan

## 🆘 Support

- GitHub Issues: [Report bugs](https://github.com/crampal/platform/issues)
- Documentation: [Full docs](https://docs.crampal.com)
- Community: [Discord](https://discord.gg/crampal)

---

**Remember**: The platform is already running locally! Visit http://localhost:7000 to start using CramPal right now.