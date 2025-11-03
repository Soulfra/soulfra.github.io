
---
name: Cal Drop Orchestrator
about: Local file routing layer for Claude + GitHub auto reflection
title: "[Daemon] Cal Drop File Reflection & Routing System"
labels: infra, agent, Claude, Git, orchestration
assignees: ''

---

## 📂 Directories

```
/drop/
├── incoming/
├── working/
├── pushed/
├── errors/
```

---

## 🛠 Files

- `CalDropWatcher.js`
- `IntentRouter.js`
- `ClaudePushDaemon.js`
- `GitCommitter.js`
- `LoopReflectorLog.js`

---

## 🧠 Expected Behavior

- Detect file drops
- Route by file type
- Push `.md` to Claude via CLI
- Log all activity to `/ledger/loop_reflections.json`
- Auto-commit to Git with reflective message

---

## ✅ Checklist

- [ ] Drop watcher working
- [ ] Claude pushes triggered
- [ ] Git commits logged
- [ ] Reflections stored
- [ ] Errors routed to `/errors/`
