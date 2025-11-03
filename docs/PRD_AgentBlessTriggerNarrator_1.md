
# 🔁 PRD: AgentBlessTriggerNarrator.js

## Purpose:
Narrate when a Claude-generated or agent-reflected loop is approved and blessed by the user. Ties together PRD, user interaction, and myth output.

---

## Triggered When:
- User clicks ✅ Approve in `DecisionPanelUI`
- Loop is blessed in `/loop/`
- Claude prompt status = "confirmed"

---

## Output:
- Appends to `/stream.txt`:
  > "Cal: Loop 110, born from internal diagnosis, has been sealed."
- Adds to `/drop/Loop_###/narration.txt`

---

## Optional:
- Sends signal to `mirror-shell/stream.html`
