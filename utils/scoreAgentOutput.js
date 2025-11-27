const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extracts up to 3 traits from agent output using OpenAI.
 * @param {string} output - The LLM-generated response text.
 * @returns {Promise<string[]>} - An array of up to 3 emotional traits.
 */
async function scoreAgentOutput(output) {
  try {
    const prompt = `Extract 1 to 3 concise emotional traits from the following response. Return only lowercase traits as a JSON array.\n\nResponse:\n"""${output}"""`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You extract emotional traits from language." },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 60,
    });

    const raw = completion.choices[0].message.content.trim();
    const traits = JSON.parse(raw);
    return traits;
  } catch (err) {
    console.error("❌ Trait scoring failed:", err.message);
    return ["reflective"]; // fallback trait
  }
}

module.exports = { scoreAgentOutput };