// /soulfra/xp/prestigeManager.js

/**
 * Soulforge a user: Reset XP, grant Prestige, boost traits permanently.
 * 
 * @param {object} user - User object to prestige
 * @returns {object} - Updated user
 */
async function soulforgeUser(user) {
  if (user.soulfra_level < 99) {
    throw new Error('Cannot Soulforge - not at Level 99 yet.');
  }

  // Reset core stats
  user.soulfra_xp = 0;
  user.soulfra_level = 1;
  user.prestige_count = (user.prestige_count || 0) + 1;

  // Optional: Apply passive buffs based on prestige_count
  // Example: +2% XP gain per prestige
  user.passive_xp_buff = (user.passive_xp_buff || 0) + 0.02;

  return user;
}

module.exports = {
  soulforgeUser
};