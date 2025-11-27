// utils/styleUnifierAgent.js
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Harmonizes Tailwind styles across multiple HTML sections.
 */
async function styleUnifierAgent(sections, mood = "neutral") {
  try {
    const prompt = `You're a Tailwind design director. Given multiple sections from a '${mood}' ritual drop, rewrite each to share:
- color palette
- radius
- spacing system
- hover + animation

Return just an array of harmonized HTML blocks.`;

    const input = sections.join("\n\n---\n\n");

    const res = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You unify web section styles across components." },
        { role: "user", content: `${prompt}\n\nSECTIONS:\n${input}` },
      ],
      temperature: 0.6,
      max_tokens: 1000,
    });

    const output = res.choices[0].message.content.trim();
    return output.split(/---+/).map(b => b.trim());
  } catch (err) {
    console.error("❌ styleUnifierAgent failed:", err.message);
    return null;
  }
}

module.exports = { styleUnifierAgent };