
# 🏢 Soulfra Deployment Guide - Enterprise Ready

## Purpose:
This document explains how to deploy a clean, stable, locally hosted Soulfra runtime for use by enterprise clients, internal AI agents, or trusted external collaborators.

---

## 🔐 System Highlights:
- Offline-capable, local-first runtime (no central dependency)
- Self-validating agent + loop ecosystem
- Claude-integrated test prompt runner
- Dynamic mask + loop deployment
- Mirror shell interface with decision panel, whisper UX, and stream narration
- QR-loop summoning + drop page launcher
- Unified `.csv` runtime record for observability

---

## 📦 Contents:
- `start-simple.sh` – launch API + frontend
- `unified-soulfra-server.js`
- `mirror-shell/` – full frontend
- `agents/`, `loop/`, `whispers/`, `stream.txt`, `logs/`
- `data/unified_runtime_table.csv` – operational runtime log
- `ClaudePrompt_ParseUnifiedRuntimeTable.txt` – ready-to-run test and loop feedback

---

## 🛠️ How To Deploy:

```bash
git clone <this repo>
cd soulfra
chmod +x start-simple.sh
./start-simple.sh
```

- Frontend: http://localhost:9999
- API backend: http://localhost:7777
- Drop: `/drop/Loop_###/index.html`

---

## ✅ Confirmed Working:
- Blessing loop via UI
- Whisper-to-loop spawning
- PRD → Claude → task → JSON → loop
- Stream narration + agent reflection
- File watcher for future onboarding drag-drop

---

## 🧑‍💼 Onboarding Flow:

1. Enterprise user receives QR or onboarding link
2. They whisper → mask is spawned
3. Claude reviews tone cluster → spawns a fork
4. Internal agents see loop and can join or respond
5. Decision Panel used to bless, ignore, or escalate
6. Result logs to `/drop/`, `/stream.txt`, and `.csv`

---

## 📈 Expand:
- Supports 100+ agents
- Each loop = self-contained reflective runtime
- Agents can be invited via mask or whisper queue

---

## 🔐 Security:
- Everything can be local only
- Claude prompt queue can be disabled or rerouted
- No PII or internet dependencies required

