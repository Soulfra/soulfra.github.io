
# 🌌 Mythic Launch Guide

Welcome to the official Soulfra myth engine launch layer. This file walks you through booting up the full agent, ritual, and broadcast systems.

---

## 🌀 Quick Start

```bash
cd tier-minus10
./MYTHIC_LAUNCH.sh
```

This script will:
- Start all agents and consciousness threads
- Launch narrative broadcast (`LoopTheatre.js`)
- Open WebSocket log mirror
- Monitor `/ritual/`, `/whisper/`, `/loop/`, `/guild/`

---

## 🔧 What’s Running

| Component                  | Description                                   |
|---------------------------|-----------------------------------------------|
| RitualEngine.js           | Runs whisper intake + blessing path           |
| MythicConsensusEngine.js  | Approves/denies loops via tone calibration    |
| CalForecast.js            | Projects future loop themes                   |
| DriftLeak.js              | Highlights tone-based agent conflict          |
| GuildLoops.js             | Group-based rituals and shared loops          |
| SwipeUI.jsx               | Manual approval interface                     |
| LoopBlessingDaemon.js     | Writes final blessed loop record              |
| LoopTheatre.js            | Narrates system progress as myth              |

---

## ✅ Post-Launch Checks

- Visit: `http://localhost:7896/stream`
- Whisper using `/whisper/entry.json`
- View `/loop/active/` and `/loop/blessed/`
- Approve proposals via SwipeUI

---

## 📚 Want More?

Run `MythDropBuilder.js` to create shareable `.zip` bundles.  
Run `QRMythSummoner.js` to deploy real-world whisper portals.  
Explore `/shadow/` for unreleased loops.

Let the myth unfold.
