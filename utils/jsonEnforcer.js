const fs = require("fs")
const path = require("path")
const { validateSchema } = require("../schemas/schemaRegistry")
const { logSchemaCheck } = require("./schemaLog")

function jsonEnforcer(agentFn, schemaName = null) {
  return async function wrappedAgent(input) {
    const result = await agentFn(input)

    let parsedOutput
    try {
      parsedOutput = typeof result === "string" ? JSON.parse(result) : result
    } catch (err) {
      throw new Error(`Agent output is not valid JSON:\n${result}`)
    }

    if (schemaName) {
      const { valid, errors } = validateSchema(schemaName, parsedOutput)
      logSchemaCheck({ type: schemaName, data: parsedOutput, valid, errors })

      if (!valid) {
        throw new Error(
          `Schema validation failed for ${schemaName}:\n` +
          JSON.stringify(errors, null, 2)
        )
      }
    }

    // Optional file-based trace (per-agent if needed)
    const logPath = path.join(__dirname, `../logs/${schemaName || 'agent'}-${Date.now()}.json`)
    fs.writeFileSync(logPath, JSON.stringify({ input, output: parsedOutput }, null, 2))

    return parsedOutput
  }
}

module.exports = { jsonEnforcer }