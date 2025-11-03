
# 🌫️ PRD: DriftRatingEngine.js

## Purpose:
Score each loop or build decision with a drift volatility index. Flag conflict between agents or tone anomalies.

## Scoring Factors:
- Tone dissonance
- Loop entropy (how unclear the build is)
- Agent disagreement (via DriftLeak)
- Prophecy divergence
- Time delay / hesitation

## Output:
```json
{
  "loop": "Loop 060",
  "drift_score": 0.78,
  "risk_level": "volatile",
  "reason": ["tone mismatch", "Cal vs Arty conflict"]
}
```

Drift scores are used by:
- LoopBlessingDaemon
- Narration system
- SwipeUI
