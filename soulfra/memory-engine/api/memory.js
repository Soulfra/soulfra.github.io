// /memory-engine/api/memory.js
import supabase from '../utils/supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const memoryPayload = req.body;

  const { data, error } = await supabase
    .from('memories')
    .insert([memoryPayload]);

  if (error) {
    console.error('Memory save error:', error.message);
    return res.status(500).json({ message: 'Failed to save memory.', error: error.message });
  }

  return res.status(200).json({ message: 'Memory saved successfully.', data });
}