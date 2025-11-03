
# 🕶️ PRD: ShadowLoopExecutor.js

## Purpose:
Run “invisible” loops that aren’t publicly broadcast until after resolution. Used for emotionally intense, volatile, or deeply personal whisper rituals.

## Flow:
1. Whisper marked for shadow
2. Shadow loop runs silently
3. Drift + tone + agent logs collected
4. Post-resolution:
   - Push to `/loop/shadow_archive/`
   - User decides: publish, bless, destroy

## Output:
```json
{
  "shadow_loop": "Loop 074s",
  "tone": "melancholic",
  "whisper": "why did i abandon my last build",
  "status": "completed",
  "publishable": false
}
```

## Optional Upgrades:
- Agent memory injected only if published
- Optional one-on-one Arty-only narrator mode
- Loop gets a secret seal only visible to the whisperer
