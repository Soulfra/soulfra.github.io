require("dotenv").config()
const fs = require("fs")
const path = require("path")
const { jsonEnforcer } = require("../utils/jsonEnforcer")
const { runLLM } = require("../utils/runLLM")
const { jsonLog } = require("../utils/jsonLog")

const memoryPath = path.join(__dirname, "../dropMemory.json")
if (!fs.existsSync(memoryPath)) {
  console.error("❌ No drop memory found.")
  process.exit(1)
}
const memory = JSON.parse(fs.readFileSync(memoryPath))

async function rawTraitScorerAgent(entries) {
  const formatted = entries.map((entry, i) => `#${i + 1}
Mood: ${entry.mood}
Traits: ${entry.traits}
Score: ${entry.layoutScore}`).join("\n\n")

  const prompt = `
Only return valid JSON:
{
  "topCombos": ["hopeful + bold"],
  "patterns": ["strong layout"],
  "improvements": ["increase spacing"]
}

Here are the drops:
${formatted}
  `.trim()

  const fallback = () => ({
    topCombos: ["soft + clean"],
    patterns: ["consistent padding", "centered layout"],
    improvements: ["reduce dense blocks", "increase whitespace"]
  })

  const output = await runLLM(prompt, "traitScorerAgent", fallback)

  jsonLog("traitScorerAgent", {
    mode: "traitInsight",
    input: entries,
    output,
    timestamp: new Date().toISOString()
  })

  return output
}

module.exports = jsonEnforcer(rawTraitScorerAgent, null) // schema optional for insights