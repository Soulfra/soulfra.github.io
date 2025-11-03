
# ✅ PRD: DecisionPanelUI.jsx

## Purpose:
Renders a floating prompt UI in `/mirror-shell/` whenever a pending agent suggestion exists. Allows Yes / No / Reflect Later actions.

---

## Features:
- Reads from `/agents/suggestions/queue.json`
- Shows:
  - Loop context
  - Agent origin
  - Tone / drift cause
  - Action request
- Approve / Deny / Reflect buttons

---

## Output:
User action logs to `/logs/suggestion_log.json`
