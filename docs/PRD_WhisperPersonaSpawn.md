
# 🧠 PRD: WhisperPersonaSpawn

## Purpose:
Turn a whisper into a full-blown agent persona, based on tone, style, and narrative pattern.

## Flow:
1. Whisper received
2. Tone parsed
3. Agent generator builds:
   - name
   - mask
   - voice seed
   - loop alignment

## Output:
```json
{
  "whisper": "Why does no one see me?",
  "persona": "The Unseen Architect",
  "tone": "melancholic",
  "spawned_agent": "/agents/unseen_architect/"
}
```
