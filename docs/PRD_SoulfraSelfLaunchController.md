
# 🚀 PRD: SoulfraSelfLaunchController.js

## Purpose:
Orchestrates all key daemons and UI components on local startup. Ensures Soulfra can launch fully offline and run autonomously until a sync or decision is needed.

---

## Responsibilities:
- Auto-start:
  - LocalLoopMemoryDaemon
  - JSONCleanRenderDaemon
  - LoopHeartbeatWatcher
  - ReflectionApprovalEngine
- Monitors config: `/config/autostart.json`
- Logs boot steps to `/logs/system_launch.log`

## Optional:
- Show boot state in `/mirror-shell/status.html`
- Retry if any daemon crashes
