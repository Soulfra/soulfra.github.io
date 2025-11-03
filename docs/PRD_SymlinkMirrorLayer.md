
# 🪞 PRD: SymlinkMirrorLayer.js

## Purpose:
Create mirrored symbolic links between the human and agent runtime folders (e.g. `/loop/human/` and `/loop/ai/`) for full reflection symmetry.

---

## Mirrors:
- Loop bundles
- Agent masks
- Whisper logs
- Fork events

---

## Example:
```js
symlinkSync('./loop/human/Loop_110.json', './loop/ai/Loop_110.json');
```

## Optional:
- Use watcher to auto-sync new loop blessings
- Log in `/logs/symlink_trace.json`
