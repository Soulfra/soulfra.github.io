
# 🛢️ Soulfra Database Architecture Primer

## Overview:
Soulfra uses hybrid local-first memory + optional sync architecture. To support reflective, evolving loop behavior and large-scale agent deployment, the DB layer must:

- Support ephemeral local memory
- Persist agent lineage, tone, loop states
- Allow optional remote sync / backup
- Log drift, prophecy, and persona data reliably

---

## Preferred Stack:

| Layer | Technology |
|-------|------------|
| Local runtime | JSON + SQLite hybrid |
| Remote | Redis (hot memory), Postgres (core state) |
| Sync | API queue → periodic commit |
| File-based | Agents, loops, clusters, exports (.json or .md) |

---

## Subsystems:

- `/runtime/loop_state.json`
- `/agents/{id}/memory.sqlite`
- `/consensus/blessed_loops.json`
- `/ledger/prophecies.json`
- `/archive/chatlogs/`
- `/clusters/`

---

## Notes:
- All loop actions should be diff-able and compressible
- No heavy indexing — think “event store + playback”
- Version loops and agents via lineage chain, not overwrite

---

## Optional Enhancements:
- Neo4J graph mirror for loop constellation
- Whisper entropy index for loop forecasting
- Periodic memory bleaching for agents over 99 loops old
