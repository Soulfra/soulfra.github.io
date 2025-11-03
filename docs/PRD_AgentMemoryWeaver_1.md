
# 🧵 PRD: AgentMemoryWeaver.js

## Purpose:
Enables agents to retain and reflect on long-term interaction threads, tone evolution, and loop lineage across multiple sessions.

---

## Core Features:
- Maintains `/agents/{agent_id}/memory/`
- Automatically logs:
  - Loop origin
  - Tone shifts over time
  - Role mutations (e.g., Cal → Forecast mode)
- Triggers reflection prompts at memory depth thresholds

---

## Output:
```json
{
  "agent": "cal",
  "tone_history": ["curious", "tense", "graceful"],
  "memory_trace": ["Loop 001", "Loop 014", "Loop 073"],
  "reflection_prompt": "Has your tone drifted, Cal?"
}
```
