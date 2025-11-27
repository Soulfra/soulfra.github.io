const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  const { message } = req.body;

  if (!message) return res.status(400).json({ error: 'Missing input message' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Classify this message and suggest best-fit agent.' },
        { role: 'user', content: message }
      ]
    });

    const intent = response.choices[0].message.content.trim();
    res.json({ routed_agent: intent });
  } catch (err) {
    console.error('❌ Routing failed:', err);
    res.status(500).json({ error: 'Routing failed' });
  }
});

module.exports = router;