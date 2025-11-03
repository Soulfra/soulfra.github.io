
# 🧠 Soulfra Build-Market Execution Engine (Dev Prompt)

## 🎯 Objective:
Implement a maxed-out version of Soulfra’s build execution model — where users can propose ideas and the system:

1. Decomposes the idea into reflective build modules  
2. Scores it based on internal capability (agent load, loop pressure, tone alignment)  
3. Renders a myth-style build proposal (poetic UX)  
4. Logs it into `/ledger/build_proposals.json`  
5. Awaits ritual approval (swipe, tone, or whisper)  
6. Upon approval:
   - Initiates an internal loop build  
   - Or a hybrid external + internal path  
   - Or routes the task externally (Claude, dev API, etc.)

---

## 📦 Folder Structure to Build:

```
/build-market/
├── IdeaDecomposerDaemon.js           // Breaks incoming idea into modular tasks
├── AgentBuildCostEngine.js           // Computes cost in loop pressure, agent load, tone conflict
├── InternalCapabilityMap.json        // Defines which agents + UIs can be created internally
├── ExternalIntegrationRouter.js      // Fallback for unsupported tasks
├── BuildProposalRenderer.jsx         // Frontend renderer (myth-style, not dashboard)
├── FinalRitualApproval.js            // Swipe or tone-based approval handler
└── /ledger/build_proposals.json      // Logged ideas, status, and build lineage
```

---

## 🧠 Core Functional Flow:

1. **User submits idea** via voice, whisper, or text  
2. `IdeaDecomposerDaemon` parses the idea into core modules  
3. `AgentBuildCostEngine` checks if Soulfra can build internally:
   - Are the agents available?
   - Do existing loops support the request?
   - How risky is the tone alignment?

4. System creates a **mythic build plan**:
   > *"The Architect may draft. The Loop Engineer is absent. Shall we call an outsider?"*

5. User swipes or confirms

6. If approved:
   - Route internal builds to CalArchitect  
   - Route partial builds via `ExternalIntegrationRouter.js`  
   - All actions get recorded in `/ledger/build_proposals.json`

---

## 🔗 Integrations:

- ✅ **CalArchitect Layer** — Receives build instruction and routes to loop system  
- ✅ **RuntimeShell** — Handles user confirmation via gesture/tone  
- ✅ **Ledger** — Appends every approved or rejected build idea

---

## 🧪 Deliverables:

- All 7 components above  
- Working frontend component for `BuildProposalRenderer.jsx`  
- Logic for capability scoring + external routing  
- Ledger write + replay capability

---

## 🚨 Dev Team Response Request:

Please confirm:

- [ ] Component time estimates  
- [ ] External routing feasibility  
- [ ] Conflicts with CalArchitect or agent registry  
- [ ] Dev constraints or additional dependencies

---

## 🌌 Final Vision:

This system turns Soulfra into:

- A reflective product generator  
- A recursive builder marketplace  
- A whisper-to-shippable engine  
- A poetic PM interface that **literally builds what you think**

Once complete, users don’t “build apps.”  
They whisper **loops** — and Soulfra builds empires.

Let’s finish it.
