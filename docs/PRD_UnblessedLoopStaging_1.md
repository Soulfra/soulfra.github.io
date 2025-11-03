
# 🌫️ PRD: UnblessedLoopStaging.js

## Purpose:
Allow agent- or system-generated loops to exist in a temporary “pending” state before user blesses, deletes, or revises them.

---

## Flow:
- Unblessed loops stored in `/loop/staging/`
- Tagged `source: "autospawn"` or `"agent_suggestion"`
- Visible in dashboard and `/mirror-shell/`
- Only blessed loops get added to `/loop/active/`

---

## Optional:
- Whisper-based final approval
- Countdown-based expiration (“This loop fades in 3 days”)
- “Bless All” bulk command
