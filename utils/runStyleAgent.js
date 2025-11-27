const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Suggests subtle styling cues based on emotional mood.
 * @param {string} mood - Tone of the app (e.g. "soft", "chaotic", "playful")
 * @returns {Promise<Object>} - Suggested style rules
 */
async function runStyleAgent(mood = "neutral") {
  try {
    const prompt = `You are a frontend stylist for emotionally intelligent ritual sites. 
Suggest Tailwind CSS-based style treatments for mood '${mood}'.
Return only subtle, non-jarring animations (NO bounce, NO spin, NO shake).
Favor transitions, fade, scale, or pulse. Keep radius and hover soft.

Return a JSON object with:
- borderRadius: (e.g. 'rounded-lg', 'rounded-full')
- hoverEffect: (e.g. 'hover:scale-105', 'hover:shadow-md')
- textStyle: (e.g. 'tracking-wide', 'text-opacity-90')
- animation: (e.g. 'animate-fade', 'transition duration-200 ease-in')
- layoutPadding: (e.g. 'p-6 md:p-12')
- styleNote: (summary of how it will feel)`; 

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You generate Tailwind UI styling strategies for Gen Z rituals, avoiding bounce or chaotic motion.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 300,
    });

    const raw = response.choices[0].message.content.trim();
    const styles = JSON.parse(raw);
    return styles;
  } catch (err) {
    console.error("❌ runStyleAgent failed:", err.message);
    return null;
  }
}

module.exports = { runStyleAgent };