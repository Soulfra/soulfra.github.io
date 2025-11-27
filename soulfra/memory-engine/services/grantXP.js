// /services/grantXP.js

export function grantXP(user, xpAmount) {
    if (!user || typeof xpAmount !== 'number') {
      throw new Error('Missing user or invalid XP amount.');
    }
  
    const updatedUser = { ...user };
    updatedUser.xp = (updatedUser.xp || 0) + xpAmount;
  
    // Optional: Check if level up needed
    const levelUpThreshold = 1000; // Adjust threshold later if needed
    while (updatedUser.xp >= levelUpThreshold) {
      updatedUser.level = (updatedUser.level || 1) + 1;
      updatedUser.xp -= levelUpThreshold;
    }
  
    return updatedUser;
  }