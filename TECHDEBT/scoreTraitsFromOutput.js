const axios = require('axios');

async function scoreTraitsFromOutput(output) {
  const prompt = `You're an emotional trait classifier.

Given the following agent response, identify up to 3 emotional or personality-based traits that describe the tone, attitude, or style of the response.

Output your answer as a JSON array of lowercase strings.

Agent response:
${output}`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    const traits = JSON.parse(response.data.choices[0].message.content.trim());
    return traits;
  } catch (err) {
    console.error("❌ Trait scoring failed:", err.message);
    return [];
  }
}

module.exports = { scoreTraitsFromOutput };