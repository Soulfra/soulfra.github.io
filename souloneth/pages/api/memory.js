// /pages/api/memory.js
import supabase from '../../helpers/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const memoryPayload = req.body;

  const { data, error } = await supabase
    .from('memories')
    .insert([memoryPayload]);

  if (error) {
    return res.status(500).json({ message: 'Failed to save memory.', error: error.message });
  }

  return res.status(200).json({ message: 'Memory saved with emotional snapshot.', data });
}
