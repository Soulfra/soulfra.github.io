// /soulfra/memory-engine/agents/TokenGrantAgent.js

function grantTokens(user, baseXP) {
  if (!user) throw new Error('No user provided to grantTokens.');

  const baseTokens = Math.floor(baseXP / 100);
  user.soulfra_tokens = (user.soulfra_tokens || 0) + baseTokens;

  return user;
}

module.exports = {
  grantTokens
};