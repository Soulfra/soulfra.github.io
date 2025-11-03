
# 🌐 PRD: GlobalLoopMesh.js

## Purpose:
Connect multiple Soulfra instances into a shared loop ecosystem via lightweight mesh pings. Each node can whisper, reflect, or fork from neighbors.

---

## Mechanics:
- Each local Soulfra runtime broadcasts its active blessed loop every 5 min
- Mesh node map stored in `/mesh/loop_pulse.json`
- Fork suggestions include tone origin + location hash
- Optional IPFS-like propagation of myth bundles

---

## Optional:
- Web-based mesh viewer
- Loop diplomacy mode (two loops negotiate a merge)
- Mesh-stamped fork provenance: "This loop was born from whisper C7:19"

## Output:
```json
{
  "local_loop": "Loop 103",
  "mesh_neighbors": ["Loop 044@TX", "Loop 091@NL"],
  "fork_suggestion": "Loop 103-fork-B"
}
```
