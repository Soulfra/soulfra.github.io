// /soulfra/memory-engine/api/claimSeasonReward.js

const { fetchUser, saveUser } = require('../../helpers/fetchUser');
const { determineSeasonRewards } = require('../arena/rewardManager');
const { getCurrentSeasonId } = require('../arena/currentSeasonManager');

module.exports = async function claimSeasonRewardHandler(req, res) {
  try {
    const { userId, bracket } = req.body;

    if (!userId || !bracket) {
      return res.status(400).json({ success: false, message: 'Missing userId or bracket.' });
    }

    const user = await fetchUser(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Check if already claimed this season
    const seasonId = getCurrentSeasonId();
    user.claimed_seasons = user.claimed_seasons || [];
    if (user.claimed_seasons.includes(seasonId)) {
      return res.status(400).json({ success: false, message: 'Already claimed this season.' });
    }

    // Award rewards
    const rewards = determineSeasonRewards(bracket);
    user.loot_inventory = user.loot_inventory || [];
    user.loot_inventory.push(...rewards);

    // Mark season as claimed
    user.claimed_seasons.push(seasonId);

    await saveUser(user);

    res.status(200).json({ success: true, rewards });
  } catch (error) {
    console.error('Error claiming season reward:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};