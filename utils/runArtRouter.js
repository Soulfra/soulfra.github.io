const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates branding suggestions: hero image theme, emoji pack, background style.
 * @param {string} dropName - App or ritual name (e.g., "NiceLeak")
 * @param {string} mood - Emotional tone (e.g. "playful", "chaotic", "soft")
 * @returns {Promise<object>} - Theme recommendations
 */
async function runArtRouter({ dropName, mood = "neutral" }) {
  try {
    const prompt = `You are a branding art agent. Suggest visual themes for an emotional ritual app called ${dropName}. The mood is '${mood}'.

Return a JSON object with:
- heroImagePrompt: (short description for a banner)
- backgroundStyle: (e.g. gradient, noise, blur)
- emojis: (3–5 relevant emojis)
- accentColors: (up to 3 Tailwind-style colors)
- styleNotes: (one-liner about aesthetic vibe)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are an emotionally-aware branding assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const raw = response.choices[0].message.content.trim();
    const theme = JSON.parse(raw);
    return theme;
  } catch (err) {
    console.error("❌ Art routing failed:", err.message);
    return null;
  }
}

module.exports = { runArtRouter };