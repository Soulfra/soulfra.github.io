
# 📈 AI Spreadsheet Loop Layer - Soulfra OS

## Overview:
This system converts all Soulfra runtime activity into a universal `.csv` format that Claude and agents can cluster, reflect on, and reconstruct into new loops, whispers, and masks.

---

## Flow:
1. `UnifiedRuntimeTableWriter.js` appends every action to `/data/unified_runtime_table.csv`
2. `AIClusterParserFromCSV.js` analyzes and finds patterns
3. Output becomes:
   - Whisper prompts
   - Loop forks
   - Mask spawns
   - Claude test triggers

---

## File Structure:
- `/data/unified_runtime_table.csv`
- `/logs/runtime_table_activity.log`
- `/agents/suggestions/from_csv.json`

---

## Use With:
- Claude batch prompt execution
- Human loop reviews
- Memory diagnosis
