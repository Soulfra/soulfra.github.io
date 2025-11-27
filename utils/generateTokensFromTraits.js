/**
 * Calculate token rewards from trait change.
 * @param {object} oldTraits - Existing soulprint
 * @param {object} newTraits - Updated soulprint
 * @returns {object} { tokens_awarded, breakdown }
 */
function generateTokensFromTraits(oldTraits, newTraits) {
  const breakdown = {}
  let total = 0

  for (const trait in newTraits) {
    const before = oldTraits[trait] || 0
    const after = newTraits[trait]
    const delta = parseFloat((after - before).toFixed(4))

    // Rule: reward positive emotional growth
    if (delta > 0.15) {
      const tokens = Math.floor(delta * 100) // +0.2 = 20 tokens
      breakdown[trait] = { delta, tokens }
      total += tokens
    }

    // Optional: reward brand new traits
    if (!(trait in oldTraits) && after > 0.2) {
      breakdown[trait] = { delta, tokens: 10 }
      total += 10
    }
  }

  return {
    tokens_awarded: total,
    breakdown
  }
}

module.exports = { generateTokensFromTraits }