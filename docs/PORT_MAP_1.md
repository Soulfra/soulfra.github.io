# COMPLETE PORT MAP - All Systems

## Currently Running
- Port 8080: ACTUALLY_WORKING_SYSTEM.js ✅
- Port 8888: PRODUCTION_LEGAL_SYSTEM.js ✅

## Core Platform Systems
- Port 3003: ai-economy-scoreboard.js - AI Economy Game
- Port 4040: runtime/riven-cli-server.js - Cal Dashboard  
- Port 5055: domingo-surface/domingo-bounty-economy.js - Domingo Economy
- Port 8889: UNIFIED_WORKING_DASHBOARD.js - Unified Dashboard

## Gaming/Arena Systems
- Port 3333: RUNESCAPE_DUEL_ARENA_REVOLUTION.js - RuneScape Arena
- Port 6666: billion-dollar-arena.js - Billion Dollar Arena
- Port 7777: tier-minus20/altercation_valley_arena.js - Altercation Valley

## Infrastructure Systems
- Port 4000: mirror-os-demo/server.js - Mirror OS Demo
- Port 8000: blank-kernel-server.js - Blank Kernel
- Port 9090: infinity-router-server.js - Infinity Router

## Tier Systems
- Port 5000: enterprise-semantic-dashboard.js - Enterprise Dashboard
- Port 5500: consciousness-commerce-server.js - Consciousness Commerce
- Port 6000: mirrorhub_server.js - MirrorHub

## API/Service Systems  
- Port 4041: platform/backend/api/cal-api-server.js - Cal API
- Port 4042: Platform API
- Port 4043: mirror-os-demo/modules/qr-checkin/qr-server.js - QR Server
- Port 4044: promotion-server.js - Promotion Server
- Port 4045: monetization-server.js - Monetization Server

## Integration Systems
- Port 7000: unified-economy-mesh.js - Economy Mesh
- Port 3030: voice-server-enhancement.js - Voice Server

## Domain Requirements
You mentioned 130 domains - we need:
1. Reverse proxy (nginx/caddy) to route domains to ports
2. Docker containers for each service
3. Kubernetes or Docker Compose for orchestration
4. Load balancer for scaling

## Next Steps
1. Get all local systems running first
2. Create docker-compose.yml for all services
3. Setup reverse proxy for domain routing
4. Deploy to cloud infrastructure