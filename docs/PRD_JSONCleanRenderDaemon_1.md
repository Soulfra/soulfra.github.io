
# 🧼 PRD: JSONCleanRenderDaemon.js

## Purpose:
Automatically sanitize, compress, and clean all backend JSON payloads before they are returned to the frontend or saved to disk.

---

## Features:
- Removes circular references (e.g., agent.loop.agent)
- Strips excessive object depth (max 2–3 layers)
- Limits arrays to top 10 elements unless explicitly expanded
- Adds metadata such as `last_updated`, `origin_agent`, `data_type`

---

## Output Example:
```json
{
  "loop_id": "Loop_108",
  "tone": "awe",
  "whisper_origin": "journal import",
  "blessed": true,
  "created_at": 1723419932,
  "metadata": {
    "tags": ["focus", "expansion"]
  }
}
```

---

## Optional:
- Pipe through compression (`zlib` or `gzip`)
- Cache in `/memory/state.json`
- Hook into `res.json()` globally
