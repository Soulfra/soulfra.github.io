// /soulfra/memory-engine/agents/ReflectionBoostAgent.js

function applyReflectionBoost(user, triggeredTraits) {
  if (!user) throw new Error('No user provided to applyReflectionBoost.');

  const seasonTraitBoost = 'hope'; // Example active boosted trait this season
  let boostActive = false;

  if (triggeredTraits.includes(seasonTraitBoost)) {
    boostActive = true;
    user.soulfra_xp += 100; // Bonus XP for hitting boosted trait
  }

  return { user, boostActive };
}

module.exports = {
  applyReflectionBoost
};