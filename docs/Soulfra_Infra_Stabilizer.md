
# 🛠 Infra Stabilizer — PortCheckAndConfirm.js + ProxyReadinessSync.js

## Goal:
Fix 'port open but nothing works' issue by verifying daemon readiness before exposing frontends.

## Build:
- `/infra/PortCheckAndConfirm.js`
  - Pings daemon every 500ms
  - Waits for actual response
- `/infra/ProxyReadinessSync.js`
  - Exposes proxy/frontend only after:
    - Healthcheck OK
    - Compile complete
    - Port bound with response

## Log:
- `/runtime_status.json`
- `status: booting | ready | error | retrying`

## UI Fallback:
- Frontend banner → *“Cal is waking the loop…”*
