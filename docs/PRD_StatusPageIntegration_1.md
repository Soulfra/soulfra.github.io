
# 📊 PRD: status.html Validation Bar

## Purpose:
Show live system status inside `/mirror-shell/status.html`, based on latest logs from `SystemValidationDaemon`.

---

## Features:
- Box: ✅ System Health: OK / ❌ Errors Found
- Shows:
  - Last heartbeat time
  - Loops active
  - Claude test queue status
  - Sync pending status

---

## Sources:
- `/logs/validation_log.json`
- `/heartbeat/`
- `/test-prompts/`
- `/logs/claude_reflection_log.json`

---

## Optional:
- "Rerun system check" button
- Link to logs.html
