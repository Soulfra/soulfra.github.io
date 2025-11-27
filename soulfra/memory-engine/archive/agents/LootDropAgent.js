// /soulfra/memory-engine/agents/LootDropAgent.js

const { rollLootDrop } = require('../../xp/lootRoller');

function grantLoot(user) {
  if (!user) throw new Error('No user provided to grantLoot.');

  const loot = rollLootDrop();
  if (loot) {
    user.loot_inventory = user.loot_inventory || [];
    user.loot_inventory.push(loot);
  }

  return { user, loot };
}

module.exports = {
  grantLoot
};