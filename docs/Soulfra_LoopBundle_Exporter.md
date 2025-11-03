
# 🔁 Loop Bundle Exporter — LoopBundleExporter.js

## Goal:
Collect all files, agent logs, tone states, and ledger entries for a given loop and package them into a zipped, versioned developer/copywriter bundle.

## Build:
- `/loop_logger/LoopBundleExporter.js`
- Inputs:
  - loop ID
  - agent memory
  - `/ledger/`
  - `/agents/`
- Output:
  - `/exports/loop_###_bundle.zip`
  - Includes `README.md`, build summary, and whisper origin

## Extras:
- Add diff map between loops (e.g. drift between 004 and 006)
