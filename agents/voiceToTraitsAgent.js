const { runLLM } = require("../utils/runLLM")
const { jsonEnforcer } = require("../utils/jsonEnforcer")
const { jsonLog } = require("../utils/jsonLog")

async function voiceToTraitsAgent({ user_id, transcript }) {
  if (!transcript || !user_id) {
    throw new Error("Missing transcript or user_id")
  }

  const prompt = `
Analyze the following spoken reflection. Score it for emotional traits.
Return JSON:
{
  "traits": {
    "brave": 0.9,
    "reflective": 0.7
  },
  "context": {
    "input": "...",
    "output": "..."
  }
}

Transcript:
"""${transcript}"""
`.trim()

  const output = await runLLM(prompt, "voiceToTraitsAgent")

  const result = {
    agentName: "voiceToTraitsAgent",
    userId: user_id,
    traits: output.traits,
    context: output.context,
    timestamp: new Date().toISOString()
  }

  jsonLog("voiceToTraitsAgent", { input: transcript, output: result })

  return result
}

module.exports = jsonEnforcer(voiceToTraitsAgent, "traitLog")