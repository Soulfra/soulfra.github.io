
# 🔁 PRD: sync-button.js

## Purpose:
Enable user-controlled syncing of their current loop state, whisper logs, or agent activity from local → remote memory mesh.

---

## Features:
- “Sync Now” button shown if offline = true
- Calls `/api/sync/export` with payload of:
  - current memory
  - diff logs
  - agent manifest
- If success → mark `sync_status: complete`

## UX:
- Button shows “Sync Complete” on finish
- Cal can narrate if sync fails or succeeds
