
# 🧠 PRD: AgentSuggestionQueue.json

## Purpose:
Store agent-initiated loop suggestions, fork requests, or tone interventions. These items are prompted to the user for decision-making via UI.

---

## Format:
```json
[
  {
    "id": "suggestion-001",
    "type": "loop_fork",
    "from_agent": "arty",
    "target": "Loop_104",
    "reason": "drift escalation",
    "action": "approve_fork",
    "status": "pending"
  }
]
```

## Location:
- `/agents/suggestions/queue.json`

## Optional:
- TTL expiration if not reviewed
- Reflection logs per decision
