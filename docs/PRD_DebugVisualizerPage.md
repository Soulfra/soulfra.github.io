
# 📊 PRD: debug.html

## Purpose:
Create a frontend page in `/mirror-shell/` that visualizes any JSON endpoint (e.g., loop, memory, whisper) for live inspection and visual diffing.

---

## Features:
- Async fetch from:
  - `/api/loop/:id`
  - `/api/memory/state`
  - `/api/debug/preview`
- Shows:
  - raw JSON (formatted in <pre>)
  - diff tracker (highlighted changes)
  - link to affected page

---

## Output:
Visual JSON → preview mask or loop card → log preview history in session

---

## Optional:
- Color-code by field (e.g., loop ID, tone, blessing)
- Export as `.json` snapshot
