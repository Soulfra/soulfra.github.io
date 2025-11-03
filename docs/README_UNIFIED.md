# MirrorOS - Unified Local Platform

## 🌟 Complete Integration Achieved

The MirrorOS platform has been successfully unified across all layers with fully live local operation. All components are connected and routing through the vault system.

## 🚀 Quick Start

```bash
# Start the unified platform
./start-local.sh

# Open dashboard
# http://localhost:8888
```

## ✅ Unified Components

### 1. Frontend Dashboard
**File:** `dashboard/dashboard.html`
- **Chat Tab** → Routes to `cal-chat-agent.js`
- **Agent Builder Tab** → Routes to `agent-builder.js`  
- **Export & Stripe Tab** → Routes to `agent-exporter.js`
- **Vibe Reviews Tab** → Routes to `vibe-capture.js`
- **QR Check-in Tab** → Routes to `qr-listener.js`
- **Operator Dashboard Tab** → Routes to vault log files

### 2. Backend API Handlers
**File:** `api/unified-api-handler.js`

**Endpoints:**
- `POST /api/chat` → Handle prompts, log to vault, return Cal reflection
- `POST /api/export` → Run export-agent.js, trigger Stripe checkout
- `POST /api/qr-checkin` → Record location + UUID to checkin-log.json
- `POST /api/vibe-review` → Append to vibe-memory.json  
- `GET /api/stats` → Read all vault/logs/*.json files for live operator dashboard

### 3. MirrorRouter Core
**File:** `router/mirror-router.js`

**Features:**
- ✅ Detects BYOK (user API keys)
- ✅ Defaults to backup keys in `.vault/env/llm-keys.json`
- ✅ Tracks all token usage to `usage-ledger.json`
- ✅ Stores all prompt memory into `vault-sync-core/logs/reflection-events.log`

### 4. Local Runtime Bootstrap
**File:** `start-local.sh`

**Validation Steps:**
- ✅ Boots backend server (Node)
- ✅ Opens http://localhost:8888
- ✅ Validates MirrorRouter is active
- ✅ Validates API keys are loaded or fallback present
- ✅ Validates vault is writable
- ✅ Validates QR handler + vibe logger are listening
- ✅ Validates operator dashboard is accessible

### 5. Unified Vault System
**Vault Paths:**
- `/vault/` → Main vault storage
- `/vault-sync-core/` → Synchronization and logs
- `/reflection-maps/` → Pattern and reflection data
- `/tier-13/` → Platform income tracking

**All Activity Logged:**
- Chat logs, reviews, exports, forks, and QR check-ins
- Real-time activity in `operator-dashboard/dashboard.html`

## 🎯 Core Modules

### Cal Chat Agent (`cal-chat-agent.js`)
- Routes prompts through `.mirror-vault`
- Adds thinking delay simulation  
- Logs every exchange to `vault-sync-core/logs/reflection-events.log`
- Maintains conversation history in `prompt-log.json`

### Agent Builder (`agent-builder.js`)
- Creates agents with vault integration
- Generates runtime wrappers for each agent
- Templates stored in `template-reflection/templates/`
- All agents logged to vault activity

### Agent Exporter (`agent-exporter.js`)
- Exports agents with Stripe payment integration
- Supports JSON, ZIP, API, and Platform formats
- 8% MirrorFee automatically injected
- Export tracking with marketplace functionality

### Vibe Capture (`vibe-capture.js`)
- Voice/emotion-based location reviews (1-5 rating)
- Simple sentiment analysis engine
- Emotion detection from text and rating
- All reviews stored in `vault/memory/vibe-logs.json`
- Cal's location memory system

### QR Listener (`qr-listener.js`)
- QR scanning with geolocation verification
- Reward points and badge system
- Auto-generates Cal prompts: "Cal remembers you liked this cafe"
- Connects to vibe-capture for deeper reviews

## 🔗 Integration Flow

```
User Input → Frontend Dashboard
     ↓
Backend API Handler
     ↓
MirrorRouter (LLM Selection)
     ↓
Vault Logging System
     ↓
Real-time Operator Dashboard
```

## 📊 Live Operator Dashboard

Real-time view of:
- **Total Chats** → Cal conversation count
- **Agents Built** → Agent builder activity
- **Exports** → Monetization tracking
- **Reviews** → Vibe capture activity  
- **Check-ins** → QR location activity
- **Vault Events** → All system activity

## 🔑 API Key Management

**Priority Order:**
1. User environment variables (`BYOK`)
2. `.env.local` file  
3. Vault backup keys
4. Demo mode (simulated responses)

**BYOK Detection:**
- Real keys = No platform cost
- Backup keys = 20% platform markup
- Local Ollama = No cost

## 💰 Stripe Integration

- Export payments processed through unified handler
- 8% platform fee automatically calculated
- Platform income logged to `tier-13/`
- User Stripe Connect support

## 🗂️ Vault Architecture

```
vault/
├── conversations/          # Chat logs by session
├── agents/                # Built and imported agents
│   ├── custom/           # User-built agents
│   └── imported/         # Imported agents
├── exports/              # Export data and tracking
├── reviews/              # Vibe reviews and analysis
├── checkins/             # QR check-in logs
├── memory/               # Cal's memory systems
│   ├── vibe-logs.json   # All vibe reviews
│   └── cal-location-memory.json # Cal's location knowledge
└── env/                  # Environment and keys

vault-sync-core/logs/
├── reflection-events.log    # All chat reflections
├── agent-builder-activity.log # Agent building
├── export-activity.log      # Export tracking
├── vibe-activity.log        # Review activity
└── qr-activity.log         # Check-in activity

tier-13/
├── platform-income.json       # Platform fees
└── platform-export-income.json # Export income
```

## 🎪 Demo Scenarios

1. **Complete Workflow:** Chat → Build Agent → Export → Review → Check-in
2. **BYOK Demo:** Show cost difference with user vs platform keys
3. **Vault Logging:** Real-time activity monitoring
4. **Cross-Integration:** QR check-ins trigger review prompts
5. **Monetization:** Export agents with Stripe payment

## 🧪 Testing

```bash
# Test individual components
node cal-chat-agent.js
node agent-builder.js  
node agent-exporter.js
node vibe-capture.js
node qr-listener.js

# Test MirrorRouter
node router/mirror-router.js

# Test unified API
node api/unified-api-handler.js
```

## 🔧 Configuration

**Required Environment Variables (Optional):**
```bash
ANTHROPIC_API_KEY=your_key_here  # For real Claude responses
OPENAI_API_KEY=your_key_here     # For real GPT responses
GITHUB_TOKEN=your_token_here     # For GitHub integration
STRIPE_SECRET_KEY=your_key_here  # For payment processing
```

**Default Fallbacks:**
- Demo keys for LLM providers
- Local Ollama detection
- Simulated Stripe payments
- Mock voice analysis

## 🎯 Live Operation Features

✅ **Agent building + exporting** - Full lifecycle with Stripe
✅ **Chat with Cal** - Routes through vault with reflection logging  
✅ **Vibe reviews + location logs** - Emotion analysis and Cal memory
✅ **QR check-ins** - Geofenced validation with rewards
✅ **Stripe payment on export** - 8% platform fee processing
✅ **Vault-based prompt routing** - All requests logged and tracked
✅ **Live operator dashboard** - Real-time user activity monitoring

## 🌟 Ready for Enterprise Demo

The unified MirrorOS platform demonstrates:
- **Complete Agent Lifecycle** - Build, deploy, monetize
- **Sovereign Architecture** - Local-first with vault integration
- **Revenue Generation** - Platform fees and export monetization  
- **User Engagement** - Reviews, check-ins, and rewards
- **Real-time Monitoring** - Complete operator visibility
- **Scalable Foundation** - Ready for production deployment

**Launch Command:** `./start-local.sh`  
**Access URL:** `http://localhost:8888`

---

🎉 **MirrorOS Unified Platform - All Systems Operational!** 🎉