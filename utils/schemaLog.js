const fs = require("fs")
const path = require("path")

function logSchemaCheck({ type, data, valid, errors }) {
  const log = {
    type,
    timestamp: new Date().toISOString(),
    valid,
    ...(valid ? { result: "✅ Passed" } : { result: "❌ Failed", errors }),
    sample: data
  }

  const logPath = path.join(__dirname, "../logs/schemaLog.json")
  const existing = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath))
    : []

  existing.push(log)
  fs.writeFileSync(logPath, JSON.stringify(existing, null, 2))
}

module.exports = { logSchemaCheck }