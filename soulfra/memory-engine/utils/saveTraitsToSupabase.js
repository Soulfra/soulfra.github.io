// saveTraitsToSupabase.js
import supabase from './supabaseClient.js';

export async function saveTraitsToSupabase(ritualId, traitsArray) {
  const { data, error } = await supabase.from('ritual_traits').insert([{
    ritual_id: ritualId,
    traits: traitsArray,
    timestamp: new Date().toISOString()
  }]);

  if (error) {
    throw new Error('Failed to save traits to Supabase: ' + error.message);
  }

  return data;
}
