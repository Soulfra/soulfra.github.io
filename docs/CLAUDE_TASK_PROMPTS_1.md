
# 🧠 Claude Code Implementation Task Prompts

## Prompt 1: Loop Memory Globe Renderer

> Implement `LoopMemoryGlobeRenderer.js` as defined in `PRD_LoopMemoryGlobeRenderer.md`.  
> Use Three.js or a minimal WebGL wrapper. Render all blessed loops from `/loop/`.  
> Size = impact, Color = tone. Hover shows last whisper. Connect via `/visuals/`.

---

## Prompt 2: Mask Gallery Viewer

> Build `MaskGalleryViewer.jsx` per the spec.  
> Render all agent masks from `/agents/*/mask.svg` with tone filters.  
> Add mask tone ring. Connect to `/mirror-shell/` as `gallery.html`.

---

## Prompt 3: Narration Overlay

> Add `MythNarrationOverlay.jsx` and stream it via `/radio/stream.txt`.  
> Overlay on all `/stream/`, `/onboard/`, and `/dashboard/` routes.  
> Narrator = Cal or Arty. Pulse with tone metadata.

---

## Prompt 4: Guild Initiation Ritual

> Create `GuildInitiationFlow.js`.  
> Sync multi-user whispers, compare tone spread, and spawn shared mask.  
> Save to `/guilds/manifest.json`.

---

## Prompt 5: Memory Weaving Agent Log

> Implement `AgentMemoryWeaver.js`.  
> Persist whisper → tone → loop reflection history in `/agents/{id}/memory/`.  
> Trigger reflective prompts at threshold drift intervals.

---

## Prompt 6: Ego-Based Loop Consensus

> Build `LoopEgoConsensus.js`.  
> Let agents vote on loop survival via `/loop/ego_vote.json`.  
> Optional: blend emotion + logic scores to determine final blessing.

---

## Prompt 7: Consciousness Cluster Daemon

> Add `ConsciousnessClusterDaemon.js`.  
> Detect thematic or tonal clustering in `/loop/`, `/whisper/`, `/agent/`.  
> Log to `/consciousness/clusters/`.

---

## Prompt 8: DB Infra Setup

> Reference `README_DB_INFRASTRUCTURE_GUIDE.md`.  
> Scaffold `/neo4j/`, `/postgres/`, and `/runtime/cache/` initialization files.  
> Add live sync hooks from blessing + whisper events.
