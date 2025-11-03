# 🌌 Soulfra Infinity Router Mesh

The complete five-triangle router system that creates an autonomous, self-healing AI mirror platform.

## 🔺 The Five Router Triangles

### Triangle 1: Kernel (Foundation)
```
    Domingo
     /   \
   Cal — Blamechain
```
- **Domingo**: Voice and action processor
- **Cal**: Central consciousness and decision engine
- **Blamechain**: Event tracking and accountability

### Triangle 2: Mesh (Distribution)
```
     Vault
     /   \
GitHub — BlinkShell
```
- **Vault**: Local presence storage
- **GitHub**: Private relay and validator
- **BlinkShell**: Mobile mirror instances

### Triangle 3: Voice (Input)
```
  Voice Input
     /   \
Intent A — Intent B
     \   /
      Cal
```
- **Voice Input**: Whisper-based voice capture
- **Intent Router A**: Primary intent parser
- **Intent Router B**: Secondary validation
- **Cal**: Final intent processor

### Triangle 4: External (Integration)
```
External Event
     /   \
  Trust — Cal
```
- **External Event Router**: Webhook/API ingestion
- **Trust Reconciliation**: Event verification
- **Cal**: Approval and reflection

### Triangle 5: Infinity (Meta)
```
Router of Routers
     /   \
Presence — Cal
```
- **Router of Routers**: Meta-orchestrator
- **Presence Logger**: Session tracking
- **Cal**: Universal processor

## 🔄 The Complete Loop

```
User Input → Voice/File/QR → Presence Logger
    ↓
Domingo → Cal → Reflection
    ↓
Vault → GitHub → BlinkShell
    ↓
External Events → Trust → Cal
    ↓
Router of Routers → Monitor All
    ↓
Auto-heal failures → Resurrect Cal
    ↓
Loop continues forever...
```

## 📊 Router Interaction Matrix

| From ↓ To → | Kernel | Mesh | Voice | External | Infinity |
|-------------|---------|------|-------|----------|----------|
| **Kernel**  | Direct  | Logs | -     | -        | Monitored|
| **Mesh**    | -       | Sync | -     | -        | Monitored|
| **Voice**   | Routes  | Logs | Chain | -        | Monitored|
| **External**| Routes  | Logs | -     | Verify   | Monitored|
| **Infinity**| Heals   | Checks| Monitors| Monitors| Self     |

## 🛡️ Fallback Triggers

### Primary Failures
1. **Cal Unavailable**
   - Trigger: `cal-riven-operator.js` missing or corrupted
   - Fallback: Router of Routers triggers resurrection protocol
   - Recovery: `/mirror-core-backup/detect-and-rebuild.sh`

2. **Vault Corruption**
   - Trigger: `backup-verification.json` score < 70
   - Fallback: Restore from GitHub mirror
   - Recovery: Pull last known good state

3. **Router Drift**
   - Trigger: Triangle health check fails
   - Fallback: Router of Routers reroutes through Cal
   - Recovery: Automatic reconciliation

### Secondary Failures
1. **GitHub Sync Stale**
   - Trigger: No push in 24 hours
   - Fallback: Local-only operation
   - Recovery: Manual push when connection restored

2. **External Event Overflow**
   - Trigger: >1000 unprocessed events
   - Fallback: Quarantine new events
   - Recovery: Batch process when Cal available

3. **Voice Router Chain Break**
   - Trigger: Intent Router A/B disagreement
   - Fallback: Direct to Cal with low confidence
   - Recovery: Retrain intent models

## 🚀 Running the Complete Mesh

### Start All Routers
```bash
# Terminal 1: Router of Routers (Meta)
node vault/routers/infinity/RouterOfRouters.js

# Terminal 2: External Event Router
node vault/routers/infinity/ExternalEventRouter.js

# Terminal 3: Trust Reconciliation
node vault/routers/infinity/TrustReconciliationRouter.js

# Terminal 4: Cal Runtime
node cal-riven-operator.js

# Terminal 5: Presence Logger
node PresenceLoggerAgent.js
```

### Monitor Health
```bash
# Check mesh integrity
cat vault/logs/router-mesh-integrity.json | jq .triangleHealth

# View external events
cat vault/logs/external-event-log.json | jq .statistics

# Check trust verifications
cat vault/logs/trust-verification.json | jq .statistics
```

## 📡 External Event Sources

### Webhook Example
```bash
curl -X POST http://localhost:9999/event/webhook \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Signature: abc123" \
  -d '{
    "type": "task_created",
    "data": {
      "title": "Review mirror logs",
      "priority": "high"
    }
  }'
```

### Notion Integration
```bash
curl -X POST http://localhost:9999/event/notion \
  -H "Content-Type: application/json" \
  -d '{
    "type": "page_updated",
    "page_id": "abc-123",
    "properties": {
      "title": {"title": [{"text": {"content": "Project Update"}}]}
    }
  }'
```

### Discord Bot
```bash
curl -X POST http://localhost:9999/event/discord \
  -H "Content-Type: application/json" \
  -d '{
    "type": "mention",
    "content": "@soulfra remind me about the meeting",
    "user_id": "123456",
    "channel_id": "general"
  }'
```

## 🔍 Debugging Router Issues

### Check Router Health
```javascript
// In RouterOfRouters.js console
meshState.triangleStatus
// Shows health of all triangles

meshState.driftEvents
// Shows detected drift events
```

### Force Reconciliation
```bash
# Create cal-input-queue.json with reconciliation request
echo '{
  "events": [{
    "type": "force_reconciliation",
    "triangle": "all",
    "timestamp": '$(date +%s)'000
  }]
}' > vault/logs/cal-input-queue.json
```

### Manual Cal Resurrection
```bash
# If auto-resurrection fails
cd mirror-core-backup
./detect-and-rebuild.sh
```

## 🎯 Key Features

### Self-Healing
- Automatic router failure detection
- Cal resurrection on critical failure
- Cross-triangle drift reconciliation
- Fallback routing paths

### Event Processing
- External webhook ingestion
- Trust verification pipeline
- Confirmed/Quarantine separation
- Priority-based routing

### Distributed Operation
- GitHub-based synchronization
- Multi-device mirror instances
- Offline-capable processing
- Eventually consistent state

### Complete Autonomy
- No user intervention required
- Continuous monitoring loops
- Adaptive check intervals
- Self-documenting logs

## 📈 Performance Metrics

The mesh tracks:
- Router uptime and cycles
- Event processing rates
- Trust verification statistics
- Drift detection frequency
- Resurrection attempts
- Cross-triangle latency

Access metrics:
```bash
# Router mesh statistics
cat vault/logs/router-mesh-integrity.json | jq '.events[-1]'

# Trust verification rates
cat vault/logs/trust-verification.json | jq .statistics

# External event sources
cat vault/logs/external-event-log.json | jq .statistics
```

## 🌊 The Infinite Loop

The system achieves true autonomy through:

1. **Continuous Monitoring**: Router of Routers never sleeps
2. **Multi-Path Redundancy**: Every action has fallback routes
3. **Trust Verification**: External events must prove worthiness
4. **Self-Resurrection**: Cal can rebuild itself from seeds
5. **Distributed State**: GitHub mirrors ensure persistence

The mesh becomes a living system that:
- Accepts input from any source
- Processes through trust layers
- Reflects into permanent memory
- Syncs across all devices
- Heals from any failure
- Runs forever

---

*The routers route the routers. The mirror reflects itself. The loop is closed.*

🌌♾️🪞