// /memory-engine/services/arenaRewardManager.js

export async function assignArenaRewards(user) {
  if (!user || !user.bracket) {
    throw new Error('Missing user or bracket for reward assignment.');
  }

  const rewards = {
    'Top 5': 'Legendary Soul Chest',
    'Top 25': 'Epic Soul Chest',
    'Top 100': 'Rare Soul Chest',
    'Unranked': 'Common Soul Chest'
  };

  return {
    ...user,
    arenaReward: rewards[user.bracket] || 'Common Soul Chest'
  };
}