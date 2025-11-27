module.exports = {
  type: "object",
  properties: {
    remixId: { type: "string" },
    originalDropId: { type: "string" },
    remixedBy: { type: "string" },
    timestamp: { type: "string", format: "date-time" },
    changes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          componentId: { type: "string" },
          changeType: { type: "string" },
          oldValue: { type: ["string", "object"] },
          newValue: { type: ["string", "object"] }
        },
        required: ["componentId", "changeType", "oldValue", "newValue"]
      }
    },
    score: {
      type: "object",
      properties: {
        originality: { type: "number" },
        coherence: { type: "number" },
        emotionalImpact: { type: "number" }
      },
      required: ["originality", "coherence", "emotionalImpact"]
    }
  },
  required: ["remixId", "originalDropId", "remixedBy", "timestamp", "changes", "score"],
  additionalProperties: false
}