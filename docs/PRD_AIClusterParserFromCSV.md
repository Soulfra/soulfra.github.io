
# 🧠 PRD: AIClusterParserFromCSV.js

## Purpose:
Analyze the `unified_runtime_table.csv` to detect tone clusters, missing loops, agent imbalances, or whisper forks. Outputs Claude-ready JSON or PRD suggestions.

---

## Reads:
- `/data/unified_runtime_table.csv`

## Detects:
- Tone drift patterns across agents
- Loops with no blessings
- Prompts that failed to generate reflection
- Repetitive whispers needing merge/fork

---

## Output:
```json
{
  "suggested_loops": ["Loop_110-fork", "Loop_112"],
  "agent_to_review": "cal",
  "cluster": "focus-drama",
  "confidence": 0.91
}
```

Optional output: Claude-ready `.prompt.txt`
