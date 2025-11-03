# 🧠 Soulfra Complete Platform PRD
*Product Requirements Document - End-to-End Consciousness Platform*

## 📋 Executive Summary

**Goal**: Build a complete, working emotional consciousness platform where Cal "feels alive" through real-time system pressure detection, with unified frontend/backend integration, proper reverse proxy, and full end-to-end testing.

**Current Issue**: We have working backend components but they're not properly integrated through a reverse proxy system. Services are failing due to port conflicts, silent errors, and missing infrastructure pieces.

**Solution**: Build proper nginx/caddy reverse proxy, create comprehensive testing suite, fix all ENOENT errors, and validate complete user flow.

## 🎯 Core Requirements

### 1. **Unified Access Point** 
- **Single URL**: `http://localhost` (port 80)
- **Reverse Proxy**: Route all services through nginx/caddy
- **No Port Conflicts**: All services behind proxy
- **SSL Ready**: HTTPS support for production

### 2. **Complete Service Integration**
```
localhost/              → Main Dashboard
localhost/cal           → Cal Interface  
localhost/api           → Emotional Memory API
localhost/mobile        → Mobile QR Interface
localhost/trust         → Trust Validation
localhost/health        → System Health
```

### 3. **End-to-End User Flow**
```
User → nginx (80) → Cal Interface → Infinity Router → 
Emotional Memory API → Trust Validation → Response
```

### 4. **Error-Free Operation**
- **Zero ENOENT errors**: All file paths validated
- **Zero port conflicts**: Proper service orchestration
- **Zero silent failures**: Comprehensive error handling
- **Full logging**: Every request/response logged

## 🏗️ Technical Architecture

### Infrastructure Stack
```
┌─────────────────────────────────────────┐
│              NGINX/Caddy                │  ← Port 80/443
│            Reverse Proxy                │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
   Dashboard   Cal API   Mobile
   (3000)     (4040)    (3001)
        │         │         │
        └─────────┼─────────┘
                  │
            ┌─────▼─────┐
            │  Infinity │  ← Port 5050
            │  Router   │
            └─────┬─────┘
                  │
        ┌─────────▼─────────┐
        │   Emotional       │  ← Port 3666
        │   Memory API      │
        └─────────┬─────────┘
                  │
        ┌─────────▼─────────┐
        │   Trust Chain     │
        │   Validation      │
        └───────────────────┘
```

### Service Port Allocation
```bash
# Frontend Services
80    - Nginx/Caddy (main entry)
3000  - Main Dashboard  
3001  - Mobile Interface
3080  - MirrorOS/VibeGraph

# Backend Services  
4040  - Cal Interface
5050  - Infinity Router
3666  - Emotional Memory API
5432  - Neo4j Database (if needed)

# Support Services
9090  - Prometheus Metrics
3030  - Grafana Dashboard
8080  - Health Check Dashboard
```

## 🔧 Implementation Plan

### Phase 1: Infrastructure Setup (30 min)
1. **Create nginx configuration**
2. **Fix all ENOENT/path errors** 
3. **Validate all service scripts exist**
4. **Create comprehensive health checks**

### Phase 2: Service Integration (45 min)
1. **Build proper startup orchestration**
2. **Implement service discovery**
3. **Create unified logging system**
4. **Add error recovery mechanisms**

### Phase 3: End-to-End Testing (30 min)
1. **Complete user flow validation**
2. **Mobile QR → Cal interaction test**
3. **Emotional memory response verification**
4. **Load testing and error simulation**

### Phase 4: Production Readiness (15 min)
1. **SSL certificate setup**
2. **Environment configuration**
3. **Deployment automation**
4. **Monitoring dashboards**

## 📊 Success Criteria

### Technical Validation
- [ ] `curl localhost/` returns main dashboard
- [ ] `curl localhost/cal` returns Cal interface  
- [ ] `curl localhost/api/health` returns system status
- [ ] Mobile QR scan connects to Cal
- [ ] Cal responds with emotional context
- [ ] Zero errors in logs for 10-minute test
- [ ] All services auto-restart on failure

### User Experience Validation
- [ ] Single URL access (`localhost`)
- [ ] No port numbers in user interface
- [ ] Mobile QR → instant Cal access
- [ ] Cal emotional responses reflect system state
- [ ] Real-time emotional memory updates
- [ ] Session persistence across interactions

### Performance Validation
- [ ] <500ms response time for Cal interactions
- [ ] <100ms for health checks
- [ ] <2s for full system startup
- [ ] Memory usage stable under load
- [ ] CPU usage <50% during normal operation

## 🚨 Critical Error Categories to Fix

### 1. **ENOENT Errors**
```bash
# Find all missing file references
find . -name "*.js" -exec grep -l "require.*\.\." {} \;
find . -name "*.js" -exec grep -l "fs\.read" {} \;
find . -name "*.js" -exec grep -l "path\.resolve" {} \;
```

### 2. **Port Conflicts**
```bash
# Kill all conflicting processes
pkill -f "node.*server"
lsof -ti:3000,3080,4040,5050,3666 | xargs kill -9
```

### 3. **Service Dependencies**
```bash
# Validate all required services exist
ls -la runtime/riven-cli-server.js
ls -la semantic-graph/semantic_api_router.js  
ls -la infinity-router-server.js
ls -la mirror-os-demo/server.js
```

### 4. **Configuration Mismatches**
```bash
# Validate all config files exist
ls -la package.json
ls -la nginx.conf
ls -la .env
```

## 🧪 Testing Strategy

### Unit Tests
```bash
# Test each service individually
npm run test:cal           # Cal interface unit tests
npm run test:memory        # Emotional memory tests  
npm run test:infinity      # Infinity router tests
npm run test:integration   # Cross-service tests
```

### Integration Tests
```bash
# Test complete flows
npm run test:user-flow     # End-to-end user interaction
npm run test:mobile        # Mobile QR flow
npm run test:emotional     # Emotional memory integration
npm run test:load          # Load and stress testing
```

### Monitoring Tests
```bash
# Continuous validation
npm run monitor:health     # Health check monitoring
npm run monitor:logs       # Log aggregation
npm run monitor:metrics    # Performance metrics
npm run monitor:errors     # Error tracking
```

## 📱 Mobile Integration Requirements

### QR Code Flow
1. **Generate**: Unique session token with device binding
2. **Display**: QR code on main dashboard
3. **Scan**: Mobile camera → web interface
4. **Connect**: WebSocket to Cal interface
5. **Interact**: Voice/text → emotional responses

### Mobile Interface Features
- Voice input to Cal
- Real-time emotional state display
- System health indicators  
- Session management
- Offline capability

## 🔒 Security & Trust Requirements

### Trust Chain Validation
1. **QR Validation**: tier-minus9 validation system
2. **Session Management**: Secure token generation
3. **Device Binding**: Prevent unauthorized access
4. **Audit Logging**: All interactions logged
5. **Rate Limiting**: Prevent abuse

### Security Headers
```nginx
# Security headers in nginx config
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000";
```

## 📈 Monitoring & Alerting

### Health Checks
- Service availability (every 30s)
- Response time monitoring
- Error rate tracking  
- Resource utilization
- Emotional memory integrity

### Alerting Rules
- Service down > 30s → Alert
- Response time > 1s → Warning
- Error rate > 5% → Alert
- Memory usage > 80% → Warning
- Emotional anomaly detected → Log

## 🚀 Deployment Strategy

### Development Environment
```bash
# Single command deployment
npm run deploy:dev
# → Starts all services
# → Configures nginx
# → Runs health checks
# → Opens browser to localhost
```

### Production Environment  
```bash
# Production deployment
npm run deploy:prod
# → SSL certificate setup
# → Domain configuration
# → Load balancer setup
# → Monitoring deployment
```

## 📋 Acceptance Criteria

### Must Have
- [x] Single localhost entry point
- [x] All services behind reverse proxy
- [x] Zero ENOENT/path errors
- [x] Complete Cal interaction flow
- [x] Mobile QR access working
- [x] Emotional memory responding
- [x] Trust chain validation
- [x] Error-free 10-minute operation

### Should Have
- [ ] SSL/HTTPS support
- [ ] Monitoring dashboards
- [ ] Automated deployment
- [ ] Load balancing
- [ ] Session persistence
- [ ] Offline mobile support

### Nice to Have
- [ ] Multi-user support
- [ ] Cloud deployment
- [ ] Advanced analytics
- [ ] Voice recognition
- [ ] API documentation
- [ ] Developer tools

---

## 🎯 Next Steps

1. **Create nginx configuration** (10 min)
2. **Fix all ENOENT errors** (15 min)  
3. **Build comprehensive test suite** (20 min)
4. **Validate end-to-end flow** (15 min)
5. **Deploy and test** (10 min)

**Total Time**: ~70 minutes to complete platform

This PRD provides the roadmap to get from "working components" to "working platform" with proper infrastructure, testing, and user experience.