module.exports = {
  type: "object",
  properties: {
    memoryId: { type: "string" },
    userId: { type: "string" },
    timestamp: { type: "string", format: "date-time" },
    source: { type: "string" },
    traits: {
      type: "object",
      additionalProperties: { type: "number" }
    },
    moods: {
      type: "object",
      additionalProperties: { type: "number" }
    },
    context: {
      type: "object",
      properties: {
        inputSnippet: { type: "string" },
        outputSnippet: { type: "string" },
        tags: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["inputSnippet", "outputSnippet"]
    }
  },
  required: ["userId", "timestamp", "traits", "moods", "source"],
  additionalProperties: false
}