#!/bin/bash

# ============================================================================
# DEPLOY DATABASE - Simple Template
# ============================================================================
#
# This sets up PostgreSQL or MySQL on a VPS with backups and security
#
# USAGE:
#   ./deploy-database.sh <database-type> <database-name> <server-ip>
#
# EXAMPLE:
#   ./deploy-database.sh postgres deathtodata_db 192.168.1.100
#   ./deploy-database.sh mysql myapp_db 192.168.1.100
#
# WHAT THIS DOES:
#   1. Installs PostgreSQL or MySQL
#   2. Creates database and user with secure password
#   3. Configures firewall rules
#   4. Sets up automated backups (daily)
#   5. Enables remote access (optional)
#   6. Creates connection string for your apps
#
# REQUIREMENTS:
#   - VPS with Ubuntu/Debian
#   - SSH access to server
#
# RESULT:
#   Production-ready database with backups and security configured
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
    echo "Usage: $0 <database-type> <database-name> <server-ip>"
    echo ""
    echo "Database types: postgres, mysql"
    echo ""
    echo "Examples:"
    echo "  $0 postgres deathtodata_db 192.168.1.100"
    echo "  $0 mysql myapp_db 192.168.1.100"
    echo ""
    exit 1
fi

DB_TYPE="$1"
DB_NAME="$2"
SERVER_IP="$3"
SERVER_USER="root"  # Change if using non-root user
DB_USER="${DB_NAME}_user"
DB_PASS=$(openssl rand -base64 32)
BACKUP_DIR="/var/backups/databases"

# Validate database type
if [[ "$DB_TYPE" != "postgres" && "$DB_TYPE" != "mysql" ]]; then
    echo -e "${RED}Error: Invalid database type: $DB_TYPE${NC}"
    echo "Valid types: postgres, mysql"
    exit 1
fi

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deploying Database Server${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Type: $DB_TYPE"
echo "Database: $DB_NAME"
echo "Server: $SERVER_IP"
echo ""

# Check SSH connectivity
echo -e "${YELLOW}Checking server connectivity...${NC}"
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes ${SERVER_USER}@${SERVER_IP} exit 2>/dev/null; then
    echo -e "${RED}Error: Cannot connect to ${SERVER_USER}@${SERVER_IP}${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Server connection successful${NC}"

if [ "$DB_TYPE" == "postgres" ]; then
    echo -e "${YELLOW}Step 1/6: Installing PostgreSQL...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    # Install PostgreSQL
    if ! command -v psql &> /dev/null; then
        apt-get update
        apt-get install -y postgresql postgresql-contrib
    fi

    # Start and enable PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql

    echo "✓ PostgreSQL installed"
ENDSSH

    echo -e "${YELLOW}Step 2/6: Creating database and user...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
    # Create database and user
    sudo -u postgres psql << EOF
CREATE DATABASE ${DB_NAME};
CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASS}';
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
\c ${DB_NAME}
GRANT ALL ON SCHEMA public TO ${DB_USER};
EOF

    echo "✓ Database and user created"
ENDSSH

    echo -e "${YELLOW}Step 3/6: Configuring PostgreSQL for remote access...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    # Find PostgreSQL config directory
    PG_VERSION=$(psql --version | grep -oP '\d+(?=\.\d+)')
    PG_CONF="/etc/postgresql/${PG_VERSION}/main"

    # Allow remote connections
    if ! grep -q "listen_addresses = '*'" ${PG_CONF}/postgresql.conf; then
        sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" ${PG_CONF}/postgresql.conf
    fi

    # Allow password authentication
    if ! grep -q "host all all 0.0.0.0/0 md5" ${PG_CONF}/pg_hba.conf; then
        echo "host all all 0.0.0.0/0 md5" >> ${PG_CONF}/pg_hba.conf
    fi

    # Restart PostgreSQL
    systemctl restart postgresql

    echo "✓ Remote access configured"
ENDSSH

    CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASS}@${SERVER_IP}:5432/${DB_NAME}"
    DEFAULT_PORT=5432

elif [ "$DB_TYPE" == "mysql" ]; then
    echo -e "${YELLOW}Step 1/6: Installing MySQL...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    # Install MySQL
    if ! command -v mysql &> /dev/null; then
        apt-get update
        apt-get install -y mysql-server
    fi

    # Start and enable MySQL
    systemctl start mysql
    systemctl enable mysql

    echo "✓ MySQL installed"
ENDSSH

    echo -e "${YELLOW}Step 2/6: Creating database and user...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
    # Create database and user
    mysql << EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'%' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'%';
FLUSH PRIVILEGES;
EOF

    echo "✓ Database and user created"
ENDSSH

    echo -e "${YELLOW}Step 3/6: Configuring MySQL for remote access...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
    # Allow remote connections
    if ! grep -q "bind-address = 0.0.0.0" /etc/mysql/mysql.conf.d/mysqld.cnf; then
        sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf
    fi

    # Restart MySQL
    systemctl restart mysql

    echo "✓ Remote access configured"
ENDSSH

    CONNECTION_STRING="mysql://${DB_USER}:${DB_PASS}@${SERVER_IP}:3306/${DB_NAME}"
    DEFAULT_PORT=3306
fi

echo -e "${YELLOW}Step 4/6: Configuring firewall...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Install ufw if not present
if ! command -v ufw &> /dev/null; then
    apt-get install -y ufw
fi

# Allow SSH (don't lock yourself out!)
ufw allow 22/tcp

# Allow database port
ufw allow ${DEFAULT_PORT}/tcp

# Enable firewall (non-interactive)
echo "y" | ufw enable

echo "✓ Firewall configured"
ENDSSH

echo -e "${YELLOW}Step 5/6: Setting up automated backups...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Create backup directory
mkdir -p ${BACKUP_DIR}

# Create backup script
if [ "$DB_TYPE" == "postgres" ]; then
    cat > /usr/local/bin/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="${BACKUP_DIR}"
DB_NAME="${DB_NAME}"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\${BACKUP_DIR}/\${DB_NAME}_\${TIMESTAMP}.sql.gz"

# Create backup
sudo -u postgres pg_dump \${DB_NAME} | gzip > \${BACKUP_FILE}

# Keep only last 30 days of backups
find \${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

echo "Backup created: \${BACKUP_FILE}"
EOF
else
    cat > /usr/local/bin/backup-database.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="${BACKUP_DIR}"
DB_NAME="${DB_NAME}"
DB_USER="${DB_USER}"
DB_PASS="${DB_PASS}"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="\${BACKUP_DIR}/\${DB_NAME}_\${TIMESTAMP}.sql.gz"

# Create backup
mysqldump -u\${DB_USER} -p\${DB_PASS} \${DB_NAME} | gzip > \${BACKUP_FILE}

# Keep only last 30 days of backups
find \${BACKUP_DIR} -name "*.sql.gz" -mtime +30 -delete

echo "Backup created: \${BACKUP_FILE}"
EOF
fi

# Make script executable
chmod +x /usr/local/bin/backup-database.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-database.sh >> /var/log/database-backup.log 2>&1") | crontab -

echo "✓ Automated backups configured (daily at 2 AM)"
ENDSSH

echo -e "${YELLOW}Step 6/6: Testing connection...${NC}"
ssh ${SERVER_USER}@${SERVER_IP} << ENDSSH
# Test connection
if [ "$DB_TYPE" == "postgres" ]; then
    sudo -u postgres psql -d ${DB_NAME} -c "SELECT version();" > /dev/null
    if [ \$? -eq 0 ]; then
        echo "✓ PostgreSQL connection test successful"
    else
        echo "⚠ Connection test failed"
    fi
else
    mysql -u${DB_USER} -p${DB_PASS} -e "USE ${DB_NAME};" > /dev/null 2>&1
    if [ \$? -eq 0 ]; then
        echo "✓ MySQL connection test successful"
    else
        echo "⚠ Connection test failed"
    fi
fi
ENDSSH

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Database Type: $DB_TYPE"
echo "Database Name: $DB_NAME"
echo "Server: $SERVER_IP"
echo "Port: $DEFAULT_PORT"
echo ""
echo -e "${YELLOW}Database Credentials:${NC}"
echo "  Username: $DB_USER"
echo "  Password: $DB_PASS"
echo ""
echo -e "${RED}IMPORTANT: Save these credentials securely!${NC}"
echo ""
echo -e "${YELLOW}Connection String:${NC}"
echo "  $CONNECTION_STRING"
echo ""
echo -e "${YELLOW}Server Management Commands:${NC}"
echo "  SSH into server:        ssh ${SERVER_USER}@${SERVER_IP}"

if [ "$DB_TYPE" == "postgres" ]; then
    echo "  Connect to database:    sudo -u postgres psql ${DB_NAME}"
    echo "  List databases:         sudo -u postgres psql -l"
    echo "  Check status:           systemctl status postgresql"
    echo "  View logs:              tail -f /var/log/postgresql/postgresql-*-main.log"
else
    echo "  Connect to database:    mysql -u${DB_USER} -p${DB_PASS} ${DB_NAME}"
    echo "  List databases:         mysql -u${DB_USER} -p${DB_PASS} -e 'SHOW DATABASES;'"
    echo "  Check status:           systemctl status mysql"
    echo "  View logs:              tail -f /var/log/mysql/error.log"
fi

echo ""
echo -e "${YELLOW}Backup Management:${NC}"
echo "  Backup location:        ${BACKUP_DIR}"
echo "  Backup schedule:        Daily at 2:00 AM"
echo "  Retention:              30 days"
echo "  Manual backup:          /usr/local/bin/backup-database.sh"
echo "  View backup logs:       tail -f /var/log/database-backup.log"
echo ""
echo -e "${YELLOW}Security Notes:${NC}"
echo "1. Firewall configured to allow port ${DEFAULT_PORT}"
echo "2. Remote access enabled (use SSL in production!)"
echo "3. Strong password generated automatically"
echo "4. Automated backups configured"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test connection from your app:"

if [ "$DB_TYPE" == "postgres" ]; then
    echo "   psql \"${CONNECTION_STRING}\""
else
    echo "   mysql -h${SERVER_IP} -u${DB_USER} -p${DB_PASS} ${DB_NAME}"
fi

echo ""
echo "2. Update your app's .env file with connection string"
echo ""
echo "3. Consider setting up SSL/TLS for production"
echo ""
echo "Your database is now live and backed up! 🚀"
echo ""
