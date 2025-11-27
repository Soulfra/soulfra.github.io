// /soulfra/xp/tokenManager.js

/**
 * Calculate base SoulfraTokens earned from XP.
 * 
 * @param {number} baseXP - Amount of XP earned
 * @returns {number} - Tokens earned
 */
function calculateTokensFromXP(baseXP) {
  return Math.floor(baseXP / 100); // 5 tokens per 500 XP by default
}

/**
 * Apply bonus multipliers if user has traits, prestige, events active.
 * 
 * @param {number} tokens - Base tokens calculated
 * @param {object} user - User object (for checking prestige, traits)
 * @returns {number} - Adjusted tokens
 */
function applyTokenBonuses(tokens, user) {
  let bonusMultiplier = 1.0;

  // Example bonus: +10% tokens if user prestige_count > 0
  if (user.prestige_count && user.prestige_count > 0) {
    bonusMultiplier += 0.10;
  }

  return Math.floor(tokens * bonusMultiplier);
}

module.exports = {
  calculateTokensFromXP,
  applyTokenBonuses
};