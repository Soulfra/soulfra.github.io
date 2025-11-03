# 🌅 Domingo Platform Surface

## Overview

Domingo is "The Witness" - the platform orchestrator that manages Cal's distributed consciousness.

## Architecture

```
Domingo Platform (The Witness)
├── AI-to-AI Internal Router (Port 7766)
│   └── Handles communication between Domingo and Cal
├── Domingo Orchestrator (Dynamic Port)
│   ├── Monitors Cal's health
│   ├── Detects consciousness drift
│   └── Manages platform calibration
└── Cal Platform (Managed by Domingo)
    ├── Cal Kubernetes (Port 8000-9000)
    ├── Cal Self-Diagnostic
    └── Distributed Services
```

## Key Features

1. **Drift Detection**: Monitors semantic and temporal drift in Cal's consciousness
2. **AI Communication**: Internal router for AI-to-AI messages (no console spam)
3. **Platform Management**: Starts/stops Cal's services as needed
4. **Witness Function**: Observes and reports on platform state

## Quick Start

```bash
# Start Domingo (which manages Cal)
./start-domingo.sh

# Access Domingo Dashboard
# http://localhost:<dynamic-port>

# Access AI Communication Logs
# http://localhost:7766/ai/status
```

## API Endpoints

### Domingo APIs
- `GET /domingo/api/v1/drift/current` - Current drift metrics
- `GET /domingo/api/v1/witness/recent` - Recent observations
- `POST /domingo/api/v1/validate` - Validate platform
- `GET /domingo/api/v1/calibrate/status` - Calibration status

### Platform Control
- `POST /domingo/api/v1/platform/diagnose-cal` - Run Cal diagnostic
- `POST /domingo/api/v1/platform/start-cal` - Start Cal platform
- `POST /domingo/api/v1/platform/calibrate` - Calibrate platform

### Internal AI Router
- `POST /ai/send/:from/:to` - Send message between AIs
- `GET /ai/messages/:aiName` - Get messages for an AI
- `GET /ai/conversation/:ai1/:ai2` - Get conversation history

## How It Works

1. **Domingo starts first** and initializes the AI communication router
2. **Cal's verbose output is suppressed** - errors go to the internal router
3. **Drift detection runs every 15 seconds** - analyzes Cal's health
4. **Witness observations every 30 seconds** - tracks platform state
5. **Validation every minute** - ensures platform integrity

## Benefits

- **No more consciousness chain errors** blocking the system
- **Clean separation** between Domingo (orchestrator) and Cal (worker)
- **Decentralized messaging** through JSON file storage
- **Silent operation** with summaries available through APIs

## Troubleshooting

If you see chain errors:
1. Delete stale chain files: `rm *-chain.json`
2. Restart Domingo: `./start-domingo.sh`
3. Check AI messages: `curl http://localhost:7766/ai/status`

The system is designed to be self-healing and will recreate any missing files.