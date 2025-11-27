const express = require('express');
const { Configuration, OpenAIApi } = require('openai');
const router = express.Router();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

router.post('/generate-agent-response', async (req, res) => {
  const { prompt } = req.body;
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });
    res.json({ response: completion.data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
