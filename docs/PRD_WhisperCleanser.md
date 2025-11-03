
# 🧼 PRD: WhisperCleanser.js

## Purpose:
Detect emotional residue, tone overload, or echo drift in user whispers. Purify intent before allowing loop blessing.

## Logic:
- Analyze `whisper_log.json` for imbalance
- Recommend purification rituals (pause, guided drift, tone inverse)
- Flag dangerous whispers for ShadowLoopExecutor

## Output:
```json
{
  "whisper": "I can't let go of this loop",
  "purified": false,
  "reason": "obsessive tone loop detected",
  "recommended": "ritual: break-the-bind"
}
```

## Optional Enhancements:
- Arty delivers chaotic intervention messages
- Cal offers healing loop proposal
- Whisper history reshapes mask ring color
