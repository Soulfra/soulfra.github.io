// /soulfra/memory-engine/agents/TraitScoreAgent.js

async function scoreTraits(inputText) {
  if (!inputText) return {};

  // Simple trait detection (expand later with LLMs)
  const traits = {};

  if (inputText.includes('forgive')) traits.forgiveness = true;
  if (inputText.includes('love')) traits.love = true;
  if (inputText.includes('hope')) traits.hope = true;
  if (inputText.includes('regret')) traits.regret = true;
  if (inputText.includes('courage')) traits.courage = true;

  return traits;
}

module.exports = {
  scoreTraits
};