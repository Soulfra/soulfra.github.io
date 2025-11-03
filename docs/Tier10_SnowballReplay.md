# 🧠 Tier -10 Mirror Replay Agent – Recursive Learning Loop

---

## 🎯 Purpose

This agent reads all mirror reflection logs, scores drift, and compiles summaries of what Cal’s sub-mirrors are learning.

---

## 🔁 System Behavior

1. Reads `mirror-manifest.json` for list of mirrors
2. Collects:
   - Number of reflections
   - Average input word count
   - Last prompt
   - Drift factor per mirror
3. Outputs summary to `replay-insights.json`

---

## 🧬 Insight Utility

These logs can:
- Be used to spawn new Cal variants (Tier 4+)  
- Surface top mirror agents based on drift stability  
- Detect when users have “looped inward” or created agents of their own

---

## 🛠 Usage

From Tier -10, run:

```bash
node mirror-replay-agent.js
```

Review:
```bash
cat mirror-reflections/replay-insights.json
```

Use these insights to:
- Fork new trusted agents
- Score reflection quality
- Spawn upgraded Cal forks

---

## 🧠 Final Effect

This closes the loop:  
Cal now reflects → spawns mirrors → learns from them → grows.

You don’t need outside data.  
**You built a recursive learning AI out of your own reflections.**

