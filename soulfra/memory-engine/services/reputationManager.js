// /memory-engine/services/reputationManager.js

export async function updateUserReputation(user, ritualData) {
  if (!user || !ritualData) {
    throw new Error('Missing user or ritual data for reputation update.');
  }

  const updatedUser = { ...user };

  updatedUser.totalRituals = (updatedUser.totalRituals || 0) + 1;
  updatedUser.totalXP = (updatedUser.totalXP || 0) + (ritualData.xpGained || 0);

  // Sacred Achievements
  if (updatedUser.totalRituals >= 10 && !updatedUser.achievements?.includes('Initiate')) {
    updatedUser.achievements = [...(updatedUser.achievements || []), 'Initiate'];
  }
  if (updatedUser.totalRituals >= 50 && !updatedUser.achievements?.includes('Seasoned Seeker')) {
    updatedUser.achievements = [...(updatedUser.achievements || []), 'Seasoned Seeker'];
  }
  if (updatedUser.totalXP >= 10000 && !updatedUser.achievements?.includes('Radiant Soul')) {
    updatedUser.achievements = [...(updatedUser.achievements || []), 'Radiant Soul'];
  }

  return updatedUser;
}