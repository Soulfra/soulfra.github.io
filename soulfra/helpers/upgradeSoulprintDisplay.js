// /memory-engine/helpers/upgradeSoulprintDisplay.js
export default function upgradeSoulprintDisplay(rawTraits) {
  if (!rawTraits) return {};

  const upgradedTraits = {};

  for (const [trait, value] of Object.entries(rawTraits)) {
    if (typeof value === 'number') {
      if (value >= 0.15) {
        const sacredNoise = (Math.random() * 0.04) - 0.02;
        const sacredValue = Math.max(0, value + sacredNoise);
        upgradedTraits[trait] = Math.round(sacredValue * 10) / 10;
      }
    }
  }

  return upgradedTraits;
}
