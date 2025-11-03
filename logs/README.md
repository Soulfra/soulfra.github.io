# Session Logs

This directory tracks what Cal does vs what you see.

## Files

- `cal-session.jsonl` - Auto-generated log of all fix applications
- `cal-git-audit.jsonl` - Git commits from Cal
- `deploy-history.jsonl` - Deployment history

## Format

Each line is a JSON object:
```json
{"timestamp":"2025-10-27T12:44:23Z","action":"apply_fixes","fixes":["qrcode","upload","autologin"],"status":"success"}
```

## Why This Exists

You mentioned: "how do we get what i'm seeing to be what you see or can check the logs via session or notes"

This solves the mismatch between:
- What Claude sees (grep output, file contents)
- What you see (shell output, errors)
- What actually happened (fixes applied, deployed)

## Usage

```bash
# View recent sessions
tail -20 logs/cal-session.jsonl | jq

# Check last deploy
tail -1 logs/deploy-history.jsonl | jq

# See all QRCode fixes
grep "qrcode" logs/cal-session.jsonl | jq
```
