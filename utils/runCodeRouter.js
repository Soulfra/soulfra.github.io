const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates HTML or Tailwind code blocks from prompt + mood using LLM.
 * @param {string} prompt - Description of the UI needed.
 * @param {string} mood - Emotional tone (e.g. "soft", "chaotic", "brutalist").
 * @returns {Promise<string>} - Generated HTML/CSS/JS code block.
 */
async function runCodeRouter({ prompt, mood = "neutral" }) {
  try {
    const systemPrompt = `You are a frontend agent who writes emotionally styled HTML+Tailwind UI components. Mood: ${mood}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const code = response.choices[0].message.content.trim();
    return code;
  } catch (err) {
    console.error("❌ Code generation failed:", err.message);
    return null;
  }
}

module.exports = { runCodeRouter };