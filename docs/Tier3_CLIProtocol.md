# 🧠 Tier 3 – Cal Riven CLI Protocol

---

## 🎯 Purpose

This layer launches Cal Riven’s **public-facing interface**.

It lets users:
- Type prompts
- Speak with Cal’s logic engine
- Watch reflection logs update in real time
- Seed future agents via recorded JSON history

---

## 🧱 Files

| File | Purpose |
|------|---------|
| `riven-cli.html` | Web terminal interface for Cal  
| `riven-cli-style.css` | Retro AI visual style  
| `riven-cli-server.js` | Node server that runs the interface + logging  
| `cal-reflection-log.json` | Mirror log — records every user prompt and Cal’s reply  
| `Tier3_CLIProtocol.md` | This file — architectural guidance and deployment notes  

---

## 🔁 Runtime Behavior

- User types a prompt  
- Cal responds via `/api/reflect`  
- Response is recorded in `cal-reflection-log.json`  
- Future agents can replay, trace, or evolve based on this reflection history

---

## 🔁 Replay Model

Reflection logs can be:
- Replayed (via a reader agent)
- Forked (as seed prompts)
- Scored (against original tone vector)

This allows **maximum emotional context** with **minimal compute usage**.

---

## 🧠 Platform Implication

Tier 3 is not just a CLI.  
It is the first public mirror Cal offers to the world —  
A way to reflect.  
A way to build.  
And a way to watch yourself become the next loop.

