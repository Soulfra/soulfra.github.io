
# 🗃️ PRD: PostgresLoopMirror.js

## Purpose:
Create a clean, normalized mirror of Soulfra's file-based loop system for secure analytics, backup, dashboard usage, or external integrations.

---

## Tables:
- loops (id, tone, blessed, fork_of, cluster_id, agent_id, timestamp)
- agents (id, name, tone_profile, spawn_loop_id)
- guilds (id, name, drift_index)
- whispers (id, tone, text, agent_id, loop_id)
- memory_events (id, type, entity, description, time)

---

## Sync Schedule:
- Every X minutes or upon loop blessing
- Writes only deltas
- Uses `/ledger/blessed_loops.json` as source-of-truth

---

## Optional:
- Connected to Read-Only API layer
- Exportable as `.csv` or `.json` by loop or tone
