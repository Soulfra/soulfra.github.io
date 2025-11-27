const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.post('/', async (req, res) => {
  const { user_id } = req.body;

  if (!user_id) return res.status(400).json({ error: 'Missing user ID' });

  const { data, error } = await supabase
    .from('agent_logs')
    .select('input, output, traits')
    .eq('user_id', user_id);

  if (error) return res.status(500).json({ error: 'Failed to fetch logs' });

  const logString = data.map(log => `Input: ${log.input}\nOutput: ${log.output}\nTraits: ${JSON.stringify(log.traits)}`).join('\n---\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Summarize this user based on emotional patterns and agent logs.' },
        { role: 'user', content: logString }
      ]
    });

    const summary = response.choices[0].message.content.trim();
    res.json({ soulprint_summary: summary });
  } catch (err) {
    console.error('❌ Summarization failed:', err);
    res.status(500).json({ error: 'Summarization failed' });
  }
});

module.exports = router;