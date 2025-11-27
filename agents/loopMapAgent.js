const path = require("path")
const fs = require("fs")

const loopPath = path.join(__dirname, "../utils/runtime/runLoop.js")

async function loopMapAgent({ loopName }) {
  if (!loopName) throw new Error("Missing loopName input")

  const source = fs.readFileSync(loopPath, "utf-8")
  const registryMatch = source.match(/const loopRegistry = ({[\s\S]*?})/)

  if (!registryMatch) throw new Error("Could not find loop registry")

  const loopRegistryCode = registryMatch[1]
  const loopRegistry = eval(`(${loopRegistryCode})`) // 🔐 local-only, safe

  const loop = loopRegistry[loopName]
  if (!loop) {
    return {
      loopName,
      exists: false,
      message: `No loop found for '${loopName}'`
    }
  }

  return {
    loopName,
    exists: true,
    sequence: loop,
    estimatedTokens: loop.length * 10,
    suggestedRuntime: `${loop.length * 30}s`
  }
}

module.exports = loopMapAgent