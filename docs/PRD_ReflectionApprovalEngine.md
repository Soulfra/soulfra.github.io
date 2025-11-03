
# ✨ PRD: ReflectionApprovalEngine.js

## Purpose:
Manages the user-driven review and execution of agent-generated suggestions (loop forks, tone injections, drift warnings).

---

## Flow:
- Checks queue.json for pending items
- Surfaces to DecisionPanelUI
- Executes script if approved
- Deletes if denied
- Archives if delayed

---

## Optional:
- Narration overlays: “Cal seeks your guidance…”
- Cal/Arty disagreements appear as separate suggestions
