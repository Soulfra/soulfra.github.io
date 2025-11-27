// /memory-engine/services/grantPrestige.js

export function grantPrestige(user) {
  if (!user) {
    throw new Error('Missing user for prestige grant.');
  }

  const updatedUser = { ...user };

  // Sacred prestige rules
  const prestigeThreshold = 5000; // Adjust based on sacred emotional balance

  if ((updatedUser.totalXP || 0) >= prestigeThreshold) {
    updatedUser.prestige = (updatedUser.prestige || 0) + 1;
    updatedUser.totalXP = 0; // Reset XP after prestige upgrade
  }

  return updatedUser;
}