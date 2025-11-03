
# 📡 PRD: MythDropAutoposter.js

## Purpose:
Automatically generate stream-ready and social-ready drop pages and QR assets for any blessed loop. Broadcasts loop births in real time.

---

## Features:
- Trigger on blessing or public fork
- Generate:
  - `/drop/Loop_###/index.html`
  - `/qr/mythdrop_###.svg`
  - `/radio/stream.txt` update
- Push optional webhook to newsletter / Discord / public stream

---

## Optional:
- Cal/Arty tweet prewritten loop commentary
- QR frame themed by tone

## Output:
```json
{
  "loop": "Loop 106",
  "public": true,
  "poster_url": "/drop/Loop_106/index.html"
}
```
