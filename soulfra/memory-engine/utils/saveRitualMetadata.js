// /utils/saveRitualMetadata.js
import supabase from './supabaseClient.js';

export async function saveRitualMetadata({ arweaveTxId, traits, transcript }) {
  const { error } = await supabase.from('rituals').insert([
    {
      arweave_tx_id: arweaveTxId,
      traits,
      transcript,
    }
  ]);

  if (error) {
    console.error('❌ Failed to save ritual to Supabase:', error);
    throw new Error('Failed to save ritual metadata.');
  }
}