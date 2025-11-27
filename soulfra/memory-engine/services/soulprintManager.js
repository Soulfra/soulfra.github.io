// soulprintManager.js
import supabase from '../../helpers/supabaseClient';
import formatTimestamp from '../../helpers/formatTimestamp';

async function soulprintManager(userId, traitDeltas) {
    const { data: existingSoulprint, error: fetchError } = await supabase
        .from('soulprints')
        .select('traits')
        .eq('user_id', userId)
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching soulprint:', fetchError.message);
        throw new Error(fetchError.message);
    }

    let updatedTraits = existingSoulprint ? existingSoulprint.traits : {};

    for (const trait in traitDeltas) {
        updatedTraits[trait] = (updatedTraits[trait] || 0) + traitDeltas[trait];
    }

    const { data, error } = await supabase
        .from('soulprints')
        .upsert([
            {
                user_id: userId,
                traits: updatedTraits,
                last_update: formatTimestamp()
            }
        ], { onConflict: ['user_id'] });

    if (error) {
        console.error('Error updating soulprint:', error.message);
        throw new Error(error.message);
    }

    console.log('Soulprint updated with Supabase:', data);
    return data;
}

export default soulprintManager;
