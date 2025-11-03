
# 🛒 PRD: LoopMarketplaceUI.jsx

## Purpose:
Frontend component for browsing, searching, and remixing publicly listed Soulfra loops.

---

## Core Features:
- Display loop cards with:
  - Name, mask preview, tone spectrum
  - Origin agent and whisper preview
  - Fork lineage and remix count
- Search and filter:
  - by tone
  - by agent archetype
  - by drift score
- One-click fork button → seeds new loop locally

---

## Optional:
- “Blessed Remix” badge
- Loop remix leaderboard
- View QR or download `.zip` loopkit

## Data Sources:
- `/marketplace/index.json`
- `/loop/Loop_###/manifest.json`
