const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Regenerates a single HTML block based on layout audit issues.
 * @param {string} html - Raw section HTML to rewrite
 * @param {string[]} issues - List of class-level issues or spacing concerns
 * @param {string} mood - e.g. "soft", "chaotic"
 * @returns {Promise<string>} - Rewritten HTML block
 */
async function layoutRewriterAgent(html, issues = [], mood = "neutral") {
  try {
    const prompt = `You are a layout refinement agent for emotional websites. Rewrite the following Tailwind HTML block to address the following issues: ${issues.join(", ") || "none listed"}.
The tone is '${mood}'.

Return only the corrected HTML block. Do not explain or annotate.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a layout repair assistant for ritual design systems.",
        },
        {
          role: "user",
          content: `${prompt}\n\nOriginal HTML:\n${html}`,
        },
      ],
      temperature: 0.6,
      max_tokens: 800,
    });

    const raw = response.choices[0].message.content.trim();

    // ✅ Clean out markdown code block wrappers
    const cleaned = raw.replace(/```html|```/g, "").trim();

    return cleaned;
  } catch (err) {
    console.error("❌ layoutRewriterAgent failed:", err.message);
    return html; // fallback to original block
  }
}

module.exports = { layoutRewriterAgent };