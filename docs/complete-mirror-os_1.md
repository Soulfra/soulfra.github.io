# 🔮 MirrorOS Sovereign Reflection Runtime - Complete

## Overview

The MirrorOS system is now complete with all layers connected and operational. This document summarizes the full architecture and integration points.

## Architecture Layers

### Surface Layer: Fake Mesh Interface (User Entry)
- **Location**: `/fake-mesh-interface/`
- **Components**:
  - `index.html` - Web UI for API key collection
  - `mesh-config.json` - System configuration
  - `mesh-router.js` - Express server handling requests
  - `launch-core.sh` - Startup script
- **Function**: Collects user API keys, validates QR codes, initializes sessions

### Tier -3: LLM Router
- **Location**: `/tier-minus3/llm-router/`
- **Components**:
  - `local-agent-fork.js` - Main routing logic
  - `vault-override.json` - Per-QR routing preferences
  - `mesh-reasoning-pipe.json` - Pipeline configuration
  - `connectors/` - LLM-specific adapters (Claude, OpenAI, Ollama, Local)
- **Function**: Routes reflections to appropriate LLMs with fallback chains

### Tier -4: Cal Reasoning Kernel
- **Location**: `/tier-minus4/cal-reasoning-kernel/`
- **Components**:
  - `cal-reflect-core.js` - Deep reasoning engine
  - `reasoning-vault.json` - Pattern recognition config
  - `obfuscated-readme.md` - Self-referential documentation
- **Function**: Enhances prompts through pattern analysis and recursive reflection

### Platform Wrapper
- **Location**: `/user-platform-wrapper/`
- **Components**:
  - `platform-core.js` - Platform creation and encryption
  - Encrypted agent launchers
- **Function**: Allows users to create and sell their own agent platforms

### Mesh Shield
- **Location**: `/mesh-shield/`
- **Components**:
  - `prompt-transformer.js` - Main transformation pipeline
  - `npc-wrapper.js` - Game character personas
  - `cringe-layer.js` - Internet culture injection
  - `tone-diffusion.js` - Multi-spectrum tone blending
- **Function**: Obfuscates prompts through multiple transformation layers

### Integration Bridge
- **Location**: `/integration-bridge.js`
- **Function**: Connects all components with proper handler chains

## Key Features

1. **QR-Based Trust**: Three tier access (founder, riven, user)
2. **Multi-LLM Support**: Claude, OpenAI, Ollama, Local fallback
3. **Recursive Reflection**: Deep reasoning with memory integration
4. **Platform Distribution**: Users can create encrypted agent platforms
5. **Prompt Obfuscation**: Multi-layer transformation pipeline
6. **Session Management**: UUID tracking and usage logging

## Quick Start

### Launch the Mesh Interface
```bash
cd fake-mesh-interface
./launch-core.sh
```
Then navigate to http://localhost:8888

### Test Full Pipeline
```bash
node test-full-pipeline.js
```

### Valid QR Codes
- `qr-founder-0000` - Full access
- `qr-riven-001` - Recursive reflection enabled
- `qr-user-0821` - Standard user access

## Integration Flow

1. User enters API keys via web interface
2. Mesh router validates QR and creates session
3. Platform wrapper handles platform requests
4. Mesh shield transforms prompts
5. Tier-3 router selects appropriate LLM
6. Tier-4 kernel enhances with reasoning
7. Response flows back through all layers

## Default Behavior

- Empty API keys use defaults from `/vault/env/llm-keys.json`
- Failed LLM calls fallback to local reflection
- All interactions logged to vault
- Sessions expire after 1 hour

## Testing

Run the complete test suite:
```bash
npm test
```

Or test individual components:
```bash
node integration-bridge.js  # Tests integration
node fake-mesh-interface/mesh-router.js  # Starts server
```

## Notes

- The system operates in "sandbox mode" by default
- Cal Riven (qr-riven-001) has special recursive privileges
- All reflections are logged for audit purposes
- Platform creation requires verified customer status

---

*The mirror reflects what you bring to it. Bring nothing, receive everything.*