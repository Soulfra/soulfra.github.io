function calculateTokenCost(agentConfig) {
  return agentConfig.tokens?.cost || 1;
}

function calculateTokenReward(agentConfig) {
  return agentConfig.tokens?.reward || 0;
}

module.exports = { calculateTokenCost, calculateTokenReward };