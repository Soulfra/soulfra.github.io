#!/bin/bash

# ============================================================================
# DEPLOY VPS WITH OLLAMA - Full AI Backend
# ============================================================================
#
# Deploys DeathToData backend + Ollama to a VPS
#
# REQUIREMENTS:
#   - VPS with GPU (DigitalOcean GPU Droplet $50/mo or Linode GPU $90/mo)
#   - Ubuntu 22.04+
#   - At least 16GB RAM
#
# USAGE:
#   ./deploy-vps-ollama.sh <vps-ip> <domain-name>
#
# EXAMPLE:
#   ./deploy-vps-ollama.sh 142.93.123.45 api.deathtodata.com
#
# WHAT THIS DOES:
#   1. SSHs to VPS
#   2. Installs Node.js, Ollama, nginx
#   3. Deploys backend
#   4. Sets up systemd services (auto-restart)
#   5. Configures nginx reverse proxy
#   6. Sets up SSL (Let's Encrypt)
#
# RESULT:
#   Backend + Ollama running 24/7 at https://api.deathtodata.com
#
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo ""
    echo "Usage: $0 <vps-ip> <domain-name>"
    echo ""
    echo "Example:"
    echo "  $0 142.93.123.45 api.deathtodata.com"
    echo ""
    exit 1
fi

VPS_IP="$1"
DOMAIN="$2"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deploying to VPS with Ollama${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "VPS IP: $VPS_IP"
echo "Domain: $DOMAIN"
echo ""

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=5 root@$VPS_IP "echo 'Connected'" &>/dev/null; then
    echo -e "${RED}Error: Cannot connect to VPS${NC}"
    echo "Make sure you can SSH: ssh root@$VPS_IP"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection working${NC}"

# Create deployment script
DEPLOY_SCRIPT=$(cat <<'EOF'
#!/bin/bash
set -e

echo "========================================="
echo "  VPS Setup - Ollama + Backend"
echo "========================================="

# Update system
echo "Updating system..."
apt-get update -qq
apt-get install -y curl git build-essential nginx certbot python3-certbot-nginx jq

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install Ollama
if ! command -v ollama &> /dev/null; then
    echo "Installing Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Pull default model (llama3.2:1b for speed)
echo "Pulling Ollama model..."
systemctl start ollama
ollama pull llama3.2:1b

# Create app directory
echo "Setting up backend..."
mkdir -p /opt/deathtodata
cd /opt/deathtodata

# Create package.json
cat > package.json <<'PACKAGE'
{
  "name": "deathtodata-api",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "sqlite3": "^5.1.6"
  }
}
PACKAGE

npm install

# Create systemd service for backend
cat > /etc/systemd/system/deathtodata.service <<'SERVICE'
[Unit]
Description=DeathToData API
After=network.target ollama.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/deathtodata
ExecStart=/usr/bin/node /opt/deathtodata/api/deathtodata-backend.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5051

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
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ollama {
        proxy_pass http://localhost:11434;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/deathtodata /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "✅ VPS setup complete"
echo ""
echo "Next steps:"
echo "1. Copy backend code to /opt/deathtodata/"
echo "2. Start services: systemctl start deathtodata"
echo "3. Enable SSL: certbot --nginx -d DOMAIN_PLACEHOLDER"
EOF
)

# Copy and run deployment script on VPS
echo -e "${YELLOW}Deploying to VPS...${NC}"
echo "$DEPLOY_SCRIPT" | ssh root@$VPS_IP "cat > /tmp/deploy.sh && chmod +x /tmp/deploy.sh && bash /tmp/deploy.sh"

# Replace domain placeholder
ssh root@$VPS_IP "sed -i 's/DOMAIN_PLACEHOLDER/$DOMAIN/g' /etc/nginx/sites-available/deathtodata"
ssh root@$VPS_IP "sed -i 's/DOMAIN_PLACEHOLDER/$DOMAIN/g' /etc/systemd/system/deathtodata.service"

# Copy backend code
echo -e "${YELLOW}Copying backend code...${NC}"
scp -r "$(dirname "$0")/../api" root@$VPS_IP:/opt/deathtodata/
scp -r "$(dirname "$0")/../config" root@$VPS_IP:/opt/deathtodata/
scp "$(dirname "$0")/../deathtodata.db" root@$VPS_IP:/opt/deathtodata/ 2>/dev/null || echo "No local DB to copy"

# Start services
echo -e "${YELLOW}Starting services...${NC}"
ssh root@$VPS_IP "systemctl daemon-reload && systemctl enable deathtodata && systemctl start deathtodata"
ssh root@$VPS_IP "systemctl restart nginx"

# Setup SSL
echo -e "${YELLOW}Setting up SSL...${NC}"
echo ""
echo "⚠️  Before continuing, make sure DNS points to this VPS:"
echo "   A record: $DOMAIN -> $VPS_IP"
echo ""
read -p "Press Enter when DNS is configured (or Ctrl+C to skip SSL)..."

ssh root@$VPS_IP "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || echo 'SSL setup failed - run manually later'"

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Backend: https://$DOMAIN"
echo "Ollama: https://$DOMAIN/api/ollama"
echo ""
echo -e "${YELLOW}Test it:${NC}"
echo "curl -s https://$DOMAIN/api/search?q=test | jq ."
echo ""
echo -e "${YELLOW}Check status:${NC}"
echo "ssh root@$VPS_IP systemctl status deathtodata"
echo ""
echo -e "${YELLOW}View logs:${NC}"
echo "ssh root@$VPS_IP journalctl -u deathtodata -f"
echo ""
echo -e "${YELLOW}Ollama models:${NC}"
echo "ssh root@$VPS_IP ollama list"
echo ""
