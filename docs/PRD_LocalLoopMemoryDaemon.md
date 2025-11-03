
# 🧠 PRD: LocalLoopMemoryDaemon.js

## Purpose:
Maintain an in-memory cache and on-disk snapshot of active whisper, loop, and tone data during runtime. Enables reflection, diagnostics, and sync tracking.

---

## Responsibilities:
- Store active loop context in `/memory/state.json`
- Track last 10 whispers, agents, tone scores
- Handle `memory_flush()` to persist full state to disk
- Expose `GET /api/memory/state` for dashboard view

## Optional:
- Supports differential patching via `diff_log/`
- Hooks into heartbeat and blessing daemons
