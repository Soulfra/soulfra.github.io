
# 🔁 Auto-Run Reflection Layer (Soulfra Local)

## Overview:
This system allows Claude to run its own prompts, reflect them into the Soulfra runtime, and prompt the user for approval — creating a recursive, testable, self-growing OS.

---

## Flow:
1. ClaudeTestRunner reads prompt queue
2. Executes prompt using Claude CLI
3. Logs result to `test-log.json`
4. If valid → proposes agent/loop/whisper
5. Routes decision to `DecisionPanelUI.jsx`
6. If approved → logs to `/loop/`, `/agents/`, `/drop/`

---

## Files Involved:
- `/test-prompts/`
- `/logs/test-log.json`
- `/agents/suggestions/queue.json`
- `/loop/human/`
- `/loop/ai/`
- `/stream.txt`
