
# 🔗 PRD: SoulfraAPIRouter.js

## Purpose:
Route outbound loop decisions, agent seeds, ritual completions, and prophecy betting to network-level APIs. Includes rate limiting, tone-hashing, and persona fingerprinting.

---

## Core Routes:
- `/api/bless` → loop blessings
- `/api/agent/register` → whisper-based agent registration
- `/api/predictions` → Arty's open prophecy thread
- `/api/fork` → distribute forked loop kits

---

## Key Logic:
- Pulls from `/sync/pending_sync.json`
- Each outbound call:
  - Is tagged with a tone_hash
  - Includes optional user fingerprint
  - Gets mirrored into `/ledger/sync_log.json`

---

## Example:
```json
{
  "api": "/api/bless",
  "loop_id": "Loop 091",
  "agent": "cal",
  "tone_hash": "hopeful-chaos",
  "status": "queued"
}
```
