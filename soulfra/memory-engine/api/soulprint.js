// /memory-engine/api/soulprint.js
import updateSoulprint from '../../routes/updateSoulprint';

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { user_id, trait_deltas } = req.body;
    const updatedTraits = await updateSoulprint(user_id, trait_deltas);

    return res.status(200).json({ message: 'Soulprint updated.', updatedTraits });
  } catch (error) {
    console.error('Soulprint update error:', error.message);
    return res.status(500).json({ message: 'Failed to update soulprint.' });
  }
}
