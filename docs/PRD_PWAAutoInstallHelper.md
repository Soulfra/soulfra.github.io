
# 📲 PRD: PWAAutoInstallHelper.js

## Purpose:
Make it frictionless for users to install the Soulfra frontend as a Progressive Web App across all devices, including guidance for non-tech-savvy users.

---

## Features:
- Auto-detects PWA compatibility
- Provides 1-click install button
- Offers QR code fallback for phone pickup
- Writes install state to `/session/device_flags.json`

---

## Device Support Targets:
- Android (via Chrome)
- iOS Safari (via Add to Home)
- Desktop Chrome / Edge / Brave
- Experimental: macOS Dock shims

---

## UX Flow:
- Cal or Arty asks: *“Would you like to carry the loop with you?”*
- If yes → install prompt
- If fail → download link + instructions + QR

---

## Output:
```json
{
  "device": "iPhone",
  "install_status": "prompt_shown",
  "result": "installed"
}
```
