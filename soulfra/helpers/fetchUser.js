// /soulfra/helpers/fetchUser.js

const { supabase } = require('./supabaseClient');

/**
 * Fetch a user from Supabase based on their ID.
 * 
 * @param {string} userId - User's ID
 * @returns {Promise<object|null>} - User object or null
 */
async function fetchUser(userId) {
  if (!userId) throw new Error('Missing userId in fetchUser.');

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return data;
}

module.exports = {
  fetchUser
};