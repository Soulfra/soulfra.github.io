# Cal Drop Orchestrator Implementation Plan

## Overview
Implementing 3 interconnected systems based on the 6 documents:

1. **Cal Drop Orchestrator** - Automatic file processing pipeline
2. **Git Loop Integrator** - Semantic Git tracking with tone awareness
3. **Duel Engine & Odds Market** - AI-powered betting on loop outcomes

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Cal Drop Orchestrator                   │
│  Watches /cal-drop/incoming/ for new files              │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    Intent Router                         │
│  Classifies files by type and purpose                   │
└──────┬──────────┬───────────┬──────────┬───────────────┘
       │          │           │          │
       ▼          ▼           ▼          ▼
   ┌───────┐  ┌────────┐  ┌────────┐  ┌─────────┐
   │  .md  │  │  .js   │  │ .json  │  │  .git   │
   │Claude │  │Runtime │  │ Tone   │  │ Commit  │
   └───────┘  └────────┘  └────────┘  └─────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                Git Loop Integrator                       │
│  Tracks all changes with semantic meaning               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Duel Engine & Odds Market                   │
│  Bets on loop success rates and outcomes                │
└─────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Cal Drop Orchestrator Core
Build the file watching and routing system.

```javascript
// /cal-drop/CalDropWatcher.js
// /cal-drop/IntentRouter.js
// /cal-drop/processors/
```

### Phase 2: Git Loop Integrator
Add semantic Git tracking.

```javascript
// /git-loop/ReflectiveGitCommitter.js
// /git-loop/GitLoopIntegrator.js
// /git-loop/DriftRecoveryPlanner.js
```

### Phase 3: Claude Integration
Connect Claude for .md processing.

```javascript
// /cal-drop/processors/ClaudePushDaemon.js
// Uses existing Claude patterns
```

### Phase 4: Duel Engine
Build the betting system.

```javascript
// /duel/DuelEngineCore.js
// /duel/DynamicOddsEngine.js
// /duel/OrderBookSimulator.js
```

### Phase 5: Integration & UI
Connect everything with dashboards.

```javascript
// /ui/DuelDashboard.js
// /ui/CalDropStatus.js
```

## Key Integration Points

### Existing Systems to Leverage:
1. **TaskRouterDaemon.js** - Pattern for CalDropWatcher
2. **AI_ECONOMY_GITHUB_AUTOMATION.py** - Git operations
3. **ConsciousnessLedger** - Event tracking (port 8889)
4. **VectorIndexer** - Semantic search (port 7891)
5. **Chat Processor** - Tone analysis (port 8080)

### New Ports:
- **Cal Drop API**: 7893
- **Git Loop API**: 7894
- **Duel Engine**: 7895

### Directory Structure:
```
tier-minus10/
├── cal-drop/
│   ├── CalDropWatcher.js
│   ├── IntentRouter.js
│   ├── processors/
│   │   ├── MarkdownProcessor.js
│   │   ├── JavaScriptProcessor.js
│   │   ├── JsonProcessor.js
│   │   └── ClaudePushDaemon.js
│   └── incoming/          # Watch this directory
├── git-loop/
│   ├── ReflectiveGitCommitter.js
│   ├── GitLoopIntegrator.js
│   ├── DriftRecoveryPlanner.js
│   └── GitSyncLog.json
├── duel/
│   ├── DuelEngineCore.js
│   ├── DynamicOddsEngine.js
│   ├── OrderBookSimulator.js
│   ├── DuelResolutionDaemon.js
│   └── PlayFeedAdapter.js
├── loops/
│   ├── active/
│   ├── archived/
│   └── ledger/
└── design-reflections/
    ├── raw/
    ├── processed/
    └── commits/
```

## Data Flow

1. **File Drop**: User drops file into `/cal-drop/incoming/`
2. **Detection**: CalDropWatcher detects new file
3. **Classification**: IntentRouter determines file type and purpose
4. **Processing**: 
   - .md → Claude → Generated code
   - .js → Runtime evaluation
   - .json → Tone/config update
5. **Git Tracking**: ReflectiveGitCommitter creates semantic commit
6. **Loop Creation**: System creates/updates loop in ledger
7. **Odds Update**: Duel Engine calculates success probability
8. **Reflection**: Results stored in design-reflections

## Integration with Existing Features

### From Previous Implementation:
- **InfraStabilizer**: Monitors Cal Drop services
- **VectorIndexer**: Indexes dropped files for search
- **QR Portal**: Can trigger file drops via whispers
- **PRD Generator**: Processes .md PRDs automatically
- **Bundle Exporter**: Packages completed loops

### Unified Event Flow:
1. QR Whisper → PRD Generation → File Drop
2. File Drop → Claude Processing → Code Generation
3. Code Generation → Git Commit → Loop Update
4. Loop Update → Odds Calculation → Duel Market
5. All Events → Consciousness Ledger → Dashboard

## Next Steps:
1. Create CalDropWatcher first
2. Test with simple file drops
3. Add Git integration
4. Deploy Claude processor
5. Build Duel Engine