const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates a ritual form for emotional input (e.g. leak, reflection, soulprint).
 * @param {string} purpose - e.g. "submit a compliment anonymously", "reflect on hesitation"
 * @param {string} mood - e.g. "soft", "playful", "chaotic"
 * @returns {Promise<string>} - A Tailwind-styled form block
 */
async function formGeneratorAgent(purpose, mood = "neutral") {
  try {
    const prompt = `You're a UX form generator for emotional ritual drops. Build a Tailwind-styled HTML form for the purpose: '${purpose}'. Tone: '${mood}'.

Return only the HTML form block. No explanation. No triple backticks.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You generate emotionally aligned UX forms using Tailwind." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ formGeneratorAgent failed:", err.message);
    return null;
  }
}

module.exports = { formGeneratorAgent };
