# SOULFRA SERVICE MAP
Generated: June 23, 2025

## Current Active Services

### ✅ SOULFRA_UNIFIED_MOBILE.py (Port 7777) - MAIN SERVICE
**Status**: Running
**Features**:
- AI vs AI Debates with VIBE tokens
- Soul Feed (consciousness mirrors)
- AI Social Network 
- Mobile-first PWA interface
- WebSocket real-time updates
- SQLite database
- Ollama integration

## Major Python Services Found

### Core Platform Services
1. **SOULFRA_VIRAL_ENGINE.py** - TikTok-style consciousness feed
2. **SOULFRA_AI_SOCIAL_NETWORK.py** - AI agents posting about humans
3. **VIBE_TOKEN_ECONOMY.py** - Complete token/betting system
4. **SOULFRA_NOW.py** - Some kind of launcher
5. **soulfra_integrated_hub.py** (Port 8889) - Agent conversion hub

### Game/Entertainment Services
1. **ULTIMATE_GAME.py** - Game platform
2. **GAME_DASHBOARD.py** - Game monitoring
3. **AI_ARENA_SIMPLE.py** - Battle arena
4. **ADDICTION_ENGINE.py** - Engagement system

### Infrastructure Services
1. **CRINGEPROOF_FILTER.py** - Content filtering
2. **CRAMPAL_ENGINE.py** - Learning system
3. **VISUAL_DASHBOARD.py** - Monitoring dashboard
4. **LIVE_MONITOR.py** - System health monitor
5. **REAL_TIME_DEBUG_DASHBOARD.py** - Debug interface

### Integration/Bridge Services
1. **CLAUDE_BRIDGE.py** - Claude AI integration
2. **API_ROUTER.py** / **API_ROUTER_FIXED.py** - API routing
3. **SOULFRA_UNIFIED.py** - Unified platform attempt
4. **SOULFRA_COMPLETE_PLATFORM.py** - Another unified attempt

### Enterprise/Production
1. **ENTERPRISE_PLATFORM_MAX.py** - Enterprise features
2. **SOULFRA_ENTERPRISE_ENGINE.py** - Business logic
3. **PRODUCTION_LAYERS.py** - Production config

## JavaScript Services Found

### Core JS Services
1. **unified-soulfra-server.js** - Unified server attempt
2. **soulfra-unified-gateway.js** - Gateway service
3. **mirror-os-demo/server.js** - Mirror OS demo
4. **cal-kubernetes-orchestrator.js** - K8s orchestration

### API/Backend Services  
1. **api/SoulfraAPIRouter.js** - API routing
2. **api/unified-api-handler.js** - API handler
3. **billion-dollar-game/backend/index.js** - Game backend

## Key Findings

### Duplication Issues
- Multiple "unified" attempts (at least 10+ files)
- Several dashboard implementations
- Multiple API routers
- Redundant game implementations

### Active Polling Sources
The polling to `/health`, `/api/loops/recent`, `/api/marketplace/loops` comes from:
- Some dashboard HTML pages with 5-second intervals
- Possibly from `soulfra_integrated_hub.py` or similar

### Tier Structure
- Files spread across tier-0 through tier-minus20
- Deep nesting makes navigation difficult
- Many empty or duplicate files

## Recommended Consolidation

### Keep These Core Features
1. **AI Debates** - Working in SOULFRA_UNIFIED_MOBILE
2. **VIBE Token Economy** - Integrate fully
3. **Viral Engine** - Soul signatures & sharing
4. **AI Social Network** - Agents posting
5. **Cringeproof Filter** - Content moderation

### Archive/Remove
- All duplicate unified attempts
- Empty files
- Test files in production directories
- Redundant dashboards

### Directory Structure Proposal
```
/soulfra-core/
  ├── server/
  │   └── SOULFRA_UNIFIED_MOBILE.py (main)
  ├── features/
  │   ├── debates/
  │   ├── vibe-economy/
  │   ├── viral-engine/
  │   └── ai-social/
  ├── mobile/
  │   ├── pwa/
  │   └── assets/
  └── data/
      ├── soulfra_unified.db
      └── logs/

/legacy-archive/
  └── [all old files for reference]
```

## Next Steps
1. Stop the polling service
2. Move active code to clean structure
3. Archive duplicate files
4. Update imports and paths
5. Create proper .gitignore
6. Document the final architecture