#!/bin/bash

# ============================================================================
# DEPLOY WORDPRESS - Simple Template
# ============================================================================
#
# This deploys a WordPress site to a VPS with MySQL, SSL, and auto-updates
#
# USAGE:
#   ./deploy-wordpress.sh <domain-name> <server-ip>
#
# EXAMPLE:
#   ./deploy-wordpress.sh myblog.com 192.168.1.100
#
# WHAT THIS DOES:
#   1. Installs LAMP stack (Linux, Apache, MySQL, PHP)
#   2. Downloads and configures WordPress
#   3. Creates MySQL database and user
#   4. Sets up SSL with Let's Encrypt
#   5. Configures auto-updates and security
#
# REQUIREMENTS:
#   - VPS with Ubuntu/Debian (DigitalOcean, Linode, etc.)
#   - SSH access to server
#   - Domain pointing to server IP
#
# RESULT:
#   Fresh WordPress installation at https://<domain-name>
#
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Missing arguments${NC}"
    echo ""
    echo "Usage: $0 <domain-name> <server-ip>"
    echo ""
    echo "Example:"
    echo "  $0 myblog.com 192.168.1.100"
    echo "  This installs WordPress at myblog.com on server 192.168.1.100"
    echo ""
    exit 1
fi

DOMAIN_NAME="$1"
SERVER_IP="$2"
SERVER_USER="root"  # Change if using non-root user
DB_NAME="wordpress_$(date +%s)"
DB_USER="wp_user_$(date +%s)"
DB_PASS=$(openssl rand -base64 32)
WP_ADMIN_USER="admin"
WP_ADMIN_PASS=$(openssl rand -base64 16)
WP_ADMIN_EMAIL="admin@${DOMAIN_NAME}"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deploying WordPress Site${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Domain: $DOMAIN_NAME"
echo "Server: $SERVER_IP"
echo ""

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

echo -e "${YELLOW}Step 1/6: Installing LAMP stack...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
# Update package list
apt-get update

# Install Apache
if ! command -v apache2 &> /dev/null; then
    apt-get install -y apache2
    systemctl enable apache2
fi

# Install MySQL
if ! command -v mysql &> /dev/null; then
    apt-get install -y mysql-server
    systemctl enable mysql
fi

# Install PHP and required extensions
if ! command -v php &> /dev/null; then
    apt-get install -y php libapache2-mod-php php-mysql php-curl php-gd php-mbstring php-xml php-xmlrpc php-zip php-intl
fi

# Enable Apache modules
a2enmod rewrite
a2enmod ssl

echo "✓ LAMP stack installed"
ENDSSH

echo -e "${YELLOW}Step 2/6: Creating MySQL database and user...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Create database and user
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "✓ Database created: ${DB_NAME}"
echo "✓ Database user created: ${DB_USER}"
ENDSSH

echo -e "${YELLOW}Step 3/6: Downloading and configuring WordPress...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Create web directory
mkdir -p /var/www/${DOMAIN_NAME}
cd /var/www/${DOMAIN_NAME}

# Download WordPress
wget -q https://wordpress.org/latest.tar.gz
tar -xzf latest.tar.gz
mv wordpress/* .
rm -rf wordpress latest.tar.gz

# Create wp-config.php
cp wp-config-sample.php wp-config.php

# Configure database settings
sed -i "s/database_name_here/${DB_NAME}/" wp-config.php
sed -i "s/username_here/${DB_USER}/" wp-config.php
sed -i "s/password_here/${DB_PASS}/" wp-config.php

# Generate WordPress salts
SALT=\$(curl -s https://api.wordpress.org/secret-key/1.1/salt/)
printf '%s\n' "g?define( 'AUTH_KEY'?define( 'SECURE_AUTH_SALT'?,d" "a" "SALT" "." "wq" | ed -s wp-config.php 2>/dev/null || {
    # Fallback if ed fails - use a simpler method
    echo "\$SALT" >> wp-config.php
}

# Set file permissions
chown -R www-data:www-data /var/www/${DOMAIN_NAME}
find /var/www/${DOMAIN_NAME} -type d -exec chmod 755 {} \;
find /var/www/${DOMAIN_NAME} -type f -exec chmod 644 {} \;

echo "✓ WordPress downloaded and configured"
ENDSSH

echo -e "${YELLOW}Step 4/6: Configuring Apache virtual host...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Create Apache config
cat > /etc/apache2/sites-available/${DOMAIN_NAME}.conf << 'EOF'
<VirtualHost *:80>
    ServerName ${DOMAIN_NAME}
    ServerAlias www.${DOMAIN_NAME}
    DocumentRoot /var/www/${DOMAIN_NAME}

    <Directory /var/www/${DOMAIN_NAME}>
        Options FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/${DOMAIN_NAME}-error.log
    CustomLog \${APACHE_LOG_DIR}/${DOMAIN_NAME}-access.log combined
</VirtualHost>
EOF

# Enable site and disable default
a2ensite ${DOMAIN_NAME}.conf
a2dissite 000-default.conf 2>/dev/null || true

# Test Apache config
apache2ctl configtest

# Reload Apache
systemctl reload apache2

echo "✓ Apache configured and reloaded"
ENDSSH

echo -e "${YELLOW}Step 5/6: Setting up SSL with Let's Encrypt...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    apt-get update
    apt-get install -y certbot python3-certbot-apache
fi

# Obtain SSL certificate (non-interactive)
certbot --apache -d ${DOMAIN_NAME} -d www.${DOMAIN_NAME} --non-interactive --agree-tos --email ${WP_ADMIN_EMAIL} --redirect

echo "✓ SSL certificate installed"
ENDSSH

echo -e "${YELLOW}Step 6/6: Installing WordPress via WP-CLI...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Install WP-CLI if not already installed
if ! command -v wp &> /dev/null; then
    curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
    chmod +x wp-cli.phar
    mv wp-cli.phar /usr/local/bin/wp
fi

# Complete WordPress installation
cd /var/www/${DOMAIN_NAME}
wp core install --url="https://${DOMAIN_NAME}" --title="Welcome to ${DOMAIN_NAME}" --admin_user="${WP_ADMIN_USER}" --admin_password="${WP_ADMIN_PASS}" --admin_email="${WP_ADMIN_EMAIL}" --allow-root

# Install recommended security plugins
wp plugin install wordfence --activate --allow-root
wp plugin install updraftplus --activate --allow-root

# Enable auto-updates
wp plugin auto-updates enable --all --allow-root
wp theme auto-updates enable --all --allow-root
wp core auto-updates enable --allow-root

echo "✓ WordPress installed and configured"
ENDSSH

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "WordPress URL: https://$DOMAIN_NAME"
echo "Admin URL: https://$DOMAIN_NAME/wp-admin"
echo ""
echo -e "${YELLOW}WordPress Credentials:${NC}"
echo "  Username: $WP_ADMIN_USER"
echo "  Password: $WP_ADMIN_PASS"
echo "  Email: $WP_ADMIN_EMAIL"
echo ""
echo -e "${RED}IMPORTANT: Save these credentials securely!${NC}"
echo ""
echo -e "${YELLOW}Database Credentials:${NC}"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASS"
echo ""
echo -e "${YELLOW}Important Notes:${NC}"
echo "1. Make sure your domain DNS points to: $SERVER_IP"
echo "   - A record: @ -> $SERVER_IP"
echo "   - CNAME: www -> $DOMAIN_NAME"
echo ""
echo "2. Change your admin password after first login"
echo ""
echo "3. Installed security plugins:"
echo "   - Wordfence (firewall & malware scanning)"
echo "   - UpdraftPlus (backup & restore)"
echo ""
echo "4. Auto-updates are enabled for:"
echo "   - WordPress core"
echo "   - All plugins"
echo "   - All themes"
echo ""
echo "5. SSL certificate auto-renews via certbot"
echo ""
echo "Your WordPress site is now live with HTTPS! 🚀"
echo ""
