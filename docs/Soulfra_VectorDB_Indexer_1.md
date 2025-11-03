
# 🧩 Vector Search + MCP Index Layer

## Goal:
Build a local vector store + semantic map (MCP-style) to allow Soulfra to access, cluster, and route across all nested loop files, agent logs, ledger entries, and whisper documents.

## Build:
- `/mcp/VectorIndexerDaemon.js`
- Uses:
  - local vector DB (e.g. chroma, weaviate, qdrant)
  - semantic embeddings
- Input:
  - `/docs/`, `/ledger/`, `/agents/`, `/runtime/`
- Output:
  - `/mcp/index.db`
  - `/semantic_map.json`
- Use:
  - Enable Cal + Claude to find relevant history fast
  - Route loop proposals via similarity search
