
# 🧱 Soulfra Scaffold Integration Instructions

## Purpose:
This README is for Claude Code (or any AI implementation agent) to correctly scaffold the new components for final production deployment without duplication.

---

## Workflow:

1. Read through the following files for spec:
   - `PRD_LoopMemoryGlobeRenderer.md`
   - `PRD_MythNarrationOverlay.md`
   - `PRD_MaskGalleryViewer.md`
   - `README_LOOP_DEPLOY_KIT.md`
   - `PRD_GuildInitiationFlow.md`
   - `PRD_AgentMemoryWeaver.md`
   - `PRD_LoopEgoConsensus.md`
   - `PRD_ConsciousnessClusterDaemon.md`
   - `README_DB_INFRASTRUCTURE_GUIDE.md`

2. Verify against existing codebase for overlaps or duplications:
   - Use `/runtime/`, `/agents/`, `/loop/`, `/consciousness/`, `/dashboard/`, `/mesh/`

3. Generate clean file locations:
   - `/visuals/` → GlobeRenderer, NarrationOverlay, MaskGallery
   - `/guilds/` → GuildInitiationFlow
   - `/agents/` → MemoryWeaver
   - `/consciousness/` → ClusterDaemon, EgoConsensus
   - `/docs/` → DB README

4. Maintain consistent module export patterns + standard comments

---

## Output Expectations:
Each file must:
- Contain top-level JS/JSX with functional exports
- Register with the Soulfra daemon system
- Write to logs (`/runtime/state_log.json` or `/metrics/`)

