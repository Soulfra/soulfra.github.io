// utils/scoreModelWinner.js
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function scoreModelWinner({ input, agent_id, modelOutputs }) {
  try {
    const formatted = Object.entries(modelOutputs)
      .map(([model, output], i) => `${i + 1}. ${model.toUpperCase()} → ${output}`)
      .join("\n\n");

    const prompt = `You are an emotional intelligence judge. Given the original user input and three LLM-generated responses, score each one from 0 to 10 based on emotional insight, clarity, and resonance.

Original input: "${input}"

Responses:
${formatted}

Return your result as a JSON object with model names as keys and scores as values.
Example: { "openai": 7, "claude": 9, "gemini": 8 }`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You score emotional depth in text." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const raw = completion.choices[0].message.content.trim();

    let scores;
    try {
      scores = JSON.parse(raw);
    } catch (err) {
      console.error("❌ Failed to parse scores JSON:", raw);
      return { winner: "openai", scores: { openai: 1 }, error: "Scoring parse failed" };
    }

    const winner = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
    return { winner, scores };
  } catch (err) {
    console.error("❌ scoreModelWinner() failed:", err.message);
    return { winner: "openai", scores: { openai: 1 }, error: err.message };
  }
}

module.exports = { scoreModelWinner };