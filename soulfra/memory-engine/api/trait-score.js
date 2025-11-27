// /soulfra/memory-engine/api/trait-score.js
import orchestrateRitual from '../../helpers/orchestrateRitual.js';
import traitScorerAgent from '../services/traitScorerAgent.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { ritual_name, input_text } = req.body;

  const orchestratedPayload = await orchestrateRitual(ritual_name, { input_text });
  const traits = await traitScorerAgent(orchestratedPayload.input_text);

  return res.status(200).json({ message: 'Traits scored', traits });
}