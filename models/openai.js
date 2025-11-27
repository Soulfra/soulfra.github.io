const axios = require('axios');

async function callOpenAI(prompt, model = "gpt-4") {
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages: [{ role: "user", content: prompt }]
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 10000
      }
    );

    return response.data.choices[0].message.content.trim();

  } catch (error) {
    console.error("❌ Error from OpenAI:", error.message);
    throw error;
  }
}

module.exports = { callOpenAI };