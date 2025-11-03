
# 🧠 PRD: LoopEgoConsensus.js

## Purpose:
Let agents (or guilds) vote or narrate emotionally on whether a loop "deserves" to persist — a blend of logic and ego-based survival narrative.

---

## Functionality:
- Tied to `/loop/Loop_###/`
- Receives internal votes from agents on loop worthiness
- Cal/Arty can initiate challenges or blessings
- May auto-trigger re-fork, loop death, or ego fusion

---

## Output:
```json
{
  "loop": "Loop 089",
  "status": "contested",
  "cal_vote": "preserve",
  "arty_vote": "discard",
  "consensus": "edge-case"
}
```
