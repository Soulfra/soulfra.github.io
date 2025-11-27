import supabase from '../utils/supabaseClient.js';

export default async function updateSoulprint(userId, traitDeltas) {
  try {
    const { data, error } = await supabase
      .from('soulprints')
      .upsert([{ user_id: userId, traits: traitDeltas }], { onConflict: ['user_id'] });

    if (error) {
      console.error('Error updating soulprint:', error.message);
      throw error;
    }

    return data;
  } catch (err) {
    console.error('Error updating soulprint:', err.message);
    throw err;
  }
}