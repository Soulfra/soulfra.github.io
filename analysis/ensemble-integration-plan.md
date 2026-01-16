# Ensemble Integration Plan

**Goal:** Integrate ensemble AI with existing Soulfra infrastructure instead of building parallel systems.

---

## Current State Analysis

### What We Have (Existing)
```
infrastructure/
├── qr-generator.js              ← Affiliate QR system
├── qr-auth-system.js            ← QR authentication
├── mirror-*.js (30+ files)      ← Mirror system
└── cal-riven-operator.js        ← Cal operator

agents/
├── agent-builder.js             ← Agent creation
├── agent-orchestrator.js        ← Multi-agent coordination
├── cal-chat-agent.js            ← Cal chat interface
└── 67+ specialized agents

daemons/
├── SmartRoutingDaemon.js        ← Intent routing
├── IntentInferenceDaemon.js     ← Intent detection
└── 27+ background services
```

### What We Built (New)
```
api/llm/
├── router.js                    ← Ensemble LLM routing
└── domain-context.js            ← Domain knowledge

api/qr/
└── bootstrap-generator.js       ← ❌ DUPLICATES qr-generator.js

api/build/
├── ensemble-builder.js          ← ❌ DUPLICATES agent-builder.js
└── feature-packager.js          ← NEW packaging

api/gist/
└── database.js                  ← NEW Gist storage

pages/chat/
└── chatbox.html                 ← NEW ensemble UI
```

**Problem:** We have TWO QR systems, TWO agent builders, etc.

---

## Integration Strategy

### Phase 1: Create Adapter Layer

Instead of using new systems directly, create adapters that WRAP existing infrastructure:

```
┌────────────────────────────────────────────┐
│         Browser UI (Calriven Studio)       │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│         Adapter Layer (NEW)                │
│  • api/adapters/qr-adapter.js              │
│  • api/adapters/agent-adapter.js           │
│  • api/adapters/orchestrator-adapter.js    │
└────────────────┬───────────────────────────┘
                 │
┌────────────────▼───────────────────────────┐
│    Existing Infrastructure (KEEP)          │
│  • infrastructure/qr-generator.js          │
│  • agents/agent-builder.js                 │
│  • agents/agent-orchestrator.js            │
└────────────────────────────────────────────┘
```

**Benefits:**
- Preserves existing functionality
- Modernizes interface
- No code duplication
- Gradual migration path

---

## Adapter Implementations

### 1. QR Adapter

**File:** `api/adapters/qr-adapter.js`

**Purpose:** Wrap `infrastructure/qr-generator.js` for browser use

**Implementation:**
```javascript
class QRAdapter {
  constructor() {
    // Check if we're in Node.js (has fs)
    this.isNode = typeof require !== 'undefined';

    if (this.isNode) {
      // Use existing infrastructure/qr-generator.js
      this.generator = require('../infrastructure/qr-generator.js');
    } else {
      // Use browser-compatible CalrivenBootstrapQR
      this.generator = new CalrivenBootstrapQR();
    }
  }

  async generateQR(type, data) {
    // Unified interface for both environments
    if (this.isNode) {
      return await this.generator.generateQRCode(type, data);
    } else {
      return await this.generator.generateBootstrapQR(data);
    }
  }
}
```

**Integration:**
- Calriven Studio → calls QRAdapter
- QRAdapter → routes to appropriate implementation
- Existing code → unchanged

### 2. Agent Adapter

**File:** `api/adapters/agent-adapter.js`

**Purpose:** Bridge ensemble with `agents/agent-builder.js`

**Implementation:**
```javascript
class AgentAdapter {
  constructor() {
    this.isNode = typeof require !== 'undefined';

    if (this.isNode) {
      // Use existing agent-builder.js
      this.builder = require('../agents/agent-builder.js');
    } else {
      // Use browser-compatible EnsembleBuilder
      this.builder = new EnsembleBuilder();
    }
  }

  async buildAgent(conversation, options) {
    // Extract agent spec from conversation
    const spec = this.extractAgentSpec(conversation);

    if (this.isNode) {
      // Use existing vault-integrated builder
      return await this.builder.createAgent(spec);
    } else {
      // Use ensemble builder (browser)
      return await this.builder.buildFromConversation(conversation);
    }
  }

  extractAgentSpec(conversation) {
    // Unified spec format for both systems
    return {
      name: extractName(conversation),
      systemPrompt: extractPrompt(conversation),
      capabilities: extractCapabilities(conversation),
      vaultIntegration: true
    };
  }
}
```

**Integration:**
- Ensemble chat → AgentAdapter.buildAgent()
- AgentAdapter → routes to agent-builder.js OR EnsembleBuilder
- Result → packaged feature

### 3. Orchestrator Adapter

**File:** `api/adapters/orchestrator-adapter.js`

**Purpose:** Connect ensemble to `agents/agent-orchestrator.js`

**Implementation:**
```javascript
class OrchestratorAdapter {
  constructor() {
    this.isNode = typeof require !== 'undefined';

    if (this.isNode) {
      // Use existing orchestrator
      this.orchestrator = require('../agents/agent-orchestrator.js');
    } else {
      // Use LLM Router as orchestrator
      this.orchestrator = new LLMRouter();
    }
  }

  async routeQuery(query, options) {
    if (this.isNode) {
      // Use existing multi-agent orchestration
      return await this.orchestrator.route(query, options);
    } else {
      // Use ensemble routing
      return await this.orchestrator.route(query, options);
    }
  }
}
```

---

## Integration Workflow

### User Story: Build a Feature

**Before (Confusing - Two Systems):**
```
User → New EnsembleBuilder → Creates code
User → Old agent-builder.js → Also creates agents?
User → Which one to use? 🤔
```

**After (Unified - One Interface):**
```
1. User opens Calriven Studio
2. Sees "Available Systems":
   - QR Generator (infrastructure/qr-generator.js)
   - Agent Builder (agents/agent-builder.js)
   - Mirror System (infrastructure/mirror-*.js)
3. Clicks "Agent Builder"
4. Ensemble explains: "This is the agent creation system with vault integration"
5. User chats: "Build an agent that summarizes text"
6. AgentAdapter:
   - Extracts spec from conversation
   - Routes to agents/agent-builder.js
   - Returns vault-integrated agent
7. User deploys to calriven/
```

**No confusion - one system, modern UI!**

---

## Calriven Studio Architecture

### Unified Interface

**File:** `pages/build/calriven-studio.html`

```
┌─────────────────────────────────────────────────────┐
│                 Calriven Build Studio                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌───────────────────┐  ┌───────────────────────┐  │
│  │ Ensemble Chat     │  │ Infrastructure List   │  │
│  │                   │  │                       │  │
│  │ [Domain: Calriven]│  │ • QR Generator        │  │
│  │ [Mode: Ensemble]  │  │ • Agent Builder       │  │
│  │                   │  │ • Mirror System       │  │
│  │ > "Build a QR"    │  │ • Cal Chat Agent      │  │
│  │                   │  │                       │  │
│  │ Assistant:        │  │ [Click to explore]    │  │
│  │ "I can use the    │  │                       │  │
│  │  existing QR      │  │                       │  │
│  │  generator..."    │  │                       │  │
│  └───────────────────┘  └───────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Live Preview                                  │  │
│  │ [Generated feature loads here]                │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  [Deploy to calriven/] [Generate QR] [Save to Gist] │
└─────────────────────────────────────────────────────┘
```

### Infrastructure Explorer

**File:** `pages/build/infrastructure-explorer.html`

```
┌─────────────────────────────────────────────────────┐
│            Infrastructure Explorer                   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Search: [__________]  Filter: [All ▼]              │
│                                                      │
│  📁 infrastructure/ (60 files)                       │
│    📄 qr-generator.js                                │
│       "Affiliate QR system for Cal forks"            │
│       [View Code] [Ask Ensemble] [Use in Studio]    │
│                                                      │
│    📄 agent-builder.js                               │
│       "Agent creation with vault integration"        │
│       [View Code] [Ask Ensemble] [Use in Studio]    │
│                                                      │
│  📁 agents/ (78 files)                               │
│    📄 agent-orchestrator.js                          │
│    📄 cal-chat-agent.js                              │
│    ...                                               │
│                                                      │
│  📁 daemons/ (29 files)                              │
│    📄 SmartRoutingDaemon.js                          │
│    ...                                               │
│                                                      │
│  [Ask Ensemble About This System]                   │
└─────────────────────────────────────────────────────┘
```

---

## Migration Path

### Step 1: Create Adapters (This Week)
- ✅ `api/adapters/qr-adapter.js`
- ✅ `api/adapters/agent-adapter.js`
- ✅ `api/adapters/orchestrator-adapter.js`

### Step 2: Build Unified UI (This Week)
- ✅ `pages/build/calriven-studio.html`
- ✅ `pages/build/infrastructure-explorer.html`

### Step 3: Mark Duplicates as Deprecated (Next Week)
- ⚠️ `api/qr/bootstrap-generator.js` → Use `QRAdapter` instead
- ⚠️ `api/build/ensemble-builder.js` → Use `AgentAdapter` instead

### Step 4: Test Integration (Next Week)
- User workflow: Chat → Adapter → Existing System
- Verify no functionality lost
- Collect feedback

### Step 5: Document (Ongoing)
- Use ensemble to generate docs for existing systems
- Create migration guide
- Update README

---

## Integration Examples

### Example 1: QR Code Generation

**User Request:** "Generate a QR code for the model selector feature"

**Old Approach (Confusing):**
```javascript
// Which one to use???
const qr1 = new CalrivenBootstrapQR(); // New system
const qr2 = new QRGenerator();         // Old system
```

**New Approach (Unified):**
```javascript
// One interface, automatic routing
const qr = new QRAdapter();
const result = await qr.generateQR('feature', {
  name: 'model-selector',
  path: '/calriven/model-selector.html'
});
// Adapter routes to infrastructure/qr-generator.js automatically
```

### Example 2: Agent Creation

**User Request:** "Build an agent that routes AI queries"

**Old Approach (Confusing):**
```javascript
// Two agent builders???
const builder1 = new EnsembleBuilder();  // New
const builder2 = new AgentBuilder();     // Old (vault-integrated)
```

**New Approach (Unified):**
```javascript
// One interface
const agent = new AgentAdapter();
const result = await agent.buildAgent(conversation, {
  vaultIntegration: true
});
// Adapter routes to agents/agent-builder.js with vault
```

---

## Testing Plan

### Unit Tests
- Each adapter works in Node.js and browser
- Adapters correctly route to existing systems
- No functionality lost

### Integration Tests
- Calriven Studio → Adapter → Infrastructure
- Ensemble chat → Agent creation → Deploy
- QR generation → Packaging → Distribution

### User Acceptance Tests
- User can build features via chat
- User can explore existing infrastructure
- User understands which system is being used

---

## Success Metrics

- ✅ Zero code duplication (adapters wrap, not replace)
- ✅ One unified interface (Calriven Studio)
- ✅ All existing functionality preserved
- ✅ Modern browser UI for old Node.js systems
- ✅ Clear documentation of existing systems
- ✅ Migration path for gradual refactoring

---

## Timeline

### Week 1 (Current)
- [x] Infrastructure audit (infrastructure-map.json)
- [x] Integration plan (this document)
- [ ] Create QR adapter
- [ ] Create agent adapter
- [ ] Create orchestrator adapter

### Week 2
- [ ] Build Calriven Studio
- [ ] Build Infrastructure Explorer
- [ ] Test adapters
- [ ] Mark duplicates as deprecated

### Week 3
- [ ] User testing
- [ ] Documentation
- [ ] Migration guide
- [ ] Deploy to calriven.com

---

## Key Principles

1. **Don't Replace - Integrate**
   - Existing systems work → keep them
   - New systems add value → use adapters

2. **One Interface, Multiple Backends**
   - User sees one system (Calriven Studio)
   - Adapters route to appropriate backend

3. **Gradual Migration**
   - No big-bang rewrite
   - Adapters allow incremental modernization

4. **Documentation via Ensemble**
   - Use ensemble to explain existing code
   - Build living documentation

5. **Test Everything**
   - Adapters must preserve functionality
   - No regressions allowed

---

## Next Steps

1. **Create adapters** (api/adapters/)
2. **Build unified UI** (pages/build/)
3. **Test integration**
4. **Document with ensemble**
5. **Deploy to calriven.com**

This integration approach gives you the **systematic, focused workflow** you wanted - but now it **uses existing infrastructure** instead of building parallel systems!
