// /memory-engine/api/archetype-score.js
import supabase from '../utils/supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { user_id, archetype } = req.body;

  if (!user_id || !archetype) {
    return res.status(400).json({ message: 'Missing user_id or archetype.' });
  }

  try {
    const { data, error } = await supabase
      .from('soulprints')
      .update({ archetype })
      .eq('user_id', user_id);

    if (error) {
      console.error('Error saving archetype:', error.message);
      return res.status(500).json({ message: 'Failed to save archetype.' });
    }

    return res.status(200).json({ message: 'Archetype saved successfully.' });
  } catch (error) {
    console.error('Unexpected server error:', error.message);
    return res.status(500).json({ message: 'Unexpected error.' });
  }
}