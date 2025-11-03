
# 🧠 PRD: UserExtensionAgentKit

## Purpose:
Let users generate new agents, interfaces, or whisper rituals using local tools and public APIs. This is the remix-and-build layer.

---

## Features:
- `AgentExtensionBuilder.js` ← turn whisper+tone+goal into new `/agents/agent_X/`
- `LoopScaffoldGenerator.js` ← auto-generate `/loop/Loop_###/` from whisper or journal
- `PublicAPIAgentSubmit.js` ← opt-in share back to network for remix/registry

---

## Optional Enhancements:
- Claude/Cal collaboration for autocompletion
- Tone-based visual UI generator (mild/dark/aggressive)
- Save to GitHub fork, private ZIP, or stream

---

## Output:
```json
{
  "agent": "FocusMancer",
  "loop_generated": "Loop 093",
  "submitted_to_network": true
}
```
