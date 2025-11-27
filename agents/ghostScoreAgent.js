const { runAgent } = require("../utils/runtime/runAgent")
const { jsonLog } = require("../utils/jsonLog")

const ghostMessages = {
  1: "You barely ghosted. Honestly, you just left yourself on seen.",
  2: "That’s a ‘we still follow each other’ kind of ghost.",
  3: "Ghosted? Yes. But not in a memorable way.",
  4: "Someone would screenshot that then never reply.",
  5: "Classic ‘read at 11:47am’ energy.",
  6: "Now that’s what I call a soft haunt.",
  7: "You disappeared with trace amounts of mystery.",
  8: "You ghosted like it was a ritual. We respect it.",
  9: "You vanished. No closure. No crumbs. A true phantom.",
  10: "You evaporated with elegance. The divine was watching."
}

function scoreToTier(score) {
  if (score >= 9) return 10
  if (score >= 8) return 9
  if (score >= 7) return 8
  if (score >= 6) return 7
  if (score >= 5) return 6
  if (score >= 4) return 5
  if (score >= 3) return 4
  if (score >= 2) return 3
  if (score >= 1) return 2
  return 1
}

async function ghostScoreAgent({ user_id, confession }) {
  if (!user_id || !confession) throw new Error("Missing user_id or confession")

  const traitsResult = await runAgent("voiceToTraitsAgent", { user_id, transcript: confession })
  const traits = traitsResult?.traits || {}

  const traitVals = Object.values(traits)
  const ghostScore = traitVals.length > 0 ? traitVals.reduce((a, b) => a + b, 0) : 0
  const ghostTier = scoreToTier(ghostScore * 2)

  const ghostMessage = ghostMessages[ghostTier] || "Ghost level unknown. Maybe you blocked God?"

  const result = {
    agentName: "ghostScoreAgent",
    userId: user_id,
    traits,
    ghost_score: ghostScore.toFixed(2),
    ghost_tier: ghostTier,
    ghost_message: ghostMessage,
    timestamp: new Date().toISOString()
  }

  jsonLog("ghostScoreAgent", result)
  return result
}

module.exports = ghostScoreAgent