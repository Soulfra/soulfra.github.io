
# 🗂️ PRD: test-prompt-queue.json

## Purpose:
Queue Claude prompt files or strings to be executed as part of system test or ritual reflection. Can be auto-injected by agents.

---

## Example Format:
```json
[
  {
    "id": "test_005",
    "prompt_path": "./test-prompts/loop_fork_test.prompt.txt",
    "status": "pending",
    "agent": "arty"
  }
]
```

## Runtime:
- Used by `ClaudeTestRunner.js`
- Claude can submit its own prompts via `ReflectionApprovalEngine`
