// /scripts/scanBrokenImports.js
const fs = require("fs")
const path = require("path")

const ROOT_DIR = path.join(__dirname, "..")
const UTILS_IMPORT = '../utils/'
const AGENTS = [
  "traitScorerAgent",
  "componentAgent",
  "formGeneratorAgent",
  "layoutAuditAgent",
  "layoutRewriterAgent"
]

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8")
  const lines = content.split("\n")
  const matches = []

  lines.forEach((line, index) => {
    if (line.includes(UTILS_IMPORT)) {
      AGENTS.forEach(agent => {
        if (line.includes(agent)) {
          matches.push({ line: index + 1, lineText: line.trim(), agent })
        }
      })
    }
  })

  return matches
}

function scanDirRecursive(dirPath) {
  const results = []
  fs.readdirSync(dirPath).forEach(file => {
    const fullPath = path.join(dirPath, file)
    if (fs.lstatSync(fullPath).isDirectory()) {
      results.push(...scanDirRecursive(fullPath))
    } else if (file.endsWith(".js")) {
      const matches = scanFile(fullPath)
      if (matches.length) {
        results.push({ file: fullPath, matches })
      }
    }
  })
  return results
}

const findings = scanDirRecursive(ROOT_DIR)
if (findings.length === 0) {
  console.log("✅ No broken agent imports found from /utils/")
} else {
  console.log("⚠️ Fix these:")
  findings.forEach(({ file, matches }) => {
    console.log(`\n🔧 File: ${file}`)
    matches.forEach(({ line, lineText, agent }) => {
      const fixed = lineText.replace("../utils/", "../agents/")
      console.log(`  Line ${line}: ${lineText}`)
      console.log(`  ➤ Suggested: ${fixed}\n`)
    })
  })
}