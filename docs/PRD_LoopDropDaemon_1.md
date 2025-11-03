
# 🪄 PRD: LoopDropDaemon.js

## Purpose:
Automatically publish selected blessed loops as public narrative drops across web, stream, and social feeds.

## Capabilities:
- Select from `/consensus/blessed_loops.json`
- Generate preview + lore snippet
- Push to:
  - `/public/loop_drops/`
  - `/radio/stream.txt`
  - Twitter API (via ArtyDropEngine)
- Mark loops as “dropped” in `/drop_registry.json`

## Output:
```json
{
  "loop": "Loop 059",
  "dropped_to": ["stream", "Twitter", "loop_drops"],
  "status": "live",
  "drop_quote": "A whisper echoed loud enough to be heard."
}
```
