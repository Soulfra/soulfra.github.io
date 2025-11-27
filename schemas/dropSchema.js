module.exports = {
  type: "object",
  required: ["name", "mood", "layoutScore", "sections", "branding"],
  properties: {
    name: { type: "string" },
    mood: { type: "string" },
    layoutScore: { type: "number" },
    sections: {
      type: "array",
      items: { type: "string" }
    },
    branding: {
      type: "object",
      required: ["art", "voice", "style", "image"],
      properties: {
        art: {
          type: "object",
          properties: {
            accentColors: { type: "array", items: { type: "string" } },
            backgroundStyle: { type: "string" },
            emojis: { type: "array", items: { type: "string" } }
          }
        },
        voice: {
          type: "object",
          properties: {
            headline: { type: "string" },
            tagline: { type: "string" },
            cta: {
              type: "object",
              properties: {
                primary: { type: "string" },
                secondary: { type: "string" }
              }
            },
            voiceNote: { type: "string" }
          }
        },
        style: {
          type: "object",
          properties: {
            borderRadius: { type: "string" },
            hoverEffect: { type: "string" },
            textStyle: { type: "string" },
            animation: { type: "string" },
            layoutPadding: { type: "string" }
          }
        },
        image: {
          type: "object",
          properties: {
            image_url: { type: "string" },
            alt_text: { type: "string" },
            prompt_used: { type: "string" },
            source: { type: "string" }
          }
        }
      }
    },
    remixOf: { type: "string" },
    createdAt: { type: "string", format: "date-time" }
  }
};