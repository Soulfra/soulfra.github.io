
# 🧠 PRD: Neo4JLoopGraphMapper.js

## Purpose:
Persist Soulfra's loop, agent, and prophecy data in a live graph database for querying complex relationships and generating deep memory maps.

---

## Node Types:
- Loop
- Agent
- Whisper
- Guild
- DriftEvent
- Prophecy
- Artifact (QR drop, poster, etc)

---

## Edges:
- `WHISPERED_BY`
- `FORKED_FROM`
- `NARRATED_BY`
- `CHALLENGED_BY`
- `SEED_OF`
- `SPAWNED_AGENT`
- `PART_OF_GUILD`

---

## Output Example (Cypher):
```cypher
MATCH (a:Agent)-[:NARRATED_BY]->(l:Loop)
WHERE a.name = "cal" RETURN l
```

---

## Optional:
- Live sync daemon: `LoopGraphSync.js`
- Time-aware decay fields (for memory loss / fading)
