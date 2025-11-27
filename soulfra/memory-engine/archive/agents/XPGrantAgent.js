// /soulfra/memory-engine/agents/XPGrantAgent.js

function grantXP(user, baseXP) {
  if (!user) throw new Error('No user provided to grantXP.');

  user.soulfra_xp = (user.soulfra_xp || 0) + baseXP;
  user.soulfra_level = calculateLevel(user.soulfra_xp);

  return user;
}

function calculateLevel(xp) {
  if (xp < 1000) return 1;
  if (xp < 3000) return 2;
  if (xp < 6000) return 3;
  if (xp < 10000) return 4;
  return Math.floor(Math.log10(xp) * 10); // Exponential curve scaling
}

module.exports = {
  grantXP
};