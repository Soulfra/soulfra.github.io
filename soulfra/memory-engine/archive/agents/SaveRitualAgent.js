// /soulfra/memory-engine/agents/SaveRitualAgent.js

const { supabase } = require('../../helpers/supabaseClient');

async function saveRitual(userId, ritualData) {
  if (!userId || !ritualData) throw new Error('Missing userId or ritualData.');

  const { data, error } = await supabase
    .from('rituals')
    .insert([{
      user_id: userId,
      type: ritualData.type || 'reflection',
      notes: ritualData.notes || '',
      traits_triggered: ritualData.traits || [],
      timestamp: ritualData.timestamp || new Date().toISOString(),
      additional_data: ritualData.additional_data || null,
      season_id: ritualData.season_id || null
    }]);

  if (error) {
    console.error('SaveRitualAgent error:', error);
    throw new Error('Failed to save ritual.');
  }

  return data;
}

module.exports = {
  saveRitual
};