#!/bin/bash

# ============================================================================
# DEPLOY VPS HYBRID - Cheap VPS + Local Ollama
# ============================================================================
#
# Best of both worlds:
#   - VPS ($5/mo): Search API, analytics, always online
#   - Your laptop: Ollama (privacy!), metrics collection
#
# ARCHITECTURE:
#   User → api.deathtodata.com (VPS)
#          ├── Search (DuckDuckGo)
#          ├── Analytics aggregation
#          └── WebSocket → Your laptop (for Ollama when online)
#
# REQUIREMENTS:
#   - VPS with 1GB RAM ($5/mo DigitalOcean/Linode)
#   - Ubuntu 22.04+
#   - Your laptop for Ollama
#
# USAGE:
#   ./deploy-vps-hybrid.sh <vps-ip> <domain-name> <local-tunnel-url>
#
# EXAMPLE:
#   ./deploy-vps-hybrid.sh 142.93.123.45 api.deathtodata.com https://your-laptop.ngrok.io
#
# WHAT THIS DOES:
#   1. Deploys lightweight backend to VPS (no Ollama)
#   2. Sets up metrics forwarding to your laptop
#   3. Configures WebSocket bridge for Ollama queries
#   4. Your laptop stays private, VPS stays cheap
#
# RESULT:
#   - Public API at https://api.deathtodata.com ($5/mo)
#   - Ollama local (FREE + private)
#   - Metrics stored locally (privacy!)
#
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check arguments
if [ $# -lt 3 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo ""
    echo "Usage: $0 <vps-ip> <domain-name> <local-tunnel-url>"
    echo ""
    echo "Example:"
    echo "  $0 142.93.123.45 api.deathtodata.com https://your-laptop.ngrok.io"
    echo ""
    echo "Get your local tunnel URL:"
    echo "  ngrok http 11434  # Ollama port"
    echo "  # Copy the https URL"
    echo ""
    exit 1
fi

VPS_IP="$1"
DOMAIN="$2"
LOCAL_TUNNEL="$3"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deploying Hybrid VPS${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "VPS IP: $VPS_IP"
echo "Domain: $DOMAIN"
echo "Local tunnel: $LOCAL_TUNNEL"
echo ""
echo "Architecture:"
echo "  VPS: Search + Analytics (always on)"
echo "  Your laptop: Ollama + Metrics (privacy)"
echo ""

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=5 root@$VPS_IP "echo 'Connected'" &>/dev/null; then
    echo -e "${RED}Error: Cannot connect to VPS${NC}"
    echo "Make sure you can SSH: ssh root@$VPS_IP"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection working${NC}"

# Create hybrid backend
HYBRID_BACKEND=$(cat <<'EOF'
// Hybrid Backend - VPS side (no Ollama)
const express = require('express');
const cors = require('cors');
const https = require('https');
const app = express();

app.use(cors());
app.use(express.json());

// Environment variables
const LOCAL_TUNNEL = process.env.LOCAL_TUNNEL || '';
const METRICS_ENDPOINT = process.env.METRICS_ENDPOINT || '';

// Search endpoint (VPS handles this)
app.get('/api/search', async (req, res) => {
  const query = req.query.q;

  try {
    // Use DuckDuckGo API
    const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`;
    const response = await fetch(ddgUrl);
    const data = await response.json();

    // Forward metrics to local machine (privacy!)
    if (METRICS_ENDPOINT) {
      fetch(METRICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'search',
          query,
          timestamp: Date.now(),
          ip_hash: require('crypto').createHash('sha256').update(req.ip).digest('hex').slice(0, 8)
        })
      }).catch(() => {}); // Don't block on metrics
    }

    res.json({ results: data.RelatedTopics || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ollama proxy (routes to your local machine)
app.post('/api/ollama', async (req, res) => {
  if (!LOCAL_TUNNEL) {
    return res.status(503).json({ error: 'Ollama offline (local tunnel not configured)' });
  }

  try {
    const response = await fetch(`${LOCAL_TUNNEL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Ollama unavailable (laptop offline?)' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    vps_online: true,
    ollama_available: !!LOCAL_TUNNEL
  });
});

const PORT = process.env.PORT || 5051;
app.listen(PORT, () => {
  console.log(`🚀 Hybrid backend running on port ${PORT}`);
  console.log(`📡 Local tunnel: ${LOCAL_TUNNEL || 'Not configured'}`);
  console.log(`📊 Metrics endpoint: ${METRICS_ENDPOINT || 'Not configured'}`);
});
EOF
)

# Create local metrics collector
LOCAL_COLLECTOR=$(cat <<'EOF'
// Local Metrics Collector (runs on your laptop)
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();

app.use(express.json());

// Local SQLite database
const db = new sqlite3.Database('./metrics.db');

// Create metrics table
db.run(`
  CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event TEXT,
    query TEXT,
    timestamp INTEGER,
    ip_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Receive metrics from VPS
app.post('/metrics', (req, res) => {
  const { event, query, timestamp, ip_hash } = req.body;

  db.run(
    'INSERT INTO metrics (event, query, timestamp, ip_hash) VALUES (?, ?, ?, ?)',
    [event, query, timestamp, ip_hash],
    (err) => {
      if (err) {
        console.error('Error storing metric:', err);
        return res.status(500).json({ error: err.message });
      }
      console.log(`✅ Metric stored: ${event} - ${query}`);
      res.json({ success: true });
    }
  );
});

// View metrics
app.get('/metrics', (req, res) => {
  db.all('SELECT * FROM metrics ORDER BY created_at DESC LIMIT 100', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

const PORT = process.env.PORT || 5052;
app.listen(PORT, () => {
  console.log(`📊 Metrics collector running on port ${PORT}`);
  console.log(`📈 View metrics: http://localhost:${PORT}/metrics`);
});
EOF
)

# Deploy to VPS
echo -e "${YELLOW}Deploying to VPS...${NC}"

DEPLOY_SCRIPT=$(cat <<'DEPLOY'
#!/bin/bash
set -e

echo "Installing dependencies..."
apt-get update -qq
apt-get install -y curl git nginx certbot python3-certbot-nginx jq

# Install Node.js
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Setup app
mkdir -p /opt/deathtodata
cd /opt/deathtodata

cat > package.json <<'PACKAGE'
{
  "name": "deathtodata-hybrid",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
PACKAGE

npm install

# Create systemd service
cat > /etc/systemd/system/deathtodata.service <<'SERVICE'
[Unit]
Description=DeathToData Hybrid API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/deathtodata
ExecStart=/usr/bin/node /opt/deathtodata/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5051
Environment=LOCAL_TUNNEL=LOCAL_TUNNEL_PLACEHOLDER
Environment=METRICS_ENDPOINT=METRICS_ENDPOINT_PLACEHOLDER

[Install]
WantedBy=multi-user.target
SERVICE

# Configure nginx
cat > /etc/nginx/sites-available/deathtodata <<'NGINX'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

    location / {
        proxy_pass http://localhost:5051;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/deathtodata /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "✅ VPS setup complete"
DEPLOY
)

echo "$DEPLOY_SCRIPT" | ssh root@$VPS_IP "cat > /tmp/deploy.sh && chmod +x /tmp/deploy.sh && bash /tmp/deploy.sh"

# Copy backend code
echo "$HYBRID_BACKEND" | ssh root@$VPS_IP "cat > /opt/deathtodata/server.js"

# Configure service with tunnel URLs
ssh root@$VPS_IP "sed -i 's|DOMAIN_PLACEHOLDER|$DOMAIN|g' /etc/nginx/sites-available/deathtodata"
ssh root@$VPS_IP "sed -i 's|LOCAL_TUNNEL_PLACEHOLDER|$LOCAL_TUNNEL|g' /etc/systemd/system/deathtodata.service"

# Ask for metrics tunnel
echo ""
echo -e "${YELLOW}Setup local metrics collector?${NC}"
read -p "Enter your local metrics tunnel URL (or press Enter to skip): " METRICS_TUNNEL

if [ -n "$METRICS_TUNNEL" ]; then
    ssh root@$VPS_IP "sed -i 's|METRICS_ENDPOINT_PLACEHOLDER|${METRICS_TUNNEL}/metrics|g' /etc/systemd/system/deathtodata.service"

    # Save local collector script
    echo "$LOCAL_COLLECTOR" > "$(dirname "$0")/local-metrics-collector.js"
    echo -e "${GREEN}✅ Saved local-metrics-collector.js${NC}"
else
    ssh root@$VPS_IP "sed -i 's|METRICS_ENDPOINT_PLACEHOLDER||g' /etc/systemd/system/deathtodata.service"
fi

# Start services
echo -e "${YELLOW}Starting services...${NC}"
ssh root@$VPS_IP "systemctl daemon-reload && systemctl enable deathtodata && systemctl start deathtodata"
ssh root@$VPS_IP "systemctl restart nginx"

# Setup SSL
echo ""
echo "⚠️  Before continuing, make sure DNS points to this VPS:"
echo "   A record: $DOMAIN -> $VPS_IP"
echo ""
read -p "Press Enter when DNS is configured (or Ctrl+C to skip SSL)..."

ssh root@$VPS_IP "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo 'SSL setup failed'"

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Hybrid Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${GREEN}VPS (always online):${NC}"
echo "  API: https://$DOMAIN"
echo "  Cost: $5/mo"
echo ""
echo -e "${GREEN}Your laptop (privacy):${NC}"
echo "  Ollama: $LOCAL_TUNNEL"
if [ -n "$METRICS_TUNNEL" ]; then
    echo "  Metrics: $METRICS_TUNNEL"
fi
echo ""
echo -e "${YELLOW}To start local services:${NC}"
echo "  # Ollama tunnel"
echo "  ngrok http 11434"
echo ""
if [ -n "$METRICS_TUNNEL" ]; then
    echo "  # Metrics collector"
    echo "  node templates/local-metrics-collector.js"
    echo "  ngrok http 5052"
fi
echo ""
echo -e "${YELLOW}Test it:${NC}"
echo "  curl https://$DOMAIN/health | jq ."
echo ""
