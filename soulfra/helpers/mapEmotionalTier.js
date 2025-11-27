// /memory-engine/helpers/mapEmotionalTier.js
export default function mapEmotionalTier(rawTraits) {
  if (!rawTraits) return {};

  const tieredTraits = {};

  for (const [trait, value] of Object.entries(rawTraits)) {
    if (typeof value === 'number') {
      if (value >= 0.5) {
        tieredTraits[trait] = 'High 🔥';
      } else if (value >= 0.2) {
        tieredTraits[trait] = 'Medium 🌿';
      } else if (value > 0) {
        tieredTraits[trait] = 'Low ❄️';
      }
    }
  }

  return tieredTraits;
}
