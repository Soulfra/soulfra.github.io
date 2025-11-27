async function applyTraitDecay(user, daysInactive = 30) {
  if (!user.trait_xp) return user;

  const decayRate = 0.05; // 5% decay per inactivity window

  Object.keys(user.trait_xp).forEach(trait => {
    user.trait_xp[trait] = Math.floor(user.trait_xp[trait] * (1 - decayRate));
  });

  return user;
}

module.exports = {
  applyTraitDecay
};