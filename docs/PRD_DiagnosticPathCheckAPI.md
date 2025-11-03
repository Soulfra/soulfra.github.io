
# 🧪 PRD: /api/debug/paths

## Purpose:
Expose an API route to confirm the existence of key files + folders from the perspective of the running server.

---

## Route:
GET `/api/debug/paths`

## Response:
```json
{
  "loop": "ok",
  "agents": "ok",
  "logs": "ok",
  "config/offline.json": "missing"
}
```

---

## Frontend:
- Link from `/status.html` or `debug.html`
- Optional retry/recreate buttons
