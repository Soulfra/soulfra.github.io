const Ajv = require("ajv")
const addFormats = require("ajv-formats")

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

// Import schemas
const dropSchema = require("./dropSchema")
const auditSchema = require("./auditSchema")
const agentLogSchema = require("./agentLogSchema")
const memorySchema = require("./memorySchema")
const traitLogSchema = require("./traitLogSchema")
const traitSchema = require("./traitSchema")
const traitInsightSchema = require("./traitInsightSchema")
const remixSchema = require("./remixSchema")

// Schema mapping
const schemas = {
  drop: dropSchema,
  audit: auditSchema,
  agentLog: agentLogSchema,
  memory: memorySchema,
  traitLog: traitLogSchema,
  trait: traitSchema,
  traitInsight: traitInsightSchema,
  remix: remixSchema
}

// Compile validators
const validators = Object.fromEntries(
  Object.entries(schemas).map(([key, schema]) => [key, ajv.compile(schema)])
)

// Validation utility
function validateSchema(type, data) {
  const validate = validators[type]
  if (!validate) throw new Error(`No schema found for type: ${type}`)

  const valid = validate(data)
  return {
    valid,
    errors: valid ? null : validate.errors
  }
}

module.exports = {
  ajv,
  validateSchema,
  validators,
  schemas
}