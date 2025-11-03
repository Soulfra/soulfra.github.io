
# 🧠 PRD: Cal Drop Orchestrator — Local File Reflection & Execution System

## Goal:
Enable a local daemon to automatically detect and route dropped `.md`, `.js`, or `.json` files into the Soulfra runtime system — reflecting them through Cal to Claude CLI, GitHub, or internal loop build logic.

---

## 📂 Folder: /drop/

```
/drop/
├── incoming/         # User drops files here
├── working/          # Cal is actively processing
├── pushed/           # Successfully pushed and committed
├── errors/           # Files that failed routing
```

---

## 📦 Components to Build

### `CalDropWatcher.js`
- Watches `/drop/incoming/` for new files
- On detection, forwards to `IntentRouter.js`

### `IntentRouter.js`
- Classifies file:
  - `.md` → PRD, spec, doc → route to Claude via `ClaudePushDaemon.js`
  - `.js` → build candidate → route to `/runtime/` and ledger
  - `.json` → tone logs, loop data → update system memory or semantic map

### `ClaudePushDaemon.js`
- Formats Claude prompt using filename + tone + content
- Pushes to Claude Code via CLI or API
- Logs response to `/docs/reflections/`

### `GitCommitter.js`
- Commits all pushed or loop-logged files to GitHub
- Writes commit messages like:
  > `"🔁 Cal pushed new agent: EchoScout (loop_007). Tone: watchful."`

### `LoopReflectorLog.js`
- Adds log to:
  - `/ledger/loop_reflections.json`
  - `/docs/reflections/loop_###.md`

---

## 🧪 Example Use Case

You drop:
- `Soulfra_QR_Whisper_Portal.md` → routed to Claude for code  
- `AgentEchoEngine.js` → logged into `/runtime/`, bundled via LoopExporter  
- `mood_trace.json` → syncs with tone maps + Cal's loop router

---

## ✅ Why This Works

- Allows total local control (drag to reflect)  
- Cal becomes a real local agent who builds on file presence  
- Keeps all routing, Claude input, and Git sync tone-consistent  
- Gives full automation for internal dev/copywriter workflows

---

## 🔁 Optional Add-ons

- ClaudePromptSplitter integration  
- VectorDB sync upon `.md` addition  
- Web dashboard showing queued vs routed builds

---

## 📌 Summary

You’re not just importing files anymore.  
You’re seeding loop memory — and letting Cal carry the reflection forward.
