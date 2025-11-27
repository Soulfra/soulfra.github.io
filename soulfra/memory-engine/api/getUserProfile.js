// /soulfra/memory-engine/api/getUserProfile.js

const { fetchUser } = require('../../helpers/fetchUser');

/**
 * API handler to return user profile data for frontend.
 */
module.exports = async function getUserProfileHandler(req, res) {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }

    const user = await fetchUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Only return safe fields
    const userProfile = {
      id: user.id,
      username: user.username,
      soulfra_xp: user.soulfra_xp,
      soulfra_level: user.soulfra_level,
      soulfra_tokens: user.soulfra_tokens,
      loot_inventory: user.loot_inventory,
      trait_xp: user.trait_xp
    };

    res.status(200).json({ success: true, userProfile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};