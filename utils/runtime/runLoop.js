const runAgent = require("./runAgent")
const { jsonLog } = require("../jsonLog")

// Define your loop recipes here
const loopRegistry = {
  remixReview: [
    "remixScorerAgent",
    "traitScorerAgent",
    "recordFeedback"
  ],
  soulprintRefresh: [
    "voiceToTraitsAgent", // updated for transcript-based reflection
    "recordFeedback"
  ]
}

/**
 * Run a named multi-agent loop
 * @param {string} loopName - e.g. "remixReview"
 * @param {object} initialInput - input to pass to the first agent
 * @returns {object[]} - Array of agent outputs
 */
async function runLoop(loopName, initialInput) {
  const loop = loopRegistry[loopName]
  if (!loop) {
    throw new Error(`❌ Unknown loop: ${loopName}`)
  }

  const results = []
  let input = initialInput

  for (const agentName of loop) {
    try {
      const output = await runAgent(agentName, input)
      results.push({ agent: agentName, input, output })
      input = output // pass to next agent
    } catch (err) {
      console.error(`⚠️ runLoop error on ${agentName}:`, err.message)
      results.push({ agent: agentName, error: err.message })
      break
    }
  }

  jsonLog(`runLoop-${loopName}`, { input: initialInput, results })
  return results
}

module.exports = { runLoop }