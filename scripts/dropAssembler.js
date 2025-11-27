const fs = require("fs")
const path = require("path")
const { componentAgent } = require("../agents/componentAgent")
const { formGeneratorAgent } = require("../agents/formGeneratorAgent")
const { layoutAuditAgent } = require("../agents/layoutAuditAgent")
const { layoutRewriterAgent } = require("../agents/layoutRewriterAgent")
const { jsonLog } = require("../utils/jsonLog")

const OUTPUT_DIR = path.join(__dirname, "../drops")

async function assembleDrop(name, mood) {
  console.log(`🔧 Assembling '${name}' drop with mood '${mood}'...`)

  const sections = ["intro", "form", "cta"]
  const components = await Promise.all(sections.map(async (section) => {
    if (section === "form") return await formGeneratorAgent(mood)
    return await componentAgent(section, mood)
  }))

  const initialDrop = {
    name,
    mood,
    layoutScore: 0,
    sections,
    branding: {
      art: {},
      voice: {},
      style: {},
      image: {}
    },
    createdAt: new Date().toISOString()
  }

  const scored = await layoutAuditAgent({ ...initialDrop, components })
  const finalDrop = await layoutRewriterAgent({ ...initialDrop, ...scored, components })

  const outputPath = path.join(OUTPUT_DIR, name)
  if (!fs.existsSync(outputPath)) fs.mkdirSync(outputPath, { recursive: true })

  fs.writeFileSync(path.join(outputPath, "index.json"), JSON.stringify(finalDrop, null, 2))
  jsonLog("dropAssembler", finalDrop)

  console.log(`✅ Drop assembled at /drops/${name}`)
}

if (require.main === module) {
  const [name, mood] = process.argv.slice(2)
  if (!name || !mood) {
    console.error("Usage: node dropAssembler.js <name> <mood>")
    process.exit(1)
  }

  assembleDrop(name, mood)
}