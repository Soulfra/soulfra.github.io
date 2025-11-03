
# 🛠️ PRD: /api/debug/preview

## Purpose:
Serve a static, simplified example of a valid loop + agent + drift JSON bundle for testing renderers, daemons, and UI behavior.

---

## Endpoint:
- GET `/api/debug/preview`

## Returns:
```json
{
  "loop": { "loop_id": "Loop_999", "tone": "emergence", "blessed": false },
  "agent": { "name": "echofox", "tone_history": ["skeptic", "soft"] },
  "drift": 0.41
}
```

---

## Usage:
- For frontend devs to test without real data
- For Claude/term to run unit tests
- For `/debug.html` to live preview system state
