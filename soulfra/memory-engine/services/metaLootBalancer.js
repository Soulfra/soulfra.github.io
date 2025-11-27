// /memory-engine/services/metaLootBalancer.js

export async function adjustLootRates({ averageDailyRituals }) {
  if (typeof averageDailyRituals !== 'number') {
    throw new Error('Missing or invalid average daily rituals for loot adjustment.');
  }

  const lootAdjustments = {};

  if (averageDailyRituals > 100) {
    lootAdjustments.rareLootBoost = true;
    lootAdjustments.commonLootDropRate = 0.45;
  } else if (averageDailyRituals > 50) {
    lootAdjustments.commonLootDropRate = 0.50;
  } else {
    lootAdjustments.commonLootDropRate = 0.55;
  }

  console.log('Adjusted sacred loot economy:', lootAdjustments);

  return lootAdjustments;
}