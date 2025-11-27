const express = require('express');
const router = express.Router();
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post('/', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Design a modular UI component or description from this prompt.' },
        { role: 'user', content: prompt }
      ]
    });

    const uiOutput = response.choices[0].message.content.trim();
    res.json({ ui_module: uiOutput });
  } catch (err) {
    console.error('❌ UI generation failed:', err);
    res.status(500).json({ error: 'UI generation failed' });
  }
});

module.exports = router;