module.exports = {
  type: "object",
  properties: {
    logId: { type: "string" },
    userId: { type: "string" },
    agentName: { type: "string" },
    traits: {
      type: "object",
      additionalProperties: { type: "number" }
    },
    context: {
      type: "object",
      properties: {
        input: { type: "string" },
        output: { type: "string" }
      },
      required: ["input", "output"]
    },
    timestamp: { type: "string", format: "date-time" }
  },
  required: ["userId", "agentName", "traits", "context", "timestamp"],
  additionalProperties: false
}