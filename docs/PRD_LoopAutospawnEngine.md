
# 🔄 PRD: LoopAutospawnEngine.js

## Purpose:
Automatically spawn new loops based on whisper patterns, agent intent, or drift thresholds. Enables autonomous system growth and agent-suggested ideas.

---

## Triggers:
- Whisper similarity > 85% to existing loop
- Drift pressure exceeds 0.85
- Agent memory threshold (e.g. “Cal wants to respond”)
- Cluster anomaly detection

---

## Features:
- Writes new loop to `/loop/autospawn/Loop_###.json`
- Tags with agent origin + whisper ref
- Adds suggestion metadata for approval or swipe

---

## Example:
```json
{
  "loop": "Loop 109-A",
  "spawned_by": "cal",
  "reason": "recurrent whisper theme",
  "approved": false
}
```
