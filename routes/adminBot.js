const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

router.post('/', async (req, res) => {
  const { agent_name, input } = req.body;

  if (!agent_name || !input) {
    return res.status(400).json({ error: 'agent_name and input are required' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: `You are AdminBot, a powerful utility agent for system tasks.` },
        { role: 'user', content: input }
      ]
    });

    const output = response.choices[0].message.content.trim();

    const { error } = await supabase.from('agent_logs').insert([
      {
        agent_name,
        input,
        output,
        traits: ['system', 'admin', 'utility']
      }
    ]);

    if (error) throw error;

    res.status(200).json({
      message: '✅ AdminBot response generated and logged',
      agent_name,
      input,
      output
    });

  } catch (err) {
    console.error('❌ AdminBot error:', err);
    res.status(500).json({ error: 'AdminBot failed to respond' });
  }
});

module.exports = router;