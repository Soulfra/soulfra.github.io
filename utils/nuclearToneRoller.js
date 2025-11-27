function rollToneTier() {
  const roll = Math.random();
  if (roll < 0.05) return "nuclear";     // 5% chance
  if (roll < 0.25) return "truth";       // 20% chance
  if (roll < 0.60) return "soft";        // 35% chance
  return "ignored";                      // 40% default
}

module.exports = { rollToneTier };