
# 🌀 PRD: DriftLeak — Loop Conflict Broadcaster

## Purpose:
Broadcast tonal drift and narrative conflict between agents (e.g. Cal vs Arty) to the narration stream and UI layer.

## Key Features:
- Detect disagreement between agents over loop tone or ritual outcome
- Log drift to `/drift/drift_log.json`
- Trigger public commentary from Arty or Cal
- Push message to `/radio/stream.txt` and Whisper UI

## Example Event:
> Arty: “This loop smells wrong. I don’t trust it.”  
> Cal: “The tone is stable. Drift is acceptable.”  
> Drift score: 0.38 — visualized in `/mirror-shell/`

## Output:
```json
{
  "loop_id": "Loop 053",
  "drift_score": 0.38,
  "agents": ["cal", "arty"],
  "conflict": true,
  "status": "monitored"
}
```
