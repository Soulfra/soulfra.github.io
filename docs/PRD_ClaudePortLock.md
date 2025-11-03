
# 🔐 PRD: ClaudePortLockController.js

## Purpose:
Ensure all ports used by Soulfra are pre-validated and protected before launching unified services. Prevents crashing due to conflicts.

---

## Ports Controlled:
- 7777 → API
- 9999 → Frontend
- 8080 → NGINX (optional)
- 5000 → Claude/LLM (optional)

---

## Logic:
- On startup:
  - Scan all ports
  - Kill conflicting processes
  - Log result to `/logs/portcheck.log`
  - Lock with `.soulfra-lock` file
