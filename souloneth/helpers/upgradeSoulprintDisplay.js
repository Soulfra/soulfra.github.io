// /helpers/upgradeSoulprintDisplay.js (Sacred Display Upgrader)

export default function upgradeSoulprintDisplay(rawTraits) {
  if (!rawTraits) return {};

  const upgradedTraits = {};

  for (const [trait, value] of Object.entries(rawTraits)) {
    if (typeof value === 'number') {
      // Only show traits above meaningful sacred threshold
      if (value >= 0.15) {
        // Add slight sacred noise to prevent exact reverse engineering
        const sacredNoise = (Math.random() * 0.04) - 0.02; // ±0.02 drift
        const sacredValue = Math.max(0, value + sacredNoise);

        // Round to 1 decimal for cleaner public display
        upgradedTraits[trait] = Math.round(sacredValue * 10) / 10;
      }
    }
  }

  return upgradedTraits;
}
