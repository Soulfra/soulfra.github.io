#!/bin/bash

# ============================================================================
# DEPLOY STATIC SITE - Simple Template
# ============================================================================
#
# This deploys ANY static website (HTML/CSS/JS) to GitHub Pages with SSL
#
# USAGE:
#   ./deploy-static.sh <site-directory> <domain-name>
#
# EXAMPLE:
#   ./deploy-static.sh ~/my-website mysite
#
# WHAT THIS DOES:
#   1. Creates GitHub repo: <domain-name>.github.io
#   2. Pushes your files
#   3. Enables GitHub Pages (auto SSL)
#   4. Adds CNAME for custom domain
#
# RESULT:
#   Your site live at https://<domain-name>.com
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
    echo "Usage: $0 <site-directory> <domain-name>"
    echo ""
    echo "Example:"
    echo "  $0 ~/my-website mysite"
    echo "  This deploys ~/my-website to mysite.github.io"
    echo ""
    exit 1
fi

SITE_DIR="$1"
DOMAIN_NAME="$2"
REPO_NAME="${DOMAIN_NAME}.github.io"
TEMP_DIR="/tmp/${REPO_NAME}"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deploying Static Site${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Site: $SITE_DIR"
echo "Domain: $DOMAIN_NAME"
echo "Repo: $REPO_NAME"
echo ""

# Check if site directory exists
if [ ! -d "$SITE_DIR" ]; then
    echo -e "${RED}Error: Site directory not found: $SITE_DIR${NC}"
    exit 1
fi

# Check if index.html exists
if [ ! -f "$SITE_DIR/index.html" ]; then
    echo -e "${YELLOW}Warning: No index.html found in $SITE_DIR${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${YELLOW}Step 1/5: Creating GitHub repository...${NC}"
gh repo create "$REPO_NAME" --public || echo "Repo may already exist, continuing..."

echo -e "${YELLOW}Step 2/5: Copying files to temp directory...${NC}"
rm -rf "$TEMP_DIR"
cp -r "$SITE_DIR" "$TEMP_DIR"
cd "$TEMP_DIR"

# Remove git files if they exist
rm -rf .git .DS_Store

echo -e "${YELLOW}Step 3/5: Initializing git and committing...${NC}"
git init
git add .
git commit -m "Deployed with deploy-static.sh template

- Automated deployment
- Source: $SITE_DIR
- Target: https://$DOMAIN_NAME.com"
git branch -M main

echo -e "${YELLOW}Step 4/5: Adding CNAME...${NC}"
echo "$DOMAIN_NAME.com" > CNAME
git add CNAME
git commit -m "Add CNAME for custom domain"

echo -e "${YELLOW}Step 5/5: Pushing to GitHub...${NC}"
git remote add origin "git@github.com:Soulfra/${REPO_NAME}.git"
git push -u origin main --force

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Repository: https://github.com/Soulfra/$REPO_NAME"
echo "GitHub Pages URL: https://soulfra.github.io/$REPO_NAME"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Wait 1-2 minutes for GitHub Pages to build"
echo "2. Add DNS records to point $DOMAIN_NAME.com to GitHub Pages:"
echo "   - A record: @ -> 185.199.108.153"
echo "   - A record: @ -> 185.199.109.153"
echo "   - A record: @ -> 185.199.110.153"
echo "   - A record: @ -> 185.199.111.153"
echo "   - CNAME: www -> soulfra.github.io"
echo ""
echo "Your site will be live at: https://$DOMAIN_NAME.com (with SSL!)"
echo ""
