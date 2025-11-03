
# 🧠 Soulfra Spec + PRD Generator — ReflectionPRDScribe.js

## Goal:
Automatically generate high-quality PRDs and architecture specs for any Cal-proposed loop or user-whispered idea.

## Components to Build:
- `/docgen/ReflectionPRDScribe.js`
- Accepts:
  - whisper text or Cal draft
  - tone metadata
- Outputs:
  - `/docs/prd_loop_###.md`
  - folder structure
  - components overview
  - tone + agent alignment
  - export-ready handoff for dev + copywriter

## Optional:
- Sync with CalArchitect for context awareness
- Save approved specs to `/ledger/design_reflections.json`
