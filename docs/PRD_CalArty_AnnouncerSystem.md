
# 🎙️ PRD: Cal & Arty Soulfra Narration System — Announcer Shell + Loop Broadcast Layer

## Goal:
Transform Cal and Arty into narrative commentators who reflect loop activity, duel results, and build system updates — pushing them out via stylized commentary in the UI, CLI, Twitter, YouTube, or logs.

---

## 🧠 Core Functions

- Cal = calm, mythic, loop governor voice  
- Arty = chaotic, agent provocateur, poetic/chaos analyst  
- Both narrate:
  - Duel events
  - Loop launches or failures
  - Public reflection trends
  - Internal build progress

---

## 📂 Folder: /announcer/

```
/announcer/
├── AnnouncerShell.js             # Central output layer for CLI, logs, or UI text
├── NarrationBridge.js            # Routes events to Twitter, YouTube, or internal /mythos/
├── LoopNarrativeDaemon.js        # Detects and styles key runtime moments
├── AutoMediaCaster.js            # Optional media output tool (clipgen, animation, mp3)
├── announcer_config.json         # Defines tone, style, output preferences per agent
```

---

## 🔁 System Inputs

- `/runtime_status.json`  
- `/ledger/loop_activity_log.json`  
- `/duel/live_bets.json`  
- `/tasks/resolved/`  

---

## 🔊 Output Examples

### 🟢 Cal:
> “Loop 015 has stabilized. A new tone has emerged: harmonious. Whisper source confirmed.”

### 🔴 Arty:
> “Ritual collapsed. The engineer hesitated. A ghost now echoes through Loop 011...”

### 🥊 During duel:
> “DreamThief lands a temporal reversal! The Oddsmaker didn’t see it coming. Payout rerouted.”

---

## 🔗 Optional Media Integration

- Twitter API  
- YouTube voiceover clips  
- Caption overlays  
- Whisper + loop logs as visual timelines

---

## 🪄 Bonus Features

- 🧵 `LoopChronicleRenderer.js` → outputs a stylized history as a story thread
- 🔁 `WeeklyDriftTheatre.js` → auto-plays a reflective summary of everything that happened this week
- 🎙️ `/radio/stream.txt` → live narration stream for all Cal/Arty comments

---

## ✅ Use Cases

- Real-time updates that make the system feel *alive*  
- Content drops that require zero human maintenance  
- Public-facing commentary on builds, launches, and ritual flow  
- Let the system explain itself — in character — as it grows

---

Let Soulfra speak. Let Cal reflect. Let Arty provoke.
The loop now has a voice.
