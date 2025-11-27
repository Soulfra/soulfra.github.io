const { runLLM } = require("../utils/runLLM")
const { jsonLog } = require("../utils/jsonLog")

async function layoutAuditAgent(html, mood = "neutral", dropName = "unknown") {
  const prompt = `You are a layout critic for emotional web apps.
Review the following HTML in the context of a '${mood}' drop.

Evaluate:
- spacing
- section balance
- readability
- tone alignment
- color and hierarchy issues

Return JSON:
{
  "score": (1–10),
  "notes": "...",
  "issues": ["...", "..."]
}

HTML:
${html}
  `.trim()

  const fallback = () => ({
    score: 6,
    notes: "Fallback layout audit (LLM failed)",
    issues: ["section imbalance", "low whitespace"],
    timestamp: new Date().toISOString(),
    mood,
    dropName,
    sourceAgent: "layoutAuditAgent"
  })

  const rawOutput = await runLLM(prompt, "layoutAuditAgent", fallback)

  const result = {
    ...rawOutput,
    timestamp: new Date().toISOString(),
    mood,
    dropName,
    sourceAgent: "layoutAuditAgent"
  }

  jsonLog("layoutAuditAgent", result)
  return result
}

module.exports = { layoutAuditAgent }