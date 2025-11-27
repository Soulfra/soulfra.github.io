const path = require("path")
const fs = require("fs")
const { validateSchema } = require("../../schemas/schemaRegistry")
const { jsonLog } = require("../jsonLog")

const AGENT_DIR = path.join(__dirname, "../../agents")

// ✅ Schema map: only validate agents that should conform to a schema
const schemaMap = {
  voiceToTraitsAgent: "traitLog",
  traitScorerAgent: "traitLog",
  layoutAuditAgent: "audit",
  remixScorerAgent: "remix",
  traitDeltaAgent: null,
  recordFeedback: "feedbackLog",
  voiceOfGodAgent: null, // ✅ we skip schema validation here
  LORBGReflectionLoop: "traitLog" // ✅ final output gets validated
}

async function runAgent(name, input) {
  const filePath = path.join(AGENT_DIR, `${name}.js`)
  if (!fs.existsSync(filePath)) {
    throw new Error(`❌ Agent not found: ${name}`)
  }

  const agentModule = require(filePath)

  const agentFn =
    typeof agentModule === "function"
      ? agentModule
      : typeof agentModule[name] === "function"
      ? agentModule[name]
      : null

  if (!agentFn) {
    throw new Error(`❌ Could not resolve agent function for: ${name}`)
  }

  const output = await agentFn(input)

  const schema = schemaMap[name]

  console.log("🛠 Running agent:", name)
  console.log("🧪 Output returned:", output)
  console.log("🧬 Schema selected:", schema || "none")

  const validation = schema ? validateSchema(schema, output) : { valid: true }

  if (!validation.valid) {
    console.warn(`⚠️ Schema validation failed for ${name} → ${schema}:\n`, validation.errors)
  }

  jsonLog(`runAgent-${name}`, {
    agent: name,
    input,
    output,
    schema: schema || "none",
    validation,
    timestamp: new Date().toISOString()
  })

  return output
}

module.exports = { runAgent }