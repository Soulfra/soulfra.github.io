# SOULFRA PLATFORM DOCUMENTATION

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Reference](#api-reference)
4. [Deployment](#deployment)
5. [Monitoring](#monitoring)
6. [Security](#security)
7. [Troubleshooting](#troubleshooting)

## Overview

Soulfra is an integrated gaming platform that combines real-time games with AI-powered reflection and growth mechanics. Built on Python with zero external dependencies for maximum reliability.

### Key Features
- Integrated game + API on single port (no CORS issues)
- Real-time reflection system for AI integration
- Comprehensive logging and analytics
- Enterprise-grade monitoring
- Scalable architecture

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     SOULFRA PLATFORM                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │   GAME UI   │────▶│  API ROUTER │────▶│  AI BACKEND │  │
│  │  (Port 3002)│     │  (Port 3002)│     │ (Port 4040) │  │
│  └─────────────┘     └─────────────┘     └─────────────┘  │
│         │                    │                    │         │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐  │
│  │   LOGGER    │     │  ANALYTICS  │     │  CAL RIVEN  │  │
│  │   SYSTEM    │     │   ENGINE    │     │     AI      │  │
│  └─────────────┘     └─────────────┘     └─────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Port Mapping

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| Integrated Platform | 3002 | ✅ Active | Game + API Router |
| Simple Clicker | 3000 | ✅ Active | Basic game (no API) |
| Cal Riven AI | 4040 | ⏳ Ready | AI consciousness engine |
| Economy Service | 4002 | ⏳ Planned | Agent economy system |
| Analytics | 4003 | ⏳ Planned | Reflection analytics |

## API Reference

### Base URL
```
http://localhost:3002
```

### Endpoints

#### GET /api/status
Returns platform status.

**Response:**
```json
{
  "platform": "online",
  "port": 3002,
  "timestamp": "2025-06-20T15:45:00.000Z"
}
```

#### GET /api/data
Returns current game state and analytics.

**Response:**
```json
{
  "clicks": 42,
  "reflections": [],
  "api_calls": 156
}
```

#### POST /api/score
Save current game score.

**Request:**
```json
{
  "score": 100
}
```

**Response:**
```json
{
  "status": "saved"
}
```

#### POST /api/reflect
Submit reflection to AI system.

**Request:**
```json
{
  "text": "I'm learning about persistence",
  "score": 100
}
```

**Response:**
```json
{
  "status": "reflected",
  "id": 0
}
```

## Deployment

### Local Development
```bash
# Start integrated platform
python3 WORKING_PLATFORM.py

# With logging
python3 ENTERPRISE_PLATFORM.py
```

### Production Deployment

#### Using Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
EXPOSE 3002
CMD ["python", "ENTERPRISE_PLATFORM.py"]
```

#### Using systemd
```ini
[Unit]
Description=Soulfra Platform
After=network.target

[Service]
Type=simple
User=soulfra
WorkingDirectory=/opt/soulfra
ExecStart=/usr/bin/python3 /opt/soulfra/ENTERPRISE_PLATFORM.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### Environment Variables
```bash
SOULFRA_PORT=3002
SOULFRA_LOG_LEVEL=INFO
SOULFRA_AI_ENDPOINT=http://localhost:4040
SOULFRA_ENV=production
```

## Monitoring

### Logging
Logs are stored in `./logs/` directory:
- `access_YYYYMMDD.log` - HTTP access logs
- `error_YYYYMMDD.log` - Error logs
- `events_YYYYMMDD.log` - Game event logs
- `metrics_YYYYMMDD.log` - Performance metrics

### Health Check
```bash
curl http://localhost:3002/api/status
```

### Analytics Dashboard
Access analytics at: `http://localhost:3002/analytics`

### Metrics to Monitor
- Request rate (requests/second)
- Error rate (< 5% healthy)
- Response time (< 100ms target)
- Active users
- Reflection engagement rate

## Security

### Authentication (Future)
- JWT token-based authentication
- Session management
- Rate limiting

### Best Practices
1. Run behind reverse proxy (nginx)
2. Enable HTTPS in production
3. Implement rate limiting
4. Regular security audits
5. Input validation on all endpoints

### Example nginx config
```nginx
server {
    listen 443 ssl;
    server_name soulfra.com;
    
    ssl_certificate /etc/ssl/certs/soulfra.crt;
    ssl_certificate_key /etc/ssl/private/soulfra.key;
    
    location / {
        proxy_pass http://localhost:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Kill process on port
lsof -ti :3002 | xargs kill -9
```

#### CORS Errors
- Solution: Use integrated platform on port 3002
- All services on same port = no CORS

#### High Memory Usage
- Check for memory leaks in game loop
- Implement connection limits
- Regular garbage collection

#### Logs Not Writing
- Check permissions on logs directory
- Ensure disk space available
- Verify logger initialization

### Debug Mode
```python
# Enable debug logging
logger.set_level('DEBUG')
```

### Performance Tuning
1. Enable gzip compression
2. Implement caching headers
3. Optimize database queries
4. Use CDN for static assets

## Development Workflow

### Adding New Features
1. Create feature branch
2. Update API documentation
3. Add logging for new endpoints
4. Write tests
5. Update deployment scripts

### Testing
```bash
# Run tests
python3 -m pytest tests/

# Load testing
locust -f tests/load_test.py
```

### CI/CD Pipeline
```yaml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Test
        run: python -m pytest
      - name: Deploy
        run: ./deploy.sh
```

## Support

### Resources
- GitHub: https://github.com/soulfra/platform
- Discord: https://discord.gg/soulfra
- Email: support@soulfra.com

### Contributing
1. Fork repository
2. Create feature branch
3. Submit pull request
4. Follow code style guide

---

*Last updated: 2025-06-20*