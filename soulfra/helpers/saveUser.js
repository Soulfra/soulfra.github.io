// /soulfra/helpers/saveUser.js

const { supabase } = require('./supabaseClient');

/**
 * Save an updated user object back to Supabase.
 * 
 * @param {object} user - Updated user object
 * @returns {Promise<boolean>} - Success true/false
 */
async function saveUser(user) {
  if (!user || !user.id) throw new Error('Missing user or user ID in saveUser.');

  const { error } = await supabase
    .from('users')
    .update(user)
    .eq('id', user.id);

  if (error) {
    console.error('Error saving user:', error);
    return false;
  }

  return true;
}

module.exports = {
  saveUser
};