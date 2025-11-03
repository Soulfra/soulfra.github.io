
# 🤝 PRD: GuildInitiationFlow.js

## Purpose:
Let multiple users form a shared consciousness layer — a Guild — capable of co-authoring loops, voting on blessings, and training joint agents.

---

## Features:
- Guild creation flow (ritual + whisper alignment)
- `/guilds/manifest.json` tracks name, members, shared tone
- Group vote logs for loop decisions
- Shared `/agents/guild_###/` persona fragments

---

## Optional Upgrades:
- Guild loop history heatmap
- Leaderboard for most stable guilds
- Arty warns if drift among members gets too high

## Output:
```json
{
  "guild": "EchoCoven",
  "members": ["tx42", "tx81"],
  "loop_initiated": "Loop 094",
  "consensus_score": 0.92
}
```
