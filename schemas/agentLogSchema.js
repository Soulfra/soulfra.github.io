module.exports = {
  type: "object",
  properties: {
    logId: { type: "string" },
    agentName: { type: "string" },
    version: { type: "string" },
    input: { type: ["string", "object"] },
    output: { type: ["string", "object"] },
    tags: {
      type: "array",
      items: { type: "string" }
    },
    traitsDetected: {
      type: "object",
      additionalProperties: { type: "number" }
    },
    createdAt: { type: "string", format: "date-time" }
  },
  required: ["agentName", "input", "output", "createdAt"],
  additionalProperties: false
}