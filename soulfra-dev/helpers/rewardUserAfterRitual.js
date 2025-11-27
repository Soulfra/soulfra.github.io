// /souloneth/helpers/rewardUserAfterRitual.js

import axios from 'axios';

/**
 * Reward the user after completing a ritual.
 * Handles XP gains, token rewards, and potential loot drops.
 * 
 * @param {string} userId - The ID of the user to reward
 * @param {Array<string>} triggeredTraits - The traits triggered during the ritual
 * @param {number} [baseXP=500] - Base XP earned from the ritual
 * @returns {Object|null} - Returns reward details or null if error
 */
export async function rewardUserAfterRitual(userId, triggeredTraits = [], baseXP = 500) {
  if (!userId) {
    console.error('No userId provided to rewardUserAfterRitual');
    return null;
  }

  try {
    const response = await axios.post('/api/earnTokens', {
      userId,
      baseXP,
      triggeredTraits,
    });

    if (response.data.success) {
      const { updatedUser, loot } = response.data;

      console.log('🎉 Ritual reward successful!', {
        tokensEarned: Math.floor(baseXP / 100),
        loot,
      });

      return {
        tokensEarned: Math.floor(baseXP / 100),
        loot,
        updatedUser,
      };
    } else {
      console.error('Failed to reward user:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error during rewardUserAfterRitual call:', error);
    return null;
  }
}