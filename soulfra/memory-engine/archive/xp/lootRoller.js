async function triggerSoulforge(user) {
  if (user.soulfra_level < 99) {
    throw new Error('User has not reached Level 99 yet.');
  }

  user.soulfra_xp = 0;
  user.soulfra_level = 1;
  user.prestige_count = (user.prestige_count || 0) + 1;
  user.trait_xp = {}; // Optional reset or keep trait XP depending on rules

  return user;
}

module.exports = {
  triggerSoulforge
};