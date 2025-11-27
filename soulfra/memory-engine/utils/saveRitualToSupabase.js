// saveRitualToSupabase.js
import supabase from './supabaseClient.js';

export async function saveRitualToSupabase(arweaveTxId, transcript, ritualId) {
  const { data, error } = await supabase.from('rituals').insert([{
    id: ritualId,
    arweave_tx_id: arweaveTxId,
    transcript: transcript,
    completed: true,
    timestamp: new Date().toISOString()
  }]);

  if (error) {
    throw new Error('Failed to save ritual to Supabase: ' + error.message);
  }

  return data;
}
