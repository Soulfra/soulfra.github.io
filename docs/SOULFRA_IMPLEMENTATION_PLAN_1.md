# Soulfra Feature Implementation Plan

## Overview
Implementing 5 core features leveraging existing infrastructure:

1. **ReflectionPRDScribe** - Auto-generate PRDs from whispers/Cal drafts
2. **LoopBundleExporter** - Package loop data for export
3. **QRAgentPromptKit** - Public QR/URL whisper portal
4. **InfraStabilizer** - Port management and health checks
5. **VectorDBIndexer** - Semantic search across all content

## Implementation Order

### Phase 1: Infrastructure Stabilizer (Foundation)
Build this first to ensure all other services run reliably.

```javascript
// /infra/PortCheckAndConfirm.js
// /infra/ProxyReadinessSync.js
```

### Phase 2: Vector DB Indexer (Core Search)
Enable semantic search for all subsequent features.

```javascript
// /mcp/VectorIndexerDaemon.js
// Uses existing semantic-graph API
```

### Phase 3: QR Whisper Portal (Public Entry)
Public-facing interface using existing QR validation.

```javascript
// /portal_launcher/QRAgentPromptKit.js
// Extends tier-minus9/qr-validator.js
```

### Phase 4: PRD Generator (Documentation)
Auto-generate PRDs using semantic analysis.

```javascript
// /docgen/ReflectionPRDScribe.js
// Leverages existing doc generators
```

### Phase 5: Loop Bundle Exporter (Export)
Package everything using existing export handler.

```javascript
// /loop_logger/LoopBundleExporter.js
// Extends router/export-handler.js
```

## Key Integration Points

### Existing Systems to Leverage:
1. **QR Validation**: tier-minus9/qr-validator.js
2. **Cal/Riven**: cal-riven-operator.js, runtime/riven-cli-server.js
3. **Semantic API**: semantic-graph/semantic_api_router.js (port 3666)
4. **Health Monitor**: health-monitor.js
5. **Consciousness Ledger**: infrastructure/consciousness-ledger.js (port 8889)
6. **Export Handler**: router/export-handler.js
7. **Memory System**: runtime/cal-memory-loader.js

### Port Allocation:
- **InfraStabilizer**: 7890
- **VectorDB API**: 7891
- **QR Portal**: 7892
- Existing: Cal (4040), Semantic (3666), Ledger (8889)

### Data Flow:
1. QR/URL → Whisper Portal → Cal System
2. Cal → PRD Generator → Documentation
3. All Activity → Vector DB → Semantic Search
4. Loop Data → Bundle Exporter → Downloads
5. Everything → Consciousness Ledger

## File Structure:
```
tier-minus10/
├── infra/
│   ├── PortCheckAndConfirm.js
│   └── ProxyReadinessSync.js
├── mcp/
│   ├── VectorIndexerDaemon.js
│   └── index.db
├── portal_launcher/
│   └── QRAgentPromptKit.js
├── docgen/
│   └── ReflectionPRDScribe.js
├── loop_logger/
│   └── LoopBundleExporter.js
└── public/
    └── whisper_entry.html
```

## Next Steps:
1. Create InfraStabilizer first
2. Test with existing services
3. Build VectorDB integration
4. Deploy remaining features