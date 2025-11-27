module.exports = {
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
    category: { type: "string" }, // e.g. "emotional", "social", "cognitive"
    examplePhrases: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["name", "description", "category"],
  additionalProperties: false
}