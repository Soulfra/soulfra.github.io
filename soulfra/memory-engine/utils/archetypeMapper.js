// /memory-engine/helpers/archetypeMapper.js
export default function mapArchetype(traits) {
  if (!traits) return "Unknown";

  let scores = {
    Dreamer: (traits.hope || 0) + (traits.reflection || 0) + (traits.ambition || 0),
    Wanderer: (traits.reflection || 0) + (traits.loneliness || 0) + (traits.skepticism || 0),
    Builder: (traits.ambition || 0) + (traits.determination || 0) + (traits.trust || 0),
    Forgiver: (traits.forgiveness || 0) + (traits.hope || 0) + (traits.love || 0),
    Protector: (traits.trust || 0) + (traits.loyalty || 0) + (traits.forgiveness || 0),
    Redeemer: (traits.regret || 0) + (traits.salvation || 0) + (traits.forgiveness || 0),
    Seeker: (traits.introspection || 0) + (traits.skepticism || 0) + (traits.selfdoubt || 0),
    Believer: (traits.hope || 0) + (traits.trust || 0) + (traits.love || 0)
  };

  const topArchetype = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  return topArchetype[0] || "Unknown";
}
