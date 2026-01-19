#!/bin/bash

# Deploy DeathToData to Production
# Usage: ./deploy-deathtodata.sh "Commit message"

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get commit message from argument or use default
COMMIT_MSG="${1:-Deploy: $(date '+%Y-%m-%d %H:%M:%S')}"

echo -e "${BLUE}🚀 DeathToData Deployment Script${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "deathtodata" ]; then
  echo -e "${RED}❌ Error: deathtodata/ directory not found${NC}"
  echo -e "${YELLOW}   Run this script from the root of soulfra.github.io${NC}"
  exit 1
fi

# Check if git repo
if [ ! -d ".git" ]; then
  echo -e "${RED}❌ Error: Not a git repository${NC}"
  echo -e "${YELLOW}   This script is for GitHub Pages deployment${NC}"
  exit 1
fi

# Step 1: Show status
echo -e "${BLUE}📊 Git Status:${NC}"
git status --short
echo ""

# Step 2: Add all changes
echo -e "${BLUE}➕ Adding changes...${NC}"
git add .
echo -e "${GREEN}✅ Changes staged${NC}"
echo ""

# Step 3: Commit
echo -e "${BLUE}💾 Committing: ${YELLOW}${COMMIT_MSG}${NC}"
git commit -m "$COMMIT_MSG" || {
  echo -e "${YELLOW}⚠️  No changes to commit${NC}"
  echo -e "${BLUE}ℹ️  Checking remote status...${NC}"
  git fetch origin
  BEHIND=$(git rev-list HEAD..origin/main --count 2>/dev/null || echo "0")
  if [ "$BEHIND" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  You are $BEHIND commits behind origin/main${NC}"
    echo -e "${YELLOW}   Run: git pull origin main${NC}"
  else
    echo -e "${GREEN}✅ Already up to date${NC}"
  fi
  exit 0
}
echo -e "${GREEN}✅ Committed${NC}"
echo ""

# Step 4: Push to GitHub
echo -e "${BLUE}🌐 Pushing to GitHub...${NC}"
git push origin main
echo -e "${GREEN}✅ Pushed to GitHub${NC}"
echo ""

# Step 5: Deployment info
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Deployment initiated!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⏳ GitHub Pages will deploy in ~1-2 minutes${NC}"
echo ""
echo -e "${BLUE}📍 Production URLs:${NC}"
echo -e "   Homepage:  ${GREEN}https://soulfra.github.io/${NC}"
echo -e "   Search:    ${GREEN}https://soulfra.github.io/deathtodata/search.html${NC}"
echo -e "   Dashboard: ${GREEN}https://soulfra.github.io/deathtodata/dashboard.html${NC}"
echo ""
echo -e "${BLUE}🔍 Check deployment status:${NC}"
echo -e "   ${GREEN}https://github.com/soulfra/soulfra.github.io/actions${NC}"
echo ""
echo -e "${YELLOW}💡 Remember to hard refresh (Cmd+Shift+R) to see changes${NC}"
echo ""

# Optional: Open GitHub Actions in browser
read -p "$(echo -e ${BLUE}Open GitHub Actions to monitor deployment? [y/N]: ${NC})" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  if command -v open &> /dev/null; then
    open "https://github.com/soulfra/soulfra.github.io/actions"
  elif command -v xdg-open &> /dev/null; then
    xdg-open "https://github.com/soulfra/soulfra.github.io/actions"
  else
    echo -e "${YELLOW}⚠️  Could not open browser automatically${NC}"
    echo -e "${BLUE}   Visit: https://github.com/soulfra/soulfra.github.io/actions${NC}"
  fi
fi

echo ""
echo -e "${GREEN}✅ Deployment script complete${NC}"
