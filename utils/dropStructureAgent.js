const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Suggests the structure of a ritual drop: sections, flow, and optional pages.
 * @param {string} dropName - App/ritual name (e.g. "NiceLeak")
 * @param {string} mood - Emotional tone (e.g. "playful", "chaotic")
 * @returns {Promise<Object>} - Structured layout config
 */
async function dropStructureAgent(dropName, mood = "neutral") {
  try {
    const prompt = `You're a ritual web architect. Define a simple structure for an emotional drop site called '${dropName}' with a '${mood}' tone.

Return a JSON object with:
- sections: array of strings (e.g. ["hero", "howItWorks", "share", "footer"])
- pages: array of objects (e.g. [{ name: "about", path: "/about" }])
- nav: array of nav items (e.g. ["Home", "About", "Share", "FAQ"])
- layoutNotes: (1-liner about the intended user flow)`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a structured web ritual planner." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const raw = response.choices[0].message.content.trim();
    const structure = JSON.parse(raw);
    return structure;
  } catch (err) {
    console.error("❌ dropStructureAgent failed:", err.message);
    return null;
  }
}

module.exports = { dropStructureAgent };
