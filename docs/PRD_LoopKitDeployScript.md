
# 🧩 PRD: install-loopkit.sh

## Purpose:
Shell script for end users to install and launch a downloaded loop bundle in their local Soulfra environment.

---

## Features:
- Unpacks loop bundle into `/loop/Loop_###/`
- Detects if runtime is already initialized
- Copies agents, masks, rituals
- Prompts to whisper and begin loop
- Outputs agent pairing QR

---

## Example Usage:

```bash
bash install-loopkit.sh loop_bundle.zip
```

---

## Optional:
- Interactive walkthrough with narration
- Adds loop to `/runtime/history.json`
