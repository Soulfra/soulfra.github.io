
# 📊 PRD: LoopInsightDashboard.jsx

## Purpose:
Show users (especially execs, creators, therapists) insight into their loop history, agent trends, tone bias, and reflection feedback.

---

## Modules:
- Loop timeline with tone banding
- Agent performance log (mask drift, tone score)
- Whisper-to-loop converter stats
- Drift risk alert

---

## Optional:
- “Narrated Insight” mode (Cal reads last 5 loop results)
- Share insight snapshot
- PDF download for client reflection or therapy

## Output:
```json
{
  "user": "founder_X",
  "loops_blessed": 9,
  "primary_tones": ["urgency", "wonder"],
  "agent_stability": 0.91
}
```
