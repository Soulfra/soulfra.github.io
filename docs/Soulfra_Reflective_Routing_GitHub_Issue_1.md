
---
name: Soulfra Reflective Routing Engine
about: Route approved ideas to best internal/external execution path
title: "[Routing] Reflective Build Execution Layer"
labels: backend, logic, agents, soulfra
assignees: ''

---

## 🧭 Objective

Build a routing system that determines how Soulfra executes approved build proposals — based on trust, cost, tone, and capability.

---

## 📦 Structure

```
/routing/
├── RoutingPreferenceMap.json
├── ReflectionFitScoreEngine.js
├── ExecutionCostEstimator.js
├── TrustHistoryLedger.json
└── SmartRoutingDaemon.js
```

---

## 🔁 Flow

1. User approves proposal
2. System scores: tone match, loop cost, agent availability
3. Chooses: internal, hybrid, external, or delay

---

## ✅ Output Example

```json
{
  "recommendation": "Hybrid execution",
  "path": "Cal + Claude fallback",
  "tone_score": 0.91
}
```

---

## 📎 Dependencies

- Build-Market  
- CalArchitect  
- /ledger/build_proposals.json  

---

## 🧪 Dev Tasks

- [ ] Fit scorer  
- [ ] Cost estimator  
- [ ] Preference reader  
- [ ] Path router  
- [ ] Ledger writer
