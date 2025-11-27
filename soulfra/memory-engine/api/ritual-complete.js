import supabase from '../utils/supabaseClient.js';
import updateSoulprint from '../routes/updateSoulprint.js';
import mapArchetype from '../utils/archetypeMapper.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { memoryPayload } = req.body;

  if (!memoryPayload || !memoryPayload.user_id || !memoryPayload.input_text) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const { data: memoryData, error: memoryError } = await supabase
      .from('memories')
      .insert([memoryPayload]);

    if (memoryError) {
      console.error('Memory save error:', memoryError.message);
      return res.status(500).json({ message: 'Failed to save memory.' });
    }

    await updateSoulprint(memoryPayload.user_id, memoryPayload.traits_detected || {});

    const determinedArchetype = mapArchetype(memoryPayload.traits_detected || {});
    await supabase
      .from('soulprints')
      .update({ archetype: determinedArchetype })
      .eq('user_id', memoryPayload.user_id);

    console.log('Ritual complete:', memoryPayload.user_id, 'Archetype:', determinedArchetype);

    return res.status(200).json({ message: 'Sacred ritual complete.', archetype: determinedArchetype });
  } catch (error) {
    console.error('Unexpected ritual error:', error.message);
    return res.status(500).json({ message: 'Unexpected ritual failure.' });
  }
}