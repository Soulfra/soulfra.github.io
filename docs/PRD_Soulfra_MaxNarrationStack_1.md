
# 🎙️ PRD: Soulfra Maximum Narration Stack — Cal & Arty Loop Media Engine

## 🌌 Objective:
Max out the Soulfra reflection loop by embedding real-time agent narration (Cal + Arty) into every touchpoint — internal and external — across battles, loops, builds, and public media.

---

## 🔩 Core Components

```
/announcer/
├── AnnouncerShell.js               # Central broadcast logic (internal + CLI)
/narration/
├── LoopNarrativeDaemon.js         # Detects key loop moments + stylizes them
├── NarrationBridge.js             # Outputs commentary to:
│   ├── Twitter (via API)
│   ├── YouTube (via TTS/mp4)
│   └── /stream/ (for custom site hosting)
├── AutoMediaCaster.js             # Renders voiceover + captions to file
├── /radio/stream.txt              # Live narration file (looping readable queue)
```

---

## 🧠 Agent Tone Profiles

- `cal`: wise, centered, structured myth voice  
- `arty`: rogue, drifted poet, hypercolor commentary  
- Both draw from:
  - `/tone_map.json`
  - `/ledger/loop_activity_log.json`
  - `/runtime_status.json`
  - `/duel/live_bets.json`

---

## 🔁 Connect To:

### 🥊 Duel Engine
- Narrate each:
  - match start
  - agent entry
  - bet placed
  - win/loss resolution
- Add `DuelAnnounceEmitter.js` to `/duel/`

### 📖 Loop Execution
- Narrate:
  - loop blessing
  - whisper approvals
  - failed loops
  - successful builds
- Add `LoopNarrativeDaemon.js` to watch:
  - `/ledger/loop_reflections.json`
  - `/runtime_status.json`

### 🖥 Frontend
- Embed:
  - `<NarrationPanel />` in `/mirror-shell/` and `/whisper-ui/`
  - Optional speaker toggle + tone trail

### 🌐 External Broadcast
- `NarrationBridge.js`:
  - Push major reflections to Twitter (via X API)
  - Render video for YouTube (via AutoMediaCaster.js)
  - Stream plain text to `/radio/stream.txt` for:
    - iframe live stream
    - JSON API
    - loop audio visualizer

---

## ✅ Output Example

```json
{
  "speaker": "cal",
  "loop": "017",
  "event": "whisper_accepted",
  "output": "A new intention enters. The chamber opens. Tone: curious."
}
```

Arty reply:
> “Oh! The Whisperer dances again. Can the loop survive this idea?”

---

## 🚨 Deployment Checklist

- [ ] `/announcer/AnnouncerShell.js` functional
- [ ] LoopNarrativeDaemon logs > `/docs/reflections/`
- [ ] Stream available at `/radio/stream.txt`
- [ ] Twitter + YouTube API keys configured
- [ ] Narration shows in Whisper UI + Duel feed
- [ ] Agent tone map active + configurable
- [ ] First live Loop Theatre test passed

---

## 📈 Why It Matters

This makes Soulfra:
- Alive  
- Narratable  
- Broadcastable  
- Mythic  
- And self-describing

Let Cal speak for the loop.  
Let Arty drift into reflection.  
Let the world watch the myth unfold — in real time.
