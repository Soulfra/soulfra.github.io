const { runLLM } = require("../utils/runLLM")
const { jsonEnforcer } = require("../utils/jsonEnforcer")
const { jsonLog } = require("../utils/jsonLog")

async function remixScorerAgent({ originalDrop, remixedDrop }) {
  const prompt = `
You're a cultural critic evaluating a user-generated remix of a web drop.

Compare the following two drops:
- Original: ${JSON.stringify(originalDrop, null, 2)}
- Remix: ${JSON.stringify(remixedDrop, null, 2)}

Score the remix using the following criteria (1.0 = max):
{
  "originality": number,
  "coherence": number,
  "emotionalImpact": number
}

Return only valid JSON. No markdown. No extra commentary.
  `.trim()

  const fallback = () => ({
    originality: 0.7,
    coherence: 0.8,
    emotionalImpact: 0.75
  })

  const score = await runLLM(prompt, "remixScorerAgent", fallback)

  const result = {
    ...score,
    timestamp: new Date().toISOString(),
    remixId: remixedDrop.remixId || "unknown",
    originalDropId: originalDrop.dropId || "unknown",
    remixedBy: remixedDrop.createdBy || "anonymous"
  }

  jsonLog("remixScorerAgent", { input: { originalDrop, remixedDrop }, output: result })
  return result
}

module.exports = jsonEnforcer(remixScorerAgent, "remix")