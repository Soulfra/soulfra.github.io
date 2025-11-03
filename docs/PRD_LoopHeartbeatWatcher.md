
# ❤️ PRD: LoopHeartbeatWatcher.js

## Purpose:
Ping the active loop every 30–60s to log its tone, timestamp, memory saturation, and agent presence. Visualized in system monitor or `status.html`.

---

## Features:
- Writes to `/heartbeat/loop_###.json`
- Fields:
  - timestamp
  - tone
  - drift
  - agent name
  - memory saturation score (0–1)

---

## Optional:
- Integrate with `/stream/heartbeat.txt`
- Enable Cal/Arty to comment on loop stability
- “Loop Lost” alert if heartbeat expires
