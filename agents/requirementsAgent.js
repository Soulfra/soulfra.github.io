const { schemas } = require("../schemas/schemaRegistry")
const fs = require("fs")
const path = require("path")

async function requirementsAgent({ name, type = "agent" }) {
  const doc = []

  doc.push(`# Soulfra ${type === "loop" ? "Loop" : "Agent"} Spec: \`${name}\``)
  doc.push(`Generated on: ${new Date().toISOString()}`)

  // Try to load schema if available
  if (schemas[name]) {
    doc.push(`## ✅ Schema Structure (${name})`)
    doc.push("```json")
    doc.push(JSON.stringify(schemas[name], null, 2))
    doc.push("```")
  } else {
    doc.push("⚠️ No schema found — agent may be schema-agnostic.")
  }

  // Load logs if available
  const logPath = path.join(__dirname, `../logs/runAgent-${name}.json`)
  if (fs.existsSync(logPath)) {
    const logs = JSON.parse(fs.readFileSync(logPath, "utf-8"))
    doc.push(`## 📄 Sample Output`)
    doc.push("```json")
    doc.push(JSON.stringify(logs.output || logs.results?.[0]?.output, null, 2))
    doc.push("```")
  } else {
    doc.push("ℹ️ No logs found. Run the agent to generate examples.")
  }

  doc.push(`## 🔄 Inputs Expected`)
  doc.push(`Pass in structured data matching the schema or agent expectations.`)

  doc.push(`## 📦 Suggested Use Cases`)
  if (name.includes("remix")) {
    doc.push("- Scoring creative remixes")
    doc.push("- Evaluating cultural originality")
  } else if (name.includes("trait") || name.includes("feedback")) {
    doc.push("- Collecting user reflections")
    doc.push("- Syncing to identity (soulprint)")
  } else {
    doc.push("- Use as part of a runLoop or ritual flow")
  }

  return doc.join("\n")
}

module.exports = requirementsAgent