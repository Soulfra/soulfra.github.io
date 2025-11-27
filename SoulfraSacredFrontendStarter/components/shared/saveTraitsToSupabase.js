import { supabase } from "@sacred-components/supabaseClient";

export async function saveTraitsToSupabase(ritualId, traits) {
  const { data, error } = await supabase.from('ritual_traits').insert([{
    ritual_id: ritualId,
    traits: traits,
    timestamp: new Date().toISOString()
  }]);

  if (error) {
    console.error("Error saving traits:", error);
  } else {
    console.log("Traits saved:", data);
  }
}
