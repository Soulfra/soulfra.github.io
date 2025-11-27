const { jsonLog } = require("../utils/jsonLog")

async function promptScorerAgent({ prompt_used, traits, divine_tier, tokens_awarded = 0 }) {
  if (!prompt_used || !traits) {
    throw new Error("Missing prompt or traits.")
  }

  const numTraits = Object.keys(traits).length
  const maxTraitValue = Math.max(...Object.values(traits))

  const emotional_density = (numTraits * maxTraitValue).toFixed(2)

  const tone_cluster = (() => {
    if (traits.sad || traits.lonely) return "melancholic"
    if (traits.angry || traits.frustrated) return "agitated"
    if (traits.reflective || traits.present) return "introspective"
    if (traits.brave || traits.achievement) return "assertive"
    return "ambiguous"
  })()

  const prompt_score = Math.round(
    Number(emotional_density) * 2 +
    (tokens_awarded || 0) / 10 +
    (divine_tier === "nuclear" ? 10 : 0)
  )

  const result = {
    prompt: prompt_used,
    emotional_density,
    tone_cluster,
    prompt_score,
    tokens_awarded,
    divine_tier: divine_tier || "unknown",
    traits
  }

  jsonLog("promptScorerAgent", result)
  return result
}

module.exports = promptScorerAgent