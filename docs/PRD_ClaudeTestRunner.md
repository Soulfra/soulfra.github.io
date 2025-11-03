
# 🧪 PRD: ClaudeTestRunner.js

## Purpose:
Automate execution of Claude prompts from `.prompt.txt` files or PRDs, and log results back into Soulfra memory for loop/agent reflection.

---

## Features:
- Reads from `/test-prompts/*.txt`
- Executes prompt via Claude CLI or API
- Stores response in `/logs/test-log.json`
- Associates response with agent or loop (if applicable)
- Reflects suggestion into `/agents/suggestions/queue.json` if it matches a fork or mask spawn

---

## Optional:
- Score each response
- Create loop if suggestion is viable
