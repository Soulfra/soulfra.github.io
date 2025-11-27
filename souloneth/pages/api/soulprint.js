// /pages/api/soulprint.js
import supabase from '../../helpers/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { user_id, trait_deltas } = req.body;

    if (!user_id || !trait_deltas) {
      return res.status(400).json({ message: 'Missing user_id or trait_deltas' });
    }

    // Fetch existing soulprint
    const { data: existingSoulprint, error: fetchError } = await supabase
      .from('soulprints')
      .select('traits')
      .eq('user_id', user_id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching soulprint:', fetchError.message);
      return res.status(500).json({ message: 'Failed to fetch soulprint.' });
    }

    let updatedTraits = existingSoulprint?.traits || {};

    // Update traits
    for (const trait in trait_deltas) {
      updatedTraits[trait] = (updatedTraits[trait] || 0) + trait_deltas[trait];
    }

    // Upsert updated soulprint
    const { data, error } = await supabase
      .from('soulprints')
      .upsert([
        {
          user_id: user_id,
          traits: updatedTraits,
          last_update: new Date().toISOString(),
        }
      ], { onConflict: ['user_id'] });

    if (error) {
      console.error('Error updating soulprint:', error.message);
      return res.status(500).json({ message: 'Failed to update soulprint.' });
    }

    console.log('Soulprint updated for:', user_id);

    return res.status(200).json({ message: 'Soulprint updated', updatedSoulprint: data });
  } catch (error) {
    console.error('Unexpected error in soulprint update:', error.message);
    return res.status(500).json({ message: 'Unexpected server error.' });
  }
}