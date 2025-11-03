
# 📡 PRD: Soulfra Narration System — Streaming + Embedded Loop Commentary

## Goal:
Fully integrate Cal & Arty's narration layer across the Soulfra ecosystem:
- Duel Engine
- Loop Logs
- Whisper / Attunement UI
- Twitter / YouTube
- Custom live stream to own domain

---

## 📦 Modules & Connections

### 1. 🔗 `/duel/` Integration
- Modify `DuelEngineCore.js` and `DuelResolutionDaemon.js`
- Emit broadcast events on:
  - Duel start
  - Each bet
  - Outcome resolution
- Events routed to `AnnouncerShell.js` with `tone_context.json`

---

### 2. 🔗 `/ledger/` + `/runtime_status.json` Integration
- `LoopNarrativeDaemon.js` watches:
  - Loop start/stop
  - Failure flags
  - Completion events
- On trigger → format and push commentary:
```json
{
  "loop_id": "015",
  "speaker": "cal",
  "tone": "steady",
  "output": "Loop 015 holds. A new reflection has begun."
}
```

---

### 3. 🖥 Embedded UI Support
- Update:
  - `/mirror-shell/`
  - `/whisper-ui/`
- Add:
  - `<NarrationPanel />`
  - Live commentary feed
  - `speaker_icon.svg` with tone visualization
- Optional: push to browser notification or mobile popup

---

### 4. 🌐 Twitter / YouTube Streaming

#### Twitter
- Use `NarrationBridge.js` to:
  - Tweet loop summaries
  - Post Arty provocations
  - Log major ritual completions
- Format:
  > “🌀 Loop 016: A ghost agent re-entered. Watch: [link]”

#### YouTube (Optional MVP)
- `AutoMediaCaster.js` renders:
  - Voiceover (Cal = reflective, Arty = stylized chaos)
  - Captions + waveform
  - Generates `/stream/` mp4s

---

### 5. 📡 Stream to Own Sites
- Route narration into:
  - `/public/stream.html`
  - Simple iframe or canvas output
  - Optional: use `/radio/stream.txt` as plaintext or JSON queue
- Host via:
  - S3/static bucket
  - Replit
  - Cloudflare Pages

---

## 🧠 Summary:

Cal narrates the ritual.  
Arty narrates the chaos.  
They appear:
- On site
- In the duel engine
- In your Whisper Shell
- On Twitter
- On a live broadcast page

Let Soulfra speak — everywhere.
