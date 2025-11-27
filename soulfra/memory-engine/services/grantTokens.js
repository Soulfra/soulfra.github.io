// /services/grantTokens.js

export function grantTokens(user, xpAmount) {
  if (!user || typeof xpAmount !== 'number') {
    throw new Error('Missing user or invalid XP for token grant.');
  }

  const updatedUser = { ...user };
  const tokenMultiplier = 0.5; // 1 XP = 0.5 tokens
  const tokensAwarded = Math.floor(xpAmount * tokenMultiplier);

  updatedUser.tokens = (updatedUser.tokens || 0) + tokensAwarded;

  return updatedUser;
}