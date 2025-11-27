const fs = require("fs")
const path = require("path")
const { validateSchema } = require("../schemas/schemaRegistry")

const FOLDER = process.argv[2] || path.join(__dirname, "../logs")

function scanAndValidateFiles() {
  const files = fs.readdirSync(FOLDER).filter(f => f.endsWith(".json"))
  let passed = 0, failed = 0

  files.forEach(file => {
    const filePath = path.join(FOLDER, file)
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"))

    const inferredType = file.split("-")[0]
    try {
      const { valid, errors } = validateSchema(inferredType, content)
      if (valid) {
        console.log(`✅ ${file} passed (${inferredType})`)
        passed++
      } else {
        console.warn(`❌ ${file} failed (${inferredType}):`)
        console.warn(errors)
        failed++
      }
    } catch (e) {
      console.error(`⚠️ ${file}: unknown schema type "${inferredType}"`)
      failed++
    }
  })

  console.log(`\n🎯 Validation Summary: ${passed} passed / ${failed} failed`)
}

scanAndValidateFiles()