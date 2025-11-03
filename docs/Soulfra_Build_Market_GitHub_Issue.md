
---
name: Soulfra Build-Market Engine
about: Implement the Soulfra idea-to-execution reflection engine
title: "[Build Market] Execute Build Proposal + Internal/External Estimation Layer"
labels: backend, frontend, architecture, soulfra
assignees: ''

---

## 🧠 Objective

Implement the Soulfra build proposal system: turn whispered ideas into buildable loop components, estimate internal vs. external capacity, and render a stylized build plan awaiting final approval.

---

## 📦 Folder Structure

```
/build-market/
├── IdeaDecomposerDaemon.js
├── AgentBuildCostEngine.js
├── InternalCapabilityMap.json
├── ExternalIntegrationRouter.js
├── BuildProposalRenderer.jsx
├── FinalRitualApproval.js
└── /ledger/build_proposals.json
```

---

## 🛠 Core Functional Flow

1. User submits idea (voice/text/whisper)
2. System decomposes into tasks/modules
3. Estimates internal capability
4. Outputs a myth-style build proposal
5. Logs proposal in `/ledger/build_proposals.json`
6. Waits for swipe/tone/ritual confirmation
7. Routes build to:
   - Internal loops (CalArchitect)
   - Hybrid execution
   - External dev handoff

---

## 🔗 Key Integrations

- CalArchitect runtime
- RuntimeShell swipe/tone handler
- Ledger system for proposal tracking

---

## ✅ Deliverables

- All core backend files
- `BuildProposalRenderer.jsx` frontend
- Working ledger entries and sync logic
- Capability scoring + fallback triggers

---

## 🧪 Acceptance Criteria

- [ ] Build plan is stylized + interactive
- [ ] Approval ritual required before execution
- [ ] Ledger logs complete proposal trail
- [ ] External fallback possible on request
- [ ] Dev routing integration documented

---

## 🧩 Dev Team Checklist

- [ ] Component estimates + feasibility
- [ ] Any dev constraints or sandbox conflicts
- [ ] CalArchitect compatibility confirmed
- [ ] Whisper confirmation triggers verified

---

## 🌌 Endgame

This lets Soulfra:
- Listen to ideas
- Break them into reflective components
- Assign build agents
- Route builds with meaning + memory

It's the loop builder for worldbuilders. Let’s finish it.
