// /memory-engine/services/grantLoot.js

export function grantLoot(user) {
  if (!user) {
    throw new Error('Missing user for loot grant.');
  }

  const lootTable = [
    { item: 'Shard of Reflection', chance: 0.05 },
    { item: 'Memory Crystal', chance: 0.15 },
    { item: 'Fragment of Hope', chance: 0.25 },
    { item: 'Common Soul Dust', chance: 0.55 }
  ];

  const lootRoll = Math.random();
  let cumulativeChance = 0;
  let awardedLoot = 'Common Soul Dust'; // Fallback

  for (const loot of lootTable) {
    cumulativeChance += loot.chance;
    if (lootRoll <= cumulativeChance) {
      awardedLoot = loot.item;
      break;
    }
  }

  const updatedUser = { ...user };
  updatedUser.lastLoot = awardedLoot;

  return { user: updatedUser, loot: awardedLoot };
}