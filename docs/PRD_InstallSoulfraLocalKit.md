
# 🧩 PRD: install-soulfra-kit.sh

## Purpose:
Script to install and initialize the full Soulfra runtime locally, including mirror-shell, loop runtime, agents, and config.

---

## Flow:
1. Unpack `/Soulfra_LoopKit.zip`
2. Copy loop + agent templates to `/runtime/`
3. Initialize `/config/`
4. Launch `SoulfraSelfLaunchController.js`
5. Open browser to `/mirror-shell/`

---

## Optional:
- Prompt for whisper on install
- Offer to run in offline mode
- Generate starter loop + agent
