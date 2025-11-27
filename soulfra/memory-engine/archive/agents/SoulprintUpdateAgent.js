// /soulfra/memory-engine/agents/SoulprintUpdateAgent.js

const { supabase } = require('../../helpers/supabaseClient');

async function updateSoulprint(userId, traits) {
  if (!userId || !traits) throw new Error('Missing userId or traits.');

  const { data: userSoulprint, error } = await supabase
    .from('soulprints')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    console.error('SoulprintUpdateAgent error:', error);
    throw new Error('Failed to fetch soulprint.');
  }

  const updatedTraits = { ...(userSoulprint.traits || {}) };

  for (const trait of Object.keys(traits)) {
    updatedTraits[trait] = (updatedTraits[trait] || 0) + 1;
  }

  const { error: updateError } = await supabase
    .from('soulprints')
    .update({ traits: updatedTraits })
    .eq('user_id', userId);

  if (updateError) {
    console.error('SoulprintUpdateAgent error updating:', updateError);
    throw new Error('Failed to update soulprint.');
  }

  return updatedTraits;
}

module.exports = {
  updateSoulprint
};