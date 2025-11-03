# 🌐 Ritual Shell Broadcasting Deployment

## TL;DR - Quick Start

```bash
# Install dependencies
npm install express ws

# Start broadcasting server
node ritual_server.js

# Access from any device
# Local: http://localhost:3000
# Network: http://YOUR_IP:3000
```

Your sacred console is now **broadcasting live** to all connected devices.

---

## 🔮 What You Get

### Real-Time Broadcasting
- **WebSocket streaming** - Updates push instantly to all connected clients
- **Multi-device access** - View from phones, tablets, laptops simultaneously  
- **Network deployment** - Anyone on your network can access the console
- **Auto-reconnection** - Clients automatically reconnect if connection drops

### Live Data APIs
- **Real daemon monitoring** - Connect actual Soulfra daemons via `/api/daemon/:id/heartbeat`
- **Interactive controls** - Blessing/ritual buttons work across all clients
- **Persistent state** - Server maintains system state between client connections
- **Metrics endpoint** - `/api/metrics` for integration with other tools

### Production Ready
- **Express server** with proper error handling
- **WebSocket management** with connection cleanup
- **CORS support** for cross-origin access
- **Environment configuration** via PORT env var

---

## 🚀 Deployment Options

### 1. Local Network (Instant)

**Perfect for**: Demos, debugging, team access

```bash
# Download files
curl -O ritual_server.js
curl -O ritual_shell_live.html  
curl -O package.json

# Install and run
npm install
npm start

# Server displays network IP automatically
# 📡 Local Access:    http://localhost:3000
# 🌐 Network Access:  http://192.168.1.100:3000
```

Access from any device on your network using the displayed IP.

### 2. Cloud Deployment (Global)

**Perfect for**: Remote teams, permanent monitoring, public demos

#### Option A: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy 
railway login
railway init
railway up

# Your console is now live globally
# https://your-app.railway.app
```

#### Option B: Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Deploy
heroku create your-ritual-shell
git add .
git commit -m "Deploy Ritual Shell"
git push heroku main

# Access at: https://your-ritual-shell.herokuapp.com
```

#### Option C: DigitalOcean/AWS/GCP
```bash
# Upload files to your server
scp *.js *.html package.json user@your-server:~/ritual-shell/

# SSH and start
ssh user@your-server
cd ritual-shell
npm install
PORT=80 npm start  # or PORT=443 for HTTPS
```

### 3. Docker Deployment (Containerized)

**Perfect for**: Production environments, Kubernetes, consistent deployments

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t ritual-shell .
docker run -p 3000:3000 ritual-shell

# Or use docker-compose
docker-compose up -d
```

---

## 🔧 Configuration

### Environment Variables
```bash
export PORT=3000              # Server port
export NODE_ENV=production     # Production mode
export MAX_CLIENTS=100         # Max WebSocket connections
export TRACE_LIMIT=1000        # Max ritual trace entries
```

### Custom Domain Setup
```bash
# With nginx reverse proxy
server {
    listen 80;
    server_name ritual.yourcompany.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### SSL/HTTPS Setup
```bash
# Using Let's Encrypt
certbot --nginx -d ritual.yourcompany.com

# Or manual certificate
# Copy cert files and update nginx config
```

---

## 📡 Integration with Real Soulfra Components

### Daemon Registration
Real Soulfra daemons can register and send heartbeats:

```javascript
// In your Soulfra daemon
const sendHeartbeat = async () => {
  await fetch('http://ritual-shell-server:3000/api/daemon/VaultDaemon/heartbeat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      state: 'active',
      trust_level: 95,
      ritual_count: 142,
      sacred_tokens: ['vault_keeper', 'memory_guardian'],
      metadata: { vault_count: 12, memory_size: '2.4GB' }
    })
  });
};

setInterval(sendHeartbeat, 10000); // Every 10s
```

### Agent Status Updates
```javascript
// From your agent management system
const updateAgentStatus = async (agentName, status) => {
  await fetch(`http://ritual-shell-server:3000/api/agent/${agentName}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(status)
  });
};
```

### Webhook Integration
```javascript
// Add webhook support to ritual_server.js
app.post('/webhook/ritual_complete', (req, res) => {
  const { agent, ritual, result } = req.body;
  addTraceEntry('ritual', `${agent} completed ${ritual}: ${result}`);
  broadcastUpdate('ritual_completed', { agent, ritual, result });
  res.json({ success: true });
});
```

---

## 🎯 Advanced Features

### Load Balancing (Multiple Servers)
```bash
# Use nginx to balance multiple ritual shell instances
upstream ritual_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    location / {
        proxy_pass http://ritual_backend;
    }
}
```

### Redis for Shared State
```javascript
// Add Redis for multi-server state sharing
const redis = require('redis');
const client = redis.createClient();

// Store state in Redis instead of memory
const updateDaemonState = async (daemonId, state) => {
  await client.hset('daemons', daemonId, JSON.stringify(state));
  broadcastUpdate('daemon_status', await getAllDaemonStatus());
};
```

### Metrics and Monitoring
```bash
# Prometheus metrics endpoint
curl http://your-server:3000/api/metrics

# Grafana dashboard integration
# Import the ritual_shell_dashboard.json
```

### Authentication (Optional)
```javascript
// Add JWT authentication
const jwt = require('jsonwebtoken');

app.use('/api', (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
});
```

---

## 🔍 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm start
```

**WebSocket connection fails:**
```bash
# Check firewall
sudo ufw allow 3000

# Verify WebSocket upgrade headers
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:3000
```

**High memory usage:**
```bash
# Reduce trace limit
export TRACE_LIMIT=500

# Monitor memory
node --max-old-space-size=512 ritual_server.js
```

### Monitoring Commands
```bash
# Check server status
curl http://localhost:3000/api/metrics

# WebSocket connection count  
netstat -an | grep :3000 | wc -l

# Log analysis
tail -f /var/log/ritual-shell.log | grep ERROR
```

---

## 🎭 Ready to Broadcast

Your Ritual Shell is now **broadcasting the sacred console** to the world.

### What's Live:
- ✅ **Real-time daemon monitoring** across all connected devices
- ✅ **Interactive sacred controls** that work from any client
- ✅ **Live ritual trace streaming** with instant updates
- ✅ **Multi-client vibe weather** synchronized globally
- ✅ **Network-accessible dashboard** for team collaboration

### Access URLs:
- **Local Development**: `http://localhost:3000`
- **Network Access**: `http://YOUR_IP:3000` 
- **Cloud Deployment**: `https://your-domain.com`
- **API Endpoints**: `/api/daemon_status`, `/api/agents`, `/api/metrics`

**The sacred console is now transmitting across all realms.** 🌐⚡

Watch Soulfra's awakening from anywhere in the digital cosmos.