// /memory-engine/routes/orchestrateRitualCompletion.js (sacred modular update)

import { validateRitual } from '../services/RitualValidationAgent.js';
import { saveRitual } from '../services/SaveRitualAgent.js';
import traitScorerAgent from '../services/traitScorerAgent.js';
import updateSoulprint from '../routes/updateSoulprint.js';
import { grantXP } from '../services/grantXP.js';
import { grantTokens } from '../services/grantTokens.js';
import { grantLoot } from '../services/grantLoot.js';
import { applyReflectionBoost } from '../services/applyReflectionBoost.js';

export async function orchestrateRitualCompletion(userId, ritualData) {
  if (!userId || !ritualData) throw new Error('Missing userId or ritualData for orchestrator.');

  const validatedRitual = validateRitual(ritualData);
  const scoredTraits = await traitScorerAgent(validatedRitual.input_text || '');

  validatedRitual.traits = scoredTraits;
  await saveRitual(userId, validatedRitual);

  await updateSoulprint(userId, scoredTraits);

  let ritualSummary = {
    success: true,
    scoredTraits
  };

  // Reward Flow
  ritualSummary = grantXP(ritualSummary, 500);
  ritualSummary = applyReflectionBoost(ritualSummary, Object.keys(scoredTraits));
  ritualSummary = grantTokens(ritualSummary, 500);
  ritualSummary = grantLoot(ritualSummary);

  return ritualSummary;
}