#!/bin/bash

# ============================================================================
# DeathToData Startup Script
# ============================================================================
#
# This script starts everything you need for DeathToData:
# 1. Backend API (localhost:5051)
# 2. localtunnel (exposes to internet via wicked-geckos-do.loca.lt)
#
# Usage:
#   ./start-deathtodata.sh
#
# ============================================================================

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Starting DeathToData${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Kill any existing backend on 5051
echo -e "${YELLOW}Stopping any existing backend...${NC}"
lsof -ti:5051 | xargs kill -9 2>/dev/null || echo "No existing backend found"

# Start backend
echo -e "${YELLOW}Starting DeathToData backend...${NC}"
node api/deathtodata-backend.js > /tmp/deathtodata-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${YELLOW}Waiting for backend to start...${NC}"
sleep 3

# Check if backend is running
if ps -p $BACKEND_PID > /dev/null; then
   echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
else
   echo -e "${RED}✗ Backend failed to start${NC}"
   echo "Check logs: tail -f /tmp/deathtodata-backend.log"
   exit 1
fi

# Start localtunnel
echo -e "${YELLOW}Starting localtunnel...${NC}"
echo -e "${YELLOW}This will expose localhost:5051 to the internet${NC}"
echo ""

# Check if localtunnel is installed
if ! command -v lt &> /dev/null; then
    echo -e "${YELLOW}localtunnel not found. Installing...${NC}"
    npm install -g localtunnel
fi

# Start tunnel with subdomain (may not always get the same subdomain)
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  DeathToData is Starting!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "${GREEN}Backend:${NC}  http://localhost:5051"
echo -e "${GREEN}Tunnel:${NC}   https://wicked-geckos-do.loca.lt (attempting...)"
echo ""
echo -e "${YELLOW}Starting tunnel...${NC}"
echo ""

# Try to get the wicked-geckos-do subdomain
# Note: This may not always work if someone else took it
lt --port 5051 --subdomain wicked-geckos-do

# If tunnel dies, cleanup
trap 'kill $BACKEND_PID 2>/dev/null' EXIT
