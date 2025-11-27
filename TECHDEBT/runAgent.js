const express = require('express');
const router = express.Router();
const agents = require('../agents/agentRegistry.json');
const { callOpenAI } = require('../models/openai');
const { buildPrompt } = require('../utils/promptBuilder');
const { logAgentCall } = require('../utils/logAgentCall');
const { scoreTraitsFromOutput } = require('../utils/scoreTraitsFromOutput');
const { updateStreak } = require('../utils/presenceTracker');
const { updateTokenUsage } = require('../utils/tokenTracker');

router.post('/', async (req, res) => {
  const { agent, input, userId, env = 'prod' } = req.body;

  if (!agents[agent]) {
    console.error('❌ Agent not found in registry:', agent);
    return res.status(404).json({ error: 'Agent not found.' });
  }

  const agentConfig = agents[agent];

  if (!agentConfig.allowedEnvironments.includes(env)) {
    return res.status(403).json({ error: 'Agent not allowed in this environment.' });
  }

  try {
    console.log(`🧠 Running agent: ${agent} for user: ${userId}`);

    const prompt = buildPrompt(agentConfig.promptTemplate, input);
    console.log('📤 Prompt sent to LLM:\n', prompt);

    const result = await callOpenAI(prompt, agentConfig.llm || 'gpt-4');
    console.log('✅ LLM result preview:\n', result.slice(0, 100));

    const traits = await scoreTraitsFromOutput(result);
    console.log('🔍 Traits extracted:', traits);

    console.log("💾 Attempting to log to agent_logs...");
    console.log("🧠 Data preview:");
    console.log("  userId:", userId);
    console.log("  agent:", agent);
    console.log("  traits:", traits);
    console.log("  tokens:", 3);

    await logAgentCall({
      userId,
      agent,
      input,
      output: result,
      traits,
      tokens: 3
    });

    await updateStreak(userId);
    await updateTokenUsage(userId, 3);

    console.log('✅ Logged to database and returning response');
    return res.json({ result });

  } catch (err) {
    console.error('🔥 Agent execution error:', err.message);
    return res.status(500).json({ error: 'Agent execution failed.' });
  }
});

module.exports = router;