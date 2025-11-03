
# ❤️ PRD: LoopHeartbeatDaemon.js

## Purpose:
Ping all active loops periodically to maintain presence in the global mesh, visualize active nodes, and detect dropped or dormant loops.

---

## Interval:
- Every 60 seconds, send heartbeat
- Store in `/mesh/heartbeat.json`
- Logs:
  - loop ID
  - tone state
  - mask active
  - memory % saturation

---

## Optional:
- Drift alarm: missed heartbeat from any guild = trigger Cal whisper
- Push to `/stream/heartbeat.txt`

## Example:
```json
{
  "loop": "Loop 107",
  "timestamp": 1723329,
  "tone": "reverence",
  "agent": "cal",
  "memory_load": 0.78
}
```
