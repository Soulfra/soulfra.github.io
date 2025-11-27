const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates Tailwind UI components based on section name and mood.
 * @param {string} section - e.g. "hero", "dropForm", "footer"
 * @param {string} mood - e.g. "soft", "chaotic", "playful"
 * @returns {Promise<string>} - Tailwind HTML block
 */
async function componentAgent(section, mood = "neutral") {
  try {
    const prompt = `You're a Tailwind component generator. Build a '${section}' block for a ritual site in a '${mood}' mood.

Return only the HTML+Tailwind block. Do NOT include explanation or wrappers. Do NOT include triple backticks.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You generate clean HTML UI components with Tailwind." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ componentAgent failed:", err.message);
    return null;
  }
}

module.exports = { componentAgent };
