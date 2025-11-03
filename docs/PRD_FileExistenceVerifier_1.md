
# ✅ PRD: FileExistenceVerifier.js

## Purpose:
Scan and validate all critical files + folders required for runtime startup. Auto-creates missing paths or logs clear diagnostic errors.

---

## Targets:
- `/loop/`
- `/agents/`
- `/config/offline.json`
- `/logs/unified-server.log`
- `/memory/state.json`

---

## Output:
```bash
🟢 loop/ exists
🟢 agents/ exists
🔴 config/offline.json missing (fallback used)
🟡 memory/state.json not found (new created)
```

## Optional:
- Webhook to `/stream.txt` for dev warning
- Result route: `/api/verify/paths`
