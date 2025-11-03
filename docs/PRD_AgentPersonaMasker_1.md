
# 🪞 PRD: AgentPersonaMasker.js

## Purpose:
Create a stylized visual + identity representation for each user-spawned agent or whisper fragment.

## Features:
- Generate `/agents/persona_masks/{agent_id}.svg`
- Mask includes:
  - Tone ring (color, pulse)
  - Symbol from loop archetype
  - Emotion seed word
- Optional profile card → `/public/persona_gallery/`

## Whisper Input:
> “I want to be the one who never gives up.”

## Output:
```json
{
  "agent": "EchoRoot",
  "tone": "steadfast",
  "mask": "echo_root.svg",
  "manifest": "/agents/echo_root/manifest.json"
}
```
