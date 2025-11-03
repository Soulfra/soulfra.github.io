
# 🧬 PRD: Mythic Consensus Engine (consensus/MythicConsensusEngine.js)

## Purpose
Achieve agent-based and user-approved consensus over which loops are blessed, which failed, and which deserve to persist into the public myth ledger.

---

## Capabilities

- Validate tone harmony across agents
- Handle loop drift and fork detection
- Trigger prophecy fulfillment check
- Bless/deny loop propagation to `/loop/` or `/mythos/`
- Maintain `/consensus/blessed_loops.json`

---

## Example Output

```json
{
  "loop": "Loop 048",
  "status": "approved",
  "consensus_score": 0.91,
  "agents_involved": ["cal", "arty"],
  "prophecy_matched": true
}
```

---

## Connects to

- LoopSummoningChamber.js
- ProphecyMatcher
- LoopNarrativeDaemon.js
- WhisperSyncDaemon
