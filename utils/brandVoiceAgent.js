const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates emotionally resonant microcopy for a ritual drop app.
 * @param {string} dropName - Name of the ritual or app (e.g. "NiceLeak")
 * @param {string} mood - Tone/style (e.g. "soft", "chaotic", "playful")
 * @returns {Promise<Object>} - Brand voice output with headline, tagline, CTAs
 */
async function brandVoiceAgent({ dropName, mood = "neutral" }) {
  try {
    const prompt = `You're an emotionally intelligent brand copywriter. Generate branded copy for a Gen Z ritual app called '${dropName}' in the tone of '${mood}'.

Return a JSON object with:
- headline: (short, punchy emotional hook)
- tagline: (1-liner explaining the vibe of the app)
- cta: { primary: ..., secondary: ... }
- voiceNote: (what this tone feels like, culturally)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an emotionally-aware brand voice generator." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const raw = response.choices[0].message.content.trim();
    const copy = JSON.parse(raw);
    return copy;
  } catch (err) {
    console.error("❌ Brand voice generation failed:", err.message);
    return null;
  }
}

module.exports = { brandVoiceAgent };