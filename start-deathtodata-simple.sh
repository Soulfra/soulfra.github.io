#!/bin/bash

# ============================================================================
# Start DeathToData - DEAD SIMPLE (No Cron, No PM2, No Bullshit)
# ============================================================================
#
# This script does ONE thing: Makes DeathToData live
#
# WHAT IT DOES:
#   1. Starts backend on localhost:5051
#   2. Creates public tunnel (ngrok OR localtunnel)
#   3. Shows you the URL
#   4. That's it
#
# USAGE:
#   ./start-deathtodata-simple.sh
#
# STOP IT:
#   Just Ctrl+C
#
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if already running
if lsof -ti:5051 > /dev/null 2>&1; then
    echo -e "${RED}⚠️  Backend already running on port 5051${NC}"
    echo "Kill it with: lsof -ti:5051 | xargs kill -9"
    exit 1
fi

echo -e "${GREEN}🚀 Starting DeathToData...${NC}"
echo ""

# Change to project directory
cd "$(dirname "$0")"

# Start backend in background
echo -e "${YELLOW}Starting backend...${NC}"
node api/deathtodata-backend.js > /tmp/deathtodata-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to be ready
sleep 2

if ! lsof -ti:5051 > /dev/null 2>&1; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    echo "Check logs: tail /tmp/deathtodata-backend.log"
    exit 1
fi

echo -e "${GREEN}✅ Backend running on localhost:5051${NC}"

# Choose tunnel method
if command -v ngrok &> /dev/null; then
    echo -e "${YELLOW}Starting ngrok tunnel...${NC}"
    ngrok http 5051 --log /tmp/ngrok.log --log-format json > /dev/null 2>&1 &
    TUNNEL_PID=$!

    # Wait for ngrok to start
    sleep 2

    # Get public URL
    PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null || echo "")

    if [ -z "$PUBLIC_URL" ]; then
        echo -e "${RED}❌ ngrok failed to start${NC}"
        lsof -ti:5051 | xargs kill -9
        exit 1
    fi

elif command -v lt &> /dev/null; then
    echo -e "${YELLOW}Starting localtunnel...${NC}"
    lt --port 5051 --subdomain deathtodata > /tmp/localtunnel.log 2>&1 &
    TUNNEL_PID=$!

    # Wait for tunnel to start
    sleep 3

    PUBLIC_URL=$(grep -o 'https://[^[:space:]]*' /tmp/localtunnel.log | head -1 || echo "")

    if [ -z "$PUBLIC_URL" ]; then
        echo -e "${RED}❌ localtunnel failed to start${NC}"
        lsof -ti:5051 | xargs kill -9
        exit 1
    fi

else
    echo -e "${RED}❌ No tunnel service found${NC}"
    echo "Install one:"
    echo "  ngrok: brew install ngrok"
    echo "  localtunnel: npm install -g localtunnel"
    lsof -ti:5051 | xargs kill -9
    exit 1
fi

echo -e "${GREEN}✅ Tunnel active${NC}"
echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  DeathToData is LIVE${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "Local:  ${YELLOW}http://localhost:5051${NC}"
echo -e "Public: ${YELLOW}$PUBLIC_URL${NC}"
echo ""
echo -e "${YELLOW}Test it:${NC}"
echo "curl -s '$PUBLIC_URL/api/search?q=privacy' | jq ."
echo ""
echo -e "${YELLOW}Update frontend:${NC}"
echo "Edit deathtodata/search.html line 279:"
echo "  const API_URL = '$PUBLIC_URL';"
echo ""
echo -e "${RED}Press Ctrl+C to stop${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    kill $BACKEND_PID $TUNNEL_PID 2>/dev/null
    echo -e "${GREEN}✅ DeathToData stopped${NC}"
    exit 0
}

trap cleanup INT TERM

# Wait forever
wait
