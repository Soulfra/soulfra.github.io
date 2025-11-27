const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates a DALL·E 3 image from a prompt and vibe description.
 * @param {string} prompt - Base visual description
 * @param {string} mood - Emotional theme or art style (e.g. "soft", "chaotic")
 * @returns {Promise<{ image_url: string, prompt_used: string, alt_text: string }>} Image metadata
 */
async function imageAgent(prompt, mood = "neutral") {
  try {
    const fullPrompt = `Illustration for a Gen Z emotional ritual drop site. Mood: '${mood}'. Theme: ${prompt}`;

    const result = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
    });

    return {
      image_url: result.data[0].url,
      prompt_used: fullPrompt,
      alt_text: `Ritual visual: ${mood} — ${prompt}`,
    };
  } catch (err) {
    console.error("❌ imageAgent failed:", err.message);
    return null;
  }
}

module.exports = { imageAgent };