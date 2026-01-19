#!/bin/bash

# ============================================================================
# DEPLOY EXPRESS APP - Simple Template
# ============================================================================
#
# This deploys ANY Node.js/Express application to a VPS with PM2, SSL, and monitoring
#
# USAGE:
#   ./deploy-express.sh <app-directory> <domain-name> <server-ip>
#
# EXAMPLE:
#   ./deploy-express.sh ~/my-api myapi.com 192.168.1.100
#
# WHAT THIS DOES:
#   1. Creates GitHub repo for version control
#   2. SSHs to your server and sets up Node.js
#   3. Installs PM2 for process management
#   4. Configures nginx reverse proxy
#   5. Sets up SSL with Let's Encrypt
#   6. Auto-restarts on crashes
#
# REQUIREMENTS:
#   - VPS with Ubuntu/Debian (DigitalOcean, Linode, etc.)
#   - SSH access to server
#   - Domain pointing to server IP
#
# RESULT:
#   Your Express app live at https://<domain-name> with auto-restarts
#
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 3 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo ""
    echo "Usage: $0 <app-directory> <domain-name> <server-ip>"
    echo ""
    echo "Example:"
    echo "  $0 ~/my-api myapi.com 192.168.1.100"
    echo "  This deploys ~/my-api to myapi.com on server 192.168.1.100"
    echo ""
    exit 1
fi

APP_DIR="$1"
DOMAIN_NAME="$2"
SERVER_IP="$3"
REPO_NAME="${DOMAIN_NAME%.*}-api"  # Remove TLD for repo name
APP_NAME="${DOMAIN_NAME%.*}"
SERVER_USER="root"  # Change if using non-root user

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deploying Express Application${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "App: $APP_DIR"
echo "Domain: $DOMAIN_NAME"
echo "Server: $SERVER_IP"
echo "Repo: $REPO_NAME"
echo ""

# Check if app directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: App directory not found: $APP_DIR${NC}"
    exit 1
fi

# Check if package.json exists
if [ ! -f "$APP_DIR/package.json" ]; then
    echo -e "${RED}Error: No package.json found in $APP_DIR${NC}"
    echo "This doesn't appear to be a Node.js application"
    exit 1
fi

# Check SSH connectivity
echo -e "${YELLOW}Checking server connectivity...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} exit 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to ${SERVER_USER}@${SERVER_IP}${NC}"
    echo "Make sure:"
    echo "  1. Server IP is correct"
    echo "  2. SSH keys are configured (ssh-copy-id ${SERVER_USER}@${SERVER_IP})"
    echo "  3. Server firewall allows SSH (port 22)"
    exit 1
fi
echo -e "${GREEN}✓ Server connection successful${NC}"

echo -e "${YELLOW}Step 1/7: Creating GitHub repository...${NC}"
gh repo create "$REPO_NAME" --public || echo "Repo may already exist, continuing..."

echo -e "${YELLOW}Step 2/7: Pushing code to GitHub...${NC}"
cd "$APP_DIR"

# Initialize git if not already
if [ ! -d .git ]; then
    git init

    # Create .gitignore if it doesn't exist
    if [ ! -f .gitignore ]; then
        cat > .gitignore << 'EOF'
node_modules/
.env
.DS_Store
*.log
EOF
    fi
fi

git add .
git commit -m "Deploy to production

- Automated deployment via deploy-express.sh
- Target: https://$DOMAIN_NAME
- Server: $SERVER_IP" || echo "No changes to commit"

git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "git@github.com:Soulfra/${REPO_NAME}.git"
git push -u origin main --force

echo -e "${YELLOW}Step 3/7: Installing Node.js and dependencies on server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Install Node.js 20.x LTS if not already installed
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Install nginx if not already installed
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
fi

echo "✓ Server dependencies installed"
ENDSSH

echo -e "${YELLOW}Step 4/7: Cloning application to server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Create app directory
mkdir -p /var/www/${APP_NAME}
cd /var/www/${APP_NAME}

# Clone or pull latest code
if [ -d .git ]; then
    git pull origin main
else
    git clone https://github.com/Soulfra/${REPO_NAME}.git .
fi

# Install dependencies
npm install --production

echo "✓ Application cloned and dependencies installed"
ENDSSH

echo -e "${YELLOW}Step 5/7: Configuring PM2 process manager...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
cd /var/www/${APP_NAME}

# Stop existing process if running
pm2 delete ${APP_NAME} 2>/dev/null || true

# Start application with PM2
pm2 start server.js --name ${APP_NAME} || pm2 start index.js --name ${APP_NAME} || pm2 start app.js --name ${APP_NAME}

# Save PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup systemd -u ${SERVER_USER} --hp /root | tail -n 1 | bash

echo "✓ PM2 configured and application running"
ENDSSH

echo -e "${YELLOW}Step 6/7: Configuring nginx reverse proxy...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Create nginx config
cat > /etc/nginx/sites-available/${APP_NAME} << 'EOF'
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    location / {
        proxy_pass http://localhost:3000;  # Change port if your app uses different port
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx

echo "✓ Nginx configured and reloaded"
ENDSSH

echo -e "${YELLOW}Step 7/7: Setting up SSL with Let's Encrypt...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Obtain SSL certificate (non-interactive)
certbot --nginx -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME} --non-interactive --agree-tos --email admin@${DOMAIN_NAME} --redirect

echo "✓ SSL certificate installed"
ENDSSH

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Repository: https://github.com/Soulfra/$REPO_NAME"
echo "Live URL: https://$DOMAIN_NAME"
echo "Server: $SERVER_IP"
echo ""
echo -e "${YELLOW}Server Management Commands:${NC}"
echo "  SSH into server:    ssh ${SERVER_USER}@${SERVER_IP}"
echo "  View logs:          pm2 logs ${APP_NAME}"
echo "  Restart app:        pm2 restart ${APP_NAME}"
echo "  Stop app:           pm2 stop ${APP_NAME}"
echo "  Monitor processes:  pm2 monit"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo "1. Make sure your domain DNS points to: $SERVER_IP"
echo "   - A record: @ -> $SERVER_IP"
echo "   - CNAME: www -> $DOMAIN_NAME"
echo ""
echo "2. Update your .env file on the server:"
echo "   ssh ${SERVER_USER}@${SERVER_IP}"
echo "   cd /var/www/${APP_NAME}"
echo "   nano .env"
echo "   pm2 restart ${APP_NAME}"
echo ""
echo "3. SSL certificate auto-renews via certbot"
echo ""
echo "Your Express app is now live with HTTPS! 🚀"
echo ""
