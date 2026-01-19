#!/bin/bash

# ============================================================================
# DEPLOY FLASK APP - Simple Template
# ============================================================================
#
# This deploys ANY Python/Flask application to a VPS with gunicorn, nginx, and SSL
#
# USAGE:
#   ./deploy-flask.sh <app-directory> <domain-name> <server-ip>
#
# EXAMPLE:
#   ./deploy-flask.sh ~/my-flask-api myapi.com 192.168.1.100
#
# WHAT THIS DOES:
#   1. Creates GitHub repo for version control
#   2. SSHs to your server and sets up Python 3
#   3. Installs virtualenv and dependencies
#   4. Configures gunicorn (WSGI server)
#   5. Sets up nginx reverse proxy
#   6. Installs SSL with Let's Encrypt
#   7. Creates systemd service for auto-restart
#
# REQUIREMENTS:
#   - VPS with Ubuntu/Debian (DigitalOcean, Linode, etc.)
#   - SSH access to server
#   - Domain pointing to server IP
#   - Flask app with requirements.txt
#
# RESULT:
#   Your Flask API live at https://<domain-name> with auto-restarts
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
    echo "  $0 ~/my-flask-api myapi.com 192.168.1.100"
    echo "  This deploys ~/my-flask-api to myapi.com on server 192.168.1.100"
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
echo -e "${GREEN}  Deploying Flask Application${NC}"
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

# Check if requirements.txt exists
if [ ! -f "$APP_DIR/requirements.txt" ]; then
    echo -e "${YELLOW}Warning: No requirements.txt found. Creating one...${NC}"
    cd "$APP_DIR"
    echo "Flask>=2.0.0" > requirements.txt
    echo "gunicorn>=20.1.0" >> requirements.txt
fi

# Detect Flask app file
FLASK_APP_FILE=""
for file in app.py main.py application.py wsgi.py; do
    if [ -f "$APP_DIR/$file" ]; then
        FLASK_APP_FILE="$file"
        break
    fi
done

if [ -z "$FLASK_APP_FILE" ]; then
    echo -e "${RED}Error: Could not find Flask app file (app.py, main.py, application.py, or wsgi.py)${NC}"
    exit 1
fi

echo "Detected Flask app: $FLASK_APP_FILE"

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

echo -e "${YELLOW}Step 1/8: Creating GitHub repository...${NC}"
gh repo create "$REPO_NAME" --public || echo "Repo may already exist, continuing..."

echo -e "${YELLOW}Step 2/8: Pushing code to GitHub...${NC}"
cd "$APP_DIR"

# Initialize git if not already
if [ ! -d .git ]; then
    git init

    # Create .gitignore if it doesn't exist
    if [ ! -f .gitignore ]; then
        cat > .gitignore << 'EOF'
venv/
__pycache__/
*.pyc
.env
.DS_Store
*.log
instance/
.pytest_cache/
.coverage
htmlcov/
dist/
build/
*.egg-info/
EOF
    fi
fi

git add .
git commit -m "Deploy Flask app to production

- Automated deployment via deploy-flask.sh
- Target: https://$DOMAIN_NAME
- Server: $SERVER_IP" || echo "No changes to commit"

git branch -M main
git remote remove origin 2>/dev/null || true
git remote add origin "git@github.com:Soulfra/${REPO_NAME}.git"
git push -u origin main --force

echo -e "${YELLOW}Step 3/8: Installing Python and dependencies on server...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Install Python 3 and pip if not already installed
if ! command -v python3 &> /dev/null; then
    apt-get update
    apt-get install -y python3 python3-pip python3-venv
fi

# Install nginx if not already installed
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
fi

echo "✓ Server dependencies installed"
ENDSSH

echo -e "${YELLOW}Step 4/8: Cloning application to server...${NC}"
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

# Create virtual environment
python3 -m venv venv

# Activate and install dependencies
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo "✓ Application cloned and dependencies installed"
ENDSSH

echo -e "${YELLOW}Step 5/8: Creating gunicorn service...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Detect Flask app object
FLASK_APP="${FLASK_APP_FILE%.*}"  # Remove .py extension

# Create systemd service file
cat > /etc/systemd/system/${APP_NAME}.service << EOF
[Unit]
Description=Gunicorn instance to serve ${APP_NAME}
After=network.target

[Service]
User=${SERVER_USER}
Group=www-data
WorkingDirectory=/var/www/${APP_NAME}
Environment="PATH=/var/www/${APP_NAME}/venv/bin"
ExecStart=/var/www/${APP_NAME}/venv/bin/gunicorn --workers 3 --bind unix:/var/www/${APP_NAME}/${APP_NAME}.sock -m 007 \${FLASK_APP}:app

[Install]
WantedBy=multi-user.target
EOF

# Start and enable service
systemctl daemon-reload
systemctl start ${APP_NAME}
systemctl enable ${APP_NAME}

echo "✓ Gunicorn service created and started"
ENDSSH

echo -e "${YELLOW}Step 6/8: Configuring nginx reverse proxy...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Create nginx config
cat > /etc/nginx/sites-available/${APP_NAME} << 'EOF'
server {
    listen 80;
    server_name ${DOMAIN_NAME} www.${DOMAIN_NAME};

    location / {
        include proxy_params;
        proxy_pass http://unix:/var/www/${APP_NAME}/${APP_NAME}.sock;
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

echo -e "${YELLOW}Step 7/8: Setting up SSL with Let's Encrypt...${NC}"
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

echo -e "${YELLOW}Step 8/8: Verifying deployment...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Check service status
systemctl status ${APP_NAME} --no-pager | head -5

# Check if socket exists
if [ -S /var/www/${APP_NAME}/${APP_NAME}.sock ]; then
    echo "✓ Gunicorn socket created"
else
    echo "⚠ Warning: Gunicorn socket not found"
fi
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
echo "  SSH into server:       ssh ${SERVER_USER}@${SERVER_IP}"
echo "  View app logs:         journalctl -u ${APP_NAME} -f"
echo "  Restart app:           systemctl restart ${APP_NAME}"
echo "  Stop app:              systemctl stop ${APP_NAME}"
echo "  Check app status:      systemctl status ${APP_NAME}"
echo "  Nginx error logs:      tail -f /var/log/nginx/error.log"
echo ""
echo -e "${YELLOW}To Update Your App:${NC}"
echo "  1. Make changes locally"
echo "  2. git add . && git commit -m 'Update' && git push"
echo "  3. ssh ${SERVER_USER}@${SERVER_IP}"
echo "  4. cd /var/www/${APP_NAME} && git pull"
echo "  5. source venv/bin/activate && pip install -r requirements.txt"
echo "  6. sudo systemctl restart ${APP_NAME}"
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
echo "   sudo systemctl restart ${APP_NAME}"
echo ""
echo "3. SSL certificate auto-renews via certbot"
echo ""
echo "4. Gunicorn runs 3 workers by default"
echo "   Adjust in: /etc/systemd/system/${APP_NAME}.service"
echo ""
echo "Your Flask app is now live with HTTPS! 🚀"
echo ""
