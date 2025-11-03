
# 📊 PRD: UnifiedRuntimeTableWriter.js

## Purpose:
Create and maintain a single `.csv` file that stores all runtime objects — loops, whispers, agents, tasks, prompts — in a structured table for LLM parsing or human inspection.

---

## Output File:
- `/data/unified_runtime_table.csv`

## Columns:
- `type` (loop, whisper, agent, task, prompt)
- `timestamp`
- `tone`
- `agent`
- `source` (filename, script, Claude)
- `status`
- `file` (path to the asset)

---

## Triggered By:
- Any loop blessing
- Whisper ingest
- Prompt execution
- Claude test
