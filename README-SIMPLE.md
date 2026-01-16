# Soulfra - Simple Setup Guide

## What You Have

A self-sovereign AI assistant powered by local Ollama (no API costs).

- **Identity Keyring**: Separate AI personas for each domain
- **Code Analyzer**: Local code analysis with DeepSeek
- **Chat Widget**: Embeddable assistant on any page
- **Learning Router**: Adapts to user expertise level

## Quick Start

### 1. Start Everything
```bash
bash start.sh
```

### 2. Visit Your Apps
- **AI Assistant**: http://localhost:8000/soulfra-assistant.html
- **Content Brewery**: http://localhost:8000/content-brewery.html
- **API Docs**: http://localhost:5050/api

### 3. Stop Everything
```bash
bash stop.sh
```

## How It Works

### Ports
- **5050** - Backend API (Ollama, identity, chat)
- **8000** - Frontend (HTML files)
- **11434** - Ollama (auto-detected)

### File Structure
```
soulfra.github.io/
├── start.sh                     # Start everything
├── stop.sh                      # Stop everything
├── soulfra-assistant.html       # Chat widget (standalone)
├── soulfra-assistant.js         # Widget loader (embed anywhere)
├── api/
│   ├── unified-backend-v2.js    # Main backend
│   ├── identity-keyring.js      # Domain identity management
│   ├── code-analyzer.js         # Code analysis
│   ├── learning-router.js       # Adaptive AI routing
│   └── providers/               # AI providers (Ollama, Claude, OpenAI)
├── data/
│   └── identities/              # Per-domain memory
└── logs/
    ├── backend.log              # Backend logs
    └── frontend.log             # Frontend logs
```

## API Endpoints

### Chat with AI
```bash
curl -X POST http://localhost:5050/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Your question","domain":"soulfra"}'
```

### Get System Info
```bash
curl http://localhost:5050/api/assistant/info
```

### List Identities
```bash
curl http://localhost:5050/api/assistant/identities
```

## Embed on Your Website

Add this to any HTML page:
```html
<script src="/soulfra-assistant.js"></script>
```

The widget auto-detects the domain (soulfra.com, calriven.com, etc.) and loads the correct identity.

## Domains Supported

- **soulfra** - Identity & Security
- **calriven** - AI Platform
- **deathtodata** - Privacy Search
- **cringeproof** - Prediction Market

Each domain has isolated memory and context.

## Debug

### Check Logs
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
```

### Check What's Running
```bash
ps aux | grep node
lsof -i :5050
lsof -i :8000
```

### Restart Fresh
```bash
bash stop.sh
bash start.sh
```

## That's It!

No duplicate modules. No confusion. Everything in ONE place.

To onboard users: Just send them `http://localhost:8000/soulfra-assistant.html` (or embed the widget on your actual domain).
