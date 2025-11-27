const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates content clusters for soft lore, quotes, values, or footer sections.
 * @param {string} dropName - App/ritual name (e.g. "NiceLeak")
 * @param {string} mood - Emotional tone (e.g. "soft", "chaotic")
 * @returns {Promise<Object>} - Cluster of text sections
 */
async function contentClusterAgent(dropName, mood = "neutral") {
  try {
    const prompt = `You're a ritual content cluster agent. Create the supporting text blocks for a ritual microsite called '${dropName}' with a '${mood}' tone.

Return a JSON object with:
- quoteWall: array of short poetic or reflective quotes
- values: list of 3–5 emotional principles this site lives by
- footerText: short 1–2 sentence cultural outro or vibe sendoff
- softRitual: 1–2 sentence call to presence or interaction at the end`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a cultural content writer for emotional experiences." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const raw = response.choices[0].message.content.trim();
    const content = JSON.parse(raw);
    return content;
  } catch (err) {
    console.error("❌ contentClusterAgent failed:", err.message);
    return null;
  }
}

module.exports = { contentClusterAgent };
