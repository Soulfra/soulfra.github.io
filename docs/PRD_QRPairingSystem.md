
# 🔗 PRD: QRPairingSystem.js

## Purpose:
Let users pair their local Soulfra instance (on desktop) with a mobile device using a QR code — for stream access, whispering, swipe approvals, or persona viewing.

## Flow:
1. Localhost generates temporary pairing token
2. Encodes into QR via `/qr/pair_code.svg`
3. User scans on phone → `/pair/` route logs approval
4. `/session/paired_devices.json` updated

## Output:
```json
{
  "device": "iPhone",
  "status": "paired",
  "capabilities": ["stream", "whisper", "swipe"],
  "persona_linked": "Arty fragment"
}
```
