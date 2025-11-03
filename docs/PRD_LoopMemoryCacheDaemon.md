
# 🧠 PRD: LoopMemoryCacheDaemon.js

## Purpose:
Act as a short-term memory store for whisper fragments, tone evolution, and loop interactions before syncing to Postgres or Neo4j.

---

## Features:
- Keeps last N whispers (configurable)
- Buffers agent tone shifts
- Buffers `/loop/` writes for burst interactions
- Flushes to database on schedule or ritual

---

## Format:
```json
{
  "recent_whispers": [ ... ],
  "tone_index": {
    "cal": ["steady", "vigilant", "graceful"]
  },
  "buffered_loops": ["Loop 095", "Loop 096"]
}
```

---

## Notes:
- Optional TTL expiry on each item
- WebSocket ping on drift spike
