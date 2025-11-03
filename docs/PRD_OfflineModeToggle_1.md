
# 🌐 PRD: OfflineModeToggle.js

## Purpose:
Enable users to toggle full offline operation for Soulfra. Prevents all API calls and mesh syncs. Adds `sync_now()` control on request.

---

## Key Features:
- Read `/config/offline.json` → { "offline": true }
- Prevent outbound HTTP syncs when true
- Show offline badge in `/status.html`
- Enable “Sync Now” button → executes `sync_outbox()`

## Sync Now Behavior:
- Commits `/memory/state.json`, `/loop/`, `/whispers/` to remote endpoint
- Clears local sync queue
