const { jsonEnforcer } = require("../utils/jsonEnforcer")
const { jsonLog } = require("../utils/jsonLog")

async function traitDeltaAgent({ original, remix }) {
  if (!original || !remix) {
    throw new Error("Missing trait maps for comparison.")
  }

  const delta = {}
  let tokenTotal = 0
  let growthSummary = []

  for (const trait in remix) {
    const before = original[trait] || 0
    const after = remix[trait]
    const change = parseFloat((after - before).toFixed(4))

    if (change > 0.1) {
      delta[trait] = change
      tokenTotal += Math.round(change * 100)
      growthSummary.push(`more ${trait}`)
    }
  }

  const result = {
    delta,
    tokens_awarded: tokenTotal,
    summary: growthSummary.length
      ? `You became ${growthSummary.join(" and ")}.`
      : "No meaningful emotional growth detected.",
    timestamp: new Date().toISOString()
  }

  jsonLog("traitDeltaAgent", { input: { original, remix }, output: result })
  return result
}

module.exports = jsonEnforcer(traitDeltaAgent, null) // Schema-optional