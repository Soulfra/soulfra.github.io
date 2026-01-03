#!/bin/bash
# Test All GitHub Pages Sites Locally
# Usage: ./test-all-sites.sh

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}🧪 Testing All Sites on localhost:8000${NC}\n"

# Check if server is running
if ! curl -s http://localhost:8000/ > /dev/null 2>&1; then
  echo -e "${RED}❌ Server not running on port 8000${NC}"
  echo "Start server with: python3 -m http.server 8000"
  exit 1
fi

# Test root (soulfra.com)
echo -n "Testing soulfra.com (root)... "
if curl -s http://localhost:8000/ | grep -q "<title>"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

# Test cringeproof subdirectory
echo -n "Testing cringeproof.com (/cringeproof/)... "
if curl -s http://localhost:8000/cringeproof/ | grep -q "<title>"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌${NC}"
fi

# Test calriven subdirectory
echo -n "Testing calriven.com (/calriven/)... "
if curl -s http://localhost:8000/calriven/ | grep -q "<title>"; then
  echo -e "${GREEN}✅${NC}"
else
  echo -e "${RED}❌ Not found (create calriven/ directory)${NC}"
fi

# Test other cringeproof variants
echo -e "\n${CYAN}Cringeproof Variants:${NC}"
for variant in cringeproof-sports cringeproof-crypto cringeproof-purple cringeproof-qr; do
  echo -n "  /$variant/... "
  if curl -s http://localhost:8000/$variant/ | grep -q "<title>"; then
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "${RED}❌${NC}"
  fi
done

# Test individual files
echo -e "\n${CYAN}Individual Files:${NC}"
for file in mobile.html cringeproof-live.html qr-scanner.html email-friends-signup.html; do
  echo -n "  /$file... "
  if curl -s http://localhost:8000/$file | grep -q "<title>"; then
    echo -e "${GREEN}✅${NC}"
  else
    echo -e "${RED}❌${NC}"
  fi
done

echo -e "\n${GREEN}✨ Testing complete!${NC}"
