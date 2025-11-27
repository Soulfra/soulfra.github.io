// /schemas/traitInsightSchema.js
module.exports = {
  type: "object",
  properties: {
    topCombos: {
      type: "array",
      items: { type: "string" }
    },
    patterns: {
      type: "array",
      items: { type: "string" }
    },
    improvements: {
      type: "array",
      items: { type: "string" }
    },
    timestamp: { type: "string", format: "date-time" },
    source: { type: "string" }
  },
  required: ["topCombos", "patterns", "improvements", "timestamp", "source"],
  additionalProperties: false
}