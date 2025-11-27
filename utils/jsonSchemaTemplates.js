module.exports = {
  brandingSchema: {
    type: "object",
    required: ["voice", "style", "art", "content", "image", "mood"],
    properties: {
      voice: {
        type: "object",
        required: ["headline", "tagline", "cta", "voiceNote"],
        properties: {
          headline: { type: "string" },
          tagline: { type: "string" },
          voiceNote: { type: "string" },
          cta: {
            type: "object",
            required: ["primary", "secondary"],
            properties: {
              primary: { type: "string" },
              secondary: { type: "string" }
            }
          }
        }
      },
      style: {
        type: "object",
        required: ["borderRadius", "hoverEffect", "textStyle", "animation", "layoutPadding"],
        properties: {
          borderRadius: { type: "string" },
          hoverEffect: { type: "string" },
          textStyle: { type: "string" },
          animation: { type: "string" },
          layoutPadding: { type: "string" }
        }
      },
      art: {
        type: "object",
        required: ["backgroundStyle", "accentColors", "emojis"],
        properties: {
          backgroundStyle: { type: "string" },
          accentColors: { type: "array", items: { type: "string" } },
          emojis: { type: "array", items: { type: "string" } }
        }
      },
      content: {
        type: "object",
        required: ["footerText", "softRitual"],
        properties: {
          footerText: { type: "string" },
          softRitual: { type: "string" }
        }
      },
      image: {
        type: "object",
        required: ["image_url", "alt_text", "prompt_used", "source"],
        properties: {
          image_url: { type: "string" },
          alt_text: { type: "string" },
          prompt_used: { type: "string" },
          source: { type: "string" }
        }
      },
      mood: { type: "string" },
      remixOf: { type: "string" }
    }
  },

  auditSchema: {
    type: "object",
    required: ["score", "notes", "issues"],
    properties: {
      score: { type: "number" },
      notes: { type: "string" },
      issues: {
        type: "array",
        items: { type: "string" }
      }
    }
  },

  traitMemorySchema: {
    type: "object",
    required: ["mood", "traits", "layoutScore", "headline", "primaryCTA", "imageSource"],
    properties: {
      mood: { type: "string" },
      traits: { type: "string" },
      layoutScore: { type: "number" },
      headline: { type: "string" },
      primaryCTA: { type: "string" },
      imageSource: { type: "string" },
      scoreNotes: { type: "string" },
      issues: { type: "array", items: { type: "string" } },
      remixOf: { type: "string" }
    }
  }
};
