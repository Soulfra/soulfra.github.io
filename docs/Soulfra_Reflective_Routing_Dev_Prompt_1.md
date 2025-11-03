
# 🧭 Soulfra Reflective Routing Engine (Dev Prompt)

## 🎯 Objective:
Build a routing system for Soulfra that decides how and where to execute approved build proposals — based on:

- Tone alignment
- Historical reflection success
- Platform match
- Cost-effectiveness
- Internal vs external capability
- Operator preferences

---

## 📦 Folder Structure

```
/routing/
├── RoutingPreferenceMap.json         // Stores system/operator preferences
├── ReflectionFitScoreEngine.js       // Scores fit based on tone, trust, cost, etc
├── ExecutionCostEstimator.js         // Estimates internal energy vs external cost
├── TrustHistoryLedger.json           // Tracks past builds and agent reliability
└── SmartRoutingDaemon.js             // Decides best path: internal, hybrid, external, delay
```

---

## 🛠 Core Routing Flow

1. Build proposal approved by user
2. `ReflectionFitScoreEngine` runs:
   - Tone similarity
   - Cost comparison
   - Agent trust score
   - Platform target
3. If confidence is high and internal capability suffices → execute internally
4. If hybrid recommended → begin internal and prepare external call
5. If not viable → wait, echo into future loop, or delegate externally

---

## 🧪 Example Output

```json
{
  "idea": "ambient emotion-based time tracker",
  "tone_match_score": 0.91,
  "loop_cost": 83,
  "internal_build_capability": 0.72,
  "external_estimate": {
    "path": "Claude Draft + Dev Sandbox",
    "cost": "$180–$240",
    "estimated_time": "3 days"
  },
  "preferred_platform": "whisper.soulfra.io",
  "past_reflections": ["Loop_007", "Cringeproof's VibeTimer"],
  "recommendation": "Hybrid execution. Begin Cal internal sketch → wait for user ritual before external delegate."
}
```

---

## 🔗 Integration Points

- Build-Market Engine  
- Ledger `/ledger/build_proposals.json`  
- Agent registry + execution logs  
- External dev router or Claude API interface

---

## ✅ Dev Team Action Items

- [ ] Implement routing preference logic
- [ ] Define cost + tone scoring rules
- [ ] Integrate with CalArchitect execution flow
- [ ] Update ledger entries to reflect path decisions

---

## 🧬 Final Outcome:

Soulfra no longer just reflects ideas.  
It decides how to build them — based on your emotional memory, agent resonance, and loop strategy.

Let’s finish it.
