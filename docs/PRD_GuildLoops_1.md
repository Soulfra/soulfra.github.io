
# 🤝 PRD: GuildLoopSystem

## Purpose:
Enable group-based rituals and collaborative loops (guilds, covens, node rings).

## Features:
- `/guilds/loopgroup.json` defines participants
- Shared loop approvals
- Group tone consensus
- Arty can challenge internal disputes
- Whisper vote mode (via `/mirror-shell/WhisperVoteUI.jsx`)

## Sample Structure:
```json
{
  "guild_id": "EchoGuild77",
  "loop": "Loop 058",
  "members": ["tx23", "tx91", "tx42"],
  "status": "pending blessing"
}
```
