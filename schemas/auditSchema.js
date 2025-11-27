module.exports = {
  type: "object",
  properties: {
    score: {
      type: "number",
      description: "Layout quality score, from 1 (worst) to 10 (best)"
    },
    notes: {
      type: "string",
      description: "Short summary of layout strengths or issues"
    },
    issues: {
      type: "array",
      items: { type: "string" },
      description: "List of class-level or structural layout problems"
    },
    timestamp: {
      type: "string",
      format: "date-time",
      description: "ISO 8601 UTC timestamp of the audit run"
    },
    dropName: {
      type: "string",
      description: "Name of the drop being audited"
    },
    mood: {
      type: "string",
      description: "Mood or emotional theme of the drop"
    },
    sourceAgent: {
      type: "string",
      description: "The agent or script that performed this audit"
    }
  },
  required: ["score", "notes", "issues", "timestamp", "dropName", "mood", "sourceAgent"]
};
