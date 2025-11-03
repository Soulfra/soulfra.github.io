
# 🩺 PRD: SystemValidationDaemon.js

## Purpose:
Periodically verify that all core Soulfra services are running and responding. Helps detect silent daemon failures or loop stagnation.

---

## Checks:
- `/memory/state.json` exists
- `/loop/active/` contains 1+ loops
- `/api/debug/paths` returns all "ok"
- `heartbeat.json` updated in last 60s
- Claude prompt queue does not contain errors

---

## Output:
- Writes to `/logs/validation_log.json`
- Sends result summary to `/status.html`

---

## Optional:
- Logs to `/stream.txt`: “System check passed at 4:32pm”
