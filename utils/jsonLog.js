const fs = require("fs")
const path = require("path")

function jsonLog(filename, data) {
  const logPath = path.join(__dirname, `../logs/${filename}-${Date.now()}.json`)
  fs.writeFileSync(logPath, JSON.stringify(data, null, 2))
}

module.exports = { jsonLog }