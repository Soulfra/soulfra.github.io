const { xpTable, tokenMultipliers, luckyDropChances } = require('./xpConstants');

async function grantXP(user, baseXP, triggeredTraits = []) {
  if (!user) throw new Error('User not found');

  user.soulfra_xp = (user.soulfra_xp || 0) + baseXP;
  user.soulfra_level = calculateLevelFromXP(user.soulfra_xp);

  if (!user.trait_xp) user.trait_xp = {};
  triggeredTraits.forEach(trait => {
    user.trait_xp[trait] = (user.trait_xp[trait] || 0) + Math.floor(baseXP / 2);
  });

  const luckyReward = checkLuckyDrop(user);
  return { user, luckyReward };
}

function calculateLevelFromXP(xp) {
  for (let i = xpTable.length - 1; i >= 0; i--) {
    if (xp >= xpTable[i]) return i + 1;
  }
  return 1;
}

function calculateTokenReward(baseTokens, level) {
  if (level >= 91) return Math.floor(baseTokens * tokenMultipliers["91-99"]);
  if (level >= 71) return Math.floor(baseTokens * tokenMultipliers["71-90"]);
  if (level >= 31) return Math.floor(baseTokens * tokenMultipliers["31-70"]);
  return Math.floor(baseTokens * tokenMultipliers["1-30"]);
}

function checkLuckyDrop(user) {
  const roll = Math.random();
  if (roll <= luckyDropChances.soulSurge) {
    return { type: 'Soul Surge', bonusTokens: randomRange(100, 1000) };
  }
  return null;
}

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  grantXP,
  calculateLevelFromXP,
  calculateTokenReward,
  checkLuckyDrop
};