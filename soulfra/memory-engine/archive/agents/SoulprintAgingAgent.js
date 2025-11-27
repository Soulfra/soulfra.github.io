// /soulfra/memory-engine/agents/SoulprintAgingAgent.js

async function applySoulprintAging(user) {
  if (!user) return user;

  const decayRate = 0.01; // 1% trait decay per inactive cycle

  if (user.trait_xp) {
    for (const trait of Object.keys(user.trait_xp)) {
      user.trait_xp[trait] = Math.floor(user.trait_xp[trait] * (1 - decayRate));
    }
  }

  return user;
}

module.exports = {
  applySoulprintAging
};