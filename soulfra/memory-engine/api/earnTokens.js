// /soulfra/api/earnTokens.js

const { grantXP } = require('../xp/xpManager');
const { rollLootDrop } = require('../xp/lootRoller');
const { saveUser, fetchUser } = require('../helpers/db'); // Assuming you have basic user functions

module.exports = async function earnTokensHandler(req, res) {
  try {
    const { userId, baseXP = 500, triggeredTraits = [] } = req.body;

    const user = await fetchUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Grant XP and base tokens
    const { user: updatedUser } = await grantXP(user, baseXP, triggeredTraits);
    updatedUser.soulfra_tokens = (updatedUser.soulfra_tokens || 0) + Math.floor(baseXP / 100); // e.g., 5 tokens per 500 XP

    // Roll for loot
    const loot = rollLootDrop();
    if (loot) {
      updatedUser.loot_inventory = updatedUser.loot_inventory || [];
      updatedUser.loot_inventory.push(loot);
    }

    // Save user back to database
    await saveUser(updatedUser);

    res.status(200).json({ success: true, updatedUser, loot });
  } catch (error) {
    console.error('Error in earnTokens:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};