// /soulfra/helpers/saveRitual.js

const { supabase } = require('./supabaseClient'); // Assuming you have a Supabase client setup

/**
 * Save a completed ritual to the database.
 * 
 * @param {string} userId - ID of the user completing the ritual
 * @param {object} ritualData - Ritual details (reflection, notes, traits, timestamps, etc.)
 * @returns {Promise<object>} - Supabase response
 */
async function saveRitual(userId, ritualData) {
  if (!userId || !ritualData) {
    throw new Error('Missing userId or ritualData in saveRitual.');
  }

  const { data, error } = await supabase
    .from('rituals')
    .insert([{
      user_id: userId,
      type: ritualData.type || 'reflection',
      notes: ritualData.notes || '',
      traits_triggered: ritualData.traits || [],
      timestamp: ritualData.timestamp || new Date().toISOString(),
      additional_data: ritualData.additional_data || null
    }]);

  if (error) {
    console.error('Error saving ritual:', error);
    throw new Error('Failed to save ritual.');
  }

  return data;
}

module.exports = {
  saveRitual
};