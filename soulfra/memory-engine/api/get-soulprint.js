// /memory-engine/api/get-soulprint.js
import supabase from '../utils/supabaseClient.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: 'Missing user_id.' });
  }

  try {
    const { data, error } = await supabase
      .from('soulprints')
      .select('traits')
      .eq('user_id', user_id)
      .single();

    if (error) {
      console.error('Error fetching soulprint:', error.message);
      return res.status(500).json({ message: 'Failed to fetch soulprint.' });
    }

    if (!data) {
      return res.status(404).json({ message: 'Soulprint not found.' });
    }

    return res.status(200).json({ traits: data.traits });
  } catch (error) {
    console.error('Unexpected error:', error.message);
    return res.status(500).json({ message: 'Unexpected server error.' });
  }
}