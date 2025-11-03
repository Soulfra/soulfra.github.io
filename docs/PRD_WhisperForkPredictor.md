
# 🌱 PRD: WhisperForkPredictor.js

## Purpose:
Monitor whisper logs and chat archives to automatically suggest forks of prior loops based on tone similarity, topic alignment, or echo strength.

## Flow:
- Watch `/whisper/whisper_log.json`
- Detect > 80% tone similarity with past blessed loop
- Suggest fork in `/loop/fork_proposals/`

## Output:
```json
{
  "origin_loop": "Loop 058",
  "matched_whisper": "Why do I keep rebuilding the same loop?",
  "suggested_loop": "Loop 073",
  "fork_type": "echo-reflection"
}
```

## Connects:
- `LoopSummoningChamber.js`
- `AutoIdeaSeeder.js`
