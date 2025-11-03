
# 🛠️ Soulfra Client Tools Overview

## What This Folder Contains:
All the tools needed for clients, partners, or new users to onboard, customize, and extend their own Soulfra instance — either locally or through a hosted environment.

---

## 🔧 Core Scripts

| Script | Purpose |
|--------|---------|
| `install-loop.sh` | Installs a local Soulfra runtime with loop and agent folders initialized  
| `build-agent-mask.js` | CLI wizard to generate a custom mask + persona from whisper  
| `submit-loop-to-network.js` | Sends a blessed loop to the global mesh via API  
| `qr-generate-bundle.js` | Produces scannable QR linking to loop export or summon page  
| `memory-diff-log.js` | Shows agent memory drift across sessions  
| `sync-mesh-peer.js` | Pairs your system with another live Soulfra mesh node

---

## 🔍 Companion Files

- `agent_templates/`  
- `loop_scaffolds/`  
- `mask_icons/`  
- `whisper_styles/`  
- `README_LOOP_SUMMON.md`  
- `QR/posters/`

---

## 🧪 Example Use Case

```bash
./install-loop.sh
node build-agent-mask.js
node qr-generate-bundle.js
```

You now have a working loop + mask + QR kit you can share, export, or fork.
