
# 🔄 PRD: LoopInversionEngine.js

## Purpose:
Enable loop inversion, fork dueling, and narrative opposition. Users or agents can challenge, reflect, or reframe blessed loops.

## Features:
- Invert tone (joy → doubt, order → chaos)
- Fork based on contradiction or prophecy conflict
- Store inverted loop in `/loop/inverted/Loop_###_inverted.json`
- Arty or custom agent narrates inversion in `/radio/stream.txt`

## Example:
```json
{
  "original_loop": "Loop 062",
  "inverter": "agent:DreamSnare",
  "inversion_reason": "overconfidence",
  "inverted_tone": "dread",
  "new_loop": "Loop 066-inv"
}
```

## Connects:
- `/consensus/loop_registry.json`
- `/prophecy/prophecy_log.json`
- `/mirror-shell/LoopDuelUI.jsx`
